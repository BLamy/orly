/**
 * neural-net-history — small helpers shared by ch02-s05b, ch02-s07 and ch02-s08 (one animator's group).
 *
 *   sm(u) / clamp01(u) / lerp(a, b, u) / win(t, a, b)    smoothstep, clamp, lerp, a 0..1 ramp over [a, b]
 *   monotone(keys)                                      a monotone cubic through [t, v] keys (no overshoot):
 *                                                       camera components anchored to words stay re-voice safe
 *   ordered(keys, gap)                                  force key times strictly increasing (a crowded re-voice)
 *   tq12(t)                                             twos-quantised time (puppets, paper props)
 *   subFrame(f, key, mood, paint)                       paint a WHOLE second scene into an offscreen frame (same
 *                                                       device size); returns its canvas for an in-shot dissolve.
 *                                                       Call it BEFORE the main frame paints its own layers (the
 *                                                       rim pass shares one L4 accumulator per frame).
 *   compositeSub(f, cv, alpha)                          lay that canvas over the main frame at alpha
 */
import type { Frame, MoodId, Palette } from '../../../film/contracts';
import { createFrame } from '../../../film/core/frame';
import { makeCanvas } from '../../../film/silhouette/atmosphere';

export const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0 before a, 1 after b, smooth between */
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

export type Keys = [number, number][];
/** keys must be strictly increasing in time; flat at both ends */
export function monotone(keys: Keys): (t: number) => number {
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
export function ordered(keys: Keys, gap = 0.25): Keys {
  const out: Keys = [];
  for (const [t, v] of keys) out.push([out.length ? Math.max(t, out[out.length - 1][0] + gap) : t, v]);
  return out;
}

const subCanvases = new Map<string, HTMLCanvasElement>();
/** paint a full second scene into an offscreen device canvas (for an in-shot dissolve) */
export function subFrame(f: Frame, key: string, mood: MoodId | Palette, paint: (g: Frame) => void): HTMLCanvasElement {
  const W = f.c.canvas.width, H = f.c.canvas.height;
  const k = `${key}|${W}x${H}`;
  let cv = subCanvases.get(k);
  if (!cv) {
    cv = makeCanvas(W, H);
    subCanvases.set(k, cv);
    if (subCanvases.size > 4) subCanvases.delete(subCanvases.keys().next().value as string);
  }
  const c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.clearRect(0, 0, W, H);
  const g = createFrame({ c, pxScale: f.pxScale, t: f.t, fps: f.fps, frame: f.frame, seed: f.seed, mood, weave: 0 });
  paint(g);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  return cv;
}
export function compositeSub(f: Frame, cv: HTMLCanvasElement, alpha: number) {
  if (alpha <= 0) return;
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, alpha);
  c.globalCompositeOperation = 'source-over';
  c.drawImage(cv, 0, 0);
  c.restore();
}

// ------------------------------------------------------------------ screen-space post (stage px in, device px inside)
let fxCanvas: HTMLCanvasElement | null = null;
function fxCopy(f: Frame): HTMLCanvasElement {
  const W = f.c.canvas.width, H = f.c.canvas.height;
  if (!fxCanvas || fxCanvas.width !== W || fxCanvas.height !== H) fxCanvas = makeCanvas(W, H);
  const g = fxCanvas.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'copy';
  g.filter = 'none';
  g.drawImage(f.c.canvas, 0, 0);
  g.globalCompositeOperation = 'source-over';
  return fxCanvas;
}
/** horizontal motion smear of the whole frame (a whip pan's blur): `px` stage px of travel */
export function smearX(f: Frame, px: number) {
  if (px < 0.75) return;
  const src = fxCopy(f);
  const c = f.c;
  const d = px * f.pxScale;
  const n = Math.max(3, Math.min(9, Math.ceil(px / 2)));
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - 0.5) * d;
    c.globalAlpha = 1 / (i + 1);
    c.drawImage(src, o, 0);
  }
  c.restore();
}
/** blur a screen rect (stage px) in place */
export function blurRect(f: Frame, x: number, y: number, w: number, h: number, px: number, alpha = 1) {
  if (px <= 0 || alpha <= 0) return;
  const src = fxCopy(f);
  const c = f.c;
  const s = f.pxScale;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.beginPath();
  c.rect(x * s, y * s, w * s, h * s);
  c.clip();
  c.globalAlpha = alpha;
  c.filter = `blur(${(px * s).toFixed(1)}px)`;
  c.drawImage(src, 0, 0);
  c.restore();
}
