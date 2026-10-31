/**
 * ch08-s08 — a cut-paper balance scale, the knob mountain, label tokens, and a hall of mirrors.
 * World coordinates (L4 at CAMERA3_HOME).
 *
 *   SC                                      pivot, beam half-length, chain length, base
 *   scaleAnchors(theta)                      beam ends and pan centres for a tilt (radians, + = right pan down)
 *   drawScale(c, theta, env)                 column, finial, beam, chains, pans (the hero silhouette, pierced)
 *   knobMountain(c, x, y, env, a)            sixty million numbers as a heap of tiny potentiometer knobs (the
 *                                            Mark I's weights), sitting on a pan at (x, y)
 *   token(c, x, y, r, on, env, o)            a label token: a lit disc with ten tiny yes/no toggles (`on` of
 *                                            them switched on, fractional = the next one flipping)
 *   mirror(c, x, y, w, h, env, inner)        a gilt-less cut-paper mirror frame; `inner` paints its glass
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { addFoil } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;
export const SC = { px: 640, py: 236, arm: 300, chain: 196, baseY: 636 };

export function scaleAnchors(theta: number) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const L = { x: SC.px - SC.arm * c, y: SC.py - SC.arm * s };
  const R = { x: SC.px + SC.arm * c, y: SC.py + SC.arm * s };
  return { L, R, panL: { x: L.x, y: L.y + SC.chain }, panR: { x: R.x, y: R.y + SC.chain } };
}

const COLUMN = (() => {
  const p = new Path2D();
  const x = SC.px;
  // stepped foot
  p.rect(x - 120, SC.baseY - 14, 240, 14);
  p.rect(x - 92, SC.baseY - 30, 184, 16);
  p.moveTo(x - 60, SC.baseY - 30);
  p.quadraticCurveTo(x - 30, SC.baseY - 44, x - 16, SC.baseY - 80);
  p.lineTo(x + 16, SC.baseY - 80);
  p.quadraticCurveTo(x + 30, SC.baseY - 44, x + 60, SC.baseY - 30);
  p.closePath();
  // the shaft with two knops
  p.rect(x - 9, SC.py + 10, 18, SC.baseY - 80 - SC.py - 10);
  for (const ky of [SC.py + 120, SC.py + 260]) p.ellipse(x, ky, 20, 9, 0, 0, Math.PI * 2);
  // the pivot housing and a pierced finial (a quatrefoil the backlight shines through)
  p.moveTo(x - 30, SC.py + 16);
  p.lineTo(x - 18, SC.py - 22);
  p.lineTo(x + 18, SC.py - 22);
  p.lineTo(x + 30, SC.py + 16);
  p.closePath();
  p.moveTo(x - 16, SC.py - 22);
  p.quadraticCurveTo(x - 24, SC.py - 70, x, SC.py - 104);
  p.quadraticCurveTo(x + 24, SC.py - 70, x + 16, SC.py - 22);
  p.closePath();
  addFoil(p, x, SC.py - 52, 9, 4, { rot: Math.PI / 4 });
  // the pointer (needle) rides on the beam; its scale arc is a pierced crescent
  return p;
})();

const BEAM = (() => {
  const p = new Path2D();
  const a = SC.arm + 14;
  p.moveTo(-a, -4);
  p.quadraticCurveTo(0, -16, a, -4);
  p.lineTo(a, 4);
  p.quadraticCurveTo(0, 8, -a, 4);
  p.closePath();
  // scrolls at the ends and pierced roundels along the beam
  for (const sx of [-1, 1]) {
    p.moveTo(sx * a, 0);
    p.arc(sx * a, 0, 8, 0, Math.PI * 2);
  }
  for (let i = 1; i <= 4; i++) for (const sx of [-1, 1]) addFoil(p, sx * i * 58, -1, 3.4, 4);
  // the needle
  p.moveTo(-4, -6);
  p.lineTo(0, -64);
  p.lineTo(4, -6);
  p.closePath();
  return p;
})();

function pan(c: C, x: number, y: number, ink: string, rim: string) {
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - 104, y);
  c.quadraticCurveTo(x, y + 56, x + 104, y);
  c.lineTo(x + 96, y + 6);
  c.quadraticCurveTo(x, y + 40, x - 96, y + 6);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(x, y, 106, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = rim;
  c.fillRect(x - 100, y - 6, 200, 1.2);
}

export function drawScale(c: C, theta: number, env: PaintEnv, under?: (side: 0 | 1, x: number, y: number) => void): void {
  const ink = env.fill('ink');
  const A = scaleAnchors(theta);
  c.fillStyle = ink;
  c.fill(COLUMN, 'evenodd');
  // chains (three per pan, straight, plumb)
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  c.beginPath();
  for (const [e, p] of [
    [A.L, A.panL],
    [A.R, A.panR],
  ] as const) {
    for (const dx of [-98, 0, 98]) {
      c.moveTo(e.x, e.y + 8);
      c.lineTo(p.x + dx, p.y - 2);
    }
  }
  c.stroke();
  // the beam
  c.save();
  c.translate(SC.px, SC.py);
  c.rotate(theta);
  c.fillStyle = ink;
  c.fill(BEAM, 'evenodd');
  c.restore();
  // hooks
  for (const e of [A.L, A.R]) {
    c.beginPath();
    c.arc(e.x, e.y + 8, 6, 0, Math.PI * 2);
    c.fill();
  }
  // whatever sits in each pan is drawn before the pan's front lip
  under?.(0, A.panL.x, A.panL.y);
  under?.(1, A.panR.x, A.panR.y);
  const rim = withAlpha(env.mood.rim, 0.35);
  pan(c, A.panL.x, A.panL.y, ink, rim);
  pan(c, A.panR.x, A.panR.y, ink, rim);
}

// ------------------------------------------------------------------------------------------- knob mountain
interface Knob {
  x: number;
  y: number;
  r: number;
  a: number;
}
const KNOBS: Knob[] = (() => {
  const out: Knob[] = [];
  const W = 92;
  const H = 128;
  for (let row = 0; row < 26; row++) {
    const yy = -row * 5;
    const half = W * Math.sqrt(Math.max(0, 1 - Math.pow(-yy / H, 1.6)));
    for (let x = -half; x <= half; x += 7.5) {
      const h = hash1(out.length, 811);
      out.push({ x: x + (h - 0.5) * 4, y: yy + (hash1(out.length, 812) - 0.5) * 3, r: 3.2 + 2.4 * hash1(out.length, 813), a: h * Math.PI * 2 });
    }
  }
  return out;
})();
let knobBitmap: { key: string; cv: HTMLCanvasElement } | null = null;
/** the heap of knobs on a pan at (x, y); a = alpha */
export function knobMountain(c: C, x: number, y: number, env: PaintEnv, a = 1, pxScale = 1.5): void {
  if (a <= 0.003) return;
  const key = `${env.mood.id}|${pxScale}`;
  if (!knobBitmap || knobBitmap.key !== key) {
    const cv = document.createElement('canvas');
    const W = 220;
    const H = 150;
    const s = Math.max(1, pxScale) * 1.4;
    cv.width = Math.ceil(W * s);
    cv.height = Math.ceil(H * s);
    const g = cv.getContext('2d')!;
    g.setTransform(s, 0, 0, s, (W / 2) * s, (H - 8) * s);
    const ink = env.fill('ink');
    const rim = env.mood.rim;
    for (const k of KNOBS) {
      g.fillStyle = ink;
      g.beginPath();
      g.arc(k.x, k.y, k.r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = withAlpha(rim, 0.5);
      g.lineWidth = 0.7;
      g.beginPath();
      g.arc(k.x, k.y, k.r - 0.4, Math.PI * 1.05, Math.PI * 1.65);
      g.stroke();
      // the pointer notch of a potentiometer knob
      g.strokeStyle = withAlpha(rim, 0.6);
      g.beginPath();
      g.moveTo(k.x, k.y);
      g.lineTo(k.x + Math.cos(k.a) * k.r * 0.8, k.y + Math.sin(k.a) * k.r * 0.8);
      g.stroke();
    }
    knobBitmap = { key, cv };
  }
  c.save();
  c.globalAlpha *= a;
  c.drawImage(knobBitmap.cv, x - 110, y - 142, 220, 150);
  c.restore();
}

// ------------------------------------------------------------------------------------------- tokens
/** a label token: a lit disc with ten tiny yes/no toggles in two rows; `on` toggles switched on */
export function token(c: C, x: number, y: number, r: number, on: number, env: PaintEnv, o: { lit?: number; alpha?: number } = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const m = env.mood;
  const lit = o.lit ?? 1;
  c.save();
  c.globalAlpha *= a;
  glow(c, x, y, r * 3, m.halo, 0.28 * lit);
  c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.3), m.halo, 0.75 * lit);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = Math.max(1, r * 0.08);
  c.stroke();
  // ten toggles: two rows of five little levers
  const tw = r * 0.26;
  for (let i = 0; i < 10; i++) {
    const row = i < 5 ? 0 : 1;
    const col = i % 5;
    const tx = x + (col - 2) * tw * 1.32;
    const ty = y + (row === 0 ? -1 : 1) * r * 0.27;
    const u = Math.max(0, Math.min(1, on - i));
    c.fillStyle = mixLab(env.fill('ink'), m.set, 0.15);
    c.fillRect(tx - tw * 0.38, ty - tw * 0.62, tw * 0.76, tw * 1.24);
    // the lever: down (no) -> up (yes)
    const ly = ty + (0.32 - 0.64 * u) * tw;
    c.fillStyle = u > 0.5 ? m.core : withAlpha(m.rim, 0.55);
    c.fillRect(tx - tw * 0.26, ly - tw * 0.2, tw * 0.52, tw * 0.4);
    if (u > 0.5) glow(c, tx, ly, tw * 1.4, m.core, 0.35);
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------- mirrors
/** a cut-paper mirror frame with an arched top; `inner` paints the glass (clipped) */
export function mirror(c: C, x: number, y: number, w: number, h: number, env: PaintEnv, inner: (c: C) => void, a = 1): void {
  if (a <= 0.003) return;
  const ink = env.fill('ink');
  c.save();
  c.globalAlpha *= a;
  const glass = new Path2D();
  glass.moveTo(x - w / 2, y + h / 2);
  glass.lineTo(x - w / 2, y - h / 2 + w * 0.35);
  glass.quadraticCurveTo(x - w / 2, y - h / 2, x, y - h / 2 - w * 0.12);
  glass.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + w * 0.35);
  glass.lineTo(x + w / 2, y + h / 2);
  glass.closePath();
  c.save();
  c.clip(glass);
  c.fillStyle = mixLab(env.mood.set, env.mood.halo, 0.3);
  c.fillRect(x - w, y - h, w * 2, h * 2);
  inner(c);
  // a sheen
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  g.addColorStop(0, withAlpha(env.mood.core, 0.18));
  g.addColorStop(0.45, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(x - w, y - h, w * 2, h * 2);
  c.restore();
  c.strokeStyle = ink;
  c.lineWidth = Math.max(3, w * 0.07);
  c.stroke(glass);
  c.fillStyle = ink;
  c.fillRect(x - w / 2 - 6, y + h / 2, w + 12, 7);
  c.beginPath();
  c.arc(x, y - h / 2 - w * 0.12 - 6, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
