import { Timeline, ease, colors } from '../../core';
import type { ChannelRef } from '../../core';

/**
 * Bloom Filters — Certainty About Absence.
 *
 * Everything is hardcoded and computed once at module scope: the 24-bit
 * strip, the k=3 hash targets per word, and the false-positive-rate table
 * for the finale. The timeline is a pure function of this data, so every
 * frame scrubs exactly (the scrubbability invariant). No Math.random, no
 * Date.now — the "hashes" are hand-picked to tell the story:
 *
 *   cat  → {2, 9, 17}   insert
 *   dog  → {5, 9, 20}   insert (bit 9 collides with cat — shared bit!)
 *   fish → {0, 13, 22}  insert
 *   fox  → {4, 11, 17}  query  (bit 11 is 0 → definite NO)
 *   cow  → {2, 5, 13}   query  (all set by other words → false positive)
 */

export const M = 24; // bits
export const K = 3; // hash functions

// ── layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633). ──
export const STRIP = { x: 67, y: 380, cell: 42, gap: 6 }; // strip spans x 67..1213
export const PITCH = STRIP.cell + STRIP.gap;
/** center x of bit i */
export const bitX = (i: number) => STRIP.x + i * PITCH + STRIP.cell / 2;
export const CHIP = { y: 150, w: 132, h: 48 };
export const VERDICT = { dx: 250, w: 288, h: 44 }; // beside the query chip
export const GHOST = { y: 478, w: 68, h: 28 }; // owner tags below the strip
export const FINALE = { mathY: 152, labelY: 204, meterY: 224, meterX: 440, meterW: 400, meterH: 14 };

// ── the cast ────────────────────────────────────────────────────────────────
export interface OpSpec {
  word: string;
  /** chip text ("cat" for inserts, "cat?" for queries) */
  label: string;
  bits: [number, number, number];
  /** chip center x */
  x: number;
  /** chip + arrow color */
  color: string;
  verdictText?: string;
  verdictColor?: string;
}

export const CAT: OpSpec = { word: 'cat', label: 'cat', bits: [2, 9, 17], x: 640, color: colors.ACCENT };
export const DOG: OpSpec = { word: 'dog', label: 'dog', bits: [5, 9, 20], x: 460, color: colors.SECONDARY };
export const FISH: OpSpec = { word: 'fish', label: 'fish', bits: [0, 13, 22], x: 820, color: colors.TEAL };
export const Q_CAT: OpSpec = {
  word: 'cat',
  label: 'cat?',
  bits: [2, 9, 17],
  x: 640,
  color: colors.TEXT,
  verdictText: 'probably in ✓',
  verdictColor: colors.POSITIVE,
};
export const Q_FOX: OpSpec = {
  word: 'fox',
  label: 'fox?',
  bits: [4, 11, 17],
  x: 640,
  color: colors.TEXT,
  verdictText: 'definitely NOT in ✗',
  verdictColor: colors.NEGATIVE,
};
export const Q_COW: OpSpec = {
  word: 'cow',
  label: 'cow?',
  bits: [2, 5, 13],
  x: 640,
  color: colors.TEXT,
  verdictText: 'probably in… (wrong)',
  verdictColor: colors.WARM,
};

/** beat 6: which insert actually lit each of cow's bits */
export const GHOSTS = [
  { word: 'cat', bit: 2, color: colors.ACCENT },
  { word: 'dog', bit: 5, color: colors.SECONDARY },
  { word: 'fish', bit: 13, color: colors.TEAL },
];

// ── finale: (1 − e^{−kn/m})^k, precomputed for n = 3…8 ─────────────────────
export const FPP = [3, 4, 5, 6, 7, 8].map((n) => {
  const fill = 1 - Math.exp(-(K * n) / M); // expected fraction of bits lit
  return { n, fill, p: Math.pow(fill, K) }; // false-positive probability
});

export const T_TOTAL = 69.8;

export interface Op {
  spec: OpSpec;
  /** 0→1 entrance (slides down + fades); →0 fades the whole op out */
  chip: ChannelRef<number>;
  /** per-hash arrow growth, index-matched to spec.bits */
  arrows: ChannelRef<number>[];
  /** query result rings (POSITIVE / NEGATIVE) */
  glow?: ChannelRef<number>;
  verdict?: ChannelRef<number>;
}

export function buildScene() {
  const tl = new Timeline();

  const stripU = tl.channel('stripU', 0); // bit strip draw-on (staggered)
  const bits = Array.from({ length: M }, (_, i) => tl.channel(`bit${i}`, 0)); // 0→1 flips
  const flash9 = tl.channel('flash9', 0); // WARM blink when dog re-sets bit 9
  const foxMiss = tl.channel('foxMiss', 0); // the big NEGATIVE glow on bit 11
  const ghosts = GHOSTS.map((g) => tl.channel(`ghost-${g.word}`, 0)); // owner tags
  const meterU = tl.channel('meterU', 0); // fill-rate meter draw-on
  const mathU = tl.channel('mathU', 0); // the (1−e^{−kn/m})^k label
  const fillU = tl.channel('fillU', 0); // meter fill fraction (smooth)
  const nIdx = tl.channel('nIdx', 0); // index into FPP (stepped)

  const op = (spec: OpSpec, kind: 'insert' | 'query'): Op => ({
    spec,
    chip: tl.channel(`${kind}-${spec.word}/chip`, 0),
    arrows: spec.bits.map((b) => tl.channel(`${kind}-${spec.word}/h→${b}`, 0)),
    ...(kind === 'query'
      ? {
          glow: tl.channel(`query-${spec.word}/glow`, 0),
          verdict: tl.channel(`query-${spec.word}/verdict`, 0),
        }
      : {}),
  });

  const cat = op(CAT, 'insert');
  const dog = op(DOG, 'insert');
  const fish = op(FISH, 'insert');
  const qcat = op(Q_CAT, 'query');
  const qfox = op(Q_FOX, 'query');
  const qcow = op(Q_COW, 'query');

  // ---- beat 1: the empty strip ------------------------------------------
  tl.tween(stripU, 1, { at: 0.3, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: "24 bits — that's the whole database. It'll answer “have I seen this?” almost for free.",
  });
  tl.hold(6.7, 0.5);

  // ---- beat 2: INSERT cat -------------------------------------------------
  tl.caption({
    at: 7.4,
    dur: 5.2,
    text: 'Insert cat: three hash functions each pick a bit. Flip all three to 1.',
  });
  tl.tween(cat.chip, 1, { at: 7.6, dur: 0.7, ease: ease.enter });
  tl.tween(cat.arrows[0], 1, { at: 8.5, dur: 0.9, ease: ease.draw }); // → bit 2
  tl.tween(cat.arrows[1], 1, { at: 9.1, dur: 0.9, ease: ease.draw }); // → bit 9
  tl.tween(cat.arrows[2], 1, { at: 9.7, dur: 0.9, ease: ease.draw }); // → bit 17
  tl.tween(bits[2], 1, { at: 9.3, dur: 0.5, ease: ease.pop });
  tl.tween(bits[9], 1, { at: 9.9, dur: 0.5, ease: ease.pop });
  tl.tween(bits[17], 1, { at: 10.5, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 12.8,
    dur: 4.0,
    text: "Three hashes, three bits — that's the entire write. No copy of “cat” is stored anywhere.",
  });
  tl.tween(cat.chip, 0, { at: 16.2, dur: 0.6, ease: ease.enter });
  tl.hold(16.8, 0.4);

  // ---- beat 3: INSERT dog + fish, overlapping ----------------------------
  tl.caption({
    at: 17.4,
    dur: 4.8,
    text: 'dog and fish check in the same way. But keep an eye on bit 9.',
  });
  tl.tween(dog.chip, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.tween(fish.chip, 1, { at: 18.2, dur: 0.6, ease: ease.enter });
  tl.tween(dog.arrows[0], 1, { at: 18.3, dur: 0.8, ease: ease.draw }); // → bit 5
  tl.tween(dog.arrows[1], 1, { at: 18.7, dur: 0.8, ease: ease.draw }); // → bit 9 (again!)
  tl.tween(dog.arrows[2], 1, { at: 19.1, dur: 0.8, ease: ease.draw }); // → bit 20
  tl.tween(fish.arrows[0], 1, { at: 18.9, dur: 0.8, ease: ease.draw }); // → bit 0
  tl.tween(fish.arrows[1], 1, { at: 19.3, dur: 0.8, ease: ease.draw }); // → bit 13
  tl.tween(fish.arrows[2], 1, { at: 19.7, dur: 0.8, ease: ease.draw }); // → bit 22
  tl.tween(bits[5], 1, { at: 19.0, dur: 0.5, ease: ease.pop });
  // bit 9 was already 1 — a subtle WARM double-blink, not a flip
  tl.tween(flash9, 1, { at: 19.5, dur: 0.3, ease: ease.pop });
  tl.tween(flash9, 0, { at: 20.1, dur: 0.5, ease: ease.pulse });
  tl.tween(flash9, 1, { at: 20.7, dur: 0.3, ease: ease.pulse });
  tl.tween(flash9, 0, { at: 21.2, dur: 0.6, ease: ease.pulse });
  tl.tween(bits[20], 1, { at: 19.8, dur: 0.5, ease: ease.pop });
  tl.tween(bits[0], 1, { at: 19.6, dur: 0.5, ease: ease.pop });
  tl.tween(bits[13], 1, { at: 20.0, dur: 0.5, ease: ease.pop });
  tl.tween(bits[22], 1, { at: 20.4, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 22.4,
    dur: 5.0,
    text: 'dog also hashed to bit 9 — cat had already lit it. Bits get shared between words. Remember that.',
  });
  tl.tween(dog.chip, 0, { at: 27.0, dur: 0.6, ease: ease.enter });
  tl.tween(fish.chip, 0, { at: 27.0, dur: 0.6, ease: ease.enter });
  tl.hold(27.6, 0.4);

  // ---- beat 4: QUERY cat --------------------------------------------------
  tl.caption({
    at: 28.2,
    dur: 4.8,
    text: 'Query cat: run the same three hashes and just look.',
  });
  tl.tween(qcat.chip, 1, { at: 28.4, dur: 0.6, ease: ease.enter });
  tl.tween(qcat.arrows[0], 1, { at: 29.2, dur: 0.8, ease: ease.draw });
  tl.tween(qcat.arrows[1], 1, { at: 29.6, dur: 0.8, ease: ease.draw });
  tl.tween(qcat.arrows[2], 1, { at: 30.0, dur: 0.8, ease: ease.draw });
  tl.tween(qcat.glow!, 1, { at: 30.9, dur: 0.6, ease: ease.pop });
  tl.tween(qcat.verdict!, 1, { at: 31.7, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 33.2,
    dur: 3.8,
    text: 'All three lit — probably seen it. That “probably” is doing honest work.',
  });
  tl.tween(qcat.chip, 0, { at: 36.6, dur: 0.6, ease: ease.enter });
  tl.hold(37.2, 0.4);

  // ---- beat 5: QUERY fox — the killer feature -----------------------------
  tl.caption({
    at: 37.8,
    dur: 4.6,
    text: 'Query fox: bits 4 and 17 check out… but bit 11 is still 0.',
  });
  tl.tween(qfox.chip, 1, { at: 38.0, dur: 0.6, ease: ease.enter });
  tl.tween(qfox.arrows[0], 1, { at: 38.8, dur: 0.8, ease: ease.draw }); // → bit 4
  tl.tween(qfox.arrows[2], 1, { at: 39.2, dur: 0.8, ease: ease.draw }); // → bit 17
  tl.tween(qfox.arrows[1], 1, { at: 39.7, dur: 0.9, ease: ease.draw }); // → bit 11, saved for last
  tl.tween(qfox.glow!, 1, { at: 40.2, dur: 0.5, ease: ease.pop });
  tl.tween(foxMiss, 1, { at: 40.8, dur: 0.7, ease: ease.pop });
  tl.tween(qfox.verdict!, 1, { at: 41.7, dur: 0.5, ease: ease.pop });
  tl.tween(foxMiss, 0.75, { at: 41.9, dur: 0.6, ease: ease.pulse }); // keyframed breathing
  tl.tween(foxMiss, 1, { at: 42.5, dur: 0.6, ease: ease.pulse });
  tl.caption({
    at: 42.8,
    dur: 5.6,
    text: 'One dark bit is proof — fox was never inserted. Bloom filters never lie about absence. That’s the killer feature.',
  });
  tl.tween(qfox.chip, 0, { at: 48.0, dur: 0.6, ease: ease.enter });
  tl.hold(48.6, 0.4);

  // ---- beat 6: QUERY cow — the false positive -----------------------------
  tl.caption({
    at: 49.2,
    dur: 4.6,
    text: 'Query cow: bits 2, 5, 13 — all lit. Nobody ever inserted cow.',
  });
  tl.tween(qcow.chip, 1, { at: 49.4, dur: 0.6, ease: ease.enter });
  tl.tween(qcow.arrows[0], 1, { at: 50.2, dur: 0.8, ease: ease.draw });
  tl.tween(qcow.arrows[1], 1, { at: 50.6, dur: 0.8, ease: ease.draw });
  tl.tween(qcow.arrows[2], 1, { at: 51.0, dur: 0.8, ease: ease.draw });
  tl.tween(qcow.glow!, 1, { at: 51.9, dur: 0.5, ease: ease.pop });
  tl.tween(ghosts[0], 1, { at: 52.6, dur: 0.5, ease: ease.enter }); // cat lit bit 2
  tl.tween(ghosts[1], 1, { at: 52.9, dur: 0.5, ease: ease.enter }); // dog lit bit 5
  tl.tween(ghosts[2], 1, { at: 53.2, dur: 0.5, ease: ease.enter }); // fish lit bit 13
  tl.tween(qcow.verdict!, 1, { at: 54.0, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 54.4,
    dur: 5.6,
    text: 'A false positive. cat, dog and fish each lit one bit — together they happen to spell “yes”.',
  });
  for (const g of ghosts) tl.tween(g, 0, { at: 59.4, dur: 0.6, ease: ease.enter });
  tl.tween(qcow.chip, 0, { at: 59.4, dur: 0.6, ease: ease.enter });
  tl.hold(60.0, 0.4);

  // ---- beat 7: finale — the dials ----------------------------------------
  tl.caption({
    at: 60.6,
    dur: 7.6,
    text: 'That’s the deal: tune m and k, pay a few bits per word, and the leak stays small — while “no” stays certain.',
  });
  tl.tween(mathU, 1, { at: 60.8, dur: 0.6, ease: ease.enter });
  tl.tween(meterU, 1, { at: 60.8, dur: 0.8, ease: ease.draw });
  tl.tween(fillU, FPP[0].fill, { at: 61.0, dur: 0.6, ease: ease.move });
  for (let i = 1; i < FPP.length; i++) {
    const at = 62.4 + (i - 1) * 1.2; // n steps to 4, 5, 6, 7, 8
    tl.set(nIdx, i, at);
    tl.tween(fillU, FPP[i].fill, { at, dur: 0.5, ease: ease.move });
  }
  tl.hold(68.2, 1.6); // total = T_TOTAL

  return { tl, stripU, bits, flash9, foxMiss, ghosts, meterU, mathU, fillU, nIdx, cat, dog, fish, qcat, qfox, qcow };
}
