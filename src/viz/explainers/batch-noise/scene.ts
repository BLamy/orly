import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Batch Size and Noise — where gradient noise comes from, and what averaging buys.
 *
 * All math lives here, at module scope, seeded and real:
 *   - a tiny regression problem: 64 noisy points y ≈ w·x + c (mulberry32(7))
 *   - per-example gradients at a probe parameter point (the "fan of tugs")
 *   - the measured spread of the batch-mean gradient estimate for B ∈ {1, 8, 64}
 *     (400 seeded batches each — the σ/√B ellipses are data, not decoration)
 *   - real minibatch SGD trajectories in (w, c) space: a 60-step per-step race,
 *     and equal-example-budget runs (640 examples each) for the cost twist.
 * Every frame below is a pure function of the timeline — no per-frame randomness.
 */

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------
// The dataset: 64 seeded noisy points around y = 1.4 x + 0.5
// ---------------------------------------------------------------------------

export const N = 64;
export const W_TRUE = 1.4;
export const C_TRUE = 0.5;
export const NOISE_SD = 0.8;

export const DATA_X: number[] = [];
export const DATA_Y: number[] = [];
{
  const rand = mulberry32(7);
  const normal = gaussian(rand);
  for (let i = 0; i < N; i++) {
    const x = -2 + 4 * rand();
    DATA_X.push(x);
    DATA_Y.push(W_TRUE * x + C_TRUE + NOISE_SD * normal());
  }
}

/** Closed-form least squares — the true bottom of the bowl. */
export const [W_STAR, C_STAR] = (() => {
  const mx = DATA_X.reduce((a, b) => a + b, 0) / N;
  const my = DATA_Y.reduce((a, b) => a + b, 0) / N;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < N; i++) {
    sxx += (DATA_X[i] - mx) ** 2;
    sxy += (DATA_X[i] - mx) * (DATA_Y[i] - my);
  }
  const w = sxy / sxx;
  return [w, my - w * mx] as const; // ≈ (1.508, 0.547)
})();

// ---------------------------------------------------------------------------
// Loss and gradients — squared error, per example and averaged
// ---------------------------------------------------------------------------

/** Per-example gradient of ½(w·xᵢ + c − yᵢ)² wrt (w, c). */
export const gradI = (w: number, c: number, i: number): Pt => {
  const r = w * DATA_X[i] + c - DATA_Y[i];
  return [r * DATA_X[i], r];
};

export const LOSS = (w: number, c: number): number => {
  let s = 0;
  for (let i = 0; i < N; i++) {
    const r = w * DATA_X[i] + c - DATA_Y[i];
    s += 0.5 * r * r;
  }
  return s / N;
};

export const gradFull = (w: number, c: number): Pt => {
  let gw = 0;
  let gc = 0;
  for (let i = 0; i < N; i++) {
    const [a, b] = gradI(w, c, i);
    gw += a;
    gc += b;
  }
  return [gw / N, gc / N];
};

// ---------------------------------------------------------------------------
// The probe point: where we examine the fan of per-example tugs
// ---------------------------------------------------------------------------

export const START: Pt = [-0.4, 2.0]; // a bad line: wrong slope, too high

/** All 64 per-example gradients at the probe (the fan). */
export const FAN: Pt[] = (() => {
  const out: Pt[] = [];
  for (let i = 0; i < N; i++) out.push(gradI(START[0], START[1], i));
  return out;
})();

/** The true (full-batch) gradient at the probe — the fan's average. */
export const G_BAR: Pt = gradFull(START[0], START[1]); // ≈ (−1.738, 1.156)

// ---------------------------------------------------------------------------
// Measured spread of the batch-mean estimate, B ∈ {1, 8, 64}
// (400 seeded batches per size, sampled with replacement — real measurement)
// ---------------------------------------------------------------------------

export const BATCH_SIZES = [1, 8, 64] as const;

export interface Spread {
  b: number;
  /** measured std of the batch-mean gradient along w and c */
  sw: number;
  sc: number;
}

export const SPREADS: Spread[] = (() => {
  const rand = mulberry32(99);
  const K = 400;
  return BATCH_SIZES.map((b) => {
    const ws: number[] = [];
    const cs: number[] = [];
    let mw = 0;
    let mc = 0;
    for (let k = 0; k < K; k++) {
      let gw = 0;
      let gc = 0;
      for (let j = 0; j < b; j++) {
        const i = Math.floor(rand() * N);
        const [a, d] = gradI(START[0], START[1], i);
        gw += a;
        gc += d;
      }
      gw /= b;
      gc /= b;
      ws.push(gw);
      cs.push(gc);
      mw += gw;
      mc += gc;
    }
    mw /= K;
    mc /= K;
    const sw = Math.sqrt(ws.reduce((s, v) => s + (v - mw) ** 2, 0) / K);
    const sc = Math.sqrt(cs.reduce((s, v) => s + (v - mc) ** 2, 0) / K);
    return { b, sw, sc };
  });
  // measured ≈ (2.72, 2.24) · (0.93, 0.81) · (0.34, 0.27) — the σ/√B law, live
})();

// ---------------------------------------------------------------------------
// Minibatch SGD — same start, same learning rate, only the batch size differs
// ---------------------------------------------------------------------------

export const LR = 0.28;

export interface Run {
  b: number;
  pts: Pt[];
  loss: number[];
}

function sgd(b: number, seed: number, steps: number): Run {
  const rand = mulberry32(seed);
  let [w, c] = START;
  const pts: Pt[] = [[w, c]];
  const loss = [LOSS(w, c)];
  for (let s = 0; s < steps; s++) {
    let gw = 0;
    let gc = 0;
    for (let j = 0; j < b; j++) {
      const i = Math.floor(rand() * N);
      const [a, d] = gradI(w, c, i);
      gw += a;
      gc += d;
    }
    w -= (LR * gw) / b;
    c -= (LR * gc) / b;
    pts.push([w, c]);
    loss.push(LOSS(w, c));
  }
  return { b, pts, loss };
}

/** The per-step race: 60 steps each. B=1 staggers, B=8 wobbles, B=64 glides. */
export const RACE_STEPS = 60;
export const RACE: Run[] = [sgd(1, 11, RACE_STEPS), sgd(8, 12, RACE_STEPS), sgd(64, 13, RACE_STEPS)];

/** The honest-cost runs: an equal budget of 640 examples seen per run. */
export const BUDGET_EXAMPLES = 640;
export const BUDGET: Run[] = [
  sgd(1, 21, 640), // 640 steps of batch 1
  sgd(8, 22, 80), // 80 steps of batch 8
  sgd(64, 23, 10), // 10 steps of batch 64
];

// ---------------------------------------------------------------------------
// Stage mapping — parameter space (w, c) fills the 1280×720 stage
// ---------------------------------------------------------------------------

export const DOMAIN_W: readonly [number, number] = [-1.8, 3.0];
export const DOMAIN_C: readonly [number, number] = [-0.6, 3.0];

export const wScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_W])
  .range([0, STAGE_W]);
export const cScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_C])
  .range([STAGE_H, 0]);

/** px per gradient unit for the fan, the mean arrow, and the spread rings. */
export const PSCALE = 30;
/** readability cap on the longest per-example tugs (|g| up to ≈ 10.3). */
export const FAN_MAX_PX = 205;

// ---------------------------------------------------------------------------
// Pure lookups for playback
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Fractional-index lerp along a trajectory, u ∈ [0, 1]. */
export function pathAt(pts: readonly Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.floor(f);
  if (i >= pts.length - 1) return pts[pts.length - 1];
  const t = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Loss at a fractional step index (for the loss-per-example curves). */
export function lossAtStep(hist: readonly number[], step: number): number {
  const f = Math.max(0, Math.min(hist.length - 1, step));
  const i = Math.floor(f);
  if (i >= hist.length - 1) return hist[hist.length - 1];
  return hist[i] + (hist[i + 1] - hist[i]) * (f - i);
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export const CAM_PROBE: CameraState = { x: 470, y: 255, k: 1.4 };
/** Parks the contour field in the left ~72% of the stage for the cost panel. */
export const CAM_WIDE: CameraState = { x: 889, y: 360, k: 0.72 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dataU: ChannelRef<number>;
  dataOp: ChannelRef<number>;
  lineU: ChannelRef<number>;
  contourU: ChannelRef<number>;
  fieldOp: ChannelRef<number>;
  lossTexU: ChannelRef<number>;
  starU: ChannelRef<number>;
  fanU: ChannelRef<number>;
  fanOp: ChannelRef<number>;
  avgU: ChannelRef<number>;
  avgOp: ChannelRef<number>;
  ellU: ChannelRef<number>;
  sigTexU: ChannelRef<number>;
  runnersU: ChannelRef<number>;
  raceProg: ChannelRef<number>;
  raceOp: ChannelRef<number>;
  panelU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  legendU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const dataU = tl.channel('dataU', 0);
  const dataOp = tl.channel('dataOp', 1);
  const lineU = tl.channel('lineU', 0);
  const contourU = tl.channel('contourU', 0);
  const fieldOp = tl.channel('fieldOp', 1);
  const lossTexU = tl.channel('lossTexU', 0);
  const starU = tl.channel('starU', 0);
  const fanU = tl.channel('fanU', 0);
  const fanOp = tl.channel('fanOp', 1);
  const avgU = tl.channel('avgU', 0);
  const avgOp = tl.channel('avgOp', 1);
  const ellU = tl.channel('ellU', 0);
  const sigTexU = tl.channel('sigTexU', 0);
  const runnersU = tl.channel('runnersU', 0);
  const raceProg = tl.channel('raceProg', 0);
  const raceOp = tl.channel('raceOp', 1);
  const panelU = tl.channel('panelU', 0);
  const curveU = tl.channel('curveU', 0);
  const legendU = tl.channel('legendU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the dataset ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Here is an honest little training problem: sixty four noisy points, and a line with two knobs — a slope and an intercept — trying to fit them.',
  });
  tl.tween(dataU, 1, { at: 0.6, dur: 2.4, ease: ease.enter });
  tl.tween(lineU, 1, { at: 3.4, dur: 1.2, ease: ease.draw });
  tl.hold(7.1, 0.6);

  // — Beat 2 · parameter space ————————————————————————————————————————————
  tl.caption({
    at: 7.7,
    dur: 6.6,
    text: 'Every possible line is one point on this map. Height is the average mistake over all sixty four points, and the best fit sits at the bottom of the bowl.',
    tex: 'L(w,c)=\\tfrac{1}{64}\\textstyle\\sum_i \\ell_i(w,c)',
  });
  tl.tween(contourU, 1, { at: 7.8, dur: 3.6, ease: ease.draw });
  tl.tween(lossTexU, 1, { at: 10.6, dur: 0.8, ease: ease.enter });
  tl.tween(starU, 1, { at: 11.6, dur: 0.7, ease: ease.enter });
  tl.tween(dataOp, 0.3, { at: 11.8, dur: 1.0, ease: ease.move });
  tl.hold(14.5, 0.6);

  // — Beat 3 · the fan of per-example tugs ————————————————————————————————
  tl.caption({
    at: 15.1,
    dur: 6.8,
    text: 'Now ask each point, alone, which way it wants the knobs to move. You get sixty four different answers — every example tugs the parameters its own way.',
  });
  tl.tween(cam, CAM_PROBE, { at: 15.2, dur: 1.6, ease: ease.move });
  tl.tween(fanU, 1, { at: 16.4, dur: 2.6, ease: ease.enter });
  tl.hold(22.1, 0.6);

  // — Beat 4 · the average is the true gradient ———————————————————————————
  tl.caption({
    at: 22.7,
    dur: 6.4,
    text: 'The true gradient is simply the average of those tugs. A minibatch averages just a few of them — right on average, but with leftover noise.',
    tex: '\\hat g = \\tfrac{1}{B}\\textstyle\\sum_{i \\in \\text{batch}} \\nabla \\ell_i',
  });
  tl.tween(fanOp, 0.3, { at: 23.0, dur: 1.0, ease: ease.move });
  tl.tween(avgU, 1, { at: 23.4, dur: 1.0, ease: ease.draw });
  tl.hold(29.3, 0.6);

  // — Beat 5 · measured spread rings, σ/√B ————————————————————————————————
  tl.caption({
    at: 29.9,
    dur: 7.0,
    text: 'How much noise? We measured the spread of four hundred batch estimates: averaging shrinks it like one over the square root of the batch size. One ring each for batches of one, eight, and sixty four.',
    tex: '\\text{spread} \\approx \\sigma/\\sqrt{B}',
  });
  tl.tween(ellU, 1, { at: 30.2, dur: 2.2, ease: ease.enter });
  tl.tween(sigTexU, 1, { at: 32.4, dur: 0.8, ease: ease.enter });
  tl.hold(37.1, 0.7);

  // — Beat 6 · three runners, one start ———————————————————————————————————
  tl.caption({
    at: 37.8,
    dur: 6.2,
    text: 'Now train for real. Three runners leave the same starting line with the same learning rate. The only difference is how many examples each step averages: one, eight, or sixty four.',
  });
  tl.tween(fanOp, 0, { at: 37.9, dur: 1.0, ease: ease.move });
  tl.tween(avgOp, 0, { at: 37.9, dur: 1.0, ease: ease.move });
  tl.tween(ellU, 0, { at: 37.9, dur: 1.0, ease: ease.move });
  tl.tween(sigTexU, 0, { at: 37.9, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 38.2, dur: 1.5, ease: ease.move });
  tl.tween(runnersU, 1, { at: 39.6, dur: 0.8, ease: ease.pop });
  tl.tween(dataOp, 1, { at: 39.6, dur: 0.9, ease: ease.move });

  // — Beat 7 · the race ————————————————————————————————————————————————————
  tl.tween(raceProg, 1, { at: 44.3, dur: 9.6, ease: ease.linear });
  tl.caption({
    at: 44.3,
    dur: 6.6,
    text: 'Batch one staggers drunkenly — each step trusts a single noisy point. Batch eight wobbles. Batch sixty four glides straight down the bowl, and the fitted line snaps onto the data.',
  });
  tl.hold(53.9, 0.6);

  // — Beat 8 · steps are the wrong unit ————————————————————————————————————
  tl.caption({
    at: 54.5,
    dur: 6.2,
    text: 'So bigger batches win? Careful. Every step of batch sixty four reads sixty four examples. Steps are not the honest unit of cost — examples are.',
  });
  tl.hold(60.7, 0.4);

  // — Beat 9 · loss per example seen ————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 61.1, dur: 1.8, ease: ease.move });
  tl.tween(lossTexU, 0, { at: 61.0, dur: 0.7, ease: ease.move });
  tl.tween(dataOp, 0, { at: 61.0, dur: 0.8, ease: ease.move });
  tl.tween(raceOp, 0.4, { at: 61.1, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 61.6,
    dur: 7.0,
    text: 'Charge each run for the data it reads, and the story flips. Per example seen, the cheap noisy steps of batch one race ahead — while batch sixty four is still paying for its very first move.',
  });
  tl.tween(panelU, 1, { at: 62.4, dur: 0.9, ease: ease.enter });
  tl.tween(curveU, 1, { at: 63.4, dur: 4.6, ease: ease.linear });
  tl.tween(legendU, 1, { at: 64.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 69.2,
    dur: 6.0,
    text: 'Batch eight lands in between: enough averaging to settle, cheap enough to take many steps. In practice, that middle ground is where most training lives.',
  });
  tl.hold(75.2, 0.6);

  // — Beat 10 · recap ———————————————————————————————————————————————————————
  tl.tween(fieldOp, 0.12, { at: 75.8, dur: 1.2, ease: ease.move });
  tl.tween(raceOp, 0.1, { at: 75.8, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 0.1, { at: 75.8, dur: 1.2, ease: ease.move });
  tl.tween(runnersU, 0, { at: 75.8, dur: 1.0, ease: ease.move });
  tl.tween(starU, 0, { at: 75.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 77.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 76.8,
    dur: 5.8,
    text: 'So batch size is a dial, not a virtue: it buys smoothness at the square root rate, and it charges you examples for every bit of it.',
    tex: '\\text{noise} \\propto \\sigma/\\sqrt{B} \\qquad \\text{cost} \\propto B',
  });
  tl.caption({
    at: 83.0,
    dur: 5.6,
    text: 'And a little noise is not the enemy — jittery, cheap steps see more of the data per unit of work. That is the trade every training run makes.',
  });
  tl.hold(88.6, 1.2);

  return {
    tl,
    cam,
    dataU,
    dataOp,
    lineU,
    contourU,
    fieldOp,
    lossTexU,
    starU,
    fanU,
    fanOp,
    avgU,
    avgOp,
    ellU,
    sigTexU,
    runnersU,
    raceProg,
    raceOp,
    panelU,
    curveU,
    legendU,
    endU,
  };
}
