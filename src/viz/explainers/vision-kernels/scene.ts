import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Vision Kernels — a bank of feature detectors.
 *
 * A real 12×12 image (a filled square + a 4×4 checkerboard patch) is
 * convolved at module scope with three real 3×3 kernels — Sobel vertical,
 * Sobel horizontal, and a checker/texture kernel. The three feature maps
 * shown on screen ARE those convolutions, normalized per map. The
 * checkerboard's period-2 alternation makes both Sobel responses exactly
 * zero on the patch interior — the "texture hides from the edge detectors"
 * beat is a computed fact, not an illustration.
 */

export const IMG_N = 12;
export const OUT_N = 10; // valid convolution: 12 − 3 + 1

// ---------------------------------------------------------------------------
// The image: filled bright square rows/cols 1..6, checkerboard rows/cols 8..11
// ---------------------------------------------------------------------------
export const IMAGE: number[][] = (() => {
  const g: number[][] = Array.from({ length: IMG_N }, () => new Array(IMG_N).fill(0.04));
  for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) g[i][j] = 1.0;
  for (let i = 8; i <= 11; i++)
    for (let j = 8; j <= 11; j++) g[i][j] = (i + j) % 2 === 0 ? 0.95 : 0.08;
  return g;
})();

// ---------------------------------------------------------------------------
// The kernel bank (real weights)
// ---------------------------------------------------------------------------
export const K_VERT: number[][] = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];
export const K_HORZ: number[][] = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];
export const K_TEX: number[][] = [
  [1, -1, 1],
  [-1, 1, -1],
  [1, -1, 1],
];

/** Valid 3×3 convolution → 10×10 map of |response|, normalized to its max. */
function convolveAbs(kernel: number[][]): number[][] {
  const raw: number[][] = [];
  let max = 1e-9;
  for (let i = 0; i < OUT_N; i++) {
    const row: number[] = [];
    for (let j = 0; j < OUT_N; j++) {
      let acc = 0;
      for (let u = 0; u < 3; u++)
        for (let v = 0; v < 3; v++) acc += IMAGE[i + u][j + v] * kernel[u][v];
      const a = Math.abs(acc);
      row.push(a);
      if (a > max) max = a;
    }
    raw.push(row);
  }
  return raw.map((r) => r.map((v) => v / max));
}

export const MAP_VERT: number[][] = convolveAbs(K_VERT);
export const MAP_HORZ: number[][] = convolveAbs(K_HORZ);
export const MAP_TEX: number[][] = convolveAbs(K_TEX);

/**
 * Computed facts the narration leans on (verified by the module itself):
 * the checker patch interior is invisible to both Sobel kernels.
 * Patch-interior output cells are those whose 3×3 window sits fully inside
 * rows/cols 8..11 → output rows/cols 8..9.
 */
export const CHECKER_SOBEL_MAX: number = (() => {
  let m = 0;
  for (let i = 8; i <= 9; i++)
    for (let j = 8; j <= 9; j++) m = Math.max(m, MAP_VERT[i][j], MAP_HORZ[i][j]);
  return m; // = 0 exactly (period-2 alternation cancels Sobel columns/rows)
})();

/** Seeded "birth" kernels for the training beat — what random init looks like. */
export const K_RANDOM: number[][][] = (() => {
  const rand = mulberry32(41);
  return [0, 1, 2].map(() =>
    Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => (rand() * 2 - 1) * 1.6)),
  );
})();

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≳ 630 stays clear)
// ---------------------------------------------------------------------------
export const CELL = 26;
export const GAP = 3;
export const PITCH = CELL + GAP;
export const IMG = { x: 92, y: 160 } as const; // 12·29−3 = 345 px square
export const KCELL = 30;
export const KPITCH = KCELL + GAP;
export const KER_X = 560;
export const MCELL = 16;
export const MGAP = 2;
export const MPITCH = MCELL + MGAP;
export const MAP_X = 964; // 10·18−2 = 178 px square
export const ROW_Y = [72, 258, 444] as const; // kernel+map rows (vert/horz/tex)
export const KER_Y = ROW_Y.map((y) => y + 40);

export const CAM_IMG: CameraState = { x: 380, y: 340, k: 1.25 };
export const CAM_BANK: CameraState = { x: 810, y: 330, k: 1.12 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imgU: ChannelRef<number>;
  kU: ChannelRef<number>[];
  sweepP: ChannelRef<number>;
  mapP: ChannelRef<number>[];
  glow: ChannelRef<number>[];
  kRand: ChannelRef<number>;
  noteU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const imgU = tl.channel('imgU', 0);
  const kU = [0, 1, 2].map((i) => tl.channel(`k${i}U`, 0));
  const sweepP = tl.channel('sweepP', 0);
  const mapP = [0, 1, 2].map((i) => tl.channel(`map${i}P`, 0));
  const glow = [0, 1, 2].map((i) => tl.channel(`glow${i}`, 0));
  const kRand = tl.channel('kRand', 0);
  const noteU = tl.channel('noteU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the grid of numbers —————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'To a computer, a picture is a grid of numbers. Nothing in this grid says edge, or texture, or shape.',
  });
  tl.tween(imgU, 1, { at: 0.5, dur: 2.6, ease: ease.draw });
  tl.tween(cam, CAM_IMG, { at: 1.0, dur: 2.2, ease: ease.move });

  tl.caption({
    at: 7.1,
    dur: 4.8,
    text: 'So computer vision starts with a smaller question: what tiny patterns is this grid made of?',
  });
  tl.hold(11.9, 0.5);

  // — Beat 2 · the first kernel + the sweep ————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 6.4,
    text: 'A kernel is a three by three patch of weights. This one detects vertical edges: negative on the left, positive on the right.',
    tex: 'K_{\\text{vert}}',
  });
  tl.tween(cam, CAM_BANK, { at: 12.6, dur: 1.6, ease: ease.move });
  tl.tween(kU[0], 1, { at: 13.0, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 19.2,
    dur: 6.6,
    text: 'Slide it across the image, multiply and add at every stop, and it draws a map: bright wherever the picture changes from dark to light sideways.',
  });
  tl.tween(cam, CAM_WIDE, { at: 19.4, dur: 1.4, ease: ease.move });
  tl.tween(sweepP, 1, { at: 19.8, dur: 6.6, ease: ease.linear });
  tl.tween(mapP[0], 1, { at: 19.8, dur: 6.6, ease: ease.linear });

  tl.caption({
    at: 26.6,
    dur: 6.2,
    text: 'Look where it fires: the left and right walls of the square. The flat interior stays dark — there is nothing vertical there to see.',
  });
  tl.tween(glow[0], 1, { at: 27.0, dur: 0.8, ease: ease.enter });
  tl.tween(glow[0], 0, { at: 32.0, dur: 0.8, ease: ease.move });

  // — Beat 3 · the rest of the bank ————————————————————————————————————
  tl.caption({
    at: 33.2,
    dur: 5.6,
    text: 'A different kernel asks a different question. This one fires on horizontal edges — the top and bottom walls light up instead.',
    tex: 'K_{\\text{horz}}',
  });
  tl.tween(kU[1], 1, { at: 33.4, dur: 0.7, ease: ease.enter });
  tl.tween(mapP[1], 1, { at: 34.0, dur: 3.2, ease: ease.linear });
  tl.tween(glow[1], 1, { at: 36.4, dur: 0.7, ease: ease.enter });
  tl.tween(glow[1], 0, { at: 38.4, dur: 0.7, ease: ease.move });

  tl.caption({
    at: 39.2,
    dur: 6.0,
    text: 'And this one fires on fine checkered texture. The smooth square barely registers, while the patch in the corner blazes.',
    tex: 'K_{\\text{tex}}',
  });
  tl.tween(kU[2], 1, { at: 39.4, dur: 0.7, ease: ease.enter });
  tl.tween(mapP[2], 1, { at: 40.0, dur: 3.2, ease: ease.linear });
  tl.tween(glow[2], 1, { at: 42.6, dur: 0.7, ease: ease.enter });
  tl.tween(glow[2], 0, { at: 44.6, dur: 0.7, ease: ease.move });

  // — Beat 4 · the texture hides from the edge detectors ————————————————
  tl.caption({
    at: 45.6,
    dur: 6.6,
    text: 'Notice the quiet trick: the checkerboard is completely invisible to both edge detectors — its alternation cancels their weights exactly.',
  });
  tl.tween(glow[0], 0.7, { at: 46.0, dur: 0.8, ease: ease.enter });
  tl.tween(glow[1], 0.7, { at: 46.0, dur: 0.8, ease: ease.enter });
  tl.tween(noteU, 1, { at: 47.2, dur: 0.8, ease: ease.enter });
  tl.tween(glow[0], 0, { at: 51.2, dur: 0.8, ease: ease.move });
  tl.tween(glow[1], 0, { at: 51.2, dur: 0.8, ease: ease.move });
  tl.tween(noteU, 0, { at: 51.6, dur: 0.8, ease: ease.move });

  // — Beat 5 · nobody designs these weights ————————————————————————————
  tl.caption({
    at: 52.8,
    dur: 6.4,
    text: 'And here is the part that matters: nobody designs these weights. They start as random noise, and training nudges them until detectors emerge.',
  });
  tl.tween(kRand, 1, { at: 53.2, dur: 1.0, ease: ease.move });
  tl.tween(kRand, 0, { at: 55.6, dur: 2.6, ease: ease.move });

  // — Beat 6 · the payoff ————————————————————————————————————————————————
  tl.caption({
    at: 59.8,
    dur: 6.2,
    text: 'One convolution layer is exactly this: a bank of learned detectors, each drawing its own map of where its pattern lives in the image.',
  });
  tl.caption({
    at: 66.4,
    dur: 6.2,
    text: 'The pixels stay put. What flows upward to the next layer is these maps — and reading maps instead of pixels is where vision begins.',
  });
  tl.tween(closeU, 1, { at: 66.8, dur: 1.0, ease: ease.enter });
  tl.hold(72.6, 1.2);

  return { tl, cam, imgU, kU, sweepP, mapP, glow, kRand, noteU, closeU };
}
