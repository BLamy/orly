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
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      slideIn: 0,
      study: T.beat('study'),
      tried: T.word('L0427', 'tried'),
      twenty: T.word('L0427', 'twenty'),
      nineteen: T.word('L0427', 'nineteen'),
      wrong: T.beat('wrong'),
      keep: T.beat('fixed'),
      points: T.word('L0428', 'points'),
      every: T.word('L0428', 'every'),
      back: T.word('L0428', 'back'),
      aside: T.line('L0428').end + 0.05,
    };
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const as = win(t, b.aside, b.aside + 1.05);
    const cam: Camera3 = { ...CAMERA3_HOME, x: 640 + 10 * win(t, 0, 16) - 70 * as, z: 34 * win(t, 0.5, 16.5) - 20 * as };
    f.camera(cam);
    plateRoom(f, { key: ID });
    f.layer(PLATE_INK, (c, env) => {
      copperLine(c, env, t, tq, b, as);
      c.save();
      // the study card (and what belongs to it) slides in at the cut, and aside in the hold
      const inX = (1 - sm(clamp01((t - b.slideIn) / 0.7)) ** 0.8) * 760;
      c.translate(inX + 430 * as, 26 * as);
      c.rotate(0.03 * as);
      studyCard(c, env, t, tq, b);
      ribbon(c, env, t, tq, b);
      fixLabel(c, t, b);
      c.restore();
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
/** and clears in a left-to-right sweep from 'every' to 'back' */
const clearAt = (i: number, b: Beats) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  return lerp(b.every - 0.9, b.back - 0.1, col / (COLS - 1)) + row * 0.004;
};
function grid(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const red = mixLab(PENCIL_MARK, env.mood.ink, 0.1);
  for (let r = 0; r < ROWS; r++) {
    const ra = win(tq, rowAt(r, b), rowAt(r, b) + 0.25);
    if (ra <= 0) continue;
    for (let k = 0; k < COLS; k++) {
      const i = r * COLS + k;
      const x = GRID.x + k * CW, y = GRID.y + r * CH;
      const isRed = RANK[i] < RED && tq >= flipAt(i, b) && tq < clearAt(i, b);
      // the label: a tiny paper chip with its figure as a short ink stroke and a % hook (texture at this size)
      c.fillStyle = withAlpha(isRed ? mixLab('#f3d9cc', red, 0.18) : '#f1e6cc', ra);
      c.fillRect(x + 1.5, y + 2, CW - 3, CH - 4);
      c.fillStyle = withAlpha(INK, 0.55 * ra);
      c.fillRect(x + 4, y + CH / 2 - 0.8, CW * 0.38, 1.6);
      c.beginPath();
      c.arc(x + CW - 6, y + CH / 2, 1.6, 0, Math.PI * 2);
      c.fill();
      if (isRed) {
        // the red-pencil mark: a quick slash through the label
        c.strokeStyle = withAlpha(red, 0.95);
        c.lineWidth = 1.7;
        c.beginPath();
        c.moveTo(x + 2, y + CH - 2);
        c.lineTo(x + CW - 2, y + 2);
        c.stroke();
      }
    }
  }
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
  const sx = (i: number) => lerp(RIB.x0 + 18, RIB.x1 - 18, i / (STEPS - 1));
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
    const s = lerp(1.7, 1, u);
    c.save();
    c.globalAlpha *= u;
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 5 * s, y - 16 * s);
    c.stroke();
    c.fillStyle = copperOf(env, 0.5 + 0.4 * (1 - win(tq, at, at + 0.4)));
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
    { text: ' 0 wrong', a: ink(b.back - 0.1), color: mixLab(INK, COPPER_INK, 0.8) },
  ], 640, 618, { size: 25, align: 'center', id: `${ID}/fix` });
}

// ---------------------------------------------------------------- the hold: tag 6 waits on the copper line
function copperLine(c: C, env: PaintEnv, t: number, tq: number, b: Beats, as: number) {
  if (as <= 0) return;
  c.save();
  c.globalAlpha *= as;
  // the copper line, drawn in across the top left of the plate (toward the workbench)
  const x0 = -120, x1 = lerp(-120, 600, as);
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
    drawTag(c, env, { id: '6', ink: 1, knotIn: 1, flip: 0, swing: 0.05, phase: 1.3, scale: 1.25 }, { at: { x: 300, y: LINE_Y + 30 }, knotAt: { x: 300, y: LINE_Y + 6 }, tq });
    c.restore();
  }
  c.restore();
  void t;
  void b;
}
