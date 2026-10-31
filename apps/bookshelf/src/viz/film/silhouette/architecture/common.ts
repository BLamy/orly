/**
 * Shared helpers for set painters (architecture/, nature/).
 *
 *   rng(seed, salt?)           seeded mulberry32 stream
 *   hash01(a, b?, c?)          stateless deterministic hash -> [0,1)
 *   keyOf(obj)                 stable cache key from plain options
 *   cutColor(env, a)           rim-coloured hairline for inner cut-lines/mouldings, fades with layer haze
 *   shadeColor(env, a)         darker recess tone (ink at alpha a)
 *   lit(env, a)                warm interior-light tone (halo at alpha a) for lit windows
 *   strokeCuts(c, path, env, a, lw)   stroke a cut-line path (lw in device px, converted to stage px)
 */
import { mulberry32 } from '../../../core';
import type { PaintEnv } from '../../contracts';
import { withAlpha } from '../palette';

export type Pt = [number, number];

export function rng(seed: number, salt = 0): () => number {
  return mulberry32((Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0);
}

export function hash01(a: number, b = 0, c = 0): number {
  let h = Math.imul((a | 0) ^ 0x27d4eb2d, 0x165667b1);
  h = Math.imul(h ^ (b | 0) ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (c | 0) ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function keyOf(o: object): string {
  return JSON.stringify(o);
}

export function cutColor(env: PaintEnv, a = 0.2): string {
  return withAlpha(env.mood.rim, a * (1 - 0.7 * env.layer.haze));
}
export function shadeColor(env: PaintEnv, a = 0.25): string {
  return withAlpha(env.mood.ink, a);
}
export function lit(env: PaintEnv, a = 0.8): string {
  return withAlpha(env.mood.halo, a);
}

/** stroke cut-lines with a width given in device px (stays crisp at any layer scale) */
export function strokeCuts(c: CanvasRenderingContext2D, path: Path2D, color: string, lwDevice = 1) {
  const m = c.getTransform();
  const s = Math.hypot(m.a, m.b) || 1;
  c.strokeStyle = color;
  c.lineWidth = lwDevice / s;
  c.stroke(path);
}

/** bounded cache for any value */
export function memo<T>(map: Map<string, T>, key: string, build: () => T, cap = 200): T {
  const hit = map.get(key);
  if (hit !== undefined) return hit;
  const v = build();
  if (map.size > cap) map.clear();
  map.set(key, v);
  return v;
}
