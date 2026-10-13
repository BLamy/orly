/**
 * Video FX: an event's or a track's VideoFx chain → one canvas `filter` string plus the passes a CSS filter
 * cannot express (vignette, the film finish).
 *
 *   const fx = resolveFx(event.videoFx, eventLocalT, outH)   // null when nothing is enabled / everything is neutral
 *   ctx.filter = fx.filter                                   // applied on the drawImage that places the layer
 *   paintVignette(layerCtx, fx.vignette)                     // darkens the layer's edges, keeps its alpha
 *   applyFinish(layerCtx, fx.finish, env, scratch)           // the registered film finish, mixed 0..1
 *
 * Parameter ranges (types.ts VideoFxKind): brightness −1..1 (0 = none), contrast/saturation 0..3 (1 = none),
 * hue degrees, blur px at 1080p (scaled to the output height), sepia/grayscale/invert 0..1, vignette 0..1,
 * filmFinish 0..1 mix. Filters compose in chain order, as the chain reads in the inspector.
 * Times: event FX are sampled at event-local time, track FX at timeline time (the caller passes the right one).
 */
import type { VideoFx } from '../model/types';
import type { FinishFn } from '../../viz/film/contracts';
import { sampleValue } from './pancrop';

export interface ResolvedFx {
  /** CSS filter for the layer's drawImage ('none' when only non-filter passes are active) */
  filter: string;
  /** true when the filter blurs (the layer's edges stop being opaque) */
  blurs: boolean;
  /** vignette strength 0..1 (0 = none) */
  vignette: number;
  /** film finish mix 0..1 (0 = none) */
  finish: number;
}

const r3 = (n: number) => +n.toFixed(3);

/** resolve a chain at time t; null when it changes nothing (lets the compositor keep its fast paths) */
export function resolveFx(list: readonly VideoFx[] | undefined, t: number, outH: number): ResolvedFx | null {
  if (!list || list.length === 0) return null;
  const parts: string[] = [];
  let blurs = false;
  let vignette = 0;
  let finish = 0;
  for (const fx of list) {
    if (!fx.enabled) continue;
    const v = sampleValue(fx.value, t);
    if (!Number.isFinite(v)) continue;
    switch (fx.kind) {
      case 'brightness':
        if (Math.abs(v) > 1e-4) parts.push(`brightness(${r3(Math.max(0, 1 + v))})`);
        break;
      case 'contrast':
        if (Math.abs(v - 1) > 1e-4) parts.push(`contrast(${r3(Math.max(0, v))})`);
        break;
      case 'saturation':
        if (Math.abs(v - 1) > 1e-4) parts.push(`saturate(${r3(Math.max(0, v))})`);
        break;
      case 'hue':
        if (Math.abs(v % 360) > 1e-3) parts.push(`hue-rotate(${r3(v)}deg)`);
        break;
      case 'blur': {
        const px = (Math.max(0, v) * outH) / 1080;
        if (px > 0.05) {
          parts.push(`blur(${r3(px)}px)`);
          blurs = true;
        }
        break;
      }
      case 'sepia':
        if (v > 1e-4) parts.push(`sepia(${r3(Math.min(1, v))})`);
        break;
      case 'grayscale':
        if (v > 1e-4) parts.push(`grayscale(${r3(Math.min(1, v))})`);
        break;
      case 'invert':
        if (v > 1e-4) parts.push(`invert(${r3(Math.min(1, v))})`);
        break;
      case 'vignette':
        vignette = Math.min(1, vignette + Math.max(0, v));
        break;
      case 'filmFinish':
        finish = Math.max(finish, Math.min(1, Math.max(0, v)));
        break;
    }
  }
  if (!parts.length && vignette <= 1e-4 && finish <= 1e-4) return null;
  return { filter: parts.length ? parts.join(' ') : 'none', blurs, vignette, finish };
}

/**
 * Darken the edges of whatever is in `c` (device px, identity transform on return). `source-atop` keeps the
 * layer's own alpha, so a vignetted title stays a title rather than gaining a dark frame.
 */
export function paintVignette(c: CanvasRenderingContext2D, strength: number): void {
  if (strength <= 0) return;
  const W = c.canvas.width, H = c.canvas.height;
  const r = Math.hypot(W, H) / 2;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = 1;
  c.filter = 'none';
  const g = c.createRadialGradient(W / 2, H / 2, r * (0.62 - 0.3 * strength), W / 2, H / 2, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${r3(Math.min(0.92, 0.9 * strength))})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.restore();
}

export type FinishEnv = Parameters<FinishFn>[1];

/**
 * Run the registered film finish (grain, flicker, bloom, vignette, dust) over `c`, mixed by `amount` 0..1.
 * A full mix runs in place (exactly as the reel does); a partial mix runs on `scratch` (same size, any content)
 * and is laid back over `c` at `amount`. `source-atop` keeps the layer's alpha either way. FinishFns expect the
 * target pre-scaled to stage px; env.pxScale must match `c`.
 */
export function applyFinish(c: CanvasRenderingContext2D, fn: FinishFn, amount: number, env: FinishEnv, scratch: CanvasRenderingContext2D | null, keepAlpha: boolean): void {
  if (amount <= 0) return;
  const W = c.canvas.width, H = c.canvas.height;
  const stage = (x: CanvasRenderingContext2D) => {
    x.setTransform(W / env.W, 0, 0, H / env.H, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.filter = 'none';
  };
  if (amount >= 0.999 && !keepAlpha) {
    stage(c);
    fn(c, env);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    return;
  }
  if (!scratch) return;
  const s = scratch;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'copy';
  s.globalAlpha = 1;
  s.filter = 'none';
  s.drawImage(c.canvas, 0, 0);
  stage(s);
  fn(s, env);
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalAlpha = 1;
  s.globalCompositeOperation = 'source-over';
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.filter = 'none';
  c.globalAlpha = Math.min(1, amount);
  c.globalCompositeOperation = keepAlpha ? 'source-atop' : 'source-over';
  c.drawImage(s.canvas, 0, 0);
  c.restore();
}
