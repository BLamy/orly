"""
Lokale Web-Oberfläche (Flask).
==============================

Stellt eine Browser-Oberfläche bereit, die sich wie ein Instagram-Feed
anfühlt: Konto eingeben → Beiträge als Bilder-Raster ansehen → einzelne
Fotos/Videos per Klick herunterladen.

WICHTIG: Das ist bewusst KEINE öffentliche Webseite. Der Server bindet
sich nur an 127.0.0.1 (localhost) und ist damit ausschließlich vom
eigenen Rechner erreichbar. Unter der Haube arbeitet derselbe
Instaloader-Unterbau wie in der Desktop-App – mit denselben Grundsätzen
(öffentliche Profile bzw. eigener Login, keine Umgehung von
Zugriffsbeschränkungen, Rate-Limits werden respektiert).

Endpunkte:
  GET  /                    – die Oberfläche (index.html)
  GET  /api/status          – Anmeldestatus + Download-Ordner
  POST /api/login           – Anmeldung (JSON: username, password, code?)
  POST /api/logout          – Abmeldung
  GET  /api/posts           – neueste Beiträge eines Kontos (?username=&count=)
  GET  /thumb/<shortcode>   – Vorschaubild-Proxy (umgeht Hotlink-Probleme)
  POST /api/download        – einen Beitrag herunterladen (JSON: shortcode)
"""

from __future__ import annotations

import logging
import threading
import time
from collections import OrderedDict
from typing import TYPE_CHECKING, Optional
from urllib.parse import quote

import requests as _requests
from flask import (
    Flask,
    jsonify,
    make_response,
    redirect,
    render_template,
    request,
    Response,
)

from .downloader import (
    DownloaderError,
    LoginError,
    PostInfo,
    ProfileIsPrivate,
    ProfileNotFound,
    TemporaryError,
    TwoFactorRequired,
)
from .util import extract_username

if TYPE_CHECKING:
    from .database import Database
    from .downloader import InstagramDownloader
    from .settings import Settings

logger = logging.getLogger(__name__)

# Wie viele zuletzt angezeigte Beiträge im Speicher gehalten werden
# (für Vorschaubild-Proxy und Download ohne erneute Netzanfrage).
_CACHE_SIZE = 500

# Obergrenze für die Anzahl abrufbarer Beiträge pro Anfrage.
_MAX_COUNT = 100

# Pause zwischen zwei Konten beim Massen-Download (Sekunden) – rücksichtsvoll
# gegenüber den Instagram-Servern.
_BULK_DELAY = 4.0

# Pause zwischen zwei Profilen beim Feed-Aufbau (Sekunden). Kürzer als beim
# Download, damit der Feed zügig erscheint, aber immer noch rücksichtsvoll.
_FEED_DELAY = 1.5


class _FeedJob:
    """Baut fortlaufend den Abo-Feed auf (Beiträge mehrerer Profile)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None
        self.cancel = False
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.running = False
            self.cancel = False
            self.total = 0          # Anzahl Profile
            self.done = 0           # fertige Profile
            self.current = ""       # gerade geladenes Profil
            self.items: list[dict] = []   # gesammelte Beiträge (JSON-fertig)
            self.finished = False
            self.error = ""

    def add_items(self, new_items: list[dict]) -> None:
        with self._lock:
            self.items.extend(new_items)

    def snapshot(self, include_items: bool = True) -> dict:
        with self._lock:
            data = {
                "running": self.running,
                "total": self.total,
                "done": self.done,
                "current": self.current,
                "finished": self.finished,
                "error": self.error,
                "count": len(self.items),
            }
            if include_items:
                # Neueste zuerst – über alle Profile hinweg.
                data["items"] = sorted(
                    self.items, key=lambda x: x.get("posted_at", ""), reverse=True
                )
            return data

    def update(self, **kwargs) -> None:
        with self._lock:
            for key, value in kwargs.items():
                setattr(self, key, value)


class _BulkJob:
    """Fortschritts-Zustand des Massen-Downloads (thread-sicher)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None
        self.cancel = False
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.running = False
            self.cancel = False
            self.total = 0          # Anzahl Konten
            self.done = 0           # fertige Konten
            self.current = ""       # gerade bearbeitetes Konto
            self.downloaded = 0     # gespeicherte Beiträge gesamt
            self.finished = False
            self.error = ""

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "running": self.running,
                "total": self.total,
                "done": self.done,
                "current": self.current,
                "downloaded": self.downloaded,
                "finished": self.finished,
                "error": self.error,
            }

    def update(self, **kwargs) -> None:
        with self._lock:
            for key, value in kwargs.items():
                setattr(self, key, value)


def create_app(
    db: "Database",
    settings: "Settings",
    downloader: "InstagramDownloader",
    access_key: Optional[str] = None,
) -> Flask:
    """Erzeugt die Flask-Anwendung mit allen Endpunkten.

    ``access_key`` schützt den Zugriff, wenn die Seite über das Netzwerk
    (Handy im WLAN) erreichbar ist: Ohne gültigen Code gibt es nur eine
    Hinweisseite. Zugriffe von localhost (dem PC selbst) sind immer
    erlaubt. Ist ``access_key`` None, gibt es keinen Schutz (reiner
    localhost-Betrieb).
    """
    app = Flask(__name__)

    # Zuletzt geholte Beiträge: shortcode → PostInfo (LRU-artig begrenzt).
    cache: "OrderedDict[str, PostInfo]" = OrderedDict()

    # ------------------------------------------------------------------
    # Zugangsschutz (nur aktiv, wenn ein access_key gesetzt ist)
    # ------------------------------------------------------------------
    _COOKIE = "igmon_key"

    def _is_local(addr: str | None) -> bool:
        return addr in ("127.0.0.1", "::1", None)

    @app.before_request
    def _guard():
        if not access_key:
            return None  # kein Schutz im reinen localhost-Betrieb
        if _is_local(request.remote_addr):
            return None  # der PC selbst darf immer
        # Code per URL (?key=…) übergeben → als Cookie merken und sauber
        # weiterleiten (damit der Code nicht in jeder URL steht).
        provided = request.args.get("key")
        if provided and provided == access_key:
            resp = redirect(request.path or "/")
            resp.set_cookie(_COOKIE, access_key, max_age=30 * 24 * 3600,
                            samesite="Lax")
            return resp
        if request.cookies.get(_COOKIE) == access_key:
            return None
        # Kein gültiger Code → freundliche Hinweisseite (403).
        return Response(
            "<h2>Zugangscode nötig</h2><p>Diese Seite ist geschützt. Bitte "
            "die vollständige Adresse inklusive <code>?key=…</code> "
            "verwenden, die im PC-Fenster angezeigt wird.</p>",
            status=403,
            mimetype="text/html; charset=utf-8",
        )

    def remember(posts: list[PostInfo]) -> None:
        for post in posts:
            cache[post.shortcode] = post
            cache.move_to_end(post.shortcode)
        while len(cache) > _CACHE_SIZE:
            cache.popitem(last=False)

    def post_json(post: PostInfo, username: str) -> dict:
        """Serialisiert einen Beitrag für die Oberfläche (Feed & Einzelansicht)."""
        return {
            "shortcode": post.shortcode,
            "username": username,
            "type": post.post_type,
            "posted_at": post.posted_at,
            "url": post.url,
            "caption": post.caption,
            # Vorschaubild über unseren Proxy, nicht direkt vom CDN.
            "thumb": f"/thumb/{post.shortcode}" if post.thumbnail_url else "",
            # Direkter Geräte-Download (streamt an Handy/Browser).
            "media": f"/media/{post.shortcode}",
            "downloaded": db.is_downloaded(post.shortcode, username),
        }

    # ------------------------------------------------------------------
    # Oberfläche
    # ------------------------------------------------------------------
    @app.get("/")
    def index():
        return render_template("index.html")

    # ------------------------------------------------------------------
    # Status & Anmeldung
    # ------------------------------------------------------------------
    @app.get("/api/status")
    def status():
        return jsonify(
            logged_in=downloader.is_logged_in,
            user=downloader.logged_in_user or "",
            download_dir=str(settings.download_dir),
        )

    @app.post("/api/login")
    def login():
        data = request.get_json(force=True, silent=True) or {}
        username = (data.get("username") or "").strip().lstrip("@")
        password = data.get("password") or ""
        code = (data.get("code") or "").strip()
        try:
            downloader.login(
                username,
                password,
                two_factor_provider=(lambda: code) if code else None,
            )
        except TwoFactorRequired:
            # Kein Fehler: Die Oberfläche blendet daraufhin das Code-Feld ein.
            return jsonify(needs_2fa=True), 401
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        return jsonify(ok=True, user=downloader.logged_in_user or "")

    @app.post("/api/import-session")
    def import_session():
        data = request.get_json(force=True, silent=True) or {}
        browser = (data.get("browser") or "").strip() or None
        try:
            user = downloader.import_browser_session(browser)
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        return jsonify(ok=True, user=user)

    @app.post("/api/login-sessionid")
    def login_sessionid():
        data = request.get_json(force=True, silent=True) or {}
        sessionid = data.get("sessionid") or ""
        try:
            user = downloader.login_with_sessionid(sessionid)
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        return jsonify(ok=True, user=user)

    @app.post("/api/logout")
    def logout():
        downloader.logout()
        return jsonify(ok=True)

    # ------------------------------------------------------------------
    # Abonnements (wem du folgst) + Massen-Download
    # ------------------------------------------------------------------
    bulk = _BulkJob()

    # Profilbild-URLs der Abos: username → CDN-URL (für den Avatar-Proxy).
    avatar_urls: dict[str, str] = {}

    @app.get("/api/following")
    def following():
        try:
            details = downloader.following_details()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        accounts = []
        for item in details:
            if item.get("pic"):
                avatar_urls[item["username"]] = item["pic"]
            accounts.append({
                "username": item["username"],
                "full_name": item.get("full_name", ""),
                "avatar": f"/avatar/{item['username']}" if item.get("pic") else "",
            })
        return jsonify(count=len(accounts), accounts=accounts)

    @app.get("/avatar/<username>")
    def avatar(username: str):
        url = avatar_urls.get(username)
        if not url:
            return Response(status=404)
        try:
            upstream = _requests.get(url, timeout=20,
                                     headers={"User-Agent": "Mozilla/5.0"})
            upstream.raise_for_status()
        except Exception:
            return Response(status=502)
        return Response(
            upstream.content,
            mimetype=upstream.headers.get("Content-Type", "image/jpeg"),
            headers={"Cache-Control": "private, max-age=3600"},
        )

    @app.post("/api/download-following")
    def download_following():
        if bulk.snapshot()["running"]:
            return jsonify(error="Es läuft bereits ein Massen-Download."), 409
        data = request.get_json(force=True, silent=True) or {}
        try:
            per_account = max(1, min(_MAX_COUNT, int(data.get("count", 3))))
        except (TypeError, ValueError):
            per_account = 3
        # Optionaler Datumsfilter: nur Beiträge ab diesem Tag (YYYY-MM-DD).
        since = (data.get("since") or "").strip()[:10]

        # Ausgewählte Konten (falls angegeben), sonst alle Abos.
        selected = data.get("usernames")
        if isinstance(selected, list) and selected:
            usernames = [str(u).strip().lstrip("@").lower()
                         for u in selected if str(u).strip()]
        else:
            try:
                usernames = downloader.following_usernames()
            except LoginError as exc:
                return jsonify(error=str(exc)), 401
            except DownloaderError as exc:
                return jsonify(error=str(exc)), 502
        if not usernames:
            return jsonify(error="Keine Konten ausgewählt."), 400

        bulk.reset()
        bulk.update(running=True, total=len(usernames))

        def worker():
            downloaded_total = 0
            try:
                for index, username in enumerate(usernames):
                    if bulk.cancel:
                        break
                    bulk.update(current=username)
                    try:
                        posts = downloader.list_recent_posts(username, per_account)
                    except DownloaderError as exc:
                        logger.warning("Massen-Download @%s übersprungen: %s",
                                       username, exc)
                        bulk.update(done=index + 1)
                        continue
                    for post in posts:
                        if bulk.cancel:
                            break
                        # Datumsfilter: alte Beiträge überspringen.
                        if since and (post.posted_at or "")[:10] < since:
                            continue
                        # Dedup: bereits heruntergeladene NICHT erneut laden.
                        if db.is_downloaded(post.shortcode, username):
                            continue
                        db.add_post(post.shortcode, username, post.post_type,
                                    post.posted_at)
                        try:
                            if downloader.download_post(post):
                                db.mark_downloaded(post.shortcode, username)
                                downloaded_total += 1
                                bulk.update(downloaded=downloaded_total)
                        except DownloaderError as exc:
                            logger.warning("Beitrag %s nicht geladen: %s",
                                           post.shortcode, exc)
                    bulk.update(done=index + 1)
                    # Rücksichtsvolle Pause zwischen den Konten.
                    if index < len(usernames) - 1 and not bulk.cancel:
                        time.sleep(_BULK_DELAY)
            except Exception:
                logger.exception("Massen-Download abgebrochen (Fehler).")
                bulk.update(error="Unerwarteter Fehler – siehe logs/web.log.")
            finally:
                bulk.update(running=False, finished=True)
                logger.info("Massen-Download beendet: %d Beitrag/Beiträge "
                            "gespeichert.", downloaded_total)

        thread = threading.Thread(target=worker, name="bulk-download", daemon=True)
        bulk.thread = thread
        thread.start()
        return jsonify(ok=True, total=len(usernames))

    @app.post("/api/download-stories")
    def download_stories():
        if bulk.snapshot()["running"]:
            return jsonify(error="Es läuft bereits ein Download."), 409
        data = request.get_json(force=True, silent=True) or {}
        username = extract_username(data.get("username", ""))
        kind = data.get("kind", "stories")
        if kind not in ("stories", "highlights"):
            kind = "stories"
        if not username:
            return jsonify(error="Bitte einen gültigen Benutzernamen eingeben."), 400
        try:
            items = downloader.list_story_items(username, kind)
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        if not items:
            return jsonify(ok=True, total=0)

        bulk.reset()
        bulk.update(running=True, total=len(items), current=username)

        def worker():
            downloaded = 0
            try:
                for index, item in enumerate(items):
                    if bulk.cancel:
                        break
                    if db.is_downloaded(item.shortcode, username):
                        bulk.update(done=index + 1)
                        continue
                    db.add_post(item.shortcode, username, item.post_type,
                                item.posted_at)
                    try:
                        if downloader.download_story_item(item):
                            db.mark_downloaded(item.shortcode, username)
                            downloaded += 1
                            bulk.update(downloaded=downloaded)
                    except DownloaderError as exc:
                        logger.warning("Story %s nicht geladen: %s",
                                       item.shortcode, exc)
                    bulk.update(done=index + 1)
            except Exception:
                logger.exception("Story-Download abgebrochen (Fehler).")
                bulk.update(error="Unerwarteter Fehler – siehe logs/web.log.")
            finally:
                bulk.update(running=False, finished=True)
                logger.info("Story-Download @%s beendet: %d Element(e).",
                            username, downloaded)

        thread = threading.Thread(target=worker, name="story-download", daemon=True)
        bulk.thread = thread
        thread.start()
        return jsonify(ok=True, total=len(items))

    @app.get("/api/download-following/status")
    def download_following_status():
        return jsonify(bulk.snapshot())

    @app.post("/api/download-following/cancel")
    def download_following_cancel():
        bulk.update(cancel=True)
        return jsonify(ok=True)

    # ------------------------------------------------------------------
    # Abo-Feed (beim Öffnen automatisch: neueste Beiträge deiner Abos)
    # ------------------------------------------------------------------
    feed = _FeedJob()

    @app.get("/api/feed/settings")
    def feed_get_settings():
        return jsonify(profiles=settings.feed_profiles, per=settings.feed_per)

    @app.post("/api/feed/start")
    def feed_start():
        if not downloader.is_logged_in:
            return jsonify(error="Bitte zuerst anmelden, um den Abo-Feed zu "
                                 "sehen."), 401
        if feed.snapshot(include_items=False)["running"]:
            return jsonify(error="Der Feed wird bereits geladen."), 409
        data = request.get_json(force=True, silent=True) or {}
        try:
            profiles = max(0, int(data.get("profiles", settings.feed_profiles)))
        except (TypeError, ValueError):
            profiles = settings.feed_profiles
        try:
            per = max(1, min(_MAX_COUNT, int(data.get("per", settings.feed_per))))
        except (TypeError, ValueError):
            per = settings.feed_per
        # Wahl merken (gilt beim nächsten Öffnen).
        settings.feed_profiles = profiles
        settings.feed_per = per

        try:
            usernames = downloader.following_usernames()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        if profiles > 0:
            usernames = usernames[:profiles]
        if not usernames:
            return jsonify(ok=True, total=0)

        feed.reset()
        feed.update(running=True, total=len(usernames))

        def worker():
            try:
                for index, username in enumerate(usernames):
                    if feed.cancel:
                        break
                    feed.update(current=username)
                    try:
                        posts = downloader.list_recent_posts(username, per)
                    except DownloaderError as exc:
                        logger.warning("Feed @%s übersprungen: %s", username, exc)
                        feed.update(done=index + 1)
                        continue
                    remember(posts)
                    feed.add_items([post_json(p, username) for p in posts])
                    feed.update(done=index + 1)
                    if index < len(usernames) - 1 and not feed.cancel:
                        time.sleep(_FEED_DELAY)
            except Exception:
                logger.exception("Feed-Aufbau fehlgeschlagen.")
                feed.update(error="Unerwarteter Fehler – siehe logs/web.log.")
            finally:
                feed.update(running=False, finished=True)

        thread = threading.Thread(target=worker, name="feed-build", daemon=True)
        feed.thread = thread
        thread.start()
        return jsonify(ok=True, total=len(usernames))

    @app.get("/api/feed/status")
    def feed_status():
        return jsonify(feed.snapshot())

    @app.post("/api/feed/cancel")
    def feed_cancel():
        feed.update(cancel=True)
        return jsonify(ok=True)

    # ------------------------------------------------------------------
    # Beiträge ansehen
    # ------------------------------------------------------------------
    @app.get("/api/posts")
    def posts():
        username = extract_username(request.args.get("username", ""))
        if not username:
            return jsonify(error="Bitte einen gültigen Benutzernamen oder "
                                 "Profil-Link eingeben."), 400
        try:
            count = max(1, min(_MAX_COUNT, int(request.args.get("count", 12))))
        except ValueError:
            count = 12

        try:
            items = downloader.list_recent_posts(username, count)
        except ProfileIsPrivate as exc:
            return jsonify(error=str(exc)), 403
        except ProfileNotFound as exc:
            return jsonify(error=str(exc)), 404
        except TemporaryError as exc:
            return jsonify(error=str(exc)), 502
        except DownloaderError as exc:  # Sammelbecken
            return jsonify(error=str(exc)), 502

        remember(items)
        return jsonify(
            username=username,
            posts=[post_json(p, username) for p in items],
        )

    @app.get("/media/<shortcode>")
    def media(shortcode: str):
        """Streamt das Medium des Beitrags an das anfragende Gerät.

        So landet ein Download auf dem Handy tatsächlich auf dem Handy
        (Content-Disposition: attachment), statt im PC-Ordner. Bei einem
        Album wird über ?i=<n> das n-te Element gewählt (Standard: 0).
        """
        post = cache.get(shortcode)
        if post is None:
            return Response("Beitrag nicht bekannt – bitte neu laden.",
                            status=404)
        try:
            items = downloader.media_urls(post)
        except DownloaderError as exc:
            return Response(str(exc), status=502)
        if not items:
            return Response("Kein herunterladbares Medium gefunden.", status=404)
        try:
            index = max(0, min(len(items) - 1, int(request.args.get("i", 0))))
        except ValueError:
            index = 0
        url, filename = items[index]
        try:
            upstream = _requests.get(
                url, timeout=60, stream=True,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            upstream.raise_for_status()
        except Exception:
            logger.debug("Medium %s nicht ladbar.", shortcode, exc_info=True)
            return Response("Medium konnte nicht geladen werden.", status=502)
        return Response(
            upstream.iter_content(chunk_size=65536),
            mimetype=upstream.headers.get("Content-Type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"; "
                                       f"filename*=UTF-8''{quote(filename)}",
            },
        )

    @app.get("/thumb/<shortcode>")
    def thumb(shortcode: str):
        """Vorschaubild-Proxy.

        Lädt das Bild serverseitig von der beim Abruf gemerkten CDN-URL
        (KEINE vom Client wählbare URL – schützt vor Missbrauch als
        offener Proxy) und reicht es an den Browser durch.
        """
        post = cache.get(shortcode)
        if post is None or not post.thumbnail_url:
            return Response(status=404)
        try:
            upstream = _requests.get(
                post.thumbnail_url,
                timeout=20,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            upstream.raise_for_status()
        except Exception:
            logger.debug("Vorschaubild %s nicht ladbar.", shortcode, exc_info=True)
            return Response(status=502)
        return Response(
            upstream.content,
            mimetype=upstream.headers.get("Content-Type", "image/jpeg"),
            headers={"Cache-Control": "private, max-age=3600"},
        )

    # ------------------------------------------------------------------
    # Herunterladen
    # ------------------------------------------------------------------
    @app.post("/api/download")
    def download():
        data = request.get_json(force=True, silent=True) or {}
        shortcode = (data.get("shortcode") or "").strip()
        post = cache.get(shortcode)
        if post is None:
            return jsonify(error="Beitrag nicht (mehr) bekannt – bitte die "
                                 "Beiträge neu laden."), 404
        try:
            ok = downloader.download_post(post)
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        if ok:
            # Registrieren + als heruntergeladen markieren, damit auch die
            # Desktop-App den Beitrag nicht erneut lädt.
            db.add_post(post.shortcode, post.username, post.post_type, post.posted_at)
            db.mark_downloaded(post.shortcode, post.username)
        return jsonify(ok=bool(ok))

    return app
