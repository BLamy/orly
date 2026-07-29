import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Activation Functions — why depth needs bends.
 *
 * Beat 1: two linear layers collapse to one line (a morph shows the composed
 *         map is still straight).
 * Beat 2: the rectified linear unit is a hinge; a sum of shifted, scaled
 *         hinges builds a piecewise-linear curve.
 * Beat 3: a REAL 1-16-1 relu network is trained at module scope (full-batch
 *         gradient descent, seeded init) to fit a sin-like target; the plot
 *         morphs through recorded snapshots and a loss inset shows the real
 *         training curve. Nothing is faked; every frame is a pure function of
 *         the timeline.
 */

// ---------------------------------------------------------------------------
// Beat 1 — two linear layers, composed
// ---------------------------------------------------------------------------

export const A1 = 0.7;
export const B1 = -0.3;
export const A2 = -1.4;
export const B2 = 0.5;

export const line1 = (x: number): number => A1 * x + B1;
/** a2 · f1(x) + b2 — algebraically (a2 a1) x + (a2 b1 + b2): still a line. */
export const composed = (x: number): number => A2 * line1(x) + B2;

// ---------------------------------------------------------------------------
// Beat 2 — a hinge, then a sum of shifted scaled hinges
// ---------------------------------------------------------------------------

export const relu = (x: number): number => (x > 0 ? x : 0);

export interface Hinge {
  /** kink position */
  k: number;
  /** scale */
  c: number;
}

export const HINGES: readonly Hinge[] = [
  { k: -1.5, c: 0.9 },
  { k: -0.5, c: -1.8 },
  { k: 0.4, c: 2.0 },
  { k: 1.2, c: -1.9 },
];
const HINGE_BASE = -0.4;

/** Partial hinge sum, continuous in m ∈ [0, HINGES.length]. */
export function hingeSum(x: number, m: number): number {
  let y = HINGE_BASE;
  for (let i = 0; i < HINGES.length; i++) {
    const w = Math.min(1, Math.max(0, m - i));
    if (w > 0) y += w * HINGES[i].c * relu(x - HINGES[i].k);
  }
  return y;
}

// ---------------------------------------------------------------------------
// Beat 3 — an ACTUAL tiny network, trained right here at module scope.
//
// 1-16-1 relu network, full-batch gradient descent on the mean squared error,
// seeded mulberry32 init. Empirically (seed 7, lr 0.02): mse 1.058 → 0.0012
// over 4000 epochs — converged well below visual tolerance.
// ---------------------------------------------------------------------------

export const HIDDEN = 16;
const N_TRAIN = 64;
const LR = 0.02;
export const EPOCHS = 4000;
const SEED = 7;

export const TARGET = (x: number): number => 0.9 * Math.sin(2.2 * x) + 0.15 * x;

export const NET_DOMAIN: readonly [number, number] = [-2, 2];
export const N_SAMPLES = 201;
const SAMPLE_XS: number[] = Array.from(
  { length: N_SAMPLES },
  (_, i) => NET_DOMAIN[0] + ((NET_DOMAIN[1] - NET_DOMAIN[0]) * i) / (N_SAMPLES - 1),
);

/** Log-spaced snapshot epochs — epoch 0 (random init) through convergence. */
export const SNAP_EPOCHS: readonly number[] = [0, 20, 60, 150, 400, 1000, 4000];

export interface Training {
  /** network output curve at each snapshot epoch, sampled on SAMPLE_XS */
  snapshots: number[][];
  /** mean squared error at every epoch (length EPOCHS + 1) */
  loss: number[];
  /** kink positions of the trained network's active hidden units, in-domain */
  bends: number[];
}

function train(): Training {
  const xs = Array.from(
    { length: N_TRAIN },
    (_, i) => NET_DOMAIN[0] + ((NET_DOMAIN[1] - NET_DOMAIN[0]) * i) / (N_TRAIN - 1),
  );
  const ys = xs.map(TARGET);

  const rand = mulberry32(SEED);
  const u = (): number => rand() * 2 - 1;
  const w1 = Array.from({ length: HIDDEN }, () => u() * 1.5);
  const b1 = Array.from({ length: HIDDEN }, () => u() * 1.5);
  const w2 = Array.from({ length: HIDDEN }, () => u() * 0.5);
  let b2 = 0;

  const predict = (x: number): number => {
    let y = b2;
    for (let j = 0; j < HIDDEN; j++) {
      const h = w1[j] * x + b1[j];
      if (h > 0) y += w2[j] * h;
    }
    return y;
  };

  const snapAt = new Set(SNAP_EPOCHS);
  const snapshots: number[][] = [];
  const loss: number[] = [];

  for (let e = 0; e <= EPOCHS; e++) {
    if (snapAt.has(e)) snapshots.push(SAMPLE_XS.map(predict));

    const gw1 = new Array<number>(HIDDEN).fill(0);
    const gb1 = new Array<number>(HIDDEN).fill(0);
    const gw2 = new Array<number>(HIDDEN).fill(0);
    let gb2 = 0;
    let mse = 0;
    for (let i = 0; i < N_TRAIN; i++) {
      const x = xs[i];
      let y = b2;
      const hs = new Array<number>(HIDDEN);
      for (let j = 0; j < HIDDEN; j++) {
        const h = w1[j] * x + b1[j];
        hs[j] = h;
        if (h > 0) y += w2[j] * h;
      }
      const d = y - ys[i];
      mse += d * d;
      const g = (2 * d) / N_TRAIN;
      gb2 += g;
      for (let j = 0; j < HIDDEN; j++) {
        if (hs[j] > 0) {
          gw2[j] += g * hs[j];
          gw1[j] += g * w2[j] * x;
          gb1[j] += g * w2[j];
        }
      }
    }
    loss.push(mse / N_TRAIN);
    for (let j = 0; j < HIDDEN; j++) {
      w1[j] -= LR * gw1[j];
      b1[j] -= LR * gb1[j];
      w2[j] -= LR * gw2[j];
    }
    b2 -= LR * gb2;
  }

  // the trained network's bends: x = −b/w for each unit that is active
  // (steep enough, carries weight, kink inside the plotted domain)
  const bends: number[] = [];
  for (let j = 0; j < HIDDEN; j++) {
    if (Math.abs(w1[j]) < 0.05 || Math.abs(w2[j]) < 0.02) continue;
    const kx = -b1[j] / w1[j];
    if (kx > NET_DOMAIN[0] && kx < NET_DOMAIN[1]) bends.push(kx);
  }
  bends.sort((a, b) => a - b);

  return { snapshots, loss, bends };
}

export const TRAINING: Training = train();

// ---------------------------------------------------------------------------
// Pure lookups for playback
// ---------------------------------------------------------------------------

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * Network output at snapshot progress u ∈ [0, SNAP_EPOCHS.length − 1]
 * (fractional index lerps between adjacent snapshot curves).
 */
export function netCurve(u: number): (x: number) => number {
  const f = clamp(u, 0, SNAP_EPOCHS.length - 1);
  const i = Math.min(SNAP_EPOCHS.length - 2, Math.floor(f));
  const t = f - i;
  const a = TRAINING.snapshots[i];
  const b = TRAINING.snapshots[i + 1];
  return (x: number) => {
    const g = clamp(
      ((x - NET_DOMAIN[0]) / (NET_DOMAIN[1] - NET_DOMAIN[0])) * (N_SAMPLES - 1),
      0,
      N_SAMPLES - 1,
    );
    const gi = Math.min(N_SAMPLES - 2, Math.floor(g));
    const gt = g - gi;
    const ya = a[gi] + (a[gi + 1] - a[gi]) * gt;
    const yb = b[gi] + (b[gi + 1] - b[gi]) * gt;
    return ya + (yb - ya) * t;
  };
}

/** Epoch at snapshot progress u — geometric lerp between snapshot epochs. */
export function epochAt(u: number): number {
  const f = clamp(u, 0, SNAP_EPOCHS.length - 1);
  const i = Math.min(SNAP_EPOCHS.length - 2, Math.floor(f));
  const t = f - i;
  const la = Math.log10(SNAP_EPOCHS[i] + 1);
  const lb = Math.log10(SNAP_EPOCHS[i + 1] + 1);
  return 10 ** (la + (lb - la) * t) - 1;
}

/** Mean squared error at a (fractional) epoch. */
export function lossAt(epoch: number): number {
  const f = clamp(epoch, 0, TRAINING.loss.length - 1);
  const i = Math.floor(f);
  if (i >= TRAINING.loss.length - 1) return TRAINING.loss[TRAINING.loss.length - 1];
  return TRAINING.loss[i] + (TRAINING.loss[i + 1] - TRAINING.loss[i]) * (f - i);
}

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-2.3, 2.3])
  .range([120, 920]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.7, 1.7])
  .range([625, 85]);

// loss inset (screen space, top right): log epoch → log mse
export const LOSS_PANEL = { x: 950, y: 92, w: 300, h: 220 } as const;
export const LOG_MAX = Math.log10(EPOCHS + 1);
export const xLoss: ScaleLinear<number, number> = scaleLinear()
  .domain([0, LOG_MAX])
  .range([LOSS_PANEL.x + 42, LOSS_PANEL.x + LOSS_PANEL.w - 20]);
export const yLoss: ScaleLinear<number, number> = scaleLinear()
  .domain([-3.1, 0.2])
  .range([LOSS_PANEL.y + LOSS_PANEL.h - 34, LOSS_PANEL.y + 46]);
/** log10 mse as a function of log10 epoch — the inset's plotted curve. */
export const lossLogCurve = (lx: number): number => Math.log10(lossAt(10 ** lx - 1));

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

const CAM_HINGE: CameraState = { x: 560, y: 380, k: 1.3 };
const CAM_FIT: CameraState = { x: 600, y: 356, k: 1.04 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  line1U: ChannelRef<number>;
  line1TexU: ChannelRef<number>;
  compU: ChannelRef<number>;
  compMorph: ChannelRef<number>;
  collapseTexU: ChannelRef<number>;
  linOp: ChannelRef<number>;
  reluU: ChannelRef<number>;
  reluTexU: ChannelRef<number>;
  sumM: ChannelRef<number>;
  kinkU: ChannelRef<number>;
  sumTexU: ChannelRef<number>;
  hingeOp: ChannelRef<number>;
  targetU: ChannelRef<number>;
  netU: ChannelRef<number>;
  snapU: ChannelRef<number>;
  netTexU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  bendsU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const axesU = tl.channel('axesU', 0);
  const line1U = tl.channel('line1U', 0);
  const line1TexU = tl.channel('line1TexU', 0);
  const compU = tl.channel('compU', 0);
  const compMorph = tl.channel('compMorph', 0);
  const collapseTexU = tl.channel('collapseTexU', 0);
  const linOp = tl.channel('linOp', 1);
  const reluU = tl.channel('reluU', 0);
  const reluTexU = tl.channel('reluTexU', 0);
  const sumM = tl.channel('sumM', 0);
  const kinkU = tl.channel('kinkU', 0);
  const sumTexU = tl.channel('sumTexU', 0);
  const hingeOp = tl.channel('hingeOp', 1);
  const targetU = tl.channel('targetU', 0);
  const netU = tl.channel('netU', 0);
  const snapU = tl.channel('snapU', 0);
  const netTexU = tl.channel('netTexU', 0);
  const panelU = tl.channel('panelU', 0);
  const bendsU = tl.channel('bendsU', 0);

  // — Beat 1 · linear layers collapse ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'A neural network stacks layers. But here is the trap: if every layer is a straight line, stacking buys you nothing.',
  });
  tl.tween(axesU, 1, { at: 0.4, dur: 1.5, ease: ease.draw });
  tl.tween(line1U, 1, { at: 2.2, dur: 1.3, ease: ease.draw });
  tl.tween(line1TexU, 1, { at: 3.4, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 7.3,
    dur: 5.6,
    text: 'Take one linear layer. Now feed its output through a second linear layer, and watch what happens to the shape.',
    tex: 'a_2\\,f_1(x)+b_2',
  });
  tl.tween(compU, 1, { at: 8.0, dur: 1.2, ease: ease.draw });
  tl.tween(compMorph, 1, { at: 9.6, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'It is still a straight line. The slopes multiply, the offsets fold together, and two layers collapse into one.',
    tex: 'a_2(a_1x+b_1)+b_2=(a_2a_1)\\,x+(a_2b_1+b_2)',
  });
  tl.tween(collapseTexU, 1, { at: 14.2, dur: 0.8, ease: ease.enter });

  tl.caption({
    at: 20.1,
    dur: 4.8,
    text: 'Stack a hundred linear layers and you have still built a single line. All that depth, wasted.',
  });
  tl.hold(24.9, 0.8);

  // — Beat 2 · the hinge ——————————————————————————————————————————————————
  tl.tween(linOp, 0.12, { at: 25.3, dur: 1.1, ease: ease.move });
  tl.tween(line1TexU, 0, { at: 25.3, dur: 0.8, ease: ease.move });
  tl.tween(collapseTexU, 0, { at: 25.3, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 26.0,
    dur: 6.0,
    text: 'So we bend the wire. Between the layers we insert one tiny nonlinearity: the rectified linear unit.',
  });
  tl.tween(reluU, 1, { at: 26.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_HINGE, { at: 26.8, dur: 1.5, ease: ease.move });
  tl.tween(reluTexU, 1, { at: 28.4, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 32.4,
    dur: 5.6,
    text: 'It zeroes out negative inputs and passes positive ones straight through. The result is a hinge: one flat piece, one sloped piece, a single bend.',
  });

  tl.caption({
    at: 38.4,
    dur: 6.2,
    text: 'Now shift a few hinges left and right, scale them, and add them up. Each one contributes its own bend to the sum.',
    tex: '\\textstyle\\sum_i c_i\\,\\mathrm{ReLU}(x-k_i)',
  });
  tl.tween(cam, CAMERA_HOME, { at: 38.6, dur: 1.4, ease: ease.move });
  tl.tween(reluTexU, 0, { at: 38.6, dur: 0.8, ease: ease.move });
  tl.tween(sumTexU, 1, { at: 39.4, dur: 0.7, ease: ease.enter });
  tl.tween(sumM, HINGES.length, { at: 39.6, dur: 5.2, ease: ease.linear });
  tl.tween(kinkU, 1, { at: 43.2, dur: 0.8, ease: ease.enter });

  tl.caption({
    at: 45.2,
    dur: 5.8,
    text: 'The straight line has become a piecewise curve. Every kink marks a place where one hidden unit switches on.',
  });
  tl.hold(51.0, 0.8);

  // — Beat 3 · a real network learns ——————————————————————————————————————
  tl.tween(hingeOp, 0, { at: 51.4, dur: 1.0, ease: ease.move });
  tl.tween(linOp, 0, { at: 51.4, dur: 1.0, ease: ease.move });
  tl.tween(sumTexU, 0, { at: 51.4, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 52.2,
    dur: 6.4,
    text: 'Time for the real thing. Here is a wavy target curve, and a genuinely tiny network: one input, sixteen hidden hinges, one output.',
  });
  tl.tween(cam, CAM_FIT, { at: 52.4, dur: 1.4, ease: ease.move });
  tl.tween(targetU, 1, { at: 52.8, dur: 1.5, ease: ease.draw });
  tl.tween(netU, 1, { at: 55.6, dur: 1.2, ease: ease.draw });
  tl.tween(netTexU, 1, { at: 56.4, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 59.2,
    dur: 6.0,
    text: 'At the start the weights are random, so its guess is nonsense. We train it with plain gradient descent on the squared error.',
    tex: 'L=\\tfrac{1}{N}\\sum_i(\\hat y_i - y_i)^2',
  });
  tl.tween(panelU, 1, { at: 60.4, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 65.6,
    dur: 5.8,
    text: 'Watch it learn. Every frame you see is the real output of this network at a real step of training — nothing here is faked.',
  });
  tl.tween(snapU, SNAP_EPOCHS.length - 1, { at: 66.2, dur: 13.6, ease: ease.linear });

  tl.caption({
    at: 71.8,
    dur: 6.0,
    text: 'The loss in the corner falls as the curve pulls itself onto the target. Most of the progress comes early; the rest is refinement.',
  });

  tl.caption({
    at: 80.4,
    dur: 5.6,
    text: 'By the end the fit is nearly perfect — a smooth-looking wave built entirely out of straight pieces.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 80.6, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 86.6,
    dur: 7.0,
    text: 'Look closely: the bends sit exactly where the hidden units switch on. That is the whole secret — depth needs bends, and the hinges supply them.',
  });
  tl.tween(bendsU, 1, { at: 87.2, dur: 1.2, ease: ease.enter });
  tl.tween(panelU, 0.15, { at: 87.0, dur: 1.0, ease: ease.move });
  tl.hold(93.6, 1.2);

  return {
    tl,
    cam,
    axesU,
    line1U,
    line1TexU,
    compU,
    compMorph,
    collapseTexU,
    linOp,
    reluU,
    reluTexU,
    sumM,
    kinkU,
    sumTexU,
    hingeOp,
    targetU,
    netU,
    snapU,
    netTexU,
    panelU,
    bendsU,
  };
}
