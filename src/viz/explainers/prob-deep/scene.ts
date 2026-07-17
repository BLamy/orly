import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Bayesian Deep Learning, honestly — what the cheap tricks actually buy.
 *
 * The chapter-one dataset and 12-member bootstrap ensemble are rebuilt here
 * (same seeds), then put on trial: 200 fresh test points are drawn from the
 * same noisy truth, and the coverage of a claimed-90% interval is really
 * counted. Computed verdicts: the epistemic-only band (ensemble spread
 * alone) catches 32% — badly overconfident; adding the learned noise term
 * (σ̂ ≈ 0.25 from residuals) widens it to 86% — close to its promise, not
 * perfect.
 */

export const TRUE_F = (x: number): number => Math.sin(1.5 * x);
export const NOISE = 0.3;

export interface Pt {
  x: number;
  y: number;
}
export const DATA: Pt[] = (() => {
  const rand = mulberry32(7);
  const g = gaussian(rand);
  const pts: Pt[] = [];
  for (let i = 0; i < 35; i++) {
    const x = rand() * 1.4;
    pts.push({ x, y: TRUE_F(x) + NOISE * g() });
  }
  for (let i = 0; i < 15; i++) {
    const x = 1.4 + rand() * 1.2;
    pts.push({ x, y: TRUE_F(x) + 0.05 * g() });
  }
  return pts;
})();

export type Cubic = [number, number, number, number];
function fitCubic(xs: number[], ys: number[]): Cubic {
  const A: number[][] = Array.from({ length: 4 }, () => new Array(5).fill(0));
  for (let k = 0; k < xs.length; k++) {
    const p = [1, xs[k], xs[k] ** 2, xs[k] ** 3];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) A[i][j] += p[i] * p[j];
      A[i][4] += p[i] * ys[k];
    }
  }
  for (let i = 0; i < 4; i++) {
    let piv = i;
    for (let r = i + 1; r < 4; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
    [A[i], A[piv]] = [A[piv], A[i]];
    for (let r = 0; r < 4; r++) {
      if (r === i) continue;
      const m = A[r][i] / A[i][i];
      for (let c = i; c < 5; c++) A[r][c] -= m * A[i][c];
    }
  }
  return [0, 1, 2, 3].map((i) => A[i][4] / A[i][i]) as Cubic;
}
const evalCubic = (c: Cubic, x: number): number => c[0] + c[1] * x + c[2] * x * x + c[3] * x ** 3;

export const FITS: Cubic[] = (() => {
  const rand = mulberry32(1013);
  const out: Cubic[] = [];
  for (let b = 0; b < 12; b++) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let k = 0; k < DATA.length; k++) {
      const idx = Math.floor(rand() * DATA.length);
      xs.push(DATA[idx].x);
      ys.push(DATA[idx].y);
    }
    out.push(fitCubic(xs, ys));
  }
  return out;
})();

export const meanFit = (x: number): number => FITS.reduce((s, c) => s + evalCubic(c, x), 0) / 12;
export const spreadAt = (x: number): number => {
  const m = meanFit(x);
  return Math.sqrt(FITS.reduce((a, c) => a + (evalCubic(c, x) - m) ** 2, 0) / 12);
};

/** learned noise: root-mean-square residual on the training data */
export const SIGMA_HAT: number = Math.sqrt(
  DATA.reduce((a, p) => a + (p.y - meanFit(p.x)) ** 2, 0) / DATA.length,
); // ≈ 0.25

/** the trial: 200 fresh points from the same truth, coverage really counted */
export const TEST: Pt[] = (() => {
  const rand = mulberry32(99);
  const g = gaussian(rand);
  return Array.from({ length: 200 }, () => {
    const x = rand() * 1.4;
    return { x, y: TRUE_F(x) + NOISE * g() };
  });
})();
export const IN_EPI: boolean[] = TEST.map(
  (p) => Math.abs(p.y - meanFit(p.x)) < 1.645 * spreadAt(p.x),
);
export const IN_TOTAL: boolean[] = TEST.map(
  (p) => Math.abs(p.y - meanFit(p.x)) < 1.645 * Math.sqrt(spreadAt(p.x) ** 2 + SIGMA_HAT ** 2),
);
export const COV_EPI: number = IN_EPI.filter(Boolean).length / TEST.length; // 0.32
export const COV_TOTAL: number = IN_TOTAL.filter(Boolean).length / TEST.length; // 0.86

export const sx: ScaleLinear<number, number> = scaleLinear().domain([0, 1.5]).range([110, 810]);
export const sy: ScaleLinear<number, number> = scaleLinear().domain([-1.4, 2.2]).range([620, 100]);

export const CAM_DATA: CameraState = { x: 460, y: 360, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  bandEpiU: ChannelRef<number>;
  bandTotU: ChannelRef<number>;
  testP: ChannelRef<number>;
  missU: ChannelRef<number>;
  meterEpiU: ChannelRef<number>;
  meterTotU: ChannelRef<number>;
  menuU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const bandEpiU = tl.channel('bandEpiU', 0);
  const bandTotU = tl.channel('bandTotU', 0);
  const testP = tl.channel('testP', 0);
  const missU = tl.channel('missU', 0);
  const meterEpiU = tl.channel('meterEpiU', 0);
  const meterTotU = tl.channel('meterTotU', 0);
  const menuU = tl.channel('menuU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the promise on trial ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Deep networks borrow these ideas on the cheap: train an ensemble, or leave dropout on at test time, and call the disagreement uncertainty.',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_DATA, { at: 0.9, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'The right response is not to admire the trick but to put it on trial. A claimed ninety percent interval has one job: catch ninety percent of fresh reality.',
  });
  tl.tween(bandEpiU, 1, { at: 7.5, dur: 1.6, ease: ease.enter });

  // — Beat 2 · the trial ————————————————————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 5.8,
    text: 'So we drew two hundred brand new points from the same noisy world our ensemble trained on, and simply counted what its band caught.',
  });
  tl.tween(testP, 1, { at: 12.9, dur: 4.0, ease: ease.linear });

  tl.caption({
    at: 18.5,
    dur: 6.2,
    text: 'The verdict is brutal. The ensemble-spread band, sold as ninety percent, catches thirty two. Model disagreement measures ignorance — it never measured the noise.',
  });
  tl.tween(missU, 1, { at: 19.1, dur: 0.9, ease: ease.enter });
  tl.tween(meterEpiU, 1, { at: 20.3, dur: 1.2, ease: ease.pop });

  tl.caption({
    at: 25.1,
    dur: 6.0,
    text: 'Add the missing ingredient — a noise term learned from the residuals — and the band widens honestly. Same trial again: eighty six percent. Close to its promise, not perfect.',
  });
  tl.tween(bandTotU, 1, { at: 26.1, dur: 1.6, ease: ease.enter });
  tl.tween(missU, 0, { at: 26.1, dur: 0.9, ease: ease.move });
  tl.tween(meterTotU, 1, { at: 28.3, dur: 1.2, ease: ease.pop });
  tl.hold(31.1, 0.6);

  // — Beat 3 · the menu, honestly priced ————————————————————————————————
  tl.caption({
    at: 31.7,
    dur: 6.2,
    text: 'That is the honest state of Bayesian deep learning: ensembles are the strong baseline but cost several models; dropout is nearly free and rougher; both need the noise term.',
  });
  tl.tween(menuU, 1, { at: 32.5, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 38.3,
    dur: 5.6,
    text: 'And none of it earns trust by construction. The count you just watched is calibration — the same trial the evaluation book runs on classifiers.',
  });

  // — Beat 4 · the book’s recap ————————————————————————————————————————
  tl.caption({
    at: 44.3,
    dur: 6.0,
    text: 'So end where the book began: separate the two doubts, state them as distributions when you can, sample or optimize when you cannot —',
  });
  tl.tween(menuU, 0, { at: 44.5, dur: 0.8, ease: ease.move });

  tl.caption({
    at: 50.7,
    dur: 5.4,
    text: 'and whatever produced the number, make it stand trial on data it has never seen. Probability is a promise; calibration is the audit.',
  });
  tl.tween(closeU, 1, { at: 51.1, dur: 0.9, ease: ease.enter });
  tl.hold(56.1, 1.4);

  return { tl, cam, axU, bandEpiU, bandTotU, testP, missU, meterEpiU, meterTotU, menuU, closeU };
}
