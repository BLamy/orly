// Exact, Within Limits
//
// Event Window — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT),
// paths under lab/event-window/ unless stated.
//   harness.ts:21-112 (runClosedLoop: the circuit's own state feeds the next frame; the oracle judges each frame)
//   exactness.test.ts:13-25 (12 seeds × 10,000 frames, 0 divergences), :50-73 (16 relation masks × 2,000 frames,
//     mask bit order dragFromTitle, dragFromBody, clickTogglesFromTitle, clickTogglesFromBody); README.md:39-40
//     (integer coordinates, exact === comparison)
//   boundary-probe.test.ts:91-120 (200 sequential drags alternating +7 / −6; left = initialLeft + dragCount / 2;
//     rectangle 0 starts at left 400, :31-50)
//   training-sweep.ts:23,36 (3 held-out traces × 10,000 frames per start; recovered 20/20 at the pin);
//     training.test.ts:47-77 (6 starts, 2 held-out traces, expect(recovered).toBeGreaterThanOrEqual(5))
//   measure-cost.ts live run at the pin: K = 1, 2, 4, 8, 16 → 480, 516, 588, 732, 1020 ops, depth 52 at every K,
//     883 stored weights at K = 1, +72 per record; window-depth.test.ts:94-115 pins linearity only
//   README.md:31,116 (the stale table: 502 ops, depth 38)
//   circuit.ts:425-452 (archive shift register; "The behavior above never reads these"); circuit.ts:38-80 (the
//     live press record and slopLatch cell names); circuit.ts:590-597 (behaviorParameterCells)
//   train.ts:80 (writeOracleStateToSource); README.md:132 ("Training recovers parameter cells, not structure.")
//   lab/status.md:200 (verbatim: "Training supplies correct internal state and decision labels. Persistent state
//     and temporal dependencies remain.")
//   reassessment-2026-09-03.md:86-88 (moves squashed into the final move); pointer-input.ts:5-13;
//     pointer-input.test.ts:7-32 (down, out 20 px, back to the press point, up: the click is cancelled)
//   README.md:137-140 (open: double-click reads the press archive; flick velocity needs a move-event archive;
//     training from rollouts; fractional coordinates and batched frames); README.md:132 (latch structure authored)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan, with the Haiku 5.5 fact-check
// (review.md) applied: the history strip shows TWO moves (out 20 px, then back), not five; the flick card's arrow
// comes from a new move archive, not the press archive. The committed training test's held-out size
// (2 × 10,000) is shown beside its ≥ 5 of 6 bar so the 30,000 label stays attached to the sweep only.
//
// Every number on screen is computed below at module scope (the drag staircase from the test's own loop, the cost
// bars from the measured per-record slope, the 16 relation masks from the test's bit order) and checked against the
// recorded values; the module throws if they ever disagree.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH12 = 7.23; // mono advance at 12 px
const fmtN = (n: number): string => n.toLocaleString('en-US');
/** the first t of a quadratic Bézier (de Casteljau split), as an SVG path */
const quadPart = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, t: number): string => {
  const ax = lerp(x0, cx, t);
  const ay = lerp(y0, cy, t);
  const ex = lerp(ax, lerp(cx, x1, t), t);
  const ey = lerp(ay, lerp(cy, y1, t), t);
  return `M ${x0} ${y0} Q ${ax} ${ay} ${ex} ${ey}`;
};
const VIOLET = '#7b61d1'; // the book's accent
const VIOLET_T = colors.SECONDARY; // violet for text on the dark stage

// ---------------------------------------------------------------------------
// The record (module scope, exact)
// ---------------------------------------------------------------------------

// exactness.test.ts:13-25
const SEEDS = 12;
const FRAMES_PER_SEED = 10_000;
const HAND_FRAMES = SEEDS * FRAMES_PER_SEED;
// exactness.test.ts:50-73 — mask bit 0 dragFromTitle, 1 dragFromBody, 2 clickTogglesFromTitle, 3 clickTogglesFromBody
const RELATION_FRAMES = 2_000;
const MASKS = Array.from({ length: 16 }, (_, m) => `${m & 1 ? 1 : 0}${m & 2 ? 1 : 0}${m & 4 ? 1 : 0}${m & 8 ? 1 : 0}`);
const RELATION_TOTAL = MASKS.length * RELATION_FRAMES;
// boundary-probe.test.ts:91-120 — left after each of 200 drags, alternating +7 and −6
const DRAG_COUNT = 200;
const INITIAL_LEFT = 400;
const DRAG_LEFTS = (() => {
  const out = [INITIAL_LEFT];
  let left = INITIAL_LEFT;
  for (let drag = 0; drag < DRAG_COUNT; drag++) {
    left += drag % 2 === 0 ? 7 : -6;
    out.push(left);
  }
  return out;
})();
const FINAL_LEFT = DRAG_LEFTS[DRAG_COUNT];
if (FINAL_LEFT !== INITIAL_LEFT + DRAG_COUNT / 2) throw new Error('event-window ch3: drag staircase disagrees with the test');
// training-sweep.ts:23,36 and training.test.ts:47-77
const SWEEP_HELD_OUT = 3;
const SWEEP_FRAMES = SWEEP_HELD_OUT * FRAMES_PER_SEED;
const SWEEP_STARTS = 20;
const SWEEP_RECOVERED = 20;
const TEST_STARTS = 6;
const TEST_MIN = 5;
const TEST_HELD_OUT = 2;
// measure-cost.ts live run at the pin
const K_LIST = [1, 2, 4, 8, 16];
const OPS_MEASURED = [480, 516, 588, 732, 1020];
const OPS_K1 = 480;
const PER_RECORD_OPS = 36;
const PER_RECORD_WEIGHTS = 72;
const DEPTH = 52;
const opsAt = (k: number): number => OPS_K1 + PER_RECORD_OPS * (k - 1);
K_LIST.forEach((k, i) => {
  if (opsAt(k) !== OPS_MEASURED[i]) throw new Error(`event-window ch3: ops at K = ${k} are not linear`);
});
const README_OPS = 502;
const README_DEPTH = 38;
const K_MAX = K_LIST[K_LIST.length - 1];

// ---------------------------------------------------------------------------
// Captions (book.json chapters[2].captions, verbatim) and their pacing (~150 wpm)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  "Now the scorecard, with each number's scope attached. First, the hand-set circuit running closed loop: its own state feeds the next frame, and the oracle is checked after every one.",
  'Twelve seeds of ten thousand frames each make a hundred twenty thousand frames, with zero divergences. The comparison is exact equality, which works because every coordinate is a whole number.',
  'All sixteen settings of the two-by-two relation table pass, two thousand frames each. Two hundred drags in a row, alternating plus seven and minus six pixels, leave the window exactly a hundred pixels right.',
  'The trained circuits were checked on thirty thousand frames each, not a hundred twenty thousand. The committed test asks only that five of its six starts recover. Different checks, different sizes.',
  'Now cost. One press record compiles to four hundred eighty operations, fifty-two layers deep. Each extra record adds thirty-six operations, and the depth stays at fifty-two.',
  "The lab's own readme table says five hundred two operations and depth thirty-eight. Running the script at this commit prints four eighty and fifty-two, so this book uses the printed numbers.",
  'Those extra records form an archive of older presses. It is built, but behavior never reads it. Behavior uses only the current record, so the added operations buy nothing yet.',
  "So what did training learn? Six numbers. Every example handed it the oracle's correct internal state and labels, and which latches exist was authored. The lab says the same: it recovers cells, not structure.",
  'The status file puts it plainly: training supplies correct internal state and decision labels, while persistent state and temporal dependencies remain. The result is narrowed to that scope, and holds there.',
  "An earlier review found a demo bug: consecutive moves were squashed into the last one, which could erase a drag. It's fixed. The demo keeps every move, and a test checks that out-and-back cancels the click.",
  'Still open: double-click, which would read the archive; flick speed, which needs a move archive; training on whole rollouts; fractional and batched inputs; discovering the latches. None is built.',
  "So: a few latches written only on events, one ramp shape that narrows to recover six parameters, and exact agreement with plain code on the traces tested. The memory is real. Learning the memory isn't shown.",
];
const GAP = 0.9;
const CAPS = (() => {
  let at = 0.5;
  return CAPTIONS.map((text) => {
    const dur = +(text.split(/\s+/).length / 2.5).toFixed(1);
    const c = { at, dur, text };
    at = +(at + dur + GAP).toFixed(1);
    return c;
  });
})();

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; the header band is screen-space, 60 px)
// ---------------------------------------------------------------------------

const HEADER_H = 60;

// the scorecard ledger (right column)
const LX = 822;
const LW = 420;
const RY = (i: number): number => 112 + i * 66;
const RH = 58;
type StampKind = 'holds' | 'narrowed' | 'stale' | 'historical' | 'open';
const STAMP_COLOR: Record<StampKind, string> = {
  holds: colors.POSITIVE,
  narrowed: colors.WARM,
  stale: colors.NEGATIVE,
  historical: colors.MUTED,
  open: colors.MUTED,
};
const ROWS: { title: string; lines: string[]; stamp: StampKind }[] = [
  { title: 'hand-set circuit, closed loop', lines: [`${SEEDS} seeds × ${fmtN(FRAMES_PER_SEED)} = ${fmtN(HAND_FRAMES)} frames`, '0 divergences · exact ==='], stamp: 'holds' },
  { title: 'relation table · long drag runs', lines: [`16 settings × ${fmtN(RELATION_FRAMES)} = ${fmtN(RELATION_TOTAL)} frames`, `${DRAG_COUNT} drags: left ${INITIAL_LEFT} → ${FINAL_LEFT}`], stamp: 'holds' },
  { title: 'six trained parameter cells', lines: [`sweep: ${SWEEP_HELD_OUT} × ${fmtN(FRAMES_PER_SEED)} = ${fmtN(SWEEP_FRAMES)} per start`, `test: ≥ ${TEST_MIN} of ${TEST_STARTS} starts recover`], stamp: 'narrowed' },
  { title: 'cost, measured at 4ea7fcb', lines: [`${OPS_K1} ops · +${PER_RECORD_OPS} per press record`, `depth ${DEPTH} at every K`], stamp: 'holds' },
  { title: "the README's cost table", lines: [`${README_OPS} ops · depth ${README_DEPTH}`, `measure-cost.ts prints ${OPS_K1} · ${DEPTH}`], stamp: 'stale' },
  { title: 'demo bug (earlier review)', lines: ['moves squashed into the last one', 'fixed · pointer-input.test.ts'], stamp: 'historical' },
  { title: 'still open · none built', lines: ['double-click · flick · rollouts', 'fractional/batched · find latches'], stamp: 'open' },
];

// B1 — the closed loop: circuit lane, === ticks, oracle lane
const N_LANE = 18;
const LANE_X0 = 230;
const LANE_P = 31;
const LANE_W = 25;
const LANE_C_Y = 150;
const LANE_O_Y = 226;
const LANE_H = 28;
const TICK_Y = 207;
const laneX = (i: number): number => LANE_X0 + i * LANE_P;

// B2 — twelve seed strips, then (B4) one 120,000-frame bar beside the 30,000-frame trained bar
const STRIP_X0 = 230;
const STRIP_W = 560;
const STRIP_Y0 = 108;
const STRIP_P = 14;
const STRIP_H = 10;
const BAR_X0 = 60;
const SEG = 60; // 10,000 frames
const BAR_Y = 160;
const BAR_H = 24;
const TRAIN_Y = 236;
type Rect = { x: number; y: number; w: number; h: number };
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
const stackedStrip = (i: number): Rect => ({ x: STRIP_X0, y: STRIP_Y0 + i * STRIP_P, w: STRIP_W, h: STRIP_H });
const concatStrip = (i: number): Rect => ({ x: BAR_X0 + i * SEG + 1, y: BAR_Y, w: SEG - 2, h: BAR_H });

// B3 — the 4×4 relation grid and the drag staircase
const GX = 60;
const GY = 384;
const GP = 54;
const GC = 48;
const SX0 = 420;
const SX1 = 780;
const sxd = (d: number): number => SX0 + (d / DRAG_COUNT) * (SX1 - SX0);
const syl = (v: number): number => 590 - (v - 398) * 1.75;
const STAIR_PTS = DRAG_LEFTS.map((v, d) => [sxd(d), syl(v)] as const);

// B5 — the cost chart (true K axis, so a straight line through the tops means linear cost)
const BASE = 560;
const opsY = (o: number): number => BASE - o * 0.2;
const kx = (k: number): number => 200 + (k - 1) * 36;
const BAR_HALF = 13;

// B7 — the press-record shift register (K = 16)
const REC0: Rect = { x: 60, y: 150, w: 116, h: 48 };
const ARCH_X0 = 200;
const ARCH_P = 39;
const ARCH_W = 33;
const archX = (j: number): number => ARCH_X0 + j * ARCH_P;

// B8 — the latch bank (authored) and the six trained cells
const BANK: Rect = { x: 60, y: 96, w: 730, h: 128 };
const BANK_ROWS = [
  ['pressActive', 'pressX', 'pressY', 'pressRectangle', 'grabLeft'],
  ['grabTop', 'pressOnTitle', 'pressWasFocused', 'pressOnMaximized', 'slopLatch'],
];
const chipW = (t: string, adv = CH13): number => t.length * adv + 20;
const BANK_CHIPS = BANK_ROWS.flatMap((row, r) => {
  let x = 80;
  return row.map((name) => {
    const c = { name, x, y: r === 0 ? 158 : 198 };
    x += chipW(name) + 10;
    return c;
  });
});
const TRAIN_BOX: Rect = { x: 330, y: 350, w: 460, h: 150 };
const PARAM_CELLS = ['slopBoundary', 'titleBoundary', 'dragFromTitle', 'dragFromBody', 'clickTogglesFromTitle', 'clickTogglesFromBody'];

// B10 — the demo's move history (pointer-input.test.ts: down, out 20 px, back, up)
const HIST_CELLS = [
  { label: 'down', x: 200, w: 70 },
  { label: 'move +20 px', x: 280, w: 110 },
  { label: 'move back', x: 400, w: 100 },
  { label: 'up', x: 510, w: 60 },
];
const OLD_Y = 384;
const NEW_Y = 494;
const HC_H = 32;

// B11 — the open cards
const CARDS = [
  { lines: ['double-click', 'reads the', 'press archive'] },
  { lines: ['flick speed', 'needs a', 'move archive'] },
  { lines: ['training on', 'whole rollouts'] },
  { lines: ['fractional +', 'batched inputs'] },
  { lines: ['discovering', 'the latches'] },
];
const CARD_X = (j: number): number => 60 + j * 149;
const CARD_W = 136;
const CARD_Y = 400;
const CARD_H = 100;
const MOVE_ARCH: Rect = { x: 230, y: 262, w: 210, h: 40 };

// B12 — the recap
const RECAP = ['latches written on events', 'one ramp, narrowed', 'exact on the traces tested'];
const RECAP_W = RECAP.map((t) => t.length * 7.9 + 28);
const RECAP_GAP = 44;
const RECAP_X0 = 425 - (RECAP_W.reduce((a, b) => a + b, 0) + RECAP_GAP * 2) / 2;
const RECAP_XS = RECAP_W.map((_, i) => RECAP_X0 + RECAP_W.slice(0, i).reduce((a, b) => a + b, 0) + i * RECAP_GAP);

// cameras
const CAM_START: CameraState = { x: 430, y: 220, k: 1.1 };
const CAM_LOOP: CameraState = { x: 430, y: 196, k: 1.38 };
const CAM_K1: CameraState = { x: 270, y: 470, k: 1.7 };
const CAM_HIST: CameraState = { x: 420, y: 455, k: 1.3 };
const CAM_CARDS: CameraState = { x: 425, y: 330, k: 1.18 };
const CAM_END: CameraState = { x: 640, y: 360, k: 0.96 };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);

  // the ledger
  const ledgerOp = tl.channel('ledgerOp', 0);
  const rowU = ROWS.map((_, i) => tl.channel(`row${i}U`, 0));
  const stampU = ROWS.map((_, i) => tl.channel(`stamp${i}U`, 0));
  const pulse0 = tl.channel('pulse0', 0);

  // B1
  const loopIn = tl.channel('loopIn', 0);
  const loopU = tl.channel('loopU', 0);
  // B2
  const stripU = tl.channel('stripU', 0);
  const stripsIn = tl.channel('stripsIn', 0);
  const fillU = tl.channel('fillU', 0);
  const countU = tl.channel('countU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const b2Op = tl.channel('b2Op', 1);
  const tapeOp = tl.channel('tapeOp', 1);
  // B3
  const gridIn = tl.channel('gridIn', 0);
  const gridU = tl.channel('gridU', 0);
  const stairIn = tl.channel('stairIn', 0);
  const stairU = tl.channel('stairU', 0);
  const b3Op = tl.channel('b3Op', 1);
  // B4
  const concatU = tl.channel('concatU', 0);
  const handLabelU = tl.channel('handLabelU', 0);
  const trainedU = tl.channel('trainedU', 0);
  const trainedLabelU = tl.channel('trainedLabelU', 0);
  const sweepChipU = tl.channel('sweepChipU', 0);
  const testChipU = tl.channel('testChipU', 0);
  const scaleTagU = tl.channel('scaleTagU', 0);
  const b4Op = tl.channel('b4Op', 1);
  // B5
  const chartIn = tl.channel('chartIn', 0);
  const barsU = tl.channel('barsU', 0);
  const slopeU = tl.channel('slopeU', 0);
  const depthU = tl.channel('depthU', 0);
  const chartOp = tl.channel('chartOp', 1);
  // B6
  const focusK1 = tl.channel('focusK1', 0);
  const staleU = tl.channel('staleU', 0);
  const strikeU = tl.channel('strikeU', 0);
  const liveU = tl.channel('liveU', 0);
  const b6Op = tl.channel('b6Op', 1);
  // B7
  const regIn = tl.channel('regIn', 0);
  const shiftU = tl.channel('shiftU', 0);
  const splitU = tl.channel('splitU', 0);
  const archOp = tl.channel('archOp', 1);
  // B8
  const bankU = tl.channel('bankU', 0);
  const trainBoxU = tl.channel('trainBoxU', 0);
  const arrowU = tl.channel('arrowU', 0);
  const lockU = tl.channel('lockU', 0);
  const notStructU = tl.channel('notStructU', 0);
  const b8Op = tl.channel('b8Op', 1);
  // B9
  const quoteU = tl.channel('quoteU', 0);
  const quoteOp = tl.channel('quoteOp', 1);
  // B10
  const histIn = tl.channel('histIn', 0);
  const squashU = tl.channel('squashU', 0);
  const oldResU = tl.channel('oldResU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const newU = tl.channel('newU', 0);
  const latchU = tl.channel('latchU', 0);
  const newResU = tl.channel('newResU', 0);
  const testU = tl.channel('testU', 0);
  const histOp = tl.channel('histOp', 1);
  // B11
  const cardsU = tl.channel('cardsU', 0);
  const archBackU = tl.channel('archBackU', 0);
  const moveArchU = tl.channel('moveArchU', 0);
  const cardsOp = tl.channel('cardsOp', 1);
  // B12
  const recapU = tl.channel('recapU', 0);
  const lastU = tl.channel('lastU', 0);

  CAPS.forEach((c) => tl.caption(c));

  const rowIn = (i: number, at: number) => tl.tween(rowU[i], 1, { at, dur: 0.7, ease: ease.enter });
  const stamp = (i: number, at: number) => tl.tween(stampU[i], 1, { at, dur: 0.5, ease: ease.pop });

  // — B1 · closed loop: the circuit's own state feeds the next frame; the oracle judges every frame —
  let a = CAPS[0].at;
  let d = CAPS[0].dur;
  tl.tween(cam, CAM_LOOP, { at: a + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(loopIn, 1, { at: a + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(loopU, N_LANE, { at: a + 3.2, dur: d - 4, ease: ease.linear });
  tl.hold(a + d, GAP);

  // — B2 · twelve seeds × 10,000 frames, zero divergences —
  a = CAPS[1].at;
  d = CAPS[1].dur;
  tl.tween(cam, CAMERA_HOME, { at: a + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: a + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(ledgerOp, 1, { at: a + 0.8, dur: 0.7, ease: ease.enter });
  rowIn(0, a + 1.2);
  tl.tween(stripsIn, 1, { at: a + 1.8, dur: 1.0, ease: ease.enter });
  tl.tween(countU, 1, { at: a + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(fillU, 1, { at: a + 2.6, dur: 4.6, ease: ease.linear });
  tl.tween(chipsU, 1, { at: a + 7.4, dur: 0.7, ease: ease.enter });
  stamp(0, a + 9.6);
  tl.hold(a + d, GAP);

  // — B3 · 16 relation settings; 200 alternating drags end exactly 100 px right —
  a = CAPS[2].at;
  d = CAPS[2].dur;
  tl.tween(b2Op, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(tapeOp, 0.12, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(gridIn, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  rowIn(1, a + 0.8);
  tl.tween(gridU, 16, { at: a + 1.0, dur: 3.8, ease: ease.linear });
  tl.tween(stairIn, 1, { at: a + 5.4, dur: 0.7, ease: ease.enter });
  tl.tween(stairU, 1, { at: a + 5.8, dur: 5.2, ease: ease.draw });
  stamp(1, a + 11.6);
  tl.hold(a + d, GAP);

  // — B4 · trained circuits: 30,000 frames each, drawn to the same scale as the 120,000 —
  a = CAPS[3].at;
  d = CAPS[3].dur;
  tl.tween(b3Op, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(tapeOp, 1, { at: a + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(concatU, 1, { at: a + 0.5, dur: 1.5, ease: ease.move });
  tl.tween(handLabelU, 1, { at: a + 1.9, dur: 0.6, ease: ease.enter });
  tl.tween(trainedU, 1, { at: a + 2.6, dur: 1.2, ease: ease.draw });
  tl.tween(trainedLabelU, 1, { at: a + 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(sweepChipU, 1, { at: a + 4.4, dur: 0.6, ease: ease.enter });
  rowIn(2, a + 4.6);
  tl.tween(testChipU, 1, { at: a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(scaleTagU, 1, { at: a + 9.8, dur: 0.6, ease: ease.enter });
  tl.hold(a + d, GAP);

  // — B5 · cost: 480 ops at one record, +36 per record, depth 52 throughout —
  a = CAPS[4].at;
  d = CAPS[4].dur;
  tl.tween(tapeOp, 0.12, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(b4Op, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(chartIn, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(barsU, K_LIST.length, { at: a + 1.0, dur: 3.0, ease: ease.linear });
  tl.tween(slopeU, 1, { at: a + 4.4, dur: 1.2, ease: ease.draw });
  tl.tween(depthU, 1, { at: a + 6.6, dur: 0.8, ease: ease.enter });
  rowIn(3, a + 7.2);
  stamp(3, a + 8.8);
  tl.hold(a + d, GAP);

  // — B6 · the README's 502 / 38 is stale; the script at the pin prints 480 / 52 —
  a = CAPS[5].at;
  d = CAPS[5].dur;
  tl.tween(ledgerOp, 0, { at: a + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_K1, { at: a + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(focusK1, 1, { at: a + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(staleU, 1, { at: a + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: a + 4.2, dur: 0.6, ease: ease.draw });
  tl.tween(liveU, 1, { at: a + 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(b6Op, 0, { at: a + d - 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + d - 3.2, dur: 1.4, ease: ease.move });
  tl.tween(focusK1, 0, { at: a + d - 3.2, dur: 0.8, ease: ease.enter });
  tl.tween(ledgerOp, 1, { at: a + d - 2.2, dur: 0.6, ease: ease.enter });
  rowIn(4, a + d - 2.0);
  stamp(4, a + d - 0.9);
  tl.hold(a + d, GAP);

  // — B7 · the extra records are an archive; behavior reads only record 0 —
  a = CAPS[6].at;
  d = CAPS[6].dur;
  tl.tween(tapeOp, 0, { at: a + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(regIn, 1, { at: a + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(shiftU, 1, { at: a + 1.8, dur: 1.4, ease: ease.draw });
  tl.tween(splitU, 1, { at: a + 4.2, dur: 1.0, ease: ease.move });
  tl.hold(a + d, GAP);

  // — B8 · training learned six numbers; the latch structure was authored —
  a = CAPS[7].at;
  d = CAPS[7].dur;
  tl.tween(chartOp, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(archOp, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(trainBoxU, 1, { at: a + 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(arrowU, 1, { at: a + 3.4, dur: 1.0, ease: ease.draw });
  tl.tween(bankU, 1, { at: a + 6.2, dur: 1.2, ease: ease.move });
  tl.tween(lockU, 1, { at: a + 7.6, dur: 0.6, ease: ease.pop });
  tl.tween(notStructU, 1, { at: a + 10.4, dur: 0.6, ease: ease.enter });
  tl.hold(a + d, GAP);

  // — B9 · the status line, verbatim; the training row is narrowed, the hand-set row holds —
  a = CAPS[8].at;
  d = CAPS[8].dur;
  tl.tween(b8Op, 0.12, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(quoteU, 1, { at: a + 0.6, dur: 1.2, ease: ease.enter });
  stamp(2, a + 8.0);
  tl.tween(pulse0, 1, { at: a + 9.6, dur: 0.5, ease: ease.enter });
  tl.tween(pulse0, 0, { at: a + 10.6, dur: 0.8, ease: ease.enter });
  tl.hold(a + d, GAP);

  // — B10 · history: two moves squashed into one, now kept; out-and-back cancels the click —
  a = CAPS[9].at;
  d = CAPS[9].dur;
  tl.tween(b8Op, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(quoteOp, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(ledgerOp, 0, { at: a + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_HIST, { at: a + 0.5, dur: 1.4, ease: ease.move });
  tl.tween(histIn, 1, { at: a + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(squashU, 1, { at: a + 2.4, dur: 1.2, ease: ease.move });
  tl.tween(oldResU, 1, { at: a + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(fixedU, 1, { at: a + 5.8, dur: 0.6, ease: ease.draw });
  tl.tween(newU, 1, { at: a + 6.8, dur: 1.2, ease: ease.enter });
  tl.tween(latchU, 1, { at: a + 8.4, dur: 0.5, ease: ease.pop });
  tl.tween(newResU, 1, { at: a + 10.2, dur: 0.6, ease: ease.enter });
  tl.tween(testU, 1, { at: a + 10.8, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + d - 2.6, dur: 1.4, ease: ease.move });
  tl.tween(ledgerOp, 1, { at: a + d - 1.6, dur: 0.6, ease: ease.enter });
  rowIn(5, a + d - 1.5);
  stamp(5, a + d - 0.6);
  tl.hold(a + d, GAP);

  // — B11 · still open, none built —
  a = CAPS[10].at;
  d = CAPS[10].dur;
  tl.tween(histOp, 0, { at: a + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(ledgerOp, 0, { at: a + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_CARDS, { at: a + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(archBackU, 1, { at: a + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cardsU, CARDS.length, { at: a + 1.2, dur: 7.0, ease: ease.linear });
  tl.tween(moveArchU, 1, { at: a + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + d - 2.6, dur: 1.4, ease: ease.move });
  tl.tween(ledgerOp, 1, { at: a + d - 1.6, dur: 0.6, ease: ease.enter });
  rowIn(6, a + d - 1.5);
  stamp(6, a + d - 0.6);
  tl.hold(a + d, GAP);

  // — B12 · the full scorecard, then everything to a whisper under the recap —
  a = CAPS[11].at;
  d = CAPS[11].dur;
  tl.tween(cardsOp, 0, { at: a + 2.4, dur: 0.8, ease: ease.enter });
  tl.tween(ledgerOp, 0.12, { at: a + 2.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_END, { at: a + 2.4, dur: 1.6, ease: ease.move });
  tl.tween(recapU, RECAP.length, { at: a + 3.4, dur: 4.6, ease: ease.linear });
  tl.tween(lastU, 1, { at: a + 9.4, dur: 0.8, ease: ease.enter });
  tl.hold(a + d, 1.6);

  return {
    tl, cam, ledgerOp, rowU, stampU, pulse0,
    loopIn, loopU, stripU, stripsIn, fillU, countU, chipsU, b2Op, tapeOp,
    gridIn, gridU, stairIn, stairU, b3Op,
    concatU, handLabelU, trainedU, trainedLabelU, sweepChipU, testChipU, scaleTagU, b4Op,
    chartIn, barsU, slopeU, depthU, chartOp,
    focusK1, staleU, strikeU, liveU, b6Op,
    regIn, shiftU, splitU, archOp,
    bankU, trainBoxU, arrowU, lockU, notStructU, b8Op,
    quoteU, quoteOp,
    histIn, squashU, oldResU, fixedU, newU, latchU, newResU, testU, histOp,
    cardsU, archBackU, moveArchU, cardsOp,
    recapU, lastU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 12 ? CH12 : CH13) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, u = 1, dashed = false, width = 1.6 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; u?: number; dashed?: boolean; width?: number;
}) {
  if (u <= 0.005) return null;
  const ex = lerp(x1, x2, u);
  const ey = lerp(y1, y2, u);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  const p1 = `${ex},${ey}`;
  const p2 = `${ex - h * Math.cos(ang - 0.45)},${ey - h * Math.sin(ang - 0.45)}`;
  const p3 = `${ex - h * Math.cos(ang + 0.45)},${ey - h * Math.sin(ang + 0.45)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '5 4' : undefined} />
      <polygon points={`${p1} ${p2} ${p3}`} fill={color} />
    </g>
  );
}

function Padlock({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -5 -2 L -5 -7 A 5 5 0 0 1 5 -7 L 5 -2" fill="none" stroke={color} strokeWidth={2} />
      <rect x={-8} y={-2} width={16} height={12} rx={2} fill={color} />
    </g>
  );
}

function Stamp({ x, y, kind, u }: { x: number; y: number; kind: StampKind; u: number }) {
  if (u <= 0.005) return null;
  const c = STAMP_COLOR[kind];
  const w = 92;
  const h = 24;
  const sc = lerp(1.5, 1, clamp01(u));
  return (
    <g opacity={clamp01(u * 1.5)} transform={`translate(${x + w / 2} ${y}) scale(${sc}) translate(${-x - w / 2} ${-y})`}>
      <rect x={x} y={y - h / 2} width={w} height={h} rx={5} fill={colors.BG} stroke={c} strokeWidth={1.8}
        strokeDasharray={kind === 'open' ? '4 3' : undefined} />
      <text x={x + w / 2} y={y + 5} textAnchor="middle" fill={c} fontSize={13} fontFamily={UI} fontWeight={700} letterSpacing={0.6}>
        {kind}
      </text>
      {kind === 'stale' && <line x1={x + 18} y1={y} x2={x + w - 18} y2={y} stroke={c} strokeWidth={1.6} />}
    </g>
  );
}

function LedgerRow({ i, u, stampU, pulse }: { i: number; u: number; stampU: number; pulse: number }) {
  if (u <= 0.005) return null;
  const r = ROWS[i];
  const y = RY(i);
  const stamped = clamp01(stampU);
  const stripe = stamped > 0.5 ? STAMP_COLOR[r.stamp] : colors.GRID;
  const dx = (1 - u) * 24;
  return (
    <g opacity={u} transform={`translate(${dx} 0)`}>
      <rect x={LX} y={y} width={LW} height={RH} rx={8} fill={colors.PANEL} stroke={pulse > 0.01 ? colors.POSITIVE : colors.GRID}
        strokeWidth={1 + 1.6 * pulse} />
      <rect x={LX} y={y} width={4} height={RH} rx={2} fill={stripe} />
      <text x={LX + 16} y={y + 20} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
        {r.title}
      </text>
      {r.lines.map((l, k) => (
        <text key={k} x={LX + 16} y={y + 37 + k * 15} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {l}
        </text>
      ))}
      {r.stamp === 'stale' && stamped > 0.01 && (
        <line x1={LX + 14} y1={y + 33} x2={LX + 16 + r.lines[0].length * CH13 * stamped + 2} y2={y + 33} stroke={colors.NEGATIVE} strokeWidth={1.6} />
      )}
      <Stamp x={LX + LW - 104} y={y + RH / 2} kind={r.stamp} u={stampU} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  // anything a camera push would carry off the stage (or up under the header) fades out before it is cut
  const edgeFit = (x0: number, x1: number, y0: number, y1: number): number => {
    const sx = (x: number) => (x - cam.x) * cam.k + STAGE_W / 2;
    const sy = (y: number) => (y - cam.y) * cam.k + STAGE_H / 2;
    const r = 6;
    return clamp01(sx(x0) / r) * clamp01((STAGE_W - sx(x1)) / r) * clamp01((sy(y0) - HEADER_H) / r) * clamp01((STAGE_H - sy(y1)) / r);
  };

  const ledgerOp = s.get(scene.ledgerOp) * edgeFit(LX - 4, LX + LW + 4, 92, RY(ROWS.length - 1) + RH);
  const rowU = scene.rowU.map((c) => s.get(c));
  const stampU = scene.stampU.map((c) => s.get(c));
  const pulse0 = s.get(scene.pulse0);

  const loopIn = s.get(scene.loopIn);
  const loopU = s.get(scene.loopU);
  const stripU = s.get(scene.stripU);
  const stripsIn = s.get(scene.stripsIn);
  const fillU = s.get(scene.fillU);
  const countU = s.get(scene.countU);
  const chipsU = s.get(scene.chipsU);
  const b2Op = s.get(scene.b2Op);
  const tapeOp = s.get(scene.tapeOp);
  const gridIn = s.get(scene.gridIn);
  const gridU = s.get(scene.gridU);
  const stairIn = s.get(scene.stairIn);
  const stairU = s.get(scene.stairU);
  const b3Op = s.get(scene.b3Op);
  const concatU = s.get(scene.concatU);
  const handLabelU = s.get(scene.handLabelU);
  const trainedU = s.get(scene.trainedU);
  const trainedLabelU = s.get(scene.trainedLabelU);
  const sweepChipU = s.get(scene.sweepChipU);
  const testChipU = s.get(scene.testChipU);
  const scaleTagU = s.get(scene.scaleTagU);
  const b4Op = s.get(scene.b4Op);
  const chartIn = s.get(scene.chartIn);
  const barsU = s.get(scene.barsU);
  const slopeU = s.get(scene.slopeU);
  const depthU = s.get(scene.depthU);
  const chartOp = s.get(scene.chartOp);
  const focusK1 = s.get(scene.focusK1);
  const staleU = s.get(scene.staleU);
  const strikeU = s.get(scene.strikeU);
  const liveU = s.get(scene.liveU);
  const b6Op = s.get(scene.b6Op);
  const regIn = s.get(scene.regIn);
  const shiftU = s.get(scene.shiftU);
  const splitU = s.get(scene.splitU);
  const archOp = s.get(scene.archOp);
  const bankU = s.get(scene.bankU);
  const trainBoxU = s.get(scene.trainBoxU);
  const arrowU = s.get(scene.arrowU);
  const lockU = s.get(scene.lockU);
  const notStructU = s.get(scene.notStructU);
  const b8Op = s.get(scene.b8Op);
  const quoteU = s.get(scene.quoteU);
  const quoteOp = s.get(scene.quoteOp);
  const histIn = s.get(scene.histIn);
  const squashU = s.get(scene.squashU);
  const oldResU = s.get(scene.oldResU);
  const fixedU = s.get(scene.fixedU);
  const newU = s.get(scene.newU);
  const latchU = s.get(scene.latchU);
  const newResU = s.get(scene.newResU);
  const testU = s.get(scene.testU);
  const histOp = s.get(scene.histOp);
  const cardsU = s.get(scene.cardsU);
  const archBackU = s.get(scene.archBackU);
  const moveArchU = s.get(scene.moveArchU);
  const cardsOp = s.get(scene.cardsOp);
  const recapU = s.get(scene.recapU);
  const lastU = s.get(scene.lastU);

  // ---- the tape: lane cells → strip 0 → (with strips 1–11) one 120,000-frame bar ----
  const laneExtras = loopIn * (1 - stripU);
  const stripRect = (i: number): Rect => lerpRect(stackedStrip(i), concatStrip(i), concatU);
  const fillOf = (i: number): number => clamp01(fillU * 1.55 - i * 0.05);
  const framesChecked = Math.round(Array.from({ length: SEEDS }, (_, i) => fillOf(i)).reduce((p, q) => p + q, 0) * FRAMES_PER_SEED);
  const showTape = tapeOp > 0.005 && loopIn > 0.005;

  // ---- the cost chart ----
  const barFocus = (k: number): number => (k === 1 ? 1 : 1 - 0.88 * focusK1);
  const chartVis = chartIn * chartOp;

  // ---- the register ----
  const regVis = regIn * (1 - bankU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the tape (B1–B5) ======================== */}
        {showTape && (
          <g opacity={tapeOp}>
            {/* B1 lane labels, oracle lane, === ticks, state arcs */}
            {laneExtras > 0.005 && (
              <g opacity={laneExtras}>
                <text x={LANE_X0} y={108} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                  closed loop: the circuit's own state feeds its next frame
                </text>
                <text x={215} y={LANE_C_Y + 19} textAnchor="end" fill={VIOLET_T} fontSize={13} fontFamily={MONO}>
                  circuit.ts
                </text>
                <text x={215} y={TICK_Y + 5} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                  === every frame
                </text>
                <text x={215} y={LANE_O_Y + 19} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  oracle.ts · oracleTick
                </text>
                {Array.from({ length: N_LANE }, (_, i) => {
                  const e = clamp01(loopU - i);
                  const tick = clamp01((loopU - i - 0.6) * 3);
                  const arc = i < N_LANE - 1 ? clamp01((loopU - i - 0.7) * 3) : 0;
                  const cx = laneX(i) + LANE_W / 2;
                  const nx = laneX(i + 1) + LANE_W / 2;
                  return (
                    <g key={i}>
                      <rect x={laneX(i)} y={LANE_O_Y} width={LANE_W} height={LANE_H} rx={3} fill={colors.MUTED} fillOpacity={0.08 + 0.3 * e}
                        stroke={colors.GRID} />
                      {tick > 0.01 && (
                        <g opacity={tick}>
                          <line x1={cx} y1={LANE_C_Y + LANE_H + 3} x2={cx} y2={LANE_O_Y - 3} stroke={colors.POSITIVE} strokeWidth={1} strokeOpacity={0.5} />
                          <circle cx={cx} cy={TICK_Y} r={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
                          <path d={`M ${cx - 3} ${TICK_Y} l 2 2.5 l 4 -5`} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
                        </g>
                      )}
                      {arc > 0.01 && (
                        <path d={quadPart(cx, LANE_C_Y - 2, (cx + nx) / 2, LANE_C_Y - 44, nx, LANE_C_Y - 2, arc)}
                          fill="none" stroke={VIOLET_T} strokeWidth={1.4} opacity={0.85} />
                      )}
                    </g>
                  );
                })}
                {loopU > 0.01 && loopU < N_LANE - 0.01 && (
                  <line x1={LANE_X0 + loopU * LANE_P - 3} y1={LANE_C_Y - 8} x2={LANE_X0 + loopU * LANE_P - 3} y2={LANE_O_Y + LANE_H + 8}
                    stroke={colors.WARM} strokeWidth={2} />
                )}
              </g>
            )}
            {/* strip 0: the lane's cells, morphing into the first seed strip */}
            {Array.from({ length: N_LANE }, (_, i) => {
              const s0 = stripRect(0);
              const sub: Rect = { x: s0.x + (s0.w * i) / N_LANE, y: s0.y, w: s0.w / N_LANE + 0.6, h: s0.h };
              const from: Rect = { x: laneX(i), y: LANE_C_Y, w: LANE_W, h: LANE_H };
              const r = lerpRect(from, sub, stripU);
              const e = clamp01(loopU - i);
              return (
                <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={lerp(3, 0, stripU)} fill={VIOLET}
                  fillOpacity={lerp(0.12 + 0.6 * e, 0.3, stripU)} stroke={stripU < 0.5 ? VIOLET : 'none'} strokeOpacity={0.7} opacity={loopIn} />
              );
            })}
            {/* strips 1–11 */}
            {stripsIn > 0.005 &&
              Array.from({ length: SEEDS - 1 }, (_, k) => {
                const i = k + 1;
                const r = stripRect(i);
                const u = clamp01(stripsIn * 1.8 - k * 0.07);
                return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={VIOLET} fillOpacity={0.3} opacity={u} />;
              })}
            {/* green fill: frames checked, zero divergences */}
            {fillU > 0.001 &&
              Array.from({ length: SEEDS }, (_, i) => {
                const r = stripRect(i);
                const f = fillOf(i);
                return f > 0.001 ? <rect key={i} x={r.x} y={r.y} width={r.w * f} height={r.h} fill={colors.POSITIVE} fillOpacity={0.85} /> : null;
              })}
            {/* B2 labels */}
            {stripsIn > 0.01 && (
              <g opacity={stripsIn * b2Op * (1 - concatU)}>
                <text x={220} y={STRIP_Y0 + 9} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  seed 1
                </text>
                <text x={220} y={STRIP_Y0 + 11 * STRIP_P + 9} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  seed 12
                </text>
                <text x={STRIP_X0 + STRIP_W} y={STRIP_Y0 - 9} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  each strip: {fmtN(FRAMES_PER_SEED)} frames
                </text>
              </g>
            )}
            {countU > 0.01 && (
              <g opacity={countU * b2Op}>
                <text x={STRIP_X0} y={302} fill={colors.POSITIVE} fontSize={17} fontFamily={MONO}>
                  {fmtN(framesChecked)} frames · 0 divergences
                </text>
              </g>
            )}
            <g opacity={b2Op}>
              <Chip x={STRIP_X0} y={338} text="exact equality (===)" color={colors.TEXT} mono opacity={chipsU} />
              <Chip x={STRIP_X0 + 196} y={338} text="every coordinate a whole number" color={colors.TEXT} opacity={chipsU} />
            </g>
            {/* B4: the trained bar, same scale */}
            {trainedU > 0.005 && (
              <g>
                {Array.from({ length: SWEEP_HELD_OUT }, (_, j) => {
                  const u = clamp01(trainedU * SWEEP_HELD_OUT - j);
                  return u > 0.001 ? (
                    <rect key={j} x={BAR_X0 + j * SEG + 1} y={TRAIN_Y} width={(SEG - 2) * u} height={BAR_H} fill={colors.WARM} fillOpacity={0.75} />
                  ) : null;
                })}
              </g>
            )}
            <g opacity={b4Op}>
              {handLabelU > 0.01 && (
                <text x={BAR_X0} y={BAR_Y - 10} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={handLabelU}>
                  hand-set circuit · {SEEDS} × {fmtN(FRAMES_PER_SEED)} = {fmtN(HAND_FRAMES)} frames · 0 divergences
                </text>
              )}
              {trainedLabelU > 0.01 && (
                <g opacity={trainedLabelU}>
                  <text x={BAR_X0} y={TRAIN_Y - 10} fill={colors.WARM} fontSize={14} fontFamily={UI}>
                    trained circuits · {SWEEP_HELD_OUT} × {fmtN(FRAMES_PER_SEED)} = {fmtN(SWEEP_FRAMES)} frames each
                  </text>
                  <path d={`M ${BAR_X0 + 1} ${TRAIN_Y + BAR_H + 6} v 6 h ${SEG - 2} v -6`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
                  <text x={BAR_X0 + SEG / 2} y={TRAIN_Y + BAR_H + 28} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {fmtN(FRAMES_PER_SEED)}
                  </text>
                </g>
              )}
              {scaleTagU > 0.01 && (
                <text x={STRIP_X0 + STRIP_W - 10} y={TRAIN_Y + 17} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={scaleTagU}>
                  one scale for both bars · different checks, different sizes
                </text>
              )}
              <Chip x={BAR_X0 + 128} y={TRAIN_Y + BAR_H + 30} mono
                text={`training-sweep.ts · ${SWEEP_RECOVERED} / ${SWEEP_STARTS} starts recovered`} color={colors.WARM} opacity={sweepChipU} />
              <Chip x={BAR_X0} y={TRAIN_Y + BAR_H + 66} mono
                text={`training.test.ts · ≥ ${TEST_MIN} of ${TEST_STARTS} starts must recover · ${TEST_HELD_OUT} × ${fmtN(FRAMES_PER_SEED)} frames`}
                color={colors.TEXT} opacity={testChipU} />
            </g>
          </g>
        )}

        {/* ======================== B3 · relation grid + drag staircase ======================== */}
        {gridIn > 0.005 && b3Op > 0.005 && (
          <g opacity={b3Op}>
            <g opacity={gridIn}>
              <text x={GX} y={GY - 14} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                16 relation settings × {fmtN(RELATION_FRAMES)} frames
              </text>
              {MASKS.map((m, i) => {
                const x = GX + (i % 4) * GP;
                const y = GY + Math.floor(i / 4) * GP;
                const lit = clamp01(gridU - i);
                return (
                  <g key={m}>
                    <rect x={x} y={y} width={GC} height={GC} rx={5} fill={colors.PANEL} stroke={lit > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={1.2} />
                    <rect x={x} y={y} width={GC} height={GC} rx={5} fill={colors.POSITIVE} opacity={0.22 * lit} />
                    <text x={x + GC / 2} y={y + GC / 2 + 5} textAnchor="middle" fill={lit > 0.5 ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {m}
                    </text>
                  </g>
                );
              })}
              <text x={GX} y={GY + 4 * GP + 14} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO} opacity={clamp01(gridU - 15)}>
                = {fmtN(RELATION_TOTAL)} frames · 0 divergences
              </text>
            </g>
            {stairIn > 0.005 && (
              <g opacity={stairIn}>
                <text x={SX0 - 40} y={GY - 14} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                  {DRAG_COUNT} drags in a row: +7, −6, +7, −6, …
                </text>
                <line x1={SX0} y1={syl(398)} x2={SX1} y2={syl(398)} stroke={colors.GRID} />
                <line x1={SX0} y1={syl(398)} x2={SX0} y2={syl(510)} stroke={colors.GRID} />
                <line x1={SX0} y1={syl(FINAL_LEFT)} x2={SX1} y2={syl(FINAL_LEFT)} stroke={colors.POSITIVE} strokeDasharray="4 4" strokeOpacity={0.6} />
                <text x={SX0 - 8} y={syl(INITIAL_LEFT) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  {INITIAL_LEFT}
                </text>
                <text x={SX0 - 8} y={syl(FINAL_LEFT) + 4} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                  {FINAL_LEFT}
                </text>
                <text x={SX0} y={608} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  drag 1
                </text>
                <text x={SX1} y={608} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  drag {DRAG_COUNT}
                </text>
                <text x={SX0 - 8} y={syl(450) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  window left
                </text>
                {(() => {
                  const n = Math.max(1, Math.round(stairU * DRAG_COUNT));
                  const pts = STAIR_PTS.slice(0, n + 1).map(([x, y]) => `${x},${y}`).join(' ');
                  const [hx, hy] = STAIR_PTS[n];
                  return (
                    <>
                      <polyline points={pts} fill="none" stroke={VIOLET_T} strokeWidth={1.2} />
                      <circle cx={hx} cy={hy} r={4} fill={n === DRAG_COUNT ? colors.POSITIVE : VIOLET_T} />
                    </>
                  );
                })()}
                <text x={SX0 + 12} y={syl(FINAL_LEFT) - 12} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} opacity={clamp01((stairU - 0.9) * 10)}>
                  left {INITIAL_LEFT} → {FINAL_LEFT} = {INITIAL_LEFT} + {DRAG_COUNT} / 2
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== B5–B7 · the cost chart ======================== */}
        {chartVis > 0.005 && (
          <g opacity={chartVis}>
            <g opacity={1 - 0.88 * focusK1}>
              <text x={60} y={372} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                ops per compiled circuit
              </text>
            </g>
            <line x1={170} y1={BASE} x2={770} y2={BASE} stroke={colors.GRID} />
            <text x={60} y={BASE + 20} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              press records K
            </text>
            {K_LIST.map((k, j) => {
              const g = clamp01(barsU - j);
              const ops = OPS_MEASURED[j];
              const top = lerp(BASE, opsY(ops), ease.move(g));
              const split = opsY(OPS_K1);
              const fb = barFocus(k);
              return (
                <g key={k} opacity={fb}>
                  <rect x={kx(k) - BAR_HALF} y={top} width={BAR_HALF * 2} height={BASE - top} fill={VIOLET} fillOpacity={0.85} />
                  {k > 1 && splitU > 0.005 && g >= 1 && (
                    <rect x={kx(k) - BAR_HALF} y={top} width={BAR_HALF * 2} height={split - top} fill={colors.MUTED} opacity={splitU} />
                  )}
                  <text x={kx(k)} y={BASE + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {k}
                  </text>
                  {g > 0.6 && (
                    <text x={kx(k)} y={top - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={clamp01((g - 0.6) * 2.5)}>
                      {ops}
                    </text>
                  )}
                  {depthU > 0.01 && (
                    <text x={kx(k)} y={BASE + 44} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO} opacity={depthU}>
                      {DEPTH}
                    </text>
                  )}
                </g>
              );
            })}
            {depthU > 0.01 && (
              <text x={60} y={BASE + 44} fill={colors.SECONDARY} fontSize={13} fontFamily={UI} opacity={depthU}>
                depth
              </text>
            )}
            {slopeU > 0.005 && (
              <g opacity={1 - 0.88 * focusK1}>
                <line x1={kx(1)} y1={opsY(OPS_K1) - 2} x2={lerp(kx(1), kx(K_MAX), slopeU)} y2={lerp(opsY(OPS_K1), opsY(opsAt(K_MAX)), slopeU) - 2}
                  stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="5 4" />
                <g opacity={clamp01(slopeU * 2 - 1) * (1 - splitU)}>
                  <text x={482} y={470} fill={colors.WARM} fontSize={14} fontFamily={MONO}>
                    +{PER_RECORD_OPS} ops per press record
                  </text>
                  <text x={482} y={489} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    +{PER_RECORD_WEIGHTS} stored weights per record
                  </text>
                </g>
              </g>
            )}
            {splitU > 0.01 && (
              <g opacity={splitU}>
                <rect x={478} y={459} width={12} height={12} fill={VIOLET} />
                <text x={496} y={470} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                  record 0: read by behavior
                </text>
                <rect x={478} y={479} width={12} height={12} fill={colors.MUTED} />
                <text x={496} y={490} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                  archive: +{PER_RECORD_OPS} per record, unread
                </text>
              </g>
            )}
            {/* B6: stale vs printed, pinned beside the K = 1 bar */}
            {b6Op > 0.005 && (staleU > 0.005 || liveU > 0.005) && (
              <g opacity={b6Op}>
                {staleU > 0.005 && (
                  <g opacity={staleU}>
                    <Chip x={236} y={404} text={`README: ${README_OPS} ops · depth ${README_DEPTH}`} color={colors.NEGATIVE} mono />
                    {strikeU > 0.005 && (
                      <line x1={246} y1={399} x2={246 + (`README: ${README_OPS} ops · depth ${README_DEPTH}`.length * CH13 + 2) * strikeU} y2={399}
                        stroke={colors.NEGATIVE} strokeWidth={2} />
                    )}
                    <text x={246 + `README: ${README_OPS} ops · depth ${README_DEPTH}`.length * CH13 + 30} y={404} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI}
                      opacity={strikeU}>
                      stale
                    </text>
                  </g>
                )}
                {liveU > 0.005 && (
                  <g opacity={liveU}>
                    <Chip x={236} y={440} text={`measure-cost.ts: ${OPS_K1} ops · depth ${DEPTH}`} color={colors.POSITIVE} mono />
                    <text x={246} y={470} fill={colors.POSITIVE} fontSize={13} fontFamily={UI}>
                      printed by a live build at 4ea7fcb
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        )}

        {/* ======================== B7 · the press-record shift register (and its B11 whisper) ======================== */}
        {(regVis > 0.005 || archBackU > 0.005) && (
          <g>
            {regVis > 0.005 && (
              <g opacity={regVis}>
                <rect x={REC0.x} y={92} width={REC0.w} height={28} rx={6} fill={colors.PANEL} stroke={VIOLET_T} />
                <text x={REC0.x + REC0.w / 2} y={111} textAnchor="middle" fill={VIOLET_T} fontSize={13} fontFamily={UI}>
                  behavior
                </text>
                <Arrow x1={REC0.x + REC0.w / 2} y1={REC0.y - 2} x2={REC0.x + REC0.w / 2} y2={123} color={VIOLET_T} />
                <rect x={REC0.x} y={REC0.y} width={REC0.w} height={REC0.h} rx={6} fill={VIOLET} fillOpacity={0.35} stroke={VIOLET_T} strokeWidth={1.5} />
                <text x={REC0.x + REC0.w / 2} y={REC0.y + 20} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  record 0
                </text>
                <text x={REC0.x + REC0.w / 2} y={REC0.y + 38} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  current press
                </text>
                <text x={REC0.x} y={REC0.y + REC0.h + 24} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  K = {K_MAX} records
                </text>
                <g opacity={archOp}>
                  <Arrow x1={ARCH_X0} y1={REC0.y + REC0.h + 12} x2={archX(14) + ARCH_W} y2={REC0.y + REC0.h + 12} color={colors.MUTED} u={shiftU} />
                  <text x={ARCH_X0 + 10} y={REC0.y + REC0.h + 32} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={shiftU}>
                    on each pointer down, every record shifts one slot right
                  </text>
                </g>
              </g>
            )}
            <g opacity={Math.max(regVis * archOp, 0.5 * archBackU * cardsOp)}>
              <text x={ARCH_X0} y={REC0.y - 10} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                {archBackU > 0.5 ? 'press archive (records 1–15)' : 'archive · built, never read by behavior'}
              </text>
              {Array.from({ length: K_MAX - 1 }, (_, j) => (
                <g key={j} opacity={clamp01(regIn * 2.2 - j * 0.08) || archBackU}>
                  <rect x={archX(j)} y={REC0.y} width={ARCH_W} height={REC0.h} rx={4} fill={colors.MUTED} fillOpacity={0.14} stroke={colors.GRID} />
                  <text x={archX(j) + ARCH_W / 2} y={REC0.y + 29} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {j + 1}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* ======================== B8 · six trained cells; the latch bank is authored ======================== */}
        {(trainBoxU > 0.005 || bankU > 0.005) && b8Op > 0.005 && (
          <g opacity={b8Op}>
            {bankU > 0.005 && (() => {
              const r = lerpRect(REC0, BANK, bankU);
              const inner = clamp01(bankU * 2 - 1);
              return (
                <g>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                  {inner > 0.01 && (
                    <g opacity={inner}>
                      <g opacity={0.55}>
                        {BANK_CHIPS.map((c) => (
                          <Chip key={c.name} x={c.x} y={c.y} text={c.name} color={colors.MUTED} mono />
                        ))}
                      </g>
                      <text x={BANK.x + 44} y={BANK.y + 26} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                        latch bank · which latches exist, and which gates write them: authored
                      </text>
                      <g opacity={lockU}>
                        <Padlock x={BANK.x + 24} y={BANK.y + 20} color={colors.WARM} s={lerp(1.6, 1, lockU)} />
                      </g>
                    </g>
                  )}
                </g>
              );
            })()}
            {trainBoxU > 0.005 && (
              <g opacity={trainBoxU}>
                <rect x={TRAIN_BOX.x} y={TRAIN_BOX.y} width={TRAIN_BOX.w} height={TRAIN_BOX.h} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                <text x={TRAIN_BOX.x + 16} y={TRAIN_BOX.y + 24} fill={colors.WARM} fontSize={14} fontFamily={MONO}>
                  behaviorParameterCells · trained
                </text>
                {PARAM_CELLS.map((name, i) => (
                  <Chip key={name} x={TRAIN_BOX.x + 16 + (i % 2) * 210} y={TRAIN_BOX.y + 60 + Math.floor(i / 2) * 32} text={name} color={colors.TEXT} mono
                    opacity={clamp01(trainBoxU * 3 - 1 - i * 0.2)} />
                ))}
              </g>
            )}
            {arrowU > 0.005 && (
              <g>
                <rect x={60} y={405} width={190} height={40} rx={8} fill={colors.PANEL} stroke={colors.MUTED} opacity={clamp01(arrowU * 3)} />
                <text x={155} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(arrowU * 3)}>
                  oracle.ts · oracleTick
                </text>
                <Arrow x1={252} y1={425} x2={TRAIN_BOX.x - 4} y2={425} color={colors.WARM} u={arrowU} width={2} />
                <text x={60} y={470} fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={clamp01(arrowU * 2 - 1)}>
                  every example: oracle state +
                </text>
                <text x={60} y={488} fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={clamp01(arrowU * 2 - 1)}>
                  decision labels, handed in
                </text>
              </g>
            )}
            <Chip x={TRAIN_BOX.x} y={TRAIN_BOX.y + TRAIN_BOX.h + 40} text="recovers parameter cells, not structure" color={colors.WARM} fs={14} opacity={notStructU} />
          </g>
        )}

        {/* ======================== B9 · the status line, verbatim ======================== */}
        {quoteU > 0.005 && quoteOp > 0.005 && (
          <g opacity={quoteU * quoteOp} transform={`translate(0 ${(1 - quoteU) * 10})`}>
            <rect x={60} y={238} width={730} height={102} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <rect x={60} y={238} width={5} height={102} rx={2} fill={colors.WARM} />
            <text x={84} y={272} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
              Training supplies correct internal state and decision labels.
            </text>
            <text x={84} y={298} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
              Persistent state and temporal dependencies remain.
            </text>
            <text x={84} y={324} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              the lab's status file, on this experiment
            </text>
          </g>
        )}

        {/* ======================== B10 · the demo's move history ======================== */}
        {histIn > 0.005 && histOp > 0.005 && (
          <g opacity={histOp}>
            <g opacity={histIn * (1 - 0.6 * fixedU)}>
              <text x={60} y={OLD_Y + 21} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                before the fix
              </text>
              {HIST_CELLS.map((c, i) => {
                const squashed = i === 1;
                const x = squashed ? lerp(c.x, HIST_CELLS[2].x, squashU) : c.x;
                const op = squashed ? 1 - squashU : 1;
                if (op <= 0.01) return null;
                return (
                  <g key={c.label} opacity={op}>
                    <rect x={x} y={OLD_Y} width={c.w} height={HC_H} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={x + c.w / 2} y={OLD_Y + 21} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {c.label}
                    </text>
                  </g>
                );
              })}
              <text x={HIST_CELLS[1].x} y={OLD_Y + HC_H + 20} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI} opacity={squashU}>
                two moves squashed into the last one
              </text>
              <text x={590} y={OLD_Y + 21} fill={colors.NEGATIVE} fontSize={14} fontFamily={UI} opacity={oldResU}>
                → click: maximizes ✗
              </text>
              {fixedU > 0.005 && (
                <line x1={194} y1={OLD_Y + HC_H / 2} x2={lerp(194, 760, fixedU)} y2={OLD_Y + HC_H / 2} stroke={colors.NEGATIVE} strokeWidth={2} />
              )}
            </g>
            {newU > 0.005 && (
              <g>
                <text x={60} y={NEW_Y + 21} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={newU}>
                  now
                </text>
                {HIST_CELLS.map((c, i) => (
                  <g key={c.label} opacity={clamp01(newU * 2.2 - i * 0.35)}>
                    <rect x={c.x} y={NEW_Y} width={c.w} height={HC_H} rx={5} fill={colors.PANEL} stroke={i === 1 ? VIOLET_T : colors.GRID}
                      strokeWidth={i === 1 ? 1.6 : 1} />
                    <text x={c.x + c.w / 2} y={NEW_Y + 21} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {c.label}
                    </text>
                  </g>
                ))}
                <g opacity={latchU} transform={`translate(${HIST_CELLS[1].x + 55} ${NEW_Y + HC_H + 26}) scale(${lerp(1.3, 1, latchU)}) translate(${-(HIST_CELLS[1].x + 55)} ${-(NEW_Y + HC_H + 26)})`}>
                  <Chip x={HIST_CELLS[1].x + 55} y={NEW_Y + HC_H + 26} text="slopLatch = 1" color={VIOLET_T} mono anchor="middle" />
                </g>
                <text x={590} y={NEW_Y + 21} fill={colors.POSITIVE} fontSize={14} fontFamily={UI} opacity={newResU}>
                  → click cancelled ✓
                </text>
              </g>
            )}
            <Chip x={60} y={OLD_Y + HC_H + 56} text="fixed" color={colors.POSITIVE} opacity={fixedU} />
            <Chip x={HIST_CELLS[2].x + 10} y={NEW_Y + HC_H + 26} text="pointer-input.test.ts: out and back cancels" color={colors.TEXT} mono opacity={testU} />
          </g>
        )}

        {/* ======================== B11 · open, not built ======================== */}
        {cardsU > 0.005 && cardsOp > 0.005 && (
          <g opacity={cardsOp}>
            {moveArchU > 0.005 && (
              <g opacity={moveArchU}>
                <rect x={MOVE_ARCH.x} y={MOVE_ARCH.y} width={MOVE_ARCH.w} height={MOVE_ARCH.h} rx={6} fill={colors.BG} stroke={colors.MUTED}
                  strokeDasharray="5 4" />
                <text x={MOVE_ARCH.x + MOVE_ARCH.w / 2} y={MOVE_ARCH.y + 25} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  move archive · not built
                </text>
              </g>
            )}
            {CARDS.map((c, j) => {
              const u = clamp01((cardsU - j) * 1.6);
              if (u <= 0.005) return null;
              const x = CARD_X(j);
              const y = CARD_Y + (1 - u) * 14;
              return (
                <g key={j} opacity={u}>
                  <rect x={x} y={y} width={CARD_W} height={CARD_H} rx={8} fill={colors.PANEL} stroke={colors.MUTED} strokeDasharray="5 4" />
                  {c.lines.map((l, k) => (
                    <text key={k} x={x + 12} y={y + 24 + k * 19} fill={k === 0 ? colors.TEXT : colors.MUTED} fontSize={k === 0 ? 14 : 13} fontFamily={UI}>
                      {l}
                    </text>
                  ))}
                  <text x={x + 12} y={y + CARD_H - 12} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    not built
                  </text>
                </g>
              );
            })}
            <g opacity={clamp01((cardsU - 0.3) * 2) * archBackU}>
              <Arrow x1={archX(0) + ARCH_W / 2} y1={REC0.y + REC0.h + 4} x2={CARD_X(0) + CARD_W / 2} y2={CARD_Y - 6} color={colors.MUTED} dashed />
            </g>
            <g opacity={clamp01((cardsU - 1.3) * 2) * moveArchU}>
              <Arrow x1={MOVE_ARCH.x + 46} y1={MOVE_ARCH.y + MOVE_ARCH.h + 2} x2={CARD_X(1) + CARD_W / 2} y2={CARD_Y - 6} color={colors.MUTED} dashed />
            </g>
          </g>
        )}

        {/* ======================== B12 · recap ======================== */}
        {recapU > 0.005 && (
          <g>
            {RECAP.map((t, i) => {
              const u = clamp01((recapU - i) * 1.5);
              if (u <= 0.005) return null;
              const x = RECAP_XS[i];
              return (
                <g key={t} opacity={u}>
                  {i > 0 && <Arrow x1={x - RECAP_GAP + 6} y1={292} x2={x - 6} y2={292} color={colors.MUTED} />}
                  <rect x={x} y={272} width={RECAP_W[i]} height={40} rx={8} fill={colors.PANEL} stroke={i === 2 ? colors.POSITIVE : VIOLET_T} strokeWidth={1.4} />
                  <text x={x + RECAP_W[i] / 2} y={297} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                    {t}
                  </text>
                </g>
              );
            })}
            <g opacity={lastU}>
              <text x={425} y={372} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={UI}>
                the memory is real · learning the memory is not shown
              </text>
            </g>
          </g>
        )}

        {/* ======================== the scorecard ledger ======================== */}
        {ledgerOp > 0.005 && (
          <g opacity={ledgerOp}>
            <text x={LX} y={100} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              scorecard · each number with its scope
            </text>
            {ROWS.map((_, i) => (
              <LedgerRow key={i} i={i} u={rowU[i]} stampU={stampU[i]} pulse={i === 0 ? pulse0 : 0} />
            ))}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space header ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.92} />
      <text x={40} y={36} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Exact, Within Limits
      </text>
      <text x={1240} y={36} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
        Event Window
      </text>
    </>
  );
}

export const vizScene = () => scene;
