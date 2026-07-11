"""
Logging-Konfiguration.
======================

Richtet drei Ausgabekanäle ein:

  1. **Rotierende Log-Datei** (``logs/app.log``, max. 1 MB, 5 Backups) –
     für die Fehlersuche im Nachhinein.
  2. **Konsole** (stderr) – praktisch beim Start aus dem Terminal.
  3. **GUI-Log-Fenster** – über einen eigenen Handler, der formatierte
     Log-Zeilen als Ereignis in die GUI-Queue legt. Die GUI hängt sie im
     Haupt-Thread an ihr Textfeld an (Tkinter-Widgets dürfen nie aus
     fremden Threads verändert werden!).
"""

from __future__ import annotations

import logging
import queue
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Einheitliches Format für Datei und Konsole.
_FILE_FORMAT = "%(asctime)s  %(levelname)-8s  %(name)s: %(message)s"
# Kompakteres Format für das GUI-Fenster (Platz ist dort knapp).
_GUI_FORMAT = "%(asctime)s  %(levelname)s  %(message)s"
_GUI_DATEFMT = "%H:%M:%S"


class QueueLogHandler(logging.Handler):
    """Log-Handler, der formatierte Zeilen in die GUI-Ereignis-Queue legt."""

    def __init__(self, event_queue: "queue.Queue") -> None:
        super().__init__()
        self._queue = event_queue

    def emit(self, record: logging.LogRecord) -> None:
        try:
            self._queue.put_nowait({"type": "log", "line": self.format(record)})
        except Exception:
            # Logging darf die Anwendung niemals zum Absturz bringen.
            self.handleError(record)


def setup_logging(log_file: Path, event_queue: "queue.Queue | None" = None) -> None:
    """Konfiguriert das Root-Logging der gesamten Anwendung.

    ``event_queue`` ist optional: Die Desktop-GUI übergibt ihre
    Ereignis-Queue (Log-Zeilen erscheinen im Fenster); die Web-Oberfläche
    kommt ohne aus – dann gibt es nur Datei- und Konsolen-Logging.
    """
    log_file.parent.mkdir(parents=True, exist_ok=True)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)  # Handler filtern selbst feiner.

    # --- 1. rotierende Datei -----------------------------------------
    file_handler = RotatingFileHandler(
        log_file, maxBytes=1_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(_FILE_FORMAT))
    root.addHandler(file_handler)

    # --- 2. Konsole ----------------------------------------------------
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(_FILE_FORMAT))
    root.addHandler(console_handler)

    # --- 3. GUI-Fenster (über die Ereignis-Queue, nur Desktop-App) -------
    if event_queue is not None:
        gui_handler = QueueLogHandler(event_queue)
        gui_handler.setLevel(logging.INFO)
        gui_handler.setFormatter(logging.Formatter(_GUI_FORMAT, datefmt=_GUI_DATEFMT))
        root.addHandler(gui_handler)

    # Fremdbibliotheken (instaloader, urllib3 …) sind auf DEBUG sehr
    # gesprächig – auf WARNING begrenzen, damit das Log lesbar bleibt.
    for noisy in ("urllib3", "instaloader", "PIL"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
