import { Timeline, ease, mulberry32 } from '../../core';

/**
 * PageRank — The Random Surfer.
 *
 * A five-page web. A seeded random surfer clicks links and visit-counts pile
 * up; then the dice are replaced by power iteration (push probability mass
 * down every link at once), damping adds the 15% teleport, and the bars
 * freeze into the stationary distribution. The walk, both iteration
 * sequences, and the final ranking are all computed once at module scope —
 * every frame is a pure function of the sampled channels.
 */

export interface PageNode {
  label: string;
  x: number;
  y: number;
}

/** Layout on the 1280×720 stage: graph left, rank bars right. */
export const NODES: PageNode[] = [
  { label: 'home', x: 430, y: 170 },
  { label: 'docs', x: 180, y: 330 },
  { label: 'blog', x: 350, y: 520 },
  { label: 'shop', x: 640, y: 470 },
  { label: 'wiki', x: 645, y: 260 },
];

/** Directed links (from → to). */
export const EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 0],
  [2, 3],
  [2, 4],
  [3, 0],
  [3, 4],
  [4, 0],
];

export const N = NODES.length;
export const DAMPING = 0.85;

const OUT: number[][] = NODES.map((_, j) => EDGES.filter(([f]) => f === j).map(([, t]) => t));

/** One multiplication by the link matrix, optionally damped. */
function step(v: number[], d: number): number[] {
  const next = new Array(N).fill((1 - d) / N);
  for (let j = 0; j < N; j++) {
    const share = (d * v[j]) / OUT[j].length;
    for (const i of OUT[j]) next[i] += share;
  }
  return next;
}

/**
 * The displayed iteration sequence: passes 0..6 undamped (beat 3's "push the
 * mass"), then passes 7..14 damped (beat 5 converges to the real PageRank).
 */
export const SEQ: number[][] = (() => {
  const seq = [new Array(N).fill(1 / N)];
  for (let k = 0; k < 6; k++) seq.push(step(seq[k], 1));
  for (let k = 6; k < 14; k++) seq.push(step(seq[k], DAMPING));
  return seq;
})();
export const K_PURE = 5; // beat 3 walks iterP 0 → K_PURE
export const K_ALL = SEQ.length - 1; // beat 5 walks iterP K_PURE → K_ALL

export const FINAL: number[] = SEQ[K_ALL];
/** Node indices best-first — the final ranking. */
export const ORDER: number[] = FINAL.map((v, i) => [v, i] as const)
  .sort((a, b) => b[0] - a[0])
  .map(([, i]) => i);

/** The beat-2 surfer: a seeded 16-hop random walk starting at docs. */
export const WALK: number[] = (() => {
  const rand = mulberry32(7);
  const w = [1];
  for (let j = 0; j < 16; j++) {
    const cur = w[w.length - 1];
    w.push(OUT[cur][Math.floor(rand() * OUT[cur].length)]);
  }
  return w;
})();

/** FRAC[j][i] — fraction of the first j+1 walk stops spent on node i. */
export const FRAC: number[][] = (() => {
  const counts = new Array(N).fill(0);
  return WALK.map((node, j) => {
    counts[node] += 1;
    return counts.map((c) => c / (j + 1));
  });
})();

export const BARS = { x0: 810, step: 76, w: 48, base: 560, hMax: 760 };
export const T_TOTAL = 71.5;

export function buildScene() {
  const tl = new Timeline();

  const nodeU = NODES.map((n) => tl.channel(`node_${n.label}`, 0));
  const edgeP = tl.channel('edgeP', 0); // links draw-on stagger (0..1 → 9 edges)
  const walkP = tl.channel('walkP', 0); // surfer progress in hops (0..16)
  const barsAxisU = tl.channel('barsAxisU', 0); // rank panel reveal
  const barMode = tl.channel('barMode', 0); // 0 = visit tallies, 1 = iteration mass
  const iterP = tl.channel('iterP', 0); // which pass the bars show (0..K_ALL)
  const flowPhase = tl.channel('flowPhase', 0); // dash traffic during passes
  const texMU = tl.channel('texMU', 0); // v_{k+1} = M v_k
  const teleU = tl.channel('teleU', 0); // teleport edge draw-on
  const teleP = tl.channel('teleP', 0); // teleport packet
  const texPRU = tl.channel('texPRU', 0); // damped PageRank formula
  const rankU = tl.channel('rankU', 0); // nodes rescale by final rank
  const chipP = tl.channel('chipP', 0); // #1..#5 chips stagger
  const glowTop = tl.channel('glowTop', 0); // the winner's halo

  // ---- beat 1: the web is a directed graph --------------------------------
  tl.caption({
    at: 0.3,
    dur: 6.0,
    text: "Five pages, nine links. Which matters most? Google's 1998 answer: ask the links themselves.",
  });
  for (let i = 0; i < nodeU.length; i++) {
    tl.tween(nodeU[i], 1, { at: 0.8 + i * 0.3, dur: 0.6, ease: ease.enter });
  }
  tl.tween(edgeP, 1, { at: 2.8, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'A link is a vote — but votes from important pages weigh more. Circular? Watch.',
  });
  tl.hold(12.0, 0.5);

  // ---- beat 2: the random surfer -------------------------------------------
  tl.caption({
    at: 12.6,
    dur: 5.4,
    text: 'Drop a surfer on a page and let them click random links, forever.',
  });
  tl.tween(barsAxisU, 1, { at: 13.0, dur: 1.0, ease: ease.draw });
  tl.tween(walkP, 16, { at: 13.4, dur: 11.0, ease: ease.linear });
  tl.caption({
    at: 18.6,
    dur: 6.2,
    text: 'Count where they spend their time — busy corners of the web emerge on their own.',
  });
  tl.hold(25.3, 0.5);

  // ---- beat 3: skip the dice — power iteration ------------------------------
  tl.caption({
    at: 26.0,
    dur: 6.2,
    text: 'Too slow? Ship all the probability at once: every page pushes its share down every link.',
  });
  tl.tween(barMode, 1, { at: 26.6, dur: 1.2, ease: ease.move });
  for (let k = 0; k < K_PURE; k++) {
    tl.tween(iterP, k + 1, { at: 28.2 + k * 1.05, dur: 0.6, ease: ease.move });
    tl.tween(flowPhase, (k + 1) * 1.4, { at: 28.2 + k * 1.05, dur: 0.6, ease: ease.linear });
  }
  tl.caption({
    at: 33.2,
    dur: 5.2,
    text: 'Each pass is one matrix multiply: rank flows until it stops changing.',
  });
  tl.tween(texMU, 1, { at: 33.8, dur: 0.7, ease: ease.enter });
  tl.hold(39.6, 0.6);

  // ---- beat 4: damping — the bored surfer teleports --------------------------
  tl.caption({
    at: 40.4,
    dur: 6.0,
    text: 'One fix from reality: sometimes the surfer gets bored and jumps anywhere at random.',
  });
  tl.tween(teleU, 1, { at: 41.0, dur: 1.0, ease: ease.draw });
  tl.tween(teleP, 1, { at: 42.2, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 46.8,
    dur: 6.0,
    text: 'An 85/15 blend — follow links, or teleport. No dead end or trap can hold you.',
  });
  tl.tween(texPRU, 1, { at: 47.4, dur: 0.7, ease: ease.enter });
  tl.tween(teleU, 0.25, { at: 51.4, dur: 1.0, ease: ease.move });
  tl.hold(53.2, 0.4);

  // ---- beat 5: convergence — the stationary distribution ---------------------
  tl.caption({
    at: 53.8,
    dur: 5.6,
    text: 'Iterate with damping and the bars freeze: the stationary distribution.',
  });
  for (let k = K_PURE; k < K_ALL; k++) {
    const j = k - K_PURE;
    tl.tween(iterP, k + 1, { at: 54.4 + j * 0.7, dur: 0.42, ease: ease.move });
    tl.tween(flowPhase, K_PURE * 1.4 + (j + 1) * 0.9, {
      at: 54.4 + j * 0.7,
      dur: 0.42,
      ease: ease.linear,
    });
  }
  tl.caption({
    at: 60.8,
    dur: 6.4,
    text: 'Start anywhere — you land in the same place. Rank = the time the eternal surfer spends there.',
  });
  tl.tween(rankU, 1, { at: 61.6, dur: 1.4, ease: ease.move });
  tl.tween(glowTop, 1, { at: 63.2, dur: 0.6, ease: ease.pop });
  tl.tween(chipP, 1, { at: 63.6, dur: 1.6, ease: ease.enter });
  tl.hold(70.3, 1.2); // total = T_TOTAL

  return {
    tl,
    ch: {
      nodeU,
      edgeP,
      walkP,
      barsAxisU,
      barMode,
      iterP,
      flowPhase,
      texMU,
      teleU,
      teleP,
      texPRU,
      rankU,
      chipP,
      glowTop,
    },
  };
}
