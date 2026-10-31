/**
 * neural-net-history — small helpers shared by ch05-s01, ch05-s03, ch05-s04, ch05-s05, ch05-s06
 * (one animator's group).
 *
 *   clamp01 / sm / lerp / win / tq12 / monotone      (re-exported from ch02-s05b-util)
 *   camKeys(keys)                                    monotone camera from [t, x, y, z] keys (ch03-s06-kit)
 *   pulse(t, at, rise, fall)                         a one-shot 0 → 1 → 0 envelope
 *   chalk(c, draw, col, w, alpha)                    a chalk stroke (two offset passes, slightly rough)
 *   textPlateLabel(c, text, x, y, o)                 a short screen-locked label in the film's serif on a soft plate
 *   phosphorStamp(c, o, env)                         placeStamp (VT323, bottom-left) with an explicit hold/fade window
 */
import type { Palette } from '../../../film/contracts';
import { FONT, placeStamp, softPlate, textColor } from '../../../film/silhouette/type';
import { withAlpha } from '../../../film/silhouette/palette';

export { clamp01, sm, lerp, win, tq12, monotone } from './ch02-s05b-util';
export { camKeys } from './ch03-s06-kit';

/** a one-shot envelope: 0 before `at`, rises over `rise`, falls over `fall` */
export function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) {
    const u = (t - at) / rise;
    return u * u * (3 - 2 * u);
  }
  const v = (t - at - rise) / fall;
  if (v >= 1) return 0;
  return 1 - v * v * (3 - 2 * v);
}

/** a chalk stroke: the path drawn twice, slightly offset, so the line reads as dry chalk on slate */
export function chalk(c: CanvasRenderingContext2D, draw: (c: CanvasRenderingContext2D) => void, col: string, w: number, alpha = 0.8) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = withAlpha(col, alpha * 0.55);
  c.lineWidth = w * 1.7;
  c.beginPath();
  draw(c);
  c.stroke();
  c.translate(0.6, -0.4);
  c.strokeStyle = withAlpha(col, alpha);
  c.lineWidth = w;
  c.beginPath();
  draw(c);
  c.stroke();
  c.restore();
}

/** a short label (the film's serif, italic) on a feathered ink plate; screen-locked */
export function textPlateLabel(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: { mood: Palette; alpha: number; size?: number; align?: 'left' | 'center' | 'right'; italic?: boolean; plate?: number; color?: string; font?: string },
) {
  if (o.alpha <= 0.003) return 0;
  const size = o.size ?? 30;
  c.save();
  c.font = o.font ?? `${o.italic === false ? '' : 'italic '}400 ${size}px ${FONT.text}`;
  const w = c.measureText(text).width;
  const align = o.align ?? 'center';
  const cx = align === 'center' ? x : align === 'left' ? x + w / 2 : x - w / 2;
  c.globalAlpha = o.alpha;
  if ((o.plate ?? 0.55) > 0) softPlate(c, cx, y - size * 0.32, w + 190, size + 74, o.mood.ink, o.plate ?? 0.55);
  c.fillStyle = o.color ?? textColor(o.mood);
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
  c.restore();
  return w;
}

/** the era stamp (VT323 phosphor for the 1980s), bottom-left, typed on from `at`, faded out at `until` */
export function phosphorStamp(c: CanvasRenderingContext2D, o: { place: string; date: string; year: number; at: number; until?: number; fade?: number }, env: { t: number; mood: Palette; seed?: number }) {
  const until = o.until ?? Infinity;
  placeStamp(c, { place: o.place, date: o.date, year: o.year, at: o.at, dur: Number.isFinite(until) ? until - o.at : undefined, fade: o.fade ?? 0.45 }, env);
}
