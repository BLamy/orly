import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The GAN Game — forger versus detective.
 *
 * All math at module scope: real data is a two-mode Gaussian mixture on a
 * line (modes at -2 and +2), and TWO actual adversarial training runs are
 * recorded step by step with seeded minibatches:
 *
 *  - FLEX run: generator g(z) = mu + s z with BOTH mu and s learnable.
 *    The generator smears itself across both modes: one wide, blurry blob
 *    (mu -> ~0, s -> ~2) — the "average" failure.
 *  - NARROW run: s fixed at 0.5, only mu learnable. The generator cannot
 *    cover both modes, so it commits to ONE (mu -> ~+2) and forever ignores
 *    the other — honest mode collapse, replayed from the recording.
 *
 * The discriminator is logistic regression on (x, x^2); both players take
 * alternating gradient steps on the true minimax objective. Nothing is
 * staged: every curve on screen is computed from the recorded parameters.
 */

export const MODES = [-2, 2] as const;
export const MODE_S = 0.5;
export const BATCH = 64;

export interface GanSnap {
  mu: number;
  s: number;
  w1: number;
  w2: number;
  b: number;
}

const sgm = (x: number): number => 1 / (1 + Math.exp(-x));

function runGan(seed: number, iters: number, learnS: boolean, lrD: number, lrG: number): GanSnap[] {
  const rand = mulberry32(seed);
  const g = gaussian(rand);
  let mu = learnS ? 0.3 : 0.15;
  let s = learnS ? 1.0 : MODE_S;
  let w1 = 0;
  let w2 = 0;
  let b = 0;
  const snaps: GanSnap[] = [{ mu, s, w1, w2, b }];
  const D = (x: number) => sgm(w1 * x + w2 * x * x + b);
  for (let it = 0; it < iters; it++) {
    const real: number[] = [];
    const fake: number[] = [];
    for (let i = 0; i < BATCH; i++) {
      real.push((rand() < 0.5 ? MODES[0] : MODES[1]) + MODE_S * g());
      fake.push(mu + s * g());
    }
    // detective step: ascend log D(real) + log(1 - D(fake))
    let gw1 = 0;
    let gw2 = 0;
    let gb = 0;
    for (const x of real) {
      const d = D(x);
      gw1 += (1 - d) * x;
      gw2 += (1 - d) * x * x;
      gb += 1 - d;
    }
    for (const x of fake) {
      const d = D(x);
      gw1 += -d * x;
      gw2 += -d * x * x;
      gb += -d;
    }
    w1 += (lrD * gw1) / BATCH;
    w2 += (lrD * gw2) / BATCH;
    b += (lrD * gb) / BATCH;
    // forger step: ascend log D(g(z)) (the non-saturating trick)
    let gmu = 0;
    let gs = 0;
    for (let i = 0; i < BATCH; i++) {
      const z = g();
      const x = mu + s * z;
      const d = D(x);
      const dLdx = (1 - d) * (w1 + 2 * w2 * x);
      gmu += dLdx;
      gs += dLdx * z;
    }
    mu += (lrG * gmu) / BATCH;
    if (learnS) {
      s += (lrG * gs) / BATCH;
      if (s < 0.05) s = 0.05;
    }
    snaps.push({ mu, s, w1, w2, b });
  }
  return snaps;
}

export const FLEX_ITERS = 400;
export const NARROW_ITERS = 600;
export const FLEX: GanSnap[] = runGan(9, FLEX_ITERS, true, 0.05, 0.05);
export const NARROW: GanSnap[] = runGan(7, NARROW_ITERS, false, 0.1, 0.15);
export const FLEX_FINAL = FLEX[FLEX.length - 1];
export const NARROW_FINAL = NARROW[NARROW.length - 1];

export function snapAt(run: GanSnap[], f: number): GanSnap {
  const gg = Math.max(0, Math.min(run.length - 1, f));
  const i = Math.floor(gg);
  if (i >= run.length - 1) return run[run.length - 1];
  const t = gg - i;
  const A = run[i];
  const B = run[i + 1];
  return {
    mu: A.mu + (B.mu - A.mu) * t,
    s: A.s + (B.s - A.s) * t,
    w1: A.w1 + (B.w1 - A.w1) * t,
    w2: A.w2 + (B.w2 - A.w2) * t,
    b: A.b + (B.b - A.b) * t,
  };
}

/** Closed-form densities for the drawn curves. */
export const realPdf = (x: number): number =>
  0.5 *
  (Math.exp(-((x - MODES[0]) ** 2) / (2 * MODE_S * MODE_S)) / (MODE_S * Math.sqrt(2 * Math.PI)) +
    Math.exp(-((x - MODES[1]) ** 2) / (2 * MODE_S * MODE_S)) / (MODE_S * Math.sqrt(2 * Math.PI)));

export const fakePdf = (x: number, snap: GanSnap): number =>
  Math.exp(-((x - snap.mu) ** 2) / (2 * snap.s * snap.s)) / (snap.s * Math.sqrt(2 * Math.PI));

export const dOf = (x: number, snap: GanSnap): number => sgm(snap.w1 * x + snap.w2 * x * x + snap.b);

// ---------------------------------------------------------------------------
// Stage mapping — density panel (top) + D(x) panel (bottom) + mu trace (right)
// ---------------------------------------------------------------------------

export const xAxis: ScaleLinear<number, number> = scaleLinear().domain([-4.2, 4.2]).range([90, 860]);
export const pdfY: ScaleLinear<number, number> = scaleLinear().domain([0, 0.9]).range([330, 70]);
export const dY: ScaleLinear<number, number> = scaleLinear().domain([0, 1]).range([600, 440]);

export const trX: ScaleLinear<number, number> = scaleLinear().domain([0, NARROW_ITERS]).range([950, 1230]);
export const trY: ScaleLinear<number, number> = scaleLinear().domain([-3.4, 3.4]).range([470, 130]);

export const CAM_MAIN: CameraState = { x: 480, y: 335, k: 1.18 };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  realU: ChannelRef<number>;
  fakeU: ChannelRef<number>;
  dU: ChannelRef<number>; // discriminator curve reveal
  texU: ChannelRef<number>;
  runSel: ChannelRef<number>; // 0 = FLEX run, 1 = NARROW run
  prog: ChannelRef<number>; // iteration progress for the selected run
  traceU: ChannelRef<number>; // mu trace chart
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const realU = tl.channel('realU', 0);
  const fakeU = tl.channel('fakeU', 0);
  const dU = tl.channel('dU', 0);
  const texU = tl.channel('texU', 0);
  const runSel = tl.channel('runSel', 0);
  const prog = tl.channel('prog', 0);
  const traceU = tl.channel('traceU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the game ————————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Real data lives in two neighborhoods: a hump around minus two and a hump around plus two. A forger must learn to produce numbers that pass for real.',
  });
  tl.tween(realU, 1, { at: 0.4, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_MAIN, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'The trick of the generative adversarial network: instead of scoring the forger with math, hire a detective. The detective learns to tell real from fake; the forger learns to fool the detective.',
    tex: '\\min_G \\max_D\\; \\mathbb{E}[\\log D(x)] + \\mathbb{E}[\\log(1 - D(G(z)))]',
  });
  tl.tween(texU, 1, { at: 7.4, dur: 0.8, ease: ease.enter });
  tl.hold(12.5, 0.6);

  // — Beat 2 · the players ————————————————————————————————————————————————
  tl.caption({
    at: 13.1,
    dur: 5.6,
    text: 'The orange curve is the forger: it turns random noise into numbers, and it starts as one clueless blob near zero. The rose curve below is the detective’s verdict at every point: one means real, zero means fake.',
  });
  tl.tween(fakeU, 1, { at: 13.6, dur: 1.2, ease: ease.draw });
  tl.tween(dU, 1, { at: 15.4, dur: 1.2, ease: ease.draw });
  tl.hold(18.9, 0.6);

  // — Beat 3 · the flexible run ————————————————————————————————————————————
  tl.tween(badgeU, 1, { at: 19.3, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 19.5,
    dur: 6.0,
    text: 'Now they train in alternation, real gradient steps on both sides. The detective digs valleys wherever fakes cluster, and the forger flows away from every valley the detective digs.',
  });
  tl.tween(prog, 120, { at: 20.2, dur: 5.4, ease: ease.linear });
  tl.caption({
    at: 25.9,
    dur: 5.8,
    text: 'Watch where this forger settles: it stretches itself into one wide blur draped across both neighborhoods. It fools the detective on average, by being specifically like nothing.',
  });
  tl.tween(prog, FLEX_ITERS, { at: 26.4, dur: 5.2, ease: ease.linear });
  tl.hold(31.9, 0.6);

  // — Beat 4 · the narrow forger, mode collapse ————————————————————————————
  tl.caption({
    at: 32.5,
    dur: 5.4,
    text: 'Second experiment. Give the forger a fixed narrow width, so blurring is no longer an option. It must commit. Same game, new recording.',
  });
  tl.set(runSel, 1, 33.0);
  tl.set(prog, 0, 33.0);
  tl.tween(traceU, 1, { at: 33.4, dur: 1.2, ease: ease.draw });
  tl.tween(prog, 90, { at: 34.4, dur: 3.4, ease: ease.linear });
  tl.caption({
    at: 38.1,
    dur: 6.0,
    text: 'It lunges toward the nearest applause, overshoots, and then locks onto the plus two neighborhood. Half of reality, the entire hump at minus two, is simply never produced again.',
  });
  tl.tween(prog, NARROW_ITERS, { at: 38.6, dur: 6.6, ease: ease.linear });
  tl.caption({
    at: 44.5,
    dur: 5.6,
    text: 'This is mode collapse, and the chart of the forger’s center tells the honest story: a jump, a wobble, and a permanent home in one mode. The detective keeps objecting; the forger has stopped listening.',
  });
  tl.hold(50.3, 0.6);

  // — Beat 5 · why the game is hard ————————————————————————————————————————
  tl.caption({
    at: 50.9,
    dur: 6.2,
    text: 'Notice what made this fragile: there is no loss curve marching downhill. Two objectives pull against each other, and the pair can orbit, stall, or collapse. Adversarial training buys sharpness at the price of stability.',
  });
  tl.hold(57.3, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 57.9, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 57.9, dur: 0.8, ease: ease.move });
  tl.tween(badgeU, 0, { at: 57.9, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 59.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 59.1,
    dur: 5.6,
    text: 'That is the adversarial family: no probabilities anywhere, just a forger judged by a learned critic. When it works, samples are strikingly sharp. When it fails, whole modes of reality quietly vanish.',
  });
  tl.caption({
    at: 65.1,
    dur: 5.2,
    text: 'One family organizes codes, one plays a game. The final chapter maps the whole family tree, including the model that generates by walking noise backward.',
  });
  tl.hold(70.5, 1.2);

  return { tl, cam, realU, fakeU, dU, texU, runSel, prog, traceU, badgeU, dimU, endU };
}

export { STAGE_W, STAGE_H };
