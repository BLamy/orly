import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Probabilistic Uncertainty — two kinds of doubt.
 *
 * A real 1-D regression dataset (35 noisy points near the origin, 15 clean
 * points further out, nothing beyond x = 2.6) and a real bootstrap ensemble
 * of 12 cubic least-squares fits, all computed at module scope. The
 * narration's anchor numbers come from SPREAD: the ensemble's disagreement
 * is ≈ 0.08 inside the data and ≈ 1.64 at x = 3.8 — twenty times wider off
 * the map (SPREAD_RATIO ≈ 20).
 */

export const TRUE_F = (x: number): number => Math.sin(1.5 * x);
export const NOISE_LEFT = 0.3;
export const NOISE_RIGHT = 0.05;

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
    pts.push({ x, y: TRUE_F(x) + NOISE_LEFT * g() });
  }
  for (let i = 0; i < 15; i++) {
    const x = 1.4 + rand() * 1.2;
    pts.push({ x, y: TRUE_F(x) + NOISE_RIGHT * g() });
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

export const evalCubic = (c: Cubic, x: number): number =>
  c[0] + c[1] * x + c[2] * x * x + c[3] * x ** 3;

/** the single "confident" fit on all the data */
export const FIT_ALL: Cubic = fitCubic(
  DATA.map((p) => p.x),
  DATA.map((p) => p.y),
);

/** 12 bootstrap refits — the ensemble (resampling PRNG continues the seed) */
export const N_FITS = 12;
export const FITS: Cubic[] = (() => {
  const rand = mulberry32(1013);
  const out: Cubic[] = [];
  for (let b = 0; b < N_FITS; b++) {
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

export const meanFit = (x: number): number =>
  FITS.reduce((s, c) => s + evalCubic(c, x), 0) / N_FITS;
export const spreadAt = (x: number): number => {
  const m = meanFit(x);
  return Math.sqrt(FITS.reduce((a, c) => a + (evalCubic(c, x) - m) ** 2, 0) / N_FITS);
};
export const SPREAD_IN = spreadAt(0.7);
export const SPREAD_OUT = spreadAt(3.4);
export const SPREAD_RATIO = SPREAD_OUT / SPREAD_IN; // ≈ 19.6 — "nearly twenty times"
/** how far the fan is drawn before it dives off-stage */
export const FAN_X_MAX = 3.45;

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------
export const sx: ScaleLinear<number, number> = scaleLinear().domain([0, 4]).range([110, 1170]);
export const sy: ScaleLinear<number, number> = scaleLinear().domain([-5.4, 2.4]).range([620, 100]);

export const CAM_DATA: CameraState = { x: 450, y: 350, k: 1.25 };
export const CAM_EDGE: CameraState = { x: 900, y: 400, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  dataP: ChannelRef<number>;
  fitU: ChannelRef<number>;
  fanP: ChannelRef<number>;
  edgeU: ChannelRef<number>;
  epiU: ChannelRef<number>;
  aleU: ChannelRef<number>;
  noteU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const dataP = tl.channel('dataP', 0);
  const fitU = tl.channel('fitU', 0);
  const fanP = tl.channel('fanP', 0);
  const edgeU = tl.channel('edgeU', 0);
  const epiU = tl.channel('epiU', 0);
  const aleU = tl.channel('aleU', 0);
  const noteU = tl.channel('noteU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the hook —————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A model hands you a prediction. Before you act on it, there is a question almost nobody asks: what kind of doubt comes attached?',
  });
  tl.tween(axU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_DATA, { at: 0.9, dur: 2.0, ease: ease.move });
  tl.tween(dataP, 1, { at: 1.6, dur: 2.8, ease: ease.linear });

  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'Here is a real dataset with a personality: crowded but noisy measurements on the left, a few clean ones in the middle, and nothing at all beyond.',
  });
  tl.hold(11.9, 0.5);

  // — Beat 2 · one confident curve ——————————————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 5.2,
    text: 'Fit one curve and it answers everywhere with the same straight face — including out where it has never seen a single point.',
  });
  tl.tween(fitU, 1, { at: 12.8, dur: 1.8, ease: ease.draw });

  // — Beat 3 · the ensemble —————————————————————————————————————————————
  tl.caption({
    at: 18.0,
    dur: 6.0,
    text: 'So make it confess. Refit the same model twelve times on twelve resamplings of the data. Where the data speaks clearly, the twelve curves agree.',
  });
  tl.tween(fitU, 0.25, { at: 18.2, dur: 1.0, ease: ease.move });
  tl.tween(fanP, 1, { at: 18.6, dur: 3.6, ease: ease.linear });

  tl.caption({
    at: 24.4,
    dur: 6.2,
    text: 'Now follow them past the edge of the data. The bundle tears apart — a short walk out, the disagreement is nearly twenty times wider than inside the data.',
  });
  tl.tween(cam, CAM_EDGE, { at: 24.8, dur: 1.8, ease: ease.move });
  tl.tween(edgeU, 1, { at: 26.2, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 31.0,
    dur: 5.6,
    text: 'That spread is epistemic uncertainty — the model’s ignorance. It lives where data is missing, and more data would shrink it.',
  });
  tl.tween(epiU, 1, { at: 31.6, dur: 0.9, ease: ease.enter });
  tl.hold(36.6, 0.5);

  // — Beat 4 · aleatoric ————————————————————————————————————————————————
  tl.caption({
    at: 37.1,
    dur: 6.2,
    text: 'Now look back at the crowded region. The twelve curves agree almost perfectly there — yet the points still scatter far above and below them.',
  });
  tl.tween(cam, CAM_DATA, { at: 37.5, dur: 1.8, ease: ease.move });
  tl.tween(edgeU, 0, { at: 37.5, dur: 0.7, ease: ease.move });
  tl.tween(epiU, 0, { at: 37.5, dur: 0.7, ease: ease.move });
  tl.tween(aleU, 1, { at: 38.7, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 43.7,
    dur: 5.8,
    text: 'That scatter is aleatoric uncertainty — noise in the world itself. Collect a million more points here and it will not shrink by a hair.',
  });

  // — Beat 5 · why the distinction pays —————————————————————————————————
  tl.caption({
    at: 49.9,
    dur: 6.0,
    text: 'The two doubts demand different responses. Ignorance says: gather data, or refuse to answer. Noise says: no more data will save you — plan for the spread.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.3, dur: 1.8, ease: ease.move });
  tl.tween(noteU, 1, { at: 51.1, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 56.3,
    dur: 5.4,
    text: 'Every chapter in this book is a machine for telling those two apart. First up: a model that treats entire curves as random objects.',
  });
  tl.tween(noteU, 0, { at: 60.3, dur: 0.7, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.9, dur: 0.9, ease: ease.enter });
  tl.hold(61.7, 1.4);

  return { tl, cam, axU, dataP, fitU, fanP, edgeU, epiU, aleU, noteU, closeU };
}
