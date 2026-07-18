import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Randomized Trial — a coin that cuts every backdoor.
 *
 * One simulated drug with a true effect of +0.5 recovery points
 * (recovery = 2 − 2.5·severity + 0.5·treated + noise). Two worlds are
 * really simulated at module scope (2,000 patients each, seed 21):
 * observational, where sicker patients are likelier to take the drug
 * (P = 0.05 + 0.9·severity), and randomized, where a fair coin assigns.
 * Computed verdicts: the observational arm difference is −0.25 (the drug
 * looks harmful); the randomized difference is +0.46, close to the true
 * +0.5.
 */

export const TRUE_EFFECT = 0.5;

export interface Patient {
  s: number; // severity 0..1
  t: 0 | 1;
  y: number; // recovery
}

const rand = mulberry32(21);
const g = gaussian(rand);
const outcome = (s: number, t: number) => 2 - 2.5 * s + TRUE_EFFECT * t + 0.3 * g();

export const N = 2000;
export const OBS: Patient[] = Array.from({ length: N }, () => {
  const s = rand();
  const t = (rand() < 0.05 + 0.9 * s ? 1 : 0) as 0 | 1;
  return { s, t, y: outcome(s, t) };
});
export const RCT: Patient[] = Array.from({ length: N }, () => {
  const s = rand();
  const t = (rand() < 0.5 ? 1 : 0) as 0 | 1;
  return { s, t, y: outcome(s, t) };
});

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
export const OBS_T_MEAN = mean(OBS.filter((p) => p.t === 1).map((p) => p.y));
export const OBS_C_MEAN = mean(OBS.filter((p) => p.t === 0).map((p) => p.y));
export const OBS_DIFF = OBS_T_MEAN - OBS_C_MEAN; // ≈ −0.25
export const RCT_T_MEAN = mean(RCT.filter((p) => p.t === 1).map((p) => p.y));
export const RCT_C_MEAN = mean(RCT.filter((p) => p.t === 0).map((p) => p.y));
export const RCT_DIFF = RCT_T_MEAN - RCT_C_MEAN; // ≈ +0.46

/** mean severity per arm — the imbalance the coin fixes */
export const OBS_SEV_T = mean(OBS.filter((p) => p.t === 1).map((p) => p.s)); // high
export const OBS_SEV_C = mean(OBS.filter((p) => p.t === 0).map((p) => p.s)); // low
export const RCT_SEV_T = mean(RCT.filter((p) => p.t === 1).map((p) => p.s));
export const RCT_SEV_C = mean(RCT.filter((p) => p.t === 0).map((p) => p.s));

/** visible subsamples (first 120 of each world) */
export const OBS_VIS: Patient[] = OBS.slice(0, 120);
export const RCT_VIS: Patient[] = RCT.slice(0, 120);

// layout: observational panel left, randomized right; two arm columns each
export const yScale: ScaleLinear<number, number> = scaleLinear().domain([-1.4, 2.6]).range([600, 170]);
export const PANEL = {
  obs: { x0: 90, cx: 210, tx: 400, w: 480 },
  rct: { x0: 700, cx: 820, tx: 1010, w: 480 },
} as const;
export const JITTER = 60;

export const CAM_OBS: CameraState = { x: 330, y: 360, k: 1.25 };
export const CAM_RCT: CameraState = { x: 940, y: 360, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  obsP: ChannelRef<number>;
  obsBarU: ChannelRef<number>;
  sevU: ChannelRef<number>;
  coinU: ChannelRef<number>;
  rctP: ChannelRef<number>;
  rctBarU: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  priceU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const obsP = tl.channel('obsP', 0);
  const obsBarU = tl.channel('obsBarU', 0);
  const sevU = tl.channel('sevU', 0);
  const coinU = tl.channel('coinU', 0);
  const rctP = tl.channel('rctP', 0);
  const rctBarU = tl.channel('rctBarU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const priceU = tl.channel('priceU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the setup ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'We built a drug that truly works: half a point of extra recovery, wired into the simulation itself. Now watch a study call it harmful.',
  });
  tl.tween(cam, CAM_OBS, { at: 0.9, dur: 2.0, ease: ease.move });
  tl.tween(obsP, 1, { at: 1.3, dur: 3.2, ease: ease.linear });

  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'In the observational world, nobody flips coins. The sicker you are, the likelier you are to take the drug — exactly how real medicine behaves.',
  });
  tl.tween(sevU, 1, { at: 7.7, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'Compare the two arms and the treated patients recover a quarter point less. Two thousand honest measurements, and the sign is wrong.',
  });
  tl.tween(obsBarU, 1, { at: 13.5, dur: 1.2, ease: ease.pop });
  tl.hold(18.9, 0.6);

  // — Beat 2 · why ———————————————————————————————————————————————————————
  tl.caption({
    at: 19.5,
    dur: 5.6,
    text: 'You know the culprit by now: severity flows into both the choice to treat and the outcome. The drug arm was doomed to look bad — it got the sickest patients.',
  });

  tl.caption({
    at: 25.5,
    dur: 5.4,
    text: 'Last chapter we adjusted for the confounder we had measured. But what about the ones we never wrote down? There is a blunter instrument.',
  });

  // — Beat 3 · the coin ——————————————————————————————————————————————————
  tl.caption({
    at: 31.3,
    dur: 6.0,
    text: 'Randomize. Let a fair coin choose who gets the drug. The coin listens to nothing — not severity, not wealth, not the confounders nobody thought of.',
  });
  tl.tween(cam, CAM_RCT, { at: 31.7, dur: 1.8, ease: ease.move });
  tl.tween(coinU, 1, { at: 32.1, dur: 0.9, ease: ease.enter });
  tl.tween(rctP, 1, { at: 32.7, dur: 3.2, ease: ease.linear });

  tl.caption({
    at: 37.7,
    dur: 5.8,
    text: 'Check the arms now: the sickness mix is identical on both sides. Randomization cut every backdoor at once, measured or not.',
  });
  tl.tween(sevU, 1, { at: 38.1, dur: 0.6, ease: ease.enter });

  tl.caption({
    at: 43.9,
    dur: 5.8,
    text: 'And the comparison flips to the truth: plus zero point four six — within noise of the half point we wired in. Same drug, same world, honest answer.',
  });
  tl.tween(rctBarU, 1, { at: 44.5, dur: 1.2, ease: ease.pop });
  tl.tween(verdictU, 1, { at: 45.7, dur: 0.9, ease: ease.enter });
  tl.hold(49.9, 0.6);

  // — Beat 4 · the price ————————————————————————————————————————————————
  tl.caption({
    at: 50.5,
    dur: 6.0,
    text: 'This is why trials are the gold standard — and why the rest of the toolbox exists. Experiments cost money, take years, and are sometimes flatly unethical.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.9, dur: 1.8, ease: ease.move });
  tl.tween(priceU, 1, { at: 51.9, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 56.9,
    dur: 5.4,
    text: 'When you can flip the coin, flip it. When you cannot, adjust with your eyes open. Either way, the question is causal — treat it that way.',
  });
  tl.tween(priceU, 0, { at: 60.9, dur: 0.7, ease: ease.move });
  tl.tween(closeU, 1, { at: 61.3, dur: 0.9, ease: ease.enter });
  tl.hold(62.3, 1.4);

  return { tl, cam, obsP, obsBarU, sevU, coinU, rctP, rctBarU, verdictU, priceU, closeU };
}
