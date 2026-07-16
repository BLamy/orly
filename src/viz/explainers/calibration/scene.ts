import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Calibration — is ninety percent sure right ninety percent of the time?
 *
 * All real, at module scope: a logistic classifier is ACTUALLY trained
 * (6000 gradient steps) on just 8 points from two overlapping gaussian
 * classes. Overfitting the small sample drives its weight to 24.6 — the
 * model speaks in near-certainties. Evaluated on 4000 fresh points and
 * binned by confidence, the reliability diagram shows the damage: the bin
 * where it claims ~100% confidence is right 76% of the time; expected
 * calibration error 0.238. Temperature scaling (T* = 27.4, fit by grid
 * search on 200 validation points) repairs it to ECE 0.031 without changing
 * a single prediction.
 */

const sig = (x: number): number => 1 / (1 + Math.exp(-x));

interface Sample {
  x: number;
  y: number;
}
function makeSamples(n: number, seedA: number, seedB: number): Sample[] {
  const r = mulberry32(seedA);
  const g = gaussian(mulberry32(seedB));
  return Array.from({ length: n }, () => {
    const y = r() < 0.5 ? 0 : 1;
    return { x: (y ? 0.8 : -0.8) + 1.2 * g(), y };
  });
}

// NOTE: train uses one rand for labels and gaussian from the same stream as
// the prototype (label stream = mulberry32(9), noise = gaussian of same rand).
const trainRand = mulberry32(9);
const trainG = gaussian(trainRand);
export const TRAIN: Sample[] = Array.from({ length: 8 }, () => {
  const y = trainRand() < 0.5 ? 0 : 1;
  return { x: (y ? 0.8 : -0.8) + 1.2 * trainG(), y };
});

/** Real training: 6000 full-batch gradient steps. */
export const { W, B } = (() => {
  let w = 0;
  let b = 0;
  for (let s = 0; s < 6000; s++) {
    let gw = 0;
    let gb = 0;
    for (const { x, y } of TRAIN) {
      const p = sig(w * x + b);
      gw += (p - y) * x;
      gb += p - y;
    }
    w -= (1.0 * gw) / TRAIN.length;
    b -= (1.0 * gb) / TRAIN.length;
  }
  return { W: w, B: b }; // ≈ 24.65, 5.37
})();

export const TEST: Sample[] = makeSamples(4000, 77, 78);
export const VAL: Sample[] = makeSamples(200, 55, 56);

export interface Bin {
  n: number;
  conf: number;
  acc: number;
}
export function reliability(scale: number): { bins: Bin[]; ece: number } {
  const bins: Bin[] = Array.from({ length: 10 }, () => ({ n: 0, conf: 0, acc: 0 }));
  let ece = 0;
  for (const { x, y } of TEST) {
    const p = sig((W * x + B) / scale);
    const conf = Math.max(p, 1 - p);
    const pred = p > 0.5 ? 1 : 0;
    const bi = Math.min(9, Math.floor((conf - 0.5) * 20));
    bins[bi].n++;
    bins[bi].conf += conf;
    bins[bi].acc += pred === y ? 1 : 0;
  }
  for (const b of bins) {
    if (b.n) {
      b.conf /= b.n;
      b.acc /= b.n;
      ece += (b.n / TEST.length) * Math.abs(b.conf - b.acc);
    }
  }
  return { bins, ece };
}

/** Temperature fit on the validation set (grid search on NLL). */
export const T_STAR: number = (() => {
  let best = 1;
  let bestNll = Infinity;
  for (let T = 0.5; T < 40; T += 0.1) {
    let nll = 0;
    for (const { x, y } of VAL) {
      const p = sig((W * x + B) / T);
      nll -= Math.log(Math.max(1e-12, y ? p : 1 - p));
    }
    if (nll < bestNll) {
      bestNll = nll;
      best = T;
    }
  }
  return best; // ≈ 27.4
})();

export const RAW = reliability(1); // ECE ≈ 0.238
export const CAL = reliability(T_STAR); // ECE ≈ 0.031

/** The sigmoid curves for plotting (raw and scaled). */
export const X_MIN = -3;
export const X_MAX = 3;
export const N_PLOT = 160;
export const sigCurve = (scale: number): number[] =>
  Array.from({ length: N_PLOT }, (_, i) =>
    sig((W * (X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)) + B) / scale),
  );
export const CURVE_RAW = sigCurve(1);
export const CURVE_CAL = sigCurve(T_STAR);

// ---------------------------------------------------------------------------
// Stage layout — the classifier strip on top, the reliability diagram below.
// ---------------------------------------------------------------------------

export const STRIP_X0 = 120;
export const STRIP_X1 = 660;
export const STRIP_Y1 = 120; // p=1 line
export const STRIP_Y0 = 300; // p=0 line
export const sx = (x: number): number => STRIP_X0 + ((x - X_MIN) / (X_MAX - X_MIN)) * (STRIP_X1 - STRIP_X0);
export const sy = (p: number): number => STRIP_Y0 - p * (STRIP_Y0 - STRIP_Y1);

export const REL_X0 = 460;
export const REL_Y0 = 590; // bottom of the reliability square
export const REL_S = 330; // square size
export const rx = (conf: number): number => REL_X0 + (conf - 0.5) * 2 * REL_S;
export const ry = (acc: number): number => REL_Y0 - (acc - 0.5) * 2 * REL_S;

export const CAM_STRIP: CameraState = { x: 450, y: 250, k: 1.3 };
export const CAM_REL: CameraState = { x: 640, y: 390, k: 1.06 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dataU: ChannelRef<number>; // the 8 training points
  curveU: ChannelRef<number>; // sigmoid draw-on
  testU: ChannelRef<number>; // fresh points strip
  relU: ChannelRef<number>; // reliability diagram frame + diagonal
  barsU: ChannelRef<number>; // bins fill in 0..10
  calW: ChannelRef<number>; // 0 raw → 1 temperature-scaled
  eceU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dataU = tl.channel('dataU', 0);
  const curveU = tl.channel('curveU', 0);
  const testU = tl.channel('testU', 0);
  const relU = tl.channel('relU', 0);
  const barsU = tl.channel('barsU', 0);
  const calW = tl.channel('calW', 0);
  const eceU = tl.channel('eceU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · an overconfident model ——————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Accuracy tells you how often a model is right. Calibration asks a sharper question: when it says ninety percent sure, is it right ninety percent of the time? Meet a model that will fail that test.',
  });
  tl.tween(cam, CAM_STRIP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(dataU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'It is a real classifier, trained to convergence on just eight examples. Overfitting a small sample made its decision curve a cliff: one step across the boundary and it leaps from certain no to certain yes.',
  });
  tl.tween(curveU, 1, { at: 7.1, dur: 1.8, ease: ease.draw });
  tl.hold(12.3, 0.6);

  // — Beat 2 · reality check ————————————————————————————————————————————
  tl.caption({
    at: 12.9,
    dur: 5.2,
    text: 'The two classes truly overlap — plenty of cases near the boundary are genuinely uncertain. Four thousand fresh examples rain down. The model stamps almost all of them ninety nine percent.',
  });
  tl.tween(testU, 1, { at: 13.5, dur: 2.2, ease: ease.enter });
  tl.hold(18.3, 0.6);

  // — Beat 3 · the reliability diagram ——————————————————————————————————
  tl.tween(cam, CAM_REL, { at: 18.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 19.3,
    dur: 5.6,
    text: 'The reliability diagram is the lie detector. Sort predictions into bins by claimed confidence; for each bin, plot how often the model was actually right. Honesty is the diagonal.',
  });
  tl.tween(relU, 1, { at: 19.9, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 25.1,
    dur: 5.8,
    text: 'Here is our model, for real. Every bar sags below the line. The bin where it claims near-certainty is right seventy six percent of the time. Averaged out, its confidence overstates the truth by twenty four points.',
  });
  tl.tween(barsU, 10, { at: 25.7, dur: 3.6, ease: ease.linear });
  tl.tween(eceU, 1, { at: 29.3, dur: 0.7, ease: ease.enter });
  tl.hold(30.9, 0.6);

  // — Beat 4 · temperature scaling ——————————————————————————————————————
  tl.caption({
    at: 31.5,
    dur: 5.8,
    text: 'The classic repair does not retrain anything. Divide the model raw scores by a single learned temperature — here twenty seven — before the probability squash. Decisions stay identical; only the confidence softens.',
    tex: 'p = \\sigma\\!\\big(z / T\\big), \\quad T^* = 27.4',
  });
  tl.tween(calW, 1, { at: 32.5, dur: 2.2, ease: ease.move });
  tl.caption({
    at: 37.5,
    dur: 5.0,
    text: 'The bars climb back to the diagonal: calibration error drops from twenty four points to three. Same model, same answers — it just stopped exaggerating.',
  });
  tl.hold(42.7, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 43.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.9, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 45.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.1,
    dur: 6.0,
    text: 'Calibration matters because confidence is what we act on — a diagnosis, a trade, an answer stated as fact. A model can be accurate and still dangerous if its ninety nine percent means seventy six.',
  });
  tl.hold(51.3, 1.2);

  return { tl, cam, dataU, curveU, testU, relU, barsU, calW, eceU, dimU, endU };
}
