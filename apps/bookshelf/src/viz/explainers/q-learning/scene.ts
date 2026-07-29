import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Q-Learning — learning from the next step.
 *
 * Same 6x6 gridworld as the value-iteration chapter, but now the agent does
 * NOT know the rules. All math at module scope: an ACTUAL tabular Q-learning
 * run (alpha 0.5, gamma 0.9, epsilon 0.2, seeded), every episode recorded —
 * the first episode step by step, a max-Q snapshot after every episode, and
 * the episode lengths. The heat and the learning curve replay that run.
 *
 * Empirics with SEED = 1 (verified by running this exact code): episode 1
 * wanders 38 steps before stumbling into the reward; by the last of
 * N_EPISODES episodes the greedy path is the optimal ten-step route.
 */

export const COLS = 6;
export const ROWS = 6;
export const GAMMA = 0.9;
export const ALPHA = 0.5;
export const EPSILON = 0.2;
export const N_EPISODES = 120;
const MAX_STEPS = 200;

export const WALLS: ReadonlySet<string> = new Set(['2,1', '2,2', '2,3', '4,4']);
export const GOAL = { c: 5, r: 0 };
export const START = { c: 0, r: 5 };

const key = (c: number, r: number) => `${c},${r}`;
export const isWall = (c: number, r: number): boolean => WALLS.has(key(c, r));
const inGrid = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !isWall(c, r);

export const MOVES = [
  { dc: 0, dr: -1 },
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
] as const;

function step(c: number, r: number, m: (typeof MOVES)[number]): { c: number; r: number } {
  const nc = c + m.dc;
  const nr = r + m.dr;
  return inGrid(nc, nr) ? { c: nc, r: nr } : { c, r };
}

export interface Transition {
  c: number;
  r: number;
  a: number;
  reward: number;
  nc: number;
  nr: number;
  /** Q(s,a) before and after this single TD update */
  qBefore: number;
  qAfter: number;
}

interface RunResult {
  ep1: Transition[];
  maxQ: number[][][]; // snapshot after each episode (N_EPISODES + 1 grids, [r][c])
  lengths: number[];
}

function run(seed: number): RunResult {
  const rand = mulberry32(seed);
  const Q = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => [0, 0, 0, 0]));
  const snapshot = () => Q.map((row) => row.map((q) => Math.max(...q)));
  const maxQ: number[][][] = [snapshot()];
  const lengths: number[] = [];
  const ep1: Transition[] = [];
  for (let e = 0; e < N_EPISODES; e++) {
    let c = START.c;
    let r = START.r;
    let steps = 0;
    for (let t = 0; t < MAX_STEPS; t++) {
      let a: number;
      if (rand() < EPSILON) a = Math.floor(rand() * 4);
      else {
        a = 0;
        for (let k = 1; k < 4; k++) if (Q[r][c][k] > Q[r][c][a]) a = k;
      }
      const s2 = step(c, r, MOVES[a]);
      const done = s2.c === GOAL.c && s2.r === GOAL.r;
      const reward = done ? 1 : 0;
      const target = reward + (done ? 0 : GAMMA * Math.max(...Q[s2.r][s2.c]));
      const qBefore = Q[r][c][a];
      Q[r][c][a] = qBefore + ALPHA * (target - qBefore);
      if (e === 0) ep1.push({ c, r, a, reward, nc: s2.c, nr: s2.r, qBefore, qAfter: Q[r][c][a] });
      c = s2.c;
      r = s2.r;
      steps++;
      if (done) break;
    }
    lengths.push(steps);
    maxQ.push(snapshot());
  }
  return { ep1, maxQ, lengths };
}

export const SEED = 1;
const RUN = run(SEED);
export const EP1: Transition[] = RUN.ep1;
export const EP1_LEN = EP1.length;
export const MAXQ: number[][][] = RUN.maxQ;
export const LENGTHS: number[] = RUN.lengths;
export const FINAL_Q_MAX = Math.max(...MAXQ[N_EPISODES].flat());

/** Lerped max-Q grid at fractional episode f in [0, N_EPISODES]. */
export function maxQAt(f: number): number[][] {
  const g = Math.max(0, Math.min(MAXQ.length - 1, f));
  const i = Math.floor(g);
  if (i >= MAXQ.length - 1) return MAXQ[MAXQ.length - 1];
  const t = g - i;
  const A = MAXQ[i];
  const B = MAXQ[i + 1];
  return A.map((row, r) => row.map((v, c) => v + (B[r][c] - v) * t));
}

/** The greedy path under the FINAL Q (10 steps with SEED = 1). */
export const FINAL_PATH: { c: number; r: number }[] = (() => {
  // rebuild final greedy actions from the final max-Q by re-running argmax on Q:
  // we recompute Q by re-running the whole thing — cheaper: re-run run(SEED) is
  // deterministic; instead store the greedy walk directly from a fresh run.
  const rand = mulberry32(SEED);
  const Q = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => [0, 0, 0, 0]));
  for (let e = 0; e < N_EPISODES; e++) {
    let c = START.c;
    let r = START.r;
    for (let t = 0; t < MAX_STEPS; t++) {
      let a: number;
      if (rand() < EPSILON) a = Math.floor(rand() * 4);
      else {
        a = 0;
        for (let k = 1; k < 4; k++) if (Q[r][c][k] > Q[r][c][a]) a = k;
      }
      const s2 = step(c, r, MOVES[a]);
      const done = s2.c === GOAL.c && s2.r === GOAL.r;
      const target = (done ? 1 : 0) + (done ? 0 : GAMMA * Math.max(...Q[s2.r][s2.c]));
      Q[r][c][a] += ALPHA * (target - Q[r][c][a]);
      c = s2.c;
      r = s2.r;
      if (done) break;
    }
  }
  const path = [{ ...START }];
  let cur = { ...START };
  for (let i = 0; i < 40; i++) {
    if (cur.c === GOAL.c && cur.r === GOAL.r) break;
    let a = 0;
    for (let k = 1; k < 4; k++) if (Q[cur.r][cur.c][k] > Q[cur.r][cur.c][a]) a = k;
    cur = step(cur.c, cur.r, MOVES[a]);
    path.push({ ...cur });
  }
  return path;
})();

// ---------------------------------------------------------------------------
// Stage layout — grid left, learning curve right
// ---------------------------------------------------------------------------

export const CELL = 84;
export const GRID_X = 120;
export const GRID_Y = 66;
export const cellX = (c: number): number => GRID_X + c * CELL;
export const cellY = (r: number): number => GRID_Y + r * CELL;
export const cellCX = (c: number): number => cellX(c) + CELL / 2;
export const cellCY = (r: number): number => cellY(r) + CELL / 2;

// learning-curve chart (episode length vs episode)
export const CHART_X0 = 720;
export const CHART_X1 = 1200;
export const CHART_Y0 = 520;
export const CHART_Y1 = 200;
export const chartX = (e: number): number => CHART_X0 + ((CHART_X1 - CHART_X0) * e) / N_EPISODES;
const CHART_LEN_MAX = 100;
export const chartY = (len: number): number =>
  CHART_Y0 + ((CHART_Y1 - CHART_Y0) * Math.min(len, CHART_LEN_MAX)) / CHART_LEN_MAX;

export const CAM_GRID: CameraState = { x: 372, y: 318, k: 1.28 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  goalU: ChannelRef<number>;
  ep1Prog: ChannelRef<number>; // 0..EP1_LEN — episode one, step by step
  flashU: ChannelRef<number>; // TD flash intensity during the slow walk
  epProg: ChannelRef<number>; // 0..N_EPISODES — drives the heat + curve
  tdTexU: ChannelRef<number>;
  chartU: ChannelRef<number>;
  pathProg: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const goalU = tl.channel('goalU', 0);
  const ep1Prog = tl.channel('ep1Prog', 0);
  const flashU = tl.channel('flashU', 0);
  const epProg = tl.channel('epProg', 0);
  const tdTexU = tl.channel('tdTexU', 0);
  const chartU = tl.channel('chartU', 0);
  const pathProg = tl.channel('pathProg', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · same world, no map ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Same world, same walls, same reward. One crucial change: the agent no longer knows the rules. No map, no reward locations, nothing. It can only act and observe.',
  });
  tl.tween(gridU, 1, { at: 0.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.tween(goalU, 1, { at: 3.8, dur: 0.7, ease: ease.pop });
  tl.caption({
    at: 6.6,
    dur: 5.0,
    text: 'Value iteration needed the rulebook to back values up. The trick now is to learn the same numbers from raw experience, one step at a time.',
  });
  tl.hold(11.8, 0.6);

  // — Beat 2 · the TD rule ————————————————————————————————————————————————
  tl.caption({
    at: 12.4,
    dur: 6.6,
    text: 'Here is the whole algorithm. After each step, compare what you believed the move was worth against what you just saw: the reward, plus the discounted value of the best move from wherever you landed.',
    tex: 'Q(s,a) \\mathrel{+}= \\alpha\\,[\\,r + \\gamma \\max_{a\'} Q(s\',a\') - Q(s,a)\\,]',
  });
  tl.tween(tdTexU, 1, { at: 13.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 19.4,
    dur: 4.6,
    text: 'The gap between belief and evidence is the temporal difference error. Nudge the belief halfway toward the evidence, and move on. That is all.',
  });
  tl.hold(24.2, 0.6);

  // — Beat 3 · episode one, honestly awful ————————————————————————————————
  tl.tween(badgeU, 1, { at: 24.6, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 24.8,
    dur: 5.8,
    text: 'Episode one. Every belief starts at zero, so the agent wanders at random. Watch it blunder: nothing lights up, because no step has ever led anywhere valuable.',
  });
  tl.tween(ep1Prog, EP1_LEN * 0.55, { at: 25.4, dur: 5.0, ease: ease.linear });
  tl.caption({
    at: 30.8,
    dur: 5.6,
    text: 'Then, purely by luck, it stumbles into the reward. One single update fires: the square it stepped from now believes that move is worth half a point.',
  });
  tl.tween(ep1Prog, EP1_LEN, { at: 31.2, dur: 4.2, ease: ease.linear });
  tl.tween(flashU, 1, { at: 34.6, dur: 0.5, ease: ease.pop });
  tl.tween(flashU, 0, { at: 36.2, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 36.6,
    dur: 4.6,
    text: 'That is the seed. One square in the whole world now knows something true, learned from a single lucky step.',
  });
  tl.hold(41.4, 0.6);

  // — Beat 4 · knowledge crawls backward ———————————————————————————————————
  tl.caption({
    at: 42.0,
    dur: 6.0,
    text: 'Now run episode after episode. Each time the agent passes near the lit square, the update rule drags a little of its value one step further back along the route.',
  });
  tl.tween(epProg, 12, { at: 42.6, dur: 5.2, ease: ease.linear });
  tl.caption({
    at: 48.2,
    dur: 5.4,
    text: 'This is the same heat you watched value iteration compute, but growing backward from the goal, out of nothing but collisions and luck.',
  });
  tl.tween(epProg, 40, { at: 48.6, dur: 4.8, ease: ease.linear });
  tl.hold(53.8, 0.5);

  // — Beat 5 · the learning curve ——————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 54.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 54.5,
    dur: 5.6,
    text: 'Track how many steps each episode takes. Early episodes wander for dozens of moves. As the value trail hardens, the walks collapse toward the shortest route.',
  });
  tl.tween(chartU, 1, { at: 55.0, dur: 1.4, ease: ease.draw });
  tl.tween(epProg, N_EPISODES, { at: 56.4, dur: 5.4, ease: ease.linear });
  tl.caption({
    at: 60.4,
    dur: 4.8,
    text: 'One hundred twenty episodes in, the exploration dice still roll, but the beliefs have converged. The agent learned the map it was never given.',
  });
  tl.hold(65.4, 0.6);

  // — Beat 6 · harvest the greedy path ————————————————————————————————————
  tl.caption({
    at: 66.0,
    dur: 5.2,
    text: 'Switch exploration off and follow the learned values greedily: ten steps, around the wall, straight to the reward. The optimal route, learned blind.',
  });
  tl.tween(pathProg, FINAL_PATH.length - 1, { at: 66.6, dur: 4.2, ease: ease.linear });
  tl.hold(71.4, 0.6);

  // — Beat 7 · recap ——————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 72.0, dur: 1.2, ease: ease.move });
  tl.tween(tdTexU, 0, { at: 72.0, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 72.0, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 73.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 73.2,
    dur: 6.0,
    text: 'That is Q-learning: trust the difference between what you predicted and what the next step showed you, and let value seep backward from the reward, one bump at a time.',
  });
  tl.caption({
    at: 79.6,
    dur: 5.0,
    text: 'So far we learn values and then act on them. Next, a different lever: skip the values and adjust the behavior itself.',
  });
  tl.hold(84.8, 1.2);

  return {
    tl,
    cam,
    gridU,
    goalU,
    ep1Prog,
    flashU,
    epProg,
    tdTexU,
    chartU,
    pathProg,
    badgeU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
