import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Data Wall — reported estimates, honestly labeled, and what synthetic
 * pipelines change.
 *
 * Every number on the chart is REPORTED (replotted, labeled on screen):
 *  - training-set sizes of published models: GPT-3 0.3T tokens (2020),
 *    Chinchilla 1.4T (2022), Llama 2 2T (2023), Llama 3 15T (2024).
 *  - the estimated effective stock of public human text: ~300T tokens, with
 *    full utilization projected between 2026 and 2032 (Villalobos et al.,
 *    "Will we run out of data?", Epoch AI 2022/2024).
 * The trend line through the reported points is a simple log-linear fit,
 * computed here, drawn as a dashed extrapolation and labeled as such.
 */

export interface RunPt {
  year: number;
  tokens: number; // trillions
  label: string;
}
export const RUNS: RunPt[] = [
  { year: 2020, tokens: 0.3, label: 'GPT-3 · 0.3T' },
  { year: 2022, tokens: 1.4, label: 'Chinchilla · 1.4T' },
  { year: 2023, tokens: 2.0, label: 'Llama 2 · 2T' },
  { year: 2024, tokens: 15, label: 'Llama 3 · 15T' },
];
export const STOCK_T = 300; // reported ~300T effective human text
export const PROJ_LO = 2026;
export const PROJ_HI = 2032;

// log-linear fit through the reported points (least squares, computed)
export const FIT = (() => {
  const xs = RUNS.map((r) => r.year - 2020);
  const ys = RUNS.map((r) => Math.log10(r.tokens));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const b =
    xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) /
    xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const a = my - b * mx;
  return { a, b }; // log10(tokens) = a + b·(year-2020)
})();
export const fitTokens = (year: number): number => 10 ** (FIT.a + FIT.b * (year - 2020));
/** the year the fitted trend crosses the reported 300T stock */
export const CROSS_YEAR = 2020 + (Math.log10(STOCK_T) - FIT.a) / FIT.b;

// ---------------------------------------------------------------------------
// Layout — the wall chart center stage, recap ring right at the end.
// ---------------------------------------------------------------------------

export const CH_X0 = 150;
export const CH_X1 = 1130;
export const CH_Y0 = 520;
export const CH_H = 380;
export const YEAR0 = 2019;
export const YEAR1 = 2033;
export const chX = (year: number): number =>
  CH_X0 + ((year - YEAR0) / (YEAR1 - YEAR0)) * (CH_X1 - CH_X0);
const LOG_LO = -1; // 0.1T
const LOG_HI = 3; // 1000T
export const chY = (tokens: number): number =>
  CH_Y0 - ((Math.log10(tokens) - LOG_LO) / (LOG_HI - LOG_LO)) * CH_H;

export const CAM_CHART: CameraState = { x: 640, y: 330, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  ptsU: ChannelRef<number>; // 0..4 reported points
  wallU: ChannelRef<number>; // the 300T stock line
  trendU: ChannelRef<number>; // fitted trend + extrapolation
  bandU: ChannelRef<number>; // the reported 2026–2032 band
  synthU: ChannelRef<number>; // the what-changes panel
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const wallU = tl.channel('wallU', 0);
  const trendU = tl.channel('trendU', 0);
  const bandU = tl.channel('bandU', 0);
  const synthU = tl.channel('synthU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the appetite —————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Why does the field need synthetic data at all? Because of one chart. These are reported training-set sizes of published models — note the axis is logarithmic, in trillions of tokens.',
  });
  tl.tween(cam, CAM_CHART, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(axU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(ptsU, 4, { at: 3.2, dur: 3.5, ease: ease.move });
  tl.caption({
    at: 6.1,
    dur: 5.2,
    text: 'Zero point three trillion tokens in twenty twenty. One point four two years later. Fifteen trillion by twenty twenty four — a fifty fold increase in four years, and every one of those tokens was written by a person.',
  });
  tl.hold(11.5, 0.6);

  // — Beat 2 · the wall —————————————————————————————————————————————————
  tl.caption({
    at: 12.1,
    dur: 5.6,
    text: 'Now the ceiling. The published estimate of all effective public human text — every book, page, and post worth training on — is around three hundred trillion tokens. That line is not growing fifty fold every four years. It grows as fast as people type.',
  });
  tl.tween(wallU, 1, { at: 13.1, dur: 1.2, ease: ease.draw });
  tl.hold(17.9, 0.5);

  // — Beat 3 · the collision ————————————————————————————————————————————
  tl.caption({
    at: 18.4,
    dur: 5.6,
    text: 'Fit the trend through the reported points and extend it — the dashed part is extrapolation, and labeled as such. It crosses the stock around twenty twenty eight. The published projection says full utilization lands somewhere between twenty twenty six and twenty thirty two.',
  });
  tl.tween(trendU, 1, { at: 19.4, dur: 2.2, ease: ease.draw });
  tl.tween(bandU, 1, { at: 22.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 24.4,
    dur: 4.6,
    text: 'The exact year is debatable and the estimate has real error bars. The direction is not: the supply of human text is finite, and the appetite is not.',
  });
  tl.hold(29.2, 0.6);

  // — Beat 4 · what synthetic changes ———————————————————————————————————
  tl.caption({
    at: 29.8,
    dur: 5.8,
    text: 'This book was about what happens on the other side of that wall. Raw self-generation collapses — a copy of a copy. But generation plus a verifier is different: every kept sample carries a bit of information the check extracted from reality.',
  });
  tl.tween(synthU, 1, { at: 31.2, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 35.8,
    dur: 5.2,
    text: 'That is why the pipelines that survive the wall all rhyme: verified reasoning chains, filtered corpora, checked code with its tests. The bottleneck stops being how much text humans wrote, and becomes how much verification you can afford.',
  });
  tl.hold(41.2, 0.6);

  // — Beat 5 · recap + close ————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 41.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 42.4, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 43.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 43.6,
    dur: 6.0,
    text: 'The journey: a ring that trains on itself, the collapse when nothing checks it, the filter that saves it, the bootstrap that turns verified wins into curriculum — and the wall that makes all of this necessary. Data was never the resource. Checked data is.',
  });
  tl.hold(49.8, 1.2);

  return { tl, cam, axU, ptsU, wallU, trendU, bandU, synthU, dimU, endU };
}
