import { scaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, ease, mulberry32, colors } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import type { ParticlePoint } from '../../primitives';

/**
 * The Central Limit Theorem — Order from Chaos.
 *
 * One mechanic: dice sums as falling particles. For each phase N ∈ {1, 2, 5,
 * 30} we precompute 900 seeded sample sums (mulberry32(21), module scope),
 * standardize them onto a shared x-axis, z = (sum − 3.5N)/√(N·35/12), and
 * grid-stack each sample into its histogram bin (bin → x, stack slot → y).
 * The rain is ONE `drop` channel with a per-particle derived stagger; each
 * N→N transition is ONE blend channel that lerps every particle between two
 * precomputed layouts. Every frame is a pure function of the sampled state —
 * no per-frame randomness, nothing self-animates (the scrubbability
 * invariant).
 */

/* ————— stage geometry (1280×720; captions own the bottom ~12%) ————— */

export const BASE_Y = 560; // histogram floor / axis line
export const SAMPLES = 900;
export const NS = [1, 2, 5, 30] as const;
export const PHASES = NS.length;

const CELL = 6; // stacking grid pitch in px (particle r = 2.3)
export const DOT_R = 2.3;

/** Shared standardized axis: z ∈ [−3.6, 3.6] → stage x. */
export const zx = scaleLinear([-3.6, 3.6], [190, 1090]);

/** σ of a single die; σ of the sum of N dice is √N times this. */
const DIE_SD = Math.sqrt(35 / 12);
const sigmaOf = (n: number) => Math.sqrt(n) * DIE_SD;
const zOf = (sum: number, n: number) => (sum - 3.5 * n) / sigmaOf(n);

/**
 * Beat 1's die number line (faces 1..6) is pinned so face k sits exactly at
 * zx(z(k, 1)) — the exact-distribution bars pop precisely where the N = 1
 * particle columns will later land.
 */
const FACE_SPACING = zx(zOf(2, 1)) - zx(zOf(1, 1)); // ≈ 73 px between faces
export const dieScale = scaleLinear(
  [0.5, 6.5],
  [zx(zOf(1, 1)) - FACE_SPACING / 2, zx(zOf(6, 1)) + FACE_SPACING / 2],
);
export const DIE_BAR_W = 58;
export const DIE_BAR_H = 132; // exact P = 1/6, display-scaled

/* ————— precomputed data (module scope, seed fixed) ————— */

const rand = mulberry32(21);

/** Per-phase, per-particle final stacked positions. */
const LX: Float64Array[] = [];
const LY: Float64Array[] = [];
/** Per-phase bin geometry, exported for the render layer if ever needed. */
export const PHASE_COLS: number[] = [];

for (let p = 0; p < PHASES; p++) {
  const n = NS[p];
  const spacingPx = (zx(1) - zx(0)) / sigmaOf(n); // px between adjacent sums
  const cols = Math.max(1, Math.floor(spacingPx / CELL));
  PHASE_COLS.push(cols);

  const xs = new Float64Array(SAMPLES);
  const ys = new Float64Array(SAMPLES);
  const slotOf = new Map<number, number>(); // sum value → next stack slot
  for (let i = 0; i < SAMPLES; i++) {
    let sum = 0;
    for (let d = 0; d < n; d++) sum += 1 + Math.floor(rand() * 6);
    const slot = slotOf.get(sum) ?? 0;
    slotOf.set(sum, slot + 1);
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    xs[i] = zx(zOf(sum, n)) + (col - (cols - 1) / 2) * CELL;
    ys[i] = BASE_Y - CELL / 2 - row * CELL;
  }
  LX.push(xs);
  LY.push(ys);
}

/** Per-particle stagger keys — one array per phase, all drawn from the seed. */
const STAG: Float64Array[] = [];
for (let p = 0; p < PHASES; p++) {
  const a = new Float64Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) a[i] = rand();
  STAG.push(a);
}

/** Rain entry heights (just above the canvas top edge, slightly varied). */
const START_Y = new Float64Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) START_Y[i] = -24 - rand() * 70;

/** Tiny fixed per-particle jitter so the grid reads organic, not mechanical. */
const JX = new Float64Array(SAMPLES);
const JY = new Float64Array(SAMPLES);
for (let i = 0; i < SAMPLES; i++) {
  JX[i] = (rand() - 0.5) * 1.4;
  JY[i] = (rand() - 0.5) * 1.2;
}

/* ————— the Gaussian overlay —————
 * Histogram column height in px is count·CELL/cols, and the expected count
 * in a one-sum-wide bin is SAMPLES·φ(z)·Δz, so the matching curve is
 * h(z) = A·φ(z) with A = SAMPLES·Δz·CELL/cols — a per-phase constant the
 * `gaussA` channel tweens between phases.
 */

const PHI = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
const gaussAmpOf = (p: number) =>
  ((SAMPLES * CELL) / PHASE_COLS[p]) * (1 / sigmaOf(NS[p]));

export const GAUSS_A5 = gaussAmpOf(2); // N = 5 phase
export const GAUSS_A30 = gaussAmpOf(3); // N = 30 phase
export const gaussPdf = PHI;

/* ————— channels + timeline ————— */

export interface CLTChannels {
  /** beat-1 die number line draw-on */
  dieReveal: ChannelRef<number>;
  /** beat-1 die number line opacity (fades when the standardized axis takes over) */
  dieLineU: ChannelRef<number>;
  /** the six exact-distribution bars (ease.pop) */
  barPop: ChannelRef<number>[];
  /** group fade for the bars once the rain starts */
  dieBarsU: ChannelRef<number>;
  /** P = 1/6 label opacity */
  dieTexU: ChannelRef<number>;
  /** standardized axis draw-on */
  axisU: ChannelRef<number>;
  /** THE rain channel: every particle's fall derives its stagger from this */
  drop: ChannelRef<number>;
  /** blend channels: layout k → layout k+1 (one per N-transition) */
  m12: ChannelRef<number>;
  m25: ChannelRef<number>;
  m530: ChannelRef<number>;
  /** Gaussian overlay draw-on, glow-up, and amplitude */
  gaussReveal: ChannelRef<number>;
  gaussGlow: ChannelRef<number>;
  gaussA: ChannelRef<number>;
  /** the CLT statement */
  clTexU: ChannelRef<number>;
  cam: ChannelRef<CameraState>;
}

export function buildScene(): { tl: Timeline; ch: CLTChannels } {
  const tl = new Timeline();
  const ch: CLTChannels = {
    dieReveal: tl.channel('dieReveal', 0),
    dieLineU: tl.channel('dieLineU', 1),
    barPop: Array.from({ length: 6 }, (_, k) => tl.channel(`barPop${k + 1}`, 0)),
    dieBarsU: tl.channel('dieBarsU', 1),
    dieTexU: tl.channel('dieTexU', 0),
    axisU: tl.channel('axisU', 0),
    drop: tl.channel('drop', 0),
    m12: tl.channel('m12', 0),
    m25: tl.channel('m25', 0),
    m530: tl.channel('m530', 0),
    gaussReveal: tl.channel('gaussReveal', 0),
    gaussGlow: tl.channel('gaussGlow', 0),
    gaussA: tl.channel('gaussA', GAUSS_A5),
    clTexU: tl.channel('clTexU', 0),
    cam: tl.channel<CameraState>('cam', CAMERA_HOME),
  };

  // ---- beat 1: one die, the exact (flat) distribution ---------------------
  tl.caption({
    at: 0.6,
    dur: 5.8,
    text: 'Meet one die: six faces, six equal chances, and no opinions whatsoever.',
  });
  tl.tween(ch.dieReveal, 1, { at: 0.4, dur: 1.1, ease: ease.draw });
  for (let k = 0; k < 6; k++) {
    tl.tween(ch.barPop[k], 1, { at: 1.8 + k * 0.15, dur: 0.6, ease: ease.pop });
  }
  tl.tween(ch.dieTexU, 1, { at: 3.4, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 6.8,
    dur: 4.2,
    text: 'Every face equally likely — a perfectly flat distribution. One die knows nothing.',
  });
  tl.hold(11.0, 0.6);

  // ---- beat 2: particle rain, N = 1 ---------------------------------------
  tl.caption({
    at: 11.6,
    dur: 6.2,
    text: 'Now roll it 900 times, and let every result fall where it lands.',
  });
  tl.tween(ch.dieTexU, 0, { at: 11.6, dur: 0.5, ease: ease.move });
  tl.tween(ch.dieBarsU, 0, { at: 11.9, dur: 0.9, ease: ease.move });
  tl.tween(ch.drop, 1, { at: 12.6, dur: 7.0, ease: ease.linear });
  tl.caption({ at: 19.2, dur: 3.2, text: 'Flat, as promised.' });
  tl.hold(22.4, 0.6);

  // ---- beat 3: N = 2 — the middle gets popular ----------------------------
  tl.caption({
    at: 23.0,
    dur: 5.2,
    text: 'Next: roll two dice at a time, and stack the sums instead.',
  });
  tl.tween(ch.dieLineU, 0, { at: 23.2, dur: 0.8, ease: ease.move });
  tl.tween(ch.axisU, 1, { at: 23.4, dur: 1.2, ease: ease.draw });
  tl.tween(ch.m12, 1, { at: 24.8, dur: 3.0, ease: ease.linear });
  tl.caption({
    at: 28.6,
    dur: 4.6,
    text: 'Two dice already prefer the middle — there are more ways to make 7 than 2.',
  });
  tl.hold(33.2, 0.4);

  // ---- beat 4: N = 5 — the mound, and a bell comes knocking ---------------
  tl.caption({
    at: 33.6,
    dur: 4.6,
    text: 'Five dice per roll, and a mound rises out of nowhere.',
  });
  tl.tween(ch.m25, 1, { at: 34.4, dur: 3.0, ease: ease.linear });
  tl.tween(ch.gaussReveal, 1, { at: 38.8, dur: 1.5, ease: ease.draw });
  tl.caption({
    at: 38.6,
    dur: 5.4,
    text: 'A bell curve sidles up — and almost fits. Five dice, and the bell is knocking.',
  });
  tl.hold(44.0, 0.4);

  // ---- beat 5: N = 30 — the bell moves in ---------------------------------
  tl.caption({
    at: 44.4,
    dur: 5.4,
    text: 'Thirty dice per roll. The bell stops knocking and moves in.',
  });
  tl.tween(ch.m530, 1, { at: 45.2, dur: 3.2, ease: ease.linear });
  tl.tween(ch.gaussA, GAUSS_A30, { at: 45.2, dur: 3.2, ease: ease.move });
  tl.tween(ch.gaussGlow, 1, { at: 48.8, dur: 1.4, ease: ease.move });
  tl.tween(ch.clTexU, 1, { at: 49.8, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 50.6,
    dur: 5.4,
    text: 'The individual dice never changed — the sum grew a personality.',
  });
  tl.hold(56.0, 0.4);

  // ---- beat 6: finale — the bell is everywhere ----------------------------
  tl.caption({
    at: 56.6,
    dur: 6.4,
    text: 'Heights, noise, measurement error: anything that adds up many small independent things inherits this same bell.',
  });
  tl.tween(ch.cam, { x: 640, y: 385, k: 1.07 }, { at: 57.0, dur: 4.0, ease: ease.move });
  tl.hold(63.0, 1.6);

  return { tl, ch };
}

/* ————— per-frame particle compute (tight: no allocation) ————— */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Rain: each particle's ~1s fall is a window derived from the ONE channel. */
const DROP_SPREAD = 6;
/** Morphs: each particle's re-target lasts ~55% of the blend channel. */
const MORPH_SPREAD = 0.9;
/** Re-targeting particles hop in a small arc rather than sliding flat. */
const HOP = 26;

const PTS: ParticlePoint[] = Array.from({ length: SAMPLES }, () => ({
  x: 0,
  y: 0,
  r: DOT_R,
  alpha: 0,
  color: colors.WARM,
}));
const OUT: ParticlePoint[] = [];

/**
 * The whole mechanic: sample four scalar channels, derive each particle's
 * staggered progress, lerp between the precomputed layouts. Pure in `s`.
 */
export function computeParticles(s: SceneState, ch: CLTChannels): ParticlePoint[] {
  const drop = s.get(ch.drop);
  OUT.length = 0;
  if (drop <= 0) return OUT;

  const blends = [s.get(ch.m12), s.get(ch.m25), s.get(ch.m530)];

  for (let i = 0; i < SAMPLES; i++) {
    const f = clamp01(drop * (1 + DROP_SPREAD) - STAG[0][i] * DROP_SPREAD);
    if (f <= 0) continue;

    let x = LX[0][i];
    let y = START_Y[i] + (LY[0][i] - START_Y[i]) * ease.move(f);

    for (let p = 0; p < 3; p++) {
      const b = blends[p];
      if (b <= 0) continue;
      const u = ease.move(clamp01(b * (1 + MORPH_SPREAD) - STAG[p + 1][i] * MORPH_SPREAD));
      if (u <= 0) continue;
      x += (LX[p + 1][i] - x) * u;
      y += (LY[p + 1][i] - y) * u - HOP * Math.sin(Math.PI * u);
    }

    const pt = PTS[i];
    pt.x = x + JX[i];
    pt.y = y + JY[i];
    pt.alpha = 0.92 * Math.min(1, f * 5);
    OUT.push(pt);
  }
  return OUT;
}
