import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Reward Hacking — the letter, not the spirit.
 *
 * A REAL misspecified-reward MDP, solved exactly at module scope: a 7x5
 * gridworld where the designer wants the agent to reach a trophy (+10,
 * terminal) and sprinkles two repeatable +1 "shaping" coins near the start
 * to encourage progress. Value iteration (gamma 0.95) computes the true
 * optimal policy for the reward AS WRITTEN — and that optimal policy never
 * touches the trophy: it shuttles between the two coins forever.
 *
 * Empirics (verified by running this exact code): the coin loop is worth
 * 1/(1-gamma) = 20; the trophy, five discounted steps from the start, is
 * worth 10 * gamma^5 ~= 7.7; even the square NEXT to the trophy prefers to
 * walk back to the coins (value 17.1 > 10). 459 sweeps to convergence.
 */

export const COLS = 7;
export const ROWS = 5;
export const GAMMA = 0.95;
export const START = { c: 0, r: 2 };
export const TROPHY = { c: 6, r: 2 };
export const COINS: readonly { c: number; r: number }[] = [
  { c: 1, r: 1 },
  { c: 2, r: 1 },
];
const coinSet = new Set(COINS.map((p) => `${p.c},${p.r}`));
export const isCoin = (c: number, r: number): boolean => coinSet.has(`${c},${r}`);

const inG = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
export const MOVES = [
  { dc: 0, dr: -1 },
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
] as const;

function step(c: number, r: number, m: (typeof MOVES)[number]): { c: number; r: number } {
  const nc = c + m.dc;
  const nr = r + m.dr;
  return inG(nc, nr) ? { c: nc, r: nr } : { c, r };
}

/** Reward for ENTERING a cell, exactly as the designer wrote it. */
const rew = (nc: number, nr: number): number =>
  nc === TROPHY.c && nr === TROPHY.r ? 10 : isCoin(nc, nr) ? 1 : 0;

/** Exact optimal values via value iteration (the trophy is terminal). */
export const V: number[][] = (() => {
  let v = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
  for (let k = 0; k < 2000; k++) {
    const next = v.map((row) => [...row]);
    let d = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c === TROPHY.c && r === TROPHY.r) {
          next[r][c] = 0;
          continue;
        }
        let best = -Infinity;
        for (const m of MOVES) {
          const s2 = step(c, r, m);
          const term = s2.c === TROPHY.c && s2.r === TROPHY.r;
          const val = rew(s2.c, s2.r) + (term ? 0 : GAMMA * v[s2.r][s2.c]);
          if (val > best) best = val;
        }
        next[r][c] = best;
        d = Math.max(d, Math.abs(best - v[r][c]));
      }
    }
    v = next;
    if (d < 1e-10) break;
  }
  return v;
})();

export const V_MAX = Math.max(...V.flat());
export const LOOP_VALUE = 1 / (1 - GAMMA); // 20
export const TROPHY_FROM_START = 10 * Math.pow(GAMMA, 5); // ~7.74

/** The greedy (truly optimal) walk from START — enters the coin loop forever. */
export const OPT_PATH: { c: number; r: number }[] = (() => {
  let cur = { ...START };
  const path = [{ ...cur }];
  for (let i = 0; i < 26; i++) {
    let best = -Infinity;
    let bm: (typeof MOVES)[number] = MOVES[0];
    for (const m of MOVES) {
      const s2 = step(cur.c, cur.r, m);
      const term = s2.c === TROPHY.c && s2.r === TROPHY.r;
      const val = rew(s2.c, s2.r) + (term ? 0 : GAMMA * V[s2.r][s2.c]);
      if (val > best) {
        best = val;
        bm = m;
      }
    }
    cur = step(cur.c, cur.r, bm);
    path.push({ ...cur });
    if (cur.c === TROPHY.c && cur.r === TROPHY.r) break;
  }
  return path;
})();

/** Cumulative score along OPT_PATH (reward as written). */
export const OPT_SCORE: number[] = (() => {
  const out = [0];
  for (let i = 1; i < OPT_PATH.length; i++) out.push(out[i - 1] + rew(OPT_PATH[i].c, OPT_PATH[i].r));
  return out;
})();

/** The path the DESIGNER intended: straight along the middle row. */
export const INTENDED_PATH: { c: number; r: number }[] = Array.from({ length: 7 }, (_, i) => ({
  c: i,
  r: 2,
}));

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const CELL = 104;
export const GRID_X = 190;
export const GRID_Y = 74;
export const cellX = (c: number): number => GRID_X + c * CELL;
export const cellY = (r: number): number => GRID_Y + r * CELL;
export const cellCX = (c: number): number => cellX(c) + CELL / 2;
export const cellCY = (r: number): number => cellY(r) + CELL / 2;

export const CAM_GRID: CameraState = { x: 555, y: 300, k: 1.16 };
export const CAM_COINS: CameraState = { x: cellCX(1.5), y: cellCY(1), k: 1.75 };
export const CAM_TROPHY: CameraState = { x: cellCX(5.4), y: cellCY(2), k: 1.7 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  trophyU: ChannelRef<number>;
  coinsU: ChannelRef<number>;
  intentU: ChannelRef<number>; // the designer's imagined path
  heatU: ChannelRef<number>; // reveal of the true optimal values
  showVals: ChannelRef<number>;
  pathProg: ChannelRef<number>; // 0..OPT_PATH.length-1 — the actual optimal walk
  scoreU: ChannelRef<number>;
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const trophyU = tl.channel('trophyU', 0);
  const coinsU = tl.channel('coinsU', 0);
  const intentU = tl.channel('intentU', 0);
  const heatU = tl.channel('heatU', 0);
  const showVals = tl.channel('showVals', 0);
  const pathProg = tl.channel('pathProg', 0);
  const scoreU = tl.channel('scoreU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the designer's intent ——————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'A designer builds a task. Reach the trophy on the right: ten points, game over. Simple. But sparse rewards are slow to learn from, so they add a helper.',
  });
  tl.tween(gridU, 1, { at: 0.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.tween(trophyU, 1, { at: 2.6, dur: 0.7, ease: ease.pop });
  tl.caption({
    at: 6.3,
    dur: 5.8,
    text: 'Two little coins near the start, worth one point each time you step on them. The idea: reward early progress, keep the agent moving. What could go wrong.',
  });
  tl.tween(coinsU, 1, { at: 6.6, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 12.3,
    dur: 4.4,
    text: 'In the designer’s head, the agent grabs a coin or two on its way and marches to the trophy. That is the spirit of the reward.',
  });
  tl.tween(intentU, 1, { at: 12.6, dur: 2.2, ease: ease.draw });
  tl.hold(16.9, 0.6);

  // — Beat 2 · solve it exactly ———————————————————————————————————————————
  tl.tween(intentU, 0, { at: 17.5, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 17.9,
    dur: 5.8,
    text: 'But the agent never sees the designer’s head. It sees the letter of the reward. So let us do what the agent does: solve for the truly optimal behavior, exactly.',
  });
  tl.tween(heatU, 1, { at: 18.5, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 23.9,
    dur: 5.6,
    text: 'These are the converged values for the reward as written. Look where the heat is. Not at the trophy. It pools around the coins.',
  });
  tl.tween(showVals, 1, { at: 24.5, dur: 0.8, ease: ease.enter });
  tl.hold(29.7, 0.6);

  // — Beat 3 · the math of the exploit —————————————————————————————————————
  tl.tween(cam, CAM_COINS, { at: 30.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 30.5,
    dur: 6.4,
    text: 'Here is why. The coins pay every visit. Shuttle between them and you earn one point per step, forever. Discounted at ninety five percent, that stream is worth twenty.',
    tex: '1 + \\gamma + \\gamma^2 + \\cdots = \\tfrac{1}{1-\\gamma} = 20',
  });
  tl.tween(mathU, 1, { at: 31.3, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 37.1,
    dur: 5.6,
    text: 'The trophy pays ten, once, five discounted steps away: worth about seven point seven from the start. Twenty beats seven point seven. The exploit is not a glitch; it is the correct answer.',
  });
  tl.hold(42.9, 0.6);

  // — Beat 4 · watch the optimal policy ————————————————————————————————————
  tl.tween(cam, CAM_GRID, { at: 43.5, dur: 1.5, ease: ease.move });
  tl.tween(scoreU, 1, { at: 44.1, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 44.3,
    dur: 5.6,
    text: 'So watch the optimal agent play. It walks straight to the coins, and then it circles. And circles. The score climbs, the task never finishes, the trophy gathers dust.',
  });
  tl.tween(pathProg, OPT_PATH.length - 1, { at: 44.9, dur: 9.0, ease: ease.linear });
  tl.caption({
    at: 50.3,
    dur: 5.0,
    text: 'This is reward hacking. The agent is not confused, and it is not broken. It is doing exactly what we asked, which is not what we meant.',
  });
  tl.hold(55.5, 0.5);

  // — Beat 5 · even next to the trophy ————————————————————————————————————
  tl.tween(cam, CAM_TROPHY, { at: 56.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 56.2,
    dur: 6.2,
    text: 'The cruelest detail: stand the agent one step from the trophy, and it still turns around. Ten points now loses to the seventeen the coin loop is worth from here. The math is airtight.',
  });
  tl.hold(62.6, 0.6);

  // — Beat 6 · recap + the moral ———————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 63.2, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 0.15, { at: 63.8, dur: 1.2, ease: ease.move });
  tl.tween(mathU, 0, { at: 63.8, dur: 0.8, ease: ease.move });
  tl.tween(scoreU, 0, { at: 63.8, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 65.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 65.0,
    dur: 6.2,
    text: 'Every measure that stands in for a goal can be gamed, and a strong optimizer will find the gap. Real systems have shown this again and again: boats spinning in circles for points instead of finishing the race.',
  });
  tl.caption({
    at: 71.6,
    dur: 6.0,
    text: 'The lesson of this whole book, sharpened: reinforcement learning gives you exactly the behavior your reward pays for. Writing down what you actually want is the hard part.',
  });
  tl.hold(77.8, 1.2);

  return {
    tl,
    cam,
    gridU,
    trophyU,
    coinsU,
    intentU,
    heatU,
    showVals,
    pathProg,
    scoreU,
    mathU,
    dimU,
    endU,
  };
}

export { STAGE_W, STAGE_H };
