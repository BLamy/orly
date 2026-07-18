import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Overfitting — memorizing vs learning.
 *
 * All math lives here, at module scope: a smooth true function, seeded noisy
 * train/test samples, and REAL least-squares polynomial fits of degree 1..11
 * (normal equations with a tiny ridge epsilon, solved by our own Gaussian
 * elimination with partial pivoting). The scene morphs through the actual
 * fitted curves and plots the actual train/test errors — nothing is faked.
 *
 * Empirically (seed 7): train error falls 0.081 → 0.00003 as degree rises;
 * test error makes the U — 0.081 → 0.022 at degree 3 (the argmin) → 1.80 at
 * degree 11, whose curve swings out to |f| ≈ 17.7 between the training points.
 */

// ---------------------------------------------------------------------------
// The hidden truth and the seeded samples
// ---------------------------------------------------------------------------

export const TRUE_F = (x: number): number => 0.65 * Math.sin(2.6 * x) + 0.25 * x;

const NOISE = 0.13;
const rand = mulberry32(7);
const gauss = gaussian(rand);

export const N_TRAIN = 12;
export const trainX: number[] = [];
export const trainY: number[] = [];
for (let i = 0; i < N_TRAIN; i++) {
  const x = -0.95 + (1.9 * i) / (N_TRAIN - 1) + 0.05 * (rand() - 0.5);
  trainX.push(x);
  trainY.push(TRUE_F(x) + NOISE * gauss());
}

export const N_TEST = 10;
export const testX: number[] = [];
export const testY: number[] = [];
for (let i = 0; i < N_TEST; i++) {
  const x = -0.88 + (1.76 * i) / (N_TEST - 1) + 0.08 * (rand() - 0.5);
  testX.push(x);
  testY.push(TRUE_F(x) + NOISE * gauss());
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

const RIDGE_EPS = 1e-9; // numerical stability only — degree 11 still interpolates

/** Fit a degree-d polynomial to the training set: (XᵀX + εI) c = Xᵀy. */
function fitPoly(deg: number): number[] {
  const m = deg + 1;
  const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  const b = new Array<number>(m).fill(0);
  for (let i = 0; i < trainX.length; i++) {
    const pows = [1];
    for (let p = 1; p <= deg; p++) pows.push(pows[p - 1] * trainX[i]);
    for (let r = 0; r < m; r++) {
      b[r] += pows[r] * trainY[i];
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

const meanSqError = (c: readonly number[], xs: readonly number[], ys: readonly number[]): number =>
  xs.reduce((s, x, i) => s + (evalPoly(c, x) - ys[i]) ** 2, 0) / xs.length;

export const MAX_DEG = 11;
export const FITS: number[][] = []; // FITS[d] = coefficients of the degree-d fit, d = 1..11
export const TRAIN_MSE: number[] = [];
export const TEST_MSE: number[] = [];
FITS.push([]); // pad index 0 so FITS[d] is the degree-d fit
TRAIN_MSE.push(NaN);
TEST_MSE.push(NaN);
for (let d = 1; d <= MAX_DEG; d++) {
  const c = fitPoly(d);
  FITS.push(c);
  TRAIN_MSE.push(meanSqError(c, trainX, trainY));
  TEST_MSE.push(meanSqError(c, testX, testY));
}

/** The sweet spot: argmin of the real test error (degree 3 with this seed). */
export const BEST_DEG: number = (() => {
  let best = 1;
  for (let d = 2; d <= MAX_DEG; d++) if (TEST_MSE[d] < TEST_MSE[best]) best = d;
  return best;
})();

/** Fitted-curve value at a *fractional* degree — pointwise lerp between fits. */
export function fitAt(degF: number, x: number): number {
  const f = Math.max(1, Math.min(MAX_DEG, degF));
  const lo = Math.floor(f);
  if (lo >= MAX_DEG) return evalPoly(FITS[MAX_DEG], x);
  const t = f - lo;
  return (1 - t) * evalPoly(FITS[lo], x) + t * evalPoly(FITS[lo + 1], x);
}

/** log10 error at a fractional degree — the panel curves. */
function logErrAt(hist: readonly number[], degF: number): number {
  const f = Math.max(1, Math.min(MAX_DEG, degF));
  const lo = Math.floor(f);
  const lg = (d: number) => Math.log10(hist[d]);
  if (lo >= MAX_DEG) return lg(MAX_DEG);
  const t = f - lo;
  return (1 - t) * lg(lo) + t * lg(lo + 1);
}
export const trainLogErr = (degF: number): number => logErrAt(TRAIN_MSE, degF);
export const testLogErr = (degF: number): number => logErrAt(TEST_MSE, degF);

// ---------------------------------------------------------------------------
// Stage mapping — main plot on the left ~65%, error panel on the right
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.05, 1.05])
  .range([100, 830]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.35, 1.35])
  .range([620, 90]);

// soft clamp so the degree-11 swings slam the frame edges instead of leaving
export const CLIP_Y = 1.32;
export const clipped = (v: number): number => Math.max(-CLIP_Y, Math.min(CLIP_Y, v));

// error panel (screen space, right side — appears for the U-curve payoff)
export const PANEL_X = 878;
export const PANEL_Y = 96;
export const PANEL_W = 386;
export const PANEL_H = 512;
export const xDeg: ScaleLinear<number, number> = scaleLinear()
  .domain([1, MAX_DEG])
  .range([PANEL_X + 52, PANEL_X + PANEL_W - 30]);
export const yErr: ScaleLinear<number, number> = scaleLinear()
  .domain([-4.8, 0.5]) // log10 mean squared error (train min ~1e-4.5, test max ~1.8)
  .range([PANEL_Y + 462, PANEL_Y + 128]);

// camera keyframes
export const CAM_PUSH: CameraState = { x: xScale(0.62), y: yScale(-0.15), k: 1.75 };
export const CAM_WIDE: CameraState = { ...CAMERA_HOME };

// stage constants re-exported for the render
export { STAGE_H, STAGE_W };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  ptsU: ChannelRef<number>;
  truthU: ChannelRef<number>;
  fitU: ChannelRef<number>;
  degF: ChannelRef<number>;
  degLabelU: ChannelRef<number>;
  errReadU: ChannelRef<number>;
  testU: ChannelRef<number>;
  missU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  trainCurveU: ChannelRef<number>;
  testCurveU: ChannelRef<number>;
  sweetU: ChannelRef<number>;
  mainDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const axesU = tl.channel('axesU', 0);
  const ptsU = tl.channel('ptsU', 0); // staggered entrance of the train points
  const truthU = tl.channel('truthU', 0); // the hidden true function (dashed ghost)
  const fitU = tl.channel('fitU', 0); // fitted-curve draw-on
  const degF = tl.channel('degF', 1); // the degree dial (fractional — morphs fits)
  const degLabelU = tl.channel('degLabelU', 0);
  const errReadU = tl.channel('errReadU', 0); // live train-error readout
  const testU = tl.channel('testU', 0); // held-out points drop in
  const missU = tl.channel('missU', 0); // residual whiskers to the test points
  const panelU = tl.channel('panelU', 0);
  const trainCurveU = tl.channel('trainCurveU', 0);
  const testCurveU = tl.channel('testCurveU', 0);
  const sweetU = tl.channel('sweetU', 0);
  const mainDim = tl.channel('mainDim', 1); // whole-stage dim for the clean ending
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the noisy points and the hidden truth ————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Twelve noisy measurements. Underneath them is a smooth truth, drawn here as a ghost — in real life, you never get to see it.',
  });
  tl.tween(axesU, 1, { at: 0.4, dur: 1.3, ease: ease.draw });
  tl.tween(ptsU, 1, { at: 1.0, dur: 1.6, ease: ease.enter });
  tl.tween(truthU, 1, { at: 3.4, dur: 1.5, ease: ease.draw });
  tl.hold(6.7, 0.8);

  // — Beat 2 · degree 1: underfitting ————————————————————————————————————
  tl.caption({
    at: 7.5,
    dur: 6.0,
    text: 'Start humble and fit a straight line, chosen by least squares. It is too stiff to bend with the data at all — this is underfitting.',
    tex: '\\deg = 1',
  });
  tl.tween(fitU, 1, { at: 7.8, dur: 1.4, ease: ease.draw });
  tl.tween(degLabelU, 1, { at: 8.6, dur: 0.6, ease: ease.enter });
  tl.tween(errReadU, 1, { at: 9.4, dur: 0.6, ease: ease.enter });
  tl.hold(13.5, 0.7);

  // — Beat 3 · turning the dial to degree 3 ——————————————————————————————
  tl.caption({
    at: 14.2,
    dur: 6.2,
    text: 'Now turn the degree dial. Each notch refits the polynomial from scratch, and around degree three the curve relaxes into the shape of the data.',
  });
  tl.tween(degF, 3, { at: 14.8, dur: 2.6, ease: ease.move });
  tl.hold(20.4, 0.6);

  // — Beat 4 · degree 11 threads every point —————————————————————————————
  tl.caption({
    at: 21.0,
    dur: 6.6,
    text: 'Keep cranking. By degree eleven the curve threads every training point exactly, and the training error collapses to almost nothing.',
  });
  tl.tween(degF, MAX_DEG, { at: 21.5, dur: 3.8, ease: ease.move });
  tl.tween(truthU, 0.18, { at: 21.5, dur: 2.0, ease: ease.move });
  tl.hold(27.6, 0.4);

  // — Beat 5 · push in on the wild oscillation ———————————————————————————
  tl.caption({
    at: 28.0,
    dur: 6.4,
    text: 'But look between the points. To hit every measurement, the curve whips into wild swings that the truth never made.',
  });
  tl.tween(cam, CAM_PUSH, { at: 28.2, dur: 1.5, ease: ease.move });
  tl.hold(34.4, 0.8);

  // — Beat 6 · the twist: the held-out exam ——————————————————————————————
  tl.caption({
    at: 35.2,
    dur: 6.0,
    text: 'Now for the exam. Here are fresh measurements from the very same truth — points this curve has never seen.',
  });
  tl.tween(cam, CAM_WIDE, { at: 35.3, dur: 1.4, ease: ease.move });
  tl.tween(testU, 1, { at: 36.6, dur: 1.6, ease: ease.enter });
  tl.hold(41.2, 0.6);

  tl.caption({
    at: 41.8,
    dur: 6.4,
    text: 'The flexible champion misses them badly. It never learned the underlying shape — it memorized the noise in one particular sample.',
  });
  tl.tween(missU, 1, { at: 42.4, dur: 1.2, ease: ease.enter });
  tl.hold(48.2, 0.7);

  // — Beat 7 · the U-curve panel ——————————————————————————————————————————
  tl.caption({
    at: 48.9,
    dur: 6.6,
    text: 'So measure it properly. For every degree from one to eleven, refit and record two numbers: the error on the training points, and the error on the held out points.',
  });
  tl.tween(panelU, 1, { at: 50.2, dur: 0.9, ease: ease.enter });
  tl.tween(errReadU, 0, { at: 49.6, dur: 0.7, ease: ease.move });
  tl.hold(55.5, 0.5);

  tl.caption({
    at: 56.0,
    dur: 5.8,
    text: 'Training error only ever falls. More flexibility always fits the past better, so that number can never warn you.',
  });
  tl.tween(trainCurveU, 1, { at: 56.4, dur: 1.6, ease: ease.draw });
  tl.hold(61.8, 0.5);

  tl.caption({
    at: 62.3,
    dur: 6.6,
    text: 'Test error tells the real story. It falls, bottoms out, then climbs as the model starts memorizing. That U shape is overfitting, measured.',
  });
  tl.tween(testCurveU, 1, { at: 62.7, dur: 1.6, ease: ease.draw });
  tl.hold(68.9, 0.5);

  // — Beat 8 · the sweet spot ————————————————————————————————————————————
  tl.caption({
    at: 69.4,
    dur: 6.4,
    text: 'The bottom of the U is the sweet spot — degree three here: flexible enough to learn the shape, too stiff to memorize the noise.',
  });
  tl.tween(sweetU, 1, { at: 69.9, dur: 0.5, ease: ease.pop });
  tl.tween(degF, BEST_DEG, { at: 70.6, dur: 2.2, ease: ease.move });
  tl.tween(missU, 0, { at: 70.4, dur: 1.0, ease: ease.move });
  tl.tween(truthU, 0.8, { at: 71.6, dur: 1.2, ease: ease.move });
  tl.hold(75.8, 0.8);

  // — Beat 9 · recap, clean ending ———————————————————————————————————————
  tl.tween(mainDim, 0.13, { at: 76.6, dur: 1.3, ease: ease.move });
  tl.tween(panelU, 0.13, { at: 76.6, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 77.4,
    dur: 7.0,
    text: 'That is the whole lesson. Fitting the data you have is easy — the real test is the data you will meet.',
  });
  tl.tween(closeU, 1, { at: 78.0, dur: 0.9, ease: ease.enter });
  tl.hold(84.4, 1.2);

  return {
    tl,
    cam,
    axesU,
    ptsU,
    truthU,
    fitU,
    degF,
    degLabelU,
    errReadU,
    testU,
    missU,
    panelU,
    trainCurveU,
    testCurveU,
    sweetU,
    mainDim,
    closeU,
  };
}
