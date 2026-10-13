/**
 * Timeline gestures — what a press on the timeline turns into, and what each pointer move produces.
 *
 *   const g = startGesture(hit, env, pointer, ids)   // null: the press does nothing draggable
 *   g.update(env, pointer) -> GestureFrame            // { project?: draft, ui?: live UI patch, snapT, badge }
 *   g.label                                           // undo label for the commit
 *
 * A gesture never touches the store itself. The Timeline paints `project` as a DRAFT while the button is
 * down (so a drag is one undo step, not a hundred) and applies it on release with
 * `editor.apply(label, …)`; `ui` patches (cursor scrub, loop bar, marquee selection) are pushed live with
 * `editor.set`. Every update recomputes from the press-time project (`env.base`), so a drag is a pure
 * function of where the pointer is now: autoscroll, snapping toggles and Esc-to-cancel stay trivial.
 *
 * Times are read through the CURRENT view (the timeline may autoscroll mid-drag): dt = t(pointer) − t(press).
 * Snapping (model/snap.ts; ui.snapping, inverted while Shift is held) pulls the dragged edge to the nearest
 * target within 8 px, else to the nearest frame. Whenever a VIDEO event is part of the drag the caught target is
 * also quantized to the frame grid (Vegas "Quantize to frames": a cut snapped to a narration word must still land
 * on a frame, since the renderer is frame-exact); audio-only drags stay sample-accurate.
 *
 * A frame may also carry `previewT`: the time the Video Preview should show while the button is down (the
 * dragged edge's frame for a trim, the cursor or the event head for a slip), so trims and slips are seen live.
 */
import type { EditEvent, Project, Track } from '../../model/types';
import { eventEnd } from '../../model/types.ts';
import { addEnvelopePoint, findEvent, moveEnvelopePoint, moveMarker, setEventGain, setEventOpacity, setFade, slipEvents, stretchEvent, updateRegion, type EnvelopeTarget } from '../../model/ops.ts';
import { buildSnapIndex, snapToFrame, type SnapIndex, type SnapOptions } from '../../model/snap.ts';
import type { EditorUi } from '../../state/store';
import { ENVELOPES, fracToGain, keyValue, type EnvelopeKind } from './curves.ts';
import { dragMove, dragTrim, indexEvents, moveRange, trimRange, type Edge } from './edits.ts';
import { clamp, deltaCode, rowAt, timecode, xToT, type TrackRow, type View } from './geometry.ts';
import { eventBox, trackEnvFrac, type Box, type Hit } from './hit.ts';
import { CURSORS, M, RULER_H } from './style.ts';

export interface Pointer {
  /** canvas px */
  x: number;
  y: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

export interface GestureEnv {
  /** the project at press time (drafts derive from it) */
  base: Project;
  ui: EditorUi;
  view: View;
  rows: TrackRow[];
  scrollY: number;
  height: number;
}

export interface GestureFrame {
  /** draft project to paint (and commit on release) */
  project?: Project;
  /** live UI-only patch (cursor, loop, selection) */
  ui?: Partial<EditorUi>;
  snapT: number | null;
  badge: string | null;
  /** what the Video Preview shows meanwhile (undefined / null: the cursor) */
  previewT?: number | null;
}

export interface Gesture {
  kind: 'move' | 'trim' | 'stretch' | 'slip' | 'fade' | 'level' | 'envelope' | 'scrub' | 'loop' | 'marker' | 'region' | 'marquee';
  /** CSS cursor while dragging */
  cursor: string;
  /** undo label for the commit */
  label: string;
  /** the drag autoscrolls when the pointer nears the canvas edges */
  autoScroll: boolean;
  /** a press without travel still commits (adding an envelope point is a click) */
  commitOnClick?: boolean;
  update(env: GestureEnv, p: Pointer): GestureFrame;
}

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const tAt = (env: GestureEnv, x: number): number => xToT(env.view, x);
const snapOn = (env: GestureEnv, p: Pointer): boolean => env.ui.snapping !== p.shift;

/** snap targets for a gesture over the whole project (built once per press) */
const snapIndex = (p: Project, opts: SnapOptions): SnapIndex => buildSnapIndex(p, opts);

/** does the drag involve a video event (then snapped targets are quantized to frames) */
const touchesVideo = (p: Project, ids: readonly string[]): boolean => ids.some((id) => findEvent(p, id)?.track.kind === 'video');

/** the grouping switch for ops that act on groups (Ignore Event Grouping turns it off) */
const groupsOn = (env: GestureEnv): boolean => !env.ui.ignoreGroups;

/**
 * snap one time: a target within 8 px, else the nearest frame. With snapping off the time is raw, unless `frames`
 * (Quantize to frames, which Vegas keeps on independently of snapping: picture edits, the cursor, the loop bar).
 */
function snapTime(env: GestureEnv, p: Pointer, S: SnapIndex, t: number, frames = false): { t: number; guide: number | null } {
  if (!snapOn(env, p)) return { t: frames ? snapToFrame(t, S.fps) : t, guide: null };
  const r = S.snap(t, env.view.pxPerSec);
  return { t: r.t, guide: r.snapped ? r.t : null };
}

/** snap a block moved by dt: whichever of its edges lands nearest a target (frames: as snapTime) */
function snapDelta(env: GestureEnv, p: Pointer, S: SnapIndex, edges: readonly number[], dt: number, frames = false): { dt: number; guide: number | null } {
  if (!snapOn(env, p)) {
    if (!frames || !edges.length) return { dt, guide: null };
    const e0 = Math.min(...edges);
    return { dt: snapToFrame(e0 + dt, S.fps) - e0, guide: null };
  }
  const r = S.snapDelta(edges, dt, env.view.pxPerSec);
  return { dt: r.dt, guide: r.snapped ? r.t : null };
}

/** an event's box under the gesture's current view */
const boxOf = (env: GestureEnv, project: Project, row: TrackRow, e: EditEvent): Box =>
  eventBox({ project, ui: env.ui, view: env.view, height: env.height, rows: env.rows, scrollY: env.scrollY, maxLens: new Map(), tabs: [] }, row, e);

/** row index at canvas y, clamped to the first / last track */
function rowIndexAt(env: GestureEnv, y: number): number {
  const ly = y - RULER_H + env.scrollY;
  if (env.rows.length === 0) return -1;
  if (ly < 0) return 0;
  const i = rowAt(env.rows, ly);
  return i < 0 ? env.rows.length - 1 : i;
}

function lookup(p: Project, id: string): { e: EditEvent; track: Track; ti: number } | null {
  const r = indexEvents(p).get(id);
  return r ? { e: r.ev, track: r.track, ti: r.ti } : null;
}

function eventIn(p: Project, id: string): EditEvent | null {
  for (const tr of p.tracks) for (const e of tr.events) if (e.id === id) return e;
  return null;
}

const fmtDb = (db: number): string => (db <= -95.9 ? '-inf dB' : `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`);

// ---------------------------------------------------------------------------
// event gestures
// ---------------------------------------------------------------------------
function moveGesture(env0: GestureEnv, p0: Pointer, primary: string, ids: readonly string[]): Gesture | null {
  const f = lookup(env0.base, primary);
  if (!f) return null;
  const pressT = tAt(env0, p0.x);
  const pressX = p0.x;
  const row0 = rowIndexAt(env0, p0.y);
  const copy = p0.ctrl;
  const groups = groupsOn(env0);
  const video = touchesVideo(env0.base, ids);
  const S = snapIndex(env0.base, { cursor: env0.ui.cursor, loop: env0.ui.loop, exclude: copy ? [] : ids, quantize: video });
  const edges = [f.e.start, eventEnd(f.e)];
  const { minDt } = moveRange(env0.base, ids, 0, groups);
  const fps = env0.base.fps;
  return {
    kind: 'move',
    cursor: copy ? 'copy' : CURSORS.grabbing,
    label: copy ? 'Copy Events' : ids.length > 1 ? 'Move Events' : 'Move Event',
    autoScroll: true,
    update(env, p) {
      // a vertical drag (to another track) keeps its time until the pointer has really moved sideways: no snap pull
      const sideways = Math.abs(p.x - pressX) >= M.dragSlop || Math.abs(env.view.scrollT - env0.view.scrollT) > 1e-9;
      const s = sideways ? snapDelta(env, p, S, edges, Math.max(minDt, tAt(env, p.x) - pressT), video) : { dt: 0, guide: null };
      const dt = Math.max(minDt, s.dt);
      const td = moveRange(env.base, ids, rowIndexAt(env, p.y) - row0, groups).trackDelta;
      const project = dragMove(env.base, { ids, dt, trackDelta: td, copy, ripple: env.ui.ripple, autoCrossfade: env.ui.autoCrossfade, groups });
      const rows = td ? `  ${td > 0 ? '↓' : '↑'}${Math.abs(td)}` : '';
      return { project, snapT: s.guide, badge: `${copy ? 'Copy ' : ''}${deltaCode(dt, fps)}\n${timecode(f.e.start + dt, fps)}${rows}` };
    },
  };
}

function trimGesture(env0: GestureEnv, p0: Pointer, primary: string, ids: readonly string[], edge: Edge): Gesture | null {
  const f = lookup(env0.base, primary);
  if (!f) return null;
  const pressT = tAt(env0, p0.x);
  const edgeT = edge === 'start' ? f.e.start : eventEnd(f.e);
  const stretch = p0.ctrl;
  const quantize = touchesVideo(env0.base, ids);
  const S = snapIndex(env0.base, { cursor: env0.ui.cursor, loop: env0.ui.loop, exclude: stretch ? [primary] : ids, quantize });
  const fps = env0.base.fps;
  const video = f.track.kind === 'video';
  /** the frame a trim shows in the preview: the new first frame, or the new last one */
  const edgeFrame = (e: EditEvent): number | null => (!video ? null : edge === 'start' ? e.start : Math.max(e.start, eventEnd(e) - 1 / fps));
  if (stretch) {
    return {
      kind: 'stretch',
      cursor: CURSORS.stretch,
      label: 'Time Stretch',
      autoScroll: true,
      update(env, p) {
        const s = snapTime(env, p, S, edgeT + tAt(env, p.x) - pressT, quantize);
        const project = stretchEvent(env.base, primary, edge, s.t);
        const e = eventIn(project, primary) ?? f.e;
        return { project, snapT: s.guide, badge: `Rate ${e.rate.toFixed(3)}×\nLength ${timecode(e.length, fps)}`, previewT: edgeFrame(e) };
      },
    };
  }
  const [lo, hi] = trimRange(env0.base, ids, edge, env0.ui.ripple);
  return {
    kind: 'trim',
    cursor: CURSORS.trim,
    label: edge === 'start' ? 'Trim Start' : 'Trim End',
    autoScroll: true,
    update(env, p) {
      const s = snapTime(env, p, S, edgeT + tAt(env, p.x) - pressT, quantize);
      const dt = clamp(s.t - edgeT, lo, hi);
      const project = dragTrim(env.base, { ids, edge, dt, ripple: env.ui.ripple, autoCrossfade: env.ui.autoCrossfade });
      const len = edge === 'end' ? f.e.length + dt : f.e.length - dt;
      const atLimit = (dt === lo && Number.isFinite(lo)) || (dt === hi && Number.isFinite(hi));
      const e = eventIn(project, primary) ?? f.e;
      return { project, snapT: s.guide, badge: `${deltaCode(dt, fps)}${atLimit ? '  (limit)' : ''}\nLength ${timecode(len, fps)}`, previewT: edgeFrame(e) };
    },
  };
}

function slipGesture(env0: GestureEnv, p0: Pointer, primary: string, ids: readonly string[]): Gesture | null {
  const f = lookup(env0.base, primary);
  if (!f) return null;
  const pressT = tAt(env0, p0.x);
  const fps = env0.base.fps;
  return {
    kind: 'slip',
    cursor: CURSORS.slip,
    label: 'Slip',
    autoScroll: false,
    update(env, p) {
      // the media follows the pointer: dragging right shows earlier material
      const dSrc = snapToFrame(-(tAt(env, p.x) - pressT) * (f.e.rate || 1), fps);
      const project = slipEvents(env.base, ids, dSrc);
      const after = eventIn(project, primary) ?? f.e;
      // the preview follows the slipped material: at the cursor when it is over the event, else the event's head
      const c = env.ui.cursor;
      const previewT = f.track.kind !== 'video' ? null : c >= f.e.start && c < eventEnd(f.e) ? c : f.e.start;
      return { project, snapT: null, badge: `Slip ${deltaCode(after.srcIn - f.e.srcIn, fps)}\nIn ${timecode(after.srcIn, fps)}`, previewT };
    },
  };
}

function fadeGesture(env0: GestureEnv, id: string, which: 'in' | 'out'): Gesture | null {
  const f = lookup(env0.base, id);
  if (!f) return null;
  const video = f.track.kind === 'video';
  const S = snapIndex(env0.base, { cursor: env0.ui.cursor, loop: env0.ui.loop, exclude: [id], quantize: video });
  const end = eventEnd(f.e);
  const other = which === 'in' ? f.e.fadeOut.len : f.e.fadeIn.len;
  const fps = env0.base.fps;
  return {
    kind: 'fade',
    cursor: which === 'in' ? CURSORS.fadeIn : CURSORS.fadeOut,
    label: which === 'in' ? 'Fade In' : 'Fade Out',
    autoScroll: true,
    update(env, p) {
      const s = snapTime(env, p, S, tAt(env, p.x), video);
      // the two fades never cross
      const len = clamp(which === 'in' ? s.t - f.e.start : end - s.t, 0, Math.max(0, f.e.length - other));
      const project = setFade(env.base, id, which, { len });
      return { project, snapT: s.guide, badge: `Fade ${which} ${timecode(len, fps)}` };
    },
  };
}

function levelGesture(env0: GestureEnv, id: string): Gesture | null {
  const f = lookup(env0.base, id);
  const row = f ? env0.rows[f.ti] : undefined;
  if (!f || !row) return null;
  const audio = f.track.kind === 'audio';
  // the line cannot be dragged above unity, but an existing boost is kept while it stays at the top
  const maxDb = Math.max(0, f.e.gainDb ?? 0);
  return {
    kind: 'level',
    cursor: CURSORS.level,
    label: audio ? 'Event Volume' : 'Event Opacity',
    autoScroll: false,
    update(env, p) {
      const b = boxOf(env, env.base, row, f.e);
      const frac = clamp((b.bodyTop + b.bodyH - p.y) / Math.max(1, b.bodyH), 0, 1);
      if (audio) {
        let db = frac >= 0.999 ? maxDb : fracToGain(frac);
        if (p.ctrl) db = Math.round(db * 2) / 2; // ctrl: half-dB steps
        const project = setEventGain(env.base, id, db);
        return { project, snapT: null, badge: `Volume ${fmtDb(eventIn(project, id)?.gainDb ?? db)}` };
      }
      const op = p.ctrl ? Math.round(frac * 20) / 20 : frac;
      return { project: setEventOpacity(env.base, id, op), snapT: null, badge: `Opacity ${Math.round(op * 100)}%` };
    },
  };
}

/** drag an envelope point (a freshly inserted one when the press was on the line) */
function envelopeGesture(env0: GestureEnv, p0: Pointer, id: string, kind: EnvelopeKind, index: number, insert: boolean): Gesture | null {
  const f = lookup(env0.base, id);
  const row = f ? env0.rows[f.ti] : undefined;
  if (!f || !row) return null;
  const scale = ENVELOPES[kind];
  const target: EnvelopeTarget = { scope: 'event', id, env: kind };
  const fps = env0.base.fps;
  let base = env0.base;
  let i = index;
  if (insert) {
    const keys = f.e.envelopes?.[kind] ?? [];
    const rel = clamp(snapToFrame(tAt(env0, p0.x), fps) - f.e.start, 0, f.e.length);
    const curve = keys.filter((k) => k.t <= rel).at(-1)?.curve;
    base = addEnvelopePoint(base, target, { t: rel, v: keyValue(keys, rel, scale.dflt), ...(curve ? { curve } : {}) });
    const after = eventIn(base, id)?.envelopes?.[kind] ?? [];
    i = after.findIndex((k) => Math.abs(k.t - rel) < 1e-6);
  }
  const k0 = eventIn(base, id)?.envelopes?.[kind]?.[i];
  if (!k0) return null;
  const pressX = p0.x;
  const pressY = p0.y;
  return {
    kind: 'envelope',
    cursor: CURSORS.envPoint,
    label: insert ? 'Add Envelope Point' : 'Move Envelope Point',
    autoScroll: false,
    // Vegas: a click on the line does nothing, a DOUBLE-click adds a point (Timeline onDoubleClick); dragging the
    // line inserts a point there and drags it
    commitOnClick: false,
    update(env, p) {
      const b = boxOf(env, base, row, f.e);
      // ctrl locks the axis with the larger travel (Shift is the snapping toggle)
      let x = p.x;
      let y = p.y;
      if (p.ctrl) {
        if (Math.abs(p.x - pressX) > Math.abs(p.y - pressY)) y = pressY;
        else x = pressX;
      }
      const t = snapToFrame(f.e.start + k0.t + tAt(env, x) - tAt(env, pressX), fps) - f.e.start;
      const v = Math.abs(y - pressY) < 0.5 ? k0.v : scale.fromFrac(clamp((b.bodyTop + b.bodyH - y) / Math.max(1, b.bodyH), 0, 1));
      const project = moveEnvelopePoint(base, target, i, { t, v });
      const k = eventIn(project, id)?.envelopes?.[kind]?.[i] ?? k0;
      return { project, snapT: null, badge: `${scale.label(k.v)}\n${timecode(f.e.start + k.t, fps)}` };
    },
  };
}

/** drag a TRACK envelope point (timeline time; a fresh point when the press was on the line) */
function trackEnvelopeGesture(env0: GestureEnv, p0: Pointer, trackId: string, kind: EnvelopeKind, index: number, insert: boolean): Gesture | null {
  const ti = env0.base.tracks.findIndex((t) => t.id === trackId);
  const tr = env0.base.tracks[ti];
  if (!tr || tr.lock || !env0.rows[ti]) return null;
  const scale = ENVELOPES[kind];
  const target: EnvelopeTarget = { scope: 'track', id: trackId, env: kind };
  const fps = env0.base.fps;
  let base = env0.base;
  let i = index;
  if (insert) {
    const keys = tr.envelopes?.[kind] ?? [];
    const t = Math.max(0, snapToFrame(tAt(env0, p0.x), fps));
    const curve = keys.filter((k) => k.t <= t).at(-1)?.curve;
    base = addEnvelopePoint(base, target, { t, v: keyValue(keys, t, scale.dflt), ...(curve ? { curve } : {}) });
    i = (base.tracks[ti].envelopes?.[kind] ?? []).findIndex((k) => Math.abs(k.t - t) < 1e-6);
  }
  const k0 = base.tracks[ti]?.envelopes?.[kind]?.[i];
  if (!k0) return null;
  const pressX = p0.x;
  const pressY = p0.y;
  return {
    kind: 'envelope',
    cursor: CURSORS.envPoint,
    label: insert ? 'Add Track Envelope Point' : 'Move Track Envelope Point',
    autoScroll: false,
    commitOnClick: false,
    update(env, p) {
      const row = env.rows[ti];
      let x = p.x;
      let y = p.y;
      if (p.ctrl) {
        if (Math.abs(p.x - pressX) > Math.abs(p.y - pressY)) y = pressY;
        else x = pressX;
      }
      const t = Math.max(0, snapToFrame(k0.t + tAt(env, x) - tAt(env, pressX), fps));
      const scene = { project: base, ui: env.ui, view: env.view, height: env.height, rows: env.rows, scrollY: env.scrollY, maxLens: new Map(), tabs: [] };
      const v = Math.abs(y - pressY) < 0.5 || !row ? k0.v : scale.fromFrac(trackEnvFrac(scene, row, y));
      const project = moveEnvelopePoint(base, target, i, { t, v });
      const k = project.tracks[ti]?.envelopes?.[kind]?.[i] ?? k0;
      return { project, snapT: null, badge: `${tr.name} ${kind}\n${scale.label(k.v)}  ${timecode(k.t, fps)}` };
    },
  };
}

// ---------------------------------------------------------------------------
// ruler gestures
// ---------------------------------------------------------------------------
function scrubGesture(env0: GestureEnv): Gesture {
  const S = snapIndex(env0.base, { cursor: null, loop: env0.ui.loop, quantize: true });
  return {
    kind: 'scrub',
    cursor: CURSORS.ruler,
    label: '',
    autoScroll: true,
    update(env, p) {
      const s = snapTime(env, p, S, Math.max(0, tAt(env, p.x)), true);
      return { ui: { cursor: Math.max(0, s.t) }, snapT: s.guide, badge: null };
    },
  };
}

function loopGesture(env0: GestureEnv, p0: Pointer, part: 'start' | 'end' | 'body' | 'empty'): Gesture {
  const S = snapIndex(env0.base, { cursor: env0.ui.cursor, quantize: true });
  const pressT = snapToFrame(Math.max(0, tAt(env0, p0.x)), env0.base.fps);
  const loop0 = env0.ui.loop ?? { start: pressT, end: pressT };
  const fps = env0.base.fps;
  return {
    kind: 'loop',
    cursor: CURSORS.loop,
    label: '',
    autoScroll: true,
    update(env, p) {
      const t = Math.max(0, tAt(env, p.x));
      let loop: { start: number; end: number };
      let guide: number | null;
      if (part === 'body') {
        const len = loop0.end - loop0.start;
        const s = snapDelta(env, p, S, [loop0.start, loop0.end], Math.max(-loop0.start, t - pressT), true);
        guide = s.guide;
        const a = Math.max(0, loop0.start + s.dt);
        loop = { start: a, end: a + len };
      } else {
        const s = snapTime(env, p, S, t, true);
        guide = s.guide;
        const anchor = part === 'start' ? loop0.end : part === 'end' ? loop0.start : pressT;
        loop = { start: Math.min(anchor, s.t), end: Math.max(anchor, s.t) };
      }
      return { ui: { loop }, snapT: guide, badge: `Loop ${timecode(loop.start, fps)}\nLength ${timecode(loop.end - loop.start, fps)}` };
    },
  };
}

function markerGesture(env0: GestureEnv, p0: Pointer, id: string): Gesture | null {
  const m = env0.base.markers.find((x) => x.id === id);
  if (!m) return null;
  const S = snapIndex({ ...env0.base, markers: env0.base.markers.filter((x) => x.id !== id) }, { cursor: env0.ui.cursor, loop: env0.ui.loop });
  const pressT = tAt(env0, p0.x);
  return {
    kind: 'marker',
    cursor: CURSORS.loop,
    label: 'Move Marker',
    autoScroll: true,
    update(env, p) {
      const s = snapTime(env, p, S, Math.max(0, m.t + tAt(env, p.x) - pressT));
      return { project: moveMarker(env.base, id, s.t), snapT: s.guide, badge: timecode(s.t, env.base.fps) };
    },
  };
}

function regionGesture(env0: GestureEnv, p0: Pointer, id: string, part: 'start' | 'end'): Gesture | null {
  const r = env0.base.regions.find((x) => x.id === id);
  if (!r) return null;
  const S = snapIndex({ ...env0.base, regions: env0.base.regions.filter((x) => x.id !== id) }, { cursor: env0.ui.cursor, loop: env0.ui.loop });
  const pressT = tAt(env0, p0.x);
  const from = part === 'start' ? r.start : r.end;
  return {
    kind: 'region',
    cursor: CURSORS.loop,
    label: 'Edit Region',
    autoScroll: true,
    update(env, p) {
      const s = snapTime(env, p, S, Math.max(0, from + tAt(env, p.x) - pressT));
      const minLen = 1 / env.base.fps;
      const project = updateRegion(env.base, id, part === 'start' ? { start: Math.min(s.t, r.end - minLen) } : { end: Math.max(s.t, r.start + minLen) });
      return { project, snapT: s.guide, badge: timecode(s.t, env.base.fps) };
    },
  };
}

// ---------------------------------------------------------------------------
// marquee
// ---------------------------------------------------------------------------
/** events intersecting the time span [t0, t1] on rows [r0, r1] */
export function eventsInRect(rows: readonly TrackRow[], t0: number, t1: number, r0: number, r1: number): string[] {
  const out: string[] = [];
  for (let i = Math.max(0, r0); i <= Math.min(rows.length - 1, r1); i++) {
    for (const e of rows[i].track.events) if (e.start < t1 && eventEnd(e) > t0) out.push(e.id);
  }
  return out;
}

function marqueeGesture(env0: GestureEnv, p0: Pointer): Gesture {
  const pressT = tAt(env0, p0.x);
  const pressLy = p0.y - RULER_H + env0.scrollY;
  const keep = p0.ctrl || p0.shift ? new Set(env0.ui.selection) : new Set<string>();
  return {
    kind: 'marquee',
    cursor: CURSORS.marquee,
    label: '',
    autoScroll: true,
    update(env, p) {
      const t = tAt(env, p.x);
      const ly = p.y - RULER_H + env.scrollY;
      const rowOf = (y: number) => {
        const i = rowAt(env.rows, y);
        return i >= 0 ? i : y < 0 ? 0 : env.rows.length - 1;
      };
      const lo = Math.min(pressLy, ly);
      const hi = Math.max(pressLy, ly);
      const last = env.rows.at(-1);
      const total = last ? last.top + last.height : 0;
      const hits = hi < 0 || lo >= total ? [] : eventsInRect(env.rows, Math.min(pressT, t), Math.max(pressT, t), rowOf(Math.max(0, lo)), rowOf(Math.min(total - 1, hi)));
      const sel = new Set(keep);
      for (const id of hits) {
        if (p0.ctrl && keep.has(id)) sel.delete(id);
        else sel.add(id);
      }
      return { ui: { selection: [...sel] }, snapT: null, badge: hits.length ? `${hits.length} event${hits.length > 1 ? 's' : ''}` : null };
    },
  };
}

// ---------------------------------------------------------------------------
// dispatcher
// ---------------------------------------------------------------------------
/**
 * The gesture for a primary-button press on `hit`. `ids` is the selection the event gestures act on (already
 * expanded by groups; the caller makes sure it contains the pressed event).
 */
export function startGesture(hit: Hit, env: GestureEnv, p: Pointer, ids: readonly string[]): Gesture | null {
  const tool = env.ui.tool;
  switch (hit.zone) {
    case 'ruler':
    case 'markerBar':
      return scrubGesture(env);
    case 'loopBar':
      return loopGesture(env, p, hit.part);
    case 'marker':
      return markerGesture(env, p, hit.id);
    case 'region':
      return regionGesture(env, p, hit.id, hit.part);
    case 'trackEnv':
      return trackEnvelopeGesture(env, p, hit.trackId, hit.kind, hit.index, hit.part === 'line');
    case 'lane':
    case 'empty':
      // Vegas Normal tool: dragging empty track space makes a time selection (the loop bar); the marquee belongs to
      // the Selection tool, or Ctrl-drag
      if (tool === 'select' || p.ctrl) return marqueeGesture(env, p);
      return loopGesture(env, p, 'empty');
    case 'event': {
      const f = lookup(env.base, hit.eventId);
      if (!f) return null;
      const locked = !!(f.e.lock || f.track.lock);
      switch (hit.part) {
        case 'fxBtn':
        case 'panCropBtn':
          return null; // a click (Timeline opens the FX / Pan/Crop)
        case 'envPoint':
        case 'envLine':
          if (!hit.env || locked) return null;
          return envelopeGesture(env, p, hit.eventId, hit.env.kind, hit.env.index, hit.part === 'envLine');
        case 'fadeIn':
        case 'fadeOut':
          if (locked || tool === 'envelope') return null;
          return fadeGesture(env, hit.eventId, hit.part === 'fadeIn' ? 'in' : 'out');
        case 'level':
          if (locked || tool === 'envelope') return null;
          return levelGesture(env, hit.eventId);
        case 'trimStart':
        case 'trimEnd':
          if (locked || tool === 'envelope') return null;
          return trimGesture(env, p, hit.eventId, ids.includes(hit.eventId) ? ids : [hit.eventId], hit.part === 'trimStart' ? 'start' : 'end');
        case 'body':
          if (tool === 'select') return marqueeGesture(env, p);
          if (locked || tool === 'envelope') return null;
          return p.alt ? slipGesture(env, p, hit.eventId, ids) : moveGesture(env, p, hit.eventId, ids);
      }
    }
  }
  return null;
}

/** the pointer cursor for hovering `hit` with the given modifiers */
export function hoverCursor(hit: Hit | null, mods: { ctrl: boolean; alt: boolean }, tool: EditorUi['tool'], locked: boolean): string {
  if (!hit) return 'default';
  switch (hit.zone) {
    case 'loopBar':
      return hit.part === 'empty' ? 'crosshair' : hit.part === 'body' ? 'grab' : CURSORS.loop;
    case 'marker':
    case 'region':
      return CURSORS.loop;
    case 'ruler':
    case 'markerBar':
      return CURSORS.ruler;
    case 'trackEnv':
      return hit.part === 'point' ? CURSORS.envPoint : CURSORS.envAdd;
    case 'lane':
    case 'empty':
      return tool === 'select' || mods.ctrl ? CURSORS.marquee : 'default';
    case 'event':
      if (hit.part === 'fxBtn' || hit.part === 'panCropBtn') return 'pointer';
      if (hit.part === 'envPoint') return CURSORS.envPoint;
      if (hit.part === 'envLine') return CURSORS.envAdd;
      if (locked) return 'not-allowed';
      if (tool === 'envelope') return 'default';
      switch (hit.part) {
        case 'fadeIn':
          return CURSORS.fadeIn;
        case 'fadeOut':
          return CURSORS.fadeOut;
        case 'level':
          return CURSORS.level;
        case 'trimStart':
        case 'trimEnd':
          return mods.ctrl ? CURSORS.stretch : CURSORS.trim;
        default:
          return tool === 'select' ? CURSORS.marquee : mods.alt ? CURSORS.slip : CURSORS.move;
      }
  }
}
