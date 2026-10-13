/**
 * Timeline hit testing — what is under the pointer, with the grab zones Vegas users expect.
 *
 *   const s: LaneScene = { project, view, rows, scrollY, height, … }
 *   eventBox(s, row, e)          -> Box   the event's rectangle in canvas px (title strip + body)
 *   levelFrac(track, e)          -> 0..1  height of the event volume / opacity line in the body
 *   hitTest(s, x, y, mods)       -> Hit   (ruler bands, markers, regions, loop bar, event zones, lanes)
 *
 * Event zones, most specific first: the FX / Pan/Crop buttons in the title strip (when the event has them),
 * fade handles (top corners at the fade length), envelope points and segments (when envelopes are shown), the
 * level line (top of the body), the trim edges (ctrl: stretch), and the body (alt: slip). Where events overlap
 * (a transition) the edge nearest the pointer wins, then the later (front) event's body.
 *
 * Track envelopes (Vegas: timeline-time automation drawn across the whole lane, over the events) are tested
 * before the events of their row, so their points and line stay grabbable wherever they cross an event.
 */
import type { EditEvent, Keyframe, Project, Track } from '../../model/types';
import type { EditorUi } from '../../state/store';
import { ENVELOPES, keyValue, gainToFrac, type EnvelopeKind } from './curves.ts';
import { tToX, xToT, rowAt, visibleRange, type TrackRow, type View } from './geometry.ts';
import { M, RULER_H } from './style.ts';

/** a tab drawn in the marker bar, recorded by the painter so clicks can find it */
export interface Tab {
  kind: 'marker' | 'regionStart' | 'regionEnd';
  id: string;
  x0: number;
  x1: number;
}

/** everything geometry needs about the current paint */
export interface LaneScene {
  project: Project;
  ui: EditorUi;
  view: View;
  /** canvas height (CSS px) */
  height: number;
  rows: TrackRow[];
  scrollY: number;
  /** longest event per track id (visible-range culling) */
  maxLens: ReadonlyMap<string, number>;
  /** marker-bar tabs from the last paint */
  tabs: readonly Tab[];
}

export interface Box {
  x0: number;
  x1: number;
  /** top / height of the whole event (canvas px) */
  y: number;
  h: number;
  /** title strip height (0 when the track is too short for one) */
  headH: number;
  bodyTop: number;
  bodyH: number;
}

export type EventPart = 'body' | 'trimStart' | 'trimEnd' | 'fadeIn' | 'fadeOut' | 'level' | 'envPoint' | 'envLine' | 'fxBtn' | 'panCropBtn';

export type Hit =
  | { zone: 'loopBar'; part: 'start' | 'end' | 'body' | 'empty'; t: number }
  | { zone: 'ruler'; t: number }
  | { zone: 'markerBar'; t: number }
  | { zone: 'marker'; id: string; t: number }
  | { zone: 'region'; id: string; part: 'start' | 'end'; t: number }
  | { zone: 'event'; part: EventPart; eventId: string; trackId: string; row: number; t: number; env?: { kind: EnvelopeKind; index: number } }
  | { zone: 'trackEnv'; part: 'point' | 'line'; kind: EnvelopeKind; index: number; trackId: string; row: number; t: number }
  | { zone: 'lane'; trackId: string; row: number; t: number }
  | { zone: 'empty'; t: number };

/** canvas y of a row's top */
export const rowY = (s: LaneScene, row: TrackRow): number => RULER_H + row.top - s.scrollY;

export function eventBox(s: LaneScene, row: TrackRow, e: EditEvent): Box {
  const y = rowY(s, row) + 1;
  const h = row.height - 2;
  const headH = h >= M.headerMinH ? M.eventHeader : 0;
  return { x0: tToX(s.view, e.start), x1: tToX(s.view, e.start + e.length), y, h, headH, bodyTop: y + headH, bodyH: h - headH };
}

/** the event level line's height in the body: audio volume (0 dB at the top) or video opacity. A boost above
 *  unity draws at the top (the line is tinted: see draw.ts) */
export function levelFrac(track: Track, e: EditEvent): number {
  return track.kind === 'audio' ? gainToFrac(Math.min(0, e.gainDb ?? 0)) : Math.max(0, Math.min(1, e.opacity ?? 1));
}

/** size of the FX / Pan/Crop buttons in an event's title strip (CSS px) */
export const EVENT_BTN = 13;

/**
 * The title-strip buttons an event shows, right to left: [part, x] (none when the strip is absent or too narrow).
 * They sit at the right end of the event's VISIBLE strip: where a later event overlaps it (a transition), that
 * event is painted on top, so the buttons move left of the overlap.
 */
export function eventButtons(s: LaneScene, track: Track, e: EditEvent, b: Box): { part: 'fxBtn' | 'panCropBtn'; x: number; on: boolean }[] {
  if (!b.headH) return [];
  const fxList = track.kind === 'video' ? e.videoFx : e.audioFx;
  const fx = !!fxList?.length;
  const pc = track.kind === 'video' && !!e.panCrop?.length;
  if (!fx && !pc) return [];
  let right = b.x1;
  const end = e.start + e.length;
  for (const o of track.events) if (o !== e && o.start > e.start && o.start < end) right = Math.min(right, tToX(s.view, o.start));
  if (right - b.x0 < 70) return [];
  const out: { part: 'fxBtn' | 'panCropBtn'; x: number; on: boolean }[] = [];
  let x = right - EVENT_BTN - 2;
  if (fx) {
    out.push({ part: 'fxBtn', x, on: !!fxList?.some((f) => f.enabled) });
    x -= EVENT_BTN + 2;
  }
  if (pc) out.push({ part: 'panCropBtn', x, on: true });
  return out;
}

/** envelopes a TRACK of this kind can carry (timeline time, drawn across the lane) */
export const trackEnvelopeKinds = (track: Track): EnvelopeKind[] => (track.kind === 'audio' ? ['volume', 'pan'] : ['opacity']);

/** canvas y of a track-envelope value inside its lane (2 px inset top and bottom) */
export function trackEnvY(s: LaneScene, row: TrackRow, kind: EnvelopeKind, v: number): number {
  const top = rowY(s, row) + 2;
  const h = Math.max(1, row.height - 5);
  return top + h * (1 - ENVELOPES[kind].toFrac(v));
}

/** the 0..1 height of canvas y in a lane (for dragging a track-envelope point) */
export function trackEnvFrac(s: LaneScene, row: TrackRow, y: number): number {
  const top = rowY(s, row) + 2;
  const h = Math.max(1, row.height - 5);
  return Math.max(0, Math.min(1, 1 - (y - top) / h));
}

function trackEnvelopeHit(s: LaneScene, row: TrackRow, x: number, y: number): { part: 'point' | 'line'; kind: EnvelopeKind; index: number } | null {
  if (!s.ui.showEnvelopes || row.height < 14) return null;
  const tr = row.track;
  for (const kind of trackEnvelopeKinds(tr)) {
    const keys: Keyframe[] | undefined = tr.envelopes?.[kind];
    if (!keys || keys.length === 0) continue;
    for (let i = 0; i < keys.length; i++) {
      const kx = tToX(s.view, keys[i].t);
      if (Math.abs(kx - x) <= M.envGrab && Math.abs(trackEnvY(s, row, kind, keys[i].v) - y) <= M.envGrab) return { part: 'point', kind, index: i };
    }
    const t = xToT(s.view, x);
    if (Math.abs(trackEnvY(s, row, kind, keyValue(keys, t, ENVELOPES[kind].dflt)) - y) <= M.envGrab - 1) {
      let index = 0;
      while (index < keys.length && keys[index].t <= t) index++;
      return { part: 'line', kind, index };
    }
  }
  return null;
}

/** envelopes an event of this track kind can carry */
export const envelopeKinds = (track: Track): EnvelopeKind[] => (track.kind === 'audio' ? ['volume', 'pan'] : ['opacity']);

/** canvas y of an envelope value inside the body */
export const envY = (b: Box, kind: EnvelopeKind, v: number): number => b.bodyTop + b.bodyH * (1 - ENVELOPES[kind].toFrac(v));

/** visible events of a row with their boxes, in paint order (by start) */
export function visibleEvents(s: LaneScene, row: TrackRow): { e: EditEvent; b: Box }[] {
  const tr = row.track;
  const t0 = xToT(s.view, -4);
  const t1 = xToT(s.view, s.view.width + 4);
  const [i0, i1] = visibleRange(tr, s.maxLens.get(tr.id) ?? 0, t0, t1);
  const out: { e: EditEvent; b: Box }[] = [];
  for (let i = i0; i < i1; i++) {
    const e = tr.events[i];
    if (e.start + e.length < t0) continue;
    out.push({ e, b: eventBox(s, row, e) });
  }
  return out;
}

function envelopeHit(s: LaneScene, track: Track, e: EditEvent, b: Box, x: number, y: number): { part: 'envPoint' | 'envLine'; kind: EnvelopeKind; index: number } | null {
  if (!s.ui.showEnvelopes || b.bodyH < 8) return null;
  for (const kind of envelopeKinds(track)) {
    const keys: Keyframe[] | undefined = e.envelopes?.[kind];
    if (!keys || keys.length === 0) continue;
    for (let i = 0; i < keys.length; i++) {
      const kx = tToX(s.view, e.start + keys[i].t);
      const ky = envY(b, kind, keys[i].v);
      if (Math.abs(kx - x) <= M.envGrab && Math.abs(ky - y) <= M.envGrab) return { part: 'envPoint', kind, index: i };
    }
    const rel = xToT(s.view, x) - e.start;
    const ly = envY(b, kind, keyValue(keys, rel, ENVELOPES[kind].dflt));
    if (Math.abs(ly - y) <= M.envGrab - 1) {
      let index = 0;
      while (index < keys.length && keys[index].t <= rel) index++;
      return { part: 'envLine', kind, index };
    }
  }
  return null;
}

/** the zone of one event at (x, y); null when outside it */
function eventPartAt(s: LaneScene, track: Track, e: EditEvent, b: Box, x: number, y: number): { part: EventPart; env?: { kind: EnvelopeKind; index: number } } | null {
  if (x < b.x0 - M.edgeGrab || x > b.x1 + M.edgeGrab || y < b.y || y > b.y + b.h) return null;
  const w = b.x1 - b.x0;
  const roomy = w >= 18;
  if (b.headH && y <= b.y + b.headH) {
    for (const btn of eventButtons(s, track, e, b)) if (x >= btn.x && x <= btn.x + EVENT_BTN) return { part: btn.part };
  }
  if (roomy && y <= b.y + M.fadeGrab) {
    const fx = b.x0 + e.fadeIn.len * s.view.pxPerSec;
    const ox = b.x1 - e.fadeOut.len * s.view.pxPerSec;
    if (Math.abs(x - fx) <= M.fadeGrab && x <= b.x0 + w / 2) return { part: 'fadeIn' };
    if (Math.abs(x - ox) <= M.fadeGrab && x >= b.x0 + w / 2) return { part: 'fadeOut' };
  }
  if (roomy) {
    const env = envelopeHit(s, track, e, b, x, y);
    if (env) return { part: env.part, env: { kind: env.kind, index: env.index } };
  }
  const nearStart = Math.abs(x - b.x0) <= M.edgeGrab;
  const nearEnd = Math.abs(x - b.x1) <= M.edgeGrab;
  if (nearStart || nearEnd) {
    if (nearStart && nearEnd) return { part: x - b.x0 < b.x1 - x ? 'trimStart' : 'trimEnd' };
    return { part: nearStart ? 'trimStart' : 'trimEnd' };
  }
  if (x < b.x0 || x > b.x1) return null;
  if (roomy && b.bodyH >= 10) {
    const ly = b.bodyTop + b.bodyH * (1 - levelFrac(track, e));
    if (Math.abs(y - ly) <= M.levelGrab && y >= b.y + (b.headH ? b.headH - M.levelGrab : 0)) return { part: 'level' };
  }
  return { part: 'body' };
}

export function hitTest(s: LaneScene, x: number, y: number): Hit {
  const t = xToT(s.view, x);
  if (y < M.loopBar) {
    const loop = s.ui.loop;
    if (loop) {
      const a = tToX(s.view, loop.start);
      const b = tToX(s.view, loop.end);
      if (Math.abs(x - a) <= 5) return { zone: 'loopBar', part: 'start', t };
      if (Math.abs(x - b) <= 5) return { zone: 'loopBar', part: 'end', t };
      if (x > a && x < b) return { zone: 'loopBar', part: 'body', t };
    }
    return { zone: 'loopBar', part: 'empty', t };
  }
  if (y < M.loopBar + M.ruler) return { zone: 'ruler', t };
  if (y < RULER_H) {
    // later tabs are painted on top: search backwards
    for (let i = s.tabs.length - 1; i >= 0; i--) {
      const tab = s.tabs[i];
      if (x < tab.x0 || x > tab.x1) continue;
      if (tab.kind === 'marker') return { zone: 'marker', id: tab.id, t };
      return { zone: 'region', id: tab.id, part: tab.kind === 'regionStart' ? 'start' : 'end', t };
    }
    return { zone: 'markerBar', t };
  }
  const ri = rowAt(s.rows, y - RULER_H + s.scrollY);
  if (ri < 0) return { zone: 'empty', t };
  const row = s.rows[ri];
  const track = row.track;
  const te = trackEnvelopeHit(s, row, x, y);
  if (te) return { zone: 'trackEnv', part: te.part, kind: te.kind, index: te.index, trackId: track.id, row: ri, t };
  const evs = visibleEvents(s, row);
  // edges first (nearest wins), so the seam of a transition can be trimmed from either side
  let best: { e: EditEvent; part: EventPart; d: number; env?: { kind: EnvelopeKind; index: number } } | null = null;
  for (let i = evs.length - 1; i >= 0; i--) {
    const { e, b } = evs[i];
    const hit = eventPartAt(s, track, e, b, x, y);
    if (!hit) continue;
    let d: number;
    if (hit.part === 'trimStart') d = Math.abs(x - b.x0);
    else if (hit.part === 'trimEnd') d = Math.abs(x - b.x1);
    else if (hit.part === 'body') d = M.edgeGrab + 1; // bodies lose to any edge in reach
    else if (hit.part === 'fxBtn' || hit.part === 'panCropBtn') d = -2; // a button always wins
    else d = -1; // handles, envelopes and level lines are deliberate targets
    if (!best || d < best.d) best = { e, part: hit.part, d, env: hit.env };
  }
  if (best) return { zone: 'event', part: best.part, eventId: best.e.id, trackId: track.id, row: ri, t, ...(best.env ? { env: best.env } : {}) };
  return { zone: 'lane', trackId: track.id, row: ri, t };
}
