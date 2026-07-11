"""
Zugriff auf öffentliche Instagram-Inhalte.
==========================================

Dieses Modul kapselt sämtliche Instagram-Zugriffe hinter der Klasse
:class:`InstagramDownloader`. Als Unterbau dient **Instaloader**
(https://instaloader.github.io/), ein etabliertes, dokumentiertes
Open-Source-Werkzeug.

Wichtige Grundsätze dieser Implementierung
------------------------------------------
* Standardmäßig werden nur **öffentlich zugängliche** Inhalte abgerufen –
  genau das, was auch ein nicht angemeldeter Besucher im Browser sähe.
* **Optionaler Login mit dem EIGENEN Konto:** Über die dokumentierte
  Instaloader-Anmeldung kann sich der Benutzer mit seinen eigenen
  Zugangsdaten einloggen. Das reduziert die Drosselung und erlaubt den
  Zugriff auf Konten, denen der Benutzer folgt (inkl. privater Konten, zu
  denen eine legitime Berechtigung besteht). Es werden dabei **keine**
  Schutzmechanismen umgangen – der Login ist der offizielle, von
  Instagram vorgesehene Weg. Die Zugangsdaten werden nicht im Klartext
  gespeichert; Instaloader legt lediglich eine Session-Datei (Cookies) an.
* **Private Profile ohne Berechtigung werden übersprungen.** Folgt der
  angemeldete Benutzer dem privaten Konto nicht, wird nicht darauf
  zugegriffen.
* **Rate-Limits werden respektiert:** Instaloader bringt eine eigene
  Ratenbegrenzung mit; zusätzlich legt der Monitor Pausen zwischen den
  Konten ein und prüft nur in dem vom Benutzer konfigurierten Intervall.
* Antwortet Instagram mit einer Sperre/Drosselung (HTTP 429 u. ä.), wird
  der Fehler protokolliert und der nächste reguläre Prüflauf abgewartet –
  es gibt keine aggressiven Wiederholungsversuche.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from itertools import islice
from pathlib import Path
from typing import TYPE_CHECKING, Callable, Optional

import instaloader
from instaloader.exceptions import (
    BadCredentialsException,
    ConnectionException,
    InstaloaderException,
    LoginRequiredException,
    ProfileNotExistsException,
    TwoFactorAuthRequiredException,
)

# PrivateProfileNotFollowedException gibt es erst in neueren Instaloader-
# Versionen; fällt zurück auf die Basisklasse, wenn nicht vorhanden.
try:
    from instaloader.exceptions import PrivateProfileNotFollowedException
except ImportError:  # pragma: no cover - versionsabhängig
    PrivateProfileNotFollowedException = InstaloaderException  # type: ignore

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


class LoginError(DownloaderError):
    """Die Anmeldung ist fehlgeschlagen (falsche Daten, abgebrochen …)."""


class TwoFactorRequired(DownloaderError):
    """Signalisiert intern, dass ein Zwei-Faktor-Code benötigt wird."""


@dataclass(frozen=True)
class PostInfo:
    """Leichtgewichtige, GUI-freundliche Beschreibung eines Beitrags."""

    shortcode: str          # eindeutige Kurz-ID (Teil der Beitrags-URL)
    username: str           # Konto, zu dem der Beitrag gehört
    post_type: str          # "Reel", "Video", "Album" oder "Bild"
    posted_at: str          # Veröffentlichungszeitpunkt (ISO, UTC)
    url: str                # Link zum Beitrag

    # Für die Web-Oberfläche (best effort, kann leer sein):
    thumbnail_url: str = ""  # Vorschaubild-URL (Instagram-CDN)
    caption: str = ""        # Anfang der Bildunterschrift

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

    def __init__(
        self, settings: "Settings", session_dir: Optional[Path] = None
    ) -> None:
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

        # Alle Loader-Zugriffe werden serialisiert: Der Monitor-Thread und
        # eine (aus der GUI angestoßene) Anmeldung teilen sich dieselbe
        # Instaloader-Instanz; deren Requests-Session ist nicht für echt
        # parallele Nutzung ausgelegt.
        self._lock = threading.RLock()

        # Ordner für die Session-Datei (Cookies) des angemeldeten Kontos.
        self._session_dir = Path(session_dir) if session_dir else None
        if self._session_dir:
            self._session_dir.mkdir(parents=True, exist_ok=True)

        # Beim Start eine zuvor gespeicherte Anmeldung wiederherstellen,
        # damit man sich nicht bei jedem Programmstart neu einloggen muss.
        self._restore_session()

    # ------------------------------------------------------------------
    # Anmeldung (optional, mit dem EIGENEN Konto)
    # ------------------------------------------------------------------
    @property
    def is_logged_in(self) -> bool:
        """True, wenn eine gültige Anmeldung aktiv ist."""
        return bool(getattr(self._loader.context, "is_logged_in", False))

    @property
    def logged_in_user(self) -> Optional[str]:
        """Benutzername des angemeldeten Kontos (oder None)."""
        return getattr(self._loader.context, "username", None)

    def _session_file(self, username: str) -> Optional[Path]:
        if not self._session_dir:
            return None
        return self._session_dir / f"session-{username.lower()}"

    def _restore_session(self) -> None:
        """Lädt – falls vorhanden – die gespeicherte Session beim Start."""
        username = self._settings.login_username
        session_file = self._session_file(username) if username else None
        if not username or not session_file or not session_file.exists():
            return
        try:
            self._loader.load_session_from_file(username, str(session_file))
            logger.info("Gespeicherte Anmeldung für @%s wiederhergestellt.", username)
        except Exception:
            logger.warning(
                "Gespeicherte Anmeldung für @%s konnte nicht geladen werden "
                "– bitte ggf. neu anmelden.",
                username,
                exc_info=True,
            )

    def login(
        self,
        username: str,
        password: str,
        two_factor_provider: Optional[Callable[[], Optional[str]]] = None,
    ) -> None:
        """Meldet sich mit dem eigenen Instagram-Konto an (offizieller Weg).

        Parameter:
          username, password  – Zugangsdaten des EIGENEN Kontos
          two_factor_provider – optionaler Callback, der bei aktivierter
                                 Zwei-Faktor-Authentifizierung den Code
                                 liefert (oder None bei Abbruch).

        Bei Erfolg wird die Session als Cookie-Datei gespeichert, sodass
        beim nächsten Start keine erneute Anmeldung nötig ist. Das
        Passwort wird NICHT gespeichert.
        """
        username = username.strip().lstrip("@").lower()
        if not username or not password:
            raise LoginError("Benutzername und Passwort dürfen nicht leer sein.")

        with self._lock:
            try:
                self._loader.login(username, password)
            except TwoFactorAuthRequiredException as exc:
                code = two_factor_provider() if two_factor_provider else None
                if not code:
                    # Eigener Ausnahmetyp, damit Aufrufer (z. B. die
                    # Web-Oberfläche) gezielt ein Code-Feld anbieten können.
                    raise TwoFactorRequired(
                        "Zwei-Faktor-Code erforderlich – bitte den Code aus "
                        "deiner Authenticator-App/SMS eingeben."
                    ) from exc
                try:
                    self._loader.two_factor_login(code.strip())
                except InstaloaderException as exc2:
                    raise LoginError(
                        f"Zwei-Faktor-Anmeldung fehlgeschlagen: {exc2}"
                    ) from exc2
            except BadCredentialsException as exc:
                raise LoginError("Benutzername oder Passwort ist falsch.") from exc
            except ConnectionException as exc:
                raise LoginError(
                    f"Anmeldung derzeit nicht möglich (Verbindung/Drosselung): {exc}"
                ) from exc
            except InstaloaderException as exc:
                raise LoginError(f"Anmeldung fehlgeschlagen: {exc}") from exc

            # Erfolgreich – Session speichern und Benutzernamen merken.
            self._settings.login_username = username
            session_file = self._session_file(username)
            if session_file:
                try:
                    self._loader.save_session_to_file(str(session_file))
                except OSError:
                    logger.warning(
                        "Session-Datei konnte nicht gespeichert werden.",
                        exc_info=True,
                    )
        logger.info("Erfolgreich angemeldet als @%s.", username)

    def logout(self) -> None:
        """Meldet ab und entfernt die gespeicherte Session."""
        username = self._settings.login_username
        with self._lock:
            session_file = self._session_file(username) if username else None
            if session_file and session_file.exists():
                try:
                    session_file.unlink()
                except OSError:
                    logger.debug("Session-Datei konnte nicht gelöscht werden.")
            # Neue, anonyme Loader-Instanz erzeugen.
            self._loader = instaloader.Instaloader(
                quiet=True,
                download_video_thumbnails=False,
                save_metadata=False,
                compress_json=False,
                post_metadata_txt_pattern="",
            )
        self._settings.login_username = ""
        logger.info("Abgemeldet.")

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
        with self._lock:
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
                results = instaloader.TopSearchResults(
                    self._loader.context, username
                )
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

        # Private Profile: nur zugreifen, wenn der ANGEMELDETE Benutzer dem
        # Konto folgt (dann liefert Instaloader die Beiträge legitim).
        # Ohne Anmeldung bzw. ohne Berechtigung wird nicht zugegriffen.
        if profile_is_private and not self.is_logged_in:
            raise ProfileIsPrivate(
                f"@{username} ist privat – ohne Anmeldung kein Zugriff. "
                "Melde dich mit deinem eigenen Konto an; Zugriff besteht nur "
                "auf private Konten, denen du folgst."
            )

        posts = self._collect_posts(
            profile, limit=self._settings.posts_per_check, is_known=is_known
        )
        # Älteste zuerst zurückgeben, damit Benachrichtigungen und Downloads
        # in chronologischer Reihenfolge erfolgen.
        posts.reverse()
        return posts

    def list_recent_posts(self, username: str, limit: int) -> list[PostInfo]:
        """Liefert die neuesten ``limit`` Beiträge – für den MANUELLEN Download.

        Anders als :meth:`fetch_new_posts` filtert diese Methode nicht nach
        "schon bekannt": Der Benutzer will damit gezielt vorhandene Inhalte
        herunterladen. Doppelte Dateien werden trotzdem vermieden, weil
        Instaloader vorhandene Dateien überspringt und die Datenbank den
        Download-Status führt.
        """
        try:
            profile = self._get_profile(username)
            profile_is_private = profile.is_private
        except ProfileNotExistsException as exc:
            raise TemporaryError(
                f"Profil @{username} konnte nicht geladen werden: {exc}"
            ) from exc
        except ConnectionException as exc:
            raise TemporaryError(
                f"Verbindungsproblem bei @{username}: {exc}"
            ) from exc
        except InstaloaderException as exc:
            raise TemporaryError(f"Fehler bei @{username}: {exc}") from exc

        if profile_is_private and not self.is_logged_in:
            raise ProfileIsPrivate(
                f"@{username} ist privat – ohne Anmeldung kein Zugriff. "
                "Melde dich mit deinem eigenen Konto an (nur Konten, denen "
                "du folgst)."
            )

        return self._collect_posts(profile, limit=max(1, int(limit)), is_known=None)

    def _collect_posts(
        self,
        profile: "instaloader.Profile",
        limit: int,
        is_known: Optional[Callable[[str], bool]],
    ) -> list[PostInfo]:
        """Iteriert die neuesten ``limit`` Beiträge eines Profils.

        ``is_known`` (optional) filtert bereits bekannte Beiträge heraus.
        Die Iteration wird unter dem Loader-Lock ausgeführt.
        """
        username = profile.username
        collected: list[PostInfo] = []
        try:
            with self._lock:
                # islice: nur die N neuesten Beiträge anfassen.
                for post in islice(profile.get_posts(), limit):
                    if is_known is not None and is_known(post.shortcode):
                        continue
                    # Vorschaubild/Beschriftung sind Komfort für die
                    # Web-Oberfläche – Fehler dabei sind unkritisch.
                    try:
                        thumbnail = post.url or ""
                    except Exception:
                        thumbnail = ""
                    try:
                        caption = (post.caption or "")[:140]
                    except Exception:
                        caption = ""
                    collected.append(
                        PostInfo(
                            shortcode=post.shortcode,
                            username=username,
                            post_type=_classify_post(post),
                            posted_at=post.date_utc.isoformat(timespec="seconds"),
                            url=f"https://www.instagram.com/p/{post.shortcode}/",
                            thumbnail_url=thumbnail,
                            caption=caption,
                            raw=post,
                        )
                    )
        except PrivateProfileNotFollowedException as exc:
            raise ProfileIsPrivate(
                f"@{username} ist privat und du folgst dem Konto nicht – "
                "kein Zugriff."
            ) from exc
        except LoginRequiredException as exc:
            raise TemporaryError(
                f"Für @{username} ist eine Anmeldung erforderlich: {exc}"
            ) from exc
        except ConnectionException as exc:
            raise TemporaryError(
                f"Verbindungsproblem beim Lesen der Beiträge von @{username}: {exc}"
            ) from exc
        except InstaloaderException as exc:
            raise TemporaryError(
                f"Fehler beim Lesen der Beiträge von @{username}: {exc}"
            ) from exc
        return collected

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

        with self._lock:
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
