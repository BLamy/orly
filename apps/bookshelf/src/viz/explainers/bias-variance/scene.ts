import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Bias and Variance — the decomposition.
 *
 * Where the overfitting chapter turned a degree dial on ONE dataset, this
 * chapter resamples the dataset itself. All math lives here at module scope:
 * one smooth truth plus Gaussian noise, THIRTY seeded independent training
 * sets of twelve points, and for every set a real least-squares fit of a
 * stiff model (degree 2) and a flexible one (degree 9) — normal equations
 * with a tiny ridge epsilon, solved by our own Gaussian elimination.
 *
 * At the probe input x0 = 0.55 (seed 11, verified numerically):
 *   stiff    bias² = 0.0481, var = 0.0028, noise = 0.0169 → sum 0.0678;
 *            Monte-Carlo expected squared error 0.0677.
 *   flexible bias² = 0.0007, var = 0.0116, noise = 0.0169 → sum 0.0293;
 *            Monte-Carlo expected squared error 0.0293.
 * The identity bias² + variance + noise = expected error holds to the third
 * decimal — nothing on screen is faked.
 */

// ---------------------------------------------------------------------------
// The truth, the noise, and thirty seeded training sets
// ---------------------------------------------------------------------------

export const TRUE_F = (x: number): number => 0.65 * Math.sin(2.6 * x) + 0.25 * x;

export const NOISE = 0.13;
export const NOISE_VAR = NOISE * NOISE; // 0.0169 — the floor nobody escapes

export const N_SETS = 30;
export const N_PTS = 12;

const rand = mulberry32(11);
const gauss = gaussian(rand);

export interface Dataset {
  xs: number[];
  ys: number[];
}

export const SETS: Dataset[] = [];
for (let s = 0; s < N_SETS; s++) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < N_PTS; i++) {
    const x = -0.95 + (1.9 * i) / (N_PTS - 1) + 0.06 * (rand() - 0.5);
    xs.push(x);
    ys.push(TRUE_F(x) + NOISE * gauss());
  }
  SETS.push({ xs, ys });
}

// ---------------------------------------------------------------------------
// Least squares by hand — normal equations + Gaussian elimination
// ---------------------------------------------------------------------------

/** Solve A x = b (dense, square) by Gaussian elimination with partial pivoting. */
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

const RIDGE_EPS = 1e-9; // numerical stability only

/** Fit a degree-d polynomial to one dataset: (XᵀX + εI) c = Xᵀy. */
function fitPoly(ds: Dataset, deg: number): number[] {
  const m = deg + 1;
  const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  const b = new Array<number>(m).fill(0);
  for (let i = 0; i < ds.xs.length; i++) {
    const pows = [1];
    for (let p = 1; p <= deg; p++) pows.push(pows[p - 1] * ds.xs[i]);
    for (let r = 0; r < m; r++) {
      b[r] += pows[r] * ds.ys[i];
      for (let c = 0; c < m; c++) A[r][c] += pows[r] * pows[c];
    }
  }
  for (let r = 0; r < m; r++) A[r][r] += RIDGE_EPS;
  return solveLinear(A, b);
}

export const evalPoly = (c: readonly number[], x: number): number => {
  let s = 0;
  for (let p = c.length - 1; p >= 0; p--) s = s * x + c[p];
  return s;
};

export const STIFF_DEG = 2;
export const FLEX_DEG = 9;

/** Thirty stiff fits and thirty flexible fits — one pair per dataset. */
export const STIFF: number[][] = SETS.map((ds) => fitPoly(ds, STIFF_DEG));
export const FLEX: number[][] = SETS.map((ds) => fitPoly(ds, FLEX_DEG));

/** Polynomial evaluation is linear in the coefficients, so the pointwise mean
 *  curve of thirty fits is exactly the fit with the mean coefficient vector. */
function meanCoef(fits: readonly number[][]): number[] {
  const m = fits[0].length;
  const out = new Array<number>(m).fill(0);
  for (const c of fits) for (let i = 0; i < m; i++) out[i] += c[i] / fits.length;
  return out;
}
export const MEAN_STIFF: number[] = meanCoef(STIFF);
export const MEAN_FLEX: number[] = meanCoef(FLEX);

// ---------------------------------------------------------------------------
// The decomposition at the probe input x0 — and its numerical verification
// ---------------------------------------------------------------------------

export const X0 = 0.55;

export interface Ledger {
  preds: number[]; // one prediction per training set
  mean: number;
  bias2: number;
  variance: number;
  noise: number;
  sum: number; // bias² + variance + noise
  measured: number; // Monte-Carlo E[(prediction − fresh noisy y)²]
  lo: number; // min prediction (the spread bracket)
  hi: number; // max prediction
}

function ledger(fits: readonly number[][], mcSeed: number): Ledger {
  const preds = fits.map((c) => evalPoly(c, X0));
  const mean = preds.reduce((a, b) => a + b, 0) / preds.length;
  const truth = TRUE_F(X0);
  const bias2 = (mean - truth) ** 2;
  const variance = preds.reduce((a, p) => a + (p - mean) ** 2, 0) / preds.length;
  // Monte Carlo: fresh noisy targets at x0, cycled over the thirty models.
  const r = mulberry32(mcSeed);
  const g = gaussian(r);
  const K = 4000;
  let ese = 0;
  for (let k = 0; k < K; k++) {
    const y = truth + NOISE * g();
    ese += (preds[k % preds.length] - y) ** 2;
  }
  return {
    preds,
    mean,
    bias2,
    variance,
    noise: NOISE_VAR,
    sum: bias2 + variance + NOISE_VAR,
    measured: ese / K,
    lo: Math.min(...preds),
    hi: Math.max(...preds),
  };
}

export const STIFF_LEDGER: Ledger = ledger(STIFF, 99);
export const FLEX_LEDGER: Ledger = ledger(FLEX, 99);

// ---------------------------------------------------------------------------
// Stage mapping — main plot left ~65%, ledger panel right (appears late)
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.05, 1.05])
  .range([100, 830]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.35, 1.35])
  .range([620, 90]);

// flexible fits swing to |f| ≈ 3.5 near the edges — clamp so they slam the
// frame instead of leaving it
export const CLIP_Y = 1.32;
export const clipped = (v: number): number => Math.max(-CLIP_Y, Math.min(CLIP_Y, v));

/** Value of the beat-1 fit at a fractional dataset morph (fit 0 → fit 1). */
export const singleFitAt = (u: number, x: number): number =>
  clipped((1 - u) * evalPoly(FLEX[0], x) + u * evalPoly(FLEX[1], x));

// whiskers showing where the stiff mean misses the bends of the truth
export const GAP_XS: readonly number[] = [-0.82, -0.58, 0.32, 0.62, 0.9];

// the ledger panel (screen space)
export const PANEL_X = 878;
export const PANEL_Y = 96;
export const PANEL_W = 386;
export const PANEL_H = 512;

// camera keyframes
export const CAM_SLICE: CameraState = { x: xScale(X0), y: yScale(0.55), k: 1.55 };
export const CAM_WIDE: CameraState = { ...CAMERA_HOME };

export { STAGE_H, STAGE_W };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  ptsU: ChannelRef<number>;
  dataMorph: ChannelRef<number>; // 0 → dataset 1, 1 → dataset 2 (points + fit)
  singleFitU: ChannelRef<number>;
  truthU: ChannelRef<number>;
  spagFlexU: ChannelRef<number>; // staggered entrance of the 30 flexible fits
  meanFlexU: ChannelRef<number>;
  flexDim: ChannelRef<number>; // dims the whole flexible layer
  spagStiffU: ChannelRef<number>;
  meanStiffU: ChannelRef<number>;
  stiffDim: ChannelRef<number>;
  gapU: ChannelRef<number>; // whiskers where the stiff mean misses the bends
  probeU: ChannelRef<number>; // the vertical slice at x0
  dotsStiffU: ChannelRef<number>;
  dotsFlexU: ChannelRef<number>;
  bracketU: ChannelRef<number>; // bias arrow + spread bracket at the slice
  panelU: ChannelRef<number>;
  barU: ChannelRef<number>; // the stacked bars grow
  numbersU: ChannelRef<number>; // per-segment numbers + the measured check
  mainDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const axesU = tl.channel('axesU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const dataMorph = tl.channel('dataMorph', 0);
  const singleFitU = tl.channel('singleFitU', 0);
  const truthU = tl.channel('truthU', 0);
  const spagFlexU = tl.channel('spagFlexU', 0);
  const meanFlexU = tl.channel('meanFlexU', 0);
  const flexDim = tl.channel('flexDim', 1);
  const spagStiffU = tl.channel('spagStiffU', 0);
  const meanStiffU = tl.channel('meanStiffU', 0);
  const stiffDim = tl.channel('stiffDim', 1);
  const gapU = tl.channel('gapU', 0);
  const probeU = tl.channel('probeU', 0);
  const dotsStiffU = tl.channel('dotsStiffU', 0);
  const dotsFlexU = tl.channel('dotsFlexU', 0);
  const bracketU = tl.channel('bracketU', 0);
  const panelU = tl.channel('panelU', 0);
  const barU = tl.channel('barU', 0);
  const numbersU = tl.channel('numbersU', 0);
  const mainDim = tl.channel('mainDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · one dataset, one flexible fit — looks fine ————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Twelve noisy points, one flexible fit — degree nine, real least squares. It threads the data and looks perfectly convincing.',
  });
  tl.tween(axesU, 1, { at: 0.4, dur: 1.3, ease: ease.draw });
  tl.tween(ptsU, 1, { at: 1.0, dur: 1.5, ease: ease.enter });
  tl.tween(singleFitU, 1, { at: 3.0, dur: 1.5, ease: ease.draw });
  tl.hold(6.5, 0.7);

  tl.caption({
    at: 7.2,
    dur: 5.8,
    text: 'But underneath sits a smooth truth plus noise, and your twelve points were one roll of the dice.',
  });
  tl.tween(truthU, 1, { at: 7.6, dur: 1.5, ease: ease.draw });
  tl.hold(13.0, 0.7);

  // — Beat 1b · roll again: the fit whips around ——————————————————————————
  tl.caption({
    at: 13.7,
    dur: 6.4,
    text: 'So roll the dice again. Same truth, same noise, a fresh sample of twelve — and the flexible fit whips into a completely different curve.',
  });
  tl.tween(dataMorph, 1, { at: 14.6, dur: 2.4, ease: ease.move });
  tl.hold(20.1, 0.7);

  // — Beat 2 · thirty flexible fits: the spaghetti ————————————————————————
  tl.caption({
    at: 20.8,
    dur: 6.6,
    text: 'Do it thirty times. Each training set gets its own degree nine fit, and together they make this cloud of spaghetti — the curve depends wildly on which points you happened to draw.',
  });
  tl.tween(singleFitU, 0, { at: 21.4, dur: 1.2, ease: ease.move });
  tl.tween(ptsU, 0.25, { at: 21.4, dur: 1.2, ease: ease.move });
  tl.tween(spagFlexU, 1, { at: 21.6, dur: 3.2, ease: ease.enter });
  tl.hold(27.4, 0.6);

  tl.caption({
    at: 28.0,
    dur: 6.2,
    text: 'That spread is variance. Yet average all thirty curves, and the mean hugs the hidden truth — on average, the flexible model is barely wrong at all.',
  });
  tl.tween(meanFlexU, 1, { at: 28.6, dur: 1.6, ease: ease.draw });
  tl.hold(34.2, 0.6);

  // — Beat 3 · thirty stiff fits: the opposite failure ————————————————————
  tl.caption({
    at: 34.8,
    dur: 6.2,
    text: 'Now hand the same thirty datasets to a stiff model — a plain parabola. The thirty fits land almost on top of each other; the spread nearly vanishes.',
  });
  tl.tween(flexDim, 0.14, { at: 35.2, dur: 1.2, ease: ease.move });
  tl.tween(spagStiffU, 1, { at: 35.6, dur: 3.0, ease: ease.enter });
  tl.hold(41.0, 0.6);

  tl.caption({
    at: 41.6,
    dur: 6.0,
    text: 'But their average misses the bends of the truth, and no amount of extra data fixes that. Being wrong the same way every time is bias.',
  });
  tl.tween(meanStiffU, 1, { at: 42.0, dur: 1.5, ease: ease.draw });
  tl.tween(gapU, 1, { at: 43.8, dur: 1.2, ease: ease.enter });
  tl.hold(47.6, 0.6);

  // — Beat 4 · the probe slice ————————————————————————————————————————————
  tl.caption({
    at: 48.2,
    dur: 6.2,
    text: 'Freeze one input and take a vertical slice. Every dot is one model answering there — thirty stiff answers, thirty flexible answers.',
  });
  tl.tween(cam, CAM_SLICE, { at: 48.4, dur: 1.6, ease: ease.move });
  tl.tween(gapU, 0, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(flexDim, 0.35, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(stiffDim, 0.35, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(probeU, 1, { at: 49.4, dur: 1.0, ease: ease.draw });
  tl.tween(dotsStiffU, 1, { at: 50.6, dur: 1.4, ease: ease.enter });
  tl.tween(dotsFlexU, 1, { at: 52.0, dur: 1.4, ease: ease.enter });
  tl.hold(54.4, 0.5);

  tl.caption({
    at: 54.9,
    dur: 6.0,
    text: 'The stiff dots cluster tightly in the wrong place; the flexible dots scatter widely around the right place. Bias versus variance, in one slice.',
  });
  tl.tween(bracketU, 1, { at: 55.5, dur: 1.2, ease: ease.enter });
  tl.hold(60.9, 0.5);

  // — Beat 5 · the ledger ——————————————————————————————————————————————————
  tl.caption({
    at: 61.4,
    dur: 6.4,
    text: 'Now do the accounting. Expected squared error splits exactly into three parts: squared bias, variance, and the noise you can never remove.',
    tex: 'E\\big[(\\hat f - y)^2\\big] = \\mathrm{Bias}^2 + \\mathrm{Var} + \\sigma^2',
  });
  tl.tween(cam, CAM_WIDE, { at: 61.6, dur: 1.6, ease: ease.move });
  tl.tween(panelU, 1, { at: 62.4, dur: 0.9, ease: ease.enter });
  tl.tween(barU, 1, { at: 63.6, dur: 1.8, ease: ease.move });
  tl.hold(67.8, 0.5);

  tl.caption({
    at: 68.3,
    dur: 6.4,
    text: 'And the numbers really add up, to the third decimal. The stiff model pays mostly in bias; the flexible one pays mostly in variance — and both carry the same noise floor.',
  });
  tl.tween(numbersU, 1, { at: 68.9, dur: 0.9, ease: ease.enter });
  tl.hold(74.7, 0.6);

  // — Beat 6 · the two habits of error ————————————————————————————————————
  tl.caption({
    at: 75.3,
    dur: 6.6,
    text: 'So error has two habits: being wrong the same way every time, and being wrong a different way each time. Every modeling choice trades one habit for the other.',
  });
  tl.tween(bracketU, 0, { at: 75.5, dur: 1.0, ease: ease.move });
  tl.tween(dotsStiffU, 0.4, { at: 75.5, dur: 1.0, ease: ease.move });
  tl.tween(dotsFlexU, 0.4, { at: 75.5, dur: 1.0, ease: ease.move });
  tl.hold(81.9, 0.6);

  // — Beat 7 · the book recap, clean ending ————————————————————————————————
  tl.tween(mainDim, 0.12, { at: 82.5, dur: 1.3, ease: ease.move });
  tl.tween(panelU, 0.12, { at: 82.5, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 83.3,
    dur: 7.4,
    text: "And that's the whole book. Loss is a stretched valley, so shape your steps; schedules cool the search; batches trade noise for speed; and in the end, you balance the two habits of error.",
  });
  tl.tween(closeU, 1, { at: 83.9, dur: 0.9, ease: ease.enter });
  tl.hold(90.7, 1.3);

  return {
    tl,
    cam,
    axesU,
    ptsU,
    dataMorph,
    singleFitU,
    truthU,
    spagFlexU,
    meanFlexU,
    flexDim,
    spagStiffU,
    meanStiffU,
    stiffDim,
    gapU,
    probeU,
    dotsStiffU,
    dotsFlexU,
    bracketU,
    panelU,
    barU,
    numbersU,
    mainDim,
    closeU,
  };
}
