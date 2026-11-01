/**
 * durable-objects-unbound — ch04's STUDY pieces (author:ch04-ch05; used by ch04-s01, ch04-s02, ch04-s03).
 *
 * Wraps the shared history desks (sets/historyDesk.ts, read-only) with the rooms around them and the small props
 * the 2026 chapter needs. Rest-screen px (CAMERA3_HOME), drawn in the named layer's world space.
 *
 *   studyWall(c, env, o)        L2: a plain study wall with a tall mullioned window HOLE (evenodd) and its sill
 *   farTown(c, env, o)          L1: the harbour town small through a window: night sky, sea, the three houses, the
 *                               Well and its Plate; o.lamps 0..1 (three window lamps), o.cyan 0..1 (a glint deep in
 *                               the Well's shaft: the cutaway remembered — the only cyan in frame)
 *   FAR                         far-town anchor points (L1): wellMouth, houses
 *   brassBox(c, env, o)         the single binary: a small brass-bound box on the desk (x, y = base centre)
 *   braidNotebook(c, env, o)    a notebook propped against the box, a three-strand braided cord along its spine
 *   bellJar(c, env, o)          a glass bell jar over a small paper lantern (one room, one instance)
 *   dottedBar / dottedArrow     pencil dots for announced plans (dotted = an intention, never solid ink)
 *   pencil(c, env, o)           a self-moving pencil (a puppet prop: no hand)
 *   calendarStrip(c, env, o)    a propped paper calendar strip with twelve faint month ticks and a corner door
 *   dateStamp(c, mood, o)       the film's mono date stamp, typed on, on a soft plate (≥ 22 px cap @1080p)
 *   rope(c, pts, col, lw, u)    a hanging rope through points (u 0..1 drawn)
 */
import { FONT, drawTracked, legibleSize, measureTracked, mixLab, softPlate, textColor, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv, Palette } from '../../../film';
import { BRASS_HI, PAPER, SEA_CYAN, brass, clamp01, glowDot, lerp, paper, sm, tone, type C2 } from './common';
import { roomLantern } from './roomLantern';
import { plate as drawPlate, wellBase } from './wellAndPlate';

// ------------------------------------------------------------------ the wall with a window
export interface WallOpts {
  /** the wall's extent */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** the window hole */
  win: { x: number; y: number; w: number; h: number };
  /** mullion count (vertical bars) */
  bars?: number;
  /** transom height fraction (0 = none) */
  transom?: number;
  /** the floor line: skirting above it, a dark floor below */
  floorY?: number;
  /** an optional second, small picture frame on the wall */
  frame?: { x: number; y: number; w: number; h: number };
}
export function studyWall(c: C2, env: PaintEnv, o: WallOpts): void {
  const set = mixLab(env.fill('set'), env.fill('ink'), 0.55);
  const p = new Path2D();
  p.rect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0);
  const w = o.win;
  p.rect(w.x, w.y, w.w, w.h);
  c.fillStyle = set;
  c.fill(p, 'evenodd');
  // a faint plaster gradient toward the lamp side
  const g = c.createLinearGradient(o.x0, 0, o.x1, 0);
  g.addColorStop(0, withAlpha(env.mood.fg, 0.25));
  g.addColorStop(0.5, withAlpha(env.mood.fg, 0));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.2));
  c.save();
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  c.restore();
  // mullions and transom (in the hole): cut-paper bars
  c.fillStyle = set;
  const bars = o.bars ?? 2;
  for (let i = 1; i <= bars; i++) c.fillRect(w.x + (w.w * i) / (bars + 1) - 2.2, w.y, 4.4, w.h);
  if ((o.transom ?? 0) > 0) c.fillRect(w.x, w.y + w.h * (o.transom ?? 0) - 2, w.w, 4);
  // frame lip and sill
  c.fillRect(w.x - 8, w.y - 8, w.w + 16, 8);
  c.fillRect(w.x - 14, w.y + w.h, w.w + 28, 9);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(w.x - 14, w.y + w.h);
  c.lineTo(w.x + w.w + 14, w.y + w.h);
  c.stroke();
  // skirting and floor
  const fy = o.floorY ?? o.y1;
  c.fillStyle = mixLab(set, env.fill('ink'), 0.4);
  c.fillRect(o.x0, fy - 34, o.x1 - o.x0, 34);
  if (fy < o.y1) {
    const fg = c.createLinearGradient(0, fy, 0, o.y1);
    fg.addColorStop(0, mixLab(set, env.fill('ink'), 0.55));
    fg.addColorStop(1, env.fill('ink'));
    c.fillStyle = fg;
    c.fillRect(o.x0, fy, o.x1 - o.x0, o.y1 - fy);
  }
  if (o.frame) {
    const f = o.frame;
    c.fillStyle = mixLab(set, env.fill('ink'), 0.5);
    c.fillRect(f.x, f.y, f.w, f.h);
    c.fillStyle = mixLab(set, env.mood.haze, 0.15);
    c.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 10);
  }
}

// ------------------------------------------------------------------ the far town (L1, small)
/** anchor points of the far town, L1 world */
export const FAR = {
  horizon: 372,
  well: { x: 410, y: 446, s: 0.3 },
  houses: [
    { id: 'A', x: 344, base: 430, w: 38, eave: 384, ridge: 352, win: { x: 344, y: 404 } },
    { id: 'B', x: 486, base: 430, w: 58, eave: 398, ridge: 380, win: { x: 478, y: 414 } },
    { id: 'C', x: 562, base: 410, w: 46, eave: 376, ridge: 352, win: { x: 570, y: 392 } },
  ],
};
export function wellMouth(): { x: number; y: number } {
  return { x: FAR.well.x, y: FAR.well.y - 50 * FAR.well.s };
}
export interface FarTownOpts {
  /** the extent to cover (L1 world) */
  r: { x: number; y: number; w: number; h: number };
  lamps?: number;
  cyan?: number;
  /** the town's moon (0..1) */
  moon?: number;
}
/** static part: bake it (sky, sea, hill, houses, Well) */
export function farTownStatic(c: C2, env: PaintEnv, o: FarTownOpts): void {
  const r = o.r;
  // night sky through the window: cool, deep, with the warm study light reflected faintly at the bottom
  const night = mixLab('#1d2a3a', env.mood.fg, 0.25);
  const g = c.createLinearGradient(0, r.y, 0, FAR.horizon + 4);
  g.addColorStop(0, mixLab(night, '#000000', 0.25));
  g.addColorStop(0.7, night);
  g.addColorStop(1, mixLab(night, '#5a6c80', 0.35));
  c.fillStyle = g;
  c.fillRect(r.x, r.y, r.w, FAR.horizon - r.y + 4);
  // a few stars
  let seed = 41;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40; i++) {
    const x = r.x + rnd() * r.w, y = r.y + rnd() * (FAR.horizon - r.y - 30);
    c.fillStyle = withAlpha('#dfe8f2', 0.25 + 0.35 * rnd());
    c.fillRect(x, y, 1.2, 1.2);
  }
  // moon, low-left
  glowDot(c, 318, 330, 16, '#d8e2ea', 0.5);
  c.fillStyle = withAlpha('#e4ecf0', 0.85);
  c.beginPath();
  c.arc(318, 330, 5, 0, Math.PI * 2);
  c.fill();
  // sea
  const sea = c.createLinearGradient(0, FAR.horizon, 0, r.y + r.h);
  sea.addColorStop(0, mixLab('#2a3a4c', env.mood.fg, 0.3));
  sea.addColorStop(1, mixLab('#0c1218', env.mood.fg, 0.3));
  c.fillStyle = sea;
  c.fillRect(r.x, FAR.horizon, r.w, r.y + r.h - FAR.horizon);
  // the hill: low at the left, rising to the right
  const hill = mixLab('#141a22', env.mood.fg, 0.25);
  c.fillStyle = hill;
  c.beginPath();
  c.moveTo(r.x, r.y + r.h);
  c.lineTo(r.x, 446);
  c.lineTo(300, 436);
  c.quadraticCurveTo(470, 428, 530, 410);
  c.quadraticCurveTo(620, 350, r.x + r.w, 326);
  c.lineTo(r.x + r.w, r.y + r.h);
  c.closePath();
  c.fill();
  // the three houses (A tall gable, B wider with a chimney, C on the upper terrace with a dormer)
  const houseCol = mixLab(hill, '#000000', 0.25);
  for (const h of FAR.houses) {
    c.fillStyle = houseCol;
    c.beginPath();
    c.moveTo(h.x - h.w / 2, h.base + 4);
    c.lineTo(h.x - h.w / 2, h.eave);
    c.lineTo(h.x, h.ridge);
    if (h.id === 'B') {
      c.lineTo(h.x + 13, h.ridge + 4);
      c.lineTo(h.x + 13, h.ridge - 9);
      c.lineTo(h.x + 19, h.ridge - 9);
      c.lineTo(h.x + 19, h.ridge + 6);
    }
    c.lineTo(h.x + h.w / 2, h.eave);
    c.lineTo(h.x + h.w / 2, h.base + 4);
    c.closePath();
    c.fill();
    if (h.id === 'C') c.fillRect(h.x - 14, h.ridge + 5, 10, 10);
    // window (dark until lit)
    c.fillStyle = mixLab(houseCol, '#2a3440', 0.4);
    c.fillRect(h.win.x - 4.5, h.win.y - 5, 9, 10);
    // roof edge catches the moon
    c.strokeStyle = withAlpha('#9fb0c0', 0.35);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(h.x - h.w / 2, h.eave);
    c.lineTo(h.x, h.ridge);
    c.stroke();
  }
  // the square and the Well with its Plate on its frame, tiny
  const ws = { x: FAR.well.x, y: FAR.well.y, s: FAR.well.s };
  wellBase(c, { ...env, fill: (k) => (k === 'rim' ? '#9fb0c0' : houseCol) } as PaintEnv, ws);
  drawPlate(c, env, { ...ws, plate: { house: '', epoch: '', from: '', crown: 0.5, dim: 0.7 } });
}
export function farTownLive(c: C2, env: PaintEnv, o: FarTownOpts): void {
  const t = env.t;
  // far-shore lamps across the sea (left), always faintly on
  for (let i = 0; i < 5; i++) {
    const x = 200 + i * 34, y = FAR.horizon - 2 + (i % 2);
    glowDot(c, x, y, 4, '#f0c890', 0.35 + 0.1 * Math.sin(t * 1.1 + i));
  }
  // the three house windows
  const L = clamp01(o.lamps ?? 0.25);
  FAR.houses.forEach((h, i) => {
    const k = clamp01(L * 1.2 - i * 0.1);
    c.fillStyle = withAlpha(tone(env, '#ffc56e', 0.05), 0.25 + 0.75 * k);
    c.fillRect(h.win.x - 4.5, h.win.y - 5, 9, 10);
    glowDot(c, h.win.x, h.win.y, 12 + 10 * k, tone(env, '#ffb860', 0.05), 0.15 + 0.6 * k);
  });
  // a cold glint deep in the Well's shaft: the cutaway remembered (serverCyan, the only cyan in frame)
  const cy = clamp01(o.cyan ?? 0);
  if (cy > 0.01) {
    const m = wellMouth();
    glowDot(c, m.x, m.y + 1, 14, SEA_CYAN, 0.95 * cy);
    c.fillStyle = withAlpha(SEA_CYAN, 0.85 * cy);
    c.fillRect(m.x - 5, m.y - 0.5, 10, 2);
  }
}

// ------------------------------------------------------------------ desk props
/** the single binary: a small brass-bound box (x, y = base centre on the desk top), s = 1 is 38 x 24 px */
export function brassBox(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; alpha?: number; glint?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.scale(s, s);
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(-19, -24, 38, 24);
  // brass binding: corners, a band and a hasp
  c.fillStyle = brass(env, 0.35 + 0.5 * (o.glint ?? 0));
  for (const [x, y] of [[-19, -24], [13, -24], [-19, -6], [13, -6]]) c.fillRect(x, y, 6, 6);
  c.fillRect(-19, -15, 38, 2.4);
  c.fillRect(-2.5, -17, 5, 7);
  c.strokeStyle = withAlpha(brass(env, 0.8), 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-19, -24);
  c.lineTo(19, -24);
  c.stroke();
  c.restore();
}
/** a notebook propped against something (x, y = foot of the spine on the desk), its spine carrying a braided cord */
export function braidNotebook(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; glint?: number; braid?: number; alpha?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(-0.22);
  c.scale(s, s);
  const W = 26, H = 36;
  // cover (dark cloth) with the page block's edge showing at the right
  c.fillStyle = mixLab(env.fill('ink'), '#3a2a1c', 0.35);
  c.fillRect(0, -H, W, H);
  c.fillStyle = paper(env, 0.35);
  c.fillRect(W - 2, -H + 2, 2, H - 4);
  // the spine: three strands braided along the left edge (no lettering)
  const b = clamp01(o.braid ?? 1);
  const cols = [tone(env, '#c9a15a', 0.15), tone(env, '#9aa8b4', 0.2), tone(env, '#c06a4a', 0.2)];
  c.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) {
    c.strokeStyle = cols[k];
    c.beginPath();
    const N = 26;
    for (let i = 0; i <= Math.round(N * b); i++) {
      const u = i / N;
      const y = -2 - u * (H - 4);
      const x = 3.5 + 2.2 * Math.sin(u * Math.PI * 7 + (k * Math.PI * 2) / 3);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
  const g = o.glint ?? 0;
  if (g > 0.01) glowDot(c, o.x + 2 * s, o.y - 20 * s, 14 * s, tone(env, BRASS_HI, 0.1), 0.6 * g * a);
}
/** a glass bell jar over a small paper lantern (x, y = the jar's foot centre on the desk) */
export function bellJar(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; lit?: number; alpha?: number; tq?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  roomLantern(c, env, { x: o.x, y: o.y - 3 * s, s: 0.42 * s, lit: o.lit ?? 0.8, members: 3, tq: o.tq, hook: false, alpha: a });
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.scale(s, s);
  // the jar: a dome of glass with a knob, a wooden base
  const glass = new Path2D();
  glass.moveTo(-22, 0);
  glass.lineTo(-22, -34);
  glass.bezierCurveTo(-22, -54, 22, -54, 22, -34);
  glass.lineTo(22, 0);
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.55);
  c.lineWidth = 1.4;
  c.stroke(glass);
  c.fillStyle = withAlpha(env.mood.core, 0.07);
  c.fill(glass);
  // highlights on the glass (the lamp side)
  c.strokeStyle = withAlpha('#ffffff', 0.35);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(15, -8);
  c.lineTo(15, -32);
  c.quadraticCurveTo(14, -42, 8, -46);
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(0, -50, 3, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-26, -2, 52, 4);
  c.restore();
}

// ------------------------------------------------------------------ plans in pencil
/** a dotted pencil bar from (x0, y) to (x1, y), u 0..1 drawn, `seg` segments separated by ticks */
export function dottedBar(c: C2, col: string, x0: number, x1: number, y: number, u: number, o: { segs?: number; r?: number; gap?: number; capAt?: number } = {}): void {
  if (u <= 0) return;
  const r = o.r ?? 1.5;
  const gap = o.gap ?? 5;
  const xe = lerp(x0, x1, clamp01(u));
  const segs = o.segs ?? 0;
  const segW = segs > 0 ? (x1 - x0) / segs : 0;
  c.save();
  c.fillStyle = col;
  for (let x = x0; x <= xe + 0.01; x += gap) {
    // segments read as groups of dots with a small gap between them (no ticks)
    if (segs > 0) {
      const m = (x - x0) % segW;
      if (m > segW - gap * 0.9 && x < x1 - gap) continue;
    }
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** a dotted arrow from (x0, y) running right by `len`, u 0..1 drawn */
export function dottedArrow(c: C2, col: string, x0: number, y: number, len: number, u: number, r = 1.4): void {
  if (u <= 0) return;
  dottedBar(c, col, x0, x0 + len, y, u, { r, gap: 5 });
  if (u < 0.92) return;
  const xe = x0 + len;
  c.save();
  c.fillStyle = col;
  for (let k = 1; k <= 3; k++) {
    for (const sy of [-1, 1]) {
      c.beginPath();
      c.arc(xe - k * 4, y + sy * k * 3.6, r * 0.9, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}
/** a self-moving pencil (no hand): tip at (x, y), lifted by `lift` px, tilt rad */
export function pencil(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; lift?: number; tilt?: number; alpha?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y - (o.lift ?? 0));
  c.rotate(-0.95 + (o.tilt ?? 0));
  c.scale(s, s);
  // tip at the origin, the body running back along +x
  c.fillStyle = mixLab(env.fill('ink'), '#000', 0.2);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(9, -2.6);
  c.lineTo(9, 2.6);
  c.closePath();
  c.fill();
  // (path fills, not fillRect: a rotated pencil is not a paper card)
  const box = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.rect(x, y, w, h);
    c.fill();
  };
  box(9, -2.6, 54, 5.2, tone(env, '#c79a4e', 0.2));
  box(63, -2.8, 5, 5.6, brass(env, 0.4));
  box(68, -2.6, 5, 5.2, tone(env, '#b8705a', 0.25));
  c.strokeStyle = withAlpha(env.fill('ink'), 0.6);
  c.lineWidth = 0.6;
  c.strokeRect(9, -2.6, 54, 5.2);
  c.restore();
}
export interface CalendarOpts {
  /** the strip's top-left (it is propped on a small easel on the desk) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0..1 the paper door at the lower-right corner swung open */
  door?: number;
  alpha?: number;
}
/** a propped paper calendar strip: twelve faint month columns, a corner door (static parts drawn here) */
export function calendarStrip(c: C2, env: PaintEnv, o: CalendarOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  c.save();
  c.globalAlpha *= a;
  // easel legs behind
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(o.x + o.w * 0.2, o.y + o.h);
  c.lineTo(o.x + o.w * 0.25, o.y + o.h + 16);
  c.moveTo(o.x + o.w * 0.8, o.y + o.h);
  c.lineTo(o.x + o.w * 0.75, o.y + o.h + 16);
  c.stroke();
  // paper, slightly torn top (a step under the lamp's brightest, so it never outshines the practical)
  c.fillStyle = mixLab(paper(env, 0.12), env.mood.halo, 0.12);
  c.beginPath();
  c.moveTo(o.x, o.y + 2);
  const n = 18;
  for (let i = 1; i <= n; i++) c.lineTo(o.x + (o.w * i) / n, o.y + (i % 2 ? -0.8 : 1.4));
  c.lineTo(o.x + o.w, o.y + o.h);
  c.lineTo(o.x, o.y + o.h);
  c.closePath();
  c.fill();
  // twelve faint month columns and a ruled base line
  const col = withAlpha(mixLab('#3a2c1e', env.mood.fg, 0.2), 0.22);
  c.strokeStyle = col;
  c.lineWidth = 0.7;
  for (let i = 1; i < 12; i++) {
    const x = o.x + 12 + ((o.w - 24) * i) / 12;
    c.beginPath();
    c.moveTo(x, o.y + 10);
    c.lineTo(x, o.y + o.h - 10);
    c.stroke();
  }
  // the corner door (a cut flap that swings open on its left hinge)
  const d = clamp01(o.door ?? 0);
  const dw = 22, dh = 18;
  const dx = o.x + o.w - dw - 6, dy = o.y + o.h - dh - 6;
  c.fillStyle = mixLab(paper(env, 0.1), env.mood.fg, 0.55);
  c.fillRect(dx, dy, dw, dh);
  c.save();
  c.translate(dx, dy);
  c.scale(Math.max(0.08, Math.cos(d * Math.PI * 0.42)), 1);
  c.fillStyle = paper(env, 0.08 + 0.15 * d);
  c.fillRect(0, 0, dw, dh);
  c.strokeStyle = withAlpha(mixLab('#3a2c1e', env.mood.fg, 0.2), 0.5);
  c.strokeRect(0, 0, dw, dh);
  c.restore();
  if (d > 0.05) glowDot(c, dx + dw / 2, dy + dh / 2, 16, tone(env, '#ffd890', 0.1), 0.5 * d);
  c.restore();
}

// ------------------------------------------------------------------ type: the date stamp
export interface DateStampOpts {
  id: string;
  text: string;
  /** anchor (stage px, screen-locked) */
  x: number;
  y: number;
  align?: 'left' | 'right';
  /** 0..1 overall */
  alpha: number;
  /** 0..1 how many characters are typed (type-on) */
  typed?: number;
}
/** the film's modern (mono) date stamp: tracked IBM Plex Mono capitals with a thin index rule, on a soft plate */
export function dateStamp(c: C2, mood: Palette, o: DateStampOpts): void {
  if (o.alpha <= 0.002) return;
  textRole(c, 'subject', () => {
    c.save();
    const text = o.text.toUpperCase();
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    const font = `500 ${size}px ${FONT.mono}`;
    const w = measureTracked(c, text, { font, size, tracking: 0.08 });
    const right = o.align === 'right';
    const x0 = right ? o.x - w : o.x;
    const parch = mood.id.startsWith('parchment');
    if (!parch) {
      c.globalAlpha = o.alpha;
      softPlate(c, x0 + w / 2, o.y - size * 0.4, w + 150, size + 64, mood.ink, 0.5);
    }
    const shown = Math.max(0, Math.min(text.length, Math.ceil(text.length * clamp01(o.typed ?? 1))));
    c.globalAlpha = o.alpha;
    c.fillStyle = parch ? mood.ink : textColor(mood);
    drawTracked(c, text.slice(0, shown), x0, o.y, { font, size, tracking: 0.08, align: 'left' });
    c.globalAlpha = o.alpha * 0.6;
    c.fillRect(x0, o.y - size - 10, w * clamp01((o.typed ?? 1) * 1.2), 0.8);
    c.fillRect(x0, o.y - size - 14, 0.8, 8);
    textProbe(c, o.id, x0, o.y - size, w, size * 1.3, o.alpha * (shown > 0 ? 1 : 0));
    c.restore();
  });
}

// ------------------------------------------------------------------ a rope through points
export function rope(c: C2, pts: { x: number; y: number }[], col: string, lw: number, u = 1): void {
  if (u <= 0 || pts.length < 2) return;
  // total length, then draw the first u of it
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const target = L[L.length - 1] * clamp01(u);
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= target) c.lineTo(pts[i].x, pts[i].y);
    else {
      const k = (target - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      c.lineTo(lerp(pts[i - 1].x, pts[i].x, k), lerp(pts[i - 1].y, pts[i].y, k));
      break;
    }
  }
  c.stroke();
  c.restore();
}
/** sample a quadratic sag between a and b into points (for rope()) */
export function sagPts(a: { x: number; y: number }, b: { x: number; y: number }, sag: number, n = 16): { x: number; y: number }[] {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    out.push({ x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y });
  }
  return out;
}
export { PAPER, sm };

// ------------------------------------------------------------------ the two-desk stage (ch04-s02, ch04-s03)
/**
 * Two flats on one stage: Kenton Varda's room at the LEFT (desk at x 330, lamp on his right, a small window in his
 * wall), Ryan Dahl's at the RIGHT (desk at x 1010, lamp on his left); between the flats (x 600..820) the dark
 * harbour hill and the far town at L1. The two ropes hang from the lamp arms (twoRopes).
 */
export const STAGE = {
  kenton: { who: 'kenton' as const, x: 330, y: 600, s: 1.05 },
  ryan: { who: 'ryan' as const, x: 1010, y: 600, s: 1.05 },
  gap: { x0: 600, x1: 820 },
  kWin: { x: 30, y: 214, w: 120, h: 104 },
  /** far-town offset (L1) so the Well sits in the gap */
  farDx: 262,
};
export interface StageHooks {
  L4?: (c: C2, env: PaintEnv) => void;
  L1?: (c: C2, env: PaintEnv) => void;
}
type FrameLike = {
  cached: (key: string, w: number, h: number, draw: (c: C2) => void, opts?: { blur?: number }) => (c: C2, x: number, y: number) => void;
  layer: (spec: 'L1' | 'L2' | 'L3' | 'L4', draw: (c: C2, env: PaintEnv) => void) => void;
};
/** L1 + L2 + L3 of the two-desk stage (static, cached by mood); the shot paints L4 and the near planes */
export function twoDeskBack(f: FrameLike, o: { lamps?: number; key: string }, hooks: StageHooks = {}): void {
  const R = { x: 120 + STAGE.farDx - 200, y: -140, w: 1000, h: 1000 };
  f.layer('L1', (c, env) => {
    f.cached(`dou/ch04-stage/far/${env.mood.id}`, R.w, R.h, (cc) => {
      cc.translate(-R.x + STAGE.farDx, -R.y);
      farTownStatic(cc, env, { r: { x: R.x - STAGE.farDx, y: R.y, w: R.w, h: R.h } });
    })(c, R.x, R.y);
    c.save();
    c.translate(STAGE.farDx, 0);
    farTownLive(c, env, { r: R, lamps: o.lamps ?? 0.6 });
    c.restore();
    hooks.L1?.(c, env);
  });
  f.layer('L2', (c, env) => {
    const r = { x: -500, y: -100, w: 2600, h: 920 };
    f.cached(`dou/ch04-stage/flats/${env.mood.id}`, r.w, r.h, (cc) => {
      cc.translate(-r.x, -r.y);
      const set = mixLab(env.fill('set'), env.fill('ink'), 0.55);
      // Kenton's flat (left) with its small window, Ryan's flat (right) with a picture frame
      studyWall(cc, env, { x0: r.x, x1: STAGE.gap.x0, y0: r.y, y1: r.y + r.h, win: STAGE.kWin, bars: 1, transom: 0.5, floorY: 602 });
      studyWall(cc, env, { x0: STAGE.gap.x1, x1: r.x + r.w, y0: r.y, y1: r.y + r.h, win: { x: 1500, y: 200, w: 1, h: 1 }, bars: 0, floorY: 602, frame: { x: 1150, y: 170, w: 84, h: 104 } });
      // the flats' cut edges (a stage, not a house): a thin lit edge on each
      cc.fillStyle = mixLab(set, env.fill('ink'), 0.5);
      cc.fillRect(STAGE.gap.x0 - 6, r.y, 6, r.h);
      cc.fillRect(STAGE.gap.x1, r.y, 6, r.h);
      cc.fillStyle = withAlpha(env.fill('rim'), 0.35);
      cc.fillRect(STAGE.gap.x0 - 1.5, r.y, 1.5, r.h);
      cc.fillRect(STAGE.gap.x1 + 6, r.y, 1.5, r.h);
      // a stage floor across the gap
      cc.fillStyle = mixLab(set, env.fill('ink'), 0.6);
      cc.fillRect(STAGE.gap.x0, 602, STAGE.gap.x1 - STAGE.gap.x0, r.y + r.h - 602);
    })(c, r.x, r.y);
  });
}
/**
 * the two ropes from the lamp arms: hanging slack at swing 0; at swing 1 each has swung across the gap so they cross
 * once over the hill (the first turn of a braid). a = Kenton's hook (left), b = Ryan's hook (right).
 */
export function twoRopes(c: C2, env: PaintEnv, o: { a: { x: number; y: number }; b: { x: number; y: number }; swing: number; tq: number; alpha?: number }): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const k = sm(o.swing);
  const ropeA = mixLab(tone(env, '#c39250', 0.2), env.mood.fg, 0.2);
  const ropeB = mixLab(tone(env, '#93a3b2', 0.25), env.mood.fg, 0.2);
  const sway = Math.sin(o.tq * 1.7) * 3;
  const endFor = (from: { x: number; y: number }, to: { x: number; y: number }, dir: number) => {
    const hang = { x: from.x + dir * 6 + sway, y: from.y + 118 };
    const cross = { x: to.x - dir * 34, y: to.y + 74 };
    // swing along an arc (up and over), not a straight lerp
    return { x: lerp(hang.x, cross.x, k), y: lerp(hang.y, cross.y, k) - Math.sin(Math.PI * k) * 70 };
  };
  const ea = endFor(o.a, o.b, 1), eb = endFor(o.b, o.a, -1);
  c.save();
  c.globalAlpha *= A;
  for (const [from, end, col] of [[o.a, ea, ropeA], [o.b, eb, ropeB]] as const) {
    const span = Math.abs(end.x - from.x);
    const sag = 18 + span * 0.12;
    rope(c, sagPts(from, end, sag, 24), col, 2.4, 1);
    // a small knot at the free end
    c.fillStyle = col;
    c.beginPath();
    c.arc(end.x, end.y, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** the rope hook on a desk's anglepoise arm (part-way up the arm) */
export function lampHook(bulb: { x: number; y: number }, pivot: { x: number; y: number }): { x: number; y: number } {
  return { x: lerp(pivot.x, bulb.x, 0.62), y: lerp(pivot.y, bulb.y, 0.62) - 22 };
}
