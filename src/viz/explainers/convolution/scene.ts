import { Timeline, ease, mulberry32 } from '../../core';

/**
 * Convolution — Sliding Windows That See.
 *
 * All data is precomputed here at module scope from a fixed seed: the 8×8
 * image (bright half / dark half, seeded texture), both 3×3 kernels, and both
 * 6×6 valid-convolution feature maps. The timeline is a pure function of this
 * data — every frame scrubs exactly (the scrubbability invariant).
 */

// ── the image: 8×8, bright left half, dark right half, seeded texture ───────
export const IMG_N = 8;
export const K_N = 3;
export const OUT_N = IMG_N - K_N + 1; // 6

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export const IMAGE: number[][] = (() => {
  const rand = mulberry32(5);
  const img: number[][] = [];
  for (let i = 0; i < IMG_N; i++) {
    const row: number[] = [];
    for (let j = 0; j < IMG_N; j++) {
      const base = j < IMG_N / 2 ? 0.9 : 0.1;
      row.push(clamp01(base + (rand() - 0.5) * 0.1));
    }
    img.push(row);
  }
  return img;
})();

// ── the kernels ──────────────────────────────────────────────────────────────
/** kernel #1 — box blur: every weight 1/9 (a plain average). */
export const BLUR_KERNEL: number[][] = [
  [1 / 9, 1 / 9, 1 / 9],
  [1 / 9, 1 / 9, 1 / 9],
  [1 / 9, 1 / 9, 1 / 9],
];

/** kernel #2 — vertical-edge Sobel: left column minus right column. */
export const SOBEL_KERNEL: number[][] = [
  [1, 0, -1],
  [2, 0, -2],
  [1, 0, -1],
];

/**
 * Kernel display mapping for MatrixGrid color: raw weight ∈ [−2, 2] → 0..1.
 * Affine, so a lerp of display values IS the display of the lerped raw values
 * — the crossfade between kernels stays exactly invertible (see fmtKernel).
 */
export const dispK = (raw: number) => (raw + 2) / 4;
export const BLUR_K_DISP: number[][] = BLUR_KERNEL.map((r) => r.map(dispK));
export const SOBEL_K_DISP: number[][] = SOBEL_KERNEL.map((r) => r.map(dispK));

/** Display value → raw kernel weight, formatted ("0.11", "1", "-2", …). */
export function fmtKernel(disp: number): string {
  const raw = disp * 4 - 2;
  const r = Math.round(raw);
  return Math.abs(raw - r) < 0.005 ? String(r) : raw.toFixed(2);
}

// ── the feature maps: valid convolution, fully precomputed ──────────────────
function convolveValid(img: number[][], k: number[][]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < OUT_N; i++) {
    const row: number[] = [];
    for (let j = 0; j < OUT_N; j++) {
      let s = 0;
      for (let u = 0; u < K_N; u++)
        for (let v = 0; v < K_N; v++) s += img[i + u][j + v] * k[u][v];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

/** Blur output — a weighted average of 0..1 pixels, so already 0..1. */
export const BLUR_OUT: number[][] = convolveValid(IMAGE, BLUR_KERNEL);

/** Sobel output — signed responses, shown as |response| normalized to 0..1. */
const SOBEL_RAW: number[][] = convolveValid(IMAGE, SOBEL_KERNEL);
const SOBEL_MAX = Math.max(...SOBEL_RAW.flat().map(Math.abs));
export const SOBEL_OUT: number[][] = SOBEL_RAW.map((r) =>
  r.map((v) => Math.abs(v) / SOBEL_MAX),
);

// ── the multiply-accumulate labels at the three dwell positions ─────────────
function macTex(oi: number, oj: number): string {
  const t = (u: number, v: number) => IMAGE[oi + u][oj + v].toFixed(2);
  return `\\tfrac{1}{9}\\,(${t(0, 0)} + ${t(0, 1)} + ${t(0, 2)} + \\cdots + ${t(2, 2)}) = ${BLUR_OUT[oi][oj].toFixed(2)}`;
}

/** row-major output positions where the slide slows down, with real numbers */
export const MACS = [
  { pos: 0, tex: macTex(0, 0) }, // all bright — average stays bright
  { pos: 14, tex: macTex(2, 2) }, // straddles the edge — lands in between
  { pos: 28, tex: macTex(4, 4) }, // all dark — average stays dark
] as const;

// ── layout (1280 × 720 stage; captions own the bottom ~12%, y ≳ 633) ───────
export const CELL = 46;
export const GAP = 5;
export const PITCH = CELL + GAP;
export const IMG = { x: 90, y: 150 }; // 8×8 → spans x 90..493, y 150..553
export const OUT = { x: 880, y: 200 }; // 6×6 → spans x 880..1181, y 200..501
export const KCELL = 48;
export const KGAP = 5;
export const KPITCH = KCELL + KGAP;
export const KER = { x: 563, y: 40 }; // 3×3 → spans x 563..717, y 40..194
export const MAC_Y = 556; // multiply-accumulate line, under both grids (clear of the caption lower-third)

export const T_TOTAL = 63.4;

// ── the timeline ─────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();

  const imgP = tl.channel('imgP', 0); // one channel; 64 cells cascade from it
  const kernelU = tl.channel('kernelU', 0); // kernel entrance (9-cell stagger)
  const overlayU = tl.channel('overlayU', 0); // window rect + kernel-on-image
  const slideP = tl.channel('slideP', 0); // THE slide: position = floor(p·36)
  const outPanelU = tl.channel('outPanelU', 0); // feature-map panel + title
  const macU = MACS.map((_, i) => tl.channel(`mac${i}U`, 0)); // dwell math
  const kBlend = tl.channel('kBlend', 0); // 0 = box blur, 1 = Sobel
  const formulaU = tl.channel('formulaU', 0); // (f∗g) definition

  // ── beat 1 · an image is a grid of numbers (0 – 9.4) ──
  tl.caption({
    at: 0.5,
    dur: 4.6,
    text: 'To a computer, an image is just a grid of numbers — each one a brightness between 0 and 1.',
  });
  tl.tween(imgP, 1, { at: 0.7, dur: 3.0, ease: ease.draw });
  tl.caption({
    at: 5.4,
    dur: 3.6,
    text: 'This one is half bright, half dark — an edge runs down the middle.',
  });
  tl.hold(9.0, 0.4);

  // ── beat 2 · meet the window (9.4 – 14.8) ──
  tl.caption({
    at: 9.4,
    dur: 5.0,
    text: 'Meet the kernel: a 3×3 window of weights. This one is all 1/9 — it takes an average.',
  });
  tl.tween(kernelU, 1, { at: 9.7, dur: 0.9, ease: ease.enter });
  tl.hold(14.4, 0.4);

  // ── beat 3 · the slide (14.8 – 38.6) ──
  tl.caption({
    at: 14.8,
    dur: 5.4,
    text: 'Lay the window on the image: multiply each overlapping pair, add the nine products — that is one output pixel.',
  });
  tl.tween(overlayU, 1, { at: 15.0, dur: 0.5, ease: ease.enter });
  tl.tween(outPanelU, 1, { at: 15.2, dur: 0.6, ease: ease.enter });
  // dwell #1 — top-left, everything bright
  tl.tween(slideP, (MACS[0].pos + 0.5) / 36, { at: 15.6, dur: 0.7, ease: ease.move });
  tl.tween(macU[0], 1, { at: 16.4, dur: 0.5, ease: ease.enter });
  tl.tween(macU[0], 0, { at: 20.0, dur: 0.4, ease: ease.enter });
  tl.caption({
    at: 20.4,
    dur: 3.6,
    text: 'Multiply, add, move on. Each stop writes one pixel of a new, smaller image.',
  });
  // fast sweep to the edge…
  tl.tween(slideP, (MACS[1].pos + 0.5) / 36, { at: 20.8, dur: 2.4, ease: ease.linear });
  // dwell #2 — the window straddles the edge
  tl.caption({
    at: 24.4,
    dur: 5.6,
    text: 'Here the window straddles the edge — bright numbers on the left, dark on the right — and the average lands in between.',
  });
  tl.tween(macU[1], 1, { at: 24.8, dur: 0.5, ease: ease.enter });
  tl.tween(macU[1], 0, { at: 29.6, dur: 0.4, ease: ease.enter });
  // fast sweep into the dark half…
  tl.tween(slideP, (MACS[2].pos + 0.5) / 36, { at: 30.2, dur: 1.9, ease: ease.linear });
  // dwell #3 — everything dark
  tl.caption({
    at: 32.3,
    dur: 4.0,
    text: 'Deep in the dark half, every product is tiny — so the sum is, too.',
  });
  tl.tween(macU[2], 1, { at: 32.6, dur: 0.5, ease: ease.enter });
  tl.tween(macU[2], 0, { at: 36.0, dur: 0.4, ease: ease.enter });
  // …and finish the pass
  tl.tween(slideP, 1, { at: 36.4, dur: 1.5, ease: ease.linear });
  tl.tween(overlayU, 0, { at: 38.1, dur: 0.5, ease: ease.enter });
  tl.hold(38.6, 0.2);

  // ── beat 4 · the blur result (38.8 – 44.2) ──
  tl.caption({
    at: 38.8,
    dur: 4.8,
    text: 'Thirty-six stops later: a blur. Averaging smears the hard edge into a soft ramp.',
  });
  tl.hold(43.6, 0.6);

  // ── beat 5 · same machine, different window (44.2 – 56.2) ──
  tl.caption({
    at: 44.2,
    dur: 4.8,
    text: 'Now keep the machine and swap only the weights — a different window on the same image.',
  });
  tl.tween(kBlend, 1, { at: 44.8, dur: 2.2, ease: ease.move });
  tl.caption({
    at: 49.4,
    dur: 6.2,
    text: 'This Sobel kernel subtracts right from left: silent where neighbors agree, loud where they differ. It sees the edge.',
  });
  tl.tween(formulaU, 1, { at: 50.0, dur: 0.7, ease: ease.enter });
  tl.hold(55.6, 0.6);

  // ── beat 6 · finale (56.2 – end) ──
  tl.caption({
    at: 56.2,
    dur: 5.4,
    text: 'A convolutional network learns thousands of these little windows — edge-finders, texture-finders, eye-finders — all from slide, multiply, add.',
  });
  tl.hold(61.9, 1.5); // total = T_TOTAL

  return { tl, imgP, kernelU, overlayU, slideP, outPanelU, macU, kBlend, formulaU };
}

export type ConvolutionScene = ReturnType<typeof buildScene>;
