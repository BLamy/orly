/**
 * handwired-explained — DEEP DIVE I's machine: TWO RAMPS AND A LEVER (ch01-s06, ch04-s01..s11, ch10-s02).
 *
 * The README rewrites (a > 4) ? 10 : 12 as above4 = max(0, a − 4) − max(0, a − 5), result = above4 × 10 +
 * (1 − above4) × 12, "For an integer a" (TE01). For real a, above4 = clamp(a − 4, 0, 1): flat to 4, a straight
 * ramp from 4 to 5, flat at 1 from 5; a = 4.5 gives 0.5 and 11, a = 4.25 gives 11.5 (TE03). Every number this set
 * draws is COMPUTED here with Math.fround (the runtime's FP32), never typed in.
 *
 *   import { rampBench, belts, lensTrain, RB } from '../sets/rampBench';
 *   f.layer('L4', (c, env) => rampBench(c, env, { x: 640, y: 560, a: s.get(scene.a), boards: 2, lever: true, tray: true }));
 *   f.layer('L3', (c, env) => belts(c, env, { x: 640, y: 470, phase: env.t * 0.5, bit: RB.above4(a) }));
 *   RB.ramp(a, 4), RB.above4(a), RB.result(a), RB.xOf(o, a)   // the maths and the number line's x for a value
 *
 * Parts: a cut-paper number line (the floor rule, ticks at the integers, no numerals unless numerals: true, a break
 * mark before far values like 100); board one hinged at 4, board two hinged at 5 (each flat, then a 45° climb), a
 * copper hinge pin at each corner; a brass marble on the line at a; a lever between the boards' readouts that can
 * only rest between 0 and 1 (it reads board one's height minus board two's); an output tray below with tiles.
 * The belts (both branches) run behind: two endless conveyors carrying 10 and 12 tiles through paper shutters that
 * SCALE what they pass (open = bit for the 10, 1 − bit for the 12; a 10 at a half comes through re-lettered 5).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textColor, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from './narratorHands';

const f32 = Math.fround;
const ramp = (a: number, hinge: number) => Math.max(0, f32(f32(a) - hinge));
const above4 = (a: number) => f32(ramp(a, 4) - ramp(a, 5));
const result = (a: number) => {
  const b = above4(a);
  return f32(f32(b * 10) + f32(f32(1 - b) * 12));
};
/** format a computed FP32 value the way the film prints it (no trailing zeros) */
const fmt = (v: number) => String(Number(v.toPrecision(7)));

export interface BenchOpts {
  /** the number line's point a = 4.5 sits at x; the floor rule's y */
  x: number;
  y: number;
  /** scale (1 = 110 px per unit) */
  s?: number;
  /** the marble's position (a); omit for no marble */
  a?: number;
  /** visible domain of the number line, default [2.6, 6.6] */
  domain?: [number, number];
  /** boards drawn: 0, 1 (ch04-s02: the first ramp only) or 2; default 2 */
  boards?: 0 | 1 | 2;
  /** 0..1: the boards rise out of the plate (ch01-s06 'ramps'); default 1 */
  rise?: number;
  /** the lever and its 0..1 gauge (reads above4(a)); default true */
  lever?: boolean;
  /** lever tremble 0..1 (ch01-s06 at 4.5) on twos: pass env.tq via tq */
  tremble?: number;
  tq?: number;
  /** the output tray; tiles: explicit labels (else the computed result when showResult) */
  tray?: boolean;
  tiles?: string[];
  showResult?: boolean;
  /** numerals under the integer ticks (ch04 only; ch01-s06 has none) */
  numerals?: boolean;
  /** a break mark and a far value (ch04-s02: 100) */
  far?: number;
  /** hatch the slope between the hinges in red (ch04-s03 'path') 0..1 */
  hatch?: number;
  /** the 'grid 1' tag tied on the line's wire (ch04: tag 6 re-tied) */
  gridTag?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}
function xOf(o: Pick<BenchOpts, 'x' | 's'>, a: number) {
  return o.x + (a - 4.5) * 110 * (o.s ?? 1);
}

/** a paper tile with a numeral (the 10s, 12s, their scaled copies and the fused 11) */
export function tile(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, label: string, o: { s?: number; flat?: number; glow?: number; subject?: boolean } = {}) {
  const s = o.s ?? 1;
  const flat = clamp01(o.flat ?? 0); // squeezed flat by a shut shutter
  const w = 34 * s, h = 26 * s * (1 - flat * 0.75);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x - w / 2 + 2 * s, y - h + 2 * s, w, h);
  c.fillStyle = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.3), env.mood.core, (o.glow ?? 0) * 0.5);
  c.fillRect(x - w / 2, y - h, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6 + 0.4 * (o.glow ?? 0));
  c.lineWidth = lw(c, 1.4);
  c.strokeRect(x - w / 2, y - h, w, h);
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    c.fillStyle = '#1d140d';
    c.font = `${(15 * s * (1 - flat * 0.6)).toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, x, y - h / 2 + 1);
    c.textAlign = 'left';
  });
}

/** the two-ramp rig on its floor rule (draw in L4) */
export function rampBench(c: CanvasRenderingContext2D, env: PaintEnv, o: BenchOpts) {
  const s = o.s ?? 1;
  const U = 110 * s;
  const [d0, d1] = o.domain ?? [2.6, 6.6];
  const x0 = xOf(o, d0), x1 = xOf(o, d1);
  const y = o.y;
  const ink = PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  // ---- the floor rule (cut paper) with integer ticks
  c.fillStyle = mixLab(mixLab('#d8c393', env.mood.halo, 0.3), env.mood.set, 0.15);
  c.fillRect(x0 - 10 * s, y, x1 - x0 + 20 * s, 10 * s);
  c.strokeStyle = withAlpha('#1d140d', 0.8);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  for (let k = Math.ceil(d0); k <= Math.floor(d1); k++) {
    const x = xOf(o, k);
    c.moveTo(x, y);
    c.lineTo(x, y + 8 * s);
  }
  c.stroke();
  if (o.numerals) {
    textRole(c, 'subject', () => {
      c.fillStyle = withAlpha(textColor(env.mood), 0.92);
      c.font = `${(16 * s).toFixed(1)}px ${FONT.typewriter}`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      for (let k = Math.ceil(d0); k <= Math.floor(d1); k++) c.fillText(String(k), xOf(o, k), y + 13 * s);
      if (o.far !== undefined) {
        const bx = x1 + 30 * s;
        c.strokeStyle = withAlpha('#1d140d', 0.8);
        c.beginPath();
        c.moveTo(bx - 6 * s, y + 10 * s);
        c.lineTo(bx - 2 * s, y - 2 * s);
        c.moveTo(bx + 2 * s, y + 10 * s);
        c.lineTo(bx + 6 * s, y - 2 * s);
        c.stroke();
        c.fillText(String(o.far), bx + 34 * s, y + 13 * s);
      }
      c.textAlign = 'left';
    });
  }
  // ---- boards (black hinged boards, flat then a 45° climb), rising out of the plate
  const rise = clamp01(o.rise ?? 1);
  const nb = o.boards ?? 2;
  const boardY = (k: number) => y - 6 * s - k * (34 * s); // board k stands a little higher behind
  for (let k = 0; k < nb; k++) {
    const hinge = 4 + k;
    const by = boardY(k) + (1 - rise) * 120 * s;
    const top = (a: number) => by - ramp(a, hinge) * U;
    c.fillStyle = k === 0 ? ink : mixLab(ink, env.mood.set, 0.25);
    c.beginPath();
    c.moveTo(x0, by + 6 * s);
    c.lineTo(x0, by - 4 * s);
    c.lineTo(xOf(o, hinge), by - 4 * s);
    c.lineTo(x1, top(d1) - 4 * s);
    c.lineTo(x1, top(d1) + 9 * s);
    c.lineTo(xOf(o, hinge) + 5 * s, by + 6 * s);
    c.closePath();
    c.fill();
    c.strokeStyle = rimC;
    c.lineWidth = lw(c, 2.4);
    c.beginPath();
    c.moveTo(x0, by - 4 * s);
    c.lineTo(xOf(o, hinge), by - 4 * s);
    c.lineTo(x1, top(d1) - 4 * s);
    c.stroke();
    // the copper hinge pin at the corner
    c.fillStyle = copperOf(env, 0.5);
    c.beginPath();
    c.arc(xOf(o, hinge), by - 1 * s, 4.2 * s, 0, Math.PI * 2);
    c.fill();
    // red hatch on the slope between the hinges (board one), ch04-s03
    if (k === 0 && (o.hatch ?? 0) > 0) {
      c.strokeStyle = withAlpha('#a4402e', 0.75 * clamp01(o.hatch ?? 0));
      c.lineWidth = lw(c, 1.3);
      c.beginPath();
      for (let t = 0; t <= 1; t += 0.1) {
        const a = 4 + t;
        c.moveTo(xOf(o, a), top(a) - 4 * s);
        c.lineTo(xOf(o, a) - 7 * s, top(a) - 11 * s);
      }
      c.stroke();
    }
  }
  // ---- the marble on the floor rule at a
  if (o.a !== undefined) {
    const mx = xOf(o, o.a), r = 8 * s;
    const gr = c.createRadialGradient(mx - r * 0.35, y - r - r * 0.4, r * 0.1, mx, y - r, r);
    gr.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.25));
    gr.addColorStop(0.45, mixLab('#b8893e', env.mood.halo, 0.3));
    gr.addColorStop(1, mixLab('#5b3f18', ink, 0.4));
    c.fillStyle = gr;
    c.beginPath();
    c.arc(mx, y - r, r, 0, Math.PI * 2);
    c.fill();
    // reading lines from the marble up to each board's top (faint ink)
    if (nb > 0) {
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.35);
      c.setLineDash([lw(c, 3), lw(c, 4)]);
      c.lineWidth = lw(c, 1);
      c.beginPath();
      c.moveTo(mx, y - 2 * r);
      c.lineTo(mx, boardY(nb - 1) - ramp(o.a, 3 + nb) * U - 3 * s);
      c.stroke();
      c.setLineDash([]);
    }
  }
  // ---- the lever: reads board one minus board two, rests only between 0 and 1
  const bit = o.a !== undefined ? above4(o.a) : 0;
  const LX = x1 + 70 * s, LY = y - 80 * s;
  if (o.lever !== false) {
    const tr = (o.tremble ?? 0) * Math.sin((o.tq ?? 0) * 12 * 2.1) * 0.02;
    const ang = -Math.PI * 0.75 + (bit + tr) * Math.PI * 0.5; // 0 → pointing up-left, 1 → up-right
    // gauge arc with ticks at 0 and 1 (no numerals)
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
    c.lineWidth = lw(c, 1.6);
    c.beginPath();
    c.arc(LX, LY, 52 * s, -Math.PI * 0.75, -Math.PI * 0.25);
    for (const t of [0, 1]) {
      const a = -Math.PI * 0.75 + t * Math.PI * 0.5;
      c.moveTo(LX + Math.cos(a) * 46 * s, LY + Math.sin(a) * 46 * s);
      c.lineTo(LX + Math.cos(a) * 58 * s, LY + Math.sin(a) * 58 * s);
    }
    c.stroke();
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(LX + Math.cos(ang + Math.PI / 2) * 3.5 * s, LY + Math.sin(ang + Math.PI / 2) * 3.5 * s);
    c.lineTo(LX + Math.cos(ang) * 56 * s, LY + Math.sin(ang) * 56 * s);
    c.lineTo(LX + Math.cos(ang - Math.PI / 2) * 3.5 * s, LY + Math.sin(ang - Math.PI / 2) * 3.5 * s);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(LX, LY, 8 * s, 0, Math.PI * 2);
    c.fill();
    // the lever's stand
    c.fillRect(LX - 4 * s, LY, 8 * s, y - LY);
    c.fillStyle = copperOf(env, 0.3);
    c.beginPath();
    c.arc(LX, LY, 3 * s, 0, Math.PI * 2);
    c.fill();
  }
  // ---- the output tray with its tiles
  if (o.tray) {
    const TX = LX + 70 * s, TY = y;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(TX - 46 * s, TY - 30 * s);
    c.lineTo(TX - 40 * s, TY);
    c.lineTo(TX + 40 * s, TY);
    c.lineTo(TX + 46 * s, TY - 30 * s);
    c.lineTo(TX + 40 * s, TY - 30 * s);
    c.lineTo(TX + 36 * s, TY - 5 * s);
    c.lineTo(TX - 36 * s, TY - 5 * s);
    c.lineTo(TX - 40 * s, TY - 30 * s);
    c.closePath();
    c.fill();
    c.strokeStyle = rimC;
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(TX - 46 * s, TY - 30 * s);
    c.lineTo(TX - 40 * s, TY - 30 * s);
    c.moveTo(TX + 40 * s, TY - 30 * s);
    c.lineTo(TX + 46 * s, TY - 30 * s);
    c.stroke();
    const tiles = o.tiles ?? (o.showResult && o.a !== undefined ? [fmt(result(o.a))] : []);
    tiles.forEach((t, i) => tile(c, env, TX + (i - (tiles.length - 1) / 2) * 38 * s, TY - 6 * s, t, { s, subject: true }));
  }
}

export interface BeltOpts {
  /** the shutters' x (the belts run left → right into them, then on to the tray at the right) */
  x: number;
  y: number;
  s?: number;
  /** belt travel (any units: tiles move phase × 60 px); pass env.t × speed */
  phase: number;
  /** the select bit (0..1): the 10 shutter is open `bit`, the 12 shutter `1 − bit` */
  bit: number;
  /** dim: low-contrast shapes, tiles unreadable, no shutters lit, no rods (ch01-s06) */
  dim?: boolean;
  /** belt length (stage px), default 520 */
  len?: number;
}
/** both branches: two endless conveyors carrying 10 and 12 tiles through scaling shutters (draw in L3 or L4) */
export function belts(c: CanvasRenderingContext2D, env: PaintEnv, o: BeltOpts) {
  const s = o.s ?? 1;
  const L = (o.len ?? 520) * s;
  const ink = o.dim ? env.fill('set') : env.fill('ink');
  const bit = f32(clamp01(o.bit));
  const rows: { v: number; open: number; dy: number }[] = [
    { v: 10, open: bit, dy: -34 * s },
    { v: 12, open: f32(1 - bit), dy: 34 * s },
  ];
  rows.forEach((r, ri) => {
    const by = o.y + r.dy;
    const bx0 = o.x - L * 0.7, bx1 = o.x + L * 0.3;
    // the belt and its rollers
    c.fillStyle = ink;
    c.beginPath();
    c.roundRect(bx0, by, bx1 - bx0, 9 * s, 4.5 * s);
    c.fill();
    for (const rx of [bx0 + 4.5 * s, bx1 - 4.5 * s]) {
      c.beginPath();
      c.arc(rx, by + 4.5 * s, 7 * s, 0, Math.PI * 2);
      c.fill();
    }
    // tiles riding the belt (a new one every 60 px), scaled after the shutter
    const pitch = 60 * s;
    const off = ((o.phase * 60 * s) % pitch + pitch) % pitch;
    for (let x = bx0 + off; x < bx1 - 10 * s; x += pitch) {
      const past = x > o.x;
      const scaled = past ? f32(r.v * r.open) : r.v;
      if (o.dim) {
        c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.haze, 0.4), 0.8);
        c.fillRect(x - 15 * s, by - 22 * s, 30 * s, 22 * s);
      } else tile(c, env, x, by, fmt(scaled), { s: s * 0.85, flat: past ? 1 - r.open : 0 });
    }
    // the paper shutter: a frame with a sliding panel; open fraction = what it passes
    if (!o.dim) {
      const sx = o.x, sh = 44 * s;
      c.fillStyle = ink;
      c.fillRect(sx - 4 * s, by - sh, 8 * s, sh + 9 * s);
      c.fillStyle = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.25), env.mood.set, 0.35);
      c.fillRect(sx - 3 * s, by - sh, 6 * s, sh * (1 - r.open));
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
      c.lineWidth = lw(c, 1.6);
      c.strokeRect(sx - 4 * s, by - sh, 8 * s, sh + 9 * s);
    }
    void ri;
  });
}

/**
 * The lens train (ch04-s08..s11): without a grid, a > 4 is a sign cascade of 16 operations in 15 layers: d = a − 4,
 * six clamp stages scaling by 2^14 then 2^24 five times, the final ReGLU relu(1 − 2^15 · stage), then the bit (TE08).
 * Drawn as a row of 16 operation marks with the magnifier lenses between; `fade` thins 14 of the 16 (ch04-s11).
 */
export function lensTrain(c: CanvasRenderingContext2D, env: PaintEnv, o: { x: number; y: number; w: number; s?: number; lit?: number; fade?: number; labels?: boolean }) {
  const s = o.s ?? 1;
  const n = 16;
  const lit = o.lit ?? 1;
  const fade = clamp01(o.fade ?? 0);
  const step = o.w / (n - 1);
  const scales = ['a − 4', '2¹⁴', '2²⁴', '2²⁴', '2²⁴', '2²⁴', '2²⁴', '2¹⁵'];
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(o.x, o.y);
  c.lineTo(o.x + o.w, o.y);
  c.stroke();
  for (let i = 0; i < n; i++) {
    const keep = i === 0 || i === n - 1;
    const a = keep ? 1 : 1 - clamp01(fade * (n - 2) - (i - 1));
    if (a <= 0) continue;
    const x = o.x + i * step;
    const on = clamp01(lit * n - i);
    c.globalAlpha = a;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.arc(x, o.y, 7 * s, 0, Math.PI * 2);
    c.fill();
    if (on > 0) {
      c.fillStyle = withAlpha(copperOf(env, 0.8), on);
      c.beginPath();
      c.arc(x, o.y, 3.2 * s, 0, Math.PI * 2);
      c.fill();
    }
    // a lens between the clamp stages (2..7)
    if (i >= 1 && i <= 7) {
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75 * a);
      c.lineWidth = lw(c, 1.6);
      c.beginPath();
      c.ellipse(x + step / 2, o.y, 5 * s, 15 * s, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  if (o.labels) {
    textRole(c, 'texture', () => {
      c.fillStyle = withAlpha(env.mood.core, 0.85 * (1 - fade));
      c.font = `italic ${(12 * s).toFixed(1)}px ${FONT.text}`;
      c.textAlign = 'center';
      scales.forEach((t, i) => c.fillText(t, o.x + (i + 0.5) * step, o.y - 22 * s));
      c.textAlign = 'left';
    });
  }
}

export const RB = { ramp, above4, result, xOf, fmt, f32 };
