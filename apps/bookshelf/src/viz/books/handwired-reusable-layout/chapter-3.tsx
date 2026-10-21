// Close, and Where It Slips
//
// Reusable Layout — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT),
// paths relative to lab/reusable-layout/ unless shown otherwise.
//   study.ts:27-35 (held-out sets: seeds 101-112 × counts 6, 12 × widths 420/620/900/1180 = 96 layouts per set)
//   README.md:35 (every method keeps every item and reading order; zero overflow and overlap), 37-45 (the loss table
//     and "lost ground on the longer-caption/crop shift"), 47 (what is not established), 49-53 (CPU timings, saved
//     seed 17), 57-67 (the width sweep), 71 (total caption width, not word widths)
//   results.json (seeds 17 / 41 / 73: mean preference loss, median microseconds, invariants, widthSweep)
//   data.ts:30-50 (createScene; crop ratios 0.8/1/1.4/1.8 short, 0.55/0.7/1.15/1.6/2.2/2.6 long)
//   layout.ts:32-74 (wrapLayout, preferenceLoss), text.ts:14-35 (prepareCaption, wrapCaption)
//   model.ts:12-30 (itemFeatures: the caption enters as totalWidth / 1000), study.ts:90-108 (measureWidthSweep)
//   lab/status.md:197, 208-212 (current but limited; "narrowed" is the research note's classification, not
//     status.md vocabulary)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan and the Haiku 5.5 fact-check.
//
// Every loss, timing, invariant and count on screen is copied from results.json at full precision and rounded
// here; the module throws if a rounded value ever disagrees with the fixed narration. The six-card specimen is the
// book's shared stage, createScene(101, 6, 900, short | long): its word widths (font-metrics.json), aspect ratios,
// importances and the three methods' width preferences come from a probe of the lab code with the saved seed-17
// model; wrapLayout, wrapCaption and preferenceLoss are ported line for line below and recompute every card and the
// per-layout losses, checked against the probe. The sweep's jump positions (every 1-pixel step whose mean item
// movement exceeds 10 px) are the probe output of measureWidthSweep with the saved model; their counts reproduce
// results.json (6 / 35 / 53, largest 939.38 / 359.26 / 369.55 px). Deck thumbnails are the held-out scenes' real
// crop ratios at 224 px drawn as image blocks only (captions omitted, so their row spacing is schematic).
// One change to the plan: the review tags the 6 / 35 / 53 counts "one saved run, seed 17" (seed 41's shared rule
// gives 33); the scope chip carries that tag through the sweep.
import { Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const GOLD = '#d6b82e'; // the book accent: the shared rule
const C_WRAP = colors.MUTED;
const C_SEARCH = colors.TEAL; // the teacher (a ghost outline on the cards)
const C_SHARED = GOLD;
const WHISPER = 0.12;
const f4 = (v: number): string => v.toFixed(4);

// ---------------------------------------------------------------------------
// results.json (seeds 17, 41, 73), full precision
// ---------------------------------------------------------------------------

const LOSS = {
  short: { wrapping: 0.3727159414882551, search: 0.022931881363323817, shared: [0.026555467086703, 0.02590583290184924, 0.026122757590562304] },
  long: { wrapping: 1.0530301953316004, search: 0.19874669124906355, shared: [0.2853578294936146, 0.30792071594274234, 0.29686420926058293] },
};
const range = (v: number[]): [number, number] => [Math.min(...v), Math.max(...v)];
const SHARED_SHORT = range(LOSS.short.shared);
const SHARED_LONG = range(LOSS.long.shared);
// median microseconds, short captions: wrapping and shared from the saved seed 17; search for seeds 17, 41, 73
const MICROS = { wrapping: 1.7910000000256332, shared: 18.291999999973996, search: [317.4170000000913, 350.41699999965203, 421.04099999960454] };
// invariants across both held-out sets and all three seeds (missingContent, maximumTextOverflow,
// maximumHorizontalOverflow, overlaps): every entry in results.json is 0
const INVARIANTS = { missingContent: 0, textOverflow: 0, horizontalOverflow: 0, overlaps: 0 };
const HELD_OUT_LAYOUTS = 12 * 2 * 4 * 2; // seeds × counts × widths × caption sets

// ---------------------------------------------------------------------------
// The width sweep (measureWidthSweep, saved seed 17): [width, family 0 short | 1 long, mean item movement px]
// ---------------------------------------------------------------------------

type Jump = [number, 0 | 1, number];
const SWEEP: Record<'wrapping' | 'search' | 'shared', Jump[]> = {
  wrapping: [[496, 0, 746.36], [736, 0, 378.96], [976, 0, 349.78], [496, 1, 939.38], [736, 1, 494.73], [976, 1, 388.86]],
  search: [
    [368, 0, 153.3], [395, 0, 48.65], [399, 0, 15.63], [400, 0, 206.27], [402, 0, 13.63], [408, 0, 13.81], [410, 0, 13.63], [416, 0, 11.75],
    [418, 0, 13.63], [424, 0, 47.75], [427, 0, 149.01], [451, 0, 15.63], [464, 0, 126.04], [521, 0, 15.63], [570, 0, 55.39], [576, 0, 199.61],
    [586, 0, 70.1], [592, 0, 72.23], [601, 0, 73.22], [619, 0, 15.63], [625, 0, 257.35], [632, 0, 117.37], [765, 0, 14.15], [783, 0, 238.16],
    [802, 0, 71.56], [816, 0, 169.95], [1002, 0, 218.12], [1010, 0, 11.19], [1017, 0, 104.74], [1156, 0, 229.54], [384, 1, 27.01],
    [406, 1, 165.39], [411, 1, 359.26], [416, 1, 129.2], [421, 1, 96.68], [536, 1, 138.55], [544, 1, 140.13], [552, 1, 140.79],
    [560, 1, 141.72], [568, 1, 159.42], [576, 1, 155.55], [599, 1, 157.56], [640, 1, 351.54], [718, 1, 57.48], [749, 1, 113.22],
    [802, 1, 267.87], [817, 1, 78.19], [928, 1, 82.43], [960, 1, 78.31], [968, 1, 77.39], [1017, 1, 156.43], [1062, 1, 247.85], [1088, 1, 112.33],
  ],
  shared: [
    [376, 0, 66], [377, 0, 153.01], [393, 0, 24.62], [397, 0, 112.81], [398, 0, 49.33], [427, 0, 92.14], [428, 0, 47.83], [435, 0, 241.87],
    [509, 0, 115.99], [578, 0, 56.25], [599, 0, 159.2], [604, 0, 42.87], [610, 0, 74.5], [634, 0, 260.3], [659, 0, 111.11], [797, 0, 241.24],
    [812, 0, 72.52], [891, 0, 169.46], [1020, 0, 221.56], [1030, 0, 106.34], [1179, 0, 233.06], [381, 1, 27.02], [401, 1, 369.55],
    [404, 1, 164.77], [410, 1, 82.61], [416, 1, 57.34], [419, 1, 125.82], [561, 1, 159.27], [647, 1, 352.48], [707, 1, 129.24],
    [792, 1, 264.17], [813, 1, 78.57], [968, 1, 75.9], [973, 1, 152.63], [1058, 1, 330.83],
  ],
};
const SWEEP_TRANSITIONS = 2 * (1180 - 360); // 820 one-pixel steps per caption family
const SWEEP_MAX = Math.max(...SWEEP.wrapping.map((j) => j[2]));
const FLARE = SWEEP.wrapping.find((j) => j[2] === SWEEP_MAX)!;

// ---------------------------------------------------------------------------
// The six-card specimen: createScene(101, 6, 900, short | long), ported layout code
// ---------------------------------------------------------------------------

type SpecItem = { photo: number; aspect: number; importance: number; words: string; widths: number[] };
type SpecSet = { space: number; items: SpecItem[]; search: number[]; shared: number[]; loss: { wrapping: number; search: number; shared: number } };
const SPEC_DATA: Record<'short' | 'long', SpecSet> = {
  short: {
    space: 3.8896,
    items: [
      { photo: 5, aspect: 1, importance: 0.5237, words: 'Alpine Dawn. The first light reaches the mountain ridge.', widths: [38.917, 39.6826, 24.124, 22.5518, 25.6826, 49.8066, 19.4619, 57.5928, 35.0205] },
      { photo: 6, aspect: 1.8, importance: 0.4955, words: 'Amalfi Morning. A coastal town catches the morning sun.', widths: [38.8965, 54.4688, 9.3379, 44.3584, 29.5723, 48.248, 19.4619, 50.5791, 26.4619] },
      { photo: 7, aspect: 1.4, importance: 0.2695, words: 'North Falls. Water drops into the shaded valley.', widths: [34.2344, 33.4482, 36.8184, 35.0205, 22.5723, 19.4619, 45.9307, 38.6436] },
      { photo: 8, aspect: 1.8, importance: 0.2958, words: 'Lavender Hour. Flowering rows stretch toward the horizon.', widths: [58.3789, 33.4619, 60.6895, 29.5586, 42.0137, 42.0205, 19.4619, 49.8066] },
      { photo: 9, aspect: 1.8, importance: 0.4765, words: 'Concrete Curve. Light follows the curve of a concrete wall.', widths: [56.8066, 41.2344, 30.3584, 42.793, 19.4619, 34.2344, 11.6758, 7.7861, 53.6963, 28.0068] },
      { photo: 10, aspect: 1.4, importance: 0.9181, words: 'Blue Lagoon. Clear water meets a pale stretch of shore.', widths: [28.0205, 50.6064, 33.4551, 34.2344, 38.124, 7.7861, 26.4688, 42.0137, 11.6758, 38.9102] },
    ],
    search: [182, 241, 186, 214, 239, 255],
    shared: [185.5053, 239.1925, 184.6547, 214.5925, 236.8282, 257.3381],
    loss: { wrapping: 0.11451, search: 0.01661, shared: 0.01703 },
  },
  long: {
    space: 3.8896,
    items: [
      { photo: 5, aspect: 0.7, importance: 0.5237, words: 'Alpine Dawn. Early sunlight reaches the high ridge before the valley below. Snow and exposed rock make a patchwork across the steep mountain face.', widths: [38.917, 39.6826, 31.8965, 48.2549, 49.8066, 19.4619, 26.4688, 31.1309, 39.6963, 19.4619, 35.793, 39.6963, 35.0205, 23.3584, 52.9307, 26.4482, 34.2344, 7.7861, 63.8066, 41.2344, 19.4619, 34.248, 57.5928, 30.3516] },
      { photo: 6, aspect: 2.6, importance: 0.4955, words: 'Amalfi Morning. Buildings follow the steep hillside down toward the sea, with narrow streets connecting the terraces above the bright coastal water.', widths: [38.8965, 54.4688, 56.8135, 35.793, 19.4619, 34.248, 42.7998, 33.4688, 42.0205, 19.4619, 26.4619, 24.8965, 42.793, 42.0137, 67.7168, 19.4619, 50.5723, 38.1445, 19.4619, 35.0205, 44.3584, 37.3516] },
      { photo: 7, aspect: 2.2, importance: 0.2695, words: 'North Falls. Water gathers at the edge of the cliff and drops into the valley. Spray hangs above the rocks at the foot of the falls.', widths: [34.2344, 33.4482, 36.8184, 46.6963, 11.6758, 19.4619, 31.1445, 11.6758, 19.4619, 20.7471, 23.3584, 35.0205, 22.5723, 19.4619, 38.6436, 36.5723, 38.1445, 38.1445, 19.4619, 33.4482, 11.6758, 19.4619, 23.3516, 11.6758, 19.4619, 28.7861] },
      { photo: 8, aspect: 2.6, importance: 0.2958, words: 'Lavender Hour. Rows of flowering plants follow the slope of the field. The spaces between them draw long lines toward the last light on the horizon.', widths: [58.3789, 33.4619, 35.0068, 11.6758, 56.0273, 37.3584, 35.793, 19.4619, 33.4688, 11.6758, 19.4619, 29.5723, 24.124, 44.3584, 52.9307, 31.124, 30.3447, 26.4688, 28.793, 42.0205, 19.4619, 21.7861, 25.6826, 15.5723, 19.4619, 49.8066] },
      { photo: 9, aspect: 2.6, importance: 0.4765, words: 'Concrete Curve. The curved wall changes from bright light to shadow as it turns away from the sun. Its simple outline frames a clear patch of sky.', widths: [56.8066, 41.2344, 24.124, 42.0205, 24.1172, 52.9307, 28, 35.0205, 25.6826, 11.6758, 48.2549, 14.7861, 7, 31.124, 32.6826, 28, 19.4619, 26.4619, 14.7793, 40.4551, 41.2549, 42.7861, 7.7861, 30.3447, 34.248, 11.6758, 23.8506] },
      { photo: 10, aspect: 1.6, importance: 0.9181, words: 'Blue Lagoon. The water changes color over the shallow ground near the shore, from pale turquoise beside the beach to blue farther out.', widths: [28.0205, 50.6064, 24.124, 34.2344, 52.9307, 30.3447, 27.2344, 19.4619, 46.6895, 43.5928, 28.0205, 19.4619, 38.9102, 28, 26.4688, 57.5928, 41.2549, 19.4619, 38.1445, 11.6758, 26.4688, 40.4619, 23.3516] },
    ],
    search: [171, 290, 233, 258, 287, 286],
    shared: [161.2519, 275.7484, 232.7154, 254.8267, 274.8655, 272.3689],
    loss: { wrapping: 0.4507, search: 0.09806, shared: 0.13668 },
  },
};

const VIEW = 900;
const PAD = 16; // padding = gap = 16 (layout.ts:4-5)
const totalWidth = (it: SpecItem, space: number): number => it.widths.reduce((a, b) => a + b, 0) + (it.widths.length - 1) * space;

/** text.ts:14-35 */
function wrapCaption(it: SpecItem, space: number, width: number) {
  const words = it.words.split(' ');
  const lines: { words: { text: string; x: number; w: number }[]; width: number }[] = [];
  let cur: { text: string; x: number; w: number }[] = [];
  let lineWidth = 0;
  words.forEach((text, i) => {
    const w = it.widths[i];
    const next = lineWidth + (cur.length ? space : 0) + w;
    if (cur.length && next > width) {
      lines.push({ words: cur, width: lineWidth });
      cur = [{ text, x: 0, w }];
      lineWidth = w;
    } else {
      cur.push({ text, x: lineWidth + (cur.length ? space : 0), w });
      lineWidth = next;
    }
  });
  if (cur.length) lines.push({ words: cur, width: lineWidth });
  return lines;
}

type Placed = { l: number; t: number; w: number; ih: number; h: number; lines: ReturnType<typeof wrapCaption> };
/** layout.ts:32-61 (wrapLayout) and 65-74 (preferenceLoss) */
function layoutOf(set: SpecSet, prefs: number[]) {
  const inner = VIEW - 2 * PAD;
  const items: Placed[] = [];
  let left = PAD;
  let top = PAD;
  let rowH = 0;
  let rows = 1;
  let unused = 0;
  set.items.forEach((it, i) => {
    const w = Math.min(inner, 416, Math.max(128, prefs[i]));
    if (left > PAD && left + w > VIEW - PAD) {
      unused += (VIEW - PAD - (left - PAD)) / inner;
      top += rowH + PAD;
      left = PAD;
      rowH = 0;
      rows++;
    }
    const lines = wrapCaption(it, set.space, w);
    const ih = w / it.aspect;
    const h = ih + 8 + lines.length * 20;
    items.push({ l: left, t: top, w, ih, h, lines });
    left += w + PAD;
    rowH = Math.max(rowH, h);
  });
  unused += (VIEW - PAD - (left - PAD)) / inner;
  const unusedRowFraction = unused / rows;
  let total = 0;
  items.forEach((p, i) => {
    const targetArea = 22000 * (0.7 + 1.5 * set.items[i].importance);
    const areaError = (p.w * p.ih - targetArea) / targetArea;
    const excess = Math.max(0, p.lines.length - 3);
    total += areaError * areaError + 0.035 * excess * excess;
  });
  return { items, height: top + rowH + PAD, loss: total / items.length + 0.08 * unusedRowFraction };
}

type MethodKey = 'wrapping' | 'search' | 'shared';
const METHODS: MethodKey[] = ['wrapping', 'search', 'shared'];
const SPEC = (['short', 'long'] as const).map((c) => {
  const set = SPEC_DATA[c];
  return METHODS.map((m) => layoutOf(set, m === 'wrapping' ? set.items.map(() => 224) : set[m]));
});
(['short', 'long'] as const).forEach((c, ci) =>
  METHODS.forEach((m, mi) => {
    if (Math.abs(SPEC[ci][mi].loss - SPEC_DATA[c].loss[m]) > 6e-4) {
      throw new Error(`reusable-layout ch3: ported loss ${SPEC[ci][mi].loss} disagrees with the probe for ${c}/${m}`);
    }
  }),
);
const CARD1 = SPEC[1][2].items[0]; // the narrow portrait, long caption, shared width
const CARD1_TOTAL = totalWidth(SPEC_DATA.long.items[0], SPEC_DATA.long.space);
const MEAN_CAPTION = (['short', 'long'] as const).map((c) => SPEC_DATA[c].items.reduce((a, it) => a + totalWidth(it, SPEC_DATA[c].space), 0) / 6);

// the narration's rounded numbers, checked against the data they come from
const NARRATED: [string, string][] = [
  [f4(LOSS.short.wrapping), '0.3727'], [f4(LOSS.short.search), '0.0229'], [f4(SHARED_SHORT[0]), '0.0259'], [f4(SHARED_SHORT[1]), '0.0266'],
  [f4(LOSS.long.wrapping), '1.0530'], [f4(LOSS.long.search), '0.1987'], [f4(SHARED_LONG[0]), '0.2854'], [f4(SHARED_LONG[1]), '0.3079'],
  [MICROS.shared.toFixed(0), '18'], [MICROS.search.map((v) => v.toFixed(0)).join(' '), '317 350 421'],
  [`${SWEEP.wrapping.length} ${SWEEP.shared.length} ${SWEEP.search.length}`, '6 35 53'], [SWEEP_MAX.toFixed(0), '939'],
  [`${HELD_OUT_LAYOUTS}`, '192'], [`${SWEEP_TRANSITIONS}`, '1640'], [`${CARD1.lines.length}`, '7'],
];
NARRATED.forEach(([got, want]) => {
  if (got !== want) throw new Error(`reusable-layout ch3: ${got} ≠ narrated ${want}`);
});

// ---------------------------------------------------------------------------
// The held-out deck (createScene's crop draws, data.ts:30-50) — 12 seeds × (6 | 12 photos) × 4 widths
// ---------------------------------------------------------------------------

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const RATIOS_SHORT = [0.8, 1, 1.4, 1.8];
const RATIOS_LONG = [0.55, 0.7, 1.15, 1.6, 2.2, 2.6];
const DECK_WIDTHS = [420, 620, 900, 1180];
const DECK_X0 = 56;
const DECK_DX = 60;
const DECK_Y0 = 150;
const DECK_DY = 36;
const FW_MAX = 52;
const TS = FW_MAX / 1180; // thumbnail scale
const TH = 30; // thumbnail frame height (clipped)
const DECK = Array.from({ length: 12 }, (_, row) =>
  Array.from({ length: 8 }, (_, col) => {
    const seed = 101 + row;
    const count = col < 4 ? 6 : 12;
    const width = DECK_WIDTHS[col % 4];
    const random = createRandom(seed);
    const aspects = Array.from({ length: count }, () => {
      const a = RATIOS_SHORT[Math.floor(random() * RATIOS_SHORT.length)];
      random(); // importance
      return a;
    });
    const blocks: { l: number; t: number; w: number; h: number }[] = [];
    let left = PAD;
    let top = PAD;
    let rowH = 0;
    aspects.forEach((a) => {
      if (left > PAD && left + 224 > width - PAD) {
        top += rowH + PAD;
        left = PAD;
        rowH = 0;
      }
      blocks.push({ l: left, t: top, w: 224, h: 224 / a });
      left += 224 + PAD;
      rowH = Math.max(rowH, 224 / a);
    });
    const fw = width * TS;
    return { seed, count, width, blocks, x: DECK_X0 + col * DECK_DX + (FW_MAX - fw) / 2, y: DECK_Y0 + row * DECK_DY, fw };
  }),
);
const SPEC_THUMB = DECK[0][2]; // seed 101 · 6 photos · 900 px
if (SPEC_THUMB.seed !== 101 || SPEC_THUMB.count !== 6 || SPEC_THUMB.width !== 900) throw new Error('reusable-layout ch3: specimen thumbnail');

const PHOTO_HUE = [205, 32, 195, 228, 128, 22, 38, 200, 272, 14, 182, 30];
const photoFill = (p: number): string => `hsl(${PHOTO_HUE[p]}, 26%, 30%)`;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; screen y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const SPEC_POS = { x: 64, y: 196, s: 0.5 };

// loss gauge (log scale 0.01 … 2)
const GX0 = 640;
const GX1 = 1200;
const lx = (v: number): number => GX0 + ((Math.log10(v) + 2) / (Math.log10(2) + 2)) * (GX1 - GX0);
const LANE: Record<MethodKey, number> = { wrapping: 176, search: 236, shared: 296 };
const BAR_H = 22;
const AXIS_Y = 350;

// CPU time gauge (linear 0 … 450 µs)
const tx = (v: number): number => 640 + (v / 450) * 560;
const TLANE: Record<MethodKey, number> = { wrapping: 446, search: 492, shared: 538 };

// the resize sweep, below the main stage
const SW = 760;
const sx = (w: number): number => 150 + ((w - 360) / 820) * 1000;
const SLANE: Record<MethodKey, number> = { wrapping: SW + 130, search: SW + 230, shared: SW + 330 };
const tickH = (mv: number): number => 6 + 34 * Math.sqrt(mv / SWEEP_MAX);

const CAM_DECK: CameraState = { x: 296, y: 262, k: 1.28 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_GAP: CameraState = { x: 652, y: 344, k: 1.04 };
const CAM_TIME: CameraState = { x: 900, y: 478, k: 1.3 };
const CAM_CALL: CameraState = { x: 652, y: 352, k: 1.02 };
const CAM_SWEEP: CameraState = { x: 660, y: SW + 200, k: 1 };
const CAM_FLARE: CameraState = { x: 660, y: SW + 196, k: 1.02 };
const CAM_ALL: CameraState = { x: 640, y: (96 + SW + 410) / 2, k: 0.52 };

const SCOPES = [
  'held-out · seeds 101–112 · 6 or 12 photos · 420 / 620 / 900 / 1180 px',
  'authored objective · 12 photos · held-out seeds 101–112 · short captions',
  'one saved run, seed 17 · warm serial Bun · short captions',
  'authored objective · 12 photos · held-out seeds 101–112 · long captions, new crops',
  'model input: itemFeatures · caption px / 1000',
  `${HELD_OUT_LAYOUTS} held-out layouts · seeds 17, 41, 73`,
  'one saved run, seed 17 · sweep seed 113 · 12 photos',
];

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'The held-out test has two sets of 96 layouts: six or twelve photos at four new widths. Lower preference loss is better. Short captions first.',
  'Ordinary wrapping at a fixed 224 pixels scores 0.3727. Per-layout search scores 0.0229. The shared rule, across three training seeds, scores 0.0259 to 0.0266.',
  "So the one-shot rule stays close to its teacher, a little worse, and far better than wrapping. That's measured on the lab's own objective and its twelve photos.",
  "It's cheaper too. In one saved run, the shared rule takes a median of 18 microseconds on short captions and search takes 317. Other seeds put search at 350 and 421.",
  'Now change the test: longer captions and new crops, with aspect ratios from 0.55 to 2.6. The rule never trained on either.',
  'Wrapping scores 1.0530 and search 0.1987. The shared rule scores 0.2854 to 0.3079: far ahead of wrapping, but clearly behind its teacher. The README names this as where it loses ground.',
  "One limit it names: the network gets a caption's total width, not each word's width, so it can't predict exactly where lines break.",
  'The safety checks hold everywhere. Across all 192 held-out layouts, all three methods keep every photo in reading order, with zero text overflow, zero horizontal overflow and zero overlap.',
  'Resizing is a separate test. Sweep every pixel width from 360 to 1180, for short and long captions: 1,640 one-pixel steps per method. Count the steps where photos jump more than ten pixels.',
  'In the saved model, wrapping has 6 such jumps, the shared rule 35, search 53. The worst wrapping step moves photos 939 pixels on average. The README says it plainly: all three methods reflow abruptly.',
  "What isn't shown: that a network is necessary, or that it beats a carefully tuned responsive formula. The 224-pixel wrapper isn't tuned, and no human ratings are involved.",
  'The status is narrowed. The result is current, but limited to this objective, these counts and widths, and one photo set. The long-caption gap is recorded, not fixed.',
  'So: one rule of 121 parameters, taught by a slow search. Close on short captions, behind on long ones, abrupt on resize, and learned sizing inside a fixed flow layout.',
];
// ~150 words per minute, plus room for the beat's motion where it needs it
const EXTRA = [0.8, 1.2, 0.4, 0.8, 1.0, 0.8, 1.4, 0.6, 1.4, 0.8, 0.4, 0.4, 0.4];
const CAPS = (() => {
  let at = 0.4;
  return CAPTIONS.map((text, i) => {
    const dur = Math.round((text.split(/\s+/).length * 0.4 + 0.4 + EXTRA[i]) * 10) / 10;
    const c = { at, dur, text };
    at = Math.round((at + dur + 0.6) * 10) / 10;
    return c;
  });
})();

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_DECK, cameraInterp);
  const scope = tl.channel('scope', 0);
  const scopeOp = tl.channel('scopeOp', 0);

  // region opacities
  const opDeck = tl.channel('opDeck', 1);
  const opSpec = tl.channel('opSpec', 1);
  const opGauge = tl.channel('opGauge', 1);
  const opTime = tl.channel('opTime', 1);
  const opSweep = tl.channel('opSweep', 1);
  const opUpper = tl.channel('opUpper', 1); // everything above the sweep, while the camera is down there

  // B1
  const deckU = tl.channel('deckU', 0);
  const deckNoteU = tl.channel('deckNoteU', 0);
  const gaugeU = tl.channel('gaugeU', 0);
  // B2
  const specGrow = tl.channel('specGrow', 0);
  const specM = tl.channel('specM', 0); // 0 wrapping · 1 search · 2 shared
  const specC = tl.channel('specC', 0); // 0 short · 1 long
  const sWrap = tl.channel('sWrap', 0);
  const sSearch = tl.channel('sSearch', 0);
  const sShared = tl.channel('sShared', 0);
  // B3
  const ghostU = tl.channel('ghostU', 0);
  const gapS = tl.channel('gapS', 0);
  const wrapDim = tl.channel('wrapDim', 1);
  // B4
  const timeU = tl.channel('timeU', 0);
  const tShared = tl.channel('tShared', 0);
  const tSearch = tl.channel('tSearch', 0);
  const tSeeds = tl.channel('tSeeds', 0);
  // B5–B6
  const longU = tl.channel('longU', 0); // short bars → ghost ticks, set label swaps
  const changeU = tl.channel('changeU', 0);
  const lWrap = tl.channel('lWrap', 0);
  const lSearch = tl.channel('lSearch', 0);
  const lShared = tl.channel('lShared', 0);
  const gapL = tl.channel('gapL', 0);
  const lostU = tl.channel('lostU', 0);
  // B7
  const callU = tl.channel('callU', 0);
  const callNetU = tl.channel('callNetU', 0);
  const callGreyU = tl.channel('callGreyU', 0);
  // B8
  const checkU = tl.channel('checkU', 0);
  const checkTicks = tl.channel('checkTicks', 0); // 0..12 cells
  // B9–B10
  const sweepU = tl.channel('sweepU', 0);
  const scrubW = tl.channel('scrubW', 360);
  const flareU = tl.channel('flareU', 0);
  const stampU = tl.channel('stampU', 0);
  // B11–B13
  const panelU = tl.channel('panelU', 0);
  const notU = tl.channel('notU', 0);
  const notDim = tl.channel('notDim', 1);
  const statusU = tl.channel('statusU', 0);
  const panelSwap = tl.channel('panelSwap', 0);
  const recapU = tl.channel('recapU', 0);

  const C = CAPS;
  CAPS.forEach((c) => tl.caption(c));
  const setScope = (i: number, at: number) => tl.set(scope, i, at);

  // — B1 · two held-out sets of 96 layouts; lower is better; short first —
  let a = C[0].at;
  tl.tween(deckU, 1, { at: a + 0.2, dur: 2.6, ease: ease.linear });
  tl.tween(scopeOp, 1, { at: a + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: a + 3.0, dur: 1.5, ease: ease.move });
  tl.tween(deckNoteU, 1, { at: a + 4.3, dur: 0.6, ease: ease.enter });
  tl.tween(gaugeU, 1, { at: a + 4.6, dur: 1.2, ease: ease.draw });
  tl.hold(C[0].at + C[0].dur, 0.6);

  // — B2 · the three scores; the specimen cycles through the same three methods —
  a = C[1].at;
  setScope(1, a - 0.1);
  tl.tween(specGrow, 1, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(opDeck, WHISPER, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(deckNoteU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(sWrap, 1, { at: a + 0.8, dur: 1.2, ease: ease.move });
  tl.tween(specM, 1, { at: a + 3.6, dur: 1.0, ease: ease.move });
  tl.tween(sSearch, 1, { at: a + 3.8, dur: 1.0, ease: ease.move });
  tl.tween(specM, 2, { at: a + 6.4, dur: 1.0, ease: ease.move });
  tl.tween(sShared, 1, { at: a + 6.6, dur: 1.0, ease: ease.move });
  tl.hold(C[1].at + C[1].dur, 0.6);

  // — B3 · close to its teacher: the gap, and the teacher's ghost on the cards —
  a = C[2].at;
  tl.tween(cam, CAM_GAP, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(gapS, 1, { at: a + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(ghostU, 1, { at: a + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(wrapDim, 0.45, { at: a + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(wrapDim, 1, { at: a + 4.4, dur: 0.6, ease: ease.move });
  tl.hold(C[2].at + C[2].dur, 0.6);

  // — B4 · median CPU time, one saved run —
  a = C[3].at;
  setScope(2, a - 0.1);
  tl.tween(cam, CAM_TIME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(opSpec, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opGauge, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(timeU, 1, { at: a + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(tShared, 1, { at: a + 3.2, dur: 0.8, ease: ease.move });
  tl.tween(tSearch, 1, { at: a + 5.8, dur: 1.2, ease: ease.move });
  tl.tween(tSeeds, 1, { at: a + 8.6, dur: 0.6, ease: ease.pop });
  tl.hold(C[3].at + C[3].dur, 0.6);

  // — B5 · change the test: long captions, new crops —
  a = C[4].at;
  setScope(3, a - 0.1);
  tl.tween(cam, CAM_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(opTime, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opSpec, 1, { at: a + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(opGauge, 1, { at: a + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(gapS, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(longU, 1, { at: a + 0.8, dur: 1.0, ease: ease.move });
  tl.tween(specC, 1, { at: a + 1.6, dur: 1.6, ease: ease.move });
  tl.tween(changeU, 1, { at: a + 2.4, dur: 0.7, ease: ease.enter });
  tl.hold(C[4].at + C[4].dur, 0.6);

  // — B6 · the long-set scores; the gap opens —
  a = C[5].at;
  tl.tween(changeU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(lWrap, 1, { at: a + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(lSearch, 1, { at: a + 2.0, dur: 1.0, ease: ease.move });
  tl.tween(lShared, 1, { at: a + 3.7, dur: 1.0, ease: ease.move });
  tl.tween(gapL, 1, { at: a + 6.0, dur: 0.8, ease: ease.enter });
  tl.tween(lostU, 1, { at: a + 9.6, dur: 0.6, ease: ease.pop });
  tl.hold(C[5].at + C[5].dur, 0.6);

  // — B7 · total caption width in, word widths and line breaks out —
  a = C[6].at;
  setScope(4, a - 0.1);
  tl.tween(cam, CAM_CALL, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(opGauge, 0.06, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(callU, 1, { at: a + 0.4, dur: 0.9, ease: ease.enter });
  tl.tween(callNetU, 1, { at: a + 1.8, dur: 0.9, ease: ease.move });
  tl.tween(callGreyU, 1, { at: a + 4.6, dur: 0.8, ease: ease.move });
  tl.hold(C[6].at + C[6].dur, 0.6);

  // — B8 · the safety checks: 3 methods × 4 checks, all zero —
  a = C[7].at;
  setScope(5, a - 0.1);
  tl.tween(callU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_TIME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(opSpec, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(checkU, 1, { at: a + 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(checkTicks, 12, { at: a + 3.0, dur: 6.0, ease: ease.linear });
  tl.hold(C[7].at + C[7].dur, 0.6);

  // — B9 · the resize sweep: 360 → 1180, short and long —
  a = C[8].at;
  setScope(6, a - 0.1);
  tl.tween(opUpper, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SWEEP, { at: a + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(sweepU, 1, { at: a + 1.2, dur: 1.4, ease: ease.draw });
  tl.tween(scrubW, 1180, { at: a + 3.6, dur: C[8].dur + 0.6 + 3.4 - 3.6, ease: ease.linear });
  tl.hold(C[8].at + C[8].dur, 0.6);

  // — B10 · 6 / 35 / 53; wrapping's worst step; all three reflow abruptly —
  a = C[9].at;
  tl.tween(cam, CAM_FLARE, { at: a + 3.8, dur: 1.2, ease: ease.move });
  tl.tween(flareU, 1, { at: a + 5.0, dur: 0.8, ease: ease.pop });
  tl.tween(stampU, 1, { at: a + 9.0, dur: 0.6, ease: ease.pop });
  tl.hold(C[9].at + C[9].dur, 0.6);

  // — B11 · what isn't shown —
  a = C[10].at;
  tl.tween(scopeOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(opSweep, WHISPER, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(opUpper, WHISPER, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(opTime, 0, { at: a, dur: 0.1, ease: ease.move });
  tl.tween(cam, CAM_ALL, { at: a, dur: 1.6, ease: ease.move });
  tl.tween(panelU, 1, { at: a + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(notU, 3, { at: a + 1.8, dur: 6.0, ease: ease.linear });
  tl.hold(C[10].at + C[10].dur, 0.6);

  // — B12 · narrowed —
  a = C[11].at;
  tl.tween(notDim, 0.4, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(statusU, 1, { at: a + 0.3, dur: 0.6, ease: ease.pop });
  tl.hold(C[11].at + C[11].dur, 0.6);

  // — B13 · the recap row on an opaque panel —
  a = C[12].at;
  tl.tween(panelSwap, 1, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(recapU, 4, { at: a + 0.6, dur: 6.4, ease: ease.linear });
  tl.hold(C[12].at + C[12].dur, 2.4);

  return {
    tl, cam, scope, scopeOp, opDeck, opSpec, opGauge, opTime, opSweep, opUpper,
    deckU, deckNoteU, gaugeU,
    specGrow, specM, specC, sWrap, sSearch, sShared,
    ghostU, gapS, wrapDim,
    timeU, tShared, tSearch, tSeeds,
    longU, changeU, lWrap, lSearch, lShared, gapL, lostU,
    callU, callNetU, callGreyU,
    checkU, checkTicks,
    sweepU, scrubW, flareU, stampU,
    panelU, notU, notDim, statusU, panelSwap, recapU,
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
  const w = text.length * (mono ? fs * 0.6 : fs * 0.55) + 20;
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

function Tick({ x, y, s = 1, color = colors.POSITIVE }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <path d={`M ${x - 7 * s} ${y} L ${x - 2 * s} ${y + 5 * s} L ${x + 8 * s} ${y - 6 * s}`} stroke={color} strokeWidth={2.6} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
  );
}

const METHOD_COLOR: Record<MethodKey, string> = { wrapping: C_WRAP, search: C_SEARCH, shared: C_SHARED };
const METHOD_NAME: Record<MethodKey, string> = { wrapping: 'wrapping', search: 'search', shared: 'shared rule' };

/** bilinear weights of the four discrete specimen states for content c ∈ [0,1] and method m ∈ [0,2] */
function stateWeights(c: number, m: number): number[][] {
  const mw = [clamp01(1 - m), m <= 1 ? clamp01(m) : clamp01(2 - m), clamp01(m - 1)];
  return [mw.map((w) => w * (1 - c)), mw.map((w) => w * c)];
}

function blendItem(c: number, m: number, i: number) {
  const W = stateWeights(c, m);
  const keys: (keyof Placed)[] = ['l', 't', 'w', 'ih', 'h'];
  const out: Record<string, number> = {};
  keys.forEach((k) => {
    let v = 0;
    W.forEach((row, ci) => row.forEach((w, mi) => (v += w * (SPEC[ci][mi].items[i][k] as number))));
    out[k] = v;
  });
  return out as { l: number; t: number; w: number; ih: number; h: number };
}
function blendHeight(c: number, m: number): number {
  let v = 0;
  stateWeights(c, m).forEach((row, ci) => row.forEach((w, mi) => (v += w * SPEC[ci][mi].height)));
  return v;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = (ch: Parameters<SceneState['get']>[0]) => s.get(ch) as number;
  const cam = s.get(scene.cam);
  const scopeIdx = Math.max(0, Math.min(SCOPES.length - 1, Math.round(g(scene.scope))));
  const opUpper = g(scene.opUpper);
  const opDeck = g(scene.opDeck) * opUpper;
  const opSpec = g(scene.opSpec) * opUpper;
  const opGauge = g(scene.opGauge) * opUpper;
  const opTime = g(scene.opTime) * opUpper;
  const opSweep = g(scene.opSweep);

  const deckU = g(scene.deckU);
  const deckNoteU = g(scene.deckNoteU);
  const gaugeU = g(scene.gaugeU);
  const specGrow = g(scene.specGrow);
  const specM = g(scene.specM);
  const specC = g(scene.specC);
  const ghostU = g(scene.ghostU);
  const gapS = g(scene.gapS);
  const wrapDim = g(scene.wrapDim);
  const longU = g(scene.longU);
  const changeU = g(scene.changeU);
  const gapL = g(scene.gapL);
  const lostU = g(scene.lostU);
  const callU = g(scene.callU);
  const callNetU = g(scene.callNetU);
  const callGreyU = g(scene.callGreyU);
  const checkU = g(scene.checkU) * opUpper;
  const checkTicks = g(scene.checkTicks);
  const timeU = g(scene.timeU);
  const sweepU = g(scene.sweepU);
  const scrubW = g(scene.scrubW);
  const flareU = g(scene.flareU);
  const stampU = g(scene.stampU);
  const panelU = g(scene.panelU);
  const notU = g(scene.notU);
  const notDim = g(scene.notDim);
  const statusU = g(scene.statusU);
  const panelSwap = g(scene.panelSwap);
  const recapU = g(scene.recapU);

  const shortBars: Record<MethodKey, number> = { wrapping: g(scene.sWrap), search: g(scene.sSearch), shared: g(scene.sShared) };
  const longBars: Record<MethodKey, number> = { wrapping: g(scene.lWrap), search: g(scene.lSearch), shared: g(scene.lShared) };

  // specimen frame transform: grows out of its deck thumbnail
  const sp = {
    x: lerp(SPEC_THUMB.x, SPEC_POS.x, specGrow),
    y: lerp(SPEC_THUMB.y, SPEC_POS.y, specGrow),
    s: lerp(TS, SPEC_POS.s, specGrow),
  };
  const specH = blendHeight(specC, specM);
  const mDominant: MethodKey = METHODS[Math.max(0, Math.min(2, Math.round(specM)))];
  const cDominant = specC < 0.5 ? 0 : 1;
  const weights = stateWeights(specC, specM);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the held-out deck ======================== */}
        {deckU > 0.01 && opDeck > 0.005 && (
          <g opacity={opDeck}>
            <text x={DECK_X0 + 2 * DECK_DX - 4} y={104} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={clamp01(deckU * 3)}>
              6 photos
            </text>
            <text x={DECK_X0 + 6 * DECK_DX - 4} y={104} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={clamp01(deckU * 3)}>
              12 photos
            </text>
            {Array.from({ length: 8 }, (_, col) => (
              <text key={col} x={DECK_X0 + col * DECK_DX + FW_MAX / 2} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}
                opacity={clamp01(deckU * 3)}>
                {DECK_WIDTHS[col % 4]}
              </text>
            ))}
            {DECK.flatMap((row, r) =>
              row.map((th, c) => {
                const idx = r * 8 + c;
                const u = clamp01((deckU * 104 - idx) / 8);
                if (u <= 0.01) return null;
                const hidden = th === SPEC_THUMB && specGrow > 0.01;
                return (
                  <g key={idx} opacity={hidden ? 0 : u}>
                    <rect x={th.x} y={th.y} width={th.fw} height={TH} rx={2} fill={colors.PANEL} stroke={colors.GRID} />
                    {th.blocks.map((b, k) => {
                      const top = b.t * TS;
                      if (top >= TH - 1) return null;
                      return (
                        <rect key={k} x={th.x + b.l * TS} y={th.y + top} width={b.w * TS} height={Math.min(b.h * TS, TH - 1 - top)}
                          fill={C_WRAP} opacity={0.55} />
                      );
                    })}
                  </g>
                );
              }),
            )}
            <g opacity={deckNoteU}>
              <text x={DECK_X0} y={600} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                12 seeds × 2 counts × 4 widths = 96 layouts · thumbnails show images only
              </text>
            </g>
          </g>
        )}

        {/* ======================== the specimen: createScene(101, 6, 900) ======================== */}
        {specGrow > 0.01 && opSpec > 0.005 && (
          <g opacity={opSpec}>
            <g opacity={clamp01(specGrow * 2 - 1)}>
              <text x={SPEC_POS.x} y={146} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                one of them: seed 101 · 6 photos · 900 px
              </text>
              {METHODS.map((m, i) => {
                const on = m === mDominant;
                const lossV = SPEC_DATA[cDominant ? 'long' : 'short'].loss[m];
                return (
                  <Chip key={m} x={SPEC_POS.x + i * 152} y={180} text={`${METHOD_NAME[m]} ${f4(lossV)}`} color={METHOD_COLOR[m]} mono fs={12}
                    opacity={on ? 1 : 0.5} />
                );
              })}
            </g>
            <g transform={`translate(${sp.x} ${sp.y}) scale(${sp.s})`}>
              <rect x={0} y={0} width={VIEW} height={specH} rx={8 / sp.s} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
              {SPEC_DATA.short.items.map((it, i) => {
                const b = blendItem(specC, specM, i);
                const photo = it.photo;
                const isCard1 = i === 0;
                const ring = isCard1 ? callU : 0;
                return (
                  <g key={i}>
                    <rect x={b.l} y={b.t} width={b.w} height={b.ih} rx={4} fill={photoFill(photo)} />
                    {/* caption lines of each discrete state, cross-faded; lines past the third in red */}
                    {weights.flatMap((row, ci) =>
                      row.map((w, mi) => {
                        if (w < 0.02) return null;
                        const lines = SPEC[ci][mi].items[i].lines;
                        return (
                          <g key={`${ci}${mi}`} opacity={w}>
                            {lines.map((ln, j) => (
                              <rect key={j} x={b.l} y={b.t + b.ih + 8 + j * 20 + 6} width={Math.min(ln.width, b.w)} height={8} rx={3}
                                fill={j >= 3 ? colors.NEGATIVE : colors.TEXT} opacity={j >= 3 ? 0.75 : 0.32} />
                            ))}
                          </g>
                        );
                      }),
                    )}
                    <rect x={b.l} y={b.t} width={b.w} height={b.h} rx={4} fill="none" stroke={METHOD_COLOR[mDominant]} strokeWidth={1.4}
                      vectorEffect="non-scaling-stroke" opacity={0.8} />
                    {ring > 0.01 && (
                      <rect x={b.l - 6} y={b.t - 6} width={b.w + 12} height={b.h + 12} rx={8} fill="none" stroke={GOLD} strokeWidth={2.5}
                        vectorEffect="non-scaling-stroke" opacity={ring} />
                    )}
                  </g>
                );
              })}
              {/* the teacher's ghost: search's cards, dashed */}
              {ghostU > 0.01 &&
                SPEC_DATA.short.items.map((_, i) => {
                  const b = blendItem(specC, 1, i);
                  return (
                    <rect key={i} x={b.l} y={b.t} width={b.w} height={b.h} rx={4} fill="none" stroke={C_SEARCH} strokeWidth={1.6}
                      strokeDasharray="5 4" vectorEffect="non-scaling-stroke" opacity={ghostU * 0.95} />
                  );
                })}
            </g>
            {ghostU > 0.01 && (
              <g opacity={ghostU}>
                <line x1={SPEC_POS.x + 300} y1={SPEC_POS.y + specH * SPEC_POS.s + 22} x2={SPEC_POS.x + 324} y2={SPEC_POS.y + specH * SPEC_POS.s + 22}
                  stroke={C_SEARCH} strokeWidth={1.6} strokeDasharray="5 4" />
                <text x={SPEC_POS.x + 330} y={SPEC_POS.y + specH * SPEC_POS.s + 26} fill={C_SEARCH} fontSize={12} fontFamily={UI}>
                  search's cards
                </text>
                <line x1={SPEC_POS.x + 160} y1={SPEC_POS.y + specH * SPEC_POS.s + 22} x2={SPEC_POS.x + 184} y2={SPEC_POS.y + specH * SPEC_POS.s + 22}
                  stroke={C_SHARED} strokeWidth={1.6} />
                <text x={SPEC_POS.x + 190} y={SPEC_POS.y + specH * SPEC_POS.s + 26} fill={C_SHARED} fontSize={12} fontFamily={UI}>
                  shared rule's
                </text>
                <rect x={SPEC_POS.x} y={SPEC_POS.y + specH * SPEC_POS.s + 16} width={10} height={6} rx={2} fill={colors.NEGATIVE} opacity={0.75} />
                <text x={SPEC_POS.x + 16} y={SPEC_POS.y + specH * SPEC_POS.s + 26} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  lines past three
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== the loss gauge ======================== */}
        {gaugeU > 0.01 && opGauge > 0.005 && (
          <g opacity={opGauge}>
            <text x={GX0} y={118} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={clamp01(gaugeU * 2)}>
              mean preference loss · log scale · lower is better
            </text>
            <text x={GX1} y={144} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(gaugeU * 2) * (1 - longU)}>
              short captions · 96 layouts
            </text>
            <text x={GX1} y={144} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={longU}>
              long captions, new crops · 96 layouts
            </text>
            {/* axis */}
            <line x1={GX0} y1={AXIS_Y} x2={lerp(GX0, GX1, gaugeU)} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={1.5} />
            {[0.01, 0.03, 0.1, 0.3, 1].map((v) => (
              <g key={v} opacity={clamp01(gaugeU * 2 - 1)}>
                <line x1={lx(v)} y1={AXIS_Y - 4} x2={lx(v)} y2={AXIS_Y + 4} stroke={colors.GRID} strokeWidth={1.5} />
                <line x1={lx(v)} y1={156} x2={lx(v)} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={1} opacity={0.35} />
                <text x={lx(v)} y={AXIS_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {v}
                </text>
              </g>
            ))}
            {/* gap shading (behind the bars) */}
            {gapS > 0.01 && (
              <rect x={lx(LOSS.short.search)} y={LANE.search - 4} width={lx(SHARED_SHORT[1]) - lx(LOSS.short.search)} height={LANE.shared + BAR_H + 4 - LANE.search + 4}
                fill={C_SEARCH} opacity={0.28 * gapS * (1 - longU)} />
            )}
            {gapL > 0.01 && (
              <rect x={lx(LOSS.long.search)} y={LANE.search - 4} width={lx(SHARED_LONG[1]) - lx(LOSS.long.search)} height={LANE.shared + BAR_H + 4 - LANE.search + 4}
                fill={colors.NEGATIVE} opacity={0.26 * gapL} />
            )}
            {METHODS.map((m) => {
              const y = LANE[m];
              const col = METHOD_COLOR[m];
              const lane = m === 'wrapping' ? wrapDim : 1;
              const label = m === 'wrapping' ? 'ordinary wrapping · 224 px' : m === 'search' ? 'per-layout search' : 'shared rule · seeds 17, 41, 73';
              const shortV = m === 'shared' ? SHARED_SHORT[0] : LOSS.short[m];
              const longV = m === 'shared' ? SHARED_LONG[0] : LOSS.long[m];
              const su = shortBars[m];
              const lu = longBars[m];
              const shortEnd = lerp(GX0, lx(shortV), su);
              const longEnd = lerp(GX0, lx(longV), lu);
              const shortTxt = m === 'shared' ? `${f4(SHARED_SHORT[0])}–${f4(SHARED_SHORT[1])}` : f4(shortV);
              const longTxt = m === 'shared' ? `${f4(SHARED_LONG[0])}–${f4(SHARED_LONG[1])}` : f4(longV);
              const shortBand = m === 'shared' ? SHARED_SHORT : null;
              const longBand = m === 'shared' ? SHARED_LONG : null;
              const barH = lerp(BAR_H, 4, longU);
              return (
                <g key={m} opacity={lane * clamp01(gaugeU * 2 - 0.5)}>
                  <text x={GX0} y={y - 8} fill={col} fontSize={13} fontFamily={UI}>
                    {label}
                  </text>
                  {/* short-caption bar; collapses to a thin ghost once the long set runs */}
                  {su > 0.01 && (
                    <g opacity={lerp(1, 0.55, longU)}>
                      <rect x={GX0} y={y + BAR_H - barH} width={Math.max(0, shortEnd - GX0)} height={barH} rx={3} fill={col} opacity={0.85} />
                      {shortBand && su > 0.98 && (
                        <rect x={lx(shortBand[0])} y={y + BAR_H - barH} width={lx(shortBand[1]) - lx(shortBand[0])} height={barH} fill={col} opacity={0.45} />
                      )}
                      {shortBand && su > 0.98 && longU < 0.5 &&
                        LOSS.short.shared.map((v, k) => <line key={k} x1={lx(v)} y1={y - 3} x2={lx(v)} y2={y + BAR_H + 3} stroke={col} strokeWidth={1.2} />)}
                      <text x={(shortBand ? lx(shortBand[1]) : shortEnd) + 10} y={y + 16} fill={col} fontSize={14} fontFamily={MONO}
                        opacity={clamp01(su * 3 - 2) * (1 - longU)}>
                        {shortTxt}
                      </text>
                    </g>
                  )}
                  {lu > 0.01 && (
                    <g>
                      <rect x={GX0} y={y} width={Math.max(0, longEnd - GX0)} height={BAR_H - 6} rx={3} fill={col} opacity={0.85} />
                      {longBand && lu > 0.98 && (
                        <rect x={lx(longBand[0])} y={y} width={lx(longBand[1]) - lx(longBand[0])} height={BAR_H - 6} fill={col} opacity={0.45} />
                      )}
                      {longBand && lu > 0.98 &&
                        LOSS.long.shared.map((v, k) => <line key={k} x1={lx(v)} y1={y - 3} x2={lx(v)} y2={y + BAR_H - 3} stroke={col} strokeWidth={1.2} />)}
                      <text x={(longBand ? lx(longBand[1]) : longEnd) + 10} y={y + 14} fill={col} fontSize={14} fontFamily={MONO} opacity={clamp01(lu * 3 - 2)}>
                        {longTxt}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {gapS > 0.01 && (
              <text x={lx(LOSS.short.search)} y={LANE.shared + BAR_H + 18} fill={C_SEARCH} fontSize={12} fontFamily={UI} opacity={gapS * (1 - longU)}>
                {`close: ${(SHARED_SHORT[0] - LOSS.short.search).toFixed(4)}–${(SHARED_SHORT[1] - LOSS.short.search).toFixed(4)} above search`}
              </text>
            )}
            {gapL > 0.01 && (
              <text x={lx(LOSS.long.search) - 8} y={LANE.shared + BAR_H + 18} textAnchor="end" fill={colors.NEGATIVE} fontSize={12} fontFamily={UI} opacity={gapL}>
                {`behind search by ${(SHARED_LONG[0] - LOSS.long.search).toFixed(3)}–${(SHARED_LONG[1] - LOSS.long.search).toFixed(3)}`}
              </text>
            )}
            {longU > 0.01 && (
              <g opacity={longU * (1 - gapL)}>
                <rect x={GX0} y={LANE.shared + BAR_H + 9} width={14} height={4} rx={2} fill={colors.MUTED} opacity={0.6} />
                <text x={GX0 + 20} y={LANE.shared + BAR_H + 15} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  thin bars: the short-caption result
                </text>
              </g>
            )}
            <Chip x={GX1} y={404} text="README: lost ground on longer captions and crops" color={colors.NEGATIVE} anchor="end" opacity={lostU} />
          </g>
        )}

        {/* ======================== what the long set changes ======================== */}
        {changeU > 0.01 && (
          <g opacity={changeU * opUpper}>
            <text x={GX0} y={420} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              the long set changes two things · neither is in training
            </text>
            <text x={GX0} y={456} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              crops
            </text>
            <text x={GX0 + 70} y={456} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              {RATIOS_SHORT.join(' · ')}
            </text>
            <text x={GX0 + 70} y={480} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              {`→ ${RATIOS_LONG.join(' · ')}`}
            </text>
            <text x={GX0} y={516} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              captions
            </text>
            <text x={GX0 + 70} y={516} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
              {`mean caption width in this scene: ${MEAN_CAPTION[0].toFixed(0)} → `}
              <tspan fill={colors.WARM}>{`${MEAN_CAPTION[1].toFixed(0)} px`}</tspan>
            </text>
          </g>
        )}

        {/* ======================== CPU time (one saved run) ======================== */}
        {timeU > 0.01 && opTime > 0.005 && (
          <g opacity={timeU * opTime}>
            <text x={640} y={418} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              median CPU time per layout · µs · short captions
            </text>
            <line x1={640} y1={568} x2={1200} y2={568} stroke={colors.GRID} strokeWidth={1.5} />
            {[0, 100, 200, 300, 400].map((v) => (
              <g key={v}>
                <line x1={tx(v)} y1={564} x2={tx(v)} y2={572} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={tx(v)} y={588} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {v}
                </text>
              </g>
            ))}
            {METHODS.map((m) => {
              const y = TLANE[m];
              const col = METHOD_COLOR[m];
              const v = m === 'wrapping' ? MICROS.wrapping : m === 'shared' ? MICROS.shared : MICROS.search[0];
              const u = m === 'wrapping' ? 1 : m === 'shared' ? g(scene.tShared) : g(scene.tSearch);
              const end = lerp(640, tx(v), u);
              return (
                <g key={m} opacity={m === 'wrapping' ? 0.6 : 1}>
                  <text x={640} y={y - 6} fill={col} fontSize={13} fontFamily={UI}>
                    {m === 'wrapping' ? 'wrapping' : m === 'search' ? 'per-layout search' : 'shared rule'}
                  </text>
                  <rect x={640} y={y} width={Math.max(1.5, end - 640)} height={14} rx={2} fill={col} opacity={0.85} />
                  {u > 0.6 && (
                    <text x={m === 'search' ? end - 8 : end + 8} y={y + 12} textAnchor={m === 'search' ? 'end' : 'start'}
                      fill={m === 'search' ? '#0a0e1a' : col} fontSize={13} fontFamily={MONO} fontWeight={m === 'search' ? 700 : 400} opacity={clamp01(u * 2.5 - 1.5)}>
                      {m === 'search' ? `${v.toFixed(0)} µs` : `${v.toFixed(1)} µs`}
                    </text>
                  )}
                </g>
              );
            })}
            {g(scene.tSeeds) > 0.01 &&
              MICROS.search.slice(1).map((v, k) => (
                <g key={k} opacity={g(scene.tSeeds)}>
                  <line x1={tx(v)} y1={TLANE.search - 4} x2={tx(v)} y2={TLANE.search + 18} stroke={C_SEARCH} strokeWidth={2} strokeDasharray="3 2" />
                  <text x={tx(v)} y={TLANE.search + 32} textAnchor="middle" fill={C_SEARCH} fontSize={12} fontFamily={MONO}>
                    {`${v.toFixed(0)} · seed ${k === 0 ? 41 : 73}`}
                  </text>
                </g>
              ))}
          </g>
        )}

        {/* ======================== B7 · the caption callout ======================== */}
        {callU > 0.01 && (
          <g opacity={callU * opUpper}>
            <line x1={SPEC_POS.x + (CARD1.l + CARD1.w) * SPEC_POS.s + 4} y1={SPEC_POS.y + 60} x2={584} y2={SPEC_POS.y + 60} stroke={GOLD} strokeWidth={1.2}
              strokeDasharray="4 4" opacity={0.6} />
            <rect x={560} y={100} width={680} height={508} rx={10} fill={colors.BG} fillOpacity={0.96} stroke={colors.GRID} />
            <text x={584} y={128} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              {`card 1 at full size · Alpine Dawn · ${CARD1.w.toFixed(0)} px wide`}
            </text>
            {/* the card at 1:1 */}
            <rect x={584} y={142} width={CARD1.w} height={CARD1.ih} rx={4} fill={photoFill(SPEC_DATA.long.items[0].photo)} />
            {CARD1.lines.map((ln, j) => {
              const y0 = 142 + CARD1.ih + 8 + j * 20;
              return (
                <g key={j}>
                  {ln.words.map((w, k) => (
                    <rect key={k} x={584 + w.x} y={y0 + 2} width={w.w} height={17} rx={2} fill="none" stroke={colors.MUTED}
                      strokeWidth={1} opacity={0.55 * (1 - 0.6 * callGreyU)} />
                  ))}
                  {/* one run per line, fitted to the measured Arial 14 width (font-metrics.json) */}
                  <text x={584} y={y0 + 15} fill={colors.TEXT} fontSize={14} fontFamily="Arial, Helvetica, sans-serif" textLength={ln.width}
                    lengthAdjust="spacingAndGlyphs" style={{ whiteSpace: 'pre' }} opacity={lerp(1, 0.4, callGreyU)}>
                    {ln.words.map((w) => w.text).join(' ')}
                  </text>
                  <text x={584 + CARD1.w + 6} y={y0 + 15} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={0.4 + 0.5 * callGreyU}>
                    ↵
                  </text>
                </g>
              );
            })}
            {/* what the network reads */}
            <g opacity={callNetU}>
              <text x={800} y={170} fill={GOLD} fontSize={14} fontFamily={UI}>
                what the network reads
              </text>
              <Chip x={800} y={204} text={`caption px / 1000 = ${(CARD1_TOTAL / 1000).toFixed(3)}`} color={GOLD} mono fs={13} />
              {(() => {
                const k = 0.45;
                const words = SPEC_DATA.long.items[0].widths;
                let acc = 0;
                const cuts: number[] = [];
                words.forEach((w, i) => {
                  acc += w + (i < words.length - 1 ? SPEC_DATA.long.space : 0);
                  if (i < words.length - 1) cuts.push(acc);
                });
                const len = CARD1_TOTAL * k * clamp01(callNetU * 1.4);
                return (
                  <g>
                    <rect x={800} y={232} width={len} height={18} rx={3} fill={GOLD} opacity={0.85} />
                    {cuts.map((c, i) => (c * k < len ? <line key={i} x1={800 + c * k} y1={232} x2={800 + c * k} y2={250} stroke="#0a0e1a" strokeWidth={1} opacity={0.35} /> : null))}
                  </g>
                );
              })()}
              <text x={800} y={274} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                {`totalWidth = ${CARD1_TOTAL.toFixed(1)} px · one number`}
              </text>
            </g>
            <g opacity={callGreyU}>
              <text x={800} y={340} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                not an input:
              </text>
              <text x={800} y={364} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                each word's width, so where lines break
              </text>
              <text x={800} y={404} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                {`at ${CARD1.w.toFixed(0)} px these ${SPEC_DATA.long.items[0].widths.length} words wrap to `}
                <tspan fill={colors.NEGATIVE}>{`${CARD1.lines.length} lines`}</tspan>
              </text>
              <text x={800} y={428} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                the objective charges every line past three
              </text>
            </g>
          </g>
        )}

        {/* ======================== B8 · the safety checklist ======================== */}
        {checkU > 0.01 && (
          <g opacity={checkU}>
            <text x={640} y={414} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              {`all ${HELD_OUT_LAYOUTS} held-out layouts · 96 short + 96 long · every photo kept, in reading order`}
            </text>
            {(['missingContent', 'textOverflow', 'horizontalOverflow', 'overlaps'] as const).map((k, ci) => {
              const cx = [744, 864, 1008, 1150][ci];
              return (
                <g key={k}>
                  <text x={cx} y={450} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {k}
                  </text>
                  {METHODS.map((m, ri) => {
                    const y = 486 + ri * 40;
                    const u = clamp01(checkTicks - (ri * 4 + ci));
                    const v = INVARIANTS[k as keyof typeof INVARIANTS];
                    return (
                      <g key={m} opacity={u}>
                        <text x={cx - 6} y={y + 5} textAnchor="end" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                          {v}
                        </text>
                        <Tick x={cx + 12} y={y} s={0.9} />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {METHODS.map((m, ri) => (
              <text key={m} x={640} y={491 + ri * 40} fill={METHOD_COLOR[m]} fontSize={13} fontFamily={UI}>
                {m === 'shared' ? 'shared rule' : m}
              </text>
            ))}
          </g>
        )}

        {/* ======================== B9–B10 · the resize sweep ======================== */}
        {sweepU > 0.01 && opSweep > 0.005 && (
          <g opacity={opSweep}>
            <text x={150} y={SW} fill={colors.TEXT} fontSize={15} fontFamily={UI} opacity={clamp01(sweepU * 2)}>
              resize sweep · every width from 360 to 1180 px · short and long captions
            </text>
            <text x={150} y={SW + 22} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(sweepU * 2)}>
              {`${SWEEP_TRANSITIONS.toLocaleString('en-US')} one-pixel steps per method · a mark is a step whose photos move > 10 px on average`}
            </text>
            {/* the viewport: its right edge is the scrubber */}
            <rect x={sx(360)} y={SW + 44} width={sx(scrubW) - sx(360)} height={16} rx={3} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={Math.max(sx(360) + 70, sx(scrubW) - 8)} y={SW + 57} textAnchor="end" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {`${Math.round(scrubW)} px`}
            </text>
            <line x1={sx(scrubW)} y1={SW + 44} x2={sx(scrubW)} y2={SW + 384} stroke={colors.WARM} strokeWidth={1.5} opacity={scrubW > 360.5 && scrubW < 1179.5 ? 0.9 : 0.3} />
            <text x={1176} y={SW + 84} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={clamp01(sweepU * 2 - 1)}>
              jumps
            </text>
            {METHODS.map((m) => {
              const y = SLANE[m];
              const col = METHOD_COLOR[m];
              const jumps = SWEEP[m];
              const seen = jumps.filter((j) => j[0] <= scrubW).length;
              return (
                <g key={m} opacity={clamp01(sweepU * 2 - 0.6)}>
                  <text x={136} y={y + 5} textAnchor="end" fill={col} fontSize={13} fontFamily={UI}>
                    {m === 'shared' ? 'shared' : m}
                  </text>
                  <line x1={sx(360)} y1={y} x2={lerp(sx(360), sx(1180), sweepU)} y2={y} stroke={colors.GRID} strokeWidth={1.2} />
                  {jumps.map(([w, fam, mv], k) => {
                    if (w > scrubW) return null;
                    const h = tickH(mv);
                    const x = sx(w);
                    return <line key={k} x1={x} y1={y} x2={x} y2={fam === 0 ? y - h : y + h} stroke={col} strokeWidth={2} strokeLinecap="round" opacity={0.9} />;
                  })}
                  <text x={1176} y={y + 8} textAnchor="middle" fill={col} fontSize={22} fontFamily={MONO} fontWeight={700}>
                    {seen}
                  </text>
                </g>
              );
            })}
            <g opacity={clamp01(sweepU * 2 - 1)}>
              <text x={sx(360) - 6} y={SLANE.wrapping - 30} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                short ↑
              </text>
              <text x={sx(360) - 6} y={SLANE.wrapping + 40} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                long ↓
              </text>
              {[360, 500, 700, 900, 1180].map((w) => (
                <text key={w} x={sx(w)} y={SW + 404} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {w}
                </text>
              ))}
            </g>
            {flareU > 0.01 && (
              <g opacity={clamp01(flareU * 2)}>
                <circle cx={sx(FLARE[0])} cy={SLANE.wrapping + tickH(FLARE[2])} r={6 + 10 * flareU} fill="none" stroke={colors.WARM} strokeWidth={2} />
                <text x={sx(FLARE[0]) + 22} y={SLANE.wrapping + 40} fill={colors.WARM} fontSize={14} fontFamily={UI}>
                  {`${FLARE[2].toFixed(0)} px average move · ${FLARE[0] - 1} → ${FLARE[0]} px · long captions`}
                </text>
              </g>
            )}
            <Chip x={1150} y={SW + 4} text="all three methods reflow abruptly" color={colors.WARM} anchor="end" fs={15} opacity={stampU} />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: closing panels ======================== */}
      {panelU > 0.01 && (
        <g opacity={panelU}>
          <rect x={150} y={110} width={980} height={490} rx={14} fill={colors.BG} fillOpacity={0.97} stroke={colors.GRID} />
          <g opacity={1 - panelSwap}>
            <g opacity={notDim}>
              <text x={190} y={168} fill={colors.TEXT} fontSize={20} fontFamily={UI}>
                What isn't shown
              </text>
              {[
                ['that a network is necessary', ''],
                ['that it beats a tuned responsive formula', 'the 224 px wrapper is not tuned'],
                ['human ratings', 'none are involved; the objective is authored'],
              ].map(([a, b], i) => (
                <g key={i} opacity={clamp01(notU - i)}>
                  <circle cx={206} cy={228 + i * 92} r={15} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  <text x={206} y={234 + i * 92} textAnchor="middle" fill={colors.WARM} fontSize={17} fontFamily={UI} fontWeight={700}>
                    ?
                  </text>
                  <text x={234} y={234 + i * 92} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
                    {a}
                  </text>
                  {b && (
                    <text x={234} y={258 + i * 92} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      {b}
                    </text>
                  )}
                </g>
              ))}
            </g>
            <g opacity={statusU}>
              <line x1={650} y1={140} x2={650} y2={570} stroke={colors.GRID} />
              <rect x={690} y={140} width={196} height={58} rx={8} fill="none" stroke={colors.WARM} strokeWidth={3}
                transform={`rotate(-3 788 169) scale(1)`} />
              <text x={788} y={181} textAnchor="middle" fill={colors.WARM} fontSize={30} fontFamily={MONO} fontWeight={700} transform="rotate(-3 788 169)">
                narrowed
              </text>
              <text x={690} y={240} fill={colors.TEXT} fontSize={15} fontFamily={UI}>
                current, but limited to
              </text>
              {['this authored objective', 'these counts and widths: 6 or 12 photos, 420–1180 px', 'one photo set: twelve local photos'].map((t, i) => (
                <text key={i} x={704} y={272 + i * 28} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                  {`· ${t}`}
                </text>
              ))}
              <rect x={690} y={380} width={400} height={64} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} />
              <text x={708} y={406} fill={colors.NEGATIVE} fontSize={15} fontFamily={UI}>
                the long-caption gap
              </text>
              <text x={708} y={430} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                {`recorded, not fixed · ${f4(SHARED_LONG[0])}–${f4(SHARED_LONG[1])} vs ${f4(LOSS.long.search)}`}
              </text>
            </g>
          </g>

          {/* B13 recap */}
          {panelSwap > 0.01 && (
            <g opacity={panelSwap}>
              {(() => {
                const steps = [
                  { x: 250, label: '8 features', sub: 'about the photo and page' },
                  { x: 490, label: '121 parameters', sub: 'one rule, every photo' },
                  { x: 730, label: 'a width', sub: 'per photo, in pixels' },
                  { x: 970, label: 'taught by search', sub: 'a slow per-layout teacher' },
                ];
                return steps.map((st, i) => {
                  const u = clamp01(recapU * 1.4 - i * 0.35);
                  return (
                    <g key={i} opacity={u}>
                      {i > 0 && <line x1={st.x - 160} y1={232} x2={st.x - 82} y2={232} stroke={colors.MUTED} strokeWidth={1.5} markerEnd="" />}
                      {i > 0 && <path d={`M ${st.x - 88} 226 L ${st.x - 80} 232 L ${st.x - 88} 238`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />}
                      {i === 0 && (
                        <g>
                          {Array.from({ length: 8 }, (_, k) => (
                            <rect key={k} x={st.x - 46 + (k % 4) * 24} y={210 + Math.floor(k / 4) * 24} width={20} height={20} rx={4} fill={colors.PANEL} stroke={colors.ACCENT} />
                          ))}
                        </g>
                      )}
                      {i === 1 && (
                        <g>
                          <circle cx={st.x} cy={232} r={26} fill={colors.PANEL} stroke={GOLD} strokeWidth={2} />
                          <text x={st.x} y={240} textAnchor="middle" fill={GOLD} fontSize={22} fontFamily={UI} fontStyle="italic">
                            θ
                          </text>
                        </g>
                      )}
                      {i === 2 && (
                        <g>
                          <rect x={st.x - 40} y={206} width={80} height={52} rx={4} fill={photoFill(6)} stroke={GOLD} strokeWidth={1.5} />
                          <line x1={st.x - 40} y1={198} x2={st.x + 40} y2={198} stroke={GOLD} strokeWidth={1.5} />
                        </g>
                      )}
                      {i === 3 && <rect x={st.x - 40} y={206} width={80} height={52} rx={4} fill="none" stroke={C_SEARCH} strokeWidth={1.8} strokeDasharray="5 4" />}
                      <text x={st.x} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={UI}>
                        {st.label}
                      </text>
                      <text x={st.x} y={314} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                        {st.sub}
                      </text>
                    </g>
                  );
                });
              })()}
              {(() => {
                const items = [
                  { x: 250, label: 'short captions: close', col: C_SEARCH },
                  { x: 570, label: 'long captions: behind', col: colors.NEGATIVE },
                  { x: 890, label: 'resize: abrupt', col: colors.WARM },
                ];
                const u = clamp01(recapU - 2.2);
                return (
                  <g opacity={u}>
                    {items.map((it, i) => (
                      <g key={i}>
                        {i < 2 && (
                          <g>
                            <rect x={it.x} y={372} width={0.5 * ((i === 0 ? lx(LOSS.short.search) : lx(LOSS.long.search)) - GX0)} height={8} rx={2} fill={C_SEARCH} opacity={0.85} />
                            <rect x={it.x} y={386} width={0.5 * ((i === 0 ? lx(SHARED_SHORT[1]) : lx(SHARED_LONG[1])) - GX0)} height={8} rx={2} fill={C_SHARED} opacity={0.85} />
                          </g>
                        )}
                        {i === 2 &&
                          [0, 1, 2, 3, 4, 5, 6].map((k) => (
                            <line key={k} x1={it.x + 10 + k * 22} y1={394} x2={it.x + 10 + k * 22} y2={394 - [8, 20, 6, 24, 10, 16, 22][k]} stroke={colors.WARM} strokeWidth={2} />
                          ))}
                        <text x={it.x} y={420} fill={it.col} fontSize={14} fontFamily={UI}>
                          {it.label}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
              <text x={640} y={506} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontFamily={UI} opacity={clamp01(recapU - 3)}>
                learned sizing inside a fixed flow layout
              </text>
              <text x={640} y={534} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(recapU - 3)}>
                the network proposes widths · ordinary code wraps the rows
              </text>
            </g>
          )}
        </g>
      )}

      {/* ======================== header ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Close, and Where It Slips
      </text>
      {g(scene.scopeOp) > 0.01 && (
        <g opacity={g(scene.scopeOp)}>
          <rect x={40} y={48} width={SCOPES[scopeIdx].length * 7.83 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            {SCOPES[scopeIdx]}
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
