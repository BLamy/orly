/**
 * durable-objects-unbound — THE HELD LETTER (staging.buildList.heldLetter): the output gate.
 *
 * The reply to the sender waits behind a brass latch in the Room Lantern's door; the house BELL lifts it (the
 * acknowledgement). If the write fails the waiting letters turn to torn, red-edged ERROR slips.
 *
 *   lanternDoor(c, env, o)   the door in close-up (x, y = the door's bottom centre; s = 1 is 120 x 170 px):
 *                            o.latch 0 shut .. 1 lifted; o.glow 0..1 the candlelight leaking round the frame
 *   letter(c, env, o)        a sealed reply letter (x, y = centre, s = 1 is 46 x 30); o.error 0..1 turns it into
 *                            a torn red-edged error slip; o.blown 0..1 lifts and tumbles it away (lost reply)
 *   houseBell(c, env, o)     a small bell on a bracket (x, y = the bracket pivot); o.swing (rad), o.ring 0..1 glint
 *   bellSwing(t, at, amp)    a damped twos-quantised swing for a bell rung at `at`
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS_HI, EMBER, brass, clamp01, glowDot, paper, sm, tone, twos, type C2 } from './common';

export interface DoorOpts {
  x: number;
  y: number;
  s?: number;
  latch: number;
  glow?: number;
  alpha?: number;
}
export function lanternDoor(c: C2, env: PaintEnv, o: DoorOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const W = 120 * s, H = 170 * s;
  c.save();
  c.globalAlpha *= A;
  const ink = env.fill('ink');
  // the warm leak round the frame (candlelight inside the lantern)
  const gl = clamp01(o.glow ?? 0.8);
  if (gl > 0.01) glowDot(c, o.x, o.y - H * 0.5, W * 0.9, tone(env, '#ffbe6a', 0.05), 0.4 * gl);
  // frame (paper lantern cap, ribbed) with the door opening
  c.fillStyle = ink;
  c.fillRect(o.x - W * 0.75, o.y - H - 24 * s, W * 1.5, 24 * s);
  c.fillRect(o.x - W * 0.75, o.y - H - 2 * s, W * 0.2, H + 2 * s);
  c.fillRect(o.x + W * 0.55, o.y - H - 2 * s, W * 0.2, H + 2 * s);
  c.fillRect(o.x - W * 0.75, o.y, W * 1.5, 12 * s);
  // the paper door panel: lit from behind
  const g = c.createLinearGradient(0, o.y - H, 0, o.y);
  g.addColorStop(0, mixLab(paper(env, 0.25), tone(env, '#ffc777', 0.05), 0.5 * gl));
  g.addColorStop(1, mixLab(paper(env, 0.4), tone(env, '#e8a050', 0.05), 0.35 * gl));
  c.fillStyle = g;
  c.fillRect(o.x - W / 2, o.y - H, W, H);
  // ribs on the paper
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = 1.2 * s;
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(o.x - W / 2, o.y - (H * i) / 4);
    c.lineTo(o.x + W / 2, o.y - (H * i) / 4);
    c.stroke();
  }
  // hinge side
  c.fillStyle = ink;
  c.fillRect(o.x - W / 2 - 2 * s, o.y - H, 5 * s, H);
  // the brass latch: a bar pivoting at the left of the door's right half, resting in a keeper
  const lx = o.x + W * 0.05, ly = o.y - H * 0.42;
  c.fillStyle = brass(env, 0.3);
  c.fillRect(o.x + W * 0.38, ly - 8 * s, 10 * s, 16 * s); // keeper
  c.save();
  c.translate(lx, ly);
  c.rotate(-1.15 * sm(clamp01(o.latch)));
  const bg = c.createLinearGradient(0, -4 * s, 0, 4 * s);
  bg.addColorStop(0, brass(env, 0.8));
  bg.addColorStop(1, brass(env, 0.1));
  c.fillStyle = bg;
  c.fillRect(0, -3.5 * s, W * 0.42, 7 * s);
  c.beginPath();
  c.arc(0, 0, 6 * s, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.strokeStyle = withAlpha(BRASS_HI, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(lx, ly, 6 * s, Math.PI, Math.PI * 1.8);
  c.stroke();
  c.restore();
}
/** the latch bar's resting point (where a held letter leans), world */
export function latchPt(o: Pick<DoorOpts, 'x' | 'y' | 's'>): { x: number; y: number } {
  const s = o.s ?? 1;
  return { x: o.x + 120 * s * 0.25, y: o.y - 170 * s * 0.42 };
}

export interface LetterOpts {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  error?: number;
  blown?: number;
  alpha?: number;
  /** a small tick mark stamped on it (the acknowledgement it carries) */
  tick?: number;
}
export function letter(c: C2, env: PaintEnv, o: LetterOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const er = clamp01(o.error ?? 0);
  const bl = clamp01(o.blown ?? 0);
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x + bl * 160 * s, o.y - Math.sin(bl * Math.PI) * 60 * s - bl * 40 * s);
  c.rotate((o.rot ?? 0) + bl * 2.6);
  c.scale(s, s * (1 - 0.6 * Math.abs(Math.sin(bl * 7))));
  const W = 46, H = 30;
  const pap = mixLab(paper(env, 0.05), '#f3e4c4', 0.3);
  // envelope or torn error slip
  c.fillStyle = pap;
  c.beginPath();
  if (er < 0.5) {
    c.rect(-W / 2, -H / 2, W, H);
  } else {
    c.moveTo(-W / 2, -H / 2);
    for (let i = 0; i <= 8; i++) c.lineTo(-W / 2 + (W * i) / 8, -H / 2 + (i % 2 ? 3 : -1));
    c.lineTo(W / 2, H / 2);
    for (let i = 8; i >= 0; i--) c.lineTo(-W / 2 + (W * i) / 8, H / 2 + (i % 2 ? -3 : 1));
    c.closePath();
  }
  c.fill();
  if (er < 0.5) {
    // flap lines and a wax-free paper seal (the reply)
    c.strokeStyle = withAlpha(mixLab('#3a2a18', env.mood.fg, 0.2), 0.55 * (1 - er * 2));
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-W / 2, -H / 2);
    c.lineTo(0, 2);
    c.lineTo(W / 2, -H / 2);
    c.stroke();
  }
  if (er > 0.01) {
    // the red edge and a crossed mark (an error, not the reply)
    c.strokeStyle = withAlpha(tone(env, EMBER, 0.1), er);
    c.lineWidth = 2.4;
    c.strokeRect(-W / 2 + 1, -H / 2 + 1, W - 2, H - 2);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-8, -7);
    c.lineTo(8, 7);
    c.moveTo(8, -7);
    c.lineTo(-8, 7);
    c.stroke();
  }
  c.restore();
}

export interface BellOpts {
  x: number;
  y: number;
  s?: number;
  swing?: number;
  ring?: number;
  alpha?: number;
  /** out of tune (a false bell): a slightly bent clapper and a colder glint */
  sour?: boolean;
}
export function houseBell(c: C2, env: PaintEnv, o: BellOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= A;
  const ink = env.fill('ink');
  // bracket
  c.strokeStyle = ink;
  c.lineWidth = 3 * s;
  c.beginPath();
  c.moveTo(o.x - 22 * s, o.y);
  c.lineTo(o.x, o.y);
  c.stroke();
  c.translate(o.x, o.y);
  c.rotate(o.swing ?? 0);
  // bell body
  const g = c.createLinearGradient(-12 * s, 0, 12 * s, 0);
  g.addColorStop(0, brass(env, 0.2));
  g.addColorStop(0.4, brass(env, 0.7 + 0.3 * (o.ring ?? 0)));
  g.addColorStop(1, brass(env, 0.05));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-3 * s, 2 * s);
  c.quadraticCurveTo(-10 * s, 6 * s, -11 * s, 20 * s);
  c.lineTo(-14 * s, 24 * s);
  c.lineTo(14 * s, 24 * s);
  c.lineTo(11 * s, 20 * s);
  c.quadraticCurveTo(10 * s, 6 * s, 3 * s, 2 * s);
  c.closePath();
  c.fill();
  // clapper
  c.fillStyle = ink;
  c.beginPath();
  c.arc((o.sour ? 3 : 0) * s, 26 * s, 3 * s, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if ((o.ring ?? 0) > 0.01) glowDot(c, o.x, o.y + 14 * s, 26 * s, o.sour ? tone(env, '#c9d6e0', 0.2) : tone(env, BRASS_HI, 0.05), 0.55 * (o.ring ?? 0) * A);
}
/** a damped swing (rad) for a bell rung at `at` (twos-quantised) */
export function bellSwing(t: number, at: number, amp = 0.5): number {
  const q = twos(t) - at;
  if (q < 0) return 0;
  return amp * Math.exp(-q * 1.6) * Math.sin(q * 11);
}
