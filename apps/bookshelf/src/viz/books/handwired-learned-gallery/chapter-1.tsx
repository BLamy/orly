// Photos from a sketch
//
// Learned Gallery — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/learned-gallery/README.md:5 (two ReGLU layers of 6 units → left, top, width, height), 9 (presets: Story 10,
//     Cinema 9, Contact sheet 11; edits continue from the current weights; preset/Retrain restart from the seed;
//     600 steps a second), 13 (Cheng: "the spirit of the gallery is to learn something"), 20 (the seeded pile),
//     39 (first fit: 679, 1,389 and 879 steps, i.e. 1.1, 2.3 and 1.5 s; 630-750 / 1,360-1,840 / 860-980)
//   src/learned-gallery/README.md:3 (a ReGLU unit; 244 source cells)
//   src/learned-gallery/learned-gallery.ts:15, 17 (learnedPhotoCount 12, learnedSlotCount 20), 45-52 (margins),
//     101-124 (createStoryLayout), 436 (slider 4% → reach 2%)
//   src/learned-gallery/trainable-geometry.ts:82 (geometryLossThreshold 0.08), 158-181 (parameter layout),
//     207-298 (the circuit: position, 10 features, reglu, emitDynamicProjection, four outputs), 306-377 (createRandom
//     and initializeParameters), 379 (minimumCostAssignment), 451-456 (robustLoss), 471-473 (seed 0x51_7a_9e,
//     learningRate 0.008), 575-586 (matchRectangles), 864-900 (trainOrUndo)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Computed here at module scope from the code's own formulas: the Story sketch, the slot
// positions and features, the seeded 244 weights (the code's LCG and init) and the network's forward pass for every
// slot (checked against the real run below), the weight counts and the Huber curve. Taken from one real run of the
// pinned code (scratch: .orly-work/hw-books/handwired-learned-gallery/ch1/run-fit.ts, bun, Story preset, reach 2%,
// trainOrUndo with 10-step frames): the op counts per depth, the photo rectangles and loss along the first fit, the
// fitted weights, the assignment, and a drag of Story's 10th rectangle into the empty cell. The weight cells and
// unit shading between the seeded and fitted weights are a visual blend of those two real endpoints. The race bars
// are the lab's one recorded run (LAB:39), not this run.
import { scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const relu = (x: number): number => Math.max(0, x);
const fmt2 = (v: number): string => (v < -0.005 ? '−' : '') + Math.abs(v).toFixed(2);
const fmt3 = (v: number): string => (v < -0.0005 ? '−' : '') + Math.abs(v).toFixed(3);

// ---------------------------------------------------------------------------
// The sketch: Story, from learned-gallery.ts (fractions of a 5 × 4 stage)
// ---------------------------------------------------------------------------

type Rect = [number, number, number, number]; // left, top, width, height
const MX = 0.036;
const GX = 0.02;
const MY = (MX * 5) / 4;
const GY = (GX * 5) / 4;
const gridCells = (left: number, top: number, width: number, height: number, cols: number, rows: number, n: number): Rect[] => {
  const cw = (width - GX * (cols - 1)) / cols;
  const ch = (height - GY * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, c) => [left + (c % cols) * (cw + GX), top + Math.floor(c / cols) * (ch + GY), cw, ch]);
};
const STORY: Rect[] = (() => {
  const heroW = 0.6;
  const heroH = 0.52;
  const lw = 1 - MX * 2;
  const lh = 1 - MY * 2;
  return [
    [MX, MY, heroW, heroH],
    ...gridCells(MX + heroW + GX, MY, lw - heroW - GX, heroH, 1, 2, 2),
    ...gridCells(MX, MY + heroH + GY, lw, lh - heroH - GY, 4, 2, 7),
  ];
})();
const EMPTY_CELL = gridCells(MX, MY + 0.52 + GY, 1 - MX * 2, 1 - MY * 2 - 0.52 - GY, 4, 2, 8)[7];

// ---------------------------------------------------------------------------
// The network, exactly as trainable-geometry.ts builds and seeds it
// ---------------------------------------------------------------------------

const SLOTS = 20;
const PHOTOS = 12;
const STORY_N = STORY.length; // 10
const HID = 6;
const FEATS = 2 + 4 * 2; // 10
const P = (() => {
  let o = 0;
  const a = (n: number) => ((o += n), o - n);
  return { l1w: a(HID * FEATS), l1b: a(HID), g1w: a(HID * FEATS), g1b: a(HID), l2w: a(HID * HID), l2b: a(HID), g2w: a(HID * HID), g2b: a(HID), ow: a(4 * HID), ob: a(4), size: o };
})();
const L1_COUNT = P.l2w; // 132
const L2_COUNT = P.ow - P.l2w; // 84
const OUT_COUNT = P.size - P.ow; // 28
if (P.size !== 244 || L1_COUNT !== 2 * (HID * FEATS + HID) || L2_COUNT !== 2 * (HID * HID + HID) || OUT_COUNT !== 4 * (HID + 1)) {
  throw new Error('parameter layout mismatch');
}

const SEED = 0x51_7a_9e;
const SEED_SOURCE: number[] = (() => {
  let state = SEED >>> 0;
  const random = () => ((state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0), state / 0x1_0000_0000);
  const signed = (scale: number) => (random() * 2 - 1) * scale;
  const s = new Float32Array(P.size);
  const firstScale = Math.sqrt(2 / (FEATS + HID));
  const hiddenScale = Math.sqrt(2 / (HID * 2));
  const outputScale = Math.sqrt(2 / (HID + 4));
  for (let n = 0; n < HID; n++) {
    for (let f = 0; f < FEATS; f++) {
      s[P.l1w + n * FEATS + f] = signed(firstScale);
      s[P.g1w + n * FEATS + f] = signed(firstScale);
    }
    s[P.l1b + n] = signed(0.1);
    s[P.g1b + n] = 1 + signed(0.05);
    for (let i = 0; i < HID; i++) {
      s[P.l2w + n * HID + i] = signed(hiddenScale);
      s[P.g2w + n * HID + i] = signed(hiddenScale);
    }
    s[P.l2b + n] = signed(0.1);
    s[P.g2b + n] = 1 + signed(0.05);
  }
  for (let f = 0; f < 4; f++) for (let i = 0; i < HID; i++) s[P.ow + f * HID + i] = signed(outputScale * 0.35);
  s[P.ob + 0] = 0.5;
  s[P.ob + 1] = 0.5;
  s[P.ob + 2] = 0.18;
  s[P.ob + 3] = 0.18;
  return Array.from(s);
})();

const position = (slot: number): number => (slot / (SLOTS - 1)) * 2 - 1;
const FEATURE_NAMES = ['1', 'position', 'sin π·1·p', 'cos π·1·p', 'sin π·2·p', 'cos π·2·p', 'sin π·3·p', 'cos π·3·p', 'sin π·4·p', 'cos π·4·p'];
const features = (p: number): number[] => {
  const out = [1, p];
  for (let k = 1; k <= 4; k++) out.push(Math.sin(Math.PI * k * p), Math.cos(Math.PI * k * p));
  return out;
};

type Forward = { feats: number[]; a1: number[]; b1: number[]; h1: number[]; h2: number[]; out: number[] };
const forward = (src: readonly number[], slot: number): Forward => {
  const feats = features(position(slot));
  const a1: number[] = [];
  const b1: number[] = [];
  const h1: number[] = [];
  for (let n = 0; n < HID; n++) {
    let a = src[P.l1b + n];
    let b = src[P.g1b + n];
    for (let f = 0; f < FEATS; f++) {
      a += src[P.l1w + n * FEATS + f] * feats[f];
      b += src[P.g1w + n * FEATS + f] * feats[f];
    }
    a1.push(a);
    b1.push(b);
    h1.push(a * relu(b));
  }
  const h2: number[] = [];
  for (let n = 0; n < HID; n++) {
    let a = src[P.l2b + n];
    let b = src[P.g2b + n];
    for (let i = 0; i < HID; i++) {
      a += src[P.l2w + n * HID + i] * h1[i];
      b += src[P.g2w + n * HID + i] * h1[i];
    }
    h2.push(a * relu(b));
  }
  const out = [0, 1, 2, 3].map((f) => {
    let v = src[P.ob + f];
    for (let i = 0; i < HID; i++) v += src[P.ow + f * HID + i] * h2[i];
    return v;
  });
  return { feats, a1, b1, h1, h2, out };
};

// ---------------------------------------------------------------------------
// One real run of the pinned code (see header): Story's first fit, 10-step frames
// ---------------------------------------------------------------------------

const FIT_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 140, 200, 300, 680];
const FIT_RECTS: number[][][] = [
  [[0.4835,0.4476,0.2228,0.2643], [0.4577,0.4492,0.257,0.2757], [0.4862,0.4761,0.179,0.2186], [0.5089,0.5338,0.1335,0.1257], [0.4677,0.5722,0.1828,0.0466], [0.3386,0.5307,0.2302,0.0316], [0.3399,0.4971,0.2411,0.1045], [0.4173,0.4417,0.2235,0.2223], [0.4913,0.4147,0.1518,0.2669], [0.5116,0.5069,0.1586,0.196]],
  [[0.7834,0.4226,0.3236,0.1569], [0.7392,0.513,0.3151,0.1664], [0.5625,0.5355,0.2438,0.1991], [0.3602,0.6185,0.2301,0.2401], [0.2412,0.7624,0.214,0.2346], [0.0039,0.7511,0.2249,0.1995], [0.072,0.5074,0.2583,0.1623], [0.3976,0.1412,0.3803,0.1921], [0.6332,0.0963,0.3628,0.2087], [0.5562,0.567,0.2112,0.2111]],
  [[0.705,0.3482,0.2867,0.1921], [0.6712,0.5477,0.2256,0.1686], [0.4784,0.5569,0.2214,0.195], [0.2737,0.5748,0.2545,0.2228], [0.2802,0.7475,0.2177,0.2003], [0.092,0.8027,0.2304,0.1739], [0.0266,0.6226,0.2413,0.1752], [0.2479,0.1344,0.3821,0.2778], [0.5799,0.0018,0.3801,0.2616], [0.5185,0.8115,0.1845,0.1601]],
  [[0.6504,0.3151,0.3303,0.2915], [0.7238,0.6041,0.2367,0.1978], [0.5518,0.6064,0.1952,0.1769], [0.2531,0.5738,0.2366,0.2181], [0.261,0.7641,0.2183,0.1908], [0.0654,0.7929,0.2325,0.1672], [-0.0073,0.5767,0.2794,0.2499], [0.1816,0.0707,0.4618,0.4588], [0.5969,-0.0048,0.3549,0.3163], [0.5517,0.8438,0.1641,0.076]],
  [[0.6584,0.3231,0.3086,0.2585], [0.7538,0.5869,0.2004,0.1597], [0.5392,0.5997,0.1894,0.159], [0.2761,0.5942,0.2236,0.1845], [0.2704,0.7867,0.2073,0.1691], [0.0564,0.7917,0.2202,0.139], [-0.0192,0.548,0.2892,0.2381], [0.1357,0.0685,0.4999,0.4676], [0.6532,0.0375,0.3336,0.271], [0.5285,0.8117,0.1884,0.0986]],
  [[0.6593,0.3214,0.3189,0.2484], [0.7474,0.5775,0.2139,0.1735], [0.5021,0.5761,0.2073,0.1689], [0.2803,0.5821,0.2255,0.1753], [0.2772,0.7811,0.2126,0.179], [0.0647,0.8059,0.2039,0.1268], [-0.0001,0.5693,0.2866,0.2163], [0.0636,0.0613,0.5753,0.485], [0.6497,0.0376,0.3505,0.2554], [0.5081,0.786,0.21,0.1439]],
  [[0.6493,0.3158,0.3102,0.2432], [0.7522,0.5946,0.2201,0.171], [0.518,0.5885,0.1989,0.1674], [0.2765,0.5904,0.2103,0.1765], [0.2704,0.7734,0.221,0.1919], [0.0553,0.808,0.1831,0.1214], [0.0238,0.5801,0.2564,0.2017], [0.0399,0.0435,0.5925,0.5145], [0.6533,0.0436,0.3093,0.2367], [0.517,0.78,0.2204,0.1714]],
  [[0.6582,0.3183,0.3024,0.2415], [0.7463,0.5948,0.219,0.1692], [0.5153,0.5886,0.2032,0.172], [0.2763,0.5863,0.2141,0.1832], [0.2719,0.7661,0.2289,0.1974], [0.0501,0.8061,0.187,0.1293], [0.0258,0.5921,0.2285,0.1763], [0.0275,0.0439,0.6003,0.5247], [0.6541,0.0406,0.3123,0.2539], [0.5082,0.7805,0.2271,0.1847]],
  [[0.6549,0.319,0.307,0.247], [0.7437,0.5879,0.2219,0.1739], [0.5179,0.5883,0.2049,0.1703], [0.2762,0.589,0.2116,0.1757], [0.2672,0.7719,0.2326,0.1972], [0.0437,0.8025,0.2021,0.1435], [0.0281,0.5897,0.2262,0.1709], [0.0322,0.046,0.5994,0.5174], [0.6566,0.0451,0.3067,0.2485], [0.5069,0.7793,0.2172,0.1747]],
  [[0.6561,0.3185,0.3093,0.2467], [0.7465,0.5911,0.2159,0.1665], [0.5151,0.5897,0.2074,0.1686], [0.2754,0.589,0.211,0.1715], [0.267,0.7745,0.2309,0.1937], [0.0411,0.7934,0.2118,0.1546], [0.0334,0.588,0.225,0.173], [0.0396,0.0464,0.5948,0.518], [0.656,0.0426,0.3124,0.2495], [0.513,0.7881,0.215,0.165]],
  [[0.6548,0.3165,0.312,0.2495], [0.7475,0.5917,0.2162,0.1669], [0.5123,0.5897,0.2105,0.1696], [0.2759,0.5896,0.2098,0.1689], [0.2679,0.775,0.2286,0.1899], [0.0371,0.7895,0.2145,0.16], [0.0325,0.5904,0.2225,0.1723], [0.0382,0.0455,0.5971,0.5194], [0.6534,0.0453,0.3108,0.2484], [0.5116,0.7883,0.215,0.1637]],
  [[0.6561,0.3171,0.3082,0.2485], [0.747,0.5907,0.2169,0.1684], [0.51,0.589,0.2171,0.1714], [0.2742,0.5906,0.2143,0.169], [0.2721,0.7817,0.219,0.1765], [0.0374,0.7871,0.2145,0.1664], [0.0343,0.589,0.2203,0.1714], [0.0361,0.0454,0.6001,0.5191], [0.6562,0.0445,0.308,0.2482], [0.5097,0.7858,0.2177,0.1684]],
  [[0.6568,0.3163,0.3069,0.249], [0.7459,0.5904,0.2182,0.1691], [0.5098,0.5905,0.2174,0.1691], [0.2731,0.5904,0.217,0.169], [0.2738,0.7851,0.2155,0.1699], [0.0356,0.784,0.2177,0.1719], [0.0362,0.5908,0.2165,0.1685], [0.0358,0.045,0.6006,0.5203], [0.6567,0.045,0.3072,0.2479], [0.5097,0.7846,0.2176,0.1707]],
  [[0.6567,0.3158,0.3073,0.2499], [0.7457,0.5904,0.2183,0.1692], [0.51,0.5906,0.2171,0.1689], [0.2732,0.5904,0.2167,0.1691], [0.2731,0.785,0.2167,0.1701], [0.0357,0.7846,0.2175,0.1707], [0.036,0.5905,0.2169,0.1691], [0.0359,0.0453,0.6004,0.5205], [0.6567,0.0454,0.3073,0.2468], [0.5101,0.7846,0.2168,0.1708]],
  [[0.6566,0.316,0.3073,0.2495], [0.7459,0.5905,0.218,0.169], [0.5099,0.5905,0.2172,0.169], [0.2731,0.5905,0.2168,0.169], [0.2731,0.7847,0.2167,0.1706], [0.0359,0.7847,0.2171,0.1706], [0.0359,0.5905,0.2171,0.169], [0.0359,0.0452,0.6004,0.5204], [0.6566,0.0452,0.3073,0.2472], [0.5099,0.7847,0.2172,0.1706]],
];
// loss (distance from the sketch + misalignment) after every 10-step frame, steps 0..680
const FIT_LOSS = [0.013, 0.00371, 0.00127, 0.000645, 0.000307, 0.000134, 0.0000553, 0.0000337, 0.0000163, 0.00000897, 0.00000564, 0.00000317, 0.00000182, 0.00000102, 6.12e-7, 3.82e-7, 3.31e-7, 2.06e-7, 1.08e-7, 1.13e-7, 1.98e-7, 2.49e-7, 2.18e-7, 1.83e-7, 1.71e-7, 1.76e-7, 1.73e-7, 1.62e-7, 1.54e-7, 1.56e-7, 1.47e-7, 1.38e-7, 1.33e-7, 1.34e-7, 1.28e-7, 1.22e-7, 1.16e-7, 1.11e-7, 1.11e-7, 1.06e-7, 1.02e-7, 1e-7, 9.83e-8, 9.83e-8, 9.63e-8, 9.54e-8, 9.47e-8, 9.41e-8, 9.36e-8, 9.36e-8, 9.32e-8, 9.31e-8, 9.32e-8, 9.34e-8, 9.42e-8, 9.42e-8, 9.4e-8, 9.4e-8, 9.44e-8, 9.49e-8, 9.49e-8, 9.5e-8, 9.54e-8, 9.58e-8, 9.63e-8, 9.63e-8, 9.65e-8, 9.69e-8, 9.72e-8];
const LAST_STEP = 680;
// matchRectangles from step 10 on: sketch rectangle i is fitted by photo FIT_MATCH[i]
const FIT_MATCH = [7, 8, 0, 6, 3, 2, 1, 5, 4, 9];
const FITTED_SOURCE = [0.11291, -0.30013, 0.28363, -0.097684, 0.022476, 0.061583, -0.26101, -0.45927, -0.043478, -0.44054, 0.12674, -0.041759, 0.033118, 0.32103, -0.22695, 0.0046958, 0.28216, 0.44419, 0.32762, -0.054469, -0.26301, -0.15331, -0.024678, 0.1341, -0.36194, -0.18817, -0.15699, -0.38816, 0.26627, 0.096126, -0.14447, -0.0085539, -0.018567, -0.23779, -0.2052, 0.30592, 0.16324, 0.036865, 0.25348, 0.044269, -0.25392, -0.30412, 0.29891, 0.12237, -0.018846, 0.29025, -0.18511, -0.025322, -0.40543, -0.10426, 0.047421, 0.2223, 0.087128, 0.35092, 0.061659, -0.12992, 0.013083, 0.29082, -0.30194, -0.28799, 0.068204, 0.05437, 0.07915, 0.025979, -0.059049, 0.096197, 0.2089, 0.31496, 0.093379, 0.30331, -0.28149, 0.27969, -0.081717, -0.098081, -0.56082, 0.1138, -0.24051, 0.15985, 0.12644, 0.44853, 0.038488, -0.11351, -0.19047, 0.17637, 0.21185, 0.28357, 0.20077, 0.22872, 0.29391, 0.24581, -0.22443, 0.35875, 0.069699, -0.31687, -0.24101, -0.17905, 0.24022, -0.27352, -0.1218, -0.33426, -0.046292, -0.19104, 0.1001, -0.20397, 0.10057, -0.31896, 0.34562, -0.3216, -0.11817, 0.39718, -0.4532, -0.18933, -0.36449, 0.21594, 0.053203, 0.20621, 0.029078, 0.24135, 0.043353, -0.17767, 0.36161, 0.17137, -0.24104, 0.10392, 0.37612, -0.44568, 0.98824, 0.89625, 0.98786, 0.84639, 1.0841, 0.93286, 0.37574, -0.215, 0.29357, 0.0081044, -0.058765, 0.37454, 0.42356, 0.16931, -0.34263, 0.31121, 0.4614, 0.37254, 0.18456, -0.37823, 0.36941, -0.24414, 0.39422, -0.38616, -0.22901, -0.10419, -0.54789, -0.12251, 0.045084, 0.11745, 0.1003, -0.0012325, -0.5363, 0.17562, 0.21586, -0.44946, 0.089014, 0.060982, 0.16966, -0.15933, -0.38594, 0.46102, 0.095893, -0.087465, -0.059499, -0.073218, 0.0096278, -0.065209, 0.20709, -0.019717, -0.096751, -0.07145, -0.33935, 0.077573, 0.063518, -0.44098, -0.14157, -0.19258, 0.2509, -0.079971, -0.15535, 0.39436, -0.023553, 0.24287, 0.06231, 0.36012, 0.52001, -0.24794, -0.034826, -0.38666, 0.47552, -0.19705, 0.31118, -0.19125, -0.097684, 0.0061125, 0.27177, -0.040946, 0.0082003, 0.060607, 0.20885, -0.024268, -0.19989, 0.22259, 0.97856, 1.077, 0.99308, 0.97804, 1.0236, 1.0608, -0.029965, 0.053094, 0.14715, 0.081351, 0.19674, -0.22017, -0.15133, -0.18049, -0.18293, 0.18855, -0.018352, -0.0090254, 0.046404, 0.010982, -0.068568, -0.20947, -0.13434, -0.082543, 0.041721, 0.0083565, -0.065252, -0.19248, -0.12614, -0.077012, 0.49308, 0.53008, 0.22609, 0.17679];
// after the fit: Story's rectangle 9 slides into the empty cell over 12 frames (10 steps each), training goes on.
// [sketch left, photo left, photo top, photo width, photo height] per frame
const DRAG = [
  [0.51, 0.5099, 0.7847, 0.2172, 0.1706], [0.5297, 0.5219, 0.7847, 0.2164, 0.1698], [0.5495, 0.5432, 0.7865, 0.2184, 0.1706],
  [0.5692, 0.5791, 0.7862, 0.2184, 0.1706], [0.589, 0.5791, 0.7862, 0.2184, 0.1706], [0.6087, 0.6144, 0.7868, 0.2205, 0.1689],
  [0.6285, 0.6355, 0.7847, 0.2189, 0.1698], [0.6482, 0.6557, 0.7859, 0.2171, 0.1695], [0.668, 0.6605, 0.7854, 0.224, 0.1735],
  [0.6877, 0.6875, 0.783, 0.2239, 0.169], [0.7075, 0.6875, 0.783, 0.2239, 0.169], [0.7272, 0.7423, 0.7858, 0.2239, 0.1666],
  [0.747, 0.7457, 0.7849, 0.2186, 0.1714], [0.747, 0.7448, 0.7853, 0.2181, 0.1721], [0.747, 0.7448, 0.7853, 0.2181, 0.1721],
  [0.747, 0.747, 0.7848, 0.2164, 0.1706], [0.747, 0.747, 0.7846, 0.2167, 0.1698], [0.747, 0.7461, 0.7847, 0.2172, 0.1708],
  [0.747, 0.7466, 0.7844, 0.2171, 0.1708], [0.747, 0.7465, 0.7847, 0.2174, 0.1709], [0.747, 0.7465, 0.7847, 0.2174, 0.1709],
  [0.747, 0.7463, 0.7847, 0.2175, 0.1709], [0.747, 0.7465, 0.7847, 0.2174, 0.1709], [0.747, 0.7464, 0.7846, 0.2175, 0.1708],
  [0.747, 0.7464, 0.7846, 0.2175, 0.1709],
];
// op counts per depth of the compiled program (reglu, affine), from the same run: 6,320 = 4,080 + 2,240 in 8 layers
const OPS_BY_DEPTH: Array<[number, number]> = [[120, 0], [2880, 0], [0, 1440], [0, 240], [120, 0], [960, 0], [0, 480], [0, 80]];
const OPS_TOTAL = OPS_BY_DEPTH.reduce((s, [r, a]) => s + r + a, 0);
if (OPS_TOTAL !== 6320) throw new Error('op count mismatch');

// the seeded forward pass reproduces the run's pile; the fitted weights reproduce its fit
const SEED_FWD = Array.from({ length: SLOTS }, (_, k) => forward(SEED_SOURCE, k));
const FIT_FWD = Array.from({ length: SLOTS }, (_, k) => forward(FITTED_SOURCE, k));
for (let k = 0; k < STORY_N; k++) {
  for (let f = 0; f < 4; f++) {
    if (Math.abs(SEED_FWD[k].out[f] - FIT_RECTS[0][k][f]) > 2e-3) throw new Error(`seed forward mismatch at slot ${k}`);
    if (Math.abs(FIT_FWD[k].out[f] - FIT_RECTS[FIT_RECTS.length - 1][k][f]) > 4e-3) throw new Error(`fitted forward mismatch at slot ${k}`);
  }
}

const TRACE = 7; // the traced slot: position −0.263; after the fit it draws the large rectangle (FIT_MATCH[0] = 7)
// the spotlit first-layer unit: the one whose output for slot 7 is largest
const UNIT = SEED_FWD[TRACE].h1.reduce((best, v, i, arr) => (Math.abs(v) > Math.abs(arr[best]) ? i : best), 0);

const fitRectsAt = (step: number): number[][] => {
  if (step <= 0) return FIT_RECTS[0];
  if (step >= LAST_STEP) return FIT_RECTS[FIT_RECTS.length - 1];
  let i = 0;
  while (FIT_STEPS[i + 1] < step) i++;
  const u = (step - FIT_STEPS[i]) / (FIT_STEPS[i + 1] - FIT_STEPS[i]);
  return FIT_RECTS[i].map((r, k) => r.map((v, f) => lerp(v, FIT_RECTS[i + 1][k][f], u)));
};
const lossAt = (step: number): number => {
  const x = clamp01(step / LAST_STEP) * (FIT_LOSS.length - 1);
  const i = Math.min(FIT_LOSS.length - 2, Math.floor(x));
  return Math.pow(10, lerp(Math.log10(FIT_LOSS[i]), Math.log10(FIT_LOSS[i + 1]), x - i));
};

// Huber loss of one edge's error (robustLoss)
const THRESH = 0.08;
const huber = (e: number): number => (Math.abs(e) <= THRESH ? 0.5 * e * e : THRESH * (Math.abs(e) - 0.5 * THRESH));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const STG = { x: 830, y: 140, w: 410, h: 328 }; // 5 × 4
const sx = (f: number) => STG.x + f * STG.w;
const sy = (f: number) => STG.y + f * STG.h;

const AX = { x0: 50, x1: 270, y: 300 };
const slotX = (slot: number) => lerp(AX.x0, AX.x1, slot / (SLOTS - 1));

const FEAT = { lx: 300, zx: 432, half: 38, y0: 170, dy: 28 };
const featY = (i: number) => FEAT.y0 + i * FEAT.dy;
const L1X = 565;
const L2X = 670;
const unitY = (j: number) => 190 + j * 42;
const OUTB = { x: 720, len: 70, y0: 215, dy: 50 };
const OUT_NAMES = ['left', 'top', 'width', 'height'];

const GRID = { y: 518, cell: 11, pitch: 13, blocks: [{ x: 60, cols: 22, rows: 6 }, { x: 376, cols: 14, rows: 6 }, { x: 588, cols: 7, rows: 4 }] };
const BLOCK_START = [0, L1_COUNT, L1_COUNT + L2_COUNT];
const BLOCK_N = [L1_COUNT, L2_COUNT, OUT_COUNT];
const BLOCK_LABEL = [`${L1_COUNT} = 2×(6×10+6)`, `${L2_COUNT} = 2×(6×6+6)`, `${OUT_COUNT} = 4×(6+1)`];
const MAXW = Math.max(...SEED_SOURCE.map(Math.abs), ...FITTED_SOURCE.map(Math.abs));

const OPS = { x: 300, y: 100, w: 490, h: 18 };
const LOSSP = { x0: 900, x1: 1240, y0: 504, y1: 590 };
const lossX = scaleLinear([0, LAST_STEP], [LOSSP.x0, LOSSP.x1]);
const lossY = scaleLinear([-1.5, -7.3], [LOSSP.y0, LOSSP.y1]);
const LOSS_PATH_PTS = FIT_LOSS.map((l, i) => [lossX(i * 10), lossY(Math.log10(l))] as const);

const HUB = { x: 470, y: 150, w: 330, h: 196 };
const hubX = scaleLinear([-0.4, 0.4], [HUB.x + 28, HUB.x + HUB.w - 22]);
const hubY = scaleLinear([0, 0.03], [HUB.y + 160, HUB.y + 46]);

const RACE = { x: 296, y: 156, w: 504, h: 204 };
const raceX = scaleLinear([0, 2000], [RACE.x + 20, RACE.x + 320]);
const PRESETS = [
  { name: 'Story', rects: 10, steps: 679, lo: 630, hi: 750, s: '1.1 s' },
  { name: 'Cinema', rects: 9, steps: 1389, lo: 1360, hi: 1840, s: '2.3 s' },
  { name: 'Contact sheet', rects: 11, steps: 879, lo: 860, hi: 980, s: '1.5 s' },
];

const PHOTO_COLORS = ['#7aa2f7', '#e0af68', '#9ece6a', '#bb9af7', '#7dcfff', '#f7768e', '#73daca', '#ff9e64', '#c0caf5', '#e6c07b'];
const slotColor = (k: number): string => (k < STORY_N ? PHOTO_COLORS[k] : k < PHOTOS ? colors.MUTED : '#3b4658');

const CAM_STAGE: CameraState = { x: 1035, y: 300, k: 1.45 };
const CAM_SLOTS: CameraState = { x: 340, y: 290, k: 1.4 };
const CAM_FEAT: CameraState = { x: 440, y: 290, k: 1.4 };
const CAM_UNITS: CameraState = { x: 600, y: 320, k: 1.35 };
const CAM_MATCH: CameraState = { x: 905, y: 290, k: 1.3 };
const CAM_DRAG: CameraState = { x: 1035, y: 330, k: 1.3 };
const W = 0.12; // a whisper: competing layers while something else is spotlit

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, each paced at ~150 words a minute plus a short hold
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'You sketch ten rectangles on a stage, and ten photos should land in them. Here a small fixed program draws the layout, and training adjusts its weights until the photos fit.',
  'This is the learned gallery from Handwired. Its author wanted the layout learned, not coded, so it comes out of weighted sums and relu, which keeps positive numbers and zeroes the rest.',
  'The program has twenty output slots, and the page uses up to twelve of them, one per photo. A slot is only a position along a line, from minus one to plus one.',
  "Each position becomes ten fixed features: a constant, the position itself, and a sine and a cosine at each of four frequencies. They're computed once, when the program is built.",
  'Two layers follow, six gated units each. A gated unit multiplies one weighted sum by the relu of another, so each one is a small branch built from arithmetic.',
  "Four weighted sums at the end read the second layer. They give the slot's left edge, top edge, width and height. Twenty slots in, twenty rectangles out.",
  'Count the weights: a hundred thirty-two in the first layer, eighty-four in the second, twenty-eight at the output. That\'s two hundred forty-four, and each one is a source cell.',
  'Unrolled, the whole program is 6,320 operations in eight layers. Its shape never changes. Only those two hundred forty-four numbers move.',
  'From the seeded starting weights, the photos sit in a pile. Training takes steps with a method called Adam, nudging every weight to shrink the gap between photo edges and sketch edges.',
  "Each sketch rectangle is paired with a photo by cheapest total matching, then scored edge by edge. Big misses count linearly, so one far-off edge can't dominate.",
  'Pick a preset and the first fit stops after 679 steps for Story, 1,389 for Cinema and 879 for Contact sheet, in one run. That\'s about one, two and one and a half seconds.',
  'Edit the sketch afterward and training continues from the current weights, so a photo follows its rectangle. A preset or the Retrain button starts over from the seeded weights.',
];
const speakDur = (text: string): number => +(text.split(/\s+/).length / 2.5 + 0.4).toFixed(1);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STAGE, cameraInterp);

  const stageU = tl.channel('stageU', 0);
  const ghostsU = tl.channel('ghostsU', 0);
  const stageLbl = tl.channel('stageLbl', 0);
  const stageOp = tl.channel('stageOp', 1);
  const skelU = tl.channel('skeletonU', 0);
  const recapU = tl.channel('recapU', 0);
  const reluDraw = tl.channel('reluDraw', 0);
  const reluTex = tl.channel('reluTex', 0);
  const axisU = tl.channel('axisU', 0);
  const slotColU = tl.channel('slotColU', 0);
  const slotLbl = tl.channel('slotLbl', 0);
  const markerU = tl.channel('markerU', 0);
  const slotSel = tl.channel('slotSel', 0);
  const posLbl = tl.channel('posLbl', 0);
  const featU = tl.channel('featU', 0);
  const featFormula = tl.channel('featFormula', 0);
  const edges1U = tl.channel('edges1U', 0);
  const l1U = tl.channel('l1U', 0);
  const unitU = tl.channel('unitInset', 0);
  const edges2U = tl.channel('edges2U', 0);
  const l2U = tl.channel('l2U', 0);
  const edges3U = tl.channel('edges3U', 0);
  const outU = tl.channel('outU', 0);
  const rectU = tl.channel('slotRectU', 0);
  const fanU = tl.channel('fanU', 0);
  const fanOp = tl.channel('fanOp', 1);
  const fanLbl = tl.channel('fanLbl', 0);
  const valOp = tl.channel('valueTextOp', 1);
  const pipeOp = tl.channel('pipeOp', 1);
  const b1U = tl.channel('block1U', 0);
  const b2U = tl.channel('block2U', 0);
  const b3U = tl.channel('block3U', 0);
  const sumU = tl.channel('sumU', 0);
  const cellLbl = tl.channel('cellLbl', 0);
  const gridOp = tl.channel('gridOp', 1);
  const opsU = tl.channel('opsU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const moveGlow = tl.channel('moveGlow', 0);
  const photosU = tl.channel('photosU', 0);
  const seedLbl = tl.channel('seedLbl', 0);
  const lossU = tl.channel('lossU', 0);
  const adamLbl = tl.channel('adamLbl', 0);
  const fitStep = tl.channel('fitStep', 0);
  const matchU = tl.channel('matchU', 0);
  const matchLbl = tl.channel('matchLbl', 0);
  const hubU = tl.channel('huberU', 0);
  const pairU = tl.channel('pairU', 0);
  const raceU = tl.channel('raceU', 0);
  const racePanel = tl.channel('racePanel', 0);
  const raceS = tl.channel('raceSeconds', 0);
  const dragF = tl.channel('dragFrame', 0);
  const editLbl = tl.channel('editLbl', 0);
  const btnU = tl.channel('retrainBtn', 0);
  const pressU = tl.channel('retrainPress', 0);
  const resetU = tl.channel('resetU', 0);
  const resetLbl = tl.channel('resetLbl', 0);
  const axisOp = tl.channel('axisOp', 1);
  const lossOp = tl.channel('lossOp', 1);

  let T = 0.4;
  const say = (i: number): number => {
    const at = T;
    const dur = speakDur(CAPTIONS[i]);
    tl.caption({ at, dur, text: CAPTIONS[i] });
    T = tl.hold(at + dur, 0.6);
    return at;
  };

  // — B1 · the sketch: ten dashed rectangles on a 5 × 4 stage —
  let a = say(0);
  tl.tween(stageU, 1, { at: a + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(ghostsU, 1, { at: a + 1.2, dur: 1.8, ease: ease.linear });
  tl.tween(stageLbl, 1, { at: a + 2.6, dur: 0.6, ease: ease.enter });

  // — B2 · wide: the program's outline, weighted sums + relu —
  a = say(1);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(skelU, 1, { at: a + 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(recapU, 1, { at: a + 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(reluDraw, 1, { at: a + 6.4, dur: 1.0, ease: ease.draw });
  tl.tween(reluTex, 1, { at: a + 8.6, dur: 0.6, ease: ease.enter });

  // — B3 · twenty slots on a line from −1 to +1; the marker scans and rests on slot 7 —
  a = say(2);
  tl.tween(cam, CAM_SLOTS, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(recapU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(stageOp, W, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(axisU, 1, { at: a + 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(slotColU, 1, { at: a + 2.2, dur: 1.0, ease: ease.linear });
  tl.tween(slotLbl, 1, { at: a + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(markerU, 1, { at: a + 5.6, dur: 0.5, ease: ease.enter });
  tl.tween(slotSel, 19, { at: a + 5.8, dur: 2.4, ease: ease.linear });
  tl.tween(slotSel, TRACE, { at: a + 8.4, dur: 1.0, ease: ease.move });
  tl.tween(posLbl, 1, { at: a + 9.4, dur: 0.6, ease: ease.enter });

  // — B4 · ten fixed features of slot 7's position —
  a = say(3);
  tl.tween(cam, CAM_FEAT, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(featU, 1, { at: a + 0.6, dur: 3.2, ease: ease.linear });
  tl.tween(featFormula, 1, { at: a + 4.6, dur: 0.6, ease: ease.enter });

  // — B5 · two layers of six gated units; one unit opened up —
  a = say(4);
  tl.tween(cam, CAM_UNITS, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(edges1U, 1, { at: a + 0.3, dur: 1.2, ease: ease.draw });
  tl.tween(l1U, 1, { at: a + 0.9, dur: 1.0, ease: ease.linear });
  tl.tween(axisOp, W, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(unitU, 1, { at: a + 3.4, dur: 0.7, ease: ease.enter });
  tl.tween(unitU, 0, { at: a + 7.8, dur: 0.5, ease: ease.move });
  tl.tween(edges2U, 1, { at: a + 8.2, dur: 1.0, ease: ease.draw });
  tl.tween(l2U, 1, { at: a + 8.8, dur: 1.0, ease: ease.linear });

  // — B6 · four outputs draw the slot's rectangle; all twenty slots fan out —
  a = say(5);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(axisOp, 1, { at: a + 1.0, dur: 0.6, ease: ease.move });
  tl.tween(stageOp, 1, { at: a + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(edges3U, 1, { at: a + 0.3, dur: 1.0, ease: ease.draw });
  tl.tween(outU, 1, { at: a + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(rectU, 1, { at: a + 3.4, dur: 1.2, ease: ease.draw });
  tl.tween(slotSel, 0, { at: a + 6.6, dur: 0.6, ease: ease.move });
  tl.tween(slotSel, 19, { at: a + 7.2, dur: 2.6, ease: ease.linear });
  tl.tween(fanU, SLOTS, { at: a + 7.2, dur: 2.6, ease: ease.linear });
  tl.tween(fanLbl, 1, { at: a + 8.6, dur: 0.6, ease: ease.enter });
  tl.tween(slotSel, TRACE, { at: a + 10.0, dur: 0.8, ease: ease.move });

  // — B7 · the 244 weights as source cells, block by block —
  a = say(6);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(valOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(fanLbl, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(stageOp, W, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(posLbl, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(b1U, 1, { at: a + 1.0, dur: 1.4, ease: ease.linear });
  tl.tween(b2U, 1, { at: a + 3.6, dur: 1.0, ease: ease.linear });
  tl.tween(b3U, 1, { at: a + 5.6, dur: 0.6, ease: ease.linear });
  tl.tween(sumU, 1, { at: a + 7.6, dur: 0.6, ease: ease.pop });
  tl.tween(cellLbl, 1, { at: a + 10.2, dur: 0.6, ease: ease.enter });

  // — B8 · 6,320 operations in 8 layers; the shape is fixed, only the 244 move —
  a = say(7);
  tl.tween(featFormula, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(opsU, 1, { at: a + 0.4, dur: 1.4, ease: ease.draw });
  tl.tween(fixedU, 1, { at: a + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(moveGlow, 1, { at: a + 6.0, dur: 0.5, ease: ease.pop });
  tl.tween(moveGlow, 0.35, { at: a + 7.4, dur: 0.6, ease: ease.move });

  // — B9 · seeded weights: the pile; Adam starts stepping —
  a = say(8);
  tl.tween(opsU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(fixedU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(moveGlow, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cellLbl, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(sumU, 0.6, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(stageOp, 1, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(pipeOp, W, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(rectU, 0, { at: a + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(photosU, 1, { at: a + 0.6, dur: 1.0, ease: ease.enter });
  tl.tween(fanOp, 0, { at: a + 1.0, dur: 0.8, ease: ease.move });
  tl.tween(seedLbl, 1, { at: a + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(lossU, 1, { at: a + 4.4, dur: 1.0, ease: ease.draw });
  tl.tween(adamLbl, 1, { at: a + 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(fitStep, 30, { at: a + 6.4, dur: 5.2, ease: ease.linear });

  // — B10 · matching, then one edge scored by the Huber loss —
  a = say(9);
  tl.tween(cam, CAM_MATCH, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(adamLbl, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(pipeOp, 0.08, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(gridOp, W, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(lossOp, W, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(matchU, 1, { at: a + 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(matchLbl, 1, { at: a + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(matchU, 0, { at: a + 4.4, dur: 0.6, ease: ease.move });
  tl.tween(hubU, 1, { at: a + 4.4, dur: 1.2, ease: ease.draw });
  tl.tween(pairU, 1, { at: a + 4.8, dur: 0.6, ease: ease.enter });
  tl.tween(fitStep, 60, { at: a + 6.4, dur: 3.4, ease: ease.linear });

  // — B11 · three presets: first-fit steps from the lab's one run —
  a = say(10);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(hubU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(pairU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(matchLbl, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(gridOp, 1, { at: a + 1.0, dur: 0.6, ease: ease.move });
  tl.tween(lossOp, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(racePanel, 1, { at: a + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(raceU, 1, { at: a + 2.2, dur: 1.0, ease: ease.move });
  tl.tween(raceU, 2, { at: a + 4.0, dur: 1.0, ease: ease.move });
  tl.tween(raceU, 3, { at: a + 5.6, dur: 1.0, ease: ease.move });
  tl.tween(raceS, 1, { at: a + 9.0, dur: 0.6, ease: ease.enter });
  tl.tween(fitStep, LAST_STEP, { at: a + 0.4, dur: 9.0, ease: ease.move });

  // — B12 · edit: the photo follows; Retrain: back to the pile —
  a = say(11);
  tl.tween(racePanel, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_DRAG, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(gridOp, W, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(lossOp, W, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(editLbl, 1, { at: a + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(dragF, DRAG.length - 1, { at: a + 1.2, dur: 3.6, ease: ease.linear });
  tl.tween(btnU, 1, { at: a + 5.6, dur: 0.5, ease: ease.enter });
  tl.tween(pressU, 1, { at: a + 6.6, dur: 0.25, ease: ease.pop });
  tl.tween(pressU, 0, { at: a + 6.9, dur: 0.5, ease: ease.move });
  tl.tween(editLbl, 0, { at: a + 6.6, dur: 0.4, ease: ease.move });
  tl.tween(resetU, 1, { at: a + 6.8, dur: 1.4, ease: ease.move });
  tl.tween(resetLbl, 1, { at: a + 7.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: T - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(pipeOp, 1, { at: T + 0.9, dur: 0.6, ease: ease.move });
  tl.tween(btnU, 0, { at: T - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(gridOp, 1, { at: T + 0.9, dur: 0.6, ease: ease.move });
  tl.tween(lossOp, 0, { at: T - 0.2, dur: 0.6, ease: ease.move });
  tl.hold(T, 2.6);

  return {
    tl, cam, stageU, ghostsU, stageLbl, stageOp, skelU, recapU, reluDraw, reluTex, axisU, slotColU, slotLbl, markerU,
    slotSel, posLbl, featU, featFormula, edges1U, l1U, unitU, edges2U, l2U, edges3U, outU, rectU, fanU, fanOp, fanLbl,
    valOp, pipeOp, b1U, b2U, b3U, sumU, cellLbl, gridOp, opsU, fixedU, moveGlow, photosU, seedLbl, lossU, adamLbl,
    fitStep, matchU, matchLbl, hubU, pairU, raceU, racePanel, raceS, dragF, editLbl, btnU, pressU, resetU, resetLbl, axisOp, lossOp,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function Txt({ x, y, children, size = 13, fill = colors.MUTED, anchor = 'start', mono = true, weight, opacity = 1 }: {
  x: number; y: number; children: string; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontFamily={mono ? MONO : undefined} fontWeight={weight} opacity={opacity} xmlSpace="preserve">
      {children}
    </text>
  );
}

/** Violet hockey stick: flat to the middle, then a 45° rise. (x, y) is the bottom-left. */
function ReluGlyph({ x, y, w = 22, reveal = 1, opacity = 1 }: { x: number; y: number; w?: number; reveal?: number; opacity?: number }) {
  if (opacity <= 0.005 || reveal <= 0) return null;
  const len = w / 2 + (w / 2) * Math.SQRT2;
  return (
    <path
      d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`}
      fill="none"
      stroke={colors.SECONDARY}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len}
      strokeDashoffset={len * (1 - clamp01(reveal))}
      opacity={opacity}
    />
  );
}

const signColor = (v: number): string => (v >= 0 ? colors.ACCENT : colors.NEGATIVE);
const rectOf = (r: readonly number[]) => ({ x: sx(r[0]), y: sy(r[1]), w: Math.max(0, r[2] * STG.w), h: Math.max(0, r[3] * STG.h) });

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const stageOp = v(scene.stageOp);
  const pipeOp = v(scene.pipeOp);
  const skel = v(scene.skelU);
  const valOp = v(scene.valOp);

  // the traced slot's live state: continuous position while scanning, the blended weights while training
  const sel = v(scene.slotSel);
  const fit = v(scene.fitStep);
  const reset = v(scene.resetU);
  const wU = clamp01(fit / 100) * (1 - reset); // seeded → fitted weights (visual blend of the two real endpoints)
  const selK = Math.round(sel);
  const nearInt = Math.abs(sel - selK) < 0.04;
  const p = position(sel);
  const feats = features(p);
  const fwd = SEED_FWD[selK];
  const fwdFit = FIT_FWD[selK];
  const h1 = fwd.h1.map((x, i) => lerp(x, fwdFit.h1[i], wU));
  const h2 = fwd.h2.map((x, i) => lerp(x, fwdFit.h2[i], wU));
  const weights = SEED_SOURCE.map((x, i) => lerp(x, FITTED_SOURCE[i], wU));

  // photos on the stage
  const drag = v(scene.dragF);
  const dragI = Math.min(DRAG.length - 2, Math.floor(drag));
  const dragRow = DRAG[dragI].map((x, i) => lerp(x, DRAG[dragI + 1][i], drag - dragI));
  const dragging = drag > 0.001;
  const fitRects = fitRectsAt(fit);
  const photoRects = fitRects.map((r, k) => {
    const live = k === 9 && dragging ? dragRow.slice(1) : r;
    return reset > 0 ? live.map((x, f) => lerp(x, SEED_FWD[k].out[f], reset)) : live;
  });
  const ghostRects: Rect[] = STORY.map((g, i) => (i === 9 && dragging ? [dragRow[0], g[1], g[2], g[3]] : g));
  const traceOut = fit > 0 || reset > 0 ? photoRects[TRACE] : fwd.out;

  const ghostsU = v(scene.ghostsU);
  const photosU = v(scene.photosU);
  const fanU = v(scene.fanU);
  const fanOp = v(scene.fanOp);
  const rectU = v(scene.rectU);
  const matchU = v(scene.matchU);
  const hubU = v(scene.hubU);
  const pairU = v(scene.pairU);
  const lossU = v(scene.lossU);
  const gridOp = v(scene.gridOp);

  // Huber pair: the large rectangle's left edge against its photo's (photo 7)
  const pairErr = photoRects[TRACE][0] - STORY[0][0];
  const heroMidY = sy(STORY[0][1] + STORY[0][3] * 0.62);

  const stepShown = Math.round(fit * (1 - reset));
  const lossShown = lossAt(fit * (1 - reset));
  const lossDrawTo = Math.max(0, fit) * (1 - reset);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="lg1-stage">
          <rect x={STG.x} y={STG.y} width={STG.w} height={STG.h} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the stage: Story's ghosts, slot rectangles, photos ================= */}
        <g opacity={stageOp}>
          {v(scene.stageU) > 0.005 && (
            <rect
              x={STG.x}
              y={STG.y}
              width={STG.w}
              height={STG.h}
              rx={4}
              fill={colors.PANEL}
              fillOpacity={0.55 * v(scene.stageU)}
              stroke={colors.GRID}
              strokeWidth={1.5}
              strokeDasharray={2 * (STG.w + STG.h)}
              strokeDashoffset={2 * (STG.w + STG.h) * (1 - v(scene.stageU))}
            />
          )}
          <Txt x={STG.x} y={STG.y - 12} opacity={v(scene.stageLbl)}>
            stage 5 × 4 · Story · 10 rectangles
          </Txt>
          {/* ghosts: the sketch */}
          {ghostRects.map((g, i) => {
            const u = staggerU(ghostsU, i, STORY_N, 0.1, 0.5);
            if (u <= 0.005) return null;
            const r = rectOf(g);
            const lit = i === 0 && pairU > 0.01;
            return (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={3} fill="none" stroke={lit ? colors.TEXT : colors.MUTED} strokeWidth={lit ? 2 : 1.5} strokeDasharray="6 5" opacity={u * (i === 9 && dragging ? 1 : 0.9)} />
            );
          })}
          {/* the empty cell (room for a click to add a rectangle) */}
          {ghostsU > 0.95 && (
            <rect {...(() => { const r = rectOf(EMPTY_CELL); return { x: r.x, y: r.y, width: r.w, height: r.h }; })()} rx={3} fill="none" stroke={colors.GRID} strokeDasharray="2 6" opacity={0.5 * (1 - photosU * 0.5)} />
          )}
          <g clipPath="url(#lg1-stage)">
            {/* the twenty slot rectangles from the seeded weights (fan-out) */}
            {fanOp > 0.005 &&
              SEED_FWD.map((f, k) => {
                const u = clamp01((fanU - k) * 1.5);
                if (u <= 0.005) return null;
                const r = rectOf(f.out);
                return <rect key={k} x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill="none" stroke={slotColor(k)} strokeWidth={1.4} opacity={u * fanOp * (k < STORY_N ? 0.9 : 0.6)} />;
              })}
            {/* photos: one per Story rectangle, outputs 0..9 */}
            {photosU > 0.005 &&
              photoRects.map((pr, k) => {
                const r = rectOf(pr);
                const spot = (k === TRACE && pairU > 0.01) || (k === 9 && dragging && reset < 0.5);
                return (
                  <g key={k} opacity={photosU}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill={PHOTO_COLORS[k]} fillOpacity={0.22} stroke={PHOTO_COLORS[k]} strokeWidth={spot ? 2.6 : 1.5} />
                  </g>
                );
              })}
          </g>
          {/* the traced slot's rectangle */}
          {rectU > 0.005 && (() => {
            const r = rectOf(traceOut);
            const per = 2 * (r.w + r.h);
            return (
              <g>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={2} fill={PHOTO_COLORS[TRACE]} fillOpacity={0.25 * rectU} stroke={colors.TEXT} strokeWidth={2.2} strokeDasharray={per} strokeDashoffset={per * (1 - rectU)} />
                <Txt x={r.x + r.w / 2} y={r.y - 8} anchor="middle" fill={colors.TEXT} opacity={clamp01(rectU * 2 - 1) * (1 - clamp01(fanU - 1))}>
                  slot 7
                </Txt>
              </g>
            );
          })()}
          <Txt x={STG.x + STG.w / 2} y={STG.y + STG.h + 26} anchor="middle" size={14} fill={colors.TEXT} opacity={v(scene.fanLbl)}>
            20 slots in → 20 rectangles out
          </Txt>
          <Txt x={STG.x + STG.w} y={STG.y - 12} anchor="end" fill={colors.WARM} opacity={v(scene.seedLbl) * (1 - clamp01(v(scene.btnU) * 2))}>
            seed 0x51_7a_9e
          </Txt>
          <Txt x={STG.x} y={STG.y - 36} fill={colors.TEXT} opacity={v(scene.adamLbl)}>
            Adam · learningRate 0.008
          </Txt>
          {/* matching lines: each sketch rectangle → its paired photo */}
          {matchU > 0.005 &&
            STORY.map((g, i) => {
              const gr = rectOf(g);
              const pr = rectOf(photoRects[FIT_MATCH[i]]);
              const x1 = gr.x + gr.w / 2, y1 = gr.y + gr.h / 2;
              const x2 = pr.x + pr.w / 2, y2 = pr.y + pr.h / 2;
              const u = staggerU(matchU, i, STORY_N, 0.06, 0.5);
              return (
                <g key={i} opacity={Math.min(1, matchU * 3)}>
                  <line x1={x1} y1={y1} x2={lerp(x1, x2, u)} y2={lerp(y1, y2, u)} stroke={PHOTO_COLORS[FIT_MATCH[i]]} strokeWidth={2} />
                  <circle cx={x1} cy={y1} r={3.5} fill={colors.TEXT} />
                </g>
              );
            })}
          <Txt x={STG.x} y={STG.y - 36} fill={colors.TEXT} opacity={v(scene.matchLbl)}>
            matching: 'assignment'
          </Txt>
          {/* the scored pair: the large rectangle's left edge vs photo 7's */}
          {pairU > 0.005 && (() => {
            const gx = sx(STORY[0][0]);
            const px = sx(photoRects[TRACE][0]);
            return (
              <g opacity={pairU}>
                <line x1={gx} y1={heroMidY - 26} x2={gx} y2={heroMidY + 26} stroke={colors.TEXT} strokeWidth={2.5} />
                <line x1={px} y1={heroMidY - 26} x2={px} y2={heroMidY + 26} stroke={PHOTO_COLORS[TRACE]} strokeWidth={2.5} />
                {Math.abs(px - gx) > 3 && <line x1={gx} y1={heroMidY} x2={px} y2={heroMidY} stroke={colors.WARM} strokeWidth={2} />}
                <Txt x={Math.max(gx, px) + 8} y={heroMidY + 5} fill={colors.WARM} size={14}>
                  {`e = ${fmt3(pairErr)}`}
                </Txt>
              </g>
            );
          })()}
          <Txt x={STG.x} y={STG.y - 36} fill={colors.TEXT} opacity={v(scene.editLbl)}>
            edit: continues from current weights
          </Txt>
          <Txt x={STG.x} y={STG.y - 36} fill={colors.WARM} opacity={v(scene.resetLbl)}>
            Retrain: back to the seeded weights
          </Txt>
          {v(scene.btnU) > 0.005 && (
            <g opacity={v(scene.btnU)}>
              <rect x={1140} y={92} width={100} height={28} rx={6} fill={v(scene.pressU) > 0.05 ? colors.WARM : colors.PANEL} fillOpacity={0.25 + 0.6 * v(scene.pressU)} stroke={colors.WARM} strokeWidth={1.5} />
              <Txt x={1190} y={111} anchor="middle" size={14} fill={colors.TEXT}>
                Retrain
              </Txt>
            </g>
          )}
          {/* loss under the stage, log scale */}
          {lossU * v(scene.lossOp) > 0.005 && (
            <g opacity={lossU * v(scene.lossOp)}>
              <line x1={LOSSP.x0} y1={LOSSP.y1} x2={LOSSP.x1} y2={LOSSP.y1} stroke={colors.MUTED} strokeWidth={1} />
              <line x1={LOSSP.x0} y1={LOSSP.y0} x2={LOSSP.x0} y2={LOSSP.y1} stroke={colors.MUTED} strokeWidth={1} />
              {[-2, -4, -6].map((e) => (
                <g key={e}>
                  <line x1={LOSSP.x0 - 4} y1={lossY(e)} x2={LOSSP.x1} y2={lossY(e)} stroke={colors.GRID} strokeWidth={1} opacity={0.6} />
                  <Txt x={LOSSP.x0 - 7} y={lossY(e) + 4} anchor="end" size={12}>{`1e${e}`}</Txt>
                </g>
              ))}
              {[0, 340, 680].map((st) => (
                <Txt key={st} x={lossX(st)} y={LOSSP.y1 + 16} anchor="middle" size={12}>{String(st)}</Txt>
              ))}
              <Txt x={LOSSP.x0} y={LOSSP.y0 - 10} size={13}>
                loss, log scale
              </Txt>
              <Txt x={LOSSP.x1} y={LOSSP.y0 - 10} anchor="end" size={13} fill={colors.TEXT}>
                {`step ${stepShown} · ${lossShown.toExponential(1).replace('e-', 'e−')}`}
              </Txt>
              {lossDrawTo > 0.01 && (
                <polyline
                  points={LOSS_PATH_PTS.filter((_, i) => i * 10 <= lossDrawTo).map((pt) => pt.join(',')).concat([`${lossX(lossDrawTo)},${lossY(Math.log10(lossAt(lossDrawTo)))}`]).join(' ')}
                  fill="none"
                  stroke={colors.ACCENT}
                  strokeWidth={2.2}
                />
              )}
              <circle cx={lossX(lossDrawTo)} cy={lossY(Math.log10(lossShown))} r={4} fill={colors.ACCENT} />
            </g>
          )}
        </g>

        {/* ================= the pipeline: slot → features → 2 × 6 ReGLU → 4 outputs ================= */}
        <g opacity={pipeOp}>
          {/* column headers (the skeleton) */}
          <g opacity={skel}>
            <Txt x={AX.x0 - 10} y={150} fill={colors.TEXT} opacity={v(scene.axisOp)}>20 slots</Txt>
            <Txt x={FEAT.lx} y={150} fill={colors.TEXT}>10 features</Txt>
            <Txt x={L1X} y={146} anchor="middle" fill={colors.TEXT}>layer 1</Txt>
            <Txt x={L1X} y={162} anchor="middle" size={12}>6 ReGLU units</Txt>
            <Txt x={L2X} y={146} anchor="middle" fill={colors.TEXT}>layer 2</Txt>
            <Txt x={L2X} y={162} anchor="middle" size={12}>6 ReGLU units</Txt>
            <Txt x={OUTB.x} y={150} fill={colors.TEXT}>4 outputs</Txt>
            {/* outlines before the beats fill them */}
            <line x1={AX.x0} y1={AX.y} x2={AX.x1} y2={AX.y} stroke={colors.GRID} strokeWidth={1.5} opacity={1 - v(scene.axisU)} />
            {Array.from({ length: FEATS }, (_, i) => (
              <line key={i} x1={FEAT.zx - FEAT.half} y1={featY(i)} x2={FEAT.zx + FEAT.half} y2={featY(i)} stroke={colors.GRID} strokeWidth={1} opacity={1 - v(scene.featU)} />
            ))}
            {Array.from({ length: HID }, (_, j) => (
              <g key={j}>
                <circle cx={L1X} cy={unitY(j)} r={13} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={1 - v(scene.l1U)} />
                <circle cx={L2X} cy={unitY(j)} r={13} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={1 - v(scene.l2U)} />
              </g>
            ))}
            {OUT_NAMES.map((_, i) => (
              <rect key={i} x={OUTB.x} y={OUTB.y0 + i * OUTB.dy - 6} width={OUTB.len} height={12} rx={2} fill="none" stroke={colors.GRID} opacity={1 - v(scene.outU)} />
            ))}
          </g>

          {/* weighted sums + relu (recap) */}
          {v(scene.recapU) > 0.005 && (
            <g opacity={v(scene.recapU)}>
              <rect x={330} y={62} width={420} height={74} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <Txt x={350} y={89} size={15} fill={colors.TEXT}>learned gallery · weighted sums + relu</Txt>
              <ReluGlyph x={712} y={92} w={24} reveal={v(scene.reluDraw)} />
              <MathLabel tex={'\\mathrm{relu}(x)=\\max(0,x)'} x={540} y={114} fontSize={20} color={colors.SECONDARY} opacity={v(scene.reluTex)} boxWidth={400} />
            </g>
          )}

          {/* slot axis */}
          {v(scene.axisU) > 0.005 && (() => {
            const ax = v(scene.axisU);
            const col = v(scene.slotColU);
            const m = v(scene.markerU);
            return (
              <g opacity={v(scene.axisOp)}>
                <line x1={AX.x0} y1={AX.y} x2={lerp(AX.x0, AX.x1, clamp01(ax * 1.2))} y2={AX.y} stroke={colors.MUTED} strokeWidth={2} />
                {Array.from({ length: SLOTS }, (_, k) => {
                  const u = staggerU(ax, k, SLOTS, 0.03, 0.4);
                  const cu = staggerU(col, k, SLOTS, 0.03, 0.3);
                  return (
                    <g key={k} opacity={u}>
                      <line x1={slotX(k)} y1={AX.y - 6} x2={slotX(k)} y2={AX.y + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                      <circle cx={slotX(k)} cy={AX.y - 13} r={4.2} fill={k < PHOTOS ? slotColor(k) : 'none'} fillOpacity={cu * (k < STORY_N ? 1 : 0.5)} stroke={slotColor(k)} strokeWidth={1.2} />
                    </g>
                  );
                })}
                {[['−1', 0], ['0', 9.5], ['+1', 19]].map(([t, k]) => (
                  <Txt key={t as string} x={slotX(k as number)} y={AX.y + 24} anchor="middle" opacity={ax}>{t as string}</Txt>
                ))}
                <Txt x={AX.x0 - 10} y={232} fill={colors.TEXT} opacity={v(scene.slotLbl)}>slotCount = 20</Txt>
                <Txt x={AX.x0 - 10} y={252} fill={colors.TEXT} opacity={v(scene.slotLbl)}>photoCount = 12</Txt>
                <Txt x={AX.x0 - 10} y={340} size={12} opacity={v(scene.slotLbl)}>10 Story · 2 free · 8 unused</Txt>
                {m > 0.005 && (
                  <g opacity={m}>
                    <path d={`M ${slotX(sel)} ${AX.y - 22} l -6 -10 l 12 0 Z`} fill={colors.TEXT} />
                    <line x1={slotX(sel)} y1={AX.y - 8} x2={slotX(sel)} y2={AX.y + 8} stroke={colors.TEXT} strokeWidth={2.5} />
                  </g>
                )}
                <g opacity={v(scene.posLbl)}>
                  <Txt x={AX.x0 - 10} y={372} size={14} fill={colors.TEXT}>{`slot ${selK} → position ${nearInt ? fmt3(position(selK)) : fmt3(p)}`}</Txt>
                  <Txt x={AX.x0 - 10} y={394}>position =</Txt>
                  <Txt x={AX.x0 - 10} y={412}>item/(slotCount-1)*2-1</Txt>
                </g>
              </g>
            );
          })()}

          {/* the ten features of the selected position */}
          {v(scene.featU) > 0.005 &&
            feats.map((val, i) => {
              const u = staggerU(v(scene.featU), i, FEATS, 0.15, 0.6);
              if (u <= 0.005) return null;
              const w = val * FEAT.half * u;
              return (
                <g key={i} opacity={clamp01(u * 2)}>
                  <Txt x={FEAT.lx} y={featY(i) + 4} size={12}>{FEATURE_NAMES[i]}</Txt>
                  <line x1={FEAT.zx} y1={featY(i) - 9} x2={FEAT.zx} y2={featY(i) + 9} stroke={colors.GRID} strokeWidth={1} />
                  <rect x={Math.min(FEAT.zx, FEAT.zx + w)} y={featY(i) - 7} width={Math.abs(w)} height={14} rx={2} fill={i === 0 ? colors.MUTED : colors.ACCENT} fillOpacity={0.85} />
                  <Txt x={FEAT.zx + FEAT.half + 6} y={featY(i) + 4} size={12} opacity={valOp}>{fmt2(val)}</Txt>
                </g>
              );
            })}
          <g opacity={v(scene.featFormula)}>
            <Txt x={FEAT.lx} y={100} fill={colors.TEXT}>[1, position, sin(πk·position), cos(πk·position)]</Txt>
            <Txt x={FEAT.lx} y={120}>k = 1..4 · computed once, at build</Txt>
          </g>

          {/* edges, coloured by the (blended) left-sum weights */}
          {v(scene.edges1U) > 0.005 && (
            <g opacity={v(scene.edges1U)}>
              {Array.from({ length: HID }, (_, n) =>
                Array.from({ length: FEATS }, (_, f) => {
                  const w = weights[P.l1w + n * FEATS + f];
                  return <line key={`${n}-${f}`} x1={518} y1={featY(f)} x2={L1X - 14} y2={unitY(n)} stroke={signColor(w)} strokeWidth={1} opacity={(0.08 + 0.4 * Math.abs(w) / MAXW) * (n === UNIT && v(scene.unitU) > 0.5 ? 2 : 1)} />;
                }),
              )}
            </g>
          )}
          {v(scene.edges2U) > 0.005 && (
            <g opacity={v(scene.edges2U)}>
              {Array.from({ length: HID }, (_, n) =>
                Array.from({ length: HID }, (_, i) => {
                  const w = weights[P.l2w + n * HID + i];
                  return <line key={`${n}-${i}`} x1={L1X + 14} y1={unitY(i)} x2={L2X - 14} y2={unitY(n)} stroke={signColor(w)} strokeWidth={1} opacity={0.08 + 0.4 * Math.abs(w) / MAXW} />;
                }),
              )}
            </g>
          )}
          {v(scene.edges3U) > 0.005 && (
            <g opacity={v(scene.edges3U)}>
              {Array.from({ length: 4 }, (_, f) =>
                Array.from({ length: HID }, (_, i) => {
                  const w = weights[P.ow + f * HID + i];
                  return <line key={`${f}-${i}`} x1={L2X + 14} y1={unitY(i)} x2={OUTB.x - 2} y2={OUTB.y0 + f * OUTB.dy} stroke={signColor(w)} strokeWidth={1} opacity={0.08 + 0.6 * Math.abs(w) / MAXW} />;
                }),
              )}
            </g>
          )}

          {/* the two ReGLU layers */}
          {[{ x: L1X, vals: h1, u: v(scene.l1U) }, { x: L2X, vals: h2, u: v(scene.l2U) }].map((layer, li) => {
            if (layer.u <= 0.005) return null;
            const mx = Math.max(...layer.vals.map(Math.abs), 1e-6);
            return (
              <g key={li}>
                {layer.vals.map((val, j) => {
                  const u = staggerU(layer.u, j, HID, 0.1, 0.4);
                  const spot = li === 0 && j === UNIT && v(scene.unitU) > 0.01;
                  return (
                    <g key={j} opacity={u}>
                      <circle cx={layer.x} cy={unitY(j)} r={13} fill={signColor(val)} fillOpacity={0.15 + 0.7 * Math.abs(val) / mx} stroke={spot ? colors.TEXT : signColor(val)} strokeWidth={spot ? 2.5 : 1.2} />
                      {li === 0 && <Txt x={layer.x + 17} y={unitY(j) + 4} size={12} opacity={valOp}>{fmt2(val)}</Txt>}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* one gated unit, opened up: a · relu(b) */}
          {v(scene.unitU) > 0.005 && (() => {
            const f7 = SEED_FWD[TRACE];
            const A = f7.a1[UNIT], B = f7.b1[UNIT], H = f7.h1[UNIT];
            const bars = [
              { name: 'a', val: A, c: colors.ACCENT },
              { name: 'relu(b)', val: relu(B), c: colors.SECONDARY },
              { name: 'a·relu(b)', val: H, c: colors.TEXT },
            ];
            const sc = 60 / Math.max(...bars.map((b) => Math.abs(b.val)), 1e-6);
            const IX = 628, IY = 178;
            return (
              <g opacity={v(scene.unitU)}>
                <rect x={IX} y={IY} width={300} height={160} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <Txt x={IX + 16} y={IY + 24} fill={colors.TEXT}>{`layer 1 · unit ${UNIT + 1} · slot 7`}</Txt>
                <MathLabel tex={'a\\cdot\\mathrm{relu}(b)'} x={IX + 16} y={IY + 48} fontSize={18} anchor="start" opacity={1} boxWidth={200} />
                {bars.map((b, i) => (
                  <g key={b.name}>
                    <Txt x={IX + 16} y={IY + 84 + i * 26} size={13}>{b.name}</Txt>
                    <line x1={IX + 108} y1={IY + 72 + i * 26} x2={IX + 108} y2={IY + 90 + i * 26} stroke={colors.GRID} />
                    <rect x={Math.min(IX + 108, IX + 108 + b.val * sc)} y={IY + 74 + i * 26} width={Math.abs(b.val * sc)} height={14} rx={2} fill={b.c} fillOpacity={0.85} />
                    <Txt x={IX + 180} y={IY + 85 + i * 26} size={13} fill={colors.TEXT}>{fmt3(b.val)}</Txt>
                  </g>
                ))}
                <ReluGlyph x={IX + 240} y={IY + 110} w={34} />
                <Txt x={IX + 257} y={IY + 132} anchor="middle" size={12}>{`b = ${fmt2(B)}`}</Txt>
              </g>
            );
          })()}

          {/* four outputs of the traced slot */}
          {v(scene.outU) > 0.005 &&
            OUT_NAMES.map((name, i) => {
              const u = staggerU(v(scene.outU), i, 4, 0.2, 0.6);
              const val = traceOut[i];
              const y = OUTB.y0 + i * OUTB.dy;
              return (
                <g key={name} opacity={u}>
                  <Txt x={OUTB.x} y={y - 10} size={12} fill={colors.TEXT}>{`${name} ${val.toFixed(3)}`}</Txt>
                  <rect x={OUTB.x} y={y - 6} width={OUTB.len} height={12} rx={2} fill="none" stroke={colors.GRID} />
                  <rect x={OUTB.x} y={y - 6} width={OUTB.len * clamp01(val) * u} height={12} rx={2} fill={PHOTO_COLORS[TRACE]} fillOpacity={0.9} />
                </g>
              );
            })}
          {/* outputs → the stage */}
          {rectU > 0.005 && (() => {
            const r = rectOf(traceOut);
            return <path d={`M ${OUTB.x + OUTB.len + 4} ${OUTB.y0 + 1.5 * OUTB.dy} C ${800} ${OUTB.y0 + 1.5 * OUTB.dy}, ${r.x - 30} ${r.y + r.h / 2}, ${r.x} ${r.y + r.h / 2}`} fill="none" stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="4 4" opacity={rectU * 0.7} />;
          })()}

          {/* 6,320 operations in 8 layers */}
          {v(scene.opsU) > 0.005 && (() => {
            const u = v(scene.opsU);
            let x = OPS.x;
            return (
              <g opacity={clamp01(u * 2)}>
                <Txt x={OPS.x} y={OPS.y - 10} fill={colors.TEXT}>6,320 operations (4,080 reglu, 2,240 affine) · 8 layers</Txt>
                {OPS_BY_DEPTH.map(([r, af], d) => {
                  const w = ((r + af) / OPS_TOTAL) * OPS.w;
                  const x0 = x;
                  x += w;
                  const shown = clamp01((u * OPS.w - (x0 - OPS.x)) / Math.max(w, 1));
                  return (
                    <g key={d}>
                      <rect x={x0} y={OPS.y} width={w * shown} height={OPS.h} fill={r > 0 ? colors.SECONDARY : colors.MUTED} fillOpacity={0.75} stroke={colors.BG} strokeWidth={1} />
                    </g>
                  );
                })}
                <rect x={OPS.x} y={OPS.y} width={OPS.w} height={OPS.h} fill="none" stroke={colors.GRID} />
                <Txt x={OPS.x} y={OPS.y + 34} size={12} opacity={v(scene.fixedU)}>layers 1–8 · violet reglu, grey affine · shape fixed</Txt>
              </g>
            );
          })()}
        </g>

        {/* ================= the 244 source cells ================= */}
        {(v(scene.b1U) > 0.005) && (
          <g opacity={gridOp}>
            {GRID.blocks.map((b, bi) => {
              const u = [v(scene.b1U), v(scene.b2U), v(scene.b3U)][bi];
              if (u <= 0.005) return null;
              const n = BLOCK_N[bi];
              return (
                <g key={bi}>
                  <Txt x={b.x} y={GRID.y - 10} fill={colors.TEXT} opacity={clamp01(u * 3)}>{BLOCK_LABEL[bi]}</Txt>
                  {Array.from({ length: n }, (_, c) => {
                    const cu = clamp01((u * (n + 8) - c) / 8);
                    if (cu <= 0.005) return null;
                    const w = weights[BLOCK_START[bi] + c];
                    const col = c % b.cols;
                    const row = Math.floor(c / b.cols);
                    return (
                      <rect key={c} x={b.x + col * GRID.pitch} y={GRID.y + row * GRID.pitch} width={GRID.cell} height={GRID.cell} rx={2} fill={signColor(w)} fillOpacity={(0.15 + 0.85 * Math.abs(w) / MAXW) * cu} stroke={v(scene.moveGlow) > 0.01 ? colors.WARM : 'none'} strokeOpacity={v(scene.moveGlow)} strokeWidth={1} />
                    );
                  })}
                </g>
              );
            })}
            <g opacity={v(scene.sumU)}>
              <Txt x={700} y={548} size={15} fill={colors.WARM} weight={700}>132 + 84 + 28 = 244</Txt>
            </g>
            <Txt x={700} y={572} size={13} fill={colors.TEXT} opacity={v(scene.cellLbl) * (1 - v(scene.moveGlow))}>each a source cell</Txt>
            <Txt x={700} y={572} size={13} fill={colors.WARM} opacity={v(scene.moveGlow)}>only these move</Txt>
          </g>
        )}

        {/* ================= Huber: big misses count linearly ================= */}
        {hubU > 0.005 && (() => {
          const pts: string[] = [];
          const ref: string[] = [];
          for (let i = 0; i <= 160; i++) {
            const e = -0.4 + (0.8 * i) / 160;
            pts.push(`${hubX(e)},${hubY(huber(e))}`);
            ref.push(`${hubX(e)},${hubY(Math.min(0.5 * e * e, 0.0315))}`);
          }
          const drawn = Math.max(2, Math.round(160 * clamp01(hubU)));
          const e = Math.max(-0.4, Math.min(0.4, pairErr));
          return (
            <g opacity={clamp01(hubU * 2)}>
              <rect x={HUB.x} y={HUB.y} width={HUB.w} height={HUB.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              <Txt x={HUB.x + 14} y={HUB.y + 22} fill={colors.TEXT}>edge loss · geometryLossThreshold 0.08</Txt>
              <line x1={hubX(-0.4)} y1={hubY(0)} x2={hubX(0.4)} y2={hubY(0)} stroke={colors.MUTED} />
              <line x1={hubX(0)} y1={hubY(0)} x2={hubX(0)} y2={HUB.y + 40} stroke={colors.GRID} />
              {[-THRESH, THRESH].map((t) => (
                <line key={t} x1={hubX(t)} y1={hubY(0) - 4} x2={hubX(t)} y2={hubY(0) + 4} stroke={colors.MUTED} />
              ))}
              <Txt x={hubX(THRESH)} y={hubY(0) + 18} anchor="middle" size={12}>0.08</Txt>
              <Txt x={hubX(0.4)} y={hubY(0) + 18} anchor="end" size={12}>edge error</Txt>
              <polyline points={ref.slice(0, drawn + 1).join(' ')} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
              <polyline points={pts.slice(0, drawn + 1).join(' ')} fill="none" stroke={colors.ACCENT} strokeWidth={2.8} />
              <Txt x={hubX(-0.26)} y={hubY(0.0315) + 14} anchor="middle" size={12}>½e²</Txt>
              <Txt x={hubX(-0.27)} y={hubY(huber(-0.27)) + 18} anchor="middle" size={12} fill={colors.ACCENT}>linear</Txt>
              {pairU > 0.005 && (
                <g opacity={pairU}>
                  <line x1={hubX(e)} y1={hubY(0)} x2={hubX(e)} y2={hubY(huber(e))} stroke={colors.WARM} strokeDasharray="2 3" />
                  <circle cx={hubX(e)} cy={hubY(huber(e))} r={6} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
                </g>
              )}
            </g>
          );
        })()}

        {/* ================= first fit: three presets, the lab's one run ================= */}
        {v(scene.racePanel) > 0.005 && (
          <g opacity={v(scene.racePanel)}>
            <rect x={RACE.x} y={RACE.y} width={RACE.w} height={RACE.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <Txt x={RACE.x + 20} y={RACE.y + 26} fill={colors.TEXT}>first fit from the seed · steps (one run)</Txt>
            {PRESETS.map((pr, i) => {
              const u = clamp01(v(scene.raceU) - i);
              const y = RACE.y + 58 + i * 46;
              return (
                <g key={pr.name}>
                  <Txt x={RACE.x + 20} y={y} size={13}>{`${pr.name} · ${pr.rects} rectangles`}</Txt>
                  <rect x={raceX(0)} y={y + 8} width={raceX(2000) - raceX(0)} height={14} rx={2} fill="none" stroke={colors.GRID} />
                  <rect x={raceX(0)} y={y + 8} width={(raceX(pr.steps) - raceX(0)) * u} height={14} rx={2} fill={i === 0 ? colors.ACCENT : colors.SECONDARY} fillOpacity={0.85} />
                  <g opacity={clamp01(u * 3 - 2)}>
                    <line x1={raceX(pr.lo)} y1={y + 15} x2={raceX(pr.hi)} y2={y + 15} stroke={colors.TEXT} strokeWidth={1.5} />
                    <line x1={raceX(pr.lo)} y1={y + 9} x2={raceX(pr.lo)} y2={y + 21} stroke={colors.TEXT} strokeWidth={1.5} />
                    <line x1={raceX(pr.hi)} y1={y + 9} x2={raceX(pr.hi)} y2={y + 21} stroke={colors.TEXT} strokeWidth={1.5} />
                    <Txt x={raceX(2000) + 12} y={y + 20} size={14} fill={colors.TEXT}>{pr.steps.toLocaleString('en-US')}</Txt>
                    <Txt x={raceX(2000) + 72} y={y + 20} size={14} fill={colors.WARM} opacity={v(scene.raceS)}>{pr.s}</Txt>
                  </g>
                </g>
              );
            })}
            <Txt x={RACE.x + 20} y={RACE.y + RACE.h - 12} size={12}>whisker: range over 24 presses · 600 steps a second</Txt>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={230} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Photos from a sketch
      </text>
    </>
  );
}

export const vizScene = () => scene;
