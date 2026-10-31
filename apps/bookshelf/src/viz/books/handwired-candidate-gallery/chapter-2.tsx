// The Worst Gauge Wins
//
// Three Layouts (handwired-candidate-gallery) — chapter 2. Source pin:
// chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT, Cheng Lou), lab/candidate-gallery
//   lab/candidate-gallery/candidate-gallery.ts:147-153 (clampQuality, scaledQuality: min(unit, size·scale)),
//     155-163 (bottleneck: an emitMinimum fold), 165-206 (Contact cells; no hero), 208-254 (Cinema: rail, hero,
//     thumbnails, four gauges), 256-322 (Story: hero height min(0.72W, 0.58H), thumbnails, four gauges),
//     324-326 (scores → emitArgmax), 400-414 (gap 14, rail maximum 280, the seven scale constants)
//   lab/candidate-gallery/candidate-gallery.test.ts:31-43 (1400×680 Cinema, 984×730 Contact, 610×830 Story),
//     45-52 (760×517 Contact, 600×517 Story)
//   src/runtime/numeric-ui-core.ts:1955-1963 (emitMinimum = a − relu(a − b)), 2710-2762 (emitArgmax: pairwise
//     tournament, comparisonScale 0.4999999403953552, comparisonBias 0.5000000596046448, assumeOneHot)
//   lab/status.md:170 (exact ties go left); research probe for the 1280×800 three-way tie
//   Fact-check: docs/book-plans/handwired-candidate-gallery/review.md (every chapter-2 visual number OK)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim).
//
// The visual machine is one gauge board that is a pure function of the stage size (W, H): every thermometer,
// waterline, score bar, comparison, bracket bit and one-hot cell on screen is evaluated each frame by a port of
// the lab's own formulas (`evalStage` below), so dragging the stage re-fills the whole board. The module checks
// the port against the plan's verified score table and the tests' winners and throws if they ever disagree.
// The score-versus-width sweep in the last beat is sampled from the same function at H = 517.
import { CAMERA_HOME, Camera, MathLabel, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px

// ---------------------------------------------------------------------------
// The lab's formulas (candidate-gallery.ts:147-326, numeric-ui-core.ts:2710-2762), exact
// ---------------------------------------------------------------------------

const GAP = 14;
const RAIL_MAX = 280;
const relu = (x: number): number => Math.max(0, x);
const quality = (size: number, target: number): number => Math.min(1, size * (1 / target));

type Gauge = { name: string; target: number };
const LAYOUTS: { name: string; color: string; gauges: Gauge[] }[] = [
  {
    name: 'Cinema',
    color: colors.SECONDARY,
    gauges: [
      { name: 'hero w', target: 900 },
      { name: 'hero h', target: 560 },
      { name: 'thumb w', target: 90 },
      { name: 'thumb h', target: 90 },
    ],
  },
  {
    name: 'Contact',
    color: '#38bdf8',
    gauges: [
      { name: 'cell w', target: 240 },
      { name: 'cell h', target: 240 },
    ],
  },
  {
    name: 'Story',
    color: colors.WARM,
    gauges: [
      { name: 'hero w', target: 560 },
      { name: 'hero h', target: 440 },
      { name: 'thumb w', target: 60 },
      { name: 'thumb h', target: 60 },
    ],
  },
];

const COMPARISON_SCALE = 0.4999999403953552;
const COMPARISON_BIAS = 0.5000000596046448;

type Rect = [number, number, number, number]; // left top width height
type StageEval = {
  sizes: number[][];
  gauges: number[][];
  scores: number[];
  c1: number;
  bit1: number; // 1 = Cinema beats Contact
  survivor: number; // layout index of match 1's winner
  c2: number;
  bit2: number; // 1 = survivor beats Story
  selected: number[];
  winner: number;
  rects: Rect[][]; // per layout: [hero?, ...12 thumbnails]
};

function evalStage(W: number, H: number): StageEval {
  // Cinema
  const rail = Math.min(RAIL_MAX, 0.28 * W);
  const cHeroW = relu(W - rail - 3 * GAP);
  const cHeroH = relu(H - 2 * GAP);
  const cThumbW = relu(0.5 * rail - 0.5 * GAP);
  const cThumbH = relu(H / 6 - (7 / 6) * GAP);
  const railLeft = GAP + cHeroW + GAP;
  // Contact
  const cellW = relu(W - 5 * GAP) / 4;
  const cellH = relu(H - 4 * GAP) / 3;
  // Story
  const sHeroH = Math.min(0.72 * W, 0.58 * H);
  const sHeroW = relu(W - 2 * GAP);
  const sThumbW = relu(W / 3 - (4 / 3) * GAP);
  const sThumbH = relu(H / 4 - sHeroH / 4 - (6 / 4) * GAP);
  const sRegionTop = sHeroH + 2 * GAP;

  const sizes = [
    [cHeroW, cHeroH, cThumbW, cThumbH],
    [cellW, cellH],
    [sHeroW, sHeroH, sThumbW, sThumbH],
  ];
  const gauges = sizes.map((row, l) => row.map((s, k) => quality(s, LAYOUTS[l].gauges[k].target)));
  const scores = gauges.map((g) => g.reduce((m, v) => Math.min(m, v)));

  const compare = (l: number, r: number): number => COMPARISON_SCALE * l - COMPARISON_SCALE * r + COMPARISON_BIAS;
  const c1 = compare(scores[0], scores[1]);
  const bit1 = Math.round(c1) >= 1 ? 1 : 0;
  const survivor = bit1 ? 0 : 1;
  const c2 = compare(scores[survivor], scores[2]);
  const bit2 = Math.round(c2) >= 1 ? 1 : 0;
  const selected = [bit2 * bit1, bit2 * (1 - bit1), 1 - bit2];
  const winner = selected.indexOf(1);

  const ids = Array.from({ length: 12 }, (_, i) => i);
  const rects: Rect[][] = [
    [
      [GAP, GAP, cHeroW, cHeroH],
      ...ids.map((s): Rect => [railLeft + (s % 2) * (cThumbW + GAP), GAP + Math.floor(s / 2) * (cThumbH + GAP), cThumbW, cThumbH]),
    ],
    ids.map((i): Rect => [GAP + (i % 4) * (cellW + GAP), GAP + Math.floor(i / 4) * (cellH + GAP), cellW, cellH]),
    [
      [GAP, GAP, sHeroW, sHeroH],
      ...ids.map((s): Rect => [GAP + (s % 3) * (sThumbW + GAP), sRegionTop + Math.floor(s / 3) * (sThumbH + GAP), sThumbW, sThumbH]),
    ],
  ];
  return { sizes, gauges, scores, c1, bit1, survivor, c2, bit2, selected, winner, rects };
}

// The plan's verified table (plan.md "Verified numbers") and the tests' winners: the port must agree.
const PRESETS = {
  wide: [1400, 680],
  mid: [984, 730],
  tall: [610, 830],
  flipA: [760, 517],
  flipB: [600, 517],
  tie: [1280, 800],
} as const;
const VERIFIED: [keyof typeof PRESETS, number[], number][] = [
  ['wide', [1, 0.8667, 0.84], 0],
  ['mid', [0.7405, 0.9361, 0.9275], 1],
  ['tall', [0.4413, 0.5625, 0.9982], 2],
  ['flipA', [0.5613, 0.6403, 0.5548], 1],
  ['flipB', [0.4333, 0.5521, 0.5548], 2],
  ['tie', [1, 1, 1], 0],
];
for (const [key, want, win] of VERIFIED) {
  const [pw, ph] = PRESETS[key];
  const e = evalStage(pw, ph);
  if (e.winner !== win || e.scores.some((s, i) => Math.abs(s - want[i]) > 5e-5)) {
    throw new Error(`candidate-gallery ch2: the port disagrees with the verified table at ${PRESETS[key].join('×')}`);
  }
}

const E_WIDE = evalStage(...PRESETS.wide);
const E_MID = evalStage(...PRESETS.mid);
const E_TALL = evalStage(...PRESETS.tall);
const f1 = (v: number): string => v.toFixed(1).replace(/\.0$/, '');
const f4 = (v: number): string => v.toFixed(4);
/** gauge readout: 1 when full; else two decimals, or three when two would round up to 1 */
const fGauge = (v: number): string => (v >= 1 - 1e-9 ? '1' : v.toFixed(2) === '1.00' ? v.toFixed(3) : v.toFixed(2));
/** score readout: 1 when full, else four decimals */
const fScore = (v: number): string => (v >= 1 - 1e-9 ? '1' : f4(v));
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// beat readouts, from the port at the preset the beat shows
const TEX_GAUGE = '\\text{gauge}=\\min\\!\\left(1,\\ \\text{size}\\times\\text{scale}\\right)';
const TEX_SCALE = '\\text{scale}=\\dfrac{1}{\\text{target}}';
const TEX_CONTACT = `\\tfrac{${f1(E_WIDE.sizes[1][1])}}{240}=${f4(E_WIDE.gauges[1][1])}\\qquad \\tfrac{${f1(E_WIDE.sizes[1][0])}}{240}\\to 1`;
const TEX_STORY = `\\text{Story thumb h: }\\tfrac{${f1(E_WIDE.sizes[2][3])}}{60}=${f4(E_WIDE.gauges[2][3])}`;
const TEX_MIN = '\\text{score}=\\min(\\ldots),\\qquad \\min(a,b)=a-\\mathrm{relu}(a-b)';
const TEX_COMPARE = 'c=0.4999999\\,\\ell-0.4999999\\,r+0.5000001';
const TEX_CINEMA = `\\text{Cinema hero w: }\\tfrac{${f1(E_MID.sizes[0][0])}}{900}=${f4(E_MID.gauges[0][0])}`;
const TEX_CELL = `\\text{cell w: }\\tfrac{${f1(E_TALL.sizes[1][0])}}{240}=${f4(E_TALL.gauges[1][0])}\\qquad \\text{cell h: }\\tfrac{${f1(E_TALL.sizes[1][1])}}{240}\\to 1`;
const TEX_HERO = `\\text{Story hero h: }\\tfrac{${f1(E_TALL.sizes[2][1])}}{440}=${f4(E_TALL.gauges[2][1])}`;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const TUBE_TOP = 250;
const TUBE_BASE = 490;
const TUBE_H = TUBE_BASE - TUBE_TOP; // 240: Contact's thermometers are drawn 1:1 with its 240 px target
const TUBE_W = 22;
const PITCH = 52;
const GROUP_X = [70, 322, 470]; // left edge of each layout's gauge group
const groupW = (l: number): number => LAYOUTS[l].gauges.length * PITCH;
const tubeX = (l: number, k: number): number => GROUP_X[l] + PITCH / 2 + k * PITCH;
const groupMid = (l: number): number => GROUP_X[l] + groupW(l) / 2;
const levelY = (v: number): number => TUBE_BASE - TUBE_H * v;
const HEAD_Y = 186;
const BOARD_MID = (GROUP_X[0] + GROUP_X[2] + groupW(2)) / 2;

// right panel: score rail, bracket, one-hot
const RP = 730;
const ROW_Y = [236, 304, 372];
const BAR_X = 830;
const BAR_W = 200;
const NODE1 = { x: 1150, y: (ROW_Y[0] + ROW_Y[1]) / 2 };
const NODE2 = { x: 1205, y: (NODE1.y + ROW_Y[2]) / 2 };
const MATCH_Y = [436, 470];
const TRACK = { x0: 900, x1: 1040 };
const ONEHOT = { x: 892, y: 528, w: 46, h: 30, pitch: 60 };

// the closing sweep: score vs width at H = 517
const PLOT = { x0: 96, x1: 640, y0: 470, y1: 236, w0: 540, w1: 1300, s0: 0.35, s1: 0.85 };
const px = (w: number): number => PLOT.x0 + ((w - PLOT.w0) / (PLOT.w1 - PLOT.w0)) * (PLOT.x1 - PLOT.x0);
const py = (s: number): number => PLOT.y0 + ((s - PLOT.s0) / (PLOT.s1 - PLOT.s0)) * (PLOT.y1 - PLOT.y0);
const SWEEP_H = 517;
const SWEEP = Array.from({ length: 191 }, (_, i) => {
  const w = PLOT.w0 + (i * (PLOT.w1 - PLOT.w0)) / 190;
  const e = evalStage(w, SWEEP_H);
  return { w, scores: e.scores, winner: e.winner };
});
const CURVES = [0, 1, 2].map((l) => SWEEP.map((p) => `${px(p.w).toFixed(1)},${py(p.scores[l]).toFixed(1)}`));
const BANDS = (() => {
  const out: { a: number; b: number; winner: number }[] = [];
  SWEEP.forEach((p, i) => {
    const last = out[out.length - 1];
    if (last && last.winner === p.winner) last.b = p.w;
    else out.push({ a: i === 0 ? p.w : (SWEEP[i - 1].w + p.w) / 2, b: p.w, winner: p.winner });
  });
  return out;
})();

// stage-frame indicator in the header (screen space), 1/14 scale
const MINI = { x: 1132, y: 10, s: 1 / 14 };

const CAM_CONTACT: CameraState = { x: 420, y: 360, k: 1.35 };
const CAM_BOARD: CameraState = { x: 640, y: 372, k: 1.0 };
const CAM_PANEL: CameraState = { x: 985, y: 372, k: 1.18 };

const CHIPS = [
  'scaledQuality(size, scale) = min(unit, size · scale)',
  'contactCellScale = 1 / 240',
  'cinemaThumbnailScale = 1 / 90 · storyThumbnailScale = 1 / 60',
  'bottleneck([...]) → emitMinimum fold · assumeRange(0, 1)',
  'emitArgmax(circuit, scores, unit) · comparisonBias 0.5000000596046448',
  'selectedLayout = [1, 0, 0] · winningScore = 1',
  'cinemaHeroWidthScale = 1 / 900',
  'contactCellScale = 1 / 240',
  'storyHeroHeightScale = 1 / 440',
  '760×517 → Contact · 600×517 → Story · 1280×800 → Cinema',
];

// ---------------------------------------------------------------------------
// Timeline — ten fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CONTACT, cameraInterp);
  const chip = tl.channel('chip', 0);
  const W = tl.channel('W', PRESETS.wide[0]);
  const H = tl.channel('H', PRESETS.wide[1]);

  // the board
  const headU = tl.channel('headU', 0);
  const fillConH = tl.channel('fillConH', 0);
  const fillConW = tl.channel('fillConW', 0);
  const fillCin = tl.channel('fillCin', 0);
  const fillSto = tl.channel('fillSto', 0);
  const ghostU = tl.channel('ghostU', 0); // the uncapped size above the tick (Contact cell w)
  const dimU = tl.channel('dimU', 0); // the 208 px / 240 px dimension marks
  const opCin = tl.channel('opCin', 1);
  const opCon = tl.channel('opCon', 1);
  const opSto = tl.channel('opSto', 1);
  const spot = tl.channel('spot', -1); // gauge id l*4+k of the spotlit thermometer
  const spotU = tl.channel('spotU', 0);
  const waterU = tl.channel('waterU', 0); // 0..3: the min fold sweeps each column in turn
  const boardOp = tl.channel('boardOp', 1);
  // readouts
  const rGauge = tl.channel('rGauge', 0);
  const rContact = tl.channel('rContact', 0);
  const rStory = tl.channel('rStory', 0);
  const rMin = tl.channel('rMin', 0);
  const rCinema = tl.channel('rCinema', 0);
  const rCell = tl.channel('rCell', 0);
  const rHero = tl.channel('rHero', 0);
  // right panel
  const railU = tl.channel('railU', 0); // 0..3 score bars grow in turn
  const cmpTex = tl.channel('cmpTex', 0);
  const m1U = tl.channel('m1U', 0);
  const m2U = tl.channel('m2U', 0);
  const biasU = tl.channel('biasU', 0);
  const oneU = tl.channel('oneU', 0);
  const winU = tl.channel('winU', 0);
  const panelOp = tl.channel('panelOp', 1);
  // the sweep
  const plotU = tl.channel('plotU', 0);
  const curveU = tl.channel('curveU', 0);
  const flipU = tl.channel('flipU', 0);
  const tieU = tl.channel('tieU', 0);

  const caps = [
    { at: 0.4, dur: 11.6 },
    { at: 12.6, dur: 9.4 },
    { at: 22.6, dur: 9.4 },
    { at: 32.6, dur: 11.2 },
    { at: 44.4, dur: 12.4 },
    { at: 57.4, dur: 12.0 },
    { at: 70.0, dur: 12.4 },
    { at: 83.0, dur: 10.0 },
    { at: 93.6, dur: 8.6 },
    { at: 102.8, dur: 14.0 },
  ];
  caps.forEach((c, i) => tl.set(chip, i, Math.max(0, c.at - 0.1)));

  // — B1 · one gauge: size × (1 / target), capped at 1 —
  tl.caption({ ...caps[0], text: 'A layout is good when its pieces are big enough to see. Each size gets a gauge: the size times a scale, one over a target size, capped at 1.' });
  tl.tween(headU, 1, { at: 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(rGauge, 1, { at: 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(fillConH, 1, { at: 3.4, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 4.6, dur: 0.8, ease: ease.enter });
  tl.hold(12.0, 0.6);

  // — B2 · Contact: width full (capped), height 208 / 240 —
  tl.caption({ ...caps[1], text: 'A Contact cell targets 240 pixels. At 1,400 by 680 its width gauge is full, but its 208 pixel height reads 0.87.' });
  tl.tween(rGauge, 0, { at: 12.6, dur: 0.5, ease: ease.move });
  tl.tween(rContact, 1, { at: 13.0, dur: 0.6, ease: ease.enter });
  tl.tween(ghostU, 1, { at: 14.6, dur: 0.5, ease: ease.enter });
  tl.tween(fillConW, 1, { at: 14.6, dur: 1.2, ease: ease.move });
  tl.set(spot, 4 + 1, 18.0);
  tl.tween(spotU, 1, { at: 18.0, dur: 0.6, ease: ease.enter });
  tl.hold(22.0, 0.6);

  // — B3 · the whole board at 1400 × 680 —
  tl.caption({ ...caps[2], text: "Cinema's four gauges all read 1 there. Story's thumbnails are 50 tall against a target of 60, so its weakest gauge reads 0.84." });
  tl.tween(cam, CAM_BOARD, { at: 22.6, dur: 1.4, ease: ease.move });
  tl.tween(spotU, 0, { at: 22.6, dur: 0.5, ease: ease.move });
  tl.tween(rContact, 0, { at: 22.6, dur: 0.5, ease: ease.move });
  tl.tween(ghostU, 0, { at: 22.6, dur: 0.5, ease: ease.move });
  tl.tween(dimU, 0, { at: 22.6, dur: 0.5, ease: ease.move });
  tl.tween(opCon, 0.15, { at: 22.8, dur: 0.6, ease: ease.move });
  tl.tween(fillCin, 1, { at: 23.4, dur: 1.4, ease: ease.move });
  tl.tween(opCin, 0.35, { at: 26.6, dur: 0.6, ease: ease.move });
  tl.tween(fillSto, 1, { at: 26.8, dur: 1.4, ease: ease.move });
  tl.set(spot, 8 + 3, 28.6);
  tl.tween(spotU, 1, { at: 28.6, dur: 0.6, ease: ease.enter });
  tl.tween(rStory, 1, { at: 28.8, dur: 0.6, ease: ease.enter });
  tl.hold(32.0, 0.6);

  // — B4 · the worst gauge is the score: a min fold, a − relu(a − b) —
  tl.caption({ ...caps[3], text: 'A layout is only as good as its worst gauge, so its score is the smallest one. A minimum is the smaller number minus a relu of the difference.' });
  tl.tween(spotU, 0, { at: 32.6, dur: 0.5, ease: ease.move });
  tl.tween(rStory, 0, { at: 32.6, dur: 0.5, ease: ease.move });
  tl.tween(opCin, 1, { at: 32.6, dur: 0.6, ease: ease.move });
  tl.tween(opCon, 1, { at: 32.6, dur: 0.6, ease: ease.move });
  tl.tween(waterU, 3, { at: 33.4, dur: 4.2, ease: ease.linear });
  tl.tween(railU, 3, { at: 37.4, dur: 2.0, ease: ease.linear });
  tl.tween(rMin, 1, { at: 39.4, dur: 0.7, ease: ease.enter });
  tl.hold(43.8, 0.6);

  // — B5 · argmax: a two-match tournament, ties go left —
  tl.caption({ ...caps[4], text: 'The picker, argmax, compares two scores at a time: Cinema against Contact, then the survivor against Story. A bias one float step above a half sends exact ties left.' });
  tl.tween(cam, CAM_PANEL, { at: 44.8, dur: 1.4, ease: ease.move });
  tl.tween(rMin, 0, { at: 44.4, dur: 0.5, ease: ease.move });
  tl.tween(boardOp, 0.12, { at: 44.4, dur: 0.5, ease: ease.move });
  tl.tween(cmpTex, 1, { at: 45.6, dur: 0.7, ease: ease.enter });
  tl.tween(m1U, 1, { at: 47.2, dur: 1.2, ease: ease.draw });
  tl.tween(m2U, 1, { at: 50.0, dur: 1.2, ease: ease.draw });
  tl.tween(biasU, 1, { at: 52.8, dur: 0.7, ease: ease.enter });
  tl.hold(56.8, 0.6);

  // — B6 · out comes a one-hot: [1, 0, 0] —
  tl.caption({ ...caps[5], text: 'What leaves the tournament is a one-hot: a 1 for the winner, a 0 for each loser. Here that is 1, 0, 0, and Cinema wins with a score of 1.' });
  tl.tween(biasU, 0.25, { at: 57.4, dur: 0.6, ease: ease.move });
  tl.tween(oneU, 1, { at: 58.0, dur: 1.2, ease: ease.draw });
  tl.tween(winU, 1, { at: 64.2, dur: 0.6, ease: ease.pop });
  tl.hold(69.4, 0.6);

  // — B7 · drag to 984 × 730: Cinema's hero gauge sinks; Contact wins —
  tl.caption({ ...caps[6], text: "Narrow to 984 by 730. Cinema's hero shrinks to 666 pixels against a 900 target, so its gauge falls to 0.74. Contact wins, 0.94 over Story's 0.93." });
  tl.tween(cam, CAM_BOARD, { at: 70.0, dur: 1.3, ease: ease.move });
  tl.tween(boardOp, 1, { at: 71.2, dur: 0.6, ease: ease.move });
  tl.tween(winU, 0, { at: 70.0, dur: 0.4, ease: ease.move });
  tl.tween(cmpTex, 0, { at: 70.0, dur: 0.5, ease: ease.move });
  tl.tween(biasU, 0, { at: 70.0, dur: 0.5, ease: ease.move });
  tl.tween(W, PRESETS.mid[0], { at: 70.8, dur: 1.2, ease: ease.move });
  tl.tween(H, PRESETS.mid[1], { at: 70.8, dur: 1.2, ease: ease.move });
  tl.set(spot, 0, 72.4);
  tl.tween(spotU, 1, { at: 72.4, dur: 0.6, ease: ease.enter });
  tl.tween(rCinema, 1, { at: 72.8, dur: 0.6, ease: ease.enter });
  tl.tween(winU, 1, { at: 78.0, dur: 0.6, ease: ease.pop });
  tl.hold(82.4, 0.6);

  // — B8 · drag to 610 × 830: Contact's cells are narrow; only the worst counts —
  tl.caption({ ...caps[7], text: "At 610 by 830, Contact's cells are 135 wide, a gauge of 0.56. Its height gauge is a perfect 1, but only the worst gauge counts." });
  tl.tween(spotU, 0, { at: 83.0, dur: 0.4, ease: ease.move });
  tl.tween(rCinema, 0, { at: 83.0, dur: 0.5, ease: ease.move });
  tl.tween(winU, 0, { at: 83.0, dur: 0.4, ease: ease.move });
  tl.tween(W, PRESETS.tall[0], { at: 83.4, dur: 1.2, ease: ease.move });
  tl.tween(H, PRESETS.tall[1], { at: 83.4, dur: 1.2, ease: ease.move });
  tl.tween(opCin, 0.15, { at: 84.6, dur: 0.6, ease: ease.move });
  tl.tween(opSto, 0.15, { at: 84.6, dur: 0.6, ease: ease.move });
  tl.set(spot, 4 + 0, 85.0);
  tl.tween(spotU, 1, { at: 85.0, dur: 0.6, ease: ease.enter });
  tl.tween(rCell, 1, { at: 85.4, dur: 0.6, ease: ease.enter });
  tl.hold(93.0, 0.6);

  // — B9 · Story's hero: 439.2 / 440; Story takes over —
  tl.caption({ ...caps[8], text: "Story's hero is 439 tall against a 440 target, and its other gauges are full. Story scores 0.998 and takes over." });
  tl.tween(spotU, 0, { at: 93.6, dur: 0.4, ease: ease.move });
  tl.tween(rCell, 0, { at: 93.6, dur: 0.5, ease: ease.move });
  tl.tween(opCon, 0.15, { at: 93.6, dur: 0.6, ease: ease.move });
  tl.tween(opSto, 1, { at: 93.6, dur: 0.6, ease: ease.move });
  tl.set(spot, 8 + 1, 94.4);
  tl.tween(spotU, 1, { at: 94.4, dur: 0.6, ease: ease.enter });
  tl.tween(rHero, 1, { at: 94.6, dur: 0.6, ease: ease.enter });
  tl.tween(winU, 1, { at: 98.6, dur: 0.6, ease: ease.pop });
  tl.hold(102.2, 0.6);

  // — B10 · the flip is tight: a score-versus-width sweep at 517 tall; a three-way tie goes left —
  tl.caption({ ...caps[9], text: 'The flip is tight. At 517 tall, 760 wide picks Contact, but at 600 wide Story wins, 0.555 against 0.552. A three-way tie, as at 1,280 by 800, goes to Cinema.' });
  tl.tween(spotU, 0, { at: 102.8, dur: 0.4, ease: ease.move });
  tl.tween(rHero, 0, { at: 102.8, dur: 0.5, ease: ease.move });
  tl.tween(winU, 0, { at: 102.8, dur: 0.4, ease: ease.move });
  tl.tween(opCin, 1, { at: 102.8, dur: 0.6, ease: ease.move });
  tl.tween(opCon, 1, { at: 102.8, dur: 0.6, ease: ease.move });
  tl.tween(boardOp, 0.06, { at: 102.8, dur: 0.8, ease: ease.move });
  tl.tween(W, PRESETS.flipA[0], { at: 103.0, dur: 1.2, ease: ease.move });
  tl.tween(H, PRESETS.flipA[1], { at: 103.0, dur: 1.2, ease: ease.move });
  tl.tween(plotU, 1, { at: 103.2, dur: 0.7, ease: ease.enter });
  tl.tween(curveU, 1, { at: 103.6, dur: 1.4, ease: ease.draw });
  tl.tween(W, PRESETS.flipB[0], { at: 107.6, dur: 1.4, ease: ease.move });
  tl.tween(flipU, 1, { at: 109.0, dur: 0.6, ease: ease.pop });
  tl.tween(W, PRESETS.tie[0], { at: 112.4, dur: 1.2, ease: ease.move });
  tl.tween(H, PRESETS.tie[1], { at: 112.4, dur: 1.2, ease: ease.move });
  tl.tween(flipU, 0.35, { at: 112.4, dur: 0.6, ease: ease.move });
  tl.tween(tieU, 1, { at: 113.6, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 112.4, dur: 1.4, ease: ease.move });
  tl.tween(winU, 1, { at: 114.2, dur: 0.6, ease: ease.pop });
  tl.hold(116.8, 2.6);

  return {
    tl, cam, chip, W, H,
    headU, fillConH, fillConW, fillCin, fillSto, ghostU, dimU, opCin, opCon, opSto, spot, spotU, waterU, boardOp,
    rGauge, rContact, rStory, rMin, rCinema, rCell, rHero,
    railU, cmpTex, m1U, m2U, biasU, oneU, winU, panelOp,
    plotU, curveU, flipU, tieU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs (local)
// ---------------------------------------------------------------------------

function BitDisc({ x, y, b, r = 13, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 1 ? colors.TEXT : colors.PANEL} stroke={colors.TEXT} strokeWidth={1.8} />
      <text x={x} y={y + 5} textAnchor="middle" fill={b >= 1 ? '#0a0e1a' : colors.TEXT} fontSize={14} fontFamily={MONO} fontWeight={700}>
        {b}
      </text>
    </g>
  );
}

function Readout({ tex, x, y, u, fs = 20, box = 620 }: { tex: string; x: number; y: number; u: number; fs?: number; box?: number }) {
  if (u <= 0.005) return null;
  return (
    <g transform={`translate(0, ${(1 - u) * 8})`}>
      <MathLabel tex={tex} x={x} y={y} fontSize={fs} boxWidth={box} opacity={u} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const Wn = v(scene.W);
  const Hn = v(scene.H);
  const e = evalStage(Wn, Hn);

  const headU = v(scene.headU);
  const fills = [
    [v(scene.fillCin), v(scene.fillCin), v(scene.fillCin), v(scene.fillCin)],
    [v(scene.fillConW), v(scene.fillConH)],
    [v(scene.fillSto), v(scene.fillSto), v(scene.fillSto), v(scene.fillSto)],
  ];
  // per-gauge stagger inside a column
  const fillAt = (l: number, k: number): number => {
    const n = LAYOUTS[l].gauges.length;
    const u = fills[l][k];
    return l === 1 ? u : clamp01(u * (n + 1) - k);
  };
  // Contact's height tube stands empty from the start; every other tube appears as its fill begins
  const tubeOn = (l: number, k: number): number => (l === 1 && k === 1 ? headU : clamp01(fills[l][k] * 4));
  const colOp = [v(scene.opCin), v(scene.opCon), v(scene.opSto)];
  const boardOp = v(scene.boardOp);
  const spot = Math.round(v(scene.spot));
  const spotU = v(scene.spotU);
  const waterU = v(scene.waterU);
  const ghostU = v(scene.ghostU);
  const dimU = v(scene.dimU);
  const railU = v(scene.railU);
  const m1U = v(scene.m1U);
  const m2U = v(scene.m2U);
  const oneU = v(scene.oneU);
  const winU = v(scene.winU);
  const biasU = v(scene.biasU);
  const cmpTex = v(scene.cmpTex);
  const plotU = v(scene.plotU);
  const curveU = v(scene.curveU);
  const flipU = v(scene.flipU);
  const tieU = v(scene.tieU);
  const chip = CHIPS[Math.max(0, Math.min(CHIPS.length - 1, Math.round(v(scene.chip))))];

  // the min fold: column l's waterline sweeps left → right, its level the running minimum so far
  const water = (l: number): { x1: number; level: number; done: number } | null => {
    const u = clamp01(waterU - l);
    if (u <= 0) return null;
    const g = e.gauges[l];
    const n = g.length;
    const p = u * n;
    const k = Math.min(n - 1, Math.floor(p));
    const runMin = (j: number): number => g.slice(0, j + 1).reduce((m, x) => Math.min(m, x));
    const level = k === 0 ? runMin(0) : lerp(runMin(k - 1), runMin(k), clamp01((p - k) * 3));
    return { x1: GROUP_X[l] + (p / n) * groupW(l), level: u >= 1 ? e.scores[l] : level, done: clamp01((u - 0.92) / 0.08) };
  };
  const bottleneck = e.gauges.map((g) => g.indexOf(Math.min(...g)));
  const sweepVisible = clamp01(1 - Math.abs(Hn - SWEEP_H) / 20) * plotU;

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the gauge board ======================== */}
        <g opacity={boardOp * headU}>
          {LAYOUTS.map((L, l) => {
            const w = water(l);
            const anyOn = Math.max(...L.gauges.map((_, k) => tubeOn(l, k)));
            return (
              <g key={L.name} opacity={colOp[l] * anyOn}>
                <text x={groupMid(l)} y={HEAD_Y} textAnchor="middle" fill={L.color} fontSize={16} fontFamily={UI} fontWeight={600}>
                  {L.name}
                </text>
                {L.gauges.map((G, k) => {
                  const on = tubeOn(l, k);
                  if (on <= 0.005) return null;
                  const x = tubeX(l, k);
                  const val = e.gauges[l][k] * fillAt(l, k);
                  const raw = e.sizes[l][k] / G.target;
                  const fh = TUBE_H * val;
                  const halo = Math.max(spot === l * 4 + k ? spotU : 0, (w?.done ?? 0) * (bottleneck[l] === k ? 1 : 0));
                  const ignored = l === 1 && spot === 4 && k === 1 ? spotU : 0; // the full height gauge that does not count
                  return (
                    <g key={k} opacity={on * (1 - 0.6 * ignored)}>
                      {halo > 0.01 && (
                        <rect x={x - TUBE_W / 2 - 5} y={TUBE_TOP - 5} width={TUBE_W + 10} height={TUBE_H + 10} rx={16} fill="none" stroke={L.color} strokeWidth={2.5} opacity={halo} />
                      )}
                      <rect x={x - TUBE_W / 2} y={TUBE_TOP} width={TUBE_W} height={TUBE_H} rx={TUBE_W / 2} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
                      {fh > 0.5 && (
                        <rect x={x - TUBE_W / 2 + 3} y={TUBE_BASE - fh + 3} width={TUBE_W - 6} height={Math.max(0, fh - 6)} rx={Math.min(8, fh / 2)} fill={L.color} opacity={0.85} />
                      )}
                      {/* the tick at 1 */}
                      <line x1={x - 17} y1={TUBE_TOP} x2={x + 17} y2={TUBE_TOP} stroke={colors.MUTED} strokeWidth={1.5} />
                      {/* the uncapped size, drawn past the tick and cut off at 1 */}
                      {l === 1 && k === 0 && ghostU > 0.01 && raw > 1 && (
                        <g opacity={ghostU * clamp01(fillAt(1, 0) * 1.5)}>
                          <rect x={x - TUBE_W / 2 + 3} y={levelY(Math.min(1.2, raw))} width={TUBE_W - 6} height={TUBE_TOP - levelY(Math.min(1.2, raw))} rx={3} fill="none"
                            stroke={L.color} strokeWidth={1.4} strokeDasharray="4 3" />
                          <text x={x - 18} y={levelY(1.12)} textAnchor="end" fill={L.color} fontSize={13} fontFamily={MONO}>
                            {f1(e.sizes[1][0])} px
                          </text>
                          <text x={x - 18} y={levelY(1.12) + 16} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                            capped at 1
                          </text>
                        </g>
                      )}
                      <text x={x} y={TUBE_BASE + 20} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={UI}>
                        {G.name}
                      </text>
                      <text x={x} y={TUBE_BASE + 36} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                        ÷{G.target}
                      </text>
                      <text x={x} y={TUBE_BASE + 58} textAnchor="middle" fill={halo > 0.5 ? L.color : colors.TEXT} fontSize={14} fontFamily={MONO} fontWeight={halo > 0.5 ? 700 : 400}>
                        {fGauge(val)}
                      </text>
                    </g>
                  );
                })}
                {/* waterline: the column's score */}
                {w && (
                  <g>
                    <line x1={GROUP_X[l] + 4} y1={levelY(w.level)} x2={w.x1 - 4} y2={levelY(w.level)} stroke={colors.TEXT} strokeWidth={2.2} />
                    <circle cx={w.x1 - 4} cy={levelY(w.level)} r={3.5} fill={colors.TEXT} />
                  </g>
                )}
              </g>
            );
          })}
          {/* the "1" label at the tick row, once */}
          <text x={GROUP_X[0] - 8} y={TUBE_TOP + 5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={headU}>
            1
          </text>
          <text x={GROUP_X[0] - 8} y={TUBE_BASE + 5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={headU}>
            0
          </text>

          {/* Contact cell h, drawn 1:1: 208 px of a 240 px target */}
          {dimU > 0.01 && (
            <g opacity={dimU * colOp[1]}>
              {(() => {
                const x = tubeX(1, 1) + 22;
                const top = levelY(e.gauges[1][1]);
                return (
                  <>
                    <path d={`M ${x - 4} ${TUBE_BASE} H ${x + 4} M ${x} ${TUBE_BASE} V ${top} M ${x - 4} ${top} H ${x + 4}`} stroke={colors.TEXT} strokeWidth={1.4} fill="none" />
                    <text x={x + 8} y={(TUBE_BASE + top) / 2 + 5} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {f1(e.sizes[1][1])} px
                    </text>
                    <text x={x - 4} y={TUBE_TOP - 8} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      target 240 px = 1
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* beat readouts under the board (and beside Contact while the camera is pushed in) */}
          <Readout tex={TEX_GAUGE} x={650} y={326} u={v(scene.rGauge)} fs={22} box={360} />
          <Readout tex={TEX_SCALE} x={650} y={384} u={v(scene.rGauge)} fs={22} box={360} />
          <Readout tex={TEX_CONTACT} x={650} y={360} u={v(scene.rContact)} fs={22} box={360} />
          <Readout tex={TEX_STORY} x={BOARD_MID} y={590} u={v(scene.rStory)} />
          <Readout tex={TEX_MIN} x={BOARD_MID} y={590} u={v(scene.rMin)} />
          <Readout tex={TEX_CINEMA} x={BOARD_MID} y={590} u={v(scene.rCinema)} />
          <Readout tex={TEX_CELL} x={BOARD_MID} y={590} u={v(scene.rCell)} box={660} />
          <Readout tex={TEX_HERO} x={BOARD_MID} y={590} u={v(scene.rHero)} />
        </g>

        {/* ======================== the closing sweep: score vs width at 517 tall ======================== */}
        {plotU > 0.01 && (
          <g opacity={plotU}>
            <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x1} y2={PLOT.y0} stroke={colors.MUTED} strokeWidth={1.4} />
            <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y1 - 6} stroke={colors.MUTED} strokeWidth={1.4} />
            {[0.4, 0.6, 0.8].map((t) => (
              <g key={t}>
                <line x1={PLOT.x0} y1={py(t)} x2={PLOT.x1} y2={py(t)} stroke={colors.GRID} strokeWidth={1} />
                <text x={PLOT.x0 - 8} y={py(t) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {t.toFixed(1)}
                </text>
              </g>
            ))}
            {[600, 760, 1000, 1280].map((t) => (
              <text key={t} x={px(t)} y={PLOT.y0 + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                {t}
              </text>
            ))}
            <text x={PLOT.x1} y={PLOT.y0 + 52} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              stage width at 517 tall
            </text>
            <text x={PLOT.x0} y={PLOT.y1 - 16} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              score
            </text>
            {/* winner band */}
            {BANDS.map((b, i) => (
              <rect key={i} x={px(b.a)} y={PLOT.y0 + 6} width={Math.max(0, px(b.b) - px(b.a))} height={8} fill={LAYOUTS[b.winner].color} opacity={0.7 * curveU} />
            ))}
            {CURVES.map((pts, l) => {
              const n = Math.max(2, Math.round(pts.length * curveU));
              return (
                <g key={l}>
                  <polyline points={pts.slice(0, n).join(' ')} fill="none" stroke={LAYOUTS[l].color} strokeWidth={2.4} />
                  {curveU > 0.98 && (
                    <text x={PLOT.x1 + 6} y={py(SWEEP[SWEEP.length - 1].scores[l]) + (l === 2 ? 12 : l === 1 ? 2 : 4)} fill={LAYOUTS[l].color} fontSize={13} fontFamily={UI}>
                      {LAYOUTS[l].name}
                    </text>
                  )}
                </g>
              );
            })}
            {/* the stage cursor */}
            {sweepVisible > 0.01 && (
              <g opacity={sweepVisible}>
                <line x1={px(Wn)} y1={PLOT.y0} x2={px(Wn)} y2={PLOT.y1} stroke={colors.TEXT} strokeWidth={1.2} strokeDasharray="4 3" />
                {e.scores.map((sc, l) => (
                  <circle key={l} cx={px(Wn)} cy={py(sc)} r={l === e.winner ? 6 : 4} fill={l === e.winner ? LAYOUTS[l].color : colors.PANEL} stroke={LAYOUTS[l].color} strokeWidth={2} />
                ))}
                <text x={px(Wn) + 8} y={PLOT.y1 + 4} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  {Math.round(Wn)}×517 → {LAYOUTS[e.winner].name}
                </text>
              </g>
            )}
            {flipU > 0.01 && (
              <g opacity={flipU}>
                <text x={px(600) + 10} y={PLOT.y1 + 24} fill={LAYOUTS[2].color} fontSize={13} fontFamily={MONO}>
                  Story {f4(evalStage(600, 517).scores[2])}
                </text>
                <text x={px(600) + 10} y={PLOT.y1 + 42} fill={LAYOUTS[1].color} fontSize={13} fontFamily={MONO}>
                  Contact {f4(evalStage(600, 517).scores[1])}
                </text>
              </g>
            )}
            {tieU > 0.01 && (
              <g opacity={tieU}>
                <rect x={PLOT.x0 + 70} y={PLOT.y0 + 74} width={420} height={30} rx={8} fill={colors.PANEL} stroke={LAYOUTS[0].color} strokeWidth={1.3} />
                <text x={PLOT.x0 + 280} y={PLOT.y0 + 94} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  1280×800: 1 = 1 = 1 → Cinema (ties go left)
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== score rail, bracket, one-hot ======================== */}
        <g opacity={v(scene.panelOp) * clamp01(railU * 2)}>
          <text x={RP} y={196} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
            score = worst gauge
          </text>
          <Readout tex={TEX_COMPARE} x={985} y={166} u={cmpTex} fs={20} box={520} />
          {LAYOUTS.map((L, l) => {
            const u = clamp01(railU - l);
            const sc = e.scores[l] * u;
            const lit = l === e.winner ? winU : 0;
            const lost = oneU > 0.5 && l !== e.winner ? 0.45 * Math.max(oneU - 0.5, 0) * 2 : 0;
            return (
              <g key={L.name} opacity={clamp01(u * 3) * (1 - lost)}>
                <text x={RP} y={ROW_Y[l] + 5} fill={L.color} fontSize={15} fontFamily={UI} fontWeight={lit > 0.5 ? 700 : 500}>
                  {L.name}
                </text>
                <rect x={BAR_X} y={ROW_Y[l] - 9} width={BAR_W} height={18} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
                <rect x={BAR_X} y={ROW_Y[l] - 9} width={BAR_W * sc} height={18} rx={4} fill={L.color} opacity={0.85} />
                {lit > 0.01 && <rect x={BAR_X - 4} y={ROW_Y[l] - 13} width={BAR_W + 8} height={26} rx={6} fill="none" stroke={L.color} strokeWidth={2} opacity={lit} />}
                <text x={BAR_X + BAR_W + 12} y={ROW_Y[l] + 5} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {fScore(sc)}
                </text>
              </g>
            );
          })}

          {/* the bracket: two matches */}
          {m1U > 0.01 && (
            <g opacity={clamp01(m1U * 2)}>
              <path d={`M 1092 ${ROW_Y[0]} H ${NODE1.x} V ${ROW_Y[1]} H 1092`} fill="none" stroke={colors.MUTED} strokeWidth={1.4} />
              <path d={`M 1092 ${ROW_Y[e.survivor]} H ${NODE1.x}`} fill="none" stroke={LAYOUTS[e.survivor].color} strokeWidth={2.6} opacity={clamp01(m1U * 2 - 1)} />
              <BitDisc x={NODE1.x} y={NODE1.y} b={e.bit1} opacity={clamp01(m1U * 2 - 1)} />
            </g>
          )}
          {m2U > 0.01 && (
            <g opacity={clamp01(m2U * 2)}>
              <path d={`M ${NODE1.x + 13} ${NODE1.y} H ${NODE2.x} V ${ROW_Y[2]} H 1092`} fill="none" stroke={colors.MUTED} strokeWidth={1.4} />
              {e.bit2 ? (
                <path d={`M ${NODE1.x + 13} ${NODE1.y} H ${NODE2.x}`} fill="none" stroke={LAYOUTS[e.survivor].color} strokeWidth={2.6} opacity={clamp01(m2U * 2 - 1)} />
              ) : (
                <path d={`M 1092 ${ROW_Y[2]} H ${NODE2.x}`} fill="none" stroke={LAYOUTS[2].color} strokeWidth={2.6} opacity={clamp01(m2U * 2 - 1)} />
              )}
              <BitDisc x={NODE2.x} y={NODE2.y} b={e.bit2} opacity={clamp01(m2U * 2 - 1)} />
            </g>
          )}
          {/* the two comparison sums, each against ½ */}
          {[
            { u: m1U, l: 0, r: 1, c: e.c1, bit: e.bit1 },
            { u: m2U, l: e.survivor, r: 2, c: e.c2, bit: e.bit2 },
          ].map((m, i) => {
            if (m.u <= 0.01) return null;
            const tie = Math.abs(e.scores[m.l] - e.scores[m.r]) < 1e-12;
            const cx = lerp(TRACK.x0, TRACK.x1, clamp01(m.c));
            const y = MATCH_Y[i];
            return (
              <g key={i} opacity={clamp01(m.u * 2)}>
                <text x={RP} y={y + 5} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                  <tspan fill={LAYOUTS[m.l].color}>{LAYOUTS[m.l].name}</tspan> vs <tspan fill={LAYOUTS[m.r].color}>{LAYOUTS[m.r].name}</tspan>
                </text>
                <line x1={TRACK.x0} y1={y} x2={TRACK.x1} y2={y} stroke={colors.GRID} strokeWidth={3} />
                <line x1={(TRACK.x0 + TRACK.x1) / 2} y1={y - 8} x2={(TRACK.x0 + TRACK.x1) / 2} y2={y + 8} stroke={colors.MUTED} strokeWidth={1.5} />
                <circle cx={cx} cy={y} r={5} fill={m.bit ? LAYOUTS[m.l].color : LAYOUTS[m.r].color} opacity={clamp01(m.u * 2 - 1)} />
                <text x={TRACK.x1 + 10} y={y + 5} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={clamp01(m.u * 2 - 1)}>
                  c = {tie ? m.c.toFixed(10) : f4(m.c)} → {m.bit ? 'left' : 'right'}
                </text>
              </g>
            );
          })}
          {biasU > 0.01 && (
            <text x={RP} y={502} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={biasU}>
              ½ tick · comparisonBias 0.5000000596 · an exact tie goes left
            </text>
          )}

          {/* the one-hot: selectedLayout */}
          {oneU > 0.01 && (
            <g opacity={clamp01(oneU * 2)}>
              <path d={`M ${NODE2.x} ${NODE2.y + 13} V ${ONEHOT.y + ONEHOT.h / 2} H ${ONEHOT.x + 2 * ONEHOT.pitch + ONEHOT.w}`} fill="none" stroke={colors.TEXT} strokeWidth={1.6}
                strokeDasharray={`${600 * clamp01(oneU * 1.6)} 600`} />
              <text x={RP} y={ONEHOT.y + 20} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                selectedLayout
              </text>
              {e.selected.map((b, l) => {
                const x = ONEHOT.x + l * ONEHOT.pitch;
                const u = clamp01(oneU * 2 - 1);
                const lit = b === 1 ? 1 : 0;
                return (
                  <g key={l} opacity={u}>
                    <rect x={x} y={ONEHOT.y} width={ONEHOT.w} height={ONEHOT.h} rx={5} fill={lit ? LAYOUTS[l].color : colors.PANEL} stroke={LAYOUTS[l].color} strokeWidth={1.5} />
                    <text x={x + ONEHOT.w / 2} y={ONEHOT.y + 20} textAnchor="middle" fill={lit ? '#0a0e1a' : colors.TEXT} fontSize={15} fontFamily={MONO} fontWeight={700}>
                      {b}
                    </text>
                    <text x={x + ONEHOT.w / 2} y={ONEHOT.y + ONEHOT.h + 16} textAnchor="middle" fill={LAYOUTS[l].color} fontSize={12} fontFamily={UI}>
                      {LAYOUTS[l].name}
                    </text>
                  </g>
                );
              })}
              {winU > 0.01 && (
                <text x={ONEHOT.x + 3 * ONEHOT.pitch + 4} y={ONEHOT.y - 8} fill={LAYOUTS[e.winner].color} fontSize={14} fontFamily={MONO} opacity={winU}>
                  {LAYOUTS[e.winner].name} wins · {fScore(e.scores[e.winner])}
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* ======================== screen-space header: title, identifier chip, the stage ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.92} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · The Worst Gauge Wins
      </text>
      <g>
        <rect x={40} y={48} width={chip.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {chip}
        </text>
      </g>
      <g>
        <text x={MINI.x - 12} y={36} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
          stage {commas(Wn)} × {Math.round(Hn)}
        </text>
        <text x={MINI.x - 12} y={56} textAnchor="end" fill={LAYOUTS[e.winner].color} fontSize={13} fontFamily={UI} opacity={railU > 2.9 ? 1 : 0}>
          showing {LAYOUTS[e.winner].name}
        </text>
        <rect x={MINI.x} y={MINI.y} width={Wn * MINI.s} height={Hn * MINI.s} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} />
        {railU > 2.9 &&
          e.rects[e.winner].map((r, i) =>
            r[2] > 0 && r[3] > 0 ? (
              <rect key={i} x={MINI.x + r[0] * MINI.s} y={MINI.y + r[1] * MINI.s} width={r[2] * MINI.s} height={r[3] * MINI.s}
                fill={LAYOUTS[e.winner].color} opacity={i === 0 && e.winner !== 1 ? 0.55 : 0.8} />
            ) : null,
          )}
      </g>
    </>
  );
}

export const vizScene = () => scene;
