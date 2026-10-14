/**
 * Transitions (style bible §9). TransitionFn(out, a, b, u, env): composite already-rendered
 * frames a (outgoing) and b (incoming), u 0 -> 1. `out` is device resolution; a/b are the
 * same size; every function resets `out` to identity itself. Pure in (u, env.seed, env.frame).
 *
 *   TRANSITIONS: Record<TransitionKind, TransitionFn>
 *     cut          hard cut at u = 0.5
 *     crossfade    smootherstep dissolve
 *     iris         feathered iris closes on A to black, holds, opens on B (0.8–1.2 s each way)
 *     inkBleed     B spreads like ink through paper fibres, with a wet ink edge (1.5–2.5 s)
 *     paperWipe    A is torn away along a ragged cut-paper edge, casting a soft shadow on B
 *     fadeBlack    fade through the mood's fg black
 *     lampChange   the lamp dims (warming as it goes) to black, then relights on B with a
 *                  theatre-lamp stutter (1.5 s down, 1.5 s up = 3 s total)
 *   Factories for staged variants (centre on a practical light, choose an origin/direction):
 *     makeIris({ closeAt, openAt, hold, feather })   points in stage px (1280x720)
 *     makeInkBleed({ origin, edge, wet })            origin in stage px
 *     makePaperWipe({ dir: 'right' | 'left', slant })
 *   warmTransitions(w, h, seed) precomputes the ink field (~40 ms once) so no frame stalls.
 * Per-frame cost at 1080p: one or two full-frame copies + a 480x270 mask (ink bleed ≈ 2 ms).
 */
import type { Palette, TransitionFn, TransitionKind } from '../contracts';
import { fbm, fbm2, hash1, makeCanvas, smoothstep, vnoise2 } from './atmosphere';
import { mixLab, withAlpha } from './palette';
import { color } from 'd3';

type Env = Parameters<TransitionFn>[4];
type Pt = { x: number; y: number };

const ease = (u: number) => {
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const easeIn = (u: number) => u * u;
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

const scratchMap = new Map<string, HTMLCanvasElement>();
function scratch(name: string, w: number, h: number): CanvasRenderingContext2D {
  let cv = scratchMap.get(name);
  if (!cv || cv.width !== w || cv.height !== h) {
    cv = makeCanvas(w, h);
    scratchMap.set(name, cv);
  }
  const g = cv.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  return g;
}
function begin(out: CanvasRenderingContext2D) {
  out.save();
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalAlpha = 1;
  out.globalCompositeOperation = 'source-over';
  return { W: out.canvas.width, H: out.canvas.height };
}
function blit(out: CanvasRenderingContext2D, src: CanvasImageSource, W: number, H: number, alpha = 1) {
  out.globalAlpha = alpha;
  out.drawImage(src, 0, 0, W, H);
  out.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
const cut: TransitionFn = (out, a, b, u) => {
  const { W, H } = begin(out);
  blit(out, u < 0.5 ? a : b, W, H);
  out.restore();
};

const crossfade: TransitionFn = (out, a, b, u) => {
  const { W, H } = begin(out);
  blit(out, a, W, H);
  blit(out, b, W, H, ease(u));
  out.restore();
};

const fadeBlack: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = begin(out);
  const firstHalf = u < 0.5;
  blit(out, firstHalf ? a : b, W, H);
  const k = firstHalf ? ease(Math.min(1, u / 0.45)) : 1 - ease(Math.max(0, (u - 0.55) / 0.45));
  out.fillStyle = withAlpha(env.mood.fg, k);
  out.fillRect(0, 0, W, H);
  out.restore();
};

// ---------------------------------------------------------------------------
// iris
// ---------------------------------------------------------------------------
export interface IrisOpts {
  /** where A closes down to (stage px; default frame centre) — e.g. the candle */
  closeAt?: Pt;
  /** where B opens from (stage px; default closeAt) — e.g. B's practical light */
  openAt?: Pt;
  /** fraction of u held in black (default 0.14 ≈ 6–12 frames of a 2–3 s transition) */
  hold?: number;
  /** feather in px at 1080p (default 14) */
  feather?: number;
}
export function makeIris(o: IrisOpts = {}): TransitionFn {
  return (out, a, b, u, env) => {
    const { W, H } = begin(out);
    const s = W / env.W;
    const hold = o.hold ?? 0.14;
    const u1 = 0.5 - hold / 2;
    const u2 = 0.5 + hold / 2;
    out.fillStyle = env.mood.fg;
    out.fillRect(0, 0, W, H);
    if (u > u1 && u < u2) {
      out.restore();
      return;
    }
    const closing = u <= u1;
    const p = closing ? o.closeAt ?? { x: env.W / 2, y: env.H / 2 } : o.openAt ?? o.closeAt ?? { x: env.W / 2, y: env.H / 2 };
    const cx = p.x * s;
    const cy = p.y * s;
    const rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 4;
    const k = closing ? 1 - easeIn(u / u1) * (2 - u / u1) : ease((u - u2) / (1 - u2)); // decelerate into the point
    const r = rMax * (closing ? Math.max(0, k) : k);
    const fe = (o.feather ?? 14) * (H / 1080);
    if (r <= 0.5) {
      out.restore();
      return;
    }
    const g = scratch('iris', W, H);
    g.drawImage(closing ? a : b, 0, 0, W, H);
    g.globalCompositeOperation = 'destination-in';
    const rg = g.createRadialGradient(cx, cy, Math.max(0, r - fe), cx, cy, r + fe * 0.2);
    rg.addColorStop(0, 'rgba(0,0,0,1)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    out.drawImage(g.canvas, 0, 0);
    out.restore();
  };
}

// ---------------------------------------------------------------------------
// ink bleed
// ---------------------------------------------------------------------------
export interface InkBleedOpts {
  /** where the ink starts (stage px; default left third, just below the horizon) */
  origin?: Pt;
  /** soft edge width in field units (default 0.035) */
  edge?: number;
  /** wet ink edge alpha (default 0.85) */
  wet?: number;
}
interface InkField {
  w: number;
  h: number;
  f: Float32Array;
  max: number;
}
const fieldCache = new Map<string, InkField>();
function inkField(w: number, h: number, seed: number, ox: number, oy: number): InkField {
  const key = `${w}x${h}|${seed}|${ox.toFixed(3)},${oy.toFixed(3)}`;
  let F = fieldCache.get(key);
  if (F) return F;
  const f = new Float32Array(w * h);
  const diag = Math.hypot(w, h);
  let max = 0;
  const S = 480 / w; // noise scale normalised to a 480-wide field
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const X = x * S;
      const Y = y * S;
      const r = Math.hypot(x - ox * w, y - oy * h) / diag;
      // blotchy spread + horizontal paper fibres (stretched noise) + fine tooth
      const n = 0.84 * fbm2(X / 52, Y / 52, seed, 4) + 0.12 * fbm2(X / 12, Y / 4.5, seed + 7, 2) + 0.04 * vnoise2(X / 3, Y / 1.4, seed + 13);
      const v = 1.25 * r + 0.5 * n;
      f[y * w + x] = v;
      if (v > max) max = v;
    }
  }
  F = { w, h, f, max };
  fieldCache.set(key, F);
  if (fieldCache.size > 6) fieldCache.delete(fieldCache.keys().next().value!);
  return F;
}
const rgbCache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let v = rgbCache.get(hex);
  if (!v) {
    const c = color(hex)!.rgb();
    v = [Math.round(c.r), Math.round(c.g), Math.round(c.b)];
    rgbCache.set(hex, v);
  }
  return v;
}
const imgCache = new Map<string, ImageData>();
function imageData(g: CanvasRenderingContext2D, name: string, w: number, h: number): ImageData {
  const k = `${name}|${w}x${h}`;
  let d = imgCache.get(k);
  if (!d) {
    d = g.createImageData(w, h);
    imgCache.set(k, d);
  }
  return d;
}
const DEFAULT_ORIGIN = (env: Env): Pt => ({ x: env.W * 0.32, y: env.H * 0.55 });
export function warmTransitions(w: number, h: number, seed: number, origin?: Pt, stage = { W: 1280, H: 720 }): void {
  const o = origin ?? { x: stage.W * 0.32, y: stage.H * 0.55 };
  inkField(Math.round(w / 4), Math.round(h / 4), seed, o.x / stage.W, o.y / stage.H);
}
export function makeInkBleed(o: InkBleedOpts = {}): TransitionFn {
  return (out, a, b, u, env) => {
    const { W, H } = begin(out);
    const qw = Math.round(W / 4);
    const qh = Math.round(H / 4);
    const org = o.origin ?? DEFAULT_ORIGIN(env);
    const F = inkField(qw, qh, env.seed, org.x / env.W, org.y / env.H);
    const e = (o.edge ?? 0.035) * F.max;
    const wetA = o.wet ?? 0.85;
    // ease so the bleed starts as a drop, speeds up, and settles into the corners
    const uu = u < 0 ? 0 : u > 1 ? 1 : u;
    const th = (-0.02 + 1.08 * (0.45 * uu + 0.55 * (1 - (1 - uu) * (1 - uu)))) * (F.max + e);
    blit(out, a, W, H);
    if (u <= 0) {
      out.restore();
      return;
    }
    const mg = scratch('inkMask', qw, qh);
    const wg = scratch('inkWet', qw, qh);
    const md = imageData(mg, 'm', qw, qh);
    const wd = imageData(wg, 'w', qw, qh);
    const M = md.data;
    const Wd = wd.data;
    const [ir, ig, ib] = rgb(env.mood.ink);
    const [dr, dg, db] = rgb(env.mood.haze);
    const f = F.f;
    const band = 0.011 * F.max;
    const damp = 0.07 * F.max;
    const fade = u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1; // the wet edge dries off-frame at the end
    for (let i = 0, p = 0; i < f.length; i++, p += 4) {
      const v = f[i];
      const d = v - th;
      // reveal mask (1 = show B)
      const m = d <= -e ? 1 : d >= e ? 0 : 0.5 - (0.5 * d) / e;
      M[p + 3] = (m * 255) | 0;
      // wet ink edge sits just inside the front; damp tint just ahead of it
      const wb = Math.exp(-((d + e * 0.4) * (d + e * 0.4)) / (band * band));
      const da = d > 0 && d < damp ? (1 - d / damp) * 0.16 : 0;
      const wa = wb * wetA * fade;
      if (wa >= da) {
        Wd[p] = ir;
        Wd[p + 1] = ig;
        Wd[p + 2] = ib;
        Wd[p + 3] = (wa * 255) | 0;
      } else {
        Wd[p] = dr;
        Wd[p + 1] = dg;
        Wd[p + 2] = db;
        Wd[p + 3] = (da * fade * 255) | 0;
      }
    }
    mg.putImageData(md, 0, 0);
    wg.putImageData(wd, 0, 0);
    const bg = scratch('inkB', W, H);
    bg.drawImage(b, 0, 0, W, H);
    bg.globalCompositeOperation = 'destination-in';
    bg.imageSmoothingEnabled = true;
    bg.imageSmoothingQuality = 'high';
    bg.drawImage(mg.canvas, 0, 0, W, H);
    out.drawImage(bg.canvas, 0, 0);
    out.imageSmoothingEnabled = true;
    out.imageSmoothingQuality = 'high';
    out.drawImage(wg.canvas, 0, 0, W, H);
    out.restore();
  };
}

// ---------------------------------------------------------------------------
// paper wipe (torn edge)
// ---------------------------------------------------------------------------
export interface PaperWipeOpts {
  /** direction the tear travels (default 'right': B appears from the left) */
  dir?: 'right' | 'left';
  /** horizontal lean of the tear across the frame height, stage px (default 90) */
  slant?: number;
  /** colour of the torn paper core (default: warm paper white) */
  paper?: string;
}
const tearCache = new Map<number, Float32Array>();
/** ragged profile sampled every 2 stage px down the frame: large wander + jagged fibres */
function tearProfile(seed: number): Float32Array {
  let p = tearCache.get(seed);
  if (p) return p;
  const N = 361;
  p = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const y = i * 2;
    const tooth = (hash1(i, seed + 5) - 0.5) * 3.2;
    p[i * 2] = 26 * fbm(y / 140, seed, 3) + 9 * fbm(y / 22, seed + 2, 2) + tooth;
    // width of the exposed fibre band (white torn core), 1.5–7 px
    p[i * 2 + 1] = 1.5 + 5.5 * Math.pow(0.5 + 0.5 * fbm(y / 30, seed + 9, 2), 1.4) + Math.abs(tooth) * 0.6;
  }
  tearCache.set(seed, p);
  return p;
}
export function makePaperWipe(o: PaperWipeOpts = {}): TransitionFn {
  return (out, a, b, u, env) => {
    const { W, H } = begin(out);
    const s = W / env.W;
    const dir = o.dir ?? 'right';
    const prof = tearProfile(env.seed);
    const slant = o.slant ?? 90;
    const margin = 80 + Math.abs(slant);
    const X = -margin + (env.W + 2 * margin) * ease(u);
    const N = prof.length / 2;
    // edge x (stage) at sample i; 'left' mirrors the travel
    const ex = (i: number) => {
      const y = i * 2;
      const x = X + prof[i * 2] + slant * (y / env.H - 0.5);
      return dir === 'right' ? x : env.W - x;
    };
    const sign = dir === 'right' ? 1 : -1;
    blit(out, b, W, H);
    // soft shadow of the lifted sheet A, falling on B behind the edge
    const sw = 34;
    out.beginPath();
    for (let i = 0; i < N; i++) out.lineTo(ex(i) * s, i * 2 * s);
    for (let i = N - 1; i >= 0; i--) out.lineTo((ex(i) - sign * sw) * s, i * 2 * s);
    out.closePath();
    const bx = (dir === 'right' ? X : env.W - X) * s;
    const sg = out.createLinearGradient(bx - sign * sw * s, 0, bx + sign * 6 * s, 0);
    sg.addColorStop(0, withAlpha(env.mood.ink, 0));
    sg.addColorStop(1, withAlpha(env.mood.ink, 0.55));
    out.fillStyle = sg;
    out.fill();
    // sheet A, clipped to the far side of the tear
    const far = dir === 'right' ? W + 4 : -4;
    const region = new Path2D();
    region.moveTo(far, -4);
    for (let i = 0; i < N; i++) region.lineTo(ex(i) * s, i * 2 * s);
    region.lineTo(far, H + 4);
    region.closePath();
    out.save();
    out.clip(region);
    blit(out, a, W, H);
    // the torn paper core: a ragged pale band on A's side of the edge
    const paper = o.paper ?? mixLab('#efe3cf', env.mood.rim, 0.25);
    out.beginPath();
    for (let i = 0; i < N; i++) out.lineTo(ex(i) * s, i * 2 * s);
    for (let i = N - 1; i >= 0; i--) out.lineTo((ex(i) + sign * prof[i * 2 + 1]) * s, i * 2 * s);
    out.closePath();
    out.fillStyle = paper;
    out.globalAlpha = 0.92;
    out.fill();
    out.restore(); // unclip
    // fibre wisps poking out of the torn core over B
    out.strokeStyle = withAlpha(paper, 0.55);
    out.lineWidth = 0.6 * s;
    out.beginPath();
    for (let i = 0; i < N; i += 3) {
      if (hash1(i, env.seed + 31) < 0.55) continue;
      const x = ex(i) * s;
      const y = i * 2 * s;
      const L = (2 + hash1(i, env.seed + 32) * 5) * s;
      out.moveTo(x, y);
      out.lineTo(x - sign * L, y + (hash1(i, env.seed + 33) - 0.5) * L);
    }
    out.stroke();
    out.restore();
  };
}

// ---------------------------------------------------------------------------
// lamp change
// ---------------------------------------------------------------------------
function lampTint(mood: Palette, k: number): string {
  // k: 1 = full light, 0 = dark. Tungsten dims warm: white -> amber -> fg black
  const warm = mixLab('#ffffff', mood.halo, 0.55);
  if (k >= 0.5) return mixLab(warm, '#ffffff', (k - 0.5) * 2);
  return mixLab(mood.fg, warm, Math.pow(k * 2, 1.3));
}
const lampChange: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = begin(out);
  let k: number;
  let src: CanvasImageSource;
  if (u < 0.5) {
    src = a;
    k = 1 - easeOut(Math.min(1, u / 0.47)); // dimmer pulled down
  } else {
    src = b;
    const v = Math.max(0, (u - 0.53) / 0.47);
    k = easeIn(v) * (2 - v) * 0.5 + 0.5 * ease(v);
    // relight stutter: two brief dips as the filament catches
    const dip1 = Math.exp(-(((v - 0.18) / 0.03) ** 2)) * 0.35;
    const dip2 = Math.exp(-(((v - 0.31) / 0.025) ** 2)) * 0.18;
    k = Math.max(0, k * (1 - dip1 - dip2 * (0.6 + 0.4 * hash1(env.seed, 3))));
  }
  blit(out, src, W, H);
  if (k < 0.999) {
    out.globalCompositeOperation = 'multiply';
    out.fillStyle = lampTint(env.mood, k);
    out.fillRect(0, 0, W, H);
  }
  out.restore();
};

// ---------------------------------------------------------------------------
export const iris: TransitionFn = makeIris();
export const inkBleed: TransitionFn = makeInkBleed();
export const paperWipe: TransitionFn = makePaperWipe();

export const TRANSITIONS: Record<Exclude<TransitionKind, 'blur' | 'whip'>, TransitionFn> = {
  cut,
  crossfade,
  iris,
  inkBleed,
  paperWipe,
  fadeBlack,
  lampChange,
};

/** suggested durations (seconds) per kind, from the style bible */
export const TRANSITION_DUR: Record<Exclude<TransitionKind, 'blur' | 'whip'>, number> = {
  cut: 0,
  crossfade: 1.2,
  iris: 2.2,
  inkBleed: 2,
  paperWipe: 1.1,
  fadeBlack: 1.6,
  lampChange: 3,
};
