"""
Hintergrundüberwachung der Instagram-Konten.
============================================

:class:`AccountMonitor` betreibt einen **einzigen, langlebigen**
Daemon-Thread. Die Überwachung wird nicht durch Erzeugen/Beenden von
Threads geschaltet, sondern über ein An/Aus-Signal (``_run_request``):

  * ``start()`` / ``stop()``  schalten die Überwachung an/aus – beides
    kehrt sofort zurück und ist frei von Thread-Lebenszyklus-Races
    (der Soll-Zustand ist unabhängig davon, ob der Worker gerade noch
    in einem Netzwerkzugriff steckt).
  * ``check_now()``           stößt außerplanmäßig einen Prüflauf an.
  * ``shutdown()``            beendet den Worker beim App-Ende endgültig
    und meldet zurück, ob er sich sauber beendet hat (wichtig: erst
    danach darf die Datenbank geschlossen werden).

Ein Prüflauf pro Konto:

  1. neueste Beiträge des Profils abrufen (nur öffentliche Profile)
  2. zuvor fehlgeschlagene Downloads erneut versuchen
  3. unbekannte Beiträge in der Datenbank registrieren
  4. den Benutzer benachrichtigen (GUI-Ereignis + Desktop-Benachrichtigung)
  5. falls für das Konto aktiviert und zulässig: Beitrag herunterladen

Kommunikation mit der GUI
-------------------------
Der Thread fasst NIEMALS Tkinter-Widgets an. Stattdessen legt er
Ereignis-Dictionaries in eine thread-sichere ``queue.Queue``; die GUI
liest diese Queue zyklisch im Haupt-Thread aus. Ereignistypen:

  {"type": "status",          "running": bool}
  {"type": "account_checked", "username": str}
  {"type": "new_post",        "post": PostInfo, "downloaded": bool}

Erstinventur (Baseline)
-----------------------
Beim allerersten Prüflauf eines Kontos werden die vorhandenen Beiträge
nur registriert, aber weder gemeldet noch heruntergeladen – sonst würde
beim Hinzufügen eines Kontos dessen gesamter sichtbarer Verlauf als
"neu" behandelt. Erst ab dem zweiten Lauf gilt: unbekannt UND neuer als
der jüngste bekannte Beitrag = neu. (Der zweite Teil verhindert, dass
ein alter Beitrag, der z. B. durch An-/Abpinnen wieder in das
Sichtfenster der neuesten N Beiträge rückt, fälschlich gemeldet wird.)
"""

from __future__ import annotations

import logging
import queue
import threading
import time
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

# Auflösung, mit der die Wartephase auf Signale/Intervalländerungen
# reagiert (Sekunden).
_WAIT_TICK = 1.0


class AccountMonitor:
    """Verwaltet den Überwachungs-Worker (An/Aus/Sofortprüfung/Shutdown)."""

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
        self._shutdown_event = threading.Event()  # App-Ende: Worker beenden
        self._run_request = threading.Event()     # Überwachung an/aus (Soll-Zustand)
        self._wake_event = threading.Event()      # Wartephase abbrechen (Sofortprüfung/Job)

        # Warteschlange für einmalige Aufträge (z. B. manueller Download).
        # Sie laufen im SELBEN Worker-Thread wie die Überwachung, damit die
        # gemeinsame Instaloader-Instanz nie parallel benutzt wird.
        self._jobs: "queue.Queue" = queue.Queue()

    # ------------------------------------------------------------------
    # Öffentliche Steuerung (wird aus dem GUI-Thread aufgerufen)
    # ------------------------------------------------------------------
    @property
    def active(self) -> bool:
        """Soll-Zustand: Ist die Überwachung eingeschaltet?

        Bewusst NICHT über die Thread-Lebendigkeit definiert: Der Worker
        kann nach einem stop() noch kurz in einem Netzwerkzugriff stecken;
        für GUI und Logik zählt allein der gewünschte Zustand.
        """
        return self._run_request.is_set() and not self._shutdown_event.is_set()

    def _ensure_thread(self) -> bool:
        """Stellt sicher, dass der Worker-Thread läuft.

        Rückgabe: False, wenn die App bereits heruntergefahren wird.
        """
        if self._shutdown_event.is_set():
            return False
        # daemon=True: hält das Programmende nicht auf, falls die Anwendung
        # unerwartet endet; regulär wird er über shutdown() beendet.
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(
                target=self._run, name="account-monitor", daemon=True
            )
            self._thread.start()
        return True

    def start(self) -> None:
        """Schaltet die Überwachung ein (idempotent, kehrt sofort zurück)."""
        if not self._ensure_thread():
            logger.warning("start() nach shutdown() ignoriert.")
            return

        if not self.active:
            self._run_request.set()
            self._wake_event.set()  # Worker ggf. aus dem Leerlauf wecken
            logger.info("Überwachung gestartet.")
            self._emit({"type": "status", "running": True})

    def download_now(self, username: str, limit: int) -> None:
        """Stößt einen MANUELLEN Download der neuesten Beiträge an.

        Läuft asynchron im Worker-Thread – unabhängig davon, ob die
        Überwachung gerade eingeschaltet ist. Lädt bis zu ``limit`` der
        neuesten Beiträge des Kontos herunter; bereits vorhandene Dateien
        werden übersprungen.
        """
        if not self._ensure_thread():
            logger.warning("Manueller Download nach shutdown() ignoriert.")
            return
        self._jobs.put(("download", username.strip().lstrip("@").lower(), int(limit)))
        self._wake_event.set()  # Worker sofort aufwecken
        logger.info("Manueller Download für @%s eingeplant …", username)

    def stop(self) -> None:
        """Schaltet die Überwachung aus (kehrt sofort zurück).

        Ein bereits laufender Netzwerkzugriff wird nicht abgebrochen; der
        Worker hält aber am nächsten Prüfpunkt (zwischen Konten/Beiträgen)
        an und legt sich schlafen.
        """
        if self._run_request.is_set():
            self._run_request.clear()
            self._wake_event.set()  # eventuelle Wartephase sofort beenden
            logger.info("Überwachung gestoppt.")
            self._emit({"type": "status", "running": False})

    def check_now(self) -> None:
        """Stößt außerplanmäßig einen sofortigen Prüflauf an."""
        if self.active:
            self._wake_event.set()
            logger.info("Sofortige Prüfung angefordert.")
        else:
            logger.info("Sofortige Prüfung nicht möglich – Überwachung ist gestoppt.")

    def shutdown(self, timeout: float = 30.0) -> bool:
        """Beendet den Worker-Thread endgültig (beim Beenden der App).

        Rückgabe: True, wenn der Thread sauber beendet wurde. Bei False
        steckt er noch in einem blockierenden Netzwerkzugriff – der
        Aufrufer darf gemeinsam genutzte Ressourcen (v. a. die Datenbank)
        dann NICHT schließen; das Prozessende räumt auf.
        """
        self._shutdown_event.set()
        self._run_request.clear()
        self._wake_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=timeout)
            if self._thread.is_alive():
                logger.warning(
                    "Überwachungs-Thread beendet sich nicht (blockierender "
                    "Netzwerkzugriff) – kein sauberer Stopp."
                )
                return False
        logger.info("Überwachungs-Thread beendet.")
        return True

    # ------------------------------------------------------------------
    # Hauptschleife des Worker-Threads
    # ------------------------------------------------------------------
    def _paused(self) -> bool:
        """True, sobald der Worker anhalten soll (Stop oder Shutdown)."""
        return self._shutdown_event.is_set() or not self._run_request.is_set()

    def _run(self) -> None:
        """Endlosschleife: Jobs abarbeiten · (geparkt ↔) prüfen · warten …"""
        while not self._shutdown_event.is_set():
            # Einmalige Aufträge (manuelle Downloads) haben Vorrang und
            # laufen unabhängig vom Überwachungs-Zustand.
            self._process_jobs()
            if self._shutdown_event.is_set():
                break

            if not self._run_request.is_set():
                # Überwachung ist ausgeschaltet: auf ein Weck-Signal warten
                # (Start oder neuer Job). Timeout hält den Shutdown zügig.
                self._wake_event.clear()
                self._process_jobs()  # Job zwischen clear() und wait() abfangen
                self._wake_event.wait(timeout=1.0)
                continue

            # WICHTIG: Das Weck-Signal wird VOR dem Prüflauf zurückgesetzt,
            # nicht direkt vor dem Warten. Sonst gäbe es eine Race-Condition:
            # Ein check_now()/Job zwischen clear() und wait() würde verschluckt.
            self._wake_event.clear()
            self._process_jobs()

            try:
                self._check_all_accounts()
            except Exception:
                # Letzte Verteidigungslinie: Ein unerwarteter Fehler darf
                # den Worker nicht sterben lassen.
                logger.exception("Unerwarteter Fehler im Prüflauf.")

            if not self._paused():
                self._wait_interval()

    def _process_jobs(self) -> None:
        """Arbeitet alle anstehenden Einmal-Aufträge ab."""
        while not self._shutdown_event.is_set():
            try:
                job = self._jobs.get_nowait()
            except queue.Empty:
                return
            try:
                kind = job[0]
                if kind == "download":
                    _, username, limit = job
                    self._do_manual_download(username, limit)
                else:
                    logger.warning("Unbekannter Auftrag: %s", kind)
            except Exception:
                logger.exception("Fehler bei der Auftragsbearbeitung.")

    def _do_manual_download(self, username: str, limit: int) -> None:
        """Lädt bis zu ``limit`` der neuesten Beiträge eines Kontos herunter."""
        logger.info(
            "Manueller Download für @%s gestartet (bis zu %d Beiträge) …",
            username,
            limit,
        )
        self._emit({"type": "manual_download_started", "username": username})
        try:
            posts = self._downloader.list_recent_posts(username, limit)
        except ProfileIsPrivate as exc:
            logger.warning(str(exc))
            self._emit({"type": "manual_download_done", "username": username,
                        "downloaded": 0, "error": "privat"})
            return
        except ProfileNotFound as exc:
            logger.error(str(exc))
            self._emit({"type": "manual_download_done", "username": username,
                        "downloaded": 0, "error": "nicht gefunden"})
            return
        except DownloaderError as exc:
            logger.warning("Manueller Download @%s: %s", username, exc)
            self._emit({"type": "manual_download_done", "username": username,
                        "downloaded": 0, "error": "vorübergehender Fehler"})
            return

        downloaded = 0
        for post in posts:
            if self._shutdown_event.is_set():
                break
            # Beitrag registrieren (gilt danach als bekannt – die
            # Überwachung meldet ihn nicht erneut als "neu").
            self._db.add_post(post.shortcode, username, post.post_type, post.posted_at)
            try:
                if self._downloader.download_post(post):
                    self._db.mark_downloaded(post.shortcode, username)
                    downloaded += 1
            except DownloaderError as exc:
                logger.warning(
                    "Beitrag %s konnte nicht geladen werden: %s",
                    post.shortcode,
                    exc,
                )

        logger.info(
            "Manueller Download für @%s abgeschlossen: %d Beitrag/Beiträge "
            "gespeichert.",
            username,
            downloaded,
        )
        self._emit({"type": "manual_download_done", "username": username,
                    "downloaded": downloaded})

    def _wait_interval(self) -> None:
        """Wartet das Prüfintervall ab – unterbrechbar und live anpassbar.

        Das Intervall wird während des Wartens sekündlich neu aus den
        Einstellungen gelesen: Eine Änderung über die GUI wirkt damit
        sofort auf die laufende Wartezeit, ohne eine zusätzliche Prüfung
        (und damit unnötige Anfragen) auszulösen.
        """
        logger.info(
            "Nächste Prüfung in %d Minute(n).",
            self._settings.check_interval_minutes,
        )
        started = time.monotonic()
        while not self._paused():
            interval_seconds = self._settings.check_interval_minutes * 60
            remaining = interval_seconds - (time.monotonic() - started)
            if remaining <= 0:
                return  # Intervall abgelaufen → nächster Prüflauf
            if self._wake_event.wait(timeout=min(remaining, _WAIT_TICK)):
                return  # geweckt (Sofortprüfung/Stop/Shutdown)

    def _check_all_accounts(self) -> None:
        """Ein kompletter Prüflauf über alle überwachten Konten."""
        accounts = self._db.get_accounts()
        if not accounts:
            logger.info("Keine Konten in der Überwachung – nichts zu tun.")
            return

        logger.info("Prüflauf gestartet (%d Konto/Konten).", len(accounts))
        for index, account in enumerate(accounts):
            if self._paused():
                logger.info("Prüflauf angehalten (Stop angefordert).")
                return

            self._check_account(
                username=account["username"],
                download_enabled=bool(account["download_enabled"]),
                baseline_done=bool(account["baseline_done"]),
            )

            # Kurze Pause zwischen den Konten (nicht nach dem letzten).
            if index < len(accounts) - 1:
                self._shutdown_event.wait(timeout=DELAY_BETWEEN_ACCOUNTS)

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
            # is_known ist pro Konto gebunden: Collab-Beiträge erscheinen
            # unter demselben Shortcode auf MEHREREN Profilen und müssen
            # für jedes überwachte Konto einzeln gemeldet werden.
            new_posts = self._downloader.fetch_new_posts(
                username,
                is_known=lambda shortcode: self._db.is_post_known(
                    shortcode, username
                ),
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
            # Zuerst frühere, fehlgeschlagene Downloads nachholen. Bewusst
            # VOR der Verarbeitung der neuen Beiträge: Ein Download, der in
            # DIESEM Lauf fehlschlägt, wird dadurch erst beim nächsten Lauf
            # wiederholt (kein sofortiges Hämmern bei Drosselung).
            if download_enabled:
                self._retry_pending_downloads(username)

            # Referenzzeitpunkt: Veröffentlichung des jüngsten bereits
            # bekannten Beitrags. Unbekannte Beiträge, die ÄLTER sind,
            # sind keine Neuveröffentlichungen, sondern alte Beiträge,
            # die (z. B. durch An-/Abpinnen) wieder ins Sichtfenster der
            # neuesten N gerückt sind → nur registrieren, nicht melden.
            cutoff = self._db.newest_posted_at(username)
            for post in new_posts:
                if self._paused():
                    break
                if cutoff is not None and post.posted_at <= cutoff:
                    self._db.add_post(
                        post.shortcode, username, post.post_type, post.posted_at
                    )
                    logger.info(
                        "@%s: älterer Beitrag %s ist wieder im Sichtfenster – "
                        "registriert, ohne ihn als neu zu melden.",
                        username,
                        post.shortcode,
                    )
                    continue
                self._handle_new_post(post, download_enabled)
            if not new_posts:
                logger.info("@%s: keine neuen Beiträge.", username)

        self._db.update_last_checked(username, error=None)
        self._emit({"type": "account_checked", "username": username})

    def _handle_new_post(self, post: PostInfo, download_enabled: bool) -> None:
        """Registrieren → benachrichtigen → ggf. herunterladen."""
        # 1. Registrieren, BEVOR irgendetwas anderes passiert. Damit ist
        #    eine Doppel-Meldung selbst dann ausgeschlossen, wenn ein
        #    späterer Schritt fehlschlägt. Ist der Download gewünscht,
        #    wird er als "ausstehend" vorgemerkt und erst nach Erfolg
        #    abgehakt – ein fehlgeschlagener Download wird so bei den
        #    nächsten Prüfläufen automatisch erneut versucht.
        self._db.add_post(
            post.shortcode,
            post.username,
            post.post_type,
            post.posted_at,
            download_pending=download_enabled,
        )

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
                    self._db.mark_downloaded(post.shortcode, post.username)
            except DownloaderError as exc:
                logger.error(
                    "%s – der Download bleibt vorgemerkt und wird beim "
                    "nächsten Prüflauf erneut versucht.",
                    exc,
                )

        self._emit({"type": "new_post", "post": post, "downloaded": downloaded})

    def _retry_pending_downloads(self, username: str) -> None:
        """Holt zuvor fehlgeschlagene Downloads dieses Kontos nach."""
        pending = self._db.get_pending_downloads(username)
        for row in pending:
            if self._paused():
                return
            info = PostInfo(
                shortcode=row["shortcode"],
                username=username,
                post_type=row["post_type"],
                posted_at=row["posted_at"] or "",
                url=f"https://www.instagram.com/p/{row['shortcode']}/",
            )
            logger.info(
                "Erneuter Download-Versuch für Beitrag %s (@%s) …",
                info.shortcode,
                username,
            )
            try:
                if self._downloader.download_post(info):
                    self._db.mark_downloaded(info.shortcode, username)
            except DownloaderError as exc:
                logger.warning(
                    "Download-Wiederholung fehlgeschlagen (%s) – bleibt "
                    "vorgemerkt.",
                    exc,
                )

    # ------------------------------------------------------------------
    # Helfer
    # ------------------------------------------------------------------
    def _emit(self, event: dict) -> None:
        """Legt ein Ereignis für die GUI in die Queue."""
        try:
            self._events.put_nowait(event)
        except queue.Full:  # praktisch unmöglich (unbegrenzte Queue), aber sicher ist sicher
            logger.warning("Ereignis-Queue ist voll – Ereignis verworfen: %s", event)
