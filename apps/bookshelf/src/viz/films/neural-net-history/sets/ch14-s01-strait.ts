/**
 * ch14 (Two Shores) — the shared strait for ch14-s01 … ch14-s04b (one animator's group).
 *
 * WINDOW RULE: the strait is always seen THROUGH the study window. Its frame and mullions sit at the frame's edges
 * as a faint occluder (ink with candleAmber rim hairlines only, never crossing the centre). The candles, a match
 * and the narrator's hands appear only as a REFLECTION in the glass, on one plane (the L2 depth), rippled.
 * Staging: two skylines of equal height, equal mass and identical warmth face each other across dark water, left
 * and right, mirror-balanced; generic paper-cut cities (towers, a bridge, hills), no landmarks, flags or emblems;
 * their lit windows flicker on the same rhythm. From the centre of the near bank a jetty runs out; on its end a Go
 * board on a low stand, a lantern on a post, a stone bowl each side.
 *
 *   strait(f, o)              backlight · L1 hills · L2 both cities + water + reflections · fog · L3 jetty, board,
 *                             post lantern · (o.l4: the action plane) · rim · practicals · L5 near bank
 *   windowFrame(f, o)         the study window as a screen-locked near occluder (k = 1: mullions at the edges;
 *                             k < 1 in ch14-s01's push-through)
 *   glassReflection(f, o)     an offscreen sheet of the study (candleAmber) composited on the L2 plane: dark pass
 *                             + light pass, banded ripple, soft vignette; flames added as glows
 *   reflCandle(c, o, env)     a belief candle for the reflection (CANDLE-CLOCK RULE, legible lettering)
 *   stoneHand(c, env, o)      a forearm from a shore's side setting a Go stone
 *   BOARD / boardPoint / drawBoard   the Go board at the jetty's end and its stones
 *
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at 6 px per ring (270 px at
 * s = 1), its flame on the top ring and a small tag at its base giving the year it was lit; it burns down one ring
 * per year; the burned wax stays above the stub as a ghost sleeve (sleeve + stub = full lit height).
 */
import type { Camera3, Frame, LayerSpec, PaintEnv, Palette } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { MOODS, makeEnv, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1, vnoise } from '../../../film/core/frame';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';
import { clamp01, lerp, sm, tq12, win } from './ch02-s05b-util';

export { clamp01, lerp, sm, tq12, win };
export { monotone } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;
export type P = { x: number; y: number };
export const h01 = (i: number, s: number) => hash1(i, s) * 0.5 + 0.5;

// ===================================================================================================== geometry
/** the water line on the L2 plane (rest-screen stage px) */
export const HZ = 410;
/** the cities' water edges (L2): the open strait lies between */
export const XE = { L: 492, R: 788 } as const;
/** the Go board at the jetty's end (L3 plane) */
/** the Go board at the jetty's end (L3 plane): a goban whose top is tilted ~25° toward camera so its lit grid face
 *  reads at wide scale. base = where its feet stand on the deck; the top plane runs yBack → yFront */
export const BOARD = { x: 640, y: 494, base: 494, yBack: 466, yFront: 483, wBack: 56, wFront: 64, thick: 6, legs: 4 } as const;
export const JETTY = { endY: 490, endHalf: 58, nearY: 1060, nearHalf: 300 } as const;
export const POST = { x: 694, top: 392, lx: 682, ly: 404 } as const;
/** the reflection plane (the L2 depth, its own sharp pass so lettering stays legible) */
export const REFL: LayerSpec = { id: 'ch14Refl', z: LAYERS.L2.z, haze: 0, blur: 0.5 };
/** the study window frame: screen-locked near occluder, blurred */
export const WIN_SPEC: LayerSpec = { id: 'ch14Win', z: Infinity, haze: 0, blur: 2.5 };
/** a near-shore plane in front of the jetty end (quays, lecterns, figures) */
export const QUAY_Y = 600;

// ===================================================================================================== the cities
interface Bld {
  x: number;
  w: number;
  h: number;
  crown: number;
  back: boolean;
  i: number;
}
interface CityGeom {
  front: Path2D;
  back: Path2D;
  lights: Path2D;
  lightPts: P[];
  bridge: Path2D;
  cables: Path2D;
  /** the nearest band at the waterline: low quay sheds and warehouses, darker and crisp */
  near: Path2D;
  nearLights: Path2D;
}
function envH(d: number) {
  return 0.13 + 0.87 * sm((d - 20) / 330) * (1 - 0.3 * sm((d - 760) / 520));
}
function buildings(side: -1 | 1, seed: number): Bld[] {
  const out: Bld[] = [];
  for (const back of [true, false]) {
    let d = back ? 40 : 6;
    let i = back ? 500 : 0;
    while (d < 1500) {
      const r = (k: number) => h01(i, seed + k * 17 + (back ? 7 : 0));
      const w = (back ? 22 : 15) + (back ? 34 : 28) * r(1);
      let h = 238 * envH(d + w / 2) * (0.52 + 0.48 * r(2));
      if (r(3) > 0.86 && d > 120) h *= 1.22;
      if (back) h *= 1.14;
      const x = side < 0 ? XE.L - d - w : XE.R + d;
      out.push({ x, w, h, crown: Math.floor(r(4) * 5), back, i });
      d += w + (r(5) < 0.35 ? 2 + 7 * r(6) : 0.5);
      i++;
    }
  }
  return out;
}
const cityCache = new Map<number, CityGeom>();
function cityGeom(side: -1 | 1): CityGeom {
  const key = side;
  const hit = cityCache.get(key);
  if (hit) return hit;
  const seed = side < 0 ? 1401 : 1402;
  const front = new Path2D();
  const back = new Path2D();
  const lights = new Path2D();
  const lightPts: P[] = [];
  for (const b of buildings(side, seed)) {
    const p = b.back ? back : front;
    const top = HZ - b.h;
    const x0 = b.x, x1 = b.x + b.w;
    p.rect(x0, top, b.w, b.h + 8);
    // crowns: flat, setback, spire, slant, mast
    if (b.crown === 1 && b.w > 20) {
      p.rect(x0 + b.w * 0.18, top - 12, b.w * 0.64, 12.5);
      p.rect(x0 + b.w * 0.34, top - 22, b.w * 0.32, 10.5);
    } else if (b.crown === 2) {
      p.moveTo(x0 + b.w * 0.3, top + 0.5);
      p.lineTo(x0 + b.w * 0.5, top - 26 - b.h * 0.08);
      p.lineTo(x0 + b.w * 0.7, top + 0.5);
      p.closePath();
    } else if (b.crown === 3) {
      const up = side < 0 ? 1 : -1;
      p.moveTo(x0, top + 0.5);
      p.lineTo(up > 0 ? x0 : x1, top - 14);
      p.lineTo(up > 0 ? x1 : x0, top + 0.5);
      p.closePath();
    } else if (b.crown === 4 && b.h > 120) {
      p.rect(x0 + b.w * 0.5 - 0.8, top - 30, 1.6, 30.5);
    }
    // windows (front rank and a few on the back): small grid, lit by a hash
    const cw = 5, rh = 8;
    const cols = Math.floor((b.w - 5) / cw);
    const rows = Math.floor((b.h - 16) / rh);
    const ox = x0 + (b.w - cols * cw) / 2 + 1;
    for (let r = 0; r < rows; r++) {
      if (h01(r + b.i * 31, seed + 3) > (b.back ? 0.3 : 0.55)) continue;
      for (let q = 0; q < cols; q++) {
        if (h01(q + r * 7 + b.i * 131, seed + 5) > (b.back ? 0.25 : 0.42)) continue;
        const wx = ox + q * cw, wy = top + 7 + r * rh;
        lights.rect(wx, wy, 1.9, 2.8);
        if (!b.back && lightPts.length < 900) lightPts.push({ x: wx + 1, y: wy + 1.4 });
      }
    }
  }
  // a low suspension bridge on each shore, over an inlet near the outer edge (mirror placed)
  const bridge = new Path2D();
  const cables = new Path2D();
  const a = side < 0 ? XE.L - 760 : XE.R + 520;
  const b2 = a + 240;
  const deckY = HZ - 14;
  bridge.rect(a - 10, deckY, 260, 4);
  for (const tx of [a + 40, a + 200]) {
    bridge.rect(tx - 3, deckY - 46, 6, 50);
    bridge.rect(tx - 5, deckY - 30, 10, 2.5);
  }
  cables.moveTo(a - 10, deckY);
  cables.quadraticCurveTo(a + 40, deckY - 40, a + 40, deckY - 46);
  cables.quadraticCurveTo(a + 120, deckY - 6, a + 200, deckY - 46);
  cables.quadraticCurveTo(a + 200, deckY - 40, b2 + 10, deckY);
  for (let x = a + 52; x < a + 192; x += 10) {
    const u = (x - (a + 40)) / 160;
    const cy = deckY - 46 + 40 * (1 - Math.pow(2 * u - 1, 2));
    cables.moveTo(x, cy);
    cables.lineTo(x, deckY);
  }
  // the near band: low sheds, warehouses and cranes along the quay (≈ 20% of the skyline's height), mirror placed
  const near = new Path2D();
  const nearLights = new Path2D();
  {
    let d = -6;
    let i = 900;
    while (d < 1500) {
      const r = (k: number) => h01(i, seed + 300 + k * 13);
      const w = 26 + 46 * r(1);
      const h = 18 + 30 * r(2) * (0.6 + 0.4 * sm((d - 20) / 200));
      const x = side < 0 ? XE.L + 30 - d - w : XE.R - 30 + d;
      const top = HZ + 3 - h;
      near.rect(x, top, w, h + 4);
      // a pitched shed roof or a flat warehouse with a vent
      if (r(3) > 0.55) {
        near.moveTo(x - 1, top + 0.5);
        near.lineTo(x + w / 2, top - 7 - 5 * r(4));
        near.lineTo(x + w + 1, top + 0.5);
        near.closePath();
      } else if (r(3) > 0.3) near.rect(x + w * 0.2, top - 4, 6, 4.5);
      // a quay crane now and then (a mast and a jib reaching over the water)
      if (r(5) > 0.86 && d > 60) {
        const mx = x + w * 0.5;
        near.rect(mx - 1.2, top - 40, 2.4, 40.5);
        const jx = side < 0 ? 1 : -1;
        near.rect(Math.min(mx, mx + jx * 34), top - 40, 34, 2);
      }
      // a few lit windows in a row
      for (let q = 0; q < Math.floor(w / 9); q++) if (h01(q + i * 7, seed + 333) < 0.28) nearLights.rect(x + 4 + q * 9, top + h * 0.45, 2.4, 3);
      d += w + (r(6) < 0.4 ? 3 + 10 * r(7) : 0.5);
      i++;
    }
  }
  const g = { front, back, lights, lightPts, bridge, cables, near, nearLights };
  cityCache.set(key, g);
  return g;
}

/** far hills on the L1 plane, both shores mirror balanced */
function hillsPath(side: -1 | 1): Path2D {
  const p = new Path2D();
  const x0 = side < 0 ? -700 : 1980;
  const xe = side < 0 ? 470 : 810;
  p.moveTo(x0, HZ + 6);
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(x0, xe, u);
    const d = 1 - u;
    const h = 22 + 78 * sm(d * 1.4) * (0.75 + 0.25 * vnoise(u * 7 + (side < 0 ? 0 : 0.5), side < 0 ? 31 : 37));
    p.lineTo(x, HZ - h + 6);
  }
  p.lineTo(xe, HZ + 6);
  p.closePath();
  return p;
}
const HILLS = { L: hillsPath(-1), R: hillsPath(1) };

// ===================================================================================================== paint
export interface StraitOpts {
  /** cache key prefix (include the shot id) */
  key: string;
  /** the mood palette id used for cached art (pass the shot's mood; never a crossfade) */
  moodKey: string;
  sunX?: number;
  sunI?: number;
  /** window-light multiplier for both shores (identical) */
  lit?: number;
  /** jetty, board and post lantern (default true) */
  jetty?: boolean;
  /** board stones: [col, row, colour] */
  stones?: Array<[number, number, 'b' | 'w']>;
  /** a stone being set (drawn by the hand) */
  l2?: (c: C, env: PaintEnv) => void;
  /** drawn after the L2 water (still L2): e.g. reflections handled by the shot */
  afterL2?: () => void;
  l3?: (c: C, env: PaintEnv) => void;
  /** drawn on L3 before the jetty (things beyond the jetty end, e.g. the fence's far pages) */
  l3back?: (c: C, env: PaintEnv) => void;
  l4?: (c: C, env: PaintEnv) => void;
  /** after the rim pass (L4 lights) */
  afterL4?: () => void;
  l5?: (c: C, env: PaintEnv) => void;
  /** post lantern intensity (0 = unlit) */
  lantern?: number;
  /** a brief flare of the post lantern (0..1: +0.25 intensity at 1), e.g. when a stone lands */
  flare?: number;
  /** world hidden: skip everything but the backlight and water (s03 close-up) */
  cityAlpha?: number;
  rimDir?: P;
}

/** the shared rhythm on which every lit window in both cities breathes (identical on both shores) */
export function windowPulse(t: number) {
  return 0.86 + 0.08 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.3 + 1.1);
}

export function strait(f: Frame, o: StraitOpts) {
  const t = f.t;
  const lit = o.lit ?? 1;
  const ca = o.cityAlpha ?? 1;
  f.backlight({ sunX: o.sunX ?? 640, sunY: HZ - 6, sunRadius: 760, intensity: o.sunI ?? 1 });
  // L1: far hills, both shores, the same value
  f.layer('L1', (c, env) => {
    const draw = f.cached(`${o.key}-hills-${o.moodKey}`, 2720, 140, (cc) => {
      cc.translate(720, -(HZ - 120));
      cc.fillStyle = env.fill('set');
      cc.fill(HILLS.L);
      cc.fill(HILLS.R);
    });
    c.save();
    c.globalAlpha = ca;
    draw(c, -720, HZ - 120);
    c.restore();
  });
  // L2: the two cities (cached), their lights on one breathing rhythm, the water and the reflections in it
  f.layer('L2', (c, env) => {
    const m = env.mood;
    const X0 = -720, Y0 = 120, W = 2720, H = 300;
    if (ca > 0.001) {
      const solid = f.cached(`${o.key}-city-${o.moodKey}`, W, H, (cc) => {
        cc.translate(-X0, -Y0);
        cc.fillStyle = mixLab(env.fill('set'), m.haze, 0.38);
        for (const s of [-1, 1] as const) cc.fill(cityGeom(s).back);
        cc.fillStyle = env.fill('set');
        for (const s of [-1, 1] as const) {
          const g = cityGeom(s);
          cc.fill(g.front);
          cc.fill(g.bridge);
          cc.strokeStyle = env.fill('set');
          cc.lineWidth = 1.1;
          cc.stroke(g.cables);
        }
        // tops only catch the dawn (a hairline)
        cc.fillStyle = withAlpha(m.rim, 0.1);
        cc.fillRect(X0, HZ - 1, W, 1);
        // the near band at the waterline: darker ink, crisp, its roofs rimmed
        cc.fillStyle = mixLab(m.ink, env.fill('set'), 0.22);
        for (const s of [-1, 1] as const) cc.fill(cityGeom(s).near);
      });
      const lights = f.cached(`${o.key}-lights-${o.moodKey}`, W, H, (cc) => {
        cc.translate(-X0, -Y0);
        cc.fillStyle = mixLab(m.core, m.halo, 0.25);
        for (const s of [-1, 1] as const) cc.fill(cityGeom(s).lights);
        for (const s of [-1, 1] as const) cc.fill(cityGeom(s).nearLights);
      });
      // the cities' reflection on the water: the cached solid flipped, faint
      c.save();
      c.globalAlpha = ca;
      solid(c, X0, Y0);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = ca * 0.75 * lit * windowPulse(t);
      lights(c, X0, Y0);
      c.restore();
    }
    // water: from the horizon (it mirrors the dawn) to the dark near water
    const sea = c.createLinearGradient(0, HZ, 0, 980);
    sea.addColorStop(0, mixLab(m.sky[3], m.haze, 0.35));
    sea.addColorStop(0.06, mixLab(m.sky[2], m.set, 0.35));
    sea.addColorStop(0.3, mixLab(m.set, m.fg, 0.35));
    sea.addColorStop(1, mixLab(m.fg, m.ink, 0.5));
    c.fillStyle = sea;
    c.fillRect(-900, HZ, 3100, 700);
    if (ca > 0.001) {
      // the shores' lights trembling on the water (identical rhythm both sides)
      const pulse = windowPulse(t) * lit * ca;
      c.save();
      c.globalCompositeOperation = 'lighter';
      // short vertical shimmer streaks under each shore, broken by the ripple (one rhythm on both shores: the same
      // index pattern is mirrored, so left and right breathe together)
      c.fillStyle = withAlpha(m.halo, 1);
      for (const s of [-1, 1] as const) {
        const pts = cityGeom(s).lightPts;
        for (let i = 0; i < pts.length; i += 3) {
          const p = pts[i];
          const y0 = HZ + 6 + (HZ - p.y) * 0.32;
          const len = 3 + 6 * h01(i, 77);
          const k = 0.6 + 0.4 * Math.sin(t * 2.1 + i * 0.7);
          c.globalAlpha = 0.15 * pulse * k;
          for (let q = 0; q < 3; q++) {
            const y = y0 + q * (len + 2.5);
            const jx = 1.1 * Math.sin(t * 1.6 + y * 0.21 + i * 0.13);
            c.fillRect(p.x - 0.9 + jx, y, 1.8, len * (1 - q * 0.25));
          }
        }
      }
      c.globalAlpha = 1;
      c.restore();
    }
    // the dawn's glitter path down the middle of the strait
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sx = o.sunX ?? 640;
    for (let i = 0; i < 46; i++) {
      const v = i / 46;
      const y = HZ + 3 + v * v * 120;
      const w = 6 + 60 * v * (0.5 + 0.5 * h01(i, 9));
      const x = sx + (h01(i, 11) - 0.5) * (30 + 120 * v) + 3 * Math.sin(t * 1.3 + i);
      const a = (0.16 + 0.1 * Math.sin(t * 2.6 + i * 1.9)) * (1 - v) * (o.sunI ?? 1);
      c.fillStyle = withAlpha(m.rim, Math.max(0, a));
      c.fillRect(x - w / 2, y, w, 1 + v * 1.5);
    }
    c.restore();
    o.l2?.(c, env);
  });
  o.afterL2?.();
  f.fog({ yCenter: HZ + 14, height: 120, alpha: 0.34, drift: 5 });
  // L3: the jetty, the Go board on its stand, the post lantern
  f.layer('L3', (c, env) => {
    o.l3back?.(c, env);
    if (o.jetty !== false) jettyArt(f, c, env, o);
    o.l3?.(c, env);
  });
  if (o.jetty !== false && (o.lantern ?? 1) > 0) {
    f.practical({ x: POST.lx, y: POST.ly + 2, kind: 'lamp', seed: 1414, intensity: 0.62 * (o.lantern ?? 1) + 0.25 * (o.flare ?? 0), radius: 22 + 10 * (o.flare ?? 0), layer: 'L3' });
  }
  f.fog('B');
  if (o.l4) {
    f.layer('L4', (c, env) => o.l4!(c, env));
    f.rim(o.rimDir ?? { x: 0, y: -1 });
  }
  o.afterL4?.();
  f.layer('L5', (c, env) => {
    // the near bank below the window: a dark grassy lip, the jetty's root
    const draw = f.cached(`${o.key}-near-${o.moodKey}`, 2300, 560, (cc) => {
      cc.translate(500, -560);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(-500, 1120);
      cc.lineTo(-500, 712);
      for (let i = 0; i <= 108; i++) {
        const x = -500 + i * 21.25;
        const y = 704 + 10 * vnoise(i * 0.4, 5) + (Math.abs(x - 640) < 200 ? 6 : 0);
        cc.lineTo(x, y - (h01(i, 3) > 0.7 ? 7 : 0));
      }
      cc.lineTo(1800, 1120);
      cc.closePath();
      cc.fill();
    });
    draw(c, -500, 560);
    o.l5?.(c, env);
  });
}

function jettyArt(f: Frame, c: C, env: PaintEnv, o: StraitOpts) {
  const m = env.mood;
  const J = JETTY;
  const draw = f.cached(`${o.key}-jetty-${o.moodKey}`, 700, 620, (cc) => {
    cc.translate(-290, -440);
    const deck = env.fill('ink');
    // pilings under the deck, receding
    cc.fillStyle = mixLab(deck, env.fill('set'), 0.2);
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const y = lerp(J.endY, 760, u * u);
      const hw = lerp(J.endHalf, J.endHalf + (J.nearHalf - J.endHalf) * ((760 - J.endY) / (J.nearY - J.endY)), u * u) * 0.92;
      const pw = 2.2 + 6 * u;
      const ph = 10 + 40 * u;
      cc.fillRect(640 - hw, y, pw, ph);
      cc.fillRect(640 + hw - pw, y, pw, ph);
    }
    // the deck: a trapezoid of planks
    cc.fillStyle = deck;
    cc.beginPath();
    cc.moveTo(640 - J.endHalf, J.endY);
    cc.lineTo(640 + J.endHalf, J.endY);
    cc.lineTo(640 + J.nearHalf, J.nearY);
    cc.lineTo(640 - J.nearHalf, J.nearY);
    cc.closePath();
    cc.fill();
    // plank seams catching the dawn (thin, faint)
    cc.strokeStyle = withAlpha(m.rim, 0.16);
    cc.lineWidth = 0.8;
    cc.beginPath();
    for (let i = 1; i < 22; i++) {
      const u = i / 22;
      const y = lerp(J.endY, J.nearY, u * u);
      const hw = lerp(J.endHalf, J.nearHalf, u * u);
      cc.moveTo(640 - hw, y);
      cc.lineTo(640 + hw, y);
    }
    cc.stroke();
    cc.fillStyle = withAlpha(m.rim, 0.32);
    cc.fillRect(640 - J.endHalf, J.endY - 0.6, J.endHalf * 2, 1.2);
    // a cut-paper fretwork RAILING along both deck edges, receding (review round 1: filigree on the recurring
    // jetty): posts, a top rail, and pierced diamond fret between them, in perspective
    for (const side of [-1, 1]) {
      const pts: { x: number; y: number; h: number }[] = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const y = lerp(J.endY, J.nearY, u * u);
        const hw = lerp(J.endHalf, J.nearHalf, u * u);
        pts.push({ x: 640 + side * hw, y, h: 6 + 34 * u * u });
      }
      const rail = new Path2D();
      for (let i = 0; i < pts.length; i++) {
        const q = pts[i];
        const pw = 0.8 + 2.6 * (i / 12);
        rail.rect(q.x - pw / 2, q.y - q.h, pw, q.h); // post
        if (i < pts.length - 1) {
          const n = pts[i + 1];
          // top rail segment (a thin quad)
          const th = 0.6 + 2 * (i / 12);
          rail.moveTo(q.x, q.y - q.h);
          rail.lineTo(n.x, n.y - n.h);
          rail.lineTo(n.x, n.y - n.h + th);
          rail.lineTo(q.x, q.y - q.h + th);
          rail.closePath();
          // a diamond of fret between the posts (outline as a thin ring: pierced)
          const mx = (q.x + n.x) / 2;
          const my = (q.y - q.h * 0.5 + n.y - n.h * 0.5) / 2;
          const dx = Math.abs(n.x - q.x) * 0.42 + 0.6;
          const dy = ((q.h + n.h) / 2) * 0.36;
          const ins = 0.62;
          rail.moveTo(mx, my - dy);
          rail.lineTo(mx + dx, my);
          rail.lineTo(mx, my + dy);
          rail.lineTo(mx - dx, my);
          rail.closePath();
          rail.moveTo(mx, my - dy * ins);
          rail.lineTo(mx - dx * ins, my);
          rail.lineTo(mx, my + dy * ins);
          rail.lineTo(mx + dx * ins, my);
          rail.closePath();
        }
      }
      cc.fillStyle = deck;
      cc.fill(rail, 'nonzero');
      cc.strokeStyle = withAlpha(m.rim, 0.22);
      cc.lineWidth = 0.7;
      cc.beginPath();
      pts.forEach((q, i) => (i ? cc.lineTo(q.x, q.y - q.h) : cc.moveTo(q.x, q.y - q.h)));
      cc.stroke();
    }
    // the low stand under the board, the lantern post and its bracket
    cc.fillStyle = deck;
    cc.fillRect(POST.x - 2, POST.top, 4, J.endY - POST.top + 2);
    cc.fillRect(POST.lx - 2, POST.top, POST.x - POST.lx + 4, 2.5);
    cc.fillRect(POST.lx - 0.5, POST.top, 1, POST.ly - POST.top - 5);
  });
  draw(c, 290, 440);
  // the paper lantern on the post (warm: the jetty's own practical)
  const lk = (o.lantern ?? 1) + 0.4 * (o.flare ?? 0);
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(POST.lx - 4.5, POST.ly - 6, 9, 2);
  c.fillRect(POST.lx - 4.5, POST.ly + 8, 9, 2);
  c.fillStyle = lk > 0 ? mixLab(m.halo, m.core, Math.min(1, 0.45 * lk)) : env.fill('set');
  c.beginPath();
  c.ellipse(POST.lx, POST.ly + 2, 5.5, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // its warm streak on the water beside the jetty end
  if (lk > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const y = J.endY + 6 + i * 6;
      c.fillStyle = withAlpha(m.halo, 0.16 * lk * (1 - i / 7));
      c.fillRect(POST.lx + 18 + 2 * Math.sin(env.t * 1.5 + i), y, 10 - i, 1.4);
    }
    c.restore();
  }
  drawBoard(c, env, o.stones ?? []);
}

// ===================================================================================================== the board
/** board-plane point: col/row 0..18 on the tilted top face (row 0 = far edge) */
export function boardPoint(col: number, row: number): P {
  const B = BOARD;
  const v = (row + 1.4) / 20.8;
  const y = lerp(B.yBack, B.yFront, v);
  const w = lerp(B.wBack, B.wFront, v) - 9;
  return { x: B.x + (col / 18 - 0.5) * w, y };
}
const boardGeom = (() => {
  const B = BOARD;
  const top = new Path2D();
  top.moveTo(B.x - B.wBack / 2, B.yBack);
  top.lineTo(B.x + B.wBack / 2, B.yBack);
  top.lineTo(B.x + B.wFront / 2, B.yFront);
  top.lineTo(B.x - B.wFront / 2, B.yFront);
  top.closePath();
  const body = new Path2D();
  body.rect(B.x - B.wFront / 2, B.yFront, B.wFront, B.thick);
  // four short carved feet (two visible pairs)
  for (const sx of [-1, 1]) {
    const fx = B.x + sx * (B.wFront / 2 - 7);
    body.moveTo(fx - 4, B.yFront + B.thick);
    body.lineTo(fx + 4, B.yFront + B.thick);
    body.quadraticCurveTo(fx + 3.4, B.base - 1, fx + 2, B.base);
    body.lineTo(fx - 2, B.base);
    body.quadraticCurveTo(fx - 3.4, B.base - 1, fx - 4, B.yFront + B.thick);
    body.closePath();
  }
  // grid: 6 lines each way across the face (the full 19 would not read at this scale)
  const grid = new Path2D();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const k = (i / (n - 1)) * 18;
    const a = boardPoint(0, k), b = boardPoint(18, k);
    grid.moveTo(a.x, a.y);
    grid.lineTo(b.x, b.y);
    const p = boardPoint(k, 0), q = boardPoint(k, 18);
    grid.moveTo(p.x, p.y);
    grid.lineTo(q.x, q.y);
  }
  // two lidded bowls (go-ke) on the deck at either side: round bodies with domed lids
  const bowls = new Path2D();
  const lids = new Path2D();
  for (const sx of [-1, 1]) {
    const bx = B.x + sx * 45;
    bowls.ellipse(bx, B.base - 5, 8, 5.4, 0, 0, Math.PI * 2);
    bowls.rect(bx - 4, B.base - 1.5, 8, 1.5);
    lids.ellipse(bx, B.base - 9.6, 7.2, 3.2, 0, Math.PI, 0);
    lids.ellipse(bx, B.base - 9.6, 7.2, 1.4, 0, 0, Math.PI);
  }
  return { top, body, grid, bowls, lids };
})();
export function drawBoard(c: C, env: PaintEnv, list: Array<[number, number, 'b' | 'w']>) {
  const m = env.mood;
  const B = BOARD;
  const G = boardGeom;
  const ink = env.fill('ink');
  c.save();
  // a soft contact shadow on the deck
  c.fillStyle = withAlpha(ink, 0.5);
  c.beginPath();
  c.ellipse(B.x, B.base + 0.5, B.wFront / 2 + 4, 2.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ink;
  c.fill(G.body);
  c.fill(G.bowls);
  // the face: pale lit wood, brighter at the far edge where the dawn grazes it
  const face = c.createLinearGradient(0, B.yBack, 0, B.yFront);
  face.addColorStop(0, mixLab(m.rim, m.core, 0.25));
  face.addColorStop(1, mixLab(mixLab(m.haze, m.rim, 0.55), m.set, 0.15));
  c.fillStyle = face;
  c.fill(G.top);
  c.strokeStyle = withAlpha(ink, 0.62);
  c.lineWidth = 0.75;
  c.stroke(G.grid);
  // front edge catches the light; the lids carry a rim on their tops
  c.fillStyle = withAlpha(m.rim, 0.55);
  c.fillRect(B.x - B.wFront / 2, B.yFront - 0.4, B.wFront, 1);
  c.fillStyle = mixLab(ink, m.set, 0.25);
  c.fill(G.lids);
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.ellipse(B.x + sx * 45, B.base - 9.6, 7.2, 3.2, 0, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  }
  c.restore();
  for (const [k, r, col] of [...list].sort((p, q) => p[1] - q[1])) stoneAt(c, env, boardPoint(k, r), col, 1);
}
/** a Go stone on the face: a disc ≥ 7 px across; black stones carry a candleAmber rim, white ones the palest value */
export function stoneAt(c: C, env: PaintEnv, p: P, col: 'b' | 'w', a = 1, glow = 0) {
  const m = env.mood;
  const A = MOODS.candleAmber;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(env.fill('ink'), 0.45);
  c.beginPath();
  c.ellipse(p.x + 0.6, p.y + 1.2, 4, 1.8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col === 'b' ? env.fill('ink') : mixLab('#f6efe2', m.core, 0.18);
  c.beginPath();
  c.ellipse(p.x, p.y - 0.6, 3.9, 2.7, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = col === 'b' ? withAlpha(A.rim, 0.9) : withAlpha(m.ink, 0.35);
  c.lineWidth = col === 'b' ? 1 : 0.6;
  c.beginPath();
  if (col === 'b') c.ellipse(p.x, p.y - 0.6, 3.9, 2.7, 0, Math.PI * 1.05, Math.PI * 1.95);
  else c.ellipse(p.x, p.y - 0.6, 3.9, 2.7, 0, 0, Math.PI * 2);
  c.stroke();
  if (glow > 0) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
    g.addColorStop(0, withAlpha(A.core, 0.55 * glow));
    g.addColorStop(1, withAlpha(A.core, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 12, p.y - 12, 24, 24);
  }
  c.restore();
}
/** the first stones of the chapter's game (right shore black, left shore white) */
export const STONES = {
  r1: [14, 4, 'b'] as [number, number, 'b'],
  l1: [4, 13, 'w'] as [number, number, 'w'],
  r2: [14, 14, 'b'] as [number, number, 'b'],
};

/**
 * A shadow-hand reaching down from one shore's side of the board to set a Go stone: a fading sleeve, a pale cuff,
 * the back of the hand bent at the wrist, the index finger and thumb pinching the stone. It descends toward the
 * board's lit face, sets the stone on u ≈ .5 (a small press) and withdraws. side = which shore it comes from.
 * u is on twos. Returns whether the stone has been set.
 */
export function stoneHand(c: C, env: PaintEnv, o: { side: -1 | 1; u: number; target: P; col: 'b' | 'w'; len?: number }): boolean {
  const U = clamp01(o.u);
  if (U <= 0 || U >= 1) return U >= 0.5;
  const L = o.len ?? 34;
  const m = env.mood;
  const reach = U < 0.42 ? sm(U / 0.42) : U < 0.58 ? 1 : 1 - sm((U - 0.58) / 0.42);
  const press = U >= 0.42 && U < 0.58 ? Math.sin(((U - 0.42) / 0.16) * Math.PI) * 1.4 : 0;
  const away = 1 - reach;
  const tip = { x: o.target.x + o.side * away * L * 2.2, y: o.target.y - 2.4 + press - away * L * 1.5 };
  const ink = env.fill('ink');
  const dir = (a: number, r: number): P => ({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  c.save();
  c.translate(tip.x, tip.y);
  if (o.side > 0) c.scale(-1, 1);
  // local frame: the arm comes from the upper LEFT, the fingertips at the origin
  const ah = 0.95; // hand axis (down-right)
  const aa = 0.55; // forearm axis
  const wr = dir(ah + Math.PI, L * 0.6);
  const back = { x: wr.x - Math.cos(aa) * L * 2.3, y: wr.y - Math.sin(aa) * L * 2.3 };
  const nA = { x: -Math.sin(aa), y: Math.cos(aa) };
  // sleeve: from the wrist back toward its shore, fading out into the haze
  const sg = c.createLinearGradient(wr.x, wr.y, back.x, back.y);
  sg.addColorStop(0, ink);
  sg.addColorStop(0.35, withAlpha(ink, 0.85));
  sg.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = sg;
  const w0 = L * 0.19, w1 = L * 0.27;
  c.beginPath();
  c.moveTo(wr.x - nA.x * w0, wr.y - nA.y * w0);
  c.lineTo(back.x - nA.x * w1, back.y - nA.y * w1);
  c.lineTo(back.x + nA.x * w1, back.y + nA.y * w1);
  c.lineTo(wr.x + nA.x * w0, wr.y + nA.y * w0);
  c.closePath();
  c.fill();
  // cuff: a pale band across the wrist
  c.strokeStyle = mixLab(m.rim, m.set, 0.3);
  c.lineWidth = L * 0.07;
  c.beginPath();
  const cf = { x: wr.x - Math.cos(aa) * L * 0.06, y: wr.y - Math.sin(aa) * L * 0.06 };
  c.moveTo(cf.x - nA.x * w0 * 1.05, cf.y - nA.y * w0 * 1.05);
  c.lineTo(cf.x + nA.x * w0 * 1.05, cf.y + nA.y * w0 * 1.05);
  c.stroke();
  // the hand: palm + knuckles (a rounded wedge), curled fingers under, index finger and thumb to the stone
  const nH = { x: -Math.sin(ah), y: Math.cos(ah) };
  const kn = dir(ah + Math.PI, L * 0.24);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(wr.x - nH.x * L * 0.15, wr.y - nH.y * L * 0.15);
  c.quadraticCurveTo(kn.x - nH.x * L * 0.2, kn.y - nH.y * L * 0.2, kn.x - nH.x * L * 0.05, kn.y - nH.y * L * 0.05);
  // index finger to the tip (upper side)
  c.lineTo(-nH.x * L * 0.03, -nH.y * L * 0.03);
  c.quadraticCurveTo(nH.x * L * 0.02 + dir(ah, L * 0.03).x, nH.y * L * 0.02 + dir(ah, L * 0.03).y, nH.x * L * 0.04, nH.y * L * 0.04);
  c.lineTo(kn.x + nH.x * L * 0.06, kn.y + nH.y * L * 0.06);
  // curled fingers (a knuckled bump under the palm)
  c.quadraticCurveTo(kn.x + nH.x * L * 0.22 + dir(ah, L * 0.02).x, kn.y + nH.y * L * 0.22, kn.x + nH.x * L * 0.2 - dir(ah, L * 0.12).x, kn.y + nH.y * L * 0.2 - dir(ah, L * 0.12).y);
  c.lineTo(wr.x + nH.x * L * 0.15, wr.y + nH.y * L * 0.15);
  c.closePath();
  c.fill();
  // thumb: from the palm's lower side forward to meet the index finger at the stone
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = L * 0.085;
  c.beginPath();
  const th0 = { x: wr.x + dir(ah, L * 0.16).x + nH.x * L * 0.1, y: wr.y + dir(ah, L * 0.16).y + nH.y * L * 0.1 };
  c.moveTo(th0.x, th0.y);
  c.quadraticCurveTo(nH.x * L * 0.2 - dir(ah, L * 0.12).x, nH.y * L * 0.2 - dir(ah, L * 0.12).y, nH.x * L * 0.07, nH.y * L * 0.07);
  c.stroke();
  // a rim on the back of the hand and the top of the sleeve (the dawn catches the upper contour only)
  c.strokeStyle = withAlpha(m.rim, 0.55);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(wr.x - nH.x * L * 0.15, wr.y - nH.y * L * 0.15);
  c.quadraticCurveTo(kn.x - nH.x * L * 0.2, kn.y - nH.y * L * 0.2, kn.x - nH.x * L * 0.05, kn.y - nH.y * L * 0.05);
  c.lineTo(-nH.x * L * 0.03, -nH.y * L * 0.03);
  c.stroke();
  const rg = c.createLinearGradient(wr.x, wr.y, back.x, back.y);
  rg.addColorStop(0, withAlpha(m.rim, 0.45));
  rg.addColorStop(0.5, withAlpha(m.rim, 0));
  c.strokeStyle = rg;
  c.beginPath();
  c.moveTo(wr.x - nA.x * w0, wr.y - nA.y * w0);
  c.lineTo(back.x - nA.x * w1, back.y - nA.y * w1);
  c.stroke();
  c.restore();
  if (U < 0.5) stoneAt(c, env, { x: tip.x, y: tip.y + 1.6 }, o.col, 1);
  return U >= 0.5;
}

// ===================================================================================================== window frame
export interface WindowOpts {
  /** scale about the frame centre (1 = mullions at the frame edges) */
  k?: number;
  ox?: number;
  oy?: number;
  /** extra glass art (study reflections) in the centre light, window coords */
  glass?: (c: C, env: PaintEnv) => void;
  /** overall alpha (default 1) */
  alpha?: number;
}
/** the study window, as a near occluder. Authored at k = 1: the centre light spans x 75…1205 (the mullions sit at
 *  the frame's edges); the transom and sill lie far above and below the frame, so they show only at small k */
export function windowFrame(f: Frame, o: WindowOpts = {}) {
  const k = o.k ?? 1;
  f.layer(WIN_SPEC, (c, env) => {
    const A = MOODS.candleAmber;
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    c.translate(640 + (o.ox ?? 0), 360 + (o.oy ?? 0));
    c.scale(k, k);
    c.translate(-640, -360);
    o.glass?.(c, env);
    const ink = mixLab(env.mood.fg, A.fg, 0.5);
    c.fillStyle = ink;
    const T = -1150, B = 1150 + 720;
    // centre mullions (the edges of the light we look through)
    c.fillRect(22, T, 54, B - T);
    c.fillRect(1204, T, 54, B - T);
    // the side lights: glass with glazing bars, then the casing and the dark study wall
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -610 : 1258;
      const x1 = s < 0 ? 22 : 1890;
      const mid = (x0 + x1) / 2;
      c.fillRect(mid - 7, T, 14, B - T);
      for (const y of [T + (B - T) / 3, T + (2 * (B - T)) / 3]) c.fillRect(x0, y - 7, x1 - x0, 14);
      c.fillRect(s < 0 ? -3600 : 1890, -3000, 3000 - 290, 7000);
    }
    c.fillRect(-3600, -4000, 8000, 4000 + T);
    c.fillRect(-3600, B, 8000, 4000);
    // the sill's lip
    c.fillRect(-640, B - 30, 2560, 30);
    // candleAmber hairlines on the inner edges (the room's lamp behind us catches them)
    c.fillStyle = withAlpha(A.rim, 0.32);
    c.fillRect(75, T, 1.2, B - T);
    c.fillRect(1203.8, T, 1.2, B - T);
    c.restore();
  });
}

// ===================================================================================================== reflection
export interface ReflOpts {
  key: string;
  /** the sheet's extent on the L2 plane (rest-screen px) */
  rect: { x: number; y: number; w: number; h: number };
  /** sheet resolution (device px per stage px): pxScale × the largest on-screen scale */
  res: number;
  /** dark pass alpha (≈ .35) */
  alpha: number;
  /** light pass alpha (lit paper, flames, lettering) */
  light?: number;
  /** ripple amplitude (stage px) */
  ripple?: number;
  /** vignette centre/radii (L2 px): the reflection fades out toward the room's dark corners */
  fade?: { cx: number; cy: number; r0: number; r1: number };
  /** draw the study (candleAmber) in L2 coordinates */
  draw: (c: C, env: PaintEnv) => void;
  /** flame glows (L2 coords) added after the composite: rippled with the glass */
  glows?: Array<{ x: number; y: number; r: number; a: number }> | (() => Array<{ x: number; y: number; r: number; a: number }>);
}
const sheets = new Map<string, HTMLCanvasElement>();
export function reflEnv(f: Frame): PaintEnv {
  return makeEnv({ mood: 'candleAmber', layer: 'L4', t: f.t, fps: f.fps, pxScale: f.pxScale, seed: f.seed, frame: f.frame });
}
export function glassReflection(f: Frame, o: ReflOpts) {
  const R = o.rect;
  const W = Math.ceil(R.w * o.res), H = Math.ceil(R.h * o.res);
  const k = `${o.key}|${W}x${H}`;
  let cv = sheets.get(k);
  if (!cv) {
    cv = makeCanvas(W, H);
    sheets.set(k, cv);
    if (sheets.size > 3) sheets.delete(sheets.keys().next().value as string);
  }
  const g = cv.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, W, H);
  g.setTransform(o.res, 0, 0, o.res, -R.x * o.res, -R.y * o.res);
  const env = reflEnv(f);
  o.draw(g, env);
  if (o.fade) {
    g.globalCompositeOperation = 'destination-in';
    const fd = o.fade;
    const rg = g.createRadialGradient(fd.cx, fd.cy, fd.r0, fd.cx, fd.cy, fd.r1);
    rg.addColorStop(0, 'rgba(0,0,0,1)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(R.x, R.y, R.w, R.h);
    g.globalCompositeOperation = 'source-over';
  }
  const t = f.t;
  const amp = o.ripple ?? 1.2;
  const band = 4;
  const dxAt = (y: number) => amp * Math.sin(y * 0.071 + t * 1.45) + amp * 0.45 * vnoise(y * 0.05 + t * 0.7, 9);
  f.layer(REFL, (c) => {
    c.save();
    const pass = (alpha: number, op: GlobalCompositeOperation) => {
      if (alpha <= 0.001) return;
      c.globalAlpha = alpha;
      c.globalCompositeOperation = op;
      for (let y = 0; y < R.h; y += band) {
        const hh = Math.min(band, R.h - y);
        c.drawImage(cv!, 0, Math.floor(y * o.res), W, Math.max(1, Math.floor(hh * o.res)), R.x + dxAt(R.y + y), R.y + y, R.w, hh);
      }
    };
    pass(o.alpha, 'source-over');
    pass(o.light ?? 0, 'lighter');
    if (o.glows) {
      c.globalCompositeOperation = 'lighter';
      const m = env.mood;
      for (const gl of typeof o.glows === 'function' ? o.glows() : o.glows) {
        if (gl.a <= 0.002) continue;
        const x = gl.x + dxAt(gl.y);
        const rg = c.createRadialGradient(x, gl.y, 0, x, gl.y, gl.r);
        rg.addColorStop(0, withAlpha(m.core, 0.62 * gl.a));
        rg.addColorStop(0.22, withAlpha(m.halo, 0.3 * gl.a));
        rg.addColorStop(1, withAlpha(m.halo, 0));
        c.globalAlpha = 1;
        c.fillStyle = rg;
        c.fillRect(x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
      }
    }
    c.restore();
  });
}

// ===================================================================================================== reflection props
export const RING = 6;
export const RINGS = 45;
export interface ReflCandle {
  x: number;
  y: number;
  s: number;
  /** lettering lines (IBM Plex Mono small caps; paraphrase, no quotation marks) */
  lines: string[];
  tag: string;
  rings: number;
  state: 'live' | 'out' | 'unlit';
  /** 0..1 flame strength */
  flame?: number;
  /** flame lean (px at s = 1, + = right) */
  lean?: number;
  /** lettering alpha */
  letters?: number;
  /** a rim of light up the sleeve (0..1) */
  sleeveGlow?: number;
  smoke?: number;
  seed?: number;
  /** the lettering catches the flame: an additive second pass (0..1) */
  letterGlow?: number;
  /** lettering size multiplier */
  letterSize?: number;
  /** 'pale': the stub is cold pale wax (dark lettering), lit from the side by `sideLight`; its burned rings stand
   *  above it as a DARK ghost sleeve. Default 'ink' (the silhouette candle). */
  wax?: 'ink' | 'pale';
  /** a neighbouring flame lighting the stub from one side (stage x of the flame, strength 0..1) */
  sideLight?: { x: number; k: number };
}
export function candleFlameAt(o: ReflCandle): P {
  return { x: o.x + (o.lean ?? 0) * o.s * 1.1, y: o.y - (RINGS - o.rings) * RING * o.s - 2 * o.s };
}
/** a belief candle drawn for the glass (wider than the shelf's so its lettering reads at macro distance) */
export function reflCandle(c: C, o: ReflCandle, env: PaintEnv) {
  const m = env.mood;
  const s = o.s;
  const w = 38 * s;
  const H = RINGS * RING * s;
  const top = o.y - H;
  const stubTop = top + o.rings * RING * s;
  const x0 = o.x - w / 2;
  const ink = env.fill('ink');
  c.save();
  const pale = o.wax === 'pale';
  // ghost sleeve
  if (o.rings > 0) {
    const out = o.state === 'out';
    c.fillStyle = pale ? withAlpha(mixLab(ink, m.set, 0.3), out ? 0.92 : 0.8) : out ? withAlpha(mixLab(ink, m.set, 0.35), 0.85) : withAlpha(mixLab(m.haze, m.halo, 0.5), 0.45);
    c.fillRect(x0, top, w, stubTop - top);
    c.strokeStyle = withAlpha(m.rim, out ? 0.3 : 0.45);
    c.lineWidth = 1 * s;
    c.strokeRect(x0, top, w, stubTop - top);
    c.beginPath();
    for (let i = 1; i < o.rings; i++) {
      const y = top + i * RING * s;
      c.moveTo(x0 + 2 * s, y);
      c.lineTo(x0 + w - 2 * s, y);
    }
    c.stroke();
    c.fillStyle = withAlpha(m.rim, out ? 0.4 : 0.6);
    c.fillRect(x0 - s, top - 1.4 * s, w + 2 * s, 1.8 * s);
    if ((o.sleeveGlow ?? 0) > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(mixLab(m.core, m.rim, 0.4), 0.85 * (o.sleeveGlow ?? 0));
      c.lineWidth = 1.8 * s;
      c.strokeRect(x0, top, w, stubTop - top);
      c.restore();
    }
  }
  // stub: ink (or cold pale wax), ring-scored
  if (pale) {
    const cold = mixLab(mixLab(m.setHaze, '#aeb2b0', 0.42), m.rim, 0.08);
    c.fillStyle = cold;
    c.fillRect(x0, stubTop, w, o.y - stubTop);
    // a body shade: the side away from the light falls off
    const sl = o.sideLight;
    const dirL = sl ? Math.sign(sl.x - o.x) || 1 : 1;
    const sh = c.createLinearGradient(x0, 0, x0 + w, 0);
    const dark = withAlpha(mixLab(ink, m.set, 0.4), 0.55);
    const clear = withAlpha(ink, 0);
    sh.addColorStop(0, dirL > 0 ? dark : clear);
    sh.addColorStop(0.55, clear);
    sh.addColorStop(1, dirL > 0 ? clear : dark);
    c.fillStyle = sh;
    c.fillRect(x0, stubTop, w, o.y - stubTop);
    if (sl && sl.k > 0) {
      // the neighbour's flame warms the facing edge
      const ex = dirL > 0 ? x0 + w : x0;
      const g2 = c.createLinearGradient(ex, 0, ex - dirL * w * 0.6, 0);
      g2.addColorStop(0, withAlpha(mixLab(m.core, m.rim, 0.35), 0.55 * sl.k));
      g2.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = g2;
      c.fillRect(Math.min(ex, ex - dirL * w * 0.6), stubTop, w * 0.6, o.y - stubTop);
    }
  } else {
    c.fillStyle = ink;
    c.fillRect(x0, stubTop, w, o.y - stubTop);
  }
  c.strokeStyle = pale ? withAlpha(ink, 0.22) : withAlpha(m.rim, 0.2);
  c.lineWidth = 0.8 * s;
  c.beginPath();
  for (let i = o.rings + 1; i < RINGS; i++) {
    const y = top + i * RING * s;
    const major = i % 5 === 0;
    c.moveTo(x0 + (major ? 1 : 6) * s, y);
    c.lineTo(x0 + w - (major ? 1 : 6) * s, y);
  }
  c.stroke();
  const fk = o.state === 'live' ? (o.flame ?? 1) : 0;
  if (fk > 0) {
    const g = c.createLinearGradient(0, stubTop, 0, stubTop + 80 * s);
    g.addColorStop(0, withAlpha(m.core, 0.55 * fk));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0, stubTop, w, 80 * s);
  }
  // lettering, rising up the wax
  const la = o.letters ?? 0.8;
  if (la > 0 && o.lines.length) {
    c.save();
    c.translate(o.x, o.y - 10 * s);
    c.rotate(-Math.PI / 2);
    const size = 15 * s * (o.letterSize ?? 1);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    const lh = size * 1.12;
    const lg = o.letterGlow ?? 0;
    for (const pass of lg > 0.01 ? [0, 1] : [0]) {
      if (pass === 1) c.globalCompositeOperation = 'lighter';
      o.lines.forEach((ln, i) => {
        const yy = (i - (o.lines.length - 1) / 2) * lh;
        c.fillStyle = pass ? withAlpha(m.core, 0.7 * lg) : pale ? withAlpha(mixLab(ink, m.set, 0.15), la) : withAlpha(mixLab(m.rim, m.core, 0.3), la);
        c.fillText(ln, 0, yy);
      });
    }
    c.restore();
  }
  // flame, wick, smoke
  const fp = candleFlameAt(o);
  if (fk > 0) {
    c.save();
    // the flame leans in a draught (its base stays on the wick; the tongue bends over)
    c.translate(o.x, fp.y + 2 * s);
    c.rotate((o.lean ?? 0) * 0.055);
    c.scale(s * 1.9, s * 1.9);
    flameShape(c, env, 0, 0, 9 * Math.max(0.25, fk), o.seed ?? 3, 0.8 + 0.3 * fk);
    c.restore();
  }
  c.fillStyle = ink;
  c.fillRect(o.x - 0.8 * s, stubTop - 5 * s, 1.6 * s, 6 * s);
  if ((o.smoke ?? 0) > 0) smokeCurl(c, env, { x: o.x, y: stubTop - 5 * s }, 80 * s, s, o.smoke ?? 0, o.seed ?? 3);
  // base tag
  if (o.tag) baseTag(c, env, o.x + w / 2 + 2 * s, o.y - 4 * s, o.tag, s);
  c.restore();
}
/** a wisp of smoke from a wick: a tapering, wavering grey curl that thins and fades out `h` above it */
export function smokeCurl(c: C, env: PaintEnv, p: P, h: number, s: number, a: number, seed = 3) {
  const m = env.mood;
  const n = 18;
  const col = mixLab(m.haze, '#b9b9b4', 0.45);
  c.save();
  c.lineCap = 'round';
  let px = p.x, py = p.y;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const x = p.x + Math.sin(u * 5.2 - env.t * 1.6 + seed) * (1 + 9 * u) * s + 6 * u * u * s;
    const y = p.y - u * h;
    c.strokeStyle = withAlpha(col, 0.62 * a * (1 - u) * (1 - u * 0.3));
    c.lineWidth = (2.6 - 1.9 * u) * s + u * 2.2 * s;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(x, y);
    c.stroke();
    px = x;
    py = y;
  }
  c.restore();
}

export function baseTag(c: C, env: PaintEnv, x: number, y: number, text: string, s: number, a = 1) {
  const m = env.mood;
  c.save();
  c.globalAlpha *= a;
  const size = 13 * s;
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = c.measureText(text).width + 10 * s;
  const th = size + 7 * s;
  c.translate(x, y - th);
  c.rotate(0.06);
  const paper = mixLab(m.setHaze, m.halo, 0.7);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(0, th / 2);
  c.lineTo(5 * s, 0);
  c.lineTo(5 * s + tw, 0);
  c.lineTo(5 * s + tw, th);
  c.lineTo(5 * s, th);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(m.ink, paper, 0.1);
  c.textBaseline = 'middle';
  c.fillText(text, 9 * s, th / 2 + 0.5 * s);
  c.restore();
}

/** the shelf plank's right end (reflection): a thick paper-cut shelf ending in a bracket */
export function shelfEnd(c: C, env: PaintEnv, x0: number, x1: number, y: number, s: number) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x0, y, x1 - x0, 12 * s);
  c.beginPath();
  c.moveTo(x0, y + 12 * s);
  for (let x = x0; x < x1; x += 24 * s) {
    c.lineTo(x, y + 12 * s);
    c.quadraticCurveTo(x + 12 * s, y + 22 * s, Math.min(x1, x + 24 * s), y + 12 * s);
  }
  c.lineTo(x1, y + 12 * s);
  c.closePath();
  c.fill();
  const bx = x1 - 30 * s;
  c.beginPath();
  c.moveTo(bx - 4 * s, y + 12 * s);
  c.lineTo(bx + 4 * s, y + 12 * s);
  c.lineTo(bx + 4 * s, y + 60 * s);
  c.quadraticCurveTo(bx - 2 * s, y + 30 * s, bx - 30 * s, y + 14 * s);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.45);
  c.fillRect(x0, y - 0.6 * s, x1 - x0, 1.2 * s);
}

/** soft parchment plate for screen-locked labels (no hard box) */
export function labelPlate(c: C, m: Palette, x: number, y: number, w: number, h: number, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.6);
  g.addColorStop(0, withAlpha(m.ink, 0.4 * a));
  g.addColorStop(0.55, withAlpha(m.ink, 0.26 * a));
  g.addColorStop(1, withAlpha(m.ink, 0));
  c.save();
  c.translate(x, y);
  c.scale(1, h / w);
  c.translate(-x, -y);
  c.fillStyle = g;
  c.fillRect(x - w, y - w, w * 2, w * 2);
  c.restore();
}

/** a typed label, tracked mono, centred or left, with a soft plate */
export function monoLabel(c: C, m: Palette, text: string, x: number, y: number, o: { size?: number; align?: 'left' | 'center' | 'right'; a?: number; color?: string } = {}) {
  const size = o.size ?? 18.5;
  const a = o.a ?? 1;
  if (a <= 0.003) return;
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  (c as C & { letterSpacing?: string }).letterSpacing = `${(size * 0.06).toFixed(1)}px`;
  const w = c.measureText(text).width;
  const cx = o.align === 'left' ? x + w / 2 : o.align === 'right' ? x - w / 2 : x;
  labelPlate(c, m, cx, y - size * 0.3, w * 0.75 + 70, size * 2.6, a);
  c.globalAlpha = a;
  c.fillStyle = o.color ?? mixLab('#efe4cf', m.core, 0.25);
  c.textAlign = o.align ?? 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
  c.restore();
}

/** camera helper: a camera (lens 1) that shows world point p of a layer at depth z at screen point s, with that
 *  layer drawn at on-screen scale k relative to rest (k = z / (z − cam.z)) */
export function frameAt(p: P, s: P, k: number, z = 1000): Camera3 {
  const cz = z - z / k;
  const sAbs = 1000 / (z - cz);
  // screen = 640 + (x − 640)·k − (cam.x − 640)·sAbs
  return { x: 640 + ((p.x - 640) * k - (s.x - 640)) / sAbs, y: 360 + ((p.y - 360) * k - (s.y - 360)) / sAbs, z: cz, lens: 1 };
}
