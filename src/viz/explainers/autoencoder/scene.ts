import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Autoencoder — compress, then reconstruct.
 *
 * All math at module scope: 160 seeded 2-D points spread along a tilted line
 * with noise, and an ACTUAL linear autoencoder trained by gradient descent —
 * encoder w (two numbers to one), decoder v (one number back to two), mean
 * squared reconstruction loss, 150 recorded steps. The tilting line you watch
 * is the real decoder direction finding the data's long axis; the final
 * direction matches principal component analysis to within a degree.
 *
 * Empirics with SEED = 4 (verified by running this exact code): loss falls
 * 1.876 -> 0.074 (the noise floor); decoder direction (0.872, 0.489) vs
 * PCA (0.868, 0.496).
 */

export const SEED = 4;
export const N_PTS = 160;
export const LR = 0.08;
export const N_STEPS = 150;

const rand = mulberry32(SEED);
const g = gaussian(rand);

const DIR = (() => {
  const raw = [1, 0.62];
  const n = Math.hypot(raw[0], raw[1]);
  return [raw[0] / n, raw[1] / n] as [number, number];
})();

export const DATA: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < N_PTS; i++) {
    const t = 1.3 * g();
    const e = 0.28 * g();
    out.push([t * DIR[0] - e * DIR[1], t * DIR[1] + e * DIR[0]]);
  }
  return out;
})();

export interface Snap {
  w: [number, number];
  v: [number, number];
  loss: number;
}

/** The recorded training run. */
export const RUN: Snap[] = (() => {
  const w: [number, number] = [0.9, -0.5];
  const v: [number, number] = [-0.3, 0.8];
  const snaps: Snap[] = [];
  const record = (loss: number) => snaps.push({ w: [...w] as [number, number], v: [...v] as [number, number], loss });
  const lossOf = (): number =>
    DATA.reduce((a, x) => {
      const z = w[0] * x[0] + w[1] * x[1];
      const e0 = v[0] * z - x[0];
      const e1 = v[1] * z - x[1];
      return a + e0 * e0 + e1 * e1;
    }, 0) / N_PTS;
  record(lossOf());
  for (let it = 0; it < N_STEPS; it++) {
    const gw = [0, 0];
    const gv = [0, 0];
    for (const x of DATA) {
      const z = w[0] * x[0] + w[1] * x[1];
      const e0 = v[0] * z - x[0];
      const e1 = v[1] * z - x[1];
      gv[0] += 2 * e0 * z;
      gv[1] += 2 * e1 * z;
      const ev = e0 * v[0] + e1 * v[1];
      gw[0] += 2 * ev * x[0];
      gw[1] += 2 * ev * x[1];
    }
    w[0] -= (LR * gw[0]) / N_PTS;
    w[1] -= (LR * gw[1]) / N_PTS;
    v[0] -= (LR * gv[0]) / N_PTS;
    v[1] -= (LR * gv[1]) / N_PTS;
    record(lossOf());
  }
  return snaps;
})();

export const LOSS_FIRST = RUN[0].loss;
export const LOSS_LAST = RUN[RUN.length - 1].loss;
export const FINAL: Snap = RUN[RUN.length - 1];

/** The exact principal direction of the data (for the closing comparison). */
export const PCA_DIR: [number, number] = (() => {
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const x of DATA) {
    sxx += x[0] * x[0];
    sxy += x[0] * x[1];
    syy += x[1] * x[1];
  }
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const lam = tr / 2 + Math.sqrt((tr * tr) / 4 - det);
  const pc: [number, number] = [sxy, lam - sxx];
  const n = Math.hypot(pc[0], pc[1]);
  return [pc[0] / n, pc[1] / n];
})();

/** Lerped snapshot at fractional step f in [0, N_STEPS]. */
export function snapAt(f: number): Snap {
  const gg = Math.max(0, Math.min(RUN.length - 1, f));
  const i = Math.floor(gg);
  if (i >= RUN.length - 1) return RUN[RUN.length - 1];
  const t = gg - i;
  const A = RUN[i];
  const B = RUN[i + 1];
  return {
    w: [A.w[0] + (B.w[0] - A.w[0]) * t, A.w[1] + (B.w[1] - A.w[1]) * t],
    v: [A.v[0] + (B.v[0] - A.v[0]) * t, A.v[1] + (B.v[1] - A.v[1]) * t],
    loss: A.loss + (B.loss - A.loss) * t,
  };
}

/** Reconstruction of x under a snapshot. */
export const recon = (x: [number, number], s: Snap): [number, number] => {
  const z = s.w[0] * x[0] + s.w[1] * x[1];
  return [s.v[0] * z, s.v[1] * z];
};

// ---------------------------------------------------------------------------
// Stage mapping — data plane left, bottleneck diagram + loss right
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear().domain([-3.2, 3.2]).range([90, 810]);
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-2.4, 2.4]).range([630, 90]);

export const lossX: ScaleLinear<number, number> = scaleLinear().domain([0, N_STEPS]).range([930, 1220]);
export const lossY: ScaleLinear<number, number> = scaleLinear().domain([0, LOSS_FIRST]).range([560, 380]);

export const CAM_DATA: CameraState = { x: 470, y: 348, k: 1.2 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  diagU: ChannelRef<number>; // the 2 -> 1 -> 2 bottleneck diagram
  lineU: ChannelRef<number>; // decoder line
  segsU: ChannelRef<number>; // reconstruction segments
  stepProg: ChannelRef<number>; // 0..N_STEPS
  lossU: ChannelRef<number>;
  pcaU: ChannelRef<number>;
  texU: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const diagU = tl.channel('diagU', 0);
  const lineU = tl.channel('lineU', 0);
  const segsU = tl.channel('segsU', 0);
  const stepProg = tl.channel('stepProg', 0);
  const lossU = tl.channel('lossU', 0);
  const pcaU = tl.channel('pcaU', 0);
  const texU = tl.channel('texU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the deal ————————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is a strange deal. Each point has two coordinates, but you must describe it with a single number, and then rebuild both coordinates from that one number alone.',
  });
  tl.tween(dotsU, 1, { at: 0.4, dur: 2.2, ease: ease.enter });
  tl.tween(cam, CAM_DATA, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 5.4,
    text: 'That is an autoencoder: an encoder squeezes the data through a bottleneck, a decoder inflates it back, and the only teacher is the gap between original and rebuilt.',
  });
  tl.tween(diagU, 1, { at: 6.8, dur: 1.2, ease: ease.enter });
  tl.tween(texU, 1, { at: 8.4, dur: 0.8, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // — Beat 2 · the untrained machine ———————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'Ours is the smallest one possible: multiply by two weights to get the code, multiply by two more to decode. Geometrically, everything it rebuilds must land on one line through the origin.',
  });
  tl.tween(lineU, 1, { at: 13.4, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 5.2,
    text: 'The weights start random, so the line starts pointing across the data, not along it. Every faint segment is a reconstruction error: the price of the bottleneck, paid point by point.',
  });
  tl.tween(segsU, 1, { at: 19.2, dur: 1.4, ease: ease.enter });
  tl.hold(24.1, 0.6);

  // — Beat 3 · train ————————————————————————————————————————————————————————
  tl.tween(badgeU, 1, { at: 24.5, dur: 0.6, ease: ease.enter });
  tl.tween(lossU, 1, { at: 24.7, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'Now descend the gradient of the total squared error. Watch the line swing: shrinking those segments is the whole training signal, and the loss curve records every step of it.',
  });
  tl.tween(stepProg, 20, { at: 25.6, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 30.9,
    dur: 5.4,
    text: 'The line settles along the data cloud’s long axis. Of course it does: if you may keep only one number per point, keep the position along the direction where the data varies most.',
  });
  tl.tween(stepProg, N_STEPS, { at: 31.4, dur: 5.6, ease: ease.move });
  tl.hold(36.5, 0.5);

  // — Beat 4 · what the bottleneck learned ————————————————————————————————
  tl.caption({
    at: 37.0,
    dur: 5.6,
    text: 'The dashed line is principal component analysis, computed exactly. The trained decoder lies on top of it. A linear autoencoder rediscovers the classic method, purely from the reconstruction game.',
  });
  tl.tween(pcaU, 1, { at: 37.6, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 42.8,
    dur: 5.2,
    text: 'And the loss does not reach zero. It stops exactly at the noise floor: the sideways scatter that no single number could ever carry. The bottleneck kept the signal and paid the noise.',
  });
  tl.hold(48.2, 0.6);

  // — Beat 5 · the manifold idea ———————————————————————————————————————————
  tl.caption({
    at: 48.8,
    dur: 6.0,
    text: 'Here is the idea that scales. The code is a coordinate on a learned shape inside the data space. Deep autoencoders bend this line into curved surfaces; the principle never changes.',
  });
  tl.hold(55.0, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 55.6, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 55.6, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 55.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 56.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 56.8,
    dur: 5.6,
    text: 'Compress, rebuild, and punish the gap: the autoencoder learns the shape the data actually lives on, with no labels anywhere in sight.',
  });
  tl.caption({
    at: 62.8,
    dur: 5.6,
    text: 'But there is a catch we glossed over: nothing organizes the codes themselves. Sample a random code and decode it, and you may land nowhere near the data. Fixing that is the next chapter.',
  });
  tl.hold(68.6, 1.2);

  return { tl, cam, dotsU, diagU, lineU, segsU, stepProg, lossU, pcaU, texU, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
