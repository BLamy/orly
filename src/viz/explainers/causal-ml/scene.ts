import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Causality and ML — why predictors break under distribution shift.
 *
 * A real logistic regression trained by gradient descent at module scope.
 * Two features: a causal one (signal 0.8 apart, noisy) and a spurious
 * "background" one that agrees with the label 90% of the time in training
 * but only 10% after deployment. Computed verdicts: the both-features
 * model scores 94% on training data and 53% — a coin flip — after the
 * shift; the causal-only model scores 86% and 84%. Every accuracy on
 * stage is counted, not asserted.
 */

export interface Ex {
  c: number; // causal feature
  sp: number; // spurious feature
  y: 0 | 1;
}

const rand = mulberry32(31);
const g = gaussian(rand);

function genWorld(n: number, agree: number): Ex[] {
  const out: Ex[] = [];
  for (let i = 0; i < n; i++) {
    const y = (rand() < 0.5 ? 0 : 1) as 0 | 1;
    const c = (y ? 0.8 : -0.8) + 0.8 * g();
    const sp = (rand() < agree ? (y ? 1 : -1) : y ? -1 : 1) * 1 + 0.3 * g();
    out.push({ c, sp, y });
  }
  return out;
}

export const TRAIN: Ex[] = genWorld(400, 0.9);
export const SHIFT: Ex[] = genWorld(400, 0.1);

export type W = [number, number, number]; // bias, causal, spurious

function fit(D: Ex[], useSp: boolean): W {
  let w: W = [0, 0, 0];
  for (let e = 0; e < 300; e++) {
    const gr: W = [0, 0, 0];
    for (const { c, sp, y } of D) {
      const z = w[0] + w[1] * c + (useSp ? w[2] * sp : 0);
      const p = 1 / (1 + Math.exp(-z));
      const d = p - y;
      gr[0] += d;
      gr[1] += d * c;
      if (useSp) gr[2] += d * sp;
    }
    w = w.map((v, i) => v - ((0.01 * gr[i]) / D.length) * 10) as W;
  }
  return w;
}

export const W_BOTH: W = fit(TRAIN, true); // ≈ [−0.07, 1.84, 1.61]
export const W_CAUSAL: W = fit(TRAIN, false);

const predict = (w: W, ex: Ex, useSp: boolean): number =>
  w[0] + w[1] * ex.c + (useSp ? w[2] * ex.sp : 0) > 0 ? 1 : 0;
const acc = (w: W, D: Ex[], useSp: boolean): number =>
  D.filter((ex) => predict(w, ex, useSp) === ex.y).length / D.length;

export const ACC_BOTH_TRAIN: number = acc(W_BOTH, TRAIN, true); // ≈ 0.94
export const ACC_BOTH_SHIFT: number = acc(W_BOTH, SHIFT, true); // ≈ 0.53
export const ACC_CAUSAL_TRAIN: number = acc(W_CAUSAL, TRAIN, false); // ≈ 0.86
export const ACC_CAUSAL_SHIFT: number = acc(W_CAUSAL, SHIFT, false); // ≈ 0.84

/** which shifted points the both-features model gets wrong */
export const SHIFT_WRONG: boolean[] = SHIFT.map((ex) => predict(W_BOTH, ex, true) !== ex.y);

/** visible subsamples */
export const TRAIN_VIS: Ex[] = TRAIN.slice(0, 150);
export const SHIFT_VIS: Ex[] = SHIFT.slice(0, 150);
export const SHIFT_WRONG_VIS: boolean[] = SHIFT_WRONG.slice(0, 150);

export const px: ScaleLinear<number, number> = scaleLinear().domain([-3.2, 3.2]).range([150, 950]);
export const py: ScaleLinear<number, number> = scaleLinear().domain([-2.4, 2.4]).range([620, 110]);

/** boundary of w in the (c, sp) plane: sp = −(w0 + w1 c)/w2 */
export const boundBoth = (c: number): number => -(W_BOTH[0] + W_BOTH[1] * c) / W_BOTH[2];
/** causal-only boundary: vertical line at c = −w0/w1 */
export const CAUSAL_CUT: number = -W_CAUSAL[0] / W_CAUSAL[1];

export const CAM_CLOUD: CameraState = { x: 550, y: 360, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  trainP: ChannelRef<number>;
  worldU: ChannelRef<number>; // 0 = train cloud, 1 = shifted cloud
  boundU: ChannelRef<number>;
  accTrainU: ChannelRef<number>;
  wrongU: ChannelRef<number>;
  accShiftU: ChannelRef<number>;
  causalU: ChannelRef<number>;
  accCausalU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const trainP = tl.channel('trainP', 0);
  const worldU = tl.channel('worldU', 0);
  const boundU = tl.channel('boundU', 0);
  const accTrainU = tl.channel('accTrainU', 0);
  const wrongU = tl.channel('wrongU', 0);
  const accShiftU = tl.channel('accShiftU', 0);
  const causalU = tl.channel('causalU', 0);
  const accCausalU = tl.channel('accCausalU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two features, one honest ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'A classifier gets two features. One is causal — the thing itself, noisy but real. The other is the background: merely correlated, and beautifully clean.',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_CLOUD, { at: 0.9, dur: 2.0, ease: ease.move });
  tl.tween(trainP, 1, { at: 1.4, dur: 3.0, ease: ease.linear });

  tl.caption({
    at: 6.9,
    dur: 5.4,
    text: 'In training, the background agrees with the label ninety percent of the time. Along that axis the classes barely overlap. What would you lean on?',
  });
  tl.hold(12.3, 0.5);

  // — Beat 2 · training —————————————————————————————————————————————————
  tl.caption({
    at: 12.8,
    dur: 6.0,
    text: 'Gradient descent has no scruples. Three hundred epochs later the boundary leans hard on the shortcut, and scores ninety four percent. Ship it?',
  });
  tl.tween(boundU, 1, { at: 13.6, dur: 1.6, ease: ease.draw });
  tl.tween(accTrainU, 1, { at: 15.6, dur: 0.9, ease: ease.pop });
  tl.hold(18.8, 0.6);

  // — Beat 3 · deployment ———————————————————————————————————————————————
  tl.caption({
    at: 19.4,
    dur: 6.2,
    text: 'Deployment is an intervention you did not run. Out in the world, the background flips: now it agrees with the label only ten percent of the time.',
  });
  tl.tween(worldU, 1, { at: 20.6, dur: 1.8, ease: ease.move });

  tl.caption({
    at: 25.8,
    dur: 5.8,
    text: 'Same model, same boundary, new world: fifty three percent. A coin flip. Every prediction that leaned on the background now points the wrong way.',
  });
  tl.tween(wrongU, 1, { at: 26.6, dur: 0.9, ease: ease.enter });
  tl.tween(accShiftU, 1, { at: 27.6, dur: 0.9, ease: ease.pop });
  tl.hold(31.6, 0.6);

  // — Beat 4 · the causal model —————————————————————————————————————————
  tl.caption({
    at: 32.2,
    dur: 6.0,
    text: 'The correlation was policy, not physics. The causal feature is physics. Retrain using it alone, and training accuracy drops to eighty six — honestly worse.',
  });
  tl.tween(wrongU, 0, { at: 32.4, dur: 0.7, ease: ease.move });
  tl.tween(causalU, 1, { at: 33.4, dur: 1.4, ease: ease.draw });
  tl.tween(accCausalU, 1, { at: 35.4, dur: 0.9, ease: ease.pop });

  tl.caption({
    at: 38.6,
    dur: 5.8,
    text: 'But run the flipped world through it: eighty four percent. Two points lost, not forty one. Causal features are the ones that survive interventions.',
  });

  // — Beat 5 · the theme, closed ————————————————————————————————————————
  tl.caption({
    at: 44.8,
    dur: 6.0,
    text: 'You have seen this move all book: break a wire, watch what changes. Interpretability researchers ablate a circuit; the world ablates your shortcut features.',
  });

  tl.caption({
    at: 51.2,
    dur: 6.2,
    text: 'So end where we started, with the sign that flipped. Correlation predicts the world you sampled. Causation predicts the world you will act in. Build for the second one.',
  });
  tl.tween(closeU, 1, { at: 51.6, dur: 0.9, ease: ease.enter });
  tl.hold(57.4, 1.4);

  return {
    tl,
    cam,
    axU,
    trainP,
    worldU,
    boundU,
    accTrainU,
    wrongU,
    accShiftU,
    causalU,
    accCausalU,
    closeU,
  };
}
