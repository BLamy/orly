import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Rules vs Learned Preferences — two ways to say what you want.
 *
 * Real computation at module scope. Thirty candidate behaviors along one
 * axis have a smooth true quality curve. We generate 240 pairwise human
 * preferences with a realistic 12% label-flip rate, then ACTUALLY fit a
 * Bradley-Terry reward model by gradient descent (3000 steps, L2-regularized).
 * Measured on this fit: 9.4% of all pairs come out in the wrong order, and
 * individual items land far from their true rank (one is overrated by more
 * than two standard deviations of the score scale). Against that: a written
 * rule — never do behaviors past the red line — which is exact on its domain
 * and silent everywhere else. Constitutional approaches use written
 * principles to generate and filter the preference data itself: rules where
 * rules are crisp, learned preferences where taste lives.
 */

export const M = 30;
export const XS: number[] = Array.from({ length: M }, (_, i) => i / (M - 1));
export const TRUTH: number[] = XS.map((x) => 1.5 * Math.sin(2.4 * x) + 0.5 * x);

const rand = mulberry32(11);
export const FLIP_RATE = 0.12;
export const N_PAIRS = 240;
export interface Pair {
  i: number;
  j: number;
  pref: number;
  flipped: boolean;
}
export const PAIRS: Pair[] = Array.from({ length: N_PAIRS }, () => {
  const i = Math.floor(rand() * M);
  let j = Math.floor(rand() * M);
  if (j === i) j = (j + 1) % M;
  let pref = TRUTH[i] > TRUTH[j] ? 1 : 0;
  const flipped = rand() < FLIP_RATE;
  if (flipped) pref = 1 - pref;
  return { i, j, pref, flipped };
});

/** The real Bradley-Terry fit. */
export const LEARNED: number[] = (() => {
  const s = new Array<number>(M).fill(0);
  for (let step = 0; step < 3000; step++) {
    const grad = new Array<number>(M).fill(0);
    for (const { i, j, pref } of PAIRS) {
      const p = 1 / (1 + Math.exp(-(s[i] - s[j])));
      grad[i] += pref - p;
      grad[j] -= pref - p;
    }
    for (let m = 0; m < M; m++) s[m] += 0.02 * grad[m] - 0.002 * s[m];
  }
  return s;
})();

export const INVERSION_RATE: number = (() => {
  let inv = 0;
  let tot = 0;
  for (let i = 0; i < M; i++) {
    for (let j = i + 1; j < M; j++) {
      tot++;
      if ((TRUTH[i] - TRUTH[j]) * (LEARNED[i] - LEARNED[j]) < 0) inv++;
    }
  }
  return inv / tot; // ≈ 0.094
})();

/** most over/under-rated items (by rank displacement) */
export const RANK_TRUE: number[] = XS.map((_, i) => TRUTH.filter((v) => v < TRUTH[i]).length);
export const RANK_LEARNED: number[] = XS.map(
  (_, i) => LEARNED.filter((v) => v < LEARNED[i]).length,
);
export const WORST_ITEM: number = XS.reduce(
  (b, _, i) =>
    Math.abs(RANK_LEARNED[i] - RANK_TRUE[i]) > Math.abs(RANK_LEARNED[b] - RANK_TRUE[b]) ? i : b,
  0,
);

/** normalize learned scores to the truth's range for plotting */
const lMin = Math.min(...LEARNED);
const lMax = Math.max(...LEARNED);
const tMin = Math.min(...TRUTH);
const tMax = Math.max(...TRUTH);
export const LEARNED_N: number[] = LEARNED.map(
  (v) => tMin + ((v - lMin) / (lMax - lMin)) * (tMax - tMin),
);

/** the written rule: forbid x > 0.85 (exact on its domain) */
export const RULE_X = 0.85;

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const PX0 = 130;
export const PX1 = 1150;
export const PY0 = 490;
export const P_AMP = 165;
export const px = (x: number): number => PX0 + x * (PX1 - PX0);
export const py = (v: number): number => PY0 - (v - tMin) * ((P_AMP * 2) / (tMax - tMin)) * 0.5 - 30;

export const CAM_PLOT: CameraState = { x: 640, y: 320, k: 1.12 };
export const CAM_WORST: CameraState = { x: px(XS[WORST_ITEM]), y: py(LEARNED_N[WORST_ITEM]), k: 1.6 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  truthU: ChannelRef<number>; // true quality curve
  pairU: ChannelRef<number>; // preference pair flashes 0..N_PAIRS
  fitU: ChannelRef<number>; // learned scores appear
  worstU: ChannelRef<number>; // spotlight the worst item
  ruleU: ChannelRef<number>; // the red-line rule
  statU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const truthU = tl.channel('truthU', 0);
  const pairU = tl.channel('pairU', 0);
  const fitU = tl.channel('fitU', 0);
  const worstU = tl.channel('worstU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const statU = tl.channel('statU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · what we want ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Two ways to tell a machine what you want: write rules, or show preferences and let it learn. This chapter runs both, for real, on the same little world.',
  });
  tl.tween(truthU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 4.6,
    text: 'The gray curve is the truth — how good each of thirty behaviors actually is. Neither method gets to see it. That is the whole problem.',
  });
  tl.hold(11.1, 0.6);

  // — Beat 2 · learn from preferences ——————————————————————————————————
  tl.caption({
    at: 11.7,
    dur: 5.8,
    text: 'The preference route: show people two hundred forty pairs of behaviors and ask which is better. People are mostly right — but twelve percent of the labels come back flipped, because humans are rushed, fooled, or just disagree.',
  });
  tl.tween(pairU, N_PAIRS, { at: 12.3, dur: 5.0, ease: ease.linear });
  tl.caption({
    at: 17.7,
    dur: 5.4,
    text: 'Fit a reward model to those noisy votes — a real Bradley Terry fit, three thousand gradient steps. Here is what it believes, dot by dot, against the truth it never saw.',
  });
  tl.tween(fitU, 1, { at: 18.5, dur: 2.2, ease: ease.draw });
  tl.hold(23.3, 0.6);

  // — Beat 3 · the wobble ——————————————————————————————————————————————
  tl.tween(cam, CAM_WORST, { at: 23.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.3,
    dur: 5.6,
    text: 'It captures the trend and garbles the details. Across all pairs, nine percent now rank in the wrong order — and this behavior here got lucky votes and floated far above its station. A judge with moods.',
  });
  tl.tween(worstU, 1, { at: 24.9, dur: 0.8, ease: ease.enter });
  tl.tween(statU, 1, { at: 26.5, dur: 0.7, ease: ease.enter });
  tl.hold(30.1, 0.6);

  // — Beat 4 · the rule ————————————————————————————————————————————————
  tl.tween(cam, CAM_PLOT, { at: 30.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 31.1,
    dur: 5.6,
    text: 'The rule route: write it down. Never do anything past the red line. On its domain a rule is everything the learned judge is not — exact, auditable, immune to lucky votes. And off its domain it says nothing at all.',
  });
  tl.tween(ruleU, 1, { at: 31.9, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 37.1,
    dur: 5.4,
    text: 'Which is the vase problem from chapter one wearing a suit: rules only cover the harms you thought to write, and taste — which of two good answers is better — cannot be written as a rule at all.',
  });
  tl.hold(42.7, 0.6);

  // — Beat 5 · constitutional synthesis ————————————————————————————————
  tl.caption({
    at: 43.3,
    dur: 5.8,
    text: 'So the constitutional approach layers them. A short list of written principles is used to critique and label the training pairs — the rules generate the preference data — and the learned model fills in the taste between the lines.',
  });
  tl.caption({
    at: 49.3,
    dur: 4.6,
    text: 'Rules where rules are crisp. Learned preferences where they are not. And written principles you can read, argue with, and fix — instead of moods buried in weights.',
  });
  tl.hold(54.1, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 54.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 55.3, dur: 1.1, ease: ease.move });
  tl.tween(statU, 0, { at: 55.3, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 56.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 56.5,
    dur: 5.2,
    text: 'Keep the comparison in mind for the next chapter, because the learned judge has one more failure mode — and it is the most human one of all.',
  });
  tl.hold(61.9, 1.2);

  return { tl, cam, truthU, pairU, fitU, worstU, ruleU, statU, dimU, endU };
}
