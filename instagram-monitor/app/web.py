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

    @app.get("/api/following")
    def following():
        try:
            names = downloader.following_usernames()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        return jsonify(count=len(names), usernames=names)

    @app.post("/api/download-following")
    def download_following():
        if bulk.snapshot()["running"]:
            return jsonify(error="Es läuft bereits ein Massen-Download."), 409
        data = request.get_json(force=True, silent=True) or {}
        try:
            per_account = max(1, min(_MAX_COUNT, int(data.get("count", 3))))
        except (TypeError, ValueError):
            per_account = 3

        # Zuerst die Abo-Liste holen (Fehler direkt zurückmelden).
        try:
            usernames = downloader.following_usernames()
        except LoginError as exc:
            return jsonify(error=str(exc)), 401
        except DownloaderError as exc:
            return jsonify(error=str(exc)), 502
        if not usernames:
            return jsonify(error="Du folgst keinem Konto."), 400

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

    @app.get("/api/download-following/status")
    def download_following_status():
        return jsonify(bulk.snapshot())

    @app.post("/api/download-following/cancel")
    def download_following_cancel():
        bulk.update(cancel=True)
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
            posts=[
                {
                    "shortcode": p.shortcode,
                    "type": p.post_type,
                    "posted_at": p.posted_at,
                    "url": p.url,
                    "caption": p.caption,
                    # Vorschaubild über unseren Proxy, nicht direkt vom CDN.
                    "thumb": f"/thumb/{p.shortcode}" if p.thumbnail_url else "",
                    # Direkter Geräte-Download (streamt an Handy/Browser).
                    "media": f"/media/{p.shortcode}",
                    "downloaded": db.is_downloaded(p.shortcode, username),
                }
                for p in items
            ],
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
