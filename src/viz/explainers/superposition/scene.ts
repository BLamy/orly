import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Superposition — more features than neurons.
 *
 * The toy-models-of-superposition setup, actually trained at module scope
 * (seeded, 4000 full gradient steps, batch 128): five features, importances
 * 1.0 down to 0.8, forced through a TWO dimensional bottleneck with a ReLU
 * readout. Verified results: when features are almost always active
 * (density 0.8) the model keeps only the two most important, orthogonal,
 * and sacrifices the rest (norms 0.20, 0.29, 0.07). When features are rare
 * (density 0.05) it keeps ALL FIVE at full norm, packed around the circle
 * roughly seventy two degrees apart — superposition, with interference you
 * can read off the overlap matrix.
 */

const dot = (a: number[], b: number[]): number => a.reduce((s, v, i) => s + v * b[i], 0);

export const NF = 5;
export const IMP = [1, 0.95, 0.9, 0.85, 0.8];
const STEPS = 4000;
const BATCH = 128;
const SNAP_EVERY = Math.floor(STEPS / 10);

export interface Run {
  snaps: number[][][]; // snapshots of W (2 x NF)
  cols: [number, number][]; // final feature embeddings
}

function train(density: number, seed: number): Run {
  const rand = mulberry32(seed);
  const g = gaussian(rand);
  const M = 2;
  const W: number[][] = Array.from({ length: M }, () => Array.from({ length: NF }, () => g() * 0.3));
  const bOut = new Array(NF).fill(0);
  const snaps: number[][][] = [];
  for (let step = 0; step < STEPS; step++) {
    if (step % SNAP_EVERY === 0) snaps.push(W.map((r) => [...r]));
    const gW = Array.from({ length: M }, () => new Array(NF).fill(0));
    const gB = new Array(NF).fill(0);
    for (let s = 0; s < BATCH; s++) {
      const x = Array.from({ length: NF }, () => (rand() < density ? rand() : 0));
      const h = Array.from({ length: M }, (_, m) => dot(W[m], x));
      const pre = Array.from({ length: NF }, (_, j) => W.reduce((s2, row, m) => s2 + row[j] * h[m], 0) + bOut[j]);
      for (let j = 0; j < NF; j++) {
        const e = 2 * IMP[j] * ((pre[j] > 0 ? pre[j] : 0) - x[j]) * (pre[j] > 0 ? 1 : 0);
        gB[j] += e;
        for (let m = 0; m < M; m++) {
          gW[m][j] += e * h[m];
          for (let k = 0; k < NF; k++) gW[m][k] += e * W[m][j] * x[k];
        }
      }
    }
    for (let m = 0; m < M; m++) for (let j = 0; j < NF; j++) W[m][j] -= (0.05 / BATCH) * gW[m][j];
    for (let j = 0; j < NF; j++) bOut[j] -= (0.05 / BATCH) * gB[j];
  }
  snaps.push(W.map((r) => [...r]));
  return { snaps, cols: Array.from({ length: NF }, (_, j) => [W[0][j], W[1][j]]) };
}

export const DENSE: Run = train(0.8, 9);
export const SPARSE: Run = train(0.05, 9);

/** column j of run at fractional snapshot f. */
export function colAt(run: Run, f: number, j: number): [number, number] {
  const m = Math.max(0, Math.min(run.snaps.length - 1, f));
  const i = Math.min(run.snaps.length - 2, Math.floor(m));
  const t = Math.min(1, m - i);
  const A = run.snaps[i];
  const B = run.snaps[i + 1];
  return [A[0][j] + (B[0][j] - A[0][j]) * t, A[1][j] + (B[1][j] - A[1][j]) * t];
}
export const N_SNAPS = DENSE.snaps.length - 1;

/** interference matrix |Wi·Wj| of the sparse solution (verified off-diagonal ≈ cos 72°). */
export const INTERF: number[][] = Array.from({ length: NF }, (_, i) =>
  Array.from({ length: NF }, (_, j) => Math.abs(dot(SPARSE.cols[i] as number[], SPARSE.cols[j] as number[]))),
);

// layout: two circle panels + interference grid
export const LPAN = { cx: 330, cy: 330, r: 190 };
export const RPAN = { cx: 830, cy: 330, r: 190 };
export const GRID = { x: 1075, y: 200, cell: 26 };

export const CAM_L: CameraState = { x: 330, y: 330, k: 1.35 };
export const CAM_R: CameraState = { x: 860, y: 330, k: 1.3 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  lU: ChannelRef<number>;
  rU: ChannelRef<number>;
  denseF: ChannelRef<number>; // 0..N_SNAPS training progress (dense)
  sparseF: ChannelRef<number>;
  gridU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const lU = tl.channel('lU', 0);
  const rU = tl.channel('rU', 0);
  const denseF = tl.channel('denseF', 0);
  const sparseF = tl.channel('sparseF', 0);
  const gridU = tl.channel('gridU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the bottleneck ———————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A model wants to represent five features, but we give it only two neurons. Five arrows must live in a two dimensional plane. Something has to give, and what gives depends on how often features fire.',
  });
  tl.tween(lU, 1, { at: 0.6, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAM_L, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.1, 0.5);

  // — Beat 2 · dense: dedicated dimensions ——————————————————————————————————
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'First regime: features almost always active. Watch the actual training run. The two most important features claim the two dimensions, at right angles, and the other three are crushed to nearly nothing.',
  });
  tl.tween(denseF, N_SNAPS, { at: 7.4, dur: 4.6, ease: ease.move });
  tl.caption({
    at: 12.6,
    dur: 4.6,
    text: 'That is the classical picture: one dimension per feature, and when dimensions run out, the least important features simply do not exist inside the model.',
  });
  tl.hold(17.4, 0.5);

  // — Beat 3 · sparse: superposition ————————————————————————————————————————
  tl.tween(cam, CAM_R, { at: 17.9, dur: 1.4, ease: ease.move });
  tl.tween(rU, 1, { at: 18.1, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 18.3,
    dur: 5.8,
    text: 'Now make the same five features rare: each one active only five percent of the time. Same architecture, same training, and the answer changes completely. All five arrows survive at full strength.',
  });
  tl.tween(sparseF, N_SNAPS, { at: 19.3, dur: 4.6, ease: ease.move });
  tl.caption({
    at: 24.3,
    dur: 5.4,
    text: 'They pack around the circle at roughly seventy two degrees apart, a pentagon of features sharing two neurons. Five things stored in two dimensions. This is superposition.',
  });
  tl.hold(30.0, 0.5);

  // — Beat 4 · the price: interference ——————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 30.5, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 30.7,
    dur: 5.8,
    text: 'The rent for this trick is interference. Here is the overlap between every pair of the learned arrows: when one feature fires, its neighbors each read a phantom third of a signal.',
  });
  tl.tween(gridU, 1, { at: 31.5, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 36.7,
    dur: 5.4,
    text: 'Sparsity is what makes the rent affordable. If features rarely fire together, phantom signals are rare and small, and the occasional collision costs less than dropping a feature entirely.',
  });
  tl.hold(42.3, 0.5);

  // — Beat 5 · why interpretability cares ———————————————————————————————————
  tl.caption({
    at: 42.8,
    dur: 5.8,
    text: 'This is why you cannot just read a network neuron by neuron. A single neuron here carries pieces of several features at once; the clean directions exist, but they do not line up with the hardware.',
  });
  tl.hold(48.8, 0.5);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 49.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 50.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.5,
    dur: 5.6,
    text: 'Superposition: sparse features crowd more directions into a space than it has dimensions, paying in interference. Next chapter, the tool that unmixes them.',
  });
  tl.hold(56.3, 1.2);

  return { tl, cam, lU, rU, denseF, sparseF, gridU, dimU, endU };
}
