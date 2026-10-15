// Squeeze the Layer
//
// Already Clean — chapter 4. Planner: Claude Sonnet 5.5 (.orly-work/visual-plan-sonnet.md, chapter 4).
// Research/source checks: Claude Haiku 5.5. D3/SVG author: requested Claude Opus 5.5 (claude-opus-5-5);
// actual claude-opus-5-5 (the model ID this session's runtime reports; no other provider used).
// Captions are the fixed narration contract, copied verbatim; claim IDs live only in the comments below.
//
// Sources (ledger IDs from .orly-work/research/neurons-claim-ledger.md):
//   S1–S4  essay section on neurons under pressure + figure details
//          https://already-clean.goodfire.com/  ·  https://already-clean.goodfire.com/essay.md
//   D1     essay section on what dictionaries learn (ConvNeXt last layer)   same URLs
//   T4     essay title note (leading hypothesis / confidence)               same URLs
//
// Measured / reported values shown on stage (all from the ledger): mixed3b 480 → 10 (48×), retrained from
// scratch, no bypass (S1–S2); 58.35% top-1 and 81.14% top-5 on ImageNet (S2); TopK SAE with 640 features and
// 2 active per position (S4); 88% of SAE activity in ConvNeXt's last layer is near-copies of single neurons, and
// removing unmatched dictionary directions leaves accuracy unchanged (D1, no number drawn for accuracy).
//
// Schematic (design choices, not data): the pipe and its waist, the 32×15 band layout, which cells are the ten
// curve detectors, the squeezed cells' colours, every tuning-rose shape (petal widths, angles, the coarse lobe,
// the four SAE-feature petals and which originals share one), the prediction glyphs, the dictionary strip layout,
// the active-feature indices, the position grid, the 10×10 activity ribbon (1 cell ≈ 1%) and which 12 cells are grey.
// The rose never shows degree values. 88% is SAE activity in a different model and is shown only after the context
// reset; it is never attached to the squeezed layer.
import { interpolateRgb } from 'd3';
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { ReactNode } from 'react';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Palette (entity-fixed)
// ---------------------------------------------------------------------------

const AMBER = colors.WARM; // the ten original curve detectors
const TEAL = colors.TEAL; // the squeezed curves-and-loops neuron
const VIOLET = colors.SECONDARY; // sparse-autoencoder features
const CYAN = '#38bdf8'; // ConvNeXt dictionary activity (separate experiment)
const WALL = '#5b6b88';
const CELL_BASE = '#3b4a66';
const GREY = '#334155';
const SQUEEZED = ['#6b7a95', '#8a7aa8', '#94755f', '#62877a', '#6f86a6', '#9c7184', '#4f7d78', '#848f60', '#64769a', '#97825a'];
const LOOPS = 6; // which squeezed cell is the curves-and-loops neuron (schematic slot)

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; load-bearing content x 60–1220, y 100–605; y ≥ 630 empty)
// ---------------------------------------------------------------------------

const YC = 250; // pipe centre line
const H0 = 81; // pipe half-height (480-cell band)
const HW = 30; // waist half-height (10 cells)
const PIPE_X0 = 70;
const PIPE_X1 = 650;
const BX0 = 160; // band x range
const BX1 = 560;
const COLS = 32;
const ROWS = 15; // 32 × 15 = 480
const PX = (BX1 - BX0) / COLS; // 12.5
const PY = 10;
const bandCx = (c: number) => BX0 + PX / 2 + c * PX;
const bandCy = (r: number) => YC - (ROWS * PY) / 2 + PY / 2 + r * PY;
const NEW_S = 32; // squeezed cell size
const newX = (i: number) => 180 + i * 40;

// tuning rose
const RX = 930;
const RY = 385;
const R = 160;
const N = 180; // angle samples
const THETA = Array.from({ length: N }, (_, k) => (2 * Math.PI * k) / N);
const angDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
};
const polar = (a: number, r: number, cx = RX, cy = RY): [number, number] => [cx + r * Math.cos(a), cy - r * Math.sin(a)];

// dictionary strip (640 features = 4 rows × 160)
const SX0 = 90;
const SX1 = 630;
const SY0 = 470;
const S_ROWS = 4;
const S_COLS = 160;
const S_PITCH = (SX1 - SX0) / S_COLS;
const S_ROW = 15;
const toothXY = (j: number): [number, number] => [SX0 + (j % S_COLS) * S_PITCH, SY0 + Math.floor(j / S_COLS) * S_ROW];

// position grid (where the two active features step)
const GX0 = 655;
const GY0 = 470;
const G_N = 6;
const G_P = 15;

// ConvNeXt activity ribbon (10×10)
const RB_X0 = 400;
const RB_Y0 = 165;
const RB_P = 36;
const RB_S = 30;
const RB_CX = RB_X0 + (RB_P * 10) / 2;
const RB_CY = RB_Y0 + (RB_P * 10) / 2;

// thumbnails (caption 13)
const THUMB_L = { x: 380, y: 360 };
const THUMB_R = { x: 900, y: 360 };
const THUMB_K = 0.6; // ribbon thumbnail scale
const LOBE_K = 0.62; // lobe thumbnail scale
const lobeInterp = interpolateRgb(AMBER, TEAL);

// cameras
const CAM_BAND: CameraState = { x: 360, y: 262, k: 1.15 };
const CAM_ROSE: CameraState = { x: 930, y: 395, k: 1.3 };
const CAM_BANK: CameraState = { x: 360, y: 250, k: 1.55 };
const CAM_COMB: CameraState = { x: 400, y: 400, k: 1.12 };
const CAM_MID: CameraState = { x: 600, y: 385, k: 1.04 };
const CAM_RIB: CameraState = { x: 660, y: 352, k: 1.07 };

// ---------------------------------------------------------------------------
// Precomputed geometry (module scope; frames only index into it)
// ---------------------------------------------------------------------------

function shuffled(n: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** the ten curve detectors: a seeded subset of the 480 cells, assigned to petal i (schematic). */
const DETECTORS = shuffled(ROWS * COLS, 4447).slice(0, 10);
const DET_SET = new Map(DETECTORS.map((cell, i) => [cell, i]));

/** ten original detectors: narrow petals 36° apart (schematic orientations, no values shown). */
const ORIG_ANG = Array.from({ length: 10 }, (_, i) => (90 - 18 + i * 36) * DEG);
const SIG_N = 7 * DEG;
const PETAL: number[][] = ORIG_ANG.map((a) => THETA.map((t) => Math.exp(-(angDist(t, a) ** 2) / (2 * SIG_N * SIG_N))));
const NARROW_FULL = THETA.map((_, k) => R * (0.05 + 0.95 * Math.max(...PETAL.map((p) => p[k]))));

/** the squeezed curves-and-loops neuron: one broad lobe over a ring (responds across orientations). */
const BROAD = THETA.map((t) => R * (0.44 + 0.2 * Math.cos(t - 55 * DEG)));

/** closest SAE features: four broad petals, bunched in two overlapping pairs; several originals share one. */
const FEAT_ANG = [40, 82, 205, 248].map((d) => d * DEG);
const SIG_F = 27 * DEG;
const FEAT_PEAK = 0.9;
const FEAT: number[][] = FEAT_ANG.map((a) => THETA.map((t) => R * (0.08 + (FEAT_PEAK - 0.08) * Math.exp(-(angDist(t, a) ** 2) / (2 * SIG_F * SIG_F)))));
const MATCH = ORIG_ANG.map((a) => {
  let best = 0;
  for (let f = 1; f < FEAT_ANG.length; f++) if (angDist(a, FEAT_ANG[f]) < angDist(a, FEAT_ANG[best])) best = f;
  return best;
});
/** match curve from an original petal tip to its closest feature's tip, bowing outward. */
const MATCH_PATH = ORIG_ANG.map((a, i) => {
  const f = FEAT_ANG[MATCH[i]];
  let d = f - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const mid = a + d / 2;
  const [x0, y0] = polar(a, R + 4);
  const [cx, cy] = polar(mid, R * (1.12 + Math.abs(d) * 0.18));
  const [x1, y1] = polar(f, R * FEAT_PEAK + 6);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
});

function polarPath(rs: number[], cx = RX, cy = RY, scale = 1): string {
  let d = '';
  for (let k = 0; k < N; k++) {
    const x = cx + rs[k] * scale * Math.cos(THETA[k]);
    const y = cy - rs[k] * scale * Math.sin(THETA[k]);
    d += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
}
const NARROW_PATH = polarPath(NARROW_FULL);
const BROAD_PATH = polarPath(BROAD);
const FEAT_PATHS = FEAT.map((rs) => polarPath(rs));

/** pipe walls for a given half-height at the band. */
function wallPath(h: number, sign: 1 | -1): string {
  const yo = YC + sign * H0;
  const yi = YC + sign * h;
  return `M${PIPE_X0},${yo} L120,${yo} C142,${yo} 140,${yi} 160,${yi} L560,${yi} C580,${yi} 578,${yo} 600,${yo} L${PIPE_X1},${yo}`;
}

/** the bypass the layer does not have, drawn on by splitting its quadratic at u (keeps its dashes). */
function bypassPath(u: number): string {
  const p0: [number, number] = [125, YC - H0 - 2];
  const p1: [number, number] = [360, YC - H0 - 80];
  const p2: [number, number] = [595, YC - H0 - 2];
  const a: [number, number] = [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u)];
  const b: [number, number] = [lerp(p1[0], p2[0], u), lerp(p1[1], p2[1], u)];
  const e: [number, number] = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  return `M${p0[0]},${p0[1]} Q${a[0].toFixed(1)},${a[1].toFixed(1)} ${e[0].toFixed(1)},${e[1].toFixed(1)}`;
}

/** prediction glyph for a squeezed cell: a curve, a spiral and a web drawn over one another. */
const SPIRAL = (() => {
  let d = '';
  for (let k = 0; k <= 48; k++) {
    const t = (k / 48) * 4 * Math.PI;
    const r = 1 + (t / (4 * Math.PI)) * 10;
    d += `${k ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(2)},${(r * Math.sin(t)).toFixed(2)}`;
  }
  return d;
})();
const WEB = (() => {
  let d = '';
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * 2 * Math.PI;
    d += `M0,0 L${(12 * Math.cos(a)).toFixed(2)},${(12 * Math.sin(a)).toFixed(2)}`;
  }
  for (const r of [5, 9]) {
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * 2 * Math.PI;
      d += `${k ? 'L' : 'M'}${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    }
  }
  return d;
})();
const MIX_ROT = (() => {
  const rand = mulberry32(3333);
  return Array.from({ length: 10 }, () => [rand() * 360, rand() * 360, rand() * 360]);
})();

/** dictionary teeth as one static path (640 thin cells). */
const TEETH_PATH = Array.from({ length: S_ROWS * S_COLS }, (_, j) => {
  const [x, y] = toothXY(j);
  return `M${x.toFixed(2)},${y} h${(S_PITCH * 0.62).toFixed(2)} v11 h${(-S_PITCH * 0.62).toFixed(2)}Z`;
}).join('');
const N_STEPS = 12;
const ACTIVE = (() => {
  const rand = mulberry32(640);
  return Array.from({ length: N_STEPS }, () => {
    const a = Math.floor(rand() * 640);
    let b = Math.floor(rand() * 640);
    if (b === a) b = (b + 97) % 640;
    return [a, b];
  });
})();
const POS = shuffled(G_N * G_N, 36).slice(0, N_STEPS);
const MATCH_TEETH = [57, 233, 401, 588]; // the four features in the strip (schematic indices)

/** ConvNeXt ribbon: 12 grey cells (no matching neuron), 88 cyan near-copies filling in a seeded order. */
const GREY_CELLS = new Set(shuffled(100, 88).slice(0, 12));
const FILL_RANK = (() => {
  const order = shuffled(100, 1088).filter((i) => !GREY_CELLS.has(i));
  const rank = new Map<number, number>();
  order.forEach((cell, r) => rank.set(cell, r));
  return rank;
})();
const LOUPE_CELL = (() => {
  for (let i = 36; i < 100; i++) if (!GREY_CELLS.has(i)) return i;
  return 36;
})();

// ---------------------------------------------------------------------------
// Captions (verbatim) and pacing
// ---------------------------------------------------------------------------

const CAPTIONS = [
  // [connective]
  "If a network lacks room, does it hide unrelated meanings together, or give each neuron a broader job?",
  // [S1]
  "Inception version one's layer three bee offers a direct test. It contains curve detectors, and the model has no residual route around it.",
  // [S2]
  "Cammarata cuts the layer from four hundred eighty neurons to ten, then trains the network from scratch. That is forty-eight times less room in this layer.",
  // [S3]
  "Under the unrelated-packing explanation, he expects overlapping mixtures of different patterns to become conspicuous.",
  // [S3]
  "Instead, he reports coarser responses. One curves-and-loops neuron takes the place of ten more specific curve detectors.",
  // [S2]
  "On Image Net, the squeezed model's top guess is right fifty-eight point three five percent of the time, and the right answer is in its top five guesses eighty-one point one four percent.",
  // [S3]
  "Coarsening keeps a shared pattern but loses fine distinctions. That is a different outcome from hiding each original detector intact inside a mixture.",
  // [S4]
  "To search for those distinctions, he trains a sparse autoencoder, a model that reconstructs the layer through a small active set of learned features.",
  // [S4]
  "This autoencoder has six hundred forty features, with only two active at each position. A larger dictionary gives it room to try to recover the curves.",
  // [S4]
  "The features closest to the original detectors are broad and bunched together. This test does not recover the ten sharp curve detectors.",
  // [D1]
  "A separate test looks at Conv Next's last layer. There, eighty-eight percent of the autoencoder's activity is on learned features that are each a near-copy of a single neuron.",
  // [D1]
  "Removing dictionary directions without a matching neuron leaves accuracy unchanged in that experiment.",
  // [S3, S4, D1]
  "These tests make the original neurons worth inspecting directly: the squeezed layer broadens, and the other dictionary mostly echoes neurons already there.",
  // [T4, S4, D1]
  "The results support Cammarata's interpretation of these models. He calls the picture a leading hypothesis, not a proof.",
];

const DUR = CAPTIONS.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
const T: number[] = [];
{
  let t = 0.6;
  for (const d of DUR) {
    T.push(t);
    t += d + 0.7;
  }
}

const CHIPS = [
  'Question · hide together, or broaden?',
  'InceptionV1 · mixed3b · schematic tuning shapes',
  'Prediction under unrelated packing · schematic',
  'Reported result · schematic tuning shapes',
  'Sparse autoencoder on the squeezed layer',
  'Separate test · ConvNeXt · last layer · SAE activity',
  'Both tests · back to the neurons',
  'Scope · a leading hypothesis, not a proof',
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chip = tl.channel('chip', 0);
  const chipIn = tl.channel('chipIn', 0);

  const pipeU = tl.channel('pipeU', 0);
  const bandU = tl.channel('bandU', 0);
  const bandLabelU = tl.channel('bandLabelU', 0);
  const bypassU = tl.channel('bypassU', 0);
  const bypassLabelU = tl.channel('bypassLabelU', 0);
  const bypassDim = tl.channel('bypassDim', 0);
  const detU = tl.channel('detU', 0);
  const braceU = tl.channel('braceU', 0);
  const roseU = tl.channel('roseU', 0);
  const flyU = tl.channel('flyU', 0);
  const petalU = tl.channel('petalU', 0);
  const roseDim = tl.channel('roseDim', 0); // 0 = full, 1 = dimmed
  const roseOff = tl.channel('roseOff', 0); // 1 = hidden while a pushed-in camera would clip it at the right edge
  const leftFade = tl.channel('leftFade', 0); // pipe side clears while the camera sits on the rose
  const wipeU = tl.channel('wipeU', 0);
  const wipeVis = tl.channel('wipeVis', 0);
  const waistU = tl.channel('waistU', 0);
  const newU = tl.channel('newU', 0);
  const tagU = tl.channel('tagU', 0);
  const predU = tl.channel('predU', 0);
  const loopsU = tl.channel('loopsU', 0);
  const lobeU = tl.channel('lobeU', 0);
  const ghostOp = tl.channel('ghostOp', 0);
  const accU = tl.channel('accU', 0);
  const acc1U = tl.channel('acc1U', 0); // top-1 figure, on its spoken words
  const acc5U = tl.channel('acc5U', 0); // top-5 figure, on its spoken words
  const bankDim = tl.channel('bankDim', 0);
  const coarseU = tl.channel('coarseU', 0);
  const combU = tl.channel('combU', 0);
  const stripU = tl.channel('stripU', 0);
  const saeLabelU = tl.channel('saeLabelU', 0);
  const topkU = tl.channel('topkU', 0);
  const posU = tl.channel('posU', 0);
  const stepU = tl.channel('stepU', 0);
  const stripDim = tl.channel('stripDim', 0);
  const lobeDim = tl.channel('lobeDim', 0);
  const featU = tl.channel('featU', 0);
  const matchU = tl.channel('matchU', 0);
  const matchLabelU = tl.channel('matchLabelU', 0);
  const archU = tl.channel('archU', 0);
  const archLabelU = tl.channel('archLabelU', 0);
  const archGone = tl.channel('archGone', 0); // archive clears once the 88% lands beside the ribbon
  const ribFrameU = tl.channel('ribFrameU', 0);
  const ribFillU = tl.channel('ribFillU', 0);
  const ribLabelU = tl.channel('ribLabelU', 0);
  const scaleNoteU = tl.channel('scaleNoteU', 0);
  const removeU = tl.channel('removeU', 0);
  const removeLabelU = tl.channel('removeLabelU', 0);
  const accOkU = tl.channel('accOkU', 0);
  const thumbU = tl.channel('thumbU', 0);
  const loupeU = tl.channel('loupeU', 0);
  const inspectU = tl.channel('inspectU', 0);
  const finalDim = tl.channel('finalDim', 0);
  const panelU = tl.channel('panelU', 0);

  // each line holds until the next starts, so the caption never blinks off between lines
  CAPTIONS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  const setChip = (idx: number, at: number) => {
    tl.set(chip, idx, at);
    tl.set(chipIn, 0, at);
    tl.tween(chipIn, 1, { at, dur: 0.5, ease: ease.enter });
  };

  // — C1 · the layer and the question —
  setChip(0, T[0]);
  tl.tween(pipeU, 1, { at: T[0] + 0.2, dur: 1.4, ease: ease.draw });
  tl.tween(bandU, 1, { at: T[0] + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(bandLabelU, 1, { at: T[0] + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_BAND, { at: T[0] + 1.0, dur: 1.5, ease: ease.move });

  // — C2 · no bypass; ten curve detectors become ten narrow petals —
  setChip(1, T[1]);
  tl.tween(bandLabelU, 0, { at: T[1], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: T[1] + 0.1, dur: 1.1, ease: ease.move });
  tl.tween(bypassU, 1, { at: T[1] + 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(bypassLabelU, 1, { at: T[1] + 1.7, dur: 0.6, ease: ease.enter });
  tl.tween(detU, 1, { at: T[1] + 3.0, dur: 0.8, ease: ease.enter });
  tl.tween(braceU, 1, { at: T[1] + 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(roseU, 1, { at: T[1] + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(flyU, 1, { at: T[1] + 5.0, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_ROSE, { at: T[1] + 6.0, dur: 1.4, ease: ease.move });
  tl.tween(leftFade, 1, { at: T[1] + 6.0, dur: 0.9, ease: ease.move });
  tl.tween(petalU, 1, { at: T[1] + 6.2, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: T[1] + 9.6, dur: 1.2, ease: ease.move });
  tl.tween(leftFade, 0, { at: T[1] + 9.9, dur: 0.9, ease: ease.move });

  // — C3 · squeeze: wipe the old layer, tighten the waist, ten new cells —
  tl.tween(bypassLabelU, 0, { at: T[2], dur: 0.5, ease: ease.move });
  tl.tween(braceU, 0, { at: T[2], dur: 0.5, ease: ease.move });
  tl.tween(bypassDim, 1, { at: T[2], dur: 0.6, ease: ease.move });
  tl.tween(roseDim, 1, { at: T[2], dur: 0.6, ease: ease.move });
  tl.tween(wipeVis, 1, { at: T[2] + 0.6, dur: 0.3, ease: ease.enter });
  tl.tween(wipeU, 1, { at: T[2] + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(wipeVis, 0, { at: T[2] + 2.4, dur: 0.4, ease: ease.move });
  tl.tween(waistU, 1, { at: T[2] + 2.7, dur: 1.3, ease: ease.move });
  tl.tween(newU, 1, { at: T[2] + 4.2, dur: 1.0, ease: ease.enter });
  tl.tween(tagU, 1, { at: T[2] + 5.6, dur: 0.6, ease: ease.enter });

  // — C4 · the unrelated-packing prediction (dashed) —
  setChip(2, T[3]);
  tl.tween(cam, CAM_BANK, { at: T[3], dur: 1.2, ease: ease.move });
  tl.tween(roseOff, 1, { at: T[3], dur: 0.6, ease: ease.move });
  tl.tween(predU, 1, { at: T[3] + 0.9, dur: 0.8, ease: ease.enter });

  // — C5 · reported instead: one curves-and-loops neuron; petals blur into one lobe —
  setChip(3, T[4]);
  tl.tween(predU, 0, { at: T[4], dur: 0.7, ease: ease.move });
  tl.tween(loopsU, 1, { at: T[4] + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_ROSE, { at: T[4] + 1.7, dur: 1.3, ease: ease.move });
  tl.tween(leftFade, 1, { at: T[4] + 1.7, dur: 0.9, ease: ease.move });
  tl.tween(roseOff, 0, { at: T[4] + 1.7, dur: 0.8, ease: ease.move });
  tl.tween(roseDim, 0, { at: T[4] + 2.2, dur: 0.6, ease: ease.move });
  tl.tween(lobeU, 1, { at: T[4] + 2.8, dur: 1.5, ease: ease.move });
  tl.tween(ghostOp, 0.2, { at: T[4] + 3.0, dur: 1.2, ease: ease.move });

  // — C6 · accuracy of the squeezed model —
  tl.tween(cam, CAMERA_HOME, { at: T[5], dur: 1.2, ease: ease.move });
  tl.tween(leftFade, 0, { at: T[5] + 0.3, dur: 0.9, ease: ease.move });
  tl.tween(accU, 1, { at: T[5] + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(acc1U, 1, { at: T[5] + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(acc5U, 1, { at: T[5] + 10.4, dur: 0.6, ease: ease.enter });

  // — C7 · coarser, not hidden —
  tl.tween(bankDim, 1, { at: T[6], dur: 0.8, ease: ease.move });
  tl.tween(ghostOp, 0.8, { at: T[6] + 0.8, dur: 0.8, ease: ease.move });
  tl.tween(coarseU, 1, { at: T[6] + 1.2, dur: 0.6, ease: ease.enter });

  // — C8 · the sparse autoencoder: a comb opens into a dictionary —
  setChip(4, T[7]);
  tl.tween(coarseU, 0, { at: T[7], dur: 0.5, ease: ease.move });
  tl.tween(ghostOp, 0.2, { at: T[7], dur: 0.6, ease: ease.move });
  tl.tween(accU, 0, { at: T[7], dur: 0.5, ease: ease.move });
  tl.tween(bankDim, 0, { at: T[7], dur: 0.8, ease: ease.move });
  tl.tween(roseDim, 1, { at: T[7], dur: 0.8, ease: ease.move });
  tl.tween(roseOff, 1, { at: T[7], dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_COMB, { at: T[7] + 0.6, dur: 1.3, ease: ease.move });
  tl.tween(combU, 1, { at: T[7] + 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(stripU, 1, { at: T[7] + 2.0, dur: 0.8, ease: ease.enter });
  tl.tween(saeLabelU, 1, { at: T[7] + 3.4, dur: 0.6, ease: ease.enter });

  // — C9 · TopK: 640 features, 2 active, stepping across positions —
  tl.tween(saeLabelU, 0, { at: T[8], dur: 0.5, ease: ease.move });
  tl.tween(topkU, 1, { at: T[8] + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_MID, { at: T[8] + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(posU, 1, { at: T[8] + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(stepU, N_STEPS, { at: T[8] + 1.8, dur: 7.2, ease: ease.linear });

  // — C10 · closest features: broad and bunched —
  tl.tween(posU, 0, { at: T[9], dur: 0.6, ease: ease.move });
  tl.tween(stripDim, 1, { at: T[9], dur: 0.8, ease: ease.move });
  tl.tween(roseDim, 0, { at: T[9], dur: 0.8, ease: ease.move });
  tl.tween(roseOff, 0, { at: T[9], dur: 0.8, ease: ease.move });
  tl.tween(lobeDim, 1, { at: T[9], dur: 0.8, ease: ease.move });
  tl.tween(bankDim, 1, { at: T[9], dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: T[9] + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(ghostOp, 0.65, { at: T[9] + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(featU, 1, { at: T[9] + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(matchU, 1, { at: T[9] + 2.0, dur: 1.6, ease: ease.draw });
  tl.tween(matchLabelU, 1, { at: T[9] + 3.8, dur: 0.6, ease: ease.enter });

  // — C11 · context reset: a separate test on ConvNeXt —
  tl.tween(archU, 1, { at: T[10], dur: 1.3, ease: ease.move });
  tl.tween(archLabelU, 1, { at: T[10] + 1.0, dur: 0.5, ease: ease.enter });
  setChip(5, T[10] + 0.9);
  tl.tween(ribFrameU, 1, { at: T[10] + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(scaleNoteU, 1, { at: T[10] + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(ribFillU, 1, { at: T[10] + 2.3, dur: 2.0, ease: ease.linear });
  tl.tween(ribLabelU, 1, { at: T[10] + 4.4, dur: 0.7, ease: ease.enter });
  tl.tween(archGone, 1, { at: T[10] + 4.0, dur: 0.7, ease: ease.move });

  // — C12 · remove unmatched directions; accuracy unchanged —
  tl.tween(scaleNoteU, 0, { at: T[11], dur: 0.5, ease: ease.move });
  tl.tween(archLabelU, 0, { at: T[11], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_RIB, { at: T[11] + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(removeU, 1, { at: T[11] + 0.5, dur: 1.2, ease: ease.move });
  tl.tween(removeLabelU, 1, { at: T[11] + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(accOkU, 1, { at: T[11] + 2.2, dur: 0.5, ease: ease.pop });

  // — C13 · back to the neurons: two thumbnails, two loupes —
  setChip(6, T[12]);
  tl.tween(removeLabelU, 0, { at: T[12], dur: 0.5, ease: ease.move });
  tl.tween(accOkU, 0, { at: T[12], dur: 0.5, ease: ease.move });
  tl.tween(ribLabelU, 0, { at: T[12], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: T[12], dur: 1.2, ease: ease.move });
  tl.tween(thumbU, 1, { at: T[12] + 0.5, dur: 1.4, ease: ease.move });
  tl.tween(loupeU, 1, { at: T[12] + 2.2, dur: 0.7, ease: ease.enter });
  tl.tween(inspectU, 1, { at: T[12] + 3.0, dur: 0.6, ease: ease.enter });

  // — C14 · scope, on an opaque panel —
  setChip(7, T[13]);
  tl.tween(finalDim, 1, { at: T[13], dur: 0.9, ease: ease.move });
  tl.tween(panelU, 1, { at: T[13] + 0.7, dur: 0.8, ease: ease.enter });
  tl.hold(T[13] + DUR[13], 1.2);

  return {
    tl, cam, chip, chipIn, pipeU, bandU, bandLabelU, bypassU, bypassLabelU, bypassDim, detU, braceU, roseU, flyU,
    petalU, roseDim, roseOff, leftFade, wipeU, wipeVis, waistU, newU, tagU, predU, loopsU, lobeU, ghostOp, accU, acc1U, acc5U, bankDim, coarseU,
    combU, stripU, saeLabelU, topkU, posU, stepU, stripDim, lobeDim, featU, matchU, matchLabelU, archU, archLabelU,
    archGone, ribFrameU, ribFillU, ribLabelU, scaleNoteU, removeU, removeLabelU, accOkU, thumbU, loupeU, inspectU, finalDim,
    panelU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

/** the curves-and-loops glyph: nested arcs and one small loop (schematic). */
function LoopsGlyph({ x, y, s = 1, color = TEAL, opacity = 1 }: { x: number; y: number; s?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.01) return null;
  const arc = (r: number) => {
    const a0 = 200 * DEG;
    const a1 = 340 * DEG;
    return `M${(r * Math.cos(a0)).toFixed(2)},${(-r * Math.sin(a0) + 4).toFixed(2)} A${r},${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(2)},${(-r * Math.sin(a1) + 4).toFixed(2)}`;
  };
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity} fill="none" stroke={color} strokeLinecap="round">
      <path d={arc(5)} strokeWidth={2} transform="rotate(180) translate(0,-6)" />
      <path d={arc(9)} strokeWidth={2} transform="rotate(180) translate(0,-6)" />
      <path d={arc(13)} strokeWidth={2} transform="rotate(180) translate(0,-6)" />
      <circle cx={6} cy={-7} r={3.6} strokeWidth={1.8} />
    </g>
  );
}

function Loupe({ x, y, r, u, children }: { x: number; y: number; r: number; u: number; children: ReactNode }) {
  if (u <= 0.01) return null;
  const hx = x + r * 0.72;
  const hy = y + r * 0.72;
  return (
    <g opacity={u}>
      <line x1={hx} y1={hy} x2={hx + 26} y2={hy + 26} stroke="#cbd5e1" strokeWidth={7} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill={colors.BG} stroke="#cbd5e1" strokeWidth={3} />
      {children}
    </g>
  );
}

function Chip({ text, u }: { text: string; u: number }) {
  const w = text.length * 10.2 + 42;
  return (
    <g opacity={0.35 + 0.65 * u}>
      <rect x={60} y={26} width={w} height={42} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <circle cx={80} cy={47} r={5} fill={AMBER} />
      <text x={94} y={54} fill={colors.TEXT} fontSize={19} fontWeight={600}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>): T => s.get(ch);
  const cam = g(scene.cam);
  const chipIdx = Math.max(0, Math.min(CHIPS.length - 1, Math.round(g(scene.chip))));

  const pipeU = g(scene.pipeU);
  const bandU = g(scene.bandU);
  const bandLabelU = g(scene.bandLabelU);
  const bypassU = g(scene.bypassU);
  const bypassLabelU = g(scene.bypassLabelU);
  const bypassDim = g(scene.bypassDim);
  const detU = g(scene.detU);
  const braceU = g(scene.braceU);
  const roseU = g(scene.roseU);
  const flyU = g(scene.flyU);
  const petalU = g(scene.petalU);
  const roseDim = g(scene.roseDim);
  const roseOff = g(scene.roseOff);
  const leftFade = g(scene.leftFade);
  const wipeU = g(scene.wipeU);
  const wipeVis = g(scene.wipeVis);
  const waistU = g(scene.waistU);
  const newU = g(scene.newU);
  const tagU = g(scene.tagU);
  const predU = g(scene.predU);
  const loopsU = g(scene.loopsU);
  const lobeU = g(scene.lobeU);
  const ghostOp = g(scene.ghostOp);
  const accU = g(scene.accU);
  const acc1U = g(scene.acc1U);
  const acc5U = g(scene.acc5U);
  const bankDim = g(scene.bankDim);
  const coarseU = g(scene.coarseU);
  const combU = g(scene.combU);
  const stripU = g(scene.stripU);
  const saeLabelU = g(scene.saeLabelU);
  const topkU = g(scene.topkU);
  const posU = g(scene.posU);
  const stepU = g(scene.stepU);
  const stripDim = g(scene.stripDim);
  const lobeDim = g(scene.lobeDim);
  const featU = g(scene.featU);
  const matchU = g(scene.matchU);
  const matchLabelU = g(scene.matchLabelU);
  const archU = g(scene.archU);
  const archLabelU = g(scene.archLabelU);
  const archGone = g(scene.archGone);
  const ribFrameU = g(scene.ribFrameU);
  const ribFillU = g(scene.ribFillU);
  const ribLabelU = g(scene.ribLabelU);
  const scaleNoteU = g(scene.scaleNoteU);
  const removeU = g(scene.removeU);
  const removeLabelU = g(scene.removeLabelU);
  const accOkU = g(scene.accOkU);
  const thumbU = g(scene.thumbU);
  const loupeU = g(scene.loupeU);
  const inspectU = g(scene.inspectU);
  const finalDim = g(scene.finalDim);
  const panelU = g(scene.panelU);

  // ---- squeeze world (archived into a thumbnail at caption 11) ----
  const archK = lerp(1, 0.26, archU);
  const archTx = lerp(0, 60 - PIPE_X0 * 0.26, archU);
  const archTy = lerp(0, 100 - 110 * 0.26, archU);
  const archOp = lerp(1, 0.12, archU) * (1 - archGone) * (1 - thumbU);
  const worldOn = archOp > 0.01;

  const h = lerp(H0, HW, waistU);
  const wipeX = lerp(BX0 - 12, BX1 + 14, wipeU);
  const bankOp = (1 - 0.7 * bankDim) * (1 - leftFade); // graphics
  const bankTextOp = (1 - 0.85 * bankDim) * (1 - leftFade); // labels
  const roseOp = roseU * (1 - 0.6 * roseDim) * (1 - roseOff);
  const lobeColor = lobeInterp(lobeU);

  // narrow petals growing (staggered per petal), then morphing into the broad lobe
  const grow = ORIG_ANG.map((_, i) => clamp01(petalU * 1.6 - i * 0.06));
  const roseRs = THETA.map((_, k) => {
    let m = 0.05;
    for (let i = 0; i < 10; i++) m = Math.max(m, grow[i] * (0.05 + 0.95 * PETAL[i][k]));
    const narrow = R * m;
    return lerp(narrow, BROAD[k], lobeU);
  });
  const rosePath = polarPath(roseRs);

  const step = Math.floor(stepU);
  const stepping = stepU > 0.001 && stepU < N_STEPS;
  const active = stepping ? ACTIVE[Math.min(N_STEPS - 1, step)] : [];

  // ---- ConvNeXt ribbon transform (caption 13 shrinks it into the right thumbnail) ----
  const ribK = lerp(1, THUMB_K, thumbU);
  const ribTx = lerp(RB_CX, THUMB_R.x, thumbU);
  const ribTy = lerp(RB_CY, THUMB_R.y, thumbU);
  const ribOp = ribFrameU * (1 - finalDim);
  const thumbOp = 1 - finalDim;
  const loupeCellX = RB_X0 + (LOUPE_CELL % 10) * RB_P + RB_S / 2;
  const loupeCellY = RB_Y0 + Math.floor(LOUPE_CELL / 10) * RB_P + RB_S / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the squeeze experiment (pipe, band, rose, dictionary) ================= */}
        {worldOn && (
          <g transform={`translate(${archTx},${archTy}) scale(${archK})`} opacity={archOp}>
            {/* bypass that the layer does not have */}
            {bypassU > 0.01 && (
              <g opacity={(1 - 0.85 * bypassDim) * (1 - leftFade)}>
                <path d={bypassPath(bypassU)} fill="none" stroke={colors.MUTED} strokeWidth={2.4} strokeDasharray="7 7" />
                {bypassLabelU > 0.01 && (
                  <g opacity={bypassLabelU}>
                    <g transform={`translate(360,${YC - H0 - 41})`} stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round">
                      <line x1={-9} y1={-9} x2={9} y2={9} />
                      <line x1={-9} y1={9} x2={9} y2={-9} />
                    </g>
                  </g>
                )}
              </g>
            )}
            {bypassLabelU > 0.01 && (
              <text x={360} y={YC - H0 - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontWeight={600} opacity={bypassLabelU * (1 - leftFade)}>
                no bypass
              </text>
            )}

            {/* pipe walls */}
            {pipeU > 0.01 && (
              <g opacity={bankOp}>
                {[-1, 1].map((sg) => (
                  <path
                    key={sg}
                    d={wallPath(h, sg as 1 | -1)}
                    fill="none"
                    stroke={WALL}
                    strokeWidth={5}
                    strokeLinecap="round"
                    pathLength={1}
                    style={{ strokeDasharray: `${pipeU} 1` }}
                  />
                ))}
                {/* flow chevrons: signal enters left, leaves right */}
                {[96, 624].map((x) => (
                  <path key={x} d={`M${x - 6},${YC - 12} L${x + 6},${YC} L${x - 6},${YC + 12}`} fill="none" stroke={WALL} strokeWidth={3} opacity={pipeU} />
                ))}
              </g>
            )}

            {/* the 480-cell band (wiped away left → right at caption 3) */}
            {bandU > 0.01 && wipeU < 0.999 && (
              <g opacity={bankOp}>
                {Array.from({ length: ROWS * COLS }, (_, idx) => {
                  const c = idx % COLS;
                  const r = Math.floor(idx / COLS);
                  const appear = clamp01(bandU * (COLS + 4) - c);
                  const x = bandCx(c);
                  const keep = wipeU > 0 ? clamp01((x - wipeX + 6) / 14) : 1;
                  const op = appear * keep;
                  if (op <= 0.01) return null;
                  const det = DET_SET.get(idx);
                  const isDet = det !== undefined && detU > 0.01;
                  return (
                    <rect
                      key={idx}
                      x={x - 5}
                      y={bandCy(r) - 4}
                      width={10}
                      height={8}
                      rx={1.5}
                      fill={isDet ? AMBER : CELL_BASE}
                      opacity={op * (isDet ? 0.45 + 0.55 * detU : 0.9)}
                    />
                  );
                })}
                {/* halos on the ten detectors */}
                {detU > 0.01 &&
                  DETECTORS.map((cell) => {
                    const x = bandCx(cell % COLS);
                    const keep = wipeU > 0 ? clamp01((x - wipeX + 6) / 14) : 1;
                    if (keep <= 0.01) return null;
                    return <circle key={cell} cx={x} cy={bandCy(Math.floor(cell / COLS))} r={9} fill="none" stroke={AMBER} strokeWidth={1.6} opacity={detU * keep * 0.8} />;
                  })}
              </g>
            )}
            {bandLabelU > 0.01 && (
              <text x={360} y={YC - H0 - 18} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO} opacity={bandLabelU}>
                InceptionV1 · mixed3b · 480 neurons
              </text>
            )}
            {/* brace: ten curve detectors among the 480 */}
            {braceU > 0.01 && (
              <g opacity={braceU * (1 - leftFade)}>
                <path d={`M${BX0},${YC + H0 + 10} v8 H${BX1} v-8 M360,${YC + H0 + 18} v8`} fill="none" stroke={AMBER} strokeWidth={2} />
                <text x={360} y={YC + H0 + 48} textAnchor="middle" fill={AMBER} fontSize={20} fontWeight={600}>
                  10 curve detectors among the 480
                </text>
              </g>
            )}

            {/* wipe line: train from scratch */}
            {wipeVis > 0.01 && (
              <g opacity={wipeVis}>
                <line x1={wipeX} y1={YC - H0 - 4} x2={wipeX} y2={YC + H0 + 4} stroke="#e2e8f0" strokeWidth={3} />
                <text x={wipeX} y={YC - H0 - 14} textAnchor="middle" fill="#e2e8f0" fontSize={20} fontWeight={600}>
                  train from scratch
                </text>
              </g>
            )}

            {/* the squeezed bank: ten new cells, new colours (no identity carried over) */}
            {newU > 0.01 && (
              <g opacity={bankOp}>
                {SQUEEZED.map((col, i) => {
                  const u = clamp01(newU * 1.9 - i * 0.1);
                  if (u <= 0.01) return null;
                  const isLoops = i === LOOPS;
                  const dimOther = !isLoops ? 1 - 0.55 * loopsU : 1;
                  const fill = isLoops && loopsU > 0.01 ? TEAL : col;
                  const sz = NEW_S * (0.6 + 0.4 * ease.enter(u));
                  return (
                    <g key={i} opacity={u * dimOther * (1 - 0.75 * predU)}>
                      <rect x={newX(i) - sz / 2} y={YC - sz / 2} width={sz} height={sz} rx={6} fill={fill} opacity={isLoops ? lerp(0.85, 0.32, loopsU) : 0.85} />
                      {isLoops && loopsU > 0.01 && (
                        <rect x={newX(i) - sz / 2 - 4} y={YC - sz / 2 - 4} width={sz + 8} height={sz + 8} rx={8} fill="none" stroke={TEAL} strokeWidth={2.5} opacity={loopsU} />
                      )}
                    </g>
                  );
                })}
                <LoopsGlyph x={newX(LOOPS)} y={YC} s={1.05} color="#ecfeff" opacity={loopsU} />
              </g>
            )}
            {tagU > 0.01 && (
              <g opacity={tagU * bankTextOp}>
                <text x={360} y={YC - 72} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontFamily={MONO} fontWeight={600}>
                  480 → 10 · 48×
                </text>
                <text x={360} y={YC - 43} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={500}>
                  retrained from scratch · no bypass
                </text>
              </g>
            )}

            {/* the unrelated-packing prediction (dashed inset over the bank) */}
            {predU > 0.01 && (
              <g opacity={predU}>
                <rect x={BX0 - 6} y={YC - 26} width={BX1 - BX0 + 12} height={52} rx={8} fill="none" stroke="#e2e8f0" strokeWidth={1.6} strokeDasharray="6 5" />
                {MIX_ROT.map((rot, i) => (
                  <g key={i} transform={`translate(${newX(i)},${YC})`} fill="none" strokeLinecap="round">
                    <rect x={-NEW_S / 2} y={-NEW_S / 2} width={NEW_S} height={NEW_S} rx={6} fill={colors.PANEL} stroke="none" />
                    <path d="M-11,6 Q0,-14 11,6" stroke={AMBER} strokeWidth={2} transform={`rotate(${rot[0]})`} />
                    <path d={SPIRAL} stroke="#fb923c" strokeWidth={1.4} transform={`rotate(${rot[1]})`} />
                    <path d={WEB} stroke="#cbd5e1" strokeWidth={0.9} transform={`rotate(${rot[2]})`} opacity={0.85} />
                  </g>
                ))}
                <text x={360} y={YC + 58} textAnchor="middle" fill="#e2e8f0" fontSize={20} fontStyle="italic">
                  unrelated-packing prediction
                </text>
              </g>
            )}
            {loopsU > 0.01 && (
              <text x={newX(LOOPS)} y={YC + 58} textAnchor="middle" fill={TEAL} fontSize={20} fontWeight={600} opacity={loopsU * (1 - predU) * bankTextOp}>
                curves &amp; loops
              </text>
            )}

            {/* reported accuracy of the squeezed model */}
            {accU > 0.01 && (
              <g opacity={accU * bankTextOp}>
                <text x={360} y={YC + 120} textAnchor="middle" fill={colors.TEXT} fillOpacity={0.85} fontSize={20}>
                  squeezed model · ImageNet
                </text>
                <text x={360} y={YC + 152} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontFamily={MONO} fontWeight={600}>
                  <tspan fillOpacity={acc1U}>58.35% top-1</tspan>
                  <tspan fillOpacity={acc5U}> · 81.14% top-5</tspan>
                </text>
              </g>
            )}

            {/* comb from the ten cells into the 640-feature dictionary */}
            {combU > 0.01 && (
              <g opacity={1 - 0.65 * stripDim}>
                {SQUEEZED.map((_, i) => {
                  const u = clamp01(combU * 1.5 - i * 0.05);
                  if (u <= 0.01) return null;
                  const y0 = YC + NEW_S / 2 + 4;
                  const y1 = lerp(y0, SY0 - 6, ease.draw(u));
                  const segW = (SX1 - SX0) / 10;
                  const xa = lerp(newX(i), SX0 + i * segW + 2, ease.draw(u));
                  const xb = lerp(newX(i), SX0 + (i + 1) * segW - 2, ease.draw(u));
                  return (
                    <g key={i}>
                      <path d={`M${newX(i) - 6},${y0} L${xa},${y1} L${xb},${y1} L${newX(i) + 6},${y0}Z`} fill={VIOLET} opacity={0.12} />
                      <path d={`M${newX(i) - 6},${y0} L${xa},${y1} M${newX(i) + 6},${y0} L${xb},${y1}`} stroke={VIOLET} strokeWidth={1} opacity={0.45} />
                    </g>
                  );
                })}
              </g>
            )}
            {stripU > 0.01 && (
              <g opacity={stripU * (1 - 0.65 * stripDim)}>
                <path d={TEETH_PATH} fill="#64748b" opacity={0.75} />
                {/* two active features at the current position */}
                {active.map((j) => {
                  const [x, y] = toothXY(j);
                  return <rect key={j} x={x - 2} y={y - 4} width={S_PITCH * 0.62 + 4} height={19} rx={1.5} fill={AMBER} />;
                })}
              </g>
            )}
            {/* the four closest features in the dictionary (caption 10), kept bright while the strip dims */}
            {featU > 0.01 &&
              MATCH_TEETH.map((j) => {
                const [x, y] = toothXY(j);
                return <rect key={j} x={x - 2} y={y - 4} width={S_PITCH * 0.62 + 4} height={19} rx={1.5} fill={VIOLET} opacity={featU} />;
              })}
            {saeLabelU > 0.01 && (
              <g opacity={saeLabelU}>
                <path d={`M${SX0},${SY0 + S_ROWS * S_ROW + 6} v6 H${SX1} v-6`} fill="none" stroke={VIOLET} strokeWidth={1.8} />
                <text x={(SX0 + SX1) / 2} y={SY0 + S_ROWS * S_ROW + 40} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
                  sparse autoencoder: rebuild the layer from a few active features
                </text>
              </g>
            )}
            {topkU > 0.01 && (
              <text x={(SX0 + SX1) / 2} y={SY0 + S_ROWS * S_ROW + 40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontFamily={MONO} fontWeight={600} opacity={topkU * (1 - 0.65 * stripDim)}>
                TopK SAE · 640 features · 2 active per position
              </text>
            )}
            {/* image positions the active pair steps across */}
            {posU > 0.01 && (
              <g opacity={posU}>
                <text x={GX0 + (G_N * G_P) / 2} y={GY0 - 12} textAnchor="middle" fill={colors.TEXT} fillOpacity={0.85} fontSize={19}>
                  image positions
                </text>
                {Array.from({ length: G_N * G_N }, (_, p) => {
                  const on = stepping && POS[Math.min(N_STEPS - 1, step)] === p;
                  const done = POS.slice(0, Math.min(N_STEPS, step)).includes(p);
                  return (
                    <rect
                      key={p}
                      x={GX0 + (p % G_N) * G_P}
                      y={GY0 + Math.floor(p / G_N) * G_P}
                      width={G_P - 2}
                      height={G_P - 2}
                      rx={2}
                      fill={on ? AMBER : done ? '#475569' : '#1e293b'}
                      stroke={on ? AMBER : 'none'}
                    />
                  );
                })}
              </g>
            )}

            {/* ================= the tuning rose ================= */}
            {roseOp > 0.01 && (
              <g opacity={roseOp}>
                <circle cx={RX} cy={RY} r={R} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="4 6" />
                <circle cx={RX} cy={RY} r={R / 2} fill="none" stroke={colors.GRID} strokeWidth={1} />
                <circle cx={RX} cy={RY} r={3} fill={colors.MUTED} />
                <text x={RX} y={RY + R + 32} textAnchor="middle" fill={colors.TEXT} fillOpacity={0.85} fontSize={21} opacity={1 - roseDim}>
                  curve-orientation tuning · schematic
                </text>
                {/* ghost of the ten narrow petals */}
                {ghostOp > 0.01 && (
                  <path d={NARROW_PATH} fill="none" stroke={AMBER} strokeWidth={1.6} strokeDasharray="5 5" opacity={ghostOp} />
                )}
                {/* the live shape: ten narrow petals → one broad lobe */}
                {petalU > 0.01 && (
                  <g opacity={1 - 0.75 * lobeDim}>
                    <path d={rosePath} fill={lobeColor} fillOpacity={lerp(0.2, 0.26, lobeU)} stroke={lobeColor} strokeWidth={2.2} strokeLinejoin="round" />
                  </g>
                )}
                {/* closest SAE features: broad, overlapping petals */}
                {featU > 0.01 &&
                  FEAT_PATHS.map((d, f) => (
                    <path key={f} d={d} fill={VIOLET} fillOpacity={0.16} stroke={VIOLET} strokeWidth={2} opacity={featU} />
                  ))}
                {matchU > 0.01 &&
                  MATCH_PATH.map((d, i) => {
                    const u = clamp01(matchU * 1.4 - i * 0.04);
                    if (u <= 0.01) return null;
                    const [ex, ey] = polar(FEAT_ANG[MATCH[i]], R * FEAT_PEAK + 6);
                    return (
                      <g key={i}>
                        <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={1.6} opacity={0.8} pathLength={1} style={{ strokeDasharray: `${u} 1` }} />
                        {u > 0.97 && <circle cx={ex} cy={ey} r={4.5} fill="#e2e8f0" />}
                      </g>
                    );
                  })}
              </g>
            )}
            {/* detectors' arcs flying to the rose (caption 2) */}
            {flyU > 0.01 && flyU < 0.999 &&
              DETECTORS.map((cell, i) => {
                const u = ease.move(clamp01(flyU * 1.35 - i * 0.035));
                if (u <= 0.001 || u >= 0.999) return null;
                const x0 = bandCx(cell % COLS);
                const y0 = bandCy(Math.floor(cell / COLS));
                const [x1, y1] = polar(ORIG_ANG[i], R);
                const cx = (x0 + x1) / 2;
                const cy = Math.min(y0, y1) - 90;
                const bz = (t: number): [number, number] => [
                  (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1,
                  (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1,
                ];
                const [px, py] = bz(u);
                const [qx, qy] = bz(Math.max(0, u - 0.08));
                return (
                  <g key={cell}>
                    <line x1={qx} y1={qy} x2={px} y2={py} stroke={AMBER} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
                    <circle cx={px} cy={py} r={4} fill={AMBER} />
                  </g>
                );
              })}
            {coarseU > 0.01 && (
              <g opacity={coarseU}>
                <text x={RX} y={RY - R - 38} textAnchor="middle" fill={TEAL} fontSize={28} fontWeight={650}>
                  coarser, not hidden
                </text>
                <text x={RX} y={RY - R - 10} textAnchor="middle" fill={AMBER} fontSize={21} fontWeight={500}>
                  dashed: the ten original detectors
                </text>
              </g>
            )}
            {matchLabelU > 0.01 && (
              <text x={RX} y={RY - R - 14} textAnchor="middle" fill={VIOLET} fontSize={24} fontWeight={650} opacity={matchLabelU}>
                closest features: broad, bunched
              </text>
            )}
          </g>
        )}
        {archLabelU > 0.01 && (
          <text x={60 + (1100 - PIPE_X0) * 0.13} y={250} textAnchor="middle" fill={colors.TEXT} fontSize={19} opacity={archLabelU * 0.75 * (1 - archGone) * (1 - thumbU)}>
            squeeze experiment
          </text>
        )}

        {/* ================= separate test: ConvNeXt last layer, SAE activity ================= */}
        {ribOp > 0.01 && (
          <g transform={`translate(${ribTx},${ribTy}) scale(${ribK}) translate(${-RB_CX},${-RB_CY})`} opacity={ribOp}>
            {Array.from({ length: 100 }, (_, i) => {
              const x = RB_X0 + (i % 10) * RB_P;
              const y = RB_Y0 + Math.floor(i / 10) * RB_P;
              if (GREY_CELLS.has(i)) {
                const slide = ease.move(removeU);
                return (
                  <g key={i}>
                    {removeU > 0.01 && (
                      <rect x={x} y={y} width={RB_S} height={RB_S} rx={4} fill="none" stroke="#475569" strokeWidth={1.2} strokeDasharray="3 4" opacity={removeU} />
                    )}
                    {slide < 0.99 && (
                      <rect x={x + slide * 70} y={y} width={RB_S} height={RB_S} rx={4} fill={GREY} stroke="#64748b" strokeWidth={1} opacity={1 - slide} />
                    )}
                  </g>
                );
              }
              const fill = clamp01(ribFillU * 88 - (FILL_RANK.get(i) ?? 0));
              return (
                <g key={i}>
                  <rect x={x} y={y} width={RB_S} height={RB_S} rx={4} fill={GREY} opacity={1 - fill} />
                  <rect x={x} y={y} width={RB_S} height={RB_S} rx={4} fill={CYAN} opacity={fill * 0.85} />
                </g>
              );
            })}
          </g>
        )}
        {scaleNoteU > 0.01 && (
          <text x={RB_CX} y={RB_Y0 + RB_P * 10 + 32} textAnchor="middle" fill={colors.TEXT} fillOpacity={0.85} fontSize={20} opacity={scaleNoteU}>
            1 cell ≈ 1% of SAE activity · schematic
          </text>
        )}
        {ribLabelU > 0.01 && (
          <g opacity={ribLabelU}>
            <text x={800} y={248} fill={CYAN} fontSize={28} fontWeight={700}>
              88% of SAE activity
            </text>
            <text x={800} y={280} fill={colors.TEXT} fontSize={21}>
              features ≈ one neuron each
            </text>
          </g>
        )}
        {removeLabelU > 0.01 && (
          <text x={800} y={372} fill={colors.TEXT} fillOpacity={0.85} fontSize={21} opacity={removeLabelU}>
            unmatched directions removed
          </text>
        )}
        {accOkU > 0.01 && (
          <g opacity={clamp01(accOkU)} transform={`translate(800,${420}) scale(${lerp(0.85, 1, clamp01(accOkU))})`}>
            <rect x={0} y={-24} width={250} height={40} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
            <path d="M14,-5 l7,8 l13,-16" fill="none" stroke={colors.POSITIVE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <text x={44} y={3} fill={colors.POSITIVE} fontSize={20} fontWeight={600}>
              accuracy unchanged
            </text>
          </g>
        )}

        {/* ================= caption 13: two thumbnails, two loupes ================= */}
        {thumbU > 0.01 && (
          <g opacity={thumbOp}>
            {/* left: the squeezed bank and its broad lobe, arriving from the archive */}
            <g
              transform={`translate(${lerp(195, THUMB_L.x, ease.move(thumbU))},${lerp(165, THUMB_L.y, ease.move(thumbU))}) scale(${lerp(0.35, 1, ease.move(thumbU))})`}
              opacity={thumbU}
            >
              {SQUEEZED.map((col, i) => (
                <rect key={i} x={-115 + i * 23} y={-130} width={20} height={20} rx={4} fill={i === LOOPS ? TEAL : col} opacity={i === LOOPS ? 0.9 : 0.55} />
              ))}
              <circle cx={0} cy={45} r={R * LOBE_K} fill="none" stroke={colors.GRID} strokeDasharray="4 6" />
              <path d={polarPath(NARROW_FULL, 0, 45, LOBE_K)} fill="none" stroke={AMBER} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.45} />
              <path d={polarPath(BROAD, 0, 45, LOBE_K)} fill={TEAL} fillOpacity={0.25} stroke={TEAL} strokeWidth={2} />
            </g>
            <Loupe x={THUMB_L.x - 115 + LOOPS * 23 + 10} y={THUMB_L.y - 120} r={38} u={loupeU * thumbU}>
              <rect x={THUMB_L.x - 115 + LOOPS * 23 + 10 - 22} y={THUMB_L.y - 120 - 22} width={44} height={44} rx={7} fill={TEAL} opacity={0.35} />
              <LoopsGlyph x={THUMB_L.x - 115 + LOOPS * 23 + 10} y={THUMB_L.y - 120} s={1.35} color="#ecfeff" />
            </Loupe>
            {(() => {
              const lx = THUMB_R.x + (loupeCellX - RB_CX) * THUMB_K;
              const ly = THUMB_R.y + (loupeCellY - RB_CY) * THUMB_K;
              return (
                <Loupe x={lx} y={ly} r={34} u={loupeU}>
                  <rect x={lx - 20} y={ly - 20} width={40} height={40} rx={7} fill={CYAN} opacity={0.6} />
                  <circle cx={lx} cy={ly} r={7} fill="#e0f2fe" />
                  {[-50, 20, 90, 160, 230].map((a) => (
                    <line key={a} x1={lx + 7 * Math.cos(a * DEG)} y1={ly + 7 * Math.sin(a * DEG)} x2={lx + 15 * Math.cos(a * DEG)} y2={ly + 15 * Math.sin(a * DEG)} stroke="#e0f2fe" strokeWidth={2} strokeLinecap="round" />
                  ))}
                </Loupe>
              );
            })()}
            {inspectU > 0.01 && (
              <g opacity={inspectU}>
                <text x={640} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={650}>
                  inspect the original neurons
                </text>
                <text x={THUMB_L.x} y={552} textAnchor="middle" fill={TEAL} fontSize={21}>
                  squeezed layer: one broader neuron
                </text>
                <text x={THUMB_R.x} y={552} textAnchor="middle" fill={CYAN} fontSize={21}>
                  ConvNeXt SAE: mostly echoes neurons
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= closing panel (opaque) ================= */}
        {panelU > 0.01 && (
          <g opacity={panelU}>
            <rect x={200} y={250} width={880} height={210} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <circle cx={300} cy={355} r={58} fill="none" stroke={colors.GRID} strokeDasharray="4 6" />
            <path d={polarPath(NARROW_FULL, 300, 355, 0.36)} fill="none" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.5} />
            <path d={polarPath(BROAD, 300, 355, 0.36)} fill={TEAL} fillOpacity={0.25} stroke={TEAL} strokeWidth={2} />
            <text x={392} y={345} fill={colors.TEXT} fontSize={30} fontWeight={650}>
              Test what capacity pressure actually changes.
            </text>
            <text x={392} y={394} fill={colors.TEXT} fillOpacity={0.8} fontSize={22}>
              These results do not rule out superposition.
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen space: status chip + chapter title ================= */}
      <Chip text={CHIPS[chipIdx]} u={g(scene.chipIn)} />
      <text x={1220} y={53} textAnchor="end" fill={colors.MUTED} fontSize={20} fontWeight={600}>
        Squeeze the Layer
      </text>
    </>
  );
}

export const vizScene = () => scene;
