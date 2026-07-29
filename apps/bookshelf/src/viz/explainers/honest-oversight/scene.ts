import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Honest Oversight — evaluation that attacks, not approves.
 *
 * The closing chapter, with the same fully-inspectable toy as the
 * overoptimization chapter (identical seeds: 4000 candidates, bounded true
 * quality, a learned reward model with rare systematic loopholes on
 * low-quality answers). Two oversight regimes are REALLY simulated:
 *  - PASSIVE: best-of-n against the reward model alone. Truth peaks ~0.75
 *    then collapses to 0.33 as every winner becomes a loophole.
 *  - ADVERSARIAL: same selection, but the top four candidates are audited —
 *    an independent, higher-effort check (noise 0.1) that does not share the
 *    reward model's blind spots — and the audit's pick wins. Truth holds
 *    0.92 at n = 64 and 0.76 at n = 256.
 *  - And the honest fine print, measured: at n = 1024 even the audited
 *    scheme sags to 0.42, because the shortlist itself is all loopholes.
 *    Oversight has to scale with the pressure it oversees.
 */

export const N_CAND = 4000;
const rand = mulberry32(7);
const g = gaussian(rand);

export const TRUE_Q: number[] = Array.from({ length: N_CAND }, () => rand() ** 0.7);
export const IS_LOOP: boolean[] = [];
export const RM: number[] = TRUE_Q.map((t) => {
  const loop = rand() < 0.06 && t < 0.45;
  IS_LOOP.push(loop);
  return t + 0.25 * g() + (loop ? 1.3 + 0.3 * g() : 0);
});

/** the audit: independent, more careful, unfooled by the RM's loopholes */
const gAudit = gaussian(mulberry32(56));
export const AUDIT: number[] = TRUE_Q.map((t) => t + 0.1 * gAudit());

export const NS = [1, 4, 16, 64, 256, 1024] as const;

export interface Pt {
  n: number;
  passive: number;
  audited: number;
}
export const CURVE: Pt[] = (() => {
  const r2 = mulberry32(99);
  const r3 = mulberry32(55);
  return NS.map((n) => {
    const runs = 1500;
    let sP = 0;
    let sA = 0;
    for (let k = 0; k < runs; k++) {
      // passive
      let bi = 0;
      let bp = -Infinity;
      for (let j = 0; j < n; j++) {
        const i = Math.floor(r2() * N_CAND);
        if (RM[i] > bp) {
          bp = RM[i];
          bi = i;
        }
      }
      sP += TRUE_Q[bi];
      // audited: shortlist top 4 by RM, audit picks
      const idx: number[] = [];
      for (let j = 0; j < n; j++) idx.push(Math.floor(r3() * N_CAND));
      idx.sort((x, y) => RM[y] - RM[x]);
      const short = idx.slice(0, Math.min(4, idx.length));
      let ai = short[0];
      for (const i of short) if (AUDIT[i] > AUDIT[ai]) ai = i;
      sA += TRUE_Q[ai];
    }
    return { n, passive: sP / runs, audited: sA / runs };
  });
})();

export const AT_64 = CURVE[3]; // passive ~0.57, audited ~0.92
export const FINAL = CURVE[CURVE.length - 1]; // passive 0.34, audited 0.42

// ---------------------------------------------------------------------------
// Stage layout — the audit desk left, the two curves right.
// ---------------------------------------------------------------------------

export const CH_X0 = 620;
export const CH_X1 = 1170;
export const CH_Y0 = 480;
export const CH_H = 340;
export const chX = (idx: number): number => CH_X0 + (idx / (NS.length - 1)) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const DESK_X = 120;
export const DESK_Y = 150;

export const CAM_DESK: CameraState = { x: 330, y: 320, k: 1.3 };
export const CAM_CURVES: CameraState = { x: 880, y: 310, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  deskU: ChannelRef<number>; // the shortlist + audit stamps
  auditP: ChannelRef<number>; // audit animation 0..4
  axU: ChannelRef<number>;
  sweepP: ChannelRef<number>; // passive curve 0..NS.length-1
  sweepA: ChannelRef<number>; // audited curve
  sagU: ChannelRef<number>; // the honest fine print marker
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

/** the shortlist shown at the desk: a real draw at n = 64 (recomputed) */
export const DESK_SHORT: { i: number; rm: number; audit: number; truth: number; loop: boolean }[] =
  (() => {
    const r = mulberry32(1234);
    const idx: number[] = [];
    for (let j = 0; j < 64; j++) idx.push(Math.floor(r() * N_CAND));
    idx.sort((x, y) => RM[y] - RM[x]);
    return idx.slice(0, 4).map((i) => ({ i, rm: RM[i], audit: AUDIT[i], truth: TRUE_Q[i], loop: IS_LOOP[i] }));
  })();

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const deskU = tl.channel('deskU', 0);
  const auditP = tl.channel('auditP', 0);
  const axU = tl.channel('axU', 0);
  const sweepP = tl.channel('sweepP', 0);
  const sweepA = tl.channel('sweepA', 0);
  const sagU = tl.channel('sagU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · recap the failure ————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'This book has been one story told four ways: write down what you want, apply pressure, and watch the pressure find the gap. The closing question is what oversight has to look like to survive it.',
  });
  tl.tween(axU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_CURVES, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'The green curve is passive oversight — the judge scores, the best score wins, nobody double-checks. Same toy as the overoptimization chapter: truth peaks early, then the loopholes take over and it collapses.',
  });
  tl.tween(sweepP, NS.length - 1, { at: 7.3, dur: 4.5, ease: ease.move });
  tl.hold(12.1, 0.6);

  // — Beat 2 · the audit desk ——————————————————————————————————————————
  tl.tween(cam, CAM_DESK, { at: 12.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 5.6,
    text: 'Now add one adversarial step. Before a winner is declared, the top four candidates go to an audit desk — an independent check that is slower, more careful, and crucially does not share the judge’s blind spots.',
  });
  tl.tween(deskU, 1, { at: 13.7, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 19.1,
    dur: 5.6,
    text: 'Here is a real shortlist from the simulation. The reward model’s favorite is a loophole — fluent, confident, quality zero point four. The audit re-scores all four, catches it, and promotes the genuine answer.',
  });
  tl.tween(auditP, 4, { at: 19.9, dur: 4.0, ease: ease.linear });
  tl.hold(25.1, 0.6);

  // — Beat 3 · the audited curve ————————————————————————————————————————
  tl.tween(cam, CAM_CURVES, { at: 25.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 26.1,
    dur: 5.6,
    text: 'Run that discipline across the whole pressure sweep and you get the blue curve. Where passive oversight has already collapsed, the audited scheme is still delivering answers at zero point nine two.',
  });
  tl.tween(sweepA, NS.length - 1, { at: 26.9, dur: 4.5, ease: ease.move });
  tl.hold(32.1, 0.6);

  // — Beat 4 · the honest fine print ————————————————————————————————————
  tl.caption({
    at: 32.7,
    dur: 5.8,
    text: 'And the fine print, because honest evaluation applies to itself: push far enough and even the audited curve sags — at extreme pressure the entire shortlist is loopholes, and the auditor can only pick the least bad one.',
  });
  tl.tween(sagU, 1, { at: 33.5, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 38.7,
    dur: 5.0,
    text: 'The lesson is not that audits fail. It is that oversight is a budget, and it must scale with the optimization it oversees. A fixed check will eventually be optimized around.',
  });
  tl.hold(43.9, 0.6);

  // — Beat 5 · the doctrine ————————————————————————————————————————————
  tl.caption({
    at: 44.5,
    dur: 5.8,
    text: 'So what does honest oversight look like? It assumes the gap exists and hunts for it: independent checks with different blind spots, fresh tests after the model has moved, and the deepest scrutiny aimed at whatever is currently winning.',
  });
  tl.hold(50.5, 0.5);
  tl.tween(dimU, 0.13, { at: 51.0, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 52.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 52.2,
    dur: 6.0,
    text: 'The book in one line: a strong optimizer will do exactly what its judge approves — so alignment is the craft of building judges that attack. Applaud nothing you have not tried to break.',
  });
  tl.hold(58.4, 1.2);

  return { tl, cam, deskU, auditP, axU, sweepP, sweepA, sagU, dimU, endU };
}
