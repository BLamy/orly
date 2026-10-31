/**
 * ch04-s14 — WHY NOT JUST USE DOUBLES? (plate, parchment; cut on motion from 'what exact means'; 18.5 s).
 * L0427 "Why not doubles everywhere? A September study tried. Of twenty thousand percent labels, nearly nineteen
 *        thousand went wrong."
 * L0428 "More precision broke it. Keep thirty-two-bit order at the rounding points alone, and every label came back."
 *
 * Same plate (sets/ch04-s12-plate). A study card slides onto it and is pinned; a grid of tiny percentage labels fills
 * it, 20 rows × 50 columns = 1,000 cells, each cell standing for 20 of the study's 20,000 labels.
 *
 * TEACHES, word by word (counts from the script: 18,820 of 20,000 wrong = 941 of 1,000 cells; 59 stay plain):
 *   (cut)        the study card slides in from the right (cut on motion)
 *   (cut)        the card arrives already dated '13 Sept 2026'
 *   'September'  a brass pin drives in and the date warms; 'tried' inks 'float64 everywhere:'
 *   'twenty'     the grid fills row by row ('of 20,000 percent labels'); 'nineteen' inks '18,820'
 *   'wrong'      941 cells flip to red-pencil marks in a scattered rush (' wrong'); 59 plain cells are left
 *   'More'       stillness
 *   'Keep'       a ribbon of the program's steps under the card; copper pins drive in at the rounding points only;
 *                'FP32 order at rounding points only:' inks
 *   'every label came back'  the red marks clear in a sweep, every one; ' 0 wrong' inks on 'back'
 *   hold         the card slides aside toward the workbench: tag 6 waits on the copper line
 * Camera: a slow push; in the hold it drifts left with the reveal of the line.
 *
 * Review r1: the plate starts EMPTY and the card slides in from 2.8 s, pinned on 'September'; on 'Keep' the copper pins
 * drop in at the rounding points, and from 'alone' each pin PRESSES IN and clears the column band above it (a copper
 * flash up through the band), left to right, so the pins visibly cause the clearing; '0 wrong' is inked by 'every' and
 * the card and the result line hold still for 1.7 s; the copper line and tag 6 come in during the hold at the left, and
 * the card slides aside from line end + 0.6, settling before the cut; the result line stays put, above 0.88 H; each
 * plain cell carries a tiny '%' glyph, struck through in red pencil when wrong.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cardPaperAlpha, cardProbe, defineShot, hash1, mixLab, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { PENCIL_MARK, copperOf } from '../sets/narratorHands';
import { drawTag } from '../sets/tagLine';
import { COPPER_INK, INK, PLATE_INK, inkSegments, inkText, plateNear, plateRoom } from '../sets/ch04-s12-plate';

const ID = 'ch04-s14';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the study's numbers (script, fact-checked)
const LABELS = 20000;
const WRONG = 18820;
const ROWS = 20, COLS = 50;
const CELLS = ROWS * COLS; // 1,000
const PER = LABELS / CELLS; // 20 labels a cell
const RED = WRONG / PER; // 941
const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** a seeded shuffle of the 1,000 cells: the first 941 flip red (the scatter), the last 59 stay plain */
const ORDER: number[] = (() => {
  const a = Array.from({ length: CELLS }, (_, i) => i);
  for (let i = CELLS - 1; i > 0; i--) {
    const j = Math.floor(((hash1(i, 1409) + 1) / 2) * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();
const RANK: number[] = (() => {
  const r = new Array<number>(CELLS);
  ORDER.forEach((cell, k) => (r[cell] = k));
  return r;
})();

// ---------------------------------------------------------------- geometry (plate rest px)
const CARD = { x: 150, y: 86, w: 980, h: 452 };
const GRID = { x: 196, y: 214, w: 888, h: 296 };
const CW = GRID.w / COLS, CH = GRID.h / ROWS;
const RIB = { x0: 196, x1: 1084, y: 566 };
/** the program's steps along the ribbon and the rounding points among them (illustrative positions) */
const STEPS = 30;
const PINS: number[] = Array.from({ length: STEPS }, (_, i) => i).filter((i) => (hash1(i, 77) + 1) / 2 < 0.36 || i === 3 || i === 26);
const LINE_Y = 196;
/** the result line's baseline (screen-safe: above 0.88 H with the push) */
const FIX_Y = 602;
/** where each pin sits on the ribbon, and the grid columns it clears when it presses in (bands between pins) */
const ribX = (i: number) => lerp(RIB.x0 + 18, RIB.x1 - 18, i / (STEPS - 1));
const colOfX = (x: number) => Math.max(0, Math.min(COLS, Math.round((x - GRID.x) / CW)));
const BANDS: [number, number][] = PINS.map((i, k) => {
  const c0 = k === 0 ? 0 : colOfX((ribX(PINS[k - 1]) + ribX(i)) / 2);
  const c1 = k === PINS.length - 1 ? COLS : colOfX((ribX(i) + ribX(PINS[k + 1])) / 2);
  return [c0, c1];
});

interface Beats {
  slideIn: number;
  study: number;
  tried: number;
  twenty: number;
  nineteen: number;
  wrong: number;
  keep: number;
  points: number;
  every: number;
  back: number;
  aside: number;
  alone: number;
  /** when pin k presses in (and clears its band) */
  press: number[];
  /** the copper line and tag 6 come in during the hold */
  tag: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      slideIn: 2.8,
      study: T.beat('study'),
      tried: T.word('L0427', 'tried'),
      twenty: T.word('L0427', 'twenty'),
      nineteen: T.word('L0427', 'nineteen'),
      wrong: T.beat('wrong'),
      keep: T.beat('fixed'),
      points: T.word('L0428', 'points'),
      every: T.word('L0428', 'every'),
      back: T.word('L0428', 'back'),
      // review r1: the card holds still with the result for at least 1.2 s; the aside starts at line end + 0.6
      aside: T.line('L0428').end + 0.6,
      alone: T.word('L0428', 'alone'),
      press: [],
      tag: T.word('L0428', 'every') + 0.4,
    };
    // the presses run from just before 'alone' to just before 'every' (the last band clears as 'every' begins)
    const p0 = b.alone - 0.1, p1 = b.every - 0.2;
    b.press = PINS.map((_, k) => lerp(p0, p1, k / Math.max(1, PINS.length - 1)));
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    // the aside settles before the transition out begins (the cut lands on a still frame)
    const as = win(t, b.aside, Math.min(b.aside + 0.75, scene.D - 0.55));
    const hold = win(t, b.tag - 0.3, b.tag + 1.6);
    const cam: Camera3 = { ...CAMERA3_HOME, x: 640 + 10 * win(t, 0, 15) - 80 * hold, z: 34 * win(t, 0.5, 15.5) - 10 * hold };
    f.camera(cam);
    plateRoom(f, { key: ID });
    f.layer(PLATE_INK, (c, env) => {
      copperLine(c, env, t, tq, b, win(t, b.tag - 0.3, b.tag + 0.9));
      if (t >= b.slideIn) {
        c.save();
        // the study card (and its ribbon) slides onto the empty plate from 2.8 s, and aside after the hold
        const inX = (1 - sm(clamp01((t - b.slideIn) / 0.42)) ** 0.7) * 820;
        // only the card and its ribbon go aside, level (nothing crosses the result line below)
        c.translate(inX + 430 * as, -6 * as);
        studyCard(c, env, t, tq, b);
        ribbon(c, env, t, tq, b);
        c.restore();
      }
      // the result line stays put (in frame, above the safe band) while the card goes aside
      fixLabel(c, t, b);
    });
    plateNear(f, ID);
  },
});

// ---------------------------------------------------------------- the card, its header and the grid
function studyCard(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const { x, y, w, h } = CARD;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(-0.008);
  c.translate(-(x + w / 2), -(y + h / 2));
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x + 5, y + 7, w, h);
  c.fillStyle = mixLab('#fbf4e4', env.mood.core, 0.2);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha(INK, 0.7);
  c.lineWidth = 1.2;
  c.strokeRect(x, y, w, h);
  c.strokeStyle = withAlpha(INK, 0.25);
  c.beginPath();
  c.moveTo(x + 40, y + 116);
  c.lineTo(x + w - 40, y + 116);
  c.stroke();
  // the card arrives already dated (its first line is on it as it slides in: never a blank card)
  cardProbe(c, `${ID}/card`, x, y, w, h, 1, 1);
  // the brass pin at the top centre, driven in on 'September'
  const pin = win(tq, b.study - 0.25, b.study);
  if (pin > 0) {
    const s = lerp(1.8, 1, pin);
    c.save();
    c.globalAlpha *= pin;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
    c.beginPath();
    c.arc(x + w / 2 + 3 * s, y + 20 + 4 * s, 7 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab('#a07a3c', env.mood.halo, 0.25);
    c.beginPath();
    c.arc(x + w / 2, y + 20, 7 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#fff6e0', 0.6);
    c.beginPath();
    c.arc(x + w / 2 - 2, y + 18, 2.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // the header: date, then the finding term by term as the narration gives it
  const ink = (at: number) => win(t, at, at + 0.3);
  inkText(c, '13 Sept 2026', x + 44, y + 58, { size: 34, font: 'serif', alpha: 1, id: `${ID}/date`, color: mixLab(INK, COPPER_INK, 0.35 * win(t, b.study, b.study + 0.3) * (1 - win(t, b.study + 1.2, b.study + 2))) });
  inkSegments(c, [
    { text: 'float64 everywhere: ', a: ink(b.tried) },
    { text: commas(WRONG), a: ink(b.nineteen), color: mixLab(INK, PENCIL_MARK, 0.75) },
    { text: ` of ${commas(LABELS)} percent labels`, a: ink(b.twenty - 0.05) },
    { text: ' wrong', a: ink(b.wrong - 0.05), color: mixLab(INK, PENCIL_MARK, 0.75) },
  ], x + 44, y + 98, { size: 25, id: `${ID}/finding` });
  grid(c, env, t, tq, b);
  c.restore();
}

/** row r of the grid inks in as the narration counts the labels */
const rowAt = (r: number, b: Beats) => b.twenty - 0.15 + r * ((b.nineteen + 0.4 - b.twenty) / ROWS);
/** cell i flips red (the first 941 of the shuffle) in a scattered rush around 'wrong' */
const flipAt = (i: number, b: Beats) => b.wrong - 0.2 + (RANK[i] / RED) * 0.9;
/** and clears when the copper pin above its column band presses in */
const BAND_OF: number[] = Array.from({ length: COLS }, (_, col) => Math.max(0, BANDS.findIndex(([c0, c1]) => col >= c0 && col < c1)));
const clearAt = (i: number, b: Beats) => b.press[BAND_OF[i % COLS]] + 0.06 + Math.floor(i / COLS) * 0.006;
function grid(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const red = mixLab(PENCIL_MARK, env.mood.ink, 0.1);
  for (let r = 0; r < ROWS; r++) {
    const ra = win(tq, rowAt(r, b), rowAt(r, b) + 0.25);
    if (ra <= 0) continue;
    for (let k = 0; k < COLS; k++) {
      const i = r * COLS + k;
      const x = GRID.x + k * CW, y = GRID.y + r * CH;
      const isRed = RANK[i] < RED && tq >= flipAt(i, b) && tq < clearAt(i, b);
      // the label: a tiny paper chip carrying a '%' (two dots and a slash, about 6 px on screen)
      c.fillStyle = withAlpha(isRed ? mixLab('#f3d9cc', red, 0.18) : '#f1e6cc', ra);
      c.fillRect(x + 1, y + 1, CW - 2, CH - 2);
      const gx = x + CW / 2, gy = y + CH / 2;
      c.strokeStyle = withAlpha(INK, 0.8 * ra);
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(gx + 3.4, gy - 5);
      c.lineTo(gx - 3.4, gy + 5);
      c.stroke();
      c.fillStyle = withAlpha(INK, 0.8 * ra);
      c.beginPath();
      c.arc(gx - 3, gy - 3.4, 1.7, 0, Math.PI * 2);
      c.arc(gx + 3, gy + 3.4, 1.7, 0, Math.PI * 2);
      c.fill();
      if (isRed) {
        // the red-pencil strike over the label
        c.strokeStyle = withAlpha(red, 0.95);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x + 1.5, y + CH - 2);
        c.lineTo(x + CW - 1.5, y + 2);
        c.moveTo(x + 2, y + CH / 2 + 1);
        c.lineTo(x + CW - 2, y + CH / 2 - 1);
        c.stroke();
      }
    }
  }
  // the cause made visible: as each pin presses in, a copper flash runs up through the band it clears
  BANDS.forEach(([c0, c1], k) => {
    const at = b.press[k];
    const u = clamp01((t - at) / 0.5);
    if (t < at || u >= 1) return;
    const a = Math.sin(Math.PI * u) * 0.55;
    const x0 = GRID.x + c0 * CW, x1 = GRID.x + c1 * CW;
    const g = c.createLinearGradient(0, RIB.y, 0, GRID.y);
    g.addColorStop(0, withAlpha(copperOf(env, 0.8), a));
    g.addColorStop(1, withAlpha(copperOf(env, 0.8), a * 0.25));
    c.fillStyle = g;
    c.fillRect(x0, GRID.y, x1 - x0, RIB.y - GRID.y);
  });
}

// ---------------------------------------------------------------- the ribbon of steps and its copper pins
function ribbon(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const a = win(t, b.keep - 0.35, b.keep + 0.1);
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  // the ribbon: a long paper strip with the program's steps as ink dots
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(RIB.x0 + 3, RIB.y - 8 + 3, RIB.x1 - RIB.x0, 18);
  c.fillStyle = mixLab('#f6ecd6', env.mood.core, 0.15);
  c.fillRect(RIB.x0, RIB.y - 8, RIB.x1 - RIB.x0, 18);
  c.strokeStyle = withAlpha(INK, 0.6);
  c.lineWidth = 1;
  c.strokeRect(RIB.x0, RIB.y - 8, RIB.x1 - RIB.x0, 18);
  const sx = ribX;
  c.fillStyle = INK;
  for (let i = 0; i < STEPS; i++) {
    c.beginPath();
    c.arc(sx(i), RIB.y + 1, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // copper pins at the rounding points only, one by one from 'Keep' to 'points'
  const span = Math.max(0.6, b.points + 0.3 - b.keep);
  PINS.forEach((i, k) => {
    const at = b.keep + 0.15 + (k / Math.max(1, PINS.length - 1)) * span;
    const u = win(tq, at - 0.12, at);
    if (u <= 0) return;
    const x = sx(i), y = RIB.y + 1;
    // the press (from 'alone'): the pin drives down into the ribbon with a copper flare
    const pr = b.press[k];
    const pu = tq >= pr ? clamp01((tq - pr) / 0.16) : 0;
    const s = lerp(1.7, 1, u) * (1 - 0.28 * pu);
    c.save();
    c.globalAlpha *= u;
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 5 * s, y - 16 * s);
    c.stroke();
    c.fillStyle = copperOf(env, 0.5 + 0.4 * Math.max(1 - win(tq, at, at + 0.4), pu * (1 - win(tq, pr + 0.2, pr + 0.6))));
    c.beginPath();
    c.arc(x - 5 * s, y - 16 * s, 5.2 * s, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });
}

/** the second finding, under the ribbon: 'FP32 order at rounding points only: 0 wrong' */
function fixLabel(c: C, t: number, b: Beats) {
  const ink = (at: number) => win(t, at, at + 0.3);
  if (ink(b.keep + 0.15) <= 0) return;
  inkSegments(c, [
    { text: 'FP32 order at rounding points only:', a: ink(b.keep + 0.15) },
    // review r1: inked by 'every' (as the last band clears)
    { text: ' 0 wrong', a: ink(b.every - 0.32), color: mixLab(INK, COPPER_INK, 0.8) },
  ], 640, FIX_Y, { size: 26, align: 'center', id: `${ID}/fix` });
}

// ---------------------------------------------------------------- the hold: tag 6 waits on the copper line
function copperLine(c: C, env: PaintEnv, t: number, tq: number, b: Beats, as: number) {
  if (as <= 0) return;
  c.save();
  c.globalAlpha *= as;
  // the copper line, drawn in along the plate's left margin (toward the workbench), left of the card
  const x0 = -260, x1 = lerp(-260, 140, as);
  c.strokeStyle = copperOf(env, 0.35);
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(x0, LINE_Y);
  c.quadraticCurveTo((x0 + x1) / 2, LINE_Y + 8, x1, LINE_Y);
  c.stroke();
  // tag 6 hangs on it, its small print 'For an integer a' showing
  if (as > 0.35) {
    c.save();
    c.globalAlpha *= win(as, 0.35, 0.8);
    drawTag(c, env, { id: '6', ink: 1, knotIn: 1, flip: 0, swing: 0.05, phase: 1.3, scale: 1.25 }, { at: { x: 78, y: LINE_Y + 30 }, knotAt: { x: 78, y: LINE_Y + 6 }, tq });
    c.restore();
  }
  c.restore();
  void t;
  void b;
}
