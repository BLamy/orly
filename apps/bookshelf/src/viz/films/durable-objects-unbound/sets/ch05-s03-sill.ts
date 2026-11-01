/**
 * durable-objects-unbound — HOUSE A'S SILL in close-up (author:ch04-ch05; ch05-s03, reused by ch05-s04/s05).
 *
 * A close set consistent with the canonical town: House A's wall (L4-depth) with its main window as a HOLE and a
 * long stone sill; through the window a room (its own plane a little deeper, so it parallaxes) where A's keeper
 * reads at a desk; beyond A's corner the terrace (L2) with the other houses' lamps.
 *
 *   SILL                       the close set's geometry (wall, window, sill, candle spot, hourglass spots)
 *   aWall(c, env)              A's wall with the window hole and the sill (static: bake it)
 *   interiorRoom(c, env)       the room behind the window: back wall, desk, shelf (static: bake it)
 *   terraceBehind(c, env, o)   the terrace beyond A's corner: houses with window lamps (o.lamps 0..1, per-frame)
 *   hourglass(c, env, o)       a small brass hourglass (x, y = base centre); o.u 0..1 sand run through; o.flip 0..1
 *   gust(c, env, o)            pale wind streaks across the sill (o.k 0..1 strength), seeded and twos-quantised
 *   codePage(c, env, o)        a page of code held up: ink lines (illegible) and one line underlined in red
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS, INK_RED, brass, clamp01, glowDot, lerp, paper, tone, type C2 } from './common';

export const SILL = {
  win: { x: 236, y: 118, w: 300, h: 300 },
  sillY: 430,
  sill: { x0: 150, x1: 900 },
  wall: { x0: -400, x1: 900 },
  candle: { x: 640, y: 430 },
  glass: [{ x: 724, y: 430 }, { x: 780, y: 430 }, { x: 830, y: 430 }],
  /** the keeper's seat inside (IN plane) */
  seat: { x: 330, y: 560 },
  desk: { x: 450, y: 560 },
};

export function aWall(c: C2, env: PaintEnv): void {
  const w = SILL.win;
  const set = mixLab(env.fill('set'), env.fill('ink'), 0.62);
  const p = new Path2D();
  p.moveTo(SILL.wall.x0, -300);
  p.lineTo(SILL.wall.x1, -300);
  p.lineTo(SILL.wall.x1, 900);
  p.lineTo(SILL.wall.x0, 900);
  p.closePath();
  p.rect(w.x, w.y, w.w, w.h);
  c.fillStyle = set;
  c.fill(p, 'evenodd');
  // stone courses, faint, moon-lit on their upper edges
  c.save();
  c.clip(p, 'evenodd');
  c.strokeStyle = withAlpha(env.fill('rim'), 0.07);
  c.lineWidth = 1;
  for (let y = -300; y < 900; y += 34) {
    c.beginPath();
    c.moveTo(SILL.wall.x0, y);
    c.lineTo(SILL.wall.x1, y);
    c.stroke();
    for (let x = SILL.wall.x0 + ((y / 34) % 2 ? 0 : 40); x < SILL.wall.x1; x += 80) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 34);
      c.stroke();
    }
  }
  c.restore();
  // the wall's corner (the house ends at x1): a lit edge toward the moon side is on the left, so the right edge is dark
  c.fillStyle = mixLab(set, env.fill('ink'), 0.4);
  c.fillRect(SILL.wall.x1 - 10, -300, 10, 1200);
  // window frame: cross mullions, a lip, and the long stone sill
  c.fillStyle = set;
  c.fillRect(w.x + w.w / 2 - 4, w.y, 8, w.h);
  c.fillRect(w.x, w.y + w.h * 0.42 - 4, w.w, 8);
  c.fillRect(w.x - 12, w.y - 12, w.w + 24, 12);
  const sl = SILL.sill;
  c.fillStyle = mixLab(set, env.fill('rim'), 0.06);
  c.fillRect(sl.x0, SILL.sillY, sl.x1 - sl.x0, 14);
  c.fillStyle = mixLab(set, env.fill('ink'), 0.35);
  c.fillRect(sl.x0 + 6, SILL.sillY + 14, sl.x1 - sl.x0 - 12, 8);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(sl.x0, SILL.sillY);
  c.lineTo(sl.x1, SILL.sillY);
  c.stroke();
}

export function interiorRoom(c: C2, env: PaintEnv): void {
  const back = mixLab(env.fill('set'), '#3a2c20', 0.35);
  c.fillStyle = back;
  c.fillRect(100, 40, 560, 600);
  // a shelf and a framed print on the back wall
  c.fillStyle = mixLab(back, env.fill('ink'), 0.45);
  c.fillRect(150, 190, 120, 6);
  for (let i = 0; i < 7; i++) c.fillRect(156 + i * 15, 160 - (i % 3) * 5, 10, 30 + (i % 3) * 5);
  c.fillRect(520, 150, 60, 74);
  c.fillStyle = mixLab(back, env.mood.haze, 0.2);
  c.fillRect(526, 156, 48, 62);
  // the desk (its top just above the sill line seen from outside)
  c.fillStyle = mixLab(back, env.fill('ink'), 0.7);
  c.fillRect(380, 404, 200, 8);
  c.fillRect(392, 412, 8, 160);
  c.fillRect(560, 412, 8, 160);
}

export interface TerraceOpts {
  lamps: number;
  /** per-house gutter flicker (twos time) */
  tq: number;
}
const BEHIND = [
  { x: 1000, base: 470, w: 150, eave: 330, ridge: 270, win: [{ x: 970, y: 380 }, { x: 1040, y: 360 }], chimney: true },
  { x: 1200, base: 440, w: 120, eave: 300, ridge: 240, win: [{ x: 1180, y: 340 }], dormer: true },
  { x: 1380, base: 450, w: 140, eave: 320, ridge: 270, win: [{ x: 1390, y: 360 }] },
];
export function terraceStatic(c: C2, env: PaintEnv): void {
  const set = mixLab(env.fill('set'), env.fill('ink'), 0.5);
  c.fillStyle = mixLab(set, env.mood.fg, 0.15);
  c.fillRect(700, 470, 1000, 400);
  for (const h of BEHIND) {
    c.fillStyle = set;
    c.beginPath();
    c.moveTo(h.x - h.w / 2, h.base + 40);
    c.lineTo(h.x - h.w / 2, h.eave);
    c.lineTo(h.x, h.ridge);
    c.lineTo(h.x + h.w / 2, h.eave);
    c.lineTo(h.x + h.w / 2, h.base + 40);
    c.closePath();
    c.fill();
    if (h.chimney) c.fillRect(h.x + 30, h.ridge - 10, 16, 40);
    if (h.dormer) c.fillRect(h.x - 40, h.ridge + 20, 30, 34);
    c.strokeStyle = withAlpha(env.fill('rim'), 0.4);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(h.x - h.w / 2, h.eave);
    c.lineTo(h.x, h.ridge);
    c.stroke();
    for (const w of h.win) {
      c.fillStyle = mixLab(set, env.mood.fg, 0.4);
      c.fillRect(w.x - 12, w.y - 14, 24, 28);
    }
  }
}
export function terraceLamps(c: C2, env: PaintEnv, o: TerraceOpts): void {
  const L = clamp01(o.lamps);
  if (L <= 0.01) return;
  BEHIND.forEach((h, i) => {
    for (const w of h.win) {
      const fl = L < 0.98 && L > 0.05 ? (Math.sin(o.tq * 37 + i * 2.1) > 0.1 ? 1 : 0.4) : 1;
      const k = L * fl;
      c.fillStyle = mixLab(mixLab(env.fill('set'), env.mood.fg, 0.4), tone(env, '#f2b45e', 0.08), k);
      c.fillRect(w.x - 12, w.y - 14, 24, 28);
      glowDot(c, w.x, w.y, 40, tone(env, '#f2b45e', 0.08), 0.35 * k);
    }
  });
}

export interface HourglassOpts {
  x: number;
  y: number;
  s?: number;
  /** 0..1 sand run through (0 = all on top) */
  u: number;
  /** 0..1 a flip in progress (rotation) */
  flip?: number;
  alpha?: number;
  /** a small glint when it empties */
  glint?: number;
}
/** a brass-framed hourglass (base centre at x, y), s = 1 is 22 x 40 px */
export function hourglass(c: C2, env: PaintEnv, o: HourglassOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const H = 40, W = 22;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y - (H / 2) * s);
  c.rotate(Math.PI * clamp01(o.flip ?? 0));
  c.scale(s, s);
  const u = clamp01(o.u);
  const glass = withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.25);
  const sand = tone(env, '#d8b56a', 0.2);
  // glass bulbs
  const bulb = (dir: number) => {
    c.beginPath();
    c.moveTo(-W / 2 + 2, dir * (H / 2 - 3));
    c.quadraticCurveTo(-W / 2 + 1, dir * 6, -1.5, dir * 1);
    c.lineTo(1.5, dir * 1);
    c.quadraticCurveTo(W / 2 - 1, dir * 6, W / 2 - 2, dir * (H / 2 - 3));
    c.closePath();
  };
  c.fillStyle = glass;
  bulb(-1);
  c.fill();
  bulb(1);
  c.fill();
  // sand: the top bulb's heap shrinks, the bottom bulb's grows, a thin stream between while running
  c.fillStyle = sand;
  const top = 1 - u;
  if (top > 0.01) {
    c.save();
    bulb(-1);
    c.clip();
    c.fillRect(-W / 2, -2 - (H / 2 - 4) * top, W, (H / 2 - 4) * top + 1);
    c.restore();
  }
  if (u > 0.01) {
    c.save();
    bulb(1);
    c.clip();
    c.beginPath();
    c.moveTo(-W / 2, H / 2 - 3);
    c.lineTo(0, H / 2 - 3 - (H / 2 - 5) * u);
    c.lineTo(W / 2, H / 2 - 3);
    c.closePath();
    c.fill();
    c.restore();
  }
  if (u > 0.01 && u < 0.99) c.fillRect(-0.6, -1, 1.2, H / 2 - 4);
  // brass frame: top and bottom plates and three posts
  c.fillStyle = brass(env, 0.4);
  c.fillRect(-W / 2 - 3, -H / 2 - 3, W + 6, 3.5);
  c.fillRect(-W / 2 - 3, H / 2 - 0.5, W + 6, 3.5);
  c.fillStyle = withAlpha(mixLab(BRASS, env.mood.fg, 0.5), 0.9);
  c.fillRect(-W / 2 - 2, -H / 2, 1.6, H);
  c.fillRect(W / 2 + 0.4, -H / 2, 1.6, H);
  c.restore();
  if ((o.glint ?? 0) > 0.01) glowDot(c, o.x, o.y - (H / 2) * s, 18 * s, tone(env, '#ffe2a0', 0.1), 0.6 * (o.glint ?? 0) * A);
}

/** pale wind streaks across the sill, moving right to left */
export function gust(c: C2, env: PaintEnv, o: { k: number; t: number; x0: number; x1: number; y0: number; y1: number }): void {
  const k = clamp01(o.k);
  if (k <= 0.01) return;
  c.save();
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.28 * k);
  c.lineWidth = 1.2;
  c.lineCap = 'round';
  const tq = Math.floor(o.t * 12) / 12;
  for (let i = 0; i < 14; i++) {
    const ph = ((tq * (0.9 + (i % 4) * 0.2) + i * 0.137) % 1 + 1) % 1;
    const x = lerp(o.x1, o.x0, ph);
    const y = lerp(o.y0, o.y1, ((i * 0.618) % 1));
    const L = 40 + (i % 5) * 18;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x - L / 2, y - 6, x - L, y + 2);
    c.stroke();
  }
  c.restore();
}

/** a page of code held up: ink lines (illegible) and one line underlined in red (u 0..1 the underline drawn) */
export function codePage(c: C2, env: PaintEnv, o: { x: number; y: number; w: number; h: number; rot?: number; under?: number; alpha?: number }): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.fillStyle = paper(env, 0.12);
  c.beginPath();
  c.moveTo(-o.w / 2, -o.h / 2);
  c.lineTo(o.w / 2, -o.h / 2 + 1);
  c.lineTo(o.w / 2, o.h / 2);
  c.lineTo(-o.w / 2, o.h / 2 - 1);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha('#2a2016', 0.55);
  c.lineWidth = Math.max(1, o.h * 0.018);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const y = -o.h / 2 + o.h * 0.1 + (i * o.h * 0.8) / n;
    const indent = [0, 0.08, 0.08, 0.16, 0.16, 0.08, 0.16, 0.24, 0.16, 0.08, 0][i];
    const len = [0.6, 0.7, 0.5, 0.75, 0.55, 0.62, 0.7, 0.45, 0.66, 0.5, 0.3][i];
    c.beginPath();
    c.moveTo(-o.w / 2 + o.w * (0.08 + indent), y);
    c.lineTo(-o.w / 2 + o.w * (0.08 + indent + len * 0.8), y);
    c.stroke();
  }
  // the scar: one comment line underlined in red
  const u = clamp01(o.under ?? 0);
  if (u > 0) {
    const y = -o.h / 2 + o.h * 0.1 + (4 * o.h * 0.8) / n + o.h * 0.03;
    c.strokeStyle = withAlpha(INK_RED, 0.95);
    c.lineWidth = Math.max(1.4, o.h * 0.025);
    c.beginPath();
    c.moveTo(-o.w / 2 + o.w * 0.22, y);
    c.lineTo(-o.w / 2 + o.w * (0.22 + 0.62 * u), y + Math.sin(u * 9) * 0.6);
    c.stroke();
  }
  c.restore();
}

/**
 * The demonstrator's hand guaranteed to enter from the lower RIGHT (staging.hands): the shared sprite's default
 * angle aims its forearm toward the lower LEFT, so it is mirrored about the fingertip here (a hand has no likeness;
 * the rim stays on the upper edge). Wanted shared change: fix the default in sets/demonstratorHand.ts.
 */
import { demonstratorHand, type HandOpts } from './demonstratorHand';
export function handFromRight(c: C2, env: PaintEnv, o: HandOpts): void {
  // director, shots stage: the shared sprite now enters from the lower right itself (mirror moved into
  // sets/demonstratorHand.ts), so this wrapper no longer mirrors (a second mirror would send it back to the left)
  demonstratorHand(c, env, o);
}
