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
- **Manueller Download** – der Knopf „⬇ Herunterladen“ pro Konto lädt die
  neuesten *vorhandenen* Beiträge sofort herunter (Anzahl abfragbar),
  unabhängig von der Überwachung.
- **Optionale Anmeldung mit dem eigenen Konto** – über den offiziellen
  Instaloader-Login (inkl. Zwei-Faktor-Authentifizierung). Reduziert die
  Drosselung und ermöglicht den Zugriff auf Konten, denen du folgst. Das
  Passwort wird **nicht** gespeichert.
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

Es gibt **zwei Oberflächen** für dieselben Daten:

| | Windows | Linux/macOS |
| --- | --- | --- |
| **Browser-Oberfläche** (Beiträge ansehen & gezielt herunterladen, wie ein Feed) | Doppelklick **`start-web.bat`** | `./start-web.sh` |
| **Desktop-App** (Dauer-Überwachung mit Benachrichtigungen) | Doppelklick **`start.bat`** | `./start.sh` |

Das Skript erledigt beim ersten Start automatisch die komplette
Einrichtung (virtuelle Umgebung anlegen, Abhängigkeiten installieren)
und startet danach die Anwendung. Ab dem zweiten Start geht es direkt
los. Bitte nicht beide Oberflächen gleichzeitig laufen lassen.

### Browser-Oberfläche

`start-web.bat` startet einen **lokalen** Server (nur auf deinem Rechner
erreichbar, http://127.0.0.1:8756/) und öffnet den Browser:

1. Optional oben **anmelden**. Am zuverlässigsten ist **„Aus Browser
   übernehmen“**: Melde dich einmal in deinem normalen Browser bei
   instagram.com an, dann übernimmt die App diese Anmeldung – das
   vermeidet den „Checkpoint“, den die direkte Passwort-Anmeldung von
   einem neuen Gerät oft auslöst. Alternativ Benutzername + Passwort
   (2FA wird unterstützt).
2. Benutzernamen oder Instagram-Link eingeben → **Anzeigen**.
3. Die Beiträge erscheinen als Bilder-Raster – bei jedem Foto/Video
   gibt es **„⬇ Herunterladen“**, dazu **„⬇ Alle herunterladen“**.
   Bereits Heruntergeladenes ist grün markiert.

Bei jedem Beitrag gibt es zwei Download-Knöpfe:

- **„⤓ Gerät"** – speichert die Datei direkt auf **dem Gerät, mit dem du
  die Seite geöffnet hast** (z. B. dein Handy). Ideal unterwegs.
- **„⬇ Auf PC"** – speichert in den Ordner `downloads/<benutzername>/`
  auf dem PC, auf dem die App läuft. Bereits Gespeichertes ist grün.

### Auf dem Handy öffnen (gleiches WLAN)

Du kannst die Oberfläche vom Handy aus benutzen, während die App auf dem
PC läuft. Handy und PC müssen im **selben WLAN** sein.

1. Auf dem PC **`start-web-handy.bat`** (Windows) bzw. `./start-web-handy.sh`
   starten. Beim ersten Mal fragt Windows nach der **Firewall-Freigabe**
   → „Zugriff zulassen" (privates Netzwerk) wählen.
2. Im PC-Fenster wird eine Adresse angezeigt, z. B.
   `http://192.168.1.42:8756/?key=abcd1234`.
3. **Diese komplette Adresse** (inkl. `?key=…`) auf dem Handy im Browser
   öffnen – am einfachsten als Lesezeichen speichern. Der Code schützt
   davor, dass andere im WLAN die Seite nutzen.

Die eigentliche Verarbeitung läuft weiter auf dem PC (dessen Anmeldung
und Internet-Verbindung werden genutzt); das Handy ist nur die Anzeige.
Über **„⤓ Gerät"** landen Downloads direkt auf dem Handy.

> Für Zugriff **von unterwegs** (Mobilfunk, außerhalb des WLANs) brauchst
> du zusätzlich einen Tunnel-Dienst (z. B. Cloudflare Tunnel oder ngrok),
> der die lokale Adresse `127.0.0.1:8756` nach außen verfügbar macht.
> Eine echte Cloud-Hosting-Variante (Vercel o. ä.) ist ungeeignet, weil
> Instagram Server-IPs stark drosselt und die Browser-Anmeldung dort
> nicht verfügbar ist.

Alle Oberflächen teilen sich denselben `downloads/`-Ordner, dieselbe
Datenbank und dieselbe Anmeldung.

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

**Vorhandene Beiträge herunterladen:** Weil die automatische Überwachung nur
*neue* Beiträge lädt, gibt es für bereits vorhandene Inhalte den Knopf
**„⬇ Herunterladen“** in jeder Kontozeile. Er fragt, wie viele der neuesten
Beiträge geladen werden sollen, und speichert sie sofort nach
`downloads/<benutzername>/`. Bereits vorhandene Dateien werden übersprungen.

### Anmeldung mit dem eigenen Konto (optional)

Ohne Anmeldung greift die App nur auf **öffentliche** Profile zu. Meldest du
dich mit deinem eigenen Instagram-Konto an (Abschnitt „Anmeldung“ rechts),

- werden anonyme Abrufe deutlich seltener gedrosselt, und
- kannst du auf **private** Konten zugreifen, **denen du folgst**.

Die Anmeldung nutzt den offiziellen, dokumentierten Instaloader-Login. Bei
aktivierter Zwei-Faktor-Authentifizierung fragt die App den Bestätigungscode
ab. Es werden **keine Schutzmechanismen umgangen**: Auf private Konten, denen
du nicht folgst, besteht weiterhin kein Zugriff. Dein **Passwort wird nicht
gespeichert** – Instaloader legt nur eine Cookie-Session-Datei unter
`data/sessions/` ab, sodass du beim nächsten Start angemeldet bleibst.
Melde dich nur mit deinem eigenen Konto an und lade ausschließlich Inhalte
herunter, zu denen du berechtigt bist.

## Projektstruktur

```
instagram-monitor/
├── main.py               # Einstiegspunkt Desktop-App
├── web.py                # Einstiegspunkt Browser-Oberfläche (--handy = WLAN)
├── start.bat / start.sh                  # Doppelklick-Start Desktop-App
├── start-web.bat / start-web.sh          # Browser-Oberfläche (nur dieser PC)
├── start-web-handy.bat / start-web-handy.sh  # Browser-Oberfläche im WLAN (Handy)
├── requirements.txt      # Abhängigkeiten
├── README.md             # diese Datei
├── app/
│   ├── __init__.py
│   ├── gui.py            # CustomTkinter-Oberfläche (nur Haupt-Thread)
│   ├── web.py            # Flask-Endpunkte der Browser-Oberfläche
│   ├── templates/
│   │   └── index.html    # die Browser-Oberfläche (Raster, Login, Downloads)
│   ├── database.py       # SQLite-Persistenz (thread-sicher via Lock)
│   ├── downloader.py     # Instaloader-Zugriff, Login, manueller Download
│   ├── monitor.py        # Hintergrund-Thread für die Überwachung
│   ├── settings.py       # Einstellungsverwaltung (persistiert in SQLite)
│   ├── notifier.py       # Desktop-Benachrichtigungen (optional, plyer)
│   ├── util.py           # geteilte Eingabe-Normalisierung
│   └── logging_setup.py  # Logging: Datei + Konsole + GUI-Fenster
├── data/                 # monitor.db, sessions/ (wird automatisch angelegt)
├── logs/                 # app.log, web.log (rotierend)
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
| „Profil nicht gefunden“ | Erscheint nur, wenn die Instagram-Suche funktioniert und den Namen trotzdem nicht kennt → Tippfehler? Konto entfernen und korrekt neu anlegen. |
| „Instagram beantwortet anonyme Profil-Abfragen derzeit nicht“ | Instagram drosselt anonyme Clients (sehr häufig). Kein Handlungsbedarf: Die App versucht es beim nächsten Prüflauf automatisch erneut; ggf. Prüfintervall erhöhen. Tipp: anmelden reduziert die Drosselung deutlich. |
| „Checkpoint required“ bei der Anmeldung | Instagram verlangt eine Sicherheitsbestätigung, weil die Anmeldung von einem neuen Gerät kommt. Melde dich in deinem normalen Browser bei instagram.com an (bestätige dort ggf. die Abfrage) und nutze **„Aus Browser übernehmen“** – dann wird deine bereits bestätigte Anmeldung verwendet, ohne erneuten Checkpoint. |
| „Keine aktive Instagram-Anmeldung im Browser gefunden“ | Du bist in keinem Desktop-Browser bei instagram.com eingeloggt, oder Chrome/Edge verschlüsselt die Cookies unlesbar. Lösung 1: in **Firefox** bei instagram.com anmelden, Firefox einmal schließen, dann erneut „Aus Browser übernehmen“. Lösung 2 (klappt immer): unter **„Erweitert: Anmeldung per sessionid“** den `sessionid`-Cookie-Wert einfügen (Browser → F12 → Anwendung/Application → Cookies → instagram.com → `sessionid`). |
| „Vorübergehender Fehler“ | Netzwerkproblem oder Drosselung durch Instagram – die App versucht es beim nächsten Lauf erneut. Ggf. Prüfintervall erhöhen. |
| Keine Desktop-Benachrichtigungen | `plyer` fehlt oder das System hat keinen Benachrichtigungsdienst; Meldungen erscheinen weiterhin im Log. |
| GUI startet nicht (`tkinter` fehlt) | Tkinter-Systempaket installieren (siehe Installation). |

Ausführliche Diagnose: `logs/app.log`.
