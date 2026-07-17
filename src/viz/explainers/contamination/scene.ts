import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Train/Test Contamination — memorization masquerading as skill.
 *
 * Real computation at module scope: a degree-11 polynomial least-squares fit
 * (normal equations, Gaussian elimination) to 12 noisy samples of sin(1.7x).
 * Twelve points, twelve coefficients: the model memorizes its training set —
 * measured train error ~1e-18. A "benchmark" whose questions leaked from the
 * training set scores it perfect; fresh questions from the same distribution
 * measure error 3.74. A degree-3 model that memorizes nothing scores 0.025
 * on train and 0.031 fresh — the honest number is the same everywhere.
 */

const rand = mulberry32(6);
const g = gaussian(rand);
const f = (x: number): number => Math.sin(1.7 * x);

export const XT: number[] = Array.from({ length: 12 }, (_, i) => -2 + (4 * i) / 11);
export const YT: number[] = XT.map((x) => f(x) + 0.15 * g());

function polyfit(X: number[], Y: number[], deg: number): number[] {
  const n = deg + 1;
  const A = X.map((x) => Array.from({ length: n }, (_, k) => x ** k));
  const M = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++)
      for (let p = 0; p < X.length; p++) M[i][j] += A[p][i] * A[p][j];
    for (let p = 0; p < X.length; p++) M[i][n] += A[p][i] * Y[p];
  }
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let rw = c + 1; rw < n; rw++) if (Math.abs(M[rw][c]) > Math.abs(M[piv][c])) piv = rw;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let rw = 0; rw < n; rw++) {
      if (rw === c) continue;
      const k = M[rw][c] / M[c][c];
      for (let j = c; j <= n; j++) M[rw][j] -= k * M[c][j];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

export const evalp = (c: number[], x: number): number => c.reduce((a, ci, i) => a + ci * x ** i, 0);

export const C11 = polyfit(XT, YT, 11); // the memorizer
export const C3 = polyfit(XT, YT, 3); // the honest model

const mse = (X: number[], Y: number[], c: number[]): number =>
  X.reduce((a, x, i) => a + (evalp(c, x) - Y[i]) ** 2, 0) / X.length;

/** Fresh test set — same distribution, never seen. */
const rand2 = mulberry32(55);
const g2 = gaussian(rand2);
export const XF: number[] = Array.from({ length: 24 }, (_, i) => -1.9 + (3.8 * i) / 23);
export const YF: number[] = XF.map((x) => f(x) + 0.15 * g2());

/** The "leaked benchmark": 6 questions copied straight from the train set. */
export const LEAK_IDX: number[] = [0, 2, 4, 6, 8, 10];

export const MSE_TRAIN_11 = mse(XT, YT, C11); // ~4e-19
export const MSE_FRESH_11 = mse(XF, YF, C11); // ~3.74
export const MSE_TRAIN_3 = mse(XT, YT, C3); // ~0.025
export const MSE_FRESH_3 = mse(XF, YF, C3); // ~0.031

export const N_PLOT = 200;
export const X_MIN = -2.05;
export const X_MAX = 2.05;
export const CURVE_11: number[] = Array.from({ length: N_PLOT }, (_, i) =>
  evalp(C11, X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)),
);
export const CURVE_3: number[] = Array.from({ length: N_PLOT }, (_, i) =>
  evalp(C3, X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)),
);

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const PLOT_X0 = 130;
export const PLOT_X1 = 900;
export const PLOT_Y_MID = 330;
export const PLOT_AMP = 120;
export const px = (x: number): number => PLOT_X0 + ((x - X_MIN) / (X_MAX - X_MIN)) * (PLOT_X1 - PLOT_X0);
export const py = (y: number): number => PLOT_Y_MID - Math.max(-2, Math.min(2.2, y)) * PLOT_AMP;

export const CAM_PLOT: CameraState = { x: 540, y: 330, k: 1.15 };
export const CAM_BOARD: CameraState = { x: 720, y: 330, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>; // train points
  fitU: ChannelRef<number>; // memorizer curve draw-on
  leakU: ChannelRef<number>; // leaked-benchmark highlight + scoreboard
  freshU: ChannelRef<number>; // fresh points appear
  honestU: ChannelRef<number>; // degree-3 curve
  boardU: ChannelRef<number>; // the scoreboard
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const fitU = tl.channel('fitU', 0);
  const leakU = tl.channel('leakU', 0);
  const freshU = tl.channel('freshU', 0);
  const honestU = tl.channel('honestU', 0);
  const boardU = tl.channel('boardU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a model that memorizes ——————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'This book is about a hard question: how do you know a model is actually good? Start with the oldest way to be fooled. Here are twelve training examples of a simple pattern.',
  });
  tl.tween(ptsU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 5.6,
    text: 'And here is a model with twelve knobs fit to those twelve points — a polynomial with as many coefficients as examples. It threads every point exactly. Its training error is ten to the minus eighteen.',
  });
  tl.tween(fitU, 1, { at: 6.9, dur: 2.2, ease: ease.draw });
  tl.caption({
    at: 12.3,
    dur: 4.6,
    text: 'Look between the points, though. The wiggles are not the pattern. They are the noise, memorized. This model has learned its homework by heart.',
  });
  tl.hold(17.1, 0.6);

  // — Beat 2 · the leaked benchmark ————————————————————————————————————
  tl.tween(cam, CAM_BOARD, { at: 17.7, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 18.1,
    dur: 5.8,
    text: 'Now we build a benchmark — but six of its questions leaked from the training set. This happens constantly at scale: the test was on the internet, and the internet was the training data.',
  });
  tl.tween(leakU, 1, { at: 18.9, dur: 1.6, ease: ease.enter });
  tl.tween(boardU, 1, { at: 20.3, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 24.1,
    dur: 4.8,
    text: 'Score the memorizer on the leaked benchmark: perfect. Zero error, every question right. The number is real, the arithmetic is correct, and the conclusion is false.',
  });
  tl.hold(29.1, 0.6);

  // — Beat 3 · fresh questions ——————————————————————————————————————————
  tl.caption({
    at: 29.7,
    dur: 5.6,
    text: 'Ask questions the model has never seen — same pattern, new samples — and the mask falls off. Measured error: three point seven. A hundred times worse than the honest model below it.',
  });
  tl.tween(freshU, 1, { at: 30.3, dur: 1.8, ease: ease.enter });
  tl.hold(35.5, 0.6);

  // — Beat 4 · the honest model ————————————————————————————————————————
  tl.caption({
    at: 36.1,
    dur: 5.8,
    text: 'Compare a small model — four knobs — fit to the same data. It cannot memorize, so it is forced to generalize. Train error, zero point zero three. Fresh error, zero point zero three. The same number, everywhere.',
  });
  tl.tween(honestU, 1, { at: 36.7, dur: 2.0, ease: ease.draw });
  tl.caption({
    at: 42.1,
    dur: 5.0,
    text: 'That is the signature to look for. Skill travels to new questions. Memorization does not. A gap between the leaked score and the fresh score is the fingerprint of contamination.',
  });
  tl.hold(47.3, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.5, dur: 1.1, ease: ease.move });
  tl.tween(boardU, 0, { at: 48.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.7,
    dur: 5.8,
    text: 'So the first rule of evaluation: before you admire a score, ask where the questions came from. A perfect mark on questions the model has already read tells you about its memory, not its mind.',
  });
  tl.hold(55.7, 1.2);

  return { tl, cam, ptsU, fitU, leakU, freshU, honestU, boardU, dimU, endU };
}
