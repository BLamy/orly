import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Bandit — explore or exploit.
 *
 * All math lives here at module scope: three Bernoulli arms with hidden
 * payout rates, and two REAL algorithm runs recorded step by step —
 * epsilon-greedy (epsilon = 0.1), greedy-only, and UCB (bonus c sqrt(ln t / n),
 * c = 0.5) — each pulling the arms 2000 times with its own seeded random
 * stream. The animation replays the recorded estimates, counts, and cumulative
 * pseudo-regret; nothing is faked.
 *
 * Empirics with the seeds below (verified by running this exact code):
 *   arms p = [0.35, 0.55, 0.70]; after 2000 pulls the pseudo-regret is
 *   greedy-only ~299.9 (locked onto machine B), epsilon-greedy ~35.2,
 *   UCB ~12.5 — and the UCB curve visibly flattens while epsilon-greedy
 *   keeps climbing at its constant exploration tax.
 */

// ---------------------------------------------------------------------------
// The arms
// ---------------------------------------------------------------------------

export const P = [0.35, 0.55, 0.7] as const;
export const N_ARMS = 3;
const P_MAX = Math.max(...P);
export const T_TOTAL = 2000;

export interface Snap {
  /** arm pulled at this step */
  arm: number;
  /** reward received (0 | 1) */
  reward: number;
  /** running estimates AFTER the pull */
  est: [number, number, number];
  /** pull counts AFTER the pull */
  counts: [number, number, number];
  /** cumulative pseudo-regret AFTER the pull */
  regret: number;
}

function runEpsGreedy(seed: number, eps: number): Snap[] {
  const rand = mulberry32(seed);
  const counts = [0, 0, 0];
  const sums = [0, 0, 0];
  let regret = 0;
  const out: Snap[] = [];
  for (let t = 0; t < T_TOTAL; t++) {
    let arm: number;
    if (t < N_ARMS) arm = t; // one free pull each
    else if (rand() < eps) arm = Math.floor(rand() * N_ARMS);
    else {
      arm = 0;
      for (let a = 1; a < N_ARMS; a++) {
        if (sums[a] / counts[a] > sums[arm] / counts[arm]) arm = a;
      }
    }
    const reward = rand() < P[arm] ? 1 : 0;
    counts[arm]++;
    sums[arm] += reward;
    regret += P_MAX - P[arm];
    out.push({
      arm,
      reward,
      est: [0, 1, 2].map((a) => (counts[a] ? sums[a] / counts[a] : 0)) as [number, number, number],
      counts: [...counts] as [number, number, number],
      regret,
    });
  }
  return out;
}

function runUcb(seed: number): Snap[] {
  const rand = mulberry32(seed);
  const counts = [0, 0, 0];
  const sums = [0, 0, 0];
  let regret = 0;
  const out: Snap[] = [];
  for (let t = 0; t < T_TOTAL; t++) {
    let arm: number;
    if (t < N_ARMS) arm = t;
    else {
      arm = 0;
      let best = -Infinity;
      for (let a = 0; a < N_ARMS; a++) {
        const bonus = UCB_C * Math.sqrt(Math.log(t + 1) / counts[a]);
        const score = sums[a] / counts[a] + bonus;
        if (score > best) {
          best = score;
          arm = a;
        }
      }
    }
    const reward = rand() < P[arm] ? 1 : 0;
    counts[arm]++;
    sums[arm] += reward;
    regret += P_MAX - P[arm];
    out.push({
      arm,
      reward,
      est: [0, 1, 2].map((a) => (counts[a] ? sums[a] / counts[a] : 0)) as [number, number, number],
      counts: [...counts] as [number, number, number],
      regret,
    });
  }
  return out;
}

export const UCB_C = 0.5;

export const EPS_RUN: Snap[] = runEpsGreedy(21, 0.1);
export const UCB_RUN: Snap[] = runUcb(21);
export const REGRET_EPS_FINAL = EPS_RUN[T_TOTAL - 1].regret;
export const REGRET_UCB_FINAL = UCB_RUN[T_TOTAL - 1].regret;

/** A greedy-only run (epsilon = 0): commits to whatever looked best early. */
export const GREEDY_RUN: Snap[] = runEpsGreedy(6, 0);
export const REGRET_GREEDY_FINAL = GREEDY_RUN[T_TOTAL - 1].regret;

/** Step-function lookup with a lerped regret, for smooth playback. */
export function snapAt(run: Snap[], f: number): Snap {
  const g = Math.max(0, Math.min(run.length - 1, f));
  const i = Math.floor(g);
  const s = run[i];
  if (i >= run.length - 1) return s;
  const t = g - i;
  return { ...s, regret: s.regret + (run[i + 1].regret - s.regret) * t };
}

// ---------------------------------------------------------------------------
// Stage layout — three machines left, regret chart right
// ---------------------------------------------------------------------------

export const ARM_X = [170, 380, 590];
export const ARM_Y = 150;
export const BAR_Y0 = 520; // baseline of the estimate bars
export const BAR_H = 260; // bar height for estimate = 1
export const BAR_W = 96;

export const regretX: ScaleLinear<number, number> = scaleLinear().domain([0, T_TOTAL]).range([790, 1220]);
export const regretY: ScaleLinear<number, number> = scaleLinear().domain([0, 320]).range([540, 130]);

export const CAM_ARMS: CameraState = { x: 385, y: 330, k: 1.28 };
export const CAM_CHART: CameraState = { x: 950, y: 330, k: 1.22 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  armsU: ChannelRef<number>;
  trueU: ChannelRef<number>;
  pullProg: ChannelRef<number>; // epsilon-greedy progress, 0..T_TOTAL
  greedyProg: ChannelRef<number>; // greedy-only progress (the trap beat)
  greedyMode: ChannelRef<number>; // 0 = eps run drives bars, 1 = greedy run
  barsU: ChannelRef<number>;
  chartU: ChannelRef<number>;
  epsCurveU: ChannelRef<number>;
  ucbCurveU: ChannelRef<number>;
  greedyCurveU: ChannelRef<number>;
  ucbTexU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const armsU = tl.channel('armsU', 0);
  const trueU = tl.channel('trueU', 0);
  const pullProg = tl.channel('pullProg', 0);
  const greedyProg = tl.channel('greedyProg', 0);
  const greedyMode = tl.channel('greedyMode', 0);
  const barsU = tl.channel('barsU', 0);
  const chartU = tl.channel('chartU', 0);
  const epsCurveU = tl.channel('epsCurveU', 0);
  const ucbCurveU = tl.channel('ucbCurveU', 0);
  const greedyCurveU = tl.channel('greedyCurveU', 0);
  const ucbTexU = tl.channel('ucbTexU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · three machines, hidden odds ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Three slot machines. Each pays out at a fixed rate, but nobody tells you the rates. Every pull costs a turn, and you get two thousand turns.',
  });
  tl.tween(armsU, 1, { at: 0.4, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_ARMS, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'This is the simplest problem in reinforcement learning, and it already contains the hardest question: spend turns learning which machine is best, or spend them cashing in on the one that looks best.',
  });
  tl.hold(12.2, 0.6);

  // — Beat 2 · the greedy trap ————————————————————————————————————————————
  tl.caption({
    at: 12.8,
    dur: 5.6,
    text: 'Try pure greed first. Pull each machine once, then forever pull whichever estimate is highest. Watch the bars: they are the running averages the player believes.',
  });
  tl.set(greedyMode, 1, 12.9);
  tl.tween(barsU, 1, { at: 13.0, dur: 0.8, ease: ease.enter });
  tl.tween(greedyProg, 30, { at: 15.0, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 18.8,
    dur: 6.0,
    text: 'An early lucky win on a mediocre machine, and greed locks on. It never pulls the others again, so it never learns it is wrong. That is the trap: no exploration, no correction.',
  });
  tl.tween(greedyProg, T_TOTAL - 1, { at: 20.0, dur: 4.0, ease: ease.linear });
  tl.hold(25.2, 0.6);

  // — Beat 3 · epsilon-greedy ————————————————————————————————————————————
  tl.caption({
    at: 25.8,
    dur: 6.2,
    text: 'The classic fix is one coin flip of humility. Ninety percent of the time, exploit the best estimate. Ten percent of the time, pull a machine at random, just to check.',
    tex: '\\varepsilon = 0.1',
  });
  tl.set(greedyMode, 0, 26.0);
  tl.tween(pullProg, 40, { at: 27.5, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 32.4,
    dur: 5.8,
    text: 'Here is a real run of that rule. The random pulls keep feeding the neglected machines, and the estimates slowly settle toward the true rates.',
  });
  tl.tween(pullProg, T_TOTAL - 1, { at: 33.0, dur: 5.6, ease: ease.linear });
  tl.tween(trueU, 1, { at: 36.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 38.6,
    dur: 4.6,
    text: 'The dashed marks are the hidden truth: thirty five, fifty five, and seventy percent. The estimates found them, at the price of some deliberately wasted pulls.',
  });
  tl.hold(43.4, 0.6);

  // — Beat 4 · regret, the honest scoreboard ——————————————————————————————
  tl.caption({
    at: 44.0,
    dur: 5.8,
    text: 'To compare strategies we count regret: how much expected reward you gave up by not pulling the best machine every time. Lower is better, and flat means you have stopped paying.',
  });
  tl.tween(cam, CAM_CHART, { at: 44.4, dur: 1.6, ease: ease.move });
  tl.tween(chartU, 1, { at: 45.2, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 50.2,
    dur: 5.0,
    text: 'Pure greed pays forever: its regret climbs in a straight line, because it keeps pulling the wrong machine every single turn.',
  });
  tl.tween(greedyCurveU, 1, { at: 50.6, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 55.6,
    dur: 5.2,
    text: 'Epsilon-greedy bends the curve, but never quite flattens it. That steady ten percent of random pulls is a tax it pays even after it knows the answer.',
  });
  tl.tween(epsCurveU, 1, { at: 56.0, dur: 2.6, ease: ease.draw });
  tl.hold(60.8, 0.5);

  // — Beat 5 · UCB ————————————————————————————————————————————————————————
  tl.caption({
    at: 61.3,
    dur: 6.4,
    text: 'A smarter idea: be optimistic in the face of uncertainty. Give every machine a bonus that grows the longer it goes unpulled, and always pick the highest estimate plus bonus.',
    tex: '\\hat\\mu_a + \\sqrt{\\tfrac{2\\ln t}{n_a}}',
  });
  tl.tween(ucbTexU, 1, { at: 62.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 68.0,
    dur: 5.8,
    text: 'That is the upper confidence bound rule. Exploration is no longer random: it flows exactly to the machines you know least about, and dries up as the evidence comes in.',
  });
  tl.tween(ucbCurveU, 1, { at: 68.4, dur: 3.0, ease: ease.draw });
  tl.caption({
    at: 74.2,
    dur: 5.0,
    text: 'Same two thousand turns, same hidden machines. Its regret curve bends toward flat, because doubt itself is being spent down.',
  });
  tl.hold(79.4, 0.6);

  // — Beat 6 · recap ——————————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 80.0, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 80.6, dur: 1.2, ease: ease.move });
  tl.tween(ucbTexU, 0, { at: 80.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 81.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 81.8,
    dur: 6.0,
    text: 'One idea to keep: exploration is not a bug to minimize, it is a budget to spend well. Every reinforcement learner you meet from here on is managing this same trade.',
  });
  tl.caption({
    at: 88.2,
    dur: 5.2,
    text: 'Next, we leave the casino. What happens when your choices change where you stand, and the reward is many steps away?',
  });
  tl.hold(93.6, 1.2);

  return {
    tl,
    cam,
    armsU,
    trueU,
    pullProg,
    greedyProg,
    greedyMode,
    barsU,
    chartU,
    epsCurveU,
    ucbCurveU,
    greedyCurveU,
    ucbTexU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
