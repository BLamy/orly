import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Humanity's Last Exam: Adversarial Sourcing.
 *
 * Public record: HLE (Center for AI Safety + Scale AI, January 2025) —
 * 2,500 expert-written questions, $500k in prizes, crowdsourced from tens
 * of thousands of submissions. A question advanced to expert review ONLY
 * if frontier models failed it (or did worse than chance on multiple
 * choice) at submission time; a private held-out set guards against
 * overfitting. Launch scores: GPT-4o ~3%, o1 ~9%. By mid-2026 top models
 * report ~45-53%. After ~30% of chemistry/biology answers were disputed
 * (July 2025), the team launched a rolling, regularly-updated version.
 *
 * Toy simulation at module scope: a 400-item bank, item difficulties from
 * a seeded normal, P(correct) = logistic(1.6(ability - difficulty)), and
 * an improving model family (ability -1 → 3.2 over 7 generations).
 * A random sample starts at 26.9% for generation zero. The adversarial
 * set — the 228 items generation zero has under a 25% chance on — starts
 * at 7.5%. Per-generation score gaps (discrimination) are computed for
 * both sets: the random set's gap collapses from ~15 to ~4 points while
 * the adversarial set still separates late generations by 7 points —
 * until it, too, saturates at 94.3%.
 */

const rand = mulberry32(21);
const g = gaussian(rand);
const sig = (x: number): number => 1 / (1 + Math.exp(-x));

export const BANK: number[] = Array.from({ length: 400 }, () => 1.2 * g());
export const pCorrect = (a: number, b: number): number => sig(1.6 * (a - b));
export const GENS = 7;
export const abilityOf = (gi: number): number => -1 + 0.7 * gi;

export const ADV: number[] = BANK.filter((b) => pCorrect(abilityOf(0), b) < 0.25);
const mean = (set: number[], a: number): number => set.reduce((s, b) => s + pCorrect(a, b), 0) / set.length;

export const RAND_SCORES: number[] = Array.from({ length: GENS }, (_, gi) => 100 * mean(BANK, abilityOf(gi)));
export const ADV_SCORES: number[] = Array.from({ length: GENS }, (_, gi) => 100 * mean(ADV, abilityOf(gi)));
export const RAND_GAPS: number[] = Array.from({ length: GENS - 1 }, (_, gi) => RAND_SCORES[gi + 1] - RAND_SCORES[gi]);
export const ADV_GAPS: number[] = Array.from({ length: GENS - 1 }, (_, gi) => ADV_SCORES[gi + 1] - ADV_SCORES[gi]);

// dot layout for the item bank (sorted by difficulty, wrapped rows)
export const SORTED_BANK: number[] = [...BANK].sort((x, y) => x - y);
export const DOT_COLS = 40;
export const DOT_X0 = 220;
export const DOT_Y0 = 150;
export const DOT_DX = 21;
export const DOT_DY = 21;
export const dotPos = (i: number): { x: number; y: number } => ({
  x: DOT_X0 + (i % DOT_COLS) * DOT_DX,
  y: DOT_Y0 + Math.floor(i / DOT_COLS) * DOT_DY,
});
export const ADV_THRESHOLD = abilityOf(0) + Math.log(3) / 1.6; // b where p = 0.25

// score-curve stage mapping
export const X0 = 170;
export const X1 = 1110;
export const Y0 = 560;
export const Y1 = 140;
export const gx = (gi: number): number => X0 + (gi / (GENS - 1)) * (X1 - X0);
export const sy = (score: number): number => Y0 + (score / 100) * (Y1 - Y0);

export const CAM_DOTS: CameraState = { x: 640, y: 250, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  cullU: ChannelRef<number>; // adversarial filter sweeps easy items away
  factU: ChannelRef<number>; // HLE fact panel
  plotU: ChannelRef<number>; // swap to score curves
  randU: ChannelRef<number>;
  advU: ChannelRef<number>;
  gapU: ChannelRef<number>; // discrimination bars
  halfU: ChannelRef<number>; // the catch-up / half-life marker
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const cullU = tl.channel('cullU', 0);
  const factU = tl.channel('factU', 0);
  const plotU = tl.channel('plotU', 0);
  const randU = tl.channel('randU', 0);
  const advU = tl.channel('advU', 0);
  const gapU = tl.channel('gapU', 0);
  const halfU = tl.channel('halfU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the design ——————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'In January twenty twenty five, the Center for A I Safety and Scale A I shipped a benchmark designed against the frontier itself: Humanity’s Last Exam. Twenty five hundred expert written questions, half a million dollars in prizes.',
  });
  tl.tween(dotsU, 1, { at: 0.8, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_DOTS, { at: 1.2, dur: 1.6, ease: ease.move });
  tl.tween(factU, 1, { at: 4.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'The design rule was the interesting part: a submitted question only advanced to expert review if the frontier models of the day failed it. The exam was adversarially sourced — sieved through the very models it was meant to measure.',
  });
  tl.caption({
    at: 12.9,
    dur: 5.2,
    text: 'Let us build that sieve at toy scale. Here are four hundred candidate questions, sorted easy to hard. A generation zero model takes each one — and every question it can probably answer gets thrown out.',
  });
  tl.tween(cullU, 1, { at: 14.0, dur: 3.0, ease: ease.move });
  tl.caption({
    at: 18.5,
    dur: 4.8,
    text: 'Two hundred twenty eight questions survive the sieve. Score generation zero on them: seven and a half percent. That is not an accident — it is the launch condition, manufactured. Real H L E launched with the best models near three percent.',
  });
  tl.hold(23.5, 0.7);

  // — Beat 2 · what it buys ————————————————————————————————————————————
  tl.caption({
    at: 24.2,
    dur: 5.6,
    text: 'Now improve the models, generation after generation, and score them two ways. On a random sample of the bank, generation zero already starts at twenty seven percent — and the curve saturates fast.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 24.4, dur: 1.5, ease: ease.move });
  tl.tween(factU, 0, { at: 24.4, dur: 0.8, ease: ease.move });
  tl.tween(plotU, 1, { at: 24.8, dur: 1.2, ease: ease.move });
  tl.tween(randU, 1, { at: 25.6, dur: 3.0, ease: ease.draw });
  tl.caption({
    at: 30.2,
    dur: 5.8,
    text: 'The adversarial set starts near the floor and stays discriminative longer. Look at the gaps between consecutive generations — that gap is the benchmark’s entire reason to exist. Late in the curve, the random set separates generations by four points; the adversarial set still manages seven.',
  });
  tl.tween(advU, 1, { at: 30.6, dur: 3.0, ease: ease.draw });
  tl.tween(gapU, 1, { at: 34.2, dur: 1.2, ease: ease.enter });
  tl.hold(36.2, 0.7);

  // — Beat 3 · the half-life ———————————————————————————————————————————
  tl.caption({
    at: 36.9,
    dur: 5.6,
    text: 'And this is exactly the public record. At launch, the best models scored three to nine percent on Humanity’s Last Exam. Eighteen months later the frontier reports around fifty. Adversarial sourcing buys a moving floor — it does not buy immortality.',
  });
  tl.tween(halfU, 1, { at: 38.0, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 42.9,
    dur: 6.0,
    text: 'Because the sieve ran once, against the frontier of January twenty twenty five. The exam cannot re-filter itself as models improve — and when a third of the chemistry and biology answers were disputed, the fix was telling: a rolling, regularly refreshed version, plus a private held out set to catch overfitting.',
  });
  tl.hold(49.1, 0.7);

  // — Close ————————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 49.8, dur: 1.1, ease: ease.move });
  tl.tween(gapU, 0, { at: 49.8, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.0,
    dur: 5.6,
    text: 'So adversarial sourcing is a filter, and filters have a half life measured in model generations. A durable exam needs the sieve to keep running. That is a design problem — and design is the last chapter.',
  });
  tl.hold(56.8, 1.2);

  return { tl, cam, dotsU, cullU, factU, plotU, randU, advU, gapU, halfU, dimU, endU };
}
