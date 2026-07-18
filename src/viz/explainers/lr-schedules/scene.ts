import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Learning-Rate Schedules — big steps to travel, small steps to land.
 *
 * All math lives here at module scope: a quadratic bowl with a quartic rim,
 * REAL stochastic gradient descent under three schedules (constant high,
 * constant low, cosine decay) with seeded gradient noise, averaged statistics
 * over 8 seeds, and a warmup-vs-cold-start pair on the steep rim. Nothing
 * below uses wall-clock time or unseeded randomness — every frame is a pure
 * function of the timeline.
 */

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------
// The landscape: an anisotropic quadratic bowl + a quartic rim.
//
//   L(x, y) = ½(x² + 2.5 y²) + q·(x² + y²)²
//
// Near the origin curvature is 1…2.5 (a constant η = 0.2 is comfortably
// stable); out at r² ≈ 11 the quartic pushes the top curvature to ≈ 7.8, so
// a cold start at η = 0.6 has η·λ ≈ 4.7 → genuine divergence, while a short
// warmup ramp crosses the rim on small steps and survives at the same peak.
// ---------------------------------------------------------------------------

const AX = 1.0;
const AY = 2.5;
const Q = 0.04;

export const LOSS = (x: number, y: number): number =>
  0.5 * (AX * x * x + AY * y * y) + Q * (x * x + y * y) ** 2;

const GRAD = (x: number, y: number): Pt => {
  const r2 = x * x + y * y;
  return [AX * x + 4 * Q * r2 * x, AY * y + 4 * Q * r2 * y];
};

// ---------------------------------------------------------------------------
// Stage mapping — uniform px per unit, minimum at stage center (640, 360)
// ---------------------------------------------------------------------------

export const DOMAIN_X: readonly [number, number] = [-3.6, 3.6];
export const DOMAIN_Y: readonly [number, number] = [-2.025, 2.025];

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_X])
  .range([0, STAGE_W]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([...DOMAIN_Y])
  .range([STAGE_H, 0]);

// ---------------------------------------------------------------------------
// Stochastic gradient descent — the three schedules
// ---------------------------------------------------------------------------

export const N_STEPS = 300;
export const START: Pt = [-2.4, 1.5];
export const SIGMA = 0.9; // std-dev of the per-component gradient noise

export const ETA_HI = 0.2;
export const ETA_LO = 0.008;
export const ETA_MIN = 0.004;

/** Cosine decay from ETA_HI down to ETA_MIN over N_STEPS. */
export const cosEta = (i: number): number =>
  ETA_MIN + 0.5 * (ETA_HI - ETA_MIN) * (1 + Math.cos((Math.PI * Math.min(i, N_STEPS)) / N_STEPS));

type EtaFn = (i: number) => number;

function runSGD(etaFn: EtaFn, seed: number, start: Pt, n: number): { pts: Pt[]; loss: number[] } {
  const rand = mulberry32(seed);
  const g = gaussian(rand);
  let [x, y] = start;
  const pts: Pt[] = [[x, y]];
  const loss: number[] = [LOSS(x, y)];
  for (let i = 0; i < n; i++) {
    const [gx, gy] = GRAD(x, y);
    const e = etaFn(i);
    x -= e * (gx + SIGMA * g());
    y -= e * (gy + SIGMA * g());
    pts.push([x, y]);
    loss.push(LOSS(x, y));
    if (!Number.isFinite(loss[loss.length - 1]) || Math.hypot(x, y) > 4.8) break; // divergence guard
  }
  return { pts, loss };
}

// Statistics averaged over 8 seeds (the honest numbers); the DISPLAYED
// trajectory is seed SHOW_SEED for all three schedules — same seed means the
// SAME noise sequence, so "same start, same noise" is literally true.
const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88] as const;
export const SHOW_SEED = 11;
const TAIL = 100; // "final" window: the last 100 steps

export interface Schedule {
  /** the displayed trajectory (seed SHOW_SEED) */
  pts: Pt[];
  /** per-step loss averaged over the 8 seeds */
  avgLoss: number[];
  /** mean distance to the minimum over the last TAIL steps, across seeds */
  dist: number;
  /** avgLoss at the final step */
  finalLoss: number;
}

function makeSchedule(etaFn: EtaFn): Schedule {
  const avgLoss = new Array<number>(N_STEPS + 1).fill(0);
  let dSum = 0;
  let dCnt = 0;
  let show: Pt[] = [];
  for (const seed of SEEDS) {
    const r = runSGD(etaFn, seed, START, N_STEPS);
    if (seed === SHOW_SEED) show = r.pts;
    for (let i = 0; i <= N_STEPS; i++) avgLoss[i] += r.loss[i] / SEEDS.length;
    for (let i = N_STEPS - TAIL + 1; i <= N_STEPS; i++) {
      dSum += Math.hypot(r.pts[i][0], r.pts[i][1]);
      dCnt++;
    }
  }
  return { pts: show, avgLoss, dist: dSum / dCnt, finalLoss: avgLoss[N_STEPS] };
}

// Precomputed once. Empirically (with the constants above):
//   high η=0.2   dist ≈ 0.30, final avg loss ≈ 0.063  — fast, permanent jitter ball
//   low  η=0.008 dist ≈ 0.24, final avg loss ≈ 0.011  — tiny ball, still crawling
//   cosine       dist ≈ 0.10, final avg loss ≈ 0.0046 — sprint, then settle: best
export const HI: Schedule = makeSchedule(() => ETA_HI);
export const LO: Schedule = makeSchedule(() => ETA_LO);
export const CO: Schedule = makeSchedule(cosEta);

// ---------------------------------------------------------------------------
// Warmup vs cold start — on the steep rim, same peak rate, opposite fates
// ---------------------------------------------------------------------------

export const W_START: Pt = [-2.9, 1.65];
export const ETA_PEAK = 0.6;
export const W_STEPS = 80;
export const RAMP = 25;

const warmEta: EtaFn = (i) => (i < RAMP ? ETA_LO + ((ETA_PEAK - ETA_LO) * i) / RAMP : ETA_PEAK);

/** Cold start at full η: diverges within a handful of steps (path is cut when |θ| > 4.8). */
export const COLD: { pts: Pt[]; loss: number[] } = runSGD(() => ETA_PEAK, 7, W_START, W_STEPS);
/** Warmup ramp to the same peak: crosses the rim on small steps and stays bounded. */
export const WARM: { pts: Pt[]; loss: number[] } = runSGD(warmEta, 7, W_START, W_STEPS);

// ---------------------------------------------------------------------------
// Pure lookups for playback
// ---------------------------------------------------------------------------

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Position at progress u ∈ [0, 1] along a point list — fractional-index lerp. */
export function pathAt(pts: readonly Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.floor(f);
  if (i >= pts.length - 1) return pts[pts.length - 1];
  const t = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** log10 of the seed-averaged loss at a (fractional) step — the loss-panel curves. */
export function logLossAt(hist: readonly number[], step: number): number {
  const f = Math.max(0, Math.min(hist.length - 1, step));
  const i = Math.floor(f);
  const v =
    i >= hist.length - 1 ? hist[hist.length - 1] : hist[i] + (hist[i + 1] - hist[i]) * (f - i);
  return Math.log10(Math.max(v, 1e-4));
}

// ---------------------------------------------------------------------------
// Camera marks
// ---------------------------------------------------------------------------

/** Landscape parked in the left ~70% of the stage, panels on the right. */
export const CAM_WIDE: CameraState = { x: 810, y: 360, k: 0.84 };
/** Pushed into the jitter ball around the minimum. */
export const CAM_BALL: CameraState = { x: 758, y: 402, k: 1.85 };
/** Wide on the steep rim for the warmup beat. */
export const CAM_RIM: CameraState = { x: 700, y: 330, k: 0.7 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  contourU: ChannelRef<number>;
  schedPanelU: ChannelRef<number>;
  schedU: ChannelRef<number>;
  cosTexU: ChannelRef<number>;
  startU: ChannelRef<number>;
  lossPanelU: ChannelRef<number>;
  hiU: ChannelRef<number>;
  hiProg: ChannelRef<number>;
  ballU: ChannelRef<number>;
  loU: ChannelRef<number>;
  loProg: ChannelRef<number>;
  coU: ChannelRef<number>;
  coProg: ChannelRef<number>;
  dialU: ChannelRef<number>;
  statU: ChannelRef<number>;
  mainFade: ChannelRef<number>;
  coldU: ChannelRef<number>;
  coldProg: ChannelRef<number>;
  warmU: ChannelRef<number>;
  warmProg: ChannelRef<number>;
  etaTexU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const contourU = tl.channel('contourU', 0);
  const schedPanelU = tl.channel('schedPanelU', 0);
  const schedU = tl.channel('schedU', 0);
  const cosTexU = tl.channel('cosTexU', 0);
  const startU = tl.channel('startU', 0);
  const lossPanelU = tl.channel('lossPanelU', 0);
  const hiU = tl.channel('hiU', 0);
  const hiProg = tl.channel('hiProg', 0);
  const ballU = tl.channel('ballU', 0);
  const loU = tl.channel('loU', 0);
  const loProg = tl.channel('loProg', 0);
  const coU = tl.channel('coU', 0);
  const coProg = tl.channel('coProg', 0);
  const dialU = tl.channel('dialU', 0);
  const statU = tl.channel('statU', 0);
  const mainFade = tl.channel('mainFade', 1);
  const coldU = tl.channel('coldU', 0);
  const coldProg = tl.channel('coldProg', 0);
  const warmU = tl.channel('warmU', 0);
  const warmProg = tl.channel('warmProg', 0);
  const etaTexU = tl.channel('etaTexU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the dial and its three shapes ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Training has one dial you can never skip: the learning rate — how far each step moves. And nothing says it has to stay fixed.',
    tex: '\\eta',
  });
  tl.tween(contourU, 1, { at: 0.4, dur: 3.6, ease: ease.draw });
  tl.tween(cam, CAM_WIDE, { at: 0.6, dur: 2.2, ease: ease.move });
  tl.tween(schedPanelU, 1, { at: 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(schedU, 1, { at: 3.2, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 7.5,
    dur: 6.6,
    text: 'A schedule is the learning rate as a function of the step. Hold it high, hold it low, or glide from high to low along a cosine.',
  });
  tl.tween(cosTexU, 1, { at: 9.2, dur: 0.8, ease: ease.enter });
  tl.hold(14.1, 0.8);

  // — Beat 2 · constant high: fast, then a permanent jitter ball —————————
  tl.caption({
    at: 14.9,
    dur: 6.4,
    text: "The arena is a noisy bowl: every gradient we measure arrives with a random shove. Let's run real descent at the constant high rate.",
  });
  tl.tween(startU, 1, { at: 15.2, dur: 0.7, ease: ease.enter });
  tl.tween(lossPanelU, 1, { at: 16.0, dur: 0.8, ease: ease.enter });
  tl.tween(hiU, 1, { at: 16.6, dur: 0.5, ease: ease.pop });
  tl.tween(hiProg, 1, { at: 17.2, dur: 8.8, ease: ease.linear });
  tl.caption({
    at: 21.6,
    dur: 5.2,
    text: 'It races downhill — most of the distance is gone within a couple dozen steps.',
  });
  tl.tween(cam, CAM_BALL, { at: 23.0, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 27.0,
    dur: 6.6,
    text: 'But it never lands. Near the bottom the noise stops averaging out, and the ball just orbits the minimum in a jitter cloud whose radius is set by the rate.',
  });
  tl.tween(ballU, 1, { at: 28.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 33.8,
    dur: 6.0,
    text: "Averaged over the last hundred steps, it sits about a third of a unit from the bottom. Fast — and permanently restless.",
  });
  tl.hold(39.8, 0.7);

  // — Beat 3 · constant low: tiny ball, painful crawl —————————————————————
  tl.tween(cam, CAM_WIDE, { at: 40.0, dur: 2.0, ease: ease.move });
  tl.tween(ballU, 0, { at: 40.0, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 40.5,
    dur: 6.2,
    text: 'Now the constant low rate, from the same start. Each step is twenty five times smaller, so the jitter cloud all but vanishes.',
  });
  tl.tween(loU, 1, { at: 41.2, dur: 0.5, ease: ease.pop });
  tl.tween(loProg, 1, { at: 41.7, dur: 9.0, ease: ease.linear });
  tl.caption({
    at: 47.0,
    dur: 5.6,
    text: "But three hundred steps later it's still crawling down the slope. Small steps buy precision and pay for it in time.",
  });
  tl.hold(52.6, 0.6);

  // — Beat 4 · cosine decay: sprint, then settle ——————————————————————————
  tl.caption({
    at: 53.2,
    dur: 6.2,
    text: 'The cosine schedule takes both halves of the bargain: open at the high rate to travel, then decay so the noise floor falls with you.',
  });
  tl.tween(coU, 1, { at: 54.0, dur: 0.5, ease: ease.pop });
  tl.tween(dialU, 1, { at: 54.0, dur: 0.6, ease: ease.enter });
  tl.tween(coProg, 1, { at: 54.5, dur: 9.5, ease: ease.linear });
  tl.caption({
    at: 59.7,
    dur: 6.0,
    text: 'Same start, same noise. It sprints like the high run, then settles like the low one — and lands closer than either.',
  });
  tl.caption({
    at: 66.0,
    dur: 6.6,
    text: 'The averaged final losses tell the story: about six hundredths for high, one hundredth for low, and under five thousandths for the cosine glide.',
  });
  tl.tween(statU, 1, { at: 66.6, dur: 0.8, ease: ease.enter });
  tl.hold(72.6, 0.7);

  // — Beat 5 · warmup vs a cold start on the steep rim ————————————————————
  tl.tween(mainFade, 0.12, { at: 73.3, dur: 1.2, ease: ease.move });
  tl.tween(ballU, 0, { at: 73.3, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RIM, { at: 73.3, dur: 2.0, ease: ease.move });
  tl.caption({
    at: 73.8,
    dur: 6.6,
    text: "One honest wrinkle remains. Out on the steep rim of the bowl, opening at a huge rate from a cold start doesn't converge at all — it explodes.",
  });
  tl.tween(coldU, 1, { at: 75.6, dur: 0.5, ease: ease.pop });
  tl.tween(etaTexU, 1, { at: 75.6, dur: 0.7, ease: ease.enter });
  tl.tween(coldProg, 1, { at: 76.4, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 80.8,
    dur: 6.8,
    text: 'A few warmup steps fix it: ramp the rate up gently while you cross the steep ground, then run at full speed. Same peak rate, opposite fate.',
  });
  tl.tween(warmU, 1, { at: 81.6, dur: 0.5, ease: ease.pop });
  tl.tween(warmProg, 1, { at: 82.2, dur: 4.6, ease: ease.linear });
  tl.hold(87.8, 0.6);

  // — Beat 6 · recap ———————————————————————————————————————————————————————
  tl.tween(coldU, 0.12, { at: 88.4, dur: 1.0, ease: ease.move });
  tl.tween(warmU, 0.12, { at: 88.4, dur: 1.0, ease: ease.move });
  tl.tween(etaTexU, 0, { at: 88.4, dur: 0.8, ease: ease.move });
  tl.tween(statU, 0, { at: 88.4, dur: 0.8, ease: ease.move });
  tl.tween(lossPanelU, 0.12, { at: 88.4, dur: 1.0, ease: ease.move });
  tl.tween(schedPanelU, 0.12, { at: 88.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 88.4, dur: 2.0, ease: ease.move });
  tl.tween(endU, 1, { at: 89.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 89.8,
    dur: 6.6,
    text: "That's the whole craft of a schedule: big steps to travel, small steps to land — and a gentle start so you survive the beginning.",
  });
  tl.hold(96.4, 1.2);

  return {
    tl,
    cam,
    contourU,
    schedPanelU,
    schedU,
    cosTexU,
    startU,
    lossPanelU,
    hiU,
    hiProg,
    ballU,
    loU,
    loProg,
    coU,
    coProg,
    dialU,
    statU,
    mainFade,
    coldU,
    coldProg,
    warmU,
    warmProg,
    etaTexU,
    endU,
  };
}
