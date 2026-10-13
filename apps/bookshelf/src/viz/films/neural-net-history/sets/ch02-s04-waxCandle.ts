/**
 * ch02-s04 — the belief candle as WAX (drawn over sets/beliefCandle's ink stub, same geometry, same rule).
 *
 * The shared candle is an ink paper-cut taper; at shelf distance and huge on the stage it read as a black
 * ruler. This draws the same candle (same width, lit height, ring pitch, burned rings) as a cut-paper candle
 * of WAX: a body at the set / setHaze value, a translucent upper zone glowing near the flame, a rounded lip
 * with a melt cup, a wick, one drip, the scored rings as faint cut-lines, and the belief's lettering cut
 * into the wax. The ghost sleeve (the burned years) stays the shared set's.
 *
 * It also makes the CANDLE-CLOCK RULE legible: optional year marks beside the candle, the year it was lit at
 * the sleeve's top lip and the current year at the flame ("1943" … "1947"), so sleeve length = years held.
 *
 *   waxCandle(c, { x, y, view, s, burn, flame, letters, years: { size } }, env)
 *   (call AFTER the shared beliefCandle / candleShelf / candleStage drew the candle, with letters: 0 there)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, softPlate } from '../../../film/silhouette/type';
import { LIT_HEIGHT, RING_PX, RINGS, type CandleView } from './studyState';

export interface WaxCandleDraw {
  x: number;
  y: number;
  view: CandleView;
  s: number;
  burn?: number;
  /** 0..1 flame strength (the glow in the upper wax) */
  flame?: number;
  /** lettering alpha (0 hides it) */
  letters?: number;
  /** a horizontal band of the belief's lettering cut into the wax just under the lit top (read in a close-up on
   *  the flame); it is fixed to the wax, so burned rings consume it (what burns shows faintly on the sleeve) */
  band?: number;
  /** year marks beside the candle: label size in layer px (pass 22 / camera scale for a screen-constant size) */
  years?: { size: number; alpha?: number };
}

const W = 30; // the shared candle's width at s = 1

export function waxRings(view: CandleView, burn = 0) {
  const max = view.years ?? RINGS;
  return Math.max(0, Math.min(RINGS, Math.min(max, view.rings + burn)));
}

export function waxCandle(c: CanvasRenderingContext2D, o: WaxCandleDraw, env: PaintEnv) {
  const s = o.s;
  const P = env.mood;
  const w = W * s + 1;
  const H = LIT_HEIGHT * s;
  const r = waxRings(o.view, o.burn ?? 0);
  const stubTop = o.y - H + r * RING_PX * s;
  const top = o.y - H;
  const x0 = o.x - w / 2, x1 = o.x + w / 2;
  const fk = o.flame ?? 1;
  c.save();

  // ---- the stub: rounded shoulders and a shallow melt cup at the top, one drip down the left side
  const lip = 1.8 * s;
  const body = new Path2D();
  body.moveTo(x0, o.y + 0.5);
  body.lineTo(x0, stubTop + lip);
  body.quadraticCurveTo(x0, stubTop, x0 + lip, stubTop);
  body.quadraticCurveTo(o.x, stubTop + 3.2 * s, x1 - lip, stubTop);
  body.quadraticCurveTo(x1, stubTop, x1, stubTop + lip);
  body.lineTo(x1, o.y + 0.5);
  body.closePath();
  // the drip: one bead of wax run over the cup's lip and set against the side (a solid lobe, outer edge only)
  const dt = stubTop + 1 * s, dl = 17 * s;
  const drip = new Path2D();
  drip.moveTo(x0 + 2 * s, dt);
  drip.bezierCurveTo(x0 - 2.6 * s, dt + 3 * s, x0 - 2.8 * s, dt + dl * 0.6, x0 - 2.2 * s, dt + dl - 2.4 * s);
  drip.quadraticCurveTo(x0 - 1.6 * s, dt + dl + 0.4 * s, x0 + 0.6 * s, dt + dl - 1.6 * s);
  drip.lineTo(x0 + 2 * s, dt + dl * 0.5);
  drip.closePath();

  // wax: the set value at the base, warming and turning translucent toward the flame
  const g = c.createLinearGradient(0, o.y, 0, stubTop);
  // the stub is visibly DARKER than the translucent ghost sleeve above it (wax held vs years burned)
  const base = mixLab(env.fill('set'), P.fg, 0.5);
  const midW = mixLab(env.fill('set'), P.fg, 0.12);
  const glowW = mixLab(P.setHaze, P.halo, 0.55 * fk);
  const hiW = mixLab(P.halo, P.core, 0.35 * fk);
  const zone = Math.min(1, (34 * s) / Math.max(1, o.y - stubTop));
  g.addColorStop(0, base);
  g.addColorStop(Math.max(0, 1 - zone * 3.2), midW);
  g.addColorStop(Math.max(0, 1 - zone), glowW);
  g.addColorStop(1, hiW);
  c.fillStyle = g;
  c.fill(body);
  // the drip: the same wax a shade deeper (set and cooled), no outline, so it reads as a bead, not a loop
  c.fill(drip);
  c.fillStyle = withAlpha(P.fg, 0.18);
  c.fill(drip);
  // the paper-cut edge: a thin darker outline (the drip's outer edge only, so it reads as a bead, not a loop)
  c.strokeStyle = withAlpha(P.fg, 0.55);
  c.lineWidth = Math.max(0.8, 1.1 * s);
  c.stroke(body);
  // a soft rounding: darker at both sides of the cylinder, so it reads as a round candle, not a slat
  c.save();
  c.clip(body);
  const sg = c.createLinearGradient(x0, 0, x1, 0);
  sg.addColorStop(0, withAlpha(P.fg, 0.32));
  sg.addColorStop(0.35, withAlpha(P.fg, 0));
  sg.addColorStop(0.7, withAlpha(P.fg, 0));
  sg.addColorStop(1, withAlpha(P.fg, 0.22));
  c.fillStyle = sg;
  c.fillRect(x0 - 4 * s, stubTop - 2, w + 8 * s, o.y - stubTop + 4);
  // scored rings: faint cut-lines (the clock's ticks), a little firmer every fifth ring
  c.lineWidth = Math.max(0.6, 0.7 * s);
  for (let i = 1; i < RINGS; i++) {
    const yy = o.y - i * RING_PX * s;
    if (yy < stubTop + 3 * s) break;
    const major = i % 5 === 0;
    c.strokeStyle = withAlpha(P.fg, major ? 0.26 : 0.13);
    c.beginPath();
    c.moveTo(x0 + (major ? 0 : w * 0.16), yy);
    c.quadraticCurveTo(o.x, yy + 1.4 * s, x1 - (major ? 0 : w * 0.16), yy);
    c.stroke();
  }
  // lettering cut into the wax, rising up the candle (a paraphrase, never in quotation marks)
  const la = o.letters ?? 0.6;
  if (la > 0.01 && o.view.text) {
    c.save();
    c.translate(o.x, o.y - 10 * s);
    c.rotate(-Math.PI / 2);
    c.font = `400 ${8.4 * s}px ${FONT.typewriter}`;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(mixLab(P.fg, P.ink, 0.5), 0.62 * la);
    c.fillText(o.view.text, 0, 0.5 * s);
    c.restore();
  }
  c.restore();
  // the wick: a short dark curl standing in the cup (the flame practical sits on it)
  if (fk > 0.01 || r > 0) {
    c.strokeStyle = env.fill('ink');
    c.lineWidth = Math.max(0.9, 1.3 * s);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(o.x, stubTop + 1.6 * s);
    c.quadraticCurveTo(o.x - 0.6 * s, stubTop - 2.5 * s, o.x + 0.8 * s, stubTop - 5 * s);
    c.stroke();
  }
  // the lettering band under the lit top, wrapped to the candle's width (Special Elite small caps)
  const ba = o.band ?? 0;
  if (ba > 0.01 && o.view.text) {
    const words = o.view.text.split(/\s+/);
    const fs = 6.2 * s;
    c.save();
    c.font = `400 ${fs}px ${FONT.typewriter}`;
    const maxW = w * 0.84;
    const lines: string[] = [];
    for (const wd of words) {
      const cur = lines[lines.length - 1];
      if (cur && c.measureText(`${cur} ${wd}`).width <= maxW) lines[lines.length - 1] = `${cur} ${wd}`;
      else lines.push(wd);
    }
    const y0 = top + 8.5 * s;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    // on the stub: cut into the wax (a dark impression); on the sleeve: a faint ghost
    for (const [clipTop, clipBot, col, a] of [
      [stubTop, o.y, mixLab(P.fg, P.ink, 0.45), 0.8],
      [top - 2, stubTop, P.rim, 0.3],
    ] as [number, number, string, number][]) {
      if (clipBot - clipTop < 0.5) continue;
      c.save();
      c.beginPath();
      c.rect(x0 - 2, clipTop, w + 4, clipBot - clipTop);
      c.clip();
      c.fillStyle = withAlpha(col, a * ba);
      lines.forEach((l, i) => c.fillText(l, o.x, y0 + fs + i * fs * 1.22));
      c.restore();
    }
    c.restore();
  }
  // the sleeve's lettering continues faintly on the ghost paper above the stub
  if (la > 0.01 && o.view.text && r > 0) {
    c.save();
    c.beginPath();
    c.rect(x0 - 2, top - 2, w + 4, stubTop - top + 2);
    c.clip();
    c.translate(o.x, o.y - 10 * s);
    c.rotate(-Math.PI / 2);
    c.font = `400 ${8.4 * s}px ${FONT.typewriter}`;
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(P.rim, 0.32 * la);
    c.fillText(o.view.text, 0, 0.5 * s);
    c.restore();
  }

  // ---- the candle-clock's year marks: lit year at the sleeve's top lip, the current year at the flame
  if (o.years && r > 0.05) {
    const ya = (o.years.alpha ?? 1) * Math.min(1, r / 0.4);
    // the year marks are read (the candle-clock ticking), so they sit at the legibility floor through the camera
    const sz = legibleSize(c, `400 ${o.years.size}px ${FONT.typewriter}`, o.years.size) * 1.04;
    const lit = o.view.litYear;
    const now = lit + Math.floor(r + 1e-6);
    const col = mixLab(P.core, '#efe2c8', 0.45);
    const lx = x1 + 6 * s;
    c.save();
    c.globalAlpha *= ya;
    c.font = `400 ${sz}px ${FONT.typewriter}`;
    // alphabetic baseline, centred by the digits' own ink height (a 'middle' baseline under-reports the cap
    // height to the legibility audit, and sits the figures a hair high on the bracket)
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    const tw = c.measureText('1950').width;
    const half = c.measureText('1950').actualBoundingBoxAscent / 2;
    // a bracket down the sleeve: lit year at the top, the year now at the flame: the sleeve IS the years
    c.strokeStyle = withAlpha(col, 0.7);
    c.lineWidth = Math.max(1, sz * 0.06);
    c.beginPath();
    c.moveTo(x1 + 1.5 * s, top);
    c.lineTo(lx + sz * 0.15, top);
    c.lineTo(lx + sz * 0.15, stubTop);
    c.lineTo(x1 + 1.5 * s, stubTop);
    c.stroke();
    const marks: [number, string, number][] = [[top, String(lit), 0.85]];
    // the year now, once the first ring has burned (until then the bracket closes on 1943 itself)
    if (now > lit) marks.push([stubTop, String(now), 1]);
    for (const [yy, txt, a] of marks) {
      softPlate(c, lx + sz * 0.45 + tw / 2, yy, tw + sz * 2.2, sz * 2.0, P.ink, 0.55);
      c.fillStyle = withAlpha(col, a);
      c.fillText(txt, lx + sz * 0.45, yy + half);
    }
    c.restore();
  }
  c.restore();
}
