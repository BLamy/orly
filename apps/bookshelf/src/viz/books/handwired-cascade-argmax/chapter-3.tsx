// Training It Soft
//
// Picking Exactly — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
// Paths are relative to lab/cascade-argmax/ unless they begin with src/ or lab/.
//   README.md:9 (the hard cascade gives no useful score gradients), 11 (sixteen cases, eight candidates, a 128-cell
//     table; no shared query/key function), 13-18 (160/160 for both comparators; the single ramp is the control)
//   ramp.test.ts:5-14 (single ramp: seeds 101-110, hardened exact, fewer than half the operations), 16-24 (four
//     probes, gradient [0, 0])
//   cascade-argmax.ts:14-19 (same topology, soft; the centered ramp), 24-35 (CascadeOptions, rampOffset), 37-53
//     (hardCascadeOptions: seven 2**23 scales; softCascadeOptions: totalGain ** (1/7), rampOffset 0.5 / totalGain),
//     57-66 (clamp01), 68-86 (emitCascadeGreaterBit)
//   training.ts:23-32 (RandomSource), 44-50 (defaultTrainingConfig), 111-120 (targets; weights 0.5 + 0.04 * (u - 0.5)),
//     135-168 (the annealed stages; early stop once every case is right and epoch > 10), 170-188 (hardening: both
//     evaluators)
//   report.ts:56-71 ("Hardened winners: 160/160 across 10 seeds."; "Single-ramp hardened winners: 160/160. This is
//     per-case table fitting, not unseen-context generalization.")
//   lab/status.md:202 (fits a table, not a shared rule; hard gradients give no useful signal)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim), checked by Haiku 5.5's fact-check (review.md: "up to" 150 epochs, "receives gradient").
//
// The visual machine: ONE comparator curve (bit [right > left] against the gap) beside ONE 16 × 8 weight table.
// The curve starts as the hard step, loosens into the centered ramp, steepens through the five gains and snaps back
// to the step; the table warms from its near-uniform start, sharpens, is checked row by row, shrinks into the first
// of ten seed lanes, and finally grows back to meet a row it has never seen.
//
// Computed at module scope: the decision curve is a line-for-line f32 port of emitCascadeGreaterBit (seven stage
// scales, clamp01 = v - relu(v - 1)); the four ramp.test.ts probes must give the bits the hard cascade gives; the
// slope 8 at a tie is the finite difference of that port at gain 8; the targets and starting weights for every seed
// come from a port of RandomSource and trainSelection's own formulas; the 448 starting gaps and their maximum are
// derived from those weights. Two snapshots are recorded, not recomputed: the seed-1 table after soft epochs 1 and 2
// (E1, E2), and the per-seed hardened counts, both from running training.ts unchanged except for snapshot hooks
// (.orly-work/hw-books/handwired-cascade-argmax/ch3/probe-training.ts, rounded to 1e-3). That probe also showed what
// the epoch counter draws: every stage of every seed stops at epoch 12 (the epoch > 10 floor), the seed-1 table moves
// only in epochs 1-2 of the first stage, and stages two to five change no weight. The module throws if E2's row
// winners disagree with the recomputed targets. No operation count is shown for the single ramp (only "fewer than
// half", the test's own bound); no timing is shown.
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { interpolateRgb } from 'd3';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH12 = 7.22; // mono advance at 12 px
const CH13 = 7.83; // mono advance at 13 px
const f32 = Math.fround;

// ---------------------------------------------------------------------------
// The lab's own arithmetic (module scope, exact)
// ---------------------------------------------------------------------------

const STAGES = 7; // cascadeStageCount
const relu = (v: number): number => (v > 0 ? v : 0);
/** clamp01(value) = value - relu(value - 1), cascade-argmax.ts:57-63 */
const clampZeroOne = (v: number): number => f32(v - f32(relu(f32(v - 1))));

/**
 * emitCascadeGreaterBit (cascade-argmax.ts:68-86) on a gap = right - left, in f32. `logGain` is log2 of the total gain:
 * 161 is the hard form (seven 2**23 scales); the soft form uses totalGain ** (1/7) per stage. `centered` scales the
 * soft rampOffset 0.5 / totalGain from 0 to 1 (the hard form has offset 0).
 */
function cascadeBit(gap: number, logGain: number, centered: number): number {
  const hard = logGain >= 160.5;
  const scale = hard ? 2 ** 23 : 2 ** (logGain / STAGES);
  const offset = hard ? 0 : (centered * 0.5) / 2 ** logGain;
  let v = relu(f32(f32(gap) + f32(offset)));
  v = f32(v * f32(scale));
  for (let stage = 1; stage < STAGES; stage++) {
    v = clampZeroOne(v);
    v = f32(v * f32(scale));
  }
  return clampZeroOne(v);
}

// ramp.test.ts:18 — the four probes, with the hard bit each gives (right > left)
const PROBES = [
  { l: 0.4, r: 0.6, label: '0.4, 0.6' },
  { l: 0.6, r: 0.4, label: '0.6, 0.4' },
  { l: 0.5, r: 0.5, label: '0.5, 0.5 (tie)' },
  { l: 0, r: 2 ** -149, label: '0, 2⁻¹⁴⁹' },
].map((p) => ({ ...p, gap: f32(f32(p.r) - f32(p.l)), bit: cascadeBit(f32(f32(p.r) - f32(p.l)), 161, 0) }));
if (PROBES.map((p) => p.bit).join() !== '1,0,0,1') throw new Error('picking-exactly ch3: hard probe bits disagree');

// the slope at a tie on the widest ramp (gain 2**3), by finite difference of the port (f32 gives bit 0.49999994)
const TIE_SLOPE = Math.round((cascadeBit(1e-3, 3, 1) - cascadeBit(-1e-3, 3, 1)) / 2e-3);
const TIE_BIT = cascadeBit(0, 3, 1);
if (TIE_SLOPE !== 8 || Math.abs(TIE_BIT - 0.5) > 1e-6) throw new Error('picking-exactly ch3: the centered gain-8 ramp is off');
const HALF_WIDE = 0.5 / 8; // the widest ramp spans |gap| < 0.0625

/** training.ts:23-32 */
class RandomSource {
  state: number;
  constructor(seed: number) {
    this.state = seed | 0;
  }
  next(): number {
    this.state = (Math.imul(this.state, 1_664_525) + 1_013_904_223) | 0;
    return (this.state >>> 0) / 4_294_967_296;
  }
}
const CASES = 16;
const CANDS = 8;
/** training.ts:112-120: targets first, then the starting weights */
function seedStart(seed: number): { targets: number[]; weights: number[][] } {
  const random = new RandomSource(seed);
  const targets = Array.from({ length: CASES }, () => Math.floor(random.next() * CANDS));
  const weights = Array.from({ length: CASES }, () => Array.from({ length: CANDS }, () => 0.5 + 0.04 * (random.next() - 0.5)));
  return { targets, weights };
}
const SEEDS_A = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SEEDS_B = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
const TARGETS_A = SEEDS_A.map((s) => seedStart(s).targets);
const TARGETS_B = SEEDS_B.map((s) => seedStart(s).targets);
const S1 = seedStart(1);
const TARGETS = S1.targets;
const INIT = S1.weights;

// Recorded by the probe (training.ts, seed 1): the table after soft epoch 1 and epoch 2, × 1000.
const E1_RAW = [
  461, 546, 454, 457, 468, 472, 473, 461, 491, 455, 556, 444, 491, 457, 464, 521, 510, 466, 493, 492, 552, 467, 462, 483,
  465, 466, 509, 526, 504, 540, 484, 488, 557, 475, 440, 458, 465, 516, 460, 510, 455, 476, 547, 444, 459, 471, 485, 451,
  459, 464, 510, 512, 467, 473, 551, 481, 482, 466, 473, 491, 550, 453, 463, 469, 558, 457, 449, 475, 475, 462, 465, 503,
  458, 498, 463, 465, 498, 550, 468, 476, 457, 457, 551, 466, 461, 494, 484, 485, 453, 494, 477, 542, 495, 458, 469, 452,
  461, 466, 474, 481, 573, 456, 452, 445, 458, 491, 465, 460, 460, 449, 556, 428, 482, 552, 472, 473, 495, 454, 465, 456,
  480, 459, 485, 465, 466, 512, 465, 556,
];
const E2_RAW = [
  461, 546, 454, 457, 468, 472, 473, 461, 491, 455, 609, 444, 513, 457, 517, 468, 457, 479, 479, 479, 605, 467, 462, 483,
  518, 519, 456, 473, 451, 593, 431, 435, 610, 475, 440, 458, 494, 463, 477, 457, 455, 476, 547, 444, 459, 471, 485, 451,
  480, 495, 457, 459, 467, 473, 604, 481, 482, 466, 473, 491, 550, 453, 463, 469, 558, 457, 449, 475, 475, 462, 465, 503,
  458, 498, 463, 465, 445, 603, 468, 476, 457, 457, 551, 466, 461, 494, 484, 485, 478, 441, 477, 595, 442, 466, 462, 450,
  461, 466, 474, 481, 573, 456, 452, 445, 458, 491, 465, 460, 460, 449, 556, 428, 482, 552, 472, 473, 495, 454, 465, 456,
  480, 459, 485, 465, 503, 458, 465, 609,
];
const toTable = (raw: number[]): number[][] => Array.from({ length: CASES }, (_, r) => raw.slice(r * CANDS, r * CANDS + CANDS).map((v) => v / 1000));
const E1 = toTable(E1_RAW);
const E2 = toTable(E2_RAW);
const argmax = (row: number[]): number => row.reduce((b, v, i) => (v > row[b] ? i : b), 0);
if (E2.some((row, r) => argmax(row) !== TARGETS[r])) throw new Error('picking-exactly ch3: E2 winners disagree with the targets');
// Hardened correct per seed (probe; report.ts prints the 160/160 totals).
const HARD_A = [16, 16, 16, 16, 16, 16, 16, 16, 16, 16];
const HARD_B = [16, 16, 16, 16, 16, 16, 16, 16, 16, 16];
const TOTAL_A = HARD_A.reduce((a, b) => a + b, 0);
const TOTAL_B = HARD_B.reduce((a, b) => a + b, 0);
if (TOTAL_A !== 160 || TOTAL_B !== 160) throw new Error('picking-exactly ch3: hardened totals');

// every pair in every row of the starting table
const GAPS0: number[] = [];
INIT.forEach((row) => {
  for (let i = 0; i < CANDS; i++) for (let j = i + 1; j < CANDS; j++) GAPS0.push(row[j] - row[i]);
});
const MAX_GAP0 = Math.max(...GAPS0.map(Math.abs));
if (MAX_GAP0 >= HALF_WIDE) throw new Error('picking-exactly ch3: a starting gap leaves the widest ramp');
const MAX_GAP0_TXT = (Math.ceil(MAX_GAP0 * 1000) / 1000).toFixed(3);

const GAIN_LOGS = [3, 6, 10, 15, 21]; // defaultTrainingConfig.softStageGains
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '5': '⁵', '6': '⁶', '4': '⁴', '7': '⁷', '8': '⁸', '9': '⁹' };
const pow2 = (e: number): string => `2${String(e).split('').map((c) => SUP[c]).join('')}`;
const EPOCHS_RUN = 12; // probe: every stage of every seed stops here
const EPOCH_CAP = 150;

/** the seed-1 table at a point of the anneal (0..5 stages), pulled toward the start by `rewind` */
function tableAt(anneal: number, rewind: number): number[][] {
  const e = clamp01(anneal) * EPOCHS_RUN;
  return INIT.map((row, r) =>
    row.map((w0, c) => {
      const w = e <= 1 ? lerp(w0, E1[r][c], e) : e <= 2 ? lerp(E1[r][c], E2[r][c], e - 1) : E2[r][c];
      return lerp(w, w0, rewind);
    }),
  );
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 76;
// the comparator plot: gap ∈ [−0.25, 0.25] → x 90..630; bit 0..1 → y 440..200
const PX0 = 90;
const PX1 = 630;
const PY0 = 440;
const PY1 = 200;
const GAP_R = 0.25;
const gx = (d: number): number => lerp(PX0, PX1, (d + GAP_R) / (2 * GAP_R));
const by = (b: number): number => lerp(PY0, PY1, b);
// the seven stage chips
const CHIP = { x: 96, y: 112, w: 62, h: 46, pitch: 76 };
// the gain ladder and counters
const LAD = { x: 96, y: 514, w: 66, h: 26, pitch: 80 };
// the table
const GRID = { x: 828, y: 152, p: 25, c: 23 };
const CHK_REF = 1066;
const CHK_TEN = 1132;
// seed lanes
const LANE = { x: 112, pitch: 108, p: 7, c: 6, yA: 198, yB: 440 };
const laneX = (i: number): number => LANE.x + i * LANE.pitch;

const heat = interpolateRgb('#0d1321', colors.TEAL);
const HEAT_LO = 0.42;
const HEAT_HI = 0.62;
const heatOf = (w: number): string => heat(clamp01((w - HEAT_LO) / (HEAT_HI - HEAT_LO)));

const CAM_PLOT: CameraState = { x: 360, y: 330, k: 1.3 };
const CAM_OPEN: CameraState = { x: 360, y: 330, k: 1.18 };
const CAM_COMP: CameraState = { x: 380, y: 318, k: 1.12 };
const CAM_TIE: CameraState = { x: 360, y: 330, k: 1.45 };
const CAM_UNSEEN: CameraState = { x: 680, y: 384, k: 1.05 };

const IDS = [
  'hardCascadeOptions()',
  'ramp.test.ts · backpropagateReference',
  'softCascadeOptions(totalGain)',
  'rampOffset = 0.5 / totalGain',
  'buildSelectionCircuit · defaultTrainingConfig',
  'softStageGains: [2**3, 2**6, 2**10, 2**15, 2**21]',
  'weights: 0.5 + 0.04 * (random.next() - 0.5)',
  'hardCascadeOptions() · evaluateReference · evaluateTensor',
  'trainSelection(seed) · seeds 1–10',
  "softComparator: 'single-ramp' · seeds 101–110",
  'per-case table fitting',
  'lab/status.md',
];

const CAPTIONS = [
  'Writing a circuit by hand is one thing. Can its scores be learned? The hard cascade is exact, but a hard decision hands back no useful gradient.',
  'The lab measured it. For separated scores, a tie, and the smallest possible gap, the gradient reaching the scores was exactly zero.',
  'So training uses the same topology, soft. The seven scale factors shrink from two to the twenty-third to a gentle gain, and each clamp turns into a ramp.',
  'The ramp is centered on a zero gap, so a tie sits mid-ramp and a wrong decision gets gradient from both orderings.',
  'The task is small. Sixteen cases, eight candidates, and one learned score for every case and candidate: a table of one hundred twenty-eight cells.',
  'Training anneals the total gain in five steps, from eight up to about two million, with up to one hundred fifty epochs at each, stopping early once every case is right.',
  'The weights start close together near one half, so every comparison sits inside the widest ramp and receives gradient from the first epoch.',
  'Then comes hardening. The same weights go into the exact cascade, and every winner must come out exact in both evaluators.',
  'Across ten seeds, all one hundred sixty winners came out right after hardening. That result holds for this table and these seeds.',
  'A control with a single clipped ramp, with under half the operations, also reaches one hundred sixty of one hundred sixty on ten fresh seeds.',
  'So this is per-case table fitting. There is no shared query and key rule, and no claim about contexts the table never saw.',
  'The scorecard: the exact forward construction holds, the learning claim is narrow, and useful gradients through the hard cascade are still missing.',
];

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions at ~150 words per minute
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const idIdx = tl.channel('idIdx', 0);

  // the comparator
  const plotOp = tl.channel('plotOp', 1);
  const axesU = tl.channel('axesU', 0);
  const curveU = tl.channel('curveU', 0);
  const logG = tl.channel('logG', 161);
  const offU = tl.channel('offU', 0);
  const gradU = tl.channel('gradU', 0);
  const dieU = tl.channel('dieU', 0);
  const probeU = tl.channel('probeU', 0);
  const probeOp = tl.channel('probeOp', 1);
  const zeroU = tl.channel('zeroU', 0);
  const chainU = tl.channel('chainU', 0);
  const chainOp = tl.channel('chainOp', 1);
  const softU = tl.channel('softU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const tieU = tl.channel('tieU', 0);
  const ladderU = tl.channel('ladderU', 0);
  const ladderOp = tl.channel('ladderOp', 1);
  const annealU = tl.channel('annealU', 0);
  const noteU = tl.channel('noteU', 0);
  const rewindU = tl.channel('rewindU', 0);
  const gapsU = tl.channel('gapsU', 0);
  const braceU = tl.channel('braceU', 0);
  // the table
  const gridOp = tl.channel('gridOp', 1);
  const gridU = tl.channel('gridU', 0);
  const cellHi = tl.channel('cellHi', 0);
  const countU = tl.channel('countU', 0);
  const hardU = tl.channel('hardU', 0);
  const checksOp = tl.channel('checksOp', 1);
  const oneHotU = tl.channel('oneHotU', 0);
  const laneU = tl.channel('laneU', 0);
  const lanesA = tl.channel('lanesA', 0);
  const totalA = tl.channel('totalA', 0);
  const rampChainU = tl.channel('rampChainU', 0);
  const lanesB = tl.channel('lanesB', 0);
  const totalB = tl.channel('totalB', 0);
  const lanesOp = tl.channel('lanesOp', 1);
  const unseenU = tl.channel('unseenU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const quoteOp = tl.channel('quoteOp', 1);
  const finalU = tl.channel('finalU', 0);
  const chipsU = tl.channel('chipsU', 0);

  // caption slots: ~0.4 s per word (150 wpm) + a breath, then a hold
  const caps: { at: number; dur: number }[] = [];
  let t = 0.4;
  CAPTIONS.forEach((text) => {
    const dur = +(text.split(/\s+/).length * 0.4 + 0.4).toFixed(1);
    caps.push({ at: t, dur });
    t = +(t + dur + 0.6).toFixed(1);
  });
  caps.forEach((c, i) => tl.set(idIdx, i, Math.max(0, c.at - 0.1)));
  const say = (i: number) => {
    tl.caption({ ...caps[i], text: CAPTIONS[i] });
    tl.hold(caps[i].at + caps[i].dur, 0.6);
    return caps[i].at;
  };

  // — B0 · the hard step: exact, and flat on both sides —
  let a = say(0);
  tl.tween(axesU, 1, { at: a + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(curveU, 1, { at: a + 1.2, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: a + 1.0, dur: 3.0, ease: ease.move });
  tl.tween(gradU, 1, { at: a + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(dieU, 1, { at: a + 7.2, dur: 1.4, ease: ease.move });

  // — B1 · four probes, gradient [0, 0] —
  a = say(1);
  tl.tween(gradU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(probeU, 4, { at: a + 0.8, dur: 4.0, ease: ease.linear });
  tl.tween(zeroU, 1, { at: a + 5.4, dur: 0.6, ease: ease.pop });

  // — B2 · the same topology, soft —
  a = say(2);
  tl.tween(probeOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(zeroU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_COMP, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(chainU, 1, { at: a + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(logG, 3, { at: a + 3.4, dur: 3.2, ease: ease.move });
  tl.tween(softU, 1, { at: a + 6.8, dur: 1.0, ease: ease.move });

  // — B3 · centered on a zero gap —
  a = say(3);
  tl.tween(cam, CAM_TIE, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(chainOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(ghostU, 1, { at: a + 0.6, dur: 0.5, ease: ease.enter });
  tl.tween(offU, 1, { at: a + 1.2, dur: 1.3, ease: ease.move });
  tl.tween(ghostU, 0, { at: a + 2.8, dur: 0.5, ease: ease.move });
  tl.tween(tieU, 1, { at: a + 3.6, dur: 0.7, ease: ease.enter });

  // — B4 · the task: a 16 × 8 table —
  a = say(4);
  tl.tween(tieU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: a + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(chainOp, 1, { at: a + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(gridU, 1, { at: a + 1.0, dur: 1.6, ease: ease.linear });
  tl.tween(cellHi, 1, { at: a + 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(countU, 1, { at: a + 6.4, dur: 0.6, ease: ease.pop });

  // — B5 · five gains, up to 150 epochs each, early stop —
  a = say(5);
  tl.tween(cellHi, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(countU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(ladderU, 1, { at: a + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(annealU, 1, { at: a + 1.4, dur: 3.2, ease: ease.linear });
  for (let k = 1; k < GAIN_LOGS.length; k++) {
    const s0 = a + 4.6 + (k - 1) * 1.6;
    tl.tween(logG, GAIN_LOGS[k], { at: s0, dur: 0.4, ease: ease.move });
    tl.tween(annealU, k + 1, { at: s0 + 0.2, dur: 1.3, ease: ease.linear });
  }
  tl.tween(noteU, 1, { at: a + 10.8, dur: 0.6, ease: ease.enter });

  // — B6 · back to epoch 0: every gap inside the widest ramp —
  a = say(6);
  tl.tween(noteU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_PLOT, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(rewindU, 1, { at: a + 0.3, dur: 1.0, ease: ease.move });
  tl.tween(ladderOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(chainOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(gridOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(logG, 3, { at: a + 0.3, dur: 1.0, ease: ease.move });
  tl.tween(gapsU, 1, { at: a + 1.8, dur: 1.4, ease: ease.linear });
  tl.tween(braceU, 1, { at: a + 4.2, dur: 0.7, ease: ease.enter });

  // — B7 · hardening: same weights, exact cascade, both evaluators —
  a = say(7);
  tl.tween(gapsU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(braceU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: a + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(rewindU, 0, { at: a + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(ladderOp, 1, { at: a + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(chainOp, 1, { at: a + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(gridOp, 1, { at: a + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(logG, 161, { at: a + 1.4, dur: 0.6, ease: ease.move });
  tl.tween(softU, 0, { at: a + 1.4, dur: 0.6, ease: ease.move });
  tl.tween(hardU, CASES, { at: a + 2.6, dur: 4.2, ease: ease.linear });

  // — B8 · ten seeds, 160/160 —
  a = say(8);
  tl.tween(plotOp, 0, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(checksOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(oneHotU, 1, { at: a + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(laneU, 1, { at: a + 1.0, dur: 1.3, ease: ease.move });
  tl.tween(lanesA, SEEDS_A.length, { at: a + 2.3, dur: 2.4, ease: ease.linear });
  tl.tween(totalA, 1, { at: a + 5.4, dur: 0.6, ease: ease.pop });

  // — B9 · the single clipped ramp, seeds 101–110 —
  a = say(9);
  tl.tween(rampChainU, 1, { at: a + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(lanesB, SEEDS_B.length, { at: a + 2.4, dur: 2.6, ease: ease.linear });
  tl.tween(totalB, 1, { at: a + 6.0, dur: 0.6, ease: ease.pop });

  // — B10 · a table, not a rule: the unseen row —
  a = say(10);
  tl.tween(lanesOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(laneU, 0, { at: a + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(oneHotU, 0, { at: a + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_UNSEEN, { at: a + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(unseenU, 1, { at: a + 2.4, dur: 0.8, ease: ease.enter });
  tl.tween(quoteU, 1, { at: a + 4.0, dur: 0.7, ease: ease.enter });

  // — B11 · the scorecard —
  a = say(11);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(quoteOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(gridOp, 0.08, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(finalU, 1, { at: a + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(chipsU, 4, { at: a + 1.2, dur: 3.6, ease: ease.linear });
  const last = caps[caps.length - 1];
  tl.hold(last.at + last.dur + 0.6, 2.4);

  return {
    tl, cam, idIdx,
    plotOp, axesU, curveU, logG, offU, gradU, dieU, probeU, probeOp, zeroU, chainU, chainOp, softU, ghostU, tieU,
    ladderU, ladderOp, annealU, noteU, rewindU, gapsU, braceU,
    gridOp, gridU, cellHi, countU, hardU, checksOp, oneHotU, laneU, lanesA, totalA, rampChainU, lanesB, totalB,
    lanesOp, unseenU, quoteU, quoteOp, finalU, chipsU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Check({ x, y, u, color = colors.POSITIVE }: { x: number; y: number; u: number; color?: string }) {
  if (u <= 0.01) return null;
  return (
    <path d={`M ${x - 6} ${y} L ${x - 1.5} ${y + 5} L ${x + 7} ${y - 6}`} fill="none" stroke={color} strokeWidth={2.4}
      strokeLinecap="round" strokeLinejoin="round" opacity={u} />
  );
}

function Pill({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start' }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (fs === 12 ? CH12 : CH13) + 18;
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - 16} width={w} height={23} rx={6} fill={colors.PANEL} stroke={color} strokeOpacity={0.7} />
      <text x={x0 + 9} y={y} fill={color} fontSize={fs} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** a clamp01 stage as a tiny step → ramp glyph */
function ClampGlyph({ x, y, soft }: { x: number; y: number; soft: number }) {
  const w = 9 * soft;
  return (
    <polyline points={`${x - 16},${y + 6} ${x - w},${y + 6} ${x + Math.max(w, 0.01)},${y - 6} ${x + 16},${y - 6}`} fill="none"
      stroke={colors.TEAL} strokeWidth={1.8} strokeLinejoin="round" />
  );
}

function fmtScale(logGain: number): string {
  if (logGain >= 160.5) return pow2(23);
  const s = 2 ** (logGain / STAGES);
  return s >= 1000 ? `2^${(logGain / STAGES).toFixed(1)}` : s >= 100 ? `${Math.round(s)}` : s.toFixed(3);
}

function curvePath(logGain: number, centered: number): string {
  const hard = logGain >= 160.5;
  const off = hard ? 0 : (centered * 0.5) / 2 ** logGain;
  const lo = -off;
  const hi = hard ? 0 : -off + 1 / 2 ** logGain;
  const xs = [-GAP_R, Math.max(-GAP_R, lo), Math.min(GAP_R, hi), GAP_R];
  const pts = xs.map((d, i) => {
    // at the hard riser, draw the jump between bit 0 (at the tie) and bit 1 (just right of it)
    // (a ramp narrower than f32 can resolve is drawn as the riser it saturates to)
    const b = i === 2 && (hard || hi - lo < 2 ** -120) ? 1 : cascadeBit(d, logGain, centered);
    return `${gx(d).toFixed(2)},${by(b).toFixed(2)}`;
  });
  return `M ${pts.join(' L ')}`;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const id = IDS[Math.max(0, Math.min(IDS.length - 1, Math.round(s.get(scene.idIdx))))];

  const plotOp = s.get(scene.plotOp);
  const axesU = s.get(scene.axesU);
  const curveU = s.get(scene.curveU);
  const logGain = s.get(scene.logG);
  const offU = s.get(scene.offU);
  const gradU = s.get(scene.gradU);
  const dieU = s.get(scene.dieU);
  const probeU = s.get(scene.probeU);
  const probeOp = s.get(scene.probeOp);
  const zeroU = s.get(scene.zeroU);
  const chainU = s.get(scene.chainU) * s.get(scene.chainOp);
  const softU = s.get(scene.softU);
  const ghostU = s.get(scene.ghostU);
  const tieU = s.get(scene.tieU);
  const ladderU = s.get(scene.ladderU) * s.get(scene.ladderOp);
  const annealU = s.get(scene.annealU);
  const noteU = s.get(scene.noteU);
  const rewindU = s.get(scene.rewindU);
  const gapsU = s.get(scene.gapsU);
  const braceU = s.get(scene.braceU);
  const gridOp = s.get(scene.gridOp);
  const gridU = s.get(scene.gridU);
  const cellHi = s.get(scene.cellHi);
  const countU = s.get(scene.countU);
  const hardU = s.get(scene.hardU);
  const checksOp = s.get(scene.checksOp);
  const oneHotU = s.get(scene.oneHotU);
  const laneU = s.get(scene.laneU);
  const lanesA = s.get(scene.lanesA);
  const totalA = s.get(scene.totalA);
  const rampChainU = s.get(scene.rampChainU);
  const lanesB = s.get(scene.lanesB);
  const totalB = s.get(scene.totalB);
  const lanesOp = s.get(scene.lanesOp);
  const unseenU = s.get(scene.unseenU);
  const quoteU = s.get(scene.quoteU) * s.get(scene.quoteOp);
  const finalU = s.get(scene.finalU);
  const chipsU = s.get(scene.chipsU);

  const hard = logGain >= 160.5;
  const table = tableAt(annealU, rewindU);
  const correct = table.filter((row, r) => argmax(row) === TARGETS[r]).length;

  // anneal counters
  const stage = annealU >= GAIN_LOGS.length ? GAIN_LOGS.length - 1 : Math.floor(annealU);
  const frac = annealU >= GAIN_LOGS.length ? 1 : annealU - stage;
  const epoch = Math.round(frac * EPOCHS_RUN);

  // the table's geometry: the big grid, or (laneU → 1) lane 1 of the seed lanes
  const gp = lerp(GRID.p, LANE.p, laneU);
  const gc = lerp(GRID.c, LANE.c, laneU);
  const g0x = lerp(GRID.x, laneX(0), laneU);
  const g0y = lerp(GRID.y, LANE.yA, laneU);
  const labelsOp = 1 - clamp01(laneU * 2);

  const tieX = gx(0);
  const tieY = by(cascadeBit(0, logGain, offU));

  return (
    <>
      <Camera {...cam}>
        {/* ======================== the comparator ======================== */}
        {plotOp > 0.005 && (
          <g opacity={plotOp}>
            {/* axes */}
            <g opacity={axesU}>
              <line x1={PX0} y1={PY0} x2={lerp(PX0, PX1, axesU)} y2={PY0} stroke={colors.MUTED} strokeWidth={1.2} />
              <line x1={PX0} y1={PY0} x2={PX0} y2={lerp(PY0, PY1 - 10, axesU)} stroke={colors.MUTED} strokeWidth={1.2} />
              <line x1={tieX} y1={PY0 + 5} x2={tieX} y2={PY1 - 10} stroke={colors.GRID} strokeDasharray="3 4" />
              <line x1={PX0} y1={PY1} x2={PX1} y2={PY1} stroke={colors.GRID} strokeDasharray="3 4" />
              <text x={PX0 - 10} y={PY1 + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>1</text>
              <text x={PX0 - 10} y={PY0 + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>0</text>
              <text x={PX0} y={PY0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>−0.25</text>
              <text x={tieX} y={PY0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>0</text>
              <text x={PX1} y={PY0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>+0.25</text>
              <text x={(PX0 + PX1) / 2} y={PY0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                gap = right score − left score
              </text>
              <text x={PX0} y={PY1 - 20} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                decision bit [right &gt; left]
              </text>
            </g>

            {/* the uncentered ramp, ghosted while it slides */}
            {ghostU > 0.01 && (
              <path d={curvePath(logGain, 0)} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="5 4" opacity={0.6 * ghostU} />
            )}
            {/* THE curve */}
            {curveU > 0.005 && (
              <path d={curvePath(logGain, offU)} fill="none" stroke={hard ? colors.TEXT : colors.TEAL} strokeWidth={3}
                strokeLinejoin="round" pathLength={1} strokeDasharray={`${curveU} 1`} />
            )}
            {curveU > 0.98 && hard && (
              <g>
                <circle cx={tieX} cy={by(0)} r={5} fill={colors.TEXT} />
                <circle cx={tieX} cy={by(1)} r={5} fill={colors.BG} stroke={colors.TEXT} strokeWidth={2} />
              </g>
            )}
            {curveU > 0.98 && hard && axesU > 0.9 && probeU < 0.05 && gradU < 0.05 && (
              <text x={gx(0.12)} y={by(1) - 14} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={1 - clamp01(chainU * 3)}>
                hard: exactly 1 when right is larger
              </text>
            )}

            {/* B0: the gradient arrow dies on the flat */}
            {gradU > 0.01 && (
              <g opacity={gradU}>
                <circle cx={gx(0.12)} cy={by(1)} r={6} fill={colors.WARM} />
                {dieU < 0.98 && (
                  <g>
                    <line x1={gx(0.12)} y1={by(1) - 8} x2={gx(0.12)} y2={by(1) - 8 - 56 * (1 - dieU)} stroke={colors.WARM} strokeWidth={3} />
                    <polygon points={`${gx(0.12) - 7},${by(1) - 6 - 56 * (1 - dieU)} ${gx(0.12) + 7},${by(1) - 6 - 56 * (1 - dieU)} ${gx(0.12)},${by(1) - 18 - 56 * (1 - dieU)}`}
                      fill={colors.WARM} opacity={1 - dieU} />
                  </g>
                )}
                <text x={gx(0.12) + 16} y={by(1) - 40} fill={colors.WARM} fontSize={17} fontFamily={MONO}>
                  {dieU > 0.6 ? '∂bit/∂gap = 0' : '∂bit/∂gap ?'}
                </text>
              </g>
            )}

            {/* B1: the four probes of ramp.test.ts */}
            {probeU > 0.01 && probeOp > 0.005 && (
              <g opacity={probeOp}>
                {PROBES.map((p, i) => {
                  const u = clamp01(probeU - i);
                  if (u <= 0.01) return null;
                  const x = gx(p.gap);
                  const y = by(p.bit);
                  // separated pairs: above their flat; the tie: right of the riser; 2⁻¹⁴⁹: left of it, under the top
                  const lx = i < 2 ? x : i === 2 ? x + 20 : x - 20;
                  const ly = i < 2 ? y - 44 : i === 2 ? y - 56 : y + 50;
                  const anchor = i < 2 ? 'middle' : i === 2 ? 'start' : 'end';
                  return (
                    <g key={i} opacity={u}>
                      <circle cx={x} cy={y} r={7} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                      <line x1={x} y1={i === 3 ? y + 9 : y - 9} x2={i < 2 ? x : lx} y2={i === 3 ? ly - 16 : ly + 20} stroke={colors.WARM} strokeOpacity={0.5} />
                      <text x={lx} y={ly - 2} textAnchor={anchor} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        scores {p.label}
                      </text>
                      <text x={lx} y={ly + 14} textAnchor={anchor} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                        gradient [0, 0]
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
            <Pill x={gx(0.13)} y={by(0.55)} text="all four: exactly zero" color={colors.WARM} opacity={zeroU * probeOp} anchor="middle" />

            {/* B2: the seven stage scales */}
            {chainU > 0.01 && (
              <g opacity={chainU}>
                {Array.from({ length: STAGES }, (_, i) => {
                  const x = CHIP.x + i * CHIP.pitch;
                  return (
                    <g key={i}>
                      <rect x={x} y={CHIP.y} width={CHIP.w} height={CHIP.h} rx={6} fill={colors.PANEL} stroke={hard ? colors.GRID : colors.TEAL} strokeOpacity={hard ? 1 : 0.6} />
                      <text x={x + CHIP.w / 2} y={CHIP.y + 17} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        ×{fmtScale(logGain)}
                      </text>
                      <ClampGlyph x={x + CHIP.w / 2} y={CHIP.y + 32} soft={softU} />
                    </g>
                  );
                })}
                <text x={CHIP.x} y={CHIP.y - 10} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  seven stage scales, each followed by clamp01
                </text>
                <text x={CHIP.x + 7 * CHIP.pitch - 14} y={CHIP.y - 10} textAnchor="end" fill={hard ? colors.MUTED : colors.TEAL} fontSize={13} fontFamily={MONO}>
                  {hard ? `total ${pow2(161)}` : `total 2^${logGain.toFixed(logGain % 1 ? 1 : 0)}`}
                </text>
              </g>
            )}

            {/* B3: the tie sits mid-ramp */}
            {tieU > 0.01 && (
              <g opacity={tieU}>
                <circle cx={tieX} cy={tieY} r={7} fill={colors.WARM} />
                <line x1={lerp(tieX, gx(-HALF_WIDE), 0.18)} y1={lerp(tieY, by(0), 0.18)} x2={lerp(tieX, gx(-HALF_WIDE), 0.9)} y2={lerp(tieY, by(0), 0.9)} stroke={colors.WARM} strokeWidth={2.4} />
                <line x1={lerp(tieX, gx(HALF_WIDE), 0.18)} y1={lerp(tieY, by(1), 0.18)} x2={lerp(tieX, gx(HALF_WIDE), 0.9)} y2={lerp(tieY, by(1), 0.9)} stroke={colors.WARM} strokeWidth={2.4} />
                <polygon points={`${gx(-HALF_WIDE)},${by(0)} ${gx(-HALF_WIDE) + 3},${by(0) - 13} ${gx(-HALF_WIDE) + 13},${by(0) - 4}`} fill={colors.WARM} />
                <polygon points={`${gx(HALF_WIDE)},${by(1)} ${gx(HALF_WIDE) - 3},${by(1) + 13} ${gx(HALF_WIDE) - 13},${by(1) + 4}`} fill={colors.WARM} />
                <text x={tieX + 18} y={tieY + 34} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  tie: bit {TIE_BIT.toFixed(3)}, slope {TIE_SLOPE}
                </text>
                <text x={gx(-HALF_WIDE) - 6} y={by(0) - 22} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={UI}>
                  left side pulled
                </text>
                <text x={gx(HALF_WIDE) + 8} y={by(1) + 24} fill={colors.WARM} fontSize={13} fontFamily={UI}>
                  right side pulled
                </text>
              </g>
            )}

            {/* B5: the gain ladder and the epoch counter */}
            {ladderU > 0.01 && (
              <g opacity={ladderU}>
                <text x={LAD.x} y={LAD.y - 12} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  total gain per soft stage
                </text>
                {GAIN_LOGS.map((g, k) => {
                  const on = !hard && annealU > 0 && k === stage;
                  const done = annealU > 0 && (k < stage || (k === stage && frac >= 0.999));
                  const x = LAD.x + k * LAD.pitch;
                  return (
                    <g key={k}>
                      <rect x={x} y={LAD.y} width={LAD.w} height={LAD.h} rx={6} fill={on ? colors.TEAL : colors.PANEL} fillOpacity={on ? 0.22 : 1}
                        stroke={on || done ? colors.TEAL : colors.GRID} />
                      <text x={x + LAD.w / 2} y={LAD.y + 18} textAnchor="middle" fill={on ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO}>
                        {pow2(g)}
                      </text>
                    </g>
                  );
                })}
                <text x={LAD.x + 5 * LAD.pitch + 4} y={LAD.y + 18} fill={hard ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO}>
                  → hard {pow2(161)}
                </text>
                {annealU > 0.001 && rewindU < 0.5 && (
                  <text x={LAD.x} y={LAD.y + 52} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                    {`stage ${stage + 1} · epoch ${epoch} of up to ${EPOCH_CAP}${epoch === EPOCHS_RUN ? ' · stop' : ''}`}
                  </text>
                )}
                {annealU > 0.001 && rewindU < 0.5 && (
                  <text x={LAD.x + 400} y={LAD.y + 52} fill={correct === CASES ? colors.POSITIVE : colors.MUTED} fontSize={14} fontFamily={MONO}>
                    {`${correct}/${CASES} right`}
                  </text>
                )}
                <text x={LAD.x} y={LAD.y + 76} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={noteU}>
                  seed 1: weights move in epochs 1–2 only; stages 2–5 change none
                </text>
              </g>
            )}

            {/* B6: every starting gap sits on the widest ramp */}
            {gapsU > 0.01 && (
              <g>
                {GAPS0.map((g, i) => {
                  const u = clamp01(gapsU * GAPS0.length - i * 0.6);
                  if (u <= 0) return null;
                  return <circle key={i} cx={gx(g)} cy={by(cascadeBit(g, 3, 1))} r={2.6} fill={colors.WARM} opacity={0.55 * u} />;
                })}
              </g>
            )}
            {braceU > 0.01 && (
              <g opacity={braceU}>
                {/* the starting gaps */}
                <line x1={gx(-MAX_GAP0)} y1={PY0 + 64} x2={gx(MAX_GAP0)} y2={PY0 + 64} stroke={colors.WARM} strokeWidth={2.4} />
                <line x1={gx(-MAX_GAP0)} y1={PY0 + 58} x2={gx(-MAX_GAP0)} y2={PY0 + 70} stroke={colors.WARM} strokeWidth={2} />
                <line x1={gx(MAX_GAP0)} y1={PY0 + 58} x2={gx(MAX_GAP0)} y2={PY0 + 70} stroke={colors.WARM} strokeWidth={2} />
                <text x={gx(MAX_GAP0) + 12} y={PY0 + 69} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                  all {GAPS0.length} starting gaps: |gap| &lt; {MAX_GAP0_TXT}
                </text>
                <text x={PX0 + 14} y={by(0.82)} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  seed 1 · epoch 0
                </text>
                {/* the widest ramp */}
                <line x1={gx(-HALF_WIDE)} y1={PY1 - 30} x2={gx(HALF_WIDE)} y2={PY1 - 30} stroke={colors.TEAL} strokeWidth={2.4} />
                <line x1={gx(-HALF_WIDE)} y1={PY1 - 36} x2={gx(-HALF_WIDE)} y2={PY1 - 24} stroke={colors.TEAL} strokeWidth={2} />
                <line x1={gx(HALF_WIDE)} y1={PY1 - 36} x2={gx(HALF_WIDE)} y2={PY1 - 24} stroke={colors.TEAL} strokeWidth={2} />
                <text x={gx(HALF_WIDE) + 12} y={PY1 - 25} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                  widest ramp ({pow2(3)}): |gap| &lt; 0.0625
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== the table ======================== */}
        {gridU > 0.005 && gridOp > 0.005 && (
          <g opacity={gridOp}>
            {/* titles and indices (fade as it becomes a lane) */}
            {labelsOp > 0.01 && (
              <g opacity={labelsOp * clamp01(gridU * 2)}>
                <text x={GRID.x} y={GRID.y - 40} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  one learned score per case and candidate
                </text>
                {Array.from({ length: CANDS }, (_, c) => (
                  <text key={c} x={GRID.x + c * GRID.p + GRID.c / 2} y={GRID.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {c}
                  </text>
                ))}
                {Array.from({ length: CASES }, (_, r) => (
                  <text key={r} x={GRID.x - 8} y={GRID.y + r * GRID.p + 16} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    case {r}
                  </text>
                ))}
                <text x={GRID.x + CANDS * GRID.p + 4} y={GRID.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={1 - clamp01(hardU * 4)}>
                  ◦ target
                </text>
                {/* heat legend */}
                {unseenU < 0.01 && (
                  <g>
                    <defs>
                      <linearGradient id="pe3-heat" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0" stopColor={heat(0)} />
                        <stop offset="0.5" stopColor={heat(0.5)} />
                        <stop offset="1" stopColor={heat(1)} />
                      </linearGradient>
                    </defs>
                    <rect x={GRID.x + 40} y={GRID.y + CASES * GRID.p + 12} width={120} height={8} rx={2} fill="url(#pe3-heat)" stroke={colors.GRID} />
                    <text x={GRID.x + 34} y={GRID.y + CASES * GRID.p + 21} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {HEAT_LO.toFixed(2)}
                    </text>
                    <text x={GRID.x + 166} y={GRID.y + CASES * GRID.p + 21} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {HEAT_HI.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* the 128 cells */}
            {table.map((row, r) =>
              row.map((w, c) => {
                const u = clamp01(gridU * (CASES * CANDS) * 0.12 - (r * CANDS + c) * 0.1);
                if (u <= 0) return null;
                const isT = TARGETS[r] === c;
                const fill = oneHotU > 0.001 ? interpolateRgb(heatOf(w), isT ? colors.WARM : '#0d1321')(oneHotU) : heatOf(w);
                const x = g0x + c * gp;
                const y = g0y + r * gp;
                return (
                  <rect key={`${r}-${c}`} x={x} y={y} width={gc} height={gc} rx={lerp(3, 1, laneU)} fill={fill} opacity={u}
                    stroke={oneHotU > 0.5 ? 'none' : colors.GRID} strokeWidth={0.8} />
                );
              }),
            )}
            {/* target rings */}
            {labelsOp > 0.01 && gridU > 0.9 && (
              <g opacity={labelsOp}>
                {TARGETS.map((c, r) => (
                  <circle key={r} cx={GRID.x + c * GRID.p + GRID.c - 5} cy={GRID.y + r * GRID.p + 5} r={2.6} fill="none" stroke={colors.WARM} strokeWidth={1.4} />
                ))}
              </g>
            )}
            {/* B4: one cell spotlit */}
            {cellHi > 0.01 && (
              <g opacity={cellHi}>
                <rect x={GRID.x + 1 * GRID.p - 3} y={GRID.y - 3} width={GRID.c + 6} height={GRID.c + 6} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                <line x1={GRID.x + 2 * GRID.p} y1={GRID.y + GRID.c / 2} x2={GRID.x + CANDS * GRID.p + 10} y2={GRID.y + GRID.c / 2} stroke={colors.WARM} strokeOpacity={0.6} />
                <text x={GRID.x + CANDS * GRID.p + 16} y={GRID.y + 17} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                  case 0, candidate 1: {INIT[0][1].toFixed(3)}
                </text>
              </g>
            )}
            {countU > 0.01 && (
              <g opacity={countU}>
                <rect x={GRID.x + CANDS * GRID.p + 18} y={GRID.y + 160} width={170} height={70} rx={8} fill={colors.PANEL} stroke={colors.TEAL} />
                <text x={GRID.x + CANDS * GRID.p + 103} y={GRID.y + 190} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
                  16 × 8 = 128
                </text>
                <text x={GRID.x + CANDS * GRID.p + 103} y={GRID.y + 214} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  cells, one table
                </text>
              </g>
            )}

            {/* B7: hardening, row by row, both evaluators */}
            {hardU > 0.01 && checksOp > 0.005 && (
              <g opacity={checksOp}>
                <text x={CHK_REF} y={GRID.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>reference</text>
                <text x={CHK_TEN} y={GRID.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>tensor</text>
                {TARGETS.map((c, r) => {
                  const u = clamp01(hardU - r);
                  if (u <= 0) return null;
                  const y = GRID.y + r * GRID.p + GRID.c / 2;
                  return (
                    <g key={r}>
                      <rect x={GRID.x + c * GRID.p - 2} y={GRID.y + r * GRID.p - 2} width={GRID.c + 4} height={GRID.c + 4} rx={4} fill="none"
                        stroke={colors.WARM} strokeWidth={2.2} opacity={u} />
                      <Check x={CHK_REF} y={y} u={clamp01(u * 2)} />
                      <Check x={CHK_TEN} y={y} u={clamp01(u * 2 - 1)} />
                    </g>
                  );
                })}
                <text x={GRID.x} y={GRID.y + CASES * GRID.p + 52} fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={clamp01(hardU - CASES + 1)}>
                  hardened: {CASES}/{CASES} exact one-hot winners
                </text>
              </g>
            )}

            {/* B10: the unseen row */}
            {unseenU > 0.01 && (
              <g opacity={unseenU}>
                {Array.from({ length: CANDS }, (_, c) => {
                  const x = GRID.x + c * GRID.p;
                  const y = GRID.y + CASES * GRID.p + 6;
                  return (
                    <g key={c}>
                      <rect x={x} y={y} width={GRID.c} height={GRID.c} rx={3} fill="none" stroke={colors.MUTED} strokeDasharray="3 3" />
                      <text x={x + GRID.c / 2} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>?</text>
                    </g>
                  );
                })}
                <text x={GRID.x - 8} y={GRID.y + CASES * GRID.p + 22} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  unseen case
                </text>
                <text x={GRID.x + CANDS * GRID.p + 12} y={GRID.y + CASES * GRID.p + 22} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  no weights to read
                </text>
              </g>
            )}
          </g>
        )}

        {/* B10: the claim, in the report's words */}
        {quoteU > 0.01 && (
          <g opacity={quoteU}>
            <rect x={300} y={248} width={420} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={300} y={248} width={4} height={150} rx={2} fill={colors.WARM} />
            <text x={322} y={282} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>This is per-case table fitting,</text>
            <text x={322} y={306} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>not unseen-context generalization.</text>
            <text x={322} y={344} fill={colors.MUTED} fontSize={13} fontFamily={UI}>each row is its own eight weights;</text>
            <text x={322} y={364} fill={colors.MUTED} fontSize={13} fontFamily={UI}>no shared query/key rule links the rows</text>
            <text x={710} y={388} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>report.ts</text>
          </g>
        )}

        {/* ======================== the seed lanes ======================== */}
        {laneU > 0.01 && lanesOp > 0.005 && (
          <g opacity={lanesOp}>
            <text x={LANE.x} y={LANE.yA - 34} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={laneU}>
              seven-stage soft cascade · seeds 1–10
            </text>
            {SEEDS_A.map((seed, i) => {
              const u = i === 0 ? laneU : clamp01(lanesA - i + 1);
              if (u <= 0.01) return null;
              const x = laneX(i);
              return (
                <g key={seed} opacity={u}>
                  <text x={x + 28} y={LANE.yA - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>seed {seed}</text>
                  {i > 0 && <MiniLane x={x} y={LANE.yA} targets={TARGETS_A[i]} />}
                  <text x={x + 28} y={LANE.yA + 16 * LANE.p + 20} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                    {HARD_A[i]}/{CASES}
                  </text>
                </g>
              );
            })}
            <text x={LANE.x} y={LANE.yA + 16 * LANE.p + 56} fill={colors.WARM} fontSize={16} fontFamily={MONO} opacity={totalA}>
              Hardened winners: {TOTAL_A}/160 across 10 seeds.
            </text>

            {/* the control */}
            <g opacity={clamp01(rampChainU * 2)}>
              <text x={LANE.x} y={LANE.yB - 34} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                single clipped ramp · seeds 101–110
              </text>
              <RampChain x={560} y={LANE.yB - 46} u={rampChainU} />
              <text x={laneX(9) + 56} y={LANE.yB - 34} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                under half the operations
              </text>
            </g>
            {SEEDS_B.map((seed, i) => {
              const u = clamp01(lanesB - i);
              if (u <= 0.01) return null;
              const x = laneX(i);
              return (
                <g key={seed} opacity={u}>
                  <text x={x + 28} y={LANE.yB - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>seed {seed}</text>
                  <MiniLane x={x} y={LANE.yB} targets={TARGETS_B[i]} />
                  <text x={x + 28} y={LANE.yB + 16 * LANE.p + 20} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                    {HARD_B[i]}/{CASES}
                  </text>
                </g>
              );
            })}
            <text x={LANE.x} y={LANE.yB + 16 * LANE.p + 50} fill={colors.WARM} fontSize={16} fontFamily={MONO} opacity={totalB}>
              Single-ramp hardened winners: {TOTAL_B}/160
            </text>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: the scorecard ======================== */}
      {finalU > 0.01 && (
        <g opacity={finalU}>
          <rect x={250} y={142} width={780} height={392} rx={14} fill={colors.BG} stroke={colors.GRID} />
          <text x={640} y={190} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontFamily={UI} fontWeight={600}>
            Scorecard
          </text>
          {SCORE.map((row, i) => {
            const u = clamp01(chipsU - i);
            const y = 246 + i * 72;
            return (
              <g key={i} opacity={u}>
                <rect x={290} y={y - 30} width={700} height={56} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                <rect x={290} y={y - 30} width={5} height={56} rx={2} fill={row.color} />
                <text x={314} y={y + 6} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
                  {row.what}
                </text>
                <Pill x={970} y={y + 4} text={row.status} color={row.color} anchor="end" fs={13} />
              </g>
            );
          })}
        </g>
      )}

      {/* ======================== screen-space: title, identifier chip ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Training It Soft
      </text>
      <g>
        <rect x={40} y={48} width={id.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
          {id}
        </text>
      </g>
    </>
  );
}

const SCORE = [
  { what: 'exact forward construction', status: 'holds', color: colors.POSITIVE },
  { what: 'exactness of the cascade', status: 'sampled, not proven', color: colors.WARM },
  { what: 'learning claim', status: 'narrowed: one 128-cell table', color: colors.WARM },
  { what: 'useful gradients through the hard cascade', status: 'still missing', color: colors.NEGATIVE },
];

/** a seed's hardened one-hot table: one lit cell per case */
function MiniLane({ x, y, targets }: { x: number; y: number; targets: number[] }) {
  return (
    <g>
      {targets.map((t, r) =>
        Array.from({ length: CANDS }, (_, c) => (
          <rect key={`${r}-${c}`} x={x + c * LANE.p} y={y + r * LANE.p} width={LANE.c} height={LANE.c} rx={1}
            fill={c === t ? colors.WARM : '#0d1321'} stroke={c === t ? 'none' : colors.GRID} strokeWidth={0.5} />
        )),
      )}
    </g>
  );
}

/** seven stages fold into one clipped ramp */
function RampChain({ x, y, u }: { x: number; y: number; u: number }) {
  return (
    <g>
      {Array.from({ length: STAGES }, (_, i) => {
        const cx = lerp(x + i * 24, x + 72, u);
        return <rect key={i} x={cx} y={y - 3} width={18} height={18} rx={3} fill="none" stroke={colors.TEAL} strokeWidth={1.6} opacity={i === 3 ? 1 : 1 - u * 0.9} />;
      })}
      <text x={x + 178} y={y + 12} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
        {u < 0.5 ? '7 stages' : '1 ramp'}
      </text>
    </g>
  );
}

export const vizScene = () => scene;
