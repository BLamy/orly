// Scale the Investigation
//
// Already Clean — chapter 5. Planned by Claude Sonnet 5.5 (.orly-work/visual-plan-sonnet.md); research and
// source checks by Claude Haiku 5.5; D3/SVG scene authored by Claude Opus 5.5 (requested claude-opus-5-5;
// actual claude-opus-5-5 per the authoring session's model identifier). Captions are the fixed narration
// contract, verbatim; claim IDs live in comments only.
//
// Sources (ledger IDs from .orly-work/research/neurons-claim-ledger.md):
//   H1  Towards Monosemanticity (2023): https://transformer-circuits.pub/2023/monosemantic-features/index.html
//   H2  OpenAI automated interpretability, number as given in the essay:
//       https://openaipublic.blob.core.windows.net/neuron-explainer/paper/index.html
//   Q1, B2, T1, T2  the essay: https://already-clean.goodfire.com/ (https://already-clean.goodfire.com/essay.md)
//   B1  Sutton, The Bitter Lesson (2019): http://www.incompleteideas.net/IncIdeas/BitterLesson.html
//
// Measured / reported values on stage, and nothing else: the median rubric score 0 of 14 (H1); ~1.7% by the most
// generous measure, in the author's account (H2); the preliminary Qwen3-32B estimates ~90% / ~7% / ~2–4% of neuron
// poles (Q1), drawn as three independent soft markers on separate 0–100 lines, never stacked, never a census.
// Schematic: the 8×4 pole-tile map, tile counts, candidate shapes, the constraint cascade, the four-plank rail,
// the loupe, the soft-marker widths and every coordinate. Step 4 ("highly speculative") is drawn unfinished.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import type { ReactNode } from 'react';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Staggered progress of item k of n driven by one 0..1 channel. */
const stag = (u: number, k: number, n: number, spread = 0.5): number => clamp01(u * (1 + (n - 1) * spread) - k * spread);

// ---------------------------------------------------------------------------
// Fixed narration (verbatim) and pacing
// ---------------------------------------------------------------------------

const CAPTIONS = [
  // [H1, H2]
  "Language-model evidence once made neurons look discouraging. Two studies from twenty twenty-three help explain that starting point.",
  // [H1]
  "In Towards Monosemanticity, the median neuron scored zero on a fourteen-point rubric. The annotator could not form a hypothesis about it.",
  // [H2]
  "Cammarata says Open A I's automated interpretability project found about one point seven percent interpretable, even by its most generous measure.",
  // [Q1]
  "His preliminary audit of Qwen three, thirty-two billion, reports roughly ninety percent of neuron poles with one main job, often with small related offshoots.",
  // [Q1]
  "About seven percent have two related jobs, and roughly two to four percent remain unexplained. These are estimates about poles, not whole neurons.",
  // [H1, H2, Q1]
  "These studies use different models and measures. The newer estimates also depend on thresholds, so they are not a single controlled before-and-after score.",
  // [B1, B2]
  "Rich Sutton's bitter lesson, from twenty nineteen, emphasizes general methods that benefit from more computation. Cammarata asks whether investigation could benefit in a similar way.",
  // [B2, T1]
  "His first step: networks run on one learning principle, not two, so nothing blocks ordinary science on them.",
  // [B2]
  "Second, he reports that this investigation works surprisingly well with modern models and improved tools.",
  // [B2]
  "Third, explanations constrain their neighbors. Learning what one part does can make the next part easier to test.",
  // [B2]
  "Fourth, he suggests that this approach might supply most of what interpretability needs. He explicitly calls this step highly speculative.",
  // [B2]
  "The proposed lesson is to expand systematic experiments on the network itself, rather than assume that a new decomposition must come first.",
  // [connective]
  "Try that question on four e fifty-five, which looked like cats mixed with cars. On Cammarata's reading, its inputs and negative pole show a V against an O, and a better visualization explains the whiskers.",
  // [T2]
  "On this account, an unexplained response is a reason to investigate. Superposition belongs among the hypotheses we test, after the simpler explanations have had their chance.",
];

const GAP = 0.7;
const DUR = CAPTIONS.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
/** Caption start times; every visual event keys to one of these. */
const T = DUR.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0.5 : acc[i - 1] + DUR[i - 1] + GAP], []);
const END = T[T.length - 1] + DUR[DUR.length - 1];

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; load-bearing content y 100–605; y ≥ 630 empty)
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TEXT_HEX = '#e6edf6';
const NEG_POLE = colors.NEGATIVE;
const POS_POLE = colors.POSITIVE;

// the pole-tile map: 8×4 capsules, plus a dashed 3-column extension for step 4
const COLS = 8;
const EXT = 3;
const ROWS = 4;
const TW = 94;
const TH = 42;
const TR = TH / 2;
const TX = (c: number): number => 227 + 115 * c;
const TY = (r: number): number => 180 + 64 * r;
const GRID_TOP = TY(0) - TR;
const GRID_BOT = TY(ROWS - 1) + TR;

/** Each tile's surviving candidate (0 circle, 1 triangle, 2 diamond) — seeded, schematic. */
const rand = mulberry32(5055);
const ANSWER: number[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => Math.floor(rand() * 3)));
const CAND_DX = [-14, 0, 14];

// the tile the camera inspects at caption 4
const FOCUS = { r: 3, c: 7 };

// constraint cascade (caption 10): columns 6–8 (index 5–7) ripple out from the column-5 tile in row R0
const R0 = 1;
// per tile: the bridge lands, three candidates narrow to one, then the survivor settles in
const STEP_COL = 0.8;
const STEP_ROW = 0.2;
const cascadeStart = (r: number, c: number): number => STEP_COL * (c - 5) + STEP_ROW * Math.abs(r - R0);
const BRIDGE_DUR = 0.3;
const NARROW_DELAY = 0.18;
const NARROW_DUR = 0.55;
const SOLVE_DELAY = NARROW_DELAY + NARROW_DUR + 0.15;
const SOLVE_DUR = 0.45;
const CASCADE_END = cascadeStart(ROWS - 1, COLS - 1) + SOLVE_DELAY + SOLVE_DUR;

// loupe sweep (caption 7): boustrophedon across the four rows, sweep 0 → 4
const SWEEP_XA = TX(0) - 64;
const SWEEP_XB = TX(COLS - 1) + 64;
const LOUPE_R = 38;
const H_SHARE = 0.86;

// wide loupe frames: columns [a, b]
type Frame = { x: number; y: number; w: number; h: number };
const frameOver = (a: number, b: number): Frame => {
  const x0 = TX(a) - TW / 2 - 14;
  const x1 = TX(b) + TW / 2 + 14;
  return { x: (x0 + x1) / 2, y: (GRID_TOP + GRID_BOT) / 2, w: x1 - x0, h: GRID_BOT - GRID_TOP + 26 };
};
const FRAME_B = frameOver(2, 4);
const FRAME_C = frameOver(5, 7);
const FRAME_EXT = frameOver(8, 10);

// three record cards (captions 1–6)
const CARD_Y = 400;
const CARD_H = 190;
const CARD_W = 330;
const CARD_X = [90, 475, 860];
const R1 = { x0: 115, x1: 395, y: 515 }; // rubric ruler 0..14
const R2 = { x0: 500, x1: 780, y: 515 }; // percent line 0..100
const BAND_X0 = 885;
const BAND_X1 = 1165;
const BAND_Y = [500, 538, 576];
const BANDS = [
  { lo: 90, hi: 90, label: '~90% · one main job' },
  { lo: 7, hi: 7, label: '~7% · two related jobs' },
  { lo: 2, hi: 4, label: '~2–4% · not yet understood' },
];
const UNITS = ['rubric score', 'share of neurons', 'share of neuron poles'];

// the argument rail (captions 8–12)
const PLANK_Y = 505;
const PLANK_H = 80;
const PLANK_W = 244;
const PLANK_X = (i: number): number => 175 + i * (PLANK_W + 12);
const PLANKS = [
  ['One learning', 'principle'],
  ['Modern models', 'and tools help'],
  ['Explanations', 'constrain neighbors'],
  ['Highly speculative:', 'could this be most of it?'],
];

// retrace icons (caption 13): lens, door, branch, funnel. Door and lens are named aloud on 4e:55 and light at
// full weight; branch and funnel follow briefly at lower weight.
const ICON_X = [360, 650, 940, 1230];
const ICON_Y = [266, 296, 266, 296];
const ICON_R = 36;
const ICON_W = [1, 1, 0.45, 0.45];
const TAG = { x: 795, y: 196 }; // the 4e:55 chip over the path

const CHIPS = [
  '2023 · language models',
  'Qwen3-32B · preliminary · neuron poles',
  'preliminary · neuron poles · threshold-dependent',
  'not one controlled before-and-after',
  'Sutton · 2019 · the bitter lesson',
  "Cammarata's proposed steps",
  'step 4 · “highly speculative”',
  'microscope · gate · branch · squeeze',
  'superposition as “the last hypothesis”',
];

const CAM_CARD1: CameraState = { x: 255, y: 478, k: 1.35 };
const CAM_CARD2: CameraState = { x: 640, y: 478, k: 1.35 };
const CAM_TILE: CameraState = { x: TX(FOCUS.c), y: TY(FOCUS.r), k: 1.8 };
const CAM_TILE_CARD: CameraState = { x: 720, y: 390, k: 1.05 }; // the whole map and card 3 stay inside the stage
const CAM_SWEEP: CameraState = { x: 630, y: 320, k: 1.1 };
const CAM_WIDE: CameraState = { x: 808, y: 372, k: 0.87 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chip = tl.channel('chip', 0);
  const chipU = tl.channel('chipU', 0);

  const mapOp = tl.channel('mapOp', 0);
  const card1U = tl.channel('card1U', 0);
  const card2U = tl.channel('card2U', 0);
  const card3U = tl.channel('card3U', 0);
  const card1Dim = tl.channel('card1Dim', 1); // card 1 while the camera is elsewhere
  const cardsDim = tl.channel('cardsDim', 1); // card 2 while the camera inspects the tile
  const cardsOut = tl.channel('cardsOut', 1);
  const mark1U = tl.channel('mark1U', 0);
  const lab1U = tl.channel('lab1U', 0);
  const mark2U = tl.channel('mark2U', 0);
  const acct2U = tl.channel('acct2U', 0);
  const focusU = tl.channel('focusU', 0);
  const poleU = tl.channel('poleU', 0);
  const band1U = tl.channel('band1U', 0);
  const band2U = tl.channel('band2U', 0);
  const band3U = tl.channel('band3U', 0);
  const unitU = tl.channel('unitU', 0); // 0..3, card units light in turn
  const braceU = tl.channel('braceU', 0);

  const loupeU = tl.channel('loupeU', 0);
  const sweep = tl.channel('sweep', 0); // 0..4 rows
  const frameU = tl.channel('frameU', 0); // circle loupe → wide frame
  const frame = tl.channel<Frame>('frame', FRAME_B);
  const lab7U = tl.channel('lab7U', 0);
  const dotsU = tl.channel('dotsU', 0);
  const slotsU = tl.channel('slotsU', 0);
  const plank1 = tl.channel('plank1', 0);
  const plank2 = tl.channel('plank2', 0);
  const plank3 = tl.channel('plank3', 0);
  const plank4 = tl.channel('plank4', 0);
  const solveA = tl.channel('solveA', 0); // columns 1–2
  const solveB = tl.channel('solveB', 0); // columns 3–5
  const pulseU = tl.channel('pulseU', 0);
  const candBig = tl.channel('candBig', 0); // columns 6–8: candidates enlarge for the cascade
  const cascade = tl.channel('cascade', 0); // seconds into the ripple, 0..CASCADE_END
  const extU = tl.channel('extU', 0);
  const sideU = tl.channel('sideU', 0);
  const railDim = tl.channel('railDim', 1);
  const pathU = tl.channel('pathU', 0); // the dotted retrace path, lens → funnel
  const tagU = tl.channel('tagU', 0); // the 4e:55 chip over the path
  const iconU = [0, 1, 2, 3].map((i) => tl.channel(`icon${i}U`, 0)); // lens, door, branch, funnel
  const stageDim = tl.channel('stageDim', 0);
  const panelU = tl.channel('panelU', 0);

  CAPTIONS.forEach((text, i) => {
    // each line holds until the next starts, so the caption never blinks off between lines
    tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text });
    if (i < CAPTIONS.length - 1) tl.hold(T[i] + DUR[i], GAP);
  });
  const chipTo = (idx: number, at: number) => tl.tween(chip, idx, { at, dur: 0.6, ease: ease.move });

  // — B1 · C1 — the first record: a dim map of two-ended tiles, card 1 rises —
  tl.tween(chipU, 1, { at: T[0] + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(mapOp, 0.35, { at: T[0] + 0.2, dur: 0.9, ease: ease.enter });
  tl.tween(card1U, 1, { at: T[0] + 2.4, dur: 0.7, ease: ease.enter });

  // — C2 — push in: median 0 of 14 —
  tl.tween(cam, CAM_CARD1, { at: T[1], dur: 1.3, ease: ease.move });
  tl.tween(mapOp, 0.08, { at: T[1], dur: 0.8, ease: ease.move }); // the pushed-in map runs off-stage: keep it a whisper
  tl.tween(mark1U, 1, { at: T[1] + 1.4, dur: 0.6, ease: ease.pop });
  tl.tween(lab1U, 1, { at: T[1] + 2.4, dur: 0.6, ease: ease.enter });

  // — B2 · C3 — the second record, unlinked to the first —
  tl.tween(cam, CAM_CARD2, { at: T[2], dur: 1.4, ease: ease.move });
  tl.tween(card1Dim, 0, { at: T[2], dur: 0.7, ease: ease.move });
  tl.tween(card2U, 1, { at: T[2] + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(mark2U, 1, { at: T[2] + 1.8, dur: 0.6, ease: ease.pop });
  tl.tween(acct2U, 1, { at: T[2] + 3.0, dur: 0.6, ease: ease.enter });

  // — B3 · C4 — push to one tile: each end is a pole; card 3 and its first band —
  chipTo(1, T[3]);
  tl.tween(cam, CAM_TILE, { at: T[3], dur: 1.4, ease: ease.move });
  tl.tween(cardsDim, 0, { at: T[3], dur: 0.7, ease: ease.move });
  tl.tween(mapOp, 0.35, { at: T[3], dur: 0.8, ease: ease.move });
  tl.tween(focusU, 1, { at: T[3] + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(poleU, 1, { at: T[3] + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TILE_CARD, { at: T[3] + 3.6, dur: 1.3, ease: ease.move });
  tl.tween(card3U, 1, { at: T[3] + 3.9, dur: 0.7, ease: ease.enter });
  tl.tween(band1U, 1, { at: T[3] + 4.7, dur: 0.8, ease: ease.enter });

  // — C5 — two more independent bands; all three cards in view —
  chipTo(2, T[4]);
  tl.tween(cam, CAMERA_HOME, { at: T[4], dur: 1.3, ease: ease.move });
  tl.tween(poleU, 0, { at: T[4], dur: 0.5, ease: ease.move });
  tl.tween(card1Dim, 0.6, { at: T[4] + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(cardsDim, 0.6, { at: T[4] + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(band2U, 1, { at: T[4] + 1.4, dur: 0.8, ease: ease.enter });
  tl.tween(band3U, 1, { at: T[4] + 2.6, dur: 0.8, ease: ease.enter });

  // — B4 · C6 — different yardsticks: each unit lights in turn, then one brace —
  chipTo(3, T[5]);
  tl.tween(mapOp, 0.12, { at: T[5], dur: 0.8, ease: ease.move });
  tl.tween(card1Dim, 1, { at: T[5], dur: 0.6, ease: ease.move });
  tl.tween(cardsDim, 1, { at: T[5], dur: 0.6, ease: ease.move });
  tl.tween(focusU, 0, { at: T[5], dur: 0.6, ease: ease.move });
  tl.tween(unitU, 3, { at: T[5] + 0.6, dur: 3.0, ease: ease.linear });
  tl.tween(braceU, 1, { at: T[5] + 3.9, dur: 1.2, ease: ease.draw });

  // — B5 · C7 — the bitter lesson: cards go, a loupe sweeps every tile —
  chipTo(4, T[6]);
  tl.tween(cardsOut, 0, { at: T[6], dur: 0.8, ease: ease.move });
  tl.tween(braceU, 0, { at: T[6], dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SWEEP, { at: T[6] + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(mapOp, 1, { at: T[6] + 0.5, dur: 1.0, ease: ease.move });
  tl.tween(loupeU, 1, { at: T[6] + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(sweep, 4, { at: T[6] + 2.0, dur: 6.0, ease: ease.linear });
  tl.tween(lab7U, 1, { at: T[6] + 2.6, dur: 0.7, ease: ease.enter });

  // — B6 · C8 — step 1: plank one, columns 1–2 solidify —
  chipTo(5, T[7]);
  tl.tween(cam, CAMERA_HOME, { at: T[7], dur: 1.2, ease: ease.move });
  tl.tween(lab7U, 0, { at: T[7], dur: 0.5, ease: ease.move });
  tl.tween(loupeU, 0.35, { at: T[7], dur: 0.6, ease: ease.move });
  tl.tween(dotsU, 1, { at: T[7] + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(slotsU, 1, { at: T[7] + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(plank1, 1, { at: T[7] + 1.2, dur: 0.5, ease: ease.pop });
  tl.tween(solveA, 1, { at: T[7] + 2.0, dur: 1.4, ease: ease.move });

  // — C9 — step 2: the loupe widens, columns 3–5 solidify —
  tl.tween(plank2, 1, { at: T[8] + 0.3, dur: 0.5, ease: ease.pop });
  tl.tween(loupeU, 1, { at: T[8] + 0.9, dur: 0.4, ease: ease.enter });
  tl.tween(frameU, 1, { at: T[8] + 0.9, dur: 1.2, ease: ease.move });
  tl.tween(solveB, 1, { at: T[8] + 2.3, dur: 1.4, ease: ease.move });

  // — B7 · C10 — step 3: the constraint cascade crosses columns 6–8 —
  tl.tween(plank3, 1, { at: T[9] + 0.3, dur: 0.5, ease: ease.pop });
  tl.tween(frame, FRAME_C, { at: T[9] + 0.9, dur: 1.0, ease: ease.move });
  tl.tween(candBig, 1, { at: T[9] + 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(pulseU, 1, { at: T[9] + 1.9, dur: 0.7, ease: ease.linear });
  tl.tween(cascade, CASCADE_END, { at: T[9] + 2.2, dur: CASCADE_END, ease: ease.linear });

  // — B8 · C11 — step 4 is dashed; an empty extension grows past the grid —
  chipTo(6, T[10]);
  tl.tween(cam, CAM_WIDE, { at: T[10], dur: 1.4, ease: ease.move });
  tl.tween(loupeU, 0.4, { at: T[10], dur: 0.5, ease: ease.move });
  tl.tween(candBig, 0, { at: T[10], dur: 0.6, ease: ease.move });
  tl.tween(plank4, 1, { at: T[10] + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(extU, 1, { at: T[10] + 1.9, dur: 1.4, ease: ease.linear });

  // — C12 — the loupe sweeps the extension; nothing fills —
  tl.tween(loupeU, 1, { at: T[11], dur: 0.4, ease: ease.enter });
  tl.tween(frame, FRAME_EXT, { at: T[11] + 0.6, dur: 1.8, ease: ease.linear });
  tl.tween(sideU, 1, { at: T[11] + 2.8, dur: 0.7, ease: ease.enter });

  // — B9 · C13 — chapter 1's question tried on 4e:55: the chip lands on its words, the door lights at
  //   "a V against an O", the lens at "a better visualization"; branch and funnel follow briefly, lower weight —
  chipTo(7, T[12]);
  tl.tween(loupeU, 0, { at: T[12], dur: 0.5, ease: ease.move });
  tl.tween(sideU, 0, { at: T[12], dur: 0.5, ease: ease.move });
  tl.tween(mapOp, 0.3, { at: T[12] + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(railDim, 0.35, { at: T[12] + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(pathU, 1, { at: T[12] + 0.9, dur: 1.6, ease: ease.draw });
  tl.tween(tagU, 1, { at: T[12] + 1.8, dur: 0.6, ease: ease.pop });
  tl.tween(iconU[1], 1, { at: T[12] + 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(iconU[0], 1, { at: T[12] + 12.0, dur: 0.6, ease: ease.enter });
  tl.tween(iconU[2], 1, { at: T[12] + 13.0, dur: 0.4, ease: ease.enter });
  tl.tween(iconU[3], 1, { at: T[12] + 13.5, dur: 0.4, ease: ease.enter });

  // — B10 · C14 — takeaway on an opaque panel; step 4 still dashed —
  chipTo(8, T[13]);
  tl.tween(stageDim, 1, { at: T[13], dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: T[13], dur: 1.4, ease: ease.move });
  tl.tween(panelU, 1, { at: T[13] + 1.0, dur: 0.8, ease: ease.enter });
  tl.hold(END - 0.2, 0.2);

  return {
    tl, cam, chip, chipU, mapOp, card1U, card2U, card3U, card1Dim, cardsDim, cardsOut, mark1U, lab1U, mark2U, acct2U, focusU,
    poleU, band1U, band2U, band3U, unitU, braceU, loupeU, sweep, frameU, frame, lab7U, dotsU, slotsU, plank1, plank2, plank3,
    plank4, solveA, solveB, pulseU, candBig, cascade, extU, sideU, railDim, pathU, tagU, iconU, stageDim, panelU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

function Candidate({ kind, x, y, s, fill, op }: { kind: number; x: number; y: number; s: number; fill: string; op: number }) {
  if (op <= 0.01) return null;
  if (kind === 0) return <circle cx={x} cy={y} r={s} fill={fill} opacity={op} />;
  if (kind === 1)
    return <path d={`M ${x} ${y - s * 1.15} L ${x + s * 1.1} ${y + s * 0.8} L ${x - s * 1.1} ${y + s * 0.8} Z`} fill={fill} opacity={op} />;
  return <path d={`M ${x} ${y - s * 1.2} L ${x + s * 1.2} ${y} L ${x} ${y + s * 1.2} L ${x - s * 1.2} ${y} Z`} fill={fill} opacity={op} />;
}

/**
 * One two-ended pole tile: − end left, + end right, three candidates or one solved explanation in the middle.
 * `narrow` fades the two losing candidates and marks the survivor; `solve` then centres it. `big` enlarges candidates.
 */
function PoleTile({
  x, y, op, ends, glow, dots, narrow, solve, big = 0, answer, dashed,
}: {
  x: number; y: number; op: number; ends: number; glow: number; dots: number; narrow: number; solve: number; big?: number;
  answer: number; dashed?: boolean;
}) {
  if (op <= 0.005) return null;
  const capOp = Math.min(0.95, 0.2 + 0.35 * ends + 0.3 * solve + 0.45 * glow);
  if (dashed)
    return (
      <g transform={`translate(${x}, ${y})`} opacity={op}>
        <rect x={-TW / 2} y={-TR} width={TW} height={TH} rx={TR} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="6 6" />
      </g>
    );
  return (
    <g transform={`translate(${x}, ${y})`} opacity={op}>
      <rect x={-TW / 2} y={-TR} width={TW} height={TH} rx={TR} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.9} />
      <path d={`M ${-TW / 2 + TR} ${-TR} A ${TR} ${TR} 0 0 0 ${-TW / 2 + TR} ${TR} Z`} fill={NEG_POLE} opacity={capOp} />
      <path d={`M ${TW / 2 - TR} ${-TR} A ${TR} ${TR} 0 0 1 ${TW / 2 - TR} ${TR} Z`} fill={POS_POLE} opacity={capOp} />
      <path d={`M ${-TW / 2 + 7} 0 H ${-TW / 2 + 19}`} stroke={TEXT_HEX} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M ${TW / 2 - 19} 0 H ${TW / 2 - 7} M ${TW / 2 - 13} -6 V 6`} stroke={TEXT_HEX} strokeWidth={2.2} strokeLinecap="round" />
      {solve > 0.01 && (
        <rect x={-TW / 2} y={-TR} width={TW} height={TH} rx={TR} fill="none" stroke={colors.TEXT} strokeWidth={2.2} opacity={solve} />
      )}
      {[0, 1, 2].map((k) => {
        const isAns = k === answer;
        const base = lerp(4.2, 6, big);
        const spread = CAND_DX[k] * lerp(1, 1.15, big);
        const dx = isAns ? lerp(spread, 0, ease.move(solve)) : spread;
        const s = isAns ? lerp(base, 7, solve) : base * (1 - 0.6 * narrow);
        const candOp = dots * lerp(0.75, 1, big) * (1 - narrow);
        return (
          <g key={k}>
            <Candidate kind={k} x={dx} y={0} s={s} fill={colors.MUTED} op={candOp} />
            {isAns && <Candidate kind={k} x={dx} y={0} s={s} fill={colors.WARM} op={clamp01(narrow - solve)} />}
            {isAns && <Candidate kind={k} x={dx} y={0} s={s} fill={colors.TEXT} op={solve} />}
          </g>
        );
      })}
    </g>
  );
}

function Card({ x, u, dim, children }: { x: number; u: number; dim: number; children: ReactNode }) {
  if (u <= 0.01 || dim <= 0.01) return null;
  return (
    <g transform={`translate(0, ${(1 - u) * 26})`} opacity={u * dim}>
      <rect x={x} y={CARD_Y} width={CARD_W} height={CARD_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function UnitPill({ x, y, text, hl }: { x: number; y: number; text: string; hl: number }) {
  const w = text.length * 8.6 + 22;
  return (
    <g>
      <rect x={x} y={y - 17} width={w} height={26} rx={13} fill={colors.WARM} fillOpacity={0.14 * hl} stroke={hl > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={1.3} strokeOpacity={0.5 + 0.5 * hl} />
      <text x={x + w / 2} y={y + 1} textAnchor="middle" fill={hl > 0.5 ? colors.WARM : colors.MUTED} fontSize={16}>
        {text}
      </text>
    </g>
  );
}

function SoftBand({ y, lo, hi, u }: { y: number; lo: number; hi: number; u: number }) {
  const px = (v: number) => BAND_X0 + ((BAND_X1 - BAND_X0) * v) / 100;
  const x0 = px(lo) - 8;
  const x1 = px(hi) + 8;
  return (
    <g opacity={u}>
      <line x1={BAND_X0} y1={y} x2={BAND_X1} y2={y} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7} />
      <line x1={BAND_X0} y1={y - 5} x2={BAND_X0} y2={y + 5} stroke={colors.MUTED} strokeWidth={1.5} />
      <line x1={BAND_X1} y1={y - 5} x2={BAND_X1} y2={y + 5} stroke={colors.MUTED} strokeWidth={1.5} />
      <rect x={x0} y={y - 7} width={x1 - x0} height={14} rx={7} fill={colors.WARM} opacity={0.85} filter="url(#nnac5-soft)" />
    </g>
  );
}

function Plank({ i, u, dim }: { i: number; u: number; dim: number }) {
  if (u <= 0.01 || dim <= 0.01) return null;
  const x = PLANK_X(i);
  const open = i === 3;
  return (
    <g transform={`translate(0, ${(1 - u) * -18})`} opacity={clamp01(u) * dim}>
      <rect
        x={x}
        y={PLANK_Y}
        width={PLANK_W}
        height={PLANK_H}
        rx={10}
        fill={open ? 'none' : colors.PANEL}
        stroke={open ? colors.WARM : colors.MUTED}
        strokeWidth={open ? 2 : 1.6}
        strokeDasharray={open ? '8 7' : undefined}
      />
      <text x={x + PLANK_W / 2} y={PLANK_Y + 22} textAnchor="middle" fill={open ? colors.WARM : colors.MUTED} fontSize={16} letterSpacing={1.5}>
        {`STEP ${i + 1}`}
      </text>
      <text x={x + PLANK_W / 2} y={PLANK_Y + 46} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
        {PLANKS[i][0]}
      </text>
      <text x={x + PLANK_W / 2} y={PLANK_Y + 67} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
        {PLANKS[i][1]}
      </text>
    </g>
  );
}

function Loupe({ f, op }: { f: Frame & { rx: number }; op: number }) {
  if (op <= 0.01) return null;
  const cx = f.x + f.w / 2 - f.rx;
  const cy = f.y + f.h / 2 - f.rx;
  const hx = cx + f.rx * 0.707;
  const hy = cy + f.rx * 0.707;
  return (
    <g opacity={op}>
      <rect x={f.x - f.w / 2} y={f.y - f.h / 2} width={f.w} height={f.h} rx={f.rx} fill={TEXT_HEX} fillOpacity={0.05} stroke={TEXT_HEX} strokeWidth={3} />
      <line x1={hx} y1={hy} x2={hx + 24} y2={hy + 24} stroke={TEXT_HEX} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

const ICON_PATHS = [
  // lens
  'M -4 -4 m -12 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0 M 5 5 L 17 17',
  // door: frame, stop, swung leaf
  'M -14 20 V -20 H 14 V 20 M -14 -20 L 6 -14 V 24 L -14 20',
  // branch
  'M 0 22 V 4 M 0 4 L -14 -14 M 0 4 L 14 -8 M 8 -3 L 12 -20 M -8 -6 L -18 -2',
  // funnel
  'M -18 -16 H 18 L 4 2 V 20 H -4 V 2 Z',
];

function CurlyBrace({ x0, x1, y, u }: { x0: number; x1: number; y: number; u: number }) {
  const m = (x0 + x1) / 2;
  const d = `M ${x0} ${y} Q ${x0} ${y - 12} ${x0 + 14} ${y - 12} H ${m - 14} Q ${m} ${y - 12} ${m} ${y - 24} Q ${m} ${y - 12} ${m + 14} ${y - 12} H ${x1 - 14} Q ${x1} ${y - 12} ${x1} ${y}`;
  return <path d={d} fill="none" stroke={colors.WARM} strokeWidth={2.2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} />;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const chip = s.get(scene.chip);
  const chipU = s.get(scene.chipU);
  const mapOp = s.get(scene.mapOp);
  const card1U = s.get(scene.card1U);
  const card2U = s.get(scene.card2U);
  const card3U = s.get(scene.card3U);
  const card1Dim = s.get(scene.card1Dim);
  const cardsDim = s.get(scene.cardsDim);
  const cardsOut = s.get(scene.cardsOut);
  const mark1U = s.get(scene.mark1U);
  const lab1U = s.get(scene.lab1U);
  const mark2U = s.get(scene.mark2U);
  const acct2U = s.get(scene.acct2U);
  const focusU = s.get(scene.focusU);
  const poleU = s.get(scene.poleU);
  const bandU = [s.get(scene.band1U), s.get(scene.band2U), s.get(scene.band3U)];
  const unitU = s.get(scene.unitU);
  const braceU = s.get(scene.braceU);
  const loupeU = s.get(scene.loupeU);
  const sweep = s.get(scene.sweep);
  const frameU = s.get(scene.frameU);
  const frame = s.get(scene.frame);
  const lab7U = s.get(scene.lab7U);
  const dotsU = s.get(scene.dotsU);
  const slotsU = s.get(scene.slotsU);
  const plankU = [s.get(scene.plank1), s.get(scene.plank2), s.get(scene.plank3), s.get(scene.plank4)];
  const solveA = s.get(scene.solveA);
  const solveB = s.get(scene.solveB);
  const pulseU = s.get(scene.pulseU);
  const candBig = s.get(scene.candBig);
  const cascade = s.get(scene.cascade);
  const extU = s.get(scene.extU);
  const sideU = s.get(scene.sideU);
  const railDim = s.get(scene.railDim);
  const pathU = s.get(scene.pathU);
  const tagU = s.get(scene.tagU);
  const iconU = scene.iconU.map((c) => s.get(c));
  const stageDim = s.get(scene.stageDim);
  const panelU = s.get(scene.panelU);

  const worldOp = 1 - 0.93 * stageDim;
  const ghostOut = 1 - stageDim; // rail and icons leave entirely behind the closing panel

  // ---- loupe pose: boustrophedon sweep position, morphing into a wide frame ----
  const row = Math.min(ROWS - 1, Math.floor(sweep));
  const f = sweep >= ROWS ? 1 : sweep - row;
  const h = clamp01(f / H_SHARE);
  const sx = row % 2 === 0 ? lerp(SWEEP_XA, SWEEP_XB, h) : lerp(SWEEP_XB, SWEEP_XA, h);
  const sy = TY(row) + (row < ROWS - 1 ? clamp01((f - H_SHARE) / (1 - H_SHARE)) * 64 : 0);
  const loupe = {
    x: lerp(sx, frame.x, frameU),
    y: lerp(sy, frame.y, frameU),
    w: lerp(LOUPE_R * 2, frame.w, frameU),
    h: lerp(LOUPE_R * 2, frame.h, frameU),
    rx: lerp(LOUPE_R, 26, frameU),
  };
  const passAt = (r: number, c: number): number => {
    const hc = (TX(c) - SWEEP_XA) / (SWEEP_XB - SWEEP_XA);
    return r + (r % 2 === 0 ? hc : 1 - hc) * H_SHARE;
  };

  // ---- per-tile solve progress (pure functions of the solve channels) ----
  const solveOf = (r: number, c: number): number => {
    if (c < 2) return stag(solveA, c, 2);
    if (c < 5) return stag(solveB, c - 2, 3);
    return clamp01((cascade - cascadeStart(r, c) - SOLVE_DELAY) / SOLVE_DUR);
  };
  const narrowOf = (r: number, c: number): number =>
    c < 5 ? solveOf(r, c) : clamp01((cascade - cascadeStart(r, c) - NARROW_DELAY) / NARROW_DUR);
  const bridgeOf = (r: number, c: number): number => (c < 5 ? 0 : clamp01((cascade - cascadeStart(r, c)) / BRIDGE_DUR));

  // ---- chip crossfade (replaced, never stacked) ----
  const lo = Math.floor(chip);
  const fr = chip - lo;
  const chipText = fr < 0.5 ? CHIPS[lo] : CHIPS[Math.min(CHIPS.length - 1, lo + 1)];
  const chipOp = chipU * (fr < 0.5 ? 1 - 2 * fr : 2 * fr - 1);
  const chipW = chipText.length * 9.2 + 34;

  const card1Op = card1Dim * cardsOut;
  const card2Op = cardsDim * cardsOut;
  const pct2 = (v: number) => R2.x0 + ((R2.x1 - R2.x0) * v) / 100;
  const fx = TX(FOCUS.c);
  const fy = TY(FOCUS.r);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <filter id="nnac5-soft" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation={3.2} />
        </filter>
      </defs>
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ================= the pole-tile map ================= */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const tp = passAt(r, c);
              const inspected = clamp01((sweep - tp) / 0.06);
              const glow = sweep > 0 && sweep < ROWS ? clamp01(1 - Math.abs(sweep - tp - 0.04) / 0.14) : 0;
              const isFocus = r === FOCUS.r && c === FOCUS.c;
              const op = isFocus ? Math.max(mapOp, focusU) : mapOp;
              return (
                <PoleTile
                  key={`${r}-${c}`}
                  x={TX(c)}
                  y={TY(r)}
                  op={op}
                  ends={inspected}
                  glow={glow}
                  dots={dotsU}
                  narrow={narrowOf(r, c)}
                  solve={solveOf(r, c)}
                  big={c >= 5 ? candBig : 0}
                  answer={ANSWER[r][c]}
                />
              );
            }),
          )}

          {/* constraint bridges: a solved neighbour's + end meets the next tile's − end */}
          {cascade > 0 &&
            Array.from({ length: ROWS }, (_, r) =>
              [5, 6, 7].map((c) => {
                const b = bridgeOf(r, c);
                if (b <= 0) return null;
                const x0 = TX(c - 1) + TW / 2 - 10;
                const x1 = TX(c) - TW / 2 + 10;
                return (
                  <line key={`b${r}-${c}`} x1={x0} y1={TY(r)} x2={lerp(x0, x1, b)} y2={TY(r)} stroke={colors.WARM} strokeWidth={5} strokeLinecap="round" opacity={mapOp} />
                );
              }),
            )}
          {pulseU > 0.01 && pulseU < 0.99 && (
            <rect
              x={TX(4) - TW / 2 - 10 * pulseU}
              y={TY(R0) - TR - 10 * pulseU}
              width={TW + 20 * pulseU}
              height={TH + 20 * pulseU}
              rx={TR + 10 * pulseU}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={3}
              opacity={(1 - pulseU) * mapOp}
            />
          )}

          {/* step 4: a dashed, empty extension past the right edge — it never fills */}
          {extU > 0.01 &&
            Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: EXT }, (_, e) => (
                <PoleTile
                  key={`e${r}-${e}`}
                  x={TX(COLS + e)}
                  y={TY(r)}
                  op={stag(extU, e * ROWS + r, EXT * ROWS, 0.25) * Math.max(mapOp, 0.3)}
                  ends={0}
                  glow={0}
                  dots={0}
                  narrow={0}
                  solve={0}
                  answer={0}
                  dashed
                />
              )),
            )}

          <Loupe f={loupe} op={loupeU} />

          {/* the inspected tile: each end is a pole */}
          {poleU > 0.01 && (
            <g opacity={poleU}>
              <line x1={fx - TW / 2 + 13} y1={fy - TR - 2} x2={fx - 30} y2={fy - TR - 14} stroke={NEG_POLE} strokeWidth={1.6} />
              <line x1={fx + TW / 2 - 13} y1={fy - TR - 2} x2={fx + 30} y2={fy - TR - 14} stroke={POS_POLE} strokeWidth={1.6} />
              <rect x={fx - 78} y={fy - TR - 34} width={156} height={24} rx={8} fill={colors.BG} stroke={colors.GRID} />
              <text x={fx} y={fy - TR - 16} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
                each end is a pole
              </text>
            </g>
          )}

          {/* ================= the three records ================= */}
          <Card x={CARD_X[0]} u={card1U} dim={card1Op}>
            <text x={CARD_X[0] + 18} y={CARD_Y + 32} fill={colors.TEXT} fontSize={20} fontWeight={650}>
              Towards Monosemanticity
            </text>
            <UnitPill x={CARD_X[0] + 18} y={CARD_Y + 62} text={UNITS[0]} hl={clamp01(unitU)} />
            <text x={CARD_X[0] + 160} y={CARD_Y + 63} fill={colors.MUTED} fontSize={16}>
              · one-layer model
            </text>
            <line x1={R1.x0} y1={R1.y} x2={R1.x1} y2={R1.y} stroke={colors.MUTED} strokeWidth={1.6} />
            {Array.from({ length: 15 }, (_, i) => (
              <line key={i} x1={lerp(R1.x0, R1.x1, i / 14)} y1={R1.y - 5} x2={lerp(R1.x0, R1.x1, i / 14)} y2={R1.y + 5} stroke={colors.MUTED} strokeWidth={1.2} />
            ))}
            <text x={R1.x0} y={R1.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              0
            </text>
            <text x={R1.x1} y={R1.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              14
            </text>
            {mark1U > 0.01 && (
              <g opacity={clamp01(mark1U)} transform={`translate(0, ${(1 - mark1U) * -14})`}>
                <path d={`M ${R1.x0 - 8} ${R1.y - 22} H ${R1.x0 + 8} L ${R1.x0} ${R1.y - 9} Z`} fill={colors.WARM} />
                <circle cx={R1.x0} cy={R1.y} r={5} fill={colors.WARM} />
              </g>
            )}
            {lab1U > 0.01 && (
              <text x={CARD_X[0] + 18} y={CARD_Y + 172} fill={colors.WARM} fontSize={18} opacity={lab1U}>
                median 0 of 14: no hypothesis
              </text>
            )}
          </Card>

          <Card x={CARD_X[1]} u={card2U} dim={card2Op}>
            <text x={CARD_X[1] + 18} y={CARD_Y + 32} fill={colors.TEXT} fontSize={20} fontWeight={650}>
              Automated interpretability
            </text>
            <UnitPill x={CARD_X[1] + 18} y={CARD_Y + 62} text={UNITS[1]} hl={clamp01(unitU - 1)} />
            <text x={CARD_X[1] + 196} y={CARD_Y + 63} fill={colors.MUTED} fontSize={16}>
              · OpenAI
            </text>
            <line x1={R2.x0} y1={R2.y} x2={R2.x1} y2={R2.y} stroke={colors.MUTED} strokeWidth={1.6} />
            {[0, 25, 50, 75, 100].map((v) => (
              <line key={v} x1={pct2(v)} y1={R2.y - 5} x2={pct2(v)} y2={R2.y + 5} stroke={colors.MUTED} strokeWidth={1.2} />
            ))}
            <text x={R2.x0} y={R2.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              0
            </text>
            <text x={R2.x1} y={R2.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              100%
            </text>
            {mark2U > 0.01 && (
              <g opacity={clamp01(mark2U)} transform={`translate(0, ${(1 - mark2U) * -14})`}>
                <path d={`M ${pct2(1.7) - 8} ${R2.y - 22} H ${pct2(1.7) + 8} L ${pct2(1.7)} ${R2.y - 9} Z`} fill={colors.WARM} />
                <circle cx={pct2(1.7)} cy={R2.y} r={5} fill={colors.WARM} />
                <text x={pct2(1.7) + 14} y={R2.y - 12} fill={colors.WARM} fontSize={22} fontWeight={650}>
                  ~1.7%
                </text>
                <text x={pct2(1.7) + 86} y={R2.y - 13} fill={colors.MUTED} fontSize={16}>
                  most generous measure
                </text>
              </g>
            )}
            {acct2U > 0.01 && (
              <text x={CARD_X[1] + 18} y={CARD_Y + 172} fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={acct2U}>
                as given in Cammarata's account
              </text>
            )}
          </Card>

          <Card x={CARD_X[2]} u={card3U} dim={cardsOut}>
            <text x={CARD_X[2] + 18} y={CARD_Y + 32} fill={colors.TEXT} fontSize={20} fontWeight={650}>
              Qwen3-32B · preliminary
            </text>
            <UnitPill x={CARD_X[2] + 18} y={CARD_Y + 62} text={UNITS[2]} hl={clamp01(unitU - 2)} />
            {BANDS.map((b, i) =>
              bandU[i] > 0.01 ? (
                <g key={i}>
                  <SoftBand y={BAND_Y[i]} lo={b.lo} hi={b.hi} u={bandU[i]} />
                  <text x={BAND_X0} y={BAND_Y[i] - 11} fill={colors.TEXT} fontSize={16} opacity={bandU[i]}>
                    {b.label}
                  </text>
                </g>
              ) : null,
            )}
          </Card>

          {braceU > 0.01 && (
            <g opacity={cardsOut}>
              <CurlyBrace x0={CARD_X[0] + 10} x1={CARD_X[2] + CARD_W - 10} y={CARD_Y - 4} u={braceU} />
              <rect x={640 - 205} y={CARD_Y - 60} width={410} height={32} rx={9} fill={colors.BG} opacity={clamp01((braceU - 0.5) / 0.5)} />
              <text x={640} y={CARD_Y - 37} textAnchor="middle" fill={colors.WARM} fontSize={22} opacity={clamp01((braceU - 0.5) / 0.5)}>
                different models, different measures
              </text>
            </g>
          )}

          {lab7U > 0.01 && (
            <text x={630} y={452} textAnchor="middle" fill={colors.TEXT} fontSize={22} opacity={lab7U}>
              more inspection, same method
            </text>
          )}
          {sideU > 0.01 && (
            <g opacity={sideU}>
              <rect x={808 - 250} y={428} width={500} height={36} rx={10} fill={colors.BG} />
              <text x={808} y={453} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
                run more experiments on the network itself
              </text>
            </g>
          )}

          {/* ================= the argument rail ================= */}
          {slotsU > 0.01 &&
            [0, 1, 2, 3].map((i) => (
              <rect
                key={`slot${i}`}
                x={PLANK_X(i)}
                y={PLANK_Y}
                width={PLANK_W}
                height={PLANK_H}
                rx={10}
                fill="none"
                stroke={colors.MUTED}
                strokeWidth={1.4}
                strokeDasharray="8 7"
                opacity={slotsU * railDim * ghostOut * 0.55 * (1 - clamp01(plankU[i]))}
              />
            ))}
          {[0, 1, 2, 3].map((i) => (
            <Plank key={i} i={i} u={plankU[i]} dim={railDim * ghostOut} />
          ))}

          {/* ================= retrace on 4e:55: door and lens named, branch and funnel at lower weight ================= */}
          {pathU > 0.01 && ghostOut > 0.01 && (
            <g opacity={ghostOut}>
              <path
                d={`M ${ICON_X[0]} ${ICON_Y[0]} ${ICON_X.slice(1).map((x, i) => `L ${x} ${ICON_Y[i + 1]}`).join(' ')}`}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
                strokeDasharray="2 8"
                strokeLinecap="round"
                opacity={0.8}
                clipPath="url(#nnac5-path)"
              />
              <defs>
                <clipPath id="nnac5-path">
                  <rect x={ICON_X[0] - ICON_R} y={0} width={(ICON_X[3] - ICON_X[0] + ICON_R) * pathU + ICON_R} height={720} />
                </clipPath>
              </defs>
              {ICON_X.map((x, i) => {
                // an empty slot appears as the path reaches it; the icon lights on its own beat
                const reach = clamp01(((ICON_X[3] - ICON_X[0]) * pathU - (x - ICON_X[0])) / 60 + 1);
                const u = ease.enter(iconU[i]);
                const w = ICON_W[i];
                if (reach <= 0.01) return null;
                return (
                  <g key={i} transform={`translate(${x}, ${ICON_Y[i]}) scale(${0.85 + 0.15 * u * w})`}>
                    <circle r={ICON_R} fill={colors.BG} fillOpacity={0.35} stroke={colors.WARM} strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="5 6" opacity={reach * (1 - u)} />
                    {u > 0.01 && (
                      <g opacity={u * w}>
                        <circle r={ICON_R} fill={colors.BG} stroke={colors.WARM} strokeWidth={w < 1 ? 1.8 : 2.8} />
                        <path d={ICON_PATHS[i]} fill="none" stroke={TEXT_HEX} strokeWidth={w < 1 ? 2 : 2.8} strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    )}
                  </g>
                );
              })}
              {tagU > 0.01 && (
                <g transform={`translate(${TAG.x}, ${TAG.y}) scale(${0.9 + 0.1 * tagU})`} opacity={clamp01(tagU)}>
                  <rect x={-62} y={-21} width={124} height={42} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                  <text x={0} y={8} textAnchor="middle" fill={TEXT_HEX} fontSize={22} fontFamily={MONO} fontWeight={600}>
                    4e:55
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ================= closing panel (opaque) ================= */}
        {panelU > 0.01 && (
          <g opacity={panelU}>
            <rect x={340} y={230} width={600} height={240} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={322} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={650}>
              Inspect. Predict. Test.
            </text>
            <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={24}>
              Unexplained remains unexplained.
            </text>
            <rect x={505} y={448} width={270} height={44} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} strokeDasharray="8 7" />
            <text x={640} y={476} textAnchor="middle" fill={colors.WARM} fontSize={17}>
              step 4 · highly speculative
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space status chip ================= */}
      {chipOp > 0.01 && (
        <g opacity={chipOp}>
          <rect x={40} y={28} width={chipW} height={38} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={40 + chipW / 2} y={53} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            {chipText}
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
