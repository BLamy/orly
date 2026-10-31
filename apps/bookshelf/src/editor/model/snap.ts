/**
 * Snapping (Vegas "Enable Snapping"): collect the times an edit can lock to, then snap a time or a dragged block.
 *
 *   const S = buildSnapIndex(project, { cursor, loop, exclude: dragged })   // once per drag
 *   S.snap(t, pxPerSec)                  -> { t, snapped, target }            // a single edge / the cursor
 *   S.snapDelta([start, end], dt, pxPerSec) -> { dt, snapped, target, edge } // a block: whichever edge is nearest
 *   editPoints(project) / nextEditPoint(project, t, ±1)                       // Ctrl+← / Ctrl+→
 *
 * Targets: the cursor, event edges (minus the dragged events'), markers, region edges, loop-bar edges and narration
 * word boundaries (AudioMedia.words placed through each event that plays them: t = start + (w − srcIn) / rate).
 * The nearest target within `thresholdPx` (default 8 px at the current zoom) wins; equal distances go to the
 * stronger kind (cursor > marker > edge > region > loop > word). With no target in reach the time is quantized to
 * the frame grid (`frames: false` turns that off), so edits stay frame-exact for the renderer; that is reported
 * as `snapped: false` (no snap line to draw).
 *
 * Vegas "Quantize to frames": with `quantize: true` a caught target is rounded to the frame grid too. Narration
 * word boundaries and audio edges sit between frames, so without it a picture edit that snaps to a word lands
 * off-frame (the renderer is frame-exact, the edit would not be). Gestures pass `quantize` whenever a video event
 * is involved; audio-only drags stay sample-accurate.
 */
import type { AudioMedia, EditEvent, Project } from './types.ts';
import { eventEnd } from './types.ts';

export type SnapKind = 'cursor' | 'marker' | 'edge' | 'region' | 'loop' | 'word' | 'frame';

export interface SnapTarget {
  t: number;
  kind: SnapKind;
  /** word text, marker/region label */
  label?: string;
  /** the event, marker or region id the target belongs to */
  ref?: string;
}

export interface SnapOptions {
  cursor?: number | null;
  loop?: { start: number; end: number } | null;
  /** events being dragged: their own edges and words are not targets */
  exclude?: Iterable<string>;
  /** target families (all on by default) */
  edges?: boolean;
  markers?: boolean;
  regions?: boolean;
  words?: boolean;
  /** quantize to the frame grid when no target is in reach (default true) */
  frames?: boolean;
  /** also round a caught target to the frame grid (Vegas "Quantize to frames"; default false) */
  quantize?: boolean;
  /** only collect targets inside this window (e.g. the visible range ± a screen) */
  window?: { start: number; end: number };
}

export interface SnapResult {
  t: number;
  /** true when a target (not just the frame grid) caught the time */
  snapped: boolean;
  target: SnapTarget | null;
}

export interface SnapIndex {
  /** sorted by time */
  readonly targets: readonly SnapTarget[];
  readonly fps: number;
  snap(t: number, pxPerSec: number, thresholdPx?: number): SnapResult;
  /** snap a block being moved by dt: each of its edges (pre-move times) is tried; returns the adjusted dt */
  snapDelta(edges: readonly number[], dt: number, pxPerSec: number, thresholdPx?: number): SnapResult & { dt: number; edge: number };
}

export const SNAP_THRESHOLD_PX = 8;

const PRIORITY: Record<SnapKind, number> = { cursor: 0, marker: 1, edge: 2, region: 3, loop: 4, word: 5, frame: 6 };
const EPS = 1e-6;

/** nearest frame boundary */
export function snapToFrame(t: number, fps: number): number {
  return fps > 0 ? Math.round(t * fps) / fps : t;
}

/** word boundaries an event plays, in timeline time (start and end of each word inside the event) */
export function eventWordTimes(e: EditEvent, m: AudioMedia): { t: number; w: string; edge: 'start' | 'end' }[] {
  const out: { t: number; w: string; edge: 'start' | 'end' }[] = [];
  if (!m.words?.length || !(e.rate > 0)) return out;
  const end = eventEnd(e);
  for (const w of m.words) {
    for (const edge of ['start', 'end'] as const) {
      const t = e.start + (w[edge] - e.srcIn) / e.rate;
      if (t >= e.start - EPS && t <= end + EPS) out.push({ t, w: w.w, edge });
    }
  }
  return out;
}

export function buildSnapIndex(p: Project, opts: SnapOptions = {}): SnapIndex {
  const skip = new Set(opts.exclude ?? []);
  const win = opts.window;
  const inWin = (t: number) => Number.isFinite(t) && (!win || (t >= win.start && t <= win.end));
  const targets: SnapTarget[] = [];
  const push = (t: number, kind: SnapKind, label?: string, ref?: string) => {
    if (inWin(t)) targets.push({ t, kind, ...(label !== undefined ? { label } : {}), ...(ref !== undefined ? { ref } : {}) });
  };
  if (opts.cursor != null) push(opts.cursor, 'cursor');
  if (opts.markers !== false) for (const m of p.markers) push(m.t, 'marker', m.label, m.id);
  if (opts.regions !== false)
    for (const r of p.regions) {
      push(r.start, 'region', r.label, r.id);
      push(r.end, 'region', r.label, r.id);
    }
  if (opts.loop) {
    push(opts.loop.start, 'loop');
    push(opts.loop.end, 'loop');
  }
  for (const tr of p.tracks)
    for (const e of tr.events) {
      if (skip.has(e.id)) continue;
      if (opts.edges !== false) {
        push(e.start, 'edge', undefined, e.id);
        push(eventEnd(e), 'edge', undefined, e.id);
      }
      if (opts.words !== false) {
        const m = p.media[e.mediaId];
        if (m?.kind === 'audio' && m.words?.length) {
          // cheap reject: skip the whole event when it is outside the window
          if (win && (eventEnd(e) < win.start || e.start > win.end)) continue;
          for (const w of eventWordTimes(e, m)) push(w.t, 'word', w.w, e.id);
        }
      }
    }
  targets.sort((a, b) => a.t - b.t || PRIORITY[a.kind] - PRIORITY[b.kind]);
  const fps = p.fps;
  const frames = opts.frames !== false;
  const quantize = opts.quantize === true;
  const quant = (t: number): number => (quantize ? snapToFrame(t, fps) : t);

  /** first index with targets[i].t >= t */
  const lowerBound = (t: number): number => {
    let lo = 0;
    let hi = targets.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (targets[mid].t < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  /** nearest target within reach (seconds), by distance then kind priority */
  const nearest = (t: number, reach: number): SnapTarget | null => {
    let best: SnapTarget | null = null;
    let bestD = Infinity;
    for (let i = lowerBound(t - reach); i < targets.length && targets[i].t <= t + reach; i++) {
      const c = targets[i];
      const d = Math.abs(c.t - t);
      if (d < bestD - EPS || (Math.abs(d - bestD) <= EPS && best && PRIORITY[c.kind] < PRIORITY[best.kind])) {
        best = c;
        bestD = d;
      }
    }
    return best;
  };

  const reachOf = (pxPerSec: number, thresholdPx: number) => (pxPerSec > 0 ? thresholdPx / pxPerSec : 0);

  return {
    targets,
    fps,
    snap(t, pxPerSec, thresholdPx = SNAP_THRESHOLD_PX) {
      const hit = nearest(t, reachOf(pxPerSec, thresholdPx));
      if (hit) return { t: quant(hit.t), snapped: true, target: hit };
      return { t: frames ? snapToFrame(t, fps) : t, snapped: false, target: null };
    },
    snapDelta(edges, dt, pxPerSec, thresholdPx = SNAP_THRESHOLD_PX) {
      const reach = reachOf(pxPerSec, thresholdPx);
      let best: { d: number; target: SnapTarget; edge: number } | null = null;
      for (const edge of edges) {
        const cand = edge + dt;
        const hit = nearest(cand, reach);
        if (!hit) continue;
        const d = hit.t - cand;
        if (!best || Math.abs(d) < Math.abs(best.d) - EPS || (Math.abs(Math.abs(d) - Math.abs(best.d)) <= EPS && PRIORITY[hit.kind] < PRIORITY[best.target.kind])) {
          best = { d, target: hit, edge };
        }
      }
      if (best) {
        const t = quant(best.edge + dt + best.d);
        return { t, dt: t - best.edge, snapped: true, target: best.target, edge: best.edge };
      }
      const edge = edges.length ? Math.min(...edges) : 0;
      if (!frames) return { t: edge + dt, dt, snapped: false, target: null, edge };
      const q = snapToFrame(edge + dt, fps);
      return { t: q, dt: q - edge, snapped: false, target: null, edge };
    },
  };
}

/** sorted, de-duplicated event edges (and optionally markers): the Vegas edit points */
export function editPoints(p: Project, opts: { trackIds?: Iterable<string>; markers?: boolean } = {}): number[] {
  const only = opts.trackIds ? new Set(opts.trackIds) : null;
  const ts: number[] = [0];
  for (const tr of p.tracks) {
    if (only && !only.has(tr.id)) continue;
    for (const e of tr.events) ts.push(e.start, eventEnd(e));
  }
  if (opts.markers) for (const m of p.markers) ts.push(m.t);
  ts.sort((a, b) => a - b);
  const out: number[] = [];
  for (const t of ts) if (!out.length || t - out[out.length - 1] > 1e-4) out.push(t);
  return out;
}

/** the next (dir 1) or previous (dir -1) edit point strictly past t, or null */
export function nextEditPoint(p: Project, t: number, dir: 1 | -1, opts: { trackIds?: Iterable<string>; markers?: boolean } = {}): number | null {
  const pts = editPoints(p, opts);
  if (dir > 0) {
    for (const x of pts) if (x > t + 1e-4) return x;
    return null;
  }
  for (let i = pts.length - 1; i >= 0; i--) if (pts[i] < t - 1e-4) return pts[i];
  return null;
}
