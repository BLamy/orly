/**
 * Metaphor kit: the shared drawing vocabulary of the teaching machines.
 * Everything is pure (a function of its params); static art is cached as
 * Path2D / offscreen bitmaps keyed by size.
 *
 *   paperLantern(c, {x, y, r, act, threshold?, hang?, tassel?, flare?}, env)
 *       a hanging paper lantern; paper glow + additive halo <- act (0..1)
 *   thread(c, {x0,y0,x1,y1, w, sag?, color, alpha?, draw?}, env)
 *       a loom string (quadratic sag); `draw` 0..1 draws it from (x0,y0)
 *   threadPoint(o, u) -> {x,y}        point at u along a thread (for knots/pulses)
 *   knot(c, x, y, r, k, env)          a glowing knot / pulse of light (k = intensity)
 *   practicalGlow(c, x, y, k, env, s?) the bible's three-gradient practical light, scaled by s
 *   candle(c, x, y, env, {h?, seed?, k?})  brass candlestick standing at (x,y) with a flickering lit flame
 *   flick(t, seed)                    deterministic 1±7% flicker from quantised time
 *   glow(c, x, y, r, color, alpha)    one additive radial gradient
 *   weightColor(mood, w)              + warm rim, - cool rim (style bible §6)
 *   weightWidth(w, wMax)              0.8..6 px (stage) by |w|
 *   parchmentPlate(c, {x,y,w,h,seed?,ornament?}, env)  cached deckled plate, ink rules
 *   label(c, text, x, y, {size, font, color, align, alpha, tracking, baseline, shadow})
 *   MFONT / METAPHOR_FONTS / ensureFilmFonts()  fonts used by the machines
 *   math: clamp01, lerp, ramp, smooth, sigmoid, softmax(xs, temp), memo
 */
import { color as d3color, hcl } from 'd3';
import type { Palette, PaintEnv } from '../../contracts';
import { MOODS, mixLab, withAlpha } from '../palette';

// ---------------------------------------------------------------------------
// math
// ---------------------------------------------------------------------------
export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0..1 as x goes a -> b (clamped). */
export const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
/** smoothstep on 0..1 */
export const smooth = (u: number) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
/** Real softmax with temperature (numerically stable). */
export function softmax(xs: number[], temp = 1): number[] {
  const T = Math.max(1e-6, temp);
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp((x - m) / T));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
/** Memoize a function by a string key. */
export function memo<A extends unknown[], R>(key: (...a: A) => string, fn: (...a: A) => R): (...a: A) => R {
  const cache = new Map<string, R>();
  return (...a: A) => {
    const k = key(...a);
    let v = cache.get(k);
    if (v === undefined) {
      v = fn(...a);
      cache.set(k, v);
    }
    return v;
  };
}

// ---------------------------------------------------------------------------
// fonts
// ---------------------------------------------------------------------------
export const MFONT = {
  serif: '"EB Garamond", Georgia, serif',
  sc: '"Cormorant SC", "EB Garamond", Georgia, serif',
  display: '"Cormorant Garamond", Georgia, serif',
  fell: '"IM Fell English", "EB Garamond", Georgia, serif',
  mono: '"IBM Plex Mono", Menlo, monospace',
  type: '"Special Elite", "Courier New", monospace',
};
/** Font specs to preload (document.fonts.load) before painting machines. */
export const METAPHOR_FONTS = [
  '400 24px "EB Garamond"',
  '500 24px "EB Garamond"',
  'italic 400 24px "EB Garamond"',
  '500 24px "Cormorant SC"',
  '600 24px "Cormorant SC"',
  '600 24px "Cormorant Garamond"',
  '400 24px "IM Fell English"',
  '400 24px "Special Elite"',
];
/** Galleries/tests: inject the self-hosted Google font CSS once and wait for the metaphor fonts. */
export async function ensureFilmFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('link[data-film-fonts]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/fonts/film/fonts.css';
    l.dataset.filmFonts = '1';
    const done = new Promise<void>((r) => {
      l.onload = () => r();
      l.onerror = () => r();
    });
    document.head.appendChild(l);
    await done;
  }
  await Promise.all(METAPHOR_FONTS.map((s) => document.fonts.load(s).catch(() => [])));
}

export interface LabelOpts {
  size?: number;
  font?: string;
  weight?: number | string;
  italic?: boolean;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
  /** letter spacing in px */
  tracking?: number;
  /** a soft dark halo behind the glyphs (colour) so type reads over bright glass */
  shadow?: string;
}
/** Set a line of type (stage px). Minimum legible size at 1080p is 17.5 stage px. */
export function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, o: LabelOpts = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${o.size ?? 20}px ${o.font ?? MFONT.serif}`;
  c.fillStyle = o.color ?? '#000';
  c.textAlign = o.align ?? 'left';
  c.textBaseline = o.baseline ?? 'alphabetic';
  if (o.tracking) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${o.tracking}px`;
  if (o.shadow) {
    c.shadowColor = o.shadow;
    c.shadowBlur = (o.size ?? 20) * 0.45;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.shadowColor = 'transparent';
  }
  c.fillText(text, x, y);
  c.restore();
}

// ---------------------------------------------------------------------------
// colour
// ---------------------------------------------------------------------------
/** Warm rim for positive weights, cool rim for negative (style bible §6 "strings on a loom"). */
export function weightColor(m: Palette, w: number): string {
  return w >= 0 ? mixLab(m.rim, MOODS.candleAmber.rim, 0.55) : mixLab(m.rim, MOODS.winterBlue.rim, 0.85);
}
/** String thickness (stage px) for |w| relative to wMax: 0.55..4 stage px (= 0.8..6 px at 1080p). */
export function weightWidth(w: number, wMax: number): number {
  return 0.55 + 3.45 * Math.min(1, Math.abs(w) / Math.max(1e-6, wMax));
}
/** n distinct, low-chroma hues that sit at the rim's lightness (multi-head threads). */
export function headHues(m: Palette, n: number): string[] {
  const base = hcl(m.rim);
  const out: string[] = [];
  const spread = [0, 150, 245, 60, 300, 105, 200, 20];
  for (let i = 0; i < n; i++) {
    const h = hcl((base.h || 40) + spread[i % spread.length], Math.max(26, base.c * 1.1), base.l);
    let col = d3color(h.toString());
    if (!col || !col.displayable()) col = d3color(hcl(h.h, h.c * 0.7, h.l).toString());
    out.push(col ? col.formatHex() : m.rim);
  }
  return out;
}

// ---------------------------------------------------------------------------
// light
// ---------------------------------------------------------------------------
/** One additive radial glow. */
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, alpha: number): void {
  if (alpha <= 0.002 || r <= 0.5) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, alpha));
  g.addColorStop(0.35, withAlpha(col, alpha * 0.45));
  g.addColorStop(1, withAlpha(col, 0));
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = op;
}
/** Style-bible practical light (room 260 / halo 70 / core 22 at s = 1), intensity k. */
export function practicalGlow(c: CanvasRenderingContext2D, x: number, y: number, k: number, env: PaintEnv, s = 1): void {
  if (k <= 0.002) return;
  const m = env.mood;
  glow(c, x, y, 260 * s, m.halo, 0.16 * k);
  glow(c, x, y, 70 * s, m.halo, 0.35 * k);
  glow(c, x, y, 22 * s, m.core, 0.75 * k);
}
/** Deterministic flicker 1 ± ~7% from quantised time (bible §2.5); one seed per light. */
export function flick(t: number, seed: number): number {
  const tq = Math.floor(t * 24) / 24;
  const s = seed * 12.9898;
  return 1 + 0.045 * Math.sin(tq * 9.1 + s) + 0.03 * Math.sin(tq * 23.7 + s * 2.3) + 0.015 * Math.sin(tq * 51.3 + s * 0.7);
}
/**
 * A candle in a turned brass stick, standing on a surface at (x, y). h = candle height
 * (default 26). Flame sways and flickers deterministically from env.t; k scales the light.
 * Draws its own practical glow (the shot's one motivated accent).
 */
export function candle(c: CanvasRenderingContext2D, x: number, y: number, env: PaintEnv, o: { h?: number; seed?: number; k?: number } = {}): void {
  const h = o.h ?? 26;
  const seed = o.seed ?? 1;
  const k = (o.k ?? 1) * flick(env.t, seed);
  const m = env.mood;
  const ink = env.fill('ink');
  const s = h / 26;
  c.save();
  c.fillStyle = ink;
  // turned stick: foot, knop, drip pan
  c.beginPath();
  c.ellipse(x, y - 2 * s, 13 * s, 3.2 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 4 * s, y - 3 * s);
  c.quadraticCurveTo(x - 1.5 * s, y - 9 * s, x - 3.5 * s, y - 12 * s);
  c.arc(x, y - 13.5 * s, 3.6 * s, Math.PI * 0.8, Math.PI * 2.2);
  c.quadraticCurveTo(x + 1.5 * s, y - 9 * s, x + 4 * s, y - 3 * s);
  c.closePath();
  c.fill();
  c.fillRect(x - 2 * s, y - 20 * s, 4 * s, 6 * s);
  c.beginPath();
  c.ellipse(x, y - 20 * s, 8 * s, 2 * s, 0, 0, Math.PI * 2);
  c.fill();
  // the candle (pale wax catches a little light)
  c.fillStyle = mixLab(m.halo, ink, 0.55);
  c.fillRect(x - 3 * s, y - 20 * s - h, 6 * s, h);
  c.fillStyle = withAlpha(m.core, 0.25);
  c.fillRect(x - 3 * s, y - 20 * s - h, 1.4 * s, h);
  // wick + flame
  const fy = y - 20 * s - h;
  const tq = Math.floor(env.t * 12) / 12;
  const sway = 1.2 * s * Math.sin(tq * 3.1 + seed * 4.1);
  c.strokeStyle = ink;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x, fy);
  c.lineTo(x, fy - 3 * s);
  c.stroke();
  const fh = 15 * s * (0.92 + 0.08 * k);
  const fl = (sc: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + sway, fy - 2 * s - fh * sc);
    c.bezierCurveTo(x + 4.6 * s * sc, fy - fh * 0.45 * sc, x + 3.6 * s * sc, fy + 1 * s, x, fy + 1 * s);
    c.bezierCurveTo(x - 3.6 * s * sc, fy + 1 * s, x - 4.6 * s * sc, fy - fh * 0.45 * sc, x + sway, fy - 2 * s - fh * sc);
    c.fill();
  };
  fl(1, mixLab(m.halo, m.core, 0.6));
  fl(0.55, m.core);
  c.restore();
  practicalGlow(c, x + sway * 0.5, fy - fh * 0.45, k, env, 0.9 * s);
}
/** A pulse of light travelling along a thread (knot). */
export function knot(c: CanvasRenderingContext2D, x: number, y: number, r: number, k: number, env: PaintEnv): void {
  if (k <= 0.002) return;
  glow(c, x, y, r * 4, env.mood.halo, 0.32 * k);
  glow(c, x, y, r * 1.6, env.mood.core, 0.85 * k);
  c.save();
  c.globalAlpha *= Math.min(1, k * 1.2);
  c.fillStyle = env.mood.core;
  c.beginPath();
  c.arc(x, y, r * 0.45, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------
// offscreen bitmap cache
// ---------------------------------------------------------------------------
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
const BITMAPS = new Map<string, AnyCanvas>();
function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}
/**
 * Draw `draw` once into an offscreen bitmap (stage w x h at pxScale, plus pad) and
 * blit it at (x, y) = the bitmap's top-left in stage coords.
 */
export function cachedArt(
  c: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  pxScale: number,
  draw: (g: CanvasRenderingContext2D) => void,
  pad = 0,
): void {
  const s = Math.max(1, pxScale);
  const k = `${key}|${w}|${h}|${s}|${pad}`;
  let cv = BITMAPS.get(k);
  if (!cv) {
    cv = makeCanvas(Math.ceil((w + pad * 2) * s), Math.ceil((h + pad * 2) * s));
    const g = cv.getContext('2d') as CanvasRenderingContext2D;
    g.setTransform(s, 0, 0, s, pad * s, pad * s);
    draw(g);
    if (BITMAPS.size > 160) BITMAPS.delete(BITMAPS.keys().next().value as string);
    BITMAPS.set(k, cv);
  }
  c.drawImage(cv as CanvasImageSource, x - pad, y - pad, w + pad * 2, h + pad * 2);
}

// ---------------------------------------------------------------------------
// paper lantern
// ---------------------------------------------------------------------------
interface LanternGeo {
  body: Path2D;
  ribs: Path2D;
  seams: Path2D;
  caps: Path2D;
  tassel: Path2D;
}
const LANTERN_GEO = new Map<number, LanternGeo>();
function lanternGeo(r: number): LanternGeo {
  const key = Math.round(r * 4) / 4;
  let g = LANTERN_GEO.get(key);
  if (g) return g;
  const a = r * 0.8; // half width
  const b = r; // half height
  const body = new Path2D();
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const ct = Math.cos(th);
    const st = Math.sin(th);
    const x = a * Math.sign(ct) * Math.pow(Math.abs(ct), 0.82);
    const y = b * Math.sign(st) * Math.pow(Math.abs(st), 0.9);
    if (i === 0) body.moveTo(x, y);
    else body.lineTo(x, y);
  }
  body.closePath();
  const halfW = (y: number) => a * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y) / b, 1 / 0.9)), 0.82 / 2) * 1.0;
  // horizontal bamboo ribs (the classic paper-lantern read), slightly bowed
  const ribs = new Path2D();
  const nr = r > 16 ? 7 : 5;
  for (let k = 1; k < nr; k++) {
    const y = -b * 0.86 + (k / nr) * b * 1.72;
    const hw = halfW(y) * 0.985;
    ribs.moveTo(-hw, y);
    ribs.quadraticCurveTo(0, y + r * 0.07, hw, y);
  }
  // meridian seams
  const seams = new Path2D();
  for (const f of [-0.55, 0, 0.55]) {
    seams.moveTo(f * a * 0.55, -b * 0.88);
    seams.bezierCurveTo(f * a * 1.25, -b * 0.3, f * a * 1.25, b * 0.3, f * a * 0.55, b * 0.88);
  }
  // caps: a top crown with a finial ring, a bottom collar
  const caps = new Path2D();
  const cw = a * 0.56;
  const ch = r * 0.2;
  caps.moveTo(-cw, -b * 0.9);
  caps.lineTo(-cw * 0.92, -b * 0.9 - ch);
  caps.quadraticCurveTo(0, -b * 0.9 - ch * 1.6, cw * 0.92, -b * 0.9 - ch);
  caps.lineTo(cw, -b * 0.9);
  caps.closePath();
  caps.moveTo(r * 0.11, -b * 0.9 - ch * 1.35);
  caps.arc(0, -b * 0.9 - ch * 1.35, r * 0.11, 0, Math.PI * 2);
  caps.moveTo(-cw * 0.9, b * 0.88);
  caps.lineTo(cw * 0.9, b * 0.88);
  caps.lineTo(cw * 0.7, b * 0.88 + ch * 0.9);
  caps.lineTo(-cw * 0.7, b * 0.88 + ch * 0.9);
  caps.closePath();
  // tassel: a knot and fanning cords
  const tassel = new Path2D();
  const ty = b * 0.88 + ch * 0.9;
  tassel.moveTo(0, ty);
  tassel.lineTo(0, ty + r * 0.28);
  tassel.moveTo(r * 0.09, ty + r * 0.3);
  tassel.arc(0, ty + r * 0.3, r * 0.09, 0, Math.PI * 2);
  for (let i = -3; i <= 3; i++) {
    tassel.moveTo(i * r * 0.025, ty + r * 0.36);
    tassel.quadraticCurveTo(i * r * 0.05, ty + r * 0.6, i * r * 0.06, ty + r * 0.86);
  }
  g = { body, ribs, seams, caps, tassel };
  LANTERN_GEO.set(key, g);
  return g;
}

export interface LanternOpts {
  x: number;
  y: number;
  /** body half-height in stage px (≈ 14–60) */
  r: number;
  /** activation 0..1 -> paper glow and halo */
  act: number;
  /** extra emphasis 0..1 (a firing flare, a selected query) */
  flare?: number;
  /** if set (0..1), a cut-line threshold ring at that height; paper stays dark below it */
  threshold?: number;
  /** length of the hanging cord above the crown (0 = standing lantern) */
  hang?: number;
  tassel?: boolean;
  /** 0..1 fade the whole lantern in */
  alpha?: number;
  /** glow scale multiplier (default 1) */
  halo?: number;
}
/** A hanging paper lantern: ink frame, paper that glows from within, additive halo. */
export function paperLantern(c: CanvasRenderingContext2D, o: LanternOpts, env: PaintEnv): void {
  const al = o.alpha ?? 1;
  if (al <= 0.003) return;
  const m = env.mood;
  const r = o.r;
  const g = lanternGeo(r);
  const act = clamp01(o.act);
  const fl = clamp01(o.flare ?? 0);
  const ink = env.fill('ink');
  c.save();
  c.globalAlpha *= al;
  c.translate(o.x, o.y);
  // outer halo first (behind the frame) so the frame silhouettes against its own light
  const k = act * (1 + 0.6 * fl);
  if (k > 0.01) {
    const hs = (o.halo ?? 1) * (r / 26);
    glow(c, 0, 0, 230 * hs, m.halo, 0.12 * k);
    glow(c, 0, 0, 70 * hs, m.halo, 0.3 * k);
  }
  // cord
  if (o.hang && o.hang > 0) {
    c.strokeStyle = ink;
    c.lineWidth = Math.max(0.8, r * 0.04);
    c.beginPath();
    c.moveTo(0, -r * 1.2);
    c.lineTo(0, -r * 1.2 - o.hang);
    c.stroke();
  }
  // paper: dark when unlit, lit from within by a radial gradient
  const unlit = mixLab(env.fill('set'), m.ink, 0.35);
  c.fillStyle = unlit;
  c.fill(g.body);
  if (act > 0.005) {
    const lit = c.createRadialGradient(0, r * 0.15, 0, 0, 0, r * 1.05);
    lit.addColorStop(0, withAlpha(m.core, Math.min(1, 0.2 + 0.85 * k)));
    lit.addColorStop(0.45, withAlpha(mixLab(m.core, m.halo, 0.55), Math.min(1, 0.95 * k)));
    lit.addColorStop(1, withAlpha(mixLab(m.halo, unlit, 0.35), Math.min(1, 0.9 * k)));
    c.fillStyle = lit;
    c.fill(g.body);
  }
  // ribs & seams: ink over lit paper, faint rim on unlit paper
  c.lineCap = 'round';
  c.strokeStyle = act > 0.15 ? withAlpha(m.ink, 0.55 + 0.3 * act) : withAlpha(m.rim, 0.28);
  c.lineWidth = Math.max(0.6, r * 0.035);
  c.stroke(g.ribs);
  c.strokeStyle = act > 0.15 ? withAlpha(m.ink, 0.28) : withAlpha(m.rim, 0.12);
  c.lineWidth = Math.max(0.5, r * 0.022);
  c.stroke(g.seams);
  // outline of the paper body (a thin ink frame)
  c.strokeStyle = ink;
  c.lineWidth = Math.max(0.8, r * 0.05);
  c.stroke(g.body);
  // caps
  c.fillStyle = ink;
  c.fill(g.caps);
  if (o.tassel !== false) {
    c.strokeStyle = ink;
    c.lineWidth = Math.max(0.6, r * 0.03);
    c.stroke(g.tassel);
  }
  // threshold ring: a rim cut-line around the body at height threshold
  if (o.threshold !== undefined) {
    const y = r * 0.86 - clamp01(o.threshold) * r * 1.72;
    const hw = r * 0.8 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y) / r, 1 / 0.9)), 0.41);
    c.strokeStyle = withAlpha(m.rim, act > 0.5 ? 0.55 : 0.75);
    c.lineWidth = Math.max(0.8, r * 0.04);
    c.setLineDash([r * 0.08, r * 0.06]);
    c.beginPath();
    c.moveTo(-hw - r * 0.12, y);
    c.lineTo(hw + r * 0.12, y);
    c.stroke();
    c.setLineDash([]);
  }
  // hot core (the wick), drawn last: light-wrap over the frame
  if (k > 0.01) glow(c, 0, r * 0.18, r * 0.75, m.core, 0.55 * k);
  c.restore();
}

// ---------------------------------------------------------------------------
// threads
// ---------------------------------------------------------------------------
export interface ThreadOpts {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** stroke width, stage px */
  w: number;
  /** downward sag at the middle (stage px). Bible: 40 / (1 + |w|) */
  sag?: number;
  color: string;
  alpha?: number;
  /** 0..1 portion drawn from (x0,y0) */
  draw?: number;
}
export function threadPoint(o: Pick<ThreadOpts, 'x0' | 'y0' | 'x1' | 'y1' | 'sag'>, u: number): { x: number; y: number } {
  const cx = (o.x0 + o.x1) / 2;
  const cy = (o.y0 + o.y1) / 2 + 2 * (o.sag ?? 0);
  const v = 1 - u;
  return { x: v * v * o.x0 + 2 * v * u * cx + u * u * o.x1, y: v * v * o.y0 + 2 * v * u * cy + u * u * o.y1 };
}
/** A taut or sagging string between two points. */
export function thread(c: CanvasRenderingContext2D, o: ThreadOpts, env: PaintEnv): void {
  const d = clamp01(o.draw ?? 1);
  const a = o.alpha ?? 1;
  if (d <= 0.001 || a <= 0.003) return;
  const cx = (o.x0 + o.x1) / 2;
  const cy = (o.y0 + o.y1) / 2 + 2 * (o.sag ?? 0);
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = o.color;
  c.lineWidth = o.w;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(o.x0, o.y0);
  if (d >= 0.999) c.quadraticCurveTo(cx, cy, o.x1, o.y1);
  else {
    // de Casteljau split at d
    const qx = lerp(o.x0, cx, d);
    const qy = lerp(o.y0, cy, d);
    const p = threadPoint(o, d);
    c.quadraticCurveTo(qx, qy, p.x, p.y);
  }
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------------------
// parchment plate
// ---------------------------------------------------------------------------
export interface PlateOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  /** corner fleurons and a double rule (default true) */
  ornament?: boolean;
  /** 0..1 fade */
  alpha?: number;
}
/** The parchment palette (ink on paper) for drawing on plates. */
export const PARCH = MOODS.parchment;
function noise1(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function drawPlate(g: CanvasRenderingContext2D, w: number, h: number, seed: number, ornament: boolean) {
  const rnd = noise1(seed * 7919 + 13);
  const P = PARCH;
  // deckled edge
  const edge = new Path2D();
  const pts: [number, number][] = [];
  const step = 9;
  const jag = () => (rnd() - 0.5) * 2.4;
  for (let x = 0; x <= w; x += step) pts.push([x, jag()]);
  for (let y = 0; y <= h; y += step) pts.push([w + jag(), y]);
  for (let x = w; x >= 0; x -= step) pts.push([x, h + jag()]);
  for (let y = h; y >= 0; y -= step) pts.push([jag(), y]);
  pts.forEach(([x, y], i) => (i ? edge.lineTo(x, y) : edge.moveTo(x, y)));
  edge.closePath();
  // soft lift shadow (paper card)
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.45)';
  g.shadowBlur = 14;
  g.shadowOffsetY = 4;
  g.fillStyle = P.sky[1];
  g.fill(edge);
  g.restore();
  g.save();
  g.clip(edge);
  // paper body: warm centre, foxed edges
  const body = g.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.62);
  body.addColorStop(0, P.haze);
  body.addColorStop(0.6, P.sky[0]);
  body.addColorStop(1, P.sky[3]);
  g.fillStyle = body;
  g.fillRect(-4, -4, w + 8, h + 8);
  // fibres
  const nf = Math.round((w * h) / 260);
  for (let i = 0; i < nf; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const L = 3 + rnd() * 9;
    const a = rnd() * Math.PI;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(255,250,235,0.16)' : 'rgba(90,64,40,0.09)';
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4);
    g.stroke();
  }
  // foxing spots
  for (let i = 0; i < 10; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 6 + rnd() * 26;
    const sp = g.createRadialGradient(x, y, 0, x, y, r);
    sp.addColorStop(0, 'rgba(140,100,55,0.10)');
    sp.addColorStop(1, 'rgba(140,100,55,0)');
    g.fillStyle = sp;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
  if (ornament) {
    const ink = P.ink;
    g.strokeStyle = withAlpha(ink, 0.78);
    g.lineWidth = 1.4;
    g.strokeRect(12, 12, w - 24, h - 24);
    g.lineWidth = 0.6;
    g.strokeRect(17, 17, w - 34, h - 34);
    // corner fleurons: a small curl and dot in each corner
    const corner = (cx: number, cy: number, sx: number, sy: number) => {
      g.save();
      g.translate(cx, cy);
      g.scale(sx, sy);
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(0, 16);
      g.bezierCurveTo(0, 4, 4, 0, 16, 0);
      g.moveTo(5, 18);
      g.bezierCurveTo(6, 10, 10, 6, 18, 5);
      g.stroke();
      g.fillStyle = withAlpha(ink, 0.8);
      g.beginPath();
      g.arc(7.5, 7.5, 2.1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    corner(22, 22, 1, 1);
    corner(w - 22, 22, -1, 1);
    corner(22, h - 22, 1, -1);
    corner(w - 22, h - 22, -1, -1);
  }
}
/** A deckled parchment plate (cached bitmap). Draw ink diagrams on top using PARCH colours. */
export function parchmentPlate(c: CanvasRenderingContext2D, o: PlateOpts, env: PaintEnv): void {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const w = Math.round(o.w);
  const h = Math.round(o.h);
  const seed = o.seed ?? 1;
  const orn = o.ornament !== false;
  c.save();
  c.globalAlpha *= a;
  cachedArt(c, `plate:${seed}:${orn}`, o.x, o.y, w, h, env.pxScale, (g) => drawPlate(g, w, h, seed, orn), 24);
  c.restore();
}

/** Ink-on-plate helpers (parchment palette). */
export const PLATE_INK = PARCH.ink;
export const PLATE_FAINT = withAlpha(PARCH.ink, 0.35);
