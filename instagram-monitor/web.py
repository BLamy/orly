"""
Einstiegspunkt der Browser-Oberfläche.
======================================

Startet den lokalen Web-Server:

    python web.py

und öffnet automatisch den Browser unter http://127.0.0.1:8756/.

Der Server ist NUR vom eigenen Rechner erreichbar (127.0.0.1). Datenbank,
Einstellungen, Download-Ordner und die gespeicherte Anmeldung werden mit
der Desktop-App (main.py) geteilt – beide Oberflächen sind Ansichten auf
dieselben Daten. (Bitte nicht beide gleichzeitig laufen lassen.)
"""

from __future__ import annotations

import logging
import sys
import threading
import webbrowser
from pathlib import Path

from app.database import Database
from app.downloader import InstagramDownloader
from app.logging_setup import setup_logging
from app.settings import Settings
from app.web import create_app

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"
DOWNLOAD_DIR = BASE_DIR / "downloads"

HOST = "127.0.0.1"   # nur localhost – bewusst keine öffentliche Webseite
PORT = 8756

logger = logging.getLogger(__name__)


def main() -> int:
    for directory in (DATA_DIR, LOG_DIR, DOWNLOAD_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    setup_logging(LOG_DIR / "web.log")
    logger.info("Browser-Oberfläche startet …")

    db = Database(DATA_DIR / "monitor.db")
    settings = Settings(db, default_download_dir=str(DOWNLOAD_DIR))
    downloader = InstagramDownloader(settings, session_dir=DATA_DIR / "sessions")
    app = create_app(db, settings, downloader)

    url = f"http://{HOST}:{PORT}/"
    print(f"\n  Instagram Monitor läuft im Browser: {url}")
    print("  Beenden mit Strg+C in diesem Fenster.\n")
    # Browser kurz nach dem Serverstart öffnen (best effort).
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        # threaded=True: Vorschaubilder laden parallel; die Instaloader-
        # Zugriffe selbst serialisiert der Downloader über seinen Lock.
        app.run(host=HOST, port=PORT, threaded=True, debug=False)
    finally:
        db.close()
        logger.info("Browser-Oberfläche beendet.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
