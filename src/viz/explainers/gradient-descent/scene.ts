import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Gradient Descent — The Shape of Learning.
 *
 * All math lives here: a closed-form loss landscape, finite-difference
 * gradients, and three optimizer trajectories integrated with explicit Euler
 * steps at module scope. Nothing below uses randomness or wall-clock time —
 * every visual value is a pure function of the timeline.
 */

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------
// The landscape (closed form)
//
//   L(x, y) =  walls · (1 − exp(−d²/2τ²))     a narrow ravine whose floor
//                                             follows the parabola y = ax² + b
//                                             (saturating walls ⇒ plateaus)
//            + tilt · (x − x_g)²              a gentle slope along the valley
//            − A_g · N((x_g, y_g), σ_g)       a deep global basin at the end
//            − A_l · N((x_l, y_l), σ_l)       a shallow local basin on the
//                                             plateau above the ravine
//
// Constants tuned (numerically, see the trajectory stats in the runs below)
// so that: vanilla GD rattles across the ravine walls and crawls; momentum
// glides, overshoots the deep basin and settles; Adam hugs the floor and
// cuts cleanly down the ravine.
// ---------------------------------------------------------------------------

const RAVINE_A = 0.3; // curvature of the ravine floor
const RAVINE_B = -0.75;
const WALL_A = 0.9; // wall height (saturates ⇒ plateaus off-ravine)
const WALL_TAU = 0.3; // wall narrowness (perpendicular curvature ≈ WALL_A/τ² = 10)
const TILT = 0.01; // along-valley slope (≈ 1000× shallower than the walls)
const DEEP = { x: 2.2, a: 1.1, s: 0.5 } as const; // deep global basin
const SHALLOW = { x: 0.4, y: 1.15, a: 0.5, s: 0.42 } as const; // shallow local basin

export const floorY = (x: number): number => RAVINE_A * x * x + RAVINE_B;
export const GLOBAL_MIN: Pt = [DEEP.x, floorY(DEEP.x)];
export const LOCAL_MIN: Pt = [SHALLOW.x, SHALLOW.y];

const bump = (x: number, y: number, cx: number, cy: number, s: number): number =>
  Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));

export const LOSS = (x: number, y: number): number => {
  const d = y - floorY(x);
  return (
    WALL_A * (1 - Math.exp(-(d * d) / (2 * WALL_TAU * WALL_TAU))) +
    TILT * (x - DEEP.x) ** 2 -
    DEEP.a * bump(x, y, DEEP.x, GLOBAL_MIN[1], DEEP.s) -
    SHALLOW.a * bump(x, y, SHALLOW.x, SHALLOW.y, SHALLOW.s)
  );
};

/** Finite-difference gradient — used by the arrow field and the optimizers. */
const FD_H = 1e-4;
export const gradFD = (x: number, y: number): Pt => [
  (LOSS(x + FD_H, y) - LOSS(x - FD_H, y)) / (2 * FD_H),
  (LOSS(x, y + FD_H) - LOSS(x, y - FD_H)) / (2 * FD_H),
];

// ---------------------------------------------------------------------------
// Stage mapping — 200 px per landscape unit in both directions (16:9 domain)
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
// Optimizer trajectories — explicit Euler, fixed step count, module scope.
// ---------------------------------------------------------------------------

export const N_STEPS = 400;
export const START: Pt = [-2.6, floorY(-2.6) + 0.25];

// hyperparameters (tuned; see file-header comment)
export const GD_LR = 0.17; // ⇒ lr·λ⊥ ≈ 1.7: every step overshoots the wall
export const MOM_LR = 0.055;
export const MOM_BETA = 0.91; // effective along-valley lr ≈ 0.61
export const ADAM_LR = 0.15;
export const ADAM_B1 = 0.8; // modest inertia ⇒ glides in without the slingshot
export const ADAM_B2 = 0.995;
export const ADAM_EPS = 1e-3;

export interface Run {
  /** positions, length N_STEPS + 1 */
  pts: Pt[];
  /** loss at each position */
  loss: number[];
  /** per-step displacement (the "velocity"), vel[0] = [0, 0] */
  vel: Pt[];
  /** EMA of per-axis |Δ| — drives Adam's step-size ellipse */
  ema: Pt[];
}

function finishRun(pts: Pt[]): Run {
  const loss = pts.map(([x, y]) => LOSS(x, y));
  const vel: Pt[] = [[0, 0]];
  const ema: Pt[] = [[0.004, 0.004]];
  let ex = 0.004;
  let ey = 0.004;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    vel.push([dx, dy]);
    ex = 0.85 * ex + 0.15 * Math.abs(dx);
    ey = 0.85 * ey + 0.15 * Math.abs(dy);
    ema.push([ex, ey]);
  }
  return { pts, loss, vel, ema };
}

function runGD(): Pt[] {
  let [x, y] = START;
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < N_STEPS; i++) {
    const [gx, gy] = gradFD(x, y);
    x -= GD_LR * gx;
    y -= GD_LR * gy;
    pts.push([x, y]);
  }
  return pts;
}

function runMomentum(): Pt[] {
  let [x, y] = START;
  let vx = 0;
  let vy = 0;
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < N_STEPS; i++) {
    const [gx, gy] = gradFD(x, y);
    vx = MOM_BETA * vx - MOM_LR * gx;
    vy = MOM_BETA * vy - MOM_LR * gy;
    x += vx;
    y += vy;
    pts.push([x, y]);
  }
  return pts;
}

function runAdam(): Pt[] {
  let [x, y] = START;
  let mx = 0;
  let my = 0;
  let vx = 0;
  let vy = 0;
  const pts: Pt[] = [[x, y]];
  for (let i = 1; i <= N_STEPS; i++) {
    const [gx, gy] = gradFD(x, y);
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

// Precomputed once. Empirically (with the constants above):
//   GD       ends ≈ ( 1.04, −0.43), L ≈ +0.007 — mid-ravine, 155 wall-crossings
//   Momentum ends ≈ ( 2.20,  0.70), L ≈ −1.100 — overshoots to x ≈ 2.52, settles
//   Adam     ends ≈ ( 2.20,  0.70), L ≈ −1.100 — hugs the floor, glides in
export const GD: Run = finishRun(runGD());
export const MOMENTUM: Run = finishRun(runMomentum());
export const ADAM: Run = finishRun(runAdam());

// ---------------------------------------------------------------------------
// The −∇L arrow field (7 × 5 grid, finite differences)
// ---------------------------------------------------------------------------

export interface FlowArrow {
  x: number;
  y: number;
  /** unit direction of −∇L */
  ux: number;
  uy: number;
  /** |∇L| (0.005 … 3.8 over this grid) */
  mag: number;
}

export const FLOW: FlowArrow[] = (() => {
  const out: FlowArrow[] = [];
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 7; i++) {
      const x = -2.9 + (5.8 * i) / 6;
      const y = -1.5 + (3 * j) / 4;
      const [gx, gy] = gradFD(x, y);
      const mag = Math.hypot(gx, gy);
      const inv = mag > 1e-9 ? 1 / mag : 0;
      out.push({ x, y, ux: -gx * inv, uy: -gy * inv, mag });
    }
  }
  return out;
})();

/** The highlighted probe arrow: the grid point on the ravine wall nearest (−1, −0.75). */
export const PROBE_INDEX: number = (() => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < FLOW.length; i++) {
    const d = Math.hypot(FLOW[i].x + 1, FLOW[i].y + 0.75);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
})();

// ---------------------------------------------------------------------------
// Pure lookups for playback
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Position (or any per-step pair) at progress u ∈ [0, 1] — fractional-index lerp. */
export function pathAt(pts: readonly Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.floor(f);
  if (i >= pts.length - 1) return pts[pts.length - 1];
  const t = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Loss at a (fractional) step index — the f for the comparison FunctionPlots. */
export function lossAtStep(hist: readonly number[], step: number): number {
  const f = Math.max(0, Math.min(hist.length - 1, step));
  const i = Math.floor(f);
  if (i >= hist.length - 1) return hist[hist.length - 1];
  return hist[i] + (hist[i + 1] - hist[i]) * (f - i);
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export const CAM_PUSH: CameraState = { x: 620, y: 348, k: 1.1 };
/** Pull-back that parks the landscape in the left 72% of the stage. */
export const CAM_WIDE: CameraState = { x: 889, y: 360, k: 0.72 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  contourReveal: ChannelRef<number>;
  lossTexU: ChannelRef<number>;
  basinU: ChannelRef<number>;
  fieldGrow: ChannelRef<number>;
  fieldOp: ChannelRef<number>;
  probeU: ChannelRef<number>;
  startU: ChannelRef<number>;
  gdU: ChannelRef<number>;
  gdProg: ChannelRef<number>;
  gdTexU: ChannelRef<number>;
  momU: ChannelRef<number>;
  momProg: ChannelRef<number>;
  velU: ChannelRef<number>;
  momTexU: ChannelRef<number>;
  adamU: ChannelRef<number>;
  adamProg: ChannelRef<number>;
  ellipseU: ChannelRef<number>;
  adamTexU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  curveReveal: ChannelRef<number>;
  legendU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const contourReveal = tl.channel('contourReveal', 0);
  const lossTexU = tl.channel('lossTexU', 0);
  const basinU = tl.channel('basinU', 0);
  const fieldGrow = tl.channel('fieldGrow', 0);
  const fieldOp = tl.channel('fieldOp', 1);
  const probeU = tl.channel('probeU', 0);
  const startU = tl.channel('startU', 0);
  const gdU = tl.channel('gdU', 0);
  const gdProg = tl.channel('gdProg', 0);
  const gdTexU = tl.channel('gdTexU', 0);
  const momU = tl.channel('momU', 0);
  const momProg = tl.channel('momProg', 0);
  const velU = tl.channel('velU', 0);
  const momTexU = tl.channel('momTexU', 0);
  const adamU = tl.channel('adamU', 0);
  const adamProg = tl.channel('adamProg', 0);
  const ellipseU = tl.channel('ellipseU', 0);
  const adamTexU = tl.channel('adamTexU', 0);
  const panelU = tl.channel('panelU', 0);
  const curveReveal = tl.channel('curveReveal', 0);
  const legendU = tl.channel('legendU', 0);

  // — Beat 1 · the landscape ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Loss is a landscape. Training is a search for the lowest valley.',
    tex: 'L(\\theta)',
  });
  tl.tween(contourReveal, 1, { at: 0.4, dur: 3.8, ease: ease.draw });
  tl.tween(cam, CAM_PUSH, { at: 0.7, dur: 5.2, ease: ease.move });
  tl.tween(lossTexU, 1, { at: 3.6, dur: 0.8, ease: ease.enter });
  tl.tween(basinU, 1, { at: 4.2, dur: 0.9, ease: ease.enter });

  // — Beat 2 · the gradient field ———————————————————————————————————————
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'At every point, the slope of the ground says: downhill is this way.',
    tex: '-\\nabla L(\\theta)',
  });
  tl.tween(fieldGrow, 1, { at: 7.2, dur: 1.8, ease: ease.enter });
  tl.tween(probeU, 1, { at: 9.6, dur: 0.7, ease: ease.enter });
  tl.tween(probeU, 0, { at: 12.6, dur: 0.8, ease: ease.enter });
  // fade the arrows to a whisper before the balls run
  tl.tween(fieldOp, 0.12, { at: 13.0, dur: 1.1, ease: ease.move });
  tl.tween(basinU, 0.45, { at: 13.0, dur: 1.1, ease: ease.move });

  // — Beat 3 · vanilla gradient descent —————————————————————————————————
  tl.caption({
    at: 14.0,
    dur: 5.4,
    text: 'Gradient descent follows the slope blindly, one step at a time.',
  });
  tl.tween(startU, 1, { at: 14.0, dur: 0.7, ease: ease.enter });
  tl.tween(gdTexU, 1, { at: 14.3, dur: 0.7, ease: ease.enter });
  tl.tween(gdU, 1, { at: 14.6, dur: 0.5, ease: ease.pop });
  tl.tween(gdProg, 1, { at: 15.2, dur: 10.2, ease: ease.linear });
  tl.caption({
    at: 19.8,
    dur: 6.0,
    text: 'In a narrow ravine, every step overshoots the wall. It rattles — and crawls.',
  });
  tl.hold(25.8, 0.6);

  // — Beat 4 · momentum ——————————————————————————————————————————————————
  tl.caption({
    at: 26.4,
    dur: 5.6,
    text: 'Momentum makes the ball heavy: each step remembers the ones before.',
    tex: 'v \\leftarrow \\beta v - \\eta\\nabla L',
  });
  tl.tween(momTexU, 1, { at: 26.7, dur: 0.7, ease: ease.enter });
  tl.tween(momU, 1, { at: 27.0, dur: 0.5, ease: ease.pop });
  tl.tween(velU, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(momProg, 1, { at: 27.6, dur: 9.4, ease: ease.linear });
  tl.caption({
    at: 32.2,
    dur: 5.8,
    text: 'The rattle cancels out, speed builds — it overshoots the deep valley, then settles in.',
  });
  tl.hold(38.0, 0.2);

  // — Beat 5 · Adam ——————————————————————————————————————————————————————
  tl.caption({
    at: 38.2,
    dur: 5.6,
    text: 'Adam sizes the step for each direction from its own recent history.',
    tex: '\\hat m / (\\sqrt{\\hat v} + \\varepsilon)',
  });
  tl.tween(adamTexU, 1, { at: 38.5, dur: 0.7, ease: ease.enter });
  tl.tween(adamU, 1, { at: 38.8, dur: 0.5, ease: ease.pop });
  tl.tween(ellipseU, 1, { at: 39.4, dur: 0.7, ease: ease.enter });
  tl.tween(adamProg, 1, { at: 39.4, dur: 8.6, ease: ease.linear });
  tl.caption({
    at: 44.0,
    dur: 5.4,
    text: 'Timid across the steep walls, bold along the quiet valley — it cuts straight down the ravine.',
  });
  tl.hold(49.4, 0.2);

  // — Beat 6 · the comparison ————————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 49.6, dur: 1.8, ease: ease.move });
  tl.tween(lossTexU, 0, { at: 49.4, dur: 0.7, ease: ease.move });
  tl.tween(gdTexU, 0, { at: 49.4, dur: 0.7, ease: ease.move });
  tl.tween(momTexU, 0, { at: 49.4, dur: 0.7, ease: ease.move });
  tl.tween(adamTexU, 0, { at: 49.4, dur: 0.7, ease: ease.move });
  tl.tween(basinU, 0, { at: 49.4, dur: 0.7, ease: ease.move });
  tl.caption({
    at: 50.0,
    dur: 6.2,
    text: 'Same landscape, three searches — the shape of the loss decides the race.',
  });
  tl.tween(panelU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.tween(curveReveal, 1, { at: 51.6, dur: 4.8, ease: ease.linear });
  tl.tween(legendU, 1, { at: 52.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 56.6,
    dur: 5.6,
    text: 'Momentum arrives fast but swings past; Adam glides in; plain descent is still crawling.',
  });
  tl.hold(62.2, 1.4);

  return {
    tl,
    cam,
    contourReveal,
    lossTexU,
    basinU,
    fieldGrow,
    fieldOp,
    probeU,
    startU,
    gdU,
    gdProg,
    gdTexU,
    momU,
    momProg,
    velU,
    momTexU,
    adamU,
    adamProg,
    ellipseU,
    adamTexU,
    panelU,
    curveReveal,
    legendU,
  };
}
