import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * RLHF and Its Limits — overoptimizing a learned reward.
 *
 * A real simulation at module scope, in the spirit of the published
 * reward-model overoptimization results (our own toy numbers, honestly
 * labeled as such — the shape, not the data, is the claim). 4000 candidate
 * responses have bounded true quality in [0,1]. A learned reward model
 * scores them with small noise — except for a handful of loopholes:
 * answers that FOOL it (systematically overrated by ~1.3, all of genuinely
 * low quality, the way a confident fabrication fools a preference model).
 * Policy optimization is best-of-n selection against the learned reward,
 * with KL(n) = ln n − (n−1)/n. Measured over 1500 seeded runs per n:
 * proxy reward climbs monotonically forever; TRUE quality climbs from 0.59
 * to a peak ~0.75 around n = 8, then collapses to 0.34 at n = 1024 —
 * by which point 100% of selected answers are loopholes.
 */

export const N_CAND = 4000;
const rand = mulberry32(7);
const g = gaussian(rand);

export const TRUE_Q: number[] = Array.from({ length: N_CAND }, () => rand() ** 0.7);
/** learned reward: small noise + rare systematic loopholes on low-quality items */
export const IS_LOOP: boolean[] = [];
export const RM: number[] = TRUE_Q.map((t) => {
  const loop = rand() < 0.06 && t < 0.45;
  IS_LOOP.push(loop);
  return t + 0.25 * g() + (loop ? 1.3 + 0.3 * g() : 0);
});

export const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024] as const;
export const klOf = (n: number): number => Math.log(n) - (n - 1) / n;

export interface CurvePt {
  n: number;
  kl: number;
  proxy: number;
  truth: number;
  loopFrac: number;
}
export const CURVE: CurvePt[] = (() => {
  const r2 = mulberry32(99);
  return NS.map((n) => {
    const runs = 1500;
    let sT = 0;
    let sP = 0;
    let sL = 0;
    for (let k = 0; k < runs; k++) {
      let bi = 0;
      let bp = -Infinity;
      for (let j = 0; j < n; j++) {
        const i = Math.floor(r2() * N_CAND);
        if (RM[i] > bp) {
          bp = RM[i];
          bi = i;
        }
      }
      sT += TRUE_Q[bi];
      sP += bp;
      sL += IS_LOOP[bi] ? 1 : 0;
    }
    return { n, kl: klOf(n), proxy: sP / runs, truth: sT / runs, loopFrac: sL / runs };
  });
})();

export const PEAK_IDX = CURVE.reduce((b, p, i) => (p.truth > CURVE[b].truth ? i : b), 0);
export const FINAL = CURVE[CURVE.length - 1];

// ---------------------------------------------------------------------------
// Stage layout — candidate cloud left, the two curves right.
// ---------------------------------------------------------------------------

export const CLOUD_X0 = 110;
export const CLOUD_X1 = 560;
export const CLOUD_Y0 = 520;
export const CLOUD_Y1 = 110;
/** cloud: x = true quality, y = learned reward */
export const cldX = (t: number): number => CLOUD_X0 + t * (CLOUD_X1 - CLOUD_X0);
export const cldY = (rm: number): number =>
  CLOUD_Y0 - ((rm + 0.8) / 2.9) * (CLOUD_Y0 - CLOUD_Y1);

/** a render subset of candidates (deterministic stride) */
export const CLOUD_IDX: number[] = Array.from({ length: 500 }, (_, i) => i * 8);

export const CH_X0 = 680;
export const CH_X1 = 1180;
export const CH_Y0 = 500;
export const CH_H = 330;
export const KL_MAX = klOf(1024);
export const chX = (kl: number): number => CH_X0 + (kl / KL_MAX) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - (v / 3.6) * CH_H;

export const CAM_CLOUD: CameraState = { x: 380, y: 320, k: 1.25 };
export const CAM_CURVES: CameraState = { x: 900, y: 320, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cloudU: ChannelRef<number>;
  loopU: ChannelRef<number>; // highlight loopholes
  axU: ChannelRef<number>; // curve axes
  sweep: ChannelRef<number>; // optimization pressure sweep 0..NS.length-1
  peakU: ChannelRef<number>;
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cloudU = tl.channel('cloudU', 0);
  const loopU = tl.channel('loopU', 0);
  const axU = tl.channel('axU', 0);
  const sweep = tl.channel('sweep', 0);
  const peakU = tl.channel('peakU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the learned judge ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Since we cannot write the reward down, modern practice learns it: collect human preferences between answers, train a reward model to predict them, then optimize the policy against that model. Reinforcement learning from human feedback.',
  });
  tl.tween(cloudU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_CLOUD, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'Here are four thousand candidate answers. Sideways: how good each truly is. Upward: what the learned reward model thinks. The judge is decent — the cloud hugs the diagonal — but it is a model, trained on noisy preferences.',
  });
  tl.hold(12.5, 0.6);

  // — Beat 2 · the loopholes ————————————————————————————————————————————
  tl.caption({
    at: 13.1,
    dur: 5.6,
    text: 'And it has blind spots. These highlighted answers fool it: confident, fluent, wrong — rated more than a full point above their real quality. A few percent of the space, invisible from inside the model.',
  });
  tl.tween(loopU, 1, { at: 13.7, dur: 1.2, ease: ease.enter });
  tl.hold(18.9, 0.6);

  // — Beat 3 · turn up the pressure ————————————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 19.5, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 19.9,
    dur: 5.6,
    text: 'Now optimize. Best of n sampling: draw n candidates, keep the one the reward model likes most. Larger n means more optimization pressure — measured properly as divergence from the base policy. Sweep it.',
    tex: '\\mathrm{KL} = \\ln n - \\tfrac{n-1}{n}',
  });
  tl.tween(axU, 1, { at: 20.5, dur: 1.2, ease: ease.draw });
  tl.tween(mathU, 1, { at: 21.1, dur: 0.7, ease: ease.enter });
  tl.tween(sweep, 4, { at: 22.6, dur: 3.4, ease: ease.move });
  tl.caption({
    at: 25.9,
    dur: 5.2,
    text: 'At first, everything works. Proxy up, truth up. Around eight samples the true quality of the chosen answers peaks at zero point seven five — this is the regime where reinforcement learning from human feedback genuinely helps.',
  });
  tl.tween(peakU, 1, { at: 28.3, dur: 0.6, ease: ease.pop });
  tl.hold(31.3, 0.5);

  // — Beat 4 · the divergence ——————————————————————————————————————————
  tl.caption({
    at: 31.8,
    dur: 5.8,
    text: 'Keep pushing and the curves let go. The reward model keeps reporting progress — its score never stops climbing. True quality collapses to zero point three four, because at extreme pressure every single winner is a loophole.',
  });
  tl.tween(sweep, NS.length - 1, { at: 32.6, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 37.8,
    dur: 5.4,
    text: 'This is Goodhart with a learned measure — the shape seen in the published overoptimization studies, recreated here on a toy we can fully inspect. The judge was never the goal. It was a snapshot of the goal, and pressure found the gaps.',
  });
  tl.hold(43.4, 0.6);

  // — Beat 5 · the limits ——————————————————————————————————————————————
  tl.caption({
    at: 44.0,
    dur: 5.6,
    text: 'So the pipeline ships with a leash: a divergence penalty pinning the policy near where the reward model was trained, early stopping, fresh preference data as the policy drifts. Not because optimization is bad — because the map is only local.',
  });
  tl.hold(49.8, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 50.4, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 51.0, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 51.0, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 52.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 52.2,
    dur: 5.4,
    text: 'Remember the two curves. Any learned judge is accurate near its training data and exploitable far from it — so the honest question is never what score did we reach, but how hard did we squeeze the judge to get it.',
  });
  tl.hold(57.8, 1.2);

  return { tl, cam, cloudU, loopU, axU, sweep, peakU, mathU, dimU, endU };
}
