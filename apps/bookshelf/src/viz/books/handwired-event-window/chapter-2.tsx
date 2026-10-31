// A Ramp That Narrows
//
// Event Window — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT), lab/event-window/
//   circuit.ts:152 (bit = exact ? circuit.boolean(score) : score), 159-164 (thresholdBit: clamp01(difference × sharpness
//     + 0.5)), 259-264 (titleDifference = titleBoundary − eventY + hitTop), 288-294 (slopDifference = chebyshev −
//     slopBoundary), 556-562 (emitClampZeroOne), 590-597 (behaviorParameterCells), 599-608 (slop + 0.5, titleHeight − 0.5),
//     623 (exact-mode thresholdSharpness = 1)
//   oracle.ts:151 (pressOnTitle = input.y − seen.top < titleHeight)
//   train.ts:40-56 (supervisedBitCount = 21), 66-97 (harvestTrainingPairs), 142-157 (the four annealing phases),
//     182-189 (moments reset at each phase change), 265-274 (hardening), 285-305 (closed-loop verification)
//   training-sweep.ts:15-52 (2 × 10,000-frame harvest → 15,844 pairs; 20 scrambled starts; held-out 9,001-9,003)
//   training.test.ts:39-45 (0 boolean atoms), 79-123 (the fixed-ramp failure; the seven-point loss grid at :93)
//   README.md:69-71 (fixed ramp from the truth drifts to ≈30.01; 9,120 / 10,000 diverge)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every moving boundary on screen is real: the trajectories below were recorded by a line-for-line
// replica of trainBehaviorParameters (scratch: .orly-work/hw-books/handwired-event-window/ch2/trajectories.ts, read-only
// imports of the pinned lab) whose 20 end points and fixed-ramp end point equal the lab's own function to every printed
// digit. The press-offset counts (dot sizes) are the down events that hit a rectangle in the two training traces, and the
// divergence bar is the per-100-frame divergence count of the hardened fixed-ramp circuit on held-out trace 9,001
// (scratch: divergence.ts; total 9,120, first at frame 135). The loss grid is the research run of measureMeanLoss.
// Changes from the plan (following review.md): three snaps, not four (the 32 px chip is the starting ramp); the wide ramp
// pulls only on presses within 16 px of the far boundary; the fixed-ramp run reuses the one axis instead of a second.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const CH13 = 7.83; // mono advance at 13 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The lab's numbers (module scope)
// ---------------------------------------------------------------------------

/** circuit.ts:161-164 — the one ramp shape */
const ramp = (difference: number, sharpness: number): number => clamp01(difference * sharpness + 0.5);
const TITLE_HEIGHT = 30;
const SLOP = 4;
const TITLE_TRUE = TITLE_HEIGHT - 0.5; // circuit.ts:607
const SLOP_TRUE = SLOP + 0.5; // circuit.ts:606
/** oracle.ts:151 — integer offsets 0..29 are title */
const isTitle = (offset: number): boolean => offset < TITLE_HEIGHT;
for (const o of [29, 30]) {
  // the authored boundary at exact sharpness 1 reproduces the oracle at both sides of the band
  if (ramp(TITLE_TRUE - o, 1) !== (isTitle(o) ? 1 : 0)) throw new Error('title ramp mismatch');
}

/** train.ts:152-157 */
const PHASES = [
  { until: 0.4, sharpness: 1 / 32, lr: 1, sh: '1/32' },
  { until: 0.65, sharpness: 0.25, lr: 1, sh: '0.25' },
  { until: 0.85, sharpness: 1, lr: 0.3, sh: '1' },
  { until: 1, sharpness: 4, lr: 0.1, sh: '4' },
];
const widthLabel = (sh: number): string => {
  const w = 1 / sh;
  return `${w >= 1 ? w : w.toFixed(2)} px`;
};
const SUPERVISED_BITS = 21; // train.ts:56 (9 record/latch cells + 4 maximized + 4 focused + 4 drag owners)
const PAIRS = 15844; // training-sweep.ts harvest
const HELD_OUT = [9001, 9002, 9003];
const FRAMES = 10000;

// down events that hit a rectangle in training traces 1,001 and 1,002, by offset below the hit window's top (0..110 px)
const HIST = [
  0, 24, 23, 33, 36, 25, 28, 32, 44, 27, 26, 27, 27, 28, 34, 31, 23, 27, 33, 32, 25, 28, 31, 29, 33, 30, 38, 38, 29, 31,
  9, 14, 6, 11, 14, 12, 11, 11, 8, 11, 13, 15, 11, 12, 16, 9, 12, 10, 7, 10, 15, 12, 9, 13, 6, 10, 11, 7, 6, 13, 9, 12,
  15, 9, 12, 8, 14, 7, 7, 17, 8, 7, 12, 17, 6, 16, 15, 15, 16, 10, 14, 10, 14, 9, 13, 8, 6, 12, 17, 10, 12, 10, 13, 10,
  4, 6, 10, 4, 9, 5, 2, 5, 7, 3, 4, 6, 7, 5, 2, 5, 5,
];
const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;
const TITLE_PER_ROW = Math.round(mean(HIST.slice(1, 30))); // 30
const BODY_PER_ROW = Math.round(mean(HIST.slice(30, 61))); // 11

// seed 1 (scrambledParameterValues(82)), annealed: every 40 of 2,400 steps (61 points)
const SEED1_TITLE = [85.953, 74.935, 65.165, 54.794, 42.984, 34.148, 32.389, 32.353, 33.578, 33.634, 34.416, 34.331, 31.734, 33.93, 34.124, 33.521, 32.734, 31.321, 34.13, 32.693, 33.028, 31.399, 34.224, 33.365, 33.554, 29.237, 28.276, 30.89, 30.066, 30.319, 30.587, 30.157, 29.424, 30.342, 31.844, 29.621, 30.056, 29.518, 30.676, 29.265, 29.938, 29.114, 29.788, 29.397, 30.313, 30.429, 29.044, 28.821, 29.966, 27.809, 29.699, 29.702, 29.702, 29.702, 29.702, 29.702, 29.702, 29.702, 29.702, 29.702, 29.702];
const SEED1_SLOP = [12.857, 5.452, 3.153, 3.503, 4.376, 8.174, 7.291, 2.156, 2.483, 3.548, 4.651, 3.908, 3.275, 4.706, 6.338, 3.925, 1.178, 3.348, 2.517, 2.425, 7.119, 8.007, 5.727, 5.653, 8.998, 4.469, 4.279, 3.917, 4.769, 4.532, 4.307, 5.269, 4.566, 4.721, 4.358, 4.751, 4.348, 3.956, 5.154, 3.722, 4.495, 4.514, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5];
// fixed sharpness 0.25 from the authored truth (training.test.ts:100-108), every 40 steps
const FIXED_TITLE = [29.5, 33.625, 29.025, 30.001, 28.955, 31.234, 29.76, 29.204, 29.078, 29.084, 31.404, 29.752, 30.12, 30.202, 30.824, 29.494, 30.895, 30.145, 29.391, 30.211, 29.693, 29.212, 31.397, 30.872, 30.193, 29.724, 27.47, 31.55, 29.727, 30.451, 30.517, 30.122, 29.45, 30.318, 31.666, 29.609, 30.044, 29.498, 30.677, 29.273, 30.297, 28.719, 31.482, 28.655, 32.202, 30.963, 28.54, 30.5, 31.967, 29.967, 28.871, 30.542, 29.975, 31.152, 30.183, 29.236, 29.794, 30.566, 30.695, 29.21, 30.0138];
const FIXED_SLOP = [4.5, 4.051, 4.306, 4.781, 3.705, 4.618, 4.44, 4.724, 3.983, 4.66, 5.534, 4.946, 3.934, 4.962, 4.033, 4.53, 3.808, 4.504, 4.512, 5.196, 4.89, 5.108, 4.366, 4.788, 4.835, 5.277, 4.421, 3.662, 4.718, 4.439, 4.261, 5.355, 4.667, 4.783, 4.355, 4.759, 4.351, 3.953, 5.156, 3.722, 4.896, 4.721, 4.103, 4.051, 3.006, 5.42, 4.366, 4.552, 4.719, 3.867, 4.452, 4.262, 4.349, 4.146, 4.272, 4.761, 4.793, 4.775, 5.253, 4.312, 3.9671];
// training-sweep.ts seeds 1..20, every 120 steps (21 points); the last point is the sweep's printed learned value
const SWEEP_TITLE = [
  [85.95, 54.79, 32.39, 33.63, 31.73, 33.52, 34.13, 31.4, 33.55, 30.89, 30.59, 30.34, 30.06, 29.27, 29.79, 30.43, 29.97, 29.7, 29.7, 29.7, 29.702],
  [84.06, 47.89, 34.07, 31.77, 34.47, 33.1, 30.93, 33.97, 33.72, 30.81, 30.17, 30.2, 29.4, 31.97, 30.81, 29.96, 30.03, 29.82, 29.82, 29.82, 29.821],
  [82.16, 40.36, 34.37, 34.17, 33.75, 33.15, 36.03, 34.03, 35.26, 30.29, 30.55, 30.07, 29.8, 30.11, 30.11, 29.74, 29.68, 29.68, 29.68, 29.68, 29.684],
  [80.26, 49.24, 31.92, 33.7, 34.04, 33.16, 33.6, 31.03, 35.15, 32.1, 30.38, 31.33, 29.98, 33.12, 32.34, 29.15, 29.61, 29.5, 29.5, 29.5, 29.501],
  [78.36, 40.56, 33.8, 35.77, 33.85, 33.37, 33.21, 34.71, 32.41, 30.16, 31.82, 29.85, 30.53, 30.87, 30.01, 29.01, 29.24, 29.56, 29.56, 29.56, 29.563],
  [76.47, 41.6, 34.87, 33, 32.86, 36.33, 34.3, 33.44, 33.61, 30.96, 29.25, 28.76, 31.38, 30.1, 30.1, 29.34, 29.38, 29.5, 29.5, 29.5, 29.502],
  [74.57, 41.43, 34.55, 33.47, 34.94, 34.09, 34.12, 34.78, 32.6, 30.68, 29.53, 29.08, 30.78, 32.96, 29.39, 29.49, 29.52, 29.5, 29.5, 29.5, 29.498],
  [72.67, 37.43, 33.07, 34.16, 35.62, 33.72, 33.93, 34.45, 33.99, 30.12, 29.16, 29.7, 29.75, 29.86, 29.35, 30.08, 29.88, 30, 29.71, 29.71, 29.712],
  [70.78, 34.32, 33.95, 34.78, 32.87, 32.68, 33.69, 33.05, 32.85, 30.21, 30.9, 30.48, 30.64, 30.83, 29.66, 29.28, 30.24, 29.55, 29.55, 29.55, 29.555],
  [68.88, 42.74, 32.11, 34.65, 33.27, 33.07, 36.94, 34.99, 34.3, 28.87, 30.85, 29.97, 29.51, 30.89, 29.53, 29.45, 29.74, 29.47, 29.47, 29.47, 29.47],
  [66.98, 35.85, 34.1, 33.06, 34.06, 33.82, 35.1, 32.99, 32.85, 31.07, 30.66, 29.86, 31.25, 31.43, 29.95, 29.48, 29.63, 29.49, 29.49, 29.49, 29.49],
  [65.08, 33.52, 33.3, 33.37, 33.74, 34.29, 33.47, 33.16, 32.07, 31.37, 28.86, 30.43, 31.19, 31.68, 31.68, 30, 30.01, 30.01, 30.01, 29.41, 29.414],
  [63.19, 32.85, 36.8, 31.79, 33.76, 33.07, 33.35, 34.36, 31.27, 29.28, 31.15, 29.11, 29.39, 29.95, 29.24, 30, 29.89, 29.97, 29.61, 29.43, 29.435],
  [61.29, 32.53, 36.12, 33.52, 36.24, 31.7, 33.83, 32.72, 34, 31.23, 31.1, 30.69, 29.31, 29.88, 30.34, 27.94, 29.4, 29.56, 29.56, 29.56, 29.563],
  [59.39, 33.73, 33.09, 36.21, 33.88, 32.2, 36.02, 36.26, 30.29, 30.47, 30.61, 29.81, 30.79, 30.07, 29.64, 29.52, 29.64, 29.54, 29.54, 29.54, 29.536],
  [57.49, 33.92, 32.77, 31.07, 32.92, 34.21, 33.55, 33.6, 34.96, 30.14, 30.37, 31.66, 28.01, 30.06, 29.58, 29.58, 29.98, 29.39, 29.39, 29.39, 29.39],
  [55.6, 33.67, 35.02, 36.64, 34.21, 32.21, 33.17, 34.12, 33.91, 30.05, 30.32, 29.65, 30.48, 32.49, 31.34, 29.39, 29.57, 29.52, 29.52, 29.52, 29.524],
  [53.7, 32.96, 32.09, 34.76, 31.39, 32.36, 35.34, 34.14, 34.62, 30.94, 31.88, 30.39, 31.43, 31.14, 30.15, 30.15, 30, 30, 29.68, 29.68, 29.68],
  [51.8, 34.4, 34.61, 32.23, 33.86, 31.93, 37.12, 35.44, 34.28, 31.12, 29.59, 30.44, 29.96, 29.07, 29.88, 29.9, 29.72, 29.48, 29.48, 29.48, 29.479],
  [49.91, 32.48, 33.11, 33.79, 32.15, 34.53, 34.42, 33.52, 34.8, 30.69, 29.62, 29.07, 31.5, 30.01, 29.2, 30.44, 29.49, 29.61, 29.61, 29.61, 29.607],
];
const SWEEP_SLOP = [
  [12.86, 3.5, 7.29, 3.55, 3.27, 3.92, 2.52, 8.01, 9, 3.92, 4.31, 4.72, 4.35, 3.72, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [14.29, 0.99, 3.49, 6.58, 5.5, 5.34, 3.95, 6.24, 1.87, 4.78, 4.01, 3.48, 4.45, 4.39, 4.55, 4.49, 4.5, 4.5, 4.5, 4.5, 4.5],
  [15.72, 6.76, 4.74, 4.7, 2.9, 3.37, 3.17, 3.87, 3.58, 4.12, 3.88, 5.33, 4.34, 4.41, 4.43, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [17.15, 7.59, 3.52, 3.88, 5.11, 4.65, 3.82, 0.82, 1.97, 4.45, 4.8, 4.65, 3.81, 4.67, 4.52, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [18.59, 3.87, 3.33, 4.68, 0.97, 4.02, 4.27, 4.82, 6.63, 5.17, 4.62, 4.8, 3.94, 4.66, 4.5, 4.74, 4.51, 4.5, 4.5, 4.5, 4.5],
  [20.02, 5.52, 4.74, 0.53, 5.06, 6.46, 5.89, 5.33, 4.26, 4.18, 3.19, 5.54, 4.3, 3.98, 4.51, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [21.45, 4.54, 5.15, 5.05, 4.03, 6.33, 1.09, 4.09, 2.58, 4.45, 5.27, 4.18, 4.57, 3.95, 4.5, 4.5, 4.48, 3.92, 4.3, 4.3, 4.305],
  [22.88, 2.03, 4.35, 3.58, 7.25, 6.03, 6.56, 3.84, 1.45, 4.48, 4.53, 4.93, 4.86, 3.68, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [24.32, 4.25, 7.84, 2.75, 2.43, 5.73, 2.75, 6.42, 4.83, 4.37, 3.98, 4.4, 4.62, 5.08, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
  [25.75, 6.75, 3.37, 6.31, 1.21, 3.27, 1.04, 4.82, 3.71, 4.78, 4.47, 4.86, 4.43, 4.52, 4.51, 4.5, 4.51, 4.5, 4.5, 4.5, 4.498],
  [27.18, 3.86, 4.38, 7.08, 4.48, 4.76, 5.59, 4.82, 4.76, 5.21, 3.44, 4.62, 4.25, 4.4, 4.51, 4.5, 4.5, 4.51, 4.51, 4.51, 4.513],
  [28.61, 4.89, 2.25, 6.15, 6.8, 3.91, 2.95, 5.33, 1.76, 4.18, 4.93, 4.59, 4.31, 4.46, 4.48, 4.51, 4.45, 4.49, 4.49, 4.49, 4.493],
  [30.05, 7.46, 4.68, 2.99, 2.21, 6.58, 2.68, 5.45, 2.65, 4.43, 4.77, 4.69, 4.2, 4.14, 4.5, 4.5, 4.5, 4.84, 4.84, 4.84, 4.842],
  [31.48, 23.96, 5.3, 4.98, 3.22, 1.33, 5.81, 6.04, 4.73, 3.48, 4.13, 3.7, 3.91, 4.21, 4.45, 4.5, 4.52, 4.79, 4.79, 4.79, 4.795],
  [32.91, 24.82, 4.24, 5.42, 2.79, 4.92, 3.72, 3.2, 2.44, 5.53, 4.84, 4.04, 3.28, 4.96, 4.48, 4.49, 4.48, 4.78, 4.78, 4.78, 4.775],
  [34.34, 25.13, 3.64, 3.64, 7.22, 5.14, 3.67, 3.97, 3.39, 4.16, 3.77, 4.89, 3.88, 4.22, 4.45, 4.5, 4.51, 4.48, 4.48, 4.48, 4.483],
  [35.77, 26.34, 7.01, 3.97, 3.66, 3.21, 5.71, 3.53, 7.12, 4.08, 3.92, 4.4, 4.65, 4.05, 4.49, 4.56, 4.5, 4.5, 4.5, 4.5, 4.503],
  [37.21, 29.84, 5.16, 2.56, 5.35, 4.4, 2.94, 3.58, 5.78, 3.8, 4.09, 4.52, 4.03, 4.11, 4.51, 4.49, 4.22, 4.47, 4.47, 4.47, 4.466],
  [38.64, 25.07, 0.3, 4.7, 3.27, 5.74, 4.62, 5.38, 7.97, 4.24, 3.37, 4.71, 3.85, 4.38, 4.47, 4.49, 4.51, 4.17, 4.17, 4.17, 4.174],
  [40.07, 28.43, 2.9, 5.28, 2, 1.38, 3.09, 3.98, 4.66, 4.46, 3.51, 4.5, 4.45, 4.47, 4.41, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
];
const SWEEP_TITLE_END = SWEEP_TITLE.map((r) => r[r.length - 1]);
const SWEEP_SLOP_END = SWEEP_SLOP.map((r) => r[r.length - 1]);
const inBand = (title: number, slop: number): boolean => title >= 29 && title < 30 && slop > 4 && slop <= 5;
if (!SWEEP_TITLE_END.every((t, i) => inBand(t, SWEEP_SLOP_END[i]))) throw new Error('sweep: a seed landed outside a band');
const TITLE_MIN = Math.min(...SWEEP_TITLE_END); // 29.390
const TITLE_MAX = Math.max(...SWEEP_TITLE_END); // 29.821
const SLOP_MIN = Math.min(...SWEEP_SLOP_END); // 4.174
const SLOP_MAX = Math.max(...SWEEP_SLOP_END); // 4.842
const RELATIONS = [
  { name: 'dragFromTitle', learned: 1 },
  { name: 'dragFromBody', learned: 0 },
  { name: 'clickTogglesFromTitle', learned: 0 },
  { name: 'clickTogglesFromBody', learned: 1 },
];
const HARDENED = RELATIONS.map((r) => (r.learned >= 0.5 ? 1 : 0)).join(''); // train.ts:270-273 → '1001'

// fixed-ramp loss grid at sharpness 0.25 (training.test.ts:93; research run of measureMeanLoss)
const LOSS_GRID = [29, 29.25, 29.5, 29.75, 30, 30.25, 30.5];
const LOSS = [0.002749, 0.002679, 0.002629, 0.002599, 0.00259, 0.002598, 0.002621];
const LOSS_MIN_I = LOSS.indexOf(Math.min(...LOSS));
if (LOSS_GRID[LOSS_MIN_I] !== 30) throw new Error('loss minimum is not at 30');

// hardened fixed-ramp circuit, held-out trace 9,001: divergent frames per 100-frame bin
const DIVERGE_BINS = [0, 1, 0, 1, 2, 9, 0, 1, 6, ...Array.from({ length: 91 }, () => 100)];
const DIVERGED = DIVERGE_BINS.reduce((s, x) => s + x, 0);
if (DIVERGED !== 9120) throw new Error('divergence total');
const FIRST_DIVERGENCE = 135;

/** linear read of a trajectory recorded at even steps, u ∈ [0, 1] over the whole run */
const trajAt = (arr: number[], u: number): number => {
  const f = clamp01(u) * (arr.length - 1);
  const i = Math.min(arr.length - 2, Math.floor(f));
  return lerp(arr[i], arr[i + 1], f - i);
};

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const PX0 = 110;
const PX1 = 770;
const Y1 = 196; // bit = 1
const Y0 = 352; // bit = 0
const AXIS_Y = 374;
const SLOP_Y = 482;
const BAR = { x: 110, y: 556, w: 1070, h: 22 };
const RX = 850; // right column
const RW = 335;
const GX = (d: number): number => PX0 + ((d + 3) / 6) * (PX1 - PX0); // generic 'difference' axis, −3..3

type Domain = { lo: number; hi: number };
const xOf = (d: Domain) => (v: number): number => PX0 + ((v - d.lo) / (d.hi - d.lo)) * (PX1 - PX0);

const TICK_STEPS = [0.25, 0.5, 1, 2, 5, 10, 20];
const ticksFor = (d: Domain, minGap = 44): { step: number; vals: number[] } => {
  const ppu = (PX1 - PX0) / (d.hi - d.lo);
  const step = TICK_STEPS.find((s) => s * ppu >= minGap) ?? 50;
  const vals: number[] = [];
  for (let v = Math.ceil(d.lo / step - 1e-9) * step; v <= d.hi + 1e-9; v += step) vals.push(+v.toFixed(4));
  return { step, vals };
};
const tickText = (v: number): string => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : String(v));

// 20 end points as a small beeswarm (rows chosen greedily at the final zoom)
const swarm = (vals: number[], d: Domain, r: number): number[] => {
  const X = xOf(d);
  const order = vals.map((v, i) => ({ x: X(v), i })).sort((a, b) => a.x - b.x);
  const rows: number[] = [];
  const out = new Array<number>(vals.length).fill(0);
  for (const { x, i } of order) {
    let row = rows.findIndex((last) => x - last >= 2 * r + 1);
    if (row < 0) {
      row = rows.length;
      rows.push(x);
    } else rows[row] = x;
    out[i] = row;
  }
  return out;
};
const DOM_SWEEP_END: Domain = { lo: 28.6, hi: 30.6 };
const SLOP_SWEEP_END: Domain = { lo: 3.7, hi: 5.3 };
const SWARM_R = 5;
const TITLE_ROWS = swarm(SWEEP_TITLE_END, DOM_SWEEP_END, SWARM_R);

// loss chart (right column)
const LC = { x0: RX + 30, x1: RX + RW - 20, y0: 410, y1: 230 };
const lossX = (g: number): number => LC.x0 + ((g - 29) / 1.5) * (LC.x1 - LC.x0);
const lossY = (l: number): number => LC.y0 + ((l - 0.00257) / (0.00277 - 0.00257)) * (LC.y1 - LC.y0);

const CAM_RAMP: CameraState = { x: 440, y: 300, k: 1.28 };
const CAM_PLOT: CameraState = { x: 610, y: 330, k: 1.08 };
const CAM_END: CameraState = { x: 640, y: 350, k: 0.97 };

/** per-item progress from one group channel */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // the one machine: a ramp over an axis
  const axisU = tl.channel('axisU', 0);
  const rampU = tl.channel('rampDraw', 0);
  const onAxis = tl.channel('onAxis', 0); // 0 generic 'difference' ramp → 1 the title test over offsets
  const sharpG = tl.channel('genericSharpness', 1);
  const eqU = tl.channel('equationU', 0);
  const sliderU = tl.channel('sliderU', 0);
  const halfU = tl.channel('halfMarkU', 0);
  const clampGlow = tl.channel('clampGlow', 0);
  const dom = tl.channel<Domain>('titleDomain', { lo: 20, hi: 40 });
  const slopDom = tl.channel<Domain>('slopDomain', { lo: 0, hi: 10 });
  const wLog2 = tl.channel('rampWidthLog2', 0); // ramp width = 2^wLog2 px (exact mode: sharpness 1)
  const stepU = tl.channel('roundingStep', 0);
  const gradU = tl.channel('gradientArrow', 0);
  const titleManual = tl.channel('titleBoundary', TITLE_TRUE);
  const slopManual = tl.channel('slopBoundary', SLOP_TRUE);
  const track = tl.channel('track', 0); // 0 manual · 1 seed-1 anneal · 2 fixed ramp
  const trainU = tl.channel('trainProgress', 0);
  const fixedU = tl.channel('fixedProgress', 0);
  const digits = tl.channel('boundaryDigits', 1);
  const lineU = tl.channel('boundaryLineU', 0);
  const bandU = tl.channel('bandU', 0);
  const bandGlow = tl.channel('bandGlow', 0);
  const slopGlow = tl.channel('slopBandGlow', 0);
  const dotsU = tl.channel('dotsU', 0);
  const spot2 = tl.channel('spot2930', 0);
  const pullU = tl.channel('pullU', 0);
  const widthTag = tl.channel('widthTagU', 0);
  const slopU = tl.channel('slopStripU', 0);
  const machineOp = tl.channel('machineOp', 1);
  const densityU = tl.channel('densityU', 0);
  const minMarkU = tl.channel('minMarkU', 0);
  // sweep
  const sweepOn = tl.channel('sweepOn', 0);
  const sweepU = tl.channel('sweepProgress', 0);
  const swarmU = tl.channel('swarmU', 0);
  const rangeT = tl.channel('rangeTitleU', 0);
  const rangeS = tl.channel('rangeSlopU', 0);
  // right column
  const winU = tl.channel('windowGlyphU', 0);
  const measureU = tl.channel('measureU', 0);
  const codeU = tl.channel('codeChipU', 0);
  const codeLine = tl.channel('codeLine', 0);
  const paramsU = tl.channel('paramsU', 0);
  const paramsOp = tl.channel('paramsOp', 1);
  const paramSpot = tl.channel('paramSpot', 0); // 0 none · 1 boundaries · 2 relations
  const lockU = tl.channel('lockU', 0);
  const cardU = tl.channel('cardU', 0);
  const cardIn = tl.channel('cardInputU', 0);
  const cardOut = tl.channel('cardOutputU', 0);
  const pileU = tl.channel('pileU', 0);
  const tagU = tl.channel('singleFrameTag', 0);
  const cardOp = tl.channel('cardOp', 1);
  const phaseU = tl.channel('phaseTableU', 0);
  const phaseOp = tl.channel('phaseOp', 1);
  const phaseRow = tl.channel('phaseRow', 0);
  const resetFlash = tl.channel('resetFlash', 0);
  const lrGlow = tl.channel('lrGlow', 0);
  const resetGlow = tl.channel('resetGlow', 0);
  const landT = tl.channel('landTitleU', 0);
  const landS = tl.channel('landSlopU', 0);
  const relU = tl.channel('relationsU', 0);
  const roundU = tl.channel('roundU', 0);
  const bitsU = tl.channel('bitStringU', 0);
  const tracesU = tl.channel('heldOutU', 0);
  const zeroU = tl.channel('zeroCounterU', 0);
  const verifyOp = tl.channel('verifyOp', 1);
  const countU = tl.channel('recoveredU', 0);
  const sweepOp = tl.channel('sweepPanelOp', 1);
  const fixChip = tl.channel('fixedChipU', 0);
  const fixStart = tl.channel('fixedStartU', 0);
  const fixRead = tl.channel('fixedReadoutU', 0);
  const fixOp = tl.channel('fixedOp', 1);
  const lossU = tl.channel('lossAxisU', 0);
  const lossDraw = tl.channel('lossDraw', 0);
  const lossMinU = tl.channel('lossMinU', 0);
  const lossTrueU = tl.channel('lossTrueU', 0);
  const lossOp = tl.channel('lossOp', 1);
  const barU = tl.channel('divergeBar', 0);
  const barFill = tl.channel('divergeFill', 0);
  const firstU = tl.channel('firstDivergenceU', 0);
  const endDim = tl.channel('endDim', 0);
  const summaryU = tl.channel('summaryU', 0);

  // one caption = one spoken line at ~150 words per minute, then a short hold
  let t = 0.4;
  const beat = (text: string): { a: number; d: number } => {
    const a = t;
    const d = text.split(/\s+/).length / 2.5 + 0.4;
    tl.caption({ at: a, dur: d, text });
    t = tl.hold(a + d, 0.6);
    return { a, d };
  };
  const fadeOut = (chs: ChannelRef<number>[], at: number, to = 0) => {
    for (const ch of chs) tl.tween(ch, to, { at, dur: 0.6, ease: ease.move });
  };

  // — B1 · one shape: a ramp —
  let b = beat('The title test and the slop test share one shape: a ramp. Take the difference between a boundary and a measure, scale it by a sharpness, add one half, and clamp between zero and one.');
  tl.set(cam, CAM_RAMP, 0);
  tl.tween(axisU, 1, { at: b.a + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(rampU, 1, { at: b.a + 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(eqU, 1, { at: b.a + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(sliderU, 1, { at: b.a + 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(sharpG, 2, { at: b.a + 6.3, dur: 0.9, ease: ease.move });
  tl.tween(sharpG, 0.5, { at: b.a + 7.4, dur: 1.1, ease: ease.move });
  tl.tween(sharpG, 1, { at: b.a + 8.7, dur: 0.9, ease: ease.move });
  tl.tween(halfU, 1, { at: b.a + 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(clampGlow, 1, { at: b.a + 11.4, dur: 0.6, ease: ease.enter });
  tl.tween(clampGlow, 0, { at: b.a + b.d - 0.4, dur: 0.6, ease: ease.move });

  // — B2 · the title test on the offset axis —
  b = beat("Is a press on the title? The measure is how far below the window's top the pointer landed. The boundary sits at twenty-nine and a half, so twenty-nine pixels is title and thirty is body.");
  tl.tween(cam, CAMERA_HOME, { at: b.a, dur: 1.3, ease: ease.move });
  fadeOut([eqU, sliderU, halfU], b.a);
  tl.tween(onAxis, 1, { at: b.a + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(winU, 1, { at: b.a + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(measureU, 1, { at: b.a + 3.0, dur: 0.9, ease: ease.draw });
  tl.tween(dotsU, 1, { at: b.a + 4.4, dur: 1.2, ease: ease.linear });
  tl.tween(lineU, 1, { at: b.a + 7.2, dur: 0.7, ease: ease.enter });
  tl.tween(bandU, 1, { at: b.a + 9.8, dur: 0.6, ease: ease.enter });
  tl.tween(spot2, 1, { at: b.a + 10.2, dur: 0.5, ease: ease.enter });

  // — B3 · shipped: rounded; training copy: a slope —
  b = beat('In the shipped circuit a rounding step snaps the ramp to exactly zero or one. The training copy has no rounding, so the ramp keeps its slope, and a slope is something gradient descent can follow.');
  fadeOut([winU, measureU, spot2], b.a);
  tl.tween(dom, { lo: 25, hi: 34 }, { at: b.a + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(codeU, 1, { at: b.a + 0.8, dur: 0.6, ease: ease.enter });
  tl.set(codeLine, 1, b.a + 1.9);
  tl.tween(stepU, 1, { at: b.a + 2.0, dur: 0.5, ease: ease.pop });
  tl.set(codeLine, 2, b.a + 6.8);
  tl.tween(stepU, 0, { at: b.a + 6.9, dur: 0.8, ease: ease.move });
  tl.tween(gradU, 1, { at: b.a + 10.2, dur: 1.4, ease: ease.move });

  // — B4 · six numbers train; the structure is authored —
  b = beat('Training adjusts six numbers: the title boundary, the slop boundary, and four relation cells saying whether a title or body press drags or toggles. The latch structure stays as authored.');
  fadeOut([codeU, gradU], b.a);
  tl.tween(dom, { lo: 20, hi: 40 }, { at: b.a + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(paramsU, 1, { at: b.a + 0.6, dur: 1.6, ease: ease.linear });
  tl.set(paramSpot, 1, b.a + 2.2);
  tl.tween(slopU, 1, { at: b.a + 3.0, dur: 1.0, ease: ease.draw });
  tl.set(paramSpot, 2, b.a + 5.0);
  tl.set(paramSpot, 0, b.a + 9.6);
  tl.tween(lockU, 1, { at: b.a + 9.6, dur: 0.6, ease: ease.enter });

  // — B5 · single frames: one pair per kept frame —
  b = beat("It trains on single frames, never whole sessions. Each example pairs one input and the oracle's stored state with twenty-one decision bits, so no backpropagation through time is needed.");
  tl.tween(paramsOp, 0.12, { at: b.a, dur: 0.6, ease: ease.move });
  tl.tween(paramsOp, 0, { at: b.a + 1.2, dur: 0.5, ease: ease.move });
  tl.tween(cardU, 1, { at: b.a + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(pileU, 1, { at: b.a + 1.6, dur: 1.2, ease: ease.linear });
  tl.tween(cardIn, 1, { at: b.a + 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(cardOut, 1, { at: b.a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(tagU, 1, { at: b.a + 9.4, dur: 0.6, ease: ease.enter });

  // — B6 · scrambled start, a 32 px ramp —
  b = beat('Start far off: the title boundary near eighty-six pixels, the slop boundary near thirteen. The first ramp is thirty-two pixels wide, so frames within sixteen pixels of a far boundary still pull on it.');
  fadeOut([cardU, cardIn, cardOut, pileU, tagU, lockU], b.a);
  tl.tween(phaseU, 1, { at: b.a + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(dom, { lo: 0, hi: 100 }, { at: b.a + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(slopDom, { lo: 0, hi: 24 }, { at: b.a + 0.4, dur: 1.4, ease: ease.move });
  tl.set(track, 1, b.a + 1.6);
  tl.set(digits, 2, b.a + 1.6);
  tl.tween(wLog2, 5, { at: b.a + 1.6, dur: 0.6, ease: ease.pop });
  tl.tween(widthTag, 1, { at: b.a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(pullU, 1, { at: b.a + 8.6, dur: 0.6, ease: ease.enter });
  tl.tween(trainU, PHASES[0].until, { at: b.a + 10.6, dur: 2.6, ease: ease.linear });
  tl.tween(pullU, 0, { at: b.a + b.d - 0.2, dur: 0.6, ease: ease.move });

  // — B7 · three snaps —
  b = beat("Then the ramp narrows in three snaps: to four pixels, then one, then a quarter pixel. The learning rate drops for the last two, and the optimizer's memory resets at each snap.");
  tl.tween(cam, CAM_PLOT, { at: b.a, dur: 1.4, ease: ease.move });
  tl.tween(widthTag, 0, { at: b.a, dur: 0.5, ease: ease.move });
  const snaps = [b.a + 2.4, b.a + 4.4, b.a + 6.2];
  snaps.forEach((at, i) => {
    const p = PHASES[i + 1];
    tl.set(phaseRow, i + 1, at);
    tl.tween(wLog2, Math.log2(1 / p.sharpness), { at, dur: 0.5, ease: ease.pop });
    tl.tween(resetFlash, 1, { at, dur: 0.2, ease: ease.enter });
    tl.tween(resetFlash, 0, { at: at + 0.5, dur: 0.6, ease: ease.move });
    tl.tween(trainU, p.until, { at: at + 0.4, dur: i === 0 ? 1.5 : 1.3, ease: ease.linear });
  });
  tl.tween(dom, { lo: 20, hi: 40 }, { at: snaps[0], dur: 1.2, ease: ease.move });
  tl.tween(slopDom, { lo: 0, hi: 10 }, { at: snaps[0], dur: 1.2, ease: ease.move });
  tl.tween(lrGlow, 1, { at: b.a + 8.8, dur: 0.5, ease: ease.enter });
  tl.tween(lrGlow, 0, { at: b.a + 10.6, dur: 0.5, ease: ease.move });
  tl.tween(resetGlow, 1, { at: b.a + 10.8, dur: 0.5, ease: ease.enter });

  // — B8 · both land inside their bands —
  b = beat('The title boundary lands at twenty-nine point seven, inside the band from twenty-nine to thirty. The slop boundary lands at four and a half, inside the band from four to five.');
  tl.set(digits, 3, b.a);
  tl.tween(resetGlow, 0, { at: b.a, dur: 0.5, ease: ease.move });
  tl.tween(landT, 1, { at: b.a + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(bandGlow, 1, { at: b.a + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(landS, 1, { at: b.a + 6.8, dur: 0.6, ease: ease.enter });
  tl.tween(slopGlow, 1, { at: b.a + 9.6, dur: 0.6, ease: ease.enter });

  // — B9 · harden and verify —
  b = beat('Round the relation cells to zero or one and you have the hardened circuit. Played against the oracle on three fresh traces of ten thousand frames, it diverges zero times in thirty thousand.');
  tl.tween(cam, CAMERA_HOME, { at: b.a, dur: 1.3, ease: ease.move });
  tl.tween(phaseOp, 0, { at: b.a, dur: 0.6, ease: ease.move });
  tl.tween(relU, 1, { at: b.a + 0.6, dur: 1.0, ease: ease.linear });
  tl.tween(roundU, 1, { at: b.a + 2.0, dur: 0.6, ease: ease.move });
  tl.tween(bitsU, 1, { at: b.a + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(tracesU, 1, { at: b.a + 6.4, dur: 3.6, ease: ease.linear });
  tl.tween(zeroU, 1, { at: b.a + 10.6, dur: 0.5, ease: ease.pop });

  // — B10 · twenty scrambled starts —
  b = beat('Repeat from twenty scrambled starts. All twenty land inside both bands: titles from twenty-nine point three nine to twenty-nine point eight two, slops from four point one seven to four point eight four.');
  tl.tween(verifyOp, 0, { at: b.a, dur: 0.6, ease: ease.move });
  fadeOut([landT, landS, bandGlow, slopGlow], b.a);
  tl.tween(machineOp, 0.12, { at: b.a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_END, { at: b.a, dur: 1.3, ease: ease.move });
  tl.tween(dom, { lo: 20, hi: 90 }, { at: b.a + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(slopDom, { lo: 0, hi: 42 }, { at: b.a + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(sweepOn, 1, { at: b.a + 0.6, dur: 0.5, ease: ease.enter });
  tl.tween(sweepU, 1, { at: b.a + 1.2, dur: 2.4, ease: ease.linear });
  tl.tween(countU, 1, { at: b.a + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(dom, DOM_SWEEP_END, { at: b.a + 4.0, dur: 1.4, ease: ease.move });
  tl.tween(slopDom, SLOP_SWEEP_END, { at: b.a + 4.0, dur: 1.4, ease: ease.move });
  tl.tween(swarmU, 1, { at: b.a + 5.0, dur: 0.8, ease: ease.move });
  tl.tween(rangeT, 1, { at: b.a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(rangeS, 1, { at: b.a + 10.2, dur: 0.6, ease: ease.enter });

  // — B11 · the fixed ramp, from the truth —
  b = beat('Now hold the ramp fixed at four pixels wide, and start from the true values. The title boundary drifts to about thirty point oh one, and the slop boundary to about three point nine seven.');
  tl.tween(cam, CAMERA_HOME, { at: b.a, dur: 1.3, ease: ease.move });
  fadeOut([sweepOn, swarmU, rangeT, rangeS, sweepOp], b.a);
  tl.set(track, 2, b.a + 0.6);
  tl.set(digits, 2, b.a + 0.6);
  tl.tween(machineOp, 1, { at: b.a + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(dom, { lo: 22, hi: 38 }, { at: b.a + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(slopDom, { lo: 0, hi: 10 }, { at: b.a + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(wLog2, 2, { at: b.a + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(fixChip, 1, { at: b.a + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(fixStart, 1, { at: b.a + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(fixedU, 1, { at: b.a + 5.4, dur: 5.0, ease: ease.linear });
  tl.set(digits, 4, b.a + 10.4);
  tl.tween(fixRead, 1, { at: b.a + 10.5, dur: 0.6, ease: ease.enter });

  // — B12 · why: the wide-ramp loss is lowest at 30 —
  b = beat('Why? With a wide ramp the training loss is lowest at thirty, not twenty-nine and a half: about two point five nine thousandths at thirty, two point six three at twenty-nine and a half.');
  tl.tween(fixOp, 0, { at: b.a, dur: 0.6, ease: ease.move });
  tl.tween(lossU, 1, { at: b.a + 0.6, dur: 1.0, ease: ease.draw });
  tl.tween(lossDraw, 1, { at: b.a + 1.4, dur: 1.6, ease: ease.draw });
  tl.tween(densityU, 1, { at: b.a + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(lossMinU, 1, { at: b.a + 4.0, dur: 0.5, ease: ease.pop });
  tl.tween(minMarkU, 1, { at: b.a + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(lossTrueU, 1, { at: b.a + 10.6, dur: 0.6, ease: ease.enter });

  // — B13 · hardened, it diverges; the summary —
  b = beat("Hardened, that drifted circuit diverges from the oracle in nine thousand one hundred twenty of ten thousand frames, starting at frame one thirty-five. The narrowing isn't a detail. It's what makes recovery work.");
  fadeOut([densityU, minMarkU], b.a);
  tl.tween(lossOp, 0.12, { at: b.a, dur: 0.6, ease: ease.move });
  tl.tween(barU, 1, { at: b.a + 0.5, dur: 0.6, ease: ease.enter });
  tl.tween(barFill, 1, { at: b.a + 1.0, dur: 2.6, ease: ease.linear });
  tl.tween(firstU, 1, { at: b.a + 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_END, { at: b.a + 8.6, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: b.a + 8.8, dur: 0.8, ease: ease.move });
  tl.tween(summaryU, 1, { at: b.a + 9.4, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.6);

  return {
    tl, cam, axisU, rampU, onAxis, sharpG, eqU, sliderU, halfU, clampGlow, dom, slopDom, wLog2, stepU, gradU,
    titleManual, slopManual, track, trainU, fixedU, digits, lineU, bandU, bandGlow, slopGlow, dotsU, spot2, pullU,
    widthTag, slopU, machineOp, densityU, minMarkU, sweepOn, sweepU, swarmU, rangeT, rangeS, winU, measureU, codeU,
    codeLine, paramsU, paramsOp, paramSpot, lockU, cardU, cardIn, cardOut, pileU, tagU, cardOp, phaseU, phaseOp,
    phaseRow, resetFlash, lrGlow, resetGlow, landT, landS, relU, roundU, bitsU, tracesU, zeroU, verifyOp, countU,
    sweepOp, fixChip, fixStart, fixRead, fixOp, lossU, lossDraw, lossMinU, lossTrueU, lossOp, barU, barFill, firstU,
    endDim, summaryU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color = colors.TEXT, stroke = colors.GRID, size = 14, opacity = 1, anchor = 'start', fill = colors.PANEL }: {
  x: number; y: number; text: string; color?: string; stroke?: string; size?: number; opacity?: number; anchor?: 'start' | 'middle'; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (size === 13 ? CH13 : size * 0.602) + 20;
  const h = size + 12;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text x={x0 + 10} y={y + h / 2 + size * 0.36} fontSize={size} fontFamily={MONO} fill={color} xmlSpace="preserve">
        {text}
      </text>
    </g>
  );
}

function Padlock({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={1.8} fill="none">
      <path d={`M ${x - 5} ${y - 2} L ${x - 5} ${y - 7} A 5 5 0 0 1 ${x + 5} ${y - 7} L ${x + 5} ${y - 2}`} />
      <rect x={x - 8} y={y - 2} width={16} height={12} rx={2} fill={color} fillOpacity={0.25} />
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, width = 2.5, head = 9, opacity = 1 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - head * Math.cos(a);
  const hy = y2 - head * Math.sin(a);
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${hx + (head * 0.55) * Math.sin(a)},${hy - (head * 0.55) * Math.cos(a)} ${hx - (head * 0.55) * Math.sin(a)},${hy + (head * 0.55) * Math.cos(a)}`}
        fill={color}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const d = s.get(scene.dom);
  const sd = s.get(scene.slopDom);
  const X = xOf(d);
  const SX = xOf(sd);
  const ppu = (PX1 - PX0) / (d.hi - d.lo);

  // which boundary values are live
  const track = Math.round(v(scene.track));
  const B = track === 1 ? trajAt(SEED1_TITLE, v(scene.trainU)) : track === 2 ? trajAt(FIXED_TITLE, v(scene.fixedU)) : v(scene.titleManual);
  const S = track === 1 ? trajAt(SEED1_SLOP, v(scene.trainU)) : track === 2 ? trajAt(FIXED_SLOP, v(scene.fixedU)) : v(scene.slopManual);
  const W = Math.pow(2, v(scene.wLog2)); // ramp width, px
  const dig = Math.round(v(scene.digits));
  const titleIn = B >= 29 && B < 30;
  const slopIn = S > 4 && S <= 5;

  const endDim = v(scene.endDim);
  const dimAll = lerp(1, 0.12, endDim);
  const mOp = v(scene.machineOp) * dimAll;
  const axisU = v(scene.axisU);
  const onAxis = v(scene.onAxis);
  const stepU = v(scene.stepU);
  // labels crossfade in sequence (generic out, then offsets in) so the two axes never print over each other
  const genLbl = clamp01(1 - 2 * onAxis);
  const ttlLbl = clamp01(2 * onAxis - 1);

  // ---- the ramp polyline: generic (difference axis, ascending) → title test (offset axis, descending)
  const wg = 1 / v(scene.sharpG);
  const gen: Array<[number, number]> = [[PX0, Y0], [GX(-wg / 2), Y0], [GX(wg / 2), Y1], [PX1, Y1]];
  const aRamp = lerp(X(B - W / 2), X(B), stepU);
  const bRamp = lerp(X(B + W / 2), X(B), stepU);
  const ttl: Array<[number, number]> = [[Math.min(PX0, aRamp), Y1], [aRamp, Y1], [bRamp, Y0], [Math.max(PX1, bRamp), Y0]];
  const pts = gen.map((p, i) => [lerp(p[0], ttl[i][0], onAxis), lerp(p[1], ttl[i][1], onAxis)] as [number, number]);
  const rampLen = pts.slice(1).reduce((acc, p, i) => acc + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

  // ---- dots: one per integer offset in view, at its oracle target
  const dotsU = v(scene.dotsU);
  const spot2 = v(scene.spot2);
  const pullU = v(scene.pullU);
  const offsets: number[] = [];
  for (let o = Math.max(1, Math.ceil(d.lo)); o <= Math.min(110, Math.floor(d.hi)); o++) offsets.push(o);
  const dotScale = Math.min(1, ppu / 13);

  const ticks = ticksFor(d);
  const sticks = ticksFor(sd, 40);
  const sweepOn = v(scene.sweepOn);
  const sweepU = v(scene.sweepU);
  const swarmU = v(scene.swarmU);

  // right-column phase table state
  const row = Math.round(v(scene.phaseRow));

  const lineOp = v(scene.lineU) * mOp;
  const label = `titleBoundary = ${B.toFixed(dig)}`;
  const slabel = `slopBoundary = ${S.toFixed(dig)}`;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="ew2-plot">
          <rect x={PX0 - 2} y={Y1 - 60} width={PX1 - PX0 + 4} height={Y0 - Y1 + 80} />
        </clipPath>
        <clipPath id="ew2-slop">
          <rect x={PX0 - 2} y={SLOP_Y - 40} width={PX1 - PX0 + 4} height={80} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the machine: a ramp over an axis ================= */}
        <g opacity={mOp}>
          {/* y labels */}
          <g opacity={axisU} fontFamily={MONO} fontSize={14} fill={colors.MUTED} textAnchor="end">
            <text x={PX0 - 12} y={Y1 + 5}>1</text>
            <text x={PX0 - 12} y={Y0 + 5}>0</text>
          </g>
          <line x1={PX0} y1={Y1} x2={PX1} y2={Y1} stroke={colors.GRID} strokeDasharray="3 5" opacity={axisU} />
          <line x1={PX0} y1={AXIS_Y} x2={lerp(PX0, PX1, axisU)} y2={AXIS_Y} stroke={colors.MUTED} strokeWidth={1.5} />
          <line x1={PX0} y1={Y0} x2={lerp(PX0, PX1, axisU)} y2={Y0} stroke={colors.GRID} />
          <text x={PX0} y={Y1 - 26} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={axisU * ttlLbl * (1 - v(scene.densityU))}>
            pressOnTitle
          </text>
          <text x={PX0} y={Y1 - 26} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={axisU * genLbl}>
            bit
          </text>

          {/* generic difference axis (B1) */}
          {genLbl > 0.005 && (
            <g opacity={genLbl * axisU}>
              {[-2, -1, 0, 1, 2].map((t) => (
                <g key={t}>
                  <line x1={GX(t)} y1={AXIS_Y} x2={GX(t)} y2={AXIS_Y + 6} stroke={colors.MUTED} />
                  <text x={GX(t)} y={AXIS_Y + 22} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                    {t < 0 ? `−${-t}` : t}
                  </text>
                </g>
              ))}
              <text x={(PX0 + PX1) / 2} y={AXIS_Y + 46} textAnchor="middle" fontSize={15} fill={colors.TEXT}>
                difference × sharpness
              </text>
            </g>
          )}

          {/* offset axis (B2 →) */}
          {ttlLbl > 0.005 && (
            <g opacity={ttlLbl * axisU}>
              {ticks.vals.map((t) => {
                const key29 = (t === 29 || t === 30) && ticks.step <= 1;
                return (
                  <g key={t}>
                    <line x1={X(t)} y1={AXIS_Y} x2={X(t)} y2={AXIS_Y + 6} stroke={colors.MUTED} />
                    <text x={X(t)} y={AXIS_Y + 22} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={key29 ? colors.TEXT : colors.MUTED} fontWeight={key29 ? 700 : 400}>
                      {tickText(t)}
                    </text>
                  </g>
                );
              })}
              <text x={(PX0 + PX1) / 2} y={AXIS_Y + 42} textAnchor="middle" fontSize={15} fill={colors.TEXT}>
                offset below the window's top (px)
              </text>
            </g>
          )}

          {/* the band [29, 30) */}
          {v(scene.bandU) > 0.005 && X(30) > PX0 && X(29) < PX1 && (
            <g opacity={v(scene.bandU)}>
              <rect
                x={Math.max(PX0, X(29))}
                y={Y1 - 22}
                width={Math.max(0, Math.min(PX1, X(30)) - Math.max(PX0, X(29)))}
                height={Y0 - Y1 + 34}
                fill={track === 2 && !titleIn && v(scene.fixedU) > 0.98 ? colors.NEGATIVE : colors.POSITIVE}
                opacity={0.1 + 0.14 * v(scene.bandGlow)}
              />
              {X(30) - X(29) > 40 && (
                <text x={(X(29) + X(30)) / 2} y={Y1 - 28} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.POSITIVE}>
                  [29, 30)
                </text>
              )}
            </g>
          )}

          {/* dots: title presses at 1, body presses at 0; size ∝ √(presses at that offset) */}
          {dotsU > 0.005 && (
            <g clipPath="url(#ew2-plot)">
              {offsets.map((o, k) => {
                const u = staggerU(dotsU, k, offsets.length, 0.02, 0.3);
                if (u <= 0) return null;
                const title = isTitle(o);
                const cx = X(o);
                const cy = title ? Y1 : Y0;
                const r = (1.6 + 0.72 * Math.sqrt(HIST[o])) * dotScale;
                // spotlight: B2 → 29 and 30; B6 → presses inside the unsaturated ramp
                let op = 1;
                if (spot2 > 0) op = lerp(1, o === 29 || o === 30 ? 1 : 0.28, spot2);
                if (pullU > 0) op = lerp(op, Math.abs(o - B) < W / 2 ? 1 : 0.15, pullU);
                if (sweepOn > 0) op *= 1 - sweepOn;
                return <circle key={o} cx={cx} cy={cy} r={r * u} fill={title ? colors.WARM : colors.ACCENT} opacity={op * 0.9} />;
              })}
            </g>
          )}
          {spot2 > 0.005 && (
            <g opacity={spot2} fontSize={14} fontFamily={MONO}>
              <text x={X(29) - 12} y={Y1 + 30} textAnchor="end" fill={colors.WARM}>29 → title</text>
              <text x={X(30) + 12} y={Y0 - 18} fill={colors.ACCENT}>30 → body</text>
            </g>
          )}

          {/* the ramp itself: violet, straight-sided */}
          <g clipPath="url(#ew2-plot)" opacity={1 - 0.88 * sweepOn}>
            {onAxis > 0.005 && stepU < 0.5 && (
              <rect x={Math.max(PX0, aRamp)} y={Y1} width={Math.max(0, Math.min(PX1, bRamp) - Math.max(PX0, aRamp))} height={Y0 - Y1} fill={colors.SECONDARY} opacity={0.1 * onAxis * (1 - 2 * stepU)} />
            )}
            <polyline
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke={colors.SECONDARY}
              strokeWidth={3.5}
              strokeLinejoin="round"
              strokeDasharray={rampLen}
              strokeDashoffset={rampLen * (1 - v(scene.rampU))}
            />
            {v(scene.clampGlow) > 0.005 && (
              <g opacity={v(scene.clampGlow)} stroke={colors.SECONDARY} strokeWidth={12} strokeOpacity={0.3} strokeLinecap="round">
                <line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} />
                <line x1={pts[2][0]} y1={pts[2][1]} x2={pts[3][0]} y2={pts[3][1]} />
              </g>
            )}
          </g>
          {v(scene.clampGlow) > 0.005 && (
            <g opacity={v(scene.clampGlow)} fontSize={14} fontFamily={MONO} fill={colors.SECONDARY}>
              <text x={PX0 + 10} y={Y0 - 12}>clamped at 0</text>
              <text x={PX1 - 10} y={Y1 - 14} textAnchor="end">clamped at 1</text>
            </g>
          )}
          {/* + 0.5: difference 0 sits at one half */}
          {v(scene.halfU) > 0.005 && (
            <g opacity={v(scene.halfU) * (1 - onAxis)}>
              <line x1={GX(0)} y1={(Y0 + Y1) / 2} x2={PX0} y2={(Y0 + Y1) / 2} stroke={colors.MUTED} strokeDasharray="3 4" />
              <circle cx={GX(0)} cy={(Y0 + Y1) / 2} r={6} fill={colors.WARM} />
              <text x={PX0 - 12} y={(Y0 + Y1) / 2 + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.WARM}>0.5</text>
              <text x={GX(0) + 14} y={(Y0 + Y1) / 2 + 22} fontSize={14} fontFamily={MONO} fill={colors.WARM}>+ 0.5 centres it</text>
            </g>
          )}

          {/* shipped: rounded to a step — no slope */}
          {stepU > 0.4 && (
            <text x={X(B) + 14} y={(Y0 + Y1) / 2 + 5} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01((stepU - 0.4) / 0.4)}>
              flat on both sides: nothing to follow
            </text>
          )}
          {/* training copy: the gradient rides the slope */}
          {v(scene.gradU) > 0.005 && (() => {
            const g = v(scene.gradU);
            const ax = lerp(aRamp, bRamp, 0.2 + 0.55 * g);
            const ay = lerp(Y1, Y0, 0.2 + 0.55 * g);
            return (
              <g opacity={clamp01(g * 3)}>
                <circle cx={ax} cy={ay} r={7} fill={colors.WARM} />
                <Arrow x1={ax + 14} y1={ay - 30} x2={ax + 44} y2={ay + 18} color={colors.WARM} />
                <text x={ax + 52} y={ay + 2} fontSize={14} fontFamily={MONO} fill={colors.WARM}>slope ≠ 0: gradient</text>
              </g>
            );
          })()}

          {/* the boundary line */}
          {lineOp > 0.005 && X(B) >= PX0 - 1 && X(B) <= PX1 + 1 && (
            <g opacity={lineOp * (1 - 0.88 * sweepOn)}>
              <line x1={X(B)} y1={Y1 - 46} x2={X(B)} y2={AXIS_Y} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="5 4" />
              <text x={X(B)} y={Y1 - 52} textAnchor={X(B) > PX1 - 120 ? 'end' : X(B) < PX0 + 120 ? 'start' : 'middle'} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                {label}
              </text>
            </g>
          )}
          {/* ramp width tag (B6) + the pull */}
          {v(scene.widthTag) > 0.005 && (
            <g opacity={v(scene.widthTag)}>
              <line x1={Math.max(PX0, aRamp)} y1={Y0 + 14} x2={Math.min(PX1, bRamp)} y2={Y0 + 14} stroke={colors.SECONDARY} strokeWidth={2} />
              <line x1={aRamp} y1={Y0 + 8} x2={aRamp} y2={Y0 + 20} stroke={colors.SECONDARY} strokeWidth={2} />
              <line x1={bRamp} y1={Y0 + 8} x2={bRamp} y2={Y0 + 20} stroke={colors.SECONDARY} strokeWidth={2} />
              <rect x={(aRamp + bRamp) / 2 - 92} y={Y0 - 52} width={184} height={24} rx={5} fill={colors.BG} opacity={0.85} />
              <text x={(aRamp + bRamp) / 2} y={Y0 - 35} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.SECONDARY}>
                width 32 px (1/32)
              </text>
            </g>
          )}
          {pullU > 0.005 && (
            <g opacity={pullU}>
              <Arrow x1={X(B) - 8} y1={(Y0 + Y1) / 2} x2={X(B) - 70} y2={(Y0 + Y1) / 2} color={colors.ACCENT} width={3} head={11} />
              <text x={X(B) - 78} y={(Y0 + Y1) / 2 + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.ACCENT}>
                pull from presses within ±16 px
              </text>
            </g>
          )}
          {/* B12: presses per pixel row, and the fixed-ramp loss minimum on the axis */}
          {v(scene.densityU) > 0.005 && (
            <g opacity={v(scene.densityU)} fontSize={14} fontFamily={MONO}>
              <text x={X(22.3)} y={Y1 + 30} fill={colors.WARM}>≈{TITLE_PER_ROW} title presses per px row</text>
              <text x={X(37.8)} y={Y0 - 18} textAnchor="end" fill={colors.ACCENT}>≈{BODY_PER_ROW} body presses per px row</text>
            </g>
          )}
          {v(scene.minMarkU) > 0.005 && (
            <g opacity={v(scene.minMarkU)}>
              <line x1={X(30)} y1={Y1 - 20} x2={X(30)} y2={AXIS_Y} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={X(30) + 8} y={AXIS_Y - 6} fontSize={14} fontFamily={MONO} fill={colors.NEGATIVE}>loss minimum</text>
            </g>
          )}

          {/* ---- slop strip ---- */}
          {v(scene.slopU) > 0.005 && (() => {
            const u = v(scene.slopU);
            const aS = SX(S - W / 2);
            const bS = SX(S + W / 2);
            return (
              <g opacity={u}>
                <text x={PX0} y={SLOP_Y - 36} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  slop · chebyshev distance (px)
                </text>
                <line x1={PX0} y1={SLOP_Y} x2={lerp(PX0, PX1, u)} y2={SLOP_Y} stroke={colors.MUTED} strokeWidth={1.5} />
                <g clipPath="url(#ew2-slop)">
                  {SX(5) > PX0 && SX(4) < PX1 && (
                    <rect x={SX(4)} y={SLOP_Y - 12} width={SX(5) - SX(4)} height={24} fill={track === 2 && !slopIn && v(scene.fixedU) > 0.98 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.12 + 0.16 * v(scene.slopGlow)} />
                  )}
                  {sweepOn < 0.99 && <rect x={aS} y={SLOP_Y - 8} width={Math.max(0, bS - aS)} height={16} fill={colors.SECONDARY} opacity={0.25 * (1 - sweepOn)} />}
                </g>
                {sticks.vals.map((t) => (
                  <g key={t}>
                    <line x1={SX(t)} y1={SLOP_Y} x2={SX(t)} y2={SLOP_Y + 5} stroke={colors.MUTED} />
                    <text x={SX(t)} y={SLOP_Y + 21} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>{tickText(t)}</text>
                  </g>
                ))}
                {SX(5) - SX(4) > 34 && SX(5) <= PX1 && (
                  <text x={(SX(4) + SX(5)) / 2} y={SLOP_Y - 16} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.POSITIVE} opacity={1 - sweepOn}>
                    (4, 5]
                  </text>
                )}
                {SX(S) >= PX0 && SX(S) <= PX1 && (
                  <g opacity={1 - 0.88 * sweepOn}>
                    <line x1={SX(S)} y1={SLOP_Y - 12} x2={SX(S)} y2={SLOP_Y + 10} stroke={colors.TEXT} strokeWidth={2.5} />
                    <text x={SX(S)} y={SLOP_Y + 40} fontSize={13} fontFamily={MONO} fill={colors.TEXT} textAnchor={SX(S) > PX1 - 90 ? 'end' : SX(S) < PX0 + 90 ? 'start' : 'middle'}>
                      {slabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </g>

        {/* ================= B10 · twenty scrambled starts ================= */}
        {sweepOn > 0.005 && (
          <g opacity={sweepOn * dimAll}>
            {SWEEP_TITLE.map((tr, i) => {
              const x = X(trajAt(tr, sweepU));
              if (x < PX0 - 2 || x > PX1 + 2) return null;
              const y = lerp((Y0 + Y1) / 2 - 40 + (i % 5) * 20, Y1 + 30 + TITLE_ROWS[i] * (2 * SWARM_R + 3), swarmU);
              return (
                <g key={i}>
                  <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={colors.TEXT} strokeWidth={1.5} opacity={0.6 * (1 - swarmU)} />
                  <circle cx={x} cy={y} r={lerp(2.5, SWARM_R, swarmU)} fill={colors.TEXT} opacity={0.85} />
                </g>
              );
            })}
            {SWEEP_SLOP.map((tr, i) => {
              const x = SX(trajAt(tr, sweepU));
              if (x < PX0 - 2 || x > PX1 + 2) return null;
              // identical end points (ten seeds land on 4.500) stack as one brighter tick
              return <line key={i} x1={x} y1={SLOP_Y - 10 - 6 * swarmU} x2={x} y2={SLOP_Y + 10} stroke={colors.TEXT} strokeWidth={lerp(1.5, 2.5, swarmU)} opacity={0.4} />;
            })}
            {v(scene.rangeT) > 0.005 && (
              <g opacity={v(scene.rangeT)}>
                <line x1={X(TITLE_MIN)} y1={Y1 + 4} x2={X(TITLE_MAX)} y2={Y1 + 4} stroke={colors.POSITIVE} strokeWidth={2} />
                <line x1={X(TITLE_MIN)} y1={Y1 - 2} x2={X(TITLE_MIN)} y2={Y1 + 10} stroke={colors.POSITIVE} strokeWidth={2} />
                <line x1={X(TITLE_MAX)} y1={Y1 - 2} x2={X(TITLE_MAX)} y2={Y1 + 10} stroke={colors.POSITIVE} strokeWidth={2} />
                <text x={(X(TITLE_MIN) + X(TITLE_MAX)) / 2} y={Y1 - 10} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.POSITIVE}>
                  title {TITLE_MIN.toFixed(3)} … {TITLE_MAX.toFixed(3)}
                </text>
              </g>
            )}
            {v(scene.rangeS) > 0.005 && (
              <text x={(SX(SLOP_MIN) + SX(SLOP_MAX)) / 2} y={SLOP_Y + 62} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.POSITIVE} opacity={v(scene.rangeS)}>
                slop {SLOP_MIN.toFixed(3)} … {SLOP_MAX.toFixed(3)}
              </text>
            )}
          </g>
        )}

        {/* ================= B1 · equation + sharpness slider ================= */}
        {v(scene.eqU) > 0.005 && (
          <g opacity={v(scene.eqU)}>
            <rect x={210} y={108} width={460} height={32} rx={7} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={440} y={129} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              bit = clamp01(difference × sharpness + 0.5)
            </text>
          </g>
        )}
        {v(scene.sliderU) > 0.005 && (() => {
          const sh = v(scene.sharpG);
          const kx = lerp(250, 630, (Math.log2(sh) + 1) / 2);
          return (
            <g opacity={v(scene.sliderU)}>
              <text x={240} y={AXIS_Y + 82} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>sharpness</text>
              <line x1={250} y1={AXIS_Y + 77} x2={630} y2={AXIS_Y + 77} stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" />
              <circle cx={kx} cy={AXIS_Y + 77} r={8} fill={colors.SECONDARY} />
              <text x={642} y={AXIS_Y + 82} fontSize={14} fontFamily={MONO} fill={colors.SECONDARY}>
                {sh.toFixed(2)} → width {(1 / sh).toFixed(2)}
              </text>
            </g>
          );
        })()}

        {/* ================= right column ================= */}
        <g opacity={dimAll}>
          {/* B2 · the window and its measure */}
          {v(scene.winU) > 0.005 && (() => {
            const wx = RX + 20, wy = 170, ww = 300, wh = 200, th = 30; // rectangle 0: 300 × 200, title bar 30 px
            const px = wx + 196, py = wy + 22;
            return (
              <g opacity={v(scene.winU)}>
                <rect x={wx} y={wy} width={ww} height={wh} rx={4} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
                <rect x={wx} y={wy} width={ww} height={th} rx={4} fill={colors.WARM} opacity={0.22} />
                <line x1={wx} y1={wy + th} x2={wx + ww} y2={wy + th} stroke={colors.WARM} strokeWidth={1.2} />
                <text x={wx + 12} y={wy + th + 26} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>rectangle 0 · 300 × 200</text>
                <text x={wx + 12} y={wy + 20} fontSize={13} fontFamily={MONO} fill={colors.WARM}>title bar</text>
                <g opacity={v(scene.measureU)}>
                  <line x1={px + 30} y1={wy} x2={px + 30} y2={py} stroke={colors.TEXT} strokeWidth={1.5} />
                  <line x1={px + 25} y1={wy} x2={px + 35} y2={wy} stroke={colors.TEXT} strokeWidth={1.5} />
                  <line x1={px + 25} y1={py} x2={px + 35} y2={py} stroke={colors.TEXT} strokeWidth={1.5} />
                  <text x={wx + 12} y={wy + wh - 50} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>measure = eventY − hitTop</text>
                  <text x={wx + 12} y={wy + wh - 26} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>titleHeight = 30</text>
                  <text x={wx + 12} y={wy + wh + 30} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>oracle: title if offset &lt; 30</text>
                </g>
                <circle cx={px} cy={py} r={6} fill={colors.TEXT} stroke={colors.BG} strokeWidth={2} />
              </g>
            );
          })()}

          {/* B3 · the one line that differs */}
          {v(scene.codeU) > 0.005 && (() => {
            const lines = ['const bit = (score) =>', "  mode === 'exact'", '    ? circuit.boolean(score)', '    : score'];
            const cl = Math.round(v(scene.codeLine));
            const y0 = 190;
            return (
              <g opacity={v(scene.codeU)}>
                <rect x={RX} y={y0} width={RW} height={lines.length * 22 + 18} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                <rect x={RX} y={y0} width={4} height={lines.length * 22 + 18} rx={2} fill={colors.SECONDARY} />
                {lines.map((l, i) => {
                  const hot = (cl === 1 && i === 2) || (cl === 2 && i === 3);
                  return (
                    <g key={i}>
                      {hot && <rect x={RX + 8} y={y0 + 9 + i * 22} width={RW - 16} height={21} rx={3} fill={colors.WARM} opacity={0.2} />}
                      <text x={RX + 16} y={y0 + 25 + i * 22} fontSize={14} fontFamily={MONO} fill={colors.TEXT} xmlSpace="preserve">{l}</text>
                    </g>
                  );
                })}
                <Chip x={RX} y={y0 + 120} text="shipped · exact · 0 or 1" color={colors.MUTED} opacity={cl === 1 ? 1 : 0.35} />
                <Chip x={RX} y={y0 + 160} text="training copy · 0 boolean atoms" color={colors.SECONDARY} opacity={cl === 2 ? 1 : 0.35} />
              </g>
            );
          })()}

          {/* B4 · behaviorParameterCells */}
          {v(scene.paramsU) > 0.005 && (() => {
            const spot = Math.round(v(scene.paramSpot));
            const names = ['titleBoundary', 'slopBoundary', ...RELATIONS.map((r) => r.name)];
            return (
              <g opacity={v(scene.paramsOp)}>
                <text x={RX} y={164} fontSize={15} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.paramsU)}>behaviorParameterCells</text>
                {names.map((n, i) => {
                  const u = staggerU(v(scene.paramsU), i, 6, 0.12, 0.4);
                  const hot = spot === 0 || (spot === 1 && i < 2) || (spot === 2 && i >= 2);
                  return (
                    <g key={n} opacity={u * (hot ? 1 : 0.15)}>
                      <rect x={RX} y={178 + i * 38} width={RW} height={30} rx={6} fill={colors.PANEL} stroke={i < 2 ? colors.SECONDARY : colors.WARM} strokeWidth={1.4} />
                      <text x={RX + 14} y={198 + i * 38} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>{n}</text>
                      <text x={RX + RW - 12} y={198 + i * 38} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                        {i < 2 ? 'boundary' : 'relation'}
                      </text>
                    </g>
                  );
                })}
                {v(scene.lockU) > 0.005 && (
                  <g opacity={v(scene.lockU)}>
                    <rect x={RX} y={420} width={RW} height={34} rx={6} fill={colors.PANEL} stroke={colors.MUTED} strokeDasharray="4 4" />
                    <Padlock x={RX + 22} y={436} color={colors.MUTED} />
                    <text x={RX + 42} y={442} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>latch structure · authored</text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* B5 · one frame → one example */}
          {v(scene.cardU) > 0.005 && (
            <g opacity={v(scene.cardU)}>
              {Array.from({ length: 6 }, (_, k) => 5 - k).map((k) => (
                <rect key={k} x={RX + 10 + k * 5} y={190 - k * 6} width={RW - 40} height={150} rx={8} fill={colors.PANEL} stroke={colors.GRID} opacity={staggerU(v(scene.pileU), k, 6, 0.1, 0.4) * (k === 0 ? 1 : 0.8)} />
              ))}
              <rect x={RX + 10} y={190} width={RW - 40} height={150} rx={8} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.2} />
              <text x={RX + 26} y={216} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>one frame</text>
              <g opacity={v(scene.cardIn)}>
                <text x={RX + 26} y={248} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>input + oracle state</text>
              </g>
              <g opacity={v(scene.cardOut)}>
                <text x={RX + 26} y={280} fontSize={15} fontFamily={MONO} fill={colors.WARM}>→ {SUPERVISED_BITS} decision bits</text>
                <text x={RX + 26} y={312} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>supervisedBitCount = {SUPERVISED_BITS}</text>
              </g>
              <text x={RX + RW - 10} y={372} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.pileU)}>
                {commas(PAIRS)} pairs
              </text>
              <Chip x={RX} y={392} text="single frames · no backprop through time" size={13} color={colors.POSITIVE} stroke={colors.POSITIVE} opacity={v(scene.tagU)} />
            </g>
          )}

          {/* B6–B8 · the annealing schedule */}
          {v(scene.phaseU) > 0.005 && (
            <g opacity={v(scene.phaseU) * v(scene.phaseOp)}>
              <text x={RX} y={166} fontSize={14} fontFamily={MONO} fill={colors.MUTED} xmlSpace="preserve">
                {'sharpness   width     lr'}
              </text>
              {PHASES.map((p, i) => {
                const active = i === row;
                return (
                  <g key={i} opacity={active ? 1 : i < row ? 0.4 : 0.6}>
                    <rect x={RX - 8} y={176 + i * 38} width={RW + 8} height={30} rx={6} fill={active ? colors.SECONDARY : colors.PANEL} fillOpacity={active ? 0.18 : 1} stroke={active ? colors.SECONDARY : colors.GRID} />
                    <text x={RX} y={196 + i * 38} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>{p.sh}</text>
                    <text x={RX + 100} y={196 + i * 38} fontSize={14} fontFamily={MONO} fill={colors.SECONDARY}>{widthLabel(p.sharpness)}</text>
                    <text x={RX + 184} y={196 + i * 38} fontSize={14} fontFamily={MONO} fill={i >= 2 && v(scene.lrGlow) > 0.3 ? colors.WARM : colors.TEXT}>×{p.lr}</text>
                    {i > 0 && (
                      <text x={RX + RW - 8} y={196 + i * 38} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={0.5 + 0.5 * v(scene.resetGlow)}>
                        reset
                      </text>
                    )}
                    {i === 0 && (
                      <text x={RX + RW - 8} y={196} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>start</text>
                    )}
                  </g>
                );
              })}
              {v(scene.lrGlow) > 0.005 && (
                <rect x={RX + 176} y={248} width={54} height={68} rx={6} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={v(scene.lrGlow)} />
              )}
              {v(scene.resetGlow) > 0.005 && (
                <rect x={RX + RW - 60} y={210} width={58} height={106} rx={6} fill="none" stroke={colors.TEXT} strokeWidth={2} opacity={v(scene.resetGlow)} />
              )}
              <text x={RX} y={350} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.resetFlash)}>
                optimizer moments reset
              </text>
              <g opacity={v(scene.landT)}>
                <text x={RX} y={392} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>title 85.95 → {SEED1_TITLE[SEED1_TITLE.length - 1].toFixed(3)}</text>
              </g>
              <g opacity={v(scene.landS)}>
                <text x={RX} y={420} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>slop  12.86 → {SEED1_SLOP[SEED1_SLOP.length - 1].toFixed(3)}</text>
              </g>
            </g>
          )}

          {/* B9 · harden, verify */}
          {v(scene.relU) > 0.005 && (
            <g opacity={v(scene.verifyOp)}>
              <text x={RX} y={164} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.relU)}>relation cells: learned → hardened</text>
              {RELATIONS.map((r, i) => {
                const u = staggerU(v(scene.relU), i, 4, 0.12, 0.4);
                const ro = v(scene.roundU);
                return (
                  <g key={r.name} opacity={u}>
                    <rect x={RX} y={176 + i * 34} width={RW} height={28} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
                    <text x={RX + 12} y={195 + i * 34} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>{r.name}</text>
                    <text x={RX + RW - 12} y={195 + i * 34} textAnchor="end" fontSize={14} fontFamily={MONO} fill={ro > 0.5 ? colors.WARM : colors.MUTED}>
                      {ro > 0.5 ? String(r.learned >= 0.5 ? 1 : 0) : r.learned.toFixed(3)}
                    </text>
                  </g>
                );
              })}
              {v(scene.bitsU) > 0.005 && (
                <g opacity={clamp01(v(scene.bitsU))}>
                  <text x={RX} y={338} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>hardened</text>
                  <text x={RX + 90} y={340} fontSize={24} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>{HARDENED}</text>
                </g>
              )}
              {v(scene.tracesU) > 0.005 &&
                HELD_OUT.map((seed, i) => {
                  const u = staggerU(v(scene.tracesU), i, 3, 0.35, 0.6);
                  const y = 370 + i * 26;
                  return (
                    <g key={seed}>
                      <text x={RX} y={y + 13} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>{commas(seed)}</text>
                      <rect x={RX + 56} y={y} width={RW - 56} height={16} rx={3} fill="none" stroke={colors.GRID} />
                      <rect x={RX + 56} y={y} width={(RW - 56) * u} height={16} rx={3} fill={colors.POSITIVE} opacity={0.7} />
                    </g>
                  );
                })}
              {v(scene.zeroU) > 0.005 && (
                <text x={RX} y={474} fontSize={17} fontFamily={MONO} fontWeight={700} fill={colors.POSITIVE} opacity={clamp01(v(scene.zeroU))}>
                  0 / {commas(3 * FRAMES)} frames diverge
                </text>
              )}
            </g>
          )}

          {/* B10 · counter */}
          {v(scene.countU) > 0.005 && (
            <g opacity={clamp01(v(scene.countU)) * v(scene.sweepOp)}>
              <text x={RX + 10} y={240} fontSize={44} fontFamily={MONO} fontWeight={700} fill={colors.POSITIVE}>20 / 20</text>
              <text x={RX + 12} y={270} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>recovered</text>
              <text x={RX + 12} y={300} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>each: 0 / 30,000 diverge</text>
              <text x={RX + 12} y={324} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>title in [29, 30) · slop in (4, 5]</text>
            </g>
          )}

          {/* B11 · the fixed ramp */}
          {v(scene.fixChip) > 0.005 && (
            <g opacity={v(scene.fixChip) * v(scene.fixOp)}>
              <Chip x={RX} y={170} text="fixed: sharpness 0.25 → 4 px" color={colors.SECONDARY} stroke={colors.SECONDARY} />
              <text x={RX} y={226} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>no annealing · no resets</text>
              <g opacity={v(scene.fixStart)}>
                <text x={RX} y={268} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>start at the truth: 29.5 · 4.5</text>
              </g>
              <g opacity={v(scene.fixRead)}>
                <text x={RX} y={310} fontSize={16} fontFamily={MONO} fill={colors.NEGATIVE}>title 30.0138 · slop 3.9671</text>
                <text x={RX} y={336} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>both outside their bands</text>
              </g>
            </g>
          )}

          {/* B12 · the loss grid */}
          {v(scene.lossU) > 0.005 && (
            <g opacity={v(scene.lossU) * v(scene.lossOp)}>
              <text x={RX} y={176} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>mean training loss · 4 px ramp</text>
              <line x1={LC.x0} y1={LC.y0 + 12} x2={LC.x1} y2={LC.y0 + 12} stroke={colors.MUTED} strokeWidth={1.5} />
              {[29, 29.5, 30, 30.5].map((g) => (
                <g key={g}>
                  <line x1={lossX(g)} y1={LC.y0 + 12} x2={lossX(g)} y2={LC.y0 + 18} stroke={colors.MUTED} />
                  <text x={lossX(g)} y={LC.y0 + 34} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>{g}</text>
                </g>
              ))}
              <text x={(LC.x0 + LC.x1) / 2} y={LC.y0 + 56} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>titleBoundary</text>
              {(() => {
                const u = v(scene.lossDraw);
                const n = Math.max(1, u * (LOSS.length - 1));
                const shown = LOSS_GRID.map((g, i) => [lossX(g), lossY(LOSS[i])] as [number, number]).filter((_, i) => i <= Math.floor(n));
                const fi = Math.floor(n);
                if (fi < LOSS.length - 1) {
                  const f = n - fi;
                  shown.push([lerp(lossX(LOSS_GRID[fi]), lossX(LOSS_GRID[fi + 1]), f), lerp(lossY(LOSS[fi]), lossY(LOSS[fi + 1]), f)]);
                }
                return (
                  <>
                    <polyline points={shown.map((p) => p.join(',')).join(' ')} fill="none" stroke={colors.SECONDARY} strokeWidth={2.5} opacity={u > 0 ? 1 : 0} />
                    {LOSS_GRID.map((g, i) => (i <= n ? <circle key={g} cx={lossX(g)} cy={lossY(LOSS[i])} r={5} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} /> : null))}
                  </>
                );
              })()}
              {v(scene.lossMinU) > 0.005 && (
                <g opacity={clamp01(v(scene.lossMinU))}>
                  <circle cx={lossX(30)} cy={lossY(LOSS[LOSS_MIN_I])} r={8} fill={colors.NEGATIVE} />
                  <text x={lossX(30)} y={lossY(LOSS[LOSS_MIN_I]) + 30} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.NEGATIVE}>
                    {LOSS[LOSS_MIN_I].toFixed(6)} · min
                  </text>
                </g>
              )}
              {v(scene.lossTrueU) > 0.005 && (
                <g opacity={v(scene.lossTrueU)}>
                  <circle cx={lossX(29.5)} cy={lossY(LOSS[2])} r={8} fill={colors.POSITIVE} />
                  <text x={lossX(29.5) - 4} y={lossY(LOSS[2]) - 16} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.POSITIVE}>
                    {LOSS[2].toFixed(6)} · truth
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ================= B13 · 10,000 held-out frames ================= */}
        {v(scene.barU) > 0.005 && (
          <g opacity={v(scene.barU) * dimAll}>
            <text x={BAR.x} y={BAR.y - 10} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              hardened fixed-ramp circuit · held-out trace 9,001 · {commas(FRAMES)} frames
            </text>
            <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} fill={colors.POSITIVE} opacity={0.18} />
            {DIVERGE_BINS.map((n, i) => {
              const u = clamp01(v(scene.barFill) * DIVERGE_BINS.length - i);
              if (u <= 0 || n === 0) return null;
              const bw = BAR.w / DIVERGE_BINS.length;
              const h = BAR.h * (n / 100);
              return <rect key={i} x={BAR.x + i * bw} y={BAR.y + BAR.h - h} width={bw * u + 0.4} height={h} fill={colors.NEGATIVE} />;
            })}
            <text x={BAR.x + BAR.w} y={BAR.y - 10} textAnchor="end" fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.NEGATIVE} opacity={clamp01(v(scene.barFill) * 2)}>
              {commas(Math.round(DIVERGED * clamp01(v(scene.barFill))))} / {commas(FRAMES)} diverge
            </text>
            {v(scene.firstU) > 0.005 && (
              <g opacity={v(scene.firstU)}>
                <line x1={BAR.x + (FIRST_DIVERGENCE / FRAMES) * BAR.w} y1={BAR.y - 4} x2={BAR.x + (FIRST_DIVERGENCE / FRAMES) * BAR.w} y2={BAR.y + BAR.h + 8} stroke={colors.TEXT} strokeWidth={2} />
                <text x={BAR.x + (FIRST_DIVERGENCE / FRAMES) * BAR.w + 8} y={BAR.y + BAR.h + 22} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  first divergence: frame {FIRST_DIVERGENCE}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= closing frame ================= */}
        {v(scene.summaryU) > 0.005 && (
          <g opacity={v(scene.summaryU)}>
            <rect x={300} y={232} width={680} height={170} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={282} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.MUTED}>one ramp, two schedules</text>
            <text x={640} y={326} textAnchor="middle" fontSize={22} fontFamily={MONO} fill={colors.POSITIVE}>
              anneal 32 → 0.25 px: 20 / 20 recovered
            </text>
            <text x={640} y={366} textAnchor="middle" fontSize={22} fontFamily={MONO} fill={colors.NEGATIVE}>
              fixed 4 px: {commas(DIVERGED)} / {commas(FRAMES)} diverge
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={224} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        2 · A Ramp That Narrows
      </text>
    </>
  );
}

export const vizScene = () => scene;
