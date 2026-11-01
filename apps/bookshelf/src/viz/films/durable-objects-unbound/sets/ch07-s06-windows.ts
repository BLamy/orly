/**
 * durable-objects-unbound — CLOSE ON THE COPYISTS' WINDOWS (author:ch04-ch05; ch07-s06).
 *
 * celld's town (labGreen) seen close: House B's upper floor at the LEFT (its wide gable and chimney, copyist-1 at a
 * desk in the upper window), House C on the upper terrace at the RIGHT (copyist-2 in the dormer; the Room Lantern in
 * C's main window; C's door below where the successor's keeper stands with a lantern). Between the two houses the
 * hill falls away; far down at the left edge the wellhead (L3) with its small gate. Same left-to-right geography as
 * the canonical town (A off frame left, then the Well, B, C up the hill). Rest-screen px, L4.
 *
 *   WIN                      geometry: B's upper window, C's dormer, C's main window, C's door, the case, the gate
 *   facades(c, env)          B's and C's walls with the window/door HOLES (static: bake it)
 *   roomBack(c, env, w, lit) the lit room behind a window (pale celld lamp)
 *   spineBand(c, env, o)     a notebook held up to the window, big: its spine band complete / incomplete / damaged,
 *                            crossfading between states (o.from → o.to by o.u), with its wax seal
 *   gate(c, env, o)          a small two-leaf iron gate (o.open 0..1), x, y = its foot centre
 *   scrollCase(c, env, o)    an open scroll case on the step (x, y foot), o.pages 0..n received
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { clamp01, glowDot, paper, sm, tone, type C2 } from './common';
import { notebook, waxSeal, type Retained } from './neighbours';

export const WIN = {
  B: { x: 336, y: 262, w: 232, h: 196 },
  C: { x: 918, y: 206, w: 182, h: 160 },
  M: { x: 1124, y: 426, w: 122, h: 116 },
  door: { x: 806, y: 486, w: 72, h: 160 },
  keeper: { x: 756, y: 600 },
  case: { x: 812, y: 598 },
  gate: { x: 52, y: 552 },
  ground: 600,
};

export function facades(c: C2, env: PaintEnv): void {
  const set = mixLab(env.fill('set'), env.fill('ink'), 0.6);
  const rim = withAlpha(env.fill('rim'), 0.45);
  // B: a wide gable with a chimney, its upper floor filling the left of frame
  const b = new Path2D();
  b.moveTo(118, 900);
  b.lineTo(118, 132);
  b.lineTo(96, 140);
  b.lineTo(360, 6);
  b.lineTo(470, 62);
  b.lineTo(470, -40);
  b.lineTo(512, -40);
  b.lineTo(512, 84);
  b.lineTo(626, 140);
  b.lineTo(604, 132);
  b.lineTo(604, 900);
  b.closePath();
  const wb = WIN.B;
  b.rect(wb.x - wb.w / 2, wb.y - wb.h / 2, wb.w, wb.h);
  c.fillStyle = set;
  c.fill(b, 'evenodd');
  // C: the upper terrace's house, a dormer pushing out of the roof, the main window and the door below
  const cc = new Path2D();
  cc.moveTo(684, 900);
  cc.lineTo(684, 112);
  cc.lineTo(664, 120);
  cc.lineTo(812, 70);
  cc.lineTo(812, 106);
  cc.lineTo(918, 96);
  cc.lineTo(1024, 106);
  cc.lineTo(1024, 40);
  cc.lineTo(1080, 22);
  cc.lineTo(1420, 112);
  cc.lineTo(1420, 900);
  cc.closePath();
  for (const w of [WIN.C, WIN.M]) cc.rect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
  const d = WIN.door;
  cc.rect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
  c.fillStyle = mixLab(set, env.mood.haze, 0.06);
  c.fill(cc, 'evenodd');
  // mullions, sills, the door's frame and step (cut-paper, set ink)
  c.fillStyle = set;
  for (const w of [WIN.B, WIN.C, WIN.M]) {
    c.fillRect(w.x - 3, w.y - w.h / 2, 6, w.h);
    c.fillRect(w.x - w.w / 2, w.y - w.h * 0.12 - 3, w.w, 6);
    c.fillRect(w.x - w.w / 2 - 12, w.y + w.h / 2, w.w + 24, 10);
  }
  // the door itself: a closed plank door in the opening (the house is shut until the room comes back)
  c.fillStyle = mixLab(set, env.fill('ink'), 0.45);
  c.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.12);
  c.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(d.x - d.w / 2 + (d.w * i) / 4, d.y - d.h / 2 + 4);
    c.lineTo(d.x - d.w / 2 + (d.w * i) / 4, d.y + d.h / 2 - 4);
    c.stroke();
  }
  c.fillStyle = set;
  c.fillRect(d.x - d.w / 2 - 14, WIN.ground - 8, d.w + 28, 10);
  c.fillRect(d.x - d.w / 2 - 6, d.y - d.h / 2 - 8, d.w + 12, 8);
  // roof edges and sills catch the moon (upper-left edges)
  c.strokeStyle = rim;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(96, 140);
  c.lineTo(360, 6);
  c.moveTo(664, 120);
  c.lineTo(812, 70);
  c.moveTo(1024, 40);
  c.lineTo(1080, 22);
  for (const w of [WIN.B, WIN.C, WIN.M]) {
    c.moveTo(w.x - w.w / 2 - 12, w.y + w.h / 2);
    c.lineTo(w.x + w.w / 2 + 12, w.y + w.h / 2);
  }
  c.stroke();
}

/** the lit room behind a window (a pale celld lamp; lit 0..1) */
export function roomBack(c: C2, env: PaintEnv, w: { x: number; y: number; w: number; h: number }, lit: number, tint = '#cfd9a8'): void {
  const dark = mixLab(mixLab(env.fill('set'), env.fill('ink'), 0.6), env.mood.fg, 0.35);
  const col = tone(env, tint, 0.1);
  const g = c.createRadialGradient(w.x - w.w * 0.2, w.y, 4, w.x, w.y, Math.max(w.w, w.h) * 0.8);
  g.addColorStop(0, mixLab(dark, mixLab(col, '#ffffff', 0.15), lit));
  g.addColorStop(1, mixLab(dark, mixLab(col, env.mood.fg, 0.4), lit));
  c.fillStyle = g;
  c.fillRect(w.x - w.w / 2 - 2, w.y - w.h / 2 - 2, w.w + 4, w.h + 4);
}

export interface SpineOpts {
  x: number;
  y: number;
  s: number;
  from: Retained;
  to: Retained;
  /** 0..1 crossfade from → to */
  u: number;
  sealed?: number;
  alpha?: number;
  /** 0..1 a glint on the band (shown / proven) */
  glint?: number;
}
/** a notebook held up to the window: its spine band reads complete / incomplete / damaged */
export function spineBand(c: C2, env: PaintEnv, o: SpineOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const u = sm(clamp01(o.u));
  notebook(c, env, { x: o.x, y: o.y, s: o.s, band: o.from, lines: 5, alpha: A * (1 - u) });
  if (u > 0.002) notebook(c, env, { x: o.x, y: o.y, s: o.s, band: o.to, lines: 5, alpha: A * u });
  const se = clamp01(o.sealed ?? 1);
  if (se > 0.01) waxSeal(c, env, { x: o.x + 16 * o.s, y: o.y - 22 * o.s, r: 6 * o.s, u: se, alpha: A });
  const g = clamp01(o.glint ?? 0);
  if (g > 0.01) glowDot(c, o.x, o.y + 3 * o.s, 26 * o.s, tone(env, '#f2e6b0', 0.1), 0.55 * g * A);
}

/** a small two-leaf iron gate (x, y = its foot centre), open 0..1 */
export function gate(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; open: number; glow?: number }): void {
  const s = o.s ?? 1;
  const k = sm(clamp01(o.open));
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.strokeStyle = env.fill('ink');
  c.fillStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.fillRect(-26, -46, 4, 46);
  c.fillRect(22, -46, 4, 46);
  for (const sx of [-1, 1]) {
    c.save();
    c.translate(sx * 22, 0);
    c.scale(Math.max(0.12, Math.cos(k * 1.3)), 1);
    c.beginPath();
    for (let i = 0; i <= 3; i++) {
      const x = -sx * (4 + i * 6);
      c.moveTo(x, -2);
      c.lineTo(x, -36 + (i === 3 ? 4 : 0));
    }
    c.moveTo(0, -12);
    c.lineTo(-sx * 22, -12);
    c.moveTo(0, -34);
    c.lineTo(-sx * 22, -32);
    c.stroke();
    c.restore();
  }
  c.restore();
  if ((o.glow ?? 0) > 0.01) glowDot(c, o.x, o.y - 20 * s, 40 * s, tone(env, '#f2dca0', 0.1), 0.5 * (o.glow ?? 0));
}

/** an open scroll case on the step (x, y = foot), with `pages` received (0..n) */
export function scrollCase(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; pages: number }): void {
  const s = o.s ?? 1;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-16, 0);
  c.lineTo(-14, -28);
  c.lineTo(14, -28);
  c.lineTo(16, 0);
  c.closePath();
  c.fill();
  // the open lid, leaning back
  c.save();
  c.translate(14, -28);
  c.rotate(0.9);
  c.fillRect(0, -2, 26, 4);
  c.restore();
  const n = Math.max(0, o.pages);
  for (let i = 0; i < Math.min(6, Math.ceil(n)); i++) {
    const k = clamp01(n - i);
    c.fillStyle = withAlpha(paper(env, 0.1), k);
    c.fillRect(-11 + i * 4, -30 - 8 * k, 6, 12);
  }
  c.restore();
}
