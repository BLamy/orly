import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Vision Pooling — keep what fires, forget exactly where.
 *
 * A real 12×12 image (a bright vertical bar) is convolved with a Sobel
 * vertical-edge kernel → a real 10×10 feature map → really max-pooled 2×2
 * into a 5×5 map. Then the bar is shifted one pixel right and everything is
 * recomputed. The changed-cell counts the narration quotes (CHANGED_MAP,
 * CHANGED_POOL) are computed here at module scope, not asserted.
 */

export const IMG_N = 12;
export const OUT_N = 10;
export const POOL_N = 5;

function makeImage(shift: number): number[][] {
  const g: number[][] = Array.from({ length: IMG_N }, () => new Array(IMG_N).fill(0.04));
  for (let i = 2; i <= 9; i++) for (let j = 1 + shift; j <= 2 + shift; j++) g[i][j] = 1.0;
  return g;
}
export const IMAGE_A: number[][] = makeImage(0);
export const IMAGE_B: number[][] = makeImage(1); // one pixel right

const K_VERT = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

function convolveAbs(img: number[][]): number[][] {
  const raw: number[][] = [];
  let max = 1e-9;
  for (let i = 0; i < OUT_N; i++) {
    const row: number[] = [];
    for (let j = 0; j < OUT_N; j++) {
      let acc = 0;
      for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) acc += img[i + u][j + v] * K_VERT[u][v];
      const a = Math.abs(acc);
      row.push(a);
      if (a > max) max = a;
    }
    raw.push(row);
  }
  return raw.map((r) => r.map((v) => v / max));
}

function maxPool(map: number[][]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < POOL_N; i++) {
    const row: number[] = [];
    for (let j = 0; j < POOL_N; j++)
      row.push(Math.max(map[2 * i][2 * j], map[2 * i][2 * j + 1], map[2 * i + 1][2 * j], map[2 * i + 1][2 * j + 1]));
    out.push(row);
  }
  return out;
}

export const MAP_A: number[][] = convolveAbs(IMAGE_A);
export const MAP_B: number[][] = convolveAbs(IMAGE_B);
export const POOL_A: number[][] = maxPool(MAP_A);
export const POOL_B: number[][] = maxPool(MAP_B);

const countChanged = (A: number[][], B: number[][]) => {
  let n = 0;
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A[i].length; j++) if (Math.abs(A[i][j] - B[i][j]) > 1e-9) n++;
  return n;
};
/** How many cells change when the bar moves one pixel. */
export const CHANGED_MAP: number = countChanged(MAP_A, MAP_B); // computed: 10 of 100
export const CHANGED_POOL: number = countChanged(POOL_A, POOL_B); // computed: 0 of 25

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export const ICELL = 22;
export const IGAP = 2;
export const IPITCH = ICELL + IGAP;
export const IMG = { x: 64, y: 190 } as const; // 12·24−2 = 286
export const MAPL = { x: 452, y: 214 } as const; // 10·24−2 = 238
export const PCELL = 44;
export const PGAP = 4;
export const PPITCH = PCELL + PGAP;
export const POOL = { x: 828, y: 214 } as const; // 5·48−4 = 236

export const CAM_MAP: CameraState = { x: 560, y: 330, k: 1.18 };
export const CAM_POOL: CameraState = { x: 830, y: 330, k: 1.22 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imgU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  poolP: ChannelRef<number>;
  shiftU: ChannelRef<number>;
  diffU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  fieldU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const imgU = tl.channel('imgU', 0);
  const mapU = tl.channel('mapU', 0);
  const poolP = tl.channel('poolP', 0);
  const shiftU = tl.channel('shiftU', 0);
  const diffU = tl.channel('diffU', 0);
  const panelU = tl.channel('panelU', 0);
  const fieldU = tl.channel('fieldU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the brittleness problem —————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'An edge detector fires at exact positions. But a cat shifted one pixel to the right is still the same cat.',
  });
  tl.tween(imgU, 1, { at: 0.5, dur: 2.0, ease: ease.draw });
  tl.tween(mapU, 1, { at: 2.2, dur: 2.2, ease: ease.draw });

  tl.caption({
    at: 6.9,
    dur: 5.2,
    text: 'If every downstream layer memorizes exact coordinates, the whole network becomes brittle. Vision needs a way to care less about position.',
  });
  tl.hold(12.1, 0.5);

  // — Beat 2 · max pooling ———————————————————————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 6.0,
    text: 'Max pooling is the blunt, effective answer. Slide a two by two window over the map, and keep only the loudest value in each window.',
    tex: 'y = \\max(x_1, x_2, x_3, x_4)',
  });
  tl.tween(cam, CAM_MAP, { at: 12.8, dur: 1.6, ease: ease.move });
  tl.tween(poolP, 1, { at: 13.6, dur: 7.4, ease: ease.linear });

  tl.caption({
    at: 19.2,
    dur: 5.6,
    text: 'The map shrinks from ten by ten to five by five. Three quarters of the numbers are gone, but the strongest evidence survives.',
  });
  tl.tween(cam, CAM_POOL, { at: 20.2, dur: 1.6, ease: ease.move });
  tl.hold(24.8, 0.6);

  // — Beat 3 · the one-pixel nudge ——————————————————————————————————————
  tl.caption({
    at: 25.4,
    dur: 5.6,
    text: 'Now the experiment. Nudge the bright bar one pixel to the right, and recompute everything downstream of it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 25.6, dur: 1.6, ease: ease.move });
  tl.tween(shiftU, 1, { at: 27.6, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 31.4,
    dur: 6.2,
    text: 'The feature map takes the hit: ten of its one hundred cells change value as the bright columns jump one step sideways.',
  });
  tl.tween(diffU, 1, { at: 31.8, dur: 0.9, ease: ease.enter });
  tl.tween(panelU, 1, { at: 33.0, dur: 0.8, ease: ease.enter });

  tl.caption({
    at: 38.0,
    dur: 6.2,
    text: 'And the pooled map? Not a single one of its twenty five cells changed. The shift stayed inside the pooling windows, so the maxima never moved.',
  });
  tl.tween(cam, CAM_POOL, { at: 38.4, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 44.6,
    dur: 5.4,
    text: 'That is translation invariance, bought one small step at a time. Each pooling stage forgives a little more misplacement.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.0, dur: 1.6, ease: ease.move });

  // — Beat 4 · the growing window / the price —————————————————————————
  tl.caption({
    at: 50.4,
    dur: 6.0,
    text: 'Stack convolution and pooling a few times, and one cell deep in the network summarizes a wide patch of the original image.',
  });
  tl.tween(diffU, 0, { at: 50.4, dur: 0.8, ease: ease.move });
  tl.tween(panelU, 0, { at: 50.4, dur: 0.8, ease: ease.move });
  tl.tween(fieldU, 1, { at: 51.2, dur: 1.6, ease: ease.draw });

  tl.caption({
    at: 56.8,
    dur: 5.8,
    text: 'The price is honest and deliberate: exact position is thrown away. Pooling keeps what fired, and forgets exactly where.',
  });
  tl.tween(fieldU, 0, { at: 61.4, dur: 0.9, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 63.0,
    dur: 5.6,
    text: 'Detect everywhere, then pool: that pairing is why a network trained on centered cats still recognizes one sitting in the corner.',
  });
  tl.hold(68.6, 1.2);

  return { tl, cam, imgU, mapU, poolP, shiftU, diffU, panelU, fieldU, closeU };
}
