import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Training on Yourself — the self-improvement loop, with a real toy model.
 *
 * The model is the simplest one that can "generate": a Gaussian fitted to
 * data. Real pipeline at module scope (seed 25, matching the collapse
 * chapter): start from the true distribution N(0,1), draw 50 samples from
 * the CURRENT model, refit mean and variance, repeat. This chapter shows one
 * single turn of the crank: the 50 real samples, the refit curve — already
 * a hair narrower (sd 0.890) and off-center (mean 0.176), through no bug at
 * all. Finite samples under-represent their own tails; the refit believes
 * the samples. Later chapters iterate this loop and watch it run away.
 */

export const M_SAMPLES = 50;
export const SAMPLES: number[] = (() => {
  const rand = mulberry32(25);
  const g = gaussian(rand);
  return Array.from({ length: M_SAMPLES }, () => g());
})();
export const FIT_MU = SAMPLES.reduce((a, b) => a + b, 0) / M_SAMPLES;
export const FIT_SD = Math.sqrt(
  SAMPLES.reduce((a, x) => a + (x - FIT_MU) ** 2, 0) / M_SAMPLES,
);
export const MAX_ABS = Math.max(...SAMPLES.map((x) => Math.abs(x)));
export const N_BEYOND_2 = SAMPLES.filter((x) => Math.abs(x) > 2).length;

export const gauss = (x: number, mu: number, sd: number): number =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

// ---------------------------------------------------------------------------
// Layout — loop ring left, distribution stage right.
// ---------------------------------------------------------------------------

export const LOOP_CX = 260;
export const LOOP_CY = 300;
export const LOOP_R = 150;
export const LOOP_NODES = [
  { label: 'model', sub: 'the current fit' },
  { label: 'generate', sub: 'sample from it' },
  { label: 'dataset', sub: 'its own outputs' },
  { label: 'retrain', sub: 'fit to the samples' },
];
export const loopPos = (i: number): { x: number; y: number } => ({
  x: LOOP_CX + LOOP_R * Math.cos((i / 4) * 2 * Math.PI - Math.PI / 2),
  y: LOOP_CY + LOOP_R * Math.sin((i / 4) * 2 * Math.PI - Math.PI / 2),
});

export const DIST_X0 = 560;
export const DIST_X1 = 1180;
export const DIST_Y0 = 470;
export const DIST_H = 300;
export const dx = (x: number): number => DIST_X0 + ((x + 3.2) / 6.4) * (DIST_X1 - DIST_X0);
export const dy = (p: number): number => DIST_Y0 - p * DIST_H * 1.9;

export const CAM_LOOP: CameraState = { x: 350, y: 310, k: 1.25 };
export const CAM_DIST: CameraState = { x: 860, y: 320, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  loopU: ChannelRef<number>; // ring nodes
  spinU: ChannelRef<number>; // packet around the ring (0..2 laps)
  curveU: ChannelRef<number>; // true curve draw
  dotsU: ChannelRef<number>; // 0..50 samples drop in
  refitU: ChannelRef<number>; // refit curve morph in
  tailU: ChannelRef<number>; // tail annotation
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const loopU = tl.channel('loopU', 0);
  const spinU = tl.channel('spinU', 0);
  const curveU = tl.channel('curveU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const refitU = tl.channel('refitU', 0);
  const tailU = tl.channel('tailU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the tempting loop ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The internet has been read. The obvious next teacher is the model itself: generate data, train on it, generate better data. A perpetual motion machine for intelligence — if it works. This book asks when it does.',
  });
  tl.tween(cam, CAM_LOOP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(loopU, 1, { at: 1.4, dur: 2.0, ease: ease.enter });
  tl.tween(spinU, 2, { at: 3.6, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'Model, generate, dataset, retrain, and around again. Every synthetic data pipeline is some version of this ring. The whole question is what survives each lap.',
  });
  tl.hold(11.7, 0.6);

  // — Beat 2 · the smallest possible model ——————————————————————————————
  tl.tween(cam, CAM_DIST, { at: 12.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 12.7,
    dur: 5.4,
    text: 'To watch the ring honestly, shrink the model until nothing can hide. Our model is a bell curve fitted to data; the true world is this distribution, centered at zero with spread one. Generating means sampling from the fit.',
  });
  tl.tween(curveU, 1, { at: 13.5, dur: 1.5, ease: ease.draw });
  tl.hold(18.3, 0.5);

  // — Beat 3 · one turn of the crank ————————————————————————————————————
  tl.caption({
    at: 18.8,
    dur: 5.2,
    text: 'Turn the crank once, for real: draw fifty samples from the model. Watch where they land — and notice what does not land. Not one of the fifty falls beyond two spreads from center.',
  });
  tl.tween(dotsU, M_SAMPLES, { at: 19.6, dur: 4.5, ease: ease.linear });
  tl.tween(tailU, 1, { at: 23.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 24.4,
    dur: 5.4,
    text: 'Now retrain: fit a fresh curve to those fifty points. The refit is already a hair narrower — spread zero point eight nine — and centered at zero point one eight instead of zero. No bug anywhere. Finite samples under-represent their own tails, and the refit believes the samples.',
  });
  tl.tween(refitU, 1, { at: 25.6, dur: 1.5, ease: ease.move });
  tl.hold(30.0, 0.6);

  // — Beat 4 · why this matters —————————————————————————————————————————
  tl.caption({
    at: 30.6,
    dur: 5.6,
    text: 'One lap, one barely visible loss. But the ring has no memory of the true world — the next lap starts from the narrowed curve, and its samples will be drawn from that. Rare events that fail to appear once are gone from every future generation.',
  });
  tl.caption({
    at: 36.6,
    dur: 4.8,
    text: 'This is the seed of everything that follows: the tails feed the next generation, and the tails are exactly what sampling loses first.',
  });
  tl.hold(41.6, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 42.8, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 44.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.0,
    dur: 5.2,
    text: 'Next chapter we stop being polite: we crank this exact ring thirty times and measure what dies. It has a name in the published literature — model collapse — and on our toy we can watch it happen in full.',
  });
  tl.hold(49.4, 1.2);

  return { tl, cam, loopU, spinU, curveU, dotsU, refitU, tailU, dimU, endU };
}
