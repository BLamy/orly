import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Next-Token Prediction as Compression.
 *
 * All math at module scope: a REAL character bigram model trained (with
 * add-one smoothing) on a small fixed corpus, then used to predict the next
 * character of a held-out sentence. Each character's surprisal, minus log
 * base two of the predicted probability, is the number of bits it costs to
 * transmit. The bars and the running bit total you see are those exact
 * numbers; nothing is approximated for effect.
 *
 * Empirics (verified by running this exact code): 28 symbols, so a blind
 * uniform code costs log2(28) = 4.81 bits per character. The trained bigram
 * predicts the test sentence at 2.28 bits per character — the model's edge
 * measured directly in saved bits.
 */

const CORPUS = (
  'the quick brown fox jumps over the lazy dog. ' +
  'the dog sleeps while the fox runs. ' +
  'a quick fox is a clever fox. ' +
  'the lazy dog and the quick fox are friends. ' +
  'over the river and through the woods the fox runs quickly. ' +
  'the quick quick fox jumps. the dog runs. the fox runs. '
).repeat(3);

export const VOCAB: string[] = Array.from(new Set(CORPUS.split(''))).sort();
export const V = VOCAB.length;
const idx = new Map(VOCAB.map((c, i) => [c, i]));

/** Add-one-smoothed bigram probabilities. */
const PROBS: number[][] = (() => {
  const counts = Array.from({ length: V }, () => new Array<number>(V).fill(1));
  for (let i = 0; i < CORPUS.length - 1; i++) counts[idx.get(CORPUS[i])!][idx.get(CORPUS[i + 1])!]++;
  return counts.map((row) => {
    const s = row.reduce((a, b) => a + b, 0);
    return row.map((c) => c / s);
  });
}) ();

export const UNIFORM_BITS = Math.log2(V); // 4.81

export const TEST = 'the quick brown fox runs. ';

export interface CharStep {
  ctx: string; // current character (the context)
  next: string; // the true next character
  p: number; // predicted probability of the true next char
  bits: number; // -log2 p
  cum: number; // cumulative bits up to and including this step
  dist: { ch: string; p: number }[]; // top predicted next chars
}

export const STEPS: CharStep[] = (() => {
  const out: CharStep[] = [];
  let cum = 0;
  for (let i = 0; i < TEST.length - 1; i++) {
    const ci = idx.get(TEST[i])!;
    const ni = idx.get(TEST[i + 1])!;
    const p = PROBS[ci][ni];
    const bits = -Math.log2(p);
    cum += bits;
    const dist = VOCAB.map((ch, j) => ({ ch, p: PROBS[ci][j] }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 6);
    out.push({ ctx: TEST[i], next: TEST[i + 1], p, bits, cum, dist });
  }
  return out;
})();

export const N_STEPS = STEPS.length;
export const TOTAL_BITS = STEPS[N_STEPS - 1].cum;
export const BITS_PER_CHAR = TOTAL_BITS / N_STEPS; // ~2.28
export const UNIFORM_TOTAL = UNIFORM_BITS * N_STEPS;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const TAPE_Y = 180;
export const CHIP_W = 40;
export const CHIP_GAP = 4;
export const tapeX = (i: number): number => 120 + i * (CHIP_W + CHIP_GAP);

/** Distribution bar chart (predicted next-char probs), centered lower-left. */
export const DIST_X = 250;
export const DIST_Y0 = 560;
export const DIST_BAR_W = 66;
export const distScale: ScaleLinear<number, number> = scaleLinear().domain([0, 0.65]).range([0, 220]);

/** The bits meter on the right. */
export const meterY: ScaleLinear<number, number> = scaleLinear().domain([0, UNIFORM_TOTAL]).range([600, 180]);
export const METER_X = 1120;

export const CAM_TAPE: CameraState = { x: 500, y: 300, k: 1.12 };
export const CAM_DIST: CameraState = { x: 430, y: 420, k: 1.3 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tapeU: ChannelRef<number>;
  cursor: ChannelRef<number>; // 0..N_STEPS — which character we are predicting
  distU: ChannelRef<number>;
  meterU: ChannelRef<number>;
  uniformU: ChannelRef<number>; // the uniform baseline line
  texU: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const cursor = tl.channel('cursor', 0);
  const distU = tl.channel('distU', 0);
  const meterU = tl.channel('meterU', 0);
  const uniformU = tl.channel('uniformU', 0);
  const texU = tl.channel('texU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the objective ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the entire training objective of a language model, and it is almost insultingly simple. Given the text so far, predict the next token. That is it. Everything else is scale.',
  });
  tl.tween(tapeU, 1, { at: 0.4, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAM_TAPE, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 6.4,
    dur: 5.4,
    text: 'It sounds too weak to produce intelligence. The reason it is not hides in an old idea: predicting well and compressing well are the same thing.',
  });
  tl.hold(11.9, 0.6);

  // — Beat 2 · a real prediction ————————————————————————————————————————————
  tl.tween(cam, CAM_DIST, { at: 12.5, dur: 1.5, ease: ease.move });
  tl.tween(badgeU, 1, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 13.1,
    dur: 6.0,
    text: 'Take a real, tiny model that just counts which character follows which. After the letters t and h, it has learned the next letter is very probably e. It is confident, and it is right.',
  });
  tl.tween(distU, 1, { at: 13.8, dur: 1.2, ease: ease.enter });
  tl.set(cursor, 1, 14.0);
  tl.tween(texU, 1, { at: 15.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 19.5,
    dur: 5.6,
    text: 'The cost of a correct guess is measured in bits: minus the base-two logarithm of the probability it assigned. A near-certain, correct e costs about one bit. A confident correct guess is cheap.',
    tex: '\\text{bits} = -\\log_2 p(\\text{next})',
  });
  tl.hold(25.3, 0.6);

  // — Beat 3 · a surprise ——————————————————————————————————————————————————
  tl.caption({
    at: 25.9,
    dur: 5.8,
    text: 'Now a hard spot. After a space, the model has no idea the word is brown. It spreads its bet thin, so the true letter gets a low probability, and this one character costs over five bits. Surprise is expensive.',
  });
  tl.set(cursor, 9, 26.6);
  tl.hold(32.1, 0.5);

  // — Beat 4 · the meter ————————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 32.6, dur: 1.5, ease: ease.move });
  tl.tween(meterU, 1, { at: 33.2, dur: 1.2, ease: ease.draw });
  tl.tween(uniformU, 1, { at: 33.6, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 33.4,
    dur: 5.8,
    text: 'Run across the whole sentence and add the bits up. Compare against a model that knows nothing and guesses uniformly: with twenty eight symbols, that blind code pays almost five bits every single character.',
  });
  tl.tween(cursor, N_STEPS, { at: 34.4, dur: 5.4, ease: ease.linear });
  tl.caption({
    at: 39.6,
    dur: 5.4,
    text: 'The little counting model pays two point three. That gap, nearly five down to two, is the model’s knowledge, measured in nothing but saved bits. Better prediction is literally smaller files.',
  });
  tl.hold(45.2, 0.6);

  // — Beat 5 · the leap ————————————————————————————————————————————————————
  tl.caption({
    at: 45.8,
    dur: 6.2,
    text: 'Now scale the intuition. To keep shaving bits off real text, a predictor has to learn grammar, then facts, then reasoning, because each is another regularity it can exploit. Squeezing the next token forces it to model the world that produced the text.',
  });
  tl.hold(52.6, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 53.2, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 53.2, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 53.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 54.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 54.4,
    dur: 5.6,
    text: 'So next-token prediction is not a toy task. It is compression, and compression of a rich enough signal demands understanding. The whole field is that one bet, taken very seriously.',
  });
  tl.caption({
    at: 60.4,
    dur: 5.0,
    text: 'Which raises the obvious question: how much better does this bet get as you scale it up? That has a startlingly clean answer.',
  });
  tl.hold(65.6, 1.2);

  return { tl, cam, tapeU, cursor, distU, meterU, uniformU, texU, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
