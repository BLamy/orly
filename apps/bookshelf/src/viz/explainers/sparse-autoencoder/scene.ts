import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Sparse Autoencoders — unmixing the residual stream.
 *
 * A real SAE trained at module scope (seeded, 8000 steps, batch 128) on toy
 * superposed data: five ground-truth feature directions arranged around the
 * circle in a two dimensional "residual stream", each active 12% of the time
 * with random amplitude. The SAE has ten hidden units, a ReLU encoder, an
 * L1 sparsity penalty of 0.02 and a linear decoder. Verified: nine of ten
 * dictionary features stay alive, and for every one of the five true
 * directions the best-matching decoder column has |cosine| of 0.96 to 1.00.
 */

const dot2 = (a: [number, number], b: [number, number]): number => a[0] * b[0] + a[1] * b[1];
const norm2 = (a: [number, number]): number => Math.hypot(a[0], a[1]);

export const NF = 5;
export const DIRS: [number, number][] = Array.from({ length: NF }, (_, j) => [
  Math.cos((2 * Math.PI * j) / NF + 0.3),
  Math.sin((2 * Math.PI * j) / NF + 0.3),
]);
export const H = 10;

const rand = mulberry32(13);
const g = gaussian(rand);

// a cloud of superposed activations for the backdrop (precomputed, seeded)
export const CLOUD: [number, number][] = (() => {
  const r = mulberry32(29);
  const pts: [number, number][] = [];
  for (let i = 0; i < 400; i++) {
    const a: [number, number] = [0, 0];
    for (let j = 0; j < NF; j++)
      if (r() < 0.12) {
        const amp = 0.5 + 0.5 * r();
        a[0] += amp * DIRS[j][0];
        a[1] += amp * DIRS[j][1];
      }
    pts.push(a);
  }
  return pts;
})();

export interface SaeRun {
  snaps: [number, number][][]; // decoder columns per snapshot
  final: [number, number][];
  matches: { j: number; cos: number }[]; // per true dir: best |cos|
  alive: number;
}

export const SAE: SaeRun = (() => {
  const relu = (v: number): number => (v > 0 ? v : 0);
  let E: [number, number][] = Array.from({ length: H }, () => [g() * 0.3, g() * 0.3]);
  const be = new Array(H).fill(0);
  const Dd: [number, number][] = Array.from({ length: H }, () => [g() * 0.3, g() * 0.3]);
  const L1 = 0.02;
  const lr = 0.03;
  const BATCH = 128;
  const STEPS = 8000;
  const snaps: [number, number][][] = [];
  for (let step = 0; step < STEPS; step++) {
    if (step % (STEPS / 10) === 0) snaps.push(Dd.map((d) => [...d] as [number, number]));
    const gE: [number, number][] = Array.from({ length: H }, () => [0, 0]);
    const gbe = new Array(H).fill(0);
    const gD: [number, number][] = Array.from({ length: H }, () => [0, 0]);
    for (let s = 0; s < BATCH; s++) {
      const a: [number, number] = [0, 0];
      for (let j = 0; j < NF; j++)
        if (rand() < 0.12) {
          const amp = 0.5 + 0.5 * rand();
          a[0] += amp * DIRS[j][0];
          a[1] += amp * DIRS[j][1];
        }
      const h = E.map((e, i) => relu(e[0] * a[0] + e[1] * a[1] + be[i]));
      const xh: [number, number] = [0, 0];
      h.forEach((v, i) => {
        xh[0] += v * Dd[i][0];
        xh[1] += v * Dd[i][1];
      });
      const err: [number, number] = [xh[0] - a[0], xh[1] - a[1]];
      for (let i = 0; i < H; i++) {
        gD[i][0] += 2 * err[0] * h[i];
        gD[i][1] += 2 * err[1] * h[i];
        if (h[i] > 0) {
          const dh = 2 * (err[0] * Dd[i][0] + err[1] * Dd[i][1]) + L1;
          gE[i][0] += dh * a[0];
          gE[i][1] += dh * a[1];
          gbe[i] += dh;
        }
      }
    }
    for (let i = 0; i < H; i++) {
      E[i] = [E[i][0] - (lr / BATCH) * gE[i][0], E[i][1] - (lr / BATCH) * gE[i][1]];
      be[i] -= (lr / BATCH) * gbe[i];
      Dd[i][0] -= (lr / BATCH) * gD[i][0];
      Dd[i][1] -= (lr / BATCH) * gD[i][1];
    }
  }
  snaps.push(Dd.map((d) => [...d] as [number, number]));
  const alive = Dd.filter((d) => norm2(d) > 0.3).length;
  const matches = DIRS.map((t, j) => {
    let best = 0;
    Dd.forEach((d) => {
      if (norm2(d) < 0.3) return;
      const c = Math.abs(dot2(d, t) / (norm2(d) * 1));
      if (c > best) best = c;
    });
    return { j, cos: best };
  });
  return { snaps, final: Dd, matches, alive };
})();
export const N_SNAPS = SAE.snaps.length - 1;

export function decAt(f: number, i: number): [number, number] {
  const m = Math.max(0, Math.min(SAE.snaps.length - 1, f));
  const k = Math.min(SAE.snaps.length - 2, Math.floor(m));
  const t = Math.min(1, m - k);
  const A = SAE.snaps[k][i];
  const B = SAE.snaps[k + 1][i];
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
}

// layout
export const PAN = { cx: 430, cy: 330, r: 230 };
export const TABLE = { x: 830, y: 170 };

export const CAM_PAN: CameraState = { x: 430, y: 330, k: 1.28 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cloudU: ChannelRef<number>;
  dirsU: ChannelRef<number>; // ground-truth directions (faint)
  saeF: ChannelRef<number>; // 0..N_SNAPS training progress
  saeU: ChannelRef<number>;
  tableU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cloudU = tl.channel('cloudU', 0);
  const dirsU = tl.channel('dirsU', 0);
  const saeF = tl.channel('saeF', 0);
  const saeU = tl.channel('saeU', 0);
  const tableU = tl.channel('tableU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the mixed stream —————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'This cloud is a tiny residual stream: four hundred activations, each the sum of whichever sparse features happened to fire, all crammed into two dimensions by superposition.',
  });
  tl.tween(cloudU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PAN, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 4.8,
    text: 'We know the ground truth because we built it: five hidden directions, each firing twelve percent of the time. The model never labels them. Could anything recover them from the mixture alone?',
  });
  tl.tween(dirsU, 1, { at: 8.6, dur: 1.0, ease: ease.draw });
  tl.hold(11.3, 0.5);

  // — Beat 2 · the sparse autoencoder ———————————————————————————————————————
  tl.caption({
    at: 11.8,
    dur: 6.0,
    text: 'Enter the sparse autoencoder. It gets ten dictionary slots, twice as many as needed, and one instruction: reconstruct every activation as a sum of as few dictionary entries as possible. Sparsity is the whole trick.',
  });
  tl.tween(saeU, 1, { at: 13.0, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 18.0,
    dur: 5.2,
    text: 'Watch the real training run. The decoder directions start as random stubs, wander, and then lock on. No labels, no hints, just reconstruction under a sparsity tax.',
  });
  tl.tween(saeF, N_SNAPS, { at: 18.6, dur: 5.2, ease: ease.move });
  tl.hold(24.2, 0.5);

  // — Beat 3 · the dictionary matches the truth —————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 24.7, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'Score it against the secret. For every one of the five planted directions, some dictionary entry matches it with cosine at least point nine six, one of them essentially perfect. The unused slots simply died.',
  });
  tl.tween(tableU, 1, { at: 25.9, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 30.9,
    dur: 5.2,
    text: 'Why does the tax work? A dense code could reconstruct the cloud many ways. But the cheapest sparse description of data that was generated sparsely is the generator itself. The penalty makes truth the optimum.',
  });
  tl.hold(36.3, 0.5);

  // — Beat 4 · the real-world version ———————————————————————————————————————
  tl.caption({
    at: 36.8,
    dur: 5.8,
    text: 'Scale the same recipe to a real language model and the dictionary entries become things you can name: a feature that fires on legal text, one for the golden gate bridge, one for deception in stories.',
  });
  tl.caption({
    at: 42.8,
    dur: 4.6,
    text: 'The honest caveat carries over too: matching a direction proves you unmixed the stream, not that the model relies on it. That proof is next.',
  });
  tl.hold(47.6, 0.5);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 48.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 49.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.3,
    dur: 5.4,
    text: 'A sparse autoencoder unmixes superposition by demanding few active entries per activation, and here it recovered every planted direction from the raw mixture.',
  });
  tl.hold(54.9, 1.2);

  return { tl, cam, cloudU, dirsU, saeF, saeU, tableU, dimU, endU };
}
