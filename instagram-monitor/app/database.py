"""
SQLite-Persistenzschicht der Anwendung.
=======================================

Verwaltet drei Tabellen:

  accounts   – die überwachten Instagram-Konten inkl. Download-Option,
               Zeitpunkt der letzten Prüfung und Baseline-Status
  posts      – alle bekannten Beiträge pro Konto; verhindert doppelte
               Benachrichtigungen und doppelte Downloads und merkt sich
               fehlgeschlagene Downloads für spätere Wiederholungen.
               Primärschlüssel ist (shortcode, username): Collab-Beiträge
               erscheinen unter demselben Shortcode auf MEHREREN Profilen
               und werden pro überwachtem Konto einzeln geführt.
  settings   – Schlüssel/Wert-Paare für Anwendungseinstellungen

Thread-Sicherheit
-----------------
Die GUI (Haupt-Thread) und der Monitor (Hintergrund-Thread) greifen beide
auf die Datenbank zu. SQLite-Verbindungen sind standardmäßig an einen
Thread gebunden; deshalb wird die Verbindung mit
``check_same_thread=False`` geöffnet und JEDER Zugriff durch ein
``threading.Lock`` serialisiert. Bei der geringen Zugriffsfrequenz dieser
Anwendung ist das die einfachste und robusteste Lösung.
"""

from __future__ import annotations

import logging
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Optional

logger = logging.getLogger(__name__)

# DDL der posts-Tabelle – separat definiert, weil die Migration älterer
# Datenbanken (siehe _migrate) die Tabelle neu aufbauen können muss.
_POSTS_DDL = """
CREATE TABLE IF NOT EXISTS posts (
    shortcode        TEXT NOT NULL,               -- eindeutige Instagram-Kurz-ID des Beitrags
    username         TEXT NOT NULL,               -- zu welchem Konto der Beitrag gehört
    post_type        TEXT NOT NULL DEFAULT '',    -- z. B. "Reel", "Video/Reel", "Album", "Bild"
    posted_at        TEXT,                        -- Veröffentlichungszeitpunkt (ISO, UTC)
    discovered_at    TEXT NOT NULL,               -- wann die Anwendung den Beitrag entdeckt hat
    downloaded       INTEGER NOT NULL DEFAULT 0,  -- 1 = wurde erfolgreich heruntergeladen
    downloaded_at    TEXT,                        -- Zeitpunkt des Downloads
    download_pending INTEGER NOT NULL DEFAULT 0,  -- 1 = Download gewünscht, aber noch nicht gelungen
    PRIMARY KEY (shortcode, username)
)
"""

# Schema der Datenbank. Wird bei jedem Start ausgeführt (idempotent).
_SCHEMA = f"""
CREATE TABLE IF NOT EXISTS accounts (
    username         TEXT PRIMARY KEY,            -- Instagram-Benutzername (klein geschrieben)
    download_enabled INTEGER NOT NULL DEFAULT 0,  -- 1 = neue Beiträge automatisch herunterladen
    baseline_done    INTEGER NOT NULL DEFAULT 0,  -- 1 = Erstinventur der vorhandenen Beiträge abgeschlossen
    last_checked     TEXT,                        -- ISO-Zeitstempel der letzten erfolgreichen Prüfung
    last_error       TEXT,                        -- letzte Fehlermeldung (für die Anzeige in der GUI)
    added_at         TEXT NOT NULL                -- ISO-Zeitstempel, wann das Konto hinzugefügt wurde
);

{_POSTS_DDL};

CREATE INDEX IF NOT EXISTS idx_posts_username ON posts (username);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def _now() -> str:
    """Aktueller Zeitstempel als ISO-String (sekundengenau)."""
    return datetime.now().isoformat(timespec="seconds")


class Database:
    """Kapselt sämtliche Datenbankzugriffe der Anwendung."""

    def __init__(self, db_path: Path | str) -> None:
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

        # Ein Lock serialisiert alle Zugriffe (GUI-Thread + Monitor-Thread).
        self._lock = threading.Lock()

        # check_same_thread=False erlaubt die Nutzung aus mehreren Threads;
        # die Serialisierung übernimmt unser Lock.
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        with self._lock:
            self._migrate()
            self._conn.executescript(_SCHEMA)
            self._conn.commit()
        logger.debug("Datenbank geöffnet: %s", self._db_path)

    def _migrate(self) -> None:
        """Bringt ältere Datenbanken auf das aktuelle Schema (idempotent).

        ``CREATE TABLE IF NOT EXISTS`` ergänzt weder Spalten noch ändert es
        Primärschlüssel – deshalb hier explizit:
          1. Spalte ``download_pending`` nachrüsten.
          2. Alten Primärschlüssel (nur shortcode) durch den
             zusammengesetzten Schlüssel (shortcode, username) ersetzen
             (erfordert in SQLite einen Tabellen-Neuaufbau).
        Läuft bewusst VOR dem Schema-Skript: Bei einer frischen Datenbank
        existiert die Tabelle noch nicht und beide Schritte sind No-Ops.
        """
        # Schritt 1: fehlende Spalte ergänzen.
        try:
            self._conn.execute(
                "ALTER TABLE posts ADD COLUMN "
                "download_pending INTEGER NOT NULL DEFAULT 0"
            )
            logger.info("Datenbank-Migration: Spalte download_pending ergänzt.")
        except sqlite3.OperationalError:
            # Tabelle existiert nicht (frische DB) oder Spalte schon da.
            pass

        # Schritt 2: Primärschlüssel prüfen und ggf. Tabelle neu aufbauen.
        info = self._conn.execute("PRAGMA table_info(posts)").fetchall()
        pk_columns = [row["name"] for row in info if row["pk"]]
        if pk_columns == ["shortcode"]:
            logger.info(
                "Datenbank-Migration: posts-Tabelle wird auf den "
                "zusammengesetzten Schlüssel (shortcode, username) umgestellt."
            )
            self._conn.executescript(
                f"""
                ALTER TABLE posts RENAME TO posts_old;
                {_POSTS_DDL};
                INSERT OR IGNORE INTO posts
                    (shortcode, username, post_type, posted_at,
                     discovered_at, downloaded, downloaded_at, download_pending)
                SELECT shortcode, username, post_type, posted_at,
                       discovered_at, downloaded, downloaded_at, download_pending
                FROM posts_old;
                DROP TABLE posts_old;
                """
            )

    # ------------------------------------------------------------------
    # interne Helfer
    # ------------------------------------------------------------------
    def _execute(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        """Führt ein Statement unter dem Lock aus und committet sofort."""
        with self._lock:
            cursor = self._conn.execute(sql, tuple(params))
            self._conn.commit()
            return cursor

    def _query(self, sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
        """Führt eine Leseabfrage unter dem Lock aus."""
        with self._lock:
            return self._conn.execute(sql, tuple(params)).fetchall()

    # ------------------------------------------------------------------
    # Konten
    # ------------------------------------------------------------------
    def add_account(self, username: str) -> bool:
        """Fügt ein Konto hinzu.

        Rückgabe: True, wenn das Konto neu angelegt wurde,
                  False, wenn es bereits existierte.
        """
        username = username.strip().lstrip("@").lower()
        if not username:
            return False
        try:
            self._execute(
                "INSERT INTO accounts (username, added_at) VALUES (?, ?)",
                (username, _now()),
            )
            logger.info("Konto hinzugefügt: @%s", username)
            return True
        except sqlite3.IntegrityError:
            # Primary-Key-Verletzung → Konto existiert bereits.
            logger.info("Konto @%s ist bereits vorhanden.", username)
            return False

    def remove_account(self, username: str) -> None:
        """Entfernt ein Konto aus der Überwachung.

        Die bereits bekannten Beiträge (Tabelle ``posts``) bleiben bewusst
        erhalten: Wird das Konto später erneut hinzugefügt, verhindern sie,
        dass alte Beiträge noch einmal heruntergeladen werden.
        """
        self._execute("DELETE FROM accounts WHERE username = ?", (username,))
        logger.info("Konto entfernt: @%s", username)

    def get_accounts(self) -> list[sqlite3.Row]:
        """Alle überwachten Konten, alphabetisch sortiert."""
        return self._query("SELECT * FROM accounts ORDER BY username")

    def set_download_enabled(self, username: str, enabled: bool) -> None:
        """Schaltet den automatischen Download für ein Konto ein/aus."""
        self._execute(
            "UPDATE accounts SET download_enabled = ? WHERE username = ?",
            (1 if enabled else 0, username),
        )

    def mark_baseline_done(self, username: str) -> None:
        """Markiert die Erstinventur eines Kontos als abgeschlossen.

        Beim ersten Prüflauf werden alle bereits existierenden Beiträge nur
        registriert (Baseline), damit nicht der gesamte Verlauf des Kontos
        als "neu" gemeldet bzw. heruntergeladen wird.
        """
        self._execute(
            "UPDATE accounts SET baseline_done = 1 WHERE username = ?",
            (username,),
        )

    def update_last_checked(self, username: str, error: Optional[str] = None) -> None:
        """Speichert Zeitpunkt und Ergebnis (Fehlertext oder None) der Prüfung."""
        self._execute(
            "UPDATE accounts SET last_checked = ?, last_error = ? WHERE username = ?",
            (_now(), error, username),
        )

    # ------------------------------------------------------------------
    # Beiträge
    # ------------------------------------------------------------------
    def is_post_known(self, shortcode: str, username: str) -> bool:
        """Wurde dieser Beitrag für dieses Konto schon registriert?

        Bewusst pro Konto (nicht global): Collab-Beiträge tragen auf allen
        beteiligten Profilen denselben Shortcode und sollen für jedes
        überwachte Konto einzeln gemeldet/heruntergeladen werden.
        """
        rows = self._query(
            "SELECT 1 FROM posts WHERE shortcode = ? AND username = ?",
            (shortcode, username),
        )
        return bool(rows)

    def add_post(
        self,
        shortcode: str,
        username: str,
        post_type: str = "",
        posted_at: Optional[str] = None,
        download_pending: bool = False,
    ) -> None:
        """Registriert einen Beitrag als bekannt (noch nicht heruntergeladen).

        ``download_pending=True`` merkt den Beitrag für den automatischen
        Download vor; das Flag wird erst durch :meth:`mark_downloaded`
        gelöscht, sodass fehlgeschlagene Downloads bei späteren Prüfläufen
        automatisch erneut versucht werden.
        """
        self._execute(
            """
            INSERT OR IGNORE INTO posts
                (shortcode, username, post_type, posted_at, discovered_at,
                 download_pending)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                shortcode,
                username,
                post_type,
                posted_at,
                _now(),
                1 if download_pending else 0,
            ),
        )

    def mark_downloaded(self, shortcode: str, username: str) -> None:
        """Markiert einen Beitrag als erfolgreich heruntergeladen."""
        self._execute(
            """
            UPDATE posts
            SET downloaded = 1, downloaded_at = ?, download_pending = 0
            WHERE shortcode = ? AND username = ?
            """,
            (_now(), shortcode, username),
        )

    def get_pending_downloads(self, username: str) -> list[sqlite3.Row]:
        """Beiträge, deren gewünschter Download noch aussteht (älteste zuerst)."""
        return self._query(
            """
            SELECT shortcode, post_type, posted_at FROM posts
            WHERE username = ? AND download_pending = 1 AND downloaded = 0
            ORDER BY posted_at
            """,
            (username,),
        )

    def newest_posted_at(self, username: str) -> Optional[str]:
        """Veröffentlichungszeitpunkt des jüngsten bekannten Beitrags.

        Dient als Referenz, um alte Beiträge zu erkennen, die (z. B. durch
        An-/Abpinnen) wieder in das Sichtfenster der neuesten N Beiträge
        rücken: Sie sind älter als dieser Zeitpunkt und damit keine
        Neuveröffentlichungen. None, wenn noch kein Beitrag bekannt ist.
        """
        rows = self._query(
            "SELECT MAX(posted_at) AS newest FROM posts WHERE username = ?",
            (username,),
        )
        return rows[0]["newest"] if rows else None

    def download_count(self, username: str) -> int:
        """Anzahl der für dieses Konto heruntergeladenen Beiträge."""
        rows = self._query(
            "SELECT COUNT(*) AS n FROM posts WHERE username = ? AND downloaded = 1",
            (username,),
        )
        return int(rows[0]["n"]) if rows else 0

    # ------------------------------------------------------------------
    # Einstellungen (Schlüssel/Wert)
    # ------------------------------------------------------------------
    def get_setting(self, key: str, default: Optional[str] = None) -> Optional[str]:
        rows = self._query("SELECT value FROM settings WHERE key = ?", (key,))
        return rows[0]["value"] if rows else default

    def set_setting(self, key: str, value: str) -> None:
        self._execute(
            """
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )

    # ------------------------------------------------------------------
    # Lebenszyklus
    # ------------------------------------------------------------------
    def close(self) -> None:
        """Schließt die Datenbankverbindung."""
        with self._lock:
            self._conn.close()
        logger.debug("Datenbank geschlossen.")
