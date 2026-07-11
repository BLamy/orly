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
from collections import OrderedDict
from typing import TYPE_CHECKING

import requests as _requests
from flask import Flask, jsonify, render_template, request, Response

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


def create_app(
    db: "Database", settings: "Settings", downloader: "InstagramDownloader"
) -> Flask:
    """Erzeugt die Flask-Anwendung mit allen Endpunkten."""
    app = Flask(__name__)

    # Zuletzt geholte Beiträge: shortcode → PostInfo (LRU-artig begrenzt).
    cache: "OrderedDict[str, PostInfo]" = OrderedDict()

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

    @app.post("/api/logout")
    def logout():
        downloader.logout()
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
                    "downloaded": db.is_downloaded(p.shortcode, username),
                }
                for p in items
            ],
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
