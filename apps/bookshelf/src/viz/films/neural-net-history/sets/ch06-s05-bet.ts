/**
 * ch06-s05 — the 1995 bet: the typed sheet (top-down), the table at Bell Labs (side view), the quote slip.
 *
 *   BET1 / BET2 / PHRASE         the two bets, verbatim from research/quotes.json (q-bet-jackel, q-bet-vapnik)
 *   SHEET                        the sheet's rect on the table (L4 world, top-down camera)
 *   layoutSheet(c)               the typed layout (Special Elite is monospaced): every word's box, the phrase's
 *                                underline segments, bet blocks, the signature lines — shared by the baked sheet,
 *                                the lamp glow, the underline and the signatures
 *   paintSheet(c, env)           the paper with its type (bake it with f.cached)
 *   signature(c, L, i, u, env)   the i-th signature written in to u (0..1); returns the nib point
 *   fountainPen(c, x, y, ang, s, env)   a capped-off fountain pen, nib at (x, y)
 *   wineGlass(c, x, y, s, env)   side-on: bowl, stem, foot (y = the table top)
 *   wineGlassTop(c, x, y, r, env) top-down: rim, bowl shadow, foot ring
 *   sideChair(c, x, seatY, floorY, facing, env)
 *   pendantLamp(c, x, y, env)    a hanging shade on a cord from the flies; returns the bulb point
 *   PEN_PUPPETS                  Vapnik / Jackel with the fountain pen as their prop (the pen passes hand to hand)
 */
import type { PaintEnv } from '../../../film/contracts';
import { createPuppet } from '../../../film/silhouette/puppet';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { SPECS } from '../cast';
import { h01 } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

export const BET1 =
  'Jackel bets (one fancy dinner) that by March 14, 2000, people will understand quantitatively why big neural nets working on large databases are not so bad. (Understanding means that there will be clear conditions and bounds)';
export const BET2 = 'Vapnik bets (one fancy dinner) that by March 14, 2005, no one in his right mind will use neural nets that are essentially like those used in 1995.';
export const PHRASE = ['no', 'one', 'in', 'his', 'right', 'mind'];
export const SIGS = [
  { name: 'V. Vapnik', date: '3/14/95' },
  { name: 'L. Jackel', date: '3/14/95' },
  { name: 'Witnessed by Y. LeCun', date: '3/14/95' },
];

/** the sheet on the table (L4 world, top-down) */
export const SHEET = { x: 320, y: 60, w: 460, h: 640 } as const;
const TYPE = 15;
const LH = 25;
const MARGIN = 44;
const INDENT = 26;

export interface WordBox {
  w: string;
  x: number;
  y: number;
  width: number;
}
export interface SheetLayout {
  adv: number;
  bet1: WordBox[];
  bet2: WordBox[];
  /** the bets' block rects (for the lamp glow and the quote slip's take-off) */
  block1: { x: number; y: number; w: number; h: number };
  block2: { x: number; y: number; w: number; h: number };
  /** the phrase's underline segments (one per line it spans), with the cumulative fraction at each segment's start */
  phrase: { x0: number; x1: number; y: number; f0: number; f1: number }[];
  starsY: number;
  /** signature baselines (left x, y, line width) */
  sigs: { x: number; y: number; w: number }[];
}

function wrap(c: C, words: string[], x0: number, y0: number, maxW: number): WordBox[] {
  const out: WordBox[] = [];
  const sp = c.measureText(' ').width * 1.15;
  let x = 0, row = 0;
  for (const w of words) {
    const ww = c.measureText(w).width;
    if (x > 0 && x + sp + ww > maxW) {
      x = 0;
      row++;
    }
    if (x > 0) x += sp;
    out.push({ w, x: x0 + x, y: y0 + row * LH, width: ww });
    x += ww;
  }
  return out;
}

/** the sheet's typed layout (monospaced; the advance is measured from the face) */
export function layoutSheet(c: C): SheetLayout {
  c.save();
  c.font = `400 ${TYPE}px ${FONT.typewriter}`;
  c.letterSpacing = '0px';
  const adv = c.measureText('M').width;
  const x0 = SHEET.x + MARGIN + INDENT;
  const maxW = SHEET.w - 2 * MARGIN - INDENT;
  const y1 = SHEET.y + 96;
  const bet1 = wrap(c, BET1.split(' '), x0, y1, maxW);
  const end1 = bet1[bet1.length - 1].y;
  const starsY = end1 + 42;
  const y2 = starsY + 42;
  const bet2 = wrap(c, BET2.split(' '), x0, y2, maxW);
  c.restore();
  const end2 = bet2[bet2.length - 1].y;
  const block = (ws: WordBox[]) => {
    const ys = ws.map((q) => q.y);
    return { x: x0 - INDENT - 6, y: Math.min(...ys) - TYPE - 6, w: SHEET.w - 2 * MARGIN + 12, h: Math.max(...ys) - Math.min(...ys) + TYPE + 16 };
  };
  // the phrase: find the run of words, split by line
  const start = bet2.findIndex((q, i) => PHRASE.every((p, k) => bet2[i + k]?.w.replace(/[^a-z]/gi, '').toLowerCase() === p));
  const run = start >= 0 ? bet2.slice(start, start + PHRASE.length) : [];
  const segs: { x0: number; x1: number; y: number }[] = [];
  for (const q of run) {
    const s = segs[segs.length - 1];
    if (s && Math.abs(s.y - q.y) < 1) s.x1 = q.x + q.width;
    else segs.push({ x0: q.x, x1: q.x + q.width, y: q.y });
  }
  const total = segs.reduce((a, s) => a + (s.x1 - s.x0), 0) || 1;
  let acc = 0;
  const phrase = segs.map((s) => {
    const f0 = acc / total;
    acc += s.x1 - s.x0;
    return { ...s, y: s.y + 4, f0, f1: acc / total };
  });
  const sy0 = end2 + 72;
  const sigs = [0, 1, 2].map((i) => ({ x: SHEET.x + MARGIN + 8, y: sy0 + i * 54, w: SHEET.w - 2 * MARGIN - 16 }));
  return { adv, bet1, bet2, block1: block(bet1), block2: block(bet2), phrase, starsY, sigs };
}

/** paper tone under the lamp (top-down: lit from straight above) */
export const sheetPaper = (env: { mood: PaintEnv['mood'] }) => mixLab(mixLab(env.mood.halo, env.mood.rim, 0.62), '#efe6d2', 0.42);
export const sheetInk = (env: { mood: PaintEnv['mood'] }) => mixLab(env.mood.ink, '#2a1d18', 0.4);

/** the typed texture's opacity: the sheet is a document seen, not read (the quote slip carries the words) */
export const TYPE_TEXTURE_A = 0.27;
export const PHRASE_FONT = `400 ${TYPE}px ${FONT.typewriter}`;

/**
 * the paper and its type, in world coordinates (bake with f.cached over SHEET). The typed text is TEXTURE (faint,
 * under 0.3 opacity); the spoken phrase is left out with `phrase: false` so the shot can draw it live (crisp, and
 * at the camera's true size), or baked faint with the rest for the small pinned copy.
 */
export function paintSheet(c: C, env: PaintEnv, L: SheetLayout, o: { phrase?: boolean } = {}) {
  const m = env.mood;
  const paper = sheetPaper(env);
  const ink = sheetInk(env);
  c.save();
  // contact shadow, then the sheet with a faint fold across the middle
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(SHEET.x + 5, SHEET.y + 7, SHEET.w, SHEET.h);
  c.fillStyle = paper;
  c.fillRect(SHEET.x, SHEET.y, SHEET.w, SHEET.h);
  const fold = c.createLinearGradient(0, SHEET.y + SHEET.h * 0.48, 0, SHEET.y + SHEET.h * 0.52);
  fold.addColorStop(0, withAlpha(m.set, 0));
  fold.addColorStop(0.5, withAlpha(m.set, 0.12));
  fold.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = fold;
  c.fillRect(SHEET.x, SHEET.y + SHEET.h * 0.48, SHEET.w, SHEET.h * 0.04);
  // the type: struck keys land a little differently (seeded); the phrase a touch darker
  c.font = `400 ${TYPE}px ${FONT.typewriter}`;
  c.letterSpacing = '0px';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const typed = (ws: WordBox[], seed: number, skip?: Set<number>) => {
    ws.forEach((q, i) => {
      if (skip?.has(i)) return;
      const a = TYPE_TEXTURE_A * (0.8 + 0.2 * h01(i, seed));
      c.fillStyle = withAlpha(ink, a);
      c.fillText(q.w, q.x, q.y + (h01(i, seed + 1) - 0.5) * 0.8);
    });
  };
  c.fillStyle = withAlpha(ink, TYPE_TEXTURE_A);
  c.fillText('1.', SHEET.x + MARGIN, L.bet1[0].y);
  c.fillText('2.', SHEET.x + MARGIN, L.bet2[0].y);
  typed(L.bet1, 501);
  const start = L.bet2.findIndex((q, i) => PHRASE.every((p, k) => L.bet2[i + k]?.w.replace(/[^a-z]/gi, '').toLowerCase() === p));
  typed(L.bet2, 502, o.phrase === false ? new Set(PHRASE.map((_, k) => start + k)) : undefined);
  // the row of asterisks between the bets
  c.fillStyle = withAlpha(ink, 0.5);
  const n = 17;
  for (let i = 0; i < n; i++) c.fillText('*', SHEET.x + MARGIN + 20 + i * ((SHEET.w - 2 * MARGIN - 40) / (n - 1)), L.starsY);
  // signature lines (blank until signed)
  c.strokeStyle = withAlpha(ink, 0.4);
  c.lineWidth = 0.9;
  for (const s of L.sigs) {
    c.beginPath();
    c.moveTo(s.x, s.y + 6);
    c.lineTo(s.x + s.w, s.y + 6);
    c.stroke();
  }
  c.restore();
}

/** the spoken phrase's words on the sheet, drawn live (crisp ink) */
export function paintPhrase(c: C, env: PaintEnv, L: SheetLayout, alpha = 0.95) {
  const start = L.bet2.findIndex((q, i) => PHRASE.every((p, k) => L.bet2[i + k]?.w.replace(/[^a-z]/gi, '').toLowerCase() === p));
  if (start < 0) return;
  c.save();
  c.font = PHRASE_FONT;
  c.letterSpacing = '0px';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.fillStyle = withAlpha(sheetInk(env), alpha);
  for (let k = 0; k < PHRASE.length; k++) {
    const q = L.bet2[start + k];
    c.fillText(q.w, q.x, q.y + (h01(start + k, 503) - 0.5) * 0.8);
  }
  c.restore();
}

/** the i-th signature written in to u (fountain-pen italic, left → right); returns the nib point. `alpha` < 0.3 for a small copy (texture) */
export function signature(c: C, L: SheetLayout, i: number, u: number, env: PaintEnv, alpha = 1): P | null {
  if (u <= 0) return null;
  const s = L.sigs[i];
  const g = SIGS[i];
  const text = `${g.name}   ${g.date}`;
  const size = 21;
  c.save();
  c.font = `italic 400 ${size}px ${FONT.fell}`;
  c.letterSpacing = '0px';
  const w = c.measureText(text).width;
  const x0 = s.x + 6 + (i === 2 ? 0 : 10);
  const xr = x0 + w * Math.min(1, u);
  c.beginPath();
  c.rect(x0 - 4, s.y - size * 1.2, xr - x0 + 4, size * 1.8);
  c.clip();
  c.fillStyle = withAlpha(mixLab(MOODS.parchment.ink, '#1d2a44', 0.35), alpha); // a blue-black fountain-pen ink
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.fillText(text, x0, s.y);
  c.restore();
  return u < 1 ? { x: xr, y: s.y - 4 - 3 * Math.sin(u * 40) } : null;
}

/** a fountain pen lying/held at angle ang (radians, nib direction), nib at (x, y) */
export function fountainPen(c: C, x: number, y: number, ang: number, s: number, env: PaintEnv) {
  c.save();
  c.translate(x, y);
  c.rotate(ang + Math.PI);
  c.fillStyle = env.fill('ink');
  // nib
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(12 * s, -3 * s);
  c.lineTo(12 * s, 3 * s);
  c.closePath();
  c.fill();
  // section and barrel
  c.beginPath();
  c.roundRect(12 * s, -3.6 * s, 14 * s, 7.2 * s, 2 * s);
  c.roundRect(25 * s, -4.6 * s, 68 * s, 9.2 * s, 4 * s);
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.45);
  c.fillRect(27 * s, -4.2 * s, 64 * s, 1.2 * s);
  c.fillRect(40 * s, -4.6 * s, 1.4 * s, 9.2 * s);
  c.restore();
}

/** a wine glass, side-on; (x, y) = the foot on the table top; s = scale (1 ≈ 46 px tall) */
export function wineGlass(c: C, x: number, y: number, s: number, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.ellipse(x, y - 1.2 * s, 9 * s, 1.8 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 1 * s, y - 22 * s, 2 * s, 21 * s);
  // the bowl: glass, so it is a pale, translucent shape with an ink rim line (the backlight shows through)
  const bowl = new Path2D();
  bowl.moveTo(x - 10 * s, y - 46 * s);
  bowl.bezierCurveTo(x - 11 * s, y - 30 * s, x - 6 * s, y - 22 * s, x, y - 22 * s);
  bowl.bezierCurveTo(x + 6 * s, y - 22 * s, x + 11 * s, y - 30 * s, x + 10 * s, y - 46 * s);
  bowl.closePath();
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.22);
  c.fill(bowl);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.4 * s;
  c.stroke(bowl);
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 6.5 * s, y - 42 * s);
  c.quadraticCurveTo(x - 7.5 * s, y - 32 * s, x - 3 * s, y - 27 * s);
  c.stroke();
  c.restore();
}

/** a wine glass seen from straight above: the rim ring, the bowl's shadowed inside, the foot ring beyond */
export function wineGlassTop(c: C, x: number, y: number, r: number, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.beginPath();
  c.arc(x + r * 0.18, y + r * 0.22, r * 1.05, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.fill('ink'), 0.85);
  c.lineWidth = r * 0.12;
  c.beginPath();
  c.arc(x, y, r * 0.78, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.35), 0.5);
  c.beginPath();
  c.arc(x, y, r * 0.72, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = r * 0.08;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.55);
  c.lineWidth = r * 0.05;
  c.beginPath();
  c.arc(x, y, r * 0.95, Math.PI * 1.05, Math.PI * 1.55);
  c.stroke();
  c.restore();
}

/** a plain side chair, side-on: seat at seatY, its back on the side away from `facing` */
export function sideChair(c: C, x: number, seatY: number, floorY: number, facing: 'left' | 'right', env: PaintEnv) {
  const d = facing === 'right' ? -1 : 1;
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 24, seatY, 48, 6);
  c.fillRect(x - 22, seatY + 6, 4, floorY - seatY - 6);
  c.fillRect(x + 18, seatY + 6, 4, floorY - seatY - 6);
  c.fillRect(x + d * 22 - 2, seatY - 92, 5, 98);
  c.beginPath();
  c.roundRect(x + d * 22 - (d > 0 ? 6 : -1), seatY - 92, 7, 46, 2);
  c.fill();
  c.restore();
}

/** a hanging shade on a cord from above; returns the bulb point */
export function pendantLamp(c: C, x: number, y: number, env: PaintEnv): P {
  const m = env.mood;
  c.save();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x, -400);
  c.lineTo(x, y - 22);
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(x - 6, y - 24);
  c.lineTo(x + 6, y - 24);
  c.lineTo(x + 40, y + 8);
  c.quadraticCurveTo(x, y + 2, x - 40, y + 8);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(x - 40, y + 6, 80, 1.4);
  c.restore();
  return { x, y: y + 8 };
}

/** Vapnik and Jackel with the fountain pen as their prop (the pen passes hand to hand in the side view) */
export const PEN_PUPPETS = {
  vapnikPen: createPuppet({ ...SPECS.vapnik, id: 'vapnik-pen', prop: 'pen' }),
  vapnikBare: createPuppet({ ...SPECS.vapnik, id: 'vapnik-bare', prop: 'none' }),
  jackelPen: createPuppet({ ...SPECS.jackel, id: 'jackel-pen', prop: 'pen' }),
};
