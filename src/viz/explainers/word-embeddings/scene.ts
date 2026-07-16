import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Word Embeddings — words become directions.
 *
 * An honest toy: sixteen words, each a hand-built 4-dimensional feature
 * vector along interpretable axes (gender, royalty, size, edibility). The
 * display is a fixed linear projection of those real vectors into 2-D — the
 * narration says so. Every similarity and every analogy below is computed
 * from the actual 4-D vectors at module scope and VERIFIED (the module
 * throws if king − man + woman does not land nearest queen, or
 * dog − puppy + kitten nearest cat). Nothing on screen is faked.
 */

export type Vec4 = readonly [number, number, number, number];

export type Group = 'people' | 'royals' | 'animals' | 'foods';

export interface Word {
  word: string;
  /** [gender (−1 male … +1 female), royalty, size, edibility] */
  v: Vec4;
  group: Group;
  /** word-label offset on stage, to keep close neighbors readable */
  lx: number;
  ly: number;
}

// ---------------------------------------------------------------------------
// The vocabulary — hand-constructed feature vectors (clearly a toy).
// ---------------------------------------------------------------------------

export const FEATURES = ['gender', 'royalty', 'size', 'edibility'] as const;

const W = (word: string, v: Vec4, group: Group, lx = 0, ly = -12): Word => ({
  word,
  v,
  group,
  lx,
  ly,
});

export const WORDS: readonly Word[] = [
  W('man', [-1.0, 0.1, 0.5, 0.0], 'people'),
  W('woman', [1.0, 0.1, 0.4, 0.0], 'people'),
  W('boy', [-1.0, 0.0, 0.2, 0.0], 'people'),
  W('girl', [1.0, 0.0, 0.2, 0.0], 'people'),
  W('king', [-1.0, 1.0, 0.5, 0.0], 'royals'),
  W('queen', [1.0, 1.0, 0.45, 0.0], 'royals', 0, 22),
  W('prince', [-1.0, 0.8, 0.25, 0.0], 'royals'),
  W('princess', [1.0, 0.8, 0.25, 0.0], 'royals', 0, 22),
  W('cat', [0.15, 0.0, 0.28, 0.05], 'animals', 26, 4),
  W('kitten', [0.15, 0.0, 0.04, 0.05], 'animals', 6, -12),
  W('dog', [-0.2, 0.0, 0.42, 0.05], 'animals', -8, 20),
  W('puppy', [-0.2, 0.0, 0.14, 0.05], 'animals', -30, 0),
  W('horse', [0.0, 0.05, 0.85, 0.05], 'animals'),
  W('apple', [0.0, 0.0, 0.1, 1.0], 'foods', -8, -12),
  W('bread', [0.3, 0.0, 0.2, 0.95], 'foods', 12, 16),
  W('cake', [-0.3, 0.1, 0.1, 0.88], 'foods', -26, 8),
];

export const wordIndex = (word: string): number => {
  const i = WORDS.findIndex((w) => w.word === word);
  if (i < 0) throw new Error(`word-embeddings: no such word "${word}"`);
  return i;
};

// ---------------------------------------------------------------------------
// 4-D vector math — real arithmetic, module scope.
// ---------------------------------------------------------------------------

export const add = (a: Vec4, b: Vec4): Vec4 => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
export const sub = (a: Vec4, b: Vec4): Vec4 => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const dot = (a: Vec4, b: Vec4): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
const norm = (a: Vec4): number => Math.sqrt(dot(a, a));
export const cosine = (a: Vec4, b: Vec4): number => dot(a, b) / (norm(a) * norm(b));
const distance = (a: Vec4, b: Vec4): number => norm(sub(a, b));

const vecOf = (word: string): Vec4 => WORDS[wordIndex(word)].v;

/** Nearest vocabulary word to `v`, excluding the analogy's own operands. */
export function nearestWord(v: Vec4, exclude: readonly string[]): string {
  let best = '';
  let bestD = Infinity;
  for (const w of WORDS) {
    if (exclude.includes(w.word)) continue;
    const d = distance(v, w.v);
    if (d < bestD) {
      bestD = d;
      best = w.word;
    }
  }
  return best;
}

// The two analogies — computed from the real vectors, verified right here.
export interface Analogy {
  a: string; // a − b + c ≈ target
  b: string;
  c: string;
  target: string;
  result: Vec4;
}

function makeAnalogy(a: string, b: string, c: string, expected: string): Analogy {
  const result = add(sub(vecOf(a), vecOf(b)), vecOf(c));
  const target = nearestWord(result, [a, b, c]);
  if (target !== expected) {
    throw new Error(
      `word-embeddings: ${a} - ${b} + ${c} lands nearest "${target}", expected "${expected}"`,
    );
  }
  return { a, b, c, target, result };
}

export const ANALOGY_1: Analogy = makeAnalogy('king', 'man', 'woman', 'queen');
export const ANALOGY_2: Analogy = makeAnalogy('dog', 'puppy', 'kitten', 'cat');

// The similarity beat's cosines — computed in the full 4-D space.
export const COS_CAT_DOG: number = cosine(vecOf('cat'), vecOf('dog')); // ≈ 0.60
export const COS_CAT_APPLE: number = cosine(vecOf('cat'), vecOf('apple')); // ≈ 0.24

// The captions speak "about zero point six" / "about zero point two" —
// keep the words honest against the numbers.
if (Math.abs(COS_CAT_DOG - 0.6) > 0.05 || Math.abs(COS_CAT_APPLE - 0.2) > 0.05) {
  throw new Error('word-embeddings: cosine values drifted from the narration');
}

// ---------------------------------------------------------------------------
// The 2-D display: a fixed linear projection of the 4-D vectors.
// ---------------------------------------------------------------------------

const PX: Vec4 = [0.55, 1.35, 0.25, -1.3];
const PY: Vec4 = [0.1, 1.1, -1.1, 1.05];

export const project = (v: Vec4): readonly [number, number] => [dot(v, PX), dot(v, PY)];

export const xScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.75, 2.45])
  .range([90, STAGE_W - 90]);
export const yScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-1.0, 1.25])
  .range([600, 70]);

/** Final stage position of each word (projection → scales). */
export const POS: readonly (readonly [number, number])[] = WORDS.map((w) => {
  const [px, py] = project(w.v);
  return [xScale(px), yScale(py)] as const;
});

export const posOf = (word: string): readonly [number, number] => POS[wordIndex(word)];

/** Stage position of an analogy's computed result vector. */
export const resultPos = (an: Analogy): readonly [number, number] => {
  const [px, py] = project(an.result);
  return [xScale(px), yScale(py)] as const;
};

// Seeded initial scatter — the cloud the words condense from.
const rand = mulberry32(7);
export const SCATTER: readonly (readonly [number, number])[] = WORDS.map(
  () => [120 + rand() * (STAGE_W - 240), 95 + rand() * 460] as const,
);

// Cluster halos (stage-space centroid + radius per group).
export interface Cluster {
  group: Group;
  label: string;
  cx: number;
  cy: number;
  r: number;
  labelDx: number;
  labelDy: number;
}

const clusterOf = (group: Group, label: string, pad: number, dx: number, dy: number): Cluster => {
  const pts = POS.filter((_, i) => WORDS[i].group === group);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const r = Math.max(...pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy))) + pad;
  return { group, label, cx, cy, r, labelDx: dx, labelDy: dy };
};

export const CLUSTERS: readonly Cluster[] = [
  clusterOf('animals', 'the animals', 42, 0, 148),
  clusterOf('royals', 'the royals', 46, 30, -104),
  clusterOf('foods', 'the foods', 40, 0, -78),
];

// ---------------------------------------------------------------------------
// Camera marks
// ---------------------------------------------------------------------------

export const CAM_SIM: CameraState = { x: 420, y: 310, k: 1.35 }; // cat–dog–apple triangle
export const CAM_ANIMALS: CameraState = { x: 548, y: 408, k: 1.75 }; // the second analogy
export const CAM_END: CameraState = { ...CAMERA_HOME };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dotsU: ChannelRef<number>;
  formU: ChannelRef<number>;
  labelU: ChannelRef<number>;
  featU: ChannelRef<number>;
  clusterU: ChannelRef<number>;
  simU: ChannelRef<number>;
  vec1U: ChannelRef<number>;
  ghost1U: ChannelRef<number>;
  res1U: ChannelRef<number>;
  tex1U: ChannelRef<number>;
  vec2U: ChannelRef<number>;
  ghost2U: ChannelRef<number>;
  res2U: ChannelRef<number>;
  tex2U: ChannelRef<number>;
  focus1U: ChannelRef<number>;
  focus2U: ChannelRef<number>;
  worldU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const dotsU = tl.channel('dotsU', 0);
  const formU = tl.channel('formU', 0);
  const labelU = tl.channel('labelU', 0);
  const featU = tl.channel('featU', 0);
  const clusterU = tl.channel('clusterU', 0);
  const simU = tl.channel('simU', 0);
  const vec1U = tl.channel('vec1U', 0);
  const ghost1U = tl.channel('ghost1U', 0);
  const res1U = tl.channel('res1U', 0);
  const tex1U = tl.channel('tex1U', 0);
  const vec2U = tl.channel('vec2U', 0);
  const ghost2U = tl.channel('ghost2U', 0);
  const res2U = tl.channel('res2U', 0);
  const tex2U = tl.channel('tex2U', 0);
  const focus1U = tl.channel('focus1U', 0);
  const focus2U = tl.channel('focus2U', 0);
  const worldU = tl.channel('worldU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the problem: models read numbers, not words ————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A language model never reads words. Before it can do anything, every word must become a list of numbers — a vector.',
  });
  tl.tween(dotsU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });

  // — Beat 2 · the toy vocabulary and its four features ————————————————————
  tl.caption({
    at: 6.6,
    dur: 6.0,
    text: 'Here are sixteen toy words. Each one is hand built from just four features: gender, royalty, size, and edibility.',
  });
  tl.tween(featU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.hold(12.6, 0.6);

  // — Beat 3 · the formation: scatter → projected positions ————————————————
  tl.caption({
    at: 13.2,
    dur: 5.6,
    text: 'Lay each vector out flat, through two directions of that little space, and watch where the words land.',
  });
  tl.tween(formU, 1, { at: 13.5, dur: 2.4, ease: ease.move });
  tl.tween(labelU, 1, { at: 15.3, dur: 1.2, ease: ease.enter });

  // — Beat 4 · clusters ————————————————————————————————————————————————————
  tl.caption({
    at: 19.2,
    dur: 6.0,
    text: 'Similar words settle near each other. The animals gather here, the royals over there, and the foods keep to themselves.',
  });
  tl.tween(clusterU, 1, { at: 19.5, dur: 1.3, ease: ease.enter });
  tl.tween(featU, 0, { at: 19.2, dur: 0.8, ease: ease.move });
  tl.hold(25.2, 0.6);

  // — Beat 5 · distance is similarity: push in, measure cosines ————————————
  tl.caption({
    at: 25.8,
    dur: 6.0,
    text: 'Distance is similarity, and we can measure it: the cosine of the angle between two vectors, back in all four dimensions.',
    tex: '\\cos(\\theta) = \\dfrac{u \\cdot v}{\\lVert u \\rVert\\,\\lVert v \\rVert}',
  });
  tl.tween(cam, CAM_SIM, { at: 26.0, dur: 1.5, ease: ease.move });
  tl.tween(clusterU, 0.25, { at: 26.0, dur: 1.2, ease: ease.move });
  tl.tween(simU, 1, { at: 27.6, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 32.2,
    dur: 6.0,
    text: 'Cat and dog lean the same way, a cosine of about zero point six. Cat and apple barely agree, about zero point two.',
  });
  tl.hold(38.2, 0.6);

  // — Beat 6 · directions carry meaning: king − man + woman ————————————————
  tl.caption({
    at: 38.8,
    dur: 4.8,
    text: 'Now for the strange part. In this space, directions carry meaning too.',
  });
  tl.tween(cam, { ...CAMERA_HOME }, { at: 39.0, dur: 1.4, ease: ease.move });
  tl.tween(simU, 0, { at: 38.8, dur: 0.9, ease: ease.move });
  tl.tween(clusterU, 0.12, { at: 39.0, dur: 1.0, ease: ease.move });

  tl.caption({
    at: 44.0,
    dur: 6.2,
    text: 'Take king, subtract man, and add woman. That is real arithmetic on the four numbers underneath each word.',
    tex: '\\vec{v}_{\\text{king}} - \\vec{v}_{\\text{man}} + \\vec{v}_{\\text{woman}}',
  });
  tl.tween(focus1U, 1, { at: 44.0, dur: 0.9, ease: ease.move });
  tl.tween(vec1U, 1, { at: 44.4, dur: 1.3, ease: ease.draw });
  tl.tween(tex1U, 1, { at: 45.0, dur: 0.7, ease: ease.enter });
  tl.tween(ghost1U, 1, { at: 47.6, dur: 1.3, ease: ease.draw });

  tl.caption({
    at: 50.8,
    dur: 6.4,
    text: 'The result lands almost exactly on queen — the nearest word in the whole vocabulary. The gender direction carried the meaning.',
  });
  tl.tween(res1U, 1, { at: 51.2, dur: 0.5, ease: ease.pop });
  tl.hold(57.2, 0.8);

  // — Beat 7 · the second analogy: dog − puppy + kitten ————————————————————
  tl.caption({
    at: 58.0,
    dur: 5.2,
    text: 'And it is not a one off. Dog minus puppy points from young to grown up.',
    tex: '\\vec{v}_{\\text{dog}} - \\vec{v}_{\\text{puppy}} + \\vec{v}_{\\text{kitten}}',
  });
  tl.tween(focus1U, 0, { at: 58.0, dur: 0.8, ease: ease.move });
  tl.tween(tex1U, 0, { at: 58.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_ANIMALS, { at: 58.2, dur: 1.5, ease: ease.move });
  tl.tween(focus2U, 1, { at: 58.4, dur: 0.9, ease: ease.move });
  tl.tween(vec2U, 1, { at: 59.2, dur: 1.3, ease: ease.draw });
  tl.tween(tex2U, 1, { at: 59.6, dur: 0.7, ease: ease.enter });

  tl.caption({
    at: 63.6,
    dur: 5.6,
    text: 'Add that same arrow to kitten, and you land on cat. Same direction, different animal.',
  });
  tl.tween(ghost2U, 1, { at: 63.9, dur: 1.3, ease: ease.draw });
  tl.tween(res2U, 1, { at: 65.6, dur: 0.5, ease: ease.pop });
  tl.hold(69.2, 0.8);

  // — Beat 8 · recap: meaning is geometry ——————————————————————————————————
  tl.caption({
    at: 70.0,
    dur: 7.0,
    text: 'These sixteen vectors are a toy. Real embeddings have hundreds of learned dimensions, and nobody names the axes. But the geometry works the same way.',
  });
  tl.tween(cam, CAM_END, { at: 70.2, dur: 1.6, ease: ease.move });
  tl.tween(worldU, 0.12, { at: 70.6, dur: 1.4, ease: ease.move });
  tl.tween(tex2U, 0, { at: 70.0, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 72.6, dur: 1.0, ease: ease.enter });

  tl.caption({
    at: 77.6,
    dur: 7.0,
    text: 'Meaning is geometry. The model never sees a single word — only these directions, and everything that follows builds on them.',
  });
  tl.hold(84.6, 1.4);

  return {
    tl,
    cam,
    dotsU,
    formU,
    labelU,
    featU,
    clusterU,
    simU,
    vec1U,
    ghost1U,
    res1U,
    tex1U,
    vec2U,
    ghost2U,
    res2U,
    tex2U,
    focus1U,
    focus2U,
    worldU,
    endU,
  };
}
