import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Cosine Similarity — direction is meaning, length is loudness.
 *
 * Real vectors, real arithmetic, all at module scope. A query q = (1, 0.2)
 * against two documents: A = (0.9, 0.25), short but pointing the same way,
 * and B = (3.0, 2.4), long but off-angle. Computed: dot(q,A) = 0.95 while
 * dot(q,B) = 3.48 — raw dot product ranks the long document 3.7× higher.
 * Normalize both and the order flips: cos(q,A) = 0.995, cos(q,B) = 0.916.
 * The chapter builds the geometric intuition: embeddings put meaning in the
 * DIRECTION of a vector; magnitude picks up length/frequency artifacts, and
 * normalization removes exactly that nuisance.
 */

export interface V2 {
  x: number;
  y: number;
}
export const Q: V2 = { x: 1.0, y: 0.2 };
export const DOC_A: V2 = { x: 0.9, y: 0.25 }; // short, aligned
export const DOC_B: V2 = { x: 3.0, y: 2.4 }; // long, off-angle

export const dot = (a: V2, b: V2): number => a.x * b.x + a.y * b.y;
export const norm = (a: V2): number => Math.hypot(a.x, a.y);
export const cos = (a: V2, b: V2): number => dot(a, b) / (norm(a) * norm(b));
export const unit = (a: V2): V2 => ({ x: a.x / norm(a), y: a.y / norm(a) });

export const DOT_A = dot(Q, DOC_A); // 0.95
export const DOT_B = dot(Q, DOC_B); // 3.48
export const COS_A = cos(Q, DOC_A); // 0.995
export const COS_B = cos(Q, DOC_B); // 0.916
export const ANGLE_A = (Math.acos(COS_A) * 180) / Math.PI; // ≈ 5.8°
export const ANGLE_B = (Math.acos(COS_B) * 180) / Math.PI; // ≈ 23.7°

// ---------------------------------------------------------------------------
// Stage layout — vector space with origin lower-left.
// ---------------------------------------------------------------------------

export const OX = 240;
export const OY = 560;
export const SCALE = 175; // px per unit
export const vx = (v: V2): number => OX + v.x * SCALE;
export const vy = (v: V2): number => OY - v.y * SCALE;

export const CAM_SPACE: CameraState = { x: 560, y: 330, k: 1.1 };
export const CAM_CIRCLE: CameraState = { x: OX + 0.9 * SCALE, y: OY - 0.75 * SCALE, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  qU: ChannelRef<number>; // query arrow grows
  aU: ChannelRef<number>;
  bU: ChannelRef<number>;
  dotU: ChannelRef<number>; // dot-product scoreboard
  normW: ChannelRef<number>; // 0 raw vectors → 1 normalized (arrows shrink to unit circle)
  circU: ChannelRef<number>; // unit circle
  arcU: ChannelRef<number>; // angle arcs
  cosU: ChannelRef<number>; // cosine scoreboard
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const qU = tl.channel('qU', 0);
  const aU = tl.channel('aU', 0);
  const bU = tl.channel('bU', 0);
  const dotU = tl.channel('dotU', 0);
  const normW = tl.channel('normW', 0);
  const circU = tl.channel('circU', 0);
  const arcU = tl.channel('arcU', 0);
  const cosU = tl.channel('cosU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · meaning as direction ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Retrieval begins with a promise: text becomes a vector, and similar meanings become nearby vectors. This book opens with the geometry that makes that promise precise — and the trap inside it.',
  });
  tl.tween(axU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_SPACE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'Here is a query about, say, espresso machines. And two documents: A, a short focused note pointing almost exactly the same way, and B, a long rambling page angled off toward another topic.',
  });
  tl.tween(qU, 1, { at: 6.8, dur: 1.0, ease: ease.move });
  tl.tween(aU, 1, { at: 8.2, dur: 1.0, ease: ease.move });
  tl.tween(bU, 1, { at: 9.4, dur: 1.2, ease: ease.move });
  tl.hold(11.9, 0.6);

  // — Beat 2 · the dot-product trap ————————————————————————————————————
  tl.caption({
    at: 12.5,
    dur: 5.6,
    text: 'Score them with a raw dot product — projection times length — and the long document wins by a mile: three point five against zero point nine five. Not because it matches better. Because it is louder.',
    tex: 'q \\cdot B = 3.48 \\;>\\; q \\cdot A = 0.95',
  });
  tl.tween(dotU, 1, { at: 13.1, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 18.3,
    dur: 5.0,
    text: 'Length in embedding space picks up artifacts — how long the text was, how frequent its words. Meaning lives in the direction. The dot product mixes the two together.',
  });
  tl.hold(23.5, 0.6);

  // — Beat 3 · normalize ———————————————————————————————————————————————
  tl.tween(cam, CAM_CIRCLE, { at: 24.1, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.5,
    dur: 5.6,
    text: 'So remove the loudness. Divide every vector by its own length, and each one slides onto the unit circle. Nothing about direction changes — the volume knob is simply gone.',
  });
  tl.tween(circU, 1, { at: 25.1, dur: 1.2, ease: ease.draw });
  tl.tween(normW, 1, { at: 26.3, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 30.5,
    dur: 5.6,
    text: 'Now the same dot product measures only the angle. Document A sits six degrees from the query: cosine zero point nine nine five. Document B is twenty four degrees away: zero point nine two. The order flips.',
    tex: '\\cos\\theta = \\frac{q \\cdot d}{\\|q\\|\\,\\|d\\|}',
  });
  tl.tween(arcU, 1, { at: 31.1, dur: 1.2, ease: ease.draw });
  tl.tween(cosU, 1, { at: 32.3, dur: 0.8, ease: ease.enter });
  tl.hold(36.3, 0.6);

  // — Beat 4 · why it matters ——————————————————————————————————————————
  tl.tween(cam, CAM_SPACE, { at: 36.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 37.3,
    dur: 5.6,
    text: 'This is why vector databases store normalized embeddings and rank by cosine: it makes similar meaning the only thing that scores. Skip the normalization and your search engine quietly prefers long documents.',
  });
  tl.caption({
    at: 43.1,
    dur: 4.6,
    text: 'One more gift of the unit circle: for unit vectors, cosine, dot product, and euclidean distance all rank identically. Pick whichever your hardware computes fastest.',
    tex: '\\|a-b\\|^2 = 2 - 2\\,a\\cdot b',
  });
  tl.hold(47.9, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.1, dur: 1.1, ease: ease.move });
  tl.tween(dotU, 0, { at: 49.1, dur: 0.8, ease: ease.move });
  tl.tween(cosU, 0, { at: 49.1, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.3,
    dur: 5.4,
    text: 'Hold onto the picture: meaning is a direction on a very high dimensional sphere, and similarity is the angle between two directions. Everything else in this book is about finding small angles fast.',
  });
  tl.hold(55.9, 1.2);

  return { tl, cam, axU, qU, aU, bU, dotU, normW, circU, arcU, cosU, dimU, endU };
}
