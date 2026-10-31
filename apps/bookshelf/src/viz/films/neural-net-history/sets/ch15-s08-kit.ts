/**
 * ch15-s08 — pieces for the verdict shot (the board becomes a network; the shelf becomes a bar chart in wax).
 *
 *   brassMicroscope(c, { x, y, s, tilt, light }, env)   a 19th-century brass monocular in profile on its horseshoe
 *        foot: pillar, inclination joint, curved limb, stage and mirror, the body tube with objective and eyepiece.
 *        tilt (radians) tips everything above the joint (- leans the tube left, toward a thing it is turned on);
 *        light 0..1 brings up the lamp's brass glints on its tops. (x, y) = the middle of the foot on its surface.
 *        Returns the objective's world point (where the lens looks from).
 *   NET                         the board as a network: nodes (clue cards → lanterns) by column, edges, the dark one
 *   pickOut(c, env, x, y0, y1, k)   a narrow beam of the lamp's light picking out one candle (additive)
 *   pinGlint(c, env, x, y, k)       a small four-point glint on a brass pin (additive)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { SLOTS, type SlotId } from './studyState';
import { STUDY } from './study';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ===================================================================================================== microscope
export interface MicroscopeOpts {
  x: number;
  y: number;
  s?: number;
  /** tip of the upper assembly about the inclination joint (radians, + = clockwise) */
  tilt?: number;
  /** lamp light on the brass, 0..1 */
  light?: number;
}
let MIC: { foot: Path2D; upper: Path2D; cuts: Path2D; glints: Path2D } | null = null;
function micGeo() {
  if (MIC) return MIC;
  const foot = new Path2D();
  // the horseshoe foot seen side-on: a low plinth with a chamfered toe and heel
  foot.moveTo(-46, 0);
  foot.lineTo(-40, -9);
  foot.lineTo(36, -9);
  foot.lineTo(44, 0);
  foot.closePath();
  // the pillar rising from the foot to the joint, with a collar
  foot.rect(-6, -44, 12, 36);
  foot.rect(-9, -16, 18, 6);
  foot.moveTo(9, -52);
  foot.arc(0, -52, 9, 0, Math.PI * 2);
  // the mirror on its fork, under where the stage sits
  const upper = new Path2D();
  // (upper assembly: local to the joint at (0,0); untilted the tube stands upright)
  // the curved limb: a thick C from the joint up and round to the tube's rack
  upper.moveTo(-5, 2);
  upper.bezierCurveTo(24, -6, 34, -50, 18, -96);
  upper.lineTo(8, -96);
  upper.bezierCurveTo(22, -54, 14, -14, -5, -8);
  upper.closePath();
  // the stage: a square plate on the limb, with its clips
  upper.rect(-42, -24, 54, 7);
  upper.rect(-36, -28, 10, 4);
  upper.rect(-8, -28, 10, 4);
  // the substage mirror, swung below the stage
  upper.rect(-14, -17, 3, 9);
  upper.moveTo(-3, -6);
  upper.ellipse(-12, -6, 10, 3.2, 0, 0, Math.PI * 2);
  // the body tube (upright when untilted), the objective below, the draw tube and eyepiece above
  upper.rect(-21, -128, 18, 84);
  upper.rect(-17, -44, 10, 10);
  upper.rect(-15, -34, 6, 5);
  upper.rect(-19, -140, 14, 12);
  upper.rect(-24, -146, 24, 7);
  // the rack and the coarse-focus milled head
  upper.rect(-3, -110, 8, 40);
  upper.moveTo(19, -86);
  upper.arc(10, -86, 9, 0, Math.PI * 2);
  // cut-lines (rim): tube bands, the knurl, the stage edge
  const cuts = new Path2D();
  for (const y of [-120, -96, -70, -52]) {
    cuts.moveTo(-21, y);
    cuts.lineTo(-3, y);
  }
  for (let i = -3; i <= 3; i++) {
    cuts.moveTo(10 + i * 2.4, -95);
    cuts.lineTo(10 + i * 2.4, -77);
  }
  cuts.moveTo(-42, -21);
  cuts.lineTo(12, -21);
  // brass glints along the lamp-side edges (light comes from the right)
  const glints = new Path2D();
  glints.moveTo(-3, -126);
  glints.lineTo(-3, -46);
  glints.moveTo(0, -145);
  glints.lineTo(0, -139);
  glints.moveTo(20, -90);
  glints.bezierCurveTo(30, -50, 22, -8, -2, 0);
  MIC = { foot, upper, cuts, glints };
  return MIC;
}
/** the objective's position in the upper assembly (untilted, local to the joint) */
const OBJ: P = { x: -12, y: -30 };
const JOINT: P = { x: 0, y: -52 };

export function brassMicroscope(c: C, o: MicroscopeOpts, env: PaintEnv): P {
  const g = micGeo();
  const s = o.s ?? 1;
  const tilt = o.tilt ?? 0;
  const light = o.light ?? 1;
  const ink = env.fill('ink');
  const brass = mixLab(env.mood.halo, env.mood.core, 0.35);
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = ink;
  c.fill(g.foot);
  c.save();
  c.translate(JOINT.x, JOINT.y);
  c.rotate(tilt);
  c.fillStyle = ink;
  c.fill(g.upper, 'nonzero');
  c.strokeStyle = withAlpha(env.mood.rim, 0.3 + 0.25 * light);
  c.lineWidth = 0.9 / s;
  c.stroke(g.cuts);
  if (light > 0.01) {
    c.strokeStyle = withAlpha(brass, 0.7 * light);
    c.lineWidth = 1.4 / s;
    c.stroke(g.glints);
  }
  c.restore();
  // a glint on the foot's top edge
  if (light > 0.01) {
    c.fillStyle = withAlpha(brass, 0.55 * light);
    c.fillRect(-40, -9.6, 76, 1.2);
  }
  c.restore();
  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  return { x: o.x + (JOINT.x + OBJ.x * cs - OBJ.y * sn) * s, y: o.y + (JOINT.y + OBJ.x * sn + OBJ.y * cs) * s };
}

// ===================================================================================================== the network
export interface NetNode {
  id: SlotId | 'DARK';
  /** world (L4) centre of the card / lantern */
  x: number;
  y: number;
  /** world pin point (the lantern hangs from it) */
  pin: P;
  /** lantern body half-height (world px) */
  r: number;
  /** network column 0 (input) … 5 (output) */
  col: number;
}
const B = STUDY.board;
const worldOf = (id: SlotId) => ({ x: B.x + SLOTS[id].x * B.k, y: B.y + SLOTS[id].y * B.k });
const pinOf = (id: SlotId) => ({ x: B.x + SLOTS[id].x * B.k, y: B.y + (SLOTS[id].y - SLOTS[id].h / 2 + 7) * B.k });
/** clue columns, left to right (C1 the input; the chat box O the output) */
export const NET_COLUMNS: SlotId[][] = [
  ['C1', 'C1-a', 'C1-b', 'C1-c'],
  ['C2-a', 'C2-h', 'C2-b', 'C2-row', 'C2-d'],
  ['C3-a', 'C3-b', 'C3-c', 'C3-d'],
  ['C4-lineage', 'C4-a', 'C4-b'],
];
export const CLUE_IDS: SlotId[] = NET_COLUMNS.flat();
function nodeOf(id: SlotId, col: number): NetNode {
  const S = SLOTS[id];
  const w = worldOf(id);
  const r = Math.min(30, Math.max(17, S.h * 0.3));
  return { id, x: w.x, y: w.y + 4, pin: pinOf(id), r, col: col * 2 };
}
export const NET: NetNode[] = NET_COLUMNS.flatMap((ids, i) => ids.map((id) => nodeOf(id, i)));
/** the one lantern that never lights: it hangs from the case card's own pin, behind WHO TAUGHT IT? */
export const DARK: NetNode = (() => {
  const w = worldOf('K');
  return { id: 'DARK', x: w.x, y: w.y + 6, pin: pinOf('K'), r: 36, col: 3 };
})();
/** the output: the glowing chat box (slot O) */
export const OUT: P = worldOf('O');
export interface NetEdge {
  a: NetNode | P;
  b: NetNode | P;
  /** the wave crosses it from colA to colB */
  colA: number;
  colB: number;
  /** a string to the dark lantern: it never carries light */
  dark?: boolean;
}
export const EDGES: NetEdge[] = (() => {
  const out: NetEdge[] = [];
  const byCol = NET_COLUMNS.map((_, i) => NET.filter((n) => n.col === i * 2));
  for (let i = 0; i < byCol.length - 1; i++) for (const a of byCol[i]) for (const b of byCol[i + 1]) out.push({ a, b, colA: i * 2, colB: (i + 1) * 2 });
  for (const a of byCol[3]) out.push({ a, b: OUT, colA: 6, colB: 8 });
  for (const a of byCol[1]) out.push({ a, b: DARK, colA: 2, colB: 3, dark: true });
  for (const b of byCol[2]) out.push({ a: DARK, b, colA: 3, colB: 4, dark: true });
  return out;
})();

// ===================================================================================================== light
/** a narrow upright beam of the lamp's light picking out one candle (additive; world coords) */
export function pickOut(c: C, env: PaintEnv, x: number, y0: number, y1: number, k: number, w = 26) {
  if (k <= 0.003) return;
  const col = mixLab(env.mood.core, env.mood.rim, 0.3);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const h = y1 - y0;
  const g = c.createRadialGradient(x, y0 + h * 0.55, 0, x, y0 + h * 0.55, h * 0.75);
  g.addColorStop(0, withAlpha(col, 0.16 * k));
  g.addColorStop(0.6, withAlpha(col, 0.06 * k));
  g.addColorStop(1, withAlpha(col, 0));
  c.translate(x, y0 + h * 0.55);
  c.scale(w / (h * 0.75) * 2.2, 1);
  c.translate(-x, -(y0 + h * 0.55));
  c.fillStyle = g;
  c.fillRect(x - h, y0 - h * 0.3, 2 * h, h * 1.7);
  c.restore();
}
/** a small four-point glint (a brass pin catching the lamp) */
export function pinGlint(c: C, env: PaintEnv, x: number, y: number, k: number, R = 9) {
  if (k <= 0.003) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const col = env.mood.core;
  const g = c.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, withAlpha(col, 0.85 * k));
  g.addColorStop(0.3, withAlpha(env.mood.halo, 0.35 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - R, y - R, 2 * R, 2 * R);
  c.strokeStyle = withAlpha(col, 0.55 * k);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x - R * 1.6, y);
  c.lineTo(x + R * 1.6, y);
  c.moveTo(x, y - R * 1.6);
  c.lineTo(x, y + R * 1.6);
  c.stroke();
  c.restore();
}
