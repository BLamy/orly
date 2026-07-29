import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * What Filtering Saves — the same loop, plus one reality check.
 *
 * Exact same recursion as the collapse chapter (seed 25, 50 samples, 30
 * generations), with ONE change: before a sample enters the training set, a
 * verifier anchored to reality gets a veto — a sample is accepted with
 * probability proportional to how plausible it is under the TRUE
 * distribution relative to the model (rejection correction toward truth).
 *
 * Measured at module scope, same seed, both runs:
 *   unfiltered: spread 1.00 → 0.24, mean drifts to +0.46
 *   filtered:   spread wobbles (dips to 0.68 mid-run — the filter is not
 *               magic) but is dragged home: 0.96 at generation 30, mean 0.13.
 * The filter is this book's bridge to verifiable rewards: what saves the
 * loop is not better generation — it is a check that consults reality.
 */

export const M = 50;
export const GENS = 30;
export interface Gen {
  mu: number;
  sd: number;
}
function runLoop(filtered: boolean): Gen[] {
  const rand = mulberry32(25);
  const g = gaussian(rand);
  const phi = (x: number, m: number, s: number): number =>
    Math.exp(-((x - m) ** 2) / (2 * s * s)) / s;
  let mu = 0;
  let sd = 1;
  const hist: Gen[] = [{ mu, sd }];
  for (let gen = 1; gen <= GENS; gen++) {
    const xs: number[] = [];
    let guard = 0;
    while (xs.length < M && guard < 100000) {
      guard++;
      const x = mu + sd * g();
      if (filtered) {
        const acc = Math.min(1, phi(x, 0, 1) / phi(x, mu, sd));
        if (rand() >= acc) continue;
      }
      xs.push(x);
    }
    const m = xs.reduce((a, b) => a + b, 0) / M;
    const v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / M;
    mu = m;
    sd = Math.sqrt(v);
    hist.push({ mu, sd });
  }
  return hist;
}
export const RAW: Gen[] = runLoop(false);
export const FILT: Gen[] = runLoop(true);
export const RAW_FINAL = RAW[GENS];
export const FILT_FINAL = FILT[GENS];
export const FILT_MIN = Math.min(...FILT.map((h) => h.sd));

export function genAt(run: Gen[], u: number): Gen {
  const s = Math.max(0, Math.min(GENS, u));
  const i = Math.floor(s);
  const j = Math.min(GENS, i + 1);
  const f = s - i;
  return {
    mu: run[i].mu + f * (run[j].mu - run[i].mu),
    sd: run[i].sd + f * (run[j].sd - run[i].sd),
  };
}

export const gauss = (x: number, mu: number, sd: number): number =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));

// showcase: a handful of candidate samples and their acceptance fates at gen 1
export const GATE_DEMO: { x: number; acc: boolean }[] = (() => {
  const rand = mulberry32(77);
  const g = gaussian(rand);
  // model slightly narrowed/off (like gen ~4): mu 0.2, sd 0.8
  const mu = 0.2;
  const sd = 0.8;
  const phi = (x: number, m: number, s: number): number =>
    Math.exp(-((x - m) ** 2) / (2 * s * s)) / s;
  return Array.from({ length: 9 }, () => {
    const x = mu + sd * g();
    const acc = rand() < Math.min(1, phi(x, 0, 1) / phi(x, mu, sd));
    return { x: Math.round(x * 100) / 100, acc };
  });
})();

// ---------------------------------------------------------------------------
// Layout — gate demo top-left, twin sd chart right, curves bottom-left.
// ---------------------------------------------------------------------------

export const GATE_X = 260;
export const GATE_Y0 = 120;

export const DIST_X0 = 90;
export const DIST_X1 = 620;
export const DIST_Y0 = 560;
export const DIST_H = 210;
export const dx = (x: number): number => DIST_X0 + ((x + 3.2) / 6.4) * (DIST_X1 - DIST_X0);
export const dy = (p: number): number => DIST_Y0 - p * DIST_H * 1.05;

export const CH_X0 = 720;
export const CH_X1 = 1180;
export const CH_Y0 = 480;
export const CH_H = 320;
export const chX = (gen: number): number => CH_X0 + (gen / GENS) * (CH_X1 - CH_X0);
export const chY = (sd: number): number => CH_Y0 - sd * CH_H;

export const CAM_GATE: CameraState = { x: 350, y: 260, k: 1.25 };
export const CAM_CHART: CameraState = { x: 900, y: 320, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gateU: ChannelRef<number>; // gate + demo samples
  axU: ChannelRef<number>;
  rawGen: ChannelRef<number>; // unfiltered sweep (replay, dimmed)
  filtGen: ChannelRef<number>; // filtered sweep
  curveU: ChannelRef<number>; // final-curves comparison
  bridgeU: ChannelRef<number>; // RLVR bridge banner
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gateU = tl.channel('gateU', 0);
  const axU = tl.channel('axU', 0);
  const rawGen = tl.channel('rawGen', 0);
  const filtGen = tl.channel('filtGen', 0);
  const curveU = tl.channel('curveU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · one new part —————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'The collapse had one root cause: nothing in the loop ever consulted reality. So add exactly one part — a filter between generate and retrain. A sample only enters the training set if a check grounded in the real world accepts it.',
  });
  tl.tween(cam, CAM_GATE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(gateU, 1, { at: 1.6, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'Watch it work on real candidates. Samples the model over-produces — the ones crowding its too-narrow center — get rejected more often. Samples reality likes get through. The filter is a thumb on the scale, pressing the data back toward the truth.',
  });
  tl.hold(12.1, 0.6);

  // — Beat 2 · rerun the thirty generations —————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 12.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 5.0,
    text: 'Now the experiment: same seed, same fifty samples per generation, same thirty turns of the crank. First, replay yesterday’s disaster — the unfiltered run, collapsing to a quarter of its spread.',
  });
  tl.tween(axU, 1, { at: 13.7, dur: 1.2, ease: ease.draw });
  tl.tween(rawGen, GENS, { at: 17.1, dur: 4.0, ease: ease.move });
  tl.caption({
    at: 18.5,
    dur: 5.4,
    text: 'Now the filtered run. It is not magic — with only fifty samples the spread still wobbles, dipping to zero point six eight mid-run. But every generation, the filter drags the distribution back toward reality.',
  });
  tl.tween(filtGen, GENS, { at: 19.5, dur: 5.5, ease: ease.move });
  tl.caption({
    at: 24.3,
    dur: 5.0,
    text: 'Generation thirty: the unfiltered model sits at zero point two four. The filtered one is back at zero point nine six, mean nearly centered. Same generator, same seed — one veto made the difference between decay and stability.',
  });
  tl.hold(29.5, 0.6);

  // — Beat 3 · the final shapes —————————————————————————————————————————
  tl.caption({
    at: 30.1,
    dur: 5.0,
    text: 'Side by side after thirty generations: the starved spike of the unfiltered loop, and the filtered curve still hugging the truth it was never directly shown.',
  });
  tl.tween(curveU, 1, { at: 30.9, dur: 1.5, ease: ease.draw });
  tl.hold(35.3, 0.6);

  // — Beat 4 · the bridge ———————————————————————————————————————————————
  tl.caption({
    at: 35.9,
    dur: 5.8,
    text: 'Recognize this filter. It is the verifier from the verifiable rewards book wearing a different hat: an executable check, harder to fool than the generator, sitting between proposals and consequences. There, it guarded the gradient. Here, it guards the gene pool.',
  });
  tl.tween(bridgeU, 1, { at: 37.3, dur: 1.0, ease: ease.enter });
  tl.hold(41.9, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 44.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.3,
    dur: 5.2,
    text: 'Synthetic data does not fail because it is synthetic. It fails when nothing separates good samples from bad ones. Next: put that principle to work — a loop that keeps only verified reasoning and provably teaches itself.',
  });
  tl.hold(49.7, 1.2);

  return { tl, cam, gateU, axU, rawGen, filtGen, curveU, bridgeU, dimU, endU };
}
