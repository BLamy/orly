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

    # ------------------------------------------------------------------
    # Feed-Voreinstellungen (Browser-Oberfläche)
    # ------------------------------------------------------------------
    @property
    def feed_profiles(self) -> int:
        """Wie viele Abos beim Öffnen in den Feed geladen werden (0 = alle)."""
        raw = self._db.get_setting("feed_profiles", "10")
        try:
            return max(0, int(raw))  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return 10

    @feed_profiles.setter
    def feed_profiles(self, value: int) -> None:
        self._db.set_setting("feed_profiles", str(max(0, int(value))))

    @property
    def feed_per(self) -> int:
        """Wie viele der neuesten Beiträge je Profil im Feed erscheinen."""
        raw = self._db.get_setting("feed_per", "3")
        try:
            return max(1, int(raw))  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return 3

    @feed_per.setter
    def feed_per(self, value: int) -> None:
        self._db.set_setting("feed_per", str(max(1, int(value))))

    # ------------------------------------------------------------------
    # Automatischer Zeitplan (Browser-Server)
    # ------------------------------------------------------------------
    @property
    def schedule_enabled(self) -> bool:
        return self._db.get_setting("schedule_enabled", "0") == "1"

    @schedule_enabled.setter
    def schedule_enabled(self, value: bool) -> None:
        self._db.set_setting("schedule_enabled", "1" if value else "0")

    @property
    def schedule_times(self) -> list[str]:
        """Uhrzeiten (HH:MM), zu denen automatisch heruntergeladen wird."""
        raw = self._db.get_setting("schedule_times", "12:00,00:00") or ""
        out: list[str] = []
        for part in raw.split(","):
            t = self._normalize_time(part)
            if t and t not in out:
                out.append(t)
        return out

    @schedule_times.setter
    def schedule_times(self, times) -> None:
        norm = []
        for part in times:
            t = self._normalize_time(str(part))
            if t and t not in norm:
                norm.append(t)
        self._db.set_setting("schedule_times", ",".join(norm))

    @staticmethod
    def _normalize_time(value: str) -> str:
        """Wandelt "9:5", "09:05", " 24:00 " → "HH:MM" (oder "" bei ungültig).

        "24:00" wird als Mitternacht "00:00" interpretiert.
        """
        value = (value or "").strip()
        if not value or ":" not in value:
            return ""
        try:
            hh, mm = value.split(":", 1)
            hour, minute = int(hh), int(mm)
        except ValueError:
            return ""
        if hour == 24 and minute == 0:
            hour = 0
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return ""
        return f"{hour:02d}:{minute:02d}"

    @property
    def schedule_per(self) -> int:
        """Wie viele der neuesten Beiträge je Konto der Zeitplan lädt."""
        raw = self._db.get_setting("schedule_per", "3")
        try:
            return max(1, int(raw))  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return 3

    @schedule_per.setter
    def schedule_per(self, value: int) -> None:
        self._db.set_setting("schedule_per", str(max(1, int(value))))

    @property
    def schedule_last_run(self) -> str:
        return self._db.get_setting("schedule_last_run", "") or ""

    @schedule_last_run.setter
    def schedule_last_run(self, value: str) -> None:
        self._db.set_setting("schedule_last_run", value or "")

    @property
    def schedule_stories(self) -> bool:
        """Ob der Zeitplan auch die aktuellen Stories mitlädt."""
        return self._db.get_setting("schedule_stories", "0") == "1"

    @schedule_stories.setter
    def schedule_stories(self, value: bool) -> None:
        self._db.set_setting("schedule_stories", "1" if value else "0")

    # ------------------------------------------------------------------
    # Weitere Download-Optionen
    # ------------------------------------------------------------------
    @property
    def save_captions(self) -> bool:
        """Ob zu jedem Beitrag die Bildunterschrift als .txt gespeichert wird."""
        return self._db.get_setting("save_captions", "0") == "1"

    @save_captions.setter
    def save_captions(self, value: bool) -> None:
        self._db.set_setting("save_captions", "1" if value else "0")

