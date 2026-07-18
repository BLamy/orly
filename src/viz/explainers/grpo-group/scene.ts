import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * GRPO at Toy Scale — the group-relative advantage, actually computed.
 *
 * The published GRPO trick (DeepSeekMath / DeepSeek-R1): sample a GROUP of
 * completions per prompt, score each with the verifier, and use
 * A_i = (r_i - mean(r)) / std(r) as the advantage — no value network.
 *
 * A real run at module scope on the same 12-strategy verifier bandit as the
 * previous chapter: groups of 8, standardized advantages, exact softmax
 * policy-gradient updates. The showcased group is the run's real step 5:
 * rewards [0,0,0,0,1,0,0,0], mean 0.125, std 0.331, so the one passer gets
 * advantage +2.645 and each failure -0.378. Over 300 steps the expected pass
 * rate climbs 0.315 → 0.846 with 99% of mass on the best strategy.
 */

export const P_PASS = [0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.28, 0.35, 0.45, 0.55, 0.7, 0.85];
export const K = P_PASS.length;
export const G = 8;
export const T_STEPS = 300;
const LR = 0.35;
const EPS = 1e-4;

export interface Snap {
  step: number;
  pi: number[];
  expPass: number;
}
export interface Group {
  acts: number[];
  rs: number[];
  mean: number;
  sd: number;
  advs: number[];
}
export const HIST: Snap[] = [];
export let SHOWCASE: Group = { acts: [], rs: [], mean: 0, sd: 0, advs: [] };
(() => {
  const softmax = (th: number[]): number[] => {
    const m = Math.max(...th);
    const e = th.map((x) => Math.exp(x - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  };
  const rand = mulberry32(33);
  let theta = new Array(K).fill(0) as number[];
  for (let t = 0; t <= T_STEPS; t++) {
    const pi = softmax(theta);
    const expPass = pi.reduce((a, p, i) => a + p * P_PASS[i], 0);
    HIST.push({ step: t, pi: [...pi], expPass });
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
      rs.push(rand() < P_PASS[a] ? 1 : 0);
    }
    const mean = rs.reduce((a, b) => a + b, 0) / G;
    const sd = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / G);
    const advs = rs.map((r) => (sd > 0 ? (r - mean) / (sd + EPS) : 0));
    if (t === 5) SHOWCASE = { acts: [...acts], rs: [...rs], mean, sd, advs: [...advs] };
    const grad = new Array(K).fill(0) as number[];
    for (let b = 0; b < G; b++)
      for (let j = 0; j < K; j++) grad[j] += advs[b] * ((j === acts[b] ? 1 : 0) - pi[j]);
    theta = theta.map((x, j) => x + (LR * grad[j]) / G);
  }
})();
export const START = HIST[0];
export const FINAL = HIST[HIST.length - 1];

export function snapAt(u: number): Snap {
  const s = Math.max(0, Math.min(T_STEPS, u));
  const i = Math.floor(s);
  const j = Math.min(T_STEPS, i + 1);
  const f = s - i;
  const a = HIST[i];
  const b = HIST[j];
  return {
    step: s,
    pi: a.pi.map((v, k) => v + f * (b.pi[k] - v)),
    expPass: a.expPass + f * (b.expPass - a.expPass),
  };
}

// ---------------------------------------------------------------------------
// Layout — prompt + group column left, advantage panel mid, curve right.
// ---------------------------------------------------------------------------

export const GRP_X = 200;
export const GRP_Y0 = 128;
export const GRP_DY = 54;
export const grpY = (i: number): number => GRP_Y0 + i * GRP_DY;

export const ADV_X = 470; // advantage arrows origin

export const CH_X0 = 720;
export const CH_X1 = 1190;
export const CH_Y0 = 500;
export const CH_H = 330;
export const chX = (step: number): number => CH_X0 + (step / T_STEPS) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_GROUP: CameraState = { x: 400, y: 330, k: 1.25 };
export const CAM_CURVE: CameraState = { x: 930, y: 330, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  grpU: ChannelRef<number>; // group cards stagger in
  rwU: ChannelRef<number>; // rewards stamp on
  statU: ChannelRef<number>; // mean/std panel
  advU: ChannelRef<number>; // advantage arrows
  mathU: ChannelRef<number>;
  axU: ChannelRef<number>;
  train: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const grpU = tl.channel('grpU', 0);
  const rwU = tl.channel('rwU', 0);
  const statU = tl.channel('statU', 0);
  const advU = tl.channel('advU', 0);
  const mathU = tl.channel('mathU', 0);
  const axU = tl.channel('axU', 0);
  const train = tl.channel('train', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the problem GRPO solves ——————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Classic policy optimization needs a second network — a critic — just to judge how good each attempt was compared to expectations. Group relative policy optimization deletes the critic with one move: compare attempts to each other.',
  });
  tl.tween(cam, CAM_GROUP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.3, 0.4);

  // — Beat 2 · sample a group ———————————————————————————————————————————
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'For one prompt, sample a whole group of completions — here eight, drawn from our real training run at step five. Then run the verifier on every single one.',
  });
  tl.tween(grpU, 1, { at: 7.1, dur: 1.6, ease: ease.enter });
  tl.tween(rwU, 1, { at: 10.3, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 12.1,
    dur: 4.6,
    text: 'One passes. Seven fail. The group itself is now the measuring stick: its mean reward is zero point one two five, its standard deviation zero point three three.',
  });
  tl.tween(statU, 1, { at: 13.5, dur: 0.8, ease: ease.enter });
  tl.hold(16.9, 0.6);

  // — Beat 3 · the advantage ————————————————————————————————————————————
  tl.caption({
    at: 17.5,
    dur: 5.8,
    text: 'Each completion is scored against its own group: reward minus the group mean, divided by the group spread. The lone passer earns an advantage of plus two point six five. Every failure gets minus zero point three eight.',
    tex: 'A_i = \\frac{r_i - \\bar r}{\\sigma_r}',
  });
  tl.tween(mathU, 1, { at: 18.3, dur: 0.7, ease: ease.enter });
  tl.tween(advU, 1, { at: 19.5, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 23.5,
    dur: 5.4,
    text: 'Notice the elegance. If everyone in the group fails, nobody is punished — there is nothing to learn from a uniformly hopeless batch. The gradient only flows where the group disagrees with itself.',
  });
  tl.hold(29.1, 0.6);

  // — Beat 4 · train with it ————————————————————————————————————————————
  tl.tween(cam, CAM_CURVE, { at: 29.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 30.1,
    dur: 5.2,
    text: 'Plug that advantage into the policy gradient and run it for real: three hundred steps, groups of eight, every reward rolled against the true pass rates. No critic anywhere in the loop.',
  });
  tl.tween(axU, 1, { at: 30.7, dur: 1.2, ease: ease.draw });
  tl.tween(train, T_STEPS, { at: 35.5, dur: 7.0, ease: ease.move });
  tl.caption({
    at: 35.5,
    dur: 5.4,
    text: 'The pass rate climbs from thirty one and a half percent to eighty four point six, and ninety nine percent of the probability ends on the best strategy — faster than the plain baseline run of the last chapter.',
  });
  tl.hold(41.1, 0.6);

  // — Beat 5 · why it matters at frontier scale —————————————————————————
  tl.caption({
    at: 41.7,
    dur: 5.6,
    text: 'At frontier scale this is the published recipe behind the reasoning models: the critic network you no longer train is as big as the policy itself, and the group statistics come almost free — you wanted many samples anyway.',
  });
  tl.hold(47.5, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.7, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 48.7, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.9,
    dur: 5.4,
    text: 'One prompt, one group, one standardized comparison — that is the whole update. But everything still rests on the verifier telling the truth. Next chapter, we attack it.',
  });
  tl.hold(55.5, 1.2);

  return { tl, cam, grpU, rwU, statU, advU, mathU, axU, train, dimU, endU };
}
