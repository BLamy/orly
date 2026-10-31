// What a layer costs by itself
//
// Runtime Cost — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/runtime-cost/layers.ts:1-2 (the question), 12-13 (operationCount = 16_384, layerCounts), 16 (chainCount),
//     17-29 (chains of roundAffine([[total, 1], [cell(), 1]])), 30-31 (compileTensorProgram,
//     createTensorProgramEvaluator), 34 (source filled with 1 / 1024), 44-45 (the exact-answer check),
//     54-57 (one process per layer count)
//   src/runtime/numeric-ui-core.ts:617-629 (depth = 1 + deepest input), 824 (const layerIndex = depth - 1),
//     1743-1746 (copy in from packedValues), 1870-1885 (sparseMatmulAddBias: fround every product and partial
//     sum), 1772-1775 (copy results back)
//   lab/runtime-cost/README.md:13 (54 to 55 / 64 to 65 / 210 to 214 µs; about 10 µs per 1,000 layers; Bun 1.4.3,
//     Apple M5 Max, load about 4)
//   docs/patterns.md:7 ("for copying the values that it reads and the results that it writes")
//   .orly-work/hw-books/inputs/runtime-cost.md run 1 (67.4 / 76.6 / 249.9 µs; Apple M4 Max, load about 9) and
//     run 6 (widths 256 / 16 / 1; 32,768 input reads, 16,384 outputs, 32,768 weights for every shape)
//   lab/status.md:89 (16,384 layers went from 709 to 250 µs; indexed copy instead of `set` on a new view)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The 16,384 cells are the lab's 16,384 sums, one mark each: in every layout cell i is step
// i % layerCount of chain ⌊i / layerCount⌋, exactly as layers.ts builds them, so the morph from 64 to 1,024 layers
// stacks sixteen short chains into one long one. Shapes are drawn to scale (the camera pulls back ~120× for the
// 16,384-layer needle). The tallies, the chain values and the float checks are computed below from the code's own
// formulas; the timings are the README's and research run 1's, quoted. Plan change: the "≈ 10 µs per 1,000
// layers" line is drawn as the straight-line law it is, so on the log-x chart it bends upward.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, CanvasLayer, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH14 = 8.43; // mono advance at 14 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const TEAL = colors.TEAL;
const WARM = colors.WARM;
const VIOLET = colors.SECONDARY;

// ---------------------------------------------------------------------------
// The probe (layers.ts), exact
// ---------------------------------------------------------------------------

const OPERATION_COUNT = 16_384; // layers.ts:12
const LAYER_COUNTS = [64, 1024, 16_384] as const; // layers.ts:13

type Shape = {
  layers: number;
  chains: number; // = width of every layer
  sources: number;
  inputReads: number;
  outputs: number;
  weights: number;
  expected: number;
};

/** layers.ts:15-29 + compileTensorProgram's per-layer shape: each sum reads its chain's total and one fresh cell. */
const SHAPES: Shape[] = LAYER_COUNTS.map((layers) => {
  const chains = OPERATION_COUNT / layers; // layers.ts:16
  const sources = OPERATION_COUNT + chains; // layers.ts:17
  // per layer: `chains` rows, each reading 2 distinct wires with 2 stored weights (both 1)
  return {
    layers,
    chains,
    sources,
    inputReads: layers * chains * 2,
    outputs: layers * chains,
    weights: layers * chains * 2,
    expected: Math.fround((layers + 1) / 1024), // layers.ts:44
  };
});
for (const sh of SHAPES) {
  // research run 6: identical totals for all three shapes
  if (sh.inputReads !== 32_768 || sh.outputs !== 16_384 || sh.weights !== 32_768) throw new Error('runtime-cost ch2: tally mismatch');
}

/** sparseMatmulAddBias (numeric-ui-core.ts:1870-1885) on one chain: bias 0, weights [1, 1], inputs [total, 1/1024]. */
const CELL_VALUE = Math.fround(1 / 1024); // layers.ts:34
const CHAIN_VALUE: number[] = (() => {
  const out = [CELL_VALUE]; // index k = the chain's total after k layers
  let total = CELL_VALUE;
  for (let k = 1; k <= 16_384; k++) {
    let value = 0;
    value = Math.fround(value + Math.fround(1 * total));
    value = Math.fround(value + Math.fround(1 * CELL_VALUE));
    total = value;
    out.push(total);
  }
  return out;
})();
for (const sh of SHAPES) {
  if (CHAIN_VALUE[sh.layers] !== sh.expected) throw new Error(`runtime-cost ch2: chain of ${sh.layers} ≠ fround((L + 1) / 1024)`);
}
const FLOOR = SHAPES[0];
const PACKED_TOTAL = FLOOR.sources + FLOOR.outputs; // the 64-layer program's packedValues length

// ---------------------------------------------------------------------------
// Timings, quoted (µs per evaluation)
// ---------------------------------------------------------------------------

const README_US = [
  { layers: 64, lo: 54, hi: 55 },
  { layers: 1024, lo: 64, hi: 65 },
  { layers: 16_384, lo: 210, hi: 214 },
]; // README.md:13
const TODAY_US = [
  { layers: 64, us: 67.4 },
  { layers: 1024, us: 76.6 },
  { layers: 16_384, us: 249.9 },
]; // research run 1
const perThousand = (a: { layers: number; us: number }, b: { layers: number; us: number }): number =>
  ((b.us - a.us) / (b.layers - a.layers)) * 1000;
const SLOPE_A = perThousand(TODAY_US[0], TODAY_US[1]); // 9.58 → 9.6
const SLOPE_B = perThousand(TODAY_US[0], TODAY_US[2]); // 11.18 → 11.2
// the README's law, through the midpoints of its 64- and 16,384-layer ranges: ≈ 9.7 µs per 1,000 layers
const README_MID = README_US.map((r) => ({ layers: r.layers, us: (r.lo + r.hi) / 2 }));
const LAW_B = perThousand(README_MID[0], README_MID[2]) / 1000;
const LAW_A = README_MID[0].us - LAW_B * README_MID[0].layers;
if (Math.round(LAW_B * 1000) !== 10) throw new Error('runtime-cost ch2: README slope is not about 10 per 1,000');
const OLD_US = 709; // lab/status.md:89
const NEW_US = 250;

// ---------------------------------------------------------------------------
// The 16,384 cells: four formations (module scope)
// ---------------------------------------------------------------------------

const BASE_Y = 520; // layer 1 sits here; layers stack upward
const PITCH = 3.5;
const GRID_PITCH = 3.0;
const PITCHES = [GRID_PITCH, PITCH, PITCH, PITCH];
const FX: Float32Array[] = [];
const FY: Float32Array[] = [];
{
  const gx = new Float32Array(OPERATION_COUNT);
  const gy = new Float32Array(OPERATION_COUNT);
  for (let i = 0; i < OPERATION_COUNT; i++) {
    gx[i] = 640 + ((i % 128) - 63.5) * GRID_PITCH;
    gy[i] = 360 + (Math.floor(i / 128) - 63.5) * GRID_PITCH;
  }
  FX.push(gx);
  FY.push(gy);
  for (const L of LAYER_COUNTS) {
    const w = OPERATION_COUNT / L;
    const xs = new Float32Array(OPERATION_COUNT);
    const ys = new Float32Array(OPERATION_COUNT);
    for (let i = 0; i < OPERATION_COUNT; i++) {
      const chain = Math.floor(i / L);
      const step = i % L;
      xs[i] = 640 + (chain - (w - 1) / 2) * PITCH;
      ys[i] = BASE_Y - step * PITCH;
    }
    FX.push(xs);
    FY.push(ys);
  }
}
const shapeTop = (L: number): number => BASE_Y - (L - 1) * PITCH - PITCH / 2;
const shapeHalfW = (L: number): number => ((OPERATION_COUNT / L) * PITCH) / 2;
const SPOT_CHAIN = 100; // the recoloured thread in the 64-layer floor
const chainX = (c: number): number => 640 + (c - (FLOOR.chains - 1) / 2) * PITCH;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 76;
const fit = (L: number): CameraState => {
  // the whole shape between screen y ≈ 105 and 575
  const k = 470 / (L * PITCH);
  return { x: 640, y: BASE_Y - 215 / k, k };
};
const CAM_GRID: CameraState = { x: 640, y: 360, k: 1 };
const CAM_GRID_IN: CameraState = { x: 640, y: 368, k: 1.12 };
const CAM_FLOOR: CameraState = { x: 640, y: 400, k: 1 };
const CAM_COL = fit(1024);
const CAM_NEEDLE = fit(16_384);
const CAM_CORNER: CameraState = { x: 192 - (300 - 640) / 2.6, y: 520 - (470 - 360) / 2.6, k: 2.6 };
const CAM_SWEEP: CameraState = { x: 640, y: 430, k: 1 };
const CAM_HOME: CameraState = { ...CAMERA_HOME, x: 640, y: 360, k: 1 };
const CAM_CHART: CameraState = { x: 640, y: 352, k: 1.02 };
const CAM_CHART_IN: CameraState = { x: 470, y: 400, k: 1.38 };

// packedValues strip under the floor (beat 5)
const STRIP = { x: 192, y: 548, w: 896, h: 12 };

// tally cards (beats 6–7)
const CARD = { x0: 95, dx: 370, y: 140, w: 330, h: 168 };
const cardX = (i: number): number => CARD.x0 + i * CARD.dx;

// chart (beats 8–10): log-x layers, linear µs
const AX = { x0: 200, x1: 1080, y0: 520, y1: 130 };
const XL = (L: number): number => AX.x0 + 40 + ((Math.log2(L) - 6) / 8) * (AX.x1 - AX.x0 - 80);
const YU = (us: number): number => AX.y0 - us * 1.3;
const LAW_PATH = (() => {
  const pts: string[] = [];
  for (let j = 0; j <= 80; j++) {
    const L = 2 ** (6 + (8 * j) / 80);
    pts.push(`${j ? 'L' : 'M'} ${XL(L).toFixed(1)} ${YU(LAW_A + LAW_B * L).toFixed(1)}`);
  }
  return pts.join(' ');
})();

// bar (beat 12)
const STAMP_X = 280;
const STAMP_Y = 128;
const BAR = { x: 170, y: 300, h: 44, scale: 1.3 };

// header code chip, one per caption ('' = none)
const CODE = [
  'operationCount = 16_384',
  'layerCounts = [64, 1024, 16_384]',
  'chainCount = operationCount / layerCount',
  'compileTensorProgram(roots)',
  'sparseMatmulAddBias(projection, layer.weights, …)',
  'createTensorProgramEvaluator(program)',
  'Math.fround((layerCount + 1) / 1024)',
  '',
  '',
  '',
  '',
  '',
];

const CAPTIONS = [
  'Now a sharper question: what does a layer cost on its own, apart from the arithmetic inside it? The lab builds a clean experiment to isolate that.',
  'Take sixteen thousand three hundred eighty-four sums, each adding two numbers. Chain them into sixty-four layers, or one thousand twenty-four, or sixteen thousand three hundred eighty-four.',
  'With sixty-four layers, two hundred fifty-six chains run side by side, so every layer is two hundred fifty-six sums wide. With sixteen thousand layers there is one chain, and one sum per layer.',
  'A layer is just a depth. Each operation sits one level above the deepest thing it reads, and the compiler gives every level its own layer.',
  'Each layer copies its inputs out of one shared array, does its sparse sums, rounding every product and every partial sum to a thirty-two-bit float, then copies its results back.',
  'Across all three shapes the totals are identical: thirty-two thousand seven hundred sixty-eight input reads, sixteen thousand three hundred eighty-four outputs, the same stored weights.',
  'So with the totals fixed, the time difference tracks the number of layers, not the amount of arithmetic. Each shape runs in its own process, and the answer is checked against its exact value.',
  'The readme reports fifty-four to fifty-five microseconds at sixty-four layers, sixty-four to sixty-five at one thousand twenty-four, and two hundred ten to two hundred fourteen at sixteen thousand.',
  'That works out to about ten microseconds for every thousand layers, measured on an Apple M five Max at a load average of about four.',
  'Rerun here, on an M four Max at a load of about nine, it gave sixty-seven, seventy-seven, and two hundred fifty. The slope held near ten, but the absolute numbers shifted.',
  "The docs blame copying values. But copy volume is the same in all three shapes, so what grows is fixed work per layer. That reading is our inference; the lab doesn't test it.",
  'An older executor needed seven hundred nine microseconds for the sixteen thousand layer case. After a change to how outputs are copied, the same probe took two hundred fifty. Layer overhead is real.',
];

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ~150 words per minute
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GRID, cameraInterp);
  const code = tl.channel('code', 0);

  // the cells
  const cellsOp = tl.channel('cellsOp', 0);
  const form = tl.channel('form', 0); // 0 grid · 1 64 layers · 2 1,024 · 3 16,384
  const shapeLbl = tl.channel('shapeLbl', 0);
  const lensU = tl.channel('lensU', 0);
  const threadsU = tl.channel('threadsU', 0);
  const spotU = tl.channel('spotU', 0);
  const spotLo = tl.channel('spotLo', 64 * 128);
  const spotHi = tl.channel('spotHi', 65 * 128);
  const chainLbl = tl.channel('chainLbl', 0);
  const needleLbl = tl.channel('needleLbl', 0);
  // depth card (B3)
  const depCard = tl.channel('depCard', 0);
  const depU = tl.channel('depU', 0); // 0..4 nodes revealed
  const mathU = tl.channel('mathU', 0);
  const idxU = tl.channel('idxU', 0);
  // sweep (B4)
  const sweepCard = tl.channel('sweepCard', 0);
  const sweepOn = tl.channel('sweepOn', 0);
  const sweep = tl.channel('sweep', 0); // layers done, 0..64
  const stage = tl.channel('stage', 0); // 0 none · 1 copy in · 2 sums · 3 copy out
  // tallies (B5–B6)
  const cardsU = tl.channel('cardsU', 0); // 0..3 staggered
  const eqU = tl.channel('eqU', 0);
  const procU = tl.channel('procU', 0);
  const checkU = tl.channel('checkU', 0); // 0..3
  const tracksU = tl.channel('tracksU', 0);
  const cardsOp = tl.channel('cardsOp', 1);
  // chart (B7–B9)
  const axisU = tl.channel('axisU', 0);
  const readmeU = tl.channel('readmeU', 0); // 0..3
  const lawU = tl.channel('lawU', 0);
  const readmeStamp = tl.channel('readmeStamp', 0);
  const todayU = tl.channel('todayU', 0); // 0..3
  const todayStamp = tl.channel('todayStamp', 0);
  const slopesU = tl.channel('slopesU', 0);
  const chartOp = tl.channel('chartOp', 1);
  // the reading (B10)
  const quoteU = tl.channel('quoteU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const arrowU = tl.channel('arrowU', 0);
  const inferU = tl.channel('inferU', 0);
  const readOp = tl.channel('readOp', 1);
  // the historical bar (B11)
  const barU = tl.channel('barU', 0);
  const shrinkU = tl.channel('shrinkU', 0);
  const barLbl = tl.channel('barLbl', 0);

  const words = (t: string): number => t.split(/\s+/).length;
  const C: { at: number; dur: number }[] = [];
  let t = 0.4;
  for (const text of CAPTIONS) {
    const dur = Math.round((words(text) / 2.55 + 0.3) * 10) / 10;
    C.push({ at: t, dur });
    t = tl.caption({ at: t, dur, text });
    t = tl.hold(t, 0.9);
  }
  C.forEach((c, i) => tl.set(code, i, Math.max(0, c.at - 0.15)));
  const end = (i: number): number => C[i].at + C[i].dur;

  // — B0 · what does a layer cost on its own? 16,384 sums, lit uniformly; one row asks the question —
  tl.tween(cellsOp, 1, { at: C[0].at + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_GRID_IN, { at: C[0].at + 1.0, dur: 4.5, ease: ease.move });
  tl.tween(spotU, 1, { at: C[0].at + 3.6, dur: 0.7, ease: ease.enter });
  tl.tween(lensU, 1, { at: C[0].at + 3.8, dur: 0.7, ease: ease.enter });

  // — B1 · chain them: 64 rows, 1,024 rows, 16,384 rows (camera pulls back to keep each to scale) —
  let a = C[1].at;
  tl.tween(lensU, 0, { at: a, dur: 0.5, ease: ease.enter });
  tl.tween(spotU, 0, { at: a, dur: 0.5, ease: ease.enter });
  tl.tween(form, 1, { at: a + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAM_FLOOR, { at: a + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(shapeLbl, 1, { at: a + 2.0, dur: 0.5, ease: ease.enter });
  tl.tween(shapeLbl, 0, { at: a + 4.6, dur: 0.3, ease: ease.enter });
  tl.tween(form, 2, { at: a + 4.9, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_COL, { at: a + 4.9, dur: 1.4, ease: ease.move });
  tl.tween(shapeLbl, 1, { at: a + 6.3, dur: 0.4, ease: ease.enter });
  tl.tween(shapeLbl, 0, { at: a + 7.3, dur: 0.3, ease: ease.enter });
  tl.tween(form, 3, { at: a + 7.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_NEEDLE, { at: a + 7.6, dur: 1.4, ease: ease.move });
  tl.tween(shapeLbl, 1, { at: a + 9.0, dur: 0.4, ease: ease.enter });

  // — B2 · 256 chains side by side, one thread recoloured; then the single-chain needle —
  a = C[2].at;
  tl.tween(shapeLbl, 0, { at: a, dur: 0.3, ease: ease.enter });
  tl.tween(form, 1, { at: a + 0.3, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_FLOOR, { at: a + 0.3, dur: 1.6, ease: ease.move });
  tl.set(spotLo, SPOT_CHAIN * 64, a + 0.3);
  tl.set(spotHi, SPOT_CHAIN * 64 + 64, a + 0.3);
  tl.tween(shapeLbl, 1, { at: a + 2.0, dur: 0.5, ease: ease.enter });
  tl.tween(threadsU, 1, { at: a + 2.2, dur: 0.8, ease: ease.enter });
  tl.tween(spotU, 1, { at: a + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(chainLbl, 1, { at: a + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(threadsU, 0, { at: a + 6.6, dur: 0.4, ease: ease.enter });
  tl.tween(chainLbl, 0, { at: a + 6.6, dur: 0.4, ease: ease.enter });
  tl.tween(spotU, 0, { at: a + 6.6, dur: 0.4, ease: ease.enter });
  tl.tween(shapeLbl, 0, { at: a + 6.6, dur: 0.3, ease: ease.enter });
  tl.set(spotLo, 0, a + 7.05);
  tl.set(spotHi, OPERATION_COUNT, a + 7.05);
  tl.tween(form, 3, { at: a + 7.1, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_NEEDLE, { at: a + 7.1, dur: 1.6, ease: ease.move });
  tl.tween(spotU, 1, { at: a + 8.4, dur: 0.6, ease: ease.enter });
  tl.tween(shapeLbl, 1, { at: a + 8.6, dur: 0.5, ease: ease.enter });
  tl.tween(needleLbl, 1, { at: a + 9.0, dur: 0.6, ease: ease.enter });

  // — B3 · a layer is a depth: push into the floor's corner; the card derives depth node by node —
  a = C[3].at;
  tl.tween(needleLbl, 0, { at: a, dur: 0.4, ease: ease.enter });
  tl.tween(shapeLbl, 0, { at: a, dur: 0.4, ease: ease.enter });
  tl.tween(spotU, 0, { at: a, dur: 0.4, ease: ease.enter });
  tl.set(spotLo, 0, a + 0.45);
  tl.set(spotHi, 3, a + 0.45);
  tl.tween(form, 1, { at: a + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAM_FLOOR, { at: a + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAM_CORNER, { at: a + 1.8, dur: 1.4, ease: ease.move });
  tl.tween(spotU, 1, { at: a + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(depCard, 1, { at: a + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(depU, 4, { at: a + 3.2, dur: 3.6, ease: ease.linear });
  tl.tween(mathU, 1, { at: a + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(idxU, 1, { at: a + 7.2, dur: 0.6, ease: ease.enter });

  // — B4 · inside one layer: copy in, sparse sums with fround, copy back; the sweep climbs 64 layers —
  a = C[4].at;
  tl.tween(depCard, 0, { at: a, dur: 0.5, ease: ease.enter });
  tl.tween(spotU, 0, { at: a, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_SWEEP, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(sweepOn, 1, { at: a + 0.9, dur: 0.6, ease: ease.enter });
  tl.tween(sweepCard, 1, { at: a + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(sweep, 64, { at: a + 1.4, dur: C[4].dur - 1.6, ease: ease.linear });
  tl.set(stage, 1, a + 1.5);
  tl.set(stage, 2, a + 4.2);
  tl.set(stage, 3, a + 9.4);

  // — B5 · three identical tallies over the whispering floor —
  a = C[5].at;
  tl.tween(sweepCard, 0, { at: a, dur: 0.5, ease: ease.enter });
  tl.set(stage, 0, a + 0.5);
  tl.tween(cellsOp, 0.12, { at: a, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(cardsU, 3, { at: a + 1.2, dur: 2.4, ease: ease.linear });
  tl.tween(eqU, 1, { at: a + 5.4, dur: 0.6, ease: ease.enter });

  // — B6 · each shape in its own process; the exact answer is checked —
  a = C[6].at;
  tl.tween(tracksU, 1, { at: a + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(procU, 1, { at: a + 6.4, dur: 0.8, ease: ease.move });
  tl.tween(checkU, 3, { at: a + 9.2, dur: 2.4, ease: ease.linear });

  // — B7 · the README's three ranges on a log-layers chart —
  a = C[7].at;
  tl.tween(cardsOp, 0, { at: a, dur: 0.7, ease: ease.enter });
  tl.tween(cellsOp, 0, { at: a, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CHART, { at: a + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(axisU, 1, { at: a + 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(readmeU, 1, { at: a + 2.4, dur: 0.6, ease: ease.pop });
  tl.tween(readmeU, 2, { at: a + 5.6, dur: 0.6, ease: ease.pop });
  tl.tween(readmeU, 3, { at: a + 8.4, dur: 0.6, ease: ease.pop });
  tl.tween(readmeStamp, 1, { at: a + 9.4, dur: 0.6, ease: ease.enter });

  // — B8 · the law: ≈ 10 µs per 1,000 layers —
  a = C[8].at;
  tl.tween(lawU, 1, { at: a + 0.4, dur: 1.6, ease: ease.draw });

  // — B9 · this run, second colour: push in on the crowded low end, pull back for 250 —
  a = C[9].at;
  tl.tween(cam, CAM_CHART_IN, { at: a + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(todayStamp, 1, { at: a + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(todayU, 2, { at: a + 3.2, dur: 1.6, ease: ease.linear });
  tl.tween(cam, CAM_CHART, { at: a + 5.4, dur: 1.4, ease: ease.move });
  tl.tween(todayU, 3, { at: a + 6.2, dur: 0.6, ease: ease.pop });
  tl.tween(slopesU, 1, { at: a + 8.0, dur: 0.6, ease: ease.enter });

  // — B10 · the docs say copying; copy volume is fixed; what grows is per-layer work (inference) —
  a = C[10].at;
  tl.tween(chartOp, 0, { at: a, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: a, dur: 1.0, ease: ease.move });
  tl.tween(quoteU, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(tallyU, 1, { at: a + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(arrowU, 1, { at: a + 6.2, dur: 1.0, ease: ease.draw });
  tl.tween(inferU, 1, { at: a + 9.6, dur: 0.6, ease: ease.pop });

  // — B11 · historical: the same probe went from 709 to 250 µs —
  a = C[11].at;
  tl.tween(readOp, 0, { at: a, dur: 0.7, ease: ease.enter });
  tl.tween(barU, 1, { at: a + 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(shrinkU, 1, { at: a + 6.4, dur: 1.4, ease: ease.move });
  tl.tween(barLbl, 1, { at: a + 7.6, dur: 0.6, ease: ease.enter });
  tl.hold(end(11), 1.6);

  return {
    tl, cam, code, cellsOp, form, shapeLbl, lensU, threadsU, spotU, spotLo, spotHi, chainLbl, needleLbl,
    depCard, depU, mathU, idxU, sweepCard, sweepOn, sweep, stage, cardsU, eqU, procU, checkU, tracksU, cardsOp,
    axisU, readmeU, lawU, readmeStamp, todayU, todayStamp, slopesU, chartOp, quoteU, tallyU, arrowU, inferU, readOp,
    barU, shrinkU, barLbl,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// The cells (canvas, drawn in screen space through the same camera)
// ---------------------------------------------------------------------------

function drawCells(ctx: CanvasRenderingContext2D, s: SceneState) {
  const op = s.get(scene.cellsOp);
  if (op < 0.005) return;
  const cam = s.get(scene.cam);
  const f = s.get(scene.form);
  const a = Math.max(0, Math.min(3, Math.floor(f)));
  const b = Math.min(3, a + 1);
  const u = f - a;
  const ax = FX[a], ay = FY[a], bx = FX[b], by = FY[b];
  const k = cam.k;
  const ox = STAGE_W / 2 - cam.x * k;
  const oy = STAGE_H / 2 - cam.y * k;
  const sz = Math.max(1.4, lerp(PITCHES[a], PITCHES[b], u) * 0.74 * k);
  const h = sz / 2;
  const spotU = s.get(scene.spotU);
  const threadsU = s.get(scene.threadsU);
  const sweepOn = s.get(scene.sweepOn);
  const sweep = s.get(scene.sweep);
  const focus = Math.max(spotU, sweepOn, threadsU * 0.9);
  const pass = (color: string, alpha: number, test: (i: number) => boolean, lo = 0, hi = OPERATION_COUNT) => {
    if (alpha < 0.005) return;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = lo; i < hi; i++) {
      if (!test(i)) continue;
      const X = (ax[i] + (bx[i] - ax[i]) * u) * k + ox;
      const Y = (ay[i] + (by[i] - ay[i]) * u) * k + oy;
      if (X < -4 || X > STAGE_W + 4 || Y < -4 || Y > STAGE_H + 4) continue;
      ctx.fillRect(X - h, Y - h, sz, sz);
    }
  };
  const all = () => true;
  pass(TEAL, op * 0.8 * (1 - 0.82 * focus), all);
  pass(TEAL, op * threadsU * 0.66, (i) => ((i >> 6) & 1) === 0);
  if (sweepOn > 0.005) {
    const done = Math.floor(sweep);
    pass(TEAL, op * sweepOn * 0.72, (i) => (i & 63) < done);
    if (done < 64 && sweep > 0) pass('#e6edf6', op * sweepOn, (i) => (i & 63) === done);
  }
  const lo = Math.round(s.get(scene.spotLo));
  const hi = Math.round(s.get(scene.spotHi));
  pass(WARM, op * spotU, all, lo, hi);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill ?? colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Label({ x, y, text, color = colors.TEXT, fs = 14, anchor = 'middle', mono = false, opacity = 1, weight }: {
  x: number; y: number; text: string; color?: string; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={fs} fontFamily={mono ? MONO : UI} fontWeight={weight} opacity={opacity}>
      {text}
    </text>
  );
}

/** a tiny to-scale-ish glyph of a layout: wide floor, column, needle */
function ShapeGlyph({ x, y, L, color = TEAL, opacity = 1 }: { x: number; y: number; L: number; color?: string; opacity?: number }) {
  const dims: Record<number, [number, number]> = { 64: [44, 11], 1024: [11, 26], 16384: [2.5, 34] };
  const [w, hgt] = dims[L];
  return <rect x={x - w / 2} y={y - hgt} width={w} height={hgt} fill={color} opacity={opacity * 0.85} rx={1} />;
}

function Arrow({ x1, y1, x2, y2, color, u = 1, width = 1.6 }: { x1: number; y1: number; x2: number; y2: number; color: string; u?: number; width?: number }) {
  if (u <= 0.005) return null;
  const ex = lerp(x1, x2, u);
  const ey = lerp(y1, y2, u);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hs = 7;
  return (
    <g stroke={color} fill={color} strokeWidth={width}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} />
      {u > 0.9 && (
        <polygon
          stroke="none"
          points={`${ex},${ey} ${ex - hs * Math.cos(ang - 0.45)},${ey - hs * Math.sin(ang - 0.45)} ${ex - hs * Math.cos(ang + 0.45)},${ey - hs * Math.sin(ang + 0.45)}`}
        />
      )}
    </g>
  );
}

// depth card geometry (screen space)
const DC = { x: 700, y: 104, w: 530, h: 462 };
const SUM_X = 850;
const SRC_X = 1080;
const NODE_Y = [490, 398, 306, 214]; // initial cell, then sums at depth 1, 2, 3
const NODE_W = 128;
const NODE_H = 38;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const P = (x: number, y: number): [number, number] => [(x - cam.x) * cam.k + STAGE_W / 2, (y - cam.y) * cam.k + STAGE_H / 2];

  const codeIdx = Math.max(0, Math.min(CODE.length - 1, Math.round(s.get(scene.code))));
  const codeText = CODE[codeIdx];

  const form = s.get(scene.form);
  const formI = Math.round(form);
  const settled = 1 - clamp01(Math.abs(form - formI) * 6);
  const shapeLbl = s.get(scene.shapeLbl) * settled * s.get(scene.cellsOp);
  const lensU = s.get(scene.lensU);
  const chainLbl = s.get(scene.chainLbl);
  const needleLbl = s.get(scene.needleLbl);
  const depCard = s.get(scene.depCard);
  const depU = s.get(scene.depU);
  const mathU = s.get(scene.mathU);
  const idxU = s.get(scene.idxU);
  const sweepCard = s.get(scene.sweepCard);
  const sweepOn = s.get(scene.sweepOn) * s.get(scene.cellsOp);
  const sweep = s.get(scene.sweep);
  const stage = Math.round(s.get(scene.stage));
  const cardsU = s.get(scene.cardsU);
  const eqU = s.get(scene.eqU);
  const procU = s.get(scene.procU);
  const checkU = s.get(scene.checkU);
  const tracksU = s.get(scene.tracksU);
  const cardsOp = s.get(scene.cardsOp);
  const axisU = s.get(scene.axisU);
  const readmeU = s.get(scene.readmeU);
  const lawU = s.get(scene.lawU);
  const readmeStamp = s.get(scene.readmeStamp);
  const todayU = s.get(scene.todayU);
  const todayStamp = s.get(scene.todayStamp);
  const slopesU = s.get(scene.slopesU);
  const chartOp = s.get(scene.chartOp);
  const quoteU = s.get(scene.quoteU);
  const tallyU = s.get(scene.tallyU);
  const arrowU = s.get(scene.arrowU);
  const inferU = s.get(scene.inferU);
  const readOp = s.get(scene.readOp);
  const barU = s.get(scene.barU);
  const shrinkU = s.get(scene.shrinkU);
  const barLbl = s.get(scene.barLbl);

  // ---- shape labels (screen space, projected from the shape's top and base) ----
  const sh = formI >= 1 ? SHAPES[formI - 1] : null;
  const topP = sh ? P(640, shapeTop(sh.layers)) : [0, 0];
  const baseP = P(640, BASE_Y);
  const halfW = sh ? shapeHalfW(sh.layers) * cam.k : 0;

  // ---- the lens on one grid row (B0) ----
  const rowY = 360 + (64 - 63.5) * GRID_PITCH;
  const lensL = P(640 - 64 * GRID_PITCH - 6, rowY - 7);
  const lensR = P(640 + 64 * GRID_PITCH + 6, rowY + 7);

  // ---- B2 chain label ----
  const chainTop = P(chainX(SPOT_CHAIN), shapeTop(64));

  // ---- B3 lens on the floor's corner ----
  const cornerP = P(chainX(0), BASE_Y - PITCH);
  const cornerR = 12 * cam.k;

  // ---- B4 sweep ----
  const done = Math.min(64, Math.floor(sweep));
  const showLayer = Math.max(1, Math.min(64, done + (done < 64 ? 1 : 0)));
  const rowP = P(640 - shapeHalfW(64), BASE_Y - (showLayer - 1) * PITCH);
  const fillU = (FLOOR.sources + FLOOR.chains * Math.min(64, sweep)) / PACKED_TOTAL;
  const stripL = P(STRIP.x, STRIP.y);
  const stripW = STRIP.w * cam.k;

  // anything the chart push carries off the stage (or under the header) fades out before it is cut
  const vis = (x: number, y: number, w: number, anchor: 'start' | 'middle' | 'end' = 'start', fs = 14): number => {
    const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
    const [ax, ay] = P(x0, y - fs);
    const [bx, by] = P(x0 + w, y + 4);
    const r = 8;
    return clamp01(ax / r) * clamp01((STAGE_W - bx) / r) * clamp01((ay - HEADER_H) / r) * clamp01((STAGE_H - by) / r);
  };
  /** chart text that fades whole when the camera would cut it */
  const CT = ({ x, y, text, fill, fs = 14, anchor = 'start', mono = true, opacity = 1 }: {
    x: number; y: number; text: string; fill: string; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; opacity?: number;
  }) => {
    const o = opacity * vis(x, y, text.length * fs * (mono ? 0.6 : 0.55), anchor, fs);
    if (o <= 0.01) return null;
    return (
      <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={fs} fontFamily={mono ? MONO : UI} opacity={o}>
        {text}
      </text>
    );
  };

  // ---- B9 crowded-low-end focus: labels near the 16,384 point fade while the camera is in ----
  const zoomIn = clamp01((cam.k - 1.04) / 0.2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <CanvasLayer state={s} draw={drawCells} />

      {/* ======================== screen-space labels riding the cells ======================== */}
      {shapeLbl > 0.01 && sh && (
        <g opacity={shapeLbl}>
          <Label x={topP[0]} y={topP[1] - 12} text={`${commas(sh.layers)} layers`} color={colors.TEXT} fs={15} mono />
          <Label x={baseP[0]} y={baseP[1] + 28} text={`${commas(sh.chains)} wide`} color={TEAL} fs={14} mono />
          {formI === 1 && (
            <g stroke={colors.MUTED} strokeWidth={1.2} opacity={0.8}>
              <line x1={baseP[0] - halfW} y1={baseP[1] + 10} x2={baseP[0] + halfW} y2={baseP[1] + 10} />
              <line x1={baseP[0] - halfW} y1={baseP[1] + 5} x2={baseP[0] - halfW} y2={baseP[1] + 15} />
              <line x1={baseP[0] + halfW} y1={baseP[1] + 5} x2={baseP[0] + halfW} y2={baseP[1] + 15} />
            </g>
          )}
          {formI >= 2 && (
            <Label x={baseP[0] + 24} y={(topP[1] + baseP[1]) / 2} anchor="start" fs={13} color={colors.MUTED}
              text={formI === 2 ? 'to scale: 16 sums per layer' : 'to scale: one sum per layer'} />
          )}
        </g>
      )}
      {lensU > 0.01 && (
        <g opacity={lensU}>
          <rect x={lensL[0]} y={lensL[1]} width={lensR[0] - lensL[0]} height={lensR[1] - lensL[1]} rx={4} fill="none" stroke={WARM} strokeWidth={2} />
          <Chip x={lensR[0] + 16} y={(lensL[1] + lensR[1]) / 2 + 5} text="one layer: what does it cost?" color={WARM} fs={14} />
          <Label x={lensL[0] - 16} y={(lensL[1] + lensR[1]) / 2 + 5} anchor="end" fs={13} color={colors.MUTED} text="16,384 sums" />
        </g>
      )}
      {chainLbl > 0.01 && (
        <g opacity={chainLbl * settled}>
          <line x1={chainTop[0]} y1={chainTop[1] - 4} x2={chainTop[0]} y2={chainTop[1] - 34} stroke={WARM} strokeWidth={1.4} />
          <Chip x={chainTop[0]} y={chainTop[1] - 40} anchor="middle" text="one chain: 64 sums, one per layer" color={WARM} fs={13} />
          <Label x={baseP[0] + shapeHalfW(64) + 12} y={baseP[1] - 100} anchor="start" fs={13} color={TEAL} text="256 chains" />
          <Label x={baseP[0] + shapeHalfW(64) + 12} y={baseP[1] - 82} anchor="start" fs={13} color={TEAL} text="side by side" />
        </g>
      )}
      {needleLbl > 0.01 && (
        <g opacity={needleLbl * settled}>
          <Chip x={baseP[0] - 24} y={(topP[1] + baseP[1]) / 2 + 5} anchor="end" text="one chain · 16,384 sums" color={WARM} fs={14} />
        </g>
      )}

      {/* ======================== B3 · the depth card ======================== */}
      {depCard > 0.01 && (
        <g opacity={depCard}>
          <circle cx={cornerP[0]} cy={cornerP[1]} r={cornerR} fill="none" stroke={colors.TEXT} strokeWidth={2} />
          <line x1={cornerP[0] + cornerR * 0.8} y1={cornerP[1] - cornerR * 0.6} x2={DC.x} y2={NODE_Y[1] + 10} stroke={colors.TEXT} strokeWidth={1.2} opacity={0.6} />
          <Label x={cornerP[0]} y={cornerP[1] + cornerR + 22} fs={13} color={WARM} text="chain 0, layers 1–3" />
          <rect x={DC.x} y={DC.y} width={DC.w} height={DC.h} rx={12} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
          <Label x={DC.x + 20} y={DC.y + 28} anchor="start" fs={15} color={colors.MUTED} text="a layer is a depth" />
          <MathLabel tex={'\\text{depth} = 1 + \\max(\\text{depths of its inputs})'} x={DC.x + DC.w / 2} y={DC.y + 64} fontSize={19} opacity={mathU} boxWidth={DC.w - 20} />
          {NODE_Y.map((y, d) => {
            const u = clamp01(depU - d + 1);
            if (u <= 0.01) return null;
            const isSum = d > 0;
            return (
              <g key={d} opacity={u}>
                {isSum && (
                  <>
                    {/* the fresh cell this sum reads */}
                    <rect x={SRC_X - 44} y={y + 26} width={88} height={28} rx={6} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
                    <text x={SRC_X} y={y + 45} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>cell · 0</text>
                    <Arrow x1={SRC_X - 46} y1={y + 36} x2={SUM_X + NODE_W / 2 + 4} y2={y + 8} color={colors.MUTED} u={clamp01(u * 1.4)} width={1.3} />
                    {/* the chain's previous total */}
                    <Arrow x1={SUM_X} y1={NODE_Y[d - 1] - NODE_H / 2 - 2} x2={SUM_X} y2={y + NODE_H / 2 + 4} color={WARM} u={clamp01(u * 1.4)} width={1.6} />
                  </>
                )}
                <rect x={SUM_X - NODE_W / 2} y={y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={8}
                  fill={isSum ? WARM : 'none'} fillOpacity={isSum ? 0.16 : 0} stroke={isSum ? WARM : colors.MUTED} strokeWidth={1.5} />
                <text x={SUM_X} y={y + 5} textAnchor="middle" fill={isSum ? WARM : colors.MUTED} fontSize={14} fontFamily={MONO}>
                  {isSum ? `sum · ${d}` : 'cell · 0'}
                </text>
                {isSum && (
                  <text x={DC.x + 22} y={y + 5} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={idxU > 0.01 ? 1 : 0.85}>
                    {`layers[${d - 1}]`}
                  </text>
                )}
              </g>
            );
          })}
          <Label x={SUM_X + NODE_W / 2 + 12} y={NODE_Y[0] + 5} anchor="start" fs={13} color={colors.MUTED} text="sources: depth 0" opacity={clamp01(depU)} />
          <Chip x={DC.x + DC.w / 2} y={DC.y + DC.h - 18} anchor="middle" text="const layerIndex = depth - 1" color={TEAL} mono opacity={idxU} />
        </g>
      )}

      {/* ======================== B4 · inside one layer ======================== */}
      {sweepOn > 0.01 && (
        <g opacity={sweepOn}>
          <rect x={stripL[0]} y={stripL[1]} width={stripW} height={STRIP.h * cam.k} fill="none" stroke={colors.MUTED} strokeWidth={1} />
          <rect x={stripL[0]} y={stripL[1]} width={stripW * (FLOOR.sources / PACKED_TOTAL)} height={STRIP.h * cam.k} fill={colors.MUTED} opacity={0.45} />
          <rect x={stripL[0] + stripW * (FLOOR.sources / PACKED_TOTAL)} y={stripL[1]} width={stripW * (fillU - FLOOR.sources / PACKED_TOTAL)} height={STRIP.h * cam.k} fill={TEAL} />
          <Label x={stripL[0]} y={stripL[1] + STRIP.h * cam.k + 20} anchor="start" fs={13} mono color={colors.TEXT} text="packedValues" />
          <Label x={stripL[0] + 120} y={stripL[1] + STRIP.h * cam.k + 20} anchor="start" fs={13} color={colors.MUTED} text={`${commas(FLOOR.sources)} sources`} />
          <Label x={stripL[0] + stripW} y={stripL[1] + STRIP.h * cam.k + 20} anchor="end" fs={13} color={TEAL}
            text={`+ ${commas(FLOOR.chains)} outputs per layer · ${commas(Math.round(FLOOR.chains * Math.min(64, sweep)))} written`} />
          {sweep > 0 && done < 64 && (
            <g>
              <Arrow x1={rowP[0] - 30} y1={stripL[1] - 4} x2={rowP[0] - 30} y2={rowP[1] + 4} color={colors.TEXT} u={stage >= 1 ? 1 : 0} width={1.4} />
              <Arrow x1={rowP[0] - 16} y1={rowP[1] + 4} x2={rowP[0] - 16} y2={stripL[1] - 4} color={TEAL} u={stage >= 3 ? 1 : 0} width={1.4} />
              <Label x={rowP[0] - 40} y={rowP[1] + 5} anchor="end" fs={13} mono color={colors.TEXT} text={`layer ${showLayer}`} />
            </g>
          )}
        </g>
      )}
      {sweepCard > 0.01 && (
        <g opacity={sweepCard}>
          <rect x={40} y={88} width={1200} height={118} rx={10} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
          {[
            { n: 1, label: 'copy in', line: 'input[column] = packedValues[layer.inputIndices[column]]' },
            { n: 2, label: 'sparse sums', line: 'value = Math.fround(value + product)' },
            { n: 3, label: 'copy back', line: 'packedValues[availableValues + row] = projection[row]' },
          ].map((r, i) => {
            const on = stage === r.n;
            const y = 116 + i * 32;
            return (
              <g key={r.n} opacity={stage === 0 || on ? 1 : 0.35}>
                {on && <rect x={52} y={y - 18} width={680} height={26} rx={5} fill={TEAL} opacity={0.12} />}
                <text x={62} y={y} fill={on ? TEAL : colors.MUTED} fontSize={13} fontFamily={UI}>{`${r.n} · ${r.label}`}</text>
                <text x={176} y={y} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{r.line}</text>
              </g>
            );
          })}
          <line x1={760} y1={100} x2={760} y2={194} stroke={colors.GRID} />
          <Label x={782} y={118} anchor="start" fs={14} mono color={colors.TEXT} text={`layer ${showLayer} of 64 · 256 sums`} />
          <Label x={782} y={146} anchor="start" fs={13} mono color={colors.MUTED}
            text={`fround(fround(${showLayer}/1024) + fround(1/1024))`} />
          <Label x={782} y={176} anchor="start" fs={15} mono color={WARM}
            text={`= ${showLayer + 1}/1024 = ${CHAIN_VALUE[showLayer]}`} />
        </g>
      )}

      <Camera {...cam}>
        {/* ======================== B5–B6 · tallies → processes ======================== */}
        {cardsU > 0.01 && cardsOp > 0.01 && (
          <g opacity={cardsOp}>
            {SHAPES.map((shp, i) => {
              const u = clamp01(cardsU - i);
              if (u <= 0.01) return null;
              const x = cardX(i);
              const y = CARD.y + (1 - u) * 18;
              const cu = clamp01(checkU - i);
              const procH = CARD.h + 70;
              return (
                <g key={i} opacity={u}>
                  {/* the process frame grows around the card */}
                  {procU > 0.01 && (
                    <g opacity={procU}>
                      <rect x={x - 12} y={y - 34} width={CARD.w + 24} height={procH + 34 * procU} rx={14} fill="none" stroke={VIOLET} strokeWidth={1.4} strokeDasharray="6 5" />
                      <Label x={x} y={y - 14} anchor="start" fs={13} color={VIOLET} text="its own process" />
                    </g>
                  )}
                  <rect x={x} y={y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                  <Label x={x + 18} y={y + 30} anchor="start" fs={15} mono color={colors.TEXT} text={`${commas(shp.layers)} layers`} />
                  <Label x={x + 18} y={y + 50} anchor="start" fs={13} color={TEAL} text={`${commas(shp.chains)} wide`} />
                  <ShapeGlyph x={x + CARD.w - 40} y={y + 52} L={shp.layers} />
                  <line x1={x + 16} y1={y + 66} x2={x + CARD.w - 16} y2={y + 66} stroke={colors.GRID} />
                  {[
                    `${commas(shp.inputReads)} input reads`,
                    `${commas(shp.outputs)} outputs`,
                    `${commas(shp.weights)} stored weights`,
                  ].map((t, r) => (
                    <text key={r} x={x + 18} y={y + 92 + r * 26} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{t}</text>
                  ))}
                  {cu > 0.01 && (
                    <g opacity={cu}>
                      <text x={x + 2} y={y + CARD.h + 30} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        {`fround(${commas(shp.layers + 1).replace(/,/g, '')}/1024)`}
                      </text>
                      <text x={x + 2} y={y + CARD.h + 52} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                        {`= ${shp.expected} ✓`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {[0, 1].map((i) => (
              <text key={i} x={cardX(i) + CARD.w + (CARD.dx - CARD.w) / 2} y={CARD.y + CARD.h / 2 + 12} textAnchor="middle"
                fill={colors.TEXT} fontSize={34} fontFamily={UI} opacity={eqU}>
                =
              </text>
            ))}
            <Chip x={640} y={CARD.y + CARD.h + 120 + 34 * procU} anchor="middle" fs={15} color={colors.TEXT}
              text="same totals, so the time difference tracks the layer count" opacity={tracksU} />
          </g>
        )}

        {/* ======================== B7–B9 · the chart ======================== */}
        {axisU > 0.01 && chartOp > 0.01 && (
          <g opacity={chartOp}>
            <line x1={AX.x0} y1={AX.y0} x2={lerp(AX.x0, AX.x1, axisU)} y2={AX.y0} stroke={colors.MUTED} strokeWidth={1.5} />
            <line x1={AX.x0} y1={AX.y0} x2={AX.x0} y2={lerp(AX.y0, AX.y1, axisU)} stroke={colors.MUTED} strokeWidth={1.5} />
            <g opacity={clamp01(axisU * 2 - 1)}>
              {[0, 100, 200, 300].map((v) => (
                <g key={v}>
                  <line x1={AX.x0 - 5} y1={YU(v)} x2={AX.x1} y2={YU(v)} stroke={colors.GRID} />
                  <CT x={AX.x0 - 10} y={YU(v) + 4} anchor="end" fill={colors.MUTED} fs={13} text={String(v)} />
                </g>
              ))}
              <CT x={AX.x0 - 10} y={AX.y1 - 14} anchor="end" fill={colors.MUTED} fs={13} mono={false} text="µs per evaluation" />
              {LAYER_COUNTS.map((L) => (
                <g key={L}>
                  <line x1={XL(L)} y1={AX.y0} x2={XL(L)} y2={AX.y0 + 6} stroke={colors.MUTED} />
                  <CT x={XL(L)} y={AX.y0 + 22} anchor="middle" fill={colors.TEXT} text={commas(L)} />
                  <ShapeGlyph x={XL(L) + (L === 64 ? 0 : 0)} y={AX.y0 + 72} L={L} opacity={0.8} />
                </g>
              ))}
              <CT x={AX.x1 + 10} y={AX.y0 + 5} fill={colors.MUTED} fs={13} mono={false} text="layers (log)" />
            </g>
            {/* the law */}
            {lawU > 0.01 && (
              <g>
                <path d={LAW_PATH} fill="none" stroke={TEAL} strokeWidth={2} strokeDasharray="1200" strokeDashoffset={1200 * (1 - lawU)} opacity={0.7} />
                <Chip x={XL(4096) - 40} y={YU(LAW_A + LAW_B * 4096) - 30} anchor="end" fs={15} color={TEAL} text="≈ 10 µs per 1,000 layers" opacity={clamp01(lawU * 2 - 1) * (1 - zoomIn)} />
              </g>
            )}
            {/* README ranges */}
            {README_US.map((r, i) => {
              const u = clamp01(readmeU - i);
              if (u <= 0.01) return null;
              const x = XL(r.layers);
              const label = `${r.lo}–${r.hi} µs`;
              return (
                <g key={i} opacity={u}>
                  <line x1={x} y1={YU(r.lo)} x2={x} y2={YU(r.hi)} stroke={TEAL} strokeWidth={2} />
                  <line x1={x - 6} y1={YU(r.lo)} x2={x + 6} y2={YU(r.lo)} stroke={TEAL} strokeWidth={2} />
                  <line x1={x - 6} y1={YU(r.hi)} x2={x + 6} y2={YU(r.hi)} stroke={TEAL} strokeWidth={2} />
                  <circle cx={x} cy={YU((r.lo + r.hi) / 2)} r={5 * (0.6 + 0.4 * u)} fill={TEAL} />
                  <CT x={x + 10} y={YU((r.lo + r.hi) / 2) + 22} fill={TEAL} text={label} />
                </g>
              );
            })}
            {/* this run */}
            {TODAY_US.map((r, i) => {
              const u = clamp01(todayU - i);
              if (u <= 0.01) return null;
              const x = XL(r.layers);
              return (
                <g key={i} opacity={u}>
                  <circle cx={x} cy={YU(r.us)} r={5 * (0.6 + 0.4 * u)} fill={VIOLET} />
                  <CT x={x + 12} y={YU(r.us) - 8} fill={VIOLET} text={`${r.us} µs`} />
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== B10 · the reading ======================== */}
        {quoteU > 0.01 && readOp > 0.01 && (
          <g opacity={readOp}>
            <g opacity={quoteU}>
              <rect x={150} y={104} width={980} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={150} y={104} width={4} height={92} rx={2} fill={colors.MUTED} />
              <text x={176} y={136} fill={colors.TEXT} fontSize={17} fontFamily={UI} fontStyle="italic">
                “A layer also has a cost of its own, about 10 µs per 1,000 layers,
              </text>
              <text x={176} y={162} fill={colors.TEXT} fontSize={17} fontFamily={UI} fontStyle="italic">
                for copying the values that it reads and the results that it writes”
              </text>
              <text x={1110} y={186} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>the docs</text>
            </g>
            <g opacity={tallyU}>
              <rect x={150} y={226} width={980} height={78} rx={12} fill={colors.PANEL} stroke={TEAL} strokeOpacity={0.6} />
              <text x={176} y={256} fill={TEAL} fontSize={14} fontFamily={UI}>copy volume, all three shapes</text>
              {LAYER_COUNTS.map((L, i) => (
                <ShapeGlyph key={L} x={830 + i * 50} y={262} L={L} />
              ))}
              <text x={176} y={286} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                {`${commas(FLOOR.inputReads)} reads · ${commas(FLOOR.outputs)} outputs · ${commas(FLOOR.weights)} weights · in each`}
              </text>
            </g>
            {arrowU > 0.01 && (
              <g>
                <Arrow x1={640} y1={312} x2={640} y2={376} color={colors.TEXT} u={arrowU} width={1.8} />
                <text x={656} y={350} fill={colors.MUTED} fontSize={14} fontFamily={UI} opacity={arrowU}>what changes: the layer count only (64 → 1,024 → 16,384)</text>
                <g opacity={clamp01(arrowU * 2 - 1)}>
                  <rect x={400} y={386} width={480} height={56} rx={12} fill={colors.PANEL} stroke={colors.TEXT} strokeOpacity={0.6} />
                  <text x={640} y={421} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={UI}>what grows: fixed work per layer</text>
                </g>
              </g>
            )}
            <Chip x={640} y={490} anchor="middle" fs={15} color={WARM} text="our inference · the lab doesn't test it" opacity={inferU} />
          </g>
        )}

        {/* ======================== B11 · 709 → 250 µs (historical) ======================== */}
        {barU > 0.01 && (
          <g opacity={clamp01(barU * 2)}>
            <text x={BAR.x} y={BAR.y - 56} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>16,384 layers · the same probe</text>
            {/* ghost of the old bar */}
            <rect x={BAR.x} y={BAR.y} width={OLD_US * BAR.scale * barU} height={BAR.h} rx={6} fill="none" stroke={colors.NEGATIVE} strokeOpacity={0.55} strokeDasharray="5 4" />
            <rect x={BAR.x} y={BAR.y} width={lerp(OLD_US, NEW_US, shrinkU) * BAR.scale * barU} height={BAR.h} rx={6}
              fill={shrinkU > 0.5 ? TEAL : colors.NEGATIVE} opacity={0.85} />
            <text x={BAR.x + OLD_US * BAR.scale * barU - 10} y={BAR.y - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO} opacity={clamp01(barU * 2 - 1)}>
              older executor · 709 µs
            </text>
            <g opacity={barLbl}>
              <text x={BAR.x + NEW_US * BAR.scale + 14} y={BAR.y + 28} fill={TEAL} fontSize={18} fontFamily={MONO}>250 µs</text>
              <text x={BAR.x} y={BAR.y + BAR.h + 36} fill={colors.TEXT} fontSize={15} fontFamily={UI}>
                after: an indexed copy of each layer's outputs instead of set on a new view
              </text>
              <text x={BAR.x} y={BAR.y + BAR.h + 62} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                historical figure from the lab's notes · same probe of 16,384 sums
              </text>
            </g>
          </g>
        )}
      </Camera>

          {/* scope stamps (screen space: they stay put through the chart push) */}
          <g opacity={readmeStamp * chartOp} display={readmeStamp * chartOp > 0.01 ? undefined : 'none'}>
            <rect x={STAMP_X} y={STAMP_Y - 4} width={300} height={24} rx={6} fill={colors.PANEL} stroke={TEAL} strokeOpacity={0.6} />
            <text x={STAMP_X + 12} y={STAMP_Y + 13} fill={TEAL} fontSize={13} fontFamily={MONO}>README · Bun 1.4.3 · M5 Max · load ≈ 4</text>
          </g>
          <g opacity={todayStamp * chartOp} display={todayStamp * chartOp > 0.01 ? undefined : 'none'}>
            <rect x={STAMP_X} y={STAMP_Y + 28} width={358} height={24} rx={6} fill={colors.PANEL} stroke={VIOLET} strokeOpacity={0.7} />
            <text x={STAMP_X + 12} y={STAMP_Y + 45} fill={VIOLET} fontSize={13} fontFamily={MONO}>this run · Bun 1.4.3 · M4 Max · load ≈ 9</text>
          </g>
          <g opacity={slopesU * chartOp} display={slopesU * chartOp > 0.01 ? undefined : 'none'}>
            <rect x={STAMP_X} y={STAMP_Y + 60} width={458} height={24} rx={6} fill={colors.PANEL} stroke={VIOLET} strokeOpacity={0.7} />
            <text x={STAMP_X + 12} y={STAMP_Y + 77} fill={VIOLET} fontSize={13} fontFamily={MONO}>
              {`slope ${SLOPE_A.toFixed(1)} (64→1,024) · ${SLOPE_B.toFixed(1)} (64→16,384) µs per 1,000`}
            </text>
          </g>

      {/* ======================== header (screen space) ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · What a layer costs by itself
      </text>
      {codeText && (
        <g>
          <rect x={40} y={46} width={codeText.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={50} y={62} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
            {codeText}
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
