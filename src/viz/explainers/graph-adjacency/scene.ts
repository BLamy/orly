import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Graph Adjacency — a graph is nodes, edges, and one matrix.
 *
 * One real 10-node graph (two 5-node communities joined by a single bridge
 * edge) drawn twice: as a node-link diagram and as its 10×10 adjacency
 * matrix. Everything quoted is computed here: 15 edges of 45 possible,
 * degree 4 for the busiest node and 2 for the quietest, and the single
 * off-diagonal block cell that IS the bridge.
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
export const BRIDGE: [number, number] = [4, 5];

export const ADJ: number[][] = (() => {
  const A: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (const [a, b] of EDGES) {
    A[a][b] = 1;
    A[b][a] = 1;
  }
  return A;
})();
export const DEG: number[] = ADJ.map((r) => r.reduce((a, b) => a + b, 0)); // 3,3,3,3,3,4,3,3,3,2
export const N_EDGES = EDGES.length; // 15
export const N_POSSIBLE = (N * (N - 1)) / 2; // 45
export const MAX_DEG = Math.max(...DEG); // 4 (node 5)
export const MIN_DEG = Math.min(...DEG); // 2 (node 9)

/** node-link layout: community A left, community B right, bridge 4–5 */
export const POS: Array<{ x: number; y: number }> = [
  { x: 250, y: 180 },
  { x: 120, y: 300 },
  { x: 330, y: 320 },
  { x: 190, y: 440 },
  { x: 380, y: 470 },
  { x: 590, y: 430 },
  { x: 700, y: 280 },
  { x: 790, y: 450 },
  { x: 880, y: 300 },
  { x: 760, y: 160 },
];

// adjacency matrix layout
export const MC = 26;
export const MG = 3;
export const MP = MC + MG;
export const MAT = { x: 950, y: 200 } as const; // 10·29−3 = 287 → but shifted by camera

export const CAM_GRAPH: CameraState = { x: 470, y: 330, k: 1.25 };
export const CAM_MAT: CameraState = { x: 980, y: 340, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodeP: ChannelRef<number>;
  edgeP: ChannelRef<number>;
  matU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  degU: ChannelRef<number>;
  blockU: ChannelRef<number>;
  sparseU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nodeP = tl.channel('nodeP', 0);
  const edgeP = tl.channel('edgeP', 0);
  const matU = tl.channel('matU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const degU = tl.channel('degU', 0);
  const blockU = tl.channel('blockU', 0);
  const sparseU = tl.channel('sparseU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · data with no grid ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Some data refuses to sit in a grid. Molecules, friendships, road maps, the web — what matters is not where things are, but what they touch.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 0.7, dur: 2.2, ease: ease.move });
  tl.tween(nodeP, 1, { at: 0.8, dur: 2.0, ease: ease.enter });
  tl.tween(edgeP, 1, { at: 2.4, dur: 2.6, ease: ease.draw });

  tl.caption({
    at: 7.0,
    dur: 4.8,
    text: 'A graph is the honest format for that: a set of nodes, a set of edges, and nothing else. This one has ten nodes and fifteen edges.',
  });
  tl.hold(11.8, 0.5);

  // — Beat 2 · the adjacency matrix ————————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 6.2,
    text: 'The same object can be written as a table. Row four, column five holds a one exactly when node four touches node five. This is the adjacency matrix.',
    tex: 'A_{ij} = 1 \\iff i \\sim j',
  });
  tl.tween(cam, CAMERA_HOME, { at: 12.5, dur: 1.8, ease: ease.move });
  tl.tween(matU, 1, { at: 13.3, dur: 3.2, ease: ease.linear });

  tl.caption({
    at: 19.0,
    dur: 6.0,
    text: 'Watch one edge live in both pictures. The bridge between the two halves is a single line on the left — and two mirrored cells on the right.',
  });
  tl.tween(bridgeU, 1, { at: 19.6, dur: 0.9, ease: ease.enter });
  tl.tween(bridgeU, 0, { at: 24.2, dur: 0.8, ease: ease.move });

  // — Beat 3 · degree ————————————————————————————————————————————————————
  tl.caption({
    at: 25.4,
    dur: 6.0,
    text: 'Sum a row and you get that node’s degree — how many neighbors it has. The busiest node here touches four others; the quietest touches two.',
    tex: 'd_i = \\textstyle\\sum_j A_{ij}',
  });
  tl.tween(degU, 1, { at: 26.0, dur: 1.2, ease: ease.enter });

  // — Beat 4 · structure you can see —————————————————————————————————————
  tl.caption({
    at: 31.8,
    dur: 6.2,
    text: 'Order the rows by community and the matrix confesses its structure: two dense blocks on the diagonal, and one lonely cell joining them — the bridge again.',
  });
  tl.tween(degU, 0, { at: 31.8, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_MAT, { at: 32.2, dur: 1.6, ease: ease.move });
  tl.tween(blockU, 1, { at: 33.0, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 38.4,
    dur: 5.8,
    text: 'And notice how empty it is. Ten nodes could support forty five edges; this graph uses fifteen. Real graphs are almost always this sparse.',
  });
  tl.tween(sparseU, 1, { at: 39.0, dur: 0.9, ease: ease.enter });
  tl.hold(44.2, 0.5);

  // — Beat 5 · payoff ————————————————————————————————————————————————————
  tl.caption({
    at: 44.7,
    dur: 5.8,
    text: 'Everything graph learning does from here — passing messages, finding communities, predicting missing links — is arithmetic on this one matrix.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.0, dur: 1.8, ease: ease.move });
  tl.tween(blockU, 0, { at: 45.0, dur: 0.8, ease: ease.move });
  tl.tween(sparseU, 0, { at: 45.0, dur: 0.8, ease: ease.move });

  tl.caption({
    at: 50.9,
    dur: 5.4,
    text: 'Hold onto this picture: two tight neighborhoods, one thin bridge. Every chapter that follows will push something across it.',
  });
  tl.tween(closeU, 1, { at: 51.3, dur: 0.9, ease: ease.enter });
  tl.hold(56.3, 1.2);

  return { tl, cam, nodeP, edgeP, matU, bridgeU, degU, blockU, sparseU, closeU };
}
