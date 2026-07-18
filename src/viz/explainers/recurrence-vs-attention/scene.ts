import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Why Attention Replaced Recurrence — path length and parallelism.
 *
 * Real, closed-form quantities computed at module scope:
 * - Signal survival through a recurrent chain: with per-step attenuation
 *   0.9 (the well-behaved Jacobian factor from chapter one), a dependency
 *   spanning d tokens keeps 0.9^d of its gradient — 12% at d = 20, 0.5% at
 *   d = 50. Attention's path is one hop at any distance: 0.9^1 = 0.9.
 * - Wall-clock depth: recurrence needs T sequential steps (each waits for the
 *   last); attention computes all T positions in one parallel layer. For
 *   T = 16 that is a 16-deep critical path versus depth 1.
 * This chapter is the bridge to the transformers book — it stops at the door.
 */

export const N_TOK = 12;
export const ATTEN = 0.9; // per-hop survival factor (matches chapter one's w)

/** Signal surviving a d-hop recurrent path. */
export const survive = (d: number): number => Math.pow(ATTEN, d);
export const SURVIVE_11 = survive(N_TOK - 1); // ≈ 0.31 for 11 hops
export const SURVIVE_20 = survive(20); // ≈ 0.12
export const SURVIVE_50 = survive(50); // ≈ 0.005

// tokens of a sentence with a long dependency: "The keys ... were lost"
export const TOKENS = [
  'The',
  'keys',
  'that',
  'I',
  'left',
  'on',
  'the',
  'kitchen',
  'table',
  'yesterday',
  'were',
  'lost',
] as const;
export const DEP_FROM = 1; // "keys"
export const DEP_TO = 10; // "were" — agreement across 9 hops
export const DEP_HOPS = DEP_TO - DEP_FROM; // 9
export const DEP_SURVIVE = survive(DEP_HOPS); // ≈ 0.387

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const TOK_Y = 300;
export const TOK_X0 = 92;
export const TOK_DX = (1180 - TOK_X0) / (N_TOK - 1);
export const tokX = (i: number): number => TOK_X0 + i * TOK_DX;

// parallelism race lanes
export const RACE_Y0 = 150;
export const RACE_STEPS = 12;

export const CAM_DEP: CameraState = { x: 640, y: 300, k: 1.2 };
export const CAM_RACE: CameraState = { x: 640, y: 330, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tokU: ChannelRef<number>; // tokens appear
  chainU: ChannelRef<number>; // recurrent chain edges
  relayU: ChannelRef<number>; // the signal relayed hop by hop 0..DEP_HOPS
  fadeMath: ChannelRef<number>;
  arcU: ChannelRef<number>; // the single attention arc
  allArcsU: ChannelRef<number>; // every-pair arcs
  raceU: ChannelRef<number>; // parallelism race 0..RACE_STEPS
  decayU: ChannelRef<number>; // the survival curve inset
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tokU = tl.channel('tokU', 0);
  const chainU = tl.channel('chainU', 0);
  const relayU = tl.channel('relayU', 0);
  const fadeMath = tl.channel('fadeMath', 0);
  const arcU = tl.channel('arcU', 0);
  const allArcsU = tl.channel('allArcsU', 0);
  const raceU = tl.channel('raceU', 0);
  const decayU = tl.channel('decayU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the long dependency ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Take one sentence. The keys that I left on the kitchen table yesterday were lost. To conjugate that verb, you must remember the keys — nine words back.',
  });
  tl.tween(tokU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_DEP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.0, 0.5);

  // — Beat 2 · recurrence relays ————————————————————————————————————————
  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'A recurrent network can only pass messages between neighbors. So the keys must be relayed through every word in between — a bucket brigade, nine hand-offs long.',
  });
  tl.tween(chainU, 1, { at: 6.8, dur: 1.4, ease: ease.draw });
  tl.tween(relayU, DEP_HOPS, { at: 8.2, dur: 4.5, ease: ease.linear });
  tl.caption({
    at: 12.5,
    dur: 5.4,
    text: 'Each hand-off leaks. With the friendly attenuation from last chapter, ninety percent per hop, only thirty nine percent of the signal completes the trip. At fifty words, half a percent.',
    tex: '0.9^{9} \\approx 0.39 \\qquad 0.9^{50} \\approx 0.005',
  });
  tl.tween(fadeMath, 1, { at: 13.0, dur: 0.7, ease: ease.enter });
  tl.tween(decayU, 1, { at: 13.4, dur: 1.4, ease: ease.draw });
  tl.hold(18.2, 0.6);

  // — Beat 3 · attention is one hop ————————————————————————————————————
  tl.caption({
    at: 18.8,
    dur: 5.4,
    text: 'Attention changes the wiring. The verb does not wait for a relay. It reaches directly back and pulls the keys forward itself — one hop, at any distance.',
  });
  tl.tween(relayU, 0, { at: 19.0, dur: 0.6, ease: ease.move });
  tl.tween(arcU, 1, { at: 19.6, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 24.4,
    dur: 5.0,
    text: 'One hop keeps ninety percent whether the distance is nine words or nine hundred. The path length between any two tokens drops from the distance between them to exactly one.',
  });
  tl.hold(29.6, 0.6);

  // — Beat 4 · and every pair at once ——————————————————————————————————
  tl.caption({
    at: 30.2,
    dur: 5.2,
    text: 'And it is not one privileged pair. Every token draws its own arcs to every earlier token, all in the same layer. The bucket brigade becomes a switchboard.',
  });
  tl.tween(allArcsU, 1, { at: 30.6, dur: 2.4, ease: ease.draw });
  tl.hold(35.6, 0.6);

  // — Beat 5 · the parallelism race ————————————————————————————————————
  tl.tween(allArcsU, 0.15, { at: 36.2, dur: 0.8, ease: ease.move });
  tl.tween(arcU, 0.15, { at: 36.2, dur: 0.8, ease: ease.move });
  tl.tween(fadeMath, 0, { at: 36.2, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RACE, { at: 36.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 36.8,
    dur: 5.6,
    text: 'There is a second, more brutal advantage. Recurrence is sequential: step twelve cannot start until step eleven finishes. Attention computes every position at once. Watch them race.',
  });
  tl.tween(raceU, RACE_STEPS, { at: 38.4, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 42.6,
    dur: 5.2,
    text: 'Twelve clock ticks against one. On hardware built to multiply thousands of numbers in parallel, that gap is the whole ballgame — it is why the big models could be trained at all.',
  });
  tl.hold(48.0, 0.6);

  // — Beat 6 · the bridge out ——————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.2, dur: 1.1, ease: ease.move });
  tl.tween(decayU, 0, { at: 49.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 50.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.4,
    dur: 6.0,
    text: 'Shorter paths for the gradient, full parallelism for the hardware. That trade is why recurrence lost. How attention actually computes those arcs is its own story — and this shelf tells it in the transformers book.',
  });
  tl.hold(56.6, 1.2);

  return { tl, cam, tokU, chainU, relayU, fadeMath, arcU, allArcsU, raceU, decayU, dimU, endU };
}
