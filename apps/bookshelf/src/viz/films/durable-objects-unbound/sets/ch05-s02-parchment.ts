/**
 * durable-objects-unbound — PARCHMENT pieces (author:ch04-ch05; used by ch04-s04, ch05-s02, ch05-s06).
 *
 * Ink-on-paper drawing for the film's parchment inserts and the commit strip. Paper is filled with paths (a card's
 * text is probed by the shot with cardProbe), ink is the mood's ink, accents follow the accent budget (red ink only
 * as a wash for workerd's band; brass for engraved badges).
 *
 *   paperSheet(c, env, o)      a deckled sheet with fibres and foxing (static: bake it); o.tone 'parchment' | 'strip'
 *   inkText(c, env, o)         legible ink text (≥ 22 px cap @1080p), probed; o.u 0..1 inks left to right
 *   inkRules(c, env, o)        soft illegible ink rules (texture only, no readable text)
 *   bracket(c, x, y0, y1, w, col, u)   a vertical engraved bracket from y0 to y1 (ticks pointing left by w)
 *   ruleLine(c, x0, x1, y, col, u, lw) a ruled line, drawn left to right
 *   engravedCandle(c, env, o)  an etched candle (outline + hatching) whose wax top sits at o.top
 *   inkTiles(c, env, o)        the Plate's three tiles engraved in ink (house · epoch · from) with the crown lamp
 *                              above (lit = a gold wash and rays; dark = a hollow outline); o.flip per tile
 *   tileCentre(o, i)           the centre of tile i (0 house, 1 epoch, 2 from)
 *   dividers(c, env, o)        a pair of brass dividers laid across the plate
 *   inkFold(c, env, o)         the paper-fold crease shading for an insert entering (o.u 0..1 unfolded)
 */
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS, BRASS_HI, GOLD, PAPER, brass, clamp01, glowDot, lerp, tone, type C2 } from './common';

export const INK = '#2a1d12';
export function inkCol(env: PaintEnv, a = 1): string {
  return withAlpha(mixLab(INK, env.mood.ink, 0.3), a);
}

// ------------------------------------------------------------------ paper
export interface SheetOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  /** 'parchment' (warm, aged) or 'strip' (paler, a document) */
  tone?: 'parchment' | 'strip';
}
export function paperPath(o: SheetOpts): Path2D {
  const p = new Path2D();
  let s = (o.seed ?? 7) * 7919;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const step = 14;
  p.moveTo(o.x, o.y);
  for (let x = o.x + step; x < o.x + o.w; x += step) p.lineTo(x, o.y + (rnd() - 0.5) * 2.2);
  p.lineTo(o.x + o.w, o.y);
  for (let y = o.y + step; y < o.y + o.h; y += step) p.lineTo(o.x + o.w + (rnd() - 0.5) * 2.2, y);
  p.lineTo(o.x + o.w, o.y + o.h);
  for (let x = o.x + o.w - step; x > o.x; x -= step) p.lineTo(x, o.y + o.h + (rnd() - 0.5) * 2.2);
  p.lineTo(o.x, o.y + o.h);
  for (let y = o.y + o.h - step; y > o.y; y -= step) p.lineTo(o.x + (rnd() - 0.5) * 2.2, y);
  p.closePath();
  return p;
}
export function paperBase(env: PaintEnv, kind: 'parchment' | 'strip' = 'parchment'): string {
  const base = kind === 'strip' ? '#ece2cc' : '#e6d6b4';
  // the paper takes a little of the mood (it is lit by the scene) but stays paper
  return mixLab(base, env.mood.core, kind === 'strip' ? 0.08 : 0.05);
}
export function paperSheet(c: C2, env: PaintEnv, o: SheetOpts): void {
  const p = paperPath(o);
  const base = paperBase(env, o.tone);
  c.save();
  // a soft lift shadow under the sheet
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 18;
  c.shadowOffsetY = 6;
  c.fillStyle = base;
  c.fill(p);
  c.restore();
  c.save();
  c.clip(p);
  // edge darkening (aged paper)
  const g = c.createRadialGradient(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) * 0.3, o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h) * 0.72);
  g.addColorStop(0, withAlpha('#ffffff', 0.06));
  g.addColorStop(1, withAlpha('#6a4a26', 0.28));
  c.fillStyle = g;
  c.fill(p);
  // fibres and a little foxing (seeded)
  let s = (o.seed ?? 7) * 104729;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  c.lineWidth = 0.6;
  for (let i = 0; i < Math.round((o.w * o.h) / 2600); i++) {
    const x = o.x + rnd() * o.w, y = o.y + rnd() * o.h;
    const a = rnd() * Math.PI;
    const L = 4 + rnd() * 12;
    c.strokeStyle = withAlpha('#7a5a34', 0.08 + 0.08 * rnd());
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
    c.stroke();
  }
  for (let i = 0; i < Math.round((o.w * o.h) / 60000) + 2; i++) {
    const x = o.x + rnd() * o.w, y = o.y + rnd() * o.h;
    const r = 6 + rnd() * 26;
    const fx = c.createRadialGradient(x, y, 0, x, y, r);
    fx.addColorStop(0, withAlpha('#9a6a3a', 0.08));
    fx.addColorStop(1, withAlpha('#9a6a3a', 0));
    c.fillStyle = fx;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}

// ------------------------------------------------------------------ ink
export interface InkTextOpts {
  id: string;
  text: string;
  x: number;
  y: number;
  size?: number;
  /** css font family + style prefix, e.g. `italic 400` ; family defaults to EB Garamond */
  style?: string;
  family?: string;
  align?: 'left' | 'center' | 'right';
  alpha?: number;
  /** 0..1 inks in left to right */
  u?: number;
  color?: string;
  /** subject (legible, probed) or texture */
  legible?: boolean;
  tracking?: number;
}
/** returns the drawn width */
export function inkText(c: C2, env: PaintEnv, o: InkTextOpts): number {
  const A = o.alpha ?? 1;
  const u = clamp01(o.u ?? 1);
  let w = 0;
  if (A <= 0.002 || u <= 0.001) return 0;
  const run = () => {
    c.save();
    const style = o.style ?? '500';
    const fam = o.family ?? FONT.text;
    let size = o.size ?? 22;
    if (o.legible !== false) size = legibleSize(c, `${style} ${size}px ${fam}`, size, o.text);
    c.font = `${style} ${size}px ${fam}`;
    if (o.tracking) c.letterSpacing = `${(o.tracking * size).toFixed(2)}px`;
    w = c.measureText(o.text).width;
    const align = o.align ?? 'left';
    const x0 = align === 'left' ? o.x : align === 'right' ? o.x - w : o.x - w / 2;
    c.fillStyle = o.color ?? inkCol(env, 0.92);
    c.globalAlpha *= A;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    if (u < 1) {
      // ink in left to right: clip with a soft leading edge
      c.beginPath();
      c.rect(x0 - 4, o.y - size * 1.4, (w + 8) * u, size * 2);
      c.clip();
    }
    c.fillText(o.text, x0, o.y);
    if (o.legible !== false) textProbe(c, o.id, x0, o.y - size, w, size * 1.25, A * (u > 0.3 ? 1 : u / 0.3));
    c.restore();
  };
  textRole(c, o.legible === false ? 'texture' : 'subject', run);
  return w;
}
/** soft illegible ink rules (texture only): rows of strokes of varying length */
export function inkRules(c: C2, env: PaintEnv, o: { x: number; y: number; w: number; rows: number; gap: number; seed?: number; alpha?: number; u?: number }): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  let s = (o.seed ?? 3) * 31337;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  c.save();
  c.strokeStyle = inkCol(env, 0.32 * A);
  c.lineCap = 'round';
  c.lineWidth = 2.2;
  const shown = (o.u ?? 1) * o.rows;
  for (let r = 0; r < o.rows; r++) {
    const k = clamp01(shown - r);
    if (k <= 0) break;
    const y = o.y + r * o.gap;
    let x = o.x;
    const end = o.x + o.w * (r === o.rows - 1 ? 0.55 : 0.82 + 0.18 * rnd());
    c.beginPath();
    while (x < end) {
      const L = 10 + rnd() * 46;
      const xe = Math.min(end, x + L);
      if (x < o.x + (end - o.x) * k) {
        c.moveTo(x, y + (rnd() - 0.5) * 0.8);
        c.lineTo(Math.min(xe, o.x + (end - o.x) * k), y + (rnd() - 0.5) * 0.8);
      }
      x = xe + 6 + rnd() * 5;
    }
    c.stroke();
  }
  c.restore();
}
export function ruleLine(c: C2, x0: number, x1: number, y: number, col: string, u = 1, lw = 1.6): void {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(lerp(x0, x1, clamp01(u)), y);
  c.stroke();
  c.restore();
}
/** a vertical bracket from y0 to y1 at x, with end ticks of width w (negative = ticks point left), drawn top-down */
export function bracket(c: C2, x: number, y0: number, y1: number, w: number, col: string, u = 1, lw = 1.6): void {
  if (u <= 0) return;
  const ye = lerp(y0, y1, clamp01(u));
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - w, y0);
  c.lineTo(x, y0);
  c.lineTo(x, ye);
  if (u >= 1) c.lineTo(x - w, y1);
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ the engraved candle
export interface EngravedCandleOpts {
  x: number;
  /** the wax top (the burnt-down height) */
  top: number;
  /** the wax foot (sconce top) */
  base: number;
  /** the full-height wax top (ghost outline) */
  fullTop: number;
  w?: number;
  flame?: number;
  /** a small 'relit' curl at the wick (0..1) */
  curl?: number;
  alpha?: number;
}
export function engravedCandle(c: C2, env: PaintEnv, o: EngravedCandleOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const w = o.w ?? 46;
  const ink = inkCol(env, 0.9);
  c.save();
  c.globalAlpha *= A;
  // ghost of the full candle (dotted outline)
  c.strokeStyle = inkCol(env, 0.3);
  c.lineWidth = 1;
  c.setLineDash([3, 4]);
  c.strokeRect(o.x - w / 2, o.fullTop, w, o.top - o.fullTop);
  c.setLineDash([]);
  // wax: outline and vertical hatching, heavier on the shadow side (right)
  c.strokeStyle = ink;
  c.lineWidth = 1.8;
  c.strokeRect(o.x - w / 2, o.top, w, o.base - o.top);
  c.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) {
    const x = o.x - w / 2 + w * (0.55 + i * 0.05);
    c.strokeStyle = inkCol(env, 0.25 + i * 0.05);
    c.beginPath();
    c.moveTo(x, o.top + 3);
    c.lineTo(x, o.base - 2);
    c.stroke();
  }
  // a drip at the top lip
  c.strokeStyle = ink;
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(o.x - w / 2 + 6, o.top);
  c.quadraticCurveTo(o.x - w / 2 + 9, o.top + 14, o.x - w / 2 + 12, o.top);
  c.stroke();
  // sconce: an engraved dish and foot
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(o.x - w * 0.95, o.base);
  c.lineTo(o.x + w * 0.95, o.base);
  c.lineTo(o.x + w * 0.6, o.base + 12);
  c.lineTo(o.x + w * 0.18, o.base + 12);
  c.lineTo(o.x + w * 0.24, o.base + 34);
  c.lineTo(o.x - w * 0.24, o.base + 34);
  c.lineTo(o.x - w * 0.18, o.base + 12);
  c.lineTo(o.x - w * 0.6, o.base + 12);
  c.closePath();
  c.stroke();
  // wick
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(o.x, o.top);
  c.lineTo(o.x + 2, o.top - 10);
  c.stroke();
  // flame: an inked teardrop with a gold wash
  const fl = clamp01(o.flame ?? 1);
  if (fl > 0.01) {
    c.globalAlpha = A * fl;
    c.fillStyle = withAlpha(mixLab(GOLD, '#ffffff', 0.2), 0.75);
    c.beginPath();
    c.moveTo(o.x + 2, o.top - 8);
    c.quadraticCurveTo(o.x - 11, o.top - 22, o.x + 2, o.top - 44);
    c.quadraticCurveTo(o.x + 15, o.top - 22, o.x + 2, o.top - 8);
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 1.4;
    c.stroke();
    c.globalAlpha = A;
  }
  const cu = clamp01(o.curl ?? 0);
  if (cu > 0.01) {
    c.strokeStyle = inkCol(env, 0.8 * cu);
    c.lineWidth = 1.3;
    c.beginPath();
    for (let i = 0; i <= 20 * cu; i++) {
      const a = i * 0.45;
      const r = 3 + i * 0.7;
      const x = o.x + 18 + Math.cos(a) * r, y = o.top - 30 + Math.sin(a) * r - i * 0.8;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the Plate's tiles in ink
export type Tile = string | number;
export interface InkTilesOpts {
  x: number;
  y: number;
  /** tile size (s = 1: each tile 64 x 52) */
  s?: number;
  house: Tile;
  epoch: Tile;
  from: Tile;
  /** 0..1 the crown lamp lit */
  crown: number;
  /** per-tile flip in progress (0..1, the new value already shown) */
  flip?: [number, number, number];
  /** engraved captions above the tiles (0..1) */
  captions?: number;
  alpha?: number;
  /** a ghost (dotted, not yet printed) */
  ghost?: boolean;
  /** probe id (legible glyphs) */
  id?: string;
  legible?: boolean;
  /** a tiny house silhouette beside the house tile, its window lit 0..1 (or null for none) */
  houseLamp?: number | null;
  /** highlight one tile (0..2) with a ring, u */
  ring?: { i: number; u: number };
}
const TW = 64, TH = 52, TG = 8;
export function tileCentre(o: { x: number; y: number; s?: number }, i: number): { x: number; y: number } {
  const s = o.s ?? 1;
  return { x: o.x + (i - 1) * (TW + TG) * s, y: o.y };
}
export function crownCentre(o: { x: number; y: number; s?: number }): { x: number; y: number } {
  const s = o.s ?? 1;
  return { x: o.x, y: o.y - (TH / 2 + 34) * s };
}
export function inkTiles(c: C2, env: PaintEnv, o: InkTilesOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const ink = inkCol(env, 0.92);
  c.save();
  c.globalAlpha *= A;
  if (o.ghost) c.setLineDash([4 * s, 4 * s]);
  // backing plate outline
  const W = 3 * TW + 2 * TG + 16, H = TH + 16;
  c.strokeStyle = ink;
  c.lineWidth = 2 * Math.min(1.4, s);
  c.strokeRect(o.x - (W / 2) * s, o.y - (H / 2) * s, W * s, H * s);
  const vals = [o.house, o.epoch, o.from];
  for (let i = 0; i < 3; i++) {
    const cp = tileCentre(o, i);
    const fu = o.flip?.[i] ?? 1;
    const sq = fu < 1 ? Math.max(0.06, Math.abs(Math.cos(Math.PI * fu))) : 1;
    c.save();
    c.translate(cp.x, cp.y);
    c.scale(1, sq);
    c.lineWidth = 1.4 * Math.min(1.4, s);
    c.strokeRect((-TW / 2) * s, (-TH / 2) * s, TW * s, TH * s);
    // engraved hatching on the tile's lower edge
    c.lineWidth = 0.7;
    c.strokeStyle = inkCol(env, 0.35);
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.moveTo((-TW / 2 + 4 + k * 10) * s, (TH / 2 - 3) * s);
      c.lineTo((-TW / 2 + 9 + k * 10) * s, (TH / 2 - 8) * s);
      c.stroke();
    }
    const v = String(vals[i] ?? '');
    if (v) {
      const draw = () => {
        const fam = typeof vals[i] === 'number' ? FONT.mono : FONT.display;
        const wt = typeof vals[i] === 'number' ? 500 : 700;
        let size = TH * 0.66 * s;
        if (o.legible !== false) size = Math.max(size, legibleSize(c, `${wt} ${size}px ${fam}`, size));
        c.font = `${wt} ${size}px ${fam}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = o.ghost ? inkCol(env, 0.45) : ink;
        c.fillText(v, 0, 2 * s);
        if (o.id && o.legible !== false) textProbe(c, `${o.id}-t${i}`, (-TW / 2) * s, (-TH / 2) * s, TW * s, TH * s, A);
      };
      textRole(c, o.legible === false ? 'texture' : 'subject', draw);
    }
    c.restore();
  }
  // captions
  const cap = clamp01(o.captions ?? 0);
  if (cap > 0.01) {
    const names = ['house', 'epoch', 'from'];
    for (let i = 0; i < 3; i++) {
      const cp = tileCentre(o, i);
      textRole(c, o.legible === false ? 'texture' : 'subject', () => {
        c.save();
        let size = 13 * s;
        if (o.legible !== false) size = legibleSize(c, `600 ${size}px ${FONT.sc}`, size, names[i]);
        c.font = `600 ${size}px ${FONT.sc}`;
        c.textAlign = 'center';
        c.fillStyle = inkCol(env, 0.8);
        c.globalAlpha = A * cap;
        c.fillText(names[i], cp.x, o.y + (TH / 2 + 14) * s + size * 0.8);
        if (o.id && o.legible !== false) {
          const w = c.measureText(names[i]).width;
          textProbe(c, `${o.id}-cap${i}`, cp.x - w / 2, o.y + (TH / 2 + 14) * s - size * 0.2, w, size * 1.2, A * cap);
        }
        c.restore();
      });
    }
  }
  // the crown lamp: an engraved cage on a stem; lit = gold wash + rays; dark = hollow
  const cc = crownCentre(o);
  c.lineWidth = 1.6 * Math.min(1.4, s);
  c.strokeStyle = ink;
  c.beginPath();
  c.moveTo(cc.x, o.y - (H / 2) * s);
  c.lineTo(cc.x, cc.y + 12 * s);
  c.stroke();
  const cr = clamp01(o.crown);
  c.beginPath();
  c.moveTo(cc.x - 9 * s, cc.y + 12 * s);
  c.lineTo(cc.x + 9 * s, cc.y + 12 * s);
  c.lineTo(cc.x + 7 * s, cc.y - 10 * s);
  c.lineTo(cc.x, cc.y - 18 * s);
  c.lineTo(cc.x - 7 * s, cc.y - 10 * s);
  c.closePath();
  if (cr > 0.02 && !o.ghost) {
    c.fillStyle = withAlpha(GOLD, 0.85 * cr);
    c.fill();
  } else if (cr > 0.02) {
    c.fillStyle = withAlpha(GOLD, 0.35 * cr);
    c.fill();
  }
  c.stroke();
  if (cr > 0.02) {
    c.strokeStyle = withAlpha(mixLab(GOLD, INK, 0.35), 0.8 * cr);
    c.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.42;
      c.beginPath();
      c.moveTo(cc.x + Math.cos(a) * 16 * s, cc.y - 2 * s + Math.sin(a) * 16 * s);
      c.lineTo(cc.x + Math.cos(a) * (24 + 4 * cr) * s, cc.y - 2 * s + Math.sin(a) * (24 + 4 * cr) * s);
      c.stroke();
    }
  }
  c.setLineDash([]);
  // a tiny house silhouette beside the house tile (its window lit or dark)
  if (o.houseLamp != null) {
    const hp = tileCentre(o, 0);
    const hx = hp.x - (TW / 2 + 30) * s, hy = o.y + (TH / 2) * s;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(hx - 10 * s, hy);
    c.lineTo(hx - 10 * s, hy - 18 * s);
    c.lineTo(hx, hy - 28 * s);
    c.lineTo(hx + 10 * s, hy - 18 * s);
    c.lineTo(hx + 10 * s, hy);
    c.closePath();
    c.fill();
    const lit = clamp01(o.houseLamp);
    c.fillStyle = lit > 0.02 ? mixLab('#5a4632', GOLD, lit) : '#5a4632';
    c.fillRect(hx - 3.5 * s, hy - 15 * s, 7 * s, 7 * s);
  }
  if (o.ring && o.ring.u > 0.01) {
    const rp = tileCentre(o, o.ring.i);
    c.strokeStyle = inkCol(env, 0.85);
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(rp.x, rp.y, (TW / 2 + 10) * s, (TH / 2 + 10) * s, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp01(o.ring.u));
    c.stroke();
  }
  c.restore();
  if (cr > 0.02 && !o.ghost) glowDot(c, cc.x, cc.y, 30 * s, tone(env, BRASS_HI, 0.05), 0.35 * cr * A);
}

// ------------------------------------------------------------------ dividers
export function dividers(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; open?: number; rot?: number; alpha?: number }): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s, s);
  const op = 0.12 + 0.3 * clamp01(o.open ?? 0.5);
  c.fillStyle = brass(env, 0.45);
  c.strokeStyle = withAlpha(mixLab(BRASS, INK, 0.6), 0.9);
  c.lineWidth = 1;
  for (const sg of [-1, 1]) {
    c.save();
    c.rotate(sg * op);
    c.beginPath();
    c.moveTo(-3, 0);
    c.lineTo(3, 0);
    c.lineTo(0.6, 150);
    c.lineTo(-0.6, 150);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, 7, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillRect(-2, -16, 4, 12);
  c.restore();
}

/** the paper-fold crease for an insert: a soft vertical crease shadow across the sheet (u 0 folded .. 1 flat) */
export function inkFold(c: C2, o: { x: number; y: number; w: number; h: number; u: number }): void {
  const k = 1 - clamp01(o.u);
  if (k <= 0.01) return;
  const cx = o.x + o.w / 2;
  const g = c.createLinearGradient(cx - 120, 0, cx + 120, 0);
  g.addColorStop(0, withAlpha('#000000', 0));
  g.addColorStop(0.47, withAlpha('#3a2614', 0.22 * k));
  g.addColorStop(0.5, withAlpha('#ffffff', 0.18 * k));
  g.addColorStop(0.53, withAlpha('#3a2614', 0.14 * k));
  g.addColorStop(1, withAlpha('#000000', 0));
  c.fillStyle = g;
  c.fillRect(cx - 120, o.y, 240, o.h);
}
export { PAPER };
