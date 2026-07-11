# Instagram Monitor

Eine Desktop-Anwendung (Python 3.12 + CustomTkinter), die **öffentliche**
Instagram-Konten überwacht, bei neuen Beiträgen und Reels benachrichtigt und
neue Inhalte – sofern für das Konto aktiviert und zulässig – automatisch in
einen lokalen Ordner herunterlädt.

![Aufbau](https://img.shields.io/badge/Python-3.12-blue) ![GUI](https://img.shields.io/badge/GUI-CustomTkinter-informational)

## Funktionen

- **Mehrere Konten überwachen** – Benutzernamen einzeln oder als Liste
  (Komma-getrennt) hinzufügen.
- **Benachrichtigung bei neuen Beiträgen/Reels** – im Log-Fenster und
  (sofern verfügbar) als Desktop-Benachrichtigung.
- **Automatischer Download pro Konto abschaltbar** – über einen Schalter in
  der Kontenliste. Heruntergeladen wird nach `downloads/<benutzername>/`.
- **Keine Doppel-Downloads** – jeder Beitrag wird pro Konto in einer
  SQLite-Datenbank registriert; fehlgeschlagene Downloads (z. B. wegen
  Drosselung) bleiben vorgemerkt und werden bei den nächsten Prüfläufen
  automatisch nachgeholt.
- **Statusanzeige je Konto** – Zeitpunkt der letzten Prüfung, Anzahl der
  heruntergeladenen Beiträge, letzter Fehler.
- **Start/Stop** der Überwachung, **Sofortprüfung** und einstellbares
  **Prüfintervall** (Standard: 5 Minuten, Minimum: 1 Minute).
- **Persistenz** – Konten, bekannte Beiträge und Einstellungen überleben
  einen Neustart (SQLite: `data/monitor.db`).
- **Logging** – rotierende Log-Datei unter `logs/app.log` plus Live-Log in
  der Oberfläche.

## Wichtige Hinweise (bitte zuerst lesen)

- Die Anwendung ruft **ausschließlich öffentlich sichtbare Inhalte** ab –
  dasselbe, was ein nicht angemeldeter Besucher im Browser sieht. Als
  Unterbau dient das dokumentierte Open-Source-Tool
  [Instaloader](https://instaloader.github.io/).
- **Private Profile werden übersprungen.** Die Anwendung umgeht keinerlei
  Login-, Sicherheits- oder Zugriffsbeschränkungen von Instagram.
- **Rate-Limits werden respektiert:** Das Prüfintervall ist nach unten auf
  1 Minute begrenzt, zwischen den Konten liegen Pausen, pro Prüfung werden
  nur die neuesten Beiträge betrachtet, und bei einer Drosselung durch
  Instagram wartet die Anwendung einfach auf den nächsten regulären Lauf.
- **Rechtliches:** Du bist selbst dafür verantwortlich, dass Überwachung und
  Download im Einklang mit den
  [Instagram-Nutzungsbedingungen](https://help.instagram.com/581066165581870)
  und dem Urheberrecht stehen. Lade nur Inhalte herunter, für die du dazu
  berechtigt bist (z. B. eigene Konten oder Inhalte mit ausdrücklicher
  Erlaubnis), und nutze Downloads nur privat.
- Instagram drosselt anonyme Abrufe zum Teil stark. Gelegentliche Meldungen
  wie „Vorübergehender Fehler“ sind normal – die Anwendung versucht es beim
  nächsten Prüflauf automatisch erneut.

## Schnellstart (empfohlen)

Voraussetzung ist nur ein installiertes **Python 3.12 oder neuer**
(Download: https://www.python.org/downloads/ – im Windows-Installer den
Haken **„Add python.exe to PATH“** setzen).

- **Windows:** Doppelklick auf **`start.bat`**
- **Linux/macOS:** `./start.sh`

Das Skript erledigt beim ersten Start automatisch die komplette
Einrichtung (virtuelle Umgebung anlegen, Abhängigkeiten installieren)
und startet danach die Anwendung. Ab dem zweiten Start geht es direkt
los.

## Manuelle Installation

Voraussetzung: **Python 3.12** (inkl. Tkinter, das bei den offiziellen
Installern von python.org enthalten ist).

```bash
# 1. In den Projektordner wechseln
cd instagram-monitor

# 2. Virtuelle Umgebung anlegen und aktivieren
python3.12 -m venv .venv

#    Linux/macOS:
source .venv/bin/activate
#    Windows (PowerShell):
#    .venv\Scripts\Activate.ps1
#    Windows (cmd):
#    .venv\Scripts\activate.bat

# 3. Abhängigkeiten installieren
pip install -r requirements.txt

# 4. Anwendung starten
python main.py
```

**Hinweis für Linux:** Falls Tkinter fehlt (`ModuleNotFoundError: No module
named 'tkinter'`), zuerst das Systempaket installieren, z. B.
`sudo apt install python3-tk` (Debian/Ubuntu) oder
`sudo dnf install python3-tkinter` (Fedora).

## Bedienung

1. **Konto hinzufügen:** Benutzernamen oben eingeben (mehrere mit Komma
   trennen) und auf „Hinzufügen“ klicken.
2. **Download aktivieren (optional):** In der Kontenliste den Schalter
   „Automatisch herunterladen“ umlegen.
3. **Überwachung starten:** Rechts auf „▶ Überwachung starten“ klicken.
   Der Status in der Kopfzeile wechselt auf „Überwachung läuft“.
4. **Prüfintervall ändern:** Minutenzahl eintragen und „Intervall
   übernehmen“ klicken. Die Änderung wirkt sofort auf die laufende
   Wartezeit; eine zusätzliche Prüfung wird dadurch **nicht** ausgelöst.
5. **Sofort prüfen:** „↻ Jetzt prüfen“ stößt außerplanmäßig einen Lauf an.
6. **Download-Ordner ändern:** über „Ordner wählen …“.

**Erstinventur:** Beim ersten Prüflauf eines neu hinzugefügten Kontos werden
die bereits vorhandenen Beiträge nur registriert (Baseline) – sie werden
weder gemeldet noch heruntergeladen. Erst ab dem zweiten Lauf gilt jeder
unbekannte Beitrag als „neu“. So wird verhindert, dass beim Hinzufügen eines
Kontos dessen gesamter Verlauf heruntergeladen wird.

## Projektstruktur

```
instagram-monitor/
├── main.py               # Einstiegspunkt: verdrahtet alle Komponenten
├── requirements.txt      # Abhängigkeiten
├── README.md             # diese Datei
├── app/
│   ├── __init__.py
│   ├── gui.py            # CustomTkinter-Oberfläche (nur Haupt-Thread)
│   ├── database.py       # SQLite-Persistenz (thread-sicher via Lock)
│   ├── downloader.py     # Zugriff auf öffentliche Inhalte (Instaloader)
│   ├── monitor.py        # Hintergrund-Thread für die Überwachung
│   ├── settings.py       # Einstellungsverwaltung (persistiert in SQLite)
│   ├── notifier.py       # Desktop-Benachrichtigungen (optional, plyer)
│   └── logging_setup.py  # Logging: Datei + Konsole + GUI-Fenster
├── data/                 # monitor.db (wird automatisch angelegt)
├── logs/                 # app.log (rotierend, wird automatisch angelegt)
└── downloads/            # Standard-Zielordner für Downloads
```

## Architektur in Kürze

- **GUI (Haupt-Thread):** Alle Tkinter-Widgets werden ausschließlich im
  Haupt-Thread angefasst.
- **Monitor (ein langlebiger Hintergrund-Thread):** wird per An/Aus-Signal
  geschaltet (kein Thread-Neustart bei Start/Stop) und kommuniziert mit
  der GUI **nur** über eine thread-sichere `queue.Queue` (die GUI liest
  sie zyklisch per `after()` aus). Beim Beenden der App wird die
  Datenbank erst geschlossen, nachdem der Thread wirklich beendet ist.
- **Datenbank:** eine SQLite-Verbindung, serialisiert über ein
  `threading.Lock` – einfach und robust bei der geringen Zugriffsfrequenz.
  Beiträge werden pro Konto geführt (Collab-Beiträge erscheinen unter
  demselben Shortcode auf mehreren Profilen und werden für jedes
  überwachte Konto einzeln gemeldet).
- **Stoppen ohne Warten:** Die Wartephase reagiert sekündlich auf „Stop“,
  „Jetzt prüfen“ und Intervalländerungen.
- **Ausstehende Downloads:** Schlägt ein gewünschter Download fehl, bleibt
  er als „ausstehend“ markiert und wird zu Beginn der nächsten Prüfläufe
  automatisch nachgeholt.

## Fehlerbehebung

| Symptom | Ursache / Lösung |
| --- | --- |
| „Profil ist privat“ | Gewolltes Verhalten: private Profile werden nicht abgerufen. |
| „Profil nicht gefunden“ | Tippfehler im Benutzernamen? Konto entfernen und korrekt neu anlegen. |
| „Vorübergehender Fehler“ | Netzwerkproblem oder Drosselung durch Instagram – die App versucht es beim nächsten Lauf erneut. Ggf. Prüfintervall erhöhen. |
| Keine Desktop-Benachrichtigungen | `plyer` fehlt oder das System hat keinen Benachrichtigungsdienst; Meldungen erscheinen weiterhin im Log. |
| GUI startet nicht (`tkinter` fehlt) | Tkinter-Systempaket installieren (siehe Installation). |

Ausführliche Diagnose: `logs/app.log`.
