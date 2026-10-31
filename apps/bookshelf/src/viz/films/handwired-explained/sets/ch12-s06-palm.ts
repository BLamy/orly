/**
 * handwired-explained — ch12-s06: the viewer's open hand, cut for this one insert.
 *
 * The cast's `viewer-hand` (bare: no sleeve, no ring, no cuff; it only receives) drawn as a CUPPED palm-up profile:
 * the hand rises from below the stage lip fingers first, turns level as it settles, and opens into an offering
 * cup: the heel of the hand and the curled fingertips (10-15 deg up) stand above a visible hollow, and the thumb
 * splays up on the far side over the finger bases. `seat` is the point in that hollow (a few px inside the top
 * contour) where the hinge's corner lies, so the copper crosses the black palm and its bare end climbs over the heel.
 * No cut-lines at the wrist (it would read as a cuff); the frame's rim pass lights its top contour.
 *
 *   const p = palmPose(s, open, { wrist0, wrist1, entry, len });  drawPalm(c, env, p);  p.seat
 */
import type { PaintEnv } from '../../../film/contracts';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };

export interface PalmPose {
  /** the wrist (stage px, L4) */
  wrist: Pt;
  /** the hand's pointing direction (wrist -> fingertips), radians */
  theta: number;
  /** 0 relaxed (fingers loosely curled, thumb in) .. 1 open, cupped */
  open: number;
  /** hand length (stage px) */
  len: number;
  /** where the bare forearm runs back to (below frame) */
  entry: Pt;
  /** the hollow, world: the hinge's corner lies here */
  seat: Pt;
}

/** local -> world: x along the hand toward the fingertips, y UP off the palm (the palm side), unit = hand length */
function L(p: Pick<PalmPose, 'wrist' | 'theta' | 'len'>, x: number, y: number): Pt {
  const dx = Math.cos(p.theta), dy = Math.sin(p.theta);
  // the palm's normal: for a hand pointing left (theta = pi) it is world up
  const nx = -dy, ny = dx;
  return { x: p.wrist.x + (x * dx + y * nx) * p.len, y: p.wrist.y + (x * dy + y * ny) * p.len };
}

/** the hollow (local): just behind the finger bases, a few px inside the top contour */
export const SEAT_LOCAL = { x: 0.33, y: 0.035 };

export function palmPose(wrist: Pt, theta: number, open: number, len: number, entry: Pt): PalmPose {
  const p = { wrist, theta, open, len, entry, seat: { x: 0, y: 0 } };
  p.seat = L(p, SEAT_LOCAL.x, SEAT_LOCAL.y);
  return p;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** a rounded capsule between two local points, as a world path */
function capsule(c: C, p: PalmPose, a: [number, number], b: [number, number], w0: number, w1: number) {
  const A = L(p, a[0], a[1]), B = L(p, b[0], b[1]);
  const ang = Math.atan2(B.y - A.y, B.x - A.x);
  const r0 = (w0 / 2) * p.len, r1 = (w1 / 2) * p.len;
  c.beginPath();
  c.arc(A.x, A.y, r0, ang + Math.PI / 2, ang - Math.PI / 2);
  c.arc(B.x, B.y, r1, ang - Math.PI / 2, ang + Math.PI / 2);
  c.closePath();
  c.fill();
}
/** a two-segment finger from a base, along a local direction, the last segment curled UP by `curl` */
function finger(c: C, p: PalmPose, base: [number, number], dir: number, len: number, w: number, curl: number, split = 0.58) {
  const j: [number, number] = [base[0] + Math.cos(dir) * len * split, base[1] + Math.sin(dir) * len * split];
  const d2 = dir + curl;
  const tip: [number, number] = [j[0] + Math.cos(d2) * len * (1 - split), j[1] + Math.sin(d2) * len * (1 - split)];
  capsule(c, p, base, j, w, w * 0.93);
  capsule(c, p, j, tip, w * 0.93, w * 0.78);
  return tip;
}

/** the viewer's bare forearm, hand and cup (L4; the darkest shape, no sleeve, ring or cuff) */
export function drawPalm(c: C, env: PaintEnv, p: PalmPose) {
  const o = p.open;
  const ink = PUPPET_NEAR_BLACK;
  c.save();
  c.fillStyle = ink;
  // ---- the bare forearm: from the wrist back past the entry, tapering wider toward the elbow
  const fa = Math.atan2(p.entry.y - p.wrist.y, p.entry.x - p.wrist.x);
  const reach = Math.hypot(p.entry.x - p.wrist.x, p.entry.y - p.wrist.y) + p.len * 2;
  const ux = Math.cos(fa), uy = Math.sin(fa);
  const px = -uy, py = ux;
  const w0 = p.len * 0.155, w1 = p.len * 0.3;
  // start the forearm a little inside the hand so the wrist joint is one continuous silhouette
  const s0 = { x: p.wrist.x - ux * p.len * 0.06, y: p.wrist.y - uy * p.len * 0.06 };
  const e = { x: p.wrist.x + ux * reach, y: p.wrist.y + uy * reach };
  c.beginPath();
  c.moveTo(s0.x + px * w0, s0.y + py * w0);
  c.quadraticCurveTo(s0.x + ux * reach * 0.35 + px * w1 * 0.9, s0.y + uy * reach * 0.35 + py * w1 * 0.9, e.x + px * w1, e.y + py * w1);
  c.lineTo(e.x - px * w1, e.y - py * w1);
  c.quadraticCurveTo(s0.x + ux * reach * 0.35 - px * w1 * 0.9, s0.y + uy * reach * 0.35 - py * w1 * 0.9, s0.x - px * w0, s0.y - py * w0);
  c.closePath();
  c.fill();
  // the wrist joint: a round so the turn of the hand never shows a seam
  const W = p.wrist;
  c.beginPath();
  c.arc(W.x, W.y, p.len * 0.165, 0, Math.PI * 2);
  c.fill();

  // ---- the palm block: heel high at the wrist, the top contour dipping into the hollow, the back of the hand below
  const top = [
    [0.0, 0.16],
    [0.13, 0.185],
    [0.24, lerp(0.14, 0.095, o)],
    [0.36, lerp(0.12, 0.075, o)],
    [0.5, lerp(0.12, 0.1, o)],
  ] as [number, number][];
  const bot = [
    [0.58, 0.02],
    [0.5, -0.14],
    [0.3, -0.175],
    [0.08, -0.17],
    [-0.02, -0.15],
  ] as [number, number][];
  const pts = [...top, ...bot].map(([x, y]) => L(p, x, y));
  c.beginPath();
  c.moveTo((pts[0].x + pts[pts.length - 1].x) / 2, (pts[0].y + pts[pts.length - 1].y) / 2);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    c.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  c.closePath();
  c.fill();

  // ---- the fingers: in profile three show (index on top, little finger lowest and shortest); relaxed they curl in,
  // open they lie out with the tips turned up 10-15 deg (the cup's far wall)
  const curlIn = lerp(0.7, 0.0, o);
  const tipUp = lerp(0.35, 0.24, o);
  finger(c, p, [0.5, 0.055], lerp(0.25, 0.03, o), 0.5, 0.1, tipUp + curlIn);
  finger(c, p, [0.5, -0.03], lerp(0.2, 0.0, o), 0.49, 0.1, tipUp * 0.9 + curlIn * 1.1);
  finger(c, p, [0.47, -0.11], lerp(0.15, 0.02, o), 0.4, 0.09, tipUp * 0.8 + curlIn * 1.2);

  // ---- the thumb: from the heel's far side, splayed UP and forward over the finger bases (closed: lying along them)
  const tAng = lerp(0.12, 0.95, o);
  finger(c, p, [0.3, 0.1], tAng, 0.34, 0.115, lerp(-0.05, -0.45, o), 0.5);
  c.restore();

  // ---- a faint key-side highlight inside the hollow (the palm faces the lamp): reads as an open cup, not a fist
  if (o > 0.3) {
    const h0 = L(p, 0.18, 0.13), h1 = L(p, 0.47, 0.095);
    c.save();
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.32 * (o - 0.3) / 0.7);
    c.lineWidth = 1.3;
    c.lineCap = 'round';
    c.beginPath();
    const m = L(p, 0.33, 0.055);
    c.moveTo(h0.x, h0.y);
    c.quadraticCurveTo(m.x, m.y, h1.x, h1.y);
    c.stroke();
    c.restore();
  }
}
