import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Curriculum and Bootstrapping — a STaR-style loop, actually run.
 *
 * The published self-taught reasoner recipe: sample reasoning chains, keep
 * ONLY the ones the verifier confirms, fine-tune on the keepers, repeat.
 *
 * Real toy at module scope: 300 problems, each with a true chance that one
 * sampled chain is correct (20% easy, a middle mass, and a 15% tail of
 * near-impossible problems at under two percent). Each round: draw 4 chains
 * per problem, and if any passes the verifier, fine-tuning lifts that
 * problem's success rate toward one (never past what was verified).
 *
 * Measured over 6 rounds (seeds 7 and 45): accuracy 36.6% → 82.7%, with the
 * kept-fraction growing 68% → 88% as yesterday's borderline problems become
 * today's training data. And the honest limit: 29 of 300 problems never
 * produce a single verified chain — bootstrapping amplifies what you can
 * occasionally do; it cannot create what you never can.
 */

export const M = 300;
export const K = 4;
export const ALPHA = 0.35;
export const ROUNDS = 6;

export const P0: number[] = (() => {
  const rand = mulberry32(7);
  const p: number[] = [];
  for (let i = 0; i < M; i++) {
    const u = rand();
    p.push(
      u < 0.2
        ? 0.6 + 0.3 * rand()
        : u < 0.55
          ? 0.25 + 0.35 * rand()
          : u < 0.85
            ? 0.05 + 0.2 * rand()
            : 0.005 + 0.01 * rand(),
    );
  }
  return p;
})();

export interface Round {
  p: number[];
  acc: number;
  keptFrac: number;
}
export const HIST: Round[] = (() => {
  const r2 = mulberry32(45);
  let p = [...P0];
  const hist: Round[] = [{ p: [...p], acc: p.reduce((a, b) => a + b, 0) / M, keptFrac: 0 }];
  for (let r = 1; r <= ROUNDS; r++) {
    let kept = 0;
    p = p.map((pi) => {
      let found = false;
      for (let j = 0; j < K; j++)
        if (r2() < pi) {
          found = true;
          break;
        }
      if (found) {
        kept++;
        return pi + ALPHA * (1 - pi);
      }
      return pi;
    });
    hist.push({ p: [...p], acc: p.reduce((a, b) => a + b, 0) / M, keptFrac: kept / M });
  }
  return hist;
})();
export const FINAL = HIST[ROUNDS];
export const STUCK = FINAL.p.filter((x) => x < 0.05).length; // 29

export function accAt(u: number): number {
  const s = Math.max(0, Math.min(ROUNDS, u));
  const i = Math.floor(s);
  const j = Math.min(ROUNDS, i + 1);
  const f = s - i;
  return HIST[i].acc + f * (HIST[j].acc - HIST[i].acc);
}
export function pAt(u: number, idx: number): number {
  const s = Math.max(0, Math.min(ROUNDS, u));
  const i = Math.floor(s);
  const j = Math.min(ROUNDS, i + 1);
  const f = s - i;
  return HIST[i].p[idx] + f * (HIST[j].p[idx] - HIST[i].p[idx]);
}

/** render subset of problems, sorted by initial difficulty */
export const ORDER: number[] = Array.from({ length: M }, (_, i) => i).sort((a, b) => P0[a] - P0[b]);

// ---------------------------------------------------------------------------
// Layout — problem grid left (20×15), loop chart right.
// ---------------------------------------------------------------------------

export const GRID_X0 = 110;
export const GRID_Y0 = 120;
export const GRID_COLS = 20;
export const GRID_DX = 26;
export const GRID_DY = 26;
export const cellPos = (k: number): { x: number; y: number } => ({
  x: GRID_X0 + (k % GRID_COLS) * GRID_DX,
  y: GRID_Y0 + Math.floor(k / GRID_COLS) * GRID_DY,
});

export const CH_X0 = 760;
export const CH_X1 = 1180;
export const CH_Y0 = 490;
export const CH_H = 330;
export const chX = (r: number): number => CH_X0 + (r / ROUNDS) * (CH_X1 - CH_X0);
export const chY = (v: number): number => CH_Y0 - v * CH_H;

export const CAM_GRID: CameraState = { x: 400, y: 320, k: 1.2 };
export const CAM_CHART: CameraState = { x: 930, y: 320, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>; // grid stagger in
  round: ChannelRef<number>; // 0..6
  axU: ChannelRef<number>;
  stuckU: ChannelRef<number>; // highlight the unreachable
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const round = tl.channel('round', 0);
  const axU = tl.channel('axU', 0);
  const stuckU = tl.channel('stuckU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the recipe ———————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here is the loop that makes synthetic data actually work, from the self-taught reasoner line of work: sample reasoning chains, keep only the ones a verifier confirms, train on the keepers, and go again.',
  });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(gridU, 1, { at: 1.6, dur: 2.4, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.4,
    text: 'Three hundred problems, colored by how often one sampled attempt succeeds — cold blue means almost never, warm means usually. Overall accuracy to start: thirty six point six percent. The dark corner is the near-impossible tail.',
  });
  tl.hold(12.1, 0.6);

  // — Beat 2 · run the rounds ———————————————————————————————————————————
  tl.caption({
    at: 12.7,
    dur: 5.4,
    text: 'Round one, for real: four attempts per problem, keep every verified success, fine-tune. Sixty eight percent of problems yield at least one keeper, and each keeper drags its problem toward mastery. Watch the grid warm up.',
  });
  tl.tween(round, 1, { at: 14.1, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 18.5,
    dur: 5.2,
    text: 'And here is the curriculum effect: problems you could barely ever solve become problems you sometimes solve, which makes them keepable next round. The frontier eats its way outward from easy toward hard.',
  });
  tl.tween(round, 3, { at: 19.5, dur: 3.0, ease: ease.move });
  tl.hold(23.9, 0.5);

  // — Beat 3 · the curve —————————————————————————————————————————————————
  tl.tween(cam, CAM_CHART, { at: 24.4, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 24.8,
    dur: 5.2,
    text: 'Six rounds, all simulated: accuracy climbs from thirty six point six percent to eighty two point seven. No new human data anywhere — just the model’s own verified successes, fed back as curriculum.',
  });
  tl.tween(axU, 1, { at: 25.4, dur: 1.2, ease: ease.draw });
  tl.tween(round, ROUNDS, { at: 27.0, dur: 4.0, ease: ease.move });
  tl.hold(30.5, 0.5);

  // — Beat 4 · the honest limit —————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 31.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 31.0,
    dur: 5.6,
    text: 'Now the fine print. Twenty nine of the three hundred problems never produced a single verified chain in any round — and they end exactly where they started. Bootstrapping amplifies what you can occasionally do. It cannot create what you never can.',
  });
  tl.tween(stuckU, 1, { at: 32.4, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 37.0,
    dur: 4.8,
    text: 'That is why every serious pipeline pairs this loop with something that expands the frontier — harder verifiers, search at sampling time, or fresh problems from outside the model.',
  });
  tl.hold(42.0, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.2, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 44.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.4,
    dur: 5.0,
    text: 'Generate, verify, keep, retrain: collapse becomes curriculum the moment a check stands at the gate. One question remains — why the field needs this loop at all. The answer is a wall made of text.',
  });
  tl.hold(49.6, 1.2);

  return { tl, cam, gridU, round, axU, stuckU, dimU, endU };
}
