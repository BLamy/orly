/**
 * durable-objects-unbound — THE DEMONSTRATOR'S HAND and THE PIN BOARD (staging.hands, staging.pins).
 *
 * Only this hand reaches into the town from outside, ALWAYS from the lower RIGHT, and only to pull or reseat a
 * pin, to turn a Plate tile on a parchment insert, or to hold up a slip. A rolled-sleeve forearm (a mid-life
 * teacher's, never elderly), cut paper, moving on twos along a shallow arc.
 *
 *   demonstratorHand(c, env, o)   o.tip = where the pinch/fingertip lands at reach 1; o.reach 0..1 (0 = off frame
 *                                 lower right); o.shape 'pinch' | 'grip' | 'point' | 'open'; o.s scale (1 ≈ a hand
 *                                 at the action plane next to a 320 px keeper); o.holding: 'pin' | 'slip' | 'none'
 *   handReach(t, inAt, outAt, d)  a twos-quantised reach envelope (in over d, out over d)
 *   pinBoard(c, env, o)           ch08-s01: the dark board on the L6 lamp-post with four hooks; each pin hangs with its
 *                                 badge beneath, in the order pulled: Tooth (Amazon S3), candle band (workerd · 28 Oct),
 *                                 second look (workerd · 28 Oct), wax seal (celld 0.6.3)
 *   PIN_ORDER                     [{ machine, badge, from }]
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film';
import { badge, clamp01, lerp, sm, twos, type BadgeText, type C2 } from './common';
import { pinShape } from './wellAndPlate';

export type HandShape = 'pinch' | 'grip' | 'point' | 'open';
export interface HandOpts {
  tip: { x: number; y: number };
  reach: number;
  shape?: HandShape;
  s?: number;
  /** extra wrist angle (rad); default aims the forearm up-left from the lower right */
  angle?: number;
  holding?: 'pin' | 'slip' | 'none';
  /** rim light direction (default the moon/window, upper left) */
  rim?: { x: number; y: number };
  alpha?: number;
}
/** a twos-quantised reach: 0 → 1 over d from inAt, back to 0 over d from outAt */
export function handReach(t: number, inAt: number, outAt: number, d = 0.8): number {
  const q = twos(t);
  return sm((q - inAt) / d) * (1 - sm((q - outAt) / d));
}
/**
 * Always from the lower RIGHT (staging.hands): the sprite below is cut with its forearm toward the lower left, so it is
 * drawn mirrored about the fingertip's vertical (a hand has no likeness; the rim stays on the upper, moon-side edge).
 * `angle` is the unmirrored forearm angle (default -0.72: after the mirror the forearm rises from the lower right).
 */
export function demonstratorHand(c: C2, env: PaintEnv, o: HandOpts): void {
  c.save();
  c.translate(o.tip.x, 0);
  c.scale(-1, 1);
  c.translate(-o.tip.x, 0);
  drawHand(c, env, o);
  c.restore();
}
function drawHand(c: C2, env: PaintEnv, o: HandOpts): void {
  const r = clamp01(o.reach);
  if (r <= 0.001 || (o.alpha ?? 1) <= 0.002) return;
  const s = o.s ?? 1;
  // the arc: from off frame lower right to the tip, bowing slightly upward
  const base = o.angle ?? -0.72; // forearm direction (rad, pointing from the elbow toward the hand): up-left
  const dir = { x: Math.cos(base + Math.PI), y: Math.sin(base + Math.PI) }; // from the hand back toward the elbow
  const off = 560 * s;
  const k = sm(r);
  const hx = lerp(o.tip.x + dir.x * off, o.tip.x, k) - Math.sin(Math.PI * k) * 18 * s;
  const hy = lerp(o.tip.y + dir.y * off, o.tip.y, k) - Math.sin(Math.PI * k) * 30 * s;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(hx, hy);
  c.rotate(base);
  c.scale(s, s);
  const ink = PUPPET_NEAR_BLACK;
  // local frame: +x points from the wrist toward the fingertips; the forearm runs back along -x
  // forearm (tapered), rolled sleeve band, then the elbow off frame
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-34, -11);
  c.lineTo(-300, -21);
  c.lineTo(-300, 23);
  c.lineTo(-34, 11);
  c.closePath();
  c.fill();
  // rolled sleeve: a thicker band with two folds
  c.beginPath();
  c.moveTo(-150, -22);
  c.lineTo(-196, -27);
  c.lineTo(-196, 29);
  c.lineTo(-150, 23);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-196, -30);
  c.lineTo(-420, -34);
  c.lineTo(-420, 40);
  c.lineTo(-196, 32);
  c.closePath();
  c.fill();
  // hand
  const shape = o.shape ?? 'pinch';
  c.beginPath();
  c.ellipse(-14, 0, 24, 15, 0, 0, Math.PI * 2);
  c.fill();
  const finger = (x0: number, y0: number, len: number, ang: number, w: number) => {
    c.save();
    c.translate(x0, y0);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, -w / 2);
    c.lineTo(len - w / 2, -w / 2.4);
    c.arc(len - w / 2, 0, w / 2.4, -Math.PI / 2, Math.PI / 2);
    c.lineTo(0, w / 2);
    c.closePath();
    c.fill();
    c.restore();
  };
  if (shape === 'pinch') {
    // index and thumb meeting at the tip (0, 0) + a curled hand behind
    finger(0, -9, 22, 0.35, 8);
    finger(-2, 9, 20, -0.42, 9);
    c.beginPath();
    c.ellipse(4, 2, 12, 11, 0, 0, Math.PI * 2);
    c.fill();
  } else if (shape === 'point') {
    finger(2, -5, 34, -0.02, 8);
    finger(-4, 8, 14, 0.5, 9);
  } else if (shape === 'grip') {
    c.beginPath();
    c.ellipse(6, 0, 16, 15, 0, 0, Math.PI * 2);
    c.fill();
    finger(-4, -12, 16, 0.2, 9);
  } else {
    for (let i = 0; i < 4; i++) finger(4, -12 + i * 7, 26 - Math.abs(i - 1.5) * 3, -0.12 + i * 0.08, 7);
    finger(-8, 12, 18, 0.9, 9);
  }
  // rim on the forearm's upper (light-facing) edge
  const rim = o.rim ?? { x: -0.7, y: -0.7 };
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  c.lineWidth = 2.2;
  c.beginPath();
  if (rim.y < 0) {
    c.moveTo(-400, -34);
    c.lineTo(-196, -30);
    c.moveTo(-150, -21);
    c.lineTo(-34, -11);
    c.lineTo(-14, -15);
  }
  c.stroke();
  // cuff fold hairlines
  c.strokeStyle = withAlpha(env.mood.rim, 0.25);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-172, -24);
  c.lineTo(-172, 26);
  c.stroke();
  c.restore();
  if (o.holding === 'pin') {
    // the pin rides in the pinch
    pinShape(c, env, hx + 2 * s, hy + 2 * s, base + 2.2, s * 1.2);
  }
}

export const PIN_ORDER: { machine: string; badge: BadgeText; from: string }[] = [
  { machine: 'the Tooth', badge: 'Amazon S3', from: 'ch03-s02' },
  { machine: 'the candle band', badge: 'workerd · 28 Oct', from: 'ch05-s04' },
  { machine: 'the second look', badge: 'workerd · 28 Oct', from: 'ch06-s05' },
  { machine: 'the neighbours’ seal', badge: 'celld 0.6.3', from: 'ch07-s04' },
];
export interface PinBoardOpts {
  x: number;
  y: number;
  /** board width (default 520) */
  w?: number;
  /** per pin: alpha and catch-light 0..1 */
  pins: { alpha: number; glint?: number; swing?: number }[];
  badgesLegible?: boolean;
  s?: number;
}
/** a dark board with four hooks; each pin hangs on its hook, its badge below (art; legible when the camera is in) */
export function pinBoard(c: C2, env: PaintEnv, o: PinBoardOpts): void {
  const s = o.s ?? 1;
  const w = (o.w ?? 520) * s, h = 150 * s;
  c.save();
  c.fillStyle = mixLab(env.fill('ink'), env.mood.fg, 0.2);
  c.fillRect(o.x - w / 2, o.y - h / 2, w, h);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(o.x - w / 2, o.y - h / 2);
  c.lineTo(o.x + w / 2, o.y - h / 2);
  c.stroke();
  for (let i = 0; i < 4; i++) {
    const p = o.pins[i];
    const hx = o.x - w / 2 + (w * (i + 0.5)) / 4;
    const hy = o.y - h / 2 + 22 * s;
    // hook
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 2 * s;
    c.beginPath();
    c.arc(hx, hy, 4 * s, Math.PI, 0);
    c.stroke();
    if (!p || p.alpha <= 0.01) continue;
    pinShape(c, env, hx, hy + 6 * s, (p.swing ?? 0) + 0.1, 1.6 * s, p.alpha);
    badge(c, env, { x: hx, y: hy + 40 * s, text: PIN_ORDER[i].badge, s: 0.9 * s, alpha: p.alpha, glint: p.glint, legible: o.badgesLegible ?? false, id: `pinboard-badge-${i}`, swing: (p.swing ?? 0) * 0.6 });
  }
  c.restore();
}
