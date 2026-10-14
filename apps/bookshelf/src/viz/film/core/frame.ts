/**
 * The paint Frame (contracts `Frame`) — what a shot's paint(f, s, scene, ctx) draws with.
 * Order (ARCHITECTURE §5.1):
 *   f.camera(cam); f.setMood(...)                       // first
 *   f.backlight({ sunX })                                // L0 sky ramp + low sun ellipse (bible §2.3)
 *   f.layer('L1', far) · f.layer('L2', wall) · f.fog('A') · f.layer('L3', mid) · f.fog('B')
 *   f.layer('L4', action) · f.rim() · f.practical({...}) · f.layer('L5', near) · f.layer('L6', frame)
 *
 * layer(id, (c, env) => …): c is in LAYER coordinates (rest-screen stage px, see multiplane.ts);
 *   env.fill('set'|'ink'|'fg'|…) gives the layer's hazed colour (bible §2.4) — fill shapes with it,
 *   never paint grey veils. Depth blur: blurred layers (L1 L2 L3 L5 L6) render dynamic drawing into a
 *   scratch buffer blurred once per call (half-res for blur ≥ 3 px); untouched buffers cost nothing.
 *   L4 is always sharp and is also accumulated for rim().
 * cached(key, w, h, draw, {blur?, res?}) → drawAt(c, x, y): static art baked ONCE into a device-res
 *   bitmap with the current layer's depth blur (or opts.blur) and a blur margin; draw it every frame.
 *   Inside a blurred layer, cached bitmaps go straight to the scene (beneath that call's dynamic
 *   drawing) so they are never blurred twice. Change `key` whenever the drawing changes.
 *   res > 1 supersamples art that a push-in will enlarge.
 * fog('A'|'B'|{yCenter,height,alpha,drift}): screen-locked ground-fog sheet with seeded fbm texture,
 *   drifting 4–12 px/s (bible §2.4).
 * practical({x, y, kind, seed, intensity?, radius?, layer?}): additive light at a layer point —
 *   candle (flame + quantised fbm flicker ±7%, tip sway), lamp, screen, led, tube (1-frame dropouts).
 *   radius = inner halo radius in stage px (default 70; outer glow 260, hot core 22 scale with it).
 * rim(dir?): crescent rim on everything drawn into L4 so far; dir = unit vector toward the key light
 *   (default: from frame centre toward the backlight sun).
 *
 * Also exported: createFrame(opts) (the reel calls it), vnoise/fbm (seeded value noise),
 * clearFrameCaches(), frameCacheStats().
 */
import { bakeScope } from './paintContext';
import type { Camera3, Frame, LayerId, LayerSpec, MoodId, PaintEnv, Palette } from '../contracts';
import { CAMERA3_HOME, FILM_H, FILM_W, LAYERS, quantizeTwos } from '../contracts';
import { crossfadeMood, hazed, mixLab, mood as getMood, withAlpha } from '../silhouette/palette';
import { mulberry32 } from '../../core';
import { layerXform, toScreen, type LayerXform } from './multiplane';

// ---------------------------------------------------------------- noise
/** integer hash → [-1, 1] */
export function hash1(i: number, seed: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 2147483647.5 - 1;
}
/** smooth 1-D value noise in [-1, 1] */
export function vnoise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash1(i, seed);
  return a + (hash1(i + 1, seed) - a) * u;
}
/** 1-D fractal noise, roughly [-1, 1] */
export function fbm(x: number, seed: number, octaves = 3): number {
  let s = 0, amp = 0.5, norm = 0, fx = x;
  for (let o = 0; o < octaves; o++) {
    s += amp * vnoise(fx, seed + o * 1013);
    norm += amp;
    amp *= 0.5;
    fx *= 2.03;
  }
  return s / norm;
}

// ---------------------------------------------------------------- canvases
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
}
function ctx2d(cv: HTMLCanvasElement): CanvasRenderingContext2D {
  const c = cv.getContext('2d');
  if (!c) throw new Error('film: no 2d context');
  return c;
}

const pool = new Map<string, CanvasRenderingContext2D>();
/** a reusable scratch canvas (device px), identity transform, default state, NOT cleared */
function scratch(name: string, w: number, h: number): CanvasRenderingContext2D {
  let c = pool.get(name);
  const W = Math.max(1, Math.ceil(w)), H = Math.max(1, Math.ceil(h));
  if (!c) {
    c = ctx2d(makeCanvas(W, H));
    pool.set(name, c);
  } else if (c.canvas.width !== W || c.canvas.height !== H) {
    c.canvas.width = W;
    c.canvas.height = H;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  return c;
}
function clearCtx(c: CanvasRenderingContext2D) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
}

/** Wraps a context so we know whether anything was drawn into it (cheap: bound methods cached). */
const DRAW_OPS = new Set(['fill', 'stroke', 'fillRect', 'strokeRect', 'fillText', 'strokeText', 'drawImage', 'putImageData']);
interface Tracked {
  proxy: CanvasRenderingContext2D;
  dirty: boolean;
}
const trackers = new WeakMap<CanvasRenderingContext2D, Tracked>();
function tracked(c: CanvasRenderingContext2D): Tracked {
  let t = trackers.get(c);
  if (t) {
    t.dirty = false;
    return t;
  }
  const bound = new Map<PropertyKey, unknown>();
  const rec: Tracked = { proxy: c, dirty: false };
  rec.proxy = new Proxy(c, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target) as unknown;
      if (typeof v !== 'function') return v;
      let f = bound.get(prop);
      if (!f) {
        const fn = v as (...a: unknown[]) => unknown;
        f = DRAW_OPS.has(prop as string)
          ? (...a: unknown[]) => {
              rec.dirty = true;
              return fn.apply(target, a);
            }
          : fn.bind(target);
        bound.set(prop, f);
      }
      return f;
    },
    set(target, prop, val) {
      return Reflect.set(target, prop, val, target);
    },
  });
  trackers.set(c, rec);
  return rec;
}

// ---------------------------------------------------------------- bitmap cache (LRU by pixels)
interface CacheEntry {
  cv: HTMLCanvasElement;
  pad: number;
  px: number;
}
const bitmaps = new Map<string, CacheEntry>();
let bitmapPx = 0;
const BITMAP_BUDGET = 72e6; // device pixels (~290 MB)
let cacheMisses = 0;

export function clearFrameCaches(): void {
  bitmaps.clear();
  bitmapPx = 0;
  fogTex.clear();
}
export function frameCacheStats() {
  return { bitmaps: bitmaps.size, megapixels: +(bitmapPx / 1e6).toFixed(1), misses: cacheMisses };
}
/** depth bookkeeping for QA (generator/film/depth.mjs): the camera and the depth (z) of every layer the most
 *  recently created Frame painted. Review round 1: "at least 3 depth planes with parallax on every camera move". */
let depthLog: { cam: Camera3; zs: Set<number>; ids: Set<string> } | null = null;
export function lastFrameDepth(): { cam: Camera3; zs: number[]; ids: string[] } | null {
  return depthLog ? { cam: depthLog.cam, zs: [...depthLog.zs].sort((a, b) => a - b), ids: [...depthLog.ids] } : null;
}

// ---------------------------------------------------------------- fog textures
const FOG_TW = 768;
const FOG_TH = 96;
/** stage-px width one fog tile spans */
const FOG_SPAN = 2048;
const fogMask = new Map<string, HTMLCanvasElement>();
const fogTex = new Map<string, HTMLCanvasElement>();

function noise2Periodic(seed: number, period: number) {
  const g = (ix: number, iy: number) => hash1(((ix % period) + period) % period + iy * 7919, seed) * 0.5 + 0.5;
  return (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = g(ix, iy), b = g(ix + 1, iy), c = g(ix, iy + 1), d = g(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}

/** alpha mask: ground-fog vertical profile × horizontally stretched periodic fbm */
function getFogMask(seed: number): HTMLCanvasElement {
  const key = String(seed);
  let cv = fogMask.get(key);
  if (cv) return cv;
  cv = makeCanvas(FOG_TW, FOG_TH);
  const c = ctx2d(cv);
  const img = c.createImageData(FOG_TW, FOG_TH);
  const octs = [
    { n: noise2Periodic(seed, 6), px: 6, py: 1.6, a: 0.5 },
    { n: noise2Periodic(seed + 11, 13), px: 13, py: 3.2, a: 0.3 },
    { n: noise2Periodic(seed + 23, 29), px: 29, py: 6.5, a: 0.2 },
  ];
  for (let y = 0; y < FOG_TH; y++) {
    const v = y / (FOG_TH - 1);
    // stops 0 → 0, 0.55 → 1, 1 → 0.4 (bible §2.4), smoothed
    const prof = v < 0.55 ? Math.sin((v / 0.55) * Math.PI * 0.5) ** 2 : 1 - 0.6 * ((v - 0.55) / 0.45) ** 1.3;
    for (let x = 0; x < FOG_TW; x++) {
      let n = 0;
      for (const o of octs) n += o.a * o.n((x / FOG_TW) * o.px, v * o.py);
      const dens = Math.min(1, Math.max(0, 0.3 + 1.05 * (n - 0.5) + 0.42));
      const i = (y * FOG_TW + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * prof * dens);
    }
  }
  c.putImageData(img, 0, 0);
  fogMask.set(key, cv);
  return cv;
}
function getFogTex(seed: number, color: string): HTMLCanvasElement {
  const key = `${seed}|${color}`;
  let cv = fogTex.get(key);
  if (cv) {
    fogTex.delete(key);
    fogTex.set(key, cv);
    return cv;
  }
  cv = makeCanvas(FOG_TW, FOG_TH);
  const c = ctx2d(cv);
  c.fillStyle = color;
  c.fillRect(0, 0, FOG_TW, FOG_TH);
  c.globalCompositeOperation = 'destination-in';
  c.drawImage(getFogMask(seed), 0, 0);
  fogTex.set(key, cv);
  while (fogTex.size > 12) fogTex.delete(fogTex.keys().next().value!);
  return cv;
}

// ---------------------------------------------------------------- tube dropouts
const tubeEvents = new Map<number, number[]>();
function tubeDropout(seed: number, t: number, fps: number): boolean {
  let ev = tubeEvents.get(seed);
  if (!ev) {
    ev = [];
    tubeEvents.set(seed, ev);
  }
  if (!ev.length || ev[ev.length - 1] < t + 20) {
    const rnd = mulberry32(seed * 7 + 3 + ev.length * 131);
    let last = ev.length ? ev[ev.length - 1] : 0;
    while (last < t + 60) {
      last += 6 + rnd() * 8;
      ev.push(Math.round(last * fps) / fps);
    }
  }
  const fr = Math.round(t * fps);
  return ev.some((e) => Math.round(e * fps) === fr);
}

// ---------------------------------------------------------------- frame
export interface CreateFrameOpts {
  /** device-resolution canvas context (the frame sets its transforms) */
  c: CanvasRenderingContext2D;
  pxScale: number;
  /** shot-local time */
  t: number;
  fps: number;
  /** global film frame index */
  frame?: number;
  seed: number;
  mood: MoodId | Palette;
  /** gate weave amount (1 = bible: x ±0.6, y ±0.8 px @1080p), default 1 */
  weave?: number;
  /** clock for the weave (global film time keeps weave continuous across shots) */
  weaveT?: number;
}

export interface FilmFrame extends Frame {
  /** PaintEnv for a layer outside layer() (kit helpers) */
  env(layer: LayerId | LayerSpec): PaintEnv;
  /** layer point → screen stage px (+ layer scale k) */
  toScreen(layer: LayerId | LayerSpec, x: number, y: number): { x: number; y: number; k: number };
  /** backlight sun position (screen stage px) after backlight() */
  sun: { x: number; y: number };
  stats: { blurPasses: number; layers: number };
}

type CachedOpts = { blur?: number; res?: number };

interface ActiveLayer {
  L: LayerSpec;
  m: LayerXform;
  /** the context handed to the draw callback */
  given: CanvasRenderingContext2D;
  /** set when cached bitmaps must bypass `given` (blurred scratch at resolution r) */
  redirect?: { r: number; dyn: CanvasRenderingContext2D };
}

let frameSerial = 0;
let l4Owner = -1;

export function createFrame(o: CreateFrameOpts): FilmFrame {
  depthLog = { cam: CAMERA3_HOME, zs: new Set(), ids: new Set() };
  const c = o.c;
  const ps = o.pxScale;
  const DW = c.canvas.width;
  const DH = c.canvas.height;
  const t = o.t;
  const fps = o.fps;
  const serial = ++frameSerial;
  const dev = ps / 1.5; // device px per "1080p px"

  // gate weave (bible §8): slow drift on twos, device px
  const wq = quantizeTwos(o.weaveT ?? t);
  const wAmt = (o.weave ?? 1) * dev;
  const wx = 0.6 * wAmt * vnoise(wq * 0.35, 0x77a1);
  const wy = 0.8 * wAmt * vnoise(wq * 0.35 + 31.7, 0x2b3c);

  const setBase = () => c.setTransform(ps, 0, 0, ps, wx, wy);
  const setLayerXf = (cx: CanvasRenderingContext2D, m: LayerXform, r = 1) =>
    cx.setTransform(ps * m.k * r, 0, 0, ps * m.k * r, (ps * m.tx + wx) * r, (ps * m.ty + wy) * r);
  const resolve = (l: LayerId | LayerSpec): LayerSpec => (typeof l === 'string' ? LAYERS[l] : l);

  let envCache = new Map<string, PaintEnv>();
  let active: ActiveLayer | null = null;
  let hadL4 = false;

  const f: FilmFrame = {
    c,
    W: FILM_W,
    H: FILM_H,
    pxScale: ps,
    t,
    tq: quantizeTwos(t),
    frame: o.frame ?? Math.round(t * fps),
    fps,
    seed: o.seed,
    mood: getMood(o.mood),
    cam: CAMERA3_HOME,
    sun: { x: FILM_W / 2, y: FILM_H * 0.6 },
    stats: { blurPasses: 0, layers: 0 },

    camera(cam: Camera3) {
      f.cam = cam;
      if (depthLog) depthLog.cam = cam;
    },

    setMood(m, blend) {
      f.mood = blend ? crossfadeMood(blend.from, m, blend.u) : getMood(m);
      envCache = new Map();
    },

    env(layer) {
      const L = resolve(layer);
      const key = `${L.id}|${L.haze}`;
      let e = envCache.get(key);
      if (!e) {
        const p = f.mood;
        const fills = new Map<string, string>();
        e = {
          mood: p,
          fill: (role) => {
            let v = fills.get(role);
            if (!v) fills.set(role, (v = hazed(p, role, L.haze)));
            return v;
          },
          layer: L,
          t,
          tq: f.tq,
          frame: f.frame,
          fps,
          pxScale: ps,
          seed: o.seed,
        };
        envCache.set(key, e);
      }
      return e;
    },

    toScreen(layer, x, y) {
      return toScreen(resolve(layer), f.cam, x, y);
    },

    backlight(opts = {}) {
      const p = f.mood;
      const m = layerXform(LAYERS.L0, f.cam);
      setLayerXf(c, m);
      const hz = p.horizon;
      const g = c.createLinearGradient(0, 0, 0, FILM_H);
      g.addColorStop(0, p.sky[0]);
      g.addColorStop(0.3, p.sky[1]);
      g.addColorStop(Math.min(0.5, hz - 0.02), p.sky[2]);
      g.addColorStop(hz, p.sky[3]);
      g.addColorStop(1, p.sky[2]);
      c.fillStyle = g;
      c.fillRect(-80, -80, FILM_W + 160, FILM_H + 160);
      const sx = opts.sunX ?? FILM_W * 0.5;
      const sy = opts.sunY ?? FILM_H * hz;
      const r = opts.sunRadius ?? FILM_W * 0.55;
      const I = opts.intensity ?? 1;
      if (I > 0) {
        c.save();
        c.translate(sx, sy);
        c.scale(1, 0.5);
        const rg = c.createRadialGradient(0, 0, 0, 0, 0, r);
        rg.addColorStop(0, withAlpha(p.rim, 0.35 * I));
        rg.addColorStop(0.35, withAlpha(p.rim, 0.15 * I));
        rg.addColorStop(0.7, withAlpha(p.rim, 0.04 * I));
        rg.addColorStop(1, withAlpha(p.rim, 0));
        c.fillStyle = rg;
        c.fillRect(-r, -r, 2 * r, 2 * r);
        c.restore();
      }
      f.sun = { x: sx * m.k + m.tx, y: sy * m.k + m.ty };
      setBase();
    },

    layer(spec, draw) {
      const L = resolve(spec);
      const m = layerXform(L, f.cam);
      if (depthLog) {
        depthLog.zs.add(L.z);
        depthLog.ids.add(L.id);
      }
      const env = f.env(L);
      const blurDev = L.blur * dev;
      const prev = active;
      f.stats.layers++;
      c.save();
      try {
        if (L.id === 'L4') {
          const call = scratch('l4call', DW, DH);
          clearCtx(call);
          setLayerXf(call, m);
          active = { L, m, given: call };
          draw(call, env);
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.drawImage(call.canvas, 0, 0);
          const acc = scratch('l4acc', DW, DH);
          if (l4Owner !== serial) {
            clearCtx(acc);
            l4Owner = serial;
          }
          acc.drawImage(call.canvas, 0, 0);
          hadL4 = true;
        } else if (blurDev >= 0.35) {
          const r = blurDev >= 3 ? 0.5 : 1;
          const dyn = scratch(`blur${r}`, DW * r, DH * r);
          clearCtx(dyn);
          setLayerXf(dyn, m, r);
          const tr = tracked(dyn);
          setLayerXf(c, m);
          active = { L, m, given: tr.proxy, redirect: { r, dyn } };
          draw(tr.proxy, env);
          if (tr.dirty) {
            f.stats.blurPasses++;
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.globalAlpha = 1;
            c.globalCompositeOperation = 'source-over';
            c.filter = `blur(${blurDev.toFixed(2)}px)`;
            c.drawImage(dyn.canvas, 0, 0, DW, DH);
            c.filter = 'none';
          }
        } else {
          setLayerXf(c, m);
          active = { L, m, given: c };
          draw(c, env);
        }
      } finally {
        active = prev;
        c.restore();
        setBase();
      }
    },

    fog(sheet) {
      const spec =
        sheet === 'A'
          ? { yCenter: 0.6 * FILM_H, height: 0.4 * FILM_H, alpha: 0.3, drift: 6 }
          : sheet === 'B'
            ? { yCenter: 0.7 * FILM_H, height: 0.22 * FILM_H, alpha: 0.12, drift: 10 }
            : sheet;
      const salt = sheet === 'B' ? 202 : sheet === 'A' ? 101 : Math.round(spec.yCenter * 7 + spec.height);
      const drift = spec.drift ?? 8;
      const tex = getFogTex(o.seed * 31 + salt, f.mood.haze);
      setBase();
      const y0 = spec.yCenter - spec.height / 2;
      // two passes of the same texture at different scales/speeds: the fog evolves instead of sliding
      const passes = [
        { span: FOG_SPAN, v: drift, a: 0.62, flip: false, s: 1 },
        { span: FOG_SPAN * 1.37, v: drift * 1.65, a: 0.55, flip: true, s: 3 },
      ];
      for (const ps2 of passes) {
        const off = ps2.v * t + 40 * fbm(t * 0.06 + ps2.s, o.seed + salt + ps2.s);
        let x = -((off % ps2.span) + ps2.span) % ps2.span;
        c.globalAlpha = Math.min(1, spec.alpha * ps2.a * 1.2);
        while (x < FILM_W + 8) {
          if (ps2.flip) {
            c.save();
            c.translate(x + ps2.span, y0);
            c.scale(-1, 1);
            c.drawImage(tex, 0, 0, ps2.span, spec.height);
            c.restore();
          } else c.drawImage(tex, x, y0, ps2.span, spec.height);
          x += ps2.span;
        }
      }
      c.globalAlpha = 1;
    },

    cached(key, w, h, draw, opts?: CachedOpts) {
      const blur = opts?.blur ?? (active ? active.L.blur : 0);
      const res = opts?.res ?? 1;
      const bs = ps * res;
      const blurPx = blur * dev * res; // in bitmap px
      const pad = blur > 0 ? Math.ceil(blurPx * 2.5 + 2) / bs : 1 / bs;
      const full = `${key}|${w}x${h}|${bs.toFixed(3)}|${blur}`;
      let e = bitmaps.get(full);
      if (e) {
        bitmaps.delete(full);
        bitmaps.set(full, e);
      } else {
        cacheMisses++;
        const cw = (w + 2 * pad) * bs, ch = (h + 2 * pad) * bs;
        const cv = makeCanvas(cw, ch);
        const cc = ctx2d(cv);
        if (blurPx > 0.2) {
          const tmp = scratch('cachetmp', cw, ch);
          clearCtx(tmp);
          tmp.setTransform(bs, 0, 0, bs, pad * bs, pad * bs);
          bakeScope(() => draw(tmp));
          tmp.setTransform(1, 0, 0, 1, 0, 0);
          cc.filter = `blur(${blurPx.toFixed(2)}px)`;
          cc.drawImage(tmp.canvas, 0, 0, cw, ch, 0, 0, cw, ch);
          cc.filter = 'none';
        } else {
          cc.setTransform(bs, 0, 0, bs, pad * bs, pad * bs);
          bakeScope(() => draw(cc));
        }
        e = { cv, pad, px: cv.width * cv.height };
        bitmaps.set(full, e);
        bitmapPx += e.px;
        while (bitmapPx > BITMAP_BUDGET && bitmaps.size > 1) {
          const [k0, v0] = bitmaps.entries().next().value!;
          bitmaps.delete(k0);
          bitmapPx -= v0.px;
        }
      }
      const entry = e;
      return (ctx, x, y) => {
        const a = active;
        if (a?.redirect && ctx === a.given) {
          // blurred layer: bypass the scratch so the bitmap is not blurred twice
          const mt = a.redirect.dyn.getTransform();
          const r = a.redirect.r;
          c.save();
          c.setTransform(mt.a / r, mt.b / r, mt.c / r, mt.d / r, mt.e / r, mt.f / r);
          c.globalAlpha = a.redirect.dyn.globalAlpha;
          c.drawImage(entry.cv, x - entry.pad, y - entry.pad, w + 2 * entry.pad, h + 2 * entry.pad);
          c.restore();
          return;
        }
        ctx.drawImage(entry.cv, x - entry.pad, y - entry.pad, w + 2 * entry.pad, h + 2 * entry.pad);
      };
    },

    practical(po) {
      const L = resolve(po.layer ?? 'L4');
      const p = f.mood;
      const pos = toScreen(L, f.cam, po.x, po.y);
      const I = po.intensity ?? 1;
      const seed = po.seed;
      const tq = Math.floor(t * 24 + 1e-9) / 24;
      let flick = 1;
      let sway = 0;
      let halo = p.halo;
      let core = p.core;
      let base = po.radius ?? 70;
      let sxScale = 1;
      switch (po.kind) {
        case 'candle':
          flick = 1 + 0.07 * fbm(tq * 9.0, seed);
          sway = (1.2 / 1.5) * fbm(tq * 3.1, seed + 5) * 1.6;
          break;
        case 'lamp':
          flick = 1 + 0.02 * fbm(tq * 4.0, seed);
          break;
        case 'screen':
          flick = 1 + 0.015 * fbm(tq * 14.0, seed);
          halo = mixLab(p.halo, p.rim, 0.55);
          core = mixLab(p.core, p.rim, 0.4);
          break;
        case 'led':
          base = po.radius ?? 16;
          flick = 1 + 0.04 * vnoise(t * 0.5, seed);
          core = mixLab(p.core, p.rim, 0.3);
          break;
        case 'tube':
          flick = tubeDropout(seed, t, fps) ? 0.85 : 1;
          halo = mixLab(p.halo, p.rim, 0.6);
          core = mixLab(p.core, p.rim, 0.5);
          sxScale = 3.2;
          break;
      }
      const k = pos.k;
      const r = base * k;
      const A = I * flick;
      setBase();
      c.save();
      c.globalCompositeOperation = 'lighter';
      const glow = (R: number, col: string, a: number, cy = pos.y) => {
        if (a <= 0.002) return;
        c.save();
        c.translate(pos.x, cy);
        if (sxScale !== 1) c.scale(sxScale, 1);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
        g.addColorStop(0, withAlpha(col, a));
        g.addColorStop(0.3, withAlpha(col, a * 0.62));
        g.addColorStop(0.65, withAlpha(col, a * 0.22));
        g.addColorStop(1, withAlpha(col, 0));
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, R, 0, Math.PI * 2);
        c.fill();
        c.restore();
      };
      const fh = 20 * (base / 70) * k * (0.94 + 0.12 * (flick - 1) / 0.07);
      const glowY = po.kind === 'candle' ? pos.y - fh * 0.45 : pos.y;
      glow(r * (260 / 70), halo, 0.16 * A, glowY);
      glow(r, halo, 0.35 * A, glowY);
      if (po.kind === 'candle') {
        c.globalCompositeOperation = 'source-over';
        // flame: a teardrop from the wick (pos) up to a swaying tip
        const fw = fh * 0.3;
        const tipX = pos.x + sway * k;
        const tipY = pos.y - fh;
        const fg = c.createLinearGradient(0, pos.y + fw * 0.4, 0, tipY);
        fg.addColorStop(0, withAlpha(mixLab(p.halo, p.ink, 0.25), 0.9));
        fg.addColorStop(0.25, core);
        fg.addColorStop(1, withAlpha(core, 0.85));
        c.fillStyle = fg;
        c.beginPath();
        c.moveTo(tipX, tipY);
        c.bezierCurveTo(pos.x + fw * 0.9, pos.y - fh * 0.55, pos.x + fw * 1.05, pos.y + fw * 0.15, pos.x, pos.y + fw * 0.35);
        c.bezierCurveTo(pos.x - fw * 1.05, pos.y + fw * 0.15, pos.x - fw * 0.9, pos.y - fh * 0.55, tipX, tipY);
        c.fill();
        // wick
        c.strokeStyle = p.ink;
        c.lineWidth = Math.max(0.6, 0.9 * k);
        c.beginPath();
        c.moveTo(pos.x, pos.y + fw * 0.45);
        c.lineTo(pos.x + sway * 0.2, pos.y - fh * 0.12);
        c.stroke();
        c.globalCompositeOperation = 'lighter';
      }
      glow(r * (22 / 70), core, 0.75 * A, glowY);
      c.restore();
      setBase();
    },

    rim(dir) {
      if (!hadL4 || l4Owner !== serial) return;
      let d = dir;
      if (!d) {
        const vx = f.sun.x - FILM_W / 2, vy = f.sun.y - FILM_H * 0.62 - 90;
        d = Math.hypot(vx, vy) < 1 ? { x: -0.8, y: -0.6 } : { x: vx, y: vy };
      }
      const n = Math.hypot(d.x, d.y) || 1;
      const off = 2.0 * dev;
      const ox = (-d.x / n) * off, oy = (-d.y / n) * off;
      const acc = pool.get('l4acc')!;
      const rc = scratch('rim', DW, DH);
      clearCtx(rc);
      rc.drawImage(acc.canvas, 0, 0);
      rc.globalCompositeOperation = 'source-in';
      rc.fillStyle = f.mood.rim;
      rc.fillRect(0, 0, DW, DH);
      rc.globalCompositeOperation = 'destination-out';
      rc.drawImage(acc.canvas, ox, oy);
      rc.globalCompositeOperation = 'source-over';
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 0.55;
      c.drawImage(rc.canvas, 0, 0);
      c.restore();
      setBase();
    },
  };
  setBase();
  return f;
}
