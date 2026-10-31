/**
 * ch12-s03 — the detective's hands at the desk insert, drawn softer (review round 4 critic).
 *
 * At the insert's scale (≈ 1.25× hand length, the hands fill a third of the frame) the shared rig's curled-finger
 * capsules read as cog-like serrated knuckles and its straight tweed sleeve as a flat slab. This painter draws the
 * SAME poses (ArmPose from `hands.reach`, the same sockets, so held cards, chips, slips and the pen land exactly where
 * the rig would put them) with:
 *   - a soft paper hand: a palm and 3-4 rounded finger segments with shallow, smooth scallops (no notched knuckles);
 *   - a tapered forearm: the sleeve swells a little behind the cuff and is ≈ 35 % narrower at the cuff than where it
 *     leaves the frame, the shirt cuff a pale band, the tweed cuff's turn-back and two buttons kept (the rig's
 *     costume), the signet ring on the right hand kept.
 *
 *   softHands.draw(c, { right: arm, scale }, env, { heldDraw })   same signature as hands.draw
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { HAND_LEN, narratorHands, type ArmPose, type HandShapeN, type HandsPose, type HeldDraw, type Pt } from './narratorHands';

type C = CanvasRenderingContext2D;
type P2 = [number, number];

/** a closed outline smoothed through the midpoints of its vertices (every corner rounded) */
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
/** one rounded finger: a single tapered segment with a round tip (no knuckle joint) */
function finger(p: Path2D, base: P2, tip: P2, w0: number, w1: number) {
  const dx = tip[0] - base[0], dy = tip[1] - base[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const a = Math.atan2(dy, dx);
  p.moveTo(base[0] + (nx * w0) / 2, base[1] + (ny * w0) / 2);
  p.lineTo(tip[0] + (nx * w1) / 2, tip[1] + (ny * w1) / 2);
  p.arc(tip[0], tip[1], w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  p.lineTo(base[0] - (nx * w0) / 2, base[1] - (ny * w0) / 2);
  p.arc(base[0], base[1], w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  p.closePath();
}

interface Soft {
  body: Path2D;
  /** separate finger shapes (filled on their own, so their winding never cuts holes in the palm) */
  fingers?: Path2D;
  /** soft cut-lines: one thumb crease, one finger-gap line (rim strokes, low) */
  cuts: Path2D;
  /** the lit upper edge */
  rimEdge: Path2D;
  /** the signet ring band */
  ring: Path2D;
}

/** hand-local (origin wrist, +x to the fingertips, unit = hand length; −y is the thumb side). Each sprite's finger
 *  or thumb tips sit on the rig's own socket for the shape, so held things land where they always have. */
const SOFT: Record<HandShapeN, Soft> = (() => {
  const S = {} as Record<HandShapeN, Soft>;
  const line = (pts: P2[]) => {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    return p;
  };
  const curve = (a: P2, c: P2, b: P2) => {
    const p = new Path2D();
    p.moveTo(a[0], a[1]);
    p.quadraticCurveTo(c[0], c[1], b[0], b[1]);
    return p;
  };
  const thumbCrease = () => curve([0.14, -0.13], [0.24, -0.09], [0.34, -0.13]);
  // a closed hand (fist / folded fingers): the front edge is four shallow, rounded finger segments
  const fist = (front: number): P2[] => [
    [front - 0.02, -0.1],
    [front + 0.04, -0.06],
    [front + 0.015, -0.02],
    [front + 0.05, 0.03],
    [front + 0.02, 0.07],
    [front + 0.04, 0.12],
    [front - 0.02, 0.18],
  ];
  // GRIP (the pen): a soft fist round the pen, the thumb laid over the index
  {
    const body = blob([[-0.03, -0.17], [0.2, -0.19], [0.42, -0.23], [0.58, -0.17], ...fist(0.6), [0.46, 0.23], [0.24, 0.22], [0.04, 0.2], [-0.03, 0.17]]);
    const cuts = new Path2D();
    cuts.addPath(thumbCrease());
    cuts.addPath(curve([0.48, -0.15], [0.58, -0.1], [0.62, -0.06]));
    S.grip = { body, cuts, rimEdge: line([[0.0, -0.17], [0.2, -0.19], [0.42, -0.23], [0.56, -0.18]]), ring: line([[0.56, 0.08], [0.54, 0.2]]) };
  }
  // PINCH (cards, chips): index and thumb tips meeting at the socket (≈ 0.76, −0.23); the other three folded under in
  // one rounded mass with two soft scallops
  {
    const body = blob([
      [-0.03, -0.17], [0.16, -0.21], [0.36, -0.27], [0.56, -0.31], [0.66, -0.3], [0.74, -0.26], [0.84, -0.22], [0.9, -0.19],
      [0.88, -0.14], [0.72, -0.12], [0.62, -0.08], [0.6, -0.01], [0.63, 0.04], [0.58, 0.1], [0.6, 0.14], [0.5, 0.21],
      [0.28, 0.22], [0.06, 0.2], [-0.03, 0.17],
    ]);
    const cuts = new Path2D();
    cuts.addPath(curve([0.34, -0.22], [0.5, -0.24], [0.66, -0.27]));
    cuts.addPath(curve([0.52, -0.12], [0.62, -0.15], [0.74, -0.17]));
    S.pinch = { body, cuts, rimEdge: line([[0.0, -0.17], [0.16, -0.21], [0.36, -0.27], [0.56, -0.31], [0.66, -0.3]]), ring: line([[0.57, 0.02], [0.59, 0.14]]) };
  }
  // PRESS: the thumb straight out to the socket (≈ 0.8, −0.23), the fingers folded in a soft fist
  {
    const body = blob([[-0.03, -0.17], [0.2, -0.2], [0.45, -0.23], [0.66, -0.26], [0.8, -0.25], [0.82, -0.2], [0.66, -0.16], [0.6, -0.13], ...fist(0.57).slice(1), [0.46, 0.23], [0.24, 0.22], [0.04, 0.2], [-0.03, 0.17]]);
    const cuts = new Path2D();
    cuts.addPath(curve([0.4, -0.18], [0.55, -0.2], [0.7, -0.21]));
    S.press = { body, cuts, rimEdge: line([[0.0, -0.17], [0.2, -0.2], [0.45, -0.23], [0.66, -0.26], [0.78, -0.255]]), ring: line([[0.56, 0.06], [0.55, 0.19]]) };
  }
  const palm: P2[] = [[-0.03, -0.17], [0.2, -0.19], [0.44, -0.17], [0.53, -0.08], [0.54, 0.04], [0.49, 0.15], [0.34, 0.21], [0.14, 0.2], [-0.03, 0.17]];
  /** an open-ish hand: the palm and four rounded fingers plus the thumb, tips given in hand-local units */
  const openHand = (tips: P2[], thumb: P2, ring: P2[]) => {
    const body = blob(palm);
    const fingers = new Path2D();
    const K: P2[] = [[0.46, -0.12], [0.5, -0.035], [0.48, 0.05], [0.43, 0.13]];
    const W = [0.115, 0.12, 0.11, 0.095];
    tips.forEach((t, i) => {
      const f = new Path2D();
      finger(f, K[i], t, W[i], W[i] * 0.8);
      fingers.addPath(f);
    });
    const th = new Path2D();
    finger(th, [0.16, -0.15], thumb, 0.13, 0.1);
    fingers.addPath(th);
    return { body, fingers, cuts: new Path2D(), rimEdge: line([[0.0, -0.17], [0.15, -0.185]]), ring: line(ring) };
  };
  // REST: fingers relaxed, gently curled (socket ≈ 0.86, 0.12)
  S.rest = openHand([[0.84, -0.06], [0.88, 0.04], [0.84, 0.13], [0.72, 0.2]], [0.5, -0.27], [[0.6, 0.0], [0.6, 0.12]]);
  // FLAT: fingers straight on the desk (socket ≈ 0.85, 0)
  S.flat = openHand([[0.87, -0.16], [0.96, -0.05], [0.92, 0.07], [0.77, 0.18]], [0.5, -0.33], [[0.62, 0.0], [0.62, 0.12]]);
  // OPEN: letting go, fingers parted and lifted (socket ≈ 0.86, −0.12)
  S.open = openHand([[0.85, -0.26], [0.96, -0.09], [0.9, 0.1], [0.74, 0.24]], [0.42, -0.45], [[0.62, 0.0], [0.6, 0.14]]);
  return S;
})();

/** the tapered sleeve (hand-local; the sleeve runs off frame along −x): ≈ 35 % narrower at the cuff than at the frame
 *  edge, with a slight swell over the forearm; the shirt cuff a pale band */
const SLEEVE = (() => {
  const L = 9;
  const tweed = new Path2D();
  tweed.moveTo(-0.17, -0.27);
  tweed.quadraticCurveTo(-0.9, -0.33, -1.9, -0.4);
  tweed.lineTo(-3.2, -0.42);
  tweed.lineTo(-L, -0.42);
  tweed.lineTo(-L, 0.42);
  tweed.lineTo(-3.2, 0.42);
  tweed.lineTo(-1.9, 0.39);
  tweed.quadraticCurveTo(-0.9, 0.32, -0.17, 0.26);
  tweed.quadraticCurveTo(-0.13, 0.0, -0.17, -0.27);
  tweed.closePath();
  const shirt = new Path2D();
  shirt.moveTo(-0.22, -0.215);
  shirt.lineTo(0.02, -0.2);
  shirt.quadraticCurveTo(0.06, 0, 0.02, 0.2);
  shirt.lineTo(-0.22, 0.215);
  shirt.closePath();
  const cuff = new Path2D();
  cuff.moveTo(-0.34, -0.28);
  cuff.quadraticCurveTo(-0.29, 0.0, -0.34, 0.27);
  const buttons = new Path2D();
  for (const x of [-0.47, -0.58]) {
    buttons.moveTo(x + 0.022, 0.2);
    buttons.arc(x, 0.2, 0.022, 0, Math.PI * 2);
  }
  const rimEdge = new Path2D();
  rimEdge.moveTo(-3.2, -0.42);
  rimEdge.lineTo(-1.9, -0.4);
  rimEdge.quadraticCurveTo(-0.9, -0.33, -0.17, -0.27);
  return { tweed, shirt, cuff, buttons, rimEdge };
})();

const PEN = (() => {
  const p = new Path2D();
  finger(p, [-0.35, 0], [0.55, 0], 0.07, 0.045);
  return p;
})();

function drawArm(c: C, a: ArmPose, len: number, env: PaintEnv, o: HeldDraw | undefined, side: 'R' | 'L', scale: number) {
  const ink = env.fill('ink');
  const rim = env.mood.rim;
  const lw = (dev: number) => {
    const m = c.getTransform();
    return dev / (Math.hypot(m.a, m.b) || 1);
  };
  const sp = SOFT[a.shape];
  const flipY = Math.cos(a.angle) < 0 ? -1 : 1;
  const held = a.held ?? 'none';
  const pose: HandsPose = side === 'R' ? { right: a, scale } : { left: a, scale };
  const sock = narratorHands.socket(pose, side === 'R' ? 'right' : 'left')!;
  if ((held === 'card' || held === 'slip') && o?.heldDraw) {
    // paper is held behind the fingers
    c.save();
    o.heldDraw(c, sock, held, env);
    c.restore();
  }
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
  c.fillStyle = ink;
  c.fill(SLEEVE.tweed);
  // the shirt cuff: a pale band (lamp-lit linen, low)
  c.fillStyle = mixLab(ink, mixLab(env.mood.set, rim, 0.5), 0.26);
  c.fill(SLEEVE.shirt);
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(rim, 0.4);
  c.lineWidth = lw(1.4);
  c.stroke(SLEEVE.cuff);
  c.fillStyle = withAlpha(rim, 0.42);
  c.fill(SLEEVE.buttons);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = lw(1.9);
  c.stroke(SLEEVE.rimEdge);
  c.rotate(a.bend ?? 0);
  c.fillStyle = ink;
  c.fill(sp.body);
  if (sp.fingers) c.fill(sp.fingers);
  c.strokeStyle = withAlpha(rim, 0.3);
  c.lineWidth = lw(1.2);
  c.stroke(sp.cuts);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = lw(1.8);
  c.stroke(sp.rimEdge);
  if (side === 'R') {
    c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.7);
    c.lineWidth = lw(2.6);
    c.stroke(sp.ring);
  }
  c.restore();
  if (held === 'pen') {
    c.save();
    c.translate(sock.x, sock.y);
    c.rotate(a.angle + (a.bend ?? 0) + 0.5);
    c.scale(len, len);
    c.fillStyle = ink;
    c.fill(PEN);
    c.restore();
  }
}

function draw(c: C, p: HandsPose, env: PaintEnv, o?: HeldDraw) {
  const scale = p.scale ?? 1;
  const len = HAND_LEN * scale;
  if (p.left) drawArm(c, p.left, len, env, o, 'L', scale);
  if (p.right) drawArm(c, p.right, len, env, o, 'R', scale);
}

export const softHands = { draw };
export type { Pt };
