import { Timeline, ease, mulberry32 } from '../../core';

/**
 * Entropy — Counting Surprise.
 *
 * Shannon's move, animated: surprise = log2(1/p) as a curve, a four-outcome
 * weather forecast as bars, entropy as the probability-weighted average of
 * the bars' surprises, and the payoff — codeword lengths whose average hits
 * exactly H. All data lives at module scope; every frame is a pure function
 * of the sampled channels (the scrubbability invariant).
 */

export const LABELS = ['sun', 'clouds', 'rain', 'snow'];
/** Prefix-free code matched to P_SKEW — lengths 1,2,3,3 → mean 1.75 bits. */
export const CODES = ['0', '10', '110', '111'];

export const P_SKEW = [0.5, 0.25, 0.125, 0.125];
const P_UNIFORM = [0.25, 0.25, 0.25, 0.25];
const P_CERTAIN = [0.94, 0.02, 0.02, 0.02];

/** Layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633). */
export const CURVE = { pMin: 0.016, iMax: 6 };
export const BARS = { x0: 700, step: 124, w: 78, base: 560, hMax: 330 };
export const METER = { x: 700, y: 128, w: 480, h: 24, hMax: 2 };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Surprise (self-information) in bits. */
export const surprise = (p: number) => Math.log2(1 / Math.max(p, 1e-9));

/** Shannon entropy of a distribution, in bits. */
export function entropyOf(probs: number[]): number {
  let h = 0;
  for (const p of probs) if (p > 1e-9) h += p * Math.log2(1 / p);
  return h;
}

/**
 * The displayed distribution as a pure function of the three morph channels:
 * skew → uniform (u1), → near-certain (u2), → back to skew (u3). Chaining
 * lerps keeps every intermediate frame a valid distribution (sums to 1).
 */
export function probsAt(u1: number, u2: number, u3: number): number[] {
  return P_SKEW.map((p, i) => {
    const a = p + (P_UNIFORM[i] - p) * u1;
    const b = a + (P_CERTAIN[i] - a) * u2;
    return b + (P_SKEW[i] - b) * u3;
  });
}

/** A seeded broadcast of ~30 forecasts, already encoded — the beat-5 stream. */
export const STREAM_BITS: string = (() => {
  const rand = mulberry32(2024);
  const parts: string[] = [];
  for (let m = 0; m < 30; m++) {
    const r = rand();
    const k = r < 0.5 ? 0 : r < 0.75 ? 1 : r < 0.875 ? 2 : 3;
    parts.push(CODES[k]);
  }
  return parts.join(' ');
})();

export const T_TOTAL = 66.6;

export function buildScene() {
  const tl = new Timeline();

  const axesU = tl.channel('axesU', 0); // surprise-curve axes draw-on
  const curveU = tl.channel('curveU', 0); // I(p) draw-on
  const texIU = tl.channel('texIU', 0); // I(p) = log2 1/p label
  const dotU = tl.channel('dotU', 0); // the sliding event dot
  const dotP = tl.channel('dotP', 0.95); // its probability
  const barPop = LABELS.map((l) => tl.channel(`bar_${l}`, 0)); // bar entrances
  const surpP = tl.channel('surpP', 0); // surprise chips stagger (0..1 → 4 chips)
  const meterU = tl.channel('meterU', 0); // H meter reveal
  const texHU = tl.channel('texHU', 0); // H = Σ p log 1/p
  const m1 = tl.channel('morphToUniform', 0);
  const m2 = tl.channel('morphToCertain', 0);
  const m3 = tl.channel('morphBackToSkew', 0);
  const codeP = tl.channel('codeP', 0); // codewords stagger
  const streamP = tl.channel('streamP', 0); // encoded broadcast scroll
  const texAvgU = tl.channel('texAvgU', 0); // mean code length = H

  // ---- beat 1: information is surprise; the curve I(p) --------------------
  tl.caption({
    at: 0.3,
    dur: 6.2,
    text: "How much does a message tell you? Shannon's move: don't measure meaning — measure surprise.",
  });
  tl.tween(axesU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(curveU, 1, { at: 1.8, dur: 1.5, ease: ease.draw });
  tl.tween(texIU, 1, { at: 3.6, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.6,
    text: "'The sun rose' — no news. 'Snow in July' — stop the presses. Rare means informative.",
  });
  tl.tween(dotU, 1, { at: 7.2, dur: 0.6, ease: ease.enter });
  tl.tween(dotP, 0.06, { at: 8.0, dur: 3.4, ease: ease.move });
  tl.hold(12.5, 0.6);

  // ---- beat 2: a four-outcome forecast, read off the curve ----------------
  tl.caption({
    at: 13.1,
    dur: 5.8,
    text: 'A four-outcome forecast: sun half the time, clouds a quarter, rain or snow an eighth each.',
  });
  tl.tween(dotU, 0, { at: 13.2, dur: 0.8, ease: ease.move }); // the hook dot exits
  for (let i = 0; i < barPop.length; i++) {
    tl.tween(barPop[i], 1, { at: 13.7 + i * 0.35, dur: 0.55, ease: ease.pop });
  }
  tl.caption({
    at: 19.3,
    dur: 5.4,
    text: "Read each outcome's surprise off the curve: 1 bit, 2 bits, 3 and 3.",
  });
  tl.tween(surpP, 1, { at: 19.8, dur: 1.6, ease: ease.enter });
  tl.hold(25.1, 0.6);

  // ---- beat 3: entropy = the expected surprise -----------------------------
  tl.caption({
    at: 25.8,
    dur: 6.2,
    text: "Entropy is the average surprise — each outcome's bits, weighted by how often it shows up.",
  });
  tl.tween(texHU, 1, { at: 26.4, dur: 0.8, ease: ease.enter });
  tl.tween(meterU, 1, { at: 28.2, dur: 1.1, ease: ease.draw });
  tl.caption({
    at: 32.4,
    dur: 4.6,
    text: 'For this sky: H = 1.75 bits per forecast. Remember that number.',
  });
  tl.hold(37.1, 0.5);

  // ---- beat 4: morph the distribution; watch H breathe ---------------------
  tl.caption({
    at: 37.8,
    dur: 5.4,
    text: 'Flatten the odds and entropy peaks — four equal outcomes cost the full 2 bits.',
  });
  tl.tween(m1, 1, { at: 38.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 43.6,
    dur: 5.6,
    text: 'Make one outcome near-certain and entropy collapses — you already knew the answer.',
  });
  tl.tween(m2, 1, { at: 44.2, dur: 1.6, ease: ease.move });
  tl.tween(m3, 1, { at: 49.4, dur: 1.4, ease: ease.move });
  tl.hold(50.9, 0.5);

  // ---- beat 5: the coding payoff — H is the floor ---------------------------
  tl.caption({
    at: 51.6,
    dur: 6.0,
    text: 'The payoff: give short codewords to common skies — 0, 10, 110, 111.',
  });
  tl.tween(codeP, 1, { at: 52.2, dur: 1.5, ease: ease.enter });
  tl.caption({
    at: 58.0,
    dur: 6.8,
    text: 'Average length: 1.75 bits — exactly H. Entropy is the floor no code can beat.',
  });
  tl.tween(texAvgU, 1, { at: 58.6, dur: 0.8, ease: ease.enter });
  tl.tween(streamP, 1, { at: 57.8, dur: 8.2, ease: ease.linear });
  tl.hold(65.4, 1.2); // total = T_TOTAL

  return {
    tl,
    ch: {
      axesU,
      curveU,
      texIU,
      dotU,
      dotP,
      barPop,
      surpP,
      meterU,
      texHU,
      m1,
      m2,
      m3,
      codeP,
      streamP,
      texAvgU,
    },
  };
}

export { clamp01 };
