// A Law We Wrote
//
// User Effort — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/user-effort/README.md:3 (the two jobs), 22-27 (the authored formula), 29 (clutter, motorContext in [0, 1]),
//     31 (feature formula deliberately matches the simulator), 33 (five parameters, three features, six operations,
//     three layers), 37 (720 training, 192 held-out, seeds 731 and 947), 54 (sd about 20.21 ms; deliberately favorable)
//   lab/user-effort/simulator.ts:4-7 (meanDurationMs), 9 (noiseHalfWidthMs = 35), 10-21 (training and held-out
//     levels), 23-29 (createRandom), 31-65 (createObservations: geometry, pointer (64, 288), noise)
//   lab/user-effort/domain.ts:30-39 (effortInput: distance to the target centre)
//   lab/user-effort/predictor.ts:9-11 (inputFeatures), 13-29 (createPredictor: the circuit), report.ts:24 (counters)
//   src/runtime/numeric-ui-core.ts:418-424 (roundAffine; multiply by a non-negative wire is one reglu)
//   lab/status.md:198 (no human observations)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every number on screen is computed below from the simulator's own formula, and every dot
// is a real observation: createObservations is ported line for line (same LCG, same draw order, seeds 731 and 947).
// The circuit's layer of each operation follows from numeric-ui-core: four multiplies read only sources (layer 1),
// p4 × interaction reads one of them (layer 2), the roundAffine sum reads those (layer 3).
import 'katex/dist/katex.min.css';
import { scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH = (px: number): number => px * 0.6; // mono advance

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// The simulator (simulator.ts:4-65), exact
// ---------------------------------------------------------------------------

const difficultyOf = (distance: number, targetWidth: number): number => Math.log2(1 + distance / targetWidth);
const TERM_COEF = [200, 110, 180, 80, 65];
/** the five terms of meanDurationMs, in source order */
const termsOf = (d: number, clutter: number, motor: number): number[] => [200, 110 * d, 180 * clutter, 80 * motor, 65 * motor * d];
const meanMs = (d: number, clutter: number, motor: number): number => termsOf(d, clutter, motor).reduce((a, b) => a + b, 0);
const NOISE_HALF = 35; // noiseHalfWidthMs
const NOISE_SD = NOISE_HALF / Math.sqrt(3); // uniform on ±35 → 20.207

const TRAIN_LEVELS = { distances: [60, 140, 280, 440, 600], widths: [24, 40, 64, 96], clutter: [0, 0.5, 1], contexts: [0, 0.5, 1] };
const HELD_LEVELS = { distances: [100, 220, 360, 520], widths: [32, 52, 80], clutter: [0.25, 0.75], contexts: [0.25, 0.75] };

type Obs = { d: number; clutter: number; motor: number; ms: number; mean: number };
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
function createObservations(levels: typeof TRAIN_LEVELS, seed: number): Obs[] {
  const random = createRandom(seed);
  const out: Obs[] = [];
  for (const distance of levels.distances)
    for (const width of levels.widths)
      for (const clutter of levels.clutter)
        for (const motor of levels.contexts)
          for (let rep = 0; rep < 4; rep++) {
            const task = Math.floor(random() * 3); // confirm | details | cancel
            const rotation = Math.floor(random() * 3); // shown layout
            // control centre: (64 + distance, 96 + ((task + rotation) % 3) * 192); pointer (64, 288)
            const dy = 96 + ((task + rotation) % 3) * 192 - 288;
            const d = difficultyOf(Math.hypot(distance, dy), width);
            const mean = meanMs(d, clutter, motor);
            out.push({ d, clutter, motor, mean, ms: mean + (random() * 2 - 1) * NOISE_HALF });
          }
  return out;
}
const TRAIN = createObservations(TRAIN_LEVELS, 731);
const HELD = createObservations(HELD_LEVELS, 947);
if (TRAIN.length !== 720 || HELD.length !== 192) throw new Error('observation counts drifted');

// the worked bench: near-wide vs far-narrow (horizontal row, so distance = horizontal offset)
const NEAR = { distance: 60, width: 96 };
const FAR = { distance: 600, width: 24 };
const D_NEAR = difficultyOf(NEAR.distance, NEAR.width); // 0.70
const D_FAR = difficultyOf(FAR.distance, FAR.width); // 4.70
const EX_CLUTTER = 0.5; // a training level
// the noise beat's line is the training cell clutter 0.5, motorContext 1: its 80 observations scatter around it
const SCATTER_IDX = TRAIN.map((o, i) => (o.clutter === EX_CLUTTER && o.motor === 1 ? i : -1)).filter((i) => i >= 0);
const SCATTER_RANK = new Map(SCATTER_IDX.map((i, r) => [i, r]));

// residual histogram of all 720 training observations, 5 ms bins over ±35
const BINS = 14;
const HIST = (() => {
  const h = new Array<number>(BINS).fill(0);
  for (const o of TRAIN) h[Math.min(BINS - 1, Math.floor((o.ms - o.mean + NOISE_HALF) / 5))]++;
  return h;
})();
const HIST_MAX = Math.max(...HIST);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the bench: one lab pixel = one stage pixel, lab x 0 at stage x 100; the row with the pointer (y 288)
const TY = 180;
const SX = (labX: number): number => 100 + labX;
const POINTER_X = SX(64);
const READ = { x: 940, y: 150 };
const CHIP_Y = 64;
const CHIP_XS = [100, 290, 480, 670];
const CHIP_W = 178;

// the plot: difficulty × duration
const X = scaleLinear([0, 5.2], [150, 700]);
const Y = scaleLinear([0, 1400], [590, 300]);
const Y_TICKS = [0, 200, 400, 600, 800, 1000, 1200, 1400];
const BAR_W = 34;

// right column: the formula list, then the noise inset, then the level table
const LIST = { x: 800, head: 318, row0: 352, step: 32, valX: 1225 };
const TERM_LABEL = ['200', '110·difficulty', '180·clutter', '80·motorContext', '65·motorContext·difficulty'];
const TERM_COLOR = [colors.MUTED, colors.SECONDARY, colors.TEAL, colors.POSITIVE, colors.WARM];
const INSET = { x0: 820, x1: 1210, base: 500 };
const RX = scaleLinear([-NOISE_HALF, NOISE_HALF], [INSET.x0, INSET.x1]);
const TABLE = { label: 800, train: 905, held: 1075, head: 330, row0: 366, step: 32 };
const TABLE_ROWS: Array<{ name: string; train: number[]; held: number[] }> = [
  { name: 'distance', train: TRAIN_LEVELS.distances, held: HELD_LEVELS.distances },
  { name: 'width', train: TRAIN_LEVELS.widths, held: HELD_LEVELS.widths },
  { name: 'clutter', train: TRAIN_LEVELS.clutter, held: HELD_LEVELS.clutter },
  { name: 'context', train: TRAIN_LEVELS.contexts, held: HELD_LEVELS.contexts },
];
const count = (l: typeof TRAIN_LEVELS) => [l.distances.length, l.widths.length, l.clutter.length, l.contexts.length];
const TRAIN_PRODUCT = `${count(TRAIN_LEVELS).join('·')} × 4 = ${TRAIN.length}`;
const HELD_PRODUCT = `${count(HELD_LEVELS).join('·')} × 4 = ${HELD.length}`;

// the circuit (predictor.ts:13-29): 5 parameters + 3 features = 8 sources
const SRC = { x: 130, w: 170, h: 30 };
const PARAM_Y = [190, 232, 274, 316, 358];
const FEAT = [
  { label: 'difficulty / 6', y: 440, color: colors.SECONDARY },
  { label: 'clutter', y: 482, color: colors.TEAL },
  { label: 'motorContext', y: 524, color: colors.POSITIVE },
];
const L = [540, 780, 1010];
const NODE = {
  m1: { x: L[0], y: 232 },
  m2: { x: L[0], y: 274 },
  m3: { x: L[0], y: 316 },
  mi: { x: L[0], y: 482 },
  m4: { x: L[1], y: 400 },
  sum: { x: L[2], y: 300 },
};
const OUT_X = 1100;
type Pt = { x: number; y: number };
const SRC_R = (y: number): Pt => ({ x: SRC.x + SRC.w, y });
/** gentle horizontal S-curve between two points */
const wirePath = (a: Pt, b: Pt): string => {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
};
type Wire = { a: Pt; b: Pt; color: string; group: 'l1a' | 'l1b' | 'l2' | 'l3' };
const R_NODE = 17;
const toward = (n: Pt, from: Pt, r = R_NODE): Pt => (from.x < n.x ? { x: n.x - r, y: n.y } : { x: n.x + r, y: n.y });
const WIRES: Wire[] = [
  // layer 1: the interaction, difficulty × motorContext
  { a: SRC_R(FEAT[0].y), b: toward(NODE.mi, SRC_R(0)), color: colors.SECONDARY, group: 'l1a' },
  { a: SRC_R(FEAT[2].y), b: toward(NODE.mi, SRC_R(0)), color: colors.POSITIVE, group: 'l1a' },
  // layer 1: p1·d, p2·c, p3·m
  { a: SRC_R(PARAM_Y[1]), b: toward(NODE.m1, SRC_R(0)), color: colors.SECONDARY, group: 'l1b' },
  { a: SRC_R(FEAT[0].y), b: toward(NODE.m1, SRC_R(0)), color: colors.SECONDARY, group: 'l1b' },
  { a: SRC_R(PARAM_Y[2]), b: toward(NODE.m2, SRC_R(0)), color: colors.TEAL, group: 'l1b' },
  { a: SRC_R(FEAT[1].y), b: toward(NODE.m2, SRC_R(0)), color: colors.TEAL, group: 'l1b' },
  { a: SRC_R(PARAM_Y[3]), b: toward(NODE.m3, SRC_R(0)), color: colors.POSITIVE, group: 'l1b' },
  { a: SRC_R(FEAT[2].y), b: toward(NODE.m3, SRC_R(0)), color: colors.POSITIVE, group: 'l1b' },
  // layer 2: p4 × interaction
  { a: SRC_R(PARAM_Y[4]), b: toward(NODE.m4, SRC_R(0)), color: colors.WARM, group: 'l2' },
  { a: { x: NODE.mi.x + R_NODE, y: NODE.mi.y }, b: toward(NODE.m4, SRC_R(0)), color: colors.WARM, group: 'l2' },
  // layer 3: roundAffine over p0 and the four products
  { a: SRC_R(PARAM_Y[0]), b: { x: NODE.sum.x - 22, y: NODE.sum.y - 8 }, color: colors.MUTED, group: 'l3' },
  ...[NODE.m1, NODE.m2, NODE.m3, NODE.m4].map((n, i) => ({
    a: { x: n.x + R_NODE, y: n.y },
    b: { x: NODE.sum.x - 22, y: NODE.sum.y - 4 + i * 4 },
    color: TERM_COLOR[i + 1],
    group: 'l3' as const,
  })),
];
/** where each of the five summed terms lives in the graph (p0 is the source chip itself) */
const TERM_NODE: Pt[] = [{ x: SRC.x + SRC.w / 2, y: PARAM_Y[0] }, NODE.m1, NODE.m2, NODE.m3, NODE.m4];
const CIRC_LABEL = ['p0', 'p1·(difficulty/6)', 'p2·clutter', 'p3·motorContext', 'p4·(difficulty/6)·motorContext'];

// the payoff rows: simulator terms over circuit terms, column by column
const ROW = { fy: 212, cy: 318, h: 32, gap: 40, font: 15 };
const COLS = (() => {
  const w = TERM_LABEL.map((t, i) => Math.max(t.length, CIRC_LABEL[i].length) * CH(ROW.font) + 26);
  const total = w.reduce((a, b) => a + b, 0) + ROW.gap * 4;
  let x = (STAGE_W - total) / 2;
  return w.map((wi) => {
    const c = { cx: x + wi / 2, w: wi };
    x += wi + ROW.gap;
    return c;
  });
})();
const ROW_LEFT = COLS[0].cx - COLS[0].w / 2;
const CODE_FEATURES = 'Float32Array.of(log2(1+d/w)/6, clutter, motorContext)';
const CODE_MULTIPLY = 'circuit.multiply(difficulty, motorContext)';

const CAM_TRACK: CameraState = { x: 640, y: 190, k: 1.15 };
const CAM_NOISE: CameraState = { x: 470, y: 445, k: 1.45 };
const CAM_CIRCUIT: CameraState = { x: 450, y: 350, k: 1.25 };
const HOME: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions; each runs at ~150 words per minute, then a short hold
// ---------------------------------------------------------------------------

const speak = (text: string): number => Math.round((text.split(/\s+/).length / 2.5 + 0.4) * 10) / 10;
const GAP = 0.6;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TRACK, cameraInterp);
  // B1 bench
  const trackU = tl.channel('trackU', 0);
  const trackOp = tl.channel('trackOp', 1);
  const targetU = tl.channel('targetU', 0);
  const probe = tl.channel('probe', 0);
  const cursor = tl.channel('cursor', 0);
  const ripple = tl.channel('ripple', 0);
  const readU = tl.channel('readU', 0);
  // B2 inputs
  const chipsU = tl.channel('chipsU', 0);
  const chipsOp = tl.channel('chipsOp', 1);
  const focus = tl.channel('chipFocus', 0);
  const focusOn = tl.channel('chipFocusOn', 0);
  const distU = tl.channel('distU', 0);
  const widthU = tl.channel('widthU', 0);
  const clutterV = tl.channel('clutter', 0);
  const motorV = tl.channel('motorContext', 0);
  // B3 difficulty
  const axisU = tl.channel('axisU', 0);
  const foldU = tl.channel('foldU', 0);
  const farDrop = tl.channel('farDrop', 0);
  const nearDrop = tl.channel('nearDrop', 0);
  const markOp = tl.channel('markOp', 1);
  // B4/B5 the mean
  const yAxisU = tl.channel('yAxisU', 0);
  const rows = tl.channel('termRows', 0);
  const listOp = tl.channel('listOp', 1);
  const lineU = tl.channel('lineU', 0);
  const barOp = tl.channel('barOp', 1);
  const wedgeU = tl.channel('wedgeU', 0);
  const glow = tl.channel('interactionGlow', 0);
  // B6 noise
  const bandU = tl.channel('bandU', 0);
  const scatterU = tl.channel('scatterU', 0);
  const insetU = tl.channel('insetU', 0);
  const histU = tl.channel('histU', 0);
  const sdU = tl.channel('sdU', 0);
  // B7/B8 the data
  const trainU = tl.channel('trainU', 0);
  const trainOp = tl.channel('trainOp', 1);
  const heldU = tl.channel('heldU', 0);
  const tableU = tl.channel('tableU', 0);
  const trainTot = tl.channel('trainTotal', 0);
  const heldCol = tl.channel('heldCol', 0);
  const heldTot = tl.channel('heldTotal', 0);
  const plotOp = tl.channel('plotOp', 1);
  // B9/B10 circuit
  const codeU = tl.channel('codeU', 0);
  const featU = tl.channel('featU', 0);
  const paramU = tl.channel('paramU', 0);
  const constU = tl.channel('constU', 0);
  const l1aU = tl.channel('l1aU', 0);
  const mulChip = tl.channel('mulChip', 0);
  const l1bU = tl.channel('l1bU', 0);
  const l2U = tl.channel('l2U', 0);
  const l3U = tl.channel('l3U', 0);
  const countU = tl.channel('countU', 0);
  const graphOp = tl.channel('graphOp', 1);
  // B11 payoff
  const collapse = tl.channel('collapse', 0);
  const linksU = tl.channel('linksU', 0);
  const panelU = tl.channel('panelU', 0);

  let t = 0.4;
  let b = t;
  const say = (text: string) => {
    b = t;
    const end = tl.caption({ at: t, dur: speak(text), text });
    t = tl.hold(end, GAP);
    return b;
  };

  // — B1 · the click bench: near and wide, then far and small —
  say('How long does it take to click a button? Close and wide is quick, far and small is slow. This lab asks whether a tiny circuit of weighted sums can learn that.');
  tl.tween(trackU, 1, { at: b + 0.1, dur: 1.2, ease: ease.draw });
  tl.tween(targetU, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(cursor, 1, { at: b + 1.6, dur: 0.9, ease: ease.move });
  tl.tween(ripple, 1, { at: b + 2.5, dur: 0.7, ease: ease.linear });
  tl.tween(readU, 1, { at: b + 2.6, dur: 0.6, ease: ease.enter });
  tl.set(cursor, 0, b + 5.0);
  tl.set(ripple, 0, b + 5.0);
  tl.tween(probe, 1, { at: b + 5.2, dur: 1.4, ease: ease.move });
  tl.tween(cursor, 1, { at: b + 6.9, dur: 1.2, ease: ease.move });
  tl.tween(ripple, 1, { at: b + 8.1, dur: 0.7, ease: ease.linear });

  // — B2 · the four inputs —
  say("First the lab writes the truth itself. A simulator takes the distance to a target, the target's width, a clutter number for the layout, and a motor-context number between zero and one.");
  tl.tween(readU, 0.15, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(chipsU, 1, { at: b + 1.6, dur: 1.0, ease: ease.enter });
  tl.tween(focusOn, 1, { at: b + 3.0, dur: 0.3, ease: ease.enter });
  tl.tween(chipsOp, 0.3, { at: b + 3.0, dur: 0.4, ease: ease.move });
  tl.tween(distU, 1, { at: b + 3.2, dur: 1.0, ease: ease.draw });
  tl.tween(focus, 1, { at: b + 5.2, dur: 0.4, ease: ease.move });
  tl.tween(widthU, 1, { at: b + 5.3, dur: 0.8, ease: ease.draw });
  tl.tween(focus, 2, { at: b + 7.0, dur: 0.4, ease: ease.move });
  tl.tween(focus, 3, { at: b + 9.0, dur: 0.4, ease: ease.move });
  tl.tween(focusOn, 0, { at: b + 11.6, dur: 0.4, ease: ease.move });
  tl.tween(chipsOp, 1, { at: b + 11.6, dur: 0.4, ease: ease.move });

  // — B3 · distance and width fold into difficulty —
  say('Distance and width fold into one difficulty: the base-two logarithm of one plus distance over width. Far and narrow gives a big number. Near and wide gives a small one.');
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(readU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(distU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(widthU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(chipsOp, 0.15, { at: b + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(foldU, 1, { at: b + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(axisU, 1, { at: b + 1.8, dur: 1.2, ease: ease.draw });
  tl.tween(farDrop, 1, { at: b + 5.6, dur: 1.2, ease: ease.move });
  tl.tween(nearDrop, 1, { at: b + 8.6, dur: 1.2, ease: ease.move });

  // — B4 · the mean, term by term —
  say('The mean duration starts at two hundred milliseconds, adds one hundred ten for each unit of difficulty, and adds one hundred eighty for each unit of clutter.');
  tl.tween(foldU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(markOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(trackOp, 0.12, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(yAxisU, 1, { at: b + 0.3, dur: 1.0, ease: ease.draw });
  tl.tween(rows, 1, { at: b + 0.9, dur: 0.8, ease: ease.move });
  tl.tween(rows, 2, { at: b + 3.2, dur: 0.9, ease: ease.move });
  tl.set(focus, 2, b + 6.0);
  tl.tween(focusOn, 1, { at: b + 6.0, dur: 0.3, ease: ease.enter });
  tl.tween(clutterV, EX_CLUTTER, { at: b + 6.2, dur: 0.6, ease: ease.move });
  tl.tween(rows, 3, { at: b + 6.3, dur: 0.9, ease: ease.move });
  tl.tween(focusOn, 0, { at: b + 8.0, dur: 0.4, ease: ease.move });
  tl.tween(lineU, 1, { at: b + 8.4, dur: 1.2, ease: ease.draw });

  // — B5 · motor context, and its interaction with difficulty —
  say('It adds eighty for motor context, plus sixty-five more for context times difficulty. So a hard target costs extra when the context number is high.');
  tl.tween(rows, 5, { at: b + 0.2, dur: 0.8, ease: ease.move });
  tl.set(focus, 3, b + 0.4);
  tl.tween(focusOn, 1, { at: b + 0.4, dur: 0.3, ease: ease.enter });
  tl.tween(motorV, 0.5, { at: b + 1.0, dur: 1.2, ease: ease.move });
  tl.tween(wedgeU, 1, { at: b + 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(glow, 1, { at: b + 5.0, dur: 0.5, ease: ease.enter });
  tl.tween(motorV, 1, { at: b + 5.4, dur: 1.6, ease: ease.move });
  tl.tween(focusOn, 0, { at: b + 9.4, dur: 0.4, ease: ease.move });

  // — B6 · noise —
  say('Then every observation gets random noise of up to thirty-five milliseconds either way. That noise alone has a standard deviation of about twenty point two one milliseconds.');
  tl.tween(cam, CAM_NOISE, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(glow, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(wedgeU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(barOp, 0.12, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(listOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(chipsOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(bandU, 1, { at: b + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(scatterU, 1, { at: b + 1.6, dur: 2.0, ease: ease.linear });
  tl.tween(cam, HOME, { at: b + 5.4, dur: 1.3, ease: ease.move });
  tl.tween(insetU, 1, { at: b + 6.0, dur: 0.6, ease: ease.enter });
  tl.tween(histU, 1, { at: b + 6.4, dur: 1.2, ease: ease.linear });
  tl.tween(sdU, 1, { at: b + 8.0, dur: 0.8, ease: ease.draw });

  // — B7 · 720 training observations —
  say('The lab draws seven hundred twenty training observations from one grid of distances, widths, clutter levels and context levels.');
  tl.tween(insetU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(bandU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(lineU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(barOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(trainU, 1, { at: b + 0.6, dur: 2.2, ease: ease.linear });
  tl.tween(tableU, 1, { at: b + 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(trainTot, 1, { at: b + 4.0, dur: 0.6, ease: ease.enter });

  // — B8 · 192 held-out at unseen values —
  say('It also draws a hundred ninety-two held-out observations at values training never used: other distances, other widths, other clutter, other contexts.');
  tl.tween(trainOp, 0.15, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(heldU, 1, { at: b + 0.6, dur: 1.8, ease: ease.linear });
  tl.tween(heldCol, 1, { at: b + 4.4, dur: 2.6, ease: ease.linear });
  tl.tween(heldTot, 1, { at: b + 7.2, dur: 0.6, ease: ease.enter });

  // — B9 · the learner's three features —
  say("Now the learner. It sees three features: difficulty divided by six, clutter, and motor context. It is never handed the formula's constants.");
  tl.tween(plotOp, 0, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(trackOp, 0, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_CIRCUIT, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(codeU, 1, { at: b + 0.9, dur: 0.6, ease: ease.enter });
  tl.tween(featU, 1, { at: b + 2.4, dur: 1.2, ease: ease.enter });
  tl.tween(paramU, 1, { at: b + 5.4, dur: 0.8, ease: ease.enter });
  tl.tween(constU, 1, { at: b + 6.3, dur: 0.6, ease: ease.enter });

  // — B10 · the circuit wires up —
  say('Its circuit multiplies difficulty by motor context once, then sums five weighted terms. In all, six operations in three layers, with five coefficients to learn.');
  tl.tween(constU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(cam, HOME, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(l1aU, 1, { at: b + 0.4, dur: 1.1, ease: ease.draw });
  tl.tween(mulChip, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(l1bU, 1, { at: b + 2.8, dur: 1.1, ease: ease.draw });
  tl.tween(l2U, 1, { at: b + 3.5, dur: 0.9, ease: ease.draw });
  tl.tween(l3U, 1, { at: b + 4.2, dur: 1.2, ease: ease.draw });
  tl.tween(countU, 1, { at: b + 6.4, dur: 0.6, ease: ease.enter });

  // — B11 · the circuit's terms are the simulator's terms —
  say("Notice what that means. The circuit's terms are the simulator's own terms. This lab tests fitting an authored law, and the README says the setting is deliberately favorable.");
  tl.tween(mulChip, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(countU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(codeU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(graphOp, 0.12, { at: b + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(collapse, 1, { at: b + 0.4, dur: 1.5, ease: ease.move });
  tl.tween(linksU, 1, { at: b + 2.2, dur: 1.4, ease: ease.linear });
  tl.tween(graphOp, 0, { at: b + 4.0, dur: 0.8, ease: ease.move });
  tl.tween(panelU, 1, { at: b + 5.4, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl, cam, trackU, trackOp, targetU, probe, cursor, ripple, readU,
    chipsU, chipsOp, focus, focusOn, distU, widthU, clutterV, motorV,
    axisU, foldU, farDrop, nearDrop, markOp,
    yAxisU, rows, listOp, lineU, barOp, wedgeU, glow,
    bandU, scatterU, insetU, histU, sdU,
    trainU, trainOp, heldU, tableU, trainTot, heldCol, heldTot, plotOp,
    codeU, featU, paramU, constU, l1aU, mulChip, l1bU, l2U, l3U, countU, graphOp,
    collapse, linksU, panelU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Small local pieces
// ---------------------------------------------------------------------------

function Chip({ x, y, w, h = 28, text, color = colors.TEXT, stroke = colors.GRID, size = 14, opacity = 1, anchor = 'start', glow = 0, fill = colors.PANEL }: {
  x: number; y: number; w: number; h?: number; text: string; color?: string; stroke?: string; size?: number; opacity?: number;
  anchor?: 'start' | 'middle'; glow?: number; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      {glow > 0.01 && <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={9} fill={colors.WARM} opacity={0.18 * glow} />}
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={anchor === 'start' ? x + 12 : x + w / 2} y={y + h / 2 + size * 0.36} textAnchor={anchor} fontSize={size} fontFamily={MONO} fill={color} xmlSpace="preserve">
        {text}
      </text>
    </g>
  );
}

/** a path drawn on by dash offset; `len` is a safe upper bound on its length */
function DrawPath({ d, u, color, width = 2, len = 900, opacity = 1 }: { d: string; u: number; color: string; width?: number; len?: number; opacity?: number }) {
  if (u <= 0.002 || opacity <= 0.005) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - clamp01(u))} opacity={opacity} />;
}

function OpNode({ x, y, glyph, color, u, r = R_NODE }: { x: number; y: number; glyph: string; color: string; u: number; r?: number }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u} transform={`translate(${x}, ${y}) scale(${lerp(0.6, 1, u)})`}>
      <circle r={r} fill={colors.PANEL} stroke={color} strokeWidth={2.5} />
      <text y={r > 18 ? 8 : 6} textAnchor="middle" fontSize={r > 18 ? 24 : 18} fontWeight={700} fill={color}>
        {glyph}
      </text>
    </g>
  );
}

const fmt0 = (v: number): string => String(Math.round(v));
const fmtLevel = (v: number): string => String(v);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- the bench
  const trackU = v(scene.trackU);
  const trackOp = v(scene.trackOp);
  const probe = v(scene.probe);
  const dist = lerp(NEAR.distance, FAR.distance, probe);
  const tw = lerp(NEAR.width, FAR.width, probe);
  const tcx = SX(64 + dist);
  const clutter = v(scene.clutterV);
  const motor = v(scene.motorV);
  const benchMs = meanMs(difficultyOf(dist, tw), clutter, motor);
  const cur = v(scene.cursor);
  const rip = v(scene.ripple);
  const focus = v(scene.focus);
  const focusOn = v(scene.focusOn);
  const chipsU = v(scene.chipsU);
  const chipsOp = v(scene.chipsOp);
  const chipVals = [`distance ${fmt0(dist)}`, `targetWidth ${fmt0(tw)}`, `clutter ${clutter.toFixed(2)}`, `motorContext ${motor.toFixed(2)}`];

  // ---- the plot
  const plotOp = v(scene.plotOp);
  const axisU = v(scene.axisU);
  const yAxisU = v(scene.yAxisU);
  const rows = v(scene.rows);
  const terms = termsOf(D_FAR, clutter, motor);
  const lineU = v(scene.lineU);
  const lineAt = (d: number) => meanMs(d, clutter, motor);
  const barOp = v(scene.barOp);
  const wedgeU = v(scene.wedgeU);
  const glow = v(scene.glow);
  const bandU = v(scene.bandU);
  const scatterU = v(scene.scatterU);
  const trainU = v(scene.trainU);
  const trainOp = v(scene.trainOp);
  const heldU = v(scene.heldU);
  const listOp = v(scene.listOp);
  const collapse = v(scene.collapse);

  // ---- circuit
  const graphOp = v(scene.graphOp);
  const l1aU = v(scene.l1aU);
  const l1bU = v(scene.l1bU);
  const l2U = v(scene.l2U);
  const l3U = v(scene.l3U);
  const groupU = { l1a: l1aU, l1b: l1bU, l2: l2U, l3: l3U };
  const featU = v(scene.featU);
  const paramU = v(scene.paramU);
  const countU = v(scene.countU);

  // the bar segments (stacked at difficulty 4.70)
  let acc = 0;
  const segs = terms.map((val, i) => {
    const h = val * clamp01(rows - i);
    const seg = { y0: Y(acc), y1: Y(acc + h), color: TERM_COLOR[i] };
    acc += h;
    return seg;
  });

  const linePts = (c: number, m: number) => `M ${X(0)} ${Y(meanMs(0, c, m))} L ${X(5.2)} ${Y(meanMs(5.2, c, m))}`;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B1–B2 · the bench (one lab pixel per stage pixel) ================= */}
        {trackOp > 0.005 && trackU > 0 && (
          <g opacity={trackOp}>
            <rect x={SX(0)} y={TY - 52} width={800} height={104} rx={8} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={trackU} />
            <line x1={POINTER_X} y1={TY} x2={lerp(POINTER_X, SX(790), trackU)} y2={TY} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="3 6" opacity={0.6} />
            <circle cx={POINTER_X} cy={TY} r={6} fill={colors.TEXT} opacity={trackU} />
            <circle cx={POINTER_X} cy={TY} r={12} fill="none" stroke={colors.TEXT} strokeWidth={1.2} opacity={0.5 * trackU} />
            <text x={POINTER_X} y={TY - 26} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={trackU}>
              pointer (64, 288)
            </text>
            {/* the near-wide target, ghosted once the target has moved */}
            {v(scene.nearDrop) > 0.005 && (
              <rect x={SX(64 + NEAR.distance) - NEAR.width / 2} y={TY - 16} width={NEAR.width} height={32} rx={4} fill={colors.ACCENT} fillOpacity={0.15} stroke={colors.ACCENT} strokeDasharray="4 4" opacity={v(scene.nearDrop) * v(scene.markOp)} />
            )}
            {/* the target */}
            <g opacity={v(scene.targetU)}>
              <rect x={tcx - tw / 2} y={TY - 16} width={tw} height={32} rx={4} fill={colors.ACCENT} fillOpacity={0.85} />
              {rip > 0 && rip < 1 && <circle cx={tcx} cy={TY} r={lerp(8, 46, rip)} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={1 - rip} />}
            </g>
            {/* the cursor travelling pointer → target centre */}
            {cur > 0.001 && cur < 0.999 && (
              <path
                d="M 0 0 L 0 18 L 5 13 L 9 21 L 12 20 L 8 12 L 14 12 Z"
                transform={`translate(${lerp(POINTER_X, tcx, cur)}, ${TY - 4})`}
                fill={colors.TEXT}
                stroke={colors.BG}
                strokeWidth={1.2}
              />
            )}
            {/* distance bracket and width brace */}
            {v(scene.distU) > 0.005 && (
              <g opacity={v(scene.distU)}>
                <line x1={POINTER_X} y1={TY + 32} x2={lerp(POINTER_X, tcx, v(scene.distU))} y2={TY + 32} stroke={colors.WARM} strokeWidth={2} />
                <line x1={POINTER_X} y1={TY + 25} x2={POINTER_X} y2={TY + 39} stroke={colors.WARM} strokeWidth={2} />
                <line x1={tcx} y1={TY + 25} x2={tcx} y2={TY + 39} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(v(scene.distU) * 3 - 2)} />
                <text x={(POINTER_X + tcx) / 2} y={TY + 58} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.WARM}>
                  distance (to the centre)
                </text>
              </g>
            )}
            {v(scene.widthU) > 0.005 && (
              <g opacity={v(scene.widthU)}>
                <path d={`M ${tcx - tw / 2} ${TY - 22} L ${tcx - tw / 2} ${TY - 28} L ${tcx + tw / 2} ${TY - 28} L ${tcx + tw / 2} ${TY - 22}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
                <text x={tcx} y={TY - 36} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.WARM}>
                  targetWidth
                </text>
              </g>
            )}
            {/* B3 drops: target → difficulty axis */}
            {[{ u: v(scene.farDrop), x: SX(64 + FAR.distance), d: D_FAR }, { u: v(scene.nearDrop), x: SX(64 + NEAR.distance), d: D_NEAR }].map(
              (m, i) =>
                m.u > 0.005 && (
                  <path key={i} d={`M ${m.x} ${TY + 18} C ${m.x} ${TY + 200}, ${X(m.d)} ${Y(0) - 200}, ${X(m.d)} ${Y(0) - 8}`} fill="none" stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.7 * clamp01(m.u * 2) * v(scene.markOp)} />
                ),
            )}
          </g>
        )}

        {/* readout */}
        {v(scene.readU) > 0.005 && (
          <g opacity={v(scene.readU)}>
            <text x={READ.x} y={READ.y} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              meanDurationMs
            </text>
            <text x={READ.x} y={READ.y + 46} fontSize={40} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              {fmt0(benchMs)} ms
            </text>
            <text x={READ.x} y={READ.y + 72} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              clutter 0 · motorContext 0
            </text>
          </g>
        )}

        {/* the four EffortInput chips */}
        {chipsU > 0.005 &&
          CHIP_XS.map((x, i) => {
            const u = staggerU(chipsU, i, 4, 0.15, 0.5);
            const f = focusOn * clamp01(1 - Math.abs(focus - i));
            const op = u * Math.max(chipsOp, f);
            return <Chip key={i} x={x} y={CHIP_Y - (1 - u) * 10} w={CHIP_W} text={chipVals[i]} color={i < 2 ? colors.TEXT : TERM_COLOR[i]} stroke={f > 0.5 ? colors.WARM : colors.GRID} opacity={op} glow={f} />;
          })}

        {/* ================= B3–B8 · the plot ================= */}
        {plotOp > 0.005 && (
          <g opacity={plotOp}>
            {/* difficulty axis */}
            {axisU > 0 && (
              <g>
                <line x1={X(0)} y1={Y(0)} x2={lerp(X(0), X(5.2), axisU)} y2={Y(0)} stroke={colors.MUTED} strokeWidth={2} />
                {[0, 1, 2, 3, 4, 5].map((d, i) => (
                  <g key={d} opacity={staggerU(axisU, i, 6, 0.08, 0.5)}>
                    <line x1={X(d)} y1={Y(0)} x2={X(d)} y2={Y(0) + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                    <text x={X(d)} y={Y(0) + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                      {d}
                    </text>
                  </g>
                ))}
                <text x={X(5.2) + 10} y={Y(0) + 5} fontSize={15} fill={colors.MUTED} opacity={axisU}>
                  difficulty
                </text>
              </g>
            )}
            {/* difficulty markers */}
            {[{ u: v(scene.farDrop), d: D_FAR, lbl: `600 / 24 → ${D_FAR.toFixed(2)}` }, { u: v(scene.nearDrop), d: D_NEAR, lbl: `60 / 96 → ${D_NEAR.toFixed(2)}` }].map(
              (m, i) =>
                m.u > 0.005 && (
                  <g key={i} opacity={clamp01(m.u * 2 - 1) * v(scene.markOp)}>
                    <circle cx={X(m.d)} cy={Y(0)} r={7} fill={colors.WARM} />
                    <text x={X(m.d)} y={Y(0) - 18} textAnchor="middle" fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>
                      {m.lbl}
                    </text>
                  </g>
                ),
            )}
            {/* the duration axis */}
            {yAxisU > 0 && (
              <g>
                <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={lerp(Y(0), Y(1400), yAxisU)} stroke={colors.MUTED} strokeWidth={2} />
                {Y_TICKS.map((ms, i) => (
                  <g key={ms} opacity={staggerU(yAxisU, i, Y_TICKS.length, 0.05, 0.4)}>
                    <line x1={X(0) - 6} y1={Y(ms)} x2={X(0)} y2={Y(ms)} stroke={colors.MUTED} strokeWidth={1.5} />
                    {ms > 0 && <line x1={X(0)} y1={Y(ms)} x2={X(5.2)} y2={Y(ms)} stroke={colors.GRID} strokeWidth={1} />}
                    <text x={X(0) - 11} y={Y(ms) + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                      {ms}
                    </text>
                  </g>
                ))}
                <text x={X(0)} y={Y(1400) - 14} textAnchor="middle" fontSize={15} fill={colors.MUTED} opacity={yAxisU}>
                  ms
                </text>
              </g>
            )}
            {/* B5 wedge: the extra a context costs, growing with difficulty */}
            {wedgeU > 0.005 && motor > 0.001 && (
              <path
                d={`M ${X(0)} ${Y(meanMs(0, clutter, 0))} L ${X(5.2)} ${Y(meanMs(5.2, clutter, 0))} L ${X(5.2)} ${Y(lineAt(5.2))} L ${X(0)} ${Y(lineAt(0))} Z`}
                fill={colors.WARM}
                opacity={0.14 * wedgeU}
              />
            )}
            {wedgeU > 0.005 && <path d={linePts(clutter, 0)} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="5 5" fill="none" opacity={0.7 * wedgeU} />}
            {/* B6 noise band */}
            {bandU > 0.005 && (
              <path
                d={`M ${X(0)} ${Y(lineAt(0) + NOISE_HALF)} L ${X(5.2)} ${Y(lineAt(5.2) + NOISE_HALF)} L ${X(5.2)} ${Y(lineAt(5.2) - NOISE_HALF)} L ${X(0)} ${Y(lineAt(0) - NOISE_HALF)} Z`}
                fill={colors.TEXT}
                opacity={0.16 * bandU}
                stroke={colors.TEXT}
                strokeOpacity={0.4 * bandU}
              />
            )}
            {bandU > 0.005 && (
              <text x={X(5.2) + 8} y={Y(lineAt(5.2)) + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={bandU}>
                ±35 ms
              </text>
            )}
            {/* the stacked bar */}
            {barOp > 0.005 && rows > 0 && (
              <g opacity={barOp}>
                {segs.map(
                  (sg, i) =>
                    sg.y0 - sg.y1 > 0.3 && (
                      <rect key={i} x={X(D_FAR) - BAR_W / 2} y={sg.y1} width={BAR_W} height={sg.y0 - sg.y1} fill={sg.color} fillOpacity={i === 4 ? lerp(0.85, 1, glow) : 0.85} stroke={colors.BG} strokeWidth={1} />
                    ),
                )}
                {glow > 0.01 && <rect x={X(D_FAR) - BAR_W / 2 - 4} y={segs[4].y1 - 4} width={BAR_W + 8} height={segs[4].y0 - segs[4].y1 + 8} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={glow} />}
              </g>
            )}
            {/* the mean line */}
            <DrawPath d={linePts(clutter, motor)} u={lineU} color={colors.TEXT} width={2.5} len={700} />
            {/* the observations */}
            {(trainU > 0 || scatterU > 0) &&
              TRAIN.map((o, i) => {
                const r = SCATTER_RANK.get(i);
                const su = r === undefined ? 0 : staggerU(scatterU, r, SCATTER_IDX.length, 0.02, 0.5);
                const tu = staggerU(trainU, i, TRAIN.length, 0.002, 0.4);
                const u = Math.max(su, tu);
                if (u <= 0.005) return null;
                const y = r !== undefined && tu < su ? lerp(o.mean, o.ms, su) : o.ms;
                return <circle key={i} cx={X(o.d)} cy={Y(y)} r={r !== undefined && tu < 1 ? 3 : 2.4} fill={colors.ACCENT} opacity={u * 0.85 * trainOp} />;
              })}
            {heldU > 0 &&
              HELD.map((o, i) => {
                const u = staggerU(heldU, i, HELD.length, 0.006, 0.4);
                if (u <= 0.005) return null;
                return <circle key={i} cx={X(o.d)} cy={Y(o.ms)} r={lerp(6, 3, u)} fill={colors.NEGATIVE} opacity={u * 0.95} />;
              })}
          </g>
        )}

        {/* B3 the fold */}
        <MathLabel tex={'\\mathrm{difficulty}=\\log_2\\!\\left(1+\\dfrac{\\mathrm{distance}}{\\mathrm{targetWidth}}\\right)'} x={1010} y={340} fontSize={24} boxWidth={460} opacity={v(scene.foldU)} />
        {v(scene.foldU) > 0.005 && (
          <text x={1010} y={430} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.foldU)}>
            Math.log2(1 + distance / targetWidth)
          </text>
        )}

        {/* B4–B5 the formula list (later: the top row of the payoff) */}
        {plotOp * listOp > 0.005 && rows > 0 && (
          <g opacity={plotOp * listOp}>
            <text x={LIST.x} y={LIST.head} fontSize={15} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              meanDurationMs at difficulty {D_FAR.toFixed(2)}
            </text>
            {TERM_LABEL.map((lbl, i) => {
              const u = clamp01(rows - i);
              if (u <= 0.005) return null;
              const y = LIST.row0 + i * LIST.step;
              const g = i === 4 ? glow : 0;
              return (
                <g key={i} opacity={u}>
                  {g > 0.01 && <rect x={LIST.x - 8} y={y - 19} width={LIST.valX - LIST.x + 16} height={28} rx={6} fill={colors.WARM} opacity={0.15 * g} />}
                  <rect x={LIST.x} y={y - 12} width={12} height={12} rx={2} fill={TERM_COLOR[i]} />
                  <text x={LIST.x + 22} y={y} fontSize={15} fontFamily={MONO} fill={i === 4 && g > 0.5 ? colors.WARM : colors.TEXT}>
                    {i === 0 ? '' : '+ '}
                    {lbl}
                  </text>
                  <text x={LIST.valX} y={y} textAnchor="end" fontSize={15} fontFamily={MONO} fill={TERM_COLOR[i] === colors.MUTED ? colors.TEXT : TERM_COLOR[i]}>
                    {fmt0(terms[i])}
                  </text>
                </g>
              );
            })}
            <line x1={LIST.x} y1={LIST.row0 + 5 * LIST.step - 18} x2={LIST.valX} y2={LIST.row0 + 5 * LIST.step - 18} stroke={colors.MUTED} strokeWidth={1} opacity={clamp01(rows)} />
            <text x={LIST.x} y={LIST.row0 + 5 * LIST.step + 4} fontSize={15} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(rows)}>
              clutter {clutter.toFixed(2)} · motorContext {motor.toFixed(2)}
            </text>
            <text x={LIST.valX} y={LIST.row0 + 5 * LIST.step + 4} textAnchor="end" fontSize={17} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} opacity={clamp01(rows)}>
              = {fmt0(terms.reduce((a, b2) => a + b2, 0))} ms
            </text>
          </g>
        )}

        {/* B6 the noise inset: residuals of all 720 training observations */}
        {v(scene.insetU) > 0.005 && (
          <g opacity={v(scene.insetU)}>
            <text x={INSET.x0} y={330} fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              noiseHalfWidthMs = 35
            </text>
            <text x={INSET.x0} y={354} fontSize={13} fill={colors.MUTED}>
              observed − mean, all 720 training observations
            </text>
            {HIST.map((n, i) => {
              const u = staggerU(v(scene.histU), i, BINS, 0.05, 0.4);
              const w = (INSET.x1 - INSET.x0) / BINS;
              const h = (n / HIST_MAX) * 100 * u;
              return <rect key={i} x={INSET.x0 + i * w + 2} y={INSET.base - h} width={w - 4} height={h} fill={colors.ACCENT} opacity={0.8} />;
            })}
            <line x1={INSET.x0} y1={INSET.base} x2={INSET.x1} y2={INSET.base} stroke={colors.MUTED} strokeWidth={1.5} />
            {[-35, 0, 35].map((r) => (
              <text key={r} x={RX(r)} y={INSET.base + 20} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                {r > 0 ? `+${r}` : r}
              </text>
            ))}
            {v(scene.sdU) > 0.005 && (
              <g opacity={clamp01(v(scene.sdU) * 2)}>
                <line x1={RX(0)} y1={INSET.base + 34} x2={lerp(RX(0), RX(NOISE_SD), v(scene.sdU))} y2={INSET.base + 34} stroke={colors.WARM} strokeWidth={2.5} />
                <line x1={RX(0)} y1={INSET.base + 34} x2={lerp(RX(0), RX(-NOISE_SD), v(scene.sdU))} y2={INSET.base + 34} stroke={colors.WARM} strokeWidth={2.5} />
                <line x1={RX(-NOISE_SD)} y1={INSET.base + 28} x2={RX(-NOISE_SD)} y2={INSET.base + 40} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(v(scene.sdU) * 3 - 2)} />
                <line x1={RX(NOISE_SD)} y1={INSET.base + 28} x2={RX(NOISE_SD)} y2={INSET.base + 40} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(v(scene.sdU) * 3 - 2)} />
              </g>
            )}
            <MathLabel tex={`\\sigma = 35/\\sqrt{3} \\approx ${NOISE_SD.toFixed(2)}\\ \\mathrm{ms}`} x={(INSET.x0 + INSET.x1) / 2} y={INSET.base + 62} fontSize={20} color={colors.WARM} boxWidth={400} opacity={clamp01(v(scene.sdU) * 2 - 1)} />
          </g>
        )}

        {/* B7–B8 the level table */}
        {plotOp * v(scene.tableU) > 0.005 && (
          <g opacity={plotOp * v(scene.tableU)} fontFamily={MONO}>
            <text x={TABLE.train} y={TABLE.head} fontSize={15} fontWeight={700} fill={colors.ACCENT}>
              training
            </text>
            <text x={TABLE.held} y={TABLE.head} fontSize={15} fontWeight={700} fill={colors.NEGATIVE} opacity={v(scene.heldU)}>
              held-out
            </text>
            {TABLE_ROWS.map((r, i) => {
              const y = TABLE.row0 + i * TABLE.step;
              return (
                <g key={r.name} opacity={staggerU(v(scene.tableU), i, 4, 0.12, 0.5)}>
                  <text x={TABLE.label} y={y} fontSize={14} fill={colors.MUTED}>
                    {r.name}
                  </text>
                  <text x={TABLE.train} y={y} fontSize={14} fill={colors.TEXT} opacity={lerp(1, 0.55, clamp01(v(scene.heldCol) * 2))}>
                    {r.train.map(fmtLevel).join(' ')}
                  </text>
                  <text x={TABLE.held} y={y} fontSize={14} fill={colors.NEGATIVE} opacity={staggerU(v(scene.heldCol), i, 4, 0.25, 0.25)}>
                    {r.held.map(fmtLevel).join(' ')}
                  </text>
                </g>
              );
            })}
            <text x={TABLE.label} y={TABLE.row0 + 4 * TABLE.step + 22} fontSize={15} fontWeight={700} fill={colors.ACCENT} opacity={v(scene.trainTot)}>
              {TRAIN_PRODUCT} training
            </text>
            <text x={TABLE.label} y={TABLE.row0 + 4 * TABLE.step + 52} fontSize={15} fontWeight={700} fill={colors.NEGATIVE} opacity={v(scene.heldTot)}>
              {HELD_PRODUCT} held-out
            </text>
          </g>
        )}

        {/* ================= B9–B10 · the circuit ================= */}
        {graphOp > 0.005 && (
          <g opacity={graphOp}>
            <Chip x={SRC.x - 10} y={108} w={CODE_FEATURES.length * CH(14) + 24} text={CODE_FEATURES} color={colors.TEXT} opacity={v(scene.codeU)} />
            {paramU > 0.005 && (
              <text x={SRC.x + SRC.w / 2} y={166} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={paramU}>
                8 sources
              </text>
            )}
            {['layer 1', 'layer 2', 'layer 3'].map((lbl, i) => (
              <text key={lbl} x={L[i]} y={166} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={[l1aU, l2U, l3U][i]}>
                {lbl}
              </text>
            ))}
            {/* wires */}
            {WIRES.map((w, i) => (
              <DrawPath key={i} d={wirePath(w.a, w.b)} u={groupU[w.group]} color={w.color} width={2} len={800} opacity={0.75} />
            ))}
            {l3U > 0.9 && <line x1={NODE.sum.x + 22} y1={NODE.sum.y} x2={OUT_X} y2={NODE.sum.y} stroke={colors.TEXT} strokeWidth={2} opacity={clamp01(l3U * 10 - 9)} />}
            {/* sources: three features, five parameters */}
            {FEAT.map((f, i) => {
              const u = staggerU(featU, i, 3, 0.25, 0.6);
              return <Chip key={f.label} x={SRC.x - (1 - u) * 60} y={f.y - SRC.h / 2} w={SRC.w} h={SRC.h} text={f.label} color={f.color} stroke={f.color} opacity={u} />;
            })}
            {PARAM_Y.map((y, i) => {
              const u = staggerU(paramU, i, 5, 0.1, 0.4);
              return (
                <g key={i}>
                  <Chip x={SRC.x} y={y - SRC.h / 2} w={SRC.w} h={SRC.h} text={`p${i} = ?`} color={TERM_COLOR[i]} stroke={colors.GRID} opacity={u} />
                  {v(scene.constU) > 0.005 && (
                    <text x={SRC.x + SRC.w + 12} y={y + 5} fontSize={14} fontFamily={MONO} fill={colors.MUTED} textDecoration="line-through" opacity={v(scene.constU) * 0.8}>
                      {TERM_COEF[i]}
                    </text>
                  )}
                </g>
              );
            })}
            {v(scene.constU) > 0.005 && (
              <text x={SRC.x + SRC.w + 12} y={PARAM_Y[4] + 36} fontSize={13} fill={colors.MUTED} opacity={v(scene.constU)}>
                constants not given
              </text>
            )}
            {/* operations */}
            <OpNode {...NODE.mi} glyph="×" color={colors.WARM} u={clamp01(l1aU * 2 - 1)} />
            <OpNode {...NODE.m1} glyph="×" color={colors.SECONDARY} u={clamp01(l1bU * 2 - 1)} />
            <OpNode {...NODE.m2} glyph="×" color={colors.TEAL} u={clamp01(l1bU * 2 - 1)} />
            <OpNode {...NODE.m3} glyph="×" color={colors.POSITIVE} u={clamp01(l1bU * 2 - 1)} />
            <OpNode {...NODE.m4} glyph="×" color={colors.WARM} u={clamp01(l2U * 2 - 1)} />
            <OpNode {...NODE.sum} glyph="Σ" color={colors.TEXT} r={22} u={clamp01(l3U * 2 - 1)} />
            {l3U > 0.5 && (
              <g opacity={clamp01(l3U * 2 - 1)}>
                <text x={NODE.sum.x} y={NODE.sum.y - 34} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  roundAffine · 5 terms
                </text>
                <text x={OUT_X + 8} y={NODE.sum.y + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  duration (s)
                </text>
              </g>
            )}
            <Chip x={NODE.mi.x - 40} y={NODE.mi.y + 30} w={CODE_MULTIPLY.length * CH(14) + 24} text={CODE_MULTIPLY} color={colors.WARM} stroke={colors.WARM} opacity={v(scene.mulChip)} />
            {countU > 0.005 && (
              <text x={640} y={600} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} opacity={countU}>
                sources 8 · operations 6 · layers 3
              </text>
            )}
          </g>
        )}

        {/* ================= B11 · the payoff: term over term ================= */}
        {collapse > 0.005 && (
          <g>
            <text x={ROW_LEFT} y={ROW.fy - 30} fontSize={14} fill={colors.MUTED} opacity={clamp01(collapse * 2 - 1)}>
              simulator · meanDurationMs (ms)
            </text>
            <text x={ROW_LEFT} y={ROW.cy + ROW.h + 26} fontSize={14} fill={colors.MUTED} opacity={clamp01(collapse * 2 - 1)}>
              predictor circuit · five learned coefficients (s, on difficulty / 6)
            </text>
            {COLS.map((c, i) => {
              const fromList = { x: LIST.x + 22 + (TERM_LABEL[i].length * CH(ROW.font)) / 2, y: LIST.row0 + i * LIST.step - 5 };
              const fx = lerp(fromList.x, c.cx, collapse);
              const fy = lerp(fromList.y, ROW.fy + ROW.h / 2, collapse);
              const n = TERM_NODE[i];
              const cx = lerp(n.x, c.cx, collapse);
              const cy = lerp(n.y, ROW.cy + ROW.h / 2, collapse);
              const w = lerp(40, c.w, collapse);
              const lu = staggerU(v(scene.linksU), i, 5, 0.15, 0.6);
              return (
                <g key={i}>
                  <Chip x={fx - c.w / 2} y={fy - ROW.h / 2} w={c.w} h={ROW.h} text={TERM_LABEL[i]} color={TERM_COLOR[i]} stroke={TERM_COLOR[i]} size={ROW.font} anchor="middle" opacity={collapse} />
                  <Chip x={cx - w / 2} y={cy - ROW.h / 2} w={w} h={ROW.h} text={CIRC_LABEL[i]} color={TERM_COLOR[i]} stroke={TERM_COLOR[i]} size={ROW.font} anchor="middle" opacity={clamp01(collapse * 1.6 - 0.6)} />
                  {lu > 0.005 && (
                    <g opacity={lu}>
                      <line x1={c.cx} y1={ROW.fy + ROW.h + 4} x2={c.cx} y2={lerp(ROW.fy + ROW.h + 4, ROW.cy - 4, lu)} stroke={TERM_COLOR[i]} strokeWidth={2.5} />
                      <circle cx={c.cx} cy={(ROW.fy + ROW.h + ROW.cy) / 2} r={11} fill={colors.BG} stroke={TERM_COLOR[i]} strokeWidth={2} opacity={clamp01(lu * 2 - 1)} />
                      <text x={c.cx} y={(ROW.fy + ROW.h + ROW.cy) / 2 + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={TERM_COLOR[i]} opacity={clamp01(lu * 2 - 1)}>
                        ≡
                      </text>
                    </g>
                  )}
                  {i > 0 &&
                    [ROW.fy, ROW.cy].map((ry) => (
                      <text key={ry} x={c.cx - c.w / 2 - ROW.gap / 2} y={ry + ROW.h / 2 + 6} textAnchor="middle" fontSize={18} fill={colors.MUTED} opacity={clamp01(collapse * 3 - 2)}>
                        +
                      </text>
                    ))}
                </g>
              );
            })}
            {v(scene.panelU) > 0.005 && (
              <g opacity={v(scene.panelU)} transform={`translate(0, ${(1 - v(scene.panelU)) * 12})`}>
                <rect x={250} y={438} width={780} height={118} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={640} y={486} textAnchor="middle" fontSize={26} fill={colors.TEXT}>
                  Fit to an authored law, not human behavior
                </text>
                <text x={640} y={526} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
                  README: “this deliberately favorable setting”
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={196} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · A Law We Wrote
      </text>
    </>
  );
}

export const vizScene = () => scene;
