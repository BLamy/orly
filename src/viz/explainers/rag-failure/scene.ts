import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * RAG and Its Failure Modes — the reader believes the retriever.
 *
 * Real geometry at module scope. A toy corpus of three documents lives on
 * the unit circle (meaning = direction, chapter one). A toy reader answers
 * a speed question by quoting whatever number the retrieved document holds
 * — which is exactly how retrieval-augmented generation couples the two
 * stages. All similarities are actual cosines of the plotted vectors:
 *   query "how fast is a cheetah" → cheetah doc, cos 0.9994 — a clean hit.
 *   query "how fast is a jaguar" lands between the big-cat doc and the
 *   sports-car doc; the car doc wins, cos 0.9994 vs 0.9903 — semantically
 *   close, factually irrelevant — and the reader confidently answers with
 *   the car's top speed.
 *   The rewrite "jaguar the animal, speed" moves the query 12 degrees and
 *   flips the ranking: cos 0.9993 for the big cat.
 */

export interface Doc {
  name: string;
  fact: string;
  answer: string;
  deg: number;
}
export const DOCS: Doc[] = [
  { name: 'cheetah, big cat', fact: 'top speed 120 kph', answer: '120 kph', deg: 18 },
  { name: 'jaguar, big cat', fact: 'top speed 80 kph', answer: '80 kph', deg: 30 },
  { name: 'Jaguar, sports car', fact: 'top speed 300 kph', answer: '300 kph', deg: 44 },
];

export interface Query {
  text: string;
  deg: number;
}
export const Q_HIT: Query = { text: 'how fast is a cheetah', deg: 16 };
export const Q_MISS: Query = { text: 'how fast is a jaguar', deg: 42 }; // "fast" pulls toward cars
export const Q_FIX: Query = { text: 'jaguar the animal, speed', deg: 28 };

const rad = (d: number): number => (d * Math.PI) / 180;
export const cosSim = (a: number, b: number): number => Math.cos(rad(a - b));

/** Real rankings. */
export function rank(qDeg: number): { idx: number; sim: number }[] {
  return DOCS.map((d, idx) => ({ idx, sim: cosSim(qDeg, d.deg) })).sort((a, b) => b.sim - a.sim);
}
export const RANK_HIT = rank(Q_HIT.deg); // cheetah first, 0.9994
export const RANK_MISS = rank(Q_MISS.deg); // car first 0.9994, big cat 0.9781
export const RANK_FIX = rank(Q_FIX.deg); // big cat first 0.9994

// ---------------------------------------------------------------------------
// Stage layout — the unit-circle wedge left, the pipeline right.
// ---------------------------------------------------------------------------

export const OX = 170;
export const OY = 560;
export const R = 430;
export const dirX = (deg: number, r = R): number => OX + r * Math.cos(rad(deg));
export const dirY = (deg: number, r = R): number => OY - r * Math.sin(rad(deg));

export const PIPE_X = 760;
export const PIPE_Y0 = 130;

export const CAM_WEDGE: CameraState = { x: 480, y: 330, k: 1.15 };
export const CAM_PIPE: CameraState = { x: 820, y: 320, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  wedgeU: ChannelRef<number>; // circle + docs
  qMode: ChannelRef<number>; // 0 hit query · 1 miss query · 2 fixed query
  qU: ChannelRef<number>; // query arrow visible
  simU: ChannelRef<number>; // similarity readouts
  pipeU: ChannelRef<number>; // pipeline panel
  ansU: ChannelRef<number>; // the reader's answer appears
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const wedgeU = tl.channel('wedgeU', 0);
  const qMode = tl.channel('qMode', 0);
  const qU = tl.channel('qU', 0);
  const simU = tl.channel('simU', 0);
  const pipeU = tl.channel('pipeU', 0);
  const ansU = tl.channel('ansU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the pipeline ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Retrieval augmented generation staples two machines together: a retriever that finds the closest documents, and a reader that answers from whatever the retriever hands it. The staple is the story of this chapter.',
  });
  tl.tween(wedgeU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(pipeU, 1, { at: 2.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'Our corpus is three documents on the meaning circle: two big cats and one sports car that happens to share a name. Each stores one fact — a top speed.',
  });
  tl.hold(11.7, 0.5);

  // — Beat 2 · the hit ————————————————————————————————————————————————
  tl.caption({
    at: 12.2,
    dur: 5.4,
    text: 'First, the happy path. How fast is a cheetah? The query embeds two degrees from the cheetah document — cosine zero point nine nine nine — retrieval hands the reader the right fact, and out comes one hundred twenty.',
  });
  tl.tween(qU, 1, { at: 12.6, dur: 0.9, ease: ease.move });
  tl.tween(simU, 1, { at: 14.0, dur: 0.8, ease: ease.enter });
  tl.tween(ansU, 1, { at: 16.2, dur: 0.7, ease: ease.pop });
  tl.hold(17.8, 0.7);

  // — Beat 3 · the miss ————————————————————————————————————————————————
  tl.tween(ansU, 0, { at: 18.5, dur: 0.5, ease: ease.move });
  tl.caption({
    at: 18.9,
    dur: 5.8,
    text: 'Now the trap. How fast is a jaguar? In embedding space, the word fast keeps company with cars, and the query lands two degrees from the sports car — closer than to the animal the user meant.',
  });
  tl.tween(qMode, 1, { at: 19.5, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 25.1,
    dur: 5.6,
    text: 'The retriever is not wrong by its own rules: zero point nine nine nine beats zero point nine seven eight. Semantically close, factually irrelevant. And the reader does not know the difference — it answers three hundred, with total confidence.',
  });
  tl.tween(ansU, 1, { at: 28.4, dur: 0.7, ease: ease.pop });
  tl.hold(30.9, 0.6);

  // — Beat 4 · why this is the failure mode ————————————————————————————
  tl.caption({
    at: 31.5,
    dur: 5.6,
    text: 'Notice what failed and what did not. The embeddings did their job — those texts really are similar. The reader did its job — it read. The system failed, because nearest neighbor is not the same relation as answers the question.',
  });
  tl.hold(37.3, 0.6);

  // — Beat 5 · the fix ————————————————————————————————————————————————
  tl.tween(ansU, 0, { at: 37.9, dur: 0.5, ease: ease.move });
  tl.caption({
    at: 38.3,
    dur: 5.6,
    text: 'The practical mitigations all inject the missing context. Rewrite the query — jaguar, the animal — and it swings twelve degrees back; now the big cat wins and the answer is eighty. Rerankers and metadata filters play the same role.',
  });
  tl.tween(qMode, 2, { at: 38.9, dur: 1.6, ease: ease.move });
  tl.tween(ansU, 1, { at: 42.4, dur: 0.7, ease: ease.pop });
  tl.hold(43.9, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 44.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 45.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 46.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 46.3,
    dur: 6.0,
    text: 'The journey of this book, end to end: meaning became direction, direction made search possible, structure made it fast — and this chapter is the fine print. Retrieval hands the reader a belief. Make sure it is the right one to believe.',
  });
  tl.hold(52.5, 1.2);

  return { tl, cam, wedgeU, qMode, qU, simU, pipeU, ansU, dimU, endU };
}
