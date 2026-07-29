import { CAMERA_HOME, Timeline, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Residual Stream — a highway with editors.
 *
 * All math is real and lives here at module scope:
 *  - a 6-dimensional hidden state and 4 transformer blocks, each block's
 *    update f(x) = tanh(W x) with a seeded 6×6 matrix; the residual run is
 *    x ← x + f(x) and every intermediate state is precomputed;
 *  - the "no residual" foil repeatedly REPLACES the state with a contractive
 *    map y ← tanh(C y) (‖C‖ small), so the norm demonstrably decays;
 *  - two neighbor tokens get their own residual runs for the parallel-streams
 *    beat.
 * Nothing below uses wall-clock time or unseeded randomness.
 */

export const DIM = 6;
export const N_BLOCKS = 4;

const rand = mulberry32(20260716);

/** DIM×DIM matrix with entries uniform in (−scale, scale). */
function matrix(scale: number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < DIM; i++) {
    const row: number[] = [];
    for (let j = 0; j < DIM; j++) row.push((rand() * 2 - 1) * scale);
    m.push(row);
  }
  return m;
}

function matVec(m: readonly number[][], v: readonly number[]): number[] {
  return m.map((row) => row.reduce((acc, w, j) => acc + w * v[j], 0));
}

const tanhVec = (v: readonly number[]): number[] => v.map(Math.tanh);
const addVec = (a: readonly number[], b: readonly number[]): number[] => a.map((x, i) => x + b[i]);
export const norm = (v: readonly number[]): number => Math.hypot(...v);

// — the four block matrices (one per editor) and the contractive foil ————
export const BLOCK_W: number[][][] = Array.from({ length: N_BLOCKS }, () => matrix(0.55));
const CONTRACT_C: number[][] = matrix(0.4); // spectral radius well below 1

/** which blocks are attention (read other streams) vs feed-forward */
export const BLOCK_KIND: readonly ('mlp' | 'attn')[] = ['mlp', 'attn', 'mlp', 'attn'];
export const BLOCK_NAME: Record<'mlp' | 'attn', string> = {
  mlp: 'feed forward',
  attn: 'attention',
};

/** the token's initial hidden state (unit-ish, hand-shaped for readable bars) */
export const X0: number[] = [0.9, -0.55, 0.7, -0.8, 0.45, -0.35];

/** one block's update: f(x) = tanh(W x) — the "small edit". */
export const blockUpdate = (k: number, x: readonly number[]): number[] =>
  tanhVec(matVec(BLOCK_W[k], x));

function residualRun(x0: readonly number[]): { states: number[][]; deltas: number[][] } {
  const states: number[][] = [[...x0]];
  const deltas: number[][] = [];
  for (let k = 0; k < N_BLOCKS; k++) {
    const d = blockUpdate(k, states[k]);
    deltas.push(d);
    states.push(addVec(states[k], d)); // x ← x + f(x): never replaced
  }
  return { states, deltas };
}

// — the foil: replace instead of add, six applications, norm decays ————————
export const N_PLAIN = 6;
export const PLAIN: number[][] = (() => {
  const out: number[][] = [[...X0]];
  for (let k = 0; k < N_PLAIN; k++) out.push(tanhVec(matVec(CONTRACT_C, out[k])));
  return out;
})();
export const PLAIN_NORMS: number[] = PLAIN.map(norm);
// empirically: ‖y‖ falls ≈ 1.55 → 0.02 over six replacements

// — the hero token and its two neighbors (parallel streams) ————————————————
export const RES = residualRun(X0);
export const RES_NORMS: number[] = RES.states.map(norm);
// empirically: ‖x‖ ≈ 1.55 → ~2.4 — the signal survives (and picks up edits)

const NB_X0: number[][] = [
  [-0.6, 0.8, -0.4, 0.55, -0.75, 0.5],
  [0.5, 0.35, -0.85, -0.3, 0.7, -0.6],
];
export const NEIGHBORS = NB_X0.map((x0) => residualRun(x0));

/** bar scale: the largest |component| ever displayed, for a stable bar range */
export const BAR_MAX: number = Math.max(
  ...[...PLAIN, ...RES.states, ...RES.deltas, ...NEIGHBORS.flatMap((n) => n.states)].flatMap((v) =>
    v.map(Math.abs),
  ),
);

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** fractional-index lerp through a list of state vectors (pure lookup). */
export function valsAt(states: readonly number[][], u: number): number[] {
  const f = clamp01(u) * (states.length - 1);
  const i = Math.floor(f);
  if (i >= states.length - 1) return [...states[states.length - 1]];
  const t = f - i;
  return states[i].map((a, j) => a + (states[i + 1][j] - a) * t);
}

export const lerpVec = (a: readonly number[], b: readonly number[], t: number): number[] =>
  a.map((x, i) => x + (b[i] - x) * t);

// ---------------------------------------------------------------------------
// Highway geometry (world coordinates; the camera travels along it)
// ---------------------------------------------------------------------------

export const LANE_Y = 380; // the hero token's stream
export const LANE_TOP = 236; // neighbor stream above
export const LANE_BOT = 524; // neighbor stream below
export const BLOCK_X: readonly number[] = [560, 940, 1320, 1700];
export const BLOCK_W_PX = 128;
export const TOKEN_START_X = 250;
export const TOKEN_END_X = 1935;
export const HIGHWAY_X0 = 150;
export const HIGHWAY_X1 = 2040;

export const CAM_WIDE_MULTI: CameraState = { x: 1130, y: 372, k: 0.62 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  introU: ChannelRef<number>;
  plainProg: ChannelRef<number>;
  resetU: ChannelRef<number>;
  resProg: ChannelRef<number>;
  resTexU: ChannelRef<number>;
  highwayU: ChannelRef<number>;
  tokX: ChannelRef<number>;
  stateProg: ChannelRef<number>;
  dShow: ChannelRef<number>[];
  dMerge: ChannelRef<number>[];
  arcU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  multiU: ChannelRef<number>;
  multiProg: ChannelRef<number>;
  crossU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  recapTexU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const introU = tl.channel('introU', 0);
  const plainProg = tl.channel('plainProg', 0);
  const resetU = tl.channel('resetU', 0);
  const resProg = tl.channel('resProg', 0);
  const resTexU = tl.channel('resTexU', 0);
  const highwayU = tl.channel('highwayU', 0);
  const tokX = tl.channel('tokX', TOKEN_START_X);
  const stateProg = tl.channel('stateProg', 0);
  const dShow = [0, 1, 2, 3].map((k) => tl.channel(`dShow${k}`, 0));
  const dMerge = [0, 1, 2, 3].map((k) => tl.channel(`dMerge${k}`, 0));
  const arcU = tl.channel('arcU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const multiU = tl.channel('multiU', 0);
  const multiProg = tl.channel('multiProg', 0);
  const crossU = tl.channel('crossU', 0);
  const dimU = tl.channel('dimU', 1);
  const recapTexU = tl.channel('recapTexU', 0);

  // — Beat 1 · the stakes ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: "A transformer is dozens of layers deep. So here's a puzzle: how does anything survive a journey through that many transformations?",
  });
  tl.tween(introU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.08 }, { at: 0.8, dur: 3.0, ease: ease.move });

  // — Beat 2 · replace, and the signal dies ——————————————————————————————
  tl.caption({
    at: 7.6,
    dur: 7.0,
    text: 'Watch what happens if each layer simply replaces the state. Apply a squashing transformation over and over, and the signal shrinks toward nothing.',
  });
  tl.tween(plainProg, 1, { at: 8.2, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 15.1,
    dur: 5.6,
    text: "By the last layer there's almost nothing left to read. Deep stacks that overwrite their input end up forgetting it.",
  });
  tl.hold(20.7, 0.8);

  // — Beat 3 · the fix: keep the original, add a small edit ———————————————
  tl.caption({
    at: 21.5,
    dur: 6.8,
    text: 'The fix is one plus sign. Each layer keeps the original and adds a small edit on top. The state is never replaced, only amended.',
    tex: 'x \\leftarrow x + f(x)',
  });
  tl.tween(resTexU, 1, { at: 21.9, dur: 0.7, ease: ease.enter });
  tl.tween(resetU, 1, { at: 22.6, dur: 1.0, ease: ease.move });
  tl.tween(resProg, 1, { at: 24.6, dur: 5.6, ease: ease.linear });
  tl.caption({
    at: 28.6,
    dur: 6.4,
    text: 'Same kind of squashing layers, but now the strength readout holds steady. The original signal rides through untouched underneath the edits.',
  });
  tl.hold(35.0, 0.8);

  // — Beat 4 · the highway appears ————————————————————————————————————————
  tl.tween(introU, 0, { at: 35.6, dur: 1.0, ease: ease.move });
  tl.tween(resTexU, 0, { at: 35.6, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 36.6,
    dur: 6.8,
    text: 'This running state is called the residual stream. Picture it as a highway: one vector per token, flowing through every block in the model.',
  });
  tl.tween(highwayU, 1, { at: 36.7, dur: 1.6, ease: ease.draw });
  tl.tween(ghostU, 1, { at: 38.0, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 560, y: 372, k: 1.0 }, { at: 36.8, dur: 1.8, ease: ease.move });

  // — Beat 5 · block 0: read, compute, add (the bars visibly sum) —————————
  tl.caption({
    at: 44.0,
    dur: 6.8,
    text: 'Each block is an editor. It reads the stream, computes a small update, and adds it back in. Watch the bars literally sum.',
  });
  tl.tween(tokX, BLOCK_X[0], { at: 43.6, dur: 2.4, ease: ease.linear });
  tl.tween(cam, { x: BLOCK_X[0] + 60, y: 372, k: 1.0 }, { at: 43.6, dur: 2.4, ease: ease.linear });
  tl.tween(dShow[0], 1, { at: 46.4, dur: 0.8, ease: ease.enter });
  tl.tween(dMerge[0], 1, { at: 47.6, dur: 1.4, ease: ease.move });
  tl.tween(stateProg, 1, { at: 47.6, dur: 1.4, ease: ease.move });
  tl.hold(50.8, 0.7);

  // — Beat 6 · block 1: attention pulls from other streams ————————————————
  tl.caption({
    at: 51.5,
    dur: 6.8,
    text: "Attention blocks are the editors that look around. They pull information in from the other tokens' streams before writing their edit.",
  });
  tl.tween(tokX, BLOCK_X[1], { at: 51.5, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: BLOCK_X[1] + 60, y: 372, k: 1.0 }, { at: 51.5, dur: 2.0, ease: ease.linear });
  tl.tween(arcU, 1, { at: 53.5, dur: 0.9, ease: ease.enter });
  tl.tween(dShow[1], 1, { at: 54.4, dur: 0.7, ease: ease.enter });
  tl.tween(dMerge[1], 1, { at: 55.4, dur: 1.4, ease: ease.move });
  tl.tween(stateProg, 2, { at: 55.4, dur: 1.4, ease: ease.move });
  tl.tween(arcU, 0, { at: 57.0, dur: 0.9, ease: ease.move });
  tl.hold(58.0, 0.5);

  // — Beat 7 · block 2: feed forward edits in place ———————————————————————
  tl.caption({
    at: 58.5,
    dur: 6.2,
    text: "Feed forward blocks edit in place. No looking around — just a computation on this one token's own vector, added back to the stream.",
  });
  tl.tween(tokX, BLOCK_X[2], { at: 58.5, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: BLOCK_X[2] + 60, y: 372, k: 1.0 }, { at: 58.5, dur: 2.0, ease: ease.linear });
  tl.tween(dShow[2], 1, { at: 60.8, dur: 0.7, ease: ease.enter });
  tl.tween(dMerge[2], 1, { at: 61.8, dur: 1.4, ease: ease.move });
  tl.tween(stateProg, 3, { at: 61.8, dur: 1.4, ease: ease.move });
  tl.hold(64.4, 0.6);

  // — Beat 8 · block 3, and out the far end ———————————————————————————————
  tl.caption({
    at: 65.0,
    dur: 7.2,
    text: 'Block after block, the same story: read, compute, add. The vector that arrives at the end is the sum of the input and every edit along the way.',
  });
  tl.tween(tokX, BLOCK_X[3], { at: 65.0, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: BLOCK_X[3] + 60, y: 372, k: 1.0 }, { at: 65.0, dur: 2.0, ease: ease.linear });
  tl.tween(arcU, 1, { at: 67.0, dur: 0.7, ease: ease.enter });
  tl.tween(dShow[3], 1, { at: 67.7, dur: 0.6, ease: ease.enter });
  tl.tween(dMerge[3], 1, { at: 68.6, dur: 1.3, ease: ease.move });
  tl.tween(stateProg, 4, { at: 68.6, dur: 1.3, ease: ease.move });
  tl.tween(arcU, 0, { at: 69.9, dur: 0.7, ease: ease.move });
  tl.tween(tokX, TOKEN_END_X, { at: 70.4, dur: 1.6, ease: ease.linear });
  tl.hold(72.0, 0.8);

  // — Beat 9 · many tokens, parallel streams ——————————————————————————————
  tl.caption({
    at: 72.8,
    dur: 7.2,
    text: "And it's not one highway. Every token has its own stream, all running in parallel — and attention is the only place they exchange traffic.",
  });
  tl.tween(cam, CAM_WIDE_MULTI, { at: 72.8, dur: 2.2, ease: ease.move });
  tl.tween(multiU, 1, { at: 73.6, dur: 1.2, ease: ease.enter });
  tl.tween(multiProg, 1, { at: 74.8, dur: 6.0, ease: ease.linear });
  tl.tween(crossU, 1, { at: 76.0, dur: 1.0, ease: ease.enter });
  tl.hold(80.8, 0.6);

  // — Beat 10 · recap: a stack of editors, one manuscript —————————————————
  tl.caption({
    at: 81.4,
    dur: 7.0,
    text: "So a transformer isn't a pipeline that mangles its input beyond recognition. It's a stack of editors, all writing into one shared manuscript.",
  });
  tl.tween(dimU, 0.13, { at: 81.8, dur: 1.6, ease: ease.move });
  tl.tween(crossU, 0, { at: 81.8, dur: 1.2, ease: ease.move });
  tl.tween(recapTexU, 1, { at: 83.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 88.9,
    dur: 7.4,
    text: "Everything a later layer knows, it read from the stream. Everything it decides, it writes there. The residual stream is the model's working memory.",
  });
  tl.hold(96.3, 1.2);

  return {
    tl,
    cam,
    introU,
    plainProg,
    resetU,
    resProg,
    resTexU,
    highwayU,
    tokX,
    stateProg,
    dShow,
    dMerge,
    arcU,
    ghostU,
    multiU,
    multiProg,
    crossU,
    dimU,
    recapTexU,
  };
}
