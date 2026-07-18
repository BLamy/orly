import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The New Scaling Law — compute per answer.
 *
 * Two layers, kept honest:
 *  - REPORTED (replotted from published results, labeled as such on screen):
 *    self-consistency on grade-school math with a 540B model, 56.5% → 74.4%
 *    with 40 sampled paths (Wang et al.); repeated-sampling coverage on
 *    SWE-bench Lite, 15.9% → 56% at 250 samples (Brown et al., "Large
 *    Language Monkeys"). Both are roughly linear in log samples.
 *  - OUR TOY (computed here): the book's 300-problem suite. Small model:
 *    pass@1 49.7%, cost 1 per sample. Big model: three times the per-sample
 *    capability (p_big = 1-(1-p)^3), cost 10 per sample. With a verifier,
 *    accuracy-vs-total-compute curves cross decisively: at a budget of 10
 *    units the big model answers once at 74.6% while the small model buys 8
 *    samples and reaches 89.7%.
 */

export const M = 300;
const rand = mulberry32(5);
export const P: number[] = [];
for (let i = 0; i < M; i++) {
  const u = rand();
  const p = u < 0.25 ? 0.75 + 0.2 * rand() : u < 0.6 ? 0.3 + 0.4 * rand() : 0.05 + 0.25 * rand();
  P.push(p);
  rand(); // (trap-share draw, unused here — keeps the suite identical to ch. 1–2)
}
export const PB: number[] = P.map((p) => 1 - (1 - p) ** 3);
export const BIG_COST = 10;

const passN = (probs: number[], N: number): number =>
  probs.reduce((a, p) => a + (1 - (1 - p) ** N), 0) / M;

export const NS = [1, 2, 4, 8, 16, 32, 64, 128] as const;
export interface Pt {
  n: number;
  acc: number;
  cost: number;
}
export const SMALL: Pt[] = NS.map((n) => ({ n, acc: passN(P, n), cost: n }));
export const BIG: Pt[] = NS.map((n) => ({ n, acc: passN(PB, n), cost: n * BIG_COST }));
export const SMALL_AT_8 = SMALL[3]; // 0.897 @ cost 8
export const BIG_AT_1 = BIG[0]; // 0.746 @ cost 10

/** reported results, replotted (labeled on screen) */
export const REPORTED = [
  {
    name: 'self-consistency · grade-school math (540B)',
    src: 'reported — Wang et al. 2022',
    from: 0.565,
    to: 0.744,
    at: '40 paths',
  },
  {
    name: 'repeated sampling · software patches',
    src: 'reported — Brown et al. 2024',
    from: 0.159,
    to: 0.56,
    at: '250 samples',
  },
];

// ---------------------------------------------------------------------------
// Layout — reported panel left, toy compute chart right (log-x).
// ---------------------------------------------------------------------------

export const REP_X = 150;
export const REP_Y0 = 150;
export const REP_DY = 190;
export const REP_W = 330;

export const CH_X0 = 640;
export const CH_X1 = 1180;
export const CH_Y0 = 505;
export const CH_H = 340;
const LOG_MAX = Math.log10(1280);
export const chX = (cost: number): number => CH_X0 + (Math.log10(cost) / LOG_MAX) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - (v - 0.4) * (CH_H / 0.6);

export const CAM_REP: CameraState = { x: 330, y: 300, k: 1.25 };
export const CAM_CHART: CameraState = { x: 890, y: 330, k: 1.12 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  repU: ChannelRef<number>; // reported panels
  axU: ChannelRef<number>;
  sweepB: ChannelRef<number>; // big-model curve
  sweepS: ChannelRef<number>; // small-model curve
  crossU: ChannelRef<number>; // the budget-10 comparison
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const repU = tl.channel('repU', 0);
  const axU = tl.channel('axU', 0);
  const sweepB = tl.channel('sweepB', 0);
  const sweepS = tl.channel('sweepS', 0);
  const crossU = tl.channel('crossU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · it shows up in the real world ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Everything in this book so far ran on a toy we control. So before the final chart, two published results, replotted here and labeled as reported, to show the same shape in the wild.',
  });
  tl.tween(cam, CAM_REP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(repU, 1, { at: 1.6, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 5.6,
    text: 'Self-consistency lifted a five hundred forty billion parameter model from fifty six and a half to seventy four percent on grade school math, with forty sampled paths. And repeated sampling took software patch coverage from sixteen percent to fifty six with two hundred fifty tries.',
  });
  tl.caption({
    at: 12.3,
    dur: 4.8,
    text: 'Both climb roughly linearly in the logarithm of the sample count — the signature reported again and again for test-time compute, including for the reasoning models trained to think longer.',
  });
  tl.hold(17.3, 0.6);

  // — Beat 2 · the toy trade ————————————————————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 17.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 18.3,
    dur: 5.6,
    text: 'Now the economic question, on our toy where we can compute everything. Two models: a big one, three times the per-sample capability at ten times the price, and our small one at one unit per sample. Same axis: total compute per answer.',
  });
  tl.tween(axU, 1, { at: 18.9, dur: 1.2, ease: ease.draw });
  tl.tween(sweepB, NS.length - 1, { at: 23.5, dur: 4.5, ease: ease.move });
  tl.caption({
    at: 23.9,
    dur: 4.8,
    text: 'The big model starts strong: seventy five percent from its very first, expensive answer. Buying it more samples pushes it toward certainty, at hundreds of units.',
  });
  tl.tween(sweepS, NS.length - 1, { at: 29.1, dur: 4.5, ease: ease.move });
  tl.caption({
    at: 29.1,
    dur: 5.4,
    text: 'Now the small model with a verifier. At a budget of ten units the big model has answered once, at seventy five percent. The small model has bought eight lottery tickets and cashed the winner: ninety percent, for less money.',
  });
  tl.tween(crossU, 1, { at: 33.3, dur: 0.9, ease: ease.pop });
  tl.hold(34.9, 0.6);

  // — Beat 3 · the honest caveats ———————————————————————————————————————
  tl.caption({
    at: 35.5,
    dur: 5.6,
    text: 'Two honest caveats. This trade exists only when you can verify — remember the voting plateau. And training compute amortizes: you pay for a bigger model once, but you pay the per-answer bill on every single query, forever.',
  });
  tl.caption({
    at: 41.5,
    dur: 5.0,
    text: 'Which is why the frontier does both: pretrain as large as the budget allows, then spend inference compute selectively — on the queries hard enough to deserve it.',
  });
  tl.hold(46.7, 0.6);

  // — Beat 4 · recap + close ————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 47.9, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 49.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.1,
    dur: 6.0,
    text: 'The journey: one sample is a lottery ticket. A verifier turns tickets into pass at N; a vote plateaus without one. A process judge reads the steps, search keeps the right path alive, and compute per answer became a dial — the new axis of scaling.',
  });
  tl.hold(55.3, 1.2);

  return { tl, cam, repU, axU, sweepB, sweepS, crossU, dimU, endU };
}
