// Fitting It, Then Testing It
//
// User Effort — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/user-effort/simulator.ts:4-7 (meanDurationMs, the authored formula), 9 (noiseHalfWidthMs = 35),
//     10-21 (training and held-out levels), 23-29 (createRandom), 31-67 (createObservations)
//   lab/user-effort/domain.ts:44-56 (effortInput: distance from the pointer to the target centre)
//   lab/user-effort/predictor.ts:4 (parameterNames), 9-11 (inputFeatures: difficulty / 6, clutter, context),
//     13-41 (createPredictor: the six operations), 43-74 (trainPredictor: full batch, Adam 0.9 / 0.999,
//     lr 0.04, eps 1e-8, 800 steps, losses[k] recorded before update k + 1), 76-85 (predictionErrors, RMSE)
//   lab/user-effort/report.ts:7-8 (seeds 731 / 947), 21 (initial / final pre-update MSE), 25 (parametersSeconds),
//     27-31 (heldOutNoisy, heldOutSimulatorMean, constantBaselineHeldOutMean), 33-41 (seeds 1731 / 2731 / 3731)
//   lab/user-effort/README.md:33 (six operations, three layers, 800 updates, lr 0.04), 37-41 (720 / 192, not tuned
//     on the test cases), 47-54 (the results table, noise sd ≈ 20.21), 70 (no human usability results)
//   src/runtime/numeric-ui-core.ts:418-433 (roundAffine, multiply), 649-660 (evaluateReference,
//     backpropagateReference)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every number on screen is recomputed at module scope by a port of the lab: the seeded
// observation generator, the five-coefficient forward pass in FP32 rounding, and the full-batch Adam loop. The port
// reproduces report.ts (params to 1e-7, held-out RMSE 1.68 / 20.22 / 133.94 ms, seeds 0.76 / 0.67 / 0.86), and the
// module throws if any displayed value drifts. Per the fact-check (review.md note 1), the loss markers are losses[9],
// losses[99] and losses[399] — the loss before the 10th, 100th and 400th update — labelled "step 10/100/400".
// The circuit strip's six boxes are the six operations in creation order; their layer grouping is from the README.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px

// ---------------------------------------------------------------------------
// The lab, ported (module scope, exact)
// ---------------------------------------------------------------------------

const f32 = Math.fround;
type Ex = { diff: number; d6: number; c: number; m: number; ms: number; mean: number };

/** simulator.ts:23-29 */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
/** simulator.ts:4-7 */
const meanDurationMs = (diff: number, c: number, m: number): number => 200 + 110 * diff + 180 * c + 80 * m + 65 * m * diff;

/** simulator.ts:31-67 with domain.ts effortInput folded in (pointer 64, 288; control centre). */
function createObservations(split: 'train' | 'held-out', seed: number): Ex[] {
  const L = split === 'train'
    ? { D: [60, 140, 280, 440, 600], W: [24, 40, 64, 96], C: [0, 0.5, 1], M: [0, 0.5, 1] }
    : { D: [100, 220, 360, 520], W: [32, 52, 80], C: [0.25, 0.75], M: [0.25, 0.75] };
  const random = createRandom(seed);
  const out: Ex[] = [];
  for (const distance of L.D) for (const width of L.W) for (const c of L.C) for (const m of L.M) {
    for (let rep = 0; rep < 4; rep++) {
      const task = Math.floor(random() * 3);
      const rotation = Math.floor(random() * 3);
      const cy = 96 + ((task + rotation) % 3) * 192;
      const diff = Math.log2(1 + Math.hypot(distance, cy - 288) / width);
      const mean = meanDurationMs(diff, c, m);
      const ms = mean + (random() * 2 - 1) * 35;
      out.push({ diff, d6: f32(diff / 6), c: f32(c), m: f32(m), ms, mean });
    }
  }
  return out;
}

/** The six operations (predictor.ts:22-29), FP32 rounding after each. Seconds. */
function forward(p: ArrayLike<number>, e: Ex): number {
  const inter = f32(e.d6 * e.m);
  return f32(f32(f32(f32(p[0] + f32(p[1] * e.d6)) + f32(p[2] * e.c)) + f32(p[3] * e.m)) + f32(p[4] * inter));
}

/** predictor.ts:43-74: full-batch Adam, 800 steps; snaps[k-1] = parameters after update k. */
function trainPredictor(examples: Ex[], epochs = 800) {
  const p = new Float32Array(5);
  const m1 = new Float64Array(5);
  const m2 = new Float64Array(5);
  const g = new Float64Array(5);
  const losses: number[] = [];
  const snaps = new Float32Array(epochs * 5);
  for (let epoch = 1; epoch <= epochs; epoch++) {
    g.fill(0);
    let loss = 0;
    for (const e of examples) {
      const err = f32(forward(p, e) - e.ms / 1000);
      loss += (err * err) / examples.length;
      const og = f32((2 * err) / examples.length);
      g[0] += og;
      g[1] += f32(og * e.d6);
      g[2] += f32(og * e.c);
      g[3] += f32(og * e.m);
      g[4] += f32(og * f32(e.d6 * e.m));
    }
    for (let i = 0; i < 5; i++) {
      m1[i] = 0.9 * m1[i] + 0.1 * g[i];
      m2[i] = 0.999 * m2[i] + 0.001 * g[i] * g[i];
      p[i] -= (0.04 * (m1[i] / (1 - 0.9 ** epoch))) / (Math.sqrt(m2[i] / (1 - 0.999 ** epoch)) + 1e-8);
    }
    losses.push(loss);
    snaps.set(p, (epoch - 1) * 5);
  }
  return { params: Array.from(p), losses, snaps };
}

const rmse = (xs: Ex[], pred: (e: Ex) => number, target: (e: Ex) => number): number =>
  Math.sqrt(xs.reduce((a, e) => a + (pred(e) - target(e)) ** 2, 0) / xs.length);

const TRAIN = createObservations('train', 731);
const HELD = createObservations('held-out', 947);
const FIT = trainPredictor(TRAIN);
const predMs = (p: ArrayLike<number>) => (e: Ex) => forward(p, e) * 1000;
const MEAN_TRAIN_MS = TRAIN.reduce((a, e) => a + e.ms, 0) / TRAIN.length;
const HELD_SIM = rmse(HELD, predMs(FIT.params), (e) => e.mean);
const HELD_NOISY = rmse(HELD, predMs(FIT.params), (e) => e.ms);
const CONST_BASE = rmse(HELD, () => MEAN_TRAIN_MS, (e) => e.mean);
const NOISE_SD = 35 / Math.sqrt(3);
const SEEDS = [1731, 2731, 3731].map((seed) => ({
  seed,
  err: rmse(HELD, predMs(trainPredictor(createObservations('train', seed)).params), (e) => e.mean),
}));

const STEPS = 800;
const LOSS_MARKS = [10, 100, 400].map((k) => ({ k, loss: FIT.losses[k - 1] }));
const AUTHORED = [200 / 1000, (110 * 6) / 1000, 180 / 1000, 80 / 1000, (65 * 6) / 1000];
const GAPS = FIT.params.map((v, i) => Math.abs(v - AUTHORED[i]));
const MAX_GAP = Math.max(...GAPS);

// Every number the narration speaks, checked against report.ts / the fact-check.
const CHECKS: [string, string][] = [
  [FIT.losses[0].toFixed(4), '0.5931'],
  [FIT.params.map((v) => v.toFixed(4)).join(' '), '0.1998 0.6640 0.1791 0.0753 0.3999'],
  [LOSS_MARKS.map((l) => l.loss.toPrecision(3)).join(' '), '0.0253 0.00105 0.000415'],
  [FIT.losses[STEPS - 1].toPrecision(3), '0.000412'],
  [HELD_SIM.toFixed(2), '1.68'],
  [HELD_NOISY.toFixed(2), '20.22'],
  [CONST_BASE.toFixed(2), '133.94'],
  [NOISE_SD.toFixed(2), '20.21'],
  [SEEDS.map((s) => s.err.toFixed(2)).join(' '), '0.76 0.67 0.86'],
  [`${TRAIN.length} ${HELD.length}`, '720 192'],
  [MAX_GAP.toFixed(4), '0.0099'],
];
CHECKS.forEach(([got, want]) => {
  if (got !== want) throw new Error(`user-effort ch2: expected ${want}, computed ${got}`);
});

/** Parameters after a fractional number of updates (0 → all zero). */
function paramsAt(step: number): number[] {
  const s = Math.max(0, Math.min(STEPS, step));
  const k0 = Math.floor(s);
  const u = s - k0;
  const at = (k: number, i: number) => (k <= 0 ? 0 : FIT.snaps[(k - 1) * 5 + i]);
  return [0, 1, 2, 3, 4].map((i) => lerp(at(k0, i), at(Math.min(STEPS, k0 + 1), i), u));
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; the header band is screen-space, y < 76)
// ---------------------------------------------------------------------------

// scatter: x = difficulty log2(1 + distance / width), y = duration (ms)
const SC = { x0: 110, x1: 610, y0: 555, y1: 190 };
const sx = (diff: number): number => SC.x0 + (diff / 5) * (SC.x1 - SC.x0);
const sy = (ms: number): number => SC.y0 - (Math.max(-40, Math.min(1480, ms)) / 1400) * (SC.y0 - SC.y1);
const SLICE = (e: Ex): boolean => e.c === 0.5 && e.m === 0.5; // the prediction line's slice

// circuit strip above the scatter: the six operations in creation order
const OPS = ['d × m', 'w₁ × d', 'w₂ × c', 'w₃ × m', 'w₄ × dm', 'Σ + w₀'];
const OP_W = 70;
const OP_Y = 110;
const OP_H = 26;
const opX = (i: number): number => SC.x0 + i * 84;
const STRIP_X1 = opX(5) + OP_W;

// right column: rack of five coefficients, then the loss plot
const NAMES = ['base', 'difficulty/6', 'clutter', 'context', 'interaction'];
const RK = { x: 690, y: 236, row: 36, bar0: 830, barW: 255 };
const RACK_MAX = Math.max(0.75, ...Array.from(FIT.snaps));
const rbx = (v: number): number => RK.bar0 + (Math.max(0, v) / RACK_MAX) * RK.barW;
const rowY = (i: number): number => RK.y + i * RK.row;
const LEARNED_X = 1160;
const AUTH_X = 1225;

const LP = { x0: 770, x1: 1215, y0: 590, y1: 462 };
const lpx = (step: number): number => LP.x0 + (Math.log10(step) / Math.log10(STEPS)) * (LP.x1 - LP.x0);
const lpy = (loss: number): number => LP.y0 - ((Math.log10(loss) + 4) / 4) * (LP.y0 - LP.y1);
const LOSS_PTS = FIT.losses.map((l, i) => [lpx(i + 1), lpy(l)] as const);
const MARK_LABEL: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; text: string; sub?: string }[] = [
  { x: lpx(10) + 12, y: lpy(LOSS_MARKS[0].loss) - 22, anchor: 'start', text: `step 10 · ${LOSS_MARKS[0].loss.toPrecision(3)}` },
  { x: lpx(100), y: lpy(LOSS_MARKS[1].loss) + 25, anchor: 'middle', text: `step 100 · ${LOSS_MARKS[1].loss.toPrecision(3)}` },
  { x: LP.x1, y: LP.y1 + 14, anchor: 'end', text: `step 400 · ${LOSS_MARKS[2].loss.toPrecision(3)}`, sub: 'flat from here on' },
];

// error ladder (log ms) in the right column
const LD = { x0: 700, x1: 1210, lo: 0.5, hi: 200 };
const lx = (ms: number): number => LD.x0 + ((Math.log10(ms) - Math.log10(LD.lo)) / (Math.log10(LD.hi) - Math.log10(LD.lo))) * (LD.x1 - LD.x0);
const LADDER: { name: string; v: number; color: string; y: number }[] = [
  { name: 'heldOutSimulatorMean', v: HELD_SIM, color: colors.POSITIVE, y: 172 },
  { name: 'constantBaselineHeldOutMean', v: CONST_BASE, color: colors.NEGATIVE, y: 232 },
  { name: 'heldOutNoisy', v: HELD_NOISY, color: colors.ACCENT, y: 292 },
  ...SEEDS.map((s, i) => ({ name: `training seed ${s.seed}`, v: s.err, color: colors.POSITIVE, y: 410 + i * 52 })),
];

const CAM_LEFT: CameraState = { x: 368, y: 346, k: 1.06 };
const CAM_LOSS: CameraState = { x: 985, y: 520, k: 1.7 };
const CAM_RACK: CameraState = { x: 958, y: 318, k: 1.45 };
const CAM_LADDER: CameraState = { x: 958, y: 352, k: 1.15 };

// screen-space header chip, one per caption: the identifiers the beat is about
const IDS = [
  'trainPredictor(observations, epochs = 800) · initialMseSecondsSquared',
  'evaluateReference → backpropagateReference · 6 operations',
  'Adam β1 0.9 · β2 0.999 · lr 0.04 · eps 1e-8',
  'losses[k] · the loss before update k + 1',
  'parametersSeconds',
  'meanDurationMs: 200 + 110·difficulty + 180·clutter + 80·context + 65·context·difficulty',
  'heldOutSimulatorMean · constantBaselineHeldOutMean',
  'heldOutNoisy · noiseHalfWidthMs = 35',
  'freshTrainingSeeds',
  'createObservations · one simulator',
];

// caption timing: ~150 wpm plus a breath
const CAPTIONS = [
  'Training starts with all five coefficients at zero, so the circuit predicts zero for everything. Its mean squared error begins at about point five nine, in seconds squared.',
  'Each step runs the circuit on all seven hundred twenty durations, then backpropagates exact gradients through the same six operations.',
  'Adam nudges each coefficient, with a learning rate of point zero four, for eight hundred steps. The README says those settings were not tuned on the test cases.',
  'The loss collapses: about point zero two five at step ten, point zero zero one at step one hundred, and flat near point zero zero zero four from step four hundred on.',
  'Learned coefficients, in seconds, are point one nine nine eight for the base, point six six four for difficulty, point one seven nine for clutter, point zero seven five for context, point four for the interaction.',
  'The authored values, converted the same way, are point two, point six six, point one eight, point zero eight and point three nine. Each is within about a hundredth. Close, and the README never claims exact recovery.',
  'Now the held-out test. Against the noise-free formula, the error is one point six eight milliseconds. A constant guess at the training average misses by about one hundred thirty-four.',
  "Against the noisy observations, the error is twenty point two two milliseconds. That matches the injected noise of twenty point two one. The circuit sits on the noise floor and can't go below it.",
  "Three fresh training seeds give point seven six, point six seven and point eight six milliseconds against the noise-free formula, so one lucky run isn't the story.",
  'The scope is narrow: one simulator, one authored formula, held-out points from the same family. This shows fitting recovers a law we wrote. It says nothing about how people move.',
];
const CAPS = (() => {
  let t = 0.4;
  return CAPTIONS.map((text) => {
    const dur = +(text.split(/\s+/).length / 2.5 + 0.6).toFixed(1);
    const c = { at: +t.toFixed(1), dur, text };
    t = c.at + dur + 0.7;
    return c;
  });
})();

// ---------------------------------------------------------------------------
// Timeline — ten fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 350, k: 1.03 }, cameraInterp);
  const beat = tl.channel('beat', 0);

  // layer opacities
  const opScat = tl.channel('opScat', 1);
  const opCirc = tl.channel('opCirc', 1);
  const opTop = tl.channel('opTop', 1);
  const opRack = tl.channel('opRack', 1);
  const opLoss = tl.channel('opLoss', 1);
  // B0
  const plotU = tl.channel('plotU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const lineU = tl.channel('lineU', 0);
  const rackU = tl.channel('rackU', 0);
  const lossAxU = tl.channel('lossAxU', 0);
  const initU = tl.channel('initU', 0);
  // B1
  const circU = tl.channel('circU', 0);
  const fwdU = tl.channel('fwdU', 0);
  const resU = tl.channel('resU', 0);
  const bwdU = tl.channel('bwdU', 0);
  // B2
  const adamU = tl.channel('adamU', 0);
  const trainU = tl.channel('trainU', 0); // 0..1 → step 801^u − 1
  const tunedU = tl.channel('tunedU', 0);
  // B3
  const markU = tl.channel('markU', 0); // 0..3 markers
  const finalU = tl.channel('finalU', 0);
  const sliceU = tl.channel('sliceU', 0);
  // B4
  const valU = tl.channel('valU', 0);
  // B5
  const authU = tl.channel('authU', 0);
  const gapU = tl.channel('gapU', 0);
  // B6
  const heldU = tl.channel('heldU', 0);
  const constU = tl.channel('constU', 0);
  const ladU = tl.channel('ladU', 0);
  const lad0 = tl.channel('lad0', 0);
  const lad1 = tl.channel('lad1', 0);
  // B7
  const noisyU = tl.channel('noisyU', 0);
  const lad2 = tl.channel('lad2', 0);
  const floorU = tl.channel('floorU', 0);
  const ladFocus = tl.channel('ladFocus', 0); // 1: noisy row, 2: seeds
  // B8
  const seedsU = tl.channel('seedsU', 0); // 0..3
  // B9
  const endU = tl.channel('endU', 0);

  const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = CAPS;
  CAPS.forEach((c, i) => {
    tl.caption(c);
    tl.set(beat, i, Math.max(0, c.at - 0.1));
    tl.hold(c.at + c.dur, 0.7);
  });

  // — B0 · all five at zero, the line on the floor, MSE 0.593 —
  let a = c0.at;
  tl.tween(plotU, 1, { at: a + 0.1, dur: 1.2, ease: ease.draw });
  tl.tween(dotsU, 1, { at: a + 0.8, dur: 1.4, ease: ease.linear });
  tl.tween(rackU, 1, { at: a + 2.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + 2.4, dur: 1.4, ease: ease.move });
  tl.tween(lineU, 1, { at: a + 3.6, dur: 1.0, ease: ease.draw });
  tl.tween(lossAxU, 1, { at: a + 6.4, dur: 1.0, ease: ease.draw });
  tl.tween(initU, 1, { at: a + 7.4, dur: 0.6, ease: ease.pop });

  // — B1 · forward over 720 durations, back through six operations —
  a = c1.at;
  tl.tween(cam, CAM_LEFT, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(opRack, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opLoss, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opTop, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(circU, 1, { at: a + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(fwdU, 1, { at: a + 1.4, dur: 2.4, ease: ease.linear });
  tl.tween(resU, 1, { at: a + 1.4, dur: 2.4, ease: ease.linear });
  tl.tween(bwdU, 1, { at: a + 4.6, dur: 2.2, ease: ease.linear });

  // — B2 · Adam, lr 0.04, 800 steps: the dials turn, the line rises into its slice, the loss draws —
  a = c2.at;
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(opRack, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opLoss, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opTop, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opCirc, 0.12, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(adamU, 1, { at: a + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(trainU, 1, { at: a + 1.4, dur: 7.4, ease: ease.linear });
  tl.tween(tunedU, 1, { at: a + 8.0, dur: 0.7, ease: ease.enter });
  tl.tween(sliceU, 1, { at: a + 9.0, dur: 0.8, ease: ease.move });

  // — B3 · the loss collapses (everything off-camera goes dark) —
  a = c3.at;
  tl.tween(cam, CAM_LOSS, { at: a, dur: 1.4, ease: ease.move });
  for (const ch of [opRack, opTop, opCirc, opScat]) tl.tween(ch, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(markU, 1, { at: a + 2.6, dur: 0.6, ease: ease.pop });
  tl.tween(markU, 2, { at: a + 6.0, dur: 0.6, ease: ease.pop });
  tl.tween(markU, 3, { at: a + 9.0, dur: 0.6, ease: ease.pop });
  tl.tween(finalU, 1, { at: a + 10.6, dur: 0.6, ease: ease.enter });

  // — B4 · the learned coefficients —
  a = c4.at;
  tl.tween(cam, CAM_RACK, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(opLoss, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opRack, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(valU, 5, { at: a + 1.8, dur: 10.5, ease: ease.linear });

  // — B5 · the authored values beside them —
  a = c5.at;
  tl.tween(authU, 1, { at: a + 0.4, dur: 7.6, ease: ease.linear });
  tl.tween(gapU, 1, { at: a + 9.0, dur: 0.6, ease: ease.pop });

  // — B6 · held-out: 1.68 ms vs the constant guess —
  a = c6.at;
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(opRack, 0, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(gapU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(opScat, 1, { at: a + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(heldU, 1, { at: a + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(ladU, 1, { at: a + 1.4, dur: 0.8, ease: ease.draw });
  tl.tween(lad0, 1, { at: a + 3.6, dur: 1.0, ease: ease.move });
  tl.tween(constU, 1, { at: a + 7.4, dur: 0.8, ease: ease.draw });
  tl.tween(lad1, 1, { at: a + 8.0, dur: 1.2, ease: ease.move });

  // — B7 · noisy: 20.22 on the 20.21 floor —
  a = c7.at;
  tl.tween(constU, 0.12, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(ladFocus, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(noisyU, 1, { at: a + 0.4, dur: 1.2, ease: ease.move });
  tl.tween(lad2, 1, { at: a + 1.6, dur: 1.4, ease: ease.move });
  tl.tween(floorU, 1, { at: a + 4.6, dur: 0.8, ease: ease.draw });

  // — B8 · three fresh seeds (the ladder alone) —
  a = c8.at;
  tl.tween(cam, CAM_LADDER, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(ladFocus, 2, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opScat, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(seedsU, 3, { at: a + 1.2, dur: 5.4, ease: ease.linear });

  // — B9 · the scope: pull back, quiet the stage, one panel —
  a = c9.at;
  tl.tween(cam, { x: 640, y: 360, k: 0.96 }, { at: a, dur: 1.6, ease: ease.move });
  tl.tween(opScat, 0.1, { at: a + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(ladU, 0.1, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: a + 0.9, dur: 6.0, ease: ease.linear });
  tl.hold(c9.at + c9.dur + 0.7, 2.0);

  return {
    tl, cam, beat, opScat, opCirc, opTop, opRack, opLoss,
    plotU, dotsU, lineU, rackU, lossAxU, initU,
    circU, fwdU, resU, bwdU,
    adamU, trainU, tunedU,
    markU, finalU, sliceU,
    valU, authU, gapU,
    heldU, constU, ladU, lad0, lad1,
    noisyU, lad2, floorU, ladFocus,
    seedsU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Small glyphs
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = true }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs / 13) * CH13 : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function T({ x, y, children, color = colors.TEXT, fs = 13, anchor = 'start', mono = true, opacity = 1, weight }: {
  x: number; y: number; children: string; color?: string; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={fs} fontFamily={mono ? MONO : UI} opacity={opacity} fontWeight={weight}>
      {children}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const beatIdx = Math.max(0, Math.min(IDS.length - 1, Math.round(g(scene.beat))));

  const opScat = g(scene.opScat);
  const opCirc = g(scene.opCirc);
  const opTop = g(scene.opTop);
  const opRack = g(scene.opRack);
  const opLoss = g(scene.opLoss);
  const plotU = g(scene.plotU);
  const dotsU = g(scene.dotsU);
  const lineU = g(scene.lineU);
  const rackU = g(scene.rackU);
  const lossAxU = g(scene.lossAxU);
  const initU = g(scene.initU);
  const circU = g(scene.circU);
  const fwdU = g(scene.fwdU);
  const resU = g(scene.resU);
  const bwdU = g(scene.bwdU);
  const adamU = g(scene.adamU);
  const trainU = g(scene.trainU);
  const tunedU = g(scene.tunedU);
  const markU = g(scene.markU);
  const finalU = g(scene.finalU);
  const sliceU = g(scene.sliceU);
  const valU = g(scene.valU);
  const authU = g(scene.authU);
  const gapU = g(scene.gapU);
  const heldU = g(scene.heldU);
  const constU = g(scene.constU);
  const ladU = g(scene.ladU);
  const lads = [g(scene.lad0), g(scene.lad1), g(scene.lad2)];
  const noisyU = g(scene.noisyU);
  const floorU = g(scene.floorU);
  const ladFocus = g(scene.ladFocus);
  const seedsU = g(scene.seedsU);
  const endU = g(scene.endU);

  const stepF = trainU <= 0 ? 0 : Math.pow(STEPS + 1, trainU) - 1;
  const step = Math.min(STEPS, Math.round(stepF));
  const P = paramsAt(stepF);
  const pred = (e: Ex) => 1000 * (P[0] + P[1] * e.d6 + P[2] * e.c + P[3] * e.m + P[4] * e.d6 * e.m);
  const lineMs = (diff: number) => 1000 * (P[0] + P[1] * (diff / 6) + 0.5 * P[2] + 0.5 * P[3] + 0.5 * P[4] * (diff / 6));
  const lossNow = step === 0 ? FIT.losses[0] : FIT.losses[Math.min(STEPS - 1, step)];
  const trainingDone = clamp01(trainU * 50 - 49);

  const sweepX = SC.x0 + fwdU * (SC.x1 - SC.x0);
  const trainOp = opScat * (1 - 0.9 * heldU);
  const sliceDim = 1 - 0.75 * sliceU * (1 - heldU); // other dots dim while the slice is spotlit

  // the scatter's per-dot draw
  const dots = TRAIN.map((e, i) => {
    const appear = clamp01(dotsU * 1.25 - (sx(e.diff) - SC.x0) / (SC.x1 - SC.x0) * 0.25);
    if (appear <= 0.01) return null;
    const isSlice = SLICE(e);
    const lit = isSlice ? sliceU * (1 - heldU) : 0;
    const showRes = resU > 0 && sx(e.diff) <= sweepX + 0.5;
    const pm = pred(e);
    return (
      <g key={i}>
        {showRes && (
          <line x1={sx(e.diff)} y1={sy(e.ms)} x2={sx(e.diff)} y2={sy(pm)} stroke={colors.NEGATIVE} strokeWidth={0.8}
            opacity={0.22 * trainOp * (1 - 0.6 * sliceU)} />
        )}
        <circle cx={sx(e.diff)} cy={sy(e.ms)} r={2.1 + 0.9 * lit} fill={lit > 0.02 ? colors.WARM : colors.ACCENT}
          opacity={appear * trainOp * (isSlice ? 0.7 + 0.3 * lit : 0.55 * sliceDim)} />
      </g>
    );
  });

  // held-out: rings at the noise-free formula, predictions dotted in, noisy observations with whiskers
  const Pfin = FIT.params;
  const held = heldU > 0.01 && HELD.map((e, i) => {
    const pm = predMs(Pfin)(e);
    const x = sx(e.diff);
    return (
      <g key={i} opacity={opScat}>
        {noisyU > 0.01 && (
          <>
            <line x1={x} y1={sy(e.ms)} x2={x} y2={sy(pm)} stroke={colors.ACCENT} strokeWidth={1} opacity={0.55 * noisyU} />
            <circle cx={x} cy={sy(e.ms)} r={2} fill={colors.ACCENT} opacity={0.85 * noisyU} />
          </>
        )}
        <circle cx={x} cy={sy(e.mean)} r={4} fill="none" stroke={colors.POSITIVE} strokeWidth={1.3} opacity={heldU * (1 - 0.5 * noisyU)} />
        <circle cx={x} cy={sy(pm)} r={1.6} fill={colors.TEXT} opacity={heldU * (1 - 0.5 * noisyU)} />
      </g>
    );
  });

  // circuit strip pulses
  const fwdX = lerp(SC.x0, STRIP_X1, fwdU);
  const bwdX = lerp(STRIP_X1, SC.x0, bwdU);
  const opLit = (i: number) => {
    const cx = opX(i) + OP_W / 2;
    const f = fwdU > 0 && fwdU < 1 ? clamp01(1 - Math.abs(fwdX - cx) / 60) : 0;
    const b = bwdU > 0 && bwdU < 1 ? clamp01(1 - Math.abs(bwdX - cx) / 60) : 0;
    return { f, b };
  };

  // loss curve, drawn up to the current step
  const lossN = Math.max(1, step);
  const lossPath = LOSS_PTS.slice(0, lossN).map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const rackFocus = clamp01(valU) > 0 || authU > 0;

  // the end panel
  const endIn = clamp01(endU * 6);
  const scope = ['one simulator', 'one authored formula', 'held-out points from the same family'];

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== scatter (the persistent machine) ======================== */}
        <g opacity={opScat}>
          <g opacity={plotU}>
            <line x1={SC.x0} y1={SC.y0} x2={lerp(SC.x0, SC.x1, plotU)} y2={SC.y0} stroke={colors.MUTED} strokeWidth={1.4} />
            <line x1={SC.x0} y1={SC.y0} x2={SC.x0} y2={lerp(SC.y0, SC.y1, plotU)} stroke={colors.MUTED} strokeWidth={1.4} />
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line x1={sx(v)} y1={SC.y0} x2={sx(v)} y2={SC.y0 + 5} stroke={colors.MUTED} />
                <T x={sx(v)} y={SC.y0 + 20} anchor="middle" color={colors.MUTED}>{`${v}`}</T>
              </g>
            ))}
            {[0, 400, 800, 1200].map((v) => (
              <g key={v}>
                <line x1={SC.x0 - 5} y1={sy(v)} x2={SC.x0} y2={sy(v)} stroke={colors.MUTED} />
                {v > 0 && <line x1={SC.x0} y1={sy(v)} x2={SC.x1} y2={sy(v)} stroke={colors.GRID} strokeWidth={0.6} opacity={0.5} />}
                <T x={SC.x0 - 9} y={sy(v) + 4} anchor="end" color={colors.MUTED}>{`${v}`}</T>
              </g>
            ))}
            <T x={(SC.x0 + SC.x1) / 2} y={SC.y0 + 42} anchor="middle" color={colors.MUTED}>difficulty = log2(1 + distance / width)</T>
            <T x={SC.x0} y={SC.y1 - 12} color={colors.MUTED}>duration (ms)</T>
            <T x={SC.x1} y={SC.y1 - 12} anchor="end" color={colors.MUTED} opacity={1 - heldU}>720 training durations · seed 731</T>
            <T x={SC.x1} y={SC.y1 - 12} anchor="end" color={colors.POSITIVE} opacity={heldU}>192 held-out · seed 947</T>
          </g>

          {dots}
          {held}

          {/* the sweep of one forward pass */}
          {fwdU > 0.001 && fwdU < 0.999 && (
            <line x1={sweepX} y1={SC.y1} x2={sweepX} y2={SC.y0} stroke={colors.ACCENT} strokeWidth={2} opacity={0.8} />
          )}

          {/* the prediction line (slice clutter 0.5 · context 0.5) */}
          {lineU > 0.01 && (
            <g opacity={lineU * (1 - heldU)}>
              <line x1={SC.x0} y1={sy(lineMs(0))} x2={lerp(SC.x0, SC.x1, lineU)} y2={sy(lineMs(5 * lineU))} stroke={colors.WARM} strokeWidth={2.6} />
              <T x={SC.x0 + 14} y={SC.y0 - 12} color={colors.WARM} opacity={clamp01(1 - stepF * 2)}>prediction = 0 ms for every point</T>
              <T x={SC.x0 + 14} y={SC.y0 - 12} color={colors.WARM} opacity={clamp01(stepF / 20) * (1 - sliceU)}>
                prediction line · clutter 0.5 · context 0.5
              </T>
              <T x={SC.x0 + 14} y={SC.y0 - 12} color={colors.WARM} opacity={sliceU}>
                the line runs through its slice · clutter 0.5 · context 0.5
              </T>
            </g>
          )}

          {/* the constant guess */}
          {constU > 0.01 && (
            <g opacity={constU}>
              <line x1={SC.x0} y1={sy(MEAN_TRAIN_MS)} x2={lerp(SC.x0, SC.x1, clamp01(constU * 1.2))} y2={sy(MEAN_TRAIN_MS)} stroke={colors.NEGATIVE}
                strokeWidth={2} strokeDasharray="7 5" />
              <Chip x={SC.x0 + 10} y={sy(MEAN_TRAIN_MS) - 14} text={`constant guess · training mean ${MEAN_TRAIN_MS.toFixed(0)} ms`} color={colors.NEGATIVE} fs={12} />
            </g>
          )}
          {heldU > 0.01 && (
            <g opacity={heldU * (1 - 0.6 * noisyU)}>
              <circle cx={SC.x0 + 22} cy={SC.y1 + 18} r={4} fill="none" stroke={colors.POSITIVE} strokeWidth={1.3} />
              <T x={SC.x0 + 34} y={SC.y1 + 22} color={colors.POSITIVE}>noise-free formula</T>
              <circle cx={SC.x0 + 22} cy={SC.y1 + 40} r={1.8} fill={colors.TEXT} />
              <T x={SC.x0 + 34} y={SC.y1 + 44} color={colors.TEXT}>prediction · on top of it</T>
            </g>
          )}
          {noisyU > 0.01 && (
            <g opacity={noisyU}>
              <circle cx={SC.x0 + 22} cy={SC.y1 + 62} r={2} fill={colors.ACCENT} />
              <T x={SC.x0 + 34} y={SC.y1 + 66} color={colors.ACCENT}>noisy observation · ±35 ms uniform</T>
            </g>
          )}
        </g>

        {/* ======================== circuit strip: the six operations ======================== */}
        {circU > 0.01 && (
          <g opacity={circU * opCirc}>
            <T x={SC.x0} y={OP_Y - 10} color={colors.MUTED}>circuit · 6 operations · 3 layers</T>
            {OPS.map((name, i) => {
              const { f, b } = opLit(i);
              const lit = Math.max(f, b);
              const col = b > f ? colors.WARM : colors.ACCENT;
              return (
                <g key={i}>
                  <rect x={opX(i)} y={OP_Y} width={OP_W} height={OP_H} rx={5} fill={colors.PANEL} stroke={lit > 0.02 ? col : colors.GRID}
                    strokeWidth={1 + 1.5 * lit} />
                  {lit > 0.02 && <rect x={opX(i)} y={OP_Y} width={OP_W} height={OP_H} rx={5} fill={col} opacity={0.22 * lit} />}
                  <T x={opX(i) + OP_W / 2} y={OP_Y + 18} anchor="middle">{name}</T>
                </g>
              );
            })}
            {fwdU > 0 && fwdU < 1 && <circle cx={fwdX} cy={OP_Y + OP_H + 8} r={5} fill={colors.ACCENT} />}
            {bwdU > 0 && bwdU < 1 && <circle cx={bwdX} cy={OP_Y + OP_H + 8} r={5} fill={colors.WARM} />}
            <T x={STRIP_X1} y={OP_Y - 10} anchor="end" color={colors.ACCENT} opacity={clamp01(fwdU * 4) * (1 - clamp01(bwdU * 4))}>forward · 720 durations</T>
            <T x={STRIP_X1} y={OP_Y - 10} anchor="end" color={colors.WARM} opacity={clamp01(bwdU * 4)}>backward · exact gradients</T>
          </g>
        )}

        {/* ======================== right column top: trainPredictor + Adam ======================== */}
        <g opacity={opTop}>
          <T x={RK.x} y={112} color={colors.TEXT} opacity={rackU}>trainPredictor(observations, epochs = 800)</T>
          <Chip x={RK.x} y={150} text="Adam · β1 0.9 · β2 0.999 · lr 0.04 · eps 1e-8" color={colors.TEAL} opacity={adamU} />
          <T x={RK.x} y={182} color={colors.MUTED} mono={false} opacity={tunedU}>README: settings not tuned on the test cases</T>
        </g>

        {/* ======================== the rack: five coefficients ======================== */}
        {rackU > 0.01 && (
          <g opacity={rackU * opRack}>
            <T x={RK.x} y={RK.y - 24} color={colors.MUTED}>parametersSeconds</T>
            <T x={RK.bar0 + RK.barW} y={RK.y - 24} anchor="end" color={step > 0 ? colors.TEXT : colors.MUTED}>{`step ${step} / ${STEPS}`}</T>
            <T x={LEARNED_X} y={RK.y - 24} anchor="end" color={colors.ACCENT} opacity={rackFocus ? 1 : 0}>learned</T>
            <T x={AUTH_X} y={RK.y - 24} anchor="end" color={colors.SECONDARY} opacity={clamp01(authU * 5)}>authored</T>
            {NAMES.map((name, i) => {
              const y = rowY(i);
              const v = P[i];
              const lit = clamp01(valU - i) * (valU < 5 ? clamp01(i + 1.6 - valU) * 0.6 + 0.4 : 1);
              const au = clamp01(authU * 5 - i);
              return (
                <g key={i}>
                  <T x={RK.x} y={y + 5} color={lit > 0.5 ? colors.TEXT : colors.MUTED}>{name}</T>
                  <rect x={RK.bar0} y={y - 8} width={RK.barW} height={16} rx={3} fill={colors.GRID} opacity={0.35} />
                  <rect x={RK.bar0} y={y - 8} width={Math.max(0, rbx(v) - RK.bar0)} height={16} rx={3} fill={colors.ACCENT}
                    opacity={0.55 + 0.45 * lit} />
                  {au > 0.01 && (
                    <g opacity={au}>
                      <line x1={rbx(AUTHORED[i])} y1={y - 13} x2={rbx(AUTHORED[i])} y2={y + 13} stroke={colors.SECONDARY} strokeWidth={2.5} />
                      <T x={AUTH_X} y={y + 5} anchor="end" color={colors.SECONDARY}>{`${+AUTHORED[i].toFixed(2)}`}</T>
                    </g>
                  )}
                  <T x={LEARNED_X} y={y + 5} anchor="end" color={lit > 0.02 ? colors.ACCENT : colors.TEXT} weight={lit > 0.5 ? 700 : undefined}>
                    {v.toFixed(4)}
                  </T>
                </g>
              );
            })}
            <g opacity={clamp01(authU * 3 - 0.3)}>
              <T x={RK.x} y={rowY(4) + 40} color={colors.MUTED}>ms → s: 200/1000 · 110·6/1000 · 180/1000 · 80/1000 · 65·6/1000</T>
            </g>
            <Chip x={RK.x} y={rowY(4) + 74} text={`largest |learned − authored| = ${MAX_GAP.toFixed(4)} (interaction)`} color={colors.WARM} opacity={gapU} />
          </g>
        )}

        {/* ======================== loss plot (log–log) ======================== */}
        {lossAxU > 0.01 && (
          <g opacity={lossAxU * opLoss}>
            <line x1={LP.x0} y1={LP.y0} x2={lerp(LP.x0, LP.x1, lossAxU)} y2={LP.y0} stroke={colors.MUTED} strokeWidth={1.2} />
            <line x1={LP.x0} y1={LP.y0} x2={LP.x0} y2={lerp(LP.y0, LP.y1, lossAxU)} stroke={colors.MUTED} strokeWidth={1.2} />
            {[1, 10, 100, 800].map((k) => (
              <g key={k}>
                <line x1={lpx(k)} y1={LP.y0} x2={lpx(k)} y2={LP.y0 + 4} stroke={colors.MUTED} />
                <T x={lpx(k)} y={LP.y0 + 17} anchor="middle" color={colors.MUTED} fs={12}>{`${k}`}</T>
              </g>
            ))}
            {[
              [1, '1'],
              [0.01, '0.01'],
              [0.0001, '0.0001'],
            ].map(([v, l]) => (
              <g key={l as string}>
                <line x1={LP.x0 - 4} y1={lpy(v as number)} x2={LP.x0} y2={lpy(v as number)} stroke={colors.MUTED} />
                <T x={LP.x0 - 7} y={lpy(v as number) + 4} anchor="end" color={colors.MUTED} fs={12}>{l as string}</T>
              </g>
            ))}
            <T x={LP.x0} y={LP.y1 - 22} color={colors.MUTED} fs={12}>MSE (s²) by step · log–log</T>
            {/* readout slot: initial, then final */}
            <T x={LP.x1} y={LP.y1 - 22} anchor="end" color={colors.WARM} fs={12} opacity={initU * (1 - finalU)}>
              {`initialMseSecondsSquared ${FIT.losses[0].toFixed(3)}`}
            </T>
            <T x={LP.x1} y={LP.y1 - 22} anchor="end" color={colors.POSITIVE} fs={12} opacity={finalU}>
              {`finalPreUpdateMseSecondsSquared ${FIT.losses[STEPS - 1].toPrecision(3)}`}
            </T>
            <path d={lossPath} fill="none" stroke={colors.WARM} strokeWidth={2} />
            <circle cx={LOSS_PTS[lossN - 1][0]} cy={LOSS_PTS[lossN - 1][1]} r={4.5} fill={colors.WARM} opacity={initU} />
            {step > 0 && trainingDone < 1 && (
              <T x={LOSS_PTS[lossN - 1][0] + 8} y={LOSS_PTS[lossN - 1][1] - 8} color={colors.WARM} fs={12}>{lossNow.toPrecision(3)}</T>
            )}
            {LOSS_MARKS.map((m, i) => {
              const u = clamp01(markU - i);
              if (u <= 0.01) return null;
              const L = MARK_LABEL[i];
              const px = lpx(m.k);
              const py = lpy(m.loss);
              return (
                <g key={m.k} opacity={u}>
                  {i === 2 && <rect x={px} y={LP.y1} width={LP.x1 - px} height={LP.y0 - LP.y1} fill={colors.POSITIVE} opacity={0.08} />}
                  {i !== 1 && (
                    <line x1={px} y1={py - 6} x2={L.anchor === 'start' ? L.x - 2 : px} y2={L.y + (L.sub ? 22 : 4)} stroke={colors.TEXT} strokeWidth={1} opacity={0.7} />
                  )}
                  <circle cx={px} cy={py} r={5 * (0.6 + 0.4 * u)} fill="none" stroke={colors.TEXT} strokeWidth={2} />
                  <T x={L.x} y={L.y} anchor={L.anchor} color={colors.TEXT} fs={12}>{L.text}</T>
                  {L.sub && <T x={L.x} y={L.y + 16} anchor={L.anchor} color={colors.POSITIVE} fs={12}>{L.sub}</T>}
                </g>
              );
            })}
            <T x={LP.x0} y={LP.y0 + 34} color={colors.MUTED} fs={12} opacity={clamp01(markU)}>
              losses[9], [99], [399] recomputed with trainPredictor · report.ts prints first and last
            </T>
          </g>
        )}

        {/* ======================== the error ladder ======================== */}
        {ladU > 0.01 && (
          <g opacity={ladU}>
            <T x={LD.x0} y={118} color={colors.MUTED}>held-out RMSE (ms, log scale) · 192 points</T>
            <line x1={LD.x0} y1={545} x2={lerp(LD.x0, LD.x1, ladU)} y2={545} stroke={colors.MUTED} strokeWidth={1.2} />
            {[1, 10, 100].map((v) => (
              <g key={v}>
                <line x1={lx(v)} y1={140} x2={lx(v)} y2={545} stroke={colors.GRID} strokeWidth={0.7} opacity={0.6} />
                <T x={lx(v)} y={562} anchor="middle" color={colors.MUTED} fs={12}>{`${v} ms`}</T>
              </g>
            ))}
            <T x={LD.x0} y={382} color={colors.MUTED} mono={false}>fresh training seeds · against the noise-free formula</T>
            {LADDER.map((r, i) => {
              const u = i < 3 ? lads[i] : clamp01(seedsU - (i - 3));
              if (u <= 0.01) return null;
              const focus = i === 2 ? ladFocus >= 0.5 && ladFocus < 1.5 : i >= 3 ? ladFocus >= 1.5 : ladFocus < 0.5;
              const dim = ladFocus > 0.01 && !focus ? 0.35 : 1;
              const w = (lx(r.v) - LD.x0) * u;
              return (
                <g key={r.name} opacity={dim}>
                  <T x={LD.x0} y={r.y - 12} color={colors.TEXT}>{r.name}</T>
                  <T x={LD.x1} y={r.y - 12} anchor="end" color={r.color} weight={700} opacity={clamp01(u * 2 - 1)}>{`${r.v.toFixed(2)} ms`}</T>
                  <rect x={LD.x0} y={r.y - 4} width={Math.max(0, w)} height={14} rx={3} fill={r.color} opacity={0.85} />
                </g>
              );
            })}
            {floorU > 0.01 && (
              <g opacity={floorU * (ladFocus > 1.5 ? 0.35 : 1)}>
                <line x1={lx(NOISE_SD)} y1={LADDER[2].y - 26} x2={lx(NOISE_SD)} y2={lerp(LADDER[2].y - 26, LADDER[2].y + 34, floorU)}
                  stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 4" />
                <T x={lx(NOISE_SD) + 8} y={LADDER[2].y + 30} color={colors.WARM}>{`noise floor · 35/√3 ≈ ${NOISE_SD.toFixed(2)} ms`}</T>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: the closing panel ======================== */}
      {endIn > 0.01 && (
        <g opacity={endIn}>
          <rect x={250} y={170} width={780} height={330} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <T x={640} y={214} anchor="middle" color={colors.MUTED} mono={false} fs={15}>the scope</T>
          {scope.map((t, i) => (
            <Chip key={t} x={640} y={262 + i * 44} text={t} color={colors.TEAL} mono={false} fs={16} anchor="middle" opacity={clamp01(endU * 7 - 1 - i * 0.9)} />
          ))}
          <g opacity={clamp01(endU * 4 - 2)}>
            <T x={640} y={418} anchor="middle" color={colors.POSITIVE} mono={false} fs={18}>fitting recovers a law we wrote</T>
          </g>
          <g opacity={clamp01(endU * 4 - 2.8)}>
            <T x={640} y={458} anchor="middle" color={colors.MUTED} mono={false} fs={16}>it says nothing about how people move</T>
          </g>
        </g>
      )}

      {/* ======================== screen-space header ======================== */}
      <rect x={0} y={0} width={1280} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · Fitting It, Then Testing It
      </text>
      <g>
        <rect x={40} y={48} width={IDS[beatIdx].length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {IDS[beatIdx]}
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
