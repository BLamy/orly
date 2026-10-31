/**
 * neural-net-history — the detective's hands (script cast id `narrator-hands`).
 *
 * Two steady, cuffed tweed forearms from a FIXED lamp-side entry at the frame's lower right. Never a
 * body, never a face; a mid-life teacher's hands (no age marks, no tremor); the signet ring is kept.
 * Rigid paper parts: a straight tweed sleeve that runs off-frame through the entry point, a shirt cuff,
 * and a HAND SPRITE per shape (swapped on a hold, never morphed). Six actions only (staging.hands):
 * pin · unpinDrop · strikeLight · fileFold · stamp · holdUp.
 *
 *   import { hands } from '../cast';                     // = narratorHands
 *   const pose = hands.act('pin', u, { x: 640, y: 300 }, { held: 'card' });   // u in 0..1, from env.tq
 *   hands.draw(c, pose, env);                              // inside f.layer('L4' | 'L5', …)
 *   if (pose.placed) drawPinnedCard(...)                   // the shot owns the card once it is placed
 *   const flame = hands.flameAt(pose);                     // strikeLight: add f.practical({kind:'candle'}) there
 *
 * Layer: draw in L5 (near, blurred) when the hands rest at the entry or pass in front of the lens; draw
 * in the SAME layer as the board/shelf/Wall (normally L4) for the moment they touch it, so pins land
 * without parallax slip. Motion is on twos: derive `u` from env.tq (or quantizeTwos(t)).
 *
 * Coordinates are the layer's rest-screen stage px. `scale` multiplies the hand length (default 118 px:
 * a board insert; use ~0.7 for a medium on the board, ~1.6 for a macro).
 */
import type { Camera3, LayerId, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';

export type Pt = { x: number; y: number };
export type HandShapeN = 'rest' | 'pinch' | 'press' | 'grip' | 'flat' | 'open';
export type Held = 'none' | 'card' | 'slip' | 'pin' | 'match' | 'matchbox' | 'stamp' | 'pen';
export type HandAction = 'rest' | 'pin' | 'unpinDrop' | 'strikeLight' | 'fileFold' | 'stamp' | 'holdUp';

export interface ArmPose {
  /** wrist point (stage px in the layer) */
  wrist: Pt;
  /** forearm direction, radians (wrist → fingertips); the sleeve runs back along -angle off frame */
  angle: number;
  /** wrist bend relative to the forearm, radians (+ = fingers dip down-screen when reaching left) */
  bend?: number;
  shape: HandShapeN;
  held?: Held;
  /** match: 0..1 flame strength */
  lit?: number;
}

export interface HandsPose {
  right?: ArmPose;
  left?: ArmPose;
  /** hand length multiplier (1 = 118 px) */
  scale?: number;
  /** the object the working hand has placed / released this action (for the shot to take over) */
  placed?: boolean;
  /** unpinDrop: the card has left the fingers */
  released?: boolean;
  /** stamp: the stamp is down (or has been) */
  stamped?: boolean;
  /** 0..1: how far into frame the hands are (0 = out of shot at the entry) */
  presence?: number;
}

export interface HeldDraw {
  /** draw your own held card/slip (content, lettering) at the socket point, upright. */
  heldDraw?: (c: CanvasRenderingContext2D, at: Pt, held: Held, env: PaintEnv) => void;
  /** card/slip paper colour; default: lamp-lit paper (halo→rim mix) */
  paper?: string;
}

/** fixed lamp-side entries (stage px, rest screen): the right (working) hand and the left (support) hand */
export const HANDS_ENTRY = { R: { x: 1420, y: 980 }, L: { x: 1150, y: 1060 } } as const;
export const HAND_LEN = 118;

// ---------------------------------------------------------------- geometry (hand-local, unit = hand length)
// origin = wrist; +x toward the fingertips; +y = palm side (down-screen when reaching left with the back
// of the hand up). The thumb is on the -y side.
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
  body: Path2D;
  /** cut-lines (knuckle crease, nail edge) */
  cuts: Path2D;
  /** signet ring band (rim stroke) */
  ring: Path2D;
  /** upper (lit) edge for the lamp rim */
  rimEdge: Path2D;
  socket: P2;
}

/**
 * A finger as two rigid paper segments (proximal + distal) with a rounded tip, from a knuckle point.
 * dir: radians in hand-local space (0 = straight along the hand); curl: extra bend of the tip segment.
 */
function finger(p: Path2D, base: P2, dir: number, len: number, w: number, curl = 0, split = 0.56) {
  const l1 = len * split;
  const l2 = len - l1;
  const j: P2 = [base[0] + Math.cos(dir) * l1, base[1] + Math.sin(dir) * l1];
  const d2 = dir + curl;
  const tip: P2 = [j[0] + Math.cos(d2) * l2, j[1] + Math.sin(d2) * l2];
  capsule(base[0], base[1], j[0], j[1], w, w * 0.92, p);
  capsule(j[0], j[1], tip[0], tip[1], w * 0.92, w * 0.8, p);
  return tip;
}

const SPRITES: Record<HandShapeN, HandSprite> = (() => {
  const S = {} as Record<HandShapeN, HandSprite>;
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
  // the back of the hand, seen three-quarter from the thumb side: wrist → knuckle line at x ≈ .46.
  // Knuckles (index → little finger) step down the palm's front edge so every finger reads apart.
  const K: P2[] = [[0.47, -0.13], [0.5, -0.04], [0.48, 0.05], [0.43, 0.13]];
  const palmPts: P2[] = [[-0.02, -0.17], [0.2, -0.19], [0.42, -0.17], [0.53, -0.1], [0.54, 0.02], [0.49, 0.14], [0.36, 0.2], [0.16, 0.2], [-0.02, 0.17]];
  const thumbBase: P2 = [0.16, -0.16];
  const knuckleCut = () => arcP([0.44, -0.16], [0.53, -0.02], [0.44, 0.15]);
  const W = [0.105, 0.11, 0.1, 0.085];

  // REST: relaxed, fingers gently curled toward the palm side, thumb lying forward along the index
  {
    const body = blob(palmPts);
    finger(body, K[0], -0.06, 0.4, W[0], 0.38);
    finger(body, K[1], 0.02, 0.44, W[1], 0.42);
    finger(body, K[2], 0.1, 0.41, W[2], 0.46);
    finger(body, K[3], 0.2, 0.32, W[3], 0.48);
    finger(body, thumbBase, -0.42, 0.42, 0.12, 0.3, 0.5);
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    S.rest = { body, cuts, ring: lineP([[0.6, 0.0], [0.6, 0.12]]), rimEdge: lineP([[0.0, -0.17], [0.2, -0.19], [0.42, -0.17]]), socket: [0.86, 0.12] };
  }
  // PINCH: thumb and index tips meet ahead of the hand; the other three fingers tucked under
  {
    const body = blob(palmPts);
    const tipI = finger(body, K[0], -0.2, 0.42, W[0], 0.22);
    finger(body, K[1], 0.55, 0.3, W[1], 1.9, 0.5);
    finger(body, K[2], 0.7, 0.27, W[2], 2.0, 0.5);
    finger(body, K[3], 0.85, 0.22, W[3], 2.0, 0.5);
    const tipT = finger(body, thumbBase, -0.32, 0.5, 0.12, 0.12, 0.5);
    const sock: P2 = [(tipI[0] + tipT[0]) / 2, (tipI[1] + tipT[1]) / 2];
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    S.pinch = { body, cuts, ring: lineP([[0.6, 0.02], [0.62, 0.16]]), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.5, -0.33]]), socket: sock };
  }
  // PRESS: fingers folded, the thumb out straight ahead pushing a pin home
  {
    const body = blob(palmPts);
    finger(body, K[0], 0.75, 0.24, W[0], 2.1, 0.5);
    finger(body, K[1], 0.85, 0.25, W[1], 2.1, 0.5);
    finger(body, K[2], 0.95, 0.23, W[2], 2.1, 0.5);
    finger(body, K[3], 1.05, 0.2, W[3], 2.0, 0.5);
    const tipT = finger(body, thumbBase, -0.12, 0.6, 0.125, 0.02, 0.5);
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    S.press = { body, cuts, ring: lineP([[0.62, 0.06], [0.6, 0.2]]), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.75, -0.27]]), socket: [tipT[0] + 0.04, tipT[1]] };
  }
  // GRIP: a fist round a handle (match, stamp, pen) — four knuckle lumps, thumb wrapped over
  {
    const body = blob(palmPts);
    finger(body, K[0], 0.5, 0.27, W[0] * 1.1, 2.0, 0.5);
    finger(body, K[1], 0.62, 0.28, W[1] * 1.1, 2.0, 0.5);
    finger(body, K[2], 0.74, 0.26, W[2] * 1.1, 2.0, 0.5);
    finger(body, K[3], 0.86, 0.22, W[3] * 1.1, 1.9, 0.5);
    finger(body, thumbBase, -0.18, 0.38, 0.125, 0.6, 0.55);
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    cuts.addPath(arcP([0.58, -0.05], [0.64, 0.08], [0.56, 0.2]));
    S.grip = { body, cuts, ring: lineP([[0.58, 0.08], [0.55, 0.22]]), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.45, -0.27]]), socket: [0.6, 0.06] };
  }
  // FLAT: palm down on the desk or a file flap, fingers straight and slightly fanned
  {
    const body = blob(palmPts);
    finger(body, K[0], -0.1, 0.42, W[0], 0.04);
    finger(body, K[1], -0.02, 0.47, W[1], 0.04);
    finger(body, K[2], 0.06, 0.44, W[2], 0.05);
    finger(body, K[3], 0.15, 0.35, W[3], 0.06);
    finger(body, thumbBase, -0.5, 0.4, 0.12, 0.25, 0.5);
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    S.flat = { body, cuts, ring: lineP([[0.62, -0.0], [0.62, 0.12]]), rimEdge: lineP([[0.0, -0.17], [0.2, -0.19], [0.42, -0.17], [0.88, -0.2]]), socket: [0.85, 0.0] };
  }
  // OPEN: letting go — fingers parted and lifted, thumb away
  {
    const body = blob(palmPts);
    finger(body, K[0], -0.32, 0.42, W[0], 0.1);
    finger(body, K[1], -0.1, 0.47, W[1], 0.12);
    finger(body, K[2], 0.12, 0.43, W[2], 0.14);
    finger(body, K[3], 0.34, 0.34, W[3], 0.16);
    finger(body, thumbBase, -0.85, 0.42, 0.12, 0.2, 0.5);
    const cuts = new Path2D();
    cuts.addPath(knuckleCut());
    S.open = { body, cuts, ring: lineP([[0.62, 0.0], [0.6, 0.14]]), rimEdge: lineP([[0.0, -0.17], [0.16, -0.22], [0.3, -0.45]]), socket: [0.86, -0.12] };
  }
  return S;
})();

// sleeve + shirt cuff (hand-local, extending back along -x)
const SLEEVE = (() => {
  const L = 9; // runs well off frame
  const tweed = new Path2D();
  tweed.moveTo(-0.16, -0.285);
  tweed.lineTo(-1.2, -0.31);
  tweed.lineTo(-L, -0.36);
  tweed.lineTo(-L, 0.38);
  tweed.lineTo(-1.2, 0.3);
  tweed.lineTo(-0.16, 0.27);
  tweed.quadraticCurveTo(-0.12, 0.0, -0.16, -0.285);
  tweed.closePath();
  const shirt = new Path2D();
  shirt.moveTo(-0.22, -0.225);
  shirt.lineTo(0.03, -0.215);
  shirt.quadraticCurveTo(0.07, 0, 0.03, 0.215);
  shirt.lineTo(-0.22, 0.225);
  shirt.closePath();
  const cuts = new Path2D();
  // tweed cuff: the turned-back edge and two cuff buttons
  cuts.moveTo(-0.34, -0.29);
  cuts.quadraticCurveTo(-0.29, 0.0, -0.34, 0.28);
  const buttons = new Path2D();
  for (const x of [-0.47, -0.58]) {
    buttons.moveTo(x + 0.022, 0.21);
    buttons.arc(x, 0.21, 0.022, 0, Math.PI * 2);
  }
  // shirt cuff edge (the cuff shows past the sleeve)
  const shirtEdge = new Path2D();
  shirtEdge.moveTo(-0.02, -0.21);
  shirtEdge.quadraticCurveTo(0.02, 0, -0.02, 0.21);
  // lit top edge of sleeve and cuff
  const rimEdge = new Path2D();
  rimEdge.moveTo(-3.2, -0.325);
  rimEdge.lineTo(-1.2, -0.31);
  rimEdge.lineTo(-0.16, -0.285);
  rimEdge.moveTo(-0.2, -0.225);
  rimEdge.lineTo(0.03, -0.215);
  return { tweed, shirt, cuts, buttons, shirtEdge, rimEdge };
})();

// held objects (socket space: origin at the socket, +x forward along the hand, unit = hand length)
const PIN = (() => {
  const p = new Path2D();
  p.arc(0, 0, 0.05, 0, Math.PI * 2);
  p.moveTo(0.04, -0.01);
  p.rect(0.03, -0.012, 0.16, 0.024);
  return p;
})();
const MATCH = (() => {
  const stick = capsule(-0.05, 0, 0.62, 0, 0.035);
  const head = new Path2D();
  head.ellipse(0.64, 0, 0.05, 0.035, 0, 0, Math.PI * 2);
  return { stick, head };
})();
const MATCHBOX = (() => {
  const p = new Path2D();
  p.rect(-0.1, -0.2, 0.62, 0.36);
  const strip = new Path2D();
  strip.rect(-0.1, -0.2, 0.62, 0.06);
  return { p, strip };
})();
const STAMP = (() => {
  // a turned wooden knob and neck through the fist, a wide wooden mount and the rubber die below
  const p = new Path2D();
  p.ellipse(0, -0.3, 0.11, 0.08, 0, 0, Math.PI * 2);
  p.rect(-0.045, -0.26, 0.09, 0.42);
  blob([[-0.12, 0.14], [0.12, 0.14], [0.16, 0.2], [-0.16, 0.2]], p);
  p.rect(-0.3, 0.19, 0.6, 0.11);
  p.rect(-0.28, 0.3, 0.56, 0.045);
  return p;
})();
const PEN = capsule(-0.35, 0, 0.55, 0, 0.07, 0.045);

// ---------------------------------------------------------------- draw
function paperOf(env: PaintEnv, o?: HeldDraw) {
  return o?.paper ?? mixLab(env.mood.halo, env.mood.rim, 0.55);
}

/** hand-local (unit = hand length, after the wrist bend) → world, exactly as drawArm transforms */
function localToWorld(a: Pick<ArmPose, 'wrist' | 'angle' | 'bend'>, len: number, lx: number, ly: number): Pt {
  const fy = Math.cos(a.angle) < 0 ? -1 : 1;
  const b = a.bend ?? 0;
  const x1 = lx * Math.cos(b) - ly * Math.sin(b);
  const y1 = lx * Math.sin(b) + ly * Math.cos(b);
  const x2 = x1 * len;
  const y2 = y1 * len * fy;
  const A = a.angle;
  return { x: a.wrist.x + x2 * Math.cos(A) - y2 * Math.sin(A), y: a.wrist.y + x2 * Math.sin(A) + y2 * Math.cos(A) };
}

/** world socket point of an arm (where the held object sits) */
function socketOf(a: ArmPose, len: number): Pt {
  const s = SPRITES[a.shape].socket;
  return localToWorld(a, len, s[0], s[1]);
}

function drawArm(c: CanvasRenderingContext2D, a: ArmPose, len: number, env: PaintEnv, o: HeldDraw | undefined, side: 'R' | 'L') {
  const ink = env.fill('ink');
  const rim = env.mood.rim;
  const lw = (dev: number) => {
    const m = c.getTransform();
    return dev / (Math.hypot(m.a, m.b) || 1);
  };
  const sp = SPRITES[a.shape];
  const facingLeft = Math.cos(a.angle) < 0;
  // when the arm reaches LEFT (the usual case) the thumb must be on top: hand-local -y maps up-screen.
  // When reaching right, mirror the local y so the thumb stays on top (asymmetric details re-picked, not flipped).
  const flipY = facingLeft ? -1 : 1;
  const held0 = a.held ?? 'none';
  if (held0 === 'card' || held0 === 'slip') {
    // paper is held BEHIND the fingers, so the pinch overlaps its edge
    const s = socketOf(a, len);
    c.save();
    if (o?.heldDraw) o.heldDraw(c, s, held0, env);
    else {
      const w = len * (held0 === 'card' ? 0.95 : 1.05);
      const h = len * (held0 === 'card' ? 0.64 : 0.3);
      const x0 = s.x - w * 0.9, y0 = s.y - h * 0.15;
      c.fillStyle = paperOf(env, o);
      c.fillRect(x0, y0, w, h);
      c.fillStyle = withAlpha(env.mood.ink, 0.35);
      for (let i = 0; i < (held0 === 'card' ? 3 : 1); i++) c.fillRect(x0 + w * 0.12, y0 + h * (0.3 + i * 0.2), w * (0.7 - i * 0.12), Math.max(1, h * 0.05));
    }
    c.restore();
  }

  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
  // sleeve (no bend)
  c.fillStyle = ink;
  c.fill(SLEEVE.tweed);
  c.fill(SLEEVE.shirt);
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(rim, 0.42);
  c.lineWidth = lw(1.5);
  c.stroke(SLEEVE.cuts);
  c.stroke(SLEEVE.shirtEdge);
  c.fillStyle = withAlpha(rim, 0.45);
  c.fill(SLEEVE.buttons);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = lw(1.9);
  c.stroke(SLEEVE.rimEdge);
  // hand (wrist bend)
  c.rotate(a.bend ?? 0);
  c.fillStyle = ink;
  c.fill(sp.body);
  c.strokeStyle = withAlpha(rim, 0.4);
  c.lineWidth = lw(1.4);
  c.stroke(sp.cuts);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = lw(1.8);
  c.stroke(sp.rimEdge);
  if (side === 'R') {
    // the signet ring (right hand, ring finger): a bright band with a small bezel
    c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.7);
    c.lineWidth = lw(2.6);
    c.stroke(sp.ring);
  }
  c.restore();

  // held object, drawn in world space at the socket (cards/slips upright; tools follow the hand)
  const held = a.held ?? 'none';
  if (held === 'none') return;
  const s = socketOf(a, len);
  const ang = a.angle + (a.bend ?? 0);
  c.save();
  if (held === 'card' || held === 'slip') {
    // drawn behind the hand, above
  } else if (held === 'pin') {
    c.translate(s.x, s.y);
    c.rotate(ang + Math.PI);
    c.scale(len, len);
    c.fillStyle = mixLab(env.mood.halo, env.mood.core, 0.25);
    c.fill(PIN);
  } else if (held === 'match') {
    c.translate(s.x, s.y);
    c.rotate(ang - 0.35);
    c.scale(len, len);
    c.fillStyle = mixLab(ink, env.mood.set, 0.5);
    c.fill(MATCH.stick);
    c.fillStyle = (a.lit ?? 0) > 0 ? mixLab(ink, env.mood.halo, 0.3) : ink;
    c.fill(MATCH.head);
  } else if (held === 'matchbox') {
    c.translate(s.x, s.y);
    c.rotate(ang * 0.25);
    c.scale(len, len);
    c.fillStyle = ink;
    c.fill(MATCHBOX.p);
    c.fillStyle = withAlpha(rim, 0.35);
    c.fill(MATCHBOX.strip);
  } else if (held === 'stamp') {
    c.translate(s.x, s.y);
    c.scale(len, len);
    c.fillStyle = ink;
    c.fill(STAMP);
    c.strokeStyle = withAlpha(rim, 0.45);
    c.lineWidth = lw(1.4);
    c.beginPath();
    c.moveTo(-0.2, 0.12);
    c.lineTo(0.2, 0.12);
    c.stroke();
  } else if (held === 'pen') {
    c.translate(s.x, s.y);
    c.rotate(ang + 0.5);
    c.scale(len, len);
    c.fillStyle = ink;
    c.fill(PEN);
  }
  c.restore();
}

/** where the match flame burns (strikeLight), or null */
function flameAt(p: HandsPose): Pt | null {
  const a = p.right;
  if (!a || a.held !== 'match' || !(a.lit && a.lit > 0)) return null;
  const len = HAND_LEN * (p.scale ?? 1);
  const s = socketOf(a, len);
  const ang = a.angle + (a.bend ?? 0) - 0.35;
  return { x: s.x + Math.cos(ang) * 0.66 * len, y: s.y + Math.sin(ang) * 0.66 * len };
}

function draw(c: CanvasRenderingContext2D, p: HandsPose, env: PaintEnv, o?: HeldDraw) {
  const len = HAND_LEN * (p.scale ?? 1);
  if (p.left) drawArm(c, p.left, len, env, o, 'L');
  if (p.right) drawArm(c, p.right, len, env, o, 'R');
  const fl = flameAt(p);
  if (fl && p.right) {
    // the match flame itself (the shot adds the room light with f.practical at hands.flameAt(pose))
    c.save();
    c.translate(fl.x, fl.y);
    const k = Math.max(0, Math.min(1, p.right.lit ?? 0));
    c.scale(len / 100, len / 100);
    flameShape(c, env, 0, 4, 10 * (0.5 + 0.5 * k), 31, 0.9 + 0.2 * k);
    c.restore();
  }
}

// ---------------------------------------------------------------- actions (pure keyframes of u)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const seg = (u: number, a: number, b: number) => ease((u - a) / (b - a));
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

/** an arm whose sleeve runs back through `entry`, wrist placed so the socket lands on `socketAt` */
function reach(entry: Pt, socketAt: Pt, shape: HandShapeN, len: number, extra: Partial<ArmPose> = {}): ArmPose {
  const s = SPRITES[shape].socket;
  // aim the forearm from the entry toward the socket; solve the wrist so the socket sits on target
  let ang = Math.atan2(socketAt.y - entry.y, socketAt.x - entry.x);
  const bend = extra.bend ?? 0;
  let wrist = socketAt;
  for (let i = 0; i < 3; i++) {
    const v = localToWorld({ wrist: { x: 0, y: 0 }, angle: ang, bend }, len, s[0], s[1]);
    wrist = { x: socketAt.x - v.x, y: socketAt.y - v.y };
    ang = Math.atan2(wrist.y - entry.y, wrist.x - entry.x);
  }
  return { ...extra, wrist, angle: ang, shape, bend };
}

export interface ActOpts {
  held?: Held;
  scale?: number;
  /** override the entries (e.g. a top-down FILE camera): R and L */
  entry?: { R?: Pt; L?: Pt };
  /** strikeLight: where the matchbox is struck (default: below-right of the target) */
  strikeAt?: Pt;
  /** unpinDrop / fileFold: where the card is dropped or the slip goes (default: the lamp pool below) */
  dropAt?: Pt;
}

/**
 * The six actions as one function of u ∈ [0,1] (derive u from env.tq so the hands move on twos):
 *  pin         reach in with the card (0–.35), settle on the target (.35–.45), thumb presses the pin
 *              (.45–.6, placed = true from .45), withdraw (.6–1)
 *  unpinDrop   reach in open (0–.3), pinch the card (.3–.42), lift it off and carry to dropAt
 *              (.42–.62), let go (released from .62), withdraw (.7–1)
 *  strikeLight left hand brings the matchbox to strikeAt, right hand strikes (.25–.38, lit from .36),
 *              carries the flame to the target (.4–.6), holds (.6–.8), withdraws (.8–1)
 *  fileFold    carry the slip to dropAt (the open file), let go (.5), flat hand presses the flap (.6–.75)
 *  stamp       carry the stamp above the target (0–.35), lift (.35–.45), press (.45–.55, stamped),
 *              lift and withdraw (.6–1)
 *  holdUp      raise the object into the light at the target (0–.35), hold (.35–.75), lower and withdraw
 *  rest        the hands lie at the entry, barely in frame (presence .25)
 */
function act(action: HandAction, u: number, target: Pt, o: ActOpts = {}): HandsPose {
  const scale = o.scale ?? 1;
  const len = HAND_LEN * scale;
  const ER = o.entry?.R ?? HANDS_ENTRY.R;
  const EL = o.entry?.L ?? HANDS_ENTRY.L;
  // an "outside" point on the line from the entry, so the hand enters and leaves through the frame edge
  const off = (E: Pt, T: Pt, k = 0.15): Pt => lerpP(E, T, k);
  // at rest the right hand lies in the lower-right corner, the cuff and fingers just in frame
  const restR: Pt = { x: ER.x - 300 * scale, y: ER.y - 310 * scale };
  const held = o.held;
  const U = clamp01(u);

  switch (action) {
    case 'rest': {
      return { right: reach(ER, restR, 'rest', len, { bend: 0.15 }), scale, presence: 0.25 };
    }
    case 'pin': {
      const near = { x: target.x + len * 0.12, y: target.y + len * 0.1 };
      let at: Pt;
      let shape: HandShapeN = 'pinch';
      let h: Held = held ?? 'card';
      if (U < 0.35) at = lerpP(off(ER, target), near, seg(U, 0, 0.35));
      else if (U < 0.45) at = lerpP(near, target, seg(U, 0.35, 0.45));
      else if (U < 0.6) {
        shape = 'press';
        h = 'none';
        at = { x: target.x + len * 0.02 * Math.sin(seg(U, 0.45, 0.6) * Math.PI), y: target.y };
      } else {
        shape = 'rest';
        h = 'none';
        at = lerpP(target, off(ER, target, 0.0), seg(U, 0.6, 1));
      }
      return { right: reach(ER, at, shape, len, { held: h }), scale, placed: U >= 0.45, presence: U < 0.6 ? seg(U, 0, 0.2) : 1 - seg(U, 0.8, 1) };
    }
    case 'unpinDrop': {
      const drop = o.dropAt ?? { x: target.x + len * 0.4, y: target.y + len * 2.4 };
      let at: Pt;
      let shape: HandShapeN = 'open';
      let h: Held = 'none';
      if (U < 0.3) at = lerpP(off(ER, target), { x: target.x + len * 0.15, y: target.y + len * 0.08 }, seg(U, 0, 0.3));
      else if (U < 0.42) {
        at = lerpP({ x: target.x + len * 0.15, y: target.y + len * 0.08 }, target, seg(U, 0.3, 0.42));
        shape = 'pinch';
        h = U > 0.36 ? held ?? 'card' : 'none';
      } else if (U < 0.62) {
        at = lerpP(target, drop, seg(U, 0.42, 0.62));
        shape = 'pinch';
        h = held ?? 'card';
      } else if (U < 0.7) at = drop;
      else at = lerpP(drop, off(ER, drop, 0), seg(U, 0.7, 1));
      return { right: reach(ER, at, U >= 0.62 ? (U < 0.7 ? 'open' : 'rest') : shape, len, { held: h }), scale, released: U >= 0.62, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'strikeLight': {
      const strike = o.strikeAt ?? { x: target.x + len * 1.1, y: target.y + len * 1.0 };
      const boxIn = seg(U, 0, 0.22) * (1 - seg(U, 0.42, 0.62));
      const left = reach(EL, lerpP(off(EL, strike), { x: strike.x + len * 0.25, y: strike.y + len * 0.12 }, boxIn), 'grip', len, { held: 'matchbox', bend: 0.25 });
      let at: Pt;
      let lit = 0;
      if (U < 0.25) at = lerpP(off(ER, strike), { x: strike.x + len * 0.35, y: strike.y - len * 0.15 }, seg(U, 0, 0.25));
      else if (U < 0.38) at = lerpP({ x: strike.x + len * 0.35, y: strike.y - len * 0.15 }, { x: strike.x - len * 0.2, y: strike.y - len * 0.05 }, seg(U, 0.25, 0.38));
      else if (U < 0.6) at = lerpP({ x: strike.x - len * 0.2, y: strike.y - len * 0.05 }, { x: target.x + len * 0.05, y: target.y + len * 0.55 }, seg(U, 0.4, 0.6));
      else if (U < 0.8) at = { x: target.x + len * 0.05, y: target.y + len * 0.55 };
      else at = lerpP({ x: target.x + len * 0.05, y: target.y + len * 0.55 }, off(ER, target, 0), seg(U, 0.8, 1));
      if (U >= 0.36) lit = U < 0.42 ? 1.3 - (U - 0.36) * 5 : U < 0.85 ? 1 : 1 - seg(U, 0.85, 0.95);
      const right = reach(ER, at, 'grip', len, { held: 'match', lit });
      return { right, left: boxIn > 0.01 ? left : undefined, scale, placed: U >= 0.6, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'fileFold': {
      const drop = o.dropAt ?? target;
      let at: Pt;
      let shape: HandShapeN = 'pinch';
      let h: Held = held ?? 'slip';
      if (U < 0.45) at = lerpP(off(ER, drop), { x: drop.x, y: drop.y - len * 0.25 }, seg(U, 0, 0.45));
      else if (U < 0.55) {
        at = { x: drop.x, y: drop.y - len * 0.25 };
        shape = 'open';
        h = 'none';
      } else if (U < 0.75) {
        at = lerpP({ x: drop.x, y: drop.y - len * 0.25 }, { x: drop.x + len * 0.1, y: drop.y + len * 0.05 }, seg(U, 0.55, 0.65));
        shape = 'flat';
        h = 'none';
      } else {
        at = lerpP({ x: drop.x + len * 0.1, y: drop.y + len * 0.05 }, off(ER, drop, 0), seg(U, 0.75, 1));
        shape = 'rest';
        h = 'none';
      }
      return { right: reach(ER, at, shape, len, { held: h }), scale, placed: U >= 0.5, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'stamp': {
      const above = { x: target.x, y: target.y - len * 0.62 };
      const down = { x: target.x, y: target.y - len * 0.345 };
      let at: Pt;
      if (U < 0.35) at = lerpP(off(ER, target), above, seg(U, 0, 0.35));
      else if (U < 0.45) at = lerpP(above, { x: above.x, y: above.y - len * 0.12 }, seg(U, 0.35, 0.45));
      else if (U < 0.55) at = lerpP({ x: above.x, y: above.y - len * 0.12 }, down, seg(U, 0.45, 0.5));
      else if (U < 0.62) at = down;
      else at = lerpP(down, off(ER, target, 0), seg(U, 0.62, 1));
      return { right: reach(ER, at, 'grip', len, { held: 'stamp', bend: -0.35 }), scale, stamped: U >= 0.5, presence: 1 - seg(U, 0.85, 1) };
    }
    case 'holdUp': {
      let at: Pt;
      if (U < 0.35) at = lerpP(off(ER, target), target, seg(U, 0, 0.35));
      else if (U < 0.75) at = target;
      else at = lerpP(target, off(ER, target, 0), seg(U, 0.75, 1));
      return { right: reach(ER, at, 'pinch', len, { held: held ?? 'card' }), scale, presence: seg(U, 0, 0.2) * (1 - seg(U, 0.85, 1)) };
    }
  }
}

/**
 * The fixed lamp-side entries expressed in a layer's coordinates for a camera, so the forearms always
 * enter from the FRAME's lower right whatever the camera does: hands.act(a, u, target, { entry: handsEntry(cam, 'L4') }).
 */
export function handsEntry(cam: Camera3, layer: LayerId = 'L5'): { R: Pt; L: Pt } {
  return { R: toLayer(LAYERS[layer], cam, HANDS_ENTRY.R.x, HANDS_ENTRY.R.y), L: toLayer(LAYERS[layer], cam, HANDS_ENTRY.L.x, HANDS_ENTRY.L.y) };
}

export const narratorHands = {
  entry: handsEntry,
  draw,
  act,
  flameAt,
  /** world point of the held object (socket) of the right or left hand */
  socket(p: HandsPose, side: 'right' | 'left' = 'right'): Pt | null {
    const a = p[side];
    return a ? socketOf(a, HAND_LEN * (p.scale ?? 1)) : null;
  },
  /** low-level: build an arm aimed from an entry so its socket lands on a point */
  reach,
  SHAPES: Object.keys(SPRITES) as HandShapeN[],
};
