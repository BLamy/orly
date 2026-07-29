import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Ill-Conditioning — why stretched valleys break gradient descent.
 *
 * Everything is closed form on a real quadratic loss
 *
 *   L(x, y) = ½ (a x² + b y²),   a = 1, b = 25   ⇒   κ = λmax/λmin = 25.
 *
 * On a quadratic, gradient descent decouples per axis and each coordinate
 * scales by (1 − ηλ) per step, so the iterates, the stability threshold
 * η < 2/λmax, the optimal η = 2/(λmin + λmax), and every iteration count
 * quoted in the captions are computed exactly at module scope — nothing is
 * faked, no randomness, no wall clock.
 */

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------
// The quadratic bowl and its spectrum
// ---------------------------------------------------------------------------

export const LAM_MIN = 1; // curvature along x (the shallow axis)
export const LAM_MAX = 25; // curvature along y (the steep axis)
export const KAPPA = LAM_MAX / LAM_MIN; // condition number = 25

export const LOSS = (x: number, y: number): number =>
  0.5 * (LAM_MIN * x * x + LAM_MAX * y * y);

/** Exact gradient: ∇L = (a x, b y). */
export const grad = (x: number, y: number): Pt => [LAM_MIN * x, LAM_MAX * y];

/**
 * Bowl with the steep curvature rescaled — bEff sweeps 25 → 1 to visualize
 * preconditioning. Closures are cached per quantized bEff so ContourField's
 * memo (keyed on f identity) only recomputes at quantized steps.
 */
const bowlCache = new Map<number, (x: number, y: number) => number>();
export function bowlAt(bEff: number): (x: number, y: number) => number {
  const q = Math.round(bEff * 4) / 4;
  let f = bowlCache.get(q);
  if (!f) {
    f = (x: number, y: number) => 0.5 * (LAM_MIN * x * x + q * y * y);
    bowlCache.set(q, f);
  }
  return f;
}

// ---------------------------------------------------------------------------
// Stage mapping — 200 px per unit, 16:9 domain (matches gradient-descent)
// ---------------------------------------------------------------------------

export const DOMAIN_X: readonly [number, number] = [-3.2, 3.2];
export const DOMAIN_Y: readonly [number, number] = [-1.8, 1.8];

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_X])
  .range([0, STAGE_W]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_Y])
  .range([STAGE_H, 0]);

// ---------------------------------------------------------------------------
// Exact gradient-descent iterates. On this quadratic each coordinate obeys
//   x_{k+1} = (1 − η·λmin) x_k,   y_{k+1} = (1 − η·λmax) y_k,
// so the loop below IS the closed form, evaluated step by step.
// ---------------------------------------------------------------------------

export const START: Pt = [-2.6, 0.9];
export const TOL = 0.05; // "arrived" once both |coords| < TOL

export const ETA_SMALL = 0.01; // timid: y factor 0.75, x factor 0.99 — crawls
export const ETA_STAR = 2 / (LAM_MIN + LAM_MAX); // optimal ≈ 0.0769
export const ETA_DIV = 0.084; // just past 2/λmax = 0.08 ⇒ y factor −1.1 diverges
export const ETA_SAFE = 1 / LAM_MAX; // 0.04: perfect for the steep axis (y → 0 in one step)

function runGD(eta: number, n: number): Pt[] {
  let [x, y] = START;
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < n; i++) {
    x *= 1 - eta * LAM_MIN;
    y *= 1 - eta * LAM_MAX;
    pts.push([x, y]);
  }
  return pts;
}

export const SMALL: Pt[] = runGD(ETA_SMALL, 200); // ends at x ≈ −0.35: still far out
export const GOOD: Pt[] = runGD(ETA_STAR, 60); // both axes shrink by 0.923 per step
export const DIV: Pt[] = runGD(ETA_DIV, 12); // |y| grows 1.1× per step — honest divergence

/** Exact steps until |v0|·|1 − ηλ|^k < TOL (the counts quoted on screen). */
export function stepsToTol(eta: number, lam: number, v0: number): number {
  const f = Math.abs(1 - eta * lam);
  if (f >= 1) return Infinity;
  if (f === 0) return 1;
  return Math.ceil(Math.log(TOL / Math.abs(v0)) / Math.log(f));
}

// With η = 1/λmax (tuned for the steep axis): y lands in 1 step, x needs 97.
export const STEPS_SHALLOW_SAFE = stepsToTol(ETA_SAFE, LAM_MIN, START[0]); // 97
export const STEPS_STEEP_SAFE = stepsToTol(ETA_SAFE, LAM_MAX, START[1]); // 1
// With the optimal shared η: both need ~50 (x is the binding one).
export const STEPS_OPT = stepsToTol(ETA_STAR, LAM_MIN, START[0]); // 50

// ---------------------------------------------------------------------------
// Momentum (heavy ball) with the classical optimal hyperparameters
//   β = ((√κ−1)/(√κ+1))² = 4/9,   η = 4/(√λmin+√λmax)² = 1/9
// ⇒ rate (√κ−1)/(√κ+1) = 2/3: the κ → √κ gap shrink.
// ---------------------------------------------------------------------------

export const MOM_BETA = ((Math.sqrt(KAPPA) - 1) / (Math.sqrt(KAPPA) + 1)) ** 2; // 4/9
export const MOM_LR = 4 / (Math.sqrt(LAM_MIN) + Math.sqrt(LAM_MAX)) ** 2; // 1/9

function runMomentum(n: number): Pt[] {
  let [x, y] = START;
  let vx = 0;
  let vy = 0;
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < n; i++) {
    const [gx, gy] = grad(x, y);
    vx = MOM_BETA * vx - MOM_LR * gx;
    vy = MOM_BETA * vy - MOM_LR * gy;
    x += vx;
    y += vy;
    pts.push([x, y]);
  }
  return pts;
}

export const MOMENTUM: Pt[] = runMomentum(24); // inside TOL by step 16

/** Real momentum arrival step (16 with these constants — quoted in captions). */
export const STEPS_MOM: number = (() => {
  for (let k = 0; k < MOMENTUM.length; k++) {
    const [x, y] = MOMENTUM[k];
    if (Math.abs(x) < TOL && Math.abs(y) < TOL) return k;
  }
  return MOMENTUM.length - 1;
})();

// ---------------------------------------------------------------------------
// Adam — per-axis step sizes from the second-moment estimate. Because the
// gradient scale differs 25× between axes, √v̂ equalizes them: both axes get
// ≈ lr-sized steps and the path cuts diagonally, as if the bowl were round.
// ---------------------------------------------------------------------------

export const ADAM_LR = 0.3;
export const ADAM_B1 = 0.9;
export const ADAM_B2 = 0.999;
export const ADAM_EPS = 1e-8;

function runAdam(n: number): Pt[] {
  let [x, y] = START;
  let mx = 0;
  let my = 0;
  let vx = 0;
  let vy = 0;
  const pts: Pt[] = [[x, y]];
  for (let i = 1; i <= n; i++) {
    const [gx, gy] = grad(x, y);
    mx = ADAM_B1 * mx + (1 - ADAM_B1) * gx;
    my = ADAM_B1 * my + (1 - ADAM_B1) * gy;
    vx = ADAM_B2 * vx + (1 - ADAM_B2) * gx * gx;
    vy = ADAM_B2 * vy + (1 - ADAM_B2) * gy * gy;
    const mhx = mx / (1 - ADAM_B1 ** i);
    const mhy = my / (1 - ADAM_B1 ** i);
    const vhx = vx / (1 - ADAM_B2 ** i);
    const vhy = vy / (1 - ADAM_B2 ** i);
    x -= (ADAM_LR * mhx) / (Math.sqrt(vhx) + ADAM_EPS);
    y -= (ADAM_LR * mhy) / (Math.sqrt(vhy) + ADAM_EPS);
    pts.push([x, y]);
  }
  return pts;
}

export const ADAM: Pt[] = runAdam(60);

// ---------------------------------------------------------------------------
// Pure lookup for playback
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Position at progress u ∈ [0, 1] — fractional-index lerp along a path. */
export function pathAt(pts: readonly Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.floor(f);
  if (i >= pts.length - 1) return pts[pts.length - 1];
  const t = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export const CAM_PUSH: CameraState = { x: 640, y: 344, k: 1.14 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bowlU: ChannelRef<number>;
  bowlDim: ChannelRef<number>;
  lossTexU: ChannelRef<number>;
  eigU: ChannelRef<number>;
  kappaTexU: ChannelRef<number>;
  ruleTexU: ChannelRef<number>;
  startU: ChannelRef<number>;
  smallU: ChannelRef<number>;
  smallProg: ChannelRef<number>;
  divU: ChannelRef<number>;
  divProg: ChannelRef<number>;
  goodU: ChannelRef<number>;
  goodProg: ChannelRef<number>;
  panelU: ChannelRef<number>;
  winU: ChannelRef<number>;
  countU: ChannelRef<number>;
  momU: ChannelRef<number>;
  momProg: ChannelRef<number>;
  momTexU: ChannelRef<number>;
  sqrtTexU: ChannelRef<number>;
  adamU: ChannelRef<number>;
  adamProg: ChannelRef<number>;
  adamTexU: ChannelRef<number>;
  morphU: ChannelRef<number>;
  recapU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const bowlU = tl.channel('bowlU', 0);
  const bowlDim = tl.channel('bowlDim', 1);
  const lossTexU = tl.channel('lossTexU', 0);
  const eigU = tl.channel('eigU', 0);
  const kappaTexU = tl.channel('kappaTexU', 0);
  const ruleTexU = tl.channel('ruleTexU', 0);
  const startU = tl.channel('startU', 0);
  const smallU = tl.channel('smallU', 0);
  const smallProg = tl.channel('smallProg', 0);
  const divU = tl.channel('divU', 0);
  const divProg = tl.channel('divProg', 0);
  const goodU = tl.channel('goodU', 0);
  const goodProg = tl.channel('goodProg', 0);
  const panelU = tl.channel('panelU', 0);
  const winU = tl.channel('winU', 0);
  const countU = tl.channel('countU', 0);
  const momU = tl.channel('momU', 0);
  const momProg = tl.channel('momProg', 0);
  const momTexU = tl.channel('momTexU', 0);
  const sqrtTexU = tl.channel('sqrtTexU', 0);
  const adamU = tl.channel('adamU', 0);
  const adamProg = tl.channel('adamProg', 0);
  const adamTexU = tl.channel('adamTexU', 0);
  const morphU = tl.channel('morphU', 0);
  const recapU = tl.channel('recapU', 0);

  // — Beat 1 · the stretched bowl ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: "Here's a loss surface with a problem. Along one axis the valley is gentle. Along the other, it's twenty-five times steeper.",
    tex: 'L(x,y) = \\tfrac{1}{2}\\left(x^2 + 25\\,y^2\\right)',
  });
  tl.tween(bowlU, 1, { at: 0.4, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_PUSH, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(lossTexU, 1, { at: 3.4, dur: 0.7, ease: ease.enter });

  // — Beat 2 · the two curvatures are eigenvalues ————————————————————————
  tl.caption({
    at: 7.6,
    dur: 6.4,
    text: 'Those two curvatures are the eigenvalues of the bowl. Their ratio, twenty-five here, is called the condition number.',
    tex: '\\kappa = \\lambda_{\\max}/\\lambda_{\\min} = 25',
  });
  tl.tween(eigU, 1, { at: 7.8, dur: 0.8, ease: ease.enter });
  tl.tween(kappaTexU, 1, { at: 10.4, dur: 0.7, ease: ease.enter });
  tl.hold(14.0, 0.8);

  // — Beat 3 · one knob: the learning rate ———————————————————————————————
  tl.caption({
    at: 14.8,
    dur: 5.0,
    text: 'Gradient descent has one knob: the learning rate. Watch what the shape of this bowl does to it.',
    tex: '\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta)',
  });
  tl.tween(ruleTexU, 1, { at: 15.0, dur: 0.7, ease: ease.enter });
  tl.tween(startU, 1, { at: 15.6, dur: 0.6, ease: ease.enter });
  tl.tween(eigU, 0.15, { at: 15.6, dur: 0.9, ease: ease.move });

  // — Beat 4 · η too small: the crawl —————————————————————————————————————
  tl.caption({
    at: 20.4,
    dur: 7.8,
    text: "Play it safe with a tiny step, and the steep axis settles fast — but the shallow axis barely moves. Two hundred steps later, we're still crawling toward the minimum.",
  });
  tl.tween(smallU, 1, { at: 20.6, dur: 0.5, ease: ease.pop });
  tl.tween(smallProg, 1, { at: 21.0, dur: 6.4, ease: ease.linear });
  tl.hold(28.2, 0.6);

  // — Beat 5 · η too big: honest divergence ———————————————————————————————
  tl.caption({
    at: 28.8,
    dur: 7.4,
    text: 'Turn the knob past a critical threshold, set by the steepest curvature, and every step overshoots by more than the last. The path zigzags out of the valley and diverges.',
    tex: '\\eta > 2/\\lambda_{\\max}',
  });
  tl.tween(divU, 1, { at: 29.0, dur: 0.5, ease: ease.pop });
  tl.tween(divProg, 1, { at: 29.5, dur: 4.6, ease: ease.linear });
  tl.hold(36.2, 0.6);

  // — Beat 6 · the best shared η ———————————————————————————————————————————
  tl.caption({
    at: 36.8,
    dur: 6.4,
    text: 'The best you can do sits just under that threshold. Even tuned perfectly, both axes need about fifty steps to arrive.',
    tex: '\\eta^\\ast = 2/(\\lambda_{\\min}+\\lambda_{\\max})',
  });
  tl.tween(goodU, 1, { at: 37.0, dur: 0.5, ease: ease.pop });
  tl.tween(goodProg, 1, { at: 37.5, dur: 5.0, ease: ease.linear });
  tl.hold(43.2, 0.6);

  // — Beat 7 · split the bowl into its axes ————————————————————————————————
  tl.caption({
    at: 43.8,
    dur: 6.2,
    text: 'Why is this so hard? Split the bowl into its two axes. Each one is a simple parabola with its own safe range of learning rates.',
  });
  tl.tween(bowlDim, 0.1, { at: 44.0, dur: 1.0, ease: ease.move });
  tl.tween(lossTexU, 0, { at: 44.0, dur: 0.7, ease: ease.move });
  tl.tween(ruleTexU, 0, { at: 44.0, dur: 0.7, ease: ease.move });
  tl.tween(kappaTexU, 0, { at: 44.0, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 44.0, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 1, { at: 44.8, dur: 0.9, ease: ease.enter });

  // — Beat 8 · the shared η must fit the steepest axis —————————————————————
  tl.caption({
    at: 50.6,
    dur: 7.0,
    text: 'The steep axis only tolerates tiny steps, so its safe window is narrow. One shared learning rate has to fit inside it — and the shallow axis is starved.',
  });
  tl.tween(winU, 1, { at: 50.9, dur: 1.0, ease: ease.draw });

  // — Beat 9 · the condition number IS the slowdown ————————————————————————
  tl.caption({
    at: 58.4,
    dur: 8.2,
    text: 'Tuned for the steep axis, the steep coordinate lands in one step — and the shallow one takes ninety-seven. On a round bowl, one step would do. The condition number is the slowdown factor.',
  });
  tl.tween(countU, 1, { at: 58.8, dur: 0.8, ease: ease.enter });
  tl.hold(66.6, 0.4);

  // — Beat 10 · momentum on the same bowl ——————————————————————————————————
  tl.caption({
    at: 67.2,
    dur: 7.2,
    text: 'Momentum changes the math. Velocity accumulates along the shallow axis while the zigzag cancels itself out — the same bowl now takes about sixteen steps.',
    tex: 'v \\leftarrow \\beta v - \\eta\\nabla L',
  });
  tl.tween(panelU, 0, { at: 66.9, dur: 0.8, ease: ease.move });
  tl.tween(bowlDim, 1, { at: 67.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_PUSH, { at: 67.2, dur: 1.3, ease: ease.move });
  tl.tween(smallU, 0.12, { at: 67.0, dur: 0.9, ease: ease.move });
  tl.tween(divU, 0.12, { at: 67.0, dur: 0.9, ease: ease.move });
  tl.tween(goodU, 0.12, { at: 67.0, dur: 0.9, ease: ease.move });
  tl.tween(momTexU, 1, { at: 67.6, dur: 0.7, ease: ease.enter });
  tl.tween(momU, 1, { at: 67.9, dur: 0.5, ease: ease.pop });
  tl.tween(momProg, 1, { at: 68.4, dur: 4.6, ease: ease.linear });

  // — Beat 11 · the classical result ———————————————————————————————————————
  tl.caption({
    at: 74.8,
    dur: 5.6,
    text: 'The classical result says exactly this: momentum shrinks the effective gap from the condition number down to its square root.',
    tex: '\\kappa \\;\\to\\; \\sqrt{\\kappa}',
  });
  tl.tween(sqrtTexU, 1, { at: 75.2, dur: 0.7, ease: ease.enter });
  tl.hold(80.4, 0.4);

  // — Beat 12 · Adam preconditions: the bowl becomes round —————————————————
  tl.caption({
    at: 80.8,
    dur: 8.2,
    text: 'Adam goes further and gives each axis its own step size. Rescale the axes that way, and the stretched bowl literally becomes round — an easy problem again.',
    tex: '\\theta \\leftarrow \\theta - \\eta\\,\\hat m / (\\sqrt{\\hat v} + \\varepsilon)',
  });
  tl.tween(momU, 0.12, { at: 80.8, dur: 0.8, ease: ease.move });
  tl.tween(momTexU, 0, { at: 80.8, dur: 0.7, ease: ease.move });
  tl.tween(sqrtTexU, 0, { at: 80.8, dur: 0.7, ease: ease.move });
  tl.tween(adamTexU, 1, { at: 81.0, dur: 0.7, ease: ease.enter });
  tl.tween(adamU, 1, { at: 81.3, dur: 0.5, ease: ease.pop });
  tl.tween(adamProg, 1, { at: 81.7, dur: 3.6, ease: ease.linear });
  tl.tween(adamU, 0.15, { at: 85.6, dur: 0.9, ease: ease.move });
  tl.tween(morphU, 1, { at: 85.8, dur: 2.8, ease: ease.move });

  // — Beat 13 · recap ———————————————————————————————————————————————————————
  tl.caption({
    at: 89.8,
    dur: 7.2,
    text: "That's the secret behind every optimizer trick: none of it is magic. They're all strategies for coping with ill-conditioned, stretched-out valleys.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 89.6, dur: 1.4, ease: ease.move });
  tl.tween(bowlDim, 0.15, { at: 89.4, dur: 1.0, ease: ease.move });
  tl.tween(smallU, 0, { at: 89.4, dur: 0.8, ease: ease.move });
  tl.tween(divU, 0, { at: 89.4, dur: 0.8, ease: ease.move });
  tl.tween(goodU, 0, { at: 89.4, dur: 0.8, ease: ease.move });
  tl.tween(momU, 0, { at: 89.4, dur: 0.8, ease: ease.move });
  tl.tween(adamU, 0, { at: 89.4, dur: 0.8, ease: ease.move });
  tl.tween(adamTexU, 0, { at: 89.4, dur: 0.7, ease: ease.move });
  tl.tween(startU, 0, { at: 89.4, dur: 0.7, ease: ease.move });
  tl.tween(recapU, 1, { at: 90.4, dur: 0.9, ease: ease.enter });
  tl.hold(97.0, 1.2);

  return {
    tl,
    cam,
    bowlU,
    bowlDim,
    lossTexU,
    eigU,
    kappaTexU,
    ruleTexU,
    startU,
    smallU,
    smallProg,
    divU,
    divProg,
    goodU,
    goodProg,
    panelU,
    winU,
    countU,
    momU,
    momProg,
    momTexU,
    sqrtTexU,
    adamU,
    adamProg,
    adamTexU,
    morphU,
    recapU,
  };
}
