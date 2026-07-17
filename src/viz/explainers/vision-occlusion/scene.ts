import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Vision Occlusion — where does the network look?
 *
 * The square-detector stack from the feature-hierarchy chapter (Sobel pair →
 * conjunction + threshold → four-corner template, with normalizers frozen
 * from the clean image) is really re-run 36 times, once per position of a
 * 4×4 gray occluder sliding at stride 2. The 6×6 drop map on screen is
 * (base − occluded) / base, computed here. Facts the narration quotes:
 * the clean score is 1.00; covering ANY piece of the outline costs exactly
 * 0.25 (one corner detector goes silent); the interior costs 0.00; and no
 * single occluder ever drops the verdict below 0.75.
 */

export const IMG_N = 14;
export const EDGE_N = 12;
export const COR_N = 10;
export const OCC_N = 6; // occluder top-left at (2i, 2j), i,j ∈ 0..5

export function baseImage(): number[][] {
  const g: number[][] = Array.from({ length: IMG_N }, () => new Array(IMG_N).fill(0.04));
  for (let k = 3; k <= 10; k++) {
    g[3][k] = 1;
    g[10][k] = 1;
    g[k][3] = 1;
    g[k][10] = 1;
  }
  return g;
}
export const IMAGE: number[][] = baseImage();

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

function convRaw(im: number[][], K: number[][], O: number): number[][] {
  const raw: number[][] = [];
  for (let i = 0; i < O; i++) {
    const r: number[] = [];
    for (let j = 0; j < O; j++) {
      let a = 0;
      for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) a += im[i + u][j + v] * K[u][v];
      r.push(Math.abs(a));
    }
    raw.push(r);
  }
  return raw;
}

// normalizers frozen from the clean image — the network's weights don't
// change during the experiment, only its input does
const M_VX = Math.max(...convRaw(IMAGE, GX, EDGE_N).flat());
const M_VY = Math.max(...convRaw(IMAGE, GY, EDGE_N).flat());

function cornerRaw(im: number[][]): number[][] {
  const vx = convRaw(im, GX, EDGE_N).map((r) => r.map((v) => v / M_VX));
  const vy = convRaw(im, GY, EDGE_N).map((r) => r.map((v) => v / M_VY));
  const out: number[][] = [];
  for (let i = 0; i < COR_N; i++) {
    const r: number[] = [];
    for (let j = 0; j < COR_N; j++) {
      let a = 0;
      let c = 0;
      for (let u = 0; u < 3; u++)
        for (let v = 0; v < 3; v++) {
          a = Math.max(a, vx[i + u][j + v]);
          c = Math.max(c, vy[i + u][j + v]);
        }
      r.push(a * c);
    }
    out.push(r);
  }
  return out;
}
const M_COR = Math.max(...cornerRaw(IMAGE).flat());

/** the frozen classifier: max square-template response over the shape map */
export function score(im: number[][]): number {
  const cor = cornerRaw(im).map((r) => r.map((v) => Math.max(0, v / M_COR - 0.6) / 0.4));
  let best = 0;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      best = Math.max(best, (cor[i][j] + cor[i][j + 7] + cor[i + 7][j] + cor[i + 7][j + 7]) / 4);
  return best;
}

export const BASE_SCORE: number = score(IMAGE); // = 1.000

export function occludedImage(i: number, j: number): number[][] {
  const im = baseImage();
  for (let u = 0; u < 4; u++) for (let v = 0; v < 4; v++) im[2 * i + u][2 * j + v] = 0.04;
  return im;
}

/** the real 36-run experiment: score drop per occluder position */
export const DROPS: number[][] = (() => {
  const out: number[][] = [];
  for (let i = 0; i < OCC_N; i++) {
    const r: number[] = [];
    for (let j = 0; j < OCC_N; j++)
      r.push(Math.max(0, (BASE_SCORE - score(occludedImage(i, j))) / BASE_SCORE));
    out.push(r);
  }
  return out;
})();
export const MAX_DROP: number = Math.max(...DROPS.flat()); // 0.25
export const MIN_SCORE: number = 1 - MAX_DROP; // 0.75

/** per-position occluded scores, row-major, for the sweeping meter */
export const OCC_SCORES: number[] = DROPS.flat().map((d) => BASE_SCORE * (1 - d));

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export const IC = 24;
export const IG = 2;
export const IP = IC + IG;
export const IMG_XY = { x: 96, y: 150 } as const; // 14·26−2 = 362
export const METER = { x: 560, y: 190, w: 46, h: 300 } as const;
export const DC = 44;
export const DG = 4;
export const DP = DC + DG;
export const DROP_XY = { x: 760, y: 190 } as const; // 6·48−4 = 284

export const CAM_IMG: CameraState = { x: 420, y: 330, k: 1.25 };
export const CAM_MAP: CameraState = { x: 830, y: 330, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imgU: ChannelRef<number>;
  meterU: ChannelRef<number>;
  demoU: ChannelRef<number>; // the single corner-occlusion demo
  sweepP: ChannelRef<number>; // the 36-position sweep
  ringU: ChannelRef<number>;
  holeU: ChannelRef<number>;
  floorU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const imgU = tl.channel('imgU', 0);
  const meterU = tl.channel('meterU', 0);
  const demoU = tl.channel('demoU', 0);
  const sweepP = tl.channel('sweepP', 0);
  const ringU = tl.channel('ringU', 0);
  const holeU = tl.channel('holeU', 0);
  const floorU = tl.channel('floorU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the confident verdict ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Our little network from the last chapter looks at this picture and says: square, full confidence. But which pixels earned that verdict?',
  });
  tl.tween(imgU, 1, { at: 0.5, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_IMG, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.tween(meterU, 1, { at: 2.8, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'You cannot trust the network to tell you — it has no words. But you can interrogate it the honest way: change the input, and watch the output.',
  });
  tl.hold(12.1, 0.5);

  // — Beat 2 · one intervention ————————————————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 6.0,
    text: 'Cover the top left corner with a gray patch and run the network again. The score falls from one point zero to zero point seven five.',
  });
  tl.tween(demoU, 1, { at: 13.4, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 19.0,
    dur: 5.6,
    text: 'Exactly one quarter of the verdict vanished — the corner detector under the patch went silent, and the other three kept voting.',
  });
  tl.hold(24.6, 0.6);

  // — Beat 3 · the sweep ————————————————————————————————————————————————
  tl.caption({
    at: 25.2,
    dur: 6.2,
    text: 'Now do it everywhere. Slide the patch across all thirty six positions, rerun the network each time, and record every drop as a map.',
  });
  tl.tween(demoU, 0, { at: 25.2, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 25.6, dur: 1.6, ease: ease.move });
  tl.tween(sweepP, 1, { at: 26.4, dur: 8.6, ease: ease.linear });

  tl.caption({
    at: 32.4,
    dur: 5.2,
    text: 'This map is called an occlusion saliency map: bright where hiding the input hurt, dark where the network never cared.',
  });

  // — Beat 4 · reading the map —————————————————————————————————————————
  tl.caption({
    at: 38.0,
    dur: 6.0,
    text: 'Read what it says. The whole outline matters — every cut along it silences one corner and costs the same quarter of the score.',
  });
  tl.tween(cam, CAM_MAP, { at: 38.4, dur: 1.6, ease: ease.move });
  tl.tween(ringU, 1, { at: 39.0, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 44.4,
    dur: 5.4,
    text: 'And the middle of the square is causally worthless: cover it and the score does not move at all. The network never looked there.',
  });
  tl.tween(ringU, 0, { at: 44.6, dur: 0.7, ease: ease.move });
  tl.tween(holeU, 1, { at: 44.8, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 50.2,
    dur: 5.8,
    text: 'One more fact hides in the map: no single patch ever drags the score below zero point seven five. The evidence is spread across four spots.',
  });
  tl.tween(holeU, 0, { at: 50.4, dur: 0.7, ease: ease.move });
  tl.tween(floorU, 1, { at: 50.8, dur: 0.9, ease: ease.enter });

  // — Beat 5 · the payoff ———————————————————————————————————————————————
  tl.caption({
    at: 56.4,
    dur: 6.0,
    text: 'This is proof by intervention — the same move interpretability researchers call ablation. Break a piece, watch the behavior, and the causes confess.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 56.8, dur: 1.6, ease: ease.move });
  tl.tween(floorU, 0, { at: 60.8, dur: 0.7, ease: ease.move });

  tl.caption({
    at: 62.8,
    dur: 6.0,
    text: 'Kernels found the edges, pooling forgave the shifts, layers built the shape, and now occlusion showed us the receipt. That is computer vision, end to end.',
  });
  tl.tween(closeU, 1, { at: 63.2, dur: 0.9, ease: ease.enter });
  tl.hold(68.8, 1.2);

  return { tl, cam, imgU, meterU, demoU, sweepP, ringU, holeU, floorU, closeU };
}
