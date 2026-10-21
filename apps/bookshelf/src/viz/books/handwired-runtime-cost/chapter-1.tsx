// Three ways to run one circuit
//
// Runtime Cost — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/runtime-cost/README.md:3 (the three runners), 5 (median of seven, rotation, checksums), 7 (overwritten
//     output, copy to keep a frame), 9 (allocation and output-copying costs; one ratio is no guarantee)
//   lab/runtime-cost/report.ts:13-19 (select), 22-24 (the three runners), 29-42 (7 samples, rotating order,
//     200 warm-ups, checksum must agree or throw), 73 (window manager, 500 iterations)
//   src/runtime/numeric-ui-core.ts:649-652 (evaluateReference), 751-754 (evaluateTensor), 756-785
//     (createTensorEvaluator: workspace + outputs built once, roots copied out per call), 787-797
//     (validateSourceRanges), 1673-1703 (evaluateOperationStream: Float32Array(sourceSize + operations.length)),
//     1704-1715 (evaluateTensorProgram: fresh workspace + Float32Array(program.width), scatter by wireOrder),
//     1717-1731 (createTensorWorkspace: five typed arrays)
//   src/handwiredos/README.md:13 (234 source cells, 4,646 live operations, 130 layers, 9,909 stored weights)
//   Timings: research run 2 of report.ts (.orly-work/hw-books/inputs/runtime-cost.md:57-110; Bun 1.4.3, Apple M4
//     Max, load ≈ 9): window manager 149.65 / 49.48 / 42.81 µs, checksum 89,727,500.
//
// Every size below comes from a read-only probe of the pinned clone (compileTensorProgram on
// createWindowManagerMachine's roots, run with bun outside the repo): sourceSize 234, operations 5,028, width 5,262,
// valueCount 4,880, roots 727, max layer input 383, max projection 736, gather slots 0, and the 130 layer output
// sizes (they sum to 4,646, checked below). SCATTER is the same probe's wireOrder, binned: for 64 bins of 83 wires
// each, the filled fraction of the full array (×35, base 36) after each sixteenth of the scatter loop. ROOT_SAMPLE
// is every 61st root's packed position. The intro's "one call" bar is a question, not a measurement (no split shown).
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Machine: three lanes share one circuit; each lane's memory slabs are drawn to scale
// (0.1 px per element), allocated, filled layer by layer from the real widths, and dropped or kept per call; the
// same lanes then carry the timing race.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const bump = (u: number, a: number, b: number, edge = 0.08): number =>
  clamp01(Math.min((u - a) / edge, (b - u) / edge, 1));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH14 = 8.4; // mono advance at 14 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The window manager's compiled program (probe of the pinned clone)
// ---------------------------------------------------------------------------

const SOURCES = 234;
const OPERATIONS = 5028;
const WIDTH = SOURCES + OPERATIONS; // program.width = sourceSize + operations.length
const LIVE = 4646;
const VALUE_COUNT = SOURCES + LIVE; // packedValues
const ROOTS = 727;
const MAX_INPUT = 383;
const MAX_PROJECTION = 736;
const GATHER_SLOTS = 0;
const STORED_WEIGHTS = 9909;
const LAYER_W = [
  401, 214, 90, 94, 52, 10, 7, 15, 10, 14, 11, 9, 11, 10, 7, 32, 68, 71, 67, 14, 14, 11, 9, 43, 53, 59, 40, 24, 10, 8,
  4, 4, 3, 7, 3, 6, 3, 4, 6, 18, 18, 26, 44, 51, 48, 44, 40, 51, 31, 18, 11, 21, 45, 46, 45, 32, 35, 30, 38, 24, 24,
  41, 35, 31, 29, 33, 33, 25, 9, 45, 27, 17, 24, 25, 37, 48, 48, 33, 38, 44, 50, 20, 20, 84, 83, 77, 143, 71, 6, 5, 5,
  3, 3, 3, 2, 2, 2, 2, 2, 3, 5, 6, 9, 29, 4, 14, 15, 51, 41, 167, 117, 43, 30, 31, 17, 17, 15, 16, 51, 27, 31, 40, 41,
  28, 29, 50, 25, 26, 133, 72,
];
const LAYERS = LAYER_W.length;
const CUM = LAYER_W.reduce<number[]>((acc, w) => [...acc, acc[acc.length - 1] + w], [0]);
if (LAYERS !== 130 || CUM[LAYERS] !== LIVE) throw new Error('layer widths do not match the README');
const MAX_W = Math.max(...LAYER_W);

const WORKSPACE = [
  { name: 'packedValues', n: VALUE_COUNT },
  { name: 'input', n: MAX_INPUT },
  { name: 'projection', n: MAX_PROJECTION },
  { name: 'gatherIndices', n: GATHER_SLOTS },
  { name: 'gatherMasses', n: GATHER_SLOTS },
];
const WORKSPACE_N = WORKSPACE.reduce((t, a) => t + a.n, 0); // 5,999
const NEW_PER_CALL = [
  { arrays: 1, n: WIDTH },
  { arrays: WORKSPACE.length + 1, n: WORKSPACE_N + WIDTH }, // 6 arrays, 11,261 elements
  { arrays: 0, n: 0 },
];

const SCATTER_BIN = 83;
const SCATTER = [
  'zzzzzzzzzzzzzzzz', 'zzzzzzzzzzzzzzzz', 'uuwzzzzzzzzzzzzz', '113ksuuuuuuuuuuu', '0001owwwwwwwwwww', '0003gxxxxxxxxxxx',
  '112fqwwwwwwwwwww', '002aqxxxxxxxxxxx', '0005nwwwwwwwwwww', '0003hvvvvvvvvvvv', '0005dttttttttttt', '1111juuuuuuuuuuu',
  '11555wxxxxxxxxxx', '338gglvvvvvvvvvv', '001112qxxxxxxxxx', '001112qxxxxxxxxx', '001112qxxxxxxxxx', '000000tuuuuuuuuu',
  '0000009vvvvvvvvv', '0001111nvvvvvvvv', 'ddorrrrvyyyyyyyy', '3368888cjwzzzzzz', '18dggggouuwyyyyy', '09gkkkkpwzzzzzzz',
  '0455666egqwyyyyy', '0dnsssswzzzzzzzz', '001333348qwyyyyy', '0000003djppppppp', '00000005uuuuuuuu', '0577777brsssssss',
  '0bffffffquvvvvvv', '000000000gssssss', '000000000drrrrrr', '000000000fssssss', '000000000essssss', '00000003ejnsssss',
  '000000002225wwww', '036666669999tyyy', '036999999999ckxx', '000000000000246z', '000000000000003z', '000000000000003z',
  '000000000000sstv', '07cfffffffffmryy', '08dfffffffffgkuz', '09gjjjjjjjjjjowz', '08dhhhhhhhhhiowz', '09gjjjjjjjjjjowz',
  '07aggggggggggnwz', '07aeeeeeeeeefjwz', '07aeeeeeeeeefjvz', '08dhhhhhhhhhimuz', '03dhhhhhhhhhiowz', '005888efffffgiuw',
  '00000448luxzzzzz', '00111112337dsvyy', '00000000007krvvv', '00000000008mtwww', '00000000007lrwww', '00000000007llvvv',
  '00000000007mmwww', '00000000005llwww', '00000000003kkvvv', '00000000036kmwww',
].map((s) => [0, ...[...s].map((c) => parseInt(c, 36) / 35)]);
if (SCATTER.length * SCATTER_BIN < WIDTH || (SCATTER.length - 1) * SCATTER_BIN >= WIDTH) throw new Error('scatter bins');
const scatterFill = (bin: number, u: number): number => {
  const f = clamp01(u) * 16;
  const k = Math.min(15, Math.floor(f));
  return lerp(SCATTER[bin][k], SCATTER[bin][k + 1], f - k);
};
const ROOT_SAMPLE = [234, 2729, 152, 4373, 1406, 4837, 4639, 2307, 4105, 3411, 3547, 3655]; // root 30, 91, 152, …

// research run 2 (report.ts, window manager, 500 iterations, median of 7)
const US = [149.65083400000003, 49.480334000000305, 42.808915999999954];
const CHECKSUM = 89727500;
const RATIO_FULL = US[1] / US[2]; // 1.156
const RATIO_REF = US[0] / US[2]; // 3.496

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const LANE_X = 270;
const LANE_W = 970;
const LANE_H = 124;
const LT = [96, 236, 376];
const MX = 530; // memory area left edge
const PX = 0.1; // px per element
const ROW_A = 20;
const ROW_B = 76;
const SLAB_H = 24;
const CX = 1146; // counter column
const US_PX = 3.6; // px per µs in the race
const LANES = [
  { name: 'reference', fn: 'evaluateReference', info: '5,028 operations, one at a time', color: colors.MUTED },
  { name: 'tensor full array', fn: 'evaluateTensorProgram', info: '4,646 live ops in 130 layers', color: colors.SECONDARY },
  { name: 'tensor reusable roots', fn: 'createTensorEvaluator(roots)', info: '130 layers · 727 roots out', color: colors.POSITIVE },
];

// the circuit: 130 columns (intro skyline) that fold into 130 rows (left-hand tower)
const SKY = LAYER_W.map((w, j) => {
  const h = (w / MAX_W) * 250;
  return { x: 150 + j * 7.6, y: 430 - h, w: 5.4, h };
});
const TOWER = LAYER_W.map((w, j) => ({ x: 40, y: 104 + j * 3, w: Math.max(1, (w / MAX_W) * 180), h: 2.2 }));
const TOWER_OUT = { x: 228, y: 300 };

const CODE = [
  'const evaluate = circuit.createTensorEvaluator(roots)',
  'const a = evaluate(sourceA)',
  'const b = evaluate(sourceB)   // a === b: one array, now B',
  'const kept = evaluate(sourceA).slice()   // copy it first',
];
const CODE_BOX = { x: 600, y: 516, w: Math.max(...CODE.map((l) => l.length)) * CH14 + 30, h: CODE.length * 20 + 14 };

const HOME: CameraState = CAMERA_HOME;
const CAM_INTRO: CameraState = { x: 640, y: 330, k: 1.12 };
const CAM_LANE = (i: number): CameraState => ({ x: 760, y: LT[i] + 62, k: 1.3 });
const CAM_HARNESS: CameraState = { x: 755, y: 440, k: 1.15 };
const CAM_TOWER: CameraState = { x: 330, y: 320, k: 1.4 };

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, spoken at ~150 words a minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Handwired turns a program into layers of weighted sums. This lab asks a plain question: when that circuit runs on a CPU, how much of each call goes to allocating and copying memory?',
  'Three runners get the same circuit. The reference walks operations one at a time. The tensor executor runs layer by layer. The third is that executor with its buffers kept between calls.',
  'The reference allocates one fresh array on every call, sized for every source cell plus every operation, then evaluates each operation as its own scalar step.',
  'The plain tensor executor allocates a whole new workspace on every call, runs the layers, then builds a full array holding every wire and scatters each value into it.',
  'The reusable version builds its workspace once, plus one small output array. Each call runs the layers and copies out only the outputs you asked for.',
  'The price is that the next call overwrites that output array. Anyone who wants to keep a frame has to copy it first.',
  'All three also check, on every call, that each source value sits inside its declared range. That check is inside every timing, so it is a shared cost, not a difference.',
  'The harness is careful. Each method warms up two hundred times, the order rotates between samples, seven samples are taken, and if the checksums of the outputs disagree, the run throws.',
  'The test circuit is the Handwired OS window manager: two hundred thirty-four source cells, four thousand six hundred forty-six live operations, one hundred thirty layers.',
  'On one run, the reference takes about one hundred fifty microseconds per evaluation, the full-array executor about forty-nine, and the reusable one about forty-three.',
  'So reusable is about one point one six times faster than full array, and three and a half times faster than the reference. One run, one machine, one process.',
];
const WPS = 150 / 60;
const HOLD = 0.8;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_INTRO, cameraInterp);

  // the circuit
  const skyU = tl.channel('skyU', 0);
  const foldU = tl.channel('foldU', 0);
  const towerOp = tl.channel('towerOp', 1);
  const askU = tl.channel('askU', 0);
  const feedU = tl.channel('feedU', 0);
  // the lanes
  const laneIn = [0, 1, 2].map((i) => tl.channel(`lane${i}In`, 0));
  const laneOp = [0, 1, 2].map((i) => tl.channel(`lane${i}Op`, 1));
  const chromeOp = tl.channel('chromeOp', 1);
  const memOp = tl.channel('memOp', 1);
  const countU = [0, 1, 2].map((i) => tl.channel(`lane${i}Count`, 0));
  // lane 0: reference
  const alloc0 = tl.channel('refAlloc', 0);
  const fill0 = tl.channel('refFill', 0);
  const drop0 = tl.channel('refDrop', 0);
  // lane 1: tensor full array
  const alloc1 = tl.channel('fullWorkspace', 0);
  const fill1 = tl.channel('fullLayers', 0);
  const alloc1b = tl.channel('fullArray', 0);
  const scatter1 = tl.channel('fullScatter', 0);
  const drop1 = tl.channel('fullDrop', 0);
  // lane 2: tensor reusable roots
  const alloc2 = tl.channel('reuseWorkspace', 0);
  const alloc2b = tl.channel('reuseOutputs', 0);
  const fill2 = tl.channel('reuseLayers', 0);
  const copy2 = tl.channel('reuseCopy', 0);
  const call2 = tl.channel('reuseCall', 1);
  const flash2 = tl.channel('reuseFlash', 0);
  const codeU = tl.channel('codeLines', 0);
  const codeOp = tl.channel('codeOp', 1);
  // shared check, harness, circuit card, race, payoff
  const gateU = tl.channel('gateU', 0);
  const gatePulse = tl.channel('gatePulse', 0);
  const gateChip = tl.channel('gateChip', 0);
  const harnessU = tl.channel('harnessU', 0);
  const warmU = tl.channel('warmUps', 0);
  const sampleU = tl.channel('samples', 0);
  const checkU = tl.channel('checksums', 0);
  const cardU = tl.channel('circuitCard', 0);
  const statU = tl.channel('statCount', 0);
  const raceU = tl.channel('raceMicros', 0);
  const stampU = tl.channel('scopeStamp', 0);
  const ratioU = tl.channel('ratioPanel', 0);

  const B: number[] = [];
  let t = 0.4;
  for (const text of CAPTIONS) {
    B.push(t);
    const dur = Math.round((text.split(/\s+/).length / WPS + 0.4) * 10) / 10;
    t = tl.caption({ at: t, dur, text });
    t = tl.hold(t, HOLD);
  }
  const END = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : t));
  const spot = (at: number, on: number[]) =>
    on.forEach((o, i) => tl.tween(laneOp[i], o, { at, dur: 0.7, ease: ease.move }));

  // — B0 · the circuit, and the question —
  let b = B[0];
  tl.tween(skyU, 1, { at: b + 0.2, dur: 2.0, ease: ease.linear });
  tl.tween(askU, 1, { at: b + 5.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.02 }, { at: b + 4.6, dur: 1.4, ease: ease.move });

  // — B1 · three runners, one circuit —
  b = B[1];
  tl.tween(askU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, HOME, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(foldU, 1, { at: b + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(towerOp, 0.45, { at: b + 1.6, dur: 0.8, ease: ease.move });
  tl.tween(feedU, 1, { at: b + 1.8, dur: 1.2, ease: ease.draw });
  [2.4, 5.6, 8.4].forEach((o, i) => tl.tween(laneIn[i], 1, { at: b + o, dur: 0.7, ease: ease.enter }));

  // — B2 · reference: one fresh array per call, one operation at a time —
  b = B[2];
  tl.tween(cam, CAM_LANE(0), { at: b, dur: 1.3, ease: ease.move });
  spot(b, [1, 0.12, 0.12]);
  tl.tween(alloc0, 1, { at: b + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(countU[0], 1, { at: b + 1.6, dur: 0.5, ease: ease.pop });
  tl.tween(fill0, 1, { at: b + 4.0, dur: 4.6, ease: ease.linear });
  tl.tween(drop0, 1, { at: END[2] - 1.0, dur: 0.6, ease: ease.move });

  // — B3 · full array: fresh workspace, layers, then a full array scattered into —
  b = B[3];
  tl.tween(cam, CAM_LANE(1), { at: b, dur: 1.2, ease: ease.move });
  spot(b, [0.12, 1, 0.12]);
  tl.tween(alloc1, 1, { at: b + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(countU[1], 1, { at: b + 1.6, dur: 0.5, ease: ease.pop });
  tl.tween(fill1, 1, { at: b + 2.6, dur: 3.0, ease: ease.linear });
  tl.tween(alloc1b, 1, { at: b + 5.9, dur: 0.7, ease: ease.enter });
  tl.tween(scatter1, 1, { at: b + 6.6, dur: 2.2, ease: ease.linear });
  tl.tween(drop1, 1, { at: END[3] - 0.9, dur: 0.6, ease: ease.move });

  // — B4 · reusable: workspace and outputs built once; each call copies out the roots —
  b = B[4];
  tl.tween(cam, CAM_LANE(2), { at: b, dur: 1.2, ease: ease.move });
  spot(b, [0.12, 0.12, 1]);
  tl.tween(alloc2, 1, { at: b + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(alloc2b, 1, { at: b + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(fill2, 1, { at: b + 4.2, dur: 2.6, ease: ease.linear });
  tl.tween(copy2, 1, { at: b + 6.9, dur: 1.4, ease: ease.linear });
  tl.tween(countU[2], 1, { at: b + 8.0, dur: 0.5, ease: ease.pop });

  // — B5 · the next call overwrites the outputs: copy to keep a frame —
  b = B[5];
  tl.tween(codeU, 2, { at: b + 0.2, dur: 0.9, ease: ease.enter });
  tl.set(fill2, 0, b + 1.4);
  tl.set(copy2, 0, b + 1.4);
  tl.set(call2, 2, b + 1.4);
  tl.tween(fill2, 1, { at: b + 1.5, dur: 1.3, ease: ease.linear });
  tl.tween(copy2, 1, { at: b + 2.8, dur: 0.8, ease: ease.linear });
  tl.tween(flash2, 1, { at: b + 3.0, dur: 0.4, ease: ease.enter });
  tl.tween(codeU, 3, { at: b + 3.0, dur: 0.6, ease: ease.enter });
  tl.tween(flash2, 0, { at: b + 4.4, dur: 0.6, ease: ease.move });
  tl.tween(codeU, 4, { at: b + 5.0, dur: 0.6, ease: ease.enter });

  // — B6 · validateSourceRanges, in every lane, on every call —
  b = B[6];
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(codeOp, 0, { at: b, dur: 0.6, ease: ease.move });
  spot(b, [1, 1, 1]);
  tl.tween(gateU, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(gateChip, 1, { at: b + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(gatePulse, 3, { at: b + 1.6, dur: 3.6, ease: ease.linear });

  // — B7 · the harness —
  b = B[7];
  tl.tween(cam, CAM_HARNESS, { at: b, dur: 1.3, ease: ease.move });
  spot(b, [0.12, 0.12, 0.12]);
  tl.tween(gateChip, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(harnessU, 1, { at: b + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(warmU, 200, { at: b + 1.6, dur: 1.4, ease: ease.linear });
  tl.tween(sampleU, 7, { at: b + 3.6, dur: 4.4, ease: ease.linear });
  tl.tween(checkU, 1, { at: b + 8.8, dur: 0.8, ease: ease.enter });

  // — B8 · the test circuit —
  b = B[8];
  tl.tween(cam, CAM_TOWER, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(harnessU, 0.12, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(towerOp, 1, { at: b + 0.4, dur: 0.7, ease: ease.move });
  tl.tween(cardU, 1, { at: b + 1.2, dur: 0.7, ease: ease.enter });
  tl.tween(statU, 1, { at: b + 1.8, dur: 3.6, ease: ease.linear });

  // — B9 · the race, on the same lanes —
  b = B[9];
  tl.tween(cam, HOME, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(harnessU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cardU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(towerOp, 0.45, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(memOp, 0.12, { at: b, dur: 0.8, ease: ease.move });
  spot(b + 0.3, [1, 1, 1]);
  tl.tween(stampU, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(raceU, 150, { at: b + 1.8, dur: 6.0, ease: ease.linear });

  // — B10 · the ratios, scoped —
  b = B[10];
  tl.tween(chromeOp, 0.15, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(towerOp, 0.12, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(stampU, 0.15, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(ratioU, 1, { at: b + 0.4, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl, cam, skyU, foldU, towerOp, askU, feedU, laneIn, laneOp, chromeOp, memOp, countU,
    alloc0, fill0, drop0, alloc1, fill1, alloc1b, scatter1, drop1,
    alloc2, alloc2b, fill2, copy2, call2, flash2, codeU, codeOp,
    gateU, gatePulse, gateChip, harnessU, warmU, sampleU, checkU, cardU, statU, raceU, stampU, ratioU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** packedValues written after `u` of the layer sweep: sources first, then each layer's outputs, one chunk per layer. */
const packedAt = (u: number): { n: number; layer: number; from: number } => {
  if (u <= 0) return { n: 0, layer: -1, from: 0 };
  const f = clamp01(u) * LAYERS;
  const L = Math.min(LAYERS - 1, Math.floor(f));
  const part = u >= 1 ? 1 : clamp01((f - L) * 3);
  return { n: SOURCES + CUM[L] + LAYER_W[L] * part, layer: L, from: SOURCES + CUM[L] };
};

/** A typed array drawn to scale: outline, then whatever has been written. */
function Slab({ x, y, n, grow, opacity, dashed = false, stroke = colors.GRID }: {
  x: number; y: number; n: number; grow: number; opacity: number; dashed?: boolean; stroke?: string;
}) {
  if (opacity <= 0.005 || grow <= 0.005) return null;
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(1.5, n * PX * grow)}
      height={SLAB_H}
      rx={3}
      fill={colors.PANEL}
      stroke={stroke}
      strokeWidth={1.5}
      strokeDasharray={dashed ? '5 4' : undefined}
      opacity={opacity}
    />
  );
}

function Label({ x, y, text, opacity, color = colors.MUTED, anchor = 'start', size = 12, mono = true, weight }: {
  x: number; y: number; text: string; opacity: number; color?: string; anchor?: 'start' | 'middle' | 'end'; size?: number; mono?: boolean; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fontFamily={mono ? MONO : undefined} fontWeight={weight} fill={color} textAnchor={anchor} opacity={opacity}>
      {text}
    </text>
  );
}

function Stopwatch({ cx, cy, frac, color, opacity }: { cx: number; cy: number; frac: number; color: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  const a = -Math.PI / 2 + frac * 2 * Math.PI;
  return (
    <g opacity={opacity}>
      <rect x={cx - 3} y={cy - 25} width={6} height={5} rx={1} fill={colors.MUTED} />
      <circle cx={cx} cy={cy} r={18} fill={colors.BG} stroke={colors.MUTED} strokeWidth={2} />
      <path d={`M ${cx} ${cy} L ${cx} ${cy - 18} A 18 18 0 ${frac > 0.5 ? 1 : 0} 1 ${cx + 18 * Math.cos(a)} ${cy + 18 * Math.sin(a)} Z`} fill={color} opacity={frac > 0.001 ? 0.35 : 0} />
      <line x1={cx} y1={cy} x2={cx + 15 * Math.cos(a)} y2={cy + 15 * Math.sin(a)} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const skyU = v(scene.skyU);
  const fold = v(scene.foldU);
  const towerOp = v(scene.towerOp);
  const askU = v(scene.askU);
  const memOp = v(scene.memOp);
  const chrome = v(scene.chromeOp);
  const race = v(scene.raceU);
  const gateU = v(scene.gateU);
  const gp = v(scene.gatePulse);
  const gateGlow = gp > 0 && gp < 3 ? Math.sin(Math.PI * gp) ** 2 : 0;
  const harness = v(scene.harnessU);
  const card = v(scene.cardU);
  const ratio = v(scene.ratioU);

  // lane 0
  const fill0 = v(scene.fill0);
  const n0 = fill0 > 0 ? SOURCES + fill0 * OPERATIONS : 0;
  const drop0 = v(scene.drop0);
  // lane 1
  const p1 = packedAt(v(scene.fill1));
  const drop1 = v(scene.drop1);
  // lane 2
  const p2 = packedAt(v(scene.fill2));
  const copy2 = v(scene.copy2);
  const call2 = v(scene.call2);
  const flash2 = v(scene.flash2);
  const codeU = v(scene.codeU);

  const laneBody = (i: number) => {
    const LTi = LT[i];
    const yA = LTi + ROW_A;
    const L = LANES[i];
    const count = v(scene.countU[i]);
    const raceOn = race > 0;
    const t = Math.min(race, US[i]);
    return (
      <>
        {/* chrome: panel, names, the gate */}
        <rect x={LANE_X} y={LTi} width={LANE_W} height={LANE_H} rx={10} fill={colors.PANEL} fillOpacity={0.55} stroke={colors.GRID} opacity={chrome} />
        <rect x={LANE_X} y={LTi + 12} width={4} height={LANE_H - 24} rx={2} fill={L.color} />
        <Label x={290} y={LTi + 32} text={L.name} opacity={1} color={colors.TEXT} size={18} mono={false} weight={700} />
        <Label x={290} y={LTi + 54} text={L.fn} opacity={chrome} color={L.color} size={13} />
        <Label x={290} y={LTi + 76} text={L.info} opacity={chrome} size={12} />
        {gateU > 0.005 && (
          <g opacity={gateU * chrome}>
            <rect x={512} y={yA - 4} width={8} height={SLAB_H + 8} rx={3} fill={colors.TEAL} opacity={0.55 + 0.45 * gateGlow} />
            <rect x={507} y={yA - 9} width={18} height={SLAB_H + 18} rx={6} fill="none" stroke={colors.TEAL} strokeWidth={2} opacity={gateGlow} />
          </g>
        )}
        {/* counter column: what this lane allocates per call, later its stopwatch */}
        <g opacity={chrome * (1 - clamp01(race / 6))}>
          <Label x={CX} y={LTi + 30} text="new per call" opacity={count} mono={false} />
          <Label x={CX} y={LTi + 68} text={`${NEW_PER_CALL[i].arrays}`} opacity={count} color={i === 2 ? colors.POSITIVE : colors.WARM} size={30} weight={700} />
          <Label
            x={CX + 26}
            y={LTi + 68}
            text={NEW_PER_CALL[i].arrays === 1 ? 'array' : 'arrays'}
            opacity={count}
            color={colors.MUTED}
            size={13}
            mono={false}
          />
          <Label
            x={CX}
            y={LTi + 92}
            text={i === 2 ? 'after the first' : `${commas(NEW_PER_CALL[i].n)} elements`}
            opacity={count}
            mono={false}
          />
        </g>
        <Stopwatch cx={1192} cy={LTi + 64} frac={t / 150} color={L.color} opacity={clamp01(race / 6) * chrome} />
        {/* the race bar */}
        {raceOn && (
          <g>
            <rect x={MX} y={LTi + 46} width={t * US_PX} height={32} rx={4} fill={L.color} opacity={0.9} />
            <Label x={MX + t * US_PX + 10} y={LTi + 68} text={`${t.toFixed(2)} µs`} opacity={1} color={colors.TEXT} size={16} weight={600} />
          </g>
        )}
      </>
    );
  };

  // ---- lane memory (to scale), drawn under memOp
  const mem0 = () => {
    const yA = LT[0] + ROW_A;
    const a = v(scene.alloc0);
    const op = memOp * lerp(1, 0.22, drop0);
    const frontX = MX + n0 * PX;
    return (
      <g opacity={op}>
        <Slab x={MX} y={yA} n={WIDTH} grow={a} opacity={1} dashed={drop0 > 0.5} />
        {n0 > 0 && <rect x={MX} y={yA + 2} width={SOURCES * PX} height={SLAB_H - 4} fill={colors.MUTED} opacity={0.6} />}
        {n0 > SOURCES && <rect x={MX + SOURCES * PX} y={yA + 2} width={(n0 - SOURCES) * PX} height={SLAB_H - 4} fill={colors.ACCENT} opacity={0.75} />}
        {fill0 > 0 && fill0 < 1 && <circle cx={frontX} cy={yA + SLAB_H / 2} r={5} fill={colors.WARM} />}
        <Label x={MX} y={yA + SLAB_H + 16} text={`new Float32Array(sourceSize + operations.length) = 234 + 5,028 = ${commas(WIDTH)}`} opacity={a} />
        <Label
          x={MX}
          y={LT[0] + 98}
          text={`scalar step: operation ${commas(Math.max(1, Math.round(fill0 * OPERATIONS)))} of ${commas(OPERATIONS)}`}
          opacity={bump(fill0, 0.001, 0.999, 0.02) * (1 - drop0)}
          color={colors.WARM}
        />
        <Label x={MX} y={LT[0] + 98} text="dropped when the call returns; the next call allocates again" opacity={drop0} color={colors.TEXT} />
      </g>
    );
  };

  const workspaceRow = (y: number, grow: number, p: { n: number; layer: number; from: number }, label: string, solid: boolean, labelOp = 1) => {
    let x = MX;
    return (
      <>
        {WORKSPACE.map((a, k) => {
          const x0 = x;
          x += a.n * PX;
          return <Slab key={k} x={x0} y={y} n={a.n} grow={grow} opacity={1} stroke={solid ? colors.POSITIVE : colors.GRID} />;
        })}
        {p.n > 0 && <rect x={MX} y={y + 2} width={SOURCES * PX} height={SLAB_H - 4} fill={colors.MUTED} opacity={0.6} />}
        {p.n > SOURCES && <rect x={MX + SOURCES * PX} y={y + 2} width={(p.n - SOURCES) * PX} height={SLAB_H - 4} fill={colors.ACCENT} opacity={0.75} />}
        {p.layer >= 0 && p.n < VALUE_COUNT && (
          <rect x={MX + p.from * PX} y={y - 2} width={Math.max(2, (p.n - p.from) * PX)} height={SLAB_H + 4} rx={2} fill={colors.WARM} />
        )}
        <Label x={MX} y={y + SLAB_H + 16} text={label} opacity={grow * labelOp} />
      </>
    );
  };

  const mem1 = () => {
    const LT1 = LT[1];
    const yB = LT1 + ROW_B;
    const a = v(scene.alloc1);
    const ab = v(scene.alloc1b);
    const sc = v(scene.scatter1);
    const fillU = v(scene.fill1);
    return (
      <g opacity={memOp * lerp(1, 0.22, drop1)}>
        {workspaceRow(LT1 + ROW_A, a, p1, 'createTensorWorkspace → packedValues 4,880 · input 383 · projection 736 · gather 0, 0', false)}
        <Slab x={MX} y={yB} n={WIDTH} grow={ab} opacity={1} dashed={drop1 > 0.5} />
        {sc > 0 &&
          SCATTER.map((_, bin) => {
            const cap = Math.min(SCATTER_BIN, WIDTH - bin * SCATTER_BIN);
            const f = scatterFill(bin, sc);
            if (f <= 0) return null;
            const h = (SLAB_H - 4) * f;
            return <rect key={bin} x={MX + bin * SCATTER_BIN * PX + 0.4} y={yB + SLAB_H - 2 - h} width={cap * PX - 0.8} height={h} fill={colors.SECONDARY} opacity={0.85} />;
          })}
        <Label x={MX} y={yB + SLAB_H + 14} text={`new Float32Array(program.width) = ${commas(WIDTH)} · every wire, scattered in`} opacity={ab} />
        <Label
          x={MX}
          y={yB + 16}
          text={`layer ${Math.min(LAYERS, p1.layer + 1)} of ${LAYERS}`}
          opacity={bump(fillU, 0.001, 0.999, 0.02) * (1 - ab)}
          color={colors.WARM}
        />
      </g>
    );
  };

  const mem2 = () => {
    const LT2 = LT[2];
    const yA = LT2 + ROW_A;
    const yB = LT2 + ROW_B;
    const a = v(scene.alloc2);
    const ab = v(scene.alloc2b);
    const fillU = v(scene.fill2);
    const copied = copy2 * ROOTS;
    return (
      <g opacity={memOp}>
        {workspaceRow(yA, a, p2, 'createTensorWorkspace → the same five arrays, built once and kept', true, 1 - 0.85 * bump(copy2, 0.001, 0.999, 0.05))}
        <Slab x={MX} y={yB} n={ROOTS} grow={ab} opacity={1} stroke={flash2 > 0.01 ? colors.WARM : colors.POSITIVE} />
        {flash2 > 0.01 && <rect x={MX - 4} y={yB - 4} width={ROOTS * PX + 8} height={SLAB_H + 8} rx={5} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={flash2} />}
        {copied > 0 && <rect x={MX} y={yB + 2} width={copied * PX} height={SLAB_H - 4} fill={call2 > 1.5 ? colors.WARM : colors.POSITIVE} opacity={0.8} />}
        {copy2 > 0 &&
          copy2 < 1 &&
          ROOT_SAMPLE.map((pos, k) => {
            const slot = k * 61 + 30;
            const o = clamp01((copied - slot) / 40) * clamp01((slot + 160 - copied) / 40);
            if (o <= 0) return null;
            return (
              <line key={k} x1={MX + pos * PX} y1={yA + SLAB_H} x2={MX + slot * PX} y2={yB} stroke={colors.POSITIVE} strokeWidth={1.2} opacity={0.8 * o} />
            );
          })}
        <Label x={MX} y={yB + SLAB_H + 14} text={`outputs = new Float32Array(roots.length) = ${ROOTS}`} opacity={ab} />
        <Label
          x={MX + ROOTS * PX + 14}
          y={yB + 17}
          text={`layer ${Math.min(LAYERS, p2.layer + 1)} of ${LAYERS}`}
          opacity={bump(fillU, 0.001, 0.999, 0.02)}
          color={colors.WARM}
        />
        <Label
          x={MX + ROOTS * PX + 14}
          y={yB + 17}
          text={call2 > 1.5 ? 'call 2 wrote over the same 727 slots' : 'copy out only the 727 roots'}
          opacity={fillU >= 1 ? clamp01(copy2 * 4) : 0}
          color={call2 > 1.5 ? colors.WARM : colors.POSITIVE}
        />
      </g>
    );
  };

  const codeLines = Math.floor(codeU);
  const codeOp = v(scene.codeOp) * clamp01(codeU);

  // harness strip
  const sU = v(scene.sampleU);
  const sampleIdx = Math.min(6, Math.floor(sU));
  const firstIdx = sampleIdx % 3;
  const checkU = v(scene.checkU);

  const stat = v(scene.statU);
  const STATS = [
    { n: SOURCES, label: 'source cells', at: 0 },
    { n: LIVE, label: 'live operations', at: 0.25 },
    { n: LAYERS, label: 'layers (one row each)', at: 0.5 },
    { n: STORED_WEIGHTS, label: 'stored weights', at: 0.75 },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the circuit: skyline → tower ================= */}
        <g opacity={towerOp}>
          {SKY.map((r, j) => {
            const appear = clamp01(skyU * 1.25 * LAYERS - j);
            if (appear <= 0) return null;
            const T = TOWER[j];
            const h = lerp(r.h * appear, T.h, fold);
            return (
              <rect
                key={j}
                x={lerp(r.x, T.x, fold)}
                y={lerp(r.y + r.h * (1 - appear), T.y, fold)}
                width={lerp(r.w, T.w, fold)}
                height={h}
                fill={colors.ACCENT}
                opacity={0.85}
              />
            );
          })}
          <Label x={640} y={462} text="the window manager's compiled program · one column per layer, height = operations in it" opacity={skyU * (1 - fold) * (1 - askU)} anchor="middle" size={13} />
          <Label x={40} y={90} text="window manager" opacity={fold * clamp01((1.08 - cam.k) / 0.06)} color={colors.TEXT} size={13} mono={false} weight={600} />
        </g>
        {v(scene.feedU) > 0.005 && (
          <g opacity={0.5 * towerOp * chrome}>
            {LT.map((y, i) => {
              const ty = y + 62;
              const d = `M ${TOWER_OUT.x} ${TOWER_OUT.y} C ${TOWER_OUT.x + 25} ${TOWER_OUT.y}, ${LANE_X - 25} ${ty}, ${LANE_X} ${ty}`;
              return <path key={i} d={d} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - v(scene.feedU)} />;
            })}
          </g>
        )}

        {/* ================= the question: one call on the CPU ================= */}
        {askU > 0.005 && (
          <g opacity={askU}>
            <g transform="translate(300, 496)">
              <rect x={-20} y={-20} width={40} height={40} rx={6} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={2} />
              {[-12, -4, 4, 12].map((d) => (
                <g key={d} stroke={colors.MUTED} strokeWidth={2}>
                  <line x1={d} y1={-26} x2={d} y2={-20} />
                  <line x1={d} y1={20} x2={d} y2={26} />
                  <line x1={-26} y1={d} x2={-20} y2={d} />
                  <line x1={20} y1={d} x2={26} y2={d} />
                </g>
              ))}
              <text x={0} y={5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                CPU
              </text>
            </g>
            <Label x={350} y={474} text="one call" opacity={1} color={colors.TEXT} size={14} mono={false} weight={600} />
            <rect x={350} y={484} width={590} height={26} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={352} y={486} width={330} height={22} rx={4} fill={colors.ACCENT} opacity={0.55} />
            <rect x={682} y={486} width={256} height={22} rx={4} fill={colors.WARM} opacity={0.25} />
            <line x1={682} y1={478} x2={682} y2={516} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={682} y={540} textAnchor="middle" fontSize={20} fontWeight={700} fill={colors.WARM}>
              ?
            </text>
            <Label x={352} y={532} text="the layers' arithmetic" opacity={1} size={13} mono={false} />
            <Label x={938} y={532} text="allocating + copying memory" opacity={1} color={colors.WARM} size={13} anchor="end" mono={false} />
            <Label x={940} y={474} text="split unknown: that is the question" opacity={1} size={12} anchor="end" mono={false} />
          </g>
        )}

        {/* ================= the three lanes ================= */}
        {LANES.map((_, i) => {
          const inU = v(scene.laneIn[i]);
          if (inU <= 0.005) return null;
          return (
            <g key={i} opacity={inU * v(scene.laneOp[i])} transform={`translate(${lerp(60, 0, inU)}, 0)`}>
              {laneBody(i)}
              {i === 0 && mem0()}
              {i === 1 && mem1()}
              {i === 2 && mem2()}
            </g>
          );
        })}

        {/* ================= the overwrite, in code ================= */}
        {codeOp > 0.005 && (
          <g opacity={codeOp}>
            <rect x={CODE_BOX.x} y={CODE_BOX.y} width={CODE_BOX.w} height={CODE_BOX.h} rx={6} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
            <rect x={CODE_BOX.x} y={CODE_BOX.y} width={4} height={CODE_BOX.h} rx={2} fill={colors.POSITIVE} />
            {CODE.map((l, k) => {
              const o = clamp01(codeU - k);
              if (o <= 0) return null;
              const [code, comment] = l.split('//');
              return (
                <text key={k} x={CODE_BOX.x + 16} y={CODE_BOX.y + 22 + k * 20} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={o} xmlSpace="preserve">
                  {code}
                  {comment !== undefined && <tspan fill={k === 3 ? colors.POSITIVE : colors.WARM}>{`//${comment}`}</tspan>}
                </text>
              );
            })}
          </g>
        )}

        {/* ================= the shared check ================= */}
        {v(scene.gateChip) > 0.005 && (
          <g opacity={v(scene.gateChip)}>
            <rect x={500} y={58} width={690} height={26} rx={6} fill={colors.PANEL} stroke={colors.TEAL} strokeOpacity={0.7} />
            <text x={514} y={76} fontSize={13} fontFamily={MONO} fill={colors.TEAL}>
              validateSourceRanges(source)
            </text>
            <text x={744} y={76} fontSize={13} fill={colors.TEXT}>
              234 range checks · every call, all three · inside every timing
            </text>
          </g>
        )}

        {/* ================= the harness ================= */}
        {harness > 0.005 && (
          <g opacity={harness}>
            <rect x={LANE_X} y={516} width={LANE_W} height={100} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <Label x={290} y={540} text="report.ts, for each method" opacity={1} mono={false} size={12} />
            {/* warm-ups */}
            <Label x={290} y={584} text={`${Math.round(v(scene.warmU))}`} opacity={1} color={colors.TEXT} size={30} weight={700} />
            <Label x={290} y={606} text="warm-up runs" opacity={1} mono={false} size={13} />
            {/* rotating order */}
            <g transform="translate(476, 576)">
              <circle r={24} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
              {LANES.map((L, k) => {
                const ang = ((-90 + (k - sU) * 120) * Math.PI) / 180;
                return <circle key={k} cx={24 * Math.cos(ang)} cy={24 * Math.sin(ang)} r={7} fill={L.color} />;
              })}
              <path d="M -6 -36 L 6 -30 L -6 -24" fill="none" stroke={colors.TEXT} strokeWidth={1.5} />
            </g>
            <Label x={510} y={566} text="order rotates; runs first:" opacity={1} mono={false} size={13} />
            <Label x={510} y={588} text={LANES[firstIdx].name} opacity={1} color={LANES[firstIdx].color} size={13} />
            {/* samples */}
            <g transform="translate(770, 566)">
              {Array.from({ length: 7 }, (_, k) => {
                const f = clamp01(sU - k);
                return (
                  <g key={k}>
                    <circle cx={k * 24} cy={0} r={8} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
                    <circle cx={k * 24} cy={0} r={8 * f} fill={colors.ACCENT} />
                  </g>
                );
              })}
            </g>
            <Label x={762} y={600} text={`sample ${Math.min(7, Math.floor(sU) + (sU >= 7 ? 0 : 1))} of 7 · report the median`} opacity={1} mono={false} size={13} />
            {/* checksums */}
            <Label x={1000} y={540} text="checksums must agree" opacity={1} mono={false} size={12} />
            {LANES.map((L, k) => (
              <g key={k} opacity={checkU}>
                <circle cx={1006} cy={556 + k * 19} r={5} fill={L.color} />
                <Label x={1018} y={561 + k * 19} text={commas(CHECKSUM)} opacity={1} color={colors.TEXT} size={13} />
              </g>
            ))}
            <g opacity={checkU}>
              <text x={1118} y={584} fontSize={28} fontWeight={700} fill={colors.POSITIVE}>
                =
              </text>
              <Label x={1146} y={572} text="else" opacity={1} mono={false} size={13} />
              <Label x={1146} y={590} text="throw" opacity={1} color={colors.NEGATIVE} size={13} />
            </g>
          </g>
        )}

        {/* ================= the circuit card ================= */}
        {card > 0.005 && (
          <g opacity={card}>
            <rect x={244} y={130} width={290} height={248} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <Label x={262} y={156} text="test circuit" opacity={1} mono={false} size={12} />
            <Label x={262} y={180} text="Handwired OS window manager" opacity={1} color={colors.TEXT} size={17} mono={false} weight={700} />
            {STATS.map((st, k) => {
              const u = clamp01((stat - st.at) / 0.22);
              return (
                <g key={k} opacity={clamp01(u * 4)}>
                  <Label x={352} y={226 + k * 42} text={commas(st.n * u)} opacity={1} color={k === 3 ? colors.MUTED : colors.TEXT} size={26} anchor="end" weight={700} />
                  <Label x={364} y={224 + k * 42} text={st.label} opacity={1} mono={false} size={14} color={k === 3 ? colors.MUTED : colors.TEXT} />
                </g>
              );
            })}
            <path d={`M 232 104 L 236 104 L 236 494 L 232 494`} fill="none" stroke={colors.TEXT} strokeWidth={1.5} opacity={clamp01((stat - 0.5) / 0.1)} />
          </g>
        )}

        {/* ================= the scope stamp and the payoff ================= */}
        {v(scene.stampU) > 0.005 && (
          <g opacity={v(scene.stampU)}>
            <rect x={LANE_X} y={520} width={LANE_W} height={30} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={LANE_X + 16} y={540} fontSize={13} fontFamily={MONO} fill={colors.WARM}>
              one run · median of 7 samples × 500 evaluations · Bun 1.4.3 · Apple M4 Max · load ≈ 9
            </text>
          </g>
        )}
        {ratio > 0.005 && (
          <g opacity={ratio} transform={`translate(${lerp(30, 0, ratio)}, 0)`}>
            <rect x={830} y={236} width={406} height={264} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <rect x={830} y={248} width={4} height={240} rx={2} fill={colors.POSITIVE} />
            <Label x={852} y={272} text="tensor reusable roots, per evaluation" opacity={1} mono={false} size={14} />
            <Label x={852} y={334} text={`${RATIO_FULL.toFixed(2)}×`} opacity={1} color={colors.POSITIVE} size={44} weight={700} />
            <Label x={990} y={318} text="faster than" opacity={1} mono={false} size={14} />
            <Label x={990} y={338} text="tensor full array" opacity={1} color={colors.SECONDARY} size={14} />
            <Label x={852} y={406} text={`${RATIO_REF.toFixed(1)}×`} opacity={1} color={colors.POSITIVE} size={44} weight={700} />
            <Label x={990} y={390} text="faster than" opacity={1} mono={false} size={14} />
            <Label x={990} y={410} text="reference" opacity={1} color={colors.MUTED} size={14} />
            <Label x={852} y={446} text={`${US[1].toFixed(2)} ÷ ${US[2].toFixed(2)} · ${US[0].toFixed(2)} ÷ ${US[2].toFixed(2)}`} opacity={1} size={12} />
            <Label x={852} y={478} text="one run · one machine · one process" opacity={1} color={colors.WARM} size={14} mono={false} weight={600} />
          </g>
        )}
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={262} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Three ways to run one circuit
      </text>
    </>
  );
}

export const vizScene = () => scene;
