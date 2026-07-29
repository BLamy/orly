import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Features as Directions — opening the black box.
 *
 * All math at module scope and verified by running it. 240 activation
 * vectors in an eight dimensional space: half carry a hidden attribute,
 * injected as +1.6 along one fixed random unit direction, plus gaussian
 * noise (spread 0.5). A logistic regression probe trained for real
 * (12000 full-batch steps, weight decay 1.0) recovers that direction with
 * cosine similarity 0.993 and classifies 227 of 240 activations correctly.
 * Both scatter views are true orthogonal projections of the same vectors.
 */

const rand = mulberry32(5);
const g = gaussian(rand);
export const D = 8;
export const N = 240;

const dot = (a: number[], b: number[]): number => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a: number[]): number => Math.sqrt(dot(a, a));

// the ground-truth feature direction
const vA = Array.from({ length: D }, () => g());
export const TRUE_DIR: number[] = vA.map((v) => v / norm(vA));

// activations
export const X: number[][] = [];
export const Y: number[] = [];
for (let i = 0; i < N; i++) {
  const y = i % 2;
  const x = Array.from({ length: D }, () => g() * 0.5);
  if (y) for (let d = 0; d < D; d++) x[d] += 1.6 * TRUE_DIR[d];
  X.push(x);
  Y.push(y);
}

// the probe (verified: cos 0.993, acc 227/240)
export const PROBE: { w: number[]; b: number; cos: number; acc: number } = (() => {
  let w = new Array(D).fill(0);
  let b = 0;
  for (let it = 0; it < 12000; it++) {
    const gw = new Array(D).fill(0);
    let gb = 0;
    for (let i = 0; i < N; i++) {
      const p = 1 / (1 + Math.exp(-(dot(w, X[i]) + b)));
      const e = p - Y[i];
      for (let d = 0; d < D; d++) gw[d] += e * X[i][d];
      gb += e;
    }
    for (let d = 0; d < D; d++) w[d] -= (0.2 / N) * (gw[d] + 1.0 * w[d]);
    b -= (0.2 / N) * gb;
  }
  const c = dot(w, TRUE_DIR) / (norm(w) * 1);
  const acc = X.filter((x, i) => (dot(w, x) + b > 0 ? 1 : 0) === Y[i]).length;
  return { w, b, cos: c, acc };
})();

// two orthonormal 2-D bases: an arbitrary one (the "mixed" view) and the
// probe basis (probe direction × an orthogonal complement axis)
function orthonormalPair(seedDirA: number[], seedDirB: number[]): [number[], number[]] {
  const a = seedDirA.map((v) => v / norm(seedDirA));
  const proj = dot(seedDirB, a);
  const b0 = seedDirB.map((v, i) => v - proj * a[i]);
  const b = b0.map((v) => v / norm(b0));
  return [a, b];
}
const r2 = mulberry32(41);
const g2 = gaussian(r2);
const randA = Array.from({ length: D }, () => g2());
const randB = Array.from({ length: D }, () => g2());
export const BASIS_RAND = orthonormalPair(randA, randB);
export const BASIS_PROBE = orthonormalPair(PROBE.w, randB);

/** 2-D coordinates of activation i in each basis (data units). */
export const COORD_RAND: [number, number][] = X.map((x) => [dot(x, BASIS_RAND[0]), dot(x, BASIS_RAND[1])]);
export const COORD_PROBE: [number, number][] = X.map((x) => [dot(x, BASIS_PROBE[0]), dot(x, BASIS_PROBE[1])]);

// stage mapping
export const PLOT = { x: 140, y: 90, w: 620, h: 500 };
export const SCALE = 105; // px per data unit
export const CTRX = PLOT.x + PLOT.w / 2 - 60;
export const CTRY = PLOT.y + PLOT.h / 2;
export const PANEL = { x: 850, y: 150 };

export const CAM_PLOT: CameraState = { x: 400, y: 320, k: 1.22 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>;
  labelU: ChannelRef<number>; // color by hidden attribute
  baseMix: ChannelRef<number>; // 0 = random basis, 1 = probe basis
  axisU: ChannelRef<number>; // probe axis line + histogram
  statsU: ChannelRef<number>;
  texU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const labelU = tl.channel('labelU', 0);
  const baseMix = tl.channel('baseMix', 0);
  const axisU = tl.channel('axisU', 0);
  const statsU = tl.channel('statsU', 0);
  const texU = tl.channel('texU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the black box speaks in vectors —————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Inside a neural network there are no words, no concepts, no labels. Just long lists of numbers: activation vectors. Here are two hundred forty of them from a toy model, projected down so we can look.',
  });
  tl.tween(ptsU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 4.8,
    text: 'A blob. And yet half of these activations came from inputs with a hidden attribute, and half without. The model knows which is which. Can we find where it wrote that down?',
  });
  tl.tween(labelU, 1, { at: 8.6, dur: 1.2, ease: ease.move });
  tl.hold(11.3, 0.5);

  // — Beat 2 · the linear probe ————————————————————————————————————————————
  tl.caption({
    at: 11.8,
    dur: 5.4,
    text: 'Color the points by the truth and the blob stays a blob, because we are looking along two arbitrary axes. The mechanistic hypothesis says: features are directions. So hunt for the direction.',
  });
  tl.caption({
    at: 17.4,
    dur: 5.6,
    text: 'The tool is a linear probe: the simplest possible classifier, trained for real on these vectors. It has no way to succeed unless the attribute really is written along some line in activation space.',
    tex: 'p = \\sigma(w \\cdot x + b)',
  });
  tl.tween(texU, 1, { at: 18.2, dur: 0.7, ease: ease.enter });
  tl.hold(23.2, 0.5);

  // — Beat 3 · rotate into the probe's basis ———————————————————————————————
  tl.caption({
    at: 23.7,
    dur: 5.8,
    text: 'It succeeds. Rotate our viewing plane so its horizontal axis is the probe direction, and the same points, the same vectors, fall apart into two clean clouds. Nothing moved but our eyes.',
  });
  tl.tween(baseMix, 1, { at: 24.7, dur: 2.6, ease: ease.move });
  tl.tween(axisU, 1, { at: 27.6, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 29.7,
    dur: 5.2,
    text: 'And it is not just any direction. We planted the attribute along a known unit vector when we built this toy, and the probe recovered it with cosine similarity zero point nine nine three.',
  });
  tl.tween(statsU, 1, { at: 30.7, dur: 1.0, ease: ease.enter });
  tl.hold(35.1, 0.5);

  // — Beat 4 · what this does and does not prove ————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 35.6, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 35.8,
    dur: 5.6,
    text: 'Two hundred twenty seven of two hundred forty classified correctly, from a single dot product. That is the first tool of interpretability: if a concept is linearly readable, a probe will read it.',
  });
  tl.caption({
    at: 41.6,
    dur: 5.4,
    text: 'But be careful what you conclude. A probe proves the information is present and readable; it does not prove the model uses it. That stronger claim needs intervention, and it comes in the final chapter.',
  });
  tl.hold(47.2, 0.5);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 47.7, dur: 1.1, ease: ease.move });
  tl.tween(texU, 0, { at: 47.7, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 48.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.9,
    dur: 5.6,
    text: 'Features as directions: concepts live along lines in activation space, and a trained probe can find them. Next, the catch: models cram more features than they have dimensions.',
  });
  tl.hold(54.7, 1.2);

  return { tl, cam, ptsU, labelU, baseMix, axisU, statsU, texU, dimU, endU };
}
