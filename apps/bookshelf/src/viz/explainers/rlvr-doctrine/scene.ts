import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Doctrine — one knob decides everything: how gameable is the check?
 *
 * A real experiment at module scope: the same GRPO trainer from this book,
 * with one exploit strategy whose verifier pass rate ("gameability") we sweep
 * from 0.05 to 1.0 while its TRUE success stays 3%. For each setting we train
 * 300 steps (seed 41) and measure final true accuracy. Result: a cliff.
 * Below gameability ≈ 0.83 training ignores the exploit and lands at ~0.845
 * true accuracy; above it, the exploit swallows the policy and truth
 * collapses to ~0.04. The threshold sits at the best honest strategy's own
 * pass rate (0.85): the check must be harder to game than the task is to
 * solve. The same doctrine as adversarial verification in the loop books —
 * here enforced by gradients instead of a red team.
 */

const HONEST = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85];
const K = HONEST.length + 1;
const G = 8;
const T = 300;
const LR = 0.35;
const EPS = 1e-4;

function finalTruth(game: number): { truth: number; cheat: number } {
  const pV = [...HONEST, game];
  const pT = [...HONEST, 0.03];
  const softmax = (th: number[]): number[] => {
    const m = Math.max(...th);
    const e = th.map((x) => Math.exp(x - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  };
  const rand = mulberry32(41);
  let theta = new Array(K).fill(0) as number[];
  for (let t = 0; t < T; t++) {
    const pi = softmax(theta);
    const acts: number[] = [];
    const rs: number[] = [];
    for (let b = 0; b < G; b++) {
      const u = rand();
      let a = K - 1;
      let c = 0;
      for (let i = 0; i < K; i++) {
        c += pi[i];
        if (u < c) {
          a = i;
          break;
        }
      }
      acts.push(a);
      rs.push(rand() < pV[a] ? 1 : 0);
    }
    const mean = rs.reduce((a, b) => a + b, 0) / G;
    const sd = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / G);
    const advs = rs.map((r) => (sd > 0 ? (r - mean) / (sd + EPS) : 0));
    const grad = new Array(K).fill(0) as number[];
    for (let b = 0; b < G; b++)
      for (let j = 0; j < K; j++) grad[j] += advs[b] * ((j === acts[b] ? 1 : 0) - pi[j]);
    theta = theta.map((x, j) => x + (LR * grad[j]) / G);
  }
  const pi = softmax(theta);
  return { truth: pi.reduce((a, p, i) => a + p * pT[i], 0), cheat: pi[K - 1] };
}

export const GAMES = [0.05, 0.2, 0.4, 0.6, 0.7, 0.8, 0.82, 0.84, 0.85, 0.86, 0.88, 0.9, 0.95, 1.0];
export const SWEEP = GAMES.map((g) => ({ game: g, ...finalTruth(g) }));
export const SAFE = SWEEP[0]; // truth ≈ 0.846
export const BROKEN = SWEEP[SWEEP.length - 1]; // truth ≈ 0.033
export const CEIL = 0.85; // best honest strategy's pass rate

// ---------------------------------------------------------------------------
// Layout — cliff chart center-left, verifier ladder right.
// ---------------------------------------------------------------------------

export const CH_X0 = 130;
export const CH_X1 = 660;
export const CH_Y0 = 500;
export const CH_H = 340;
export const chX = (g: number): number => CH_X0 + g * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const LAD_X = 790;
export const LAD_Y0 = 130;
export const LAD_DY = 78;
export const LADDER = [
  { label: 'preference model', note: 'flattery works', bad: true },
  { label: 'a few public tests', note: 'memorize the outputs', bad: true },
  { label: 'hidden held-out tests', note: 'must generalize', bad: false },
  { label: 'property + fuzz tests', note: 'must be right in general', bad: false },
  { label: 'proof checker / typechecker', note: 'must be right, period', bad: false },
];

export const CAM_CHART: CameraState = { x: 400, y: 330, k: 1.2 };
export const CAM_LADDER: CameraState = { x: 890, y: 320, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axU: ChannelRef<number>;
  sweepU: ChannelRef<number>; // 0..SWEEP.length-1 draw
  cliffU: ChannelRef<number>; // mark the threshold
  ladU: ChannelRef<number>; // ladder stagger
  loopU: ChannelRef<number>; // doctrine bridge banner
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axU = tl.channel('axU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const cliffU = tl.channel('cliffU', 0);
  const ladU = tl.channel('ladU', 0);
  const loopU = tl.channel('loopU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the one-knob experiment ——————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Let us compress this whole book into one experiment. Same trainer, same honest strategies, one exploit whose true success is fixed at three percent. The only knob: how often the exploit fools the verifier.',
  });
  tl.tween(cam, CAM_CHART, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(axU, 1, { at: 1.4, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 6.5,
    dur: 5.2,
    text: 'For fourteen settings of that knob we run the full three hundred steps of training and measure what the final policy truly achieves. Every point on this curve is a complete, genuinely simulated training run.',
  });
  tl.tween(sweepU, SWEEP.length - 1, { at: 7.5, dur: 7.0, ease: ease.move });
  tl.hold(12.3, 0.5);

  // — Beat 2 · the cliff ———————————————————————————————————————————————
  tl.caption({
    at: 12.8,
    dur: 5.6,
    text: 'It is not a slope. It is a cliff. While the exploit fools the verifier less often than the best honest strategy passes it — eighty five percent — training simply ignores the exploit and lands at eighty four percent true accuracy.',
  });
  tl.tween(cliffU, 1, { at: 14.2, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 18.8,
    dur: 5.2,
    text: 'The moment cheating becomes easier than solving, the policy flips almost entirely to the exploit and true accuracy collapses to four percent. There is no graceful middle. The gradient takes the easiest hill, whichever it is.',
  });
  tl.hold(24.2, 0.6);

  // — Beat 3 · the ladder ———————————————————————————————————————————————
  tl.tween(cam, CAM_LADDER, { at: 24.8, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 25.2,
    dur: 5.4,
    text: 'So the craft of verifiable rewards is climbing this ladder. A preference model falls to flattery. A few public tests fall to memorization. Hidden tests force generalization. Property tests force correctness in general.',
  });
  tl.tween(ladU, 1, { at: 25.8, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 31.0,
    dur: 5.0,
    text: 'And at the top, checks that are essentially ungameable: a proof checker or a type system, where passing is the same event as being right. The higher your rung, the harder you can safely push.',
  });
  tl.hold(36.2, 0.6);

  // — Beat 4 · the bridge ——————————————————————————————————————————————
  tl.caption({
    at: 36.8,
    dur: 5.8,
    text: 'If this sounds familiar, it should. It is the same doctrine the agent loop books preach at run time: never trust the claim, run the check, and make the check harder to game than the task. Verifiable rewards apply it at training time.',
  });
  tl.tween(loopU, 1, { at: 38.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 42.8,
    dur: 5.2,
    text: 'The difference is scale. A red team probes a system a few times. A gradient probes the verifier millions of times, and it will find any gap you left. Training against a check is the strongest audit that check will ever face.',
  });
  tl.hold(48.2, 0.6);

  // — Beat 5 · recap + close ————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.4, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.6,
    dur: 6.0,
    text: 'The journey: preference judges get sweet talked, executable checks do not. A policy can climb on bare pass or fail. The group is its own critic. And the verifier is the new attack surface — so build the check harder to game than the task.',
  });
  tl.hold(56.8, 1.2);

  return { tl, cam, axU, sweepU, cliffU, ladU, loopU, dimU, endU };
}
