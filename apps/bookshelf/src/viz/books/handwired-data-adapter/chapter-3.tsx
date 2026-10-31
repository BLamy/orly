// What the Check Shows
//
// Data Adapter — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/data-adapter/README.md:5 (result), 58-62 (reuse; no graph-size saving), 66 (training), 68 (held-out set),
//     70 (14,016 comparisons; "implementation comparisons, not additional independent samples"), 74-80 (limits)
//   lab/data-adapter/experiment.ts:57-79 (oracle: fround after every op), 177-184 (roundAffine per step),
//     228-253 (makeScene), 255-262 (training seeds), 265-276 (heldOutScenes: seeds 1001-1024 × counts 0,4,6,9,12,
//     each also reversed), 278-304 (boundaryScenes), 306-329 (verify: literal + compiled, found + value)
//   lab/data-adapter/experiment.test.ts:46-47 (factored ops = unfactored ops), 74 (fround((1 + 2^-24) * 3) ≠ 3)
//   lab/data-adapter/report.ts → heldOut.allFitComparisons 14016; reuse.separateOperations 1118,
//     jointUnfactored/factored {operations 200, layers 14}, gatherReads 4; neuralGuide "Not implemented"
//     (re-run at the pin: bun lab/data-adapter/report.ts)
//   src/runtime/numeric-ui-core.ts:414-421 (roundAffine, preserveRounding)
//   lab/status.md:199 (Data adapters — Exact search over 868 programs), 244 (still open)
//   lab/ui-exploration/guide/review-and-decisions.md:254 (soft attention, then argmax: a recommendation, not run)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The ledger wall is the real held-out set: one tile per scene in heldOutScenes()
// order (24 seeds × 9 count/presence shapes, each with its reversed twin) plus the six boundary cases. The
// magnified card is makeScene(1001, 4, present, fractional), ported line for line below, and its local-left answer
// is the oracle's own fround chain (checked against the lab's output). The float ruler values are Math.fround at
// module scope. Change from the plan: the status chip reads "every check matches the plain lookup", per the
// fact-check (review.md, ch 3 #12), and no path is drawn on screen.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH14 = 8.43; // mono advance at 14 px
const COPPER = '#b5653a'; // the book's accent, used for the status stamp only
const minus = (s: string): string => s.replace(/-/g, '−');
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The held-out set (experiment.ts:228-304), ported exactly
// ---------------------------------------------------------------------------

type Slot = { active: boolean; id: number; left: number; top: number; width: number; height: number };
type Scene = { slots: Slot[]; selectedID: number; originX: number; originY: number; scale: number };
const CAPACITY = 12;

function makeScene(seed: number, activeCount: number, absent: boolean, fractional: boolean): Scene {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const coordinate = () => (fractional ? (random() - 0.5) * 20000 : Math.floor(random() * 201) - 100);
  const size = () => (fractional ? random() * 4000 : 1 + Math.floor(random() * 70));
  const baseID = fractional ? 10000 + (seed % 20000) : seed * 20;
  const selectedID = absent || activeCount === 0 ? baseID + 19 : baseID + Math.floor(random() * activeCount);
  const slots = Array.from({ length: CAPACITY }, (_, index): Slot => ({
    active: index < activeCount,
    id: index < activeCount ? baseID + index : selectedID,
    left: coordinate(), top: coordinate(), width: size(), height: size(),
  }));
  for (let index = slots.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [slots[index], slots[other]] = [slots[other], slots[index]];
  }
  return { slots, selectedID, originX: coordinate(), originY: coordinate(), scale: fractional ? random() * 8 - 4 : [2, -3, 1][seed % 3] };
}

const SEEDS = Array.from({ length: 24 }, (_, i) => 1001 + i);
const COUNTS = [0, 4, 6, 9, 12];
/** the nine scene shapes per seed, in heldOutScenes() order */
const SHAPES: { count: number; absent: boolean }[] = COUNTS.flatMap((count) =>
  (count === 0 ? [true] : [false, true]).map((absent) => ({ count, absent })),
);
const N_GEN = SEEDS.length * SHAPES.length;
const N_BOUND = 6;
const N_ALL = 2 * N_GEN + N_BOUND;
if (N_GEN !== 216 || N_ALL !== 438) throw new Error('data-adapter ch3: held-out set is not 216 + 216 + 6');
const N_CMP = N_ALL * 8 * 2 * 2;
if (N_CMP !== 14016) throw new Error('data-adapter ch3: comparisons ≠ 14,016');

// the magnified card: seed 1001, four active rows, selected id present (shape 1, column 0)
const CARD = makeScene(1001, 4, false, true);
const CARD_SEL = CARD.slots.findIndex((s) => s.active && s.id === CARD.selectedID);
const CARD_REV_SEL = CAPACITY - 1 - CARD_SEL;
const CARD_ROW = CARD.slots[CARD_SEL];
const f = Math.fround;
/** oracle 'local-left' (experiment.ts:73) */
const CARD_LOCAL_LEFT = f(f(f(CARD_ROW.left) - f(CARD.originX)) * f(CARD.scale));
if (CARD.selectedID !== 11003 || CARD_LOCAL_LEFT !== -24229.201171875) throw new Error('data-adapter ch3: makeScene port drifted');
const CARD_IDS = CARD.slots.filter((s) => s.active).map((s) => s.id).sort((a, b) => a - b);

// the float ruler (README.md:76; experiment.test.ts:74)
const EPS = 2 ** -24;
const ROUND_IN = f(1 + EPS); // 1: halfway to the next float, ties to even
const KEPT = f(ROUND_IN * 3); // 3
const SKIPPED = f((1 + EPS) * 3); // 3 + 2^-22
if (ROUND_IN !== 1 || KEPT !== 3 || SKIPPED !== 3 + 2 ** -22 || String(SKIPPED) !== '3.000000238418579') {
  throw new Error('data-adapter ch3: float ruler values drifted');
}
const BITS_ONE = (() => {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, ROUND_IN);
  const u = dv.getUint32(0);
  return Array.from({ length: 32 }, (_, i) => (u >>> (31 - i)) & 1);
})();

// report.ts at the pin
const OPS_JOINT = 200;
const OPS_FACTORED = 200;
const LAYERS = 14;
const OPS_SEPARATE = 1118;
const GATHER_READS = 4;

// ---------------------------------------------------------------------------
// Layout (world coordinates; home camera = the 1280×720 stage; y ≥ 630 is the CC band)
// ---------------------------------------------------------------------------

const P = 20; // tile pitch
const T = 16; // tile size
const WX = 120;
const AY = 128;
const BY = 350;
const BDX = 640;
const BDY = 128;
const BDP = 30;
// regrouped wall (beat 12): 30 × 15 at pitch 16
const GP = 16;
const GT = 13;
const GX = 640 - 15 * GP;
const GY = 316;

type Tile = { block: 0 | 1 | 2; k: number; x: number; y: number; present: boolean; count: number; order: number };
const TILES: Tile[] = [];
for (const block of [0, 1] as const) {
  for (let c = 0; c < SEEDS.length; c++) {
    for (let r = 0; r < SHAPES.length; r++) {
      TILES.push({ block, k: c * SHAPES.length + r, x: WX + c * P, y: (block === 0 ? AY : BY) + r * P, present: !SHAPES[r].absent, count: SHAPES[r].count, order: 0 });
    }
  }
}
for (let k = 0; k < N_BOUND; k++) TILES.push({ block: 2, k, x: BDX, y: BDY + k * BDP, present: true, count: 6, order: 0 });
// sweep order: column by column through A, then B, then the boundary column
TILES.forEach((t, i) => (t.order = i));
const gridPos = (i: number): [number, number] => [GX + (i % 30) * GP, GY + Math.floor(i / 30) * GP];
const CARD_TILE = TILES.findIndex((t) => t.block === 0 && t.k === 1);
const CARD_TWIN = TILES.findIndex((t) => t.block === 1 && t.k === 1);

const ROW_LABELS = SHAPES.map((s) => `${s.count} ${s.absent ? 'absent' : 'present'}`);
const BOUND_LABELS = [
  'id 0 · left 1 + 2^-24',
  'id 65535 · width 2^-24 · scale 3',
  'subnormal 2^-149',
  'signed zero −0',
  'large 2^20 − 0.0625',
  'large −2^20 · scale −3.9',
];

const CARD_X = 740;
const CELL_P = 40;
const CELL_W = 34;
const CARD_STRIP_Y = 162;

// float lab (right of the boundary column)
const FX = 940;
const R1Y = 296;
const R2Y = 386;
const RX0 = 980; // left tick
const RX1 = 1220; // next float
const R_SPAN = RX1 - RX0;

// reuse diagram
const SEL = { x: 110, y: 236, w: 260, h: 64 };
const READS = ['left', 'top', 'width', 'height'] as const;
const READ_Y = [164, 222, 280, 338];
const RD = { x: 480, w: 130, h: 34 };
const TASKS = ['left', 'top', 'right', 'bottom', 'local-left', 'local-top', 'scaled-right', 'scaled-bottom'];
const OUT_Y = TASKS.map((_, k) => 152 + k * 30);
const OD = { x: 800, w: 160, h: 24 };
const FEEDS: Record<(typeof READS)[number], string[]> = {
  left: ['left', 'right', 'local-left', 'scaled-right'],
  top: ['top', 'bottom', 'local-top', 'scaled-bottom'],
  width: ['right', 'scaled-right'],
  height: ['bottom', 'scaled-bottom'],
};
const EDGES2 = READS.flatMap((r, ri) => FEEDS[r].map((task) => ({ ri, oi: TASKS.indexOf(task) })));
const BAR_X = 560;
const BAR_K = 0.5; // px per operation

const LIMITS: { main: string; sub: string; mono: boolean }[] = [
  { main: 'no weights', sub: 'nothing is learned', mono: false },
  { main: 'neuralGuide: not implemented', sub: 'search only, no guide', mono: true },
  { main: 'capacity: 12', sub: 'the graph holds twelve slots', mono: true },
  { main: 'no strings · no joins', sub: 'rectangles in one table', mono: false },
  { main: '(left + width − originX) × scale', sub: 'three steps; the vocabulary allows two', mono: true },
];

const CAM_WALL: CameraState = { x: 610, y: 350, k: 1.04 };
const CAM_FRESH: CameraState = { x: 380, y: 262, k: 1.35 };
const CAM_BOUND: CameraState = { x: 900, y: 262, k: 1.3 };
const CAM_RULER: CameraState = { x: 960, y: 292, k: 1.35 };
const CAM_LOCK: CameraState = { x: 940, y: 262, k: 1.3 };
const CAM_STATUS: CameraState = { x: 640, y: 350, k: 1.06 };
const CAM_END: CameraState = { x: 640, y: 352, k: 0.96 };

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, paced at ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'A recovered program only counts if it works on scenes it never saw.',
  'The held-out set has two hundred sixteen generated scenes: new identifiers, counts of zero, four, six, nine, and twelve, fractional geometry, and fractional scales, positive or negative.',
  'Each scene is also run with its storage reversed, adding two hundred sixteen more. Six hand-picked boundary cases bring the total to four hundred thirty-eight checks.',
  'All eight programs match the plain lookup on every one. Found bit and value are compared in both literal and compiled execution: fourteen thousand and sixteen comparisons.',
  'Those are comparisons, not independent samples. Only the two hundred sixteen generated scenes are fresh draws, checked many different ways.',
  'Numbers are thirty-two-bit floats, rounded after every add, subtract, and multiply. That rounding is part of the specification.',
  'Add about one part in sixteen million to one, and the float rounds back to one. Times three gives exactly three. Skip that rounding step and you get three plus a speck.',
  'So the circuit keeps its rounding steps in the order written, and later graph building cannot simplify them away.',
  'Reuse: all eight programs share one selector, computed once, with four field reads feeding eight outputs.',
  'But naming that function saves nothing. The core already merges identical expressions, so both joint circuits have two hundred operations. The eleven hundred eighteen for separate circuits is not a saving.',
  'The limits are plain. Nothing is learned and there is no neural guide. The graph holds twelve slots, with no strings or joins, and three-step formulas fall outside the vocabulary.',
  'Status: it holds within its scope. Eight tests pass, and every check matches the plain lookup. But it is a search result, not a learning result, and the lookup tests and extraction rule are authored.',
  'Still open: retrieving by identifier with soft attention, then argmax, compared against this exact baseline. That experiment is proposed, and has not been run.',
];
// spoken length at 150 wpm (0.4 s per word; numbers spelled out already), plus a breath
const CAP_TIMES = (() => {
  let t = 0.4;
  return CAPTIONS.map((text) => {
    const dur = Math.round((text.split(/\s+/).length * 0.4 + 0.6) * 10) / 10;
    const at = t;
    t = at + dur + 0.7;
    return { at, dur };
  });
})();

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 360, k: 0.98 }, cameraInterp);

  // the wall
  const wallU = tl.channel('wallU', 0); // grey tiles stagger in
  const aColU = tl.channel('aColU', 0); // generated tiles take colour
  const bFlipU = tl.channel('bFlipU', 0); // reversed twins flip in
  const bdU = tl.channel('bdU', 0); // boundary tiles light
  const opA = tl.channel('opA', 1);
  const opB = tl.channel('opB', 1);
  const opBd = tl.channel('opBd', 1);
  const wallOp = tl.channel('wallOp', 1);
  const wallLbl = tl.channel('wallLbl', 0); // headings + row labels
  const headMode = tl.channel('headMode', 0); // 0 description · 1 fresh/reused
  const sweepU = tl.channel('sweepU', 0); // tiles checked, 0..438
  const regroupU = tl.channel('regroupU', 0);
  const gridShift = tl.channel('gridShift', 0);
  // B0
  const unseenU = tl.channel('unseenU', 0);
  const trainU = tl.channel('trainU', 0);
  // B1–B2: the card
  const cardU = tl.channel('cardU', 0);
  const cardValsU = tl.channel('cardValsU', 0);
  const cardChipsU = tl.channel('cardChipsU', 0);
  const revU = tl.channel('revU', 0);
  const totalU = tl.channel('totalU', 0);
  // B3
  const cmpU = tl.channel('cmpU', 0);
  const cmpDoneU = tl.channel('cmpDoneU', 0);
  // B5–B7: float lab
  const bLabU = tl.channel('bLabU', 0);
  const bLabDim = tl.channel('bLabDim', 1);
  const floatU = tl.channel('floatU', 0);
  const codeU = tl.channel('codeU', 0);
  const r1U = tl.channel('r1U', 0);
  const snap1U = tl.channel('snap1U', 0);
  const r2U = tl.channel('r2U', 0);
  const keptU = tl.channel('keptU', 0);
  const skipU = tl.channel('skipU', 0);
  const skipOp = tl.channel('skipOp', 1);
  const rafU = tl.channel('rafU', 0);
  const lockU = tl.channel('lockU', 0);
  const labOp = tl.channel('labOp', 1);
  // B8–B10
  const panelU = tl.channel('panelU', 0);
  const selU = tl.channel('selU', 0);
  const e1U = tl.channel('e1U', 0);
  const e2U = tl.channel('e2U', 0);
  const defU = tl.channel('defU', 0);
  const diagOp = tl.channel('diagOp', 1);
  const barsU = tl.channel('barsU', 0);
  const sepU = tl.channel('sepU', 0);
  const barsOp = tl.channel('barsOp', 1);
  const limitsU = tl.channel('limitsU', 0); // 0..5 rows
  // B11–B12
  const stampU = tl.channel('stampU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const stampOp = tl.channel('stampOp', 1);
  const ghostU = tl.channel('ghostU', 0);

  const C = CAP_TIMES;
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: C[i].at, dur: C[i].dur, text });
    tl.hold(C[i].at + C[i].dur, 0.7);
  });
  const out = (ch: Parameters<typeof tl.tween>[0], at: number) => tl.tween(ch, 0, { at, dur: 0.6, ease: ease.move });

  // — B0 · only unseen scenes count —
  let b = C[0].at;
  tl.tween(trainU, 1, { at: b + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(wallU, 1, { at: b + 0.9, dur: 1.6, ease: ease.linear });
  tl.tween(unseenU, 1, { at: b + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: b + 0.6, dur: 3.2, ease: ease.move });

  // — B1 · 216 generated scenes; the magnified card —
  b = C[1].at;
  out(unseenU, b);
  out(trainU, b);
  tl.tween(wallLbl, 1, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(aColU, 1, { at: b + 0.3, dur: 1.4, ease: ease.linear });
  tl.tween(cardU, 1, { at: b + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(cardValsU, 1, { at: b + 4.0, dur: 0.8, ease: ease.enter });
  tl.tween(cardChipsU, 1, { at: b + 6.8, dur: 0.8, ease: ease.enter });

  // — B2 · reversed twins, six boundary cases: 438 —
  b = C[2].at;
  out(cardChipsU, b);
  tl.tween(revU, 1, { at: b + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(bFlipU, 1, { at: b + 1.0, dur: 2.0, ease: ease.linear });
  tl.tween(bdU, 1, { at: b + 4.6, dur: 1.2, ease: ease.linear });
  tl.tween(totalU, 1, { at: b + 7.0, dur: 0.7, ease: ease.pop });

  // — B3 · eight programs sweep every tile: 14,016 —
  b = C[3].at;
  out(cardU, b);
  out(cardValsU, b);
  out(totalU, b);
  tl.tween(cam, CAM_WALL, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(cmpU, 1, { at: b + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(sweepU, N_ALL, { at: b + 1.2, dur: 6.6, ease: ease.linear });
  tl.tween(cmpDoneU, 1, { at: b + 8.0, dur: 0.6, ease: ease.pop });

  // — B4 · only the 216 are fresh draws —
  b = C[4].at;
  out(cmpU, b);
  out(cmpDoneU, b);
  tl.tween(cam, CAM_FRESH, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(opB, 0.15, { at: b + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(opBd, 0.15, { at: b + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(headMode, 1, { at: b + 1.0, dur: 0.8, ease: ease.linear });

  // — B5 · 32-bit floats, rounded after every operation —
  b = C[5].at;
  tl.tween(wallLbl, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(opA, 0.15, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(opBd, 1, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_BOUND, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(bLabU, 1, { at: b + 0.9, dur: 0.9, ease: ease.enter });
  tl.tween(floatU, 1, { at: b + 2.6, dur: 0.9, ease: ease.enter });
  tl.tween(bLabDim, 0.15, { at: b + 2.6, dur: 0.6, ease: ease.move });
  tl.tween(codeU, 1, { at: b + 4.6, dur: 0.7, ease: ease.enter });

  // — B6 · the float ruler: 1 + 2^-24 rounds to 1; ×3 —
  b = C[6].at;
  tl.tween(cam, CAM_RULER, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(codeU, 0.15, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(r1U, 1, { at: b + 0.4, dur: 1.1, ease: ease.draw });
  tl.tween(snap1U, 1, { at: b + 2.6, dur: 1.0, ease: ease.move });
  tl.tween(r2U, 1, { at: b + 5.2, dur: 1.1, ease: ease.draw });
  tl.tween(keptU, 1, { at: b + 6.4, dur: 0.7, ease: ease.pop });
  tl.tween(skipU, 1, { at: b + 9.2, dur: 1.4, ease: ease.move });

  // — B7 · roundAffine keeps the rounding, in order —
  b = C[7].at;
  tl.tween(cam, CAM_LOCK, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(floatU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(codeU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(skipOp, 0.15, { at: b + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(rafU, 1, { at: b + 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(lockU, 1, { at: b + 2.6, dur: 0.6, ease: ease.pop });

  // — B8 · one selector, four reads, eight outputs —
  b = C[8].at;
  tl.tween(labOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(bLabU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(opA, 1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(opB, 1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(wallOp, 0.12, { at: b + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(panelU, 1, { at: b + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(selU, 1, { at: b + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(e1U, 1, { at: b + 1.5, dur: 1.1, ease: ease.draw });
  tl.tween(e2U, 1, { at: b + 2.6, dur: 1.3, ease: ease.draw });
  tl.tween(defU, 1, { at: b + 4.4, dur: 0.7, ease: ease.enter });

  // — B9 · 200 = 200; 1,118 is not a saving —
  b = C[9].at;
  tl.tween(diagOp, 0.15, { at: b + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(barsU, 1, { at: b + 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(sepU, 1, { at: b + 8.6, dur: 1.4, ease: ease.draw });

  // — B10 · the limits —
  b = C[10].at;
  tl.tween(diagOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(barsOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(limitsU, LIMITS.length, { at: b + 0.6, dur: 9.0, ease: ease.linear });

  // — B11 · status: holds within its scope; the wall regroups —
  b = C[11].at;
  tl.tween(limitsU, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(panelU, 0, { at: b + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(wallOp, 1, { at: b + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_STATUS, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(regroupU, 1, { at: b + 0.6, dur: 1.6, ease: ease.move });
  tl.tween(stampU, 1, { at: b + 1.8, dur: 0.6, ease: ease.pop });
  tl.tween(chipsU, 1, { at: b + 3.4, dur: 4.0, ease: ease.linear });

  // — B12 · still open: soft attention → argmax, proposed, not run —
  b = C[12].at;
  tl.tween(chipsU, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(stampOp, 0.15, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(gridShift, 1, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_END, { at: b + 0.2, dur: 2.0, ease: ease.move });
  tl.tween(ghostU, 1, { at: b + 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(C[12].at + C[12].dur + 0.7, 2.0);

  return {
    tl, cam,
    wallU, aColU, bFlipU, bdU, opA, opB, opBd, wallOp, wallLbl, headMode, sweepU, regroupU, gridShift,
    unseenU, trainU, cardU, cardValsU, cardChipsU, revU, totalU, cmpU, cmpDoneU,
    bLabU, bLabDim, floatU, codeU, r1U, snap1U, r2U, keptU, skipU, skipOp, rafU, lockU, labOp,
    panelU, selU, e1U, e2U, defU, diagOp, barsU, sepU, barsOp, limitsU,
    stampU, chipsU, stampOp, ghostU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs >= 14 ? CH14 : CH13) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function CodeChip({ x, y, lines, stripe = colors.TEAL, opacity = 1, note }: {
  x: number; y: number; lines: string[]; stripe?: string; opacity?: number; note?: string;
}) {
  if (opacity <= 0.005) return null;
  const lh = 17;
  const w = Math.max(...lines.map((l) => l.length)) * CH13 + 26;
  const h = lines.length * lh + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 6 + lh * (i + 1) - 4} fill={colors.TEXT} fontSize={13} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
      {note && (
        <text x={x + w} y={y + h + 16} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
          {note}
        </text>
      )}
    </g>
  );
}

function Lock({ x, y, s = 1, color, opacity = 1 }: { x: number; y: number; s?: number; color: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round">
      <path d={`M ${x - 5 * s} ${y - 2 * s} V ${y - 7 * s} A ${5 * s} ${5 * s} 0 0 1 ${x + 5 * s} ${y - 7 * s} V ${y - 2 * s}`} />
      <rect x={x - 8 * s} y={y - 2 * s} width={16 * s} height={12 * s} rx={2.5 * s} fill={color} fillOpacity={0.25} />
    </g>
  );
}

function Check({ x, y, s = 1, color = colors.POSITIVE, opacity = 1 }: { x: number; y: number; s?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <path d={`M ${x - 4 * s} ${y} L ${x - 1 * s} ${y + 3 * s} L ${x + 5 * s} ${y - 4 * s}`} stroke={color} strokeWidth={1.8 * s} fill="none"
      strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

/** a block heading that switches text through a dip at mode 0.5 (no cross-faded overlap) */
function SwitchText({ x, y, a, b, mode, anchor = 'start', fill, fs = 13, opacity = 1 }: {
  x: number; y: number; a: string; b: string; mode: number; anchor?: 'start' | 'middle' | 'end'; fill: string; fs?: number; opacity?: number;
}) {
  const op = opacity * Math.abs(mode * 2 - 1);
  if (op <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={fs} fontFamily={UI} opacity={op}>
      {mode < 0.5 ? a : b}
    </text>
  );
}

const curve = (x1: number, y1: number, x2: number, y2: number): string => {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wallU = s.get(scene.wallU);
  const aColU = s.get(scene.aColU);
  const bFlipU = s.get(scene.bFlipU);
  const bdU = s.get(scene.bdU);
  const opA = s.get(scene.opA);
  const opB = s.get(scene.opB);
  const opBd = s.get(scene.opBd);
  const wallOp = s.get(scene.wallOp);
  const wallLbl = s.get(scene.wallLbl);
  const headMode = s.get(scene.headMode);
  const sweepU = s.get(scene.sweepU);
  const regroupU = s.get(scene.regroupU);
  const gridShift = s.get(scene.gridShift);
  const unseenU = s.get(scene.unseenU);
  const trainU = s.get(scene.trainU);
  const cardU = s.get(scene.cardU);
  const cardValsU = s.get(scene.cardValsU);
  const cardChipsU = s.get(scene.cardChipsU);
  const revU = s.get(scene.revU);
  const totalU = s.get(scene.totalU);
  const cmpU = s.get(scene.cmpU);
  const cmpDoneU = s.get(scene.cmpDoneU);
  const bLabU = s.get(scene.bLabU);
  const bLabDim = s.get(scene.bLabDim);
  const floatU = s.get(scene.floatU);
  const codeU = s.get(scene.codeU);
  const r1U = s.get(scene.r1U);
  const snap1U = s.get(scene.snap1U);
  const r2U = s.get(scene.r2U);
  const keptU = s.get(scene.keptU);
  const skipU = s.get(scene.skipU);
  const skipOp = s.get(scene.skipOp);
  const rafU = s.get(scene.rafU);
  const lockU = s.get(scene.lockU);
  const labOp = s.get(scene.labOp);
  const panelU = s.get(scene.panelU);
  const selU = s.get(scene.selU);
  const e1U = s.get(scene.e1U);
  const e2U = s.get(scene.e2U);
  const defU = s.get(scene.defU);
  const diagOp = s.get(scene.diagOp);
  const barsU = s.get(scene.barsU);
  const sepU = s.get(scene.sepU);
  const barsOp = s.get(scene.barsOp);
  const limitsU = s.get(scene.limitsU);
  const stampU = s.get(scene.stampU);
  const chipsU = s.get(scene.chipsU);
  const stampOp = s.get(scene.stampOp);
  const ghostU = s.get(scene.ghostU);

  const checked = Math.floor(sweepU + 1e-6);
  const counter = Math.min(N_CMP, checked * 32);
  const scanTile = sweepU > 0.01 && sweepU < N_ALL - 0.01 ? TILES[Math.min(N_ALL - 1, checked)] : null;
  const ringU = cardU * (1 - clamp01(regroupU * 4));
  const ringTile = TILES[revU < 0.5 ? CARD_TILE : CARD_TWIN];
  const shiftX = -250 * gridShift;

  // ---------- the wall ----------
  const tiles = TILES.map((t, i) => {
    const ap = clamp01(wallU * 1.25 * N_ALL - i + 1); // linear stagger by index
    if (ap <= 0.01) return null;
    let color: string = colors.MUTED;
    let colU = 0;
    let flip = 1;
    let blockOp = 1;
    if (t.block === 0) {
      colU = clamp01(aColU * 1.3 * SEEDS.length - Math.floor(t.k / SHAPES.length));
      color = colors.TEAL;
      blockOp = opA;
    } else if (t.block === 1) {
      const u = clamp01(bFlipU * 1.3 * SEEDS.length - Math.floor(t.k / SHAPES.length));
      colU = u >= 0.5 ? 1 : 0;
      flip = Math.abs(Math.cos(Math.PI * u));
      color = colors.SECONDARY;
      blockOp = opB;
    } else {
      colU = clamp01(bdU * N_BOUND * 1.2 - t.k);
      color = colors.WARM;
      blockOp = opBd;
    }
    const [gx, gy] = gridPos(i);
    const ru = clamp01(regroupU * 1.6 - (i / N_ALL) * 0.6);
    const x = lerp(t.x, gx + shiftX, ru);
    const y = lerp(t.y, gy, ru);
    const size = lerp(T, GT, ru);
    // after the regroup every tile is one ledger: the passed checks, in one colour per origin
    const op = ap * lerp(blockOp, 1, ru) * wallOp;
    const fillOp = colU > 0 ? (t.present ? 0.85 : 0.28) * colU + 0.2 * (1 - colU) : 0.2;
    const stroke = colU > 0.5 ? color : colors.MUTED;
    const isChecked = i < checked && regroupU < 0.5;
    const isScan = scanTile !== null && i === checked;
    const cx = x + size / 2;
    return (
      <g key={i} opacity={op}>
        <rect x={cx - (size / 2) * flip} y={y} width={size * flip} height={size} rx={3}
          fill={colU > 0.5 || t.block === 0 ? color : colors.MUTED} fillOpacity={colU > 0 ? fillOp : 0.18}
          stroke={isScan ? colors.TEXT : stroke} strokeOpacity={isScan ? 1 : 0.7} strokeWidth={isScan ? 2 : 1} />
        {t.block !== 2 && colU > 0.5 && t.count > 0 && ru < 0.5 && (
          <rect x={x + 2} y={y + size - 4} width={((size - 4) * t.count) / CAPACITY} height={2} fill={colors.BG} opacity={0.7} />
        )}
        {isChecked && <Check x={cx} y={y + size / 2} s={0.9} color={t.present ? colors.BG : colors.POSITIVE} />}
      </g>
    );
  });

  const lbl = wallLbl * (1 - clamp01(regroupU * 3));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the ledger wall ======================== */}
        <g>{tiles}</g>
        {scanTile && (
          <rect x={scanTile.x - 2} y={(scanTile.block === 1 ? BY : AY) - 4} width={T + 4} height={scanTile.block === 2 ? N_BOUND * BDP : SHAPES.length * P + 4}
            fill="none" stroke={colors.TEXT} strokeOpacity={0.35} rx={4} />
        )}
        {ringU > 0.01 && regroupU < 0.3 && (
          <rect x={ringTile.x - 4} y={ringTile.y - 4} width={T + 8} height={T + 8} rx={5} fill="none" stroke={colors.WARM} strokeWidth={2.2}
            opacity={ringU * (ringTile.block === 1 ? clamp01(bFlipU * 20) : 1)} />
        )}

        {/* headings + row labels */}
        {lbl > 0.01 && (
          <g>
            <text x={WX} y={AY - 12} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={lbl * opA}>1001</text>
            <text x={WX + 24 * P - 4} y={AY - 12} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={lbl * opA}>1024</text>
            <SwitchText x={WX + 12 * P} y={AY - 12} anchor="middle" fill={colors.TEAL} mode={headMode} opacity={lbl}
              a="216 generated scenes · one column per seed" b="216 fresh draws · the only independent samples" />
            {ROW_LABELS.map((r, k) => (
              <text key={k} x={WX - 8} y={AY + k * P + 12} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={lbl * opA}>
                {r}
              </text>
            ))}
            {bFlipU > 0.01 && (
              <SwitchText x={WX + 12 * P} y={BY - 12} anchor="middle" fill={colors.SECONDARY} mode={headMode} opacity={lbl * clamp01(bFlipU * 3)}
                a="216 reversed twins · same scene, storage reversed" b="216 reversed · same draws, run again" />
            )}
            {bdU > 0.01 && (
              <SwitchText x={BDX - 8} y={BDY - 12} fill={colors.WARM} mode={headMode} opacity={lbl * clamp01(bdU * 3)} a="6 boundary" b="6 hand-picked" />
            )}
          </g>
        )}
        {unseenU > 0.01 && (
          <text x={WX + 12 * P} y={AY - 16} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={UI} opacity={unseenU}>
            438 scenes the search never saw
          </text>
        )}

        {/* B0 · the training strip */}
        {trainU > 0.01 && (
          <g opacity={trainU}>
            <text x={CARD_X + 20} y={196} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              training · 12 scenes, seeds 1 and 2, integer geometry
            </text>
            {Array.from({ length: 12 }, (_, k) => (
              <rect key={k} x={CARD_X + 20 + k * P} y={210} width={T} height={T} rx={3} fill={colors.MUTED} fillOpacity={0.5} stroke={colors.MUTED} />
            ))}
            <text x={CARD_X + 20} y={258} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              → one program per task. Now test it on new scenes.
            </text>
          </g>
        )}

        {/* B1–B2 · the magnified card: makeScene(1001, 4, present) */}
        {cardU > 0.01 && (
          <g opacity={cardU}>
            <rect x={CARD_X - 2} y={133} width={10} height={10} rx={2} fill="none" stroke={colors.WARM} strokeWidth={2} />
            <text x={CARD_X + 16} y={143} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              {`seed 1001 · 4 active rows · selected id ${CARD.selectedID}`}
            </text>
            {CARD.slots.map((sl, i) => {
              const sel = i === CARD_SEL;
              const to = CAPACITY - 1 - i;
              const x = lerp(CARD_X + i * CELL_P, CARD_X + to * CELL_P, revU);
              const lift = Math.sin(Math.PI * revU) * (i < 6 ? -16 : 16);
              const stroke = sel ? colors.WARM : sl.active ? colors.TEAL : colors.GRID;
              return (
                <g key={i}>
                  <rect x={x} y={CARD_STRIP_Y + lift} width={CELL_W} height={30} rx={4} fill={sel ? colors.WARM : sl.active ? colors.TEAL : colors.PANEL}
                    fillOpacity={sl.active ? 0.3 : 1} stroke={stroke} strokeWidth={sel ? 2 : 1} />
                  {sl.active && (
                    <text x={x + CELL_W / 2} y={CARD_STRIP_Y + lift + 20} textAnchor="middle" fill={sel ? colors.WARM : colors.TEAL} fontSize={13} fontFamily={MONO}>
                      {String(sl.id).slice(-2)}
                    </text>
                  )}
                </g>
              );
            })}
            {Array.from({ length: CAPACITY }, (_, i) => (
              <text key={i} x={CARD_X + i * CELL_P + CELL_W / 2} y={CARD_STRIP_Y + 50} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                {i}
              </text>
            ))}
            <SwitchText x={CARD_X} y={CARD_STRIP_Y + 74} fill={colors.MUTED} mode={revU}
              a={`new ids ${CARD_IDS[0]}–${CARD_IDS[CARD_IDS.length - 1]} · empty slots repeat ${CARD.selectedID} as decoys`}
              b={`storage reversed · the selected row moves from slot ${CARD_SEL} to slot ${CARD_REV_SEL}`} />
            {cardValsU > 0.01 && (
              <g opacity={cardValsU}>
                {[
                  ['left', CARD_ROW.left],
                  ['width', CARD_ROW.width],
                  ['originX', CARD.originX],
                  ['scale', CARD.scale],
                ].map(([k, v], r) => (
                  <g key={r}>
                    <text x={CARD_X} y={276 + r * 24} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{k as string}</text>
                    <text x={CARD_X + 190} y={276 + r * 24} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                      {minus((v as number).toFixed(3))}
                    </text>
                  </g>
                ))}
                <text x={CARD_X + 236} y={276} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  plain lookup, local-left (FP32)
                </text>
                <text x={CARD_X + 236} y={304} fill={colors.WARM} fontSize={18} fontFamily={MONO}>
                  {minus(String(CARD_LOCAL_LEFT))}
                </text>
                <text x={CARD_X + 236} y={328} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  (left − originX) × scale
                </text>
              </g>
            )}
            {cardChipsU > 0.01 && (
              <g opacity={cardChipsU}>
                <Chip x={CARD_X} y={392} text="seeds 1001-1024" color={colors.TEAL} mono />
                <Chip x={CARD_X + 150} y={392} text="counts 0, 4, 6, 9, 12" color={colors.TEAL} mono />
                <Chip x={CARD_X + 346} y={392} text="scale −4 … 4" color={colors.TEAL} mono />
              </g>
            )}
            {totalU > 0.01 && (
              <g opacity={clamp01(totalU)}>
                <text x={CARD_X} y={446} fill={colors.TEXT} fontSize={24} fontFamily={MONO}>
                  438 = 216 + 216 + 6
                </text>
                <text x={CARD_X} y={472} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  generated · reversed twins · boundary cases
                </text>
              </g>
            )}
          </g>
        )}

        {/* B3 · the comparison counter */}
        {cmpU > 0.01 && (
          <g opacity={cmpU}>
            <text x={CARD_X} y={140} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              eight programs, run on every tile
            </text>
            {TASKS.map((t, k) => (
              <Chip key={k} x={CARD_X + (k % 2) * 146} y={172 + Math.floor(k / 2) * 30} text={t} color={colors.TEAL} mono />
            ))}
            <text x={1180} y={206} textAnchor="end" fill={colors.TEXT} fontSize={40} fontFamily={MONO}>
              {commas(counter)}
            </text>
            <text x={1180} y={232} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              comparisons
            </text>
            <text x={CARD_X} y={312} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
              14,016 comparisons = 438 × 8 × 2 × 2
            </text>
            <text x={CARD_X} y={338} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              scenes × programs × (found bit, value) × (literal, compiled)
            </text>
            <Chip x={CARD_X} y={388} text="every one matches the plain lookup" color={colors.POSITIVE} opacity={cmpDoneU} />
          </g>
        )}

        {/* ======================== B5–B7 · the float lab ======================== */}
        {bLabU > 0.01 && (
          <g opacity={bLabU * labOp}>
            {BOUND_LABELS.map((l, k) => {
              const focus = k === 1 && r1U > 0.01 ? 1 : bLabDim;
              return (
                <text key={k} x={BDX + 26} y={BDY + k * BDP + 13} fill={colors.WARM} fontSize={13} fontFamily={MONO} opacity={focus}>
                  {l}
                </text>
              );
            })}
          </g>
        )}
        {floatU > 0.01 && (
          <g opacity={floatU}>
            <text x={FX} y={98} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
              Float32Array · 1 sign · 8 exponent · 23 fraction bits
            </text>
            {BITS_ONE.map((bit, i) => {
              const x = FX + i * 10;
              const c = i === 0 ? colors.NEGATIVE : i < 9 ? colors.SECONDARY : colors.TEAL;
              return (
                <g key={i}>
                  <rect x={x} y={108} width={9} height={18} rx={1.5} fill={c} fillOpacity={bit ? 0.6 : 0.12} stroke={c} strokeOpacity={0.6} />
                </g>
              );
            })}
            <text x={FX + 4} y={144} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>s</text>
            <text x={FX + 50} y={144} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>exponent</text>
            <text x={FX + 205} y={144} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={MONO}>fraction</text>
            {/* the 24th fraction bit that 1 + 2^-24 would need: it has nowhere to go */}
            {(() => {
              const fall = snap1U;
              return (
                <g opacity={(1 - fall) * clamp01(r1U * 3)}>
                  <rect x={FX + 322} y={108 + fall * 40} width={9} height={18} rx={1.5} fill={colors.WARM} fillOpacity={0.6} stroke={colors.WARM} strokeDasharray="3 2" />
                </g>
              );
            })()}
          </g>
        )}
        <CodeChip x={FX} y={168} lines={['Math.fround(Math.fround(left + width) * scale)']} stripe={colors.TEAL} opacity={codeU}
          note="the plain lookup, scaled-right: every op rounds" />

        {/* ruler 1: near 1 */}
        {r1U > 0.01 && (
          <g opacity={r1U * labOp}>
            <line x1={RX0 - 30} y1={R1Y} x2={RX0 - 30 + (R_SPAN + 60) * r1U} y2={R1Y} stroke={colors.MUTED} strokeWidth={1.5} />
            {[RX0, RX1].map((x, k) => (
              <g key={k}>
                <line x1={x} y1={R1Y - 9} x2={x} y2={R1Y + 9} stroke={colors.TEXT} strokeWidth={2} />
              </g>
            ))}
            <text x={RX0} y={R1Y - 16} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>1</text>
            <text x={RX1} y={R1Y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>1 + 2^-23</text>
            {(() => {
              const x = lerp(RX0 + R_SPAN / 2, RX0, snap1U);
              return (
                <g>
                  <circle cx={x} cy={R1Y} r={6} fill={colors.WARM} />
                  <text x={RX0 + R_SPAN / 2} y={R1Y - 16} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO} opacity={1 - snap1U}>
                    1 + 2^-24
                  </text>
                  <text x={RX0 + R_SPAN / 2} y={R1Y + 26} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={snap1U}>
                    halfway, ties to even: rounds back to 1
                  </text>
                </g>
              );
            })()}
            <Lock x={RX0 - 46} y={R1Y + 2} color={colors.POSITIVE} opacity={lockU} />
          </g>
        )}

        {/* ruler 2: near 3 */}
        {r2U > 0.01 && (
          <g opacity={r2U * labOp}>
            <line x1={RX0 - 30} y1={R2Y} x2={RX0 - 30 + (R_SPAN + 60) * r2U} y2={R2Y} stroke={colors.MUTED} strokeWidth={1.5} />
            {[RX0, RX1].map((x, k) => (
              <line key={k} x1={x} y1={R2Y - 9} x2={x} y2={R2Y + 9} stroke={colors.TEXT} strokeWidth={2} />
            ))}
            <text x={RX0} y={R2Y - 16} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>3</text>
            <text x={RX1} y={R2Y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>3 + 2^-22</text>
            <path d={`M ${RX0} ${R2Y + 14} v 5 H ${RX1} v -5`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
            <text x={(RX0 + RX1) / 2} y={R2Y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              one float step here: 2^-22
            </text>
            {keptU > 0.01 && (
              <g opacity={clamp01(keptU)}>
                <circle cx={RX0} cy={R2Y} r={6 + 2 * (1 - keptU)} fill={colors.POSITIVE} />
                <text x={FX} y={R2Y + 60} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                  fround(fround(1 + 2^-24) * 3) = 3
                </text>
                <Lock x={RX0 - 46} y={R2Y + 2} color={colors.POSITIVE} opacity={lockU} />
              </g>
            )}
            {skipU > 0.01 && (
              <g opacity={clamp01(skipU * 3) * skipOp}>
                {(() => {
                  const exact = RX0 + R_SPAN * 0.75; // (1 + 2^-24) × 3 = 3 + 0.75 · 2^-22
                  const x = lerp(exact, RX1, clamp01(skipU * 1.6 - 0.6));
                  return <circle cx={x} cy={R2Y} r={6} fill={colors.NEGATIVE} />;
                })()}
                <text x={FX} y={R2Y + 80} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                  fround((1 + 2^-24) * 3) = 3.000000238418579
                </text>
              </g>
            )}
          </g>
        )}
        <CodeChip x={FX} y={100} stripe={colors.POSITIVE} opacity={rafU * labOp}
          lines={[
            '// Keep this evaluation, term order, and',
            '// input wires intact, including constants.',
            'roundAffine(terms: Terms, bias = 0): Wire {',
            "  return this.append('affine', terms, bias,",
            '    [], 0, {preserveRounding: true})',
          ]} />
        {lockU > 0.01 && (
          <text x={FX} y={236} fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={lockU * labOp}>
            each rounding stays, in the order written; later passes can't merge it away
          </text>
        )}

        {/* ======================== B8–B10 · reuse, bars, limits (over a whispering wall) ======================== */}
        {panelU > 0.01 && (
          <rect x={70} y={92} width={1140} height={524} rx={14} fill={colors.PANEL} fillOpacity={0.86 * panelU} stroke={colors.GRID} strokeOpacity={panelU} />
        )}
        {selU > 0.01 && (
          <g opacity={selU * diagOp * panelU}>
            <text x={SEL.x + SEL.w / 2} y={134} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>1 selector</text>
            <text x={RD.x + RD.w / 2} y={134} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>4 field reads</text>
            <text x={OD.x + OD.w / 2} y={134} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>8 outputs</text>
            <rect x={SEL.x} y={SEL.y} width={SEL.w} height={SEL.h} rx={10} fill={colors.BG} stroke={colors.TEAL} strokeWidth={2} />
            <text x={SEL.x + SEL.w / 2} y={SEL.y + 28} textAnchor="middle" fill={colors.TEAL} fontSize={16} fontFamily={MONO}>active AND same-id</text>
            <text x={SEL.x + SEL.w / 2} y={SEL.y + 50} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>row selection, computed once</text>
            {READ_Y.map((y, k) => (
              <path key={k} d={curve(SEL.x + SEL.w, SEL.y + SEL.h / 2, RD.x, y)} fill="none" stroke={colors.TEAL} strokeWidth={1.6} strokeOpacity={0.7}
                pathLength={1} strokeDasharray={`${e1U} 1`} />
            ))}
            {READS.map((r, k) => (
              <g key={r} opacity={clamp01(e1U * 1.4 - k * 0.1)}>
                <rect x={RD.x} y={READ_Y[k] - RD.h / 2} width={RD.w} height={RD.h} rx={7} fill={colors.BG} stroke={colors.TEAL} />
                <text x={RD.x + RD.w / 2} y={READ_Y[k] + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{`read ${r}`}</text>
              </g>
            ))}
            {EDGES2.map(({ ri, oi }, k) => (
              <path key={k} d={curve(RD.x + RD.w, READ_Y[ri], OD.x, OUT_Y[oi])} fill="none" stroke={colors.TEAL} strokeWidth={1.3} strokeOpacity={0.55}
                pathLength={1} strokeDasharray={`${e2U} 1`} />
            ))}
            {TASKS.map((t, k) => (
              <g key={t} opacity={clamp01(e2U * 1.6 - 0.6)}>
                <rect x={OD.x} y={OUT_Y[k] - OD.h / 2} width={OD.w} height={OD.h} rx={6} fill={colors.BG} stroke={colors.GRID} />
                <text x={OD.x + 12} y={OUT_Y[k] + 5} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{t}</text>
              </g>
            ))}
            <Chip x={RD.x + RD.w / 2} y={386} anchor="middle" text={`gatherReads: ${GATHER_READS}`} color={colors.TEAL} mono opacity={defU} />
            <text x={OD.x + OD.w + 20} y={OUT_Y[3] + 5} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={defU}>
              each: found bit + value
            </text>
            <text x={640} y={420} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={defU}>
              selectedField(field) = active &amp; same-id -&gt; read field
            </text>
          </g>
        )}
        {barsU > 0.01 && (
          <g opacity={barsOp * panelU}>
            {[
              { label: `jointUnfactored: ${OPS_JOINT} operations, ${LAYERS} layers`, v: OPS_JOINT, y: 470 },
              { label: `factored: ${OPS_FACTORED} operations, ${LAYERS} layers`, v: OPS_FACTORED, y: 508 },
            ].map((r, k) => (
              <g key={k}>
                <text x={110} y={r.y + 5} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{r.label}</text>
                <rect x={BAR_X} y={r.y - 9} width={r.v * BAR_K * barsU} height={18} rx={3} fill={colors.TEAL} fillOpacity={0.75} />
              </g>
            ))}
            <text x={BAR_X + OPS_JOINT * BAR_K + 16} y={494} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(barsU * 2 - 1)}>
              equal: the core already merges identical expressions
            </text>
            {sepU > 0.01 && (
              <g opacity={clamp01(sepU * 2)}>
                <text x={110} y={551} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{`separateOperations: ${commas(OPS_SEPARATE)}`}</text>
                <rect x={BAR_X} y={537} width={OPS_SEPARATE * BAR_K * sepU} height={18} rx={3} fill="none" stroke={colors.MUTED} strokeDasharray="5 4" strokeWidth={1.4} />
                <text x={BAR_X} y={584} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(sepU * 2 - 1)}>
                  eight circuits built apart: it measures sharing between them, not a saving
                </text>
              </g>
            )}
          </g>
        )}
        {limitsU > 0.01 && (
          <g opacity={panelU}>
            <text x={640} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI} opacity={clamp01(limitsU)}>
              the limits
            </text>
            {LIMITS.map((l, k) => {
              const u = clamp01(limitsU - k);
              if (u <= 0.01) return null;
              const y = 182 + k * 76;
              return (
                <g key={k} opacity={u}>
                  <Lock x={350} y={y - 4} s={1.2} color={colors.WARM} />
                  <text x={384} y={y} fill={colors.TEXT} fontSize={18} fontFamily={l.mono ? MONO : UI}>{l.main}</text>
                  <text x={384} y={y + 24} fill={colors.MUTED} fontSize={14} fontFamily={UI}>{l.sub}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== B11–B12 · status, and the open comparison ======================== */}
        {stampU > 0.01 && (
          <g opacity={clamp01(stampU) * stampOp}>
            <g transform={`rotate(-3 640 172) translate(640 172) scale(${lerp(1.3, 1, clamp01(stampU))}) translate(-640 -172)`}>
              <rect x={430} y={136} width={420} height={60} rx={8} fill={colors.BG} stroke={COPPER} strokeWidth={3} />
              <text x={640} y={176} textAnchor="middle" fill={COPPER} fontSize={30} fontFamily={UI} fontWeight={700}>
                holds within its scope
              </text>
            </g>
          </g>
        )}
        {chipsU > 0.01 && (
          <g>
            <Chip x={350} y={238} anchor="middle" text="8 tests pass" color={colors.POSITIVE} opacity={clamp01(chipsU * 4)} />
            <Chip x={640} y={238} anchor="middle" text="every check matches the plain lookup" color={colors.POSITIVE} opacity={clamp01(chipsU * 4 - 0.6)} />
            <Chip x={440} y={274} anchor="middle" text="a search result, not a learning result" color={colors.WARM} opacity={clamp01(chipsU * 4 - 1.6)} />
            <Chip x={820} y={274} anchor="middle" text="authored predicates + extraction rule" color={colors.WARM} opacity={clamp01(chipsU * 4 - 2.4)} />
          </g>
        )}
        {regroupU > 0.5 && (
          <text x={640 + shiftX} y={GY + 15 * GP + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}
            opacity={clamp01(regroupU * 2 - 1) * (1 - gridShift)}>
            438 / 438 held-out scenes · lab status: Data adapters — Exact search over 868 programs
          </text>
        )}
        {ghostU > 0.01 && (
          <g opacity={ghostU}>
            <text x={640 + shiftX} y={GY + 15 * GP + 24} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
              exact baseline · active AND same-id
            </text>
            <rect x={760} y={320} width={380} height={110} rx={14} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="7 6" />
            <text x={950} y={366} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO} opacity={0.8}>
              soft attention → argmax
            </text>
            <text x={950} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              retrieve a rectangle by identifier
            </text>
            <path d={`M 756 375 H ${GX + shiftX + 30 * GP + 14}`} stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="4 5" />
            <path d={`M ${GX + shiftX + 30 * GP + 14} 375 l 8 -5 v 10 z`} fill={colors.MUTED} />
            <text x={(756 + GX + shiftX + 30 * GP + 14) / 2} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              compare
            </text>
            <Chip x={950} y={470} anchor="middle" text="proposed · not run" color={colors.WARM} fs={14} />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title band ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · What the Check Shows
      </text>
      <text x={40} y={58} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={0.8}>
        Data Adapter · the held-out check
      </text>
    </>
  );
}

export const vizScene = () => scene;
