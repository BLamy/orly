/**
 * ch04-s08 — the chess slip (Wall slot W2) as it ages: the same typed slip and manila due-date tag as
 * ch03-s06's drawChessSlip (SIMON & NEWELL / CHESS CHAMPION / BY 1968, tag 1968), with yellowing and a
 * curling bottom corner (drawSlip's own yellow/curl), so the slip can turn overdue on screen.
 *
 *   agedChessSlip(c, { x, y, k, light, yellow, curl, tagSway, overdue? }, env) → the tag's world centre
 *   With `overdue` (0..1) the due-date tag is drawn as the large manila tag that carries the shot's label,
 *   CHESS CHAMPION / DUE 1968, hanging under the slip, and an oxblood OVERDUE is stamped across it.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { drawSlip, WALL_SLOTS } from './wallOfForecasts';
import { oxblood, paperTone } from './caseBoard';
import { W2_LINES, W2_VIEW } from './ch03-s06-kit';

export interface AgedSlipDraw {
  x: number;
  y: number;
  k: number;
  light: number;
  yellow: number;
  curl: number;
  tagSway?: number;
  /** draw the large label tag under the slip; the OVERDUE stamp lands as this goes 0 → 1 */
  overdue?: number;
  /** the large tag's type size (layer px) */
  tagFont?: number;
}

export function agedChessSlip(c: CanvasRenderingContext2D, o: AgedSlipDraw, env: PaintEnv): { x: number; y: number } {
  const sz = WALL_SLOTS.W2;
  const k = o.k;
  drawSlip(c, { ...W2_VIEW, text: '' }, { x: o.x, y: o.y, k, light: o.light, yellow: o.yellow, curl: o.curl }, env);
  // the typed lines (as ch03-s06), on the yellowed paper
  let paper = paperTone(env, o.light);
  if (o.yellow) paper = mixLab(paper, mixLab(env.mood.halo, '#8a6a2a', 0.5), 0.5 * o.yellow);
  const ink = mixLab(env.mood.ink, paper, 0.1 + 0.08 * o.yellow);
  const seedRot = hash1(1, 23) * 0.04 + o.curl * 0.05;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(seedRot);
  const maxW = sz.w * k * 0.86;
  let size = 10.5 * k;
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const widest = Math.max(...W2_LINES.map((l) => c.measureText(l).width));
  if (widest > maxW) {
    size *= maxW / widest;
    c.font = `400 ${size}px ${FONT.typewriter}`;
  }
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lh = size * 1.22;
  W2_LINES.forEach((l, i) => c.fillText(l, 0, 3 * k + (i - 1) * lh - (i === 2 ? o.curl * 2 * k : 0)));
  c.restore();
  if (o.overdue != null) return bigTag(c, o, env);
  // the due-date tag on its thread from the pin, past the slip's right shoulder
  const pinY = o.y - (sz.h / 2 - 6) * k;
  const px = o.x, py = pinY;
  const sx = o.x + (sz.w / 2 + 1) * k, sy = o.y - (sz.h / 2) * k + 1 * k;
  const a = o.tagSway ?? 0;
  const L = 16 * k;
  const tx = sx + 4 * k + Math.sin(a) * L, ty = sy + Math.cos(a) * L;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.3), 0.8);
  c.lineWidth = 0.8 * k;
  c.beginPath();
  c.moveTo(px, py);
  c.quadraticCurveTo((px + sx) / 2, sy - 1.5 * k, sx, sy);
  c.quadraticCurveTo(sx + 4 * k, sy + L * 0.4, tx, ty);
  c.stroke();
  const tw = 36 * k, th = 17 * k;
  const manila = mixLab(mixLab(paperTone(env, o.light * 0.9), mixLab(env.mood.halo, '#9a7a3c', 0.5), 0.45), '#7a5a26', 0.25 * o.yellow);
  c.save();
  c.translate(tx, ty);
  c.rotate(-a * 0.6 + 0.08 * o.curl);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-tw * 0.1 + 1.5 * k, 2.5 * k, tw, th);
  c.fillStyle = manila;
  c.beginPath();
  c.moveTo(-tw * 0.1 + 4 * k, 0);
  c.lineTo(-tw * 0.1 + tw - 4 * k, 0);
  c.lineTo(-tw * 0.1 + tw, 4 * k);
  c.lineTo(-tw * 0.1 + tw, th);
  c.lineTo(-tw * 0.1, th);
  c.lineTo(-tw * 0.1, 4 * k);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.beginPath();
  c.arc(0, 3.2 * k, 1.4 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, manila, 0.12);
  c.font = `400 ${9.5 * k}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('1968', -tw * 0.1 + tw / 2 + 1 * k, th * 0.6);
  c.restore();
  return { x: tx - tw * 0.1 + tw / 2, y: ty + th / 2 };
}

/** the large manila due-date tag hanging under the slip on a short string: CHESS CHAMPION / DUE 1968 + OVERDUE */
function bigTag(c: CanvasRenderingContext2D, o: AgedSlipDraw, env: PaintEnv): { x: number; y: number } {
  const sz = WALL_SLOTS.W2;
  const k = o.k;
  const fs = o.tagFont ?? 12;
  const a = o.tagSway ?? 0;
  // the string from the slip's lower right corner
  const sx = o.x + (sz.w / 2 - 14) * k, sy = o.y + (sz.h / 2 - 2) * k;
  const L = 14 * k;
  const tx = sx + Math.sin(a) * L, ty = sy + Math.cos(a) * L;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.3), 0.85);
  c.lineWidth = 0.9 * k;
  c.beginPath();
  c.moveTo(sx, sy);
  c.quadraticCurveTo(sx + 2 * k, sy + L * 0.5, tx, ty);
  c.stroke();
  c.font = `400 ${fs}px ${FONT.typewriter}`;
  const tw = Math.max(c.measureText('CHESS CHAMPION').width, c.measureText('DUE 1968').width) + fs * 1.6;
  const th = fs * 5.2;
  const manila = mixLab(mixLab(paperTone(env, o.light), mixLab(env.mood.halo, '#9a7a3c', 0.5), 0.4), '#7a5a26', 0.22 * o.yellow);
  c.save();
  c.translate(tx, ty);
  c.rotate(-a * 0.5 + 0.03);
  // the tag hangs from its hole at the top centre
  const x0 = -tw / 2, y0 = 0;
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(x0 + 3, y0 + 4, tw, th);
  c.fillStyle = manila;
  c.beginPath();
  c.moveTo(x0 + fs * 0.6, y0);
  c.lineTo(x0 + tw - fs * 0.6, y0);
  c.lineTo(x0 + tw, y0 + fs * 0.6);
  c.lineTo(x0 + tw, y0 + th);
  c.lineTo(x0, y0 + th);
  c.lineTo(x0, y0 + fs * 0.6);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.beginPath();
  c.arc(0, y0 + fs * 0.45, fs * 0.16, 0, Math.PI * 2);
  c.fill();
  const ink = mixLab(env.mood.ink, manila, 0.1);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('CHESS CHAMPION', 0, y0 + fs * 1.45);
  c.fillText('DUE 1968', 0, y0 + fs * 2.6);
  // the OVERDUE stamp: lands with a small overshoot, oxblood, slightly askew
  const u = o.overdue ?? 0;
  if (u > 0) {
    const land = Math.min(1, u * 1.2);
    const sc = 1 + 0.35 * (1 - land) * (1 - land);
    c.save();
    c.translate(0, y0 + fs * 4.0);
    c.rotate(-0.16);
    c.scale(sc, sc);
    c.globalAlpha *= 0.92 * Math.min(1, u * 2.2);
    const col = mixLab(oxblood(env, 0), env.mood.ink, 0.3);
    c.strokeStyle = col;
    c.fillStyle = col;
    c.font = `700 ${fs * 1.12}px ${FONT.typewriter}`;
    const ow = c.measureText('OVERDUE').width;
    c.lineWidth = Math.max(1, fs * 0.16);
    c.strokeRect(-ow / 2 - fs * 0.35, -fs * 0.72, ow + fs * 0.7, fs * 1.44);
    c.fillText('OVERDUE', 0, 0);
    c.restore();
  }
  c.restore();
  return { x: tx, y: ty + th / 2 };
}
