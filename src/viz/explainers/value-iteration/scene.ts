import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Value of a State — value iteration on a real gridworld.
 *
 * All math lives here at module scope: a 6x6 grid with walls, a single
 * reward square, gamma = 0.9, deterministic moves — and ACTUAL value
 * iteration, every sweep recorded until the values stop changing. The
 * animation lerps between recorded sweeps, so the heat you watch spreading
 * from the reward is the true Bellman fixed-point computation, not an effect.
 *
 * Empirics (verified by running this exact code): convergence to under
 * 1e-9 change in N_SWEEPS sweeps; the greedy path from the start corner
 * follows the value gradient around the wall to the goal.
 */

export const COLS = 6;
export const ROWS = 6;
export const GAMMA = 0.9;

/** Wall cells (col, row). A short interior wall the value flow must round. */
export const WALLS: ReadonlySet<string> = new Set(['2,1', '2,2', '2,3', '4,4']);
export const GOAL = { c: 5, r: 0 };
export const START = { c: 0, r: 5 };

const key = (c: number, r: number) => `${c},${r}`;
export const isWall = (c: number, r: number): boolean => WALLS.has(key(c, r));
const inGrid = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !isWall(c, r);

/** The four moves. Bumping a wall or edge leaves you in place. */
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

/** One Bellman backup: V'(s) = max_a [ r(s,a) + gamma V(s') ]; goal is terminal. */
function sweep(V: number[][]): { next: number[][]; delta: number } {
  const next = V.map((row) => [...row]);
  let delta = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isWall(c, r)) continue;
      if (c === GOAL.c && r === GOAL.r) {
        next[r][c] = 0; // terminal — its worth is the reward for ENTERING it
        continue;
      }
      let best = -Infinity;
      for (const m of MOVES) {
        const s2 = step(c, r, m);
        const reward = s2.c === GOAL.c && s2.r === GOAL.r ? 1 : 0;
        const v = reward + GAMMA * (s2.c === GOAL.c && s2.r === GOAL.r ? 0 : V[s2.r][s2.c]);
        if (v > best) best = v;
      }
      next[r][c] = best;
      delta = Math.max(delta, Math.abs(best - V[r][c]));
    }
  }
  return { next, delta };
}

/** Every recorded sweep, from all-zeros to the fixed point. */
export const SWEEPS: number[][][] = (() => {
  let V = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
  const out = [V];
  for (let k = 0; k < 200; k++) {
    const { next, delta } = sweep(V);
    V = next;
    out.push(V);
    if (delta < 1e-9) break;
  }
  return out;
})();

export const N_SWEEPS = SWEEPS.length - 1;
export const V_FINAL = SWEEPS[SWEEPS.length - 1];
export const V_MAX = Math.max(...V_FINAL.flat());

/** Lerped value grid at fractional sweep f in [0, N_SWEEPS]. */
export function valuesAt(f: number): number[][] {
  const g = Math.max(0, Math.min(SWEEPS.length - 1, f));
  const i = Math.floor(g);
  if (i >= SWEEPS.length - 1) return SWEEPS[SWEEPS.length - 1];
  const t = g - i;
  const A = SWEEPS[i];
  const B = SWEEPS[i + 1];
  return A.map((row, r) => row.map((v, c) => v + (B[r][c] - v) * t));
}

/** The greedy action (index into MOVES) under the FINAL values, per cell. */
export const POLICY: (number | null)[][] = V_FINAL.map((row, r) =>
  row.map((_, c) => {
    if (isWall(c, r) || (c === GOAL.c && r === GOAL.r)) return null;
    let best = -Infinity;
    let bestA = 0;
    MOVES.forEach((m, a) => {
      const s2 = step(c, r, m);
      if (s2.c === c && s2.r === r) return; // bumping is never greedy here
      const reward = s2.c === GOAL.c && s2.r === GOAL.r ? 1 : 0;
      const v = reward + GAMMA * (s2.c === GOAL.c && s2.r === GOAL.r ? 0 : V_FINAL[s2.r][s2.c]);
      if (v > best) {
        best = v;
        bestA = a;
      }
    });
    return bestA;
  }),
);

/** The greedy path from START to GOAL under the final values. */
export const PATH: { c: number; r: number }[] = (() => {
  const path = [{ ...START }];
  let cur = { ...START };
  for (let i = 0; i < 40; i++) {
    if (cur.c === GOAL.c && cur.r === GOAL.r) break;
    const a = POLICY[cur.r][cur.c];
    if (a === null) break;
    cur = step(cur.c, cur.r, MOVES[a]);
    path.push({ ...cur });
  }
  return path;
})();

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const CELL = 88;
export const GRID_X = 340; // left edge
export const GRID_Y = 52; // top edge
export const cellX = (c: number): number => GRID_X + c * CELL;
export const cellY = (r: number): number => GRID_Y + r * CELL;
export const cellCX = (c: number): number => cellX(c) + CELL / 2;
export const cellCY = (r: number): number => cellY(r) + CELL / 2;

export const CAM_GOAL: CameraState = { x: cellCX(GOAL.c) - 40, y: cellCY(GOAL.r) + 60, k: 1.7 };
export const CAM_GRID: CameraState = { x: 640, y: 316, k: 1.08 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  goalU: ChannelRef<number>;
  agentU: ChannelRef<number>;
  sweepProg: ChannelRef<number>; // 0..N_SWEEPS — drives the heat
  valTexU: ChannelRef<number>;
  showVals: ChannelRef<number>;
  arrowsU: ChannelRef<number>;
  pathProg: ChannelRef<number>; // 0..PATH.length-1
  sweepBadgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const goalU = tl.channel('goalU', 0);
  const agentU = tl.channel('agentU', 0);
  const sweepProg = tl.channel('sweepProg', 0);
  const valTexU = tl.channel('valTexU', 0);
  const showVals = tl.channel('showVals', 0);
  const arrowsU = tl.channel('arrowsU', 0);
  const pathProg = tl.channel('pathProg', 0);
  const sweepBadgeU = tl.channel('sweepBadgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the world —————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A tiny world: thirty six squares, a few walls, and one square that pays a reward. An agent starts in the far corner and can step up, down, left, or right.',
  });
  tl.tween(gridU, 1, { at: 0.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.tween(goalU, 1, { at: 3.4, dur: 0.7, ease: ease.pop });
  tl.tween(agentU, 1, { at: 4.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'The bandit had one decision. Here, every move changes where you stand, and the reward is many steps away. The question becomes: how good is it to be standing somewhere?',
  });
  tl.hold(12.4, 0.6);

  // — Beat 2 · the definition ————————————————————————————————————————————
  tl.caption({
    at: 13.0,
    dur: 6.2,
    text: 'Call that number the value of a state: the total reward you can still collect from here, if you play well, with faraway reward discounted a little each step.',
    tex: 'V(s) = \\max_a\\,[\\,r + \\gamma\\, V(s\')\\,]',
  });
  tl.tween(valTexU, 1, { at: 14.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 19.6,
    dur: 5.2,
    text: 'That equation is self-referential: a state is worth what its best neighbor is worth, discounted by gamma. So start everything at zero, and just keep applying it.',
  });
  tl.hold(25.0, 0.6);

  // — Beat 3 · sweep one, up close ———————————————————————————————————————
  tl.tween(cam, CAM_GOAL, { at: 25.6, dur: 1.5, ease: ease.move });
  tl.tween(sweepBadgeU, 1, { at: 26.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 26.4,
    dur: 5.4,
    text: 'Sweep one. Only the squares touching the reward change: stepping in pays one, so they light up. Everything further away still believes it is worth nothing.',
  });
  tl.tween(sweepProg, 1, { at: 27.0, dur: 1.6, ease: ease.move });
  tl.tween(showVals, 1, { at: 28.0, dur: 0.6, ease: ease.enter });
  tl.hold(32.0, 0.5);

  // — Beat 4 · sweep two and three ———————————————————————————————————————
  tl.caption({
    at: 32.5,
    dur: 5.8,
    text: 'Sweep two. Now the squares beside them can see value one hop away, worth point nine after discounting. The knowledge spreads outward like heat.',
  });
  tl.tween(sweepProg, 2, { at: 33.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_GRID, { at: 36.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 38.5,
    dur: 4.8,
    text: 'Sweep three, and the wave keeps rolling. Each ring of squares is worth point nine times the ring before it.',
  });
  tl.tween(sweepProg, 3, { at: 39.0, dur: 1.6, ease: ease.move });
  tl.hold(43.5, 0.5);

  // — Beat 5 · run to convergence ————————————————————————————————————————
  tl.caption({
    at: 44.0,
    dur: 6.0,
    text: 'Let it run. Watch the heat pour around the wall: value cannot jump across it, it has to flow the long way, exactly like the agent will have to walk.',
  });
  tl.tween(sweepProg, N_SWEEPS, { at: 44.6, dur: 5.6, ease: ease.move });
  tl.caption({
    at: 50.4,
    dur: 5.2,
    text: 'And then it stops moving. No sweep changes any number anymore. This is the fixed point: every square now agrees with its best neighbor about the future.',
  });
  tl.hold(55.8, 0.6);

  // — Beat 6 · harvest: the policy —————————————————————————————————————————
  tl.caption({
    at: 56.4,
    dur: 5.6,
    text: 'Here is the payoff. Once you know the values, the best strategy is trivial: from every square, just step uphill toward higher value. No planning, no search.',
  });
  tl.tween(showVals, 0, { at: 56.6, dur: 0.8, ease: ease.move });
  tl.tween(arrowsU, 1, { at: 57.4, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 62.4,
    dur: 5.4,
    text: 'Follow the arrows from the start corner, and they thread the wall and walk straight to the reward. The map of values simply is the strategy.',
  });
  tl.tween(pathProg, PATH.length - 1, { at: 63.2, dur: 4.0, ease: ease.linear });
  tl.hold(68.0, 0.6);

  // — Beat 7 · recap ——————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 68.6, dur: 1.2, ease: ease.move });
  tl.tween(valTexU, 0, { at: 68.6, dur: 0.8, ease: ease.move });
  tl.tween(sweepBadgeU, 0, { at: 68.6, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 69.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 69.8,
    dur: 5.8,
    text: 'That is value iteration: start ignorant, let every square repeatedly ask its neighbors what the future is worth, and the answers converge to truth.',
  });
  tl.caption({
    at: 76.0,
    dur: 5.4,
    text: 'One catch: we could only do this because we knew the rules of the world. Next chapter, the agent has to learn these same values by bumping into things.',
  });
  tl.hold(81.6, 1.2);

  return {
    tl,
    cam,
    gridU,
    goalU,
    agentU,
    sweepProg,
    valTexU,
    showVals,
    arrowsU,
    pathProg,
    sweepBadgeU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
