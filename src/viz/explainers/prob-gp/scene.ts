import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Gaussian Process — a distribution over curves.
 *
 * Everything on stage is a real Gaussian process computed at module scope:
 * an RBF kernel (ℓ = 0.5), three prior samples drawn via Cholesky on an
 * 80-point grid, six noisy observations of sin(1.5x), and the exact
 * posterior mean, standard deviation, and two posterior samples from the
 * closed-form conditioning equations. The narration's anchor: the band's
 * width at an observation vs mid-gap (SD_OBS vs SD_GAP, roughly a factor
 * of ten).
 */

export const TRUE_F = (x: number): number => Math.sin(1.5 * x);
export const ELL = 0.5;
export const NOISE_VAR = 0.005;
export const kern = (a: number, b: number): number =>
  Math.exp(-((a - b) ** 2) / (2 * ELL * ELL));

export const XO: number[] = [0.4, 1.0, 1.5, 2.9, 3.4, 3.8];
export const YO: number[] = (() => {
  const rand = mulberry32(11);
  const g = gaussian(rand);
  return XO.map((x) => TRUE_F(x) + 0.05 * g());
})();
export const NOBS = XO.length;

export const GRID_N = 80;
export const GRID: number[] = Array.from({ length: GRID_N }, (_, i) => (4 * i) / (GRID_N - 1));

/** solve M z = b by Gauss-Jordan (M small) */
function solve(M: number[][], b: number[]): number[] {
  const m = M.length;
  const A = M.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < m; i++) {
    let piv = i;
    for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
    [A[i], A[piv]] = [A[piv], A[i]];
    for (let r = 0; r < m; r++) {
      if (r === i) continue;
      const mu = A[r][i] / A[i][i];
      for (let c = i; c <= m; c++) A[r][c] -= mu * A[i][c];
    }
  }
  return A.map((r, i) => r[m] / A[i][i]);
}

/** lower-triangular Cholesky with jitter */
function chol(M: number[][]): number[][] {
  const n = M.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = M[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) L[i][j] = Math.sqrt(Math.max(1e-10, s + 1e-8));
      else L[i][j] = s / L[j][j];
    }
  }
  return L;
}

const K_OBS: number[][] = XO.map((a) => XO.map((b) => kern(a, b) + (a === b ? NOISE_VAR : 0)));
const ALPHA: number[] = solve(K_OBS, YO);

export const POST_MEAN: number[] = GRID.map((x) =>
  XO.reduce((s, a, i) => s + kern(a, x) * ALPHA[i], 0),
);
export const POST_SD: number[] = GRID.map((x) => {
  const ks = XO.map((a) => kern(a, x));
  const v = solve(K_OBS, ks);
  return Math.sqrt(Math.max(0, kern(x, x) - ks.reduce((s, kv, i) => s + kv * v[i], 0)));
});

/** posterior covariance on the grid → Cholesky → deterministic samples */
const POST_COV: number[][] = GRID.map((x, i) =>
  GRID.map((y, j) => {
    const kx = XO.map((a) => kern(a, x));
    const vy = solve(K_OBS, XO.map((a) => kern(a, y)));
    return kern(x, y) - kx.reduce((s, kv, t) => s + kv * vy[t], 0);
  }),
);
const L_POST = chol(POST_COV);
const PRIOR_COV: number[][] = GRID.map((x) => GRID.map((y) => kern(x, y)));
const L_PRIOR = chol(PRIOR_COV);

function drawSample(L: number[][], mean: number[], seed: number): number[] {
  const g = gaussian(mulberry32(seed));
  const z = GRID.map(() => g());
  return GRID.map((_, i) => {
    let s = mean[i];
    for (let k = 0; k <= i; k++) s += L[i][k] * z[k];
    return s;
  });
}
export const PRIOR_SAMPLES: number[][] = [31, 47, 59].map((sd) =>
  drawSample(L_PRIOR, new Array(GRID_N).fill(0), sd),
);
export const POST_SAMPLES: number[][] = [71, 83].map((sd) => drawSample(L_POST, POST_MEAN, sd));

/** the narration anchors */
const nearestIdx = (x: number) => Math.round((x / 4) * (GRID_N - 1));
export const SD_OBS: number = POST_SD[nearestIdx(1.0)]; // ≈ 0.07
export const SD_GAP: number = POST_SD[nearestIdx(2.2)]; // ≈ 0.78

/** grid lookup helpers (pure) for plotting as functions of x */
export function gridF(vals: number[]): (x: number) => number {
  return (x: number) => {
    const f = Math.max(0, Math.min(GRID_N - 1, (x / 4) * (GRID_N - 1)));
    const i = Math.floor(f);
    if (i >= GRID_N - 1) return vals[GRID_N - 1];
    return vals[i] + (vals[i + 1] - vals[i]) * (f - i);
  };
}

export const sx: ScaleLinear<number, number> = scaleLinear().domain([0, 4]).range([110, 1170]);
export const sy: ScaleLinear<number, number> = scaleLinear().domain([-2.6, 2.6]).range([620, 100]);

export const CAM_MID: CameraState = { x: 640, y: 350, k: 1.15 };
export const CAM_GAP: CameraState = { x: sx(2.2), y: 360, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  priorP: ChannelRef<number>;
  kernU: ChannelRef<number>;
  obsP: ChannelRef<number>;
  priorFade: ChannelRef<number>;
  meanU: ChannelRef<number>;
  bandU: ChannelRef<number>;
  pinchU: ChannelRef<number>;
  sampP: ChannelRef<number>;
  costU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const priorP = tl.channel('priorP', 0);
  const kernU = tl.channel('kernU', 0);
  const obsP = tl.channel('obsP', 0);
  const priorFade = tl.channel('priorFade', 1);
  const meanU = tl.channel('meanU', 0);
  const bandU = tl.channel('bandU', 0);
  const pinchU = tl.channel('pinchU', 0);
  const sampP = tl.channel('sampP', 0);
  const costU = tl.channel('costU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a distribution over curves ———————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Last chapter we doubted one curve at a time. A Gaussian process is bolder: it puts a probability distribution over every curve at once.',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_MID, { at: 0.9, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'Before seeing any data, here are three curves drawn at random from that distribution. Smooth, wavy, wandering — but all plausible.',
  });
  tl.tween(priorP, 1, { at: 6.9, dur: 3.4, ease: ease.draw });

  tl.caption({
    at: 12.7,
    dur: 6.0,
    text: 'One choice defines the whole prior: the kernel, which says how strongly two nearby inputs must agree. Its length scale sets how fast curves may wiggle.',
    tex: "k(x, x') = \\exp\\!\\left(-\\tfrac{(x-x')^2}{2\\ell^2}\\right)",
  });
  tl.tween(kernU, 1, { at: 13.3, dur: 0.9, ease: ease.enter });
  tl.hold(18.7, 0.5);

  // — Beat 2 · condition on data ————————————————————————————————————————
  tl.caption({
    at: 19.2,
    dur: 5.6,
    text: 'Now observe six data points. Conditioning a Gaussian on evidence is pure linear algebra — no training loop, just a formula.',
  });
  tl.tween(obsP, 1, { at: 19.8, dur: 2.4, ease: ease.enter });
  tl.tween(priorFade, 0.12, { at: 21.6, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 25.2,
    dur: 5.6,
    text: 'Out comes the posterior: a mean curve that threads every observation, and a band of standard deviation around it — computed exactly, not estimated.',
  });
  tl.tween(meanU, 1, { at: 25.6, dur: 1.8, ease: ease.draw });
  tl.tween(bandU, 1, { at: 26.8, dur: 1.8, ease: ease.enter });

  tl.caption({
    at: 31.2,
    dur: 6.2,
    text: 'Read the band like a confession. At each data point it pinches nearly shut. In the unobserved middle it balloons to roughly ten times that width.',
  });
  tl.tween(cam, CAM_GAP, { at: 31.6, dur: 1.8, ease: ease.move });
  tl.tween(pinchU, 1, { at: 32.4, dur: 0.9, ease: ease.enter });
  tl.hold(37.4, 0.5);

  // — Beat 3 · posterior samples ————————————————————————————————————————
  tl.caption({
    at: 37.9,
    dur: 5.8,
    text: 'And you can still draw whole curves from the posterior. Every sample threads the data faithfully, then invents its own story across the gap.',
  });
  tl.tween(cam, CAM_MID, { at: 38.3, dur: 1.8, ease: ease.move });
  tl.tween(pinchU, 0, { at: 38.3, dur: 0.7, ease: ease.move });
  tl.tween(sampP, 1, { at: 38.9, dur: 2.8, ease: ease.draw });

  tl.caption({
    at: 44.1,
    dur: 5.4,
    text: 'This is epistemic uncertainty made exact: where the ensemble approximated the fan with twelve refits, the Gaussian process states it in closed form.',
  });

  // — Beat 4 · the price ————————————————————————————————————————————————
  tl.caption({
    at: 49.9,
    dur: 5.8,
    text: 'The price is on the other end: conditioning inverts a matrix with one row per observation, and that cost grows with the cube of the dataset.',
    tex: '\\mathcal{O}(n^3)',
  });
  tl.tween(costU, 1, { at: 50.5, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 56.1,
    dur: 5.8,
    text: 'Small data, exact doubt — that is the Gaussian process. When the posterior stops having a formula at all, we will have to sample our way in.',
  });
  tl.tween(costU, 0, { at: 60.1, dur: 0.7, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.5, dur: 0.9, ease: ease.enter });
  tl.hold(61.9, 1.4);

  return { tl, cam, axU, priorP, kernU, obsP, priorFade, meanU, bandU, pinchU, sampP, costU, closeU };
}
