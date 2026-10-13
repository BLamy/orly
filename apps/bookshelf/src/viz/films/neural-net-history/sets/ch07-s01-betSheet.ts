/**
 * neural-net-history — the 1995 BET SHEET as it hangs on the Case Board from ch06-s05 on (pinned below the
 * question thread, under Q2), and the small props of ch07-s01 that settle it.
 *
 *   BET                       the sheet's world rect (study L4 world = rest-screen px of the BOARD camera)
 *   betLineY(i)               world y of bet i's first typed line (i = 0 Jackel's, 1 Vapnik's)
 *   betSheet(c, env, o)       the typed sheet: two numbered bets (texture), a row of asterisks, three signatures
 *                             with their dates, 'Witnessed by Y. LeCun'; pen ticks beside each bet; line glows
 *   resultsSlip(c, env, o)    the typed results slip laid across the sheet's foot (JACKEL, 2000: LOST / VAPNIK …)
 *   wineGlasses(c, env, o)    two paper wine-glass cut-outs clipped to the sheet's corner (the bet's fancy dinner)
 *   penArmTo(entry, nib, len) a right forearm holding the fountain pen so its NIB lands on `nib`
 * The bet text itself is texture, never read (ch06-s05 read it); only the slip is meant to be read.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { paperTone } from './caseBoard';
import { hands } from '../cast';
import type { ArmPose, Pt } from './narratorHands';
import { STUDY } from './study';
import { PEN_INK, clamp01 } from './ch07-s01-kit';

type C = CanvasRenderingContext2D;

/** board units: centre (505, 168), 150 × 116 → world */
const BX = 505, BY = 168, BW = 150, BH = 116;
export const BET = {
  x: STUDY.board.x + (BX - BW / 2) * STUDY.board.k,
  y: STUDY.board.y + (BY - BH / 2) * STUDY.board.k,
  w: BW * STUDY.board.k,
  h: BH * STUDY.board.k,
};
export const BET_PIN = { x: BET.x + BET.w / 2, y: BET.y + 6 };
const L0 = BET.y + 24; // first typed line
const LH = 7.2;
/** bet i's first line (world y) */
export const betLineY = (i: number) => L0 + i * 6 * LH + 3;
/** the tick's place: the right margin beside bet i (the pen comes in from the lamp side, lower right) */
export const tickAt = (i: number): Pt => ({ x: BET.x + BET.w - 17, y: betLineY(i) + 4 });
/** the pen ticks' size multiplier (≈ 70 px at 1080p on the tick insert) */
export const TICK_S = 1.6;
/** where the results slip lies (centre) */
export const SLIP_AT = { x: BET.x + BET.w / 2 + 8, y: BET.y + BET.h - 4, rot: -0.03 };
export const SLIP = { w: 196, h: 46 };

export interface BetSheetOpts {
  light: number;
  /** 0..1 ink of each pen tick (stroke progress) */
  tick?: [number, number];
  /** 0..1 a faint lamp glow passing over each bet's lines */
  glow?: [number, number];
}

export function betSheet(c: C, env: PaintEnv, o: BetSheetOpts) {
  const m = env.mood;
  const paper = mixLab(paperTone(env, o.light), m.rim, 0.08);
  const typed = withAlpha(mixLab(m.ink, paper, 0.35), 0.75);
  c.save();
  // the sheet, a soft contact shadow, a faint fold across the middle
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(BET.x + 2.5, BET.y + 3.5, BET.w, BET.h);
  c.fillStyle = paper;
  c.fillRect(BET.x, BET.y, BET.w, BET.h);
  c.fillStyle = withAlpha(m.rim, 0.22 * o.light);
  c.fillRect(BET.x, BET.y, BET.w, 1.2);
  c.fillStyle = withAlpha(m.fg, 0.08);
  c.fillRect(BET.x, BET.y + BET.h * 0.52, BET.w, 0.8);
  // the lamp glow passing over each bet (under the type)
  for (let i = 0; i < 2; i++) {
    const g = o.glow?.[i] ?? 0;
    if (g <= 0.01) continue;
    const y0 = betLineY(i) - 6;
    const gr = c.createLinearGradient(BET.x, 0, BET.x + BET.w, 0);
    gr.addColorStop(0, withAlpha(m.core, 0));
    gr.addColorStop(0.5, withAlpha(m.core, 0.35 * g));
    gr.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = gr;
    c.fillRect(BET.x + 4, y0, BET.w - 8, LH * 4 + 4);
  }
  // typed texture: two numbered bets (4 lines each), a row of asterisks, three signature blocks
  c.font = `400 6.4px ${FONT.typewriter}`;
  c.fillStyle = typed;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  for (let i = 0; i < 2; i++) {
    const y = betLineY(i);
    c.fillText(`${i + 1}.`, BET.x + 16, y);
    for (let l = 0; l < 4; l++) {
      const len = l === 3 ? 0.45 + 0.2 * hash1(i * 7 + l, 3) : 0.86;
      typedRun(c, BET.x + (l === 0 ? 26 : 16), y + l * LH - 2.2, (BET.w - (l === 0 ? 36 : 26)) * len, i * 31 + l * 7, typed);
    }
  }
  c.fillText('*  *  *  *  *  *  *  *', BET.x + 34, L0 + 12 * LH + 1);
  // signatures (pen scribbles over typed names), each dated
  const sy = L0 + 14 * LH;
  for (let k = 0; k < 3; k++) {
    const x = BET.x + 10 + k * 46;
    scribble(c, x, sy - 2, 36, 40 + k * 13, mixLab(PEN_INK, paper, 0.25));
    c.fillStyle = withAlpha(mixLab(m.ink, paper, 0.45), 0.26);
    c.font = `400 4.6px ${FONT.typewriter}`;
    c.fillText('3/14/95', x + 4, sy + 6);
  }
  c.font = `400 4.6px ${FONT.typewriter}`;
  c.fillText('Witnessed by Y. LeCun', BET.x + 102, sy + 12);
  // the pen's ticks beside each bet (fountain-pen ink, two strokes)
  for (let i = 0; i < 2; i++) {
    const u = clamp01(o.tick?.[i] ?? 0);
    if (u <= 0) continue;
    const p = tickAt(i);
    const k = TICK_S;
    c.strokeStyle = mixLab(PEN_INK, paper, 0.04);
    c.lineWidth = 1.5 * k;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const a1 = clamp01(u / 0.4), a2 = clamp01((u - 0.4) / 0.6);
    c.beginPath();
    c.moveTo(p.x - 3 * k, p.y - 2 * k);
    c.lineTo(p.x + (-3 + 3 * a1) * k, p.y + (-2 + 4 * a1) * k);
    if (a2 > 0) c.lineTo(p.x + 7 * a2 * k, p.y + (2 - 9 * a2) * k);
    c.stroke();
  }
  c.restore();
}

/** a line of typed "words" (texture only: dashes of type, not text) */
function typedRun(c: C, x: number, y: number, w: number, seed: number, col: string) {
  c.fillStyle = col;
  let xx = x;
  let k = 0;
  while (xx < x + w) {
    const len = Math.min(x + w - xx, 4 + 14 * (0.5 + 0.5 * hash1(k, seed)));
    c.fillRect(xx, y, len, 2.3);
    xx += len + 2.6;
    k++;
  }
}
function scribble(c: C, x: number, y: number, w: number, seed: number, col: string) {
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 0.9;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  for (let i = 1; i <= 14; i++) {
    const u = i / 14;
    c.lineTo(x + u * w, y + Math.sin(u * 13 + seed) * 2.6 * (0.6 + 0.4 * hash1(i, seed)) - 1.2 * Math.sin(u * 3.1));
  }
  c.stroke();
  c.restore();
}

export interface SlipOpts {
  x: number;
  y: number;
  rot?: number;
  light: number;
  /** 0..1 glow on each line as it is read */
  read?: [number, number];
  alpha?: number;
}
export const SLIP_LINES = ['JACKEL, 2000: LOST', 'VAPNIK, 2005: LOST'] as const;
/** the typed results slip (centre at x, y) */
export function resultsSlip(c: C, env: PaintEnv, o: SlipOpts) {
  const m = env.mood;
  const paper = mixLab(paperTone(env, Math.min(1, o.light + 0.15)), m.core, 0.12);
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-SLIP.w / 2 + 2, -SLIP.h / 2 + 3, SLIP.w, SLIP.h);
  c.fillStyle = paper;
  c.fillRect(-SLIP.w / 2, -SLIP.h / 2, SLIP.w, SLIP.h);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(-SLIP.w / 2, -SLIP.h / 2, SLIP.w, 0.9);
  c.font = `400 14px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  SLIP_LINES.forEach((ln, i) => {
    const y = (i - 0.5) * 18;
    const g = o.read?.[i] ?? 0;
    if (g > 0.01) {
      const gr = c.createLinearGradient(-SLIP.w / 2, 0, SLIP.w / 2, 0);
      gr.addColorStop(0, withAlpha(m.core, 0));
      gr.addColorStop(0.5, withAlpha(m.core, 0.55 * g));
      gr.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gr;
      c.fillRect(-SLIP.w / 2 + 3, y - 8.5, SLIP.w - 6, 17);
    }
    c.fillStyle = mixLab(m.ink, paper, 0.06);
    c.fillText(ln, 0, y + 5.3);
  });
  c.restore();
}

/**
 * A typed paper FLAG pinned in the sheet's right margin beside bet i, naming whose bet it is and what it
 * claimed (two lines, Special Elite at 12.5 world px: ≥ 23 px cap at 1080p on the BET close, k ≈ 2.8).
 * `strike` 0..1 draws the pen's line through the claim (line 2) as the narration says it did not happen.
 */
export const FLAG_X = BET.x + BET.w + 10;
export const flagY = (i: number) => (i === 0 ? BET.y + 8 : BET.y + 60);
export const FLAG_LINES = [
  ['JACKEL: BY 2000,', 'NETS EXPLAINED'],
  ['VAPNIK: BY 2005,', 'NETS UNUSED'],
] as const;
const FLAG_FONT = `400 12.5px ${FONT.typewriter}`;
const FLAG_LH = 17;
export function flagGeom(c: C, i: number) {
  c.save();
  c.font = FLAG_FONT;
  const w1 = c.measureText(FLAG_LINES[i][0]).width, w2 = c.measureText(FLAG_LINES[i][1]).width;
  c.restore();
  const w = Math.max(w1, w2) + 30;
  const x = FLAG_X, y = flagY(i), h = FLAG_LH * 2 + 16;
  // the strike runs through line 2 (left → right)
  return { x, y, w, h, strike: { x0: x + 14, x1: x + 22 + w2, y: y + 8 + FLAG_LH * 2 - 6 } };
}
export interface FlagOpts {
  /** 0..1 pinned (drops in, settles) */
  pin: number;
  /** 0..1 how much of the strike line has been inked */
  strike: number;
  light: number;
  /** 0..1 lamp glow over the flag (read now) */
  glow?: number;
}
export function betFlag(c: C, env: PaintEnv, i: number, o: FlagOpts) {
  if (o.pin <= 0.01) return;
  const m = env.mood;
  const g = flagGeom(c, i);
  const paper = mixLab(mixLab(paperTone(env, Math.min(1, o.light + 0.1)), '#b08a52', 0.18), m.core, 0.08);
  const drop = (1 - o.pin) * -10;
  const rot = (i === 0 ? -0.018 : 0.014) + (1 - o.pin) * 0.06;
  c.save();
  c.globalAlpha *= Math.min(1, o.pin * 1.6);
  c.translate(g.x, g.y + drop);
  c.rotate(rot);
  c.translate(-g.x, -g.y);
  // contact shadow, the slip with a notched (flag) right end, a faint rim along its top
  const path = (dx: number, dy: number) => {
    c.beginPath();
    c.moveTo(g.x + dx, g.y + dy);
    c.lineTo(g.x + g.w + dx, g.y + dy);
    c.lineTo(g.x + g.w - 9 + dx, g.y + g.h / 2 + dy);
    c.lineTo(g.x + g.w + dx, g.y + g.h + dy);
    c.lineTo(g.x + dx, g.y + g.h + dy);
    c.closePath();
  };
  c.fillStyle = withAlpha(m.fg, 0.38);
  path(2.5, 3);
  c.fill();
  c.fillStyle = paper;
  path(0, 0);
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(g.x, g.y, g.w - 1, 1);
  const gl = o.glow ?? 0;
  if (gl > 0.01) {
    const gr = c.createLinearGradient(g.x, 0, g.x + g.w, 0);
    gr.addColorStop(0, withAlpha(m.core, 0.05 * gl));
    gr.addColorStop(0.45, withAlpha(m.core, 0.4 * gl));
    gr.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = gr;
    path(0, 0);
    c.fill();
  }
  // the typed claim
  c.font = FLAG_FONT;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = mixLab(m.ink, paper, 0.08);
  c.fillText(FLAG_LINES[i][0], g.x + 18, g.y + 8 + FLAG_LH - 3);
  c.fillText(FLAG_LINES[i][1], g.x + 18, g.y + 8 + FLAG_LH * 2 - 3);
  // the strike: fountain-pen ink, a slightly wavering hand line
  const u = clamp01(o.strike);
  if (u > 0) {
    const S = g.strike;
    c.strokeStyle = mixLab(PEN_INK, paper, 0.06);
    c.lineWidth = 1.9;
    c.lineCap = 'round';
    c.beginPath();
    const n = 14;
    for (let k = 0; k <= n * u; k++) {
      const v = k / n;
      const x = S.x0 + (S.x1 - S.x0) * v;
      const y = S.y + 0.8 * Math.sin(v * 7 + i) - 1.4 * v + 0.7;
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}

/** two small paper wine-glass cut-outs, tilted toward each other (a toast), clipped at (x, y) */
export function wineGlasses(c: C, env: PaintEnv, o: { x: number; y: number; s?: number; glint?: number; light: number }) {
  const s = o.s ?? 1;
  const m = env.mood;
  const paper = mixLab(paperTone(env, o.light), m.halo, 0.15);
  c.save();
  c.translate(o.x, o.y);
  // the paper backing card, then the two glasses cut from it as ink silhouettes
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-14 * s + 1.5, -2 * s + 2, 28 * s, 26 * s);
  c.fillStyle = paper;
  c.fillRect(-14 * s, -2 * s, 28 * s, 26 * s);
  const ink = mixLab(m.ink, paper, 0.1);
  for (const [dx, rot] of [[-5.5, 0.22], [5.5, -0.22]] as const) {
    c.save();
    c.translate(dx * s, 21 * s);
    c.rotate(rot);
    c.fillStyle = ink;
    c.beginPath();
    // bowl, stem, foot
    c.moveTo(-4 * s, -17 * s);
    c.quadraticCurveTo(-4.4 * s, -10 * s, -0.6 * s, -9 * s);
    c.lineTo(-0.5 * s, -2 * s);
    c.lineTo(-3 * s, -0.5 * s);
    c.lineTo(3 * s, -0.5 * s);
    c.lineTo(0.5 * s, -2 * s);
    c.lineTo(0.6 * s, -9 * s);
    c.quadraticCurveTo(4.4 * s, -10 * s, 4 * s, -17 * s);
    c.closePath();
    c.fill();
    c.restore();
  }
  // a paper clip over the top edge
  c.strokeStyle = mixLab(m.halo, m.set, 0.3);
  c.lineWidth = 1.1;
  c.strokeRect(-3 * s, -6 * s, 6 * s, 11 * s);
  const g = o.glint ?? 0;
  if (g > 0.01) {
    c.globalCompositeOperation = 'lighter';
    for (const dx of [-7, 3.5]) {
      const gr = c.createRadialGradient(dx * s, 7 * s, 0, dx * s, 7 * s, 9 * s);
      gr.addColorStop(0, withAlpha(m.core, 0.85 * g));
      gr.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gr;
      c.fillRect(dx * s - 9 * s, -2 * s, 18 * s, 18 * s);
    }
  }
  c.restore();
}

/** a right forearm holding the fountain pen so its nib lands on `nib` */
export function penArmTo(entry: Pt, nib: Pt, len: number): ArmPose {
  let sock = nib;
  let arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  for (let i = 0; i < 3; i++) {
    const ang = arm.angle + (arm.bend ?? 0) + 0.5;
    sock = { x: nib.x - Math.cos(ang) * 0.55 * len, y: nib.y - Math.sin(ang) * 0.55 * len };
    arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  }
  return arm;
}
