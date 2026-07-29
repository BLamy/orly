import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Diffusion, Revisited From Here — the generative family tree.
 *
 * Bridge chapter: it does NOT re-teach diffusion (the shelf has a dedicated
 * diffusion explainer); it places every model of this book in one family
 * picture and shows where each spends its compute.
 *
 * Real math at module scope: a seeded 2-D spiral-arc dataset and the EXACT
 * closed-form forward-noising of denoising diffusion — x_t = sqrt(abar_t) x0
 * + sqrt(1 - abar_t) eps with a fixed seeded eps per point and a cosine
 * abar schedule. The melt you watch (and its reversal) is that formula, a
 * pure function of the time channel; the reverse direction is what a trained
 * denoiser learns to walk.
 */

export const N_PTS = 240;
const rand = mulberry32(12);
const g = gaussian(rand);

/** A curved 2-D dataset (spiral arc) — structure worth destroying. */
export const X0: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < N_PTS; i++) {
    const t = rand() * 1.8 * Math.PI + 0.4;
    const r = 0.34 * t;
    out.push([r * Math.cos(t) + 0.07 * g(), r * Math.sin(t) + 0.07 * g()]);
  }
  return out;
})();

/** Fixed per-point noise draws (the eps in the closed form). */
export const EPS: [number, number][] = Array.from({ length: N_PTS }, () => [g(), g()]);

/** Cosine schedule for abar(t), t in [0, 1]. */
export const abar = (t: number): number => Math.cos((Math.min(1, Math.max(0, t)) * Math.PI) / 2) ** 2;

/** The exact forward-noising formula. */
export const noised = (i: number, t: number): [number, number] => {
  const a = Math.sqrt(abar(t));
  const b = Math.sqrt(1 - abar(t));
  return [a * X0[i][0] + b * EPS[i][0] * 1.1, a * X0[i][1] + b * EPS[i][1] * 1.1];
};

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear().domain([-2.6, 2.6]).range([120, 760]);
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-2.35, 2.35]).range([640, 60]);

/** Family-tree node positions (right panel). */
export interface FamilyNode {
  x: number;
  y: number;
  label: string;
  sub: string;
  steps: number; // "compute spent per sample" in generation passes
}
export const FAMILY: FamilyNode[] = [
  { x: 1000, y: 150, label: 'VAE', sub: 'decode once', steps: 1 },
  { x: 1000, y: 260, label: 'GAN', sub: 'forge once', steps: 1 },
  { x: 1000, y: 370, label: 'autoregressive', sub: 'one piece at a time', steps: 64 },
  { x: 1000, y: 480, label: 'diffusion', sub: 'denoise, many times', steps: 250 },
];

export const CAM_CLOUD: CameraState = { x: 440, y: 350, k: 1.25 };
export const CAM_TREE: CameraState = { x: 990, y: 320, k: 1.3 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  noiseT: ChannelRef<number>; // 0..1 — the exact forward-noising time
  texU: ChannelRef<number>;
  treeU: ChannelRef<number>;
  barsU: ChannelRef<number>; // compute-per-sample bars
  hlIdx: ChannelRef<number>; // highlighted family row (-1 none)
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const noiseT = tl.channel('noiseT', 0);
  const texU = tl.channel('texU', 0);
  const treeU = tl.channel('treeU', 0);
  const barsU = tl.channel('barsU', 0);
  const hlIdx = tl.channel('hlIdx', -1);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · where we stand ———————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Four chapters ago, generating meant fitting three circles. Since then: a bottleneck, a walkable latent space, and a forgery game. One famous family member is still missing.',
  });
  tl.tween(dotsU, 1, { at: 0.4, dur: 2.2, ease: ease.enter });
  tl.tween(cam, CAM_CLOUD, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'This shelf already has a whole chapter on diffusion, so we will not rebuild it. But watch its one central move, because it recasts everything this book has done.',
  });
  tl.hold(12.0, 0.6);

  // — Beat 2 · the forward melt (exact formula) ————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 6.0,
    text: 'Take structured data and destroy it on purpose: mix each point with a little more noise at every step. This is the exact closed-form recipe, not an artist’s impression.',
    tex: 'x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\;\\varepsilon',
  });
  tl.tween(texU, 1, { at: 13.4, dur: 0.8, ease: ease.enter });
  tl.tween(badgeU, 1, { at: 13.6, dur: 0.6, ease: ease.enter });
  tl.tween(noiseT, 1, { at: 14.2, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 18.8,
    dur: 5.0,
    text: 'The spiral melts into a featureless cloud of pure noise. Every dataset, however intricate, ends in this same place. That is the point.',
  });
  tl.hold(24.0, 0.6);

  // — Beat 3 · the reverse walk ————————————————————————————————————————————
  tl.caption({
    at: 24.6,
    dur: 6.0,
    text: 'A diffusion model trains a network to run this film backward: given a noisy frame, predict the noise and remove a sliver of it. Generation is then just: start from static, denoise a few hundred times.',
  });
  tl.tween(noiseT, 0, { at: 25.4, dur: 5.4, ease: ease.move });
  tl.caption({
    at: 30.8,
    dur: 4.8,
    text: 'Structure condenses back out of static. Notice what this bought: no bottleneck to design, no detective to balance. Just many small, supervised denoising problems.',
  });
  tl.hold(35.8, 0.6);

  // — Beat 4 · the family tree ——————————————————————————————————————————————
  tl.tween(cam, CAM_TREE, { at: 36.4, dur: 1.6, ease: ease.move });
  tl.tween(treeU, 1, { at: 37.0, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 37.2,
    dur: 5.8,
    text: 'So here is the family in one frame. Every branch answers the same question, how do you turn noise into data, and differs mainly in where it spends its compute.',
  });
  tl.tween(barsU, 1, { at: 41.2, dur: 1.4, ease: ease.enter });
  tl.set(hlIdx, 0, 43.4);
  tl.caption({
    at: 43.6,
    dur: 5.4,
    text: 'The variational autoencoder pays during training to organize a latent space, then generates in a single cheap decode. One pass, slightly blurry, honest probabilities.',
  });
  tl.set(hlIdx, 1, 49.2);
  tl.caption({
    at: 49.4,
    dur: 5.0,
    text: 'The adversarial network also generates in one pass, and sharper. But it paid in stability: no likelihood, and modes can silently vanish, as we watched.',
  });
  tl.set(hlIdx, 2, 54.6);
  tl.caption({
    at: 54.8,
    dur: 5.2,
    text: 'Autoregressive models, the engine of language models, spend compute piece by piece: each new piece conditioned on everything so far. Exact probabilities, but generation is a long walk.',
  });
  tl.set(hlIdx, 3, 60.2);
  tl.caption({
    at: 60.4,
    dur: 5.4,
    text: 'And diffusion spends its compute at the end: hundreds of denoising passes per sample. It buys the best of both, stable training and sharp output, by paying at generation time.',
  });
  tl.hold(66.0, 0.6);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.set(hlIdx, -1, 66.4);
  tl.tween(cam, CAMERA_HOME, { at: 66.6, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 67.2, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 67.2, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 67.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 68.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 68.4,
    dur: 6.0,
    text: 'One game, four strategies: fit a density, organize a latent space, hire a critic, or learn to reverse decay. Each trades training stability, sample quality, and compute differently.',
  });
  tl.caption({
    at: 74.8,
    dur: 5.2,
    text: 'And all of them are the same move you saw in chapter one: make the data likely under something you can sample. The family resemblance was there all along.',
  });
  tl.hold(80.2, 1.2);

  return { tl, cam, dotsU, noiseT, texU, treeU, barsU, hlIdx, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
