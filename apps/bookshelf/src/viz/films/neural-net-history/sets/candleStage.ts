/**
 * neural-net-history — THE EDGE OF THE LIGHT (treatment §3.2): when a candle is lit, the camera pushes into
 * its flame and arrives on a paper stage where the same candle stands huge and throws one round pool of
 * light across a dark floor. THE RULE NEVER CHANGES: the holders of the belief stand INSIDE the pool,
 * facing the flame; the dissenters stand at the RIM, half in shadow, FACING OUT, their long shadows thrown
 * across the floor away from the candle. Testimony happens here (quote cards beside a figure at the rim).
 *
 *   candleStage(f, { key, cams, candle, candleX?, burn?, flame?, pool?, draw: (c, env, geo) => {…} })
 *     paints: dim backlight · L2 backdrop warmed behind the flame · floor + pool of light · the huge candle
 *     (beliefCandle at STAGE.s, ring-scored, its ghost sleeve the years so far) · YOUR figures (draw) · rim ·
 *     the flame practical · a drifting haze in the beam.
 *   geo: { candleX, floorY, flame, poolX, poolRx, rimX (right rim), rimXL (left rim), inPool(x) }
 *   floorShadow(c, geo, feetX, draw)   cast a figure's long shadow along the floor, away from the candle
 *   stageSpot(geo, 'holder' | 'rim' | 'rimL', i)   a standard mark for the i-th figure of each kind
 *
 * Colour: the stage takes the shot's mood (era colour): candleAmber 1943, labGreen 1958, winterBlue
 * 1969–76, dawnGold 1986/2012, duskRose 2023 … The candle is the only light.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { beliefCandle, candleFlame } from './beliefCandle';
import type { CandleView } from './studyState';

export const STAGE = {
  /** feet line of the action plane */
  floorY: 640,
  /** the candle's base */
  candleX: 560,
  /** candle scale on the stage (huge: ~570 px of wax) */
  s: 2.1,
  /** pool radius on the floor (x), and its floor-perspective height */
  poolRx: 430,
  poolRy: 64,
} as const;

export interface StageGeo {
  candleX: number;
  floorY: number;
  flame: { x: number; y: number };
  poolX: number;
  poolRx: number;
  /** the right rim of the pool (where the light fades into shadow) */
  rimX: number;
  /** the left rim */
  rimXL: number;
  /** 0..1 how lit a floor x is (1 at the candle, 0 past the rim) */
  inPool(x: number): number;
}

export interface CandleStageOpts {
  key: string;
  cams: Camera3[];
  candle: CandleView;
  candleX?: number;
  /** candle scale (default STAGE.s) */
  s?: number;
  /** extra rings burned during the shot */
  burn?: number;
  /** flame strength 0..1 (0 = out: no pool) */
  flame?: number;
  /** pool radius multiplier (the pool shrinks as a candle gutters) */
  pool?: number;
  /** a second, softer light (e.g. the messenger's lamp) — not used by default */
  draw?: (c: CanvasRenderingContext2D, env: PaintEnv, geo: StageGeo) => void;
  /** draw behind the candle on L3 (passers-by, a far row) */
  back?: (c: CanvasRenderingContext2D, env: PaintEnv, geo: StageGeo) => void;
  /** lettering alpha on the huge candle (it "catches the flame" on a beat) */
  letters?: number;
  /** rim direction override */
  rimDir?: { x: number; y: number };
}

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function stageGeo(o: Pick<CandleStageOpts, 'candle' | 'candleX' | 's' | 'burn' | 'flame' | 'pool'>): StageGeo {
  const cx = o.candleX ?? STAGE.candleX;
  const s = o.s ?? STAGE.s;
  const fk = o.flame ?? (o.candle.state === 'live' ? 1 : 0);
  const R = STAGE.poolRx * (o.pool ?? 1) * (0.35 + 0.65 * fk);
  const flame = candleFlame({ x: cx, y: STAGE.floorY, view: o.candle, s, burn: o.burn });
  return {
    candleX: cx,
    floorY: STAGE.floorY,
    flame,
    poolX: cx,
    poolRx: R,
    rimX: cx + R,
    rimXL: cx - R,
    inPool: (x: number) => {
      const u = Math.max(0, 1 - Math.abs(x - cx) / R);
      return fk * u * u * (3 - 2 * u);
    },
  };
}

/** standard marks: holders face the flame inside the pool; dissenters at the rim facing out */
export function stageSpot(geo: StageGeo, kind: 'holder' | 'holderL' | 'rim' | 'rimL', i = 0): { x: number; facing: 'left' | 'right' } {
  switch (kind) {
    case 'holder':
      return { x: geo.candleX + 150 + i * 105, facing: 'left' };
    case 'holderL':
      return { x: geo.candleX - 150 - i * 105, facing: 'right' };
    case 'rim':
      return { x: geo.rimX + 10 + i * 90, facing: 'right' };
    case 'rimL':
      return { x: geo.rimXL - 10 - i * 90, facing: 'left' };
  }
}

/**
 * Cast a figure's long shadow along the floor away from the candle. `draw(c)` draws the figure with its
 * feet at (0, 0) (e.g. puppet.draw(c, { x: 0, y: 0, … }, env)); the shadow is the same cut-out laid flat.
 */
export function floorShadow(c: C, geo: StageGeo, feetX: number, draw: (c: C) => void, env: PaintEnv, strength = 1) {
  const dir = feetX >= geo.candleX ? 1 : -1;
  const lit = Math.max(0.15, geo.inPool(feetX) + 0.35);
  const len = 1.25 + 0.6 * (1 - geo.inPool(feetX)); // longer toward the rim
  c.save();
  c.globalAlpha *= 0.62 * strength * lit;
  c.translate(feetX, geo.floorY + 2);
  // figure-up (0,-1) → along the floor away from the flame; figure-x → a thin depth sliver
  c.transform(0, 0.16, -dir * len, -0.1 * len, 0, 0);
  draw(c);
  c.restore();
}

export function candleStage(f: Frame, o: CandleStageOpts) {
  const geo = stageGeo(o);
  const s = o.s ?? STAGE.s;
  const fk = o.flame ?? (o.candle.state === 'live' ? 1 : 0);
  f.backlight({ sunX: geo.flame.x, sunY: geo.flame.y + 80, sunRadius: 520, intensity: 0.35 + 0.35 * fk });

  // L2: the backdrop: a dark paper curtain with faint folds, warmed in a halo behind the flame
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/stage/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.45);
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
    // the flame's glow on the backdrop (dynamic: flicker with the flame strength)
    const gx = geo.flame.x, gy = geo.flame.y + 120;
    const R = 620 * (0.4 + 0.6 * fk);
    const g = c.createRadialGradient(gx, gy, 10, gx, gy, R);
    g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.55), 0.85 * fk));
    g.addColorStop(0.45, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.25), 0.45 * fk));
    g.addColorStop(1, withAlpha(env.mood.set, 0));
    c.fillStyle = g;
    c.fillRect(gx - R, gy - R, 2 * R, 2 * R);
  });
  f.fog({ yCenter: 0.55 * 720, height: 0.45 * 720, alpha: 0.12 + 0.12 * fk, drift: 5 });
  if (o.back) f.layer('L3', (c, env) => o.back!(c, env, geo));
  f.fog('B');

  f.layer('L4', (c, env) => {
    // the floor: dark boards receding, and the POOL of light on it
    const fy = geo.floorY;
    const r = overscan(LAYERS.L4, o.cams, 40);
    c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
    c.fillRect(r.x, fy - 6, r.w, r.y + r.h - fy + 6);
    c.save();
    c.translate(geo.poolX, fy + 14);
    c.scale(1, STAGE.poolRy / Math.max(1, geo.poolRx));
    const pg = c.createRadialGradient(0, 0, 10, 0, 0, geo.poolRx * 1.05);
    pg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.95 * fk));
    pg.addColorStop(0.55, withAlpha(env.mood.halo, 0.6 * fk));
    pg.addColorStop(0.86, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.3 * fk));
    pg.addColorStop(1, withAlpha(env.mood.set, 0));
    c.fillStyle = pg;
    c.beginPath();
    c.arc(0, 0, geo.poolRx * 1.05, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // floorboards: faint seams converging, lit only in the pool
    c.strokeStyle = withAlpha(env.mood.fg, 0.35);
    c.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
      c.beginPath();
      c.moveTo(geo.poolX + i * 60, fy);
      c.lineTo(geo.poolX + i * 110, r.y + r.h);
      c.stroke();
    }
    // the huge candle (the same candle as on the study shelf: its sleeve = the years so far)
    beliefCandle(c, { x: geo.candleX, y: fy, view: o.candle, s, burn: o.burn, flame: fk, drawFlame: false, letters: o.letters ?? 0.75, smoke: fk > 0 ? 0 : undefined }, env);
    o.draw?.(c, env, geo);
  });
  f.rim(o.rimDir ?? { x: 0, y: -1 });
  if (fk > 0) f.practical({ x: geo.flame.x, y: geo.flame.y + 4 * s, kind: 'candle', seed: 1943 + o.candle.slot, intensity: fk, radius: 70 + 40 * fk });
  return geo;
}
