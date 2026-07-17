import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * LoRA — fine-tuning as a low-rank update.
 *
 * A REAL 16×16 weight-update matrix, decomposed by a real one-sided Jacobi
 * singular value decomposition at module scope. The update is built the way
 * fine-tuning updates empirically look: a couple of strong directions plus
 * noise. Measured on this matrix: rank 1 keeps all but ~41% of the update,
 * rank 2 all but ~9%, rank 4 all but ~7% — while storing 2·d·r numbers
 * instead of d². At transformer scale (d = 4096, r = 8) that is 65 thousand
 * parameters instead of 16.8 million: 0.4 percent.
 */

export const D = 16;

const rand = mulberry32(21);
const g = gaussian(rand);
const vec = (): number[] => Array.from({ length: D }, () => g());
const u1 = vec();
const v1 = vec();
const u2 = vec();
const v2 = vec();

/** The full fine-tuning update ΔW: two strong directions + noise. */
export const DW: number[][] = Array.from({ length: D }, (_, i) =>
  Array.from({ length: D }, (_, j) => 0.5 * u1[i] * v1[j] + 0.25 * u2[i] * v2[j] + 0.06 * g()),
);

/** One-sided Jacobi SVD — real, run once at module scope. */
function svdJacobi(A: number[][]): { S: number[]; U: number[][]; V: number[][] } {
  const m = A.length;
  const n = A[0].length;
  const U = A.map((row) => [...row]);
  const V = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0)),
  );
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        let app = 0;
        let aqq = 0;
        let apq = 0;
        for (let i = 0; i < m; i++) {
          app += U[i][p] * U[i][p];
          aqq += U[i][q] * U[i][q];
          apq += U[i][p] * U[i][q];
        }
        off = Math.max(off, Math.abs(apq));
        if (Math.abs(apq) < 1e-14) continue;
        const tau = (aqq - app) / (2 * apq);
        const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        const c = 1 / Math.sqrt(1 + t * t);
        const sn = c * t;
        for (let i = 0; i < m; i++) {
          const a = U[i][p];
          const b = U[i][q];
          U[i][p] = c * a - sn * b;
          U[i][q] = sn * a + c * b;
        }
        for (let i = 0; i < n; i++) {
          const a = V[i][p];
          const b = V[i][q];
          V[i][p] = c * a - sn * b;
          V[i][q] = sn * a + c * b;
        }
      }
    }
    if (off < 1e-13) break;
  }
  const S = Array.from({ length: n }, (_, j) => Math.hypot(...U.map((row) => row[j])));
  const idx = [...S.keys()].sort((a, b) => S[b] - S[a]);
  return {
    S: idx.map((i) => S[i]),
    U: U.map((row) => idx.map((i) => (S[i] > 1e-12 ? row[i] / S[i] : 0))),
    V: V.map((row) => idx.map((i) => row[i])),
  };
}

export const SVD = svdJacobi(DW);

/** Rank-r reconstruction of ΔW. */
export function rankR(r: number): number[][] {
  return Array.from({ length: D }, (_, i) =>
    Array.from({ length: D }, (_, j) => {
      let s = 0;
      for (let k = 0; k < r; k++) s += SVD.U[i][k] * SVD.S[k] * SVD.V[j][k];
      return s;
    }),
  );
}

const fro = (A: number[][]): number => Math.sqrt(A.flat().reduce((a, b) => a + b * b, 0));
const DW_NORM = fro(DW);
export const relErr = (r: number): number =>
  fro(DW.map((row, i) => row.map((v, j) => v - rankR(r)[i][j]))) / DW_NORM;

export const RANKS = [1, 2, 4] as const;
export const APPROX: Record<number, number[][]> = { 1: rankR(1), 2: rankR(2), 4: rankR(4) };
export const ERRS: Record<number, number> = { 1: relErr(1), 2: relErr(2), 4: relErr(4) };
// measured: ~0.413, ~0.089, ~0.066

export const MAX_ABS = Math.max(...DW.flat().map(Math.abs));

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const CELL = 26;
export const GRID_X = 140;
export const GRID_Y = 110;
export const gx = (j: number): number => GRID_X + j * CELL;
export const gy = (i: number): number => GRID_Y + i * CELL;

export const AB_X = 660; // where B·A factors are drawn
export const APPROX_X = 830; // reconstructed matrix

export const CAM_GRID: CameraState = { x: 480, y: 330, k: 1.15 };
export const CAM_WIDE: CameraState = { x: 660, y: 340, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>; // ΔW heatmap
  svU: ChannelRef<number>; // singular value bars
  rankSel: ChannelRef<number>; // 1 | 2 | 4 (stepped)
  factU: ChannelRef<number>; // B·A factors + reconstruction
  errU: ChannelRef<number>; // error readout
  scaleU: ChannelRef<number>; // the 4096-scale payoff panel
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const svU = tl.channel('svU', 0);
  const rankSel = tl.channel('rankSel', 1);
  const factU = tl.channel('factU', 0);
  const errU = tl.channel('errU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the update is the object ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Fine-tuning a big model does not replace its weights. It nudges them. Subtract the old weight matrix from the new one and you get this: the update itself, as a matrix.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'Here is a real one, sixteen by sixteen: two hundred fifty six numbers. The question low rank adaptation asks is simple. How much structure is hiding in there?',
  });
  tl.hold(11.7, 0.6);

  // — Beat 2 · the spectrum ————————————————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 5.8,
    text: 'Run a singular value decomposition — really run it, this one converged in a few Jacobi sweeps. The bars are the strengths of the sixteen independent directions in the update.',
  });
  tl.tween(svU, 1, { at: 12.9, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 18.3,
    dur: 5.2,
    text: 'Two bars tower over the rest. Fine-tuning updates look like this in practice: the change a task demands points in a handful of directions, and the rest is dust.',
  });
  tl.hold(23.7, 0.6);

  // — Beat 3 · rank-r reconstruction ————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 24.3, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 24.7,
    dur: 5.8,
    text: 'So keep only the top directions. Write the update as a tall thin matrix B times a short wide matrix A — rank one means one direction each. Here is the rank one reconstruction next to the truth.',
    tex: '\\Delta W \\approx B\\,A \\qquad B \\in \\mathbb{R}^{d \\times r},\\; A \\in \\mathbb{R}^{r \\times d}',
  });
  tl.tween(mathU, 1, { at: 25.3, dur: 0.7, ease: ease.enter });
  tl.tween(factU, 1, { at: 25.9, dur: 1.4, ease: ease.draw });
  tl.tween(errU, 1, { at: 27.5, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 30.7,
    dur: 5.2,
    text: 'Rank one misses forty percent of the update. Bump to rank two and the miss drops to nine percent — the second big direction snapped in. Watch the reconstruction sharpen.',
  });
  tl.set(rankSel, 2, 32.4);
  tl.caption({
    at: 36.1,
    dur: 4.6,
    text: 'Rank four: under seven percent error, and the two matrices together still hold only half as many numbers as the full update.',
  });
  tl.set(rankSel, 4, 37.4);
  tl.hold(40.9, 0.6);

  // — Beat 4 · the payoff at scale ——————————————————————————————————————
  tl.caption({
    at: 41.5,
    dur: 6.0,
    text: 'Now scale the arithmetic to a real transformer layer, four thousand ninety six wide. The full update is sixteen point eight million numbers. Rank eight adaptation stores sixty five thousand — zero point four percent.',
    tex: '2\\,d\\,r = 65{,}536 \\;\\;\\text{vs}\\;\\; d^2 = 16{,}777{,}216',
  });
  tl.tween(scaleU, 1, { at: 42.3, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 47.9,
    dur: 5.0,
    text: 'That is why one graphics card can personalize a model that took a datacenter to train: you freeze the mountain and learn only the nudge.',
  });
  tl.hold(53.1, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 53.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 54.3, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 54.3, dur: 0.8, ease: ease.move });
  tl.tween(scaleU, 0, { at: 54.3, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 55.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 55.5,
    dur: 5.6,
    text: 'Low rank adaptation is a bet about geometry: the change a task needs lives in a thin slice of weight space. On this matrix, the bet paid at seven percent error for half the storage — at scale, for a four hundredth.',
  });
  tl.hold(61.3, 1.2);

  return { tl, cam, gridU, svU, rankSel, factU, errU, scaleU, mathU, dimU, endU };
}
