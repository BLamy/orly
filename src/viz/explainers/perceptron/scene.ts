import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Perceptron — a line that learns.
 *
 * All math lives here at module scope: two seeded Gaussian clusters, a
 * mulberry32-shuffled visit order, and the ACTUAL perceptron training run —
 * cycling through the points, applying w ← w + y·x, b ← b + y on every
 * mistake until a full pass is clean. The animation replays the recorded
 * trajectory of (w1, w2, b) states; nothing is faked and nothing below uses
 * wall-clock time or unseeded randomness.
 *
 * Empirics with SEED = 13 (verified by running this exact code):
 *   32 points, 18 initially misclassified by the starting guess,
 *   8 mistake-driven updates across 4 epochs,
 *   final state w = (2.33, 0.56), b = −0.80,
 *   |w| never drops below ~1.0 along the lerped trajectory (the drawn line
 *   never degenerates while interpolating between recorded states).
 */

export type Pt = readonly [number, number];
export type WState = readonly [number, number, number]; // [w1, w2, b]

// ---------------------------------------------------------------------------
// Data — two seeded Gaussian clusters (linearly separable)
// ---------------------------------------------------------------------------

export interface LabeledPoint {
  x: number;
  y: number;
  /** class label */
  label: 1 | -1;
}

const SEED = 13;
const N_PER_CLASS = 16;
const CX = 1.0;
const CY = 0.65;
const SIGMA = 0.55;

const rand = mulberry32(SEED);
const normal = gaussian(rand);

export const POINTS: LabeledPoint[] = (() => {
  const out: LabeledPoint[] = [];
  for (let i = 0; i < N_PER_CLASS; i++) {
    out.push({ x: CX + SIGMA * normal(), y: CY + SIGMA * normal(), label: 1 });
  }
  for (let i = 0; i < N_PER_CLASS; i++) {
    out.push({ x: -CX + SIGMA * normal(), y: -CY + SIGMA * normal(), label: -1 });
  }
  return out;
})();

export const N_POINTS = POINTS.length; // 32

/** Fisher–Yates visit order, drawn from the same seeded stream. */
export const ORDER: number[] = (() => {
  const order = POINTS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();

// ---------------------------------------------------------------------------
// The training run — the real perceptron algorithm, recorded
// ---------------------------------------------------------------------------

/** Deliberately wrong starting guess so there is something to learn. */
export const INIT_STATE: WState = [-0.6, 0.9, 1.2];

export interface UpdateEvent {
  /** index into POINTS of the misclassified example that fired this update */
  point: number;
  /** state before the update (== STATES[k]) */
  before: WState;
  /** state after w ← w + y·x, b ← b + y (== STATES[k + 1]) */
  after: WState;
}

const MAX_EPOCHS = 80;

function train(): { states: WState[]; events: UpdateEvent[]; epochs: number } {
  let [w1, w2, b] = INIT_STATE;
  const states: WState[] = [INIT_STATE];
  const events: UpdateEvent[] = [];
  let epochs = 0;
  for (let e = 0; e < MAX_EPOCHS; e++) {
    let mistakes = 0;
    for (const i of ORDER) {
      const p = POINTS[i];
      if (p.label * (w1 * p.x + w2 * p.y + b) <= 0) {
        const before: WState = [w1, w2, b];
        w1 += p.label * p.x;
        w2 += p.label * p.y;
        b += p.label;
        const after: WState = [w1, w2, b];
        states.push(after);
        events.push({ point: i, before, after });
        mistakes++;
      }
    }
    epochs = e + 1;
    if (mistakes === 0) break;
  }
  return { states, events, epochs };
}

const RUN = train();
/** Every recorded (w1, w2, b) — initial guess plus one entry per update. */
export const STATES: WState[] = RUN.states;
/** The mistake-driven updates, in the order they actually fired. */
export const EVENTS: UpdateEvent[] = RUN.events;
/** The honest mistake count: 8 with the constants above. */
export const MISTAKES = EVENTS.length;
export const EPOCHS = RUN.epochs;
export const FINAL: WState = STATES[STATES.length - 1];

/** How many points the starting guess gets wrong (18 of 32 with SEED = 13). */
export const INIT_WRONG: number = POINTS.filter(
  (p) => p.label * (INIT_STATE[0] * p.x + INIT_STATE[1] * p.y + INIT_STATE[2]) <= 0,
).length;

/** Point indices the INITIAL line misclassifies (for the "bad guess" beat). */
export const INIT_WRONG_SET: ReadonlySet<number> = new Set(
  POINTS.map((_, i) => i).filter((i) => {
    const p = POINTS[i];
    return p.label * (INIT_STATE[0] * p.x + INIT_STATE[1] * p.y + INIT_STATE[2]) <= 0;
  }),
);

/** Sweep order for the final verification lap (left to right). */
export const CHECK_RANK: number[] = (() => {
  const rank = new Array<number>(N_POINTS);
  POINTS.map((p, i) => [p.x, i] as const)
    .sort((a, b) => a[0] - b[0])
    .forEach(([, i], r) => {
      rank[i] = r;
    });
  return rank;
})();

// ---------------------------------------------------------------------------
// Pure lookups for playback
// ---------------------------------------------------------------------------

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Lerped (w1, w2, b) at fractional update index f ∈ [0, MISTAKES]. */
export function stateAt(f: number): WState {
  const g0 = clamp(f, 0, STATES.length - 1);
  const i = Math.floor(g0);
  if (i >= STATES.length - 1) return STATES[STATES.length - 1];
  const t = g0 - i;
  const a = STATES[i];
  const b = STATES[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export interface LineGeom {
  /** endpoints of the drawn line (data coords, span ±12 units) */
  a: Pt;
  b: Pt;
  /** anchor: the line's closest point to the data origin */
  anchor: Pt;
  /** unit normal pointing into the predicted-positive half-plane */
  n: Pt;
  /** unit direction along the line */
  d: Pt;
  /** |w| */
  mag: number;
}

const LINE_SPAN = 12;

/** Closed-form geometry of the decision line w·x + b = 0. */
export function lineGeom([w1, w2, b]: WState): LineGeom | null {
  const mag = Math.hypot(w1, w2);
  if (mag < 1e-6) return null;
  const nx = w1 / mag;
  const ny = w2 / mag;
  const ax = (-b / (mag * mag)) * w1;
  const ay = (-b / (mag * mag)) * w2;
  const dx = -ny;
  const dy = nx;
  return {
    a: [ax - dx * LINE_SPAN, ay - dy * LINE_SPAN],
    b: [ax + dx * LINE_SPAN, ay + dy * LINE_SPAN],
    anchor: [ax, ay],
    n: [nx, ny],
    d: [dx, dy],
    mag,
  };
}

// ---------------------------------------------------------------------------
// Stage mapping — uniform 160 px per data unit, data centered at (0.5, 0.3)
// ---------------------------------------------------------------------------

export const PX = 160;
export const DOMAIN_X: readonly [number, number] = [-3.5, 4.5];
export const DOMAIN_Y: readonly [number, number] = [-1.95, 2.55];

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_X])
  .range([0, STAGE_W]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_Y])
  .range([STAGE_H, 0]);

const stagePt = (p: LabeledPoint): Pt => [xScale(p.x), yScale(p.y)];

/** Camera targets for the three slow, examined updates. */
export const EVENT_CAMS: CameraState[] = EVENTS.slice(0, 3).map((ev) => {
  const [sx, sy] = stagePt(POINTS[ev.point]);
  return { x: sx + 30, y: sy - 20, k: 1.55 };
});

export const CAM_LINE: CameraState = { x: 615, y: 345, k: 1.12 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  labelsU: ChannelRef<number>;
  lineU: ChannelRef<number>;
  wU: ChannelRef<number>;
  ruleTexU: ChannelRef<number>;
  misU: ChannelRef<number>;
  updTexU: ChannelRef<number>;
  counterU: ChannelRef<number>;
  evtProg: ChannelRef<number>;
  hlIdx: ChannelRef<number>;
  hlU: ChannelRef<number>;
  nudgeU: ChannelRef<number>;
  checkU: ChannelRef<number>;
  tintU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const axesU = tl.channel('axesU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const labelsU = tl.channel('labelsU', 0);
  const lineU = tl.channel('lineU', 0);
  const wU = tl.channel('wU', 0);
  const ruleTexU = tl.channel('ruleTexU', 0);
  const misU = tl.channel('misU', 0);
  const updTexU = tl.channel('updTexU', 0);
  const counterU = tl.channel('counterU', 0);
  const evtProg = tl.channel('evtProg', 0);
  const hlIdx = tl.channel('hlIdx', 0);
  const hlU = tl.channel('hlU', 0);
  const nudgeU = tl.channel('nudgeU', 0);
  const checkU = tl.channel('checkU', 0);
  const tintU = tl.channel('tintU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · two clouds, two labels ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Thirty two points, two families. Every dot is an example, and each one carries a label: blue or rose.',
  });
  tl.tween(axesU, 1, { at: 0.3, dur: 1.4, ease: ease.draw });
  tl.tween(dotsU, 1, { at: 0.6, dur: 2.4, ease: ease.enter });
  tl.tween(labelsU, 1, { at: 3.0, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 4.8,
    text: 'You want a rule that tells them apart. The simplest rule there is: a straight line through the plane.',
  });
  tl.hold(11.1, 0.7);

  // — Beat 2 · the line, and its math ————————————————————————————————————
  tl.caption({
    at: 11.8,
    dur: 6.2,
    text: 'A line is just two weights and a bias. Take any point, and the sign of the weighted sum says which side you are on.',
    tex: '\\hat y = \\mathrm{sign}(\\mathbf{w}\\cdot\\mathbf{x} + b)',
  });
  tl.tween(lineU, 1, { at: 12.0, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAM_LINE, { at: 12.2, dur: 1.6, ease: ease.move });
  tl.tween(wU, 1, { at: 13.6, dur: 0.7, ease: ease.enter });
  tl.tween(ruleTexU, 1, { at: 14.4, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 18.4,
    dur: 5.4,
    text: 'This first line is a bad guess. Eighteen of the thirty two points sit on the wrong side of it.',
  });
  tl.tween(misU, 1, { at: 18.8, dur: 0.9, ease: ease.enter });
  tl.hold(23.8, 0.6);

  // — Beat 3 · the update rule ———————————————————————————————————————————
  tl.caption({
    at: 24.4,
    dur: 6.6,
    text: 'The perceptron fixes it with one embarrassingly simple move. Visit the points, and whenever one is on the wrong side, nudge the weights toward it.',
    tex: '\\mathbf{w} \\leftarrow \\mathbf{w} + y\\,\\mathbf{x},\\quad b \\leftarrow b + y',
  });
  tl.tween(updTexU, 1, { at: 25.0, dur: 0.7, ease: ease.enter });
  tl.tween(counterU, 1, { at: 26.0, dur: 0.7, ease: ease.enter });
  tl.tween(misU, 0, { at: 29.8, dur: 0.9, ease: ease.move });
  tl.hold(31.0, 0.4);

  // — Beat 4 · update one, examined ——————————————————————————————————————
  tl.set(hlIdx, 0, 31.2);
  tl.tween(cam, EVENT_CAMS[0], { at: 31.4, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 31.6,
    dur: 5.2,
    text: 'Here is the first mistake the sweep finds: a rose point stranded on the blue side of the line.',
  });
  tl.tween(hlU, 1, { at: 31.8, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 37.0,
    dur: 5.8,
    text: 'Add its coordinates to the weights, flipped by its label. The weight vector tilts, and the whole line swings toward putting that point right.',
  });
  tl.tween(nudgeU, 1, { at: 37.2, dur: 0.8, ease: ease.enter });
  tl.tween(evtProg, 1, { at: 38.6, dur: 1.4, ease: ease.move });
  tl.tween(nudgeU, 0, { at: 40.6, dur: 0.5, ease: ease.move });
  tl.tween(hlU, 0, { at: 40.8, dur: 0.5, ease: ease.move });
  tl.hold(42.8, 0.4);

  // — Beat 5 · update two ————————————————————————————————————————————————
  tl.set(hlIdx, 1, 43.0);
  tl.tween(cam, EVENT_CAMS[1], { at: 43.2, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 43.4,
    dur: 6.2,
    text: 'Next, a blue point stranded on the rose side, so the same move runs in reverse. Each nudge is one honest correction: no calculus, no learning rate to tune.',
  });
  tl.tween(hlU, 1, { at: 43.8, dur: 0.6, ease: ease.enter });
  tl.tween(nudgeU, 1, { at: 45.4, dur: 0.8, ease: ease.enter });
  tl.tween(evtProg, 2, { at: 46.8, dur: 1.3, ease: ease.move });
  tl.tween(nudgeU, 0, { at: 48.6, dur: 0.5, ease: ease.move });
  tl.tween(hlU, 0, { at: 48.8, dur: 0.5, ease: ease.move });
  tl.hold(49.8, 0.4);

  // — Beat 6 · update three ——————————————————————————————————————————————
  tl.set(hlIdx, 2, 50.2);
  tl.tween(cam, EVENT_CAMS[2], { at: 50.4, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 50.6,
    dur: 6.0,
    text: 'One more stray, one more nudge. Notice the line never moves unless a point is wrong. Mistakes are the only teacher this algorithm has.',
  });
  tl.tween(hlU, 1, { at: 50.9, dur: 0.6, ease: ease.enter });
  tl.tween(nudgeU, 1, { at: 52.2, dur: 0.8, ease: ease.enter });
  tl.tween(evtProg, 3, { at: 53.6, dur: 1.2, ease: ease.move });
  tl.tween(nudgeU, 0, { at: 55.2, dur: 0.5, ease: ease.move });
  tl.tween(hlU, 0, { at: 55.4, dur: 0.5, ease: ease.move });
  tl.hold(56.4, 0.4);

  // — Beat 7 · let it run to convergence —————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 56.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 57.2,
    dur: 5.6,
    text: 'Now let it run at full speed. It keeps cycling through the shuffled points, and every wrong answer buys one more correction.',
  });
  tl.tween(evtProg, MISTAKES, { at: 58.6, dur: 5.6, ease: ease.linear });
  tl.caption({
    at: 63.4,
    dur: 6.2,
    text: 'Then a full pass finds nothing left to fix. Eight mistake driven updates in total, over four passes: that is the whole training run, counted honestly.',
  });
  tl.hold(69.6, 0.6);

  // — Beat 8 · verification lap ——————————————————————————————————————————
  tl.caption({
    at: 70.2,
    dur: 6.4,
    text: 'Check every point: all thirty two now land on the correct side. Blue territory on one side of the line, rose on the other.',
  });
  tl.tween(tintU, 1, { at: 70.4, dur: 1.4, ease: ease.move });
  tl.tween(checkU, 1, { at: 70.8, dur: 4.6, ease: ease.linear });
  tl.hold(76.6, 0.6);

  // — Beat 9 · recap ————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 77.2, dur: 1.3, ease: ease.move });
  tl.tween(ruleTexU, 0, { at: 77.2, dur: 0.8, ease: ease.move });
  tl.tween(updTexU, 0, { at: 77.2, dur: 0.8, ease: ease.move });
  tl.tween(counterU, 0, { at: 77.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 78.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 78.4,
    dur: 5.8,
    text: 'That is the perceptron, from nineteen fifty eight: a line that learns by being wrong, one nudge at a time.',
  });
  tl.caption({
    at: 84.6,
    dur: 6.6,
    text: 'And it comes with a promise: whenever a separating line exists, this loop is guaranteed to find one. Next up, what happens when no straight line can do the job.',
  });
  tl.hold(91.2, 1.2);

  return {
    tl,
    cam,
    axesU,
    dotsU,
    labelsU,
    lineU,
    wU,
    ruleTexU,
    misU,
    updTexU,
    counterU,
    evtProg,
    hlIdx,
    hlU,
    nudgeU,
    checkU,
    tintU,
    dimU,
    endU,
  };
}
