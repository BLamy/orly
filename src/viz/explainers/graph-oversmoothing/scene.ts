import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Graph Over-smoothing — depth is reach, until it is erasure.
 *
 * The 10-node community graph again. Node features start at their community
 * corner plus small seeded jitter; each layer replaces every feature with
 * the plain mean of its neighbors. The full 16-layer trajectory and the
 * between-community separation SEP[k] are computed at module scope; the
 * narration's "roughly halved by depth eight, all but gone by sixteen"
 * claims are checked against SEP (SEP[8]/SEP[0] ≈ 0.49, SEP[16]/SEP[0] ≈
 * 0.25 with this seed).
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
const NEIGH: number[][] = (() => {
  const A: number[][] = Array.from({ length: N }, () => []);
  for (const [a, b] of EDGES) {
    A[a].push(b);
    A[b].push(a);
  }
  return A;
})();

export type Feat = readonly [number, number];
export const DEPTH = 16;

/** jittered community-corner initial features */
export const H_INIT: Feat[] = (() => {
  const rand = mulberry32(23);
  return Array.from({ length: N }, (_, i) => {
    const jx = (rand() - 0.5) * 0.24;
    const jy = (rand() - 0.5) * 0.24;
    return i < 5 ? ([0.8 + jx, 0.2 + jy] as const) : ([0.2 + jx, 0.8 + jy] as const);
  });
})();

/** TRAJ[k][i] — node i's feature after k pure neighbor-mean layers */
export const TRAJ: Feat[][] = (() => {
  const out: Feat[][] = [H_INIT];
  for (let k = 0; k < DEPTH; k++) {
    const H = out[k];
    out.push(
      H.map((_, i) => {
        let a = 0;
        let b = 0;
        for (const j of NEIGH[i]) {
          a += H[j][0];
          b += H[j][1];
        }
        return [a / NEIGH[i].length, b / NEIGH[i].length] as const;
      }),
    );
  }
  return out;
})();

/** between-community centroid separation at each depth */
export const SEP: number[] = TRAJ.map((H) => {
  const mean = (c: number): Feat => {
    let x = 0;
    let y = 0;
    for (let i = c * 5; i < c * 5 + 5; i++) {
      x += H[i][0];
      y += H[i][1];
    }
    return [x / 5, y / 5];
  };
  const a = mean(0);
  const b = mean(1);
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
});
export const SEP_RATIO_8: number = SEP[8] / SEP[0];
export const SEP_RATIO_16: number = SEP[16] / SEP[0];

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
/** node i's feature at fractional depth d (pure lerp along the trajectory) */
export function featAt(i: number, d: number): Feat {
  const f = Math.max(0, Math.min(DEPTH, d));
  const k = Math.floor(f);
  if (k >= DEPTH) return TRAJ[DEPTH][i];
  const u = f - k;
  const a = TRAJ[k][i];
  const b = TRAJ[k + 1][i];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
/** separation at fractional depth (drives the curve marker) */
export function sepAt(d: number): number {
  const f = Math.max(0, Math.min(DEPTH, d));
  const k = Math.floor(f);
  if (k >= DEPTH) return SEP[DEPTH];
  return SEP[k] + (SEP[k + 1] - SEP[k]) * (f - k);
}

// ---------------------------------------------------------------------------
// Layout: feature plane left, separation curve right
// ---------------------------------------------------------------------------
export const fx: ScaleLinear<number, number> = scaleLinear().domain([0, 1]).range([120, 620]);
export const fy: ScaleLinear<number, number> = scaleLinear().domain([0, 1]).range([560, 120]);
export const cx: ScaleLinear<number, number> = scaleLinear().domain([0, DEPTH]).range([760, 1180]);
export const cy: ScaleLinear<number, number> = scaleLinear().domain([0, 1]).range([520, 200]);

export const CAM_PLANE: CameraState = { x: 400, y: 340, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  dotU: ChannelRef<number>;
  depth: ChannelRef<number>;
  curveU: ChannelRef<number>;
  markU: ChannelRef<number>;
  noteU: ChannelRef<number>;
  fixU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const dotU = tl.channel('dotU', 0);
  const depth = tl.channel('depth', 0);
  const curveU = tl.channel('curveU', 0);
  const markU = tl.channel('markU', 0);
  const noteU = tl.channel('noteU', 0);
  const fixU = tl.channel('fixU', 0);

  // — Beat 1 · the tempting idea ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Last chapter, one layer meant one hop of context. So surely more layers mean more understanding — pile them up and let messages travel far.',
  });
  tl.tween(cam, CAM_PLANE, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(dotU, 1, { at: 1.8, dur: 1.6, ease: ease.enter });

  tl.caption({
    at: 6.3,
    dur: 5.2,
    text: 'Each dot is one node’s feature vector, plotted as a point. Ten nodes, two clean clusters — the two communities, plus each node’s own personality.',
  });
  tl.hold(11.5, 0.5);

  // — Beat 2 · watch the layers stack ———————————————————————————————————
  tl.caption({
    at: 12.0,
    dur: 5.6,
    text: 'Apply one message-passing layer: every feature becomes the average of its neighbors. Watch — both clusters tighten and drift toward each other.',
  });
  tl.tween(depth, 1, { at: 13.2, dur: 2.4, ease: ease.move });

  tl.caption({
    at: 17.8,
    dur: 5.8,
    text: 'Keep stacking. By four layers the personalities are gone — nodes of the same community have averaged themselves into near clones.',
  });
  tl.tween(depth, 4, { at: 18.6, dur: 3.6, ease: ease.move });

  tl.caption({
    at: 23.8,
    dur: 6.2,
    text: 'By eight layers, the distance between the two communities has roughly halved. By sixteen, it is down to a quarter — the graph is dissolving into one gray dot.',
  });
  tl.tween(depth, 16, { at: 24.6, dur: 5.0, ease: ease.move });
  tl.hold(30.0, 0.6);

  // — Beat 3 · the measurement ——————————————————————————————————————————
  tl.caption({
    at: 30.6,
    dur: 5.6,
    text: 'This is over-smoothing, and it is measurable: plot the separation between the communities against depth, and it decays layer after layer.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 30.8, dur: 1.8, ease: ease.move });
  tl.tween(curveU, 1, { at: 31.6, dur: 2.6, ease: ease.draw });
  tl.tween(markU, 1, { at: 33.4, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 36.6,
    dur: 6.2,
    text: 'The culprit is the math itself. Averaging is a contraction — apply it forever and every starting point lands on the same fixed blend of the graph.',
  });
  tl.tween(noteU, 1, { at: 38.2, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 43.2,
    dur: 5.6,
    text: 'You have met this force before: it is the same settling that carries a random walk to its stationary distribution. Useful there — fatal here.',
  });

  // — Beat 4 · the fixes ————————————————————————————————————————————————
  tl.caption({
    at: 49.2,
    dur: 6.0,
    text: 'So graph networks stay shallow — two or three layers is typical — or add residual connections, letting each node keep a copy of its old self alongside the average.',
  });
  tl.tween(noteU, 0, { at: 49.2, dur: 0.7, ease: ease.move });
  tl.tween(fixU, 1, { at: 50.0, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 55.4,
    dur: 5.8,
    text: 'Depth is reach, but reach comes at the price of identity. A good graph network listens to its neighborhood without forgetting who it is.',
  });
  tl.hold(61.2, 1.2);

  return { tl, cam, axU, dotU, depth, curveU, markU, noteU, fixU };
}
