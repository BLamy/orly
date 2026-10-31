/**
 * Explorer (Vegas's docked Project Media / Transitions / Video FX / Media Generators / Markers windows).
 *
 *   <Explorer slug compositor audio seek canImport />
 *
 * Tabs
 *   Project Media   the media pool grouped by role (shots, narration, music, imported, generators) with lazy
 *                   thumbnails (compositor.thumbnail) or waveforms (audio.peaks), length and usage. Drag a row onto the
 *                   timeline, or double-click / Enter to insert it at the cursor. "Import…" (or dropping files on
 *                   the list) uploads through POST /__editor/import/<slug> and adds the probed media to the pool.
 *   Transitions     drag onto an overlap on the timeline, or click to apply to the selected events' cuts.
 *   Video FX        drag onto an event or track, or click to add to the selection (else the focused video track).
 *   Generators      text presets and solid colours: click to insert at the cursor, or drag to the timeline.
 *   Markers         markers and regions: click to go there, rename in place, delete; a region can set the loop.
 *
 * Drag-and-drop: the MIME types and payloads are defined in ./dnd.ts (re-exported here); the timeline is the
 * drop target (timeline/drop.ts).
 */
import { memo, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { FONT } from '../../viz/film/silhouette/type';
import { TRANSITIONS_UI } from '../engine/transitions';
import { newId } from '../model/id';
import {
  DEFAULT_STILL_LEN,
  DEFAULT_TEXT,
  addMedia,
  addTrack,
  addVideoFx,
  canHost,
  deleteMarkers,
  deleteRegions,
  findEvent,
  insertMedia,
  previousNeighbour,
  setOverlapAtCut,
  updateMarker,
  updateRegion,
} from '../model/ops';
import type { EditorAudioEngine } from '../engine/audio';
import type { EditorCompositor } from '../engine/compositor';
import type { ColorMedia, ImportedMedia, Media, Project, TextMedia, TextSpec, TransitionKind, VideoFxKind } from '../model/types';
import { editor, useEditor } from '../state/store';
import { VIDEO_FX_KINDS, VIDEO_FX_UI } from './Inspector';
import { DND_GENERATOR, DND_MEDIA, DND_TRANSITION, DND_VIDEO_FX, mediaToWire } from './dnd';
import { C, KIND_COLOR, shortTime, timecode } from './theme';

export { DND_GENERATOR, DND_MEDIA, DND_TRANSITION, DND_VIDEO_FX } from './dnd';

// ---------------------------------------------------------------------------
// inserting media (shared with Editor's Ctrl+Shift+N and Insert menu)
// ---------------------------------------------------------------------------
/** generators (text, colour) are overlays: they go on a free track above the picture, never into a shot */
const isGenerator = (m: Media): boolean => m.kind === 'text' || m.kind === 'color';

/** is a track free of events over [t0, t1) */
const freeOver = (tr: Project['tracks'][number], t0: number, t1: number): boolean => !tr.events.some((e) => e.start < t1 - 1e-6 && e.start + e.length > t0 + 1e-6);

/**
 * The track a medium goes to. Media files: the focused track when it can host it, else the first one that can (top
 * first). Generators (Insert ▸ Text, Ctrl+Shift+N, colours): the top-most unlocked video track that is FREE over
 * [t, t + len] (V0 "Titles" in an imported film), so a title never lands inside a shot and auto-crossfades as a
 * transition over it; null when no video track is free (the caller inserts a new track above).
 */
export function targetTrack(p: Project, m: Media, preferred: string | null, span?: { t: number; len: number }): string | null {
  if (isGenerator(m) && span) {
    return p.tracks.find((t) => t.kind === 'video' && !t.lock && freeOver(t, span.t, span.t + span.len))?.id ?? null;
  }
  const focus = p.tracks.find((t) => t.id === preferred);
  if (focus && !focus.lock && canHost(focus.kind, m)) return focus.id;
  return p.tracks.find((t) => !t.lock && canHost(t.kind, m))?.id ?? null;
}

/** insert a medium (adding it to the pool if new) at the cursor; selects the new event. False when no track fits. */
export function insertAtCursor(m: Media, label = `Insert ${m.label}`): boolean {
  const s = editor.getState();
  const p = s.project;
  if (!p) return false;
  const at = s.ui.cursor;
  const len = Number.isFinite(m.duration) && m.duration > 0 ? m.duration : DEFAULT_STILL_LEN;
  let trackId = targetTrack(p, m, s.ui.track, { t: at, len });
  let newTrack: string | null = null;
  if (!trackId && isGenerator(m)) {
    // every video track is busy there: a new one on top (in front), as Vegas does for a generated media
    newTrack = newId('tv');
    trackId = newTrack;
  }
  if (!trackId) {
    editor.set({ status: `No unlocked ${m.kind === 'audio' ? 'audio' : 'video'} track for ${m.label}` });
    return false;
  }
  const id = newId('e');
  const tid = trackId;
  editor.apply(label, (pp) => insertMedia(newTrack ? addTrack(pp, 'video', { id: newTrack, index: 0, name: 'Titles' }) : pp, tid, m, at, { id, ripple: s.ui.ripple }));
  if (editor.getState().project !== p) editor.set({ selection: [id], track: tid });
  return true;
}

export interface TextPreset {
  id: string;
  label: string;
  desc: string;
  spec: Partial<TextSpec>;
}
export const TEXT_PRESETS: TextPreset[] = [
  { id: 'title', label: 'Title', desc: 'Centred display title', spec: {} },
  {
    id: 'lower-third',
    label: 'Lower third',
    desc: 'Name / place, left, on a plate',
    spec: { content: 'Name · Place', font: FONT.text, size: 34, weight: 500, align: 'left', x: 96, y: 610, plate: { color: '#14100ecc', padding: 14, radius: 3 } },
  },
  {
    id: 'caption',
    label: 'Caption',
    desc: 'Bottom-centre subtitle line',
    spec: { content: 'Caption', font: FONT.text, size: 30, weight: 400, align: 'center', x: 640, y: 664, shadow: { color: '#000000', blur: 6, dx: 0, dy: 2 } },
  },
  {
    id: 'chapter',
    label: 'Chapter card',
    desc: 'Small caps, wide tracking',
    spec: { content: 'CHAPTER I', font: FONT.sc, size: 54, weight: 600, align: 'center', x: 640, y: 340 },
  },
  { id: 'typewriter', label: 'Typewriter', desc: 'Types on at 18 cps', spec: { content: 'Typed text…', font: FONT.typewriter, size: 34, weight: 400, align: 'left', x: 120, y: 360, typeOn: 18, color: '#e9dcc3' } },
];

export const COLOR_PRESETS = [
  { label: 'Warm black', color: '#14100e' },
  { label: 'Black', color: '#000000' },
  { label: 'Parchment', color: '#efe3c8' },
  { label: 'White', color: '#ffffff' },
  { label: 'Dusk rose', color: '#6b3f4a' },
  { label: 'Lamp amber', color: '#c88a3a' },
];

export function makeTextMedia(preset: TextPreset = TEXT_PRESETS[0]): TextMedia {
  const text: TextSpec = { ...DEFAULT_TEXT, ...preset.spec };
  return { id: newId('txt'), kind: 'text', label: text.content.slice(0, 40) || preset.label, duration: Infinity, text };
}
export function makeColorMedia(color: string, label = color): ColorMedia {
  return { id: newId('col'), kind: 'color', label, duration: Infinity, color };
}


/** a server media entry → a pool medium (null duration = Infinity) */
export function fromWire<M extends { duration: number | null }>(m: M): M & { duration: number } {
  return { ...m, duration: m.duration == null ? Infinity : m.duration };
}

// ---------------------------------------------------------------------------
// importing files
// ---------------------------------------------------------------------------
async function importFiles(slug: string, files: readonly File[]): Promise<void> {
  let ok = 0;
  for (const [i, f] of files.entries()) {
    editor.set({ status: `Importing ${f.name} (${i + 1}/${files.length})…` });
    try {
      const r = await fetch(`/__editor/import/${encodeURIComponent(slug)}?name=${encodeURIComponent(f.name)}`, {
        method: 'POST',
        headers: { 'content-type': f.type || 'application/octet-stream' },
        body: f,
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      }
      const m = fromWire((await r.json()) as ImportedMedia) as Media;
      editor.apply(`Import ${m.label}`, (p) => addMedia(p, m));
      ok++;
    } catch (e) {
      editor.set({ status: `Import failed: ${f.name}: ${(e as Error).message}` });
      return;
    }
  }
  editor.set({ status: `Imported ${ok} file${ok === 1 ? '' : 's'}` });
}

// ---------------------------------------------------------------------------
// the panel
// ---------------------------------------------------------------------------
type Tab = 'media' | 'transitions' | 'fx' | 'generators' | 'markers';
const TABS: { id: Tab; label: string }[] = [
  { id: 'media', label: 'Project Media' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'fx', label: 'Video FX' },
  { id: 'generators', label: 'Generators' },
  { id: 'markers', label: 'Markers' },
];

export interface ExplorerProps {
  slug: string;
  compositor: EditorCompositor | null;
  audio: EditorAudioEngine | null;
  seek: (t: number) => void;
  /** dev server available (import works) */
  canImport: boolean;
}

export default function Explorer(props: ExplorerProps) {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem('fe.explorer.tab') as Tab | null) ?? 'media';
    } catch {
      return 'media';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('fe.explorer.tab', tab);
    } catch {
      /* not persisted */
    }
  }, [tab]);
  return (
    <section className="fe-panel" aria-label="Explorer">
      <div className="fe-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`fe-tab${tab === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'media' && <MediaTab {...props} />}
      {tab === 'transitions' && <TransitionsTab />}
      {tab === 'fx' && <FxTab />}
      {tab === 'generators' && <GeneratorsTab />}
      {tab === 'markers' && <MarkersTab seek={props.seek} />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Project Media
// ---------------------------------------------------------------------------
type Group = 'shots' | 'narration' | 'music' | 'imported' | 'generators';
const GROUPS: { id: Group; label: string }[] = [
  { id: 'shots', label: 'Shots' },
  { id: 'narration', label: 'Narration' },
  { id: 'music', label: 'Music' },
  { id: 'imported', label: 'Imported' },
  { id: 'generators', label: 'Generators' },
];
function groupOf(m: Media): Group {
  if (m.kind === 'shot') return 'shots';
  if (m.kind === 'text' || m.kind === 'color') return 'generators';
  if (m.kind === 'audio' && m.role === 'narration') return 'narration';
  if (m.kind === 'audio' && m.role === 'music') return 'music';
  return 'imported';
}

function MediaTab({ slug, compositor, audio, canImport }: ExplorerProps) {
  const media = useEditor((s) => s.project?.media);
  // waveforms redraw as clips finish decoding (throttled: a film decodes hundreds of clips)
  const [peaksVersion, setPeaksVersion] = useState(0);
  useEffect(() => {
    if (!audio) return;
    let timer = 0;
    const unsub = audio.subscribe(() => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        setPeaksVersion((v) => v + 1);
      }, 400);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [audio]);
  const tracks = useEditor((s) => s.project?.tracks);
  const [q, setQ] = useState('');
  const [dropping, setDropping] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const used = useMemo(() => {
    const u = new Set<string>();
    for (const t of tracks ?? []) for (const e of t.events) u.add(e.mediaId);
    return u;
  }, [tracks]);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = new Map<Group, Media[]>(GROUPS.map((g) => [g.id, []]));
    for (const m of Object.values(media ?? {})) {
      if (needle) {
        const hay = `${m.label} ${m.id} ${Object.values(m.tags ?? {}).join(' ')}`.toLowerCase();
        if (!hay.includes(needle)) continue;
      }
      out.get(groupOf(m))!.push(m);
    }
    for (const list of out.values()) list.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    return out;
  }, [media, q]);

  const onFiles = (files: FileList | null) => {
    if (files?.length) void importFiles(slug, [...files]);
  };
  const total = media ? Object.keys(media).length : 0;

  return (
    <>
      <div className="fe-panel-foot" style={{ borderTop: 0, borderBottom: '1px solid var(--fe-line)' }}>
        <input className="fe-search" type="search" placeholder={`Search ${total} media…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search media" />
        <button className="fe-icon-btn" disabled={!canImport} title={canImport ? 'Import audio, video or images into the project' : 'Import needs the dev server'} onClick={() => fileRef.current?.click()}>
          Import…
        </button>
        <input ref={fileRef} type="file" multiple accept="audio/*,video/*,image/*" hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ''))} />
      </div>
      <div
        className="fe-panel-body"
        style={dropping ? { outline: `2px dashed ${C.focus}`, outlineOffset: -4 } : undefined}
        onDragOver={(e) => {
          if (canImport && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDropping(true);
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          setDropping(false);
          if (canImport && e.dataTransfer.files.length) {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }
        }}
      >
        {GROUPS.map((g) => {
          const list = grouped.get(g.id)!;
          if (!list.length) return null;
          return (
            <div key={g.id} role="group" aria-label={g.label}>
              <div className="fe-group-head">
                <span>{g.label}</span>
                <span>{list.length}</span>
              </div>
              {list.map((m) => (
                <MediaRow key={m.id} m={m} used={used.has(m.id)} compositor={compositor} audio={audio} peaksVersion={peaksVersion} />
              ))}
            </div>
          );
        })}
        {!total && <div className="fe-empty">The media pool is empty.</div>}
      </div>
    </>
  );
}

function subtitle(m: Media): string {
  const t = m.tags ?? {};
  switch (m.kind) {
    case 'shot':
      return [t.chapter, m.shotId !== m.label ? m.shotId : '', t.mood].filter(Boolean).join(' · ') || m.shotId;
    case 'audio':
      return [t.text ?? t.line ?? t.cue ?? '', m.sampleRate ? `${(m.sampleRate / 1000).toFixed(1)} kHz` : ''].filter(Boolean).join(' · ');
    case 'image':
    case 'video':
      return `${m.width}×${m.height}${m.kind === 'video' && m.fps ? ` · ${m.fps} fps` : ''}`;
    case 'text':
      return m.text.content;
    case 'color':
      return m.color;
  }
}

interface ThumbProps {
  m: Media;
  compositor: EditorCompositor | null;
  audio: EditorAudioEngine | null;
  peaksVersion: number;
}

/** one pool row (memoised: an edit re-renders the pool, but a row only changes with its medium or usage) */
const MediaRow = memo(function MediaRow({ used, ...thumb }: ThumbProps & { used: boolean }) {
  const { m } = thumb;
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(DND_MEDIA, m.id);
    e.dataTransfer.setData('text/plain', m.label);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <button
      className={`fe-media-item${used ? ' is-used' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDoubleClick={() => insertAtCursor(m)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          insertAtCursor(m);
        }
      }}
      title={`${m.label} (${m.kind}) — drag to the timeline, or double-click to insert at the cursor${used ? '. In use.' : ''}`}
    >
      <Thumb {...thumb} />
      <span style={{ minWidth: 0 }}>
        <span className="fe-media-label">{m.label}</span>
        <span className="fe-media-sub">{subtitle(m)}</span>
      </span>
      <span className="fe-media-dur">{Number.isFinite(m.duration) ? shortTime(m.duration) : '∞'}</span>
    </button>
  );
});

const TW = 128;
const TH = 72;

/** a lazily painted thumbnail: picture media via the compositor, audio as a waveform; paints once it scrolls into view */
function Thumb({ m, compositor, audio, peaksVersion }: ThumbProps) {
  // only waveforms depend on decoding progress; picture thumbnails ignore it
  const version = m.kind === 'audio' ? peaksVersion : 0;
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((x) => x.isIntersecting) && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const cv = ref.current;
    const c = cv?.getContext('2d');
    if (!visible || !cv || !c) return;
    let timer = 0;
    let tries = 0;
    const draw = () => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, TW, TH);
      if (m.kind === 'audio') {
        const dur = Number.isFinite(m.duration) ? m.duration : 0;
        const pk = audio && dur > 0 ? audio.peaks(m.id, 0, dur, TW) : null;
        paintWave(c, pk, m.role === 'music' ? KIND_COLOR.video : KIND_COLOR.audio);
        return;
      }
      if (!compositor) return;
      // a representative frame: the middle of a shot / video, the start of anything without a length
      const at = Number.isFinite(m.duration) && m.duration > 0 ? m.duration * 0.5 : 0;
      const th = compositor.thumbnail(m.id, at, TW, TH);
      if (th) c.drawImage(th, 0, 0, TW, TH);
      else if (tries++ < 20) timer = window.setTimeout(draw, 250 + tries * 100); // media still loading
    };
    // let the browser breathe between rows: shots paint the full film engine
    const idle = window.requestIdleCallback?.(draw, { timeout: 500 }) ?? window.setTimeout(draw, 16);
    return () => {
      window.clearTimeout(timer);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [visible, m, compositor, audio, version]);
  return <canvas ref={ref} className="fe-thumb" width={TW} height={TH} aria-hidden="true" />;
}

function paintWave(c: CanvasRenderingContext2D, pk: Float32Array | null, color: string): void {
  c.fillStyle = '#0d0e10';
  c.fillRect(0, 0, TW, TH);
  const mid = TH / 2;
  c.fillStyle = color;
  if (!pk) {
    c.fillRect(0, mid, TW, 1);
    return;
  }
  // peaks are [min, max] pairs per column
  const cols = Math.floor(pk.length / 2);
  for (let i = 0; i < cols; i++) {
    const lo = pk[i * 2];
    const hi = pk[i * 2 + 1];
    const y0 = mid - Math.max(0, hi) * (mid - 2);
    const y1 = mid - Math.min(0, lo) * (mid - 2);
    c.fillRect((i * TW) / cols, y0, Math.max(1, TW / cols - 0.3), Math.max(1, y1 - y0));
  }
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
/** apply a transition to the cuts before the selected video events (making an overlap where there is none) */
function applyTransition(kind: TransitionKind, dur: number): void {
  const { project: p, ui } = editor.getState();
  if (!p) return;
  const ids = ui.selection.filter((id) => {
    const hit = findEvent(p, id);
    return hit && hit.track.kind === 'video' && previousNeighbour(hit.track, hit.event);
  });
  if (!ids.length) {
    editor.set({ status: 'Select the event after a cut (or drag the transition onto an overlap)' });
    return;
  }
  const label = TRANSITIONS_UI.find((t) => t.kind === kind)?.label ?? kind;
  editor.apply(`Transition: ${label}`, (pp) =>
    ids.reduce((acc, id) => {
      const hit = findEvent(acc, id);
      const prev = hit && previousNeighbour(hit.track, hit.event);
      if (!hit || !prev) return acc;
      const overlap = prev.start + prev.length - hit.event.start;
      // keep an existing overlap's length; a butt cut gets the transition's default length
      return setOverlapAtCut(acc, id, overlap > 1e-6 ? overlap : dur, kind);
    }, pp),
  );
}

function TransitionsTab() {
  return (
    <div className="fe-panel-body">
      <div className="fe-hint">Drag onto an overlap on the timeline, or click to apply to the cut before each selected event.</div>
      <div className="fe-tile-grid">
        {TRANSITIONS_UI.map((t) => (
          <button
            key={t.kind}
            className="fe-tile"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DND_TRANSITION, t.kind);
              e.dataTransfer.setData('text/plain', t.label);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => applyTransition(t.kind, t.dur)}
            title={`${t.label}${t.dur ? ` · ${t.dur} s default` : ''}${t.film ? ' · from the film kit' : ''}`}
          >
            <span className="fe-tile-art">
              <TransitionArt kind={t.kind} />
            </span>
            <span className="fe-tile-name">{t.label}</span>
            <span className="fe-tile-desc">
              {t.dur ? `${t.dur.toFixed(1)} s` : 'instant'}
              {t.film ? ' · film' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** a small diagram of how each transition moves from A (blue) to B (amber) */
function TransitionArt({ kind }: { kind: TransitionKind }) {
  const A = '#4d6fa8';
  const B = '#c88a3a';
  const base = (inner: ReactNode) => (
    <svg viewBox="0 0 96 46" preserveAspectRatio="none" aria-hidden="true">
      <rect width="96" height="46" fill={A} />
      {inner}
    </svg>
  );
  const grad = (id: string, stops: [number, string, number][]) => (
    <defs>
      <linearGradient id={id}>
        {stops.map(([o, c, a], i) => (
          <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
        ))}
      </linearGradient>
    </defs>
  );
  switch (kind) {
    case 'cut':
      return base(<rect x="48" width="48" height="46" fill={B} />);
    case 'crossfade':
      return base(<>{grad('g-xf', [[0, B, 0], [1, B, 1]])}<rect width="96" height="46" fill="url(#g-xf)" /></>);
    case 'fadeBlack':
      return base(<>{grad('g-fb', [[0, '#14100e', 0], [0.5, '#14100e', 1], [1, '#14100e', 0]])}<rect x="48" width="48" height="46" fill={B} /><rect width="96" height="46" fill="url(#g-fb)" /></>);
    case 'dipWhite':
      return base(<>{grad('g-dw', [[0, '#fff', 0], [0.5, '#fff', 1], [1, '#fff', 0]])}<rect x="48" width="48" height="46" fill={B} /><rect width="96" height="46" fill="url(#g-dw)" /></>);
    case 'iris':
      return base(<circle cx="48" cy="23" r="16" fill={B} />);
    case 'inkBleed':
      return base(<path d="M30 10c8-6 20 2 26 0s14 6 10 14-2 14-12 14-16 4-22-2-12-6-8-14 0-8 6-12z" fill={B} />);
    case 'paperWipe':
      return base(<><path d="M52 0h44v46H44c4-6 2-12 6-18s-2-14 2-28z" fill={B} /><path d="M52 0c-4 14 2 22-2 28s-2 12-6 18" stroke="#efe3c8" strokeWidth="1.5" fill="none" /></>);
    case 'lampChange':
      return base(<>{grad('g-lc', [[0, '#f5d998', 0], [0.5, '#f5d998', 0.8], [1, B, 1]])}<rect width="96" height="46" fill="url(#g-lc)" /></>);
    case 'wipeLeft':
      return base(<><rect width="48" height="46" fill={B} /><path d="M48 23l-8-6v12z" fill="#fff" /></>);
    case 'wipeRight':
      return base(<><rect x="48" width="48" height="46" fill={B} /><path d="M48 23l8-6v12z" fill="#fff" /></>);
    case 'push':
      return base(<><rect x="-20" width="68" height="46" fill={A} /><rect x="48" width="48" height="46" fill={B} /><path d="M40 23l8-6v12zM56 23l8-6v12z" fill="#fff" /></>);
  }
}

// ---------------------------------------------------------------------------
// Video FX
// ---------------------------------------------------------------------------
function addFxToSelection(kind: VideoFxKind): void {
  const { project: p, ui } = editor.getState();
  if (!p) return;
  const events = ui.selection.filter((id) => findEvent(p, id)?.track.kind === 'video');
  const label = `Add ${VIDEO_FX_UI[kind].label}`;
  if (events.length) {
    editor.apply(label, (pp) => events.reduce((acc, id) => addVideoFx(acc, { scope: 'event', id }, kind), pp));
    return;
  }
  const track = p.tracks.find((t) => t.id === ui.track && t.kind === 'video');
  if (track) editor.apply(`${label} to ${track.name}`, (pp) => addVideoFx(pp, { scope: 'track', id: track.id }, kind));
  else editor.set({ status: 'Select video events (or focus a video track) to add an effect' });
}

function FxTab() {
  return (
    <div className="fe-panel-body">
      <div className="fe-hint">Drag onto an event or a track header, or click to add to the selected events (or the focused video track).</div>
      {VIDEO_FX_KINDS.map((k) => {
        const ui = VIDEO_FX_UI[k];
        return (
          <button
            key={k}
            className="fe-media-item"
            style={{ gridTemplateColumns: '28px minmax(0,1fr)' }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DND_VIDEO_FX, k);
              e.dataTransfer.setData('text/plain', ui.label);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => addFxToSelection(k)}
            title={ui.desc}
          >
            <span className="fe-swatch" style={{ width: 22, height: 22, borderRadius: 4, background: FX_SWATCH[k] }} />
            <span style={{ minWidth: 0 }}>
              <span className="fe-media-label">{ui.label}</span>
              <span className="fe-media-sub">{ui.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const FX_SWATCH: Record<VideoFxKind, string> = {
  brightness: 'linear-gradient(135deg,#333,#eee)',
  contrast: 'linear-gradient(90deg,#000 50%,#fff 50%)',
  saturation: 'linear-gradient(90deg,#888,#e04a3a,#3ab0e0)',
  hue: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
  blur: 'radial-gradient(#cfd8e6,#4d6fa8)',
  sepia: 'linear-gradient(135deg,#704214,#e0c9a0)',
  grayscale: 'linear-gradient(135deg,#222,#bbb)',
  invert: 'linear-gradient(135deg,#fff 50%,#000 50%)',
  vignette: 'radial-gradient(#d8c8a8 30%,#111)',
  filmFinish: 'repeating-linear-gradient(45deg,#3a2e27 0 2px,#6b5530 2px 4px)',
};

// ---------------------------------------------------------------------------
// Media Generators
// ---------------------------------------------------------------------------
function GeneratorsTab() {
  const [custom, setCustom] = useState('#3b4a6b');
  const drag = (m: Media) => (e: DragEvent) => {
    e.dataTransfer.setData(DND_GENERATOR, mediaToWire(m));
    e.dataTransfer.setData('text/plain', m.label);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div className="fe-panel-body">
      <div className="fe-group-head">
        <span>Text</span>
      </div>
      <div className="fe-tile-grid">
        {TEXT_PRESETS.map((p) => (
          <button key={p.id} className="fe-tile" draggable onDragStart={drag(makeTextMedia(p))} onClick={() => insertAtCursor(makeTextMedia(p), `Insert ${p.label}`)} title={`${p.desc} — click to insert at the cursor`}>
            <span className="fe-tile-art" style={{ display: 'flex', alignItems: 'center', justifyContent: p.spec.align === 'left' ? 'flex-start' : 'center', padding: '0 6px', background: '#14100e' }}>
              <span style={{ font: `${p.spec.italic ? 'italic ' : ''}${p.spec.weight ?? DEFAULT_TEXT.weight} 13px ${p.spec.font ?? DEFAULT_TEXT.font}`, color: p.spec.color ?? DEFAULT_TEXT.color, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {(p.spec.content ?? DEFAULT_TEXT.content).slice(0, 18)}
              </span>
            </span>
            <span className="fe-tile-name">{p.label}</span>
            <span className="fe-tile-desc">{p.desc}</span>
          </button>
        ))}
      </div>
      <div className="fe-group-head">
        <span>Solid colour</span>
      </div>
      <div className="fe-tile-grid">
        {COLOR_PRESETS.map((c) => (
          <button key={c.color} className="fe-tile" draggable onDragStart={drag(makeColorMedia(c.color, c.label))} onClick={() => insertAtCursor(makeColorMedia(c.color, c.label), `Insert ${c.label}`)} title="Click to insert at the cursor">
            <span className="fe-tile-art" style={{ background: c.color }} />
            <span className="fe-tile-name">{c.label}</span>
            <span className="fe-tile-desc fe-mono">{c.color}</span>
          </button>
        ))}
        <div className="fe-tile" style={{ cursor: 'default' }}>
          <input type="color" className="fe-color" style={{ width: '100%', height: 46 }} value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom colour" />
          <button className="fe-btn" style={{ height: 22, padding: 0 }} onClick={() => insertAtCursor(makeColorMedia(custom, `Colour ${custom}`), 'Insert colour')}>
            Insert {custom}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markers and regions
// ---------------------------------------------------------------------------
function MarkersTab({ seek }: { seek: (t: number) => void }) {
  const markers = useEditor((s) => s.project?.markers);
  const regions = useEditor((s) => s.project?.regions);
  const fps = useEditor((s) => s.project?.fps ?? 24);
  return (
    <div className="fe-panel-body">
      <div className="fe-group-head">
        <span>Markers</span>
        <span>{markers?.length ?? 0}</span>
      </div>
      <table className="fe-table">
        <thead>
          <tr>
            <th>Time</th>
            <th style={{ width: '100%' }}>Label</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {(markers ?? []).map((m) => (
            <tr key={m.id}>
              <td>
                <button className="fe-icon-btn fe-mono" onClick={() => seek(m.t)} title="Go to marker">
                  <span className="fe-swatch" style={{ background: m.color ?? C.marker }} /> {timecode(m.t, fps)}
                </button>
              </td>
              <td>
                <InlineText value={m.label} onCommit={(label) => editor.apply('Rename marker', (p) => updateMarker(p, m.id, { label }))} ariaLabel="Marker label" />
              </td>
              <td>
                <button className="fe-icon-btn" aria-label="Delete marker" title="Delete marker" onClick={() => editor.apply('Delete marker', (p) => deleteMarkers(p, [m.id]))}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!markers?.length && <div className="fe-hint">No markers. Press M to drop one at the cursor.</div>}

      <div className="fe-group-head" style={{ marginTop: 6 }}>
        <span>Regions</span>
        <span>{regions?.length ?? 0}</span>
      </div>
      <table className="fe-table">
        <thead>
          <tr>
            <th>Start</th>
            <th>Length</th>
            <th style={{ width: '100%' }}>Label</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {(regions ?? []).map((r) => (
            <tr key={r.id}>
              <td>
                <button className="fe-icon-btn fe-mono" onClick={() => seek(r.start)} title="Go to the region start">
                  <span className="fe-swatch" style={{ background: r.color ?? C.region }} /> {timecode(r.start, fps)}
                </button>
              </td>
              <td className="fe-mono fe-dim">{shortTime(r.end - r.start)}</td>
              <td>
                <InlineText value={r.label} onCommit={(label) => editor.apply('Rename region', (p) => updateRegion(p, r.id, { label }))} ariaLabel="Region label" />
              </td>
              <td style={{ display: 'flex' }}>
                <button className="fe-icon-btn" title="Set the loop bar to this region" aria-label="Loop region" onClick={() => editor.set({ loop: { start: r.start, end: r.end }, looping: true, status: `Loop: ${r.label}` })}>
                  ⟲
                </button>
                <button className="fe-icon-btn" aria-label="Delete region" title="Delete region" onClick={() => editor.apply('Delete region', (p) => deleteRegions(p, [r.id]))}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!regions?.length && <div className="fe-hint">No regions. Set a loop (I / O) and press R.</div>}
    </div>
  );
}

/** text that commits on Enter / blur and reverts on Esc */
function InlineText({ value, onCommit, ariaLabel }: { value: string; onCommit: (v: string) => void; ariaLabel: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const commit = () => {
    if (!cancelled.current && draft != null && draft !== value) onCommit(draft);
    cancelled.current = false;
    setDraft(null);
  };
  return (
    <input
      className="fe-input"
      style={{ border: '1px solid transparent', background: 'transparent' }}
      value={draft ?? value}
      aria-label={ariaLabel}
      onFocus={() => setDraft(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
    />
  );
}
