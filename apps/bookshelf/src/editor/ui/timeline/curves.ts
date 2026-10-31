/**
 * Timeline curves — fade shapes, keyframe interpolation and the level-line scales, for DRAWING and for
 * mapping a drag back to a value. The shapes are re-exported from the engines' single definition
 * (engine/envelope.ts), so what you see is exactly what you hear and what the compositor paints.
 *
 *   fadeInGain(curve, u) / fadeOutGain(curve, u)     0..1 gain at progress u ∈ [0, 1] through the fade
 *   keyValue(keys, t, dflt)                          envelope value at event-relative t (hold outside)
 *   gainToFrac(db) / fracToGain(f)                   event volume line: 0 dB at the top, -inf at the bottom
 *   ENVELOPES.volume.toFrac(v) / .fromFrac(f)        envelope value <-> 0..1 height in the event body
 *
 * Pure; no DOM.
 */
import type { Keyframe } from '../../model/types';
import { curveShape, fadeInGain, fadeOutGain } from '../../engine/envelope.ts';

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Fade gains at progress u through the fade: fade-in 0 → 1, fade-out 1 → 0 (the time mirror of the same-named
 * fade-in). These ARE the engine curves (engine/envelope.ts), so a fade is drawn exactly as it sounds and looks.
 */
export { fadeInGain, fadeOutGain };

/** interpolation shape between two keyframes (Keyframe.curve): the engines' curveShape */
export const keyShape = (curve: Keyframe['curve'], u: number): number => curveShape(curve, u);

/** first key index with k.t > t (keys sorted by t) */
function upper(keys: readonly Keyframe[], t: number): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid].t <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** envelope value at event-relative t: holds the first/last value outside the keys, `dflt` when empty */
export function keyValue(keys: readonly Keyframe[] | undefined, t: number, dflt: number): number {
  if (!keys || keys.length === 0) return dflt;
  const i = upper(keys, t);
  if (i === 0) return keys[0].v;
  if (i >= keys.length) return keys[keys.length - 1].v;
  const a = keys[i - 1];
  const b = keys[i];
  const span = b.t - a.t;
  if (span <= 1e-9) return b.v;
  return a.v + (b.v - a.v) * keyShape(a.curve, (t - a.t) / span);
}

// ---------------------------------------------------------------------------
// Level scales. Heights are fractions of the event body (1 = top).
// ---------------------------------------------------------------------------
const MIN_DB = -120;

/** event volume line: 0 dB at the top, square-root amplitude law (−6 dB ≈ 71 %, −12 dB = 50 %) */
export function gainToFrac(db: number): number {
  if (db <= MIN_DB) return 0;
  return clamp01(Math.sqrt(10 ** (db / 20)));
}
export function fracToGain(f: number): number {
  if (f <= 0.001) return MIN_DB;
  return 40 * Math.log10(Math.min(1, f));
}

/** an envelope's value scale for drawing and dragging */
export interface EnvelopeScale {
  dflt: number;
  toFrac(v: number): number;
  fromFrac(f: number): number;
  label(v: number): string;
}

const VOL_TOP = 10 ** (6 / 20); // the volume envelope tops out at +6 dB (Vegas)

export const ENVELOPES: Record<'volume' | 'pan' | 'opacity', EnvelopeScale> = {
  volume: {
    dflt: 0,
    toFrac: (db) => (db <= MIN_DB ? 0 : clamp01(Math.sqrt(10 ** (db / 20) / VOL_TOP))),
    fromFrac: (f) => (f <= 0.001 ? MIN_DB : Math.min(6, 20 * Math.log10(f * f * VOL_TOP))),
    label: (db) => (db <= MIN_DB ? '-inf dB' : `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`),
  },
  pan: {
    dflt: 0,
    // Vegas: the top of the lane is hard left
    toFrac: (p) => clamp01((1 - p) / 2),
    fromFrac: (f) => Math.max(-1, Math.min(1, 1 - 2 * f)),
    label: (p) => (Math.abs(p) < 0.005 ? 'Center' : p < 0 ? `${Math.round(-p * 100)}% L` : `${Math.round(p * 100)}% R`),
  },
  opacity: {
    dflt: 1,
    toFrac: (v) => clamp01(v),
    fromFrac: (f) => clamp01(f),
    label: (v) => `${Math.round(v * 100)}%`,
  },
};

export type EnvelopeKind = keyof typeof ENVELOPES;
