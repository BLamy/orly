import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Goodhart's Law on Benchmarks — optimize the proxy, lose the target.
 *
 * A real optimization run at module scope. True quality is a bump centered
 * at θ = 1: T(θ) = exp(−(θ−1)²). The benchmark is a proxy with an exploitable
 * flaw: P(θ) = T(θ) + 3/(1 + e^{−1.8(θ−2.2)}) — the flaw pays more the
 * harder you lean on it. We run 400 steps of real gradient ascent ON THE
 * PROXY and record both curves. Measured: the proxy climbs monotonically
 * (0.13 → 2.69) and never confesses; true quality rides along, peaks at
 * 1.000 around step 104, then collapses to 0.003. The benchmark's best score
 * is the target's worst.
 */

export const T_TRUE = (x: number): number => Math.exp(-((x - 1) ** 2));
export const EXPLOIT = (x: number): number => 3.0 / (1 + Math.exp(-1.8 * (x - 2.2)));
export const PROXY = (x: number): number => T_TRUE(x) + EXPLOIT(x);

export const N_STEPS = 400;
export interface Pt {
  th: number;
  t: number;
  p: number;
}
export const PATH: Pt[] = (() => {
  let th = -0.5;
  const out: Pt[] = [{ th, t: T_TRUE(th), p: PROXY(th) }];
  for (let i = 0; i < N_STEPS; i++) {
    const d = (PROXY(th + 1e-4) - PROXY(th - 1e-4)) / 2e-4;
    th += 0.02 * d;
    out.push({ th, t: T_TRUE(th), p: PROXY(th) });
  }
  return out;
})();

export const PEAK_STEP = PATH.reduce((best, q, i) => (q.t > PATH[best].t ? i : best), 0); // ≈104
export const FINAL = PATH[N_STEPS]; // proxy 2.69, true 0.003

/** Interpolate the recorded path at fractional step. */
export function pathAt(u: number): Pt {
  const f = Math.max(0, Math.min(N_STEPS, u));
  const i = Math.floor(f);
  const t = f - i;
  const a = PATH[i];
  const b = PATH[Math.min(N_STEPS, i + 1)];
  return { th: a.th + (b.th - a.th) * t, t: a.t + (b.t - a.t) * t, p: a.p + (b.p - a.p) * t };
}

// ---------------------------------------------------------------------------
// Stage layout — the landscape left, the two score curves right.
// ---------------------------------------------------------------------------

export const TH_MIN = -1;
export const TH_MAX = 4;
export const LAND_X0 = 100;
export const LAND_X1 = 640;
export const LAND_Y0 = 470; // baseline
export const LAND_AMP = 110;
export const lx = (th: number): number => LAND_X0 + ((th - TH_MIN) / (TH_MAX - TH_MIN)) * (LAND_X1 - LAND_X0);
export const ly = (v: number): number => LAND_Y0 - v * LAND_AMP;

export const N_LAND = 160;
export const LAND_TRUE: number[] = Array.from({ length: N_LAND }, (_, i) =>
  T_TRUE(TH_MIN + ((TH_MAX - TH_MIN) * i) / (N_LAND - 1)),
);
export const LAND_PROXY: number[] = Array.from({ length: N_LAND }, (_, i) =>
  PROXY(TH_MIN + ((TH_MAX - TH_MIN) * i) / (N_LAND - 1)),
);

export const CH_X0 = 740;
export const CH_X1 = 1180;
export const CH_Y0 = 470;
export const CH_AMP = 110;
export const cx = (step: number): number => CH_X0 + (step / N_STEPS) * (CH_X1 - CH_X0);
export const cy = (v: number): number => CH_Y0 - v * CH_AMP;

export const CAM_LAND: CameraState = { x: 420, y: 330, k: 1.25 };
export const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  trueU: ChannelRef<number>; // true landscape draw-on
  proxyU: ChannelRef<number>; // proxy landscape draw-on
  flawU: ChannelRef<number>; // highlight the exploit region
  runP: ChannelRef<number>; // optimization progress 0..N_STEPS
  chartU: ChannelRef<number>; // the two score curves panel
  peakU: ChannelRef<number>; // mark the true peak moment
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const trueU = tl.channel('trueU', 0);
  const proxyU = tl.channel('proxyU', 0);
  const flawU = tl.channel('flawU', 0);
  const runP = tl.channel('runP', 0);
  const chartU = tl.channel('chartU', 0);
  const peakU = tl.channel('peakU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · target vs proxy —————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'What you want from a model is quality. What you can measure is a benchmark. Here is the quality you actually care about — a peak, and a place where it lives.',
  });
  tl.tween(trueU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_LAND, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 5.8,
    text: 'And here is the benchmark. Near the peak it tracks quality faithfully — that is why we trust it. But every proxy has a flaw somewhere, and this one pays out for a behavior that quality does not.',
  });
  tl.tween(proxyU, 1, { at: 6.9, dur: 1.8, ease: ease.draw });
  tl.tween(flawU, 1, { at: 10.1, dur: 1.0, ease: ease.enter });
  tl.hold(12.4, 0.6);

  // — Beat 2 · optimize the proxy ———————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.tween(chartU, 1, { at: 13.6, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 13.8,
    dur: 5.6,
    text: 'Now do what every leaderboard incentivizes: climb the benchmark. Four hundred real gradient steps on the proxy, nothing else. On the right, both scores, recorded live.',
  });
  tl.tween(runP, PEAK_STEP, { at: 15.0, dur: 5.0, ease: ease.linear });
  tl.caption({
    at: 19.9,
    dur: 5.2,
    text: 'At first, Goodhart is quiet. The benchmark rises, and true quality rises with it — around step one hundred the model is genuinely at its best. This is the era when the metric deserves its reputation.',
  });
  tl.tween(peakU, 1, { at: 22.2, dur: 0.7, ease: ease.pop });
  tl.hold(25.3, 0.5);

  // — Beat 3 · the divergence ——————————————————————————————————————————
  tl.caption({
    at: 25.8,
    dur: 5.8,
    text: 'But the climb does not stop at the peak, because the proxy does not have a peak there. The optimizer discovers the flaw, and the two curves let go of each other. Watch.',
  });
  tl.tween(runP, N_STEPS, { at: 26.6, dur: 7.5, ease: ease.linear });
  tl.caption({
    at: 31.8,
    dur: 5.4,
    text: 'The benchmark ends at its all-time high: two point seven, still climbing, thoroughly pleased. True quality is at zero point zero zero three. The number went up. The thing it stood for went away.',
  });
  tl.hold(37.4, 0.6);

  // — Beat 4 · name the law ————————————————————————————————————————————
  tl.caption({
    at: 38.0,
    dur: 5.6,
    text: 'That is Goodhart law: when a measure becomes a target, it ceases to be a good measure. Not because anyone cheated — because optimization pressure flows to wherever the measure and the goal disagree.',
    tex: '\\nabla_\\theta\\, \\text{proxy} \\;\\ne\\; \\nabla_\\theta\\, \\text{quality}',
  });
  tl.tween(mathU, 1, { at: 38.8, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 43.9,
    dur: 5.0,
    text: 'And notice the cruelest part: the benchmark cannot see its own failure. Every signal available to the optimizer says things are going wonderfully.',
  });
  tl.hold(49.1, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 49.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 50.3, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 50.3, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 51.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.5,
    dur: 5.8,
    text: 'A benchmark is a proxy, and proxies wear out under pressure — the harder the field optimizes one, the less it means. The honest response is not a better single number. It is fresh tests, held out and hostile.',
  });
  tl.hold(57.5, 1.2);

  return { tl, cam, trueU, proxyU, flawU, runP, chartU, peakU, mathU, dimU, endU };
}
