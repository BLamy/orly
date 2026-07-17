import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * MCMC — sampling your way into a posterior.
 *
 * A real Metropolis chain, run at module scope: 6000 steps on a banana-
 * shaped 2-D log-posterior, Gaussian proposals of width 0.9, started far
 * off in the tail at (−2.5, 2.2). Computed facts the narration uses: the
 * acceptance rate is ≈ 0.448 ("about forty five percent"), the first ~1000
 * steps are burn-in, and the post-burn-in histogram of x matches the
 * target's marginal (mean ≈ −0.04, sd ≈ 1.78 against a true sd of 2).
 */

export const LOGP = (x: number, y: number): number => {
  const b = 1.2;
  return -0.5 * ((x * x) / 4) - (0.5 * (y - b * ((x * x) / 4 - 1)) ** 2) / 0.3;
};
export const DENS = (x: number, y: number): number => Math.exp(LOGP(x, y));

export const STEP = 0.9;
export const N_STEPS = 6000;
export const BURN = 1000;
export const START: [number, number] = [-2.5, 2.2];

export interface ChainPt {
  x: number;
  y: number;
  accepted: boolean;
}

export const CHAIN: ChainPt[] = (() => {
  const rand = mulberry32(5);
  const g = gaussian(rand);
  let [x, y] = START;
  const out: ChainPt[] = [{ x, y, accepted: true }];
  for (let t = 0; t < N_STEPS; t++) {
    const nx = x + STEP * g();
    const ny = y + STEP * g();
    const ok = Math.log(rand() + 1e-12) < LOGP(nx, ny) - LOGP(x, y);
    if (ok) {
      x = nx;
      y = ny;
    }
    out.push({ x, y, accepted: ok });
  }
  return out;
})();

export const ACC_RATE: number =
  CHAIN.slice(1).filter((p) => p.accepted).length / N_STEPS; // ≈ 0.44

export const POST_MEAN_X: number =
  CHAIN.slice(BURN).reduce((s, p) => s + p.x, 0) / (CHAIN.length - BURN); // ≈ −0.06

/** histogram of x over time: HIST[c][bin], checkpoints every 100 steps */
export const N_BINS = 24;
export const BIN_X0 = -4.8;
export const BIN_X1 = 4.8;
export const CHECK_EVERY = 100;
export const HIST: number[][] = (() => {
  const checks: number[][] = [];
  const counts = new Array(N_BINS).fill(0);
  let seen = 0;
  for (let t = 0; t < CHAIN.length; t++) {
    if (t >= BURN) {
      const b = Math.floor(((CHAIN[t].x - BIN_X0) / (BIN_X1 - BIN_X0)) * N_BINS);
      if (b >= 0 && b < N_BINS) counts[b]++;
      seen++;
    }
    if (t % CHECK_EVERY === 0) checks.push(counts.map((c) => (seen ? c / seen : 0)));
  }
  checks.push(counts.map((c) => c / seen));
  return checks;
})();

/** the true marginal of x (unnormalized N(0,2) — y integrates out) */
export const TRUE_MARGINAL = (x: number): number => Math.exp(-0.5 * ((x * x) / 4));

/** pure lookups for playback */
const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function chainAt(t: number): { x: number; y: number } {
  const f = clampN(t, 0, CHAIN.length - 1);
  const i = Math.floor(f);
  if (i >= CHAIN.length - 1) return CHAIN[CHAIN.length - 1];
  const u = f - i;
  return {
    x: CHAIN[i].x + (CHAIN[i + 1].x - CHAIN[i].x) * u,
    y: CHAIN[i].y + (CHAIN[i + 1].y - CHAIN[i].y) * u,
  };
}
export function histAt(t: number): number[] {
  const c = clampN(t / CHECK_EVERY, 0, HIST.length - 1);
  const i = Math.floor(c);
  if (i >= HIST.length - 1) return HIST[HIST.length - 1];
  const u = c - i;
  return HIST[i].map((v, b) => v + (HIST[i + 1][b] - v) * u);
}

// ---------------------------------------------------------------------------
// Layout: posterior plane left, marginal histogram right
// ---------------------------------------------------------------------------
export const px: ScaleLinear<number, number> = scaleLinear().domain([-4.2, 4.2]).range([90, 810]);
export const py: ScaleLinear<number, number> = scaleLinear().domain([-2.6, 3.4]).range([620, 105]);
export const hx: ScaleLinear<number, number> = scaleLinear().domain([BIN_X0, BIN_X1]).range([880, 1200]);
export const hy: ScaleLinear<number, number> = scaleLinear().domain([0, 0.16]).range([560, 220]);

export const CAM_START: CameraState = { x: px(START[0]), y: py(START[1]), k: 1.5 };
export const CAM_PLANE: CameraState = { x: 450, y: 360, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  fieldU: ChannelRef<number>;
  walkerU: ChannelRef<number>;
  t: ChannelRef<number>; // chain time
  trailN: ChannelRef<number>; // how much trail to show
  propU: ChannelRef<number>;
  burnU: ChannelRef<number>;
  histU: ChannelRef<number>;
  trueU: ChannelRef<number>;
  statU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const walkerU = tl.channel('walkerU', 0);
  const t = tl.channel('t', 0);
  const trailN = tl.channel('trailN', 300);
  const propU = tl.channel('propU', 0);
  const burnU = tl.channel('burnU', 0);
  const histU = tl.channel('histU', 0);
  const trueU = tl.channel('trueU', 0);
  const statU = tl.channel('statU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the posterior with no formula ————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Sooner or later you meet a posterior with no formula — you can compute how plausible any single point is, but not the shape of the whole thing.',
  });
  tl.tween(fieldU, 1, { at: 0.6, dur: 2.8, ease: ease.draw });
  tl.tween(cam, CAM_PLANE, { at: 0.9, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'Markov chain Monte Carlo is the workaround: release a walker onto the landscape and let it wander by a rule that favors the plausible.',
  });
  tl.tween(walkerU, 1, { at: 7.5, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_START, { at: 7.3, dur: 1.8, ease: ease.move });

  // — Beat 2 · the Metropolis rule ——————————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 6.4,
    text: 'The rule is Metropolis: propose a random hop. Uphill, always accept. Downhill, accept with probability equal to the ratio of plausibilities. Otherwise stay put.',
    tex: 'a = \\min\\!\\left(1, \\tfrac{p(\\theta\')}{p(\\theta)}\\right)',
  });
  tl.tween(propU, 1, { at: 12.9, dur: 0.9, ease: ease.enter });
  tl.tween(t, 60, { at: 13.3, dur: 4.6, ease: ease.linear });

  tl.caption({
    at: 19.1,
    dur: 5.6,
    text: 'Watch the first thousand steps. The walker starts far in the tail, and this early stretch — the burn in — only records its journey home. Throw it away.',
  });
  tl.tween(cam, CAM_PLANE, { at: 19.5, dur: 1.8, ease: ease.move });
  tl.tween(t, 1000, { at: 19.5, dur: 4.8, ease: ease.linear });
  tl.tween(burnU, 1, { at: 22.9, dur: 0.9, ease: ease.enter });

  // — Beat 3 · mixing + the histogram ———————————————————————————————————
  tl.caption({
    at: 25.3,
    dur: 6.0,
    text: 'After that, the walker mixes: it hugs the banana, crossing and recrossing it. Every step is one more vote in the histogram building on the right.',
  });
  // Pull back to the full stage: the histogram (x 880–1200) and its labels are
  // the subject from here on — CAM_PLANE (x 450, k 1.15) clips them past the
  // right edge by ~220px.
  tl.tween(cam, CAMERA_HOME, { at: 25.5, dur: 1.8, ease: ease.move });
  tl.tween(histU, 1, { at: 25.9, dur: 0.9, ease: ease.enter });
  tl.tween(t, 3000, { at: 25.7, dur: 5.4, ease: ease.linear });

  tl.caption({
    at: 31.7,
    dur: 5.8,
    text: 'Six thousand steps in, the tally is honest: about forty five percent of proposals were accepted, and the pile of visits matches the true marginal curve.',
  });
  tl.tween(t, 6000, { at: 31.9, dur: 5.0, ease: ease.linear });
  tl.tween(trueU, 1, { at: 35.3, dur: 1.2, ease: ease.draw });
  tl.tween(statU, 1, { at: 35.9, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 37.9,
    dur: 5.6,
    text: 'That is the whole magic: the chain visits each region in proportion to its probability. Time spent becomes probability mass.',
  });

  // — Beat 4 · honesty about the knobs ——————————————————————————————————
  tl.caption({
    at: 43.9,
    dur: 6.2,
    text: 'The craft is in the knobs. Hops too small and the chain crawls; too large and almost everything is rejected. Half-ish acceptance is the sweet spot for this walker.',
  });

  tl.caption({
    at: 50.5,
    dur: 5.6,
    text: 'And one chain can lie — it may have found only one basin. Practitioners run several chains from different starts and demand they agree.',
  });

  tl.caption({
    at: 56.5,
    dur: 5.4,
    text: 'No formula, no problem: wander wisely, discard the road in, and count where you slept. That is Monte Carlo inference.',
  });
  tl.tween(closeU, 1, { at: 56.9, dur: 0.9, ease: ease.enter });
  tl.hold(61.9, 1.4);

  return { tl, cam, fieldU, walkerU, t, trailN, propU, burnU, histU, trueU, statU, closeU };
}
