import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Vision Patches — the image becomes a sentence.
 *
 * A real 12×12 image is cut into nine 4×4 patches. Each patch is flattened,
 * mean-centered and unit-normalized, and a real scaled-dot-product softmax
 * over those vectors gives the 9×9 attention matrix on screen. Computed
 * facts the narration quotes: the two checker corners give each other 0.47
 * of their attention (patches 0 and 8, maximally far apart); the two
 * vertical-edge patches (2 and 4) pair up the same way; the four blank
 * patches spread attention almost evenly at 0.11 each.
 */

export const IMG_N = 12;
export const NP = 9; // 3×3 patches of 4×4

export const IMAGE: number[][] = (() => {
  const g: number[][] = Array.from({ length: IMG_N }, () => new Array(IMG_N).fill(0.04));
  // vertical-edge patches: patch 4 (center) and patch 2 (top-right)
  for (let i = 4; i <= 7; i++) {
    for (let j = 4; j <= 5; j++) g[i][j] = 1;
    for (let j = 6; j <= 7; j++) g[i][j] = 0.2;
  }
  for (let i = 0; i <= 3; i++) {
    for (let j = 8; j <= 9; j++) g[i][j] = 1;
    for (let j = 10; j <= 11; j++) g[i][j] = 0.2;
  }
  // twin checker corners: patches 0 and 8
  for (const o of [0, 8])
    for (let i = o; i <= o + 3; i++)
      for (let j = o; j <= o + 3; j++) g[i][j] = (i + j) % 2 === 0 ? 0.95 : 0.08;
  return g;
})();

/** patch k (row-major 3×3) as its 4×4 pixel block */
export const PATCH: number[][][] = Array.from({ length: NP }, (_, k) => {
  const r = Math.floor(k / 3);
  const c = k % 3;
  return Array.from({ length: 4 }, (_, u) =>
    Array.from({ length: 4 }, (_, v) => IMAGE[4 * r + u][4 * c + v]),
  );
});

/** mean-centered, unit-normalized patch feature vectors */
const FEAT: number[][] = PATCH.map((p) => {
  const v = p.flat();
  const m = v.reduce((a, b) => a + b) / v.length;
  const cvec = v.map((x) => x - m);
  const n = Math.hypot(...cvec);
  return n < 1e-6 ? cvec.map(() => 0) : cvec.map((x) => x / n);
});

export const TAU = 4;
/** the real 9×9 attention matrix: softmax over scaled feature dot products */
export const ATTN: number[][] = FEAT.map((u) => {
  const sc = FEAT.map((w) => TAU * u.reduce((a, x, i) => a + x * w[i], 0));
  const mx = Math.max(...sc);
  const e = sc.map((x) => Math.exp(x - mx));
  const Z = e.reduce((a, b) => a + b);
  return e.map((x) => x / Z);
});

// computed anchors for the narration (see the header comment)
export const TWIN_ATTN: number = ATTN[0][8]; // ≈ 0.47
export const BLANK_ATTN: number = ATTN[1][1]; // ≈ 0.11

// ---------------------------------------------------------------------------
// Layout — image assembles top-center, patches fly to a token strip,
// attention matrix bottom-left with arcs above the strip
// ---------------------------------------------------------------------------
export const PCELL = 20;
export const PGAP = 2;
export const PP = PCELL + PGAP;
export const PATCH_W = 4 * PP - PGAP; // 86
export const IMG0 = { x: 508, y: 130 } as const; // 3 patches wide ≈ 264
export const CUT_SPREAD = 14; // extra gap when the image is "cut"
export const SCELL = 13;
export const SGAP = 1.5;
export const SPP = SCELL + SGAP;
export const STRIP_W = 4 * SPP - SGAP; // 56.5
export const STRIP_Y = 96;
export const STRIP_X0 = 150;
export const STRIP_DX = 116;
export const MAT = { x: 170, y: 250 } as const;
export const MCELL = 30;
export const MGAP = 3;
export const MP = MCELL + MGAP;

export const CAM_IMG: CameraState = { x: 640, y: 300, k: 1.2 };
export const CAM_MAT: CameraState = { x: 480, y: 380, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imgU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  stripP: ChannelRef<number>;
  posU: ChannelRef<number>;
  matU: ChannelRef<number>;
  rowTwinU: ChannelRef<number>;
  rowEdgeU: ChannelRef<number>;
  rowBlankU: ChannelRef<number>;
  arcTwinU: ChannelRef<number>;
  arcEdgeU: ChannelRef<number>;
  noteU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const imgU = tl.channel('imgU', 0);
  const cutU = tl.channel('cutU', 0);
  const stripP = tl.channel('stripP', 0);
  const posU = tl.channel('posU', 0);
  const matU = tl.channel('matU', 0);
  const rowTwinU = tl.channel('rowTwinU', 0);
  const rowEdgeU = tl.channel('rowEdgeU', 0);
  const rowBlankU = tl.channel('rowBlankU', 0);
  const arcTwinU = tl.channel('arcTwinU', 0);
  const arcEdgeU = tl.channel('arcEdgeU', 0);
  const noteU = tl.channel('noteU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the keyhole problem —————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'A convolution looks at the world through a keyhole — three pixels wide. Relating two far corners of an image takes it many patient layers.',
  });
  tl.tween(imgU, 1, { at: 0.5, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_IMG, { at: 0.8, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 7.0,
    dur: 5.0,
    text: 'Vision transformers make a stranger bet: treat the image as a sentence, and let every part talk to every other part at once.',
  });
  tl.hold(12.0, 0.5);

  // — Beat 2 · cut into patches, line them up ——————————————————————————
  tl.caption({
    at: 12.5,
    dur: 5.6,
    text: 'Cut the picture into nine patches. Each patch is flattened into a plain vector of its sixteen pixel values — a word made of numbers.',
  });
  tl.tween(cutU, 1, { at: 12.7, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 14.2, dur: 1.6, ease: ease.move });
  tl.tween(stripP, 1, { at: 15.0, dur: 2.8, ease: ease.move });

  tl.caption({
    at: 18.7,
    dur: 5.4,
    text: 'A position tag rides along with each patch, because once they are tokens in a row, nothing else remembers where they came from.',
  });
  tl.tween(posU, 1, { at: 19.1, dur: 1.0, ease: ease.enter });
  tl.hold(24.1, 0.5);

  // — Beat 3 · attention among patches —————————————————————————————————
  tl.caption({
    at: 24.6,
    dur: 5.8,
    text: 'Now attention — the same machinery language models use. Every patch scores its similarity to every other patch, and the scores become weights.',
    tex: 'A = \\mathrm{softmax}(\\tau\\, u_i \\cdot u_j)',
  });
  tl.tween(cam, CAM_MAT, { at: 25.0, dur: 1.6, ease: ease.move });
  tl.tween(matU, 1, { at: 25.6, dur: 3.2, ease: ease.linear });

  tl.caption({
    at: 30.8,
    dur: 6.4,
    text: 'Watch the two checkered corners. They sit as far apart as the image allows, yet each gives nearly half its attention to its twin — in a single hop.',
  });
  tl.tween(rowTwinU, 1, { at: 31.2, dur: 0.8, ease: ease.enter });
  tl.tween(arcTwinU, 1, { at: 32.0, dur: 1.2, ease: ease.draw });

  tl.caption({
    at: 37.6,
    dur: 5.6,
    text: 'The two vertical edge patches find each other the same way. Content decides who talks to whom; distance costs nothing.',
  });
  tl.tween(rowTwinU, 0, { at: 37.8, dur: 0.7, ease: ease.move });
  tl.tween(arcTwinU, 0.25, { at: 37.8, dur: 0.7, ease: ease.move });
  tl.tween(rowEdgeU, 1, { at: 38.0, dur: 0.8, ease: ease.enter });
  tl.tween(arcEdgeU, 1, { at: 38.6, dur: 1.2, ease: ease.draw });

  tl.caption({
    at: 43.6,
    dur: 5.4,
    text: 'And the blank sky patches? Nothing distinguishes them, so they spread their attention almost evenly across the board.',
  });
  tl.tween(rowEdgeU, 0, { at: 43.8, dur: 0.7, ease: ease.move });
  tl.tween(arcEdgeU, 0, { at: 43.8, dur: 0.7, ease: ease.move });
  tl.tween(arcTwinU, 0, { at: 43.8, dur: 0.7, ease: ease.move });
  tl.tween(rowBlankU, 1, { at: 44.0, dur: 0.8, ease: ease.enter });

  // — Beat 4 · the honest trade ————————————————————————————————————————
  tl.caption({
    at: 49.4,
    dur: 6.2,
    text: 'Here is the honest trade. A convolution is born knowing that nearby pixels matter. A transformer has to learn that from scratch — which costs data.',
  });
  tl.tween(rowBlankU, 0, { at: 49.6, dur: 0.7, ease: ease.move });
  tl.tween(noteU, 1, { at: 50.4, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 56.0,
    dur: 5.8,
    text: 'Feed it enough images, though, and it learns locality and then outgrows it — attending across the whole frame whenever the content asks for it.',
  });

  tl.caption({
    at: 62.2,
    dur: 5.6,
    text: 'Patches to tokens, tokens to attention: the picture became a sentence, and one hop replaced a tower of keyholes.',
  });
  tl.tween(noteU, 0, { at: 62.2, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.8, dur: 0.9, ease: ease.enter });
  tl.hold(67.8, 1.2);

  return {
    tl,
    cam,
    imgU,
    cutU,
    stripP,
    posU,
    matU,
    rowTwinU,
    rowEdgeU,
    rowBlankU,
    arcTwinU,
    arcEdgeU,
    noteU,
    closeU,
  };
}
