import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Interventions vs Observations — seeing is not doing.
 *
 * One real structural causal model, simulated at module scope:
 *   Z ~ Bernoulli(0.5) · X = 1.5 Z + U · Y = 0.8 X + 2 Z + V
 * OBS_CURVE is the binned conditional mean E[Y | X = x] over 8,000
 * observational samples (slope ≈ 1.63). DO_CURVE is E[Y | do(X = x)]:
 * for each grid value the same model is re-simulated with the X equation
 * severed (2,000 draws per point) — slope 0.8 by construction. Both
 * curves on stage are those computations.
 */

export const TRUE_EFFECT = 0.8;

const rand = mulberry32(13);
const g = gaussian(rand);

export interface Sample {
  z: number;
  x: number;
  y: number;
}
export const N_OBS = 8000;
export const OBS: Sample[] = Array.from({ length: N_OBS }, () => {
  const z = rand() < 0.5 ? 0 : 1;
  const x = 1.5 * z + 0.6 * g();
  const y = 0.8 * x + 2 * z + 0.5 * g();
  return { z, x, y };
});

/** observational slope of the least-squares line through (x, y) */
export const OBS_SLOPE: number = (() => {
  const mx = OBS.reduce((s, p) => s + p.x, 0) / N_OBS;
  const my = OBS.reduce((s, p) => s + p.y, 0) / N_OBS;
  let sxy = 0;
  let sxx = 0;
  for (const p of OBS) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  return sxy / sxx; // ≈ 1.63
})();

/** binned E[Y | X = x] over the observational data */
export const GRID_X: number[] = Array.from({ length: 9 }, (_, i) => -1 + (4 * i) / 8);
export const OBS_CURVE: number[] = GRID_X.map((x0) => {
  const near = OBS.filter((p) => Math.abs(p.x - x0) < 0.3);
  return near.length ? near.reduce((s, p) => s + p.y, 0) / near.length : NaN;
});

/** E[Y | do(X = x)] — re-simulate with the X equation severed */
const randDo = mulberry32(17);
const gDo = gaussian(randDo);
export const DO_CURVE: number[] = GRID_X.map((x0) => {
  let s = 0;
  const M = 2000;
  for (let i = 0; i < M; i++) {
    const z = randDo() < 0.5 ? 0 : 1;
    s += 0.8 * x0 + 2 * z + 0.5 * gDo();
  }
  return s / M;
});
export const DO_SLOPE: number =
  (DO_CURVE[8] - DO_CURVE[0]) / (GRID_X[8] - GRID_X[0]); // ≈ 0.8

/** a visible subsample of the observational cloud */
export const CLOUD: Sample[] = OBS.filter((_, i) => i % 40 === 0); // 200 points

const lerpArr = (vals: number[]) => (x: number) => {
  const f = Math.max(0, Math.min(8, ((x + 1) / 4) * 8));
  const i = Math.floor(f);
  if (i >= 8) return vals[8];
  return vals[i] + (vals[i + 1] - vals[i]) * (f - i);
};
export const obsF = lerpArr(OBS_CURVE);
export const doF = lerpArr(DO_CURVE);

// layout: DAG left, plot right
export const px: ScaleLinear<number, number> = scaleLinear().domain([-1.2, 3.4]).range([470, 1180]);
export const py: ScaleLinear<number, number> = scaleLinear().domain([-1.6, 4.6]).range([620, 100]);

export const DAG = {
  z: { x: 220, y: 160 },
  x: { x: 110, y: 360 },
  y: { x: 330, y: 360 },
} as const;

export const CAM_DAG: CameraState = { x: 260, y: 300, k: 1.4 };
export const CAM_PLOT: CameraState = { x: 780, y: 350, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dagU: ChannelRef<number>;
  cloudP: ChannelRef<number>;
  obsU: ChannelRef<number>;
  cutU: ChannelRef<number>; // severs Z→X
  doU: ChannelRef<number>;
  gapU: ChannelRef<number>;
  chipU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dagU = tl.channel('dagU', 0);
  const cloudP = tl.channel('cloudP', 0);
  const obsU = tl.channel('obsU', 0);
  const cutU = tl.channel('cutU', 0);
  const doU = tl.channel('doU', 0);
  const gapU = tl.channel('gapU', 0);
  const chipU = tl.channel('chipU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the machine behind the data ——————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Behind every dataset there is a machine. In this one, a hidden switch raises the dose and, separately, raises the outcome. The dose helps too — a little.',
  });
  tl.tween(cam, CAM_DAG, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.tween(dagU, 1, { at: 0.9, dur: 1.8, ease: ease.enter });

  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'We ran that machine eight thousand times and just watched. Here is the cloud it produced, and the conditional average running through it.',
  });
  tl.tween(cam, CAM_PLOT, { at: 7.1, dur: 1.8, ease: ease.move });
  tl.tween(cloudP, 1, { at: 7.5, dur: 2.6, ease: ease.linear });
  tl.tween(obsU, 1, { at: 9.7, dur: 1.6, ease: ease.draw });

  tl.caption({
    at: 12.5,
    dur: 5.8,
    text: 'Seeing a high dose predicts a high outcome with slope one point six. That is a true fact about observation — and a wrong answer about action.',
  });
  tl.hold(18.3, 0.5);

  // — Beat 2 · the intervention ————————————————————————————————————————
  tl.caption({
    at: 18.8,
    dur: 6.2,
    text: 'Now intervene. Reach into the machine and set the dose yourself — the do operator. Setting cuts the wire from the hidden switch into the dose.',
    tex: 'P(Y \\mid \\mathrm{do}(X{=}x)) \\neq P(Y \\mid X{=}x)',
  });
  tl.tween(cam, CAM_DAG, { at: 19.2, dur: 1.8, ease: ease.move });
  tl.tween(cutU, 1, { at: 21.4, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 25.4,
    dur: 5.8,
    text: 'We re-ran the severed machine two thousand times at each dose level. Same equations everywhere else — only the arrow into the dose is gone.',
  });
  tl.tween(cam, CAM_PLOT, { at: 25.8, dur: 1.8, ease: ease.move });
  tl.tween(doU, 1, { at: 26.6, dur: 2.2, ease: ease.draw });

  tl.caption({
    at: 31.6,
    dur: 6.0,
    text: 'The interventional line is shallower: slope zero point eight — the dose’s real muscle. The other zero point eight of the observed slope was the switch, hitching a ride.',
  });
  tl.tween(gapU, 1, { at: 32.4, dur: 0.9, ease: ease.enter });
  tl.tween(chipU, 1, { at: 33.6, dur: 0.9, ease: ease.enter });
  tl.hold(37.6, 0.6);

  // — Beat 3 · the moral ————————————————————————————————————————————————
  tl.caption({
    at: 38.2,
    dur: 5.8,
    text: 'Same machine, two different questions. Seeing asks: among the runs where the dose was high, what happened? Doing asks: if I force it high, what will happen?',
  });

  tl.caption({
    at: 44.4,
    dur: 5.6,
    text: 'Prediction only needs the first. Decisions — pricing, medicine, policy — cash out the second, and no amount of passive data alone settles it.',
  });

  tl.caption({
    at: 50.4,
    dur: 5.4,
    text: 'Unless, that is, you can measure the switch and subtract its influence. That adjustment is the next chapter.',
  });
  tl.tween(closeU, 1, { at: 50.8, dur: 0.9, ease: ease.enter });
  tl.hold(55.8, 1.4);

  return { tl, cam, dagU, cloudP, obsU, cutU, doU, gapU, chipU, closeU };
}
