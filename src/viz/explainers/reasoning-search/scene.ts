import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Search Over Reasoning — beam search on a toy reasoning tree, actually run.
 *
 * The tree: depth 6, branching 3; from any correct node exactly one child
 * continues the correct derivation. A step scorer (a small process judge)
 * gives the correct child a +1 bump buried in Gaussian noise (sigma 0.8) —
 * informative but far from reliable.
 *
 * Measured over 4000 seeded trees per width: greedy (width 1) finds the
 * correct leaf 11.4% of the time at ~18 nodes expanded; beam width 16 finds
 * it 76.6% at ~183 nodes. The showcased single tree (seed 301) is a real run
 * where greedy dies at the very first fork while beam width 4 recovers,
 * because it kept the quietly-correct branch alive.
 */

export const D = 6;
export const B = 3;
const SIG = 0.8;

export interface SweepPt {
  w: number;
  success: number;
  nodes: number;
}
export const WIDTHS = [1, 2, 4, 8, 16] as const;
export const SWEEP: SweepPt[] = (() => {
  const out: SweepPt[] = [];
  for (const w of WIDTHS) {
    const rand = mulberry32(17 + w);
    const g = gaussian(rand);
    const runs = 4000;
    let hit = 0;
    let exp = 0;
    for (let k = 0; k < runs; k++) {
      let beams = [{ on: true, score: 0 }];
      for (let d = 0; d < D; d++) {
        const cand: { on: boolean; score: number }[] = [];
        for (const b of beams) {
          for (let c = 0; c < B; c++) {
            exp++;
            const isCorrect = b.on && c === 0;
            cand.push({ on: isCorrect, score: b.score + (isCorrect ? 1 : 0) + SIG * g() });
          }
        }
        cand.sort((a, b2) => b2.score - a.score);
        beams = cand.slice(0, w);
      }
      if (beams.some((b) => b.on)) hit++;
    }
    out.push({ w, success: hit / runs, nodes: Math.round(exp / runs) });
  }
  return out;
})();
export const GREEDY = SWEEP[0];
export const BEST = SWEEP[SWEEP.length - 1];

// --- the showcased tree (seed 301): greedy dies at the first fork, beam-4 recovers
export interface LevelRec {
  /** candidate paths at this level (after expansion), with correctness + kept flags */
  cands: { path: string; on: boolean; kept: boolean; greedy: boolean }[];
}
export const SHOW_LEVELS: LevelRec[] = (() => {
  const rand = mulberry32(301);
  const g = gaussian(rand);
  const memo = new Map<string, number>();
  const sc = (path: string): number => {
    if (!memo.has(path)) {
      const on = [...path].every((c) => c === '0');
      memo.set(path, (on ? 1 : 0) + SIG * g());
    }
    return memo.get(path) as number;
  };
  // greedy trace first (same memoized tree)
  let gp = '';
  for (let d = 0; d < D; d++) {
    let best = -1e9;
    let bc = 0;
    for (let c = 0; c < B; c++) {
      const s = sc(gp + c);
      if (s > best) {
        best = s;
        bc = c;
      }
    }
    gp += bc;
  }
  const greedyPaths = new Set<string>();
  for (let d = 1; d <= D; d++) greedyPaths.add(gp.slice(0, d));
  // beam 4
  let beams = [{ path: '', score: 0 }];
  const levels: LevelRec[] = [];
  for (let d = 0; d < D; d++) {
    const cand: { path: string; score: number }[] = [];
    for (const b of beams)
      for (let c = 0; c < B; c++) {
        const p = b.path + c;
        cand.push({ path: p, score: b.score + sc(p) });
      }
    cand.sort((a, b2) => b2.score - a.score);
    const kept = new Set(cand.slice(0, 4).map((x) => x.path));
    levels.push({
      cands: cand.map((x) => ({
        path: x.path,
        on: [...x.path].every((ch) => ch === '0'),
        kept: kept.has(x.path),
        greedy: greedyPaths.has(x.path),
      })),
    });
    beams = cand.slice(0, 4);
  }
  return levels;
})();

// ---------------------------------------------------------------------------
// Layout — tree levels left→right across the top, sweep chart bottom-right.
// ---------------------------------------------------------------------------

export const TREE_X0 = 150;
export const TREE_DX = 165;
export const TREE_Y0 = 110;
export const TREE_H = 300;
export const lvlX = (d: number): number => TREE_X0 + d * TREE_DX;
export const nodeY = (i: number, n: number): number =>
  TREE_Y0 + ((i + 0.5) / n) * TREE_H;

export const CH_X0 = 700;
export const CH_X1 = 1180;
export const CH_Y0 = 640;
export const CH_H = 150;
export const chX = (nodes: number): number => CH_X0 + (nodes / 190) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_TREE: CameraState = { x: 600, y: 260, k: 1.15 };
export const CAM_CHART: CameraState = { x: 900, y: 480, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  treeU: ChannelRef<number>; // 0..D levels expand
  greedyU: ChannelRef<number>; // greedy trace highlight
  beamU: ChannelRef<number>; // beam kept-set highlight
  axU: ChannelRef<number>;
  sweepU: ChannelRef<number>; // 0..WIDTHS.length-1
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const treeU = tl.channel('treeU', 0);
  const greedyU = tl.channel('greedyU', 0);
  const beamU = tl.channel('beamU', 0);
  const axU = tl.channel('axU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the tree ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Chapter three graded finished chains. But why wait for a chain to finish? Each reasoning step is a fork: three ways to continue, one of them right. Six forks deep, that is a tree — and picking answers becomes a search problem.',
  });
  tl.tween(cam, CAM_TREE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(treeU, D, { at: 1.8, dur: 4.2, ease: ease.move });
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'This is one real tree from our simulation. At every fork a step scorer whispers a hint: the correct child gets a bump of plus one, buried in noise almost as large. Green marks the derivation that is actually correct.',
  });
  tl.hold(12.1, 0.6);

  // — Beat 2 · greedy dies ——————————————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.4,
    text: 'The cheapest search is greedy: at each fork, take the child the scorer likes best. Watch it on this tree — at the very first fork, noise outshouts the truth, greedy turns right, and the correct branch is gone forever.',
  });
  tl.tween(greedyU, 1, { at: 13.7, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 18.5,
    dur: 4.6,
    text: 'Measured over four thousand trees, greedy finds the correct leaf barely eleven percent of the time. One early mistake is fatal, and with six forks, early mistakes are the norm.',
  });
  tl.hold(23.3, 0.6);

  // — Beat 3 · beam recovers ————————————————————————————————————————————
  tl.caption({
    at: 23.9,
    dur: 5.6,
    text: 'Beam search refuses to commit. Keep the four best partial paths alive at every level — the highlighted survivors. On this same tree the correct branch scores quietly at first, but it stays in the beam, and by the bottom it wins.',
  });
  tl.tween(beamU, 1, { at: 24.9, dur: 1.8, ease: ease.draw });
  tl.hold(29.7, 0.6);

  // — Beat 4 · the sweep ————————————————————————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 30.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 30.7,
    dur: 5.4,
    text: 'Sweep the beam width and count everything honestly — successes and nodes expanded. Width one: eleven percent for eighteen nodes. Width four: forty seven percent for sixty. Width sixteen: seventy seven percent for one eighty three.',
  });
  tl.tween(axU, 1, { at: 31.3, dur: 1.2, ease: ease.draw });
  tl.tween(sweepU, WIDTHS.length - 1, { at: 33.1, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 36.5,
    dur: 5.2,
    text: 'That is the search curve: accuracy bought with compute, paid in expanded nodes. The scorer never got smarter — we just stopped letting one noisy opinion kill the right path.',
  });
  tl.hold(41.9, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 44.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.3,
    dur: 5.6,
    text: 'Sampling, voting, grading, searching — every chapter so far spends more inference to buy more accuracy. The last chapter asks the economic question: how does that spending scale, and when is it cheaper than training a bigger model?',
  });
  tl.hold(50.1, 1.2);

  return { tl, cam, treeU, greedyU, beamU, axU, sweepU, dimU, endU };
}
