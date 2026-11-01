/**
 * durable-objects-unbound — THE CANDLE (staging.buildList.leaseCandle): a lease, burning on a house's sill.
 *
 * workerd ONLY (badge 'workerd · 28 Oct'): full wax height = 20,000 ms; the painted BAND = the last 4,000 ms
 * (16,000 → 20,000: the safety margin, twice the 2,000 ms allowed clock skew); the NOTCH 8,000 ms before the end
 * (the 12,000 ms line: the last moment a renewal may start, so a full 4,000 ms attempt ends before the band).
 * height = (expiry − now) / 20,000.  celld's candles (variant 'celld') are a different implementation: ten-second
 * leases, drawn half as tall with a renewal mark one third of the way down, NO band and NO workerd scale; they
 * never appear beside workerd's numbers.
 *
 *   leaseCandle(c, env, o)     x, y = the sconce's base on the sill; s = 1 is a 120 px wax column
 *       o.nowMs / o.expiryMs   the lease clock (default expiry 20,000)
 *       o.band / o.notch       0..1 show the painted band / the renewal notch
 *       o.flame                0..1 lit;  o.bend 0..1 (a gust bends the flame low);  o.snuff 0..1 (snuffer cap)
 *       o.relight              0..1 a relight flash (renewal)
 *       o.latch                { pin: 0..1, open: 0..1 } the brass self-check latch on the sconce (ch05-s04)
 *   candleFlamePt(o)           world point of the flame (attach f.practical there)
 *   msToY(o, ms)               the wax y for a given clock reading (for rulers and brackets)
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS_HI, EMBER, brass, clamp01, glowDot, tone, type C2 } from './common';
import { pinShape } from './wellAndPlate';

export interface LeaseCandleOpts {
  x: number;
  y: number;
  s?: number;
  nowMs: number;
  expiryMs?: number;
  band?: number;
  notch?: number;
  flame?: number;
  bend?: number;
  snuff?: number;
  relight?: number;
  latch?: { pin: number; open: number; pinOut?: number };
  variant?: 'workerd' | 'celld';
  alpha?: number;
  seed?: number;
}
const WAX_H = 120, WAX_W = 14, SCONCE_H = 16;
const LEASE = 20000;
/** wax top y for the remaining fraction */
function waxTop(o: LeaseCandleOpts): number {
  const s = o.s ?? 1;
  const full = (o.variant === 'celld' ? WAX_H * 0.5 : WAX_H) * s;
  const span = o.variant === 'celld' ? 10000 : LEASE;
  const exp = o.expiryMs ?? span;
  const rem = clamp01((exp - o.nowMs) / span);
  return o.y - SCONCE_H * s - full * rem;
}
export function msToY(o: Pick<LeaseCandleOpts, 'x' | 'y' | 's' | 'variant' | 'expiryMs'>, ms: number): number {
  return waxTop({ ...o, nowMs: ms });
}
export function candleFlamePt(o: LeaseCandleOpts): { x: number; y: number } {
  const s = o.s ?? 1;
  const bend = clamp01(o.bend ?? 0);
  return { x: o.x + 8 * bend * s, y: waxTop(o) - (9 - 5 * bend) * s };
}
export function leaseCandle(c: C2, env: PaintEnv, o: LeaseCandleOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const celld = o.variant === 'celld';
  const top = waxTop(o);
  const base = o.y - SCONCE_H * s;
  c.save();
  c.globalAlpha *= A;
  // the full-height ghost of the wax column (an engraved outline: what a fresh lease would be)
  const fullTop = o.y - SCONCE_H * s - (celld ? WAX_H * 0.5 : WAX_H) * s;
  c.strokeStyle = withAlpha(env.fill('rim'), 0.16);
  c.lineWidth = 1;
  c.strokeRect(o.x - (WAX_W / 2) * s, fullTop, WAX_W * s, base - fullTop);
  // wax
  const wax = mixLab(tone(env, '#e9dcc0', 0.35), env.mood.fg, 0.35);
  c.fillStyle = wax;
  c.fillRect(o.x - (WAX_W / 2) * s, top, WAX_W * s, base - top);
  // the painted band (workerd: the last 4,000 ms at the candle's foot)
  if (!celld && (o.band ?? 0) > 0.01) {
    const yb = msToY(o, (o.expiryMs ?? LEASE) - 4000);
    const y0 = Math.max(yb, top);
    c.globalAlpha = A * clamp01(o.band ?? 0);
    c.fillStyle = tone(env, EMBER, 0.15);
    if (base > y0) c.fillRect(o.x - (WAX_W / 2) * s, y0, WAX_W * s, base - y0);
    // band outline on the ghost too (so a burnt-down candle still shows where the band was)
    c.strokeStyle = withAlpha(tone(env, EMBER, 0.15), 0.7);
    c.strokeRect(o.x - (WAX_W / 2) * s, yb, WAX_W * s, base - yb);
    c.globalAlpha = A;
  }
  // the renewal notch (workerd: 12,000 ms; celld: a mark one third of the way down)
  if ((o.notch ?? 0) > 0.01) {
    const yn = celld ? fullTop + (base - fullTop) / 3 : msToY(o, (o.expiryMs ?? LEASE) - 8000);
    c.globalAlpha = A * clamp01(o.notch ?? 0);
    c.fillStyle = brass(env, 0.5);
    c.beginPath();
    c.moveTo(o.x - (WAX_W / 2 + 7) * s, yn - 3 * s);
    c.lineTo(o.x - (WAX_W / 2) * s, yn);
    c.lineTo(o.x - (WAX_W / 2 + 7) * s, yn + 3 * s);
    c.closePath();
    c.fill();
    c.globalAlpha = A;
  }
  // wax highlight on the moon side
  c.fillStyle = withAlpha(env.mood.core, 0.12);
  c.fillRect(o.x - (WAX_W / 2) * s, top, 3 * s, base - top);
  // sconce: a brass dish and a stem
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(o.x - 16 * s, base);
  c.lineTo(o.x + 16 * s, base);
  c.lineTo(o.x + 10 * s, base + 5 * s);
  c.lineTo(o.x + 3 * s, base + 5 * s);
  c.lineTo(o.x + 5 * s, o.y);
  c.lineTo(o.x - 5 * s, o.y);
  c.lineTo(o.x - 3 * s, base + 5 * s);
  c.lineTo(o.x - 10 * s, base + 5 * s);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(brass(env, 0.6), 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(o.x - 16 * s, base);
  c.lineTo(o.x + 16 * s, base);
  c.stroke();
  // the self-check latch (a brass arm from the sconce to the candle, held by the red-tagged pin)
  if (o.latch) {
    const op = clamp01(o.latch.open);
    c.save();
    c.translate(o.x + 16 * s, base + 2 * s);
    c.rotate(-0.25 - 0.9 * op);
    c.fillStyle = brass(env, 0.4);
    c.fillRect(0, -1.5 * s, 18 * s, 3 * s);
    c.restore();
    const out = clamp01(o.latch.pinOut ?? 1 - o.latch.pin);
    pinShape(c, env, o.x + 17 * s + out * 40 * s, base + 2 * s + out * 26 * s, 0.4 + out * 0.6, s * 0.9);
  }
  // wick
  const fl = clamp01(o.flame ?? 1) * (1 - clamp01(o.snuff ?? 0));
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.2 * s;
  c.beginPath();
  c.moveTo(o.x, top);
  c.lineTo(o.x + 1 * s, top - 5 * s);
  c.stroke();
  // flame
  if (fl > 0.01) {
    const bend = clamp01(o.bend ?? 0);
    const t = env.t;
    const flick = 0.92 + 0.08 * Math.sin(t * 13 + (o.seed ?? 1) * 3.1) * Math.sin(t * 7.3 + (o.seed ?? 1));
    const fx = o.x + 1 * s, fy = top - 4 * s;
    c.save();
    c.translate(fx, fy);
    c.rotate(1.1 * bend + 0.05 * Math.sin(t * 5 + (o.seed ?? 0)));
    c.scale(s * flick * (1 - 0.35 * bend), s * flick * (1 - 0.45 * bend));
    c.globalAlpha = A * fl;
    const g = c.createRadialGradient(0, -6, 0, 0, -6, 12);
    g.addColorStop(0, '#fff7e0');
    g.addColorStop(0.35, tone(env, '#ffc860', 0.05));
    g.addColorStop(1, withAlpha(tone(env, '#ff8a30', 0.05), 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-5, -5, 0, -16);
    c.quadraticCurveTo(5, -5, 0, 0);
    c.fill();
    c.restore();
    const fp = candleFlamePt(o);
    glowDot(c, fp.x, fp.y, 26 * s, tone(env, '#ffb860', 0.05), 0.45 * fl * A);
  }
  // relight flash
  if ((o.relight ?? 0) > 0.01) {
    const fp = candleFlamePt(o);
    glowDot(c, fp.x, fp.y, 40 * s, tone(env, BRASS_HI, 0.05), 0.6 * (o.relight ?? 0) * A);
  }
  // snuffer cap
  const sn = clamp01(o.snuff ?? 0);
  if (sn > 0.01) {
    const yy = top - 18 * s - (1 - sn) * 40 * s;
    c.fillStyle = env.fill('ink');
    c.beginPath();
    c.moveTo(o.x - 7 * s, yy + 14 * s);
    c.lineTo(o.x, yy);
    c.lineTo(o.x + 7 * s, yy + 14 * s);
    c.closePath();
    c.fill();
    c.fillRect(o.x - 0.8 * s, yy - 22 * s, 1.6 * s, 22 * s);
  }
  c.restore();
}
