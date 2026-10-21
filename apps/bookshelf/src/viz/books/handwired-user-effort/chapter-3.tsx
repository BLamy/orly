// Choosing a Layout
//
// User Effort (Handwired) — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/user-effort/README.md:3 (prediction, then a permitted layout for supplied tasks), 58-64 (the selector
//     table: 606.37 / 624.08 ms, 120/120 vs 88/120; 20/20 vs 0/20 and 102.58 ms when all four are allowed),
//     70-74 (limits: no human results, no error prediction, no uncertainty)
//   lab/user-effort/selection.ts:3-12 (the four candidates), 22-27 (expectedCost), 29-43 (selectLayout: skip the
//     invalid, strict <, first wins), 45-64 (120 situations), 66-70 (the three methods)
//   lab/user-effort/domain.ts:29-38 (effortInput), 45-65 (layoutViolations)
//   lab/user-effort/simulator.ts:4-7 (meanDurationMs, the judge); lab/user-effort/predictor.ts:10 (inputFeatures)
//   lab/user-effort/user-effort.test.ts:113-119 (the mix flips the choice without new weights); bun test: 11 pass
//   lab/status.md:198 (synthetic; no human observations, error prediction, or usability claim)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim).
//
// Every cost, distance, rank, validity flag, tie, and grid cell on screen is computed at module scope (or per
// frame, closed-form in the sampled task mix) by a line-for-line port of effortInput, layoutViolations,
// expectedCost and selectLayout, with meanDurationMs as the cost. That port reproduces the report: 546.27 /
// 589.51 / 659.46 / 685.33 ms at motor context 0.375, near-small's 120.49 px, the 40 / 60 / 20 split, 88
// distance matches, means 606.37 / 624.08 ms and a 102.58 ms regret on the 20 open situations (asserted below).
// The learned model's 120/120 is the report's own count (README.md:62); the predictor is not retrained here.
// The bars show the simulator's expected duration, the yardstick the report scores every selection with.
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
import { Vec } from '../../primitives';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH13 = 7.8; // mono advance at 13 px

// ---------------------------------------------------------------------------
// The lab, ported (domain.ts, selection.ts, simulator.ts)
// ---------------------------------------------------------------------------

type Task = 'confirm' | 'details' | 'cancel';
type Mix = Record<Task, number>;
type Ctl = { id: Task; x: number; y: number; width: number; height: number };
type Layout = { id: string; clutter: number; controls: Ctl[] };
type Constraints = { minimumTargetWidth: number; maximumClutter: number };

const TASKS: Task[] = ['confirm', 'details', 'cancel'];
const control = (id: Task, cx: number, cy: number, width: number): Ctl => ({ id, x: cx - width / 2, y: cy - 20, width, height: 40 });
const VIEW = { width: 800, height: 600 };
const CANDIDATES: Layout[] = [
  { id: 'near-small', clutter: 0.85, controls: [control('confirm', 190, 220, 32), control('details', 190, 300, 32), control('cancel', 190, 380, 32)] },
  { id: 'wide-confirm', clutter: 0.25, controls: [control('confirm', 340, 240, 104), control('details', 480, 320, 56), control('cancel', 480, 420, 56)] },
  { id: 'wide-details', clutter: 0.25, controls: [control('confirm', 480, 320, 56), control('details', 340, 240, 104), control('cancel', 480, 420, 56)] },
  { id: 'balanced', clutter: 0.1, controls: [control('confirm', 430, 200, 72), control('details', 430, 300, 72), control('cancel', 430, 400, 72)] },
];
const POINTER = { x: 96, y: 300 };
const MOTOR = 0.375;

type EffortInput = { distance: number; targetWidth: number; clutter: number; motorContext: number };
const effortInput = (L: Layout, task: Task, m: number): EffortInput => {
  const c = L.controls.find((k) => k.id === task)!;
  return { distance: Math.hypot(c.x + c.width / 2 - POINTER.x, c.y + c.height / 2 - POINTER.y), targetWidth: c.width, clutter: L.clutter, motorContext: m };
};
const meanDurationMs = (i: EffortInput): number => {
  const d = Math.log2(1 + i.distance / i.targetWidth);
  return 200 + 110 * d + 180 * i.clutter + 80 * i.motorContext + 65 * i.motorContext * d;
};
const distanceCost = (i: EffortInput): number => i.distance;
const expectedCost = (L: Layout, mix: Mix, m: number, cost: (i: EffortInput) => number): number => {
  let total = 0;
  for (const t of TASKS) total += mix[t] * cost(effortInput(L, t, m));
  return total;
};
const layoutViolations = (L: Layout, c: Constraints): string[] => {
  const out: string[] = [];
  for (const id of TASKS) if (L.controls.filter((k) => k.id === id).length !== 1) out.push(`expected exactly one ${id}`);
  if (L.clutter > c.maximumClutter) out.push('too much clutter');
  for (const k of L.controls) {
    if (k.width < c.minimumTargetWidth || k.height < 32) out.push(`${k.id} is too small`);
    if (k.x < 8 || k.y < 8 || k.x + k.width > VIEW.width - 8 || k.y + k.height > VIEW.height - 8) out.push(`${k.id} is outside the viewport padding`);
  }
  return out;
};
/** selectLayout: skip the invalid, strict `<`, so an exact tie keeps the earlier entry. Returns an index or -1. */
const selectLayout = (mix: Mix, m: number, c: Constraints, cost: (i: EffortInput) => number): number => {
  let sel = -1;
  let min = Infinity;
  CANDIDATES.forEach((L, i) => {
    if (layoutViolations(L, c).length !== 0) return;
    const v = expectedCost(L, mix, m, cost);
    if (v < min) {
      sel = i;
      min = v;
    }
  });
  return sel;
};

const CONFIRM_HEAVY: Mix = { confirm: 0.8, details: 0.1, cancel: 0.1 };
const DETAILS_HEAVY: Mix = { confirm: 0.1, details: 0.8, cancel: 0.1 };
const EQUAL: Mix = { confirm: 1 / 3, details: 1 / 3, cancel: 1 / 3 };
const GOALS: Mix[] = [CONFIRM_HEAVY, DETAILS_HEAVY, { confirm: 0.1, details: 0.1, cancel: 0.8 }, EQUAL, { confirm: 0.5, details: 0.4, cancel: 0.1 }];
const CONTEXTS = [0.125, 0.375, 0.625, 0.875];
const WIDTHS = [32, 48, 72];
const CLUTTERS = [1, 0.5];
const OPEN: Constraints = { minimumTargetWidth: 32, maximumClutter: 1 };

// the 120 situations, in selectionSituations() order: row = task mix, column = context × width × clutter
const SITS = (() => {
  const out: Array<{ r: number; c: number; nValid: number; distMatch: boolean; regret: number; optimum: number; distMs: number }> = [];
  GOALS.forEach((mix, r) => {
    let c = 0;
    for (const m of CONTEXTS) for (const w of WIDTHS) for (const mc of CLUTTERS) {
      const cons = { minimumTargetWidth: w, maximumClutter: mc };
      const nValid = CANDIDATES.filter((L) => layoutViolations(L, cons).length === 0).length;
      const o = selectLayout(mix, m, cons, meanDurationMs);
      const d = selectLayout(mix, m, cons, distanceCost);
      const optimum = expectedCost(CANDIDATES[o], mix, m, meanDurationMs);
      const distMs = expectedCost(CANDIDATES[d], mix, m, meanDurationMs);
      out.push({ r, c, nValid, distMatch: o === d, regret: distMs - optimum, optimum, distMs });
      c++;
    }
  });
  return out;
})();
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
const N_VALID = [1, 3, 4].map((n) => SITS.filter((s) => s.nValid === n).length); // 40 · 60 · 20
const DIST_MATCHES = SITS.filter((s) => s.distMatch).length; // 88
const OPT_MEAN = mean(SITS.map((s) => s.optimum)); // 606.37 (learned matches all 120, so its mean is this)
const DIST_MEAN = mean(SITS.map((s) => s.distMs)); // 624.08
const OPEN_SITS = SITS.filter((s) => s.nValid === 4);
const OPEN_DIST_MATCHES = OPEN_SITS.filter((s) => s.distMatch).length; // 0
const OPEN_REGRET = mean(OPEN_SITS.map((s) => s.regret)); // 102.58
const CF_COSTS = CANDIDATES.map((L) => expectedCost(L, CONFIRM_HEAVY, MOTOR, meanDurationMs));
const TIE = expectedCost(CANDIDATES[1], EQUAL, MOTOR, meanDurationMs); // 623.52, wide-confirm = wide-details exactly
{
  const want = [546.27, 659.46, 589.51, 685.33];
  const got = [CF_COSTS[1], CF_COSTS[2], CF_COSTS[3], CF_COSTS[0]].map((v) => +v.toFixed(2));
  if (got.some((v, i) => v !== want[i])) throw new Error('confirm-heavy costs drifted from the report');
  if (SITS.length !== 120 || N_VALID.join() !== '40,60,20' || DIST_MATCHES !== 88) throw new Error('situation counts drifted');
  if (OPEN_SITS.length !== 20 || OPEN_DIST_MATCHES !== 0 || OPEN_REGRET.toFixed(2) !== '102.58') throw new Error('open-situation stats drifted');
  if (OPT_MEAN.toFixed(2) !== '606.37' || DIST_MEAN.toFixed(2) !== '624.08') throw new Error('means drifted');
  if (TIE !== expectedCost(CANDIDATES[2], EQUAL, MOTOR, meanDurationMs)) throw new Error('the tie is not exact');
}

const ordinal = (n: number): string => ['1st', '2nd', '3rd', '4th'][n];

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const S = 0.28; // thumbnail scale: 800×600 → 224×168
const TW = VIEW.width * S;
const TH = VIEW.height * S;
const TX = [120, 392, 664, 936];
const TY = 126;
const NAME_Y = 116;
const META_Y = 314;
const COST_TITLE_Y = 336;
const BAR_Y = 346;
const BAR_H = 20;
const COST_VAL_Y = 388;
const FORMULA_Y = 414;
const DIST_TITLE_Y = 440;
const DIST_BAR_Y = 450;
const DIST_VAL_Y = 490;
const MS_K = TW / 720; // px per ms
const PX_K = TW / 400; // px per expected pixel
const TASK_COLOR: Record<Task, string> = { confirm: colors.ACCENT, details: colors.SECONDARY, cancel: colors.TEAL };
const META = ['clutter 0.85 · three 32 px buttons', 'clutter 0.25 · confirm 104 px', 'clutter 0.25 · details 104 px', 'clutter 0.1 · three 72 px, a column'];

// the grids
const GX = (c: number): number => 300 + c * 30 + Math.floor(c / 6) * 10;
const GA_Y = 262;
const GB_Y = 442;
const CELL = 26;
const SUM_X = 1066;

// the race shrinks into a header strip when the camera pulls back
const MINI = { px: 640, py: 104, k: 0.42 };

const HOME: CameraState = CAMERA_HOME;
const CAM_RACE: CameraState = { x: 640, y: 300, k: 1.08 };
const CAM_BARS: CameraState = { x: 640, y: 318, k: 1.12 };
const CAM_THUMB = (i: number): CameraState => ({ x: TX[i] + TW / 2 + (i === 0 ? 120 : i === 3 ? -120 : 0), y: 238, k: 1.32 });
const CAM_GRID: CameraState = { x: 680, y: 420, k: 1.1 };

/** per-item progress from one group channel: item i starts `each` after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// header source chip, one per caption
const PIN = 'handwired@4ea7fcb';
const SOURCES = [
  'lab/user-effort/README.md:3',
  'selection.ts:7-12',
  'selection.ts:22-27',
  'selection.ts:22-43 · report.ts:42',
  'user-effort.test.ts:113-119',
  'selection.ts:66-70',
  'domain.ts:45-65 · selection.ts:33-41',
  'README.md:58-62 · selection.ts:45-64',
  'README.md:64 · selection.ts:55-57',
  'README.md:64',
  'simulator.ts:6 · predictor.ts:10',
  'README.md:70-74 · bun test',
  'lab/status.md:198',
];

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, paced at ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Prediction alone picks nothing. The second job is to take four authored layouts and a stated mix of tasks, then choose the layout with the lowest expected duration.',
  'The four layouts are near-small, with three tiny buttons close to the pointer, wide-confirm, wide-details, and balanced, with three medium buttons in a column.',
  "A task mix gives a probability to confirm, details and cancel. A layout's expected cost is each task's probability times its predicted duration, summed.",
  'At motor context point three seven five, say eighty percent confirm. Wide-confirm wins at about five hundred forty-six milliseconds, balanced at five eighty-nine, wide-details next, near-small last at six eighty-five.',
  'Now make details the common task, with the same trained weights. Wide-details wins at the same five hundred forty-six. Only the probabilities changed. Nothing was retrained.',
  'Compare a rule that just minimizes distance from the pointer. It loves near-small, whose buttons sit closest, though predicted duration puts that layout last in the confirm-heavy case.',
  'Designers can also forbid layouts: a minimum target width, a maximum clutter. Invalid layouts are skipped. If two valid layouts tie exactly, the earlier one in the list wins.',
  "Across one hundred twenty situations, the learned model picks the simulator's best layout every time, averaging six hundred six milliseconds. Shortest distance matches eighty-eight, averaging six twenty-four.",
  'But count the real choices. Forty situations allow only one valid layout, sixty allow three, and just twenty allow all four. So forty of the one hundred twenty are trivial wins.',
  'In those twenty open situations, learned effort matches the best layout twenty times out of twenty. Shortest distance matches zero, and costs one hundred two milliseconds extra on average.',
  "Even that is a soft win. The best layout is judged by the true formula, and the learner's features are that formula. Matching it here is close to what you'd expect.",
  "The status is that it holds. At the pinned commit the eleven tests pass, and the report reproduces the README's numbers. There are no human results, no error prediction, and no uncertainty.",
  "So: a law we wrote, five coefficients that recover it, and a chooser that follows a stated task mix without retraining. It's a clean pipeline test, not evidence about real users.",
];
const HOLD = 0.7;
const DUR = CAPTIONS.map((c) => Math.round((c.split(/\s+/).length / 2.5 + 0.6) * 10) / 10);
const B = DUR.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0.4 : acc[i - 1] + DUR[i - 1] + HOLD], []);

const mixInterp = (a: Mix, b: Mix) => (u: number): Mix => ({
  confirm: lerp(a.confirm, b.confirm, u),
  details: lerp(a.details, b.details, u),
  cancel: lerp(a.cancel, b.cancel, u),
});

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RACE, cameraInterp);
  const src = tl.channel('src', 0);
  const nearGlow = tl.channel('nearGlow', 0);
  const lastGlow = tl.channel('lastGlow', 0);
  // the race
  const thumbsU = tl.channel('thumbsU', 0);
  const pointerU = tl.channel('pointerU', 0);
  const chooseU = tl.channel('chooseU', 0);
  const focusIdx = tl.channel('focusIdx', 0);
  const spot = tl.channel('spot', 0);
  const metaU = tl.channel('metaU', 0);
  const hudU = tl.channel('hudU', 0);
  const mix = tl.channel<Mix>('mix', EQUAL, mixInterp);
  const tripsU = tl.channel('tripsU', 0);
  const barU = tl.channel('barU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const settingU = tl.channel('settingU', 0);
  const valsU = tl.channel('valsU', 0);
  const glowU = tl.channel('glowU', 0);
  const retrainU = tl.channel('retrainU', 0);
  const distU = tl.channel('distU', 0);
  const costOp = tl.channel('costOp', 1);
  const distOp = tl.channel('distOp', 1);
  const consU = tl.channel('consU', 0);
  const minW = tl.channel('minW', 32);
  const maxC = tl.channel('maxC', 1);
  const skipU = tl.channel('skipU', 0);
  const tieU = tl.channel('tieU', 0);
  const shrinkU = tl.channel('shrinkU', 0);
  const raceOp = tl.channel('raceOp', 1);
  // the grids
  const gridHdrU = tl.channel('gridHdrU', 0);
  const gridAU = tl.channel('gridAU', 0);
  const gridBU = tl.channel('gridBU', 0);
  const sumAU = tl.channel('sumAU', 0);
  const sumBU = tl.channel('sumBU', 0);
  const gridBOp = tl.channel('gridBOp', 1);
  const validU = tl.channel('validU', 0);
  const brkU = tl.channel('brkU', 0);
  const trivialU = tl.channel('trivialU', 0);
  const isoU = tl.channel('isoU', 0);
  const redU = tl.channel('redU', 0);
  const regretU = tl.channel('regretU', 0);
  const gridsOp = tl.channel('gridsOp', 1);
  // the caveat, the status, the recap
  const caveatU = tl.channel('caveatU', 0);
  const judgeU = tl.channel('judgeU', 0);
  const learnerU = tl.channel('learnerU', 0);
  const bracketU = tl.channel('bracketU', 0);
  const statusU = tl.channel('statusU', 0);
  const statusRows = tl.channel('statusRows', 0);
  const recapU = tl.channel('recapU', 0);
  const recapCards = tl.channel('recapCards', 0);
  const recapLine = tl.channel('recapLine', 0);

  B.forEach((at, i) => tl.set(src, i, at));
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: B[i], dur: DUR[i], text });
    tl.hold(B[i] + DUR[i], HOLD);
  });

  // — B0 · four authored layouts, one pointer, a choice to make —
  let o = B[0];
  tl.tween(thumbsU, 1, { at: o + 0.2, dur: 1.6, ease: ease.linear });
  tl.tween(pointerU, 1, { at: o + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(chooseU, 1, { at: o + 5.2, dur: 0.7, ease: ease.enter });

  // — B1 · names and shapes, one at a time —
  o = B[1];
  tl.tween(chooseU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(spot, 1, { at: o + 0.3, dur: 0.5, ease: ease.move });
  tl.tween(metaU, 1, { at: o + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_THUMB(0), { at: o + 0.2, dur: 1.2, ease: ease.move });
  const focusAt = [o + 4.4, o + 5.8, o + 7.0];
  focusAt.forEach((at, i) => {
    tl.set(focusIdx, i + 1, at);
    tl.tween(cam, CAM_THUMB(i + 1), { at, dur: 0.9, ease: ease.move });
  });
  tl.tween(spot, 0, { at: o + DUR[1] - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RACE, { at: o + DUR[1] - 0.2, dur: 1.2, ease: ease.move });

  // — B2 · a task mix, three weighted trips, one expected cost per layout —
  o = B[2];
  tl.tween(hudU, 1, { at: o + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(tripsU, 1, { at: o + 1.6, dur: 1.2, ease: ease.draw });
  tl.tween(barU, 1, { at: o + 4.6, dur: 1.6, ease: ease.linear });
  tl.tween(formulaU, 1, { at: o + 5.4, dur: 0.7, ease: ease.enter });

  // — B3 · confirm-heavy at motor context 0.375: wide-confirm wins —
  o = B[3];
  tl.tween(settingU, 1, { at: o + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(mix, CONFIRM_HEAVY, { at: o + 1.6, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: o + 1.6, dur: 1.3, ease: ease.move });
  tl.tween(valsU, 1, { at: o + 3.0, dur: 0.6, ease: ease.enter });
  tl.tween(glowU, 1, { at: o + 3.6, dur: 0.5, ease: ease.pop });

  // — B4 · details-heavy, same weights: wide-details wins at the same 546.27 —
  o = B[4];
  tl.tween(mix, DETAILS_HEAVY, { at: o + 1.4, dur: 1.4, ease: ease.move });
  tl.tween(retrainU, 1, { at: o + 5.6, dur: 0.6, ease: ease.enter });

  // — B5 · shortest distance loves near-small; duration puts it last —
  o = B[5];
  tl.tween(retrainU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(formulaU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(mix, CONFIRM_HEAVY, { at: o + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(glowU, 0, { at: o, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_RACE, { at: o + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(distU, 1, { at: o + 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(costOp, 0.15, { at: o + 1.2, dur: 0.6, ease: ease.move });
  tl.tween(nearGlow, 1, { at: o + 3.5, dur: 0.5, ease: ease.pop });
  tl.tween(costOp, 1, { at: o + 7.0, dur: 0.6, ease: ease.move });
  tl.tween(distOp, 0.15, { at: o + 7.0, dur: 0.6, ease: ease.move });
  tl.tween(nearGlow, 0, { at: o + 7.0, dur: 0.5, ease: ease.move });
  tl.tween(lastGlow, 1, { at: o + 7.4, dur: 0.5, ease: ease.pop });
  tl.tween(lastGlow, 0, { at: o + DUR[5] + 0.2, dur: 0.4, ease: ease.move });

  // — B6 · designer constraints, skipping, and the tie rule —
  o = B[6];
  tl.tween(distU, 0, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(consU, 1, { at: o + 0.4, dur: 0.6, ease: ease.enter });
  tl.set(minW, 72, o + 2.2);
  tl.tween(glowU, 1, { at: o + 2.6, dur: 0.4, ease: ease.pop });
  tl.set(minW, 32, o + 4.6);
  tl.set(maxC, 0.5, o + 4.6);
  tl.tween(skipU, 1, { at: o + 5.6, dur: 0.5, ease: ease.enter });
  tl.tween(skipU, 0, { at: o + 7.8, dur: 0.4, ease: ease.move });
  tl.set(maxC, 1, o + 8.0);
  tl.tween(mix, EQUAL, { at: o + 8.0, dur: 1.0, ease: ease.move });
  tl.tween(tieU, 1, { at: o + 9.0, dur: 0.6, ease: ease.enter });

  // — B7 · pull back: 120 situations, two selectors —
  o = B[7];
  tl.tween(cam, HOME, { at: o, dur: 1.4, ease: ease.move });
  for (const ch of [consU, tieU, hudU, settingU, glowU]) tl.tween(ch, 0, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(shrinkU, 1, { at: o + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(raceOp, 0.4, { at: o + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(gridHdrU, 1, { at: o + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(gridAU, 1, { at: o + 1.6, dur: 2.2, ease: ease.linear });
  tl.tween(sumAU, 1, { at: o + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(gridBU, 1, { at: o + 6.4, dur: 2.2, ease: ease.linear });
  tl.tween(sumBU, 1, { at: o + 8.6, dur: 0.6, ease: ease.enter });

  // — B8 · count the real choices: 40 / 60 / 20 —
  o = B[8];
  tl.tween(raceOp, 0.12, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(gridBOp, 0.12, { at: o + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(validU, 1, { at: o + 1.2, dur: 1.0, ease: ease.move });
  tl.tween(brkU, 3, { at: o + 2.4, dur: 3.6, ease: ease.linear });
  tl.tween(trivialU, 1, { at: o + 7.4, dur: 0.6, ease: ease.enter });

  // — B9 · the twenty open situations —
  o = B[9];
  tl.tween(cam, CAM_GRID, { at: o, dur: 1.3, ease: ease.move });
  tl.tween(trivialU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(isoU, 1, { at: o + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(validU, 0, { at: o + 1.2, dur: 0.8, ease: ease.move });
  tl.tween(gridBOp, 1, { at: o + 4.6, dur: 0.6, ease: ease.move });
  tl.tween(redU, 1, { at: o + 5.2, dur: 0.6, ease: ease.enter });
  tl.tween(regretU, 1, { at: o + 7.4, dur: 1.0, ease: ease.draw });

  // — B10 · the caveat: the judge and the learner share their terms —
  o = B[10];
  tl.tween(cam, HOME, { at: o, dur: 1.2, ease: ease.move });
  tl.tween(gridsOp, 0.12, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(caveatU, 1, { at: o + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(judgeU, 1, { at: o + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(learnerU, 1, { at: o + 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(bracketU, 1, { at: o + 6.6, dur: 1.0, ease: ease.draw });

  // — B11 · the status board —
  o = B[11];
  tl.tween(caveatU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(statusU, 1, { at: o + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(statusRows, 6, { at: o + 1.2, dur: 9.6, ease: ease.linear });

  // — B12 · the recap, on a quiet stage —
  o = B[12];
  tl.tween(statusU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(gridsOp, 0, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(raceOp, 0, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(recapU, 1, { at: o + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(recapCards, 3, { at: o + 0.8, dur: 6.0, ease: ease.linear });
  tl.tween(recapLine, 1, { at: o + 8.4, dur: 0.7, ease: ease.enter });
  tl.hold(B[12] + DUR[12] + HOLD, 1.8);

  return {
    tl, cam, src, nearGlow, lastGlow, thumbsU, pointerU, chooseU, focusIdx, spot, metaU, hudU, mix, tripsU, barU, formulaU,
    settingU, valsU, glowU, retrainU, distU, costOp, distOp, consU, minW, maxC, skipU, tieU, shrinkU, raceOp,
    gridHdrU, gridAU, gridBU, sumAU, sumBU, gridBOp, validU, brkU, trivialU, isoU, redU, regretU, gridsOp,
    caveatU, judgeU, learnerU, bracketU, statusU, statusRows, recapU, recapCards, recapLine,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** One 800×600 layout at thumbnail scale: viewport, the pointer, three controls, and the weighted trips. */
function Thumb({ L, x, y, pointerU, trips, mix }: { L: Layout; x: number; y: number; pointerU: number; trips: number; mix: Mix }) {
  const px = x + POINTER.x * S;
  const py = y + POINTER.y * S;
  return (
    <g>
      <rect x={x} y={y} width={TW} height={TH} rx={6} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {trips > 0.005 &&
        L.controls.map((k) => {
          const cx = x + (k.x + k.width / 2) * S;
          const cy = y + (k.y + k.height / 2) * S;
          const p = mix[k.id];
          const u = clamp01(trips);
          return (
            <line
              key={k.id}
              x1={px}
              y1={py}
              x2={lerp(px, cx, u)}
              y2={lerp(py, cy, u)}
              stroke={TASK_COLOR[k.id]}
              strokeWidth={1 + 5 * p}
              strokeLinecap="round"
              opacity={0.2 + 0.75 * p}
            />
          );
        })}
      {L.controls.map((k) => (
        <rect key={k.id} x={x + k.x * S} y={y + k.y * S} width={k.width * S} height={k.height * S} rx={2} fill={TASK_COLOR[k.id]} />
      ))}
      {pointerU > 0.005 && (
        <g opacity={pointerU} transform={`translate(${px}, ${py})`}>
          <path d="M 0 0 L 0 15 L 4 11 L 7 17 L 9.5 16 L 6.5 10 L 12 10 Z" fill="#ffffff" stroke={colors.BG} strokeWidth={1} />
        </g>
      )}
    </g>
  );
}

function Pill({ x, y, text, color, opacity, size = 14, anchor = 'middle', fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity: number; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * size * 0.6 + 20;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - size - 2} width={w} height={size + 12} rx={(size + 12) / 2} fill={fill} stroke={color} strokeWidth={1.5} />
      <text x={left + w / 2} y={y + 2} textAnchor="middle" fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

const VALID_COLOR = (n: number): string => (n === 4 ? colors.WARM : n === 3 ? colors.SECONDARY : colors.MUTED);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(v(scene.src))));
  const mix = s.get(scene.mix);

  // ---- the race, closed-form in the sampled mix and constraints
  const cons: Constraints = { minimumTargetWidth: Math.round(v(scene.minW)), maximumClutter: v(scene.maxC) };
  const costs = CANDIDATES.map((L) => expectedCost(L, mix, MOTOR, meanDurationMs));
  const dists = CANDIDATES.map((L) => expectedCost(L, mix, MOTOR, distanceCost));
  const viol = CANDIDATES.map((L) => layoutViolations(L, cons));
  const valid = viol.map((x) => x.length === 0);
  const winner = selectLayout(mix, MOTOR, cons, meanDurationMs);
  const ranks = costs.map((c, i) => (valid[i] ? costs.filter((d, j) => valid[j] && (d < c || (d === c && j < i))).length : -1));
  const nearest = dists.indexOf(Math.min(...dists));
  const isTie = Math.abs(costs[1] - costs[2]) < 1e-9;

  const thumbsU = v(scene.thumbsU);
  const spot = v(scene.spot);
  const focus = Math.round(v(scene.focusIdx));
  const shrink = v(scene.shrinkU);
  const raceOp = v(scene.raceOp);
  const textOp = 1 - clamp01(shrink * 3);
  const raceK = lerp(1, MINI.k, shrink);
  const raceTx = lerp(0, MINI.px - MINI.px * MINI.k, shrink);
  const raceTy = lerp(0, MINI.py - TY * MINI.k, shrink);
  const barU = v(scene.barU);
  const valsU = v(scene.valsU);
  const glowU = v(scene.glowU);
  const costOp = v(scene.costOp);
  const distU = v(scene.distU);
  const distOp = v(scene.distOp) * distU;
  const consU = v(scene.consU);

  // ---- grids
  const gridsOp = v(scene.gridsOp);
  const gridAU = v(scene.gridAU);
  const gridBU = v(scene.gridBU);
  const validU = v(scene.validU);
  const isoU = v(scene.isoU);
  const redU = v(scene.redU);
  const gridBOp = v(scene.gridBOp);
  const brk = v(scene.brkU);
  const trivialU = v(scene.trivialU);
  const regretU = v(scene.regretU);

  const chip = `${PIN} · ${SOURCES[srcIdx]}`;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the race: four layouts, one pointer, a bar each ================= */}
        {thumbsU > 0.005 && raceOp > 0.005 && (
          <g opacity={raceOp} transform={`translate(${raceTx}, ${raceTy}) scale(${raceK})`}>
            {CANDIDATES.map((L, i) => {
              const inU = staggerU(thumbsU, i, 4, 0.25, 0.8);
              const focusOp = lerp(1, focus === i ? 1 : 0.15, spot);
              const nameOp = textOp * (focus === i ? 1 : 1 - clamp01(spot * 1.5));
              const skipOp = valid[i] ? 1 : 0.15 + 0.85 * (1 - consU);
              const op = inU * focusOp * skipOp;
              const isWin = winner === i;
              const segs = TASKS.map((t) => mix[t] * meanDurationMs(effortInput(L, t, MOTOR)) * MS_K);
              let acc = 0;
              return (
                <g key={L.id} opacity={op} transform={`translate(0, ${lerp(-30, 0, inU)})`}>
                  <text x={TX[i]} y={NAME_Y} fontSize={16} fontFamily={MONO} fontWeight={700} fill={isWin && glowU > 0.5 ? colors.WARM : colors.TEXT} opacity={nameOp / Math.max(focusOp, 0.01)}>
                    {L.id}
                  </text>
                  <Thumb L={L} x={TX[i]} y={TY} pointerU={v(scene.pointerU)} trips={v(scene.tripsU)} mix={mix} />
                  {isWin && glowU > 0.005 && (
                    <rect x={TX[i] - 6} y={TY - 6} width={TW + 12} height={TH + 12} rx={9} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={glowU * (valid[i] ? 1 : 0)} />
                  )}
                  <text x={TX[i]} y={META_Y} fontSize={13} fill={colors.MUTED} opacity={(v(scene.metaU) * nameOp) / Math.max(focusOp, 0.01)}>
                    {META[i]}
                  </text>
                  {/* the expected-cost bar: three weighted trips, stacked */}
                  {barU > 0.005 && (
                    <g opacity={costOp}>
                      <rect x={TX[i]} y={BAR_Y} width={TW} height={BAR_H} rx={3} fill="none" stroke={colors.GRID} />
                      {segs.map((w, k) => {
                        const u = clamp01(barU * 3 - k);
                        const x0 = TX[i] + acc;
                        acc += w;
                        return u > 0 ? <rect key={k} x={x0} y={BAR_Y} width={w * u} height={BAR_H} fill={TASK_COLOR[TASKS[k]]} opacity={0.85} /> : null;
                      })}
                      {isWin && glowU > 0.005 && <rect x={TX[i] - 3} y={BAR_Y - 3} width={costs[i] * MS_K + 6} height={BAR_H + 6} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={glowU} />}
                      <text x={TX[i]} y={COST_VAL_Y} fontSize={16} fontFamily={MONO} fill={isWin && glowU > 0.5 ? colors.WARM : colors.TEXT} opacity={valsU * textOp}>
                        {costs[i].toFixed(2)} ms
                        <tspan fill={ranks[i] === 3 && v(scene.lastGlow) > 0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={ranks[i] === 3 ? lerp(14, 18, v(scene.lastGlow)) : 14} fontWeight={ranks[i] === 3 && v(scene.lastGlow) > 0.5 ? 700 : 400}>
                          {ranks[i] >= 0 ? `  ${ordinal(ranks[i])}${ranks[i] === 3 && v(scene.lastGlow) > 0.5 ? ' · last' : ''}` : '  skipped'}
                        </tspan>
                      </text>
                    </g>
                  )}
                  {/* shortest distance: expected pixels from the pointer */}
                  {distU > 0.005 && (
                    <g opacity={distOp * textOp}>
                      <rect x={TX[i]} y={DIST_BAR_Y} width={dists[i] * PX_K * clamp01(distU * 1.2)} height={BAR_H} rx={3} fill={nearest === i ? colors.WARM : colors.MUTED} opacity={nearest === i ? lerp(0.6, 1, v(scene.nearGlow)) : 0.45} />
                      <text x={TX[i]} y={DIST_VAL_Y} fontSize={16} fontFamily={MONO} fill={nearest === i ? colors.TEXT : colors.MUTED}>
                        {dists[i].toFixed(2)} px
                        <tspan fontSize={14} fill={nearest === i ? colors.WARM : colors.MUTED}>{nearest === i ? '  nearest' : ''}</tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {textOp > 0.005 && (
              <>
                {/* violated constraints, stamped over the (dimmed) thumbnails at full strength */}
                {CANDIDATES.map((L, i) =>
                  !valid[i] && consU > 0.005 ? (
                    <Pill key={L.id} x={TX[i] + TW / 2} y={TY + TH / 2 + 4} text={v(scene.skipU) > 0.5 ? `${viol[i][0]} · skipped` : viol[i][0]} color={colors.NEGATIVE} opacity={consU * textOp} size={13} />
                  ) : null,
                )}
                <g opacity={v(scene.chooseU) * textOp}>
                  <path d={`M ${TX[0]} ${BAR_Y - 6} L ${TX[0]} ${BAR_Y + 6} L ${TX[3] + TW} ${BAR_Y + 6} L ${TX[3] + TW} ${BAR_Y - 6}`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
                  <text x={640} y={BAR_Y + 34} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    selectLayout → the lowest expected duration
                  </text>
                  <text x={640} y={BAR_Y + 56} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                    four authored candidates · pointer at (96, 300) in an 800 × 600 viewport
                  </text>
                </g>
                <text x={TX[0]} y={COST_TITLE_Y} fontSize={13} fill={colors.MUTED} opacity={clamp01(barU * 3) * costOp * textOp}>
                  expected duration (ms) · bar = confirm + details + cancel, each probability × duration
                </text>
                <text x={640} y={FORMULA_Y} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.formulaU) * textOp}>
                  expectedCost = Σ taskProbabilities[task] · cost(effortInput(layout, task, …))
                </text>
                <text x={TX[0]} y={DIST_TITLE_Y} fontSize={13} fill={colors.MUTED} opacity={distOp * textOp}>
                  shortest-distance · cost = pixels from the pointer, same weighted sum
                </text>
                {isTie && (
                  <Pill x={(TX[1] + TX[2] + TW) / 2} y={532} text={`exact tie ${TIE.toFixed(2)} = ${TIE.toFixed(2)} · strict < keeps wide-confirm, the earlier`} color={colors.WARM} opacity={v(scene.tieU) * textOp} size={13} />
                )}
                {/* designer constraints */}
                {consU > 0.005 && (
                  <g opacity={consU * textOp}>
                    <rect x={300} y={404} width={680} height={96} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={322} y={432} fontSize={13} fill={colors.MUTED}>
                      designer constraints · selectLayout skips any layout with a violation
                    </text>
                    <text x={322} y={462} fontSize={16} fontFamily={MONO} fill={cons.minimumTargetWidth !== 32 ? colors.WARM : colors.TEXT}>
                      minimumTargetWidth: {cons.minimumTargetWidth}
                    </text>
                    <text x={652} y={462} fontSize={16} fontFamily={MONO} fill={cons.maximumClutter !== 1 ? colors.WARM : colors.TEXT}>
                      maximumClutter: {cons.maximumClutter}
                    </text>
                    <text x={322} y={488} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                      {'if (value < minimum) selected = layout   // first of equals wins'}
                    </text>
                  </g>
                )}
              </>
            )}
          </g>
        )}

        {/* ================= 120 situations, two selectors ================= */}
        {gridAU > 0.005 && gridsOp > 0.005 && (
          <g opacity={gridsOp}>
            <text x={658} y={246} textAnchor="middle" fontSize={14} fill={colors.MUTED} opacity={v(scene.gridHdrU)}>
              120 situations = 5 task mixes × 4 motor contexts × 3 min widths × 2 max clutters
            </text>
            <text x={284} y={GA_Y + 72} textAnchor="end" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
              predicted-effort
            </text>
            <text x={284} y={GA_Y + 92} textAnchor="end" fontSize={13} fill={colors.MUTED}>
              the learned model
            </text>
            {SITS.map((st, k) => {
              const u = staggerU(gridAU, k, 120, 0.012, 0.25);
              if (u <= 0) return null;
              const isoOp = st.nValid === 4 ? 1 : lerp(1, 0.12, isoU);
              const triv = st.nValid === 1 ? trivialU : 0;
              return (
                <g key={k} opacity={u * isoOp}>
                  <rect x={GX(st.c)} y={GA_Y + st.r * 30} width={CELL} height={CELL} rx={3} fill={colors.POSITIVE} opacity={0.85 * (1 - validU)} />
                  {validU > 0.005 && <rect x={GX(st.c)} y={GA_Y + st.r * 30} width={CELL} height={CELL} rx={3} fill={VALID_COLOR(st.nValid)} opacity={validU * (st.nValid === 1 ? 0.55 : 0.9)} />}
                  {triv > 0.005 && <line x1={GX(st.c) + 5} y1={GA_Y + st.r * 30 + CELL - 5} x2={GX(st.c) + CELL - 5} y2={GA_Y + st.r * 30 + 5} stroke={colors.BG} strokeWidth={2.5} opacity={triv} />}
                </g>
              );
            })}
            {gridBU > 0.005 && (
              <g opacity={gridBOp}>
                <text x={284} y={GB_Y + 72} textAnchor="end" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
                  shortest-distance
                </text>
                <text x={284} y={GB_Y + 92} textAnchor="end" fontSize={13} fill={colors.MUTED}>
                  the pixel rule
                </text>
                {SITS.map((st, k) => {
                  const u = staggerU(gridBU, k, 120, 0.012, 0.25);
                  if (u <= 0) return null;
                  const isoOp = st.nValid === 4 ? 1 : lerp(1, 0.12, isoU);
                  return (
                    <g key={k} opacity={u * isoOp}>
                      <rect x={GX(st.c)} y={GB_Y + st.r * 30} width={CELL} height={CELL} rx={3} fill={st.distMatch ? colors.POSITIVE : colors.MUTED} opacity={st.distMatch ? 0.85 : 0.35} />
                      {!st.distMatch && st.nValid === 4 && redU > 0.005 && <rect x={GX(st.c)} y={GB_Y + st.r * 30} width={CELL} height={CELL} rx={3} fill={colors.NEGATIVE} opacity={0.85 * redU} />}
                    </g>
                  );
                })}
                <text x={658} y={GB_Y + 166} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={(1 - isoU) * v(scene.sumBU)}>
                  green = picks the simulator&apos;s best layout · rows: task mixes · columns: contexts × constraint pairs
                </text>
              </g>
            )}

            {/* right column: the headline, its breakdown, the open subset */}
            <g opacity={v(scene.sumAU)}>
              <g opacity={1 - isoU}>
                <text x={SUM_X} y={GA_Y + 34} fontSize={30} fontFamily={MONO} fontWeight={700} fill={colors.POSITIVE}>
                  {SITS.length} / {SITS.length}
                </text>
                <text x={SUM_X} y={GA_Y + 60} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={1 - clamp01(brk)}>
                  mean {OPT_MEAN.toFixed(2)} ms
                </text>
                {[0, 1, 2].map((j) => (
                  <g key={j} opacity={clamp01(brk - j)}>
                    <rect x={SUM_X} y={GA_Y + 50 + j * 26} width={14} height={14} rx={2} fill={VALID_COLOR([1, 3, 4][j])} opacity={j === 0 ? 0.55 : 0.9} />
                    <text x={SUM_X + 22} y={GA_Y + 62 + j * 26} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                      {[1, 3, 4][j]} valid · {N_VALID[j]}
                    </text>
                  </g>
                ))}
                <text x={SUM_X} y={GA_Y + 140} fontSize={14} fill={colors.MUTED} opacity={trivialU}>
                  {N_VALID[0]} trivial wins
                </text>
              </g>
              <g opacity={isoU}>
                <text x={SUM_X} y={GA_Y + 34} fontSize={30} fontFamily={MONO} fontWeight={700} fill={colors.POSITIVE}>
                  {OPEN_SITS.length} / {OPEN_SITS.length}
                </text>
                <text x={SUM_X} y={GA_Y + 60} fontSize={14} fill={colors.MUTED}>
                  all four allowed
                </text>
              </g>
            </g>
            <g opacity={v(scene.sumBU) * gridBOp}>
              <g opacity={1 - isoU}>
                <text x={SUM_X} y={GB_Y + 34} fontSize={30} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  {DIST_MATCHES} / {SITS.length}
                </text>
                <text x={SUM_X} y={GB_Y + 60} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  mean {DIST_MEAN.toFixed(2)} ms
                </text>
              </g>
              <g opacity={isoU * redU}>
                <text x={SUM_X} y={GB_Y + 34} fontSize={30} fontFamily={MONO} fontWeight={700} fill={colors.NEGATIVE}>
                  {OPEN_DIST_MATCHES} / {OPEN_SITS.length}
                </text>
                <g opacity={regretU}>
                  <rect x={SUM_X} y={GB_Y + 52} width={OPEN_REGRET * clamp01(regretU)} height={14} rx={2} fill={colors.NEGATIVE} opacity={0.85} />
                  <text x={SUM_X} y={GB_Y + 86} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                    +{OPEN_REGRET.toFixed(2)} ms
                  </text>
                  <text x={SUM_X} y={GB_Y + 106} fontSize={13} fill={colors.MUTED}>
                    mean regret
                  </text>
                </g>
              </g>
            </g>
          </g>
        )}

        {/* ================= the caveat: same terms on both sides ================= */}
        {v(scene.caveatU) > 0.005 && (
          <g opacity={v(scene.caveatU)}>
            <rect x={170} y={250} width={940} height={320} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={290} textAnchor="middle" fontSize={19} fill={colors.TEXT}>
              the judge and the learner share their terms
            </text>
            <g opacity={v(scene.judgeU)}>
              <text x={210} y={336} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                simulator.ts · meanDurationMs · picks the &quot;best&quot; layout
              </text>
              <MathLabel tex={'T = 200 + 110\\,D + 180\\,c + 80\\,m + 65\\,m D'} x={600} y={376} fontSize={26} opacity={v(scene.judgeU)} boxWidth={760} />
            </g>
            <g opacity={v(scene.learnerU)}>
              <text x={210} y={430} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                predictor.ts · inputFeatures · five fitted weights
              </text>
              <MathLabel tex={'\\hat T = w_0 + w_1 \\tfrac{D}{6} + w_2\\,c + w_3\\,m + w_4 \\tfrac{D}{6} m'} x={600} y={472} fontSize={26} opacity={v(scene.learnerU)} boxWidth={760} />
            </g>
            <text x={640} y={540} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.learnerU)}>
              D = log2(1 + distance / width) · c = clutter · m = motorContext
            </text>
            {v(scene.bracketU) > 0.005 && (
              <g opacity={clamp01(v(scene.bracketU) * 1.5)}>
                <path
                  d={`M 975 362 L 990 362 L 990 ${lerp(362, 486, clamp01(v(scene.bracketU)))} ${v(scene.bracketU) > 0.98 ? 'L 975 486' : ''}`}
                  fill="none"
                  stroke={colors.WARM}
                  strokeWidth={2.5}
                />
                <text x={1004} y={430} fontSize={17} fill={colors.WARM}>
                  same
                </text>
                <text x={1004} y={452} fontSize={17} fill={colors.WARM}>
                  formula
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the status board ================= */}
        {v(scene.statusU) > 0.005 && (
          <g opacity={v(scene.statusU)}>
            <rect x={230} y={240} width={820} height={340} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={270} y={282} fontSize={19} fill={colors.TEXT}>
              status at the pin · {PIN}
            </text>
            {[
              { mark: '✓', text: 'bun test lab/user-effort · 11 pass, 0 fail', color: colors.POSITIVE },
              { mark: '✓', text: `report.ts reproduces the README · ${OPT_MEAN.toFixed(2)} / ${DIST_MEAN.toFixed(2)} ms · 120 / ${DIST_MATCHES}`, color: colors.POSITIVE },
              { mark: '●', text: 'holds · synthetic durations only', color: colors.WARM },
              { mark: '✗', text: 'no human results', color: colors.NEGATIVE },
              { mark: '✗', text: 'no error prediction', color: colors.NEGATIVE },
              { mark: '✗', text: 'no uncertainty estimates', color: colors.NEGATIVE },
            ].map((row, j) => (
              <g key={j} opacity={clamp01(v(scene.statusRows) * 1.6 - j * 1.6 + (j > 2 ? 0 : 0))}>
                <text x={276} y={332 + j * 40 + (j > 2 ? 14 : 0)} fontSize={18} fill={row.color}>
                  {row.mark}
                </text>
                <text x={306} y={332 + j * 40 + (j > 2 ? 14 : 0)} fontSize={16} fontFamily={MONO} fill={j > 2 ? colors.MUTED : colors.TEXT}>
                  {row.text}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* ================= the recap ================= */}
        {v(scene.recapU) > 0.005 && (
          <g opacity={v(scene.recapU)}>
            {[
              { title: 'a law we wrote', sub: 'simulator.ts · five authored terms', color: colors.TEXT },
              { title: 'five coefficients', sub: 'fitted once, then frozen', color: colors.ACCENT },
              { title: 'a chooser', sub: 'follows a stated task mix', color: colors.WARM },
            ].map((c, j) => {
              const u = clamp01(v(scene.recapCards) - j);
              const cx = 330 + j * 310;
              return (
                <g key={j} opacity={u} transform={`translate(0, ${lerp(16, 0, u)})`}>
                  <rect x={cx - 130} y={250} width={260} height={130} rx={12} fill={colors.PANEL} stroke={c.color} strokeWidth={1.8} />
                  <text x={cx} y={308} textAnchor="middle" fontSize={22} fill={c.color}>
                    {c.title}
                  </text>
                  <text x={cx} y={340} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {c.sub}
                  </text>
                  {j < 2 && <Vec x1={cx + 138} y1={315} x2={cx + 172} y2={315} color={colors.MUTED} width={2} head={8} opacity={u} />}
                </g>
              );
            })}
            <text x={640} y={450} textAnchor="middle" fontSize={20} fill={colors.TEXT} opacity={v(scene.recapLine)}>
              a clean pipeline test, not evidence about real users
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title, source, and the task-mix dial ================= */}
      <rect x={40} y={18} width={210} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        3 · Choosing a Layout
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
      {v(scene.hudU) > 0.005 && (
        <g opacity={v(scene.hudU)}>
          {TASKS.map((t, k) => (
            <g key={t}>
              <rect x={820 + k * 142} y={22} width={12} height={12} rx={2} fill={TASK_COLOR[t]} />
              <text x={838 + k * 142} y={33} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                {t} {mix[t].toFixed(2)}
              </text>
            </g>
          ))}
          {(() => {
            let acc = 0;
            return TASKS.map((t) => {
              const w = mix[t] * 420;
              const x0 = 820 + acc;
              acc += w;
              return <rect key={t} x={x0} y={42} width={Math.max(0, w - 2)} height={14} rx={2} fill={TASK_COLOR[t]} opacity={0.85} />;
            });
          })()}
        </g>
      )}
      <text x={1240} y={80} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.settingU)}>
        motorContext 0.375 · minimumTargetWidth {cons.minimumTargetWidth} · maximumClutter {cons.maximumClutter}
      </text>
      <Pill x={1240} y={106} anchor="end" text="same five trained weights · nothing retrained" color={colors.WARM} opacity={v(scene.retrainU)} size={13} />
    </>
  );
}

export const vizScene = () => scene;
