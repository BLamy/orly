import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Three Ways Evals Die — saturation, leakage, ecosystem Goodhart.
 *
 * Real computation at module scope: a 300-item benchmark with difficulties
 * drawn from a seeded normal; a model's expected score is the mean logistic
 * of ability minus difficulty. Two models half a point of ability apart are
 * 13.3 points apart mid-curve — and 0.7 points apart near the ceiling.
 * The leakage and Goodhart beats carry the sourced public record:
 * BIG-bench canary strings, n-gram overlap audits, and SWE-bench+'s finding
 * that 32.7% of screened passing patches had the solution leaked in the
 * issue text (Aleithan et al., 2024).
 */

const rand = mulberry32(11);
const g = gaussian(rand);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));

export const ITEMS: number[] = Array.from({ length: 300 }, () => g());
export const score = (a: number): number => ITEMS.reduce((s, b) => s + sig(1.7 * (a - b)), 0) / ITEMS.length;

export const A_MIN = -2.2;
export const A_MAX = 4.2;
export const N_PLOT = 160;
export const CURVE: number[] = Array.from({ length: N_PLOT }, (_, i) => score(A_MIN + ((A_MAX - A_MIN) * i) / (N_PLOT - 1)));

// The two probe models: B is always 0.5 ability ahead of A.
export const GAP_MID = 100 * (score(0.0) - score(-0.5)); // 13.3 pts at mid-curve
export const GAP_CEIL = 100 * (score(4.0) - score(3.5)); // 0.7 pts near ceiling

// Leaked-question dots for the leakage beat (positions seeded, drift precomputed)
const rand2 = mulberry32(31);
export const LEAK_DOTS: { x0: number; y0: number; dy: number }[] = Array.from({ length: 26 }, () => ({
  x0: 180 + rand2() * 380,
  y0: 170 + rand2() * 180,
  dy: 240 + rand2() * 90,
}));

// Stage mapping for the ability→score curve
export const PX0 = 170;
export const PX1 = 1110;
export const PY0 = 560;
export const PY1 = 150;
export const px = (a: number): number => PX0 + ((a - A_MIN) / (A_MAX - A_MIN)) * (PX1 - PX0);
export const py = (v: number): number => PY0 + v * (PY1 - PY0); // v in 0..1

export const CAM_MID: CameraState = { x: 470, y: 380, k: 1.25 };
export const CAM_CEILING: CameraState = { x: 950, y: 250, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  curveU: ChannelRef<number>;
  probeA: ChannelRef<number>; // ability of model A (B = A + 0.5)
  probeU: ChannelRef<number>;
  leakStageU: ChannelRef<number>; // swap to the leakage stage
  leakDriftU: ChannelRef<number>;
  canaryU: ChannelRef<number>;
  goodU: ChannelRef<number>; // the Goodhart / leaderboard panel
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const curveU = tl.channel('curveU', 0);
  const probeA = tl.channel('probeA', -0.5);
  const probeU = tl.channel('probeU', 0);
  const leakStageU = tl.channel('leakStageU', 0);
  const leakDriftU = tl.channel('leakDriftU', 0);
  const canaryU = tl.channel('canaryU', 0);
  const goodU = tl.channel('goodU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Death 1 · saturation ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Evals die three ways, and each death has a signature. The first is saturation. Here is a three hundred question benchmark we actually computed: model ability along the bottom, expected score up the side.',
  });
  tl.tween(curveU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.1,
    dur: 5.6,
    text: 'Take two models, a fixed half point of ability apart, and slide them up the curve. Mid-curve, that half point shows up as thirteen points of score. The benchmark is doing its job: real differences make visible gaps.',
  });
  tl.tween(cam, CAM_MID, { at: 6.3, dur: 1.5, ease: ease.move });
  tl.tween(probeU, 1, { at: 6.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 12.1,
    dur: 5.8,
    text: 'Now let both models improve. Same half point between them — but near the ceiling it shows up as zero point seven points of score, smaller than run-to-run noise. The benchmark did not become wrong. It became deaf.',
  });
  tl.tween(cam, CAM_CEILING, { at: 12.4, dur: 2.0, ease: ease.move });
  tl.tween(probeA, 3.5, { at: 12.6, dur: 3.4, ease: ease.move });
  tl.hold(18.1, 0.7);

  // — Death 2 · leakage ————————————————————————————————————————————————
  tl.caption({
    at: 18.8,
    dur: 5.4,
    text: 'The second death is leakage. Book seventeen showed you the mechanism on a toy model — a test question inside the training set measures memory, not skill. The longitudinal version is worse: it happens by default.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.0, dur: 1.4, ease: ease.move });
  tl.tween(leakStageU, 1, { at: 19.4, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 24.4,
    dur: 5.6,
    text: 'A public test set is a file on the internet, and the internet is next year’s training data. Watch the questions drift into the corpus. No one cheated. The crawl simply does not know what a test set is.',
  });
  tl.tween(leakDriftU, 1, { at: 25.0, dur: 3.2, ease: ease.move });
  tl.caption({
    at: 30.2,
    dur: 5.8,
    text: 'The defenses are longitudinal too. Big Bench planted a canary — a unique marker string in every file, so trainers can filter it and auditors can probe for it. And overlap audits grep training corpora for test questions, n gram by n gram.',
  });
  tl.tween(canaryU, 1, { at: 30.8, dur: 1.0, ease: ease.enter });
  tl.hold(36.2, 0.7);

  // — Death 3 · ecosystem Goodhart ——————————————————————————————————————
  tl.caption({
    at: 36.9,
    dur: 5.6,
    text: 'The third death is Goodhart at the scale of a whole field. No gradient ascent required — labs choose architectures, data mixes, and agent scaffolds by what moves the leaderboard. The benchmark becomes the target.',
  });
  tl.tween(leakStageU, 0, { at: 37.1, dur: 1.0, ease: ease.move });
  tl.tween(canaryU, 0, { at: 37.1, dur: 0.8, ease: ease.move });
  tl.tween(goodU, 1, { at: 38.1, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 42.7,
    dur: 6.0,
    text: 'The swee bench plus audit made this concrete: of the passing patches they screened, thirty two point seven percent had the solution sitting in the issue text or its comments. The models had learned to find answers, which is a skill — just not the one on the label.',
  });
  tl.hold(48.9, 0.7);

  // — Close ————————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 49.6, dur: 1.1, ease: ease.move });
  tl.tween(goodU, 0, { at: 49.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.8,
    dur: 5.6,
    text: 'Saturation makes a benchmark deaf, leakage makes it a memory test, and Goodhart makes it a target. Any one of the three ends its useful life. Next: a benchmark that hit all three, and got repaired in public.',
  });
  tl.hold(56.6, 1.2);

  return { tl, cam, curveU, probeA, probeU, leakStageU, leakDriftU, canaryU, goodU, dimU, endU };
}
