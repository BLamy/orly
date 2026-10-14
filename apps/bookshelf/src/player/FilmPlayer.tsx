/**
 * The film player (?film=<slug>): a tape goes into the VCR.
 *
 * Films are not pre-rendered video on the shelf: the reel is painted live in
 * the browser, frame by frame, from the same shot modules the frame-exact
 * renderer uses (viz/film). The soundtrack is published as STEMS (one file per
 * narration line and per music cue, manifest.film.audio.stems): the player places
 * every line on the SAME timeline the picture paints from (the editor's importer:
 * line clip sample 0 at shot.start + line.start − speechStart; cues at cue.start,
 * ducked under the voice) and plays them through the editor's audio engine, whose
 * clock drives the picture. So a line always starts where its shot expects it, and
 * the gaps are the composed music or silence. Older publishes (pre-mixed chapter
 * slices) still play; a film with no audio plays silently on a wall clock.
 *
 * Chrome is a nod to the VCR — an insert-and-track moment, "▶ PLAY" / "❚❚ PAUSE"
 * on-screen display, an SP counter, EJECT — and never touches the picture itself.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FILM_H, FILM_W, type FilmTimelineData } from '../viz/film/contracts';
import { FilmStack, useFilm } from '../viz/film/core/harness';
import { loadTimeline } from '../viz/film/core/shot';
import type { ReelOverlay } from '../viz/film/core/reel';
import { ASSET_BASE } from '../library/shared';
import { screenScroller } from '../shell/screenScroller';
import { importFilmReport, type FilmImportData } from '../editor/model/importFilm';
import { createAudioEngine, type EditorAudioEngine } from '../editor/engine/audio';
import { SourcesPanel, type SourcesDoc } from './SourcesPanel';
import { CreditsPanel, type CreditsDoc } from './CreditsPanel';
import { ScoreCard, type Score } from './ScoreCard';
import { PlayerSheet, type SheetTab } from './PlayerSheet';
import { PlayIcon } from './icons';
import { PORTRAIT_COMPACT_MQ, useMediaQuery } from './useMediaQuery';
import { useVideoAccent } from '../shell/useVideoAccent';
import './film-player.css';

interface FilmChapter {
  number: number;
  title: string;
  audio?: string;
  filmStart: number;
  duration: number;
}
interface FilmManifest {
  kind?: string;
  title?: string;
  subtitle?: string;
  chapters?: FilmChapter[];
  /** film.sources: the sources page (every claim and quotation, chapter by chapter), relative to the film's folder;
   *  film.audio.stems: the per-line / per-cue soundtrack (generator/film/lib/stems.mjs) */
  film?: { sources?: string; sourcesData?: string; credits?: string; review?: string; audio?: { stems?: string; clock?: number } };
}
/** the latest critic round (generator/film/publish.mjs → review.json) */
interface FilmReview {
  round: number;
  at: string | null;
  pass: boolean;
  mean: number | null;
  bar: number;
  floor: number;
  scores: Record<string, number>;
  notes: Record<string, string>;
  summary: string;
}
const W = 1280;
const H = Math.round((W * FILM_H) / FILM_W);
const OSD_MS = 2400;

const mmss = (s: number) => {
  const x = Math.max(0, Math.round(s));
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
};
const clock = (s: number) => {
  const x = Math.max(0, Math.floor(s));
  return `${Math.floor(x / 3600)}:${String(Math.floor((x % 3600) / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};

/** onEject: leave the VCR (the shelf's navigation stack pops this screen); without it, EJECT loads the shelf */
/** can this browser decode a stem with Web Audio? (Safari's decodeAudioData rejects AAC in MP4: "Decoding failed") */
async function canDecode(url: string): Promise<boolean> {
  try {
    const ab = await fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))));
    await new OfflineAudioContext(1, 1, 48000).decodeAudioData(ab);
    return true;
  } catch {
    return false;
  }
}

type CardTab = 'score' | 'sources' | 'music';

export function FilmPlayer({ slug, onEject }: { slug: string; onEject?: () => void }) {
  const [cardTab, setCardTab] = useState<CardTab>('score');
  const { reel, error } = useFilm(slug, W, H);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const finishRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [manifest, setManifest] = useState<FilmManifest | null>(null);
  const [timeline, setTimeline] = useState<FilmTimelineData | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlays, setOverlays] = useState<ReelOverlay[]>([]);
  const [osd, setOsd] = useState<{ text: string; until: number } | null>(null);
  const [inserted, setInserted] = useState(false);
  const [cc, setCc] = useState(false);
  const tRef = useRef(0);
  const chapterRef = useRef(-1);
  const wallRef = useRef<{ t0: number; at: number } | null>(null);
  const engineRef = useRef<EditorAudioEngine | null>(null);
  const [stemsReady, setStemsReady] = useState(false);
  const [review, setReview] = useState<FilmReview | null>(null);
  const [sourcesDoc, setSourcesDoc] = useState<SourcesDoc | null>(null);
  const [creditsDoc, setCreditsDoc] = useState<CreditsDoc | null>(null);
  // fullscreen: the screen and its own overlay controls go fullscreen together
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState(false);
  const [chrome, setChrome] = useState(true);
  const idleRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = 'Now playing…';
    document.body.classList.add('fp-body');
    let dead = false;
    fetch(`${ASSET_BASE}generated/${slug}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((m) => !dead && setManifest(m ?? {}));
    loadTimeline(slug)
      .then((d) => !dead && setTimeline(d))
      .catch(() => {});
    return () => {
      dead = true;
      document.body.classList.remove('fp-body');
    };
  }, [slug]);

  useEffect(() => {
    if (manifest?.title) document.title = `▶ ${manifest.title}`;
  }, [manifest]);

  // the latest critic round, shown under the deck
  const reviewUrl = manifest?.film?.review;
  useEffect(() => {
    if (!reviewUrl) return;
    let dead = false;
    fetch(`${ASSET_BASE}generated/${slug}/${reviewUrl}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => !dead && setReview(r))
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [reviewUrl, slug]);

  // the sources (claims + quotations with links), shown under the scores
  const sourcesData = manifest?.film?.sourcesData ?? (manifest?.film?.sources ? 'sources.json' : undefined);
  useEffect(() => {
    if (!sourcesData) return;
    let dead = false;
    fetch(`${ASSET_BASE}generated/${slug}/${sourcesData}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !dead && d?.chapters && setSourcesDoc(d))
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [sourcesData, slug]);

  // credits (models, tools, a strudel.cc link per cue), at the foot of the page
  const creditsUrl = manifest?.film?.credits;
  useEffect(() => {
    if (!creditsUrl) return;
    let dead = false;
    fetch(`${ASSET_BASE}generated/${slug}/${creditsUrl}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !dead && d?.roles && setCreditsDoc(d))
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [creditsUrl, slug]);

  // fullscreen: the Fullscreen API where the browser allows it on an element (desktop, Android, iPad); otherwise
  // (iPhone Safari only fullscreens <video>) a CSS fullscreen that fills the visible viewport. `full` covers both.
  const [pseudo, setPseudo] = useState(false);
  const [portraitHint, setPortraitHint] = useState(false);
  const touch = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches, []);
  useEffect(() => {
    const on = () => setFull(!!shellRef.current && document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', on);
    document.addEventListener('webkitfullscreenchange', on);
    return () => {
      document.removeEventListener('fullscreenchange', on);
      document.removeEventListener('webkitfullscreenchange', on);
    };
  }, []);
  useEffect(() => {
    if (!pseudo) return;
    setFull(true);
    document.body.classList.add('fp-locked');
    return () => {
      document.body.classList.remove('fp-locked');
      setFull(false);
    };
  }, [pseudo]);
  const toggleFull = useCallback(() => {
    if (pseudo) return setPseudo(false);
    if (document.fullscreenElement) return void document.exitFullscreen();
    const el = shellRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void }) | null;
    const req = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
    const fallback = () => {
      setPseudo(true);
      if (window.matchMedia?.('(orientation: portrait)').matches) {
        setPortraitHint(true);
        window.setTimeout(() => setPortraitHint(false), 3000);
      }
    };
    if (!req || !document.fullscreenEnabled) return fallback();
    Promise.resolve(req())
      .then(() => {
        // phones: prefer landscape while fullscreen (Android Chrome; ignored where unsupported)
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        if (touch) o?.lock?.('landscape').catch(() => {});
      })
      .catch(fallback);
  }, [pseudo, touch]);
  const chromeRef = useRef(chrome);
  chromeRef.current = chrome;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  /** show the fullscreen controls on activity; hide them after 2.5 s while playing */
  const poke = useCallback(() => {
    setChrome(true);
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setChrome(false), 2500);
  }, []);
  useEffect(() => {
    if (!playing) setChrome(true);
  }, [playing]);

  // the stems soundtrack: placed on the reel's own timeline, so sound and picture share one clock
  const stemsUrl = manifest?.film?.audio?.stems;
  useEffect(() => {
    if (!stemsUrl || !reel) return;
    let dead = false;
    const base = `${ASSET_BASE}generated/${slug}/`;
    (async () => {
      const r = await fetch(base + stemsUrl);
      if (!r.ok) throw new Error(`${stemsUrl}: HTTP ${r.status}`);
      const fa = (await r.json()) as Omit<FilmImportData, 'timeline'> & { clips: { url: string }[]; renders: { url: string }[] };
      const abs = <T extends { url: string }>(xs: T[]) => xs.map((x) => ({ ...x, url: base + x.url }));
      const data = { ...fa, slug, clips: abs(fa.clips), renders: abs(fa.renders), timeline: reel.data } as unknown as FilmImportData;
      const { project, warnings } = importFilmReport(data, { mediaUrl: (_s, p) => base + p });
      if (warnings.length) console.warn(`[film] soundtrack: ${warnings.length} note(s)`, warnings.slice(0, 8));
      const audioOnly = { ...project, tracks: project.tracks.filter((tr) => tr.kind === 'audio') };
      // Safari can't decode the stems (decodeAudioData rejects AAC in an MP4 container): when the film also ships
      // its mastered mix per chapter, play that through the <audio> element instead, as books play their MP3s
      const sliced = (manifest?.chapters ?? []).some((c) => c.audio);
      if (sliced && fa.clips[0] && !(await canDecode(base + fa.clips[0].url))) {
        console.info('[film] this browser cannot decode the soundtrack stems; playing the chapter mix');
        return;
      }
      if (dead) return;
      engineRef.current = createAudioEngine(audioOnly, {
        onEnded: () => {
          setPlaying(false);
          flashRef.current('■ STOP');
        },
      });
      setStemsReady(true);
      // read-only probe for automated sync checks (tools/film/player-sync.mjs)
      (window as unknown as { __filmPlayer?: unknown }).__filmPlayer = {
        stems: true,
        now: () => engineRef.current?.now() ?? null,
        playing: () => !!engineRef.current?.playing,
        events: () => audioOnly.tracks.map((tr) => ({ track: tr.name, n: tr.events.length })),
        lineAt: (t: number) => {
          const tr = audioOnly.tracks.find((x) => x.events.some((e) => e.mediaId.includes('L0')));
          const e = tr?.events.find((ev) => t >= ev.start && t < ev.start + ev.length);
          return e ? { media: e.mediaId, start: e.start } : null;
        },
      };
    })().catch((e) => console.error('[film] soundtrack failed to load; playing on the chapter audio or a wall clock', e));
    return () => {
      dead = true;
      engineRef.current?.dispose();
      engineRef.current = null;
      setStemsReady(false);
    };
  }, [stemsUrl, reel, slug, manifest]);

  const chapters: FilmChapter[] = useMemo(() => {
    const fromManifest = (manifest?.chapters ?? []).filter((c) => c.audio).sort((a, b) => a.filmStart - b.filmStart);
    if (fromManifest.length) return fromManifest;
    return (timeline?.chapters ?? []).map((c) => ({ number: c.number, title: c.title, filmStart: c.start, duration: c.end - c.start }));
  }, [manifest, timeline]);
  const hasSlices = chapters.some((c) => c.audio);
  const hasAudio = stemsReady || hasSlices;
  const duration = reel?.duration ?? timeline?.duration ?? 0;

  const lines = useMemo(
    () => (timeline?.shots ?? []).flatMap((s) => s.lines.map((l) => ({ start: s.start + l.start, end: s.start + l.end, text: l.text }))),
    [timeline],
  );
  const caption = cc ? lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.4)?.text : undefined;

  const flash = useCallback((text: string) => setOsd({ text, until: performance.now() + OSD_MS }), []);
  const flashRef = useRef(flash);
  flashRef.current = flash;

  const chapterAt = useCallback(
    (time: number) => {
      let i = 0;
      for (let k = 0; k < chapters.length; k++) if (time >= chapters[k].filmStart - 1e-3) i = k;
      return i;
    },
    [chapters],
  );

  /** Point the audio element at the chapter holding `time` and seek inside it. */
  const cueAudio = useCallback(
    (time: number) => {
      const a = audioRef.current;
      if (!a || !hasSlices || stemsReady) return;
      const i = chapterAt(time);
      const ch = chapters[i];
      if (chapterRef.current !== i && ch.audio) {
        chapterRef.current = i;
        a.src = `${ASSET_BASE}generated/${slug}/${ch.audio}`;
      }
      const local = Math.max(0, time - ch.filmStart);
      const apply = () => {
        try {
          a.currentTime = local;
        } catch {
          /* not seekable yet */
        }
      };
      if (a.readyState >= 1) apply();
      else a.addEventListener('loadedmetadata', apply, { once: true });
    },
    [chapterAt, chapters, hasSlices, stemsReady, slug],
  );

  const paint = useCallback(
    (time: number) => {
      const sc = sceneRef.current?.getContext('2d');
      if (!reel || !sc) return;
      const info = reel.render(time, sc, finishRef.current?.getContext('2d'));
      setOverlays((prev) => (prev.length || info.overlays.length ? info.overlays : prev));
    },
    [reel],
  );

  // first frame once the reel is ready
  useEffect(() => {
    if (reel) paint(tRef.current);
  }, [reel, paint]);

  // the VCR: insert, track, then wait for PLAY
  useEffect(() => {
    if (!reel) return;
    const id = window.setTimeout(() => setInserted(true), 900);
    return () => window.clearTimeout(id);
  }, [reel]);

  // playback loop: the audio element is the clock when the film has audio
  useEffect(() => {
    if (!playing || !reel) return;
    let raf = 0;
    const step = () => {
      let time: number;
      const a = audioRef.current;
      const eng = engineRef.current;
      if (stemsReady && eng) time = eng.now();
      else if (hasSlices && a) {
        const ch = chapters[Math.max(0, chapterRef.current)];
        time = (ch?.filmStart ?? 0) + a.currentTime;
      } else {
        const w = wallRef.current ?? (wallRef.current = { t0: performance.now(), at: tRef.current });
        time = w.at + (performance.now() - w.t0) / 1000;
      }
      if (time >= duration) {
        time = duration;
        setPlaying(false);
        flash('■ STOP');
      }
      tRef.current = time;
      setT(time);
      paint(time);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, reel, stemsReady, hasSlices, chapters, duration, paint, flash]);

  // chapter hand-off: when one slice ends, the next one starts
  const onEnded = () => {
    const next = chapterRef.current + 1;
    if (next < chapters.length) {
      cueAudio(chapters[next].filmStart);
      audioRef.current?.play().catch(() => {});
    } else {
      setPlaying(false);
      flash('■ STOP');
    }
  };

  const play = useCallback(() => {
    if (!reel) return;
    if (tRef.current >= duration - 0.05) tRef.current = 0;
    wallRef.current = null;
    if (stemsReady && engineRef.current) engineRef.current.play(tRef.current);
    else {
      cueAudio(tRef.current);
      audioRef.current?.play().catch(() => {});
    }
    setPlaying(true);
    flash('▶ PLAY');
  }, [reel, duration, cueAudio, flash, stemsReady]);

  const pause = useCallback(() => {
    engineRef.current?.stop();
    audioRef.current?.pause();
    setPlaying(false);
    setOsd({ text: '❚❚ PAUSE', until: Infinity });
  }, []);

  /** the screen: on touch in fullscreen, a tap first shows the controls; with them up, it plays/pauses */
  const onScreenTap = useCallback(() => {
    if (full && touch && !chromeRef.current) return poke();
    (playingRef.current ? pause : play)();
  }, [full, touch, poke, play, pause]);

  const seek = useCallback(
    (time: number, label?: string) => {
      const x = Math.max(0, Math.min(duration, time));
      tRef.current = x;
      wallRef.current = null;
      setT(x);
      cueAudio(x);
      // stems: restart the engine at the new position (it schedules from there on the same clock)
      const eng = engineRef.current;
      if (stemsReady && eng?.playing) eng.play(x);
      paint(x);
      if (label) flash(label);
    },
    [duration, cueAudio, paint, flash, stemsReady],
  );

  const eject = () => {
    engineRef.current?.stop();
    audioRef.current?.pause();
    if (onEject) onEject();
    else window.location.href = ASSET_BASE || '/';
  };
  // back to the picture: the page, or the navigation-stack screen this player scrolls in
  const toTop = () => (screenScroller(shellRef.current) ?? window).scrollTo({ top: 0, behavior: 'smooth' });

  // keyboard: space, arrows, [ ], Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
      if (e.key === ' ') {
        e.preventDefault();
        (playing ? pause : play)();
      } else if (e.key === 'ArrowRight') seek(tRef.current + 10, 'FF ▶▶');
      else if (e.key === 'ArrowLeft') seek(tRef.current - 10, '◀◀ REW');
      else if (e.key === ']') {
        const i = chapterAt(tRef.current) + 1;
        if (i < chapters.length) seek(chapters[i].filmStart, `▶▶| CH ${chapters[i].number}`);
      } else if (e.key === '[') {
        const i = Math.max(0, chapterAt(tRef.current) - (tRef.current - (chapters[chapterAt(tRef.current)]?.filmStart ?? 0) > 3 ? 0 : 1));
        if (chapters[i]) seek(chapters[i].filmStart, `|◀◀ CH ${chapters[i].number}`);
      } else if (e.key === 'Escape') {
        if (pseudo) setPseudo(false);
        else if (!document.fullscreenElement) eject();
      }
      else if (e.key === 'c') setCc((x) => !x);
      else if (e.key === 'f') toggleFull();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, pause, seek, chapterAt, chapters, toggleFull, pseudo]);

  // OSD expiry
  useEffect(() => {
    if (!osd || osd.until === Infinity) return;
    const id = window.setTimeout(() => setOsd(null), Math.max(0, osd.until - performance.now()));
    return () => window.clearTimeout(id);
  }, [osd]);

  // phones held upright: the book player's layout (top bar, the picture edge to edge, its controls, the bottom
  // sheet) instead of the VCR deck
  const mobile = useMediaQuery(PORTRAIT_COMPACT_MQ);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [videoBottom, setVideoBottom] = useState(0);
  useEffect(() => {
    if (!mobile) return;
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVideoBottom(Math.round(el.getBoundingClientRect().bottom)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile, reel]);
  const [sheetTab, setSheetTab] = useState('chapters');
  const videoAccent = useVideoAccent();

  const chapterNow = chapters[chapterAt(t)];

  if (error) return <div className="fp fp-error">This tape won't play.<pre>{error.slice(0, 600)}</pre></div>;

  // the card under the VCR: the film's score (its critic panel), its sources and its music, as tabs
  const filmScore: Score | null =
    review && review.mean != null
      ? { mean: review.mean, bar: review.bar, floor: review.floor, pass: review.pass, scores: review.scores, notes: review.notes, by: `the film critic panel, round ${review.round}`, at: review.at ?? undefined }
      : null;
  const cardTabs = ([['score', 'Score', !!filmScore], ['sources', 'Sources', !!sourcesDoc], ['music', 'Music', !!creditsDoc]] as const)
    .filter((x) => x[2])
    .map(([id, label]) => [id, label] as [CardTab, string]);
  const tab: CardTab = cardTabs.some(([id]) => id === cardTab) ? cardTab : (cardTabs[0]?.[0] ?? 'score');
  const setTab = setCardTab;

  const flat = mobile;
  const shell = (
        <div ref={shellRef} className={`fp-shell${flat ? ' is-flat' : ''}${full ? ' is-full' : ''}${pseudo ? ' is-pseudo' : ''}${full && !chrome && playing ? ' is-idle' : ''}`} onMouseMove={full && !touch ? poke : undefined}>
        <div className="fp-screen" onClick={onScreenTap}>
          <FilmStack width={W} height={H} overlays={overlays} sceneRef={sceneRef} finishRef={finishRef} style={{ width: '100%', height: 'auto', aspectRatio: `${FILM_W} / ${FILM_H}` }} />
          {flat ? (
            <>
              {!inserted && <div className="bp-spinner" role="status" aria-label="Loading the film" />}
              {inserted && !playing && (
                <div className="bp-bigplay" aria-hidden>
                  <PlayIcon playing={false} />
                </div>
              )}
            </>
          ) : (
            <>
              {!inserted && (
                <div className="fp-blue">
                  <span className="fp-osd-text">{reel ? 'TRACKING…' : 'LOADING TAPE…'}</span>
                </div>
              )}
              {inserted && <div className="fp-tracking" key="track" />}
              {inserted && !playing && t === 0 && !osd && (
                <div className="fp-insert">
                  <span className="fp-osd-text">PRESS ▶ PLAY</span>
                </div>
              )}
              {osd && <div className="fp-osd fp-osd-text">{osd.text}</div>}
              <div className="fp-counter fp-osd-text">SP {clock(t)}</div>
            </>
          )}
          {caption && <div className="fp-cc">{caption}</div>}
          {portraitHint && <div className="fp-rotate fp-osd-text">⟳ ROTATE FOR FULL SCREEN</div>}
        </div>
        {full && (
          <div className="fp-fsbar" onMouseMove={poke} onTouchStart={poke}>
            <button className="fp-key fp-play" onClick={() => (playing ? pause() : play())} title="Play / pause (space)">
              {playing ? '❚❚' : '▶'}
            </button>
            <div className="fp-scrub">
              <input type="range" min={0} max={duration || 1} step={0.01} value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="Position" />
              <div className="fp-ticks">
                {chapters.slice(1).map((c) => (
                  <span key={c.number} style={{ left: `${(c.filmStart / (duration || 1)) * 100}%` }} />
                ))}
              </div>
            </div>
            <span className="fp-time">
              {clock(t)} / {clock(duration)}
            </span>
            <button className={`fp-key${cc ? ' is-on' : ''}`} onClick={() => setCc((x) => !x)} title="Captions (c)">CC</button>
            <button className="fp-key" onClick={toggleFull} title="Exit fullscreen (f / Esc)">⤡</button>
          </div>
        )}
        </div>
  );
  const sourcesEl = sourcesDoc && (
    <SourcesPanel
      doc={sourcesDoc}
      now={t}
      onSeek={(x) => {
        seek(x, 'SOURCE ▶');
        toTop();
      }}
      pageUrl={manifest?.film?.sources ? `${ASSET_BASE}generated/${slug}/${manifest.film.sources}` : undefined}
    />
  );
  const creditsEl = creditsDoc && (
    <CreditsPanel
      doc={creditsDoc}
      onSeek={(x) => {
        seek(x, 'MUSIC ▶');
        toTop();
      }}
    />
  );

  if (mobile) {
    const ci = chapterAt(t);
    const step = (d: number) => {
      const c = chapters[Math.max(0, Math.min(chapters.length - 1, ci + d))];
      if (c) seek(c.filmStart);
    };
    const sheetTabs: SheetTab[] = [
      {
        id: 'chapters',
        label: 'Chapters',
        content: (
          <ul className="bp-side-list fp-m-chapters">
            {chapters.map((c, i) => (
              <li key={c.number}>
                <button className={`bp-side-item${i === ci ? ' active' : ''}`} onClick={() => seek(c.filmStart)} aria-current={i === ci ? 'true' : undefined}>
                  <span className="bp-side-thumb">
                    <img
                      src={`${ASSET_BASE}generated/${slug}/previews/chapter-${c.number}.jpg`}
                      alt=""
                      loading="lazy"
                      onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                    />
                    <span className="bp-side-num">{String(c.number).padStart(2, '0')}</span>
                  </span>
                  <span className="bp-side-text">
                    <span className="bp-side-ctitle">{c.title}</span>
                    <span className="bp-side-dur">{mmss(c.duration)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      ...(filmScore ? [{ id: 'score', label: 'Score', content: <ScoreCard score={filmScore} /> }] : []),
      ...(sourcesEl ? [{ id: 'sources', label: 'Sources', content: sourcesEl }] : []),
      ...(creditsEl ? [{ id: 'music', label: 'Music', content: creditsEl }] : []),
    ];
    return (
      <div className="bp fp-m" style={{ ['--accent' as string]: videoAccent }}>
        <div className="bp-main" ref={mainRef}>
          <div className="bp-player">
            <header className="bp-topbar">
              <div className="bp-topbar-title">
                <span className="bp-topbar-book">{manifest?.title ?? slug}</span>
                {chapterNow && (
                  <span className="bp-topbar-chapter">
                    <b>{String(chapterNow.number).padStart(2, '0')}</b> {chapterNow.title}
                  </span>
                )}
              </div>
              {chapters.length > 0 && (
                <span className="bp-topbar-count">
                  {ci + 1} / {chapters.length}
                </span>
              )}
            </header>
            <div className="bp-stagewrap fp-m-stage">{shell}</div>
            {!full && (
              <footer className="bp-controls">
                <input className="bp-seek" type="range" min={0} max={duration || 1} step={0.05} value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="Position" />
                <div className="bp-controls-row">
                  <div className="bp-controls-left">
                    <button className="bp-btn" onClick={() => step(-1)} disabled={ci <= 0} aria-label="Previous chapter">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                        <path d="M6 5h2v14H6zM20 5l-11 7 11 7z" />
                      </svg>
                    </button>
                    <button className="bp-btn bp-play" onClick={() => (playing ? pause() : play())} disabled={!inserted} aria-label={playing ? 'Pause' : 'Play'}>
                      <PlayIcon playing={playing} />
                    </button>
                    <button className="bp-btn" onClick={() => step(1)} disabled={ci >= chapters.length - 1} aria-label="Next chapter">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                        <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
                      </svg>
                    </button>
                    <span className="bp-time">
                      {mmss(t) || '0:00'}
                      <em> / {mmss(duration) || '0:00'}</em>
                    </span>
                  </div>
                  <div className="bp-controls-right">
                    <button className={`bp-btn bp-cc${cc ? ' on' : ''}`} onClick={() => setCc((x) => !x)} aria-label={cc ? 'Hide closed captions' : 'Show closed captions'} aria-pressed={cc}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                        <path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button className="bp-btn" onClick={toggleFull} aria-label="Full screen">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </div>
        {!full && videoBottom > 0 && (
          <PlayerSheet label="Chapters, score, sources and music" top={videoBottom} tabs={sheetTabs} tab={sheetTab} onTab={setSheetTab} />
        )}
        <audio ref={audioRef} preload="auto" onEnded={onEnded} />
      </div>
    );
  }

  return (
    <div className="fp">
      {shell}

      <div className="fp-deck">
        <button className="fp-key" onClick={eject} title="Eject (Esc)">⏏ EJECT</button>
        <button
          className="fp-key"
          onClick={() => {
            const i = Math.max(0, chapterAt(t) - 1);
            if (chapters[i]) seek(chapters[i].filmStart, `|◀◀ CH ${chapters[i].number}`);
          }}
          title="Previous chapter ([)"
        >
          |◀◀
        </button>
        <button className="fp-key fp-play" onClick={() => (playing ? pause() : play())} title="Play / pause (space)">
          {playing ? '❚❚' : '▶'}
        </button>
        <button
          className="fp-key"
          onClick={() => {
            const i = chapterAt(t) + 1;
            if (chapters[i]) seek(chapters[i].filmStart, `▶▶| CH ${chapters[i].number}`);
          }}
          title="Next chapter (])"
        >
          ▶▶|
        </button>
        <div className="fp-scrub">
          <input type="range" min={0} max={duration || 1} step={0.01} value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="Position" />
          <div className="fp-ticks">
            {chapters.slice(1).map((c) => (
              <span key={c.number} style={{ left: `${(c.filmStart / (duration || 1)) * 100}%` }} />
            ))}
          </div>
        </div>
        <span className="fp-time">
          {clock(t)} / {clock(duration)}
        </span>
        <button className={`fp-key${cc ? ' is-on' : ''}`} onClick={() => setCc((x) => !x)} title="Captions (c)">CC</button>
        <button className="fp-key" onClick={toggleFull} title="Fullscreen (f)">⛶</button>
      </div>
      <div className="fp-label">
        <strong>{manifest?.title ?? slug}</strong>
        {chapterNow && <span>Chapter {chapterNow.number} · {chapterNow.title}</span>}
        {!hasAudio && <em>no soundtrack published yet — playing picture only</em>}
        {manifest?.film?.sources && (
          <a className="fp-sources" href={`${ASSET_BASE}generated/${slug}/${manifest.film.sources}`} target="_blank" rel="noopener">
            Sources
          </a>
        )}
      </div>
      {cardTabs.length > 0 && (
        <section className="fp-card" aria-label="About this film">
          {cardTabs.length > 1 && (
            <div className="fp-tabs" role="tablist">
              {cardTabs.map(([id, label]) => (
                <button key={id} className={`fp-tab${tab === id ? ' is-on' : ''}`} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {tab === 'score' && filmScore && <ScoreCard score={filmScore} />}
          {tab === 'sources' && sourcesEl}
          {tab === 'music' && creditsEl}
        </section>
      )}
      <audio ref={audioRef} preload="auto" onEnded={onEnded} />
    </div>
  );
}

export default FilmPlayer;
