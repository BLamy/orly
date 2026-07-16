import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Quantization — squeezing weights into fewer bits.
 *
 * Real computation at module scope: 256 gaussian weights (σ = 0.5, seeded),
 * absmax-quantized to int8 and int4 and dequantized back. Every error shown
 * is the actual per-weight rounding error. Measured: int8 root-mean-square
 * error ≈ 0.003 (invisible), int4 ≈ 0.056 (19× worse — 16 levels can't hide).
 * Then the outlier problem: setting ONE weight to 5.0 stretches the absmax
 * scale so far that int8's error nearly quadruples (0.0030 → 0.0115) for the
 * other 255 weights — why real schemes quantize per-block and keep outliers
 * in high precision.
 */

export const N = 256;
const rand = mulberry32(31);
const g = gaussian(rand);
export const W: number[] = Array.from({ length: N }, () => g() * 0.5);

export interface QuantResult {
  dq: number[]; // dequantized values
  q: number[]; // integer codes
  err: number[]; // per-weight error
  rmse: number;
  scale: number;
  levels: number;
}

export function quantize(ws: number[], bits: number): QuantResult {
  const scale = Math.max(...ws.map(Math.abs));
  const L = 2 ** (bits - 1) - 1;
  const q = ws.map((w) => Math.round((w / scale) * L));
  const dq = q.map((x) => (x / L) * scale);
  const err = ws.map((w, i) => w - dq[i]);
  const rmse = Math.sqrt(err.reduce((a, e) => a + e * e, 0) / ws.length);
  return { dq, q, err, rmse, scale, levels: 2 * L + 1 };
}

export const Q8 = quantize(W, 8);
export const Q4 = quantize(W, 4);

/** The outlier experiment: one weight set to 5.0, re-quantized at int8. */
export const W_OUT: number[] = (() => {
  const w = [...W];
  w[0] = 5.0;
  return w;
})();
export const Q8_OUT = quantize(W_OUT, 8);
/** RMSE over the 255 non-outlier weights before/after the outlier. */
export const RMSE_CLEAN = Q8.rmse; // ≈ 0.0030
export const RMSE_OUT = Math.sqrt(
  Q8_OUT.err.slice(1).reduce((a, e) => a + e * e, 0) / (N - 1),
); // ≈ 0.0115

/** Error histograms (17 bins over ±maxerr of int4). */
export const HIST_BINS = 17;
export const HIST_RANGE = Math.max(...Q4.err.map(Math.abs)) * 1.05;
export function histogram(err: number[]): number[] {
  const h = new Array<number>(HIST_BINS).fill(0);
  for (const e of err) {
    const b = Math.min(
      HIST_BINS - 1,
      Math.max(0, Math.floor(((e + HIST_RANGE) / (2 * HIST_RANGE)) * HIST_BINS)),
    );
    h[b]++;
  }
  return h;
}
export const HIST8 = histogram(Q8.err);
export const HIST4 = histogram(Q4.err);
export const HIST8_OUT = histogram(Q8_OUT.err.slice(1));
export const HIST_MAX = Math.max(...HIST8, ...HIST4);

// ---------------------------------------------------------------------------
// Stage layout — the number line of weights above, the error histogram below.
// ---------------------------------------------------------------------------

export const LINE_Y = 220;
export const LINE_X0 = 120;
export const LINE_X1 = 1160;
export const VAL_RANGE = 1.6; // ±1.6 covers the clean weights
export const valX = (v: number): number =>
  LINE_X0 + ((v + VAL_RANGE) / (2 * VAL_RANGE)) * (LINE_X1 - LINE_X0);

export const HIST_Y0 = 560;
export const HIST_H = 170;
export const HIST_X0 = 250;
export const HIST_W = 780;

export const CAM_LINE: CameraState = { x: 640, y: 260, k: 1.1 };
export const CAM_ZOOM: CameraState = { x: 640, y: 220, k: 1.9 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>; // weights appear on the line
  gridU8: ChannelRef<number>; // int8 grid lines
  snapU: ChannelRef<number>; // 0 = true positions, 1 = snapped to grid
  bits: ChannelRef<number>; // 8 → 4 (drives which grid shows)
  histU: ChannelRef<number>; // histogram reveal
  outU: ChannelRef<number>; // the outlier arrives
  statU: ChannelRef<number>; // rmse stat panel
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const gridU8 = tl.channel('gridU8', 0);
  const snapU = tl.channel('snapU', 0);
  const bits = tl.channel('bits', 8);
  const histU = tl.channel('histU', 0);
  const outU = tl.channel('outU', 0);
  const statU = tl.channel('statU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · weights on a line ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'A model is mostly a pile of numbers, each stored in sixteen or thirty two bits. Here are two hundred fifty six real weights spread along the number line.',
  });
  tl.tween(dotsU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_LINE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 4.8,
    text: 'Quantization shrinks the model by allowing fewer positions. Eight bits buys you two hundred fifty five allowed values — a fine comb laid over the line.',
  });
  tl.tween(gridU8, 1, { at: 6.8, dur: 1.4, ease: ease.draw });
  tl.hold(11.3, 0.5);

  // — Beat 2 · the snap ————————————————————————————————————————————————
  tl.tween(cam, CAM_ZOOM, { at: 11.8, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 12.2,
    dur: 5.4,
    text: 'Every weight snaps to its nearest allowed value. Zoom in and you can see the flinch — each dot slides to a tooth of the comb. That slide is the error, and it is tiny.',
  });
  tl.tween(snapU, 1, { at: 13.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 17.8,
    dur: 4.8,
    text: 'Measured across all two hundred fifty six weights, the typical int8 error is zero point zero zero three — about half a percent of a typical weight. Nobody notices.',
  });
  tl.tween(statU, 1, { at: 18.4, dur: 0.7, ease: ease.enter });
  tl.tween(histU, 1, { at: 18.8, dur: 1.2, ease: ease.draw });
  tl.hold(22.8, 0.6);

  // — Beat 3 · int4 ————————————————————————————————————————————————————
  tl.tween(cam, CAM_LINE, { at: 23.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 23.8,
    dur: 5.6,
    text: 'Now get greedy. Four bits: fifteen allowed values for the whole line. The comb loses most of its teeth, the snaps get long, and the same weights land far from home.',
  });
  tl.tween(bits, 4, { at: 24.6, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 29.6,
    dur: 5.2,
    text: 'The error histogram tells it honestly: int8 errors huddle in a needle around zero; int4 errors sprawl nineteen times wider. Every downstream activation inherits that noise.',
  });
  tl.hold(35.0, 0.6);

  // — Beat 4 · the outlier problem ——————————————————————————————————————
  tl.caption({
    at: 35.6,
    dur: 5.8,
    text: 'And here is the trap that bites real models: outliers. Set just one weight to five — ten times the crowd — and watch. The scale must stretch to reach it, so everyone else gets a coarser comb.',
  });
  tl.tween(outU, 1, { at: 36.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 41.6,
    dur: 5.6,
    text: 'One number nearly quadruples the error of the other two hundred fifty five — from zero point zero zero three to zero point zero one one at int8. That is why serious schemes quantize block by block and carry outliers in full precision.',
  });
  tl.hold(47.4, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.0, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.6, dur: 1.1, ease: ease.move });
  tl.tween(statU, 0, { at: 48.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.8,
    dur: 5.8,
    text: 'Quantization is a bargain, not a trick: four times smaller and faster, paid for in rounding noise you can measure. The craft is in where the comb is fine, and which numbers are excused from it.',
  });
  tl.hold(55.8, 1.2);

  return { tl, cam, dotsU, gridU8, snapU, bits, histU, outU, statU, dimU, endU };
}
