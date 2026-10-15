// Both Branches Run
//
// Handwired — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   README.md:3 (the pitch), 10-11 (the ternary), 14, 18-21 (the arithmetic: above4 and the pick), 24
//   docs/README.md:3 (no converter; builder code), 15 (the four operations)
//   docs/tutorial.md:13 (nothing branches or loops at runtime), 74 (builder code, circuit.reglu([], 1, terms, bias))
//   template/toggle.ts:50-51 (the `not` line)
//   docs/execution-model.md:21-28 (the four operations), 40 (layers)
//   src/handwiredos/README.md:3, 13 (scale numbers, label only)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The layer stack and the ledger rows are SCHEMATIC (labelled on screen);
// the skyline's 130 columns are one per layer with schematic heights. Every other number is the README's
// own arithmetic, computed below.
import type { ReactNode } from 'react';
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { FunctionPlot, MatrixGrid, Vec } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH14 = 8.4; // mono advance at 14 px
const CH13 = 7.8; // mono advance at 13 px
const FAINT = 'rgba(148, 163, 184, 0.12)';

// ---------------------------------------------------------------------------
// The README's arithmetic (README.md:18-21), exact
// ---------------------------------------------------------------------------

const relu = (x: number): number => Math.max(0, x);
const RAMP_A = (a: number): number => relu(a - 4);
const RAMP_B = (a: number): number => relu(a - 5);
const ABOVE4 = (a: number): number => RAMP_A(a) - RAMP_B(a);
const RESULT = (a: number): number => ABOVE4(a) * 10 + (1 - ABOVE4(a)) * 12;
const A_INTS = Array.from({ length: 10 }, (_, i) => i);
const ANSWERS = A_INTS.map(RESULT); // 12 12 12 12 12 10 10 10 10 10
for (const a of A_INTS) {
  // the README example assumes integer a: the bit is exact there
  if (ABOVE4(a) !== (a > 4 ? 1 : 0) || RESULT(a) !== (a > 4 ? 10 : 12)) throw new Error('above4 mismatch');
}

/** the input as the labels show it: one decimal, so every displayed product reconciles */
const quant = (a: number): number => Math.round(a * 10) / 10;
const fmt = (v: number): string => (Math.abs(v - Math.round(v)) < 0.02 ? String(Math.round(v)) : v.toFixed(1));
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const X = scaleLinear([0, 9], [150, 690]);
const PLOT_TOP = 130;
const PLOT_BOT = 420;
const DOM_RAMP: [number, number] = [-0.3, 5.3];
const DOM_STEP: [number, number] = [-0.15, 1.35];
const yScale = (u: number) =>
  scaleLinear([lerp(DOM_RAMP[0], DOM_STEP[0], u), lerp(DOM_RAMP[1], DOM_STEP[1], u)], [PLOT_BOT, PLOT_TOP]);
const STRIP_Y = 442;

// pick machine (right)
const M = { disc: 790, tile: 920, prod: 1040, res: 1170, r1: 235, r2: 375, resY: 305 };

// intro composition and its emblem spot (top-left, beside the header chips)
const INTRO_C = { x: 640, y: 330 };
const INTRO_E = { x: 470, y: 95 };
const INTRO_GRID = Array.from({ length: 5 }, (_, i) => {
  const rand = mulberry32(17 + i * 31);
  return Array.from({ length: 5 }, () => (rand() < 0.3 ? 1 : 0));
});

// B7/B8 layout
const C1A = ['const a = 5', 'const result = (a > 4) ? 10 : 12'];
const C1B = [
  'const above4 = Math.max(0, a - 4) - Math.max(0, a - 5)',
  '// Both branches compute, and above4 picks one',
  'const result = above4 * 10 + (1 - above4) * 12',
];
const C1D = ['// JS: !bit', 'const not = (bit: Wire) => circuit.affine([[bit, -1]], 1)'];
const chipW = (lines: string[]) => Math.max(...lines.map((l) => l.length)) * CH14 + 30;
const LEDGER = { x: 905, y: 140, w: 325 };
const FLIP_Y = 378; // beside the appended ledger row
const LEDGER_ROWS: Array<{ name: string; expr: string; relu: boolean }> = [
  { name: 'reglu', expr: 'max(0, a − 4)', relu: true },
  { name: 'reglu', expr: 'max(0, a − 5)', relu: true },
  { name: 'affine', expr: 'first − second', relu: false },
  { name: 'affine', expr: 'bit·10 + (1 − bit)·12', relu: false },
  { name: 'affine', expr: 'not: bit × (−1) + 1', relu: false },
];

// B9 cards
const CARD = { w: 270, h: 180, y: 200, xs: [190, 490, 790, 1090] };
const CARDS = [
  { title: 'weighted sum', fn: 'circuit.affine', tex: '\\sum_i w_i x_i + b', size: 24 },
  { title: 'gated relu', fn: 'circuit.reglu', tex: '\\mathrm{left}\\cdot\\max(0,\\mathrm{gate})', size: 20 },
  { title: 'rounded score', fn: 'circuit.boolean', tex: '\\mathrm{score}\\mapsto\\{0,1\\}', size: 22 },
  { title: 'table read', fn: 'circuit.indexRead', tex: '\\mathrm{values}[\\lfloor \\mathrm{index}\\rfloor]', size: 22 },
];
const FAN_FROM = { x: 1067, y: 260 };

// B10/B11 stack — schematic of the README example: 4 layers of sparse 6×6 tiles
const LAYER_LIT: Array<Array<[number, number]>> = [
  [[1, 1], [4, 3]], // layer 1: the two relu gates, both reading only the input
  [[2, 2], [2, 4]], // the difference
  [[1, 4], [3, 1], [4, 4]], // the pick
  [[3, 3], [0, 2]], // the sum
];
const LAYER_VALUES = LAYER_LIT.map((lit) =>
  Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (lit.some(([a, b]) => a === i && b === j) ? 1 : 0))),
);
const LAYER_DESC = ['two relu gates', 'the difference', 'the pick', 'the sum'];
const POSES = [
  { cx: 640, cy: 290, s: 1 },
  { cx: 250, cy: 280, s: 0.5 },
  { cx: 640, cy: 245, s: 0.8 },
];
const poseAt = (p: number) => {
  const a = p <= 1 ? POSES[0] : POSES[1];
  const b = p <= 1 ? POSES[1] : POSES[2];
  const u = p <= 1 ? clamp01(p) : clamp01(p - 1);
  return { cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), s: lerp(a.s, b.s, u) };
};
const TILE = 117; // 6 cells × 17 + 5 gaps × 3
const PITCH = 180;

// the skyline: one column per layer of the desktop demo's program (130), heights schematic
const SKY = (() => {
  const rand = mulberry32(4646);
  return Array.from({ length: 130 }, (_, j) => ({ x: 60 + j * (1160 / 130), h: 24 + 126 * rand() * rand() + 10 * rand() }));
})();
const SKY_BASE = 545;
const COUNTERS = [
  { n: 130, label: 'layers' },
  { n: 4646, label: 'live operations' },
  { n: 9909, label: 'weights' },
];

// B11: the loop arrow tries to wrap from layer 4 back to layer 1 and hits the boundary
const BOUND = { x: 350, y: 120, w: 580, h: 235 };
const LOOP_PTS = (() => {
  const p0 = [870, 196], p1 = [900, 40], p2 = [390, 40], p3 = [410, 196];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 240; i++) {
    const t = i / 240, m = 1 - t;
    pts.push([
      m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
      m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return pts;
})();
const LOOP_HIT = LOOP_PTS.findIndex(([, y]) => y <= BOUND.y + 3);

// header chips
const PIN = 'handwired@4ea7fcb';
const SOURCES = [
  'README.md:18 · docs/README.md:3',
  'README.md:10-11',
  'README.md:19-21',
  'README.md:19',
  'README.md:18-19',
  'README.md:20-21',
  'README.md:10, 21',
  'README.md:18, 21',
  'docs/README.md:3',
  'template/toggle.ts:50-51 · docs/tutorial.md:74',
  'docs/README.md:15 · docs/execution-model.md:21-28',
  'docs/execution-model.md:40',
  'src/handwiredos/README.md:13',
  'docs/tutorial.md:13',
];
const SOURCE_AT = [0, 7.9, 15.2, 17.8, 28.0, 37.1, 45.1, 54.2, 63.7, 72.8, 80.4, 92.1, 99.5, 103.1];

const HOME: CameraState = CAMERA_HOME;
const CAM_INTRO: CameraState = { x: 640, y: 340, k: 1.15 };
const CAM_RELU: CameraState = { x: 760, y: 330, k: 1.35 };
const CAM_MACHINE: CameraState = { x: 960, y: 300, k: 1.3 };
const CAM_CODE: CameraState = { x: 785, y: 372, k: 1.4 };
const CAM_STACK: CameraState = { x: 640, y: 300, k: 1.12 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — fifteen fixed captions, ≈114 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_INTRO, cameraInterp);
  const src = tl.channel('src', 0);
  const lens = tl.channel('lens', { x: X(5), y: 404, r: 16 });
  const lensOp = tl.channel('lensOp', 0);

  // B0 intro
  const gridU = tl.channel('introGridU', 0);
  const reluDraw = tl.channel('introReluDraw', 0);
  const introLabels = tl.channel('introLabels', 0);
  const texRelu = tl.channel('texRelu', 0);
  const ifU = tl.channel('ifElseU', 0);
  const shrinkU = tl.channel('introShrink', 0);
  const introOp = tl.channel('introOp', 1);
  // B1–B6 the a-axis and the pick machine
  const c1aU = tl.channel('c1aU', 0);
  const c1bU = tl.channel('c1bU', 0);
  const codeOp = tl.channel('codeOp', 1);
  const axisU = tl.channel('axisU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const stripU = tl.channel('stripU', 0);
  const stripOp = tl.channel('stripOp', 1);
  const aReveal = tl.channel('rampA', 0);
  const rideU = tl.channel('rideU', 0);
  const texA = tl.channel('texA', 0);
  const ghostU = tl.channel('ghostU', 0);
  const ghostShift = tl.channel('ghostShift', 0);
  const bSolid = tl.channel('rampB', 0);
  const texB = tl.channel('texB', 0);
  const segU = tl.channel('segU', 0);
  const morphU = tl.channel('morphU', 0);
  const bOp = tl.channel('rampBOp', 1);
  const styleU = tl.channel('stepStyle', 0);
  const discU = tl.channel('discU', 0);
  const texD = tl.channel('texD', 0);
  const tagU = tl.channel('tagU', 0);
  const plotOp = tl.channel('plotOp', 1);
  const tilesU = tl.channel('tilesU', 0);
  const row1U = tl.channel('row1U', 0);
  const row2U = tl.channel('row2U', 0);
  const sumU = tl.channel('sumU', 0);
  const texR = tl.channel('texR', 0);
  const machOp = tl.channel('machOp', 1);
  const markerU = tl.channel('markerU', 0);
  const aVal = tl.channel('a', 5);
  const pulse2 = tl.channel('pulse2', 0);
  const readU = tl.channel('readU', 0);
  const slopeGlow = tl.channel('slopeGlow', 0);
  const blendU = tl.channel('blendU', 0);
  const noteU = tl.channel('noteU', 0);
  // B7/B8 builder code
  const c1aMove = tl.channel('c1aMove', 0);
  const convU = tl.channel('convU', 0);
  const crossU = tl.channel('crossU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const writeU = tl.channel('writeU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const row1Dim = tl.channel('b7Row1Dim', 0);
  const b7Op = tl.channel('b7Op', 1);
  const c1dU = tl.channel('c1dU', 0);
  const c1dGlow = tl.channel('c1dGlow', 0);
  const flipU = tl.channel('flipU', 0);
  const collapseU = tl.channel('ledgerCollapse', 0);
  // B9 cards
  const fanU = tl.channel('fanU', 0);
  const spotU = tl.channel('cardSpot', 0);
  const focus = tl.channel('cardFocus', 0);
  const fp32U = tl.channel('fp32Note', 0);
  // B10/B11 stack
  const dropU = tl.channel('dropU', 0);
  const stackLbl = tl.channel('stackLabels', 0);
  const gatesU = tl.channel('gatesU', 0);
  const pose = tl.channel('stackPose', 0);
  const skyU = tl.channel('skyU', 0);
  const skyOp = tl.channel('skyOp', 1);
  const countU = tl.channel('countU', 0);
  const countOp = tl.channel('countOp', 1);
  const stackOp = tl.channel('stackOp', 1);
  const boundU = tl.channel('boundU', 0);
  const loopU = tl.channel('loopU', 0);
  const loopX = tl.channel('loopCross', 0);
  const loopOp = tl.channel('loopOp', 1);
  const qU = tl.channel('questionU', 0);

  SOURCE_AT.forEach((at, i) => tl.set(src, i, at));

  // — B0 · weighted sums plus one bend —
  tl.caption({ at: 0.4, dur: 7.2, text: 'A basic neural net layer is a matrix multiply followed by one bend, called relu. Could an ordinary decision be built from nothing else?' });
  tl.tween(gridU, 1, { at: 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(cam, CAM_RELU, { at: 1.6, dur: 1.3, ease: ease.move });
  tl.tween(reluDraw, 1, { at: 2.0, dur: 1.3, ease: ease.draw });
  tl.tween(introLabels, 1, { at: 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(texRelu, 1, { at: 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_INTRO, { at: 4.5, dur: 1.2, ease: ease.move });
  tl.tween(ifU, 1, { at: 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(shrinkU, 1, { at: 6.6, dur: 1.1, ease: ease.move });
  tl.hold(7.6, 0.4);

  // — B1 · one decision, and its rewrite —
  tl.caption({ at: 8, dur: 9.5, text: "Take one decision: if the input a is greater than four, the answer is ten, otherwise twelve. The repo's front page rewrites it as arithmetic." });
  tl.tween(cam, HOME, { at: 8.0, dur: 1.2, ease: ease.move });
  tl.tween(c1aU, 1, { at: 8.2, dur: 0.7, ease: ease.enter });
  tl.tween(axisU, 1, { at: 9.0, dur: 1.4, ease: ease.draw });
  tl.tween(dotsU, 1, { at: 9.9, dur: 0.9, ease: ease.linear });
  tl.set(lens, { x: X(5), y: yScale(0)(0), r: 16 }, 10.9);
  tl.tween(lensOp, 1, { at: 11.0, dur: 0.5, ease: ease.enter });
  tl.tween(stripU, 1, { at: 11.6, dur: 0.9, ease: ease.linear });
  tl.tween(lensOp, 0, { at: 14.2, dur: 0.5, ease: ease.move });
  tl.tween(c1bU, 1, { at: 15.2, dur: 0.8, ease: ease.enter });
  tl.hold(17.5, 0.4);

  // — B2 · two ramps —
  tl.caption({ at: 17.9, dur: 9.8, text: 'Two ramps: relu of the input minus four, flat until four, and relu of the input minus five, the same ramp one step to the right.' });
  tl.tween(stripOp, 0.35, { at: 17.9, dur: 0.6, ease: ease.move });
  tl.tween(codeOp, 0.35, { at: 17.9, dur: 0.6, ease: ease.move });
  tl.tween(introOp, 0, { at: 17.9, dur: 0.6, ease: ease.move });
  tl.tween(aReveal, 1, { at: 18.3, dur: 1.4, ease: ease.draw });
  tl.tween(rideU, 1, { at: 19.4, dur: 1.0, ease: ease.move });
  tl.set(lens, { x: X(4), y: yScale(0)(0), r: 20 }, 19.5);
  tl.tween(lensOp, 1, { at: 19.6, dur: 0.5, ease: ease.enter });
  tl.tween(texA, 1, { at: 20.2, dur: 0.6, ease: ease.enter });
  tl.tween(lensOp, 0, { at: 22.0, dur: 0.5, ease: ease.move });
  tl.tween(ghostU, 1, { at: 23.0, dur: 0.4, ease: ease.enter });
  tl.tween(ghostShift, 1, { at: 23.4, dur: 1.2, ease: ease.move });
  tl.tween(bSolid, 1, { at: 24.6, dur: 0.5, ease: ease.enter });
  tl.tween(ghostU, 0, { at: 24.6, dur: 0.5, ease: ease.move });
  tl.tween(texB, 1, { at: 25.0, dur: 0.6, ease: ease.enter });
  tl.hold(27.7, 0.4);

  // — B3 · subtract: the difference is a step, the dots become bits —
  tl.caption({ at: 28.1, dur: 2.6, text: 'Subtract the second ramp from the first.' });
  tl.caption({ at: 30.7, dur: 6.1, text: 'For whole numbers, the difference is zero up to four, and exactly one from five on.' });
  tl.tween(segU, 1, { at: 28.4, dur: 1.0 + 0.12 * 4, ease: ease.linear });
  tl.tween(texA, 0, { at: 30.4, dur: 0.5, ease: ease.move });
  tl.tween(texB, 0, { at: 30.4, dur: 0.5, ease: ease.move });
  tl.tween(morphU, 1, { at: 30.6, dur: 1.4, ease: ease.move });
  tl.tween(bOp, 0.15, { at: 30.6, dur: 1.0, ease: ease.move });
  tl.tween(styleU, 1, { at: 32.1, dur: 0.5, ease: ease.enter });
  tl.tween(discU, 1, { at: 32.4, dur: 0.6, ease: ease.enter });
  tl.tween(texD, 1, { at: 32.8, dur: 0.6, ease: ease.enter });
  tl.tween(tagU, 1, { at: 33.6, dur: 0.5, ease: ease.enter });
  tl.hold(36.8, 0.4);

  // — B4 · the pick machine: both answers computed —
  tl.caption({ at: 37.2, dur: 7.6, text: 'Both answers get computed. The bit multiplies the ten, one minus the bit multiplies the twelve, and the products add.' });
  tl.tween(cam, CAM_MACHINE, { at: 37.2, dur: 1.2, ease: ease.move });
  tl.tween(plotOp, 0.35, { at: 37.2, dur: 0.8, ease: ease.move });
  tl.tween(codeOp, 0, { at: 37.2, dur: 0.8, ease: ease.move });
  tl.tween(tilesU, 1, { at: 37.8, dur: 0.6, ease: ease.enter });
  tl.tween(texR, 1, { at: 38.4, dur: 0.6, ease: ease.enter });
  tl.tween(row1U, 1, { at: 39.2, dur: 0.6, ease: ease.enter });
  tl.set(lens, { x: M.tile, y: M.r1, r: 44 }, 39.3);
  tl.tween(lensOp, 1, { at: 39.4, dur: 0.4, ease: ease.enter });
  tl.tween(lens, { x: M.tile, y: M.r2, r: 44 }, { at: 41.0, dur: 0.6, ease: ease.move });
  tl.tween(row2U, 1, { at: 41.0, dur: 0.6, ease: ease.enter });
  tl.tween(lensOp, 0, { at: 42.6, dur: 0.4, ease: ease.move });
  tl.tween(sumU, 1, { at: 43.0, dur: 0.7, ease: ease.enter });
  tl.hold(44.8, 0.4);

  // — B5 · slide the input: the bit flips between four and five —
  tl.caption({ at: 45.2, dur: 8.7, text: 'Slide the input along. At five the bit becomes one: ten passes through, and twelve is multiplied by zero, though it was computed.' });
  tl.tween(cam, HOME, { at: 45.2, dur: 1.2, ease: ease.move });
  tl.tween(plotOp, 1, { at: 45.2, dur: 0.8, ease: ease.move });
  tl.set(aVal, 3, 45.9);
  tl.tween(markerU, 1, { at: 46.0, dur: 0.5, ease: ease.enter });
  tl.tween(readU, 1, { at: 46.2, dur: 0.6, ease: ease.enter });
  // whole-number hops (no overshoot: the readout must show 5, not 5.1, as the bit lands)
  [4, 5, 6, 7].forEach((v, i) => tl.tween(aVal, v, { at: 47.0 + i * 0.75, dur: 0.45, ease: ease.move }));
  tl.tween(pulse2, 1, { at: 50.6, dur: 0.4, ease: ease.enter });
  tl.tween(pulse2, 0, { at: 51.2, dur: 0.7, ease: ease.move });
  // the slide to 4.5 lands before the blend caption, so the marker rests there for all of it
  tl.tween(aVal, 4.5, { at: 52.8, dur: 1.3, ease: ease.move });
  tl.hold(53.9, 0.4);

  // — B6 · between whole numbers: a blend —
  tl.caption({ at: 54.3, dur: 9.1, text: 'Between whole numbers the bit is a fraction: at four and a half the answer is eleven, a blend. The example assumes whole numbers.' });
  tl.tween(slopeGlow, 1, { at: 55.2, dur: 0.6, ease: ease.enter });
  tl.tween(blendU, 1, { at: 57.4, dur: 0.5, ease: ease.pop });
  tl.tween(noteU, 1, { at: 60.6, dur: 0.6, ease: ease.enter });
  tl.hold(63.4, 0.4);

  // — B7 · nothing converts your code: you write builder code —
  tl.caption({ at: 63.8, dur: 8.7, text: 'To be exact, nothing converts your existing Javascript. You write builder code: ordinary Javascript that runs once and appends operations to a circuit.' });
  for (const ch of [plotOp, machOp]) tl.tween(ch, 0, { at: 63.8, dur: 0.8, ease: ease.move });
  for (const ch of [markerU, readU, blendU, noteU, slopeGlow, codeOp]) tl.tween(ch, 0, { at: 63.8, dur: 0.6, ease: ease.move });
  tl.tween(c1aMove, 1, { at: 63.9, dur: 1.2, ease: ease.move });
  tl.tween(convU, 1, { at: 65.0, dur: 0.6, ease: ease.enter });
  tl.tween(crossU, 1, { at: 65.6, dur: 0.8, ease: ease.draw });
  tl.tween(quoteU, 1, { at: 66.3, dur: 0.6, ease: ease.enter });
  tl.tween(writeU, 1, { at: 67.2, dur: 0.8, ease: ease.enter });
  tl.tween(ledgerU, 1, { at: 68.8, dur: 0.6, ease: ease.enter });
  tl.tween(rowsU, 4, { at: 69.6, dur: 2.2, ease: ease.linear });
  tl.hold(72.5, 0.4);

  // — B8 · one line of builder code: not —
  tl.caption({ at: 72.9, dur: 7.2, text: 'Each line of builder code appends the operations for one familiar expression. Here, not becomes one minus the bit.' });
  tl.tween(cam, CAM_CODE, { at: 72.9, dur: 1.2, ease: ease.move });
  tl.tween(row1Dim, 1, { at: 72.9, dur: 0.6, ease: ease.move });
  tl.tween(c1dU, 1, { at: 73.2, dur: 0.6, ease: ease.enter });
  tl.tween(c1dGlow, 1, { at: 74.0, dur: 0.4, ease: ease.enter });
  tl.tween(c1dGlow, 2, { at: 76.8, dur: 0.4, ease: ease.move });
  tl.tween(rowsU, 5, { at: 77.6, dur: 0.6, ease: ease.enter });
  tl.tween(flipU, 1, { at: 78.4, dur: 0.8, ease: ease.move });
  tl.hold(80.1, 0.4);

  // — B9 · four kinds of operation —
  tl.caption({ at: 80.5, dur: 11.3, text: 'Only four kinds of operation exist: a weighted sum, a gated relu, a score rounded to zero or one, and a table read. Every result is a thirty-two-bit float.' });
  tl.tween(cam, HOME, { at: 80.5, dur: 1.2, ease: ease.move });
  tl.tween(b7Op, 0, { at: 80.5, dur: 0.6, ease: ease.move });
  tl.tween(collapseU, 1, { at: 80.6, dur: 0.6, ease: ease.move });
  for (const ch of [plotOp, machOp]) tl.tween(ch, 0, { at: 80.5, dur: 0.6, ease: ease.move });
  tl.tween(fanU, 1, { at: 81.0, dur: 1.4, ease: ease.move });
  tl.tween(spotU, 1, { at: 82.4, dur: 0.3, ease: ease.move });
  [1, 2, 3].forEach((f, i) => tl.tween(focus, f, { at: [83.9, 85.2, 87.1][i], dur: 0.3, ease: ease.move }));
  tl.tween(spotU, 0, { at: 88.5, dur: 0.5, ease: ease.move });
  // the FP32 note lands with the spoken "every result is a thirty-two-bit float"
  tl.tween(fp32U, 1, { at: 88.7, dur: 0.6, ease: ease.enter });
  tl.hold(91.8, 0.4);

  // — B10 · a layer is one sparse matrix multiply plus the gates; a program is a stack —
  tl.caption({ at: 92.2, dur: 8.0, text: "Operations that don't depend on each other share a layer, and a layer runs as one sparse matrix multiply plus the gates." });
  tl.caption({ at: 100.2, dur: 2.6, text: 'A program is a stack of layers.' });
  tl.tween(cam, CAM_STACK, { at: 92.2, dur: 1.2, ease: ease.move });
  tl.tween(fp32U, 0, { at: 92.2, dur: 0.5, ease: ease.move });
  tl.tween(dropU, 1, { at: 92.4, dur: 1.4, ease: ease.move });
  tl.tween(stackLbl, 1, { at: 93.6, dur: 0.6, ease: ease.enter });
  tl.tween(gatesU, 1, { at: 94.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, HOME, { at: 99.5, dur: 1.3, ease: ease.move });
  tl.tween(pose, 1, { at: 99.5, dur: 1.3, ease: ease.move });
  tl.tween(skyU, 1, { at: 100.1, dur: 1.6, ease: ease.linear });
  tl.tween(countU, 1, { at: 100.5, dur: 1.8, ease: ease.enter });
  tl.hold(102.8, 0.4);

  // — B11 · nothing branches or loops at runtime —
  tl.caption({ at: 103.2, dur: 4.3, text: 'Nothing in a stack like that branches or loops at runtime.' });
  tl.caption({ at: 107.5, dur: 4.0, text: 'So if every branch always runs, what happens to a loop?' });
  tl.tween(skyOp, 0.12, { at: 103.2, dur: 0.8, ease: ease.move });
  tl.tween(countOp, 0, { at: 103.2, dur: 0.6, ease: ease.move });
  tl.tween(pose, 2, { at: 103.3, dur: 1.2, ease: ease.move });
  tl.tween(boundU, 1, { at: 104.4, dur: 1.0, ease: ease.draw });
  tl.tween(loopU, 1, { at: 105.4, dur: 1.0, ease: ease.draw });
  tl.tween(loopU, 0.8, { at: 106.4, dur: 0.5, ease: ease.pop });
  tl.tween(loopX, 1, { at: 106.5, dur: 0.4, ease: ease.pop });
  for (const ch of [stackOp, loopOp]) tl.tween(ch, 0.12, { at: 107.4, dur: 0.8, ease: ease.move });
  tl.tween(skyOp, 0, { at: 107.4, dur: 0.8, ease: ease.move });
  tl.tween(qU, 1, { at: 107.8, dur: 0.7, ease: ease.enter });
  tl.hold(111.5, 2.5);

  return {
    tl, cam, src, lens, lensOp, gridU, reluDraw, introLabels, texRelu, ifU, shrinkU, introOp,
    c1aU, c1bU, codeOp, axisU, dotsU, stripU, stripOp, aReveal, rideU, texA, ghostU, ghostShift, bSolid, texB,
    segU, morphU, bOp, styleU, discU, texD, tagU, plotOp, tilesU, row1U, row2U, sumU, texR, machOp,
    markerU, aVal, pulse2, readU, slopeGlow, blendU, noteU,
    c1aMove, convU, crossU, quoteU, writeU, ledgerU, rowsU, row1Dim, b7Op, c1dU, c1dGlow, flipU, collapseU,
    fanU, spotU, focus, fp32U, dropU, stackLbl, gatesU, pose, skyU, skyOp, countU, countOp, stackOp,
    boundU, loopU, loopX, loopOp, qU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (book-wide spec, redrawn locally)
// ---------------------------------------------------------------------------

/** Violet hockey stick: flat to the middle, then a 45° rise. (x, y) is the bottom-left. */
function ReluGlyph({ x, y, w = 22, color = colors.SECONDARY, width = 2.5, reveal = 1, opacity = 1 }: {
  x: number; y: number; w?: number; color?: string; width?: number; reveal?: number; opacity?: number;
}) {
  if (opacity <= 0.005 || reveal <= 0) return null;
  const len = w / 2 + (w / 2) * Math.SQRT2;
  return (
    <path
      d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len}
      strokeDashoffset={len * (1 - clamp01(reveal))}
      opacity={opacity}
    />
  );
}

/** The bit: amber disc when 1, ring when 0, filled from the bottom when fractional. */
function BitDisc({ cx, cy, b, r = 11, opacity = 1, showNum = true }: {
  cx: number; cy: number; b: number; r?: number; opacity?: number; showNum?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const v = clamp01(b);
  let fill: ReactNode = null;
  if (v >= 0.995) fill = <circle cx={cx} cy={cy} r={r} fill={colors.WARM} />;
  else if (v > 0.005) {
    const ly = cy + r - 2 * r * v;
    const w = Math.sqrt(Math.max(0, r * r - (ly - cy) * (ly - cy)));
    fill = <path d={`M ${cx - w} ${ly} A ${r} ${r} 0 ${v > 0.5 ? 1 : 0} 0 ${cx + w} ${ly} Z`} fill={colors.WARM} />;
  }
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={colors.BG} />
      {fill}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.WARM} strokeWidth={2} />
      {showNum && r >= 11 && (
        <text
          x={cx}
          y={cy + 4.5}
          textAnchor="middle"
          fontSize={13}
          fontFamily={MONO}
          fontWeight={700}
          fill={v > 0.6 ? '#1a1206' : v > 0.05 ? '#ffffff' : colors.WARM}
          stroke={v > 0.05 && v <= 0.6 ? '#0a0e1a' : 'none'}
          strokeWidth={3}
          paintOrder="stroke"
        >
          {fmt(v)}
        </text>
      )}
    </g>
  );
}

/** Thin white ring with a short leader: the spotlight (never a box). */
function LensRing({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const a = -Math.PI / 4;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffffff" strokeWidth={2} />
      <line x1={x + r * Math.cos(a)} y1={y + r * Math.sin(a)} x2={x + (r + 16) * Math.cos(a)} y2={y + (r + 16) * Math.sin(a)} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Verbatim code chip: mono 14 px, PANEL fill, GRID border, a role-color stripe. */
function CodeChip({ x, y, lines, stripe, opacity = 1, glow }: {
  x: number; y: number; lines: string[]; stripe: string; opacity?: number; glow?: number[];
}) {
  if (opacity <= 0.005) return null;
  const w = chipW(lines);
  const h = lines.length * 20 + 14;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <g key={i}>
          {glow && glow[i] > 0.01 && <rect x={x + 8} y={y + 8 + i * 20} width={w - 14} height={19} rx={3} fill={colors.WARM} opacity={0.2 * glow[i]} />}
          <text x={x + 16} y={y + 22 + i * 20} fontSize={14} fontFamily={MONO} fill={l.startsWith('//') ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
            {l}
          </text>
        </g>
      ))}
    </g>
  );
}

/** One ledger row: [name] [expression], relu operations carry the violet stripe and glyph. */
function OpChip({ x, y, w, name, expr, isRelu, opacity }: {
  x: number; y: number; w: number; name: string; expr: string; isRelu: boolean; opacity: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={26} rx={5} fill={colors.PANEL} stroke={colors.MUTED} strokeOpacity={0.6} />
      <rect x={x} y={y} width={4} height={26} rx={2} fill={isRelu ? colors.SECONDARY : colors.MUTED} />
      <text x={x + 12} y={y + 18} fontSize={13} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
        {name}
      </text>
      <text x={x + 72} y={y + 18} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {expr}
      </text>
      {isRelu && <ReluGlyph x={x + w - 32} y={y + 19} w={22} />}
    </g>
  );
}

function Tile({ x, y, w, h, text, stroke, opacity, dashed = false, size = 26, fillOpacity = 1 }: {
  x: number; y: number; w: number; h: number; text: string; stroke: string; opacity: number; dashed?: boolean; size?: number; fillOpacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={colors.PANEL} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={2} strokeDasharray={dashed ? '6 5' : undefined} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontSize={size} fontFamily={MONO} fontWeight={650} fill={colors.TEXT}>
        {text}
      </text>
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
  const lens = s.get(scene.lens);

  // ---- plot state
  const morph = v(scene.morphU);
  const Y = yScale(morph);
  const y0 = Y(0);
  const plotOp = v(scene.plotOp);
  const axisU = v(scene.axisU);
  const rideU = v(scene.rideU);
  const discU = v(scene.discU);
  const styleU = v(scene.styleU);
  const segU = v(scene.segU);
  const ghostShift = v(scene.ghostShift);
  const a = v(scene.aVal);
  const bit = ABOVE4(a);
  const aQ = quant(a);
  const bitQ = ABOVE4(aQ);
  const markerU = v(scene.markerU);
  const stripOp = v(scene.stripOp) * v(scene.stripU);
  const dotsU = v(scene.dotsU);

  // ---- intro
  const shrink = v(scene.shrinkU);
  const introS = lerp(1, 0.25, shrink);
  const introOp = v(scene.introOp) * lerp(1, 0.35, shrink);
  const introTx = lerp(INTRO_C.x, INTRO_E.x, shrink);
  const introTy = lerp(INTRO_C.y, INTRO_E.y, shrink);

  // ---- machine
  const machOp = v(scene.machOp);
  const tilesU = v(scene.tilesU);
  const row1U = v(scene.row1U);
  const row2U = v(scene.row2U);
  const sumU = v(scene.sumU);
  const p1 = bitQ * 10;
  const p2 = (1 - bitQ) * 12;
  const pulse2 = v(scene.pulse2);

  // ---- builder code
  const c1aMove = v(scene.c1aMove);
  const b7Op = v(scene.b7Op);
  const r1Op = b7Op * (1 - v(scene.row1Dim));
  const rowsU = v(scene.rowsU);
  const collapse = v(scene.collapseU);
  const ledgerOp = v(scene.ledgerU) * (1 - collapse);
  const c1dGlow = v(scene.c1dGlow);
  const flipU = v(scene.flipU);

  // ---- cards + stack
  const fanU = v(scene.fanU);
  const dropU = v(scene.dropU);
  const spotU = v(scene.spotU);
  const focus = v(scene.focus);
  const P = poseAt(v(scene.pose));
  const stackOp = v(scene.stackOp);
  const tileX = (i: number) => P.cx + (i - 1.5) * PITCH * P.s;
  const T = TILE * P.s;
  const shrunk = clamp01(v(scene.pose)) * (v(scene.pose) <= 1 ? 1 : 1 - clamp01(v(scene.pose) - 1));
  const tilesIn = clamp01((dropU - 0.55) / 0.45);
  const skyU = v(scene.skyU);
  const countU = v(scene.countU);
  const loopU = v(scene.loopU);
  const loopX = v(scene.loopX);
  const qU = v(scene.qU);

  // loop arrow geometry (drawn up to the boundary contact, then the bounce)
  const loopN = Math.max(1, Math.round(LOOP_HIT * clamp01(loopU)));
  const loopPts = LOOP_PTS.slice(0, loopN + 1);
  const tip = loopPts[loopPts.length - 1];
  const prev = loopPts[Math.max(0, loopPts.length - 4)];
  const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  const hit = LOOP_PTS[LOOP_HIT];

  const chip = `${PIN} · ${SOURCES[srcIdx]}`;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="hw1-plot-clip">
          <rect x={100} y={112} width={700} height={318} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= B0 · weighted sums + one bend (shrinks to an emblem) ================= */}
        {introOp > 0.005 && (
          <g opacity={introOp} transform={`translate(${introTx}, ${introTy}) scale(${introS}) translate(${-INTRO_C.x}, ${-INTRO_C.y})`}>
            <MatrixGrid
              x={380}
              y={250}
              values={INTRO_GRID}
              cell={30}
              gap={5}
              cellU={(i, j) => staggerU(v(scene.gridU), i * 5 + j, 25, 0.04, 0.3)}
              fill={(val) => (val > 0 ? colors.ACCENT : FAINT)}
            />
            <text x={603} y={350} textAnchor="middle" fontSize={44} fill={colors.TEXT} opacity={v(scene.introLabels)}>
              +
            </text>
            <line x1={660} y1={410} x2={910} y2={410} stroke={colors.MUTED} strokeWidth={1.5} opacity={v(scene.reluDraw) > 0 ? 0.7 : 0} />
            <line x1={660} y1={410} x2={660} y2={250} stroke={colors.MUTED} strokeWidth={1.5} opacity={v(scene.reluDraw) > 0 ? 0.7 : 0} />
            <ReluGlyph x={660} y={410} w={240} width={6} reveal={v(scene.reluDraw)} />
            <g opacity={v(scene.introLabels) * (1 - shrink)}>
              <text x={465} y={460} textAnchor="middle" fontSize={20} fill={colors.TEXT}>
                weighted sums
              </text>
              <text x={785} y={460} textAnchor="middle" fontSize={20} fill={colors.SECONDARY}>
                relu
              </text>
            </g>
            <MathLabel tex={'\\mathrm{relu}(x)=\\max(0,x)'} x={640} y={196} fontSize={30} opacity={v(scene.texRelu) * (1 - shrink)} boxWidth={600} />
            {v(scene.ifU) > 0.005 && (
              <g opacity={v(scene.ifU) * (1 - shrink)} transform={`translate(${lerp(140, 0, v(scene.ifU))}, 0)`}>
                <rect x={545} y={500} width={190} height={42} rx={21} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
                <text x={640} y={528} textAnchor="middle" fontSize={20} fontFamily={MONO} fill={colors.WARM}>
                  an if / else?
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B1–B6 · the a-axis: ramps → step → bits ================= */}
        {plotOp > 0.005 && axisU > 0 && (
          <g opacity={plotOp}>
            {/* axes (local: integer ticks only, so the step reads 0 and 1) */}
            <line x1={X(0)} y1={y0} x2={lerp(X(0), X(9) + 18, clamp01(axisU * 1.3))} y2={y0} stroke={colors.MUTED} strokeWidth={2} />
            <line x1={X(0)} y1={y0} x2={X(0)} y2={lerp(y0, PLOT_TOP, clamp01(axisU * 1.3))} stroke={colors.MUTED} strokeWidth={2} />
            {A_INTS.map((i) => (
              <g key={i} opacity={staggerU(axisU, i, 10, 0.05, 0.6)}>
                <line x1={X(i)} y1={y0} x2={X(i)} y2={y0 + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                <text x={X(i)} y={y0 + 22} textAnchor="middle" fontSize={13} fill={colors.MUTED} fontFamily={MONO}>
                  {i}
                </text>
              </g>
            ))}
            <text x={X(9) + 26} y={y0 + 5} fontSize={18} fill={colors.MUTED} fontStyle="italic" opacity={axisU}>
              a
            </text>
            {[1, 2, 3, 4, 5].map((t) => {
              const yy = Y(t);
              const op = clamp01((yy - PLOT_TOP + 4) / 20) * axisU;
              if (op <= 0.01) return null;
              return (
                <g key={t} opacity={op}>
                  <line x1={X(0) - 6} y1={yy} x2={X(0)} y2={yy} stroke={colors.MUTED} strokeWidth={1.5} />
                  <line x1={X(0)} y1={yy} x2={X(9)} y2={yy} stroke={colors.GRID} strokeWidth={1} />
                  <text x={X(0) - 11} y={yy + 4.5} textAnchor="end" fontSize={13} fill={colors.MUTED} fontFamily={MONO}>
                    {t}
                  </text>
                </g>
              );
            })}
            <text x={X(0) - 11} y={y0 + 4.5} textAnchor="end" fontSize={13} fill={colors.MUTED} fontFamily={MONO} opacity={axisU}>
              0
            </text>

            {/* the curves (clipped to the plot box while the y-domain changes) */}
            <g clipPath="url(#hw1-plot-clip)">
              {/* ramp B: the ghost copy of A slides one step right, then settles in rose */}
              {v(scene.ghostU) > 0.005 && (
                <FunctionPlot x={X} y={Y} f={(t) => relu(t - 4 - ghostShift)} color={colors.ACCENT} width={2.5} dash opacity={0.55 * v(scene.ghostU)} />
              )}
              <FunctionPlot x={X} y={Y} f={RAMP_B} domain={[0, lerp(9, 6.05, morph)]} color={colors.NEGATIVE} width={3} opacity={v(scene.bSolid) * v(scene.bOp)} />
              {/* ramp A morphs into the difference: accent → amber */}
              {styleU < 0.999 && (
                <>
                  <FunctionPlot x={X} y={Y} f={ABOVE4} morph={{ from: RAMP_A, u: morph }} reveal={v(scene.aReveal)} color={colors.ACCENT} width={3.5} opacity={(1 - morph) * (1 - styleU)} />
                  <FunctionPlot x={X} y={Y} f={ABOVE4} morph={{ from: RAMP_A, u: morph }} reveal={v(scene.aReveal)} color={colors.WARM} width={3.5} opacity={morph * (1 - styleU)} />
                </>
              )}
              {styleU > 0.001 && (
                <g opacity={styleU}>
                  <FunctionPlot x={X} y={Y} f={ABOVE4} domain={[0, 4]} color={colors.WARM} width={3.5} samples={8} />
                  <FunctionPlot x={X} y={Y} f={ABOVE4} domain={[5, 9]} color={colors.WARM} width={3.5} samples={8} />
                  <FunctionPlot x={X} y={Y} f={ABOVE4} domain={[4, 5]} color={colors.WARM} width={2} dash opacity={0.5} samples={8} />
                  {v(scene.slopeGlow) > 0.005 && (
                    <g opacity={v(scene.slopeGlow)}>
                      <FunctionPlot x={X} y={Y} f={ABOVE4} domain={[4, 5]} color={colors.WARM} width={12} opacity={0.25} samples={8} />
                      <FunctionPlot x={X} y={Y} f={ABOVE4} domain={[4, 5]} color={colors.WARM} width={3.5} samples={8} />
                    </g>
                  )}
                </g>
              )}
            </g>
            {/* "+1 step": A's ramp at height 3 moves one step right */}
            <Vec x1={X(7) + 6} y1={Y(3)} x2={X(8) - 8} y2={Y(3)} grow={ghostShift} color={colors.TEXT} width={2} head={9} opacity={(1 - morph) * clamp01(ghostShift * 3) * (1 - v(scene.texB) * 0.6)} />
            {ghostShift > 0.05 && morph < 0.99 && (
              <text x={X(8) + 12} y={Y(3) + 22} fontSize={15} fill={colors.TEXT} opacity={clamp01(ghostShift * 2) * (1 - morph)}>
                +1 step
              </text>
            )}
            {/* subtraction segments for a = 5..9: drop from A by B's value (gone early in the morph) */}
            {segU > 0 && morph < 0.34 && (
              <g clipPath="url(#hw1-plot-clip)" opacity={1 - morph * 3}>
                {[5, 6, 7, 8, 9].map((i, k) => {
                  const u = staggerU(segU, k, 5, 0.12, 1.0);
                  if (u <= 0) return null;
                  const yA = Y(RAMP_A(i));
                  const yEnd = Y(RAMP_A(i) - RAMP_B(i));
                  return <line key={i} x1={X(i) + 7} y1={yA} x2={X(i) + 7} y2={lerp(yA, yEnd, u)} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />;
                })}
              </g>
            )}
            {/* small rose dots on ramp B */}
            {v(scene.bSolid) > 0.005 &&
              A_INTS.map((i) => (
                <circle key={i} cx={X(i)} cy={Y(RAMP_B(i))} r={4} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.8} opacity={v(scene.bSolid) * v(scene.bOp) * (Y(RAMP_B(i)) >= PLOT_TOP ? 1 : 0)} />
              ))}
            {/* the ten integer dots: on the axis → ride ramp A → fall onto the step → bit discs */}
            {A_INTS.map((i) => {
              const u = staggerU(dotsU, i, 10, 0.06, 0.4);
              if (u <= 0) return null;
              const base = RAMP_A(i) * rideU;
              const val = base + (ABOVE4(i) - base) * morph;
              const cy = Y(val);
              return (
                <g key={i} opacity={u}>
                  {discU < 0.999 && <circle cx={X(i)} cy={cy} r={6} fill={colors.ACCENT} opacity={1 - discU} />}
                  <BitDisc cx={X(i)} cy={cy} b={ABOVE4(i)} r={lerp(6, 11, discU)} opacity={discU} showNum={discU > 0.9} />
                </g>
              );
            })}
            <MathLabel tex={'\\mathrm{relu}(a-4)'} x={704} y={Y(5) - 4} fontSize={22} anchor="start" boxWidth={200} color={colors.ACCENT} opacity={v(scene.texA)} />
            <MathLabel tex={'\\mathrm{relu}(a-5)'} x={704} y={Y(4) + 8} fontSize={22} anchor="start" boxWidth={200} color={colors.NEGATIVE} opacity={v(scene.texB)} />
            <MathLabel tex={'\\text{above4}=\\mathrm{relu}(a-4)-\\mathrm{relu}(a-5)'} x={420} y={158} fontSize={22} boxWidth={560} color={colors.WARM} opacity={v(scene.texD)} />
            {v(scene.tagU) > 0.005 && (
              <g opacity={v(scene.tagU)} fontFamily={MONO} fontSize={18} fill={colors.WARM} textAnchor="middle">
                <text x={(X(1) + X(2)) / 2} y={y0 - 26}>0</text>
                <text x={(X(7) + X(8)) / 2} y={Y(1) + 32}>1</text>
              </g>
            )}

            {/* the marker a: drives the pick machine */}
            {markerU > 0.005 && (
              <g opacity={markerU}>
                <line x1={X(a)} y1={y0} x2={X(a)} y2={PLOT_TOP} stroke="#ffffff" strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
                <line x1={X(a)} y1={Y(bit)} x2={M.disc - 22} y2={M.r1} stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 5" opacity={0.55 * machOp} />
                <circle cx={X(a)} cy={Y(bit)} r={14} fill={colors.WARM} opacity={0.22} />
                <circle cx={X(a)} cy={Y(bit)} r={7} fill="#ffffff" />
                <text x={X(a)} y={PLOT_TOP - 8} textAnchor="middle" fontSize={15} fontFamily={MONO} fill="#ffffff">
                  a = {fmt(aQ)}
                </text>
              </g>
            )}

            {/* answer strip: a = 0..9 → 12 12 12 12 12 10 10 10 10 10 */}
            {stripOp > 0.005 && (
              <g>
                <text x={X(0) - 30} y={STRIP_Y + 21} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={stripOp}>
                  result
                </text>
                {A_INTS.map((i) => {
                  const u = staggerU(v(scene.stripU), i, 10, 0.05, 0.45);
                  const hl = markerU * clamp01(1 - Math.abs(a - i));
                  return (
                    <g key={i} opacity={Math.max(u * v(scene.stripOp), hl)}>
                      <rect x={X(i) - 22} y={STRIP_Y} width={44} height={30} rx={6} fill={colors.POSITIVE} fillOpacity={0.05 + 0.2 * hl} stroke={colors.POSITIVE} strokeOpacity={0.45 + 0.55 * hl} strokeWidth={1 + 1.5 * hl} />
                      <text x={X(i)} y={STRIP_Y + 21} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                        {ANSWERS[i]}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ================= B1 code chips: the ternary and its rewrite ================= */}
        <CodeChip x={60} y={500} lines={C1A} stripe={colors.MUTED} opacity={v(scene.c1aU) * Math.max(v(scene.codeOp), 0) * (1 - c1aMove)} />
        {v(scene.c1bU) > 0.005 && v(scene.codeOp) > 0.005 && (
          <g>
            <g opacity={v(scene.c1bU) * v(scene.codeOp)}>
              <line x1={378} y1={527} x2={452} y2={527} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
              <path d="M 452 521 L 462 527 L 452 533 Z" fill={colors.MUTED} />
              <text x={415} y={516} textAnchor="middle" fontSize={13} fill={colors.MUTED} fontStyle="italic">
                rewrite
              </text>
            </g>
            <CodeChip x={470} y={490} lines={C1B} stripe={colors.WARM} opacity={Math.min(0.45, v(scene.codeOp)) * v(scene.c1bU)} />
          </g>
        )}

        {/* ================= B4–B6 · the pick machine ================= */}
        {machOp > 0.005 && tilesU > 0.005 && (
          <g opacity={machOp}>
            <MathLabel tex={'\\text{result}=\\text{above4}\\cdot 10+(1-\\text{above4})\\cdot 12'} x={985} y={160} fontSize={22} boxWidth={520} opacity={v(scene.texR)} />
            {/* both answer tiles: always computed, always lit */}
            <Tile x={M.tile} y={M.r1} w={76} h={52} text="10" stroke={colors.TEXT} opacity={tilesU} />
            <Tile x={M.tile} y={M.r2} w={76} h={52} text="12" stroke={colors.TEXT} opacity={tilesU} />
            {/* row 1: above4 × 10 */}
            <g opacity={row1U}>
              <BitDisc cx={M.disc} cy={M.r1} b={bitQ} r={18} />
              <text x={M.disc} y={M.r1 + 42} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.WARM}>
                above4
              </text>
              <text x={855} y={M.r1 + 9} textAnchor="middle" fontSize={26} fill={colors.MUTED}>×</text>
              <text x={980} y={M.r1 + 9} textAnchor="middle" fontSize={26} fill={colors.MUTED}>=</text>
              <Tile x={M.prod} y={M.r1} w={76} h={52} text={fmt(p1)} stroke={colors.POSITIVE} opacity={0.35 + 0.65 * clamp01(bitQ * 2)} dashed={bitQ < 0.5} />
            </g>
            {/* row 2: (1 − above4) × 12 */}
            <g opacity={row2U}>
              {pulse2 > 0.005 && <circle cx={M.disc} cy={M.r2} r={18 + 14 * pulse2} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={pulse2} />}
              <BitDisc cx={M.disc} cy={M.r2} b={1 - bitQ} r={18} />
              <text x={M.disc} y={M.r2 + 42} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.WARM}>
                1 − above4
              </text>
              <text x={855} y={M.r2 + 9} textAnchor="middle" fontSize={26 + 8 * pulse2} fill={pulse2 > 0.3 ? colors.WARM : colors.MUTED}>×</text>
              <text x={980} y={M.r2 + 9} textAnchor="middle" fontSize={26} fill={colors.MUTED}>=</text>
              <Tile x={M.prod} y={M.r2} w={76} h={52} text={fmt(p2)} stroke={colors.POSITIVE} opacity={0.35 + 0.65 * clamp01((1 - bitQ) * 2)} dashed={bitQ > 0.5} />
            </g>
            {/* the products add */}
            <g opacity={sumU}>
              <text x={M.prod} y={M.resY + 9} textAnchor="middle" fontSize={26} fill={colors.MUTED}>+</text>
              <path
                d={`M 1086 ${M.r1 - 20} Q 1098 ${M.r1 - 20} 1098 ${M.r1 - 4} L 1098 ${M.resY - 12} Q 1098 ${M.resY} 1112 ${M.resY} Q 1098 ${M.resY} 1098 ${M.resY + 12} L 1098 ${M.r2 + 4} Q 1098 ${M.r2 + 20} 1086 ${M.r2 + 20}`}
                fill="none"
                stroke={colors.MUTED}
                strokeWidth={2}
              />
              <text x={M.res} y={M.resY - 40} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                result
              </text>
              <Tile x={M.res} y={M.resY} w={82} h={60} text={fmt(p1 + p2)} stroke={colors.POSITIVE} opacity={1} size={30} />
            </g>
            {v(scene.blendU) > 0.005 && (
              <g opacity={clamp01(v(scene.blendU))} transform={`translate(${M.res}, ${M.resY + 52}) scale(${v(scene.blendU)})`}>
                <rect x={-36} y={-12} width={72} height={24} rx={12} fill={colors.NEGATIVE} fillOpacity={0.16} stroke={colors.NEGATIVE} />
                <text y={5} textAnchor="middle" fontSize={14} fill={colors.NEGATIVE}>
                  blend
                </text>
              </g>
            )}
            {/* live readouts */}
            {v(scene.readU) > 0.005 && (
              <text x={985} y={455} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.readU)} xmlSpace="preserve">
                a = {fmt(aQ)}   <tspan fill={colors.WARM}>above4 = {fmt(bitQ)}</tspan>   <tspan fill={colors.POSITIVE}>result = {fmt(p1 + p2)}</tspan>
              </text>
            )}
            {v(scene.noteU) > 0.005 && (
              <text x={985} y={482} textAnchor="middle" fontSize={13} fill={colors.MUTED} fontStyle="italic" opacity={v(scene.noteU)}>
                the example assumes an integer a (README.md:18)
              </text>
            )}
          </g>
        )}

        <LensRing x={lens.x} y={lens.y} r={lens.r} opacity={v(scene.lensOp)} />

        {/* ================= B7/B8 · builder code, not a converter ================= */}
        {b7Op > 0.005 && c1aMove > 0.005 && (
          <g>
            {/* the ternary moves up: the one line nobody converts */}
            <CodeChip x={lerp(60, 150, c1aMove)} y={lerp(520, 168, c1aMove)} lines={[C1A[1]]} stripe={colors.MUTED} opacity={c1aMove * r1Op} />
            <g opacity={v(scene.convU) * r1Op}>
              <Vec x1={466} y1={184} x2={538} y2={184} color={colors.MUTED} width={2} head={9} />
              <rect x={548} y={160} width={180} height={48} rx={8} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="6 5" />
              <text x={638} y={190} textAnchor="middle" fontSize={17} fill={colors.MUTED} fontStyle="italic">
                converter
              </text>
            </g>
            {v(scene.crossU) > 0.005 && (
              <g opacity={r1Op} stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round">
                <line x1={560} y1={166} x2={lerp(560, 716, v(scene.crossU))} y2={lerp(166, 202, v(scene.crossU))} />
                <line x1={716} y1={166} x2={lerp(716, 560, clamp01(v(scene.crossU) * 1.4 - 0.4))} y2={lerp(166, 202, clamp01(v(scene.crossU) * 1.4 - 0.4))} opacity={v(scene.crossU) > 0.29 ? 1 : 0} />
              </g>
            )}
            <g opacity={v(scene.quoteU) * r1Op}>
              <rect x={150} y={226} width={578} height={64} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={150} y={226} width={4} height={64} rx={2} fill={colors.NEGATIVE} />
              <text x={168} y={253} fontSize={16} fill={colors.TEXT}>
                “No tool converts existing JavaScript source into a program.”
              </text>
              <text x={168} y={277} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                docs/README.md:3
              </text>
            </g>
            <g opacity={v(scene.writeU) * b7Op}>
              <rect x={150} y={340} width={120} height={32} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={210} y={361} textAnchor="middle" fontSize={16} fill={colors.TEXT}>
                you write
              </text>
              <Vec x1={278} y1={356} x2={340} y2={356} color={colors.MUTED} width={2} head={9} />
              <rect x={348} y={326} width={412} height={60} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={348} y={326} width={4} height={60} rx={2} fill={colors.ACCENT} />
              <text x={366} y={351} fontSize={17} fontWeight={650} fill={colors.TEXT}>
                builder code
              </text>
              <text x={366} y={374} fontSize={14} fill={colors.MUTED}>
                ordinary JavaScript · runs once
              </text>
              <Vec x1={768} y1={356} x2={895} y2={356} color={colors.MUTED} width={2} head={9} opacity={v(scene.ledgerU)} />
              <text x={831} y={344} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={v(scene.ledgerU)}>
                appends operations
              </text>
            </g>
            {/* B8: one line of builder code, and the bits it flips */}
            <CodeChip x={360} y={448} lines={C1D} stripe={colors.ACCENT} opacity={v(scene.c1dU) * b7Op} glow={[clamp01(c1dGlow) * (1 - clamp01(c1dGlow - 1)), clamp01(c1dGlow - 1)]} />
            {v(scene.c1dU) > 0.005 && (
              <text x={360} y={530} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.c1dU) * b7Op}>
                source: template/toggle.ts:50-51
              </text>
            )}
            {flipU > 0.005 && (
              <g opacity={clamp01(flipU * 3) * b7Op}>
                <text x={925} y={FLIP_Y + 5} fontSize={14} fontFamily={MONO} fill={colors.WARM}>not</text>
                <BitDisc cx={988} cy={FLIP_Y} b={1 - flipU} r={13} />
                <text x={1008} y={FLIP_Y + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>1 → 0</text>
                <BitDisc cx={1100} cy={FLIP_Y} b={flipU} r={13} />
                <text x={1120} y={FLIP_Y + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>0 → 1</text>
              </g>
            )}
          </g>
        )}
        {/* the Circuit ledger (schematic) */}
        {ledgerOp > 0.005 && (
          <g opacity={ledgerOp} transform={`translate(0, ${LEDGER.y}) scale(1, ${1 - collapse}) translate(0, ${-LEDGER.y})`}>
            <rect x={LEDGER.x} y={LEDGER.y} width={LEDGER.w} height={36 + Math.max(4, Math.ceil(rowsU)) * 34} rx={10} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={LEDGER.x + 16} y={LEDGER.y + 25} fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              Circuit
            </text>
            <text x={LEDGER.x + LEDGER.w - 14} y={LEDGER.y + 25} textAnchor="end" fontSize={13} fill={colors.WARM} fontStyle="italic">
              schematic
            </text>
            {LEDGER_ROWS.map((r, i) => (
              <g key={i}>
                {i === 4 && c1dGlow > 1.01 && <rect x={LEDGER.x + 6} y={LEDGER.y + 40 + i * 34} width={LEDGER.w - 12} height={30} rx={6} fill={colors.WARM} opacity={0.12 * clamp01(rowsU - 4)} />}
                <OpChip x={LEDGER.x + 10} y={LEDGER.y + 42 + i * 34} w={LEDGER.w - 20} name={r.name} expr={r.expr} isRelu={r.relu} opacity={clamp01(rowsU - i)} />
              </g>
            ))}
          </g>
        )}

        {/* ================= B9 · the four kinds of operation → B10 layers ================= */}
        {fanU > 0.005 && dropU < 0.999 &&
          CARDS.map((c, i) => {
            const u = clamp01(fanU * 1.6 - i * 0.2);
            if (u <= 0.005) return null;
            const slotX = CARD.xs[i];
            const slotY = CARD.y + CARD.h / 2;
            // fan from the ledger, then drop into the stack column i
            const fx = lerp(FAN_FROM.x, slotX, u);
            const fy = lerp(FAN_FROM.y, slotY, u);
            const fs = lerp(0.3, 1, u);
            const dp = clamp01(dropU / 0.6); // the card lands on its column before the tile fades in
            const tx = lerp(fx, tileX(i), dp);
            const ty = lerp(fy, P.cy, dp);
            const sw = lerp(CARD.w * fs, T + 12, dp);
            const sh = lerp(CARD.h * fs, T + 12, dp);
            const spot = 1 - spotU * 0.65 * clamp01(Math.abs(focus - i));
            const contentOp = clamp01(1 - dropU * 2.2);
            const k = fs * lerp(1, 0.45, dp);
            return (
              <g key={i} opacity={clamp01(u * 2) * spot * (1 - tilesIn)}>
                <rect x={tx - sw / 2} y={ty - sh / 2} width={sw} height={sh} rx={10} fill={colors.PANEL} stroke={colors.MUTED} strokeOpacity={0.55} strokeWidth={1.5} />
                {contentOp > 0.005 && (
                  <g opacity={contentOp} transform={`translate(${tx}, ${ty}) scale(${k}) translate(${-slotX}, ${-slotY})`}>
                    <text x={slotX} y={CARD.y + 30} textAnchor="middle" fontSize={18} fontWeight={650} fill={colors.TEXT}>
                      {c.title}
                    </text>
                    <text x={slotX} y={CARD.y + 52} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={i === 1 ? colors.SECONDARY : colors.MUTED}>
                      {c.fn}
                    </text>
                    <CardGlyph i={i} cx={slotX} cy={CARD.y + 88} />
                    <MathLabel tex={c.tex} x={slotX} y={CARD.y + 140} fontSize={c.size} boxWidth={CARD.w - 10} />
                    {i === 2 && (
                      <text x={slotX} y={CARD.y + 170} textAnchor="middle" fontSize={13} fill={colors.MUTED} fontStyle="italic">
                        rounds at one half
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        {v(scene.fp32U) > 0.005 && (
          <g opacity={v(scene.fp32U)}>
            <text x={640} y={416} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
              every value: FP32 (Math.fround)
            </text>
            <text x={640} y={438} textAnchor="middle" fontSize={13} fill={colors.MUTED} fontStyle="italic">
              docs/tutorial.md:74 · card math drawn unrounded · names from docs/README.md:15
            </text>
          </g>
        )}

        {/* ================= B10/B11 · the stack (schematic of the example) ================= */}
        {skyU > 0.005 && (
          <g opacity={v(scene.skyOp)}>
            {SKY.map((c, j) => {
              const u = clamp01(skyU * 130 - j);
              if (u <= 0) return null;
              return <rect key={j} x={c.x} y={SKY_BASE - c.h * u} width={5} height={c.h * u} rx={1.5} fill={colors.ACCENT} opacity={0.32} />;
            })}
            <text x={60} y={SKY_BASE + 24} fontSize={14} fill={colors.MUTED} opacity={clamp01(skyU * 2)}>
              the desktop demo's program · one column per layer, heights schematic
            </text>
          </g>
        )}
        {dropU > 0.005 && stackOp > 0.005 && (
          <g opacity={stackOp}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity={tilesIn}>
                <rect x={tileX(i) - T / 2 - 6} y={P.cy - T / 2 - 6} width={T + 12} height={T + 12} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <MatrixGrid
                  x={tileX(i) - T / 2}
                  y={P.cy - T / 2}
                  values={LAYER_VALUES[i]}
                  cell={17 * P.s}
                  gap={3 * P.s}
                  cellU={(r, c) => clamp01(tilesIn * 1.5 - (r * 6 + c) / 72)}
                  fill={(val) => (val > 0 ? (i === 0 ? colors.SECONDARY : colors.ACCENT) : FAINT)}
                />
                {i < 3 && <Vec x1={tileX(i) + T / 2 + 10} y1={P.cy} x2={tileX(i + 1) - T / 2 - 10} y2={P.cy} color={colors.MUTED} width={1.5} head={7} opacity={0.8} />}
                <text x={tileX(i)} y={P.cy + T / 2 + 26} textAnchor="middle" fontSize={P.s > 0.7 ? 15 : 13} fill={colors.TEXT} opacity={v(scene.stackLbl)}>
                  layer {i + 1}
                </text>
                <text x={tileX(i)} y={P.cy + T / 2 + 45} textAnchor="middle" fontSize={13} fill={i === 0 ? colors.SECONDARY : colors.MUTED} opacity={v(scene.stackLbl) * (1 - shrunk)}>
                  {LAYER_DESC[i]}
                </text>
              </g>
            ))}
            {/* layer 1: the two relu gates side by side (both read only the input) */}
            <g opacity={v(scene.gatesU) * (1 - shrunk) * tilesIn}>
              <ReluGlyph x={tileX(0) - 34} y={P.cy - T / 2 - 18} w={26} width={3} />
              <ReluGlyph x={tileX(0) + 8} y={P.cy - T / 2 - 18} w={26} width={3} />
            </g>
            <text x={P.cx} y={P.cy - T / 2 - 34} textAnchor="middle" fontSize={14} fill={colors.WARM} fontStyle="italic" opacity={v(scene.stackLbl) * (1 - shrunk)}>
              schematic of the example
            </text>
          </g>
        )}
        {countU > 0.005 && (
          <g opacity={v(scene.countOp) * clamp01(countU * 3)}>
            <text x={700} y={128} fontSize={16} fill={colors.MUTED}>
              the desktop demo's program
            </text>
            {COUNTERS.map((c, i) => (
              <g key={i}>
                <text x={860} y={182 + i * 52} textAnchor="end" fontSize={32} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  {commas(c.n * countU)}
                </text>
                <text x={876} y={182 + i * 52} fontSize={18} fill={colors.MUTED}>
                  {c.label}
                </text>
              </g>
            ))}
            <text x={700} y={320} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              src/handwiredos/README.md:13
            </text>
          </g>
        )}
        {v(scene.boundU) > 0.005 && (
          <g opacity={clamp01(v(scene.boundU) * 1.5)}>
            <rect
              x={BOUND.x}
              y={BOUND.y}
              width={BOUND.w}
              height={BOUND.h}
              rx={18}
              fill="none"
              stroke={colors.MUTED}
              strokeWidth={2}
              strokeDasharray="10 7"
              opacity={0.9}
            />
            <text x={BOUND.x} y={BOUND.y - 12} fontSize={17} fill={colors.TEXT}>
              a fixed list
            </text>
          </g>
        )}
        {loopU > 0.005 && (
          <g opacity={v(scene.loopOp)}>
            <polyline points={LOOP_PTS.slice(LOOP_HIT).map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="3 6" opacity={0.3 * loopX} />
            <polyline points={loopPts.map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round" />
            <polygon
              points={`${tip[0] + 12 * Math.cos(ang)},${tip[1] + 12 * Math.sin(ang)} ${tip[0] + 8 * Math.cos(ang + 2.2)},${tip[1] + 8 * Math.sin(ang + 2.2)} ${tip[0] + 8 * Math.cos(ang - 2.2)},${tip[1] + 8 * Math.sin(ang - 2.2)}`}
              fill={colors.NEGATIVE}
            />
            <text x={tip[0] + 30} y={tip[1] + 42} fontSize={15} fill={colors.NEGATIVE} opacity={clamp01(loopU * 2 - 0.4)}>
              loop?
            </text>
            {loopX > 0.005 && (
              <g transform={`translate(${hit[0]}, ${hit[1]}) scale(${loopX})`} stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round">
                <line x1={-11} y1={-11} x2={11} y2={11} />
                <line x1={11} y1={-11} x2={-11} y2={11} />
              </g>
            )}
          </g>
        )}
        {qU > 0.005 && (
          <g opacity={qU}>
            <rect x={250} y={400} width={780} height={110} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={464} textAnchor="middle" fontSize={24} fill={colors.TEXT}>
              If every branch always runs, what happens to a loop?
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip + source chip ================= */}
      <rect x={40} y={18} width={190} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Both Branches Run
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
    </>
  );
}

/** Small per-card glyphs for the four operation kinds. */
function CardGlyph({ i, cx, cy }: { i: number; cx: number; cy: number }) {
  if (i === 0) {
    // weighted sum: three inputs converge on one node
    return (
      <g>
        {[-16, 0, 16].map((dy, k) => (
          <g key={k}>
            <circle cx={cx - 50} cy={cy + dy} r={4} fill={colors.ACCENT} />
            <line x1={cx - 46} y1={cy + dy} x2={cx - 12} y2={cy} stroke={colors.MUTED} strokeWidth={1.5} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={12} fill="none" stroke={colors.TEXT} strokeWidth={1.5} />
        <line x1={cx + 12} y1={cy} x2={cx + 44} y2={cy} stroke={colors.MUTED} strokeWidth={1.5} />
      </g>
    );
  }
  if (i === 1) return <ReluGlyph x={cx - 30} y={cy + 14} w={60} width={4} />;
  if (i === 2) {
    // rounded score: a staircase 0 → 1 with the cut at one half
    const x0 = cx - 50, x1 = cx + 50, yb = cy + 16, yt = cy - 16;
    return (
      <g>
        <line x1={x0} y1={yb} x2={x1} y2={yb} stroke={colors.MUTED} strokeWidth={1} opacity={0.6} />
        <path d={`M ${x0} ${yb} L ${cx} ${yb} L ${cx} ${yt} L ${x1} ${yt}`} fill="none" stroke={colors.WARM} strokeWidth={3} />
        <line x1={cx} y1={yb + 6} x2={cx} y2={yt - 6} stroke={colors.TEXT} strokeWidth={1} strokeDasharray="2 3" />
        <text x={cx + 6} y={yb + 18} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>0.5</text>
      </g>
    );
  }
  // table read: a row of cells, one read
  return (
    <g>
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={cx - 55 + k * 22} y={cy - 12} width={20} height={20} rx={3} fill={k === 2 ? colors.WARM : 'none'} fillOpacity={k === 2 ? 0.85 : 0} stroke={colors.MUTED} strokeWidth={1.2} />
      ))}
      <path d={`M ${cx - 1} ${cy + 22} L ${cx - 1} ${cy + 12}`} stroke={colors.WARM} strokeWidth={2} />
    </g>
  );
}

export const vizScene = () => scene;
