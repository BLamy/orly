import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * SWE-bench: A Case Study in Repair.
 *
 * Public record, replotted (approximate reported scores): SWE-bench launched
 * October 2023 (2,294 GitHub issues, resolved = the repo's own tests pass);
 * Claude 2 resolved 1.96%. Devin reported 13.9% (March 2024). OpenAI +
 * the authors released SWE-bench Verified (August 2024): 1,699 instances
 * reviewed by three annotators each — 38.3% flagged underspecified, 61.1%
 * flagged for unfair tests — keeping a clean 500. Reported frontier scores
 * then climbed through ~49% (Claude 3.5 Sonnet, late 2024) to the 70s in
 * 2025 and ~90% by 2026, when its own curators audited remaining failures,
 * found most were test artifacts, and moved on (harder/rolling variants).
 *
 * Toy simulation at module scope: a fixed 160-item pool that leaks into
 * training (12% more memorized each generation) versus a rolling pool of
 * fresh items each generation, against the same true skill (25% → 60%).
 * The fixed pool ends at 95.0% while the rolling pool reads 58.1% — a
 * 36.9-point inflation, all computed below.
 */

// —— Reported record (year, best reported % resolved), replotted ——————————
export const REPORTED: [number, number][] = [
  [2023.8, 1.96], // Claude 2, SWE-bench launch
  [2024.2, 13.9], // Devin
  [2024.6, 33.2], // Verified era begins (GPT-4o-class agents)
  [2024.85, 49.0], // Claude 3.5 Sonnet
  [2025.5, 75.0],
  [2026.2, 90.0],
];

// —— Toy simulation: fixed pool vs rolling pool ————————————————————————
const rand = mulberry32(7);
export const N_POOL = 160;
const FIXED: number[] = Array.from({ length: N_POOL }, () => rand());
export const GENS = 8;
export const skillOf = (gi: number): number => 0.25 + 0.05 * gi;
export const leakOf = (gi: number): number => Math.min(0.9, 0.12 * gi);

export const FIXED_SCORES: number[] = [];
export const ROLLING_SCORES: number[] = [];
for (let gi = 0; gi < GENS; gi++) {
  const s = skillOf(gi);
  const memoN = Math.floor(leakOf(gi) * N_POOL);
  let fixedOK = 0;
  for (let i = 0; i < N_POOL; i++) if (i < memoN || FIXED[i] < s) fixedOK++;
  const r2 = mulberry32(100 + gi);
  let rollOK = 0;
  for (let i = 0; i < N_POOL; i++) if (r2() < s) rollOK++;
  FIXED_SCORES.push((100 * fixedOK) / N_POOL);
  ROLLING_SCORES.push((100 * rollOK) / N_POOL);
}
export const FINAL_INFLATION = FIXED_SCORES[GENS - 1] - ROLLING_SCORES[GENS - 1]; // 36.9 pts

// —— Stage mapping ————————————————————————————————————————————————————
export const X0 = 150;
export const X1 = 1130;
export const Y0 = 560;
export const Y1 = 130;
export const YEAR_MIN = 2023.6;
export const YEAR_MAX = 2026.5;
export const sx = (year: number): number => X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0);
export const sy = (score: number): number => Y0 + (score / 100) * (Y1 - Y0);
// sim mapping (generations along x)
export const gx = (gi: number): number => X0 + (gi / (GENS - 1)) * (X1 - X0);

export const CAM_LAUNCH: CameraState = { x: 380, y: 430, k: 1.3 };
export const CAM_VERIFIED: CameraState = { x: 640, y: 330, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  histU: ChannelRef<number>; // reported curve draw-on
  verU: ChannelRef<number>; // Verified event marker + panel
  retireU: ChannelRef<number>; // 2026 retirement marker
  simU: ChannelRef<number>; // swap stage to the toy simulation
  fixU: ChannelRef<number>; // fixed-pool curve draw
  rollU: ChannelRef<number>; // rolling-pool curve draw
  gapU: ChannelRef<number>; // inflation bracket
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const histU = tl.channel('histU', 0);
  const verU = tl.channel('verU', 0);
  const retireU = tl.channel('retireU', 0);
  const simU = tl.channel('simU', 0);
  const fixU = tl.channel('fixU', 0);
  const rollU = tl.channel('rollU', 0);
  const gapU = tl.channel('gapU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · launch ——————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Swee bench asked a beautifully honest question: here are real git hub issues from real repositories — can a model write the patch? Scoring is not an opinion. The repository’s own test suite runs, and it passes or it does not.',
  });
  tl.tween(axU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_LAUNCH, { at: 1.2, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'At launch in October twenty twenty three, the best model resolved one point nine six percent of the issues. Two years of headroom stretched above that number, and the whole field started climbing.',
  });
  tl.tween(histU, 0.35, { at: 7.0, dur: 2.2, ease: ease.draw });
  tl.hold(11.7, 0.6);

  // — Beat 2 · the flaws + Verified ————————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 5.8,
    text: 'Then the instrument itself came under review. In twenty twenty four, Open A I and the original authors had three annotators re-read each of nearly seventeen hundred instances — and the audit was brutal.',
  });
  tl.tween(cam, CAM_VERIFIED, { at: 12.5, dur: 1.6, ease: ease.move });
  tl.tween(histU, 0.55, { at: 12.8, dur: 1.6, ease: ease.draw });
  tl.tween(verU, 1, { at: 14.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 18.3,
    dur: 6.0,
    text: 'Thirty eight percent of instances were flagged as underspecified — you could not infer the fix from the issue. Sixty one percent had tests that could unfairly reject a valid patch. The repaired subset, swee bench Verified, kept just five hundred clean tasks.',
  });
  tl.caption({
    at: 24.5,
    dur: 5.4,
    text: 'On the cleaner instrument the climb was steep and real: about forty nine percent by late twenty twenty four, the seventies in twenty twenty five, around ninety by twenty twenty six — where its own curators audited the failures, found mostly test artifacts, and moved on.',
  });
  tl.tween(histU, 1, { at: 25.0, dur: 3.0, ease: ease.draw });
  tl.tween(retireU, 1, { at: 28.4, dur: 0.9, ease: ease.enter });
  tl.hold(30.1, 0.7);

  // — Beat 3 · the toy simulation ———————————————————————————————————————
  tl.caption({
    at: 30.8,
    dur: 5.4,
    text: 'The deeper problem is that all five hundred tasks are frozen, public, and older than every new model’s training data. Let us simulate exactly that. A fixed pool of one hundred sixty questions, and a model family whose true skill grows from twenty five to sixty percent.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.0, dur: 1.5, ease: ease.move });
  tl.tween(simU, 1, { at: 31.4, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 36.4,
    dur: 5.6,
    text: 'Each generation, twelve percent more of the fixed pool leaks into training and is simply memorized. Watch the fixed pool score run away from the truth: by generation seven it reads ninety five percent while true skill is sixty.',
  });
  tl.tween(fixU, 1, { at: 36.8, dur: 3.2, ease: ease.draw });
  tl.caption({
    at: 42.2,
    dur: 5.6,
    text: 'Now score the same models on a rolling pool — fresh questions collected each generation, after every training cutoff. It reads fifty eight percent: the truth, plus honest sampling noise. The gap between the two curves is thirty seven points of pure contamination.',
  });
  tl.tween(rollU, 1, { at: 42.6, dur: 3.2, ease: ease.draw });
  tl.tween(gapU, 1, { at: 46.4, dur: 0.9, ease: ease.enter });
  tl.hold(48.1, 0.7);

  // — Beat 4 · close ———————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 48.8, dur: 1.1, ease: ease.move });
  tl.tween(gapU, 0, { at: 48.8, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.0,
    dur: 6.0,
    text: 'That is why the live variants exist — rolling collection of new issues past every cutoff, keeping the durable core, which was never the five hundred tasks. It was the scoring rule: run the tests. Verification survives; question pools do not.',
  });
  tl.hold(56.2, 1.2);

  return { tl, cam, axU, histU, verU, retireU, simU, fixU, rollU, gapU, dimU, endU };
}
