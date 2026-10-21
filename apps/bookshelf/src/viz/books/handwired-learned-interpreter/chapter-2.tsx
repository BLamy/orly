// Cooling the Reels
//
// Learned Program — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT),
// lab/learned-interpreter/ unless noted.
//   discrete-training.ts:31-40 (evaluateCandidate), 48-106 (buildProgramLossMatrix), 108-114 (initial logits),
//     116-136 (softmaxGroup), 144-174 (p0ᵀ L p1 and its marginals), 176-188 (logit gradients),
//     198-203 (hard-loss defaults: lossMultiplier 1, adamEpsilon 1e-14), 237-338 (trainWithExpectedProgramLoss)
//   oracle.ts:3-15 (RandomSource), 16-27 (the two oracles), 57-83 (the 14,739-example training grid)
//   program.ts:12-16, 54-64 (inputs, operations, candidate order)
//   training.ts:44-50 (lossScale 256, old epsilon 1e-8, the five-phase schedule)
//   discrete-training.test.ts:30-37 (14,739 examples; 2 and 12 zero-loss programs)
//   README.md:7 (epsilon caused most of the failure), 49 (two coordinate programs, operand order), 55-61 (the
//     loss table, p0ᵀ L p1, loss × 1e6 ≡ epsilon ÷ 1e6, 120 paired runs), 65-76 (the scoreboard, seed 519), 80 (costs)
//   study-results.json hardStudies[*].epsilonScalingAgreement (max gaps 7.148e-7 two-add, 1.134e-13 coordinate),
//     hardStudies[0].rows.corrected seed 519 (program 27, loss 0.000732421875)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Everything drawn from the table and the runs is COMPUTED below: a line-for-line port of
// buildProgramLossMatrix and trainWithExpectedProgramLoss builds both 48 × 75 tables and replays coordinate seed 541
// with epsilon 1e-8, 1e-14, and 1e-8 with the loss × 1e6. The module throws if the replay disagrees with the planner's
// probe (plan.md "Probe data") or the tests' zero-loss counts. The Adam magnitudes in beat 7 are measured from the
// same port (seed 541, temperature 0.5, first step, the logit of multiply(instruction0, scale)), labelled on screen.
// The scoreboard, the 120-run agreement and seed 519 are the README/JSON's numbers. Plan change: the reels advance
// through temperature 1 before the split (both runs are identical there), so the split starts at step 1,000.
import { CAMERA_HOME, Camera, CanvasLayer, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { interpolateRgb } from 'd3';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const CH13 = 7.83; // mono advance at 13 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** 6.636e-16 → "6.6e-16"; plain decimals above 1e-3 */
const sci = (v: number, d = 1): string => {
  if (v === 0) return '0';
  if (Math.abs(v) >= 1e-3) return String(+v.toPrecision(4));
  const [m, e] = v.toExponential(d).split('e');
  return `${m}e${e.replace('+', '')}`;
};

// ---------------------------------------------------------------------------
// The lab, ported (module scope, exact)
// ---------------------------------------------------------------------------

const REG = ['pointerX', 'panelLeft', 'scale', 'distractor', 'instruction0'];
const OPS = ['add', 'subtract', 'multiply'];
type Cand = [op: number, left: number, right: number];
/** program.ts:54-64: operation-major, then left register, then right register */
const candidates = (n: number): Cand[] => {
  const c: Cand[] = [];
  for (let op = 0; op < 3; op++) for (let l = 0; l < n; l++) for (let r = 0; r < n; r++) c.push([op, l, r]);
  return c;
};
const C0 = candidates(4); // 48
const C1 = candidates(5); // 75
const N0 = C0.length;
const N1 = C1.length;
const cardName = (c: Cand): string => `${OPS[c[0]]}(${REG[c[1]]}, ${REG[c[2]]})`;
const evalCand = (c: Cand, R: Float32Array): number => {
  const a = R[c[1]];
  const b = R[c[2]];
  return Math.fround(c[0] === 0 ? a + b : c[0] === 1 ? a - b : a * b);
};

const COORDS = Array.from({ length: 17 }, (_, i) => -16 + i * 2);
const SCALES = [2, 4, 6];
const N_EX = COORDS.length * COORDS.length * SCALES.length * COORDS.length; // 14,739
/** example index → inputs, in createTrainingGrid order (pointerX, panelLeft, scale, distractor) */
const exampleAt = (n: number) => {
  const d = n % 17;
  const sc = Math.floor(n / 17) % 3;
  const pl = Math.floor(n / 51) % 17;
  const px = Math.floor(n / 867);
  return { pointerX: COORDS[px], panelLeft: COORDS[pl], scale: SCALES[sc], distractor: COORDS[d] };
};
const LOSS_SCALE = 256;
// partial-mean snapshots of the coordinate table while it fills (example counts)
const SNAP_N = [1, 18, 52, 290, 868, 2602, 5203, 8671, 11272, N_EX];

function buildTable(task: 'coordinate' | 'two-add', snaps: number[] = []) {
  const L = new Float64Array(N0 * N1);
  const R = new Float32Array(5);
  const F = new Float32Array(N0);
  const shots: Float64Array[] = [];
  let n = 0;
  for (let idx = 0; idx < N_EX; idx++) {
    const ex = exampleAt(idx);
    R[0] = ex.pointerX;
    R[1] = ex.panelLeft;
    R[2] = ex.scale;
    R[3] = ex.distractor;
    const target =
      task === 'coordinate'
        ? Math.fround(Math.fround(ex.pointerX - ex.panelLeft) * ex.scale)
        : Math.fround(Math.fround(ex.pointerX + ex.panelLeft) + ex.distractor);
    for (let f = 0; f < N0; f++) F[f] = evalCand(C0[f], R);
    for (let f = 0; f < N0; f++) {
      R[4] = F[f];
      const row = f * N1;
      for (let s = 0; s < N1; s++) {
        const e = (evalCand(C1[s], R) - target) / LOSS_SCALE;
        L[row + s] += 0.5 * e * e;
      }
    }
    n++;
    if (snaps.includes(n)) shots.push(L.map((v) => v / n));
  }
  for (let i = 0; i < L.length; i++) L[i] /= n;
  const zeros: number[] = [];
  for (let i = 0; i < L.length; i++) if (L[i] === 0) zeros.push(i);
  return { L, zeros, shots, examples: n };
}

const COORD = buildTable('coordinate', SNAP_N);
const TWOADD = buildTable('two-add');
if (COORD.examples !== 14739 || COORD.zeros.length !== 2 || TWOADD.zeros.length !== 12) {
  throw new Error('learned-interpreter ch2: table disagrees with discrete-training.test.ts:30-37');
}
const FIRST_EVALS = COORD.examples * N0; // 707,472
const SECOND_EVALS = COORD.examples * N0 * N1; // 53,060,400
const TABLE_BYTES = COORD.L.byteLength; // 28,800

// trainWithExpectedProgramLoss (discrete-training.ts:237-338), checkpointing the reels every CP steps
const PHASES = [
  { T: 2, lr: 0.02 },
  { T: 1, lr: 0.02 },
  { T: 0.5, lr: 0.01 },
  { T: 0.25, lr: 0.005 },
  { T: 0.125, lr: 0.002 },
];
const STEPS = 500;
const TOTAL = STEPS * PHASES.length; // 2,500
const CP = 10;

function softmax(lg: Float64Array, off: number, n: number, T: number): Float64Array {
  let m = -Infinity;
  for (let i = 0; i < n; i++) m = Math.max(m, lg[off + i] / T);
  const p = new Float64Array(n);
  let t = 0;
  for (let i = 0; i < n; i++) {
    p[i] = Math.exp(lg[off + i] / T - m);
    t += p[i];
  }
  for (let i = 0; i < n; i++) p[i] /= t;
  return p;
}
function expected(L: Float64Array, p0: Float64Array, p1: Float64Array) {
  const m0 = new Float64Array(N0);
  const m1 = new Float64Array(N1);
  let loss = 0;
  for (let f = 0; f < N0; f++) {
    let fl = 0;
    for (let s = 0; s < N1; s++) {
      const v = L[f * N1 + s];
      fl += p1[s] * v;
      m1[s] += p0[f] * v;
    }
    m0[f] = fl;
    loss += p0[f] * fl;
  }
  return { loss, m0, m1 };
}

type Run = {
  cp: { p0: Float64Array; p1: Float64Array }[]; // step k·CP
  loss: Float64Array; // expected table loss after k steps (unscaled), k = 0..2500
  phaseEnd: { loss: number; max0: number; max1: number; arg0: number; arg1: number }[];
  adam: { sqrtV: number; step: number } | null; // the probe in beat 7
};

function train(seed: number, L: Float64Array, eps: number, mult = 1): Run {
  let st = seed | 0;
  const next = () => {
    st = (Math.imul(st, 1_664_525) + 1_013_904_223) | 0;
    return (st >>> 0) / 4_294_967_296;
  };
  const lg = new Float64Array(N0 + N1);
  for (let i = 0; i < lg.length; i++) lg[i] = (next() - 0.5) * 0.02;
  const cp: Run['cp'] = [];
  const loss = new Float64Array(TOTAL + 1);
  const phaseEnd: Run['phaseEnd'] = [];
  let adam: Run['adam'] = null;
  let p0 = softmax(lg, 0, N0, PHASES[0].T);
  let p1 = softmax(lg, N0, N1, PHASES[0].T);
  let ev = expected(L, p0, p1);
  cp.push({ p0, p1 });
  loss[0] = ev.loss;
  let k = 0;
  PHASES.forEach(({ T, lr }, ph) => {
    const g1m = new Float64Array(lg.length);
    const g2m = new Float64Array(lg.length);
    p0 = softmax(lg, 0, N0, T);
    p1 = softmax(lg, N0, N1, T);
    ev = expected(L, p0, p1);
    for (let step = 1; step <= STEPS; step++) {
      const g = new Float64Array(lg.length);
      for (let i = 0; i < N0; i++) g[i] = (p0[i] * (ev.m0[i] - ev.loss)) / T;
      for (let i = 0; i < N1; i++) g[N0 + i] = (p1[i] * (ev.m1[i] - ev.loss)) / T;
      const c1 = 1 - 0.9 ** step;
      const c2 = 1 - 0.999 ** step;
      for (let i = 0; i < lg.length; i++) {
        const gr = g[i] * mult;
        g1m[i] = 0.9 * g1m[i] + 0.1 * gr;
        g2m[i] = 0.999 * g2m[i] + 0.001 * gr * gr;
        const sqrtV = Math.sqrt(g2m[i] / c2);
        const d = (lr * (g1m[i] / c1)) / (sqrtV + eps);
        if (ph === 2 && step === 1 && i === N0 + 72) adam = { sqrtV: sqrtV / mult, step: Math.abs(d) };
        lg[i] -= d;
      }
      p0 = softmax(lg, 0, N0, T);
      p1 = softmax(lg, N0, N1, T);
      ev = expected(L, p0, p1);
      k++;
      loss[k] = ev.loss;
      if (k % CP === 0) cp.push({ p0, p1 });
    }
    const arg = (p: Float64Array) => p.indexOf(Math.max(...p));
    phaseEnd.push({ loss: ev.loss * mult, max0: Math.max(...p0), max1: Math.max(...p1), arg0: arg(p0), arg1: arg(p1) });
  });
  return { cp, loss, phaseEnd, adam };
}

const OLD = train(541, COORD.L, 1e-8);
const NEW = train(541, COORD.L, 1e-14);
const SCALED = train(541, COORD.L, 1e-8, 1e6);

// the planner's probe (plan.md), four significant figures
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-3 * Math.abs(b) + 1e-30;
const PROBE_OLD = [[0.1481, 0.02756, 0.01563], [0.009872, 0.9973, 0.9878], [0.009766, 1, 1], [0.009766, 1, 1], [0.009766, 1, 1]];
const PROBE_NEW = [[0.1481, 0.02756, 0.01563], [0.009872, 0.9973, 0.9878], [7.423e-5, 1, 0.5026], [1.283e-8, 1, 0.513], [6.636e-16, 1, 0.5406]];
[[OLD, PROBE_OLD], [NEW, PROBE_NEW]].forEach(([run, probe]) => {
  (run as Run).phaseEnd.forEach((pe, i) => {
    const [l, a, b] = (probe as number[][])[i];
    if (!near(pe.loss, l) || !near(pe.max0, a) || !near(pe.max1, b)) throw new Error(`learned-interpreter ch2: replay disagrees with the probe at phase ${i}`);
  });
});

// the cards that matter (indices into C0 / C1)
const I0_WIN = 17; // subtract(pointerX, panelLeft)
const I1_WRONG = 24; // add(instruction0, instruction0)
const I1_RIGHT = 72; // multiply(instruction0, scale)
const I1_TWIN = 64; // multiply(scale, instruction0)
if (
  OLD.phaseEnd[4].arg0 !== I0_WIN || OLD.phaseEnd[4].arg1 !== I1_WRONG || NEW.phaseEnd[4].arg1 !== I1_RIGHT ||
  COORD.zeros[0] !== I0_WIN * N1 + I1_TWIN || COORD.zeros[1] !== I0_WIN * N1 + I1_RIGHT
) {
  throw new Error('learned-interpreter ch2: decoded cards disagree with the probe');
}
const NEW_FINAL = NEW.cp[NEW.cp.length - 1];
const P_RIGHT = NEW_FINAL.p1[I1_RIGHT]; // 0.5406
const P_TWIN = NEW_FINAL.p1[I1_TWIN];
const ADAM_OLD = OLD.adam as unknown as { sqrtV: number; step: number };
const ADAM_NEW = NEW.adam as unknown as { sqrtV: number; step: number };
// one example cell for beat 2: the very first program
const CELL0 = { i: 0, j: 0, loss: COORD.L[0] };

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// grid in machine-local coordinates: cell 8 × 7, reels outside the top and left edges
const CW = 8;
const CHh = 7;
const GW = N1 * CW; // 600
const GH = N0 * CHh; // 336
const RL = 110; // left reel, p = 1
const RT = 66; // top reel, p = 1
const GAP = 6;
type Pose = { tx: number; ty: number; s: number };
const POSE_A: Pose = { tx: 215, ty: 196, s: 1 };
const POSE_L: Pose = { tx: 104, ty: 212, s: 0.56 };
const POSE_R: Pose = { tx: 548, ty: 212, s: 0.56 };
const poseLerp = (a: Pose, b: Pose, u: number): Pose => ({ tx: lerp(a.tx, b.tx, u), ty: lerp(a.ty, b.ty, u), s: lerp(a.s, b.s, u) });
const cellX = (p: Pose, j: number) => p.tx + (j * CW + CW / 2) * p.s;
const cellY = (p: Pose, i: number) => p.ty + (i * CHh + CHh / 2) * p.s;

// heat: log10 loss over [-2.5, 4] → panel → violet → amber; exact zero is near-black
const HEAT = (() => {
  const a = interpolateRgb('#1a1f3a', '#8d5fd3');
  const b = interpolateRgb('#8d5fd3', '#fbbf24');
  return (u: number) => (u < 0.6 ? a(u / 0.6) : b((u - 0.6) / 0.4));
})();
const ZERO_FILL = '#03050a';
const heatOf = (v: number) => (v === 0 ? ZERO_FILL : HEAT(clamp01((Math.log10(v) + 2.5) / 6.5)));
const SNAP_COLORS: string[][] = COORD.shots.map((L) => Array.from(L, heatOf));
const COORD_FILL = Array.from(COORD.L, heatOf);
const TWOADD_FILL = Array.from(TWOADD.L, heatOf);

// right column: temperature dial + loss chart
const DIAL = { cx: 1000, cy: 178, r: 46 };
const DIAL_ANG = PHASES.map((_, i) => (-210 + i * 60) * (Math.PI / 180)); // 2 at lower left, 0.125 at lower right
const CHART = { x0: 968, x1: 1232, y0: 530, y1: 330 }; // log10 loss: -16 .. 0
const LOG_LO = -16.5;
const chartX = (k: number) => lerp(CHART.x0, CHART.x1, k / TOTAL);
const chartY = (v: number) => lerp(CHART.y0, CHART.y1, (Math.max(LOG_LO, v > 0 ? Math.log10(v) : LOG_LO) - LOG_LO) / -LOG_LO);
const linePts = (run: Run) => Array.from({ length: TOTAL / 5 + 1 }, (_, i) => [chartX(i * 5), chartY(run.loss[i * 5])] as const);
const PTS_OLD = linePts(OLD);
const PTS_NEW = linePts(NEW);
const PTS_SCALED = linePts(SCALED);

// scoreboard (README.md:65-72)
const BOARD = [
  { task: 'two-add', seeds: '501–520', original: 0, corrected: 19 },
  { task: 'two-add', seeds: '1001–1020', original: 0, corrected: 20 },
  { task: 'two-add', seeds: '4001–4020', original: 0, corrected: 20 },
  { task: 'coordinate', seeds: '541–560', original: 0, corrected: 20 },
  { task: 'coordinate', seeds: '1001–1020', original: 0, corrected: 20 },
  { task: 'coordinate', seeds: '4001–4020', original: 0, corrected: 20 },
];
const SB = { x: 280, y: 128, w: 720, rowH: 40 };

const PIN = 'handwired@4ea7fcb · lab/learned-interpreter';
const SOURCES = [
  'discrete-training.ts:48-106',
  'oracle.ts:57-83 · discrete-training.test.ts:30',
  'discrete-training.test.ts:32-37',
  'discrete-training.ts:144-174 · README.md:55',
  'training.ts:44-50 · README.md:53',
  'probe: coordinate seed 541 · discrete-training.ts:334-337',
  'discrete-training.ts:300-315 · README.md:7',
  'discrete-training.ts:198-203',
  'README.md:49',
  'README.md:57-61 · study-results.json',
  'README.md:65-72',
  'README.md:7, 76 · study-results.json',
];

const HOME: CameraState = CAMERA_HOME;
const CAM_GRID: CameraState = { x: 560, y: 360, k: 1.06 };
const CAM_ZERO: CameraState = { x: 640, y: 300, k: 1.45 };
const CAM_TWOADD: CameraState = { x: 520, y: 360, k: 1.12 };
const CAM_REELS: CameraState = { x: 500, y: 330, k: 1.2 };
const CAM_ADAM: CameraState = { x: 460, y: 400, k: 1.15 };
const CAM_TWIN: CameraState = { x: 720, y: 230, k: 1.6 };
const CAM_519: CameraState = { x: 640, y: 330, k: 1.06 };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Here\'s what makes training possible. Before learning anything, the lab runs every one of the three thousand six hundred possible programs on every training example, and records the error in one table.',
  "The table has forty-eight rows and seventy-five columns. Each cell holds one complete program's average error over fourteen thousand seven hundred thirty-nine training examples.",
  'Most cells glow with error. For the coordinate task exactly two cells go dark, zero error on every training example. For the two-add task, twelve do.',
  'Training never touches a program directly. It keeps one probability per row and one per column, and minimizes the expected error: row probability, times cell error, times column probability, summed.',
  'A temperature starts hot, at two, so the probabilities stay spread out. It cools through five phases of five hundred steps, down to one eighth, sharpening each reel toward a single card.',
  'Now one coordinate run with the original optimizer setting. The first reel finds subtracting the left edge from the pointer. The second reel locks onto the wrong card, and the error stops falling.',
  "The optimizer is Adam, which divides each step by the gradient's recent size plus a tiny constant, epsilon. The lab reports that the old epsilon dominated the small gradients here, so steps shrank.",
  'Shrink epsilon to ten to the minus fourteen, and the same run escapes. The second reel leaves the wrong card, and the error falls toward zero.',
  'The second reel ends near one half, not one. That fits the two equivalent coordinate programs, which differ only in the order of the multiplication.',
  'You can get the same effect without touching epsilon: multiply the loss by a million. All one hundred twenty paired runs then choose identical programs, and their final probabilities differ by almost nothing.',
  'The scoreboard: with the original epsilon, none of one hundred twenty runs recovered a program. Corrected, all sixty coordinate runs do, and fifty-nine of sixty two-add runs get every integer example right.',
  "One two-add seed still fails, and the settings were not retuned for it. The lab says epsilon caused most of the failure, not all of it, and the reassessment's numerical diagnosis is unfinished.",
];
/** ~150 wpm plus a little air */
const speak = (text: string) => text.split(/\s+/).length / 2.5 + 0.6;
const HOLD = 0.8;
const BEAT: number[] = [];
{
  let t = 0.4;
  for (const c of CAPTIONS) {
    BEAT.push(t);
    t += speak(c) + HOLD;
  }
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GRID, cameraInterp);
  const src = tl.channel('src', 0);
  // the table
  const buildU = tl.channel('buildU', 0);
  const gridOp = tl.channel('gridOp', 1);
  const infoU = tl.channel('infoU', 0);
  const infoOp = tl.channel('infoOp', 1);
  const dimsU = tl.channel('dimsU', 0);
  const cellLens = tl.channel('cellLens', 0);
  const zeroU = tl.channel('zeroRings', 0);
  const taskU = tl.channel('taskTwoAdd', 0);
  // the reels
  const reelU = tl.channel('reelU', 0);
  const overlayU = tl.channel('overlayU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const stepA = tl.channel('stepOriginal', 0);
  const stepB = tl.channel('stepCorrected', 0);
  const dialU = tl.channel('dialU', 0);
  const chartU = tl.channel('chartU', 0);
  // the split
  const split = tl.channel('split', 0);
  const rightU = tl.channel('rightPanel', 0);
  const leftSpot = tl.channel('leftSpot', 0);
  const wrongTag = tl.channel('wrongTag', 0);
  const adamU = tl.channel('adamU', 0);
  const adamBars = tl.channel('adamBars', 0);
  const escapeTag = tl.channel('escapeTag', 0);
  const twinU = tl.channel('twinU', 0);
  const scaledU = tl.channel('scaledU', 0);
  const equivU = tl.channel('equivU', 0);
  const machineOp = tl.channel('machineOp', 1);
  const boardU = tl.channel('boardU', 0);
  const boardRows = tl.channel('boardRows', 0);
  const boardTotals = tl.channel('boardTotals', 0);
  const seedU = tl.channel('seed519', 0);
  const statusU = tl.channel('statusU', 0);
  // focus: competing layers whisper while the camera is pushed in
  const groupOp = tl.channel('groupLabels', 1);
  const sideOp = tl.channel('sideColumn', 1);
  const headOp = tl.channel('headers', 1);

  BEAT.forEach((at, i) => tl.set(src, i, at));
  CAPTIONS.forEach((text, i) => tl.caption({ at: BEAT[i], dur: speak(text), text }));
  const end = (i: number) => BEAT[i] + speak(CAPTIONS[i]);

  // — B1 · every program on every example —
  let b = BEAT[0];
  tl.tween(infoU, 1, { at: b + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(buildU, 1, { at: b + 1.0, dur: 9.0, ease: ease.linear });
  tl.tween(cam, HOME, { at: b + 7.5, dur: 1.4, ease: ease.move });
  tl.hold(end(0), HOLD);

  // — B2 · 48 × 75, one cell = one program's mean error —
  b = BEAT[1];
  tl.tween(dimsU, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(cellLens, 1, { at: b + 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(cellLens, 0, { at: end(1) + 0.2, dur: 0.5, ease: ease.move });
  tl.hold(end(1), HOLD);

  // — B3 · the dark cells —
  b = BEAT[2];
  tl.tween(dimsU, 0.1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(infoOp, 0.1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(groupOp, 0.1, { at: b + 1.2, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_ZERO, { at: b + 1.6, dur: 1.4, ease: ease.move });
  tl.tween(zeroU, 1, { at: b + 3.0, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAM_TWOADD, { at: b + 6.4, dur: 1.2, ease: ease.move });
  tl.tween(taskU, 1, { at: b + 6.6, dur: 0.9, ease: ease.move });
  tl.tween(zeroU, 2, { at: b + 7.2, dur: 0.6, ease: ease.pop });
  tl.hold(end(2), HOLD);

  // — B4 · one probability per row and per column —
  b = BEAT[3];
  tl.tween(taskU, 0, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(zeroU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(infoOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(dimsU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_REELS, { at: b + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(reelU, 1, { at: b + 2.4, dur: 1.2, ease: ease.enter });
  tl.tween(overlayU, 1, { at: b + 5.5, dur: 1.0, ease: ease.enter });
  tl.tween(cam, HOME, { at: b + 7.6, dur: 1.4, ease: ease.move });
  tl.tween(groupOp, 1, { at: b + 8.0, dur: 0.6, ease: ease.move });
  tl.tween(formulaU, 1, { at: b + 8.4, dur: 0.7, ease: ease.enter });
  tl.hold(end(3), HOLD);

  // — B5 · the temperature cools; reels sharpen (shared history: steps 0–1,000) —
  b = BEAT[4];
  tl.tween(dialU, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(chartU, 1, { at: b + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(stepA, 500, { at: b + 1.8, dur: 4.0, ease: ease.linear });
  tl.tween(stepA, 1000, { at: b + 6.4, dur: 4.6, ease: ease.linear });
  tl.tween(stepB, 500, { at: b + 1.8, dur: 4.0, ease: ease.linear });
  tl.tween(stepB, 1000, { at: b + 6.4, dur: 4.6, ease: ease.linear });
  tl.hold(end(4), HOLD);

  // — B6 · split: the original epsilon locks onto the wrong card —
  b = BEAT[5];
  tl.tween(formulaU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(split, 1, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(rightU, 1, { at: b + 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(leftSpot, 1, { at: b + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(stepA, TOTAL, { at: b + 6.6, dur: 4.0, ease: ease.linear });
  tl.tween(wrongTag, 1, { at: b + 7.6, dur: 0.6, ease: ease.enter });
  tl.hold(end(5), HOLD);

  // — B7 · Adam's denominator —
  b = BEAT[6];
  tl.tween(cam, CAM_ADAM, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(sideOp, 0.1, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(headOp, 0.1, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(adamU, 1, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(adamBars, 1, { at: b + 4.4, dur: 1.2, ease: ease.draw });
  tl.hold(end(6), HOLD);

  // — B8 · epsilon 1e-14: the same run escapes —
  b = BEAT[7];
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(adamU, 0, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(sideOp, 1, { at: b + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(headOp, 1, { at: b + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(leftSpot, 0.15, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(stepB, TOTAL, { at: b + 1.6, dur: 5.2, ease: ease.linear });
  tl.tween(escapeTag, 1, { at: b + 6.0, dur: 0.6, ease: ease.enter });
  tl.hold(end(7), HOLD);

  // — B9 · two near-equal bars —
  b = BEAT[8];
  tl.tween(cam, CAM_TWIN, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(sideOp, 0.1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(headOp, 0.1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(escapeTag, 0.1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(twinU, 1, { at: b + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, HOME, { at: end(8) + 0.1, dur: 1.2, ease: ease.move });
  tl.hold(end(8), HOLD);

  // — B10 · loss × 1e6 is the same correction —
  b = BEAT[9];
  tl.tween(twinU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(sideOp, 1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(headOp, 1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(scaledU, 1, { at: b + 3.4, dur: 1.4, ease: ease.draw });
  tl.tween(equivU, 1, { at: b + 4.6, dur: 0.7, ease: ease.enter });
  tl.hold(end(9), HOLD);

  // — B11 · the scoreboard —
  b = BEAT[10];
  tl.tween(cam, HOME, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(machineOp, 0.12, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(equivU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(boardU, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(boardRows, 1, { at: b + 1.4, dur: 1.6, ease: ease.linear });
  tl.tween(boardTotals, 1, { at: b + 6.0, dur: 0.6, ease: ease.pop });
  tl.hold(end(10), HOLD);

  // — B12 · seed 519 —
  b = BEAT[11];
  tl.tween(cam, CAM_519, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(seedU, 1, { at: b + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(machineOp, 0.06, { at: b + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(cam, HOME, { at: b + 7.8, dur: 1.3, ease: ease.move });
  tl.tween(statusU, 1, { at: b + 8.0, dur: 0.7, ease: ease.enter });
  tl.hold(end(11), 2.4);

  return {
    tl, cam, src, buildU, gridOp, infoU, infoOp, dimsU, cellLens, zeroU, taskU, reelU, overlayU, formulaU,
    stepA, stepB, dialU, chartU, split, rightU, leftSpot, wrongTag, adamU, adamBars, escapeTag, twinU,
    scaledU, equivU, machineOp, boardU, boardRows, boardTotals, seedU, statusU, groupOp, sideOp, headOp,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Sampling helpers
// ---------------------------------------------------------------------------

/** the reels at a fractional step: lerp between checkpoints */
function reelsAt(run: Run, step: number) {
  const k = clamp01(step / TOTAL) * (run.cp.length - 1);
  const a = Math.floor(k);
  const b2 = Math.min(run.cp.length - 1, a + 1);
  const u = k - a;
  const A = run.cp[a];
  const B = run.cp[b2];
  const p0 = new Float64Array(N0);
  const p1 = new Float64Array(N1);
  for (let i = 0; i < N0; i++) p0[i] = lerp(A.p0[i], B.p0[i], u);
  for (let i = 0; i < N1; i++) p1[i] = lerp(A.p1[i], B.p1[i], u);
  return { p0, p1 };
}
const lossAt = (run: Run, step: number) => run.loss[Math.round(clamp01(step / TOTAL) * TOTAL)];
const phaseOf = (step: number) => (step <= 0 ? 0 : Math.min(4, Math.floor((step - 1e-6) / STEPS)));

// ---------------------------------------------------------------------------
// Canvas: the two heat grids and the p0 · p1 veil
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  fill: (i: number) => string,
  alpha: number,
  veil: { p0: Float64Array; p1: Float64Array; u: number } | null,
) {
  if (alpha <= 0.005) return;
  const w = CW * pose.s;
  const h = CHh * pose.s;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < N0; i++) {
    for (let j = 0; j < N1; j++) {
      ctx.fillStyle = fill(i * N1 + j);
      ctx.fillRect(pose.tx + j * w, pose.ty + i * h, w - 0.6 * pose.s, h - 0.6 * pose.s);
    }
  }
  if (veil && veil.u > 0.005) {
    let m0 = 0;
    let m1 = 0;
    for (const v of veil.p0) m0 = Math.max(m0, v);
    for (const v of veil.p1) m1 = Math.max(m1, v);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < N0; i++) {
      const a = veil.p0[i] / m0;
      if (a < 0.02) continue;
      for (let j = 0; j < N1; j++) {
        const q = a * (veil.p1[j] / m1);
        if (q < 0.02) continue;
        ctx.globalAlpha = alpha * veil.u * 0.22 * Math.sqrt(q);
        ctx.fillRect(pose.tx + j * w, pose.ty + i * h, w - 0.6 * pose.s, h - 0.6 * pose.s);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawHeat(ctx: CanvasRenderingContext2D, s: SceneState) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const split = v(scene.split);
  const mOp = v(scene.machineOp) * v(scene.gridOp);
  const left = poseLerp(POSE_A, POSE_L, split);
  // the fill while it builds: crossfade the partial-mean snapshots
  const build = v(scene.buildU);
  const task = v(scene.taskU);
  let fill: (i: number) => string = (i) => COORD_FILL[i];
  let under: ((i: number) => string) | null = null;
  let underA = 0;
  if (build < 1) {
    const n = build * N_EX;
    let k = SNAP_N.findIndex((x) => x > n);
    if (k < 0) k = SNAP_N.length - 1;
    const prev = Math.max(0, k - 1);
    const u = k === 0 ? clamp01(n / SNAP_N[0]) : clamp01((n - SNAP_N[prev]) / (SNAP_N[k] - SNAP_N[prev]));
    under = k === 0 ? null : (i) => SNAP_COLORS[prev][i];
    fill = (i) => SNAP_COLORS[k][i];
    underA = 1;
    if (under) drawGrid(ctx, left, under, mOp * underA, null);
    drawGrid(ctx, left, fill, mOp * (k === 0 ? u : u), null);
    return;
  }
  const reelU = v(scene.reelU);
  const ov = v(scene.overlayU);
  const rA = reelsAt(OLD, v(scene.stepA));
  drawGrid(ctx, left, (i) => COORD_FILL[i], mOp * (1 - task), { ...rA, u: ov * reelU });
  if (task > 0.005) drawGrid(ctx, left, (i) => TWOADD_FILL[i], mOp * task, null);
  const rOp = v(scene.rightU) * mOp;
  if (rOp > 0.005) {
    const rB = reelsAt(NEW, v(scene.stepB));
    drawGrid(ctx, POSE_R, (i) => COORD_FILL[i], rOp, { ...rB, u: ov });
  }
}

// ---------------------------------------------------------------------------
// SVG pieces
// ---------------------------------------------------------------------------

const REEL_C = colors.SECONDARY;

/** The two reels of one machine: instruction 0 down the left edge, instruction 1 across the top. */
function Reels({ pose, p0, p1, u, opacity, mark0, mark1 }: {
  pose: Pose; p0: Float64Array; p1: Float64Array; u: number; opacity: number;
  mark0?: Record<number, string>; mark1?: Record<number, string>;
}) {
  if (opacity <= 0.005 || u <= 0.005) return null;
  const { tx, ty, s } = pose;
  const top = ty - GAP * s;
  const lft = tx - GAP * s;
  return (
    <g opacity={opacity}>
      {/* p = 1 guides */}
      <line x1={lft - RL * s} y1={ty} x2={lft - RL * s} y2={ty + GH * s} stroke={colors.GRID} strokeDasharray="2 4" />
      <line x1={tx} y1={top - RT * s} x2={tx + GW * s} y2={top - RT * s} stroke={colors.GRID} strokeDasharray="2 4" />
      {Array.from(p0, (p, i) => {
        const len = Math.max(0.8, Math.sqrt(p) * RL * s * u);
        return <rect key={`r${i}`} x={lft - len} y={ty + i * CHh * s + 0.6 * s} width={len} height={CHh * s - 1.4 * s} fill={mark0?.[i] ?? REEL_C} />;
      })}
      {Array.from(p1, (p, j) => {
        const len = Math.max(0.8, Math.sqrt(p) * RT * s * u);
        return <rect key={`c${j}`} x={tx + j * CW * s + 0.8 * s} y={top - len} width={CW * s - 1.6 * s} height={len} fill={mark1?.[j] ?? REEL_C} />;
      })}
    </g>
  );
}

/** Ring around one grid cell. */
function CellRing({ pose, idx, r = 7, color = '#ffffff', opacity = 1 }: { pose: Pose; idx: number; r?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const i = Math.floor(idx / N1);
  const j = idx % N1;
  return <circle cx={cellX(pose, j)} cy={cellY(pose, i)} r={r} fill="none" stroke={color} strokeWidth={1.6} opacity={opacity} />;
}

function Chip({ x, y, text, color = colors.MUTED, opacity = 1, size = 13, anchor = 'start', fill = colors.PANEL }: {
  x: number; y: number; text: string; color?: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * size * 0.602 + 16;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size - 3} width={w} height={size + 10} rx={5} fill={fill} stroke={color} strokeOpacity={0.55} />
      <text x={x0 + 8} y={y + 1} fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

function T({ x, y, children, size = 14, color = colors.TEXT, anchor = 'start', mono = true, weight, opacity = 1 }: {
  x: number; y: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fontFamily={mono ? MONO : colors.font.ui} fill={color} textAnchor={anchor} fontWeight={weight} opacity={opacity}>
      {children}
    </text>
  );
}

/** Temperature dial: five ticks, pointer on the current phase. */
function Dial({ step, opacity }: { step: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const ph = phaseOf(step);
  // ease the pointer across a phase boundary over the first 25 steps of a phase
  const into = step - ph * STEPS;
  const from = ph === 0 ? 0 : ph - 1;
  const a = lerp(DIAL_ANG[from], DIAL_ANG[ph], ph === 0 ? 1 : clamp01(into / 25));
  const { cx, cy, r } = DIAL;
  const arc = (a0: number, a1: number, rr: number) =>
    `M ${cx + rr * Math.cos(a0)} ${cy + rr * Math.sin(a0)} A ${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + rr * Math.cos(a1)} ${cy + rr * Math.sin(a1)}`;
  return (
    <g opacity={opacity}>
      <path d={arc(DIAL_ANG[0], DIAL_ANG[4], r)} fill="none" stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" />
      <path d={arc(DIAL_ANG[0], a, r)} fill="none" stroke={colors.WARM} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
      {PHASES.map((p, i) => (
        <g key={i}>
          <line x1={cx + (r - 9) * Math.cos(DIAL_ANG[i])} y1={cy + (r - 9) * Math.sin(DIAL_ANG[i])} x2={cx + (r + 9) * Math.cos(DIAL_ANG[i])} y2={cy + (r + 9) * Math.sin(DIAL_ANG[i])} stroke={i === ph ? colors.TEXT : colors.MUTED} strokeWidth={2} />
          <T x={cx + (r + 24) * Math.cos(DIAL_ANG[i])} y={cy + (r + 24) * Math.sin(DIAL_ANG[i]) + 5} size={13} anchor="middle" color={i === ph ? colors.TEXT : colors.MUTED}>
            {String(p.T)}
          </T>
        </g>
      ))}
      <line x1={cx} y1={cy} x2={cx + (r - 14) * Math.cos(a)} y2={cy + (r - 14) * Math.sin(a)} stroke={colors.TEXT} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={colors.TEXT} />
      <T x={cx} y={cy + 62} size={13} anchor="middle" color={colors.MUTED}>temperature</T>
      <T x={1130} y={142} size={14} color={colors.TEXT}>{`T = ${PHASES[ph].T}`}</T>
      <T x={1130} y={164} size={13} color={colors.MUTED}>{`lr ${PHASES[ph].lr}`}</T>
      <T x={1130} y={186} size={13} color={colors.MUTED}>{`step ${commas(Math.min(STEPS, Math.max(0, step - ph * STEPS)))} / 500`}</T>
      <T x={1130} y={208} size={13} color={colors.MUTED}>{`phase ${ph + 1} of 5`}</T>
    </g>
  );
}

function LossChart({ s, opacity }: { s: SceneState; opacity: number }) {
  if (opacity <= 0.005) return null;
  const stA = s.get(scene.stepA);
  const stB = s.get(scene.stepB);
  const split = s.get(scene.split);
  const scaledU = s.get(scene.scaledU);
  const nA = Math.round(stA / 5);
  const nB = Math.round(stB / 5);
  const ticks = [0, -4, -8, -12, -16];
  const lastOld = PTS_OLD[Math.min(PTS_OLD.length - 1, nA)];
  const lastNew = PTS_NEW[Math.min(PTS_NEW.length - 1, nB)];
  return (
    <g opacity={opacity}>
      <T x={CHART.x0 - 46} y={CHART.y1 - 22} size={13} color={colors.MUTED}>expected loss (log)</T>
      {ticks.map((e) => (
        <g key={e}>
          <line x1={CHART.x0} y1={chartY(10 ** e)} x2={CHART.x1} y2={chartY(10 ** e)} stroke={colors.GRID} />
          <T x={CHART.x0 - 6} y={chartY(10 ** e) + 4} size={12} anchor="end" color={colors.MUTED}>{e === 0 ? '1' : `1e${e}`}</T>
        </g>
      ))}
      {PHASES.map((p, i) => (
        <g key={i}>
          {i > 0 && <line x1={chartX(i * STEPS)} y1={CHART.y1} x2={chartX(i * STEPS)} y2={CHART.y0} stroke={colors.GRID} strokeDasharray="3 4" />}
          <T x={chartX(i * STEPS + STEPS / 2)} y={CHART.y0 + 18} size={12} anchor="middle" color={colors.MUTED}>{String(p.T)}</T>
        </g>
      ))}
      <T x={(CHART.x0 + CHART.x1) / 2} y={CHART.y0 + 36} size={12} anchor="middle" color={colors.MUTED}>temperature · 500 steps each</T>
      {nB > 0 && (
        <polyline points={PTS_NEW.slice(0, nB + 1).map((p) => p.join(',')).join(' ')} fill="none" stroke={split > 0.5 ? colors.POSITIVE : REEL_C} strokeWidth={2.5} opacity={split > 0.5 ? 1 : 0} />
      )}
      {scaledU > 0.005 && (
        <polyline points={PTS_SCALED.slice(0, Math.round(scaledU * (PTS_SCALED.length - 1)) + 1).map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="6 6" />
      )}
      {nA > 0 && (
        <polyline points={PTS_OLD.slice(0, nA + 1).map((p) => p.join(',')).join(' ')} fill="none" stroke={split > 0.5 ? colors.NEGATIVE : REEL_C} strokeWidth={2.5} />
      )}
      {nA > 0 && <circle cx={lastOld[0]} cy={lastOld[1]} r={3.5} fill={split > 0.5 ? colors.NEGATIVE : REEL_C} />}
      {split > 0.5 && nB > 0 && <circle cx={lastNew[0]} cy={lastNew[1]} r={3.5} fill={colors.POSITIVE} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(v(scene.src))));
  const chip = `${PIN} · ${SOURCES[srcIdx]}`;

  const split = v(scene.split);
  const mOp = v(scene.machineOp);
  const left = poseLerp(POSE_A, POSE_L, split);
  const build = v(scene.buildU);
  const nEx = Math.max(1, Math.min(N_EX, Math.round(build * N_EX)));
  const ex = exampleAt(nEx - 1);
  const stA = v(scene.stepA);
  const stB = v(scene.stepB);
  const rA = reelsAt(OLD, stA);
  const rB = reelsAt(NEW, stB);
  const reelU = v(scene.reelU);
  const rightU = v(scene.rightU);
  const leftSpot = v(scene.leftSpot);
  const wrongTag = v(scene.wrongTag);
  const escape = v(scene.escapeTag);
  const twin = v(scene.twinU);
  const zero = v(scene.zeroU);
  const task = v(scene.taskU);
  const infoOp = v(scene.infoU) * v(scene.infoOp);
  const dims = v(scene.dimsU);
  const lens = v(scene.cellLens);
  const formula = v(scene.formulaU);
  const dialOp = v(scene.dialU) * mOp;
  const adam = v(scene.adamU);
  const adamBars = v(scene.adamBars);
  const equiv = v(scene.equivU);
  const board = v(scene.boardU);
  const rows = v(scene.boardRows);
  const totals = v(scene.boardTotals);
  const seed = v(scene.seedU);
  const status = v(scene.statusU);

  // reel highlights
  const lockA = rA.p0[I0_WIN] > 0.5 && split > 0.5;
  const mark0A: Record<number, string> = lockA ? { [I0_WIN]: colors.POSITIVE } : {};
  const mark1A: Record<number, string> = wrongTag > 0.3 ? { [I1_WRONG]: colors.NEGATIVE } : {};
  const escaped = stB > 1500;
  const mark0B: Record<number, string> = escaped ? { [I0_WIN]: colors.POSITIVE } : {};
  const mark1B: Record<number, string> = escaped ? { [I1_RIGHT]: colors.POSITIVE, [I1_TWIN]: colors.POSITIVE } : {};

  const rightOp = mOp * rightU;
  // beat 6: the right run waits at 0.35; from beat 8 on the left run steps back to 0.35
  const rightDim = leftSpot > 0.5 && stB < 1001 ? 0.35 : 1;
  const leftAfter = stB > 1001 ? 0.35 : 1;
  // left-panel labels hide under the Adam and equivalence plates
  const headOp = v(scene.headOp);
  const leftLbl = (1 - Math.max(adam, equiv)) * headOp;
  const side = v(scene.sideOp);
  const groupOp = v(scene.groupOp);

  // the wrong card on the left grid, the zero cells on the right
  const wrongCell = I0_WIN * N1 + I1_WRONG;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the table(s): canvas heat ================= */}
        <CanvasLayer state={s} draw={drawHeat} />
        {/* soften the left grid when the right one is the subject */}
        {leftAfter < 1 && (
          <rect x={left.tx - 2} y={left.ty - 2} width={GW * left.s + 4} height={GH * left.s + 4} fill={colors.BG} opacity={0.55} />
        )}
        {rightDim < 1 && rightOp > 0.005 && (
          <rect x={POSE_R.tx - 2} y={POSE_R.ty - 2} width={GW * POSE_R.s + 4} height={GH * POSE_R.s + 4} fill={colors.BG} opacity={0.5 * rightU} />
        )}

        {/* group separators + labels (single machine only) */}
        {mOp * (1 - split) > 0.005 && (
          <g opacity={mOp * (1 - split) * clamp01(build * 4) * groupOp}>
            {[1, 2].map((g) => (
              <g key={g}>
                <line x1={left.tx + g * 25 * CW} y1={left.ty} x2={left.tx + g * 25 * CW} y2={left.ty + GH} stroke={colors.BG} strokeWidth={2} />
                <line x1={left.tx} y1={left.ty + g * 16 * CHh} x2={left.tx + GW} y2={left.ty + g * 16 * CHh} stroke={colors.BG} strokeWidth={2} />
              </g>
            ))}
            {OPS.map((op, g) => (
              <T key={op} x={left.tx + (g * 25 + 12.5) * CW} y={left.ty + GH + 18} size={12} anchor="middle" color={colors.MUTED}>{op}</T>
            ))}
            {OPS.map((op, g) => (
              <T key={`r${op}`} x={left.tx - GAP - (reelU > 0.01 ? RL + 6 : 6)} y={left.ty + (g * 16 + 8) * CHh + 4} size={12} anchor="end" color={colors.MUTED}>{op}</T>
            ))}
          </g>
        )}

        {/* ================= B1–B2 · build info (right column) ================= */}
        {infoOp > 0.005 && (
          <g opacity={infoOp}>
            <T x={880} y={120} size={15} color={colors.TEXT} weight={700}>buildProgramLossMatrix</T>
            <T x={880} y={146} size={13} color={colors.MUTED}>3,600 programs × every example</T>
            <T x={880} y={186} size={13} color={colors.MUTED}>{`example ${commas(nEx)} / 14,739`}</T>
            <T x={880} y={208} size={13} color={colors.TEXT}>{`pointerX ${ex.pointerX}  panelLeft ${ex.panelLeft}`}</T>
            <T x={880} y={228} size={13} color={colors.TEXT}>{`scale ${ex.scale}  distractor ${ex.distractor}`}</T>
            <T x={880} y={272} size={22} color={colors.WARM} weight={700}>{commas(nEx * N0)}</T>
            <T x={880} y={292} size={13} color={colors.MUTED}>first-instruction evaluations</T>
            <T x={880} y={330} size={22} color={colors.WARM} weight={700}>{commas(nEx * N0 * N1)}</T>
            <T x={880} y={350} size={13} color={colors.MUTED}>second-instruction evaluations</T>
            <T x={880} y={392} size={13} color={colors.MUTED} opacity={clamp01(build * 1.2 - 0.2) > 0.99 ? 1 : 0}>
              {`totals: ${commas(FIRST_EVALS)} · ${commas(SECOND_EVALS)}`}
            </T>
          </g>
        )}
        {dims > 0.005 && (
          <g opacity={dims}>
            <T x={left.tx + GW / 2} y={left.ty - 14} size={14} anchor="middle" color={colors.TEXT} opacity={zero > 0.005 ? 0 : 1}>75 columns · instruction 1</T>
            <g transform={`translate(${left.tx - 82}, ${left.ty + GH / 2}) rotate(-90)`}>
              <T x={0} y={0} size={14} anchor="middle" color={colors.TEXT}>48 rows · instruction 0</T>
            </g>
            <Chip x={880} y={440} text="14,739 examples" color={colors.TEXT} />
            <Chip x={880} y={472} text={`${commas(TABLE_BYTES)} bytes (Float64)`} color={colors.MUTED} />
          </g>
        )}
        {lens > 0.005 && (
          <g opacity={lens}>
            <CellRing pose={left} idx={0} r={9} />
            <line x1={cellX(left, 0) + 7} y1={cellY(left, 0) - 7} x2={330} y2={140} stroke="#ffffff" strokeWidth={1.5} />
            <rect x={330} y={110} width={440} height={50} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={342} y={130} size={13} color={colors.TEXT}>{`${cardName(C0[CELL0.i])} → ${cardName(C1[CELL0.j])}`}</T>
            <T x={342} y={150} size={13} color={colors.MUTED}>{`mean error over 14,739 examples = ${CELL0.loss.toFixed(4)}`}</T>
          </g>
        )}

        {/* ================= B3 · zero-loss cells ================= */}
        {zero > 0.005 && (
          <g>
            {COORD.zeros.map((z) => (
              <CellRing key={`c${z}`} pose={left} idx={z} r={lerp(14, 7, clamp01(zero))} color={colors.TEXT} opacity={clamp01(zero) * (1 - task)} />
            ))}
            {TWOADD.zeros.map((z) => (
              <CellRing key={`t${z}`} pose={left} idx={z} r={lerp(14, 7, clamp01(zero - 1))} color={colors.TEXT} opacity={clamp01(zero - 1) * task} />
            ))}
            <Chip x={left.tx} y={172} text={task > 0.5 ? 'task: two-add' : 'task: coordinate'} color={colors.WARM} opacity={clamp01(zero)} />
            <Chip x={410} y={172} text={task > 0.5 ? 'two-add: 12 zero-loss programs' : 'coordinate: 2 zero-loss programs'} color={colors.TEXT} opacity={clamp01(zero) * Math.abs(task * 2 - 1)} />
          </g>
        )}

        {/* ================= the reels ================= */}
        <Reels pose={left} p0={rA.p0} p1={rA.p1} u={reelU} opacity={mOp * leftAfter} mark0={mark0A} mark1={mark1A} />
        <Reels pose={POSE_R} p0={rB.p0} p1={rB.p1} u={reelU} opacity={rightOp * rightDim} mark0={mark0B} mark1={mark1B} />
        {reelU > 0.005 && split < 0.5 && (
          <g opacity={mOp * reelU * (1 - split * 2)}>
            <T x={left.tx - GAP - RL} y={left.ty - 28} size={13} color={colors.MUTED}>p0 · 48 rows</T>
            <T x={left.tx - GAP - RL} y={left.ty - 12} size={12} color={colors.MUTED}>{`max ${rA.p0.reduce((m, x) => Math.max(m, x), 0).toFixed(4)}`}</T>
            <T x={left.tx + GW + 8} y={left.ty - GAP - RT + 4} size={13} color={colors.MUTED}>p1 · 75 columns</T>
            <T x={left.tx + GW + 8} y={left.ty - GAP - RT + 22} size={12} color={colors.MUTED}>{`max ${rA.p1.reduce((m, x) => Math.max(m, x), 0).toFixed(4)}`}</T>
            <T x={left.tx + GW + 8} y={left.ty - GAP - RT + 40} size={12} color={colors.MUTED}>{'bar length ∝ √p'}</T>
          </g>
        )}
        {/* the formula */}
        {formula > 0.005 && (
          <g opacity={formula * mOp}>
            <rect x={265} y={570} width={500} height={44} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={515} y={599} textAnchor="middle" fontSize={20} fontFamily={colors.font.math} fill={colors.TEXT}>
              <tspan fontStyle="italic">p</tspan><tspan fontSize={14} dy={5}>0</tspan><tspan fontSize={14} dy={-13}>⊤</tspan>
              <tspan dy={8} fontStyle="italic"> L p</tspan><tspan fontSize={14} dy={5}>1</tspan>
              <tspan dy={-5}>{'  =  Σ'}</tspan><tspan fontSize={13} dy={6}>i,j</tspan>
              <tspan dy={-6} fontStyle="italic">{'  p'}</tspan><tspan fontSize={14} dy={5}>0</tspan>
              <tspan dy={-5}>[i] · </tspan><tspan fontStyle="italic">L</tspan><tspan>[i, j] · </tspan>
              <tspan fontStyle="italic">p</tspan><tspan fontSize={14} dy={5}>1</tspan><tspan dy={-5}>[j]</tspan>
            </text>
          </g>
        )}
        {formula > 0.005 && (
          <T x={left.tx} y={left.ty - GAP - RT - 10} size={13} color={colors.MUTED} opacity={formula * mOp * (1 - split)}>
            {`trainWithExpectedProgramLoss · expected loss ${sci(lossAt(OLD, stA), 3)}`}
          </T>
        )}

        {/* ================= split headers ================= */}
        {split > 0.005 && (
          <g opacity={mOp * clamp01(split * 2 - 1)}>
            <T x={40} y={110} size={15} color={colors.NEGATIVE} weight={700} opacity={leftAfter * headOp}>original · adamEpsilon: 1e-8</T>
            <T x={40} y={130} size={12} color={colors.MUTED} opacity={leftAfter * headOp}>one run: coordinate, seed 541</T>
            <T x={484} y={110} size={15} color={colors.POSITIVE} weight={700} opacity={rightU * headOp}>corrected · adamEpsilon: 1e-14</T>
            <T x={484} y={130} size={12} color={colors.MUTED} opacity={rightU * headOp}>{stB < 1001 ? 'same seed · identical through T = 1, waiting' : 'same seed, same table'}</T>
          </g>
        )}
        {/* B6 labels on the left panel */}
        {leftSpot > 0.005 && split > 0.5 && (
          <g opacity={mOp * leftSpot * leftAfter * leftLbl}>
            <T x={40} y={414} size={13} color={colors.POSITIVE}>{`reel 1 → ${cardName(C0[I0_WIN])}`}</T>
            <T x={40} y={432} size={12} color={colors.MUTED}>{`p = ${rA.p0[I0_WIN].toFixed(4)}`}</T>
          </g>
        )}
        {wrongTag > 0.005 && (
          <g opacity={mOp * wrongTag * leftAfter}>
            <CellRing pose={left} idx={wrongCell} r={6} color={colors.NEGATIVE} />
            <g opacity={leftLbl}>
            <T x={40} y={458} size={13} color={colors.NEGATIVE}>{`reel 2 → ${cardName(C1[I1_WRONG])}  ✗ wrong card`}</T>
            <T x={40} y={476} size={12} color={colors.MUTED}>{`p = ${rA.p1[I1_WRONG].toFixed(4)} · loss stuck at ${sci(lossAt(OLD, stA), 4)}`}</T>
            </g>
          </g>
        )}
        {/* B8 */}
        {escape > 0.005 && (
          <g opacity={mOp * escape * (1 - equiv)}>
            {COORD.zeros.map((z) => (
              <CellRing key={z} pose={POSE_R} idx={z} r={5} color={colors.TEXT} />
            ))}
            <T x={484} y={414} size={13} color={colors.POSITIVE}>{`reel 2 leaves ${cardName(C1[I1_WRONG])}`}</T>
            <T x={484} y={434} size={12} color={colors.MUTED}>
              {`loss by phase: ${sci(NEW.phaseEnd[1].loss, 3)} → ${sci(NEW.phaseEnd[2].loss, 1)} → ${sci(NEW.phaseEnd[3].loss, 1)} → ${sci(NEW.phaseEnd[4].loss, 1)}`}
            </T>
          </g>
        )}
        {/* B9: the two near-equal bars */}
        {twin > 0.005 && (
          <g opacity={mOp * twin}>
            {[I1_TWIN, I1_RIGHT].map((j, k) => {
              const x = POSE_R.tx + (j * CW + CW / 2) * POSE_R.s;
              const yTop = POSE_R.ty - GAP * POSE_R.s - Math.sqrt(rB.p1[j]) * RT * POSE_R.s;
              const lx = k === 0 ? x - 10 : x + 10;
              const anchor = k === 0 ? 'end' : 'start';
              return (
                <g key={j}>
                  <polyline points={`${x},${yTop - 3} ${x},${158} ${lx},${150}`} fill="none" stroke={colors.TEXT} strokeWidth={1} />
                  <T x={lx} y={132} size={13} anchor={anchor} color={colors.TEXT}>{cardName(C1[j])}</T>
                  <T x={lx} y={150} size={13} anchor={anchor} color={colors.POSITIVE}>{`p = ${(k === 0 ? P_TWIN : P_RIGHT).toFixed(4)}`}</T>
                </g>
              );
            })}
            <Chip x={855} y={98} text="inference: two equivalent orderings" color={colors.WARM} anchor="middle" size={13} />
          </g>
        )}

        {/* ================= dial + loss chart (right column) ================= */}
        <Dial step={Math.max(stA, stB)} opacity={dialOp * side} />
        <LossChart s={s} opacity={v(scene.chartU) * mOp * side} />
        {split > 0.5 && v(scene.chartU) > 0 && (
          <g opacity={mOp * side}>
            <T x={CHART.x0} y={CHART.y0 + 58} size={13} color={colors.NEGATIVE}>{`original ${sci(lossAt(OLD, stA), 4)}`}</T>
            <T x={CHART.x0} y={CHART.y0 + 76} size={13} color={colors.POSITIVE}>{`corrected ${sci(lossAt(NEW, stB), 2)}`}</T>
          </g>
        )}

        {/* ================= B7 · Adam ================= */}
        {adam > 0.005 && (
          <g opacity={adam}>
            <rect x={40} y={398} width={850} height={222} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={60} y={428} size={13} color={colors.MUTED}>Adam update (discrete-training.ts:314)</T>
            <T x={60} y={460} size={20} color={colors.TEXT}>logit -= lr * m̂ / (sqrt(v̂) + adamEpsilon)</T>
            <T x={60} y={492} size={13} color={colors.MUTED}>
              {`measured in a port: seed 541, T = 0.5, first step, logit of ${cardName(C1[I1_RIGHT])}`}
            </T>
            {adamBars > 0.005 && (
              <g opacity={adamBars}>
                {(() => {
                  // log number line 1e-13 .. 1e-7 for the denominator terms
                  const X0 = 90;
                  const X1 = 560;
                  const lx = (val: number) => lerp(X0, X1, (Math.log10(val) + 13) / 6);
                  const y = 540;
                  return (
                    <g>
                      <line x1={X0} y1={y} x2={lerp(X0, X1, adamBars)} y2={y} stroke={colors.MUTED} strokeWidth={1.5} />
                      {[-13, -12, -11, -10, -9, -8, -7].map((e) => (
                        <g key={e}>
                          <line x1={lx(10 ** e)} y1={y - 4} x2={lx(10 ** e)} y2={y + 4} stroke={colors.MUTED} />
                          <T x={lx(10 ** e)} y={y + 20} size={12} anchor="middle" color={colors.MUTED}>{`1e${e}`}</T>
                        </g>
                      ))}
                      <circle cx={lx(ADAM_OLD.sqrtV)} cy={y} r={6} fill={colors.TEXT} />
                      <T x={lx(ADAM_OLD.sqrtV)} y={y - 14} size={13} anchor="middle" color={colors.TEXT}>{`sqrt(v̂) ${sci(ADAM_OLD.sqrtV)}`}</T>
                      <circle cx={lx(1e-8)} cy={y} r={6} fill={colors.NEGATIVE} />
                      <T x={lx(1e-8)} y={y - 14} size={13} anchor="middle" color={colors.NEGATIVE}>ε = 1e-8</T>
                      <T x={X0} y={y + 52} size={13} color={colors.NEGATIVE}>{`ε dominates: step ${sci(ADAM_OLD.step)} of lr 0.01`}</T>
                      <T x={X0 + 400} y={y + 52} size={13} color={colors.POSITIVE}>{`with ε = 1e-14: step ${ADAM_NEW.step.toFixed(5)}`}</T>
                      <path d={`M 620 ${y} L 760 ${y}`} stroke={colors.NEGATIVE} strokeWidth={2} />
                      <path d={`M 760 ${y - 6} L 772 ${y} L 760 ${y + 6} Z`} fill={colors.NEGATIVE} />
                      <T x={690} y={y - 12} size={13} anchor="middle" color={colors.NEGATIVE}>shrinks the step</T>
                      <T x={690} y={y + 22} size={12} anchor="middle" color={colors.MUTED}>{`÷ ${commas(ADAM_NEW.step / ADAM_OLD.step)}`}</T>
                    </g>
                  );
                })()}
              </g>
            )}
          </g>
        )}

        {/* ================= B10 · loss × 1e6 ≡ epsilon 1e-14 ================= */}
        {equiv > 0.005 && (
          <g opacity={equiv}>
            <rect x={40} y={430} width={850} height={190} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={60} y={462} size={15} color={colors.WARM}>{'lossMultiplier: 1e6, adamEpsilon: 1e-8'}</T>
            <T x={440} y={462} size={15} color={colors.MUTED}>≡</T>
            <T x={480} y={462} size={15} color={colors.POSITIVE}>adamEpsilon: 1e-14</T>
            <T x={60} y={486} size={12} color={colors.MUTED}>the loss table is not modified · dashed amber line: this run, overlaid on the corrected one</T>
            <T x={60} y={530} size={22} color={colors.TEXT} weight={700}>120 paired runs, 0 different programs</T>
            <T x={60} y={566} size={14} color={colors.TEXT}>max probability gap 7.1e-7 (two-add) / 1.1e-13 (coordinate)</T>
            <T x={60} y={594} size={12} color={colors.MUTED}>study-results.json · epsilonScalingAgreement, six studies of 20 seeds</T>
          </g>
        )}

        {/* ================= B11–B12 · scoreboard ================= */}
        {board > 0.005 && (
          <g opacity={board}>
            <rect x={SB.x} y={SB.y} width={SB.w} height={SB.rowH * 8 + 30} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={SB.x + 24} y={SB.y + 34} size={14} color={colors.MUTED}>task, seeds</T>
            <T x={SB.x + 380} y={SB.y + 34} size={14} color={colors.NEGATIVE} anchor="middle">original ε</T>
            <T x={SB.x + 545} y={SB.y + 26} size={14} color={colors.POSITIVE} anchor="middle">corrected ε</T>
            <T x={SB.x + 545} y={SB.y + 42} size={12} color={colors.MUTED} anchor="middle">every integer example right</T>
            {BOARD.map((r, i) => {
              const u = clamp01(rows * 6 - i);
              const y = SB.y + 52 + (i + 1) * SB.rowH - 14;
              const hot = i === 0 && seed > 0.005;
              return (
                <g key={i} opacity={u * (seed > 0.005 && i !== 0 ? lerp(1, 0.35, seed) : 1)}>
                  {hot && <rect x={SB.x + 10} y={y - 26} width={SB.w - 20} height={38} rx={6} fill={colors.WARM} opacity={0.12 * seed} />}
                  <T x={SB.x + 24} y={y} size={15} color={colors.TEXT}>{`${r.task} · ${r.seeds}`}</T>
                  <T x={SB.x + 380} y={y} size={18} anchor="middle" color={colors.NEGATIVE}>{`${r.original} / 20`}</T>
                  <T x={SB.x + 545} y={y} size={18} anchor="middle" color={r.corrected === 20 ? colors.POSITIVE : colors.WARM}>{`${r.corrected} / 20`}</T>
                </g>
              );
            })}
            {totals > 0.005 && (
              <g opacity={clamp01(totals) * (seed > 0.005 ? lerp(1, 0.35, seed) : 1)}>
                <line x1={SB.x + 20} y1={SB.y + 52 + 7 * SB.rowH - 34} x2={SB.x + SB.w - 20} y2={SB.y + 52 + 7 * SB.rowH - 34} stroke={colors.GRID} />
                <T x={SB.x + 24} y={SB.y + 52 + 7 * SB.rowH - 4} size={15} color={colors.MUTED}>total</T>
                <T x={SB.x + 380} y={SB.y + 52 + 7 * SB.rowH - 4} size={20} anchor="middle" color={colors.NEGATIVE} weight={700}>0 / 120</T>
                <T x={SB.x + 545} y={SB.y + 52 + 7 * SB.rowH - 12} size={15} anchor="middle" color={colors.POSITIVE} weight={700}>coordinate 60 / 60</T>
                <T x={SB.x + 545} y={SB.y + 52 + 7 * SB.rowH + 8} size={15} anchor="middle" color={colors.WARM} weight={700}>two-add 59 / 60</T>
              </g>
            )}
            {seed > 0.005 && (
              <g opacity={seed}>
                <T x={SB.x + 612} y={SB.y + 52 + SB.rowH - 14} size={13} color={colors.WARM}>seed 519 ✗</T>
                <rect x={SB.x + 60} y={SB.y + SB.rowH * 8 + 42} width={SB.w - 120} height={56} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.6} />
                <T x={SB.x + 80} y={SB.y + SB.rowH * 8 + 65} size={14} color={colors.TEXT}>seed 519, corrected: program 27, loss 0.000732421875</T>
                <T x={SB.x + 80} y={SB.y + SB.rowH * 8 + 86} size={12} color={colors.MUTED}>settings not retuned for it · README.md:76</T>
              </g>
            )}
          </g>
        )}
        {status > 0.005 && (
          <g opacity={status}>
            <Chip x={640} y={104} text="holds on this task · diagnosis unfinished" color={colors.WARM} anchor="middle" size={15} fill={colors.BG} />
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip + source chip ================= */}
      <rect x={40} y={18} width={190} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        2 · Cooling the Reels
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
    </>
  );
}

export const vizScene = () => scene;
