import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Loss Landscape — where training lives.
 *
 * A REAL two-parameter model: fit y = a·sin(b·x) to seeded noisy data drawn
 * from the true curve a = 1, b = 2. The mean-squared-error surface over (a, b)
 * is genuinely non-convex: the frequency knob b sits inside a sine, so the
 * surface ripples — one deep pair of mirror minima, shallow aliased dents,
 * and saddles along the a = 0 ridge. Everything below is computed here at
 * module scope (data, loss grid extrema, saddle classification, gradient
 * descent paths); nothing is eyeballed or faked.
 *
 * Empirical values with seed 7, N = 40, noise σ = 0.25 (verified by the grid
 * searches below, logged during authoring):
 *   global minimum  ≈ (a =  1.056, b =  2.000), L ≈ 0.073
 *   mirror minimum  ≈ (a = −1.056, b = −2.000), L ≈ 0.073  (same curve!)
 *   aliased dent    ≈ (a = −0.088, b =  3.440), L ≈ 0.607
 *   saddle          ≈ (a =  0.000, b =  1.000)             (Hessian det < −0.5)
 *   GD from (−1.8, 3.2) → the aliased dent;  GD from (1.6, 3.4) → the global min.
 */

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------
// The data: y_i = 1·sin(2·x_i) + ε, seeded — the "true" model is (a, b) = (1, 2)
// ---------------------------------------------------------------------------

export const N_DATA = 40;
export const TRUE_A = 1;
export const TRUE_B = 2;
const NOISE = 0.25;

const gauss = gaussian(mulberry32(7));
export const XS: number[] = Array.from(
  { length: N_DATA },
  (_, i) => -Math.PI + (2 * Math.PI * i) / (N_DATA - 1),
);
export const YS: number[] = XS.map((x) => TRUE_A * Math.sin(TRUE_B * x) + NOISE * gauss());

/** Mean squared error of the candidate curve y = a·sin(b·x) on the data. */
export const LOSS = (a: number, b: number): number => {
  let s = 0;
  for (let i = 0; i < N_DATA; i++) {
    const e = YS[i] - a * Math.sin(b * XS[i]);
    s += e * e;
  }
  return s / N_DATA;
};

const FD_H = 1e-4;
export const gradFD = (a: number, b: number): Pt => [
  (LOSS(a + FD_H, b) - LOSS(a - FD_H, b)) / (2 * FD_H),
  (LOSS(a, b + FD_H) - LOSS(a, b - FD_H)) / (2 * FD_H),
];

// ---------------------------------------------------------------------------
// Landmarks, found NUMERICALLY on a grid (never by eyeball)
// ---------------------------------------------------------------------------

const SEARCH_A: readonly [number, number] = [-2.2, 2.2];
const SEARCH_B: readonly [number, number] = [-4, 4];
const G = 201;
const aAt = (j: number): number => SEARCH_A[0] + ((SEARCH_A[1] - SEARCH_A[0]) * j) / (G - 1);
const bAt = (i: number): number => SEARCH_B[0] + ((SEARCH_B[1] - SEARCH_B[0]) * i) / (G - 1);

interface Extremum {
  a: number;
  b: number;
  L: number;
}

/** Strict local minima of the loss on the search grid, sorted by depth. */
const MINIMA: Extremum[] = (() => {
  const grid: number[][] = [];
  for (let j = 0; j < G; j++) {
    const row: number[] = [];
    for (let i = 0; i < G; i++) row.push(LOSS(aAt(j), bAt(i)));
    grid.push(row);
  }
  const out: Extremum[] = [];
  for (let j = 1; j < G - 1; j++) {
    for (let i = 1; i < G - 1; i++) {
      const v = grid[j][i];
      let isMin = true;
      for (let dj = -1; dj <= 1 && isMin; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (di === 0 && dj === 0) continue;
          if (grid[j + dj][i + di] <= v) {
            isMin = false;
            break;
          }
        }
      }
      if (isMin) out.push({ a: aAt(j), b: bAt(i), L: v });
    }
  }
  out.sort((p, q) => p.L - q.L);
  return out;
})();

/** The deepest minimum with b > 0 — lands next to the true (1, 2). */
export const GLOBAL_MIN: Pt = (() => {
  const m = MINIMA.find((p) => p.b > 0)!;
  return [m.a, m.b];
})();
/** Its mirror twin: (−a, −b) traces the identical curve. */
export const MIRROR_MIN: Pt = (() => {
  const m = MINIMA.find((p) => p.b < 0)!;
  return [m.a, m.b];
})();
/** The shallow aliased dent: deepest minimum well past the true frequency. */
export const LOCAL_MIN: Pt = (() => {
  const m = MINIMA.find((p) => p.b > 2.5)!;
  return [m.a, m.b];
})();

/**
 * The saddle: scan for near-stationary points, classify with a finite-
 * difference Hessian (det < 0 ⇒ saddle), keep the one nearest (0, 1).
 */
export const SADDLE: Pt = (() => {
  let best: Pt = [0, 1];
  let bestD = Infinity;
  const h = 0.02;
  for (let j = 2; j < G - 2; j++) {
    for (let i = 2; i < G - 2; i++) {
      const a = aAt(j);
      const b = bAt(i);
      const [ga, gb] = gradFD(a, b);
      if (Math.hypot(ga, gb) >= 0.02) continue;
      const L0 = LOSS(a, b);
      const Laa = (LOSS(a + h, b) - 2 * L0 + LOSS(a - h, b)) / (h * h);
      const Lbb = (LOSS(a, b + h) - 2 * L0 + LOSS(a, b - h)) / (h * h);
      const Lab =
        (LOSS(a + h, b + h) - LOSS(a + h, b - h) - LOSS(a - h, b + h) + LOSS(a - h, b - h)) /
        (4 * h * h);
      if (Laa * Lbb - Lab * Lab >= -0.5) continue; // not saddle-shaped enough
      const d = Math.hypot(a, b - 1);
      if (d < bestD) {
        bestD = d;
        best = [a, b];
      }
    }
  }
  return best;
})();

// ---------------------------------------------------------------------------
// Two real gradient-descent walks (explicit Euler, precomputed)
// ---------------------------------------------------------------------------

export const N_STEPS = 350;
const GD_LR = 0.05;

export const START_BAD: Pt = [-1.8, 3.2]; // rolls into the aliased dent
export const START_GOOD: Pt = [1.6, 3.4]; // rolls into the global minimum

function runGD(start: Pt): Pt[] {
  let [a, b] = start;
  const pts: Pt[] = [[a, b]];
  for (let i = 0; i < N_STEPS; i++) {
    const [ga, gb] = gradFD(a, b);
    a -= GD_LR * ga;
    b -= GD_LR * gb;
    pts.push([a, b]);
  }
  return pts;
}

// Empirically: RUN_BAD ends ≈ (−0.079, 3.418), L ≈ 0.607 (the dent);
//              RUN_GOOD ends ≈ (1.047, 1.988), L ≈ 0.072 (the global min).
export const RUN_BAD: Pt[] = runGD(START_BAD);
export const RUN_GOOD: Pt[] = runGD(START_GOOD);

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Position at progress u ∈ [0, 1] — fractional-index lerp along a path. */
export function pathAt(pts: readonly Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.floor(f);
  if (i >= pts.length - 1) return pts[pts.length - 1];
  const t = f - i;
  const p = pts[i];
  const q = pts[i + 1];
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}

// ---------------------------------------------------------------------------
// Stage mapping
//   left panel (screen-fixed): the data + the candidate curve
//   main plane (in Camera):    the (b, a) parameter plane — b →, a ↑
// The plane is drawn wider than the stage so camera pushes never hit a hard
// field edge.
// ---------------------------------------------------------------------------

export const B_DOM: readonly [number, number] = [-5.2, 5.2];
export const A_DOM: readonly [number, number] = [-2.6, 2.6];

export const bScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...B_DOM])
  .range([372, 1348]);
export const aScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...A_DOM])
  .range([650, 50]);

export const PANEL = { x: 36, y: 96, w: 406, h: 506 } as const;
export const dataX: ScaleLinear<number, number> = scaleLinear()
  .domain([-Math.PI, Math.PI])
  .range([70, 412]);
export const dataY: ScaleLinear<number, number> = scaleLinear()
  .domain([-2.4, 2.4])
  .range([576, 128]);

// camera marks (targets derived from the numerically-found landmarks)
export const CAM_REVEAL: CameraState = { x: 880, y: 350, k: 1.15 };
export const CAM_RIPPLE: CameraState = { x: 900, y: 350, k: 1.25 };
export const CAM_SADDLE: CameraState = { x: bScale(SADDLE[1]) - 50, y: aScale(SADDLE[0]), k: 1.6 };
export const CAM_LOCAL: CameraState = {
  x: bScale(LOCAL_MIN[1]) - 210,
  y: aScale(LOCAL_MIN[0]),
  k: 1.55,
};
export const CAM_MIRROR: CameraState = { x: 860, y: 350, k: 1.08 };
export const CAM_RUNS: CameraState = { x: 870, y: 350, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  panelOp: ChannelRef<number>;
  dataU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  whiskerU: ChannelRef<number>;
  planeAxU: ChannelRef<number>;
  probeU: ChannelRef<number>;
  probeA: ChannelRef<number>;
  probeB: ChannelRef<number>;
  lossTexU: ChannelRef<number>;
  contourReveal: ChannelRef<number>;
  contourOp: ChannelRef<number>;
  saddleU: ChannelRef<number>;
  localU: ChannelRef<number>;
  minsU: ChannelRef<number>;
  runOp: ChannelRef<number>;
  run1U: ChannelRef<number>;
  run1Prog: ChannelRef<number>;
  run2U: ChannelRef<number>;
  run2Prog: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const panelOp = tl.channel('panelOp', 0);
  const dataU = tl.channel('dataU', 0);
  const curveU = tl.channel('curveU', 0);
  const whiskerU = tl.channel('whiskerU', 0);
  const planeAxU = tl.channel('planeAxU', 0);
  const probeU = tl.channel('probeU', 0);
  const probeA = tl.channel('probeA', 1.7);
  const probeB = tl.channel('probeB', 0.7);
  const lossTexU = tl.channel('lossTexU', 0);
  const contourReveal = tl.channel('contourReveal', 0);
  const contourOp = tl.channel('contourOp', 1);
  const saddleU = tl.channel('saddleU', 0);
  const localU = tl.channel('localU', 0);
  const minsU = tl.channel('minsU', 0);
  const runOp = tl.channel('runOp', 1);
  const run1U = tl.channel('run1U', 0);
  const run1Prog = tl.channel('run1Prog', 0);
  const run2U = tl.channel('run2U', 0);
  const run2Prog = tl.channel('run2Prog', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a model with two knobs ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: "Here's a tiny model with just two knobs: one sets the height of a wave, the other sets how fast it wiggles. We want it to fit these noisy points.",
    tex: 'y = a\\,\\sin(b\\,x)',
  });
  tl.tween(panelOp, 1, { at: 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(dataU, 1, { at: 0.5, dur: 1.3, ease: ease.enter });
  tl.tween(curveU, 1, { at: 2.2, dur: 1.3, ease: ease.draw });
  tl.tween(planeAxU, 1, { at: 4.0, dur: 1.1, ease: ease.draw });
  tl.tween(probeU, 1, { at: 4.8, dur: 0.6, ease: ease.enter });

  // — Beat 2 · one point = one curve ——————————————————————————————————————
  tl.caption({
    at: 6.6,
    dur: 5.4,
    text: 'Every possible fit lives at one point in this plane. Slide the point, and the curve follows — one point, one curve.',
  });
  tl.tween(probeA, 0.55, { at: 7.0, dur: 1.5, ease: ease.move });
  tl.tween(probeB, 3.1, { at: 7.0, dur: 1.5, ease: ease.move });
  tl.tween(probeA, -1.4, { at: 9.3, dur: 1.5, ease: ease.move });
  tl.tween(probeB, 1.5, { at: 9.3, dur: 1.5, ease: ease.move });
  tl.hold(12.0, 0.6);

  // — Beat 3 · the loss ————————————————————————————————————————————————————
  tl.caption({
    at: 12.8,
    dur: 5.6,
    text: 'Watch the whiskers: they measure how far the curve misses each data point. Squaring and averaging them gives a single number — the loss.',
  });
  tl.tween(whiskerU, 1, { at: 13.0, dur: 1.0, ease: ease.enter });
  tl.tween(lossTexU, 1, { at: 15.6, dur: 0.8, ease: ease.enter });
  tl.hold(18.4, 0.6);

  // — Beat 4 · the landscape ———————————————————————————————————————————————
  tl.caption({
    at: 19.2,
    dur: 5.6,
    text: 'Now color the whole plane by that number. This is the loss landscape: the terrain every training run has to cross.',
    tex: 'L(a,b) = \\tfrac{1}{N}\\textstyle\\sum_i \\big(y_i - a\\sin(b\\,x_i)\\big)^2',
  });
  tl.tween(whiskerU, 0, { at: 19.0, dur: 0.8, ease: ease.move });
  tl.tween(probeU, 0, { at: 19.2, dur: 0.8, ease: ease.move });
  tl.tween(panelOp, 0.12, { at: 19.2, dur: 1.2, ease: ease.move });
  tl.tween(contourReveal, 1, { at: 19.4, dur: 3.6, ease: ease.draw });
  tl.tween(cam, CAM_REVEAL, { at: 19.6, dur: 2.0, ease: ease.move });

  // — Beat 5 · it ripples ——————————————————————————————————————————————————
  tl.caption({
    at: 25.6,
    dur: 5.4,
    text: "It isn't a smooth bowl. Because the wiggle knob lives inside a sine wave, the surface ripples — and the terrain gets interesting.",
  });
  tl.tween(cam, CAM_RIPPLE, { at: 25.8, dur: 2.0, ease: ease.move });
  tl.hold(31.0, 0.4);

  // — Beat 6 · a saddle ————————————————————————————————————————————————————
  tl.caption({
    at: 31.6,
    dur: 5.8,
    text: "Here the ground is flat, yet it's no valley: downhill in one direction, uphill in the other. That's a saddle point, where gradients slow to a crawl.",
  });
  tl.tween(cam, CAM_SADDLE, { at: 31.4, dur: 1.6, ease: ease.move });
  tl.tween(saddleU, 1, { at: 33.2, dur: 0.7, ease: ease.enter });

  // — Beat 7 · a shallow local minimum —————————————————————————————————————
  tl.caption({
    at: 38.2,
    dur: 5.8,
    text: 'And over here, a shallow dent: a wave with the wrong speed that happens to fit the noise a little. A local minimum — a real valley, just not the best one.',
  });
  tl.tween(cam, CAM_LOCAL, { at: 38.0, dur: 1.6, ease: ease.move });
  tl.tween(localU, 1, { at: 39.8, dur: 0.7, ease: ease.enter });

  // — Beat 8 · the mirror twins ————————————————————————————————————————————
  tl.caption({
    at: 44.6,
    dur: 5.6,
    text: 'Notice the symmetry: flip both knobs and you trace the same curve, so the one true fit shows up twice. Two deepest valleys, one identical model.',
  });
  tl.tween(cam, CAM_MIRROR, { at: 44.4, dur: 1.6, ease: ease.move });
  tl.tween(minsU, 1, { at: 45.8, dur: 0.8, ease: ease.enter });
  tl.hold(50.2, 0.4);

  // — Beat 9 · gradient descent, bad start —————————————————————————————————
  tl.caption({
    at: 51.0,
    dur: 5.6,
    text: 'Now drop a ball on the surface and let gradient descent roll it downhill. From this starting point, it slides straight into the shallow dent — and stays.',
  });
  tl.tween(cam, CAM_RUNS, { at: 50.6, dur: 1.2, ease: ease.move });
  tl.tween(panelOp, 1, { at: 50.8, dur: 1.0, ease: ease.move });
  tl.tween(run1U, 1, { at: 52.0, dur: 0.5, ease: ease.pop });
  tl.tween(run1Prog, 1, { at: 52.6, dur: 4.6, ease: ease.linear });

  // — Beat 10 · the fit it found ———————————————————————————————————————————
  tl.caption({
    at: 57.6,
    dur: 5.4,
    text: 'Look left: the fit it found is barely better than a flat line. Nothing went wrong — the walk just started in the wrong basin.',
  });
  tl.hold(63.0, 0.4);

  // — Beat 11 · gradient descent, better start —————————————————————————————
  tl.caption({
    at: 63.6,
    dur: 5.4,
    text: 'Start somewhere else, and the very same rule rolls into the deepest valley. The curve on the left snaps onto the data.',
  });
  tl.tween(run2U, 1, { at: 64.4, dur: 0.5, ease: ease.pop });
  tl.tween(run2Prog, 1, { at: 65.0, dur: 4.4, ease: ease.linear });

  // — Beat 12 · the terrain decides ————————————————————————————————————————
  tl.caption({
    at: 69.8,
    dur: 4.8,
    text: 'Same landscape, same rule, different start — the terrain decided the outcome.',
  });
  tl.hold(74.6, 0.4);

  // — Beat 13 · recap ——————————————————————————————————————————————————————
  tl.caption({
    at: 76.0,
    dur: 7.0,
    text: 'Every training run, no matter how large the model, is a walk on a surface like this one. Learn to read the valleys, the saddles, and the basins, and you can read training itself.',
  });
  tl.tween(cam, { x: 640, y: 360, k: 1 }, { at: 75.0, dur: 1.8, ease: ease.move });
  tl.tween(contourOp, 0.15, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(panelOp, 0.12, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(lossTexU, 0, { at: 75.0, dur: 0.8, ease: ease.move });
  tl.tween(saddleU, 0.12, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(localU, 0.12, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(minsU, 0.3, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(runOp, 0.15, { at: 75.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 76.6, dur: 0.9, ease: ease.enter });
  tl.hold(83.0, 1.4);

  return {
    tl,
    cam,
    panelOp,
    dataU,
    curveU,
    whiskerU,
    planeAxU,
    probeU,
    probeA,
    probeB,
    lossTexU,
    contourReveal,
    contourOp,
    saddleU,
    localU,
    minsU,
    runOp,
    run1U,
    run1Prog,
    run2U,
    run2Prog,
    closeU,
  };
}
