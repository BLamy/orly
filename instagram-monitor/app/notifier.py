"""
Desktop-Benachrichtigungen.
===========================

Kapselt die Benachrichtigung des Benutzers über neue Beiträge.

Verwendet wird **plyer** (plattformübergreifend: Windows, macOS, Linux).
plyer ist bewusst eine *optionale* Abhängigkeit: Ist es nicht installiert
oder schlägt die Benachrichtigung fehl (z. B. headless-System ohne
Benachrichtigungsdienst), arbeitet die Anwendung normal weiter – die
Meldung erscheint dann nur im Log-Fenster der GUI und in der Log-Datei.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

try:
    from plyer import notification as _plyer_notification
except Exception:  # ImportError oder plattformspezifische Fehler beim Import
    _plyer_notification = None
    logger.debug("plyer nicht verfügbar – Desktop-Benachrichtigungen deaktiviert.")


class Notifier:
    """Sendet Desktop-Benachrichtigungen, wenn möglich."""

    APP_NAME = "Instagram Monitor"

    def __init__(self) -> None:
        # Merker, damit ein dauerhaft kaputter Benachrichtigungsdienst
        # nicht bei jedem Beitrag einen neuen Fehlversuch produziert.
        self._disabled = _plyer_notification is None

    def notify(self, title: str, message: str) -> None:
        """Zeigt eine Desktop-Benachrichtigung an (best effort).

        Fehler führen niemals zum Abbruch – Benachrichtigungen sind ein
        Komfort-Feature, keine Kernfunktion.
        """
        if self._disabled:
            return
        try:
            _plyer_notification.notify(
                title=title,
                message=message,
                app_name=self.APP_NAME,
                timeout=10,  # Sekunden, sofern die Plattform das unterstützt
            )
        except Exception:
            # Ein einziger Fehlversuch genügt: künftig nur noch Log-Ausgabe.
            logger.warning(
                "Desktop-Benachrichtigung fehlgeschlagen – weitere Meldungen "
                "erscheinen nur im Log.",
                exc_info=True,
            )
            self._disabled = True
