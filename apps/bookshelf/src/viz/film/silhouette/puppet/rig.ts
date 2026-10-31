/**
 * Puppet rig core (style bible §4.2): units, the rig tree + draw order, joint
 * limits, 2D affine math and the smooth-outline path builder every part uses.
 *
 * Units: a puppet is authored facing RIGHT in "figure units" where the whole
 * adult is UNIT_H = 300 tall (head = 40 → 7.5 heads), feet on y = 0, +x
 * forward, +y down. Each part is a Path2D in its own local space with its pivot
 * at the origin; limbs hang along +y. createPuppet (index.ts) scales by
 * spec.height / UNIT_H and flips the whole rig for facing 'left' (asymmetric
 * details are re-chosen per facing, so a flip never moves a pocket or a part).
 *
 * Joint angles are degrees, positive = forward:
 *   torso/neck/head: lean or nod forward (face goes down)
 *   shoulder/elbow/wrist/hip: the distal end swings forward
 *   knee: negative = shin swings back (bends)   ankle: positive = toes up
 * Limits (clampPose) follow the bible, re-signed to "positive = forward":
 *   shoulder −70…+175, elbow 0…160 (cut-out cheat for hand-to-chin), wrist −60…60, hip −45…+100,
 *   knee −150…0, ankle −40…+35, neck/head −25…25, torso −15…+20.
 *
 *   smooth(pts, { closed, path })  Catmull-Rom style outline through points
 *       [x, y] or [x, y, s] where s ∈ 0..1 is the local smoothness (0 = corner)
 *   M (affine [a b c d e f]): mIdentity, mMul, mTranslate, mRotate, mScale, mApply
 */
import type { JointId, Pose } from '../../contracts';

export const UNIT_H = 300;
export const HEAD_U = 40;
export const DEG = Math.PI / 180;

/** Draw order back → front (bible §4.2 tree). */
export const DRAW_ORDER = [
  'legB',
  'armB',
  'legF',
  'backHair',
  'hood',
  'torso',
  'lower',
  'neck',
  'head',
  'front',
  'armF',
] as const;

export const JOINT_LIMITS: Record<JointId, [number, number]> = {
  torso: [-15, 20],
  neck: [-25, 25],
  head: [-25, 25],
  shoulderF: [-70, 175],
  elbowF: [0, 160],
  wristF: [-60, 60],
  shoulderB: [-70, 175],
  elbowB: [0, 160],
  wristB: [-60, 60],
  hipF: [-45, 100],
  kneeF: [-150, 0],
  ankleF: [-40, 35],
  hipB: [-45, 100],
  kneeB: [-150, 0],
  ankleB: [-40, 35],
};

export const JOINTS = Object.keys(JOINT_LIMITS) as JointId[];

export function clampAngle(j: JointId, v: number): number {
  const [lo, hi] = JOINT_LIMITS[j];
  return v < lo ? lo : v > hi ? hi : v;
}

/** Read a pose angle with limits applied (missing = 0). */
export function ang(p: Pose, j: JointId): number {
  return clampAngle(j, p.angles[j] ?? 0);
}

// ---------------------------------------------------------------- affine
export type M = [number, number, number, number, number, number];
export const mIdentity = (): M => [1, 0, 0, 1, 0, 0];
export function mMul(m: M, n: M): M {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
export const mTranslate = (m: M, x: number, y: number): M => mMul(m, [1, 0, 0, 1, x, y]);
export function mRotate(m: M, rad: number): M {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return mMul(m, [c, s, -s, c, 0, 0]);
}
export const mScale = (m: M, sx: number, sy: number): M => mMul(m, [sx, 0, 0, sy, 0, 0]);
export function mApply(m: M, x: number, y: number): { x: number; y: number } {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}
/** World rotation (radians) encoded in a matrix (ignores flip sign). */
export const mAngle = (m: M) => Math.atan2(m[1], m[0]);

// ---------------------------------------------------------------- paths
export type Pt = [number, number] | [number, number, number];

/**
 * Smooth outline through points. Tangents follow the neighbour chord, scaled
 * by each side's own segment length (no Catmull-Rom overshoot on uneven
 * spacing). s (3rd value) = 0 makes a corner; 1 = fully smooth (default).
 */
export function smooth(pts: Pt[], o: { closed?: boolean; path?: Path2D; move?: boolean } = {}): Path2D {
  const p = o.path ?? new Path2D();
  const closed = o.closed ?? true;
  const n = pts.length;
  if (n < 2) return p;
  const get = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  const tan = (i: number) => {
    const a = get(i - 1);
    const b = get(i + 1);
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    return [dx, dy];
  };
  if (o.move === false) p.lineTo(pts[0][0], pts[0][1]);
  else p.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = get(i);
    const b = get(i + 1);
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sa = !closed && i === 0 ? 0 : a[2] ?? 1;
    const sb = !closed && i + 1 === n - 1 ? 0 : b[2] ?? 1;
    const ta = tan(i);
    const tb = tan(i + 1);
    const k = d / 3;
    p.bezierCurveTo(a[0] + ta[0] * k * sa, a[1] + ta[1] * k * sa, b[0] - tb[0] * k * sb, b[1] - tb[1] * k * sb, b[0], b[1]);
  }
  if (closed) p.closePath();
  return p;
}

/** Open polyline as a smooth stroke path (for cut-lines). */
export const curve = (pts: Pt[], path?: Path2D) => smooth(pts, { closed: false, path });

export function ellipsePath(cx: number, cy: number, rx: number, ry: number, rot = 0, path = new Path2D()): Path2D {
  path.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
  path.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  path.closePath();
  return path;
}

/** Map points through a transform (author once, place many). */
export function xf(pts: Pt[], f: (x: number, y: number) => [number, number]): Pt[] {
  return pts.map((q) => {
    const [x, y] = f(q[0], q[1]);
    return q.length > 2 ? [x, y, q[2] as number] : [x, y];
  });
}

/** Scale/translate a point list. */
export const sxy = (pts: Pt[], s: number, ox = 0, oy = 0, sy = s): Pt[] => xf(pts, (x, y) => [ox + x * s, oy + y * sy]);

/** Tapered limb with a hinge lobe (radius 0.55·w0) at the pivot and a rounded distal end. Pivot at origin, hangs along +y. */
export function limb(
  len: number,
  w0: number,
  w1: number,
  o: {
    /** front (+x) / back (−x) bulge in units and where along the length (0..1) */
    front?: number;
    back?: number;
    at?: number;
    /** hinge lobe radius factor (default 0.55 of w0, never less than half width) */
    lobe?: number;
    /** distal overhang past len (covers the next lobe) */
    over?: number;
    /** shift the whole limb forward (x) at the distal end (sleeve hang) */
    skew?: number;
    /** flare: extra half-width at the distal end (flares, cuffs) */
    flare?: number;
    /** square the distal end (a trouser hem or sleeve cuff rather than a rounded stump) */
    square?: boolean;
    path?: Path2D;
  } = {},
): Path2D {
  const p = o.path ?? new Path2D();
  const h0 = w0 / 2;
  const h1 = w1 / 2 + (o.flare ?? 0);
  const at = o.at ?? 0.35;
  const fr = o.front ?? 0;
  const bk = o.back ?? 0;
  const sk = o.skew ?? 0;
  // the distal end runs straight past the joint before rounding, so the next
  // part's hinge lobe always sits inside it (no V-notch at knees and elbows)
  const over = Math.max(o.over ?? Math.min(h1, 4), h1 * 0.9);
  const hm = h0 + (h1 - h0) * at;
  const q = o.square ? 0.15 : 0.8;
  const pts: Pt[] = [
    [h0, 0],
    [hm + fr + sk * at, len * at],
    [h1 + sk, len + over * (o.square ? 0.7 : 0.35), o.square ? 0.4 : 0.7],
    [sk + h1 * (o.square ? 0.9 : 0.62), len + over * (o.square ? 0.92 : 1), q],
    [sk - h1 * (o.square ? 0.96 : 0.62), len + over, q],
    [sk - h1, len + over * (o.square ? 0.75 : 0.35), o.square ? 0.4 : 0.7],
    [-hm - bk + sk * at, len * at],
    [-h0, 0],
  ];
  smooth(pts, { closed: false, path: p });
  // hinge lobe: semicircle over the pivot, closed into a full disc so the joint's
  // extent never changes as the limb rotates (no knobs at shoulders and hips)
  const r = Math.max(h0, (o.lobe ?? 0.55) * w0);
  p.arc(0, 0, r, Math.PI, 0, false);
  p.closePath();
  p.moveTo(h0, 0);
  p.arc(0, 0, h0, 0, Math.PI * 2);
  p.closePath();
  return p;
}

/** Deterministic hash → 0..1 (for seeded per-puppet choices). */
export function hash01(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
