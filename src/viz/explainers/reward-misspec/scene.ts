import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Reward Misspecification — the vase the reward never mentioned.
 *
 * A REAL MDP solved exactly at module scope (value iteration, γ = 0.98):
 * a 7×5 grid, start left, goal right (+10, terminal), a small −0.1 step
 * cost so shorter is better — and a vase standing on the straight-line path.
 * The reward as written says nothing about the vase. Solved exactly, the
 * optimal policy walks straight through it: six steps, vase destroyed,
 * maximum return. Add a −3 vase term and re-solve: the policy detours, two
 * steps longer. Both policies are computed, not staged. The chapter's point
 * (extending the reward-hacking chapter of the reinforcement learning book):
 * an optimizer does exactly and only what the reward pays for — and the
 * world contains more vases than any reward writer can enumerate.
 */

export const COLS = 7;
export const ROWS = 5;
export const GAMMA = 0.98;
export const STEP_COST = -0.1;
export const START = { c: 0, r: 2 };
export const GOAL = { c: 6, r: 2 };
export const VASE = { c: 3, r: 2 };

const MOVES = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

export interface Cell {
  c: number;
  r: number;
}

function solve(vasePenalty: number): { V: number[][]; path: Cell[] } {
  let V = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
  for (let k = 0; k < 600; k++) {
    const nv = V.map((row) => [...row]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c === GOAL.c && r === GOAL.r) {
          nv[r][c] = 0;
          continue;
        }
        let best = -1e9;
        for (const [dc, dr] of MOVES) {
          const nc = Math.max(0, Math.min(COLS - 1, c + dc));
          const nr = Math.max(0, Math.min(ROWS - 1, r + dr));
          const term = nc === GOAL.c && nr === GOAL.r;
          const rew =
            STEP_COST + (term ? 10 : 0) + (nc === VASE.c && nr === VASE.r ? vasePenalty : 0);
          const val = rew + (term ? 0 : GAMMA * V[nr][nc]);
          if (val > best) best = val;
        }
        nv[r][c] = best;
      }
    }
    V = nv;
  }
  let cur: Cell = { ...START };
  const path: Cell[] = [{ ...cur }];
  for (let i = 0; i < 24; i++) {
    let best = -1e9;
    let bm: Cell = cur;
    for (const [dc, dr] of MOVES) {
      const nc = Math.max(0, Math.min(COLS - 1, cur.c + dc));
      const nr = Math.max(0, Math.min(ROWS - 1, cur.r + dr));
      const term = nc === GOAL.c && nr === GOAL.r;
      const rew =
        STEP_COST + (term ? 10 : 0) + (nc === VASE.c && nr === VASE.r ? vasePenalty : 0);
      const val = rew + (term ? 0 : GAMMA * V[nr][nc]);
      if (val > best) {
        best = val;
        bm = { c: nc, r: nr };
      }
    }
    cur = bm;
    path.push({ ...cur });
    if (cur.c === GOAL.c && cur.r === GOAL.r) break;
  }
  return { V, path };
}

/** Solved as written (no vase term): straight through the vase, 6 steps. */
export const AS_WRITTEN = solve(0);
/** Solved with a −3 vase penalty: the 8-step detour. */
export const PATCHED = solve(-3);
export const HITS_VASE = AS_WRITTEN.path.some((p) => p.c === VASE.c && p.r === VASE.r); // true
export const V_MAX = Math.max(...AS_WRITTEN.V.flat());

/** The world's other hazards, for the closing beat (positions only). */
export const OTHER_VASES: Cell[] = [
  { c: 1, r: 0 },
  { c: 5, r: 3 },
  { c: 2, r: 4 },
  { c: 4, r: 0 },
  { c: 6, r: 4 },
  { c: 0, r: 4 },
];

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const CELL = 100;
export const GRID_X = 240;
export const GRID_Y = 80;
export const cellCX = (c: number): number => GRID_X + c * CELL + CELL / 2;
export const cellCY = (r: number): number => GRID_Y + r * CELL + CELL / 2;

export const CAM_GRID: CameraState = { x: 590, y: 320, k: 1.15 };
export const CAM_VASE: CameraState = { x: cellCX(VASE.c), y: cellCY(VASE.r), k: 1.7 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  vaseU: ChannelRef<number>;
  heatU: ChannelRef<number>; // value heat (as-written)
  walk1: ChannelRef<number>; // as-written walk progress
  crashU: ChannelRef<number>; // vase shatters
  penU: ChannelRef<number>; // the patched reward term appears
  walk2: ChannelRef<number>; // patched walk progress
  otherU: ChannelRef<number>; // the world's other vases
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const vaseU = tl.channel('vaseU', 0);
  const heatU = tl.channel('heatU', 0);
  const walk1 = tl.channel('walk1', 0);
  const crashU = tl.channel('crashU', 0);
  const penU = tl.channel('penU', 0);
  const walk2 = tl.channel('walk2', 0);
  const otherU = tl.channel('otherU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a reasonable reward ——————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Alignment starts where the reinforcement learning book left off: the gap between what you wrote and what you meant. Here is a robot, a goal worth ten points, and a small cost per step so it hurries.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 4.6,
    text: 'One detail the reward does not mention: a vase, standing exactly on the shortest path. The designer never imagined it needed mentioning.',
  });
  tl.tween(vaseU, 1, { at: 7.1, dur: 0.8, ease: ease.pop });
  tl.hold(11.3, 0.6);

  // — Beat 2 · solve it exactly ————————————————————————————————————————
  tl.caption({
    at: 11.9,
    dur: 5.4,
    text: 'Solve the task exactly — value iteration to convergence, no approximations. The heat shows the value of standing on every square, under the reward as written.',
    tex: 'r = -0.1 \\text{ per step} + 10 \\text{ at goal}',
  });
  tl.tween(heatU, 1, { at: 12.5, dur: 2.0, ease: ease.draw });
  tl.tween(mathU, 1, { at: 13.1, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 17.7,
    dur: 5.4,
    text: 'Now let the provably optimal policy play. Six steps, dead straight — directly through the vase. Watch.',
  });
  tl.tween(walk1, AS_WRITTEN.path.length - 1, { at: 18.7, dur: 3.6, ease: ease.linear });
  tl.tween(cam, CAM_VASE, { at: 20.0, dur: 1.2, ease: ease.move });
  tl.tween(crashU, 1, { at: 21.0, dur: 0.6, ease: ease.pop });
  tl.caption({
    at: 23.3,
    dur: 5.2,
    text: 'The robot is not malicious and not confused. The vase is simply worth zero, and a detour costs two tenths of a point. Indifference plus optimization equals a broken vase, every single time.',
  });
  tl.hold(28.7, 0.6);

  // — Beat 3 · patch the reward ————————————————————————————————————————
  tl.tween(cam, CAM_GRID, { at: 29.3, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 29.7,
    dur: 5.4,
    text: 'The fix looks easy: write the vase into the reward, minus three for breaking it, and re-solve. The optimal policy now detours — two steps longer, vase intact. Specification works, when you know what to specify.',
    tex: 'r_{\\text{vase}} = -3',
  });
  tl.tween(penU, 1, { at: 30.3, dur: 0.7, ease: ease.enter });
  tl.tween(crashU, 0, { at: 30.3, dur: 0.6, ease: ease.move });
  tl.tween(walk1, 0, { at: 30.5, dur: 0.6, ease: ease.move });
  tl.tween(walk2, PATCHED.path.length - 1, { at: 31.5, dur: 4.0, ease: ease.linear });
  tl.hold(35.7, 0.6);

  // — Beat 4 · the real problem ————————————————————————————————————————
  tl.caption({
    at: 36.3,
    dur: 5.8,
    text: 'But now zoom out to the actual difficulty. The world is full of vases — things you care about that the task description never mentions. Cables, pets, file systems, other people’s time.',
  });
  tl.tween(otherU, 1, { at: 36.9, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 42.3,
    dur: 5.2,
    text: 'You cannot write minus three for everything, because you cannot list everything. Every reward function is a partial description of what you want, and optimization pours pressure into whatever was left out.',
  });
  tl.hold(47.7, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.9, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 48.9, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.1,
    dur: 5.8,
    text: 'That is the alignment problem in one grid: not teaching the machine to optimize, but surviving the fact that it will. The rest of this book is about the machinery we bolt on when the reward cannot say everything.',
  });
  tl.hold(56.1, 1.2);

  return { tl, cam, gridU, vaseU, heatU, walk1, crashU, penU, walk2, otherU, mathU, dimU, endU };
}
