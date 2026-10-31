// The Sign Cascade
//
// Picking Exactly — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/cascade-argmax/README.md:3 (exact, leftmost winner on ties)
//   lab/cascade-argmax/cascade-argmax.ts:7-12 (relu of the difference, power-of-two scaling, clamp01 exact below 2**24,
//     no boolean atom), 26-31 (seven stages, total gain 2**161 saturates 2**-149; rampOffset 0 keeps ties left),
//     38-42 (cascadeStageCount = 7, hardCascadeOptions: fill(2 ** 23), rampOffset: 0), 55-59 (roundAffine rounding
//     points), 61-67 (emitClampZeroOne), 72-87 (emitCascadeGreaterBit)
//   lab/cascade-argmax/cascade-argmax.test.ts:54-68 (ties and subnormal gaps), 137-149 (the planted 0.5 + one step),
//     164-172 (cascade.boolean === 0)
//   lab/cascade-argmax/report.ts:44-54 (the report's boolean column)
//   src/runtime/numeric-ui-core.ts:410-420 (affine, roundAffine preserveRounding), 445-447 (reglu)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every value on the ladder is computed below by a float32 port of emitCascadeGreaterBit (the
// hard form: seven roundAffine multiplies by 2**23, each followed by clamp01 = v - relu(v - 1)), and the module
// throws if the exponent chain ever differs from the lab's: -149, -126, ..., -11, +12, then exactly 1. The bit
// strings are Float32Array encodings of the two opening scores. One correction to the plan: 2**-149 is subnormal, so
// its stored mantissa bits do change on the first multiply; the readout shows the value as 1 × 2^e instead.
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH14 = 8.4; // mono advance at 14 px

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// The hard cascade in float32 (cascade-argmax.ts:40-42, 61-67, 72-87), exact
// ---------------------------------------------------------------------------

const f32 = Math.fround;
const relu = (x: number): number => (x > 0 ? x : 0);
const STAGE_COUNT = 7; // cascadeStageCount
const STAGE_SCALE = f32(2 ** 23); // hardCascadeOptions: fill(2 ** 23)

/** clamp01(v) = v - relu(v - 1), as emitClampZeroOne builds it (reglu then roundAffine) */
const clamp01Circuit = (v: number): number => f32(v - f32(relu(f32(v - 1))));

type Trace = { start: number; stages: Array<{ mul: number; clamp: number }>; bit: number };
function cascade(left: number, right: number): Trace {
  // relu(right - left + rampOffset), rampOffset 0 in the hard form
  let v = f32(relu(f32(f32(right) - f32(left))));
  const start = v;
  const stages: Trace['stages'] = [];
  for (let k = 0; k < STAGE_COUNT; k++) {
    const mul = f32(v * STAGE_SCALE);
    const clamp = clamp01Circuit(mul);
    stages.push({ mul, clamp });
    v = clamp;
  }
  return { start, stages, bit: v };
}

/** exact base-2 exponent of a power of two (throws otherwise) */
const exp2 = (v: number): number => {
  const e = Math.round(Math.log2(v));
  if (2 ** e !== v) throw new Error(`not a power of two: ${v}`);
  return e;
};

const STEP = 2 ** -24; // one float32 step above 0.5 (cascade-argmax.test.ts:137-149)
const HALF_UP = f32(0.5 + STEP);
const SMALL = cascade(0, 2 ** -149); // the smallest positive gap: bit(0, 2**-149)
const NEAR = cascade(0.5, HALF_UP); // the opening pair: right one step above left
const TIE = cascade(0.5, 0.5);
const LEFT_WINS = cascade(HALF_UP, 0.5);

const SMALL_EXPS = SMALL.stages.map((st) => exp2(st.mul));
if (exp2(SMALL.start) !== -149 || SMALL_EXPS.join() !== '-126,-103,-80,-57,-34,-11,12' || SMALL.bit !== 1) {
  throw new Error('smallest-gap chain disagrees with the lab');
}
if (exp2(NEAR.start) !== -24 || NEAR.stages[0].clamp !== 0.5 || NEAR.stages[1].clamp !== 1 || NEAR.bit !== 1) {
  throw new Error('near pair should saturate at stage 2');
}
if (TIE.bit !== 0 || LEFT_WINS.bit !== 0 || TIE.stages.some((st) => st.mul !== 0)) throw new Error('tie must stay 0');
const TOTAL_GAIN_EXP = 23 * STAGE_COUNT; // 161
const CLAMP_DEMO = [0.4, 3.2].map((v) => ({ v, out: clamp01Circuit(f32(v)) }));
if (CLAMP_DEMO[0].out !== f32(0.4) || CLAMP_DEMO[1].out !== 1) throw new Error('clamp demo');

/** float32 bit pattern "s eeeeeeee mmm…" */
const bits32 = (x: number): string => {
  const b = new Uint32Array(new Float32Array([x]).buffer)[0].toString(2).padStart(32, '0');
  return `${b[0]} ${b.slice(1, 9)} ${b.slice(9)}`;
};
const BITS_L = bits32(0.5);
const BITS_R = bits32(HALF_UP);
if (BITS_L.slice(0, -1) !== BITS_R.slice(0, -1) || BITS_L.at(-1) !== '0' || BITS_R.at(-1) !== '1') {
  throw new Error('the opening pair should differ only in the last bit');
}
const STEP_SCI = STEP.toExponential(2); // 5.96e-8

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// B1 · two score bars
const BAR = { base: 440, unit: 300, w: 80, xl: 470, xr: 810 };
const BITS_Y = 478;
const bitsX = (cx: number) => cx - (BITS_L.length * CH14) / 2;

// B2 · three operation cards and the hinge
const CARD = { y: 96, w: 330, h: 140, xs: [270, 640, 1010] };
const CARDS = [
  { title: 'weighted sum', fn: 'circuit.affine', tex: '\\textstyle\\sum_i w_i x_i + b' },
  { title: 'relu', fn: 'relu(x)', tex: '\\max(0,\\, x)' },
  { title: 'gated product', fn: 'circuit.reglu', tex: '\\mathrm{left}\\cdot\\mathrm{relu}(\\mathrm{gate})' },
];
const HINGE = { ox: 640, oy: 440, unit: 150 };

// B3/B4 · the three cases (rows persist from the truth table into the relu rows)
const ROW_Y = [290, 355, 420];
const ROWS = [
  { label: 'right > left', want: 1, expr: 'relu((0.5 + 2**-24) − 0.5)', out: '2**-24', value: NEAR.start },
  { label: 'right < left', want: 0, expr: 'relu(0.5 − (0.5 + 2**-24))', out: '0', value: LEFT_WINS.start },
  { label: 'tie', want: 0, expr: 'relu(0.5 − 0.5)', out: '0', value: TIE.start },
];
const TRACK = { x: 740, w: 320 };

// B5+ · the magnifier ladder: x = stage column, y = log2 of the value
const COL0 = 490;
const COLW = 98;
const colX = (k: number) => COL0 + k * COLW;
const E_LO = -152;
const E_HI = 26;
const Y_LO = 512;
const Y_HI = 112;
const Y = (e: number) => Y_LO - ((e - E_LO) * (Y_LO - Y_HI)) / (E_HI - E_LO);
const FLOOR_Y = 540; // exact zero sits off the log scale, on its own lane
const AXIS_X = 440;
const RIGHT_X = 1222;
const CELL = { y: 568, w: 84, h: 42 };
const yOf = (v: number) => (v === 0 ? FLOOR_Y : Y(exp2(v)));

type Pt = { x: number; y: number; label?: string };
/** a trace as ladder waypoints: input, then each multiply and each clamp that moved the value */
function waypoints(tr: Trace, labels: (e: number, kind: 'start' | 'mul' | 'clamp', k: number) => string | undefined): Pt[] {
  const pts: Pt[] = [{ x: colX(0), y: yOf(tr.start), label: tr.start > 0 ? labels(exp2(tr.start), 'start', 0) : undefined }];
  tr.stages.forEach((st, i) => {
    const x = colX(i + 1);
    const add = (v: number, kind: 'mul' | 'clamp') => {
      const last = pts[pts.length - 1];
      const y = yOf(v);
      if (last.x === x && last.y === y) return;
      pts.push({ x, y, label: v > 0 ? labels(exp2(v), kind, i + 1) : undefined });
    };
    add(st.mul, 'mul');
    add(st.clamp, 'clamp');
  });
  return pts;
}
const SMALL_PTS = waypoints(SMALL, (e, kind) => (kind === 'clamp' ? 'exactly 1' : kind === 'start' ? undefined : `2**${e}`));
const NEAR_PTS = waypoints(NEAR, () => undefined);
const TIE_PTS = waypoints(TIE, () => undefined);
if (SMALL_PTS.length !== 9 || NEAR_PTS.length !== 14 || TIE_PTS.length !== 8) throw new Error('ladder waypoints');

// the comparator panel (left of the ladder)
const PANEL = { x: 50, y: 150, w: 320, h: 300 };
const PAIRS = [
  { l: '0.5', r: '0.5 + 2**-24', bit: NEAR.bit },
  { l: '0', r: '2**-149', bit: SMALL.bit },
  { l: '0.5', r: '0.5', bit: TIE.bit },
];

// B7 · the clamp inset
const INSET = { x: 800, y: 226, w: 410, h: 254 };
const CX = (v: number) => 845 + v * 95; // v ∈ [0, 3.5]
const CY = (v: number) => 432 - v * 78;

const HOME: CameraState = CAMERA_HOME;
const CAM_BITS: CameraState = { x: 700, y: 440, k: 1.6 };
const CAM_TABLE: CameraState = { x: 430, y: 330, k: 1.3 };
const CAM_ROWS: CameraState = { x: 640, y: 340, k: 1.18 };
const CAM_LOW: CameraState = { x: 790, y: 402, k: 1.25 };
const CAM_CLAMP: CameraState = { x: 800, y: 402, k: 1.25 };
const CAM_STRIP: CameraState = { x: 810, y: 402, k: 1.25 };
const CAM_TOP: CameraState = { x: 720, y: 380, k: 1.15 };
const CAM_PAYOFF: CameraState = { x: 640, y: 345, k: 0.94 };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, each timed at ~150 words per minute
// ---------------------------------------------------------------------------

const HOLD = 0.6;
const speak = (text: string): number => Math.round((text.split(/\s+/).length * 0.4 + 0.3) * 10) / 10;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', HOME, cameraInterp);
  let t = 0.4;
  /** one caption = one spoken line; returns its start and leaves reading room after it */
  const say = (text: string): number => {
    const at = t;
    const dur = speak(text);
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, HOLD);
    return at;
  };

  // B1
  const barsU = tl.channel('barsU', 0);
  const barsOp = tl.channel('barsOp', 1);
  const qU = tl.channel('questionU', 0);
  const bitsU = tl.channel('bitsU', 0);
  const lastU = tl.channel('lastBitU', 0);
  // B2
  const cardsU = tl.channel('cardsU', 0);
  const cardsOp = tl.channel('cardsOp', 1);
  const reluSpot = tl.channel('reluSpot', 0);
  const hingeU = tl.channel('hingeU', 0);
  const posU = tl.channel('hingePosU', 0);
  const negU = tl.channel('hingeNegU', 0);
  const hingeOp = tl.channel('hingeOp', 1);
  // B3/B4
  const rowsU = tl.channel('rowsU', 0);
  const rowsOp = tl.channel('rowsOp', 1);
  const wantOp = tl.channel('wantOp', 0);
  const tieGlow = tl.channel('tieGlow', 0);
  const texRelu = tl.channel('texRelu', 0);
  const exprU = tl.channel('exprU', 0);
  const sliverU = tl.channel('sliverU', 0);
  // B5+ ladder
  const axisU = tl.channel('axisU', 0);
  const cellsU = tl.channel('cellsU', 0);
  const ladderOp = tl.channel('ladderOp', 1);
  const aboveU = tl.channel('aboveLabel', 0);
  const panelU = tl.channel('panelU', 0);
  const panelOp = tl.channel('panelOp', 1);
  const pair = tl.channel('pair', 0);
  const bitOn = tl.channel('bitOn', 0);
  const beadU = tl.channel('beadU', 0);
  const dropE = tl.channel('dropE', -24);
  const rulerU = tl.channel('rulerU', 0);
  const minTag = tl.channel('minTag', 0);
  const cell1 = tl.channel('cell1Lit', 0);
  const climb = tl.channel('climb', 0);
  const readU = tl.channel('readoutU', 0);
  const readNote = tl.channel('readoutNote', 0);
  const gate1 = tl.channel('gate1Glow', 0);
  const insetU = tl.channel('insetU', 0);
  const insetPlot = tl.channel('insetPlot', 0);
  const demoA = tl.channel('demoA', 0);
  const demoB = tl.channel('demoB', 0);
  const boundU = tl.channel('boundU', 0);
  const locksU = tl.channel('locksU', 0);
  const lockLbl = tl.channel('lockLabel', 0);
  const ghostU = tl.channel('ghostU', 0);
  const strikeU = tl.channel('strikeU', 0);
  const sweep = tl.channel('sweep', 0);
  const sweepOp = tl.channel('sweepOp', 1);
  const gainU = tl.channel('gainU', 0);
  const endU = tl.channel('endU', 0);
  const smallOp = tl.channel('smallOp', 1);
  const nearU = tl.channel('nearU', 0);
  const nearLbl = tl.channel('nearLabel', 0);
  const tieU = tl.channel('tieU', 0);
  const tieLbl = tl.channel('tieLabel', 0);
  const nearOp = tl.channel('nearOp', 1);
  // B12
  const cardU = tl.channel('payoffU', 0);
  const chipsU = tl.channel('payoffChips', 0);
  const zeroU = tl.channel('booleanZero', 0);

  // — B1 · two scores, one bit apart —
  let T = say('Picking the biggest of several scores sounds easy. Inside a handwired circuit it has to be exact, even when two scores differ only in their very last bit.');
  tl.tween(barsU, 1, { at: T + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(qU, 1, { at: T + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_BITS, { at: T + 4.0, dur: 1.4, ease: ease.move });
  tl.tween(bitsU, 1, { at: T + 4.6, dur: 0.8, ease: ease.enter });
  tl.tween(lastU, 1, { at: T + 7.6, dur: 0.6, ease: ease.pop });
  tl.tween(cam, HOME, { at: T + 10.6, dur: 1.2, ease: ease.move });

  // — B2 · the only operations: sums, relu, gated products —
  T = say('The circuit has only weighted sums, relu, and products gated by a relu. Relu keeps a positive number as it is and turns a negative one into zero.');
  tl.tween(barsOp, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(qU, 0, { at: T, dur: 0.5, ease: ease.move });
  tl.tween(cardsU, 1, { at: T + 0.4, dur: 2.2, ease: ease.linear });
  tl.tween(reluSpot, 1, { at: T + 5.0, dur: 0.6, ease: ease.move });
  tl.tween(hingeU, 1, { at: T + 5.4, dur: 1.2, ease: ease.draw });
  tl.tween(posU, 1, { at: T + 7.0, dur: 0.6, ease: ease.enter });
  tl.tween(negU, 1, { at: T + 9.0, dur: 0.6, ease: ease.enter });

  // — B3 · the bit we want —
  T = say('We want one bit from two scores: one if the right score is strictly larger, zero otherwise. A tie must give zero, so the left candidate wins.');
  for (const ch of [cardsOp, hingeOp]) tl.tween(ch, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_TABLE, { at: T + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(rowsU, 1, { at: T + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(wantOp, 1, { at: T + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(tieGlow, 1, { at: T + 7.0, dur: 0.6, ease: ease.enter });

  // — B4 · relu of the gap —
  T = say('Step one is relu of the right score minus the left. That is zero for a tie or a left win, and positive for a right win, but possibly absurdly small.');
  tl.tween(wantOp, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(tieGlow, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_ROWS, { at: T + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(texRelu, 1, { at: T + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(exprU, 1, { at: T + 1.4, dur: 1.6, ease: ease.linear });
  tl.tween(sliverU, 1, { at: T + 9.0, dur: 0.6, ease: ease.enter });

  // — B5 · the ladder: the smallest gap sits at 2**-149 —
  T = say('How small? The smallest positive gap between thirty-two-bit floats is two to the minus one hundred forty-nine. Nothing downstream would call that a one.');
  for (const ch of [rowsOp, texRelu]) tl.tween(ch, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(cam, HOME, { at: T, dur: 1.0, ease: ease.move });
  tl.tween(axisU, 1, { at: T + 0.3, dur: 1.4, ease: ease.draw });
  tl.tween(cellsU, 1, { at: T + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(beadU, 1, { at: T + 1.2, dur: 0.5, ease: ease.enter });
  tl.set(pair, 1, T + 3.0);
  tl.tween(dropE, -149, { at: T + 3.0, dur: 1.4, ease: ease.move });
  tl.tween(minTag, 1, { at: T + 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_LOW, { at: T + 5.0, dur: 1.4, ease: ease.move });
  tl.tween(rulerU, 1, { at: T + 6.4, dur: 1.0, ease: ease.draw });

  // — B6 · ×2**23 shifts the exponent —
  T = say('So the circuit multiplies by two to the twenty-third. Multiplying by a power of two only shifts the exponent, so the gap grows without losing any precision.');
  tl.tween(rulerU, 0, { at: T, dur: 0.5, ease: ease.move });
  tl.tween(minTag, 0, { at: T, dur: 0.5, ease: ease.move });
  tl.tween(cell1, 1, { at: T + 0.6, dur: 0.5, ease: ease.enter });
  tl.tween(readU, 1, { at: T + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(climb, 1, { at: T + 2.2, dur: 1.2, ease: ease.move });
  tl.tween(readNote, 1, { at: T + 4.6, dur: 0.6, ease: ease.enter });

  // — B7 · the clamp —
  T = say('Then a clamp caps the value at one. The clamp is the value minus relu of the value minus one, and it stays exact for anything below two to the twenty-fourth.');
  for (const ch of [readU, readNote, cell1]) tl.tween(ch, 0, { at: T, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_CLAMP, { at: T + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(gate1, 1, { at: T + 0.8, dur: 0.5, ease: ease.enter });
  tl.tween(insetU, 1, { at: T + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(insetPlot, 1, { at: T + 2.6, dur: 1.2, ease: ease.draw });
  tl.tween(demoA, 1, { at: T + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(demoB, 1, { at: T + 5.4, dur: 1.0, ease: ease.move });
  tl.tween(boundU, 1, { at: T + 8.4, dur: 0.6, ease: ease.enter });

  // — B8 · every stage is its own rounding point —
  T = say('Each multiply and each clamp is marked as its own rounding point, one the simplifier may not merge away. Otherwise the stages would collapse into one formula.');
  for (const ch of [insetU, gate1]) tl.tween(ch, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_STRIP, { at: T + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(locksU, 1, { at: T + 1.0, dur: 1.6, ease: ease.linear });
  tl.tween(lockLbl, 1, { at: T + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(ghostU, 1, { at: T + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: T + 8.4, dur: 0.5, ease: ease.draw });
  tl.tween(ghostU, 0, { at: T + 9.8, dur: 0.6, ease: ease.move });

  // — B9 · seven stages: 2**161 —
  T = say('Seven multiplies by two to the twenty-third give a total gain of two to the hundred sixty-one. Watch the smallest gap climb through the stages.');
  tl.tween(lockLbl, 0, { at: T, dur: 0.5, ease: ease.move });
  tl.tween(cam, HOME, { at: T, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 1, { at: T + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(sweep, STAGE_COUNT, { at: T + 0.6, dur: 3.5, ease: ease.linear });
  tl.tween(gainU, 1, { at: T + 2.6, dur: 0.6, ease: ease.enter });

  // — B10 · the climb, then the final clamp —
  T = say('After the first multiply it is two to the minus one hundred twenty-six. After the seventh it is two to the twelfth, and the final clamp pins it at exactly one.');
  for (const ch of [gainU, sweepOp]) tl.tween(ch, 0, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(panelOp, 0.12, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_TOP, { at: T + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(aboveU, 1, { at: T + 7.0, dur: 0.6, ease: ease.enter });
  for (let k = 2; k <= STAGE_COUNT; k++) tl.tween(climb, k, { at: T + 1.6 + (k - 2) * 0.95, dur: 0.8, ease: ease.move });
  tl.tween(climb, STAGE_COUNT + 1, { at: T + 8.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: T + 9.4, dur: 0.5, ease: ease.pop });
  tl.set(bitOn, 1, T + 9.4);

  // — B11 · a bigger gap, and a tie —
  T = say('A bigger gap saturates earlier and stays at one. A tie is zero, and zero times anything is still zero, so the left candidate keeps its win.');
  tl.tween(cam, HOME, { at: T, dur: 1.2, ease: ease.move });
  tl.tween(smallOp, 0.12, { at: T, dur: 0.6, ease: ease.move });
  tl.tween(panelOp, 1, { at: T, dur: 0.6, ease: ease.move });
  tl.set(bitOn, 0, T + 0.5);
  tl.set(pair, 0, T + 0.5);
  tl.tween(nearU, NEAR_PTS.length - 1, { at: T + 0.9, dur: 3.6, ease: ease.linear });
  tl.tween(nearLbl, 1, { at: T + 2.0, dur: 0.6, ease: ease.enter });
  tl.set(bitOn, 1, T + 4.5);
  tl.tween(nearOp, 0.12, { at: T + 4.8, dur: 0.6, ease: ease.move });
  tl.set(bitOn, 0, T + 5.0);
  tl.set(pair, 2, T + 5.0);
  tl.tween(tieU, TIE_PTS.length - 1, { at: T + 5.4, dur: 2.8, ease: ease.linear });
  tl.tween(tieLbl, 1, { at: T + 6.0, dur: 0.6, ease: ease.enter });
  tl.set(bitOn, 1, T + 8.2);

  // — B12 · pull back: a bit with no boolean atom —
  T = say("The result is a bit made only of sums, relu, and scaling. The lab's report counts zero boolean atoms in it.");
  for (const ch of [ladderOp, panelOp]) tl.tween(ch, 0.12, { at: T, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_PAYOFF, { at: T + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(cardU, 1, { at: T + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(chipsU, 1, { at: T + 1.4, dur: 1.4, ease: ease.linear });
  tl.tween(zeroU, 1, { at: T + 5.0, dur: 0.5, ease: ease.pop });
  tl.hold(t, 1.4);

  return {
    tl, cam, barsU, barsOp, qU, bitsU, lastU, cardsU, cardsOp, reluSpot, hingeU, posU, negU, hingeOp,
    rowsU, rowsOp, wantOp, tieGlow, texRelu, exprU, sliverU,
    axisU, cellsU, ladderOp, aboveU, panelU, panelOp, pair, bitOn, beadU, dropE, rulerU, minTag, cell1, climb, readU, readNote,
    gate1, insetU, insetPlot, demoA, demoB, boundU, locksU, lockLbl, ghostU, strikeU, sweep, sweepOp, gainU,
    endU, smallOp, nearU, nearLbl, tieU, tieLbl, nearOp, cardU, chipsU, zeroU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

/** The bit: amber disc when 1, ring when 0. */
function BitDisc({ cx, cy, b, r = 12, opacity = 1 }: { cx: number; cy: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={b >= 1 ? colors.WARM : colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={b >= 1 ? '#1a1206' : colors.WARM}>
        {b >= 1 ? '1' : '0'}
      </text>
    </g>
  );
}

/** Small padlock: a rounding point the simplifier may not merge. */
function Lock({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <path d={`M ${x - 3} ${y - 2} v -3 a 3 3 0 0 1 6 0 v 3`} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
      <rect x={x - 5} y={y - 2} width={10} height={8} rx={1.5} fill={colors.WARM} />
    </g>
  );
}

/** A trace drawn up to progress u along its waypoints, with its bead at the head. */
function Trail({ pts, u, color, opacity, labels = true, bead = 1 }: {
  pts: Pt[]; u: number; color: string; opacity: number; labels?: boolean; bead?: number;
}) {
  if (opacity <= 0.005 || u < 0) return null;
  const i = Math.min(pts.length - 1, Math.floor(u));
  const f = u - i;
  const a = pts[i];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  const head = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
  const line = [...pts.slice(0, i + 1), head].map((p) => `${p.x},${p.y}`).join(' ');
  const out: ReactNode[] = [];
  if (labels) {
    pts.forEach((p, k) => {
      if (!p.label || k === 0) return;
      const op = clamp01((u - k + 0.25) * 4);
      if (op <= 0.005) return;
      const isEnd = p.label === 'exactly 1';
      const above = !isEnd && p.y < Y(0); // the overshoot sits by the final ring: label it on the left
      out.push(
        <text key={k} x={isEnd ? p.x : above ? p.x - 14 : p.x + 10} y={isEnd ? p.y + 28 : above ? p.y + 5 : p.y + 19} textAnchor={isEnd ? 'middle' : above ? 'end' : 'start'} fontSize={isEnd ? 15 : 13} fontWeight={isEnd ? 700 : 400} fontFamily={MONO} fill={isEnd ? colors.WARM : colors.TEXT} opacity={op}>
          {p.label}
        </text>,
      );
    });
  }
  return (
    <g opacity={opacity}>
      <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      {pts.slice(1, i + 1).map((p, k) => (
        <circle key={k} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
      {bead > 0.005 && (
        <g opacity={bead}>
          <circle cx={head.x} cy={head.y} r={15} fill={color} opacity={0.18} />
          <circle cx={head.x} cy={head.y} r={7.5} fill={color} stroke={colors.BG} strokeWidth={1.5} />
        </g>
      )}
      {out}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const barsU = v(scene.barsU);
  const barsOp = v(scene.barsOp);
  const bitsU = v(scene.bitsU);
  const lastU = v(scene.lastU);
  const cardsU = v(scene.cardsU);
  const cardsOp = v(scene.cardsOp);
  const reluSpot = v(scene.reluSpot);
  const hingeU = v(scene.hingeU);
  const hingeOp = v(scene.hingeOp);
  const rowsU = v(scene.rowsU);
  const rowsOp = v(scene.rowsOp);
  const wantOp = v(scene.wantOp);
  const exprU = v(scene.exprU);

  const axisU = v(scene.axisU);
  const ladderOp = v(scene.ladderOp);
  const panelOp = v(scene.panelU) * v(scene.panelOp) * ladderOp;
  const pairIdx = Math.max(0, Math.min(PAIRS.length - 1, Math.round(v(scene.pair))));
  const P = PAIRS[pairIdx];
  const climb = v(scene.climb);
  const dropE = v(scene.dropE);
  const sweep = v(scene.sweep);
  const sweepOp = v(scene.sweepOp);
  const locksU = v(scene.locksU);
  const nearU = v(scene.nearU);
  const tieU = v(scene.tieU);

  // the smallest gap's ladder: its input point follows the B5 drop (2**-24 → 2**-149)
  const smallPts = SMALL_PTS.map((p, k) => (k === 0 ? { ...p, y: Y(dropE) } : p));
  const head0 = smallPts[0];
  const dropLabel = dropE > -24.5 ? '2**-24' : dropE < -148.5 ? '2**-149' : '';

  /** how lit stage cell k is (B6: the first gear; B9: the sweep; B10: the bead passing) */
  const cellLit = (k: number): number =>
    Math.max(
      k === 1 ? v(scene.cell1) : 0,
      clamp01(sweep - (k - 1)) * sweepOp,
      climb >= 1.5 ? clamp01(1 - Math.abs(climb - k)) : 0,
    );
  const gateGlow = (k: number): number => Math.max(k === 1 ? v(scene.gate1) : 0, k === STAGE_COUNT ? clamp01(1 - Math.abs(climb - 8)) : 0);
  const readE = climb < 0.5 ? -149 : -126;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B1 · two scores, one bit apart ================= */}
        {barsU > 0.005 && barsOp > 0.005 && (
          <g opacity={barsOp}>
            <line x1={BAR.xl - 110} y1={BAR.base} x2={BAR.xr + 110} y2={BAR.base} stroke={colors.MUTED} strokeWidth={1.5} opacity={barsU} />
            {[
              { x: BAR.xl, value: 0.5, label: 'left = 0.5', bits: BITS_L, color: colors.ACCENT },
              { x: BAR.xr, value: HALF_UP, label: 'right = 0.5 + 2**-24', bits: BITS_R, color: colors.TEAL },
            ].map((b, i) => {
              const h = b.value * BAR.unit * barsU;
              const bx = bitsX(b.x);
              return (
                <g key={i}>
                  <rect x={b.x - BAR.w / 2} y={BAR.base - h} width={BAR.w} height={h} rx={3} fill={b.color} opacity={0.85} />
                  <text x={b.x} y={BAR.base - BAR.unit * 0.5 - 16} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT} opacity={barsU}>
                    {b.label}
                  </text>
                  {bitsU > 0.005 && (
                    <g opacity={bitsU}>
                      <text x={bx} y={BITS_Y} fontSize={14} fontFamily={MONO} fill={colors.MUTED} xmlSpace="preserve">
                        {b.bits.slice(0, -1)}
                        <tspan fill={colors.WARM} fontWeight={700}>{b.bits.at(-1)}</tspan>
                      </text>
                      {lastU > 0.005 && (
                        <rect x={bx + (b.bits.length - 1) * CH14 - 3} y={BITS_Y - 15} width={CH14 + 6} height={21} rx={4} fill="none" stroke={colors.WARM} strokeWidth={1.8} opacity={lastU} />
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            {bitsU > 0.005 && (
              <g opacity={bitsU} fontSize={12} fill={colors.MUTED} textAnchor="middle">
                <text x={bitsX(BAR.xl) + CH14 * 0.5} y={BITS_Y + 22}>sign</text>
                <text x={bitsX(BAR.xl) + CH14 * 6} y={BITS_Y + 22}>exponent</text>
                <text x={bitsX(BAR.xl) + CH14 * 22.5} y={BITS_Y + 22}>mantissa (23 bits)</text>
              </g>
            )}
            {lastU > 0.005 && (
              <text x={bitsX(BAR.xr) + BITS_R.length * CH14} y={BITS_Y + 24} textAnchor="end" fontSize={14} fill={colors.WARM} opacity={lastU}>
                only the last bit differs
              </text>
            )}
            <text x={640} y={350} textAnchor="middle" fontSize={56} fontWeight={700} fill={colors.WARM} opacity={v(scene.qU)}>
              ?
            </text>
          </g>
        )}

        {/* ================= B2 · weighted sums, relu, gated products ================= */}
        {cardsU > 0.005 && cardsOp > 0.005 && (
          <g opacity={cardsOp}>
            {CARDS.map((c, i) => {
              const u = staggerU(cardsU, i, 3, 0.5, 1.2);
              if (u <= 0.005) return null;
              const op = u * (i === 1 ? 1 : lerp(1, 0.12, reluSpot));
              const x = CARD.xs[i] - CARD.w / 2;
              return (
                <g key={i} opacity={op} transform={`translate(0, ${(1 - u) * 14})`}>
                  <rect x={x} y={CARD.y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={i === 1 ? colors.SECONDARY : colors.GRID} strokeWidth={i === 1 ? 1.5 + reluSpot : 1.5} />
                  <text x={CARD.xs[i]} y={CARD.y + 30} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
                    {c.title}
                  </text>
                  <text x={CARD.xs[i]} y={CARD.y + 52} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {c.fn}
                  </text>
                  <MathLabel tex={c.tex} x={CARD.xs[i]} y={CARD.y + 98} fontSize={22} boxWidth={CARD.w - 20} color={i === 1 ? colors.SECONDARY : colors.TEXT} />
                </g>
              );
            })}
          </g>
        )}
        {hingeU > 0.005 && hingeOp > 0.005 && (
          <g opacity={hingeOp}>
            <line x1={HINGE.ox - HINGE.unit - 20} y1={HINGE.oy} x2={HINGE.ox + HINGE.unit + 20} y2={HINGE.oy} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7} />
            <line x1={HINGE.ox} y1={HINGE.oy + 10} x2={HINGE.ox} y2={HINGE.oy - HINGE.unit - 20} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7} />
            {(() => {
              const len = HINGE.unit + HINGE.unit * Math.SQRT2;
              return (
                <path
                  d={`M ${HINGE.ox - HINGE.unit} ${HINGE.oy} L ${HINGE.ox} ${HINGE.oy} L ${HINGE.ox + HINGE.unit} ${HINGE.oy - HINGE.unit}`}
                  fill="none"
                  stroke={colors.SECONDARY}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - hingeU)}
                />
              );
            })()}
            <circle cx={HINGE.ox} cy={HINGE.oy} r={8} fill={colors.WARM} opacity={clamp01(hingeU * 2 - 1)} />
            <text x={HINGE.ox + 90} y={HINGE.oy - 112} textAnchor="end" fontSize={15} fill={colors.TEXT} opacity={v(scene.posU)}>
              positive: kept as is
            </text>
            <text x={HINGE.ox - 80} y={HINGE.oy - 16} textAnchor="middle" fontSize={15} fill={colors.TEXT} opacity={v(scene.negU)}>
              negative: becomes 0
            </text>
          </g>
        )}

        {/* ================= B3/B4 · three cases: the bit we want, then relu(right − left) ================= */}
        {rowsU > 0.005 && rowsOp > 0.005 && (
          <g opacity={rowsOp}>
            <text x={520} y={ROW_Y[0] - 46} textAnchor="middle" fontSize={14} fill={colors.MUTED} opacity={wantOp}>
              bit we want
            </text>
            <text x={TRACK.x} y={ROW_Y[0] - 46} fontSize={13} fill={colors.MUTED} opacity={exprU}>
              the result on a 0-to-1 bar
            </text>
            {v(scene.tieGlow) > 0.005 && (
              <rect x={160} y={ROW_Y[2] - 26} width={520} height={40} rx={8} fill={colors.WARM} opacity={0.12 * v(scene.tieGlow)} stroke={colors.WARM} strokeOpacity={0.6 * v(scene.tieGlow)} />
            )}
            {ROWS.map((r, i) => {
              const u = staggerU(rowsU, i, 3, 0.25, 0.6);
              const eu = staggerU(exprU, i, 3, 0.4, 0.8);
              const y = ROW_Y[i];
              return (
                <g key={i} opacity={u}>
                  <text x={180} y={y} fontSize={17} fill={colors.TEXT}>
                    {r.label}
                  </text>
                  <BitDisc cx={520} cy={y - 5} b={r.want} opacity={wantOp} />
                  {i === 2 && (
                    <text x={550} y={y} fontSize={15} fill={colors.WARM} opacity={wantOp * v(scene.tieGlow)}>
                      left wins
                    </text>
                  )}
                  {eu > 0.005 && (
                    <g opacity={eu}>
                      <text x={330} y={y} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                        {r.expr}
                      </text>
                      <text x={612} y={y} fontSize={15} fontFamily={MONO} fontWeight={700} fill={r.value > 0 ? colors.WARM : colors.MUTED}>
                        {`→ ${r.out}`}
                      </text>
                      <rect x={TRACK.x} y={y - 12} width={TRACK.w} height={12} rx={3} fill="none" stroke={colors.GRID} strokeWidth={1.2} />
                      {r.value > 0 && <rect x={TRACK.x} y={y - 15} width={1.5} height={18} fill={colors.WARM} />}
                    </g>
                  )}
                </g>
              );
            })}
            {v(scene.sliverU) > 0.005 && (
              <g opacity={v(scene.sliverU)}>
                <circle cx={TRACK.x} cy={ROW_Y[0] - 6} r={14} fill="none" stroke="#ffffff" strokeWidth={1.8} />
                <text x={TRACK.x + 24} y={ROW_Y[0] + 24} fontSize={14} fill={colors.WARM}>
                  {`2**-24 ≈ ${STEP_SCI}: a sliver too thin to draw`}
                </text>
              </g>
            )}
            <MathLabel tex={'\\mathrm{relu}(\\mathrm{right} - \\mathrm{left})'} x={640} y={170} fontSize={32} boxWidth={600} color={colors.SECONDARY} opacity={v(scene.texRelu)} />
          </g>
        )}

        {/* ================= B5+ · the magnifier ladder ================= */}
        {axisU > 0.005 && (
          <g opacity={ladderOp}>
            {/* zone above 1, the ceiling, the axis, the zero lane */}
            <rect x={AXIS_X} y={Y_HI} width={(RIGHT_X - AXIS_X) * axisU} height={Y(0) - Y_HI} fill={colors.NEGATIVE} opacity={0.06} />
            <text x={AXIS_X + 10} y={Y_HI + 17} fontSize={12} fill={colors.NEGATIVE} opacity={v(scene.aboveU)}>
              above 1: the clamp cuts it back
            </text>
            <line x1={AXIS_X} y1={Y(0)} x2={lerp(AXIS_X, RIGHT_X, axisU)} y2={Y(0)} stroke={colors.WARM} strokeWidth={1.8} opacity={0.8} />
            <text x={AXIS_X - 10} y={Y(0) + 5} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={MONO} fill={colors.WARM} opacity={axisU}>
              1
            </text>
            <line x1={AXIS_X} y1={Y(E_LO)} x2={AXIS_X} y2={lerp(Y(E_LO), Y_HI, axisU)} stroke={colors.MUTED} strokeWidth={1.8} />
            {[-149, -126, -103, -80, -57, -34, -11, 12].map((e) => (
              <line key={e} x1={AXIS_X - 5} y1={Y(e)} x2={AXIS_X} y2={Y(e)} stroke={colors.MUTED} strokeWidth={1.2} opacity={axisU} />
            ))}
            <text x={0} y={0} transform={`translate(${AXIS_X - 22}, ${(Y(E_LO) + Y(0)) / 2}) rotate(-90)`} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={axisU}>
              value, log scale (each rung is ×2**23)
            </text>
            <line x1={AXIS_X} y1={FLOOR_Y} x2={lerp(AXIS_X, RIGHT_X, axisU)} y2={FLOOR_Y} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 5" opacity={0.7} />
            <text x={AXIS_X - 10} y={FLOOR_Y + 5} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={MONO} fill={colors.MUTED} opacity={axisU}>
              0
            </text>

            {/* clamp gates on the ceiling, one per stage */}
            {Array.from({ length: STAGE_COUNT }, (_, j) => {
              const k = j + 1;
              const u = staggerU(v(scene.cellsU), k, 8, 0.08, 0.5);
              const g = gateGlow(k);
              return (
                <g key={k} opacity={u}>
                  {g > 0.005 && <rect x={colX(k) - 22} y={Y(0) - 9} width={44} height={18} rx={4} fill={colors.WARM} opacity={0.25 * g} />}
                  <rect x={colX(k) - 13} y={Y(0) - 3.5} width={26} height={7} rx={2} fill={colors.WARM} />
                </g>
              );
            })}

            {/* stage cells: col 0 is the relu, cols 1..7 are ×2**23 then clamp01 */}
            {Array.from({ length: STAGE_COUNT + 1 }, (_, k) => {
              const u = staggerU(v(scene.cellsU), k, 8, 0.08, 0.5);
              if (u <= 0.005) return null;
              const lit = k === 0 ? 0 : cellLit(k);
              const x = colX(k) - CELL.w / 2;
              return (
                <g key={k} opacity={u} transform={`translate(0, ${(1 - u) * 10})`}>
                  <rect x={x} y={CELL.y} width={CELL.w} height={CELL.h} rx={6} fill={colors.PANEL} stroke={lit > 0.02 ? colors.WARM : colors.GRID} strokeWidth={1.5 + lit * 1.2} />
                  {lit > 0.02 && <rect x={x} y={CELL.y} width={CELL.w} height={CELL.h} rx={6} fill={colors.WARM} opacity={0.14 * lit} />}
                  {k === 0 ? (
                    <>
                      <text x={colX(0)} y={CELL.y + 17} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.SECONDARY}>
                        relu
                      </text>
                      <text x={colX(0)} y={CELL.y + 34} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                        right−left
                      </text>
                    </>
                  ) : (
                    <>
                      <text x={x + 8} y={CELL.y + 17} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                        ×2**23
                      </text>
                      <text x={x + 8} y={CELL.y + 34} fontSize={12} fontFamily={MONO} fill={colors.WARM}>
                        clamp
                      </text>
                      <Lock x={x + CELL.w - 11} y={CELL.y + 12} opacity={staggerU(locksU, (k - 1) * 2, 14, 0.06, 0.3)} />
                      <Lock x={x + CELL.w - 11} y={CELL.y + 29} opacity={staggerU(locksU, (k - 1) * 2 + 1, 14, 0.06, 0.3)} />
                    </>
                  )}
                </g>
              );
            })}
            {v(scene.lockLbl) > 0.005 && (
              <text x={RIGHT_X} y={CELL.y - 8} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={v(scene.lockLbl)}>
                roundAffine: each a rounding point
              </text>
            )}
            {v(scene.ghostU) > 0.005 && (
              <g opacity={v(scene.ghostU)}>
                <rect x={colX(1) - CELL.w / 2} y={496} width={colX(7) - colX(1) + CELL.w} height={40} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.8} strokeDasharray="7 5" />
                <text x={(colX(1) + colX(7)) / 2} y={521} textAnchor="middle" fontSize={15} fill={colors.NEGATIVE}>
                  without rounding points: one merged formula
                </text>
                <line
                  x1={colX(1) - CELL.w / 2}
                  y1={516}
                  x2={lerp(colX(1) - CELL.w / 2, colX(7) + CELL.w / 2, v(scene.strikeU))}
                  y2={516}
                  stroke={colors.NEGATIVE}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* the comparator panel */}
            {panelOp > 0.005 && (
              <g opacity={panelOp} fontFamily={MONO}>
                <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={PANEL.x + 16} y={PANEL.y + 30} fontSize={14} fontWeight={700} fill={colors.TEXT}>
                  emitCascadeGreaterBit
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 62} fontSize={14} fill={colors.ACCENT} xmlSpace="preserve">
                  {`left  = ${P.l}`}
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 84} fontSize={14} fill={colors.TEAL} xmlSpace="preserve">
                  {`right = ${P.r}`}
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 122} fontSize={14} fill={colors.SECONDARY}>
                  relu(right − left)
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 142} fontSize={12} fill={colors.MUTED}>
                  reglu · rampOffset: 0
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 180} fontSize={14} fill={colors.TEXT}>
                  hardCascadeOptions()
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 201} fontSize={13} fill={colors.MUTED}>
                  stageScales: fill(2 ** 23)
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 221} fontSize={13} fill={colors.MUTED}>
                  cascadeStageCount = 7
                </text>
                <text x={PANEL.x + 16} y={PANEL.y + 266} fontSize={15} fill={colors.TEXT}>
                  bit =
                </text>
                {v(scene.bitOn) > 0.5 ? (
                  <>
                    <BitDisc cx={PANEL.x + 84} cy={PANEL.y + 261} b={P.bit} />
                    {P.bit === 0 && (
                      <text x={PANEL.x + 108} y={PANEL.y + 266} fontSize={15} fontWeight={700} fill={colors.ACCENT}>
                        left wins
                      </text>
                    )}
                  </>
                ) : (
                  <text x={PANEL.x + 78} y={PANEL.y + 266} fontSize={15} fill={colors.MUTED}>
                    …
                  </text>
                )}
                <line x1={PANEL.x + PANEL.w} y1={PANEL.y + 117} x2={COL0 - 12} y2={head0.y} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.7} />
              </g>
            )}

            {v(scene.minTag) > 0.005 && (
              <text x={COL0 + 24} y={Y(-149) - 20} fontSize={15} fill={colors.WARM} opacity={v(scene.minTag)}>
                the smallest positive float32 gap
              </text>
            )}
            {/* the ruler: how far 2**-149 sits below 1 */}
            {v(scene.rulerU) > 0.005 && (
              <g opacity={clamp01(v(scene.rulerU) * 2)}>
                <line x1={COL0 + 34} y1={Y(-149)} x2={COL0 + 34} y2={lerp(Y(-149), Y(0), v(scene.rulerU))} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="2 4" />
                <line x1={COL0 + 26} y1={Y(-149)} x2={COL0 + 42} y2={Y(-149)} stroke={colors.TEXT} strokeWidth={1.5} />
                <line x1={COL0 + 26} y1={Y(0)} x2={COL0 + 42} y2={Y(0)} stroke={colors.TEXT} strokeWidth={1.5} opacity={clamp01(v(scene.rulerU) * 2 - 1)} />
                <text x={COL0 + 50} y={Y(-75)} fontSize={15} fill={colors.TEXT} opacity={clamp01(v(scene.rulerU) * 2 - 1)}>
                  2**149 times too small
                </text>
                <text x={COL0 + 50} y={Y(-75) + 22} fontSize={13} fill={colors.MUTED} opacity={clamp01(v(scene.rulerU) * 2 - 1)}>
                  to count as a one
                </text>
              </g>
            )}

            {/* the three traces */}
            <Trail pts={NEAR_PTS} u={nearU} color={colors.TEAL} opacity={(nearU > 0 ? 1 : 0) * v(scene.nearOp)} />
            <Trail pts={TIE_PTS} u={tieU} color={colors.ACCENT} opacity={tieU > 0 ? 1 : 0} />
            <Trail pts={smallPts} u={climb} color={colors.WARM} opacity={v(scene.beadU) * v(scene.smallOp)} />
            {dropLabel && v(scene.beadU) > 0.005 && climb < 0.3 && (
              <text x={COL0 + 14} y={head0.y + 20} fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.beadU) * v(scene.smallOp)}>
                {dropLabel}
              </text>
            )}
            {v(scene.endU) > 0.005 && (
              <g opacity={v(scene.smallOp)}>
                <circle cx={colX(STAGE_COUNT)} cy={Y(0)} r={22 * v(scene.endU)} fill="none" stroke={colors.WARM} strokeWidth={2} />
              </g>
            )}
            {v(scene.nearLbl) > 0.005 && (
              <text x={colX(2) + 8} y={Y(0) + 26} fontSize={13} fill={colors.TEAL} opacity={v(scene.nearLbl) * v(scene.nearOp)}>
                2**-24: saturates at stage 2, then rides at 1
              </text>
            )}
            {v(scene.tieLbl) > 0.005 && (
              <text x={colX(1)} y={FLOOR_Y + 19} fontSize={13} fill={colors.ACCENT} opacity={v(scene.tieLbl)}>
                tie: 0 × 2**23 = 0 at every stage
              </text>
            )}

            {/* B6 readout: the significand stays 1, the exponent moves */}
            {v(scene.readU) > 0.005 && (
              <g opacity={v(scene.readU)}>
                <MathLabel tex={`1 \\times 2^{${readE}}`} x={720} y={270} fontSize={34} boxWidth={300} color={colors.WARM} />
                <text x={720} y={318} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.readNote)}>
                  significand stays 1 · exponent +23
                </text>
              </g>
            )}

            {/* B7 clamp inset */}
            {v(scene.insetU) > 0.005 && (
              <g opacity={v(scene.insetU)}>
                <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={INSET.x + INSET.w / 2} y={INSET.y + 26} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  emitClampZeroOne
                </text>
                <MathLabel tex={'\\mathrm{clamp01}(v) = v - \\mathrm{relu}(v - 1)'} x={INSET.x + INSET.w / 2} y={INSET.y + 56} fontSize={21} boxWidth={INSET.w - 20} color={colors.WARM} />
                <g opacity={v(scene.insetPlot)}>
                  <line x1={CX(0)} y1={CY(0)} x2={CX(3.5)} y2={CY(0)} stroke={colors.MUTED} strokeWidth={1.2} />
                  <line x1={CX(0)} y1={CY(0)} x2={CX(0)} y2={CY(1.25)} stroke={colors.MUTED} strokeWidth={1.2} />
                  <line x1={CX(0)} y1={CY(0)} x2={CX(1.25)} y2={CY(1.25)} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.6} />
                  <line x1={CX(0) - 4} y1={CY(1)} x2={CX(3.5)} y2={CY(1)} stroke={colors.GRID} strokeWidth={1} />
                  <text x={CX(0) - 8} y={CY(1) + 4} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>1</text>
                  {[1, 2, 3].map((n) => (
                    <text key={n} x={CX(n)} y={CY(0) + 16} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>{n}</text>
                  ))}
                  <polyline
                    points={[[0, 0], [1, 1], [3.5, 1]].map(([a, b]) => `${CX(a)},${CY(b)}`).join(' ')}
                    fill="none"
                    stroke={colors.WARM}
                    strokeWidth={3}
                    strokeLinejoin="round"
                  />
                </g>
                {v(scene.demoA) > 0.005 && (
                  <g opacity={v(scene.demoA)}>
                    <circle cx={CX(CLAMP_DEMO[0].v)} cy={CY(CLAMP_DEMO[0].out)} r={6} fill={colors.POSITIVE} />
                    <text x={CX(CLAMP_DEMO[0].v) + 12} y={CY(CLAMP_DEMO[0].out) + 22} fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
                      0.4 → 0.4
                    </text>
                  </g>
                )}
                {v(scene.demoB) > 0.005 && (
                  <g opacity={clamp01(v(scene.demoB) * 3)}>
                    <line x1={CX(3.2)} y1={CY(1.6)} x2={CX(3.2)} y2={lerp(CY(1.6), CY(1), v(scene.demoB))} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="3 3" />
                    <circle cx={CX(3.2)} cy={lerp(CY(1.6), CY(CLAMP_DEMO[1].out), v(scene.demoB))} r={6} fill={colors.NEGATIVE} />
                    <text x={CX(3.2) - 10} y={CY(1.6) - 4} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.NEGATIVE}>
                      3.2 → 1
                    </text>
                  </g>
                )}
                <text x={INSET.x + INSET.w / 2} y={INSET.y + INSET.h - 14} textAnchor="middle" fontSize={14} fill={colors.TEXT} opacity={v(scene.boundU)}>
                  exact for v below 2**24
                </text>
              </g>
            )}

            {/* B9 total gain */}
            {v(scene.gainU) > 0.005 && (
              <g opacity={v(scene.gainU)}>
                <rect x={640} y={250} width={380} height={110} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={830} y={276} textAnchor="middle" fontSize={14} fill={colors.MUTED}>
                  total gain, seven stages
                </text>
                <MathLabel tex={`\\left(2^{23}\\right)^{${STAGE_COUNT}} = 2^{${TOTAL_GAIN_EXP}}`} x={830} y={318} fontSize={32} boxWidth={360} color={colors.WARM} />
              </g>
            )}
          </g>
        )}

        {/* ================= B12 · the finished bit ================= */}
        {v(scene.cardU) > 0.005 && (
          <g opacity={v(scene.cardU)} transform={`translate(0, ${(1 - v(scene.cardU)) * 16})`}>
            <rect x={330} y={180} width={620} height={260} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={228} textAnchor="middle" fontSize={18} fontFamily={MONO} fill={colors.TEXT}>
              emitCascadeGreaterBit(left, right) → bit
            </text>
            <text x={640} y={262} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
              made only of
            </text>
            {[
              { x: 470, text: 'sums', color: colors.TEXT },
              { x: 640, text: 'relu', color: colors.SECONDARY },
              { x: 810, text: '×2**23 scaling', color: colors.WARM },
            ].map((c, i) => {
              const u = staggerU(v(scene.chipsU), i, 3, 0.35, 0.6);
              return (
                <g key={i} opacity={u}>
                  <rect x={c.x - 75} y={280} width={150} height={38} rx={19} fill={colors.BG} stroke={c.color} strokeWidth={1.5} />
                  <text x={c.x} y={305} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={c.color}>
                    {c.text}
                  </text>
                </g>
              );
            })}
            {v(scene.zeroU) > 0.005 && (
              <g opacity={clamp01(v(scene.zeroU))}>
                <text x={640} y={384} textAnchor="middle" fontSize={28} fontWeight={700} fontFamily={MONO} fill={colors.WARM}>
                  boolean atoms: 0
                </text>
                <text x={640} y={412} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                  the report's boolean column for the cascade
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={186} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · The Sign Cascade
      </text>
    </>
  );
}

export const vizScene = () => scene;
