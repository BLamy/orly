/**
 * ch15-s09 — the match hand at the shelf's end (review round 5, ART): an ARTICULATED PAPER-CUT hand for the macro.
 *
 * The kit's pinch topology (film/silhouette/puppet/hands.ts 'pinch': thumb and forefinger meeting at the socket, the
 * other fingers tucked) cut at macro scale as separate rigid paper pieces: a palm plate, a two-piece thumb, a
 * three-piece forefinger that hooks back to meet the thumb's tip (the pinch leaves a small almond of negative space
 * between them, so the hand reads as fingers, not a mitten), and three tucked fingers whose curled knuckles step down
 * the palm's front. Every piece is filled on its own in the same ink (a union, never a winding hole), the joints carry
 * fine cut-lines, and the sleeve ends in ONE shirt cuff with a 2 px warm rim and a single button.
 *
 *   solvePinch(entry, flameAt, len)       the arm whose match head burns at `flameAt`, its sleeve through `entry`
 *   solveGrip(entry, socketAt, len)       the matchbox hand, its fist centred on `socketAt`
 *   drawPaperArm(c, arm, len, env, o)     rim pass (an offset light copy under the ink), ink, cut-lines, the cuff
 *   pinchFlame(arm, len) / pinchTip(...)  where the match's flame burns (world)
 *
 * Coordinates: hand-local units of hand length; origin = wrist, +x toward the fingertips, -y = the thumb side (kept on
 * top: mirrored when the arm reaches left, exactly like sets/narratorHands.ts, so both rigs agree on a pose).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

export type Pt = { x: number; y: number };
type P2 = [number, number];
/** a jointed digit: [x, y, width] at the knuckle, each joint and the tip */
type Digit = [number, number, number][];

export interface PaperArm {
  wrist: Pt;
  angle: number;
  /** 1, or -1 when the arm reaches left (the thumb side kept on top) */
  flip: 1 | -1;
}

// ------------------------------------------------------------------------------------------------ geometry
function blob(pts: P2[], p = new Path2D()): Path2D {
  const n = pts.length;
  const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  p.closePath();
  return p;
}
/** one rigid finger segment: a tapered capsule with round ends */
function segment(x0: number, y0: number, w0: number, x1: number, y1: number, w1: number): Path2D {
  const p = new Path2D();
  const dx = x1 - x0, dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const a = Math.atan2(dy, dx);
  p.moveTo(x0 + (nx * w0) / 2, y0 + (ny * w0) / 2);
  p.lineTo(x1 + (nx * w1) / 2, y1 + (ny * w1) / 2);
  p.arc(x1, y1, w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  p.lineTo(x0 - (nx * w0) / 2, y0 - (ny * w0) / 2);
  p.arc(x0, y0, w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  p.closePath();
  return p;
}
interface Sprite {
  pieces: Path2D[];
  /** joint cut-lines and the knuckle crease (rim tone, fine) */
  cuts: Path2D;
  /** a digit cut as its own piece IN FRONT of the others, separated from them by a 2 px gap of negative space (the
   *  matchbox's face showing between the fingers): its pieces, and the outline of its free (off-palm) segments */
  front?: { pieces: Path2D[]; gap: Path2D[] };
}
function build(palm: P2[], digits: Digit[], extraCuts?: (p: Path2D) => void): Sprite {
  const pieces: Path2D[] = palm.length ? [blob(palm)] : [];
  const cuts = new Path2D();
  for (const d of digits) {
    for (let i = 0; i < d.length - 1; i++) pieces.push(segment(d[i][0], d[i][1], d[i][2], d[i + 1][0], d[i + 1][1], d[i + 1][2]));
    // a cut across each interior joint (the paper pieces' overlap), drawn as a short arc
    for (let i = 1; i < d.length - 1; i++) {
      const [x, y, w] = d[i];
      const ax = d[i + 1][0] - d[i - 1][0], ay = d[i + 1][1] - d[i - 1][1];
      const l = Math.hypot(ax, ay) || 1;
      const nx = -ay / l, ny = ax / l;
      const r = w * 0.42;
      cuts.moveTo(x + nx * r, y + ny * r);
      cuts.quadraticCurveTo(x + (ax / l) * w * 0.18, y + (ay / l) * w * 0.18, x - nx * r, y - ny * r);
    }
  }
  extraCuts?.(cuts);
  return { pieces, cuts };
}
const PALM: P2[] = [[-0.03, -0.15], [0.16, -0.19], [0.36, -0.185], [0.47, -0.13], [0.53, -0.03], [0.51, 0.09], [0.42, 0.17], [0.22, 0.2], [0.03, 0.18]];
const knuckleCrease = (p: Path2D) => {
  p.moveTo(0.43, -0.16);
  p.quadraticCurveTo(0.52, -0.04, 0.45, 0.15);
};

/** PINCH: the thumb's tip meets the hooked forefinger's tip ahead of the hand (the match between them) */
const PINCH_AT: P2 = [0.712, -0.268];
/** the match leaves the pinch forward and a little toward the palm side (local direction), passing behind the hooked
 *  forefinger; a short stick (about a third of the hand's length, a real match's proportion), its head at MATCH_LEN */
const MATCH_DIR = 0.6;
const MATCH_LEN = 0.5;
const MU: P2 = [Math.cos(MATCH_DIR), Math.sin(MATCH_DIR)];
const PINCH = build(
  PALM,
  [
    // thumb: two pieces, lying forward along the top
    [[0.13, -0.13, 0.14], [0.4, -0.29, 0.12], [0.665, -0.285, 0.094]],
    // forefinger: three pieces, hooking up and back to the thumb's tip
    [[0.47, -0.1, 0.108], [0.69, -0.085, 0.1], [0.8, -0.165, 0.09], [0.735, -0.235, 0.078]],
    // the three tucked fingers: their curled knuckles step down the palm's front
    [[0.5, -0.01, 0.1], [0.65, 0.02, 0.094], [0.63, 0.1, 0.084]],
    [[0.48, 0.07, 0.095], [0.61, 0.1, 0.09], [0.585, 0.17, 0.08]],
    [[0.43, 0.135, 0.085], [0.545, 0.17, 0.08], [0.52, 0.225, 0.07]],
  ],
  (p) => {
    knuckleCrease(p);
    // the thumb's nail edge, catching the light
    p.moveTo(0.6, -0.33);
    p.quadraticCurveTo(0.66, -0.335, 0.7, -0.315);
  },
);
/** GRIP (the matchbox hand): three fingers curled round the box's face, the thumb along its side, and (review round 5
 *  r1, critic) the INDEX finger laid separately up the face and along the box's TOP EDGE (the striker side, at about
 *  0.84 hand lengths from the wrist), cut out from the curled cluster by 2 px of negative space so the grip reads */
const GRIP_SOCKET: P2 = [0.62, -0.02];
const GRIP_INDEX: Digit = [[0.47, -0.12, 0.105], [0.665, -0.15, 0.098], [0.8, -0.125, 0.088], [0.812, -0.035, 0.076]];
const GRIP_FRONT = (() => {
  const sp = build([], [GRIP_INDEX]);
  // the gap is cut round the two free segments only (the first lies on the palm)
  const d = GRIP_INDEX;
  const gap = [1, 2].map((i) => segment(d[i][0], d[i][1], d[i][2], d[i + 1][0], d[i + 1][1], d[i + 1][2]));
  return { pieces: sp.pieces, gap, cuts: sp.cuts };
})();
const GRIP_BASE = build(
  PALM,
  [
    [[0.13, -0.13, 0.14], [0.38, -0.25, 0.12], [0.6, -0.21, 0.095]],
    [[0.5, -0.02, 0.105], [0.68, -0.02, 0.1], [0.745, 0.065, 0.09], [0.67, 0.115, 0.08]],
    [[0.48, 0.07, 0.1], [0.64, 0.08, 0.094], [0.695, 0.15, 0.085], [0.62, 0.19, 0.075]],
    [[0.43, 0.14, 0.088], [0.56, 0.16, 0.084], [0.6, 0.22, 0.076], [0.535, 0.245, 0.068]],
  ],
  knuckleCrease,
);
GRIP_BASE.cuts.addPath(GRIP_FRONT.cuts);
const GRIP: Sprite = { ...GRIP_BASE, front: { pieces: GRIP_FRONT.pieces, gap: GRIP_FRONT.gap } };
/** the sleeve (runs off frame) and ONE shirt cuff past it, its front edge rimmed, a single button */
const SLEEVE = (() => {
  const L = 9;
  const p = new Path2D();
  p.moveTo(-0.2, -0.3);
  p.lineTo(-1.2, -0.325);
  p.lineTo(-L, -0.38);
  p.lineTo(-L, 0.38);
  p.lineTo(-1.2, 0.325);
  p.lineTo(-0.2, 0.3);
  p.quadraticCurveTo(-0.16, 0, -0.2, -0.3);
  p.closePath();
  return p;
})();
const CUFF = (() => {
  const p = new Path2D();
  p.moveTo(-0.26, -0.235);
  p.lineTo(-0.02, -0.225);
  p.quadraticCurveTo(0.025, 0, -0.02, 0.225);
  p.lineTo(-0.26, 0.235);
  p.closePath();
  return p;
})();
/** the cuff's front edge and its top (thumb-side) edge: the 2 px warm rim */
const CUFF_RIM = (() => {
  const p = new Path2D();
  p.moveTo(-0.2, -0.232);
  p.lineTo(-0.02, -0.225);
  p.quadraticCurveTo(0.025, 0, -0.02, 0.225);
  return p;
})();
/** the sleeve's edge over the cuff (a fine cut, not a band) */
const SLEEVE_EDGE = (() => {
  const p = new Path2D();
  p.moveTo(-0.2, -0.3);
  p.quadraticCurveTo(-0.16, 0, -0.2, 0.3);
  return p;
})();
const BUTTON: P2 = [-0.1, 0.165];

// ------------------------------------------------------------------------------------------------ the arm transform
const flipOf = (angle: number): 1 | -1 => (Math.cos(angle) < 0 ? -1 : 1);
function toWorld(a: PaperArm, len: number, lx: number, ly: number): Pt {
  const x = lx * len, y = ly * len * a.flip;
  return { x: a.wrist.x + x * Math.cos(a.angle) - y * Math.sin(a.angle), y: a.wrist.y + x * Math.sin(a.angle) + y * Math.cos(a.angle) };
}
/** an arm aimed from `entry` whose hand-local point (lx, ly) lands on `target` */
function solve(entry: Pt, target: Pt, len: number, lx: number, ly: number): PaperArm {
  let angle = Math.atan2(target.y - entry.y, target.x - entry.x);
  let arm: PaperArm = { wrist: target, angle, flip: flipOf(angle) };
  for (let i = 0; i < 5; i++) {
    const v = toWorld({ wrist: { x: 0, y: 0 }, angle, flip: flipOf(angle) }, len, lx, ly);
    const wrist = { x: target.x - v.x, y: target.y - v.y };
    angle = Math.atan2(wrist.y - entry.y, wrist.x - entry.x);
    arm = { wrist, angle, flip: flipOf(angle) };
  }
  return arm;
}
/** the match's flame point (hand-local), just past the head along the match */
const FLAME_L: P2 = [PINCH_AT[0] + MU[0] * (MATCH_LEN + 0.02), PINCH_AT[1] + MU[1] * (MATCH_LEN + 0.02)];
export function solvePinch(entry: Pt, flameAt: Pt, len: number): PaperArm {
  return solve(entry, flameAt, len, FLAME_L[0], FLAME_L[1]);
}
export function solveGrip(entry: Pt, socketAt: Pt, len: number): PaperArm {
  return solve(entry, socketAt, len, GRIP_SOCKET[0], GRIP_SOCKET[1]);
}
export function pinchFlame(a: PaperArm, len: number): Pt {
  return toWorld(a, len, FLAME_L[0], FLAME_L[1]);
}

// ------------------------------------------------------------------------------------------------ draw
export interface PaperArmOpts {
  kind: 'pinch' | 'grip';
  /** the rim: a light copy offset toward the key (stage px), its colour and strength */
  rim: { dx: number; dy: number; col: string; a: number };
  /** the cuff's warm rim colour (2 px at 1080p) */
  cuffRim: string;
  /** pinch: draw the match (and its charred head once lit) */
  match?: boolean;
  /** what shows through a front digit's 2 px gap (the matchbox's face; defaults to a lit set tone) */
  gapCol?: string;
  lit?: number;
}
function local(c: CanvasRenderingContext2D, a: PaperArm, len: number) {
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * a.flip);
}
/** stage px -> the current (hand-local) transform's units */
function lw(c: CanvasRenderingContext2D, px: number) {
  const m = c.getTransform();
  const base = Math.hypot(m.a, m.b) || 1;
  return px / base;
}
export function drawPaperArm(c: CanvasRenderingContext2D, a: PaperArm, len: number, env: PaintEnv, o: PaperArmOpts) {
  const sp = o.kind === 'pinch' ? PINCH : GRIP;
  const K = PUPPET_NEAR_BLACK;
  // device px per stage px, so line widths are set in stage px whatever the canvas resolution
  const dev = Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
  const px = (stage: number) => lw(c, stage * dev);
  const fillAll = () => {
    c.fill(SLEEVE);
    c.fill(CUFF);
    for (const p of sp.pieces) c.fill(p);
    if (sp.front) for (const p of sp.front.pieces) c.fill(p);
  };
  // the match lies BEHIND the fingers (the pinch overlaps it)
  if (o.kind === 'pinch' && o.match) drawMatch(c, a, len, env, o.lit ?? 0);
  // 1. the rim: the whole cut-out in the light's colour, offset toward the key, under the ink
  c.save();
  c.translate(o.rim.dx, o.rim.dy);
  local(c, a, len);
  c.globalAlpha *= o.rim.a;
  c.fillStyle = o.rim.col;
  fillAll();
  c.restore();
  // 2. the ink: every piece filled on its own (a union, no winding holes)
  c.save();
  local(c, a, len);
  c.fillStyle = K;
  c.fill(SLEEVE);
  c.fill(CUFF);
  for (const p of sp.pieces) c.fill(p);
  if (sp.front) {
    // the front digit's gap: its free segments' outline stroked 2 px wide each side in what lies behind (the box's face,
    // catching the light), so 2 px of it shows between this finger and the curled ones; then the finger in ink on top
    c.save();
    c.lineJoin = 'round';
    c.strokeStyle = o.gapCol ?? mixLab(mixLab(K, env.mood.set, 0.3), o.rim.col, 0.45);
    c.lineWidth = px(2 * 1.4);
    for (const p of sp.front.gap) c.stroke(p);
    c.restore();
    c.fillStyle = K;
    for (const p of sp.front.pieces) c.fill(p);
  }
  // 3. the cut-lines: the joints, the knuckle crease, the sleeve's edge over the cuff
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(mixLab(K, o.rim.col, 0.55), 0.85);
  c.lineWidth = px(1.1);
  c.stroke(sp.cuts);
  c.strokeStyle = withAlpha(mixLab(K, o.rim.col, 0.45), 0.8);
  c.lineWidth = px(1.2);
  c.stroke(SLEEVE_EDGE);
  // 4. the cuff: ONE band, its front and top edges rimmed warm (1.7 stage px = ~2.5 px at 1080p, inside the kit's
  //    2.25-3 px rim floor), and a single button catching the same light
  c.strokeStyle = withAlpha(o.cuffRim, 0.9);
  c.lineWidth = px(1.7);
  c.stroke(CUFF_RIM);
  c.fillStyle = withAlpha(o.cuffRim, 0.75);
  c.beginPath();
  c.arc(BUTTON[0], BUTTON[1], 0.026, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = K;
  c.beginPath();
  c.arc(BUTTON[0] + 0.004, BUTTON[1] + 0.004, 0.014, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** the matchstick, pinched at PINCH_AT, its head at MATCH_LEN hand lengths along it */
function drawMatch(c: CanvasRenderingContext2D, a: PaperArm, len: number, env: PaintEnv, lit: number) {
  c.save();
  local(c, a, len);
  c.translate(PINCH_AT[0], PINCH_AT[1]);
  c.rotate(MATCH_DIR);
  const wood = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.55);
  c.fillStyle = wood;
  c.beginPath();
  c.moveTo(-0.06, -0.016);
  c.lineTo(MATCH_LEN - 0.03, -0.014);
  c.lineTo(MATCH_LEN - 0.03, 0.014);
  c.lineTo(-0.06, 0.016);
  c.closePath();
  c.fill();
  // the stick's lit edge (toward the flame once it burns)
  if (lit > 0.01) {
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.55 * Math.min(1, lit));
    c.fillRect(0.2, -0.016, MATCH_LEN - 0.23, 0.008);
  }
  // the head: charred once struck
  c.fillStyle = lit > 0 ? mixLab(PUPPET_NEAR_BLACK, env.mood.halo, 0.25) : mixLab(PUPPET_NEAR_BLACK, '#5a2a1c', 0.45);
  c.beginPath();
  c.ellipse(MATCH_LEN, 0, 0.045, 0.031, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** the matchbox (world): a small box, its striker strip along the edge the match scrapes */
export function drawMatchbox(c: CanvasRenderingContext2D, at: Pt, ang: number, w: number, h: number, env: PaintEnv, rim: { dx: number; dy: number; col: string; a: number }) {
  c.save();
  c.translate(at.x, at.y);
  c.rotate(ang);
  // (filled as a path: it is a dark prop with a rim, not a light paper card)
  const box = (x: number, y: number, bw: number, bh: number) => {
    c.beginPath();
    c.rect(x, y, bw, bh);
    c.fill();
  };
  c.fillStyle = withAlpha(rim.col, rim.a);
  box(-w / 2 + rim.dx, -h / 2 + rim.dy, w, h);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25);
  box(-w / 2, -h / 2, w, h);
  // the striker: a rough brown strip along the top edge, a step lighter
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, '#6a3a24', 0.5);
  box(-w / 2, -h / 2, w, h * 0.2);
  // the tray's edge (the box half open): a fine line
  c.fillStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, rim.col, 0.5), 0.7);
  box(-w / 2 + w * 0.62, -h / 2 + h * 0.2, 1, h * 0.8);
  c.restore();
}
