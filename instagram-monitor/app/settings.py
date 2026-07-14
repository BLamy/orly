"""
Einstellungsverwaltung.
=======================

Dünne, typsichere Schicht über der ``settings``-Tabelle der Datenbank.
Alle Einstellungen werden persistent gespeichert und überleben damit
einen Neustart der Anwendung.

Aktuell verwaltete Einstellungen:

  check_interval_minutes – Prüfintervall in Minuten (Standard: 5)
  download_dir           – Zielordner für heruntergeladene Inhalte
  posts_per_check        – wie viele der neuesten Beiträge pro Prüfung
                           betrachtet werden (Standard: 12 – entspricht
                           etwa einer Profilseite)
"""

from __future__ import annotations

import logging
from pathlib import Path

from .database import Database

logger = logging.getLogger(__name__)

# Untergrenze für das Prüfintervall. Häufigere Abfragen bringen keinen
# Mehrwert und würden die Server unnötig belasten – die Anwendung soll
# sich ausdrücklich rücksichtsvoll verhalten.
MIN_INTERVAL_MINUTES = 1
DEFAULT_INTERVAL_MINUTES = 5
DEFAULT_POSTS_PER_CHECK = 12


class Settings:
    """Typsichere Zugriffe auf die persistierten Anwendungseinstellungen."""

    def __init__(self, db: Database, default_download_dir: str) -> None:
        self._db = db
        self._default_download_dir = default_download_dir

    # ------------------------------------------------------------------
    # Prüfintervall
    # ------------------------------------------------------------------
    @property
    def check_interval_minutes(self) -> int:
        """Prüfintervall in Minuten (mindestens MIN_INTERVAL_MINUTES)."""
        raw = self._db.get_setting(
            "check_interval_minutes", str(DEFAULT_INTERVAL_MINUTES)
        )
        try:
            value = int(raw)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            logger.warning(
                "Ungültiges Prüfintervall %r in der Datenbank – Standard %d wird verwendet.",
                raw,
                DEFAULT_INTERVAL_MINUTES,
            )
            value = DEFAULT_INTERVAL_MINUTES
        return max(MIN_INTERVAL_MINUTES, value)

    @check_interval_minutes.setter
    def check_interval_minutes(self, minutes: int) -> None:
        minutes = max(MIN_INTERVAL_MINUTES, int(minutes))
        self._db.set_setting("check_interval_minutes", str(minutes))
        logger.info("Prüfintervall auf %d Minute(n) gesetzt.", minutes)

    # ------------------------------------------------------------------
    # Download-Verzeichnis
    # ------------------------------------------------------------------
    @property
    def download_dir(self) -> Path:
        """Zielordner für Downloads (wird bei Bedarf angelegt).

        Ist der gespeicherte Pfad nicht (mehr) nutzbar – z. B. entfernter
        USB-Stick, entzogene Schreibrechte –, fällt die Anwendung auf den
        Standardordner zurück, statt beim Start oder Prüflauf abzustürzen.
        Der gespeicherte Wert bleibt erhalten, falls der Pfad später
        wieder verfügbar ist.
        """
        raw = self._db.get_setting("download_dir", self._default_download_dir)
        path = Path(raw or self._default_download_dir)
        try:
            path.mkdir(parents=True, exist_ok=True)
            return path
        except OSError as exc:
            logger.warning(
                "Download-Ordner %s ist nicht nutzbar (%s) – der "
                "Standardordner wird verwendet.",
                path,
                exc,
            )
            fallback = Path(self._default_download_dir)
            fallback.mkdir(parents=True, exist_ok=True)
            return fallback

    @download_dir.setter
    def download_dir(self, path: str | Path) -> None:
        self._db.set_setting("download_dir", str(path))
        logger.info("Download-Ordner geändert: %s", path)

    # ------------------------------------------------------------------
    # Beiträge pro Prüfung
    # ------------------------------------------------------------------
    @property
    def posts_per_check(self) -> int:
        """Wie viele der neuesten Beiträge pro Prüflauf betrachtet werden."""
        raw = self._db.get_setting("posts_per_check", str(DEFAULT_POSTS_PER_CHECK))
        try:
            return max(1, int(raw))  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return DEFAULT_POSTS_PER_CHECK

    # ------------------------------------------------------------------
    # Angemeldetes Konto
    # ------------------------------------------------------------------
    @property
    def login_username(self) -> str:
        """Benutzername des zuletzt angemeldeten Kontos ("" wenn keiner).

        Es wird ausschließlich der Benutzername gespeichert – niemals das
        Passwort. Die eigentliche Anmeldung liegt als Cookie-Session-Datei
        im Datenverzeichnis.
        """
        return self._db.get_setting("login_username", "") or ""

    @login_username.setter
    def login_username(self, username: str) -> None:
        self._db.set_setting("login_username", username or "")
