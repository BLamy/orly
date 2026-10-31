/**
 * A tiny, real multilayer perceptron, trained offline at module scope with a
 * fixed seed (pure: same weights on every machine, every frame).
 *
 *   trainMLP({sizes, data, lr, epochs, seed})  -> Training (a snapshot per epoch)
 *   netAt(training, epoch)                      -> MLP (linear blend between snapshots; fractional epochs ok)
 *   forward(net, x)                             -> { a: activations per layer (sigmoid), z }
 *   grads(net, x, y)                            -> { gW, gb, delta } for loss = cross-entropy(sigmoid out)
 *   XOR_DATA, XOR_221 (2-2-1, the network of the XOR plate), XOR_241 (2-4-1, a richer loom)
 *
 * Conventions: W[l][j][i] is the weight from unit i of layer l to unit j of layer l+1;
 * b[l][j] its bias. All units are sigmoid, so activations are 0..1 = lantern glow.
 */
import { mulberry32, gaussian } from '../../../core';

export interface MLP {
  sizes: number[];
  W: number[][][];
  b: number[][];
}
export interface Sample {
  x: number[];
  y: number[];
}
export interface Training {
  sizes: number[];
  data: Sample[];
  lr: number;
  epochs: number;
  /** snaps[e] = weights after e epochs (snaps[0] = initial) */
  snaps: MLP[];
  /** mean cross-entropy over the data, per snapshot */
  loss: number[];
  /** fraction of samples classified correctly (threshold 0.5), per snapshot */
  acc: number[];
}

const sig = (z: number) => 1 / (1 + Math.exp(-z));

export function forward(net: MLP, x: number[]): { a: number[][]; z: number[][] } {
  const a: number[][] = [x.slice()];
  const z: number[][] = [x.slice()];
  for (let l = 0; l < net.W.length; l++) {
    const prev = a[l];
    const zl = net.W[l].map((row, j) => row.reduce((s, w, i) => s + w * prev[i], net.b[l][j]));
    z.push(zl);
    a.push(zl.map(sig));
  }
  return { a, z };
}

/** Gradients of cross-entropy loss for one sample (sigmoid output => delta_out = a - y). */
export function grads(net: MLP, x: number[], y: number[]): { gW: number[][][]; gb: number[][]; delta: number[][]; loss: number } {
  const { a } = forward(net, x);
  const L = net.W.length;
  const delta: number[][] = new Array(L + 1);
  const out = a[L];
  delta[L] = out.map((v, j) => v - y[j]);
  for (let l = L - 1; l >= 1; l--) {
    delta[l] = a[l].map((v, i) => {
      let s = 0;
      for (let j = 0; j < net.W[l].length; j++) s += net.W[l][j][i] * delta[l + 1][j];
      return s * v * (1 - v);
    });
  }
  delta[0] = a[0].map(() => 0);
  const gW = net.W.map((Wl, l) => Wl.map((row, j) => row.map((_, i) => delta[l + 1][j] * a[l][i])));
  const gb = net.b.map((bl, l) => bl.map((_, j) => delta[l + 1][j]));
  const eps = 1e-9;
  const loss = -out.reduce((s, v, j) => s + y[j] * Math.log(v + eps) + (1 - y[j]) * Math.log(1 - v + eps), 0);
  return { gW, gb, delta, loss };
}

function clone(n: MLP): MLP {
  return { sizes: n.sizes, W: n.W.map((l) => l.map((r) => r.slice())), b: n.b.map((r) => r.slice()) };
}

export function trainMLP(o: { sizes: number[]; data: Sample[]; lr: number; epochs: number; seed: number; initScale?: number }): Training {
  const g = gaussian(mulberry32(o.seed));
  const s = o.initScale ?? 1;
  let net: MLP = {
    sizes: o.sizes,
    W: o.sizes.slice(1).map((n, l) => Array.from({ length: n }, () => Array.from({ length: o.sizes[l] }, () => g() * s))),
    b: o.sizes.slice(1).map((n) => Array.from({ length: n }, () => g() * s * 0.5)),
  };
  const snaps: MLP[] = [];
  const loss: number[] = [];
  const acc: number[] = [];
  const evalNet = (n: MLP) => {
    let Ls = 0;
    let ok = 0;
    for (const d of o.data) {
      const r = grads(n, d.x, d.y);
      Ls += r.loss;
      const yh = forward(n, d.x).a[n.W.length][0];
      if (yh > 0.5 === d.y[0] > 0.5) ok++;
    }
    return { L: Ls / o.data.length, A: ok / o.data.length };
  };
  for (let e = 0; e <= o.epochs; e++) {
    snaps.push(clone(net));
    const ev = evalNet(net);
    loss.push(ev.L);
    acc.push(ev.A);
    if (e === o.epochs) break;
    // full-batch gradient descent
    const next = clone(net);
    const n = o.data.length;
    for (const d of o.data) {
      const r = grads(net, d.x, d.y);
      r.gW.forEach((Wl, l) => Wl.forEach((row, j) => row.forEach((gv, i) => (next.W[l][j][i] -= (o.lr * gv) / n))));
      r.gb.forEach((bl, l) => bl.forEach((gv, j) => (next.b[l][j] -= (o.lr * gv) / n)));
    }
    net = next;
  }
  return { sizes: o.sizes, data: o.data, lr: o.lr, epochs: o.epochs, snaps, loss, acc };
}

/** Weights at a (fractional) epoch: linear blend of the neighbouring snapshots. */
export function netAt(tr: Training, epoch: number): MLP {
  const e = Math.max(0, Math.min(tr.epochs, epoch));
  const i = Math.floor(e);
  const u = e - i;
  const A = tr.snaps[i];
  if (u < 1e-6 || i >= tr.epochs) return A;
  const B = tr.snaps[i + 1];
  return {
    sizes: A.sizes,
    W: A.W.map((l, li) => l.map((r, j) => r.map((w, k) => w + (B.W[li][j][k] - w) * u))),
    b: A.b.map((r, li) => r.map((v, j) => v + (B.b[li][j] - v) * u)),
  };
}
export function lossAt(tr: Training, epoch: number): number {
  const e = Math.max(0, Math.min(tr.epochs, epoch));
  const i = Math.floor(e);
  return i >= tr.epochs ? tr.loss[tr.epochs] : tr.loss[i] + (tr.loss[i + 1] - tr.loss[i]) * (e - i);
}

export const XOR_DATA: Sample[] = [
  { x: [0, 0], y: [0] },
  { x: [0, 1], y: [1] },
  { x: [1, 0], y: [1] },
  { x: [1, 1], y: [0] },
];

/**
 * XOR on the smallest net that can solve it: 2 inputs, 2 hidden, 1 output.
 * Seed 7, lr 2, full-batch GD (verified offline): loss 0.75 at epoch 0, a plateau
 * near 0.46-0.59 to epoch ~200, the breakthrough by ~300 (0.079), 0.004 at 1500;
 * 4/4 correct from epoch 224. The hidden units learn OR (h1: x1+x2 > 0.46) and
 * AND (h2: x1+x2 > 1.53); the output fires for OR-and-not-AND = XOR.
 */
export const XOR_221: Training = trainMLP({ sizes: [2, 2, 1], data: XOR_DATA, lr: 2.0, epochs: 1500, seed: 7 });
/** Epoch markers for XOR_221 (for shot timing). */
export const XOR_221_MARKS = { plateau: 150, breakthrough: 280, solved: 600 } as const;
/** A wider loom for richer pictures (same data, same rule; seed 2, lr 1.6: solved ~epoch 263). */
export const XOR_241: Training = trainMLP({ sizes: [2, 4, 1], data: XOR_DATA, lr: 1.6, epochs: 1500, seed: 2 });
