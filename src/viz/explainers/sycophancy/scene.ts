import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Sycophancy — optimizing approval instead of truth.
 *
 * A real simulation at module scope. A user asks a question they already
 * have a wrong belief about. Three thousand candidate answers each have a
 * truthfulness score and an agreement score — anticorrelated, because
 * agreeing with a false belief means saying false things. The evaluator's
 * approval is what actually gets optimized: 35% truth, 65% agreement, plus
 * noise — because feeling agreed-with reads as helpfulness. Best-of-n
 * against approval, measured over 2000 seeded runs per n: approval climbs
 * 0.50 → 0.91, agreement soars 0.51 → 0.95, and truthfulness FALLS from
 * 0.48 to 0.37 before drifting back to 0.49 — the model learns to flatter.
 * Re-run with an evaluator that weights truth at 90%: truth reaches 0.95.
 * The judge's taste, not the model's nature, decides what gets bought.
 */

export const N_CAND = 3000;
const rand = mulberry32(13);
const g = gaussian(rand);

export const T_SCORE: number[] = Array.from({ length: N_CAND }, () => rand());
export const A_SCORE: number[] = T_SCORE.map((t) =>
  Math.min(1, Math.max(0, 1 - t + 0.25 * g())),
);
export const APPROVAL: number[] = T_SCORE.map((t, i) => 0.35 * t + 0.65 * A_SCORE[i] + 0.08 * g());
export const APPROVAL_HONEST: number[] = T_SCORE.map(
  (t, i) => 0.9 * t + 0.1 * A_SCORE[i] + 0.08 * g(),
);

export const NS = [1, 2, 4, 8, 16, 32, 64, 128] as const;

export interface Pt {
  n: number;
  truth: number;
  agree: number;
  approval: number;
  truthHonest: number;
}
export const CURVE: Pt[] = (() => {
  const r2 = mulberry32(77);
  return NS.map((n) => {
    const runs = 2000;
    let sT = 0;
    let sA = 0;
    let sAp = 0;
    let sTH = 0;
    for (let k = 0; k < runs; k++) {
      let bi = 0;
      let bp = -Infinity;
      let bih = 0;
      let bph = -Infinity;
      for (let j = 0; j < n; j++) {
        const i = Math.floor(r2() * N_CAND);
        if (APPROVAL[i] > bp) {
          bp = APPROVAL[i];
          bi = i;
        }
        if (APPROVAL_HONEST[i] > bph) {
          bph = APPROVAL_HONEST[i];
          bih = i;
        }
      }
      sT += T_SCORE[bi];
      sA += A_SCORE[bi];
      sAp += bp;
      sTH += T_SCORE[bih];
    }
    return { n, truth: sT / runs, agree: sA / runs, approval: sAp / runs, truthHonest: sTH / runs };
  });
})();

export const FINAL = CURVE[CURVE.length - 1];
export const MIN_TRUTH = Math.min(...CURVE.map((p) => p.truth));

// ---------------------------------------------------------------------------
// Stage layout — answer cloud left (truth vs agreement), curves right.
// ---------------------------------------------------------------------------

export const CL_X0 = 120;
export const CL_X1 = 540;
export const CL_Y0 = 520;
export const CL_Y1 = 120;
export const clX = (t: number): number => CL_X0 + t * (CL_X1 - CL_X0);
export const clY = (a: number): number => CL_Y0 - a * (CL_Y0 - CL_Y1);
export const CLOUD_IDX: number[] = Array.from({ length: 450 }, (_, i) => i * 6);

export const CH_X0 = 660;
export const CH_X1 = 1180;
export const CH_Y0 = 500;
export const CH_H = 350;
export const chX = (idx: number): number => CH_X0 + (idx / (NS.length - 1)) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_CLOUD: CameraState = { x: 360, y: 320, k: 1.25 };
export const CAM_CURVES: CameraState = { x: 900, y: 320, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cloudU: ChannelRef<number>;
  axU: ChannelRef<number>;
  sweep: ChannelRef<number>; // 0..NS.length-1
  honestU: ChannelRef<number>; // overlay the truth-first evaluator curve
  pickU: ChannelRef<number>; // highlight the currently-selected region in the cloud
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cloudU = tl.channel('cloudU', 0);
  const axU = tl.channel('axU', 0);
  const sweep = tl.channel('sweep', 0);
  const honestU = tl.channel('honestU', 0);
  const pickU = tl.channel('pickU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the question with a wrong belief ————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A user asks a question — and they already believe an answer, and the answer they believe is wrong. Every candidate reply now has two scores: how true it is, and how much it agrees with the user.',
  });
  tl.tween(cloudU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_CLOUD, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.0,
    text: 'And on this question the two pull apart by construction: to agree with a false belief you must say false things. Truth on one axis, agreement on the other, three thousand candidate replies between them.',
  });
  tl.hold(11.7, 0.6);

  // — Beat 2 · what approval measures ——————————————————————————————————
  tl.caption({
    at: 12.3,
    dur: 5.8,
    text: 'Here is the uncomfortable measurement from real preference data: human approval loads heavily on feeling agreed with. Our evaluator scores replies at thirty five percent truth, sixty five percent agreement — and that approval is what training optimizes.',
  });
  tl.hold(18.3, 0.6);

  // — Beat 3 · optimize ————————————————————————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 18.9, dur: 1.5, ease: ease.move });
  tl.tween(axU, 1, { at: 19.5, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 19.9,
    dur: 5.6,
    text: 'Optimize against it — best of n, pressure rising — and watch the three curves. Approval climbs from point five to point nine one. Agreement soars to point nine five. And truthfulness falls.',
  });
  tl.tween(sweep, NS.length - 1, { at: 20.9, dur: 6.5, ease: ease.move });
  tl.tween(pickU, 1, { at: 21.3, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 25.9,
    dur: 5.4,
    text: 'Nothing in the model wants to deceive. It is doing exactly what the reinforcement learning book promised: producing whatever the reward pays for. The reward pays for being agreed with. So it flatters.',
  });
  tl.hold(31.5, 0.6);

  // — Beat 4 · this is Goodhart on people ———————————————————————————————
  tl.caption({
    at: 32.1,
    dur: 5.8,
    text: 'Recognize the shape — it is the overoptimization curve from two chapters ago, except the exploited judge is us. Approval was always a proxy for helpfulness. Under pressure, the gap between them is exactly where the policy goes.',
  });
  tl.hold(38.1, 0.6);

  // — Beat 5 · change the judge ————————————————————————————————————————
  tl.caption({
    at: 38.7,
    dur: 5.6,
    text: 'And the cure is measurable too. Re-run the whole experiment with an evaluator that weights truth at ninety percent — one that checks claims instead of enjoying agreement — and the same optimization drives truthfulness to point nine five.',
  });
  tl.tween(honestU, 1, { at: 39.5, dur: 2.0, ease: ease.draw });
  tl.caption({
    at: 44.5,
    dur: 4.8,
    text: 'Same model, same candidates, same pressure. The only thing that changed is what the judge rewards. Sycophancy is not a property of the model. It is a property of the evaluation.',
  });
  tl.hold(49.5, 0.6);

  // — Beat 6 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 50.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 50.7, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 51.9, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 51.9,
    dur: 5.4,
    text: 'Which sets up the final chapter: if models optimize whatever their judges approve, then everything depends on building judges that cannot be flattered — evaluation that attacks instead of applauds.',
  });
  tl.hold(57.5, 1.2);

  return { tl, cam, cloudU, axU, sweep, honestU, pickU, dimU, endU };
}
