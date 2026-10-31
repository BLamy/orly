/**
 * Timeline geometry — the pure maths behind drawing and hit testing.
 *
 *   tToX(view, t) / xToT(view, x)          timeline seconds <-> lane x (CSS px, 0 = left edge of the lanes)
 *   layoutTracks(tracks, heights?)          -> { rows, total }   row tops in lane space (scroll not applied)
 *   rowAt(rows, y)                          row index at lane-space y (binary search), -1 outside
 *   visibleRange(track, maxLen, t0, t1)     [i0, i1) indices of events that can intersect [t0, t1]
 *   rulerTicks(pxPerSec, fps)               adaptive major/minor tick steps (frames → hours)
 *   timecode(t, fps)                        'HH:MM:SS;FF' (Vegas display)
 *   zoomAround(view, factor, anchorT, lim)  new { pxPerSec, scrollT } keeping anchorT under the same x
 *   zoomLimits(duration, width, fps)        { min, max } pixels per second
 *
 * No DOM, no React: imported by the node tests.
 */
import type { Track } from '../../model/types';

export interface View {
  /** seconds at the left edge of the lanes */
  scrollT: number;
  pxPerSec: number;
  /** lane width (CSS px) */
  width: number;
}

export const tToX = (v: View, t: number): number => (t - v.scrollT) * v.pxPerSec;
export const xToT = (v: View, x: number): number => v.scrollT + x / v.pxPerSec;
export const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

// ---------------------------------------------------------------------------
// Track rows
// ---------------------------------------------------------------------------
export interface TrackRow {
  track: Track;
  index: number;
  /** lane-space top (0 = first track, before vertical scroll) */
  top: number;
  height: number;
}

/** Stack the tracks top to bottom. `heights` overrides a track's height (live resize drafts). */
export function layoutTracks(tracks: readonly Track[], heights?: ReadonlyMap<string, number>, minH = 26, maxH = 320): { rows: TrackRow[]; total: number } {
  const rows: TrackRow[] = [];
  let y = 0;
  tracks.forEach((track, index) => {
    const height = clamp(Math.round(heights?.get(track.id) ?? track.height ?? 64), minH, maxH);
    rows.push({ track, index, top: y, height });
    y += height;
  });
  return { rows, total: y };
}

/** row index at lane-space y, or -1 when y is above the first / below the last track */
export function rowAt(rows: readonly TrackRow[], y: number): number {
  let lo = 0;
  let hi = rows.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = rows[mid];
    if (y < r.top) hi = mid - 1;
    else if (y >= r.top + r.height) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** longest event on a track (bounds the backwards search of `visibleRange`) */
export function trackMaxLen(track: Track): number {
  let m = 0;
  for (const e of track.events) if (e.length > m) m = e.length;
  return m;
}

/** first index whose start is >= t (events are sorted by start) */
export function lowerBoundStart(track: Track, t: number): number {
  const ev = track.events;
  let lo = 0;
  let hi = ev.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ev[mid].start < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Indices [i0, i1) of the events that may intersect [t0, t1]. Events are sorted by start, so anything
 * starting before t0 − maxLen has ended before t0. Callers still test each event's own span.
 */
export function visibleRange(track: Track, maxLen: number, t0: number, t1: number): [number, number] {
  return [lowerBoundStart(track, t0 - maxLen - 1e-9), lowerBoundStart(track, t1 + 1e-9)];
}

// ---------------------------------------------------------------------------
// Ruler
// ---------------------------------------------------------------------------
export interface Ticks {
  /** seconds between labelled ticks */
  major: number;
  /** seconds between small ticks (divides major) */
  minor: number;
  /** labels need frames (major step below a second) */
  frames: boolean;
}

const SECOND_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];

/** the ladder of tick steps (seconds): whole frames that divide a second, then seconds/minutes/hours */
export function tickLadder(fps: number): number[] {
  const f = Math.max(1, Math.round(fps));
  const frameSteps: number[] = [];
  for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 15]) if (n < f && f % n === 0) frameSteps.push(n / f);
  return [...frameSteps, ...SECOND_STEPS];
}

/**
 * Adaptive ticks: the smallest major step whose labels sit at least `minMajorPx` apart, and the smallest
 * ladder step that divides it with at least `minMinorPx` between small ticks.
 */
export function rulerTicks(pxPerSec: number, fps: number, minMajorPx = 104, minMinorPx = 7): Ticks {
  const ladder = tickLadder(fps);
  let major = ladder[ladder.length - 1];
  for (const s of ladder) {
    if (s * pxPerSec >= minMajorPx) {
      major = s;
      break;
    }
  }
  let minor = major;
  for (const s of ladder) {
    if (s >= major) break;
    const ratio = major / s;
    if (Math.abs(ratio - Math.round(ratio)) < 1e-6 && s * pxPerSec >= minMinorPx) {
      minor = s;
      break;
    }
  }
  return { major, minor, frames: major < 1 - 1e-9 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** the frames separator: ';' only at drop-frame NTSC rates (29.97, 59.94), ':' otherwise (SMPTE convention) */
export const frameSep = (fps: number): string => (Math.abs(fps - Math.round(fps)) > 1e-3 && Math.abs(fps * 1.001 - Math.round(fps * 1.001)) < 0.01 ? ';' : ':');

/** 'HH:MM:SS:FF' ('HH:MM:SS;FF' at drop-frame rates) — frames are floored with an epsilon so frame-exact times read
 *  back exactly */
export function timecode(t: number, fps: number): string {
  const r = Math.max(1, Math.round(fps));
  const neg = t < 0;
  const f = Math.floor(Math.abs(t) * r + 1e-6);
  const fr = f % r;
  const s = Math.floor(f / r);
  const out = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}${frameSep(fps)}${pad(fr)}`;
  return neg ? `-${out}` : out;
}

/** signed delta for drag badges: '+0:01:12', '-12:03' (frames always shown, hours/minutes only when needed) */
export function deltaCode(dt: number, fps: number): string {
  const r = Math.max(1, Math.round(fps));
  const sign = dt < 0 ? '-' : '+';
  const f = Math.round(Math.abs(dt) * r);
  const fr = f % r;
  const s = Math.floor(f / r);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const body = h ? `${h}:${pad(m)}:${pad(s % 60)}` : m ? `${m}:${pad(s % 60)}` : `${s % 60}`;
  return `${sign}${body}${frameSep(fps)}${pad(fr)}`;
}

// ---------------------------------------------------------------------------
// Zoom
// ---------------------------------------------------------------------------
export interface ZoomLimits {
  min: number;
  max: number;
}

/** zoom out until the whole project (plus a margin) fits; zoom in until one frame is ~80 px wide */
export function zoomLimits(duration: number, width: number, fps: number): ZoomLimits {
  const span = Math.max(duration, 10) * 1.25;
  const min = Math.max(0.01, Math.min(4, width / span));
  return { min, max: Math.max(min * 2, fps * 80) };
}

/** zoom by `factor` keeping `anchorT` under the same x */
export function zoomAround(view: View, factor: number, anchorT: number, lim: ZoomLimits): { pxPerSec: number; scrollT: number } {
  const pxPerSec = clamp(view.pxPerSec * factor, lim.min, lim.max);
  const ax = tToX(view, anchorT);
  const scrollT = Math.max(0, anchorT - ax / pxPerSec);
  return { pxPerSec, scrollT };
}

/** the horizontal scroll extent: the project plus up to half a screen (Vegas lets you scroll past the end).
 *  The overscroll shrinks to nothing as the view approaches the whole project, so "fit" shows a full thumb. */
export function scrollExtent(duration: number, visibleT: number): number {
  const tail = Math.min(visibleT * 0.5, Math.max(0, duration - visibleT));
  return Math.max(duration + tail, visibleT);
}
