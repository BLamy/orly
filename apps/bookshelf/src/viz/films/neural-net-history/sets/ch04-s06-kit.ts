/**
 * neural-net-history — small helpers shared by ch04-s06, ch04-s07 and ch04-s08 (one animator's group).
 *
 *   clamp01 / sm / lerp / win / tq12 / camKeys        re-exported (ch02-s05b-util, ch03-s06-kit)
 *   ember(mood)                                         the tally-lamp ember: emberRed mixed ~60% into the mood's halo
 *   glow(c, x, y, r, col, a)                            one additive radial glow (inside a layer)
 *   inkLine(c, pts, w, col, u)                          a hand-inked stroke drawn on progressively (u 0..1)
 *   lightThread(c, env, p, q, u, a, sag?)               a thread of light pin to pin (drawn on with a bead)
 *   flutter(t, t0, t1, from, to, seed)                  a falling paper card's path on the twos (x, y, rot)
 */
import type { Palette, PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { clamp01, sm } from './ch02-s05b-util';

export { clamp01, sm, lerp, win, tq12, monotone, smearX, subFrame, compositeSub } from './ch02-s05b-util';
export { camKeys, pinSway, drawChessSlip, stageLip, lampSpill } from './ch03-s06-kit';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

/** the low-chroma ember (script: emberRed mixed about 60% into winterBlue) */
export const ember = (m: Palette) => mixLab(MOODS.emberRed.core, m.halo, 0.6);

export function glow(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0.002 || r <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.35, withAlpha(col, a * 0.45));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}

/** a hand-inked stroke along a polyline, drawn on progressively (u 0..1), with a slight seeded wobble */
export function inkLine(c: C, pts: P[], w: number, col: string, u: number, seed = 3) {
  if (u <= 0 || pts.length < 2) return;
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(d);
    total += d;
  }
  let left = total * clamp01(u);
  c.save();
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / seg[i - 1]);
    const a = pts[i - 1], b = pts[i];
    const wob = hash1(i, seed) * w * 0.35;
    c.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + wob);
    left -= seg[i - 1];
  }
  c.stroke();
  c.restore();
}

/** a thread of light pin to pin, drawn on progressively (u) and fading (a) */
export function lightThread(c: C, env: PaintEnv, p: P, q: P, u: number, a: number, sag = 0.08) {
  if (u <= 0 || a <= 0) return;
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + Math.hypot(q.x - p.x, q.y - p.y) * sag;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const n = 28;
  const pts: P[] = [];
  for (let i = 0; i <= n * clamp01(u); i++) {
    const s = i / n;
    pts.push({ x: (1 - s) * (1 - s) * p.x + 2 * (1 - s) * s * mx + s * s * q.x, y: (1 - s) * (1 - s) * p.y + 2 * (1 - s) * s * my + s * s * q.y });
  }
  for (const [lw, al] of [[6, 0.08], [2.4, 0.24], [1, 0.7]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, al * a);
    c.lineWidth = lw;
    c.beginPath();
    pts.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
    c.stroke();
  }
  if (u < 1 && pts.length) {
    const h = pts[pts.length - 1];
    const g = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, 14);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * a));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(h.x - 14, h.y - 14, 28, 28);
  }
  c.restore();
}

/**
 * A paper card fluttering down from `from` and coming to rest at `to` (t0 → t1), sampled on the twos:
 * a falling-leaf sway that dies away as it lands, a rocking tilt, and a small settle on contact.
 */
export function flutter(t: number, t0: number, t1: number, from: P, to: P, seed: number): { x: number; y: number; rot: number; on: boolean } {
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  if (tq < t0) return { x: from.x, y: from.y, rot: 0, on: false };
  const u = clamp01((tq - t0) / (t1 - t0));
  const fall = 1 - (1 - u) * (1 - u) * (1 - 0.35 * u); // eases into the landing
  const damp = 1 - sm(u);
  const ph = hash1(seed, 7) * 6.28;
  const sway = Math.sin(u * 9.5 + ph) * 26 * damp;
  const rot = Math.sin(u * 9.5 + ph + 1.1) * 0.55 * damp;
  const settle = tq > t1 ? 0.035 * Math.exp(-(tq - t1) * 5) * Math.sin((tq - t1) * 18) : 0;
  return { x: from.x + (to.x - from.x) * fall + sway, y: from.y + (to.y - from.y) * fall, rot: rot + settle, on: true };
}
