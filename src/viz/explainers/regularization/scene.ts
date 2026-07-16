import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Regularization — the price of complexity.
 *
 * All math is real and lives at module scope:
 *  - a seeded noisy dataset (mulberry32),
 *  - a degree-10 polynomial fitted by RIDGE regression for a log-spaced sweep
 *    of penalty strengths λ, solving (XᵀX + λI) w = Xᵀy ourselves with
 *    Gaussian elimination (partial pivoting),
 *  - per-λ coefficient magnitudes and train/test mean squared error,
 *  - a dropout-as-ensemble finale: 8 least-squares sub-fits, each restricted
 *    to a seeded random subset of the polynomial basis, plus their pointwise
 *    average.
 * Every frame is a pure function of the sampled channels.
 */

// ---------------------------------------------------------------------------
// The dataset (seeded — fresh seed, same trap as the overfitting chapter)
// ---------------------------------------------------------------------------

export const TRUE_F = (x: number): number => Math.sin(2.6 * x);
const NOISE = 0.35;

// Seed chosen so the unpenalized fit is properly wild (it spikes to y ≈ 5)
// and the dropout ensemble's average genuinely beats every individual sub-fit.
const rand = mulberry32(101);
const g = gaussian(rand);

export const N_TRAIN = 12; // 12 points vs 11 parameters — near-interpolation
export const TRAIN_X: number[] = [];
export const TRAIN_Y: number[] = [];
for (let i = 0; i < N_TRAIN; i++) {
  const x = -1 + (2 * i) / (N_TRAIN - 1) + (rand() - 0.5) * 0.07;
  TRAIN_X.push(x);
  TRAIN_Y.push(TRUE_F(x) + g() * NOISE);
}

export const N_TEST = 60;
const TEST_X: number[] = [];
const TEST_Y: number[] = [];
for (let i = 0; i < N_TEST; i++) {
  const x = -1 + (2 * i) / (N_TEST - 1);
  TEST_X.push(x);
  TEST_Y.push(TRUE_F(x) + g() * NOISE);
}

// ---------------------------------------------------------------------------
// Ridge regression on the degree-10 polynomial basis, solved by hand
// ---------------------------------------------------------------------------

export const DEGREE = 10;
export const P = DEGREE + 1; // number of basis functions (1, x, …, x¹⁰)

export const phi = (x: number): number[] => {
  const out = new Array<number>(P);
  let p = 1;
  for (let j = 0; j < P; j++) {
    out[j] = p;
    p *= x;
  }
  return out;
};

/** Gaussian elimination with partial pivoting — solves A w = b in place. */
function solve(Ain: number[][], bin: number[]): number[] {
  const n = bin.length;
  const A = Ain.map((row) => row.slice());
  const b = bin.slice();
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    }
    if (piv !== col) {
      const tr = A[col];
      A[col] = A[piv];
      A[piv] = tr;
      const tb = b[col];
      b[col] = b[piv];
      b[piv] = tb;
    }
    const d = A[col][col];
    for (let r = col + 1; r < n; r++) {
      const m = A[r][col] / d;
      if (m === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= m * A[col][c];
      b[r] -= m * b[col];
    }
  }
  const w = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * w[c];
    w[r] = s / A[r][r];
  }
  return w;
}

/** Fit ridge on a feature subset: (XᵀX + λI) w = Xᵀy over the kept columns. */
function ridgeFit(lambda: number, keep?: boolean[]): number[] {
  const cols: number[] = [];
  for (let j = 0; j < P; j++) if (!keep || keep[j]) cols.push(j);
  const k = cols.length;
  const A: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const b = new Array<number>(k).fill(0);
  for (let i = 0; i < TRAIN_X.length; i++) {
    const f = phi(TRAIN_X[i]);
    for (let a = 0; a < k; a++) {
      b[a] += f[cols[a]] * TRAIN_Y[i];
      for (let c = 0; c < k; c++) A[a][c] += f[cols[a]] * f[cols[c]];
    }
  }
  for (let a = 0; a < k; a++) A[a][a] += lambda;
  const wk = solve(A, b);
  const w = new Array<number>(P).fill(0);
  for (let a = 0; a < k; a++) w[cols[a]] = wk[a];
  return w;
}

export const evalPoly = (w: readonly number[], x: number): number => {
  let s = 0;
  let p = 1;
  for (let j = 0; j < P; j++) {
    s += w[j] * p;
    p *= x;
  }
  return s;
};

function mse(w: readonly number[], xs: readonly number[], ys: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const e = evalPoly(w, xs[i]) - ys[i];
    s += e * e;
  }
  return s / xs.length;
}

// ---------------------------------------------------------------------------
// The λ sweep — index 0 is the unpenalized fit, then log-spaced 1e-6 … 1e3
// ---------------------------------------------------------------------------

export const K = 61;
export const LOG_LAM_MIN = -6;
export const LOG_LAM_MAX = 3;
export const LAMBDAS: number[] = Array.from({ length: K }, (_, k) =>
  k === 0 ? 0 : 10 ** (LOG_LAM_MIN + ((LOG_LAM_MAX - LOG_LAM_MIN) * (k - 1)) / (K - 2)),
);

export const WEIGHTS: number[][] = LAMBDAS.map((l) => ridgeFit(l));
export const TRAIN_MSE: number[] = WEIGHTS.map((w) => mse(w, TRAIN_X, TRAIN_Y));
export const TEST_MSE: number[] = WEIGHTS.map((w) => mse(w, TEST_X, TEST_Y));

/** Largest coefficient magnitude anywhere in the sweep — bar-chart normalizer. */
export const MAX_ABS_W: number = Math.max(...WEIGHTS.map((w) => Math.max(...w.map(Math.abs))));

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Weights at sweep progress u ∈ [0,1] — fractional lerp between real fits. */
export function weightsAt(u: number): number[] {
  const f = clamp01(u) * (K - 1);
  const i = Math.floor(f);
  if (i >= K - 1) return WEIGHTS[K - 1];
  const t = f - i;
  return WEIGHTS[i].map((w, j) => w + (WEIGHTS[i + 1][j] - w) * t);
}

/** Test error at sweep progress u — fractional lerp (for the tracking dot). */
export function testMseAt(u: number): number {
  const f = clamp01(u) * (K - 1);
  const i = Math.floor(f);
  if (i >= K - 1) return TEST_MSE[K - 1];
  return TEST_MSE[i] + (TEST_MSE[i + 1] - TEST_MSE[i]) * (f - i);
}

/** log₁₀ λ at sweep progress u (clamped to the plotted range for u near 0). */
export function logLamAt(u: number): number {
  const f = clamp01(u) * (K - 1);
  const k = Math.max(1, f);
  return LOG_LAM_MIN + ((LOG_LAM_MAX - LOG_LAM_MIN) * (k - 1)) / (K - 2);
}

/** The sweet spot: argmin of test error over the sweep. */
export const BEST_K: number = TEST_MSE.reduce((best, v, k) => (v < TEST_MSE[best] ? k : best), 0);
export const U_BEST: number = BEST_K / (K - 1);
export const LAMBDA_BEST: number = LAMBDAS[BEST_K];
export const BEST_TEST_MSE: number = TEST_MSE[BEST_K];
/** Pretty strings, computed once (they go on screen, never in captions). */
export const LAMBDA_BEST_STR: string = LAMBDA_BEST.toPrecision(2);
export const BEST_MSE_STR: string = BEST_TEST_MSE.toPrecision(2);

// sweep progress landmarks used by the timeline
export const U_LAM_1: number = (1 + ((0 - LOG_LAM_MIN) / (LOG_LAM_MAX - LOG_LAM_MIN)) * (K - 2)) / (K - 1);

// ---------------------------------------------------------------------------
// Dropout as an ensemble — 8 real sub-fits on seeded random basis subsets
// ---------------------------------------------------------------------------

export const N_SUB = 8;
const maskRand = mulberry32(5);
export const MASKS: boolean[][] = Array.from({ length: N_SUB }, () => {
  const keep = new Array<boolean>(P).fill(false);
  keep[0] = true; // the constant term always survives
  let kept = 0;
  for (let j = 1; j < P; j++) {
    if (maskRand() < 0.5) {
      keep[j] = true;
      kept++;
    }
  }
  if (kept < 3) {
    keep[1] = true;
    keep[3] = true;
    keep[5] = true;
  }
  return keep;
});

// tiny λ keeps the masked normal equations well-conditioned; these are
// otherwise plain least-squares fits on the surviving basis functions.
export const SUB_W: number[][] = MASKS.map((m) => ridgeFit(1e-8, m));

/** The ensemble's pointwise average — the actual mean of the 8 sub-fits. */
export const avgSubY = (x: number): number => {
  let s = 0;
  for (let i = 0; i < N_SUB; i++) s += evalPoly(SUB_W[i], x);
  return s / N_SUB;
};

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

export const X_MAIN: ScaleLinear<number, number> = scaleLinear().domain([-1.08, 1.08]).range([80, 770]);
// the unpenalized fit spikes to y ≈ 5 — the render clips it to the plot box,
// so the wild excursion reads as "off the chart" without swallowing the stage
export const Y_MAIN: ScaleLinear<number, number> = scaleLinear().domain([-2.5, 2.9]).range([600, 108]);

// the right panel is shared: first the coefficient bars, then the U-curve
export const PANEL_X0 = 812;
export const PANEL_Y0 = 108;
export const PANEL_W = 428;
export const PANEL_H = 396;

export const X_UCURVE: ScaleLinear<number, number> = scaleLinear()
  .domain([LOG_LAM_MIN, LOG_LAM_MAX])
  .range([PANEL_X0 + 52, PANEL_X0 + PANEL_W - 26]);
export const Y_UCURVE: ScaleLinear<number, number> = scaleLinear()
  .domain([
    Math.log10(Math.min(...TEST_MSE)) - 0.12,
    Math.log10(Math.max(...TEST_MSE.slice(1))) + 0.12,
  ])
  .range([PANEL_Y0 + PANEL_H - 44, PANEL_Y0 + 46]);

/** Test error vs log λ, as a function for the FunctionPlot (log–log). */
export const uCurveF = (logLam: number): number => {
  const k = 1 + ((logLam - LOG_LAM_MIN) / (LOG_LAM_MAX - LOG_LAM_MIN)) * (K - 2);
  const i = Math.max(1, Math.min(K - 1, Math.floor(k)));
  const j = Math.min(K - 1, i + 1);
  const t = clamp01(k - i);
  return Math.log10(TEST_MSE[i] + (TEST_MSE[j] - TEST_MSE[i]) * t);
};

/** Coefficient bar height 0..1 — log-compressed so the collapse stays visible. */
export const barH = (w: number): number => Math.log10(1 + Math.abs(w)) / Math.log10(1 + MAX_ABS_W);

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export const CAM_PUSH: CameraState = { x: 610, y: 350, k: 1.06 };
export const CAM_PLOT: CameraState = { x: 560, y: 352, k: 1.1 };
export const CAM_WIDE: CameraState = { x: 640, y: 358, k: 0.97 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  dataU: ChannelRef<number>;
  fitU: ChannelRef<number>;
  fitOp: ChannelRef<number>;
  lambdaU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  penTexU: ChannelRef<number>;
  lamTagU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  dotU: ChannelRef<number>;
  sweetU: ChannelRef<number>;
  subU: ChannelRef<number>;
  subOp: ChannelRef<number>;
  avgU: ChannelRef<number>;
  truthU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const axesU = tl.channel('axesU', 0);
  const dataU = tl.channel('dataU', 0);
  const fitU = tl.channel('fitU', 0); // draw-on of the ridge curve
  const fitOp = tl.channel('fitOp', 1); // its opacity (faded for the finale)
  const lambdaU = tl.channel('lambdaU', 0); // sweep progress: 0 = unpenalized
  const barsU = tl.channel('barsU', 0);
  const penTexU = tl.channel('penTexU', 0);
  const lamTagU = tl.channel('lamTagU', 0);
  const panelU = tl.channel('panelU', 0);
  const curveU = tl.channel('curveU', 0);
  const dotU = tl.channel('dotU', 0);
  const sweetU = tl.channel('sweetU', 0);
  const subU = tl.channel('subU', 0); // staggered entrance of the 8 sub-fits
  const subOp = tl.channel('subOp', 1);
  const avgU = tl.channel('avgU', 0);
  const truthU = tl.channel('truthU', 0);

  // — Beat 1 · the trap, replayed on fresh data ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: 'A fresh batch of noisy points, and the same trap as last time: a tenth degree polynomial with nothing holding it back.',
  });
  tl.tween(axesU, 1, { at: 0.4, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_PUSH, { at: 0.6, dur: 2.2, ease: ease.move });
  tl.tween(dataU, 1, { at: 1.2, dur: 1.8, ease: ease.enter });
  tl.tween(fitU, 1, { at: 4.2, dur: 1.6, ease: ease.draw });

  tl.caption({
    at: 8.4,
    dur: 6.6,
    text: 'It threads every training point, and look at what that costs: the coefficients it needs are enormous. Perfect memory, terrible judgment.',
  });
  tl.tween(barsU, 1, { at: 8.7, dur: 1.4, ease: ease.enter });
  tl.hold(15.0, 0.8);

  // — Beat 2 · the weight penalty ———————————————————————————————————————
  tl.caption({
    at: 15.8,
    dur: 7.0,
    text: 'So charge a price for complexity. Add a weight penalty to the loss: the training error, plus lambda times the squared size of the weights.',
    tex: 'L \\;=\\; \\mathrm{MSE} \\;+\\; \\lambda\\,\\lVert w\\rVert^2',
  });
  tl.tween(penTexU, 1, { at: 16.2, dur: 0.8, ease: ease.enter });
  tl.tween(lamTagU, 1, { at: 17.0, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 23.4,
    dur: 6.8,
    text: 'Now turn lambda up. Every curve you see is a genuine fit: for each lambda we solve the penalized equations and draw exactly what comes out.',
  });
  tl.tween(cam, CAM_PLOT, { at: 23.6, dur: 1.4, ease: ease.move });
  tl.tween(lambdaU, U_LAM_1 * 0.92, { at: 24.0, dur: 6.0, ease: ease.linear });

  tl.caption({
    at: 30.8,
    dur: 6.6,
    text: 'And watch the bars. As lambda grows, the same coefficients shrink in lockstep, and the wiggles in the curve die with them.',
  });
  tl.tween(lambdaU, U_LAM_1, { at: 31.4, dur: 3.6, ease: ease.linear });
  tl.hold(37.4, 0.6);

  // — Beat 3 · too much of a good thing, and the U-curve ————————————————————
  tl.caption({
    at: 38.0,
    dur: 6.6,
    text: 'But push lambda too far and the price is ruinous. The curve flattens out and stops listening to the data at all. That is underfitting.',
  });
  tl.tween(lambdaU, 1, { at: 38.4, dur: 4.6, ease: ease.linear });

  tl.caption({
    at: 45.2,
    dur: 6.4,
    text: 'So there is a tradeoff. Plot the error on held out points against lambda, and a valley appears: too little penalty on the left, too much on the right.',
  });
  tl.tween(barsU, 0, { at: 44.8, dur: 0.8, ease: ease.move });
  tl.tween(panelU, 1, { at: 45.4, dur: 0.8, ease: ease.enter });
  tl.tween(curveU, 1, { at: 46.0, dur: 2.8, ease: ease.draw });
  tl.tween(dotU, 1, { at: 48.6, dur: 0.6, ease: ease.enter });

  tl.caption({
    at: 52.2,
    dur: 6.6,
    text: 'The sweet spot sits partway up: enough penalty to silence the noise, not enough to erase the signal. We pay a little on the training points and win everywhere else.',
  });
  tl.tween(lambdaU, U_BEST, { at: 52.8, dur: 2.2, ease: ease.move });
  tl.tween(sweetU, 1, { at: 55.2, dur: 0.7, ease: ease.pop });
  tl.hold(58.8, 0.8);

  // — Beat 4 · dropout as an ensemble ———————————————————————————————————
  tl.caption({
    at: 59.6,
    dur: 6.8,
    text: 'There is a stranger way to buy the same insurance. Instead of shrinking every weight, randomly silence some of the building blocks entirely.',
  });
  tl.tween(panelU, 0.12, { at: 60.0, dur: 1.0, ease: ease.move });
  tl.tween(dotU, 0, { at: 60.0, dur: 0.8, ease: ease.move });
  tl.tween(sweetU, 0, { at: 60.0, dur: 0.8, ease: ease.move });
  tl.tween(fitOp, 0.12, { at: 60.4, dur: 1.0, ease: ease.move });
  tl.tween(penTexU, 0.15, { at: 60.4, dur: 1.0, ease: ease.move });
  tl.tween(lamTagU, 0, { at: 60.4, dur: 0.8, ease: ease.move });

  tl.caption({
    at: 66.8,
    dur: 7.4,
    text: 'Each of these eight curves is a real fit that only got to use a random subset of the polynomial terms. On its own, every one of them is crooked.',
  });
  tl.tween(subU, 1, { at: 67.2, dur: 3.4, ease: ease.enter });

  tl.caption({
    at: 74.8,
    dur: 7.0,
    text: 'But average them, and their private mistakes cancel. The mean of the ensemble hugs the true curve better than any single member does.',
  });
  tl.tween(subOp, 0.3, { at: 75.6, dur: 1.2, ease: ease.move });
  tl.tween(avgU, 1, { at: 75.4, dur: 1.6, ease: ease.draw });
  tl.tween(truthU, 1, { at: 77.6, dur: 1.2, ease: ease.draw });

  tl.caption({
    at: 82.4,
    dur: 6.4,
    text: 'That is dropout in spirit: train a crowd of crippled models that share their weights, and let the crowd itself be the regularizer.',
  });
  tl.hold(88.8, 0.4);

  // — Beat 5 · the recap ————————————————————————————————————————————————
  tl.caption({
    at: 89.2,
    dur: 7.4,
    text: 'Either way, regularization is the same bargain. Accept a slightly worse fit on the data you have, and buy accuracy on the data you have never seen.',
  });
  tl.tween(cam, CAM_WIDE, { at: 89.4, dur: 1.8, ease: ease.move });
  tl.tween(subOp, 0.1, { at: 89.4, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 0, { at: 89.4, dur: 1.2, ease: ease.move });
  tl.tween(fitOp, 0.7, { at: 90.2, dur: 1.4, ease: ease.move });
  tl.hold(96.6, 1.2);

  return {
    tl,
    cam,
    axesU,
    dataU,
    fitU,
    fitOp,
    lambdaU,
    barsU,
    penTexU,
    lamTagU,
    panelU,
    curveU,
    dotU,
    sweetU,
    subU,
    subOp,
    avgU,
    truthU,
  };
}
