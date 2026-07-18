import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Designing for Durability — the checklist that falls out of the record.
 *
 * Sourced mechanisms on screen: private/held-out splits (ARC-AGI's
 * semi-private set, HLE's private set), refresh pipelines past training
 * cutoffs (LiveCodeBench dates every problem; SWE-bench-Live rolls new
 * issues), verification-based scoring (executable tests) over LLM judges,
 * adversarial sourcing (HLE), contamination canaries (BIG-bench's canary
 * GUID), and reporting variance (book seventeen). Pairwise Elo arenas
 * refresh prompts by construction but have their own failure mode — "The
 * Leaderboard Illusion" (2025) documented private variant testing (27
 * Llama-4 variants) and votes that reward agreeable, flattering answers.
 *
 * Real computation at module scope: the same seeded 300-item benchmark as
 * chapter two. A frozen pool's two-model gap collapses 13.3 → 0.7 points
 * as ability grows; a refreshed pool — items re-centered on the current
 * frontier each generation — holds the gap at 13.2 points, forever.
 */

const rand = mulberry32(11);
const g = gaussian(rand);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));
export const ITEMS: number[] = Array.from({ length: 300 }, () => g());
const score = (a: number, shift: number): number =>
  ITEMS.reduce((s, b) => s + sig(1.7 * (a - (b + shift))), 0) / ITEMS.length;

export const ABILITIES: number[] = [-0.5, 0.5, 1.5, 2.5, 3.5];
export const FIXED_GAPS: number[] = ABILITIES.map((a) => 100 * (score(a + 0.5, 0) - score(a, 0)));
export const REFRESH_GAPS: number[] = ABILITIES.map((a) => 100 * (score(a + 0.5, a) - score(a, a)));
// FIXED_GAPS: 13.3, 11.7, 6.9, 2.7, 0.7 · REFRESH_GAPS: 13.2 at every ability

export interface CheckItem {
  rule: string;
  example: string;
}
export const CHECKLIST: CheckItem[] = [
  { rule: 'hold out a private split', example: 'ARC-AGI semi-private set · HLE private set' },
  { rule: 'refresh past training cutoffs', example: 'LiveCodeBench dates problems · SWE-bench-Live' },
  { rule: 'score by verification, not opinion', example: 'executable tests > LLM-as-judge' },
  { rule: 'source items adversarially', example: 'HLE: accepted only if the frontier fails' },
  { rule: 'plant contamination canaries', example: 'BIG-bench canary GUID in every file' },
  { rule: 'report variance, not points', example: '№17: a one-point gain at n=100 is a coin flip' },
];

// gap-curve stage mapping
export const X0 = 170;
export const X1 = 700;
export const Y0 = 540;
export const Y1 = 200;
export const gxp = (i: number): number => X0 + (i / (ABILITIES.length - 1)) * (X1 - X0);
export const gyp = (gap: number): number => Y0 + (gap / 15) * (Y1 - Y0);

export const CAM_PLOT: CameraState = { x: 470, y: 370, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  fixU: ChannelRef<number>;
  refU: ChannelRef<number>;
  listU: ChannelRef<number>; // checklist reveal 0..1 (staggered per row)
  arenaU: ChannelRef<number>; // the Elo caveat panel
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const fixU = tl.channel('fixU', 0);
  const refU = tl.channel('refU', 0);
  const listU = tl.channel('listU', 0);
  const arenaU = tl.channel('arenaU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the one plot that summarizes the book ————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the whole book in one plot. On our three hundred item benchmark from chapter two, freeze the questions and let models improve: the gap between two models a fixed half point apart collapses from thirteen points to under one.',
  });
  tl.tween(axU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(fixU, 1, { at: 1.4, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'Now refresh the pool each generation — re-center item difficulty on the current frontier, the way a live benchmark collects new problems. The gap holds at thirteen point two points. Forever. Discrimination is a renewable resource, if you renew it.',
  });
  tl.tween(refU, 1, { at: 7.0, dur: 2.6, ease: ease.draw });
  tl.hold(12.1, 0.7);

  // — Beat 2 · the checklist ————————————————————————————————————————————
  tl.caption({
    at: 12.8,
    dur: 4.6,
    text: 'Everything we watched die — and get repaired — compresses into six design rules. Each one exists because some famous benchmark learned it the hard way.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.0, dur: 1.5, ease: ease.move });
  tl.tween(listU, 0.34, { at: 13.6, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 17.6,
    dur: 5.8,
    text: 'Keep a private split, so a leaderboard climb can be checked against questions nobody trained on. Refresh past every training cutoff, so the crawl cannot eat your test set. And score by verification — run the tests — because judges can be charmed and test suites cannot.',
  });
  tl.tween(listU, 0.67, { at: 18.2, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 23.6,
    dur: 5.6,
    text: 'Source questions adversarially, and keep the sieve running. Plant a canary string, so leakage is detectable later. And report variance with every score — a point of movement means nothing until you know the noise floor.',
  });
  tl.tween(listU, 1, { at: 24.2, dur: 2.2, ease: ease.enter });
  tl.hold(29.4, 0.7);

  // — Beat 3 · the arena caveat ————————————————————————————————————————
  tl.caption({
    at: 30.1,
    dur: 5.8,
    text: 'One more design deserves its own warning. Pairwise voting arenas refresh themselves by construction — every prompt is new. But the twenty twenty five Leaderboard Illusion audit showed the failure mode that replaces leakage: the metric becomes human approval.',
  });
  tl.tween(arenaU, 1, { at: 31.2, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 36.3,
    dur: 5.6,
    text: 'Labs privately tested dozens of variants and published only the winner — twenty seven for one release — and votes reward the agreeable, flattering answer. An arena cannot leak, but it can be gamed. Every scoring rule has its own Goodhart.',
  });
  tl.hold(42.1, 0.7);

  // — Beat 4 · thesis ——————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 42.8, dur: 1.1, ease: ease.move });
  tl.tween(arenaU, 0, { at: 42.8, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 43.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.0,
    dur: 5.8,
    text: 'So here is the shelf’s thesis, one book later: a benchmark is a claim about capability, and a durable benchmark is one built to survive its own success.',
  });
  tl.caption({
    at: 50.2,
    dur: 5.4,
    text: 'Saturation, leakage, and Goodhart are not accidents — they are what winning looks like from the instrument’s side. The eval that lasts is the one that stays harder to game than the task is to solve.',
  });
  tl.hold(55.8, 1.2);

  return { tl, cam, axU, fixU, refU, listU, arenaU, dimU, endU };
}
