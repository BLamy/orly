// What Integers Cannot Say
//
// Learned Program — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT),
// lab/learned-interpreter/ unless a path says otherwise.
//   program.ts:12-16, 54-64 (inputs, operations, candidate order: operation → left → right), 295-317 (executor)
//   oracle.ts:16-27 (twoAddOracle), 57-81 (the 17 × 17 × 3 × 17 = 14,739 training grid)
//   program.test.ts:111-132 (12 integer-exact programs, 4 survive full certification; the 1, 2^-24, -1 probe)
//   README.md:39-51 (39,605 cases = 37,188 integer + 2,401 fractional + 16 input-rounding; "Integer examples alone
//     cannot identify which grouping is required."), :65-72 (hard-loss table: 59 (5) · 20 (3) · 20 (7); coordinate
//     20 (20) × 3), :78 (124 reads, one sweep), :80 (3,600 reads, first minimum; 53,060,400 evaluations), :9
//     ("Neither establishes scalable program synthesis."), :94-101 (soft-output rows, historical), :105-107 (untested)
//   discrete-training.ts:48-106 (buildProgramLossMatrix: mean of 0.5 · ((output − target) / 256)^2),
//     503-522 (enumerateLossMatrix: first strict minimum), 524-564 (coordinateDescentOnLossMatrix)
//   training.ts:162 (trainProgram, the soft-output trainer), 273 (verifyProgram)
//   lab/status.md:196, :244 (status: holds / narrowed / open)
//   Fact-check: docs/book-plans/handwired-learned-interpreter/review.md (captions 6 and 10 carry its fixes).
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// Computed here at module scope, by a port of the lab's own candidate order, executor and oracle, and checked
// with throws: the twelve integer-exact two-add programs (over the full 14,739-example training grid), the four
// that survive the fractional probe, the float ladder (1 + 2^-24 rounds to 1; 2^-24 − 1 is exact), both
// groupings agreeing on every training example, the enumeration winner (pair 94, the first zero cell), and the
// coordinate-descent repair: real losses for row 1 and column 19, strict-improvement hops, and 124 reads.
// The repair starts from the probe run in the plan (two-add seed 501, original epsilon), whose decoded program is
// add(pointerX, panelLeft) then add(panelLeft, distractor). Only that run is drawn; the "124 reads" claim is the
// README's for every failure. The other 3,588 table cells are drawn uniformly as "error > 0" (not computed).
// Changed from the plan: the enumeration winner is pair index 94, not "index 0" (index 0 is add(pointerX,
// pointerX) twice); the soft ledger adds the two add-fixed rows dimmed, as the plan allows.
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const monoW = (n: number, fs: number): number => n * fs * 0.602;
const uiW = (n: number, fs: number): number => n * fs * 0.56;
const fmtInt = (n: number): string => n.toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The lab, ported (program.ts candidate order, oracle.ts, the training grid)
// ---------------------------------------------------------------------------

const F = Math.fround;
const REG = ['pointerX', 'panelLeft', 'scale', 'distractor', 'instruction0'] as const;
const OPS = ['add', 'subtract', 'multiply'] as const;
type Cand = { op: number; l: number; r: number };
const candidates = (n: number): Cand[] => {
  const out: Cand[] = [];
  for (let op = 0; op < 3; op++) for (let l = 0; l < n; l++) for (let r = 0; r < n; r++) out.push({ op, l, r });
  return out;
};
const FIRST = candidates(4); // 48
const SECOND = candidates(5); // 75
const N1 = SECOND.length;
const PAIRS = FIRST.length * N1; // 3,600
const evalCand = (c: Cand, regs: number[]): number =>
  c.op === 0 ? F(regs[c.l] + regs[c.r]) : c.op === 1 ? F(regs[c.l] - regs[c.r]) : F(regs[c.l] * regs[c.r]);
const runPair = (pair: number, x: number[]): number => {
  const regs = [F(x[0]), F(x[1]), F(x[2]), F(x[3]), 0];
  regs[4] = evalCand(FIRST[Math.floor(pair / N1)], regs);
  return evalCand(SECOND[pair % N1], regs);
};
const candName = (c: Cand): string => `${OPS[c.op]}(${REG[c.l]}, ${REG[c.r]})`;
/** twoAddOracle(inputs, 'distractor'): (pointerX + panelLeft) + distractor, FP32 after every step. */
const twoAdd = (x: number[]): number => F(F(F(x[0]) + F(x[1])) + F(x[3]));

const COORDS = Array.from({ length: 17 }, (_, i) => -16 + i * 2);
const TRAIN: number[][] = [];
for (const pX of COORDS) for (const pL of COORDS) for (const sc of [2, 4, 6]) for (const d of COORDS) TRAIN.push([pX, pL, sc, d]);
if (TRAIN.length !== 14_739) throw new Error('learned-interpreter ch3: training grid is not 14,739 examples');
const TARGETS = TRAIN.map(twoAdd);

// zero integer error on every training example (a cheap strided prefilter, then the full grid)
const PRE = Array.from({ length: 24 }, (_, k) => (k * 997 + 13) % TRAIN.length);
const EXACT: number[] = [];
for (let p = 0; p < PAIRS; p++) {
  if (!PRE.every((i) => runPair(p, TRAIN[i]) === TARGETS[i])) continue;
  if (TRAIN.every((x, i) => runPair(p, x) === TARGETS[i])) EXACT.push(p);
}
if (EXACT.length !== 12) throw new Error(`learned-interpreter ch3: expected 12 integer-exact programs, got ${EXACT.length}`);

const E24 = 2 ** -24;
const PROBE = [1, E24, 1, -1]; // pointerX, panelLeft, scale, distractor (program.test.ts:126)
const SURVIVORS = EXACT.filter((p) => runPair(p, PROBE) === twoAdd(PROBE));
if (SURVIVORS.length !== 4) throw new Error('learned-interpreter ch3: expected 4 programs to survive the probe');

/** The input the first addition leaves out: 3 → (pointerX + panelLeft) + distractor, the specified grouping. */
const thirdOf = (p: number): number => {
  const f = FIRST[Math.floor(p / N1)];
  return [0, 1, 3].find((i) => i !== f.l && i !== f.r)!;
};
const ROW_THIRD = [3, 0, 1];
const CHIP_ROWS: number[][] = ROW_THIRD.map((t) => EXACT.filter((p) => thirdOf(p) === t));
if (CHIP_ROWS.some((r) => r.length !== 4)) throw new Error('learned-interpreter ch3: groupings are not 4 × 3');
if (!SURVIVORS.every((p) => thirdOf(p) === 3)) throw new Error('learned-interpreter ch3: survivors are not the specified grouping');
const CHIPS = CHIP_ROWS.flatMap((row, ri) => row.map((pair, ci) => ({ pair, ri, ci })));

// the float ladder (exact FP32 arithmetic, checked)
const A1 = F(F(1) + F(E24));
const A2 = F(A1 + F(-1));
const B1 = F(F(E24) + F(-1));
const B2 = F(B1 + F(1));
if (A1 !== 1 || A2 !== 0 || B1 !== -1 + E24 || B2 !== E24 || twoAdd(PROBE) !== 0) {
  throw new Error('learned-interpreter ch3: float ladder disagrees with program.test.ts:126-132');
}

// both groupings over the training grid, binned by (pointerX, panelLeft)
const AGREE: number[][] = COORDS.map(() => COORDS.map(() => 0));
TRAIN.forEach((x) => {
  const a = F(F(x[0] + x[1]) + x[3]);
  const b = F(F(x[1] + x[3]) + x[0]);
  if (a === b) AGREE[(x[0] + 16) / 2][(x[1] + 16) / 2]++;
});
const AGREE_TOTAL = AGREE.flat().reduce((a, b) => a + b, 0);
if (AGREE_TOTAL !== TRAIN.length) throw new Error('learned-interpreter ch3: groupings disagree on a training example');

// enumerateLossMatrix: the first strict minimum is the first zero cell
const ENUM_WIN = Math.min(...EXACT);
if (ENUM_WIN !== 94 || !SURVIVORS.includes(ENUM_WIN)) throw new Error('learned-interpreter ch3: unexpected enumeration winner');
const ENUM_NAME = [candName(FIRST[Math.floor(ENUM_WIN / N1)]), candName(SECOND[ENUM_WIN % N1])];

// coordinateDescentOnLossMatrix from the probe's failed run, with real losses (lossScale 256)
const firstIdx = (op: number, l: number, r: number): number => op * 16 + l * 4 + r;
const secondIdx = (op: number, l: number, r: number): number => op * 25 + l * 5 + r;
const CD_START: [number, number] = [firstIdx(0, 0, 1), secondIdx(0, 1, 3)]; // add(pointerX, panelLeft) · add(panelLeft, distractor)
const lossOf = (pair: number): number => {
  let sum = 0;
  for (let i = 0; i < TRAIN.length; i++) {
    const e = (runPair(pair, TRAIN[i]) - TARGETS[i]) / 256;
    sum += 0.5 * e * e;
  }
  return sum / TRAIN.length;
};
type Hop = { step: number; first: number; second: number };
const CD = (() => {
  let [first, second] = CD_START;
  let loss = lossOf(first * N1 + second);
  const startLoss = loss;
  let reads = 1;
  const hops: Hop[] = [{ step: 0, first, second }];
  const rowLoss = SECOND.map((_, c) => lossOf(first * N1 + c));
  for (let c = 0; c < N1; c++) {
    reads++;
    if (rowLoss[c] < loss) {
      second = c;
      loss = rowLoss[c];
      hops.push({ step: reads - 1, first, second });
    }
  }
  const colLoss = FIRST.map((_, r) => lossOf(r * N1 + second));
  for (let r = 0; r < FIRST.length; r++) {
    reads++;
    if (colLoss[r] < loss) {
      first = r;
      loss = colLoss[r];
      hops.push({ step: reads - 1, first, second });
    }
  }
  return { startLoss, rowLoss, colLoss, hops, reads, loss, first, second };
})();
if (CD.reads !== 124 || CD.loss !== 0 || CD.first * N1 + CD.second !== ENUM_WIN) {
  throw new Error('learned-interpreter ch3: coordinate descent does not match README.md:78');
}
const CD_LOG = (() => {
  const all = [...CD.rowLoss, ...CD.colLoss].filter((v) => v > 0).map(Math.log10);
  return { lo: Math.min(...all), hi: Math.max(...all) };
})();
const lossShade = (v: number): number => (v === 0 ? 0 : 0.3 + (0.7 * (Math.log10(v) - CD_LOG.lo)) / Math.max(1e-9, CD_LOG.hi - CD_LOG.lo));
/** best (first, second) after `step` reads (step 0 = the starting score) */
const cdBest = (step: number): Hop => {
  let h = CD.hops[0];
  for (const x of CD.hops) if (x.step <= step) h = x;
  return h;
};

// counts quoted from the lab (README.md:41-45, :65-72, :94-101; discrete-training.ts:48-106)
const CERT = { integer: 37_188, fractional: 2_401, rounding: 16 };
const CERT_TOTAL = CERT.integer + CERT.fractional + CERT.rounding;
if (CERT_TOTAL !== 39_605) throw new Error('learned-interpreter ch3: certification split does not sum to 39,605');
const TABLE_EVALS = PAIRS * TRAIN.length;
if (TABLE_EVALS !== 53_060_400) throw new Error('learned-interpreter ch3: second-instruction evaluations');
const TALLY = [
  { task: 'two-add', rows: [{ label: 'integer examples', seg: [19, 20, 20] }, { label: 'full checks', seg: [5, 3, 7] }] },
  { task: 'coordinate', rows: [{ label: 'integer examples', seg: [20, 20, 20] }, { label: 'full checks', seg: [20, 20, 20] }] },
];
const SOFT = [
  { label: 'coordinate · seeds 101-120', int: '11/20', full: '11/20', dim: false },
  { label: 'coordinate · seeds 6101-6120', int: '11/20', full: '11/20', dim: false },
  { label: 'two adds, full vocabulary · 421-440', int: '0/20', full: '0/20', dim: false },
  { label: 'two adds, full vocabulary · 6201-6220', int: '0/20', full: '0/20', dim: false },
  { label: 'two adds, add fixed · 441-460', int: '20/20', full: '9/20', dim: true },
  { label: 'two adds, add fixed · 6301-6320', int: '18/20', full: '5/20', dim: true },
];

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 56;
// the twelve chips (rows = groupings, columns = operand orders)
const CHIP = { x0: 232, y0: 100, w: 240, h: 46, gx: 6, gy: 8 };
const chipRect = (ri: number, ci: number) => ({ x: CHIP.x0 + ci * (CHIP.w + CHIP.gx), y: CHIP.y0 + ri * (CHIP.h + CHIP.gy), w: CHIP.w, h: CHIP.h });
const ROW_LABELS = [
  ['(pointer + edge)', '+ distractor'],
  ['(edge + distractor)', '+ pointer'],
  ['(pointer + distractor)', '+ edge'],
];
// certification strip
const STRIP = { x: 232, y: 292, w: 978, h: 24 };
const STRIP_INT_W = (STRIP.w * CERT.integer) / CERT_TOTAL;
const FRAC_X0 = STRIP.x + STRIP_INT_W;
const STRIP_END = STRIP.x + STRIP.w;
// the float ladder: 150 px per 2^-24
const NL = { x0: 150, x1: 770, k0: 240, step: 150 };
const nlx = (k: number): number => NL.k0 + k * NL.step;
const RUNG_A = 488;
const RUNG_B = 590;
const RES = { x: 800, w: 200, h: 38 };
// agreement grid
const AG = { x: 560, y: 396, c: 12 };
// tally
const TB = { x: 330, w: 600, h: 22 };
// the 48 × 75 table
const TBL = { x: 302, y: 140, cw: 9, ch: 6 };
const cellX = (col: number): number => TBL.x + col * TBL.cw;
const cellY = (row: number): number => TBL.y + row * TBL.ch;
const TBL_W = N1 * TBL.cw;
const TBL_H = FIRST.length * TBL.ch;
// log bars: 95 px per decade
const LB = { x: 330, dec: 95, y0: 462, gap: 40, h: 26 };
const lbx = (v: number): number => LB.x + Math.log10(v) * LB.dec;
const BARS = [
  { name: 'coordinateDescentOnLossMatrix', v: CD.reads, unit: 'table reads' },
  { name: 'enumerateLossMatrix', v: PAIRS, unit: 'table reads' },
  { name: 'buildProgramLossMatrix', v: TABLE_EVALS, unit: 'evaluations' },
];
// screen-space search panel
const SP = { x: 932, y: 446, w: 318, h: 166 };

const CAM_OPEN: CameraState = { x: 721, y: 190, k: 1.2 };
const CAM_CHIPS: CameraState = { x: 620, y: 220, k: 1.03 };
const CAM_STRIP: CameraState = { x: 640, y: 250, k: 1.04 };
const CAM_LADDER: CameraState = { x: 600, y: 506, k: 1.2 };
const CAM_LADDER_B: CameraState = { x: 610, y: 526, k: 1.24 };
const CAM_TALLY: CameraState = { x: 640, y: 470, k: 1.12 };
const CAM_CD: CameraState = { x: 560, y: 250, k: 1.45 };

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Training counts a program as recovered once it gets every integer example right. For the two-add task, twelve different programs do that.',
  'Then comes the strict checker: thirty-nine thousand six hundred five cases, whole numbers, fractions, and input-rounding tests, each compared against the independent oracle.',
  'Only four of the twelve survive. All four add the pointer to the left edge first, then add the distractor, and each addition may swap its two operands.',
  'Why do the others fail? Set the pointer to one, the left edge to two to the minus twenty-fourth, and the distractor to minus one. Adding pointer and edge first rounds back to exactly one, and minus one gives zero.',
  'Group them the other way and the edge plus minus one is exact. Adding the pointer then leaves two to the minus twenty-fourth. Same three numbers, same two additions, a different answer.',
  "Small whole numbers add exactly in either grouping, so this lab's small integer examples cannot tell the groupings apart. In the lab's words, integer examples alone cannot identify which grouping is required.",
  'So the tally splits. Of sixty corrected two-add runs, only fifteen pass the full checks, while all sixty coordinate runs still do. The training data, not the optimizer, is the limit here.',
  'Reading the table directly is a baseline too: all three thousand six hundred entries, the first minimum wins. On these tasks that program also passes the full checks.',
  'Starting from each failed run, one sweep of exact coordinate updates reaches zero integer error in one hundred twenty-four table reads. That repairs a run. It does not search from scratch.',
  'And every hard-loss route reuses the table, which took over fifty-three million second-instruction evaluations to build. Nothing here avoids scoring every complete program first.',
  'The earlier soft-output trainer, which averages candidate outputs and follows the error, recovered eleven of twenty coordinate runs and none of twenty full two-add runs. Those results are historical.',
  'The status, plainly: the corrected optimizer result holds on this two-instruction task. It is narrowed to integer data, and the open question is whether fractional examples can identify the grouping.',
  'Untested: data-dependent choices, loops, varying lengths, longer programs, or training without a full loss table. In the lab\'s words, neither result establishes scalable program synthesis.',
];
const HOLD = 0.9;
const CAPS = (() => {
  let at = 0.4;
  return CAPTIONS.map((text) => {
    const dur = +(text.split(/\s+/).length / 2.5 + 0.5).toFixed(1);
    const c = { at: +at.toFixed(2), dur, text };
    at += dur + HOLD;
    return c;
  });
})();

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);

  const chipsU = tl.channel('chipsU', 0);
  const intTickU = tl.channel('intTickU', 0);
  const chipsOp = tl.channel('chipsOp', 1);
  const certU = tl.channel('certU', 0);
  const scanU = tl.channel('scanU', 0);
  const certOp = tl.channel('certOp', 1);
  const strikeU = tl.channel('strikeU', 0);
  const keepU = tl.channel('keepU', 0);
  const rowLabU = tl.channel('rowLabU', 0);
  const head2U = tl.channel('head2U', 0);
  const inputsU = tl.channel('inputsU', 0);
  const rungAU = tl.channel('rungAU', 0); // 0 line · 1 exact sum · 2 rounds · 3 result
  const rungBU = tl.channel('rungBU', 0); // 0 line · 1 exact sum · 2 result
  const rungAOp = tl.channel('rungAOp', 1);
  const cmpU = tl.channel('cmpU', 0);
  const ladderOp = tl.channel('ladderOp', 1);
  const gridU = tl.channel('gridU', 0);
  const probeU = tl.channel('probeU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const tallyFocus = tl.channel('tallyFocus', 0);
  const limitU = tl.channel('limitU', 0);
  const tallyOp = tl.channel('tallyOp', 1);
  const tableU = tl.channel('tableU', 0);
  const flyU = tl.channel('flyU', 0);
  const readU = tl.channel('readU', 0);
  const winU = tl.channel('winU', 0);
  const enumOp = tl.channel('enumOp', 1);
  const startU = tl.channel('startU', 0);
  const cdU = tl.channel('cdU', 0);
  const cdDoneU = tl.channel('cdDoneU', 0);
  const cdOp = tl.channel('cdOp', 1);
  const tableOp = tl.channel('tableOp', 1);
  const costU = tl.channel('costU', 0);
  const barsU = tl.channel('barsU', 0);
  const bar3U = tl.channel('bar3U', 0);
  const barsOp = tl.channel('barsOp', 1);
  const softU = tl.channel('softU', 0);
  const stampU = tl.channel('stampU', 0);
  const softOp = tl.channel('softOp', 1);
  const statusU = tl.channel('statusU', 0);
  const statusOp = tl.channel('statusOp', 1);
  const endU = tl.channel('endU', 0);

  CAPS.forEach((c) => tl.caption(c));
  const A = CAPS.map((c) => c.at);
  const fade = (ch: Parameters<typeof tl.tween>[0], to: number, at: number, dur = 0.6) => tl.tween(ch, to, { at, dur, ease: ease.move });

  // — B0 · twelve programs pass on whole numbers —
  tl.tween(chipsU, 1, { at: A[0] + 0.3, dur: 2.4, ease: ease.linear });
  tl.tween(intTickU, 1, { at: A[0] + 4.6, dur: 1.4, ease: ease.linear });
  tl.hold(CAPS[0].at + CAPS[0].dur, HOLD);

  // — B1 · the strict checker sweeps 39,605 cases —
  tl.tween(cam, CAM_STRIP, { at: A[1], dur: 1.2, ease: ease.move });
  tl.tween(certU, 1, { at: A[1] + 0.4, dur: 1.3, ease: ease.draw });
  tl.tween(scanU, 1, { at: A[1] + 2.6, dur: 5.6, ease: ease.linear });
  tl.hold(CAPS[1].at + CAPS[1].dur, HOLD);

  // — B2 · four survive; each addition may swap its operands —
  tl.tween(cam, CAM_CHIPS, { at: A[2], dur: 1.2, ease: ease.move });
  tl.tween(strikeU, 1, { at: A[2] + 0.4, dur: 1.0, ease: ease.draw });
  tl.tween(head2U, 1, { at: A[2] + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(keepU, 1, { at: A[2] + 1.6, dur: 0.6, ease: ease.pop });
  tl.tween(rowLabU, 1, { at: A[2] + 3.4, dur: 0.7, ease: ease.enter });
  fade(certOp, 0.1, A[2] + 0.2);
  tl.hold(CAPS[2].at + CAPS[2].dur, HOLD);

  // — B3 · the probe: pointer + edge first rounds back to one —
  tl.tween(cam, CAM_LADDER, { at: A[3], dur: 1.4, ease: ease.move });
  fade(chipsOp, 0.1, A[3]);
  fade(certOp, 0, A[3]);
  tl.tween(inputsU, 3, { at: A[3] + 2.2, dur: 6.6, ease: ease.linear });
  tl.tween(rungAU, 1, { at: A[3] + 9.0, dur: 0.8, ease: ease.enter });
  tl.tween(rungAU, 2, { at: A[3] + 11.2, dur: 1.2, ease: ease.move });
  tl.tween(rungAU, 3, { at: A[3] + 14.0, dur: 0.8, ease: ease.enter });
  tl.hold(CAPS[3].at + CAPS[3].dur, HOLD);

  // — B4 · the other grouping is exact, and lands on 2^-24 —
  tl.tween(cam, CAM_LADDER_B, { at: A[4], dur: 1.2, ease: ease.move });
  fade(rungAOp, 0.35, A[4]);
  tl.tween(rungBU, 1, { at: A[4] + 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(rungBU, 2, { at: A[4] + 5.0, dur: 0.8, ease: ease.enter });
  fade(rungAOp, 1, A[4] + 9.4);
  tl.tween(cmpU, 1, { at: A[4] + 9.6, dur: 0.7, ease: ease.pop });
  tl.hold(CAPS[4].at + CAPS[4].dur, HOLD);

  // — B5 · small integers agree in both groupings —
  tl.tween(cam, CAMERA_HOME, { at: A[5], dur: 1.4, ease: ease.move });
  fade(ladderOp, 0, A[5] + 0.2, 0.8);
  tl.tween(gridU, 1, { at: A[5] + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(probeU, 1, { at: A[5] + 3.6, dur: 0.6, ease: ease.pop });
  tl.tween(quoteU, 1, { at: A[5] + 7.6, dur: 0.8, ease: ease.enter });
  tl.hold(CAPS[5].at + CAPS[5].dur, HOLD);

  // — B6 · the tally splits —
  tl.tween(cam, CAM_TALLY, { at: A[6], dur: 1.3, ease: ease.move });
  fade(ladderOp, 0, A[6]);
  fade(gridU, 0, A[6]);
  fade(probeU, 0, A[6]);
  fade(quoteU, 0, A[6]);
  tl.tween(tallyU, 1, { at: A[6] + 0.8, dur: 2.0, ease: ease.linear });
  tl.tween(tallyFocus, 1, { at: A[6] + 3.6, dur: 0.7, ease: ease.move });
  tl.tween(limitU, 1, { at: A[6] + 10.0, dur: 0.7, ease: ease.enter });
  tl.hold(CAPS[6].at + CAPS[6].dur, HOLD);

  // — B7 · the chips drop into the table; enumeration reads all 3,600 —
  tl.tween(cam, CAMERA_HOME, { at: A[7], dur: 1.2, ease: ease.move });
  fade(tallyOp, 0, A[7]);
  fade(chipsOp, 1, A[7]);
  tl.tween(tableU, 1, { at: A[7] + 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(flyU, 1, { at: A[7] + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(readU, PAIRS, { at: A[7] + 2.6, dur: 6.0, ease: ease.linear });
  tl.tween(winU, 1, { at: A[7] + 8.9, dur: 0.7, ease: ease.enter });
  tl.hold(CAPS[7].at + CAPS[7].dur, HOLD);

  // — B8 · one sweep of exact coordinate updates: 124 reads —
  tl.tween(cam, CAM_CD, { at: A[8], dur: 1.4, ease: ease.move });
  fade(enumOp, 0, A[8]);
  tl.tween(startU, 1, { at: A[8] + 0.8, dur: 0.6, ease: ease.pop });
  tl.tween(cdU, CD.reads - 1, { at: A[8] + 2.2, dur: 6.2, ease: ease.linear });
  tl.tween(cdDoneU, 1, { at: A[8] + 9.0, dur: 0.7, ease: ease.enter });
  tl.hold(CAPS[8].at + CAPS[8].dur, HOLD);

  // — B9 · every hard-loss route pays for the table first —
  tl.tween(cam, CAMERA_HOME, { at: A[9], dur: 1.4, ease: ease.move });
  fade(cdOp, 0, A[9]);
  fade(tableOp, 0.12, A[9] + 0.2, 0.8);
  tl.tween(costU, 1, { at: A[9] + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(barsU, 3, { at: A[9] + 1.4, dur: 3.0, ease: ease.linear });
  tl.tween(bar3U, 1, { at: A[9] + 5.2, dur: 0.7, ease: ease.move });
  tl.hold(CAPS[9].at + CAPS[9].dur, HOLD);

  // — B10 · the soft-output trainer, historical —
  fade(barsOp, 0.1, A[10]);
  fade(costU, 0, A[10]);
  fade(tableOp, 0.05, A[10]);
  tl.tween(softU, 6, { at: A[10] + 0.4, dur: 7.6, ease: ease.linear });
  tl.tween(stampU, 1, { at: A[10] + 10.4, dur: 0.5, ease: ease.pop });
  tl.hold(CAPS[10].at + CAPS[10].dur, HOLD);

  // — B11 · status, plainly —
  tl.tween(cam, { x: 640, y: 340, k: 1.04 }, { at: A[11], dur: 1.4, ease: ease.move });
  fade(softOp, 0, A[11]);
  fade(barsOp, 0, A[11]);
  fade(tableOp, 0, A[11]);
  fade(chipsOp, 0, A[11]);
  tl.tween(statusU, 1, { at: A[11] + 2.6, dur: 0.6, ease: ease.pop });
  tl.tween(statusU, 2, { at: A[11] + 5.6, dur: 0.6, ease: ease.pop });
  tl.tween(statusU, 3, { at: A[11] + 8.6, dur: 0.6, ease: ease.pop });
  tl.tween(statusU, 4, { at: A[11] + 11.4, dur: 0.6, ease: ease.pop });
  tl.hold(CAPS[11].at + CAPS[11].dur, HOLD);

  // — B12 · untested; neither establishes scalable program synthesis —
  tl.tween(cam, CAMERA_HOME, { at: A[12], dur: 1.4, ease: ease.move });
  fade(statusOp, 0.1, A[12], 0.8);
  tl.tween(endU, 7, { at: A[12] + 0.4, dur: 7.6, ease: ease.linear });
  tl.hold(CAPS[12].at + CAPS[12].dur, 2.4);

  return {
    tl, cam, chipsU, intTickU, chipsOp, certU, scanU, certOp, strikeU, keepU, rowLabU, head2U,
    inputsU, rungAU, rungBU, rungAOp, cmpU, ladderOp, gridU, probeU, quoteU,
    tallyU, tallyFocus, limitU, tallyOp, tableU, flyU, readU, winU, enumOp, startU, cdU, cdDoneU, cdOp, tableOp,
    costU, barsU, bar3U, barsOp, softU, stampU, softOp, statusU, statusOp, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Tick({ x, y, s = 1, color = colors.POSITIVE, opacity = 1 }: { x: number; y: number; s?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <path d={`M ${x - 5 * s} ${y} L ${x - 1.5 * s} ${y + 3.5 * s} L ${x + 5.5 * s} ${y - 4 * s}`} stroke={color} strokeWidth={2.2} fill="none"
      strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}
function XMark({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g stroke={colors.NEGATIVE} strokeWidth={2.2} strokeLinecap="round" opacity={opacity}>
      <line x1={x - 4 * s} y1={y - 4 * s} x2={x + 4 * s} y2={y + 4 * s} />
      <line x1={x + 4 * s} y1={y - 4 * s} x2={x - 4 * s} y2={y + 4 * s} />
    </g>
  );
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = (mono ? monoW(text.length, fs) : uiW(text.length, fs)) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Txt({ x, y, children, fs = 13, color = colors.TEXT, mono = false, anchor = 'start', opacity = 1, weight, italic }: {
  x: number; y: number; children: string; fs?: number; color?: string; mono?: boolean; anchor?: 'start' | 'middle' | 'end'; opacity?: number;
  weight?: number; italic?: boolean;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={fs} fill={color} fontFamily={mono ? MONO : UI} textAnchor={anchor} opacity={opacity} fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined} style={{ whiteSpace: 'pre' }}>
      {children}
    </text>
  );
}

/** one rung of the float ladder: a number line in steps of 2^-24, its tick labels, and a dot */
function Rung({ y, title, ticks, dashed, opacity }: { y: number; title: string; ticks: string[]; dashed?: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <Txt x={130} y={y - 40} mono fs={14}>
        {title}
      </Txt>
      <line x1={NL.x0} y1={y} x2={NL.x1} y2={y} stroke={colors.MUTED} strokeWidth={1.5} />
      {ticks.map((t, k) => {
        const isGap = dashed === k;
        return (
          <g key={k}>
            <line x1={nlx(k)} y1={y - 8} x2={nlx(k)} y2={y + 8} stroke={isGap ? colors.MUTED : colors.TEXT} strokeWidth={isGap ? 1.2 : 2}
              strokeDasharray={isGap ? '3 3' : undefined} />
            <Txt x={nlx(k)} y={y + 24} anchor="middle" color={isGap ? colors.MUTED : colors.TEXT}>
              {t}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = (ch: Parameters<typeof s.get>[0]) => s.get(ch) as number;
  const cam = s.get(scene.cam);

  const chipsU = g(scene.chipsU);
  const intTickU = g(scene.intTickU);
  const chipsOp = g(scene.chipsOp);
  const certU = g(scene.certU);
  const scanU = g(scene.scanU);
  const certOp = g(scene.certOp);
  const strikeU = g(scene.strikeU);
  const keepU = g(scene.keepU);
  const rowLabU = g(scene.rowLabU);
  const head2U = g(scene.head2U);
  const inputsU = g(scene.inputsU);
  const rungAU = g(scene.rungAU);
  const rungBU = g(scene.rungBU);
  const rungAOp = g(scene.rungAOp);
  const cmpU = g(scene.cmpU);
  const ladderOp = g(scene.ladderOp);
  const gridU = g(scene.gridU);
  const probeU = g(scene.probeU);
  const quoteU = g(scene.quoteU);
  const tallyU = g(scene.tallyU);
  const tallyFocus = g(scene.tallyFocus);
  const limitU = g(scene.limitU);
  const tallyOp = g(scene.tallyOp);
  const tableU = g(scene.tableU);
  const flyU = g(scene.flyU);
  const readU = g(scene.readU);
  const winU = g(scene.winU);
  const enumOp = g(scene.enumOp);
  const startU = g(scene.startU);
  const cdU = g(scene.cdU);
  const cdDoneU = g(scene.cdDoneU);
  const cdOp = g(scene.cdOp);
  const tableOp = g(scene.tableOp);
  const costU = g(scene.costU);
  const barsU = g(scene.barsU);
  const bar3U = g(scene.bar3U);
  const barsOp = g(scene.barsOp);
  const softU = g(scene.softU);
  const stampU = g(scene.stampU);
  const softOp = g(scene.softOp);
  const statusU = g(scene.statusU);
  const statusOp = g(scene.statusOp);
  const endU = g(scene.endU);

  const scanX = lerp(STRIP.x, STRIP_END, scanU);
  const fracChecked = scanU > 0 && scanX >= FRAC_X0 + 3;
  const allChecked = scanU >= 0.999;
  const chipLayer = chipsOp;
  const ladderOn = inputsU > 0.001 && ladderOp > 0.005;
  const reads = Math.floor(readU);
  const cdStep = cdOp > 0.005 && startU > 0.001 ? Math.floor(cdU) : -1;
  const best = cdStep >= 0 ? cdBest(cdStep) : null;
  const tableLayer = tableU * tableOp;

  return (
    <>
      <Camera {...cam}>
        {/* ======================== the twelve chips (they later become table cells) ======================== */}
        {chipLayer > 0.005 && chipsU > 0.001 && (
          <g opacity={chipLayer}>
            <g opacity={1 - clamp01(flyU * 3)}>
              <Txt x={CHIP.x0} y={86} fs={15} color={colors.TEXT} opacity={1 - head2U}>
                12 integer-exact programs · two-add task
              </Txt>
              <Txt x={CHIP.x0} y={86} fs={15} color={colors.POSITIVE} opacity={head2U}>
                4 full-certification · each addition may swap its operands
              </Txt>
              <g opacity={clamp01(intTickU * 3)}>
                <Tick x={STRIP_END - 196} y={81} s={0.9} />
                <Txt x={STRIP_END - 186} y={86} color={colors.MUTED}>
                  integer cases
                </Txt>
                <Tick x={STRIP_END - 88} y={81} s={0.9} opacity={certU} color={colors.WARM} />
                <Txt x={STRIP_END - 78} y={86} color={colors.MUTED} opacity={certU}>
                  fractional
                </Txt>
              </g>
              {ROW_LABELS.map((lines, ri) => {
                const r = chipRect(ri, 0);
                const op = rowLabU * (ri === 0 ? 1 : 1 - 0.5 * strikeU);
                return (
                  <g key={ri} opacity={op}>
                    {lines.map((l, li) => (
                      <Txt key={li} x={40} y={r.y + 19 + li * 18} fs={13} color={ri === 0 ? colors.POSITIVE : colors.MUTED}>
                        {l}
                      </Txt>
                    ))}
                  </g>
                );
              })}
            </g>
            {CHIPS.map(({ pair, ri, ci }, k) => {
              const enter = clamp01((chipsU * 15 - k) / 3);
              if (enter <= 0.001) return null;
              const home = chipRect(ri, ci);
              const cell = { x: cellX(pair % N1), y: cellY(Math.floor(pair / N1)), w: TBL.cw, h: TBL.ch };
              const fu = flyU;
              const x = lerp(home.x, cell.x, fu);
              const y = lerp(home.y, cell.y, fu) + (1 - enter) * 14;
              const w = lerp(home.w, cell.w, fu);
              const h = lerp(home.h, cell.h, fu);
              const survivor = ri === 0;
              const failed = !survivor && fracChecked;
              const struck = survivor ? 0 : strikeU;
              const textOp = 1 - clamp01(fu * 4);
              const op = enter * lerp(1 - 0.6 * struck, 1, fu) * (fu > 0 ? tableOp : 1);
              const cellFill = fu > 0.5 ? colors.POSITIVE : colors.PANEL;
              const stroke = fu > 0.5 ? (survivor ? colors.TEXT : colors.POSITIVE) : survivor && keepU > 0 ? colors.POSITIVE : failed ? colors.NEGATIVE : colors.GRID;
              return (
                <g key={pair} opacity={op}>
                  <rect x={x} y={y} width={w} height={h} rx={lerp(6, 1, fu)} fill={cellFill} fillOpacity={fu > 0.5 ? 0.9 : 0.96} stroke={stroke}
                    strokeWidth={fu > 0.5 ? (survivor ? 1.4 : 0.6) : survivor ? 1 + 1.4 * keepU : 1.2} />
                  {survivor && keepU > 0.01 && fu < 0.5 && (
                    <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={8} fill="none" stroke={colors.POSITIVE} strokeOpacity={0.35 * keepU} strokeWidth={3} />
                  )}
                  {textOp > 0.01 && (
                    <g opacity={textOp}>
                      <Txt x={x + 24} y={y + 19} fs={12} mono color={colors.TEXT}>
                        {candName(FIRST[Math.floor(pair / N1)])}
                      </Txt>
                      <Txt x={x + 24} y={y + 37} fs={12} mono color={colors.TEXT}>
                        {candName(SECOND[pair % N1])}
                      </Txt>
                      <Tick x={x + 12} y={y + 15} s={0.85} opacity={clamp01(intTickU * 12 - k)} />
                      {fracChecked && survivor && allChecked && <Tick x={x + 12} y={y + 33} s={0.85} color={colors.WARM} />}
                      {failed && <XMark x={x + 12} y={y + 33} s={0.85} />}
                      {struck > 0.01 && (
                        <line x1={x + 6} y1={y + h / 2} x2={x + 6 + (w - 12) * struck} y2={y + h / 2} stroke={colors.NEGATIVE} strokeWidth={2} />
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== the certification strip and its scanner ======================== */}
        {certU > 0.001 && certOp > 0.005 && (
          <g opacity={certOp}>
            <Txt x={STRIP.x} y={STRIP.y - 12} opacity={clamp01(certU * 2)}>
              createCertificationCases() · 39,605 cases · each checked by verifyProgram against the independent oracle
            </Txt>
            <rect x={STRIP.x} y={STRIP.y} width={STRIP_INT_W * clamp01(certU * 1.1)} height={STRIP.h} fill={colors.ACCENT} opacity={0.55} />
            {certU > 0.9 && (
              <g opacity={clamp01((certU - 0.9) * 10)}>
                <rect x={FRAC_X0} y={STRIP.y} width={STRIP_END - FRAC_X0 - 2} height={STRIP.h} fill={colors.WARM} opacity={0.8} />
                <rect x={STRIP_END - 2} y={STRIP.y} width={2} height={STRIP.h} fill={colors.SECONDARY} />
              </g>
            )}
            <g opacity={clamp01(certU * 3 - 2)}>
              <Txt x={STRIP.x} y={STRIP.y + STRIP.h + 20} color={colors.ACCENT}>
                {`${fmtInt(CERT.integer)} integer`}
              </Txt>
              <Txt x={FRAC_X0 - 10} y={STRIP.y + STRIP.h + 20} anchor="end" color={colors.WARM}>
                {`${fmtInt(CERT.fractional)} fractional`}
              </Txt>
              <Txt x={STRIP_END} y={STRIP.y + STRIP.h + 38} anchor="end" color={colors.SECONDARY}>
                {`${CERT.rounding} input-rounding`}
              </Txt>
              <line x1={FRAC_X0} y1={STRIP.y + STRIP.h} x2={FRAC_X0 - 6} y2={STRIP.y + STRIP.h + 8} stroke={colors.WARM} />
            </g>
            {scanU > 0.001 && scanU < 0.999 && (
              <g>
                <line x1={scanX} y1={CHIP.y0 - 6} x2={scanX} y2={STRIP.y + STRIP.h + 6} stroke={colors.TEXT} strokeWidth={1.6} opacity={0.85} />
                <rect x={STRIP.x} y={STRIP.y} width={scanX - STRIP.x} height={STRIP.h} fill={colors.TEXT} opacity={0.12} />
              </g>
            )}
          </g>
        )}

        {/* ======================== the float ladder ======================== */}
        {ladderOn && (
          <g opacity={ladderOp}>
            {[
              { x: 130, t: 'pointerX = 1', c: colors.ACCENT },
              { x: 290, t: 'panelLeft = 2⁻²⁴', c: colors.ACCENT },
              { x: 470, t: 'distractor = −1', c: colors.ACCENT },
            ].map((ch, i) => (
              <Chip key={i} x={ch.x} y={410} text={ch.t} color={ch.c} mono fs={14} opacity={clamp01(inputsU - i)} />
            ))}
            <Txt x={640} y={410} color={colors.MUTED} opacity={clamp01(inputsU - 2)}>
              the probe in program.test.ts · number lines step by 2⁻²⁴
            </Txt>

            {/* rung A: the oracle's grouping */}
            <g opacity={rungAOp}>
              <Rung y={RUNG_A} title="(pointerX + panelLeft) + distractor   · the oracle" ticks={['1 − 2⁻²⁴', '1', '1 + 2⁻²⁴', '1 + 2⁻²³']} dashed={2}
                opacity={clamp01(inputsU - 2)} />
              {rungAU > 0.01 && (
                <g>
                  <circle cx={nlx(2)} cy={RUNG_A} r={8 * clamp01(rungAU * 1.6)} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                  <Txt x={nlx(2) + 16} y={RUNG_A - 14} color={colors.WARM} opacity={clamp01(rungAU)}>
                    exact sum: halfway between two floats
                  </Txt>
                </g>
              )}
              {rungAU > 1.01 && (
                <g>
                  {(() => {
                    const u = clamp01(rungAU - 1);
                    const xe = lerp(nlx(2), nlx(1), u);
                    const ye = RUNG_A - Math.sin(Math.PI * u) * 26;
                    const d = Array.from({ length: 21 }, (_, i) => {
                      const v = (i / 20) * u;
                      return `${i ? 'L' : 'M'} ${lerp(nlx(2), nlx(1), v)} ${RUNG_A - Math.sin(Math.PI * v) * 26}`;
                    }).join(' ');
                    return (
                      <g>
                        <path d={d} fill="none" stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="5 4" />
                        <circle cx={xe} cy={ye} r={7} fill={colors.WARM} />
                      </g>
                    );
                  })()}
                  <Txt x={nlx(1) - 14} y={RUNG_A - 14} anchor="end" color={colors.WARM} opacity={clamp01((rungAU - 1.5) * 2)}>
                    ties to even: 1
                  </Txt>
                </g>
              )}
            </g>
            {rungAU > 2.01 && (
              <g opacity={clamp01(rungAU - 2)}>
                <rect x={RES.x} y={RUNG_A - RES.h / 2} width={RES.w} height={RES.h} rx={8} fill={colors.PANEL} stroke={cmpU > 0.01 ? colors.POSITIVE : colors.TEXT}
                  strokeWidth={1.4} />
                <Txt x={RES.x + 14} y={RUNG_A + 6} mono fs={16}>
                  1 + (−1) = 0
                </Txt>
                <Txt x={RES.x + RES.w - 12} y={RUNG_A + 5} anchor="end" color={colors.POSITIVE} opacity={cmpU}>
                  target
                </Txt>
              </g>
            )}

            {/* rung B: the other grouping */}
            <Rung y={RUNG_B} title="(panelLeft + distractor) + pointerX" ticks={['−1', '−1 + 2⁻²⁴', '−1 + 2⁻²³', '−1 + 3·2⁻²⁴']} opacity={clamp01(rungBU * 2)} />
            {rungBU > 0.01 && (
              <g>
                <circle cx={nlx(1)} cy={RUNG_B} r={7 * clamp01(rungBU * 1.6)} fill={colors.ACCENT} />
                <Txt x={nlx(1) + 14} y={RUNG_B - 12} color={colors.ACCENT} opacity={clamp01(rungBU)}>
                  exact: already a float
                </Txt>
              </g>
            )}
            {rungBU > 1.01 && (
              <g opacity={clamp01(rungBU - 1)}>
                <rect x={RES.x} y={RUNG_B - RES.h / 2} width={RES.w} height={RES.h} rx={8} fill={colors.PANEL} stroke={cmpU > 0.01 ? colors.NEGATIVE : colors.TEXT}
                  strokeWidth={1.4} />
                <Txt x={RES.x + 14} y={RUNG_B + 6} mono fs={16}>
                  … + 1 = 2⁻²⁴
                </Txt>
                <Txt x={RES.x + RES.w - 12} y={RUNG_B + 5} anchor="end" color={colors.NEGATIVE} opacity={cmpU}>
                  ≠ target
                </Txt>
              </g>
            )}
            {cmpU > 0.01 && (
              <g opacity={cmpU}>
                <line x1={RES.x + RES.w / 2} y1={RUNG_A + RES.h / 2 + 4} x2={RES.x + RES.w / 2} y2={RUNG_B - RES.h / 2 - 4} stroke={colors.NEGATIVE} strokeWidth={1.4}
                  strokeDasharray="4 4" />
                <Txt x={RES.x + RES.w / 2 - 12} y={(RUNG_A + RUNG_B) / 2 + 5} anchor="end" color={colors.TEXT} fs={13}>
                  same numbers, same two adds
                </Txt>
              </g>
            )}
          </g>
        )}

        {/* ======================== integer examples: both groupings agree ======================== */}
        {gridU > 0.001 && (
          <g>
            <g opacity={clamp01(gridU * 3)}>
              <Txt x={AG.x - 16} y={AG.y + 60} anchor="end" fs={14}>
                both groupings, every
              </Txt>
              <Txt x={AG.x - 16} y={AG.y + 80} anchor="end" fs={14}>
                {`training example (${fmtInt(TRAIN.length)})`}
              </Txt>
              <Txt x={AG.x - 16} y={AG.y + 110} anchor="end" color={colors.MUTED}>
                one cell per pointerX × panelLeft,
              </Txt>
              <Txt x={AG.x - 16} y={AG.y + 128} anchor="end" color={colors.MUTED}>
                −16 … 16; each holds 51 examples
              </Txt>
            </g>
            {AGREE.map((row, i) =>
              row.map((n, j) => {
                const u = clamp01(gridU * 17 * 1.2 - i);
                if (u <= 0) return null;
                return (
                  <rect key={`${i}-${j}`} x={AG.x + j * AG.c} y={AG.y + i * AG.c} width={AG.c - 1.5} height={AG.c - 1.5}
                    fill={n === 51 ? colors.POSITIVE : colors.NEGATIVE} opacity={0.75 * u * gridU} />
                );
              }),
            )}
            <Txt x={AG.x + 17 * AG.c + 24} y={AG.y + 60} fs={14} color={colors.POSITIVE} opacity={clamp01(gridU * 2 - 1)}>
              {`equal in ${fmtInt(AGREE_TOTAL)} of ${fmtInt(TRAIN.length)}`}
            </Txt>
            {probeU > 0.01 && (
              <g opacity={probeU}>
                <rect x={AG.x + 17 * AG.c + 24} y={AG.y + 104} width={AG.c} height={AG.c} fill={colors.NEGATIVE} />
                <Txt x={AG.x + 17 * AG.c + 46} y={AG.y + 115} color={colors.NEGATIVE} fs={14}>
                  the probe: 0 vs 2⁻²⁴
                </Txt>
              </g>
            )}
          </g>
        )}
        {quoteU > 0.01 && (
          <g opacity={quoteU}>
            <rect x={232} y={282} width={978} height={52} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={232} y={282} width={4} height={52} rx={2} fill={colors.SECONDARY} />
            <Txt x={256} y={314} fs={18} italic>
              “Integer examples alone cannot identify which grouping is required.”
            </Txt>
            <Txt x={1194} y={314} anchor="end" color={colors.MUTED}>
              README
            </Txt>
          </g>
        )}

        {/* ======================== the tally ======================== */}
        {tallyU > 0.001 && tallyOp > 0.005 && (
          <g opacity={tallyOp}>
            <Txt x={130} y={398} color={colors.MUTED} opacity={clamp01(tallyU * 3)}>
              hard-loss trainer, corrected epsilon · 3 seed ranges × 20 runs · segments are the seed ranges
            </Txt>
            {TALLY.map((grp, gi) => {
              const gy = 430 + gi * 100;
              return (
                <g key={grp.task}>
                  <Txt x={130} y={gy} mono fs={14} color={colors.TEXT} opacity={clamp01(tallyU * 3 - gi)}>
                    {grp.task}
                  </Txt>
                  {grp.rows.map((row, ri) => {
                    const y = gy + 10 + ri * 32;
                    const total = row.seg.reduce((a, b) => a + b, 0);
                    const u = clamp01(tallyU * 2 - gi * 0.5 - ri * 0.25);
                    const isFocus = gi === 0 && ri === 1;
                    const op = isFocus ? 1 : 1 - 0.55 * tallyFocus;
                    let acc = 0;
                    return (
                      <g key={ri} opacity={op * clamp01(u * 4)}>
                        <Txt x={TB.x - 12} y={y + 16} anchor="end" color={colors.MUTED}>
                          {row.label}
                        </Txt>
                        <rect x={TB.x} y={y} width={TB.w} height={TB.h} rx={3} fill="none" stroke={colors.GRID} />
                        {row.seg.map((n, si) => {
                          const x = TB.x + (acc / 60) * TB.w * u;
                          acc += n;
                          const w = (n / 60) * TB.w * u;
                          return (
                            <g key={si}>
                              <rect x={x} y={y + 1} width={Math.max(0, w - 2)} height={TB.h - 2} rx={2}
                                fill={ri === 0 ? colors.ACCENT : isFocus ? colors.WARM : colors.POSITIVE} opacity={0.75} />
                              {u > 0.95 && w > 22 && (
                                <Txt x={x + w / 2 - 1} y={y + 16} anchor="middle" color={colors.BG} fs={13} weight={700}>
                                  {`${n}`}
                                </Txt>
                              )}
                            </g>
                          );
                        })}
                        <Txt x={TB.x + TB.w + 14} y={y + 16} mono fs={15} color={isFocus ? colors.WARM : colors.TEXT} opacity={clamp01(u * 3 - 2)}>
                          {`${total} / 60`}
                        </Txt>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <Chip x={700} y={428} text="the limit: the training data" color={colors.WARM} opacity={limitU} fs={14} />
          </g>
        )}

        {/* ======================== the 48 × 75 loss table ======================== */}
        {tableLayer > 0.005 && (
          <g opacity={tableOp}>
            <g opacity={tableU}>
              <Txt x={TBL.x} y={104} fs={15}>
                the two-add loss table · 48 × 75 = 3,600 complete programs
              </Txt>
              <g>
                <rect x={TBL.x} y={115} width={10} height={10} fill={colors.POSITIVE} opacity={0.9} />
                <Txt x={TBL.x + 16} y={124} color={colors.MUTED}>
                  zero integer error: the 12
                </Txt>
                <rect x={TBL.x + 214} y={115} width={10} height={10} fill={colors.POSITIVE} opacity={0.9} stroke={colors.TEXT} strokeWidth={1.4} />
                <Txt x={TBL.x + 230} y={124} color={colors.MUTED}>
                  also full checks: the 4
                </Txt>
                <rect x={TBL.x + 420} y={115} width={10} height={10} fill={colors.GRID} />
                <Txt x={TBL.x + 436} y={124} color={colors.MUTED}>
                  error above zero
                </Txt>
              </g>
              <Txt x={TBL.x - 10} y={TBL.y + 72} anchor="end" color={colors.MUTED}>
                instruction 0
              </Txt>
              <Txt x={TBL.x - 10} y={TBL.y + 88} anchor="end" color={colors.MUTED}>
                48 rows
              </Txt>
              <Txt x={TBL.x + TBL_W} y={TBL.y + TBL_H + 18} anchor="end" color={colors.MUTED} opacity={1 - startU}>
                instruction 1 · 75 columns
              </Txt>
              <rect x={TBL.x} y={TBL.y} width={TBL_W * clamp01(tableU * 1.2)} height={TBL_H} fill={colors.GRID} opacity={0.55} />
              {Array.from({ length: FIRST.length + 1 }, (_, r) => (
                <line key={`r${r}`} x1={TBL.x} y1={cellY(r)} x2={TBL.x + TBL_W * tableU} y2={cellY(r)} stroke={colors.BG} strokeWidth={0.8} />
              ))}
              {Array.from({ length: N1 + 1 }, (_, c) => (
                <line key={`c${c}`} x1={cellX(c)} y1={TBL.y} x2={cellX(c)} y2={TBL.y + TBL_H * tableU} stroke={colors.BG} strokeWidth={0.8} />
              ))}
            </g>

            {/* enumeration: row-major reads, the first strict minimum */}
            {readU > 0.5 && enumOp > 0.005 && (
              <g opacity={enumOp}>
                <rect x={TBL.x} y={TBL.y} width={TBL_W} height={Math.floor(reads / N1) * TBL.ch} fill={colors.TEXT} opacity={0.1} />
                <rect x={TBL.x} y={cellY(Math.floor(reads / N1))} width={(reads % N1) * TBL.cw} height={TBL.ch} fill={colors.TEXT} opacity={0.1} />
                {reads < PAIRS && (
                  <rect x={cellX(reads % N1) - 1.5} y={cellY(Math.floor(reads / N1)) - 1.5} width={TBL.cw + 3} height={TBL.ch + 3} fill="none" stroke={colors.TEXT}
                    strokeWidth={1.6} />
                )}
                {reads > ENUM_WIN && (
                  <g>
                    <circle cx={cellX(ENUM_WIN % N1) + TBL.cw / 2} cy={cellY(Math.floor(ENUM_WIN / N1)) + TBL.ch / 2} r={9} fill="none" stroke={colors.WARM} strokeWidth={2.2} />
                  </g>
                )}
                {EXACT.filter((p) => p !== ENUM_WIN && reads > p && reads < p + 90).map((p) => (
                  <circle key={p} cx={cellX(p % N1) + TBL.cw / 2} cy={cellY(Math.floor(p / N1)) + TBL.ch / 2} r={8} fill="none" stroke={colors.MUTED} strokeWidth={1.4}
                    opacity={1 - (reads - p) / 90} />
                ))}
                {winU > 0.01 && (
                  <g opacity={winU}>
                    <rect x={TBL.x} y={TBL.y + TBL_H + 28} width={TBL_W - 60} height={30} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
                    <Txt x={TBL.x + 12} y={TBL.y + TBL_H + 48} mono fs={13} color={colors.TEXT}>
                      {`pair ${ENUM_WIN}: ${ENUM_NAME[0]} → ${ENUM_NAME[1]}`}
                    </Txt>
                    <Tick x={TBL.x + TBL_W - 192} y={TBL.y + TBL_H + 43} color={colors.POSITIVE} />
                    <Txt x={TBL.x + TBL_W - 180} y={TBL.y + TBL_H + 48} color={colors.POSITIVE}>
                      passes full checks
                    </Txt>
                  </g>
                )}
              </g>
            )}

            {/* coordinate descent from one failed run: the row of 75, then the column of 48 */}
            {best && (
              <g opacity={cdOp}>
                {cdStep >= 1 && (
                  <g>
                    <rect x={TBL.x - 4} y={cellY(CD_START[0]) - 2} width={TBL_W + 8} height={TBL.ch + 4} fill="none" stroke={colors.SECONDARY} strokeWidth={1}
                      opacity={0.7} />
                    {CD.rowLoss.slice(0, Math.min(N1, cdStep)).map((v, c) =>
                      v === 0 ? (
                        <rect key={c} x={cellX(c)} y={cellY(CD_START[0])} width={TBL.cw - 0.8} height={TBL.ch - 0.8} fill={colors.POSITIVE} />
                      ) : (
                        <rect key={c} x={cellX(c)} y={cellY(CD_START[0])} width={TBL.cw - 0.8} height={TBL.ch - 0.8} fill={colors.NEGATIVE} opacity={lossShade(v)} />
                      ),
                    )}
                  </g>
                )}
                {cdStep > N1 && (
                  <g>
                    <rect x={cellX(CD.second) - 2} y={TBL.y - 4} width={TBL.cw + 4} height={TBL_H + 8} fill="none" stroke={colors.SECONDARY} strokeWidth={1}
                      opacity={0.7} />
                    {CD.colLoss.slice(0, Math.min(FIRST.length, cdStep - N1)).map((v, r) =>
                      r === CD_START[0] ? null : v === 0 ? (
                        <rect key={r} x={cellX(CD.second)} y={cellY(r)} width={TBL.cw - 0.8} height={TBL.ch - 0.8} fill={colors.POSITIVE} />
                      ) : (
                        <rect key={r} x={cellX(CD.second)} y={cellY(r)} width={TBL.cw - 0.8} height={TBL.ch - 0.8} fill={colors.NEGATIVE} opacity={lossShade(v)} />
                      ),
                    )}
                  </g>
                )}
                {/* the read head */}
                {cdStep >= 1 && cdStep < CD.reads - 1 && (() => {
                  const k = cdStep;
                  const [r, c] = k <= N1 ? [CD_START[0], k - 1] : [k - N1 - 1, CD.second];
                  return <rect x={cellX(c) - 2} y={cellY(r) - 2} width={TBL.cw + 4} height={TBL.ch + 4} fill="none" stroke={colors.TEXT} strokeWidth={1.6} />;
                })()}
                {/* start, and the running best */}
                <g opacity={startU}>
                  <rect x={cellX(CD_START[1]) - 3} y={cellY(CD_START[0]) - 3} width={TBL.cw + 6} height={TBL.ch + 6} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.8} />
                  <Txt x={TBL.x - 10} y={cellY(CD_START[0]) + 6} anchor="end" color={colors.NEGATIVE} fs={13}>
                    start: a failed run →
                  </Txt>
                </g>
                {cdStep >= 1 && (
                  <circle cx={cellX(best.second) + TBL.cw / 2} cy={cellY(best.first) + TBL.ch / 2} r={8} fill="none" stroke={colors.WARM} strokeWidth={2} />
                )}
              </g>
            )}
          </g>
        )}
        {/* the table's cost, spotlit over the dimmed table */}
        {costU > 0.01 && (
          <g opacity={costU}>
            <Chip x={TBL.x + TBL_W / 2} y={TBL.y + TBL_H / 2} anchor="middle" mono fs={14} color={colors.WARM}
              text={`buildProgramLossMatrix · ${fmtInt(TRAIN.length)} examples × 3,600 programs`} />
            <Txt x={TBL.x + TBL_W / 2} y={TBL.y + TBL_H / 2 + 34} anchor="middle" color={colors.TEXT}>
              every hard-loss trainer and baseline reads this table
            </Txt>
          </g>
        )}

        {/* ======================== the log-scale cost bars ======================== */}
        {barsU > 0.001 && barsOp > 0.005 && (
          <g opacity={barsOp}>
            {BARS.map((b, i) => {
              const u = clamp01(barsU - i);
              if (u <= 0) return null;
              const y = LB.y0 + i * LB.gap;
              const x1 = lerp(LB.x, lbx(b.v), u);
              const focus = i === 2;
              const op = focus ? 1 : 1 - 0.55 * bar3U;
              return (
                <g key={i} opacity={op}>
                  <Txt x={LB.x - 12} y={y + 18} anchor="end" mono fs={13} color={colors.MUTED}>
                    {b.name}
                  </Txt>
                  <rect x={LB.x} y={y} width={x1 - LB.x} height={LB.h} rx={3} fill={focus ? colors.WARM : colors.ACCENT} opacity={0.75} />
                  <Txt x={x1 + 10} y={y + 18} mono fs={14} color={focus ? colors.WARM : colors.TEXT} opacity={clamp01(u * 3 - 2)}>
                    {`${fmtInt(b.v)} ${b.unit}`}
                  </Txt>
                  {focus && (
                    <Txt x={LB.x + 12} y={y + 18} color={colors.BG} weight={700} opacity={bar3U}>
                      paid before any method runs
                    </Txt>
                  )}
                </g>
              );
            })}
            <g opacity={clamp01(barsU)}>
              <line x1={LB.x} y1={LB.y0 + 3 * LB.gap - 4} x2={LB.x + 8 * LB.dec} y2={LB.y0 + 3 * LB.gap - 4} stroke={colors.GRID} />
              {Array.from({ length: 9 }, (_, d) => (
                <g key={d}>
                  <line x1={LB.x + d * LB.dec} y1={LB.y0 + 3 * LB.gap - 8} x2={LB.x + d * LB.dec} y2={LB.y0 + 3 * LB.gap} stroke={colors.GRID} />
                  <Txt x={LB.x + d * LB.dec} y={LB.y0 + 3 * LB.gap + 14} anchor="middle" color={colors.MUTED} fs={12}>
                    {d === 0 ? '1' : `10${'⁰¹²³⁴⁵⁶⁷⁸'[d]}`}
                  </Txt>
                </g>
              ))}
              <Txt x={LB.x + 8 * LB.dec + 14} y={LB.y0 + 3 * LB.gap + 14} color={colors.MUTED} fs={12}>
                log scale
              </Txt>
            </g>
          </g>
        )}

        {/* ======================== the soft-output ledger (historical) ======================== */}
        {softU > 0.001 && softOp > 0.005 && (
          <g opacity={softOp * clamp01(softU * 2)}>
            <rect x={280} y={110} width={720} height={312} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <Txt x={304} y={146} fs={16}>
              the earlier soft-output trainer
            </Txt>
            <Txt x={304} y={168} color={colors.MUTED}>
              trainProgram averages candidate outputs inside the circuit and follows the output error
            </Txt>
            <Txt x={800} y={198} anchor="middle" color={colors.MUTED}>
              integer
            </Txt>
            <Txt x={910} y={198} anchor="middle" color={colors.MUTED}>
              full checks
            </Txt>
            {SOFT.map((r, i) => {
              const u = clamp01(softU - i);
              const y = 230 + i * 30;
              const op = u * (r.dim ? 0.45 : 1);
              return (
                <g key={i} opacity={op}>
                  <line x1={304} y1={y + 9} x2={976} y2={y + 9} stroke={colors.GRID} strokeWidth={0.8} />
                  <Txt x={304} y={y} mono fs={13}>
                    {r.label}
                  </Txt>
                  <Txt x={800} y={y} anchor="middle" mono fs={14} color={r.int.startsWith('0') ? colors.NEGATIVE : colors.TEXT}>
                    {r.int}
                  </Txt>
                  <Txt x={910} y={y} anchor="middle" mono fs={14} color={r.full.startsWith('0') ? colors.NEGATIVE : colors.TEXT}>
                    {r.full}
                  </Txt>
                </g>
              );
            })}
            <Txt x={304} y={408} color={colors.MUTED} fs={12} opacity={clamp01(softU - 5)}>
              add-fixed rows dimmed: not in the narration
            </Txt>
            {stampU > 0.01 && (
              <g transform={`translate(880 396) rotate(-8) scale(${0.8 + 0.2 * stampU})`} opacity={stampU}>
                <rect x={-78} y={-22} width={156} height={36} rx={6} fill={colors.BG} fillOpacity={0.6} stroke={colors.WARM} strokeWidth={2.4} />
                <text x={0} y={4} textAnchor="middle" fill={colors.WARM} fontSize={18} fontFamily={MONO} fontWeight={700} letterSpacing={2}>
                  HISTORICAL
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== status, plainly ======================== */}
        {statusU > 0.001 && (
          <g opacity={statusOp}>
            {[
              { stamp: 'HOLDS', c: colors.POSITIVE, lines: ['corrected hard-loss optimizer', 'coordinate 60/60 · two-add 59/60', '21 tests pass'] },
              { stamp: 'NARROWED', c: colors.WARM, lines: ['integer training data', 'two straight-line instructions', 'four runtime inputs'] },
              { stamp: 'OPEN', c: colors.ACCENT, lines: ['can fractional examples', 'identify the FP32 grouping?'] },
              { stamp: 'HISTORICAL', c: colors.MUTED, lines: ['soft-output trainer', '11/20 coordinate · 0/20 two-add'] },
            ].map((card, i) => {
              const u = clamp01(statusU - i);
              if (u <= 0) return null;
              const x = 60 + i * 296;
              const y = 230;
              return (
                <g key={i} opacity={u} transform={`translate(0 ${(1 - u) * 16})`}>
                  <rect x={x} y={y} width={276} height={172} rx={12} fill={colors.PANEL} stroke={card.c} strokeWidth={1.6} />
                  <text x={x + 20} y={y + 42} fill={card.c} fontSize={22} fontFamily={MONO} fontWeight={700} letterSpacing={2}>
                    {card.stamp}
                  </text>
                  {card.lines.map((l, li) => (
                    <Txt key={li} x={x + 20} y={y + 82 + li * 24} fs={14}>
                      {l}
                    </Txt>
                  ))}
                </g>
              );
            })}
            <Txt x={640} y={200} anchor="middle" fs={16} color={colors.MUTED} opacity={clamp01(statusU)}>
              lab/status.md · the learned interpreter, plainly
            </Txt>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: the search panel ======================== */}
      {(() => {
        const enumPanel = readU > 0.5 ? enumOp * tableOp : 0;
        const cdPanel = startU > 0.001 ? cdOp * clamp01(startU * 2) : 0;
        const op = Math.max(enumPanel, cdPanel);
        if (op <= 0.005) return null;
        const cdReads = cdStep < 0 ? 0 : cdStep + 1;
        return (
          <g opacity={op}>
            <rect x={SP.x} y={SP.y} width={SP.w} height={SP.h} rx={10} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            {enumPanel > 0.005 && (
              <g opacity={enumPanel / op}>
                <Txt x={SP.x + 16} y={SP.y + 28} mono fs={14} color={colors.TEAL}>
                  enumerateLossMatrix
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 50} color={colors.MUTED}>
                  every entry, in order; a strictly lower
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 68} color={colors.MUTED}>
                  loss replaces the winner
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 112} mono fs={26}>
                  {fmtInt(Math.min(PAIRS, reads))}
                </Txt>
                <Txt x={SP.x + 16 + monoW(fmtInt(Math.min(PAIRS, reads)).length, 26) + 10} y={SP.y + 112} color={colors.MUTED}>
                  / 3,600 reads
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 144} color={colors.WARM} opacity={reads > ENUM_WIN ? 1 : 0}>
                  first minimum: pair 94, never replaced
                </Txt>
              </g>
            )}
            {cdPanel > 0.005 && (
              <g opacity={cdPanel / op}>
                <Txt x={SP.x + 16} y={SP.y + 28} mono fs={14} color={colors.TEAL}>
                  coordinateDescentOnLossMatrix
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 48} color={colors.MUTED}>
                  start: two-add seed 501, original epsilon
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 66} mono fs={12} color={colors.NEGATIVE}>
                  add(pointerX, panelLeft) →
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 82} mono fs={12} color={colors.NEGATIVE}>
                  add(panelLeft, distractor)
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 120} mono fs={26}>
                  {`${cdReads}`}
                </Txt>
                <Txt x={SP.x + 16 + monoW(`${cdReads}`.length, 26) + 10} y={SP.y + 120} color={colors.MUTED}>
                  {cdReads >= CD.reads ? 'reads = 1 + 75 + 48 · 1 sweep' : cdStep >= N1 + 1 ? 'reads · now the column of 48' : 'reads · the row of 75'}
                </Txt>
                <Txt x={SP.x + 16} y={SP.y + 150} color={colors.POSITIVE} opacity={cdDoneU}>
                  zero integer error · a repair, not a search
                </Txt>
              </g>
            )}
          </g>
        );
      })()}

      {/* ======================== screen-space: the closing plate ======================== */}
      {endU > 0.001 && (
        <g opacity={clamp01(endU * 2)}>
          <rect x={190} y={120} width={900} height={420} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <Txt x={230} y={170} fs={18} color={colors.MUTED}>
            untested here
          </Txt>
          {['data-dependent choices', 'loops', 'varying collection lengths', 'longer programs', 'training without scoring a full loss table'].map((l, i) => (
            <g key={l} opacity={clamp01(endU - 0.6 - i * 0.8)}>
              <circle cx={240} cy={206 + i * 36} r={4} fill={colors.SECONDARY} />
              <Txt x={256} y={212 + i * 36} fs={17}>
                {l}
              </Txt>
            </g>
          ))}
          <g opacity={clamp01(endU - 5.6)}>
            <line x1={230} y1={418} x2={1050} y2={418} stroke={colors.GRID} />
            <Txt x={640} y={464} anchor="middle" fs={22} italic>
              “Neither establishes scalable program synthesis.”
            </Txt>
            <Txt x={640} y={498} anchor="middle" color={colors.MUTED}>
              README · learned-interpreter
            </Txt>
          </g>
        </g>
      )}

      {/* header */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · What Integers Cannot Say
      </text>
    </>
  );
}

export const vizScene = () => scene;
