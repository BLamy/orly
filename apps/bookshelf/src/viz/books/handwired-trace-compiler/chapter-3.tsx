// Five Calculations
//
// Trace Compiler — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/trace-compiler/README.md:19-27 (the five calculations; the first three must agree on circuit outputs)
//   README.md:29 (the float64 interpreter must separately agree with native JS; a regression corrupts it)
//   README.md:31 (drift reported, not an error; (100000000 + 1) - 100000000 is 0 in FP32, 1 natively;
//     division becomes fround(a * fround(1 / b)))
//   README.md:35 (sampled evidence within declared input ranges, not a proof)
//   README.md:5, lab/reassessment-2026-09-03.md:58-70 (the September review: `if (true) { return x + 1 }
//     return x + 2` returns 3 natively at x = 2, the compiled version returns 4, both interpreter modes share it)
//   README.md:82 (1,174,491 = 1,102,635 + 68,300 + 3,556 circuit outputs, 0 mismatches; 1,193,491 native, 0)
//   README.md:98, real-slice.ts:162-178 (column calculation, every integer width 0..4096 = 4,097 trials; six
//     widths differ: 512, 756, 1000, 1244, 1488, 1732)
//   report.ts:55 (runRealSlices(20260706, source): the seed)
//   compile.test.ts:387-403 (x + 1, 3 trials, fp64 output + 1 → mismatches [], sourceSemantics.mismatchCount 3)
//   fixtures/index.ts.txt:72, 83-91 (boxesGapX = 24, boxMinSizeX = 220, colsBoxMaxSizeXF)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The column counts and widths on screen are computed below by porting colsBoxMaxSizeXF in
// native float64 and under the FP32 interpreter's policy (fround after each step, division as a multiply by an
// FP32 reciprocal); the module throws unless the sweep reproduces the README's six widths. Per the fact-check
// (review.md, visual note 1) the ≈ 240 px gap is drawn at width 512 (464 vs 220 px); at 1732 the gap is ≈ 41 px
// and is labelled as such. The regression lane values are symbolic (the test's trials are seeded, not listed).
import { Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const comma = (n: number): string => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------------------
// colsBoxMaxSizeXF, native and FP32 (fixtures/index.ts.txt:83-91), swept over 0..4096
// ---------------------------------------------------------------------------

const f = Math.fround;
const GAP = 24; // boxesGapX
const MIN_BOX = 220; // boxMinSizeX
const clampCols = (v: number): number => Math.min(7, Math.max(1, v));
function nativeCols(w: number): { cols: number; box: number } {
  const cols = clampCols(Math.floor((w - GAP) / (MIN_BOX + GAP)));
  return { cols, box: Math.max(1, (w - GAP - cols * GAP) / cols) };
}
function fp32Cols(w: number): { cols: number; box: number } {
  const cols = clampCols(Math.floor(f(f(w - GAP) * f(1 / (MIN_BOX + GAP)))));
  return { cols, box: Math.max(1, f(f(f(w - GAP) - f(cols * GAP)) * f(1 / cols))) };
}
const DIFFS: { w: number; nat: { cols: number; box: number }; f32: { cols: number; box: number } }[] = [];
for (let w = 0; w <= 4096; w++) {
  const nat = nativeCols(w);
  const f32 = fp32Cols(w);
  if (nat.cols !== f32.cols) DIFFS.push({ w, nat, f32 });
}
if (DIFFS.map((d) => d.w).join() !== '512,756,1000,1244,1488,1732') {
  throw new Error(`trace-compiler ch3: column sweep disagrees with README.md:98 (${DIFFS.map((d) => d.w).join()})`);
}
const W_TRIAL = 1732;
const T_NAT = nativeCols(W_TRIAL); // 7 · 220
const T_F32 = fp32Cols(W_TRIAL); // 6 · 260.67
const D512 = DIFFS[0]; // 2 × 220 natively, 1 × 464 in FP32
const GAP_512 = Math.round(D512.f32.box - D512.nat.box); // 244
const GAP_1732 = Math.round(T_F32.box - T_NAT.box); // 41
const fmtBox = (v: number): string => `${Number(v.toFixed(2))}`;

// (100000000 + 1) - 100000000 (README.md:31)
const F32_SUM = f(100000000 + 1);
const F32_DIFF = f(F32_SUM - 100000000);
const NAT_DIFF = 100000000 + 1 - 100000000;

// README.md:82 (reported; reproduced by the fact-check)
const OUT_ALL3 = 1_102_635;
const OUT_CONST = 68_300;
const OUT_ABSENT = 3_556;
const OUT_CIRCUIT = OUT_ALL3 + OUT_CONST + OUT_ABSENT;
if (OUT_CIRCUIT !== 1_174_491) throw new Error('trace-compiler ch3: circuit output split does not sum');
const OUT_NATIVE = 1_193_491;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; y < 76 the title band)
// ---------------------------------------------------------------------------

const HEADER_H = 76;
const LANE_Y = [128, 176, 224, 292, 340];
const TRACK_X0 = 300;
const TRACK_X1 = 860;
const TRACK_H = 36;
const OUT_X = 872;
const OUT_W = 156;
const BR_X = 1044;
const VERD_X = 1062;
const TOKEN_CX = 162;
const TOKEN_Y = (LANE_Y[0] + LANE_Y[4]) / 2;
const GROUP_COLOR = [colors.ACCENT, colors.SECONDARY];

const LANES: { name: string; tag?: string; group: 0 | 1 }[] = [
  { name: 'circuit reference evaluator', group: 0 },
  { name: 'compiled execution (JavaScript)', tag: 'JavaScript, not a GPU', group: 0 },
  { name: 'FP32 source interpreter', tag: 'FP32', group: 0 },
  { name: 'float64 source interpreter', tag: 'float64', group: 1 },
  { name: 'native JS', tag: 'the JS engine', group: 1 },
];

// per mode: 0 the width-1732 trial · 1 the September review · 2 the regression test
const TOKEN_TEXT = [`width = ${W_TRIAL}`, 'x = 2', 'x in 0..10 · 3 trials'];
const OUT_HEAD = ['cols · boxMaxSizeX', 'return', 'return'];
const OUTS: string[][] = [
  [
    `${T_F32.cols} · ${fmtBox(T_F32.box)}`,
    `${T_F32.cols} · ${fmtBox(T_F32.box)}`,
    `${T_F32.cols} · ${fmtBox(T_F32.box)}`,
    `${T_NAT.cols} · ${fmtBox(T_NAT.box)}`,
    `${T_NAT.cols} · ${fmtBox(T_NAT.box)}`,
  ],
  ['4', '4', '4', '4', '3'],
  ['x + 1', 'x + 1', 'x + 1', 'x + 1, then + 1', 'x + 1'],
];

// lower half
const PANEL_A = { x: 60, y: 404, w: 560, h: 156 };
const PANEL_B = { x: 660, y: 404, w: 560, h: 156 };
const TAGS = ['sampled trials', 'declared input ranges', 'frozen fixture', 'seed 20260706'];
const TAG_Y = 600;

const RULER_Y = 452;
const RX = (w: number): number => 80 + (w * 1120) / 4096;
const RULER_PATH = Array.from({ length: 4097 }, (_, w) => `M${RX(w).toFixed(2)} ${RULER_Y - 6}v12`).join('');
const LAYOUT_Y = 556;
const LAYOUT_S = 0.5; // the 512 px container drawn at half size
const NAT_X = 90;
const F32_X = 400;
const CARD = { x: 760, y: 528, w: 460, h: 112 };

const CODE_SEPT = ['function example(x) {', '  if (true) { return x + 1 }', '  return x + 2', '}'];
const CODE_TEST = [
  "test('native validation detects an interpreter error …')",
  'function example(x: number) { return x + 1 }',
  "fp64 interpreter: outputs.set('return', … + 1)",
];

const CAM_OPEN: CameraState = { x: 600, y: 240, k: 1.25 };
const CAM_G1: CameraState = { x: 760, y: 200, k: 1.32 };
const CAM_G2: CameraState = { x: 760, y: 290, k: 1.32 };
const CAM_FLASH: CameraState = { x: 640, y: 340, k: 1.0 };
const CAM_PA: CameraState = { x: 470, y: 430, k: 1.18 };
const CAM_PB: CameraState = { x: 810, y: 430, k: 1.18 };
const CAM_SCOPE: CameraState = { x: 640, y: 390, k: 1.0 };
const CAM_DRIFT: CameraState = { x: 760, y: 250, k: 1.2 };
const CAM_RULER: CameraState = { x: 640, y: 430, k: 1.04 };
const CAM_512: CameraState = { x: 420, y: 520, k: 1.32 };
const CAM_CARD: CameraState = { x: 760, y: 500, k: 1.18 };
const CAM_END: CameraState = { x: 640, y: 330, k: 1.0 };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ~150 wpm, a short hold after each
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Exactness is a claim, so the lab tries to break it. Every sampled trial feeds one input through five separate calculations.',
  "Three must agree on the circuit's outputs: a literal reference evaluator, the compiled execution path, which is still Java Script and not a graphics chip, and a single-precision interpreter of the source.",
  'The other two ignore the circuit. One interprets the source in double precision, and one runs the real source natively in the Java Script engine. Those two must agree with each other.',
  'That native lane exists because of a September review. The compiler and its interpreter had both dropped a return, so a wrong answer looked verified. Those cases now have regression tests.',
  'The report checked 1,174,491 circuit outputs and found zero mismatches. Most had all three comparisons; some were constants, and some were absent optional values.',
  'Natively, it checked 1,193,491 double-precision outputs and found zero disagreements. The larger count includes object fields the program left unchanged.',
  'Scope matters. These are sampled trials inside declared input ranges, on the frozen fixture, with a fixed seed. The lab says plainly it is not a proof for every supported program.',
  'Precision is a separate question. Single and double precision are allowed to differ, and the report lists where, rather than calling it a compiler error.',
  'Of 4,097 integer widths, six differ: 512, 756, 1000, 1244, 1488 and 1732. At those widths the single-precision reciprocal rounds so that one fewer column is chosen.',
  "Then each column's width can differ by about two hundred forty pixels. The circuit matches single precision exactly, but that agreement doesn't hide the choice from a user.",
  'A smaller case: one hundred million plus one, minus one hundred million, is zero with a rounding step after each single-precision operation, but one in native Java Script.',
  'One regression adds one to the double-precision outputs, and the test confirms the native check catches it, even while the circuit and the single-precision interpreter still agree.',
];
const CAP_DUR = [8.0, 12.6, 12.6, 12.4, 13.8, 11.6, 12.4, 9.0, 15.0, 11.6, 11.8, 12.2];
const CAP_HOLD = 0.7;
const CAPS = (() => {
  let at = 0.4;
  return CAP_DUR.map((dur) => {
    const c = { at, dur };
    at += dur + CAP_HOLD;
    return c;
  });
})();

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const mode = tl.channel('mode', 0);

  // the five lanes
  const tokenU = tl.channel('tokenU', 0);
  const fanU = tl.channel('fanU', 0);
  const laneIn = LANES.map((_, i) => tl.channel(`laneIn${i}`, 0));
  const laneOp = LANES.map((_, i) => tl.channel(`laneOp${i}`, 1));
  const fill = LANES.map((_, i) => tl.channel(`fill${i}`, 0));
  const tagU = LANES.map((_, i) => tl.channel(`tag${i}`, 0));
  const br1U = tl.channel('br1U', 0);
  const br2U = tl.channel('br2U', 0);
  const badU = tl.channel('badU', 0); // the native bracket turns red
  const lookedU = tl.channel('lookedU', 0); // "looked verified"
  const caughtU = tl.channel('caughtU', 0);
  const glow1U = tl.channel('glow1U', 0);
  // B3 · the September card
  const septU = tl.channel('septU', 0);
  const regU = tl.channel('regU', 0);
  // B4–B6 · counters and scope
  const panelAU = tl.channel('panelAU', 0);
  const countA = tl.channel('countA', 0);
  const barU = tl.channel('barU', 0);
  const mismAU = tl.channel('mismAU', 0);
  const legendAU = tl.channel('legendAU', 0);
  const panelBU = tl.channel('panelBU', 0);
  const countB = tl.channel('countB', 0);
  const mismBU = tl.channel('mismBU', 0);
  const noteBU = tl.channel('noteBU', 0);
  const panelsOp = tl.channel('panelsOp', 1);
  const panelADim = tl.channel('panelADim', 1);
  const scopeU = TAGS.map((_, i) => tl.channel(`scope${i}`, 0));
  const proofU = tl.channel('proofU', 0);
  // B7–B10 · drift
  const driftU = tl.channel('driftU', 0);
  const driftLblU = tl.channel('driftLblU', 0);
  const driftOp = tl.channel('driftOp', 1);
  const rulerU = tl.channel('rulerU', 0);
  const notchU = DIFFS.map((d) => tl.channel(`notch${d.w}`, 0));
  const pairsU = tl.channel('pairsU', 0);
  const notchDim = tl.channel('notchDim', 0); // the other five notches whisper while 512 is spotlit
  const rulerOp = tl.channel('rulerOp', 1);
  const layoutU = tl.channel('layoutU', 0);
  const gapU = tl.channel('gapU', 0);
  const note1732U = tl.channel('note1732U', 0);
  const cardU = tl.channel('cardU', 0);
  const rowFU = tl.channel('rowFU', 0);
  const rowNU = tl.channel('rowNU', 0);
  // B11 · the regression
  const testU = tl.channel('testU', 0);

  const fillLanes = (idx: number[], at: number, dur: number, each = 0.25) =>
    idx.forEach((i, k) => tl.tween(fill[i], 1, { at: at + k * each, dur, ease: ease.linear }));
  const emptyLanes = (at: number) => fill.forEach((ch) => tl.tween(ch, 0, { at, dur: 0.35, ease: ease.move }));
  const setOps = (ops: number[], at: number) => ops.forEach((v, i) => tl.tween(laneOp[i], v, { at, dur: 0.6, ease: ease.move }));
  const out = (ch: ChannelRef<number>, at: number, dur = 0.6) => tl.tween(ch, 0, { at, dur, ease: ease.move });
  const pop = (ch: ChannelRef<number>, at: number, dur = 0.5) => tl.tween(ch, 1, { at, dur, ease: ease.pop });
  const enter = (ch: ChannelRef<number>, at: number, dur = 0.7) => tl.tween(ch, 1, { at, dur, ease: ease.enter });

  CAPTIONS.forEach((text, i) => {
    tl.caption({ ...CAPS[i], text });
    tl.hold(CAPS[i].at + CAPS[i].dur, CAP_HOLD);
  });

  // — B0 · one trial, five calculations —
  let A = CAPS[0].at;
  enter(tokenU, A + 0.3);
  laneIn.forEach((ch, i) => tl.tween(ch, 1, { at: A + 1.2 + i * 0.16, dur: 0.6, ease: ease.enter }));
  tl.tween(fanU, 1, { at: A + 3.6, dur: 1.2, ease: ease.draw });

  // — B1 · lanes 1–3 must agree —
  A = CAPS[1].at;
  tl.tween(cam, CAM_G1, { at: A, dur: 1.3, ease: ease.move });
  setOps([1, 1, 1, 0.15, 0.15], A);
  fillLanes([0], A + 1.6, 1.0);
  fillLanes([1], A + 3.6, 1.0);
  pop(tagU[1], A + 5.4);
  fillLanes([2], A + 9.0, 1.0);
  pop(tagU[2], A + 9.6);
  tl.tween(br1U, 1, { at: A + 10.4, dur: 0.9, ease: ease.draw });

  // — B2 · lanes 4–5 ignore the circuit and must agree with each other —
  A = CAPS[2].at;
  tl.tween(cam, CAM_G2, { at: A, dur: 1.3, ease: ease.move });
  setOps([0.15, 0.15, 0.15, 1, 1], A);
  fillLanes([3], A + 3.4, 1.0);
  pop(tagU[3], A + 4.0);
  fillLanes([4], A + 6.2, 1.0);
  pop(tagU[4], A + 7.0);
  tl.tween(br2U, 1, { at: A + 10.0, dur: 0.9, ease: ease.draw });

  // — B3 · the September review: four lanes agree on a wrong answer —
  A = CAPS[3].at;
  tl.tween(cam, CAM_FLASH, { at: A, dur: 1.3, ease: ease.move });
  setOps([1, 1, 1, 1, 0.15], A);
  emptyLanes(A);
  tl.set(mode, 1, A + 0.4);
  enter(septU, A + 0.6);
  fillLanes([0, 1, 2, 3], A + 1.6, 1.0, 0.2);
  pop(lookedU, A + 4.4);
  tl.tween(laneOp[4], 1, { at: A + 5.4, dur: 0.6, ease: ease.move });
  fillLanes([4], A + 5.8, 1.0);
  pop(badU, A + 7.0);
  pop(regU, A + 9.6);

  // — B4 · 1,174,491 circuit outputs, zero mismatches —
  A = CAPS[4].at;
  tl.tween(cam, CAM_PA, { at: A, dur: 1.3, ease: ease.move });
  out(septU, A, 0.5);
  out(regU, A, 0.5);
  out(lookedU, A, 0.4);
  emptyLanes(A);
  tl.set(mode, 0, A + 0.4);
  tl.tween(badU, 0, { at: A + 0.4, dur: 0.3, ease: ease.move });
  fillLanes([0, 1, 2, 3, 4], A + 0.45, 0.5, 0.05);
  setOps([0.15, 0.15, 0.15, 0.15, 0.15], A + 0.6);
  enter(panelAU, A + 0.9);
  tl.tween(countA, 1, { at: A + 1.6, dur: 2.6, ease: ease.move });
  pop(mismAU, A + 4.4);
  tl.tween(barU, 1, { at: A + 6.4, dur: 1.2, ease: ease.draw });
  enter(legendAU, A + 7.6);

  // — B5 · 1,193,491 native outputs, zero disagreements —
  A = CAPS[5].at;
  tl.tween(cam, CAM_PB, { at: A, dur: 1.3, ease: ease.move });
  tl.tween(panelADim, 0.15, { at: A, dur: 0.6, ease: ease.move });
  enter(panelBU, A + 0.7);
  tl.tween(countB, 1, { at: A + 1.2, dur: 2.6, ease: ease.move });
  pop(mismBU, A + 4.0);
  enter(noteBU, A + 7.0);

  // — B6 · scope —
  A = CAPS[6].at;
  tl.tween(cam, CAM_SCOPE, { at: A, dur: 1.3, ease: ease.move });
  tl.tween(panelADim, 1, { at: A, dur: 0.6, ease: ease.move });
  [1.4, 2.8, 4.2, 5.6].forEach((dt, i) => pop(scopeU[i], A + dt));
  pop(proofU, A + 8.8);

  // — B7 · precision drift is a separate question —
  A = CAPS[7].at;
  tl.tween(cam, CAM_DRIFT, { at: A, dur: 1.3, ease: ease.move });
  out(panelsOp, A);
  setOps([0.15, 0.15, 1, 0.15, 1], A + 0.2);
  tl.tween(driftU, 1, { at: A + 1.6, dur: 1.2, ease: ease.draw });
  enter(driftLblU, A + 3.6);

  // — B8 · six of 4,097 widths —
  A = CAPS[8].at;
  tl.tween(cam, CAM_RULER, { at: A, dur: 1.3, ease: ease.move });
  setOps([0.15, 0.15, 0.15, 0.15, 0.15], A);
  tl.tween(driftOp, 0.15, { at: A, dur: 0.6, ease: ease.move });
  tl.tween(rulerU, 1, { at: A + 0.6, dur: 1.5, ease: ease.draw });
  notchU.forEach((ch, k) => pop(ch, A + 3.8 + k * 0.75));
  enter(pairsU, A + 10.6, 0.8);

  // — B9 · at 512: 2 × 220 px natively, 1 × 464 px in FP32 —
  A = CAPS[9].at;
  tl.tween(cam, CAM_512, { at: A, dur: 1.4, ease: ease.move });
  tl.tween(notchDim, 1, { at: A, dur: 0.6, ease: ease.move });
  enter(layoutU, A + 1.0, 0.8);
  pop(gapU, A + 3.2);
  enter(note1732U, A + 7.0);

  // — B10 · (100000000 + 1) - 100000000 —
  A = CAPS[10].at;
  tl.tween(cam, CAM_CARD, { at: A, dur: 1.3, ease: ease.move });
  tl.tween(rulerOp, 0.15, { at: A, dur: 0.6, ease: ease.move });
  enter(cardU, A + 0.8);
  pop(rowFU, A + 4.0);
  pop(rowNU, A + 8.2);

  // — B11 · the regression: the native check catches what the circuit lanes can't —
  A = CAPS[11].at;
  tl.tween(cam, CAM_END, { at: A, dur: 1.5, ease: ease.move });
  out(rulerOp, A);
  out(cardU, A);
  out(driftOp, A);
  out(layoutU, A);
  setOps([1, 1, 1, 1, 1], A + 0.2);
  emptyLanes(A);
  tl.set(mode, 2, A + 0.4);
  enter(testU, A + 0.8);
  fillLanes([0, 1, 2], A + 1.4, 0.9, 0.2);
  fillLanes([3], A + 2.8, 0.9);
  fillLanes([4], A + 3.8, 0.9);
  pop(badU, A + 5.4);
  pop(caughtU, A + 6.6);
  tl.tween(glow1U, 1, { at: A + 8.6, dur: 0.6, ease: ease.enter });
  tl.hold(CAPS[11].at + CAPS[11].dur + CAP_HOLD, 2.0);

  return {
    tl, cam, mode, tokenU, fanU, laneIn, laneOp, fill, tagU, br1U, br2U, badU, lookedU, caughtU, glow1U,
    septU, regU, panelAU, countA, barU, mismAU, legendAU, panelBU, countB, mismBU, noteBU, panelsOp, panelADim,
    scopeU, proofU, driftU, driftLblU, driftOp, rulerU, notchU, pairsU, notchDim, rulerOp, layoutU, gapU,
    note1732U, cardU, rowFU, rowNU, testU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;
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

function CodeCard({ x, y, lines, title, stripe, opacity = 1, fs = 14 }: {
  x: number; y: number; lines: string[]; title: string; stripe: string; opacity?: number; fs?: number;
}) {
  if (opacity <= 0.005) return null;
  const adv = fs === 14 ? CH14 : CH13;
  const lh = fs + 6;
  const w = Math.max(title.length * 7.4, ...lines.map((l) => l.length * adv)) + 30;
  const h = lines.length * lh + 40;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      <text x={x + 16} y={y + 22} fill={stripe} fontSize={13} fontFamily={UI}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 44 + i * lh} fill={colors.TEXT} fontSize={fs} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
    </g>
  );
}

function Check({ x, y, s = 1, color = colors.POSITIVE }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <path d={`M ${x - 6 * s} ${y} L ${x - 1.5 * s} ${y + 4.5 * s} L ${x + 7 * s} ${y - 5.5 * s}`} stroke={color} strokeWidth={2.6}
      fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const mode = Math.max(0, Math.min(2, Math.round(s.get(scene.mode))));
  const g = (ch: ChannelRef<number>) => s.get(ch);

  const tokenU = g(scene.tokenU);
  const fanU = g(scene.fanU);
  const laneIn = scene.laneIn.map(g);
  const laneOp = scene.laneOp.map(g);
  const fill = scene.fill.map(g);
  const tagU = scene.tagU.map(g);
  const outOp = fill.map((v) => clamp01((v - 0.85) / 0.15));
  const groupDone = [Math.min(outOp[0], outOp[1], outOp[2]), Math.min(outOp[3], outOp[4])];
  const br = [g(scene.br1U), g(scene.br2U)];
  const badU = g(scene.badU);
  const lookedU = g(scene.lookedU);
  const caughtU = g(scene.caughtU);
  const glow1U = g(scene.glow1U);

  const panelsOp = g(scene.panelsOp);
  const panelA = g(scene.panelAU) * panelsOp * g(scene.panelADim);
  const panelB = g(scene.panelBU) * panelsOp;
  const countA = g(scene.countA);
  const countB = g(scene.countB);
  const barU = g(scene.barU);
  const scopeU = scene.scopeU.map(g);
  const proofU = g(scene.proofU) * panelsOp;

  const driftOp = g(scene.driftOp);
  const driftU = g(scene.driftU) * driftOp;
  const driftLblU = g(scene.driftLblU) * driftOp;
  const rulerOp = g(scene.rulerOp);
  const rulerU = g(scene.rulerU);
  const notchU = scene.notchU.map(g);
  const pairsU = g(scene.pairsU);
  const notchDim = g(scene.notchDim);
  const layoutU = g(scene.layoutU);
  const gapU = g(scene.gapU) * layoutU;
  const note1732U = g(scene.note1732U) * layoutU;
  const cardU = g(scene.cardU);
  const testU = g(scene.testU);

  const tokenText = TOKEN_TEXT[mode];
  const tokenW = tokenText.length * CH14 + 28;
  const tokenX1 = TOKEN_CX + tokenW / 2;
  const tokenSlide = lerp(-160, 0, tokenU);

  // anything a camera move carries off the stage (or up under the title band) fades out before it is cut
  const fit = (x0: number, y0: number, x1: number, y1: number): number => {
    const sx = (x: number) => (x - cam.x) * cam.k + STAGE_W / 2;
    const sy = (y: number) => (y - cam.y) * cam.k + STAGE_H / 2;
    const r = 6;
    return clamp01(sx(x0) / r) * clamp01((STAGE_W - sx(x1)) / r) * clamp01((sy(y0) - HEADER_H) / r) * clamp01((630 - sy(y1)) / r);
  };

  const tokenFit = fit(TOKEN_CX - tokenW / 2 + tokenSlide, TOKEN_Y - 46, TOKEN_CX + tokenW / 2 + tokenSlide, TOKEN_Y + 18);
  const laneFit = LANE_Y.map((y) => fit(TRACK_X0, y - 19, OUT_X + OUT_W, y + 19));

  const verdict = (gi: 0 | 1): { l1: string; l2: string; c2: string } => {
    if (mode === 0) return { l1: 'must agree', l2: 'agree', c2: colors.POSITIVE };
    if (mode === 1) return gi === 0 ? { l1: 'agree', l2: 'looked verified', c2: colors.WARM } : { l1: '4 ≠ 3', l2: 'native disagrees', c2: colors.NEGATIVE };
    return gi === 0 ? { l1: 'mismatches: [ ]', l2: 'still agree', c2: colors.POSITIVE } : { l1: 'sourceSemantics.', l2: 'mismatchCount = 3', c2: colors.NEGATIVE };
  };

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the trial token and its fan-out ======================== */}
        <g opacity={tokenU * tokenFit} transform={`translate(${tokenSlide} 0)`}>
          <text x={TOKEN_CX} y={TOKEN_Y - 30} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
            {mode === 2 ? 'the regression test' : 'one sampled trial'}
          </text>
          <rect x={TOKEN_CX - tokenW / 2} y={TOKEN_Y - 17} width={tokenW} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
          <text x={TOKEN_CX} y={TOKEN_Y + 5} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
            {tokenText}
          </text>
        </g>
        {fanU > 0.01 &&
          LANE_Y.map((y, i) => {
            const x0 = tokenX1 + 4;
            const d = `M ${x0} ${TOKEN_Y} C ${x0 + 30} ${TOKEN_Y} ${TRACK_X0 - 30} ${y} ${TRACK_X0} ${y}`;
            return (
              <path key={i} d={d} fill="none" stroke={colors.WARM} strokeWidth={1.4} pathLength={1} strokeDasharray={`${fanU} 1`}
                opacity={0.6 * Math.max(0.25, laneOp[i]) * tokenFit * laneFit[i]} />
            );
          })}

        {/* ======================== the five lanes ======================== */}
        <text x={OUT_X + OUT_W / 2} y={LANE_Y[0] - 30} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}
          opacity={Math.max(...outOp) * Math.max(...laneOp.map((v, i) => v * laneIn[i])) * fit(OUT_X, LANE_Y[0] - 44, OUT_X + OUT_W, LANE_Y[0] - 26)}>
          {OUT_HEAD[mode]}
        </text>
        {LANES.map((lane, i) => {
          const y = LANE_Y[i];
          const op = laneIn[i] * laneOp[i] * laneFit[i];
          if (op <= 0.005) return null;
          const col = GROUP_COLOR[lane.group];
          const dx = lerp(-40, 0, laneIn[i]);
          const bad = mode === 2 && i === 3;
          const outCol = bad ? colors.NEGATIVE : mode === 1 && i === 4 ? colors.POSITIVE : colors.TEXT;
          return (
            <g key={i} opacity={op} transform={`translate(${dx} 0)`}>
              <rect x={TRACK_X0} y={y - TRACK_H / 2} width={TRACK_X1 - TRACK_X0} height={TRACK_H} rx={8} fill={colors.PANEL} stroke={col} strokeOpacity={0.55} />
              {fill[i] > 0.001 && (
                <>
                  <rect x={TRACK_X0} y={y - TRACK_H / 2} width={(TRACK_X1 - TRACK_X0) * fill[i]} height={TRACK_H} rx={8} fill={col} opacity={0.2} />
                  <line x1={TRACK_X0 + (TRACK_X1 - TRACK_X0) * fill[i]} y1={y - TRACK_H / 2 + 3} x2={TRACK_X0 + (TRACK_X1 - TRACK_X0) * fill[i]}
                    y2={y + TRACK_H / 2 - 3} stroke={col} strokeWidth={2} opacity={1 - outOp[i]} />
                </>
              )}
              <text x={TRACK_X0 + 16} y={y + 5} fill={col} fontSize={14} fontFamily={MONO} fontWeight={700}>
                {i + 1}
              </text>
              <text x={TRACK_X0 + 38} y={y + 5} fill={colors.TEXT} fontSize={15} fontFamily={UI}>
                {lane.name}
              </text>
              {lane.tag && <Chip x={TRACK_X1 - 12} y={y + 5} text={lane.tag} color={col} anchor="end" opacity={tagU[i]} />}
              {/* the output */}
              <g opacity={outOp[i]}>
                <rect x={OUT_X} y={y - 15} width={OUT_W} height={30} rx={6} fill={colors.PANEL} stroke={bad ? colors.NEGATIVE : colors.GRID} />
                <text x={OUT_X + OUT_W / 2} y={y + 5} textAnchor="middle" fill={outCol} fontSize={14} fontFamily={MONO}>
                  {OUTS[mode][i]}
                </text>
              </g>
            </g>
          );
        })}

        {/* ======================== verdict brackets ======================== */}
        {([0, 1] as const).map((gi) => {
          const u = br[gi];
          if (u <= 0.01) return null;
          const y0 = (gi === 0 ? LANE_Y[0] : LANE_Y[3]) - 16;
          const y1 = (gi === 0 ? LANE_Y[2] : LANE_Y[4]) + 16;
          const mid = (y0 + y1) / 2;
          const idx = gi === 0 ? [0, 1, 2] : [3, 4];
          const focus = Math.max(...idx.map((i) => laneOp[i]));
          const red = gi === 1 ? badU : 0;
          const v = verdict(gi);
          const textOp = groupDone[gi];
          const col = GROUP_COLOR[gi];
          const path = `M ${BR_X - 8} ${y0} H ${BR_X} V ${y1} H ${BR_X - 8}`;
          const line2Op = mode === 1 && gi === 0 ? lookedU : mode >= 1 && gi === 1 ? red : 1;
          return (
            <g key={gi} opacity={Math.max(0.15, focus) * fit(BR_X - 8, y0, VERD_X + 150, y1)}>
              <path d={path} fill="none" stroke={col} strokeWidth={2} pathLength={1} strokeDasharray={`${u} 1`} opacity={1 - red} />
              {red > 0.01 && <path d={path} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.4} opacity={red} />}
              {gi === 0 && glow1U > 0.01 && <path d={path} fill="none" stroke={colors.POSITIVE} strokeWidth={5} opacity={0.35 * glow1U} />}
              <g opacity={u * textOp}>
                {mode >= 1 && gi === 1 ? (
                  <>
                    <text x={VERD_X} y={mid - 4} fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={1 - red}>
                      must agree
                    </text>
                    <text x={VERD_X} y={mid - 4} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO} opacity={red}>
                      {v.l1}
                    </text>
                    <text x={VERD_X} y={mid + 16} fill={v.c2} fontSize={14} fontFamily={MONO} opacity={red}>
                      {v.l2}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={VERD_X} y={mid - 4} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                      {v.l1}
                    </text>
                    <g opacity={line2Op}>
                      <Check x={VERD_X + 7} y={mid + 11} color={v.c2} />
                      <text x={VERD_X + 22} y={mid + 16} fill={v.c2} fontSize={14} fontFamily={UI}>
                        {v.l2}
                      </text>
                    </g>
                  </>
                )}
              </g>
            </g>
          );
        })}
        <Chip x={BR_X + 8} y={LANE_Y[4] + 50} text="caught" color={colors.POSITIVE} fs={15} opacity={caughtU * (mode === 2 ? 1 : 0) * fit(BR_X, LANE_Y[4] + 30, BR_X + 90, LANE_Y[4] + 58)} />

        {/* ======================== B3 · the September card ======================== */}
        <CodeCard x={60} y={410} lines={CODE_SEPT} title="September 2026 review · native JS returns 3 at x = 2; the compiled version returns 4"
          stripe={colors.WARM} opacity={g(scene.septU) * fit(60, 410, 700, 540)} />
        <Chip x={84} y={588} text="those cases now have regression tests" color={colors.POSITIVE} opacity={g(scene.regU) * g(scene.septU) * fit(84, 570, 400, 596)} />

        {/* ======================== B4–B6 · counters ======================== */}
        {panelA > 0.005 && (
          <g opacity={panelA * fit(PANEL_A.x, PANEL_A.y, PANEL_A.x + PANEL_A.w, PANEL_A.y + PANEL_A.h)}>
            <rect x={PANEL_A.x} y={PANEL_A.y} width={PANEL_A.w} height={PANEL_A.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.6} />
            <text x={PANEL_A.x + 20} y={PANEL_A.y + 28} fill={colors.ACCENT} fontSize={14} fontFamily={UI}>
              circuit outputs checked · lanes 1–3
            </text>
            <text x={PANEL_A.x + 20} y={PANEL_A.y + 70} fill={colors.TEXT} fontSize={32} fontFamily={MONO}>
              {comma(OUT_CIRCUIT * countA)}
            </text>
            <g opacity={g(scene.mismAU)}>
              <text x={PANEL_A.x + PANEL_A.w - 20} y={PANEL_A.y + 66} textAnchor="end" fill={colors.POSITIVE} fontSize={17} fontFamily={MONO}>
                circuit mismatches: 0
              </text>
            </g>
            {barU > 0.01 &&
              (() => {
                const bx = PANEL_A.x + 20;
                const bw = (PANEL_A.w - 40) * barU;
                const parts = [OUT_ALL3, OUT_CONST, OUT_ABSENT];
                const cols = [colors.ACCENT, colors.SECONDARY, colors.MUTED];
                const widths = parts.map((p) => Math.max(4, (p / OUT_CIRCUIT) * bw));
                const scale = bw / widths.reduce((a, b) => a + b, 0);
                let x = bx;
                return parts.map((_, k) => {
                  const w = widths[k] * scale;
                  const r = <rect key={k} x={x} y={PANEL_A.y + 88} width={Math.max(0, w - 1)} height={14} fill={cols[k]} opacity={0.85} />;
                  x += w;
                  return r;
                });
              })()}
            <g opacity={g(scene.legendAU)}>
              <text x={PANEL_A.x + 20} y={PANEL_A.y + 124} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                {`${comma(OUT_CIRCUIT)} = ${comma(OUT_ALL3)} + ${comma(OUT_CONST)} + ${comma(OUT_ABSENT)}`}
              </text>
              {[
                { t: 'all three comparisons', c: colors.ACCENT },
                { t: 'constant', c: colors.SECONDARY },
                { t: 'absent optional', c: colors.MUTED },
              ].map((it, k) => {
                const x = PANEL_A.x + 20 + [0, 196, 304][k];
                return (
                  <g key={k}>
                    <rect x={x} y={PANEL_A.y + 135} width={10} height={10} fill={it.c} />
                    <text x={x + 16} y={PANEL_A.y + 145} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      {it.t}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        )}
        {panelB > 0.005 && (
          <g opacity={panelB * fit(PANEL_B.x, PANEL_B.y, PANEL_B.x + PANEL_B.w, PANEL_B.y + PANEL_B.h)}>
            <rect x={PANEL_B.x} y={PANEL_B.y} width={PANEL_B.w} height={PANEL_B.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeOpacity={0.6} />
            <text x={PANEL_B.x + 20} y={PANEL_B.y + 28} fill={colors.SECONDARY} fontSize={14} fontFamily={UI}>
              float64 outputs checked natively · lanes 4–5
            </text>
            <text x={PANEL_B.x + 20} y={PANEL_B.y + 70} fill={colors.TEXT} fontSize={32} fontFamily={MONO}>
              {comma(OUT_NATIVE * countB)}
            </text>
            <g opacity={g(scene.mismBU)}>
              <text x={PANEL_B.x + PANEL_B.w - 20} y={PANEL_B.y + 66} textAnchor="end" fill={colors.POSITIVE} fontSize={17} fontFamily={MONO}>
                disagreements: 0
              </text>
            </g>
            <g opacity={g(scene.noteBU)}>
              <text x={PANEL_B.x + 20} y={PANEL_B.y + 112} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                {`${comma(OUT_NATIVE - OUT_CIRCUIT)} more than the circuit count:`}
              </text>
              <text x={PANEL_B.x + 20} y={PANEL_B.y + 134} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                it includes object fields the program left unchanged
              </text>
            </g>
          </g>
        )}
        {/* scope tags */}
        {(() => {
          const widths = TAGS.map((t) => (t.startsWith('seed') ? t.length * CH13 : t.length * 13 * 0.56) + 20);
          const proofW = 'not a proof'.length * 15 * 0.56 + 20;
          const total = widths.reduce((a, b) => a + b, 0) + proofW + 14 * TAGS.length;
          let x = 640 - total / 2;
          return (
            <g opacity={panelsOp * fit(640 - total / 2, TAG_Y - 18, 640 + total / 2, TAG_Y + 8)}>
              {TAGS.map((t, k) => {
                const x0 = x;
                x += widths[k] + 14;
                return <Chip key={k} x={x0} y={TAG_Y} text={t} color={colors.TEXT} mono={t.startsWith('seed')} opacity={scopeU[k]} />;
              })}
              <Chip x={x} y={TAG_Y + 1} text="not a proof" color={colors.WARM} fs={15} opacity={proofU} />
            </g>
          );
        })()}

        {/* ======================== B7 · the drift link between lanes 3 and 5 ======================== */}
        {driftU > 0.01 && (
          <g>
            <path d={`M ${OUT_X - 4} ${LANE_Y[2]} C ${OUT_X - 40} ${LANE_Y[2]} ${OUT_X - 40} ${LANE_Y[4]} ${OUT_X - 4} ${LANE_Y[4]}`} fill="none"
              stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 4" pathLength={1} opacity={driftU} />
            <g opacity={driftLblU * fit(OUT_X - 334, LANE_Y[3] - 22, OUT_X - 34, LANE_Y[3] + 22)}>
              <rect x={OUT_X - 334} y={LANE_Y[3] - 22} width={300} height={44} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={OUT_X - 184} y={LANE_Y[3] - 4} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={UI}>
                FP32 vs native: allowed to differ
              </text>
              <text x={OUT_X - 184} y={LANE_Y[3] + 14} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                drift is listed, not called a compiler error
              </text>
            </g>
          </g>
        )}

        {/* ======================== B8 · the 4,097-notch ruler ======================== */}
        {rulerU > 0.01 && (
          <g opacity={rulerOp}>
            <defs>
              <clipPath id="tc3-ruler-clip">
                <rect x={60} y={RULER_Y - 20} width={20 + 1120 * rulerU + 4} height={40} />
              </clipPath>
            </defs>
            <text x={80} y={RULER_Y - 58} fill={colors.MUTED} fontSize={14} fontFamily={UI} opacity={rulerU * fit(80, RULER_Y - 72, 440, RULER_Y - 54)}>
              column calculation · every integer width 0 … 4096
            </text>
            <text x={1200} y={RULER_Y - 58} textAnchor="end" fill={colors.WARM} fontSize={15} fontFamily={MONO} opacity={notchU[5] * fit(1040, RULER_Y - 72, 1200, RULER_Y - 54)}>
              {`${DIFFS.length} of 4,097 differ`}
            </text>
            <path d={RULER_PATH} stroke={colors.MUTED} strokeWidth={0.6} opacity={0.55} clipPath="url(#tc3-ruler-clip)" />
            <text x={80} y={RULER_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={rulerU * fit(70, RULER_Y + 14, 90, RULER_Y + 32)}>
              0
            </text>
            <text x={RX(4096)} y={RULER_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={rulerU * fit(RX(4096) - 20, RULER_Y + 14, RX(4096) + 20, RULER_Y + 32)}>
              4096
            </text>
            {DIFFS.map((d, k) => {
              const u = notchU[k];
              if (u <= 0.01) return null;
              const x = RX(d.w);
              const op = (k === 0 ? 1 : 1 - 0.85 * notchDim) * fit(x - 20, RULER_Y - 46, x + 24, RULER_Y + 46);
              return (
                <g key={d.w} opacity={op}>
                  <line x1={x} y1={RULER_Y - 22 * u} x2={x} y2={RULER_Y + 22 * u} stroke={colors.WARM} strokeWidth={2.5} />
                  <text x={x} y={RULER_Y - 30} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={u}>
                    {d.w}
                  </text>
                  <text x={x} y={RULER_Y + 42} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={pairsU}>
                    {`${d.nat.cols} → ${d.f32.cols}`}
                  </text>
                </g>
              );
            })}
            <text x={1200} y={RULER_Y + 66} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={pairsU * (1 - notchDim) * fit(920, RULER_Y + 52, 1200, RULER_Y + 70)}>
              columns: native JS → FP32 (one fewer)
            </text>
          </g>
        )}

        {/* ======================== B9 · the two layouts at width 512 ======================== */}
        {layoutU > 0.01 && (
          <g opacity={layoutU * (rulerOp < 1 ? Math.max(0.15, rulerOp) : 1) * fit(NAT_X, LAYOUT_Y - 24, F32_X + 290, LAYOUT_Y + 100)}>
            <path d={`M ${RX(512)} ${RULER_Y + 50} L ${RX(512)} ${LAYOUT_Y - 30}`} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="3 3" />
            {[
              { x: NAT_X, d: D512.nat, label: `native JS · ${D512.nat.cols} columns × ${fmtBox(D512.nat.box)} px`, col: colors.SECONDARY },
              { x: F32_X, d: D512.f32, label: `FP32 · ${D512.f32.cols} column × ${fmtBox(D512.f32.box)} px`, col: colors.ACCENT },
            ].map((L, k) => {
              const cw = 512 * LAYOUT_S;
              return (
                <g key={k}>
                  <text x={L.x} y={LAYOUT_Y - 10} fill={L.col} fontSize={13} fontFamily={MONO}>
                    {L.label}
                  </text>
                  <rect x={L.x} y={LAYOUT_Y} width={cw} height={60} rx={4} fill="none" stroke={colors.GRID} />
                  {Array.from({ length: L.d.cols }, (_, c) => (
                    <rect key={c} x={L.x + (GAP + c * (L.d.box + GAP)) * LAYOUT_S} y={LAYOUT_Y + 8} width={L.d.box * LAYOUT_S} height={44} rx={3}
                      fill={L.col} opacity={0.35} stroke={L.col} />
                  ))}
                </g>
              );
            })}
            <g opacity={gapU}>
              <path d={`M ${F32_X + (GAP + D512.nat.box) * LAYOUT_S} ${LAYOUT_Y + 70} v 6 H ${F32_X + (GAP + D512.f32.box) * LAYOUT_S} v -6`} fill="none"
                stroke={colors.WARM} strokeWidth={1.6} />
              <text x={F32_X + 10} y={LAYOUT_Y + 96} fill={colors.WARM} fontSize={15} fontFamily={MONO}>
                {`${fmtBox(D512.f32.box)} − ${fmtBox(D512.nat.box)} = ${GAP_512} px ≈ 240`}
              </text>
            </g>
            <text x={NAT_X} y={LAYOUT_Y + 96} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={note1732U}>
              {`at ${W_TRIAL}: ${fmtBox(T_F32.box)} vs ${fmtBox(T_NAT.box)} px, ≈ ${GAP_1732}`}
            </text>
          </g>
        )}

        {/* ======================== B10 · the smaller case ======================== */}
        {cardU > 0.01 && (
          <g opacity={cardU * fit(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h)}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
            <text x={CARD.x + 20} y={CARD.y + 30} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
              (100000000 + 1) - 100000000
            </text>
            <g opacity={g(scene.rowFU)}>
              <text x={CARD.x + 20} y={CARD.y + 62} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
                {`FP32    fround(100000001) = ${F32_SUM}`}
              </text>
              <text x={CARD.x + CARD.w - 20} y={CARD.y + 62} textAnchor="end" fill={colors.ACCENT} fontSize={16} fontFamily={MONO} fontWeight={700}>
                {`→ ${F32_DIFF}`}
              </text>
            </g>
            <g opacity={g(scene.rowNU)}>
              <text x={CARD.x + 20} y={CARD.y + 92} fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
                native  100000001 − 100000000
              </text>
              <text x={CARD.x + CARD.w - 20} y={CARD.y + 92} textAnchor="end" fill={colors.SECONDARY} fontSize={16} fontFamily={MONO} fontWeight={700}>
                {`→ ${NAT_DIFF}`}
              </text>
            </g>
          </g>
        )}

        {/* ======================== B11 · the regression test ======================== */}
        <CodeCard x={60} y={418} lines={CODE_TEST} title="compile.test.ts:387" stripe={colors.NEGATIVE} opacity={testU * fit(60, 418, 560, 520)} fs={13} />
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={42} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Five Calculations
      </text>
    </>
  );
}

export const vizScene = () => scene;
