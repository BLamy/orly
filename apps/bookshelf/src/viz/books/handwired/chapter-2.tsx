// A Switch of Arithmetic
//
// Handwired — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT, Cheng Lou)
//   template/toggle.ts:9-38      layout, spring constants, the 20 cells (toggleCells)
//   template/toggle.ts:40-84     builder code: 46-47 track edges, 48-58 all / not / insideTrack,
//                                60-65 the three state updates, 67-82 animation and table.next
//   docs/tutorial.md:3, 53, 74, 93, 106, 145   what the switch does, comparison cost, select,
//                                new wire, fixed order, both hit tests, spring as a matrix power
//   src/runtime/cells.ts:27-32   what a cell kind means
//   docs/expressions.md:11       select: both sides always compute
//   docs/execution-model.md:173, 178, 243   host writes the matrix; 14 operations in 3 layers; bound 10.36
//   docs/patterns.md:198-211     a linear step repeated a runtime number of times
//   src/runtime/host-timing.ts:154-163   springStepMatrix
//   template/toggle.test.ts:9, 22        track geometry at 1280 × 800, the scripted press at (640, 400)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the
// fixed narration contract (verbatim).
//
// Every spring number on screen is DERIVED at module scope from springStepMatrix's formula
// (host-timing.ts:160-162) with stiffness 650, damping 45 and a 4 ms step, and asserted against the
// figures the repo prints (bound 10.36, peak 207 px/s, 0.009 px overshoot). Nothing here is runtime output.
import type { ReactNode } from 'react';
import { interpolateRgb, scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Axes, FunctionPlot, MatrixGrid, Vec } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const minus = (s: string): string => s.replace(/-/g, '−');

// ---------------------------------------------------------------------------
// The spring, derived (host-timing.ts:154-163, toggle.ts:10, host-timing.ts:37)
// ---------------------------------------------------------------------------

type Mat = readonly [number, number, number, number];
const SPRING = { stiffness: 650, damping: 45 };
const STEP_MS = 4;
function springStepMatrix(): Mat {
  const dt = STEP_MS / 1000;
  const velocityKeep = 1 - SPRING.damping * dt;
  return [1 - SPRING.stiffness * dt * dt, dt * velocityKeep, -SPRING.stiffness * dt, velocityKeep];
}
const mul = (a: Mat, b: Mat): Mat => [
  a[0] * b[0] + a[1] * b[2],
  a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2],
  a[2] * b[1] + a[3] * b[3],
];
const apply = (m: Mat, d: number, v: number): [number, number] => [m[0] * d + m[1] * v, m[2] * d + m[3] * v];

const M1 = springStepMatrix();
const POWERS: Mat[] = [M1];
for (let i = 0; i < 4; i++) POWERS.push(mul(POWERS[i], POWERS[i]));
const POWER_N = [1, 2, 4, 8, 16];
const M16 = POWERS[4];

// the phase-portrait path: released 20 px from the destination, 16 steps of 4 ms
const PATH: Array<[number, number]> = [[-20, 0]];
for (let i = 0; i < 16; i++) PATH.push(apply(M1, PATH[i][0], PATH[i][1]));
const JUMP = apply(M16, -20, 0);

// largest |entry| of M^n, n = 0..300 (springMatrixBound)
let BOUND = 1;
{
  let p: Mat = [1, 0, 0, 1];
  for (let n = 1; n <= 300; n++) {
    p = mul(p, M1);
    BOUND = Math.max(BOUND, ...p.map(Math.abs));
  }
}
// the thumb's displacement for 300 steps after a flip (drives the world toggle)
const THUMB_D: number[] = [-20];
let PEAK_V = 0;
let OVERSHOOT = 0;
{
  let d = -20;
  let v = 0;
  for (let n = 0; n < 300; n++) {
    [d, v] = apply(M1, d, v);
    THUMB_D.push(d);
    PEAK_V = Math.max(PEAK_V, Math.abs(v));
    OVERSHOOT = Math.max(OVERSHOOT, d);
  }
}
function check(ok: boolean, what: string): void {
  if (!ok) throw new Error(`handwired chapter 2: derived spring number disagrees with the repo (${what})`);
}
const near = (a: number, b: number, tol: number): boolean => Math.abs(a - b) <= tol;
check([0.9896, 0.00328, -2.6, 0.82].every((v, i) => near(M1[i], v, 1e-5)), 'M');
check([0.4487, 0.011, -8.753, -0.1223].every((v, i) => near(M16[i], v, 5e-4)), 'M^16');
check(near(BOUND, 10.36, 0.005), 'matrix bound 10.36');
check(near(PATH[16][0], -8.974, 1e-3) && near(PATH[16][1], 175.059, 1e-3), '16-step state');
check(near(JUMP[0], PATH[16][0], 1e-9) && near(JUMP[1], PATH[16][1], 1e-9), 'M^16 equals 16 steps');
check(near(PEAK_V, 207, 0.5) && near(OVERSHOOT, 0.009, 0.001), 'peak 207 px/s, 0.009 px overshoot');

/** Thumb offset 0..20 px from the off side, `t` seconds after a flip (4 ms steps). */
function thumbOffset(t: number): number {
  const s = Math.max(0, Math.min(300, t / (STEP_MS / 1000)));
  const i = Math.min(299, Math.floor(s));
  return 20 + lerp(THUMB_D[i], THUMB_D[i + 1], s - i);
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; the caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// world panel: the toggle at 3× (track 52×32 → 156×96, inset 4 → 12, travel 20 → 60)
const TRACK = { x: 70, y: 190, w: 156, h: 96 };
const THUMB_R = 36;
const THUMB_X0 = TRACK.x + 12 + THUMB_R; // 118
const THUMB_Y = TRACK.y + TRACK.h / 2; // 238
const PTR = { x: TRACK.x + 26 * 3, y: TRACK.y + 16 * 3 }; // (640, 400) inside 614..666 × 384..416
const XR = { y: 330, x0: TRACK.x, x1: TRACK.x + TRACK.w }; // x-ruler 614 … 666
const YR = { x: 300, y0: TRACK.y, y1: TRACK.y + TRACK.h }; // y-ruler 384 … 416
const DISC_Y = 470;

// the tape
const TAPE_X = 385;
const CELL_W = 38;
const CELL_H = 30;
const PITCH = 41;
const CELL_Y = 110;
const cellX = (i: number): number => TAPE_X + i * PITCH;
const cellCx = (i: number): number => cellX(i) + CELL_W / 2;
const ROW_Y = (i: number): number => 206 + i * 28;
const ROW_X = 385;
const ROW_W = 345;
const BIT_X = 712;

type Kind = 'input' | 'event' | 'state';
const KIND_COLOR: Record<Kind, string> = { input: colors.ACCENT, event: colors.WARM, state: colors.POSITIVE };
const CELLS: Array<{ name: string; kind: Kind }> = [
  { name: 'viewportWidth', kind: 'input' },
  { name: 'viewportHeight', kind: 'input' },
  { name: 'down.active', kind: 'event' },
  { name: 'down.x', kind: 'input' },
  { name: 'down.y', kind: 'input' },
  { name: 'up.active', kind: 'event' },
  { name: 'up.x', kind: 'input' },
  { name: 'up.y', kind: 'input' },
  { name: 'cancel', kind: 'event' },
  { name: 'on', kind: 'state' },
  { name: 'armed', kind: 'state' },
  { name: 'springMatrix[0]', kind: 'input' },
  { name: 'springMatrix[1]', kind: 'input' },
  { name: 'springMatrix[2]', kind: 'input' },
  { name: 'springMatrix[3]', kind: 'input' },
  { name: 'settleCheck', kind: 'input' },
  { name: 'snap', kind: 'input' },
  { name: 'thumb.displacement', kind: 'state' },
  { name: 'thumb.velocity', kind: 'state' },
  { name: 'thumb.destination', kind: 'state' },
];
const GROUPS: Array<{ name: string; from: number; to: number; low?: boolean }> = [
  { name: 'viewport', from: 0, to: 1 },
  { name: 'down', from: 2, to: 4 },
  { name: 'up', from: 5, to: 7 },
  { name: 'cancel', from: 8, to: 8 },
  { name: 'on', from: 9, to: 9 },
  { name: 'armed', from: 10, to: 10 },
  { name: 'springMatrix', from: 11, to: 14 },
  { name: 'settleCheck', from: 15, to: 15, low: true },
  { name: 'snap', from: 16, to: 16 },
  { name: 'thumb', from: 17, to: 19 },
];
const I_ON = 9;
const I_ARMED = 10;

// gadget area (right of the rows)
const G = { x: 760, r: 1225 };
// the relu plot shared by B4 (four bits) and B8 (three bits): x = sum of bits − (n − 1)
const RX = scaleLinear([-3, 1.5], [915, 1200]);
const RY = scaleLinear([0, 1.5], [430, 310]);
const RELU = (x: number): number => Math.max(0, x);
const SUM = { x: 800, y: 280 };

// spring panel
const PX = scaleLinear([-21, -7], [410, 790]);
const PY = scaleLinear([0, 230], [590, 240]);
const MAT = { x: 905, y: 310, cell: 100, gap: 10 };

// closing composition
const CLOSE = { x: 420, y: 360, k: 1.6 };

const CAM_TAPE: CameraState = { x: 795, y: 126, k: 1.35 };
const CAM_PRESS: CameraState = { x: 575, y: 300, k: 1.15 }; // world panel's left edge stays on stage
const CAM_AND: CameraState = { x: 760, y: 330, k: 1.15 };
const CAM_SELECT: CameraState = { x: 990, y: 340, k: 1.4 };

const PIN = 'chenglou/handwired@4ea7fcb';
const SOURCES = [
  'docs/tutorial.md:3',
  'docs/tutorial.md:3',
  'template/toggle.ts:18-38 · docs/tutorial.md:145',
  'src/runtime/cells.ts:27-32',
  'template/toggle.ts:46-58 · docs/tutorial.md:53 · template/toggle.test.ts:9, 22',
  'template/toggle.ts:48-49',
  'docs/expressions.md:11 · docs/tutorial.md:93',
  'docs/tutorial.md:93 · template/toggle.ts:61',
  'template/toggle.ts:62-63',
  'template/toggle.ts:62-63',
  'template/toggle.ts:64-65',
  'docs/tutorial.md:106 · numbers derived from src/runtime/host-timing.ts:160-162',
  'docs/tutorial.md:106 · numbers derived from src/runtime/host-timing.ts:160-162',
  'docs/execution-model.md:173, 178',
  'docs/tutorial.md:93',
];

// code chip bank (verbatim excerpts; long lines wrapped, ≤ 3 lines)
type CodeLine = { text: string; prose?: boolean };
const CODE: Array<{ lines: CodeLine[]; color: string }> = [
  { color: colors.ACCENT, lines: [{ text: 'const trackLeft = circuit.affine([[cells.viewportWidth, 0.5]], -layout.trackWidth / 2)' }] }, // toggle.ts:46
  { color: colors.WARM, lines: [{ text: "emitCompare(circuit, point.x, '>=', trackLeft)," }] }, // toggle.ts:54
  {
    color: colors.WARM,
    lines: [
      { text: '// JS: bits.every(bit => bit === 1), as relu(sum of bits - (count - 1)).' },
      { text: 'const all = (...bits: Wire[]) => circuit.reglu([], 1,' },
      { text: '  bits.map(bit => [bit, 1] as const), 1 - bits.length)' },
    ],
  }, // toggle.ts:48-49
  {
    color: colors.POSITIVE,
    lines: [{ text: 'emitSelect(circuit, condition, off, on)' }, { text: 'computes both sides and picks one', prose: true }],
  }, // tutorial.md:93
  {
    color: colors.POSITIVE,
    lines: [
      { text: 'const armedAfterDown = emitSelect(circuit, cells.down.active, cells.armed,' },
      { text: '  insideTrack(cells.down))' },
    ],
  }, // toggle.ts:61
  {
    color: colors.POSITIVE,
    lines: [
      { text: '// JS: if (up && armed && insideTrack(up)) on = !on' },
      { text: 'const on = emitSelect(circuit, all(cells.up.active, armedAfterDown, insideTrack(cells.up)),' },
      { text: '  cells.on, not(cells.on))' },
    ],
  }, // toggle.ts:62-63
  {
    color: colors.WARM,
    lines: [
      { text: '// JS: if (up || cancel) armed = false' },
      { text: 'const armed = all(armedAfterDown, not(cells.up.active), not(cells.cancel))' },
    ],
  }, // toggle.ts:64-65
];

// ---------------------------------------------------------------------------
// Timeline — 112.6 s, fifteen fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const ch = (key: string, v = 0): ChannelRef<number> => tl.channel(key, v);
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = ch('src');
  const codeIdx = ch('codeIdx', -1);
  const codeU = ch('codeU');

  // world panel
  const worldOp = ch('worldOp', 1);
  const toggleU = ch('toggleU');
  const ptrU = ch('ptrU');
  const ptrPulse = ch('ptrPulse');
  const wArmed = ch('wArmed');
  const wOn = ch('wOn');
  const thumbT = ch('thumbT');
  const thumbHome = ch('thumbHome'); // 1 = thumb pulled back to the off side (the replay)
  const stampA = ch('stampA');
  const stampB = ch('stampB');
  const rulerU = ch('rulerU');
  const rulerOp = ch('rulerOp', 1);

  // tape
  const cellsU = ch('cellsU');
  const bracketU = ch('bracketU');
  const counterU = ch('counterU');
  const legendU = ch('legendU');
  const spot = ch('spot', -1);
  const spotU = ch('spotU');
  const arrA = ch('arrA');
  const arrB1 = ch('arrB1');
  const arrB2 = ch('arrB2');
  const arcC = ch('arcC');
  const vwFlash = ch('vwFlash');
  const dActive = ch('dActive');
  const dXY = ch('dXY');
  const uActive = ch('uActive');
  const uXY = ch('uXY');
  const mWritten = ch('mWritten');
  const tapeOp = ch('tapeOp', 1);

  // derived-wire rows
  const rows = Array.from({ length: 12 }, (_, i) => ch(`row${i}`));
  const rowDim = Array.from({ length: 12 }, (_, i) => ch(`rowDim${i}`));
  const bits = [2, 3, 4, 5].map((i) => ch(`bit${i}`));
  const opsTag = ch('opsTag');
  const gridNote = ch('gridNote'); // B3: the grid precondition behind the 2-operation cost
  const rowsOut = ch('rowsOut');
  const rowsWhisper = ch('rowsWhisper'); // B5: rows fade out behind the select (the push would cut them at the left edge)

  // B4 / B8: and as relu
  const flyU = ch('flyU');
  const sumU = ch('sumU');
  const allTex = ch('allTex');
  const eq4 = ch('eq4');
  const plotU = ch('plotU');
  const plotOp = ch('plotOp', 1);
  const markU = ch('markU');
  const ghostU = ch('ghostU');
  const andOut = ch('andOut'); // B4 sum / equations fade out
  const b8U = ch('b8U');
  const markX = ch('markX', 1);

  // B5–B7: the select gadget
  const selU = ch('selU'); // 0..3: formula+inputs, tiles, sum
  const selB = ch('selB');
  const selOp = ch('selOp', 1);
  const flipU = ch('flipU');
  const offSpot = ch('offSpot');
  const curveU = ch('curveU');
  const tag1 = ch('tag1');
  const tag2 = ch('tag2');
  const gateTex = ch('gateTex');

  // B9–B10: the spring
  const springU = ch('springU');
  const startU = ch('startU');
  const hop = ch('hop');
  const trailN = ch('trailN');
  const trailOp = ch('trailOp', 1);
  const matU = ch('matU');
  const sq = ch('sq');
  const eqM = ch('eqM');
  const jumpU = ch('jumpU');
  const writeU = ch('writeU');
  const opsU = ch('opsU');
  const springOp = ch('springOp', 1);

  // B11
  const closeU = ch('closeU');
  const listU = ch('listU');
  const ev = [1, 2, 3].map((i) => ch(`ev${i}`));

  const CAP = [0.2, 1.7, 9.5, 17.9, 26.3, 36.4, 45.1, 54.2, 64.1, 66.0, 74.0, 81.6, 85.3, 92.6, 101.0];
  CAP.forEach((at, i) => tl.set(src, i, Math.max(0, at - 0.1)));

  const showCode = (i: number, at: number): void => {
    tl.tween(codeU, 0, { at: at - 0.3, dur: 0.25, ease: ease.move });
    tl.set(codeIdx, i, at - 0.03);
    tl.tween(codeU, 1, { at, dur: 0.45, ease: ease.enter });
  };
  const hideCode = (at: number): void => {
    tl.tween(codeU, 0, { at, dur: 0.35, ease: ease.move });
  };
  const fadeIn = (c: ChannelRef<number>, at: number, dur = 0.6): number => tl.tween(c, 1, { at, dur, ease: ease.enter });
  const to = (c: ChannelRef<number>, v: number, at: number, dur = 0.6, e = ease.move): number => tl.tween(c, v, { at, dur, ease: e });

  // — B0 · a toggle has memory —
  tl.caption({ at: 0.2, dur: 1.5, text: 'A toggle has memory.' });
  tl.caption({ at: 1.7, dur: 7.8, text: 'A press on the track arms it, a release on the track while armed flips it, and the thumb springs across.' });
  tl.tween(toggleU, 1, { at: 0.5, dur: 1.0, ease: ease.draw });
  fadeIn(ptrU, 1.9, 0.3);
  tl.tween(ptrPulse, 1, { at: 2.1, dur: 0.6, ease: ease.enter });
  fadeIn(wArmed, 2.3, 0.4);
  fadeIn(stampA, 2.6, 0.5);
  tl.set(ptrPulse, 0, 4.4);
  tl.tween(ptrPulse, 1, { at: 4.5, dur: 0.6, ease: ease.enter });
  fadeIn(wOn, 4.7, 0.4);
  tl.tween(thumbT, 1.2, { at: 4.7, dur: 1.2, ease: ease.linear });
  to(wArmed, 0, 4.9, 0.4);
  fadeIn(stampB, 5.0, 0.5);
  to(ptrU, 0, 6.6, 0.5);

  // — B1 · one table of twenty cells —
  tl.caption({ at: 9.5, dur: 8, text: 'The program reads one table of twenty cells: viewport, press, release, cancel, the on bit, the armed bit, and the spring.' });
  tl.tween(cam, CAM_TAPE, { at: 9.5, dur: 1.3, ease: ease.move });
  to(worldOp, 0, 9.5, 0.8); // the zoomed-in tape pushes the panel past the left edge
  to(stampA, 0, 9.5, 0.5);
  to(stampB, 0, 9.5, 0.5);
  tl.tween(cellsU, 20, { at: 10.2, dur: 2.6, ease: ease.linear });
  tl.tween(bracketU, 1, { at: 12.6, dur: 1.0, ease: ease.draw });
  fadeIn(counterU, 14.0, 0.5);
  // the replay: the switch goes back to off while it is dimmed
  to(wOn, 0, 11.0, 0.8);
  to(thumbHome, 1, 11.0, 0.9);

  // — B2 · who writes each cell —
  tl.caption({ at: 17.9, dur: 8, text: 'Each cell says who writes it. Javascript writes inputs and raises events, the program resets events, and the program computes states.' });
  fadeIn(legendU, 18.0, 0.5);
  tl.set(spot, 0, 18.1);
  fadeIn(spotU, 18.1, 0.4);
  tl.tween(arrA, 1, { at: 18.4, dur: 0.6, ease: ease.move });
  tl.tween(vwFlash, 1, { at: 18.9, dur: 0.5, ease: ease.pop });
  to(arrA, 0, 20.3, 0.3);
  to(vwFlash, 0, 20.3, 0.3);
  tl.set(spot, 2, 20.6);
  tl.tween(arrB1, 1, { at: 20.7, dur: 0.5, ease: ease.move });
  tl.set(dActive, 1, 21.15);
  to(arrB1, 0, 21.8, 0.3);
  tl.tween(arrB2, 1, { at: 22.0, dur: 0.5, ease: ease.move });
  tl.set(dActive, 0, 22.45);
  to(arrB2, 0, 22.9, 0.3);
  tl.set(spot, I_ON, 23.2);
  tl.tween(arcC, 1, { at: 23.3, dur: 1.1, ease: ease.draw });
  to(arcC, 0, 25.6, 0.4);
  to(spotU, 0, 25.6, 0.4);
  tl.set(spot, -1, 26.0);
  to(legendU, 0, 26.0, 0.4);
  to(counterU, 0, 26.0, 0.4);

  // — B3 · four comparisons —
  tl.caption({ at: 26.3, dur: 9.9, text: 'Did the press land on the track? Four comparisons, one per edge. With coordinates on a fine grid, each is an exact bit of just two operations.' });
  tl.tween(cam, CAM_PRESS, { at: 26.3, dur: 1.2, ease: ease.move });
  to(worldOp, 1, 26.6, 0.6); // after the push has carried the panel back on stage
  fadeIn(ptrU, 26.7, 0.3);
  tl.set(ptrPulse, 0, 26.6);
  tl.tween(ptrPulse, 1, { at: 26.9, dur: 0.6, ease: ease.enter });
  tl.tween(rulerU, 1, { at: 27.0, dur: 0.9, ease: ease.draw });
  tl.set(dActive, 1, 27.4);
  fadeIn(dXY, 27.4, 0.4);
  showCode(0, 27.7);
  fadeIn(rows[0], 27.7, 0.5);
  fadeIn(rows[1], 27.9, 0.5);
  showCode(1, 28.9);
  [2, 3, 4, 5].forEach((r, k) => {
    const at = 28.7 + k * 0.95;
    fadeIn(rows[r], at, 0.5);
    tl.tween(bits[k], 1, { at: at + 0.45, dur: 0.4, ease: ease.pop });
  });
  fadeIn(opsTag, 29.3, 0.5);
  fadeIn(gridNote, 30.7, 0.6); // "with coordinates on a fine grid" (tutorial.md:53)

  // — B4 · and as relu —
  tl.caption({ at: 36.4, dur: 8.3, text: 'Combine the four bits with an and: add them, subtract three, take relu. Only when all four are one does anything survive.' });
  tl.tween(cam, CAM_AND, { at: 36.4, dur: 1.2, ease: ease.move });
  to(worldOp, 0, 36.4, 0.6); // the and push leaves the panel cut by the left edge
  to(opsTag, 0, 36.4, 0.4);
  to(gridNote, 0, 36.4, 0.4);
  to(tapeOp, 0.35, 36.4, 0.6);
  to(ptrU, 0, 36.4, 0.4);
  [0, 1, 2, 3, 4, 5].forEach((r) => to(rowDim[r], 1, 36.5, 0.6));
  tl.tween(flyU, 1, { at: 36.9, dur: 1.2, ease: ease.move });
  tl.tween(sumU, 1, { at: 37.9, dur: 0.5, ease: ease.pop });
  fadeIn(eq4, 38.4, 0.5);
  showCode(2, 38.7);
  fadeIn(allTex, 38.8, 0.6);
  tl.tween(plotU, 1, { at: 39.3, dur: 1.2, ease: ease.draw });
  tl.tween(markU, 1, { at: 40.6, dur: 0.5, ease: ease.pop });
  fadeIn(rows[6], 41.1, 0.5);
  fadeIn(ghostU, 42.1, 0.7);

  // — B5 · the select —
  tl.caption({ at: 45.1, dur: 8.7, text: 'An if becomes a select: compute both values, multiply one by the gate and the other by one minus the gate, and add.' });
  tl.tween(cam, CAM_SELECT, { at: 45.1, dur: 1.3, ease: ease.move });
  to(andOut, 1, 45.1, 0.5);
  to(plotOp, 0, 45.1, 0.5);
  to(tapeOp, 0, 45.1, 0.6); // the zoomed tape would sit under the header chips
  to(rowsWhisper, 1, 45.1, 0.6);
  to(rowDim[6], 1, 45.1, 0.6);
  showCode(3, 45.7);
  tl.tween(selU, 1, { at: 45.7, dur: 1.0, ease: ease.enter });
  tl.tween(selU, 2, { at: 46.9, dur: 0.8, ease: ease.enter });
  tl.tween(selU, 3, { at: 47.9, dur: 0.6, ease: ease.pop });
  tl.tween(selB, 1, { at: 49.1, dur: 1.4, ease: ease.enter });
  fadeIn(rows[7], 52.1, 0.5);
  fadeIn(wArmed, 52.1, 0.5);

  // — B6 · a new wire —
  tl.caption({ at: 54.2, dur: 9.5, text: "Where Javascript reassigns a variable, builder code makes a new wire. Armed after down holds the press's result; the armed cell keeps the old value." });
  tl.tween(cam, CAMERA_HOME, { at: 54.2, dur: 1.3, ease: ease.move });
  to(selB, 0, 54.2, 0.5);
  to(tapeOp, 1, 54.8, 0.6); // once the camera is nearly home: no half-lit rows at the edge
  to(rowsWhisper, 0, 54.8, 0.6);
  to(worldOp, 1, 54.2, 0.6);
  showCode(4, 54.5);
  to(offSpot, 1, 54.7, 0.6);
  tl.tween(curveU, 1, { at: 55.3, dur: 1.2, ease: ease.draw });
  fadeIn(tag1, 56.5, 0.5);
  fadeIn(tag2, 58.1, 0.5);

  // — B7 · the flip —
  tl.caption({ at: 64.1, dur: 1.9, text: 'The flip is another select.' });
  tl.caption({ at: 66.0, dur: 7.6, text: 'If a release lands on the track while armed, the next on bit is the opposite of the old one.' });
  to(curveU, 0, 64.1, 0.4);
  to(tag1, 0, 64.1, 0.4);
  to(tag2, 0, 64.1, 0.4);
  to(offSpot, 0, 64.1, 0.5);
  [7].forEach((r) => to(rowDim[r], 1, 64.2, 0.6));
  showCode(5, 64.4);
  fadeIn(ptrU, 64.5, 0.3);
  tl.set(ptrPulse, 0, 64.4);
  tl.tween(ptrPulse, 1, { at: 64.7, dur: 0.6, ease: ease.enter });
  tl.set(uActive, 1, 64.9);
  fadeIn(uXY, 64.9, 0.4);
  fadeIn(rows[8], 65.5, 0.5);
  fadeIn(rows[9], 66.7, 0.5);
  fadeIn(gateTex, 66.9, 0.6);
  tl.tween(flipU, 1, { at: 67.9, dur: 0.9, ease: ease.move });
  fadeIn(rows[10], 69.9, 0.5);
  fadeIn(wOn, 70.3, 0.4);
  to(thumbHome, 0, 70.25, 0.05);
  tl.set(thumbT, 0, 70.2);
  tl.tween(thumbT, 1.2, { at: 70.3, dur: 1.2, ease: ease.linear });
  to(ptrU, 0, 72.1, 0.5);

  // — B8 · disarm —
  tl.caption({ at: 74.0, dur: 7.2, text: 'A release or a cancel disarms the switch, so the next armed bit is an and of three bits.' });
  to(selOp, 0, 74.0, 0.6);
  to(gateTex, 0, 74.0, 0.5);
  [8, 9, 10].forEach((r) => to(rowDim[r], 1, 74.1, 0.6));
  showCode(6, 74.3);
  fadeIn(rows[11], 74.5, 0.5);
  fadeIn(b8U, 75.1, 0.6);
  to(plotOp, 1, 75.7, 0.6);
  tl.set(markX, 0, 75.5);
  to(wArmed, 0, 77.5, 0.5);

  // — B9 · the spring is a matrix power —
  tl.caption({ at: 81.6, dur: 3.7, text: 'The spring looks like a loop of four-millisecond steps.' });
  tl.caption({ at: 85.3, dur: 6.9, text: 'But one step is a two by two matrix, and n steps are that matrix to the power n.' });
  hideCode(81.6);
  tl.tween(rowsOut, 1, { at: 81.6, dur: 0.9, ease: ease.move });
  to(plotOp, 0, 81.6, 0.5);
  to(b8U, 0, 81.6, 0.5);
  to(worldOp, 0.35, 81.6, 0.6);
  tl.tween(springU, 1, { at: 82.5, dur: 1.2, ease: ease.draw });
  fadeIn(startU, 83.5, 0.4);
  tl.tween(hop, 16, { at: 84.1, dur: 1.28, ease: ease.linear });
  tl.tween(trailN, 16, { at: 84.1, dur: 1.28, ease: ease.linear });
  fadeIn(eqM, 85.7, 0.6);
  fadeIn(matU, 85.9, 0.7);
  [0, 1, 2, 3].forEach((k) => tl.tween(sq, k + 1, { at: 87.1 + k * 1.15, dur: 0.9, ease: ease.move }));

  // — B10 · the host writes the power —
  tl.caption({ at: 92.6, dur: 8, text: "Javascript counts the steps and writes that power's four numbers into four cells. The program applies them once, in three layers." });
  tl.set(hop, 0, 92.7);
  to(eqM, 0, 92.6, 0.5);
  to(trailOp, 0.3, 92.7, 0.5);
  tl.tween(jumpU, 1, { at: 93.2, dur: 1.2, ease: ease.move });
  tl.tween(writeU, 1, { at: 95.5, dur: 0.8, ease: ease.draw });
  tl.tween(mWritten, 1, { at: 96.2, dur: 0.6, ease: ease.pop });
  tl.tween(opsU, 1, { at: 97.5, dur: 0.9, ease: ease.enter });

  // — B11 · one fixed list —
  tl.caption({ at: 101.0, dur: 9.1, text: 'So the switch is one fixed list: two hit tests, two selects, a spring. Both hit tests run every evaluation, press or no press.' });
  to(springOp, 0, 101.0, 0.9);
  to(tapeOp, 0.12, 101.0, 0.9);
  to(worldOp, 0.12, 101.0, 0.9);
  to(rulerOp, 0, 101.0, 0.9);
  tl.tween(closeU, 1, { at: 101.3, dur: 1.4, ease: ease.move });
  tl.tween(listU, 3, { at: 102.8, dur: 1.2, ease: ease.linear });
  ev.forEach((e, k) => tl.tween(e, 1, { at: 104.5 + k * 1.6, dur: 0.8, ease: ease.linear }));
  tl.hold(110.1, 2.5);

  return {
    tl, cam, src, codeIdx, codeU,
    worldOp, toggleU, ptrU, ptrPulse, wArmed, wOn, thumbT, thumbHome, stampA, stampB, rulerU, rulerOp,
    cellsU, bracketU, counterU, legendU, spot, spotU, arrA, arrB1, arrB2, arcC, vwFlash, dActive, dXY, uActive, uXY, mWritten, tapeOp,
    rows, rowDim, bits, opsTag, gridNote, rowsOut, rowsWhisper,
    flyU, sumU, allTex, eq4, plotU, plotOp, markU, ghostU, andOut, b8U, markX,
    selU, selB, selOp, flipU, offSpot, curveU, tag1, tag2, gateTex,
    springU, startU, hop, trailN, trailOp, matU, sq, eqM, jumpU, writeU, opsU, springOp,
    closeU, listU, ev,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (redrawn locally; book-wide spec)
// ---------------------------------------------------------------------------

/** The bit: amber disc when 1, hollow ring when 0 (the fill fades through transitions). */
function BitDisc({ x, y, v, r = 11, color = colors.WARM, opacity = 1, showNum = true }: { x: number; y: number; v: number; r?: number; color?: string; opacity?: number; showNum?: boolean }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={colors.BG} stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y} r={r} fill={color} opacity={clamp01(v)} />
      {showNum && r >= 11 && (
        <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={v >= 0.5 ? '#08101f' : color}>
          {v >= 0.5 ? '1' : '0'}
        </text>
      )}
    </g>
  );
}

/** Violet hockey stick, 22×16: flat to the middle, then a 45° rise. */
function ReluGlyph({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x - 3} y={y - 3} width={28} height={22} rx={5} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
      <path d={`M ${x} ${y + 14} L ${x + 11} ${y + 14} L ${x + 22} ${y + 3}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

function Pill({ x, y, w, h = 26, text, color = colors.GRID, textColor = colors.TEXT, fontSize = 13, dashed = false, opacity = 1, fill = colors.PANEL, anchor = 'start' }: {
  x: number; y: number; w: number; h?: number; text: ReactNode; color?: string; textColor?: string; fontSize?: number; dashed?: boolean; opacity?: number; fill?: string; anchor?: 'start' | 'middle';
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={color} strokeWidth={1.3} strokeDasharray={dashed ? '5 4' : undefined} />
      <text x={anchor === 'middle' ? x + w / 2 : x + 9} y={y + h / 2 + fontSize / 3} textAnchor={anchor} fill={textColor} fontSize={fontSize} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

const fmtCell = (v: number): string => {
  if (Math.abs(v) < 1) return minus((v < 0 ? '-' : '') + Math.abs(v).toFixed(3).slice(1));
  return minus(v.toFixed(2));
};
const fmt4 = (v: number): string => minus(v.toFixed(4));
const fmt2 = (v: number): string => minus(v.toFixed(2));

/** Up to three lines of verbatim code, screen space, above the caption band. */
function CodeChip({ idx, u }: { idx: number; u: number }) {
  if (idx < 0 || u <= 0.01) return null;
  const c = CODE[idx];
  const maxLen = Math.max(...c.lines.map((l) => l.text.length));
  const w = Math.min(870, maxLen * 8.43 + 30);
  const h = c.lines.length * 19 + 14;
  const x = 370;
  const y = 622 - h;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={c.color} />
      {c.lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 21 + i * 19} fill={l.prose ? colors.MUTED : l.text.startsWith('//') ? colors.MUTED : colors.TEXT} fontSize={14} fontFamily={l.prose ? SANS : MONO} fontStyle={l.prose ? 'italic' : undefined} xmlSpace="preserve">
          {l.text}
        </text>
      ))}
    </g>
  );
}

/** The switch itself (world panel), drawn at 3×. */
function Toggle({ on, armed, offset, draw }: { on: number; armed: number; offset: number; draw: number }) {
  if (draw <= 0.01) return null;
  const fill = interpolateRgb('#1b2436', colors.POSITIVE)(clamp01(on));
  const r = TRACK.h / 2;
  return (
    <g opacity={draw}>
      {armed > 0.01 && (
        <rect x={TRACK.x - 7} y={TRACK.y - 7} width={TRACK.w + 14} height={TRACK.h + 14} rx={r + 7} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={armed} />
      )}
      <rect x={TRACK.x} y={TRACK.y} width={TRACK.w} height={TRACK.h} rx={r} fill={fill} stroke="#4b5872" strokeWidth={1.5} />
      <circle cx={THUMB_X0 + offset * 3} cy={THUMB_Y} r={THUMB_R} fill="#eef2f8" />
    </g>
  );
}

/** Select gadget: gate·on + (1 − gate)·off, both products always computed. */
function SelectGadget({ labels, altLabels, swap = 0, u, offSpot, opacity }: { labels: [string, string, string]; altLabels: [string, string, string]; swap?: number; u: number; offSpot: number; opacity: number }) {
  if (opacity <= 0.01 || u <= 0.01) return null;
  const inU = clamp01(u);
  const tileU = clamp01(u - 1);
  const sumUu = clamp01(u - 2);
  const others = 1 - 0.65 * offSpot;
  const inY = [250, 285, 320];
  const inCol = [colors.WARM, colors.MUTED, colors.MUTED];
  const vals = [1, 0, 1];
  const tiles = [
    { y: 252, text: 'gate × on', v: 1 },
    { y: 302, text: '(1 − gate) × off', v: 0 },
  ];
  return (
    <g opacity={opacity}>
      {/* wires: gate → both tiles, on → tile 1, off → tile 2 */}
      <g opacity={tileU * 0.8 * others} stroke={colors.MUTED} strokeWidth={1.4} fill="none">
        <path d={`M 970 ${inY[0] + 13} C 985 ${inY[0] + 13}, 985 ${tiles[0].y + 15}, 1000 ${tiles[0].y + 15}`} />
        <path d={`M 970 ${inY[0] + 13} C 985 ${inY[0] + 13}, 985 ${tiles[1].y + 15}, 1000 ${tiles[1].y + 15}`} />
        <path d={`M 970 ${inY[2] + 13} C 985 ${inY[2] + 13}, 985 ${tiles[0].y + 15}, 1000 ${tiles[0].y + 15}`} />
        <path d={`M 1170 ${tiles[0].y + 15} L 1186 ${287}`} />
        <path d={`M 1170 ${tiles[1].y + 15} L 1186 ${287}`} />
      </g>
      <path d={`M 970 ${inY[1] + 13} C 985 ${inY[1] + 13}, 985 ${tiles[1].y + 15}, 1000 ${tiles[1].y + 15}`} stroke={offSpot > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={offSpot > 0.5 ? 2 : 1.4} fill="none" opacity={tileU * 0.8} />
      {labels.map((l, i) => (
        <g key={i} opacity={clamp01(inU * 3 - i) * (i === 1 ? 1 : others)}>
          <Pill x={G.x} y={inY[i]} w={210} text="" color={i === 1 && offSpot > 0.5 ? colors.WARM : inCol[i]} />
          {/* the flip reuses the same gadget: old labels out, then new labels in (never overlapping) */}
          <text x={G.x + 9} y={inY[i] + 17.3} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={1 - clamp01(swap * 2)}>
            {l}
          </text>
          <text x={G.x + 9} y={inY[i] + 17.3} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={clamp01(swap * 2 - 1)}>
            {altLabels[i]}
          </text>
          <BitDisc x={955} y={inY[i] + 13} v={vals[i]} r={10} showNum={false} />
          <text x={955} y={inY[i] + 17.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={vals[i] ? '#08101f' : colors.WARM}>
            {vals[i]}
          </text>
        </g>
      ))}
      {tiles.map((t, i) => (
        <g key={i} opacity={tileU * others}>
          <Pill x={1000} y={t.y} w={170} h={30} text={t.text} color={colors.POSITIVE} />
          <text x={1158} y={t.y + 20} textAnchor="end" fill={colors.POSITIVE} fontSize={15} fontFamily={MONO} fontWeight={700}>
            {t.v}
          </text>
        </g>
      ))}
      <g opacity={sumUu * others}>
        <circle cx={1203} cy={287} r={17} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={1203} y={292} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontFamily={MONO} fontWeight={700}>
          1
        </text>
        <text x={1203} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          sum
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(c: ChannelRef<T>): T => s.get(c);
  const cam = g(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(g(scene.src))));
  const codeIdx = Math.round(g(scene.codeIdx));
  const codeU = g(scene.codeU);

  const worldOp = g(scene.worldOp);
  const toggleU = g(scene.toggleU);
  const ptrU = g(scene.ptrU);
  const ptrPulse = g(scene.ptrPulse);
  const wArmed = g(scene.wArmed);
  const wOn = g(scene.wOn);
  const thumbHome = g(scene.thumbHome);
  const offset = thumbOffset(g(scene.thumbT)) * (1 - thumbHome);
  const rulerU = g(scene.rulerU);
  const rulerOp = g(scene.rulerOp);

  const cellsU = g(scene.cellsU);
  const bracketU = g(scene.bracketU);
  const spot = Math.round(g(scene.spot));
  const spotU = g(scene.spotU);
  const dActive = g(scene.dActive);
  const dXY = g(scene.dXY);
  const uActive = g(scene.uActive);
  const uXY = g(scene.uXY);
  const mWritten = g(scene.mWritten);
  const tapeOp = g(scene.tapeOp);
  const vwFlash = g(scene.vwFlash);

  const rowsOut = g(scene.rowsOut);
  const bitsU = scene.bits.map((b) => g(b));
  const flyU = g(scene.flyU);
  const andOut = g(scene.andOut);
  const plotOp = g(scene.plotOp);
  const markX = g(scene.markX);
  const offSpot = g(scene.offSpot);
  const flipU = g(scene.flipU);

  const springOp = g(scene.springOp);
  const springU = g(scene.springU);
  const hop = g(scene.hop);
  const trailN = g(scene.trailN);
  const sq = g(scene.sq);
  const closeU = g(scene.closeU);
  const listU = g(scene.listU);
  const evU = scene.ev.map((e) => g(e));

  // ---- the matrix on screen (ticks between powers while squaring) ----
  const sqK = Math.min(3, Math.floor(sq));
  const sqF = sq >= 4 ? 1 : sq - sqK;
  const matNow = [0, 1, 2, 3].map((i) => lerp(POWERS[sqK][i], POWERS[sqK + 1][i], ease.move(clamp01(sqF))));
  const powerShown = sq >= 4 ? 16 : POWER_N[sqF > 0.5 ? sqK + 1 : sqK];
  const matWrite = M16;

  // ---- tape values ----
  const cellValue = (i: number): string => {
    switch (i) {
      case 0: return '1280';
      case 1: return '800';
      case 2: return dActive >= 0.5 ? '1' : '0';
      case 3: return dXY > 0.5 ? '640' : '0';
      case 4: return dXY > 0.5 ? '400' : '0';
      case 5: return uActive >= 0.5 ? '1' : '0';
      case 6: return uXY > 0.5 ? '640' : '0';
      case 7: return uXY > 0.5 ? '400' : '0';
      case 11: case 12: case 13: case 14: return mWritten > 0.3 ? fmtCell(matWrite[i - 11]) : '0';
      default: return '0';
    }
  };
  const cellLit = (i: number): { u: number; color: string } => {
    if (i >= 2 && i <= 4) return { u: dXY * (1 - clamp01(rowsOut * 2)), color: colors.WARM };
    if (i >= 5 && i <= 7) return { u: uXY * (1 - clamp01(rowsOut * 2)), color: colors.WARM };
    if (i >= 11 && i <= 14) return { u: mWritten * springOp, color: colors.TEAL };
    if (i === 0) return { u: vwFlash, color: colors.TEAL };
    return { u: 0, color: colors.GRID };
  };

  // ---- rows ----
  const rowOp = (i: number): number => {
    const u = g(scene.rows[i]);
    return u * (1 - 0.65 * g(scene.rowDim[i])) * (1 - rowsOut) * (1 - g(scene.rowsWhisper)); // the select push cuts the rows at the left edge
  };
  const rowsShift = -46 * ease.move(rowsOut);

  // anything a camera push carries toward the stage edge fades out before it is cut
  const edgeFit = (x0: number, x1: number): number => {
    const l = (x0 - cam.x) * cam.k + STAGE_W / 2;
    const r = (x1 - cam.x) * cam.k + STAGE_W / 2;
    return clamp01((l - 16) / 20) * clamp01((STAGE_W - 16 - r) / 20);
  };

  // ---- phase portrait ----
  const hk = Math.min(15, Math.floor(hop));
  const hf = hop >= 16 ? 1 : hop - hk;
  const hopX = PX(lerp(PATH[hk][0], PATH[hk + 1][0], hf));
  const hopY = PY(lerp(PATH[hk][1], PATH[hk + 1][1], hf)) - 9 * Math.sin(Math.PI * hf);

  const chip = `${PIN} · ${SOURCES[srcIdx]}`;
  const chipW = chip.length * 7.85 + 20;

  // world toggle placement (B11 moves it to centre-left, larger)
  const cu = ease.move(clamp01(closeU));
  const tcx = lerp(PTR.x, CLOSE.x, cu);
  const tcy = lerp(THUMB_Y, CLOSE.y, cu);
  const tk = lerp(1, CLOSE.k, cu);
  const toggleOp = lerp(worldOp, 1, cu);

  const listItems = [
    { text: '2 hit tests', color: colors.WARM },
    { text: '2 selects', color: colors.POSITIVE },
    { text: '1 spring', color: colors.ACCENT },
  ];
  const pulse = evU.reduce((m, p) => Math.max(m, p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0), 0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <g fontFamily={SANS}>
      <Camera {...cam}>
        {/* ================= world panel ================= */}
        <g opacity={worldOp}>
          <rect x={40} y={90} width={300} height={440} rx={14} fill="none" stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="4 6" />
          <text x={58} y={116} fill={colors.MUTED} fontSize={13}>
            the switch, at 3×
          </text>
          {/* rulers (B3): the press against the track edges, toggle.test.ts:9 */}
          {rulerU > 0.01 && (
            <g opacity={rulerU * rulerOp}>
              <line x1={XR.x0} y1={XR.y} x2={lerp(XR.x0, XR.x1, rulerU)} y2={XR.y} stroke={colors.MUTED} strokeWidth={1.5} />
              <line x1={YR.x} y1={YR.y0} x2={YR.x} y2={lerp(YR.y0, YR.y1, rulerU)} stroke={colors.MUTED} strokeWidth={1.5} />
              {[
                { x: XR.x0, lit: bitsU[0], label: '614' },
                { x: XR.x1, lit: bitsU[1], label: '666' },
              ].map((m, i) => (
                <g key={i}>
                  <line x1={m.x} y1={XR.y - 7} x2={m.x} y2={XR.y + 7} stroke={m.lit > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={m.lit > 0.5 ? 3 : 1.5} />
                  <text x={m.x} y={XR.y + 24} textAnchor="middle" fill={m.lit > 0.5 ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {m.label}
                  </text>
                </g>
              ))}
              {[
                { y: YR.y0, lit: bitsU[2], label: '384' },
                { y: YR.y1, lit: bitsU[3], label: '416' },
              ].map((m, i) => (
                <g key={i}>
                  <line x1={YR.x - 7} y1={m.y} x2={YR.x + 7} y2={m.y} stroke={m.lit > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={m.lit > 0.5 ? 3 : 1.5} />
                  <text x={YR.x + 12} y={m.y + 4.5} fill={m.lit > 0.5 ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {m.label}
                  </text>
                </g>
              ))}
              <circle cx={PTR.x} cy={XR.y} r={5} fill={colors.TEXT} />
              <text x={PTR.x} y={XR.y - 11} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                640
              </text>
              <circle cx={YR.x} cy={PTR.y} r={5} fill={colors.TEXT} />
              <text x={YR.x + 12} y={PTR.y + 4.5} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                400
              </text>
              <text x={XR.x0 - 14} y={XR.y + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                x
              </text>
              <text x={YR.x} y={YR.y0 - 12} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                y
              </text>
            </g>
          )}
          {/* stamps (B0) */}
          <Pill x={88} y={372} w={120} h={26} text="press arms" color={colors.WARM} textColor={colors.WARM} fontSize={14} anchor="middle" opacity={g(scene.stampA)} />
          <Pill x={88} y={406} w={120} h={26} text="release flips" color={colors.POSITIVE} textColor={colors.POSITIVE} fontSize={14} anchor="middle" opacity={g(scene.stampB)} />
          {/* the two state bits the switch shows */}
          <g opacity={toggleU}>
            <BitDisc x={120} y={DISC_Y} v={wArmed} r={13} />
            <text x={120} y={DISC_Y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              armed
            </text>
            <BitDisc x={240} y={DISC_Y} v={wOn} r={13} color={colors.POSITIVE} />
            <text x={240} y={DISC_Y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              on
            </text>
          </g>
        </g>
        {/* the toggle itself (escapes the panel in B11) */}
        <g opacity={toggleOp} transform={`translate(${tcx}, ${tcy}) scale(${tk}) translate(${-PTR.x}, ${-THUMB_Y})`}>
          <Toggle on={wOn} armed={wArmed} offset={offset} draw={toggleU} />
          {ptrU > 0.01 && (
            <g opacity={ptrU * (1 - cu)}>
              <circle cx={PTR.x} cy={PTR.y} r={8 + 22 * ptrPulse} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={1 - ptrPulse} />
              <circle cx={PTR.x} cy={PTR.y} r={6} fill={colors.WARM} stroke="#08101f" strokeWidth={2} />
            </g>
          )}
        </g>

        {/* ================= the tape: 20 source cells ================= */}
        <g opacity={tapeOp}>
          {CELLS.map((c, i) => {
            const u = ease.enter(clamp01(cellsU - i));
            if (u <= 0.01) return null;
            const spotDim = spotU > 0 && spot !== i ? 1 - 0.65 * spotU : 1;
            const lit = cellLit(i);
            const x = cellX(i);
            const val = cellValue(i);
            const fit = edgeFit(x, x + CELL_W);
            if (fit <= 0.01) return null;
            return (
              <g key={i} opacity={u * spotDim * fit} transform={`translate(0, ${(1 - u) * -10})`}>
                <rect x={x} y={CELL_Y} width={CELL_W} height={CELL_H} rx={5} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
                {lit.u > 0.01 && <rect x={x} y={CELL_Y} width={CELL_W} height={CELL_H} rx={5} fill={lit.color} fillOpacity={0.16 * lit.u} stroke={lit.color} strokeWidth={2} opacity={lit.u} />}
                <rect x={x + 2} y={CELL_Y + CELL_H + 1} width={CELL_W - 4} height={3} rx={1.5} fill={KIND_COLOR[c.kind]} />
                <text x={x + CELL_W / 2} y={CELL_Y + 19.5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO} textLength={val.length > 4 ? 34 : undefined} lengthAdjust="spacingAndGlyphs">
                  {val}
                </text>
              </g>
            );
          })}
          {GROUPS.map((gr, k) => {
            const u = clamp01(bracketU * 2.2 - k * 0.12);
            if (u <= 0.01) return null;
            const x0 = cellX(gr.from) + 1;
            const x1 = cellX(gr.to) + CELL_W - 1;
            const spotDim = spotU > 0 && !(spot >= gr.from && spot <= gr.to) ? 1 - 0.65 * spotU : 1;
            const fit = edgeFit(x0, x1);
            if (fit <= 0.01) return null;
            return (
              <g key={gr.name} opacity={u * spotDim * fit}>
                {gr.to > gr.from && <path d={`M ${x0} 150 v 4 H ${x1} v -4`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />}
                <text x={(x0 + x1) / 2} y={gr.low ? 186 : 170} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {gr.name}
                </text>
              </g>
            );
          })}
          {/* counter + kind legend */}
          <text x={cellX(19) + CELL_W} y={98} textAnchor="end" fill={colors.TEXT} fontSize={15} fontWeight={650} opacity={g(scene.counterU)}>
            20 cells
          </text>
          <g opacity={g(scene.legendU)}>
            {(['input', 'event', 'state'] as Kind[]).map((k, i) => (
              <g key={k}>
                <rect x={960 + i * 80} y={66} width={22} height={4} rx={2} fill={KIND_COLOR[k]} />
                <text x={987 + i * 80} y={73} fill={colors.MUTED} fontSize={13}>
                  {k}
                </text>
              </g>
            ))}
          </g>
          {/* B2 (a): JavaScript writes an input */}
          <Vec x1={cellCx(0)} y1={52} x2={cellCx(0)} y2={106} grow={g(scene.arrA)} color={colors.TEAL} width={2.5} head={9} />
          <text x={cellCx(0) + 12} y={70} fill={colors.TEAL} fontSize={14} opacity={clamp01(g(scene.arrA) * 2 - 1)}>
            JavaScript writes
          </text>
          {/* B2 (b): JavaScript raises an event, the program resets it */}
          <Vec x1={cellCx(2)} y1={52} x2={cellCx(2)} y2={106} grow={g(scene.arrB1)} color={colors.TEAL} width={2.5} head={9} />
          <text x={cellCx(2) + 12} y={70} fill={colors.TEAL} fontSize={14} opacity={clamp01(g(scene.arrB1) * 2 - 1)}>
            JavaScript raises
          </text>
          <Vec x1={cellCx(2)} y1={52} x2={cellCx(2)} y2={106} grow={g(scene.arrB2)} color={colors.MUTED} width={2.5} head={9} />
          <text x={cellCx(2) + 12} y={70} fill={colors.MUTED} fontSize={14} opacity={clamp01(g(scene.arrB2) * 2 - 1)}>
            program resets
          </text>
          {/* spotlit cell name */}
          {spotU > 0.01 && spot >= 0 && spot !== I_ON && (
            <text x={cellCx(spot)} y={204} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={spotU}>
              {CELLS[spot].name}
            </text>
          )}
          {/* B2 (c): the program computes the next state (looped above the cell, clear of the group labels) */}
          {g(scene.arcC) > 0.01 && (
            <g>
              <path d={`M ${cellCx(I_ON) + 6} 108 C ${cellCx(I_ON) + 70} 20, ${cellCx(I_ON) - 70} 20, ${cellCx(I_ON) - 6} 108`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} strokeDasharray="6 5" opacity={clamp01(g(scene.arcC) * 3)} />
              <polygon points={`${cellCx(I_ON) - 6},109 ${cellCx(I_ON) - 10.2},94.8 ${cellCx(I_ON) - 18.2},100.6`} fill={colors.POSITIVE} opacity={clamp01(g(scene.arcC) * 2 - 1)} />
              <text x={cellCx(I_ON)} y={30} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={clamp01(g(scene.arcC) * 2 - 1)}>
                program computes next
              </text>
            </g>
          )}
        </g>

        {/* ================= derived-wire rows ================= */}
        <g transform={`translate(0, ${rowsShift})`}>
          {/* rows 0–1: the edge wires (small affine operands kept as their own operations) */}
          {[
            [{ n: 'trackLeft', v: '614' }, { n: 'trackTop', v: '384' }],
            [{ n: 'trackLeft + 52', v: '666' }, { n: 'trackTop + 32', v: '416' }],
          ].map((chips, r) => {
            const op = rowOp(r);
            if (op <= 0.01) return null;
            let x = ROW_X + 10;
            return (
              <g key={r} opacity={op}>
                {chips.map((c) => {
                  const w = (c.n.length + c.v.length + 1) * 7.85 + 18;
                  const el = (
                    <g key={c.n}>
                      <rect x={x} y={ROW_Y(r) - 11} width={w} height={22} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                      <text x={x + 9} y={ROW_Y(r) + 4.5} fill={colors.TEXT} fontSize={13} fontFamily={MONO} xmlSpace="preserve">
                        {c.n} <tspan fill={colors.ACCENT} fontWeight={700}>{c.v}</tspan>
                      </text>
                    </g>
                  );
                  x += w + 10;
                  return el;
                })}
              </g>
            );
          })}
          {/* rows 2–5: four comparisons, two operations each */}
          {['x >= trackLeft', 'x < trackLeft + 52', 'y >= trackTop', 'y < trackTop + 32'].map((label, k) => {
            const r = k + 2;
            const op = rowOp(r);
            if (op <= 0.01) return null;
            const y = ROW_Y(r);
            const flyAway = clamp01(flyU * 1.6 - k * 0.2);
            return (
              <g key={r} opacity={op}>
                <rect x={ROW_X} y={y - 12} width={ROW_W} height={24} rx={5} fill={colors.PANEL} opacity={0.6} />
                <text x={ROW_X + 10} y={y + 5} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {label}
                </text>
                <ReluGlyph x={572} y={y - 8} />
                <line x1={598} y1={y} x2={608} y2={y} stroke={colors.SECONDARY} strokeWidth={1.4} />
                <ReluGlyph x={612} y={y - 8} />
                <circle cx={657} cy={y} r={9} fill={colors.SECONDARY} />
                <text x={657} y={y + 4.5} textAnchor="middle" fill="#08101f" fontSize={13} fontWeight={700} fontFamily={MONO}>
                  2
                </text>
                <BitDisc x={BIT_X} y={y} v={bitsU[k]} opacity={1 - 0.6 * flyAway * (flyU < 1 ? 1 : 0)} />
              </g>
            );
          })}
          {g(scene.opsTag) > 0.01 && (
            <text x={BIT_X + 22} y={ROW_Y(2) + 5} fill={colors.SECONDARY} fontSize={14} opacity={g(scene.opsTag)}>
              2 operations
            </text>
          )}
          {/* B3: why each comparison is 2 operations (tutorial.md:53) */}
          {g(scene.gridNote) > 0.01 && (
            <g opacity={g(scene.gridNote) * (1 - rowsOut)}>
              <rect x={ROW_X} y={ROW_Y(5) + 22} width={618} height={26} rx={6} fill={colors.PANEL} stroke={colors.SECONDARY} strokeDasharray="5 4" />
              <text x={ROW_X + 10} y={ROW_Y(5) + 39.5} fill={colors.TEXT} fontSize={13} fontFamily={MONO} xmlSpace="preserve">
                pointer on a 1/64 px grid · track edges on a 1/2 px grid <tspan fill={colors.SECONDARY} fontWeight={700}>→ 2 operations each</tspan>
              </text>
            </g>
          )}
          {/* rows 6–11 */}
          {[
            { r: 6, name: 'insideTrack(down)', expr: 'all of 4 bits', v: 1 },
            { r: 7, name: 'armedAfterDown', expr: 'select', v: 1 },
            { r: 8, name: 'insideTrack(up)', expr: '', v: 1, mini: true },
            { r: 9, name: 'gate', expr: 'all of 3 bits', v: 1 },
            { r: 10, name: 'on', expr: 'select · next on', v: 1 },
            { r: 11, name: 'armed', expr: 'all of 3 bits · next armed', v: 0 },
          ].map((row) => {
            const op = rowOp(row.r);
            if (op <= 0.01) return null;
            const y = ROW_Y(row.r);
            const isState = row.r === 10 || row.r === 11;
            return (
              <g key={row.r} opacity={op}>
                <rect x={ROW_X} y={y - 12} width={ROW_W} height={24} rx={5} fill={colors.PANEL} opacity={0.6} />
                <text x={ROW_X + 10} y={y + 5} fill={isState ? colors.POSITIVE : colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {row.name}
                </text>
                {row.expr && (
                  <text x={ROW_X + 10 + row.name.length * 8.43 + 14} y={y + 4.5} fill={colors.MUTED} fontSize={13}>
                    {row.expr}
                  </text>
                )}
                {row.mini && [0, 1, 2, 3].map((j) => <BitDisc key={j} x={560 + j * 18} y={y} v={1} r={6} showNum={false} />)}
                <BitDisc x={BIT_X} y={y} v={row.v} />
              </g>
            );
          })}
        </g>

        {/* ================= B4: and = relu(sum − (n − 1)) ================= */}
        {flyU > 0.01 && flyU < 1 &&
          [0, 1, 2, 3].map((k) => {
            const u = ease.move(clamp01(flyU * 1.6 - k * 0.2));
            if (u <= 0 || u >= 1) return null;
            const x = lerp(BIT_X, SUM.x, u);
            const y = lerp(ROW_Y(k + 2), SUM.y, u) - 30 * Math.sin(Math.PI * u);
            return <BitDisc key={k} x={x} y={y} v={1} />;
          })}
        <g opacity={1 - andOut}>
          {g(scene.sumU) > 0.01 && (
            <g opacity={clamp01(g(scene.sumU))}>
              <circle cx={SUM.x} cy={SUM.y} r={24} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
              <text x={SUM.x} y={SUM.y + 7} textAnchor="middle" fill={colors.WARM} fontSize={20} fontFamily={MONO} fontWeight={700}>
                4
              </text>
              <text x={SUM.x} y={SUM.y - 32} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                sum of bits
              </text>
            </g>
          )}
          <MathLabel tex={'4-3=1'} x={SUM.x + 36} y={SUM.y} anchor="start" fontSize={23} color={colors.POSITIVE} opacity={g(scene.eq4)} boxWidth={160} />
          <MathLabel tex={'\\mathrm{all}=\\mathrm{relu}\\Big(\\sum_i b_i-(n-1)\\Big)'} x={1040} y={230} fontSize={21} opacity={g(scene.allTex)} boxWidth={440} />
          {/* ghost run: one bit is 0 */}
          {g(scene.ghostU) > 0.01 && (
            <g opacity={g(scene.ghostU)}>
              {[0, 1, 2, 3].map((j) => (
                <BitDisc key={j} x={772 + j * 19} y={352} v={j === 3 ? 0 : 1} r={7} showNum={false} color={j === 3 ? colors.NEGATIVE : colors.WARM} />
              ))}
              <MathLabel tex={'3-3=0'} x={800} y={384} fontSize={20} color={colors.NEGATIVE} boxWidth={140} />
              <text x={800} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                if one bit is 0
              </text>
            </g>
          )}
        </g>
        {/* the relu plot (shared by B4 and B8) */}
        {g(scene.plotU) > 0.01 && (
          <g opacity={plotOp}>
            <Axes x={RX} y={RY} reveal={g(scene.plotU)} grid={false} xTicks={4} yTicks={1} fontSize={13} />
            <FunctionPlot x={RX} y={RY} f={RELU} reveal={g(scene.plotU)} color={colors.SECONDARY} width={2.6} />
            <MathLabel tex={'\\sum_i b_i-(n-1)'} x={RX(-1.6)} y={RY(0) + 44} fontSize={15} color={colors.MUTED} opacity={g(scene.plotU)} boxWidth={200} />
            {g(scene.markU) > 0.01 && (
              <g opacity={g(scene.markU)}>
                <circle cx={RX(markX)} cy={RY(RELU(markX))} r={8} fill={markX > 0.5 ? colors.POSITIVE : colors.NEGATIVE} />
                {/* relu = 1 sits below-right of its dot, clear of the y-axis */}
                <text x={markX > 0.5 ? RX(markX) + 14 : RX(markX) - 12} y={RY(RELU(markX)) + (markX > 0.5 ? 24 : -12)} textAnchor={markX > 0.5 ? 'start' : 'end'} fill={markX > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={15} fontFamily={MONO} fontWeight={700}>
                  {markX > 0.5 ? 'relu = 1' : 'relu = 0'}
                </text>
              </g>
            )}
            {g(scene.ghostU) > 0.01 && markX > 0.5 && (
              <g opacity={g(scene.ghostU) * (1 - andOut)}>
                <circle cx={RX(0)} cy={RY(0)} r={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.2} />
              </g>
            )}
          </g>
        )}
        {/* B8: armed = all(armedAfterDown, not(up.active), not(cancel)) */}
        {g(scene.b8U) > 0.01 && (
          <g opacity={g(scene.b8U)}>
            {[
              { n: 'armedAfterDown', v: 1 },
              { n: 'not(up.active)', v: 0 },
              { n: 'not(cancel)', v: 1 },
            ].map((b, i) => (
              <g key={i}>
                <text x={G.x} y={252 + i * 30} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  {b.n}
                </text>
                <BitDisc x={890} y={248 + i * 30} v={b.v} />
              </g>
            ))}
            <MathLabel tex={'2-2=0'} x={830} y={360} fontSize={23} color={colors.NEGATIVE} boxWidth={160} />
            <text x={830} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              the switch disarms
            </text>
          </g>
        )}

        {/* ================= B5–B7: the select gadget ================= */}
        <g opacity={g(scene.selOp)}>
          <MathLabel tex={'\\mathrm{gate}\\cdot\\mathrm{on}+(1-\\mathrm{gate})\\cdot\\mathrm{off}'} x={990} y={212} fontSize={21} opacity={clamp01(g(scene.selU)) * (1 - g(scene.gateTex)) * (1 - 0.65 * offSpot)} boxWidth={460} />
          <MathLabel tex={'\\mathrm{gate}=\\mathrm{relu}(3-2)=1'} x={990} y={212} fontSize={21} color={colors.WARM} opacity={g(scene.gateTex)} boxWidth={460} />
          <SelectGadget labels={['gate = down.active', 'off = armed', 'on = insideTrack(down)']} altLabels={['gate = all of 3 bits', 'off = cells.on', 'on = not(cells.on)']} swap={flipU} u={g(scene.selU)} offSpot={offSpot} opacity={1} />
          {/* instance B: a second input state (no press, armed was 1) — the on side is still computed */}
          {g(scene.selB) > 0.01 && (
            <g opacity={g(scene.selB)}>
              <text x={G.x} y={384} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                a second case: no press, armed was 1 · gate = 0
              </text>
              <Pill x={G.x} y={396} w={240} h={28} text="gate × on = 0 × 1 = 0" color={colors.POSITIVE} dashed opacity={0.35} />
              <text x={G.x + 250} y={414} fill={colors.MUTED} fontSize={13}>
                on is still computed
              </text>
              <Pill x={G.x} y={432} w={240} h={28} text="(1 − gate) × off = 1 × 1 = 1" color={colors.POSITIVE} />
              <circle cx={G.x + 266} cy={446} r={13} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={G.x + 266} y={450.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} fontWeight={700}>
                1
              </text>
              <text x={G.x + 288} y={450.5} fill={colors.MUTED} fontSize={13}>
                off passes
              </text>
            </g>
          )}
        </g>
        {/* B6: the old cell value feeds the select; the result is a new wire (the curve leaves the
            cell's right corner and passes between the "armed" and "springMatrix" labels) */}
        {g(scene.curveU) > 0.01 && (
          <path d={`M ${cellX(I_ARMED) + CELL_W - 2} 147 C ${cellX(I_ARMED) + CELL_W + 59} 182, 690 262, ${G.x - 2} 298`} fill="none" stroke={colors.WARM} strokeWidth={2.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g(scene.curveU)} />
        )}
        <g opacity={g(scene.tag1)}>
          <rect x={cellCx(I_ARMED) + 24} y={82} width={240} height={24} rx={6} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={cellCx(I_ARMED) + 34} y={99} fill={colors.WARM} fontSize={14} fontFamily={MONO}>
            cell armed = old value (0)
          </text>
        </g>
        <g opacity={g(scene.tag2)}>
          <rect x={BIT_X + 22} y={ROW_Y(7) - 12} width={366} height={24} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={BIT_X + 32} y={ROW_Y(7) + 5} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
            wire armedAfterDown = after the press (1)
          </text>
        </g>

        {/* ================= B9–B10: the spring as a matrix power ================= */}
        {springU > 0.01 && (
          <g opacity={springOp}>
            <text x={410} y={208} fill={colors.MUTED} fontSize={14}>
              spring state, one dot per 4 ms step
            </text>
            <Axes x={PX} y={PY} reveal={springU} grid={false} xTicks={7} yTicks={4} fontSize={13} />
            <text x={PX(-21) + 10} y={PY(230) - 4} fill={colors.MUTED} fontSize={13}>
              velocity, px/s
            </text>
            <text x={PX(-7)} y={PY(0) - 26} textAnchor="end" fill={colors.MUTED} fontSize={13}>
              displacement from the destination, px
            </text>
            {/* trail */}
            <g opacity={g(scene.trailOp)}>
              {PATH.slice(1).map((p, i) =>
                i + 1 <= trailN + 1e-6 ? <circle key={i} cx={PX(p[0])} cy={PY(p[1])} r={4} fill={colors.ACCENT} opacity={0.85} /> : null,
              )}
            </g>
            {g(scene.startU) > 0.01 && (
              <g opacity={g(scene.startU)}>
                <circle cx={PX(-20)} cy={PY(0)} r={6} fill="none" stroke={colors.TEXT} strokeWidth={2} />
                {/* right of the dot, below the M¹⁶ jump arrow's path */}
                <text x={PX(-20) + 26} y={PY(0) - 6} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  start (−20, 0)
                </text>
              </g>
            )}
            {trailN >= 15.99 && (
              <g opacity={1}>
                <text x={PX(PATH[16][0]) + 18} y={PY(PATH[16][1]) - 4} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  16 steps · 64 ms
                </text>
                <text x={PX(PATH[16][0]) + 18} y={PY(PATH[16][1]) + 14} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  ({fmt2(PATH[16][0])}, {fmt2(PATH[16][1])})
                </text>
              </g>
            )}
            {hop > 0.001 && <circle cx={hopX} cy={hopY} r={7} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={2} />}
            {/* B10: one jump by M^16 lands on the 16th dot */}
            <Vec x1={PX(-20)} y1={PY(0)} x2={PX(JUMP[0])} y2={PY(JUMP[1])} grow={ease.move(g(scene.jumpU))} color={colors.WARM} width={3} head={12} />
            {g(scene.jumpU) > 0.6 && (
              <MathLabel tex={'\\times\\,M^{16}'} x={lerp(PX(-20), PX(JUMP[0]), 0.55) + 46} y={lerp(PY(0), PY(JUMP[1]), 0.55) + 14} fontSize={20} color={colors.WARM} opacity={clamp01((g(scene.jumpU) - 0.6) / 0.4)} boxWidth={120} />
            )}
            {g(scene.jumpU) >= 1 && <circle cx={PX(JUMP[0])} cy={PY(JUMP[1])} r={11} fill="none" stroke={colors.WARM} strokeWidth={2} />}

            {/* matrix panel */}
            <MathLabel tex={"\\begin{pmatrix}d'\\\\v'\\end{pmatrix}=M\\begin{pmatrix}d\\\\v\\end{pmatrix}"} x={1020} y={252} fontSize={19} opacity={g(scene.eqM)} boxWidth={360} />
            {g(scene.matU) > 0.01 && (
              <g opacity={g(scene.matU)}>
                <MatrixGrid
                  x={MAT.x}
                  y={MAT.y}
                  cell={MAT.cell}
                  gap={MAT.gap}
                  values={[
                    [Math.sqrt(Math.min(1, Math.abs(matNow[0]) / BOUND)), Math.sqrt(Math.min(1, Math.abs(matNow[1]) / BOUND))],
                    [Math.sqrt(Math.min(1, Math.abs(matNow[2]) / BOUND)), Math.sqrt(Math.min(1, Math.abs(matNow[3]) / BOUND))],
                  ]}
                  fill={(v, i, j) => interpolateRgb('#0d1321', matNow[i * 2 + j] < 0 ? colors.NEGATIVE : colors.ACCENT)(0.18 + 0.5 * v)}
                />
                {matNow.map((m, i) => (
                  <text key={i} x={MAT.x + (i % 2) * (MAT.cell + MAT.gap) + MAT.cell / 2} y={MAT.y + Math.floor(i / 2) * (MAT.cell + MAT.gap) + MAT.cell / 2 + 6} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO} fontWeight={600}>
                    {fmt4(m)}
                  </text>
                ))}
                <MathLabel tex={`M^{${powerShown}}=`} x={MAT.x - 8} y={MAT.y + MAT.cell + MAT.gap / 2} anchor="end" fontSize={25} color={sq > 0.01 ? colors.WARM : colors.TEXT} boxWidth={120} />
                <text x={1020} y={MAT.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13} xmlSpace="preserve">
                  {POWER_N.map((n, i) => (
                    <tspan key={n} fill={n === powerShown ? colors.WARM : colors.MUTED} fontWeight={n === powerShown ? 700 : 400}>
                      {`M${['¹', '²', '⁴', '⁸', '¹⁶'][i]}`}
                      {i < 4 ? '  →  ' : ''}
                    </tspan>
                  ))}
                  <tspan fill={colors.MUTED}>{'   each a squaring'}</tspan>
                </text>
                <text x={1020} y={MAT.y + 2 * MAT.cell + MAT.gap + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  stiffness 650 · damping 45 · 4 ms step
                </text>
                <text x={1020} y={MAT.y + 2 * MAT.cell + MAT.gap + 42} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  every entry of Mⁿ, n ≤ 300, stays within ±{BOUND.toFixed(2)}
                </text>
              </g>
            )}
            {/* B10: JavaScript writes the power into the four springMatrix cells */}
            {g(scene.writeU) > 0.01 && (
              <g>
                <Vec x1={MAT.x + 55} y1={MAT.y - 30} x2={(cellCx(11) + cellCx(14)) / 2} y2={CELL_Y + CELL_H + 30} grow={g(scene.writeU)} color={colors.TEAL} width={2.6} head={10} />
                <text x={MAT.x + 40} y={232} fill={colors.TEAL} fontSize={14} opacity={clamp01(g(scene.writeU) * 2 - 1)}>
                  JavaScript writes
                </text>
              </g>
            )}
            {g(scene.opsU) > 0.01 && (
              <g>
                <Pill x={928} y={584} w={134} h={28} text="14 operations" color={colors.SECONDARY} textColor={colors.TEXT} fontSize={14} anchor="middle" opacity={clamp01(g(scene.opsU) * 2)} />
                <Pill x={1072} y={584} w={96} h={28} text="3 layers" color={colors.SECONDARY} textColor={colors.TEXT} fontSize={14} anchor="middle" opacity={clamp01(g(scene.opsU) * 2 - 1)} />
              </g>
            )}
          </g>
        )}

        {/* ================= B11: one fixed list ================= */}
        {closeU > 0.01 && (
          <g opacity={clamp01(closeU * 1.5 - 0.5)}>
            <text x={700} y={268} fill={colors.MUTED} fontSize={15}>
              one fixed list, every evaluation
            </text>
            {listItems.map((it, i) => {
              const u = ease.enter(clamp01(listU - i));
              if (u <= 0.01) return null;
              const glow = i === 0 ? pulse : pulse * 0.8;
              return (
                <g key={it.text} opacity={u} transform={`translate(${(1 - u) * 16}, 0)`}>
                  <rect x={700} y={284 + i * 60} width={240} height={46} rx={9} fill={colors.PANEL} stroke={it.color} strokeWidth={1.4 + 1.6 * glow} />
                  <rect x={700} y={284 + i * 60} width={5} height={46} rx={2.5} fill={it.color} />
                  <text x={722} y={314 + i * 60} fill={colors.TEXT} fontSize={20} fontWeight={600}>
                    {it.text}
                  </text>
                  {glow > 0.02 && <circle cx={920} cy={307 + i * 60} r={5} fill={it.color} opacity={glow} />}
                </g>
              );
            })}
            {/* evaluation ticks: T1 has a press, T2 and T3 do not; the list is the same each time */}
            <g opacity={clamp01(listU - 2)}>
              <text x={1000} y={268} fill={colors.MUTED} fontSize={13}>
                evaluations
              </text>
              <line x1={1000} y1={300} x2={1210} y2={300} stroke={colors.GRID} strokeWidth={1.5} />
              {evU.map((p, i) => {
                const x = 1030 + i * 80;
                const lit = p > 0.01;
                return (
                  <g key={i}>
                    <circle cx={x} cy={300} r={9} fill={lit ? colors.TEXT : colors.BG} stroke={colors.MUTED} strokeWidth={1.5} />
                    {p > 0 && p < 1 && <circle cx={x} cy={300} r={9 + 14 * p} fill="none" stroke={colors.TEXT} strokeWidth={1.5} opacity={1 - p} />}
                    <text x={x} y={328} textAnchor="middle" fill={lit ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={MONO}>
                      T{i + 1}
                    </text>
                    <text x={x} y={346} textAnchor="middle" fill={i === 0 ? colors.WARM : colors.MUTED} fontSize={13} opacity={lit ? 1 : 0.5}>
                      {i === 0 ? 'press' : 'no press'}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        )}
      </Camera>

      {/* ================= screen-space: header chips + code chip ================= */}
      <rect x={32} y={18} width={232} height={24} rx={6} fill={colors.BG} opacity={0.92} />
      <text x={40} y={35} fill={colors.MUTED} fontSize={15}>
        2 · A Switch of Arithmetic
      </text>
      <rect x={32} y={48} width={chipW} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={42} y={63} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
        {chip}
      </text>
      <CodeChip idx={codeIdx} u={codeU} />
      </g>
    </>
  );
}

export const vizScene = () => scene;
