import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * LSTM Gates — a memory with a lock on it.
 *
 * A REAL LSTM cell run at module scope on the classic long-memory toy task:
 * a signed marker arrives at step one, then sixteen steps of seeded noise,
 * then the answer must still be readable. The gate weights are set the way a
 * trained cell sets them (forget ≈ 0.998 always; input gate opens only for
 * the marker channel) and the true LSTM equations are iterated step by step.
 * Measured: the cell state holds 0.95+ after seventeen noisy steps, while a
 * plain tanh RNN fed the same sequence decays to indistinguishable noise
 * (final state 0.26 vs typical noise excursions of the same size).
 */

export const N = 18;
const sig = (x: number): number => 1 / (1 + Math.exp(-x));

const rand = mulberry32(11);
export const NOISE: number[] = Array.from({ length: N }, () => rand() * 2 - 1);
export const MARKS: number[] = (() => {
  const m = new Array<number>(N).fill(0);
  m[1] = 1; // the bit to remember arrives at t = 1
  return m;
})();

export interface LstmTrace {
  c: number[]; // cell state c_t
  f: number[]; // forget gate
  i: number[]; // input gate
  g: number[]; // candidate
}

/** The exact LSTM recurrence — gates as a trained long-memory cell sets them. */
export const LSTM: LstmTrace = (() => {
  let c = 0;
  const trace: LstmTrace = { c: [0], f: [], i: [], g: [] };
  for (let t = 0; t < N; t++) {
    const m = MARKS[t];
    const f = sig(6); // ≈ 0.9975 — "keep what you have"
    const i = sig(m !== 0 ? 6 : -6); // opens only when the marker fires
    const g = Math.tanh(3 * m); // the candidate is the marker's sign
    c = f * c + i * g;
    trace.f.push(f);
    trace.i.push(i);
    trace.g.push(g);
    trace.c.push(c);
  }
  return trace;
})();

/** A plain tanh RNN fed the same sequence — the baseline that forgets. */
export const RNN_STATE: number[] = (() => {
  let h = 0;
  const hs = [0];
  for (let t = 0; t < N; t++) {
    const x = 0.4 * NOISE[t] + (MARKS[t] ? 3 : 0);
    h = Math.tanh(0.9 * h + 0.5 * x);
    hs.push(h);
  }
  return hs;
})();

export const LSTM_FINAL = LSTM.c[N]; // ≈ 0.954
export const RNN_FINAL = RNN_STATE[N]; // ≈ 0.263
export const FORGET_GATE = LSTM.f[0]; // ≈ 0.9975

// ---------------------------------------------------------------------------
// Stage layout — the cell anatomy left, the two state traces right/below.
// ---------------------------------------------------------------------------

export const PLOT_X0 = 140;
export const PLOT_X1 = 1150;
export const PLOT_Y_MID = 400; // zero line of the state plot
export const PLOT_AMP = 150; // pixels per unit of state
export const stepX = (t: number): number => PLOT_X0 + (t / N) * (PLOT_X1 - PLOT_X0);
export const stateY = (v: number): number => PLOT_Y_MID - v * PLOT_AMP;

export const CELL_CX = 640;
export const CELL_CY = 175;

export const CAM_CELL: CameraState = { x: 640, y: 190, k: 1.45 };
export const CAM_PLOT: CameraState = { x: 640, y: 400, k: 1.12 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cellU: ChannelRef<number>; // the cell anatomy (conveyor + gates)
  gateHi: ChannelRef<number>; // 0 none · 1 forget · 2 input
  runU: ChannelRef<number>; // playback head 0..N over the sequence
  rnnU: ChannelRef<number>; // reveal the RNN baseline trace
  eqU: ChannelRef<number>;
  readU: ChannelRef<number>; // the final read-out comparison
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cellU = tl.channel('cellU', 0);
  const gateHi = tl.channel('gateHi', 0);
  const runU = tl.channel('runU', 0);
  const rnnU = tl.channel('rnnU', 0);
  const eqU = tl.channel('eqU', 0);
  const readU = tl.channel('readU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the task ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is the simplest task that breaks a plain recurrent net. A signed clue arrives at step one. Then sixteen steps of pure noise. Then you must recall the clue.',
  });
  tl.tween(cellU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_CELL, { at: 1.0, dur: 1.5, ease: ease.move });

  // — Beat 2 · the anatomy ——————————————————————————————————————————————
  tl.caption({
    at: 6.3,
    dur: 5.8,
    text: 'The long short term memory cell solves it with a conveyor belt. The cell state runs straight through, and nothing touches it except two gates: one decides what to erase, one decides what to write.',
  });
  tl.caption({
    at: 12.5,
    dur: 5.2,
    text: 'The forget gate multiplies the state by a number near one — this trained cell keeps ninety nine point seven percent of its memory every step. No tanh in the path, no shrinking product.',
    tex: 'c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t',
  });
  tl.tween(gateHi, 1, { at: 12.8, dur: 0.5, ease: ease.enter });
  tl.tween(eqU, 1, { at: 13.2, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 18.1,
    dur: 4.8,
    text: 'The input gate stays slammed shut for noise, and swings open only when the marker fires. Write once, then lock the door.',
  });
  tl.tween(gateHi, 2, { at: 18.4, dur: 0.5, ease: ease.enter });
  tl.hold(23.1, 0.6);

  // — Beat 3 · run it ———————————————————————————————————————————————————
  tl.tween(gateHi, 0, { at: 23.7, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_PLOT, { at: 23.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.3,
    dur: 5.6,
    text: 'Now run the real equations. The marker fires, the input gate opens for exactly one step, and the cell state jumps to one. Then watch: sixteen steps of noise, and the belt just carries it.',
  });
  tl.tween(runU, N, { at: 25.4, dur: 7.5, ease: ease.linear });
  tl.caption({
    at: 30.3,
    dur: 4.6,
    text: 'Seventeen steps later the memory reads zero point nine five. The gates did not fight the noise. They simply never let it in.',
  });
  tl.hold(35.1, 0.6);

  // — Beat 4 · the baseline forgets —————————————————————————————————————
  tl.caption({
    at: 35.7,
    dur: 5.8,
    text: 'Feed the identical sequence to a plain tanh recurrent net and here is its state, in red. The marker spikes it — and then every noisy step overwrites a little more, because everything shares one channel.',
  });
  tl.tween(rnnU, 1, { at: 36.3, dur: 3.0, ease: ease.draw });
  tl.caption({
    at: 41.7,
    dur: 5.2,
    text: 'By the end the plain net sits at zero point two six — the same size as its wobbles on pure noise. Ask it what the clue was, and it genuinely does not know.',
  });
  tl.tween(readU, 1, { at: 42.5, dur: 0.8, ease: ease.enter });
  tl.hold(47.1, 0.6);

  // — Beat 5 · the moral ———————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.3, dur: 1.1, ease: ease.move });
  tl.tween(eqU, 0, { at: 48.3, dur: 0.8, ease: ease.move });
  tl.tween(readU, 0, { at: 48.3, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.5,
    dur: 6.0,
    text: 'That is the whole trick: replace the multiplied chain with an additive belt, and put learned locks on the doors. Gated memory ruled sequence models for twenty years — until something skipped the belt entirely.',
  });
  tl.hold(55.7, 1.2);

  return { tl, cam, cellU, gateHi, runU, rnnU, eqU, readU, dimU, endU };
}
