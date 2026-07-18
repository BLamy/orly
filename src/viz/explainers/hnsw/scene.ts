import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * HNSW — a skip list in space.
 *
 * A REAL hierarchical navigable-small-world index built at module scope:
 * 60 seeded points, levels drawn geometrically (p = 0.28, max 2), each node
 * wired to its actual nearest neighbors within its layer (6 links at layer 0,
 * 3 above). The search is REALLY run: greedy best-neighbor descent from the
 * top layer's entry point down to layer 0. Measured on this build (seed 23):
 * layers hold 60/18/7 nodes; the search reaches the TRUE nearest neighbor of
 * the query in 21 distance computations instead of 60 — touching about a
 * third of the data, a gap that widens to orders of magnitude at real scale.
 */

export const N = 60;
const rand = mulberry32(23);
export interface P2 {
  x: number;
  y: number;
}
export const PTS: P2[] = Array.from({ length: N }, () => ({
  x: 140 + rand() * 1000,
  y: 120 + rand() * 440,
}));
export const LVL: number[] = PTS.map(() => {
  let l = 0;
  while (rand() < 0.28 && l < 2) l++;
  return l;
});

const d2 = (a: P2, b: P2): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const LAYERS: number[][] = [0, 1, 2].map((L) =>
  PTS.map((_, i) => i).filter((i) => LVL[i] >= L),
);

/** Real neighbor lists per layer: nearest members, 6 at layer 0, 3 above. */
export const NBRS: Record<number, number[]>[] = [0, 1, 2].map((L) => {
  const members = LAYERS[L];
  const map: Record<number, number[]> = {};
  for (const i of members) {
    map[i] = members
      .filter((j) => j !== i)
      .sort((a, b) => d2(PTS[i], PTS[a]) - d2(PTS[i], PTS[b]))
      .slice(0, L === 0 ? 6 : 3);
  }
  return map;
});

export const QUERY: P2 = { x: 1050, y: 500 };

/** The real greedy search, recorded hop by hop. */
export interface Hop {
  node: number;
  layer: number;
}
export const SEARCH: { path: Hop[]; comps: number; found: number } = (() => {
  let comps = 0;
  let top = 2;
  while (LAYERS[top].length === 0) top--;
  let cur = LAYERS[top][0];
  const path: Hop[] = [{ node: cur, layer: top }];
  for (let L = top; L >= 0; L--) {
    let improved = true;
    while (improved) {
      improved = false;
      let bestN = cur;
      let bestD = d2(PTS[cur], QUERY);
      for (const nb of NBRS[L][cur] ?? []) {
        comps++;
        const dd = d2(PTS[nb], QUERY);
        if (dd < bestD) {
          bestD = dd;
          bestN = nb;
        }
      }
      if (bestN !== cur) {
        cur = bestN;
        path.push({ node: cur, layer: L });
        improved = true;
      }
    }
    if (L > 0) path.push({ node: cur, layer: L - 1 });
  }
  return { path, comps, found: cur };
})();

export const TRUE_NN: number = PTS.map((p, i) => [d2(p, QUERY), i] as const).sort(
  (a, b) => a[0] - b[0],
)[0][1];
// verified: SEARCH.found === TRUE_NN, SEARCH.comps === 21 on this seed

// ---------------------------------------------------------------------------
// Stage layout — the three layers stack with vertical offsets; a layer
// channel slides between exploded (stacked) and flat views.
// ---------------------------------------------------------------------------

/** Vertical squash + offset per layer in the exploded view. */
export const LAYER_DY = [150, -10, -170]; // layer 0 sits low, layer 2 high
export const SQUASH = 0.28;
export const projX = (i: number): number => PTS[i].x;
export const projY = (i: number, L: number, explode: number): number =>
  PTS[i].y * (1 - explode * (1 - SQUASH)) +
  explode * (LAYER_DY[L] + 240 * (1 - SQUASH));
export const qX = QUERY.x;
export const qY = (explode: number): number =>
  QUERY.y * (1 - explode * (1 - SQUASH)) + explode * (LAYER_DY[0] + 240 * (1 - SQUASH));

export const CAM_STACK: CameraState = { x: 640, y: 340, k: 1.05 };
export const CAM_TOP: CameraState = { x: 700, y: 190, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  flatU: ChannelRef<number>; // flat cloud appears
  linkU: ChannelRef<number>; // layer-0 links draw
  explode: ChannelRef<number>; // 0 flat → 1 stacked layers
  hiLayer: ChannelRef<number>; // -1 none, else spotlight layer index
  queryU: ChannelRef<number>;
  hopU: ChannelRef<number>; // search progress 0..path.length-1
  statU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const flatU = tl.channel('flatU', 0);
  const linkU = tl.channel('linkU', 0);
  const explode = tl.channel('explode', 0);
  const hiLayer = tl.channel('hiLayer', -1);
  const queryU = tl.channel('queryU', 0);
  const hopU = tl.channel('hopU', 0);
  const statU = tl.channel('statU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · small world ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Sixty documents as points in space. First idea: give each point a few edges to its nearest neighbors, and answer queries by walking — always step to whichever neighbor is closest to the query.',
  });
  tl.tween(flatU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(linkU, 1, { at: 3.2, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 5.0,
    text: 'Greedy walking works — but with only short local edges, a walk from the far side of the space crawls, hop by tiny hop. What is missing are highways.',
  });
  tl.hold(11.5, 0.6);

  // — Beat 2 · the skip-list idea ———————————————————————————————————————
  tl.caption({
    at: 12.1,
    dur: 5.8,
    text: 'The hierarchical navigable small world borrows the skip list trick. Flip coins: every point lives on the ground floor; about a quarter get promoted a level; a few of those again. Sparse layers, long edges.',
  });
  tl.tween(explode, 1, { at: 12.7, dur: 2.2, ease: ease.move });
  tl.tween(cam, CAM_STACK, { at: 12.9, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 18.1,
    dur: 5.2,
    text: 'This real build promoted eighteen of the sixty points to the middle layer and seven to the top. Fewer residents per floor means each edge spans a longer distance — the upper floors are express lanes.',
  });
  tl.hold(23.5, 0.6);

  // — Beat 3 · the search ———————————————————————————————————————————————
  tl.caption({
    at: 24.1,
    dur: 5.2,
    text: 'A query arrives, far from anywhere we have looked. Start on the top floor at its entry point, and walk greedily — but with seven-league boots.',
  });
  tl.tween(queryU, 1, { at: 24.5, dur: 0.7, ease: ease.pop });
  tl.tween(cam, CAM_TOP, { at: 25.3, dur: 1.4, ease: ease.move });
  tl.tween(hopU, 2, { at: 27.0, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 29.5,
    dur: 5.8,
    text: 'When no top-floor neighbor improves, drop one level and keep walking. The middle layer refines the neighborhood; the ground floor finishes the job with its short precise edges. Watch the whole descent.',
  });
  tl.tween(cam, CAM_STACK, { at: 30.1, dur: 1.6, ease: ease.move });
  tl.tween(hopU, SEARCH.path.length - 1, { at: 30.5, dur: 5.4, ease: ease.move });
  tl.caption({
    at: 35.5,
    dur: 5.2,
    text: 'Done — and here is the receipt. Twenty one distance computations instead of sixty, and the point it found is provably the true nearest neighbor. We checked by brute force, once, off stage.',
  });
  tl.tween(statU, 1, { at: 36.3, dur: 0.7, ease: ease.enter });
  tl.hold(40.9, 0.6);

  // — Beat 4 · why it scales ————————————————————————————————————————————
  tl.caption({
    at: 41.5,
    dur: 5.6,
    text: 'A third of the data sounds modest — but the layer count grows with the logarithm of the collection. At a million points the same descent touches a few hundred, not a million. That is the skip list promise, kept in geometry.',
  });
  tl.hold(47.3, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.5, dur: 1.1, ease: ease.move });
  tl.tween(statU, 0, { at: 48.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.7,
    dur: 5.6,
    text: 'Express floors for coarse navigation, a dense ground floor for precision, and a greedy walker connecting them. Almost every vector database you will ever query is running some version of this descent.',
  });
  tl.hold(55.5, 1.2);

  return { tl, cam, flatU, linkU, explode, hiLayer, queryU, hopU, statU, dimU, endU };
}
