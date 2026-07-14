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

import datetime
import hashlib
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
    send_file,
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
        ptype = post.post_type or ""
        is_video = ("Video" in ptype) or ("Reel" in ptype)
        is_album = ptype.startswith("Album")
        return {
            "shortcode": post.shortcode,
            "username": username,
            "type": ptype,
            "is_video": is_video,
            "is_album": is_album,
            "posted_at": post.posted_at,
            "url": post.url,
            "caption": post.caption,
            "likes": getattr(post, "likes", 0),
            "comments": getattr(post, "comments", 0),
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

    def _avatar_url(item: dict) -> str:
        """Merkt sich die Profilbild-URL und liefert den Proxy-Pfad."""
        if item.get("pic"):
            avatar_urls[item["username"]] = item["pic"]
            return f"/avatar/{item['username']}"
        return ""

    @app.get("/api/me")
    def api_me():
        try:
            info = downloader.me()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        info = dict(info)
        info["avatar"] = _avatar_url(info)
        info.pop("pic", None)
        return jsonify(info)

    @app.get("/api/profile/<username>")
    def api_profile(username: str):
        uname = extract_username(username)
        if not uname:
            return jsonify(error="Ungültiger Benutzername."), 400
        try:
            info = downloader.profile_info(uname)
        except ProfileNotFound as exc:
            return jsonify(error=str(exc)), 404
        except ProfileIsPrivate as exc:
            return jsonify(error=str(exc)), 403
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        info = dict(info)
        info["avatar"] = _avatar_url(info)
        info.pop("pic", None)
        return jsonify(info)

    @app.get("/api/followers")
    def api_followers():
        try:
            details = downloader.followers_details(limit=300)
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        return jsonify(count=len(details), accounts=[{
            "username": d["username"], "full_name": d.get("full_name", ""),
            "avatar": _avatar_url(d),
        } for d in details])

    @app.get("/api/search")
    def api_search():
        query = request.args.get("q", "")
        try:
            results = downloader.search_profiles(query, limit=12)
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        return jsonify(results=[{
            "username": d["username"], "full_name": d.get("full_name", ""),
            "is_verified": d.get("is_verified", False), "avatar": _avatar_url(d),
        } for d in results])

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

    def start_bulk_job(usernames: list[str], per_account: int, since: str = "",
                       also_stories: bool = False) -> bool:
        """Startet den Massen-Download im Hintergrund (Endpunkt & Zeitplan).

        ``also_stories`` lädt je Konto zusätzlich die aktuellen Stories.
        Rückgabe: False, wenn bereits ein Download läuft.
        """
        if bulk.snapshot()["running"]:
            return False
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
                    # Optional: aktuelle Stories des Kontos mitladen.
                    if also_stories and not bulk.cancel:
                        try:
                            for item in downloader.list_story_items(username, "stories"):
                                if bulk.cancel:
                                    break
                                if db.is_downloaded(item.shortcode, username):
                                    continue
                                db.add_post(item.shortcode, username,
                                            item.post_type, item.posted_at)
                                if downloader.download_story_item(item):
                                    db.mark_downloaded(item.shortcode, username)
                                    downloaded_total += 1
                                    bulk.update(downloaded=downloaded_total)
                        except DownloaderError as exc:
                            logger.warning("Stories @%s übersprungen: %s",
                                           username, exc)
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
        return True

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

        if not start_bulk_job(usernames, per_account, since):
            return jsonify(error="Es läuft bereits ein Massen-Download."), 409
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
        # Seiten-Versatz für Endlos-Scroll (welche Profile-Seite laden).
        try:
            offset = max(0, int(data.get("offset", 0)))
        except (TypeError, ValueError):
            offset = 0
        # Wahl merken (gilt beim nächsten Öffnen); Versatz wird nicht gemerkt.
        settings.feed_profiles = profiles
        settings.feed_per = per

        try:
            all_usernames = downloader.following_usernames()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        followees_total = len(all_usernames)
        if profiles > 0:
            usernames = all_usernames[offset:offset + profiles]
        else:
            usernames = all_usernames[offset:]
        if not usernames:
            return jsonify(ok=True, total=0, followees_total=followees_total)

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
        return jsonify(ok=True, total=len(usernames),
                       followees_total=followees_total,
                       next_offset=offset + len(usernames))

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
        # ?inline=1 → im Browser anzeigen (Feed/Lightbox); sonst als Download
        # (Content-Disposition: attachment), damit "⤓ Gerät" wirklich speichert.
        headers = {"Cache-Control": "private, max-age=3600"}
        if request.args.get("inline") != "1":
            headers["Content-Disposition"] = (
                f"attachment; filename=\"{filename}\"; "
                f"filename*=UTF-8''{quote(filename)}"
            )
        return Response(
            upstream.iter_content(chunk_size=65536),
            mimetype=upstream.headers.get("Content-Type", "application/octet-stream"),
            headers=headers,
        )

    @app.get("/api/comments/<shortcode>")
    def comments(shortcode: str):
        post = cache.get(shortcode)
        if post is None:
            return jsonify(error="Beitrag nicht bekannt – bitte neu laden."), 404
        try:
            items = downloader.get_comments(post, limit=15)
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        return jsonify(comments=items)

    @app.get("/api/hashtag/<tag>")
    def hashtag(tag: str):
        try:
            count = max(1, min(_MAX_COUNT, int(request.args.get("count", 24))))
        except (TypeError, ValueError):
            count = 24
        try:
            items = downloader.hashtag_posts(tag, limit=count)
        except ProfileNotFound as exc:
            return jsonify(error=str(exc)), 404
        except TemporaryError as exc:
            return jsonify(error=str(exc)), 502
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        remember(items)
        return jsonify(tag=tag.strip().lstrip("#").lower(),
                       posts=[post_json(p, p.username) for p in items])

    @app.get("/api/album/<shortcode>")
    def album(shortcode: str):
        """Liefert die einzelnen Medien eines Albums (für das Karussell)."""
        post = cache.get(shortcode)
        if post is None:
            return jsonify(error="Beitrag nicht bekannt – bitte neu laden."), 404
        try:
            items = downloader.media_urls(post)
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        return jsonify(items=[
            {
                "i": index,
                "is_video": filename.lower().endswith(".mp4"),
                "media": f"/media/{shortcode}?i={index}&inline=1",
                "download": f"/media/{shortcode}?i={index}",
            }
            for index, (url, filename) in enumerate(items)
        ])

    @app.get("/api/stories")
    def stories_list():
        """Listet die aktuellen Story-Elemente eines Kontos (Story-Ansicht)."""
        if not downloader.is_logged_in:
            return jsonify(error="Für Stories ist eine Anmeldung nötig."), 401
        username = extract_username(request.args.get("username", ""))
        if not username:
            return jsonify(error="Bitte einen gültigen Benutzernamen eingeben."), 400
        try:
            items = downloader.list_story_items(username, "stories")
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        remember(items)
        return jsonify(username=username, items=[
            {
                "shortcode": p.shortcode,
                "is_video": ("Video" in (p.post_type or "")),
                "posted_at": p.posted_at,
                "media": f"/media/{p.shortcode}?inline=1",
                "download": f"/media/{p.shortcode}",
                "thumb": f"/thumb/{p.shortcode}" if p.thumbnail_url else "",
            }
            for p in items
        ])

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

    # ------------------------------------------------------------------
    # PWA: als App aufs Handy/den Desktop installierbar
    # ------------------------------------------------------------------
    _ICON_SVG = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#feda75"/><stop offset=".5" stop-color="#d62976"/>'
        '<stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs>'
        '<rect width="512" height="512" rx="112" fill="url(#g)"/>'
        '<path d="M256 168v120m0 0l-52-52m52 52l52-52" fill="none" stroke="#fff" '
        'stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>'
        '<rect x="160" y="320" width="192" height="26" rx="13" fill="#fff"/></svg>'
    )

    @app.get("/background")
    def background():
        """Liefert täglich ein anderes bereits heruntergeladenes Foto als
        Hintergrundbild (stabil pro Tag). 404, wenn noch nichts geladen ist."""
        root = settings.download_dir
        exts = {".jpg", ".jpeg", ".png", ".webp"}
        try:
            files = sorted(
                str(p) for p in root.rglob("*")
                if p.is_file() and p.suffix.lower() in exts
            )
        except Exception:
            files = []
        if not files:
            return Response(status=404)
        day = datetime.date.today().isoformat()
        idx = int(hashlib.md5(day.encode()).hexdigest(), 16) % len(files)
        try:
            return send_file(files[idx])
        except Exception:
            return Response(status=404)

    @app.get("/icon.svg")
    def icon_svg():
        return Response(_ICON_SVG, mimetype="image/svg+xml",
                        headers={"Cache-Control": "public, max-age=86400"})

    @app.get("/manifest.webmanifest")
    def manifest():
        return jsonify({
            "name": "Instagram Monitor",
            "short_name": "IG Monitor",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#000000",
            "theme_color": "#000000",
            "icons": [
                {"src": "/icon.svg", "sizes": "any", "type": "image/svg+xml",
                 "purpose": "any maskable"},
            ],
        })

    @app.get("/sw.js")
    def service_worker():
        # Minimaler Service-Worker: ermöglicht die Installation als App.
        # (Kein aggressives Caching, damit immer die aktuelle Version läuft.)
        js = (
            "self.addEventListener('install', e => self.skipWaiting());\n"
            "self.addEventListener('activate', e => self.clients.claim());\n"
            "self.addEventListener('fetch', e => {});\n"
        )
        return Response(js, mimetype="application/javascript",
                        headers={"Cache-Control": "no-cache"})

    # ------------------------------------------------------------------
    # Automatischer Zeitplan (täglich zu festen Uhrzeiten herunterladen)
    # ------------------------------------------------------------------
    @app.get("/api/health")
    def health():
        return jsonify(ok=True, logged_in=downloader.is_logged_in,
                       user=downloader.logged_in_user or "")

    @app.get("/api/downloads")
    def downloads_list():
        rows = db.recent_downloads(200)
        return jsonify(count=len(rows), items=[{
            "shortcode": r["shortcode"],
            "username": r["username"],
            "type": r["post_type"],
            "downloaded_at": r["downloaded_at"],
            "url": f"https://www.instagram.com/p/{r['shortcode']}/",
        } for r in rows])

    @app.get("/api/settings")
    def get_settings():
        return jsonify(save_captions=settings.save_captions,
                       download_dir=str(settings.download_dir))

    @app.post("/api/settings")
    def set_settings():
        data = request.get_json(force=True, silent=True) or {}
        if "save_captions" in data:
            settings.save_captions = bool(data["save_captions"])
        return jsonify(ok=True, save_captions=settings.save_captions)

    @app.get("/api/schedule")
    def get_schedule():
        return jsonify(
            enabled=settings.schedule_enabled,
            times=settings.schedule_times,
            per=settings.schedule_per,
            stories=settings.schedule_stories,
            last_run=settings.schedule_last_run,
        )

    @app.post("/api/schedule")
    def set_schedule():
        data = request.get_json(force=True, silent=True) or {}
        settings.schedule_enabled = bool(data.get("enabled"))
        settings.schedule_stories = bool(data.get("stories"))
        if "times" in data and isinstance(data["times"], list):
            settings.schedule_times = data["times"]
        if "per" in data:
            try:
                settings.schedule_per = max(1, min(_MAX_COUNT, int(data["per"])))
            except (TypeError, ValueError):
                pass
        return jsonify(
            ok=True,
            enabled=settings.schedule_enabled,
            times=settings.schedule_times,
            per=settings.schedule_per,
            stories=settings.schedule_stories,
        )

    def _scheduler_loop():
        """Prüft jede Minute, ob ein geplanter Download fällig ist."""
        fired: set[str] = set()   # Schlüssel "YYYY-MM-DD HH:MM" (kein Doppelstart)
        while True:
            try:
                if settings.schedule_enabled:
                    now = datetime.datetime.now()
                    hhmm = now.strftime("%H:%M")
                    if hhmm in settings.schedule_times:
                        key = now.strftime("%Y-%m-%d ") + hhmm
                        if key not in fired:
                            fired.add(key)
                            if len(fired) > 64:  # alte Marker gelegentlich aufräumen
                                fired = set(sorted(fired)[-16:])
                            _run_scheduled(now)
            except Exception:
                logger.exception("Zeitplan-Prüfung fehlgeschlagen.")
            time.sleep(20)

    def _run_scheduled(now: "datetime.datetime") -> None:
        if not downloader.is_logged_in:
            logger.warning(
                "Zeitplan %s: nicht angemeldet – Download übersprungen. "
                "Bitte in der Oberfläche anmelden.", now.strftime("%H:%M")
            )
            return
        try:
            usernames = downloader.following_usernames()
        except DownloaderError as exc:
            logger.warning("Zeitplan %s: Abo-Liste nicht abrufbar: %s",
                           now.strftime("%H:%M"), exc)
            return
        if not usernames:
            logger.info("Zeitplan %s: keine Abos.", now.strftime("%H:%M"))
            return
        if start_bulk_job(usernames, settings.schedule_per, "",
                          also_stories=settings.schedule_stories):
            settings.schedule_last_run = now.strftime("%Y-%m-%d %H:%M")
            logger.info("Zeitplan %s: automatischer Download von %d Konten "
                        "gestartet%s.", now.strftime("%H:%M"), len(usernames),
                        " (inkl. Stories)" if settings.schedule_stories else "")
        else:
            logger.info("Zeitplan %s: übersprungen (ein Download läuft bereits).",
                        now.strftime("%H:%M"))

    threading.Thread(target=_scheduler_loop, name="scheduler", daemon=True).start()

    return app
