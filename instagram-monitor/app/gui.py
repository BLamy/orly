"""
Grafische Oberfläche (CustomTkinter).
=====================================

Aufbau des Hauptfensters::

  ┌─────────────────────────────────────────────────────────────┐
  │  Kopfzeile: Titel + Status (läuft/gestoppt)                 │
  ├─────────────────────────────────────────────────────────────┤
  │  Konto hinzufügen: [ Eingabefeld            ] [Hinzufügen]  │
  ├───────────────────────────────┬─────────────────────────────┤
  │  Überwachte Konten            │  Steuerung & Einstellungen  │
  │  (scrollbare Liste mit        │  Start/Stop, Sofortprüfung, │
  │   letzter Prüfung, Anzahl     │  Prüfintervall,             │
  │   Downloads, Download-Schalter│  Download-Ordner            │
  │   und Entfernen-Knopf)        │                             │
  ├───────────────────────────────┴─────────────────────────────┤
  │  Log-Ausgabe (schreibgeschütztes Textfeld)                  │
  └─────────────────────────────────────────────────────────────┘

Thread-Regel: Diese Klasse läuft vollständig im Haupt-Thread. Alles, was
der Monitor-Thread mitteilen will, kommt als Ereignis über die Queue an
und wird in :meth:`_poll_events` (zyklisch via ``after``) verarbeitet.
"""

from __future__ import annotations

import logging
import queue
import re
from tkinter import TclError, filedialog, messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from .settings import MIN_INTERVAL_MINUTES

if TYPE_CHECKING:
    from .database import Database
    from .monitor import AccountMonitor
    from .settings import Settings

logger = logging.getLogger(__name__)

# Gültige Instagram-Benutzernamen: Buchstaben, Ziffern, Punkt, Unterstrich,
# maximal 30 Zeichen.
_USERNAME_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")

# Benutzername aus einer kompletten Instagram-Adresse herausziehen,
# z. B. https://www.instagram.com/nasa/ → nasa
_URL_RE = re.compile(r"instagram\.com/([A-Za-z0-9._]+)", re.IGNORECASE)

# Pfad-Segmente von instagram.com, die KEINE Profilnamen sind
# (Beitrags-/Reel-/Story-Links usw.).
_RESERVED_SEGMENTS = {"p", "reel", "reels", "tv", "stories", "explore", "accounts"}


def _extract_username(raw: str) -> str:
    """Normalisiert eine Eingabe zu einem Benutzernamen.

    Akzeptiert neben dem reinen Namen auch "@name" und komplette
    Instagram-Adressen. Liefert "" für Eingaben, aus denen sich kein
    Profilname ableiten lässt (z. B. ein Link auf einen einzelnen
    Beitrag statt auf ein Profil).
    """
    raw = raw.strip()
    match = _URL_RE.search(raw)
    if match:
        segment = match.group(1)
        if segment.lower() in _RESERVED_SEGMENTS:
            return ""  # Beitrags-/Reel-Link, kein Profil-Link
        raw = segment
    return raw.lstrip("@").lower()

# Wie oft die GUI die Ereignis-Queue ausliest (Millisekunden).
_POLL_INTERVAL_MS = 150

# Maximale Zeilenzahl im Log-Fenster (ältere Zeilen werden verworfen;
# die vollständige Historie steht weiterhin in logs/app.log).
_MAX_LOG_LINES = 500


class App(ctk.CTk):
    """Das Hauptfenster der Anwendung."""

    def __init__(
        self,
        db: "Database",
        settings: "Settings",
        monitor: "AccountMonitor",
        event_queue: "queue.Queue",
    ) -> None:
        # Erscheinungsbild vor dem Erzeugen des Fensters festlegen.
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        super().__init__()

        self._db = db
        self._settings = settings
        self._monitor = monitor
        self._events = event_queue

        # Benutzername → CTkSwitch, um den Schalterzustand auszulesen.
        self._download_switches: dict[str, ctk.CTkSwitch] = {}

        self.title("Instagram Monitor")
        self.geometry("1000x700")
        self.minsize(820, 560)

        # Sauberes Herunterfahren beim Schließen des Fensters.
        self.protocol("WM_DELETE_WINDOW", self._on_close)

        self._build_layout()
        self._refresh_account_list()
        self._poll_events()  # startet den zyklischen Queue-Abruf

        logger.info(
            "Bereit. Konten hinzufügen und die Überwachung mit ▶ starten."
        )

    # ==================================================================
    # Aufbau der Oberfläche
    # ==================================================================
    def _build_layout(self) -> None:
        """Erzeugt alle Widgets und ordnet sie im Grid an."""
        # Spalte 0 (Kontenliste) wächst, Spalte 1 (Steuerung) ist fix.
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=0)
        # Zeile 2 (Hauptbereich) und Zeile 3 (Log) teilen sich den Platz.
        self.grid_rowconfigure(2, weight=3)
        self.grid_rowconfigure(3, weight=2)

        # --- Kopfzeile ---------------------------------------------------
        header = ctk.CTkFrame(self, corner_radius=0)
        header.grid(row=0, column=0, columnspan=2, sticky="ew")
        header.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            header,
            text="Instagram Monitor",
            font=ctk.CTkFont(size=20, weight="bold"),
        ).grid(row=0, column=0, padx=16, pady=10, sticky="w")

        self._status_label = ctk.CTkLabel(
            header, text="⏸  Überwachung gestoppt", text_color="gray"
        )
        self._status_label.grid(row=0, column=1, padx=16, pady=10, sticky="e")

        # --- Konto hinzufügen ---------------------------------------------
        add_frame = ctk.CTkFrame(self)
        add_frame.grid(row=1, column=0, columnspan=2, sticky="ew", padx=12, pady=(12, 6))
        add_frame.grid_columnconfigure(0, weight=1)

        self._add_entry = ctk.CTkEntry(
            add_frame,
            placeholder_text="Benutzername oder Instagram-Link – mehrere mit Komma trennen, z. B. nasa, natgeo",
        )
        self._add_entry.grid(row=0, column=0, sticky="ew", padx=(10, 6), pady=10)
        # Enter-Taste löst ebenfalls das Hinzufügen aus.
        self._add_entry.bind("<Return>", lambda _event: self._on_add_accounts())

        ctk.CTkButton(
            add_frame, text="Hinzufügen", width=120, command=self._on_add_accounts
        ).grid(row=0, column=1, padx=(0, 10), pady=10)

        # --- Kontenliste (links) -------------------------------------------
        self._account_list = ctk.CTkScrollableFrame(
            self, label_text="Überwachte Konten"
        )
        self._account_list.grid(row=2, column=0, sticky="nsew", padx=(12, 6), pady=6)
        self._account_list.grid_columnconfigure(0, weight=1)

        # --- Steuerung & Einstellungen (rechts) -----------------------------
        controls = ctk.CTkFrame(self, width=280)
        controls.grid(row=2, column=1, sticky="nsew", padx=(6, 12), pady=6)
        controls.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            controls, text="Steuerung", font=ctk.CTkFont(size=15, weight="bold")
        ).grid(row=0, column=0, padx=14, pady=(12, 4), sticky="w")

        self._start_stop_button = ctk.CTkButton(
            controls, text="▶  Überwachung starten", command=self._on_toggle_monitor
        )
        self._start_stop_button.grid(row=1, column=0, padx=14, pady=6, sticky="ew")

        self._check_now_button = ctk.CTkButton(
            controls,
            text="↻  Jetzt prüfen",
            command=self._on_check_now,
            state="disabled",  # erst sinnvoll, wenn die Überwachung läuft
            fg_color="gray30",
        )
        self._check_now_button.grid(row=2, column=0, padx=14, pady=6, sticky="ew")

        ctk.CTkLabel(
            controls, text="Einstellungen", font=ctk.CTkFont(size=15, weight="bold")
        ).grid(row=3, column=0, padx=14, pady=(18, 4), sticky="w")

        # Prüfintervall -----------------------------------------------------
        interval_row = ctk.CTkFrame(controls, fg_color="transparent")
        interval_row.grid(row=4, column=0, padx=14, pady=4, sticky="ew")
        interval_row.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(interval_row, text="Prüfintervall (Minuten):").grid(
            row=0, column=0, sticky="w"
        )
        self._interval_entry = ctk.CTkEntry(interval_row, width=60, justify="center")
        self._interval_entry.grid(row=0, column=1, padx=8, sticky="e")
        self._interval_entry.insert(0, str(self._settings.check_interval_minutes))

        ctk.CTkButton(
            controls,
            text="Intervall übernehmen",
            command=self._on_apply_interval,
        ).grid(row=5, column=0, padx=14, pady=6, sticky="ew")

        # Download-Ordner -----------------------------------------------------
        ctk.CTkLabel(controls, text="Download-Ordner:").grid(
            row=6, column=0, padx=14, pady=(14, 0), sticky="w"
        )
        self._download_dir_label = ctk.CTkLabel(
            controls,
            text=str(self._settings.download_dir),
            wraplength=230,
            justify="left",
            text_color="gray",
        )
        self._download_dir_label.grid(row=7, column=0, padx=14, pady=(0, 4), sticky="w")

        ctk.CTkButton(
            controls, text="Ordner wählen …", command=self._on_choose_download_dir
        ).grid(row=8, column=0, padx=14, pady=6, sticky="ew")

        # Rechtlicher Hinweis --------------------------------------------------
        ctk.CTkLabel(
            controls,
            text=(
                "Hinweis: Es werden nur öffentliche Profile geprüft. "
                "Downloads nur, wenn zulässig – bitte Urheberrechte und die "
                "Instagram-Nutzungsbedingungen beachten."
            ),
            wraplength=230,
            justify="left",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        ).grid(row=9, column=0, padx=14, pady=(18, 12), sticky="w")

        # --- Log-Ausgabe -------------------------------------------------------
        self._log_box = ctk.CTkTextbox(self, wrap="word", font=ctk.CTkFont(size=12))
        self._log_box.grid(
            row=3, column=0, columnspan=2, sticky="nsew", padx=12, pady=(6, 12)
        )
        self._log_box.configure(state="disabled")

    # ==================================================================
    # Kontenliste
    # ==================================================================
    def _refresh_account_list(self) -> None:
        """Baut die Kontenliste anhand des Datenbankstands neu auf.

        Bei den hier üblichen Kontenzahlen ist ein kompletter Neuaufbau
        einfacher und robuster als das gezielte Aktualisieren einzelner
        Zeilen-Widgets.
        """
        for child in self._account_list.winfo_children():
            child.destroy()
        self._download_switches.clear()  # zerstörte Schalter nicht behalten

        accounts = self._db.get_accounts()
        if not accounts:
            ctk.CTkLabel(
                self._account_list,
                text="Noch keine Konten – oben einen Benutzernamen hinzufügen.",
                text_color="gray",
            ).grid(row=0, column=0, pady=20)
            return

        for row_index, account in enumerate(accounts):
            self._build_account_row(row_index, account)

    def _build_account_row(self, row_index: int, account) -> None:
        """Erzeugt eine Zeile der Kontenliste."""
        username = account["username"]

        row = ctk.CTkFrame(self._account_list)
        row.grid(row=row_index, column=0, sticky="ew", padx=4, pady=3)
        row.grid_columnconfigure(0, weight=1)

        # Zeile 1: Benutzername + Anzahl Downloads
        name_label = ctk.CTkLabel(
            row, text=username, font=ctk.CTkFont(size=14, weight="bold")
        )
        name_label.grid(row=0, column=0, padx=10, pady=(6, 0), sticky="w")

        count = self._db.download_count(username)
        ctk.CTkLabel(
            row, text=f"{count} heruntergeladen", text_color="gray"
        ).grid(row=0, column=1, padx=10, pady=(6, 0), sticky="e")

        # Zeile 2: letzte Prüfung (+ evtl. letzter Fehler)
        last_checked = account["last_checked"] or "noch nie geprüft"
        detail = f"Letzte Prüfung: {last_checked}"
        if account["last_error"]:
            detail += f"   ⚠ {account['last_error']}"
        ctk.CTkLabel(
            row, text=detail, text_color="gray", font=ctk.CTkFont(size=11)
        ).grid(row=1, column=0, columnspan=2, padx=10, sticky="w")

        # Zeile 3: Download-Schalter + Entfernen-Knopf
        download_switch = ctk.CTkSwitch(
            row,
            text="Automatisch herunterladen",
            command=lambda u=username: self._on_toggle_download(u),
        )
        if account["download_enabled"]:
            download_switch.select()
        download_switch.grid(row=2, column=0, padx=10, pady=(2, 8), sticky="w")
        # Schalter merken, um seinen Zustand beim Umschalten auszulesen.
        self._download_switches[username] = download_switch

        ctk.CTkButton(
            row,
            text="Entfernen",
            width=90,
            fg_color="#8b2d2d",
            hover_color="#a83838",
            command=lambda u=username: self._on_remove_account(u),
        ).grid(row=2, column=1, padx=10, pady=(2, 8), sticky="e")

    # ==================================================================
    # Ereignis-Handler (Benutzeraktionen)
    # ==================================================================
    def _on_add_accounts(self) -> None:
        """Fügt einen oder mehrere Benutzernamen aus dem Eingabefeld hinzu."""
        raw = self._add_entry.get().strip()
        if not raw:
            return

        added, invalid, duplicates = [], [], []
        # Mehrere Namen dürfen mit Komma, Semikolon oder Leerzeichen
        # getrennt sein; "@name" und komplette Instagram-Adressen
        # (https://www.instagram.com/name/) werden ebenfalls verstanden.
        for token in re.split(r"[,;\s]+", raw):
            if not token:
                continue
            name = _extract_username(token)
            if not name:
                invalid.append(token)
                continue
            if not _USERNAME_RE.match(name):
                invalid.append(name)
                continue
            if self._db.add_account(name):
                added.append(name)
            else:
                duplicates.append(name)

        if invalid:
            # Modale Dialoge blockieren den Handler; schließt der Benutzer
            # währenddessen das Hauptfenster, existiert das Widget beim
            # Fortsetzen nicht mehr → Handler still abbrechen.
            try:
                messagebox.showwarning(
                    "Ungültige Benutzernamen",
                    "Diese Eingaben sind keine gültigen Instagram-Benutzernamen:\n"
                    + ", ".join(invalid),
                    parent=self,
                )
            except TclError:
                return
            if not self.winfo_exists():
                return
        if duplicates:
            logger.info("Bereits vorhanden: %s", ", ".join(duplicates))
        if added:
            self._add_entry.delete(0, "end")
            self._refresh_account_list()
            if self._monitor.active:
                # Neues Konto direkt in den nächsten Prüflauf aufnehmen.
                self._monitor.check_now()

    def _on_remove_account(self, username: str) -> None:
        """Entfernt ein Konto (mit Rückfrage)."""
        try:
            confirmed = messagebox.askyesno(
                "Konto entfernen",
                f"@{username} wirklich aus der Überwachung entfernen?\n\n"
                "Bereits heruntergeladene Dateien bleiben erhalten.",
                parent=self,
            )
        except TclError:
            return  # Fenster wurde während des Dialogs geschlossen
        if not confirmed or not self.winfo_exists():
            return
        self._db.remove_account(username)
        self._refresh_account_list()

    def _on_toggle_download(self, username: str) -> None:
        """Reagiert auf den Download-Schalter eines Kontos."""
        switch = self._download_switches.get(username)
        if switch is None:
            return
        enabled = bool(switch.get())
        self._db.set_download_enabled(username, enabled)
        logger.info(
            "Automatischer Download für @%s %s.",
            username,
            "aktiviert" if enabled else "deaktiviert",
        )

    def _on_toggle_monitor(self) -> None:
        """Start/Stop-Knopf.

        Verzweigt über den SOLL-Zustand (``active``), nicht über die
        Thread-Lebendigkeit: Der Worker kann nach einem Stop noch kurz in
        einem Netzwerkzugriff stecken – ein erneuter Start-Klick muss
        trotzdem zuverlässig wieder einschalten.
        """
        if self._monitor.active:
            self._monitor.stop()
        else:
            self._monitor.start()

    def _on_check_now(self) -> None:
        """Sofortige Prüfung außerhalb des Intervalls anstoßen."""
        self._monitor.check_now()

    def _on_apply_interval(self) -> None:
        """Übernimmt das eingegebene Prüfintervall (mit Validierung)."""
        raw = self._interval_entry.get().strip()
        try:
            minutes = int(raw)
            if minutes < MIN_INTERVAL_MINUTES:
                raise ValueError
        except ValueError:
            try:
                messagebox.showerror(
                    "Ungültiges Intervall",
                    f"Bitte eine ganze Zahl ≥ {MIN_INTERVAL_MINUTES} eingeben.",
                    parent=self,
                )
            except TclError:
                return  # Fenster wurde während des Dialogs geschlossen
            if not self.winfo_exists():
                return
            # Feld auf den gespeicherten Wert zurücksetzen.
            self._interval_entry.delete(0, "end")
            self._interval_entry.insert(0, str(self._settings.check_interval_minutes))
            return

        # Mehr ist nicht nötig: Der Monitor liest das Intervall während
        # der Wartephase laufend neu – die Änderung wirkt also sofort auf
        # die laufende Wartezeit, OHNE eine zusätzliche Prüfung (und damit
        # unnötige Anfragen) auszulösen.
        self._settings.check_interval_minutes = minutes

    def _on_choose_download_dir(self) -> None:
        """Öffnet den Ordner-Auswahldialog für den Download-Ordner."""
        try:
            chosen = filedialog.askdirectory(
                title="Download-Ordner wählen",
                initialdir=str(self._settings.download_dir),
                parent=self,
            )
        except TclError:
            return  # Fenster wurde während des Dialogs geschlossen
        if not chosen or not self.winfo_exists():
            return
        self._settings.download_dir = chosen
        self._download_dir_label.configure(text=chosen)

    def _on_close(self) -> None:
        """Fenster wird geschlossen: Überwachung ausschalten, dann beenden.

        Das endgültige Beenden des Worker-Threads (und erst danach das
        Schließen der Datenbank) übernimmt main.py nach dem Ende der
        Hauptschleife über ``monitor.shutdown()``.
        """
        logger.info("Fenster wird geschlossen …")
        self._monitor.stop()
        self.destroy()

    # ==================================================================
    # Ereignisse aus dem Monitor-Thread (via Queue)
    # ==================================================================
    def _poll_events(self) -> None:
        """Liest die Ereignis-Queue aus (läuft zyklisch im Haupt-Thread)."""
        try:
            while True:
                event = self._events.get_nowait()
                self._handle_event(event)
        except queue.Empty:
            pass
        except Exception:
            # Die Poll-Schleife muss weiterlaufen, egal was passiert.
            logger.exception("Fehler beim Verarbeiten eines GUI-Ereignisses.")

        # Erneut einplanen (solange das Fenster existiert).
        if self.winfo_exists():
            self.after(_POLL_INTERVAL_MS, self._poll_events)

    def _handle_event(self, event: dict) -> None:
        """Verarbeitet ein einzelnes Ereignis aus der Queue."""
        event_type = event.get("type")

        if event_type == "log":
            self._append_log_line(event["line"])

        elif event_type == "status":
            self._update_monitor_status(bool(event["running"]))

        elif event_type in ("account_checked", "accounts_changed", "new_post"):
            # Zeiten, Zähler und Fehleranzeigen neu aus der DB laden.
            self._refresh_account_list()

    def _update_monitor_status(self, running: bool) -> None:
        """Passt Statusanzeige und Knöpfe an den Monitor-Zustand an."""
        if running:
            self._status_label.configure(
                text="●  Überwachung läuft", text_color="#4cd964"
            )
            self._start_stop_button.configure(text="■  Überwachung stoppen")
            # Standard-Buttonfarbe aus dem aktiven Theme wiederherstellen.
            default_fg = ctk.ThemeManager.theme["CTkButton"]["fg_color"]
            self._check_now_button.configure(state="normal", fg_color=default_fg)
        else:
            self._status_label.configure(
                text="⏸  Überwachung gestoppt", text_color="gray"
            )
            self._start_stop_button.configure(text="▶  Überwachung starten")
            self._check_now_button.configure(state="disabled", fg_color="gray30")

    def _append_log_line(self, line: str) -> None:
        """Hängt eine Zeile an das Log-Fenster an (mit Zeilen-Obergrenze)."""
        self._log_box.configure(state="normal")
        self._log_box.insert("end", line + "\n")

        # Älteste Zeilen verwerfen, damit das Widget nicht unbegrenzt wächst.
        line_count = int(self._log_box.index("end-1c").split(".")[0])
        if line_count > _MAX_LOG_LINES:
            self._log_box.delete("1.0", f"{line_count - _MAX_LOG_LINES + 1}.0")

        self._log_box.see("end")  # automatisch ans Ende scrollen
        self._log_box.configure(state="disabled")
