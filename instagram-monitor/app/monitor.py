"""
Hintergrundüberwachung der Instagram-Konten.
============================================

:class:`AccountMonitor` betreibt einen Daemon-Thread, der in dem vom
Benutzer konfigurierten Intervall alle überwachten Konten durchgeht:

  1. neueste Beiträge des Profils abrufen (nur öffentliche Profile)
  2. unbekannte Beiträge in der Datenbank registrieren
  3. den Benutzer benachrichtigen (GUI-Ereignis + Desktop-Benachrichtigung)
  4. falls für das Konto aktiviert und zulässig: Beitrag herunterladen

Kommunikation mit der GUI
-------------------------
Der Thread fasst NIEMALS Tkinter-Widgets an. Stattdessen legt er
Ereignis-Dictionaries in eine thread-sichere ``queue.Queue``; die GUI
liest diese Queue zyklisch im Haupt-Thread aus. Ereignistypen:

  {"type": "status",          "running": bool}
  {"type": "account_checked", "username": str}
  {"type": "accounts_changed"}                       (Zähler/Zeiten neu laden)
  {"type": "new_post",        "post": PostInfo, "downloaded": bool}

Erstinventur (Baseline)
-----------------------
Beim allerersten Prüflauf eines Kontos werden die vorhandenen Beiträge
nur registriert, aber weder gemeldet noch heruntergeladen – sonst würde
beim Hinzufügen eines Kontos dessen gesamter sichtbarer Verlauf als
"neu" behandelt. Erst ab dem zweiten Lauf gilt: unbekannt = neu.
"""

from __future__ import annotations

import logging
import queue
import threading
from typing import TYPE_CHECKING

from .downloader import (
    DownloaderError,
    InstagramDownloader,
    PostInfo,
    ProfileIsPrivate,
    ProfileNotFound,
    TemporaryError,
)

if TYPE_CHECKING:
    from .database import Database
    from .notifier import Notifier
    from .settings import Settings

logger = logging.getLogger(__name__)

# Pause zwischen zwei Konten innerhalb eines Prüflaufs (Sekunden).
# Verteilt die Anfragen und verhält sich damit rücksichtsvoll gegenüber
# den Instagram-Servern.
DELAY_BETWEEN_ACCOUNTS = 5.0


class AccountMonitor:
    """Verwaltet den Überwachungs-Thread (Start/Stop/Sofortprüfung)."""

    def __init__(
        self,
        db: "Database",
        downloader: InstagramDownloader,
        settings: "Settings",
        notifier: "Notifier",
        event_queue: "queue.Queue",
    ) -> None:
        self._db = db
        self._downloader = downloader
        self._settings = settings
        self._notifier = notifier
        self._events = event_queue

        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()   # signalisiert: Thread beenden
        self._wake_event = threading.Event()   # signalisiert: sofort prüfen

    # ------------------------------------------------------------------
    # Lebenszyklus
    # ------------------------------------------------------------------
    @property
    def running(self) -> bool:
        """Läuft die Überwachung gerade?"""
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        """Startet den Überwachungs-Thread (idempotent)."""
        if self.running:
            if self._stop_event.is_set():
                # Stop wurde gerade erst angefordert; der alte Thread klingt
                # noch aus. Kurz auf sein Ende warten, dann neu starten.
                self._thread.join(timeout=10)
                if self._thread.is_alive():
                    logger.warning(
                        "Alter Überwachungs-Thread beendet sich nicht – "
                        "Start abgebrochen."
                    )
                    return
            else:
                logger.debug("Monitor läuft bereits – start() ignoriert.")
                return
        self._stop_event.clear()
        self._wake_event.clear()
        # daemon=True: Der Thread hält das Programmende nicht auf, falls
        # die Anwendung unerwartet beendet wird; regulär wird er über
        # stop() sauber beendet.
        self._thread = threading.Thread(
            target=self._run, name="account-monitor", daemon=True
        )
        self._thread.start()
        logger.info("Überwachung gestartet.")
        self._emit({"type": "status", "running": True})

    def stop(self, wait: bool = False) -> None:
        """Beendet den Überwachungs-Thread.

        wait=True blockiert, bis der Thread wirklich beendet ist (wird
        beim Schließen der Anwendung verwendet).
        """
        if not self.running:
            return
        self._stop_event.set()
        self._wake_event.set()  # eventuelle Wartephase sofort abbrechen
        if wait and self._thread is not None:
            self._thread.join(timeout=30)
        logger.info("Überwachung gestoppt.")
        self._emit({"type": "status", "running": False})

    def check_now(self) -> None:
        """Stößt außerplanmäßig einen sofortigen Prüflauf an."""
        if self.running:
            self._wake_event.set()
            logger.info("Sofortige Prüfung angefordert.")
        else:
            logger.info("Sofortige Prüfung nicht möglich – Überwachung ist gestoppt.")

    # ------------------------------------------------------------------
    # Hauptschleife des Hintergrund-Threads
    # ------------------------------------------------------------------
    def _run(self) -> None:
        """Endlosschleife: prüfen → Intervall warten → prüfen → …"""
        while not self._stop_event.is_set():
            # WICHTIG: Das Weck-Signal wird VOR dem Prüflauf zurückgesetzt,
            # nicht direkt vor dem Warten. Sonst gäbe es eine Race-Condition:
            # Ein stop()/check_now() zwischen clear() und wait() würde
            # verschluckt und der Thread hinge bis zum Intervallende fest.
            # So gilt: Jedes ab hier gesetzte Signal beendet das Warten sicher.
            self._wake_event.clear()

            try:
                self._check_all_accounts()
            except Exception:
                # Letzte Verteidigungslinie: Ein unerwarteter Fehler darf
                # den Thread nicht sterben lassen.
                logger.exception("Unerwarteter Fehler im Prüflauf.")

            if self._stop_event.is_set():
                break

            # Intervall abwarten – unterbrechbar durch stop()/check_now().
            interval_seconds = self._settings.check_interval_minutes * 60
            logger.info(
                "Nächste Prüfung in %d Minute(n).",
                self._settings.check_interval_minutes,
            )
            # Event.wait() kehrt entweder nach Ablauf des Timeouts zurück
            # oder sofort, wenn das Event gesetzt wird (Stop/Sofortprüfung).
            self._wake_event.wait(timeout=interval_seconds)

        # Ende der Schleife → Statusmeldung an die GUI.
        self._emit({"type": "status", "running": False})

    def _check_all_accounts(self) -> None:
        """Ein kompletter Prüflauf über alle überwachten Konten."""
        accounts = self._db.get_accounts()
        if not accounts:
            logger.info("Keine Konten in der Überwachung – nichts zu tun.")
            return

        logger.info("Prüflauf gestartet (%d Konto/Konten).", len(accounts))
        for index, account in enumerate(accounts):
            if self._stop_event.is_set():
                logger.info("Prüflauf abgebrochen (Stop angefordert).")
                return

            self._check_account(
                username=account["username"],
                download_enabled=bool(account["download_enabled"]),
                baseline_done=bool(account["baseline_done"]),
            )

            # Kurze Pause zwischen den Konten (nicht nach dem letzten).
            if index < len(accounts) - 1:
                self._stop_event.wait(timeout=DELAY_BETWEEN_ACCOUNTS)

        logger.info("Prüflauf abgeschlossen.")

    # ------------------------------------------------------------------
    # Prüfung eines einzelnen Kontos
    # ------------------------------------------------------------------
    def _check_account(
        self, username: str, download_enabled: bool, baseline_done: bool
    ) -> None:
        """Prüft ein Konto und behandelt alle erwartbaren Fehlerfälle."""
        logger.info("Prüfe @%s …", username)
        try:
            new_posts = self._downloader.fetch_new_posts(
                username, is_known=self._db.is_post_known
            )
        except ProfileIsPrivate as exc:
            # Kein Fehler im engeren Sinn: privates Profil wird respektiert.
            logger.warning(str(exc))
            self._db.update_last_checked(username, error="Profil ist privat")
            self._emit({"type": "account_checked", "username": username})
            return
        except ProfileNotFound as exc:
            logger.error(str(exc))
            self._db.update_last_checked(username, error="Profil nicht gefunden")
            self._emit({"type": "account_checked", "username": username})
            return
        except TemporaryError as exc:
            # Netzwerk/Drosselung: nur protokollieren; nächster Lauf versucht
            # es erneut. Keine aggressiven Sofort-Wiederholungen.
            logger.warning(str(exc))
            self._db.update_last_checked(username, error="Vorübergehender Fehler")
            self._emit({"type": "account_checked", "username": username})
            return
        except DownloaderError as exc:
            logger.error("Fehler bei @%s: %s", username, exc)
            self._db.update_last_checked(username, error=str(exc))
            self._emit({"type": "account_checked", "username": username})
            return

        if not baseline_done:
            # Erstinventur: vorhandene Beiträge nur registrieren.
            for post in new_posts:
                self._db.add_post(
                    post.shortcode, username, post.post_type, post.posted_at
                )
            self._db.mark_baseline_done(username)
            logger.info(
                "Erstinventur für @%s abgeschlossen (%d Beitrag/Beiträge "
                "registriert). Ab jetzt werden neue Beiträge gemeldet.",
                username,
                len(new_posts),
            )
        else:
            for post in new_posts:
                self._handle_new_post(post, download_enabled)
            if not new_posts:
                logger.info("@%s: keine neuen Beiträge.", username)

        self._db.update_last_checked(username, error=None)
        self._emit({"type": "account_checked", "username": username})

    def _handle_new_post(self, post: PostInfo, download_enabled: bool) -> None:
        """Registrieren → benachrichtigen → ggf. herunterladen."""
        # 1. Registrieren, BEVOR irgendetwas anderes passiert. Damit ist
        #    ein Doppel-Download selbst dann ausgeschlossen, wenn ein
        #    späterer Schritt fehlschlägt.
        self._db.add_post(post.shortcode, post.username, post.post_type, post.posted_at)

        # 2. Benachrichtigen (Log + GUI + Desktop).
        logger.info(
            "NEU: @%s hat ein neues %s veröffentlicht: %s",
            post.username,
            post.post_type,
            post.url,
        )
        self._notifier.notify(
            title=f"Neuer Beitrag von @{post.username}",
            message=f"{post.post_type} · {post.url}",
        )

        # 3. Optionaler Download.
        downloaded = False
        if download_enabled:
            try:
                downloaded = self._downloader.download_post(post)
                if downloaded:
                    self._db.mark_downloaded(post.shortcode)
            except DownloaderError as exc:
                # Download schlug fehl – der Beitrag bleibt registriert,
                # wird also nicht erneut gemeldet. Der Fehler wird nur
                # protokolliert; ein manueller Neuversuch ist über
                # "Konto entfernen + neu hinzufügen" bewusst nicht nötig,
                # da Instaloader beim nächsten vorhandenen Download
                # fehlende Dateien ergänzt.
                logger.error(str(exc))

        self._emit({"type": "new_post", "post": post, "downloaded": downloaded})

    # ------------------------------------------------------------------
    # Helfer
    # ------------------------------------------------------------------
    def _emit(self, event: dict) -> None:
        """Legt ein Ereignis für die GUI in die Queue."""
        try:
            self._events.put_nowait(event)
        except queue.Full:  # praktisch unmöglich (unbegrenzte Queue), aber sicher ist sicher
            logger.warning("Ereignis-Queue ist voll – Ereignis verworfen: %s", event)
