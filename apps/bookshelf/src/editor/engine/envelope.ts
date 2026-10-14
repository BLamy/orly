/**
 * Envelopes, keyframes and fades: pure curve math shared by the audio engine, the compositor and the timeline.
 *
 *   curveShape('smooth', 0.25)                     -> eased progress 0..1 (Vegas curve types)
 *   fadeInGain('fast', u) / fadeOutGain('fast', u) -> fade gain at fade progress u (0 = fade start)
 *   eventFadeGain(len, fadeIn, fadeOut, tau)       -> fades combined at event-relative tau
 *   sampleEnvelope(keys, t, fallback)              -> keyframed value at t (all curve types, hold = step)
 *   sampleKeyframes(keys, t, mix, fallback)        -> the same for any value type (Pan/Crop keys)
 *   envelopePoints(keys, from, to, map?)           -> breakpoints for AudioParam ramps (linear between points)
 *   fadePoints(len, fadeIn, fadeOut, scale?)       -> breakpoints of an event's fade gain
 *   effectiveFades(events)                         -> per event fades with Vegas auto-crossfade on overlaps
 *
 * Curve shapes (progress u in 0..1 → eased 0..1):
 *   linear  u
 *   fast    sin(u·π/2)               quarter sine: rises fast, settles. = ffmpeg afade `qsin`, the curve the
 *                                     film mix (generator/film/mix.mjs) uses, so imported film fades round-trip
 *                                     when they are 'fast'. Fast-in against fast-out is an equal-power crossfade.
 *   slow    1 − cos(u·π/2)           starts slowly, then rises (the time mirror of fast)
 *   smooth  (1 − cos(u·π))/2         S-curve (ffmpeg `hsin`)
 *   sharp   inverse S                steep at both ends, flat through the middle (fades only)
 *   hold    0 until the next key     (keyframes only: a step at the next key)
 * A fade-out is the TIME MIRROR of the same-named fade-in (as ffmpeg afade does): gain = shape(1 − u).
 *
 * Breakpoint lists (`Point[]`) are piecewise-linear functions; a step is two points at the same `t` (value
 * before, then value after), which AudioParam.linearRampToValueAtTime renders as a jump. Curves are linearised
 * adaptively to a tolerance (default 0.002 in output units) so a long envelope stays a handful of ramps.
 *
 * Erasable TypeScript only (node --test runs this file directly).
 */
import type { EditEvent, Fade, FadeCurve, Keyframe } from '../model/types.ts';

export type KeyCurve = NonNullable<Keyframe['curve']>;
export type CurveKind = KeyCurve | FadeCurve;

/** a breakpoint of a piecewise-linear function */
export interface Point {
  t: number;
  v: number;
}

const HALF_PI = Math.PI / 2;
const clamp01 = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u);

/** eased progress for a curve type; `hold` is 0 until the end of the segment (where the next key takes over) */
export function curveShape(curve: CurveKind | undefined, u: number): number {
  const x = clamp01(u);
  switch (curve) {
    case 'hold':
      return x >= 1 ? 1 : 0;
    case 'fast':
      return Math.sin(x * HALF_PI);
    case 'slow':
      return 1 - Math.cos(x * HALF_PI);
    case 'smooth':
      return (1 - Math.cos(x * Math.PI)) / 2;
    case 'sharp':
      // inverse S: half a sine bump up to 0.5, mirrored to 1
      return x < 0.5 ? 0.5 * Math.sin(x * Math.PI) : 1 - 0.5 * Math.sin(x * Math.PI);
    case 'linear':
    default:
      return x;
  }
}

/** fade-in gain at fade progress u (0 = start of the fade, silent; 1 = full level) */
export const fadeInGain = (curve: FadeCurve, u: number): number => curveShape(curve, u);

/** fade-out gain at fade progress u (0 = start of the fade, full level; 1 = silent): the mirrored fade-in */
export const fadeOutGain = (curve: FadeCurve, u: number): number => curveShape(curve, 1 - u);

/**
 * Combined fade gain of an event of length `len` at event-relative time `tau` (timeline seconds from the event
 * start). Fades are in timeline seconds (independent of the event rate). Overlapping fades multiply.
 */
export function eventFadeGain(len: number, fadeIn: Fade | undefined, fadeOut: Fade | undefined, tau: number): number {
  if (tau < 0 || tau > len) return 0;
  let g = 1;
  const fi = fadeIn && fadeIn.len > 0 ? Math.min(fadeIn.len, len) : 0;
  const fo = fadeOut && fadeOut.len > 0 ? Math.min(fadeOut.len, len) : 0;
  if (fi > 0 && tau < fi) g *= fadeInGain(fadeIn!.curve, tau / fi);
  if (fo > 0 && tau > len - fo) g *= fadeOutGain(fadeOut!.curve, (tau - (len - fo)) / fo);
  return g;
}

export const dbToGain = (db: number): number => (db <= -150 ? 0 : Math.pow(10, db / 20));
export const gainToDb = (g: number): number => (g <= 0 ? -Infinity : 20 * Math.log10(g));

// ---------------------------------------------------------------------------
// keyframes
// ---------------------------------------------------------------------------

/** index of the last key with key.t <= t (-1 before the first key); keys are assumed sorted by t */
function keyIndex<V>(keys: readonly Keyframe<V>[], t: number): number {
  let lo = 0;
  let hi = keys.length - 1;
  let r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (keys[m].t <= t) {
      r = m;
      lo = m + 1;
    } else hi = m - 1;
  }
  return r;
}

/** keys sorted by time (a no-op copy-free path when already sorted, the normal case) */
export function sortedKeys<V>(keys: readonly Keyframe<V>[]): readonly Keyframe<V>[] {
  for (let i = 1; i < keys.length; i++) if (keys[i].t < keys[i - 1].t) return [...keys].sort((a, b) => a.t - b.t);
  return keys;
}

/**
 * Keyframed value of any type at `t` (same time base as the keys). Before the first key: the first value;
 * after the last: the last value; between keys: `mix(a, b, eased)` with the LEFT key's curve.
 */
export function sampleKeyframes<V>(keys: readonly Keyframe<V>[] | undefined, t: number, mix: (a: V, b: V, u: number) => V, fallback: V): V {
  if (!keys || keys.length === 0) return fallback;
  const ks = sortedKeys(keys);
  const i = keyIndex(ks, t);
  if (i < 0) return ks[0].v;
  if (i >= ks.length - 1) return ks[ks.length - 1].v;
  const a = ks[i];
  const b = ks[i + 1];
  const span = b.t - a.t;
  if (span <= 0) return b.v;
  return mix(a.v, b.v, curveShape(a.curve ?? 'linear', (t - a.t) / span));
}

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** numeric keyframed value at t (fallback when there are no keys) */
export function sampleEnvelope(keys: readonly Keyframe[] | undefined, t: number, fallback = 0): number {
  return sampleKeyframes(keys, t, lerp, fallback);
}

// ---------------------------------------------------------------------------
// linearisation (curves → ramp breakpoints)
// ---------------------------------------------------------------------------

/** default linearisation tolerance, in output units (gain 0.002 ≈ 0.02 dB at unity) */
export const DEFAULT_TOLERANCE = 0.002;
const MAX_DEPTH = 10;

/**
 * Append breakpoints approximating continuous `f` on [t0, t1] (exclusive of t0, inclusive of t1) to `out`.
 * Adaptive bisection: a span is accepted when f at its quarter points is within `tol` of the chord (three probes,
 * because an S-curve passes exactly through its chord's midpoint).
 */
function linearizeInto(out: Point[], f: (t: number) => number, t0: number, v0: number, t1: number, v1: number, tol: number, depth: number): void {
  if (depth < MAX_DEPTH && t1 - t0 > 1e-4) {
    let ok = true;
    for (const q of [0.25, 0.5, 0.75]) {
      const t = t0 + (t1 - t0) * q;
      if (Math.abs(f(t) - lerp(v0, v1, q)) > tol) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      const tm = (t0 + t1) / 2;
      const vm = f(tm);
      linearizeInto(out, f, t0, v0, tm, vm, tol, depth + 1);
      linearizeInto(out, f, tm, vm, t1, v1, tol, depth + 1);
      return;
    }
  }
  out.push({ t: t1, v: v1 });
}

/** breakpoints for a continuous function on [t0, t1] (both ends included) */
export function linearize(f: (t: number) => number, t0: number, t1: number, tol = DEFAULT_TOLERANCE): Point[] {
  const v0 = f(t0);
  const out: Point[] = [{ t: t0, v: v0 }];
  if (t1 > t0) linearizeInto(out, f, t0, v0, t1, f(t1), tol, 0);
  return out;
}

/** push a point, collapsing exact duplicates (same t and v) */
function push(out: Point[], p: Point): void {
  const last = out[out.length - 1];
  if (last && last.t === p.t && last.v === p.v) return;
  out.push(p);
}

/**
 * Breakpoints of a keyframed envelope over [from, to] (key time base), mapped through `map` (e.g. dB → gain).
 * With no keys the result is the constant `map(fallback)`. Hold segments become steps (two points at one t).
 */
export function envelopePoints(
  keys: readonly Keyframe[] | undefined,
  from: number,
  to: number,
  map: (v: number) => number = (v) => v,
  fallback = 0,
  tol = DEFAULT_TOLERANCE,
): Point[] {
  if (!(to >= from)) return [];
  if (!keys || keys.length === 0) {
    const v = map(fallback);
    return from === to ? [{ t: from, v }] : [{ t: from, v }, { t: to, v }];
  }
  const ks = sortedKeys(keys);
  const out: Point[] = [];
  // the interior key times that fall inside (from, to): each starts a new segment
  const cuts = [from];
  for (const k of ks) if (k.t > from && k.t < to) cuts.push(k.t);
  cuts.push(to);
  for (let s = 0; s < cuts.length - 1; s++) {
    const a = cuts[s];
    const b = cuts[s + 1];
    if (b <= a) continue;
    const i = keyIndex(ks, a);
    const left = i < 0 ? null : ks[i];
    const right = i + 1 < ks.length ? ks[i + 1] : null;
    if (!left || !right || left.curve === 'hold') {
      // constant over this segment (before the first key, after the last, or a hold); the step to the next
      // key's value happens at the cut (where the next segment starts)
      const v = map(left ? left.v : ks[0].v);
      push(out, { t: a, v });
      push(out, { t: b, v });
      continue;
    }
    // continuous on [a, b] (b <= right.t): the left key's curve towards the right key
    const curve = left.curve ?? 'linear';
    const span = right.t - left.t;
    const f = (t: number): number => map(lerp(left.v, right.v, curveShape(curve, (t - left.t) / span)));
    const va = f(a);
    push(out, { t: a, v: va });
    // a linear segment through an affine map is accepted by the first probe: two points
    const seg: Point[] = [];
    linearizeInto(seg, f, a, va, b, f(b), tol, 0);
    for (const p of seg) push(out, p);
  }
  return out;
}

/**
 * Breakpoints of an event's fade gain over event-relative [0, len] (× `scale`, the event volume line as a gain).
 * Constant stretches are two points; fade curves are linearised.
 */
export function fadePoints(len: number, fadeIn: Fade | undefined, fadeOut: Fade | undefined, scale = 1, tol = DEFAULT_TOLERANCE): Point[] {
  if (!(len > 0)) return [];
  const f = (tau: number): number => scale * eventFadeGain(len, fadeIn, fadeOut, tau);
  const fi = fadeIn && fadeIn.len > 0 ? Math.min(fadeIn.len, len) : 0;
  const fo = fadeOut && fadeOut.len > 0 ? Math.min(fadeOut.len, len) : 0;
  const knots = [...new Set([0, fi, len - fo, len].filter((x) => x >= 0 && x <= len))].sort((a, b) => a - b);
  const out: Point[] = [];
  for (let k = 0; k < knots.length - 1; k++) {
    const a = knots[k];
    const b = knots[k + 1];
    // constant stretches are accepted by the first probe (two points); fade curves subdivide
    const va = f(a);
    push(out, { t: a, v: va });
    const seg: Point[] = [];
    linearizeInto(seg, f, a, va, b, f(b), tol, 0);
    for (const p of seg) push(out, p);
  }
  if (out.length === 0) out.push({ t: 0, v: f(0) });
  return out;
}

/** value of a breakpoint list at t (linear between points; at a step the later value wins; clamped at the ends) */
export function pointsValueAt(points: readonly Point[], t: number): number {
  const n = points.length;
  if (n === 0) return 0;
  if (t < points[0].t) return points[0].v;
  if (t >= points[n - 1].t) return points[n - 1].v;
  // last index with p.t <= t
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (points[m].t <= t) lo = m;
    else hi = m - 1;
  }
  const a = points[lo];
  const b = points[lo + 1];
  if (!b || b.t <= a.t) return a.v;
  return lerp(a.v, b.v, (t - a.t) / (b.t - a.t));
}

/** the breakpoints restricted to [from, to], with exact end points interpolated in */
export function slicePoints(points: readonly Point[], from: number, to: number): Point[] {
  if (points.length === 0 || to < from) return [];
  const out: Point[] = [{ t: from, v: pointsValueAt(points, from) }];
  for (const p of points) if (p.t > from && p.t < to) out.push({ t: p.t, v: p.v });
  if (to > from) out.push({ t: to, v: pointsValueAt(points, to) });
  return out;
}

/**
 * A breakpoint list (linear in its own domain, e.g. dB) through a nonlinear `map` (e.g. dB → gain), re-linearised
 * so the result is linear between points in the OUTPUT domain. Steps stay steps.
 */
export function mapPoints(points: readonly Point[], map: (v: number) => number, tol = DEFAULT_TOLERANCE): Point[] {
  if (points.length === 0) return [];
  const out: Point[] = [{ t: points[0].t, v: map(points[0].v) }];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (b.t <= a.t) {
      push(out, { t: b.t, v: map(b.v) });
      continue;
    }
    const f = (t: number): number => map(lerp(a.v, b.v, (t - a.t) / (b.t - a.t)));
    const seg: Point[] = [];
    linearizeInto(seg, f, a.t, map(a.v), b.t, map(b.v), tol, 0);
    for (const p of seg) push(out, p);
  }
  return out;
}

/** shift a breakpoint list in time (event-relative → timeline) */
export const shiftPoints = (points: readonly Point[], dt: number): Point[] => points.map((p) => ({ t: p.t + dt, v: p.v }));

// ---------------------------------------------------------------------------
// auto-crossfade
// ---------------------------------------------------------------------------

/**
 * The fades an event actually plays with. Vegas auto-crossfade: where two events on one track overlap, the
 * overlap IS the crossfade, so the later event's fade-in and the earlier event's fade-out are at least the
 * overlap long (each keeps its own curve; an explicitly longer fade is kept). `events` must be one track's
 * events sorted by start.
 */
export function effectiveFades(events: readonly EditEvent[]): Map<string, { fadeIn: Fade; fadeOut: Fade }> {
  const out = new Map<string, { fadeIn: Fade; fadeOut: Fade }>();
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    let fadeIn = e.fadeIn;
    let fadeOut = e.fadeOut;
    const prev = events[i - 1];
    const next = events[i + 1];
    const end = e.start + e.length;
    if (prev && prev.start < e.start) {
      const ov = Math.min(prev.start + prev.length, end) - e.start;
      if (ov > fadeIn.len) fadeIn = { len: ov, curve: fadeIn.curve };
    }
    // a following event that starts inside this one and outlasts it crossfades with our tail
    if (next && next.start > e.start && next.start < end && next.start + next.length > end) {
      const ov = end - next.start;
      if (ov > fadeOut.len) fadeOut = { len: ov, curve: fadeOut.curve };
    }
    out.set(e.id, { fadeIn, fadeOut });
  }
  return out;
}
