// One Program, Many Photos
//
// UI Exploration — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
// Paths are relative to lab/ui-exploration/ unless they start with src/.
//   instanced-items/README.md:100-110 (per-photo map stages 10 · 25 · 19 · 20 · 5 · 154 = 233; shared 401, of
//     which the clock and spring matrix are 248), :116-120 (circuit sizes; duplicated Brent-Kung 57,135 / 67),
//     :172-185 (scaling table: 221 · 1,000 · 10,000 photos; staged 65 · 310 · 4,106 µs; duplicated 546 · 2,569 ·
//     43,027 µs; duplicated 57,135 / 67 · 257,433 / 71 · 2,571,887 / 80), :5 and :261 (one program per item with
//     reductions across items between stages)
//   event-time/spring-math.ts:4-8, :33-55 (the lane is (displacement from destination, velocity); the Euler step
//     matrix; matrixPower by squaring), :70-76 (4 ms step, 16 fine steps); event-time/photo-gallery.ts:680
//     (stiffness 650, damping 45)
//   README.md:53 (spring-bank's HandwiredOS copy: 5,253 ops / 192 layers → 3,580 / 137)
//   src/runtime/numeric-ui-core.ts:455-470 (indexRead); README.md:27-29 (one-hots are 2 to 3 atoms per position;
//     values[index] becomes 1 operation); README.md:134 (Landed; "changes the cost of lists, text, and slot
//     routing more than anything else measured")
//   README.md:94 (pointer jumping, 1,023 segments, 66 layers); text-walker/README.md:217, :68 via review.md
//     (the 66 layers measure lineCount and maxLineWidth only — no line starts are drawn)
//   README.md:23 (far down the gallery, a 0.18 px band between index.ts's box edges and the circuit's)
//   README.md:40-41 (six of seven UIs: strict order mattered only at rounding points; the gallery was the exception)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan, with the Haiku 5.5 fact-check.
//
// Changes from the plan, per review.md: the copied stack reads 57,135 ops / 67 layers (the duplicated circuit at
// 221 photos, Brent-Kung), not 48,411 / 61 (gallery-circuit.ts, one circuit). The pointer-jumping chain shows only
// a line count and a widest line. The 0.18 px band is labelled "far down the gallery". The spring phase plot's
// starting displacement (120 px, at rest) is illustrative; the matrix entries and every dot are computed below with
// the repo's own eulerStepMatrix / matrixPower at stiffness 650, damping 45, 4 ms. The pointer-jumping chain and the
// 0.18 px magnifier are schematic and say so on screen.
import { CAMERA_HOME, Camera, MathLabel, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const nf = (v: number): string => Math.round(v).toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The gallery's measured numbers (instanced-items/README.md)
// ---------------------------------------------------------------------------

const PHOTOS = 221;
const COLS = 17;
const ROWS = 13; // 17 × 13 = 221
const COUNTS = [221, 1000, 10000];
const STAGED_US = [65, 310, 4106];
const DUP_US = [546, 2569, 43027];
const DUP_OPS = [57135, 257433, 2571887];
const DUP_LAYERS = [67, 71, 80];
const PER_PHOTO = 233;
const SHARED = 401;
const SHARED_SPRING = 248;
const STAGES: { name: string; ops: number }[] = [
  { name: 'click hit test', ops: 10 },
  { name: 'sizes and focus relation', ops: 25 },
  { name: 'grid targets and hover', ops: 19 },
  { name: 'destinations', ops: 20 },
  { name: 'anchor predicate', ops: 5 },
  { name: 'springs and occlusion', ops: 154 },
];
if (STAGES.reduce((a, s) => a + s.ops, 0) !== PER_PHOTO) throw new Error('ui-exploration ch2: stage ops must sum to 233');
if (COLS * ROWS !== PHOTOS) throw new Error('ui-exploration ch2: grid must hold 221 photos');

// seeded photo tones (deterministic)
const TONES = (() => {
  const rand = mulberry32(221);
  return Array.from({ length: 1000 }, () => {
    const h = Math.floor(190 + rand() * 170) % 360;
    const l = 30 + Math.floor(rand() * 18);
    return `hsl(${h}, 32%, ${l}%)`;
  });
})();

// ---------------------------------------------------------------------------
// Springs as matrices — event-time/spring-math.ts, ported line for line
// ---------------------------------------------------------------------------

type Matrix2 = readonly [number, number, number, number];
const identityMatrix: Matrix2 = [1, 0, 0, 1];
function multiplyMatrix2(l: Matrix2, r: Matrix2): Matrix2 {
  return [l[0] * r[0] + l[1] * r[2], l[0] * r[1] + l[1] * r[3], l[2] * r[0] + l[3] * r[2], l[2] * r[1] + l[3] * r[3]];
}
function eulerStepMatrix(stiffness: number, damping: number, stepMs: number): Matrix2 {
  const dt = stepMs / 1000;
  const velocityKeep = 1 - damping * dt;
  return [1 - stiffness * dt * dt, dt * velocityKeep, -stiffness * dt, velocityKeep];
}
function matrixPower(step: Matrix2, count: number): Matrix2 {
  let result = identityMatrix;
  let square = step;
  let remaining = count;
  while (remaining > 0) {
    if (remaining % 2 === 1) result = multiplyMatrix2(result, square);
    remaining = Math.floor(remaining / 2);
    if (remaining > 0) square = multiplyMatrix2(square, square);
  }
  return result;
}
const apply = (m: Matrix2, p: [number, number]): [number, number] => [m[0] * p[0] + m[1] * p[1], m[2] * p[0] + m[3] * p[1]];

const STIFFNESS = 650; // event-time/photo-gallery.ts:680
const DAMPING = 45;
const STEP_MS = 4; // defaultClockConfig.stepMs
const FINE = 16; // defaultClockConfig.fineSteps
const M1 = eulerStepMatrix(STIFFNESS, DAMPING, STEP_MS);
const M16 = matrixPower(M1, FINE);
const N_STEPS = 64;
const TRAJ: [number, number][] = [[120, 0]]; // illustrative start: 120 px from the destination, at rest
for (let i = 0; i < N_STEPS; i++) {
  // the loop form (spring-math.ts:5-7) …
  const [e, v] = TRAJ[i];
  const v2 = v + (-STIFFNESS * e - DAMPING * v) * (STEP_MS / 1000);
  TRAJ.push([e + v2 * (STEP_MS / 1000), v2]);
}
// … and the same thing as a matrix power, four jumps of sixteen steps
const JUMPS: [number, number][] = [TRAJ[0]];
for (let j = 0; j < N_STEPS / FINE; j++) JUMPS.push(apply(M16, JUMPS[j]));
JUMPS.forEach((p, j) => {
  const q = TRAJ[j * FINE];
  if (Math.abs(p[0] - q[0]) > 1e-6 || Math.abs(p[1] - q[1]) > 1e-6) throw new Error('ui-exploration ch2: M^16 disagrees with 16 steps');
});
const f4 = (v: number): string => {
  const s = Math.abs(v) >= 1 ? v.toFixed(3) : Math.abs(v) >= 0.1 ? v.toFixed(4) : v.toFixed(5);
  return s.replace(/0+$/, '').replace(/\.$/, '');
};
const texMatrix = (m: Matrix2): string =>
  `\\begin{pmatrix} ${f4(m[0])} & ${f4(m[1])} \\\\ ${f4(m[2])} & ${f4(m[3])} \\end{pmatrix}`;
const TEX_STEP = `M = ${texMatrix(M1)}`;
const TEX_POW = `M^{16} = ${texMatrix(M16)}`;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 52;
// gallery grid: BIG (alone) ↔ MID (between the two panels)
const G_BIG = { x: 385, y: 190, px: 30, py: 22 };
const G_MID = { x: 470, y: 100, px: 20, py: 14 };
const TILE_FILL = 0.84;
const G_MID_W = COLS * G_MID.px;
const G_MID_H = ROWS * G_MID.py;

// left: the copied circuit
const L = { x: 40, y: 96, w: 384, h: 508 };
const STACK = { x: 104, w: 240, base: 532, pitch: 1.6 };
// right: one per-photo program
const R = { x: 858, y: 96, w: 382, h: 508 };
const CARD = { x: 878, y: 150, w: 342, h: 240 };
const ROW_Y0 = 210;
const ROW_DY = 29;
// photo-count slider and the microsecond bars (centre column)
const SLIDER = { x0: 496, x1: 784, y: 330 };
const BARS = { x0: 470, y0: 404, y1: 456, axis: 486, perDecade: 82 };
const usX = (us: number): number => BARS.x0 + (Math.log10(us) - 1) * BARS.perDecade;
// the centre panel (springs, index reads)
const P = { x: 296, y: 92, w: 688, h: 520 };
// phase plot
const PX0 = 352;
const PE = 2.4; // px per px of displacement
const PY0 = 196;
const PV = 0.28; // px per px/s of velocity
const phX = (e: number): number => PX0 + e * PE;
const phY = (v: number): number => PY0 - v * PV;
// index read
const IDX_ROW = 6;
const IDX_PICK = 9;
const CAND = { x: 334, y: 172, pitch: 36, w: 30, h: 26 };
const candX = (j: number): number => CAND.x + j * CAND.pitch;
// pointer jumping (schematic: 32 of 1,023 segments)
const CHAIN_N = 32;
const CHAIN = { x0: 340, x1: 940, y: 400 };
const chainX = (i: number): number => CHAIN.x0 + ((CHAIN.x1 - CHAIN.x0) * i) / (CHAIN_N - 1);
// the far-down tile for the 0.18 px band
const EDGE_COL = 8;
const EDGE_ROW = 12;
const EDGE_TILE = { x: G_BIG.x + EDGE_COL * G_BIG.px, y: G_BIG.y + EDGE_ROW * G_BIG.py };
const LENS = { x: 720, y: 150, w: 500, h: 290 };

const CAM_OPEN: CameraState = { x: 640, y: 340, k: 1.22 };
const CAM_RIGHT: CameraState = { x: 880, y: 320, k: 1.12 };
const CAM_BARS: CameraState = { x: 640, y: 420, k: 1.3 };
const CAM_SPRINGROW: CameraState = { x: 1040, y: 330, k: 1.45 };
const CAM_PHASE: CameraState = { x: 610, y: 350, k: 1.06 };
const CAM_CHAIN: CameraState = { x: 640, y: 370, k: 1.12 };
const CAM_EDGE: CameraState = { x: EDGE_TILE.x + 26, y: EDGE_TILE.y + 4, k: 2.3 };

// ---------------------------------------------------------------------------
// Narration (book.json chapters[1].captions, verbatim)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  "The lab ports the 221-photo gallery from Cheng's website. Copying the whole circuit once per photo costs fifty-seven thousand one hundred thirty-five operations in sixty-seven layers, and it grows with every photo.",
  'Write the per-photo program once instead, and run it as instances. An instance axis repeats it for every photo, with reductions between stages for what photos share.',
  'Four hundred one operations are shared. Each photo then costs two hundred thirty-three operations, at two hundred twenty-one photos, at one thousand, and at ten thousand.',
  'On the processor, that is sixty-five microseconds against five hundred forty-six for the duplicated circuit at two hundred twenty-one photos. Timings are rough.',
  'At ten thousand photos it is four thousand one hundred six microseconds against forty-three thousand twenty-seven. The staged program scales; the copied one drowns.',
  "Springs are the next loop. One semi-implicit Euler step updates a spring's velocity from stiffness and damping, which is a two-by-two matrix acting on its distance from the destination and its velocity.",
  'So catching up many fixed steps is that matrix raised to a power. In the spring bank that cut the circuit from five thousand two hundred fifty-three operations to three thousand five hundred eighty.',
  'Arrays are the next. Reading values at an index used to take a one-hot and a sum. The runtime now has an index read instruction, and reading one element is a single operation.',
  "The README says it changes the cost of lists, text and slot routing more than anything else measured. That's its comparison, not a ranking. It's landed in the runtime.",
  "It doesn't remove every scan. With index reads, pointer jumping gets the line count and widest line of a paragraph with one thousand twenty-three segments in sixty-six layers.",
  "The gallery also has a catch. Far down it, pointers inside a band of about a fifth of a pixel between native box edges and the circuit's got a different hover and click.",
  'So the instance axis, matrix powers and index reads each trade a loop for arithmetic. Each has a scope, and the gallery is the one UI where exact order of operations mattered beyond rounding points.',
];
// ~150 words per minute, plus a breath
const HOLD = 0.7;
const SLOTS = (() => {
  let t = 0.4;
  return CAPTIONS.map((text) => {
    const dur = +(text.split(/\s+/).length / 2.5 + 0.5).toFixed(1);
    const slot = { at: +t.toFixed(2), dur };
    t += dur + HOLD;
    return slot;
  });
})();

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);

  // the gallery (persistent)
  const galU = tl.channel('galU', 0);
  const gPos = tl.channel('gPos', 0); // 0 BIG → 1 MID
  const galOp = tl.channel('galOp', 1);
  const copyN = tl.channel('copyN', 0); // copies streamed into the stack, 0..221
  const stampU = tl.channel('stampU', 0); // instance axis sweep, 0..221
  const nIdx = tl.channel('nIdx', 0); // 0 = 221 · 1 = 1,000 · 2 = 10,000
  // panels
  const leftU = tl.channel('leftU', 0);
  const leftOp = tl.channel('leftOp', 1);
  const dupChipU = tl.channel('dupChipU', 0);
  const rightU = tl.channel('rightU', 0);
  const rightOp = tl.channel('rightOp', 1);
  const ghostU = tl.channel('ghostU', 0);
  const reduceU = tl.channel('reduceU', 0);
  const sharedU = tl.channel('sharedU', 0);
  const sliderU = tl.channel('sliderU', 0);
  const barsU = tl.channel('barsU', 0);
  const barsOp = tl.channel('barsOp', 1);
  const springRowU = tl.channel('springRowU', 0);
  // centre panel
  const panelU = tl.channel('panelU', 0);
  const phaseU = tl.channel('phaseU', 0);
  const stepsU = tl.channel('stepsU', 0); // Euler dots drawn, 0..64
  const matU = tl.channel('matU', 0);
  const powU = tl.channel('powU', 0); // M^16 jumps drawn, 0..4
  const powTexU = tl.channel('powTexU', 0);
  const bankU = tl.channel('bankU', 0);
  const idxU = tl.channel('idxU', 0);
  const oneHotU = tl.channel('oneHotU', 0);
  const readU = tl.channel('readU', 0);
  const landedU = tl.channel('landedU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const idxOp = tl.channel('idxOp', 1);
  const chainU = tl.channel('chainU', 0);
  const jumpU = tl.channel('jumpU', 0); // pointer-jumping rounds, 0..5
  // the catch, and the payoff
  const edgeU = tl.channel('edgeU', 0);
  const bandU = tl.channel('bandU', 0);
  const finalU = tl.channel('finalU', 0);

  const S = SLOTS;
  CAPTIONS.forEach((text, i) => tl.caption({ ...S[i], text }));

  // — B0 · the gallery; copy the circuit once per photo —
  let a = S[0].at;
  tl.tween(galU, 1, { at: a + 0.1, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + 3.0, dur: 1.4, ease: ease.move });
  tl.tween(gPos, 1, { at: a + 3.0, dur: 1.4, ease: ease.move });
  tl.tween(leftU, 1, { at: a + 3.6, dur: 0.8, ease: ease.enter });
  tl.tween(copyN, PHOTOS, { at: a + 4.4, dur: 5.6, ease: ease.linear });
  tl.tween(dupChipU, 1, { at: a + 8.6, dur: 0.6, ease: ease.pop });
  tl.hold(a + S[0].dur, HOLD);

  // — B1 · write it once, run it as instances —
  a = S[1].at;
  tl.tween(cam, CAM_RIGHT, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(leftOp, 0.1, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(rightU, 1, { at: a + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(ghostU, 1, { at: a + 2.4, dur: 1.0, ease: ease.move });
  tl.tween(stampU, PHOTOS, { at: a + 3.0, dur: 4.0, ease: ease.linear });
  tl.tween(reduceU, 1, { at: a + 6.4, dur: 0.8, ease: ease.enter });
  tl.hold(a + S[1].dur, HOLD);

  // — B2 · 401 shared, 233 per photo at any count —
  a = S[2].at;
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(leftOp, 1, { at: a + 3.0, dur: 0.7, ease: ease.move });
  tl.tween(sharedU, 1, { at: a + 0.4, dur: 0.7, ease: ease.pop });
  tl.tween(sliderU, 1, { at: a + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(nIdx, 1, { at: a + 4.6, dur: 1.2, ease: ease.move });
  tl.tween(nIdx, 2, { at: a + 6.4, dur: 1.2, ease: ease.move });
  tl.hold(a + S[2].dur, HOLD);

  // — B3 · 65 µs vs 546 µs at 221 photos —
  a = S[3].at;
  tl.tween(nIdx, 0, { at: a, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(leftOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(rightOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(barsU, 1, { at: a + 1.2, dur: 1.2, ease: ease.draw });
  tl.hold(a + S[3].dur, HOLD);

  // — B4 · 4,106 µs vs 43,027 µs at 10,000 —
  a = S[4].at;
  tl.tween(nIdx, 1, { at: a + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(nIdx, 2, { at: a + 2.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: a + 5.2, dur: 1.3, ease: ease.move });
  tl.tween(leftOp, 1, { at: a + 5.2, dur: 0.7, ease: ease.move });
  tl.hold(a + S[4].dur, HOLD);

  // — B5 · a spring step is a 2×2 matrix —
  a = S[5].at;
  tl.tween(nIdx, 0, { at: a, dur: 1.0, ease: ease.move });
  tl.tween(barsOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(sliderU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(leftOp, 0.08, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(rightOp, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(galOp, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SPRINGROW, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(springRowU, 1, { at: a + 0.9, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAM_PHASE, { at: a + 3.0, dur: 1.4, ease: ease.move });
  tl.tween(rightOp, 0.08, { at: a + 3.0, dur: 0.6, ease: ease.move });
  tl.tween(panelU, 1, { at: a + 3.2, dur: 0.8, ease: ease.enter });
  tl.tween(phaseU, 1, { at: a + 3.6, dur: 1.2, ease: ease.draw });
  tl.tween(stepsU, N_STEPS, { at: a + 5.0, dur: 4.0, ease: ease.linear });
  tl.tween(matU, 1, { at: a + 8.6, dur: 0.7, ease: ease.enter });
  tl.hold(a + S[5].dur, HOLD);

  // — B6 · catch-up is a matrix power —
  a = S[6].at;
  tl.tween(powTexU, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(powU, N_STEPS / FINE, { at: a + 1.4, dur: 3.2, ease: ease.linear });
  tl.tween(bankU, 1, { at: a + 6.0, dur: 0.6, ease: ease.pop });
  tl.hold(a + S[6].dur, HOLD);

  // — B7 · values[index] is one operation —
  a = S[7].at;
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(phaseU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(matU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(powTexU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(bankU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(idxU, 1, { at: a + 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(oneHotU, 1, { at: a + 2.6, dur: 1.4, ease: ease.draw });
  tl.tween(readU, 1, { at: a + 6.0, dur: 1.0, ease: ease.draw });
  tl.hold(a + S[7].dur, HOLD);

  // — B8 · landed in the runtime —
  a = S[8].at;
  tl.tween(oneHotU, 0.1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(quoteU, 1, { at: a + 0.5, dur: 0.8, ease: ease.enter });
  tl.tween(landedU, 1, { at: a + 7.0, dur: 0.5, ease: ease.pop });
  tl.hold(a + S[8].dur, HOLD);

  // — B9 · pointer jumping: line count and widest line —
  a = S[9].at;
  tl.tween(idxOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_CHAIN, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(chainU, 1, { at: a + 0.6, dur: 1.0, ease: ease.draw });
  tl.tween(jumpU, 5, { at: a + 2.2, dur: 5.0, ease: ease.linear });
  tl.hold(a + S[9].dur, HOLD);

  // — B10 · the catch: a 0.18 px band far down the gallery —
  a = S[10].at;
  tl.tween(panelU, 0, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(idxU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(chainU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(rightOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(leftOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(gPos, 0, { at: a + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(galOp, 1, { at: a + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_EDGE, { at: a + 1.4, dur: 1.5, ease: ease.move });
  tl.tween(edgeU, 1, { at: a + 3.0, dur: 0.8, ease: ease.enter });
  tl.tween(bandU, 1, { at: a + 4.4, dur: 1.0, ease: ease.draw });
  tl.hold(a + S[10].dur, HOLD);

  // — B11 · three trades, each with a scope —
  a = S[11].at;
  tl.tween(edgeU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(bandU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.5, ease: ease.move });
  tl.tween(finalU, 1, { at: a + 1.2, dur: 2.4, ease: ease.linear });
  const end = a + S[11].dur;
  tl.hold(end, 2.4);

  return {
    tl, cam, galU, gPos, galOp, copyN, stampU, nIdx,
    leftU, leftOp, dupChipU, rightU, rightOp, ghostU, reduceU, sharedU, sliderU, barsU, barsOp, springRowU,
    panelU, phaseU, stepsU, matU, powU, powTexU, bankU,
    idxU, oneHotU, readU, landedU, quoteU, idxOp, chainU, jumpU,
    edgeU, bandU, finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? fs * 0.602 : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill ?? colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Label({ x, y, text, color = colors.TEXT, fs = 13, anchor = 'start', mono = false, opacity = 1, weight }: {
  x: number; y: number; text: string; color?: string; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={fs} fontFamily={mono ? MONO : UI} opacity={opacity} fontWeight={weight}>
      {text}
    </text>
  );
}

function BitDisc({ x, y, b, r = 9, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 1 ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={1.6} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={b >= 1 ? '#0a0e1a' : colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700}>
        {b}
      </text>
    </g>
  );
}

/** a gallery grid of n tiles in a fixed box */
function TileGrid({ x, y, w, h, cols, n, opacity, tone }: { x: number; y: number; w: number; h: number; cols: number; n: number; opacity: number; tone?: (i: number) => string }) {
  if (opacity <= 0.005) return null;
  const rows = Math.ceil(n / cols);
  const px = w / cols;
  const py = h / rows;
  return (
    <g opacity={opacity}>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + (i % cols) * px} y={y + Math.floor(i / cols) * py} width={px * TILE_FILL} height={py * TILE_FILL}
          fill={tone ? tone(i) : TONES[i % TONES.length]} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const galU = s.get(scene.galU);
  const gPos = s.get(scene.gPos);
  const galOp = s.get(scene.galOp);
  const copyN = s.get(scene.copyN);
  const stampU = s.get(scene.stampU);
  const nIdx = s.get(scene.nIdx);
  const leftU = s.get(scene.leftU);
  const leftOp = s.get(scene.leftOp) * leftU;
  const dupChipU = s.get(scene.dupChipU);
  const rightU = s.get(scene.rightU);
  const rightOp = s.get(scene.rightOp) * rightU;
  const ghostU = s.get(scene.ghostU);
  const reduceU = s.get(scene.reduceU);
  const sharedU = s.get(scene.sharedU);
  const sliderU = s.get(scene.sliderU);
  const barsU = s.get(scene.barsU);
  const barsOp = s.get(scene.barsOp) * clamp01(barsU * 3);
  const springRowU = s.get(scene.springRowU);
  const panelU = s.get(scene.panelU);
  const phaseU = s.get(scene.phaseU);
  const stepsU = s.get(scene.stepsU);
  const matU = s.get(scene.matU);
  const powU = s.get(scene.powU);
  const powTexU = s.get(scene.powTexU);
  const bankU = s.get(scene.bankU);
  const idxU = s.get(scene.idxU);
  const oneHotU = s.get(scene.oneHotU);
  const readU = s.get(scene.readU);
  const landedU = s.get(scene.landedU);
  const quoteU = s.get(scene.quoteU);
  const idxOp = s.get(scene.idxOp) * idxU;
  const chainU = s.get(scene.chainU);
  const jumpU = s.get(scene.jumpU);
  const edgeU = s.get(scene.edgeU);
  const bandU = s.get(scene.bandU);
  const finalU = s.get(scene.finalU);

  // photo count: 221 → 1,000 → 10,000, log-interpolated between the table's columns
  const ni = Math.max(0, Math.min(2, Math.round(nIdx)));
  const nSettle = clamp01(1 - 3.5 * Math.abs(nIdx - ni)); // numbers show only when the slider rests on a column
  const logLerp = (arr: number[]): number => {
    const k = Math.min(1, Math.floor(nIdx));
    const u = clamp01(nIdx - k);
    return 10 ** lerp(Math.log10(arr[k]), Math.log10(arr[k + 1]), u);
  };
  const nNow = logLerp(COUNTS);

  // gallery geometry
  const gx = lerp(G_BIG.x, G_MID.x, gPos);
  const gy = lerp(G_BIG.y, G_MID.y, gPos);
  const gpx = lerp(G_BIG.px, G_MID.px, gPos);
  const gpy = lerp(G_BIG.py, G_MID.py, gPos);
  const gw = COLS * gpx;
  const gh = ROWS * gpy;
  const w221 = clamp01(1 - nIdx);
  const w1k = clamp01(1 - Math.abs(nIdx - 1));
  const w10k = clamp01(nIdx - 1);
  const copyHead = Math.floor(copyN);
  const stampHead = Math.floor(stampU);
  const stampOn = stampU > 0.01 && stampU < PHOTOS - 0.01;

  const toScreen = (x: number, y: number): [number, number] => [(x - cam.x) * cam.k + STAGE_W / 2, (y - cam.y) * cam.k + 360];
  // final-beat staging: grid tinted, three trade chips staggered
  const fin = (k: number): number => clamp01(finalU * 4 - k);

  // ---- per-photo tile ----
  const tiles = Array.from({ length: PHOTOS }, (_, i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const enter = clamp01(galU * 2.2 - (r / ROWS) * 1.2);
    if (enter <= 0) return null;
    const x = gx + c * gpx;
    const y = gy + r * gpy;
    const copied = copyN > i + 0.5 && copyN < PHOTOS - 0.5 ? clamp01(1 - (copyN - i - 0.5) / 8) : 0;
    const stamped = stampU > i ? (stampU >= PHOTOS - 0.01 ? 0.35 : 0.35 + 0.65 * clamp01(1 - (stampU - i) / 12)) : 0;
    const isEdge = c === EDGE_COL && r === EDGE_ROW;
    return (
      <g key={i} opacity={enter}>
        <rect x={x} y={y} width={gpx * TILE_FILL} height={gpy * TILE_FILL} rx={1.5} fill={TONES[i]} />
        {copied > 0.01 && <rect x={x} y={y} width={gpx * TILE_FILL} height={gpy * TILE_FILL} rx={1.5} fill={colors.NEGATIVE} opacity={0.75 * copied} />}
        {stamped > 0.01 && (
          <rect x={x} y={y} width={gpx * TILE_FILL} height={gpy * TILE_FILL} rx={1.5} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} opacity={stamped * (1 - nIdx * 0.5)} />
        )}
        {isEdge && edgeU > 0.01 && (
          <rect x={x - 2} y={y - 2} width={gpx * TILE_FILL + 4} height={gpy * TILE_FILL + 4} rx={2} fill="none" stroke={colors.WARM} strokeWidth={1.4} opacity={edgeU} />
        )}
      </g>
    );
  });

  // ---- duplicated stack ----
  const nCopiesNow = nIdx > 0.001 ? nNow : copyN;
  const stackCols = Math.max(1, nCopiesNow / PHOTOS);
  const colW = STACK.w / Math.max(1, stackCols);
  const stackFullH = PHOTOS * STACK.pitch;

  // phase-plot dots
  const nDots = Math.floor(stepsU);
  const jumpsDone = powU;

  // pointer-jumping round r: each node points 2^r ahead
  const jr = Math.floor(jumpU);
  const jFrac = clamp01((jumpU - jr) * 1.6);

  const edgeScreen = toScreen(EDGE_TILE.x + G_BIG.px * TILE_FILL, EDGE_TILE.y + (G_BIG.py * TILE_FILL) / 2);

  const dupOps = DUP_OPS[ni];
  const dupLayers = DUP_LAYERS[ni];

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ============ the gallery (persistent) ============ */}
        <g opacity={galOp}>
          <g opacity={w221}>{tiles}</g>
          {w1k > 0.01 && <TileGrid x={G_MID.x} y={G_MID.y} w={G_MID_W} h={G_MID_H} cols={40} n={1000} opacity={w1k} />}
          {w10k > 0.01 && (
            <g opacity={w10k}>
              <defs>
                <pattern id="uix2-10k" width={G_MID_W / 100} height={G_MID_H / 100} patternUnits="userSpaceOnUse" x={G_MID.x} y={G_MID.y}>
                  <rect width={(G_MID_W / 100) * 0.7} height={(G_MID_H / 100) * 0.7} fill="hsl(230, 28%, 42%)" />
                </pattern>
              </defs>
              <rect x={G_MID.x} y={G_MID.y} width={G_MID_W} height={G_MID_H} fill="url(#uix2-10k)" />
            </g>
          )}
          {galU > 0.3 && (
            <Label x={gx + gw / 2} y={gy - 12} anchor="middle" fs={gPos > 0.5 ? 13 : 15} color={colors.MUTED}
              opacity={clamp01(galU * 2 - 0.8) * (1 - edgeU) * (1 - fin(0)) * clamp01((toScreen(0, gy - 26)[1] - HEADER_H) / 12)}
              text={nSettle > 0.5 || nIdx < 0.01 ? `chenglou.github.io gallery · ${nf(COUNTS[ni])} photos` : 'chenglou.github.io gallery'} />
          )}
          {stampOn && (
            <rect x={gx + (stampHead % COLS) * gpx - 3} y={gy + Math.floor(stampHead / COLS) * gpy - 3} width={gpx * TILE_FILL + 6}
              height={gpy * TILE_FILL + 6} rx={3} fill="none" stroke={colors.ACCENT} strokeWidth={2.2} />
          )}
        </g>

        {/* ============ left: the copied circuit ============ */}
        {leftOp > 0.005 && (
          <g opacity={leftOp}>
            <rect x={L.x} y={L.y} width={L.w} height={L.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <Label x={L.x + 22} y={L.y + 30} text="copy the circuit once per photo" color={colors.NEGATIVE} fs={15} />
            <Label x={L.x + 22} y={L.y + 50} text="one slab = one photo's copy" color={colors.MUTED} />
            {/* the stack: 221 slabs per column; extra columns when the photo count grows */}
            <clipPath id="uix2-stack">
              <rect x={STACK.x - 2} y={STACK.base - stackFullH - 6} width={STACK.w + 4} height={stackFullH + 8} />
            </clipPath>
            <g clipPath="url(#uix2-stack)">
              {nIdx <= 0.001
                ? Array.from({ length: Math.min(PHOTOS, Math.ceil(copyN)) }, (_, i) => {
                    const u = clamp01(copyN - i);
                    return (
                      <rect key={i} x={STACK.x} y={STACK.base - (i + 1) * STACK.pitch} width={STACK.w} height={STACK.pitch * 0.7}
                        fill={i === copyHead && copyN < PHOTOS ? colors.NEGATIVE : TONES[i]} opacity={u} />
                    );
                  })
                : Array.from({ length: Math.ceil(stackCols) }, (_, c) => {
                    const frac = Math.min(1, stackCols - c);
                    return (
                      <g key={c}>
                        <rect x={STACK.x + c * colW} y={STACK.base - stackFullH * frac} width={Math.max(1, colW - (colW > 4 ? 1.5 : 0.4))}
                          height={stackFullH * frac} fill={colors.NEGATIVE} opacity={0.5} />
                      </g>
                    );
                  })}
            </g>
            <line x1={STACK.x - 8} y1={STACK.base + 2} x2={STACK.x + STACK.w + 8} y2={STACK.base + 2} stroke={colors.MUTED} strokeWidth={1.2} />
            <Label x={STACK.x + STACK.w / 2} y={STACK.base + 26} anchor="middle" mono fs={14} color={colors.TEXT}
              text={nIdx > 0.001 ? (nSettle > 0.5 ? `${nf(COUNTS[ni])} copies` : '') : `${Math.min(PHOTOS, Math.floor(copyN + 0.001))} copies`} />
            {dupChipU > 0.01 && (
              <Chip x={STACK.x + STACK.w / 2} y={STACK.base + 58} anchor="middle" mono fs={14} color={colors.NEGATIVE}
                opacity={dupChipU * (nIdx < 0.001 ? 1 : nSettle)} text={`${nf(dupOps)} ops · ${dupLayers} layers`} />
            )}
          </g>
        )}

        {/* ============ right: one per-photo program ============ */}
        {rightOp > 0.005 && (
          <g opacity={rightOp}>
            <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <Label x={R.x + 20} y={R.y + 30} text="write it once, run it as instances" color={colors.ACCENT} fs={15} />
            {/* stamped instances behind the card */}
            {ghostU > 0.01 &&
              [4, 3, 2, 1].map((k) => (
                <rect key={k} x={CARD.x + 4 * k * ghostU} y={CARD.y - 4 * k * ghostU} width={CARD.w - 28} height={CARD.h} rx={10}
                  fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.5 - k * 0.09} opacity={ghostU} />
              ))}
            <rect x={CARD.x} y={CARD.y} width={CARD.w - 28} height={CARD.h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <Label x={CARD.x + 16} y={CARD.y + 30} text="per-photo program" color={colors.TEXT} fs={14} />
            <Label x={CARD.x + CARD.w - 44} y={CARD.y + 30} anchor="end" mono fs={14} color={colors.ACCENT} text={`${PER_PHOTO} ops`} />
            {STAGES.map((st, j) => {
              const y = ROW_Y0 + j * ROW_DY;
              const isSpring = j === STAGES.length - 1;
              const dim = springRowU > 0.01 && !isSpring ? 1 - 0.85 * springRowU : 1;
              return (
                <g key={st.name} opacity={dim}>
                  <Label x={CARD.x + 16} y={y + 4} text={st.name} fs={13} color={isSpring && springRowU > 0.01 ? colors.WARM : colors.TEXT} />
                  <rect x={1050} y={y - 7} width={st.ops * 0.62} height={10} rx={2} fill={isSpring && springRowU > 0.01 ? colors.WARM : colors.ACCENT} opacity={0.75} />
                  <Label x={CARD.x + CARD.w - 44} y={y + 4} anchor="end" mono fs={13} color={colors.MUTED} text={`${st.ops}`} />
                  {isSpring && springRowU > 0.01 && (
                    <rect x={CARD.x + 6} y={y - 15} width={CARD.w - 40} height={26} rx={6} fill="none" stroke={colors.WARM} strokeWidth={1.6} opacity={springRowU} />
                  )}
                </g>
              );
            })}
            {/* reductions across photos between stages */}
            {reduceU > 0.01 && (
              <g opacity={reduceU * (1 - 0.85 * springRowU)}>
                {[0, 1, 2, 3, 4].map((j) => (
                  <text key={j} x={CARD.x + CARD.w - 22} y={ROW_Y0 + j * ROW_DY + 19} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
                    Σ
                  </text>
                ))}
                <Label x={CARD.x} y={CARD.y + CARD.h + 24} text="Σ  reductions across photos between stages" color={colors.SECONDARY} />
              </g>
            )}
            {sharedU > 0.01 && (
              <g opacity={sharedU * (1 - 0.85 * springRowU)}>
                <rect x={CARD.x} y={454} width={CARD.w - 28} height={34} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
                <Label x={CARD.x + 14} y={476} text="shared, once" color={colors.TEXT} fs={14} />
                <Label x={CARD.x + CARD.w - 44} y={476} anchor="end" mono fs={14} color={colors.SECONDARY} text={`${SHARED} ops`} />
                <Label x={CARD.x} y={510} text={`clock and spring matrix: ${SHARED_SPRING} of them`} color={colors.MUTED} />
              </g>
            )}
            {sliderU > 0.01 && (
              <g opacity={sliderU * nSettle}>
                <Chip x={CARD.x} y={548} mono fs={14} color={colors.ACCENT}
                  text={`${nf(COUNTS[ni])} photos: ${PER_PHOTO} ops each`} />
              </g>
            )}
            {ghostU > 0.01 && stampU > 0.01 && (
              <Label x={CARD.x} y={CARD.y + CARD.h + 46} text={`instance axis: photo ${Math.min(PHOTOS - 1, stampHead)} of 0 … 220`} color={colors.ACCENT} mono fs={13}
                opacity={ghostU * (1 - sharedU)} />
            )}
          </g>
        )}
        {/* the stamp's tether, from the card to the photo it is running on */}
        {stampOn && rightOp > 0.2 && (
          <line x1={CARD.x} y1={CARD.y + CARD.h / 2} x2={gx + (stampHead % COLS) * gpx + gpx * TILE_FILL + 3} y2={gy + Math.floor(stampHead / COLS) * gpy + gpy / 2}
            stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.8} />
        )}

        {/* ============ slider and microsecond bars (centre column) ============ */}
        {sliderU > 0.01 && (
          <g opacity={sliderU * galOp}>
            <line x1={SLIDER.x0} y1={SLIDER.y} x2={SLIDER.x1} y2={SLIDER.y} stroke={colors.MUTED} strokeWidth={2} />
            {COUNTS.map((c, k) => {
              const x = lerp(SLIDER.x0, SLIDER.x1, k / 2);
              return (
                <g key={c}>
                  <line x1={x} y1={SLIDER.y - 6} x2={x} y2={SLIDER.y + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                  <Label x={x} y={SLIDER.y + 26} anchor="middle" mono fs={13} color={k === ni && nSettle > 0.5 ? colors.TEXT : colors.MUTED} text={nf(c)} />
                </g>
              );
            })}
            <circle cx={lerp(SLIDER.x0, SLIDER.x1, nIdx / 2)} cy={SLIDER.y} r={8} fill={colors.ACCENT} />
            <Label x={SLIDER.x0 - 14} y={SLIDER.y + 5} anchor="end" fs={13} color={colors.MUTED} text="photos" />
          </g>
        )}
        {barsOp > 0.005 && (
          <g opacity={barsOp}>
            <line x1={BARS.x0} y1={BARS.axis} x2={usX(100000)} y2={BARS.axis} stroke={colors.MUTED} strokeWidth={1.2} opacity={clamp01(barsU * 2)} />
            {[10, 100, 1000, 10000, 100000].map((v, k) => (
              <g key={v} opacity={clamp01(barsU * 4 - k * 0.4)}>
                <line x1={usX(v)} y1={BARS.axis} x2={usX(v)} y2={BARS.axis + 6} stroke={colors.MUTED} />
                <Label x={usX(v)} y={BARS.axis + 22} anchor="middle" mono fs={13} color={colors.MUTED} text={['10 µs', '100', '1k', '10k', '100k'][k]} />
              </g>
            ))}
            {[
              { label: 'staged executor', us: logLerp(STAGED_US), exact: STAGED_US[ni], y: BARS.y0, c: colors.POSITIVE },
              { label: 'duplicated circuit', us: logLerp(DUP_US), exact: DUP_US[ni], y: BARS.y1, c: colors.NEGATIVE },
            ].map((b) => {
              const x1 = lerp(BARS.x0, usX(b.us), clamp01(barsU));
              return (
                <g key={b.label}>
                  <Label x={BARS.x0} y={b.y - 8} text={b.label} color={b.c} fs={13} />
                  <rect x={BARS.x0} y={b.y} width={Math.max(0, x1 - BARS.x0)} height={18} rx={3} fill={b.c} opacity={0.85} />
                  <Label x={x1 + 8} y={b.y + 14} mono fs={14} color={colors.TEXT} opacity={nSettle * clamp01(barsU * 2 - 1)} text={`${nf(b.exact)} µs`} />
                </g>
              );
            })}
            <Label x={BARS.x0} y={BARS.axis + 48} fs={13} color={colors.MUTED} text="per evaluation, on the CPU, log scale · timings are rough" />
          </g>
        )}

        {/* ============ centre panel: springs, then index reads ============ */}
        {panelU > 0.005 && (
          <g opacity={panelU}>
            <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={16} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
          </g>
        )}
        {phaseU > 0.005 && (
          <g opacity={clamp01(phaseU * 2)}>
            <Label x={P.x + 28} y={P.y + 36} text="one spring lane · semi-implicit Euler, 4 ms steps" color={colors.TEXT} fs={15} />
            {/* axes */}
            <line x1={PX0} y1={PY0} x2={lerp(PX0, phX(130), phaseU)} y2={PY0} stroke={colors.MUTED} strokeWidth={1.4} />
            <line x1={PX0} y1={PY0 - 14} x2={PX0} y2={lerp(PY0 - 14, phY(-1300), phaseU)} stroke={colors.MUTED} strokeWidth={1.4} />
            {[0, 40, 80, 120].map((e) => (
              <Label key={e} x={phX(e)} y={PY0 - 10} anchor="middle" mono fs={13} color={colors.MUTED} text={`${e}`} />
            ))}
            <Label x={phX(60)} y={PY0 - 30} anchor="middle" fs={13} color={colors.MUTED} text="e · px from the destination" />
            {[-400, -800, -1200].map((v) => (
              <Label key={v} x={PX0 - 8} y={phY(v) + 4} anchor="end" mono fs={13} color={colors.MUTED} text={`−${-v}`} />
            ))}
            <Label x={PX0 + 10} y={phY(-1300) + 4} fs={13} color={colors.MUTED} text="v · px/s" />
            {/* Euler steps, one dot each */}
            <path d={TRAJ.slice(0, Math.max(1, nDots + 1)).map((p, i) => `${i ? 'L' : 'M'} ${phX(p[0])} ${phY(p[1])}`).join(' ')}
              fill="none" stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.5 * (1 - 0.6 * clamp01(jumpsDone))} />
            {TRAJ.slice(0, nDots + 1).map((p, i) => (
              <circle key={i} cx={phX(p[0])} cy={phY(p[1])} r={i % FINE === 0 ? 4 : 2.6} fill={colors.ACCENT} opacity={(i % FINE === 0 ? 1 : 0.8) * (1 - 0.65 * clamp01(jumpsDone))} />
            ))}
            {/* M^16 jumps */}
            {JUMPS.slice(1).map((p, j) => {
              const u = clamp01(jumpsDone - j);
              if (u <= 0) return null;
              const a0 = JUMPS[j];
              const x0 = phX(a0[0]);
              const y0 = phY(a0[1]);
              const x1 = phX(p[0]);
              const y1 = phY(p[1]);
              const mx = (x0 + x1) / 2 - (y1 - y0) * 0.18;
              const my = (y0 + y1) / 2 + (x1 - x0) * 0.18;
              const bx = lerp(lerp(x0, mx, u), lerp(mx, x1, u), u);
              const by = lerp(lerp(y0, my, u), lerp(my, y1, u), u);
              return (
                <g key={j}>
                  <path d={`M ${x0} ${y0} Q ${lerp(x0, mx, u)} ${lerp(y0, my, u)} ${bx} ${by}`} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                  <circle cx={bx} cy={by} r={6} fill={colors.WARM} />
                </g>
              );
            })}
            {powU > 0.01 && (
              <Label x={phX(JUMPS[1][0]) + 14} y={phY(JUMPS[1][1]) + 4} mono fs={13} color={colors.WARM} opacity={clamp01(powU)} text="16 steps, one multiply" />
            )}
            {stepsU > 0.5 && (
              <Label x={phX(TRAJ[0][0]) + 12} y={PY0 + 22} anchor="start" fs={13} color={colors.MUTED}
                opacity={clamp01(stepsU)} text="start (illustrative)" />
            )}
            {/* the matrix */}
            <MathLabel tex={TEX_STEP} x={862} y={186} fontSize={17} opacity={matU} />
            {matU > 0.01 && (
              <>
                <Label x={862} y={244} anchor="middle" fs={13} color={colors.MUTED} opacity={matU} text="stiffness 650 · damping 45 · 4 ms" />
                <Label x={862} y={264} anchor="middle" mono fs={13} color={colors.MUTED} opacity={matU} text="eulerStepMatrix" />
              </>
            )}
            <MathLabel tex={TEX_POW} x={862} y={318} fontSize={17} color={colors.WARM} opacity={powTexU} />
            {powTexU > 0.01 && (
              <Label x={862} y={376} anchor="middle" mono fs={13} color={colors.MUTED} opacity={powTexU} text="matrixPower(step, 16): 4 squarings" />
            )}
            {bankU > 0.01 && (
              <g opacity={bankU}>
                <Label x={862} y={436} anchor="middle" fs={13} color={colors.MUTED} text="spring bank, HandwiredOS copy" />
                <Chip x={862} y={472} anchor="middle" mono fs={14} color={colors.POSITIVE} text="5,253 → 3,580 ops" />
                <Chip x={862} y={508} anchor="middle" mono fs={14} color={colors.POSITIVE} text="192 → 137 layers" />
              </g>
            )}
          </g>
        )}

        {idxU > 0.005 && (
          <g opacity={idxU}>
            <g opacity={idxOp / Math.max(idxU, 1e-6)}>
              <Label x={P.x + 28} y={P.y + 36} mono text="values[index]" color={colors.TEXT} fs={16} />
              <Label x={P.x + 168} y={P.y + 36} text="· one row of the gallery as a table of 17 wires" color={colors.MUTED} fs={13} />
              {Array.from({ length: COLS }, (_, j) => {
                const pick = j === IDX_PICK;
                return (
                  <g key={j}>
                    <rect x={candX(j)} y={CAND.y} width={CAND.w} height={CAND.h} rx={3} fill={TONES[IDX_ROW * COLS + j]}
                      stroke={pick && readU > 0.5 ? colors.WARM : 'none'} strokeWidth={2.2} />
                    <Label x={candX(j) + CAND.w / 2} y={CAND.y - 8} anchor="middle" mono fs={13} color={pick ? colors.TEXT : colors.MUTED} text={`${j}`}
                      opacity={j % 2 === 0 || pick ? 1 : 0} />
                  </g>
                );
              })}
              <Chip x={CAND.x} y={CAND.y + 70} mono fs={14} color={colors.WARM} text={`index = ${IDX_PICK}`} />
              {/* before: a one-hot and a sum */}
              <g opacity={oneHotU}>
                {Array.from({ length: COLS }, (_, j) => (
                  <BitDisc key={j} x={candX(j) + CAND.w / 2} y={CAND.y + 108} b={j === IDX_PICK ? 1 : 0} opacity={clamp01(oneHotU * 3 - (j / COLS) * 2)} />
                ))}
                <path d={`M ${candX(0) + CAND.w / 2} ${CAND.y + 124} Q ${(candX(0) + candX(16)) / 2 + 15} ${CAND.y + 168} ${candX(16) + CAND.w / 2} ${CAND.y + 124}`}
                  fill="none" stroke={colors.MUTED} strokeWidth={1.2} opacity={clamp01(oneHotU * 2 - 1)} />
                <Label x={(candX(0) + candX(16)) / 2 + 15} y={CAND.y + 172} anchor="middle" fs={14} color={colors.TEXT} opacity={clamp01(oneHotU * 2 - 1)}
                  text="before: Σ bit × value over every position · 2 to 3 atoms per position" />
              </g>
              {/* now: one instruction */}
              <g opacity={readU}>
                <path d={`M ${CAND.x + 96} ${CAND.y + 64} C ${CAND.x + 200} ${CAND.y + 20}, ${candX(IDX_PICK) - 60} ${CAND.y + 100}, ${candX(IDX_PICK) + CAND.w / 2} ${CAND.y + CAND.h + 4}`}
                  fill="none" stroke={colors.WARM} strokeWidth={2.4} strokeDasharray={`${readU * 600} 600`} opacity={1 - 0.7 * clamp01(oneHotU * 2 - 1) * (1 - quoteU)} />
                <rect x={CAND.x} y={CAND.y + 196} width={612} height={40} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
                <Label x={CAND.x + 16} y={CAND.y + 222} mono fs={14} color={colors.TEXT} text="indexRead(index, candidates)" />
                <Label x={CAND.x + 596} y={CAND.y + 222} anchor="end" mono fs={14} color={colors.WARM} text="1 operation" />
              </g>
            </g>
            {/* landed: the README's own comparison */}
            {quoteU > 0.01 && (
              <g opacity={quoteU * (idxOp / Math.max(idxU, 1e-6))}>
                <rect x={CAND.x} y={CAND.y + 256} width={612} height={64} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <Label x={CAND.x + 16} y={CAND.y + 281} fs={14} color={colors.TEXT}
                  text="“It changes the cost of lists, text, and slot routing more than" />
                <Label x={CAND.x + 16} y={CAND.y + 303} fs={14} color={colors.TEXT} text="anything else measured.”" />
                <Label x={CAND.x + 596} y={CAND.y + 303} anchor="end" fs={13} color={colors.MUTED} text="the README's comparison, not a ranking" />
              </g>
            )}
            {landedU > 0.01 && (
              <g opacity={landedU * (idxOp / Math.max(idxU, 1e-6))} transform={`rotate(-4 ${CAND.x + 520} ${CAND.y + 70})`}>
                <rect x={CAND.x + 440} y={CAND.y + 52} width={172} height={30} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                <Label x={CAND.x + 526} y={CAND.y + 72} anchor="middle" fs={14} weight={700} color={colors.POSITIVE} text="LANDED · runtime" />
              </g>
            )}
            {/* pointer jumping (schematic) */}
            {chainU > 0.01 && (
              <g opacity={chainU}>
                <Label x={CHAIN.x0} y={CHAIN.y - 112} fs={15} color={colors.TEXT} text="pointer jumping, with index reads" />
                <Label x={CHAIN.x0} y={CHAIN.y - 92} fs={13} color={colors.MUTED} text="each round, every segment reads its pointer's pointer · schematic: 32 of 1,023 segments" />
                <line x1={CHAIN.x0} y1={CHAIN.y} x2={lerp(CHAIN.x0, CHAIN.x1, chainU)} y2={CHAIN.y} stroke={colors.GRID} strokeWidth={2} />
                {Array.from({ length: CHAIN_N }, (_, i) => (
                  <circle key={i} cx={chainX(i)} cy={CHAIN.y} r={5} fill={colors.ACCENT} opacity={clamp01(chainU * 2 - i / CHAIN_N)} />
                ))}
                {jumpU > 0.01 &&
                  Array.from({ length: CHAIN_N }, (_, i) => {
                    if (i % 4 !== 0) return null;
                    const r = Math.min(4, jr);
                    const stride = 2 ** r;
                    const to = i + stride;
                    if (to >= CHAIN_N) return null;
                    const u = jr >= 5 ? 1 : jFrac;
                    const x0 = chainX(i);
                    const x1 = lerp(x0, chainX(to), u);
                    const h = 10 + 9 * r;
                    return (
                      <path key={i} d={`M ${x0} ${CHAIN.y - 7} Q ${(x0 + x1) / 2} ${CHAIN.y - 7 - h * 1.6} ${x1} ${CHAIN.y - 7}`}
                        fill="none" stroke={colors.WARM} strokeWidth={1.6} opacity={0.9} />
                    );
                  })}
                {jumpU > 0.01 && (
                  <Label x={CHAIN.x1} y={CHAIN.y + 30} anchor="end" mono fs={13} color={colors.WARM}
                    text={`round ${Math.min(5, jr + 1)}: pointer jumps ${2 ** Math.min(4, jr)} ahead`} />
                )}
                <Chip x={CHAIN.x0} y={CHAIN.y + 38} mono fs={14} color={colors.POSITIVE} opacity={clamp01(jumpU - 3.6)}
                  text="1,023 segments → line count + widest line · 66 layers" />
              </g>
            )}
          </g>
        )}

        {/* ============ the payoff ============ */}
        {finalU > 0.01 && (
          <g>
            {[
              { title: 'instance axis', sub: `${PER_PHOTO} ops per photo, at any count`, c: colors.ACCENT },
              { title: 'matrix powers', sub: 'many spring steps, one multiply', c: colors.WARM },
              { title: 'index reads', sub: 'values[index] in 1 operation', c: colors.POSITIVE },
            ].map((t, k) => {
              const x = 240 + k * 400;
              const u = fin(k);
              return (
                <g key={t.title} opacity={u} transform={`translate(0 ${(1 - u) * 14})`}>
                  <rect x={x - 180} y={508} width={360} height={74} rx={10} fill={colors.PANEL} stroke={t.c} strokeWidth={1.4} />
                  <Label x={x} y={536} anchor="middle" fs={16} color={t.c} text={`${t.title}: loop → arithmetic`} />
                  <Label x={x} y={562} anchor="middle" fs={13} color={colors.MUTED} mono={k === 2} text={t.sub} />
                </g>
              );
            })}
            <Chip x={640} y={154} anchor="middle" fs={14} color={colors.WARM} opacity={fin(3)}
              text="the one UI of seven where exact order mattered beyond rounding points" />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: the 0.18 px lens ======================== */}
      {edgeU > 0.01 && (
        <g opacity={edgeU}>
          <line x1={edgeScreen[0]} y1={edgeScreen[1]} x2={LENS.x} y2={LENS.y + LENS.h} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="5 4" />
          <rect x={LENS.x} y={LENS.y} width={LENS.w} height={LENS.h} rx={14} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.WARM} strokeWidth={1.5} />
          <Label x={LENS.x + 20} y={LENS.y + 30} fs={15} color={colors.TEXT} text="a photo's right edge, far down the gallery" />
          <Label x={LENS.x + 20} y={LENS.y + 50} fs={13} color={colors.MUTED} text="magnified, schematic" />
          {(() => {
            const xa = LENS.x + 210;
            const band = 88 * bandU;
            const xb = xa + band;
            const top = LENS.y + 78;
            const bot = LENS.y + 222;
            return (
              <g>
                <rect x={LENS.x + 30} y={top} width={xa - LENS.x - 30} height={bot - top} fill={TONES[EDGE_ROW * COLS + EDGE_COL]} />
                {bandU > 0.01 && <rect x={xa} y={top} width={band} height={bot - top} fill={colors.WARM} opacity={0.28} />}
                <line x1={xa} y1={top - 8} x2={xa} y2={bot + 8} stroke={colors.TEXT} strokeWidth={2} />
                {bandU > 0.01 && <line x1={xb} y1={top - 8} x2={xb} y2={bot + 8} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="6 4" />}
                <Label x={xa - 8} y={bot + 30} anchor="end" fs={13} color={colors.TEXT} text="index.ts box edge" />
                <Label x={xb + 8} y={bot + 30} fs={13} color={colors.ACCENT} opacity={bandU} text="the circuit's box edge" />
                {bandU > 0.3 && (
                  <g opacity={clamp01(bandU * 2 - 0.6)}>
                    <line x1={xa} y1={top + 14} x2={xb} y2={top + 14} stroke={colors.WARM} strokeWidth={1.4} />
                    <Label x={(xa + xb) / 2} y={top + 32} anchor="middle" mono fs={14} color={colors.WARM} text="0.18 px" />
                    <circle cx={(xa + xb) / 2} cy={top + 96} r={6} fill={colors.WARM} stroke="#0a0e1a" strokeWidth={1.5} />
                    <Label x={xb + 14} y={top + 92} fs={13} color={colors.TEXT} text="a pointer in the band:" />
                    <Label x={xb + 14} y={top + 110} fs={13} color={colors.TEXT} text="hover and click differ" />
                  </g>
                )}
              </g>
            );
          })()}
        </g>
      )}

      {/* header */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · One Program, Many Photos
      </text>
    </>
  );
}

export const vizScene = () => scene;
