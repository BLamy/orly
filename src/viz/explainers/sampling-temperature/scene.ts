import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Sampling — temperature, and choosing the next word.
 *
 * All math lives here: hand-chosen but plausible logits over a 12-word
 * candidate vocabulary for "The cat sat on the …", REAL softmax
 * distributions at several temperatures, a seeded stream of 10 actual
 * samples at T = 0.7, and a real top-k (k = 3) renormalization. Nothing is
 * eyeballed; every bar height is computed from the numbers below.
 */

// ---------------------------------------------------------------------------
// The vocabulary and its logits (the model's raw scores)
// ---------------------------------------------------------------------------

export const WORDS = [
  'mat',
  'floor',
  'chair',
  'sofa',
  'rug',
  'bed',
  'table',
  'grass',
  'roof',
  'fence',
  'moon',
  'keyboard',
] as const;

export const N_WORDS = WORDS.length;

/** Raw model scores — mat clearly wins, a plausible mid-tier, a silly tail. */
export const LOGITS: readonly number[] = [
  6.0, 4.4, 4.0, 3.8, 3.5, 3.1, 2.8, 2.4, 1.9, 1.4, 0.4, -0.5,
];

// ---------------------------------------------------------------------------
// Softmax with temperature — computed, never faked
// ---------------------------------------------------------------------------

export function softmaxT(logits: readonly number[], T: number): number[] {
  const m = Math.max(...logits);
  const exps = logits.map((l) => Math.exp((l - m) / T));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const TEMPS = [0.2, 0.7, 1.0, 1.5, 3] as const;

export const P_COLD = softmaxT(LOGITS, 0.2); // mat ≈ 0.9997
export const P_07 = softmaxT(LOGITS, 0.7); //  mat ≈ 0.789, floor ≈ 0.080
export const P_1 = softmaxT(LOGITS, 1.0); //   mat ≈ 0.593
export const P_15 = softmaxT(LOGITS, 1.5); //  mat ≈ 0.395
export const P_HOT = softmaxT(LOGITS, 3.0); // mat ≈ 0.209, moon ≈ 0.032

// ---------------------------------------------------------------------------
// Top-k (k = 3) at T = 1.0, renormalized — real values (0.748, 0.151, 0.101)
// ---------------------------------------------------------------------------

export const TOP_K = 3;
export const P_TOPK: number[] = (() => {
  const kept = P_1.slice(0, TOP_K);
  const sum = kept.reduce((a, b) => a + b, 0);
  return P_1.map((p, i) => (i < TOP_K ? p / sum : 0));
})();

/** Probability mass the tail loses to the cut (≈ 0.206). */
export const TAIL_MASS = 1 - P_1.slice(0, TOP_K).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Ten seeded samples at T = 0.7 (mulberry32, seed 42):
// mat, mat, floor, mat, mat, mat, mat, mat, floor, mat — mostly mat, not always.
// ---------------------------------------------------------------------------

export const N_SAMPLES = 10;

export const SAMPLES: number[] = (() => {
  const rand = mulberry32(42);
  const out: number[] = [];
  for (let n = 0; n < N_SAMPLES; n++) {
    const u = rand();
    let cum = 0;
    let k = N_WORDS - 1;
    for (let i = 0; i < N_WORDS; i++) {
      cum += P_07[i];
      if (u < cum) {
        k = i;
        break;
      }
    }
    out.push(k);
  }
  return out;
})();

/** Stack position of each draw above its word's bar (tally layout). */
export const SAMPLE_STACK: number[] = (() => {
  const counts = new Array(N_WORDS).fill(0);
  return SAMPLES.map((w) => counts[w]++);
})();

/** The first sampled word that differs from greedy — drives the branch beat. */
export const DIVERGE_AT: number = SAMPLES.findIndex((w) => w !== 0);
export const SAMPLED_WORD: number = DIVERGE_AT >= 0 ? SAMPLES[DIVERGE_AT] : SAMPLES[0];

// ---------------------------------------------------------------------------
// Bar-height keyframes — the ONE centerpiece morphs through these.
// Heights are in [0, 1]: probabilities directly; logits min-max scaled so the
// score chart reads on the same axes before probabilities exist.
// ---------------------------------------------------------------------------

const LOGIT_MIN = Math.min(...LOGITS);
const LOGIT_MAX = Math.max(...LOGITS);
export const LOGIT_BARS: number[] = LOGITS.map(
  (l) => 0.08 + (0.84 * (l - LOGIT_MIN)) / (LOGIT_MAX - LOGIT_MIN),
);

/**
 * distIdx sweeps through adjacent frames (fractional index = lerp):
 *   0 logits · 1 T=1 · 2 T=0.7 · 3 T=0.2 (cold) · 4 T=0.7 · 5 T=1 ·
 *   6 T=1.5 · 7 T=3 (hot) · 8 T=1.5 · 9 T=1 · 10 T=0.7 (settle)
 */
export const DISTS: readonly (readonly number[])[] = [
  LOGIT_BARS,
  P_1,
  P_07,
  P_COLD,
  P_07,
  P_1,
  P_15,
  P_HOT,
  P_15,
  P_1,
  P_07,
];

/** Temperature at each distIdx keyframe (NaN for the logits frame). */
export const DIST_T: readonly number[] = [NaN, 1, 0.7, 0.2, 0.7, 1, 1.5, 3, 1.5, 1, 0.7];

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Bar heights at a fractional distIdx — pure lerp between adjacent frames. */
export function distAt(idx: number): number[] {
  const f = clamp(idx, 0, DISTS.length - 1);
  const i = Math.floor(f);
  if (i >= DISTS.length - 1) return [...DISTS[DISTS.length - 1]];
  const t = f - i;
  const a = DISTS[i];
  const b = DISTS[i + 1];
  return a.map((v, k) => v + (b[k] - v) * t);
}

/** Temperature at a fractional distIdx (NaN while still in the logits frame). */
export function tempAt(idx: number): number {
  const f = clamp(idx, 0, DIST_T.length - 1);
  const i = Math.floor(f);
  if (i >= DIST_T.length - 1) return DIST_T[DIST_T.length - 1];
  const a = DIST_T[i];
  const b = DIST_T[i + 1];
  if (Number.isNaN(a)) return Number.NaN;
  return a + (b - a) * (f - i);
}

// ---------------------------------------------------------------------------
// Stage layout — the bar chart is the persistent centerpiece
// ---------------------------------------------------------------------------

export const BASE_Y = 545; // bar baseline
export const BAR_MAX_H = 330; // height of a probability-1 bar
export const CHART_L = 120;
export const CHART_R = 1165;

export const xBand: ScaleLinear<number, number> = scaleLinear()
  .domain([0, N_WORDS])
  .range([CHART_L, CHART_R]);

export const BAR_STEP = xBand(1) - xBand(0);
export const BAR_W = BAR_STEP * 0.62;
export const barX = (i: number): number => xBand(i) + (BAR_STEP - BAR_W) / 2;
export const barCX = (i: number): number => xBand(i) + BAR_STEP / 2;
export const barTopY = (h: number): number => BASE_Y - h * BAR_MAX_H;

// The branching-tree beat (drawn over the faded chart)
export const TREE = {
  rootX: 200,
  rootY: 300,
  splitX: 470,
  greedyY: 215,
  sampledY: 385,
  wordX: 640,
  contX: 855,
} as const;

/** Hand-picked continuations for the branch beat (visual labels only). */
export const GREEDY_CONT = 'and purred.';
export const SAMPLED_CONT = 'by the door.';

// Cameras
export const CAM_BARS: CameraState = { x: 640, y: 350, k: 1.12 };
export const CAM_TREE: CameraState = { x: 600, y: 320, k: 1.18 };
export const CAM_WIDE: CameraState = { ...CAMERA_HOME };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  barsU: ChannelRef<number>; // staggered bar entrance
  chartOp: ChannelRef<number>; // whole-chart opacity (fades for tree/recap)
  promptU: ChannelRef<number>;
  distIdx: ChannelRef<number>; // fractional index into DISTS
  axisProbU: ChannelRef<number>; // 0 = "score" label, 1 = "probability"
  softTexU: ChannelRef<number>;
  dialU: ChannelRef<number>; // the temperature dial appears
  pctU: ChannelRef<number>; // % annotation on the mat bar
  moonPctU: ChannelRef<number>; // % annotation on the moon bar (hot beat)
  sampleN: ChannelRef<number>; // 0..10 tally draws
  tallyOp: ChannelRef<number>;
  greedyU: ChannelRef<number>; // greedy marker on the mat bar
  treeU: ChannelRef<number>; // branch-beat container
  greedyPathU: ChannelRef<number>;
  sampledPathU: ChannelRef<number>;
  topkU: ChannelRef<number>; // lerp toward the top-k renormalized bars
  cutU: ChannelRef<number>; // the cut line + tail dimming
  topkPctU: ChannelRef<number>;
  recapU: ChannelRef<number>; // the book-recap chips
  closeU: ChannelRef<number>; // closing line
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const barsU = tl.channel('barsU', 0);
  const chartOp = tl.channel('chartOp', 1);
  const promptU = tl.channel('promptU', 0);
  const distIdx = tl.channel('distIdx', 0);
  const axisProbU = tl.channel('axisProbU', 0);
  const softTexU = tl.channel('softTexU', 0);
  const dialU = tl.channel('dialU', 0);
  const pctU = tl.channel('pctU', 0);
  const moonPctU = tl.channel('moonPctU', 0);
  const sampleN = tl.channel('sampleN', 0);
  const tallyOp = tl.channel('tallyOp', 1);
  const greedyU = tl.channel('greedyU', 0);
  const treeU = tl.channel('treeU', 0);
  const greedyPathU = tl.channel('greedyPathU', 0);
  const sampledPathU = tl.channel('sampledPathU', 0);
  const topkU = tl.channel('topkU', 0);
  const cutU = tl.channel('cutU', 0);
  const topkPctU = tl.channel('topkPctU', 0);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · logits: a score for every word ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: "A language model doesn't end with an answer. It ends with a score for every word it could say next.",
  });
  tl.tween(promptU, 1, { at: 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_BARS, { at: 0.8, dur: 4.6, ease: ease.move });
  tl.tween(barsU, 1, { at: 1.4, dur: 2.2, ease: ease.draw });
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'For the prompt, the cat sat on the, mat scores highest — but floor, chair, and even moon get scores too.',
  });
  tl.hold(13.0, 0.8);

  // — Beat 2 · softmax: scores become probabilities ———————————————————————
  tl.caption({
    at: 13.8,
    dur: 6.4,
    text: 'The softmax turns scores into probabilities: exponentiate each score, divide by the total. Every word now owns a slice of certainty.',
    tex: 'p_i = \\dfrac{e^{z_i/T}}{\\sum_j e^{z_j/T}}',
  });
  tl.tween(softTexU, 1, { at: 14.1, dur: 0.7, ease: ease.enter });
  tl.tween(distIdx, 1, { at: 14.6, dur: 1.5, ease: ease.move }); // logits → T=1
  tl.tween(axisProbU, 1, { at: 14.6, dur: 1.2, ease: ease.move });
  tl.tween(pctU, 1, { at: 16.4, dur: 0.6, ease: ease.enter });
  tl.hold(20.2, 0.8);

  // — Beat 3 · temperature: the dial sweeps the SAME bars —————————————————
  tl.caption({
    at: 21.0,
    dur: 6.0,
    text: 'Hiding in that formula is a dial: temperature. It divides every score before the exponential — and it changes everything.',
  });
  tl.tween(dialU, 1, { at: 21.4, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 27.2,
    dur: 6.2,
    text: 'Turn it cold and the tallest bar takes almost everything. At temperature zero point two, mat holds nearly all of the probability.',
  });
  tl.tween(distIdx, 3, { at: 27.4, dur: 2.6, ease: ease.move }); // → T=0.2
  tl.caption({
    at: 33.6,
    dur: 6.2,
    text: 'Turn it hot and the bars flatten toward uniform. At temperature three, even the moon gets a real chance.',
  });
  tl.tween(distIdx, 7, { at: 33.8, dur: 3.4, ease: ease.move }); // → T=3
  tl.tween(moonPctU, 1, { at: 37.6, dur: 0.6, ease: ease.enter });
  tl.hold(39.8, 0.6);

  // — Beat 4 · greedy vs sampled: ten real draws ———————————————————————————
  tl.caption({
    at: 40.4,
    dur: 5.6,
    text: 'Settle at a moderate temperature and you face a real choice: always take the best word, or roll the dice.',
  });
  tl.tween(distIdx, 10, { at: 40.6, dur: 2.4, ease: ease.move }); // settle at T=0.7
  tl.tween(moonPctU, 0, { at: 40.6, dur: 0.8, ease: ease.move });
  tl.tween(greedyU, 1, { at: 43.6, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 46.2,
    dur: 6.4,
    text: 'Greedy always picks mat. Sampling draws from the bars — watch ten real draws land: mostly mat, but not always.',
  });
  tl.tween(sampleN, N_SAMPLES, { at: 47.2, dur: 5.0, ease: ease.linear });
  tl.hold(52.6, 0.8);

  // — Beat 5 · paths diverge: the branching tree ———————————————————————————
  tl.caption({
    at: 53.4,
    dur: 5.4,
    text: 'That one difference compounds. The greedy path retells the exact same sentence, every single time.',
  });
  tl.tween(chartOp, 0.12, { at: 53.4, dur: 1.1, ease: ease.move });
  tl.tween(dialU, 0.12, { at: 53.4, dur: 1.1, ease: ease.move });
  tl.tween(softTexU, 0, { at: 53.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TREE, { at: 53.6, dur: 1.4, ease: ease.move });
  tl.tween(treeU, 1, { at: 54.4, dur: 0.7, ease: ease.enter });
  tl.tween(greedyPathU, 1, { at: 55.2, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 58.8,
    dur: 5.6,
    text: 'The sampled path takes one different turn — and the whole continuation changes into a sentence greedy would never say.',
  });
  tl.tween(sampledPathU, 1, { at: 59.2, dur: 1.4, ease: ease.draw });
  tl.hold(64.4, 0.8);

  // — Beat 6 · top-k: chop the tail, renormalize ———————————————————————————
  tl.caption({
    at: 65.2,
    dur: 6.4,
    text: 'Top k is the compromise: keep only the three best words, cut the tail off entirely, and renormalize what survives.',
  });
  tl.tween(treeU, 0, { at: 65.2, dur: 0.8, ease: ease.move });
  tl.tween(chartOp, 1, { at: 65.4, dur: 1.0, ease: ease.move });
  tl.tween(tallyOp, 0, { at: 65.2, dur: 0.6, ease: ease.move });
  tl.tween(greedyU, 0, { at: 65.2, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: 65.4, dur: 1.2, ease: ease.move });
  tl.tween(cutU, 1, { at: 66.6, dur: 0.9, ease: ease.enter });
  tl.tween(topkU, 1, { at: 68.0, dur: 1.4, ease: ease.move });
  tl.tween(topkPctU, 1, { at: 69.6, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 71.8,
    dur: 5.2,
    text: 'The three survivors absorb the tail: the best word rises to about three quarters, and the silly answers are simply gone.',
  });
  tl.hold(77.0, 0.8);

  // — Beat 7 · recap: one dial, and the whole book ———————————————————————
  tl.caption({
    at: 77.8,
    dur: 5.6,
    text: 'So one dial trades reliability for surprise. Cold for facts and code, warm for stories and brainstorms.',
  });
  tl.tween(chartOp, 0.1, { at: 78.6, dur: 1.2, ease: ease.move });
  tl.tween(dialU, 0, { at: 78.6, dur: 0.9, ease: ease.move });
  tl.tween(cutU, 0, { at: 78.6, dur: 0.9, ease: ease.move });
  tl.tween(topkPctU, 0, { at: 78.6, dur: 0.9, ease: ease.move });
  tl.tween(pctU, 0, { at: 78.6, dur: 0.9, ease: ease.move });
  tl.tween(promptU, 0, { at: 78.6, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 79.0, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 83.6,
    dur: 7.6,
    text: "And that's the whole machine: embeddings give words directions, positions give them order, many heads read the sentence at once, each layer edits one stream — and at the very end, a choice.",
  });
  tl.tween(recapU, 1, { at: 84.2, dur: 3.6, ease: ease.draw });
  tl.caption({
    at: 91.6,
    dur: 5.4,
    text: "The next word is never looked up. It's weighed, warmed, and finally — chosen.",
  });
  tl.tween(closeU, 1, { at: 92.0, dur: 0.9, ease: ease.enter });
  tl.hold(97.0, 1.4);

  return {
    tl,
    cam,
    barsU,
    chartOp,
    promptU,
    distIdx,
    axisProbU,
    softTexU,
    dialU,
    pctU,
    moonPctU,
    sampleN,
    tallyOp,
    greedyU,
    treeU,
    greedyPathU,
    sampledPathU,
    topkU,
    cutU,
    topkPctU,
    recapU,
    closeU,
  };
}
