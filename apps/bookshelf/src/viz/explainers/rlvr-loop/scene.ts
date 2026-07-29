import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The RLVR Loop — a real policy trained against a programmatic verifier.
 *
 * A genuine REINFORCE run at module scope. The policy is a softmax over 12
 * solution strategies for a coding task; each strategy has a true probability
 * of passing the test suite (0.02 up to 0.85). Every training step samples a
 * batch of 16 attempts, runs the verifier (pass = 1, fail = 0), subtracts the
 * batch-mean baseline, and takes the exact softmax policy-gradient step.
 *
 * Measured: expected pass rate climbs from 0.315 (uniform policy) to 0.775
 * after 400 steps; the probability mass on the best strategy grows from 8%
 * to 83%. Every frame samples this precomputed trajectory.
 */

export const P_PASS = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85];
export const K = P_PASS.length;
export const T_STEPS = 400;
const B = 16;
const LR = 0.12;

export interface Snap {
  step: number;
  pi: number[];
  expPass: number;
}
export const HIST: Snap[] = (() => {
  const rand = mulberry32(21);
  const softmax = (th: number[]): number[] => {
    const m = Math.max(...th);
    const e = th.map((x) => Math.exp(x - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  };
  let theta = new Array(K).fill(0) as number[];
  const hist: Snap[] = [];
  for (let t = 0; t <= T_STEPS; t++) {
    const pi = softmax(theta);
    const expPass = pi.reduce((a, p, i) => a + p * P_PASS[i], 0);
    hist.push({ step: t, pi: [...pi], expPass });
    const acts: number[] = [];
    const rs: number[] = [];
    for (let b = 0; b < B; b++) {
      const u = rand();
      let a = K - 1;
      let c = 0;
      for (let i = 0; i < K; i++) {
        c += pi[i];
        if (u < c) {
          a = i;
          break;
        }
      }
      acts.push(a);
      rs.push(rand() < P_PASS[a] ? 1 : 0);
    }
    const baseline = rs.reduce((a, b) => a + b, 0) / B;
    const grad = new Array(K).fill(0) as number[];
    for (let b = 0; b < B; b++) {
      const adv = rs[b] - baseline;
      for (let j = 0; j < K; j++) grad[j] += adv * ((j === acts[b] ? 1 : 0) - pi[j]);
    }
    theta = theta.map((x, j) => x + (LR * grad[j]) / B);
  }
  return hist;
})();
export const START = HIST[0];
export const FINAL = HIST[HIST.length - 1];

/** sample the run at a fractional step (pure lerp between snapshots) */
export function snapAt(u: number): Snap {
  const s = Math.max(0, Math.min(T_STEPS, u));
  const i = Math.floor(s);
  const j = Math.min(T_STEPS, i + 1);
  const f = s - i;
  const a = HIST[i];
  const b = HIST[j];
  return {
    step: s,
    pi: a.pi.map((v, k) => v + f * (b.pi[k] - v)),
    expPass: a.expPass + f * (b.expPass - a.expPass),
  };
}

// ---------------------------------------------------------------------------
// Layout — the loop machine top-left, policy bars bottom-left, curve right.
// ---------------------------------------------------------------------------

export const LOOP_POLICY = { x: 175, y: 150 };
export const LOOP_VERIF = { x: 470, y: 150 };

export const BAR_X0 = 110;
export const BAR_X1 = 580;
export const BAR_Y0 = 540;
export const BAR_H = 190;
export const barX = (i: number): number => BAR_X0 + (i / K) * (BAR_X1 - BAR_X0);
export const BAR_W = ((BAR_X1 - BAR_X0) / K) * 0.72;

export const CH_X0 = 700;
export const CH_X1 = 1190;
export const CH_Y0 = 500;
export const CH_H = 330;
export const chX = (step: number): number => CH_X0 + (step / T_STEPS) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_LOOP: CameraState = { x: 350, y: 300, k: 1.3 };
export const CAM_CURVE: CameraState = { x: 920, y: 330, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  loopU: ChannelRef<number>; // loop machine reveal
  pktU: ChannelRef<number>; // sample packets cycling (0..3 = three round trips)
  barU: ChannelRef<number>; // bars reveal
  axU: ChannelRef<number>;
  train: ChannelRef<number>; // 0..T_STEPS
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const loopU = tl.channel('loopU', 0);
  const pktU = tl.channel('pktU', 0);
  const barU = tl.channel('barU', 0);
  const axU = tl.channel('axU', 0);
  const train = tl.channel('train', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the loop ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is the machine. A policy proposes a solution, a verifier runs the tests, and the result comes back as the reward: one if the suite passes, zero if it fails. No human, no learned judge — just execution.',
  });
  tl.tween(loopU, 1, { at: 0.9, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_LOOP, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(pktU, 3, { at: 2.6, dur: 7.0, ease: ease.linear });
  tl.caption({
    at: 6.1,
    dur: 5.2,
    text: 'Watch the attempts cycle. Most come back red. That is fine — a sparse, honest signal beats a dense, gameable one. The question is whether a gradient can climb on it.',
  });
  tl.hold(11.5, 0.6);

  // — Beat 2 · the policy, concretely ———————————————————————————————————
  tl.caption({
    at: 12.1,
    dur: 5.6,
    text: 'Make it concrete. Our toy policy is a distribution over twelve solution strategies, each with its own true chance of passing the tests — from two percent for the worst up to eighty five for the best. It starts uniform: it has no idea.',
  });
  tl.tween(barU, 1, { at: 12.7, dur: 1.4, ease: ease.enter });
  tl.hold(17.9, 0.6);

  // — Beat 3 · the update rule —————————————————————————————————————————
  tl.caption({
    at: 18.5,
    dur: 5.8,
    text: 'Each step, sample sixteen attempts, verify them, and nudge the policy: strategies that passed more often than the batch average gain probability, the rest lose it. That is the policy gradient with a batch-mean baseline.',
    tex: '\\nabla J = \\mathbb{E}\\big[(r-\\bar r)\\,\\nabla \\log \\pi(a)\\big]',
  });
  tl.tween(mathU, 1, { at: 19.5, dur: 0.7, ease: ease.enter });
  tl.hold(24.5, 0.6);

  // — Beat 4 · train ———————————————————————————————————————————————————
  tl.tween(cam, CAM_CURVE, { at: 25.1, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 25.5,
    dur: 5.4,
    text: 'Now run it for real: four hundred steps, every sample actually drawn, every test actually rolled. The green curve is the expected pass rate of the current policy. It starts at thirty one and a half percent.',
  });
  tl.tween(axU, 1, { at: 26.1, dur: 1.2, ease: ease.draw });
  tl.tween(train, T_STEPS, { at: 30.9, dur: 8.0, ease: ease.move });
  tl.caption({
    at: 30.9,
    dur: 5.4,
    text: 'The mass drains out of the losing strategies and pools on the winner. Slowly at first — with a uniform policy the good strategy is rarely even sampled — then faster as its own success feeds it more samples.',
  });
  tl.caption({
    at: 36.5,
    dur: 5.2,
    text: 'After four hundred steps the pass rate is seventy seven and a half percent, and eighty three percent of the probability sits on the best strategy. The verifier never explained anything. Pass or fail was enough.',
  });
  tl.hold(41.9, 0.6);

  // — Beat 5 · why this is safe(r) —————————————————————————————————————
  tl.caption({
    at: 42.5,
    dur: 5.6,
    text: 'Notice what was missing: no reward model to overrate confident nonsense. The only way to earn reward here is to pass the tests. As long as the tests mean what we think they mean, pressure points at the goal.',
  });
  tl.hold(48.3, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.5, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 49.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.7,
    dur: 5.2,
    text: 'That caveat — as long as the tests mean what we think — is where this book is headed. But first, the update rule the frontier actually uses: judging each attempt against its own group. That is next.',
  });
  tl.hold(56.1, 1.2);

  return { tl, cam, loopU, pktU, barU, axU, train, mathU, dimU, endU };
}
