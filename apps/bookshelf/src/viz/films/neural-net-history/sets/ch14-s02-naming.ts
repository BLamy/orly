/**
 * ch14-s02 / ch14-s04b — the CANDLE NAMING RULE (sets/beliefCandle.ts) for the candles that live only as the
 * study shelf's REFLECTION in the window glass. beliefCandle's own namedLabel reads the canvas transform to find
 * the flame on screen, but the reflection is painted on an offscreen sheet, so these shots measure the flame on the
 * reflection plane themselves (reflFlameOnScreen) and draw the same card screen-locked, with a side they choose
 * (two named neighbours must not cover each other).
 *
 *   reflFlameOnScreen(f, p)          the screen point (stage px) of an L2-plane point, under the current camera
 *   reflNamedCard(c, o, mood)        the named card: horizontal, large, beside the flame, the belief in IBM Plex Mono
 *                                    (post-1989 face) over its date range, a fine leader to the flame
 *   namingK(t, at, hold, fall?)      0..1 envelope: rise 0.35 s from `at`, full for `hold`, fall over `fall`
 */
import type { Frame, LayerSpec, Palette } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, capPx1080, legibleSize } from '../../../film/silhouette/type';
import { REFL, sm } from './ch14-s01-strait';

type C = CanvasRenderingContext2D;

const PROBE: LayerSpec = { ...REFL, id: 'ch14Probe', blur: 0 };

export function reflFlameOnScreen(f: Frame, p: { x: number; y: number }): { x: number; y: number; k: number } {
  let out = { x: p.x, y: p.y, k: 1 };
  f.layer(PROBE, (c) => {
    const m = c.getTransform();
    const px = f.pxScale || 1.5;
    out = { x: (m.a * p.x + m.c * p.y + m.e) / px, y: (m.b * p.x + m.d * p.y + m.f) / px, k: Math.hypot(m.a, m.b) / px };
  });
  return out;
}

export function namingK(t: number, at: number, hold: number, fall = 0.4): number {
  return Math.min(sm((t - at) / 0.35), sm((at + 0.35 + hold + fall - t) / fall));
}

export interface NamedCardOpts {
  /** the flame on screen (stage px) */
  sx: number;
  sy: number;
  k: number;
  /** the belief, already broken into lines */
  lines: string[];
  /** the date range line (omit: no date line, e.g. when the base tag already carries the year) */
  dates?: string;
  /** cap height of the belief at 1080p (default 26; never under the 22 px floor) */
  cap?: number;
  side: 'left' | 'right';
  /** gap between flame and card (stage px) */
  gap?: number;
  /** extra lines under the dates (e.g. a measured span), drawn in the date face */
  extra?: string[];
  /** pin the card's top edge (stage px) instead of centring it on the flame (e.g. above something hanging there) */
  top?: number;
}

/** the named card (same look as beliefCandle's drawNamedCard: warm paper, cut-card shadow, inner rule, leader) */
export function reflNamedCard(c: C, o: NamedCardOpts, mood: Palette) {
  const k = Math.max(0, Math.min(1, o.k));
  if (k <= 0.003) return;
  c.save();
  // 26 px cap height on a 1080p frame (the floor is 22)
  const face = FONT.mono;
  const cap = Math.max(22, o.cap ?? 26);
  const size = Math.max(legibleSize(c, `500 18px ${face}`, 18), (18 * cap) / Math.max(1e-3, capPx1080(c, `500 18px ${face}`)));
  const dSize = Math.max(legibleSize(c, `italic 400 20px ${FONT.text}`, 20), 22);
  const tFont = `500 ${size}px ${face}`;
  const dFont = `italic 400 ${dSize}px ${FONT.text}`;
  c.font = tFont;
  const tw = Math.max(...o.lines.map((l) => c.measureText(l).width), 0);
  c.font = dFont;
  const sub = [...(o.dates ? [o.dates] : []), ...(o.extra ?? [])];
  const dw = Math.max(0, ...sub.map((l) => c.measureText(l).width));
  const pad = sub.length ? 14 : 10;
  const lh = size * 1.18;
  const w = Math.max(tw, dw) + pad * 2;
  const h = o.lines.length * lh + sub.length * dSize * 1.3 + pad * 1.8;
  const gap = o.gap ?? 22;
  let x0 = o.side === 'left' ? o.sx - gap - w : o.sx + gap;
  x0 = Math.max(84, Math.min(1196 - w, x0));
  let y0 = o.top ?? o.sy - h * 0.35;
  y0 = Math.max(40, Math.min(720 * 0.86 - h, y0));
  const grow = 0.94 + 0.06 * k;
  c.globalAlpha = Math.min(1, k * 1.15);
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
  // leader to the flame
  const lx = o.side === 'left' ? w : 0;
  c.strokeStyle = withAlpha(mood.rim, 0.8);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(lx, Math.min(h * 0.4, 40));
  c.lineTo(o.sx - x0, o.sy - y0);
  c.stroke();
  const paper = mixLab(mood.halo, '#efe4cc', 0.62);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(0, 0, w, h);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(mood.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(5, 5, w - 10, h - 10);
  const inkC = mixLab(mood.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = tFont;
  o.lines.forEach((l, i) => c.fillText(l, pad, pad + size * 0.95 + i * lh));
  c.fillStyle = withAlpha(inkC, 0.85);
  c.font = dFont;
  sub.forEach((l, i) => c.fillText(l, pad, pad + o.lines.length * lh + dSize * 1.05 + i * dSize * 1.3));
  c.restore();
}
