/**
 * ch04-s01 — The Cold Case opens: the XOR puzzle on a parchment plate (paper wipe in from the board; tint
 * candleAmber → labGreen under the wipe, 0.7 s, no dip). HEAD-HOLD 0–3.1 s: a slow push in on the plate while the
 * lab tube warms up after the board's candlelight; the camera then locks on the plate for the lesson.
 *
 * TEACHES exclusive-or, and why one straight cut can never separate it, every mark bound to the real thing:
 *   indexTab (0.6)        the manila CHAPTER INDEX TAB (title size, sets/ch03-s01-indexTab), typed 'The Cold Case', drops from the top-left, holds
 *                         2.5 s, slides back up. The board's book-shadow slides off the plate under the wipe.
 *   'exclusive-or'        the truth-table chip types in (top right): x₁ x₂ → lit?
 *   'Light up … on'       its 01 and 10 lanterns light ("one input is on")
 *   'both'                the 11 row is underscored and stays dark ("not both")
 *   'On a square'/'square' axes draw; four lanterns at the corners, (0,1) and (1,0) lit; label XOR (…);
 *                         date stamp 1969
 *   'opposite corners'    a dotted diagonal joins the two lit, opposite corners
 *   'straight'/'cut'      black paper scissors make ONE straight cut that sweeps through 220° and many positions
 *                         through the silent pause; the side it calls "lit" washes faintly; dashed rings mark
 *                         every lantern on the wrong side; the margin counter ('on the wrong side:') ticks
 *                         1, 2, 1, 2, 1 (counted for real, best labelling) and never drops below 1
 *   'Two'                 the scissors cut the two hidden units' real lines (XOR_221 W⁰, b⁰) in ~0.6 s: the
 *                         diagonal band between them washes in lamplight, holding exactly the two lit lanterns;
 *                         the counter ticks to 0 the moment the second cut closes
 *   'puzzle'              the empty square's ink axes fade in (no lanterns yet) under the index tab
 *   'hidden'              with both cuts still on the paper, each lantern slides a short dotted path to its true
 *                         hidden coordinates (0.9 s, ease.move; the two lit ones land on one point, ×2); THEN the
 *                         axis labels swap x₁/x₂ → h₁/h₂ (0.3 s, never both); the scissors cut the output unit's ONE
 *                         straight line, which now separates them (the lit wash comes only after the landing)
 *   'between'             the in-between row of cells: lamp-lit beads on a faint crease, pulsed once, settled to
 *                         0.35 by 'Nobody' and ≤ 0.12 by 21 s (no caption)
 *   'mainstream'          label: in Japan, Amari had a method
 *   'train'               the scissors lift off the plate and hang, unmoving, clear of the (1,1) lantern over empty
 *                         parchment: the cuts were drawn, not learned
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, LAYERS, defineShot, hash1, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { indexTabLg } from '../sets/ch03-s01-indexTab';
import { clamp01, dateStamp, mixCam, sm, tq12, win } from '../sets/ch04-s01-kit';
import { PLATE, singleCut, xorCase, type XorCaseState } from '../sets/ch04-s01-xor';

const ID = 'ch04-s01';
type C = CanvasRenderingContext2D;

// HEAD-HOLD (leadIn 1.6 s): the shot opens a little wider, on the plate pinned in front of the lab's dark green
// board, and pushes in (log dolly) while the fluorescent tube warms up; it lands on the locked teaching framing
// before the truth table types in on 'exclusive-or'. Three planes slide: the board (L3), the plate (L4), the
// inkwell, pen and closed book (L5).
const CAM0: Camera3 = { x: 652, y: 384, z: -130, lens: 1 };
const PUSH_END = 3.1;
const camAt = (t: number): Camera3 => (t >= PUSH_END ? CAMERA3_HOME : mixCam(CAM0, CAMERA3_HOME, easeIO(t / PUSH_END)));
const easeIO = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** the tube warming up after the board's candlelight: 0 → 1 over 0.4–2.2 s, with two seeded 1-frame stutters */
function tubeWarm(t: number): number {
  const fr = Math.floor(t * 24);
  if (fr === 14 || fr === 19) return 0.35;
  return sm((t - 0.4) / 1.8);
}
// the board and the plate's raised shadow are authored over the wider opening framing
const BOARD = overscan(LAYERS.L3, [CAM0, CAMERA3_HOME], 24);
const NEAR = overscan(LAYERS.L5, [CAM0, CAMERA3_HOME], 24);

interface Beats {
  D: number;
  puzzle: number;
  xor: number;
  light: number;
  both: number;
  on: number;
  square: number;
  opposite: number;
  straight: number;
  cut: number;
  sweepEnd: number;
  two: number;
  can: number;
  hidden: number;
  cells: number;
  between: number;
  answer: number;
  nobody: number;
  mainstream: number;
  train: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      D,
      puzzle: T.word('L0401', 'puzzle'),
      xor: T.word('L0401', 'exclusive-or'),
      light: T.word('L0401', 'Light'),
      both: T.word('L0401', 'both'),
      on: T.word('L0401', 'on#2'),
      square: T.beat('lanterns'),
      opposite: T.word('L0401', 'opposite'),
      straight: T.word('L0402', 'straight'),
      cut: T.beat('sweep'),
      sweepEnd: T.beat('two') - 0.12,
      two: T.beat('two'),
      can: T.word('L0403', 'can'),
      hidden: T.beat('hidden'),
      cells: T.word('L0403', 'cells'),
      between: T.word('L0403', 'between'),
      answer: T.word('L0403', 'answer'),
      nobody: T.word('L0403', 'Nobody'),
      mainstream: T.beat('amari'),
      train: T.beat('train'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as Beats;
    // tint under the paper wipe: the board's candleAmber settles into the lab's green (0.7 s, no dip)
    if (t < 0.7) f.setMood('labGreen', { from: 'candleAmber', u: sm(Math.max(0, t) / 0.7) });
    f.camera(camAt(t));
    f.backlight({ sunX: 640, sunY: 300, intensity: 0.4 });
    const warm = tubeWarm(t);

    const st = stateAt(t, tq, b);
    f.layer('L3', (c, env) => desk(f, c, env));
    f.layer('L4', (c, env) => {
      plateShadow(f, c, env);
      xorCase(c, st, env);
      bookShadow(c, env, t);
    });
    f.layer('L5', (c, env) => nearProps(f, c, env));
    // the lamp's mouth under the shade (upper-right corner, off the plate): a small warm source
    f.practical({ x: 1236, y: 70, kind: 'lamp', seed: 41, intensity: 0.5 * (0.4 + 0.6 * warm), radius: 46, layer: 'L5' });
    // a cool tube light from above the desk (labGreen), with the fluorescent dropout to 0.85 every ~9 s
    tubeLight(f, t, warm);
    if (warm < 1) unlit(f, 1 - warm);

    // ------------------------------------------------------------------ screen-locked type
    dateStamp(f.c, f.mood, t, b.square, b.cut - 0.4, '1969');
    // the film's recurring chapter tab at chapter-title size (as ch03's opener): the title's cap height is 29 px at
    // 1080p on an alphabetic baseline, comfortably over the 22 px floor; the tab drops at 0.6 s (under the wipe's
    // tail) and lifts at 3.6 s, as the truth table types in, so it never covers the lesson
    indexTabLg(f.c, { title: 'The Cold Case', at: 0.6, hold: 2.5, baseline: 58, cap: 29 }, { t, mood: f.mood });
  },
});

// ================================================================================================= state
function stateAt(t: number, tq: number, b: Beats): XorCaseState {
  // the sweep: the scissors arrive on 'straight', cut on 'cut', and sweep (on twos: paper moves on twos)
  // through the silence until just before 'Two'
  const sweepU = clamp01((tq - b.cut) / (b.sweepEnd - b.cut));
  const sweepA = win(t, b.straight - 0.1, b.straight + 0.25) * (1 - win(t, b.two - 0.2, b.two + 0.05));
  // the counter: ticks with the real count; a small bump on each change
  let tick = 0;
  if (sweepA > 0 && tq > b.cut) {
    const now = singleCut(sweepU).nWrong;
    // find how long ago the count last changed (scan back on twos, ≤ 0.25 s)
    for (let k = 1; k <= 3; k++) {
      const u2 = clamp01((tq - k / 12 - b.cut) / (b.sweepEnd - b.cut));
      if (singleCut(u2).nWrong !== now) {
        tick = 1 - (k - 1) / 3;
        break;
      }
    }
  }
  // 'Two': both hidden cuts are drawn in ~0.6 s from just before the word; the counter ticks to 0 the moment the
  // second cut closes
  const solveAt = b.two - 0.1;
  const solveEnd = b.two + 0.55;
  const solve = clamp01((tq - solveAt) / (solveEnd - solveAt));
  // 'hidden': with both cuts still on the paper, every lantern slides its dotted path into hidden space (0.9 s,
  // ease.move); THEN the axis labels swap x → h (0.3 s); the output cut follows on 'cells'/'between'
  const slideAt = b.hidden + 0.12;
  const slideU = clamp01((tq - slideAt) / 0.9);
  const swapAt = slideAt + 0.95;
  const swap = clamp01((t - swapAt) / 0.3);
  const outAt = Math.max(b.cells + 0.55, swapAt + 0.35);
  const outCut = clamp01((tq - outAt) / (b.answer + 0.2 - outAt));
  // the in-between cells: in and pulsed once on 'between', settled to 0.35 by 'Nobody', ≤ 0.12 by 21.0 s
  const cellsIn = win(t, b.between - 0.15, b.between + 0.1);
  const cellLevel = t < b.answer ? 1 : t < b.nobody ? 1 - 0.65 * win(t, b.answer, b.nobody) : 0.35 - 0.23 * win(t, b.nobody, 21.0);
  const pulseU = (t - (b.between - 0.15)) / 0.6;
  const cellPulse = pulseU > 0 && pulseU < 1 ? Math.sin(Math.PI * pulseU) : 0;
  return {
    // the empty table slip is pasted in on 'puzzle'; its rows type in on 'exclusive-or'
    chipFrame: win(t, b.puzzle - 0.15, b.puzzle + 0.45),
    chip: clamp01((t - (b.xor - 0.15)) / 1.6),
    chipMove: win(t, b.on - 0.35, b.on + 0.45),
    chipLit: win(t, b.light - 0.1, b.light + 0.5),
    chipBoth: win(t, b.both - 0.05, b.both + 0.45),
    reveal: clamp01((t - (b.on - 0.05)) / 1.5),
    axesEarly: win(t, b.puzzle - 0.1, b.puzzle + 0.7),
    diag: win(t, b.opposite - 0.1, b.opposite + 0.7) * (1 - win(t, b.straight - 0.4, b.straight + 0.1)),
    sweep: sweepU,
    sweepA,
    solve,
    fold: slideU,
    settle: swap,
    paths: win(t, slideAt - 0.15, slideAt + 0.1) * (1 - win(t, swapAt + 0.2, swapAt + 0.9)),
    outCut,
    crease: cellsIn * cellLevel,
    cellPulse,
    counterA: win(t, b.straight - 0.1, b.straight + 0.3),
    solvedCount: tq < solveEnd ? 1 : 0,
    lift: win(tq, b.train - 0.1, b.train + 0.5),
    labelXor: win(t, b.square - 0.05, b.square + 0.6),
    labelAmari: win(t, b.mainstream - 0.1, b.mainstream + 0.6),
    tick: Math.max(tick, tq >= solveEnd ? 1 - clamp01((tq - solveEnd) / 0.25) : 0),
  };
}

// ================================================================================================= the desk
/** the lab's dark green board behind the plate (cached, L3, authored over the opening's wider framing): a faint
 *  grain; the plate stands in the tube's pool of light */
function desk(f: Frame, c: C, env: PaintEnv) {
  const R = BOARD;
  f.cached(`${ID}/board2/${env.mood.id}`, R.w, R.h, (cc) => {
    cc.translate(-R.x, -R.y);
    const base = mixLab(env.mood.set, env.mood.fg, 0.55);
    cc.fillStyle = base;
    cc.fillRect(R.x, R.y, R.w, R.h);
    // faint grain streaks
    cc.strokeStyle = withAlpha(env.mood.setHaze, 0.12);
    cc.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const y = R.y + (i / 60) * R.h + hash1(i, 3) * 10;
      cc.beginPath();
      cc.moveTo(R.x, y);
      cc.bezierCurveTo(400, y + hash1(i, 4) * 8, 900, y - hash1(i, 5) * 8, R.x + R.w, y + hash1(i, 6) * 6);
      cc.stroke();
    }
    // the desk lamp's pool (the shade hangs off the upper right): brightest up there, the board falling away
    // to near-black at the lower left, so the plate reads lit by a practical rather than evenly emitting
    const g = cc.createRadialGradient(1150, 40, 60, 1050, 120, 1150);
    g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.45), 0.9));
    g.addColorStop(0.35, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.15), 0.45));
    g.addColorStop(0.7, withAlpha(env.mood.fg, 0.2));
    g.addColorStop(1, withAlpha(env.mood.fg, 0.7));
    cc.fillStyle = g;
    cc.fillRect(R.x, R.y, R.w, R.h);
  })(c, R.x, R.y);
}

/** the plate's soft drop shadow on the board (cached, L4 so it rides with the plate) */
function plateShadow(f: Frame, c: C, env: PaintEnv) {
  const pad = 40;
  f.cached(
    `${ID}/plateShadow/${env.mood.id}`,
    PLATE.w + pad * 2,
    PLATE.h + pad * 2,
    (cc) => {
      cc.fillStyle = withAlpha(env.mood.fg, 0.55);
      cc.fillRect(pad + 8, pad + 14, PLATE.w, PLATE.h);
    },
    { blur: 10 },
  )(c, PLATE.x - pad, PLATE.y - pad);
}

/** before the tube has warmed: the frame sits in the dim of the board's dying candlelight (screen-locked) */
function unlit(f: Frame, k: number) {
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  const g = c.createRadialGradient(640, 330, 120, 640, 360, 820);
  g.addColorStop(0, withAlpha(f.mood.fg, 0.38 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.62 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}

/** the board's closed-book shadow, carried through the paper wipe, slides off the plate to the right */
function bookShadow(c: C, env: PaintEnv, t: number) {
  const u = sm(t / 1.5);
  if (u >= 1) return;
  const x = 520 + u * 900;
  c.save();
  c.globalAlpha = 0.5 * (1 - u * 0.6);
  const g = c.createLinearGradient(x - 160, 0, x + 40, 0);
  g.addColorStop(0, withAlpha(env.mood.fg, 0));
  g.addColorStop(0.45, withAlpha(env.mood.fg, 0.9));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.95));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 160, -90);
  c.lineTo(1500, -90);
  c.lineTo(1500, 810);
  c.lineTo(x - 250, 810);
  c.closePath();
  c.fill();
  c.restore();
}

/** near-plane (L5, heavily blurred): a cut-glass inkwell and dip pen overlapping the plate's lower-left corner and
 *  the dark desk edge running out of frame; the closed PERCEPTRONS book's corner at lower right, its cloth
 *  spine catching a sliver of light (the book of the previous shot) */
function nearProps(f: Frame, c: C, env: PaintEnv) {
  const R = NEAR;
  const B = R.y + R.h + 10;
  const RX = R.x + R.w + 10;
  f.cached(
    `${ID}/near4/${env.mood.id}`,
    R.w,
    R.h,
    (cc) => {
      cc.translate(-R.x, -R.y);
      const ink = env.fill('fg');
      cc.fillStyle = ink;
      // the desk's near edge: a dark band low across the lower-left, out of focus
      cc.beginPath();
      cc.moveTo(R.x - 10, 664);
      cc.quadraticCurveTo(220, 690, 470, B);
      cc.lineTo(R.x - 10, B);
      cc.closePath();
      cc.fill();
      // inkwell: a squat cut-glass well with a collar, over the plate's corner
      cc.beginPath();
      cc.moveTo(88, B);
      cc.lineTo(104, 640);
      cc.quadraticCurveTo(170, 612, 236, 640);
      cc.lineTo(252, B);
      cc.closePath();
      cc.fill();
      cc.fillRect(140, 596, 60, 30);
      cc.beginPath();
      cc.ellipse(170, 596, 34, 9, 0, 0, Math.PI * 2);
      cc.fill();
      // the dip pen resting in it, leaning right
      cc.save();
      cc.translate(178, 600);
      cc.rotate(0.5);
      cc.fillRect(-4, -190, 8, 190);
      cc.beginPath();
      cc.moveTo(-4, -190);
      cc.lineTo(0, -222);
      cc.lineTo(4, -190);
      cc.fill();
      cc.restore();
      // a cool tube-light sliver on the glass shoulder
      cc.strokeStyle = withAlpha(env.mood.rim, 0.45);
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(112, 648);
      cc.quadraticCurveTo(170, 624, 228, 648);
      cc.stroke();
      // the closed book, lower right: board + page block + spine edge
      cc.fillStyle = ink;
      cc.beginPath();
      cc.moveTo(1050, B);
      cc.lineTo(1132, 640);
      cc.lineTo(RX, 622);
      cc.lineTo(RX, B);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.3);
      cc.lineWidth = 1.4;
      cc.beginPath();
      cc.moveTo(1134, 646);
      cc.lineTo(RX, 628);
      cc.stroke();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
      for (let i = 1; i <= 4; i++) {
        cc.beginPath();
        cc.moveTo(1134 - i * 4, 646 + i * 7);
        cc.lineTo(RX, 628 + i * 7);
        cc.stroke();
      }
      // the desk lamp's green-glass shade hanging into the upper-right corner (its arm runs out of frame): a
      // dark bell with its lit lower lip, the source of the pool on the plate
      cc.fillStyle = ink;
      cc.beginPath();
      cc.moveTo(1150, R.y - 10);
      cc.lineTo(1166, 6);
      cc.quadraticCurveTo(1176, 40, 1150, 58);
      cc.quadraticCurveTo(1230, 76, RX, 70);
      cc.lineTo(RX, R.y - 10);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.halo, 0.85);
      cc.lineWidth = 4;
      cc.beginPath();
      cc.moveTo(1156, 60);
      cc.quadraticCurveTo(1232, 78, RX, 72);
      cc.stroke();
    },
    { blur: 7 },
  )(c, R.x, R.y);
}

/** the fluorescent tube's cool wash from above (screen-locked, additive), with its seeded 1-frame dropouts */
function tubeLight(f: Frame, t: number, warm: number) {
  const c = f.c;
  const m = f.mood;
  const fr = Math.floor(t * 24);
  // a 1-frame dip to 0.85 roughly every 6–14 s (seeded, deterministic)
  let k = 1;
  const slot = Math.floor(t / 7);
  const dipAt = Math.floor((slot * 7 + 2 + hash1(slot, 404) * 4) * 24);
  if (fr === dipAt) k = 0.85;
  k *= warm;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, withAlpha(mixLab(m.halo, m.rim, 0.4), 0.07 * k));
  g.addColorStop(0.5, withAlpha(m.halo, 0.02 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}
