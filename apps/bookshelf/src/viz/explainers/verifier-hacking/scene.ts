import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Hacking the Verifier — the new attack surface, actually exploited.
 *
 * Same GRPO trainer as the previous chapters, but the strategy space now
 * contains an exploit: "hardcode the three public test outputs". Under the
 * WEAK verifier (public tests only) the exploit always passes even though it
 * is truly correct only 3% of the time. Under the STRONG verifier (hidden
 * held-out tests added) the exploit passes just 5% of the time.
 *
 * Both runs genuinely simulated (300 GRPO steps, groups of 8, seed 41):
 * - weak:   verifier reward → 0.996 while TRUE correctness collapses
 *           0.293 → 0.033, with 99% of policy mass on the exploit.
 * - strong: verifier reward and true correctness are the same line → 0.846,
 *           exploit mass → 0.000.
 */

export const P_TRUE = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85, 0.03];
export const P_WEAK = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85, 1.0];
export const P_STRONG = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85, 0.05];
export const K = P_TRUE.length;
export const T_STEPS = 300;
const G = 8;
const LR = 0.35;
const EPS = 1e-4;

export interface Snap {
  step: number;
  verifPass: number;
  truePass: number;
  piCheat: number;
}
function runTraining(pVerif: number[], seed: number): Snap[] {
  const softmax = (th: number[]): number[] => {
    const m = Math.max(...th);
    const e = th.map((x) => Math.exp(x - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  };
  const rand = mulberry32(seed);
  let theta = new Array(K).fill(0) as number[];
  const hist: Snap[] = [];
  for (let t = 0; t <= T_STEPS; t++) {
    const pi = softmax(theta);
    hist.push({
      step: t,
      verifPass: pi.reduce((a, p, i) => a + p * pVerif[i], 0),
      truePass: pi.reduce((a, p, i) => a + p * P_TRUE[i], 0),
      piCheat: pi[K - 1],
    });
    const acts: number[] = [];
    const rs: number[] = [];
    for (let b = 0; b < G; b++) {
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
      rs.push(rand() < pVerif[a] ? 1 : 0);
    }
    const mean = rs.reduce((a, b) => a + b, 0) / G;
    const sd = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / G);
    const advs = rs.map((r) => (sd > 0 ? (r - mean) / (sd + EPS) : 0));
    const grad = new Array(K).fill(0) as number[];
    for (let b = 0; b < G; b++)
      for (let j = 0; j < K; j++) grad[j] += advs[b] * ((j === acts[b] ? 1 : 0) - pi[j]);
    theta = theta.map((x, j) => x + (LR * grad[j]) / G);
  }
  return hist;
}
export const WEAK_RUN: Snap[] = runTraining(P_WEAK, 41);
export const STRONG_RUN: Snap[] = runTraining(P_STRONG, 41);
export const WEAK_FINAL = WEAK_RUN[T_STEPS];
export const STRONG_FINAL = STRONG_RUN[T_STEPS];

export function snapAt(run: Snap[], u: number): Snap {
  const s = Math.max(0, Math.min(T_STEPS, u));
  const i = Math.floor(s);
  const j = Math.min(T_STEPS, i + 1);
  const f = s - i;
  const a = run[i];
  const b = run[j];
  return {
    step: s,
    verifPass: a.verifPass + f * (b.verifPass - a.verifPass),
    truePass: a.truePass + f * (b.truePass - a.truePass),
    piCheat: a.piCheat + f * (b.piCheat - a.piCheat),
  };
}

// ---------------------------------------------------------------------------
// Layout — verifier gate left, training chart right.
// ---------------------------------------------------------------------------

export const GATE_X = 290;
export const GATE_Y = 190;

export const CH_X0 = 640;
export const CH_X1 = 1185;
export const CH_Y0 = 505;
export const CH_H = 350;
export const chX = (step: number): number => CH_X0 + (step / T_STEPS) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_GATE: CameraState = { x: 330, y: 280, k: 1.3 };
export const CAM_CHART: CameraState = { x: 700, y: 340, k: 1.0 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gateU: ChannelRef<number>; // weak verifier card
  cheatU: ChannelRef<number>; // exploit card
  axU: ChannelRef<number>;
  sweepW: ChannelRef<number>; // weak-run sweep
  hiddenU: ChannelRef<number>; // hidden tests slide in
  sweepS: ChannelRef<number>; // strong-run sweep
  weakDim: ChannelRef<number>; // dim the weak run's curves
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gateU = tl.channel('gateU', 0);
  const cheatU = tl.channel('cheatU', 0);
  const axU = tl.channel('axU', 0);
  const sweepW = tl.channel('sweepW', 0);
  const hiddenU = tl.channel('hiddenU', 0);
  const sweepS = tl.channel('sweepS', 0);
  const weakDim = tl.channel('weakDim', 1);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the weak verifier ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'We said you cannot sweet talk a test suite. True — but you can memorize one. Our verifier checks three public test cases, and the moment rewards flow through it, those three cases become the attack surface.',
  });
  tl.tween(gateU, 1, { at: 0.9, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAM_GATE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.4);

  // — Beat 2 · the exploit —————————————————————————————————————————————
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'So we add one strategy to the policy space: read the input, and if it matches a public test, print the memorized answer. It solves the real task three percent of the time — but it passes this verifier always.',
  });
  tl.tween(cheatU, 1, { at: 7.1, dur: 1.2, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // — Beat 3 · train against it ————————————————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 12.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 5.2,
    text: 'Train the same group-relative optimizer against this weak verifier — three hundred real steps. Watch two curves: what the verifier reports, and the truth measured on held-out tests it never sees.',
  });
  tl.tween(axU, 1, { at: 13.7, dur: 1.2, ease: ease.draw });
  tl.tween(sweepW, T_STEPS, { at: 18.1, dur: 7.0, ease: ease.move });
  tl.caption({
    at: 18.5,
    dur: 5.6,
    text: 'The verifier is thrilled: its reward climbs to ninety nine point six percent. The truth collapses from twenty nine percent to three, because ninety nine percent of the policy is now the memorizing exploit. The gradient found the gap on its own.',
  });
  tl.caption({
    at: 24.5,
    dur: 5.0,
    text: 'Nobody wrote a cheat into the objective. Optimization simply discovered that fooling three tests is a much easier hill to climb than solving the problem.',
  });
  tl.hold(29.7, 0.6);

  // — Beat 4 · strengthen the verifier —————————————————————————————————
  tl.caption({
    at: 30.3,
    dur: 5.2,
    text: 'Now harden the judge: add hidden held-out tests the policy has never seen. The exploit still memorizes the public three, but hidden inputs catch it — its pass rate drops to five percent.',
  });
  tl.tween(hiddenU, 1, { at: 31.1, dur: 1.2, ease: ease.enter });
  tl.tween(weakDim, 0.22, { at: 34.3, dur: 1.0, ease: ease.move });
  tl.tween(sweepS, T_STEPS, { at: 35.9, dur: 6.5, ease: ease.move });
  tl.caption({
    at: 35.9,
    dur: 5.4,
    text: 'Retrain from the same seed. Now the two curves are one line: verifier reward and true correctness rise together to eighty four point six percent, and the exploit is optimized to zero.',
  });
  tl.hold(41.5, 0.6);

  // — Beat 5 · the doctrine ————————————————————————————————————————————
  tl.caption({
    at: 42.1,
    dur: 5.8,
    text: 'Here is the rule this leaves us with: verifiable rewards move the safety question from the policy to the verifier. The check must be harder to game than the task is to solve — otherwise you are training a lock pick.',
  });
  tl.hold(48.1, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 50.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.5,
    dur: 5.2,
    text: 'Same optimizer, same policy space, same seed — the only thing we changed was how hard the verifier is to fool. That one knob decided whether training produced a solver or a cheat.',
  });
  tl.hold(55.9, 1.2);

  return { tl, cam, gateU, cheatU, axU, sweepW, hiddenU, sweepS, weakDim, mathU, dimU, endU };
}
