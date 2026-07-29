import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Decision Trees — twenty questions with data.
 *
 * All math at module scope and verified by running it: 90 seeded points
 * whose true rule is "class one if x is past forty five hundredths OR y is
 * above sixty two hundredths" (5% label noise), a REAL greedy split search
 * maximizing information gain. Verified: root entropy 0.929 bits, best root
 * split x at 0.469 (gain 0.379); left region (42 pts, entropy 0.893) splits
 * y at 0.589 (gain 0.622); right region (48 pts, entropy 0.250) is nearly
 * pure. The sweep curves shown are the actual gain at every candidate cut.
 */

const rand = mulberry32(21);

export interface Pt {
  x: number;
  y: number;
  c: 0 | 1;
}
export const POINTS: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i < 90; i++) {
    const x = rand();
    const y = rand();
    let c: 0 | 1 = x > 0.45 || y > 0.62 ? 1 : 0;
    if (rand() < 0.05) c = c === 1 ? 0 : 1;
    pts.push({ x, y, c });
  }
  return pts;
})();

export function entropy(s: Pt[]): number {
  if (!s.length) return 0;
  const p = s.filter((q) => q.c === 1).length / s.length;
  if (p === 0 || p === 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

function gainAt(s: Pt[], ax: 'x' | 'y', t: number): number {
  const L = s.filter((p) => p[ax] <= t);
  const R = s.filter((p) => p[ax] > t);
  return entropy(s) - (L.length / s.length) * entropy(L) - (R.length / s.length) * entropy(R);
}

function bestSplit(s: Pt[]): { ax: 'x' | 'y'; t: number; gain: number } {
  let best: { ax: 'x' | 'y'; t: number; gain: number } | null = null;
  for (const ax of ['x', 'y'] as const) {
    const vals = [...new Set(s.map((p) => p[ax]))].sort((a, b) => a - b);
    for (let i = 1; i < vals.length; i++) {
      const t = (vals[i - 1] + vals[i]) / 2;
      const g = gainAt(s, ax, t);
      if (!best || g > best.gain) best = { ax, t, gain: g };
    }
  }
  return best!;
}

export const H_ROOT = entropy(POINTS); // 0.929
export const ROOT = bestSplit(POINTS); // x @ 0.469, gain 0.379
export const LEFT: Pt[] = POINTS.filter((p) => p[ROOT.ax] <= ROOT.t);
export const RIGHT: Pt[] = POINTS.filter((p) => p[ROOT.ax] > ROOT.t);
export const H_LEFT = entropy(LEFT); // 0.893
export const H_RIGHT = entropy(RIGHT); // 0.250
export const SPLIT_L = bestSplit(LEFT); // y @ 0.589, gain 0.622
export const LEFT_DOWN: Pt[] = LEFT.filter((p) => p.y <= SPLIT_L.t);
export const LEFT_UP: Pt[] = LEFT.filter((p) => p.y > SPLIT_L.t);

const majority = (s: Pt[]): 0 | 1 => (s.filter((p) => p.c === 1).length * 2 >= s.length ? 1 : 0);
export const LEAF_RIGHT = majority(RIGHT); // 1
export const LEAF_LU = majority(LEFT_UP); // 1
export const LEAF_LD = majority(LEFT_DOWN); // 0
export const N1 = POINTS.filter((p) => p.c === 1).length;
export const TRAIN_CORRECT = POINTS.filter((p) => {
  const pred = p.x > ROOT.t ? LEAF_RIGHT : p.y > SPLIT_L.t ? LEAF_LU : LEAF_LD;
  return pred === p.c;
}).length;

// gain curves for the animated sweeps (dense sampling, real gains)
export const SWEEP_N = 120;
export const GAIN_ROOT_X: number[] = Array.from({ length: SWEEP_N }, (_, i) =>
  gainAt(POINTS, 'x', 0.02 + (0.96 * i) / (SWEEP_N - 1)),
);
export const GAIN_LEFT_Y: number[] = Array.from({ length: SWEEP_N }, (_, i) =>
  gainAt(LEFT, 'y', 0.02 + (0.96 * i) / (SWEEP_N - 1)),
);
export const GAIN_MAX = Math.max(...GAIN_ROOT_X, ...GAIN_LEFT_Y);
export const sweepT = (i: number): number => 0.02 + (0.96 * i) / (SWEEP_N - 1);

// stage mapping — scatter left, tree right
export const PLOT = { x: 80, y: 70, w: 520, h: 520 };
export const sx = (x: number): number => PLOT.x + x * PLOT.w;
export const sy = (y: number): number => PLOT.y + PLOT.h - y * PLOT.h;

// gain curve strip under the plot? no — right column, above the tree
export const CURVE = { x: 700, y: 90, w: 460, h: 150 };
export const TREE = { rootX: 930, rootY: 330, dx: 150, dy: 105 };

export const CAM_PLOT: CameraState = { x: 340, y: 330, k: 1.35 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>;
  hTexU: ChannelRef<number>;
  sweep1: ChannelRef<number>; // 0..1 sweep position across x (root)
  curve1U: ChannelRef<number>;
  cut1U: ChannelRef<number>;
  tint1U: ChannelRef<number>;
  tree1U: ChannelRef<number>;
  sweep2: ChannelRef<number>;
  curve2U: ChannelRef<number>;
  cut2U: ChannelRef<number>;
  tint2U: ChannelRef<number>;
  tree2U: ChannelRef<number>;
  leafU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const hTexU = tl.channel('hTexU', 0);
  const sweep1 = tl.channel('sweep1', 0);
  const curve1U = tl.channel('curve1U', 0);
  const cut1U = tl.channel('cut1U', 0);
  const tint1U = tl.channel('tint1U', 0);
  const tree1U = tl.channel('tree1U', 0);
  const sweep2 = tl.channel('sweep2', 0);
  const curve2U = tl.channel('curve2U', 0);
  const cut2U = tl.channel('cut2U', 0);
  const tint2U = tl.channel('tint2U', 0);
  const tree2U = tl.channel('tree2U', 0);
  const leafU = tl.channel('leafU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · twenty questions ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'A decision tree plays twenty questions with your data. Ninety labeled points, two colors, and one goal: sort them with the fewest, sharpest yes or no questions.',
  });
  tl.tween(ptsU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.0, 0.5);

  // — Beat 2 · entropy as the score ————————————————————————————————————————
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'First we need a score for how mixed up a room is. Entropy measures exactly that: this room holds both colors thoroughly shuffled, so it sits near one full bit of uncertainty.',
    tex: 'H = -p \\log_2 p - (1-p)\\log_2(1-p) = 0.93',
  });
  tl.tween(hTexU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 12.5,
    dur: 4.4,
    text: 'A good question splits the room so each side is purer than the whole. The drop in entropy is called information gain, and the tree is simply greedy for it.',
  });
  tl.hold(17.1, 0.5);

  // — Beat 3 · sweep the first cut ———————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 17.6, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 17.8,
    dur: 5.8,
    text: 'So the tree tries every possible cut. Watch it sweep a vertical line across the data, computing the true information gain at every stop. The curve below is that measurement, live.',
  });
  tl.tween(curve1U, 1, { at: 18.4, dur: 0.8, ease: ease.enter });
  tl.tween(sweep1, 1, { at: 18.8, dur: 4.6, ease: ease.linear });
  tl.caption({
    at: 24.0,
    dur: 5.2,
    text: 'The winner is a cut just left of the middle, at forty seven hundredths. It buys about four tenths of a bit. That single greedy choice becomes the root of the tree.',
  });
  tl.tween(cut1U, 1, { at: 24.6, dur: 1.0, ease: ease.draw });
  tl.tween(tint1U, 1, { at: 25.4, dur: 1.0, ease: ease.move });
  tl.tween(tree1U, 1, { at: 26.4, dur: 0.9, ease: ease.enter });
  tl.hold(29.4, 0.6);

  // — Beat 4 · recurse into the messy side ————————————————————————————————
  tl.caption({
    at: 30.0,
    dur: 5.4,
    text: 'The right side came out nearly pure, a quarter bit of entropy. The left side is still a mess at nine tenths of a bit. So the tree asks its next question there, and only there.',
  });
  tl.caption({
    at: 35.6,
    dur: 5.6,
    text: 'Same search, new room: sweep a horizontal cut across just the left region. The gain peaks hard at fifty nine hundredths, worth six tenths of a bit. Cut there.',
  });
  tl.tween(curve2U, 1, { at: 36.0, dur: 0.8, ease: ease.enter });
  tl.tween(curve1U, 0.15, { at: 36.0, dur: 0.8, ease: ease.move });
  tl.tween(sweep2, 1, { at: 36.4, dur: 4.0, ease: ease.linear });
  tl.tween(cut2U, 1, { at: 40.6, dur: 1.0, ease: ease.draw });
  tl.tween(tint2U, 1, { at: 41.4, dur: 1.0, ease: ease.move });
  tl.tween(tree2U, 1, { at: 41.8, dur: 0.9, ease: ease.enter });
  tl.hold(43.4, 0.6);

  // — Beat 5 · the boundary is a staircase ————————————————————————————————
  tl.tween(leafU, 1, { at: 44.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.2,
    dur: 5.6,
    text: 'Two questions, three rooms, each answered by its majority color. Eighty six of the ninety points are now sorted correctly, and the decision boundary is an axis aligned staircase.',
  });
  tl.caption({
    at: 50.0,
    dur: 5.4,
    text: 'That staircase is the signature of trees: every question slices along one axis, so the map is always rectangles. Elegant for rules like this one, clumsy for smooth diagonal truths.',
  });
  tl.hold(55.6, 0.5);

  // — Beat 6 · when to stop asking ————————————————————————————————————————
  tl.caption({
    at: 56.1,
    dur: 5.6,
    text: 'And the four points still wrong? Keep asking questions and the tree will happily carve a private room for every one of them, memorizing noise. Perfect on training data, brittle on the future.',
  });
  tl.caption({
    at: 61.9,
    dur: 4.4,
    text: 'So real trees stop early: limit the depth, require a minimum room size, or prune afterward. Knowing when to stop asking is most of the craft.',
  });
  tl.hold(66.5, 0.6);

  // — Beat 7 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 67.1, dur: 1.1, ease: ease.move });
  tl.tween(hTexU, 0, { at: 67.1, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 68.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 68.3,
    dur: 5.8,
    text: 'That is a decision tree: measure the mess with entropy, greedily buy the biggest drop, recurse into whatever stays messy, and stop before you start memorizing. Next: what happens when trees vote.',
  });
  tl.hold(74.3, 1.2);

  return {
    tl,
    cam,
    ptsU,
    hTexU,
    sweep1,
    curve1U,
    cut1U,
    tint1U,
    tree1U,
    sweep2,
    curve2U,
    cut2U,
    tint2U,
    tree2U,
    leafU,
    dimU,
    endU,
  };
}
