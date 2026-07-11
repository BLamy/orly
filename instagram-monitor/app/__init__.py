"""
Instagram-Monitor – Anwendungspaket.

Die Anwendung ist bewusst modular aufgebaut; jede Datei hat genau eine
Verantwortung (Single-Responsibility-Prinzip):

  database.py       – SQLite-Persistenz
  settings.py       – Einstellungsverwaltung
  downloader.py     – Zugriff auf öffentliche Instagram-Inhalte
  monitor.py        – Hintergrundüberwachung
  notifier.py       – Desktop-Benachrichtigungen
  logging_setup.py  – Logging-Konfiguration
  gui.py            – CustomTkinter-Oberfläche
"""

__version__ = "1.0.0"
