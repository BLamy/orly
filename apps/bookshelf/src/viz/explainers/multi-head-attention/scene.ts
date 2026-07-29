import { CAMERA_HOME, Timeline, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * "Multi-Head Attention" — scene data + pure Timeline builder.
 *
 * Builds directly on the single-head attention explainer (explained-ml):
 * the viewer already knows queries, keys, values and softmax spotlights.
 * This chapter shows MANY heads attending to DIFFERENT relations at once.
 *
 * The per-head query/key vectors below are HANDCRAFTED (designed feature
 * spaces, not learned), but everything displayed downstream is REAL math:
 * scores are actual dot products over √d, and the weight matrices are an
 * actual softmax of those scores — never hand-written outputs. All data
 * lives at module scope so every frame scrubs exactly.
 */

// ── the sentence ────────────────────────────────────────────────────────────
export const TOKENS = ['the', 'cat', 'sat', 'because', 'it', 'was', 'so', 'tired'];
export const N = TOKENS.length;
export const D_K = 4; // per-head key dimension

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

/** REAL softmax (max-subtracted for stability) — the weights are not faked. */
export function softmaxRow(row: number[]): number[] {
  const m = Math.max(...row);
  const exps = row.map((v) => Math.exp(v - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** weights[i][j] = softmax_j( q_i · k_j / √d ) — computed, never transcribed */
function attend(Q: number[][], K: number[][]): number[][] {
  return Q.map((q) => softmaxRow(K.map((k) => dot(q, k) / Math.sqrt(D_K))));
}

// ── head 1 · position: "look one word back" ─────────────────────────────────
// Keys are positional codes on a circle (near-orthogonal for small offsets);
// each query is simply the code of the PREVIOUS position, amplified.
const posCode = (j: number): number[] => {
  const th = (2 * Math.PI * j) / N;
  return [Math.cos(th), Math.sin(th), Math.cos(3 * th), Math.sin(3 * th)];
};
export const K_HEAD1: number[][] = TOKENS.map((_, j) => posCode(j));
export const Q_HEAD1: number[][] = TOKENS.map((_, i) => posCode(Math.max(i - 1, 0)).map((v) => 4 * v));

// ── head 2 · reference: "which noun does the pronoun mean?" ─────────────────
// Feature space: [animate-noun, verb, function-word, degree]. The pronoun
// "it" queries hard for an animate noun; everyone else queries weakly for
// their own kind, which softmax leaves diffuse.
export const K_HEAD2: number[][] = [
  [0, 0, 1, 0], // the
  [1, 0, 0, 0], // cat
  [0, 1, 0, 0], // sat
  [0, 0, 0.9, 0], // because
  [0.2, 0, 0.5, 0], // it
  [0, 0.9, 0, 0], // was
  [0, 0, 0.3, 0.9], // so
  [0.2, 0.3, 0, 0.6], // tired
];
const PRONOUN = 4; // "it"
export const Q_HEAD2: number[][] = K_HEAD2.map((k, i) =>
  i === PRONOUN ? [6, 0, 0, 0] : k.map((v) => 1.5 * v),
);

// ── head 3 · description: modifiers reach for what they modify ──────────────
// Feature space: [noun, verb, adjective, degree-word]. "so" hunts for an
// adjective, "tired" hunts for the noun it describes; other rows stay flat.
export const K_HEAD3: number[][] = [
  [0, 0, 0, 0.2], // the
  [1, 0, 0, 0], // cat
  [0, 1, 0, 0], // sat
  [0, 0, 0, 0.3], // because
  [0.5, 0, 0, 0], // it
  [0, 0.9, 0, 0], // was
  [0, 0, 0, 1], // so
  [0, 0, 1, 0.1], // tired
];
const DEGREE = 6; // "so"
const ADJ = 7; // "tired"
export const Q_HEAD3: number[][] = K_HEAD3.map((k, i) =>
  i === ADJ ? [6, 0, 0, 0] : i === DEGREE ? [0, 0, 6, 0] : k.map((v) => 0.8 * v),
);

// ── the three REAL weight matrices ──────────────────────────────────────────
export const WEIGHTS: number[][][] = [
  attend(Q_HEAD1, K_HEAD1), // sub-diagonal stripe: w[i][i-1] ≈ 0.90
  attend(Q_HEAD2, K_HEAD2), // "it"→"cat" ≈ 0.70, other rows diffuse
  attend(Q_HEAD3, K_HEAD3), // "so"→"tired" ≈ 0.74, "tired"→"cat" ≈ 0.66
];

/** arcs are drawn for off-diagonal weights above this */
export const ARC_MIN = 0.25;

/** the headline weights the narration quotes, read out of the real matrices */
export const W_IT_CAT = WEIGHTS[1][PRONOUN][1];
export const W_SO_TIRED = WEIGHTS[2][DEGREE][ADJ];
export const W_TIRED_CAT = WEIGHTS[2][ADJ][1];
export const W_PREV = WEIGHTS[0][2][1]; // "sat" → "cat", the stripe value

// ── layout (1280 × 720 stage coordinates) ───────────────────────────────────
export const TOKEN_XS = TOKENS.map((_, i) => 192 + i * 128);
export const SINGLE_Y = 360; // the recap lane — becomes lane 2's home
export const LANE_YS = [160, 360, 560];
export const OUT_Y = 360; // merged stream lands back on the middle line
export const MAT_X = 470;
export const MAT_Y = 236;
export const MAT_CELL = 34;
export const MAT_GAP = 4;

// ── the timeline ────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const chipU = tl.channel('chipU', 0); // one channel; per-token stagger derived
  const recapTexU = tl.channel('recapTexU', 0);
  const arcU = [0, 1, 2].map((h) => tl.channel(`arc${h}`, 0)); // per-head arc draw-on
  const limitU = tl.channel('limitU', 0); // "one relation" squeeze on the recap arcs
  const splitU = tl.channel('splitU', 0); // single lane → three lanes
  const laneTagU = tl.channel('laneTagU', 0); // head labels at the left edge
  const hiU = [0, 1, 2].map((h) => tl.channel(`hi${h}`, 0)); // per-lane spotlight
  const visitU = tl.channel('visitU', 0); // global "we are touring lanes" dim
  const matU = tl.channel('matU', 0); // matrix panel + labels
  const matP = tl.channel('matP', 0); // ONE channel cascades all 64 cells
  const stripeU = tl.channel('stripeU', 0); // highlight sweep down the stripe
  const headTexU = tl.channel('headTexU', 0); // per-head formula
  const mergeU = tl.channel('mergeU', 0); // tri-color dots weave into one stream
  const outU = tl.channel('outU', 0); // merged output chips
  const concatTexU = tl.channel('concatTexU', 0);
  const endDim = tl.channel('endDim', 0); // fades the machinery for the close
  const endU = tl.channel('endU', 0); // closing title card

  // ── beat 1 · recap: one head, one spotlight (0 – 12) ──
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'You already know the trick: every word sends out a query, compares it with every key, and softmax turns the scores into a spotlight of weights.',
  });
  tl.tween(chipU, 1, { at: 0.7, dur: 1.6, ease: ease.enter }); // per-token stagger derived in render
  tl.tween(recapTexU, 1, { at: 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(arcU[1], 1, { at: 3.6, dur: 1.5, ease: ease.draw });
  tl.caption({
    at: 7.2,
    dur: 4.6,
    text: 'In this sentence, one head has found a referent: the word it spends seventy percent of its attention on cat.',
  });
  tl.hold(11.8, 0.8);

  // ── beat 2 · the limitation (12.6 – 19) ──
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: 'But a single head holds a single matrix of weights — one pattern, one relation. Position, reference, and description all compete for the same spotlight.',
  });
  tl.tween(limitU, 1, { at: 13.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.12 }, { at: 13.0, dur: 1.2, ease: ease.move });
  tl.hold(18.2, 0.8);

  // ── beat 3 · split into heads (19 – 27) ──
  tl.caption({
    at: 19.0,
    dur: 5.8,
    text: 'So the transformer splits its attention. The same eight tokens are handed to three heads in parallel, each with its own smaller queries and keys.',
  });
  tl.tween(limitU, 0, { at: 19.2, dur: 0.8 });
  tl.tween(recapTexU, 0, { at: 19.2, dur: 0.6 });
  tl.tween(cam, { x: 640, y: 360, k: 0.94 }, { at: 19.6, dur: 1.5, ease: ease.move });
  tl.tween(splitU, 1, { at: 19.8, dur: 1.6, ease: ease.move });
  tl.tween(laneTagU, 1, { at: 21.6, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 25.2,
    dur: 3.4,
    text: 'Same sentence, three lanes — and each lane is free to learn a different conversation.',
  });
  tl.hold(28.6, 0.6);

  // ── beat 4 · visit each lane (29 – 53) ──
  tl.tween(visitU, 1, { at: 29.2, dur: 0.8, ease: ease.move });
  // lane 1 — position
  tl.caption({
    at: 29.4,
    dur: 6.4,
    text: 'Head one turns out to track position. Every word leans on the word just before it — about ninety percent of its weight lands one step back.',
  });
  tl.tween(hiU[0], 1, { at: 29.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 235, k: 1.25 }, { at: 29.4, dur: 1.3, ease: ease.move });
  tl.tween(arcU[0], 1, { at: 30.4, dur: 1.6, ease: ease.draw });
  tl.hold(35.8, 0.6);
  // lane 2 — reference
  tl.caption({
    at: 36.4,
    dur: 6.0,
    text: 'Head two is the one you already met. It resolves references: the word it locks onto cat, while every other row stays diffuse and quiet.',
  });
  tl.tween(hiU[0], 0, { at: 36.6, dur: 0.6 });
  tl.tween(hiU[1], 1, { at: 36.6, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.25 }, { at: 36.6, dur: 1.3, ease: ease.move });
  tl.hold(42.4, 0.6);
  // lane 3 — description
  tl.caption({
    at: 43.0,
    dur: 6.2,
    text: 'And head three follows description: so points at tired with seventy four percent of its weight, and tired reaches back to the cat it describes.',
  });
  tl.tween(hiU[1], 0, { at: 43.2, dur: 0.6 });
  tl.tween(hiU[2], 1, { at: 43.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 480, k: 1.25 }, { at: 43.2, dur: 1.3, ease: ease.move });
  tl.tween(arcU[2], 1, { at: 44.2, dur: 1.6, ease: ease.draw });
  tl.hold(49.2, 0.8);

  // ── beat 5 · the matrix IS the arcs (50 – 65) ──
  tl.caption({
    at: 50.0,
    dur: 6.4,
    text: 'Each head is really just a matrix of weights. Here is head one as a heat map: one bright stripe below the diagonal. The matrix and the arcs are the same object.',
  });
  tl.tween(hiU[2], 0, { at: 50.2, dur: 0.6 });
  tl.tween(hiU[0], 1, { at: 50.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 300, k: 1.05 }, { at: 50.2, dur: 1.4, ease: ease.move });
  tl.tween(matU, 1, { at: 51.0, dur: 0.8, ease: ease.enter });
  tl.tween(matP, 1, { at: 51.6, dur: 2.8, ease: ease.draw });
  tl.tween(stripeU, 1, { at: 54.8, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 57.4,
    dur: 5.4,
    text: 'Every head runs the exact formula you learned last chapter — softmax of query times key over root d — just with its own tiny learned projections.',
  });
  tl.tween(headTexU, 1, { at: 57.8, dur: 0.7, ease: ease.enter });
  tl.hold(62.8, 0.8);

  // ── beat 6 · concatenate and mix (63.6 – 78) ──
  tl.caption({
    at: 63.6,
    dur: 6.2,
    text: 'Now each head has written its own version of every word. Concatenate the three answers, then mix them with one more learned matrix.',
  });
  tl.tween(matU, 0, { at: 63.8, dur: 0.8 });
  tl.tween(stripeU, 0, { at: 63.8, dur: 0.6 });
  tl.tween(headTexU, 0, { at: 63.8, dur: 0.6 });
  tl.tween(hiU[0], 0, { at: 63.8, dur: 0.6 });
  tl.tween(visitU, 0, { at: 63.8, dur: 0.8 });
  tl.tween(cam, { x: 640, y: 360, k: 0.96 }, { at: 64.0, dur: 1.5, ease: ease.move });
  tl.tween(mergeU, 1, { at: 65.4, dur: 3.2, ease: ease.move });
  tl.tween(outU, 1, { at: 67.8, dur: 0.9, ease: ease.pop });
  tl.tween(concatTexU, 1, { at: 68.8, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 70.6,
    dur: 5.2,
    text: 'Three lanes weave back into a single stream — and every token now carries position, reference, and description at once.',
  });
  tl.hold(75.8, 0.8);

  // ── beat 7 · payoff (76.6 – end) ──
  tl.tween(endDim, 1, { at: 76.6, dur: 1.4, ease: ease.move });
  tl.tween(concatTexU, 0, { at: 76.6, dur: 0.8 });
  tl.tween(cam, { x: 640, y: 350, k: 0.9 }, { at: 76.8, dur: 1.6, ease: ease.move });
  tl.tween(endU, 1, { at: 78.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 77.6,
    dur: 6.0,
    text: 'That is multi-head attention: many small conversations held in parallel, then stitched back into one. Every transformer layer you will meet does exactly this.',
  });
  tl.hold(83.6, 1.6);

  return {
    tl,
    cam,
    chipU,
    recapTexU,
    arcU,
    limitU,
    splitU,
    laneTagU,
    hiU,
    visitU,
    matU,
    matP,
    stripeU,
    headTexU,
    mergeU,
    outU,
    concatTexU,
    endDim,
    endU,
  };
}

export type MultiHeadScene = ReturnType<typeof buildScene>;
