import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Verifier vs Preference — the same optimization pressure, two judges.
 *
 * A real simulation at module scope. 4000 candidate answers to a coding task:
 * each has a fluency score, a true correctness bit (the tests pass or they
 * don't), and — for 5% of the wrong ones — a "confident nonsense" flag that
 * fools a preference judge. The preference score weighs fluency heavily,
 * correctness weakly, and gives the loopholes a big spurious bonus. The
 * executable verifier just runs the tests.
 *
 * Best-of-n against each judge (2000 seeded runs per n): preference-picked
 * accuracy peaks at 0.62 around n=8 then collapses to 0.02 at n=256 (98% of
 * winners are loopholes); verifier-picked accuracy is 1 - (1-p)^n and hits
 * 1.00 by n=16. Base rate ≈ 0.38.
 */

export const N_CAND = 4000;
const rand = mulberry32(11);
const g = gaussian(rand);

export const FLU: number[] = [];
export const COR: number[] = [];
export const LOOP: boolean[] = [];
export const PREF: number[] = [];
for (let i = 0; i < N_CAND; i++) {
  const f = rand();
  const c = rand() < 0.22 + 0.3 * f ? 1 : 0;
  const loop = c === 0 && rand() < 0.08; // confident nonsense: wrong but persuasive
  FLU.push(f);
  COR.push(c);
  LOOP.push(loop);
  PREF.push(1.1 * f + 0.35 * c + 0.18 * g() + (loop ? 1.0 + 0.25 * g() : 0));
}
export const BASE_RATE = COR.reduce((a, b) => a + b, 0) / N_CAND; // ≈ 0.376

export const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;
export interface CurvePt {
  n: number;
  proxy: number; // accuracy when the preference judge picks
  verif: number; // accuracy when the executable check picks
  loopFrac: number;
}
export const CURVE: CurvePt[] = (() => {
  const r2 = mulberry32(77);
  return NS.map((n) => {
    const runs = 2000;
    let sp = 0;
    let sv = 0;
    let sl = 0;
    for (let k = 0; k < runs; k++) {
      let bi = 0;
      let bp = -Infinity;
      let anyC = 0;
      for (let j = 0; j < n; j++) {
        const i = Math.floor(r2() * N_CAND);
        if (PREF[i] > bp) {
          bp = PREF[i];
          bi = i;
        }
        if (COR[i]) anyC = 1;
      }
      sp += COR[bi];
      sv += anyC;
      sl += LOOP[bi] ? 1 : 0;
    }
    return { n, proxy: sp / runs, verif: sv / runs, loopFrac: sl / runs };
  });
})();
export const PEAK_IDX = CURVE.reduce((b, p, i) => (p.proxy > CURVE[b].proxy ? i : b), 0);
export const FINAL = CURVE[CURVE.length - 1];

// ---------------------------------------------------------------------------
// Stage layout — candidate cloud left, accuracy-vs-n curves right.
// ---------------------------------------------------------------------------

export const CLOUD_X0 = 120;
export const CLOUD_X1 = 570;
export const CLOUD_Y0 = 520;
export const CLOUD_Y1 = 110;
/** cloud: x = fluency, y = preference score */
export const cldX = (f: number): number => CLOUD_X0 + f * (CLOUD_X1 - CLOUD_X0);
export const cldY = (p: number): number =>
  CLOUD_Y0 - ((p + 0.6) / 3.4) * (CLOUD_Y0 - CLOUD_Y1);

/** deterministic render subset */
export const CLOUD_IDX: number[] = Array.from({ length: 500 }, (_, i) => i * 8);

export const CH_X0 = 690;
export const CH_X1 = 1185;
export const CH_Y0 = 505;
export const CH_H = 340;
export const chX = (i: number): number => CH_X0 + (i / (NS.length - 1)) * (CH_X1 - CH_X0);
export const chY = (acc: number): number => CH_Y0 - acc * CH_H;

export const CAM_CLOUD: CameraState = { x: 385, y: 320, k: 1.25 };
export const CAM_CURVES: CameraState = { x: 910, y: 330, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cloudU: ChannelRef<number>;
  corU: ChannelRef<number>; // color-in correctness
  loopU: ChannelRef<number>; // highlight the loopholes
  axU: ChannelRef<number>;
  sweepP: ChannelRef<number>; // preference curve sweep 0..NS.length-1
  sweepV: ChannelRef<number>; // verifier curve sweep
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cloudU = tl.channel('cloudU', 0);
  const corU = tl.channel('corU', 0);
  const loopU = tl.channel('loopU', 0);
  const axU = tl.channel('axU', 0);
  const sweepP = tl.channel('sweepP', 0);
  const sweepV = tl.channel('sweepV', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the setup ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Last time we watched a policy squeeze a learned reward model until it broke. That was the diagnosis. This series is about the treatment: what happens when the judge is not a model of approval, but an executable check.',
  });
  tl.tween(cloudU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_CLOUD, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'Four thousand candidate solutions to one coding task. Sideways: how fluent and confident each answer sounds. Upward: how much a preference judge likes it. About thirty eight percent of them actually pass the tests.',
  });
  tl.tween(corU, 1, { at: 8.0, dur: 1.4, ease: ease.enter });
  tl.hold(12.5, 0.6);

  // — Beat 2 · the loopholes ————————————————————————————————————————————
  tl.caption({
    at: 13.1,
    dur: 5.4,
    text: 'And five percent of the wrong answers are confident nonsense: fluent, authoritative, and broken. The preference judge rates them near the top of the chart, because persuasiveness is exactly what it was trained to reward.',
  });
  tl.tween(loopU, 1, { at: 13.7, dur: 1.2, ease: ease.enter });
  tl.hold(18.5, 0.6);

  // — Beat 3 · optimize against preference ——————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 19.1, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 19.5,
    dur: 5.6,
    text: 'Now apply optimization pressure: best of n selection. Draw n candidates, keep the one your judge scores highest, and measure how often the kept answer truly passes the tests. First, let the preference judge pick.',
  });
  tl.tween(axU, 1, { at: 20.1, dur: 1.2, ease: ease.draw });
  tl.tween(sweepP, NS.length - 1, { at: 25.3, dur: 5.4, ease: ease.move });
  tl.caption({
    at: 25.3,
    dur: 5.6,
    text: 'The familiar hill of doom. Accuracy climbs to zero point six two around eight samples, then collapses to two percent, because at high pressure ninety eight percent of the winners are the confident nonsense.',
  });
  tl.hold(31.1, 0.6);

  // — Beat 4 · optimize against the verifier ————————————————————————————
  tl.caption({
    at: 31.7,
    dur: 5.6,
    text: 'Same candidates, same pressure, different judge: actually run the tests. Now an answer wins only by passing, and the curve is pure probability — the chance that at least one of n draws is correct.',
    tex: '1-(1-p)^n',
  });
  tl.tween(mathU, 1, { at: 32.5, dur: 0.7, ease: ease.enter });
  tl.tween(sweepV, NS.length - 1, { at: 33.0, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 37.5,
    dur: 5.2,
    text: 'By sixteen samples it is at one hundred percent, and more pressure only helps. The verifier has no fluency column to exploit. You cannot sweet talk a test suite.',
  });
  tl.hold(42.9, 0.6);

  // — Beat 5 · the asymmetry ————————————————————————————————————————————
  tl.caption({
    at: 43.5,
    dur: 5.8,
    text: 'That is the whole shift in one picture. A preference model is a snapshot of approval, and pressure finds its gaps. An executable check is the task itself, so pressure against it is pressure toward the goal.',
  });
  tl.hold(49.5, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 50.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 50.7, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 50.7, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 51.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.9,
    dur: 5.6,
    text: 'This is the idea behind reinforcement learning with verifiable rewards. The rest of this book builds that loop: a policy trained against checks that run, a group-relative update rule, and the new place the exploits move to.',
  });
  tl.hold(57.7, 1.2);

  return { tl, cam, cloudU, corU, loopU, axU, sweepP, sweepV, mathU, dimU, endU };
}
