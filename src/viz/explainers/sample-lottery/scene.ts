import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * One Sample Is a Lottery Ticket — the per-sample correctness distribution.
 *
 * A real toy suite at module scope: 300 problems, each with its own true
 * probability that ONE sampled answer is correct (mixture: some easy ~0.75+,
 * many middling, many hard). Mean single-sample accuracy = 0.497. For one
 * middling problem we draw 20 genuine seeded samples and watch the coin
 * flips land. Pass at least once in 16 draws: 95.6% of problems (measured in
 * the next chapter's sweep — here we show the distribution that makes it so).
 */

export const M = 300;
const rand = mulberry32(5);
export const P: number[] = [];
export const Q: number[] = [];
for (let i = 0; i < M; i++) {
  const u = rand();
  const p = u < 0.25 ? 0.75 + 0.2 * rand() : u < 0.6 ? 0.3 + 0.4 * rand() : 0.05 + 0.25 * rand();
  P.push(p);
  Q.push(0.2 + 0.5 * rand());
}
export const PASS1 = P.reduce((a, b) => a + b, 0) / M; // ≈ 0.497

/** histogram of P in 10 bins */
export const HIST_BINS: number[] = (() => {
  const h = new Array(10).fill(0) as number[];
  for (const p of P) h[Math.min(9, Math.floor(p * 10))]++;
  return h;
})();
export const HIST_MAX = Math.max(...HIST_BINS);

/** the showcased problem: the one closest to p = 0.55 */
export const PICK_IDX = P.reduce((b, p, i) => (Math.abs(p - 0.55) < Math.abs(P[b] - 0.55) ? i : b), 0);
export const PICK_P = P[PICK_IDX];
/** 20 genuine seeded draws for the showcased problem */
export const DRAWS: boolean[] = (() => {
  const r = mulberry32(101);
  return Array.from({ length: 20 }, () => r() < PICK_P);
})();
export const DRAW_HITS = DRAWS.filter(Boolean).length;

/** problems sorted by p for the strip */
export const ORDER: number[] = Array.from({ length: M }, (_, i) => i).sort((a, b) => P[a] - P[b]);

// ---------------------------------------------------------------------------
// Layout — problem strip top, coin-flip row middle, histogram bottom-right.
// ---------------------------------------------------------------------------

export const STRIP_X0 = 130;
export const STRIP_X1 = 1150;
export const STRIP_Y = 150;
export const stripX = (k: number): number => STRIP_X0 + (k / (M - 1)) * (STRIP_X1 - STRIP_X0);

export const FLIP_X0 = 250;
export const FLIP_Y = 330;
export const FLIP_DX = 40;

export const HG_X0 = 250;
export const HG_X1 = 1030;
export const HG_Y0 = 560;
export const HG_H = 130;
export const hgX = (bin: number): number => HG_X0 + (bin / 10) * (HG_X1 - HG_X0);
export const HG_BW = ((HG_X1 - HG_X0) / 10) * 0.82;

export const CAM_STRIP: CameraState = { x: 640, y: 220, k: 1.25 };
export const CAM_FLIPS: CameraState = { x: 620, y: 330, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stripU: ChannelRef<number>;
  pickU: ChannelRef<number>;
  flipU: ChannelRef<number>; // 0..20 draws revealed
  histU: ChannelRef<number>;
  meanU: ChannelRef<number>;
  hookU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stripU = tl.channel('stripU', 0);
  const pickU = tl.channel('pickU', 0);
  const flipU = tl.channel('flipU', 0);
  const histU = tl.channel('histU', 0);
  const meanU = tl.channel('meanU', 0);
  const hookU = tl.channel('hookU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the same model, twice —————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Ask a language model a hard question twice and you can get a right answer and a wrong one — same weights, same question. Sampling is a lottery, and this book is about buying more tickets.',
  });
  tl.tween(cam, CAM_STRIP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(stripU, 1, { at: 1.2, dur: 2.0, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 5.4,
    text: 'Here is a toy suite of three hundred problems, sorted by how likely one sampled answer is to be correct. Blue means nearly hopeless, warm means nearly certain. Most of the suite lives in between.',
  });
  tl.hold(11.9, 0.6);

  // — Beat 2 · one problem, twenty draws ————————————————————————————————
  tl.caption({
    at: 12.5,
    dur: 5.0,
    text: 'Zoom in on one middling problem. Its true single-sample success rate is fifty five percent. Now actually draw twenty samples and watch them land.',
  });
  tl.tween(pickU, 1, { at: 13.1, dur: 0.8, ease: ease.pop });
  tl.tween(cam, CAM_FLIPS, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.tween(flipU, 20, { at: 17.7, dur: 5.5, ease: ease.linear });
  tl.caption({
    at: 17.7,
    dur: 5.6,
    text: 'Thirteen hits, seven misses — a lucky run above its true rate, which is exactly the point. Any single one of these draws is a coin flip — but the collection is not. Somewhere in twenty tickets, this problem got solved many times over.',
  });
  tl.hold(23.5, 0.6);

  // — Beat 3 · the distribution ————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 24.1, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 24.5,
    dur: 5.4,
    text: 'Do that for the whole suite and you get this histogram: per-problem success rates smeared across the whole range, from five percent to ninety five. There is no single number that describes this model.',
  });
  tl.tween(histU, 1, { at: 25.1, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 30.3,
    dur: 5.2,
    text: 'Except the one we usually report: average the whole thing and you get forty nine point seven percent — the single-sample accuracy. One number, hiding an entire distribution of lottery odds.',
  });
  tl.tween(meanU, 1, { at: 31.5, dur: 0.8, ease: ease.enter });
  tl.hold(35.9, 0.6);

  // — Beat 4 · why the distribution matters —————————————————————————————
  tl.caption({
    at: 36.5,
    dur: 5.6,
    text: 'Here is why the shape matters. For a problem at fifty five percent, sixteen tickets almost guarantee a winner. Even at twenty percent, sixteen draws succeed at least once about ninety seven percent of the time.',
    tex: '1-(1-p)^{16}',
  });
  tl.tween(hookU, 1, { at: 37.3, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 42.5,
    dur: 5.0,
    text: 'Only the truly hopeless problems — the far left of the histogram — stay locked. Everything else is purchasable with repetition. That is the entire premise of test-time compute.',
  });
  tl.hold(47.7, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 48.3, dur: 1.1, ease: ease.move });
  tl.tween(hookU, 0, { at: 48.3, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.5,
    dur: 5.4,
    text: 'But a pile of lottery tickets is worthless until you know which one won. Next chapter: what more samples actually buy — with a verifier to cash them in, and without one.',
  });
  tl.hold(55.1, 1.2);

  return { tl, cam, stripU, pickU, flipU, histU, meanU, hookU, dimU, endU };
}
