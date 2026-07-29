import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Density — what "learning a distribution" means.
 *
 * All math at module scope: 300 seeded points drawn from a hidden 3-component
 * Gaussian mixture, and an ACTUAL expectation-maximization fit (isotropic
 * components, 30 iterations, every iteration's means, widths, weights, and
 * log-likelihood recorded). The circles you watch slide into place are the
 * real EM trajectory, and the fresh samples at the end are drawn from the
 * FITTED model, not the hidden truth.
 *
 * Empirics with SEED = 5 (verified by running this exact code): the fit
 * recovers means within ~0.1 of the truth; log-likelihood climbs from
 * ~-949 to ~-716 and flattens.
 */

export interface Comp {
  m: [number, number];
  s: number;
  pi: number;
}

const TRUE_COMPS: Comp[] = [
  { m: [-1.6, -0.8], s: 0.45, pi: 1 / 3 },
  { m: [1.4, -1.0], s: 0.5, pi: 1 / 3 },
  { m: [0.1, 1.3], s: 0.4, pi: 1 / 3 },
];
export const N_PTS = 300;
export const SEED = 5;

const rand = mulberry32(SEED);
const g = gaussian(rand);

export const DATA: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < N_PTS / 3; i++) {
      out.push([TRUE_COMPS[k].m[0] + TRUE_COMPS[k].s * g(), TRUE_COMPS[k].m[1] + TRUE_COMPS[k].s * g()]);
    }
  }
  return out;
})();

function pdf(x: [number, number], mu: [number, number], s: number): number {
  const d0 = x[0] - mu[0];
  const d1 = x[1] - mu[1];
  return Math.exp(-(d0 * d0 + d1 * d1) / (2 * s * s)) / (2 * Math.PI * s * s);
}

export const N_ITERS = 30;

/** The recorded EM run: one snapshot of the 3 components per iteration. */
export const EM: { comps: Comp[]; ll: number }[] = (() => {
  let mus: [number, number][] = [
    [-0.5, 0],
    [0, 0.3],
    [0.5, 0],
  ];
  let sig = [0.8, 0.8, 0.8];
  let pi = [1 / 3, 1 / 3, 1 / 3];
  const snaps: { comps: Comp[]; ll: number }[] = [];
  const snapshot = () => ({
    comps: mus.map((m, k) => ({ m: [...m] as [number, number], s: sig[k], pi: pi[k] })),
    ll: DATA.reduce((a, x) => a + Math.log(mus.reduce((b, mu, k) => b + pi[k] * pdf(x, mu, sig[k]), 0)), 0),
  });
  snaps.push(snapshot());
  for (let it = 0; it < N_ITERS; it++) {
    const R = DATA.map((x) => {
      const w = mus.map((mu, k) => pi[k] * pdf(x, mu, sig[k]));
      const Z = w.reduce((a, b) => a + b, 0);
      return w.map((v) => v / Z);
    });
    mus = mus.map((_, k) => {
      const Nk = R.reduce((a, r) => a + r[k], 0);
      return [
        R.reduce((a, r, i) => a + r[k] * DATA[i][0], 0) / Nk,
        R.reduce((a, r, i) => a + r[k] * DATA[i][1], 0) / Nk,
      ] as [number, number];
    });
    sig = sig.map((_, k) => {
      const Nk = R.reduce((a, r) => a + r[k], 0);
      return Math.sqrt(
        R.reduce((a, r, i) => {
          const d0 = DATA[i][0] - mus[k][0];
          const d1 = DATA[i][1] - mus[k][1];
          return a + r[k] * (d0 * d0 + d1 * d1);
        }, 0) /
          (2 * Nk),
      );
    });
    pi = pi.map((_, k) => R.reduce((a, r) => a + r[k], 0) / DATA.length);
    snaps.push(snapshot());
  }
  return snaps;
})();

export const LL_FIRST = EM[0].ll;
export const LL_LAST = EM[EM.length - 1].ll;
export const FINAL: Comp[] = EM[EM.length - 1].comps;

/** Lerped components at fractional EM iteration f in [0, N_ITERS]. */
export function compsAt(f: number): Comp[] {
  const gg = Math.max(0, Math.min(EM.length - 1, f));
  const i = Math.floor(gg);
  if (i >= EM.length - 1) return EM[EM.length - 1].comps;
  const t = gg - i;
  const A = EM[i].comps;
  const B = EM[i + 1].comps;
  return A.map((a, k) => ({
    m: [a.m[0] + (B[k].m[0] - a.m[0]) * t, a.m[1] + (B[k].m[1] - a.m[1]) * t] as [number, number],
    s: a.s + (B[k].s - a.s) * t,
    pi: a.pi + (B[k].pi - a.pi) * t,
  }));
}

/** 150 fresh samples drawn from the FITTED mixture (not the hidden truth). */
export const SAMPLES: [number, number][] = (() => {
  const r2 = mulberry32(77);
  const g2 = gaussian(r2);
  const out: [number, number][] = [];
  for (let i = 0; i < 150; i++) {
    let u = r2();
    let k = 0;
    for (k = 0; k < 3; k++) {
      u -= FINAL[k].pi;
      if (u < 0) break;
    }
    if (k > 2) k = 2;
    out.push([FINAL[k].m[0] + FINAL[k].s * g2(), FINAL[k].m[1] + FINAL[k].s * g2()]);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear().domain([-3.4, 3.4]).range([120, 940]);
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-2.6, 2.6]).range([620, 40]);

export const llX: ScaleLinear<number, number> = scaleLinear().domain([0, N_ITERS]).range([1000, 1230]);
export const llY: ScaleLinear<number, number> = scaleLinear().domain([LL_FIRST - 20, LL_LAST + 20]).range([420, 200]);

export const CAM_DATA: CameraState = { x: 530, y: 330, k: 1.18 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  circlesU: ChannelRef<number>;
  emProg: ChannelRef<number>; // 0..N_ITERS
  texU: ChannelRef<number>;
  llU: ChannelRef<number>;
  fieldU: ChannelRef<number>; // density shading under the fitted model
  samplesU: ChannelRef<number>; // reveal of fresh samples
  dataDim: ChannelRef<number>; // fades the original data for the sampling beat
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const circlesU = tl.channel('circlesU', 0);
  const emProg = tl.channel('emProg', 0);
  const texU = tl.channel('texU', 0);
  const llU = tl.channel('llU', 0);
  const fieldU = tl.channel('fieldU', 0);
  const samplesU = tl.channel('samplesU', 0);
  const dataDim = tl.channel('dataDim', 1);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the data ————————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Three hundred points, dropped by some process we do not get to see. This is all a generative model ever gets: examples, with the machine that made them hidden.',
  });
  tl.tween(dotsU, 1, { at: 0.4, dur: 2.4, ease: ease.enter });
  tl.tween(cam, CAM_DATA, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'The goal sounds strange the first time: learn the distribution. Concretely, that means one thing: assign a probability to every possible point, so that the data you saw is likely.',
  });
  tl.hold(12.3, 0.6);

  // — Beat 2 · the model ————————————————————————————————————————————————————
  tl.caption({
    at: 12.9,
    dur: 5.8,
    text: 'Pick a family of shapes for the guess. Ours is three round Gaussian bumps: each has a center, a width, and a share of the data. Nine numbers to learn, starting from a deliberately terrible guess.',
    tex: 'p(x) = \\textstyle\\sum_k \\pi_k\\, \\mathcal{N}(x \\mid \\mu_k, \\sigma_k^2)',
  });
  tl.tween(circlesU, 1, { at: 13.6, dur: 1.2, ease: ease.enter });
  tl.tween(texU, 1, { at: 14.4, dur: 0.8, ease: ease.enter });
  tl.hold(18.9, 0.6);

  // — Beat 3 · EM, examined ————————————————————————————————————————————————
  tl.tween(badgeU, 1, { at: 19.3, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 19.5,
    dur: 6.2,
    text: 'The fitting loop has two moves. First, each point votes: given the current bumps, which one probably made me? Then each bump moves to the average of its voters and matches their spread.',
  });
  tl.tween(emProg, 2, { at: 20.4, dur: 4.6, ease: ease.move });
  tl.caption({
    at: 26.1,
    dur: 5.2,
    text: 'That is expectation maximization. Watch it run: the bumps slide off each other, claim their clusters, and tighten. Every frame here is a real iteration of the algorithm.',
  });
  tl.tween(emProg, N_ITERS, { at: 26.6, dur: 6.2, ease: ease.move });
  tl.hold(31.9, 0.5);

  // — Beat 4 · the score ———————————————————————————————————————————————————
  tl.caption({
    at: 32.4,
    dur: 5.8,
    text: 'How do we know it is learning and not just wandering? One honest score: the log-likelihood, how probable the model says the data is. Each iteration provably never decreases it.',
  });
  tl.tween(llU, 1, { at: 32.8, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 38.4,
    dur: 4.6,
    text: 'It climbs steeply while the bumps travel, then flattens: the model has extracted everything this family of shapes can say about the data.',
  });
  tl.hold(43.2, 0.6);

  // — Beat 5 · the payoff: sampling ————————————————————————————————————————
  tl.caption({
    at: 43.8,
    dur: 5.6,
    text: 'Now the move that makes the model generative. Run it backward: pick a bump by its share, then draw a point from that bump. No stored example is being copied.',
  });
  tl.tween(dataDim, 0.18, { at: 44.2, dur: 1.2, ease: ease.move });
  tl.tween(fieldU, 1, { at: 44.4, dur: 1.4, ease: ease.move });
  tl.tween(samplesU, 1, { at: 46.2, dur: 4.2, ease: ease.linear });
  tl.caption({
    at: 49.6,
    dur: 5.4,
    text: 'These bright points are brand new, drawn from the fitted model. They land where the data lived, because that is what the nine learned numbers now encode.',
  });
  tl.hold(55.2, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 55.8, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 55.8, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 55.8, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 57.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 57.0,
    dur: 6.0,
    text: 'That is the whole game of generative modeling in miniature: choose a family of distributions, tune it until the data is likely, then sample it to make more.',
  });
  tl.caption({
    at: 63.4,
    dur: 5.6,
    text: 'Every model in this book, from autoencoders to diffusion, is this same game with a vastly more expressive family of shapes. Next: learning the shape by squeezing the data through a bottleneck.',
  });
  tl.hold(69.2, 1.2);

  return { tl, cam, dotsU, circlesU, emProg, texU, llU, fieldU, samplesU, dataDim, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
