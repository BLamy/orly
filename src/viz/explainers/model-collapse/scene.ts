import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Model Collapse — the ring, cranked thirty times, measured.
 *
 * The exact loop from chapter one, iterated (seed 25): fit a Gaussian, draw
 * 50 samples FROM THE FIT, refit, repeat — thirty generations, no fresh data
 * ever. Everything measured at module scope:
 *   spread: 1.000 → 0.73 (g5) → 0.54 (g10) → 0.27 (g20) → 0.244 (g30)
 *   mean: drifts to +0.46 — the model doesn't just narrow, it wanders
 *   tail mass beyond two sigma: dead from the very first generation onward.
 * This is the shape of the published model-collapse results (Shumailov et
 * al.), reproduced on a toy where every draw is inspectable.
 */

export const M = 50;
export const GENS = 30;
export interface Gen {
  mu: number;
  sd: number;
  tail: number;
  samples: number[];
}
export const HIST: Gen[] = (() => {
  const rand = mulberry32(25);
  const g = gaussian(rand);
  let mu = 0;
  let sd = 1;
  const hist: Gen[] = [{ mu, sd, tail: 0.046, samples: [] }];
  for (let gen = 1; gen <= GENS; gen++) {
    const xs = Array.from({ length: M }, () => mu + sd * g());
    const m = xs.reduce((a, b) => a + b, 0) / M;
    const v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / M;
    mu = m;
    sd = Math.sqrt(v);
    hist.push({ mu, sd, tail: xs.filter((x) => Math.abs(x) > 2).length / M, samples: xs });
  }
  return hist;
})();
export const FINAL = HIST[GENS];

export function genAt(u: number): { mu: number; sd: number } {
  const s = Math.max(0, Math.min(GENS, u));
  const i = Math.floor(s);
  const j = Math.min(GENS, i + 1);
  const f = s - i;
  return {
    mu: HIST[i].mu + f * (HIST[j].mu - HIST[i].mu),
    sd: HIST[i].sd + f * (HIST[j].sd - HIST[i].sd),
  };
}

export const gauss = (x: number, mu: number, sd: number): number =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

// ---------------------------------------------------------------------------
// Layout — big distribution stage left/center, sd-vs-generation chart right.
// ---------------------------------------------------------------------------

export const DIST_X0 = 90;
export const DIST_X1 = 700;
export const DIST_Y0 = 500;
export const DIST_H = 330;
export const dx = (x: number): number => DIST_X0 + ((x + 3.2) / 6.4) * (DIST_X1 - DIST_X0);
export const dy = (p: number): number => DIST_Y0 - p * DIST_H * 1.05;

export const CH_X0 = 790;
export const CH_X1 = 1190;
export const CH_Y0 = 480;
export const CH_H = 320;
export const chX = (gen: number): number => CH_X0 + (gen / GENS) * (CH_X1 - CH_X0);
export const chY = (sd: number): number => CH_Y0 - sd * CH_H;

export const CAM_DIST: CameraState = { x: 420, y: 320, k: 1.2 };
export const CAM_CHART: CameraState = { x: 950, y: 320, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  curveU: ChannelRef<number>; // stage + true curve
  gen: ChannelRef<number>; // 0..30 the collapsing generation
  ghostU: ChannelRef<number>; // keep the true curve as ghost
  axU: ChannelRef<number>;
  tailU: ChannelRef<number>; // tail-death annotation
  driftU: ChannelRef<number>; // mean-drift annotation
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const curveU = tl.channel('curveU', 0);
  const gen = tl.channel('gen', 0);
  const ghostU = tl.channel('ghostU', 0);
  const axU = tl.channel('axU', 0);
  const tailU = tl.channel('tailU', 0);
  const driftU = tl.channel('driftU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the setup ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Same ring as last chapter, no mercy this time: thirty generations, fifty samples each, and after the first turn the model never sees real data again. Every generation you are about to watch was actually simulated.',
  });
  tl.tween(cam, CAM_DIST, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(curveU, 1, { at: 1.4, dur: 1.6, ease: ease.draw });
  tl.tween(ghostU, 1, { at: 2.6, dur: 0.8, ease: ease.enter });
  tl.hold(5.9, 0.4);

  // — Beat 2 · the first casualties —————————————————————————————————————
  tl.caption({
    at: 6.3,
    dur: 5.4,
    text: 'Generation one: the tails die instantly. Not a single sample beyond two spreads survives into the training set, so the refit forgets those regions exist. Rare knowledge is the first casualty, and it never comes back.',
  });
  tl.tween(gen, 3, { at: 7.1, dur: 3.5, ease: ease.move });
  tl.tween(tailU, 1, { at: 8.1, dur: 0.9, ease: ease.enter });
  tl.hold(11.9, 0.5);

  // — Beat 3 · the grind ————————————————————————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 5.6,
    text: 'Keep cranking. Each refit trusts a finite sample of an already-narrowed curve, so the spread ratchets down: zero point seven three by generation five, zero point five four by ten. The curve is visibly starving.',
  });
  tl.tween(gen, 10, { at: 13.2, dur: 4.6, ease: ease.move });
  tl.caption({
    at: 18.4,
    dur: 5.2,
    text: 'And it does not just narrow — it wanders. With no anchor to the truth, the mean random-walks; by the end it has drifted to plus zero point four six. The model is confidently wrong about where the center of the world is.',
  });
  tl.tween(gen, 20, { at: 19.2, dur: 4.4, ease: ease.move });
  tl.tween(driftU, 1, { at: 21.2, dur: 0.9, ease: ease.enter });
  tl.hold(23.8, 0.5);

  // — Beat 4 · the chart ————————————————————————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 24.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.7,
    dur: 5.2,
    text: 'Here is the whole run as one measurement: spread against generation. By generation thirty the spread is zero point two four — three quarters of the distribution’s variety, gone. Nothing crashed. Every single step was a correct maximum likelihood fit.',
  });
  tl.tween(axU, 1, { at: 25.3, dur: 1.2, ease: ease.draw });
  tl.tween(gen, GENS, { at: 26.9, dur: 4.5, ease: ease.move });
  tl.caption({
    at: 30.5,
    dur: 5.4,
    text: 'That is the punchline of the published collapse results, reproduced end to end: recursion plus finite sampling is enough. No bad objective, no bug — just a copy of a copy of a copy.',
  });
  tl.hold(36.1, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 36.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 37.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 38.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 38.5,
    dur: 5.4,
    text: 'So is synthetic data doomed? No — because nothing in this loop ever checked a sample against reality. Next chapter we add one filter, rerun the exact same thirty generations, and watch the collapse get averted.',
  });
  tl.hold(44.1, 1.2);

  return { tl, cam, curveU, gen, ghostU, axU, tailU, driftU, dimU, endU };
}
