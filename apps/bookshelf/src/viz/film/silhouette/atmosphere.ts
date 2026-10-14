/**
 * Atmosphere painters (style bible §2.4–2.5, §10.19): the ambient life of a held frame.
 * Every painter is a pure function of (env.t, env.seed, opts): no state, no Math.random.
 * Draw them inside `f.layer(...)` (world space of that layer) or screen-locked; `area`
 * (default: the stage plus a 40 px overscan) is the world rect particles live and wrap in.
 * Light-like effects (dust, rays, embers, snow, rain) are drawn additively/screen and are
 * never hazed; smoke/fog/paper take their tone from env.mood.
 *
 *   dustMotes(c, { beam?, count, drift, size }, env)        motes, bright inside a light beam
 *   godRays(c, { beams, intensity, mullions, shimmer }, env)  volumetric shafts from openings
 *       (beams are baked once per geometry: keep them static, animate `intensity` instead)
 *   windowBeam(rect, dir, length, spread)                   -> Beam from a window opening
 *   snow(c, { count, wind, fall, gust, settle }, env)       depth-layered snow, optional settling bank
 *   rain(c, { count, angle, speed, splashY }, env)          streaks in 3 depth bands + splashes
 *   embers(c, { x, y, spread, count, rise }, env)           rising, cooling sparks from a fire
 *   sparks(c, { x, y, t0, count, speed, gravity }, env)     one ballistic burst at t0 (forge, short)
 *   smoke(c, { x, y, kind: 'candle'|'pipe'|'steam'|'chimney', height, drift }, env)
 *   paperSheets(c, { count, size, wind, fall, tone }, env)  tumbling cut-paper sheets (moves on twos)
 *   fogBank(c, { y, height, speed, density, layers }, env)  rolling billowed fog (baked, scrolled)
 *
 * Noise helpers shared by finish/transitions: hash1, vnoise, fbm, vnoise2, fbm2, smoothstep,
 * softSprite(color) (cached radial disc), makeCanvas(w, h).
 */
import type { PaintEnv } from '../contracts';
import { mixLab, withAlpha } from './palette';

// ---------------------------------------------------------------------------
// deterministic noise
// ---------------------------------------------------------------------------
/** integer hash -> [0,1) */
export function hash1(n: number, seed = 0): number {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed | 0, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** smooth 1-D value noise in [-1, 1] */
export function vnoise(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash1(i, seed);
  const b = hash1(i + 1, seed);
  return (a + (b - a) * u) * 2 - 1;
}
/** 1-D fbm in roughly [-1, 1] */
export function fbm(x: number, seed = 0, oct = 3): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise(x, seed + o * 101);
    norm += amp;
    x *= 2.03;
    amp *= 0.5;
  }
  return s / norm;
}
/** smooth 2-D value noise in [0, 1] */
export function vnoise2(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => hash1(a * 73856093 + b * 19349663, seed);
  const a = h(ix, iy);
  const b = h(ix + 1, iy);
  const c = h(ix, iy + 1);
  const d = h(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
/** 2-D fbm in [0, 1] */
export function fbm2(x: number, y: number, seed = 0, oct = 4): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise2(x, y, seed + o * 131);
    norm += amp;
    x *= 2.02;
    y *= 2.02;
    amp *= 0.5;
  }
  return s / norm;
}
export const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const wrap = (v: number, lo: number, span: number) => lo + ((((v - lo) % span) + span) % span);

// ---------------------------------------------------------------------------
// canvases & sprites
// ---------------------------------------------------------------------------
export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
}
const spriteCache = new Map<string, HTMLCanvasElement>();
/** a 64 px soft radial disc in `color` (alpha 1 at centre -> 0), cached. hardness 0..1 widens the core. */
export function softSprite(color: string, hardness = 0): HTMLCanvasElement {
  const key = color + '|' + hardness.toFixed(2);
  let s = spriteCache.get(key);
  if (s) return s;
  s = makeCanvas(64, 64);
  const g = s.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, withAlpha(color, 1));
  gr.addColorStop(clamp01(0.15 + hardness * 0.6), withAlpha(color, 0.75 + hardness * 0.2));
  gr.addColorStop(clamp01(0.45 + hardness * 0.45), withAlpha(color, 0.22));
  gr.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return remember(spriteCache, key, s, 128);
}
/**
 * Device scale of the current transform, quantised to half-octave steps so a dolly or
 * lens move does not re-bake caches every frame (baked art is soft light; ±20% is invisible).
 */
function devScale(c: CanvasRenderingContext2D): number {
  const m = c.getTransform();
  const s = Math.max(0.25, Math.hypot(m.a, m.b));
  return Math.pow(2, Math.ceil(Math.log2(s) * 2 - 1e-6) / 2);
}
/** bounded insertion-ordered cache (oldest evicted) */
function remember<K, V>(map: Map<K, V>, k: K, v: V, cap = 32): V {
  map.set(k, v);
  if (map.size > cap) map.delete(map.keys().next().value as K);
  return v;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const DEFAULT_AREA: Rect = { x: -40, y: -40, w: 1360, h: 800 };

// ---------------------------------------------------------------------------
// beams (shared by dust + god rays)
// ---------------------------------------------------------------------------
/** A light shaft: centre line (x0,y0) -> (x1,y1), full width w0 at the source, w1 at the far end. */
export interface Beam {
  x0: number;
  y0: number;
  w0: number;
  x1: number;
  y1: number;
  w1: number;
}
/** Beam from a window opening `rect`: starts across the whole opening (top edge) and travels `length` px along `dir`, widening by `spread`. */
export function windowBeam(rect: Rect, dir: { x: number; y: number } = { x: -0.4, y: 1 }, length = 560, spread = 1.3): Beam {
  const n = Math.hypot(dir.x, dir.y) || 1;
  const dx = dir.x / n;
  const dy = dir.y / n;
  const w0 = Math.abs(rect.w * dy) + Math.abs(rect.h * dx) * 0.25;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.12;
  return { x0: cx, y0: cy, w0, x1: cx + dx * length, y1: cy + dy * length, w1: w0 * spread };
}
/** 0..1: how much point (x,y) sits inside the beam (soft edges, fades along its length) */
export function beamCoverage(b: Beam, x: number, y: number): number {
  const ax = b.x1 - b.x0;
  const ay = b.y1 - b.y0;
  const L2 = ax * ax + ay * ay || 1;
  const s = ((x - b.x0) * ax + (y - b.y0) * ay) / L2;
  if (s < -0.05 || s > 1.05) return 0;
  const px = b.x0 + ax * s;
  const py = b.y0 + ay * s;
  const d = Math.hypot(x - px, y - py);
  const half = (b.w0 + (b.w1 - b.w0) * clamp01(s)) / 2;
  return (1 - smoothstep(0.55, 1, d / half)) * (1 - 0.7 * clamp01(s)) * smoothstep(-0.05, 0.08, s);
}
function beamQuad(b: Beam, s0 = 0, s1 = 1, f0 = -0.5, f1 = 0.5): [number, number][] {
  const ax = b.x1 - b.x0;
  const ay = b.y1 - b.y0;
  const L = Math.hypot(ax, ay) || 1;
  const nx = -ay / L;
  const ny = ax / L;
  const at = (s: number, f: number): [number, number] => {
    const w = b.w0 + (b.w1 - b.w0) * s;
    return [b.x0 + ax * s + nx * w * f, b.y0 + ay * s + ny * w * f];
  };
  return [at(s0, f0), at(s0, f1), at(s1, f1), at(s1, f0)];
}

// ---------------------------------------------------------------------------
// dust motes
// ---------------------------------------------------------------------------
export interface DustOpts {
  area?: Rect;
  count?: number;
  /** motes inside the beam glow; outside they are barely visible */
  beam?: Beam;
  /** mean drift px/s */
  drift?: { x: number; y: number };
  /** radius of a mid mote, stage px (default 1.1) */
  size?: number;
  brightness?: number;
  color?: string;
  salt?: number;
}
interface Mote {
  x: number;
  y: number;
  z: number;
  ph: number;
  w: number;
}
const moteCache = new Map<string, Mote[]>();
function motes(n: number, seed: number, a: Rect): Mote[] {
  const k = `${n}|${seed}|${a.x},${a.y},${a.w},${a.h}`;
  let m = moteCache.get(k);
  if (m) return m;
  m = [];
  for (let i = 0; i < n; i++) {
    const z = hash1(i * 5 + 2, seed);
    m.push({ x: a.x + hash1(i * 5, seed) * a.w, y: a.y + hash1(i * 5 + 1, seed) * a.h, z: z * z, ph: hash1(i * 5 + 3, seed) * 100, w: 0.6 + hash1(i * 5 + 4, seed) * 2.2 });
  }
  return remember(moteCache, k, m, 64);
}
export function dustMotes(c: CanvasRenderingContext2D, o: DustOpts, env: PaintEnv): void {
  const a = o.area ?? DEFAULT_AREA;
  const list = motes(o.count ?? 140, env.seed * 31 + (o.salt ?? 7), a);
  const t = env.t;
  const dr = o.drift ?? { x: 3, y: -1.5 };
  const size = o.size ?? 1.1;
  const br = o.brightness ?? 1;
  const spr = softSprite(o.color ?? env.mood.core, 0.35);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const sp = 0.5 + m.z;
    const x = wrap(m.x + dr.x * t * sp + 14 * fbm(t * 0.11 + m.ph, 3), a.x, a.w);
    const y = wrap(m.y + dr.y * t * sp + 10 * fbm(t * 0.09 + m.ph, 9), a.y, a.h);
    const lit = o.beam ? beamCoverage(o.beam, x, y) : 0.6;
    const tw = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(t * m.w + m.ph), 3); // a facet catching the light
    let alpha = br * (0.04 + 0.96 * lit) * tw;
    if (alpha < 0.01) continue;
    // near motes (z>0.85) are out of focus: larger, softer, dimmer
    const bokeh = m.z > 0.85;
    const r = size * (0.7 + 1.5 * m.z) * (bokeh ? 3.2 : 2.1);
    if (bokeh) alpha *= 0.28;
    c.globalAlpha = Math.min(1, alpha);
    c.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// god rays
// ---------------------------------------------------------------------------
export interface GodRayOpts {
  beams: Beam[];
  /** 0..1 overall strength (default 0.45) */
  intensity?: number;
  color?: string;
  /** thin brighter sub-shafts per beam (default 6) */
  streaks?: number;
  /** slow ±shimmer of brightness (default 0.12) */
  shimmer?: number;
  /** glazing bars: dark gaps across the beam (default 0) */
  mullions?: number;
  /** edge softness in px at 1080p (default 16) */
  softness?: number;
  salt?: number;
}
interface BakedBeam {
  cv: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
}
const beamCache = new Map<string, BakedBeam>();
function bakeBeam(b: Beam, layerSeed: number, kind: 'body' | 'streakA' | 'streakB', o: GodRayOpts, color: string, scale: number): BakedBeam {
  const soft = (o.softness ?? 10) / 1.5;
  const key = `${kind}|${b.x0},${b.y0},${b.w0},${b.x1},${b.y1},${b.w1}|${color}|${scale.toFixed(2)}|${o.mullions ?? 0}|${o.streaks ?? 6}|${soft}|${layerSeed}`;
  let bb = beamCache.get(key);
  if (bb) return bb;
  const q = beamQuad(b);
  const pad = soft * 3 + 4;
  const xs = q.map((p) => p[0]);
  const ys = q.map((p) => p[1]);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  const w = Math.max(...xs) + pad - x;
  const h = Math.max(...ys) + pad - y;
  const res = scale * 0.5; // blurred light: half resolution is plenty
  const cv = makeCanvas(w * res, h * res);
  const g = cv.getContext('2d')!;
  g.setTransform(res, 0, 0, res, -x * res, -y * res);
  g.filter = `blur(${(soft * res).toFixed(2)}px)`;
  const grad = g.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
  const poly = (pts: [number, number][]) => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  };
  if (kind === 'body') {
    grad.addColorStop(0, withAlpha(color, 0));
    grad.addColorStop(0.22, withAlpha(color, 0.85));
    grad.addColorStop(0.45, withAlpha(color, 0.6));
    grad.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = grad;
    const bars = o.mullions ?? 0;
    if (bars > 0) {
      const gap = 0.16 / (bars + 1);
      const seg = 1 / (bars + 1);
      for (let i = 0; i <= bars; i++) {
        const f0 = -0.5 + i * seg + (i > 0 ? gap / 2 : 0);
        const f1 = -0.5 + (i + 1) * seg - (i < bars ? gap / 2 : 0);
        poly(beamQuad(b, 0, 1, f0, f1));
        g.fill();
      }
    } else {
      poly(q);
      g.fill();
    }
  } else {
    const n = o.streaks ?? 6;
    const sd = layerSeed + (kind === 'streakA' ? 11 : 23);
    grad.addColorStop(0, withAlpha(color, 0));
    grad.addColorStop(0.2, withAlpha(color, 1));
    grad.addColorStop(0.55, withAlpha(color, 0.45));
    grad.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = grad;
    g.filter = `blur(${(soft * 0.45 * res).toFixed(2)}px)`;
    for (let i = 0; i < n; i++) {
      const fc = -0.42 + hash1(i, sd) * 0.84;
      const fw = 0.015 + hash1(i + 50, sd) * 0.07;
      const s1 = 0.55 + hash1(i + 90, sd) * 0.45;
      g.globalAlpha = 0.35 + hash1(i + 130, sd) * 0.65;
      poly(beamQuad(b, 0, s1, fc - fw, fc + fw));
      g.fill();
    }
  }
  bb = { cv, x, y, w, h };
  return remember(beamCache, key, bb, 48);
}
export function godRays(c: CanvasRenderingContext2D, o: GodRayOpts, env: PaintEnv): void {
  const scale = devScale(c);
  const color = o.color ?? mixLab(env.mood.halo, env.mood.rim, 0.5);
  const I = o.intensity ?? 0.45;
  const sh = o.shimmer ?? 0.12;
  const t = env.t;
  const sd = env.seed * 17 + (o.salt ?? 3);
  c.save();
  c.globalCompositeOperation = 'screen';
  o.beams.forEach((b, i) => {
    const body = bakeBeam(b, sd + i, 'body', o, color, scale);
    const k = 1 + sh * fbm(t * 0.35 + i * 7.1, sd + i);
    c.globalAlpha = clamp01(I * k);
    c.drawImage(body.cv, body.x, body.y, body.w, body.h);
    if ((o.streaks ?? 6) > 0) {
      const sa = bakeBeam(b, sd + i, 'streakA', o, color, scale);
      const sb = bakeBeam(b, sd + i, 'streakB', o, color, scale);
      const m = 0.5 + 0.5 * fbm(t * 0.22 + i * 3.3, sd + 40 + i); // streaks drift in and out
      c.globalAlpha = clamp01(I * 0.55 * m * k);
      c.drawImage(sa.cv, sa.x, sa.y, sa.w, sa.h);
      c.globalAlpha = clamp01(I * 0.55 * (1 - m) * k);
      c.drawImage(sb.cv, sb.x, sb.y, sb.w, sb.h);
    }
  });
  c.restore();
}

// ---------------------------------------------------------------------------
// snow
// ---------------------------------------------------------------------------
export interface SnowOpts {
  area?: Rect;
  count?: number;
  /** horizontal wind, px/s at mid depth (default 16) */
  wind?: number;
  /** fall speed, px/s at mid depth (default 42) */
  fall?: number;
  /** gust strength 0..2 (default 1) */
  gust?: number;
  /** flake radius multiplier (default 1) */
  size?: number;
  color?: string;
  /** settling bank on a ground line: grows `rate` px/s up to `depth` px */
  settle?: { y: number; depth?: number; rate?: number; x0?: number; x1?: number; t0?: number };
  /** 0..1 restrict to far (0) .. near (1) flakes, e.g. [0, 0.6] behind the action plane */
  depthRange?: [number, number];
  salt?: number;
}
export function snow(c: CanvasRenderingContext2D, o: SnowOpts, env: PaintEnv): void {
  const a = o.area ?? DEFAULT_AREA;
  const n = o.count ?? 420;
  const sd = env.seed * 13 + (o.salt ?? 5);
  const list = motes(n, sd, a);
  const t = env.t;
  const wind = o.wind ?? 16;
  const fall = o.fall ?? 42;
  const gust = (o.gust ?? 1) * 38;
  const sz = o.size ?? 1;
  const base = o.color ?? mixLab(env.mood.rim, env.mood.core, 0.45);
  const [d0, d1] = o.depthRange ?? [0, 1];
  // 4 depth bands, each with its own hazed sprite
  const sprites = [0, 1, 2, 3].map((k) => softSprite(mixLab(env.mood.haze, base, 0.45 + k * 0.18), k === 3 ? 0.15 : 0.6));
  const G = fbm(t * 0.18, sd + 1) * gust;
  c.save();
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const d = m.z;
    if (d < d0 || d > d1) continue;
    const sp = 0.45 + 0.9 * d;
    const x = wrap(m.x + wind * sp * t + G * sp + (3 + 7 * d) * Math.sin(t * (0.6 + m.w * 0.4) + m.ph), a.x, a.w);
    const y = wrap(m.y + fall * sp * t + 4 * Math.sin(t * 0.8 + m.ph * 2), a.y, a.h);
    const band = Math.min(3, Math.floor(d * 4));
    let r = sz * (1.6 + 5.2 * Math.pow(d, 1.4));
    let alpha = 0.5 + 0.5 * d;
    if (d > 0.9) {
      r *= 2.2; // bokeh flakes right at the lens
      alpha *= 0.4;
    }
    c.globalAlpha = alpha;
    c.drawImage(sprites[band], x - r, y - r, r * 2, r * 2);
  }
  c.restore();
  if (o.settle) snowBank(c, o.settle, env, base, sd);
}
function snowBank(c: CanvasRenderingContext2D, s: NonNullable<SnowOpts['settle']>, env: PaintEnv, base: string, sd: number) {
  const h = Math.min(s.depth ?? 18, Math.max(0, env.t - (s.t0 ?? 0)) * (s.rate ?? 0.8));
  if (h <= 0.2) return;
  const x0 = s.x0 ?? -40;
  const x1 = s.x1 ?? 1320;
  c.save();
  c.beginPath();
  c.moveTo(x0, s.y + 2);
  for (let x = x0; x <= x1; x += 8) {
    const k = 0.7 + 0.3 * fbm(x / 70, sd + 9) + 0.12 * fbm(x / 19, sd + 3);
    c.lineTo(x, s.y - h * k);
  }
  c.lineTo(x1, s.y + 2);
  c.closePath();
  const g = c.createLinearGradient(0, s.y - h, 0, s.y + 2);
  g.addColorStop(0, mixLab(env.mood.haze, base, 0.75));
  g.addColorStop(1, mixLab(env.mood.set, env.mood.haze, 0.6));
  c.fillStyle = g;
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------
// rain
// ---------------------------------------------------------------------------
export interface RainOpts {
  area?: Rect;
  count?: number;
  /** slant in degrees from vertical, + = toward +x (default 10) */
  angle?: number;
  /** fall speed px/s at mid depth (default 950) */
  speed?: number;
  /** streak length at mid depth (default 26) */
  length?: number;
  color?: string;
  /** ground line for splashes (omit for none) */
  splashY?: number;
  intensity?: number;
  salt?: number;
}
export function rain(c: CanvasRenderingContext2D, o: RainOpts, env: PaintEnv): void {
  const a = o.area ?? DEFAULT_AREA;
  const n = o.count ?? 240;
  const sd = env.seed * 19 + (o.salt ?? 2);
  const list = motes(n, sd, a);
  const t = env.t;
  const ang = ((o.angle ?? 10) * Math.PI) / 180;
  const sx = Math.sin(ang);
  const sy = Math.cos(ang);
  const v = o.speed ?? 950;
  const len = o.length ?? 26;
  const col = o.color ?? env.mood.rim;
  const I = o.intensity ?? 1;
  c.save();
  c.lineCap = 'round';
  for (let band = 0; band < 3; band++) {
    c.beginPath();
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (Math.min(2, Math.floor(m.z * 3)) !== band) continue;
      const sp = 0.6 + 0.8 * m.z;
      const travel = v * sp * t + m.ph * 37;
      const y = wrap(m.y + travel * sy, a.y, a.h);
      const x = wrap(m.x + travel * sx, a.x, a.w);
      const L = len * sp;
      c.moveTo(x, y);
      c.lineTo(x - sx * L, y - sy * L);
    }
    c.strokeStyle = withAlpha(mixLab(env.mood.haze, col, 0.4 + band * 0.3), (0.16 + band * 0.12) * I);
    c.lineWidth = 0.55 + band * 0.45;
    c.stroke();
  }
  if (o.splashY !== undefined) {
    c.strokeStyle = withAlpha(col, 0.35 * I);
    c.lineWidth = 0.7;
    const S = 34;
    for (let k = 0; k < S; k++) {
      const per = 0.35 + hash1(k, sd + 7) * 0.5;
      const cyc = Math.floor((t + hash1(k + 99, sd) * per) / per);
      const age = (t + hash1(k + 99, sd) * per) % per;
      if (age > 0.16) continue;
      const u = age / 0.16;
      const x = a.x + hash1(k * 7 + cyc * 131, sd) * a.w;
      const y = o.splashY + (hash1(k * 3 + cyc * 17, sd) - 0.5) * 10;
      c.globalAlpha = 1 - u;
      c.beginPath();
      c.ellipse(x, y, 2 + 9 * u, 0.6 + 2 * u, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath(); // crown droplets
      for (const dir of [-1, 1]) {
        const px = x + dir * (2 + 6 * u);
        const py = y - 7 * u + 10 * u * u;
        c.moveTo(px, py);
        c.lineTo(px + dir * 0.8, py - 1.6);
      }
      c.stroke();
    }
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// embers & sparks
// ---------------------------------------------------------------------------
export interface EmberOpts {
  x: number;
  y: number;
  /** width of the source (default 60) */
  spread?: number;
  count?: number;
  /** rise speed px/s (default 70) */
  rise?: number;
  /** life seconds (default 2.6) */
  life?: number;
  /** sideways wind px/s (default 6) */
  wind?: number;
  size?: number;
  intensity?: number;
  salt?: number;
}
function emberColor(env: PaintEnv, u: number): string {
  // hot core -> halo -> dull rim/haze as it cools
  return u < 0.35 ? mixLab(env.mood.core, env.mood.halo, u / 0.35) : mixLab(env.mood.halo, mixLab(env.mood.rim, env.mood.haze, 0.5), (u - 0.35) / 0.65);
}
export function embers(c: CanvasRenderingContext2D, o: EmberOpts, env: PaintEnv): void {
  const n = o.count ?? 36;
  const sd = env.seed * 23 + (o.salt ?? 4);
  const t = env.t;
  const L0 = o.life ?? 2.6;
  const rise = o.rise ?? 70;
  const spread = o.spread ?? 60;
  const wind = o.wind ?? 6;
  const size = o.size ?? 1;
  const I = o.intensity ?? 1;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const L = L0 * (0.6 + 0.8 * hash1(i, sd));
    const ph = hash1(i + 300, sd) * L;
    const cyc = Math.floor((t + ph) / L);
    const age = t + ph - cyc * L;
    const u = age / L;
    const h1 = hash1(i * 13 + cyc * 7919, sd);
    const h2 = hash1(i * 17 + cyc * 104729, sd + 1);
    const x = o.x + spread * (h1 - 0.5) + wind * age + (6 + 22 * u) * Math.sin(age * (2 + 3 * h2) + h1 * 6.28) * u;
    const y = o.y - rise * (0.6 + 0.8 * h2) * (age + 0.25 * age * age);
    const fl = 0.6 + 0.4 * hash1(i + Math.floor(t * 24) * 31, sd + 2); // per-frame twinkle (on ones)
    const a = I * fl * smoothstep(0, 0.08, u) * (1 - smoothstep(0.55, 1, u));
    if (a <= 0.01) continue;
    const col = emberColor(env, u);
    const r = size * (5 + 3 * (1 - u));
    c.globalAlpha = a * 0.55;
    c.drawImage(softSprite(env.mood.halo), x - r, y - r, r * 2, r * 2);
    c.globalAlpha = a;
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, size * (1.1 - 0.5 * u), 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
export interface SparkOpts {
  x: number;
  y: number;
  /** burst time, shot-local seconds */
  t0: number;
  count?: number;
  /** launch speed px/s (default 260) */
  speed?: number;
  /** px/s² (default 520) */
  gravity?: number;
  life?: number;
  /** launch direction (deg, 0 = up) and cone (deg) */
  angle?: number;
  cone?: number;
  intensity?: number;
  salt?: number;
}
export function sparks(c: CanvasRenderingContext2D, o: SparkOpts, env: PaintEnv): void {
  const age0 = env.t - o.t0;
  const life = o.life ?? 1.1;
  if (age0 < 0 || age0 > life * 1.5) return;
  const n = o.count ?? 28;
  const sd = env.seed * 29 + (o.salt ?? 6);
  const g = o.gravity ?? 520;
  const V = o.speed ?? 260;
  const ang = ((o.angle ?? 0) * Math.PI) / 180;
  const cone = ((o.cone ?? 110) * Math.PI) / 180;
  const I = o.intensity ?? 1;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const L = life * (0.45 + 0.8 * hash1(i, sd));
    const age = age0;
    if (age > L) continue;
    const th = ang + (hash1(i + 40, sd) - 0.5) * cone;
    const v = V * (0.35 + 0.9 * hash1(i + 80, sd));
    const vx = Math.sin(th) * v;
    const vy = -Math.cos(th) * v;
    const p = (s: number) => [o.x + vx * s, o.y + vy * s + 0.5 * g * s * s] as const;
    const [x, y] = p(age);
    const [px, py] = p(Math.max(0, age - 1 / 40)); // motion streak
    const u = age / L;
    c.globalAlpha = I * (1 - u * u);
    c.strokeStyle = emberColor(env, u * 0.8);
    c.lineWidth = 1.3 - 0.6 * u;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(x, y);
    c.stroke();
  }
  // the flash at the strike
  if (age0 < 0.12) {
    const r = 40 * (1 - age0 / 0.12) + 10;
    c.globalAlpha = I * 0.6 * (1 - age0 / 0.12);
    c.drawImage(softSprite(env.mood.core), o.x - r, o.y - r, r * 2, r * 2);
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// smoke & steam
// ---------------------------------------------------------------------------
export interface SmokeOpts {
  x: number;
  y: number;
  /** candle: one thin laminar thread that breaks into curls; pipe: 2 threads + slow puffs;
   *  steam: fast pale puffs (cup, kettle, engine); chimney: big, darker billows */
  kind?: 'candle' | 'pipe' | 'steam' | 'chimney';
  /** rise height px (defaults by kind) */
  height?: number;
  /** sideways drift at the top, px (default 30) */
  drift?: number;
  intensity?: number;
  color?: string;
  /** scale for puffs (default 1) */
  scale?: number;
  salt?: number;
}
function ribbon(c: CanvasRenderingContext2D, o: SmokeOpts, env: PaintEnv, H: number, strand: number, color: string, I: number) {
  const N = 40;
  const t = env.t;
  const sd = env.seed * 41 + (o.salt ?? 8) + strand * 13;
  const drift = o.drift ?? 30;
  const ph = hash1(strand, sd) * 6.28;
  const L: number[] = [];
  const R: number[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const turb = Math.pow(s, 1.5);
    const amp = 1 + 30 * turb;
    const cx =
      o.x +
      drift * s * s +
      amp * (0.55 * Math.sin(s * 9 - t * 1.6 + ph) + 0.45 * fbm(s * 3.2 - t * 0.45, sd)) +
      strand * 4 * s;
    const cy = o.y - s * H;
    const w = 1.3 + 16 * turb;
    L.push(cx - w / 2, cy);
    R.push(cx + w / 2, cy);
  }
  const g = c.createLinearGradient(0, o.y, 0, o.y - H);
  g.addColorStop(0, withAlpha(color, 0));
  g.addColorStop(0.04, withAlpha(color, 0.8 * I));
  g.addColorStop(0.3, withAlpha(color, 0.55 * I));
  g.addColorStop(0.7, withAlpha(color, 0.2 * I));
  g.addColorStop(1, withAlpha(color, 0));
  const path = (widen: number) => {
    c.beginPath();
    for (let k = 0; k <= N; k++) {
      const mx = (L[k * 2] + R[k * 2]) / 2;
      const hw = ((R[k * 2] - L[k * 2]) / 2) * widen;
      if (k === 0) c.moveTo(mx - hw, L[1]);
      else c.lineTo(mx - hw, L[k * 2 + 1]);
    }
    for (let k = N; k >= 0; k--) {
      const mx = (L[k * 2] + R[k * 2]) / 2;
      const hw = ((R[k * 2] - L[k * 2]) / 2) * widen;
      c.lineTo(mx + hw, R[k * 2 + 1]);
    }
    c.closePath();
  };
  c.fillStyle = g;
  c.globalAlpha = 0.3;
  path(2.6);
  c.fill();
  c.globalAlpha = 1;
  path(1);
  c.fill();
}
function puffs(c: CanvasRenderingContext2D, o: SmokeOpts, env: PaintEnv, H: number, n: number, life: number, r0: number, r1: number, color: string, I: number) {
  const t = env.t;
  const sd = env.seed * 43 + (o.salt ?? 8);
  const drift = o.drift ?? 30;
  const spr = softSprite(color, 0);
  const sc = o.scale ?? 1;
  for (let i = 0; i < n; i++) {
    const ph = (i / n) * life;
    const cyc = Math.floor((t + ph) / life);
    const age = t + ph - cyc * life;
    const u = age / life;
    const h = hash1(i * 7 + cyc * 31, sd);
    const x = o.x + drift * u * u + (h - 0.5) * 16 * u + 10 * u * fbm(t * 0.3 + i, sd + 2);
    const y = o.y - H * (1 - Math.pow(1 - u, 1.6));
    const r = sc * (r0 + (r1 - r0) * Math.sqrt(u)) * (0.8 + 0.4 * h);
    c.globalAlpha = I * smoothstep(0, 0.12, u) * (1 - smoothstep(0.35, 1, u)) * 0.55;
    c.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }
}
export function smoke(c: CanvasRenderingContext2D, o: SmokeOpts, env: PaintEnv): void {
  const kind = o.kind ?? 'candle';
  const I = o.intensity ?? 1;
  const lit = o.color ?? mixLab(env.mood.haze, env.mood.rim, 0.7);
  c.save();
  switch (kind) {
    case 'candle':
      ribbon(c, o, env, o.height ?? 170, 0, lit, I * 0.85);
      ribbon(c, o, env, (o.height ?? 170) * 0.7, 2, lit, I * 0.35);
      break;
    case 'pipe':
      ribbon(c, o, env, o.height ?? 140, 0, lit, I * 0.6);
      ribbon(c, o, env, (o.height ?? 140) * 0.8, 1, lit, I * 0.4);
      puffs(c, { ...o, y: o.y - 20 }, env, (o.height ?? 140) * 1.3, 5, 6, 6, 30, lit, I * 0.35);
      break;
    case 'steam':
      puffs(c, o, env, o.height ?? 120, 9, 2.2, 5, 26, o.color ?? mixLab(env.mood.haze, env.mood.core, 0.45), I * 0.7);
      break;
    case 'chimney':
      puffs(c, { ...o, drift: o.drift ?? 120 }, env, o.height ?? 260, 22, 8, 16, 80, o.color ?? mixLab(env.mood.set, env.mood.haze, 0.45), I);
      break;
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// drifting paper sheets
// ---------------------------------------------------------------------------
export interface PaperSheetOpts {
  area?: Rect;
  count?: number;
  /** sheet width in stage px at mid depth (default 34) */
  size?: number;
  wind?: number;
  fall?: number;
  /** 'ink' = backlit silhouettes with cut text lines; 'lit' = pale paper catching the light */
  tone?: 'ink' | 'lit';
  fill?: string;
  salt?: number;
}
export function paperSheets(c: CanvasRenderingContext2D, o: PaperSheetOpts, env: PaintEnv): void {
  const a = o.area ?? DEFAULT_AREA;
  const n = o.count ?? 12;
  const sd = env.seed * 47 + (o.salt ?? 9);
  const list = motes(n, sd, a);
  const t = env.tq; // cut paper moves on twos
  const wind = o.wind ?? 36;
  const fall = o.fall ?? 30;
  const S = o.size ?? 34;
  const tone = o.tone ?? 'ink';
  const fillCol = o.fill ?? (tone === 'ink' ? env.fill('ink') : mixLab(env.mood.haze, env.mood.rim, 0.65));
  const lineCol = tone === 'ink' ? withAlpha(env.mood.rim, 0.32) : withAlpha(env.mood.ink, 0.35);
  c.save();
  for (let i = 0; i < n; i++) {
    const m = list[i];
    const sp = 0.6 + 0.8 * m.z;
    const x = wrap(m.x + wind * sp * t + 40 * Math.sin(t * 0.55 + m.ph), a.x - S, a.w + 2 * S);
    const y = wrap(m.y + fall * sp * t + 22 * Math.sin(t * 1.05 + m.ph * 1.7), a.y - S, a.h + 2 * S);
    const rot = m.ph + 0.7 * Math.sin(t * 0.8 + m.ph) + 0.25 * t * (m.w - 1.4);
    const flip = Math.cos(t * (0.9 + m.w * 0.5) + m.ph * 3);
    const fx = Math.sign(flip || 1) * Math.max(0.1, Math.abs(flip));
    const w = S * sp;
    const h = w * 1.29;
    const bend = 0.18 * w * Math.sin(t * 1.7 + m.ph);
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(fx, 1);
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.quadraticCurveTo(0, -h / 2 + bend * 0.4, w / 2, -h / 2);
    c.quadraticCurveTo(w / 2 + bend * 0.3, 0, w / 2, h / 2);
    c.quadraticCurveTo(0, h / 2 + bend, -w / 2, h / 2);
    c.quadraticCurveTo(-w / 2 + bend * 0.3, 0, -w / 2, -h / 2);
    c.fillStyle = fillCol;
    c.fill();
    if (flip > 0 && w > 18) {
      // lines of text, cut as hairlines
      c.strokeStyle = lineCol;
      c.lineWidth = Math.max(0.5, w / 60);
      c.beginPath();
      const rows = 7;
      for (let r = 0; r < rows; r++) {
        const yy = -h / 2 + h * (0.17 + (r / rows) * 0.72);
        const ll = r === rows - 1 ? 0.45 : 0.78 - 0.1 * hash1(r + i * 9, sd);
        const bow = (bend * (yy + h / 2)) / h;
        c.moveTo(-w * 0.38, yy + bow * 0.5);
        c.quadraticCurveTo(0, yy + bow, -w * 0.38 + w * ll, yy + bow * 0.5);
      }
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// rolling fog bank
// ---------------------------------------------------------------------------
export interface FogBankOpts {
  /** densest line of the bank (world y) */
  y: number;
  /** billow height above y (default 150) */
  height?: number;
  /** drift px/s of the front layer (default 10); back layers slower */
  speed?: number;
  /** peak alpha (default 0.55) */
  density?: number;
  layers?: number;
  color?: string;
  /** horizontal span (default -40..1320); billows tile with this period */
  x0?: number;
  x1?: number;
  /** extra edge softness in px at 1080p (default 14) */
  softness?: number;
  salt?: number;
}
interface BakedFog {
  cv: HTMLCanvasElement;
  P: number;
  top: number;
  h: number;
}
const fogCache = new Map<string, BakedFog>();
function bakeFog(o: FogBankOpts, k: number, color: string, scale: number, sd: number): BakedFog {
  const x0 = o.x0 ?? -40;
  const x1 = o.x1 ?? 1320;
  const P = x1 - x0;
  const H = o.height ?? 150;
  const soft = (o.softness ?? 14) / 1.5;
  const key = `${P}|${H}|${color}|${scale.toFixed(2)}|${k}|${sd}|${soft}`;
  let b = fogCache.get(key);
  if (b) return b;
  const top = -H * 1.25;
  const bottom = H * 0.7;
  const hh = bottom - top;
  const res = scale * 0.5;
  const cv = makeCanvas(P * res, hh * res);
  const g = cv.getContext('2d')!;
  g.setTransform(res, 0, 0, res, 0, -top * res);
  g.filter = `blur(${(soft * res * (1 + k * 0.6)).toFixed(2)}px)`;
  const grad = g.createLinearGradient(0, -H, 0, bottom);
  grad.addColorStop(0, withAlpha(color, 0.0));
  grad.addColorStop(0.3, withAlpha(color, 0.55));
  grad.addColorStop(0.62, withAlpha(color, 1));
  grad.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grad;
  g.beginPath();
  // billows: overlapping discs along a periodic crest, drawn at -P, 0, +P to tile seamlessly
  const nB = Math.round(P / 70);
  for (let rep = -1; rep <= 1; rep++) {
    for (let i = 0; i < nB; i++) {
      const cx = (i / nB) * P + hash1(i, sd + k) * 40 + rep * P;
      const r = H * (0.28 + 0.38 * hash1(i + 77, sd + k));
      const cy = -H * 0.35 * hash1(i + 33, sd + k) + r * 0.25;
      g.moveTo(cx + r, cy);
      g.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  g.rect(-P, 0, P * 3, bottom);
  g.fill('nonzero');
  b = { cv, P, top, h: hh };
  return remember(fogCache, key, b, 24);
}
export function fogBank(c: CanvasRenderingContext2D, o: FogBankOpts, env: PaintEnv): void {
  const scale = devScale(c);
  const layers = o.layers ?? 3;
  const sd = env.seed * 53 + (o.salt ?? 1);
  const x0 = o.x0 ?? -40;
  const v = o.speed ?? 10;
  const D = o.density ?? 0.55;
  const t = env.t;
  c.save();
  for (let k = layers - 1; k >= 0; k--) {
    const col = o.color ?? mixLab(env.mood.haze, env.mood.sky[2], 0.25 + 0.15 * (layers - 1 - k));
    const b = bakeFog(o, k, col, scale, sd);
    const sp = v * (1 - 0.3 * k) * (k % 2 ? 0.8 : 1);
    const off = ((((t * sp + hash1(k, sd) * b.P) % b.P) + b.P) % b.P);
    const breathe = 5 * Math.sin(t * 0.23 + k * 1.9) + k * (o.height ?? 150) * 0.12;
    const yy = o.y + b.top - breathe;
    c.globalAlpha = D * (1 - 0.22 * k);
    c.drawImage(b.cv, x0 + off - b.P, yy, b.P, b.h);
    c.drawImage(b.cv, x0 + off, yy, b.P, b.h);
  }
  c.restore();
}
