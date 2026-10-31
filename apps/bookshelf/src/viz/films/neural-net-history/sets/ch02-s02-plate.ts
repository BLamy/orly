/**
 * neural-net-history — the 1940s LAMPLIT PLATE kit (ch02-s02 threshold lanterns, ch02-s05 Hebb's thread).
 *
 * A parchment sheet lying on a dark desk in the lamp's pool, drawn in the shot's own mood (candleAmber):
 * the paper is mid-value (L* ≈ 40–65, brightest under the lamp) so that a lantern's light (core L* 88)
 * still reads as light on it, and ink (L* 5) reads as ink. Paper-cut diagrams sit on it in ink.
 *
 *   amberPlate(f, c, { x, y, w, h, key, pool? }, env)    the deckled sheet (cached), lamp-pooled
 *   deskTop(f, c, rect, key, env, pool)                 the dark desk around it (cached)
 *   thresholdLantern(c, { x, y, r, level, ring?, ringGlow?, fire, theta?, alpha? }, env)
 *        level 0..1   how far the inner glow has risen (bound to the summed input: one notch per signal)
 *        ring  0..1   the threshold cut-line height (bound to θ: the same notch scale)
 *        fire  0..1   the wick has caught (all or nothing: shots snap it, never fade it)
 *   inputKnot(c, { x, y, on, r? }, env)                 a small ink knot that lights (value 1)
 *   plateThread(c, { x0, y0, x1, y1, sag, on, w? }, env) an ink thread, warm when it carries a signal
 *   bead(c, p, k, env)                                  a bead of light travelling a thread
 *   inkText(c, text, x, y, { size, font, align, alpha }, env)   type set in ink on the plate
 *   NOTCH                                               glow height per unit of input (ring(θ) = θ·NOTCH − ε)
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { FONT } from '../../../film/silhouette/type';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** glow height per unit of summed input; a ring for θ sits just under θ notches */
export const NOTCH = 0.3;
export const ringFor = (theta: number) => theta * NOTCH - 0.035;

export interface PlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Pool {
  x: number;
  y: number;
  r: number;
}

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** the paper tone under the lamp: from shadowed (edge) to lamp-lit (centre) */
export function paperAt(env: PaintEnv, light: number) {
  const P = env.mood;
  const dark = mixLab(P.set, P.haze, 0.4);
  const lit = mixLab(mixLab(P.haze, P.rim, 0.55), P.setHaze, 0.12);
  return mixLab(dark, lit, clamp01(light));
}

/** the dark desk top around the plate: wood grain as faint cut-lines, the lamp's pool */
export function deskTop(f: Frame, c: C, r: PlateRect, key: string, env: PaintEnv, pool: Pool) {
  f.cached(`${key}/desk/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    const P = env.mood;
    cc.fillStyle = mixLab(P.set, P.fg, 0.45);
    cc.fillRect(r.x, r.y, r.w, r.h);
    const g = cc.createRadialGradient(pool.x, pool.y, 20, pool.x, pool.y, pool.r * 1.25);
    g.addColorStop(0, withAlpha(mixLab(P.set, P.halo, 0.45), 0.95));
    g.addColorStop(0.55, withAlpha(mixLab(P.set, P.halo, 0.15), 0.6));
    g.addColorStop(1, withAlpha(P.set, 0));
    cc.fillStyle = g;
    cc.fillRect(r.x, r.y, r.w, r.h);
    cc.strokeStyle = withAlpha(P.fg, 0.35);
    cc.lineWidth = 1.1;
    const R = rnd(91);
    for (let y = r.y; y < r.y + r.h; y += 17 + R() * 9) {
      cc.beginPath();
      cc.moveTo(r.x, y);
      cc.bezierCurveTo(r.x + r.w * 0.3, y + (R() - 0.5) * 12, r.x + r.w * 0.7, y + (R() - 0.5) * 12, r.x + r.w, y + (R() - 0.5) * 6);
      cc.stroke();
    }
  })(c, r.x, r.y);
}

/** the deckled parchment, lit by the lamp's pool (cached per mood/size) */
export function amberPlate(
  f: Frame,
  c: C,
  o: PlateRect & {
    key: string;
    pool: Pool;
    seed?: number;
    /** opt-in paper pass: visible fibres, one soft fold crease, and a warm 2-3% pool from the lamp side (layer px) */
    texture?: { lamp: { x: number; y: number }; crease?: number };
  },
  env: PaintEnv,
) {
  const pad = 24;
  const W = Math.round(o.w), H = Math.round(o.h);
  const tx = o.texture ? `/tx${Math.round(o.texture.lamp.x)},${Math.round(o.texture.lamp.y)},${o.texture.crease ?? 0.42}` : '';
  f.cached(`${o.key}/plate/${env.mood.id}/${W}x${H}/${o.pool.x},${o.pool.y},${o.pool.r}${tx}`, W + pad * 2, H + pad * 2, (g) => {
    g.translate(pad, pad);
    const R = rnd((o.seed ?? 7) * 7919 + 13);
    const P = env.mood;
    const edge = new Path2D();
    const pts: [number, number][] = [];
    const jag = () => (R() - 0.5) * 3;
    for (let x = 0; x <= W; x += 9) pts.push([x, jag()]);
    for (let y = 0; y <= H; y += 9) pts.push([W + jag(), y]);
    for (let x = W; x >= 0; x -= 9) pts.push([x, H + jag()]);
    for (let y = H; y >= 0; y -= 9) pts.push([jag(), y]);
    pts.forEach(([x, y], i) => (i ? edge.lineTo(x, y) : edge.moveTo(x, y)));
    edge.closePath();
    // contact shadow (paper lies on the desk)
    g.save();
    g.fillStyle = withAlpha(P.fg, 0.55);
    g.translate(5, 7);
    g.fill(edge);
    g.restore();
    g.save();
    g.clip(edge);
    // the pool of the lamp on the paper (pool centre is in layer px; translate into plate space)
    const px = o.pool.x - o.x, py = o.pool.y - o.y;
    const body = g.createRadialGradient(px, py, 10, px, py, o.pool.r);
    body.addColorStop(0, paperAt(env, 1));
    body.addColorStop(0.5, paperAt(env, 0.74));
    body.addColorStop(0.85, paperAt(env, 0.28));
    body.addColorStop(1, paperAt(env, 0.08));
    g.fillStyle = body;
    g.fillRect(-4, -4, W + 8, H + 8);
    // fibres and foxing
    const nf = Math.round((W * H) / 300);
    for (let i = 0; i < nf; i++) {
      const x = R() * W, y = R() * H, L = 3 + R() * 9, a = R() * Math.PI;
      g.strokeStyle = R() < 0.5 ? withAlpha(P.core, 0.07) : withAlpha(P.fg, 0.07);
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4);
      g.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const x = R() * W, y = R() * H, r = 8 + R() * 30;
      const sp = g.createRadialGradient(x, y, 0, x, y, r);
      sp.addColorStop(0, withAlpha(P.fg, 0.1));
      sp.addColorStop(1, withAlpha(P.fg, 0));
      g.fillStyle = sp;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (o.texture) paperTexture(g, W, H, o, env, R);
    g.restore();
    // faint ink rules: a double border
    g.strokeStyle = withAlpha(P.ink, 0.42);
    g.lineWidth = 1.3;
    g.strokeRect(14, 14, W - 28, H - 28);
    g.lineWidth = 0.6;
    g.strokeRect(20, 20, W - 40, H - 40);
  })(c, o.x - pad, o.y - pad);
}

/** the opt-in paper pass (inside the sheet's clip, plate space): long laid fibres you can see, one soft fold
 *  crease (a shadowed valley beside a lit ridge), and a warm wash from the lamp side (2-3%) falling to the
 *  far corners, so the plate sits in a pool of light rather than under flat fill */
function paperTexture(g: C, W: number, H: number, o: { x: number; y: number; texture?: { lamp: { x: number; y: number }; crease?: number } }, env: PaintEnv, R: () => number) {
  const P = env.mood;
  const tx = o.texture!;
  // laid lines: faint horizontal chain of the mould, every ~11 px, broken
  g.lineWidth = 0.7;
  for (let y = 6; y < H; y += 10 + R() * 3) {
    g.strokeStyle = withAlpha(P.fg, 0.045 + R() * 0.03);
    g.beginPath();
    let x = -4;
    g.moveTo(x, y);
    while (x < W + 4) {
      x += 40 + R() * 80;
      g.lineTo(x, y + (R() - 0.5) * 1.2);
    }
    g.stroke();
  }
  // long fibres, light and dark, visible at 1080p
  const nf = Math.round((W * H) / 1400);
  for (let i = 0; i < nf; i++) {
    const x = R() * W, y = R() * H, L = 10 + R() * 26, a = (R() - 0.5) * 0.9;
    g.strokeStyle = R() < 0.55 ? withAlpha(P.core, 0.1 + R() * 0.06) : withAlpha(P.fg, 0.1 + R() * 0.06);
    g.lineWidth = 0.7 + R() * 0.5;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 + (R() - 0.5) * 3, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
  // one fold crease, slightly off vertical, at `crease` of the width
  const cx = W * (tx.crease ?? 0.42);
  const tilt = 14;
  const valley = g.createLinearGradient(cx - 18, 0, cx + 18, 0);
  valley.addColorStop(0, withAlpha(P.fg, 0));
  valley.addColorStop(0.45, withAlpha(P.fg, 0.1));
  valley.addColorStop(0.5, withAlpha(P.fg, 0.16));
  valley.addColorStop(0.56, withAlpha(P.core, 0.1));
  valley.addColorStop(1, withAlpha(P.core, 0));
  g.save();
  g.translate(cx, H / 2);
  g.rotate(Math.atan2(tilt, H));
  g.translate(-cx, -H / 2);
  g.fillStyle = valley;
  g.fillRect(cx - 18, -20, 36, H + 40);
  g.restore();
  // the warm wash from the lamp side (the lamp is off the plate's upper left)
  const lx = tx.lamp.x - o.x, ly = tx.lamp.y - o.y;
  const reach = Math.hypot(W - lx, H - ly);
  const warm = g.createRadialGradient(lx, ly, 0, lx, ly, reach);
  warm.addColorStop(0, withAlpha(P.halo, 0.12));
  warm.addColorStop(0.45, withAlpha(P.halo, 0.05));
  warm.addColorStop(1, withAlpha(P.halo, 0));
  const op = g.globalCompositeOperation;
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = warm;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = op;
  const fall = g.createRadialGradient(lx, ly, reach * 0.35, lx, ly, reach);
  fall.addColorStop(0, withAlpha(P.fg, 0));
  fall.addColorStop(1, withAlpha(P.fg, 0.14));
  g.fillStyle = fall;
  g.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- light
function glow(c: C, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0.003 || r <= 0.5) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.35, withAlpha(col, a * 0.45));
  g.addColorStop(1, withAlpha(col, 0));
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalCompositeOperation = op;
}
export { glow as plateGlow };

/** a bead of light on a thread */
export function bead(c: C, p: { x: number; y: number }, k: number, env: PaintEnv, r = 6) {
  if (k <= 0.01) return;
  glow(c, p.x, p.y, r * 5, env.mood.halo, 0.4 * k);
  glow(c, p.x, p.y, r * 1.8, env.mood.core, 0.9 * k);
  c.save();
  c.globalAlpha *= Math.min(1, k * 1.2);
  c.fillStyle = env.mood.core;
  c.beginPath();
  c.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the threshold lantern
/** lantern body: a paper barrel, height 2.2r, width 1.6r (centre at 0,0) */
const bodyCache = new Map<number, { body: Path2D; ribs: Path2D; caps: Path2D; slots: Path2D; h: number; halfW: (y: number) => number }>();
function lanternGeo(r: number) {
  const key = Math.round(r * 10);
  let g = bodyCache.get(key);
  if (g) return g;
  const h = r * 1.1; // half height
  const w = r * 0.82; // half width at the waist
  const halfW = (y: number) => {
    const u = Math.min(1, Math.abs(y) / h);
    return w * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.42) + r * 0.16 * (1 - u);
  };
  const body = new Path2D();
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const y = -h + (2 * h * i) / N;
    const x = halfW(y);
    i ? body.lineTo(x, y) : body.moveTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const y = -h + (2 * h * i) / N;
    body.lineTo(-halfW(y), y);
  }
  body.closePath();
  const ribs = new Path2D();
  for (let k = 1; k < 6; k++) {
    const y = -h + (2 * h * k) / 6;
    const x = halfW(y);
    ribs.moveTo(-x, y);
    ribs.quadraticCurveTo(0, y + r * 0.07, x, y);
  }
  for (const s of [-0.88, -0.45, 0, 0.45, 0.88]) {
    ribs.moveTo(s * r * 0.3, -h);
    ribs.quadraticCurveTo(s * w * 1.25, 0, s * r * 0.3, h);
  }
  const caps = new Path2D();
  caps.rect(-r * 0.42, -h - r * 0.13, r * 0.84, r * 0.15);
  caps.rect(-r * 0.36, h - 0.02 * r, r * 0.72, r * 0.14);
  // cut-paper slots: six bands between the hoops, each split into three panels by two spines; what is left
  // of the dark sheet is the lantern's frame (hoops, spines and the rim)
  const slots = new Path2D();
  const gap = Math.max(1.2, r * 0.045);
  const cols: [number, number][] = [
    [-0.84, -0.36],
    [-0.27, 0.27],
    [0.36, 0.84],
  ];
  for (let k = 0; k < 6; k++) {
    const y0 = -h + (2 * h * k) / 6 + gap + (k === 0 ? r * 0.08 : 0);
    const y1 = -h + (2 * h * (k + 1)) / 6 - gap - (k === 5 ? r * 0.08 : 0);
    if (y1 - y0 < 1) continue;
    for (const [u0, u1] of cols) {
      const S = 5;
      for (let i = 0; i <= S; i++) {
        const y = y0 + ((y1 - y0) * i) / S;
        const x = u0 * halfW(y);
        i ? slots.lineTo(x, y) : slots.moveTo(x, y);
      }
      for (let i = S; i >= 0; i--) {
        const y = y0 + ((y1 - y0) * i) / S;
        slots.lineTo(u1 * halfW(y), y);
      }
      slots.closePath();
    }
  }
  g = { body, ribs, caps, slots, h, halfW };
  bodyCache.set(key, g);
  return g;
}

export interface ThresholdLanternOpts {
  x: number;
  y: number;
  r: number;
  /** inner glow height 0..1 (one NOTCH per unit of summed input) */
  level: number;
  /** threshold ring height 0..1 (undefined = no ring) */
  ring?: number;
  /** extra emphasis on the ring 0..1 (it brightens on the beat) */
  ringGlow?: number;
  /** wick caught 0..1 */
  fire: number;
  /** θ glyph beside the ring 0..1 */
  theta?: number;
  alpha?: number;
  /** cord length above the lantern */
  hang?: number;
  seed?: number;
  /** the unlit paper tone (default: set ink mixed 25% toward ink). Pass a warm translucent paper so 'dark'
   *  still reads as paper with no light behind it; the unlit ribs then draw in ink, not rim */
  paper?: string;
  /** nudge the θ glyph off the ring (layer px; +x right, −y up) */
  thetaAt?: { dx: number; dy: number };
  /** cut-paper build: a dark sheet with its rib slots cut out; the paper and the glow show only through the
   *  slots, so the lantern is a silhouette that belongs to the shadow theatre rather than a line drawing */
  cut?: boolean;
  /** paper-skin build (round-1 revision): a warm translucent paper globe (~15% toward core even unlit) with
   *  thin ink ribs (~1.5 px), shaded as a sphere; when lit, the light blooms THROUGH the paper and over the
   *  ribs instead of showing between bars. Overrides `cut`. */
  skin?: boolean;
}

/** a lantern's own cast shadow on the paper below it: its silhouette (cord, caps, barrel) offset away from the
 *  lamp, softly blurred. dx/dy in layer px (≈12 px), alpha ≈ 0.2 */
export function lanternShadow(c: C, o: { x: number; y: number; r: number; hang?: number; dx: number; dy: number; alpha: number }, env: PaintEnv) {
  if (o.alpha <= 0.003) return;
  const G = lanternGeo(o.r);
  c.save();
  c.globalAlpha *= o.alpha;
  c.filter = `blur(${Math.max(1.5, o.r * 0.035).toFixed(1)}px)`;
  c.translate(o.x + o.dx, o.y + o.dy);
  c.fillStyle = env.mood.fg;
  c.fill(G.body);
  c.fill(G.caps);
  if (o.hang) c.fillRect(-Math.max(1, o.r * 0.02), -G.h - o.r * 0.13 - o.hang, Math.max(2, o.r * 0.04), o.hang);
  c.restore();
}

export function thresholdLantern(c: C, o: ThresholdLanternOpts, env: PaintEnv) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const P = env.mood;
  const r = o.r;
  const G = lanternGeo(r);
  const fire = clamp01(o.fire);
  const lvl = clamp01(o.level);
  const ink = P.ink;
  // flicker (twos), seeded per lantern
  const tq = Math.floor(env.t * 12) / 12;
  const fl = 1 + 0.05 * Math.sin(tq * 9.3 + (o.seed ?? 1) * 3.1) + 0.03 * Math.sin(tq * 21.7 + (o.seed ?? 1));
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  // the room glow behind (only when the wick has caught: all or nothing)
  if (fire > 0.01) {
    glow(c, 0, r * 0.1, r * 5.2, P.halo, 0.26 * fire * fl);
    glow(c, 0, r * 0.1, r * 2.0, P.halo, 0.38 * fire * fl);
  }
  // cord
  if (o.hang) {
    c.strokeStyle = ink;
    c.lineWidth = Math.max(1, r * 0.035);
    c.beginPath();
    c.moveTo(0, -G.h - r * 0.13);
    c.lineTo(0, -G.h - r * 0.13 - o.hang);
    c.stroke();
  }
  if (o.skin) {
    skinLantern(c, o, G, P, fire, lvl, fl, tq);
    c.restore();
    return;
  }
  // paper: dark, then lit from below up to `level` (an ember), or wholly lit (fire)
  if (o.cut) {
    // the dark sheet (warmed a little from inside once the wick has caught)
    c.fillStyle = mixLab(mixLab(P.ink, P.set, 0.3), P.halo, 0.18 * fire);
    c.fill(G.body);
  }
  c.fillStyle = o.paper ?? mixLab(P.set, P.ink, 0.25);
  c.fill(o.cut ? G.slots : G.body);
  c.save();
  c.clip(o.cut ? G.slots : G.body);
  if (lvl > 0.002 && fire < 0.999) {
    const top = G.h - lvl * 2 * G.h;
    const g = c.createLinearGradient(0, G.h, 0, top - r * 0.12);
    g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.25), 0.95));
    g.addColorStop(0.75, withAlpha(P.halo, 0.85));
    g.addColorStop(1, withAlpha(P.halo, 0));
    c.fillStyle = g;
    c.fillRect(-r * 2, top - r * 0.12, r * 4, G.h - top + r * 0.2);
  }
  if (fire > 0.002) {
    const lit = c.createRadialGradient(0, r * 0.25, 0, 0, 0, r * 1.25);
    lit.addColorStop(0, withAlpha(P.core, fire));
    lit.addColorStop(0.5, withAlpha(mixLab(P.core, P.halo, 0.45), fire));
    lit.addColorStop(1, withAlpha(mixLab(P.halo, P.set, 0.25), fire));
    c.fillStyle = lit;
    c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  }
  c.restore();
  // ribs and seams in ink (over the light) or faint rim (unlit); a cut lantern's ribs ARE its frame
  if (!o.cut) {
    c.strokeStyle = fire > 0.2 || lvl > 0.05 ? withAlpha(ink, 0.5) : o.paper ? withAlpha(ink, 0.32) : withAlpha(P.rim, 0.22);
    c.lineWidth = Math.max(0.8, r * 0.03);
    c.stroke(G.ribs);
  } else {
    // a lamp-side rim on the sheet's upper-left contour (the paper's cut edge catching the desk lamp)
    c.save();
    c.clip(G.body);
    c.strokeStyle = withAlpha(P.rim, 0.32);
    c.lineWidth = Math.max(1, r * 0.03);
    c.translate(r * 0.025, r * 0.025);
    c.stroke(G.body);
    c.restore();
  }
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1.2, r * 0.05);
  c.stroke(G.body);
  c.fillStyle = ink;
  c.fill(G.caps);
  // tassel
  c.lineWidth = Math.max(0.8, r * 0.03);
  c.beginPath();
  for (let i = -2; i <= 2; i++) {
    c.moveTo(i * r * 0.05, G.h + r * 0.12);
    c.lineTo(i * r * 0.07, G.h + r * 0.42);
  }
  c.stroke();
  // the wick: an ember at the base, a full flame when caught
  const wy = G.h * 0.55;
  if (fire > 0.01) {
    const fh = r * 0.62 * fl;
    const sway = r * 0.03 * Math.sin(tq * 3.3 + (o.seed ?? 1));
    const flame = (k: number, col: string) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(sway, wy - fh * k);
      c.bezierCurveTo(r * 0.2 * k, wy - fh * 0.45 * k, r * 0.16 * k, wy + r * 0.05, 0, wy + r * 0.05);
      c.bezierCurveTo(-r * 0.16 * k, wy + r * 0.05, -r * 0.2 * k, wy - fh * 0.45 * k, sway, wy - fh * k);
      c.fill();
    };
    c.globalAlpha *= fire;
    flame(1, mixLab(P.halo, P.core, 0.55));
    flame(0.55, P.core);
    c.globalAlpha /= Math.max(0.001, fire);
    glow(c, 0, wy - r * 0.2, r * 0.9, P.core, 0.55 * fire * fl);
  } else if (lvl > 0.05) {
    glow(c, 0, wy, r * 0.32, P.core, 0.5 * Math.min(1, lvl * 2));
  }
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1, r * 0.03);
  c.beginPath();
  c.moveTo(0, wy + r * 0.06);
  c.lineTo(0, wy - r * 0.06);
  c.stroke();
  // the threshold ring: an ink cut-line around the waist at the ring height, with θ
  if (o.ring !== undefined) {
    const y = G.h - clamp01(o.ring) * 2 * G.h;
    const hw = G.halfW(y);
    const rg = clamp01(o.ringGlow ?? 0);
    c.lineCap = 'round';
    if (rg > 0.01) {
      c.strokeStyle = withAlpha(P.core, 0.75 * rg);
      c.lineWidth = Math.max(2, r * 0.07);
      c.beginPath();
      c.moveTo(-hw - r * 0.18, y);
      c.lineTo(hw + r * 0.18, y);
      c.stroke();
    }
    if (o.cut) {
      // a paper-light under-stroke so the ring reads across the dark frame as well as over the lit slots
      c.strokeStyle = withAlpha(mixLab(P.rim, P.halo, 0.4), 0.85);
      c.lineWidth = Math.max(2.4, r * 0.075);
      c.beginPath();
      c.moveTo(-hw - r * 0.18, y);
      c.lineTo(hw + r * 0.18, y);
      c.stroke();
    }
    c.strokeStyle = ink;
    c.lineWidth = Math.max(1.4, r * 0.045);
    c.setLineDash([r * 0.1, r * 0.07]);
    c.beginPath();
    c.moveTo(-hw - r * 0.18, y);
    c.lineTo(hw + r * 0.18, y);
    c.stroke();
    c.setLineDash([]);
    const th = clamp01(o.theta ?? 0);
    if (th > 0.01) {
      c.globalAlpha *= th;
      c.fillStyle = ink;
      c.font = `italic 500 ${Math.max(20, r * 0.42)}px ${FONT.text}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('θ', hw + r * 0.3 + (o.thetaAt?.dx ?? 0), y + (o.thetaAt?.dy ?? 0));
    }
  }
  c.restore();
}

type LGeo = ReturnType<typeof lanternGeo>;
/** the paper-skin lantern body (already translated to the lantern's centre, alpha applied) */
function skinLantern(c: C, o: ThresholdLanternOpts, G: LGeo, P: PaintEnv['mood'], fire: number, lvl: number, fl: number, tq: number) {
  const r = o.r;
  const ink = P.ink;
  const base = o.paper ?? mixLab(P.set, P.haze, 0.5);
  // the unlit skin: warm translucent paper (~15% toward the flame's core), never a hole or a cage
  c.fillStyle = mixLab(base, P.core, 0.15);
  c.fill(G.body);
  c.save();
  c.clip(G.body);
  // the glow rising inside (an ember up to `level`), soft through the paper
  if (lvl > 0.002 && fire < 0.999) {
    const top = G.h - lvl * 2 * G.h;
    const g = c.createLinearGradient(0, G.h, 0, top - r * 0.2);
    g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.35), 0.92));
    g.addColorStop(0.7, withAlpha(mixLab(P.halo, P.core, 0.1), 0.72));
    g.addColorStop(1, withAlpha(P.halo, 0));
    c.fillStyle = g;
    c.fillRect(-r * 2, top - r * 0.2, r * 4, G.h - top + r * 0.3);
  }
  // wholly lit: the flame's light fills the paper, hottest round the wick
  if (fire > 0.002) {
    const lit = c.createRadialGradient(0, G.h * 0.3, 0, 0, 0, r * 1.2);
    lit.addColorStop(0, withAlpha(P.core, fire));
    lit.addColorStop(0.45, withAlpha(mixLab(P.core, P.halo, 0.4), fire));
    lit.addColorStop(1, withAlpha(mixLab(P.halo, P.set, 0.3), fire));
    c.fillStyle = lit;
    c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  }
  // the globe's turn: the paper darkens toward its contour (less so when lit from inside)
  const sh = c.createRadialGradient(-r * 0.18, -r * 0.2, r * 0.2, 0, 0, r * 1.05);
  sh.addColorStop(0, withAlpha(P.fg, 0));
  sh.addColorStop(0.65, withAlpha(P.fg, 0.1 * (1 - 0.6 * fire)));
  sh.addColorStop(1, withAlpha(P.fg, 0.42 * (1 - 0.55 * fire)));
  c.fillStyle = sh;
  c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  // thin ribs: the bamboo hoops and meridians seen as shadows through the paper (~1.5 px)
  c.strokeStyle = withAlpha(ink, fire > 0.2 ? 0.42 : lvl > 0.05 ? 0.5 : 0.58);
  c.lineWidth = Math.max(1, Math.min(1.6, r * 0.014));
  c.stroke(G.ribs);
  // the lamp-side rim on the upper-left contour
  c.strokeStyle = withAlpha(P.rim, 0.3 * (1 - fire));
  c.lineWidth = Math.max(1, r * 0.022);
  c.save();
  c.translate(r * 0.02, r * 0.02);
  c.stroke(G.body);
  c.restore();
  c.restore();
  // the light blooms through the skin and over the ribs (additive), not between bars
  if (fire > 0.01) {
    glow(c, 0, G.h * 0.2, r * 1.05, P.core, 0.32 * fire * fl);
    glow(c, 0, G.h * 0.45, r * 0.55, P.core, 0.35 * fire * fl);
  } else if (lvl > 0.05) {
    glow(c, 0, G.h * 0.6, r * 0.6, P.halo, 0.28 * Math.min(1, lvl * 2));
  }
  // contour, caps, tassel
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1.3, r * 0.02);
  c.stroke(G.body);
  c.fillStyle = ink;
  c.fill(G.caps);
  c.lineWidth = Math.max(0.8, r * 0.018);
  c.beginPath();
  for (let i = -2; i <= 2; i++) {
    c.moveTo(i * r * 0.05, G.h + r * 0.12);
    c.lineTo(i * r * 0.07, G.h + r * 0.42);
  }
  c.stroke();
  // the wick: an ember at the base, a full flame when caught
  const wy = G.h * 0.55;
  if (fire > 0.01) {
    const fh = r * 0.58 * fl;
    const sway = r * 0.03 * Math.sin(tq * 3.3 + (o.seed ?? 1));
    const flame = (k: number, col: string) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(sway, wy - fh * k);
      c.bezierCurveTo(r * 0.18 * k, wy - fh * 0.45 * k, r * 0.14 * k, wy + r * 0.05, 0, wy + r * 0.05);
      c.bezierCurveTo(-r * 0.14 * k, wy + r * 0.05, -r * 0.18 * k, wy - fh * 0.45 * k, sway, wy - fh * k);
      c.fill();
    };
    c.save();
    c.globalAlpha *= fire;
    flame(1, mixLab(P.halo, P.core, 0.6));
    flame(0.55, P.core);
    c.restore();
  } else if (lvl > 0.05) {
    glow(c, 0, wy, r * 0.3, P.core, 0.55 * Math.min(1, lvl * 2));
  }
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1, r * 0.022);
  c.beginPath();
  c.moveTo(0, wy + r * 0.06);
  c.lineTo(0, wy - r * 0.06);
  c.stroke();
  // the threshold ring: a dashed ink cut-line around the waist, brightening on its beat, with θ
  if (o.ring !== undefined) {
    const y = G.h - clamp01(o.ring) * 2 * G.h;
    const hw = G.halfW(y);
    const rg = clamp01(o.ringGlow ?? 0);
    c.lineCap = 'round';
    if (rg > 0.01) {
      c.strokeStyle = withAlpha(P.core, 0.75 * rg);
      c.lineWidth = Math.max(2, r * 0.07);
      c.beginPath();
      c.moveTo(-hw - r * 0.18, y);
      c.lineTo(hw + r * 0.18, y);
      c.stroke();
    }
    c.strokeStyle = ink;
    c.lineWidth = Math.max(1.6, r * 0.04);
    c.setLineDash([r * 0.1, r * 0.07]);
    c.beginPath();
    c.moveTo(-hw - r * 0.18, y);
    c.lineTo(hw + r * 0.18, y);
    c.stroke();
    c.setLineDash([]);
    const th = clamp01(o.theta ?? 0);
    if (th > 0.01) {
      c.save();
      c.globalAlpha *= th;
      c.fillStyle = ink;
      c.font = `italic 500 ${Math.max(20, r * 0.42)}px ${FONT.text}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('θ', hw + r * 0.3 + (o.thetaAt?.dx ?? 0), y + (o.thetaAt?.dy ?? 0));
      c.restore();
    }
  }
}

/** a near-desk inkwell with its dip pen (L5, drawn in layer px; blurred by the layer): a squat bottle at (x, y) =
 *  its body centre, the pen leaning at `penRot` radians from vertical (+ = to the right) */
export function nearInkwell(c: C, o: { x: number; y: number; penRot: number }, env: PaintEnv) {
  const P = env.mood;
  const { x: ix, y: iy } = o;
  c.save();
  c.fillStyle = P.fg;
  c.beginPath();
  c.roundRect(ix - 64, iy - 46, 128, 92, 14);
  c.fill();
  c.beginPath();
  c.moveTo(ix - 52, iy - 46);
  c.quadraticCurveTo(ix - 40, iy - 66, ix - 22, iy - 70);
  c.lineTo(ix + 22, iy - 70);
  c.quadraticCurveTo(ix + 40, iy - 66, ix + 52, iy - 46);
  c.closePath();
  c.fill();
  c.fillRect(ix - 20, iy - 92, 40, 24);
  c.save();
  c.translate(ix + 2, iy - 80);
  c.rotate(o.penRot);
  c.beginPath();
  c.roundRect(-5, -190, 10, 200, 5);
  c.fill();
  c.restore();
  // the lamp's rim on the bottle's shoulder nearest the light (upper right)
  c.strokeStyle = withAlpha(P.rim, 0.28);
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(ix + 60, iy - 30);
  c.quadraticCurveTo(ix + 46, iy - 62, ix + 22, iy - 70);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- inputs and threads
export function inputKnot(c: C, o: { x: number; y: number; on: number; r?: number }, env: PaintEnv) {
  const r = o.r ?? 10;
  const P = env.mood;
  const on = clamp01(o.on);
  if (on > 0.01) {
    glow(c, o.x, o.y, r * 5, P.halo, 0.35 * on);
    glow(c, o.x, o.y, r * 1.8, P.core, 0.8 * on);
  }
  c.save();
  // a wound knot: an ink bead with a bound collar; its heart lights when the input is 1
  c.fillStyle = P.ink;
  c.beginPath();
  c.arc(o.x, o.y, r, 0, Math.PI * 2);
  c.fill();
  c.fillRect(o.x + r * 0.6, o.y - r * 0.35, r * 0.7, r * 0.7);
  c.fillStyle = on > 0.5 ? P.core : mixLab(P.set, P.ink, 0.45);
  c.beginPath();
  c.arc(o.x - r * 0.08, o.y, r * 0.52, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export interface PlateThreadOpts {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  sag?: number;
  /** carries a signal 0..1 (a warm line) */
  on?: number;
  w?: number;
  alpha?: number;
  /** 0..1 drawn portion */
  draw?: number;
}
export function threadAt(o: Pick<PlateThreadOpts, 'x0' | 'y0' | 'x1' | 'y1' | 'sag'>, u: number) {
  const cx = (o.x0 + o.x1) / 2;
  const cy = (o.y0 + o.y1) / 2 + 2 * (o.sag ?? 0);
  const v = 1 - u;
  return { x: v * v * o.x0 + 2 * v * u * cx + u * u * o.x1, y: v * v * o.y0 + 2 * v * u * cy + u * u * o.y1 };
}
export function plateThread(c: C, o: PlateThreadOpts, env: PaintEnv) {
  const P = env.mood;
  const d = clamp01(o.draw ?? 1);
  if (d <= 0.002) return;
  const cx = (o.x0 + o.x1) / 2;
  const cy = (o.y0 + o.y1) / 2 + 2 * (o.sag ?? 0);
  const path = () => {
    c.beginPath();
    c.moveTo(o.x0, o.y0);
    if (d >= 0.999) c.quadraticCurveTo(cx, cy, o.x1, o.y1);
    else {
      const qx = o.x0 + (cx - o.x0) * d, qy = o.y0 + (cy - o.y0) * d;
      const p = threadAt(o, d);
      c.quadraticCurveTo(qx, qy, p.x, p.y);
    }
  };
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.lineCap = 'round';
  c.strokeStyle = P.ink;
  c.lineWidth = o.w ?? 2.2;
  path();
  c.stroke();
  const on = clamp01(o.on ?? 0);
  if (on > 0.01) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(P.halo, 0.16 * on);
    c.lineWidth = (o.w ?? 2.2) * 4.5;
    path();
    c.stroke();
    c.strokeStyle = withAlpha(P.core, 0.4 * on);
    c.lineWidth = (o.w ?? 2.2) * 0.7;
    path();
    c.stroke();
  }
  c.restore();
}

/** type set in ink on the plate (no plate behind it: the paper is the plate) */
export function inkText(c: C, text: string, x: number, y: number, o: { size?: number; font?: string; italic?: boolean; weight?: number; align?: CanvasTextAlign; alpha?: number; tracking?: number; /** thicken the strokes (px of ink outline) */ stroke?: number }, env: PaintEnv) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = env.mood.ink;
  c.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 400} ${o.size ?? 26}px ${o.font ?? FONT.text}`;
  c.textAlign = o.align ?? 'center';
  c.textBaseline = 'alphabetic';
  if (o.tracking) (c as C & { letterSpacing: string }).letterSpacing = `${o.tracking}px`;
  if (o.stroke) {
    c.strokeStyle = env.mood.ink;
    c.lineWidth = o.stroke;
    c.lineJoin = 'round';
    c.strokeText(text, x, y);
  }
  c.fillText(text, x, y);
  c.restore();
}

/** a small hand-ruled tally (|, ||) under a lantern */
export function tally(c: C, n: number, x: number, y: number, env: PaintEnv, alpha = 1) {
  if (n <= 0 || alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= alpha;
  c.strokeStyle = env.mood.ink;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  const w = 11;
  const x0 = x - ((n - 1) * w) / 2;
  for (let i = 0; i < n; i++) {
    const jx = (hash1(i, 5) - 0.5) * 2;
    c.beginPath();
    c.moveTo(x0 + i * w + jx, y - 12);
    c.lineTo(x0 + i * w - jx, y + 12);
    c.stroke();
  }
  c.restore();
}
