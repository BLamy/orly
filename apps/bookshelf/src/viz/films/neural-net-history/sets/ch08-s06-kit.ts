/**
 * ch08-s06 … ch08-s09 — small helpers shared by this animator's group (chapter 8, "The Night in Florence":
 * the stencils learned, the weir, the scale, the snuffed halls, the two towers).
 *
 *   sm / clamp01 / lerp / win / tq12 / monotone       (re-exported)
 *   pulse(t, at, rise, fall)                          a 0..1 bump
 *   PICTURES                                          training-picture silhouettes (100 × 100 box, origin top-left):
 *                                                     husky, cat, bird, car, boat, flower, house, fish
 *   picture(c, i, x, y, size, ink, light, alpha)      one picture card: a lit square with the silhouette on it
 *   toyStencil(c, env, x, y, size, alpha)             the hand-set 3 × 3 tin stencil of ch08-s04 (Sobel vertical:
 *                                                     pierced holes = positive weights, cool-rimmed shutters = negative)
 *   inkLabel(c, text, x, y, o)                        a line of type on a feathered ink plate (screen-locked)
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, softPlate } from '../../../film/silhouette/type';
import { glow } from '../../../film/silhouette/metaphors/kit';

export { clamp01, sm, lerp, win, tq12, monotone } from './ch02-s05b-util';
import { sm } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;

export function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t < at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return Math.exp(-(t - at - rise) / Math.max(1e-3, fall));
}

// ------------------------------------------------------------------------------------------------ pictures
function P(build: (p: Path2D) => void): Path2D {
  const p = new Path2D();
  build(p);
  return p;
}
export const PICTURES: Path2D[] = [
  // husky head, three-quarter profile, ears up
  P((p) => {
    p.moveTo(28, 92);
    p.lineTo(30, 60);
    p.quadraticCurveTo(26, 44, 30, 34);
    p.lineTo(26, 8);
    p.lineTo(44, 26);
    p.quadraticCurveTo(54, 22, 62, 26);
    p.lineTo(78, 8);
    p.lineTo(76, 36);
    p.quadraticCurveTo(82, 46, 92, 52);
    p.quadraticCurveTo(96, 58, 90, 62);
    p.quadraticCurveTo(80, 66, 70, 64);
    p.quadraticCurveTo(72, 80, 76, 92);
    p.closePath();
  }),
  // sitting cat
  P((p) => {
    p.moveTo(30, 94);
    p.quadraticCurveTo(22, 70, 34, 52);
    p.quadraticCurveTo(30, 40, 34, 30);
    p.lineTo(32, 12);
    p.lineTo(44, 24);
    p.quadraticCurveTo(50, 22, 56, 24);
    p.lineTo(66, 12);
    p.lineTo(64, 32);
    p.quadraticCurveTo(68, 42, 62, 50);
    p.quadraticCurveTo(76, 66, 70, 94);
    p.quadraticCurveTo(86, 92, 88, 80);
    p.quadraticCurveTo(92, 92, 76, 96);
    p.closePath();
  }),
  // perched bird
  P((p) => {
    p.moveTo(14, 46);
    p.lineTo(26, 40);
    p.quadraticCurveTo(30, 26, 44, 28);
    p.quadraticCurveTo(54, 30, 56, 42);
    p.quadraticCurveTo(80, 50, 94, 72);
    p.quadraticCurveTo(76, 70, 60, 66);
    p.lineTo(52, 82);
    p.lineTo(48, 82);
    p.lineTo(50, 66);
    p.quadraticCurveTo(36, 60, 32, 48);
    p.closePath();
    p.rect(10, 82, 84, 4);
  }),
  // car
  P((p) => {
    p.moveTo(6, 72);
    p.lineTo(8, 58);
    p.lineTo(26, 54);
    p.lineTo(38, 40);
    p.lineTo(68, 40);
    p.lineTo(80, 54);
    p.lineTo(94, 58);
    p.lineTo(94, 72);
    p.closePath();
    p.moveTo(30 + 9, 74);
    p.arc(30, 74, 9, 0, Math.PI * 2);
    p.moveTo(74 + 9, 74);
    p.arc(74, 74, 9, 0, Math.PI * 2);
  }),
  // sailing boat
  P((p) => {
    p.moveTo(12, 70);
    p.lineTo(88, 70);
    p.lineTo(76, 84);
    p.lineTo(22, 84);
    p.closePath();
    p.moveTo(50, 66);
    p.lineTo(50, 10);
    p.lineTo(80, 64);
    p.closePath();
    p.moveTo(46, 66);
    p.lineTo(46, 20);
    p.lineTo(22, 64);
    p.closePath();
  }),
  // flower
  P((p) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      p.moveTo(50 + Math.cos(a) * 26 + 11, 36 + Math.sin(a) * 26);
      p.arc(50 + Math.cos(a) * 22, 36 + Math.sin(a) * 22, 11, 0, Math.PI * 2);
    }
    p.moveTo(60, 36);
    p.arc(50, 36, 10, 0, Math.PI * 2);
    p.rect(48, 46, 4, 50);
    p.moveTo(52, 78);
    p.quadraticCurveTo(70, 62, 78, 70);
    p.quadraticCurveTo(66, 80, 52, 80);
  }),
  // house
  P((p) => {
    p.moveTo(14, 50);
    p.lineTo(50, 18);
    p.lineTo(86, 50);
    p.lineTo(78, 50);
    p.lineTo(78, 90);
    p.lineTo(22, 90);
    p.lineTo(22, 50);
    p.closePath();
    p.rect(44, 66, 12, 24);
  }),
  // fish
  P((p) => {
    p.moveTo(14, 50);
    p.quadraticCurveTo(40, 22, 70, 46);
    p.lineTo(90, 30);
    p.lineTo(86, 50);
    p.lineTo(90, 70);
    p.lineTo(70, 54);
    p.quadraticCurveTo(40, 78, 14, 50);
    p.closePath();
  }),
];

/** a picture card: a lit square with a training-picture silhouette (alpha fades the whole card) */
export function picture(c: C, i: number, x: number, y: number, size: number, ink: string, light: string, alpha = 1): void {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x - size / 2, y - size / 2);
  c.fillStyle = light;
  c.fillRect(0, 0, size, size);
  c.scale(size / 100, size / 100);
  c.fillStyle = ink;
  c.fill(PICTURES[((i % PICTURES.length) + PICTURES.length) % PICTURES.length], 'nonzero');
  c.restore();
}

// ------------------------------------------------------------------------------------------------ toy stencil
const SOBEL_V = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
/** the hand-set 3 × 3 tin stencil of ch08-s04 (Sobel vertical), centred at (x, y), side `size` */
export function toyStencil(c: C, env: PaintEnv, x: number, y: number, size: number, alpha = 1): void {
  if (alpha <= 0.003) return;
  const m = env.mood;
  const ink = env.fill('ink');
  const pad = size * 0.09;
  const F = size - pad * 2;
  const tc = F / 3;
  const sx = x - F / 2;
  const sy = y - F / 2;
  c.save();
  c.globalAlpha *= alpha;
  // the plate (tin), pierced where the weights are positive
  const plate = new Path2D();
  plate.rect(sx - pad, sy - pad, F + pad * 2, F + pad * 2);
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const w = SOBEL_V[j * 3 + i];
      if (w <= 0) continue;
      const rr = (tc * 0.42 * Math.abs(w)) / 2;
      plate.moveTo(sx + i * tc + tc / 2 + rr, sy + j * tc + tc / 2);
      plate.arc(sx + i * tc + tc / 2, sy + j * tc + tc / 2, rr, 0, Math.PI * 2);
    }
  c.fillStyle = mixLab(ink, m.set, 0.35);
  c.fill(plate, 'evenodd');
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1, size * 0.025);
  c.beginPath();
  for (let q = 1; q < 3; q++) {
    c.moveTo(sx + q * tc, sy - pad);
    c.lineTo(sx + q * tc, sy + F + pad);
    c.moveTo(sx - pad, sy + q * tc);
    c.lineTo(sx + F + pad, sy + q * tc);
  }
  c.stroke();
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const w = SOBEL_V[j * 3 + i];
      const cx = sx + i * tc + tc / 2;
      const cy = sy + j * tc + tc / 2;
      const rr = (tc * 0.42 * Math.abs(w)) / 2;
      if (w > 0) {
        c.fillStyle = mixLab(m.halo, m.core, 0.6);
        c.beginPath();
        c.arc(cx, cy, rr, 0, Math.PI * 2);
        c.fill();
        glow(c, cx, cy, rr * 2.4, m.core, 0.5);
      } else if (w < 0) {
        c.strokeStyle = withAlpha(mixLab(m.rim, MOODS.winterBlue.rim, 0.85), 0.9);
        c.lineWidth = Math.max(1, size * 0.018);
        c.beginPath();
        c.arc(cx, cy, rr, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(cx - rr * 0.7, cy);
        c.lineTo(cx + rr * 0.7, cy);
        c.stroke();
      }
    }
  c.strokeStyle = withAlpha(m.rim, 0.55);
  c.lineWidth = 1;
  c.strokeRect(sx - pad + 1.5, sy - pad + 1.5, F + pad * 2 - 3, F + pad * 2 - 3);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ type
export interface InkLabelOpts {
  size?: number;
  font?: string;
  color: string;
  align?: CanvasTextAlign;
  alpha?: number;
  plate?: string;
  plateAlpha?: number;
  tracking?: number;
}
/** one line of type over a feathered ink plate (screen-locked) */
export function inkLabel(c: C, text: string, x: number, y: number, o: InkLabelOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const size = o.size ?? 22;
  c.save();
  c.font = o.font ?? `italic 400 ${size}px ${FONT.text}`;
  (c as C & { letterSpacing: string }).letterSpacing = `${o.tracking ?? 0}px`;
  const w = c.measureText(text).width;
  const align = o.align ?? 'left';
  const cx = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
  if (o.plate) {
    c.globalAlpha = A;
    softPlate(c, cx, y - size * 0.32, w + 120, size + 56, o.plate, o.plateAlpha ?? 0.6);
  }
  c.globalAlpha = A;
  c.fillStyle = o.color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
  c.restore();
}
