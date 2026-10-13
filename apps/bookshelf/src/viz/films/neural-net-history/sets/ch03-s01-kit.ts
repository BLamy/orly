/**
 * neural-net-history — small helpers shared by ch03-s01 … ch03-s05 (one animator's group).
 *
 *   clamp01 / sm / lerp / win(t, a, b) / tq12(t)     clamp, smoothstep, lerp, a 0..1 ramp over [a, b], twos
 *   mixCam(a, b, u)                                   camera blend that interpolates the action-plane SCALE in log
 *                                                     space (a dolly reads as a constant-rate push, no lurch)
 *   camPath(keys)                                     a camera through [t, Camera3] keys: smoothstep between keys,
 *                                                     holding at each key (slow camera grammar, pure in t)
 *   bake(f, c, key, rect, paint)                      cache a static drawing over a world rect (device res)
 *   typedLine(c, text, x, y, o)                       Special Elite struck type (seeded jitter), left or centred
 */
import type { Camera3, Frame } from '../../../film/contracts';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';

/** seeded hash in [0, 1) (core/frame's hash1 is in [-1, 1]) */
export const h01 = (i: number, seed = 0) => 0.5 + 0.5 * hash1(i, seed);

export const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

const scaleOf = (c: Camera3) => (1000 * c.lens) / (1000 - c.z);
export function mixCam(a: Camera3, b: Camera3, u: number): Camera3 {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const s = Math.exp(lerp(Math.log(scaleOf(a)), Math.log(scaleOf(b)), u));
  const lens = Math.exp(lerp(Math.log(a.lens), Math.log(b.lens), u));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - (1000 * lens) / s, lens };
}

/** keys: [time, camera, ease?] — eased between consecutive keys, held outside them */
export type CamKey = [number, Camera3, ((u: number) => number)?];
export function camPath(keys: CamKey[]): (t: number) => Camera3 {
  return (t: number) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i];
      const [t1, b, e] = keys[i + 1];
      if (t <= t1) return mixCam(a, b, (e ?? sm)((t - t0) / Math.max(1e-6, t1 - t0)));
    }
    return keys[keys.length - 1][1];
  };
}
/** a gentler ease for long camera moves (cubic in-out) */
export const easeIO = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export interface WRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const rk = (r: WRect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
export function bake(f: Frame, c: CanvasRenderingContext2D, key: string, r: WRect, paint: (cc: CanvasRenderingContext2D) => void) {
  f.cached(`${key}/${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

/** Special Elite struck type: each key lands a little differently (seeded, static) */
export function typedLine(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: { size: number; color: string; align?: 'left' | 'center' | 'right'; shown?: number; seed?: number; alpha?: number },
) {
  c.save();
  c.font = `400 ${o.size}px ${FONT.typewriter}`;
  c.letterSpacing = '0px';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const adv = c.measureText('M').width * 1.02;
  const total = adv * text.length;
  const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const n = Math.min(text.length, o.shown ?? text.length);
  const seed = o.seed ?? 7;
  c.fillStyle = o.color;
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    c.save();
    c.translate(x0 + i * adv + adv / 2, y + (h01(i, seed + 42) - 0.5) * 0.9);
    c.rotate((h01(i, seed + 43) - 0.5) * 0.02);
    c.globalAlpha = (o.alpha ?? 1) * (0.84 + 0.16 * h01(i, seed + 41));
    c.fillText(ch, 0, 0);
    c.restore();
  }
  c.restore();
  return total;
}

/** a monotone cubic through [t, v] keys (no overshoot; flat at both ends); keys strictly increasing in t */
export function monotone(keys: [number, number][]): (t: number) => number {
  const n = keys.length;
  if (n === 1) return () => keys[0][1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    const h = t1 - t0;
    const u = (t - t0) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m[i + 1];
  };
}
/** piecewise-linear through [t, v] keys (held outside) */
export function linear(keys: [number, number][]): (t: number) => number {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i];
      const [t1, v1] = keys[i + 1];
      if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-6, t1 - t0);
    }
    return keys[keys.length - 1][1];
  };
}
