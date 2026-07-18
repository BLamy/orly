import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Process vs Outcome — grading the steps, not just the answer.
 *
 * A real simulation at module scope, in the spirit of the published
 * process-supervision results (our own toy numbers, honestly labeled). Chains
 * of 5 reasoning steps: each step is correct with probability 0.8 given a
 * correct prefix; once a chain breaks it stays broken — but a broken chain
 * still lands the right final ANSWER by luck 20% of the time (guessy
 * arithmetic). Two judges pick the best of N chains:
 *  - outcome judge (ORM): noisy score of whether the final answer matches;
 *  - process judge (PRM): noisy score per STEP, chain score = the minimum.
 * Selection quality = how often the chosen chain is TRULY solid (all steps
 * right). 4000 seeded trials per N: base rate ~32%; ORM plateaus ~70%
 * (it cannot tell luck from logic); PRM reaches 99.9% by N=128.
 */

export const L = 5;
const S_STEP = 0.8;
const LUCK = 0.2;
const NOISE = 0.35;

export interface ChainRec {
  ok: number[];
  solid: boolean;
  ansOK: boolean;
}
export const NS = [1, 2, 4, 8, 16, 32, 64, 128] as const;
export interface CurvePt {
  n: number;
  orm: number;
  prm: number;
}
export const CURVE: CurvePt[] = [];
export let SHOW: { chains: ChainRec[]; ormPickIdx: number; prmPickIdx: number } = {
  chains: [],
  ormPickIdx: 0,
  prmPickIdx: 0,
};
(() => {
  const rand = mulberry32(13);
  const g = gaussian(rand);
  const mkChain = (): ChainRec => {
    const ok: number[] = [];
    let alive = true;
    for (let i = 0; i < L; i++) {
      if (alive && rand() < S_STEP) ok.push(1);
      else {
        ok.push(0);
        alive = false;
      }
    }
    const solid = ok[L - 1] === 1;
    return { ok, solid, ansOK: solid || rand() < LUCK };
  };
  for (const N of NS) {
    const runs = 4000;
    let orm = 0;
    let prm = 0;
    for (let k = 0; k < runs; k++) {
      let bo = -1e9;
      let boS = 0;
      let bp = -1e9;
      let bpS = 0;
      for (let j = 0; j < N; j++) {
        const c = mkChain();
        const oScore = (c.ansOK ? 1 : 0) + NOISE * g();
        const pScore = Math.min(...c.ok.map((st) => st + NOISE * g()));
        if (oScore > bo) {
          bo = oScore;
          boS = c.solid ? 1 : 0;
        }
        if (pScore > bp) {
          bp = pScore;
          bpS = c.solid ? 1 : 0;
        }
      }
      orm += boS;
      prm += bpS;
    }
    CURVE.push({ n: N, orm: orm / runs, prm: prm / runs });
  }
  // showcased pool of 6 chains: deterministic, must contain a lucky one
  const r2 = mulberry32(223);
  const g2 = gaussian(r2);
  const chains: ChainRec[] = [];
  for (let j = 0; j < 6; j++) {
    const ok: number[] = [];
    let alive = true;
    for (let i = 0; i < L; i++) {
      if (alive && r2() < S_STEP) ok.push(1);
      else {
        ok.push(0);
        alive = false;
      }
    }
    const solid = ok[L - 1] === 1;
    chains.push({ ok, solid, ansOK: solid || r2() < LUCK });
  }
  let bo = -1e9;
  let boI = 0;
  let bp = -1e9;
  let bpI = 0;
  chains.forEach((c, i) => {
    const oScore = (c.ansOK ? 1 : 0) + NOISE * g2();
    const pScore = Math.min(...c.ok.map((st) => st + NOISE * g2()));
    if (oScore > bo) {
      bo = oScore;
      boI = i;
    }
    if (pScore > bp) {
      bp = pScore;
      bpI = i;
    }
  });
  SHOW = { chains, ormPickIdx: boI, prmPickIdx: bpI };
})();
export const FINAL = CURVE[CURVE.length - 1];
export const BASE = 0.33; // 0.8^5 ≈ 0.328, the solid-chain base rate

// ---------------------------------------------------------------------------
// Layout — chain pool left (6 rows × 5 step cells), curves right.
// ---------------------------------------------------------------------------

export const POOL_X0 = 130;
export const POOL_Y0 = 140;
export const POOL_DY = 66;
export const CELL_W = 52;
export const CELL_H = 30;
export const cellX = (stp: number): number => POOL_X0 + stp * (CELL_W + 8);
export const poolY = (row: number): number => POOL_Y0 + row * POOL_DY;

export const CH_X0 = 660;
export const CH_X1 = 1180;
export const CH_Y0 = 505;
export const CH_H = 350;
export const chX = (i: number): number => CH_X0 + (i / (NS.length - 1)) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_POOL: CameraState = { x: 350, y: 300, k: 1.25 };
export const CAM_CURVES: CameraState = { x: 890, y: 330, k: 1.12 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  poolU: ChannelRef<number>; // chains stagger in
  ansU: ChannelRef<number>; // final-answer stamps
  ormU: ChannelRef<number>; // outcome pick highlight
  stepU: ChannelRef<number>; // per-step grades wash across
  prmU: ChannelRef<number>; // process pick highlight
  axU: ChannelRef<number>;
  sweepO: ChannelRef<number>;
  sweepP: ChannelRef<number>;
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const poolU = tl.channel('poolU', 0);
  const ansU = tl.channel('ansU', 0);
  const ormU = tl.channel('ormU', 0);
  const stepU = tl.channel('stepU', 0);
  const prmU = tl.channel('prmU', 0);
  const axU = tl.channel('axU', 0);
  const sweepO = tl.channel('sweepO', 0);
  const sweepP = tl.channel('sweepP', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · chains, not answers ——————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'A reasoning model does not emit an answer — it emits a chain of steps, and one bad link breaks everything after it. Here are six real chains from our toy model: each step holds with probability zero point eight.',
  });
  tl.tween(cam, CAM_POOL, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(poolU, 1, { at: 1.4, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'And here is the cruel part: a broken chain still lands the right final answer twenty percent of the time, by luck. Look at the answer stamps — more chains claim the right answer than actually earned it.',
  });
  tl.tween(ansU, 1, { at: 7.5, dur: 1.4, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // — Beat 2 · the outcome judge ————————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.4,
    text: 'An outcome reward model grades only that final stamp. In this pool it picks a chain with the right answer and a broken spine — luck and logic look identical from the outside.',
  });
  tl.tween(ormU, 1, { at: 13.7, dur: 0.9, ease: ease.pop });
  tl.hold(18.3, 0.6);

  // — Beat 3 · the process judge ————————————————————————————————————————
  tl.caption({
    at: 18.9,
    dur: 5.4,
    text: 'A process reward model reads the chain itself and grades every step. Its score for a chain is its weakest link. Wash those grades across the pool and the broken spines light up red exactly where they snapped.',
  });
  tl.tween(stepU, 1, { at: 19.9, dur: 2.0, ease: ease.draw });
  tl.caption({
    at: 24.5,
    dur: 4.6,
    text: 'Now the pick lands on a chain that is solid all the way through. Same pool, same information budget — the judge just read the working instead of the answer.',
    tex: '\\text{score} = \\min_i \\text{PRM}(s_i)',
  });
  tl.tween(prmU, 1, { at: 25.3, dur: 0.9, ease: ease.pop });
  tl.tween(mathU, 1, { at: 25.0, dur: 0.7, ease: ease.enter });
  tl.hold(29.3, 0.6);

  // — Beat 4 · the sweep ————————————————————————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 29.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 30.3,
    dur: 5.2,
    text: 'Measure it properly: four thousand trials at every sample count, both judges equally noisy, and score a pick only if the chosen chain is truly solid. The base rate is about a third.',
  });
  tl.tween(axU, 1, { at: 30.9, dur: 1.2, ease: ease.draw });
  tl.tween(sweepO, NS.length - 1, { at: 35.3, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 35.5,
    dur: 5.4,
    text: 'The outcome judge improves, then hits a ceiling around seventy percent. Push N higher and it just gets more confident about lucky garbage — the pool fills with right-answer wrong-reasoning chains it cannot tell apart.',
  });
  tl.tween(sweepP, NS.length - 1, { at: 41.1, dur: 5.0, ease: ease.move });
  tl.caption({
    at: 41.1,
    dur: 5.2,
    text: 'The process judge keeps climbing: ninety four percent at eight samples, ninety nine point nine at one twenty eight. Grading the steps is what turns more samples into more truth.',
  });
  tl.hold(46.5, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 47.7, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 47.7, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 48.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.9,
    dur: 5.6,
    text: 'This is the shape reported in the published process-supervision studies, recreated on a toy we fully control. And a judge that grades steps invites a bolder idea: do not wait for chains to finish — search over the steps themselves. Next.',
  });
  tl.hold(54.7, 1.2);

  return { tl, cam, poolU, ansU, ormU, stepU, prmU, axU, sweepO, sweepP, mathU, dimU, endU };
}
