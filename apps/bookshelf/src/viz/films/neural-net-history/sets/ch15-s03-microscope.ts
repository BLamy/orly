/**
 * ch15-s03 — the detective's brass microscope, one silhouette for every shot that shows it (ch15-s03's desk insert,
 * ch15-s08's tray under the board). Drawn from ch15-s08's design (review round 1, continuity): a 19th-century brass
 * monocular in profile on its horseshoe foot: pillar, inclination joint, a curved C-limb, a square stage with two
 * spring clips, the sub-stage mirror on its fork, the round body tube (banded) with the objective below and the draw
 * tube and eyepiece above, the rack, the milled coarse-focus head and the small fine-focus knob on the limb.
 *
 *   studyMicroscope(c, { x, y, s, tilt, light, stageW, lift, knob, glint }, env) → anchors (world)
 *     (x, y)   the middle of the foot on its surface
 *     s        scale (s08's tray: 1.28; s03's insert: 2)
 *     tilt     tips everything above the inclination joint (radians; - leans the tube left)
 *     light    0..1 the lamp's brass glints on the tops
 *     stageW   the stage's width in units (default 54, s08's; the insert widens it for its paper-forest slide)
 *     lift     raises the tube, limb top and focus heads by this many units (default 0): the insert's working
 *              distance, room for the specimen under the objective
 *     knob     rotation of the coarse-focus head (radians; one full turn = 2π) — its index notch shows the turn
 *     glint    which side the lamp is on: 1 = right (default), -1 = left
 *   Returns { objective, knob, stageTop, eyepiece, mirror } in world coordinates (untilted points are exact; with tilt
 *   they are rotated about the joint).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

export interface StudyMicroscopeOpts {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  light?: number;
  stageW?: number;
  /** the stage's centre in units (default -15, s08's: just left of the objective) */
  stageX?: number;
  lift?: number;
  knob?: number;
  glint?: 1 | -1;
  /** override the silhouette ink (default env.fill('ink')) */
  ink?: string;
}
export interface MicroscopeAnchors {
  objective: P;
  knob: P;
  stageTop: P;
  eyepiece: P;
  mirror: P;
}

/** the joint, local to the foot */
const JOINT: P = { x: 0, y: -52 };

interface Geo {
  foot: Path2D;
  upper: Path2D;
  cuts: Path2D;
  glintsR: Path2D;
  glintsL: Path2D;
}
const GEO = new Map<string, Geo>();
function geo(stageW: number, lift: number, stageX: number): Geo {
  const key = `${stageW}/${lift}/${stageX}`;
  const hit = GEO.get(key);
  if (hit) return hit;
  const L = lift;
  const foot = new Path2D();
  // the horseshoe foot seen side-on: a low plinth with a chamfered toe and heel
  foot.moveTo(-46, 0);
  foot.lineTo(-40, -9);
  foot.lineTo(36, -9);
  foot.lineTo(44, 0);
  foot.closePath();
  // the pillar rising from the foot to the joint, with a collar, and the joint's round boss
  foot.rect(-6, -44, 12, 36);
  foot.rect(-9, -16, 18, 6);
  foot.moveTo(9, -52);
  foot.arc(0, -52, 9, 0, Math.PI * 2);
  // (upper assembly: local to the joint at (0,0); untilted, the tube stands upright)
  const upper = new Path2D();
  // the curved limb: a thick C from the joint up and round to the tube's rack
  upper.moveTo(-5, 2);
  upper.bezierCurveTo(24, -6, 34, -50 - L * 0.6, 18, -96 - L);
  upper.lineTo(8, -96 - L);
  upper.bezierCurveTo(22, -54 - L * 0.6, 14, -14, -5, -8);
  upper.closePath();
  // the stage: a square plate on the limb (centred under the objective's side), its two spring clips
  const sx0 = stageX - stageW / 2;
  upper.rect(sx0, -24, stageW, 7);
  upper.rect(sx0 + 6, -28, 10, 4);
  upper.rect(sx0 + stageW - 22, -28, 10, 4);
  // the stage's front lip (a thin moulding under the plate)
  upper.rect(sx0 + 2, -17, stageW - 4, 2);
  // the substage mirror on its fork, swung below the stage
  upper.rect(-14, -15, 3, 7);
  upper.moveTo(-2, -6);
  upper.ellipse(-12, -6, 10, 3.2, 0, 0, Math.PI * 2);
  // the body tube (upright when untilted), the objective below, the draw tube and eyepiece with its cap above
  upper.rect(-21, -128 - L, 18, 84);
  upper.rect(-23, -50 - L, 22, 6); // nosepiece collar
  upper.rect(-17, -44 - L, 10, 10); // objective barrel
  upper.rect(-15, -34 - L, 6, 5); // objective tip
  upper.rect(-23, -131 - L, 22, 4); // the tube's top collar
  upper.rect(-19, -140 - L, 14, 10); // draw tube
  upper.rect(-24, -146 - L, 24, 7); // eyepiece cap
  // the rack on the limb's top, the coarse-focus milled head, the fine-focus knob low on the limb
  upper.rect(-3, -110 - L, 8, 40);
  upper.moveTo(19, -86 - L);
  upper.arc(10, -86 - L, 9, 0, Math.PI * 2);
  upper.moveTo(20, -30);
  upper.arc(16, -30, 4, 0, Math.PI * 2);
  // cut-lines (rim): tube bands, the objective's thread, the stage edge
  const cuts = new Path2D();
  for (const y of [-120, -96, -70, -52]) {
    cuts.moveTo(-21, y - L);
    cuts.lineTo(-3, y - L);
  }
  cuts.moveTo(-17, -39 - L);
  cuts.lineTo(-7, -39 - L);
  cuts.moveTo(sx0, -21);
  cuts.lineTo(sx0 + stageW, -21);
  // brass glints along the lamp-side edges, right-lit and left-lit versions
  const glintsR = new Path2D();
  glintsR.moveTo(-3, -126 - L);
  glintsR.lineTo(-3, -46 - L);
  glintsR.moveTo(0, -145 - L);
  glintsR.lineTo(0, -139 - L);
  glintsR.moveTo(20, -90 - L);
  glintsR.bezierCurveTo(30 + L * 0.05, -50 - L * 0.6, 22, -8, -2, 0);
  glintsR.moveTo(sx0 + 2, -24);
  glintsR.lineTo(sx0 + stageW - 2, -24);
  const glintsL = new Path2D();
  glintsL.moveTo(-21, -126 - L);
  glintsL.lineTo(-21, -46 - L);
  glintsL.moveTo(-24, -145 - L);
  glintsL.lineTo(-24, -139 - L);
  glintsL.moveTo(8, -94 - L);
  glintsL.bezierCurveTo(20, -54 - L * 0.6, 14, -14, -5, -8);
  glintsL.moveTo(sx0 + 2, -24);
  glintsL.lineTo(sx0 + stageW - 2, -24);
  const g = { foot, upper, cuts, glintsR, glintsL };
  GEO.set(key, g);
  return g;
}

export function studyMicroscope(c: C, o: StudyMicroscopeOpts, env: PaintEnv): MicroscopeAnchors {
  const s = o.s ?? 1;
  const tilt = o.tilt ?? 0;
  const light = o.light ?? 1;
  const stageW = o.stageW ?? 54;
  const L = o.lift ?? 0;
  const knob = o.knob ?? 0;
  const g = geo(stageW, L, o.stageX ?? -15);
  const ink = o.ink ?? env.fill('ink');
  const m = env.mood;
  const brass = mixLab(m.halo, m.core, 0.35);
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
  c.strokeStyle = withAlpha(m.rim, 0.3 + 0.25 * light);
  c.lineWidth = 0.9 / s;
  c.stroke(g.cuts);
  // the milled coarse-focus head: a knurl ring and an index notch that turns with the head
  const K = { x: 10, y: -86 - L };
  c.lineWidth = 0.8 / s;
  c.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + knob;
    c.moveTo(K.x + Math.cos(a) * 6.4, K.y + Math.sin(a) * 6.4);
    c.lineTo(K.x + Math.cos(a) * 9, K.y + Math.sin(a) * 9);
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.4), 0.45 + 0.4 * light);
  c.lineWidth = 1.4 / s;
  c.beginPath();
  c.moveTo(K.x + Math.cos(knob - Math.PI / 2) * 2, K.y + Math.sin(knob - Math.PI / 2) * 2);
  c.lineTo(K.x + Math.cos(knob - Math.PI / 2) * 7.5, K.y + Math.sin(knob - Math.PI / 2) * 7.5);
  c.stroke();
  if (light > 0.01) {
    c.strokeStyle = withAlpha(brass, 0.7 * light);
    c.lineWidth = 1.4 / s;
    c.stroke((o.glint ?? 1) > 0 ? g.glintsR : g.glintsL);
    // the knob's lit rim
    c.beginPath();
    c.arc(K.x, K.y, 8.6, (o.glint ?? 1) > 0 ? -Math.PI * 0.45 : Math.PI * 1.05, (o.glint ?? 1) > 0 ? Math.PI * 0.15 : Math.PI * 1.65);
    c.stroke();
  }
  c.restore();
  // a glint on the foot's top edge
  if (light > 0.01) {
    c.fillStyle = withAlpha(brass, 0.55 * light);
    c.fillRect(-40, -9.6, 76, 1.2);
  }
  c.restore();
  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  const W = (p: P): P => ({ x: o.x + (JOINT.x + p.x * cs - p.y * sn) * s, y: o.y + (JOINT.y + p.x * sn + p.y * cs) * s });
  return {
    objective: W({ x: -12, y: -29 - L }),
    knob: W({ x: 10, y: -86 - L }),
    stageTop: W({ x: o.stageX ?? -15, y: -28 }),
    eyepiece: W({ x: -12, y: -146 - L }),
    mirror: W({ x: -12, y: -6 }),
  };
}
