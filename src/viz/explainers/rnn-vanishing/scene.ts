import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * RNNs and the Vanishing Gradient.
 *
 * A REAL scalar recurrent net run at module scope: h_t = tanh(w·h_{t-1} + u·x_t)
 * over 20 seeded inputs. The gradient of the last state with respect to each
 * earlier state is the exact product of Jacobians ∏ w·(1 − h_k²) — computed
 * here, not sketched. With w = 0.9 the signal from step one reaches step
 * twenty at under one percent strength (measured: ~0.008). Cranking w up
 * doesn't save you: tanh saturates and the product dies even faster
 * (w = 1.6 → ~3e-9). Closed-form linear-regime curves 0.9^k vs 1.1^k show the
 * knife's edge.
 */

export const T_STEPS = 20;
export const W_REC = 0.9;
export const U_IN = 0.5;

const rand = mulberry32(7);
export const INPUTS: number[] = Array.from({ length: T_STEPS }, () => rand() * 2 - 1);

function runRnn(w: number, u: number): number[] {
  let h = 0;
  const hs = [h];
  for (const x of INPUTS) {
    h = Math.tanh(w * h + u * x);
    hs.push(h);
  }
  return hs;
}

/** Hidden states h_0..h_20 of the real run. */
export const HS: number[] = runRnn(W_REC, U_IN);

/** |∂h_T/∂h_t| for t = T..0 — exact product of Jacobians, back through time. */
function gradsBack(w: number, hs: number[]): number[] {
  const out = [1];
  for (let k = hs.length - 1; k >= 1; k--) {
    out.push(out[out.length - 1] * w * (1 - hs[k] * hs[k]));
  }
  return out.map(Math.abs);
}

/** GRADS[d] = gradient magnitude d steps back from the end (w = 0.9 run). */
export const GRADS: number[] = gradsBack(W_REC, HS);
/** Same net with w = 1.6 — saturation kills gradients even faster. */
export const HS_BIG: number[] = runRnn(1.6, U_IN);
export const GRADS_BIG: number[] = gradsBack(1.6, HS_BIG);

export const FINAL_GRAD = GRADS[T_STEPS]; // ≈ 0.0082
export const FINAL_GRAD_BIG = GRADS_BIG[T_STEPS]; // ≈ 2.6e-9

// ---------------------------------------------------------------------------
// Stage layout — the unrolled chain across the top, the gradient bars below.
// ---------------------------------------------------------------------------

export const CHAIN_Y = 200;
export const CELL_W = 56;
export const CHAIN_X0 = 78;
export const cellX = (t: number): number => CHAIN_X0 + t * CELL_W;

export const BAR_Y0 = 520; // baseline of gradient bars
export const BAR_H = 210; // max bar height (log scaled in render)

export const CAM_CHAIN: CameraState = { x: 640, y: 250, k: 1.12 };
export const CAM_TAIL: CameraState = { x: 300, y: 330, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  chainU: ChannelRef<number>; // draw-on of the unrolled cells
  flowU: ChannelRef<number>; // forward packet 0..T
  gradU: ChannelRef<number>; // backward sweep 0..T (bars grow right-to-left)
  jacU: ChannelRef<number>; // the Jacobian-product formula
  bigU: ChannelRef<number>; // overlay the w = 1.6 run
  curveU: ChannelRef<number>; // closed-form 0.9^k vs 1.1^k inset
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chainU = tl.channel('chainU', 0);
  const flowU = tl.channel('flowU', 0);
  const gradU = tl.channel('gradU', 0);
  const jacU = tl.channel('jacU', 0);
  const bigU = tl.channel('bigU', 0);
  const curveU = tl.channel('curveU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the promise of recurrence ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Before transformers, sequences were read one step at a time. A recurrent network carries a single hidden state, folding each new input into everything it has seen so far.',
  });
  tl.tween(chainU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_CHAIN, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'Here is a real one, unrolled: twenty steps of the same little cell, each squashing its memory and the next input through a tanh. Watch the state ripple forward.',
  });
  tl.tween(flowU, T_STEPS, { at: 7.0, dur: 4.6, ease: ease.linear });
  tl.hold(11.9, 0.7);

  // — Beat 2 · learning means going backward ————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: 'To learn, blame has to travel the other way. If step twenty got something wrong, how much was step one responsible? The answer is a chain of multiplications, one per step.',
    tex: '\\frac{\\partial h_T}{\\partial h_t} = \\prod_{k=t+1}^{T} w\\,(1 - h_k^2)',
  });
  tl.tween(jacU, 1, { at: 13.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 18.4,
    dur: 5.4,
    text: 'Every factor in that product is the recurrent weight times the slope of the tanh, and the slope is always less than one. Multiply twenty numbers below one and you get almost nothing.',
  });
  tl.hold(23.9, 0.6);

  // — Beat 3 · watch the gradient die ————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 24.5, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'These bars are the actual gradient magnitudes from this run, on a log scale, sweeping back from the end. One step back, ninety percent survives. Twenty steps back, less than one percent.',
  });
  tl.tween(gradU, T_STEPS, { at: 25.6, dur: 5.4, ease: ease.linear });
  tl.caption({
    at: 31.1,
    dur: 5.2,
    text: 'That is the vanishing gradient. The network can still see the distant past — the state is right there — but it can no longer learn from it. Blame starves before it arrives.',
  });
  tl.hold(36.4, 0.6);

  // — Beat 4 · bigger weights make it worse ————————————————————————————
  tl.caption({
    at: 37.0,
    dur: 5.8,
    text: 'The obvious fix fails. Crank the recurrent weight up to one point six and the tanh saturates: its slope collapses toward zero, and the same run now delivers a billionth of the signal.',
  });
  tl.tween(bigU, 1, { at: 37.6, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 43.0,
    dur: 5.6,
    text: 'You are trapped on a knife edge. In the linear regime the product behaves like the weight raised to the number of steps: below one it vanishes, above one it explodes. Neither trains.',
    tex: 'w^{20}:\\;\\; 0.9^{20} \\approx 0.12 \\quad 1.1^{20} \\approx 6.7',
  });
  tl.tween(curveU, 1, { at: 43.6, dur: 1.4, ease: ease.draw });
  tl.hold(48.8, 0.6);

  // — Beat 5 · the moral ———————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 49.4, dur: 1.1, ease: ease.move });
  tl.tween(jacU, 0, { at: 49.4, dur: 0.8, ease: ease.move });
  tl.tween(curveU, 0, { at: 49.4, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.6,
    dur: 5.8,
    text: 'Every long dependency has to survive this gauntlet of multiplications. The rest of this book is a tour of the escape routes: gates that protect memory, and attention that skips the chain entirely.',
  });
  tl.hold(56.6, 1.2);

  return { tl, cam, chainU, flowU, gradU, jacU, bigU, curveU, dimU, endU };
}
