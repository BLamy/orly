import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Data Parallelism and the Ring — all-reduce, actually simulated.
 *
 * 4 devices each hold the full model but computed gradients on different
 * data, so their gradient vectors disagree and must be summed. We simulate
 * the ring all-reduce EXACTLY at module scope on real seeded gradients
 * (4 chunks per device): 3 reduce-scatter steps in which device i sends one
 * chunk to its right neighbor which adds it in place, then 3 all-gather
 * steps that circulate the finished sums. After 2(N-1) = 6 steps every
 * device's every chunk equals the true sum — asserted numerically below.
 *
 * The bandwidth ledger (computed from chapter one's 12.24 GB of gradients):
 * naive all-to-all: each device sends (N-1)·G = 36.7 GB. Ring: each device
 * sends 2(N-1)/N · G = 18.4 GB — and per-device traffic stays ~2G no matter
 * how many devices join the ring. At 900 GB/s that is ~20 ms per step.
 */

export const N = 4; // devices
export const C = 4; // chunks
const rand = mulberry32(71);
/** initial per-device chunk gradient values (one scalar standing for a chunk) */
export const G0: number[][] = Array.from({ length: N }, () =>
  Array.from({ length: C }, () => Math.round((rand() * 2 - 1) * 10) / 10),
);
export const TRUE_SUM: number[] = Array.from({ length: C }, (_, c) =>
  Math.round(G0.reduce((a, dev) => a + dev[c], 0) * 10) / 10,
);

export interface StepRec {
  /** chunk values per device AFTER this step */
  vals: number[][];
  /** for each device: which chunk index it sent this step (to device (i+1)%N) */
  sent: number[];
  phase: 'reduce' | 'gather';
}
export const STEPS: StepRec[] = (() => {
  const vals = G0.map((d) => [...d]);
  const steps: StepRec[] = [];
  // reduce-scatter: at step s, device i sends chunk (i - s + N) % N
  for (let s = 0; s < N - 1; s++) {
    const sent = Array.from({ length: N }, (_, i) => (i - s + N) % N);
    const incoming = sent.map((c, i) => ({ from: i, chunk: c, val: vals[i][c] }));
    for (const m of incoming) {
      const to = (m.from + 1) % N;
      vals[to][m.chunk] = Math.round((vals[to][m.chunk] + m.val) * 10) / 10;
    }
    steps.push({ vals: vals.map((d) => [...d]), sent, phase: 'reduce' });
  }
  // all-gather: at step s, device i sends chunk (i + 1 - s + N) % N (its finished sum)
  for (let s = 0; s < N - 1; s++) {
    const sent = Array.from({ length: N }, (_, i) => (i + 1 - s + N) % N);
    const incoming = sent.map((c, i) => ({ from: i, chunk: c, val: vals[i][c] }));
    for (const m of incoming) {
      const to = (m.from + 1) % N;
      vals[to][m.chunk] = m.val;
    }
    steps.push({ vals: vals.map((d) => [...d]), sent, phase: 'gather' });
  }
  // assert: every device's every chunk equals the true sum
  for (const dev of vals)
    for (let c = 0; c < C; c++)
      if (Math.abs(dev[c] - TRUE_SUM[c]) > 1e-9)
        throw new Error('ring all-reduce simulation failed to converge');
  return steps;
})();

export const G_GB = 12.24; // gradients from chapter one, GB
export const NAIVE_GB = (N - 1) * G_GB; // 36.7
export const RING_GB = ((2 * (N - 1)) / N) * G_GB; // 18.4
export const LINK_GBPS = 900;
export const RING_MS = (RING_GB / LINK_GBPS) * 1000; // ≈ 20 ms

/** device positions on the ring */
export const RING_CX = 400;
export const RING_CY = 330;
export const RING_R = 190;
export const devPos = (i: number): { x: number; y: number } => ({
  x: RING_CX + RING_R * Math.cos((i / N) * 2 * Math.PI - Math.PI / 2),
  y: RING_CY + RING_R * Math.sin((i / N) * 2 * Math.PI - Math.PI / 2),
});

export const LED_X = 830;
export const LED_Y0 = 170;

export const CAM_RING: CameraState = { x: 430, y: 330, k: 1.2 };
export const CAM_LEDGER: CameraState = { x: 860, y: 300, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>; // devices + chunk tables reveal
  step: ChannelRef<number>; // 0..6 — fractional = packet in flight
  doneU: ChannelRef<number>; // all-equal highlight
  ledU: ChannelRef<number>; // bandwidth ledger
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const step = tl.channel('step', 0);
  const doneU = tl.channel('doneU', 0);
  const ledU = tl.channel('ledU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the disagreement —————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'The gentlest cut is along the data. Four devices, each holding the entire model, each chewing a different slice of the batch. The catch: they now hold four different gradients, and they must agree before anyone takes a step.',
  });
  tl.tween(cam, CAM_RING, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(ringU, 1, { at: 1.4, dur: 2.0, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 5.0,
    text: 'Each device shows its gradient as four chunks — these are real seeded numbers, and we need every device to end holding the chunk-wise sum of all four.',
  });
  tl.hold(11.5, 0.6);

  // — Beat 2 · reduce-scatter ———————————————————————————————————————————
  tl.caption({
    at: 12.1,
    dur: 5.6,
    text: 'The ring algorithm sends everything clockwise. Phase one, reduce and scatter: each device passes one chunk to its neighbor, and the neighbor adds it into its own copy. Watch the numbers actually accumulate.',
  });
  tl.tween(step, 3, { at: 13.3, dur: 7.5, ease: ease.linear });
  tl.caption({
    at: 18.1,
    dur: 4.6,
    text: 'After three of these steps, the sums are finished — but scattered: each device owns exactly one completed chunk of the total, and only that one.',
  });
  tl.hold(22.9, 0.6);

  // — Beat 3 · all-gather ———————————————————————————————————————————————
  tl.caption({
    at: 23.5,
    dur: 5.2,
    text: 'Phase two, all-gather: keep passing, but now the finished sums circulate unchanged, each taking three hops to visit everyone. No adding, just delivery.',
  });
  tl.tween(step, 6, { at: 24.5, dur: 7.0, ease: ease.linear });
  tl.caption({
    at: 29.1,
    dur: 4.8,
    text: 'Six steps total, and every device now holds the identical summed gradient — check any column. The simulation is exact; the assertion is in the code.',
  });
  tl.tween(doneU, 1, { at: 31.9, dur: 0.9, ease: ease.pop });
  tl.hold(34.1, 0.6);

  // — Beat 4 · the bandwidth ledger —————————————————————————————————————
  tl.tween(cam, CAM_LEDGER, { at: 34.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 35.1,
    dur: 5.6,
    text: 'Why the ring shape? The ledger, using chapter one’s twelve gigabytes of gradients. Naive everyone-to-everyone: each device ships thirty seven gigabytes. The ring: eighteen — two gigabytes of traffic per gigabyte of gradient, no matter how many devices join.',
    tex: '\\tfrac{2(N-1)}{N} \\cdot G \\to 2G',
  });
  tl.tween(ledU, 1, { at: 36.1, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 41.1,
    dur: 5.0,
    text: 'At nine hundred gigabytes per second of interconnect, that is roughly twenty milliseconds of pure communication for every training step — the heartbeat tax of data parallelism.',
  });
  tl.hold(46.3, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 46.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 47.5, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 48.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.7,
    dur: 5.2,
    text: 'But notice what data parallelism never touched: every device still stores the entire ninety eight gigabyte tower. It splits the work, not the model. To split the model itself, we cut into the matrices — next chapter.',
  });
  tl.hold(54.1, 1.2);

  return { tl, cam, ringU, step, doneU, ledU, dimU, endU };
}
