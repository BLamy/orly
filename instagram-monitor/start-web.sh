#!/usr/bin/env bash
# ============================================================
#  Instagram Monitor – BROWSER-Oberfläche (Linux/macOS)
#  Wie start.sh, startet aber die Web-Oberfläche (web.py):
#  Der Browser öffnet sich unter http://127.0.0.1:8756/
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

echo "Browser-Oberfläche startet …"
exec .venv/bin/python web.py
