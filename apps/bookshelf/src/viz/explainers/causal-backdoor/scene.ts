import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Backdoor Adjustment — subtracting the confounder, with receipts.
 *
 * The same structural model as the do-operator chapter (Z ~ Bern(0.5),
 * X = 1.5 Z + U, Y = 0.8 X + 2 Z + V; seed 13, 8,000 samples). Computed
 * on stage: the naive pooled slope ≈ 1.63; the within-stratum slopes
 * SLOPE_Z0 ≈ 0.81 and SLOPE_Z1 ≈ 0.80; their P(z)-weighted average
 * ADJUSTED ≈ 0.81 against the true effect 0.8 — recovered from purely
 * observational data because the confounder was measured.
 */

export const TRUE_EFFECT = 0.8;

const rand = mulberry32(13);
const g = gaussian(rand);

export interface Sample {
  z: number;
  x: number;
  y: number;
}
export const N = 8000;
export const OBS: Sample[] = Array.from({ length: N }, () => {
  const z = rand() < 0.5 ? 0 : 1;
  const x = 1.5 * z + 0.6 * g();
  const y = 0.8 * x + 2 * z + 0.5 * g();
  return { z, x, y };
});

export interface Fit {
  slope: number;
  intercept: number;
}
function lsq(pts: Sample[]): Fit {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

export const FIT_ALL: Fit = lsq(OBS); // slope ≈ 1.63 — the naive answer
export const FIT_Z0: Fit = lsq(OBS.filter((p) => p.z === 0)); // ≈ 0.81
export const FIT_Z1: Fit = lsq(OBS.filter((p) => p.z === 1)); // ≈ 0.80
export const P_Z1: number = OBS.filter((p) => p.z === 1).length / N;
export const ADJUSTED: number = FIT_Z0.slope * (1 - P_Z1) + FIT_Z1.slope * P_Z1; // ≈ 0.81

/** visible subsample */
export const CLOUD: Sample[] = OBS.filter((_, i) => i % 32 === 0); // 250 points

export const px: ScaleLinear<number, number> = scaleLinear().domain([-1.6, 3.6]).range([120, 1160]);
export const py: ScaleLinear<number, number> = scaleLinear().domain([-1.8, 4.8]).range([620, 100]);

export const CAM_MID: CameraState = { x: 640, y: 350, k: 1.12 };
export const CAM_Z0: CameraState = { x: px(0), y: py(0.2), k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  cloudP: ChannelRef<number>;
  naiveU: ChannelRef<number>;
  colorU: ChannelRef<number>;
  fit0U: ChannelRef<number>;
  fit1U: ChannelRef<number>;
  mathU: ChannelRef<number>;
  scaleU: ChannelRef<number>;
  cautionU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const cloudP = tl.channel('cloudP', 0);
  const naiveU = tl.channel('naiveU', 0);
  const colorU = tl.channel('colorU', 0);
  const fit0U = tl.channel('fit0U', 0);
  const fit1U = tl.channel('fit1U', 0);
  const mathU = tl.channel('mathU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const cautionU = tl.channel('cautionU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · no experiment allowed ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Suppose you cannot intervene — no severed wires, no experiments. Just the eight thousand observations, confounding and all. Are decisions hopeless?',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_MID, { at: 0.9, dur: 2.0, ease: ease.move });
  tl.tween(cloudP, 1, { at: 1.2, dur: 2.8, ease: ease.linear });
  tl.tween(naiveU, 1, { at: 3.4, dur: 1.4, ease: ease.draw });

  tl.caption({
    at: 6.9,
    dur: 5.2,
    text: 'Not if you measured the confounder. The recipe is called backdoor adjustment, and you can watch it work on this very cloud.',
  });
  tl.hold(12.1, 0.5);

  // — Beat 2 · stratify ————————————————————————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 6.0,
    text: 'Step one: split the data by the confounder. Within one slice the hidden switch is frozen — it cannot push on anything, because it does not vary.',
  });
  tl.tween(colorU, 1, { at: 13.6, dur: 1.6, ease: ease.move });
  tl.tween(naiveU, 0.25, { at: 13.6, dur: 1.0, ease: ease.move });

  tl.caption({
    at: 19.0,
    dur: 6.0,
    text: 'Step two: fit each slice on its own. Switch off: slope zero point eight one. Switch on: slope zero point eight zero. The confounding is simply gone.',
  });
  tl.tween(fit0U, 1, { at: 19.4, dur: 1.4, ease: ease.draw });
  tl.tween(fit1U, 1, { at: 21.0, dur: 1.4, ease: ease.draw });

  tl.caption({
    at: 25.4,
    dur: 6.2,
    text: 'Step three: average the slices, weighted by how common each one is. The result is zero point eight one — the true effect, recovered without a single intervention.',
    tex: 'P(y \\mid \\mathrm{do}(x)) = \\textstyle\\sum_z P(y \\mid x, z)\\, P(z)',
  });
  tl.tween(mathU, 1, { at: 26.2, dur: 0.9, ease: ease.enter });
  tl.tween(scaleU, 1, { at: 27.8, dur: 1.2, ease: ease.pop });
  tl.hold(32.2, 0.6);

  // — Beat 3 · why it works, and when it doesn't ————————————————————————
  tl.caption({
    at: 32.8,
    dur: 5.8,
    text: 'That formula is the do operator rebuilt from observational parts: condition on the confounder, then integrate it back out at its natural rate.',
  });

  tl.caption({
    at: 38.8,
    dur: 6.0,
    text: 'Now the fine print, and it is load-bearing: the recipe needs every backdoor path blocked. Adjust for too little and bias remains.',
  });
  tl.tween(cautionU, 1, { at: 40.2, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 45.2,
    dur: 5.8,
    text: 'And no test inside this dataset can prove you measured all the confounders. That assumption lives outside the data — in what you know about the machine.',
  });

  tl.caption({
    at: 51.4,
    dur: 5.4,
    text: 'When you cannot defend it, you escalate: randomize, and let a coin cut the wires for you. That is next.',
  });
  tl.tween(cautionU, 0, { at: 55.4, dur: 0.7, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.8, dur: 0.9, ease: ease.enter });
  tl.hold(56.8, 1.4);

  return { tl, cam, axU, cloudP, naiveU, colorU, fit0U, fit1U, mathU, scaleU, cautionU, closeU };
}
