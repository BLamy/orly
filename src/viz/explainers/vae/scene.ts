import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The VAE — a latent space you can walk.
 *
 * All math at module scope: the same seeded 2-D manifold data as the
 * autoencoder chapter, and an ACTUAL linear variational autoencoder trained
 * by gradient descent on the exact (closed-form, expectation-integrated)
 * objective: reconstruction + KL to a standard normal prior. Numeric central
 * differences over the five parameters; 400 recorded steps. The latent axis,
 * the code fuzz, the prior alignment, and the latent walk all come from the
 * trained parameters.
 *
 * Empirics with SEED = 4 (verified by running this exact code): loss
 * 1.754 -> 1.141; learned code noise sigma = 0.566; encoded means have
 * spread 0.823, and 0.823^2 + 0.566^2 ~= 1.0 — the aggregate of all codes
 * matches the standard normal prior almost exactly.
 */

export const SEED = 4;
export const N_PTS = 160;
export const LR = 0.08;
export const N_STEPS = 400;

const rand = mulberry32(SEED);
const g = gaussian(rand);

const DIR = (() => {
  const raw = [1, 0.62];
  const n = Math.hypot(raw[0], raw[1]);
  return [raw[0] / n, raw[1] / n] as [number, number];
})();

export const DATA: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < N_PTS; i++) {
    const t = 1.3 * g();
    const e = 0.28 * g();
    out.push([t * DIR[0] - e * DIR[1], t * DIR[1] + e * DIR[0]]);
  }
  return out;
})();

/** Params: [a0, a1, d0, d1, logSigma]. */
export type Theta = [number, number, number, number, number];

function loss(th: Theta): number {
  const [a0, a1, dd0, dd1, ls] = th;
  const s2 = Math.exp(2 * ls);
  let L = 0;
  for (const x of DATA) {
    const mu = a0 * x[0] + a1 * x[1];
    const e0 = x[0] - dd0 * mu;
    const e1 = x[1] - dd1 * mu;
    const rec = e0 * e0 + e1 * e1 + s2 * (dd0 * dd0 + dd1 * dd1);
    const kl = 0.5 * (mu * mu + s2 - 1 - 2 * ls);
    L += rec + kl;
  }
  return L / N_PTS;
}

export interface Snap {
  th: Theta;
  loss: number;
}

export const RUN: Snap[] = (() => {
  let th: Theta = [0.4, -0.2, -0.1, 0.5, 0];
  const snaps: Snap[] = [{ th: [...th] as Theta, loss: loss(th) }];
  for (let it = 0; it < N_STEPS; it++) {
    const gr = th.map((_, k) => {
      const h = 1e-5;
      const tp = [...th] as Theta;
      tp[k] += h;
      const tm = [...th] as Theta;
      tm[k] -= h;
      return (loss(tp) - loss(tm)) / (2 * h);
    });
    th = th.map((v, k) => v - LR * gr[k]) as Theta;
    snaps.push({ th: [...th] as Theta, loss: loss(th) });
  }
  return snaps;
})();

export const FINAL: Theta = RUN[RUN.length - 1].th;
export const SIGMA = Math.exp(FINAL[4]); // learned code noise
export const encodeMu = (x: [number, number], th: Theta = FINAL): number => th[0] * x[0] + th[1] * x[1];
export const decode = (z: number, th: Theta = FINAL): [number, number] => [th[2] * z, th[3] * z];

export const MUS: number[] = DATA.map((x) => encodeMu(x));
export const MU_SPREAD: number = (() => {
  const m = MUS.reduce((a, b) => a + b, 0) / MUS.length;
  return Math.sqrt(MUS.reduce((a, b) => a + (b - m) * (b - m), 0) / MUS.length);
})();
export const AGG_STD = Math.sqrt(MU_SPREAD * MU_SPREAD + SIGMA * SIGMA); // ~1.0

/** Lerped params at fractional step f. */
export function thetaAt(f: number): Theta {
  const gg = Math.max(0, Math.min(RUN.length - 1, f));
  const i = Math.floor(gg);
  if (i >= RUN.length - 1) return RUN[RUN.length - 1].th;
  const t = gg - i;
  const A = RUN[i].th;
  const B = RUN[i + 1].th;
  return A.map((v, k) => v + (B[k] - v) * t) as Theta;
}

/** Two anchor points for the interpolation beat: leftmost and rightmost. */
export const ANCHOR_A = DATA.reduce((a, b) => (encodeMu(b) < encodeMu(a) ? b : a));
export const ANCHOR_B = DATA.reduce((a, b) => (encodeMu(b) > encodeMu(a) ? b : a));
export const Z_A = encodeMu(ANCHOR_A);
export const Z_B = encodeMu(ANCHOR_B);

// ---------------------------------------------------------------------------
// Stage mapping — data plane top-left, latent number line at bottom-right
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear().domain([-3.2, 3.2]).range([80, 760]);
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-2.5, 2.5]).range([620, 90]);

/** Latent axis (z), drawn as a horizontal number line on the right panel. */
export const zScale: ScaleLinear<number, number> = scaleLinear().domain([-3, 3]).range([880, 1230]);
export const Z_AXIS_Y = 430;

export const CAM_DATA: CameraState = { x: 430, y: 350, k: 1.22 };
export const CAM_LATENT: CameraState = { x: 1000, y: 400, k: 1.35 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  axisU: ChannelRef<number>; // latent number line
  codesU: ChannelRef<number>; // encoded mu ticks on the latent line
  fuzzU: ChannelRef<number>; // the sigma intervals around each code
  priorU: ChannelRef<number>; // standard normal curve over the latent line
  stepProg: ChannelRef<number>; // 0..N_STEPS
  texU: ChannelRef<number>;
  lineU: ChannelRef<number>; // decoder line in data space
  walkZ: ChannelRef<number>; // the latent walk position (z value)
  walkU: ChannelRef<number>; // walker visibility
  lerpU: ChannelRef<number>; // interpolation beat: 0..1 from anchor A to B
  lerpOn: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const axisU = tl.channel('axisU', 0);
  const codesU = tl.channel('codesU', 0);
  const fuzzU = tl.channel('fuzzU', 0);
  const priorU = tl.channel('priorU', 0);
  const stepProg = tl.channel('stepProg', 0);
  const texU = tl.channel('texU', 0);
  const lineU = tl.channel('lineU', 0);
  const walkZ = tl.channel('walkZ', -2);
  const walkU = tl.channel('walkU', 0);
  const lerpU = tl.channel('lerpU', 0);
  const lerpOn = tl.channel('lerpOn', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the autoencoder's unpaid debt ———————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Last chapter ended with a confession: the autoencoder organizes nothing about its codes. They are just numbers on an axis, at whatever scale and spacing training happened to produce.',
  });
  tl.tween(dotsU, 1, { at: 0.4, dur: 2.0, ease: ease.enter });
  tl.tween(axisU, 1, { at: 1.4, dur: 1.3, ease: ease.draw });
  tl.tween(codesU, 1, { at: 2.6, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'Why care? Because to generate, you must pick a code out of thin air and decode it. If the codes have gaps and no known shape, picking one is a guess into the dark.',
  });
  tl.hold(11.9, 0.6);

  // — Beat 2 · the two changes ————————————————————————————————————————————
  tl.caption({
    at: 12.5,
    dur: 6.2,
    text: 'The variational autoencoder makes two changes. First, each input maps not to a point but to a small cloud: a mean and a width. The decoder must survive that added blur.',
    tex: 'z \\sim \\mathcal{N}(\\mu(x), \\sigma^2)',
  });
  tl.tween(fuzzU, 1, { at: 13.4, dur: 1.2, ease: ease.enter });
  tl.tween(texU, 1, { at: 14.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 19.1,
    dur: 6.0,
    text: 'Second, a penalty pulls every cloud toward one fixed target: the standard bell curve. That is the prior, and it is the contract: all codes, collectively, must fill this exact shape.',
    tex: '\\mathrm{KL}\\big(\\mathcal{N}(\\mu,\\sigma^2)\\,\\|\\,\\mathcal{N}(0,1)\\big)',
  });
  tl.tween(priorU, 1, { at: 19.8, dur: 1.4, ease: ease.draw });
  tl.hold(25.3, 0.6);

  // — Beat 3 · train it —————————————————————————————————————————————————————
  tl.tween(badgeU, 1, { at: 25.9, dur: 0.6, ease: ease.enter });
  tl.tween(lineU, 1, { at: 26.1, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'Train the real objective: reconstruction error plus that penalty, by gradient descent. Watch the codes slide and pack themselves under the bell curve while the decoder line finds the data.',
  });
  tl.tween(stepProg, N_STEPS, { at: 27.0, dur: 7.0, ease: ease.move });
  tl.caption({
    at: 32.7,
    dur: 5.8,
    text: 'Converged. The clouds spread to width point eight, each fuzzy by about point six, and the two together add up to width one: the codes now tile the prior almost perfectly. That was the whole point.',
  });
  tl.hold(38.7, 0.6);

  // — Beat 4 · walk the latent space ———————————————————————————————————————
  tl.tween(cam, CAM_LATENT, { at: 39.3, dur: 1.5, ease: ease.move });
  tl.tween(walkU, 1, { at: 40.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 40.4,
    dur: 5.8,
    text: 'Now the payoff. Slide along the latent axis and decode as you go. Every position is a legal code, because the training contract guaranteed this axis is fully settled.',
  });
  tl.tween(cam, CAM_DATA, { at: 44.4, dur: 1.6, ease: ease.move });
  tl.tween(walkZ, 2, { at: 41.2, dur: 7.0, ease: ease.move });
  tl.caption({
    at: 46.4,
    dur: 5.0,
    text: 'The decoded point glides smoothly along the learned manifold in data space. No gaps, no cliffs: the walk upstairs is a walk downstairs too.',
  });
  tl.hold(51.6, 0.5);

  // — Beat 5 · interpolation ————————————————————————————————————————————————
  tl.set(lerpOn, 1, 52.0);
  tl.caption({
    at: 52.1,
    dur: 6.0,
    text: 'And between any two real inputs: encode both, draw the straight line between their codes, and decode the midpoints. You get a smooth morph from one example into the other.',
  });
  tl.tween(lerpU, 1, { at: 52.8, dur: 4.6, ease: ease.move });
  tl.hold(58.3, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 58.9, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 58.9, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 58.9, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 60.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 60.1,
    dur: 5.8,
    text: 'That is the variational autoencoder: blur every code, tax every departure from the bell curve, and the reward is a latent space you can sample, walk, and interpolate.',
  });
  tl.caption({
    at: 66.3,
    dur: 5.4,
    text: 'One family solved generation by organizing the codes. The next chapter solves it with a fight: two networks, one forging data, one calling the forgeries.',
  });
  tl.hold(71.9, 1.2);

  return {
    tl,
    cam,
    dotsU,
    axisU,
    codesU,
    fuzzU,
    priorU,
    stepProg,
    texU,
    lineU,
    walkZ,
    walkU,
    lerpU,
    lerpOn,
    badgeU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
