import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Graph Message Passing — one layer of a graph neural network, computed.
 *
 * The same 10-node two-community graph. Node features are 2-dimensional
 * (red, blue) starting at pure community colors. One message-passing layer
 * is really computed at module scope: h_i' = mean over {i} ∪ N(i) of h.
 * The narration's numbers come from H1: the bridge node 4 averages itself
 * and neighbors {0, 3, 5} → exactly (0.75, 0.25); its neighbor 5 becomes
 * (0.2, 0.8) by the same arithmetic. A second layer (H2) is also computed
 * for the "stack layers and influence spreads" beat.
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
export const NEIGH: number[][] = ADJ.map((row, i) =>
  row.map((v, j) => (v ? j : -1)).filter((j) => j >= 0),
);

export type Feat = readonly [number, number];
export const H0: Feat[] = Array.from({ length: N }, (_, i) => (i < 5 ? [1, 0] : [0, 1]));

function layer(H: Feat[]): Feat[] {
  return H.map((h, i) => {
    let a = h[0];
    let b = h[1];
    let c = 1;
    for (const j of NEIGH[i]) {
      a += H[j][0];
      b += H[j][1];
      c++;
    }
    return [a / c, b / c] as const;
  });
}
export const H1: Feat[] = layer(H0); // H1[4] = [0.75, 0.25] · H1[5] = [0.2, 0.8]
export const H2: Feat[] = layer(H1);

export const FOCUS = 4; // the bridge node
export const FOCUS_NEIGH: number[] = NEIGH[FOCUS]; // [0, 3, 5]

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

export const CAM_FOCUS: CameraState = { x: 400, y: 420, k: 1.55 };
export const CAM_WIDE: CameraState = { x: 560, y: 340, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  graphU: ChannelRef<number>;
  featU: ChannelRef<number>;
  focusU: ChannelRef<number>;
  msgP: ChannelRef<number>;
  blend4: ChannelRef<number>; // node 4: H0 → H1
  blendAll: ChannelRef<number>; // everyone else: H0 → H1
  blend2: ChannelRef<number>; // H1 → H2
  mathU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const graphU = tl.channel('graphU', 0);
  const featU = tl.channel('featU', 0);
  const focusU = tl.channel('focusU', 0);
  const msgP = tl.channel('msgP', 0);
  const blend4 = tl.channel('blend4', 0);
  const blendAll = tl.channel('blendAll', 0);
  const blend2 = tl.channel('blend2', 0);
  const mathU = tl.channel('mathU', 0);
  const panelU = tl.channel('panelU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the problem ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A neural network wants fixed-size inputs in a fixed order. A graph has neither — node four is not before or after node five, just connected to it.',
  });
  tl.tween(graphU, 1, { at: 0.5, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_WIDE, { at: 0.8, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'Graph networks solve it with one idea: every node carries a feature vector, and learns by trading messages with its neighbors — nobody else.',
  });
  tl.tween(featU, 1, { at: 7.3, dur: 1.4, ease: ease.enter });
  tl.hold(11.9, 0.5);

  // — Beat 2 · one node, one layer ——————————————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 5.6,
    text: 'Watch the bridge node. Its feature starts fully red — it only knows its own community. Its three neighbors are about to change that.',
  });
  tl.tween(cam, CAM_FOCUS, { at: 12.6, dur: 1.8, ease: ease.move });
  tl.tween(focusU, 1, { at: 13.4, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 18.4,
    dur: 6.2,
    text: 'Each neighbor sends its current feature along the edge. The node collects the three messages, adds its own, and takes the average. That is the whole layer.',
    tex: "h_i' = \\mathrm{mean}\\{h_j : j \\in \\{i\\} \\cup N(i)\\}",
  });
  tl.tween(msgP, 1, { at: 18.8, dur: 3.4, ease: ease.linear });
  tl.tween(mathU, 1, { at: 19.2, dur: 0.9, ease: ease.enter });
  tl.tween(blend4, 1, { at: 22.4, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 25.2,
    dur: 6.0,
    text: 'Do the arithmetic: three red votes and one blue vote, averaged, is three quarters red and one quarter blue. The bridge node just learned the other side exists.',
  });
  tl.tween(panelU, 1, { at: 25.6, dur: 0.9, ease: ease.enter });
  tl.hold(31.2, 0.6);

  // — Beat 3 · everyone at once —————————————————————————————————————————
  tl.caption({
    at: 31.8,
    dur: 5.8,
    text: 'And crucially, every node does this at the same time, with the same rule. One layer of message passing updates the entire graph in parallel.',
  });
  tl.tween(panelU, 0, { at: 31.8, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 32.2, dur: 1.8, ease: ease.move });
  tl.tween(blendAll, 1, { at: 33.2, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 37.8,
    dur: 5.6,
    text: 'After one layer, only the bridge and its neighbors feel the other community. Every node has learned exactly its one-hop neighborhood.',
  });

  tl.caption({
    at: 43.6,
    dur: 6.0,
    text: 'Stack a second layer and messages travel two hops: the purple tint seeps one ring deeper into each side. Depth in a graph network is reach.',
  });
  tl.tween(blend2, 1, { at: 44.6, dur: 1.6, ease: ease.move });
  tl.hold(49.6, 0.5);

  // — Beat 4 · what training adds ———————————————————————————————————————
  tl.caption({
    at: 50.1,
    dur: 6.0,
    text: 'A real network wraps this averaging in learned weights — which features to send, how much to trust each message. But the skeleton is what you saw.',
  });

  tl.caption({
    at: 56.3,
    dur: 5.6,
    text: 'Message passing is the whole trick: local exchanges, repeated, until each node’s vector describes its place in the graph.',
  });
  tl.tween(closeU, 1, { at: 56.7, dur: 0.9, ease: ease.enter });
  tl.hold(61.9, 1.2);

  return { tl, cam, graphU, featU, focusU, msgP, blend4, blendAll, blend2, mathU, panelU, closeU };
}
