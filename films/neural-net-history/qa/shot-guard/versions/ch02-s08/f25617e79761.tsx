/**
 * ch02-s08 — the logic-machine candle's last light, 1959 → the study (candleAmber; a brief palette crossfade
 * in from Dartmouth's duskRose, never through black).
 *
 * THE STAGE (Edge of the Light): the great candle has burned sixteen rings down, its ghost sleeve of sixteen
 * rings above the flame. McCulloch and Pitts stand in its pool, facing the flame. At the front of the stage a
 * paper-cut frog sits on a lily pad, its large eye rimmed in amber.
 *   "fifty-nine"   date stamp 1959
 *   "features"     the frog's eye opens into an in-frame iris: a paper-cut retina lattice where many small cells
 *                  light in varied, overlapping clusters as a shadow (a small dark spot) passes; beside it, small and
 *                  plain, the logic lantern with its single wick; the paper's author card under the inset
 *   "brain"        behind the eye, the frog's brain (a faint paper-cut outline) stays dark while the clusters glow
 *   "candle"       the flame gutters
 *   "sixteen"      it goes out: a thread of smoke; the pool shrinks to nothing; Pitts lowers his head
 *   line end       REVERSE FLAME PUSH: the camera pushes into the dying wick's ember and comes out of the same
 *                  ember on the study shelf, pulling back: the stub at the far left, its dark sixteen-ring sleeve
 *   "name"         a tilt up to the board; the hands pin the clue card in C1 (a lantern with a wick, 1943)
 *   + .3           the X-ray column fades up between the board and the Wall: seven faint, empty bands; the
 *                  board's output card (the chat box) appears with it
 *   + .8           band 1 lights alone (threshold lanterns) and holds; it dims before the cut. The oxblood
 *                  question card sways on its thread.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, defineShot, dustMotes, overscan, mixLab, pose, softPlate, toLayer, toScreen, withAlpha, withLife, annotation, textColor, legibleSize } from '../../../film';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { cast, hands } from '../cast';
import { candleStage, floorShadow, stageSpot, type StageGeo } from '../sets/candleStage';
import { candleFlame } from '../sets/beliefCandle';
import { STUDY, slotWorld, studyCase, studyNear, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, xrayBandsAt, type CandleView } from '../sets/studyState';
import { DEFAULT_POOL, cardIcon, drawCard, oxblood, poolAt } from '../sets/caseBoard';
import { XRAY, xrayColumn, xrayGlowAt } from '../sets/xrayColumn';
import { HAND_LEN, handsEntry, type ArmPose } from '../sets/narratorHands';
import { chairBack } from '../sets/occluders';
import { paintContext, setPaintContext } from '../../../film/core/paintContext';
import { hcl } from 'd3';
import { hash1 } from '../../../film/core/frame';
import { clamp01, compositeSub, lerp, monotone, ordered, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch02-s08';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the stage
const CANDLE_X = 560;
const STAGE_S = 2.1;
const FROG = { x: 300, y: 666, s: 1.25 };
const START_VIEW = shelfStateAt(ID, 'start').find((v) => v.id === 'logic')!;
const END_SHELF = shelfStateAt(ID, 'end');
const RINGS = 16;
const STAGE_FLAME = candleFlame({ x: CANDLE_X, y: 640, view: { ...START_VIEW, rings: RINGS }, s: STAGE_S });
/** the stub on the study shelf (slot 0, far left) */
const STUB_X = STUDY.shelf.x + 60 * STUDY.shelf.s;
const STUB_WICK = { x: STUB_X, y: STUDY.shelf.y - (270 - RINGS * 6) - 6 };

const HOLD_PITTS: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 6, head: -10, shoulderF: 4, elbowF: 22, wristF: 4, shoulderB: -8, elbowB: 16 }, { handF: 'relaxed' });
const PITTS_DOWN: Pose = pose({ hipF: 5, kneeF: -5, hipB: -3, kneeB: -2, torso: 4, neck: 16, head: 16, shoulderF: 0, elbowF: 10, wristF: 6, shoulderB: -4, elbowB: 10 });
const HOLD_MCC: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: -3, neck: 4, head: -8, shoulderF: -22, elbowF: 48, wristF: 8, shoulderB: -20, elbowB: 50 }, { handF: 'fist', handB: 'fist' });

interface Beats {
  l2: number;
  /** "the frog's EYE": the iris opens */
  irisOpen: number;
  /** "SORTING": the shadow starts across the retina */
  sorting: number;
  pitts: number;
  stamp: number;
  eye: number;
  brain: number;
  gutter: number;
  out: number;
  cut: number;
  paper: number;
  name: number;
  xray: number;
  band: number;
  fade: number;
  pin0: number;
  pinDur: number;
  /** the tilt from the shelf up to C1 starts after "for Pitts at LEAST" (the stub's label has been read) */
  tilt: number;
  /** the soft in-shot dissolve from the C1 insert to the X-ray plate, as the hands leave frame */
  dis0: number;
  dis1: number;
}

// ------------------------------------------------------------------ the frog (paper-cut, profile, facing right)
const FROG_PATH = (() => {
  const p = new Path2D();
  // a SITTING frog: chest raised on straight forelegs, back sloping down to the folded haunch
  p.moveTo(-54, -4);
  p.bezierCurveTo(-62, -22, -50, -40, -26, -48);
  p.bezierCurveTo(-6, -56, 14, -66, 30, -70); // the back rising to the head
  p.bezierCurveTo(44, -73, 58, -66, 66, -56); // crown to snout
  p.bezierCurveTo(70, -50, 66, -44, 58, -42); // blunt snout, mouth corner
  p.bezierCurveTo(50, -38, 44, -32, 40, -24); // throat
  p.lineTo(30, -16);
  p.bezierCurveTo(10, -8, -20, -2, -54, -4);
  p.closePath();
  // the eye: a big round bump on the crown
  p.moveTo(46, -76);
  p.arc(32, -76, 14, 0, Math.PI * 2);
  // foreleg straight down to splayed fingers
  p.moveTo(34, -30);
  p.lineTo(42, -30);
  p.lineTo(44, -4);
  p.lineTo(54, 0);
  p.lineTo(56, 3);
  p.lineTo(46, 3);
  p.lineTo(40, 2);
  p.lineTo(30, 3);
  p.lineTo(34, -2);
  p.closePath();
  // the folded haunch and the long hind foot along the pad, toes spread
  p.moveTo(-6, -22);
  p.ellipse(-30, -22, 28, 20, -0.35, 0, Math.PI * 2);
  p.moveTo(-50, -2);
  p.bezierCurveTo(-36, -10, -6, -8, 12, -2);
  p.lineTo(24, -2);
  p.lineTo(28, 2);
  p.lineTo(18, 1);
  p.lineTo(22, 4);
  p.lineTo(-50, 4);
  p.closePath();
  return p;
})();
function frog(c: C, env: PaintEnv, light: number, t: number) {
  c.save();
  c.translate(FROG.x, FROG.y);
  // the lily pad: a flat paper disc with its notch, lit edge toward the candle
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.25);
  c.beginPath();
  c.ellipse(4, 4, 112, 15, 0, 0.18, Math.PI * 2 - 0.18);
  c.lineTo(4, 4);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.35 * light);
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(4, 4, 112, 15, 0, -0.9, 0.12);
  c.stroke();
  c.scale(FROG.s, FROG.s);
  // a slow throat breath (on the twos)
  const tq = Math.floor(t * 12) / 12;
  const br = 1 + 0.025 * Math.max(0, Math.sin(tq * 2.6));
  c.save();
  c.translate(42, -34);
  c.scale(1, br);
  c.translate(-42, 34);
  c.fillStyle = env.fill('ink');
  c.fill(FROG_PATH, 'nonzero');
  c.restore();
  // the eye: a rim of amber on the candle side, and a lit iris slit
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.85 * light);
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(32, -76, 12.5, -1.6, 0.9);
  c.stroke();
  c.fillStyle = withAlpha(env.mood.core, 0.75 * light);
  c.beginPath();
  c.ellipse(35, -76, 4.4, 2.3, 0, 0, Math.PI * 2);
  c.fill();
  // cut-lines: the mouth line, the thigh
  c.strokeStyle = withAlpha(env.mood.rim, 0.35 * light);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(62, -46);
  c.quadraticCurveTo(46, -50, 30, -58);
  c.moveTo(-52, -18);
  c.quadraticCurveTo(-38, -38, -8, -30);
  c.stroke();
  c.restore();
}
const FROG_EYE = { x: FROG.x + 32 * FROG.s, y: FROG.y - 76 * FROG.s };

// ------------------------------------------------------------------ the retina inset (screen-locked, in-frame iris)
const INSET = { x: 322, y: 214, r: 142 };
/** where the inset sits on screen, and how big: the design disc above (r 142) scaled to r 214 — a 428 px disc, a
 *  third of the frame's width (review: the frog's eye must be big enough to SEE the sorting) */
const DISP = { x: 330, y: 290, k: 214 / 142 };
const DISP_R = INSET.r * DISP.k;
/** cells: a hex lattice filling the whole eye cup (the retina lines the back of the eye: the disc is all retina) */
const CELLS = (() => {
  const out: { x: number; y: number; d: number }[] = [];
  const sp = 17;
  for (let j = -10; j <= 10; j++)
    for (let i = -10; i <= 10; i++) {
      const x = INSET.x + i * sp + (j % 2 ? sp / 2 : 0);
      const y = INSET.y + j * sp * 0.866;
      const d = Math.hypot(x - INSET.x, y - INSET.y);
      if (d > INSET.r - 8) continue;
      out.push({ x, y, d });
    }
  return out;
})();
function hexPath(c: C, x: number, y: number, r: number) {
  c.moveTo(x + r, y);
  for (let k = 1; k < 6; k++) c.lineTo(x + r * Math.cos((k * Math.PI) / 3), y + r * Math.sin((k * Math.PI) / 3));
  c.closePath();
}
// ------------------------------------------------------------------ the pond's paper planes (depth: L3 + L5)
/** a bulrush / reed blade (paper-cut): base at (x, y), height h, lean, optional cattail head */
function reed(c: C, x: number, y: number, h: number, lean: number, head: boolean, w = 3) {
  const tx = x + lean * h, ty = y - h;
  c.beginPath();
  c.moveTo(x - w, y);
  c.quadraticCurveTo(x + lean * h * 0.4 - w * 0.6, y - h * 0.55, tx, ty);
  c.quadraticCurveTo(x + lean * h * 0.4 + w * 0.6, y - h * 0.55, x + w, y);
  c.closePath();
  c.fill();
  if (head) {
    const hy = y - h * 0.78, hx = x + lean * h * 0.62;
    c.beginPath();
    c.ellipse(hx, hy, w * 1.9, h * 0.075, Math.atan(lean), 0, Math.PI * 2);
    c.fill();
  }
}
/** L3: bulrushes along the back of the stage, either side of the pool (soft, hazed, slower than the figures) */
function backReeds(f: Frame, c: C, env: PaintEnv, cams: Camera3[]) {
  const r = overscan(LAYERS.L3, cams, 60);
  f.cached(`${ID}/L3reeds/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.25);
    for (let i = 0; i < 70; i++) {
      const x = r.x + (i / 70) * r.w + hash1(i, 81) * 14;
      if (Math.abs(x - 600) < 150) continue; // the pool's centre stays open behind the candle
      const h = 70 + 80 * (hash1(i, 82) * 0.5 + 0.5);
      reed(cc, x, 600, h, hash1(i, 83) * 0.18, hash1(i, 84) > 0.35, 2.4);
    }
  }, { blur: 1.2 })(c, r.x, r.y);
}
/** L5: the paper stage's near lip (a dark band with a scalloped trim) and a clump of reeds at each front corner */
function nearLip(f: Frame, cams: Camera3[]) {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 80);
    f.cached(`${ID}/L5lip/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = env.fill('fg');
      const y0 = 748;
      cc.beginPath();
      cc.moveTo(r.x, r.y + r.h);
      cc.lineTo(r.x, y0);
      for (let x = r.x; x <= r.x + r.w; x += 36) cc.quadraticCurveTo(x + 18, y0 + 14, x + 36, y0);
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(env.mood.rim, 0.2);
      cc.fillRect(r.x, y0 - 1, r.w, 1.4);
      cc.fillStyle = env.fill('fg');
      for (let i = 0; i < 16; i++) {
        const left = i < 9;
        const x = left ? r.x + 20 + i * 16 + hash1(i, 91) * 10 : r.x + r.w - 40 - (i - 9) * 18 + hash1(i, 92) * 10;
        reed(cc, x, y0 + 6, 120 + 110 * (hash1(i, 93) * 0.5 + 0.5), (left ? 0.12 : -0.12) + hash1(i, 94) * 0.1, hash1(i, 95) > 0.4, 4.5);
      }
    }, { blur: 2.4 })(c, r.x, r.y);
  });
}

/** the passing shadow: a small fly's shadow crossing the eye's field, lower left to upper right, with little hops */
function bugAt(u: number) {
  const x = lerp(INSET.x - 124, INSET.x + 112, u);
  const y = lerp(INSET.y + 66, INSET.y - 62, u) + Math.sin(u * 11) * 7 - Math.abs(Math.sin(u * 23)) * 4;
  const dx = 236, dy = -128 + Math.cos(u * 11) * 77;
  return { x, y, ang: Math.atan2(dy, dx) };
}
/** the feature clusters the shadow sets off as it passes: each a DIFFERENT kind of detector (an edge-like streak,
 *  a small blob, a ring, a larger blob…), lighting at staggered times along its path and overlapping in time */
type Cluster = { u: number; kind: 'streak' | 'blob' | 'ring'; dx: number; dy: number; a?: number; r0?: number; r1?: number; len?: number; warm: boolean };
const CLUSTERS: Cluster[] = [
  { u: 0.2, kind: 'streak', dx: -4, dy: -24, a: 0.5, len: 74, warm: true },
  { u: 0.31, kind: 'blob', dx: 14, dy: 20, r1: 15, warm: false },
  { u: 0.42, kind: 'ring', dx: -10, dy: -22, r0: 13, r1: 24, warm: true },
  { u: 0.5, kind: 'blob', dx: 20, dy: 12, r1: 29, warm: false },
  { u: 0.6, kind: 'streak', dx: 2, dy: -26, a: -0.95, len: 84, warm: true },
  { u: 0.7, kind: 'ring', dx: 18, dy: 18, r0: 7, r1: 17, warm: false },
  { u: 0.8, kind: 'blob', dx: -12, dy: -18, r1: 19, warm: true },
  { u: 0.9, kind: 'streak', dx: 6, dy: 20, a: 0.15, len: 60, warm: false },
];
/** per cluster, the indices of its cells (precomputed) */
const CLUSTER_CELLS = CLUSTERS.map((k) => {
  const b = bugAt(k.u);
  const cx = b.x + k.dx, cy = b.y + k.dy;
  const ids: number[] = [];
  CELLS.forEach((cell, i) => {
    const px = cell.x - cx, py = cell.y - cy;
    if (k.kind === 'blob') {
      if (Math.hypot(px, py) <= (k.r1 ?? 16)) ids.push(i);
    } else if (k.kind === 'ring') {
      const d = Math.hypot(px, py);
      if (d >= (k.r0 ?? 10) && d <= (k.r1 ?? 20)) ids.push(i);
    } else {
      const ca = Math.cos(k.a ?? 0), sa = Math.sin(k.a ?? 0);
      const along = px * ca + py * sa, across = -px * sa + py * ca;
      if (Math.abs(along) <= (k.len ?? 70) / 2 && Math.abs(across) <= 7) ids.push(i);
    }
  });
  return ids;
});
/** a cluster's light at pass position u: quick rise, a hold, then it sinks to a low after-glow */
function clusterLight(k: Cluster, u: number) {
  const r = sm((u - (k.u - 0.03)) / 0.04);
  const fall = sm((u - (k.u + 0.13)) / 0.16);
  return r * (1 - 0.72 * fall);
}
/** the fly's shadow cut-out (wings, body, head, legs): drawn translucent, the lattice reads through it */
function bugShadow(c: C, m: Frame['mood'], x: number, y: number, ang: number, a: number) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.scale(1.5, 1.5);
  c.fillStyle = withAlpha(m.fg, 0.35 * a);
  c.strokeStyle = withAlpha(m.fg, 0.35 * a);
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(-2, 0, 9, 4.6, 0, 0, Math.PI * 2); // abdomen + thorax
  c.moveTo(11, 0);
  c.arc(8.5, 0, 3.6, 0, Math.PI * 2); // head
  c.moveTo(4, -3);
  c.ellipse(-4, -8, 10, 4, -0.5, 0, Math.PI * 2); // wings
  c.moveTo(4, 3);
  c.ellipse(-4, 8, 10, 4, 0.5, 0, Math.PI * 2);
  c.fill('nonzero');
  c.beginPath();
  for (const s of [-1, 1])
    for (const k of [-1, 0, 1]) {
      c.moveTo(2 + k * 3, 3 * s);
      c.lineTo(4 + k * 5, 9 * s);
      c.lineTo(6 + k * 6, 11 * s);
    }
  c.stroke();
  c.restore();
}
function retinaInset(c: C, m: Frame['mood'], t: number, b: Beats, frogScreen: { x: number; y: number }) {
  // the eye opens on "the frog's EYE" and holds through "the eye itself already sorting the world, picking out
  // features before the brain saw a thing"; it closes as L0219 begins
  const open = win(t, b.irisOpen - 0.2, b.irisOpen + 0.45);
  const close = win(t, b.l2 + 0.05, b.l2 + 0.55);
  const A = open * (1 - close);
  if (A <= 0) return;
  const tq = tq12(t);
  const r = INSET.r * (0.15 + 0.85 * open) * (1 - 0.15 * close);
  c.save();
  // draw in the design space of the r-142 disc, placed and scaled on screen by DISP
  c.translate(DISP.x, DISP.y);
  c.scale(DISP.k, DISP.k);
  c.translate(-INSET.x, -INSET.y);
  frogScreen = { x: INSET.x + (frogScreen.x - DISP.x) / DISP.k, y: INSET.y + (frogScreen.y - DISP.y) / DISP.k };
  c.globalAlpha = A;
  // the frog's brain BEHIND the eye: drawn first (screen space, outside the disc), so the disc overlaps its front;
  // it never lights. The optic nerve leaves the eye cup through the disc's edge and runs to the optic tectum.
  c.save();
  c.setTransform(c.getTransform().scale(1 / DISP.k, 1 / DISP.k).translate(-DISP.x + INSET.x * DISP.k, -DISP.y + INSET.y * DISP.k));
  frogBrain(c, m, BRAIN.x, BRAIN.y, BRAIN.s);
  c.restore();
  // the connector: two fine lines from the frog's eye to the iris (it is HIS eye, magnified)
  c.strokeStyle = withAlpha(m.rim, 0.45);
  c.lineWidth = 0.7;
  const ang = Math.atan2(frogScreen.y - INSET.y, frogScreen.x - INSET.x);
  for (const s of [-1, 1]) {
    const a = ang + (s * Math.PI) / 2.6;
    c.beginPath();
    c.moveTo(INSET.x + Math.cos(a) * r, INSET.y + Math.sin(a) * r);
    c.lineTo(frogScreen.x, frogScreen.y);
    c.stroke();
  }
  // the disc: dark paper with a fine lit ring
  softPlate(c, INSET.x, INSET.y + 10, r * 2.9, r * 2.6, m.ink, 0.55);
  c.beginPath();
  c.arc(INSET.x, INSET.y, r, 0, Math.PI * 2);
  c.fillStyle = withAlpha(mixLab(m.ink, m.set, 0.35), 0.96);
  c.fill();
  c.save();
  c.clip();
  // one slow pass of the fly's shadow: it enters on "sorting", crosses the densest clusters around "picking out
  // features", and is still setting off clusters on "brain" (while the brain stays dark)
  const u = clamp01((tq - (b.sorting - 0.15)) / (b.brain + 1.25 - (b.sorting - 0.15)));
  const live = win(t, b.sorting - 0.2, b.sorting + 0.3);
  // the cells answer faintly while the shadow enters ("sorting the world"); full strength from "features" - 0.2
  const gain = 0.4 + 0.6 * win(t, b.eye - 0.45, b.eye - 0.2);
  const lightOf = new Float32Array(CELLS.length);
  const warmOf = new Uint8Array(CELLS.length);
  CLUSTERS.forEach((k, ci) => {
    const v = clusterLight(k, u);
    if (v <= 0.01) return;
    for (const i of CLUSTER_CELLS[ci]) {
      // each cell its own flicker (a detector, not a lamp)
      const fl = 0.85 + 0.15 * Math.sin(tq * 9 + i * 1.7);
      const w = v * fl;
      if (w > lightOf[i]) {
        lightOf[i] = w;
        warmOf[i] = k.warm ? 1 : 0;
      }
    }
  });
  for (let i = 0; i < CELLS.length; i++) {
    const cell = CELLS[i];
    // a soft radial falloff at the rim (the cup curves away), no void anywhere
    const rimFall = 1 - 0.45 * sm((cell.d - (INSET.r - 46)) / 38);
    c.beginPath();
    hexPath(c, cell.x, cell.y, 7.4);
    c.fillStyle = withAlpha(mixLab(m.set, m.ink, 0.35 * (1 - rimFall)), 0.9);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.16 * rimFall);
    c.lineWidth = 0.7;
    c.stroke();
    const v = live * gain * lightOf[i];
    if (v > 0.03) {
      c.beginPath();
      hexPath(c, cell.x, cell.y, 6.6);
      c.fillStyle = withAlpha(warmOf[i] ? m.core : mixLab(m.halo, m.rim, 0.35), Math.min(1, 0.3 + 0.85 * v));
      c.fill();
    }
  }
  // the nerve fibres run over the retina's surface to the optic nerve's exit at the disc's edge (toward the brain)
  c.strokeStyle = withAlpha(m.rim, 0.13);
  c.lineWidth = 0.8;
  for (let k = 0; k < 7; k++) {
    c.beginPath();
    c.moveTo(INSET.x - 70, INSET.y - 66 + k * 22);
    c.quadraticCurveTo(INSET.x + 40, INSET.y + (k - 3) * 9, NERVE_EXIT.x, NERVE_EXIT.y + (k - 3) * 1.5);
    c.stroke();
  }
  // the lit clusters bloom a little (several at once, overlapping: far more than one wick)
  c.globalCompositeOperation = 'lighter';
  CLUSTERS.forEach((k, ci) => {
    const v = live * gain * clusterLight(k, u);
    if (v <= 0.02 || !CLUSTER_CELLS[ci].length) return;
    let sx = 0, sy = 0;
    for (const i of CLUSTER_CELLS[ci]) {
      sx += CELLS[i].x;
      sy += CELLS[i].y;
    }
    const n = CLUSTER_CELLS[ci].length;
    const gx = sx / n, gy = sy / n, R = 22 + Math.sqrt(n) * 7;
    const g = c.createRadialGradient(gx, gy, 2, gx, gy, R);
    g.addColorStop(0, withAlpha(k.warm ? m.halo : mixLab(m.halo, m.rim, 0.4), 0.2 * v));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(gx - R, gy - R, 2 * R, 2 * R);
  });
  c.globalCompositeOperation = 'source-over';
  // the passing shadow itself: a fly's shadow at ~35%, the lattice (and its lighting) showing through it
  const bug = bugAt(u);
  bugShadow(c, m, bug.x, bug.y, bug.ang, live * (1 - sm((u - 0.94) / 0.06)));
  c.restore();
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(INSET.x, INSET.y, r, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  // light pulses run from the cup along the optic nerve toward the brain, which stays dark
  nervePulses(c, m, t, b, A);
  // beside it, plain (screen space, unscaled): the logic lantern with its single wick (lit, all or none); on
  // "features" it lifts for a beat, so the eye compares ONE wick with the many clusters
  const rs = r * DISP.k;
  const lx = DISP.x + rs * Math.cos(-0.62) + 70, ly = DISP.y + rs * Math.sin(-0.62) + 20;
  const lift = win(t, b.eye - 0.12, b.eye + 0.06) * (1 - win(t, b.eye + 0.32, b.eye + 0.6));
  c.save();
  c.globalAlpha = A;
  c.strokeStyle = withAlpha(m.rim, 0.4);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(lx, ly - 84);
  c.lineTo(lx, ly - 40);
  c.stroke();
  c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(lx, ly, 2, lx, ly, 70);
  lg.addColorStop(0, withAlpha(m.halo, 0.12 + 0.38 * lift));
  lg.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = lg;
  c.fillRect(lx - 70, ly - 70, 140, 140);
  c.globalCompositeOperation = 'source-over';
  cardIcon(c, 'threshold-lantern', lx, ly, 90, { mood: m } as PaintEnv, mixLab(m.ink, m.set, 0.2), { lit: Math.min(1, 0.75 + 0.25 * lift), light: m.core });
  c.restore();
}

/** the brain sits behind the eye (screen px): its front lobes tucked behind the disc's right edge */
const BRAIN = { x: 596, y: 356, s: 0.95 };
/** where the optic nerve leaves the disc (design space of the r-142 disc) */
const NERVE_EXIT = { x: INSET.x + INSET.r - 4, y: INSET.y + 26 };
const toDisp = (p: { x: number; y: number }) => ({ x: DISP.x + (p.x - INSET.x) * DISP.k, y: DISP.y + (p.y - INSET.y) * DISP.k });
/** a frog's brain, dorsal view, nose to the left (toward the eye): paired olfactory bulbs, paired cerebral
 *  hemispheres, the two round optic lobes (the tectum, where the eye's fibres arrive), a thin cerebellum and the
 *  medulla tapering into the cord. Dark paper with a faint rim: it does not light. */
const BRAIN_PATH = (() => {
  const p = new Path2D();
  const pair = (cx: number, dy: number, rx: number, ry: number, rot: number) => {
    p.moveTo(cx + rx, -dy);
    p.ellipse(cx, -dy, rx, ry, -rot, 0, Math.PI * 2);
    p.moveTo(cx + rx, dy);
    p.ellipse(cx, dy, rx, ry, rot, 0, Math.PI * 2);
  };
  pair(-62, 8, 12, 7, 0.15); // olfactory bulbs
  pair(-24, 13, 32, 13, 0.08); // cerebral hemispheres
  pair(26, 17, 19, 16, 0); // optic lobes (tectum)
  p.moveTo(46, -20);
  p.quadraticCurveTo(52, 0, 46, 20);
  p.lineTo(54, 20);
  p.quadraticCurveTo(60, 0, 54, -20);
  p.closePath(); // cerebellum band
  p.moveTo(52, -15);
  p.quadraticCurveTo(76, -10, 104, -4);
  p.lineTo(104, 4);
  p.quadraticCurveTo(76, 10, 52, 15);
  p.closePath(); // medulla → cord
  return p;
})();
/** the frog's skull seen from above (snout to the left, toward the eye), a faint DOTTED cut-line around the brain
 *  so it reads as the frog's own head: the orbits are the two notches, the cord leaves at the back */
const SKULL_PATH = (() => {
  const p = new Path2D();
  const half = (sg: number) => {
    p.bezierCurveTo(-122, -24 * sg, -104, -40 * sg, -86, -46 * sg);
    p.bezierCurveTo(-70, -30 * sg, -34, -30 * sg, -16, -50 * sg); // the orbit's notch
    p.bezierCurveTo(14, -66 * sg, 56, -62 * sg, 76, -44 * sg);
    p.bezierCurveTo(92, -30 * sg, 96, -16 * sg, 100, -10 * sg);
    p.lineTo(126, -8 * sg);
  };
  p.moveTo(-124, 0);
  half(1);
  p.moveTo(-124, 0);
  half(-1);
  return p;
})();
function frogBrain(c: C, m: Frame['mood'], x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  softPlate(c, 0, 0, 320, 170, m.ink, 0.45);
  c.save();
  c.setLineDash([3, 4.5]);
  c.strokeStyle = withAlpha(m.rim, 0.42);
  c.lineWidth = 1.2;
  c.stroke(SKULL_PATH);
  // the eyes in their orbits (dotted), the near one is the eye we are looking into
  for (const sg of [-1, 1]) {
    c.beginPath();
    c.arc(-52, -50 * sg, 15, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
  c.fillStyle = mixLab(m.ink, m.set, 0.18);
  c.fill(BRAIN_PATH, 'nonzero');
  c.strokeStyle = withAlpha(m.rim, 0.34);
  c.lineWidth = 1.1;
  c.stroke(BRAIN_PATH);
  // the midline between the paired lobes
  c.strokeStyle = withAlpha(m.fg, 0.8);
  c.beginPath();
  c.moveTo(-74, 0);
  c.lineTo(46, 0);
  c.stroke();
  c.restore();
}
/** the nerve's path in screen px: the cup → the disc's edge → into the near optic lobe; u in 0..1 */
function nerveAt(u: number) {
  const a = toDisp({ x: INSET.x - 40, y: INSET.y - 14 }), e = toDisp(NERVE_EXIT), z = { x: BRAIN.x + 22, y: BRAIN.y + 14 };
  if (u < 0.62) {
    const v = u / 0.62, cx = toDisp({ x: INSET.x + 40, y: INSET.y + 4 });
    return { x: (1 - v) * (1 - v) * a.x + 2 * v * (1 - v) * cx.x + v * v * e.x, y: (1 - v) * (1 - v) * a.y + 2 * v * (1 - v) * cx.y + v * v * e.y };
  }
  const v = (u - 0.62) / 0.38;
  return { x: lerp(e.x, z.x, v), y: lerp(e.y, z.y, v) };
}
/** four pulses of light run along the nerve toward the brain (from "features" to just after "brain"); each fades
 *  out as it reaches the tectum — the brain itself stays dark */
function nervePulses(c: C, m: Frame['mood'], t: number, b: Beats, A: number) {
  // the outside stretch of the nerve: a fine bundle from the disc's edge to the tectum
  const e = toDisp(NERVE_EXIT), z = nerveAt(1);
  c.save();
  c.globalAlpha = A;
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(e.x, e.y);
  c.lineTo(z.x, z.y);
  c.stroke();
  c.globalCompositeOperation = 'lighter';
  const starts = [b.eye - 0.15, b.eye + 0.3, b.brain - 0.35, b.brain + 0.1];
  for (const s0 of starts) {
    // (each pulse dies on the nerve just outside the eye: nothing lights the brain)
    const u = ((tq12(t) - s0) / 0.75) * 0.72;
    if (u <= 0 || u >= 0.72) continue;
    const p = nerveAt(u);
    const k = A * Math.min(1, u * 6) * (1 - sm((u - 0.56) / 0.16));
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
    g.addColorStop(0, withAlpha(m.core, 0.9 * k));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 9, p.y - 9, 18, 18);
  }
  c.restore();
}

/** the author card under the inset (the paper that put the candle out) */
function authorCard(c: C, m: Frame['mood'], A: number) {
  if (A <= 0) return;
  c.save();
  c.globalAlpha = A;
  const y = DISP.y + DISP_R + 44;
  const cx = DISP.x - 64;
  softPlate(c, cx, y - 7, 560, 64, m.ink, 0.55);
  c.fillStyle = textColor(m);
  const AUTH = 'Lettvin, Maturana, McCulloch & Pitts · 1959';
  c.font = `italic 400 ${legibleSize(c, `italic 400 21px ${FONT.text}`, 21, AUTH)}px ${FONT.text}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(AUTH, cx, y);
  c.restore();
}

/** a typewriter date stamp (date only), bottom-left: the SAME struck Special Elite as the kit's placeStamp in
 *  ch02-s05b / ch02-s07 (21 px, each key landing a little differently, typed on the twos at 16 cps) */
function dateStamp(c: C, m: Frame['mood'], t: number, at: number, until: number, text: string) {
  const A = win(t, at - 0.05, at + 0.1) * (1 - win(t, until - 0.5, until));
  if (A <= 0) return;
  const tq = tq12(t);
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * 16 + 1e-6)));
  const size = 21, x = 48, y = 672, seed = 59;
  c.save();
  c.textBaseline = 'alphabetic';
  c.globalAlpha = A;
  const estW = text.length * size * 0.62;
  softPlate(c, x + estW / 2, y - size * 0.35, estW + 160, size + 70, m.ink, 0.5);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const adv = c.measureText('M').width * 1.02;
  const col = textColor(m);
  for (let i = 0; i < shown; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const ink = 0.72 + 0.28 * hash1(i, seed + 41);
    const dy = (hash1(i, seed + 42) - 0.5) * 1.2;
    const rot = (hash1(i, seed + 43) - 0.5) * 0.025;
    const strike = i === shown - 1 && tq - at < text.length / 16 + 0.1 ? 1.15 : 1;
    c.save();
    c.translate(x + i * adv + adv / 2, y + dy);
    c.rotate(rot);
    c.globalAlpha = A * 0.88 * Math.min(1, ink * strike);
    c.fillStyle = col;
    c.textAlign = 'center';
    c.fillText(ch, 0, 0);
    c.restore();
  }
  c.restore();
}

/** the reverse flame push happens in NEAR-DARKNESS: everything but a small patch round the wick sinks toward
 *  black; the lit elements are a tiny coal and the thread of smoke rising from it */
function pushDark(c: C, m: Frame['mood'], k: number, cx: number, cy: number) {
  if (k <= 0.005) return;
  c.save();
  const v = c.createRadialGradient(cx, cy - 60, 30, cx, cy - 60, 520);
  v.addColorStop(0, withAlpha(m.fg, 0.55 * k));
  v.addColorStop(0.45, withAlpha(m.fg, 0.88 * k));
  v.addColorStop(1, withAlpha(m.fg, 0.97 * k));
  c.fillStyle = v;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}
/** the dying wick: a tiny red-orange coal (radius ≤ 26 stage px = 40 px at 1080p, intensity ≤ 0.35), screen-locked
 *  so no camera push can bloom it */
function coal(c: C, m: Frame['mood'], k: number, x: number, y: number, t: number) {
  if (k <= 0.01) return;
  const col = mixLab(m.core, '#b33a1e', 0.6);
  const flick = 0.85 + 0.15 * Math.sin(tq12(t) * 19) * Math.sin(tq12(t) * 6.1);
  // (round 2: a clearly lit point through the whole push — the frame never goes to black)
  const a = Math.min(0.8, 0.85 * k * flick);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const R = 30;
  const g = c.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.18, withAlpha(col, a * 0.7));
  g.addColorStop(0.5, withAlpha(col, a * 0.18));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(x - R, y - R, 2 * R, 2 * R);
  c.fillStyle = withAlpha(mixLab(m.core, '#fff2d0', 0.3), Math.min(1, a * 1.2));
  c.beginPath();
  c.arc(x, y, 2.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** the thread of smoke from the coal, faintly lit from below (the one lit line in the dark push) */
function smokeThread(c: C, m: Frame['mood'], k: number, x: number, y: number, t: number) {
  if (k <= 0.01) return;
  const tq = tq12(t);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  const N = 28, H = 300;
  let px = x, py = y - 6;
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const nx = x + Math.sin(u * 5.2 - tq * 1.4) * 16 * u + Math.sin(u * 2.1 + tq * 0.5) * 22 * u * u;
    const ny = y - 6 - H * u;
    c.strokeStyle = withAlpha(mixLab(m.halo, m.rim, 0.5), 0.34 * k * (1 - u) ** 1.3);
    c.lineWidth = 1.3 + 2.2 * u;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(nx, ny);
    c.stroke();
    px = nx;
    py = ny;
  }
  c.restore();
}

// ------------------------------------------------------------------ shot
interface Scene extends ShotScene {
  b: Beats;
  stageCam: (t: number) => Camera3;
  studyCam: (t: number) => Camera3;
  xrayCam: (t: number) => Camera3;
  STAGE_CAMS: Camera3[];
  STUDY_CAMS: Camera3[];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      l2: T.line('L0219').start,
      irisOpen: T.word('L0218', 'eye'),
      sorting: T.word('L0218', 'sorting'),
      pitts: T.word('L0220', 'Pitts'),
      stamp: T.beat('stamp'),
      eye: T.beat('eye'),
      brain: T.beat('brain'),
      gutter: T.beat('gutter'),
      out: T.beat('out'),
      cut: T.beat('stub'),
      paper: T.word('L0220', 'paper'),
      name: T.beat('clueCard'),
      xray: T.beat('xray'),
      band: T.beat('xrayBand1'),
      // band 1 holds lit, then fades where it can be SEEN: done ~0.35 s before the cut (the next shot's ink bleed
      // straddles it)
      fade: Math.min(T.beat('xrayFade'), T.duration - 0.85),
      // the hands: in during the short tilt (0.55 s), press on "name", and gone by name + 0.32; the clean card holds
      pin0: T.beat('clueCard') - 0.55,
      pinDur: 0.87,
      tilt: T.word('L0220', 'least') + 0.3,
      // a clean 0.9 s cross-dissolve from the held C1 insert to the X-ray plate (the column fades up inside it)
      dis0: T.beat('clueCard') + 0.88,
      dis1: T.beat('clueCard') + 1.78,
    };
    const D = T.duration;
    // ---- stage camera: wide → toward the frog for the eye → up to the candle → INTO the ember (ease-in dolly)
    // (kept wide enough through the inset and the gutter that the frog on its pad stays whole at lower left)
    const sk: [number, number, number, number][] = [
      [0, 620, 404, -90],
      [b.irisOpen - 0.2, 540, 410, -10],
      [b.eye - 0.3, 452, 420, 84],
      [b.brain + 1.2, 456, 420, 100],
      [b.gutter, 548, 392, 150],
      [b.out + 0.2, STAGE_FLAME.x, STAGE_FLAME.y + 30, 240],
    ];
    const ks = ordered(sk.map((k) => [k[0], 0] as [number, number]), 0.4).map(([tt], i) => [tt, sk[i][1], sk[i][2], sk[i][3]] as const);
    const sx = monotone(ks.map((k) => [k[0], k[1]])), sy = monotone(ks.map((k) => [k[0], k[2]])), sz = monotone(ks.map((k) => [k[0], k[3]]));
    const pushAt = ks[ks.length - 1][0];
    const stageCam = (t: number): Camera3 => {
      if (t <= pushAt) return { x: sx(t), y: sy(t), z: sz(t), lens: 1 };
      const u = clamp01((t - pushAt) / (b.cut - pushAt));
      const e = u * u * u;
      return { x: STAGE_FLAME.x, y: lerp(STAGE_FLAME.y + 30, STAGE_FLAME.y + 6, sm(u)), z: lerp(240, 720, e), lens: 1 };
    };
    // ---- study camera: out of the stub's ember (fast ease-out), shelf macro, tilt up to C1 (the pin insert); as
    // the hands leave, a soft in-shot dissolve (never a whip across the board) to the X-RAY plate: the case card
    // (WHO TAUGHT IT?) at left, the column on the right third, a slow push toward band 1 while it glows
    const C1 = slotWorld('C1', 'centre');
    // (round 2: the shelf framed ~1.3x tighter: the stub at the left third, the bookcase behind it, the label and the
    // authors' slip filling the wall to its right)
    const tk: [number, number, number, number][] = [
      [b.cut + 0.55, 222, 832, 532],
      [b.tilt, 232, 826, 520],
      [b.name - 0.04, C1.x + 6, C1.y + 24, 492],
      [b.name + 0.3, C1.x + 7, C1.y + 23, 512],
      // the hands gone, a slow creep in on the pinned card (its 1943 reads) until the dissolve
      [b.dis1, C1.x + 8, C1.y + 23, 560],
    ];
    const kt = ordered(tk.map((k) => [k[0], 0] as [number, number]), 0.35).map(([tt], i) => [tt, tk[i][1], tk[i][2], tk[i][3]] as const);
    const tx = monotone(kt.map((k) => [k[0], k[1]])), ty = monotone(kt.map((k) => [k[0], k[2]])), tz = monotone(kt.map((k) => [k[0], k[3]]));
    const firstT = kt[0][0];
    const studyCam = (t: number): Camera3 => {
      if (t >= firstT) return { x: tx(t), y: ty(t), z: tz(t), lens: 1 };
      const u = clamp01((t - b.cut) / (firstT - b.cut));
      const e = 1 - (1 - u) ** 3;
      return { x: lerp(STUB_WICK.x, kt[0][1], e), y: lerp(STUB_WICK.y + 6, kt[0][2], e), z: lerp(720, kt[0][3], e), lens: 1 };
    };
    // the X-ray plate: the column centred and square-on, ~58% of the frame's height, a slow push while band 1 glows
    const XC = xrayGlowAt(STUDY.xray);
    const colH = XRAY.h * STUDY.xray.s;
    const zFor = (frac: number) => 1000 - 1000 / ((frac * 720) / colH);
    const xrayCam = (t: number): Camera3 => {
      const u = clamp01((t - b.dis0) / (D - b.dis0));
      const e = 0.5 * u + 0.5 * sm(u); // starts already drifting (no dead stop after the dissolve)
      return { x: XC.x, y: XC.y + 6, z: lerp(zFor(0.55), zFor(0.61), e), lens: 1 };
    };
    const STAGE_CAMS = [stageCam(0), stageCam(b.irisOpen), stageCam(b.eye), stageCam(b.gutter), stageCam(b.out + 0.2)];
    const STUDY_CAMS = [studyCam(b.cut + 0.2), studyCam(firstT), studyCam(b.tilt), studyCam(b.name), studyCam(b.name + 0.6), xrayCam(b.dis0), xrayCam(b.band), xrayCam(D)];
    tl.hold(0, D);
    const scene: Scene = { tl, b, stageCam, studyCam, xrayCam, STAGE_CAMS, STUDY_CAMS };
    return scene;
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b;
    const tq = tq12(t);
    if (t < b.cut) paintStage(f, scene, t, tq);
    else if (t < b.dis0) paintStudy(f, scene, t, tq, scene.studyCam(t));
    else if (t < b.dis1) {
      // the soft dissolve: the C1 insert (held, the hands gone) gives way to the X-ray plate
      const u = sm((t - b.dis0) / (b.dis1 - b.dis0));
      const cv = subFrame(f, `${ID}/insert`, f.mood, (g) => paintStudy(g, scene, t, tq, scene.studyCam(t)));
      paintStudy(f, scene, t, tq, scene.xrayCam(t));
      compositeSub(f, cv, 1 - u);
    } else paintStudy(f, scene, t, tq, scene.xrayCam(t));
  },
});

function paintStage(f: Frame, scene: Scene, t: number, tq: number) {
  const b = scene.b;
  f.camera(scene.stageCam(t));
  f.setMood('candleAmber', { from: 'duskRose', u: sm(t / 1.3) });
  // flame strength: steady, then guttering (on the twos: paper flicker), out on "sixteen"
  const gu = clamp01((tq - b.gutter) / (b.out - b.gutter));
  const flick = 0.5 + 0.5 * Math.sin(tq * 31 + 1.3) * Math.sin(tq * 13.7);
  const fk = tq < b.gutter ? 1 : tq < b.out ? Math.max(0.12, (1 - 0.75 * gu) * (0.55 + 0.45 * flick)) : 0;
  const isOut = tq >= b.out;
  const view: CandleView = { ...START_VIEW, rings: RINGS, state: isOut ? 'out' : 'live', smoke: isOut };
  const ember = isOut ? emberAt(t, b) : 0;
  let geo: StageGeo | null = null;
  // the film-wide naming rule would raise this candle's stage card on "candle", before the flame goes out on
  // "sixteen" (it spoils the beat): on the stage it stays silent; the shelf label names it at "stub"
  const pc = paintContext();
  if (pc) setPaintContext({ ...pc, shotId: `${ID}/stage` });
  try {
  geo = candleStage(f, {
    key: ID,
    cams: scene.STAGE_CAMS,
    candle: view,
    candleX: CANDLE_X,
    s: STAGE_S,
    flame: fk,
    pool: 1 - 0.55 * gu,
    letters: 0.7,
    back: (c, env) => backReeds(f, c, env, scene.STAGE_CAMS),
    draw: (c, env, g) => {
      const light = Math.max(0.1, fk);
      // the holders in the pool, facing the flame: Pitts (smaller, nearer), McCulloch behind him
      const pAt = (q: number): Pose => blendPitts(q, b);
      const pp = withLife({ ...pAt(tq), prev: pAt(tq - 1 / 12) }, tq, 61, 0.7);
      const mp = withLife({ ...HOLD_MCC }, tq, 62, 0.8);
      const sp0 = stageSpot(g, 'holder', 0), sp1 = stageSpot(g, 'holder', 1);
      // McCulloch a step further back from the flame than his spot, so the candle's naming card (screen-locked,
      // right of the flame on "candle") clears his head
      const px = sp0.x + 6, mx = sp1.x + 54;
      floorShadow(c, g, mx, (cc) => cast.mcculloch.draw(cc, { x: 0, y: 0, facing: 'left', pose: mp }, env), env, light);
      floorShadow(c, g, px, (cc) => cast.pitts.draw(cc, { x: 0, y: 0, facing: 'left', pose: pp }, env), env, light);
      cast.mcculloch.draw(c, { x: mx, y: g.floorY, facing: 'left', pose: mp }, env);
      cast.pitts.draw(c, { x: px, y: g.floorY, facing: 'left', pose: pp }, env);
      // the frog and its pad sink into the dark as the light gutters (gone before the push in on the candle)
      const fa = 1 - win(t, b.gutter - 0.15, b.gutter + 0.35);
      if (fa > 0) {
        c.save();
        c.globalAlpha *= fa;
        frog(c, env, Math.max(0.15, fk), t);
        c.restore();
      }
    },
  });
  } finally {
    setPaintContext(pc);
  }
  nearLip(f, scene.STAGE_CAMS);
  // the dying wick: the push in happens into near-darkness, a tiny coal and its lit thread of smoke
  const es = toScreen(LAYERS.L4, f.cam, geo.flame.x, geo.flame.y - 6);
  const dark = sm((t - (b.cut - 0.75)) / 0.75);
  pushDark(f.c, f.mood, 0.88 * dark, es.x, es.y);
  smokeThread(f.c, f.mood, dark, es.x, es.y, t);
  coal(f.c, f.mood, ember, es.x, es.y, t);
  // fog over the dark stage once the light has gone (the haze holds a little warmth)
  // ---- the inset + text (screen-locked)
  const fe = toScreen(LAYERS.L4, f.cam, FROG_EYE.x, FROG_EYE.y);
  retinaInset(f.c, f.mood, t, b, fe);
  authorCard(f.c, f.mood, win(t, b.eye - 0.05, b.eye + 0.4) * (1 - win(t, b.out + 0.1, b.out + 0.6)));
  dateStamp(f.c, f.mood, t, b.stamp - 0.1, b.gutter - 0.3, '1959');
}

/** the wick's coal after "sixteen": a slow fade over the push (0..1) */
const emberAt = (t: number, b: Beats) => (t < b.out ? 0 : Math.exp(-(t - b.out) * 0.35));

function blendPitts(q: number, b: Beats): Pose {
  const u = sm((q - (b.out + 0.3)) / 0.9);
  const a = HOLD_PITTS.angles, d = PITTS_DOWN.angles;
  const angles: Pose['angles'] = {};
  for (const k of Object.keys({ ...a, ...d }) as (keyof Pose['angles'])[]) angles[k] = lerp(a[k] ?? 0, d[k] ?? 0, u);
  return { angles, handF: 'relaxed', handB: 'relaxed' };
}

/** the 1959 paper's authors on a small paper SLIP standing on the shelf beside the stub (anchored: it rides with
 *  the shelf), well clear of the stub label's leader; "Pitts" gets a soft underline glint on his word */
function authorsSlip(c: C, m: Frame['mood'], t: number, b: Beats, x: number, y: number, at: number, until: number) {
  const A = win(t, at, at + 0.4) * (1 - win(t, until - 0.4, until));
  if (A <= 0) return;
  const l1 = 'Lettvin, Maturana,';
  const pre = 'McCulloch & ';
  const name = 'Pitts';
  const l2 = `${pre}${name} · 1959`;
  c.save();
  const size = legibleSize(c, `italic 400 21px ${FONT.text}`, 21, l2);
  c.font = `italic 400 ${size}px ${FONT.text}`;
  const w = Math.max(c.measureText(l1).width, c.measureText(l2).width) + 34;
  const h = size * 2.7 + 16;
  // stands on the shelf (x, y = its bottom-left), leaning back a touch
  c.translate(x, y);
  c.rotate(-0.03);
  c.globalAlpha = A;
  c.fillStyle = withAlpha(m.ink, 0.45);
  c.fillRect(5, -h + 5, w, h); // its shadow on the wall
  const paper = mixLab(mixLab(m.halo, m.rim, 0.5), '#eadcc0', 0.45);
  c.fillStyle = paper;
  c.fillRect(0, -h, w, h);
  c.strokeStyle = withAlpha(m.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(0.5, -h + 0.5, w - 1, h - 1);
  c.fillStyle = withAlpha(m.ink, 0.92);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const tx = 17, y1 = -h + 10 + size * 1.05, y2 = y1 + size * 1.25;
  c.fillText(l1, tx, y1);
  c.fillText(l2, tx, y2);
  const px = tx + c.measureText(pre).width, pw = c.measureText(name).width;
  const g = win(t, b.pitts - 0.1, b.pitts + 0.2);
  if (g > 0) {
    // his name alone warms and gets an underline of light
    c.fillStyle = mixLab(m.ink, '#7a3a12', 0.6 * g);
    c.fillText(name, px, y2);
    c.globalCompositeOperation = 'lighter';
    const lg = c.createLinearGradient(px, 0, px + pw, 0);
    lg.addColorStop(0, withAlpha(m.core, 0));
    lg.addColorStop(0.5, withAlpha(m.core, 0.9 * g));
    lg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = lg;
    c.fillRect(px - 2, y2 + 4, pw + 4, 2);
    const rg = c.createRadialGradient(px + pw / 2, y2 + 5, 0, px + pw / 2, y2 + 5, pw * 0.9);
    rg.addColorStop(0, withAlpha(m.halo, 0.3 * g));
    rg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = rg;
    c.fillRect(px - pw, y2 - pw * 0.9 + 5, pw * 3, pw * 1.8);
  }
  c.restore();
}

/** C1's drop below its slot in this shot (board units) */
const C1_DROP = 15;
/** the hands' forearm in this shot: a sleeve that widens toward the elbow (drawn under the kit's arm) */
function armXf(c: C, a: ArmPose, len: number) {
  const flipY = Math.cos(a.angle) < 0 ? -1 : 1;
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
}
function sleeveUnder(c: C, a: ArmPose, len: number, env: PaintEnv) {
  c.save();
  armXf(c, a, len);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-1.15, -0.31);
  c.quadraticCurveTo(-3.2, -0.42, -9, -0.66);
  c.lineTo(-9, 0.7);
  c.quadraticCurveTo(-3.2, 0.44, -1.15, 0.3);
  c.closePath();
  c.fill();
  c.restore();
}
/** the cuff break: the sleeve bunches just behind the cuff (two rim-catching creases and a notch in its top) */
function sleeveBreak(c: C, a: ArmPose, len: number, env: PaintEnv) {
  c.save();
  armXf(c, a, len);
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  c.strokeStyle = withAlpha(env.mood.rim, 0.42);
  c.lineWidth = 1.4 * px;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-1.32, -0.33);
  c.quadraticCurveTo(-1.42, -0.05, -1.3, 0.22);
  c.moveTo(-1.62, -0.36);
  c.quadraticCurveTo(-1.74, -0.12, -1.66, 0.12);
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(-1.38, -0.33);
  c.lineTo(-1.47, -0.4);
  c.lineTo(-1.56, -0.36);
  c.closePath();
  c.fill();
  c.restore();
}
const VEIL = hcl(198, 12, 40).formatHex();
/** a veil of dim vellum over the X-ray's unlit bands (2-7): in this first drawing they read as nearly empty */
function unlitVeil(c: C, o: { x: number; y: number; s?: number }, a: number) {
  const s = o.s ?? 1;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  // band by band (the cut-card dividers between them stay), dense enough that no later band's cut-outs show
  c.fillStyle = withAlpha(VEIL, a);
  for (let i = 2; i <= 7; i++) {
    const r = bandBox(i);
    c.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
  }
  c.restore();
}
/** band i's rectangle in the column's local coords (as the kit lays them out: a seam above band 3) */
function bandBox(i: number) {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
  return { x: -XRAY.w / 2 + 18, y: y1 - XRAY.band + 6, w: XRAY.w - 36, h: XRAY.band - 8 };
}
/** the warm glow of band 1's six tiny lanterns (positions as the kit's glyph lays them out) */
function bandOneGlow(c: C, env: PaintEnv, o: { x: number; y: number; s?: number }, a: number, tq: number) {
  if (a <= 0.01) return;
  const s = o.s ?? 1;
  const r = bandBox(1);
  const cy = r.y + r.h / 2;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.globalCompositeOperation = 'lighter';
  const warm = mixLab(env.mood.core, '#ff9a2e', 0.62);
  const wash = c.createLinearGradient(0, r.y, 0, r.y + r.h);
  wash.addColorStop(0, withAlpha(warm, 0));
  wash.addColorStop(0.6, withAlpha(warm, 0.32 * a));
  wash.addColorStop(1, withAlpha(warm, 0.08 * a));
  c.fillStyle = wash;
  c.fillRect(r.x, r.y, r.w, r.h);
  for (let j = 0; j < 6; j++) {
    const x = r.x + 14 + j * ((r.w - 28) / 5);
    const y = cy - 2 - (j % 2) * 3;
    const fl = 0.78 + 0.22 * Math.sin(tq * (7 + j * 1.3) + j * 2.1) * Math.sin(tq * (3.1 + j * 0.7) + j);
    const g = c.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, withAlpha(warm, 1 * a * fl));
    g.addColorStop(0.35, withAlpha(warm, 0.5 * a * fl));
    g.addColorStop(1, withAlpha(warm, 0));
    c.fillStyle = g;
    c.fillRect(x - 16, y - 16, 32, 32);
  }
  c.restore();
}

function paintStudy(f: Frame, scene: Scene, t: number, tq: number, cam: Camera3) {
  const b = scene.b;
  f.camera(cam);
  const cams = scene.STUDY_CAMS;
  studyRoom(f, { key: ID, cams, outside: { mood: 'labGreen', kind: 'night' } });
  // the desk lamp's soft pool on the wall behind the stub and its label (the light the label is read by)
  f.layer('L4', (c, env) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = STUB_X + 250, cy = STUDY.shelf.y - 250, R = 420;
    const g = c.createRadialGradient(cx, cy, 20, cx, cy, R);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.2));
    g.addColorStop(0.5, withAlpha(env.mood.halo, 0.08));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    c.restore();
  });
  // board: the 'start' state without its question card (we sway it ourselves); C1 and O are this shot's
  const st = boardStateAt(ID, 'start');
  const q1 = st.questions.find((q) => q.slot === 'Q1');
  const board = { ...st, questions: [] };
  const pool = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
  const C1 = SLOTS.C1, O = SLOTS.O;
  // C1 sits ~40 px (1080p, at the pin's framing) lower than its slot, so its top clears the hanging question card
  const pin0 = slotWorld('C1', 'pin');
  const pinPt = { x: pin0.x, y: pin0.y + C1_DROP * STUDY.board.k };
  // the pin's own clock: a 0.55 s approach to the press on "name", then a quick withdrawal (gone by name + 0.32)
  const u = tq < b.name ? 0.45 * ((tq - b.pin0) / (b.name - b.pin0)) : 0.45 + 0.55 * ((tq - b.name) / (b.pin0 + b.pinDur - b.name));
  // the hands enter from the frame's RIGHT edge at the card's top, so the forearm lies along the top of the card and
  // the lantern icon and its 1943 stay in view; thumb and forefinger on the pin's head (a pinch, not a fist)
  const ps = toScreen(LAYERS.L4, cam, pinPt.x, pinPt.y);
  const side = { R: toLayer(LAYERS.L4, cam, 1460, ps.y - 190), L: handsEntry(cam, 'L4').L };
  let hp = u > 0 && u < 1 ? hands.act('pin', u, pinPt, { held: 'card', scale: 0.44, entry: side }) : null;
  if (hp?.right && hp.right.shape === 'press') hp = { ...hp, right: { ...hp.right, shape: 'pinch' } };
  const xa = win(t, b.xray - 0.3, b.xray + 0.4);
  const bandU = clamp01((t - b.band) / 0.55);
  // band 1 (and the column with it) fades before the cut; as it fades the chat box settles back into its
  // card at the output slot (the column IS the chat box: never both at full strength)
  const dim = win(t, b.fade, b.fade + 0.5);
  const xLight = xa * (1 - 0.85 * dim);
  const colA = xa * (1 - 0.85 * dim);
  const cardA = dim;
  const xs = xrayBandsAt(ID, 'start');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: board },
    wall: { emptyRow: WALL_SLOTS.W1.y - WALL_SLOTS.W1.h / 2 + 6 },
    // the stage already named this candle on "candle" (the kit's naming card); here the stub's own label speaks
    shelf: { views: END_SHELF, named: {} },
    xray: false,
    extra: (c, env) => {
      // the swaying oxblood question card on its thread (Q1)
      if (q1) {
        const k = STUDY.board.k;
        const qx = STUDY.board.x + q1.x * k;
        const qy = STUDY.board.y + BOARD.threadY * k + Math.sin(((q1.x - 40) / 920) * Math.PI) * 10 * k;
        const sway = 0.035 * Math.sin(t * 1.6 + 0.4) + 0.012 * Math.sin(t * 3.1);
        c.save();
        c.translate(qx, qy);
        c.rotate(sway);
        c.strokeStyle = oxblood(env);
        c.lineWidth = 1.2 * k;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, 10 * k);
        c.stroke();
        drawCard(c, { id: `Q-${q1.slot}`, w: 168, h: 44, icon: 'question', text: q1.text }, { x: 0, y: 32 * k, k, light: poolAt(pool, q1.x, BOARD.threadY + 40), pin: false }, env);
        c.restore();
      }
      const bx = (sx: number) => STUDY.board.x + sx * STUDY.board.k, by = (sy: number) => STUDY.board.y + sy * STUDY.board.k;
      // the output card (the chat box): the column dissolves into it as band 1 fades
      if (cardA > 0) {
        c.save();
        c.globalAlpha *= cardA;
        drawCard(c, { ...O, text: undefined }, { x: bx(O.x), y: by(O.y), k: STUDY.board.k, light: poolAt(pool, O.x, O.y), pin: false }, env);
        c.restore();
      }
      // C1: pinned by the hands on "name"
      const placed = u >= 0.45;
      if (placed) {
        const dt = tq - (b.pin0 + 0.45 * b.pinDur);
        const sway = dt > 0 ? 0.04 * Math.exp(-dt * 2.6) * Math.sin(dt * 9) : 0;
        c.save();
        c.translate(pinPt.x, pinPt.y);
        c.rotate(sway);
        c.translate(-pinPt.x, -pinPt.y);
        drawCard(c, C1, { x: bx(C1.x), y: by(C1.y + C1_DROP), k: STUDY.board.k, light: poolAt(pool, C1.x, C1.y) }, env);
        c.restore();
      }
      // the X-ray column: drawn for the first time (seven faint, empty bands), then band 1 lights alone
      if (colA > 0) {
        c.save();
        c.globalAlpha *= colA;
        // a practical glow, not a second accent: the cyan drawn ~30% less saturated
        c.filter = 'saturate(0.55)';
        xrayColumn(c, { ...STUDY.xray, state: { ...xs, lit: xs.lit.map(() => false) }, light: xLight, reveal: { band: 1, u: bandU }, translucency: 0.12 + 0.12 * bandU }, env);
        unlitVeil(c, STUDY.xray, 0.88);
        c.filter = 'none';
        c.restore();
        // band 1's tiny threshold lanterns light warm (the one saturated accent at this moment), each with its own
        // flicker, in ~0.5 s
        bandOneGlow(c, env, STUDY.xray, colA * sm(bandU) * (1 - 0.9 * dim), tq);
      }
      if (hp) {
        const len = HAND_LEN * (hp.scale ?? 1);
        if (hp.right) sleeveUnder(c, hp.right, len, env);
        hands.draw(c, hp, env, {
          heldDraw: (cc, at, _h, e) => drawCard(cc, C1, { x: at.x, y: at.y + (C1.h / 2 - 7) * STUDY.board.k, k: STUDY.board.k, light: 0.8, pin: false }, e),
        });
        if (hp.right) sleeveBreak(c, hp.right, len, env);
      }
    },
  });
  // haze in the shelf framing (it thins as the camera tilts up to the board)
  const shelfHaze = 1 - win(t, b.tilt, b.tilt + 0.9);
  if (shelfHaze > 0) f.fog({ yCenter: 470, height: 360, alpha: 0.2 * shelfHaze, drift: 4 });
  // the X-ray's serverCyan glow (the study's one cold practical)
  if (xa > 0) {
    const g = xrayGlowAt(STUDY.xray);
    f.practical({ x: g.x, y: g.y + 120, kind: 'screen', seed: 2026, intensity: 0.15 * xLight * (0.6 + 0.4 * bandU), radius: 70 });
  }
  // a near plane of dust drifting in the column's soft light (L5): it slides against the board as the camera
  // settles and pushes, so the X-ray frame is never a flat plate
  if (xa > 0) {
    const r0 = toLayer(LAYERS.L5, scene.xrayCam(b.dis0), 640, 120), r1 = toLayer(LAYERS.L5, scene.xrayCam(b.dis0), 1300, 720);
    f.layer('L5', (c, env) => {
      c.save();
      c.globalAlpha *= xa * (1 - 0.6 * dim);
      dustMotes(c, { area: { x: r0.x, y: r0.y, w: r1.x - r0.x, h: r1.y - r0.y }, count: 34, drift: { x: -2.5, y: -1.6 }, size: 1.5, brightness: 0.5, salt: 208 }, env);
      c.restore();
    });
  }
  studyNear(f, { key: ID, cams, file: true, occluders: { drape: false, valance: false } });
  // the study's near plane at the shelf: the detective's wing-chair back at lower right (L5, blurred, sliding
  // faster than the shelf as the camera pulls back and tilts)
  if (shelfHaze > 0) {
    // (pushed out to the frame's lower-right corner: an edge of a near occluder, not a third of the frame)
    const cp = toLayer(LAYERS.L5, scene.studyCam(b.cut + 1.2), 1290, 1010);
    f.layer('L5', (c, env) => {
      c.save();
      c.globalAlpha *= shelfHaze;
      chairBack(c, { x: cp.x, y: cp.y, s: 0.5, kind: 'wing' }, { ...env, fill: (role) => (role === 'fg' ? PUPPET_NEAR_BLACK : env.fill(role)) });
      c.restore();
    });
  }
  // out of the ember: from near-darkness (a tiny coal, its lit smoke thread) the shelf comes up
  const ws = toScreen(LAYERS.L4, f.cam, STUB_WICK.x, STUB_WICK.y + 1);
  const dark = 1 - sm((t - b.cut) / 0.65);
  // (the study's amber key comes up from 0.4, never from black)
  pushDark(f.c, f.mood, 0.6 * dark, ws.x, ws.y);
  smokeThread(f.c, f.mood, dark, ws.x, ws.y, t);
  coal(f.c, f.mood, emberAt(t, b) * (1 - win(t, b.cut + 0.4, b.cut + 1.8)), ws.x, ws.y, t);
  // the stub's label (what burned, and for how long), held ~1.8 s before the tilt; under it, small, the paper that
  // put it out — and on "Pitts's" a soft glint runs under his name
  const sw = toScreen(LAYERS.L4, f.cam, STUB_X, STUDY.shelf.y - 180);
  const labAt = b.cut + 0.12, labDur = b.name + 0.1 - labAt;
  const tx = sw.x + 120, ty = sw.y - 40;
  annotation(f.c, { text: 'THE BRAIN IS A LOGIC MACHINE', sub: '1943–1959 · 16', x: sw.x + 14, y: sw.y, tx, ty, at: labAt, dur: labDur, size: 22 }, { t, mood: f.mood, seed: 59 });
  const slip = toScreen(LAYERS.L4, f.cam, STUB_X + 64, STUDY.shelf.y - 1);
  // the slip (the paper itself) stands up on the narrator's "paper" (T.word, follows the L0220 retake)
  authorsSlip(f.c, f.mood, t, b, slip.x, slip.y, Math.max(labAt + 0.35, b.paper - 0.15), labAt + labDur);
}
