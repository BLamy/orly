// A Teacher That Searches
//
// Reusable Layout — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/reusable-layout/README.md:21 (authored objective; not human examples or click logs), 23 (search: ordinary
//     wrapping, ten widths twice, steps 16 8 4 2 1; coordinate search, no global-optimum guarantee), 29 (training set,
//     Adam, 160 epochs, seed 17, "excluding target generation"), 31 (held-out seeds 101-112, counts 6/12, widths
//     420/620/900/1180)
//   lab/reusable-layout/layout.ts:4-8 (padding, gap, 128-416 bounds, widthChoices), 32-61 (wrapLayout), 63-74
//     (preferenceLoss: targetArea, areaError, excessLines, 0.035, 0.08 · unusedRowFraction), 76-78 (224 start),
//     80-122 (optimizeInstance and its evaluation count)
//   lab/reusable-layout/text.ts:14-35 (prepareCaption, wrapCaption) · data.ts:1-49 (photoCaptions, createRandom,
//     createScene) · font-metrics.json (Arial 14 word widths; the subset below covers the two scenes used here)
//   lab/reusable-layout/model.ts:5-30 (eight features, 121 parameters), 71-111 (trainRule: init, Adam, batch 32,
//     step 0.008, squared error against target/400) · study.ts:13-35 (trainingExamples, heldOutScenes)
//   lab/reusable-layout/model.json (seed 17 saved parameters) · results.json (seed 17: initialLoss 0.0090918,
//     finalLoss 0.0000800, trainingMilliseconds 799.4)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The six-card stage is createScene(101, 6, 900, 'long'), rebuilt below by a line-for-line port of
// data.ts, text.ts and layout.ts, and optimizeInstance is re-run at module scope with the wide card's visits traced:
// every curve, trial dot, evaluation count and card width on screen comes from that run, and the module throws if it
// stops reproducing the probe (171 290 233 258 287 286, loss 0.09806, 181 evaluations). The training example and its
// target (seed 1 · 4 photos · 480 px → 158 239 158 257) are computed the same way. The 160 per-epoch training losses
// were produced by running trainRule(trainingExamples(), 17) from the pinned clone (initial 0.009092, final
// 0.00007996, matching results.json) and are inlined; model.json's parameters are inlined to 4 significant figures.
// The parameter grid crossfades between those two real endpoints; it does not show intermediate epochs.
// Changed from the plan: beat 11's "student converges onto the ghost for the six cards" is dropped, because that
// scene is held out and the student's answer for it belongs to chapter 3; the chapter ends with the two waiting.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const GOLD = '#d6b82e'; // book accent: the teacher (search) and its answers
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The lab, ported line for line (data.ts, text.ts, layout.ts, model.ts:12-30)
// ---------------------------------------------------------------------------

const PHOTO_CAPTIONS = [
  ['Misty Lake', 'Clouds settle between the peaks above a quiet island.', 'Low clouds drift between the peaks. A small island divides the still water, while the distant shoreline disappears into the mist.'],
  ['Desert Light', 'Late sunlight follows the ridges in the sand.', 'The last light of the afternoon draws a bright edge along each ridge, leaving the sheltered side of the dunes in deep shadow.'],
  ['Pacific Edge', 'Waves gather along the rocky coast.', 'A view along the Pacific coast, where long lines of surf reach the dark rocks and open water fills the horizon.'],
  ['Midnight City', 'Windows and street lights mark the evening skyline.', 'After sunset, the buildings become a collection of lit windows. The street below remains busy while the sky turns almost black.'],
  ['Forest Path', 'Stone steps climb through the green woodland.', 'The path climbs between mossy stones and tall trees. Sunlight reaches the steps through a small opening in the canopy above.'],
  ['Alpine Dawn', 'The first light reaches the mountain ridge.', 'Early sunlight reaches the high ridge before the valley below. Snow and exposed rock make a patchwork across the steep mountain face.'],
  ['Amalfi Morning', 'A coastal town catches the morning sun.', 'Buildings follow the steep hillside down toward the sea, with narrow streets connecting the terraces above the bright coastal water.'],
  ['North Falls', 'Water drops into the shaded valley.', 'Water gathers at the edge of the cliff and drops into the valley. Spray hangs above the rocks at the foot of the falls.'],
  ['Lavender Hour', 'Flowering rows stretch toward the horizon.', 'Rows of flowering plants follow the slope of the field. The spaces between them draw long lines toward the last light on the horizon.'],
  ['Concrete Curve', 'Light follows the curve of a concrete wall.', 'The curved wall changes from bright light to shadow as it turns away from the sun. Its simple outline frames a clear patch of sky.'],
  ['Blue Lagoon', 'Clear water meets a pale stretch of shore.', 'The water changes color over the shallow ground near the shore, from pale turquoise beside the beach to blue farther out.'],
  ['Autumn Road', 'A narrow road passes beneath autumn leaves.', 'The road bends between trees at the height of autumn. Fallen leaves gather at its edges and warm colors continue into the distance.'],
] as const;

// font-metrics.json (Arial 14, macOS AppKit), the words of the two scenes measured here
const WORD_WIDTH: Record<string, number> = {
  ' ': 3.8896484375, Alpine: 38.9169921875, Amalfi: 38.896484375, Blue: 28.0205078125, Buildings: 56.8134765625,
  'City.': 26.9609375, Concrete: 56.806640625, 'Curve.': 41.234375, 'Dawn.': 39.6826171875, Desert: 41.234375,
  Early: 31.896484375, 'Edge.': 36.5859375, 'Falls.': 33.4482421875, Forest: 39.67578125, 'Hour.': 33.4619140625,
  Its: 14.779296875, 'Lagoon.': 50.6064453125, Late: 27.248046875, Lavender: 58.37890625, 'Light.': 34.248046875,
  Midnight: 52.9169921875, 'Morning.': 54.46875, North: 34.234375, Pacific: 41.234375, 'Path.': 32.689453125,
  Rows: 35.0068359375, Snow: 35.0205078125, Spray: 36.572265625, Stone: 36.5859375, The: 24.1240234375,
  Water: 36.818359375, Waves: 42.2666015625, Windows: 56.79296875, a: 7.7861328125, above: 38.14453125,
  across: 41.234375, along: 34.2548828125, and: 23.3583984375, as: 14.7861328125, at: 11.67578125,
  away: 32.6826171875, beach: 38.14453125, before: 39.6962890625, 'below.': 39.6962890625, beside: 41.2548828125,
  between: 52.9306640625, blue: 26.46875, bright: 35.0205078125, changes: 52.9306640625, clear: 30.3447265625,
  cliff: 20.7470703125, climb: 32.6689453125, 'coast.': 37.3515625, coastal: 44.3583984375, color: 30.3447265625,
  connecting: 67.716796875, curved: 42.0205078125, down: 33.46875, draw: 30.3447265625, drops: 35.0205078125,
  edge: 31.14453125, evening: 49.041015625, exposed: 52.9306640625, 'face.': 30.3515625, 'falls.': 28.7861328125,
  farther: 40.4619140625, 'field.': 29.572265625, flowering: 56.02734375, follow: 35.79296875, follows: 42.79296875,
  foot: 23.3515625, frames: 42.7861328125, from: 28, gather: 39.6962890625, gathers: 46.6962890625,
  green: 35.806640625, ground: 43.5927734375, hangs: 38.14453125, high: 26.46875, hillside: 42.7998046875,
  'horizon.': 49.806640625, in: 10.896484375, into: 22.572265625, it: 7, last: 21.7861328125, light: 25.6826171875,
  lights: 32.6826171875, lines: 28.79296875, long: 26.46875, make: 34.234375, mark: 31.1103515625,
  mountain: 57.5927734375, narrow: 42.79296875, near: 28.0205078125, of: 11.67578125, on: 15.572265625,
  'out.': 23.3515625, outline: 41.2548828125, over: 27.234375, pale: 26.46875, patch: 34.248046875,
  patchwork: 63.806640625, plants: 37.3583984375, reaches: 49.806640625, ridge: 31.130859375, ridges: 38.130859375,
  rock: 26.4482421875, rocks: 33.4482421875, rocky: 33.4482421875, 'sand.': 34.248046875, 'sea,': 26.4619140625,
  shadow: 48.2548828125, shallow: 46.689453125, 'shore,': 38.91015625, simple: 40.455078125, 'sky.': 23.8505859375,
  'skyline.': 46.6826171875, slope: 33.46875, spaces: 44.3583984375, steep: 34.248046875, steps: 33.4619140625,
  street: 35.013671875, streets: 42.013671875, 'sun.': 26.4619140625, sunlight: 48.2548828125, terraces: 50.572265625,
  the: 19.4619140625, them: 31.1240234375, through: 47.482421875, to: 11.67578125, toward: 42.0205078125,
  turns: 31.1240234375, turquoise: 57.5927734375, valley: 35.79296875, 'valley.': 38.6435546875, wall: 24.1171875,
  water: 34.234375, 'water.': 37.3515625, with: 24.896484375, 'woodland.': 63.8271484375,
};
const measure = (word: string): number => {
  const w = WORD_WIDTH[word];
  if (w === undefined) throw new Error(`missing measured word: ${word}`);
  return w;
};

type Item = { aspectRatio: number; importance: number; words: number[]; space: number; totalWidth: number; name: string };
type Placed = { left: number; top: number; width: number; imageHeight: number; height: number; lineWidths: number[] };
type Layout = { items: Placed[]; height: number; rowCount: number; unusedRowFraction: number };

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createScene(seed: number, count: number, content: 'short' | 'long'): Item[] {
  const random = createRandom(seed);
  const ratios = content === 'short' ? [0.8, 1, 1.4, 1.8] : [0.55, 0.7, 1.15, 1.6, 2.2, 2.6];
  return Array.from({ length: count }, (_, index) => {
    const caption = PHOTO_CAPTIONS[(index + seed) % PHOTO_CAPTIONS.length];
    const text = `${caption[0]}. ${caption[content === 'short' ? 1 : 2]}`;
    const aspectRatio = ratios[Math.floor(random() * ratios.length)];
    const importance = 0.15 + random() * 0.85;
    const words = text.split(' ').map(measure);
    const space = measure(' ');
    return { aspectRatio, importance, words, space, totalWidth: words.reduce((s, w) => s + w, 0) + (words.length - 1) * space, name: caption[0] };
  });
}

const PADDING = 16;
const GAP = 16;
const MIN_W = 128;
const MAX_W = 416;
const WIDTH_CHOICES = [128, 160, 192, 224, 256, 288, 320, 352, 384, 416];
const STEPS = [16, 8, 4, 2, 1];

function wrapLines(item: Item, width: number): number[] {
  const widths: number[] = [];
  let lineWidth = 0;
  let empty = true;
  for (const w of item.words) {
    const next = lineWidth + (empty ? 0 : item.space) + w;
    if (!empty && next > width) {
      widths.push(lineWidth);
      lineWidth = w;
    } else {
      lineWidth = next;
    }
    empty = false;
  }
  if (!empty) widths.push(lineWidth);
  return widths;
}

function wrapLayout(items: Item[], viewport: number, prefs: readonly number[]): Layout {
  const inner = viewport - 2 * PADDING;
  const out: Placed[] = [];
  let left = PADDING;
  let top = PADDING;
  let rowHeight = 0;
  let rowCount = 1;
  let unused = 0;
  items.forEach((item, i) => {
    const width = Math.min(inner, MAX_W, Math.max(MIN_W, prefs[i]));
    if (left > PADDING && left + width > viewport - PADDING) {
      unused += (viewport - PADDING - (left - GAP)) / inner;
      top += rowHeight + GAP;
      left = PADDING;
      rowHeight = 0;
      rowCount++;
    }
    const lineWidths = wrapLines(item, width);
    const imageHeight = width / item.aspectRatio;
    const height = imageHeight + 8 + lineWidths.length * 20;
    out.push({ left, top, width, imageHeight, height, lineWidths });
    left += width + GAP;
    rowHeight = Math.max(rowHeight, height);
  });
  unused += (viewport - PADDING - (left - GAP)) / inner;
  return { items: out, height: top + rowHeight + PADDING, rowCount, unusedRowFraction: unused / rowCount };
}

const targetArea = (importance: number): number => 22000 * (0.7 + 1.5 * importance);

function preferenceLoss(items: Item[], layout: Layout): number {
  let total = 0;
  layout.items.forEach((p, i) => {
    const target = targetArea(items[i].importance);
    const areaError = (p.width * p.imageHeight - target) / target;
    const excessLines = Math.max(0, p.lineWidths.length - 3);
    total += areaError * areaError + 0.035 * excessLines * excessLines;
  });
  return total / layout.items.length + 0.08 * layout.unusedRowFraction;
}

type Trial = { w: number; loss: number; ev: number };
type Visit = { prefs: number[]; start: number; trials: Trial[]; best: number; step: number };

/** optimizeInstance (layout.ts:80-122), with every visit to item `focus` recorded */
function optimizeTraced(items: Item[], viewport: number, focus: number) {
  const prefs = items.map(() => 224);
  let loss = preferenceLoss(items, wrapLayout(items, viewport, prefs));
  const startLoss = loss;
  let evaluations = 1;
  const visits: Visit[] = [];
  const tryWidth = (index: number, width: number, rec: Trial[] | null) => {
    prefs[index] = width;
    const candidate = preferenceLoss(items, wrapLayout(items, viewport, prefs));
    evaluations++;
    rec?.push({ w: width, loss: candidate, ev: evaluations });
    return candidate;
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let index = 0; index < prefs.length; index++) {
      const rec: Trial[] | null = index === focus ? [] : null;
      const snapshot = [...prefs];
      let best = prefs[index];
      for (const width of WIDTH_CHOICES) {
        const c = tryWidth(index, width, rec);
        if (c < loss) {
          loss = c;
          best = width;
        }
      }
      prefs[index] = best;
      if (rec) visits.push({ prefs: snapshot, start: snapshot[index], trials: rec, best, step: 0 });
    }
  }
  for (const step of STEPS) {
    for (let index = 0; index < prefs.length; index++) {
      const rec: Trial[] | null = index === focus ? [] : null;
      const snapshot = [...prefs];
      const current = prefs[index];
      let best = current;
      for (const direction of [-1, 1]) {
        const c = tryWidth(index, Math.max(MIN_W, Math.min(MAX_W, current + direction * step)), rec);
        if (c < loss) {
          loss = c;
          best = prefs[index];
        }
      }
      prefs[index] = best;
      if (rec) visits.push({ prefs: snapshot, start: current, trials: rec, best, step });
    }
  }
  return { prefs, loss, startLoss, evaluations, visits };
}

/** model.ts:12-30 */
function itemFeatures(items: Item[], viewport: number, index: number): number[] {
  const n = items.length;
  const meanRatio = items.reduce((s, e) => s + e.aspectRatio / n, 0);
  const meanImportance = items.reduce((s, e) => s + e.importance / n, 0);
  const it = items[index];
  return [viewport / 1280, it.aspectRatio / 3, it.totalWidth / 1000, it.importance, n / 16, meanRatio / 3, index / Math.max(1, n - 1), meanImportance];
}

// ---------------------------------------------------------------------------
// The six-card stage and the traced search
// ---------------------------------------------------------------------------

const VIEW = 900;
const SCENE = createScene(101, 6, 'long');
const FOCUS = 1; // the wide card: aspect 2.6, importance ≈ 0.496
const WIDE = SCENE[FOCUS];
const RUN = optimizeTraced(SCENE, VIEW, FOCUS);
const START_PREFS = SCENE.map(() => 224);
const WRAP = wrapLayout(SCENE, VIEW, START_PREFS);
const FINAL = wrapLayout(SCENE, VIEW, RUN.prefs);
const SEARCH_W = RUN.prefs;
const TARGET_WIDE = targetArea(WIDE.importance);
const AREA_ONLY_W = Math.sqrt(TARGET_WIDE * WIDE.aspectRatio);
const evalsFor = (n: number): number => 1 + n * (2 * WIDTH_CHOICES.length + 2 * STEPS.length);
if (
  SEARCH_W.join(' ') !== '171 290 233 258 287 286' ||
  Math.abs(RUN.loss - 0.09806) > 5e-6 ||
  Math.abs(RUN.startLoss - 0.4507) > 5e-5 ||
  RUN.evaluations !== 181 ||
  evalsFor(6) !== 181 || evalsFor(12) !== 361 || evalsFor(16) !== 481 ||
  RUN.visits.length !== 7 ||
  Math.round(TARGET_WIDE) !== 31753 ||
  Math.abs(AREA_ONLY_W - 287.3) > 0.05
) {
  throw new Error('reusable-layout ch2: the ported search no longer reproduces the probe');
}

// one training example: seed 1 · 4 photos · 480 px · short captions; photo 2
const TRAIN_ITEMS = createScene(1, 4, 'short');
const TRAIN_RUN = optimizeTraced(TRAIN_ITEMS, 480, 1);
const EX_INDEX = 1;
const EX_FEATURES = itemFeatures(TRAIN_ITEMS, 480, EX_INDEX);
const EX_TARGET = TRAIN_RUN.prefs[EX_INDEX];
if (TRAIN_RUN.prefs.join(' ') !== '158 239 158 257' || TRAIN_RUN.evaluations !== 121) {
  throw new Error('reusable-layout ch2: the training example no longer reproduces the probe');
}
const FEATURE_NAMES = ['viewport / 1280', 'aspect / 3', 'caption / 1000', 'importance', 'count / 16', 'mean aspect / 3', 'reading position', 'mean importance'];

// landscapes: preferenceLoss as the wide card's width varies, the other five held where the search had them
const W_SAMPLES = Array.from({ length: MAX_W - MIN_W + 1 }, (_, i) => MIN_W + i);
const landscapeAt = (prefs: readonly number[]): number[] =>
  W_SAMPLES.map((w) => {
    const p = [...prefs];
    p[FOCUS] = w;
    return preferenceLoss(SCENE, wrapLayout(SCENE, VIEW, p));
  });
/** SNAP[k]: preferences for visit index v = k - 1 (v = −1 is "all 224"; v = 7 is the final layout) */
const SNAP: number[][] = [START_PREFS, ...RUN.visits.map((v) => v.prefs), SEARCH_W];
const LAND: number[][] = [...RUN.visits.map((v) => landscapeAt(v.prefs)), landscapeAt(SEARCH_W)];
for (const [j, v] of RUN.visits.entries()) {
  for (const t of v.trials) {
    if (Math.abs(LAND[j][t.w - MIN_W] - t.loss) > 1e-12) throw new Error('landscape does not pass through its trials');
  }
}
const AREA_SQ = W_SAMPLES.map((w) => {
  const e = ((w * w) / WIDE.aspectRatio - TARGET_WIDE) / TARGET_WIDE;
  return e * e;
});
const sampleAt = (arr: number[], w: number): number => {
  const x = Math.max(0, Math.min(arr.length - 1, w - MIN_W));
  const i = Math.min(arr.length - 2, Math.floor(x));
  return lerp(arr[i], arr[i + 1], x - i);
};
const landAt = (v: number, w: number): number => {
  const c = Math.max(0, Math.min(LAND.length - 1, v));
  const i = Math.min(LAND.length - 2, Math.floor(c));
  return lerp(sampleAt(LAND[i], w), sampleAt(LAND[i + 1], w), c - i);
};
const prefsAt = (v: number, probeW: number): number[] => {
  const c = Math.max(-1, Math.min(SNAP.length - 2, v)) + 1;
  const i = Math.min(SNAP.length - 2, Math.floor(c));
  const p = SNAP[i].map((a, k) => lerp(a, SNAP[i + 1][k], c - i));
  p[FOCUS] = probeW;
  return p;
};

// trainRule(trainingExamples(), 17): per-epoch normalized loss, from the pinned clone (see header)
const EPOCH_LOSS = [
  0.009092, 0.005392, 0.002457, 0.0008879, 0.0003544, 0.0002725, 0.0002739, 0.0002601, 0.0002588, 0.0003175, 0.0002625,
  0.0003178, 0.000234, 0.0002083, 0.000214, 0.0002008, 0.0001934, 0.0002012, 0.0002097, 0.0002056, 0.0001807, 0.0002203,
  0.000194, 0.0002313, 0.0001946, 0.0001851, 0.0001779, 0.0001694, 0.0001419, 0.0001339, 0.0001349, 0.0001161, 0.0001282,
  0.0001014, 0.0001178, 0.0000999, 0.0001359, 0.0001073, 0.00009108, 0.00009641, 0.0001441, 0.0001129, 0.00009065,
  0.00008005, 0.0000817, 0.0001373, 0.00007919, 0.00008057, 0.0000796, 0.0000827, 0.00008188, 0.00008316, 0.00009654,
  0.0000873, 0.0001026, 0.00009767, 0.00009419, 0.00009349, 0.00007919, 0.0001061, 0.0001132, 0.0001334, 0.0000932,
  0.000103, 0.00008791, 0.00008019, 0.00009408, 0.00008806, 0.00008364, 0.00008531, 0.0001325, 0.00008322, 0.0001303,
  0.0000864, 0.00008058, 0.0001072, 0.000107, 0.00008324, 0.00007682, 0.00008169, 0.0001176, 0.00008342, 0.0001082,
  0.00008558, 0.00008497, 0.00008634, 0.000101, 0.0001006, 0.00009792, 0.00008937, 0.0001183, 0.00008079, 0.0001738,
  0.0001477, 0.0002153, 0.00009626, 0.000102, 0.00009017, 0.00008601, 0.00008083, 0.00007696, 0.00008364, 0.000162,
  0.0001229, 0.00009874, 0.00007277, 0.00007644, 0.00008519, 0.00008026, 0.00008926, 0.00009564, 0.0001118, 0.0001295,
  0.00008322, 0.00009665, 0.00008308, 0.00007993, 0.0001034, 0.00009054, 0.0001233, 0.0001134, 0.00009974, 0.0001157,
  0.00008565, 0.0001157, 0.000088, 0.0000895, 0.0001656, 0.00009081, 0.0001238, 0.00008579, 0.00008953, 0.00007682,
  0.00007309, 0.0001047, 0.00009072, 0.00008076, 0.0001068, 0.00008605, 0.00008869, 0.00007534, 0.0001048, 0.000102,
  0.00008633, 0.00007691, 0.00008322, 0.0001026, 0.00009462, 0.00008156, 0.00008437, 0.00008004, 0.0001076, 0.00007252,
  0.00008436, 0.00007822, 0.00007688, 0.0000919, 0.0001489, 0.0001367, 0.00007996,
];
if (EPOCH_LOSS.length !== 160) throw new Error('expected 160 epochs');

// model.json (seed 17), 4 significant figures; layout model.ts:5-10
const SAVED = [
  0.04827, 0.4989, 0.0148, 0.2381, 0.09168, -0.07747, 0.0179, -0.1159, -0.1772, 0.04054, -0.05168, -0.008263, -0.1657, -0.2229, 0.1072,
  -0.07089, 0.003558, -0.6335, -0.07825, 0.279, -0.01852, -0.1871, 0.002928, 0.01669, -0.0139, 0.5314, -0.08177, 0.4331, -0.04888,
  0.0783, -0.03455, 0.08559, 0.04372, 0.02099, 0.04567, -0.1264, -0.1847, -0.1952, -0.09992, -0.2299, 0.02663, -0.1609, -0.2011,
  -0.1335, -0.1048, -0.1848, 0.09314, -0.2265, -0.1403, -0.2756, -0.0678, -0.1481, 0.06053, 0.1148, 0.02243, 0.06428, 0.07886,
  -0.3795, -0.1084, -0.09248, -0.04724, 0.02818, 0.006901, -0.1071, 0.06942, -0.2956, 0.05051, -0.1792, -0.05183, 0.04221,
  -0.04354, 0.07586, -0.1642, -0.3124, 0.1803, -0.2723, 0.1018, 0.1523, -0.07777, 0.2126, 0.03567, 0.06129, -0.07312, -0.2114,
  -0.03838, -0.04474, -0.2453, -0.2348, -0.006285, -0.1643, -0.165, 0.05838, 0.04084, -0.1364, -0.1115, -0.1343, -0.1051,
  0.04082, 0.2042, -0.06689, 0.04675, 0.05553, 0.2969, 0.3714, 0.2875, 0.316, 0.005639, 0.1, 0.2078, 0.1057, -0.3426, 0.3882,
  -0.05339, 0.1424, -0.08362, -0.2821, -0.1235, -0.1067, -0.009755, -0.1576, 0.4008,
];
const FEATURES = 8;
const HIDDEN = 12;
const FIRST_BIAS = FEATURES * HIDDEN;
const OUT_W = FIRST_BIAS + HIDDEN;
const OUT_BIAS = OUT_W + HIDDEN;
const PARAMS = OUT_BIAS + 1;
// trainRule's initialisation for seed 17 (model.ts:72-76)
const INIT = (() => {
  const random = createRandom(17);
  const p = Array.from({ length: PARAMS }, () => (random() - 0.5) * 0.4);
  for (let i = 0; i < HIDDEN; i++) p[FIRST_BIAS + i] = 0.1;
  p[OUT_BIAS] = 0.56;
  return p;
})();
if (SAVED.length !== 121 || PARAMS !== 121) throw new Error('expected 121 parameters');
const TRAIN_LAYOUTS = 16 * 2 * 3;
const TRAIN_EXAMPLES = 16 * (4 + 8) * 3;
if (TRAIN_LAYOUTS !== 96 || TRAIN_EXAMPLES !== 576) throw new Error('training set arithmetic');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const GS = 0.62; // gallery scale: 900 px viewport → 558 px
const GAL_Y = 122;
const GAL_LEFT = 48;
const GAL_CENTER = (STAGE_W - VIEW * GS) / 2;
const PHOTO_FILL = ['#506a86', '#86704a', '#4a7466', '#6d5f8c', '#80604f', '#47708f'];

// plot (right column)
const PL = { x0: 730, x1: 1200, y0: 268, y1: 540 };
const DOM_X_FULL: [number, number] = [MIN_W, MAX_W];
const DOM_X_ZOOM: [number, number] = [262, 318];
const DOM_Y_AREA: [number, number] = [0, 1.25];
const DOM_Y_LAND: [number, number] = [0.06, 0.52];
const DOM_Y_ZOOM: [number, number] = [0.094, 0.1165];
const scale1 = (d: [number, number], r0: number, r1: number) => (v: number) => r0 + ((v - d[0]) / (d[1] - d[0])) * (r1 - r0);

// tally (B7)
const TALLY = { x: 790, y: 262, cell: 12, gap: 2, row: 30 };

// training grid (B8)
const TG = { x0: 250, pitch: 59, y0: 196, rowPitch: 46, h: 30 };
const TG_ROWS = [4, 8].flatMap((count) => [480, 768, 1080].map((width) => ({ count, width })));

// parameter grid (B9–B10)
const PG = { x: 214, y: 312, cell: 15, gap: 3 };

// loss plot (B10)
const LP = { x0: 780, x1: 1180, y0: 330, y1: 540 };
const LOG_LO = Math.log10(0.00005);
const LOG_HI = Math.log10(0.012);
const lpX = (e: number) => LP.x0 + (e / 159) * (LP.x1 - LP.x0);
const lpY = (l: number) => LP.y1 - ((Math.log10(l) - LOG_LO) / (LOG_HI - LOG_LO)) * (LP.y1 - LP.y0);

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_CARD: CameraState = { x: 380, y: 250, k: 1.45 };
const CAM_OBJ: CameraState = { x: 640, y: 330, k: 1.04 };
const CAM_CALC: CameraState = { x: 700, y: 340, k: 1.06 };
const CAM_ZOOM: CameraState = { x: 760, y: 370, k: 1.08 };
const CAM_TRAIN: CameraState = { x: 680, y: 340, k: 1.06 };

/** per-item progress from one group channel */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);

  const galU = tl.channel('galleryIn', 0);
  const galOp = tl.channel('galleryOp', 1);
  const galX = tl.channel('galleryX', GAL_LEFT);
  const ghostU = tl.channel('ghostU', 0);
  const ghostOp = tl.channel('ghostOp', 1);
  const teachU = tl.channel('teacherU', 0);
  const studU = tl.channel('studentU', 0);
  const badgeOp = tl.channel('badgeOp', 1);
  const badgeEnd = tl.channel('badgeEnd', 0);
  const linkU = tl.channel('linkU', 0);
  const focusU = tl.channel('focusCard', 0);
  // B1
  const stampU = tl.channel('stampU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const crossU = tl.channel('crossU', 0);
  const stampOp = tl.channel('stampOp', 1);
  // B2–B3 objective
  const targetU = tl.channel('targetU', 0);
  const targetOp = tl.channel('targetOp', 1);
  const fArea = tl.channel('fArea', 0);
  const excessU = tl.channel('excessU', 0);
  const rowTailU = tl.channel('rowTailU', 0);
  const fRest = tl.channel('fRest', 0);
  const fSum = tl.channel('fSum', 0);
  const objOp = tl.channel('objOp', 1);
  // B4–B6 the landscape
  const calcU = tl.channel('calcU', 0);
  const calc2U = tl.channel('calc2U', 0);
  const calcOp = tl.channel('calcOp', 1);
  const axisU = tl.channel('plotAxis', 0);
  const curveU = tl.channel('curveDraw', 0);
  const areaMarkU = tl.channel('areaOnlyMark', 0);
  const landU = tl.channel('areaToLandscape', 0);
  const plotOp = tl.channel('plotOp', 1);
  const visit = tl.channel('visit', -1);
  const probeW = tl.channel('probeW', 224);
  const keptW = tl.channel('keptW', 224);
  const ringU = tl.channel('ringU', 0);
  const trialsShown = tl.channel('trialsShown', 0);
  const evals = tl.channel('evaluations', 1);
  const zoomU = tl.channel('zoomU', 0);
  const ladderU = tl.channel('ladderU', 0);
  const stepIdx = tl.channel('stepIdx', -1);
  const settleU = tl.channel('settleU', 0);
  // B7 tally
  const tallyU = tl.channel('tallyU', 0);
  const tallyTextU = tl.channel('tallyTextU', 0);
  const countsU = tl.channel('countsU', 0);
  const tagU = tl.channel('noGuaranteeU', 0);
  const tallyOp = tl.channel('tallyOp', 1);
  // B8 training set
  const tgU = tl.channel('trainGridU', 0);
  const tgDots = tl.channel('trainDotsU', 0);
  const tgCount = tl.channel('trainCountU', 0);
  const tgOp = tl.channel('trainGridOp', 1);
  // B9–B10 training
  const exU = tl.channel('exampleU', 0);
  const pgU = tl.channel('paramGridU', 0);
  const adamU = tl.channel('adamU', 0);
  const epoch = tl.channel('epoch', 0);
  const lossAxisU = tl.channel('lossAxisU', 0);
  const lossEndU = tl.channel('lossEndsU', 0);
  const seededU = tl.channel('seededU', 0);
  const trainOp = tl.channel('trainOp', 1);
  // B11 held out
  const heldU = tl.channel('heldOutU', 0);
  const waitU = tl.channel('waitU', 0);

  let t = 0.4;
  const HOLD = 0.7;
  const beat = (dur: number, text: string): number => {
    const at = t;
    t = tl.caption({ at, dur, text });
    t = tl.hold(t, HOLD);
    return at;
  };

  // — B0 · the teacher and its answers —
  let b = beat(11.0, 'To train the rule you need right answers. They come from a teacher: a slow search that tunes one layout at a time against a written-down objective.');
  tl.tween(galU, 1, { at: b + 0.2, dur: 1.4, ease: ease.linear });
  tl.tween(studU, 1, { at: b + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(teachU, 1, { at: b + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(linkU, 1, { at: b + 4.0, dur: 1.1, ease: ease.draw });
  tl.tween(ghostU, 1, { at: b + 4.8, dur: 1.2, ease: ease.linear });
  tl.tween(badgeOp, 0, { at: b + 7.0, dur: 0.6, ease: ease.move });
  tl.tween(focusU, 1, { at: b + 7.0, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_CARD, { at: b + 7.0, dur: 1.4, ease: ease.move });

  // — B1 · an authored preference —
  b = beat(11.4, "That objective is the lab's own invention. The code calls it an authored preference, not a model of human taste. No people, examples or click logs are involved.");
  tl.tween(cam, CAM_HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(focusU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(galOp, 0.12, { at: b + 0.4, dur: 0.7, ease: ease.move });
  tl.tween(ghostOp, 0, { at: b + 0.4, dur: 0.7, ease: ease.move });
  tl.tween(stampU, 1, { at: b + 1.6, dur: 0.6, ease: ease.pop });
  tl.tween(chipsU, 1, { at: b + 6.4, dur: 0.8, ease: ease.enter });
  tl.tween(crossU, 1, { at: b + 7.6, dur: 1.0, ease: ease.draw });

  // — B2 · area follows importance —
  b = beat(11.0, "First preference: a photo's area should follow its importance. Target area is twenty-two thousand square pixels times point seven plus one point five times importance.");
  tl.tween(stampOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(galOp, 1, { at: b + 0.3, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_OBJ, { at: b + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(targetU, 1, { at: b + 1.4, dur: 1.4, ease: ease.linear });
  tl.tween(fArea, 1, { at: b + 4.6, dur: 0.7, ease: ease.enter });

  // — B3 · lines and rows —
  b = beat(12.4, 'Second, a caption longer than three lines is penalized, squared. Third, a small charge for unused row width. Photo terms are averaged; the row charge is added once per layout.');
  tl.tween(targetOp, 0.15, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(excessU, 1, { at: b + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(fRest, 1, { at: b + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(rowTailU, 1, { at: b + 4.0, dur: 1.0, ease: ease.draw });
  tl.tween(fRest, 2, { at: b + 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(fSum, 1, { at: b + 7.4, dur: 0.8, ease: ease.enter });

  // — B4 · the wide photo, by area alone —
  b = beat(14.5, "Take the wide photo with aspect ratio 2.6 and importance about a half. Its target area is about 31,800 square pixels, so area alone asks for roughly 287 pixels of width.");
  tl.tween(objOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(excessU, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(rowTailU, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(focusU, 1, { at: b + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(targetOp, 1, { at: b + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_CALC, { at: b + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(calcU, 1, { at: b + 2.6, dur: 0.7, ease: ease.enter });
  tl.tween(axisU, 1, { at: b + 5.2, dur: 1.2, ease: ease.draw });
  tl.tween(curveU, 1, { at: b + 6.2, dur: 1.5, ease: ease.draw });
  tl.tween(calc2U, 1, { at: b + 8.2, dur: 0.7, ease: ease.enter });
  tl.tween(areaMarkU, 1, { at: b + 9.0, dur: 0.8, ease: ease.enter });

  // — B5 · ten widths, twice —
  b = beat(11.6, 'Search starts every photo at 224 pixels. Then it tries ten widths, from 128 to 416, and keeps any that lowers the loss. It makes two such passes.');
  tl.tween(cam, CAM_HOME, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(calcOp, 0.15, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(targetOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(landU, 1, { at: b + 0.2, dur: 1.1, ease: ease.move });
  tl.tween(ringU, 1, { at: b + 0.5, dur: 0.5, ease: ease.enter });
  tl.tween(visit, 0, { at: b + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(evals, RUN.visits[0].trials[0].ev - 1, { at: b + 0.6, dur: 0.6, ease: ease.linear });
  let shown = 0;
  let c = b + 1.4;
  for (let j = 0; j < 2; j++) {
    const v = RUN.visits[j];
    if (j > 0) {
      tl.tween(visit, j, { at: c, dur: 0.8, ease: ease.move });
      tl.tween(evals, v.trials[0].ev - 1, { at: c, dur: 0.8, ease: ease.linear });
      c += 0.95;
    }
    for (const tr of v.trials) {
      shown++;
      tl.set(probeW, tr.w, c);
      tl.set(trialsShown, shown, c);
      tl.set(evals, tr.ev, c);
      c += 0.3;
    }
    tl.tween(probeW, v.best, { at: c, dur: 0.35, ease: ease.move });
    tl.tween(keptW, v.best, { at: c, dur: 0.35, ease: ease.move });
    c += 0.5;
  }

  // — B6 · shrinking steps —
  b = beat(11.4, 'Then it nudges each photo by plus or minus sixteen, eight, four, two and one pixel. Here it settles at 290 pixels, close to that area-only answer.');
  tl.tween(zoomU, 1, { at: b + 0.1, dur: 1.1, ease: ease.move });
  tl.tween(cam, CAM_ZOOM, { at: b + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(ladderU, 1, { at: b + 0.5, dur: 0.6, ease: ease.enter });
  c = b + 0.3;
  for (let j = 2; j < RUN.visits.length; j++) {
    const v = RUN.visits[j];
    tl.tween(visit, j, { at: c, dur: 0.45, ease: ease.move });
    tl.tween(evals, v.trials[0].ev - 1, { at: c, dur: 0.45, ease: ease.linear });
    tl.set(stepIdx, j - 2, c);
    c += 0.6;
    for (const tr of v.trials) {
      shown++;
      tl.set(probeW, tr.w, c);
      tl.set(trialsShown, shown, c);
      tl.set(evals, tr.ev, c);
      c += 0.38;
    }
    tl.tween(probeW, v.best, { at: c, dur: 0.3, ease: ease.move });
    tl.tween(keptW, v.best, { at: c, dur: 0.3, ease: ease.move });
    c += 0.42;
  }
  tl.tween(visit, RUN.visits.length, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(evals, RUN.evaluations, { at: c, dur: 0.5, ease: ease.linear });
  tl.tween(settleU, 1, { at: c + 0.3, dur: 0.5, ease: ease.pop });

  // — B7 · what it costs —
  b = beat(14.0, "That costs thirty evaluations per photo, plus one: 181 for six photos, 361 for twelve, 481 for sixteen. And it's coordinate search, with no promise of the global best.");
  tl.tween(cam, CAM_HOME, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(plotOp, 0.1, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(calcOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(ladderU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(tallyU, 1, { at: b + 0.6, dur: 2.4, ease: ease.linear });
  tl.tween(tallyTextU, 1, { at: b + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(countsU, 1, { at: b + 3.6, dur: 1.8, ease: ease.linear });
  tl.tween(tagU, 1, { at: b + 9.4, dur: 0.7, ease: ease.enter });

  // — B8 · the training set —
  b = beat(11.5, 'Now the student learns to imitate. Training uses sixteen collections of four or eight photos at three widths, short captions only: 96 layouts, 576 photo examples.');
  tl.tween(tallyOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(plotOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(galOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(settleU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_TRAIN, { at: b + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(tgU, 1, { at: b + 1.0, dur: 2.2, ease: ease.linear });
  tl.tween(tgDots, 1, { at: b + 3.6, dur: 2.6, ease: ease.linear });
  tl.tween(tgCount, 1, { at: b + 6.4, dur: 0.7, ease: ease.enter });

  // — B9 · features → the search's width; Adam —
  b = beat(10.4, "Each example pairs eight features with the search's width. An optimizer called Adam adjusts the 121 parameters over 160 passes, shrinking the squared error.");
  tl.tween(tgOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_HOME, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(exU, 1, { at: b + 0.5, dur: 1.4, ease: ease.linear });
  tl.tween(pgU, 1, { at: b + 2.8, dur: 1.4, ease: ease.linear });
  tl.tween(adamU, 1, { at: b + 4.4, dur: 0.7, ease: ease.enter });

  // — B10 · the loss falls —
  b = beat(13.0, 'For seed 17, the normalized loss falls from about 0.0091 to 0.00008 in under a second of training. Training is seeded, so the saved model reproduces exactly.');
  tl.tween(lossAxisU, 1, { at: b + 0.2, dur: 1.0, ease: ease.draw });
  tl.tween(epoch, 159, { at: b + 1.2, dur: 5.6, ease: ease.linear });
  tl.tween(lossEndU, 1, { at: b + 7.0, dur: 0.6, ease: ease.enter });
  tl.tween(seededU, 1, { at: b + 8.8, dur: 0.7, ease: ease.enter });

  // — B11 · held out —
  b = beat(9.6, 'Now the fair test: held-out scenes with new collections, counts and widths. Does a student that never saw them land near its teacher?');
  tl.tween(trainOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.set(galX, GAL_CENTER, b);
  tl.set(ghostOp, 1, b);
  tl.set(badgeEnd, 1, b);
  tl.tween(heldU, 1, { at: b + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(galOp, 1, { at: b + 1.2, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 330, k: 1.06 }, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(badgeOp, 1, { at: b + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(waitU, 1, { at: b + 4.2, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 5.4, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  return {
    tl, cam, galU, galOp, galX, ghostU, ghostOp, teachU, studU, badgeOp, badgeEnd, linkU, focusU,
    stampU, chipsU, crossU, stampOp, targetU, targetOp, fArea, excessU, rowTailU, fRest, fSum, objOp,
    calcU, calc2U, calcOp, axisU, curveU, areaMarkU, landU, plotOp, visit, probeW, keptW, ringU, trialsShown, evals,
    zoomU, ladderU, stepIdx, settleU, tallyU, tallyTextU, countsU, tagU, tallyOp, tgU, tgDots, tgCount, tgOp,
    exU, pgU, adamU, epoch, lossAxisU, lossEndU, seededU, trainOp, heldU, waitU,
  };
}

const scene = buildScene();

// trial dots, in the order the timeline reveals them
const TRIALS = RUN.visits.flatMap((v, j) => v.trials.map((tr) => ({ ...tr, visit: j })));

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

function Gear({ x, y, r, color, op }: { x: number; y: number; r: number; color: string; op: number }) {
  const teeth = 8;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.78;
    pts.push(`${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`);
  }
  return (
    <g opacity={op}>
      <polygon points={pts.join(' ')} fill={colors.PANEL} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={r * 0.32} fill="none" stroke={color} strokeWidth={2.5} />
    </g>
  );
}

function Dial({ x, y, r, color, op, angle, question }: { x: number; y: number; r: number; color: string; op: number; angle: number; question?: boolean }) {
  const a = (angle * Math.PI) / 180;
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={r} fill={colors.PANEL} stroke={color} strokeWidth={2.5} />
      {Array.from({ length: 9 }, (_, i) => {
        const ta = Math.PI * (0.75 + (i / 8) * 1.5);
        return <line key={i} x1={x + Math.cos(ta) * r * 0.78} y1={y + Math.sin(ta) * r * 0.78} x2={x + Math.cos(ta) * r * 0.92} y2={y + Math.sin(ta) * r * 0.92} stroke={color} strokeWidth={1.5} />;
      })}
      {question ? (
        <text x={x} y={y + 9} textAnchor="middle" fontSize={26} fontFamily={UI} fill={color}>
          ?
        </text>
      ) : (
        <>
          <line x1={x} y1={y} x2={x + Math.cos(a) * r * 0.7} y2={y + Math.sin(a) * r * 0.7} stroke={color} strokeWidth={3} strokeLinecap="round" />
          <circle cx={x} cy={y} r={4} fill={color} />
        </>
      )}
    </g>
  );
}

/** one card of the gallery, in stage coordinates */
function Card({ p, gx, i, op, excess, focus }: { p: Placed; gx: number; i: number; op: number; excess: number; focus: number }) {
  const x = gx + p.left * GS;
  const y = GAL_Y + p.top * GS;
  const w = p.width * GS;
  const ih = p.imageHeight * GS;
  const lineY = (k: number) => y + ih + 8 * GS + k * 20 * GS;
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={ih} rx={2} fill={PHOTO_FILL[i]} opacity={0.85} />
      <path d={`M ${x} ${y + ih * 0.72} L ${x + w * 0.32} ${y + ih * 0.42} L ${x + w * 0.55} ${y + ih * 0.62} L ${x + w * 0.78} ${y + ih * 0.36} L ${x + w} ${y + ih * 0.6} L ${x + w} ${y + ih} L ${x} ${y + ih} Z`} fill="#0a0e1a" opacity={0.28} />
      {focus > 0.005 && <rect x={x - 3} y={y - 3} width={w + 6} height={p.height * GS + 6} rx={4} fill="none" stroke={colors.TEXT} strokeWidth={1.5} opacity={focus} />}
      {p.lineWidths.map((lw, k) => (
        <rect key={k} x={x} y={lineY(k) + 4 * GS} width={Math.min(lw, p.width) * GS} height={9 * GS} rx={2} fill={k >= 3 ? (excess > 0.5 ? colors.NEGATIVE : colors.MUTED) : colors.MUTED} opacity={k >= 3 ? lerp(0.55, 0.95, excess) : 0.55} />
      ))}
      {excess > 0.005 && p.lineWidths.length > 3 && (
        <line x1={x - 4} y1={lineY(3) + 1} x2={x + w + 4} y2={lineY(3) + 1} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="4 3" opacity={excess} />
      )}
    </g>
  );
}

/** x-axis tick label positions for the landscape plot */
const X_TICKS = [128, 160, 192, 224, 256, 288, 320, 352, 384, 416];
const X_TICKS_ZOOM = [264, 272, 280, 288, 296, 304, 312];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- gallery
  const galU = v(scene.galU);
  const galOp = v(scene.galOp);
  const gx = v(scene.galX);
  const visitV = v(scene.visit);
  const probe = v(scene.probeW);
  const kept = v(scene.keptW);
  const prefs = prefsAt(visitV, probe);
  const lay = wrapLayout(SCENE, VIEW, prefs);
  const ghostU = v(scene.ghostU) * v(scene.ghostOp);
  const focusU = v(scene.focusU);
  const excessU = v(scene.excessU);
  const rowTailU = v(scene.rowTailU);
  const targetU = v(scene.targetU) * v(scene.targetOp);
  const heldU = v(scene.heldU);
  const end = v(scene.badgeEnd) > 0.5;
  const otherOp = end ? 1 : 1 - 0.85 * focusU;

  // ---- badges
  const badgeOp = v(scene.badgeOp);
  const teachU = v(scene.teachU);
  const studU = v(scene.studU);
  const linkU = v(scene.linkU);
  const waitU = v(scene.waitU);
  const TB = end ? { x: 150, y: 330 } : { x: 860, y: 300 };
  const SB = end ? { x: 1130, y: 330 } : { x: 1090, y: 300 };

  // ---- objective
  const objOp = v(scene.objOp);
  const fArea = v(scene.fArea);
  const fRest = v(scene.fRest);
  const fSum = v(scene.fSum);

  // ---- plot
  const plotOp = v(scene.plotOp);
  const axisU = v(scene.axisU);
  const curveU = v(scene.curveU);
  const landU = v(scene.landU);
  const zoomU = v(scene.zoomU);
  const dx: [number, number] = [lerp(DOM_X_FULL[0], DOM_X_ZOOM[0], zoomU), lerp(DOM_X_FULL[1], DOM_X_ZOOM[1], zoomU)];
  const dyL: [number, number] = [lerp(DOM_Y_LAND[0], DOM_Y_ZOOM[0], zoomU), lerp(DOM_Y_LAND[1], DOM_Y_ZOOM[1], zoomU)];
  const X = scale1(dx, PL.x0, PL.x1);
  const YA = scale1(DOM_Y_AREA, PL.y1, PL.y0);
  const YL = scale1(dyL, PL.y1, PL.y0);
  const curveY = (w: number): number => lerp(YA(sampleAt(AREA_SQ, w)), YL(landAt(visitV, w)), landU);
  const nPts = Math.max(2, Math.round(W_SAMPLES.length * curveU));
  const curvePath = W_SAMPLES.slice(0, nPts)
    .map((w, i) => `${i ? 'L' : 'M'} ${X(w).toFixed(2)} ${curveY(w).toFixed(2)}`)
    .join(' ');
  const shownN = Math.round(v(scene.trialsShown));
  const curVisit = Math.max(0, Math.round(visitV));
  const ringU = v(scene.ringU);
  const evalsN = Math.round(v(scene.evals));
  const ladderU = v(scene.ladderU);
  const stepI = Math.round(v(scene.stepIdx));
  const settleU = v(scene.settleU);
  const areaMarkU = v(scene.areaMarkU);
  const calcOp = v(scene.calcOp);

  // ---- tally
  const tallyOp = v(scene.tallyOp);
  const tallyU = v(scene.tallyU);
  const countsU = v(scene.countsU);

  // ---- training
  const tgOp = v(scene.tgOp);
  const tgU = v(scene.tgU);
  const tgDots = v(scene.tgDots);
  const trainOp = v(scene.trainOp);
  const exU = v(scene.exU);
  const pgU = v(scene.pgU);
  const ep = v(scene.epoch);
  const epU = ep / 159;
  const lossAxisU = v(scene.lossAxisU);

  // rows of the current gallery layout (for the unused-row tails)
  const rows: Array<{ top: number; end: number; h: number }> = [];
  lay.items.forEach((p) => {
    const last = rows[rows.length - 1];
    if (!last || Math.abs(last.top - p.top) > 0.5) rows.push({ top: p.top, end: p.left + p.width, h: p.height });
    else {
      last.end = p.left + p.width;
      last.h = Math.max(last.h, p.height);
    }
  });

  const wideP = lay.items[FOCUS];
  /** gallery labels hide when the camera pushes them off the stage */
  const onStage = (x0: number, x1: number): number => {
    const a = 640 + (x0 - cam.x) * cam.k;
    const b2 = 640 + (x1 - cam.x) * cam.k;
    return a >= 4 && b2 <= STAGE_W - 4 ? 1 : 0;
  };
  const showGallery = galOp > 0.005 && galU > 0.005;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="hrl2-plot-clip">
          <rect x={PL.x0 - 4} y={PL.y0 - 10} width={PL.x1 - PL.x0 + 8} height={PL.y1 - PL.y0 + 14} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the six-card gallery (the persistent stage) ================= */}
        {showGallery && (
          <g opacity={galOp}>
            <text x={gx} y={GAL_Y - 30} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={galU * onStage(gx, gx + 280)}>
              {"createScene(101, 6, 900, 'long')"}
            </text>
            <text x={gx + VIEW * GS} y={GAL_Y - 30} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={galU * (1 - heldU) * onStage(gx + VIEW * GS - 130, gx + VIEW * GS)}>
              900 px viewport
            </text>
            <rect x={gx} y={GAL_Y - 12} width={VIEW * GS} height={lay.height * GS + 12} rx={6} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={galU} />
            {lay.items.map((p, i) => (
              <Card
                key={i}
                p={p}
                gx={gx}
                i={i}
                op={staggerU(galU, i, 6, 0.12, 0.5) * (i === FOCUS ? 1 : otherOp) * (end ? 0.18 : 1)}
                excess={excessU}
                focus={i === FOCUS ? focusU * (end ? 0 : 1) : 0}
              />
            ))}

            {/* unused row tails (B3) */}
            {rowTailU > 0.005 &&
              rows.map((r, k) => {
                const x0 = gx + r.end * GS + 4;
                const full = (VIEW - PADDING - r.end) * GS - 4;
                return (
                  <g key={k}>
                    <rect x={x0} y={GAL_Y + r.top * GS} width={full * rowTailU} height={r.h * GS} rx={3} fill={colors.WARM} opacity={0.18} />
                    <rect x={x0} y={GAL_Y + r.top * GS} width={full * rowTailU} height={r.h * GS} rx={3} fill="none" stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
                    <text x={x0 + full / 2} y={GAL_Y + (r.top + r.h / 2) * GS + 5} textAnchor="middle" fontSize={13} fill={colors.WARM} opacity={clamp01(rowTailU * 2 - 1)}>
                      unused
                    </text>
                  </g>
                );
              })}
            {excessU > 0.02 && (
              <text x={gx + (wideP.left + wideP.width / 2) * GS} y={GAL_Y + (wideP.top + wideP.height) * GS + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.NEGATIVE} opacity={excessU}>
                {`${wideP.lineWidths.length} lines: ${Math.max(0, wideP.lineWidths.length - 3)} past the limit`}
              </text>
            )}

            {/* target-area outlines (B2: all six; B4: the wide card) */}
            {targetU > 0.005 &&
              lay.items.map((p, i) => {
                const it = SCENE[i];
                const tw = Math.sqrt(targetArea(it.importance) * it.aspectRatio);
                const th = tw / it.aspectRatio;
                const u = staggerU(v(scene.targetU), i, 6, 0.15, 0.6);
                const op = targetU * u * (focusU > 0.5 && i !== FOCUS ? 0.15 : 1);
                if (op <= 0.005) return null;
                const x = gx + p.left * GS;
                const y = GAL_Y + p.top * GS;
                return (
                  <g key={i} opacity={op}>
                    <rect x={x} y={y} width={tw * GS} height={th * GS} fill={colors.NEGATIVE} opacity={0.14} />
                    <rect x={x} y={y} width={tw * GS} height={th * GS} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="5 3" />
                    <text x={x + 5} y={y + 16} fontSize={12} fontFamily={MONO} fill={colors.TEXT} opacity={onStage(x, x + 70)}>
                      {`imp ${it.importance.toFixed(2)}`}
                    </text>
                  </g>
                );
              })}

            {/* the teacher's answers: ghost outlines at the search widths */}
            {ghostU > 0.005 &&
              FINAL.items.map((p, i) => {
                const u = staggerU(ghostU, i, 6, 0.12, 0.5);
                const x = gx + p.left * GS;
                const y = GAL_Y + p.top * GS;
                const w = p.width * GS;
                return (
                  <g key={i} opacity={u * (end ? 1 : 1 - 0.85 * focusU * (i === FOCUS ? 0 : 1))}>
                    <rect x={x} y={y} width={w} height={p.height * GS} rx={3} fill={end ? GOLD : 'none'} fillOpacity={end ? 0.06 : 0} stroke={GOLD} strokeWidth={1.8} strokeDasharray="6 4" />
                    <text x={x + w / 2} y={y + (p.imageHeight * GS) / 2 + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={GOLD}>
                      {`${SEARCH_W[i]} px`}
                    </text>
                  </g>
                );
              })}

            {/* the wide card's live width during the search */}
            {ringU > 0.005 && plotOp > 0.5 && !end && (
              <text x={gx + (wideP.left + wideP.width / 2) * GS} y={GAL_Y + wideP.top * GS - 6} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={settleU > 0.5 ? GOLD : colors.TEXT} opacity={ringU * onStage(gx + wideP.left * GS, gx + (wideP.left + wideP.width) * GS)}>
                {`${Math.round(probe)} px`}
              </text>
            )}
          </g>
        )}

        {/* ================= badges: teacher (search) and student (shared rule) ================= */}
        {badgeOp > 0.005 && (teachU > 0.005 || studU > 0.005) && (
          <g opacity={badgeOp}>
            <g opacity={teachU}>
              <Gear x={TB.x} y={TB.y} r={38} color={GOLD} op={1} />
              <text x={TB.x} y={TB.y + 66} textAnchor="middle" fontSize={17} fill={GOLD}>
                teacher
              </text>
              <text x={TB.x} y={TB.y + 88} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                optimizeInstance
              </text>
              <text x={TB.x} y={TB.y + 106} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                per-layout search
              </text>
            </g>
            <g opacity={studU}>
              <Dial x={SB.x} y={SB.y} r={38} color={end ? colors.ACCENT : colors.MUTED} op={end ? 1 : 0.5} angle={-60} question={end} />
              <text x={SB.x} y={SB.y + 66} textAnchor="middle" fontSize={17} fill={end ? colors.ACCENT : colors.MUTED} opacity={end ? 1 : 0.7}>
                student
              </text>
              <text x={SB.x} y={SB.y + 88} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={end ? 1 : 0.7}>
                {end ? 'shared rule, trained' : 'shared rule · untrained'}
              </text>
              <text x={SB.x} y={SB.y + 106} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={end ? 1 : 0.7}>
                121 parameters
              </text>
            </g>
            {!end && linkU > 0.005 && (
              <g opacity={linkU}>
                <path d={`M ${TB.x - 46} ${TB.y - 8} C ${TB.x - 120} ${TB.y - 70}, 700 160, 640 182`} fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="1000" strokeDashoffset={1000 * (1 - linkU)} />
                <text x={TB.x - 40} y={TB.y - 66} textAnchor="middle" fontSize={14} fill={GOLD} opacity={clamp01(linkU * 2 - 1)}>
                  right answers
                </text>
              </g>
            )}
            {end && waitU > 0.005 && (
              <g opacity={waitU}>
                <text x={TB.x} y={TB.y - 62} textAnchor="middle" fontSize={14} fill={GOLD}>
                  {`loss ${RUN.loss.toFixed(4)}`}
                </text>
                <text x={SB.x} y={SB.y - 62} textAnchor="middle" fontSize={14} fill={colors.ACCENT}>
                  never saw this scene
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B1 · the stamp ================= */}
        {v(scene.stampU) > 0.005 && v(scene.stampOp) > 0.005 && (
          <g opacity={v(scene.stampOp)}>
            <g opacity={clamp01(v(scene.stampU) * 1.5)} transform={`translate(905, 250) rotate(-2) scale(${lerp(1.35, 1, v(scene.stampU))})`}>
              <rect x={-250} y={-58} width={500} height={116} rx={8} fill={colors.PANEL} stroke={GOLD} strokeWidth={3} />
              <rect x={-240} y={-48} width={480} height={96} rx={5} fill="none" stroke={GOLD} strokeWidth={1.2} opacity={0.6} />
              <text x={0} y={-12} textAnchor="middle" fontSize={28} fontWeight={700} fill={GOLD} letterSpacing={2}>
                AUTHORED PREFERENCE
              </text>
              <text x={0} y={32} textAnchor="middle" fontSize={18} fill={colors.TEXT}>
                not a model of human taste
              </text>
            </g>
            <text x={905} y={360} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(v(scene.stampU) * 2 - 1)}>
              {'// This is an authored preference, not a model of human taste.'}
            </text>
            {v(scene.chipsU) > 0.005 &&
              ['people', 'human examples', 'click logs'].map((label, k) => {
                const u = staggerU(v(scene.chipsU), k, 3, 0.15, 0.5);
                const cx = 735 + k * 170;
                const w = label.length * 9 + 34;
                const cu = staggerU(v(scene.crossU), k, 3, 0.2, 0.5);
                return (
                  <g key={label} opacity={u}>
                    <rect x={cx - w / 2} y={420} width={w} height={38} rx={19} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} opacity={1 - 0.4 * cu} />
                    <text x={cx} y={445} textAnchor="middle" fontSize={16} fill={colors.TEXT} opacity={1 - 0.5 * cu}>
                      {label}
                    </text>
                    <line x1={cx - w / 2 - 6} y1={439} x2={lerp(cx - w / 2 - 6, cx + w / 2 + 6, cu)} y2={439} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
                  </g>
                );
              })}
            <text x={905} y={500} textAnchor="middle" fontSize={14} fill={colors.MUTED} opacity={v(scene.crossU)}>
              none of these enter the objective
            </text>
          </g>
        )}

        {/* ================= B2–B3 · the objective, term by term ================= */}
        {objOp > 0.005 && (fArea > 0.005 || fRest > 0.005) && (
          <g opacity={objOp}>
            <g opacity={fArea * (1 - clamp01(fRest))}>
              <MathLabel tex={'\\text{targetArea} = 22000\\,(0.7 + 1.5\\cdot\\text{importance})'} x={940} y={170} fontSize={22} boxWidth={560} color={colors.TEXT} />
              <MathLabel tex={'\\text{areaError} = \\dfrac{w\\cdot h - \\text{targetArea}}{\\text{targetArea}}'} x={940} y={250} fontSize={22} boxWidth={560} color={colors.TEXT} />
              <rect x={760} y={340} width={26} height={16} fill={colors.NEGATIVE} fillOpacity={0.14} stroke={colors.NEGATIVE} strokeDasharray="5 3" />
              <text x={796} y={353} fontSize={14} fill={colors.TEXT}>
                target area, same crop
              </text>
              <rect x={760} y={370} width={26} height={16} fill={PHOTO_FILL[1]} />
              <text x={796} y={383} fontSize={14} fill={colors.TEXT}>
                actual w × h at 224 px
              </text>
            </g>
            {fRest > 0.005 && (
              <g opacity={clamp01(fRest)}>
                <MathLabel tex={'\\text{excessLines} = \\max(0,\\ \\text{lines} - 3)'} x={940} y={150} fontSize={22} boxWidth={560} color={colors.NEGATIVE} />
                <MathLabel tex={'\\text{unusedRowFraction}'} x={940} y={205} fontSize={22} boxWidth={560} color={colors.WARM} opacity={clamp01(fRest - 1)} />
              </g>
            )}
            {fSum > 0.005 && (
              <g opacity={fSum}>
                <rect x={680} y={262} width={520} height={176} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={700} y={288} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  preferenceLoss(layout)
                </text>
                <MathLabel tex={'\\tfrac{1}{n}\\textstyle\\sum_i \\big(\\text{areaError}_i^2 + 0.035\\,\\text{excessLines}_i^2\\big)'} x={940} y={322} fontSize={21} boxWidth={500} color={colors.TEXT} />
                <MathLabel tex={'+\\; 0.08\\cdot\\text{unusedRowFraction}'} x={940} y={372} fontSize={21} boxWidth={500} color={colors.WARM} />
                <text x={700} y={424} fontSize={13} fill={colors.MUTED}>
                  photo terms averaged · row charge once per layout
                </text>
                <text x={940} y={480} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
                  {`every photo at 224 px → loss ${RUN.startLoss.toFixed(4)}`}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B4 · the wide photo by area alone ================= */}
        {calcOp > 0.005 && v(scene.calcU) > 0.005 && (
          <g opacity={calcOp}>
            <MathLabel
              tex={`\\text{targetArea} = 22000\\,(0.7 + 1.5\\times ${WIDE.importance.toFixed(3)}) \\approx ${commas(TARGET_WIDE).replace(',', '{,}')}\\ \\text{px}^2`}
              x={960}
              y={150}
              fontSize={20}
              boxWidth={620}
              color={colors.TEXT}
              opacity={v(scene.calcU)}
            />
            <MathLabel
              tex={`w = \\sqrt{${commas(TARGET_WIDE).replace(',', '{,}')} \\times ${WIDE.aspectRatio}} \\approx ${AREA_ONLY_W.toFixed(1)}\\ \\text{px}`}
              x={960}
              y={205}
              fontSize={20}
              boxWidth={620}
              color={GOLD}
              opacity={v(scene.calc2U)}
            />
          </g>
        )}

        {/* ================= B4–B7 · the landscape of one photo ================= */}
        {plotOp > 0.005 && axisU > 0.005 && (
          <g opacity={plotOp}>
            <line x1={PL.x0} y1={PL.y1} x2={lerp(PL.x0, PL.x1, axisU)} y2={PL.y1} stroke={colors.MUTED} strokeWidth={1.5} />
            <line x1={PL.x0} y1={PL.y1} x2={PL.x0} y2={lerp(PL.y1, PL.y0, axisU)} stroke={colors.MUTED} strokeWidth={1.5} />
            {(zoomU < 0.5 ? X_TICKS : X_TICKS_ZOOM).map((w, i, arr) => {
              const xx = X(w);
              const op = (zoomU < 0.5 ? 1 - zoomU * 2 : zoomU * 2 - 1) * staggerU(axisU, i, arr.length, 0.05, 0.5);
              if (op <= 0.01 || xx < PL.x0 - 1 || xx > PL.x1 + 1) return null;
              const lab = zoomU < 0.5 ? landU > 0.5 || w === 128 || w === 416 || w === 224 || w === 320 : true;
              return (
                <g key={`${zoomU < 0.5}-${w}`} opacity={op}>
                  <line x1={xx} y1={PL.y1} x2={xx} y2={PL.y1 + 6} stroke={colors.MUTED} strokeWidth={1.2} />
                  {lab && (
                    <text x={xx} y={PL.y1 + 21} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                      {w}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={PL.x1} y={PL.y1 + 42} textAnchor="end" fontSize={13} fill={colors.MUTED} opacity={axisU}>
              wide card's width (px)
            </text>
            <text x={PL.x0} y={PL.y0 - 16} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={axisU * (1 - landU)}>
              areaError² of this photo
            </text>
            <text x={PL.x0} y={PL.y0 - 16} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={axisU * landU}>
              preferenceLoss(layout), other five held
            </text>
            {landU > 0.5 && ringU > 0.005 && (
              <text x={PL.x1} y={PL.y0 - 16} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={ringU}>
                {`evaluations ${evalsN}`}
              </text>
            )}

            <g clipPath="url(#hrl2-plot-clip)">
              {/* the area-only answer */}
              {areaMarkU > 0.005 && (
                <g opacity={areaMarkU * (zoomU > 0.5 ? 0.9 : 1)}>
                  <line x1={X(AREA_ONLY_W)} y1={PL.y0} x2={X(AREA_ONLY_W)} y2={PL.y1} stroke={GOLD} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />
                </g>
              )}
              {curveU > 0.005 && <path d={curvePath} fill="none" stroke={landU > 0.5 ? colors.ACCENT : colors.NEGATIVE} strokeWidth={2.6} strokeLinejoin="round" />}
              {/* trial dots: this visit bright, earlier visits a whisper */}
              {TRIALS.slice(0, shownN).map((tr, k) => {
                const cur = tr.visit === curVisit;
                return <circle key={k} cx={X(tr.w)} cy={YL(tr.loss)} r={cur ? 5 : 3.5} fill={cur ? colors.TEXT : colors.MUTED} opacity={cur ? 0.95 : 0.15} />;
              })}
              {/* the probe and the kept width */}
              {ringU > 0.005 && landU > 0.5 && (
                <>
                  <circle cx={X(kept)} cy={YL(landAt(visitV, kept))} r={10} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={ringU} />
                  <circle cx={X(probe)} cy={YL(landAt(visitV, probe))} r={4.5} fill={colors.TEXT} opacity={ringU} />
                </>
              )}
            </g>
            {areaMarkU > 0.005 && (
              <text x={X(AREA_ONLY_W) + 8} y={PL.y0 + 14} fontSize={13} fontFamily={MONO} fill={GOLD} opacity={areaMarkU * (zoomU > 0.5 ? 0 : 1)}>
                {`area alone: ${AREA_ONLY_W.toFixed(1)} px`}
              </text>
            )}
            {areaMarkU > 0.005 && zoomU > 0.5 && (
              <text x={X(AREA_ONLY_W) - 8} y={PL.y1 - 12} textAnchor="end" fontSize={13} fontFamily={MONO} fill={GOLD} opacity={areaMarkU * (zoomU * 2 - 1)}>
                {`area alone ${AREA_ONLY_W.toFixed(1)}`}
              </text>
            )}
            {settleU > 0.005 && (
              <text x={X(SEARCH_W[FOCUS]) + 14} y={YL(landAt(visitV, SEARCH_W[FOCUS])) + 36} fontSize={16} fontFamily={MONO} fill={GOLD} opacity={settleU}>
                {`search: ${SEARCH_W[FOCUS]} px`}
              </text>
            )}
            {/* the step ladder */}
            {ladderU > 0.005 && (
              <g opacity={ladderU}>
                <text x={PL.x0 + 10} y={PL.y0 + 18} fontSize={13} fill={colors.MUTED}>
                  step ±
                </text>
                {STEPS.map((st, k) => (
                  <g key={st}>
                    <rect x={PL.x0 + 62 + k * 40} y={PL.y0 + 2} width={34} height={24} rx={5} fill={k === stepI ? GOLD : colors.PANEL} stroke={k <= stepI ? GOLD : colors.GRID} strokeWidth={1.2} />
                    <text x={PL.x0 + 79 + k * 40} y={PL.y0 + 19} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={k === stepI ? colors.BG : k < stepI ? GOLD : colors.MUTED}>
                      {st}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ================= B7 · the cost ================= */}
        {tallyOp > 0.005 && tallyU > 0.005 && (
          <g opacity={tallyOp}>
            <MathLabel tex={'\\text{evaluations} = 1 + (\\underbrace{2\\times 10}_{\\text{passes}} + \\underbrace{5\\times 2}_{\\text{steps}})\\,n = 1 + 30n'} x={960} y={168} fontSize={20} boxWidth={600} color={colors.TEXT} opacity={v(scene.tallyTextU)} />
            <rect x={TALLY.x - 30} y={TALLY.y + 2} width={TALLY.cell + 4} height={TALLY.cell + 4} rx={2} fill={colors.TEXT} opacity={clamp01(tallyU * 20)} />
            <text x={TALLY.x - 22} y={TALLY.y - 8} textAnchor="middle" fontSize={12} fill={colors.MUTED} opacity={clamp01(tallyU * 20)}>
              start
            </text>
            {[
              { label: 'pass 1', x: 0 },
              { label: 'pass 2', x: 10 },
              { label: '±16 … ±1', x: 20 },
            ].map((h) => (
              <text key={h.label} x={TALLY.x + (h.x + 5) * (TALLY.cell + TALLY.gap)} y={TALLY.y - 8} textAnchor="middle" fontSize={12} fill={h.x === 20 ? GOLD : colors.ACCENT} opacity={v(scene.tallyTextU)}>
                {h.label}
              </text>
            ))}
            {Array.from({ length: 6 }, (_, r) => (
              <g key={r}>
                <text x={TALLY.x - 46} y={TALLY.y + r * TALLY.row + 14} textAnchor="end" fontSize={12} fill={colors.MUTED} opacity={staggerU(tallyU, r, 6, 0.1, 0.4)}>
                  {`photo ${r + 1}`}
                </text>
                {Array.from({ length: 30 }, (_, k) => {
                  const u = staggerU(tallyU, r * 30 + k, 180, 0.004, 0.06);
                  if (u <= 0) return null;
                  const xx = TALLY.x + k * (TALLY.cell + TALLY.gap) + (k >= 10 ? 4 : 0) + (k >= 20 ? 4 : 0);
                  return <rect key={k} x={xx} y={TALLY.y + r * TALLY.row + 2} width={TALLY.cell} height={TALLY.cell + 4} rx={2} fill={k >= 20 ? GOLD : colors.ACCENT} opacity={u * (k >= 10 && k < 20 ? 0.6 : 0.9)} />;
                })}
              </g>
            ))}
            {[6, 12, 16].map((n, k) => {
              const u = staggerU(countsU, k, 3, 0.3, 0.5);
              return (
                <g key={n} opacity={u}>
                  <rect x={760 + k * 150} y={450} width={136} height={58} rx={8} fill={colors.PANEL} stroke={k === 0 ? colors.TEXT : colors.GRID} strokeWidth={1.4} />
                  <text x={828 + k * 150} y={473} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                    {`${n} photos`}
                  </text>
                  <text x={828 + k * 150} y={498} textAnchor="middle" fontSize={20} fontFamily={MONO} fill={colors.TEXT}>
                    {evalsFor(n)}
                  </text>
                </g>
              );
            })}
            <g opacity={v(scene.tagU)}>
              <rect x={740} y={530} width={470} height={34} rx={17} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <text x={975} y={552} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                coordinate search · no guarantee of the global optimum
              </text>
            </g>
          </g>
        )}

        {/* ================= B8 · the training set ================= */}
        {tgOp > 0.005 && tgU > 0.005 && (
          <g opacity={tgOp}>
            <text x={TG.x0 + 7.5 * TG.pitch + 24} y={TG.y0 - 30} textAnchor="middle" fontSize={15} fill={colors.TEXT} opacity={clamp01(tgU * 3)}>
              collection seeds 1 – 16
            </text>
            {Array.from({ length: 16 }, (_, col) => (
              <text key={col} x={TG.x0 + col * TG.pitch + 24} y={TG.y0 - 10} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={staggerU(tgU, col, 16, 0.03, 0.3)}>
                {col + 1}
              </text>
            ))}
            {TG_ROWS.map((row, r) => (
              <g key={r}>
                <text x={TG.x0 - 16} y={TG.y0 + r * TG.rowPitch + 20} textAnchor="end" fontSize={13} fill={colors.MUTED} opacity={staggerU(tgU, r, 6, 0.08, 0.3)}>
                  {`${row.count} photos · ${row.width} px`}
                </text>
                {Array.from({ length: 16 }, (_, col) => {
                  const i = r * 16 + col;
                  const u = staggerU(tgU, i, 96, 0.012, 0.15);
                  if (u <= 0) return null;
                  const w = (row.width / 1080) * 48;
                  const x = TG.x0 + col * TG.pitch + (48 - w) / 2;
                  const y = TG.y0 + r * TG.rowPitch;
                  const du = staggerU(tgDots, i, 96, 0.012, 0.2);
                  const per = 4;
                  return (
                    <g key={col} opacity={u}>
                      <rect x={x} y={y} width={w} height={TG.h} rx={3} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1} opacity={0.9} />
                      {du > 0 &&
                        Array.from({ length: row.count }, (_, d) => {
                          const cx = x + w / 2 + ((d % per) - (per - 1) / 2) * Math.min(5, (w - 6) / per);
                          const cy = y + (row.count === 4 ? TG.h / 2 : TG.h / 2 + (d < per ? -5 : 5));
                          return <circle key={d} cx={cx} cy={cy} r={1.8} fill={GOLD} opacity={du} />;
                        })}
                    </g>
                  );
                })}
              </g>
            ))}
            <g opacity={v(scene.tgCount)}>
              <text x={TG.x0 + 2 * TG.pitch} y={TG.y0 + 6 * TG.rowPitch + 30} textAnchor="middle" fontSize={22} fontFamily={MONO} fill={colors.TEXT}>
                {`${TRAIN_LAYOUTS} layouts`}
              </text>
              <text x={TG.x0 + 7.5 * TG.pitch + 24} y={TG.y0 + 6 * TG.rowPitch + 30} textAnchor="middle" fontSize={22} fontFamily={MONO} fill={GOLD}>
                {`${TRAIN_EXAMPLES} photo examples`}
              </text>
              <text x={TG.x0 + 13 * TG.pitch + 24} y={TG.y0 + 6 * TG.rowPitch + 30} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                short captions only
              </text>
              <text x={TG.x0 + 7.5 * TG.pitch + 24} y={TG.y0 + 6 * TG.rowPitch + 58} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                each dot: one photo, labelled with the search's width
              </text>
            </g>
          </g>
        )}

        {/* ================= B9–B10 · imitation ================= */}
        {trainOp > 0.005 && exU > 0.005 && (
          <g opacity={trainOp}>
            <text x={90} y={118} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(exU * 3)}>
              {`one example · seed 1 · 4 photos · 480 px · photo 2 (${TRAIN_ITEMS[EX_INDEX].name})`}
            </text>
            {EX_FEATURES.map((f, k) => {
              const u = staggerU(exU, k, 9, 0.08, 0.3);
              const x = 90 + k * 112;
              return (
                <g key={k} opacity={u}>
                  <rect x={x} y={134} width={104} height={62} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
                  <text x={x + 52} y={160} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={colors.TEXT}>
                    {f.toFixed(3)}
                  </text>
                  <text x={x + 52} y={184} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
                    {FEATURE_NAMES[k]}
                  </text>
                </g>
              );
            })}
            <g opacity={staggerU(exU, 8, 9, 0.08, 0.3)}>
              <line x1={990} y1={165} x2={1030} y2={165} stroke={colors.TEXT} strokeWidth={2} />
              <polygon points="1030,159 1040,165 1030,171" fill={colors.TEXT} />
              <rect x={1048} y={134} width={150} height={62} rx={6} fill={colors.PANEL} stroke={GOLD} strokeWidth={1.8} strokeDasharray="6 4" />
              <text x={1123} y={162} textAnchor="middle" fontSize={20} fontFamily={MONO} fill={GOLD}>
                {`${EX_TARGET} px`}
              </text>
              <text x={1123} y={184} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
                {"the search's width"}
              </text>
            </g>

            {/* the 121 parameters: 12 hidden units × (8 weights, bias, output weight) + output bias */}
            {pgU > 0.005 && (
              <g opacity={clamp01(pgU * 2)}>
                <text x={PG.x} y={PG.y - 16} fontSize={14} fill={colors.TEXT}>
                  121 parameters
                </text>
                {['8 weights', 'bias', 'out'].map((h, k) => (
                  <text key={h} x={PG.x + [4 * 18, 8 * 18 + 8, 9 * 18 + 16][k] + 6} y={PG.y + 12 * 18 + 18} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
                    {h}
                  </text>
                ))}
                {Array.from({ length: HIDDEN }, (_, r) =>
                  Array.from({ length: 10 }, (_, cIdx) => {
                    const idx = cIdx < 8 ? r * FEATURES + cIdx : cIdx === 8 ? FIRST_BIAS + r : OUT_W + r;
                    const val = lerp(INIT[idx], SAVED[idx], clamp01(epU));
                    const u = staggerU(pgU, r * 10 + cIdx, 120, 0.004, 0.2);
                    const x = PG.x + cIdx * (PG.cell + PG.gap) + (cIdx >= 8 ? 8 : 0) + (cIdx >= 9 ? 8 : 0);
                    const y = PG.y + r * (PG.cell + PG.gap);
                    const pulse = ep > 0 && ep < 159 ? 0.35 * clamp01(1 - Math.abs(((ep / 13.25) % 12) - r)) : 0;
                    return (
                      <rect key={`${r}-${cIdx}`} x={x} y={y} width={PG.cell} height={PG.cell} rx={2} fill={val >= 0 ? colors.ACCENT : colors.NEGATIVE} opacity={u * Math.min(1, 0.12 + Math.abs(val) * 1.8 + pulse)} />
                    );
                  }),
                )}
                <rect x={PG.x + 9 * (PG.cell + PG.gap) + 16} y={PG.y + 12 * (PG.cell + PG.gap) + 26} width={PG.cell} height={PG.cell} rx={2} fill={colors.ACCENT} opacity={pgU * Math.min(1, 0.12 + Math.abs(lerp(INIT[OUT_BIAS], SAVED[OUT_BIAS], clamp01(epU))) * 1.8)} />
                <text x={PG.x + 9 * (PG.cell + PG.gap) + 10} y={PG.y + 12 * (PG.cell + PG.gap) + 38} textAnchor="end" fontSize={12} fill={colors.MUTED} opacity={pgU}>
                  output bias
                </text>
                <text x={PG.x} y={PG.y + 12 * 18 + 70} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={pgU}>
                  {ep < 1 ? 'seed 17 initialisation' : ep >= 158.5 ? 'saved: model.json' : 'updating…'}
                </text>
              </g>
            )}

            {/* Adam */}
            {v(scene.adamU) > 0.005 && (
              <g opacity={v(scene.adamU)}>
                <rect x={470} y={312} width={190} height={130} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
                <text x={565} y={340} textAnchor="middle" fontSize={18} fill={colors.SECONDARY}>
                  Adam
                </text>
                <text x={565} y={364} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  batch 32
                </text>
                <text x={565} y={384} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  step 0.008
                </text>
                <text x={565} y={420} textAnchor="middle" fontSize={20} fontFamily={MONO} fill={colors.TEXT}>
                  {`epoch ${Math.min(160, Math.round(ep) + (ep > 0 ? 1 : 0))} / 160`}
                </text>
                <MathLabel tex={'\\text{loss} = \\operatorname{mean}\\big(\\text{output} - \\tfrac{\\text{target}}{400}\\big)^2'} x={560} y={500} fontSize={18} boxWidth={300} color={colors.TEXT} />
              </g>
            )}

            {/* the training loss, one point per epoch (log scale) */}
            {lossAxisU > 0.005 && (
              <g>
                <line x1={LP.x0} y1={LP.y1} x2={lerp(LP.x0, LP.x1, lossAxisU)} y2={LP.y1} stroke={colors.MUTED} strokeWidth={1.5} />
                <line x1={LP.x0} y1={LP.y1} x2={LP.x0} y2={lerp(LP.y1, LP.y0, lossAxisU)} stroke={colors.MUTED} strokeWidth={1.5} />
                {[0.0001, 0.001, 0.01].map((l) => (
                  <g key={l} opacity={lossAxisU}>
                    <line x1={LP.x0} y1={lpY(l)} x2={LP.x1} y2={lpY(l)} stroke={colors.GRID} strokeWidth={1} />
                    <text x={LP.x0 - 8} y={lpY(l) + 4} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                      {l === 0.01 ? '0.01' : l === 0.001 ? '0.001' : '0.0001'}
                    </text>
                  </g>
                ))}
                {[0, 40, 80, 120, 160].map((e) => (
                  <text key={e} x={lpX(Math.min(159, e))} y={LP.y1 + 20} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={lossAxisU}>
                    {e}
                  </text>
                ))}
                <text x={LP.x1} y={LP.y1 + 42} textAnchor="end" fontSize={13} fill={colors.MUTED} opacity={lossAxisU}>
                  epoch
                </text>
                <text x={LP.x0} y={LP.y0 - 14} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={lossAxisU}>
                  normalized training loss · seed 17
                </text>
                {ep > 0.01 && (
                  <path
                    d={EPOCH_LOSS.slice(0, Math.max(2, Math.floor(ep) + 1))
                      .map((l, e) => `${e ? 'L' : 'M'} ${lpX(e).toFixed(1)} ${lpY(l).toFixed(1)}`)
                      .join(' ')}
                    fill="none"
                    stroke={colors.ACCENT}
                    strokeWidth={2.2}
                    strokeLinejoin="round"
                  />
                )}
                {ep > 0.01 && <circle cx={lpX(0)} cy={lpY(EPOCH_LOSS[0])} r={4.5} fill={colors.ACCENT} />}
                <g opacity={v(scene.lossEndU)}>
                  <text x={lpX(0) + 12} y={lpY(EPOCH_LOSS[0]) + 5} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    {EPOCH_LOSS[0].toFixed(4)}
                  </text>
                  <circle cx={lpX(159)} cy={lpY(EPOCH_LOSS[159])} r={4.5} fill={colors.ACCENT} />
                  <text x={lpX(159)} y={lpY(EPOCH_LOSS[159]) - 54} textAnchor="end" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    {EPOCH_LOSS[159].toFixed(5)}
                  </text>
                </g>
                <g opacity={v(scene.seededU)}>
                  <rect x={LP.x0 + 150} y={LP.y0 - 6} width={330} height={56} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
                  <text x={LP.x0 + 315} y={LP.y0 + 16} textAnchor="middle" fontSize={13} fill={colors.TEXT}>
                    seeded · the saved model reproduces exactly
                  </text>
                  <text x={LP.x0 + 315} y={LP.y0 + 38} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                    one saved run: 799 ms of training
                  </text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* ================= B11 · held out ================= */}
        {heldU > 0.005 && (
          <g opacity={heldU}>
            <rect x={300} y={30} width={680} height={38} rx={19} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
            <text x={640} y={54} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              held out · seeds 101–112 · counts 6, 12 · widths 420, 620, 900, 1180
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
