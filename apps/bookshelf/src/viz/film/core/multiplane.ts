/**
 * Multiplane camera math (ARCHITECTURE §5.2, style bible §3).
 *
 * LAYER COORDINATES: every layer is authored in "rest-screen" stage px — at
 * CAMERA3_HOME a point (x, y) drawn in ANY layer lands at (x, y) on screen, so
 * a 1280x720 painter fills the frame on every plane. Camera moves then give true
 * perspective parallax: with s = ZA·lens/(z − cam.z), s0 = ZA/z and k = s/s0,
 *
 *     screen = C + (p − C)·k − (cam.xy − home.xy)·s
 *
 * Pan/truck: near layers slide faster (L1 ×0.25 … L6 ×2.5). Dolly (cam.z +):
 * near layers grow faster. Lens: everything scales equally (flat, use rarely).
 * L0 (z = ∞) is screen-locked with a 3% drift so the backlight breathes.
 *
 *   layerXform(LAYERS.L3, cam)  -> { k, tx, ty, s }  (screen = p·k + t)
 *   toScreen(layer, cam, x, y) / toLayer(layer, cam, sx, sy)
 *   visibleRect(layer, cam, pad?)            layer-space rect the frame shows
 *   overscan(layer, [camA, camB, …], pad?)  union over a move: how wide to author art
 *   cam3Interp                               Timeline channel interpolator for Camera3:
 *       const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
 *       tl.tween(cam, { ...CAMERA3_HOME, x: 760, z: 120 }, { at: 0, dur: T.duration, ease: ease.move });
 *     the action-plane zoom (dolly·lens) is log-interpolated and the pan keeps the
 *     zoom's fixed point still, so the subject tracks a straight line; dolly-zoom
 *     (z up, lens down, same action-plane size) holds exactly.
 *   camMove(dx, dz, dy?)                     the default truck + slight dolly target (bible §3.3)
 */
import type { Camera3, LayerSpec } from '../contracts';
import { CAMERA3_HOME, FILM_H, FILM_W, ZA } from '../contracts';

const CX = FILM_W / 2;
const CY = FILM_H / 2;
/** L0 drift as a fraction of the action-plane pan */
export const L0_DRIFT = 0.03;

export interface LayerXform {
  /** scale of layer art relative to rest */
  k: number;
  /** translation (stage px): screen = p·k + t */
  tx: number;
  ty: number;
  /** absolute perspective scale ZA·lens/(z − cam.z) (0 for L0) */
  s: number;
}

const MIN_DEPTH = 40;

export function layerXform(layer: Pick<LayerSpec, 'z'>, cam: Camera3): LayerXform {
  const dx = cam.x - CAMERA3_HOME.x;
  const dy = cam.y - CAMERA3_HOME.y;
  if (!Number.isFinite(layer.z)) {
    const k = 1 + (cam.lens - 1) * L0_DRIFT;
    return { k, tx: CX - CX * k - dx * L0_DRIFT, ty: CY - CY * k - dy * L0_DRIFT, s: 0 };
  }
  const s = (ZA * cam.lens) / Math.max(MIN_DEPTH, layer.z - cam.z);
  const k = s / (ZA / layer.z);
  return { k, tx: CX - CX * k - dx * s, ty: CY - CY * k - dy * s, s };
}

export function toScreen(layer: Pick<LayerSpec, 'z'>, cam: Camera3, x: number, y: number): { x: number; y: number; k: number } {
  const m = layerXform(layer, cam);
  return { x: x * m.k + m.tx, y: y * m.k + m.ty, k: m.k };
}

export function toLayer(layer: Pick<LayerSpec, 'z'>, cam: Camera3, sx: number, sy: number): { x: number; y: number } {
  const m = layerXform(layer, cam);
  return { x: (sx - m.tx) / m.k, y: (sy - m.ty) / m.k };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The layer-space rectangle visible through the frame (plus `pad` screen px). */
export function visibleRect(layer: Pick<LayerSpec, 'z'>, cam: Camera3, pad = 0): Rect {
  const a = toLayer(layer, cam, -pad, -pad);
  const b = toLayer(layer, cam, FILM_W + pad, FILM_H + pad);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

/** Union of visibleRect over every camera of a move: the extent layer art must cover. */
export function overscan(layer: Pick<LayerSpec, 'z'>, cams: Camera3[], pad = 8): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cams.length ? cams : [CAMERA3_HOME]) {
    const r = visibleRect(layer, c, pad);
    x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** action-plane scale of a camera */
export const actionScale = (c: Camera3) => (ZA * c.lens) / Math.max(MIN_DEPTH, ZA - c.z);

/** Timeline channel interpolator for Camera3 (smooth pan/dolly/lens). */
export function cam3Interp(a: Camera3, b: Camera3): (u: number) => Camera3 {
  const w0 = 1 / actionScale(a);
  const w1 = 1 / actionScale(b);
  const lw0 = Math.log(w0), lw1 = Math.log(w1);
  const ll0 = Math.log(a.lens), ll1 = Math.log(b.lens);
  const zoomed = Math.abs(w0 - w1) > 1e-6 * w0;
  return (u) => {
    if (u <= 0) return a;
    if (u >= 1) return b;
    const w = Math.exp(lw0 + (lw1 - lw0) * u);
    const lens = Math.exp(ll0 + (ll1 - ll0) * u);
    // keep the zoom's fixed point still: centre moves in proportion to the width change
    const f = zoomed ? (w0 - w) / (w0 - w1) : u;
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      z: ZA * (1 - lens * w),
      lens,
    };
  };
}

/** The default move target: truck dx, dolly dz (and optional rise dy) from home. */
export function camMove(dx: number, dz: number, dy = 0, from: Camera3 = CAMERA3_HOME): Camera3 {
  return { x: from.x + dx, y: from.y + dy, z: from.z + dz, lens: from.lens };
}
