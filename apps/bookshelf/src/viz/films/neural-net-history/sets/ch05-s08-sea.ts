/**
 * ch05-s08 — the SEA OF INDEX CARDS (Austin, 1984): an encyclopedia whose pages lift and fold into cards that
 * spill outward and roll in slow waves; small paper ships ride it toward a far horizon.
 *
 *   cardSea(c, o, env)          one band of the sea: rows of cards riding a travelling wave (two fills per band)
 *   openBook(c, x, y, s, env)   the one-volume desk encyclopedia lying open on the floor (seen low)
 *   pageFlight(c, o, env)       a page lifting off the book, flipping, splitting into cards that land in the sea
 *   paperShip(c, x, y, s, env)  a small cut-paper sailing ship (explorers' metaphor, purely visual)
 *   logicRacks(c, o, env)       Tokyo, 1982: rows of tall racks of logic machines, small researchers at keyboards,
 *                               a cut-paper placard on the racks (prop lettering)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

export interface SeaBand {
  /** surface baseline of the first row (layer px) */
  y: number;
  rows: number;
  rowGap: number;
  x0: number;
  x1: number;
  cardW: number;
  cardH: number;
  amp: number;
  wl: number;
  /** wave speed (radians / s) */
  speed: number;
  t: number;
  seed: number;
  /** 0..1 how far the sea has spread at a given x (cards shrink to nothing at its edge) */
  reach?: (x: number) => number;
  /** the paper's light (0 dark … 1 lamp-lit) per row index from the back */
  light?: (row: number) => number;
  /** draw only rows [from, to) */
  from?: number;
  to?: number;
}

/** the surface height of the sea at (x, row) */
export function seaY(o: SeaBand, x: number, row = 0): number {
  const ph = (x / o.wl) * Math.PI * 2 - o.t * o.speed + row * 0.7;
  return o.y + row * o.rowGap + o.amp * Math.sin(ph) + o.amp * 0.35 * Math.sin(ph * 0.47 + 1.3);
}

export function cardSea(c: C, o: SeaBand, env: PaintEnv) {
  const m = env.mood;
  const step = o.cardW * 0.72;
  const r0 = o.from ?? 0, r1 = o.to ?? o.rows;
  for (let r = r0; r < r1; r++) {
    const lit = o.light ? o.light(r) : 0.5;
    const paperA = mixLab(mixLab(m.set, m.setHaze, 0.5), mixLab(m.halo, m.rim, 0.4), clamp01(lit));
    const paperB = mixLab(paperA, m.fg, 0.22);
    const pa = new Path2D(), pb = new Path2D(), edge = new Path2D();
    // the dark trough under this row
    // (only where the sea has reached: no dark trough runs ahead of the cards)
    let ux0 = o.x1, ux1 = o.x0;
    if (o.reach) {
      for (let x = o.x0; x <= o.x1; x += step) if (o.reach(x) > 0.6) {
        ux0 = Math.min(ux0, x);
        ux1 = Math.max(ux1, x);
      }
    } else {
      ux0 = o.x0;
      ux1 = o.x1;
    }
    const under = new Path2D();
    if (ux1 > ux0) {
      under.moveTo(ux0, seaY(o, ux0, r) + o.cardH * 0.6);
      for (let x = ux0; x <= ux1 + step; x += step * 2) under.lineTo(x, seaY(o, x, r) + o.cardH * 0.4);
      under.lineTo(ux1 + step, seaY(o, ux1, r) + o.rowGap * 2 + o.cardH);
      under.lineTo(ux0, seaY(o, ux0, r) + o.rowGap * 2 + o.cardH);
      under.closePath();
    }
    let i = 0;
    for (let x = o.x0 + (r % 2) * step * 0.5; x <= o.x1; x += step, i++) {
      const k = o.reach ? o.reach(x) : 1;
      if (k <= 0.02) continue;
      const jx = hash1(i * 7 + r * 131, o.seed) * step * 0.35;
      const xx = x + jx;
      const yy = seaY(o, xx, r) + hash1(i * 5 + r * 29, o.seed + 4) * o.cardH * 0.3;
      const dy = seaY(o, xx + 4, r) - yy;
      const rot = Math.atan2(dy, 4) * 0.9 + hash1(i * 3 + r * 17, o.seed + 2) * 0.34;
      const w = o.cardW * k * (0.85 + 0.3 * (0.5 + 0.5 * hash1(i, o.seed + 5)));
      const h = o.cardH * k;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const P = (ax: number, ay: number) => [xx + ax * cs - ay * sn, yy + ax * sn + ay * cs] as const;
      const a = P(-w / 2, -h), b2 = P(w / 2, -h), c2 = P(w / 2, 0), d = P(-w / 2, 0);
      const target = hash1(i * 13 + r, o.seed + 9) > 0 ? pa : pb;
      target.moveTo(a[0], a[1]);
      target.lineTo(b2[0], b2[1]);
      target.lineTo(c2[0], c2[1]);
      target.lineTo(d[0], d[1]);
      target.closePath();
      edge.moveTo(a[0], a[1]);
      edge.lineTo(b2[0], b2[1]);
    }
    // the trough between rows: a shadowed paper value (not a black seam), so the rows read as one sea
    c.fillStyle = mixLab(mixLab(m.fg, m.set, 0.5), paperB, 0.42);
    c.fill(under);
    c.fillStyle = paperB;
    c.fill(pb);
    c.fillStyle = paperA;
    c.fill(pa);
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.25 + 0.35 * clamp01(lit));
    c.lineWidth = 1;
    c.stroke(edge);
  }
}

/** the open encyclopedia on the floor, seen from a little above: two page faces in perspective with text
 *  lines, a dark cover showing at the edges; (x, y) = the foot of the spine; `lift` 0..1 raises the top leaf */
export function openBook(c: C, x: number, y: number, s: number, env: PaintEnv, lift = 0) {
  const m = env.mood;
  const paper = mixLab(m.halo, m.rim, 0.45);
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // the cover (boards) under the pages
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-132, -4);
  c.lineTo(132, -4);
  c.lineTo(112, -66);
  c.lineTo(-112, -66);
  c.closePath();
  c.fill();
  // the page block's thickness (light edges) and the two page faces, bowed at the gutter
  for (const side of [-1, 1]) {
    c.fillStyle = mixLab(paper, m.set, 0.4);
    c.beginPath();
    c.moveTo(0, -2);
    c.lineTo(side * 124, -10);
    c.lineTo(side * 124, -2);
    c.lineTo(0, 4);
    c.closePath();
    c.fill();
    const face = new Path2D();
    face.moveTo(0, -4);
    face.quadraticCurveTo(side * 60, -18, side * 124, -12);
    face.lineTo(side * 104, -64);
    face.quadraticCurveTo(side * 50, -70, 0, -60);
    face.closePath();
    const g = c.createLinearGradient(0, 0, side * 124, 0);
    g.addColorStop(0, mixLab(paper, m.set, 0.35));
    g.addColorStop(0.25, paper);
    g.addColorStop(1, mixLab(paper, m.halo, 0.3));
    c.fillStyle = g;
    c.fill(face);
    // two columns of text lines
    c.strokeStyle = withAlpha(m.ink, 0.28);
    c.lineWidth = 1;
    for (let k = 0; k < 9; k++) {
      const v = 0.16 + k * 0.085;
      const yA = -4 - v * 56, yB = -12 - v * 52;
      for (const [u0, u1] of [[0.12, 0.5], [0.56, 0.9]] as const) {
        c.beginPath();
        c.moveTo(side * (u0 * 124 - v * 14 * u0), yA + (yB - yA) * u0);
        c.lineTo(side * (u1 * 124 - v * 14 * u1), yA + (yB - yA) * u1);
        c.stroke();
      }
    }
  }
  // the gutter
  c.strokeStyle = withAlpha(m.fg, 0.55);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -3);
  c.lineTo(0, -60);
  c.stroke();
  // the top leaf lifting (a page standing up from the right side, curling over)
  if (lift > 0.01) {
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(0, -4);
    c.quadraticCurveTo(50, -18 - 60 * lift, 90 - 70 * lift, -12 - 80 * lift);
    c.lineTo(76 - 64 * lift, -60 - 70 * lift);
    c.quadraticCurveTo(40, -66 - 40 * lift, 0, -60);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** a page lifting off the book at `born`: rises and flips (0–.7 s), then splits into three cards that arc out
 *  and land at the given points (.7–1.9 s) */
export function pageFlight(c: C, o: { x: number; y: number; t: number; born: number; land: { x: number; y: number }[]; seed: number }, env: PaintEnv) {
  const age = o.t - o.born;
  if (age < 0 || age > 2.0) return;
  const m = env.mood;
  const paper = mixLab(m.halo, m.rim, 0.5);
  if (age < 0.7) {
    const u = age / 0.7;
    const px = o.x + (hash1(o.seed, 1) * 30) * u;
    const py = o.y - 16 - 150 * Math.sin(u * Math.PI * 0.62);
    const flip = Math.cos(u * Math.PI);
    c.save();
    c.translate(px, py);
    c.rotate(-0.4 + 0.8 * u + hash1(o.seed, 3) * 0.3);
    c.scale(Math.max(0.06, Math.abs(flip)), 1);
    c.fillStyle = flip > 0 ? paper : mixLab(paper, m.set, 0.3);
    c.fillRect(-34, -24, 68, 48);
    c.strokeStyle = withAlpha(m.ink, 0.2);
    c.lineWidth = 0.8;
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.moveTo(-26, -14 + k * 7);
      c.lineTo(22, -14 + k * 7);
      c.stroke();
    }
    c.restore();
    return;
  }
  const u = clamp01((age - 0.7) / 1.2);
  const sx = o.x + hash1(o.seed, 1) * 30, sy = o.y - 16 - 150 * Math.sin(Math.PI * 0.62);
  o.land.forEach((L, i) => {
    const x = sx + (L.x - sx) * u;
    const y = sy + (L.y - sy) * u - 120 * Math.sin(u * Math.PI) * (0.6 + 0.2 * i);
    const a = 1 - clamp01((u - 0.85) / 0.15);
    c.save();
    c.globalAlpha *= a;
    c.translate(x, y);
    c.rotate((i - 1) * 0.6 * (1 - u) + Math.sin(age * 5 + i) * 0.3);
    c.fillStyle = paper;
    c.fillRect(-12, -8, 24, 16);
    c.restore();
  });
}

/** a small cut-paper sailing ship: hull on the sea surface at (x, y), sails as paper; facing right */
export function paperShip(c: C, x: number, y: number, s: number, rot: number, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-34, -10);
  c.lineTo(36, -10);
  c.lineTo(26, 2);
  c.lineTo(-26, 2);
  c.closePath();
  c.fill();
  c.fillRect(-1.5, -66, 3, 58);
  c.fillRect(-20, -48, 2.4, 40);
  // sails: paper (lighter, lit), cut sharp
  c.fillStyle = mixLab(m.halo, m.rim, 0.35);
  c.beginPath();
  c.moveTo(2, -64);
  c.quadraticCurveTo(24, -42, 30, -14);
  c.lineTo(2, -14);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-17, -46);
  c.quadraticCurveTo(-4, -32, -2, -16);
  c.lineTo(-17, -16);
  c.closePath();
  c.fill();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(1, -66);
  c.lineTo(12, -62);
  c.lineTo(1, -58);
  c.closePath();
  c.fill();
  c.restore();
}

/** Tokyo, 1982: rows of tall racks of logic machines, researchers at keyboards between them, a placard */
export function logicRacks(c: C, o: { x: number; y: number; n: number; pitch: number; h: number; placard: string; placardPx?: number; t: number; leds?: number }, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const W = o.pitch * 0.5;
  for (let i = 0; i < o.n; i++) {
    const x = o.x + i * o.pitch;
    c.fillStyle = ink;
    c.fillRect(x - W / 2, o.y - o.h, W, o.h);
    c.fillRect(x - W / 2 - 3, o.y - o.h - 6, W + 6, 7);
    // board slots as faint cut-lines, and small status lamps blinking on a seeded clock
    c.strokeStyle = withAlpha(m.rim, 0.16);
    c.lineWidth = 1;
    for (let k = 1; k < 9; k++) {
      c.beginPath();
      c.moveTo(x - W / 2 + 5, o.y - o.h + k * (o.h / 9));
      c.lineTo(x + W / 2 - 5, o.y - o.h + k * (o.h / 9));
      c.stroke();
    }
    for (let k = 0; k < 14; k++) {
      const on = Math.sin(o.t * (1.3 + hash1(k + i * 31, 2)) * 3 + k * 2.1 + i) > 0.25;
      if (!on) continue;
      c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.4), 0.55 * (o.leds ?? 1));
      c.fillRect(x - W / 2 + 7 + (k % 4) * (W - 14) / 4, o.y - o.h + 14 + Math.floor(k / 4) * (o.h / 9) * 2, 3, 2);
    }
  }
  // the placard: a cut-paper card hung on two strings from the middle racks' tops, across their faces (below the
  // theatre's valance, so it reads in the aside's frame; prop lettering at the legibility floor)
  const mid = o.x + ((o.n - 1) * o.pitch) / 2;
  const fs = o.placardPx ?? 34;
  c.font = `400 ${fs}px ${FONT.typewriter}`;
  const tw = c.measureText(o.placard).width;
  const pw = tw + 40, ph = fs * 1.5, py = o.y - o.h * 0.5;
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(mid - pw / 2 + 16, py - ph);
  c.lineTo(mid - o.pitch / 2, o.y - o.h - 4);
  c.moveTo(mid + pw / 2 - 16, py - ph);
  c.lineTo(mid + o.pitch / 2, o.y - o.h - 4);
  c.stroke();
  c.fillStyle = withAlpha(m.fg, 0.5);
  c.fillRect(mid - pw / 2 + 4, py - ph + 5, pw, ph);
  c.fillStyle = mixLab(m.halo, m.rim, 0.5);
  c.fillRect(mid - pw / 2, py - ph, pw, ph);
  c.fillStyle = withAlpha(m.ink, 0.9);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(o.placard, mid, py - ph / 2 + 1);
}
