import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Cutting the Model — tensor and pipeline parallelism, both computed.
 *
 * Tensor parallelism: a REAL toy matmul at module scope. X is 2×4, W is 4×4
 * (seeded one-decimal values). Split W by columns across two devices: device
 * A computes X·W[:, 0..1], device B computes X·W[:, 2..3]. Concatenating
 * their outputs equals the full X·W exactly — asserted below. Each device
 * stores HALF the matrix; the price is an activation exchange at the seam.
 *
 * Pipeline parallelism: cut by depth into 4 stages. The schedule grid is
 * computed for m microbatches: bubble fraction = (p-1)/(m+p-1).
 *   m=1 → 75% idle · m=8 → 27.3% · m=32 → 8.8%.
 */

const rand = mulberry32(91);
const rnd = (): number => Math.round((rand() * 2 - 1) * 10) / 10;
export const X: number[][] = Array.from({ length: 2 }, () => Array.from({ length: 4 }, rnd));
export const W: number[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, rnd));
const matmul = (A: number[][], B: number[][], c0: number, c1: number): number[][] =>
  A.map((row) =>
    Array.from({ length: c1 - c0 }, (_, jj) => {
      const j = c0 + jj;
      let s = 0;
      for (let k = 0; k < B.length; k++) s += row[k] * B[k][j];
      return Math.round(s * 100) / 100;
    }),
  );
export const Y_FULL: number[][] = matmul(X, W, 0, 4);
export const Y_A: number[][] = matmul(X, W, 0, 2); // device A: columns 0–1
export const Y_B: number[][] = matmul(X, W, 2, 4); // device B: columns 2–3
// assert the split reproduces the full product exactly
for (let i = 0; i < 2; i++)
  for (let j = 0; j < 4; j++) {
    const split = j < 2 ? Y_A[i][j] : Y_B[i][j - 2];
    if (Math.abs(split - Y_FULL[i][j]) > 1e-9) throw new Error('tensor split mismatch');
  }

export const P_STAGES = 4;
export const bubbleFrac = (m: number): number => (P_STAGES - 1) / (m + P_STAGES - 1);
export const MS = [1, 8, 32] as const;
// schedule for m=8: cell (stage, t) busy iff t in [stage, stage+m)
export const M_SHOW = 8;
export const T_SLOTS = M_SHOW + P_STAGES - 1; // 11

// ---------------------------------------------------------------------------
// Layout — matrices top, pipeline schedule bottom.
// ---------------------------------------------------------------------------

export const MAT_Y = 150;
export const CELL = 34;
export const MX_X = 120; // X position
export const MW_X = 330; // W position
export const MY_X = 620; // Y position

export const PL_X0 = 150;
export const PL_Y0 = 420;
export const PL_CW = 62;
export const PL_CH = 34;

export const CAM_MAT: CameraState = { x: 520, y: 240, k: 1.2 };
export const CAM_PIPE: CameraState = { x: 560, y: 470, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  matU: ChannelRef<number>; // X and W reveal
  splitU: ChannelRef<number>; // W halves colorize
  yU: ChannelRef<number>; // 0..8 output cells fill (device A then B)
  seamU: ChannelRef<number>; // the activation-exchange seam
  pipeU: ChannelRef<number>; // schedule grid reveal (0..T_SLOTS)
  mSweep: ChannelRef<number>; // 0..2 across MS
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const matU = tl.channel('matU', 0);
  const splitU = tl.channel('splitU', 0);
  const yU = tl.channel('yU', 0);
  const seamU = tl.channel('seamU', 0);
  const pipeU = tl.channel('pipeU', 0);
  const mSweep = tl.channel('mSweep', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · cut inside the matrix ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Data parallelism copied the model. Now we cut the model itself — and the first cut goes inside a single matrix multiply. Here is a real one: an input of two rows times a four by four weight matrix.',
  });
  tl.tween(cam, CAM_MAT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(matU, 1, { at: 1.4, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 5.4,
    text: 'Split the weight matrix by columns: the blue half lives on device A, the violet half on device B. Neither device ever stores the other half. Both receive the same input.',
  });
  tl.tween(splitU, 1, { at: 7.1, dur: 1.2, ease: ease.enter });
  tl.hold(11.9, 0.5);

  // — Beat 2 · compute it ———————————————————————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 5.4,
    text: 'Each device computes its own columns of the output — watch the numbers land. Concatenate the two halves and you get exactly the full product, to the last decimal. The assertion is in the code.',
  });
  tl.tween(yU, 8, { at: 13.2, dur: 4.5, ease: ease.linear });
  tl.caption({
    at: 18.0,
    dur: 5.2,
    text: 'The price appears at the seam: the very next operation needs the whole output row, so the halves must be exchanged — an all-reduce inside every single layer, on the fast local links between the two devices.',
  });
  tl.tween(seamU, 1, { at: 19.4, dur: 0.9, ease: ease.enter });
  tl.hold(23.4, 0.6);

  // — Beat 3 · cut along depth ——————————————————————————————————————————
  tl.tween(cam, CAM_PIPE, { at: 24.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.4,
    dur: 5.4,
    text: 'The other cut is along depth: stage one takes the first eight layers, stage two the next eight, and a batch flows through like an assembly line. Simple — and naively, catastrophic.',
  });
  tl.tween(pipeU, 1, { at: 25.4, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 30.0,
    dur: 5.0,
    text: 'With one batch in flight, each of four stages works a quarter of the time and idles for the rest: seventy five percent of the cluster doing nothing. Those idle cells are the pipeline bubble.',
  });
  tl.hold(35.2, 0.5);
  tl.caption({
    at: 35.7,
    dur: 5.6,
    text: 'The fix: slice the batch into microbatches and keep them marching. With eight in flight the schedule fills in, and the bubble shrinks to twenty seven percent — computed as pipeline depth minus one, over microbatches plus depth minus one.',
    tex: '\\text{bubble} = \\tfrac{p-1}{m+p-1}',
  });
  tl.tween(mSweep, 1, { at: 36.7, dur: 2.0, ease: ease.move });
  tl.caption({
    at: 41.5,
    dur: 4.6,
    text: 'Push to thirty two microbatches and the bubble is under nine percent. More slices, smaller bubble — bounded below by that stubborn pipeline fill and drain.',
  });
  tl.tween(mSweep, 2, { at: 42.3, dur: 1.6, ease: ease.move });
  tl.hold(46.3, 0.6);

  // — Beat 4 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 46.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 47.5, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 48.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.7,
    dur: 5.4,
    text: 'Two cuts, two prices: tensor parallelism chats constantly inside each layer, pipeline parallelism pays in idle bubbles at the ends. Real clusters use both at once — plus one more trick that shards the optimizer itself. Next.',
  });
  tl.hold(54.3, 1.2);

  return { tl, cam, matU, splitU, yU, seamU, pipeU, mSweep, dimU, endU };
}
