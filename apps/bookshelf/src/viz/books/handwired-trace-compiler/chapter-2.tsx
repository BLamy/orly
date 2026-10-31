// One Step Below Seven
//
// Trace Compiler — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/trace-compiler/compile.ts:513-524 (the comment: relu, power-of-two scales, clamp01, the 1732 case)
//   lab/trace-compiler/compile.ts:525-559 (exactPositiveBit: firstExponent, while (totalExponent < 150), assumeRange, integer)
//   lab/trace-compiler/compile.ts:562-571 (clampZeroOneContinuous = v − relu(v − 1), exact below 2^24)
//   lab/trace-compiler/compile.ts:676-680 (a / b lowers to a * f32(1 / b): the reciprocal of 244)
//   lab/trace-compiler/README.md:70-78 ("The Sign Cascade": July score policy, scope, the September 15 update)
//   src/runtime/numeric-ui-core.ts:2012 (emitCompare: a >= b within 0..16,384 in 15 operations and 14 layers)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every value on the staircase is computed below by running the cascade's own
// formula in single precision (Math.fround). The July score gauge is SCHEMATIC (labelled on screen): the old
// score's constants are not in the pinned source. The 14 layers of emitCompare come from its source comment only
// (review.md: not measured), and the screen says so.
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
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
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { FunctionPlot } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number, a: number, b: number): number => {
  const x = clamp01((u - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH14 = 8.4; // mono advance at 14 px
const CH13 = 7.8; // mono advance at 13 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const pow2 = (e: number): string => `2${String(e).split('').map((c) => SUP[c]).join('')}`;

// ---------------------------------------------------------------------------
// The arithmetic, in single precision (compile.ts:525-559, :564-571, :680)
// ---------------------------------------------------------------------------

const f32 = Math.fround;
const RECIP = f32(1 / 244); // 0.004098360426723957
const D = f32(f32(1732 - 24) * RECIP); // 6.999999523162842
const GAP = f32(7 - D); // 4.76837158203125e-7
const TINY = f32(2 ** -149); // the smallest positive FP32 value
if (D !== 6.999999523162842 || GAP !== 2 ** -21 || TINY !== 2 ** -149) throw new Error('fp32 arithmetic mismatch');

const MAGNITUDE = 7;
const firstExponentOf = (magnitude: number): number => Math.min(23 - Math.ceil(Math.log2(magnitude)), 120);
const FIRST = firstExponentOf(MAGNITUDE); // 20
const relu32 = (v: number): number => f32(Math.max(0, v));
const clampZeroOne = (v: number): number => f32(v - relu32(f32(v - 1)));

type Step = { op: string; value: number };
/** The cascade exactly as exactPositiveBit emits it, on one positive difference. */
function cascade(d: number, magnitude: number): { steps: Step[]; totals: number[]; stages: number } {
  const first = firstExponentOf(magnitude);
  const steps: Step[] = [{ op: '7 − d', value: d }];
  let value = relu32(d);
  steps.push({ op: 'relu', value });
  value = f32(value * 2 ** first);
  steps.push({ op: `×${pow2(first)}`, value });
  let total = first;
  const totals = [total];
  let stages = 0;
  while (total < 150) {
    value = clampZeroOne(value);
    steps.push({ op: 'clamp', value });
    value = f32(value * 2 ** 23);
    steps.push({ op: `×${pow2(23)}`, value });
    total += 23;
    totals.push(total);
    stages++;
  }
  steps.push({ op: 'clamp', value: clampZeroOne(value) });
  return { steps, totals, stages };
}
const GAP_RUN = cascade(GAP, MAGNITUDE);
const TINY_RUN = cascade(TINY, MAGNITUDE);
const ZERO_RUN = cascade(0, MAGNITUDE);
const N_COLS = GAP_RUN.steps.length; // 16
const STAGES = GAP_RUN.stages; // 6
const TOTALS = GAP_RUN.totals; // 20 43 66 89 112 135 158
const STAGES_16384 = cascade(1, 16384).stages; // 7
const lg = (v: number): number | null => (v === 0 ? null : Math.log2(v));
const GAP_LG = GAP_RUN.steps.map((s) => lg(s.value));
const TINY_LG = TINY_RUN.steps.map((s) => lg(s.value));
const ZERO_LG = ZERO_RUN.steps.map((s) => lg(s.value));
{
  const want = (a: Array<number | null>, b: Array<number | null>) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (FIRST !== 20 || STAGES !== 6 || STAGES_16384 !== 7 || TOTALS.join() !== '20,43,66,89,112,135,158') throw new Error('stage plan mismatch');
  if (!want(GAP_LG, [-21, -21, -1, -1, 22, 0, 23, 0, 23, 0, 23, 0, 23, 0, 23, 0])) throw new Error('gap cascade mismatch');
  if (TINY_LG[N_COLS - 2] !== 9 || TINY_LG[N_COLS - 1] !== 0) throw new Error('tiny cascade mismatch');
  if (ZERO_LG.some((x) => x !== null)) throw new Error('zero cascade mismatch');
}

/** FP32 fields of a value: sign, the 8 exponent bits, the 23 mantissa bits. */
function f32Fields(v: number): { bits: number[]; exp: number } {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, v);
  const u = dv.getUint32(0);
  return { bits: Array.from({ length: 32 }, (_, i) => (u >>> (31 - i)) & 1), exp: (u >>> 23) & 255 };
}
const BIT_ROWS = [
  { label: pow2(-21), v: GAP_RUN.steps[1].value },
  { label: '0.5', v: GAP_RUN.steps[2].value },
  { label: '4194304', v: GAP_RUN.steps[4].value },
].map((r) => ({ ...r, ...f32Fields(r.v) }));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the number line (B0–B2): a window that zooms from [−0.2, 8.2] to eight FP32 steps around 7
const NL = { y: 300, cx: 640, span: 1000 };
const W0 = 8.4;
const C0 = 4;
const W1 = 8 * GAP;
const C1 = 7 - GAP / 2;
const windowAt = (u: number) => {
  const w = W0 * Math.pow(W1 / W0, u);
  return { w, c: C1 + ((C0 - C1) * (w - W1)) / (W0 - W1) };
};
const NICE = [1, 2, 5];
function decimalTicks(c: number, w: number) {
  const raw = w / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = mag * (NICE.find((n) => n * mag >= raw) ?? 10);
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const out: Array<{ v: number; label: string }> = [];
  for (let n = Math.ceil((c - w / 2) / step); n <= Math.floor((c + w / 2) / step); n++) out.push({ v: n * step, label: (n * step).toFixed(dec) });
  return out;
}

// the staircase (B3–B11): one column per emitted operation, log2 value on y
const CX = (i: number): number => 170 + 62 * i;
const OUT_X = 1150;
const TOP = 160;
const BOT = 560;
const FLOOR = 592;
const HDR_Y = 131;
const TOT_Y = 149;
const LG_TOP = 25;
const yOf = (l: number | null, depth: number): number => {
  if (l === null) return FLOOR;
  const lo = lerp(-24, -152, depth);
  return TOP + ((LG_TOP - l) / (LG_TOP - lo)) * (BOT - TOP);
};
const TICKS_NEAR = [24, 16, 8, 0, -8, -16, -24];
const TICKS_FAR = [-48, -72, -96, -120, -144];

// July gauge (B2, schematic)
const G = { x0: 390, x1: 890, y: 480 };

// cards
const INSET = { x: 640, y: 196, w: 530 };

const HOME: CameraState = CAMERA_HOME;
const CAM_OPEN: CameraState = { x: 640, y: 320, k: 1.06 };
const CAM_GAP: CameraState = { x: 640, y: 292, k: 1.3 };
const CAM_LADDER: CameraState = { x: 600, y: 370, k: 1.1 };
const CAM_OUT: CameraState = { x: 930, y: 400, k: 1.2 };

type Pt = { x: number; y: number; r: number };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ≈154 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const lens = tl.channel<Pt>('lens', { x: 0, y: 0, r: 20 });
  const lensOp = tl.channel('lensOp', 0);

  // B0–B2 the number line
  const nlDraw = tl.channel('nlDraw', 0);
  const nlOp = tl.channel('nlOp', 1);
  const dU = tl.channel('dMarker', 0);
  const codeU = tl.channel('codeChip', 0);
  const askU = tl.channel('askBelow7', 0);
  const zoomU = tl.channel('zoomU', 0);
  const bracketU = tl.channel('bracketU', 0);
  // the gap token (persistent: bracket → gauge → first column)
  const tok = tl.channel('tokenPos', { x: 640, y: 236 });
  const tokOp = tl.channel('tokenOp', 0);
  const tokS = tl.channel('tokenScale', 1);
  // B2 July gauge
  const gaugeU = tl.channel('gaugeU', 0);
  const needleU = tl.channel('needleU', 0);
  const wrongU = tl.channel('wrongU', 0);
  // B3+ the staircase
  const axisU = tl.channel('ladderAxis', 0);
  const ladderOp = tl.channel('ladderOp', 1);
  const frameOp = tl.channel('ladderFrameOp', 1);
  const depth = tl.channel('depth', 0);
  const hdrN = tl.channel('headersLit', 0);
  const gapP = tl.channel('gapP', 0);
  const gapOp = tl.channel('gapOp', 1);
  const gapLbl = tl.channel('gapLabels', 0);
  const ceilU = tl.channel('ceilingU', 0);
  const lockU = tl.channel('lockU', 0);
  const reluIn = tl.channel('reluInset', 0);
  const firstIn = tl.channel('firstExpInset', 0);
  const clampIn = tl.channel('clampInset', 0);
  const bitsIn = tl.channel('bitsInset', 0);
  const exactU = tl.channel('exactBadge', 0);
  const capU = tl.channel('cap2_24', 0);
  const tinyP = tl.channel('tinyP', 0);
  const tinyOp = tl.channel('tinyOp', 1);
  const loopChip = tl.channel('whileChip', 0);
  const zeroP = tl.channel('zeroP', 0);
  const zeroOp = tl.channel('zeroOp', 1);
  const tieU = tl.channel('tieLabel', 0);
  const outU = tl.channel('outBits', 0);
  const cardU = tl.channel('outCard', 0);
  const atomU = tl.channel('noAtom', 0);
  // B10/B11 scope + library
  const scopeU = tl.channel('scopeU', 0);
  const scopeOp = tl.channel('scopeOp', 1);
  const libU = tl.channel('libU', 0);
  const ownU = tl.channel('ownU', 0);

  let t = 0.4;

  // — B0 · the width-1732 value, just under seven —
  const b0 = t;
  t = tl.caption({ at: t, dur: 10.8, text: 'Back to the width of 1732. After the multiply, the value lands just under seven, and the compiler has to say whether it is below seven.' });
  t = tl.hold(t, 0.5);
  tl.tween(nlDraw, 1, { at: b0 + 0.2, dur: 1.4, ease: ease.draw });
  tl.tween(codeU, 1, { at: b0 + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, HOME, { at: b0 + 2.4, dur: 1.3, ease: ease.move });
  tl.tween(dU, 1, { at: b0 + 3.6, dur: 0.6, ease: ease.enter });
  tl.set(lens, { x: NL.cx + ((D - C0) / W0) * NL.span, y: NL.y, r: 22 }, b0 + 3.9);
  tl.tween(lensOp, 1, { at: b0 + 4.0, dur: 0.5, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b0 + 6.6, dur: 0.5, ease: ease.move });
  tl.tween(askU, 1, { at: b0 + 7.2, dur: 0.6, ease: ease.enter });

  // — B1 · zoom in: one FP32 step apart —
  const b1 = t;
  t = tl.caption({ at: t, dur: 14.0, text: 'Zoom in and the two numbers sit exactly one step apart, a gap of about four point eight times ten to the minus seven. That is the smallest difference single precision can express here.' });
  t = tl.hold(t, 0.5);
  tl.tween(askU, 0, { at: b1, dur: 0.5, ease: ease.move });
  tl.tween(codeU, 0.12, { at: b1, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_GAP, { at: b1 + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(zoomU, 1, { at: b1 + 0.4, dur: 4.4, ease: ease.move });
  tl.tween(bracketU, 1, { at: b1 + 5.2, dur: 0.7, ease: ease.enter });

  // — B2 · the July score policy (schematic) —
  const b2 = t;
  t = tl.caption({ at: t, dur: 12.8, text: 'The July design scaled the difference into a score near one half and rounded it. At exact column boundaries it lost that tiny step, and the column count came out wrong.' });
  t = tl.hold(t, 0.5);
  tl.tween(cam, HOME, { at: b2, dur: 1.3, ease: ease.move });
  tl.tween(nlOp, 0.12, { at: b2, dur: 0.8, ease: ease.move });
  tl.tween(gaugeU, 1, { at: b2 + 0.6, dur: 1.0, ease: ease.draw });
  tl.set(tok, { x: 640, y: 360 }, b2 + 0.6);
  tl.tween(tokOp, 1, { at: b2 + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(tok, { x: 640, y: G.y }, { at: b2 + 2.0, dur: 1.4, ease: ease.move });
  tl.tween(tokS, 0.15, { at: b2 + 3.4, dur: 0.8, ease: ease.move });
  tl.tween(tokOp, 0, { at: b2 + 3.6, dur: 0.6, ease: ease.move });
  tl.tween(needleU, 1, { at: b2 + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(wrongU, 1, { at: b2 + 8.2, dur: 0.5, ease: ease.pop });

  // — B3 · relu keeps only positive differences —
  const b3 = t;
  t = tl.caption({ at: t, dur: 10.0, text: 'The replacement first keeps only positive differences with relu. Zero or negative differences come out as zero, so equal values never register as less.' });
  t = tl.hold(t, 0.5);
  for (const ch of [gaugeU, needleU, wrongU, nlOp]) tl.tween(ch, 0, { at: b3, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_LADDER, { at: b3 + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(axisU, 1, { at: b3 + 0.5, dur: 1.4, ease: ease.draw });
  tl.set(tok, { x: 640, y: G.y }, b3 + 0.7);
  tl.set(tokS, 1, b3 + 0.7);
  tl.tween(tokOp, 1, { at: b3 + 0.8, dur: 0.4, ease: ease.enter });
  tl.tween(tok, { x: CX(0) + 54, y: yOf(-21, 0) - 26 }, { at: b3 + 1.3, dur: 1.2, ease: ease.move });
  tl.tween(hdrN, 1, { at: b3 + 1.9, dur: 0.5, ease: ease.enter });
  tl.tween(gapLbl, 1, { at: b3 + 2.5, dur: 0.5, ease: ease.enter });
  tl.tween(tokOp, 0, { at: b3 + 2.5, dur: 0.4, ease: ease.move });
  tl.tween(reluIn, 1, { at: b3 + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(hdrN, 2, { at: b3 + 4.2, dur: 0.5, ease: ease.enter });
  tl.tween(gapP, 1, { at: b3 + 4.4, dur: 0.9, ease: ease.move });

  // — B4 · first scale: 2^20 from the declared range —
  const b4 = t;
  t = tl.caption({ at: t, dur: 13.2, text: "Then it scales by a power of two chosen from the value's declared range. For a difference bounded by seven, that's two to the twentieth, and our one-step gap becomes one half." });
  t = tl.hold(t, 0.5);
  tl.tween(reluIn, 0, { at: b4, dur: 0.6, ease: ease.move });
  tl.tween(firstIn, 1, { at: b4 + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(hdrN, 3, { at: b4 + 5.5, dur: 0.5, ease: ease.enter });
  tl.tween(gapP, 2, { at: b4 + 6.2, dur: 1.2, ease: ease.move });

  // — B5 · clamp, ×2^23, clamp: pinned at exactly one —
  const b5 = t;
  t = tl.caption({ at: t, dur: 12.4, text: 'A clamp holds anything above one at one. Another scale by two to the twenty-third turns one half into four million, and the next clamp pins it to exactly one.' });
  t = tl.hold(t, 0.5);
  tl.tween(firstIn, 0, { at: b5, dur: 0.6, ease: ease.move });
  tl.tween(clampIn, 1, { at: b5 + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(ceilU, 1, { at: b5 + 0.9, dur: 1.2, ease: ease.draw });
  tl.tween(hdrN, 4, { at: b5 + 2.4, dur: 0.5, ease: ease.enter });
  tl.tween(gapP, 3, { at: b5 + 2.6, dur: 0.9, ease: ease.move });
  tl.tween(hdrN, 5, { at: b5 + 4.4, dur: 0.5, ease: ease.enter });
  tl.tween(gapP, 4, { at: b5 + 4.6, dur: 1.3, ease: ease.move });
  tl.tween(hdrN, 6, { at: b5 + 7.8, dur: 0.5, ease: ease.enter });
  tl.tween(gapP, 5, { at: b5 + 8.0, dur: 1.2, ease: ease.move });
  tl.tween(lockU, 1, { at: b5 + 9.2, dur: 0.5, ease: ease.pop });

  // — B6 · why it is exact —
  const b6 = t;
  t = tl.caption({ at: t, dur: 13.6, text: 'This is exact because scaling by a power of two only shifts the exponent, and the clamp, a value minus relu of the value minus one, stays exact below two to the twenty-fourth.' });
  t = tl.hold(t, 0.5);
  tl.tween(clampIn, 0, { at: b6, dur: 0.6, ease: ease.move });
  tl.tween(bitsIn, 1, { at: b6 + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(exactU, 1, { at: b6 + 5.0, dur: 0.5, ease: ease.pop });
  tl.tween(capU, 1, { at: b6 + 8.0, dur: 1.0, ease: ease.draw });

  // — B7 · keep scaling until 2^-149 reaches one: six stages —
  const b7 = t;
  t = tl.caption({ at: t, dur: 10.8, text: "The loop doesn't stop there. It keeps scaling until even the smallest positive single-precision number would reach one, six scale stages for a range of seven." });
  t = tl.hold(t, 0.5);
  for (const ch of [bitsIn, exactU, capU]) tl.tween(ch, 0, { at: b7, dur: 0.6, ease: ease.move });
  tl.tween(gapLbl, 0, { at: b7, dur: 0.6, ease: ease.move });
  tl.tween(cam, HOME, { at: b7 + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(depth, 1, { at: b7 + 0.4, dur: 1.5, ease: ease.move });
  tl.tween(loopChip, 1, { at: b7 + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(hdrN, N_COLS, { at: b7 + 2.0, dur: 0.8, ease: ease.enter });
  tl.tween(gapOp, 0.3, { at: b7 + 2.0, dur: 0.6, ease: ease.move });
  tl.tween(gapP, N_COLS - 1, { at: b7 + 2.4, dur: 6.0, ease: ease.linear });
  tl.tween(tinyP, N_COLS - 1, { at: b7 + 2.4, dur: 6.0, ease: ease.linear });
  tl.set(lens, { x: CX(N_COLS - 2), y: yOf(9, 1), r: 18 }, b7 + 8.0);
  tl.tween(lensOp, 1, { at: b7 + 8.1, dur: 0.4, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b7 + 10.2, dur: 0.4, ease: ease.move });

  // — B8 · zero stays zero —
  const b8 = t;
  t = tl.caption({ at: t, dur: 12.4, text: "If the difference is zero, it stays zero through every stage. The lab's argument is that the bit then matches a native comparison on every input in range, ties included." });
  t = tl.hold(t, 0.5);
  tl.tween(gapOp, 0.12, { at: b8, dur: 0.6, ease: ease.move });
  tl.tween(tinyOp, 0.12, { at: b8, dur: 0.6, ease: ease.move });
  tl.tween(loopChip, 0, { at: b8, dur: 0.6, ease: ease.move });
  tl.tween(zeroP, N_COLS - 1, { at: b8 + 0.6, dur: 4.0, ease: ease.linear });
  tl.tween(tieU, 1, { at: b8 + 5.2, dur: 0.6, ease: ease.enter });

  // — B9 · a clean bit, no boolean atom —
  const b9 = t;
  t = tl.caption({ at: t, dur: 11.2, text: 'What comes out is a clean zero or one, marked as an integer in the range zero to one. The current test circuits use no boolean atoms.' });
  t = tl.hold(t, 0.5);
  tl.tween(tieU, 0, { at: b9, dur: 0.5, ease: ease.move });
  tl.tween(gapOp, 1, { at: b9, dur: 0.6, ease: ease.move });
  tl.tween(tinyOp, 1, { at: b9, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_OUT, { at: b9 + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(frameOp, 0.12, { at: b9 + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(outU, 1, { at: b9 + 1.0, dur: 0.6, ease: ease.pop });
  tl.tween(cardU, 1, { at: b9 + 2.2, dur: 0.7, ease: ease.enter });
  tl.tween(atomU, 1, { at: b9 + 7.0, dur: 0.6, ease: ease.enter });

  // — B10 · scope —
  const b10 = t;
  t = tl.caption({ at: t, dur: 13.2, text: "The lab is careful about scope. This is exact going forward, but it doesn't make hard comparisons usefully differentiable, and it doesn't prove a long cascade is the fastest way to run." });
  t = tl.hold(t, 0.5);
  tl.tween(cam, HOME, { at: b10, dur: 1.4, ease: ease.move });
  tl.tween(ladderOp, 0.1, { at: b10 + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(scopeU, 1, { at: b10 + 1.4, dur: 2.4, ease: ease.linear });

  // — B11 · the newer library routine —
  const b11 = t;
  t = tl.caption({ at: t, dur: 11.2, text: 'A newer library routine plans these stages from declared ranges, fifteen operations for a comparison over zero to sixteen thousand. The compiler still builds its own cascade.' });
  t = tl.hold(t, 2.5);
  tl.tween(scopeOp, 0, { at: b11, dur: 0.6, ease: ease.move });
  tl.tween(libU, 1, { at: b11 + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(ownU, 1, { at: b11 + 7.4, dur: 0.8, ease: ease.enter });

  return {
    tl, cam, lens, lensOp, nlDraw, nlOp, dU, codeU, askU, zoomU, bracketU, tok, tokOp, tokS,
    gaugeU, needleU, wrongU, axisU, ladderOp, depth, hdrN, gapP, gapOp, gapLbl, ceilU, lockU,
    reluIn, firstIn, clampIn, bitsIn, exactU, capU, tinyP, tinyOp, loopChip, zeroP, zeroOp, tieU,
    outU, cardU, atomU, frameOp, scopeU, scopeOp, libU, ownU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (book-wide spec, redrawn locally)
// ---------------------------------------------------------------------------

/** The bit: amber disc when 1, ring when 0. */
function BitDisc({ cx, cy, b, r = 12, opacity = 1 }: { cx: number; cy: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={b ? colors.WARM : colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={b ? '#1a1206' : colors.WARM}>
        {b}
      </text>
    </g>
  );
}

/** Thin white ring with a short leader: the spotlight (never a box). */
function LensRing({ x, y, r, opacity }: Pt & { opacity: number }) {
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
function CodeChip({ x, y, lines, stripe, opacity = 1 }: { x: number; y: number; lines: string[]; stripe: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const w = Math.max(...lines.map((l) => l.length)) * CH14 + 30;
  const h = lines.length * 20 + 14;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 22 + i * 20} fontSize={14} fontFamily={MONO} fill={l.startsWith('//') ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
          {l}
        </text>
      ))}
    </g>
  );
}

function Panel({ x, y, w, h, opacity, children, stroke = colors.GRID }: { x: number; y: number; w: number; h: number; opacity: number; children: ReactNode; stroke?: string }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.5} />
      {children}
    </g>
  );
}

/** The cascade's staircase up to progress p: flat run to the next column, then the jump. */
function stairPath(lgs: Array<number | null>, p: number, depth: number): { d: string; head: [number, number] } {
  const ys = lgs.map((l) => yOf(l, depth));
  let d = `M ${CX(0)} ${ys[0]}`;
  let head: [number, number] = [CX(0), ys[0]];
  const last = Math.min(lgs.length - 1, p);
  for (let i = 1; i <= Math.ceil(last); i++) {
    const u = clamp01(last - (i - 1));
    const hx = lerp(CX(i - 1), CX(i), clamp01(u * 2));
    d += ` L ${hx} ${ys[i - 1]}`;
    head = [hx, ys[i - 1]];
    if (u > 0.5) {
      const vy = lerp(ys[i - 1], ys[i], clamp01(u * 2 - 1));
      d += ` L ${CX(i)} ${vy}`;
      head = [CX(i), vy];
    }
  }
  return { d, head };
}

function Track({ lgs, p, depth, color, opacity, width = 3 }: { lgs: Array<number | null>; p: number; depth: number; color: string; opacity: number; width?: number }) {
  if (opacity <= 0.005 || p < -0.5) return null;
  const { d, head } = stairPath(lgs, Math.max(0, p), depth);
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
      {lgs.map((l, i) => (i <= p + 1e-6 ? <circle key={i} cx={CX(i)} cy={yOf(l, depth)} r={4.5} fill={colors.BG} stroke={color} strokeWidth={2} /> : null))}
      <circle cx={head[0]} cy={head[1]} r={6.5} fill={color} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const lens = s.get(scene.lens);

  // ---- number line
  const zoom = v(scene.zoomU);
  const { w, c } = windowAt(zoom);
  const xOf = (val: number) => NL.cx + ((val - c) / w) * NL.span;
  const nlOp = v(scene.nlOp);
  const nlDraw = v(scene.nlDraw);
  const late = smooth(zoom, 0.8, 0.97);
  const decOp = 1 - smooth(zoom, 0.72, 0.9);
  const ticks = decimalTicks(c, w);
  const xD = xOf(D);
  const x7 = xOf(7);
  const bracket = v(scene.bracketU);

  // ---- token
  const tok = s.get(scene.tok);
  const tokOp = v(scene.tokOp);
  const tokS = v(scene.tokS);
  const tokText = `7 − d = ${pow2(-21)}`;

  // ---- gauge
  const gaugeU = v(scene.gaugeU);
  const needleU = v(scene.needleU);
  const wrongU = v(scene.wrongU);

  // ---- staircase
  const axisU = v(scene.axisU);
  const ladderOp = v(scene.ladderOp);
  const dep = v(scene.depth);
  const frameOp = v(scene.frameOp);
  const hdrN = v(scene.hdrN);
  const gapP = v(scene.gapP);
  const tinyP = v(scene.tinyP);
  const zeroP = v(scene.zeroP);
  const gapLbl = v(scene.gapLbl);
  const ceilU = v(scene.ceilU);
  const yCeil = yOf(0, dep);
  const passed = [4, 6, 8, 10, 12, 14].filter((i) => tinyP >= i - 0.01).length;
  const outU = v(scene.outU);

  const scopeU = v(scene.scopeU);
  const scopeOp = v(scene.scopeOp);
  const libU = v(scene.libU);
  const ownU = v(scene.ownU);

  const GAP_LABELS: Array<{ i: number; text: string; dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = [
    { i: 0, text: pow2(-21), dx: 0, dy: -16, anchor: 'middle' },
    { i: 2, text: '0.5', dx: 12, dy: -12, anchor: 'start' },
    { i: 4, text: '4194304', dx: -12, dy: 5, anchor: 'end' },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="tc2-nl-clip">
          <rect x={60} y={150} width={1160} height={240} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= B0–B1 · the number line and its zoom ================= */}
        {nlOp > 0.005 && nlDraw > 0 && (
          <g opacity={nlOp}>
            <g clipPath="url(#tc2-nl-clip)">
              <line x1={NL.cx - NL.span / 2 - 40} y1={NL.y} x2={lerp(NL.cx - NL.span / 2 - 40, NL.cx + NL.span / 2 + 40, nlDraw)} y2={NL.y} stroke={colors.MUTED} strokeWidth={2} />
              {/* decimal ticks, rescaled every frame (labelled only inside the safe band) */}
              <g opacity={decOp * nlDraw}>
                {ticks.map((tk) => {
                  const x = xOf(tk.v);
                  return (
                    <g key={tk.label}>
                      <line x1={x} y1={NL.y - 6} x2={x} y2={NL.y + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                      {x > 200 && x < 1080 && (
                        <text x={x} y={NL.y + 26} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                          {tk.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
              {/* every representable FP32 value in the final window: one step = 2^-21 */}
              {late > 0.005 &&
                Array.from({ length: 13 }, (_, k) => k - 6).map((k) => {
                  const x = xOf(7 + k * GAP);
                  return <line key={k} x1={x} y1={NL.y - 9} x2={x} y2={NL.y + 9} stroke={colors.TEXT} strokeWidth={2} opacity={late * 0.7} />;
                })}
              {/* the threshold */}
              <line x1={x7} y1={NL.y - 44} x2={x7} y2={NL.y + 14} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="5 4" />
            </g>
            <text x={x7 + 10} y={NL.y - 30} fontSize={18} fill={colors.TEXT} opacity={1 - late}>
              7
            </text>
            {/* d */}
            <g opacity={v(scene.dU)}>
              <circle cx={xD} cy={NL.y} r={7} fill={colors.ACCENT} />
              <text x={xD - 12} y={NL.y - 30} textAnchor="end" fontSize={18} fontStyle="italic" fill={colors.ACCENT} opacity={1 - late}>
                d
              </text>
            </g>
            <g opacity={late}>
              <text x={xD} y={NL.y + 34} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.ACCENT}>
                d = {String(D)}
              </text>
              <text x={x7} y={NL.y + 34} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                7
              </text>
              <text x={1110} y={NL.y + 70} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                ticks: every FP32 value
              </text>
            </g>
            {zoom > 0.02 && (
              <text x={1110} y={NL.y - 62} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                zoom ×{commas(W0 / w)}
              </text>
            )}
            {/* the one-step bracket */}
            {bracket > 0.005 && (
              <g opacity={bracket}>
                <path d={`M ${xD} ${NL.y - 18} L ${xD} ${NL.y - 26} L ${x7} ${NL.y - 26} L ${x7} ${NL.y - 18}`} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} />
                <text x={NL.cx} y={NL.y - 64} textAnchor="middle" fontSize={16} fill={colors.TEXT}>
                  one step
                </text>
                <text x={NL.cx} y={NL.y - 40} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.ACCENT}>
                  ulp(7) = {pow2(-21)} = {String(GAP)}
                </text>
              </g>
            )}
            {/* B0 question */}
            {v(scene.askU) > 0.005 && (
              <g opacity={v(scene.askU)}>
                <rect x={x7 - 76} y={NL.y - 104} width={152} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
                <text x={x7} y={NL.y - 81} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={colors.WARM}>
                  d &lt; 7 ?
                </text>
              </g>
            )}
          </g>
        )}
        <CodeChip x={300} y={140} lines={['(1732-24)*fround(1/244)', `d = ${String(D)}`]} stripe={colors.ACCENT} opacity={v(scene.codeU) * Math.min(1, nlOp * 8)} />

        {/* ================= B2 · July score policy (schematic) ================= */}
        {gaugeU > 0.005 && (
          <g opacity={clamp01(gaugeU * 1.5)}>
            <text x={640} y={404} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
              July policy: scale the difference into a score near 0.5, then round
            </text>
            <rect x={612} y={G.y - 16} width={56} height={32} rx={4} fill={colors.WARM} opacity={0.16} />
            <line x1={G.x0} y1={G.y} x2={lerp(G.x0, G.x1, gaugeU)} y2={G.y} stroke={colors.MUTED} strokeWidth={3} strokeLinecap="round" />
            {[0, 0.5, 1].map((u) => (
              <g key={u} opacity={clamp01(gaugeU * 3 - u * 1.5)}>
                <line x1={lerp(G.x0, G.x1, u)} y1={G.y - 8} x2={lerp(G.x0, G.x1, u)} y2={G.y + 8} stroke={colors.MUTED} strokeWidth={1.5} />
                <text x={lerp(G.x0, G.x1, u)} y={G.y + 32} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  {u}
                </text>
              </g>
            ))}
            <text x={G.x1 + 18} y={G.y + 5} fontSize={13} fill={colors.MUTED}>
              score (schematic)
            </text>
            <text x={696} y={G.y - 26} fontSize={13} fill={colors.WARM}>
              rounding step
            </text>
            {needleU > 0.005 && (
              <g opacity={needleU}>
                <line x1={640} y1={G.y - 22} x2={640} y2={G.y + 14} stroke={colors.ACCENT} strokeWidth={2} />
                <text x={640} y={G.y + 62} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                  the one-step difference vanishes inside the rounding step
                </text>
              </g>
            )}
            {wrongU > 0.005 && (
              <g opacity={clamp01(wrongU)} transform={`translate(640, 585) scale(${lerp(0.8, 1, clamp01(wrongU))})`}>
                <rect x={-112} y={-20} width={224} height={36} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
                <text x={0} y={5} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={colors.NEGATIVE}>
                  column count wrong
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B3–B9 · the staircase ================= */}
        {axisU > 0.005 && (
          <g opacity={ladderOp}>
            <text x={170} y={100} fontSize={15} fontFamily={MONO} fill={colors.MUTED} opacity={axisU * frameOp}>
              exactPositiveBit(d) · log₂ scale
            </text>
            {/* y axis: powers of two */}
            <line x1={150} y1={TOP} x2={150} y2={lerp(TOP, BOT, axisU)} stroke={colors.MUTED} strokeWidth={1.5} />
            {[...TICKS_NEAR, ...TICKS_FAR].map((k) => {
              const y = yOf(k, dep);
              const far = TICKS_FAR.includes(k);
              const minor = k % 24 !== 0;
              const op = frameOp * axisU * (far ? dep : 1) * (minor ? 1 - dep : 1) * (y <= BOT + 1 ? 1 : 0);
              if (op <= 0.01) return null;
              return (
                <g key={k} opacity={op}>
                  <line x1={144} y1={y} x2={150} y2={y} stroke={colors.MUTED} strokeWidth={1.5} />
                  <line x1={150} y1={y} x2={CX(N_COLS - 1) + 20} y2={y} stroke={colors.GRID} strokeWidth={1} />
                  <text x={138} y={y + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {k === 0 ? '1' : pow2(k)}
                  </text>
                </g>
              );
            })}
            {/* exact-zero floor lane */}
            <g opacity={axisU * frameOp}>
              <line x1={150} y1={FLOOR} x2={CX(N_COLS - 1) + 20} y2={FLOOR} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="2 5" />
              <text x={138} y={FLOOR + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                0
              </text>
            </g>
            {/* column headers: the emitted operations, lit as the beat reaches them */}
            {GAP_RUN.steps.map((st, i) => {
              const lit = clamp01(hdrN - i);
              return (
                <g key={i} opacity={axisU * lerp(0.12, 1, lit) * frameOp}>
                  <line x1={CX(i)} y1={TOP - 4} x2={CX(i)} y2={FLOOR} stroke={colors.GRID} strokeWidth={1} />
                  <text x={CX(i)} y={HDR_Y} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={st.op === 'relu' ? colors.SECONDARY : st.op === 'clamp' ? colors.TEXT : i === 0 ? colors.ACCENT : colors.WARM}>
                    {st.op}
                  </text>
                </g>
              );
            })}
            {/* B7: the running total exponent under each scale column */}
            {dep > 0.01 &&
              TOTALS.map((tot, k) => {
                const col = k === 0 ? 2 : 2 + 2 * k;
                const on = clamp01((tinyP - col + 0.6) * 3) * v(scene.loopChip);
                if (on <= 0.01) return null;
                return (
                  <text key={k} x={CX(col)} y={TOT_Y} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={tot >= 150 ? colors.WARM : colors.MUTED} opacity={on}>
                    {tot}
                  </text>
                );
              })}
            {dep > 0.01 && v(scene.loopChip) > 0.01 && (
              <text x={136} y={TOT_Y} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.loopChip)}>
                totalExponent
              </text>
            )}
            {/* the ceiling at exactly one */}
            {ceilU > 0.005 && (
              <g>
                <line x1={150} y1={yCeil} x2={lerp(150, CX(N_COLS - 1) + 20, ceilU)} y2={yCeil} stroke={colors.WARM} strokeWidth={2} strokeDasharray="7 5" opacity={0.8} />
              </g>
            )}
            {/* B6: the 2^24 line, below which the clamp is exact */}
            {v(scene.capU) > 0.005 && (
              <g opacity={v(scene.capU)}>
                <line x1={150} y1={yOf(24, dep)} x2={lerp(150, 1170, v(scene.capU))} y2={yOf(24, dep)} stroke={colors.NEGATIVE} strokeWidth={2} />
                <text x={1170} y={yOf(24, dep) + 20} textAnchor="end" fontSize={14} fill={colors.NEGATIVE}>
                  clamp exact below {pow2(24)}
                </text>
              </g>
            )}

            {/* the three runs */}
            <Track lgs={ZERO_LG} p={v(scene.zeroP) > 0.001 ? zeroP : -1} depth={dep} color={colors.TEXT} opacity={v(scene.zeroOp)} width={2.5} />
            <Track lgs={TINY_LG} p={tinyP > 0.001 ? tinyP : -1} depth={dep} color={colors.TEAL} opacity={v(scene.tinyOp)} />
            <Track lgs={GAP_LG} p={gapLbl > 0.001 || gapP > 0.001 ? gapP : -1} depth={dep} color={colors.ACCENT} opacity={v(scene.gapOp)} width={3.5} />
            {/* gap value labels (B3–B6) */}
            {gapLbl > 0.005 &&
              GAP_LABELS.map((lb) =>
                gapP >= lb.i - 0.02 ? (
                  <text key={lb.i} x={CX(lb.i) + lb.dx} y={yOf(GAP_LG[lb.i], dep) + lb.dy} textAnchor={lb.anchor} fontSize={14} fontFamily={MONO} fontWeight={600} fill={colors.ACCENT} opacity={gapLbl}>
                    {lb.text}
                  </text>
                ) : null,
              )}
            {/* B5: pinned at the ceiling */}
            {v(scene.lockU) > 0.005 && v(scene.gapOp) > 0.5 && (
              <g opacity={clamp01(v(scene.lockU)) * gapLbl}>
                <circle cx={CX(5)} cy={yCeil} r={12} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
                <text x={CX(5) + 14} y={yCeil - 14} fontSize={14} fill={colors.WARM}>
                  exactly 1
                </text>
              </g>
            )}
            {/* B6: exact badge on the scale jumps */}
            {v(scene.exactU) > 0.005 && (
              <g opacity={clamp01(v(scene.exactU))}>
                <rect x={CX(2) - 40} y={yOf(10, dep) - 15} width={80} height={28} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                <text x={CX(2)} y={yOf(10, dep) + 5} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.POSITIVE}>
                  exact
                </text>
              </g>
            )}
            {/* B7: the smallest positive FP32 value */}
            {tinyP > 0.001 && (
              <g opacity={v(scene.tinyOp)}>
                <text x={CX(0) + 12} y={yOf(-149, dep) - 10} fontSize={14} fontFamily={MONO} fontWeight={600} fill={colors.TEAL} opacity={frameOp}>
                  {pow2(-149)}, smallest positive FP32
                </text>
                {tinyP >= N_COLS - 2 - 0.02 && (
                  <text x={CX(N_COLS - 2) - 12} y={yOf(9, dep) + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fontWeight={600} fill={colors.TEAL}>
                    {pow2(9)}
                  </text>
                )}
              </g>
            )}
            {/* B8: a tie */}
            {v(scene.tieU) > 0.005 && (
              <g opacity={v(scene.tieU)}>
                <text x={CX(N_COLS - 1)} y={FLOOR - 14} textAnchor="end" fontSize={15} fill={colors.TEXT}>
                  a tie: difference 0 → 0 at every stage → bit 0
                </text>
              </g>
            )}
            {/* B9: the output bits */}
            {outU > 0.005 && (
              <g>
                <line x1={CX(N_COLS - 1)} y1={yCeil} x2={OUT_X - 12} y2={yCeil} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(outU)} />
                <line x1={CX(N_COLS - 1)} y1={FLOOR} x2={OUT_X - 12} y2={FLOOR} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(outU)} />
                <BitDisc cx={OUT_X} cy={yCeil} b={1} opacity={clamp01(outU)} />
                <BitDisc cx={OUT_X} cy={FLOOR} b={0} opacity={clamp01(outU)} />
              </g>
            )}
          </g>
        )}

        {/* the gap token (bracket → gauge → first column) */}
        {tokOp > 0.005 && (
          <g opacity={tokOp} transform={`translate(${tok.x}, ${tok.y}) scale(${tokS})`}>
            <rect x={-82} y={-16} width={164} height={30} rx={15} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
            <text x={0} y={5} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.ACCENT}>
              {tokText}
            </text>
          </g>
        )}

        {/* ================= insets (right half, B3–B6) ================= */}
        <Panel x={INSET.x} y={INSET.y} w={INSET.w} h={230} opacity={v(scene.reluIn)}>
          <text x={INSET.x + 24} y={INSET.y + 32} fontSize={16} fill={colors.SECONDARY}>
            relu keeps only positive differences
          </text>
          {(() => {
            const px = scaleLinear([-1.6, 1.6], [INSET.x + 30, INSET.x + 250]);
            const py = scaleLinear([-0.2, 1.5], [INSET.y + 200, INSET.y + 66]);
            return (
              <g>
                <line x1={px(-1.6)} y1={py(0)} x2={px(1.6)} y2={py(0)} stroke={colors.MUTED} strokeWidth={1} />
                <line x1={px(0)} y1={py(-0.2)} x2={px(0)} y2={py(1.5)} stroke={colors.MUTED} strokeWidth={1} />
                <FunctionPlot x={px} y={py} f={(x) => Math.max(0, x)} color={colors.SECONDARY} width={3} samples={64} />
                {[-1, 0, 1].map((x) => (
                  <circle key={x} cx={px(x)} cy={py(Math.max(0, x))} r={6} fill={x > 0 ? colors.ACCENT : colors.MUTED} />
                ))}
              </g>
            );
          })()}
          {[
            { a: `−${pow2(-21)}`, b: '0', col: colors.MUTED },
            { a: '0', b: '0', col: colors.MUTED },
            { a: pow2(-21), b: pow2(-21), col: colors.ACCENT },
          ].map((r, i) => (
            <text key={i} x={INSET.x + 290} y={INSET.y + 92 + i * 36} fontSize={15} fontFamily={MONO} fill={r.col}>
              {r.a} → {r.b}
            </text>
          ))}
          <text x={INSET.x + 290} y={INSET.y + 206} fontSize={13} fill={colors.MUTED}>
            equal values give 0
          </text>
        </Panel>

        <Panel x={INSET.x} y={INSET.y} w={INSET.w} h={190} opacity={v(scene.firstIn)}>
          <text x={INSET.x + 24} y={INSET.y + 32} fontSize={16} fill={colors.WARM}>
            first scale, from the declared range
          </text>
          <text x={INSET.x + 24} y={INSET.y + 60} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
            magnitude = {MAGNITUDE}
          </text>
          <MathLabel tex={`\\text{firstExponent} = \\min(23 - \\lceil \\log_2 ${MAGNITUDE} \\rceil,\\ 120) = ${FIRST}`} x={INSET.x + 24} y={INSET.y + 104} fontSize={19} anchor="start" boxWidth={490} />
          <MathLabel tex={`2^{-21} \\times 2^{${FIRST}} = 2^{-1} = ${GAP_RUN.steps[2].value}`} x={INSET.x + 24} y={INSET.y + 150} fontSize={21} anchor="start" boxWidth={490} color={colors.ACCENT} />
        </Panel>

        <Panel x={INSET.x} y={INSET.y} w={INSET.w} h={210} opacity={v(scene.clampIn)}>
          <text x={INSET.x + 24} y={INSET.y + 32} fontSize={16} fill={colors.TEXT}>
            clampZeroOneContinuous
          </text>
          <MathLabel tex={'v - \\mathrm{relu}(v - 1)'} x={INSET.x + 24} y={INSET.y + 66} fontSize={21} anchor="start" boxWidth={300} />
          {(() => {
            const px = scaleLinear([-0.3, 2.4], [INSET.x + 30, INSET.x + 250]);
            const py = scaleLinear([-0.15, 1.3], [INSET.y + 190, INSET.y + 100]);
            return (
              <g>
                <line x1={px(-0.3)} y1={py(0)} x2={px(2.4)} y2={py(0)} stroke={colors.MUTED} strokeWidth={1} />
                <line x1={px(0)} y1={py(-0.15)} x2={px(0)} y2={py(1.3)} stroke={colors.MUTED} strokeWidth={1} />
                <line x1={px(-0.3)} y1={py(1)} x2={px(2.4)} y2={py(1)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="4 4" />
                <FunctionPlot x={px} y={py} f={(x) => Math.min(1, Math.max(0, x))} domain={[0, 2.4]} color={colors.TEXT} width={3} samples={96} />
                <circle cx={px(0.5)} cy={py(0.5)} r={6} fill={colors.ACCENT} />
                <circle cx={px(2.3)} cy={py(1)} r={6} fill={colors.WARM} />
              </g>
            );
          })()}
          <text x={INSET.x + 290} y={INSET.y + 128} fontSize={15} fontFamily={MONO} fill={colors.ACCENT}>
            0.5 → {GAP_RUN.steps[3].value}
          </text>
          <text x={INSET.x + 290} y={INSET.y + 164} fontSize={15} fontFamily={MONO} fill={colors.WARM}>
            {GAP_RUN.steps[4].value} → {GAP_RUN.steps[5].value}
          </text>
        </Panel>

        <Panel x={INSET.x - 40} y={INSET.y + 30} w={INSET.w + 40} h={226} opacity={v(scene.bitsIn)}>
          <text x={INSET.x - 16} y={INSET.y + 62} fontSize={16} fill={colors.TEXT}>
            a power-of-two scale only shifts the exponent
          </text>
          {(() => {
            const bx = INSET.x + 84;
            const cw = 11;
            const cellX = (j: number) => bx + j * cw + (j >= 1 ? 4 : 0) + (j >= 9 ? 4 : 0);
            return (
              <g>
                <text x={cellX(0) + 5} y={INSET.y + 90} textAnchor="middle" fontSize={12} fill={colors.MUTED}>s</text>
                <text x={(cellX(1) + cellX(9)) / 2} y={INSET.y + 90} textAnchor="middle" fontSize={12} fill={colors.WARM}>exponent</text>
                <text x={(cellX(9) + cellX(32)) / 2} y={INSET.y + 90} textAnchor="middle" fontSize={12} fill={colors.MUTED}>mantissa (unchanged)</text>
                {BIT_ROWS.map((r, k) => {
                  const y = INSET.y + 104 + k * 44;
                  return (
                    <g key={k}>
                      <text x={bx - 10} y={y + 14} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.ACCENT}>
                        {r.label}
                      </text>
                      {r.bits.map((b, j) => (
                        <rect key={j} x={cellX(j)} y={y} width={cw - 2} height={18} rx={2} fill={b ? (j >= 1 && j < 9 ? colors.WARM : colors.TEXT) : 'none'} stroke={j >= 1 && j < 9 ? colors.WARM : colors.MUTED} strokeOpacity={0.55} strokeWidth={1} />
                      ))}
                      <text x={cellX(31) + 18} y={y + 14} fontSize={13} fontFamily={MONO} fill={colors.WARM}>
                        {r.exp}
                      </text>
                      {k > 0 && (
                        <text x={cellX(31) + 18} y={y - 9} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                          +{r.exp - BIT_ROWS[k - 1].exp}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </Panel>

        {/* B7 code chip + stage counter */}
        {v(scene.loopChip) > 0.005 && (
          <g opacity={v(scene.loopChip)}>
            <CodeChip x={520} y={74} lines={['while (totalExponent < 150)']} stripe={colors.WARM} />
            <text x={1170} y={98} textAnchor="end" fontSize={16} fontFamily={MONO} fill={colors.TEAL}>
              ×{pow2(23)} stages: {passed} / {STAGES}
            </text>
          </g>
        )}

        {/* B9: output card */}
        <Panel x={720} y={384} w={400} h={170} opacity={v(scene.cardU) * ladderOp} stroke={colors.WARM}>
          <text x={744} y={418} fontSize={17} fill={colors.TEXT}>
            a clean bit: exactly 0 or 1
          </text>
          <CodeChip x={744} y={432} lines={['assumeRange(bit, 0, 1)', 'integer: true']} stripe={colors.WARM} />
          {v(scene.atomU) > 0.005 && (
            <g opacity={v(scene.atomU)}>
              <text x={744} y={530} fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
                boolean atoms in test circuits: 0
              </text>
            </g>
          )}
        </Panel>
        <LensRing {...lens} opacity={v(scene.lensOp)} />

        {/* ================= B10 · scope ================= */}
        {scopeU > 0.005 && scopeOp > 0.005 && (
          <g opacity={scopeOp}>
            <text x={640} y={200} textAnchor="middle" fontSize={20} fill={colors.TEXT} opacity={clamp01(scopeU * 4)}>
              What the lab claims for the cascade
            </text>
            {[
              { ok: true, head: 'exact going forward', sub: 'under the compiler’s numeric assumptions' },
              { ok: false, head: 'not usefully differentiable', sub: 'for hard comparisons' },
              { ok: false, head: 'not proven fastest', sub: 'a long cascade may not be' },
            ].map((cd, i) => {
              const u = clamp01(scopeU * 3 - i);
              if (u <= 0.005) return null;
              const x = 190 + i * 310;
              const col = cd.ok ? colors.POSITIVE : colors.NEGATIVE;
              return (
                <g key={i} opacity={u} transform={`translate(0, ${lerp(16, 0, u)})`}>
                  <rect x={x} y={240} width={280} height={150} rx={12} fill={colors.PANEL} stroke={col} strokeWidth={2} />
                  <text x={x + 140} y={292} textAnchor="middle" fontSize={30} fill={col}>
                    {cd.ok ? '✓' : '✗'}
                  </text>
                  <text x={x + 140} y={334} textAnchor="middle" fontSize={18} fill={colors.TEXT}>
                    {cd.head}
                  </text>
                  <text x={x + 140} y={362} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                    {cd.sub}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ================= B11 · the library routine vs compile.ts ================= */}
        {libU > 0.005 && (
          <g opacity={libU} transform={`translate(0, ${lerp(16, 0, libU)})`}>
            <rect x={150} y={180} width={470} height={270} rx={12} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={2} />
            <text x={176} y={218} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              numeric-ui-core.ts · since Sept 14
            </text>
            <text x={176} y={254} fontSize={24} fontFamily={MONO} fill={colors.TEAL}>
              emitCompare
            </text>
            <text x={176} y={286} fontSize={15} fill={colors.TEXT}>
              plans cascade stages from declared ranges
            </text>
            <text x={176} y={330} fontSize={17} fontFamily={MONO} fill={colors.TEXT}>
              a &gt;= b within 0..16,384
            </text>
            <text x={176} y={378} fontSize={26} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>
              15 operations
            </text>
            <text x={176} y={410} fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
              14 layers (per its source comment)
            </text>
          </g>
        )}
        {ownU > 0.005 && (
          <g opacity={ownU} transform={`translate(0, ${lerp(16, 0, ownU)})`}>
            <rect x={660} y={180} width={470} height={270} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
            <text x={686} y={218} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              compile.ts · does not call emitCompare
            </text>
            <text x={686} y={254} fontSize={24} fontFamily={MONO} fill={colors.ACCENT}>
              exactPositiveBit
            </text>
            <text x={686} y={286} fontSize={15} fill={colors.TEXT}>
              still builds its own cascade
            </text>
            <text x={686} y={330} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              ×{pow2(23)} until {pow2(-149)} reaches 1
            </text>
            <text x={686} y={372} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
              range 7 → {STAGES} scale stages
            </text>
            <text x={686} y={402} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
              range 16,384 → {STAGES_16384} scale stages
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={226} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        2 · One Step Below Seven
      </text>
    </>
  );
}

export const vizScene = () => scene;
