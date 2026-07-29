import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Lifespan of a Benchmark — reported score-over-time curves for GLUE,
 * SuperGLUE, MMLU and GSM8K, replotted (approximate reported frontier
 * scores; sources: GLUE/SuperGLUE leaderboards, MMLU/GSM8K papers and
 * model reports, Stanford AI Index). Every benchmark traces the same
 * S-curve: a discriminative middle, then a ceiling, then silence.
 */

export interface Series {
  name: string;
  color: string;
  pts: [number, number][]; // [year, reported best score %]
}

// Reported frontier scores, replotted (approximate).
export const SERIES: Series[] = [
  {
    name: 'GLUE',
    color: '#38bdf8',
    pts: [
      [2018.4, 70.0], // launch-era BiLSTM baselines
      [2018.8, 80.5], // BERT
      [2019.5, 88.4], // RoBERTa-era
      [2020.2, 90.2],
      [2021.0, 90.8], // ceiling (human baseline ~87)
      [2022.5, 90.8],
    ],
  },
  {
    name: 'SuperGLUE',
    color: '#a78bfa',
    pts: [
      [2019.5, 71.5], // BERT++ launch baseline
      [2019.9, 84.6],
      [2020.3, 89.3], // T5
      [2021.0, 90.3], // surpasses human 89.8
      [2021.6, 91.2],
      [2023.0, 91.2],
    ],
  },
  {
    name: 'MMLU',
    color: '#fbbf24',
    pts: [
      [2020.7, 43.9], // GPT-3
      [2022.3, 67.5], // Chinchilla
      [2022.9, 75.2], // Flan-PaLM
      [2023.2, 86.4], // GPT-4
      [2024.5, 90.0],
      [2025.5, 92.0], // low-90s plateau
    ],
  },
  {
    name: 'GSM8K',
    color: '#34d399',
    pts: [
      [2021.8, 35.0], // GPT-3 175B fine-tuned
      [2022.5, 74.4], // PaLM + self-consistency
      [2023.2, 92.0], // GPT-4
      [2024.3, 96.0],
      [2025.5, 97.0],
    ],
  },
];

// Stage mapping
export const X0 = 150;
export const X1 = 1130;
export const Y0 = 560; // score 0
export const Y1 = 120; // score 100
export const YEAR_MIN = 2018;
export const YEAR_MAX = 2026.5;
export const sx = (year: number): number => X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0);
export const sy = (score: number): number => Y0 + (score / 100) * (Y1 - Y0);

export const CAM_STEEP: CameraState = { x: 430, y: 360, k: 1.25 };
export const CAM_CEIL: CameraState = { x: 820, y: 250, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  drawU: ChannelRef<number>[]; // per-series draw-on
  fadeU: ChannelRef<number>[]; // per-series post-saturation fade
  ceilU: ChannelRef<number>;
  windowU: ChannelRef<number>; // the discriminative-window highlight
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const drawU = SERIES.map((s, i) => tl.channel(`draw${i}_${s.name}`, 0));
  const fadeU = SERIES.map((s, i) => tl.channel(`fade${i}_${s.name}`, 1));
  const ceilU = tl.channel('ceilU', 0);
  const windowU = tl.channel('windowU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the instrument ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Every benchmark you have ever heard of is dying, and it was born to die. This chapter plots the actual public record: the best reported score on four famous benchmarks, year by year.',
  });
  tl.tween(axU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });

  // — Beat 2 · GLUE ————————————————————————————————————————————————————
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'The glue benchmark — the general language understanding suite — launched in twenty eighteen around seventy percent. Bert arrived months later, and within two years the frontier sat at ninety one — above the human baseline. Then the curve went flat, and the field stopped citing it.',
  });
  tl.tween(cam, CAM_STEEP, { at: 6.7, dur: 1.5, ease: ease.move });
  tl.tween(drawU[0], 1, { at: 7.0, dur: 2.6, ease: ease.draw });
  tl.tween(fadeU[0], 0.28, { at: 11.2, dur: 1.2, ease: ease.move });

  // — Beat 3 · SuperGLUE ————————————————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.6,
    text: 'So the field built super glue — deliberately harder. It lasted about the same: launched in twenty nineteen, surpassed the human baseline by early twenty twenty one. Designed to be harder bought almost no extra lifespan.',
  });
  tl.tween(drawU[1], 1, { at: 13.0, dur: 2.4, ease: ease.draw });
  tl.tween(fadeU[1], 0.28, { at: 17.0, dur: 1.2, ease: ease.move });

  // — Beat 4 · MMLU + GSM8K ————————————————————————————————————————————
  tl.caption({
    at: 18.7,
    dur: 6.2,
    text: 'M M L U, fifty seven subjects of exam questions, launched in twenty twenty at forty four percent — real headroom. G P T four hit eighty six in twenty twenty three, and by twenty twenty four the frontier was parked in the low nineties.',
  });
  tl.tween(cam, CAM_CEIL, { at: 19.0, dur: 1.6, ease: ease.move });
  tl.tween(drawU[2], 1, { at: 19.2, dur: 2.8, ease: ease.draw });
  tl.caption({
    at: 25.3,
    dur: 5.2,
    text: 'Grade school math told the same story faster: thirty five percent in twenty twenty one, ninety two by twenty twenty three, then silence. Four instruments, one shape.',
  });
  tl.tween(drawU[3], 1, { at: 25.6, dur: 2.4, ease: ease.draw });
  tl.tween(fadeU[2], 0.28, { at: 29.0, dur: 1.2, ease: ease.move });
  tl.tween(fadeU[3], 0.28, { at: 29.4, dur: 1.2, ease: ease.move });
  tl.hold(30.7, 0.6);

  // — Beat 5 · the ceiling and the window ———————————————————————————————
  tl.caption({
    at: 31.3,
    dur: 5.8,
    text: 'Here is the part that matters: a benchmark only measures anything on the steep part of its curve. Near the ceiling, every model scores the same, and the leftover gap is smaller than the noise.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.5, dur: 1.6, ease: ease.move });
  tl.tween(ceilU, 1, { at: 32.2, dur: 1.2, ease: ease.draw });
  tl.tween(windowU, 1, { at: 33.6, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 37.3,
    dur: 5.4,
    text: 'So a benchmark is not a fact about models. It is an instrument, and instruments wear out. The interesting question is not what the score is today — it is how long the instrument keeps discriminating.',
  });
  tl.hold(42.9, 0.6);

  // — Beat 6 · close ————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 43.5, dur: 1.1, ease: ease.move });
  tl.tween(windowU, 0, { at: 43.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 44.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.7,
    dur: 6.0,
    text: 'This book is about that lifespan. Book seventeen asked whether a single result is real. This one asks a longer question: will the benchmark still measure anything in two years? First, the three ways it stops.',
  });
  tl.hold(50.9, 1.2);

  return { tl, cam, axU, drawU, fadeU, ceilU, windowU, dimU, endU };
}
