/**
 * Prop kit internals (shared by every file in props/). Shot authors rarely need
 * these directly; the public bits are re-exported from props/index.ts:
 *
 *   CM                      stage px per centimetre at the action plane (adult 175 cm = 320 px)
 *   PropAt                  { x, y, s?, flip?, rot? } — every prop's placement: (x,y) = the point
 *                           where the prop stands (bottom centre) in layer world space
 *   defineProp(draw, anchors, size)  -> callable Painter + .anchors(o) + .bounds(o)
 *   propGlow(c, x, y, env, o)        three-gradient additive practical glow (style bible §2.5)
 *                                    for galleries / props; in shots prefer Frame.practical()
 *   flicker(t, seed)                 deterministic candle flicker factor (≈ 1 ± 0.07)
 *
 * Geometry is authored in centimetres with y up = negative, origin at the base.
 * Static outlines are Path2D objects memoised by their parameters (memo()), so
 * a frame only transforms and fills.
 */
import type { PaintEnv, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/** stage px per cm at the action plane (adult puppet 320 px ≈ 175 cm). */
export const CM = 320 / 175;

export interface PropAt {
  /** world x of the prop's base centre */
  x: number;
  /** world y of the surface the prop stands on (floor / table top) */
  y: number;
  /** extra scale on top of real size (1 = true size next to a puppet) */
  s?: number;
  /** mirror horizontally (props only; puppets must not be mirrored) */
  flip?: boolean;
  /** rotation in radians about the base point */
  rot?: number;
}

export type Prop<O extends PropAt, A extends string> = Painter<O> & {
  /** world-space attachment points (flame, screen centre, grip …) */
  anchors(o: O): Record<A, Pt>;
  /** approximate world bounding box */
  bounds(o: O): Rect;
};

/** Define a prop: draw runs in local cm space (already entered); anchors/size are local cm. */
export function defineProp<O extends PropAt, A extends string>(
  draw: (c: CanvasRenderingContext2D, o: O, env: PaintEnv) => void,
  anchors: (o: O) => Record<A, Pt>,
  size: (o: O) => Rect,
): Prop<O, A> {
  const fn = ((c: CanvasRenderingContext2D, o: O, env: PaintEnv) => {
    enter(c, o);
    try {
      draw(c, o, env);
    } finally {
      c.restore();
    }
  }) as Prop<O, A>;
  fn.anchors = (o) => {
    const a = anchors(o);
    const out = {} as Record<A, Pt>;
    for (const k in a) out[k] = toWorld(o, a[k].x, a[k].y);
    return out;
  };
  fn.bounds = (o) => {
    const r = size(o);
    const p = [toWorld(o, r.x, r.y), toWorld(o, r.x + r.w, r.y + r.h), toWorld(o, r.x, r.y + r.h), toWorld(o, r.x + r.w, r.y)];
    const xs = p.map((q) => q.x);
    const ys = p.map((q) => q.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  };
  return fn;
}

export function enter(c: CanvasRenderingContext2D, o: PropAt) {
  c.save();
  c.translate(o.x, o.y);
  if (o.rot) c.rotate(o.rot);
  const k = CM * (o.s ?? 1);
  c.scale(o.flip ? -k : k, k);
}

export function toWorld(o: PropAt, lx: number, ly: number): Pt {
  const k = CM * (o.s ?? 1);
  let x = lx * k * (o.flip ? -1 : 1);
  let y = ly * k;
  if (o.rot) {
    const cs = Math.cos(o.rot);
    const sn = Math.sin(o.rot);
    [x, y] = [x * cs - y * sn, x * sn + y * cs];
  }
  return { x: o.x + x, y: o.y + y };
}

// ---------------------------------------------------------------------------
// memo + deterministic noise
// ---------------------------------------------------------------------------
const MEMO = new Map<string, unknown>();
export function memo<T>(key: string, make: () => T): T {
  let v = MEMO.get(key) as T | undefined;
  if (v === undefined) {
    v = make();
    MEMO.set(key, v);
  }
  return v;
}

/** integer hash -> [0,1) */
export function hash(i: number, seed = 0): number {
  let h = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i, seed) * (1 - u) + hash(i + 1, seed) * u) * 2 - 1;
}
/** 1-D fbm in [-1,1] */
export function fbm(x: number, seed: number): number {
  return (vnoise(x, seed) * 0.57 + vnoise(x * 2.03, seed + 17) * 0.29 + vnoise(x * 4.1, seed + 31) * 0.14);
}
/** candle flicker factor per style bible §2.5 (quantised to ones) */
export function flicker(t: number, seed: number) {
  const tq = Math.floor(t * 24) / 24;
  return 1 + 0.07 * fbm(tq * 9, seed);
}
/** flame-tip sway in cm (±0.7 cm ≈ ±1.2 px) */
export function sway(t: number, seed: number) {
  const tq = Math.floor(t * 24) / 24;
  return 0.65 * fbm(tq * 3.1, seed + 5);
}
/** deterministic on/off for LED i: `activity` 0..1 fraction lit, `rate` changes/sec */
export function blink(i: number, t: number, seed: number, activity = 0.5, rate = 3): boolean {
  const ph = hash(i, seed + 7);
  const r = rate * (0.4 + 1.2 * hash(i, seed + 11));
  const step = Math.floor(t * r + ph * 10);
  return hash(step * 131 + i, seed) < activity;
}

// ---------------------------------------------------------------------------
// geometry helpers (all write into a Path2D in local cm)
// ---------------------------------------------------------------------------
/** Catmull-Rom through pts; corners[i] = true makes point i a hard corner. */
export function spline(p: Path2D, pts: Pt[], corners?: boolean[], move = true) {
  if (!pts.length) return;
  if (move) p.moveTo(pts[0].x, pts[0].y);
  else p.lineTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const pa = corners?.[i] || i === 0 ? a : pts[i - 1];
    const pb = corners?.[i + 1] || i + 2 >= pts.length ? b : pts[i + 2];
    p.bezierCurveTo(a.x + (b.x - pa.x) / 6, a.y + (b.y - pa.y) / 6, b.x - (pb.x - a.x) / 6, b.y - (pb.y - a.y) / 6, b.x, b.y);
  }
}

/**
 * Lathe: a turned, mirror-symmetric outline. profile = [[radius, y, corner?], …]
 * from the base (y = 0) upward (negative y). corner = 1 marks a crisp edge.
 */
export function lathe(profile: Array<[number, number] | [number, number, number]>, cx = 0, p = new Path2D()): Path2D {
  const right = profile.map(([r, y]) => ({ x: cx + r, y }));
  const corners = profile.map((q) => q[2] === 1);
  const left = profile.map(([r, y]) => ({ x: cx - r, y })).reverse();
  const lc = [...corners].reverse();
  spline(p, right, corners, true);
  spline(p, left, lc, false);
  p.closePath();
  return p;
}

export function rect(p: Path2D, x: number, y: number, w: number, h: number) {
  p.rect(x, y, w, h);
  return p;
}
export function rrect(p: Path2D, x: number, y: number, w: number, h: number, r: number) {
  p.roundRect(x, y, w, h, r);
  return p;
}
export function circle(p: Path2D, x: number, y: number, r: number, ccw = false) {
  p.moveTo(x + r, y);
  p.arc(x, y, r, 0, Math.PI * 2, ccw);
  p.closePath();
  return p;
}
export function ellipse(p: Path2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  p.closePath();
  return p;
}
export function poly(p: Path2D, pts: number[], close = true) {
  p.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
  if (close) p.closePath();
  return p;
}
/** thick line segment as a filled quad (for struts, rods) */
export function bar(p: Path2D, x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * (w / 2);
  const ny = (dx / L) * (w / 2);
  return poly(p, [x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny]);
}
/** a sagging cable from a to b (quadratic), into an open path for stroking */
export function sag(p: Path2D, x1: number, y1: number, x2: number, y2: number, droop: number) {
  p.moveTo(x1, y1);
  p.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + droop, x2, y2);
  return p;
}
/** stamp a motif path along a row */
export function repeat(p: Path2D, motif: Path2D, x0: number, x1: number, pitch: number, y = 0) {
  for (let x = x0; x <= x1 + 1e-6; x += pitch) p.addPath(motif, new DOMMatrix().translate(x, y));
  return p;
}
/** a turned "bun"/bead foot or knob */
export function bead(p: Path2D, x: number, y: number, r: number) {
  return circle(p, x, y, r);
}

// ---------------------------------------------------------------------------
// paint helpers
// ---------------------------------------------------------------------------
/** device px -> current local units (keeps hairlines crisp at any prop scale / camera zoom) */
export function px(c: CanvasRenderingContext2D, devicePx: number) {
  const m = c.getTransform();
  return devicePx / (Math.hypot(m.a, m.b) || 1);
}

export function fillInk(c: CanvasRenderingContext2D, env: PaintEnv, path: Path2D, rule: CanvasFillRule = 'nonzero') {
  c.fillStyle = env.fill('ink');
  c.fill(path, rule);
}

/** inner cut-lines (style bible §2.6): rim-coloured hairlines, 1.2–1.8 device px, α .45–.6 */
/**
 * Directional cut-lines (opt-in, scoped): while set, cut() strokes fade from full alpha at the lit end
 * (local-space point a, toward the windows) to `floor` × alpha at the far end (b), so only the
 * window-facing edges and louvres catch light instead of every edge carrying the same outline.
 * Points are in the prop's LOCAL units (cm, y up negative). Use withCutLight(spec, () => draw()).
 */
export interface CutLight {
  a: { x: number; y: number };
  b: { x: number; y: number };
  floor: number;
  /** which vertical side edge faces the window: -1 left, 1 right, 0 neither (top only). Props that draw
   *  edge-hugging seams (cabinets) skip the other side; omitted = both sides, as before. */
  side?: -1 | 0 | 1;
}
let CUT_LIGHT: CutLight | null = null;
export function withCutLight<T>(spec: CutLight | null, draw: () => T): T {
  const prev = CUT_LIGHT;
  CUT_LIGHT = spec;
  try {
    return draw();
  } finally {
    CUT_LIGHT = prev;
  }
}

/** the window-facing side of the active cut light (undefined = no preference: draw both sides) */
export function cutSide(): -1 | 0 | 1 | undefined {
  return CUT_LIGHT?.side;
}

export function cut(c: CanvasRenderingContext2D, env: PaintEnv, path: Path2D, alpha = 0.5, devicePx = 1.4) {
  c.save();
  if (CUT_LIGHT) {
    const L = CUT_LIGHT;
    const g = c.createLinearGradient(L.a.x, L.a.y, L.b.x, L.b.y);
    g.addColorStop(0, withAlpha(env.mood.rim, alpha));
    g.addColorStop(0.35, withAlpha(env.mood.rim, alpha * (0.35 + 0.65 * L.floor)));
    g.addColorStop(1, withAlpha(env.mood.rim, alpha * L.floor));
    c.strokeStyle = g;
  } else c.strokeStyle = withAlpha(env.mood.rim, alpha);
  c.lineWidth = px(c, devicePx);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke(path);
  c.restore();
}

/** semi-transparent "glass / lace / paper" fill in rim colour */
export function veil(c: CanvasRenderingContext2D, env: PaintEnv, path: Path2D, alpha = 0.25, rule: CanvasFillRule = 'nonzero') {
  c.fillStyle = withAlpha(env.mood.rim, alpha);
  c.fill(path, rule);
}

/** emissive colour between halo (u=0) and core (u=1) */
export function lamp(env: PaintEnv, u: number, alpha = 1) {
  return withAlpha(mixLab(env.mood.halo, env.mood.core, Math.max(0, Math.min(1, u))), alpha);
}

/** stroke a cable/wire path in ink at a given local width */
export function wire(c: CanvasRenderingContext2D, env: PaintEnv, path: Path2D, w: number) {
  c.save();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke(path);
  c.restore();
}

/**
 * A candle-type flame at local (x, y = wick base), height h cm. Teardrop with
 * deterministic sway; outer body halo->core, hot inner core.
 */
export function flame(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, h: number, seed: number, k = 1) {
  const sw = sway(env.t, seed) * (h / 3.2);
  const hh = h * (1 + (k - 1) * 0.8);
  const w = h * 0.3;
  const tip = { x: x + sw, y: y - hh };
  const body = (s: number) => {
    const p = new Path2D();
    const bw = w * s;
    const by = y - h * 0.08 * s;
    p.moveTo(tip.x * s + x * (1 - s), y - hh * s - h * 0.05 * (1 - s));
    p.bezierCurveTo(x + sw * 0.5 * s + bw * 0.55, y - hh * 0.55 * s, x + bw, by - h * 0.22 * s, x, by + h * 0.02);
    p.bezierCurveTo(x - bw, by - h * 0.22 * s, x + sw * 0.5 * s - bw * 0.55, y - hh * 0.55 * s, tip.x * s + x * (1 - s), y - hh * s - h * 0.05 * (1 - s));
    p.closePath();
    return p;
  };
  c.save();
  c.fillStyle = lamp(env, 0.35, 0.95);
  c.fill(body(1));
  c.fillStyle = lamp(env, 1, 1);
  c.fill(body(0.62));
  c.restore();
}

/**
 * Additive practical glow (style bible §2.5): room glow r·1, halo r·0.27, core r·0.085.
 * World units (call outside a prop transform). In shots prefer Frame.practical().
 */
export function propGlow(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  env: PaintEnv,
  o: { radius?: number; intensity?: number; seed?: number; flicker?: boolean; color?: 'halo' | 'core' } = {},
) {
  const R = o.radius ?? 260 / 1.5;
  const k = (o.intensity ?? 1) * (o.flicker === false ? 1 : flicker(env.t, o.seed ?? 1));
  const halo = env.mood.halo;
  const core = env.mood.core;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = (r: number, col: string, a: number) => {
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, withAlpha(col, a * k));
    gr.addColorStop(0.45, withAlpha(col, a * k * 0.38));
    gr.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  g(R, halo, 0.16);
  g(R * 0.27, halo, 0.35);
  g(R * 0.085, o.color === 'halo' ? halo : core, 0.75);
  c.restore();
}

/** light pool / beam: a soft additive cone from (x,y) toward angle, local or world units */
export function beam(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, ang: number, len: number, spread: number, alpha = 0.18) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, len);
  g.addColorStop(0, withAlpha(env.mood.halo, alpha));
  g.addColorStop(0.6, withAlpha(env.mood.halo, alpha * 0.35));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x, y);
  c.arc(x, y, len, ang - spread / 2, ang + spread / 2);
  c.closePath();
  c.fill();
  c.restore();
}

/** paper / card / slide-rule face tone (light, low chroma); alpha for translucency */
export function paper(env: PaintEnv, alpha = 1) {
  return withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), alpha);
}
/** a slightly lifted ink for panels that must separate from adjacent ink (screens off, slate) */
export function inkLift(env: PaintEnv, u = 0.25) {
  return mixLab(env.fill('ink'), env.mood.set, u);
}
