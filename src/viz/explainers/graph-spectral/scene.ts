import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Graph Spectral — the graph as a drum.
 *
 * The 10-node community graph's Laplacian L = D − A is built at module
 * scope, and its Fiedler vector (second-smallest eigenvector) is really
 * computed by deflated power iteration on (cI − L). Computed facts the
 * narration uses: the Fiedler vector is negative on all five nodes of one
 * community and positive on all five of the other; the two bridge
 * endpoints have the smallest magnitudes (≈ −0.16 and 0.22); and the
 * algebraic connectivity λ₂ ≈ 0.24.
 */

export const N = 10;
export const EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [0, 4],
  [5, 6],
  [5, 7],
  [6, 7],
  [6, 8],
  [7, 8],
  [8, 9],
  [5, 9],
  [4, 5],
];
export const ADJ: number[][] = (() => {
  const A: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (const [a, b] of EDGES) {
    A[a][b] = 1;
    A[b][a] = 1;
  }
  return A;
})();
export const DEG: number[] = ADJ.map((r) => r.reduce((a, b) => a + b, 0));

/** the Laplacian, normalized to 0..1 for the heat display (true values kept) */
export const LAP: number[][] = ADJ.map((row, i) =>
  row.map((v, j) => (i === j ? DEG[i] : v ? -1 : 0)),
);
export const LAP_DISP: number[][] = LAP.map((r) => r.map((v) => (v + 1) / 5));

/** Fiedler vector via deflated power iteration on cI − L (deterministic) */
export const FIEDLER: number[] = (() => {
  const c0 = 10;
  let v = Array.from({ length: N }, (_, i) => Math.sin(i * 1.7) + 0.3);
  for (let it = 0; it < 2000; it++) {
    const d = v.reduce((a, b) => a + b) / N;
    v = v.map((x) => x - d); // deflate the constant (λ₁ = 0) mode
    const w = v.map((_, i) => {
      let s2 = c0 * v[i] - DEG[i] * v[i];
      for (let j = 0; j < N; j++) if (ADJ[i][j]) s2 += v[j];
      return s2;
    });
    const n = Math.hypot(...w);
    v = w.map((x) => x / n);
  }
  // fix sign: community A (nodes 0–4) negative
  return v[0] > 0 ? v.map((x) => -x) : v;
})();

/** λ₂ = vᵀ L v (v is unit) — the algebraic connectivity, ≈ 0.2422 */
export const LAMBDA2: number = FIEDLER.reduce((acc, vi, i) => {
  let s2 = DEG[i] * vi;
  for (let j = 0; j < N; j++) if (ADJ[i][j]) s2 -= FIEDLER[j];
  return acc + s2 * vi;
}, 0);

/** node order sorted by Fiedler value — the 1-D spectral embedding */
export const ORDER: number[] = FIEDLER.map((v, i) => [v, i] as const)
  .sort((a, b) => a[0] - b[0])
  .map(([, i]) => i);

export const POS: Array<{ x: number; y: number }> = [
  { x: 430, y: 220 },
  { x: 330, y: 330 },
  { x: 520, y: 330 },
  { x: 380, y: 450 },
  { x: 540, y: 460 },
  { x: 700, y: 440 },
  { x: 790, y: 300 },
  { x: 870, y: 450 },
  { x: 950, y: 320 },
  { x: 860, y: 190 },
];

/** vertical displacement scale for the vibration-mode beat */
export const LIFT = 260;

export const MC = 17;
export const MG = 2;
export const MP = MC + MG;
export const MAT = { x: 60, y: 200 } as const; // 10·19−2 = 188

export const BAR = { x0: 300, y: 560, dx: 70, h: 90 } as const;

export const CAM_GRAPH: CameraState = { x: 640, y: 340, k: 1.15 };
export const CAM_MAT: CameraState = { x: 260, y: 320, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  graphU: ChannelRef<number>;
  matU: ChannelRef<number>;
  flatU: ChannelRef<number>; // trivial constant mode
  modeU: ChannelRef<number>; // Fiedler displacement
  signU: ChannelRef<number>;
  fenceU: ChannelRef<number>;
  lamU: ChannelRef<number>;
  barU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const graphU = tl.channel('graphU', 0);
  const matU = tl.channel('matU', 0);
  const flatU = tl.channel('flatU', 0);
  const modeU = tl.channel('modeU', 0);
  const signU = tl.channel('signU', 0);
  const fenceU = tl.channel('fenceU', 0);
  const lamU = tl.channel('lamU', 0);
  const barU = tl.channel('barU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · listen instead of walk ——————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'So far we have walked this graph, hop by hop. There is a second way to know it: strike it like a drum, and listen to how it vibrates.',
  });
  tl.tween(graphU, 1, { at: 0.5, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_GRAPH, { at: 0.8, dur: 2.0, ease: ease.move });

  // — Beat 2 · the Laplacian ————————————————————————————————————————————
  tl.caption({
    at: 6.7,
    dur: 6.2,
    text: 'The instrument is the graph Laplacian: each node’s degree on the diagonal, minus one for every edge. It measures how much a node disagrees with its neighbors.',
    tex: 'L = D - A',
  });
  tl.tween(cam, CAM_MAT, { at: 7.1, dur: 1.8, ease: ease.move });
  tl.tween(matU, 1, { at: 7.5, dur: 2.8, ease: ease.linear });
  tl.hold(13.1, 0.5);

  // — Beat 3 · modes ————————————————————————————————————————————————————
  tl.caption({
    at: 13.6,
    dur: 5.8,
    text: 'A vibration mode assigns a height to every node. The laziest mode lifts the whole graph evenly — zero disagreement, zero energy. It tells us nothing.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 13.8, dur: 1.8, ease: ease.move });
  tl.tween(flatU, 1, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(flatU, 0, { at: 17.8, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 19.8,
    dur: 6.2,
    text: 'The second mode is the interesting one. We computed it by power iteration: one community swings up, the other swings down — the graph’s cheapest disagreement.',
    tex: 'L v = \\lambda_2 v',
  });
  tl.tween(modeU, 1, { at: 20.8, dur: 2.2, ease: ease.move });

  tl.caption({
    at: 26.4,
    dur: 5.6,
    text: 'Read the signs and you have found the communities — all five of one side negative, all five of the other positive. Nobody told it where the split was.',
  });
  tl.tween(signU, 1, { at: 27.0, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 32.4,
    dur: 5.8,
    text: 'And the two nodes touching the bridge sit nearest to zero — the fence-sitters. The eigenvector even knows who is least committed.',
  });
  tl.tween(fenceU, 1, { at: 33.0, dur: 0.9, ease: ease.enter });
  tl.hold(38.2, 0.5);

  // — Beat 4 · λ₂ ———————————————————————————————————————————————————————
  tl.caption({
    at: 38.7,
    dur: 6.0,
    text: 'The mode’s pitch matters too. This eigenvalue is zero point two four — the algebraic connectivity. Cut the bridge and it would fall to exactly zero.',
  });
  tl.tween(fenceU, 0, { at: 38.9, dur: 0.7, ease: ease.move });
  tl.tween(lamU, 1, { at: 39.3, dur: 0.9, ease: ease.enter });

  // — Beat 5 · the embedding + rhyme ————————————————————————————————————
  tl.caption({
    at: 45.1,
    dur: 6.0,
    text: 'Line the nodes up by their eigenvector value and the graph has drawn its own map: communities separate, bridge in the middle. That is spectral clustering.',
  });
  tl.tween(lamU, 0, { at: 45.3, dur: 0.7, ease: ease.move });
  tl.tween(barU, 1, { at: 45.9, dur: 2.2, ease: ease.move });

  tl.caption({
    at: 51.5,
    dur: 6.0,
    text: 'You have seen this trick twice before: directions that survive a transform, and the walk that settles into a ranking. The drum modes are the same idea, tuned to structure.',
  });

  tl.caption({
    at: 57.9,
    dur: 6.0,
    text: 'One matrix, messages on it, the depth that blurs them, the tasks they answer, and now the spectrum underneath. That is graph learning from the ground up.',
  });
  tl.tween(closeU, 1, { at: 58.3, dur: 0.9, ease: ease.enter });
  tl.hold(63.9, 1.2);

  return { tl, cam, graphU, matU, flatU, modeU, signU, fenceU, lamU, barU, closeU };
}
