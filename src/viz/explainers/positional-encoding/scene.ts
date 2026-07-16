import { CAMERA_HOME, Timeline, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Positional Encoding — order from sinusoids.
 *
 * All math lives here at module scope: the ACTUAL transformer sinusoidal
 * encoding matrix PE[pos, 2i] = sin(pos / 10000^(2i/d)),
 * PE[pos, 2i+1] = cos(pos / 10000^(2i/d)) for 32 positions × 24 dimensions,
 * plus the real cosine similarity between row vectors as a function of
 * offset. Nothing is faked; every frame is a pure function of the timeline.
 */

// ---------------------------------------------------------------------------
// The encoding matrix (the real formula, 32 × 24)
// ---------------------------------------------------------------------------

export const N_POS = 32;
export const D_MODEL = 24;

/** Angular frequency of dimension k (pairs share it): 1 / 10000^(2⌊k/2⌋ / d). */
export const dimFreq = (k: number): number =>
  1 / Math.pow(10000, (2 * Math.floor(k / 2)) / D_MODEL);

/** The raw encoding value in [-1, 1] — sin on even dims, cos on odd dims. */
export const peValue = (pos: number, k: number): number =>
  k % 2 === 0 ? Math.sin(pos * dimFreq(k)) : Math.cos(pos * dimFreq(k));

/** Raw matrix, row-major: PE_RAW[pos][k] ∈ [-1, 1]. */
export const PE_RAW: number[][] = Array.from({ length: N_POS }, (_, pos) =>
  Array.from({ length: D_MODEL }, (_, k) => peValue(pos, k)),
);

/** Normalized to 0..1 for the MatrixGrid heatmap. */
export const PE_HEAT: number[][] = PE_RAW.map((row) => row.map((v) => (v + 1) / 2));

/** The continuous waveform of one dimension column, as a function of position. */
export const colWave =
  (k: number) =>
  (p: number): number =>
    peValue(p, k);

// ---------------------------------------------------------------------------
// Cosine similarity between row vectors vs offset (the real numbers).
// For sinusoidal encodings this depends only on the offset, so we measure
// from a base row and it holds everywhere.
// ---------------------------------------------------------------------------

const dot = (a: number[], b: number[]): number => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a: number[]): number => Math.sqrt(dot(a, a));
export const cosSim = (a: number[], b: number[]): number => dot(a, b) / (norm(a) * norm(b));

export const SIM_BASE = 8;
export const MAX_OFFSET = 23; // SIM_BASE + 23 = 31, the last row

/** SIM[o] = cosine similarity between row 8 and row 8 + o. SIM[0] = 1. */
export const SIM: number[] = Array.from({ length: MAX_OFFSET + 1 }, (_, o) =>
  cosSim(PE_RAW[SIM_BASE], PE_RAW[SIM_BASE + o]),
);

/** Fractional-offset lookup (for the FunctionPlot of similarity vs offset). */
export function simAt(o: number): number {
  const f = Math.max(0, Math.min(MAX_OFFSET, o));
  const i = Math.floor(f);
  if (i >= MAX_OFFSET) return SIM[MAX_OFFSET];
  return SIM[i] + (SIM[i + 1] - SIM[i]) * (f - i);
}

// ---------------------------------------------------------------------------
// The sentence for the bag-of-tokens beat (fixed, deterministic shuffle)
// ---------------------------------------------------------------------------

export const WORDS = ['the', 'cat', 'sat', 'on', 'the', 'mat'] as const;
/** slot occupied by token i after the shuffle (a fixed derangement). */
export const SHUFFLE: readonly number[] = [4, 2, 5, 0, 3, 1];
/** the token whose fingerprint we single out in the "add it" beat */
export const FOCUS_TOKEN = 2; // "sat"

// ---------------------------------------------------------------------------
// Featured wave columns: fast / medium / slow (real wavelengths in positions)
//   k = 0  → period 2π ≈ 6.3 positions   (about five cycles across the table)
//   k = 4  → period ≈ 29 positions       (about one full cycle)
//   k = 10 → period ≈ 292 positions      (a slow drift across 32 rows)
// ---------------------------------------------------------------------------

export const WAVE_DIMS = [0, 4, 10] as const;

// rows compared in the fingerprint beats
export const ROW_A = 8;
export const ROW_FAR = 20;
export const ROW_NEAR = 10;

// ---------------------------------------------------------------------------
// Camera marks
// ---------------------------------------------------------------------------

export const CAM_TOKENS: CameraState = { x: 640, y: 300, k: 1.18 };
export const CAM_GRID_L: CameraState = { x: 330, y: 350, k: 1.22 };
export const CAM_GRID_R: CameraState = { x: 470, y: 350, k: 1.22 };
export const CAM_WAVES: CameraState = { x: 900, y: 340, k: 1.05 };
export const CAM_ROWS: CameraState = { x: 620, y: 350, k: 1.0 };
export const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.96 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tokensU: ChannelRef<number>;
  shuffleU: ChannelRef<number>;
  tokensOp: ChannelRef<number>;
  chipsU: ChannelRef<number>;
  fpU: ChannelRef<number>;
  addTexU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  gridOp: ChannelRef<number>;
  gridTexU: ChannelRef<number>;
  colHiU: ChannelRef<number>;
  wavesU: ChannelRef<number>;
  wavesOp: ChannelRef<number>;
  rowFarU: ChannelRef<number>;
  rowNearU: ChannelRef<number>;
  simU: ChannelRef<number>;
  simReveal: ChannelRef<number>;
  recapU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const tokensU = tl.channel('tokensU', 0);
  const shuffleU = tl.channel('shuffleU', 0);
  const tokensOp = tl.channel('tokensOp', 1);
  const chipsU = tl.channel('chipsU', 0);
  const fpU = tl.channel('fpU', 0);
  const addTexU = tl.channel('addTexU', 0);
  const gridU = tl.channel('gridU', 0);
  const gridOp = tl.channel('gridOp', 1);
  const gridTexU = tl.channel('gridTexU', 0);
  const colHiU = tl.channel('colHiU', 0);
  const wavesU = tl.channel('wavesU', 0);
  const wavesOp = tl.channel('wavesOp', 1);
  const rowFarU = tl.channel('rowFarU', 0);
  const rowNearU = tl.channel('rowNearU', 0);
  const simU = tl.channel('simU', 0);
  const simReveal = tl.channel('simReveal', 0);
  const recapU = tl.channel('recapU', 0);

  // — Beat 1 · the blind spot ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 4.6,
    text: 'Attention has a blind spot: it treats a sentence as a bag of tokens.',
  });
  tl.tween(tokensU, 1, { at: 0.5, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_TOKENS, { at: 0.9, dur: 1.4, ease: ease.move });

  // — Beat 2 · shuffle: nothing changes ——————————————————————————————————
  tl.caption({
    at: 5.6,
    dur: 5.6,
    text: 'Shuffle the words and every attention score comes out exactly the same. To the model, order is invisible.',
  });
  tl.tween(shuffleU, 1, { at: 6.2, dur: 1.5, ease: ease.move });
  tl.hold(11.2, 0.4);

  // — Beat 3 · the fingerprint idea ——————————————————————————————————————
  tl.caption({
    at: 11.6,
    dur: 6.2,
    text: "The fix is almost cheeky: give every position its own fingerprint vector, and simply add it to the word's embedding.",
    tex: 'x_p = e_{\\text{word}} + \\mathrm{PE}_p',
  });
  tl.tween(shuffleU, 0, { at: 11.7, dur: 1.2, ease: ease.move });
  tl.tween(chipsU, 1, { at: 12.2, dur: 0.8, ease: ease.enter });
  tl.tween(fpU, 1, { at: 13.4, dur: 1.0, ease: ease.move });
  tl.tween(addTexU, 1, { at: 14.6, dur: 0.7, ease: ease.enter });
  tl.hold(17.8, 0.4);

  // — Beat 4 · the actual matrix, column by column ———————————————————————
  tl.caption({
    at: 18.4,
    dur: 6.6,
    text: 'This is the actual fingerprint table: one row per position, one column per dimension, sines and cosines all the way down.',
    tex: '\\mathrm{PE}_{p,2i} = \\sin\\!\\big(p / 10000^{2i/d}\\big),\\quad \\mathrm{PE}_{p,2i+1} = \\cos\\!\\big(p / 10000^{2i/d}\\big)',
  });
  tl.tween(tokensOp, 0, { at: 18.2, dur: 0.9, ease: ease.move });
  tl.tween(addTexU, 0, { at: 18.2, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_GRID_L, { at: 18.5, dur: 1.3, ease: ease.move });
  tl.tween(gridU, 1, { at: 19.0, dur: 5.0, ease: ease.linear });
  tl.tween(cam, CAM_GRID_R, { at: 20.2, dur: 4.2, ease: ease.move });
  tl.tween(gridTexU, 1, { at: 19.6, dur: 0.8, ease: ease.enter });
  tl.hold(25.0, 0.4);

  // — Beat 5 · columns are waves ——————————————————————————————————————————
  tl.caption({
    at: 25.6,
    dur: 5.6,
    text: 'Read it by columns and each column is a wave. The first columns oscillate fast, and the wavelength stretches as you move right.',
  });
  tl.tween(colHiU, 1, { at: 26.0, dur: 1.0, ease: ease.enter });
  tl.hold(31.0, 0.4);

  // — Beat 6 · three real waveforms pulled out ———————————————————————————
  tl.caption({
    at: 31.4,
    dur: 5.2,
    text: 'Pull three columns out and the pattern is plain: a fast wave, a medium wave, and a slow drift.',
  });
  tl.tween(cam, CAM_WAVES, { at: 31.5, dur: 1.4, ease: ease.move });
  tl.tween(wavesU, 1, { at: 31.9, dur: 3.4, ease: ease.draw });

  // — Beat 7 · the clock analogy (hold on the waves) ——————————————————————
  tl.caption({
    at: 37.0,
    dur: 6.4,
    text: 'It works like the hands of a clock, or like binary counting: quick digits tick on every step, while slow digits mark the long haul.',
  });
  tl.hold(43.4, 0.4);

  // — Beat 8 · rows are unique fingerprints ———————————————————————————————
  tl.caption({
    at: 43.9,
    dur: 6.2,
    text: 'Now read it by rows. Position eight and position twenty look nothing alike — every row is a unique fingerprint.',
  });
  tl.tween(cam, CAM_ROWS, { at: 44.0, dur: 1.4, ease: ease.move });
  tl.tween(wavesOp, 0.12, { at: 44.0, dur: 1.1, ease: ease.move });
  tl.tween(colHiU, 0, { at: 44.0, dur: 0.9, ease: ease.move });
  tl.tween(rowFarU, 1, { at: 44.8, dur: 0.8, ease: ease.enter });
  tl.hold(50.1, 0.4);

  // — Beat 9 · nearby rows are similar: the real similarity curve —————————
  tl.caption({
    at: 50.6,
    dur: 6.2,
    text: 'But nearby rows do look alike. Plot the similarity between two fingerprints against their distance, and it falls off smoothly.',
  });
  tl.tween(rowFarU, 0, { at: 50.7, dur: 0.8, ease: ease.move });
  tl.tween(rowNearU, 1, { at: 51.0, dur: 0.8, ease: ease.enter });
  tl.tween(simU, 1, { at: 51.6, dur: 0.9, ease: ease.enter });
  tl.tween(simReveal, 1, { at: 52.6, dur: 3.2, ease: ease.draw });
  tl.caption({
    at: 57.2,
    dur: 4.8,
    text: 'So the model can judge near from far just by comparing fingerprints — no counter required.',
  });
  tl.hold(62.0, 0.5);

  // — Beat 10 · recap ——————————————————————————————————————————————————————
  tl.caption({
    at: 62.6,
    dur: 5.2,
    text: 'Add the fingerprint to the embedding, and order rides along with meaning, in the same vector.',
    tex: 'x_p = e_{\\text{word}} + \\mathrm{PE}_p',
  });
  tl.tween(cam, CAM_WIDE, { at: 62.6, dur: 1.5, ease: ease.move });
  tl.tween(gridOp, 0.12, { at: 62.6, dur: 1.2, ease: ease.move });
  tl.tween(simU, 0.12, { at: 62.6, dur: 1.2, ease: ease.move });
  tl.tween(wavesOp, 0, { at: 62.6, dur: 1.0, ease: ease.move });
  tl.tween(gridTexU, 0, { at: 62.6, dur: 0.9, ease: ease.move });
  tl.tween(rowNearU, 0, { at: 62.6, dur: 0.9, ease: ease.move });
  tl.tween(recapU, 1, { at: 63.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 68.2,
    dur: 5.4,
    text: 'That is positional encoding: no learned parameters, just sinusoids — and a bag of tokens becomes a sequence.',
  });
  tl.hold(73.6, 1.2);

  return {
    tl,
    cam,
    tokensU,
    shuffleU,
    tokensOp,
    chipsU,
    fpU,
    addTexU,
    gridU,
    gridOp,
    gridTexU,
    colHiU,
    wavesU,
    wavesOp,
    rowFarU,
    rowNearU,
    simU,
    simReveal,
    recapU,
  };
}
