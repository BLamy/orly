/**
 * handwired-explained — every HAND in the film, one silhouette language at one scale (staging.hands).
 *
 * Adapted from neural-net-history's sets/narratorHands.ts (same rigid paper sprites, swapped on a hold, never
 * morphed), re-dressed and re-staged for this film's five hand roles:
 *
 *   narrator   the tag-keeper's two hands (cast `narrator-hands`): enter from the LOWER LEFT only, in a
 *              once-rolled linen sleeve over a bare forearm; no ring, no jewellery, no age marks. They alone
 *              tie · flip · rivet · lift · place · bend · holdUp (and rest).            hands.act(...)
 *   pencil     the red pencil (cast `red-pencil-hand`): ONE hand, frame RIGHT only, a plain shirt cuff, the
 *              red pencil held in a pinch. It alone hovers · writes · strikes · rests.   hands.pencil(...)
 *   viewer     the viewer's open hand (cast `viewer-hand`, ch12-s06 only): rises from BELOW, palm up, bare,
 *              no sleeve, no ring, no cuff; it only receives.                           hands.viewer(...)
 *   author / agent   the two desk rigs (cast `author-hands`, `agent-hand`): see deskHands() below.
 *
 *   import { hands } from '../cast';
 *   const pose = hands.act('tie', u, { x: 520, y: 418 }, { held: 'tag', entry: hands.entry(cam, 'L4') });
 *   hands.draw(c, pose, env, { heldDraw });      // inside f.layer('L4' | 'L5', …); u from env.tq (twos)
 *   const pp = hands.pencil('strike', u, { x: 640, y: 400 }, { strikeW: 90 });
 *   hands.draw(c, pp, env);                       // pp.tip = the pencil point; pp.stroke = 0..1 of the mark
 *
 * Layer: draw in L5 (near, blurred) while the hands enter, rest or cross the lens; draw in the SAME layer as
 * the line / bench (normally L4) for the moment they touch it, so knots and rivets land without parallax slip.
 * Motion is on twos: derive u from env.tq. Coordinates are the layer's rest-screen stage px. `scale`
 * multiplies the hand length (HAND_LEN 118 px: an insert on the line; ~0.7 a medium; ~1.6 a macro).
 *
 * Value hierarchy (review round 4): the hands are the darkest shapes in frame (PUPPET_NEAR_BLACK); the agent's
 * hand is one paper sheet paler. Rim (review round 3): a warm 2.5 px rim (65 % warm, 85 % opaque) on the upper,
 * light-facing edge of each cuff, roll and knuckle line only; everything else ink.
 */
import type { Camera3, LayerId, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

export type Pt = { x: number; y: number };
export type HandShapeN = 'rest' | 'pinch' | 'press' | 'grip' | 'flat' | 'open';
/** what a hand carries: tag (a manila tag on its string), card (a knot card / slip), marble, punch (the rivet
 *  punch), wire (a short copper length), pencil (the red pencil: pencil hand only) */
export type Held = 'none' | 'tag' | 'card' | 'marble' | 'punch' | 'wire' | 'pencil';
export type HandAction = 'rest' | 'tie' | 'flip' | 'rivet' | 'lift' | 'place' | 'bend' | 'holdUp';
export type PencilAction = 'hover' | 'write' | 'strike' | 'rest';
export type Sleeve = 'linen' | 'cuff' | 'bare';

export interface ArmPose {
  /** wrist point (stage px in the layer) */
  wrist: Pt;
  /** forearm direction, radians (wrist → fingertips); the sleeve runs back along -angle off frame */
  angle: number;
  /** wrist bend relative to the forearm, radians */
  bend?: number;
  shape: HandShapeN;
  held?: Held;
  sleeve?: Sleeve;
  /** 0 = the near-black hand; 0.35 = one paper sheet paler (the agent) */
  pale?: number;
  /** palm toward camera (the viewer's hand): mirrors the thumb side */
  palmUp?: boolean;
  /** no rim along the forearm (desk hands: the key light is the screen ahead, not the backlight above) */
  noArmRim?: boolean;
}

export interface HandsPose {
  right?: ArmPose;
  left?: ArmPose;
  /** hand length multiplier (1 = 118 px) */
  scale?: number;
  /** 0..1: how far into frame the hands are (0 = out of shot at the entry) */
  presence?: number;
  // ---- action state for the shot to take over (all flags are monotonic in u)
  /** tie: the knot is pulled (the tag now hangs from the line); place: the object is set down */
  placed?: boolean;
  /** tie: 0..1 of the loop round the line */
  knot?: number;
  /** flip: 0..1 of the tag's turn (front → back); draw the tag with scaleX = cos(π·flip) */
  flip?: number;
  /** rivet: the punch is down (or has been): punch the rivet now */
  riveted?: boolean;
  /** lift: the object has left its old place / has been let go at the new one */
  lifted?: boolean;
  released?: boolean;
  /** bend: 0 flat → 1 up (90°): the hinge angle; pivot = the target */
  hinge?: number;
  /** pencil: where the lead touches (world) */
  tip?: Pt;
  /** pencil write/strike: 0..1 of the mark laid down so far */
  stroke?: number;
}

export interface HeldDraw {
  /** draw your own held tag / card / marble at the socket point, upright (the tagLine set's drawTag). */
  heldDraw?: (c: CanvasRenderingContext2D, at: Pt, held: Held, env: PaintEnv) => void;
  /** card / tag paper colour; default: lamp-lit manila */
  paper?: string;
}

/** fixed entries (stage px, rest screen). Narrator: lower LEFT (R = working hand, L = support hand).
 *  Pencil: lower RIGHT. Viewer: below frame centre. */
export const HANDS_ENTRY = {
  R: { x: -140, y: 980 },
  L: { x: 130, y: 1060 },
  pencil: { x: 1430, y: 960 },
  viewer: { x: 900, y: 1080 },
} as const;
export const HAND_LEN = 118;

/** the red pencil's lacquer: low chroma, the only red in the film (cast red-pencil-hand rules) */
export const PENCIL_RED = '#8e3a2c';
/** the mark it leaves on a tag (a touch brighter than the lacquer, still low chroma) */
export const PENCIL_MARK = '#a4402e';
/** red mark resolved for a layer's haze (use for every red stroke on a tag) */
export function pencilRed(env: PaintEnv, k = 1): string {
  const h = env.layer.haze;
  return withAlpha(mixLab(PENCIL_MARK, env.mood.haze, h * 0.8), Math.max(0, Math.min(1, k)));
}

// ---------------------------------------------------------------- geometry (hand-local, unit = hand length)
// origin = wrist; +x toward the fingertips; +y = palm side. The thumb is on the -y side.
type P2 = [number, number];

function blob(pts: P2[], p = new Path2D()): Path2D {
  const n = pts.length;
  const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const m = mid(a, pts[(i + 1) % n]);
    p.quadraticCurveTo(a[0], a[1], m[0], m[1]);
  }
  p.closePath();
  return p;
}
function capsule(x0: number, y0: number, x1: number, y1: number, w0: number, w1 = w0, p = new Path2D()): Path2D {
  const dx = x1 - x0, dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const a = Math.atan2(dy, dx);
  p.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  p.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  p.arc(x1, y1, w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  p.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  p.arc(x0, y0, w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  p.closePath();
  return p;
}

interface HandSprite {
  body: Path2D[];
  /** cut-lines (knuckle crease) */
  cuts: Path2D;
  /** upper (lit) edge for the rim */
  rimEdge: Path2D;
  socket: P2;
}

/** a finger as two rigid capsules; each is its own Path2D in `parts` (one Path2D would cancel overlaps under
 *  the nonzero rule and punch pale holes where segments cross the palm) */
function finger(parts: Path2D[], base: P2, dir: number, len: number, w: number, curl = 0, split = 0.56) {
  const l1 = len * split;
  const l2 = len - l1;
  const j: P2 = [base[0] + Math.cos(dir) * l1, base[1] + Math.sin(dir) * l1];
  const d2 = dir + curl;
  const tip: P2 = [j[0] + Math.cos(d2) * l2, j[1] + Math.sin(d2) * l2];
  parts.push(capsule(base[0], base[1], j[0], j[1], w, w * 0.92));
  parts.push(capsule(j[0], j[1], tip[0], tip[1], w * 0.92, w * 0.8));
  return tip;
}

const lineP = (pts: P2[]) => {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  return p;
};
const arcP = (a: P2, c: P2, b: P2) => {
  const p = new Path2D();
  p.moveTo(a[0], a[1]);
  p.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  return p;
};

const SPRITES: Record<HandShapeN, HandSprite> = (() => {
  const S = {} as Record<HandShapeN, HandSprite>;
  const K: P2[] = [[0.47, -0.13], [0.5, -0.04], [0.48, 0.05], [0.43, 0.13]];
  const palmPts: P2[] = [[-0.02, -0.17], [0.2, -0.19], [0.42, -0.17], [0.53, -0.1], [0.54, 0.02], [0.49, 0.14], [0.36, 0.2], [0.16, 0.2], [-0.02, 0.17]];
  const thumbBase: P2 = [0.16, -0.16];
  const knuckleCut = () => {
    const p = arcP([0.44, -0.16], [0.53, -0.02], [0.44, 0.15]);
    // two short knuckle creases on the back of the hand (cast details: knuckle)
    p.moveTo(0.36, -0.1);
    p.lineTo(0.41, -0.11);
    p.moveTo(0.37, 0.0);
    p.lineTo(0.42, -0.005);
    return p;
  };
  const W = [0.105, 0.11, 0.1, 0.085];
  {
    const body: Path2D[] = [blob(palmPts)];
    finger(body, K[0], -0.06, 0.4, W[0], 0.38);
    finger(body, K[1], 0.02, 0.44, W[1], 0.42);
    finger(body, K[2], 0.1, 0.41, W[2], 0.46);
    finger(body, K[3], 0.2, 0.32, W[3], 0.48);
    finger(body, thumbBase, -0.42, 0.42, 0.12, 0.3, 0.5);
    S.rest = { body, cuts: knuckleCut(), rimEdge: lineP([[0.0, -0.17], [0.2, -0.19], [0.42, -0.17]]), socket: [0.86, 0.12] };
  }
  {
    const body: Path2D[] = [blob(palmPts)];
    // the index curls down to meet the thumb's tip (a true pinch, not a V)
    const tipI = finger(body, K[0], -0.15, 0.36, W[0], 0.85);
    finger(body, K[1], 0.55, 0.3, W[1], 1.9, 0.5);
    finger(body, K[2], 0.7, 0.27, W[2], 2.0, 0.5);
    finger(body, K[3], 0.85, 0.22, W[3], 2.0, 0.5);
    const tipT = finger(body, thumbBase, -0.12, 0.6, 0.12, 0.25, 0.5);
    S.pinch = { body, cuts: knuckleCut(), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.5, -0.33]]), socket: [(tipI[0] + tipT[0]) / 2, (tipI[1] + tipT[1]) / 2] };
  }
  {
    const body: Path2D[] = [blob(palmPts)];
    finger(body, K[0], 0.75, 0.24, W[0], 2.1, 0.5);
    finger(body, K[1], 0.85, 0.25, W[1], 2.1, 0.5);
    finger(body, K[2], 0.95, 0.23, W[2], 2.1, 0.5);
    finger(body, K[3], 1.05, 0.2, W[3], 2.0, 0.5);
    const tipT = finger(body, thumbBase, -0.12, 0.6, 0.125, 0.02, 0.5);
    S.press = { body, cuts: knuckleCut(), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.75, -0.27]]), socket: [tipT[0] + 0.04, tipT[1]] };
  }
  {
    const body: Path2D[] = [blob(palmPts)];
    finger(body, K[0], 0.5, 0.27, W[0] * 1.1, 2.0, 0.5);
    finger(body, K[1], 0.62, 0.28, W[1] * 1.1, 2.0, 0.5);
    finger(body, K[2], 0.74, 0.26, W[2] * 1.1, 2.0, 0.5);
    finger(body, K[3], 0.86, 0.22, W[3] * 1.1, 1.9, 0.5);
    finger(body, thumbBase, -0.18, 0.38, 0.125, 0.6, 0.55);
    const cuts = knuckleCut();
    cuts.addPath(arcP([0.58, -0.05], [0.64, 0.08], [0.56, 0.2]));
    S.grip = { body, cuts, rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.45, -0.27]]), socket: [0.6, 0.06] };
  }
  {
    const body: Path2D[] = [blob(palmPts)];
    finger(body, K[0], -0.1, 0.42, W[0], 0.04);
    finger(body, K[1], -0.02, 0.47, W[1], 0.04);
    finger(body, K[2], 0.06, 0.44, W[2], 0.05);
    finger(body, K[3], 0.15, 0.35, W[3], 0.06);
    finger(body, thumbBase, -0.5, 0.4, 0.12, 0.25, 0.5);
    S.flat = { body, cuts: knuckleCut(), rimEdge: lineP([[0.0, -0.17], [0.2, -0.19], [0.42, -0.17], [0.88, -0.2]]), socket: [0.85, 0.0] };
  }
  {
    const body: Path2D[] = [blob(palmPts)];
    finger(body, K[0], -0.32, 0.42, W[0], 0.1);
    finger(body, K[1], -0.1, 0.47, W[1], 0.12);
    finger(body, K[2], 0.12, 0.43, W[2], 0.14);
    finger(body, K[3], 0.34, 0.34, W[3], 0.16);
    finger(body, thumbBase, -0.85, 0.42, 0.12, 0.2, 0.5);
    S.open = { body, cuts: knuckleCut(), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.3, -0.45]]), socket: [0.86, -0.12] };
  }
  return S;
})();

// sleeves (hand-local, extending back along -x). Linen: rolled ONCE, a bare forearm between wrist and roll.
const SLEEVES = (() => {
  const L = 9; // runs well off frame
  // the bare forearm (wrist → roll), tapering wider toward the elbow
  const forearm = new Path2D();
  forearm.moveTo(0.02, -0.17);
  forearm.lineTo(-1.25, -0.25);
  forearm.lineTo(-1.25, 0.24);
  forearm.lineTo(0.02, 0.17);
  forearm.closePath();
  // the roll: one fat fold of linen, slightly wider than the arm, with a soft scalloped edge
  const roll = new Path2D();
  roll.moveTo(-1.08, -0.3);
  roll.quadraticCurveTo(-1.02, 0, -1.08, 0.3);
  roll.lineTo(-1.42, 0.33);
  roll.quadraticCurveTo(-1.48, 0, -1.42, -0.33);
  roll.closePath();
  // the sleeve beyond the roll, running off frame
  const linen = new Path2D();
  linen.moveTo(-1.4, -0.31);
  linen.lineTo(-L, -0.38);
  linen.lineTo(-L, 0.4);
  linen.lineTo(-1.4, 0.31);
  linen.closePath();
  const linenCuts = new Path2D();
  // the roll's two fold lines and one crease running back into the sleeve
  linenCuts.moveTo(-1.16, -0.29);
  linenCuts.quadraticCurveTo(-1.11, 0.0, -1.16, 0.29);
  linenCuts.moveTo(-1.31, -0.31);
  linenCuts.quadraticCurveTo(-1.26, 0.02, -1.31, 0.31);
  linenCuts.moveTo(-1.62, -0.12);
  linenCuts.quadraticCurveTo(-1.95, -0.02, -2.4, -0.1);
  const linenRim = new Path2D();
  linenRim.moveTo(-0.95, -0.235);
  linenRim.lineTo(0.0, -0.17);
  linenRim.moveTo(-1.42, -0.33);
  linenRim.quadraticCurveTo(-1.26, -0.315, -1.08, -0.3);
  linenRim.moveTo(-3.4, -0.35);
  linenRim.lineTo(-1.45, -0.315);

  // the pencil hand's plain shirt cuff (no button showing), sleeve running off frame
  const cuff = new Path2D();
  cuff.moveTo(-0.14, -0.25);
  cuff.lineTo(-0.5, -0.27);
  cuff.lineTo(-L, -0.34);
  cuff.lineTo(-L, 0.36);
  cuff.lineTo(-0.5, 0.27);
  cuff.lineTo(-0.14, 0.24);
  cuff.quadraticCurveTo(-0.1, 0, -0.14, -0.25);
  cuff.closePath();
  const cuffCuts = new Path2D();
  cuffCuts.moveTo(-0.5, -0.27);
  cuffCuts.quadraticCurveTo(-0.46, 0.0, -0.5, 0.27);
  const cuffRim = new Path2D();
  cuffRim.moveTo(-3.2, -0.31);
  cuffRim.lineTo(-0.5, -0.27);
  cuffRim.lineTo(-0.14, -0.25);

  // the viewer's bare forearm (no sleeve at all)
  const bare = new Path2D();
  bare.moveTo(0.02, -0.17);
  bare.lineTo(-L, -0.3);
  bare.lineTo(-L, 0.3);
  bare.lineTo(0.02, 0.17);
  bare.closePath();
  const bareRim = new Path2D();
  bareRim.moveTo(-3, -0.21);
  bareRim.lineTo(0.0, -0.17);
  return { forearm, roll, linen, linenCuts, linenRim, cuff, cuffCuts, cuffRim, bare, bareRim };
})();

// held objects (socket space: origin at the socket, unit = hand length)
const PUNCH = (() => {
  // a small hand rivet punch: a knurled grip through the fist, a tapered nose below
  const p = new Path2D();
  p.rect(-0.05, -0.34, 0.1, 0.36);
  blob([[-0.07, 0.0], [0.07, 0.0], [0.04, 0.16], [-0.04, 0.16]], p);
  p.rect(-0.018, 0.15, 0.036, 0.1);
  return p;
})();
/** the red pencil in pencil space: +x = toward the point; origin = the pinch (socket) */
const PENCIL = (() => {
  const shaft = new Path2D();
  shaft.moveTo(-0.62, -0.032);
  shaft.lineTo(0.3, -0.032);
  shaft.lineTo(0.3, 0.032);
  shaft.lineTo(-0.62, 0.032);
  shaft.closePath();
  const wood = new Path2D();
  wood.moveTo(0.3, -0.032);
  wood.lineTo(0.42, -0.008);
  wood.lineTo(0.42, 0.008);
  wood.lineTo(0.3, 0.032);
  wood.closePath();
  const lead = new Path2D();
  lead.moveTo(0.42, -0.008);
  lead.lineTo(0.455, 0);
  lead.lineTo(0.42, 0.008);
  lead.closePath();
  return { shaft, wood, lead, tip: 0.455 };
})();
/** the pencil's world angle when pinched: a writing grip, the point down and toward the paper, the butt up
 *  behind the knuckles (down-left when the hand reaches left from frame right; mirrored when reaching right) */
const PENCIL_DOWN_LEFT = 2.2;

// ---------------------------------------------------------------- draw
function paperOf(env: PaintEnv, o?: HeldDraw) {
  return o?.paper ?? mixLab(mixLab('#c9a86f', env.mood.halo, 0.35), env.mood.haze, env.layer.haze);
}

function localToWorld(a: Pick<ArmPose, 'wrist' | 'angle' | 'bend' | 'palmUp'>, len: number, lx: number, ly: number): Pt {
  const fy = (Math.cos(a.angle) < 0 ? -1 : 1) * (a.palmUp ? -1 : 1);
  const b = a.bend ?? 0;
  const x1 = lx * Math.cos(b) - ly * Math.sin(b);
  const y1 = lx * Math.sin(b) + ly * Math.cos(b);
  const x2 = x1 * len;
  const y2 = y1 * len * fy;
  const A = a.angle;
  return { x: a.wrist.x + x2 * Math.cos(A) - y2 * Math.sin(A), y: a.wrist.y + x2 * Math.sin(A) + y2 * Math.cos(A) };
}
function socketOf(a: ArmPose, len: number): Pt {
  const s = SPRITES[a.shape].socket;
  return localToWorld(a, len, s[0], s[1]);
}
/** world angle of the pencil when an arm pinches it (pointing down toward the paper, whichever way it reaches) */
function pencilAngle(a: Pick<ArmPose, 'angle' | 'bend'>): number {
  const facingLeft = Math.cos(a.angle) < 0;
  // follow the forearm a little so the pencil rides with the hand, but keep the writing grip
  const follow = 0.25 * (a.angle - (facingLeft ? -2.4 : -0.74)) + 0.5 * (a.bend ?? 0);
  return (facingLeft ? PENCIL_DOWN_LEFT : Math.PI - PENCIL_DOWN_LEFT) + follow;
}
function pencilTip(a: ArmPose, len: number): Pt {
  const s = socketOf(a, len);
  const ang = pencilAngle(a);
  return { x: s.x + Math.cos(ang) * PENCIL.tip * len, y: s.y + Math.sin(ang) * PENCIL.tip * len };
}

/** the red pencil itself, anywhere (in a hand, or resting on a post): `at` = the point of the lead */
export function drawPencil(c: CanvasRenderingContext2D, at: Pt, angle: number, len: number, env: PaintEnv) {
  c.save();
  c.translate(at.x, at.y);
  c.rotate(angle);
  c.scale(len, len);
  c.translate(-PENCIL.tip, 0);
  const h = env.layer.haze;
  c.fillStyle = mixLab(mixLab(PENCIL_RED, PUPPET_NEAR_BLACK, 0.35), env.mood.haze, h * 0.7);
  c.fill(PENCIL.shaft);
  c.fillStyle = mixLab(mixLab('#b89a72', env.mood.halo, 0.3), env.mood.haze, h * 0.7);
  c.fill(PENCIL.wood);
  c.fillStyle = mixLab(PENCIL_MARK, env.mood.haze, h * 0.6);
  c.fill(PENCIL.lead);
  // the lacquer catches the light along its top facet: the only red rim in frame (emberRed-like, low chroma)
  const m = c.getTransform();
  const dev = Math.hypot(m.a, m.b) || 1;
  c.strokeStyle = withAlpha(mixLab(PENCIL_MARK, '#f0a58a', 0.35), 0.8);
  c.lineWidth = 1.6 / dev;
  c.beginPath();
  c.moveTo(-0.6, -0.03);
  c.lineTo(0.3, -0.03);
  c.stroke();
  c.restore();
}

function drawArm(c: CanvasRenderingContext2D, a: ArmPose, len: number, env: PaintEnv, o: HeldDraw | undefined) {
  const pale = a.pale ?? 0;
  const ink = pale > 0 ? mixLab(PUPPET_NEAR_BLACK, env.fill('set'), pale) : env.layer.haze > 0.05 ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const rimCol = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.65), 0.85 * (1 - pale * 0.6));
  const cutCol = withAlpha(env.mood.rim, 0.4 * (1 - pale * 0.5));
  const lw = (dev: number) => {
    const m = c.getTransform();
    return dev / (Math.hypot(m.a, m.b) || 1);
  };
  const sp = SPRITES[a.shape];
  const facingLeft = Math.cos(a.angle) < 0;
  const flipY = (facingLeft ? -1 : 1) * (a.palmUp ? -1 : 1);
  const held = a.held ?? 'none';
  const sleeve = a.sleeve ?? 'linen';

  // paper is held BEHIND the fingers, so the pinch overlaps its edge
  if (held === 'tag' || held === 'card') {
    const s = socketOf(a, len);
    c.save();
    if (o?.heldDraw) o.heldDraw(c, s, held, env);
    else {
      const w = len * (held === 'tag' ? 0.55 : 0.62);
      const h = len * (held === 'tag' ? 0.78 : 0.28);
      const x0 = s.x - w * 0.5, y0 = s.y - h * 0.08;
      c.fillStyle = paperOf(env, o);
      c.beginPath();
      if (held === 'tag') {
        const k = w * 0.18;
        c.moveTo(x0 + k, y0);
        c.lineTo(x0 + w - k, y0);
        c.lineTo(x0 + w, y0 + k);
        c.lineTo(x0 + w, y0 + h);
        c.lineTo(x0, y0 + h);
        c.lineTo(x0, y0 + k);
        c.closePath();
      } else c.rect(x0, y0, w, h);
      c.fill();
    }
    c.restore();
  }

  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
  c.fillStyle = ink;
  c.lineCap = 'round';
  if (sleeve === 'linen') {
    c.fill(SLEEVES.forearm);
    c.fill(SLEEVES.linen);
    // the linen roll sits a half-step lighter than the arm so the fold reads against it
    c.fillStyle = mixLab(ink, env.fill('set'), 0.18);
    c.fill(SLEEVES.roll);
    c.strokeStyle = cutCol;
    c.lineWidth = lw(1.5);
    c.stroke(SLEEVES.linenCuts);
    c.strokeStyle = rimCol;
    c.lineWidth = lw(2.5);
    c.stroke(SLEEVES.linenRim);
  } else if (sleeve === 'cuff') {
    c.fill(SLEEVES.cuff);
    c.strokeStyle = cutCol;
    c.lineWidth = lw(1.5);
    c.stroke(SLEEVES.cuffCuts);
    c.strokeStyle = rimCol;
    c.lineWidth = lw(2.5);
    c.stroke(SLEEVES.cuffRim);
  } else {
    c.fill(SLEEVES.bare);
    if (!a.noArmRim) {
      c.strokeStyle = rimCol;
      c.lineWidth = lw(2.5);
      c.stroke(SLEEVES.bareRim);
    }
  }
  c.rotate(a.bend ?? 0);
  c.fillStyle = ink;
  for (const part of sp.body) c.fill(part);
  c.strokeStyle = cutCol;
  c.lineWidth = lw(1.4);
  c.stroke(sp.cuts);
  c.strokeStyle = rimCol;
  c.lineWidth = lw(2.4);
  c.stroke(sp.rimEdge);
  c.restore();

  if (held === 'none' || held === 'tag' || held === 'card') return;
  const s = socketOf(a, len);
  const ang = a.angle + (a.bend ?? 0);
  c.save();
  if (held === 'pencil') {
    drawPencil(c, pencilTip(a, len), pencilAngle(a), len, env);
  } else if (held === 'punch') {
    c.translate(s.x, s.y);
    c.scale(len, len);
    c.fillStyle = ink;
    c.fill(PUNCH);
    c.strokeStyle = withAlpha(env.mood.rim, 0.5);
    c.lineWidth = lw(1.4);
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      c.moveTo(-0.05, -0.3 + i * 0.07);
      c.lineTo(0.05, -0.3 + i * 0.07);
    }
    c.stroke();
  } else if (held === 'marble') {
    const r = len * 0.075;
    if (o?.heldDraw) o.heldDraw(c, s, held, env);
    else {
      const g = c.createRadialGradient(s.x - r * 0.35, s.y - r * 0.35, r * 0.1, s.x, s.y, r);
      g.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.2));
      g.addColorStop(0.5, env.mood.halo);
      g.addColorStop(1, mixLab(env.mood.halo, PUPPET_NEAR_BLACK, 0.6));
      c.fillStyle = g;
      c.beginPath();
      c.arc(s.x, s.y + r * 0.6, r, 0, Math.PI * 2);
      c.fill();
    }
  } else if (held === 'wire') {
    c.translate(s.x, s.y);
    c.rotate(ang);
    c.strokeStyle = copperOf(env);
    c.lineWidth = Math.max(lw(2.2), len * 0.025);
    c.beginPath();
    c.moveTo(-len * 0.1, 0);
    c.lineTo(len * 0.7, 0);
    c.stroke();
  }
  c.restore();
}

/** the film's copper (wire, hinge, rivet), hazed for the layer */
export function copperOf(env: PaintEnv, glow = 0): string {
  const base = mixLab('#b0683a', env.mood.halo, 0.25);
  return mixLab(mixLab(base, env.mood.core, glow * 0.6), env.mood.haze, env.layer.haze * 0.8);
}

function draw(c: CanvasRenderingContext2D, p: HandsPose, env: PaintEnv, o?: HeldDraw) {
  const len = HAND_LEN * (p.scale ?? 1);
  if (p.left) drawArm(c, p.left, len, env, o);
  if (p.right) drawArm(c, p.right, len, env, o);
}

// ---------------------------------------------------------------- actions (pure keyframes of u)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const seg = (u: number, a: number, b: number) => ease((u - a) / (b - a));
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
/** a shallow arc between two points (the forearms slide in on a curve, never a straight line) */
const arcP2 = (a: Pt, b: Pt, u: number, bow = 0.12): Pt => {
  const p = lerpP(a, b, u);
  const dx = b.x - a.x, dy = b.y - a.y;
  const k = Math.sin(Math.PI * u) * bow;
  return { x: p.x + dy * k, y: p.y - Math.abs(dx) * k * 0.5 };
};

/** an arm whose sleeve runs back through `entry`, wrist placed so the socket lands on `socketAt` */
function reach(entry: Pt, socketAt: Pt, shape: HandShapeN, len: number, extra: Partial<ArmPose> = {}): ArmPose {
  const s = SPRITES[shape].socket;
  let ang = Math.atan2(socketAt.y - entry.y, socketAt.x - entry.x);
  const bend = extra.bend ?? 0;
  let wrist = socketAt;
  for (let i = 0; i < 3; i++) {
    const v = localToWorld({ wrist: { x: 0, y: 0 }, angle: ang, bend, palmUp: extra.palmUp }, len, s[0], s[1]);
    wrist = { x: socketAt.x - v.x, y: socketAt.y - v.y };
    ang = Math.atan2(wrist.y - entry.y, wrist.x - entry.x);
  }
  return { ...extra, wrist, angle: ang, shape, bend };
}
/** like reach, but solves for the PENCIL POINT landing on `tipAt` */
function reachTip(entry: Pt, tipAt: Pt, len: number, extra: Partial<ArmPose> = {}): ArmPose {
  let sock = tipAt;
  let arm = reach(entry, sock, 'pinch', len, extra);
  for (let i = 0; i < 3; i++) {
    const tp = pencilTip(arm, len);
    sock = { x: sock.x + (tipAt.x - tp.x), y: sock.y + (tipAt.y - tp.y) };
    arm = reach(entry, sock, 'pinch', len, extra);
  }
  return arm;
}

export interface ActOpts {
  held?: Held;
  scale?: number;
  /** override the entries for a camera (hands.entry(cam, layer)): R and L for the narrator */
  entry?: { R?: Pt; L?: Pt };
  /** lift: where the object goes; place: (unused) */
  dropAt?: Pt;
  /** bend: the length of wire bent up (stage px), default 0.9 hand */
  armLen?: number;
}

/**
 * The narrator's actions as one function of u ∈ [0,1] (derive u from env.tq so the hands move on twos):
 *  tie     carry the tag up under the line (0–.3), loop its string over the wire once (.3–.5, knot 0→1),
 *          pull the knot down (.5–.6, placed from .55: the detent's tie click), withdraw lower left (.6–1)
 *  flip    reach in open (0–.3), pinch the tag's lower corner (.3–.38), turn it over (.38–.62, flip 0→1:
 *          the paper snap at ~.5), let go (.62), withdraw (.7–1)
 *  rivet   carry the punch above the tag corner (0–.35), lift (.35–.45), punch (.45–.52, riveted: the dry
 *          clack), hold (.52–.62), withdraw (.62–1)
 *  lift    reach in open (0–.3), pinch (.3–.42, lifted from .36), carry along an arc to dropAt (.42–.62),
 *          let go (released from .62), withdraw (.7–1)
 *  place   carry the object to the target (0–.4), settle (.4–.5), open the fingers (placed from .5),
 *          withdraw (.6–1)
 *  bend    both hands take the wire either side of the pivot (0–.3), the working hand turns its end up
 *          about the pivot (.35–.65, hinge 0→1: flat, then up), hold (.65–.78), withdraw (.78–1)
 *  holdUp  raise the object into the backlight at the target (0–.35), hold (.35–.75), lower and withdraw
 *  rest    the hands lie at the lower-left entry, barely in frame (presence .25)
 */
function act(action: HandAction, u: number, target: Pt, o: ActOpts = {}): HandsPose {
  const scale = o.scale ?? 1;
  const len = HAND_LEN * scale;
  const ER = o.entry?.R ?? HANDS_ENTRY.R;
  const EL = o.entry?.L ?? HANDS_ENTRY.L;
  const off = (E: Pt, T: Pt, k = 0.15): Pt => lerpP(E, T, k);
  const U = clamp01(u);
  const held = o.held;
  const arm = (at: Pt, shape: HandShapeN, extra: Partial<ArmPose> = {}) => reach(ER, at, shape, len, { sleeve: 'linen', ...extra });
  const restR: Pt = { x: ER.x + 300 * scale, y: ER.y - 300 * scale };

  switch (action) {
    case 'rest':
      return { right: arm(restR, 'rest', { bend: -0.15 }), scale, presence: 0.25 };
    case 'tie': {
      const under = { x: target.x - len * 0.05, y: target.y + len * 0.35 };
      const R = len * 0.16;
      let at: Pt;
      let shape: HandShapeN = 'pinch';
      let h: Held = held ?? 'tag';
      let knot = 0;
      if (U < 0.3) at = arcP2(off(ER, under), under, seg(U, 0, 0.3));
      else if (U < 0.5) {
        knot = seg(U, 0.3, 0.5);
        const th = Math.PI / 2 + knot * Math.PI * 2;
        at = { x: target.x + Math.cos(th) * R, y: target.y + Math.sin(th) * R + len * 0.2 * (1 - knot) };
      } else if (U < 0.6) {
        knot = 1;
        at = lerpP({ x: target.x, y: target.y + R }, { x: target.x + len * 0.05, y: target.y + len * 0.28 }, seg(U, 0.5, 0.56));
        if (U >= 0.55) {
          h = 'none';
          shape = 'open';
        }
      } else {
        knot = 1;
        h = 'none';
        shape = 'rest';
        at = arcP2({ x: target.x + len * 0.05, y: target.y + len * 0.28 }, off(ER, target, 0), seg(U, 0.6, 1));
      }
      return { right: arm(at, shape, { held: h }), scale, knot, placed: U >= 0.55, presence: U < 0.6 ? seg(U, 0, 0.2) : 1 - seg(U, 0.85, 1) };
    }
    case 'flip': {
      const corner = { x: target.x + len * 0.05, y: target.y + len * 0.25 };
      let at: Pt;
      let shape: HandShapeN = 'open';
      let flip = 0;
      if (U < 0.3) at = arcP2(off(ER, corner), { x: corner.x - len * 0.12, y: corner.y + len * 0.1 }, seg(U, 0, 0.3));
      else if (U < 0.38) {
        at = lerpP({ x: corner.x - len * 0.12, y: corner.y + len * 0.1 }, corner, seg(U, 0.3, 0.38));
        shape = 'pinch';
      } else if (U < 0.62) {
        flip = seg(U, 0.38, 0.62);
        // the fingers carry the corner round the tag's vertical axis: out toward camera and back
        at = { x: target.x + Math.cos(Math.PI * flip) * len * 0.05, y: corner.y - Math.sin(Math.PI * flip) * len * 0.06 };
        shape = 'pinch';
      } else {
        flip = 1;
        at = arcP2({ x: target.x - len * 0.05, y: corner.y }, off(ER, target, 0), seg(U, 0.68, 1));
        shape = U < 0.68 ? 'open' : 'rest';
      }
      return { right: arm(at, shape), scale, flip, presence: U < 0.62 ? seg(U, 0, 0.2) : 1 - seg(U, 0.85, 1) };
    }
    case 'rivet': {
      const above = { x: target.x, y: target.y - len * 0.6 };
      const down = { x: target.x, y: target.y - len * 0.25 };
      let at: Pt;
      if (U < 0.35) at = arcP2(off(ER, target), above, seg(U, 0, 0.35));
      else if (U < 0.45) at = lerpP(above, { x: above.x, y: above.y - len * 0.1 }, seg(U, 0.35, 0.45));
      else if (U < 0.52) at = lerpP({ x: above.x, y: above.y - len * 0.1 }, down, seg(U, 0.45, 0.49));
      else if (U < 0.62) at = down;
      else at = arcP2(down, off(ER, target, 0), seg(U, 0.62, 1));
      return { right: arm(at, 'grip', { held: 'punch', bend: 0.35 }), scale, riveted: U >= 0.49, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'lift': {
      const drop = o.dropAt ?? { x: target.x + len * 0.6, y: target.y + len * 0.4 };
      const pre = { x: target.x - len * 0.15, y: target.y + len * 0.08 };
      let at: Pt;
      let shape: HandShapeN = 'open';
      let h: Held = 'none';
      if (U < 0.3) at = arcP2(off(ER, target), pre, seg(U, 0, 0.3));
      else if (U < 0.42) {
        at = lerpP(pre, target, seg(U, 0.3, 0.42));
        shape = 'pinch';
        h = U > 0.36 ? held ?? 'tag' : 'none';
      } else if (U < 0.62) {
        at = arcP2(target, drop, seg(U, 0.42, 0.62), 0.25);
        shape = 'pinch';
        h = held ?? 'tag';
      } else if (U < 0.7) at = drop;
      else at = arcP2(drop, off(ER, drop, 0), seg(U, 0.7, 1));
      return { right: arm(at, U >= 0.62 ? (U < 0.7 ? 'open' : 'rest') : shape, { held: h }), scale, lifted: U >= 0.36, released: U >= 0.62, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'place': {
      const near = { x: target.x - len * 0.1, y: target.y - len * 0.12 };
      let at: Pt;
      let shape: HandShapeN = 'pinch';
      let h: Held = held ?? 'card';
      if (U < 0.4) at = arcP2(off(ER, near), near, seg(U, 0, 0.4));
      else if (U < 0.5) at = lerpP(near, target, seg(U, 0.4, 0.5));
      else if (U < 0.6) {
        at = { x: target.x - len * 0.03 * seg(U, 0.5, 0.6), y: target.y - len * 0.08 * seg(U, 0.5, 0.6) };
        shape = 'open';
        h = 'none';
      } else {
        at = arcP2({ x: target.x - len * 0.03, y: target.y - len * 0.08 }, off(ER, target, 0), seg(U, 0.6, 1));
        shape = 'rest';
        h = 'none';
      }
      return { right: arm(at, shape, { held: h }), scale, placed: U >= 0.5, presence: U < 0.6 ? seg(U, 0, 0.2) : 1 - seg(U, 0.85, 1) };
    }
    case 'bend': {
      const L = o.armLen ?? len * 0.9;
      const hinge = seg(U, 0.35, 0.65);
      const th = -hinge * Math.PI / 2; // the free end turns up about the pivot
      const holdAt = { x: target.x - len * 0.32, y: target.y };
      const freeAt = { x: target.x + Math.cos(th) * L * 0.7, y: target.y + Math.sin(th) * L * 0.7 };
      const inU = seg(U, 0, 0.3);
      const outU = seg(U, 0.78, 1);
      const left = reach(EL, lerpP(off(EL, holdAt), holdAt, inU * (1 - outU)), 'grip', len, { sleeve: 'linen', bend: 0.1 });
      const right = arm(lerpP(off(ER, freeAt), freeAt, inU * (1 - outU)), 'pinch', { bend: -0.2 });
      return { right, left, scale, hinge, presence: inU * (1 - outU) };
    }
    case 'holdUp': {
      let at: Pt;
      if (U < 0.35) at = arcP2(off(ER, target), target, seg(U, 0, 0.35));
      else if (U < 0.75) at = target;
      else at = arcP2(target, off(ER, target, 0), seg(U, 0.75, 1));
      return { right: arm(at, 'pinch', { held: held ?? 'card' }), scale, presence: seg(U, 0, 0.2) * (1 - seg(U, 0.85, 1)) };
    }
  }
}

export interface PencilOpts {
  scale?: number;
  /** override the pencil entry for a camera (hands.entry(cam, layer).pencil) */
  entry?: Pt;
  /** write: the width of the written mark (stage px, default 0.8 hand); strike: the stroke length */
  writeW?: number;
  strikeW?: number;
  /** strike: the stroke's slope (radians, default -0.12: a firm stroke rising slightly to the right) */
  strikeAngle?: number;
  /** rest: the pencil's resting angle on the post (default lying almost flat, point left) */
  restAngle?: number;
}

/**
 * The red pencil hand (frame RIGHT only), as one function of u ∈ [0,1]. The pose's `tip` is the lead point.
 *  hover   approach to the target's edge (0–.35), hold still (.35–.75), withdraw (.75–1). Nothing is written.
 *  write   approach (0–.3), write left to right across writeW (.3–.75, stroke 0→1, tiny letter loops),
 *          lift (.75–.8), withdraw (.8–1). The shot reveals its red text with `stroke` (clip x).
 *  strike  approach the stroke's start (0–.3), ONE firm stroke (.35–.47, stroke 0→1: the dry scratch),
 *          lift and withdraw (.55–1). Shoot it as a tight insert where staging says so.
 *  rest    carry the pencil to the target (the post's rest point) (0–.4), lay it down (.4–.5, placed),
 *          withdraw the empty hand (.55–1); afterwards draw it with drawPencil(c, target, restAngle, …).
 */
function pencil(action: PencilAction, u: number, target: Pt, o: PencilOpts = {}): HandsPose {
  const scale = o.scale ?? 1;
  const len = HAND_LEN * scale;
  const E = o.entry ?? HANDS_ENTRY.pencil;
  const U = clamp01(u);
  const off = (T: Pt, k = 0.15): Pt => lerpP(E, T, k);
  const base: Partial<ArmPose> = { sleeve: 'cuff', held: 'pencil', bend: 0.1 };
  const mk = (tipAt: Pt, extra: Partial<ArmPose> = {}) => reachTip(E, tipAt, len, { ...base, ...extra });
  switch (action) {
    case 'hover': {
      const edge = { x: target.x + len * 0.12, y: target.y - len * 0.04 };
      let at: Pt;
      if (U < 0.35) at = arcP2(off(edge), edge, seg(U, 0, 0.35));
      else if (U < 0.75) at = { x: edge.x + Math.sin((U - 0.35) * 9) * len * 0.006, y: edge.y };
      else at = arcP2(edge, off(edge, 0), seg(U, 0.75, 1));
      const a = mk(at);
      return { right: a, scale, tip: pencilTip(a, len), stroke: 0, presence: seg(U, 0, 0.2) * (1 - seg(U, 0.85, 1)) };
    }
    case 'write': {
      const w = o.writeW ?? len * 0.8;
      const x0 = target.x - w / 2, x1 = target.x + w / 2;
      let at: Pt;
      let stroke = 0;
      if (U < 0.3) at = arcP2(off({ x: x0, y: target.y }), { x: x0, y: target.y - len * 0.05 }, seg(U, 0, 0.3));
      else if (U < 0.75) {
        stroke = (U - 0.3) / 0.45;
        // letter-sized loops riding along the baseline (on twos via u)
        const ph = stroke * Math.PI * 2 * Math.max(3, w / (len * 0.12));
        at = { x: x0 + w * stroke + Math.cos(ph) * len * 0.02, y: target.y + Math.sin(ph) * len * 0.035 };
      } else if (U < 0.8) {
        stroke = 1;
        at = { x: x1, y: target.y - len * 0.05 * seg(U, 0.75, 0.8) };
      } else {
        stroke = 1;
        at = arcP2({ x: x1, y: target.y - len * 0.05 }, off(target, 0), seg(U, 0.8, 1));
      }
      const a = mk(at);
      return { right: a, scale, tip: pencilTip(a, len), stroke, presence: seg(U, 0, 0.2) * (1 - seg(U, 0.85, 1)) };
    }
    case 'strike': {
      const w = o.strikeW ?? len * 0.9;
      const sa = o.strikeAngle ?? -0.12;
      const p0 = { x: target.x - Math.cos(sa) * w / 2, y: target.y - Math.sin(sa) * w / 2 };
      const p1 = { x: target.x + Math.cos(sa) * w / 2, y: target.y + Math.sin(sa) * w / 2 };
      let at: Pt;
      let stroke = 0;
      if (U < 0.3) at = arcP2(off(p0), { x: p0.x, y: p0.y - len * 0.08 }, seg(U, 0, 0.3));
      else if (U < 0.35) at = lerpP({ x: p0.x, y: p0.y - len * 0.08 }, p0, seg(U, 0.3, 0.35));
      else if (U < 0.47) {
        stroke = seg(U, 0.35, 0.47);
        at = lerpP(p0, p1, stroke);
      } else if (U < 0.55) {
        stroke = 1;
        at = { x: p1.x, y: p1.y - len * 0.08 * seg(U, 0.47, 0.55) };
      } else {
        stroke = 1;
        at = arcP2({ x: p1.x, y: p1.y - len * 0.08 }, off(p1, 0), seg(U, 0.55, 1));
      }
      const a = mk(at);
      return { right: a, scale, tip: pencilTip(a, len), stroke, presence: seg(U, 0, 0.2) * (1 - seg(U, 0.85, 1)) };
    }
    case 'rest': {
      if (U < 0.5) {
        const at = U < 0.4 ? arcP2(off(target), { x: target.x, y: target.y - len * 0.08 }, seg(U, 0, 0.4)) : lerpP({ x: target.x, y: target.y - len * 0.08 }, target, seg(U, 0.4, 0.5));
        const a = mk(at);
        return { right: a, scale, tip: pencilTip(a, len), placed: false, presence: seg(U, 0, 0.2) };
      }
      const sock = { x: target.x + len * 0.35, y: target.y - len * 0.25 };
      const at = U < 0.55 ? sock : arcP2(sock, off(sock, 0), seg(U, 0.55, 1));
      const a = reach(E, at, U < 0.6 ? 'open' : 'rest', len, { sleeve: 'cuff', bend: 0.1 });
      return { right: a, scale, placed: true, presence: 1 - seg(U, 0.85, 1) };
    }
  }
}

/**
 * The viewer's open hand (ch12-s06 only): rises from below frame centre, palm up, bare (no sleeve, ring or
 * cuff), opens fully as the hinge and tag are placed, then holds still.
 *  receive  rise to the target (0–.4, relaxed), open (.4–.55), hold (.55–1). The socket (palm centre) is the
 *           target: place the narrator's hinge there.
 */
function viewer(u: number, target: Pt, o: { scale?: number; entry?: Pt; bend?: number } = {}): HandsPose & { palm?: Pt } {
  const scale = o.scale ?? 1;
  const len = HAND_LEN * scale;
  const E = o.entry ?? HANDS_ENTRY.viewer;
  const U = clamp01(u);
  // rises on a shallow arc from below; the wrist turns so the open hand lies near-level, palm up (cupped)
  const from = { x: target.x + len * 0.6, y: E.y };
  const at = arcP2(from, target, seg(U, 0, 0.4), 0.06);
  const shape: HandShapeN = U < 0.45 ? 'rest' : 'flat';
  const bend = (o.bend ?? -0.75) * seg(U, 0.2, 0.5);
  const a = reach(E, at, shape, len, { sleeve: 'bare', palmUp: true, bend });
  const palm = localToWorld(a, len, 0.42, 0);
  return { right: a, scale, presence: seg(U, 0, 0.25), placed: U >= 0.55, palm: { x: palm.x, y: palm.y - len * 0.1 } };
}

/**
 * The fixed entries expressed in a layer's coordinates for a camera, so the hands always enter from the
 * FRAME's lower left (narrator), lower right (pencil) or bottom (viewer) whatever the camera does.
 */
export function handsEntry(cam: Camera3, layer: LayerId = 'L5'): { R: Pt; L: Pt; pencil: Pt; viewer: Pt } {
  const t = (p: Pt) => toLayer(LAYERS[layer], cam, p.x, p.y);
  return { R: t(HANDS_ENTRY.R), L: t(HANDS_ENTRY.L), pencil: t(HANDS_ENTRY.pencil), viewer: t(HANDS_ENTRY.viewer) };
}

// ---------------------------------------------------------------- desk hands (author + agent)
export interface DeskHandsOpts {
  /** the keyboard's centre (front edge of the laptop base), stage px in the layer */
  x: number;
  y: number;
  /** laptop width (stage px), default 300 */
  w?: number;
  /** shot time on twos (env.tq): drives the typing loop */
  tq: number;
  /** the author's hands: 'type' | 'rest' | 'pause' (one hand lifts from the keys and rests) | 'off' */
  author?: 'type' | 'rest' | 'pause' | 'off';
  /** the agent's single hand: 'type' (half a beat behind the author) | 'rest' | 'off' (default off) */
  agent?: 'type' | 'rest' | 'off';
  /** 0..1 how far the agent's hand has come in (it never acts first: bring it in after the author types) */
  agentIn?: number;
  /** pause: 0..1 how far the lifted hand has risen (and settled) */
  pauseU?: number;
  /** the screen's glow (0..1); the shot adds f.practical({kind:'screen'}) at deskHands.screen(o) */
  screen?: number;
}

/** the laptop's screen rectangle (world) for a deskHands call: add the practical light there */
function deskScreen(o: DeskHandsOpts) {
  const w = o.w ?? 300;
  const sw = w * 0.88, sh = w * 0.56;
  const top = o.y - w * 0.045 - sh;
  return { x: o.x - sw / 2, y: top, w: sw, h: sh, cx: o.x, cy: top + sh / 2 };
}

/**
 * Two hands at one logo-less laptop, seen from behind the typist with the camera low, at keyboard height: the
 * lit screen stands behind the hands, so knuckles and fingers read as pure silhouette against it (framed at the
 * wrists, forearms running off the bottom edge). The author's two hands sit centre-left; the agent's single
 * hand, one paper sheet paler and with no cuff detail, comes in from the lower right and types half a beat
 * behind. Never a face, a body, a logo or a word on the screen. (x, y) = the front edge of the base.
 */
export function deskHands(c: CanvasRenderingContext2D, o: DeskHandsOpts, env: PaintEnv) {
  const w = o.w ?? 300;
  const k = w / 300;
  const len = HAND_LEN * 0.9 * k;
  const ink = env.layer.haze > 0.05 ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const scr = deskScreen(o);
  const glow = o.screen ?? 1;
  const dev = () => Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
  // the lid: a thin dark bezel and the lit screen (blank paper light, no words)
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(scr.x - 8 * k, scr.y - 8 * k, scr.w + 16 * k, scr.h + 10 * k, 5 * k);
  c.fill();
  const g = c.createLinearGradient(0, scr.y, 0, scr.y + scr.h);
  g.addColorStop(0, mixLab(env.mood.set, env.mood.core, 0.2 + 0.5 * glow));
  g.addColorStop(0.75, mixLab(env.mood.set, env.mood.core, 0.25 + 0.6 * glow));
  g.addColorStop(1, mixLab(env.mood.set, env.mood.halo, 0.2 + 0.55 * glow));
  c.fillStyle = g;
  c.fillRect(scr.x, scr.y, scr.w, scr.h);
  // the base seen almost edge-on from keyboard height: a thin slab
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(o.x - w * 0.5, o.y - w * 0.045);
  c.lineTo(o.x + w * 0.5, o.y - w * 0.045);
  c.lineTo(o.x + w * 0.53, o.y);
  c.lineTo(o.x - w * 0.53, o.y);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.75);
  c.lineWidth = 1.8 / dev();
  c.beginPath();
  c.moveTo(o.x - w * 0.5, o.y - w * 0.045);
  c.lineTo(o.x + w * 0.5, o.y - w * 0.045);
  c.stroke();
  c.restore();

  // typing loop on twos: each finger-dip is one held drawing, seeded per hand
  const step = Math.floor(o.tq * 6);
  const dip = (salt: number, lag = 0) => {
    const s = step - lag;
    const h = Math.sin(s * 12.9898 + salt * 78.233) * 43758.5453;
    return h - Math.floor(h) > 0.45 ? 1 : 0;
  };
  const tipsY = o.y - w * 0.13;
  const bottom = o.y + w * 1.1;
  const one = (tip: Pt, entry: Pt, shape: HandShapeN, pale = 0) => {
    const arm = reach(entry, tip, shape, len, { sleeve: 'bare', pale, noArmRim: true });
    drawArm(c, arm, len, env, undefined);
  };
  const author = o.author ?? 'type';
  if (author !== 'off') {
    const pu = author === 'pause' ? clamp01(o.pauseU ?? 1) : 0;
    const dL = author === 'type' ? dip(1) : 0;
    const dR = author === 'type' ? dip(2) : 0;
    one({ x: o.x - w * 0.2, y: tipsY + dL * 4 * k }, { x: o.x - w * 0.45, y: bottom }, dL ? 'flat' : 'rest');
    // on a pause the right hand lifts off the keys (a small arc) and comes to rest flat on the base's edge
    const lift = Math.sin(Math.PI * Math.min(1, pu * 1.3)) * w * 0.12;
    const rx = o.x + w * 0.04 + pu * w * 0.08;
    const ry = tipsY + dR * 4 * k - lift + pu * w * 0.08;
    one({ x: rx, y: ry }, { x: o.x + w * 0.12, y: bottom }, author === 'type' ? (dR ? 'flat' : 'rest') : pu > 0.6 ? 'flat' : 'rest');
  }
  const agent = o.agent ?? 'off';
  if (agent !== 'off') {
    const ain = clamp01(o.agentIn ?? 1);
    const d = agent === 'type' ? dip(3, 1) : 0;
    const tip = { x: o.x + w * 0.27 + (1 - ain) * w * 0.35, y: tipsY + d * 4 * k + (1 - ain) * w * 0.7 };
    one(tip, { x: o.x + w * 0.7, y: bottom }, d ? 'flat' : 'rest', 0.35);
  }
}

export const narratorHands = {
  entry: handsEntry,
  draw,
  act,
  pencil,
  viewer,
  drawPencil,
  pencilRed,
  copperOf,
  /** world point of the held object (socket) of the right or left hand */
  socket(p: HandsPose, side: 'right' | 'left' = 'right'): Pt | null {
    const a = p[side];
    return a ? socketOf(a, HAND_LEN * (p.scale ?? 1)) : null;
  },
  /** low-level: build an arm aimed from an entry so its socket lands on a point */
  reach,
  deskHands,
  deskScreen,
  SHAPES: Object.keys(SPRITES) as HandShapeN[],
};
