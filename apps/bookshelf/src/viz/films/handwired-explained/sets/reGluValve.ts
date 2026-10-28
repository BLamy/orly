/**
 * handwired-explained — DEEP DIVE III's machine: THE ReGLU VALVE (ch07-s02, s03, s04, s05, s12).
 *
 * One ReGLU unit, y = 3w · max(0, g + b), worked by hand from the runtime's backward rule (ch07-s02, labelled
 * 'derived'). With w 0.5, g 0.25, b −0.1: the channel carries 3w = 1.5, the gate opens to 0.15, the tray fills to
 * 0.225; backward, ∂y/∂w = 3 × 0.15 = 0.45 and ∂y/∂g = 3w = 1.5 (b's slope is the same 1.5). Lower b to −0.4 and
 * the gate SHUTS (g + b = −0.15 < 0): the opening is nothing and every gradient is 0 (ch07-s03). Every number here
 * is COMPUTED from w, g, b (Math.fround), never typed.
 *
 *   import { reGluValve, VALVE } from '../sets/reGluValve';
 *   f.layer('L4', (c, env) => reGluValve(c, env, { x: 640, y: 380, w: 0.5, g: 0.25, b: s.get(scene.b), forward: u }));
 *   VALVE.forward(w, g, b) → { channel, opening, y }; VALVE.backward(w, g, b) → { dw, dg, db }
 *
 * Construction (ch07-s02): a horizontal copper channel enters from the left (thickness ∝ 3w); a vertical paper
 * sluice gate whose opening is drawn to scale on a small ruler beside it; the gate is lifted by a cam cut in the
 * shape of Deep Dive I's copper hinge (flat, then a 45° climb); three brass dials below (w, g, b) each with a
 * hanging number tag; a tray at the right filling to y. forward 0..1 runs light left to right; backward 0..1 runs a
 * lantern glow right to left and splits to the w and g dials. dark: true draws it as a single dark valve (ch07-s12).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from './narratorHands';

const f32 = Math.fround;
function forward(w: number, g: number, b: number) {
  const channel = f32(3 * f32(w));
  const opening = Math.max(0, f32(f32(g) + f32(b)));
  return { channel, opening, y: f32(channel * opening) };
}
function backward(w: number, g: number, b: number) {
  const { channel, opening } = forward(w, g, b);
  const open = opening > 0;
  return { dw: open ? f32(3 * opening) : 0, dg: open ? channel : 0, db: open ? channel : 0 };
}
const fmt = (v: number) => String(Number(v.toPrecision(6)));

export interface ValveOpts {
  x: number;
  y: number;
  s?: number;
  w: number;
  g: number;
  b: number;
  /** 0..1 light along the channel, left to right */
  forward?: number;
  /** 0..1 the backward glow, right to left, splitting to the dials */
  backward?: number;
  /** number tags on the dials and the tray (0..1); default 1 */
  labels?: boolean | number;
  /** show the backward slopes on the w and g dials (0..1) */
  slopes?: number;
  /** a single dark valve (ch07-s12), no light, no numbers */
  dark?: boolean;
  /** silhouette against the backlight (before it inks onto parchment) */
  silhouette?: boolean;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

export function reGluValve(c: CanvasRenderingContext2D, env: PaintEnv, o: ValveOpts) {
  const s = o.s ?? 1;
  const F = forward(o.w, o.g, o.b);
  const B = backward(o.w, o.g, o.b);
  const ink = o.silhouette ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const lab = o.dark ? 0 : typeof o.labels === 'number' ? clamp01(o.labels) : o.labels === false ? 0 : 1;
  const fwd = o.dark ? 0 : clamp01(o.forward ?? 0);
  const bwd = o.dark ? 0 : clamp01(o.backward ?? 0);
  const X = o.x, Y = o.y;
  const chanH = 10 * s + F.channel * 10 * s; // thickness reads 3w
  const x0 = X - 260 * s, gx = X, x1 = X + 170 * s;
  const gateH = 120 * s; // full scale of the ruler: 0..0.6
  const scale = gateH / 0.6;
  // ---- the channel (copper), lit left to right by `forward`
  c.fillStyle = ink;
  c.fillRect(x0, Y - chanH / 2 - 4 * s, x1 - x0, chanH + 8 * s);
  c.fillStyle = o.dark ? mixLab(ink, env.mood.set, 0.2) : copperOf(env, 0.2);
  c.fillRect(x0, Y - chanH / 2, gx - x0, chanH);
  if (F.opening > 0 || o.dark) c.fillRect(gx, Y - chanH / 2, x1 - gx, chanH * (o.dark ? 1 : Math.min(1, F.opening / 0.6 + 0.2)));
  if (fwd > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const lx = x0 + (x1 - x0) * fwd;
    const gr = c.createLinearGradient(x0, 0, lx, 0);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.05));
    gr.addColorStop(1, withAlpha(env.mood.core, 0.55));
    c.fillStyle = gr;
    c.fillRect(x0, Y - chanH / 2, Math.min(lx, F.opening > 0 ? x1 : gx) - x0, chanH);
    c.restore();
  }
  // ---- the sluice gate (paper), its opening = max(0, g + b) on a ruler
  const open = F.opening * scale;
  c.fillStyle = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.25), env.mood.set, o.dark ? 0.8 : 0.1);
  c.fillRect(gx - 7 * s, Y - chanH / 2 - gateH - 10 * s - open, 14 * s, gateH + 10 * s + chanH);
  c.fillStyle = ink;
  c.fillRect(gx - 12 * s, Y - chanH / 2 - gateH - 30 * s, 24 * s, 12 * s);
  c.fillRect(gx - 12 * s, Y + chanH / 2 + 4 * s, 24 * s, 8 * s);
  // the ruler beside it (0 mark at the channel's floor; ticks every 0.05)
  if (!o.dark) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#1d140d', 0.4), 0.85);
    c.lineWidth = lw(c, 1.1);
    c.beginPath();
    const rx = gx + 20 * s;
    c.moveTo(rx, Y + chanH / 2);
    c.lineTo(rx, Y + chanH / 2 - gateH);
    for (let k = 0; k <= 12; k++) {
      const yy = Y + chanH / 2 - k * 0.05 * scale;
      c.moveTo(rx, yy);
      c.lineTo(rx + (k % 2 === 0 ? 8 : 4) * s, yy);
    }
    c.stroke();
    // the opening marker on the ruler
    c.fillStyle = copperOf(env, 0.7);
    c.beginPath();
    c.moveTo(rx - 2 * s, Y + chanH / 2 - open);
    c.lineTo(rx - 9 * s, Y + chanH / 2 - open - 4 * s);
    c.lineTo(rx - 9 * s, Y + chanH / 2 - open + 4 * s);
    c.closePath();
    c.fill();
  }
  // ---- the cam (Deep Dive I's hinge shape: flat, then a 45° climb) under the gate
  c.fillStyle = ink;
  c.beginPath();
  const camX = gx - 70 * s, camY = Y + chanH / 2 + 40 * s;
  c.moveTo(camX, camY);
  c.lineTo(camX + 50 * s, camY);
  c.lineTo(camX + 100 * s, camY - 50 * s);
  c.lineTo(camX + 104 * s, camY - 46 * s);
  c.lineTo(camX + 52 * s, camY + 6 * s);
  c.lineTo(camX, camY + 6 * s);
  c.closePath();
  c.fill();
  c.fillStyle = o.dark ? ink : copperOf(env, 0.4);
  c.beginPath();
  c.arc(camX + 50 * s, camY + 2 * s, 3.5 * s, 0, Math.PI * 2);
  c.fill();
  // ---- the tray at the right, filled to y
  const tx = x1 + 40 * s, ty = Y + 60 * s, tw = 70 * s, th = 100 * s;
  c.fillStyle = ink;
  c.fillRect(tx - tw / 2 - 5 * s, ty - th, 5 * s, th + 5 * s);
  c.fillRect(tx + tw / 2, ty - th, 5 * s, th + 5 * s);
  c.fillRect(tx - tw / 2 - 5 * s, ty, tw + 10 * s, 5 * s);
  if (!o.dark) {
    const lvl = (F.y / 0.6) * th * Math.min(1, fwd * 1.2);
    c.fillStyle = withAlpha(copperOf(env, 0.6), 0.85);
    c.fillRect(tx - tw / 2, ty - lvl, tw, lvl);
  }
  // ---- three brass dials (w, g, b) with hanging number tags
  const dials: [string, number, number][] = [
    ['w', o.w, B.dw],
    ['g', o.g, B.dg],
    ['b', o.b, B.db],
  ];
  dials.forEach(([name, v, slope], i) => {
    const dx = X - 170 * s + i * 95 * s, dy = Y + 140 * s;
    const r = 24 * s;
    c.fillStyle = o.dark ? ink : mixLab(mixLab('#a8823e', env.mood.halo, 0.35), ink, 0.2);
    c.beginPath();
    c.arc(dx, dy, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = Math.max(lw(c, 2), 3 * s);
    const a = -Math.PI / 2 + v * Math.PI * 1.2;
    c.beginPath();
    c.moveTo(dx, dy);
    c.lineTo(dx + Math.cos(a) * r * 0.8, dy + Math.sin(a) * r * 0.8);
    c.stroke();
    if (lab > 0) {
      textRole(c, 'subject', () => {
        c.globalAlpha = lab;
        c.fillStyle = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.2), env.mood.core, 0.15);
        c.fillRect(dx - 26 * s, dy + r + 10 * s, 52 * s, 30 * s);
        c.fillStyle = '#1d140d';
        c.font = `italic ${(15 * s).toFixed(1)}px ${FONT.text}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(`${name} ${fmt(v).replace('-', '−')}`, dx, dy + r + 25 * s);
        c.globalAlpha = 1;
        // the backward slope inked beside the dial
        const sl = clamp01(o.slopes ?? 0);
        if (sl > 0 && i < 2) {
          c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.1), sl);
          c.font = `600 ${(16 * s).toFixed(1)}px ${FONT.text}`;
          c.fillText(fmt(slope), dx, dy - r - 14 * s);
        }
        c.textAlign = 'left';
      });
    }
    // backward glow reaching the dial
    if (bwd > 0 && slope !== 0) {
      const reach = clamp01(bwd * 1.6 - 0.6 - i * 0.05);
      if (reach > 0) {
        const gr = c.createRadialGradient(dx, dy, 0, dx, dy, r * 2.2);
        gr.addColorStop(0, withAlpha(env.mood.core, 0.5 * reach));
        gr.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = gr;
        c.fillRect(dx - r * 2.2, dy - r * 2.2, r * 4.4, r * 4.4);
        c.restore();
      }
    }
  });
  // tray number
  if (lab > 0 && fwd >= 1) {
    textRole(c, 'subject', () => {
      c.fillStyle = withAlpha(env.mood.core, lab);
      c.font = `600 ${(16 * s).toFixed(1)}px ${FONT.text}`;
      c.textAlign = 'center';
      c.fillText(fmt(F.y), tx, ty + 26 * s);
      c.textAlign = 'left';
    });
  }
  // the backward lantern glow travelling right to left along the channel
  if (bwd > 0 && F.opening > 0) {
    const lx = x1 - (x1 - x0) * Math.min(1, bwd);
    const gr = c.createRadialGradient(lx, Y, 0, lx, Y, 60 * s);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.6));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = gr;
    c.fillRect(lx - 60 * s, Y - 60 * s, 120 * s, 120 * s);
    c.restore();
  }
}

export const VALVE = { forward, backward, fmt };
