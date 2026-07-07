import { Timeline, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState } from '../../core';
import { CAMERA_HOME } from '../../core';

/**
 * The Kalman Filter — Trust, Weighted.
 *
 * A robot rolls down a 1-D hallway with a noisy sensor. Its belief is a
 * Gaussian that slides and spreads on predict, then multiplies against each
 * measurement's Gaussian and snaps sharper. The whole filter run (truth,
 * measurements, predict/update chain) is computed once here at module scope;
 * the timeline only tweens the displayed (μ, σ²) through those values, so
 * every frame is a pure function of the sampled channels.
 */

export interface Belief {
  mu: number;
  var: number;
}

/** World: hallway positions 0..10. One filter step per unit of robot motion. */
export const WORLD = { min: 0, max: 10 };
export const V = 0.78; // robot velocity per step
export const Q = 0.06; // process noise added by each predict
export const R = 0.3; // measurement noise variance

const rand = mulberry32(11);
const noise = gaussian(rand);

export const N_STEPS = 10; // k = 0..9

/** Ground truth — near-constant velocity with a whiff of process noise. */
export const TRUE: number[] = (() => {
  const xs = [1.15];
  for (let k = 1; k < N_STEPS; k++) {
    xs.push(xs[k - 1] + V + noise() * 0.05);
  }
  return xs;
})();

/** The sensor's story: truth plus zero-mean noise of variance R. */
export const Z: number[] = TRUE.map((x) => x + noise() * Math.sqrt(R));

/** The beat-1 scatter: six pings around the parked robot. */
export const SCATTER: number[] = Array.from(
  { length: 6 },
  () => TRUE[0] + noise() * Math.sqrt(R),
);

const predict = (b: Belief): Belief => ({ mu: b.mu + V, var: b.var + Q });
const update = (b: Belief, z: number): Belief => {
  const K = b.var / (b.var + R);
  return { mu: b.mu + K * (z - b.mu), var: (1 - K) * b.var };
};

/**
 * The filter chain the scene walks through:
 *  - POST[0]: the initial belief (wide, roughly where the pings landed);
 *  - PRED[1], PRED[2]: TWO predicts with no measurement — doubt compounds;
 *  - POST[2]: the beat-4 update against Z[2];
 *  - PRED[k]/POST[k] for k = 3..9: the beat-5 predict/correct cycles.
 */
export const PRED: Belief[] = new Array(N_STEPS);
export const POST: Belief[] = new Array(N_STEPS);
POST[0] = { mu: Z[0] + 0.12, var: 0.55 };
PRED[1] = predict(POST[0]);
PRED[2] = predict(PRED[1]); // skipped ping: predict-on-predict
POST[2] = update(PRED[2], Z[2]);
for (let k = 3; k < N_STEPS; k++) {
  PRED[k] = predict(POST[k - 1]);
  POST[k] = update(PRED[k], Z[k]);
}

/** The Kalman gain at the beat-4 update, for the on-screen formula. */
export const K2 = PRED[2].var / (PRED[2].var + R);

export const BASE_Y = 560; // the hallway number line
export const T_TOTAL = 69.8;

export function buildScene() {
  const tl = new Timeline();

  const lineU = tl.channel('lineU', 0); // hallway draw-on
  const robotU = tl.channel('robotU', 0); // robot entrance
  const robotX = tl.channel('robotX', TRUE[0]); // true position (world coords)
  const scatterP = tl.channel('scatterP', 0); // beat-1 pings stagger
  const scatterFade = tl.channel('scatterFade', 1); // then step aside
  const beliefU = tl.channel('beliefU', 0); // belief curve draw-on
  const muC = tl.channel('muC', POST[0].mu); // displayed belief mean
  const varC = tl.channel('varC', POST[0].var); // displayed belief variance
  const muTexU = tl.channel('muTexU', 0); // N(mu, sigma^2) label
  const predTexU = tl.channel('predTexU', 0); // predict equations
  const measU = tl.channel('measU', 0); // measurement Gaussian opacity
  const kTexU = tl.channel('kTexU', 0); // Kalman gain equations
  const glow = tl.channel('glow', 0); // the multiply moment
  const cyclesP = tl.channel('cyclesP', 0); // beat-5 trail progress (0..7)
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);

  // ---- beat 1: a robot and a sensor that lies a little ---------------------
  tl.caption({
    at: 0.3,
    dur: 5.8,
    text: 'A robot rolls down a hallway. Its GPS answers — but never quite the same way twice.',
  });
  tl.tween(lineU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.tween(robotU, 1, { at: 1.8, dur: 0.7, ease: ease.enter });
  tl.tween(scatterP, 1, { at: 3.2, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 6.4,
    dur: 5.2,
    text: "Each ping lands somewhere near the truth. 'Near' is doing a lot of work.",
  });
  tl.hold(11.8, 0.6);

  // ---- beat 2: store a belief, not a number ---------------------------------
  tl.caption({
    at: 12.5,
    dur: 5.8,
    text: "So don't store a number — store a belief: every position, weighted by your confidence.",
  });
  tl.tween(scatterFade, 0.22, { at: 13.0, dur: 1.0, ease: ease.move });
  tl.tween(beliefU, 1, { at: 13.4, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 4.6,
    text: 'One Gaussian carries both the guess (μ) and the doubt (σ).',
  });
  tl.tween(muTexU, 1, { at: 19.2, dur: 0.7, ease: ease.enter });
  tl.hold(23.6, 0.5);

  // ---- beat 3: predict — slide and spread ----------------------------------
  tl.caption({
    at: 24.2,
    dur: 5.6,
    text: 'The robot moves. Slide the belief along — and let it spread: motion adds doubt.',
  });
  tl.tween(robotX, TRUE[1], { at: 24.8, dur: 1.6, ease: ease.move });
  tl.tween(muC, PRED[1].mu, { at: 24.8, dur: 1.6, ease: ease.move });
  tl.tween(varC, PRED[1].var, { at: 24.8, dur: 1.8, ease: ease.move });
  tl.tween(predTexU, 1, { at: 27.2, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 30.2,
    dur: 4.8,
    text: 'Miss a ping and doubt compounds — prediction alone is a slow melt into ignorance.',
  });
  tl.tween(robotX, TRUE[2], { at: 30.8, dur: 1.4, ease: ease.move });
  tl.tween(muC, PRED[2].mu, { at: 30.8, dur: 1.4, ease: ease.move });
  tl.tween(varC, PRED[2].var, { at: 30.8, dur: 1.6, ease: ease.move });
  tl.hold(35.4, 0.5);

  // ---- beat 4: measure, multiply, snap --------------------------------------
  tl.caption({
    at: 36.0,
    dur: 5.4,
    text: "A ping arrives — its own Gaussian: the sensor's story, with the sensor's doubt.",
  });
  tl.tween(measU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 430, k: 1.22 }, { at: 41.6, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 42.0,
    dur: 6.0,
    text: 'Multiply belief by evidence: two Gaussians make a third — taller and thinner than either.',
  });
  tl.tween(muC, POST[2].mu, { at: 43.4, dur: 1.4, ease: ease.move });
  tl.tween(varC, POST[2].var, { at: 43.4, dur: 1.4, ease: ease.move });
  tl.tween(glow, 1, { at: 43.6, dur: 0.6, ease: ease.pop });
  tl.tween(glow, 0, { at: 45.6, dur: 1.2, ease: ease.move });
  tl.tween(measU, 0, { at: 45.8, dur: 1.0, ease: ease.move });
  tl.tween(kTexU, 1, { at: 46.4, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 48.4,
    dur: 4.4,
    text: 'The Kalman gain K just says who to trust — and by exactly how much.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.4, dur: 1.2, ease: ease.move });
  tl.hold(52.8, 0.4);

  // ---- beat 5: run the loop — predict, correct, repeat -----------------------
  tl.caption({
    at: 53.2,
    dur: 5.4,
    text: 'Now run it on repeat: slide, spread, snap. Predict, correct, predict, correct.',
  });
  const t0 = 54.0;
  const STEP = 1.62; // seconds per predict/correct cycle
  for (let j = 0; j < 7; j++) {
    const k = j + 3;
    const at = t0 + j * STEP;
    tl.tween(robotX, TRUE[k], { at, dur: 0.9, ease: ease.move });
    tl.tween(muC, PRED[k].mu, { at, dur: 0.7, ease: ease.move });
    tl.tween(varC, PRED[k].var, { at, dur: 0.7, ease: ease.move });
    tl.tween(muC, POST[k].mu, { at: at + 0.95, dur: 0.45, ease: ease.move });
    tl.tween(varC, POST[k].var, { at: at + 0.95, dur: 0.45, ease: ease.move });
  }
  // one linear trail clock spanning the 7 cycles: measurement ✕s and
  // estimate dots pop as it passes each step.
  tl.tween(cyclesP, 7, { at: t0, dur: 7 * STEP, ease: ease.linear });
  tl.caption({
    at: 61.8,
    dur: 6.8,
    text: 'The estimate hugs the truth tighter than any single ping. That is the filter: trust, weighted.',
  });
  tl.hold(68.8, 1.0); // total = T_TOTAL

  return {
    tl,
    ch: {
      lineU,
      robotU,
      robotX,
      scatterP,
      scatterFade,
      beliefU,
      muC,
      varC,
      muTexU,
      predTexU,
      measU,
      kTexU,
      glow,
      cyclesP,
      cam,
    },
  };
}
