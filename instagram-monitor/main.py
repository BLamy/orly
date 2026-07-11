"""
Einstiegspunkt der Instagram-Monitor-Anwendung.
=================================================

Startet die Anwendung:

    python main.py

Aufgaben dieses Moduls:
  1. Verzeichnisse anlegen (Daten, Logs, Downloads)
  2. Logging konfigurieren (Datei + Konsole + GUI-Log-Fenster)
  3. Alle Komponenten verdrahten (Datenbank, Einstellungen,
     Downloader, Monitor, GUI)
  4. Beim Beenden sauber aufräumen (Monitor stoppen, DB schließen)

Die eigentliche Logik liegt bewusst in den Modulen unter ``app/``:

  app/database.py       – SQLite-Persistenz (Konten, Beiträge, Einstellungen)
  app/settings.py       – typsichere Zugriffe auf die Einstellungen
  app/downloader.py     – Zugriff auf ÖFFENTLICHE Instagram-Inhalte (Instaloader)
  app/monitor.py        – Hintergrund-Thread, der die Konten regelmäßig prüft
  app/notifier.py       – Desktop-Benachrichtigungen (optional, via plyer)
  app/logging_setup.py  – Logging-Konfiguration inkl. GUI-Handler
  app/gui.py            – die CustomTkinter-Oberfläche
"""

from __future__ import annotations

import logging
import queue
import sys
from pathlib import Path

from app.database import Database
from app.downloader import InstagramDownloader
from app.gui import App
from app.logging_setup import setup_logging
from app.monitor import AccountMonitor
from app.notifier import Notifier
from app.settings import Settings

# Basisverzeichnis des Projekts (Ordner, in dem main.py liegt).
# Alle Pfade werden relativ hierzu aufgelöst, damit die Anwendung
# unabhängig vom aktuellen Arbeitsverzeichnis funktioniert.
BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"          # SQLite-Datenbank
LOG_DIR = BASE_DIR / "logs"           # Log-Dateien
DOWNLOAD_DIR = BASE_DIR / "downloads" # Standard-Zielordner für Downloads

logger = logging.getLogger(__name__)


def main() -> int:
    """Baut die Anwendung zusammen und startet die GUI-Hauptschleife."""

    # ------------------------------------------------------------------
    # 1. Verzeichnisse sicherstellen
    # ------------------------------------------------------------------
    for directory in (DATA_DIR, LOG_DIR, DOWNLOAD_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 2. Ereignis-Warteschlange
    # ------------------------------------------------------------------
    # Der Monitor läuft in einem Hintergrund-Thread. Tkinter-Widgets
    # dürfen aber NUR aus dem Haupt-Thread verändert werden. Deshalb
    # kommuniziert der Monitor ausschließlich über diese thread-sichere
    # Queue mit der GUI; die GUI liest sie zyklisch per ``after()`` aus.
    event_queue: queue.Queue = queue.Queue()

    # ------------------------------------------------------------------
    # 3. Logging (Datei + Konsole + GUI über die Queue)
    # ------------------------------------------------------------------
    setup_logging(LOG_DIR / "app.log", event_queue)
    logger.info("Anwendung startet …")

    # ------------------------------------------------------------------
    # 4. Kernkomponenten verdrahten
    # ------------------------------------------------------------------
    db = Database(DATA_DIR / "monitor.db")
    settings = Settings(db, default_download_dir=str(DOWNLOAD_DIR))
    downloader = InstagramDownloader(settings)
    notifier = Notifier()
    monitor = AccountMonitor(
        db=db,
        downloader=downloader,
        settings=settings,
        notifier=notifier,
        event_queue=event_queue,
    )

    # ------------------------------------------------------------------
    # 5. GUI starten (blockiert bis zum Schließen des Fensters)
    # ------------------------------------------------------------------
    app = App(db=db, settings=settings, monitor=monitor, event_queue=event_queue)
    try:
        app.mainloop()
    finally:
        # Sauber herunterfahren, egal wie die Hauptschleife endet.
        logger.info("Anwendung wird beendet – Monitor wird gestoppt …")
        if monitor.shutdown(timeout=30):
            # Die Datenbank erst schließen, wenn der Worker-Thread wirklich
            # beendet ist – sonst könnten seine letzten Schreibzugriffe
            # (z. B. "Beitrag heruntergeladen") auf einer geschlossenen
            # Verbindung landen und verloren gehen.
            db.close()
        else:
            logger.warning(
                "Datenbank wird nicht geschlossen, da der Überwachungs-"
                "Thread noch läuft – das Prozessende räumt auf. (Jede "
                "Änderung wird ohnehin sofort committet, es geht nichts "
                "verloren.)"
            )
        logger.info("Auf Wiedersehen.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
