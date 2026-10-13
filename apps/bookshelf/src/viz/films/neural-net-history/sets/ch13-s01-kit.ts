/**
 * ch13 (The Case Reopened) — shared pieces for ch13-s01 … ch13-s06 (one animator's group).
 *
 *   stage13(f, o)            the paper stage of a belief candle (backlight · curtain · optional WALL FLAT · floor ·
 *                            pool · the huge candle as wax · your figures · rim · the flame practical). Like
 *                            sets/candleStage but with extra pools (other lamps) and the Wall of Forecasts standing
 *                            as a huge flat just behind the action plane (its own near layer, so a slip on it and a
 *                            hand at it never slip apart under a camera move).
 *   WALL13 / W6_PIN          the wall flat on the 2012 stage (s01, s02) and the W6 pin, placed where the tall
 *                            man's reaching hand lands
 *   HINTON13 / REACH / LOOK  the 2020s Hinton (empty hands) and his poses at the Wall
 *   heldSlip(c, env, o)      the 30-to-50-years slip, in a hand or on its pin, darkening and curling
 *   bareMarkPin(c, env, …)   the bare pin left on the Wall (glints)
 *   parchmentCard(c, o, env) a small screen-locked parchment card (EB Garamond, an attribution line)
 *   penLine(c, …)            a name written in the pen hand, revealed left to right
 *   bloom(f, k)              the FLAME PUSH's bright pass (screen-locked, additive)
 *   capSize(c, font, cap, …) the px size that puts `font`'s cap height at `cap` px on a 1080p frame under the current
 *                            transform, measured LIVE at the alphabetic baseline (review round 1 legibility floor)
 */
import type { Camera3, Frame, LayerSpec, Palette, PaintEnv, Pose } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, toScreen, type Rect } from '../../../film/core/multiplane';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, drawTracked, envelope, legibleSize, softPlate, textColor, titleColor, wrapLines, type TypeEnv } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { dustMotes } from '../../../film/silhouette/atmosphere';
import { createPuppet, pose } from '../../../film/silhouette/puppet';
import { SPECS, cast } from '../cast';
import { PUPPET_NEAR_BLACK, withLife } from '../../../film/silhouette/puppet';
import { beliefCandle, candleFlame } from './beliefCandle';
import { waxCandle } from './ch02-s04-waxCandle';
import { WALL, WALL_SLOTS, drawSlip, wallOfForecasts } from './wallOfForecasts';
import { paperTone } from './caseBoard';
import { shelfStateAt, wallStateAt, type CandleView, type SlipView, type WallSlot } from './studyState';
import { slotLight } from './wallOfForecasts';

type C = CanvasRenderingContext2D;

// ===================================================================================================== legibility
const CAP_CACHE = new Map<string, number>();
/** cap height / font size for this face, measured at the alphabetic baseline (cached once the webfont is in) */
function capRatio13(c: C, font: string, text = 'H'): number {
  const sc = /SC"|SC\b/.test(font) && /[a-z]/.test(text);
  const f100 = font.replace(/\d+(\.\d+)?px/, '100px');
  const key = `${f100}|${sc}`;
  const hit = CAP_CACHE.get(key);
  if (hit != null) return hit;
  c.save();
  c.font = f100;
  c.textBaseline = 'alphabetic';
  const a = c.measureText(sc ? 'h' : 'H').actualBoundingBoxAscent;
  c.restore();
  const r = a > 1 ? a / 100 : 0.68;
  if (typeof document === 'undefined' || document.fonts?.check?.(f100)) CAP_CACHE.set(key, r);
  return r;
}
/**
 * The font size (in the current user units) that gives `font` a cap height of `cap` px on a 1080p frame under the
 * current transform (camera, layer and pxScale included). `pxScale` is the frame's device px per stage px
 * (f.pxScale / env.pxScale); 1 stage px = 1.5 px at 1080p. Never smaller than the font's own size.
 */
export function capSize(c: C, font: string, cap: number, pxScale: number, text = 'H'): number {
  const m = c.getTransform();
  const px1080 = (Math.max(1e-3, Math.hypot(m.a, m.b)) / Math.max(1e-3, pxScale)) * 1.5;
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 16);
  return Math.max(size, Math.ceil((cap / (capRatio13(c, font, text) * px1080)) * 10) / 10);
}
export const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

// ===================================================================================================== cast
/** the 2020s Hinton, empty-handed (the slip is this chapter's prop, not his laptop) */
export const HINTON13 = createPuppet({ ...SPECS.hinton, id: 'hinton-ch13', prop: 'none' });
/** the 1976 ghost: hinton-young (cardigan), empty-handed */
export const HINTON_YOUNG13 = createPuppet({ ...SPECS['hinton-young'], id: 'hinton-young-ch13', prop: 'none' });
export const BENGIO13 = createPuppet({ ...SPECS['bengio-2020s'], id: 'bengio-ch13' });

/** standing at the Wall, the near arm loose */
export const STAND13: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -8, shoulderF: 4, elbowF: 14, wristF: 6, shoulderB: -8, elbowB: 12, wristB: 4 });
/** reaching up to the pin, fingers pinched */
export const REACH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -3, neck: 4, head: -10, shoulderF: 104, elbowF: 16, wristF: -8, shoulderB: -10, elbowB: 12, wristB: 4 }, { handF: 'pinch' });
/** the slip lowered in front of him, head bowed to read it */
export const LOOK: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 3, neck: 16, head: 14, shoulderF: 30, elbowF: 78, wristF: -18, shoulderB: -6, elbowB: 16, wristB: 6 }, { handF: 'pinch' });

// ===================================================================================================== the 2012 stage
/** the 2012 candle, as it stands in May 2023 (eleven rings burned, still lit) */
export const LEARNED23: CandleView = shelfStateAt('ch13-s01', 'end').find((v) => v.id === 'learned')!;
export const ST13 = { floorY: 640, candleX: 390, s: 1.5, hx: 640 } as const;
export const ST13_FLAME = candleFlame({ x: ST13.candleX, y: ST13.floorY, view: LEARNED23, s: ST13.s });
/** where his pinch lands when he reaches (feet at hx, facing right) */
export const REACH_HAND = HINTON13.anchor({ x: ST13.hx, y: ST13.floorY, facing: 'right', pose: REACH }, 'handF');
/** the wall flat: a huge Wall of Forecasts, its W6 pin exactly at his reach */
export const WALL13_K = 1.15;
const W6 = WALL_SLOTS.W6;
export const W6_PIN = { x: REACH_HAND.x + 4, y: REACH_HAND.y + 2 };
export const WALL13 = {
  x: W6_PIN.x - W6.x * WALL13_K,
  y: W6_PIN.y - (W6.y - W6.h / 2 + 6) * WALL13_K,
  k: WALL13_K,
};
/** the slip's centre while on its pin */
export const W6_CENTRE = { x: W6_PIN.x, y: W6_PIN.y + (W6.h / 2 - 6) * WALL13_K };
export const W6_VIEW = wallStateAt('ch13-s01', 'start').find((s) => s.slot === 'W6')!;
/** the Krizhevsky slip (W4) re-pinned 70 px left on the stage's wall flat, so Hinton's head reads against bare wall
 *  (it slides over the chess slip's bare pin, W2); ch13-s01 and ch13-s02 share it for continuity */
export const SHIFT13: Partial<Record<WallSlot, [number, number]>> = { W4: [-61, 0] };
/** the held slip grows as he lowers it to read (the legibility floor while he holds it), carried into ch13-s02 */
export const HELD_K = 1.3;
/** the wall flat's layer: just behind the action plane (almost no parallax against L4) */
export const WALL_FLAT: LayerSpec = { id: 'ch13WallFlat', z: 1045, haze: 0.1, blur: 0.4 };

// ===================================================================================================== stage painter
export interface Pool13 {
  x: number;
  /** floor-plane radius */
  rx: number;
  /** 0..1 */
  k: number;
  /** tint toward a light's own colour (default the mood's halo) */
  tint?: string;
  /** the floor line this pool lies on (default the stage floor): a pool further downstage sits lower */
  y?: number;
}
export interface Stage13Opts {
  key: string;
  cams: Camera3[];
  candle: CandleView;
  candleX: number;
  s: number;
  /** flame strength 0..1 */
  flame?: number;
  /** pool radius (floor x) */
  poolRx?: number;
  /** a defined pool edge: the light falls off over this many floor px at the rim (default: a soft 200 px falloff) */
  poolEdge?: number;
  burn?: number;
  letters?: number;
  /** extra floor pools (other lamps) */
  pools?: Pool13[];
  /** the wall flat (Wall of Forecasts) behind the action plane */
  wall?: {
    slips: SlipView[];
    hide?: Array<SlipView['slot']>;
    dim?: number;
    extra?: (c: C, env: PaintEnv) => void;
    /** re-pin these slips this many wall units over (dx, dy), e.g. to clear a head's profile */
    shift?: Partial<Record<WallSlot, [number, number]>>;
  };
  /** a flat on the near-backdrop layer (WALL_FLAT), e.g. a parchment strip; drawn after the wall */
  flat?: (c: C, env: PaintEnv) => void;
  /** backdrop extra on L2 — drawn after the curtain */
  backdrop?: (c: C, env: PaintEnv) => void;
  /** upstage figures (L3) */
  back?: (c: C, env: PaintEnv) => void;
  /** the action plane: figures, props (after floor, pool, candle) */
  draw?: (c: C, env: PaintEnv, g: { flame: { x: number; y: number }; inPool: (x: number) => number }) => void;
  /** after the rim pass, before the flame practical (L4 lights that must not be rimmed) */
  rimDir?: { x: number; y: number };
  /** backlight intensity multiplier */
  sky?: number;
  /** dust motes turning in the candle's light (0..1, default 1) */
  motes?: number;
  /** depth dressing: fog band A over the backdrop's lower third, an upstage rim on the wall flat's top edge, and a
   *  blurred L5 near plane (a dark proscenium curtain edge and/or the stage lip), so the figures are the only sharp
   *  plane between two soft ones */
  depth?: Depth13;
}
export interface Depth13 {
  /** fog band A alpha (0 = none) */
  fogA?: number;
  /** fog band A centre (screen y) when there is no wall flat to sit on */
  fogAY?: number;
  fogAH?: number;
  /** rim on the wall flat's top moulding (0..1) */
  wallRim?: number;
  /** a dark proscenium curtain edge on one or both sides, `curtainW` screen px wide at the reference camera */
  curtain?: 'left' | 'right' | 'both';
  curtainW?: number;
  /** the stage lip: its top edge at this screen y at the reference camera (omit for none) */
  lipY?: number;
  /** the camera the near plane is laid out for (default the last of `cams`); parallax is softened toward it */
  ref?: Camera3;
  /** near-plane strength 0..1 (default 1) */
  near?: number;
}

const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function stage13(f: Frame, o: Stage13Opts) {
  const fk = o.flame ?? 1;
  const flame = candleFlame({ x: o.candleX, y: ST13.floorY, view: o.candle, s: o.s, burn: o.burn });
  const R = (o.poolRx ?? 430) * (0.35 + 0.65 * fk);
  const inPool = (x: number) => {
    const u = Math.max(0, 1 - Math.abs(x - o.candleX) / R);
    return fk * u * u * (3 - 2 * u);
  };
  f.backlight({ sunX: flame.x, sunY: flame.y + 80, sunRadius: 520, intensity: (0.3 + 0.3 * fk) * (o.sky ?? 1) });
  // L2: the dark paper curtain, warmed behind the flame and behind each extra lamp
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/s13/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.62);
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.strokeStyle = withAlpha(env.mood.fg, 0.5);
      cc.lineWidth = 3;
      for (let x = Math.floor(r.x / 70) * 70; x < r.x + r.w; x += 70) {
        cc.beginPath();
        cc.moveTo(x + hash1(x, 3) * 8, r.y);
        cc.bezierCurveTo(x + 14, r.y + r.h * 0.3, x - 14, r.y + r.h * 0.6, x + hash1(x, 4) * 10, r.y + r.h);
        cc.stroke();
      }
    });
    const glowAt = (gx: number, gy: number, RR: number, a: number, tint?: string) => {
      const g = c.createRadialGradient(gx, gy, 10, gx, gy, RR);
      const h = tint ?? env.mood.halo;
      g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, h, 0.55), 0.8 * a));
      g.addColorStop(0.45, withAlpha(mixLab(env.mood.set, h, 0.25), 0.4 * a));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = g;
      c.fillRect(gx - RR, gy - RR, 2 * RR, 2 * RR);
    };
    glowAt(flame.x, flame.y + 120, 620 * (0.4 + 0.6 * fk), fk);
    for (const p of o.pools ?? []) glowAt(p.x, 380, p.rx * 1.1, p.k * 0.8, p.tint);
    o.backdrop?.(c, env);
  });
  f.fog({ yCenter: 0.55 * 720, height: 0.45 * 720, alpha: 0.1 + 0.12 * fk, drift: 5 });
  if (o.back) f.layer('L3', (c, env) => o.back!(c, env));
  // the wall flat
  if (o.wall) {
    const w = o.wall;
    f.layer(WALL_FLAT, (c, env) => {
      const shifted = Object.keys(w.shift ?? {}) as WallSlot[];
      wallOfForecasts(c, { ...WALL13, slips: w.slips, light: 0.85, hide: [...(w.hide ?? []), ...shifted] }, env);
      for (const slot of shifted) {
        const v = w.slips.find((q) => q.slot === slot);
        if (!v || (w.hide ?? []).includes(slot)) continue;
        const [dx, dy] = w.shift![slot]!;
        const s = WALL_SLOTS[slot];
        drawSlip(c, v, {
          x: WALL13.x + (s.x + dx) * WALL13.k,
          y: WALL13.y + (s.y + dy) * WALL13.k,
          k: WALL13.k,
          light: slotLight(slot, 0.85),
          ghost: v.ghost,
          yellow: v.state === 'yellowed' || v.state === 'curled' ? 1 : 0,
          curl: v.state === 'curled' ? 1 : v.state === 'yellowed' ? 0.4 : 0,
          pin: true,
        }, env);
      }
      // the candle's light on the flat: warm near the flame, falling into shadow toward the far end
      const x0 = WALL13.x, y0 = WALL13.y, W = WALL.w * WALL13.k, H = WALL.h * WALL13.k;
      const g = c.createRadialGradient(flame.x, flame.y, 40, flame.x, flame.y, 760);
      g.addColorStop(0, withAlpha(env.mood.fg, 0));
      g.addColorStop(0.35, withAlpha(env.mood.fg, 0.18));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.86));
      c.fillStyle = g;
      c.fillRect(x0 - 10, y0 - 12, W + 20, H + 24);
      if (w.dim) {
        c.fillStyle = withAlpha(env.mood.fg, w.dim);
        c.fillRect(x0 - 10, y0 - 12, W + 20, H + 24);
      }
      w.extra?.(c, env);
      const wr = o.depth?.wallRim ?? 0;
      if (wr > 0.01) {
        // the upstage rim: the candle's light catching the flat's top moulding, warm toward the flame
        const ty = y0 - 10 * WALL13.k;
        const rg = c.createLinearGradient(x0, 0, x0 + W, 0);
        const near = Math.max(0, Math.min(1, (flame.x - x0) / W));
        rg.addColorStop(0, withAlpha(env.mood.rim, 0.55 * wr));
        rg.addColorStop(near, withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.85 * wr));
        rg.addColorStop(1, withAlpha(env.mood.rim, 0.18 * wr));
        c.fillStyle = rg;
        c.fillRect(x0 - 6 * WALL13.k, ty - 1, W + 12 * WALL13.k, 2.2);
        // the bottom moulding's top face catches the flame too (the edge we see when the top is out of frame)
        c.fillRect(x0 - 6 * WALL13.k, y0 + H - 1, W + 12 * WALL13.k, 2);
        c.save();
        c.globalCompositeOperation = 'lighter';
        const hg = c.createLinearGradient(0, ty - 26, 0, ty);
        hg.addColorStop(0, withAlpha(env.mood.halo, 0));
        hg.addColorStop(1, withAlpha(env.mood.halo, 0.14 * wr));
        c.fillStyle = hg;
        c.fillRect(x0 - 6 * WALL13.k, ty - 26, W + 12 * WALL13.k, 26);
        c.restore();
      }
    });
  }
  if (o.flat) f.layer(WALL_FLAT, (c, env) => o.flat!(c, env));
  const fa = o.depth?.fogA ?? 0;
  if (fa > 0.005) {
    const yc = o.wall ? toScreen(WALL_FLAT, f.cam, 0, WALL13.y + WALL.h * WALL13.k * 0.8).y : o.depth?.fogAY ?? 0.62 * 720;
    f.fog({ yCenter: yc, height: o.depth?.fogAH ?? 0.26 * 720, alpha: fa, drift: 7 });
  }
  f.fog('B');
  f.layer('L4', (c, env) => {
    const fy = ST13.floorY;
    const r = overscan(LAYERS.L4, o.cams, 40);
    c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
    c.fillRect(r.x, fy - 6, r.w, r.y + r.h - fy + 6);
    const pool = (x: number, rx: number, k: number, tint?: string, edge?: number, py: number = fy) => {
      c.save();
      c.translate(x, py + 14);
      c.scale(1, 64 / Math.max(1, rx));
      const h = tint ?? env.mood.halo;
      const pg = c.createRadialGradient(0, 0, 10, 0, 0, rx * 1.05);
      pg.addColorStop(0, withAlpha(mixLab(h, env.mood.core, 0.25), 0.95 * k));
      if (edge) {
        // a defined ring: bright almost to the rim, then a short falloff
        const e0 = Math.max(0.5, 1 - edge / (rx * 1.05));
        pg.addColorStop(0.5, withAlpha(h, 0.66 * k));
        pg.addColorStop(e0 - 0.02, withAlpha(mixLab(h, env.mood.rim, 0.25), 0.62 * k));
        pg.addColorStop(e0, withAlpha(mixLab(env.mood.setHaze, h, 0.4), 0.42 * k));
      } else {
        pg.addColorStop(0.55, withAlpha(h, 0.6 * k));
        pg.addColorStop(0.86, withAlpha(mixLab(env.mood.setHaze, h, 0.3), 0.3 * k));
      }
      pg.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = pg;
      c.beginPath();
      c.arc(0, 0, rx * 1.05, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };
    if (fk > 0) pool(o.candleX, R, fk, undefined, o.poolEdge);
    for (const p of o.pools ?? []) pool(p.x, p.rx, p.k, p.tint, undefined, p.y ?? fy);
    c.strokeStyle = withAlpha(env.mood.fg, 0.35);
    c.lineWidth = 1;
    for (let i = -22; i <= 22; i++) {
      c.beginPath();
      c.moveTo(o.candleX + i * 60, fy);
      c.lineTo(o.candleX + i * 110, r.y + r.h);
      c.stroke();
    }
    beliefCandle(c, { x: o.candleX, y: fy, view: o.candle, s: o.s, burn: o.burn, flame: fk, drawFlame: false, letters: 0 }, env);
    waxCandle(c, { x: o.candleX, y: fy, view: o.candle, s: o.s, burn: o.burn, flame: fk, letters: o.letters ?? 0.8 }, env);
    o.draw?.(c, env, { flame, inPool });
    const mk = (o.motes ?? 1) * fk;
    if (mk > 0.01) dustMotes(c, { area: { x: flame.x - 420, y: flame.y - 300, w: 840, h: 560 }, count: Math.round(60 * mk), drift: { x: 1.5, y: -2.5 }, brightness: 0.55 * mk, salt: 13 + o.candle.slot }, env);
  });
  f.rim(o.rimDir ?? { x: 0, y: -1 });
  if (fk > 0) f.practical({ x: flame.x, y: flame.y + 4 * o.s, kind: 'candle', seed: 2012 + o.candle.slot, intensity: fk, radius: 70 + 40 * fk });
  if (o.depth) nearPlane13(f, o.depth, o.cams);
  return { flame, inPool, rimX: o.candleX + R, rimXL: o.candleX - R };
}

/** the blurred L5 near plane of the paper stage: a dark proscenium curtain edge and the stage lip. Laid out for the
 *  reference camera; under other cameras it keeps 40% of true L5 parallax (so it slides, but never wanders into frame).
 *  Fades out when the camera dollies close to the near plane (the flame pushes). */
export function nearPlane13(f: Frame, d: Depth13, cams: Camera3[]) {
  const cam = f.cam;
  const k = (d.near ?? 1) * (1 - win(cam.z, 300, 430));
  if (k <= 0.01 || (!d.curtain && d.lipY === undefined)) return;
  const ref = d.ref ?? cams[cams.length - 1] ?? cam;
  const L5 = LAYERS.L5;
  /** a screen point at the reference camera → the L5 point to draw now: it keeps 40% of its true L5 parallax,
   *  clamped to ±60 screen px, so the frame edge slides a little under a pan but never wanders into the picture */
  const at = (sx: number, sy: number) => {
    const a = toLayer(L5, ref, sx, sy);
    const sNow = toScreen(L5, cam, a.x, a.y);
    const cl = (v: number) => Math.max(-60, Math.min(60, v));
    return toLayer(L5, cam, sx + cl(0.4 * (sNow.x - sx)), sy + cl(0.4 * (sNow.y - sy)));
  };
  /** a screen-locked point (for the parts that run off frame) */
  const scr = (sx: number, sy: number) => toLayer(L5, cam, sx, sy);
  f.layer('L5', (c, env) => {
    const m = env.mood;
    c.save();
    c.globalAlpha *= k;
    const cw = d.curtainW ?? 100;
    const sides = d.curtain === 'both' ? (['left', 'right'] as const) : d.curtain ? [d.curtain] : [];
    for (const side of sides) {
      const inner = at(side === 'right' ? 1280 - cw : cw, 0);
      const outer = scr(side === 'right' ? 1280 + 500 : -500, 0);
      const top = scr(0, -300).y, bot = scr(0, 1100).y;
      const x0 = Math.min(inner.x, outer.x), x1 = Math.max(inner.x, outer.x);
      // velvet: near-black with broad soft folds; its inner edge catches a little of the stage light
      const g = c.createLinearGradient(inner.x, 0, outer.x, 0);
      const fold = mixLab(m.fg, m.set, 0.32);
      g.addColorStop(0, mixLab(m.fg, m.set, 0.18));
      g.addColorStop(0.08, fold);
      g.addColorStop(0.2, m.fg);
      g.addColorStop(0.34, mixLab(m.fg, m.set, 0.22));
      g.addColorStop(0.5, m.fg);
      g.addColorStop(1, m.fg);
      c.fillStyle = g;
      // a gentle sweep: the hem kicks out toward the stage at the floor
      const dir = side === 'right' ? -1 : 1;
      const sw = (x1 - x0) * 0.06;
      c.beginPath();
      c.moveTo(inner.x, top);
      c.bezierCurveTo(inner.x + dir * sw * 0.2, top + (bot - top) * 0.4, inner.x - dir * sw * 0.4, top + (bot - top) * 0.7, inner.x + dir * sw, bot);
      c.lineTo(outer.x, bot);
      c.lineTo(outer.x, top);
      c.closePath();
      c.fill();
      c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.35);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(inner.x, top);
      c.bezierCurveTo(inner.x + dir * sw * 0.2, top + (bot - top) * 0.4, inner.x - dir * sw * 0.4, top + (bot - top) * 0.7, inner.x + dir * sw, bot);
      c.stroke();
    }
    if (d.lipY !== undefined) {
      const a = { x: scr(-600, 0).x, y: at(640, d.lipY).y }, b = scr(1900, 1100);
      // the stage lip: a dark board edge across the bottom, its top edge catching the footlight-less stage glow
      const lg = c.createLinearGradient(0, a.y, 0, b.y);
      lg.addColorStop(0, mixLab(m.fg, m.set, 0.35));
      lg.addColorStop(0.12, m.fg);
      lg.addColorStop(1, m.fg);
      c.fillStyle = lg;
      c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      c.fillStyle = withAlpha(m.rim, 0.32);
      c.fillRect(a.x, a.y - 1, b.x - a.x, 2);
    }
    c.restore();
  });
}

/** the worry candle's lettering, legible: IBM Plex Mono, near-black ink with a 1 px warm halo, set in two lines
 *  rising up the wax from the base. size = font size in layer px. */
export const WORRY_LINES = ['SMARTER-THAN-HUMAN AI MAY BE', 'YEARS AWAY, AND DANGEROUS'] as const;
export function worryLetters(c: C, x: number, baseY: number, s: number, size: number, alpha: number, env: PaintEnv, ink?: string) {
  if (alpha <= 0.01) return;
  c.save();
  c.translate(x, baseY - 12 * s);
  c.rotate(-Math.PI / 2);
  c.font = `500 ${size}px ${FONT.mono}`;
  // alphabetic baseline (centred by hand): a 'middle' baseline poisons the legibility audit's per-font cap cache
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const lh = size * 1.12;
  c.globalAlpha *= alpha;
  c.lineJoin = 'round';
  WORRY_LINES.forEach((ln, i) => {
    const yy = (i - 0.5) * lh + size * 0.35;
    c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.55);
    c.lineWidth = Math.max(1, size * 0.16);
    c.strokeText(ln, 0, yy);
    c.fillStyle = ink ?? mixLab(env.mood.fg, '#000000', 0.3);
    c.fillText(ln, 0, yy);
  });
  c.restore();
}

/** cast a figure's long soft shadow along the floor, away from a light at lightX */
export function longShadow(c: C, env: PaintEnv, feetX: number, lightX: number, draw: (c: C) => void, strength = 1, lenK = 1) {
  const dir = feetX >= lightX ? 1 : -1;
  const len = (1.3 + Math.min(1.4, Math.abs(feetX - lightX) / 300)) * lenK;
  c.save();
  c.globalAlpha *= 0.55 * strength;
  c.translate(feetX, ST13.floorY + 2);
  c.transform(0, 0.16, -dir * len, -0.1 * len, 0, 0);
  draw(c);
  c.restore();
}

// ===================================================================================================== the slip
export interface HeldSlip {
  x: number;
  y: number;
  /** k: wall units → layer px */
  k: number;
  rot?: number;
  /** 0..1: the paper darkens (overdue) */
  dark?: number;
  /** 0..1 curl */
  curl?: number;
  light?: number;
  pin?: boolean;
  /** 0..1 deep-shadow (the study's W6 rule): only the lower corner lit */
  shadow?: number;
  alpha?: number;
}
/** the 30-to-50-years slip, centred at (x, y) */
export function heldSlip(c: C, env: PaintEnv, o: HeldSlip) {
  const v = { slot: 'W6' as const, who: '', text: '30 TO 50 YEARS OR EVEN LONGER', due: undefined };
  drawSlip(c, v, { x: o.x, y: o.y, k: o.k, light: o.light ?? 0.8, curl: Math.max(0.35, o.curl ?? 0.35), yellow: 0.35 + 0.65 * (o.dark ?? 0), rot: o.rot ?? 0, pin: o.pin ?? false, alpha: o.alpha }, env);
  const sz = WALL_SLOTS.W6;
  const w = sz.w * o.k, h = sz.h * o.k;
  const dk = o.dark ?? 0;
  const sh = o.shadow ?? 0;
  if (dk <= 0.01 && sh <= 0.01) return;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, o.y);
  c.rotate((o.rot ?? 0) + hash1(5, 23) * 0.04 + Math.max(0.35, o.curl ?? 0.35) * 0.05);
  // the paper ages: a brown bloom creeping in from the edges, foxing spots
  if (dk > 0.01) {
    const g = c.createRadialGradient(0, 0, Math.min(w, h) * 0.2, 0, 0, w * 0.62);
    g.addColorStop(0, withAlpha(mixLab('#4a2e16', env.mood.fg, 0.35), 0.5 * dk));
    g.addColorStop(1, withAlpha(mixLab('#2a1a0c', env.mood.fg, 0.5), 0.92 * dk));
    c.fillStyle = g;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = withAlpha('#2a1a0c', 0.35 * dk);
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.arc(hash1(i, 81) * 0.42 * w, hash1(i, 82) * 0.38 * h, (1 + 1.1 * (hash1(i, 83) + 1)) * o.k, 0, Math.PI * 2);
      c.fill();
    }
  }
  if (sh > 0.01) {
    // the W6 rule: the lamp catches only the lower-left corner
    const g = c.createLinearGradient(-w / 2, h / 2, w / 2, -h / 2);
    g.addColorStop(0, withAlpha(env.mood.fg, 0));
    g.addColorStop(0.32, withAlpha(env.mood.fg, 0.35 * sh));
    g.addColorStop(0.7, withAlpha(env.mood.fg, 0.8 * sh));
    g.addColorStop(1, withAlpha(env.mood.fg, 0.9 * sh));
    c.fillStyle = g;
    c.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
  }
  c.restore();
}

/** W7 (Hinton's 2017 slip) on the stage's wall flat */
export const W7F = { x: WALL13.x + WALL_SLOTS.W7.x * WALL13_K, y: WALL13.y + WALL_SLOTS.W7.y * WALL13_K };
/** Hinton's 2017 slip (W7) left in the dark at the far end: the lamp never reaches it (about 35% of its lit
 *  value), with a soft shadow pooling around it rather than a hard box. Hide W7 from the wall and call this. */
const W7V = wallStateAt('ch13-s01', 'start').find((v) => v.slot === 'W7')!;
export function darkW7(c: C, env: PaintEnv, x: number, y: number, k: number, a: number) {
  const s = WALL_SLOTS.W7;
  const w = s.w * k, h = s.h * k;
  c.save();
  const R = Math.max(w, h) * 1.1;
  const g = c.createRadialGradient(x, y, Math.min(w, h) * 0.3, x, y, R);
  g.addColorStop(0, withAlpha(env.mood.fg, 0.4 * a));
  g.addColorStop(1, withAlpha(env.mood.fg, 0));
  c.fillStyle = g;
  c.fillRect(x - R, y - R, 2 * R, 2 * R);
  drawSlip(c, W7V, { x, y, k, light: 0.2 }, env);
  c.fillStyle = withAlpha(env.mood.fg, a);
  c.translate(x, y);
  c.rotate(hash1(6, 23) * 0.04);
  c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  c.restore();
}

/** the three lab heads (Hassabis, Altman, Dario Amodei): a step upstage in the same pool (L3, smaller and hazier
 *  than the signatories), equal in light, their x staggered so they never read as an evenly spaced picket line.
 *  They never dissolve (a faded puppet doubles its overlapping limbs): they EMERGE from the haze on 'labs' (ink
 *  from the haze colour to near-black) and, in ch13-s04, step back into it (`retreat` 0..1: a step further upstage
 *  toward the exit at upstage right while the haze swallows them). */
export const LAB_POS = [
  { x: 760, y: 606, s: 0.74 },
  { x: 842, y: 600, s: 0.7 },
  { x: 946, y: 609, s: 0.76 },
] as const;
const LAB = () => [cast.hassabis, cast.altman, cast['amodei-dario']];
export function labHeads(c: C, env: PaintEnv, t: number, b: { labs: number }, fade: number, retreat = 0) {
  const tq = tq12(t);
  for (let i = 0; i < 3; i++) {
    // emerge: the haze gives them up one after another (on twos)
    const e = win(tq, b.labs + 0.12 * i, b.labs + 0.9 + 0.12 * i) * fade;
    const r = clamp01(retreat * 1.15 - 0.08 * i);
    const lost = Math.max(1 - e, sm(r));
    if (lost >= 0.995) continue;
    const P = LAB_POS[i];
    const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.haze, 0.3 + 0.25 * r);
    const pz: Pose = withLife({ ...STAND13 }, tq, 300 + i * 17, 0.8);
    const sc = P.s * (1 - 0.16 * r);
    const o = { x: P.x + 70 * r, y: P.y - 16 * r, facing: 'left' as const, pose: pz, scale: sc };
    // one group alpha for the whole figure (overlapping limbs never double up)
    groupAlpha(c, 1 - lost, (g) => {
      g.filter = `blur(${((0.5 + 1.2 * r) * env.pxScale).toFixed(2)}px)`;
      LAB()[i].draw(g, { ...o, ink, light: { x: -1, y: -0.2, floor: 0.1 }, edgeRim: { x: -1, y: -0.35, px: 1.2, alpha: 0.4 } }, env);
    });
  }
}

/** draw into a scratch buffer with the current transform, then composite it with ONE alpha (a fading puppet whose
 *  limbs overlap would otherwise show doubled, darker overlaps) */
let SCRATCH: HTMLCanvasElement | null = null;
export function groupAlpha(c: C, alpha: number, draw: (g: C) => void) {
  if (alpha <= 0.003) return;
  if (alpha >= 0.997) {
    c.save();
    draw(c);
    c.restore();
    return;
  }
  const W = c.canvas.width, H = c.canvas.height;
  if (!SCRATCH) SCRATCH = document.createElement('canvas');
  if (SCRATCH.width !== W || SCRATCH.height !== H) {
    SCRATCH.width = W;
    SCRATCH.height = H;
  }
  const g = SCRATCH.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  g.setTransform(c.getTransform());
  g.save();
  draw(g);
  g.restore();
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha *= alpha;
  c.drawImage(SCRATCH, 0, 0);
  c.restore();
}

/** a bare brass pin with an optional glint */
export function barePin(c: C, env: PaintEnv, x: number, y: number, k: number, glint = 0) {
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(x, y, 4 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.5);
  c.beginPath();
  c.arc(x - 1.1 * k, y - 1.1 * k, 1.5 * k, 0, Math.PI * 2);
  c.fill();
  if (glint > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const r = 18 * k * glint;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * glint));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
    c.strokeStyle = withAlpha(env.mood.core, 0.75 * glint);
    c.lineWidth = 0.9 * k;
    c.beginPath();
    c.moveTo(x - r, y);
    c.lineTo(x + r, y);
    c.moveTo(x, y - r * 0.7);
    c.lineTo(x, y + r * 0.7);
    c.stroke();
    c.restore();
  }
}

// ===================================================================================================== type
export interface ParchmentCardOpts {
  x: number;
  y: number;
  width: number;
  /** the text (EB Garamond italic), wrapped */
  text: string;
  attrib?: string;
  size?: number;
  at: number;
  /** fade-out start (absolute shot time), optional */
  until?: number;
  rot?: number;
  /** a plain (non-italic) typed label instead of a quotation */
  typed?: boolean;
  /** drop-shadow strength (default 0.45) */
  shadow?: number;
}
/** a small parchment card rising into place (screen-locked; call last) */
export function parchmentCard(c: C, o: ParchmentCardOpts, env: { t: number; mood: Palette }) {
  const t = env.t;
  const inU = win(t, o.at, o.at + 0.7);
  const outU = o.until !== undefined ? win(t, o.until, o.until + 0.6) : 0;
  const A = inU * (1 - outU);
  if (A <= 0.003) return;
  const P = MOODS.parchment;
  const size = o.size ?? 24;
  const font = o.typed ? `400 ${size}px ${FONT.typewriter}` : `italic 400 ${size}px ${FONT.text}`;
  // the attribution at the legibility floor (23 px cap at 1080p; screen-locked), and the card wide enough for it
  const aSize = o.attrib ? capSize(c, `italic 400 ${Math.round(size * 0.68)}px ${FONT.text}`, 23, c.getTransform().a || 1) : 0;
  const aFont = `italic 400 ${aSize}px ${FONT.text}`;
  let width = o.width;
  if (o.attrib) {
    c.save();
    c.font = aFont;
    width = Math.max(width, c.measureText(o.attrib).width + 56);
    c.restore();
  }
  o = { ...o, width };
  const lines = wrapLines(c, o.text, font, o.width - 44);
  const lh = size * 1.32;
  const aH = o.attrib ? aSize * 1.5 : 0;
  const H = 30 + lines.length * lh + aH + 8;
  const rise = (1 - inU) * 14;
  c.save();
  softPlate(c, o.x, o.y + rise, o.width + 160, H + 120, env.mood.fg, 0.45 * A);
  c.translate(o.x, o.y + rise);
  c.rotate(o.rot ?? -0.012);
  c.globalAlpha = A;
  // shadow, deckled paper, a faint inner rule
  const sh = o.shadow ?? 0.45;
  if (sh > 0.45) {
    // a deeper, softer cast shadow under the card
    c.save();
    c.filter = `blur(${(6 * (c.getTransform().a || 1)).toFixed(1)}px)`;
    c.fillStyle = withAlpha(mixLab(env.mood.fg, '#000000', 0.4), sh);
    c.fillRect(-o.width / 2 + 8, -H / 2 + 10, o.width + 4, H + 4);
    c.restore();
  }
  c.fillStyle = withAlpha(env.mood.fg, Math.min(0.6, sh));
  c.fillRect(-o.width / 2 + 5, -H / 2 + 6, o.width, H);
  const paper = mixLab(P.sky[2], env.mood.halo, 0.18);
  c.fillStyle = paper;
  c.beginPath();
  const n = 18;
  c.moveTo(-o.width / 2, -H / 2);
  for (let i = 1; i <= n; i++) c.lineTo(-o.width / 2 + (o.width * i) / n, -H / 2 + (hash1(i, 7) - 0.5) * 2.2);
  for (let i = 1; i <= 6; i++) c.lineTo(o.width / 2 + (hash1(i, 8) - 0.5) * 2, -H / 2 + (H * i) / 6);
  for (let i = n - 1; i >= 0; i--) c.lineTo(-o.width / 2 + (o.width * i) / n, H / 2 + (hash1(i, 9) - 0.5) * 2.2);
  for (let i = 5; i >= 1; i--) c.lineTo(-o.width / 2 + (hash1(i, 10) - 0.5) * 2, -H / 2 + (H * i) / 6);
  c.closePath();
  c.fill();
  const edge = c.createRadialGradient(0, 0, o.width * 0.25, 0, 0, o.width * 0.7);
  edge.addColorStop(0, withAlpha('#7a5a30', 0));
  edge.addColorStop(1, withAlpha('#7a5a30', 0.28));
  c.fillStyle = edge;
  c.fill();
  c.strokeStyle = withAlpha(P.ink, 0.18);
  c.lineWidth = 0.8;
  c.strokeRect(-o.width / 2 + 7, -H / 2 + 7, o.width - 14, H - 14);
  c.fillStyle = withAlpha(P.ink, 0.92);
  c.font = font;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => {
    const k = win(t, o.at + 0.2 + i * 0.25, o.at + 0.7 + i * 0.25);
    c.globalAlpha = A * k;
    c.fillText(ln, 0, -H / 2 + 18 + size + i * lh);
  });
  if (o.attrib) {
    c.globalAlpha = A * 0.85 * win(t, o.at + 0.6, o.at + 1.2);
    c.font = aFont;
    c.fillText(o.attrib, 0, -H / 2 + 18 + size + (lines.length - 1) * lh + aSize * 1.55);
  }
  c.restore();
}

/**
 * The kit quoteCard (type.ts), with each wrapped line revealed at its own absolute time (`lineAt[i]`, e.g. a
 * T.word anchor), so a verbatim quote reads in step with the narrator. The plate and the open-quote mark rise at
 * `at`; the attribution follows the last line. Same look, sizes and legibility floor as the kit card.
 */
export function quoteCardAt(
  c: C,
  o: { quote: string; speaker: string; source?: string; x: number; y: number; width: number; maxChars?: number; size?: number; at: number; dur: number; lineAt: number[] },
  env: TypeEnv,
) {
  const A = envelope(env.t, o.at, o.dur, 0.6);
  if (A <= 0) return;
  const m = env.mood;
  const size0 = o.size ?? 28;
  const size = legibleSize(c, `italic 400 ${size0}px ${FONT.text}`, size0);
  const font = `italic 400 ${size}px ${FONT.text}`;
  const width = Math.max(o.width, o.width * (size / size0));
  const lines = wrapLines(c, o.quote, font, width, o.maxChars ?? 42);
  const lh = size * 1.38;
  const blockH = lines.length * lh + 70 + (o.source ? 28 : 0);
  const top = o.y - blockH / 2 + size;
  const col = '#efe3cf';
  const at = (i: number) => o.lineAt[Math.min(i, o.lineAt.length - 1)] ?? o.at;
  const rev = (t0: number) => sm((env.t - t0) / 0.6);
  c.save();
  c.globalAlpha = A;
  softPlate(c, o.x, o.y, width + 420, blockH + 200, m.ink, 0.5);
  c.globalAlpha = A * 0.4 * rev(o.at);
  c.fillStyle = titleColor(m);
  c.font = `600 ${size * 3.4}px ${FONT.display}`;
  c.textAlign = 'center';
  c.font = font;
  const firstW = c.measureText(lines[0] ?? '').width;
  c.font = `600 ${size * 3.4}px ${FONT.display}`;
  c.fillText('“', o.x - firstW / 2 - size * 0.75, top + size * 1.05);
  c.font = font;
  c.fillStyle = col;
  lines.forEach((ln, i) => {
    const k = rev(at(i));
    if (k <= 0) return;
    c.globalAlpha = A * k;
    c.fillText(i === lines.length - 1 ? ln + '”' : ln, o.x, top + i * lh + (1 - k) * 4);
  });
  const endT = at(lines.length - 1) + 0.7;
  const ay = top + (lines.length - 1) * lh + 52;
  c.globalAlpha = A * 0.9 * rev(endT);
  c.fillStyle = titleColor(m);
  const aSize = legibleSize(c, `500 19px ${FONT.sc}`, 19, o.speaker.toLowerCase());
  const aw = drawTracked(c, o.speaker.toLowerCase(), o.x + 14, ay, { font: `500 ${aSize}px ${FONT.sc}`, size: aSize, tracking: 0.15, align: 'center' });
  c.fillRect(o.x + 14 - aw / 2 - 30, ay - aSize * 0.32, 20, 0.9);
  if (o.source) {
    c.globalAlpha = A * 0.72 * rev(endT + 0.3);
    c.fillStyle = col;
    const sSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
    c.font = `italic 400 ${sSize}px ${FONT.text}`;
    c.textAlign = 'center';
    c.fillText(o.source, o.x, ay + 10 + sSize);
  }
  c.restore();
}

/** a line written in the pen hand (IM Fell English italic), revealed left to right from `at` over `dur` */
export function penLine(c: C, text: string, x: number, y: number, size: number, at: number, dur: number, t: number, ink: string, align: CanvasTextAlign = 'left') {
  const u = clamp01((tq12(t) - at) / dur);
  if (u <= 0) return;
  c.save();
  c.font = `italic 400 ${size}px ${FONT.fell}`;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const w = c.measureText(text).width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.beginPath();
  c.rect(x0 - 4, y - size * 1.2, (w + 8) * u, size * 1.7);
  c.clip();
  c.fillStyle = ink;
  c.fillText(text, x0, y);
  // the underline flourish
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, y + 5);
  c.quadraticCurveTo(x0 + w * 0.5, y + 8, x0 + w + 6, y + 3);
  c.stroke();
  c.restore();
}

/** the FLAME PUSH's bright pass (screen-locked, additive): k 0..1 */
export function bloom(f: Frame, k: number) {
  if (k <= 0.002) return;
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalCompositeOperation = 'lighter';
  const P = f.mood;
  const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
  g.addColorStop(0, withAlpha(P.core, 0.8 * k));
  g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.5 * k));
  g.addColorStop(1, withAlpha(P.halo, 0.22 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}

/** draw in screen space (stage px), above everything painted so far */
export function screen(f: Frame, draw: (c: C) => void) {
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  draw(c);
  c.restore();
}

/** a date-only stamp in IBM Plex Mono (1989 on), tracked, with the caption-bar rule; bottom-left by default */
export function monoDate(c: C, text: string, at: number, dur: number, env: { t: number; mood: Palette }, o: { x?: number; y?: number; align?: 'left' | 'right' } = {}) {
  const t = env.t;
  const A = win(t, at, at + 0.4) * (1 - win(t, at + dur - 0.5, at + dur));
  if (A <= 0.003) return;
  const x = o.x ?? 52, y = o.y ?? 668;
  const right = o.align === 'right';
  // screen-locked (stage px): 24 px cap at 1080p, over the 22 px floor
  const size = capSize(c, `500 19px ${FONT.mono}`, 24, c.getTransform().a || 1);
  c.save();
  const estW = text.length * size * 0.72;
  softPlate(c, right ? x - estW / 2 : x + estW / 2, y - 6, estW + 170, 96, env.mood.ink, 0.5 * A);
  const k = win(t, at, at + 0.6);
  c.globalAlpha = A * k;
  c.fillStyle = textColor(env.mood);
  const w = drawTracked(c, text, x + (right ? 0 : (1 - k) * -10), y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: right ? 'right' : 'left' });
  const rx = right ? x - w : x;
  c.globalAlpha = A * 0.6;
  c.fillRect(rx, y - size - 10, w * win(t, at + 0.2, at + 0.9), 0.8);
  c.fillRect(rx, y - size - 14, 0.8, 8);
  c.restore();
}

export { paperTone };
