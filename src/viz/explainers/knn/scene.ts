import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * k-Nearest Neighbors — memory as a model.
 *
 * All math at module scope and verified by running it: 80 seeded points
 * (two gaussian classes), the REAL kNN vote field on a 30x22 grid for
 * k = 1, 7, 25 (the decision boundary you see is the actual majority vote),
 * leave-one-out error per k (9, 6, 7, 7, 7, 8 mistakes of 80 for
 * k = 1, 3, 7, 15, 25, 39), and the curse of dimensionality measured
 * directly: nearest-vs-farthest distance contrast for 100 uniform points,
 * collapsing from 243.7 in one dimension to 0.29 in one hundred.
 */

const rand = mulberry32(7);
const g = gaussian(rand);

export interface Pt {
  x: number;
  y: number;
  c: 0 | 1;
}
export const POINTS: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i < 40; i++) pts.push({ x: -1.1 + g() * 0.85, y: -0.5 + g() * 0.85, c: 0 });
  for (let i = 0; i < 40; i++) pts.push({ x: 1.1 + g() * 0.85, y: 0.5 + g() * 0.85, c: 1 });
  return pts;
})();

// data window and stage mapping (scatter lives on the left half)
export const DATA = { x0: -3.1, x1: 3.1, y0: -2.5, y1: 2.5 };
export const PLOT = { x: 70, y: 78, w: 610, h: 492 };
export const sx = (x: number): number => PLOT.x + ((x - DATA.x0) / (DATA.x1 - DATA.x0)) * PLOT.w;
export const sy = (y: number): number => PLOT.y + PLOT.h - ((y - DATA.y0) / (DATA.y1 - DATA.y0)) * PLOT.h;

/** kNN vote (fraction of the k nearest that are class 1) at a data point. */
export function vote(x: number, y: number, k: number): number {
  const d = POINTS.map((p) => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, c: p.c })).sort((a, b) => a.d - b.d);
  let s = 0;
  for (let i = 0; i < k; i++) s += d[i].c;
  return s / k;
}

/** indices of the k nearest training points to (x, y). */
export function nearest(x: number, y: number, k: number): number[] {
  return POINTS.map((p, i) => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, i }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((o) => o.i);
}

// the vote field, precomputed for the three k values we morph between
export const FIELD_COLS = 30;
export const FIELD_ROWS = 22;
export const FIELD_KS = [1, 7, 25] as const;
export const FIELDS: number[][] = FIELD_KS.map((k) => {
  const f: number[] = [];
  for (let r = 0; r < FIELD_ROWS; r++)
    for (let c = 0; c < FIELD_COLS; c++) {
      const x = DATA.x0 + ((c + 0.5) / FIELD_COLS) * (DATA.x1 - DATA.x0);
      const y = DATA.y1 - ((r + 0.5) / FIELD_ROWS) * (DATA.y1 - DATA.y0);
      f.push(vote(x, y, k));
    }
  return f;
});

/** field value at cell index for fractional k-mix in [0, 2]. */
export function fieldAt(mix: number, idx: number): number {
  const m = Math.max(0, Math.min(FIELDS.length - 1, mix));
  const i = Math.min(FIELDS.length - 2, Math.floor(m));
  const t = m - i;
  return FIELDS[i][idx] + (FIELDS[i + 1][idx] - FIELDS[i][idx]) * t;
}

// leave-one-out error per k — verified: 9, 6, 7, 7, 7, 8 of 80
export const LOO_KS = [1, 3, 7, 15, 25, 39] as const;
export const LOO_ERR: number[] = LOO_KS.map((k) => {
  let err = 0;
  for (let i = 0; i < POINTS.length; i++) {
    const d = POINTS.map((p, j) => ({ d: (p.x - POINTS[i].x) ** 2 + (p.y - POINTS[i].y) ** 2, c: p.c, j }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d);
    let s = 0;
    for (let m = 0; m < k; m++) s += d[m].c;
    if ((s / k >= 0.5 ? 1 : 0) !== POINTS[i].c) err++;
  }
  return err;
});

// curse of dimensionality: distance contrast from one grid cell's center to
// 100 seeded uniform points, per dimension — verified numbers.
export const DIMS = [1, 2, 5, 10, 50, 100] as const;
export const CONTRAST: number[] = DIMS.map((d) => {
  const r = mulberry32(11);
  const P = Array.from({ length: 100 }, () => Array.from({ length: d }, () => r()));
  const dists = P.map((p) => Math.sqrt(p.reduce((s, v) => s + (v - 0.5) ** 2, 0)));
  const mn = Math.min(...dists);
  const mx = Math.max(...dists);
  return (mx - mn) / mn;
});

// the query point's tour (data coords) — sampled along a smooth polyline
export const TOUR: { x: number; y: number }[] = [
  { x: -0.1, y: 1.3 },
  { x: 0.5, y: 0.2 },
  { x: -0.4, y: -0.4 },
  { x: 0.15, y: 0.55 },
];
export function tourAt(u: number): { x: number; y: number } {
  const f = Math.max(0, Math.min(TOUR.length - 1, u));
  const i = Math.min(TOUR.length - 2, Math.floor(f));
  const t = f - i;
  return { x: TOUR[i].x + (TOUR[i + 1].x - TOUR[i].x) * t, y: TOUR[i].y + (TOUR[i + 1].y - TOUR[i].y) * t };
}

// right-hand panels
export const CHART = { x: 760, y: 150, w: 420, h: 300 };
export const BARS = { x: 760, y: 130, w: 420, h: 360 };

export const CAM_PLOT: CameraState = { x: 375, y: 324, k: 1.32 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>;
  queryU: ChannelRef<number>;
  tourU: ChannelRef<number>;
  kLinks: ChannelRef<number>;
  fieldU: ChannelRef<number>;
  kMix: ChannelRef<number>;
  chartU: ChannelRef<number>;
  chartProg: ChannelRef<number>;
  curseU: ChannelRef<number>;
  curseProg: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const queryU = tl.channel('queryU', 0);
  const tourU = tl.channel('tourU', 0);
  const kLinks = tl.channel('kLinks', 0); // how many neighbor links are drawn
  const fieldU = tl.channel('fieldU', 0);
  const kMix = tl.channel('kMix', 0); // 0 → k=1, 1 → k=7, 2 → k=25
  const chartU = tl.channel('chartU', 0);
  const chartProg = tl.channel('chartProg', 0);
  const curseU = tl.channel('curseU', 0);
  const curseProg = tl.channel('curseProg', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a model that is only memory ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is the laziest learning algorithm ever proposed. Training consists of doing nothing: just keep every labeled example you have ever seen, all eighty of them.',
  });
  tl.tween(ptsU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.1,
    dur: 4.6,
    text: 'All the work happens at question time. A new point arrives, and the model answers with pure geography: what do my neighbors say?',
  });
  tl.tween(queryU, 1, { at: 7.0, dur: 0.6, ease: ease.pop });
  tl.hold(10.9, 0.6);

  // — Beat 2 · one neighbor votes —————————————————————————————————————————
  tl.caption({
    at: 11.5,
    dur: 5.2,
    text: 'With k set to one, the rule is a single line of logic: find the closest stored example, and copy its label. One neighbor, one vote, no argument.',
  });
  tl.tween(kLinks, 1, { at: 12.2, dur: 0.8, ease: ease.draw });
  tl.tween(tourU, 1.6, { at: 13.0, dur: 3.4, ease: ease.move });
  tl.caption({
    at: 17.1,
    dur: 4.6,
    text: 'Slide the question around and the answer flips whenever a different neighbor becomes the closest. Paint every possible question with its answer, and you get a map.',
  });
  tl.tween(tourU, 3, { at: 17.4, dur: 3.2, ease: ease.move });
  tl.hold(22.1, 0.5);

  // — Beat 3 · the k=1 boundary is jagged ——————————————————————————————————
  tl.caption({
    at: 22.6,
    dur: 5.6,
    text: 'This is the decision boundary for one neighbor. Look how jagged it is: every noisy point carves out its own little island of influence, because one vote is enough to win.',
  });
  tl.tween(fieldU, 1, { at: 23.0, dur: 1.6, ease: ease.draw });
  tl.tween(kLinks, 0, { at: 23.0, dur: 0.6, ease: ease.move });
  tl.tween(queryU, 0, { at: 23.0, dur: 0.6, ease: ease.move });
  tl.hold(28.4, 0.5);

  // — Beat 4 · raising k smooths the map ———————————————————————————————————
  tl.caption({
    at: 28.9,
    dur: 5.4,
    text: 'Now let seven neighbors vote instead of one. The islands dissolve: a lone mislabeled point gets outvoted by its surroundings, and the boundary relaxes into something smoother.',
  });
  tl.tween(kMix, 1, { at: 29.6, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 34.5,
    dur: 5.0,
    text: 'Push on to twenty five voters and the map keeps softening. But there is a limit: ask everyone, and every question just gets the majority label of the whole dataset.',
  });
  tl.tween(kMix, 2, { at: 35.2, dur: 2.6, ease: ease.move });
  tl.hold(39.7, 0.6);

  // — Beat 5 · measuring the sweet spot ————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 40.3, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 40.5,
    dur: 5.6,
    text: 'We can measure this trade off honestly. Hide each point in turn, ask its neighbors to classify it, and count the mistakes. This is leave one out validation, run for real on these eighty points.',
  });
  tl.tween(chartU, 1, { at: 41.4, dur: 1.2, ease: ease.draw });
  tl.tween(chartProg, LOO_KS.length, { at: 42.6, dur: 3.2, ease: ease.linear });
  tl.caption({
    at: 46.3,
    dur: 5.6,
    text: 'One neighbor makes nine mistakes, too twitchy. Thirty nine neighbors make eight, too blurry. The middle values settle around six or seven. The sweet spot is real, and it lives between the extremes.',
  });
  tl.hold(52.1, 0.6);

  // — Beat 6 · the curse of dimensionality —————————————————————————————————
  tl.caption({
    at: 52.7,
    dur: 5.2,
    text: 'One warning before you fall in love with this model. Its whole premise is that near means similar. In high dimensions, near quietly stops existing.',
  });
  tl.tween(chartU, 0, { at: 53.0, dur: 0.8, ease: ease.move });
  tl.tween(curseU, 1, { at: 54.2, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 58.1,
    dur: 6.2,
    text: 'Take one hundred random points and measure the gap between your nearest and farthest neighbor. In one dimension the nearest is two hundred forty times closer. In one hundred dimensions the gap shrinks to twenty nine percent.',
  });
  tl.tween(curseProg, DIMS.length, { at: 58.6, dur: 4.6, ease: ease.linear });
  tl.caption({
    at: 64.5,
    dur: 4.8,
    text: 'When everyone is roughly the same distance away, the closest voter is closest by accident. Distance based memory works beautifully in low dimensions, and dissolves in high ones.',
  });
  tl.hold(69.5, 0.6);

  // — Beat 7 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 70.1, dur: 1.1, ease: ease.move });
  tl.tween(curseU, 0.13, { at: 70.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 71.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 71.3,
    dur: 5.8,
    text: 'That is nearest neighbors: no training, all memory, and one dial. Small k memorizes the noise, large k blurs the signal, and validation, not intuition, tells you where to stand.',
  });
  tl.hold(77.3, 1.2);

  return { tl, cam, ptsU, queryU, tourU, kLinks, fieldU, kMix, chartU, chartProg, curseU, curseProg, dimU, endU };
}
