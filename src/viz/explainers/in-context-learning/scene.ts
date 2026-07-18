import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * In-Context Learning — a new task, learned from the prompt alone.
 *
 * All math at module scope: a hidden linear rule y = a x + b is fixed, and a
 * sequence of seeded example pairs is drawn. The "model" fits that rule from
 * ONLY the examples currently in the prompt, by exact least squares, and
 * predicts a held-out query — with no weight updates anywhere. As more
 * examples enter the context, the fitted line snaps to the truth and the
 * query error collapses. This is a faithful toy of in-context learning:
 * inference-time adaptation, weights frozen.
 *
 * Empirics with SEED = 6 (verified by running this exact code): the true rule
 * is y = 1.7 x - 0.6; query error falls from a wild first guess toward zero as
 * the example count climbs; by 8 examples the fit is essentially exact.
 */

export const A_TRUE = 1.7;
export const B_TRUE = -0.6;
export const SEED = 6;
export const MAX_K = 9;

const rand = mulberry32(SEED);
const g = gaussian(rand);

export interface Ex {
  x: number;
  y: number;
}
/** Seeded example pairs (tiny observation noise). */
export const EXAMPLES: Ex[] = Array.from({ length: MAX_K }, () => {
  const x = 2.2 * (rand() * 2 - 1);
  return { x, y: A_TRUE * x + B_TRUE + 0.12 * g() };
});

/** A fixed query point (the thing to predict). */
export const QUERY_X = 1.35;
export const QUERY_Y = A_TRUE * QUERY_X + B_TRUE;

export interface Fit {
  a: number;
  b: number;
  pred: number; // prediction at QUERY_X
  err: number; // |pred - QUERY_Y|
}

/** Exact least-squares fit from the first k examples (k >= 1). */
export function fitK(k: number): Fit {
  const pts = EXAMPLES.slice(0, Math.max(1, k));
  const n = pts.length;
  if (n === 1) {
    // one point: no slope info — assume the prior slope 0 through the point
    const a = 0;
    const b = pts[0].y;
    const pred = a * QUERY_X + b;
    return { a, b, pred, err: Math.abs(pred - QUERY_Y) };
  }
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) * (p.x - mx);
    sxy += (p.x - mx) * (p.y - my);
  }
  const a = sxx < 1e-9 ? 0 : sxy / sxx;
  const b = my - a * mx;
  const pred = a * QUERY_X + b;
  return { a, b, pred, err: Math.abs(pred - QUERY_Y) };
}

export const FITS: Fit[] = Array.from({ length: MAX_K }, (_, i) => fitK(i + 1));

/** Lerped fit at fractional example count f in [1, MAX_K]. */
export function fitAt(f: number): Fit {
  const g0 = Math.max(1, Math.min(MAX_K, f));
  const i = Math.floor(g0);
  const A = FITS[i - 1];
  if (i >= MAX_K) return FITS[MAX_K - 1];
  const B = FITS[i];
  const t = g0 - i;
  return {
    a: A.a + (B.a - A.a) * t,
    b: A.b + (B.b - A.b) * t,
    pred: A.pred + (B.pred - A.pred) * t,
    err: A.err + (B.err - A.err) * t,
  };
}

// ---------------------------------------------------------------------------
// Layout — prompt strip on top, x-y plane below, error meter on the right
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear().domain([-3, 3]).range([120, 760]);
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-5, 5]).range([620, 120]);

export const errX: ScaleLinear<number, number> = scaleLinear().domain([1, MAX_K]).range([900, 1210]);
export const errY: ScaleLinear<number, number> = scaleLinear().domain([0, FITS[0].err * 1.05]).range([560, 200]);

export const PROMPT_Y = 70;
export const promptX = (i: number): number => 130 + i * 118;

export const CAM_PLANE: CameraState = { x: 440, y: 360, k: 1.2 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  planeU: ChannelRef<number>;
  kProg: ChannelRef<number>; // 1..MAX_K — examples in the prompt
  lineU: ChannelRef<number>;
  queryU: ChannelRef<number>;
  truthU: ChannelRef<number>; // reveal the hidden true line
  errU: ChannelRef<number>;
  promptU: ChannelRef<number>;
  texU: ChannelRef<number>;
  frozenU: ChannelRef<number>; // "weights frozen" badge
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const planeU = tl.channel('planeU', 0);
  const kProg = tl.channel('kProg', 1);
  const lineU = tl.channel('lineU', 0);
  const queryU = tl.channel('queryU', 0);
  const truthU = tl.channel('truthU', 0);
  const errU = tl.channel('errU', 0);
  const promptU = tl.channel('promptU', 0);
  const texU = tl.channel('texU', 0);
  const frozenU = tl.channel('frozenU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the surprise ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Somewhere along the scaling curve, something strange appeared. You can teach a trained model a brand new task without touching its weights at all. You just show it a few examples in the prompt.',
  });
  tl.tween(promptU, 1, { at: 0.4, dur: 1.4, ease: ease.enter });
  tl.tween(frozenU, 1, { at: 1.6, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'To see it cleanly, here is a toy task the model has never met: a hidden rule turning each input number into an output number. Learn the rule from examples, then answer a new one.',
  });
  tl.tween(cam, CAM_PLANE, { at: 6.8, dur: 1.6, ease: ease.move });
  tl.tween(planeU, 1, { at: 7.0, dur: 1.4, ease: ease.draw });
  tl.tween(texU, 1, { at: 8.6, dur: 0.8, ease: ease.enter });
  tl.hold(11.9, 0.6);

  // — Beat 2 · one example ————————————————————————————————————————————————
  tl.caption({
    at: 12.5,
    dur: 5.6,
    text: 'One example in the prompt. From a single point, the best you can do is guess it is constant. The query prediction is way off, and the error meter is tall. Not enough evidence yet.',
  });
  tl.tween(lineU, 1, { at: 13.0, dur: 1.0, ease: ease.draw });
  tl.tween(queryU, 1, { at: 13.8, dur: 0.7, ease: ease.enter });
  tl.tween(errU, 1, { at: 14.4, dur: 1.0, ease: ease.draw });
  tl.hold(18.7, 0.5);

  // — Beat 3 · add examples ————————————————————————————————————————————————
  tl.caption({
    at: 19.2,
    dur: 6.0,
    text: 'Now feed in more pairs, one at a time. The fitted line pivots to catch them, the query prediction slides toward the true answer, and the error meter drops with every example added.',
  });
  tl.tween(kProg, 5, { at: 20.0, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 25.5,
    dur: 5.2,
    text: 'Keep going. By a handful of examples the line has locked onto the hidden rule. Reveal the truth, and the model’s line sits right on top of it.',
  });
  tl.tween(kProg, MAX_K, { at: 26.2, dur: 4.0, ease: ease.move });
  tl.tween(truthU, 1, { at: 29.4, dur: 1.0, ease: ease.draw });
  tl.hold(30.9, 0.6);

  // — Beat 4 · the twist ——————————————————————————————————————————————————
  tl.caption({
    at: 31.5,
    dur: 6.2,
    text: 'Here is the part that unsettles people. Not one weight changed. The whole adaptation happened inside a single forward pass, as the model read the prompt. The examples reconfigured its behavior, not its parameters.',
  });
  tl.hold(38.3, 0.6);

  // — Beat 5 · why it matters ——————————————————————————————————————————————
  tl.caption({
    at: 38.9,
    dur: 6.0,
    text: 'That is in-context learning. A big enough next-token predictor doesn’t just store patterns, it learns to run little learning algorithms on the fly, using the prompt as its training set. Nobody put that there on purpose.',
  });
  tl.hold(45.5, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 46.1, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 46.7, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 46.7, dur: 0.8, ease: ease.move });
  tl.tween(frozenU, 0, { at: 46.7, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 47.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.9,
    dur: 5.8,
    text: 'In-context learning is why prompting works at all: the model adapts to your task from the examples you give it, weights frozen, in one pass. An emergent skill that scale handed us for free.',
  });
  tl.caption({
    at: 54.1,
    dur: 5.2,
    text: 'One thing is still missing though. A model trained only to predict text will happily predict unhelpful text. Aligning it with what people actually want is the last chapter.',
  });
  tl.hold(59.7, 1.2);

  return { tl, cam, planeU, kProg, lineU, queryU, truthU, errU, promptU, texU, frozenU, dimU, endU };
}

export { STAGE_W, STAGE_H };
