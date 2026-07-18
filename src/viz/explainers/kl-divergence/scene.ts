import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * KL Divergence — the price of the wrong model.
 *
 * All math at module scope and verified by running it. True distribution
 * P = 1/2, 1/4, 1/8, 1/8 (entropy 1.750 bits, ideal lengths 1, 2, 3, 3).
 * Wrong model Q = uniform quarters: its codebook charges 2 bits for
 * everything, so the average bill is the cross entropy 2.000 and the waste
 * is KL(P‖Q) = 0.250 bits per symbol. A closer model Q₂ = 0.4, 0.3, 0.2,
 * 0.1 bills 1.801 bits — waste 0.051. Every number on screen is computed.
 */

export const LABELS = ['sun', 'clouds', 'rain', 'snow'];
export const P = [0.5, 0.25, 0.125, 0.125];
export const Q1 = [0.25, 0.25, 0.25, 0.25];
export const Q2 = [0.4, 0.3, 0.2, 0.1];

const lg = Math.log2;
export const H_P = -P.reduce((s, p) => s + p * lg(p), 0); // 1.750
export const CE = (q: number[]): number => -P.reduce((s, p, i) => s + p * lg(q[i]), 0);
export const CE1 = CE(Q1); // 2.000
export const CE2 = CE(Q2); // 1.801
export const KL1 = CE1 - H_P; // 0.250
export const KL2 = CE2 - H_P; // 0.051
export const lenOf = (q: number[], i: number): number => -lg(q[i]);

/** model mix: 0 = ideal P codebook, 1 = uniform Q1, 2 = closer Q2 */
export function qAt(mix: number, i: number): number {
  const seq = [P, Q1, Q2];
  const m = Math.max(0, Math.min(2, mix));
  const a = Math.min(1, Math.floor(m));
  const t = m - a;
  return seq[a][i] + (seq[a + 1][i] - seq[a][i]) * t;
}
export function ceAt(mix: number): number {
  return -P.reduce((s, p, i) => s + p * lg(qAt(mix, i)), 0);
}

// layout: P bars left, codebook lengths right, bill meter bottom-center
export const PBARS = { x: 120, y: 130, w: 420, base: 470, hMax: 300, step: 105 };
export const CBOOK = { x: 660, y: 130, w: 480, base: 470, unit: 78, step: 118 };
export const METER = { x: 240, y: 545, w: 560, h: 30, scale: 240 }; // px per bit

export const CAM_MAIN: CameraState = CAMERA_HOME;
export const CAM_BOOK: CameraState = { x: 760, y: 300, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pU: ChannelRef<number>;
  idealU: ChannelRef<number>; // ideal lengths shown on P bars
  bookU: ChannelRef<number>; // codebook panel
  mix: ChannelRef<number>; // 0 ideal → 1 uniform → 2 closer
  meterU: ChannelRef<number>;
  wasteU: ChannelRef<number>;
  texU: ChannelRef<number>;
  lossU: ChannelRef<number>; // classifier-bridge chip
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pU = tl.channel('pU', 0);
  const idealU = tl.channel('idealU', 0);
  const bookU = tl.channel('bookU', 0);
  const mix = tl.channel('mix', 0);
  const meterU = tl.channel('meterU', 0);
  const wasteU = tl.channel('wasteU', 0);
  const texU = tl.channel('texU', 0);
  const lossU = tl.channel('lossU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the true world and its ideal code ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Here is the true weather of some town: sun half the time, clouds a quarter, rain and snow an eighth each. From the last two chapters you know its entropy: one point seven five bits per day.',
  });
  tl.tween(pU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.1,
    dur: 5.0,
    text: 'And you know the matching code: one bit for sun, two for clouds, three for the rare stuff. Lengths tailored to the truth, average exactly at the entropy floor.',
  });
  tl.tween(idealU, 1, { at: 6.7, dur: 1.0, ease: ease.enter });
  tl.tween(meterU, 1, { at: 8.9, dur: 0.9, ease: ease.enter });
  tl.hold(11.3, 0.5);

  // — Beat 2 · codebook from the wrong model ————————————————————————————————
  tl.caption({
    at: 11.8,
    dur: 5.6,
    text: 'Now suppose you believe the wrong thing. Your model says all four kinds of weather are equally likely, so you print a codebook with two bits for everything. Reasonable, for the world you imagined.',
  });
  tl.tween(bookU, 1, { at: 12.6, dur: 1.2, ease: ease.draw });
  tl.tween(mix, 1, { at: 14.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 17.6,
    dur: 5.6,
    text: 'But the bills arrive from the real world. Half your days are sun, and you pay two bits for what should cost one. The average bill is the cross entropy: two point zero zero bits per day.',
    tex: 'H(P, Q) = -\\textstyle\\sum_i p_i \\log_2 q_i',
  });
  tl.tween(texU, 1, { at: 18.4, dur: 0.7, ease: ease.enter });
  tl.hold(23.4, 0.5);

  // — Beat 3 · the waste has a name —————————————————————————————————————————
  tl.caption({
    at: 23.9,
    dur: 5.8,
    text: 'Two point zero paid, one point seven five necessary. The overpayment, a quarter bit per day, is the Kullback Leibler divergence: the exact price of believing the wrong distribution.',
    tex: 'D_{KL}(P \\Vert Q) = H(P,Q) - H(P) = 0.250',
  });
  tl.tween(wasteU, 1, { at: 24.9, dur: 1.0, ease: ease.pop });
  tl.caption({
    at: 29.9,
    dur: 4.6,
    text: 'Notice it can never be negative. No codebook beats the one printed from the truth, so the waste is zero exactly when your model is right, and positive otherwise.',
  });
  tl.hold(34.7, 0.5);

  // — Beat 4 · a better model pays a smaller tax ————————————————————————————
  tl.caption({
    at: 35.2,
    dur: 5.8,
    text: 'Improve the model, and watch the bill. Believe forty, thirty, twenty, ten instead, and the lengths bend toward the truth. The average drops to one point eight zero: the tax falls from a quarter bit to five hundredths.',
  });
  tl.tween(mix, 2, { at: 36.0, dur: 2.2, ease: ease.move });
  tl.hold(41.2, 0.5);

  // — Beat 5 · this is the loss function ————————————————————————————————————
  tl.caption({
    at: 41.7,
    dur: 6.0,
    text: 'Now the secret in plain sight: this bill is the loss function of nearly every classifier. Training on cross entropy means shrinking exactly this tax, symbol by symbol, until the model’s codebook matches the world.',
  });
  tl.tween(lossU, 1, { at: 42.9, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 47.9,
    dur: 4.4,
    text: 'And note the asymmetry: the tax for believing rare things common differs from the tax for believing common things rare. Divergence is a price list, not a distance.',
  });
  tl.hold(52.5, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 53.1, dur: 1.1, ease: ease.move });
  tl.tween(texU, 0, { at: 53.1, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 54.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 54.3,
    dur: 5.6,
    text: 'Kullback Leibler divergence is the overcharge for compressing reality with the wrong beliefs. Minimize it and you are doing statistics; pay it and you are just wrong efficiently.',
  });
  tl.hold(60.1, 1.2);

  return { tl, cam, pU, idealU, bookU, mix, meterU, wasteU, texU, lossU, dimU, endU };
}
