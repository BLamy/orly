import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Catastrophic Forgetting — fine-tune on B, lose A.
 *
 * A REAL neural network trained at module scope: a 1–24–1 tanh MLP, full
 * batch gradient descent. Task A is a sine wave on the left half of the
 * axis; task B a different wave on the right. Training: 3000 steps on A
 * (loss on A converges to 0.0002), then 3000 steps of fine-tuning on B ONLY —
 * loss on A climbs to 3.36 while B reaches 0.001: the net repurposes the same
 * hidden units and the left half of the function is destroyed. The
 * mitigation run (replay: B plus one third of A's points mixed in) reaches
 * B ≈ 0.006 while holding A at 0.009. Function snapshots and loss curves are
 * recorded during training and replayed exactly.
 */

export const H = 24;
export const X_MIN = -2;
export const X_MAX = 2;
export const N_PLOT = 160;

const fA = (x: number): number => Math.sin(2.2 * x);
const fB = (x: number): number => -Math.sin(2.2 * x) + 0.5;

export const XA: number[] = Array.from({ length: 24 }, (_, i) => -2 + (2 * i) / 23);
export const YA: number[] = XA.map(fA);
export const XB: number[] = Array.from({ length: 24 }, (_, i) => (2 * i) / 23);
export const YB: number[] = XB.map(fB);

interface Net {
  W1: number[];
  b1: number[];
  W2: number[];
  b2: number;
}

const rand = mulberry32(5);
const g = gaussian(rand);

function initNet(): Net {
  return {
    W1: Array.from({ length: H }, () => g() * 0.8),
    b1: Array.from({ length: H }, () => g() * 0.8),
    W2: Array.from({ length: H }, () => g() * 0.3),
    b2: 0,
  };
}

function fwd(net: Net, x: number): number {
  let y = net.b2;
  for (let h = 0; h < H; h++) y += net.W2[h] * Math.tanh(net.W1[h] * x + net.b1[h]);
  return y;
}

function trainStep(net: Net, X: number[], Y: number[], lr: number): void {
  const gW1 = new Array<number>(H).fill(0);
  const gb1 = new Array<number>(H).fill(0);
  const gW2 = new Array<number>(H).fill(0);
  let gb2 = 0;
  for (let n = 0; n < X.length; n++) {
    const x = X[n];
    const a = net.W1.map((w, h) => Math.tanh(w * x + net.b1[h]));
    let y = net.b2;
    for (let h = 0; h < H; h++) y += net.W2[h] * a[h];
    const d = (2 * (y - Y[n])) / X.length;
    gb2 += d;
    for (let h = 0; h < H; h++) {
      gW2[h] += d * a[h];
      const da = d * net.W2[h] * (1 - a[h] * a[h]);
      gW1[h] += da * x;
      gb1[h] += da;
    }
  }
  for (let h = 0; h < H; h++) {
    net.W1[h] -= lr * gW1[h];
    net.b1[h] -= lr * gb1[h];
    net.W2[h] -= lr * gW2[h];
  }
  net.b2 -= lr * gb2;
}

const loss = (net: Net, X: number[], Y: number[]): number =>
  X.reduce((a, x, i) => a + (fwd(net, x) - Y[i]) ** 2, 0) / X.length;

const sampleFn = (net: Net): number[] =>
  Array.from({ length: N_PLOT }, (_, i) => fwd(net, X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)));

/** The full experiment, run once. */
export interface Run {
  snapsA: number[][]; // function snapshots during phase A (31)
  snapsB: number[][]; // during B-only fine-tune (31)
  snapsR: number[][]; // during replay fine-tune (31)
  lossA_duringB: number[]; // loss on A, sampled during B-only (31)
  lossA_duringR: number[]; // loss on A, during replay (31)
  finalA_afterA: number;
  finalA_afterB: number;
  finalB_afterB: number;
  finalA_afterR: number;
  finalB_afterR: number;
}

export const RUN: Run = (() => {
  const net = initNet();
  const snapsA: number[][] = [];
  for (let s = 0; s < 3000; s++) {
    if (s % 100 === 0) snapsA.push(sampleFn(net));
    trainStep(net, XA, YA, 0.05);
  }
  snapsA.push(sampleFn(net));
  const finalA_afterA = loss(net, XA, YA);
  const snapshot: Net = { W1: [...net.W1], b1: [...net.b1], W2: [...net.W2], b2: net.b2 };

  const snapsB: number[][] = [];
  const lossA_duringB: number[] = [];
  for (let s = 0; s < 3000; s++) {
    if (s % 100 === 0) {
      snapsB.push(sampleFn(net));
      lossA_duringB.push(loss(net, XA, YA));
    }
    trainStep(net, XB, YB, 0.05);
  }
  snapsB.push(sampleFn(net));
  lossA_duringB.push(loss(net, XA, YA));
  const finalA_afterB = loss(net, XA, YA);
  const finalB_afterB = loss(net, XB, YB);

  const net2: Net = { W1: [...snapshot.W1], b1: [...snapshot.b1], W2: [...snapshot.W2], b2: snapshot.b2 };
  const Xmix = [...XB, ...XA.filter((_, i) => i % 3 === 0)];
  const Ymix = [...YB, ...YA.filter((_, i) => i % 3 === 0)];
  const snapsR: number[][] = [];
  const lossA_duringR: number[] = [];
  for (let s = 0; s < 3000; s++) {
    if (s % 100 === 0) {
      snapsR.push(sampleFn(net2));
      lossA_duringR.push(loss(net2, XA, YA));
    }
    trainStep(net2, Xmix, Ymix, 0.05);
  }
  snapsR.push(sampleFn(net2));
  lossA_duringR.push(loss(net2, XA, YA));

  return {
    snapsA,
    snapsB,
    snapsR,
    lossA_duringB,
    lossA_duringR,
    finalA_afterA,
    finalA_afterB,
    finalB_afterB,
    finalA_afterR: loss(net2, XA, YA),
    finalB_afterR: loss(net2, XB, YB),
  };
})();

export const TARGET_A: number[] = Array.from({ length: N_PLOT }, (_, i) =>
  fA(X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)),
);
export const TARGET_B: number[] = Array.from({ length: N_PLOT }, (_, i) =>
  fB(X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1)),
);

/** Interpolate function snapshots at fractional index. */
export function snapAt(snaps: number[][], u: number): number[] {
  const f = Math.max(0, Math.min(snaps.length - 1, u));
  const i = Math.floor(f);
  const t = f - i;
  const a = snaps[i];
  const b = snaps[Math.min(snaps.length - 1, i + 1)];
  return a.map((v, k) => v + (b[k] - v) * t);
}

export const N_SNAPS = RUN.snapsB.length; // 31

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const PLOT_X0 = 120;
export const PLOT_X1 = 1160;
export const PLOT_Y_MID = 330;
export const PLOT_AMP = 105;
export const px = (x: number): number => PLOT_X0 + ((x - X_MIN) / (X_MAX - X_MIN)) * (PLOT_X1 - PLOT_X0);
export const py = (y: number): number => PLOT_Y_MID - y * PLOT_AMP;

export const LOSS_X0 = 890;
export const LOSS_Y0 = 610;
export const LOSS_W = 300;
export const LOSS_H = 110;

export const CAM_LEFT: CameraState = { x: 420, y: 330, k: 1.25 };
export const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  targetAU: ChannelRef<number>; // task A points/curve
  trainA: ChannelRef<number>; // phase A snapshot index
  targetBU: ChannelRef<number>;
  trainB: ChannelRef<number>; // B-only fine-tune snapshot index
  lossU: ChannelRef<number>; // the loss-on-A strip chart
  replayMode: ChannelRef<number>; // 0 = B-only run shown · 1 = replay run
  trainR: ChannelRef<number>; // replay snapshot index
  statU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const targetAU = tl.channel('targetAU', 0);
  const trainA = tl.channel('trainA', 0);
  const targetBU = tl.channel('targetBU', 0);
  const trainB = tl.channel('trainB', 0);
  const lossU = tl.channel('lossU', 0);
  const replayMode = tl.channel('replayMode', 0);
  const trainR = tl.channel('trainR', 0);
  const statU = tl.channel('statU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · learn task A ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is a small neural network with one job: fit the wave on the left. Twenty four hidden units, plain gradient descent, really trained — watch its function bend into place.',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(targetAU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_LEFT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(trainA, RUN.snapsA.length - 1, { at: 2.4, dur: 4.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 4.2,
    text: 'Three thousand steps later the fit is essentially perfect — the loss on task A lands at two ten-thousandths. Call this the pretrained model.',
  });
  tl.hold(10.9, 0.6);

  // — Beat 2 · fine-tune on task B —————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 11.5, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 11.9,
    dur: 5.2,
    text: 'Now a new job arrives: a different wave, on the right half only. The natural move is to keep training on the new data. So we do — and only on the new data.',
  });
  tl.tween(targetBU, 1, { at: 12.5, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 17.3,
    dur: 5.8,
    text: 'Watch the left half while the right half learns. Nobody is touching task A. No gradient ever mentions it. And it is being torn apart anyway, because both tasks share the same twenty four neurons.',
  });
  tl.tween(trainB, N_SNAPS - 1, { at: 17.9, dur: 7.5, ease: ease.move });
  tl.tween(lossU, 1, { at: 18.3, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 23.9,
    dur: 5.4,
    text: 'The strip chart is the loss on task A during the fine-tune, measured every hundred steps. It climbs from nothing to three point four. Task B is perfect now. Task A is gone.',
  });
  tl.tween(statU, 1, { at: 24.7, dur: 0.7, ease: ease.enter });
  tl.hold(29.5, 0.7);

  // — Beat 3 · name it ————————————————————————————————————————————————
  tl.caption({
    at: 30.2,
    dur: 5.4,
    text: 'This is catastrophic forgetting, and it is the central hazard of fine-tuning. The units that drew the old wave were not protected — they were simply the cheapest material for building the new one.',
  });
  tl.hold(35.8, 0.6);

  // — Beat 4 · replay ——————————————————————————————————————————————————
  tl.caption({
    at: 36.4,
    dur: 5.6,
    text: 'The oldest fix is also the most effective: replay. Rewind to the pretrained model and fine-tune again, but mix one old example into every few new ones. Same steps, same learning rate.',
  });
  tl.tween(replayMode, 1, { at: 37.0, dur: 0.8, ease: ease.move });
  tl.tween(trainR, N_SNAPS - 1, { at: 38.0, dur: 7.0, ease: ease.move });
  tl.caption({
    at: 42.2,
    dur: 5.6,
    text: 'The strip chart barely twitches: task A holds at zero point zero one while task B reaches zero point zero zero six. A pinch of the past keeps the shared neurons honest.',
  });
  tl.hold(48.0, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.2, dur: 1.1, ease: ease.move });
  tl.tween(statU, 0, { at: 49.2, dur: 0.8, ease: ease.move });
  tl.tween(lossU, 0, { at: 49.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.4,
    dur: 6.0,
    text: 'Every fine-tune is a negotiation with what the model already knows. Replay, regularization toward the old weights, or freezing most of them and learning a low rank nudge — the whole toolkit exists to win task B without paying in task A.',
  });
  tl.hold(56.6, 1.2);

  return {
    tl,
    cam,
    axU,
    targetAU,
    trainA,
    targetBU,
    trainB,
    lossU,
    replayMode,
    trainR,
    statU,
    dimU,
    endU,
  };
}
