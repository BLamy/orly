import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Variance and Significance — when a one-point gain is noise.
 *
 * Real resampling at module scope. Model A has true skill 70%, model B 71% —
 * B genuinely IS better. We simulate 2000 runs of a 100-question benchmark
 * for each (seeded Bernoulli draws) and histogram the measured scores.
 * Measured: the two distributions sit almost on top of each other
 * (σ = √(p(1−p)/100) ≈ 4.6 points); in 46.8% of paired runs the better
 * model scores WORSE OR EQUAL. Then the same experiment at n = 10,000
 * questions: σ shrinks to 0.46 and the distributions separate. The sample
 * size, not the wish, decides what a one-point gap means.
 */

export const P_A = 0.7;
export const P_B = 0.71;
export const N_SMALL = 100;
export const N_BIG = 10000;
export const N_RUNS = 2000;

const rand = mulberry32(41);
function binom(n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (rand() < p) k++;
  return k;
}

export const RUNS_A: number[] = Array.from({ length: N_RUNS }, () => binom(N_SMALL, P_A));
export const RUNS_B: number[] = Array.from({ length: N_RUNS }, () => binom(N_SMALL, P_B));
export const P_B_WORSE: number = (() => {
  let worse = 0;
  for (let i = 0; i < N_RUNS; i++) if (RUNS_B[i] <= RUNS_A[i]) worse++;
  return worse / N_RUNS; // ≈ 0.468
})();

/** Big-benchmark runs (percent scores), fewer draws to stay cheap. */
const rand2 = mulberry32(43);
function binomApprox(n: number, p: number): number {
  // exact Bernoulli sum is fine even at n = 10,000 for 240 runs
  let k = 0;
  for (let i = 0; i < n; i++) if (rand2() < p) k++;
  return k;
}
export const N_RUNS_BIG = 240;
export const RUNS_A_BIG: number[] = Array.from({ length: N_RUNS_BIG }, () =>
  binomApprox(N_BIG, P_A),
);
export const RUNS_B_BIG: number[] = Array.from({ length: N_RUNS_BIG }, () =>
  binomApprox(N_BIG, P_B),
);
export const P_B_WORSE_BIG: number = (() => {
  let worse = 0;
  for (let i = 0; i < N_RUNS_BIG; i++) if (RUNS_B_BIG[i] <= RUNS_A_BIG[i]) worse++;
  return worse / N_RUNS_BIG; // small
})();

export const SIGMA_SMALL = Math.sqrt((P_A * (1 - P_A)) / N_SMALL) * 100; // 4.58 points
export const SIGMA_BIG = Math.sqrt((P_A * (1 - P_A)) / N_BIG) * 100; // 0.458

/** Histograms in percent-score space. */
export const HB_MIN = 55;
export const HB_MAX = 85;
export const HB_BINS = 60; // 0.5-point bins
export function hist(runs: number[], n: number): number[] {
  const h = new Array<number>(HB_BINS).fill(0);
  for (const k of runs) {
    const pct = (k / n) * 100;
    const b = Math.min(HB_BINS - 1, Math.max(0, Math.floor(((pct - HB_MIN) / (HB_MAX - HB_MIN)) * HB_BINS)));
    h[b]++;
  }
  return h;
}
export const HIST_A = hist(RUNS_A, N_SMALL);
export const HIST_B = hist(RUNS_B, N_SMALL);
export const HIST_A_BIG = hist(RUNS_A_BIG, N_BIG);
export const HIST_B_BIG = hist(RUNS_B_BIG, N_BIG);
export const HIST_MAX_SMALL = Math.max(...HIST_A, ...HIST_B);
export const HIST_MAX_BIG = Math.max(...HIST_A_BIG, ...HIST_B_BIG);

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const HX0 = 130;
export const HX1 = 1150;
export const HY0 = 480; // histogram baseline
export const HH = 280;
export const hx = (pct: number): number => HX0 + ((pct - HB_MIN) / (HB_MAX - HB_MIN)) * (HX1 - HX0);

export const CAM_HIST: CameraState = { x: 640, y: 330, k: 1.1 };
export const CAM_GAP: CameraState = { x: hx(70.5), y: 360, k: 1.6 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  markU: ChannelRef<number>; // the two "headline" score markers
  histAU: ChannelRef<number>; // histogram A accumulates 0..1
  histBU: ChannelRef<number>;
  bigW: ChannelRef<number>; // 0 = n=100 view · 1 = n=10,000 view
  statU: ChannelRef<number>;
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const markU = tl.channel('markU', 0);
  const histAU = tl.channel('histAU', 0);
  const histBU = tl.channel('histBU', 0);
  const bigW = tl.channel('bigW', 0);
  const statU = tl.channel('statU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the headline ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'A familiar headline: the new model scores seventy one on the benchmark, the old one scored seventy. One point better. The question this chapter asks: better, or lucky?',
  });
  tl.tween(markU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_HIST, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 5.0,
    text: 'The benchmark has one hundred questions. Each run of it is a coin-flip experiment: even a model with fixed true skill lands on a different score every time you sample new questions.',
  });
  tl.hold(11.5, 0.6);

  // — Beat 2 · resample ————————————————————————————————————————————————
  tl.caption({
    at: 12.1,
    dur: 5.8,
    text: 'So let us actually run it. Two thousand simulated evaluations of the old model — true skill exactly seventy percent — piling up into a distribution. This is what one hundred questions of luck looks like.',
  });
  tl.tween(histAU, 1, { at: 12.7, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 18.3,
    dur: 5.2,
    text: 'Now two thousand evaluations of the new model, truly one point better. Watch where its pile lands: almost exactly on top of the old one. The bell is nine points wide; the gap is one.',
  });
  tl.tween(histBU, 1, { at: 18.9, dur: 4.0, ease: ease.linear });
  tl.hold(23.9, 0.6);

  // — Beat 3 · the number that matters ————————————————————————————————
  tl.tween(cam, CAM_GAP, { at: 24.5, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'Here is the measured verdict: in forty seven percent of paired runs, the genuinely better model scores worse or equal. A one-point gain on a hundred questions is a coin flip wearing a lab coat.',
    tex: '\\sigma = \\sqrt{\\tfrac{p(1-p)}{n}} \\approx 4.6 \\text{ pts at } n{=}100',
  });
  tl.tween(statU, 1, { at: 25.5, dur: 0.7, ease: ease.enter });
  tl.tween(mathU, 1, { at: 25.9, dur: 0.7, ease: ease.enter });
  tl.hold(30.9, 0.6);

  // — Beat 4 · buy more questions ———————————————————————————————————————
  tl.tween(cam, CAM_HIST, { at: 31.5, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 31.9,
    dur: 5.8,
    text: 'The cure is not confidence, it is sample size. Same two models, but a benchmark of ten thousand questions. The noise shrinks with the square root of n — ten times less — and the piles finally separate.',
  });
  tl.tween(bigW, 1, { at: 32.7, dur: 2.4, ease: ease.move });
  tl.caption({
    at: 38.1,
    dur: 5.0,
    text: 'Now the better model wins essentially every paired run. Nothing about the models changed. The only thing that changed is how much evidence we bothered to collect.',
  });
  tl.hold(43.3, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 43.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 44.5, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 44.5, dur: 0.8, ease: ease.move });
  tl.tween(statU, 0, { at: 44.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 45.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.7,
    dur: 6.0,
    text: 'Before believing any small gain, ask two questions. How wide is the bell for this benchmark size? And would the gap survive a rerun on fresh questions? If nobody checked, the honest reading of plus one is: probably nothing.',
  });
  tl.hold(51.9, 1.2);

  return { tl, cam, markU, histAU, histBU, bigW, statU, mathU, dimU, endU };
}
