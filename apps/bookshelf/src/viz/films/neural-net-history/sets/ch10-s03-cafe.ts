/**
 * neural-net-history — the CAFE at Google, 2016 (ch10-s03): a sunny-dusk lunch room with a glass curtain wall.
 * Generic modern architecture only: no logos, no brand marks, no signage.
 *
 *   cafeOutside(c, env, r)        L1: a campus tree line and low far buildings, hazed
 *   cafeGlassWall(c, env, r)      L2: the curtain wall (pane HOLES, mullions, a transom), the soffit above, the
 *                                 floor slab line
 *   cafeBack(c, env, r)           L3: a serving counter with stools, a far table with two diners (texture), the
 *                                 polished floor with the windows' reflections
 *   pendant(c, env, x, y, len)    a dome pendant lamp on its cord (L3 / L4)
 *   cafeTable(c, env, o)          L4: the long lunch table in profile with trays, plates, cups
 *   cafeChair(c, env, x, floor, s, facing)   a bentwood-style cafe chair in profile
 *   paperHand(c, env, x, y, s, pinch)        a cut-paper hand reaching down from above, pinching (ghost lift)
 */
import type { PaintEnv, Puppet } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { forestBand } from '../../../film/silhouette/nature';
import { createPuppet } from '../../../film/silhouette/puppet';
import { POSES } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
export interface R4 {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CAFE = {
  floor: 640,
  slab: 548,
  soffit: 34,
  bay: 168,
  transom: 112,
};

export function cafeOutside(c: C, env: PaintEnv, r: R4) {
  const m = env.mood;
  // low far buildings (plain boxes, a few lit windows), then a leafy tree line in front of them
  c.fillStyle = env.fill('set');
  for (let i = 0, x = r.x; x < r.x + r.w; i++) {
    const w = 160 + 120 * (hash1(i, 41) * 0.5 + 0.5);
    const h = 70 + 70 * (hash1(i, 42) * 0.5 + 0.5);
    c.fillRect(x, CAFE.slab - 40 - h, w - 12, h + 60);
    x += w;
  }
  c.fillStyle = withAlpha(m.halo, 0.22);
  for (let i = 0; i < 60; i++) {
    const x = r.x + ((hash1(i, 43) * 0.5 + 0.5) * r.w);
    const y = CAFE.slab - 60 - (hash1(i, 44) * 0.5 + 0.5) * 90;
    c.fillRect(x, y, 6, 4);
  }
  forestBand(c, { x0: r.x, x1: r.x + r.w, y: CAFE.slab - 10, h: 210, kind: 'leafy', density: 1.6, seed: 2016, ground: 80 }, env);
}

export function cafeGlassWall(c: C, env: PaintEnv, r: R4) {
  const m = env.mood;
  const set = env.fill('set');
  const wall = new Path2D();
  wall.rect(r.x, r.y, r.w, r.h);
  const x0 = Math.floor((r.x - 40) / CAFE.bay) * CAFE.bay;
  for (let x = x0; x < r.x + r.w; x += CAFE.bay) {
    // two panes per bay: the tall lower pane and the clerestory above the transom
    wall.rect(x + 7, CAFE.soffit + 18, CAFE.bay - 14, CAFE.transom - CAFE.soffit - 26);
    wall.rect(x + 7, CAFE.transom + 8, CAFE.bay - 14, CAFE.slab - CAFE.transom - 14);
  }
  c.fillStyle = set;
  c.fill(wall, 'evenodd');
  // the soffit (darker) and a thin glint along each mullion's sun side
  c.fillStyle = mixLab(set, m.fg, 0.35);
  c.fillRect(r.x, r.y, r.w, CAFE.soffit - r.y);
  c.fillStyle = withAlpha(m.rim, 0.18);
  for (let x = x0; x < r.x + r.w; x += CAFE.bay) c.fillRect(x + 5, CAFE.soffit + 18, 1.2, CAFE.slab - CAFE.soffit - 22);
}

const diner = createPuppet({ id: 'ch10-diner-a', height: 312, build: 'average', era: '2010s', wardrobe: 'hoodie', hair: 'messy', facialHair: 'none', glasses: 'none', hat: 'none', prop: 'none' });
const diner2 = createPuppet({ id: 'ch10-diner-b', height: 300, build: 'slight', era: '2010s', wardrobe: 'tshirt:f', hair: 'ponytail', facialHair: 'none', glasses: 'none', hat: 'none', prop: 'none' });
export const DINERS: Puppet[] = [diner, diner2];

export function cafeBack(c: C, env: PaintEnv, r: R4) {
  const m = env.mood;
  const ink = env.fill('ink');
  const set = env.fill('set');
  // the floor: polished, catching the windows as soft vertical streaks
  const g = c.createLinearGradient(0, CAFE.slab, 0, r.y + r.h);
  g.addColorStop(0, mixLab(set, m.haze, 0.25));
  g.addColorStop(0.3, set);
  g.addColorStop(1, mixLab(set, m.fg, 0.6));
  c.fillStyle = g;
  c.fillRect(r.x, CAFE.slab, r.w, r.y + r.h - CAFE.slab);
  const x0 = Math.floor((r.x - 40) / CAFE.bay) * CAFE.bay;
  for (let x = x0; x < r.x + r.w; x += CAFE.bay) {
    const sg = c.createLinearGradient(0, CAFE.slab, 0, CAFE.slab + 120);
    sg.addColorStop(0, withAlpha(m.sky[3], 0.22));
    sg.addColorStop(1, withAlpha(m.sky[3], 0));
    c.fillStyle = sg;
    c.fillRect(x + 12, CAFE.slab, CAFE.bay - 24, 120);
  }
  // a serving counter at right with stools
  c.fillStyle = ink;
  c.fillRect(1040, 452, 520, 12);
  c.fillRect(1052, 464, 496, 90);
  for (let i = 0; i < 4; i++) {
    const x = 1080 + i * 120;
    c.fillRect(x - 18, 494, 36, 6);
    c.fillRect(x - 2, 500, 4, 48);
    c.fillRect(x - 14, 546, 28, 3);
  }
  // a far table with two diners (texture, not characters), kept LEFT of the lunch table's near sitter so no head
  // or arm sits behind his shoulder (the far table's right end is empty: a cup and a pushed-back chair)
  c.fillRect(-10, 470, 230, 8);
  c.fillRect(0, 478, 6, 70);
  c.fillRect(204, 478, 6, 70);
  c.fillRect(150, 462, 10, 8);
  c.fillRect(250, 506, 30, 4);
  c.fillRect(272, 470, 4, 40);
  c.fillRect(252, 510, 4, 38);
  const sit = POSES.sit;
  diner.draw(c, { x: -40, y: 548, facing: 'right', pose: { ...sit, angles: { ...sit.angles, torso: 6, shoulderF: 30, elbowF: 80 } }, scale: 0.62 }, env);
  diner2.draw(c, { x: 236, y: 548, facing: 'left', pose: { ...sit, angles: { ...sit.angles, torso: 4, shoulderF: 26, elbowF: 84 } }, scale: 0.6 }, env);
}

export function pendant(c: C, env: PaintEnv, x: number, y: number, len: number, s = 1) {
  const ink = env.fill('ink');
  c.strokeStyle = ink;
  c.lineWidth = 1.2 * s;
  c.beginPath();
  c.moveTo(x, y - len);
  c.lineTo(x, y);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - 30 * s, y + 26 * s);
  c.quadraticCurveTo(x - 28 * s, y, x, y - 2 * s);
  c.quadraticCurveTo(x + 28 * s, y, x + 30 * s, y + 26 * s);
  c.closePath();
  c.fill();
}

export interface TableOpts {
  x0: number;
  x1: number;
  top: number;
  floor: number;
}
export function cafeTable(c: C, env: PaintEnv, o: TableOpts, ink: string) {
  const m = env.mood;
  c.fillStyle = ink;
  c.fillRect(o.x0, o.top, o.x1 - o.x0, 12);
  // trestle legs and a stretcher
  for (const lx of [o.x0 + 50, o.x1 - 50]) {
    c.beginPath();
    c.moveTo(lx - 5, o.top + 12);
    c.lineTo(lx + 5, o.top + 12);
    c.lineTo(lx + 22, o.floor);
    c.lineTo(lx + 12, o.floor);
    c.lineTo(lx, o.top + 40);
    c.lineTo(lx - 12, o.floor);
    c.lineTo(lx - 22, o.floor);
    c.closePath();
    c.fill();
  }
  c.fillRect(o.x0 + 50, o.top + 70, o.x1 - o.x0 - 100, 5);
  // trays with plates, a bowl, cups, a water glass (pierced: the glass is a rim stroke)
  const trays = [o.x0 + 70, o.x1 - 190];
  for (const tx of trays) {
    c.fillRect(tx, o.top - 5, 124, 5);
    c.fillRect(tx + 12, o.top - 9, 52, 4);
    c.beginPath();
    c.ellipse(tx + 92, o.top - 9, 18, 9, 0, Math.PI, 0);
    c.fill();
  }
  // cups
  for (const cx of [o.x0 + 220, o.x1 - 236]) {
    c.fillRect(cx, o.top - 22, 16, 22);
    c.strokeStyle = ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(cx + 18, o.top - 12, 5, -Math.PI / 2, Math.PI / 2);
    c.stroke();
  }
  // a glass (stroke only, rim-lit)
  c.strokeStyle = withAlpha(m.rim, 0.6);
  c.lineWidth = 1.4;
  c.strokeRect(o.x0 + (o.x1 - o.x0) * 0.62, o.top - 30, 14, 30);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(o.x0 + 2, o.top - 0.5, o.x1 - o.x0 - 4, 1.2);
}

/** a bentwood-style cafe chair in profile: seat, curved back, four legs (two visible) */
export function cafeChair(c: C, ink: string, x: number, floor: number, seatY: number, facing: 'left' | 'right') {
  const d = facing === 'right' ? -1 : 1; // the back is behind the sitter
  c.fillStyle = ink;
  c.fillRect(x - 26, seatY, 52, 7);
  c.beginPath();
  c.moveTo(x + d * 22, seatY);
  c.quadraticCurveTo(x + d * 34, seatY - 60, x + d * 26, seatY - 120);
  c.lineTo(x + d * 20, seatY - 120);
  c.quadraticCurveTo(x + d * 27, seatY - 60, x + d * 16, seatY);
  c.closePath();
  c.fill();
  c.fillRect(x - d * 22 - 2.5, seatY + 7, 5, floor - seatY - 7);
  c.beginPath();
  c.moveTo(x + d * 18, seatY + 7);
  c.lineTo(x + d * 24, seatY + 7);
  c.lineTo(x + d * 30, floor);
  c.lineTo(x + d * 25, floor);
  c.closePath();
  c.fill();
  c.fillRect(x - 22, seatY + (floor - seatY) * 0.6, 44, 3);
}

/** a cut-paper hand reaching down from the top edge (sleeve, cuff, the back of the hand, three curled fingers, and the
 *  index finger and thumb meeting in a pinch at (x, y) when pinch = 1, like a puppeteer holding a marionette string).
 *  Dark cut paper at about 60% (one flat shape, so overlaps do not stack), a thin rim on its edge, like the narrator
 *  hands set: the storyteller's hand, in the film's own medium, not a figure in the room. */
export function paperHand(c: C, env: PaintEnv, x: number, y: number, s: number, pinch: number) {
  const m = env.mood;
  const fill = mixLab(mixLab(env.fill('ink'), m.fg, 0.5), m.haze, 0.4);
  const edge = withAlpha(m.rim, 0.75);
  const cutC = withAlpha(m.rim, 0.28);
  const k = Math.max(0, Math.min(1, pinch));
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // sleeve from above the frame, a turned-back cuff
  const sleeve = new Path2D();
  sleeve.moveTo(4, -900);
  sleeve.lineTo(48, -900);
  sleeve.lineTo(44, -128);
  sleeve.lineTo(10, -124);
  sleeve.closePath();
  const cuff = new Path2D();
  cuff.moveTo(6, -132);
  cuff.lineTo(48, -136);
  cuff.lineTo(46, -112);
  cuff.lineTo(8, -108);
  cuff.closePath();
  // the back of the hand: from the wrist, widening to the knuckles, tipping down toward the pinch
  const back = new Path2D();
  back.moveTo(12, -110);
  back.bezierCurveTo(4, -92, -6, -74, -10, -56);
  back.bezierCurveTo(-12, -46, -6, -40, 2, -40);
  back.lineTo(30, -44);
  back.bezierCurveTo(40, -58, 44, -84, 42, -110);
  back.closePath();
  // three curled fingers tucked under the palm (middle, ring, little)
  const curl = new Path2D();
  for (const [cx, cy, r] of [[8, -36, 9], [19, -38, 8.5], [29, -42, 7.5]] as const) {
    curl.moveTo(cx + r, cy);
    curl.ellipse(cx, cy, r, r * 1.15, 0.3, 0, Math.PI * 2);
  }
  // index finger: three segments from the knuckle down to the tip; open → apart, pinch → tip at (0, 0)
  const tipI = { x: -9 * (1 - k) - 1 * k, y: 2 * (1 - k) };
  const idx = new Path2D();
  const j1 = { x: -8, y: -52 }, j2 = { x: -12 + 3 * k, y: -28 }, j3 = { x: -9 + 5 * k, y: -11 };
  const seg = (p: Path2D, a: { x: number; y: number }, b: { x: number; y: number }, w0: number, w1: number) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    p.moveTo(a.x + nx * w0, a.y + ny * w0);
    p.lineTo(b.x + nx * w1, b.y + ny * w1);
    p.arc(b.x, b.y, w1, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, false);
    p.lineTo(a.x - nx * w0, a.y - ny * w0);
    p.closePath();
  };
  seg(idx, j1, j2, 6, 5.2);
  seg(idx, j2, j3, 5.2, 4.6);
  seg(idx, j3, tipI, 4.6, 4);
  // thumb: from the palm's lower side, angled to meet the index tip
  const tipT = { x: 12 * (1 - k) + 2 * k, y: 0 };
  const th = new Path2D();
  const t1 = { x: 30, y: -62 }, t2 = { x: 18 - 4 * k, y: -26 };
  seg(th, t1, t2, 7.5, 5.8);
  seg(th, t2, tipT, 5.8, 4.6);
  // the rim first (every part's edge stroked), then every part filled OPAQUE on top: the fill covers the inner half
  // of each stroke and every seam inside the hand, so only a thin rim on the silhouette's outer contour survives.
  // The fill is pre-blended toward the haze (about 60% ink), so it reads as translucent dark paper without parts
  // stacking where they overlap.
  c.strokeStyle = edge;
  c.lineWidth = 2.6 / s;
  for (const p of [sleeve, cuff, back, curl, idx, th]) c.stroke(p);
  c.fillStyle = fill;
  for (const p of [sleeve, cuff, back, curl, idx, th]) c.fill(p);
  // knife cuts: knuckle creases and a nail on the index and thumb
  c.strokeStyle = cutC;
  c.lineWidth = 1 / s;
  c.beginPath();
  c.moveTo(-2, -58);
  c.quadraticCurveTo(6, -60, 12, -57);
  c.moveTo(j2.x - 4, j2.y - 1);
  c.lineTo(j2.x + 4, j2.y + 1);
  c.moveTo(t2.x - 4, t2.y);
  c.lineTo(t2.x + 4, t2.y + 2);
  c.stroke();
  c.restore();
}
