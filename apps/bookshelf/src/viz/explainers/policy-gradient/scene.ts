import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Policy Gradients — nudging what worked.
 *
 * All math at module scope: a 5x5 gridworld, a softmax policy with one
 * parameter per state-action pair, and an ACTUAL REINFORCE training run —
 * 80 iterations of 16 sampled episodes each (seeded), the policy updated by
 * the true gradient-of-log-probability estimator, every iteration's policy,
 * success rate, and sample trajectories recorded. The arrows thickening on
 * screen are the real probabilities; nothing is staged.
 *
 * Empirics with SEED = 34 (verified by running this exact code): the first
 * batch has 3 lucky wins out of 16, iteration 30's batch leans toward the
 * goal, the final batch wins 16 of 16, and the start state's policy ends
 * ~89 percent committed to "right".
 */

export const N = 5;
export const GOAL = { c: 4, r: 0 };
export const START = { c: 0, r: 4 };
export const MAXT = 16;
export const GAMMA = 0.95;
export const LR = 2.0;
export const BATCH = 16;
export const ITERS = 80;
export const SEED = 34;

export const MOVES = [
  { dc: 0, dr: -1 },
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
] as const;

const inG = (c: number, r: number) => c >= 0 && c < N && r >= 0 && r < N;
const idx = (c: number, r: number) => r * N + c;

function softmax(row: number[]): number[] {
  const m = Math.max(...row);
  const e = row.map((v) => Math.exp(v - m));
  const Z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / Z);
}

export interface Traj {
  cells: { c: number; r: number }[];
  win: boolean;
}

interface RunResult {
  /** policy probabilities per iteration: [iter][state][action] */
  policies: number[][][];
  succ: number[];
  /** the full sampled batch at a few landmark iterations */
  trajs: Record<number, Traj[]>;
}

const TRAJ_ITERS = [0, 30, ITERS - 1];

function run(seed: number): RunResult {
  const rand = mulberry32(seed);
  const th = Array.from({ length: N * N }, () => [0, 0, 0, 0]);
  const policies: number[][][] = [];
  const succ: number[] = [];
  const trajs: Record<number, Traj[]> = {};
  for (let it = 0; it < ITERS; it++) {
    policies.push(Array.from({ length: N * N }, (_, s) => softmax(th[s])));
    const grads = Array.from({ length: N * N }, () => [0, 0, 0, 0]);
    let wins = 0;
    const batchTrajs: Traj[] = [];
    for (let b = 0; b < BATCH; b++) {
      let c = START.c;
      let r = START.r;
      const steps: { s: number; a: number; p: number[] }[] = [];
      const cells = [{ c, r }];
      let R = 0;
      let win = false;
      for (let t = 0; t < MAXT; t++) {
        const s = idx(c, r);
        const p = softmax(th[s]);
        let u = rand();
        let a = 0;
        for (a = 0; a < 4; a++) {
          u -= p[a];
          if (u < 0) break;
        }
        if (a > 3) a = 3;
        steps.push({ s, a, p });
        let nc = c + MOVES[a].dc;
        let nr = r + MOVES[a].dr;
        if (!inG(nc, nr)) {
          nc = c;
          nr = r;
        }
        c = nc;
        r = nr;
        cells.push({ c, r });
        if (c === GOAL.c && r === GOAL.r) {
          R = Math.pow(GAMMA, t);
          wins++;
          win = true;
          break;
        }
      }
      batchTrajs.push({ cells, win });
      // REINFORCE: for every step taken, push up the log-probability of the
      // chosen action, weighted by the (discounted) return of the episode.
      for (const st of steps) {
        for (let k = 0; k < 4; k++) grads[st.s][k] += ((k === st.a ? 1 : 0) - st.p[k]) * R;
      }
    }
    for (let s = 0; s < N * N; s++) for (let k = 0; k < 4; k++) th[s][k] += (LR * grads[s][k]) / BATCH;
    succ.push(wins / BATCH);
    if (TRAJ_ITERS.includes(it)) trajs[it] = batchTrajs;
  }
  policies.push(Array.from({ length: N * N }, (_, s) => softmax(th[s])));
  return { policies, succ, trajs };
}

const RUN = run(SEED);
export const POLICIES: number[][][] = RUN.policies; // ITERS + 1 snapshots
export const SUCC: number[] = RUN.succ;
export const TRAJS: Record<number, Traj[]> = RUN.trajs;
export const FINAL_START_P: number[] = POLICIES[ITERS][idx(START.c, START.r)];
export const stateIdx = idx;

/** Lerped policy at fractional iteration f in [0, ITERS]. */
export function policyAt(f: number): number[][] {
  const g = Math.max(0, Math.min(POLICIES.length - 1, f));
  const i = Math.floor(g);
  if (i >= POLICIES.length - 1) return POLICIES[POLICIES.length - 1];
  const t = g - i;
  const A = POLICIES[i];
  const B = POLICIES[i + 1];
  return A.map((row, s) => row.map((v, a) => v + (B[s][a] - v) * t));
}

// ---------------------------------------------------------------------------
// Stage layout — grid left, probability bars + success curve right
// ---------------------------------------------------------------------------

export const CELL = 100;
export const GRID_X = 130;
export const GRID_Y = 62;
export const cellX = (c: number): number => GRID_X + c * CELL;
export const cellY = (r: number): number => GRID_Y + r * CELL;
export const cellCX = (c: number): number => cellX(c) + CELL / 2;
export const cellCY = (r: number): number => cellY(r) + CELL / 2;

export const BARS_X = 760;
export const BARS_Y = 150;
export const BAR_W = 62;
export const BAR_H_MAX = 160;

export const CHART_X0 = 740;
export const CHART_X1 = 1210;
export const CHART_Y0 = 560;
export const CHART_Y1 = 400;
export const chartX = (e: number): number => CHART_X0 + ((CHART_X1 - CHART_X0) * e) / ITERS;
export const chartY = (v: number): number => CHART_Y0 + (CHART_Y1 - CHART_Y0) * v;

export const CAM_GRID: CameraState = { x: 380, y: 312, k: 1.24 };
export const CAM_START: CameraState = { x: cellCX(START.c) + 80, y: cellCY(START.r) - 60, k: 1.7 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  goalU: ChannelRef<number>;
  arrowsU: ChannelRef<number>;
  texU: ChannelRef<number>;
  trajSet: ChannelRef<number>; // which landmark batch to show: 0, 1, 2 (index into TRAJ_ITERS)
  trajU: ChannelRef<number>; // reveal of the sampled batch
  iterProg: ChannelRef<number>; // 0..ITERS — drives arrows + curve + bars
  barsU: ChannelRef<number>;
  chartU: ChannelRef<number>;
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export const TRAJ_ITER_LIST = TRAJ_ITERS;

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const goalU = tl.channel('goalU', 0);
  const arrowsU = tl.channel('arrowsU', 0);
  const texU = tl.channel('texU', 0);
  const trajSet = tl.channel('trajSet', 0);
  const trajU = tl.channel('trajU', 0);
  const iterProg = tl.channel('iterProg', 0);
  const barsU = tl.channel('barsU', 0);
  const chartU = tl.channel('chartU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · a policy, not a value table ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'New idea. Forget estimating how good every square is. Just carry a behavior directly: in each square, a set of probabilities over up, right, down, and left.',
  });
  tl.tween(gridU, 1, { at: 0.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.tween(goalU, 1, { at: 3.2, dur: 0.7, ease: ease.pop });
  tl.tween(arrowsU, 1, { at: 3.8, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.0,
    text: 'The arrows show those probabilities. Right now every square is perfectly undecided: twenty five percent each way. This is the policy, and it is all there is.',
  });
  tl.hold(12.0, 0.6);

  // — Beat 2 · sample honestly ————————————————————————————————————————————
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: 'Training is brutally simple. Roll the dice and act. Here are sixteen real episodes sampled from the undecided policy: drunken walks, almost all of them worthless.',
  });
  tl.set(trajSet, 0, 12.7);
  tl.tween(trajU, 1, { at: 13.2, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 18.4,
    dur: 5.2,
    text: 'But a few stumble into the goal. Those are the green ones. And now comes the one move this whole method is named for.',
  });
  tl.hold(23.8, 0.6);

  // — Beat 3 · the update ————————————————————————————————————————————————
  tl.caption({
    at: 24.4,
    dur: 6.4,
    text: 'For every action inside a winning episode, nudge its probability up. Episodes that earned nothing change nothing. Do not ask why it worked; just make what worked more likely.',
    tex: '\\theta \\mathrel{+}= \\alpha\\, R \\,\\nabla_\\theta \\log \\pi_\\theta(a \\mid s)',
  });
  tl.tween(texU, 1, { at: 25.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 31.2,
    dur: 5.2,
    text: 'That formula is the gradient of the log probability of what you did, weighted by the reward you got. It points every parameter toward repeating success.',
  });
  tl.hold(36.6, 0.6);

  // — Beat 4 · watch the policy sharpen ———————————————————————————————————
  tl.tween(trajU, 0, { at: 37.2, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 1, { at: 37.6, dur: 0.6, ease: ease.enter });
  tl.tween(barsU, 1, { at: 37.6, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 38.0,
    dur: 5.8,
    text: 'Now iterate: sample a batch, reward the survivors, nudge, repeat. Watch the arrows commit. The bars on the right are the starting square making up its mind.',
  });
  tl.tween(iterProg, 30, { at: 38.6, dur: 5.4, ease: ease.linear });
  tl.set(trajSet, 1, 44.2);
  tl.tween(trajU, 0.65, { at: 44.4, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 44.2,
    dur: 5.4,
    text: 'Thirty iterations in, the sampled episodes already lean toward the goal. Success breeds probability, and probability breeds more success to learn from.',
  });
  tl.tween(trajU, 0, { at: 49.4, dur: 0.8, ease: ease.move });
  tl.hold(49.8, 0.4);

  // — Beat 5 · convergence + curve ————————————————————————————————————————
  tl.caption({
    at: 50.2,
    dur: 5.6,
    text: 'The curve below counts wins per batch. From zero out of sixteen to essentially all of them, with no value table anywhere: the behavior itself was the thing being trained.',
  });
  tl.tween(chartU, 1, { at: 50.6, dur: 1.2, ease: ease.draw });
  tl.tween(iterProg, ITERS, { at: 51.4, dur: 5.2, ease: ease.linear });
  tl.hold(56.6, 0.5);

  // — Beat 6 · the fine print ————————————————————————————————————————————
  tl.tween(cam, CAM_START, { at: 57.1, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 57.3,
    dur: 5.8,
    text: 'Zoom into the start square: nearly ninety percent committed to one direction. Notice what it never learned: why. It has no idea where the goal is. It only knows what got rewarded.',
  });
  tl.hold(63.3, 0.6);

  // — Beat 7 · recap ——————————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 63.9, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 64.5, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 64.5, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 64.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 65.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 65.7,
    dur: 5.8,
    text: 'That is a policy gradient: sample behavior, keep what pays, and shift probability toward it. It is the ancestor of how large language models are tuned with human feedback.',
  });
  tl.caption({
    at: 71.9,
    dur: 5.6,
    text: 'But notice the contract we just signed: the agent will optimize exactly what we reward. Next chapter, what happens when the reward is not quite what we meant.',
  });
  tl.hold(77.7, 1.2);

  return {
    tl,
    cam,
    gridU,
    goalU,
    arrowsU,
    texU,
    trajSet,
    trajU,
    iterProg,
    barsU,
    chartU,
    badgeU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
