import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Expensive Claim — what honest evaluation looks like.
 *
 * Closing chapter: "the metric went up" must survive attack before it means
 * anything. The three attack stations run REAL miniatures of this book's
 * experiments, recomputed at module scope:
 *  1. RESAMPLE — 1000 paired reruns of a 100-question benchmark with true
 *     skills 0.70 vs 0.71 (seeded Bernoulli): the +1 "win" reverses in ~48%
 *     of reruns.
 *  2. FRESH QUESTIONS — the memorizer's gap, recomputed: leaked-benchmark
 *     error 0.000 vs fresh-question error 3.74 (degree-11 interpolation of
 *     12 points, normal equations).
 *  3. PRESSURE — 400 gradient steps on a flawed proxy: proxy 0.13 → 2.69
 *     while true quality ends at 0.003.
 * A claim card travels the gauntlet; each station stamps it with the number
 * that survives.
 */

// — Station 1: resampling —
const rand = mulberry32(41);
const binom = (n: number, p: number): number => {
  let k = 0;
  for (let i = 0; i < n; i++) if (rand() < p) k++;
  return k;
};
export const REVERSALS: number = (() => {
  let worse = 0;
  for (let i = 0; i < 1000; i++) if (binom(100, 0.71) <= binom(100, 0.7)) worse++;
  return worse / 1000; // ≈ 0.48
})();

// — Station 2: fresh questions (the memorizer, in miniature) —
const g2 = gaussian(mulberry32(6));
const f = (x: number): number => Math.sin(1.7 * x);
const XT = Array.from({ length: 12 }, (_, i) => -2 + (4 * i) / 11);
const YT = XT.map((x) => f(x) + 0.15 * g2());
function polyfit(X: number[], Y: number[], deg: number): number[] {
  const n = deg + 1;
  const A = X.map((x) => Array.from({ length: n }, (_, k) => x ** k));
  const M = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) for (let p = 0; p < X.length; p++) M[i][j] += A[p][i] * A[p][j];
    for (let p = 0; p < X.length; p++) M[i][n] += A[p][i] * Y[p];
  }
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let rw = c + 1; rw < n; rw++) if (Math.abs(M[rw][c]) > Math.abs(M[piv][c])) piv = rw;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let rw = 0; rw < n; rw++) {
      if (rw === c) continue;
      const k = M[rw][c] / M[c][c];
      for (let j = c; j <= n; j++) M[rw][j] -= k * M[c][j];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}
const C11 = polyfit(XT, YT, 11);
const evalp = (c: number[], x: number): number => c.reduce((a, ci, i) => a + ci * x ** i, 0);
const g3 = gaussian(mulberry32(55));
const XF = Array.from({ length: 24 }, (_, i) => -1.9 + (3.8 * i) / 23);
const YF = XF.map((x) => f(x) + 0.15 * g3());
export const FRESH_ERR: number =
  XF.reduce((a, x, i) => a + (evalp(C11, x) - YF[i]) ** 2, 0) / XF.length; // ≈ 3.74

// — Station 3: pressure (Goodhart, in miniature) —
const T_TRUE = (x: number): number => Math.exp(-((x - 1) ** 2));
const PROXY = (x: number): number => T_TRUE(x) + 3.0 / (1 + Math.exp(-1.8 * (x - 2.2)));
export const PRESSURE: { p: number[]; t: number[] } = (() => {
  let th = -0.5;
  const p: number[] = [PROXY(th)];
  const t: number[] = [T_TRUE(th)];
  for (let i = 0; i < 400; i++) {
    const d = (PROXY(th + 1e-4) - PROXY(th - 1e-4)) / 2e-4;
    th += 0.02 * d;
    if (i % 8 === 0) {
      p.push(PROXY(th));
      t.push(T_TRUE(th));
    }
  }
  return { p, t }; // 51 samples each
})();
export const PRESSURE_FINAL_T = PRESSURE.t[PRESSURE.t.length - 1]; // ≈ 0.003
export const PRESSURE_FINAL_P = PRESSURE.p[PRESSURE.p.length - 1]; // ≈ 2.69

// ---------------------------------------------------------------------------
// Stage layout — a gauntlet rail with three stations.
// ---------------------------------------------------------------------------

export const RAIL_Y = 200;
export const RAIL_X0 = 110;
export const RAIL_X1 = 1170;
export const ST_X = [340, 700, 1060]; // station centers on the rail
export const cardX = (u: number): number => RAIL_X0 + u * (RAIL_X1 - RAIL_X0 - 60);

export const PANEL_Y = 270;
export const PANEL_H = 250;
export const PANEL_W = 320;

export const CAM_ST = (i: number): CameraState => ({ x: ST_X[i], y: 360, k: 1.32 });
export const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  railU: ChannelRef<number>;
  cardU: ChannelRef<number>; // claim card position along the rail 0..1
  st1U: ChannelRef<number>; // station panels
  st2U: ChannelRef<number>;
  st3U: ChannelRef<number>;
  stamp1: ChannelRef<number>; // verdict stamps
  stamp2: ChannelRef<number>;
  stamp3: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const cardU = tl.channel('cardU', 0);
  const st1U = tl.channel('st1U', 0);
  const st2U = tl.channel('st2U', 0);
  const st3U = tl.channel('st3U', 0);
  const stamp1 = tl.channel('stamp1', 0);
  const stamp2 = tl.channel('stamp2', 0);
  const stamp3 = tl.channel('stamp3', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the claim ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'This book ends with its thesis. In evaluation there are cheap claims and expensive ones. It might be broken is cheap — worst case, you look and it is fine. The metric went up is expensive.',
  });
  tl.tween(railU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'Expensive claims should have to earn their way through hostile territory. So here is one — plus one point on the benchmark — entering a gauntlet built from everything this book measured.',
  });
  tl.tween(cardU, 0.16, { at: 7.3, dur: 2.0, ease: ease.move });
  tl.hold(11.7, 0.5);

  // — Beat 2 · station one: resample ————————————————————————————————————
  tl.tween(cam, CAM_ST(0), { at: 12.2, dur: 1.5, ease: ease.move });
  tl.tween(cardU, 0.24, { at: 12.4, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: 'Station one attacks with luck. Rerun the hundred-question benchmark a thousand times — really rerun it — and the plus one reverses in forty eight percent of the reruns. Stamp: not significant, on this sample size.',
  });
  tl.tween(st1U, 1, { at: 13.2, dur: 1.2, ease: ease.enter });
  tl.tween(stamp1, 1, { at: 17.0, dur: 0.5, ease: ease.pop });
  tl.hold(18.4, 0.6);

  // — Beat 3 · station two: fresh questions ————————————————————————————
  tl.tween(cam, CAM_ST(1), { at: 19.0, dur: 1.5, ease: ease.move });
  tl.tween(cardU, 0.53, { at: 19.2, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 19.6,
    dur: 5.8,
    text: 'Station two attacks with provenance. Where did the questions come from? On questions the model may have memorized, our memorizer scored perfect; on fresh ones its error was three point seven. The claim must survive questions written after the model was trained.',
  });
  tl.tween(st2U, 1, { at: 20.2, dur: 1.2, ease: ease.enter });
  tl.tween(stamp2, 1, { at: 24.4, dur: 0.5, ease: ease.pop });
  tl.hold(25.8, 0.6);

  // — Beat 4 · station three: pressure ——————————————————————————————————
  tl.tween(cam, CAM_ST(2), { at: 26.4, dur: 1.5, ease: ease.move });
  tl.tween(cardU, 0.86, { at: 26.6, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 27.0,
    dur: 5.8,
    text: 'Station three attacks with time. Any metric a field optimizes hard becomes a proxy under pressure — we watched one climb from zero point one to two point seven while the quality it stood for fell to nothing.',
  });
  tl.tween(st3U, 1, { at: 27.6, dur: 1.2, ease: ease.enter });
  tl.tween(stamp3, 1, { at: 31.6, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 33.0,
    dur: 4.8,
    text: 'So a benchmark’s meaning has a half-life. The stamp here is a question: is this the metric’s honest era, or its gamed one — and what fresh, held-out test would tell you?',
  });
  tl.hold(38.0, 0.6);

  // — Beat 5 · the doctrine ————————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 38.6, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 39.0,
    dur: 5.8,
    text: 'Notice what the gauntlet is. It is not pessimism. Every station is just an evaluation that actively tries to break the claim, instead of passively approving it. Contamination checks, reruns, adversarial refreshes — hostility is the method.',
  });
  tl.hold(44.9, 0.5);
  tl.caption({
    at: 45.4,
    dur: 5.4,
    text: 'The asymmetry to carry out of this book: believe it is broken on a whisper, believe it works only on evidence that survived an attack. A metric that has never been attacked is not evidence yet.',
  });
  tl.tween(dimU, 0.13, { at: 49.2, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.2,
    dur: 5.4,
    text: 'One journey, five chapters: leaked questions, gamed proxies, exaggerated confidence, noisy gains — and finally this. The honest evaluation is the one that wants to catch you.',
  });
  tl.hold(56.8, 1.2);

  return { tl, cam, railU, cardU, st1U, st2U, st3U, stamp1, stamp2, stamp3, dimU, endU };
}
