import { interpolateRgb } from 'd3';
import { Timeline, ease, mulberry32, colors } from '../../core';
import type { ChannelRef, SceneState } from '../../core';
import type { ParticlePoint } from '../../primitives';

/**
 * Bayes' Theorem — Thinking in Populations.
 *
 * The classic screening problem, done as a headcount: 2,000 people, 1%
 * prevalence, a test with 90% sensitivity and a 9% false-positive rate.
 * That's 20 sick (18 test positive, 2 don't) and 1,980 healthy (178 test
 * positive, 1,802 don't) — so P(sick | +) = 18 / 196 ≈ 9%.
 *
 * Every particle owns FOUR precomputed positions, one per formation, all
 * derived at module scope from a single seed (mulberry32(3)):
 *   F0 grid      — the whole population in a rounded rectangle
 *   F1 prevalence— the 20 sick pulled out into a thin left column
 *   F2 cluster   — the 196 positives regrouped center-stage (phyllotaxis)
 *   F3 split     — within the cluster, 18 true positives vs 178 false ones
 * The rendered position is a chained lerp between consecutive formations
 * driven by the formation-blend channels (prevU, clusterU, splitU) — the
 * diffusion explainer's approach — so every frame is a pure function of the
 * sampled state and the whole piece scrubs exactly.
 */

/* ————— the counts (hardcoded, exact) ————— */

export const TOTAL = 2000;
export const SICK = 20; // 1% prevalence
export const TRUE_POS = 18; // 90% sensitivity → 18 of 20
export const FALSE_POS = 178; // 9% of 1,980 ≈ 178
export const POSITIVES = TRUE_POS + FALSE_POS; // 196

/* ————— stage geometry (1280×720; captions own y ≳ 633) ————— */

export const FRAME = { x: 230, y: 78, w: 820, h: 492, rx: 18 };
export const COL = { x: 150, y0: 176, dy: 17 }; // the thin sick column
export const BRACE = { x: 126, cy: 337.5, half: 172 }; // vertical brace beside it
export const CLUSTER = { cx: 640, cy: 328, spacing: 7.9 };
export const SICK_BLOCK = { cx: 452, cy: 328, cols: 3, sp: 16.5 };
export const H_BLOCK = { cx: 692, cy: 328, cols: 15, sp: 16.5 };

const GRID_COLS = 50;
const GRID_ROWS = 40;
const GRID_X0 = 252;
const GRID_DX = 776 / (GRID_COLS - 1);
const GRID_Y0 = 100;
const GRID_DY = 448 / (GRID_ROWS - 1);
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/* ————— roles ————— */

export const H_NEG = 0;
export const H_POS = 1;
export const SICK_POS = 2;
export const SICK_NEG = 3;

/* ————— precomputed per-dot data (module scope, seed fixed) ————— */

const rand = mulberry32(3);

const GX = new Float64Array(TOTAL); // F0: jittered grid
const GY = new Float64Array(TOTAL);
const X1 = new Float64Array(TOTAL); // F1: prevalence column (sick only move)
const Y1 = new Float64Array(TOTAL);
const X2 = new Float64Array(TOTAL); // F2: mixed positive cluster
const Y2 = new Float64Array(TOTAL);
const X3 = new Float64Array(TOTAL); // F3: split cluster (18 | 178)
const Y3 = new Float64Array(TOTAL);
const FADE = new Float64Array(TOTAL); // entrance stagger key
const FIRE = new Float64Array(TOTAL); // test light-up stagger key
const FLY = new Float64Array(TOTAL); // cluster-flight stagger key
const LIFT = new Float64Array(TOTAL); // arc height during the flight (positives)
const KA = new Float64Array(TOTAL); // prevalence-drift stagger key (sick)
const SCORE = new Float64Array(TOTAL); // uniform score → random role assignment
export const ROLE = new Uint8Array(TOTAL);

for (let i = 0; i < TOTAL; i++) {
  const col = i % GRID_COLS;
  const row = (i / GRID_COLS) | 0;
  GX[i] = GRID_X0 + col * GRID_DX + (rand() * 2 - 1) * 4;
  GY[i] = GRID_Y0 + row * GRID_DY + (rand() * 2 - 1) * 3.4;
  FADE[i] = rand();
  FIRE[i] = rand();
  FLY[i] = rand();
  LIFT[i] = 20 + 50 * rand(); // zeroed below for non-positives
  SCORE[i] = rand();
}

// Random-but-deterministic roles: sort by a uniform score, take the first 20
// as sick (18 of those positive), the next 178 as healthy positives.
const ORDER = Array.from({ length: TOTAL }, (_, i) => i).sort((a, b) => SCORE[a] - SCORE[b]);
const SICK_RANK = new Int16Array(TOTAL).fill(-1);
for (let r = 0; r < SICK; r++) {
  const i = ORDER[r];
  ROLE[i] = r < TRUE_POS ? SICK_POS : SICK_NEG;
  SICK_RANK[i] = r;
}
for (let j = 0; j < FALSE_POS; j++) ROLE[ORDER[SICK + j]] = H_POS;

// F1: sick dots file into the thin left column, top-down; everyone else stays.
for (let i = 0; i < TOTAL; i++) {
  X1[i] = GX[i];
  Y1[i] = GY[i];
  const r = SICK_RANK[i];
  if (r >= 0) {
    X1[i] = COL.x;
    Y1[i] = COL.y0 + r * COL.dy;
    KA[i] = (r / (SICK - 1)) * 0.35;
  }
  if (ROLE[i] === H_NEG || ROLE[i] === SICK_NEG) LIFT[i] = 0;
}

// F2: the 196 positives regroup as one phyllotaxis blob, sick dots peppered
// through it (slot order sorted by the FIRE key = a seeded shuffle).
const POS_IDX: number[] = [];
for (let i = 0; i < TOTAL; i++) {
  X2[i] = X1[i];
  Y2[i] = Y1[i];
  if (ROLE[i] === SICK_POS || ROLE[i] === H_POS) POS_IDX.push(i);
}
const SLOT_ORDER = [...POS_IDX].sort((a, b) => FIRE[a] - FIRE[b]);
SLOT_ORDER.forEach((i, k) => {
  const rad = CLUSTER.spacing * Math.sqrt(k + 0.6);
  const ang = k * GOLDEN;
  X2[i] = CLUSTER.cx + rad * Math.cos(ang);
  Y2[i] = CLUSTER.cy + rad * Math.sin(ang);
});

// F3: within the cluster, true positives gather into a tight block on the
// left; false positives regrid on the right (15 columns, last row of 13).
let hRank = 0;
for (let i = 0; i < TOTAL; i++) {
  X3[i] = X2[i];
  Y3[i] = Y2[i];
  if (ROLE[i] === SICK_POS) {
    const r = SICK_RANK[i];
    X3[i] = SICK_BLOCK.cx + ((r % SICK_BLOCK.cols) - 1) * SICK_BLOCK.sp;
    Y3[i] = SICK_BLOCK.cy + (((r / SICK_BLOCK.cols) | 0) - 2.5) * SICK_BLOCK.sp;
  } else if (ROLE[i] === H_POS) {
    const row = (hRank / H_BLOCK.cols) | 0;
    const col = hRank % H_BLOCK.cols;
    const rowCount = row === 11 ? 13 : H_BLOCK.cols;
    X3[i] = H_BLOCK.cx + (col - (rowCount - 1) / 2) * H_BLOCK.sp;
    Y3[i] = H_BLOCK.cy + (row - 5.5) * H_BLOCK.sp;
    hRank++;
  }
}

/* ————— color ramps (precomputed; no string interpolation per frame) ————— */

const mkRamp = (a: string, b: string): string[] => {
  const f = interpolateRgb(a, b);
  return Array.from({ length: 33 }, (_, k) => f(k / 32));
};
const RAMP_SICK = mkRamp(colors.MUTED, colors.NEGATIVE); // healthy-looking → rose
const RAMP_HPOS = mkRamp(colors.MUTED, colors.WARM); // healthy → warm tint
const RAMP_EVID = mkRamp(colors.WARM, colors.ACCENT); // test-warm → evidence-sky (beat-6 pulse)

/* ————— channels + timeline ————— */

export interface BayesChannels {
  /** population frame opacity */
  frameU: ChannelRef<number>;
  /** per-dot staggered entrance of the 2,000 */
  entU: ChannelRef<number>;
  /** F0 → F1: the 20 sick turn rose and drift to the left column */
  prevU: ChannelRef<number>;
  /** prevalence brace draw-on */
  braceU: ChannelRef<number>;
  /** test light-up, sick dots (18 of 20 ring warm) */
  testSickU: ChannelRef<number>;
  /** test light-up, healthy dots (a 178-dot scattering tints warm) */
  testHealthyU: ChannelRef<number>;
  /** negatives dim to near-invisible; scene chrome fades with them */
  dimU: ChannelRef<number>;
  /** F1 → F2: all 196 positives fly out and regroup center-stage */
  clusterU: ChannelRef<number>;
  /** F2 → F3: the 18 true positives gather to one side */
  splitU: ChannelRef<number>;
  /** live fraction count-up: 0 → 18 of 196 */
  countU: ChannelRef<number>;
  /** beat-5 posterior math opacity */
  mathU: ChannelRef<number>;
  /** beat-6 general formula opacity */
  formulaU: ChannelRef<number>;
  /** factor pulses: likelihood P(B|A), prior P(A), evidence P(B) */
  hlLik: ChannelRef<number>;
  hlPrior: ChannelRef<number>;
  hlEvid: ChannelRef<number>;
}

export function buildScene(): { tl: Timeline; ch: BayesChannels } {
  const tl = new Timeline();
  const ch: BayesChannels = {
    frameU: tl.channel('frameU', 0),
    entU: tl.channel('entU', 0),
    prevU: tl.channel('prevU', 0),
    braceU: tl.channel('braceU', 0),
    testSickU: tl.channel('testSickU', 0),
    testHealthyU: tl.channel('testHealthyU', 0),
    dimU: tl.channel('dimU', 0),
    clusterU: tl.channel('clusterU', 0),
    splitU: tl.channel('splitU', 0),
    countU: tl.channel('countU', 0),
    mathU: tl.channel('mathU', 0),
    formulaU: tl.channel('formulaU', 0),
    hlLik: tl.channel('hlLik', 0),
    hlPrior: tl.channel('hlPrior', 0),
    hlEvid: tl.channel('hlEvid', 0),
  };

  // Beat 1 — 2,000 dots fill the rounded rectangle.
  tl.tween(ch.frameU, 1, { at: 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(ch.entU, 1, { at: 0.5, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Forget probabilities for a minute — think about people. Here are two thousand of them.',
  });
  tl.caption({
    at: 6.7,
    dur: 4.1,
    text: 'One of them — say, you — is about to get tested for a rare disease.',
  });
  tl.hold(10.8, 0.4);

  // Beat 2 — prevalence: 20 dots turn rose and drift to the thin left column.
  tl.caption({
    at: 11.2,
    dur: 6.2,
    text: 'About 1% actually have it. Twenty people. Before any test, this is all you know — the prior.',
  });
  tl.tween(ch.prevU, 1, { at: 11.5, dur: 1.7, ease: ease.move });
  tl.tween(ch.braceU, 1, { at: 13.4, dur: 0.9, ease: ease.draw });
  tl.hold(17.4, 1.0);

  // Beat 3 — the test runs: rings and brightness, sick first, then the
  // scattering of healthy dots that light up anyway.
  tl.caption({
    at: 18.4,
    dur: 6.4,
    text: "Now run the test. It's good: it catches 90% of the sick. Eighteen of the twenty light up.",
  });
  tl.tween(ch.testSickU, 1, { at: 19.0, dur: 1.3, ease: ease.move });
  tl.caption({
    at: 25.4,
    dur: 7.0,
    text: 'But it also fires on 9% of the healthy — 178 people. Not because the test is bad. Because there are SO many of them.',
  });
  tl.tween(ch.testHealthyU, 1, { at: 26.0, dur: 2.4, ease: ease.move });
  tl.hold(32.4, 1.0);

  // Beat 4 — THE MOVE: every positive flies out and regroups center-stage;
  // everyone who tested negative fades to a ghost.
  tl.caption({
    at: 33.4,
    dur: 6.6,
    text: 'You tested positive. Congratulations: you live here now, with everyone else who lit up.',
  });
  tl.tween(ch.dimU, 1, { at: 33.7, dur: 1.3, ease: ease.move });
  tl.tween(ch.clusterU, 1, { at: 34.3, dur: 2.8, ease: ease.move });
  tl.hold(37.1, 3.9);

  // Beat 5 — count who's left: 18 true positives gather to one side, the
  // fraction counts up live, and the posterior lands.
  tl.caption({
    at: 41.0,
    dur: 5.2,
    text: "So of the people in your new world, how many are actually sick? Don't calculate. Count.",
  });
  tl.tween(ch.splitU, 1, { at: 41.6, dur: 1.8, ease: ease.move });
  tl.tween(ch.countU, 1, { at: 43.6, dur: 2.0, ease: ease.linear });
  tl.tween(ch.mathU, 1, { at: 45.9, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 47.0,
    dur: 5.8,
    text: 'Eighteen out of 196. About 9%. Not 90 — the prior did most of the work.',
  });
  tl.hold(52.8, 0.4);

  // Beat 6 — the formula lands, each factor pulsing its dots: likelihood
  // (warm, the 18), prior (rose, all 20 sick), evidence (sky, all 196).
  tl.tween(ch.mathU, 0, { at: 53.2, dur: 0.7, ease: ease.move });
  tl.tween(ch.formulaU, 1, { at: 53.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 53.8,
    dur: 6.4,
    text: "That's the whole formula. Every factor is a headcount you just watched.",
  });
  tl.tween(ch.hlLik, 1, { at: 55.6, dur: 0.5, ease: ease.pulse });
  tl.tween(ch.hlLik, 0, { at: 56.8, dur: 0.8, ease: ease.pulse });
  tl.tween(ch.hlPrior, 1, { at: 57.7, dur: 0.5, ease: ease.pulse });
  tl.tween(ch.hlPrior, 0, { at: 58.9, dur: 0.8, ease: ease.pulse });
  tl.tween(ch.hlEvid, 1, { at: 59.8, dur: 0.5, ease: ease.pulse });
  tl.tween(ch.hlEvid, 0, { at: 61.0, dur: 0.8, ease: ease.pulse });
  tl.caption({
    at: 60.9,
    dur: 3.8,
    text: "Bayes' theorem is just counting who's left.",
  });
  tl.hold(64.7, 0.7); // final hold — the closing line breathes; total 65.4

  return { tl, ch };
}

/* ————— per-frame particle compute (tight: no allocation) ————— */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const smooth = (u: number) => u * u * (3 - 2 * u);

// Preallocated point objects, reused every frame: a core per dot, plus a
// warm ring + soft halo for dots the test lights up.
const CORE: ParticlePoint[] = Array.from({ length: TOTAL }, () => ({
  x: 0,
  y: 0,
  r: 2.3,
  alpha: 0,
  color: colors.MUTED,
}));
const RING: ParticlePoint[] = Array.from({ length: TOTAL }, () => ({
  x: 0,
  y: 0,
  r: 4,
  alpha: 0,
  color: colors.WARM,
}));
const HALO: ParticlePoint[] = Array.from({ length: TOTAL }, () => ({
  x: 0,
  y: 0,
  r: 8,
  alpha: 0,
  color: colors.WARM,
}));
const OUT: ParticlePoint[] = [];

/**
 * The whole mechanic: position = F0 + (F1−F0)·A + (F2−F1)·B + (F3−F2)·C,
 * with A/B/C per-dot staggered views of the formation-blend channels, plus a
 * small arc lift during the beat-4 flight. Called from ParticleCloud.
 */
export function computeParticles(s: SceneState, ch: BayesChannels): ParticlePoint[] {
  const entU = s.get(ch.entU);
  const prevU = s.get(ch.prevU);
  const tSick = s.get(ch.testSickU);
  const tHealthy = s.get(ch.testHealthyU);
  const dimU = s.get(ch.dimU);
  const clU = s.get(ch.clusterU);
  const spU = s.get(ch.splitU);
  const hlPrior = s.get(ch.hlPrior);
  const hlLik = s.get(ch.hlLik);
  const hlEvid = s.get(ch.hlEvid);
  // during the evidence pulse, every positive's glow shifts warm → sky
  const evidColor = RAMP_EVID[Math.round(clamp01(hlEvid) * 32)];

  OUT.length = 0;
  for (let i = 0; i < TOTAL; i++) {
    const ent = clamp01((entU - FADE[i] * 0.6) / 0.4);
    if (ent <= 0.001) continue;
    const role = ROLE[i];
    const sick = role === SICK_POS || role === SICK_NEG;
    const positive = role === SICK_POS || role === H_POS;

    const A = sick ? clamp01((prevU - KA[i]) / 0.65) : 0;
    let B = 0;
    let C = 0;
    if (positive) {
      B = smooth(clamp01((clU - FLY[i] * 0.45) / 0.55));
      C = smooth(clamp01((spU - FLY[i] * 0.25) / 0.75));
    }

    const x = GX[i] + (X1[i] - GX[i]) * A + (X2[i] - X1[i]) * B + (X3[i] - X2[i]) * C;
    const y =
      GY[i] +
      (Y1[i] - GY[i]) * A +
      (Y2[i] - Y1[i]) * B +
      (Y3[i] - Y2[i]) * C -
      LIFT[i] * Math.sin(Math.PI * B);

    // outcome glow: 0 → 1 as the test fires on this dot (scattered order)
    let g = 0;
    if (role === SICK_POS) g = clamp01((tSick - FIRE[i] * 0.5) / 0.5);
    else if (role === H_POS) g = clamp01((tHealthy - FIRE[i] * 0.7) / 0.3);

    // beat-6 factor pulses: each factor of the formula re-lights its headcount
    // — likelihood (the 18), prior (all 20 sick), evidence (all 196 positives)
    let pulse = 0;
    if (role === SICK_POS) pulse = Math.max(hlLik, hlPrior, hlEvid);
    else if (role === H_POS) pulse = hlEvid;
    else if (role === SICK_NEG) pulse = hlPrior;

    let alpha: number;
    let color: string;
    if (role === H_NEG) {
      alpha = 0.6;
      color = colors.MUTED;
    } else if (role === H_POS) {
      alpha = 0.6 + 0.35 * g;
      color = RAMP_HPOS[Math.round(g * 32)];
    } else {
      alpha = 0.6 + 0.35 * A;
      color = RAMP_SICK[Math.round(A * 32)];
    }
    alpha *= ent;
    if (!positive) {
      alpha *= 1 - 0.93 * dimU; // negatives dim to near-invisible…
      // …except the 2 sick negatives, which flash back during the prior pulse
      if (role === SICK_NEG) alpha = Math.max(alpha, 0.9 * hlPrior * ent);
    }
    if (pulse > 0) alpha = Math.min(1, alpha + 0.35 * pulse * ent);

    // positives grow as they regroup; a pulsed dot swells a touch more
    const r = 2.3 + (positive ? 1.7 * B : 0) + 1.6 * pulse;

    if (g > 0.02) {
      const h = HALO[i];
      h.x = x;
      h.y = y;
      h.r = r + 6;
      h.alpha = (0.16 * g + 0.3 * pulse) * ent;
      h.color = evidColor;
      OUT.push(h);
      const q = RING[i];
      q.x = x;
      q.y = y;
      q.r = r + 1.7;
      q.alpha = 0.9 * g * ent;
      q.color = evidColor;
      OUT.push(q);
    }
    const p = CORE[i];
    p.x = x;
    p.y = y;
    p.r = r;
    p.color = color;
    p.alpha = alpha;
    OUT.push(p);
  }
  return OUT;
}
