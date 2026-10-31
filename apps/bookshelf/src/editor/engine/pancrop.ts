/**
 * Keyframes, curves, fades and Event Pan/Crop: the time-varying numbers the video compositor samples per frame.
 *
 *   ease('smooth', u)                         Vegas curve shapes (keyframe interpolation and fade curves), u 0..1
 *   sampleKeys(keys, t, dflt)                 a keyframed number at t (the FROM key's curve shapes each segment)
 *   sampleValue(value, t)                     constant or keyframes (VideoFx.value)
 *   fadeGain(e, local, { head, tail })        fade-in × fade-out multiplier of an event at event-local time
 *   panCropAt(keys, t)                        the event's Pan/Crop at event-local t (identity when absent)
 *   panCropMatrix(pc, W, H)                   canvas matrix placing a centred media frame in a W×H output
 *   panCropSvg(pc)                            the same placement as an SVG transform in stage units (1280×720)
 *
 * Curve shapes are the audio engine's (engine/envelope.ts `curveShape`, the one definition the compositor, the
 * audio graph and the timeline drawing all share): a picture fade looks exactly like its sound and its drawing.
 * A fade-in multiplies by fadeInGain(curve, p) and a fade-out by fadeOutGain(curve, p) = the time mirror of the
 * same-named fade-in, p = progress through the fade.
 *
 * Keyframe arrays are expected sorted by t (ops keep them so); an unsorted array is sorted once and cached by
 * identity (projects are immutable, so a cached copy stays valid for as long as the array lives).
 * Pan/Crop zoom interpolates in 1/zoom (the crop rectangle's width, as Vegas does), so a push-in reads even.
 */
import type { EditEvent, Keyframe, PanCrop } from '../model/types';
import { FILM_H, FILM_W } from '../../viz/film/contracts';
import { curveShape, fadeInGain, fadeOutGain, type CurveKind } from './envelope.ts';

export type Curve = CurveKind;

/** shape u (0..1) by a Vegas curve type (envelope.ts curveShape) */
export const ease = (curve: Curve | undefined, u: number): number => curveShape(curve, u);

const sortedCache = new WeakMap<readonly Keyframe<unknown>[], readonly Keyframe<unknown>[]>();
function sorted<V>(keys: readonly Keyframe<V>[]): readonly Keyframe<V>[] {
  for (let i = 1; i < keys.length; i++) {
    if (keys[i].t < keys[i - 1].t) {
      let s = sortedCache.get(keys) as readonly Keyframe<V>[] | undefined;
      if (!s) sortedCache.set(keys, (s = [...keys].sort((a, b) => a.t - b.t)));
      return s;
    }
  }
  return keys;
}

/** index of the last key with key.t <= t (-1 before the first) */
function keyIndex<V>(keys: readonly Keyframe<V>[], t: number): number {
  let lo = 0, hi = keys.length - 1, k = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid].t <= t) {
      k = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return k;
}

/** locate t between two keys: [from, to, shaped u]; null outside (hold the end values) */
function segment<V>(raw: readonly Keyframe<V>[], t: number): { a: Keyframe<V>; b: Keyframe<V>; e: number } | Keyframe<V> {
  const keys = sorted(raw);
  const i = keyIndex(keys, t);
  if (i < 0) return keys[0];
  if (i >= keys.length - 1) return keys[keys.length - 1];
  const a = keys[i], b = keys[i + 1];
  const span = b.t - a.t;
  return { a, b, e: span > 1e-9 ? ease(a.curve, (t - a.t) / span) : 1 };
}

/** keyframed number at t; `dflt` when there are no keys */
export function sampleKeys(keys: readonly Keyframe[] | undefined, t: number, dflt: number): number {
  if (!keys || keys.length === 0) return dflt;
  const s = segment(keys, t);
  if ('e' in s) return s.a.v + (s.b.v - s.a.v) * s.e;
  return s.v;
}

/** a VideoFx value: constant or keyframes */
export function sampleValue(value: number | readonly Keyframe[], t: number): number {
  return typeof value === 'number' ? value : sampleKeys(value, t, 0);
}

/**
 * Fade multiplier at event-local time. `head`/`tail` say whether the fade at that edge applies: an edge that
 * overlaps a neighbour on the same track is a transition, and the transition (not the fade) blends it.
 */
export function fadeGain(e: Pick<EditEvent, 'length' | 'fadeIn' | 'fadeOut'>, local: number, edges: { head: boolean; tail: boolean }): number {
  let g = 1;
  if (edges.head && e.fadeIn.len > 0 && local < e.fadeIn.len) g *= fadeInGain(e.fadeIn.curve, local / e.fadeIn.len);
  const fromEnd = e.length - local;
  if (edges.tail && e.fadeOut.len > 0 && fromEnd < e.fadeOut.len) g *= fadeOutGain(e.fadeOut.curve, 1 - fromEnd / e.fadeOut.len);
  return g;
}

// ---------------------------------------------------------------------------
// Event Pan/Crop
// ---------------------------------------------------------------------------
const IDENTITY: Readonly<PanCrop> = Object.freeze({ x: 0, y: 0, zoom: 1, rot: 0 });

export function isIdentity(pc: PanCrop): boolean {
  return Math.abs(pc.x) < 1e-6 && Math.abs(pc.y) < 1e-6 && Math.abs(pc.zoom - 1) < 1e-6 && Math.abs(pc.rot % 360) < 1e-6;
}

const safeZoom = (z: number) => (Number.isFinite(z) && z > 1e-3 ? z : 1e-3);

/** the event's Pan/Crop at event-local t (each segment shaped by its FROM key's curve) */
export function panCropAt(keys: readonly Keyframe<PanCrop>[] | undefined, t: number): PanCrop {
  if (!keys || keys.length === 0) return IDENTITY;
  const s = segment(keys, t);
  if (!('e' in s)) return s.v;
  const { a, b, e } = s;
  const ia = 1 / safeZoom(a.v.zoom), ib = 1 / safeZoom(b.v.zoom);
  return {
    x: a.v.x + (b.v.x - a.v.x) * e,
    y: a.v.y + (b.v.y - a.v.y) * e,
    zoom: 1 / (ia + (ib - ia) * e),
    rot: a.v.rot + (b.v.rot - a.v.rot) * e,
  };
}

/** canvas matrix [a, b, c, d, e, f] that draws a media frame CENTRED ON THE ORIGIN into a W×H output */
export function panCropMatrix(pc: PanCrop, W: number, H: number): [number, number, number, number, number, number] {
  const z = safeZoom(pc.zoom);
  const r = (pc.rot * Math.PI) / 180; // clockwise on screen (canvas y points down)
  const cos = Math.cos(r) * z, sin = Math.sin(r) * z;
  return [cos, sin, -sin, cos, W / 2 + pc.x * W, H / 2 + pc.y * H];
}

/** the same placement for stage-space SVG overlays (viewBox 0 0 1280 720); undefined for identity */
export function panCropSvg(pc: PanCrop): string | undefined {
  if (isIdentity(pc)) return undefined;
  const cx = FILM_W / 2, cy = FILM_H / 2;
  const f = (n: number) => +n.toFixed(4);
  return `translate(${f(cx + pc.x * FILM_W)} ${f(cy + pc.y * FILM_H)}) rotate(${f(pc.rot)}) scale(${f(safeZoom(pc.zoom))}) translate(${-cx} ${-cy})`;
}
