/**
 * Finish pass (style bible §2.5, §8): bloom, film grain, vignette, exposure flicker,
 * dust specks/hairs, optional screen-locked paper. Pure function of (frame, t, seed).
 *
 *   filmFinish(out, env)                      the default FinishFn (bible numbers)
 *   makeFilmFinish({ bloom, grain, vignette, flicker, paper, dust }) -> FinishFn
 *       every option is a MULTIPLIER of the bible default (1 = default, 0 = off), except
 *       paper (screen-locked paper alpha, default 0; parchment plates ≈ 0.25).
 *   env.bloom / env.grain / env.vignette (FinishFn env) also multiply the defaults.
 *
 * `out` is the composed frame at device resolution. Bloom reads `out.canvas` itself; when
 * the finish is drawn on a separate transparent canvas, call bloomPass(sceneCtx, ...) on the
 * scene canvas and pass { bloom: 0 } to the overlay finish. All passes reset to identity.
 *
 * Helpers: bloomPass, grainPass, vignettePass, flickerPass, dustPass, gateWeave(frame, fps, seed)
 * (x ±0.6 / y ±0.8 px @1080p, on twos; core applies it as a plate offset), paperPattern(c),
 * paperTexture(c, rect, { alpha, offset }) for layer-locked paper fibre on L0–L3 (soft-light).
 * Budget: ≈2–4 ms at 1080p (one quarter-res filtered copy, three full-frame fills).
 */
import type { FinishFn, Palette } from '../contracts';
import { mulberry32 } from '../../core';
import { hash1, makeCanvas, vnoise } from './atmosphere';
import { withAlpha } from './palette';

export interface FinishOptions {
  bloom?: number;
  grain?: number;
  vignette?: number;
  /** multiplier of the 1.2% exposure flicker (hard-capped at 2%) */
  flicker?: number;
  /** screen-locked paper fibre alpha (soft-light), default 0 */
  paper?: number;
  /** specks and hairs (default true) */
  dust?: boolean;
}

const BLOOM_A = 0.22;
const GRAIN_A = 0.07;
const VIGNETTE_A = 0.55;
const FLICKER = 0.012;

/** twos tick: 12 Hz regardless of fps */
const tick12 = (frame: number, fps: number) => Math.floor((frame * 12) / fps + 1e-6);

// ---------------------------------------------------------------------------
// bloom
// ---------------------------------------------------------------------------
let bloomCv: HTMLCanvasElement | null = null;
/** quarter-res `brightness(1.5) contrast(2.4) blur(6px)` copy of `src`, screened onto `out` at `alpha`. */
export function bloomPass(out: CanvasRenderingContext2D, src: CanvasImageSource, alpha = BLOOM_A): void {
  if (alpha <= 0) return;
  const W = out.canvas.width;
  const H = out.canvas.height;
  const bw = Math.max(1, Math.round(W / 4));
  const bh = Math.max(1, Math.round(H / 4));
  if (!bloomCv || bloomCv.width !== bw || bloomCv.height !== bh) bloomCv = makeCanvas(bw, bh);
  const b = bloomCv.getContext('2d')!;
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = 'copy';
  b.filter = `brightness(1.5) contrast(2.4) blur(${(6 * (H / 1080)).toFixed(2)}px)`;
  b.drawImage(src, 0, 0, bw, bh);
  b.filter = 'none';
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalCompositeOperation = 'screen';
  out.globalAlpha = alpha;
  out.imageSmoothingEnabled = true;
  out.imageSmoothingQuality = 'high';
  out.drawImage(bloomCv, 0, 0, W, H);
  out.restore();
}

// ---------------------------------------------------------------------------
// grain
// ---------------------------------------------------------------------------
const GRAIN_TILES = 8;
const GRAIN_N = 256;
let grainTiles: HTMLCanvasElement[] | null = null;
function tiles(): HTMLCanvasElement[] {
  if (grainTiles) return grainTiles;
  const rnd = mulberry32(0x6a1e5);
  grainTiles = [];
  for (let k = 0; k < GRAIN_TILES; k++) {
    const cv = makeCanvas(GRAIN_N, GRAIN_N);
    const g = cv.getContext('2d')!;
    const img = g.createImageData(GRAIN_N, GRAIN_N);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const s = rnd() + rnd() + rnd() - 1.5; // ≈ gaussian, σ 0.5
      const v = Math.max(0, Math.min(255, 128 + s * 76));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainTiles.push(cv);
  }
  return grainTiles;
}
const grainPatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern[]>();
/** film grain locked to the screen; changes on twos (12 Hz) — halves encoder entropy */
export function grainPass(out: CanvasRenderingContext2D, frame: number, fps: number, seed: number, alpha = GRAIN_A): void {
  if (alpha <= 0) return;
  let pats = grainPatterns.get(out);
  if (!pats) {
    pats = tiles().map((t) => out.createPattern(t, 'repeat')!);
    grainPatterns.set(out, pats);
  }
  const W = out.canvas.width;
  const H = out.canvas.height;
  const k = tick12(frame, fps);
  const p = pats[Math.floor(hash1(k, seed) * GRAIN_TILES) % GRAIN_TILES];
  const sc = 1.5 * (H / 1080);
  p.setTransform(new DOMMatrix([sc, 0, 0, sc, hash1(k, seed + 1) * GRAIN_N * sc, hash1(k, seed + 2) * GRAIN_N * sc]));
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalCompositeOperation = 'overlay';
  out.globalAlpha = alpha;
  out.fillStyle = p;
  out.fillRect(0, 0, W, H);
  out.restore();
}

// ---------------------------------------------------------------------------
// vignette
// ---------------------------------------------------------------------------
/** elliptical: clear to 0.38H, ink α`strength` at 1.02H (ellipse stretched 0.92·W/H) */
export function vignettePass(out: CanvasRenderingContext2D, ink: string, strength = VIGNETTE_A): void {
  if (strength <= 0) return;
  const W = out.canvas.width;
  const H = out.canvas.height;
  const sx = (0.92 * W) / H;
  out.save();
  out.setTransform(sx, 0, 0, 1, W / 2, H / 2);
  const g = out.createRadialGradient(0, 0, 0.38 * H, 0, 0, 1.02 * H);
  g.addColorStop(0, withAlpha(ink, 0));
  g.addColorStop(0.25, withAlpha(ink, strength * 0.12));
  g.addColorStop(0.55, withAlpha(ink, strength * 0.45));
  g.addColorStop(1, withAlpha(ink, strength));
  out.fillStyle = g;
  out.fillRect(-W / (2 * sx) - 2, -H / 2 - 2, W / sx + 4, H + 4);
  out.restore();
}

// ---------------------------------------------------------------------------
// exposure flicker (≤ 2%)
// ---------------------------------------------------------------------------
export function flickerAmount(frame: number, fps: number, seed: number, amp = FLICKER): number {
  const a = Math.min(0.02, Math.max(0, amp));
  const k = tick12(frame, fps);
  return a * (0.75 * vnoise(k * 0.9, seed + 77) + 0.25 * vnoise(k * 2.7, seed + 78));
}
export function flickerPass(out: CanvasRenderingContext2D, frame: number, fps: number, seed: number, mood: Palette, amp = FLICKER): void {
  const v = flickerAmount(frame, fps, seed, amp);
  if (Math.abs(v) < 1e-4) return;
  const W = out.canvas.width;
  const H = out.canvas.height;
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  if (v < 0) {
    const g = Math.round(255 * (1 + v));
    out.globalCompositeOperation = 'multiply';
    out.fillStyle = `rgb(${g},${g},${g})`;
  } else {
    out.globalCompositeOperation = 'screen';
    out.fillStyle = withAlpha(mood.halo, Math.min(1, v * 1.6));
  }
  out.fillRect(0, 0, W, H);
  out.restore();
}

// ---------------------------------------------------------------------------
// gate weave (applied by core as a plate offset before the finish)
// ---------------------------------------------------------------------------
/** plate offset in px at 1080p (multiply by H/1080 for other sizes); slow drift updated on twos */
export function gateWeave(frame: number, fps: number, seed: number): { x: number; y: number } {
  const k = tick12(frame, fps);
  return { x: 0.6 * vnoise(k * 0.35, seed + 301), y: 0.8 * vnoise(k * 0.35, seed + 302) };
}

// ---------------------------------------------------------------------------
// dust specks & hairs (seeded events, periphery only: never over faces or text)
// ---------------------------------------------------------------------------
export function dustPass(out: CanvasRenderingContext2D, frame: number, fps: number, seed: number, ink: string): void {
  const W = out.canvas.width;
  const H = out.canvas.height;
  const s = H / 1080;
  const speck = hash1(frame, seed + 900) < 1 / (4 * fps);
  const hk = Math.floor(frame / 2);
  const hair = hash1(hk, seed + 901) < 1 / (20 * fps);
  if (!speck && !hair) return;
  const edgePoint = (salt: number) => {
    const side = Math.floor(hash1(salt, seed + 7) * 4);
    const a = hash1(salt, seed + 8);
    const b = hash1(salt, seed + 9) * 0.2;
    switch (side) {
      case 0:
        return [a * W, b * H];
      case 1:
        return [a * W, (1 - b) * H];
      case 2:
        return [b * W, a * H];
      default:
        return [(1 - b) * W, a * H];
    }
  };
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.fillStyle = withAlpha(ink, 0.25);
  out.strokeStyle = withAlpha(ink, 0.25);
  if (speck) {
    const [x, y] = edgePoint(frame * 3);
    const r = (1.5 + hash1(frame, seed + 3) * 3) * s;
    out.beginPath();
    for (let i = 0; i < 4; i++) {
      const dx = (hash1(frame * 4 + i, seed + 4) - 0.5) * r * 1.6;
      const dy = (hash1(frame * 4 + i, seed + 5) - 0.5) * r * 1.6;
      out.moveTo(x + dx + r * 0.6, y + dy);
      out.ellipse(x + dx, y + dy, r * 0.6, r * 0.45, i, 0, Math.PI * 2);
    }
    out.fill();
  }
  if (hair) {
    const [x, y] = edgePoint(hk * 5 + 1);
    const L = (40 + hash1(hk, seed + 6) * 80) * s;
    const a0 = hash1(hk, seed + 10) * Math.PI * 2;
    out.lineWidth = 1.1 * s;
    out.beginPath();
    out.moveTo(x, y);
    out.bezierCurveTo(
      x + Math.cos(a0) * L * 0.4,
      y + Math.sin(a0) * L * 0.4,
      x + Math.cos(a0 + 1.2) * L * 0.7,
      y + Math.sin(a0 + 1.2) * L * 0.7,
      x + Math.cos(a0 + 0.5) * L,
      y + Math.sin(a0 + 0.5) * L,
    );
    out.stroke();
  }
  out.restore();
}

// ---------------------------------------------------------------------------
// paper fibre (layer-locked; also usable screen-locked on plates)
// ---------------------------------------------------------------------------
let paperCv: HTMLCanvasElement | null = null;
/** 512² mid-grey tile: 2600 short seeded fibre strokes ±10% (bible §8) plus faint mottling */
export function paperTile(): HTMLCanvasElement {
  if (paperCv) return paperCv;
  const N = 512;
  paperCv = makeCanvas(N, N);
  const g = paperCv.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, N, N);
  const rnd = mulberry32(0x9a9e7);
  // mottling: big soft blotches
  for (let i = 0; i < 70; i++) {
    const x = rnd() * N;
    const y = rnd() * N;
    const r = 20 + rnd() * 60;
    const v = rnd() < 0.5 ? 255 : 0;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${v},${v},${v},0.05)`);
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * N;
    const y = rnd() * N;
    const a = rnd() * Math.PI;
    const L = 3 + rnd() * 14;
    const v = rnd() < 0.5 ? 255 : 0;
    g.strokeStyle = `rgba(${v},${v},${v},${0.06 + rnd() * 0.1})`;
    g.lineWidth = 0.4 + rnd() * 0.8;
    const dx = Math.cos(a) * L;
    const dy = Math.sin(a) * L;
    for (const ox of [-N, 0, N])
      for (const oy of [-N, 0, N]) {
        if (Math.abs(x + ox - N / 2) > N / 2 + L || Math.abs(y + oy - N / 2) > N / 2 + L) continue;
        g.beginPath();
        g.moveTo(x + ox, y + oy);
        g.quadraticCurveTo(x + ox + dx * 0.5 + dy * 0.15, y + oy + dy * 0.5 - dx * 0.15, x + ox + dx, y + oy + dy);
        g.stroke();
      }
  }
  return paperCv;
}
const paperPatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern>();
export function paperPattern(c: CanvasRenderingContext2D): CanvasPattern {
  let p = paperPatterns.get(c);
  if (!p) {
    p = c.createPattern(paperTile(), 'repeat')!;
    paperPatterns.set(c, p);
  }
  return p;
}
/**
 * Paper fibre over `rect` in the CURRENT transform (call inside a layer so it parallaxes
 * with the cut paper). soft-light, default α 0.35; only on bright layers (L0–L3).
 */
export function paperTexture(c: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, o: { alpha?: number; offset?: { x: number; y: number }; scale?: number } = {}): void {
  const p = paperPattern(c);
  const sc = o.scale ?? 0.66;
  p.setTransform(new DOMMatrix([sc, 0, 0, sc, o.offset?.x ?? 0, o.offset?.y ?? 0]));
  c.save();
  c.globalCompositeOperation = 'soft-light';
  c.globalAlpha = o.alpha ?? 0.35;
  c.fillStyle = p;
  c.fillRect(rect.x, rect.y, rect.w, rect.h);
  c.restore();
}

// ---------------------------------------------------------------------------
// the FinishFn
// ---------------------------------------------------------------------------
const FPS_CHOICES = [12, 24, 25, 30, 48, 60];
/** fps for the finish: env.fps if core passes it (optional), else inferred from frame/t, else 24 */
function finishFps(env: Parameters<FinishFn>[1] & { fps?: number }): number {
  if (env.fps && env.fps > 0) return env.fps;
  if (env.t > 0.5) {
    const g = env.frame / env.t;
    const best = FPS_CHOICES.reduce((a, b) => (Math.abs(b - g) < Math.abs(a - g) ? b : a));
    if (Math.abs(best - g) < 0.6) return best;
  }
  return 24;
}

export function makeFilmFinish(opts: FinishOptions = {}): FinishFn {
  return (out, env) => {
    const parchment = env.mood.id.startsWith('parchment');
    const frame = env.frame;
    const F = finishFps(env);
    const m = (o: number | undefined, e: number | undefined) => (o ?? 1) * (e ?? 1);
    bloomPass(out, out.canvas, BLOOM_A * m(opts.bloom, env.bloom) * (parchment ? 0.4 : 1));
    if (opts.paper && opts.paper > 0) {
      out.save();
      out.setTransform(1, 0, 0, 1, 0, 0);
      paperTexture(out, { x: 0, y: 0, w: out.canvas.width, h: out.canvas.height }, { alpha: opts.paper, scale: out.canvas.height / 1080 });
      out.restore();
    }
    vignettePass(out, env.mood.ink, VIGNETTE_A * m(opts.vignette, env.vignette) * (parchment ? 0.45 : 1));
    flickerPass(out, frame, F, env.seed, env.mood, FLICKER * (opts.flicker ?? 1));
    if (opts.dust !== false) dustPass(out, frame, F, env.seed, env.mood.ink);
    grainPass(out, frame, F, env.seed, (parchment ? 0.05 : GRAIN_A) * m(opts.grain, env.grain));
  };
}

/** The default finish (bible §2.5 / §8 numbers). */
export const filmFinish: FinishFn = makeFilmFinish();
