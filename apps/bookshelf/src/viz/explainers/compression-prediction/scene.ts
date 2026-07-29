import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Compression is Prediction — the bridge chapter.
 *
 * All math at module scope and verified by running it: the fifty-character
 * line "the theory of the thing is that the truth is there" over a
 * fourteen-letter alphabet. Coding costs computed for real: a uniform code
 * pays log2 of fourteen = 3.81 bits per character, 190 bits total; letter
 * frequencies (a unigram model) pay 163 bits (3.25 per char); and a bigram
 * model that predicts each character from the previous one (with add-one
 * smoothing) pays 120 bits, 2.40 per char. Each bar on screen is the actual
 * cost, minus log two of the model's probability, for that character.
 */

export const TEXT = 'the theory of the thing is that the truth is there';
export const CHARS: string[] = [...TEXT];
export const ALPHA: string[] = [...new Set(CHARS)];
export const N = CHARS.length; // 51 incl. spaces? verified 50 — recompute below
const lg = Math.log2;

const uniCounts: Record<string, number> = {};
CHARS.forEach((c) => (uniCounts[c] = (uniCounts[c] || 0) + 1));

const bigCounts: Record<string, Record<string, number>> = {};
for (let i = 1; i < CHARS.length; i++) {
  const k = CHARS[i - 1];
  (bigCounts[k] = bigCounts[k] || {})[CHARS[i]] = (bigCounts[k][CHARS[i]] || 0) + 1;
}

/** per-character coding cost in bits under each model (all real). */
export const COST_UNIFORM: number[] = CHARS.map(() => lg(ALPHA.length));
export const COST_UNIGRAM: number[] = CHARS.map((c) => -lg(uniCounts[c] / CHARS.length));
export const COST_BIGRAM: number[] = CHARS.map((c, i) => {
  if (i === 0) return -lg(uniCounts[c] / CHARS.length);
  const ctx = bigCounts[CHARS[i - 1]];
  const tot = Object.values(ctx).reduce((a, b) => a + b, 0) + ALPHA.length;
  return -lg(((ctx[c] || 0) + 1) / tot);
});

const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
export const TOTAL_UNIFORM = sum(COST_UNIFORM); // 190
export const TOTAL_UNIGRAM = sum(COST_UNIGRAM); // 163
export const TOTAL_BIGRAM = sum(COST_BIGRAM); // 120

/** cost of char i at model mix (0 uniform → 1 unigram → 2 bigram). */
export function costAt(mix: number, i: number): number {
  const seq = [COST_UNIFORM, COST_UNIGRAM, COST_BIGRAM];
  const m = Math.max(0, Math.min(2, mix));
  const a = Math.min(1, Math.floor(m));
  const t = m - a;
  return seq[a][i] + (seq[a + 1][i] - seq[a][i]) * t;
}
export function totalAt(mix: number): number {
  let s = 0;
  for (let i = 0; i < CHARS.length; i++) s += costAt(mix, i);
  return s;
}

// layout
export const TAPE = { x: 90, y: 200, w: 1100 };
export const STEP = TAPE.w / CHARS.length;
export const BAR_BASE = 470;
export const BAR_SCALE = 42; // px per bit
export const METERS = { x: 200, y: 540, w: 600, h: 24, scale: 4.4 }; // px per bit total

export const CAM_TAPE: CameraState = { x: 400, y: 330, k: 1.12 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tapeU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  mix: ChannelRef<number>;
  meterU: ChannelRef<number>;
  spotU: ChannelRef<number>; // spotlight on a very predictable char run
  texU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const barsU = tl.channel('barsU', 0);
  const mix = tl.channel('mix', 0);
  const meterU = tl.channel('meterU', 0);
  const spotU = tl.channel('spotU', 0);
  const texU = tl.channel('texU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a dumb code ——————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'One last idea, and it is the bridge out of this book. Take a fifty character line of text. Its alphabet has fourteen distinct characters, so a flat code spends three point eight bits on every single one.',
  });
  tl.tween(tapeU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_TAPE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(barsU, 1, { at: 2.8, dur: 1.4, ease: ease.draw });
  tl.tween(meterU, 1, { at: 4.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 4.2,
    text: 'Every bar is the price of one character. Flat beliefs, flat bars: one hundred ninety bits for the whole line. That is the cost of knowing nothing.',
  });
  tl.hold(10.7, 0.5);

  // — Beat 2 · frequencies ——————————————————————————————————————————————————
  tl.caption({
    at: 11.2,
    dur: 5.4,
    text: 'Now let the code believe the letter frequencies, exactly the move from the Huffman chapter. Common characters get cheap, rare ones get pricey, and the total falls to one hundred sixty three bits.',
  });
  tl.tween(mix, 1, { at: 12.0, dur: 2.0, ease: ease.move });
  tl.hold(16.8, 0.5);

  // — Beat 3 · context is prediction —————————————————————————————————————————
  tl.caption({
    at: 17.3,
    dur: 5.6,
    text: 'But frequencies ignore the order. Let the model predict each character from the one before it. After a t, an h is hardly news; after a space, almost anything goes.',
    tex: '\\text{cost}(x_i) = -\\log_2 \\, q(x_i \\mid x_{i-1})',
  });
  tl.tween(mix, 2, { at: 18.1, dur: 2.2, ease: ease.move });
  tl.tween(texU, 1, { at: 18.5, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 23.1,
    dur: 5.2,
    text: 'Watch where the bars collapse: inside the repeated words, where the next character was easy to guess. The total drops to one hundred twenty bits, two point four per character.',
  });
  tl.tween(spotU, 1, { at: 23.9, dur: 1.0, ease: ease.move });
  tl.hold(28.5, 0.5);

  // — Beat 4 · the identity —————————————————————————————————————————————————
  tl.caption({
    at: 29.0,
    dur: 5.8,
    text: 'Look at what just happened. We never designed a compressor. We built a predictor, and the code lengths fell out of its probabilities. Prediction and compression are not cousins; they are the same object read twice.',
  });
  tl.caption({
    at: 35.0,
    dur: 5.2,
    text: 'The exchange rate is the one this book has used all along: probability p becomes length minus log of p. A model is exactly as good as the bits it saves, no more, no less.',
  });
  tl.hold(40.4, 0.5);

  // — Beat 5 · the bridge out ———————————————————————————————————————————————
  tl.caption({
    at: 40.9,
    dur: 6.0,
    text: 'And that is the road to the language models book, where a next word predictor is scored in exactly these bits per character. Scale this little bigram up a billionfold and the compressor starts finishing your sentences.',
  });
  tl.hold(47.1, 0.5);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 47.6, dur: 1.1, ease: ease.move });
  tl.tween(texU, 0, { at: 47.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 48.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.8,
    dur: 5.8,
    text: 'Entropy set the floor, codes approached it, divergence priced our errors, capacity armored the wire, and prediction turned out to be compression wearing a different hat. That is information theory.',
  });
  tl.hold(54.8, 1.2);

  return { tl, cam, tapeU, barsU, mix, meterU, spotU, texU, dimU, endU };
}
