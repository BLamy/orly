"""
Zugriff auf öffentliche Instagram-Inhalte.
==========================================

Dieses Modul kapselt sämtliche Instagram-Zugriffe hinter der Klasse
:class:`InstagramDownloader`. Als Unterbau dient **Instaloader**
(https://instaloader.github.io/), ein etabliertes, dokumentiertes
Open-Source-Werkzeug.

Wichtige Grundsätze dieser Implementierung
------------------------------------------
* Es werden ausschließlich **öffentlich zugängliche** Inhalte abgerufen –
  genau das, was auch ein nicht angemeldeter Besucher im Browser sähe.
* **Private Profile werden übersprungen.** Die Anwendung versucht nicht,
  Zugriffsbeschränkungen, Logins oder sonstige Schutzmechanismen zu
  umgehen.
* **Rate-Limits werden respektiert:** Instaloader bringt eine eigene
  Ratenbegrenzung mit; zusätzlich legt der Monitor Pausen zwischen den
  Konten ein und prüft nur in dem vom Benutzer konfigurierten Intervall.
* Antwortet Instagram mit einer Sperre/Drosselung (HTTP 429 u. ä.), wird
  der Fehler protokolliert und der nächste reguläre Prüflauf abgewartet –
  es gibt keine aggressiven Wiederholungsversuche.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from itertools import islice
from pathlib import Path
from typing import TYPE_CHECKING, Optional

import instaloader
from instaloader.exceptions import (
    ConnectionException,
    InstaloaderException,
    ProfileNotExistsException,
)

if TYPE_CHECKING:  # nur für Typprüfung, vermeidet Importzyklen zur Laufzeit
    from .settings import Settings

logger = logging.getLogger(__name__)


# ----------------------------------------------------------------------
# Eigene, sprechende Ausnahmen – die restliche Anwendung muss dadurch
# keine Instaloader-Interna kennen.
# ----------------------------------------------------------------------
class DownloaderError(Exception):
    """Basisklasse für alle Fehler dieses Moduls."""


class ProfileNotFound(DownloaderError):
    """Das angegebene Profil existiert nicht."""


class ProfileIsPrivate(DownloaderError):
    """Das Profil ist privat – ohne Berechtigung kein Zugriff (gewollt)."""


class TemporaryError(DownloaderError):
    """Vorübergehender Fehler (Netzwerk, Drosselung) – später erneut versuchen."""


@dataclass(frozen=True)
class PostInfo:
    """Leichtgewichtige, GUI-freundliche Beschreibung eines Beitrags."""

    shortcode: str          # eindeutige Kurz-ID (Teil der Beitrags-URL)
    username: str           # Konto, zu dem der Beitrag gehört
    post_type: str          # "Reel", "Video", "Album" oder "Bild"
    posted_at: str          # Veröffentlichungszeitpunkt (ISO, UTC)
    url: str                # Link zum Beitrag

    # Das originale Instaloader-Post-Objekt (nur intern; spart beim
    # Download eine erneute Netzanfrage). Von Vergleich/Repr ausgenommen.
    raw: Optional[object] = field(default=None, repr=False, compare=False)

    @property
    def is_reel(self) -> bool:
        return self.post_type == "Reel"


def _classify_post(post: "instaloader.Post") -> str:
    """Bestimmt den Beitragstyp für Anzeige und Datenbank.

    Reel-Erkennung ist "best effort": Instaloader stellt keine eigene
    Property dafür bereit; das rohe API-Feld ``product_type == "clips"``
    kennzeichnet Reels, ist aber nicht in jedem Feed-Knoten enthalten.
    Videos, die nicht sicher zuzuordnen sind, werden ehrlich als
    "Video/Reel" bezeichnet – für Benachrichtigung und Download ist die
    Unterscheidung ohnehin unerheblich.
    """
    try:
        node = getattr(post, "_node", None) or {}
        if node.get("product_type") == "clips":  # rohes API-Feld, best effort
            return "Reel"
        if post.typename == "GraphSidecar":
            return "Album"
        if post.is_video:
            return "Video/Reel"
    except Exception:  # defensive: Metadaten-Zugriffe können nachladen & scheitern
        logger.debug("Beitragstyp konnte nicht bestimmt werden.", exc_info=True)
    return "Bild"


class InstagramDownloader:
    """Prüft öffentliche Profile auf neue Beiträge und lädt sie herunter."""

    def __init__(self, settings: "Settings") -> None:
        self._settings = settings

        # Instaloader-Instanz: bewusst "leise" und sparsam konfiguriert –
        # nur die Medien selbst, keine Metadaten-/Kommentar-Dateien.
        self._loader = instaloader.Instaloader(
            quiet=True,                    # keine Ausgaben auf stdout (wir loggen selbst)
            download_video_thumbnails=False,
            save_metadata=False,           # keine .json.xz-Metadaten
            compress_json=False,
            post_metadata_txt_pattern="",  # keine .txt-Begleitdateien
        )

    # ------------------------------------------------------------------
    # Profil-Zugriff
    # ------------------------------------------------------------------
    def _get_profile(self, username: str) -> "instaloader.Profile":
        """Löst einen Benutzernamen in ein Profil auf – mit Fallback.

        ``Profile.from_username`` basiert auf einer Instagram-**Suche**.
        Anonymen Clients liefert diese Suche häufig leere Ergebnisse, und
        Instaloader meldet dann fälschlich "Profile does not exist", obwohl
        das Profil existiert. Deshalb:

          1. regulärer Weg über ``Profile.from_username``
          2. bei "nicht gefunden": zweiter, unabhängiger Suchweg über die
             Top-Suche (``TopSearchResults``)
          3. Nur wenn eine Suche nachweislich Ergebnisse liefert und das
             Profil nicht dabei ist → :class:`ProfileNotFound`.
             Liefern beide Wege nichts, ist eine anonyme Drosselung am
             wahrscheinlichsten → :class:`TemporaryError` (wird beim
             nächsten Prüflauf automatisch erneut versucht).
        """
        try:
            return instaloader.Profile.from_username(
                self._loader.context, username
            )
        except ProfileNotExistsException:
            logger.debug(
                "@%s: reguläre Namensauflösung ohne Treffer – "
                "Top-Suche wird als zweiter Weg versucht.",
                username,
            )

        search_had_results = False
        try:
            results = instaloader.TopSearchResults(self._loader.context, username)
            for profile in results.get_profiles():
                search_had_results = True
                if profile.username.lower() == username.lower():
                    return profile
        except InstaloaderException:
            logger.debug("Top-Suche nicht verfügbar.", exc_info=True)

        if search_had_results:
            # Die Suche funktioniert und liefert andere Profile – der
            # gesuchte Name ist also wirklich nicht dabei.
            raise ProfileNotFound(
                f"Profil @{username} wurde in der Instagram-Suche nicht "
                "gefunden – bitte die Schreibweise prüfen."
            )
        raise TemporaryError(
            f"@{username}: Instagram beantwortet anonyme Profil-Abfragen "
            "derzeit nicht (übliche Drosselung) – oder das Profil existiert "
            "nicht. Nächster Versuch beim kommenden Prüflauf."
        )

    def fetch_new_posts(self, username: str, is_known) -> list[PostInfo]:
        """Liefert die noch unbekannten unter den neuesten Beiträgen.

        Parameter:
          username – zu prüfendes Konto
          is_known – Callback ``(shortcode: str) -> bool``; True, wenn der
                     Beitrag bereits registriert ist. So bleibt dieses
                     Modul frei von Datenbank-Wissen.

        Es werden nur die ``posts_per_check`` neuesten Beiträge betrachtet
        (Instaloader liefert sie neueste zuerst). Das reicht für eine
        Überwachung im Minuten-/Stundentakt völlig aus und hält die Zahl
        der Anfragen klein.
        """
        try:
            profile = self._get_profile(username)
            # WICHTIG: is_private ist eine "faule" Property – der Zugriff
            # kann Metadaten nachladen und dabei Instaloader-Ausnahmen
            # werfen. Deshalb wird sie HIER, innerhalb des try-Blocks,
            # gelesen.
            profile_is_private = profile.is_private
        except ProfileNotExistsException as exc:
            # Kann noch aus dem faulen Metadaten-Nachladen kommen; die
            # Namensauflösung selbst behandelt _get_profile differenziert.
            raise TemporaryError(
                f"Profil @{username} konnte nicht geladen werden: {exc}"
            ) from exc
        except ConnectionException as exc:
            # Netzwerkfehler ODER Drosselung durch Instagram (z. B. 429).
            raise TemporaryError(
                f"Verbindungsproblem bei @{username}: {exc}"
            ) from exc
        except InstaloaderException as exc:
            raise TemporaryError(f"Fehler bei @{username}: {exc}") from exc

        # Private Profile: bewusst KEIN Zugriffsversuch. Ohne Berechtigung
        # sind die Inhalte nicht öffentlich – die Anwendung respektiert das.
        if profile_is_private:
            raise ProfileIsPrivate(
                f"@{username} ist privat – wird nicht abgerufen (Zugriff nur "
                "mit Berechtigung; die Anwendung umgeht keine Beschränkungen)."
            )

        new_posts: list[PostInfo] = []
        try:
            # islice: nur die N neuesten Beiträge anfassen, nicht das ganze Profil.
            for post in islice(profile.get_posts(), self._settings.posts_per_check):
                if is_known(post.shortcode):
                    # Sobald ein bekannter Beitrag auftaucht, könnten wir
                    # theoretisch abbrechen; wir prüfen aber alle N, weil
                    # angepinnte Beiträge die Reihenfolge verändern können.
                    continue
                new_posts.append(
                    PostInfo(
                        shortcode=post.shortcode,
                        username=username,
                        post_type=_classify_post(post),
                        posted_at=post.date_utc.isoformat(timespec="seconds"),
                        url=f"https://www.instagram.com/p/{post.shortcode}/",
                        raw=post,
                    )
                )
        except ConnectionException as exc:
            raise TemporaryError(
                f"Verbindungsproblem beim Lesen der Beiträge von @{username}: {exc}"
            ) from exc
        except InstaloaderException as exc:
            raise TemporaryError(
                f"Fehler beim Lesen der Beiträge von @{username}: {exc}"
            ) from exc

        # Älteste zuerst zurückgeben, damit Benachrichtigungen und Downloads
        # in chronologischer Reihenfolge erfolgen.
        new_posts.reverse()
        return new_posts

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------
    def download_post(self, post_info: PostInfo) -> bool:
        """Lädt einen einzelnen Beitrag in den konfigurierten Ordner.

        Zielstruktur: ``<download_dir>/<username>/…``

        Rückgabe: immer True – der Beitrag liegt danach lokal vor, egal ob
        er frisch heruntergeladen wurde oder bereits vollständig vorhanden
        war (Instaloader überspringt vorhandene Dateien). Fehler werden
        ausschließlich als :class:`TemporaryError` gemeldet, damit der
        Monitor den Download beim nächsten Prüflauf erneut versucht.
        """
        download_dir: Path = self._settings.download_dir

        # Der Zielordner kann sich zur Laufzeit ändern (Einstellungen),
        # deshalb wird das Muster vor jedem Download aktualisiert.
        # "{target}" ersetzt Instaloader durch den übergebenen target-Namen.
        self._loader.dirname_pattern = str(download_dir / "{target}")

        try:
            # Das beim Abruf gemerkte Post-Objekt wiederverwenden; nur zur
            # Sicherheit (z. B. nach Deserialisierung) neu laden.
            post = post_info.raw
            if post is None:
                post = instaloader.Post.from_shortcode(
                    self._loader.context, post_info.shortcode
                )
            # Instaloader überspringt bereits vorhandene Dateien von selbst –
            # zusätzlich verhindert unsere Datenbank Doppel-Downloads.
            saved = self._loader.download_post(post, target=post_info.username)
            if saved:
                logger.info(
                    "Beitrag %s (@%s, %s) gespeichert unter %s",
                    post_info.shortcode,
                    post_info.username,
                    post_info.post_type,
                    download_dir / post_info.username,
                )
            else:
                logger.info(
                    "Beitrag %s (@%s) war bereits vollständig vorhanden.",
                    post_info.shortcode,
                    post_info.username,
                )
            # In beiden Fällen liegt der Inhalt jetzt lokal vor.
            return True
        except ConnectionException as exc:
            raise TemporaryError(
                f"Download von {post_info.shortcode} fehlgeschlagen "
                f"(Verbindung/Drosselung): {exc}"
            ) from exc
        except InstaloaderException as exc:
            raise TemporaryError(
                f"Download von {post_info.shortcode} fehlgeschlagen: {exc}"
            ) from exc
        except OSError as exc:
            # z. B. Zielordner nicht beschreibbar, Datenträger voll …
            raise TemporaryError(
                f"Beitrag {post_info.shortcode} konnte nicht gespeichert "
                f"werden: {exc}"
            ) from exc
