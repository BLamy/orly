/**
 * Film Editor: /?film-edit=<slug> — a Vegas-class non-linear editor over a film's live media (docs/film/EDITOR.md).
 *
 *   <Editor slug="neural-net-history" />      (default export; App.tsx lazy-loads it)
 *
 * Loading
 *   1. GET /__editor/films probes the dev server. Without it (a static deploy) the editor cannot read clips, save or
 *      render, so it shows how to open it locally instead of a broken UI.
 *   2. GET /__editor/project/<slug> → validateProject (repairs, null durations → Infinity). On 404 the film is
 *      imported: GET /__editor/film/<slug> → importFilmReport → PUT (the first save) → load.
 *   3. Engines: createCompositor (picture) with the film's ShotSource (loadShotSource: timeline + shot modules +
 *      webfonts, the reel's own painter), and createAudioEngine (WebAudio graph; preload decodes every clip).
 *      Every project change in the store is pushed to both engines.
 *
 * Transport (the editor owns the clock policy; the audio engine owns the clock)
 *   While playing, audio.now() is the master clock: a rAF loop copies it into ui.cursor, and the Preview paints the
 *   frame for the cursor. Stopped, the cursor drives the picture. Space = play/stop (stop returns to where play
 *   started), Enter = play/pause, J/K/L shuttle (repeat for 2×/4×, J plays backwards), ←/→ frame step with a scrub
 *   grain. Moving the cursor while playing (a click on the ruler) restarts playback there, as in Vegas; so does
 *   toggling the loop.
 *
 * Persistence (Vegas): Ctrl+S saves (PUT /__editor/project/<slug>: the server validates, backs up the previous save
 * and writes atomically), with the timeline view (cursor, zoom, scroll, loop) stored in the project and restored on
 * load. Every 30 s while dirty the project is AUTOSAVED to edit/autosave.json (PUT …?autosave=1) — never over
 * project.json, so experiments are not committed silently and the backup ring keeps real saves; a newer autosave
 * is offered for recovery on load. File ▸ Restore backup… lists the backups. A beforeunload guard warns on exit.
 *
 * Undo grouping: continuous controls coalesce per gesture; pointerup and focusout seal it (store.seal).
 *
 * window.__filmEditor exposes the store, engines and commands for the Playwright smoke test.
 */
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { createAudioEngine, type EditorAudioEngine } from '../engine/audio';
import { createCompositor, loadShotSource, type EditorCompositor } from '../engine/compositor';
import { importFilmReport, type FilmImportData } from '../model/importFilm';
import {
  addEnvelopePoint,
  addMarker,
  addRegion,
  addTrack,
  clearEnvelope,
  copyEvents,
  eventsAt,
  findEvent,
  isEditable,
  parseClipboard,
  pasteEvents,
  removeEvents,
  serializeClipboard,
  splitBlocked,
  splitEvents,
  trimEnd,
  trimStart,
  type EditClipboard,
  type EnvelopeTarget,
} from '../model/ops';
import type { FilmBundle, Project, ProjectView } from '../model/types';
import { eventEnd, projectDuration } from '../model/types';
import { formatIssues, validateProject } from '../model/validate';
import { editor, useEditor } from '../state/store';
import { TIMELINE_COMMAND, fitWhenMeasured, revealTime, zoomTimeline, zoomToFit, type TimelineCommand } from './timeline/viewport';
import Explorer, { insertAtCursor, makeColorMedia, makeTextMedia } from './Explorer';
import Inspector, { type InspectorTab } from './Inspector';
import MenuBar, { type MenuDef } from './MenuBar';
import Meters from './Meters';
import Preview from './Preview';
import StatusBar from './StatusBar';
import Toolbar from './Toolbar';
import { SHORTCUTS, TRANSPORT, keyLabel, useShortcuts, type CommandId, type Commands } from './shortcuts';
import { QUALITY, snapToFrame } from './theme';
import { readUrlView, startUrlViewSync } from './urlView';
import './editor.css';

const Timeline = lazy(() => import('./timeline/Timeline'));
const RenderDialog = lazy(() => import('./RenderDialog'));
const PanCropDialog = lazy(() => import('./PanCropDialog'));

const AUTOSAVE_MS = 30_000;
const SHUTTLE = [1, 2, 4];

type Phase = { kind: 'loading'; step: string } | { kind: 'offline' } | { kind: 'error'; message: string } | { kind: 'ready' };
type Dialog = { kind: 'render' } | { kind: 'pancrop'; eventId: string } | { kind: 'help' } | { kind: 'backups' } | null;

interface Runtime {
  compositor: EditorCompositor;
  audio: EditorAudioEngine;
}

declare global {
  interface Window {
    __filmEditor?: { slug: string; store: typeof editor; compositor: EditorCompositor; audio: EditorAudioEngine; commands: Commands; save: () => Promise<boolean> };
  }
}

// ---------------------------------------------------------------------------
// server I/O
// ---------------------------------------------------------------------------
async function errorOf(r: Response): Promise<string> {
  const body = (await r.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `HTTP ${r.status} ${r.statusText}`;
}

/** true when the /__editor routes answer with JSON (a static host answers with the app's HTML or a 404 page) */
async function serverAvailable(): Promise<boolean> {
  try {
    const r = await fetch('/__editor/films', { cache: 'no-store' });
    return r.ok && (r.headers.get('content-type') ?? '').includes('json');
  } catch {
    return false;
  }
}

/** PUT the project: a real save (project.json + backup), or an autosave (edit/autosave.json only) */
async function putProject(slug: string, p: Project, opts: { autosave?: boolean } = {}): Promise<string> {
  const r = await fetch(`/__editor/project/${encodeURIComponent(slug)}${opts.autosave ? '?autosave=1' : ''}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(p), // Infinity durations serialize as null (the wire convention)
  });
  if (!r.ok) throw new Error(await errorOf(r));
  const body = (await r.json()) as { savedAt?: string };
  return body.savedAt ?? new Date().toISOString();
}

async function importFromFilm(slug: string): Promise<{ project: Project; warnings: string[] }> {
  const r = await fetch(`/__editor/film/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`cannot read the film: ${await errorOf(r)}`);
  const bundle = (await r.json()) as FilmBundle;
  return importFilmReport(bundle as FilmImportData);
}

/** a project document from the server (project.json, the autosave, a backup), validated; null on 404 */
async function fetchProjectAt(url: string, what: string): Promise<{ project: Project; notes: string[] } | null> {
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(await errorOf(r));
  const v = validateProject(await r.json());
  if (!v.ok || !v.project) throw new Error(`${what} is invalid:\n${formatIssues(v.issues).join('\n')}`);
  return { project: v.project, notes: formatIssues(v.issues) };
}

/** the saved project, or null when the film has none yet */
const fetchProject = (slug: string) => fetchProjectAt(`/__editor/project/${encodeURIComponent(slug)}`, 'project.json');

/** the autosave (crash recovery), or null; an unreadable one is treated as absent */
async function fetchAutosave(slug: string): Promise<Project | null> {
  try {
    return (await fetchProjectAt(`/__editor/project/${encodeURIComponent(slug)}/autosave`, 'autosave.json'))?.project ?? null;
  } catch (e) {
    console.warn('[editor] autosave unreadable; ignored', e);
    return null;
  }
}

const discardAutosave = (slug: string) => fetch(`/__editor/project/${encodeURIComponent(slug)}/autosave`, { method: 'DELETE' }).catch(() => undefined);

/** the timeline view saved with the project */
function currentView(): ProjectView {
  const { ui } = editor.getState();
  return { cursor: ui.cursor, pxPerSec: ui.pxPerSec, scrollT: ui.scrollT, loop: ui.loop, looping: ui.looping };
}

// ---------------------------------------------------------------------------
// clipboard (internal copy, mirrored to the system clipboard as JSON so it survives reloads and tabs)
// ---------------------------------------------------------------------------
let clipboard: EditClipboard | null = null;

async function readClipboard(): Promise<EditClipboard | null> {
  try {
    const text = await navigator.clipboard?.readText();
    const c = text ? parseClipboard(text) : null;
    if (c) return c;
  } catch {
    /* permission denied / unavailable: the in-memory copy is the clipboard */
  }
  return clipboard;
}

// ---------------------------------------------------------------------------
// the editor
// ---------------------------------------------------------------------------
export default function Editor({ slug }: { slug: string }) {
  // the view in the URL at mount (read before the sync below can rewrite it), then mirror the view into the URL
  const urlViewAtMount = useRef(readUrlView());
  useEffect(() => startUrlViewSync(), []);
  const [phase, setPhase] = useState<Phase>({ kind: 'loading', step: 'Connecting to the dev server…' });
  const [rt, setRt] = useState<Runtime | null>(null);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [shuttle, setShuttle] = useState(1);
  const [inspectorTab, setInspectorTab] = useState<{ tab: InspectorTab; nonce: number } | null>(null);
  const [upper, setUpper] = useState(() => {
    try {
      return Number(localStorage.getItem('fe.upper')) || 46;
    } catch {
      return 46;
    }
  });
  const rtRef = useRef<Runtime | null>(null);
  rtRef.current = rt;
  /** the loaded project carried a saved view (then the load-time fit is skipped) */
  const hadView = useRef(false);

  useEffect(() => {
    document.title = `Film Edit: ${slug}`;
  }, [slug]);

  // ---- load ---------------------------------------------------------------------------------------------------
  useEffect(() => {
    let dead = false;
    let runtime: Runtime | null = null;
    const disposers: (() => void)[] = [];
    (async () => {
      if (!(await serverAvailable())) {
        if (!dead) setPhase({ kind: 'offline' });
        return;
      }
      if (dead) return;
      setPhase({ kind: 'loading', step: 'Loading the project…' });
      let loaded = await fetchProject(slug);
      let status = '';
      if (dead) return;
      if (!loaded) {
        setPhase({ kind: 'loading', step: `Importing ${slug} from its timeline, clips and cues…` });
        const imp = await importFromFilm(slug);
        if (dead) return;
        const savedAt = await putProject(slug, imp.project);
        loaded = { project: { ...imp.project, updatedAt: savedAt }, notes: imp.warnings };
        status = `Imported ${slug}${imp.warnings.length ? ` (${imp.warnings.length} warning${imp.warnings.length > 1 ? 's' : ''}: ${imp.warnings[0]})` : ''}`;
        if (imp.warnings.length) console.warn('[editor] import warnings', imp.warnings);
      } else if (loaded.notes.length) {
        console.warn('[editor] project repaired on load', loaded.notes);
        status = `Project loaded (${loaded.notes.length} repair note${loaded.notes.length > 1 ? 's' : ''}; see the console)`;
      }
      if (dead) return;
      // crash recovery: an autosave newer than the saved project is offered (Vegas does the same on restart)
      let recovered = false;
      const auto = await fetchAutosave(slug);
      if (dead) return;
      if (auto && auto.updatedAt > loaded.project.updatedAt) {
        const when = new Date(auto.updatedAt).toLocaleString();
        if (window.confirm(`${slug} has unsaved work from ${when} (autosave).\n\nRecover it? (Cancel discards it and opens the last save.)`)) {
          loaded = { project: auto, notes: loaded.notes };
          recovered = true;
          status = `Recovered the autosave from ${when} (not saved yet)`;
        } else void discardAutosave(slug);
      } else if (auto) void discardAutosave(slug);
      const project = loaded.project;
      editor.load(project, project.updatedAt, { dirty: recovered });
      // the view the project was saved with (else the timeline fits the film once it has measured)
      hadView.current = !!project.view;
      if (project.view) {
        const v = project.view;
        editor.set({ cursor: v.cursor, pxPerSec: v.pxPerSec, scrollT: v.scrollT, loop: v.loop, looping: v.looping });
      }
      // the URL wins (t / zoom / scroll): a hot reload or refresh lands exactly where you were
      const urlView = urlViewAtMount.current;
      if (Object.keys(urlView).length) {
        if (urlView.pxPerSec !== undefined) hadView.current = true;
        editor.set(urlView);
      }

      // engines
      const compositor = createCompositor({ project });
      const audio = createAudioEngine(project, {
        onEnded: (t) => {
          // the engine stopped at the project end (or the start, in reverse)
          editor.set({ playing: false, cursor: Math.max(0, t) });
          setShuttle(1);
        },
      });
      runtime = { compositor, audio };
      let lastProject: Project | null = project;
      disposers.push(
        editor.subscribe(() => {
          const p = editor.getState().project;
          if (p && p !== lastProject) {
            lastProject = p;
            compositor.setProject(p);
            audio.setProject(p);
          }
        }),
      );
      setRt(runtime);
      setPhase({ kind: 'ready' });
      editor.set({ status: status || `Opened ${project.title}` });

      // shot painters: the project's own film, then any other film a shot medium comes from
      const films = new Set<string>([slug]);
      for (const m of Object.values(project.media)) if (m.kind === 'shot') films.add(m.film);
      for (const film of films) {
        loadShotSource(film, { width: project.width, height: project.height })
          .then((src) => !dead && compositor.setShotSource(src, film === slug ? undefined : film))
          .catch((e: unknown) => {
            console.error(`[editor] shot source for ${film} failed`, e);
            editor.set({ status: `Shots of ${film} failed to load: ${(e as Error).message}` });
          });
      }

      // decode audio (progress in the status bar)
      let lastPct = -1;
      setLoadProgress(0);
      audio
        .preload((p) => {
          const pct = Math.floor(p * 100);
          if (pct !== lastPct && !dead) {
            lastPct = pct;
            setLoadProgress(p);
          }
        })
        .then(() => !dead && setLoadProgress(1))
        .catch((e: unknown) => !dead && editor.set({ status: `Audio preload: ${(e as Error).message}` }));
    })().catch((e: unknown) => {
      console.error('[editor] load failed', e);
      if (!dead) setPhase({ kind: 'error', message: String((e as Error)?.message ?? e) });
    });
    return () => {
      dead = true;
      disposers.forEach((f) => f());
      if (runtime) {
        runtime.audio.dispose();
        runtime.compositor.dispose();
      }
      setRt(null);
    };
  }, [slug]);

  // ---- save -----------------------------------------------------------------------------------------------------
  const savingRef = useRef<Promise<boolean> | null>(null);
  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) return savingRef.current;
    const p = editor.getState().project;
    if (!p) return false;
    const run = (async () => {
      editor.set({ status: 'Saving…' });
      try {
        const savedAt = await putProject(slug, { ...p, view: currentView() });
        // edits made while the request was in flight stay dirty (the next save writes them)
        if (editor.getState().project === p) editor.markSaved(savedAt);
        editor.set({ status: `Saved ${new Date(savedAt).toLocaleTimeString()}` });
        return true;
      } catch (e) {
        editor.set({ status: `Save failed: ${(e as Error).message}` });
        return false;
      } finally {
        savingRef.current = null;
      }
    })();
    savingRef.current = run;
    return run;
  }, [slug]);

  const ready = phase.kind === 'ready';
  // fit the whole film in view once the (lazy) timeline has measured its lanes (unless the project saved a view)
  useEffect(() => {
    if (ready && !hadView.current) fitWhenMeasured();
  }, [ready]);
  // autosave: the dirty project to edit/autosave.json (never project.json; no backup), once per change
  const autosaved = useRef<Project | null>(null);
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const st = editor.getState();
      if (!st.dirty || !st.project || st.project === autosaved.current || savingRef.current) return;
      const p = st.project;
      autosaved.current = p;
      putProject(slug, { ...p, view: currentView() }, { autosave: true }).catch((e: unknown) => {
        autosaved.current = null;
        console.warn('[editor] autosave failed', e);
      });
    }, AUTOSAVE_MS);
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!editor.getState().dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [ready, slug]);

  // a continuous control's undo step ends with the gesture (pointer released, focus left the field)
  useEffect(() => {
    const seal = () => editor.seal();
    window.addEventListener('pointerup', seal, true);
    window.addEventListener('focusout', seal, true);
    return () => {
      window.removeEventListener('pointerup', seal, true);
      window.removeEventListener('focusout', seal, true);
    };
  }, []);

  // ---- transport ------------------------------------------------------------------------------------------------
  const playStart = useRef(0);
  /** the cursor value the transport itself last wrote (anything else is the user moving the cursor) */
  const ownCursor = useRef<number | null>(null);
  const rateRef = useRef(1);

  const loopOpts = () => {
    const { ui } = editor.getState();
    return ui.looping && ui.loop && ui.loop.end - ui.loop.start > 1e-3 ? ui.loop : undefined;
  };

  const startPlayback = useCallback((from: number, rate: number) => {
    const r = rtRef.current;
    const p = editor.getState().project;
    if (!r || !p) return;
    const loop = loopOpts();
    let t = from;
    if (loop && (t < loop.start || t >= loop.end)) t = rate > 0 ? loop.start : loop.end;
    const end = projectDuration(p);
    if (!loop && rate > 0 && t >= end - 1e-3) t = 0;
    if (!loop && rate < 0 && t <= 1e-3) t = end;
    r.audio.play(t, { loop, rate });
    rateRef.current = rate;
    setShuttle(rate);
    ownCursor.current = t;
    editor.set({ playing: true, cursor: t });
  }, []);

  const play = useCallback(
    (rate = 1) => {
      const { ui } = editor.getState();
      playStart.current = ui.cursor;
      startPlayback(ui.cursor, rate);
    },
    [startPlayback],
  );

  const stop = useCallback((returnToStart: boolean) => {
    const r = rtRef.current;
    if (!r) return;
    const at = r.audio.playing ? r.audio.now() : editor.getState().ui.cursor;
    r.audio.stop();
    rateRef.current = 1;
    setShuttle(1);
    const p = editor.getState().project;
    const fps = p?.fps ?? 24;
    ownCursor.current = null;
    editor.set({ playing: false, cursor: returnToStart ? playStart.current : Math.max(0, snapToFrame(at, fps)) });
  }, []);

  // the clock: while playing, copy audio.now() into the cursor every frame
  const playing = useEditor((s) => s.ui.playing);
  useEffect(() => {
    if (!playing || !rt) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!rt.audio.playing) return; // onEnded settles the state
      const t = rt.audio.now();
      ownCursor.current = t;
      editor.set({ cursor: t });
      revealTime(t, 0.05);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rt]);

  // the user moved the cursor or changed the loop while playing: continue from there (Vegas)
  useEffect(() => {
    let lastLoop = editor.getState().ui.loop;
    let lastLooping = editor.getState().ui.looping;
    const unsub = editor.subscribe(() => {
      const { ui } = editor.getState();
      const loopChanged = ui.loop !== lastLoop || ui.looping !== lastLooping;
      lastLoop = ui.loop;
      lastLooping = ui.looping;
      if (!ui.playing || !rtRef.current) return;
      if (ownCursor.current != null && Math.abs(ui.cursor - ownCursor.current) > 1e-4) {
        playStart.current = ui.cursor;
        startPlayback(ui.cursor, rateRef.current);
      } else if (loopChanged) {
        startPlayback(rtRef.current.audio.now(), rateRef.current);
      }
    });
    return () => {
      unsub();
    };
  }, [startPlayback]);

  /** move the cursor and bring it into view (while playing, playback continues from there) */
  const seek = useCallback((t: number) => {
    const tt = Math.max(0, t);
    editor.set({ cursor: tt });
    revealTime(tt);
  }, []);

  // ---- commands ------------------------------------------------------------------------------------------------
  const commands = useMemo<Commands>(() => {
    const st = () => editor.getState();
    const proj = () => st().project;
    const fps = () => proj()?.fps ?? 24;
    const status = (s: string) => editor.set({ status: s });
    const step = (dir: 1 | -1) => {
      if (st().ui.playing) stop(false);
      const t = Math.max(0, snapToFrame(st().ui.cursor, fps()) + dir / fps());
      seek(t);
      rtRef.current?.audio.scrub(t);
    };
    /** every place an edit starts or ends, plus markers and regions */
    const editPoints = (): number[] => {
      const p = proj();
      if (!p) return [0];
      const pts = new Set<number>([0, projectDuration(p)]);
      for (const tr of p.tracks) {
        for (const e of tr.events) {
          pts.add(e.start);
          pts.add(eventEnd(e));
        }
      }
      for (const m of p.markers) pts.add(m.t);
      for (const r of p.regions) {
        pts.add(r.start);
        pts.add(r.end);
      }
      return [...pts].sort((a, b) => a - b);
    };
    const shuttleTo = (dir: 1 | -1) => {
      const { ui } = st();
      const cur = rateRef.current;
      if (ui.playing && Math.sign(cur) === dir) {
        const i = SHUTTLE.indexOf(Math.abs(cur));
        const next = SHUTTLE[Math.min(SHUTTLE.length - 1, i + 1)] * dir;
        if (next !== cur) startPlayback(rtRef.current?.audio.now() ?? ui.cursor, next);
      } else if (ui.playing) startPlayback(rtRef.current?.audio.now() ?? ui.cursor, dir);
      else play(dir);
    };
    const groups = () => !st().ui.ignoreGroups;
    const copy = (): boolean => {
      const p = proj();
      const clip = p ? copyEvents(p, st().ui.selection, { groups: groups() }) : null;
      if (!clip) {
        status('Nothing selected to copy');
        return false;
      }
      clipboard = clip;
      navigator.clipboard?.writeText(serializeClipboard(clip)).catch(() => undefined);
      status(`Copied ${clip.items.length} event${clip.items.length > 1 ? 's' : ''}`);
      return true;
    };
    /** why nothing of `ids` can be edited, when that is the case (locked tracks / events) */
    const lockedReason = (p: Project, ids: readonly string[]): string | null => {
      const refs = ids.map((id) => findEvent(p, id)).filter((r): r is NonNullable<typeof r> => !!r);
      if (!refs.length || refs.some((r) => isEditable(r.track, r.event))) return null;
      return refs.some((r) => r.track.lock) ? 'Track is locked' : 'Event is locked';
    };
    const del = (label: string) => {
      const { ui, project: p } = st();
      if (!ui.selection.length || !p) return;
      const why = lockedReason(p, ui.selection);
      if (why) {
        status(`${label}: ${why}`);
        return;
      }
      editor.apply(label, (pp) => removeEvents(pp, ui.selection, ui.ripple, { groups: groups() }));
      editor.set({ selection: [] });
    };
    const paste = (insert: boolean) => {
      void readClipboard().then((clip) => {
        const { ui, project: p } = st();
        if (!clip || !p) {
          status('The clipboard is empty');
          return;
        }
        const before = new Set(p.tracks.flatMap((t) => t.events.map((e) => e.id)));
        // Paste Insert (Vegas Ctrl+Shift+V) ripples later material right by the clipboard's length
        const ripple = insert && ui.ripple === 'off' ? 'tracks' : ui.ripple;
        editor.apply(insert ? 'Paste Insert' : 'Paste', (pp) => pasteEvents(pp, clip, ui.cursor, { trackId: ui.track, ripple }));
        const after = st().project;
        if (!after || after === p) return;
        const added = after.tracks.flatMap((t) => t.events.filter((e) => !before.has(e.id)).map((e) => e.id));
        editor.set({ selection: added, cursor: ui.cursor + clip.length });
      });
    };
    /** Alt+[ / Alt+]: trim the selected events' start / end to the cursor */
    const trimToCursor = (edge: 'start' | 'end') => {
      const { ui, project: p } = st();
      if (!p || !ui.selection.length) return status('Trim to cursor: select events first');
      const t = snapToFrame(ui.cursor, p.fps);
      editor.apply(edge === 'start' ? 'Trim Start to Cursor' : 'Trim End to Cursor', (pp) =>
        ui.selection.reduce((acc, id) => {
          const ref = findEvent(acc, id);
          if (!ref || t <= ref.event.start + 1e-6 || t >= eventEnd(ref.event) - 1e-6) return acc;
          return edge === 'start' ? trimStart(acc, id, t, { ripple: ui.ripple }) : trimEnd(acc, id, t, { ripple: ui.ripple });
        }, pp),
      );
    };
    /** V / P: insert (or remove) the focused track's volume / pan envelope (video: the composite level) */
    const trackEnvelope = (which: 'volume' | 'pan') => {
      const { ui, project: p } = st();
      const tr = p?.tracks.find((t) => t.id === ui.track);
      if (!p || !tr) return status('Track envelopes: focus a track first');
      const env = tr.kind === 'video' ? (which === 'volume' ? 'opacity' : null) : which;
      if (!env) return status('Video tracks have no pan envelope');
      if (tr.lock) return status('Track is locked');
      const target: EnvelopeTarget = { scope: 'track', id: tr.id, env };
      const on = !!tr.envelopes?.[env]?.length;
      const name = env === 'opacity' ? 'Composite Level' : env === 'volume' ? 'Volume' : 'Pan';
      editor.apply(on ? `Remove Track ${name} Envelope` : `Insert Track ${name} Envelope`, (pp) => (on ? clearEnvelope(pp, target) : addEnvelopePoint(pp, target, { t: 0, v: env === 'opacity' ? 1 : 0 })));
      if (!on) editor.set({ showEnvelopes: true });
    };
    return {
      playStop: () => (st().ui.playing ? stop(true) : play(1)),
      playPause: () => (st().ui.playing ? stop(false) : play(1)),
      shuttleReverse: () => shuttleTo(-1),
      shuttlePause: () => st().ui.playing && stop(false),
      shuttleForward: () => shuttleTo(1),
      frameBack: () => step(-1),
      frameForward: () => step(1),
      prevEdit: () => {
        const c = st().ui.cursor;
        const t = editPoints().filter((x) => x < c - 1e-4).at(-1);
        if (t != null) seek(t);
      },
      nextEdit: () => {
        const c = st().ui.cursor;
        const t = editPoints().find((x) => x > c + 1e-4);
        if (t != null) seek(t);
      },
      gotoStart: () => seek(0),
      gotoEnd: () => {
        const p = proj();
        if (p) seek(projectDuration(p));
      },
      split: () => {
        const { ui, project: p } = st();
        if (!p) return;
        // the renderer is frame-exact: a cut always lands on a frame boundary
        const t = snapToFrame(ui.cursor, p.fps);
        const under = (id: string) => {
          const hit = findEvent(p, id);
          return !!hit && hit.event.start < t - 1e-6 && t < eventEnd(hit.event) - 1e-6;
        };
        // Vegas: the selected events under the cursor, or with nothing selected every event under it on every track
        let ids = ui.selection.filter(under);
        if (!ids.length && !ui.selection.length) ids = eventsAt(p, t).filter(under);
        if (!ids.length) {
          status('Split: nothing under the cursor');
          return;
        }
        const why = lockedReason(p, ids);
        if (why) return status(`Split: ${why}`);
        const blocked = new Set(splitBlocked(p, ids, t));
        if (blocked.size === ids.length) {
          status('Split is inside a transition: move the cursor outside the overlap (Ctrl+← / Ctrl+→ go to its edges)');
          return;
        }
        editor.apply('Split', (pp) => splitEvents(pp, ids, t));
        if (blocked.size) status(`Split (${blocked.size} event${blocked.size > 1 ? 's' : ''} inside a transition left whole)`);
      },
      delete: () => del('Delete'),
      cut: () => {
        if (copy()) del('Cut');
      },
      copy: () => void copy(),
      paste: () => paste(false),
      pasteInsert: () => paste(true),
      undo: () => editor.undo(),
      redo: () => editor.redo(),
      selectAll: () => {
        const p = proj();
        if (p) editor.set({ selection: p.tracks.filter((t) => !t.lock).flatMap((t) => t.events.map((e) => e.id)) });
      },
      deselect: () => editor.set({ selection: [] }),
      marker: () => editor.apply('Insert marker', (p) => addMarker(p, st().ui.cursor, `Marker ${p.markers.length + 1}`)),
      region: () => {
        const loop = st().ui.loop;
        if (!loop || loop.end - loop.start < 1e-3) {
          status('Region: set a loop first (I / O)');
          return;
        }
        editor.apply('Insert region', (p) => addRegion(p, loop.start, loop.end, `Region ${p.regions.length + 1}`));
      },
      toggleLoop: () => {
        const { ui } = st();
        if (!ui.looping && !ui.loop) status('Looping on: set the loop with I / O');
        editor.set({ looping: !ui.looping });
      },
      loopIn: () => {
        const { ui } = st();
        const start = ui.cursor;
        const end = ui.loop && ui.loop.end > start + 1 / fps() ? ui.loop.end : start + 5;
        editor.set({ loop: { start, end } });
      },
      loopOut: () => {
        const { ui } = st();
        const end = ui.cursor;
        const start = ui.loop && ui.loop.start < end - 1 / fps() ? ui.loop.start : Math.max(0, end - 5);
        if (end - start > 1e-3) editor.set({ loop: { start, end } });
      },
      toggleSnap: () => {
        const on = !st().ui.snapping;
        editor.set({ snapping: on, status: `Snapping ${on ? 'on' : 'off'}` });
      },
      gotoMarker: (e) => {
        const p = proj();
        const d = e && /^Digit(\d)$/.exec(e.code);
        if (!p || !d) return;
        const n = d[1] === '0' ? 10 : Number(d[1]);
        const m = [...p.markers].sort((a, b) => a.t - b.t)[n - 1];
        if (m) seek(m.t);
        else status(`No marker ${n}`);
      },
      cycleTool: () => {
        const next = ({ normal: 'envelope', envelope: 'select', select: 'normal' } as const)[st().ui.tool];
        editor.set({ tool: next, status: `${next === 'normal' ? 'Normal' : next === 'envelope' ? 'Envelope' : 'Selection'} edit tool` });
      },
      trimStartToCursor: () => trimToCursor('start'),
      trimEndToCursor: () => trimToCursor('end'),
      trackVolumeEnvelope: () => trackEnvelope('volume'),
      trackPanEnvelope: () => trackEnvelope('pan'),
      toggleGroups: () => {
        const on = !st().ui.ignoreGroups;
        editor.set({ ignoreGroups: on, status: on ? 'Ignoring event grouping' : 'Event grouping on' });
      },
      cycleRipple: () => {
        const next = ({ off: 'tracks', tracks: 'all', all: 'off' } as const)[st().ui.ripple];
        editor.set({ ripple: next, status: `Ripple: ${next === 'off' ? 'off' : next === 'tracks' ? 'affected tracks' : 'all tracks'}` });
      },
      save: () => void save(),
      newText: () => {
        insertAtCursor(makeTextMedia(), 'New text event');
        setInspectorTab({ tab: 'event', nonce: Date.now() });
      },
      panCrop: () => {
        const { ui, project: p } = st();
        const id = ui.selection.find((x) => (p ? findEvent(p, x)?.track.kind === 'video' : false));
        if (id) setDialog({ kind: 'pancrop', eventId: id });
        else status('Pan/Crop: select a video event');
      },
      zoomIn: () => zoomTimeline(1.5),
      zoomOut: () => zoomTimeline(1 / 1.5),
      zoomFit: () => zoomToFit(),
      render: () => setDialog({ kind: 'render' }),
    };
  }, [play, stop, startPlayback, seek, save]);

  // the Pan/Crop window is non-modal (Vegas): the transport keeps working under it; other dialogs are modal
  useShortcuts(commands, { enabled: ready && (dialog == null || dialog.kind === 'pancrop'), only: dialog?.kind === 'pancrop' ? TRANSPORT : null });

  const commandsRef = useRef(commands);
  commandsRef.current = commands;
  // the timeline asks the shell for dialogs and panels it does not own
  useEffect(() => {
    const on = (e: Event) => {
      const cmd = (e as CustomEvent<TimelineCommand>).detail;
      switch (cmd.kind) {
        case 'panCrop':
          editor.set({ selection: [cmd.eventId] });
          setDialog({ kind: 'pancrop', eventId: cmd.eventId });
          break;
        case 'eventProperties':
        case 'eventFx':
          editor.set({ selection: [cmd.eventId] });
          setInspectorTab({ tab: 'event', nonce: Date.now() });
          break;
        case 'trackFx':
        case 'trackProperties':
          editor.set({ track: cmd.trackId });
          setInspectorTab({ tab: 'track', nonce: Date.now() });
          break;
        case 'clipboard':
          commandsRef.current[cmd.op]();
          break;
      }
    };
    window.addEventListener(TIMELINE_COMMAND, on);
    return () => window.removeEventListener(TIMELINE_COMMAND, on);
  }, []);

  // test / debugging handle
  useEffect(() => {
    if (!rt) return;
    window.__filmEditor = { slug, store: editor, compositor: rt.compositor, audio: rt.audio, commands, save };
    return () => {
      delete window.__filmEditor;
    };
  }, [rt, slug, commands, save]);

  // ---- file actions ---------------------------------------------------------------------------------------------
  const reimport = useCallback(async () => {
    if (!window.confirm(`Re-import ${slug} from its timeline, clips and cues?\n\nThis replaces the edit (you can undo it).`)) return;
    try {
      editor.set({ status: 'Re-importing…' });
      const { project, warnings } = await importFromFilm(slug);
      editor.apply('Re-import film', () => project);
      editor.set({ selection: [], status: `Re-imported${warnings.length ? ` (${warnings.length} warnings)` : ''}` });
    } catch (e) {
      editor.set({ status: `Re-import failed: ${(e as Error).message}` });
    }
  }, [slug]);

  const revert = useCallback(async () => {
    if (editor.getState().dirty && !window.confirm('Discard unsaved changes and reload the saved project?')) return;
    try {
      const loaded = await fetchProject(slug);
      if (!loaded) throw new Error('no saved project');
      editor.load(loaded.project, loaded.project.updatedAt);
      editor.set({ status: 'Reverted to the saved project' });
    } catch (e) {
      editor.set({ status: `Revert failed: ${(e as Error).message}` });
    }
  }, [slug]);

  const exportJson = useCallback(() => {
    const p = editor.getState().project;
    if (!p) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(p, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.slug}-edit.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  // ---- menus ----------------------------------------------------------------------------------------------------
  const undoLabel = useEditor((s) => s.undoLabel);
  const redoLabel = useEditor((s) => s.redoLabel);
  const canUndo = useEditor((s) => s.canUndo);
  const canRedo = useEditor((s) => s.canRedo);
  const snapping = useEditor((s) => s.ui.snapping);
  const ripple = useEditor((s) => s.ui.ripple);
  const looping = useEditor((s) => s.ui.looping);
  const autoX = useEditor((s) => s.ui.autoCrossfade);
  const envelopes = useEditor((s) => s.ui.showEnvelopes);
  const previewScale = useEditor((s) => s.ui.previewScale);
  const hasSel = useEditor((s) => s.ui.selection.length > 0);
  const title = useEditor((s) => s.project?.title);
  const ignoreGroups = useEditor((s) => !!s.ui.ignoreGroups);
  const wheelZoom = useEditor((s) => !!s.ui.wheelZoom);
  const dirty = useEditor((s) => s.dirty);

  const menus = useMemo<MenuDef[]>(() => {
    const c = (id: CommandId, label: string, extra?: { disabled?: boolean; checked?: boolean }) => ({ label, onSelect: commands[id], keys: keyLabel(id), ...extra });
    const track = (kind: 'video' | 'audio') => () =>
      editor.apply(`Add ${kind} track`, (p) => {
        const focus = p.tracks.findIndex((t) => t.id === editor.getState().ui.track);
        // Vegas inserts above the focused track; without focus, video goes above the first audio track, audio at the end
        const firstAudio = p.tracks.findIndex((t) => t.kind === 'audio');
        const index = focus >= 0 ? focus : kind === 'video' ? (firstAudio < 0 ? p.tracks.length : firstAudio) : p.tracks.length;
        return addTrack(p, kind, { index });
      });
    return [
      {
        label: 'File',
        items: [
          c('save', 'Save'),
          { label: 'Revert to saved', onSelect: () => void revert() },
          { label: 'Restore backup…', onSelect: () => setDialog({ kind: 'backups' }) },
          'separator',
          c('render', 'Render As…'),
          { label: 'Export project JSON', onSelect: exportJson },
          'separator',
          { label: `Re-import ${slug} from the film…`, onSelect: () => void reimport() },
          'separator',
          { label: 'Close editor (back to the shelf)', onSelect: () => window.location.assign('/') },
        ],
      },
      {
        label: 'Edit',
        items: [
          c('undo', undoLabel ? `Undo ${undoLabel}` : 'Undo', { disabled: !canUndo }),
          c('redo', redoLabel ? `Redo ${redoLabel}` : 'Redo', { disabled: !canRedo }),
          'separator',
          c('cut', 'Cut', { disabled: !hasSel }),
          c('copy', 'Copy', { disabled: !hasSel }),
          c('paste', 'Paste'),
          c('pasteInsert', 'Paste insert'),
          c('delete', 'Delete', { disabled: !hasSel }),
          'separator',
          c('split', 'Split'),
          c('trimStartToCursor', 'Trim start to cursor', { disabled: !hasSel }),
          c('trimEndToCursor', 'Trim end to cursor', { disabled: !hasSel }),
          c('selectAll', 'Select all'),
          c('deselect', 'Select none'),
          'separator',
          c('toggleGroups', 'Ignore event grouping', { checked: ignoreGroups }),
          'separator',
          { label: 'Ripple off', radio: true, checked: ripple === 'off', onSelect: () => editor.set({ ripple: 'off' }) },
          { label: 'Ripple affected tracks', radio: true, checked: ripple === 'tracks', onSelect: () => editor.set({ ripple: 'tracks' }) },
          { label: 'Ripple all tracks', radio: true, checked: ripple === 'all', onSelect: () => editor.set({ ripple: 'all' }), keys: keyLabel('cycleRipple') },
        ],
      },
      {
        label: 'View',
        items: [
          ...QUALITY.map((q) => ({ label: `Preview: ${q.label}`, radio: true, checked: Math.abs(previewScale - q.scale) < 1e-6, onSelect: () => editor.set({ previewScale: q.scale }) })),
          'separator' as const,
          { label: 'Show envelopes', checked: envelopes, onSelect: () => editor.set({ showEnvelopes: !envelopes }) },
          { label: 'Mouse wheel zooms (Ctrl+wheel scrolls)', checked: wheelZoom, onSelect: () => editor.set({ wheelZoom: !wheelZoom }) },
          'separator' as const,
          c('zoomIn', 'Zoom in'),
          c('zoomOut', 'Zoom out'),
          c('zoomFit', 'Zoom to fit'),
          'separator' as const,
          { label: 'Reset panel layout', onSelect: () => setUpper(46) },
        ],
      },
      {
        label: 'Insert',
        items: [
          c('newText', 'Text event'),
          { label: 'Solid colour event', onSelect: () => insertAtCursor(makeColorMedia('#14100e', 'Warm black'), 'Insert colour') },
          'separator',
          c('marker', 'Marker'),
          c('region', 'Region'),
          'separator',
          c('trackVolumeEnvelope', 'Track volume / level envelope'),
          c('trackPanEnvelope', 'Track pan envelope'),
          'separator',
          { label: 'Video track', onSelect: track('video') },
          { label: 'Audio track', onSelect: track('audio') },
        ],
      },
      {
        label: 'Tools',
        items: [
          c('panCrop', 'Event Pan/Crop…', { disabled: !hasSel }),
          'separator',
          c('cycleTool', 'Cycle edit tool'),
          c('toggleSnap', 'Enable snapping', { checked: snapping }),
          { label: 'Automatic crossfades', checked: autoX, onSelect: () => editor.set({ autoCrossfade: !autoX }) },
          c('toggleLoop', 'Loop playback', { checked: looping }),
          c('cycleRipple', 'Cycle ripple mode'),
        ],
      },
      {
        label: 'Help',
        items: [
          { label: 'Keyboard shortcuts', onSelect: () => setDialog({ kind: 'help' }) },
        ],
      },
    ];
  }, [commands, undoLabel, redoLabel, canUndo, canRedo, hasSel, ripple, previewScale, envelopes, snapping, autoX, looping, slug, revert, exportJson, reimport, ignoreGroups, wheelZoom]);

  // ---- layout: draggable split between the upper panes and the timeline ---------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem('fe.upper', String(upper));
    } catch {
      /* layout just isn't remembered */
    }
  }, [upper]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-drag');
    const r = root.getBoundingClientRect();
    const move = (ev: PointerEvent) => setUpper(Math.max(18, Math.min(78, ((ev.clientY - r.top - 56) / Math.max(1, r.height - 56 - 22)) * 100)));
    const up = () => {
      el.classList.remove('is-drag');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };

  // ---- render ---------------------------------------------------------------------------------------------------
  if (phase.kind === 'offline') return <OfflineMessage slug={slug} />;
  if (phase.kind === 'error') return <Message title="The editor could not open this film" body={<pre className="fe-error-text">{phase.message}</pre>} />;
  if (phase.kind === 'loading' || !rt) return <Message title={`Opening ${slug}`} body={<p>{phase.kind === 'loading' ? phase.step : 'Starting the engines…'}</p>} busy />;

  const p = editor.getState().project;
  const sizeStyle = { '--fe-upper': `${upper}%` } as CSSProperties;
  return (
    <div className="fe-root" ref={rootRef} style={sizeStyle}>
      <MenuBar
        menus={menus}
        title={
          <>
            <span style={{ color: 'var(--fe-text)' }}>{title}</span>
            <span className="fe-mono">{slug}</span>
            {dirty && <span style={{ color: 'var(--fe-accent)' }} title="Unsaved changes">●</span>}
          </>
        }
      />
      <Toolbar cmds={commands} onRender={() => setDialog({ kind: 'render' })} onHelp={() => setDialog({ kind: 'help' })} canSave />
      <div className="fe-upper">
        <PanelBoundary name="Explorer">
          <Explorer slug={slug} compositor={rt.compositor} audio={rt.audio} seek={seek} canImport />
        </PanelBoundary>
        <PanelBoundary name="Preview">
          <Preview compositor={rt.compositor} cmds={commands} stop={() => editor.getState().ui.playing && stop(true)} seek={seek} shuttle={shuttle} />
        </PanelBoundary>
        <PanelBoundary name="Inspector">
          <Inspector onPanCrop={commands.panCrop} request={inspectorTab} />
        </PanelBoundary>
      </div>
      <div className="fe-hsplit" role="separator" aria-orientation="horizontal" aria-label="Resize the timeline" onPointerDown={startSplit} onDoubleClick={() => setUpper(46)} />
      <div className="fe-lower">
        <PanelBoundary name="Timeline">
          <Suspense fallback={<div className="fe-panel fe-empty">Loading the timeline…</div>}>
            <Timeline compositor={rt.compositor} audio={rt.audio} />
          </Suspense>
        </PanelBoundary>
        <Meters audio={rt.audio} />
      </div>
      <StatusBar fps={p?.fps ?? 24} loadProgress={loadProgress} onOpenRender={() => setDialog({ kind: 'render' })} />

      <PanelBoundary name="Dialog" onReset={() => setDialog(null)}>
        <Suspense fallback={null}>
          {dialog?.kind === 'render' && p && (
            <RenderDialog
              slug={slug}
              fps={p.fps}
              duration={projectDuration(p)}
              loop={editor.getState().ui.loop}
              regions={p.regions}
              dirty={editor.getState().dirty}
              getProject={() => editor.getState().project}
              onClose={() => setDialog(null)}
            />
          )}
          {dialog?.kind === 'pancrop' && <PanCropDialog eventId={dialog.eventId} compositor={rt.compositor} onClose={() => setDialog(null)} />}
        </Suspense>
      </PanelBoundary>
      {dialog?.kind === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === 'backups' && <BackupsDialog slug={slug} onClose={() => setDialog(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// panel error boundary: a crashing panel (or a module that fails to load) shows its error in place, and the rest
// of the editor — with the unsaved project — keeps working
// ---------------------------------------------------------------------------
class PanelBoundary extends Component<{ name: string; children: ReactNode; onReset?: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[editor] ${this.props.name} crashed`, error, info.componentStack);
    editor.set({ status: `${this.props.name} failed: ${error.message}` });
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="fe-panel" role="alert">
        <div className="fe-empty">
          <strong>{this.props.name} stopped working.</strong> Your edits are safe (save with {keyLabel('save')}).
          <pre className="fe-error-text" style={{ textAlign: 'left', maxHeight: 160, overflow: 'auto' }}>{error.message}</pre>
          <button
            className="fe-btn"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// full-page messages and the help dialog
// ---------------------------------------------------------------------------
function Message({ title, body, busy }: { title: string; body: React.ReactNode; busy?: boolean }) {
  return (
    <div className="fe-message" role={busy ? 'status' : 'alert'}>
      <div className="fe-message-card">
        <h1>{title}</h1>
        {body}
        {busy && (
          <div className="fe-progress is-indeterminate" aria-hidden="true">
            <div />
          </div>
        )}
      </div>
    </div>
  );
}

function OfflineMessage({ slug }: { slug: string }) {
  const local = `http://localhost:5173/?film-edit=${encodeURIComponent(slug)}`;
  return (
    <Message
      title="The film editor runs on the dev server"
      body={
        <>
          <p>
            Editing reads the film's narration clips and music renders from <code>films/{slug}/</code>, saves to <code>films/{slug}/edit/project.json</code> and
            renders through the exporter — all served by the editor routes of the local dev server (<code>/__editor/*</code>), which this deployed site does
            not have.
          </p>
          <p>
            To edit, run <code>npm run dev</code> in the repo and open <a href={local}>{local}</a>.
          </p>
          <p>
            To watch the film instead, open <a href={`/?film=${encodeURIComponent(slug)}`}>the film player</a>.
          </p>
        </>
      }
    />
  );
}

interface BackupEntry {
  name: string;
  bytes: number;
  at: string;
}

/**
 * File ▸ Restore backup…: the server's backup ring (GET /__editor/project/<slug>/backups), newest first. Restoring
 * replaces the project in the editor as one undoable step and leaves it unsaved, so nothing on disk changes until
 * the user saves.
 */
function BackupsDialog({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [list, setList] = useState<BackupEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/__editor/project/${encodeURIComponent(slug)}/backups`;
  useEffect(() => {
    let dead = false;
    fetch(base, { cache: 'no-store' })
      .then(async (r) => (r.ok ? ((await r.json()) as BackupEntry[]) : Promise.reject(new Error(await errorOf(r)))))
      .then((l) => !dead && setList(l))
      .catch((e: unknown) => !dead && setError((e as Error).message));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      dead = true;
      window.removeEventListener('keydown', onKey);
    };
  }, [base, onClose]);
  const restore = async (b: BackupEntry) => {
    try {
      const loaded = await fetchProjectAt(`${base}/${encodeURIComponent(b.name)}`, b.name);
      if (!loaded) throw new Error('backup not found');
      editor.apply(`Restore backup ${new Date(b.at).toLocaleString()}`, () => loaded.project);
      editor.set({ selection: [], status: `Restored the backup from ${new Date(b.at).toLocaleString()} (not saved yet; Undo reverts it)` });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="fe-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fe-dialog" role="dialog" aria-modal="true" aria-labelledby="fe-backups-title" style={{ width: 520 }}>
        <div className="fe-dialog-head">
          <span id="fe-backups-title">Restore backup</span>
          <button className="fe-icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            ✕
          </button>
        </div>
        <div className="fe-dialog-body">
          {error && <pre className="fe-error-text">{error}</pre>}
          {!list && !error && <div className="fe-hint">Loading the backups…</div>}
          {list && list.length === 0 && <div className="fe-hint">No backups yet: one is written each time a save replaces project.json.</div>}
          {list && list.length > 0 && (
            <table className="fe-table">
              <tbody>
                {list.map((b) => (
                  <tr key={b.name}>
                    <td>{Number.isNaN(Date.parse(b.at)) ? b.name : new Date(b.at).toLocaleString()}</td>
                    <td className="fe-mono">{(b.bytes / 1024).toFixed(0)} KB</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="fe-btn" onClick={() => void restore(b)}>
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="fe-hint" style={{ padding: '10px 0 0' }}>
            Restoring replaces the edit in the editor (Undo brings it back); project.json changes only when you save.
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fe-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fe-dialog" role="dialog" aria-modal="true" aria-labelledby="fe-help-title" style={{ width: 560 }}>
        <div className="fe-dialog-head">
          <span id="fe-help-title">Keyboard shortcuts</span>
          <button className="fe-icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            ✕
          </button>
        </div>
        <div className="fe-dialog-body">
          <table className="fe-table fe-keys">
            <tbody>
              {SHORTCUTS.map((s) => (
                <tr key={s.id}>
                  <td>{s.keys}</td>
                  <td>{s.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fe-hint" style={{ padding: '10px 0 0' }}>
            Timeline: Ctrl/⌘+wheel zooms, wheel scrolls, Shift+wheel scrolls sideways (View ▸ Mouse wheel zooms swaps them); Alt-drag slips,
            Ctrl-drag an edge stretches, Ctrl-drag an event copies; drag the top corners for fades and the top edge for level; drag empty track
            space for a time selection; double-click an envelope line to add a point.
          </div>
        </div>
      </div>
    </div>
  );
}
