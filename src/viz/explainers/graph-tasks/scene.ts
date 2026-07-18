import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Graph Tasks — label the nodes, guess the missing edges.
 *
 * The 10-node community graph. Node classification is a real label
 * propagation from two seeds (node 0 red, node 9 blue): PROP[t][i] is the
 * red-probability of node i after t rounds of neighbor averaging, computed
 * here. Converged values: 1.00, 0.93, 0.93, 0.86, 0.72, 0.29, 0.22, 0.22,
 * 0.14, 0.00 — the bridge node ends at 72% red. Link prediction really
 * counts common neighbors over all 30 absent edges: the winners are 0–3
 * and 5–8 with three shared neighbors each, and no pair straddling the
 * bridge shares more than one.
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

export const SEED_RED = 0;
export const SEED_BLUE = 9;
export const ROUNDS = 24;

/** PROP[t][i] — P(red) for node i after t propagation rounds */
export const PROP: number[][] = (() => {
  let P: Array<[number, number]> = Array.from({ length: N }, () => [0.5, 0.5]);
  P[SEED_RED] = [1, 0];
  P[SEED_BLUE] = [0, 1];
  const hist: number[][] = [P.map((p) => p[0])];
  for (let t = 0; t < ROUNDS; t++) {
    P = P.map((p, i) => {
      if (i === SEED_RED) return [1, 0];
      if (i === SEED_BLUE) return [0, 1];
      let a = 0;
      let b = 0;
      let c = 0;
      for (let j = 0; j < N; j++)
        if (ADJ[i][j]) {
          a += P[j][0];
          b += P[j][1];
          c++;
        }
      return [a / c, b / c];
    });
    hist.push(P.map((p) => p[0]));
  }
  return hist;
})();
export const FINAL: number[] = PROP[ROUNDS];
export const BRIDGE_CONF: number = FINAL[4]; // ≈ 0.72

/** P(red) for node i at fractional round t — pure lookup */
export function propAt(i: number, t: number): number {
  const f = Math.max(0, Math.min(ROUNDS, t));
  const k = Math.floor(f);
  if (k >= ROUNDS) return PROP[ROUNDS][i];
  return PROP[k][i] + (PROP[k + 1][i] - PROP[k][i]) * (f - k);
}

/** all absent edges scored by common-neighbor count (≥ 2 shown on stage) */
export const CANDIDATES: Array<[number, number, number]> = (() => {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      if (ADJ[i][j]) continue;
      let cn = 0;
      for (let k = 0; k < N; k++) if (ADJ[i][k] && ADJ[j][k]) cn++;
      if (cn >= 2) out.push([i, j, cn]);
    }
  return out.sort((a, b) => b[2] - a[2]); // 0-3:3 · 5-8:3 · then the 2s
})();
export const BEST_SCORE = 3;

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

export const CAM_GRAPH: CameraState = { x: 500, y: 330, k: 1.25 };
export const CAM_BRIDGE: CameraState = { x: 470, y: 430, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  graphU: ChannelRef<number>;
  seedU: ChannelRef<number>;
  iterT: ChannelRef<number>;
  confU: ChannelRef<number>;
  taskSwapU: ChannelRef<number>; // 0 = classification view, 1 = link view
  candP: ChannelRef<number>;
  bestU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const graphU = tl.channel('graphU', 0);
  const seedU = tl.channel('seedU', 0);
  const iterT = tl.channel('iterT', 0);
  const confU = tl.channel('confU', 0);
  const taskSwapU = tl.channel('taskSwapU', 0);
  const candP = tl.channel('candP', 0);
  const bestU = tl.channel('bestU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the two questions ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Once features can flow over a graph, two workhorse questions become answerable: what is each node, and which edges are missing?',
  });
  tl.tween(graphU, 1, { at: 0.5, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_GRAPH, { at: 0.8, dur: 2.0, ease: ease.move });

  // — Beat 2 · node classification ——————————————————————————————————————
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'Start with classification. We know exactly two labels: this node is red, that node is blue. The other eight are gray — unlabeled, like most real data.',
  });
  tl.tween(seedU, 1, { at: 7.3, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 12.7,
    dur: 6.0,
    text: 'Now let the labels flow like everything else on this graph: round after round, each gray node takes the average opinion of its neighbors.',
  });
  tl.tween(iterT, 4, { at: 13.7, dur: 4.0, ease: ease.move });

  tl.caption({
    at: 19.1,
    dur: 5.4,
    text: 'The colors race outward from the seeds, meet at the bridge, and settle. Every node lands on the correct side of the split.',
  });
  tl.tween(iterT, 24, { at: 19.5, dur: 4.4, ease: ease.move });

  tl.caption({
    at: 25.1,
    dur: 6.2,
    text: 'Look closely at the bridge node: it settles at only seventy two percent red. Certainty fades with distance from the evidence — and the model admits it.',
  });
  tl.tween(cam, CAM_BRIDGE, { at: 25.5, dur: 1.6, ease: ease.move });
  tl.tween(confU, 1, { at: 26.3, dur: 0.9, ease: ease.enter });
  tl.hold(31.3, 0.6);

  // — Beat 3 · link prediction ——————————————————————————————————————————
  tl.caption({
    at: 31.9,
    dur: 5.8,
    text: 'Second task: which absent edge is most likely real? The classic signal is shared company — count how many neighbors two strangers have in common.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 32.1, dur: 1.8, ease: ease.move });
  tl.tween(confU, 0, { at: 32.1, dur: 0.7, ease: ease.move });
  tl.tween(taskSwapU, 1, { at: 32.9, dur: 1.0, ease: ease.move });
  tl.tween(candP, 1, { at: 33.7, dur: 2.8, ease: ease.linear });

  tl.caption({
    at: 38.1,
    dur: 6.0,
    text: 'Two candidates tie for first, one in each community, sharing three friends apiece. If you had to bet on a hidden connection, bet there.',
  });
  tl.tween(bestU, 1, { at: 38.7, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 44.5,
    dur: 5.6,
    text: 'And notice what does not score: no pair straddling the bridge shares more than a single neighbor. The graph’s structure protects its own division.',
  });

  // — Beat 4 · recap ————————————————————————————————————————————————————
  tl.caption({
    at: 50.5,
    dur: 5.8,
    text: 'Friend suggestions, protein interactions, fraud rings — both tasks are this exact arithmetic at scale: evidence spreading along edges.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.9, dur: 1.8, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.7, dur: 0.9, ease: ease.enter });
  tl.hold(56.9, 1.2);

  return { tl, cam, graphU, seedU, iterT, confU, taskSwapU, candP, bestU, closeU };
}
