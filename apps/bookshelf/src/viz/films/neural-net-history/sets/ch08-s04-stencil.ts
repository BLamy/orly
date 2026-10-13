/**
 * ch08-s04 — the paper theatre of one convolution (a hand-set TOY: the real Sobel-style vertical-edge weights
 * −1 0 1 / −2 0 2 / −1 0 1 over the kit's stitched 14 × 14 digit '4', DIGIT4; every number shown is computed
 * here by convolve() from the kit, never typed in by hand).
 *
 * GEOGRAPHY (L4 world = rest-screen px at CAMERA3_HOME):
 *   tapestry   14 × 14 stitched cells, TC = 32 → x 56–504, y 122–570; a rod with finials above
 *   stencil    a 3 × 3 pierced tin plate over the tapestry at position (col, row) (0..11), hung on two chains
 *              from a rail, a short candle standing behind it (the light; its flame shows above the plate)
 *   wall       the plaster wall at right, ruled into the 12 × 12 map: WC = 22 → x 948–1212, y 128–392
 *
 * WORD RULE: the narration calls this object a tin stencil; nothing here is labelled 'lantern'.
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { DIGIT4, DIGIT_N, KERNELS, convolve } from '../../../film/silhouette/metaphors/stencilLantern';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
export const K = KERNELS.vertical;
export const MAP = convolve(DIGIT4, K);
export const MAP_MAX = Math.max(...MAP.map((v) => Math.max(0, v)));
export const ON = DIGIT_N - 2; // 12
export const TC = 32;
export const TAP = { x: 56, y: 122 };
export const WC = 22;
export const WALL = { x: 948, y: 128 };
export const PAD = 9;
/** holes sit a little above each cell's centre; the weight is inked beneath */
const HY = -5;
/** the right-edge (shuttered) position shown on 'zero', and the worked left-edge position */
export const POS_RELU = 46;
export const POS_WORKED = 127;

export const cellOf = (idx: number) => ({ col: idx % ON, row: Math.floor(idx / ON) });
/** the nine (weight, value) terms at a position, in row order */
export function terms(idx: number): [number, number][] {
  const { col, row } = cellOf(idx);
  const out: [number, number][] = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) out.push([K[j * 3 + i], DIGIT4[(row + j) * DIGIT_N + col + i]]);
  return out;
}
/** a number as the plate sets it: whole numbers plain, else two decimals; minus as U+2212 */
export function fmt(v: number): string {
  const r = Math.round(v * 100) / 100;
  const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(2);
  return (r < 0 ? '−' : '') + s;
}
/** world centre of a wall cell */
export function wallCell(idx: number) {
  const { col, row } = cellOf(idx);
  return { x: WALL.x + col * WC + WC / 2, y: WALL.y + row * WC + WC / 2 };
}
/** world top-left of the stencil's 3 × 3 window at fractional (col, row) */
export const stencilXY = (col: number, row: number) => ({ x: TAP.x + col * TC, y: TAP.y + row * TC });

// ------------------------------------------------------------------------------------------------ the tapestry
export function tapestry(c: C, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const W = TC * DIGIT_N;
  c.save();
  c.translate(TAP.x, TAP.y);
  // rod with finials and cords
  c.fillStyle = ink;
  c.fillRect(-30, -40, W + 60, 10);
  for (const fx of [-30, W + 30]) {
    c.beginPath();
    c.arc(fx, -35, 9, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = ink;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-10, -40);
  c.lineTo(W / 2, -120);
  c.lineTo(W + 10, -40);
  c.stroke();
  // cloth, its lower edge cut in a shallow zigzag, a woven border
  const cloth = mixLab(m.set, m.haze, 0.22);
  c.fillStyle = cloth;
  c.beginPath();
  c.moveTo(-12, -30);
  c.lineTo(W + 12, -30);
  c.lineTo(W + 12, W + 12);
  for (let i = 0; i <= 24; i++) c.lineTo(W + 12 - (i / 24) * (W + 24), W + 12 + (i % 2 ? 8 : 0));
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1;
  c.strokeRect(-5, -22, W + 10, W + 28);
  c.strokeStyle = mixLab(cloth, m.ink, 0.3);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let x = -8; x <= W + 8; x += 5) {
    c.moveTo(x, W + 16);
    c.lineTo(x + 1, W + 40);
  }
  c.stroke();
  // the stitches: an X per cell; bright thread where the digit is (value = thread brightness)
  c.lineCap = 'round';
  for (let j = 0; j < DIGIT_N; j++)
    for (let i = 0; i < DIGIT_N; i++) {
      const v = DIGIT4[j * DIGIT_N + i];
      const cx = i * TC + TC / 2;
      const cy = j * TC + TC / 2;
      const r = TC * 0.34;
      c.strokeStyle = v > 0.02 ? withAlpha(mixLab(m.halo, m.core, v), 0.35 + 0.65 * v) : withAlpha(mixLab(cloth, m.ink, 0.4), 0.7);
      c.lineWidth = v > 0.5 ? 4 : v > 0.02 ? 2.4 : 1.8;
      c.beginPath();
      c.moveTo(cx - r, cy - r);
      c.lineTo(cx + r, cy + r);
      c.moveTo(cx + r, cy - r);
      c.lineTo(cx - r, cy + r);
      c.stroke();
    }
  c.restore();
}

/** the threads under the stencil, lit one by one (k[i] 0..1 per hole, row order) */
export function threadsUnder(c: C, env: PaintEnv, col: number, row: number, k: number[]) {
  const p = stencilXY(col, row);
  for (let q = 0; q < 9; q++) {
    if (k[q] <= 0.01) continue;
    const i = q % 3, j = Math.floor(q / 3);
    glow(c, p.x + i * TC + TC / 2, p.y + j * TC + TC / 2, TC * 0.9, env.mood.core, 0.35 * k[q]);
  }
}

// ------------------------------------------------------------------------------------------------ the stencil
export interface StencilOpts {
  col: number;
  row: number;
  /** 0..1 inked weights beside the holes */
  weights: number;
  /** per-hole extra glow (row order) */
  holeGlow?: number[];
  /** the lamp's flare (a strong positive sum) */
  fire?: number;
  /** extra lift above the tapestry (px) while it is lowered into place */
  lift?: number;
}
export function stencil(c: C, env: PaintEnv, o: StencilOpts) {
  const m = env.mood;
  const ink = env.fill('ink');
  const p = stencilXY(o.col, o.row);
  const y0 = p.y - (o.lift ?? 0);
  const F = TC * 3;
  const x0 = p.x;
  // chains up to the rail (out of frame)
  c.strokeStyle = ink;
  c.lineWidth = 1.4;
  c.setLineDash([3, 2]);
  c.beginPath();
  c.moveTo(x0 + 6, y0 - PAD);
  c.lineTo(x0 + 6, -900);
  c.moveTo(x0 + F - 6, y0 - PAD);
  c.lineTo(x0 + F - 6, -900);
  c.stroke();
  c.setLineDash([]);
  // the light behind it: a short candle standing on a little bracket behind the plate, its top and flame showing
  // above the plate's edge (a flat pierced tin plate: no hood, no roof; WORD RULE: never a lantern)
  const hx = x0 + F / 2;
  const top = y0 - PAD;
  c.fillStyle = ink;
  c.fillRect(hx - 7, top - 20, 14, 22);
  c.fillRect(hx - 13, top - 2, 26, 3);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(hx - 7, top - 20, 14, 1.2);
  c.strokeStyle = ink;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(hx, top - 20);
  c.lineTo(hx, top - 24);
  c.stroke();
  glow(c, hx, top - 30, 26, m.halo, 0.35 + 0.25 * (o.fire ?? 0));
  c.fillStyle = withAlpha(m.core, 0.95);
  c.beginPath();
  c.moveTo(hx, top - 38);
  c.quadraticCurveTo(hx + 4.2, top - 30, hx, top - 24.5);
  c.quadraticCurveTo(hx - 4.2, top - 30, hx, top - 38);
  c.fill();
  // the plate: positive weights are round holes sized by the weight (cut evenodd)
  const plate = new Path2D();
  plate.rect(x0 - PAD, y0 - PAD, F + PAD * 2, F + PAD * 2);
  const kMax = 2;
  for (let q = 0; q < 9; q++) {
    const w = K[q];
    if (w <= 0) continue;
    const i = q % 3, j = Math.floor(q / 3);
    const rr = (TC * 0.24 * w) / kMax + 2;
    plate.moveTo(x0 + i * TC + TC / 2 + rr, y0 + j * TC + TC / 2 + HY);
    plate.arc(x0 + i * TC + TC / 2, y0 + j * TC + TC / 2 + HY, rr, 0, Math.PI * 2);
  }
  c.fillStyle = withAlpha(mixLab(ink, m.set, 0.15), 0.9);
  c.fill(plate, 'evenodd');
  // lattice between the cells
  c.strokeStyle = ink;
  c.lineWidth = 2.6;
  c.beginPath();
  for (let q = 1; q < 3; q++) {
    c.moveTo(x0 + q * TC, y0 - PAD);
    c.lineTo(x0 + q * TC, y0 + F + PAD);
    c.moveTo(x0 - PAD, y0 + q * TC);
    c.lineTo(x0 + F + PAD, y0 + q * TC);
  }
  c.stroke();
  // holes glow with the lamp; negative weights are dark shutters with a cool rim; zero is plain tin
  const cool = mixLab(m.rim, MOODS.winterBlue.rim, 0.85);
  for (let q = 0; q < 9; q++) {
    const w = K[q];
    const i = q % 3, j = Math.floor(q / 3);
    const cx = x0 + i * TC + TC / 2, cy = y0 + j * TC + TC / 2 + HY;
    const rr = (TC * 0.24 * Math.abs(w)) / kMax + 2;
    const g = o.holeGlow?.[q] ?? 0;
    if (w > 0) glow(c, cx, cy, rr * 2.6, m.core, 0.4 + 0.5 * g);
    else if (w < 0) {
      c.fillStyle = mixLab(ink, m.fg, 0.4);
      c.beginPath();
      c.arc(cx, cy, rr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(cool, 0.75 + 0.25 * g);
      c.lineWidth = 1.6;
      c.stroke();
      c.beginPath();
      c.moveTo(cx - rr * 0.7, cy);
      c.lineTo(cx + rr * 0.7, cy);
      c.stroke();
      if (g > 0) glow(c, cx, cy, rr * 2.2, cool, 0.3 * g);
    }
  }
  // the nine weights, inked in each cell's corner (part of the machine, not a caption)
  if (o.weights > 0.01) {
    c.save();
    c.font = `600 11px "IBM Plex Mono"`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    for (let q = 0; q < 9; q++) {
      const w = K[q];
      const i = q % 3, j = Math.floor(q / 3);
      const g = o.holeGlow?.[q] ?? 0;
      c.globalAlpha = o.weights * (0.75 + 0.25 * g);
      c.fillStyle = w > 0 ? mixLab(m.rim, m.core, 0.4 + 0.6 * g) : w < 0 ? mixLab(cool, '#ffffff', 0.25 * g) : withAlpha(m.rim, 0.7);
      c.fillText(w > 0 ? `+${w}` : w < 0 ? `−${-w}` : '0', x0 + i * TC + TC / 2, y0 + j * TC + TC - 2.5);
    }
    c.restore();
  }
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1;
  c.strokeRect(x0 - PAD, y0 - PAD, F + PAD * 2, F + PAD * 2);
}

/** the beam from the stencil to one wall cell (k = its rectified brightness 0..1, fire = on/off) */
export function beam(c: C, env: PaintEnv, col: number, row: number, idx: number, k: number, fire: number) {
  if (fire <= 0.01) return;
  const p = stencilXY(col, row);
  const bx = p.x + TC * 3 + PAD, by = p.y + TC * 1.5;
  const w = wallCell(idx);
  const g = c.createLinearGradient(bx, by, w.x, w.y);
  g.addColorStop(0, withAlpha(env.mood.core, 0.34 * fire * (0.15 + 0.85 * k)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0.2 * fire * (0.15 + 0.85 * k)));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(bx, by - TC * 1.3);
  c.lineTo(w.x, w.y - WC * 0.5);
  c.lineTo(w.x, w.y + WC * 0.5);
  c.lineTo(bx, by + TC * 1.3);
  c.closePath();
  c.fill();
  c.restore();
  glow(c, w.x, w.y, WC * 2.6, env.mood.core, 0.45 * fire * k);
}

// ------------------------------------------------------------------------------------------------ the wall
export interface WallOpts {
  /** per-cell light 0..1 (multiplies the cell's real rectified value) */
  lit: (idx: number) => number;
  /** the stencil's faint shadow repeated in every cell (the same nine weights everywhere): one alpha, or per cell */
  ghost?: number | ((idx: number) => number);
  /** a cell to mark (outline) */
  mark?: { idx: number; k: number };
}
export function wall(c: C, env: PaintEnv, o: WallOpts) {
  const m = env.mood;
  const W = WC * ON;
  // the plaster: a lit panel with a chipped edge, inside it a dark recess ruled into the 12 × 12 map
  c.fillStyle = mixLab(m.setHaze, m.haze, 0.3);
  c.beginPath();
  c.moveTo(WALL.x - 44, WALL.y - 50);
  for (let k = 0; k <= 10; k++) c.lineTo(WALL.x - 44 + (k / 10) * (W + 88), WALL.y - 50 + (hash1(k, 51) - 0.5) * 6);
  c.lineTo(WALL.x + W + 44, WALL.y + W + 60);
  c.lineTo(WALL.x - 44, WALL.y + W + 60);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(m.set, m.ink, 0.45);
  c.fillRect(WALL.x - 10, WALL.y - 10, W + 20, W + 20);
  for (let q = 0; q < ON * ON; q++) {
    const { col, row } = cellOf(q);
    const x = WALL.x + col * WC, y = WALL.y + row * WC;
    const v = (Math.max(0, MAP[q]) / MAP_MAX) * o.lit(q);
    c.fillStyle = v > 0.005 ? mixLab(mixLab(m.set, m.ink, 0.3), m.core, Math.pow(v, 0.8)) : mixLab(m.set, m.ink, 0.22);
    c.fillRect(x + 1.5, y + 1.5, WC - 3, WC - 3);
  }
  for (let q = 0; q < ON * ON; q++) {
    const v = (Math.max(0, MAP[q]) / MAP_MAX) * o.lit(q);
    if (v < 0.45) continue;
    const w = wallCell(q);
    glow(c, w.x, w.y, WC * 1.5, m.halo, 0.16 * v);
  }
  if (o.ghost) {
    // the one stencil's print, faint, at every position it has stood: the same nine weights everywhere. A 3 × 3
    // outline in the rim colour (its lattice) with the pierced holes as warm dots and the shutters as cool ones
    const ga = typeof o.ghost === 'function' ? o.ghost : () => o.ghost as number;
    const cool = MOODS.winterBlue.rim;
    c.save();
    for (let q = 0; q < ON * ON; q++) {
      // a touch lighter over a lit cell, so the bright spots stay clean
      const a = ga(q) * (1 - 0.45 * (Math.max(0, MAP[q]) / MAP_MAX) * o.lit(q));
      if (a <= 0.01) continue;
      const w = wallCell(q);
      const s3 = (WC - 4) / 3;
      const x0 = w.x - s3 * 1.5, y0 = w.y - s3 * 1.5;
      c.globalAlpha = a;
      c.strokeStyle = m.rim;
      c.lineWidth = 0.9;
      c.beginPath();
      for (let k = 0; k <= 3; k++) {
        c.moveTo(x0 + k * s3, y0);
        c.lineTo(x0 + k * s3, y0 + 3 * s3);
        c.moveTo(x0, y0 + k * s3);
        c.lineTo(x0 + 3 * s3, y0 + k * s3);
      }
      c.stroke();
      for (let h = 0; h < 9; h++) {
        const kw = K[h];
        if (kw === 0) continue;
        const i = h % 3, j = Math.floor(h / 3);
        c.fillStyle = kw > 0 ? m.core : cool;
        c.beginPath();
        c.arc(x0 + (i + 0.5) * s3, y0 + (j + 0.5) * s3, 0.6 + 0.45 * Math.abs(kw), 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }
  if (o.mark && o.mark.k > 0.01) {
    const w = wallCell(o.mark.idx);
    c.strokeStyle = withAlpha(m.core, 0.9 * o.mark.k);
    c.lineWidth = 1.6;
    c.strokeRect(w.x - WC / 2 - 1, w.y - WC / 2 - 1, WC + 2, WC + 2);
  }
}
