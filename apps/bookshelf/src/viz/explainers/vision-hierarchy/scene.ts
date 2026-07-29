import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Vision Hierarchy — edges become corners become shapes.
 *
 * A real 3-layer stack computed at module scope on a 14×14 hollow square:
 *   layer 1: Sobel vertical + horizontal → two 12×12 edge maps
 *   layer 2: a conjunction unit over both maps (strongest vertical × strongest
 *            horizontal in each 3×3 window) + a threshold nonlinearity
 *            → a 10×10 corner map with exactly four confident peaks
 *   layer 3: a four-corners-in-a-square template over the corner map
 *            → a 3×3 shape map whose center cell wins outright
 * Every grid shown is one of these computed arrays.
 */

export const IMG_N = 14;
export const EDGE_N = 12;
export const COR_N = 10;
export const SHAPE_N = 3;

export const IMAGE: number[][] = (() => {
  const g: number[][] = Array.from({ length: IMG_N }, () => new Array(IMG_N).fill(0.04));
  for (let k = 3; k <= 10; k++) {
    g[3][k] = 1;
    g[10][k] = 1;
    g[k][3] = 1;
    g[k][10] = 1;
  }
  return g;
})();

const GX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];
const GY = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

function conv(im: number[][], K: number[][], O: number): number[][] {
  const raw: number[][] = [];
  let mx = 1e-9;
  for (let i = 0; i < O; i++) {
    const r: number[] = [];
    for (let j = 0; j < O; j++) {
      let a = 0;
      for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) a += im[i + u][j + v] * K[u][v];
      a = Math.abs(a);
      r.push(a);
      mx = Math.max(mx, a);
    }
    raw.push(r);
  }
  return raw.map((r) => r.map((v) => v / mx));
}

export const MAP_VX: number[][] = conv(IMAGE, GX, EDGE_N);
export const MAP_VY: number[][] = conv(IMAGE, GY, EDGE_N);

/** layer 2, pre-threshold: conjunction of the two edge maps in a 3×3 window */
export const CORNER_RAW: number[][] = (() => {
  const out: number[][] = [];
  let mx = 1e-9;
  for (let i = 0; i < COR_N; i++) {
    const r: number[] = [];
    for (let j = 0; j < COR_N; j++) {
      let mgx = 0;
      let mgy = 0;
      for (let u = 0; u < 3; u++)
        for (let v = 0; v < 3; v++) {
          mgx = Math.max(mgx, MAP_VX[i + u][j + v]);
          mgy = Math.max(mgy, MAP_VY[i + u][j + v]);
        }
      const c = mgx * mgy;
      r.push(c);
      mx = Math.max(mx, c);
    }
    out.push(r);
  }
  return out.map((r) => r.map((v) => v / mx));
})();

/** layer 2, post-threshold (the ReLU beat): keep only confident corners */
export const THRESH = 0.6;
export const CORNER: number[][] = CORNER_RAW.map((r) =>
  r.map((v) => Math.max(0, v - THRESH) / (1 - THRESH)),
);
/** number of nonzero cells after the threshold — the four corner clusters */
export const CORNER_PEAKS: number = CORNER.flat().filter((v) => v > 1e-9).length;

/** layer 3: four corners in a square arrangement (offsets 0 and 7) */
export const SHAPE: number[][] = (() => {
  const out: number[][] = [];
  for (let i = 0; i < SHAPE_N; i++) {
    const r: number[] = [];
    for (let j = 0; j < SHAPE_N; j++)
      r.push((CORNER[i][j] + CORNER[i][j + 7] + CORNER[i + 7][j] + CORNER[i + 7][j + 7]) / 4);
    out.push(r);
  }
  return out;
})();
export const SHAPE_BEST: number = Math.max(...SHAPE.flat());
export const SHAPE_SECOND: number = Math.max(...SHAPE.flat().filter((v) => v < SHAPE_BEST));

// ---------------------------------------------------------------------------
// Layout — a left-to-right pipeline
// ---------------------------------------------------------------------------
export const IC = 18;
export const IG = 2;
export const IP = IC + IG;
export const IMG_XY = { x: 46, y: 180 } as const; // 14·20−2 = 278
export const EC = 11;
export const EG = 1;
export const EP = EC + EG;
export const VX_XY = { x: 392, y: 168 } as const; // 12·12−1 = 143
export const VY_XY = { x: 392, y: 348 } as const;
export const CC = 20;
export const CG = 2;
export const CP = CC + CG;
export const COR_XY = { x: 618, y: 210 } as const; // 10·22−2 = 218
export const SC = 52;
export const SG = 4;
export const SP = SC + SG;
export const SHAPE_XY = { x: 928, y: 238 } as const; // 3·56−4 = 164

export const CAM_IMG: CameraState = { x: 320, y: 340, k: 1.3 };
export const CAM_EDGE: CameraState = { x: 450, y: 330, k: 1.35 };
export const CAM_COR: CameraState = { x: 700, y: 330, k: 1.3 };
export const CAM_SHAPE: CameraState = { x: 950, y: 330, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imgU: ChannelRef<number>;
  vxU: ChannelRef<number>;
  vyU: ChannelRef<number>;
  corU: ChannelRef<number>;
  reluU: ChannelRef<number>;
  winU: ChannelRef<number>;
  shapeU: ChannelRef<number>;
  ladderU: ChannelRef<number>;
  dimU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const imgU = tl.channel('imgU', 0);
  const vxU = tl.channel('vxU', 0);
  const vyU = tl.channel('vyU', 0);
  const corU = tl.channel('corU', 0);
  const reluU = tl.channel('reluU', 0); // 0 = raw conjunction, 1 = thresholded
  const winU = tl.channel('winU', 0); // conjunction window demo
  const shapeU = tl.channel('shapeU', 0);
  const ladderU = tl.channel('ladderU', 0);
  const dimU = tl.channel('dimU', 0);

  // — Beat 1 · the alphabet ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Edges are a humble alphabet. Yet stack a few layers of detectors, and a network starts spelling shapes with them.',
  });
  tl.tween(imgU, 1, { at: 0.5, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_IMG, { at: 0.8, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.5,
    dur: 4.6,
    text: 'Here is the raw material: a hollow square, drawn in pixels that mean nothing by themselves.',
  });
  tl.hold(11.1, 0.5);

  // — Beat 2 · layer one ————————————————————————————————————————————————
  tl.caption({
    at: 11.6,
    dur: 6.2,
    text: 'Layer one runs two edge detectors over the pixels. The vertical map catches the sides; the horizontal map catches the top and bottom.',
  });
  tl.tween(cam, CAM_EDGE, { at: 11.8, dur: 1.6, ease: ease.move });
  tl.tween(vxU, 1, { at: 12.2, dur: 2.4, ease: ease.linear });
  tl.tween(vyU, 1, { at: 14.2, dur: 2.4, ease: ease.linear });
  tl.hold(17.8, 0.6);

  // — Beat 3 · layer two reads maps, not pixels ————————————————————————
  tl.caption({
    at: 18.4,
    dur: 6.4,
    text: 'Layer two never touches a pixel. It reads both edge maps at once, and fires only where a vertical and a horizontal edge share the same small window.',
  });
  tl.tween(cam, CAM_COR, { at: 18.8, dur: 1.6, ease: ease.move });
  tl.tween(winU, 1, { at: 19.4, dur: 0.8, ease: ease.enter });
  tl.tween(corU, 1, { at: 20.2, dur: 3.4, ease: ease.linear });
  tl.tween(winU, 0, { at: 23.8, dur: 0.7, ease: ease.move });

  tl.caption({
    at: 25.2,
    dur: 5.4,
    text: 'The raw response is smeared — near misses everywhere. A threshold cleans it up: keep only the confident hits.',
    tex: '\\max(0,\\; c - 0.6)',
  });
  tl.tween(reluU, 1, { at: 27.4, dur: 1.6, ease: ease.move });

  tl.caption({
    at: 31.0,
    dur: 5.8,
    text: 'Four clean clusters survive — the four corners. Nobody programmed a corner detector; it fell out of two edge maps and a threshold.',
  });
  tl.hold(36.8, 0.6);

  // — Beat 4 · layer three ——————————————————————————————————————————————
  tl.caption({
    at: 37.4,
    dur: 6.2,
    text: 'Layer three asks a bigger question of the corner map: are there four corners arranged like a square? One template, four taps.',
  });
  tl.tween(cam, CAM_SHAPE, { at: 37.8, dur: 1.6, ease: ease.move });
  tl.tween(shapeU, 1, { at: 38.6, dur: 2.6, ease: ease.linear });

  tl.caption({
    at: 43.8,
    dur: 5.6,
    text: 'The center cell blazes and everything around it stays dim. Three layers up from raw pixels, square has become a single number.',
  });
  tl.hold(49.4, 0.6);

  // — Beat 5 · the ladder, wide ————————————————————————————————————————
  tl.caption({
    at: 50.0,
    dur: 6.0,
    text: 'Pull back and read the whole ladder: pixels, then edges, then corners, then a shape. Each layer sees a wider window and a more abstract world.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.2, dur: 1.8, ease: ease.move });
  tl.tween(ladderU, 1, { at: 51.4, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 56.4,
    dur: 6.2,
    text: 'A trained network climbs the same ladder with richer rungs: textures become eyes, eyes become faces. The mechanism is exactly what you just watched.',
  });
  tl.tween(dimU, 1, { at: 61.4, dur: 1.0, ease: ease.move });
  tl.caption({
    at: 63.0,
    dur: 5.0,
    text: 'That is a feature hierarchy: composition, not magic — detectors reading the maps of other detectors.',
  });
  tl.hold(68.0, 1.2);

  return { tl, cam, imgU, vxU, vyU, corU, reluU, winU, shapeU, ladderU, dimU };
}
