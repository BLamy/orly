/**
 * ch04-s07 — the Winter Map: a snowbound paper landscape at night, laid out west (left) to east (right),
 * and the pieces of the Helsinki insert.
 *
 *   MAP                    where the three lit houses stand (layer + rest-screen px)
 *   cottage(c, o, env)     a small paper-cut house with one window (lit or dark); returns the window rect
 *   bigHouse(c, o, env)    a large foreground house, gable to the sky, with several bright windows facing us;
 *                          returns the window rects (the shot lights them)
 *   printoutSheet(c, o, env)  the top sheet of a fanfold printout, face on: sprocket strips, faint bars,
 *                          a typed header and a few lines of FORTRAN-style code (illustrative texture)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';

type C = CanvasRenderingContext2D;
export type Rect = { x: number; y: number; w: number; h: number };

export const MAP = {
  /** the Helsinki cottage on the near ridge (L4), farthest west */
  helsinki: { x: 300, y: 566 },
  /** Amari's house on the middle ridge (L3), in Japan, far east */
  amari: { x: 846, y: 520 },
  /** Fukushima's window on the far ridge (L2), farthest east */
  tokyo: { x: 1150, y: 470 },
  /** unlit houses scattered across the three ridge planes: [layer, x, scale] (smaller and hazier far, larger near) */
  dark: [
    ['L2', 130, 0.6],
    ['L2', 410, 0.56],
    ['L2', 640, 0.62],
    ['L2', 905, 0.58],
    ['L2', 1300, 0.6],
    ['L3', 214, 0.84],
    ['L3', 548, 0.8],
    ['L3', 1290, 0.86],
    ['L4', 700, 1.3],
    ['L4', -60, 1.25],
    ['L4', 1360, 1.32],
  ] as [string, number, number][],
} as const;

export interface CottageOpts {
  x: number;
  y: number;
  s?: number;
  /** the window's light 0..1 (0 = dark) */
  lit?: number;
  seed?: number;
  /** snow on the roof */
  snow?: boolean;
  /** roof pitch: the ridge's height over the eaves as a multiple of the default (0.7 … 1.4) */
  pitch?: number;
  /** the chimney's place along the roof, −1 (left) … 1 (right) */
  chimney?: number;
  /** wall height multiple (a taller or squatter house) */
  tall?: number;
}
/** a cottage's chimney top (world), for smoke */
export function cottageChimney(o: CottageOpts): { x: number; y: number } {
  const s = o.s ?? 1;
  const h = 40 * s * (o.tall ?? 1);
  const rh = 30 * s * (o.pitch ?? 1);
  const cx = o.x + (o.chimney ?? 0.55) * 26 * s;
  const roofAt = o.y - h - rh * (1 - Math.abs(cx - o.x) / (32 * s + 7 * s));
  return { x: cx, y: Math.min(roofAt, o.y - h) - 12 * s };
}
/** a small cottage: walls, a gable roof with a chimney, one window. Returns the window rect (world). */
export function cottage(c: C, o: CottageOpts, env: PaintEnv): Rect {
  const s = o.s ?? 1;
  const w = 64 * s, h = 40 * s * (o.tall ?? 1);
  const rh = 30 * s * (o.pitch ?? 1);
  const x0 = o.x - w / 2, y0 = o.y - h;
  const ink = env.fill('ink');
  const win: Rect = { x: o.x - 8 * s, y: y0 + 11 * s, w: 16 * s, h: 19 * s };
  // walls with the window as a hole
  const p = new Path2D();
  p.rect(x0, y0, w, h + 2);
  p.rect(win.x, win.y, win.w, win.h);
  c.fillStyle = ink;
  c.fill(p, 'evenodd');
  // roof + chimney (the chimney stands on the roof slope, so it is drawn first, from below the slope)
  const ch = cottageChimney(o);
  c.fillRect(ch.x - 4 * s, ch.y, 8 * s, y0 - ch.y + 2);
  c.beginPath();
  c.moveTo(x0 - 7 * s, y0 + 1);
  c.lineTo(o.x, y0 - rh);
  c.lineTo(x0 + w + 7 * s, y0 + 1);
  c.closePath();
  c.fill();
  // a cut-paper notch: the gable's barge board, a hair proud of the roof
  c.strokeStyle = ink;
  c.lineWidth = 1.2 * s;
  c.beginPath();
  c.moveTo(x0 - 8.5 * s, y0 + 2.4 * s);
  c.lineTo(o.x, y0 - rh - 1.2 * s);
  c.lineTo(x0 + w + 8.5 * s, y0 + 2.4 * s);
  c.stroke();
  if (o.snow !== false) {
    // a moonlit snow cap along both slopes, thick at the ridge, lumpy drifts over the eaves
    const snowCol = mixLab(env.fill('halo'), env.fill('core'), 0.3);
    const L = { x: x0 - 7 * s, y: y0 + 1 }, A = { x: o.x, y: y0 - rh }, R = { x: x0 + w + 7 * s, y: y0 + 1 };
    c.fillStyle = snowCol;
    c.beginPath();
    c.moveTo(L.x - 2 * s, L.y + 1.5 * s);
    c.lineTo(A.x, A.y - 3.2 * s);
    c.lineTo(R.x + 2 * s, R.y + 1.5 * s);
    // the underside: lumps along each slope
    const n = 7;
    for (let i = n; i >= 0; i--) {
      const u = i / n;
      const px = A.x + (R.x - A.x) * u, py = A.y + (R.y - A.y) * u;
      const lump = (2.2 + 1.6 * Math.abs(Math.sin(i * 2.1 + o.x * 0.01))) * s;
      c.lineTo(px - 1.2 * s, py + lump);
    }
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const px = A.x + (L.x - A.x) * u, py = A.y + (L.y - A.y) * u;
      const lump = (2.2 + 1.6 * Math.abs(Math.sin(i * 1.7 + o.x * 0.013))) * s;
      c.lineTo(px + 1.2 * s, py + lump);
    }
    c.closePath();
    c.fill();
    // a drift on the chimney cap and a line of snow on the sill
    c.fillRect(ch.x - 5 * s, ch.y - 2 * s, 10 * s, 2.6 * s);
    c.fillRect(win.x - 2 * s, win.y + win.h, win.w + 4 * s, 2 * s);
  }
  // the window: the room's light (or a dark pane), glazing bars
  const k = o.lit ?? 0;
  c.fillStyle = k > 0 ? mixLab(mixLab(env.mood.set, env.mood.fg, 0.4), mixLab(env.mood.core, '#f4e3b8', 0.35), Math.min(1, 0.35 + 0.65 * k)) : mixLab(env.mood.set, env.mood.fg, 0.45);
  c.fillRect(win.x, win.y, win.w, win.h);
  c.fillStyle = ink;
  c.fillRect(o.x - 0.8 * s, win.y, 1.6 * s, win.h);
  c.fillRect(win.x, win.y + win.h * 0.45, win.w, 1.6 * s);
  return win;
}

export interface BigHouseOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  roof: number;
  windows: number;
  seed?: number;
}
/** a large foreground house (front facing us, the map behind it); returns its window rects */
export function bigHouse(c: C, o: BigHouseOpts, env: PaintEnv): Rect[] {
  const ink = env.fill('fg');
  const wins: Rect[] = [];
  const ww = o.w * 0.15, wh = o.h * 0.3;
  for (let i = 0; i < o.windows; i++) {
    const cx = o.x - o.w / 2 + (o.w * (i + 0.5)) / o.windows;
    wins.push({ x: cx - ww / 2, y: o.y - o.h * 0.72, w: ww, h: wh });
  }
  const p = new Path2D();
  p.moveTo(o.x - o.w / 2, o.y + 600);
  p.lineTo(o.x - o.w / 2, o.y - o.h);
  p.lineTo(o.x - o.w / 2 - 18, o.y - o.h);
  p.lineTo(o.x, o.y - o.h - o.roof);
  p.lineTo(o.x + o.w / 2 + 18, o.y - o.h);
  p.lineTo(o.x + o.w / 2, o.y - o.h);
  p.lineTo(o.x + o.w / 2, o.y + 600);
  p.closePath();
  for (const r of wins) p.rect(r.x, r.y, r.w, r.h);
  c.fillStyle = ink;
  c.fill(p, 'evenodd');
  // chimney with a thread of smoke (static cut)
  c.fillRect(o.x + o.w * 0.22, o.y - o.h - o.roof * 0.75, o.w * 0.07, o.roof * 0.6);
  // snow along the roof line
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.8);
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(o.x - o.w / 2 - 16, o.y - o.h - 2);
  c.lineTo(o.x, o.y - o.h - o.roof - 2);
  c.lineTo(o.x + o.w / 2 + 16, o.y - o.h - 2);
  c.stroke();
  return wins;
}

export interface PrintoutOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  /** lamp light on the paper 0..1 */
  light: number;
  rot?: number;
  codeSize?: number;
  codeLead?: number;
  /** header type size (default 30) and the first code line's baseline (default 108) */
  headerSize?: number;
  codeTop?: number;
}
export const PRINTOUT_HEADER = 'ROUNDING ERRORS';
/** illustrative FORTRAN-style lines (texture, not a transcription) */
export const PRINTOUT_CODE = [
  'C     ACCUMULATED ROUNDING ERROR',
  '      DO 20 K = N, 1, -1',
  '      D(K) = D(K) + E(K)*W(K)',
  '   20 CONTINUE',
  '      DO 30 K = 1, N',
  '      R(K) = R(K) + D(K)*U(K)',
  '   30 CONTINUE',
];
export function printoutSheet(c: C, o: PrintoutOpts, env: PaintEnv) {
  const m = env.mood;
  const paper = mixLab(mixLab(m.set, m.setHaze, 0.5), mixLab(m.core, m.rim, 0.4), Math.min(1, 0.15 + 0.85 * o.light));
  const ink = mixLab(m.ink, paper, 0.12);
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  // a soft contact shadow, the sheet, the perforation along the fold at its foot
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(6, 8, o.w, o.h);
  c.fillStyle = paper;
  c.fillRect(0, 0, o.w, o.h);
  // faint printer bars (every other band of three lines)
  c.fillStyle = withAlpha(mixLab(paper, m.halo, 0.5), 0.35);
  for (let y = 40; y < o.h - 20; y += 56) c.fillRect(30, y, o.w - 60, 28);
  // sprocket strips: a perforation line and round holes down both edges
  c.strokeStyle = withAlpha(ink, 0.25);
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(26, 0);
  c.lineTo(26, o.h);
  c.moveTo(o.w - 26, 0);
  c.lineTo(o.w - 26, o.h);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = mixLab(m.set, m.fg, 0.5);
  for (let y = 12; y < o.h; y += 22) {
    c.beginPath();
    c.arc(13, y, 4.2, 0, Math.PI * 2);
    c.arc(o.w - 13, y, 4.2, 0, Math.PI * 2);
    c.fill();
  }
  // the typed header and the code
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const hs = o.headerSize ?? 30;
  c.font = `500 ${hs}px ${FONT.mono}`;
  c.fillText(PRINTOUT_HEADER, 44, 24 + hs);
  c.fillRect(44, 34 + hs, c.measureText(PRINTOUT_HEADER).width, 1.6);
  c.font = `400 ${o.codeSize ?? 19}px ${FONT.mono}`;
  PRINTOUT_CODE.forEach((l, i) => c.fillText(l, 36, (o.codeTop ?? 108) + i * (o.codeLead ?? 30)));
  c.restore();
}
