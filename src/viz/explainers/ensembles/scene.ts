import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Ensembles — the wisdom of weak learners.
 *
 * All math at module scope and verified by running it.
 * Bagging: 60 seeded noisy samples of a sine, 300 real regression trees
 * (depth 4) fit on bootstrap resamples. Measured at x = 0.3: a single tree's
 * prediction has standard deviation 0.058 across bootstraps; the average of
 * 30 trees has standard deviation 0.011 — a variance ratio of 0.036,
 * matching the theoretical 1/30 = 0.033.
 * Boosting: a real AdaBoost run (12 rounds of decision stumps) on 60 seeded
 * 2-D points. Weighted errors, alphas, and per-point weights are the actual
 * run; ensemble training error falls 4 → 1 → 0 by round 5.
 */

// ---------------------------------------------------------------------------
// Part A · bagging (1-D regression)
// ---------------------------------------------------------------------------

const rand = mulberry32(33);
const g = gaussian(rand);
const N = 60;
export const DATA: { x: number; y: number }[] = Array.from({ length: N }, () => {
  const x = rand() * 2 - 1;
  return { x, y: Math.sin((2.4 * x * Math.PI) / 2) + g() * 0.3 };
});
export const TRUTH = (x: number): number => Math.sin((2.4 * x * Math.PI) / 2);

type TreeFn = (x: number) => number;
function fitTree(s: { x: number; y: number }[], depth: number): TreeFn {
  const mean = s.reduce((a, p) => a + p.y, 0) / s.length;
  if (depth === 0 || s.length < 6) return () => mean;
  let best: { t: number; sse: number; L: typeof s; R: typeof s } | null = null;
  const xs = [...new Set(s.map((p) => p.x))].sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) {
    const t = (xs[i - 1] + xs[i]) / 2;
    const L = s.filter((p) => p.x <= t);
    const R = s.filter((p) => p.x > t);
    if (L.length < 3 || R.length < 3) continue;
    const mL = L.reduce((a, p) => a + p.y, 0) / L.length;
    const mR = R.reduce((a, p) => a + p.y, 0) / R.length;
    const sse = L.reduce((a, p) => a + (p.y - mL) ** 2, 0) + R.reduce((a, p) => a + (p.y - mR) ** 2, 0);
    if (!best || sse < best.sse) best = { t, sse, L, R };
  }
  if (!best) return () => mean;
  const fL = fitTree(best.L, depth - 1);
  const fR = fitTree(best.R, depth - 1);
  const tSplit = best.t;
  return (x) => (x <= tSplit ? fL(x) : fR(x));
}

export const B = 30;
const br = mulberry32(44);
const TREES: TreeFn[] = Array.from({ length: 300 }, () => {
  const boot = Array.from({ length: N }, () => DATA[Math.floor(br() * N)]);
  return fitTree(boot, 4);
});

// tree curves sampled on a fixed grid (first 30 shown; average over those 30)
export const GRID_N = 160;
export const XS: number[] = Array.from({ length: GRID_N }, (_, i) => -1 + (2 * i) / (GRID_N - 1));
export const TREE_CURVES: number[][] = TREES.slice(0, B).map((f) => XS.map((x) => f(x)));
export const AVG_CURVE: number[] = XS.map((_, i) => TREE_CURVES.reduce((a, c) => a + c[i], 0) / B);

// measured variance numbers (verified): std 0.058 single vs 0.011 bagged
export const X0 = 0.3;
export const STD_SINGLE = (() => {
  const preds = TREES.map((f) => f(X0));
  const m = preds.reduce((a, b) => a + b) / preds.length;
  return Math.sqrt(preds.reduce((a, p) => a + (p - m) ** 2, 0) / preds.length);
})();
export const STD_BAGGED = (() => {
  const bagged: number[] = [];
  for (let gi = 0; gi < 10; gi++) {
    const grp = TREES.slice(gi * 30, gi * 30 + 30);
    bagged.push(grp.reduce((a, f) => a + f(X0), 0) / 30);
  }
  const m = bagged.reduce((a, b) => a + b) / 10;
  return Math.sqrt(bagged.reduce((a, p) => a + (p - m) ** 2, 0) / 10);
})();

// ---------------------------------------------------------------------------
// Part B · AdaBoost (2-D classification with stumps)
// ---------------------------------------------------------------------------

const r2 = mulberry32(55);
const g2 = gaussian(r2);
export interface BPt {
  x: number;
  y: number;
  c: -1 | 1;
}
export const BOOST_PTS: BPt[] = (() => {
  const P: BPt[] = [];
  for (let i = 0; i < 30; i++) P.push({ x: -0.75 + g2() * 0.5, y: -0.45 + g2() * 0.5, c: -1 });
  for (let i = 0; i < 30; i++) P.push({ x: 0.75 + g2() * 0.5, y: 0.45 + g2() * 0.5, c: 1 });
  return P;
})();

export interface Stump {
  ax: 'x' | 'y';
  t: number;
  sgn: 1 | -1;
  err: number;
  alpha: number;
}
export const ROUNDS = 6;
/** per-round: stump chosen, weights AFTER the update, ensemble error count. */
export const BOOST: { stump: Stump; weights: number[]; ensErr: number }[] = (() => {
  const P = BOOST_PTS;
  let w = P.map(() => 1 / P.length);
  const stumps: Stump[] = [];
  const out: { stump: Stump; weights: number[]; ensErr: number }[] = [];
  for (let round = 0; round < ROUNDS; round++) {
    let best: Stump | null = null;
    for (const ax of ['x', 'y'] as const)
      for (const sgn of [1, -1] as const) {
        const vals = [...new Set(P.map((p) => p[ax]))].sort((a, b) => a - b);
        for (let i = 0; i <= vals.length; i++) {
          const t = i === 0 ? vals[0] - 0.01 : i === vals.length ? vals[i - 1] + 0.01 : (vals[i - 1] + vals[i]) / 2;
          let err = 0;
          for (let j = 0; j < P.length; j++) {
            const pred = (P[j][ax] > t ? 1 : -1) * sgn;
            if (pred !== P[j].c) err += w[j];
          }
          if (!best || err < best.err) best = { ax, t, sgn, err, alpha: 0 };
        }
      }
    const stump = best!;
    stump.alpha = 0.5 * Math.log((1 - stump.err) / Math.max(stump.err, 1e-9));
    stumps.push(stump);
    let Z = 0;
    for (let j = 0; j < P.length; j++) {
      const pred = (P[j][stump.ax] > stump.t ? 1 : -1) * stump.sgn;
      w[j] *= Math.exp(-stump.alpha * P[j].c * pred);
      Z += w[j];
    }
    w = w.map((v) => v / Z);
    let ensErr = 0;
    for (const p of P) {
      let F = 0;
      for (const st of stumps) F += st.alpha * ((p[st.ax] > st.t ? 1 : -1) * st.sgn);
      if (Math.sign(F) !== p.c) ensErr++;
    }
    out.push({ stump, weights: [...w], ensErr });
  }
  return out;
})();

/** point weight at fractional round f (0 = uniform start). */
export function weightAt(f: number, j: number): number {
  if (f <= 0) return 1 / BOOST_PTS.length;
  const i = Math.min(BOOST.length - 1, Math.floor(f - 1e-6));
  const prev = i === 0 ? 1 / BOOST_PTS.length : BOOST[i - 1].weights[j];
  const t = Math.min(1, f - i);
  return prev + (BOOST[i].weights[j] - prev) * t;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// Part A plot (centered wide)
export const APLOT = { x: 120, y: 90, w: 1040, h: 460 };
export const ax2 = (x: number): number => APLOT.x + ((x + 1) / 2) * APLOT.w;
export const ay2 = (y: number): number => APLOT.y + APLOT.h / 2 - (y / 1.6) * (APLOT.h / 2);

// Part B plot (left) + round panel (right)
export const BPLOT = { x: 110, y: 90, w: 560, h: 480 };
export const bx = (x: number): number => BPLOT.x + ((x + 2.2) / 4.4) * BPLOT.w;
export const by = (y: number): number => BPLOT.y + BPLOT.h / 2 - (y / 2.2) * (BPLOT.h / 2);
export const RPANEL = { x: 740, y: 110, w: 440 };

export const CAM_A: CameraState = CAMERA_HOME;
export const CAM_B: CameraState = { x: 390, y: 330, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  aU: ChannelRef<number>; // part A master opacity
  dataU: ChannelRef<number>;
  oneTreeU: ChannelRef<number>;
  manyU: ChannelRef<number>; // 0..B trees drawn
  avgU: ChannelRef<number>;
  statsU: ChannelRef<number>;
  bU: ChannelRef<number>; // part B master opacity
  bPtsU: ChannelRef<number>;
  roundF: ChannelRef<number>; // 0..ROUNDS fractional boosting round
  stumpsU: ChannelRef<number>; // how many stump lines shown
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const aU = tl.channel('aU', 1);
  const dataU = tl.channel('dataU', 0);
  const oneTreeU = tl.channel('oneTreeU', 0);
  const manyU = tl.channel('manyU', 0);
  const avgU = tl.channel('avgU', 0);
  const statsU = tl.channel('statsU', 0);
  const bU = tl.channel('bU', 0);
  const bPtsU = tl.channel('bPtsU', 0);
  const roundF = tl.channel('roundF', 0);
  const stumpsU = tl.channel('stumpsU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · one tree, nervous ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.0,
    text: 'Sixty noisy measurements of a smooth hidden curve. Fit one decision tree and it gives you this: a jittery staircase that chases every bump in the noise.',
  });
  tl.tween(dataU, 1, { at: 0.6, dur: 1.6, ease: ease.draw });
  tl.tween(oneTreeU, 1, { at: 2.6, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 5.9,
    dur: 4.8,
    text: 'The tree is not wrong on average, it is unstable. Resample the data and the staircase jumps somewhere else. High variance is the disease.',
  });
  tl.hold(10.9, 0.5);

  // — Beat 2 · thirty bootstraps ————————————————————————————————————————————
  tl.caption({
    at: 11.4,
    dur: 5.6,
    text: 'Here is the bagging cure. Draw thirty fake datasets by resampling your one real dataset with replacement, and fit a full tree to each. Thirty opinions, all plausible, all different.',
  });
  tl.tween(manyU, B, { at: 12.0, dur: 4.4, ease: ease.linear });
  tl.tween(oneTreeU, 0.25, { at: 12.0, dur: 1.0, ease: ease.move });
  tl.caption({
    at: 17.2,
    dur: 4.6,
    text: 'Each individual tree is as twitchy as ever. But their errors point in different directions, so when you average them, the twitches cancel.',
  });
  tl.tween(avgU, 1, { at: 18.4, dur: 1.5, ease: ease.draw });
  tl.hold(21.9, 0.5);

  // — Beat 3 · the variance number ——————————————————————————————————————————
  tl.caption({
    at: 22.4,
    dur: 6.2,
    text: 'This is not a metaphor, it is arithmetic we can check. At one fixed input, a single tree wobbles with a spread of nearly six hundredths. The thirty tree average wobbles by one hundredth: variance cut by a factor of thirty.',
  });
  tl.tween(statsU, 1, { at: 23.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 28.9,
    dur: 4.4,
    text: 'Averaging independent errors divides variance by the number of voters. That single line of statistics is the entire business model of the random forest.',
  });
  tl.hold(33.5, 0.6);

  // — Beat 4 · boosting: a different bet ————————————————————————————————————
  tl.tween(aU, 0, { at: 34.1, dur: 1.1, ease: ease.move });
  tl.tween(statsU, 0, { at: 34.1, dur: 0.8, ease: ease.move });
  tl.tween(bU, 1, { at: 35.0, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_B, { at: 35.0, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 35.2,
    dur: 5.4,
    text: 'Bagging trains its voters in parallel and lets them be strong. Boosting does the opposite: train weak learners one at a time, and make each one obsess over the mistakes of the last.',
  });
  tl.tween(bPtsU, 1, { at: 35.8, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 40.8,
    dur: 5.2,
    text: 'Sixty points, and the weakest learner imaginable: a stump, one axis cut. Every point starts with equal weight. Round one draws the best single cut it can, and misclassifies four points.',
  });
  tl.tween(stumpsU, 1, { at: 43.2, dur: 0.8, ease: ease.draw });
  tl.tween(roundF, 1, { at: 44.0, dur: 1.2, ease: ease.move });
  tl.hold(46.2, 0.5);

  // — Beat 5 · reweighting ——————————————————————————————————————————————————
  tl.caption({
    at: 46.7,
    dur: 5.6,
    text: 'Now the reweighting. Every point the stump got wrong grows heavier, everything it got right shrinks. Watch the mistakes swell: the next learner has no choice but to care about them.',
  });
  tl.caption({
    at: 52.5,
    dur: 5.8,
    text: 'Round two cuts where the heavy points now live. Reweight again, cut again. Each stump earns a voting weight from its accuracy, and the ensemble is their weighted vote.',
  });
  tl.tween(stumpsU, 3, { at: 53.0, dur: 2.4, ease: ease.move });
  tl.tween(roundF, 3, { at: 53.0, dur: 3.6, ease: ease.move });
  tl.hold(58.5, 0.5);

  // — Beat 6 · error to zero ————————————————————————————————————————————————
  tl.caption({
    at: 59.0,
    dur: 5.6,
    text: 'Six rounds of this, all computed for real. The training error falls from four mistakes to one to zero by round five. No single stump can separate these clouds; the weighted committee of six does.',
  });
  tl.tween(stumpsU, 6, { at: 59.6, dur: 2.8, ease: ease.move });
  tl.tween(roundF, 6, { at: 59.6, dur: 3.8, ease: ease.move });
  tl.hold(64.8, 0.6);

  // — Beat 7 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 65.4, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 66.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 66.6,
    dur: 6.0,
    text: 'Two ways to turn weakness into strength: bagging averages independent errors away, boosting stacks specialists on each other’s failures. Nearly every winning tabular model is one of these two ideas wearing a costume.',
  });
  tl.hold(72.8, 1.2);

  return { tl, cam, aU, dataU, oneTreeU, manyU, avgU, statsU, bU, bPtsU, roundF, stumpsU, dimU, endU };
}
