/**
 * neural-net-history — ch06-s03b's teaching pieces: the classical recipe as a two-stage paper machine.
 *
 * STAGE ONE IS REAL. The expert's tin stencil (same tin, same pierced round holes and lattice as ch08-s04's) has three
 * 3 × 3 windows, each pierced in a hand-chosen shape: an EDGE (a vertical bar), a CORNER (an L) and a LOOP (a ring).
 * A photo slid behind the plate darkens the holes its ink covers; the number under each window is the true count of
 * pierced holes the photo's ink covers there (computed here from the photo's cut-paper silhouette, never typed in).
 *
 * THE LIFT IS REAL. Two crowds on a flat paper field: first linearly separable (the brass ruler finds a line), then a
 * warm ring around a cool cluster (no straight line parts them). The lift raises every point to the height
 * h(r) = exp(−(r / σ)²) (a radial feature, as in the kernel trick); a single flat sheet at height H0 then parts them,
 * and back on the flat field that cut is the circle r0 = σ·√ln(1/H0): a closed ring, exactly where the vellum met the
 * hill. Points are drawn on a terraced paper model of the same hill (layered discs, like a contour model).
 *
 *   PLATE / HOLES / PHOTOS / featureCounts(photo)    the stencil and its photos
 *   LIN / RING / H0 / SIGMA / R0 / hOf(r)            the field data and the lift
 *   tinStencil(c, env, o) · photoCard(c, env, o) · snipsArm(c, env, o) · snipsAtRest(c, env, o)
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { h01 } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;

// ================================================================================================ the stencil
/** hole pitch (as ch08-s04's cell, scaled to a hand-sized plate) */
export const CELL = 17;
export const PAD = 8;
export const GAP = 14;
const WIN_W = CELL * 3;
/** the three windows' hand-chosen shapes, row order (1 = pierced) */
export const SHAPES: { id: 'edge' | 'corner' | 'loop'; mask: number[] }[] = [
  { id: 'edge', mask: [0, 1, 0, 0, 1, 0, 0, 1, 0] },
  { id: 'corner', mask: [1, 1, 1, 1, 0, 0, 1, 0, 0] },
  { id: 'loop', mask: [1, 1, 1, 1, 0, 1, 1, 1, 1] },
];
export const PLATE_W = WIN_W * 3 + GAP * 2 + PAD * 2;
export const PLATE_H = WIN_W + PAD * 2;
/** hole centre in plate-local px (plate top-left = 0,0); w = window, q = 0..8 */
export function holeXY(w: number, q: number) {
  const i = q % 3, j = Math.floor(q / 3);
  return { x: PAD + w * (WIN_W + GAP) + i * CELL + CELL / 2, y: PAD + j * CELL + CELL / 2 };
}
/** the order the holes are pierced in (window by window, as the snips reach them) */
export const PIERCE: { w: number; q: number }[] = [];
for (let w = 0; w < 3; w++) for (let q = 0; q < 9; q++) if (SHAPES[w].mask[q]) PIERCE.push({ w, q });

// ------------------------------------------------------------------------------------------------ photos
/** a photo is a cut-paper silhouette on a pale card, in plate-local px; ink(x, y) is its true coverage */
export interface Photo {
  id: string;
  ink(x: number, y: number): boolean;
  draw(c: C, ink: string): void;
}
const inEll = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
/** a teacup on its saucer (the first photo) */
export const CUP: Photo = {
  id: 'cup',
  ink(x, y) {
    const body = x >= 30 && x <= 112 && y >= 14 && y <= 52 && inEll(x, y, 71, 14, 46, 46);
    const handle = inEll(x, y, 124, 30, 15, 13) && !inEll(x, y, 124, 30, 8, 7) && x > 108;
    const saucer = inEll(x, y, 74, 57, 64, 7);
    return body || handle || saucer;
  },
  draw(c, ink) {
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(25, 14);
    c.lineTo(117, 14);
    c.bezierCurveTo(117, 40, 100, 52, 71, 52);
    c.bezierCurveTo(42, 52, 25, 40, 25, 14);
    c.fill();
    c.beginPath();
    c.ellipse(124, 30, 15, 13, 0, 0, Math.PI * 2);
    c.ellipse(124, 30, 8, 7, 0, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.beginPath();
    c.ellipse(74, 57, 64, 7, 0, 0, Math.PI * 2);
    c.fill();
  },
};
/** a small bird on a twig (the second photo) */
export const BIRD: Photo = {
  id: 'bird',
  ink(x, y) {
    return inEll(x, y, 92, 34, 40, 18) || inEll(x, y, 136, 22, 13, 12) || (x > 20 && x < 58 && Math.abs(y - (34 - (58 - x) * 0.35)) < 7) || (y > 55 && y < 60 && x > 30 && x < 170);
  },
  draw(c, ink) {
    c.fillStyle = ink;
    c.beginPath();
    c.ellipse(92, 34, 40, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(136, 22, 13, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(146, 20);
    c.lineTo(160, 24);
    c.lineTo(146, 27);
    c.fill();
    c.beginPath();
    c.moveTo(58, 30);
    c.lineTo(20, 18);
    c.lineTo(22, 28);
    c.lineTo(58, 40);
    c.fill();
    c.fillRect(30, 55, 140, 4);
    c.fillRect(96, 50, 3, 6);
    c.fillRect(84, 50, 3, 6);
  },
};
/** the true feature row: per window, how many pierced holes the photo's ink covers */
export function featureCounts(p: Photo): number[] {
  return SHAPES.map((s, w) => s.mask.reduce((n, on, q) => (on && p.ink(holeXY(w, q).x, holeXY(w, q).y) ? n + 1 : n), 0));
}
export const ROW_CUP = featureCounts(CUP);
export const ROW_BIRD = featureCounts(BIRD);

/**
 * The tin stencil, standing in a slotted wooden stand (its foot at x, y = plate bottom-left at x, y − PLATE_H):
 * a sheet of pierced TIN (grey metal with a cut-paper sheen, punched round holes with a burr, a bent lip along the
 * top), the same tin and the same round holes as ch08-s04's. With no print behind it the holes glow with the
 * backlight; a paper PRINT slid behind it (from the right: `photo` + `dx` in plate px, 0 = in place) shows through
 * every pierced hole: its pale paper where it is blank, its INK where the drawing covers the hole. `count[w]` (0..1)
 * rings the covered holes of window w as its number is typed (the count, made visible). `pierced` = how many of the
 * PIERCE holes are cut so far (fractional = the next one opening). `lit` (0..1) is the work lamp on the tin's face.
 */
export function tinStencil(c: C, env: PaintEnv, o: { x: number; y: number; pierced: number; photo?: Photo | null; dx?: number; lit?: number; glowK?: number; count?: number[] }) {
  const m = env.mood;
  const ink = env.fill('ink');
  const x0 = o.x, y0 = o.y - PLATE_H - 14;
  const lit = o.lit ?? 1;
  const dx = o.dx ?? 0;
  const paper = mixLab(MOODS.parchment.sky[3], m.halo, 0.3);
  const photoInk = mixLab(MOODS.parchment.ink, m.fg, 0.25);
  // the print behind the plate: a paper card a little larger than the tin, its drawing in plate coords (+dx); only
  // its overhang is seen around the tin (sliding in from the right, it is seen whole before it goes behind)
  const M = 10;
  if (o.photo) {
    c.save();
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(x0 + dx - M + 4, y0 - M + 5, PLATE_W + 2 * M, PLATE_H + 2 * M);
    c.fillStyle = paper;
    c.fillRect(x0 + dx - M, y0 - M, PLATE_W + 2 * M, PLATE_H + 2 * M);
    c.strokeStyle = withAlpha(MOODS.parchment.ink, 0.35);
    c.lineWidth = 1;
    c.strokeRect(x0 + dx - M, y0 - M, PLATE_W + 2 * M, PLATE_H + 2 * M);
    c.translate(x0 + dx, y0);
    o.photo.draw(c, withAlpha(photoInk, 0.95));
    c.restore();
  }
  // the stand: a wooden foot with a slot, two slim posts
  c.fillStyle = ink;
  c.fillRect(x0 - 18, o.y - 14, PLATE_W + 36, 14);
  c.fillRect(x0 - 9, y0 - 4, 6, PLATE_H + 18);
  c.fillRect(x0 + PLATE_W + 3, y0 - 4, 6, PLATE_H + 18);
  c.fillStyle = withAlpha(m.rim, 0.45 * lit);
  c.fillRect(x0 - 18, o.y - 14, PLATE_W + 36, 1.4);
  // the tin plate with its holes (evenodd)
  const plate = new Path2D();
  plate.rect(x0, y0, PLATE_W, PLATE_H);
  const nCut = Math.floor(o.pierced + 1e-6);
  const part = o.pierced - nCut;
  const R = 5.4;
  const radius = (k: number) => (k < nCut ? R : k === nCut ? R * part : 0);
  PIERCE.forEach((p, k) => {
    const r = radius(k);
    if (r <= 0.3) return;
    const h = holeXY(p.w, p.q);
    plate.moveTo(x0 + h.x + r, y0 + h.y);
    plate.arc(x0 + h.x, y0 + h.y, r, 0, Math.PI * 2);
  });
  // grey tin, lit by the lamp from the left: a cool metal grey (desaturated toward the set), a diagonal sheen band
  const tinBase = mixLab(mixLab(m.setHaze, '#8a8c8c', 0.55), m.set, 0.2);
  const tg = c.createLinearGradient(x0, y0, x0 + PLATE_W, y0 + PLATE_H);
  tg.addColorStop(0, mixLab(tinBase, m.halo, 0.25 * lit));
  tg.addColorStop(0.32, mixLab(tinBase, '#d9d6cf', 0.32 * lit));
  tg.addColorStop(0.42, mixLab(tinBase, m.halo, 0.1 * lit));
  tg.addColorStop(1, mixLab(tinBase, m.fg, 0.35));
  c.fillStyle = tg;
  c.fill(plate, 'evenodd');
  // scored guide lines: each window's outline and its 3 × 3 lattice, scratched into the tin (fine, not frames)
  c.strokeStyle = withAlpha(mixLab(tinBase, m.fg, 0.6), 0.55);
  c.lineWidth = 0.9;
  c.beginPath();
  for (let w = 0; w < 3; w++) {
    const wx = x0 + PAD + w * (WIN_W + GAP);
    for (let q = 1; q < 3; q++) {
      c.moveTo(wx + q * CELL, y0 + PAD);
      c.lineTo(wx + q * CELL, y0 + PAD + WIN_W);
      c.moveTo(wx, y0 + PAD + q * CELL);
      c.lineTo(wx + WIN_W, y0 + PAD + q * CELL);
    }
    c.rect(wx, y0 + PAD, WIN_W, WIN_W);
  }
  c.stroke();
  // the hammered dimples of the unpunched hole marks (where a hole could go: the tin is a general stencil)
  c.fillStyle = withAlpha(mixLab(tinBase, m.fg, 0.5), 0.35);
  for (let w = 0; w < 3; w++)
    for (let q = 0; q < 9; q++) {
      if (SHAPES[w].mask[q]) continue;
      const h = holeXY(w, q);
      c.beginPath();
      c.arc(x0 + h.x, y0 + h.y, 1.6, 0, Math.PI * 2);
      c.fill();
    }
  // the bent lip: the top edge rolled forward (a lit roll, a shadow under it), and a folded right edge
  c.fillStyle = mixLab(tinBase, '#e6e1d6', 0.45 * lit);
  c.fillRect(x0 - 2, y0 - 5, PLATE_W + 4, 5);
  c.fillStyle = withAlpha(m.fg, 0.5);
  c.fillRect(x0, y0, PLATE_W, 1.6);
  c.fillStyle = mixLab(tinBase, m.fg, 0.45);
  c.fillRect(x0 + PLATE_W - 4, y0, 4, PLATE_H);
  // through each hole: the print (paper or ink), or the backlight when nothing is behind it
  PIERCE.forEach((p, k) => {
    const r = radius(k);
    if (r <= 0.3) return;
    const h = holeXY(p.w, p.q);
    const cx = x0 + h.x, cy = y0 + h.y;
    const behind = !!o.photo && h.x >= dx - M && h.x <= dx + PLATE_W + M;
    if (behind) {
      const inked = o.photo!.ink(h.x - dx, h.y);
      c.fillStyle = inked ? photoInk : mixLab(paper, m.core, 0.25);
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      if (!inked) glow(c, cx, cy, r * 2, m.core, 0.12 * (o.glowK ?? 1));
      // the count: the covered holes of this window are ringed, warm, as its number types
      const ck = o.count?.[p.w] ?? 0;
      if (inked && ck > 0.01) {
        c.strokeStyle = withAlpha(mixLab(m.core, '#ffcf6a', 0.4), 0.95 * ck);
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy, r + 2.2, 0, Math.PI * 2);
        c.stroke();
        glow(c, cx, cy, r * 2.6, m.core, 0.3 * ck);
      }
    } else {
      c.fillStyle = mixLab(m.core, m.halo, 0.25);
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      glow(c, cx, cy, r * 2.8, m.core, 0.32 * (o.glowK ?? 1));
    }
    // the punched burr: a dark rim on the upper-left, a lit lip on the lower-right
    c.lineWidth = 1;
    c.strokeStyle = withAlpha(m.fg, 0.6);
    c.beginPath();
    c.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 1.75);
    c.stroke();
    c.strokeStyle = withAlpha(mixLab(m.rim, '#ffffff', 0.2), 0.5 * lit);
    c.beginPath();
    c.arc(cx, cy, r + 0.6, Math.PI * 1.85, Math.PI * 0.65);
    c.stroke();
  });
  // the cut tin's bright edge (a fine rim along the top of the lip: the lamp catches it)
  c.strokeStyle = withAlpha(m.rim, 0.6 * lit);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 - 2, y0 - 4.5);
  c.lineTo(x0 + PLATE_W + 2, y0 - 4.5);
  c.stroke();
}

/** tin snips (closed or open by `open` 0..1), pivot at (0, 0), blades pointing +x, in local units (≈ 1 px) */
function snips(c: C, ink: string, rimCol: string, open: number) {
  const a = 0.05 + 0.32 * open;
  c.fillStyle = ink;
  for (const s of [-1, 1]) {
    c.save();
    c.rotate(s * a);
    // blade: a short, thick, slightly hooked jaw
    c.beginPath();
    c.moveTo(0, -4 * s);
    c.quadraticCurveTo(22, -6 * s, 34, -1 * s);
    c.lineTo(34, 1.5 * s);
    c.quadraticCurveTo(18, 2 * s, 0, 3 * s);
    c.closePath();
    c.fill();
    c.restore();
    c.save();
    c.rotate(-s * a * 0.6);
    // handle: a long curved grip back toward the hand
    c.beginPath();
    c.moveTo(0, -3 * s);
    c.quadraticCurveTo(-30, -12 * s, -62, -9 * s);
    c.lineTo(-63, -3 * s);
    c.quadraticCurveTo(-30, -4 * s, 0, 2 * s);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.fillStyle = rimCol;
  c.beginPath();
  c.arc(0, 0, 2.6, 0, Math.PI * 2);
  c.fill();
}

/**
 * The expert's shirt-sleeved forearm and hand holding tin snips (NOT the narrator's tweed cuffs): from an entry point
 * (off frame) to the wrist; the snips' jaw tip lands at `tip`. Drawn in the darkest ink with a window-side rim.
 */
export function snipsArm(c: C, env: PaintEnv, o: { tip: { x: number; y: number }; entry: { x: number; y: number }; open: number; ink: string; holding?: boolean; cuff?: string }) {
  const m = env.mood;
  const dx = o.tip.x - o.entry.x, dy = o.tip.y - o.entry.y;
  const L = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  c.save();
  c.translate(o.entry.x, o.entry.y);
  c.rotate(ang);
  // along +x from the entry: sleeve (rolled), forearm, wrist, hand, snips; the jaw tip at L
  const handX = L - 70;
  const wrist = handX - 16;
  c.fillStyle = o.ink;
  // forearm (tapering), from the rolled sleeve to the wrist
  c.beginPath();
  c.moveTo(0, -36);
  c.quadraticCurveTo(wrist * 0.45, -34, wrist, -16);
  c.lineTo(wrist, 16);
  c.quadraticCurveTo(wrist * 0.45, 34, 0, 36);
  c.closePath();
  c.fill();
  // the rolled shirt sleeve: a fat cuff band with a fold line (the cut-line)
  const sx = Math.min(wrist - 120, 140);
  c.beginPath();
  c.moveTo(sx - 60, -40);
  c.lineTo(sx + 14, -33);
  c.quadraticCurveTo(sx + 22, 0, sx + 14, 33);
  c.lineTo(sx - 60, 40);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.32);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(sx - 8, -35);
  c.quadraticCurveTo(sx, 0, sx - 8, 35);
  c.stroke();
  // the shirt cuff at the wrist: a pale band (shirt-sleeved: not the narrator's tweed)
  if (o.cuff) {
    c.fillStyle = o.cuff;
    c.beginPath();
    c.moveTo(wrist - 26, -19);
    c.lineTo(wrist - 8, -16.5);
    c.lineTo(wrist - 8, 16.5);
    c.lineTo(wrist - 26, 19);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(m.fg, 0.4);
    c.fillRect(wrist - 18, -17, 1.2, 34);
    c.fillStyle = o.ink;
  }
  // the hand: a gripping fist around the handles (knuckles toward the camera), thumb on top
  c.fillStyle = o.ink;
  c.beginPath();
  c.moveTo(wrist - 2, -14);
  c.quadraticCurveTo(handX + 6, -22, handX + 22, -12);
  c.quadraticCurveTo(handX + 30, 0, handX + 22, 14);
  c.quadraticCurveTo(handX + 4, 22, wrist - 2, 14);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(handX + 14, -15, 15, 6, -0.2, 0, Math.PI * 2);
  c.fill();
  // knuckle cut-lines
  c.strokeStyle = withAlpha(m.rim, 0.28);
  c.lineWidth = 1;
  c.beginPath();
  for (let k = 0; k < 3; k++) {
    c.moveTo(handX + 6 + k * 6, 6);
    c.lineTo(handX + 8 + k * 6, 13);
  }
  c.stroke();
  // the snips: handles inside the fist, pivot ahead, jaw tip at L
  if (o.holding !== false) {
    c.save();
    c.translate(L - 34, 0);
    snips(c, o.ink, withAlpha(m.rim, 0.7), o.open);
    c.restore();
  }
  // a window-side rim along the arm's top edge
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(sx + 16, -31);
  c.lineTo(wrist, -13.5);
  c.stroke();
  c.restore();
}

/** the snips laid down on the bench beside the stencil (closed, a glint on the pivot) */
export function snipsAtRest(c: C, env: PaintEnv, x: number, y: number, rot: number, glint = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, 0.55);
  snips(c, env.fill('ink'), withAlpha(env.mood.rim, 0.6 + 0.4 * glint), 0.05);
  c.restore();
  if (glint > 0.02) glow(c, x, y, 18, env.mood.core, 0.35 * glint);
}

// ================================================================================================ the field
export const SIGMA = 0.42;
export const H0 = 0.25;
/** where the flat cut meets the hill, back on the flat field: the closed ring */
export const R0 = SIGMA * Math.sqrt(Math.log(1 / H0));
export const hOf = (r: number) => Math.exp(-((r / SIGMA) ** 2));
/** terraced paper model: layer radii 1 … 1/N */
export const NL = 13;
export const LAYER_R = Array.from({ length: NL }, (_, k) => (NL - k) / NL);
export const layerOf = (r: number) => Math.min(NL - 1, Math.max(0, Math.floor(NL * (1 - r) + 1e-9)));

export interface Dot {
  warm: boolean;
  /** stage two (separable by a line) */
  lin: { u: number; v: number };
  /** the kernel case: a warm ring around a cool cluster */
  ring: { u: number; v: number };
}
/** the line the ruler settles on (through the pivot at the field centre): normal angle PHI in (u, v) */
export const PHI = 0.32;
function makeDots(): Dot[] {
  const warm: { u: number; v: number }[] = [];
  const cool: { u: number; v: number }[] = [];
  const n = [Math.cos(PHI), Math.sin(PHI)];
  for (let i = 0; i < 800 && (warm.length < 14 || cool.length < 9); i++) {
    const u = h01(i * 2 + 1, 6031) * 1.8 - 0.9;
    const v = h01(i * 2 + 2, 6031) * 1.8 - 0.9;
    if (u * u + v * v > 0.86) continue;
    const d = n[0] * u + n[1] * v;
    if (Math.abs(d) < 0.2) continue;
    const near = (L: { u: number; v: number }[]) => L.some((p) => Math.hypot(p.u - u, p.v - v) < 0.19);
    if (d < 0 && warm.length < 14 && !near(warm)) warm.push({ u, v });
    if (d > 0 && cool.length < 9 && !near(cool)) cool.push({ u, v });
  }
  const out: Dot[] = [];
  warm.forEach((p, i) => {
    const a = (i / warm.length) * Math.PI * 2 + 0.3 * h01(i, 6041);
    const r = 0.64 + 0.22 * h01(i, 6042);
    out.push({ warm: true, lin: p, ring: { u: r * Math.cos(a), v: r * Math.sin(a) } });
  });
  cool.forEach((p, i) => {
    const a = (i / cool.length) * Math.PI * 2 + 0.9 * h01(i, 6043);
    const r = i === 0 ? 0.02 : 0.1 + 0.2 * h01(i, 6044);
    out.push({ warm: false, lin: p, ring: { u: r * Math.cos(a), v: r * Math.sin(a) } });
  });
  return out;
}
export const DOTS = makeDots();

/**
 * The expert's other hand, steadying the tin by its left post: a shirt-sleeved forearm from `entry` to a flat hand
 * whose fingers lie along the post (at `at`), a pale shirt cuff at the wrist. Darkest ink, a window-side rim.
 */
export function steadyArm(c: C, env: PaintEnv, o: { at: { x: number; y: number }; entry: { x: number; y: number }; ink: string; cuff: string }) {
  const m = env.mood;
  const dx = o.at.x - o.entry.x, dy = o.at.y - o.entry.y;
  const L = Math.hypot(dx, dy) || 1;
  c.save();
  c.translate(o.entry.x, o.entry.y);
  c.rotate(Math.atan2(dy, dx));
  const wrist = L - 46;
  c.fillStyle = o.ink;
  // the forearm (a rolled shirt sleeve at the entry, tapering to the wrist)
  c.beginPath();
  c.moveTo(0, -34);
  c.quadraticCurveTo(wrist * 0.5, -30, wrist, -14);
  c.lineTo(wrist, 14);
  c.quadraticCurveTo(wrist * 0.5, 30, 0, 34);
  c.closePath();
  c.fill();
  // the flat hand: palm and four fingers lying forward along the post, the thumb hooked round it
  c.beginPath();
  c.moveTo(wrist - 2, -13);
  c.quadraticCurveTo(L - 22, -16, L + 6, -8);
  c.quadraticCurveTo(L + 12, -2, L + 6, 4);
  c.quadraticCurveTo(L - 18, 12, wrist - 2, 13);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(L - 16, 11, 12, 4.5, 0.5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  for (let k = 0; k < 3; k++) {
    c.moveTo(L - 22 + k * 7, -8 + k * 0.5);
    c.lineTo(L + 2, -6 + k * 3);
  }
  c.stroke();
  // the pale shirt cuff
  c.fillStyle = o.cuff;
  c.beginPath();
  c.moveTo(wrist - 24, -18);
  c.lineTo(wrist - 6, -15);
  c.lineTo(wrist - 6, 15);
  c.lineTo(wrist - 24, 18);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(wrist - 16, -16, 1.2, 32);
  // the rim on the window side (the arm's top edge)
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(20, -32);
  c.quadraticCurveTo(wrist * 0.5, -29, wrist - 26, -18.5);
  c.stroke();
  c.restore();
}
