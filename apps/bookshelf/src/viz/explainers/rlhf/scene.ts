import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * RLHF — aligning a model with a preference loop.
 *
 * All math at module scope: eight candidate responses with fixed hidden
 * "quality" scores, a REAL preference-learning run, and a policy that shifts
 * toward what the learned reward likes. Seeded human comparisons are drawn by
 * the Bradley-Terry rule on true quality; a scalar reward model is fit by
 * gradient ascent on the log-sigmoid preference likelihood; the policy is a
 * softmax over the learned reward. Every bar, curve, and probability replays
 * that recorded run — no weights, rewards, or preferences are invented.
 *
 * Empirics with SEED = 1 (verified by running this exact code): the reward
 * model's ranking accuracy climbs from chance to ~0.9-1.0; the policy's
 * average true quality rises from 0.22 to 0.95 and concentrates on the two
 * genuinely best responses (quality 0.96 and 0.94); the reward model never
 * saw those quality numbers, only who-beat-whom.
 */

export const N = 8;
export const SEED = 1;
export const N_PAIRS = 600;
export const TEMP = 0.35;
const LR = 0.3;
const PREF_TEMP = 0.4;

const rand = mulberry32(SEED);
const sigm = (x: number): number => 1 / (1 + Math.exp(-x));

/** Hidden true quality of each candidate response. */
export const QUALITY: number[] = Array.from({ length: N }, () => Number((rand() * 2 - 1).toFixed(2)));
export const BEST_I = QUALITY.indexOf(Math.max(...QUALITY));
export const BEST_Q = QUALITY[BEST_I];
export const UNIFORM_Q = QUALITY.reduce((a, b) => a + b, 0) / N;

function policy(r: number[]): number[] {
  const m = Math.max(...r);
  const e = r.map((v) => Math.exp((v - m) / TEMP));
  const Z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / Z);
}

export interface Comparison {
  i: number;
  j: number;
  win: number;
  lose: number;
}

export interface Frame {
  reward: number[];
  policy: number[];
  acc: number; // reward-model ranking accuracy vs true quality
  avgQ: number; // policy's expected true quality
  comp: Comparison;
}

/** The recorded preference-learning run — one frame per comparison. */
export const FRAMES: Frame[] = (() => {
  const r = new Array<number>(N).fill(0);
  const out: Frame[] = [];
  for (let t = 0; t < N_PAIRS; t++) {
    const i = Math.floor(rand() * N);
    let j = Math.floor(rand() * N);
    if (j === i) j = (j + 1) % N;
    const pI = sigm((QUALITY[i] - QUALITY[j]) / PREF_TEMP);
    const win = rand() < pI ? i : j;
    const lose = win === i ? j : i;
    const gg = 1 - sigm(r[win] - r[lose]);
    r[win] += LR * gg;
    r[lose] -= LR * gg;
    let c = 0;
    let tot = 0;
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        tot++;
        if ((r[a] - r[b]) * (QUALITY[a] - QUALITY[b]) > 0) c++;
      }
    }
    const pol = policy(r);
    out.push({
      reward: [...r],
      policy: pol,
      acc: c / tot,
      avgQ: pol.reduce((s, p, k) => s + p * QUALITY[k], 0),
      comp: { i, j, win, lose },
    });
  }
  return out;
})();

export const FINAL = FRAMES[N_PAIRS - 1];

/** Lerped frame at fractional comparison index f. */
export function frameAt(f: number): Frame {
  const g0 = Math.max(0, Math.min(N_PAIRS - 1, f));
  const i = Math.floor(g0);
  if (i >= N_PAIRS - 1) return FRAMES[N_PAIRS - 1];
  const A = FRAMES[i];
  const B = FRAMES[i + 1];
  const t = g0 - i;
  return {
    reward: A.reward.map((v, k) => v + (B.reward[k] - v) * t),
    policy: A.policy.map((v, k) => v + (B.policy[k] - v) * t),
    acc: A.acc + (B.acc - A.acc) * t,
    avgQ: A.avgQ + (B.avgQ - A.avgQ) * t,
    comp: A.comp,
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const barX = (i: number): number => 150 + i * 108;
export const BAR_BASE = 470;
export const rewardScale: ScaleLinear<number, number> = scaleLinear().domain([-3, 3]).range([0, 150]);
export const polScale: ScaleLinear<number, number> = scaleLinear().domain([0, 0.6]).range([0, 150]);

export const accX: ScaleLinear<number, number> = scaleLinear().domain([0, N_PAIRS]).range([760, 1210]);
export const accY: ScaleLinear<number, number> = scaleLinear().domain([0, 1]).range([600, 500]);
export const qY: ScaleLinear<number, number> = scaleLinear().domain([UNIFORM_Q - 0.1, BEST_Q + 0.1]).range([490, 300]);

export const CAM_BARS: CameraState = { x: 560, y: 340, k: 1.15 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  respU: ChannelRef<number>;
  compU: ChannelRef<number>; // a single comparison, spotlit
  rmU: ChannelRef<number>; // reward-model bars
  prog: ChannelRef<number>; // 0..N_PAIRS
  polU: ChannelRef<number>; // policy bars
  curvesU: ChannelRef<number>;
  truthU: ChannelRef<number>; // reveal true quality marks
  texU: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const respU = tl.channel('respU', 0);
  const compU = tl.channel('compU', 0);
  const rmU = tl.channel('rmU', 0);
  const prog = tl.channel('prog', 0);
  const polU = tl.channel('polU', 0);
  const curvesU = tl.channel('curvesU', 0);
  const truthU = tl.channel('truthU', 0);
  const texU = tl.channel('texU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the gap ————————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A model trained only to predict text will happily predict text that is rude, wrong, or useless. It learned what is likely, not what we want. Closing that gap is called alignment.',
  });
  tl.tween(respU, 1, { at: 0.4, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAM_BARS, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'The trouble is that good is hard to write down as a formula. So we do not write it down. For any prompt, ask the model for several answers, and simply ask a person which they prefer.',
  });
  tl.hold(12.1, 0.6);

  // — Beat 2 · preferences ————————————————————————————————————————————————
  tl.tween(compU, 1, { at: 12.7, dur: 0.8, ease: ease.enter });
  tl.tween(badgeU, 1, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'Comparisons are cheap and honest: this answer beats that one. We never ask for a score, just a winner. From thousands of these, we train a reward model to predict which answer a person would pick.',
    tex: 'P(a \\succ b) = \\sigma\\big(r(a) - r(b)\\big)',
  });
  tl.tween(texU, 1, { at: 13.8, dur: 0.8, ease: ease.enter });
  tl.tween(rmU, 1, { at: 14.6, dur: 1.0, ease: ease.enter });
  tl.hold(19.5, 0.6);

  // — Beat 3 · train the reward model ——————————————————————————————————————
  tl.tween(curvesU, 1, { at: 20.1, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 20.3,
    dur: 6.0,
    text: 'Watch the reward bars form. Each comparison nudges the winner up and the loser down. Slowly, from nothing but who-beat-whom, the model builds a score that ranks the answers the way people do.',
  });
  tl.tween(prog, 200, { at: 21.0, dur: 5.6, ease: ease.linear });
  tl.caption({
    at: 26.9,
    dur: 5.4,
    text: 'The accuracy curve tracks how often the learned reward agrees with true human ranking. It climbs from a coin flip toward near-perfect. The reward model has become a stand-in judge.',
  });
  tl.tween(prog, 420, { at: 27.4, dur: 4.4, ease: ease.linear });
  tl.hold(32.4, 0.5);

  // — Beat 4 · improve the policy ——————————————————————————————————————————
  tl.tween(polU, 1, { at: 32.9, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 33.1,
    dur: 6.0,
    text: 'Now the reinforcement step. Treat that reward as the signal, and shift the model’s own odds toward answers the judge scores highly, exactly the policy nudge from earlier chapters. The blue bars are the model learning to prefer good answers.',
  });
  tl.tween(prog, N_PAIRS, { at: 33.8, dur: 4.6, ease: ease.linear });
  tl.tween(truthU, 1, { at: 37.8, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 39.3,
    dur: 5.6,
    text: 'Reveal the hidden truth: the two answers the policy now favors are genuinely the two best. Average quality climbed from near zero to almost the maximum, and the reward model never saw a single quality number.',
  });
  tl.hold(45.1, 0.6);

  // — Beat 5 · the catch ——————————————————————————————————————————————————
  tl.caption({
    at: 45.7,
    dur: 6.4,
    text: 'But remember chapter five of the last book. The policy now optimizes the reward model, not real human preference, and the reward model is only a proxy. Push too hard and it games the proxy: fluent, confident answers that the judge loves and a person would not. Measures get gamed here too.',
  });
  tl.hold(52.7, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 53.3, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 53.9, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 53.9, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 53.9, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 55.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 55.1,
    dur: 5.8,
    text: 'That is learning from human feedback: turn comparisons into a reward, then reinforce toward it. It is how a raw text predictor becomes a helpful assistant, and it inherits every hazard of optimizing a proxy for what we truly want.',
  });
  tl.caption({
    at: 61.3,
    dur: 5.2,
    text: 'Tokenize, predict, scale, adapt from the prompt, and align with feedback. Five moves, one machine. That is the language model, explained.',
  });
  tl.hold(67.0, 1.2);

  return { tl, cam, respU, compU, rmU, prog, polU, curvesU, truthU, texU, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
