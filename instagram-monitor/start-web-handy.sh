#!/usr/bin/env bash
# ============================================================
#  Instagram Monitor – BROWSER-Oberfläche im HANDY-MODUS
#  Macht die Seite im lokalen WLAN erreichbar (z. B. Handy)
#  und zeigt die genaue Adresse inkl. Zugangscode an.
#  Handy und Rechner müssen im GLEICHEN WLAN sein.
# ============================================================
set -e
cd "$(dirname "$0")"

PY="$(command -v python3.12 || command -v python3 || true)"
if [ -z "$PY" ]; then
    echo "Python wurde nicht gefunden. Bitte Python 3.12+ installieren."
    exit 1
fi

if [ ! -x ".venv/bin/python" ]; then
    echo "Erste Einrichtung: virtuelle Umgebung wird angelegt …"
    "$PY" -m venv .venv
fi

echo "Abhängigkeiten werden geprüft …"
.venv/bin/python -m pip install --quiet -r requirements.txt

echo "Browser-Oberfläche startet im Handy-Modus …"
exec .venv/bin/python web.py --handy
