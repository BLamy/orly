@echo off
REM ============================================================
REM  Instagram Monitor - Start per Doppelklick (Windows)
REM  Erledigt beim ersten Start automatisch die ganze Einrichtung:
REM    1. Python suchen (py-Launcher oder python im PATH)
REM    2. virtuelle Umgebung .venv anlegen
REM    3. Abhaengigkeiten aus requirements.txt installieren
REM    4. Anwendung starten
REM  Ab dem zweiten Start geht es direkt zur Anwendung.
REM ============================================================

REM In den Ordner dieses Skripts wechseln (egal von wo gestartet)
cd /d "%~dp0"

REM ---- 1. Python finden -------------------------------------
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

REM ---- 2. virtuelle Umgebung (nur beim ersten Start) ---------
if not exist ".venv\Scripts\python.exe" (
    echo Erste Einrichtung: virtuelle Umgebung wird angelegt ...
    %PYCMD% -m venv .venv
    if errorlevel 1 (
        echo Anlegen der virtuellen Umgebung ist fehlgeschlagen.
        pause
        exit /b 1
    )
)

REM ---- 3. Abhaengigkeiten installieren/pruefen ---------------
echo Abhaengigkeiten werden geprueft ...
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo Installation der Abhaengigkeiten ist fehlgeschlagen.
    echo Bitte Internetverbindung pruefen und erneut versuchen.
    pause
    exit /b 1
)

REM ---- 4. Anwendung starten ----------------------------------
echo Anwendung startet ...
".venv\Scripts\python.exe" main.py
if errorlevel 1 pause
