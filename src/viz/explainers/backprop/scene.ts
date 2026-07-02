import { Timeline, ease } from '../../core';

/**
 * Backpropagation — The Chain Rule, Alive.
 *
 * A tiny real network drawn as a computational graph:
 *   z1 = w1·x + b1 → h = ReLU(z1) → ŷ = w2·h → L = ½(ŷ − y)²
 * with x = 1.5, w1 = 0.8, b1 = −0.2, w2 = 1.2, target y = 1.
 *
 * Everything is pure and computed once at module scope: three real steps of
 * gradient descent (η = 0.4) are solved here, and the timeline replays them —
 * forward value packets, backward gradient packets, weight nudges, and a
 * loss-vs-step curve. Nothing accumulates at render time (the scrubbability
 * invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

/* --------------------------------------------------------------------- */
/* The network, solved for real.                                          */
/* --------------------------------------------------------------------- */

export const X_IN = 1.5;
export const B1 = -0.2;
export const TARGET = 1;
export const ETA = 0.4;

export const relu = (v: number) => (v > 0 ? v : 0);

export interface PassData {
  /** parameters entering this pass */
  w1: number;
  w2: number;
  /** forward values */
  z1: number;
  h: number;
  yhat: number;
  err: number;
  L: number;
  /** backward: local × upstream at each hop */
  gYhat: number; // ∂L/∂ŷ = ŷ − y
  gW2: number; //   ∂ŷ/∂w2 = h        → ∂L/∂w2 = (ŷ−y)·h
  gH: number; //    ∂ŷ/∂h  = w2       → ∂L/∂h  = (ŷ−y)·w2
  gZ1: number; //   ∂h/∂z1 = ReLU′    → ∂L/∂z1 = ∂L/∂h · 1[z1>0]
  gW1: number; //   ∂z1/∂w1 = x       → ∂L/∂w1 = ∂L/∂z1 · x
  /** parameters after the update w ← w − η·∇ */
  w1Next: number;
  w2Next: number;
}

/**
 * Four passes: three full train steps plus a final forward-only victory lap.
 * b1 is held fixed so the two weights carry the story (and η = 0.4 stays
 * comfortably stable on this loss surface): L = 0.020 → 0.007 → 0.001 → 0.0003.
 */
export const PASSES: PassData[] = (() => {
  const out: PassData[] = [];
  let w1 = 0.8;
  let w2 = 1.2;
  for (let k = 0; k < 4; k++) {
    const z1 = w1 * X_IN + B1;
    const h = relu(z1);
    const yhat = w2 * h;
    const err = yhat - TARGET;
    const L = (err * err) / 2;
    const gYhat = err;
    const gW2 = gYhat * h;
    const gH = gYhat * w2;
    const gZ1 = gH * (z1 > 0 ? 1 : 0);
    const gW1 = gZ1 * X_IN;
    const w1Next = w1 - ETA * gW1;
    const w2Next = w2 - ETA * gW2;
    out.push({ w1, w2, z1, h, yhat, err, L, gYhat, gW2, gH, gZ1, gW1, w1Next, w2Next });
    w1 = w1Next;
    w2 = w2Next;
  }
  return out;
})();

export const LOSSES: number[] = PASSES.map((p) => p.L);

/** Piecewise-linear loss-vs-step curve for the corner plot. */
export function lossAt(step: number): number {
  const s = Math.max(0, Math.min(step, LOSSES.length - 1));
  const i = Math.floor(s);
  const f = s - i;
  if (i >= LOSSES.length - 1) return LOSSES[LOSSES.length - 1];
  return LOSSES[i] + (LOSSES[i + 1] - LOSSES[i]) * f;
}

/* --------------------------------------------------------------------- */
/* Formatting (shared so scene text and node values always agree).        */
/* --------------------------------------------------------------------- */

export const f2 = (v: number) => v.toFixed(2);
export const fmtLoss = (v: number) => (v >= 0.0005 ? v.toFixed(3) : v.toFixed(4));

/* --------------------------------------------------------------------- */
/* Layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633).  */
/* --------------------------------------------------------------------- */

export const CIRC_R = 36;
export const RECT_W = 96;
export const RECT_H = 56;

export type NodeId = 'x' | 'w1' | 'b1' | 'z1' | 'h' | 'w2' | 'yhat' | 'yt' | 'L';

export interface NodeSpec {
  id: NodeId;
  x: number;
  y: number;
  kind: 'circle' | 'rect';
  label: string;
  role: 'input' | 'param' | 'op' | 'loss';
}

/** Order = entrance stagger order (left → right). */
export const NODES: NodeSpec[] = [
  { id: 'x', x: 170, y: 225, kind: 'rect', label: 'x', role: 'input' },
  { id: 'w1', x: 170, y: 360, kind: 'rect', label: 'w₁', role: 'param' },
  { id: 'b1', x: 170, y: 495, kind: 'rect', label: 'b₁', role: 'param' },
  { id: 'z1', x: 410, y: 330, kind: 'circle', label: 'z₁', role: 'op' },
  { id: 'h', x: 600, y: 330, kind: 'circle', label: 'h', role: 'op' },
  { id: 'w2', x: 640, y: 505, kind: 'rect', label: 'w₂', role: 'param' },
  { id: 'yhat', x: 800, y: 330, kind: 'circle', label: 'ŷ', role: 'op' },
  { id: 'yt', x: 990, y: 505, kind: 'rect', label: 'y', role: 'input' },
  { id: 'L', x: 990, y: 330, kind: 'circle', label: 'L', role: 'loss' },
];

export const NODE_INDEX: Record<NodeId, number> = NODES.reduce(
  (acc, n, i) => ((acc[n.id] = i), acc),
  {} as Record<NodeId, number>,
);

const byId = (id: NodeId): NodeSpec => NODES[NODE_INDEX[id]];

/** Distance from a node's center to its border along a unit direction. */
function boundary(n: NodeSpec, ux: number, uy: number): number {
  if (n.kind === 'circle') return CIRC_R;
  return 1 / Math.max(Math.abs(ux) / (RECT_W / 2), Math.abs(uy) / (RECT_H / 2));
}

export interface EdgeSpec {
  from: NodeId;
  to: NodeId;
  /** endpoints trimmed to the node borders (plus a small gap) */
  a: Pt;
  b: Pt;
}

const EDGE_PAD = 7;

function edge(from: NodeId, to: NodeId): EdgeSpec {
  const nf = byId(from);
  const nt = byId(to);
  const dx = nt.x - nf.x;
  const dy = nt.y - nf.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const rA = boundary(nf, ux, uy) + EDGE_PAD;
  const rB = boundary(nt, ux, uy) + EDGE_PAD;
  return {
    from,
    to,
    a: { x: nf.x + ux * rA, y: nf.y + uy * rA },
    b: { x: nt.x - ux * rB, y: nt.y - uy * rB },
  };
}

/** Forward edges in draw/packet order. */
export const EDGES: EdgeSpec[] = [
  edge('x', 'z1'),
  edge('w1', 'z1'),
  edge('b1', 'z1'),
  edge('z1', 'h'),
  edge('h', 'yhat'),
  edge('w2', 'yhat'),
  edge('yhat', 'L'),
  edge('yt', 'L'),
];

/** Backward route: indices into EDGES, traversed b → a. */
export const BWD_EDGES = [6, 5, 4, 3, 1];

/** Packet labels — the real numbers each packet carries, per pass. */
export function fwdLabels(p: PassData): string[] {
  return [f2(X_IN), f2(p.w1), f2(B1), f2(p.z1), f2(p.h), f2(p.w2), f2(p.yhat), f2(TARGET)];
}
export function bwdLabels(p: PassData): string[] {
  return [f2(p.gYhat), f2(p.gW2), f2(p.gH), f2(p.gZ1), f2(p.gW1)];
}

/* --------------------------------------------------------------------- */
/* Stage math — TeX chips with the pass-1 numbers, generated (not typed). */
/* --------------------------------------------------------------------- */

const P0 = PASSES[0];

/** One chip per backward hop, same order as BWD_EDGES: local × upstream. */
export const CHIPS: Array<{ x: number; y: number; size: number; tex: string }> = [
  { x: 800, y: 236, size: 16, tex: `\\frac{\\partial L}{\\partial \\hat y} = \\hat y - y = ${f2(P0.gYhat)}` },
  { x: 640, y: 566, size: 16, tex: `\\frac{\\partial L}{\\partial w_2} = ${f2(P0.gYhat)} \\times ${f2(P0.h)} = ${f2(P0.gW2)}` },
  { x: 600, y: 266, size: 16, tex: `\\frac{\\partial L}{\\partial h} = ${f2(P0.gYhat)} \\times ${f2(P0.w2)} = ${f2(P0.gH)}` },
  { x: 408, y: 236, size: 16, tex: `\\mathrm{ReLU}'\\,{=}\\,1:\\;\\; \\frac{\\partial L}{\\partial z_1} = ${f2(P0.gZ1)}` },
  { x: 152, y: 428, size: 15, tex: `\\frac{\\partial L}{\\partial w_1} = ${f2(P0.gZ1)} \\times ${f2(X_IN)} = ${f2(P0.gW1)}` },
];

export const LOSS_TEX = `L = \\tfrac{1}{2}(\\hat y - y)^2 = \\tfrac{1}{2}(${f2(P0.yhat)} - 1)^2 = ${fmtLoss(P0.L)}`;

export const UPDATE_TEX = {
  rule: `w \\;\\leftarrow\\; w - \\eta\\,\\frac{\\partial L}{\\partial w}, \\qquad \\eta = ${ETA}`,
  w1: `w_1:\\;\\; ${f2(P0.w1)} - ${ETA} \\times ${f2(P0.gW1)} \\;=\\; ${f2(P0.w1Next)}`,
  w2: `w_2:\\;\\; ${f2(P0.w2)} - ${ETA} \\times ${f2(P0.gW2)} \\;=\\; ${f2(P0.w2Next)}`,
};

/** Corner loss-vs-step plot frame. */
export const PLOT = { x0: 1040, x1: 1230, yBottom: 200, yTop: 92, maxL: 0.022 };

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  const nodesU = NODES.map((n) => tl.channel(`node_${n.id}`, 0)); // entrances
  const edgesU = tl.channel('edges', 0); // staggered edge draw-on
  const passIdx = tl.channel('pass', 0); // which PASSES entry is live (step set)

  const fwd = EDGES.map((_, i) => tl.channel(`fwd${i}`, 0)); // value packets
  const bwd = BWD_EDGES.map((_, i) => tl.channel(`bwd${i}`, 0)); // gradient packets
  const chips = CHIPS.map((_, i) => tl.channel(`chip${i}`, 0)); // TeX chip fades

  // live displayed numbers (weights tween during updates; the rest step)
  const vW1 = tl.channel('vW1', PASSES[0].w1);
  const vW2 = tl.channel('vW2', PASSES[0].w2);
  const vZ1 = tl.channel('vZ1', 0);
  const vH = tl.channel('vH', 0);
  const vYhat = tl.channel('vYhat', 0);
  const vL = tl.channel('vL', 0);
  // first-arrival pops for the computed values
  const zAp = tl.channel('zAp', 0);
  const hAp = tl.channel('hAp', 0);
  const yAp = tl.channel('yAp', 0);
  const lAp = tl.channel('lAp', 0);

  const lossGlow = tl.channel('lossGlow', 0); // NEGATIVE halo on L
  const winGlow = tl.channel('winGlow', 0); // POSITIVE halo on L, finale
  const updGlow = tl.channel('updGlow', 0); // POSITIVE halo on w1/w2
  const lossTexU = tl.channel('lossTex', 0);
  const updTexU = tl.channel('updTex', 0);
  const plotU = tl.channel('plotU', 0); // corner plot draw-on
  const plotProg = tl.channel('plotProg', 0); // curve sweep in steps (0..3)

  /**
   * One forward pass at speed factor `s` (1 = teaching pace). Packets fly
   * edge by edge; each node's value lands exactly when its packet does.
   * Returns the loss arrival time.
   */
  const forward = (t0: number, k: number, s: number): number => {
    const p = PASSES[k];
    for (const f of fwd) tl.set(f, 0, t0); // rewind packets for this lap
    tl.set(passIdx, k, t0);
    const first = k === 0;
    let t = t0 + 0.15;
    for (let i = 0; i < 3; i++) tl.tween(fwd[i], 1, { at: t + i * 0.1 * s, dur: 1.0 * s, ease: ease.linear });
    t += 0.2 * s + 1.0 * s;
    tl.set(vZ1, p.z1, t);
    if (first) tl.tween(zAp, 1, { at: t, dur: 0.45, ease: ease.pop });
    t += 0.35 * s;
    t = tl.tween(fwd[3], 1, { at: t, dur: 0.8 * s, ease: ease.linear });
    tl.set(vH, p.h, t);
    if (first) tl.tween(hAp, 1, { at: t, dur: 0.45, ease: ease.pop });
    t += 0.35 * s;
    tl.tween(fwd[4], 1, { at: t, dur: 0.85 * s, ease: ease.linear });
    t = tl.tween(fwd[5], 1, { at: t + 0.08 * s, dur: 0.85 * s, ease: ease.linear });
    tl.set(vYhat, p.yhat, t);
    if (first) tl.tween(yAp, 1, { at: t, dur: 0.45, ease: ease.pop });
    t += 0.35 * s;
    tl.tween(fwd[6], 1, { at: t, dur: 0.85 * s, ease: ease.linear });
    t = tl.tween(fwd[7], 1, { at: t + 0.08 * s, dur: 0.85 * s, ease: ease.linear });
    tl.set(vL, p.L, t);
    if (first) tl.tween(lAp, 1, { at: t, dur: 0.45, ease: ease.pop });
    return t;
  };

  /** One fast backward pass (no chips) — the training-loop version. */
  const backward = (t0: number, s: number): number => {
    for (const b of bwd) tl.set(b, 0, t0);
    const durs = [1.0, 0.9, 0.9, 0.8, 0.9];
    let t = t0 + 0.1;
    for (let i = 0; i < bwd.length; i++) {
      t = tl.tween(bwd[i], 1, { at: t, dur: durs[i] * s, ease: ease.linear }) + 0.05;
    }
    return t;
  };

  /** w ← w − η·∇: both weights slide to PASSES[k].wNext with a green pulse. */
  const update = (t0: number, k: number, dur: number): number => {
    const p = PASSES[k];
    tl.tween(updGlow, 1, { at: t0 - 0.2, dur: 0.4, ease: ease.enter });
    tl.tween(vW1, p.w1Next, { at: t0, dur, ease: ease.move });
    tl.tween(vW2, p.w2Next, { at: t0, dur, ease: ease.move });
    tl.tween(lossGlow, 0, { at: t0, dur: 0.45, ease: ease.enter });
    tl.tween(updGlow, 0, { at: t0 + dur + 0.1, dur: 0.6, ease: ease.enter });
    return t0 + dur;
  };

  // ---- beat 1: the graph assembles ---------------------------------------
  NODES.forEach((_, i) => {
    tl.tween(nodesU[i], 1, { at: 0.5 + i * 0.14, dur: 0.7, ease: ease.enter });
  });
  tl.tween(edgesU, 1, { at: 2.1, dur: 1.5, ease: ease.draw });
  tl.caption({
    at: 0.7,
    dur: 5.2,
    text: 'A neural network is just a chain of tiny computations — multiply, add, clamp, compare.',
  });
  tl.caption({
    at: 6.1,
    dur: 4.1,
    text: 'Here, x = 1.5 flows through three knobs — w₁, b₁, w₂ — to a prediction ŷ, then a score.',
  });

  // ---- beat 2: forward — the numbers flow --------------------------------
  tl.caption({
    at: 10.4,
    dur: 5.0,
    text: 'Forward: the numbers simply flow. w₁·x + b₁ = 1.00, and ReLU waves it through.',
  });
  forward(10.45, 0, 1); // loss lands at t = 15.51
  tl.tween(lossGlow, 1, { at: 15.55, dur: 0.6, ease: ease.enter });
  tl.tween(lossTexU, 1, { at: 15.9, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 15.7,
    dur: 5.2,
    text: 'The prediction lands at 1.20; the target was 1. The loss scores the miss: ½(0.20)² = 0.02.',
  });
  tl.hold(20.9, 0.7);

  // ---- beat 3: backward — local × upstream, one edge at a time ------------
  tl.caption({
    at: 21.6,
    dur: 4.0,
    text: 'Backward: blame flows the other way. The first piece is easy — the loss changes at rate ŷ − y = 0.20.',
  });
  tl.tween(bwd[0], 1, { at: 22.0, dur: 1.0, ease: ease.linear }); // L → ŷ
  tl.tween(chips[0], 1, { at: 22.9, dur: 0.5, ease: ease.enter });
  tl.tween(bwd[1], 1, { at: 24.0, dur: 1.0, ease: ease.linear }); // ŷ → w₂
  tl.tween(chips[1], 1, { at: 24.9, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 25.8,
    dur: 4.8,
    text: 'Each edge multiplies by its own local slope. For w₂ that slope is h, so its gradient is 0.20 × 1.0.',
  });
  tl.tween(bwd[2], 1, { at: 26.4, dur: 1.0, ease: ease.linear }); // ŷ → h
  tl.tween(chips[2], 1, { at: 27.3, dur: 0.5, ease: ease.enter });
  tl.tween(bwd[3], 1, { at: 28.2, dur: 0.9, ease: ease.linear }); // h → z₁ (ReLU gate)
  tl.tween(chips[3], 1, { at: 29.0, dur: 0.5, ease: ease.enter });
  tl.tween(bwd[4], 1, { at: 29.9, dur: 1.0, ease: ease.linear }); // z₁ → w₁
  tl.tween(chips[4], 1, { at: 30.8, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 31.0,
    dur: 5.6,
    text: "No node ever sees the whole network — only its local slope. The chain rule stitches them: w₁'s gradient is 0.24 × 1.5 = 0.36.",
  });
  tl.hold(36.6, 1.0);

  // ---- beat 4: update — nudge the weights, start the loss curve -----------
  for (const c of chips) tl.tween(c, 0, { at: 37.6, dur: 0.5, ease: ease.enter });
  tl.tween(lossTexU, 0, { at: 37.6, dur: 0.5, ease: ease.enter });
  tl.tween(updTexU, 1, { at: 38.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 37.8,
    dur: 5.2,
    text: 'Update: nudge every weight downhill by η times its gradient, with η = 0.4.',
  });
  update(39.2, 0, 1.1); // w₁: 0.80 → 0.66, w₂: 1.20 → 1.12
  tl.tween(plotU, 1, { at: 40.6, dur: 1.1, ease: ease.draw });
  tl.caption({
    at: 43.2,
    dur: 4.0,
    text: 'That one nudge cut the loss: 0.020 → 0.007. Watch the corner.',
  });
  tl.tween(plotProg, 1, { at: 43.4, dur: 0.9, ease: ease.move });
  tl.tween(updTexU, 0, { at: 46.4, dur: 0.5, ease: ease.enter });
  tl.hold(47.2, 0.4);

  // ---- beat 5: the loop — two more passes, faster, then the payoff --------
  tl.caption({
    at: 47.7,
    dur: 4.8,
    text: 'Again: forward, backward, nudge. Same dance — only the numbers change.',
  });
  forward(47.6, 1, 0.5); // loss lands at t ≈ 50.2
  tl.tween(lossGlow, 0.5, { at: 50.25, dur: 0.4, ease: ease.enter });
  backward(50.45, 0.5);
  update(53.2, 1, 0.6); // w₁: 0.66 → 0.74, w₂: 1.12 → 1.16
  tl.tween(plotProg, 2, { at: 53.5, dur: 0.6, ease: ease.move });

  tl.caption({
    at: 53.3,
    dur: 4.4,
    text: 'And faster. The miss shrinks every lap: 0.020 → 0.007 → 0.001.',
  });
  forward(54.2, 2, 0.35); // loss lands at t ≈ 56.1
  tl.tween(lossGlow, 0.3, { at: 56.1, dur: 0.3, ease: ease.enter });
  backward(56.3, 0.35);
  update(58.4, 2, 0.5); // w₁ → 0.70, w₂ → 1.14

  forward(59.5, 3, 0.3); // final forward-only lap: loss lands ≈ 61.1
  tl.tween(plotProg, 3, { at: 61.0, dur: 0.6, ease: ease.move });
  tl.tween(winGlow, 1, { at: 61.15, dur: 0.6, ease: ease.pop });
  tl.caption({
    at: 61.4,
    dur: 5.2,
    text: "That's training — the chain rule, alive, thousands of times a second.",
  });
  tl.hold(66.6, 1.0);

  return {
    tl,
    nodesU,
    edgesU,
    passIdx,
    fwd,
    bwd,
    chips,
    vW1,
    vW2,
    vZ1,
    vH,
    vYhat,
    vL,
    zAp,
    hAp,
    yAp,
    lAp,
    lossGlow,
    winGlow,
    updGlow,
    lossTexU,
    updTexU,
    plotU,
    plotProg,
  };
}
