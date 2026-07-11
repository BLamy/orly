@echo off
REM ============================================================
REM  Instagram Monitor - BROWSER-Oberflaeche per Doppelklick
REM  Wie start.bat, startet aber die Web-Oberflaeche (web.py):
REM  Der Browser oeffnet sich unter http://127.0.0.1:8756/
REM ============================================================

cd /d "%~dp0"

set "PYCMD="
where py >nul 2>nul && set "PYCMD=py"
if not defined PYCMD where python >nul 2>nul && set "PYCMD=python"
if not defined PYCMD (
    echo.
    echo Python wurde nicht gefunden.
    echo Bitte Python 3.12 oder neuer installieren:
    echo    https://www.python.org/downloads/
    echo Wichtig: im Installer den Haken "Add python.exe to PATH" setzen,
    echo danach dieses Skript erneut starten.
    echo.
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo Erste Einrichtung: virtuelle Umgebung wird angelegt ...
    %PYCMD% -m venv .venv
    if errorlevel 1 (
        echo Anlegen der virtuellen Umgebung ist fehlgeschlagen.
        pause
        exit /b 1
    )
)

echo Abhaengigkeiten werden geprueft ...
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo Installation der Abhaengigkeiten ist fehlgeschlagen.
    echo Bitte Internetverbindung pruefen und erneut versuchen.
    pause
    exit /b 1
)

echo Browser-Oberflaeche startet ...
".venv\Scripts\python.exe" web.py
if errorlevel 1 pause
