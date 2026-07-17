import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Best-of-N and Self-Consistency — what more samples actually buy.
 *
 * The same 300-problem toy suite as chapter one (identical seed), now swept
 * for real: for each N in 1..128, draw N genuine samples per problem. Two
 * ways to cash the tickets:
 *  - pass@N (a verifier checks every sample): fraction of problems where at
 *    least one sample is correct — 49.3% at N=1 up to 100% at N=128.
 *  - self-consistency (no verifier — majority vote over final answers, wrong
 *    mass split between a favored "trap" answer and scattered distractors):
 *    climbs to ~68% by N=4 and PLATEAUS there — voting amplifies whatever
 *    answer is most probable, including the trap.
 * 40 seeded runs per N, every sample actually drawn.
 */

export const M = 300;
const rand = mulberry32(5);
export const P: number[] = [];
export const Q: number[] = [];
for (let i = 0; i < M; i++) {
  const u = rand();
  const p = u < 0.25 ? 0.75 + 0.2 * rand() : u < 0.6 ? 0.3 + 0.4 * rand() : 0.05 + 0.25 * rand();
  P.push(p);
  Q.push(0.2 + 0.5 * rand()); // trap answer's share of the wrong mass
}

export const NS = [1, 2, 4, 8, 16, 32, 64, 128] as const;
export interface CurvePt {
  n: number;
  passN: number;
  vote: number;
}
export const CURVE: CurvePt[] = (() => {
  const r2 = mulberry32(9);
  return NS.map((N) => {
    let anyC = 0;
    let maj = 0;
    const runs = 40;
    for (let k = 0; k < runs; k++) {
      for (let i = 0; i < M; i++) {
        let c = 0;
        const cnt: Record<string, number> = {};
        for (let j = 0; j < N; j++) {
          if (r2() < P[i]) c++;
          else {
            const d = r2() < Q[i] ? 'trap' : `d${Math.floor(r2() * 8)}`;
            cnt[d] = (cnt[d] || 0) + 1;
          }
        }
        if (c > 0) anyC++;
        let bn = c;
        let best = 'c';
        for (const kk in cnt)
          if (cnt[kk] > bn) {
            bn = cnt[kk];
            best = kk;
          }
        if (best === 'c') maj++;
      }
    }
    return { n: N, passN: anyC / (runs * M), vote: maj / (runs * M) };
  });
})();
export const FINAL = CURVE[CURVE.length - 1];
export const VOTE_PLATEAU = CURVE[4].vote; // ≈ 0.68 at N=16

// one showcased vote: problem with a strong trap, 9 samples drawn
export const VOTE_PICK = (() => {
  // find a problem where the trap beats the truth: p < (1-p)*q
  let idx = 0;
  for (let i = 0; i < M; i++)
    if (P[i] > 0.2 && P[i] < 0.35 && (1 - P[i]) * Q[i] > P[i] + 0.08) {
      idx = i;
      break;
    }
  const r = mulberry32(55);
  const votes: string[] = [];
  for (let j = 0; j < 9; j++) {
    if (r() < P[idx]) votes.push('c');
    else votes.push(r() < Q[idx] ? 'trap' : `d${Math.floor(r() * 8)}`);
  }
  return { idx, p: P[idx], q: Q[idx], votes };
})();

// ---------------------------------------------------------------------------
// Layout — ballot column left, curves right.
// ---------------------------------------------------------------------------

export const BAL_X = 235;
export const BAL_Y0 = 130;
export const BAL_DY = 44;

export const CH_X0 = 620;
export const CH_X1 = 1180;
export const CH_Y0 = 505;
export const CH_H = 350;
export const chX = (i: number): number => CH_X0 + (i / (NS.length - 1)) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_BALLOT: CameraState = { x: 350, y: 300, k: 1.25 };
export const CAM_CURVES: CameraState = { x: 870, y: 330, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  balU: ChannelRef<number>; // ballots stagger in
  tallyU: ChannelRef<number>; // tally highlight
  axU: ChannelRef<number>;
  sweepP: ChannelRef<number>; // pass@N sweep
  sweepV: ChannelRef<number>; // vote sweep
  gapU: ChannelRef<number>; // the verifier-gap brace
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const balU = tl.channel('balU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const axU = tl.channel('axU', 0);
  const sweepP = tl.channel('sweepP', 0);
  const sweepV = tl.channel('sweepV', 0);
  const gapU = tl.channel('gapU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · two ways to cash tickets —————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'You have a pile of sampled answers. Now what? If you can verify — run the tests, check the proof — you keep the best. If you cannot, there is a folk remedy: let the samples vote.',
  });
  tl.tween(cam, CAM_BALLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(5.9, 0.4);

  // — Beat 2 · a real vote ——————————————————————————————————————————————
  tl.caption({
    at: 6.3,
    dur: 5.4,
    text: 'Here is self-consistency on one real problem from our suite. Nine samples, each casting its final answer as a ballot. The correct answer gets a single vote — but this problem has a trap: a wrong answer the model likes better.',
  });
  tl.tween(balU, 1, { at: 6.9, dur: 2.4, ease: ease.enter });
  tl.caption({
    at: 12.1,
    dur: 5.0,
    text: 'Count them. The trap wins the election. Majority voting amplifies whatever answer is most probable — and on some problems, the most probable answer is confidently wrong.',
  });
  tl.tween(tallyU, 1, { at: 12.9, dur: 1.0, ease: ease.pop });
  tl.hold(17.3, 0.6);

  // — Beat 3 · the sweep ————————————————————————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 17.9, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 18.3,
    dur: 5.2,
    text: 'Now measure both strategies properly: the full three hundred problem suite, sample counts from one to one twenty eight, forty full runs per point, every sample genuinely drawn. First, voting.',
  });
  tl.tween(axU, 1, { at: 18.9, dur: 1.2, ease: ease.draw });
  tl.tween(sweepV, NS.length - 1, { at: 23.1, dur: 5.5, ease: ease.move });
  tl.caption({
    at: 23.5,
    dur: 5.4,
    text: 'Self-consistency jumps from forty nine to sixty eight percent by four samples — real, free accuracy. Then it flatlines. More votes only make the election more decisive, including the elections the trap wins.',
  });
  tl.hold(29.1, 0.5);
  tl.caption({
    at: 29.6,
    dur: 5.2,
    text: 'Now give the same pile of samples to a verifier that can actually check each one — pass at N. The curve keeps climbing: ninety percent at eight samples, and every problem solved by one twenty eight.',
  });
  tl.tween(sweepP, NS.length - 1, { at: 30.4, dur: 5.5, ease: ease.move });
  tl.hold(35.4, 0.5);

  // — Beat 4 · the gap ——————————————————————————————————————————————————
  tl.caption({
    at: 35.9,
    dur: 5.6,
    text: 'That widening gap between the curves is the price of not being able to verify. Roughly thirty accuracy points at scale — the same lesson as the verifiable rewards book, transplanted from training time to inference time.',
  });
  tl.tween(gapU, 1, { at: 36.9, dur: 1.0, ease: ease.enter });
  tl.hold(42.1, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 44.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.5,
    dur: 5.6,
    text: 'So the ceiling on test-time compute is set by your checker, not your sampler. Which raises the next question: can we build a judge that reads the reasoning itself, step by step? That is the process reward model.',
  });
  tl.hold(50.3, 1.2);

  return { tl, cam, balU, tallyU, axU, sweepP, sweepV, gapU, mathU, dimU, endU };
}
