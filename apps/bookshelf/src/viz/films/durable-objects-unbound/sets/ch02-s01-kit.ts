/**
 * durable-objects-unbound — small shot helpers shared by the ch02 / ch03 shots (author:ch02-ch03).
 *
 *   dateStamp(c, mood, o)        a screen-locked date stamp (IBM Plex Mono caps, tracked, an index rule above it,
 *                                a feathered ink plate): '28 SEPTEMBER 2020'. Raised to the 22 px cap floor, probed.
 *   bakeRes(f, c, env, key, r, draw, { blur?, res? })   bakeRect with supersampling for art a push-in enlarges
 *   glowFill(c, x, y, r, col, a)  a source-over radial wash (a light that can white-out the frame)
 *   ease helpers re-exported from common
 */
import { FONT, drawTracked, legibleSize, measureTracked, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import type { Frame, PaintEnv, Palette } from '../../../film';
import { type C2, type Rect } from './common';

export interface DateStampOpts {
  id: string;
  text: string;
  x: number;
  y: number;
  align?: 'left' | 'right';
  alpha: number;
}
/** a date stamp in the film's modern mono face (the place stamp's style without a place) */
export function dateStamp(c: C2, mood: Palette, o: DateStampOpts): void {
  if (o.alpha <= 0.002) return;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    const font = `500 ${size}px ${FONT.mono}`;
    const text = o.text.toUpperCase();
    const w = measureTracked(c, text, { font, size, tracking: 0.08 });
    const right = o.align !== 'left';
    const x0 = right ? o.x - w : o.x;
    c.globalAlpha = o.alpha;
    softPlate(c, x0 + w / 2, o.y - size * 0.4, w + 150, size + 64, mood.ink, 0.5);
    c.globalAlpha = o.alpha;
    c.fillStyle = '#efe6d6';
    drawTracked(c, text, o.x, o.y, { font, size, tracking: 0.08, align: right ? 'right' : 'left' });
    c.globalAlpha = o.alpha * 0.6;
    c.fillRect(x0, o.y - size - 10, w, 0.8);
    c.fillRect(right ? x0 + w - 0.8 : x0, o.y - size - 14, 0.8, 8);
    textProbe(c, o.id, x0, o.y - size, w, size * 1.2, o.alpha);
    c.restore();
  });
}

/** bake static art covering r (layer coords), keyed by mood, optionally supersampled for push-ins */
export function bakeRes(f: Frame, c: C2, env: PaintEnv, key: string, r: Rect, draw: (cc: C2) => void, o: { blur?: number; res?: number } = {}): void {
  f.cached(`dou23/${key}/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    draw(cc);
  }, { ...(o.blur != null ? { blur: o.blur } : {}), ...(o.res != null ? { res: o.res } : {}) } as { blur?: number })(c, r.x, r.y);
}

/** a source-over radial wash (alpha a at the centre fading to 0 at r) */
export function glowFill(c: C2, x: number, y: number, r: number, col: string, a: number): void {
  if (a <= 0.002) return;
  c.save();
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.45, withAlpha(col, a * 0.85));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

/** a hash-based 0..1 value (deterministic) */
export const h01 = (i: number, seed = 0) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
