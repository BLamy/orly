#!/usr/bin/env bash
# ============================================================
#  Instagram Monitor – Start per Skript (Linux/macOS)
#  Erledigt beim ersten Start automatisch die ganze Einrichtung
#  (virtuelle Umgebung + Abhängigkeiten) und startet die App.
# ============================================================
set -e
cd "$(dirname "$0")"

# Python finden: bevorzugt 3.12, sonst das allgemeine python3
PY="$(command -v python3.12 || command -v python3 || true)"
if [ -z "$PY" ]; then
    echo "Python wurde nicht gefunden. Bitte Python 3.12+ installieren."
    exit 1
fi

# Virtuelle Umgebung nur beim ersten Start anlegen
if [ ! -x ".venv/bin/python" ]; then
    echo "Erste Einrichtung: virtuelle Umgebung wird angelegt …"
    "$PY" -m venv .venv
fi

echo "Abhängigkeiten werden geprüft …"
.venv/bin/python -m pip install --quiet -r requirements.txt

echo "Anwendung startet …"
exec .venv/bin/python main.py
