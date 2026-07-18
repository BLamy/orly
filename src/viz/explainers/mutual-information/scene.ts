import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Mutual Information — what one thing tells you about another.
 *
 * All math at module scope and verified by running it. Joint distribution of
 * sky (rain/sun) and umbrella (yes/no): 0.24, 0.06 / 0.07, 0.63. Marginals
 * 0.30/0.70 and 0.31/0.69. Verified: H(sky) = 0.881 bits, H(umbrella) =
 * 0.893, H(joint) = 1.426, so I = 0.881 + 0.893 − 1.426 = 0.348 bits, and
 * H(sky | umbrella) = 1.426 − 0.893 = 0.533 = 0.881 − 0.348 exactly.
 * The independent joint with the same marginals has H = 1.774 and I = 0.000.
 */

export const J: number[][] = [
  [0.24, 0.06], // rain: umbrella yes / no
  [0.07, 0.63], // sun:  umbrella yes / no
];
export const PX: number[] = J.map((r) => r[0] + r[1]); // [0.30, 0.70]
export const PY: number[] = [J[0][0] + J[1][0], J[0][1] + J[1][1]]; // [0.31, 0.69]
export const JIND: number[][] = PX.map((a) => PY.map((b) => a * b));

const lg = Math.log2;
const Hof = (ps: number[]): number => -ps.reduce((s, p) => (p > 0 ? s + p * lg(p) : s), 0);
export const HX = Hof(PX); // 0.881
export const HY = Hof(PY); // 0.893
export const HXY = Hof(J.flat()); // 1.426
export const HXY_IND = Hof(JIND.flat()); // 1.774
export const MI = HX + HY - HXY; // 0.348
export const H_COND = HXY - HY; // 0.533

export const ROW_LABELS = ['rain', 'sun'];
export const COL_LABELS = ['umbrella', 'no umbrella'];

// layout: joint tiles left (area-true: cell side ∝ sqrt p), bars right
export const TILES = { x: 150, y: 130, size: 400 };
export const IND_TILES = { x: 640, y: 130, size: 400 };
export const BARS = { x: 180, y: 120, w: 900, rowH: 92, scale: 470 }; // px per bit

export const CAM_TILES: CameraState = { x: 420, y: 320, k: 1.22 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tilesU: ChannelRef<number>;
  margU: ChannelRef<number>;
  indU: ChannelRef<number>; // independent twin shown
  tableDim: ChannelRef<number>; // fade tables away for the bar act
  barsU: ChannelRef<number>;
  slideU: ChannelRef<number>; // bars slide together to overlap by I
  condU: ChannelRef<number>;
  texU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tilesU = tl.channel('tilesU', 0);
  const margU = tl.channel('margU', 0);
  const indU = tl.channel('indU', 0);
  const tableDim = tl.channel('tableDim', 1);
  const barsU = tl.channel('barsU', 0);
  const slideU = tl.channel('slideU', 0);
  const condU = tl.channel('condU', 0);
  const texU = tl.channel('texU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · two signals, one table ———————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Two things you can observe: whether it rains, and whether people carry umbrellas. Neither causes our question; we only ask how much knowing one tells you about the other.',
  });
  tl.tween(tilesU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_TILES, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.1,
    dur: 5.2,
    text: 'Everything we need is this joint table, with each square drawn at its true probability. Rain with umbrella, twenty four percent. Sun with no umbrella, sixty three. The awkward corners are small.',
  });
  tl.tween(margU, 1, { at: 8.4, dur: 1.0, ease: ease.move });
  tl.hold(11.5, 0.5);

  // — Beat 2 · the independent twin —————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 12.0, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 12.2,
    dur: 5.6,
    text: 'Here is the world where the two signals ignore each other: same rain rate, same umbrella rate, multiplied. Compare the corners. Reality piles probability on the diagonal; independence spreads it out.',
  });
  tl.tween(indU, 1, { at: 12.8, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 18.0,
    dur: 4.6,
    text: 'That visible difference between the real table and its independent twin is exactly what mutual information measures, in bits.',
  });
  tl.hold(22.8, 0.5);

  // — Beat 3 · the accounting ———————————————————————————————————————————————
  tl.tween(tableDim, 0.12, { at: 23.3, dur: 1.0, ease: ease.move });
  tl.tween(barsU, 1, { at: 24.3, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 24.5,
    dur: 5.8,
    text: 'Count the uncertainty in each signal alone: the sky costs point eight eight bits to describe, the umbrella point eight nine. Describe them separately and you pay one point seven seven.',
  });
  tl.caption({
    at: 30.5,
    dur: 5.6,
    text: 'But describing the pair together costs only one point four three bits, because the table is not independent. The books do not balance, and the shortfall has a name.',
    tex: 'I(X;Y) = H(X) + H(Y) - H(X,Y)',
  });
  tl.tween(texU, 1, { at: 31.3, dur: 0.7, ease: ease.enter });
  tl.tween(slideU, 1, { at: 33.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 36.3,
    dur: 5.0,
    text: 'Slide the two bars together until their total shrinks to the true joint cost, and the overlap is forced to be point three five bits. That overlap is the mutual information.',
  });
  tl.hold(41.5, 0.5);

  // — Beat 4 · what the overlap buys you ————————————————————————————————————
  tl.caption({
    at: 42.0,
    dur: 6.0,
    text: 'And it cashes out as prediction. Before you see any umbrellas, the sky costs point eight eight bits. After you see them, point five three. The discount is point three five, the overlap exactly, never more.',
  });
  tl.tween(condU, 1, { at: 43.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 48.2,
    dur: 5.4,
    text: 'This is the honest version of the two circle diagram everyone draws. The circles are entropies, the overlap is mutual information, and every region is a number you can compute from the table.',
  });
  tl.hold(53.8, 0.5);

  // — Beat 5 · independence check ———————————————————————————————————————————
  tl.caption({
    at: 54.3,
    dur: 5.0,
    text: 'Run the same arithmetic on the independent twin and the joint cost comes out at the full one point seven seven: overlap zero. Independent signals share not one bit.',
  });
  tl.hold(59.5, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 60.1, dur: 1.1, ease: ease.move });
  tl.tween(texU, 0, { at: 60.1, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 61.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 61.3,
    dur: 5.8,
    text: 'Mutual information is the overlap in the cost of describing two things: how many bits one observation shaves off the other. Next, what it costs when your probabilities are simply wrong.',
  });
  tl.hold(67.3, 1.2);

  return { tl, cam, tilesU, margU, indU, tableDim, barsU, slideU, condU, texU, dimU, endU };
}
