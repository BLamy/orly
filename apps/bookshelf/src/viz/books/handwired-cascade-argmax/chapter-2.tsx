// Eight Candidates, One Winner
//
// Picking Exactly — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
// Paths are relative to lab/cascade-argmax/ unless they begin with src/ or lab/.
//   cascade-argmax.ts:1-5 (production: scale to near 0.5, boolean atom; the band "roughly 2.4e-7"), 26-29 (scores in
//     [0, 1]), 93-137 (emitCascadeArgmax: pair up, rightWins, leftWins = 1 - rightWins, two gated products),
//     139-149 (routeCascade: the one-hot route), 185-192 (leftmostArgmax, the oracle)
//   src/runtime/numeric-ui-core.ts:2735-2743 (emitArgmax: comparisonBias, comparisonScale, circuit.boolean)
//   cascade-argmax.test.ts:20-28 (ulpAt), 30-34 (productionBandBound = 2.5e-7), 36-52 (adversarial pairs),
//     54-68 (ties at ten magnitudes), 70-101 (adversarial sweep), 103-135 (2,000 random vectors at 3, 8, 20, 64),
//     137-149 (the planted near-tie: production 2, cascade 6), 151-162 (tensor == reference)
//   README.md:3, 5 (what the exactness tests cover), 24-29 (built counts), 31 (not a proof of minimality),
//     33 (core exact tree: 150 operations in 57 layers)
//   lab/ui-exploration/guide/examples/patterns/selection/highest-score-tree.test.ts:155-156 (45 compiled, production;
//     150 / 57 for the core's exact tree); the 187 compiled cascade count is the research probe
//     (compileTensorProgram over the selected roots, .orly-work/hw-books/inputs/cascade-argmax.md), labelled compiled.
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim), checked by Haiku 5.5's fact-check (review.md).
//
// The visual machine: ONE eight-card bracket. It plays its tournament, opens one match, replays a tie, grows a
// production twin, replays the planted near-tie, and finally sheds its seven matches as operation tiles that stack
// into the cost bars. Computed at module scope: every bracket result (the cascade's exact rule and leftmostArgmax
// must agree, and the planted vector must give the test's 6 and 2), the planted score f32(0.5 + ulpAt(0.5)), the
// tie value of comparisonBias, the adversarial pair count, and the per-match op counts (README rows divide exactly by
// the n - 1 matches: 8 and 28). The first two score vectors are EXAMPLE inputs (labelled on screen). The production
// band boundary on the gap axis is drawn at the header's figure and labelled schematic; the research probe's 1.86e-7
// is not drawn. No timing column is shown.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const f32 = Math.fround;
const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The lab's own arithmetic (module scope, exact)
// ---------------------------------------------------------------------------

/** cascade-argmax.test.ts:20-28 */
function ulpAt(value: number): number {
  let candidate = 2 ** -149;
  while (f32(value + candidate) === value) candidate *= 2;
  return candidate;
}

/** cascade-argmax.ts:186-192 */
function leftmostArgmax(scores: readonly number[]): number {
  let winner = 0;
  for (let item = 1; item < scores.length; item++) if (scores[item] > scores[winner]) winner = item;
  return winner;
}

const BASE = f32(0.5);
const PLANT = f32(BASE + ulpAt(BASE)); // scores[6] = f32(base + ulpAt(base))
const COMPARISON_BIAS = 0.5000000596046448;
const COMPARISON_SCALE = 0.4999999403953552;
// One FP32 step above 0.5: at a tie the comparison is exactly the bias, so the boolean atom keeps the left.
if (PLANT !== COMPARISON_BIAS || f32(COMPARISON_BIAS) !== COMPARISON_BIAS) throw new Error('ch2: bias is not one step above 0.5');
if (PLANT - BASE !== 2 ** -24) throw new Error('ch2: the planted step is not 2**-24');

/** cascade-argmax.test.ts:38-52 — counted, not run. */
const ADV_BASES = [0, 2 ** -126, 2 ** -100, 1e-6, 1e-3, 0.1, 0.25, 0.5, 0.5 + 2 ** -24, 0.75, 0.9, 1 - 2 ** -24, 1];
const ADV_STEPS = [0, 1, 2, 3, 4, 8, 16];
const ADV_PAIRS = (() => {
  let n = 0;
  for (const raw of ADV_BASES) {
    const base = f32(raw);
    for (const k of ADV_STEPS) {
      let other = base;
      for (let step = 0; step < k; step++) other = f32(other + ulpAt(other));
      if (other > 1) continue;
      n += 2;
    }
  }
  return n;
})();
const TIE_VALUES = [0, 2 ** -149, 2 ** -126, 1e-6, 0.1, 0.25, 0.5, 0.75, 1 - 2 ** -24, 1]; // test.ts:57
const RANDOM_WIDTHS = [3, 8, 20, 64];
const RANDOM_TRIALS = 2000;

// README.md:24-29 — built counts, both widths; every row is (n - 1) matches times a fixed per-match cost.
const COST = [
  { n: 8, prodOps: 56, cascOps: 196, prodLayers: 15, cascLayers: 75 },
  { n: 64, prodOps: 504, cascOps: 1764, prodLayers: 33, cascLayers: 150 },
];
const PER_MATCH_PROD = COST[0].prodOps / (COST[0].n - 1);
const PER_MATCH_CASC = COST[0].cascOps / (COST[0].n - 1);
for (const c of COST) {
  if (c.prodOps !== PER_MATCH_PROD * (c.n - 1) || c.cascOps !== PER_MATCH_CASC * (c.n - 1)) throw new Error('ch2: per-match cost');
}
const COMPILED_PROD = 45; // highest-score-tree.test.ts:155
const COMPILED_CASC = 187; // research probe, compiled selected-only roots
const CORE_TREE = { ops: 150, layers: 57 }; // README.md:33, compiled
const RATIO_BUILT = COST[0].cascOps / COST[0].prodOps; // 3.5 (and 1764 / 504 = 3.5)
const RATIO_COMPILED = COMPILED_CASC / COMPILED_PROD; // 4.16…

// ---------------------------------------------------------------------------
// Score vectors and both tournaments
// ---------------------------------------------------------------------------

type Vec = { scores: number[]; labels: string[] };
const mkVec = (scores: number[], labels?: string[]): Vec => ({ scores: scores.map(f32), labels: labels ?? scores.map((v) => `${v}`) });
// Example inputs (labelled on screen as examples).
const V_A = mkVec([0.31, 0.62, 0.47, 0.22, 0.18, 0.83, 0.55, 0.29]);
const V_T = mkVec([0.31, 0.83, 0.47, 0.22, 0.18, 0.83, 0.55, 0.29]); // cards 1 and 5 tie at the top
// cascade-argmax.test.ts:140-143 — the planted near-tie.
const V_P: Vec = {
  scores: [0.25, 0.25, BASE, 0.25, 0.25, 0.25, PLANT, 0.25].map(f32),
  labels: ['0.25', '0.25', '0.5', '0.25', '0.25', '0.25', '0.5 + 2**-24', '0.25'],
};
const VECS = [V_A, V_T, V_P];

type Match = { round: number; m: number; left: number; right: number; rw: number; winner: number };
type Result = { matches: Match[][]; winner: number };
const BAND_HEADER = 2.4e-7; // cascade-argmax.ts:4, the header's figure (schematic edge)

function tournament(scores: number[], rightWins: (l: number, r: number) => number): Result {
  let level = scores.map((_, i) => i);
  const matches: Match[][] = [];
  for (let round = 0; level.length > 1; round++) {
    const next: number[] = [];
    const row: Match[] = [];
    for (let k = 0; k < level.length; k += 2) {
      const left = level[k];
      const right = level[k + 1];
      const rw = rightWins(scores[left], scores[right]);
      const winner = rw ? right : left;
      row.push({ round, m: k / 2, left, right, rw, winner });
      next.push(winner);
    }
    matches.push(row);
    level = next;
  }
  return { matches, winner: level[0] };
}
const cascadeBit = (l: number, r: number): number => (r > l ? 1 : 0); // the exact cascade: [right > left]
const productionBit = (l: number, r: number): number => (r - l >= BAND_HEADER ? 1 : 0); // keeps left inside the band
const RES_C = VECS.map((v) => tournament(v.scores, cascadeBit));
const RES_P = VECS.map((v) => tournament(v.scores, productionBit));
RES_C.forEach((r, i) => {
  if (r.winner !== leftmostArgmax(VECS[i].scores)) throw new Error('ch2: cascade disagrees with leftmostArgmax');
});
if (RES_C[2].winner !== 6 || RES_P[2].winner !== 2) throw new Error('ch2: planted vector must give cascade 6, production 2');
if (RES_P[1].winner !== RES_C[1].winner) throw new Error('ch2: the tie must go left in both');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 76;
const CC_Y = 630; // the player's caption pill covers the strip below
const IDX_X = 104;
const SEL_X = 130;
const BAR_X = 152;
const BAR_W = 150; // score 1
const VAL_X = 312;
const EDGE_X0 = 414;
const RX = [470, 540, 610];

type Geom = { y0: number; pitch: number; cardH: number; r: number };
const SOLO: Geom = { y0: 140, pitch: 54, cardH: 26, r: 13 };
const SPLIT_C: Geom = { y0: 122, pitch: 28, cardH: 18, r: 11 };
const SPLIT_P: Geom = { y0: 402, pitch: 28, cardH: 18, r: 11 };
const lerpGeom = (a: Geom, b: Geom, u: number): Geom => ({
  y0: lerp(a.y0, b.y0, u), pitch: lerp(a.pitch, b.pitch, u), cardH: lerp(a.cardH, b.cardH, u), r: lerp(a.r, b.r, u),
});
const leafY = (g: Geom, i: number): number => g.y0 + i * g.pitch + g.cardH / 2;
function nodeY(g: Geom, round: number, m: number): number {
  if (round === 0) return (leafY(g, 2 * m) + leafY(g, 2 * m + 1)) / 2;
  return (nodeY(g, round - 1, 2 * m) + nodeY(g, round - 1, 2 * m + 1)) / 2;
}
/** child anchor → parent anchor, as an elbow; returns the path both ways and its length. */
function edge(g: Geom, round: number, m: number, side: 0 | 1) {
  const cy = round === 0 ? leafY(g, 2 * m + side) : nodeY(g, round - 1, 2 * m + side);
  const cx = round === 0 ? EDGE_X0 : RX[round - 1] + g.r;
  const px = RX[round] - g.r;
  const py = nodeY(g, round, m);
  const mx = (cx + px) / 2;
  const len = Math.abs(mx - cx) + Math.abs(py - cy) + Math.abs(px - mx);
  const at = (u: number): [number, number] => {
    let d = clamp01(u) * len;
    const a = Math.abs(mx - cx);
    if (d <= a) return [cx + d, cy];
    d -= a;
    const b = Math.abs(py - cy);
    if (d <= b) return [mx, cy + Math.sign(py - cy) * d];
    d -= b;
    return [mx + d, py];
  };
  return { d: `M ${cx} ${cy} H ${mx} V ${py} H ${px}`, rev: `M ${px} ${py} H ${mx} V ${cy} H ${cx}`, len, at };
}
const MATCH_ID: [number, number][] = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [2, 0]];

const INS_X = 770; // the inset column (x 750 … 1222)

// gap axis (beat 5)
const GAP_D0 = -1.2e-7;
const GAP_D1 = 3.6e-7;
const gx = (d: number): number => 800 + ((d - GAP_D0) / (GAP_D1 - GAP_D0)) * 400;

// cost chart
const ROW_X = 750;
const BAR0 = 866;
const BAR_MAX = 300;
const PX8 = BAR_MAX / COST[0].cascOps; // px per op at the 8-candidate scale
const PX64 = BAR_MAX / COST[1].cascOps; // shared scale
const PXL8 = BAR_MAX / COST[0].cascLayers;
const PXL64 = BAR_MAX / COST[1].cascLayers;
const TILE_ROWS = 4;
const TILE_PITCH = TILE_ROWS * PX8; // a tile per op, 4 rows deep
const TILE = TILE_PITCH - 1.2;
const BAR_H = TILE_ROWS * TILE_PITCH;
const OPS_Y = { title: 134, r0: 148, c0: 180, r1: 202, c1: 234, r2: 256, r3: 296 };
const LAY_Y = { title: 364, rows: [378, 402, 426, 450], h: 16 };

const CAM_START: CameraState = { x: 300, y: 345, k: 1.22 };
const CAM_MATCH: CameraState = { x: 330, y: 396, k: 1.55 };
const CAM_ANAT: CameraState = { x: 690, y: 382, k: 1.04 };
const CAM_BAND: CameraState = { x: 920, y: 350, k: 1.18 };
const CAM_BARS: CameraState = { x: 262, y: 238, k: 1.7 };
const CAM_TICKER: CameraState = { x: 900, y: 372, k: 1.06 };
const CAM_CHART: CameraState = { x: 966, y: 304, k: 1.16 };
const CAM_OPS8: CameraState = { x: 976, y: 228, k: 1.3 };

const IDS = [
  'emitCascadeArgmax(circuit, scores, unit)',
  'rightWins · leftWins · routeCascade',
  'leftmostArgmax(scores)',
  'emitArgmax · circuit.boolean(comparison)',
  'productionBandBound = 2.5e-7',
  'scores[6] = f32(base + ulpAt(base))',
  "runArgmaxTree(tree, scores, 'reference' | 'tensor')",
  "invariant(… 'argmax scores must be within zero and one')",
  'circuitOpCounts · operations, layers',
  'report.ts · 8 and 64 candidates',
  'built vs compiled',
  'emitCompare · core exact tree',
];

// verbatim code chips (long lines wrapped)
const C_ORACLE = [
  'export function leftmostArgmax(',
  '    scores: readonly number[]): number {',
  '  let winner = 0',
  '  for (let item = 1; item < scores.length; item++) {',
  '    if (scores[item]! > scores[winner]!) winner = item',
  '  }',
  '  return winner',
  '}',
];
const C_PROD = [
  'const comparisonBias = 0.5000000596046448',
  'const comparisonScale = 0.4999999403953552',
  'const comparison = circuit.affine([',
  '  [left.score, comparisonScale],',
  '  [right.score, -comparisonScale],',
  '], comparisonBias)',
  'const leftWins = circuit.boolean(comparison)',
];

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'One bit compares two candidates. Eight candidates need a tournament: pair them up, compare each pair, and send the winners on to the next round.',
  "Each match makes a right-wins bit and a left-wins bit, which is one minus it. The winner's score rises through two gated products, and the route is kept as a one-hot.",
  "Both argmax versions aim at the same rule: the leftmost maximum wins. The lab's test oracle is simply that rule written in plain code.",
  'The production argmax scales the gap to near one half and rounds it with a boolean atom. A tie goes left there too.',
  "But that encoding also keeps the left candidate across a rounding band. The lab's header puts it at roughly two point four in ten million, and its test bounds it under two point five.",
  "Plant one candidate a single float step above the leader. In the lab's test the cascade picks it, at position six, while production keeps position two.",
  'The tests cover ties at many magnitudes, tiny subnormal gaps, adjacent floats, and two thousand random vectors at each of four widths. Both evaluators agree.',
  'Say it plainly: that is sampled testing, not a proof for every pair of scores. It also assumes scores stay between zero and one.',
  'Now the price. At eight candidates, production builds fifty-six operations in fifteen layers. The cascade builds one hundred ninety-six in seventy-five.',
  'At sixty-four candidates it is five hundred four against one thousand seven hundred sixty-four operations, and thirty-three layers against one hundred fifty.',
  'Those are built operations, counted before compiling. Compiled, the cascade is still about four times larger: forty-five against one hundred eighty-seven at eight candidates.',
  "The lab calls the cascade an available construction, not a proof of minimality. The core's own exact tree is one hundred fifty operations in fifty-seven layers, counted after compiling.",
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);
  const idIdx = tl.channel('idIdx', 0);

  const cardsU = tl.channel('cardsU', 0);
  const linesU = tl.channel('linesU', 0);
  const playC = tl.channel('playC', 0); // 0..3 rounds resolved, cascade bracket
  const playP = tl.channel('playP', 0); // production bracket
  const vecA = tl.channel('vecA', 0); // example → tie vector
  const vecB = tl.channel('vecB', 0); // tie → planted vector
  const split = tl.channel('split', 0);
  const prodU = tl.channel('prodU', 0);
  const dimU = tl.channel('dimU', 0); // both brackets whisper
  const focusU = tl.channel('focusU', 0); // one match spotlit
  const routeU = tl.channel('routeU', 0);
  const selU = tl.channel('selU', 0);
  const tieC = tl.channel('tieC', 0);
  const tieP = tl.channel('tieP', 0);
  const anatS = tl.channel('anatS', 0); // 0..6 anatomy rows
  const anatOp = tl.channel('anatOp', 1);
  const oracleU = tl.channel('oracleU', 0);
  const prodCodeU = tl.channel('prodCodeU', 0);
  const bandS = tl.channel('bandS', 0); // 0..4
  const bandOp = tl.channel('bandOp', 1);
  const diffU = tl.channel('diffU', 0);
  const resultU = tl.channel('resultU', 0);
  const tickerU = tl.channel('tickerU', 0);
  const tickU = tl.channel('tickU', 0);
  const stampU = tl.channel('stampU', 0);
  const rangeU = tl.channel('rangeU', 0);
  const perMatchU = tl.channel('perMatchU', 0);
  const chartU = tl.channel('chartU', 0);
  const flyU = tl.channel('flyU', 0);
  const solidU = tl.channel('solidU', 0);
  const layU = tl.channel('layU', 0);
  const scaleU = tl.channel('scaleU', 0); // 0 = 8-candidate scale · 1 = shared scale
  const row64U = tl.channel('row64U', 0);
  const op64 = tl.channel('op64', 1);
  const ratio8U = tl.channel('ratio8U', 0);
  const ratio64U = tl.channel('ratio64U', 0);
  const builtU = tl.channel('builtU', 0);
  const compU = tl.channel('compU', 0);
  const ratioCU = tl.channel('ratioCU', 0);
  const refU = tl.channel('refU', 0);
  const finalU = tl.channel('finalU', 0);

  // caption clock: ~150 words per minute, then a short hold
  const caps: { at: number; dur: number }[] = [];
  let t = 0.4;
  for (const text of CAPTIONS) {
    const dur = Math.round((text.split(/\s+/).length / 2.5 + 0.4) * 10) / 10;
    caps.push({ at: t, dur });
    t = tl.hold(t + dur, 0.6);
  }
  caps.forEach((c, i) => {
    tl.caption({ ...c, text: CAPTIONS[i] });
    tl.set(idIdx, i, Math.max(0, c.at - 0.1));
  });
  const A = caps.map((c) => c.at);
  const tw = <T,>(ch: Parameters<typeof tl.tween>[0], to: T, at: number, dur: number, e = ease.move) =>
    tl.tween(ch as never, to as never, { at, dur, ease: e });

  // — B0 · eight cards, a tournament —
  let a = A[0];
  tw(cardsU, 1, a + 0.2, 1.4, ease.enter);
  tw(linesU, 1, a + 2.4, 1.4, ease.draw);
  tw(cam, CAMERA_HOME, a + 3.2, 1.5);
  tw(playC, 3, a + 5.2, 3.9, ease.linear);

  // — B1 · one match, opened up —
  a = A[1];
  tw(cam, CAM_MATCH, a, 1.3);
  tw(focusU, 1, a, 0.7);
  tw(cam, CAM_ANAT, a + 3.4, 1.4);
  tw(anatS, 6, a + 4.0, 5.6, ease.linear);
  tw(focusU, 0, a + 9.6, 0.6);
  tw(routeU, 1, a + 9.8, 1.3, ease.draw);
  tw(selU, 1, a + 10.6, 0.6, ease.enter);

  // — B2 · the same rule: leftmost maximum; a tie goes left —
  a = A[2];
  tw(anatOp, 0, a, 0.6);
  tw(cam, CAMERA_HOME, a, 1.2);
  tw(routeU, 0, a, 0.5);
  tw(selU, 0, a, 0.5);
  tw(playC, 0, a + 0.1, 0.6);
  tw(vecA, 1, a + 0.8, 1.0);
  tw(oracleU, 1, a + 1.0, 0.7, ease.enter);
  tw(playC, 3, a + 2.2, 3.3, ease.linear);
  tw(tieC, 1, a + 5.6, 0.6, ease.pop);

  // — B3 · production argmax: a twin bracket, the same tie goes left —
  a = A[3];
  tw(oracleU, 0, a, 0.5);
  tw(split, 1, a + 0.2, 1.3);
  tw(prodU, 1, a + 1.0, 0.8, ease.enter);
  tw(prodCodeU, 1, a + 1.6, 0.7, ease.enter);
  tw(playP, 3, a + 3.4, 3.0, ease.linear);
  tw(tieP, 1, a + 6.5, 0.6, ease.pop);

  // — B4 · the rounding band —
  a = A[4];
  tw(prodCodeU, 0, a, 0.5);
  tw(dimU, 1, a, 0.7);
  tw(cam, CAM_BAND, a + 0.3, 1.4);
  tw(bandS, 4, a + 1.0, 8.0, ease.linear);

  // — B5 · the planted near-tie —
  a = A[5];
  tw(bandOp, 0, a, 0.5);
  tw(tieC, 0, a, 0.4);
  tw(tieP, 0, a, 0.4);
  tw(playC, 0, a, 0.5);
  tw(playP, 0, a, 0.5);
  tw(dimU, 0, a + 0.2, 0.6);
  tw(vecB, 1, a + 0.6, 1.0);
  tw(cam, CAM_BARS, a + 0.6, 1.3);
  tw(diffU, 1, a + 2.2, 0.7, ease.enter);
  tw(cam, CAMERA_HOME, a + 4.8, 1.3);
  tw(diffU, 0, a + 4.8, 0.6);
  tw(playC, 3, a + 5.4, 2.6, ease.linear);
  tw(playP, 3, a + 5.4, 2.6, ease.linear);
  tw(resultU, 1, a + 8.1, 0.6, ease.pop);

  // — B6 · the test evidence —
  a = A[6];
  tw(resultU, 0, a, 0.5);
  tw(dimU, 1, a, 0.7);
  tw(cam, CAM_TICKER, a + 0.2, 1.3);
  tw(tickerU, 1, a + 0.4, 0.7, ease.enter);
  tw(tickU, 1, a + 1.2, 7.0, ease.linear);

  // — B7 · sampled, not proven; the assumed range —
  a = A[7];
  tw(stampU, 1, a + 0.8, 0.5, ease.pop);
  tw(rangeU, 1, a + 4.6, 0.8, ease.enter);

  // — B8 · the price at eight: matches shed their operations —
  a = A[8];
  tw(tickerU, 0, a, 0.5);
  tw(stampU, 0, a, 0.5);
  tw(rangeU, 0, a, 0.5);
  tw(cam, CAMERA_HOME, a, 1.2);
  tw(dimU, 0, a, 0.6);
  tw(chartU, 1, a + 0.4, 0.7, ease.enter);
  tw(perMatchU, 1, a + 0.6, 0.6, ease.enter);
  tw(flyU, 1, a + 1.0, 2.8, ease.linear);
  tw(perMatchU, 0, a + 4.0, 0.5);
  tw(dimU, 1, a + 4.0, 0.6);
  tw(cam, CAM_CHART, a + 4.0, 1.3);
  tw(layU, 1, a + 4.6, 1.1, ease.move);
  tw(ratio8U, 1, a + 6.4, 0.5, ease.pop);

  // — B9 · sixty-four candidates on a shared scale: pull back —
  a = A[9];
  tw(ratio8U, 0, a, 0.4);
  tw(solidU, 1, a, 0.6);
  tw(cam, CAMERA_HOME, a + 0.4, 1.5);
  tw(scaleU, 1, a + 0.7, 1.4);
  tw(row64U, 1, a + 2.4, 1.3);
  tw(ratio64U, 1, a + 4.6, 0.5, ease.pop);

  // — B10 · built vs compiled —
  a = A[10];
  tw(ratio64U, 0, a, 0.4);
  tw(op64, 0, a, 0.6);
  tw(scaleU, 0, a + 0.6, 1.3);
  tw(builtU, 1, a + 1.2, 0.6, ease.pop);
  tw(cam, CAM_OPS8, a + 2.4, 1.3);
  tw(compU, 1, a + 3.6, 1.1, ease.move);
  tw(ratioCU, 1, a + 5.4, 0.5, ease.pop);

  // — B11 · not a proof of minimality; the core's own exact tree —
  a = A[11];
  tw(ratioCU, 0, a, 0.4);
  tw(builtU, 0, a, 0.5);
  tw(cam, CAMERA_HOME, a + 0.2, 1.5);
  tw(finalU, 1, a + 1.4, 0.8, ease.enter);
  tw(refU, 1, a + 4.6, 1.2, ease.draw);
  tl.hold(t, 1.6);

  return {
    tl, cam, idIdx, cardsU, linesU, playC, playP, vecA, vecB, split, prodU, dimU, focusU, routeU, selU, tieC, tieP,
    anatS, anatOp, oracleU, prodCodeU, bandS, bandOp, diffU, resultU, tickerU, tickU, stampU, rangeU, perMatchU,
    chartU, flyU, solidU, layU, scaleU, row64U, op64, ratio8U, ratio64U, builtU, compU, ratioCU, refU, finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function BitDisc({ x, y, b, r = 10, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 1 ? colors.WARM : colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={b >= 1 ? '#0a0e1a' : colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700}>
        {b}
      </text>
    </g>
  );
}

function CodeChip({ x, y, lines, stripe = colors.TEAL, opacity = 1, fs = 13 }: {
  x: number; y: number; lines: string[]; stripe?: string; opacity?: number; fs?: number;
}) {
  if (opacity <= 0.005) return null;
  const adv = fs === 14 ? CH14 : CH13;
  const lh = fs + 5;
  const w = Math.max(...lines.map((l) => l.length)) * adv + 26;
  const h = lines.length * lh + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 6 + lh * (i + 1) - 5} fill={colors.TEXT} fontSize={fs} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
    </g>
  );
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = true, fill }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : fs === 13 ? CH13 : fs * 0.6) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill ?? colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={fill ? '#0a0e1a' : color} fontSize={fs} fontFamily={mono ? MONO : UI} fontWeight={fill ? 700 : 400}>
        {text}
      </text>
    </g>
  );
}

function Tick({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <path d={`M ${x - 7 * s} ${y} L ${x - 2 * s} ${y + 5 * s} L ${x + 8 * s} ${y - 6 * s}`} stroke={colors.POSITIVE} strokeWidth={2.6}
      fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

/** A box with one or two centred mono lines (the match anatomy). */
function Box({ x, y, w, h, lines, color, opacity, fs = 14 }: {
  x: number; y: number; w: number; h: number; lines: string[]; color: string; opacity: number; fs?: number;
}) {
  if (opacity <= 0.005) return null;
  const lh = fs + 5;
  const top = y + h / 2 - ((lines.length - 1) * lh) / 2 + fs * 0.35;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      {lines.map((l, i) => (
        <text key={i} x={x + w / 2} y={top + i * lh} textAnchor="middle" fill={i === 0 ? colors.TEXT : color} fontSize={fs} fontFamily={MONO}>
          {l}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The bracket
// ---------------------------------------------------------------------------

type BracketProps = {
  g: Geom;
  kind: 'cascade' | 'production';
  scores: number[];
  labels: string[] | null; // null while morphing (two decimals)
  res: Result;
  play: number;
  op: number;
  cardsU: number;
  linesU: number;
  focus: number; // 0..1 spotlight on match (0, 2)
  routeU: number;
  selU: number;
  tieU: number;
  example: boolean;
  fit: Fit;
};
type Fit = (x0: number, x1: number, y0: number, y1: number) => number;

function Bracket({ g, kind, scores, labels, res, play, op, cardsU, linesU, focus, routeU, selU, tieU, example, fit }: BracketProps) {
  if (op <= 0.005) return null;
  const nodeColor = kind === 'cascade' ? colors.TEAL : colors.SECONDARY;
  const focusLeaf = (i: number) => i === 4 || i === 5;
  const dimLeaf = (i: number) => (focusLeaf(i) ? 1 : lerp(1, 0.15, focus));
  const dimNode = (round: number, m: number) => (round === 0 && m === 2 ? 1 : lerp(1, 0.15, focus));
  const crownU = clamp01((play - 2.75) / 0.25);
  const winner = res.winner;
  const rootY = nodeY(g, 2, 0);

  // the one-hot route, root → leaf (winner's three edges, reversed)
  const routeEdges: { rev: string; len: number }[] = [];
  {
    let item = winner;
    const chain: { round: number; m: number; side: 0 | 1 }[] = [];
    for (let round = 0; round < 3; round++) {
      const match = res.matches[round].find((mm) => mm.left === item || mm.right === item)!;
      chain.push({ round, m: match.m, side: match.right === item ? 1 : 0 });
      item = match.winner;
    }
    chain.reverse().forEach((c) => routeEdges.push(edge(g, c.round, c.m, c.side)));
  }

  return (
    <g opacity={op}>
      <text x={IDX_X - 8} y={g.y0 - 14} fill={nodeColor} fontSize={15} fontFamily={UI} fontWeight={600} opacity={fit(IDX_X - 8, VAL_X + 96, g.y0 - 28, g.y0 - 10)}>
        {kind === 'cascade' ? 'cascade' : 'production'}
        <tspan fill={colors.MUTED} fontWeight={400} fontSize={13} fontFamily={MONO}>
          {kind === 'cascade' ? '  emitCascadeArgmax' : '  emitArgmax'}
        </tspan>
      </text>
      {example && (
        <text x={VAL_X + 94} y={g.y0 - 14} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={cardsU * fit(IDX_X - 8, VAL_X + 96, g.y0 - 28, g.y0 - 10)}>
          example scores
        </text>
      )}

      {/* cards */}
      {scores.map((v, i) => {
        const u = clamp01(cardsU * 10 - i);
        if (u <= 0.01) return null;
        const y = g.y0 + i * g.pitch;
        const cy = leafY(g, i);
        const isWinner = crownU > 0.5 && i === winner;
        const selected = i === winner ? 1 : 0;
        return (
          <g key={i} opacity={u * dimLeaf(i) * fit(IDX_X - 10, VAL_X + 96, y, y + g.cardH)} transform={`translate(${(1 - u) * -16} 0)`}>
            <text x={IDX_X} y={cy + 4.5} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              {i}
            </text>
            <rect x={BAR_X} y={y} width={BAR_W} height={g.cardH} rx={4} fill="none" stroke={colors.GRID} />
            <rect x={BAR_X} y={y + 3} width={Math.max(1, v * BAR_W)} height={g.cardH - 6} rx={3}
              fill={isWinner ? colors.POSITIVE : colors.TEXT} opacity={isWinner ? 0.9 : 0.5} />
            <text x={VAL_X} y={cy + 4.5} fill={isWinner ? colors.POSITIVE : colors.TEXT} fontSize={13} fontFamily={MONO}>
              {labels ? labels[i] : v.toFixed(2)}
            </text>
            {selU > 0.01 && <BitDisc x={SEL_X} y={cy} b={selected} r={Math.min(10, g.cardH / 2 + 1)} opacity={selU} />}
          </g>
        );
      })}

      {/* edges, travelling winners, nodes */}
      {linesU > 0.01 &&
        res.matches.map((row, round) =>
          row.map((mt) => {
            const u = clamp01(play - round);
            const nx = RX[round];
            const ny = nodeY(g, round, mt.m);
            const drawU = clamp01(linesU * 3 - round);
            const sides = [0, 1] as const;
            const resolved = clamp01((u - 0.45) / 0.25);
            return (
              <g key={`${round}-${mt.m}`} opacity={dimNode(round, mt.m) * fit(nx - g.r - 4, nx + g.r + 4, ny - g.r - 4, ny + g.r + 4)}>
                {sides.map((side) => {
                  const e = edge(g, round, mt.m, side);
                  const isWin = (side === 1) === (mt.rw === 1);
                  const stroke = isWin && resolved > 0 ? nodeColor : colors.MUTED;
                  const sop = isWin ? lerp(0.55, 1, resolved) : lerp(0.55, 0.22, resolved);
                  return (
                    <path key={side} d={e.d} fill="none" stroke={stroke} strokeWidth={isWin ? lerp(1.4, 2.4, resolved) : 1.4}
                      opacity={sop} strokeDasharray={`${e.len} ${e.len}`} strokeDashoffset={e.len * (1 - drawU)} />
                  );
                })}
                {u > 0 && u < 0.6 && (() => {
                  const e = edge(g, round, mt.m, mt.rw ? 1 : 0);
                  const [px, py] = e.at(smooth(u / 0.5));
                  return <circle cx={px} cy={py} r={5} fill={nodeColor} opacity={clamp01((0.6 - u) * 8)} />;
                })()}
                {drawU > 0.5 && (kind === 'cascade' ? (
                  <circle cx={nx} cy={ny} r={g.r} fill={colors.PANEL} stroke={nodeColor} strokeWidth={1.6} />
                ) : (
                  <rect x={nx - g.r} y={ny - g.r} width={2 * g.r} height={2 * g.r} rx={3} fill={colors.PANEL} stroke={nodeColor} strokeWidth={1.6} />
                ))}
                {resolved > 0.01 && (
                  <text x={nx} y={ny + 4.5} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700} opacity={resolved}>
                    {mt.rw}
                  </text>
                )}
              </g>
            );
          }),
        )}

      {/* the route */}
      {routeU > 0.01 &&
        routeEdges.map((e, k) => {
          const v = clamp01(routeU * 3 - k);
          return (
            <path key={k} d={e.rev} fill="none" stroke={colors.POSITIVE} strokeWidth={3.2} strokeLinecap="round"
              strokeDasharray={`${e.len} ${e.len}`} strokeDashoffset={e.len * (1 - v)} opacity={0.95} />
          );
        })}

      {/* crown */}
      {crownU > 0.01 && (
        <Chip x={RX[2] + g.r + 10} y={rootY + 5} text={`winner ${winner}`} color={kind === 'cascade' ? colors.POSITIVE : colors.SECONDARY}
          opacity={crownU * lerp(1, 0.15, focus) * fit(RX[2] + g.r + 10, RX[2] + g.r + 100, rootY - 18, rootY + 36)} />
      )}
      {tieU > 0.01 && (
        <text x={RX[2] + g.r + 10} y={rootY + 30} fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={tieU * fit(RX[2] + g.r + 10, RX[2] + g.r + 100, rootY - 18, rootY + 36)}>
          tie → left
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const id = IDS[Math.max(0, Math.min(IDS.length - 1, Math.round(s.get(scene.idIdx))))];

  const vecA = s.get(scene.vecA);
  const vecB = s.get(scene.vecB);
  const vi = vecB >= 0.5 ? 2 : vecA >= 0.5 ? 1 : 0;
  const scores = V_A.scores.map((v, i) => lerp(lerp(v, V_T.scores[i], vecA), V_P.scores[i], vecB));
  const morphing = (vecA > 0.001 && vecA < 0.999) || (vecB > 0.001 && vecB < 0.999);
  const labels = morphing ? null : VECS[vi].labels;

  const split = s.get(scene.split);
  const gC = lerpGeom(SOLO, SPLIT_C, split);
  const prodU = s.get(scene.prodU);
  const gP: Geom = { ...SPLIT_P, y0: SPLIT_P.y0 + 30 * (1 - prodU) };
  const dimU = s.get(scene.dimU);
  const bracketOp = lerp(1, 0.15, dimU);

  const anatS = s.get(scene.anatS);
  const anatOp = s.get(scene.anatOp);
  const oracleU = s.get(scene.oracleU);
  const prodCodeU = s.get(scene.prodCodeU);
  const bandS = s.get(scene.bandS);
  const bandOp = s.get(scene.bandOp);
  const diffU = s.get(scene.diffU);
  const resultU = s.get(scene.resultU);
  const tickerU = s.get(scene.tickerU);
  const tickU = s.get(scene.tickU);
  const stampU = s.get(scene.stampU);
  const rangeU = s.get(scene.rangeU);
  const perMatchU = s.get(scene.perMatchU);
  const chartU = s.get(scene.chartU);
  const flyU = s.get(scene.flyU);
  const solidU = s.get(scene.solidU);
  const layU = s.get(scene.layU);
  const scaleU = s.get(scene.scaleU);
  const row64U = s.get(scene.row64U);
  const op64 = s.get(scene.op64);
  const ratio8U = s.get(scene.ratio8U);
  const ratio64U = s.get(scene.ratio64U);
  const builtU = s.get(scene.builtU);
  const compU = s.get(scene.compU);
  const ratioCU = s.get(scene.ratioCU);
  const refU = s.get(scene.refU);
  const finalU = s.get(scene.finalU);

  // anything a camera push carries off the stage, up under the header, or down into the CC strip fades out first
  const fit: Fit = (x0, x1, y0, y1) => {
    const sx = (x: number) => (x - cam.x) * cam.k + STAGE_W / 2;
    const sy = (y: number) => (y - cam.y) * cam.k + STAGE_H / 2;
    const r = 8;
    return clamp01(sx(x0) / r) * clamp01((STAGE_W - sx(x1)) / r) * clamp01((sy(y0) - HEADER_H) / r) * clamp01((CC_Y - sy(y1)) / r);
  };
  const common = { fit, scores, labels, cardsU: s.get(scene.cardsU), linesU: s.get(scene.linesU), example: vi < 2 };

  // anatomy of match (0, 2): cards 4 and 5 of the example vector
  const L = V_A.scores[4];
  const R = V_A.scores[5];
  const rw = cascadeBit(L, R);
  const lw = 1 - rw;
  const row = (k: number) => clamp01(anatS - k) * anatOp;

  // cost chart scales
  const pxOp = lerp(PX8, PX64, smooth(scaleU));
  const pxLay = lerp(PXL8, PXL64, smooth(scaleU));
  const tileOp = 1 - solidU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the bracket(s) ======================== */}
        <Bracket g={gC} kind="cascade" res={RES_C[vi]} play={s.get(scene.playC)} op={bracketOp} focus={s.get(scene.focusU)}
          routeU={s.get(scene.routeU)} selU={s.get(scene.selU)} tieU={s.get(scene.tieC)} {...common} />
        <Bracket g={gP} kind="production" res={RES_P[vi]} play={s.get(scene.playP)} op={prodU * bracketOp * lerp(1, 0.1, diffU)} focus={0}
          routeU={0} selU={0} tieU={s.get(scene.tieP)} {...common} />

        {/* round labels (solo only) */}
        {common.linesU > 0.01 && split < 0.99 && (
          <g opacity={common.linesU * (1 - split) * bracketOp * lerp(1, 0.15, s.get(scene.focusU)) * fit(RX[0] - 30, RX[2] + 30, SOLO.y0 - 30, SOLO.y0 - 8)}>
            {['round 1', 'round 2', 'final'].map((t, k) => (
              <text key={t} x={RX[k]} y={SOLO.y0 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                {t}
              </text>
            ))}
          </g>
        )}

        {/* per-match cost labels (beat 8) */}
        {perMatchU > 0.01 && (
          <g opacity={perMatchU}>
            <text x={EDGE_X0} y={SPLIT_C.y0 - 14} fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
              {`7 matches × ${PER_MATCH_CASC} ops = ${COST[0].cascOps}`}
            </text>
            <text x={EDGE_X0} y={SPLIT_P.y0 - 14} fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
              {`7 matches × ${PER_MATCH_PROD} ops = ${COST[0].prodOps}`}
            </text>
          </g>
        )}

        {/* the planted difference (beat 5) */}
        {diffU > 0.01 && (
          <g opacity={diffU}>
            <line x1={BAR_X + BASE * BAR_W + 6} y1={leafY(SPLIT_C, 2)} x2={BAR_X + BASE * BAR_W + 6} y2={leafY(SPLIT_C, 6)}
              stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 3" />
            <text x={IDX_X - 8} y={354} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              card 6 − card 2 = 2**-24 ≈ 5.96e-8
            </text>
            <text x={IDX_X - 8} y={372} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
              the two bars are the same length on any screen
            </text>
          </g>
        )}

        {/* ======================== beat 2 · one match, opened up ======================== */}
        {anatS > 0.01 && anatOp > 0.01 && (
          <g>
            <text x={INS_X} y={132} fill={colors.MUTED} fontSize={15} fontFamily={UI} opacity={row(0)}>
              one match · card 4 on the left, card 5 on the right
            </text>
            <Box x={INS_X + 10} y={150} w={210} h={34} lines={[`left.score  ${V_A.labels[4]}`]} color={colors.MUTED} opacity={row(0)} />
            <Box x={INS_X + 250} y={150} w={210} h={34} lines={[`right.score  ${V_A.labels[5]}`]} color={colors.MUTED} opacity={row(0)} />
            <g opacity={row(1)}>
              <line x1={INS_X + 115} y1={184} x2={INS_X + 200} y2={208} stroke={colors.MUTED} strokeWidth={1.2} />
              <line x1={INS_X + 355} y1={184} x2={INS_X + 270} y2={208} stroke={colors.MUTED} strokeWidth={1.2} />
            </g>
            <Box x={INS_X + 60} y={208} w={350} h={46} lines={['exact sign cascade (chapter 1)', `rightWins = ${rw}`]} color={colors.WARM} opacity={row(1)} />
            <g opacity={row(2)}>
              <line x1={INS_X + 235} y1={254} x2={INS_X + 235} y2={274} stroke={colors.MUTED} strokeWidth={1.2} />
            </g>
            <Box x={INS_X + 60} y={274} w={350} h={34} lines={[`leftWins = 1 − rightWins = ${lw}`]} color={colors.WARM} opacity={row(2)} />
            <g opacity={row(3)}>
              <line x1={INS_X + 150} y1={308} x2={INS_X + 115} y2={330} stroke={colors.MUTED} strokeWidth={1.2} />
              <line x1={INS_X + 320} y1={308} x2={INS_X + 355} y2={330} stroke={colors.MUTED} strokeWidth={1.2} />
            </g>
            <Box x={INS_X + 10} y={330} w={210} h={48} lines={['leftPart', `${V_A.labels[4]} × ${lw} = 0`]} color={colors.TEAL} opacity={row(3)} />
            <Box x={INS_X + 250} y={330} w={210} h={48} lines={['rightPart', `${V_A.labels[5]} × ${rw} = ${V_A.labels[5]}`]} color={colors.TEAL} opacity={row(3)} />
            <text x={INS_X + 235} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={row(3)}>
              two gated products (reglu, gated by each bit)
            </text>
            <Box x={INS_X + 60} y={408} w={350} h={34} lines={[`score = leftPart + rightPart = ${V_A.labels[5]}`]} color={colors.POSITIVE} opacity={row(4)} />
            <text x={INS_X + 235} y={460} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={UI} opacity={row(4)}>
              ↑ rises to round 2
            </text>
            <g opacity={row(5)}>
              <text x={INS_X} y={498} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
                routeCascade, from the root down
              </text>
              <text x={INS_X + 10} y={524} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                leftRoute = route × leftWins
              </text>
              <text x={INS_X + 10} y={546} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                rightRoute = route − leftRoute
              </text>
              <text x={INS_X + 10} y={572} fill={colors.POSITIVE} fontSize={14} fontFamily={UI}>
                selected: a one-hot over the eight cards
              </text>
            </g>
          </g>
        )}

        {/* ======================== beat 3 · the oracle ======================== */}
        {oracleU > 0.01 && (
          <g opacity={oracleU}>
            <text x={INS_X} y={186} fill={colors.TEXT} fontSize={22} fontFamily={UI} fontWeight={600}>
              leftmost argmax
            </text>
            <text x={INS_X} y={212} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              the lab&apos;s test oracle, in plain code
            </text>
            <CodeChip x={INS_X} y={232} lines={C_ORACLE} />
            <text x={INS_X} y={420} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              strictly greater moves the winner; a tie keeps the earlier card
            </text>
            <text x={INS_X} y={444} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
              {`leftmostArgmax(scores) = ${leftmostArgmax(V_T.scores)}`}
            </text>
          </g>
        )}

        {/* ======================== beat 4 · production code ======================== */}
        {prodCodeU > 0.01 && (
          <g opacity={prodCodeU}>
            <text x={INS_X} y={150} fill={colors.SECONDARY} fontSize={15} fontFamily={UI} fontWeight={600}>
              production: scale the gap to near 0.5, then a boolean atom
            </text>
            <CodeChip x={INS_X} y={166} lines={C_PROD} stripe={colors.SECONDARY} />
            <text x={INS_X} y={330} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              at a tie the comparison is exactly the bias:
            </text>
            <text x={INS_X} y={354} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              {`${COMPARISON_BIAS} = 0.5 + 2**-24`}
            </text>
            <text x={INS_X} y={378} fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
              → leftWins = 1 · the tie goes left
            </text>
          </g>
        )}

        {/* ======================== beat 5 · the band ======================== */}
        {bandS > 0.01 && bandOp > 0.01 && (() => {
          const u0 = clamp01(bandS);
          const u1 = clamp01(bandS - 1);
          const u2 = clamp01(bandS - 2);
          const u3 = clamp01(bandS - 3);
          const YC = 262;
          const YP = 336;
          const YA = 392;
          const seg = (y: number, d0: number, d1: number, color: string, u: number, k: string) => (
            <rect key={k} x={gx(d0)} y={y - 5} width={Math.max(0, (gx(d1) - gx(d0)) * u)} height={10} rx={3} fill={color} />
          );
          return (
            <g opacity={bandOp}>
              <text x={INS_X} y={170} fill={colors.TEXT} fontSize={16} fontFamily={UI} fontWeight={600} opacity={u0}>
                who wins, by gap = right − left
              </text>
              {/* axis */}
              <g opacity={u0}>
                <line x1={gx(GAP_D0)} y1={YA} x2={gx(GAP_D1)} y2={YA} stroke={colors.MUTED} strokeWidth={1.2} />
                {[0, 1e-7, 2e-7, 3e-7].map((d) => (
                  <g key={d}>
                    <line x1={gx(d)} y1={YA - 5} x2={gx(d)} y2={YA + 5} stroke={colors.MUTED} />
                    <text x={gx(d)} y={YA + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {d === 0 ? '0' : `${d * 1e7}e-7`}
                    </text>
                  </g>
                ))}
                <line x1={gx(0)} y1={YC - 30} x2={gx(0)} y2={YA} stroke={colors.GRID} strokeDasharray="2 3" />
              </g>
              {/* cascade row */}
              <text x={INS_X} y={YC - 16} fill={colors.TEAL} fontSize={14} fontFamily={UI} opacity={u0}>
                cascade
              </text>
              {seg(YC, GAP_D0, 0, colors.MUTED, u0, 'cl')}
              {seg(YC, 0, GAP_D1, colors.TEAL, u0, 'cr')}
              {/* production row */}
              <text x={INS_X} y={YP - 16} fill={colors.SECONDARY} fontSize={14} fontFamily={UI} opacity={u1}>
                production
              </text>
              {seg(YP, GAP_D0, 0, colors.MUTED, u1, 'pl')}
              {seg(YP, 0, BAND_HEADER, colors.NEGATIVE, u1, 'pb')}
              {u1 >= 1 && seg(YP, BAND_HEADER, GAP_D1, colors.TEAL, 1, 'pr')}
              <circle cx={gx(0)} cy={YC} r={5} fill={colors.TEXT} opacity={u0} />
              <circle cx={gx(0)} cy={YP} r={5} fill={colors.TEXT} opacity={u1} />
              {/* the header's figure */}
              <g opacity={u2}>
                <rect x={gx(0)} y={YP - 22} width={gx(BAND_HEADER) - gx(0)} height={44} fill={colors.NEGATIVE} opacity={0.12} />
                <text x={(gx(0) + gx(BAND_HEADER)) / 2} y={YP - 28} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                  roughly 2.4e-7 (header)
                </text>
              </g>
              {/* the test's bound */}
              <g opacity={u3}>
                <line x1={gx(2.5e-7)} y1={YP - 26} x2={gx(2.5e-7)} y2={YA + 34} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="5 4" />
                <text x={gx(2.5e-7) + 6} y={YA + 50} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                  productionBandBound = 2.5e-7 (test)
                </text>
              </g>
              {/* legend */}
              <g opacity={u1}>
                <rect x={INS_X} y={474} width={18} height={10} rx={3} fill={colors.MUTED} />
                <text x={INS_X + 26} y={484} fill={colors.TEXT} fontSize={13} fontFamily={UI}>left wins (tie, or left larger)</text>
                <rect x={INS_X} y={496} width={18} height={10} rx={3} fill={colors.TEAL} />
                <text x={INS_X + 26} y={506} fill={colors.TEXT} fontSize={13} fontFamily={UI}>right wins</text>
                <rect x={INS_X} y={518} width={18} height={10} rx={3} fill={colors.NEGATIVE} />
                <text x={INS_X + 26} y={528} fill={colors.TEXT} fontSize={13} fontFamily={UI}>left kept although right is larger</text>
                <text x={INS_X} y={554} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  band edge schematic, drawn at the lab&apos;s own figure
                </text>
              </g>
            </g>
          );
        })()}

        {/* ======================== beat 6 · the verdict ======================== */}
        {resultU > 0.01 && (
          <g opacity={resultU}>
            <text x={INS_X + 236} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontFamily={MONO} fontWeight={600}>
              {`production: ${RES_P[2].winner}, cascade: ${RES_C[2].winner}`}
            </text>
            <text x={INS_X + 236} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              {`leftmostArgmax(scores) = ${leftmostArgmax(V_P.scores)}`}
            </text>
            <text x={INS_X + 236} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              cascade-argmax.test.ts, both evaluators
            </text>
          </g>
        )}

        {/* ======================== beats 7–8 · the test evidence ======================== */}
        {tickerU > 0.01 && (() => {
          const rowsU = (k: number) => clamp01(tickU * 6 - k);
          const Y = [196, 244, 300];
          return (
            <g opacity={tickerU}>
              <text x={INS_X} y={152} fill={colors.TEXT} fontSize={16} fontFamily={UI} fontWeight={600}>
                what the tests run · reference and tensor evaluators
              </text>
              {[
                { label: `exact ties at ${TIE_VALUES.length} magnitudes, 0 to 1`, n: TIE_VALUES.length, sub: 'incl. 2**-149, the smallest subnormal' },
                { label: `adversarial pairs: ${ADV_BASES.length} bases × 0–16 float steps`, n: ADV_PAIRS, sub: 'subnormal gaps, adjacent floats, both orders' },
              ].map((r, k) => {
                const u = rowsU(k);
                return (
                  <g key={k} opacity={clamp01(u * 3)}>
                    <text x={INS_X} y={Y[k]} fill={colors.TEXT} fontSize={14} fontFamily={UI}>{r.label}</text>
                    <text x={INS_X} y={Y[k] + 20} fill={colors.MUTED} fontSize={13} fontFamily={UI}>{r.sub}</text>
                    <text x={1190} y={Y[k]} textAnchor="end" fill={colors.WARM} fontSize={15} fontFamily={MONO}>{fmtInt(r.n * u)}</text>
                    <Tick x={1210} y={Y[k] - 5} opacity={u >= 1 ? 1 : 0} />
                  </g>
                );
              })}
              <text x={INS_X} y={Y[2]} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={clamp01(rowsU(2) * 3)}>
                random vectors (a quarter with a planted tie)
              </text>
              {RANDOM_WIDTHS.map((w, k) => {
                const u = rowsU(2 + k * 0.75);
                const y = Y[2] + 26 + k * 26;
                return (
                  <g key={w} opacity={clamp01(u * 3)}>
                    <text x={INS_X + 10} y={y + 5} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>{`width ${w}`}</text>
                    <rect x={INS_X + 100} y={y - 5} width={260} height={10} rx={3} fill="none" stroke={colors.GRID} />
                    <rect x={INS_X + 100} y={y - 5} width={260 * u} height={10} rx={3} fill={colors.TEAL} opacity={0.75} />
                    <text x={1190} y={y + 5} textAnchor="end" fill={colors.WARM} fontSize={15} fontFamily={MONO}>{fmtInt(RANDOM_TRIALS * u)}</text>
                    <Tick x={1210} y={y} opacity={u >= 1 ? 1 : 0} />
                  </g>
                );
              })}
              <Chip x={INS_X} y={448} text="reference == tensor · both trees" color={colors.POSITIVE} opacity={clamp01(rowsU(5) * 2)} fs={14} />
              {/* sampled, not proven */}
              {stampU > 0.01 && (
                <g opacity={clamp01(stampU)} transform={`translate(${INS_X + 236} 496) rotate(-3) scale(${0.85 + 0.15 * stampU})`}>
                  <rect x={-170} y={-24} width={340} height={44} rx={6} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.4} />
                  <text x={0} y={8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={24} fontFamily={UI} fontWeight={700} letterSpacing={1}>
                    sampled, not proven
                  </text>
                </g>
              )}
              {/* the assumed range */}
              {rangeU > 0.01 && (
                <g opacity={rangeU}>
                  <text x={INS_X} y={552} fill={colors.TEXT} fontSize={14} fontFamily={UI}>assumed score range</text>
                  <line x1={INS_X + 160} y1={548} x2={INS_X + 160 + 280 * rangeU} y2={548} stroke={colors.WARM} strokeWidth={6} strokeLinecap="round" />
                  <text x={INS_X + 160} y={574} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>0</text>
                  <text x={INS_X + 440} y={574} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>1</text>
                  <text x={INS_X} y={600} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    &apos;argmax scores must be within zero and one&apos;
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* ======================== beats 9–12 · the cost chart ======================== */}
        {chartU > 0.01 && (() => {
          const row8 = (y: number, label: string, color: string) => (
            <text x={ROW_X} y={y + BAR_H / 2 + 4.5} fill={color} fontSize={13} fontFamily={MONO}>{label}</text>
          );
          const landed = clamp01((flyU - 0.92) / 0.08);
          const opsBar = (y: number, ops: number, color: string, op: number, grow = 1, h = BAR_H) => (
            <g opacity={op}>
              <rect x={BAR0} y={y} width={Math.max(1, ops * pxOp * grow)} height={h} rx={2} fill={color} opacity={0.85} />
              <text x={BAR0 + ops * pxOp * grow + 8} y={y + h / 2 + 4.5} fill={color} fontSize={13} fontFamily={MONO}>{fmtInt(ops)}</text>
            </g>
          );
          return (
            <g opacity={chartU}>
              <text x={ROW_X} y={OPS_Y.title} fill={colors.TEXT} fontSize={15} fontFamily={UI} fontWeight={600}>
                operations
                <tspan fill={builtU > 0.01 ? colors.WARM : colors.MUTED} fontWeight={builtU > 0.5 ? 700 : 400}>{' (built)'}</tspan>
              </text>
              {row8(OPS_Y.r0, '8 · production', colors.SECONDARY)}
              {row8(OPS_Y.r1, '8 · cascade', colors.TEAL)}
              <g opacity={row64U * op64}>
                {row8(OPS_Y.r2, '64 · production', colors.SECONDARY)}
                {row8(OPS_Y.r3, '64 · cascade', colors.TEAL)}
              </g>
              <line x1={BAR0 - 4} y1={OPS_Y.r0 - 6} x2={BAR0 - 4} y2={OPS_Y.r3 + BAR_H + 4} stroke={colors.GRID} />
              {/* solid bars (after the tiles land) */}
              {solidU > 0.01 && (
                <g opacity={solidU}>
                  {opsBar(OPS_Y.r0, COST[0].prodOps, colors.SECONDARY, 1)}
                  {opsBar(OPS_Y.r1, COST[0].cascOps, colors.TEAL, 1)}
                </g>
              )}
              {row64U > 0.01 && (
                <g>
                  {opsBar(OPS_Y.r2, COST[1].prodOps, colors.SECONDARY, op64, smooth(row64U))}
                  {opsBar(OPS_Y.r3, COST[1].cascOps, colors.TEAL, op64, smooth(row64U))}
                </g>
              )}
              {/* tile totals while tiles are the bars */}
              {tileOp > 0.01 && landed > 0.01 && (
                <g opacity={landed * tileOp}>
                  <text x={BAR0 + COST[0].prodOps * PX8 + 8} y={OPS_Y.r0 + BAR_H / 2 + 4.5} fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>{COST[0].prodOps}</text>
                  <text x={BAR0 + COST[0].cascOps * PX8 + 8} y={OPS_Y.r1 + BAR_H / 2 + 4.5} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>{COST[0].cascOps}</text>
                </g>
              )}
              {/* compiled */}
              {compU > 0.01 && (
                <g opacity={compU}>
                  <rect x={BAR0} y={OPS_Y.c0} width={COMPILED_PROD * pxOp * smooth(compU)} height={9} rx={2} fill={colors.SECONDARY} opacity={0.55} />
                  <rect x={BAR0} y={OPS_Y.c1} width={COMPILED_CASC * pxOp * smooth(compU)} height={9} rx={2} fill={colors.TEAL} opacity={0.55} />
                  <text x={BAR0 + COMPILED_PROD * pxOp + 8} y={OPS_Y.c0 + 9} fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>{`${COMPILED_PROD} compiled`}</text>
                  <text x={BAR0 + COMPILED_CASC * pxOp + 8} y={OPS_Y.c1 + 9} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>{`${COMPILED_CASC} compiled`}</text>
                </g>
              )}
              <Chip x={1222} y={OPS_Y.title} anchor="end" text={`${COST[0].cascOps} / ${COST[0].prodOps} = ${RATIO_BUILT}×`} color={colors.WARM} opacity={ratio8U} />
              <Chip x={1222} y={OPS_Y.title} anchor="end" text={`${COST[1].cascOps} / ${COST[1].prodOps} = ${COST[1].cascOps / COST[1].prodOps}×`} color={colors.WARM} opacity={ratio64U} />
              <Chip x={1222} y={OPS_Y.title} anchor="end" text={`compiled ${COMPILED_CASC} / ${COMPILED_PROD} ≈ ${RATIO_COMPILED.toFixed(1)}×`} color={colors.WARM} opacity={ratioCU} />

              {/* layers */}
              <g opacity={clamp01(layU * 3)}>
                <text x={ROW_X} y={LAY_Y.title} fill={colors.TEXT} fontSize={15} fontFamily={UI} fontWeight={600}>
                  layers
                  <tspan fill={builtU > 0.01 ? colors.WARM : colors.MUTED} fontWeight={builtU > 0.5 ? 700 : 400}>{' (built)'}</tspan>
                </text>
                <line x1={BAR0 - 4} y1={LAY_Y.rows[0] - 6} x2={BAR0 - 4} y2={LAY_Y.rows[3] + LAY_Y.h + 4} stroke={colors.GRID} />
                {[
                  { y: LAY_Y.rows[0], v: COST[0].prodLayers, c: colors.SECONDARY, l: '8 · production', op: 1, g: smooth(layU) },
                  { y: LAY_Y.rows[1], v: COST[0].cascLayers, c: colors.TEAL, l: '8 · cascade', op: 1, g: smooth(layU) },
                  { y: LAY_Y.rows[2], v: COST[1].prodLayers, c: colors.SECONDARY, l: '64 · production', op: row64U * op64, g: smooth(row64U) },
                  { y: LAY_Y.rows[3], v: COST[1].cascLayers, c: colors.TEAL, l: '64 · cascade', op: row64U * op64, g: smooth(row64U) },
                ].map((r) =>
                  r.op > 0.01 ? (
                    <g key={r.l} opacity={r.op}>
                      <text x={ROW_X} y={r.y + LAY_Y.h / 2 + 4.5} fill={r.c} fontSize={13} fontFamily={MONO}>{r.l}</text>
                      <rect x={BAR0} y={r.y} width={Math.max(1, r.v * pxLay * r.g)} height={LAY_Y.h} rx={2} fill={r.c} opacity={0.6} />
                      <text x={BAR0 + r.v * pxLay * r.g + 8} y={r.y + LAY_Y.h / 2 + 4.5} fill={r.c} fontSize={13} fontFamily={MONO}>{r.v}</text>
                    </g>
                  ) : null,
                )}
              </g>

              {/* the core's own exact tree */}
              {refU > 0.01 && (
                <g opacity={clamp01(refU * 2)}>
                  <line x1={BAR0 + CORE_TREE.ops * pxOp} y1={OPS_Y.r0 - 8} x2={BAR0 + CORE_TREE.ops * pxOp}
                    y2={OPS_Y.r0 - 8 + (OPS_Y.c1 + 16 - OPS_Y.r0) * refU} stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="5 4" />
                  <line x1={BAR0 + CORE_TREE.layers * pxLay} y1={LAY_Y.rows[0] - 8} x2={BAR0 + CORE_TREE.layers * pxLay}
                    y2={LAY_Y.rows[0] - 8 + (LAY_Y.rows[1] + LAY_Y.h + 16 - LAY_Y.rows[0]) * refU} stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="5 4" />
                  <text x={BAR0 + CORE_TREE.ops * pxOp} y={OPS_Y.c1 + 34} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                    {`${CORE_TREE.ops} ops`}
                  </text>
                  <text x={BAR0 + CORE_TREE.layers * pxLay} y={LAY_Y.rows[1] + LAY_Y.h + 34} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                    {`${CORE_TREE.layers} layers`}
                  </text>
                  <text x={ROW_X} y={OPS_Y.c1 + 34} fill={colors.WARM} fontSize={13} fontFamily={UI}>
                    core exact tree, compiled
                  </text>
                  <text x={ROW_X} y={LAY_Y.rows[1] + LAY_Y.h + 34} fill={colors.WARM} fontSize={13} fontFamily={UI}>
                    core exact tree, compiled
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* operation tiles: seven matches per bracket shed their ops into the bars */}
        {flyU > 0.001 && tileOp > 0.01 && (
          <g opacity={tileOp}>
            {(
              [
                { g: SPLIT_C, n: COST[0].cascOps, per: PER_MATCH_CASC, y: OPS_Y.r1, color: colors.TEAL },
                { g: SPLIT_P, n: COST[0].prodOps, per: PER_MATCH_PROD, y: OPS_Y.r0, color: colors.SECONDARY },
              ] as const
            ).map((b, bi) =>
              Array.from({ length: b.n }, (_, j) => {
                const start = (j / b.n) * 0.62;
                const u = smooth((flyU - start) / 0.3);
                if (u <= 0) return null;
                const [round, m] = MATCH_ID[Math.floor(j / b.per)];
                const sx = RX[round] + ((j % 4) - 1.5) * 4;
                const sy = nodeY(b.g, round, m) + ((Math.floor(j / 4) % 3) - 1) * 4;
                const tx = BAR0 + Math.floor(j / TILE_ROWS) * TILE_PITCH;
                const ty = b.y + (j % TILE_ROWS) * TILE_PITCH;
                const x = lerp(sx, tx, u);
                const y = lerp(sy, ty, u) - Math.sin(Math.PI * u) * 46;
                return <rect key={`${bi}-${j}`} x={x} y={y} width={TILE} height={TILE} rx={1} fill={b.color} opacity={0.4 + 0.5 * u} />;
              }),
            )}
          </g>
        )}

        {/* closing statement */}
        {finalU > 0.01 && (
          <g opacity={finalU}>
            <rect x={ROW_X - 6} y={530} width={472} height={66} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={ROW_X + 230} y={558} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={UI} fontWeight={600}>
              an available construction,
            </text>
            <text x={ROW_X + 230} y={581} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={UI} fontWeight={600}>
              not a proof of minimality
            </text>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: title, identifier chip ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · Eight Candidates, One Winner
      </text>
      <g>
        <rect x={40} y={48} width={id.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
          {id}
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
