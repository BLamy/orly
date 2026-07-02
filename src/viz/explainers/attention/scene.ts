import { CAMERA_HOME, Timeline, ease, stagger } from '../../core';
import type { CameraState } from '../../core';

/**
 * "Self-Attention, Visually" — scene data + pure Timeline builder.
 *
 * The sentence and the raw score matrix are HANDCRAFTED so the story reads
 * well ("sat" attends to "cat", "mat" to "on"/"the", moderate diagonal),
 * but the attention weights are REAL softmax over those scores — nothing
 * displayed is faked past that point. All data lives at module scope; the
 * timeline is a pure function of it, so every frame scrubs exactly.
 */

// ── the sentence ────────────────────────────────────────────────────────────
export const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const N = TOKENS.length;
/** the token whose attention row we follow ("sat") */
export const FOCUS = 2;

// ── tiny illustrative vectors (4-d) ─────────────────────────────────────────
// Handcrafted, not learned — they only feed the little vector fans and keep
// the "each word is a vector" beat honest. Note the two "the"s are nearly
// identical, as they should be before attention mixes in context.
export const EMBED: number[][] = [
  [0.3, -0.8, 0.5, 0.1], // the
  [0.9, 0.4, -0.2, 0.6], // cat
  [0.7, 0.6, 0.8, -0.3], // sat
  [-0.5, 0.2, -0.7, 0.4], // on
  [0.2, -0.9, 0.4, 0.2], // the
  [0.8, -0.1, -0.6, 0.7], // mat
];

export const Q_VECS: number[][] = [
  [0.4, 0.9, -0.2, 0.1],
  [0.8, -0.3, 0.6, 0.5],
  [1.0, 0.7, -0.4, 0.3],
  [-0.2, 0.5, 0.8, -0.6],
  [0.3, 0.8, -0.1, 0.2],
  [0.6, -0.5, 0.9, 0.4],
];
export const K_VECS: number[][] = [
  [0.5, -0.6, 0.3, 0.2],
  [0.9, 0.8, -0.1, 0.4],
  [0.6, 0.2, 0.9, -0.3],
  [-0.4, 0.7, 0.5, 0.8],
  [0.4, -0.7, 0.2, 0.3],
  [0.7, 0.3, -0.5, 0.9],
];
export const V_VECS: number[][] = [
  [0.2, 0.5, -0.3, 0.6],
  [0.9, -0.2, 0.7, 0.1],
  [0.4, 0.8, 0.2, -0.5],
  [-0.6, 0.3, 0.5, 0.7],
  [0.3, 0.4, -0.2, 0.5],
  [0.8, -0.4, 0.6, 0.2],
];

// ── the attention scores ────────────────────────────────────────────────────
/**
 * Handcrafted raw scores, already scaled — read them as q·k/√d_k.
 * Row = query token, column = key token. The narrative lives here:
 * "sat"→"cat" is the loudest pair, "mat" listens to "on"/"the", articles
 * look at their nouns, and the diagonal stays moderate.
 */
export const RAW_SCORES: number[][] = [
  //  the   cat   sat   on    the   mat
  [1.2, 2.6, 0.4, 0.1, 0.3, 0.5], // the  → cat (its noun)
  [1.8, 1.4, 2.9, 0.2, 0.1, 0.4], // cat  → sat (its verb)
  [0.3, 3.4, 1.6, 0.8, 0.2, 1.1], // sat  → cat (who sat?)
  [0.2, 0.5, 2.2, 1.3, 0.4, 2.9], // on   → mat (its object)
  [0.9, 0.3, 0.2, 0.7, 1.1, 3.0], // the  → mat (its noun)
  [0.4, 0.6, 1.5, 3.1, 2.2, 1.3], // mat  → on / the (where am I?)
];

/**
 * Softmax temperature. The raw scores above are pre-scaled to a ±3.4 range,
 * so T = 1 already leaves exactly one visibly dominant weight per row
 * (0.52–0.70, second place ≤ 0.26) without flattening the rest to zero.
 */
export const SOFTMAX_TEMPERATURE = 1.0;

/** REAL softmax (max-subtracted for stability) — the weights are not faked. */
export function softmaxRow(row: number[], temperature: number): number[] {
  const m = Math.max(...row);
  const exps = row.map((v) => Math.exp((v - m) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const WEIGHTS: number[][] = RAW_SCORES.map((r) => softmaxRow(r, SOFTMAX_TEMPERATURE));

/** raw scores normalized 0..1 for the heatmap ramp */
export const RAW_MAX = Math.max(...RAW_SCORES.flat());
export const RAW_NORM: number[][] = RAW_SCORES.map((r) => r.map((v) => v / RAW_MAX));

/** column the FOCUS row's spotlight lands on ("cat") */
export const DOM_COL = WEIGHTS[FOCUS].indexOf(Math.max(...WEIGHTS[FOCUS]));

// ── layout (1280 × 720 stage coordinates) ───────────────────────────────────
export const TOKEN_XS = [135, 230, 325, 420, 515, 610];
export const TOKEN_Y = 90;
export const FAN_Y = 132; // vector fans hang just under the chips
export const Q_Y = 200;
export const K_Y = 268;
export const V_Y = 336;
export const GLIDE_Y = K_Y - 48; // the roaming Q chip scans just above the K row
export const MATRIX_X = 700;
export const MATRIX_Y = 200;
export const CELL = 46;
export const GAP = 5;
export const OUT_X = TOKEN_XS[FOCUS];
export const OUT_Y = 34; // output chip floats above the "sat" token

// ── the timeline ────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const chipU = TOKENS.map((_, i) => tl.channel(`chip${i}`, 0));
  const fanU = tl.channel('fanU', 0); // one channel; per-token stagger is derived
  const qRowU = tl.channel('qRowU', 0);
  const kRowU = tl.channel('kRowU', 0);
  const vRowU = tl.channel('vRowU', 0);
  const qkvTexU = tl.channel('qkvTexU', 0);
  const satU = tl.channel('satU', 0); // focus ring on "sat"
  const qsatU = tl.channel('qsatU', 0); // the roaming Q chip
  const qsatX = tl.channel('qsatX', TOKEN_XS[FOCUS]);
  const qsatY = tl.channel('qsatY', Q_Y);
  const glideP = tl.channel('glideP', 0); // scan progress → row-2 cells fill
  const matU = tl.channel('matU', 0); // matrix frame + header labels
  const scoreTexU = tl.channel('scoreTexU', 0);
  const blend = tl.channel('blend', 0); // raw scores → softmax weights
  const domU = tl.channel('domU', 0); // spotlight ring on the dominant cell
  const softTexU = tl.channel('softTexU', 0);
  const vGather = tl.channel('vGather', 0); // V chips converge into the output
  const outU = tl.channel('outU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const fullP = tl.channel('fullP', 0); // ONE channel fills all 36 cells
  const dimU = tl.channel('dimU', 0); // beat 6 dims the left-hand scaffolding

  // ── beat 1 · tokens are vectors (0 – 9) ──
  tl.caption({ at: 0.5, dur: 4.6, text: 'Every word starts as a point in embedding space.' });
  stagger(N, { at: 0.7, each: 0.12, dur: 0.6, ease: ease.pop }).forEach((o, i) =>
    tl.tween(chipU[i], 1, o),
  );
  tl.tween(fanU, 1, { at: 2.0, dur: 1.5, ease: ease.enter });
  tl.caption({ at: 5.6, dur: 3.2, text: 'Six tokens, six vectors — no context yet.' });

  // ── beat 2 · Q, K, V (9 – 19) ──
  tl.caption({
    at: 9.2,
    dur: 5.2,
    text: 'Each word makes three copies of itself: a Query, a Key, and a Value.',
  });
  tl.tween(qRowU, 1, { at: 9.6, dur: 1.1, ease: ease.move });
  tl.tween(kRowU, 1, { at: 10.3, dur: 1.1, ease: ease.move });
  tl.tween(vRowU, 1, { at: 11.0, dur: 1.1, ease: ease.move });
  tl.tween(qkvTexU, 1, { at: 12.4, dur: 0.6, ease: ease.enter });
  tl.caption({ at: 14.8, dur: 3.8, text: 'Queries ask; Keys answer; Values carry the content.' });

  // ── beat 3 · scoring one row (19 – 31) ──
  tl.caption({
    at: 19.2,
    dur: 5.6,
    text: 'How much should “sat” listen to each word? Compare its Query against every Key.',
  });
  tl.tween(qkvTexU, 0, { at: 19.4, dur: 0.6 });
  tl.tween(satU, 1, { at: 19.4, dur: 0.6, ease: ease.enter });
  tl.tween(matU, 1, { at: 19.8, dur: 0.8, ease: ease.enter });
  tl.tween(qsatU, 1, { at: 20.0, dur: 0.4, ease: ease.enter });
  // glide down to the K row…
  tl.tween(qsatX, TOKEN_XS[0], { at: 20.4, dur: 0.9, ease: ease.move });
  tl.tween(qsatY, GLIDE_Y, { at: 20.4, dur: 0.9, ease: ease.move });
  // …then scan across it at constant speed; cells fill as it passes each Key
  tl.tween(qsatX, TOKEN_XS[N - 1], { at: 21.5, dur: 5.4, ease: ease.linear });
  tl.tween(glideP, 1, { at: 21.5, dur: 5.4, ease: ease.linear });
  tl.tween(scoreTexU, 1, { at: 21.2, dur: 0.6, ease: ease.enter });
  tl.caption({ at: 25.6, dur: 4.4, text: '“sat” and “cat” line up — a big raw score.' });
  tl.tween(qsatU, 0, { at: 28.4, dur: 0.8 });

  // ── beat 4 · softmax (31 – 41) ──
  tl.caption({
    at: 31.0,
    dur: 5.2,
    text: 'Softmax turns scores into a spotlight — positive weights that sum to 1.',
  });
  tl.tween(scoreTexU, 0, { at: 31.2, dur: 0.5 });
  tl.tween(softTexU, 1, { at: 31.5, dur: 0.6, ease: ease.enter });
  tl.tween(blend, 1, { at: 32.2, dur: 1.6, ease: ease.move });
  tl.tween(domU, 1, { at: 34.0, dur: 0.7, ease: ease.pop });
  tl.caption({ at: 36.6, dur: 3.8, text: '“sat” spends 70% of its attention on “cat”.' });

  // ── beat 5 · the weighted sum of Values (41 – 52) ──
  tl.caption({
    at: 41.2,
    dur: 5.4,
    text: 'Now blend the Values — each scaled by its weight — into one new vector for “sat”.',
  });
  tl.tween(vGather, 1, { at: 42.0, dur: 2.0, ease: ease.move });
  tl.tween(outU, 1, { at: 43.6, dur: 0.6, ease: ease.pop });
  tl.tween(formulaU, 1, { at: 44.6, dur: 0.7, ease: ease.enter });
  tl.caption({ at: 47.2, dur: 4.0, text: 'The output for “sat” is mostly “cat”, plus a memory of the rest.' });

  // ── beat 6 · everyone, in parallel (52 – end) ──
  tl.caption({
    at: 52.2,
    dur: 5.4,
    text: 'Every token does this at once — each row is one word attending to all the others.',
  });
  tl.tween(cam, { x: 660, y: 350, k: 0.92 }, { at: 52.4, dur: 1.8, ease: ease.move });
  tl.tween(dimU, 1, { at: 52.4, dur: 1.2, ease: ease.move });
  tl.tween(domU, 0, { at: 52.4, dur: 0.8 });
  tl.tween(fullP, 1, { at: 53.4, dur: 3.6, ease: ease.draw });
  tl.caption({ at: 58.4, dur: 4.4, text: 'That is self-attention: a soft, differentiable lookup table.' });
  tl.hold(63.2, 1.6);

  return {
    tl,
    cam,
    chipU,
    fanU,
    qRowU,
    kRowU,
    vRowU,
    qkvTexU,
    satU,
    qsatU,
    qsatX,
    qsatY,
    glideP,
    matU,
    scoreTexU,
    blend,
    domU,
    softTexU,
    vGather,
    outU,
    formulaU,
    fullP,
    dimU,
  };
}

export type AttentionScene = ReturnType<typeof buildScene>;
