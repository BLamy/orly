// One Rule for Every Photo
//
// Reusable Layout — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/reusable-layout/README.md:3 (one function, parameters reused for every item and collection),
//     11 (eight numbers, 12-unit ReLU layer, 121 parameters; "Stable IDs do not enter the learned function"),
//     13 (133 operations, five dependency layers per item)
//   lab/reusable-layout/model.ts:5-10 (featureCount, hiddenWidth, parameterCount), 12-30 (itemFeatures),
//     36-47 (96 multiplies, 12 roundAffine sums, 12 reglu, 12 output multiplies, 1 sum), 58 (× 400)
//   lab/reusable-layout/model.json (seed 17's 121 saved parameters, embedded below)
//   lab/reusable-layout/data.ts:1-14 (photo titles), 28-53 (createRandom, createScene)
//   lab/reusable-layout/layout.ts:4-8 (padding, gap, 128–416), 32-61 (wrapLayout), 65-74 (preferenceLoss),
//     76-78 (ordinary 224 px), 80-122 (optimizeInstance — the ghost outlines of beat 11)
//   lab/reusable-layout/text.ts:14-35 (wrapCaption); font-metrics.json (Arial 14 word widths, embedded below)
//   lab/reusable-layout/layout.test.ts:41-49 (reversed storage and ids 999 − 13·i leave preferences equal)
//   src/runtime/numeric-ui-core.ts:1683-1690 (reglu: value · max(0, gate))
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The six photos are the held-out scene createScene(101, 6, 900, 'long'),
// rebuilt here from data.ts's own generator; features, the forward pass through model.json's parameters,
// wrapLayout, wrapCaption and the per-page search are ported and computed at module scope. A probe run
// against the clone gives 161.3 / 275.7 / 232.7 / 254.8 / 274.9 / 272.4 px (rule) and
// 171 / 290 / 233 / 258 / 287 / 286 px (search), which this module reproduces. The two small "other page"
// thumbnails in beat 2 are SCHEMATIC (labelled); their widths 1180 / 420 are held-out widths (study.ts:31).
// Depth histogram from the probe (circuit.operations[].depth/kind):
//   1: reglu ×96 · 2: affine ×12 · 3: reglu ×12 · 4: reglu ×12 · 5: affine ×1.
import {
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH13 = 7.8; // mono advance at 13 px
const CH12 = 7.2; // mono advance at 12 px
const signed = (x: number, d = 3): string => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(d);

// ---------------------------------------------------------------------------
// The lab's own code, ported (data.ts, model.ts, text.ts, layout.ts)
// ---------------------------------------------------------------------------

/** data.ts:28-34 */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const TITLES = ['Misty Lake', 'Desert Light', 'Pacific Edge', 'Midnight City', 'Forest Path', 'Alpine Dawn', 'Amalfi Morning', 'North Falls', 'Lavender Hour', 'Concrete Curve', 'Blue Lagoon', 'Autumn Road'];

/** Arial 14 word widths from font-metrics.json for the long captions of photos 5–10 ("Title. long text"). */
const SPACE_W = 3.8896484375;
const WORD_W: Record<number, number[]> = {
  5: [38.9169921875, 39.6826171875, 31.896484375, 48.2548828125, 49.806640625, 19.4619140625, 26.46875, 31.130859375, 39.6962890625, 19.4619140625, 35.79296875, 39.6962890625, 35.0205078125, 23.3583984375, 52.9306640625, 26.4482421875, 34.234375, 7.7861328125, 63.806640625, 41.234375, 19.4619140625, 34.248046875, 57.5927734375, 30.3515625],
  6: [38.896484375, 54.46875, 56.8134765625, 35.79296875, 19.4619140625, 34.248046875, 42.7998046875, 33.46875, 42.0205078125, 19.4619140625, 26.4619140625, 24.896484375, 42.79296875, 42.013671875, 67.716796875, 19.4619140625, 50.572265625, 38.14453125, 19.4619140625, 35.0205078125, 44.3583984375, 37.3515625],
  7: [34.234375, 33.4482421875, 36.818359375, 46.6962890625, 11.67578125, 19.4619140625, 31.14453125, 11.67578125, 19.4619140625, 20.7470703125, 23.3583984375, 35.0205078125, 22.572265625, 19.4619140625, 38.6435546875, 36.572265625, 38.14453125, 38.14453125, 19.4619140625, 33.4482421875, 11.67578125, 19.4619140625, 23.3515625, 11.67578125, 19.4619140625, 28.7861328125],
  8: [58.37890625, 33.4619140625, 35.0068359375, 11.67578125, 56.02734375, 37.3583984375, 35.79296875, 19.4619140625, 33.46875, 11.67578125, 19.4619140625, 29.572265625, 24.1240234375, 44.3583984375, 52.9306640625, 31.1240234375, 30.3447265625, 26.46875, 28.79296875, 42.0205078125, 19.4619140625, 21.7861328125, 25.6826171875, 15.572265625, 19.4619140625, 49.806640625],
  9: [56.806640625, 41.234375, 24.1240234375, 42.0205078125, 24.1171875, 52.9306640625, 28, 35.0205078125, 25.6826171875, 11.67578125, 48.2548828125, 14.7861328125, 7, 31.1240234375, 32.6826171875, 28, 19.4619140625, 26.4619140625, 14.779296875, 40.455078125, 41.2548828125, 42.7861328125, 7.7861328125, 30.3447265625, 34.248046875, 11.67578125, 23.8505859375],
  10: [28.0205078125, 50.6064453125, 24.1240234375, 34.234375, 52.9306640625, 30.3447265625, 27.234375, 19.4619140625, 46.689453125, 43.5927734375, 28.0205078125, 19.4619140625, 38.91015625, 28, 26.46875, 57.5927734375, 41.2548828125, 19.4619140625, 38.14453125, 11.67578125, 26.46875, 40.4619140625, 23.3515625],
};

type Item = { id: number; title: string; ar: number; imp: number; words: number[]; total: number };

/** data.ts:36-53 — createScene(101, 6, 900, 'long'), the held-out scene used throughout. */
const SEED = 101;
const VIEW_W = 900;
const ITEMS: Item[] = (() => {
  const random = createRandom(SEED);
  const ratios = [0.55, 0.7, 1.15, 1.6, 2.2, 2.6];
  return Array.from({ length: 6 }, (_, index) => {
    const photo = (index + SEED) % TITLES.length;
    const ar = ratios[Math.floor(random() * ratios.length)];
    const imp = 0.15 + random() * 0.85;
    const words = WORD_W[photo];
    const total = words.reduce((a, b) => a + b, 0) + (words.length - 1) * SPACE_W;
    return { id: SEED * 16 + index, title: TITLES[photo], ar, imp, words, total };
  });
})();
const N = ITEMS.length;

/** model.ts:12-30 — the eight numbers. No id among them. */
const FEATURE_NAMES = ['viewport/1280', 'aspect/3', 'caption px/1000', 'importance', 'count/16', 'mean aspect/3', 'position', 'mean importance'];
const FEATURES: number[][] = ITEMS.map((item, index) => {
  const meanRatio = ITEMS.reduce((a, e) => a + e.ar / N, 0);
  const meanImp = ITEMS.reduce((a, e) => a + e.imp / N, 0);
  return [VIEW_W / 1280, item.ar / 3, item.total / 1000, item.imp, N / 16, meanRatio / 3, index / Math.max(1, N - 1), meanImp];
});

/** model.ts:5-10 */
const FEATURE_COUNT = 8;
const HIDDEN = 12;
const FIRST_BIAS = FEATURE_COUNT * HIDDEN;
const OUT_W = FIRST_BIAS + HIDDEN;
const OUT_B = OUT_W + HIDDEN;
const PARAM_COUNT = OUT_B + 1; // 121
/** circuit.operations by depth (probe): 96 products, 12 sums, 12 relu, 12 output products, 1 sum. */
const DEPTHS = [
  { d: 1, n: FEATURE_COUNT * HIDDEN, kind: 'reglu' },
  { d: 2, n: HIDDEN, kind: 'affine' },
  { d: 3, n: HIDDEN, kind: 'reglu' },
  { d: 4, n: HIDDEN, kind: 'reglu' },
  { d: 5, n: 1, kind: 'affine' },
];
const OP_COUNT = DEPTHS.reduce((a, d) => a + d.n, 0); // 133

/** model.json, seed 17 (the saved demo model). */
const THETA = [0.04826521500945091, 0.4989331364631653, 0.01480194553732872, 0.23813074827194214, 0.0916820615530014, -0.07747112214565277, 0.01790113002061844, -0.1159481480717659, -0.1771947294473648, 0.04054328799247742, -0.05168444663286209, -0.008262870833277702, -0.16574816405773163, -0.22285419702529907, 0.10721638798713684, -0.07088905572891235, 0.003558096708729863, -0.6334618926048279, -0.0782502293586731, 0.279008686542511, -0.018521565943956375, -0.18711943924427032, 0.002928260713815689, 0.016690580174326897, -0.013903641141951084, 0.531365156173706, -0.08176671713590622, 0.43305739760398865, -0.04888338968157768, 0.07830172032117844, -0.03454966843128204, 0.08558715879917145, 0.0437157079577446, 0.020986510440707207, 0.04567061737179756, -0.12641791999340057, -0.1846962422132492, -0.1951654553413391, -0.09992176294326782, -0.2298717498779297, 0.026631375774741173, -0.16085085272789001, -0.2011449933052063, -0.1335178017616272, -0.10483907908201218, -0.18475589156150818, 0.09314162284135818, -0.2264513075351715, -0.1403069645166397, -0.2755865752696991, -0.06779734790325165, -0.14808909595012665, 0.060526683926582336, 0.11479195207357407, 0.022427136078476906, 0.06427643448114395, 0.07886016368865967, -0.37949877977371216, -0.10842709243297577, -0.09247782826423645, -0.04723802208900452, 0.02818029187619686, 0.006900695152580738, -0.10705619305372238, 0.06942270696163177, -0.29555657505989075, 0.050505880266427994, -0.17919334769248962, -0.051832277327775955, 0.0422113835811615, -0.043544284999370575, 0.07586077600717545, -0.16419357061386108, -0.3123602271080017, 0.18034465610980988, -0.27226296067237854, 0.10178996622562408, 0.15226873755455017, -0.07777417451143265, 0.21261177957057953, 0.03566686809062958, 0.061292923986911774, -0.0731162428855896, -0.2113930732011795, -0.03837565705180168, -0.04473957046866417, -0.24533158540725708, -0.23476533591747284, -0.006285191513597965, -0.1642870306968689, -0.16495710611343384, 0.058382511138916016, 0.040835294872522354, -0.13637512922286987, -0.1114966869354248, -0.13428479433059692, -0.10509899258613586, 0.04081618785858154, 0.2042306512594223, -0.06689051538705826, 0.046747952699661255, 0.05552944168448448, 0.2968544661998749, 0.37140393257141113, 0.28754088282585144, 0.3160049617290497, 0.005639452952891588, 0.10000000149011612, 0.20783893764019012, 0.10574424266815186, -0.34256941080093384, 0.38820141553878784, -0.05338982492685318, 0.14241592586040497, -0.08362113684415817, -0.2820589244365692, -0.12347635626792908, -0.10674731433391571, -0.009755059145390987, -0.15763559937477112, 0.4007665514945984];

/** model.ts:36-47, 58 — closed form, cheap enough to run per frame on interpolated features. */
function forward(f: number[]) {
  const sums: number[] = [];
  const h: number[] = [];
  for (let j = 0; j < HIDDEN; j++) {
    let s = THETA[FIRST_BIAS + j];
    for (let k = 0; k < FEATURE_COUNT; k++) s += THETA[j * FEATURE_COUNT + k] * f[k];
    sums.push(s);
    h.push(Math.max(0, s));
  }
  const terms = h.map((v, j) => THETA[OUT_W + j] * v);
  const y = THETA[OUT_B] + terms.reduce((a, b) => a + b, 0);
  return { sums, h, terms, y, width: y * 400 };
}
const RULE = FEATURES.map(forward);
const RULE_W = RULE.map((r) => r.width);

/** layout.ts:4-8, text.ts:14-35, layout.ts:32-61 */
const PAD = 16;
const GAP = 16;
const MIN_W = 128;
const MAX_W = 416;
const WIDTH_CHOICES = [128, 160, 192, 224, 256, 288, 320, 352, 384, 416];
type Placed = { left: number; top: number; width: number; imageHeight: number; height: number; lineWidths: number[] };
type Layout = { items: Placed[]; height: number; unused: number };

function wrapCaption(words: number[], width: number): number[] {
  const widths: number[] = [];
  let lineW = 0;
  let empty = true;
  for (const w of words) {
    const next = lineW + (empty ? 0 : SPACE_W) + w;
    if (!empty && next > width) {
      widths.push(lineW);
      lineW = w;
    } else {
      lineW = next;
    }
    empty = false;
  }
  if (!empty) widths.push(lineW);
  return widths;
}

function wrapLayout(prefs: readonly number[]): Layout {
  const inner = VIEW_W - 2 * PAD;
  const items: Placed[] = [];
  let left = PAD;
  let top = PAD;
  let rowHeight = 0;
  let rowCount = 1;
  let unused = 0;
  ITEMS.forEach((item, i) => {
    const width = Math.min(inner, MAX_W, Math.max(MIN_W, prefs[i]));
    if (left > PAD && left + width > VIEW_W - PAD) {
      unused += (VIEW_W - PAD - (left - GAP)) / inner;
      top += rowHeight + GAP;
      left = PAD;
      rowHeight = 0;
      rowCount++;
    }
    const lineWidths = wrapCaption(item.words, width);
    const imageHeight = width / item.ar;
    const height = imageHeight + 8 + lineWidths.length * 20;
    items.push({ left, top, width, imageHeight, height, lineWidths });
    left += width + GAP;
    rowHeight = Math.max(rowHeight, height);
  });
  unused += (VIEW_W - PAD - (left - GAP)) / inner;
  return { items, height: top + rowHeight + PAD, unused: unused / rowCount };
}

/** layout.ts:65-74 */
function preferenceLoss(layout: Layout): number {
  let total = 0;
  layout.items.forEach((p, i) => {
    const target = 22000 * (0.7 + 1.5 * ITEMS[i].imp);
    const areaError = (p.width * p.imageHeight - target) / target;
    const excess = Math.max(0, p.lineWidths.length - 3);
    total += areaError * areaError + 0.035 * excess * excess;
  });
  return total / layout.items.length + 0.08 * layout.unused;
}

/** layout.ts:80-122 — the per-page coordinate search (the ghost in beat 11). */
function optimizeInstance(): number[] {
  const prefs = ITEMS.map(() => 224);
  let loss = preferenceLoss(wrapLayout(prefs));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < prefs.length; i++) {
      let best = prefs[i];
      for (const w of WIDTH_CHOICES) {
        prefs[i] = w;
        const l = preferenceLoss(wrapLayout(prefs));
        if (l < loss) {
          loss = l;
          best = w;
        }
      }
      prefs[i] = best;
    }
  }
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < prefs.length; i++) {
      const cur = prefs[i];
      let best = cur;
      for (const dir of [-1, 1]) {
        const w = Math.max(MIN_W, Math.min(MAX_W, cur + dir * step));
        prefs[i] = w;
        const l = preferenceLoss(wrapLayout(prefs));
        if (l < loss) {
          loss = l;
          best = w;
        }
      }
      prefs[i] = best;
    }
  }
  return prefs;
}

const L_PLAIN = wrapLayout(ITEMS.map(() => 224)); // layout.ts:76-78, ordinary wrapping
const L_RULE = wrapLayout(RULE_W);
const L_SEARCH = wrapLayout(optimizeInstance());

// ---------------------------------------------------------------------------
// Stage geometry
// ---------------------------------------------------------------------------

/** The 900 px viewport drawn at half scale. */
const FX = 40;
const FY = 150;
const S = 0.5;
const FW = VIEW_W * S;

/** The width circuit. */
const CHIP_X = 548;
const CHIP_W = 180;
const CHIP_H = 30;
const chipY = (k: number): number => 168 + k * 42;
const WIRE_X0 = CHIP_X + CHIP_W;
const SUM_X = 870;
const RELU_X = 915;
const VAL_X = 930;
const OUTW_X0 = 982;
const unitY = (j: number): number => 152 + j * 30;
const OUT_X = 1065;
const OUT_Y = 315;
const READ_X = 1112;
const GATE_X = 528;

const CAM_OPEN: CameraState = { x: 420, y: 340, k: 1.15 };
const CAM_ALL: CameraState = { x: 640, y: 340, k: 1.0 };
const CAM_CARD: CameraState = { x: 400, y: 340, k: 1.3 };
const CAM_GATE: CameraState = { x: 420, y: 352, k: 1.3 };
const CAM_SUM: CameraState = { x: 840, y: 330, k: 1.3 };
const CAM_OUT: CameraState = { x: 960, y: 330, k: 1.3 };
const CAM_DEPTH: CameraState = { x: 900, y: 360, k: 1.12 };
const CAM_FRAME: CameraState = { x: 300, y: 335, k: 1.3 };
const CAM_STRIP: CameraState = { x: 300, y: 365, k: 1.25 };
const CAM_END: CameraState = { x: 640, y: 322, k: 1.05 };

const BADGE_A = { x: 800, y: 320 };
const BADGE_B = { x: 1162, y: 150 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

const cardBox = (p: Placed) => ({
  x: FX + p.left * S,
  y: FY + p.top * S,
  w: p.width * S,
  ih: p.imageHeight * S,
  h: p.height * S,
});
const lerpPlaced = (a: Placed, b: Placed, u: number): Placed => ({
  left: lerp(a.left, b.left, u),
  top: lerp(a.top, b.top, u),
  width: lerp(a.width, b.width, u),
  imageHeight: lerp(a.imageHeight, b.imageHeight, u),
  height: lerp(a.height, b.height, u),
  lineWidths: u < 0.5 ? a.lineWidths : b.lineWidths,
});

/** test renumbering (layout.test.ts:45): id → 999 − 13·index */
const RENAMED = ITEMS.map((_, i) => 999 - i * 13);

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, ≈131 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  // the gallery frame
  const frameU = tl.channel('frameU', 0);
  const cardsU = tl.channel('cardsU', 0);
  const frameOp = tl.channel('frameOp', 1);
  const cardDim = tl.channel('cardDim', 0);
  const handleU = tl.channel('handleU', 0);
  const tag1 = tl.channel('b1Tag1', 0);
  const tag2 = tl.channel('b1Tag2', 0);
  const tag3 = tl.channel('b1Tag3', 0);
  const b1Op = tl.channel('b1Op', 1);
  // B2 one rule
  const badgeU = tl.channel('badgeU', 0);
  const linksU = tl.channel('linksU', 0);
  const pagesU = tl.channel('pagesU', 0);
  const pageLinksU = tl.channel('pageLinksU', 0);
  const ruleLbl = tl.channel('ruleLbl', 0);
  const b2Op = tl.channel('b2Op', 1);
  const badgeMove = tl.channel('badgeMove', 0);
  // B3/B4 the inputs and the gate
  const chipsU = tl.channel('chipsU', 0);
  const gateU = tl.channel('gateU', 0);
  const idU = tl.channel('idU', 0);
  const noteU = tl.channel('noteU', 0);
  const chipGlow = tl.channel('chipGlow', 0);
  const b4Op = tl.channel('b4Op', 1);
  // B5/B6 the circuit
  const circOp = tl.channel('circOp', 1);
  const unitsU = tl.channel('unitsU', 0);
  const wiresU = tl.channel('wiresU', 0);
  const wiresOp = tl.channel('wiresOp', 1);
  const prodU = tl.channel('prodU', 0);
  const sumU = tl.channel('sumU', 0);
  const texSum = tl.channel('texSum', 0);
  const countLbl = tl.channel('countLbl', 0);
  const reluU = tl.channel('reluU', 0);
  const zeroU = tl.channel('zeroU', 0);
  const texRelu = tl.channel('texRelu', 0);
  const outU = tl.channel('outU', 0);
  const outNodeU = tl.channel('outNodeU', 0);
  const texOut = tl.channel('texOut', 0);
  const x400U = tl.channel('x400U', 0);
  // B7 the parts list
  const bandsU = tl.channel('bandsU', 0);
  const totalsU = tl.channel('totalsU', 0);
  const constsU = tl.channel('constsU', 0);
  const book1U = tl.channel('book1U', 0);
  const b7Op = tl.channel('b7Op', 1);
  // B8 six photos
  const who = tl.channel('who', 0);
  const rows = tl.channel('rowsShown', 0);
  const linkCard = tl.channel('linkCard', 0);
  // B9 wrapping
  const reflowU = tl.channel('reflowU', 0);
  const tagRow = tl.channel('b9TagRow', 0);
  const tagCap = tl.channel('b9TagCap', 0);
  const tagNet = tl.channel('b9TagNet', 0);
  const b9Op = tl.channel('b9Op', 1);
  // B10 reuse + shuffle
  const stripU = tl.channel('stripU', 0);
  const shuffleU = tl.channel('shuffleU', 0);
  const renameU = tl.channel('renameU', 0);
  const sameU = tl.channel('sameU', 0);
  const stripOp = tl.channel('stripOp', 1);
  // B11 the question
  const ghostU = tl.channel('ghostU', 0);
  const qU = tl.channel('questionU', 0);

  let t = 0.4;

  // — B1 · a gallery has to choose widths —
  t = tl.caption({ at: t, dur: 11.0, text: 'A gallery has to decide how wide each photo should be, and the right answer shifts with the screen, the caption and how many photos share the page.' });
  tl.tween(frameU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(cardsU, 1, { at: 1.2, dur: 1.4, ease: ease.enter });
  tl.tween(handleU, 1, { at: 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(tag1, 1, { at: 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(tag2, 1, { at: 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(tag3, 1, { at: 8.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B2 · one rule, many photos —
  const b2 = t;
  t = tl.caption({ at: t, dur: 11.6, text: 'This lab trains one small function to propose that width. The same parameters are reused for every photo and every collection, so there is one rule, not one per page.' });
  tl.tween(b1Op, 0, { at: b2 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(handleU, 0, { at: b2 + 0.1, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_ALL, { at: b2 + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(badgeU, 1, { at: b2 + 0.8, dur: 0.6, ease: ease.pop });
  tl.tween(linksU, 1, { at: b2 + 2.2, dur: 1.4, ease: ease.draw });
  tl.tween(pagesU, 1, { at: b2 + 5.2, dur: 0.8, ease: ease.enter });
  tl.tween(pageLinksU, 1, { at: b2 + 6.0, dur: 1.0, ease: ease.draw });
  tl.tween(ruleLbl, 1, { at: b2 + 8.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B3 · eight numbers per photo —
  const b3 = t;
  t = tl.caption({ at: t, dur: 10.4, text: 'For each photo it reads eight numbers: viewport width, aspect ratio, caption width, importance, photo count, mean aspect ratio, reading position and mean importance.' });
  tl.tween(b2Op, 0, { at: b3 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(badgeMove, 1, { at: b3 + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_CARD, { at: b3 + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(cardDim, 1, { at: b3 + 0.8, dur: 0.6, ease: ease.move });
  tl.tween(chipsU, 1, { at: b3 + 2.0, dur: 6.8, ease: ease.linear });
  t = tl.hold(t, 0.7);

  // — B4 · no id —
  const b4 = t;
  t = tl.caption({ at: t, dur: 9.6, text: "Notice what's missing. No photo identifier enters the function, so it has no ID to key on. It only sees numbers that describe the situation." });
  tl.tween(cam, CAM_GATE, { at: b4 + 0.1, dur: 1.0, ease: ease.move });
  tl.tween(gateU, 1, { at: b4 + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(idU, 1, { at: b4 + 1.3, dur: 2.4, ease: ease.linear });
  tl.tween(noteU, 1, { at: b4 + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(chipGlow, 1, { at: b4 + 6.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B5 · twelve weighted sums —
  const b5 = t;
  t = tl.caption({ at: t, dur: 9.8, text: "Twelve hidden units each take a weighted sum of those eight numbers, plus a bias. That's ninety-six multiplications feeding twelve sums." });
  tl.tween(b4Op, 0, { at: b5 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(chipGlow, 0, { at: b5 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SUM, { at: b5 + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(frameOp, 0, { at: b5 + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(unitsU, 1, { at: b5 + 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(wiresU, 1, { at: b5 + 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(texSum, 1, { at: b5 + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(prodU, 1, { at: b5 + 4.6, dur: 2.6, ease: ease.linear });
  tl.tween(sumU, 1, { at: b5 + 6.8, dur: 1.0, ease: ease.move });
  tl.tween(countLbl, 1, { at: b5 + 7.0, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B6 · relu, then one more sum, × 400 —
  const b6 = t;
  t = tl.caption({ at: t, dur: 12.8, text: 'Each sum goes through relu, which keeps positive values and zeroes the rest. One more weighted sum of the twelve results, times four hundred, is a width in pixels.' });
  tl.tween(cam, CAM_OUT, { at: b6 + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(countLbl, 0, { at: b6 + 0.1, dur: 0.5, ease: ease.move });
  tl.tween(wiresOp, 0.15, { at: b6 + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(texSum, 0, { at: b6 + 0.6, dur: 0.5, ease: ease.move });
  tl.tween(reluU, 1, { at: b6 + 0.9, dur: 1.0, ease: ease.enter });
  tl.tween(texRelu, 1, { at: b6 + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(zeroU, 1, { at: b6 + 2.8, dur: 1.0, ease: ease.move });
  tl.tween(texRelu, 0, { at: b6 + 5.6, dur: 0.5, ease: ease.move });
  tl.tween(outU, 1, { at: b6 + 5.9, dur: 1.2, ease: ease.draw });
  tl.tween(texOut, 1, { at: b6 + 6.2, dur: 0.6, ease: ease.enter });
  tl.tween(outNodeU, 1, { at: b6 + 7.1, dur: 0.6, ease: ease.pop });
  tl.tween(x400U, 1, { at: b6 + 9.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.7);

  // — B7 · the parts list —
  const b7 = t;
  t = tl.caption({ at: t, dur: 12.6, text: "Count the parts: a hundred and twenty-one parameters, a hundred and thirty-three operations, five layers deep. It's the kind of circuit the first book built, now with learned weights." });
  tl.tween(cam, CAM_DEPTH, { at: b7 + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(texOut, 0, { at: b7 + 0.1, dur: 0.5, ease: ease.move });
  tl.tween(bandsU, 1, { at: b7 + 0.8, dur: 3.0, ease: ease.linear });
  tl.tween(totalsU, 1, { at: b7 + 1.0, dur: 4.6, ease: ease.linear });
  tl.tween(constsU, 1, { at: b7 + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(book1U, 1, { at: b7 + 8.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B8 · six photos, one rule —
  const b8 = t;
  t = tl.caption({ at: t, dur: 13.6, text: 'Try six photos on a nine-hundred-pixel screen. The rule answers about 161 pixels for the narrow portrait, 276 for a wide crop, and 233 for a wide one that matters less.' });
  tl.tween(b7Op, 0, { at: b8 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_ALL, { at: b8 + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(frameOp, 1, { at: b8 + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(cardDim, 0.8, { at: b8 + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(linkCard, 1, { at: b8 + 1.2, dur: 0.8, ease: ease.draw });
  tl.tween(rows, 1, { at: b8 + 2.4, dur: 0.5, ease: ease.enter });
  const stops = [5.6, 7.8, 10.1, 11.2, 12.3];
  stops.forEach((at, i) => {
    tl.tween(who, i + 1, { at: b8 + at, dur: 0.6, ease: ease.move });
    tl.tween(rows, i + 2, { at: b8 + at + 0.5, dur: 0.4, ease: ease.enter });
  });
  t = tl.hold(t, 0.7);

  // — B9 · ordinary code wraps the rows —
  const b9 = t;
  t = tl.caption({ at: t, dur: 8.8, text: 'The cards take those widths and wrap into rows. Row breaks and caption measuring are ordinary web code. The network only proposes widths.' });
  tl.tween(cam, CAM_FRAME, { at: b9 + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(circOp, 0.12, { at: b9 + 0.1, dur: 0.8, ease: ease.move });
  tl.tween(linkCard, 0, { at: b9 + 0.1, dur: 0.5, ease: ease.move });
  tl.tween(cardDim, 0, { at: b9 + 0.3, dur: 0.6, ease: ease.move });
  tl.tween(reflowU, 1, { at: b9 + 1.1, dur: 1.5, ease: ease.move });
  tl.tween(tagRow, 1, { at: b9 + 3.0, dur: 0.6, ease: ease.enter });
  tl.tween(tagCap, 1, { at: b9 + 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(tagNet, 1, { at: b9 + 6.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  // — B10 · same units, any storage order —
  const b10 = t;
  t = tl.caption({ at: t, dur: 11.8, text: 'The same twelve units run once per photo, and only the eight inputs change. Shuffle how the photos are stored, or rename their identifiers, and the layout comes out the same.' });
  tl.tween(b9Op, 0, { at: b10 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_ALL, { at: b10 + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(circOp, 1, { at: b10 + 0.1, dur: 0.7, ease: ease.move });
  tl.tween(chipGlow, 1, { at: b10 + 0.6, dur: 0.5, ease: ease.enter });
  tl.tween(cardDim, 0.8, { at: b10 + 0.6, dur: 0.5, ease: ease.move });
  tl.tween(who, 0, { at: b10 + 0.8, dur: 3.6, ease: ease.linear });
  tl.tween(chipGlow, 0, { at: b10 + 4.6, dur: 0.5, ease: ease.move });
  tl.tween(cardDim, 0, { at: b10 + 4.6, dur: 0.5, ease: ease.move });
  tl.tween(circOp, 0.12, { at: b10 + 4.7, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_STRIP, { at: b10 + 4.7, dur: 1.2, ease: ease.move });
  tl.tween(stripU, 1, { at: b10 + 5.3, dur: 0.6, ease: ease.enter });
  tl.tween(shuffleU, 1, { at: b10 + 6.5, dur: 1.2, ease: ease.move });
  tl.tween(renameU, 1, { at: b10 + 8.2, dur: 0.6, ease: ease.move });
  tl.tween(sameU, 1, { at: b10 + 9.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.7);

  // — B11 · the question —
  const b11 = t;
  t = tl.caption({ at: t, dur: 10.8, text: 'So here\'s the question. Can one cheap rule behave like an expensive search that tunes every page separately? First, what is that search trying to please?' });
  tl.tween(stripOp, 0, { at: b11 + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_END, { at: b11 + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(circOp, 0, { at: b11 + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(ghostU, 1, { at: b11 + 1.2, dur: 1.0, ease: ease.enter });
  tl.tween(qU, 1, { at: b11 + 3.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 1.0);

  return {
    tl, cam, frameU, cardsU, frameOp, cardDim, handleU, tag1, tag2, tag3, b1Op,
    badgeU, linksU, pagesU, pageLinksU, ruleLbl, b2Op, badgeMove,
    chipsU, gateU, idU, noteU, chipGlow, b4Op,
    circOp, unitsU, wiresU, wiresOp, prodU, sumU, texSum, countLbl, reluU, zeroU, texRelu, outU, outNodeU, texOut, x400U,
    bandsU, totalsU, constsU, book1U, b7Op,
    who, rows, linkCard,
    reflowU, tagRow, tagCap, tagNet, b9Op,
    stripU, shuffleU, renameU, sameU, stripOp,
    ghostU, qU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Tag({ x, y, text, op, color = colors.TEXT, lead }: { x: number; y: number; text: string; op: number; color?: string; lead?: [number, number] }) {
  if (op <= 0.005) return null;
  const w = text.length * CH13 + 20;
  return (
    <g opacity={op}>
      {lead && <line x1={x} y1={y} x2={lead[0]} y2={lead[1]} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 3" />}
      {lead && <circle cx={lead[0]} cy={lead[1]} r={3} fill={colors.MUTED} />}
      <rect x={x} y={y - 13} width={w} height={26} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={x + 10} y={y + 4.5} fontSize={13} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

function PhotoCard({ p, i, op, spot, pill, pillOp, ghost }: { p: Placed; i: number; op: number; spot: number; pill: string; pillOp: number; ghost?: boolean }) {
  if (op <= 0.005) return null;
  const b = cardBox(p);
  if (ghost) {
    return (
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="none" stroke={colors.TEXT} strokeWidth={1.3} strokeDasharray="4 3" opacity={op} />
    );
  }
  const capY0 = b.y + b.ih + 4;
  return (
    <g opacity={op}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill={colors.PANEL} stroke={spot > 0.01 ? colors.WARM : colors.GRID} strokeWidth={1 + spot * 1.5} />
      <rect x={b.x + 1} y={b.y + 1} width={b.w - 2} height={b.ih - 1} rx={2} fill="rgba(141, 162, 190, 0.2)" />
      <path
        d={`M ${b.x + 3} ${b.y + b.ih - 2} L ${b.x + b.w * 0.35} ${b.y + b.ih * 0.55} L ${b.x + b.w * 0.55} ${b.y + b.ih * 0.75} L ${b.x + b.w * 0.75} ${b.y + b.ih * 0.45} L ${b.x + b.w - 3} ${b.y + b.ih - 2} Z`}
        fill="rgba(141, 162, 190, 0.22)"
      />
      <text x={b.x + 5} y={b.y + 15} fontSize={12} fill={colors.TEXT}>
        {ITEMS[i].title}
      </text>
      {p.lineWidths.map((lw, k) => (
        <rect key={k} x={b.x + 2} y={capY0 + k * 10 + 3} width={Math.max(2, lw * S - 2)} height={4} rx={2} fill={colors.MUTED} opacity={0.55} />
      ))}
      {pillOp > 0.005 && (
        <g opacity={pillOp}>
          <rect x={b.x + b.w / 2 - 30} y={b.y + b.ih / 2 - 8} width={60} height={20} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.2} />
          <text x={b.x + b.w / 2} y={b.y + b.ih / 2 + 6} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM}>
            {pill}
          </text>
        </g>
      )}
    </g>
  );
}

function ReluGlyph({ cx, cy, u, dim }: { cx: number; cy: number; u: number; dim: number }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={4} fill={colors.PANEL} stroke={dim > 0.5 ? colors.GRID : colors.SECONDARY} strokeWidth={1.3} />
      <path d={`M ${cx - 7} ${cy + 5} L ${cx} ${cy + 5} L ${cx + 7} ${cy - 6}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2} opacity={1 - 0.7 * dim} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- which photo the circuit is reading
  // values snap to the nearest photo so every number on screen is one the rule really produces
  const active = Math.round(Math.max(0, Math.min(N - 1, v(scene.who))));
  const feats = FEATURES[active];
  const net = RULE[active];

  // ---- layers
  const frameOp = v(scene.frameOp);
  const circOp = v(scene.circOp);
  const cardDim = v(scene.cardDim);
  const reflow = v(scene.reflowU);
  const rowsN = v(scene.rows);
  const placed = ITEMS.map((_, i) => lerpPlaced(L_PLAIN.items[i], L_RULE.items[i], reflow));
  const frameH = lerp(L_PLAIN.height, L_RULE.height, reflow) * S;
  const frameU = v(scene.frameU);
  const cardsU = v(scene.cardsU);
  const x400 = v(scene.x400U);

  // pills: card 1 gets its width at the × 400 beat; the rest as their table rows land
  const pillOp = (i: number): number => (i === 0 ? x400 : clamp01(rowsN - i));
  const cardOp = (i: number): number => {
    const isSpot = i === active;
    return staggerU(cardsU, i, N, 0.12, 0.6) * (isSpot ? 1 : 1 - 0.85 * cardDim);
  };

  // ---- B1/B2
  const b1Op = v(scene.b1Op);
  const handleU = v(scene.handleU);
  const badgeU = v(scene.badgeU);
  const badgeMove = v(scene.badgeMove);
  const b2Op = v(scene.b2Op);
  const linksU = v(scene.linksU) * b2Op;
  const pagesU = v(scene.pagesU) * b2Op;
  const pageLinksU = v(scene.pageLinksU) * b2Op;
  const bx = lerp(BADGE_A.x, BADGE_B.x, badgeMove);
  const by = lerp(BADGE_A.y, BADGE_B.y, badgeMove);
  const bs = lerp(1, 0.32, badgeMove);
  const badgeOnStage = Math.abs(cam.x - bx) * cam.k < STAGE_W / 2 - 60;
  const badgeOp = badgeOnStage ? badgeU * lerp(1, circOp, badgeMove) : 0;

  // ---- B3/B4
  const chipsU = v(scene.chipsU);
  const gateU = v(scene.gateU) * v(scene.b4Op);
  const idU = v(scene.idU);
  const noteU = v(scene.noteU) * v(scene.b4Op);
  const chipGlow = v(scene.chipGlow);

  // ---- circuit
  const unitsU = v(scene.unitsU);
  const wiresU = v(scene.wiresU);
  const wiresOp = v(scene.wiresOp);
  const prodU = v(scene.prodU);
  const sumU = v(scene.sumU);
  const reluU = v(scene.reluU);
  const zeroU = v(scene.zeroU);
  const outU = v(scene.outU);
  const outNodeU = v(scene.outNodeU);
  const bandsU = v(scene.bandsU) * v(scene.b7Op);
  const totalsU = v(scene.totalsU) * v(scene.b7Op);
  const b7Op = v(scene.b7Op);
  const bandDim = bandsU > 0.005 ? lerp(1, 0.4, clamp01(bandsU * 3)) : 1; // circuit recedes under the bands

  // ---- B9/B10/B11
  const b9Op = v(scene.b9Op);
  const stripU = v(scene.stripU) * v(scene.stripOp);
  const shuffleU = v(scene.shuffleU);
  const renameU = v(scene.renameU);
  const sameU = v(scene.sameU) * v(scene.stripOp);
  const ghostU = v(scene.ghostU);
  const qU = v(scene.qU);

  // chips fly from card 1 (or the frame's viewport label) into the input column
  const c1 = cardBox(L_PLAIN.items[0]);
  const chipFrom = (k: number) => (k === 0 ? { x: FX + FW / 2 - CHIP_W / 2, y: FY - 26 } : { x: c1.x + c1.w / 2 - CHIP_W / 2, y: c1.y + c1.ih / 2 - CHIP_H / 2 });

  // id chip: travels to the gate, bounces back, drops away
  const idTravel = clamp01(idU / 0.45);
  const idBounce = clamp01((idU - 0.45) / 0.55);
  const idStartX = c1.x + c1.w - 10;
  const idY = c1.y + c1.ih / 2 + 30;
  const idX = lerp(idStartX, GATE_X - 84, ease.move(idTravel)) - 70 * Math.sin(Math.PI * 0.5 * idBounce);
  const idDrop = idBounce * idBounce * 60;
  const idOp = idU <= 0 ? 0 : (1 - clamp01((idBounce - 0.55) / 0.45) * 0.75) * v(scene.b4Op);

  const yOut = net.y;
  const readW = net.width;
  const linkU = v(scene.linkCard);
  const spotCard = cardBox(placed[active]);

  // storage strip (B10): slot of card i, before/after reversal
  const SLOT_W = 70;
  const slotX = (slot: number): number => FX + 4 + slot * (SLOT_W + 6);
  const STRIP_Y = 520;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the 900 px gallery frame ================= */}
        {frameOp > 0.005 && (
        <g opacity={frameOp}>
          {frameU > 0.005 && (
            <g opacity={frameU}>
              <rect x={FX} y={FY} width={FW * frameU} height={frameH} rx={6} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
              <text x={FX + FW / 2} y={FY - 10} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                viewport · 900 px
              </text>
            </g>
          )}
          {/* ghosts of the per-page search (B11), behind the cards */}
          {ghostU > 0.005 &&
            L_SEARCH.items.map((p, i) => <PhotoCard key={`g${i}`} p={p} i={i} op={ghostU * 0.75} spot={0} pill="" pillOp={0} ghost />)}
          {placed.map((p, i) => (
            <PhotoCard
              key={i}
              p={p}
              i={i}
              op={cardOp(i)}
              spot={(i === active ? cardDim : 0) * (1 - reflow * (1 - cardDim))}
              pill={RULE_W[i].toFixed(1)}
              pillOp={pillOp(i) * (1 - ghostU * 0.6)}
            />
          ))}
          {ghostU > 0.005 &&
            L_RULE.items.map((p, i) => {
              const b = cardBox(p);
              return (
                <g key={`q${i}`} opacity={ghostU}>
                  <circle cx={b.x + b.w} cy={b.y + b.ih / 2} r={9} fill={colors.BG} stroke={colors.TEXT} strokeWidth={1.2} />
                  <text x={b.x + b.w} y={b.y + b.ih / 2 + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={colors.TEXT}>
                    ?
                  </text>
                </g>
              );
            })}
          {/* B1: the width handle */}
          {handleU > 0.005 && (() => {
            const b = cardBox(L_PLAIN.items[1]);
            const hx = b.x + b.w;
            const hy = b.y + b.ih / 2;
            return (
              <g opacity={handleU}>
                <line x1={hx} y1={b.y - 4} x2={hx} y2={b.y + b.h + 4} stroke={colors.WARM} strokeWidth={2} />
                <path d={`M ${hx - 12} ${hy} L ${hx + 12} ${hy} M ${hx - 12} ${hy} l 5 -5 M ${hx - 12} ${hy} l 5 5 M ${hx + 12} ${hy} l -5 -5 M ${hx + 12} ${hy} l -5 5`} stroke={colors.WARM} strokeWidth={2} fill="none" />
                <text x={hx} y={b.y + b.h + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM}>
                  width?
                </text>
              </g>
            );
          })()}
        </g>
        )}

        {/* B1 tags: what the answer shifts with */}
        <Tag x={505} y={176} text="screen: 900 px viewport" op={v(scene.tag1) * b1Op} lead={[FX + FW, FY + 10]} />
        <Tag x={505} y={290} text="caption: measured text" op={v(scene.tag2) * b1Op} lead={[cardBox(L_PLAIN.items[2]).x + 100, cardBox(L_PLAIN.items[2]).y + cardBox(L_PLAIN.items[2]).ih + 20]} />
        <Tag x={505} y={404} text={`photos on the page: ${N}`} op={v(scene.tag3) * b1Op} lead={[FX + FW, 404]} />

        {/* ================= B2: one shared rule ================= */}
        {linksU > 0.005 &&
          L_PLAIN.items.map((p, i) => {
            const b = cardBox(p);
            const x0 = b.x + b.w / 2;
            const y0 = b.y + b.ih / 2;
            return (
              <line key={i} x1={x0} y1={y0} x2={lerp(x0, bx - 56, linksU)} y2={lerp(y0, by, linksU)} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="2 5" opacity={0.8} />
            );
          })}
        {pagesU > 0.005 && (
          <g opacity={pagesU}>
            {[
              { x: 1010, y: 160, w: 1180 * 0.17, h: 92, label: '1180 px page', cols: 5, rowsN: 2 },
              { x: 1076, y: 380, w: 420 * 0.17, h: 140, label: '420 px page', cols: 1, rowsN: 4 },
            ].map((pg, n) => {
              const cw = (pg.w - 8 - (pg.cols - 1) * 4) / pg.cols;
              const rh = (pg.h - 8 - (pg.rowsN - 1) * 4) / pg.rowsN;
              return (
                <g key={n}>
                  <line x1={pg.x} y1={pg.y + pg.h / 2} x2={lerp(pg.x, bx + 56, pageLinksU)} y2={lerp(pg.y + pg.h / 2, by, pageLinksU)} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="2 5" opacity={0.8} />
                  <rect x={pg.x} y={pg.y} width={pg.w} height={pg.h} rx={4} fill={colors.BG} stroke={colors.MUTED} strokeWidth={1.2} />
                  {Array.from({ length: pg.cols * pg.rowsN }, (_, c) => (
                    <rect key={c} x={pg.x + 4 + (c % pg.cols) * (cw + 4)} y={pg.y + 4 + Math.floor(c / pg.cols) * (rh + 4)} width={cw} height={rh} rx={2} fill="rgba(141, 162, 190, 0.2)" />
                  ))}
                  <text x={pg.x + pg.w / 2} y={pg.y + pg.h + 20} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {pg.label}
                  </text>
                </g>
              );
            })}
            <text x={1110} y={570} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
              other collections (schematic)
            </text>
          </g>
        )}
        {v(scene.ruleLbl) * b2Op > 0.005 && (
          <text x={BADGE_A.x} y={BADGE_A.y + 124} textAnchor="middle" fontSize={20} fill={colors.WARM} opacity={v(scene.ruleLbl) * b2Op}>
            one rule, not one per page
          </text>
        )}

        {/* ================= the width circuit ================= */}
        <g opacity={circOp}>
          {/* depth bands (B7), behind everything */}
          {bandsU > 0.005 &&
            [
              { x0: WIRE_X0 + 4, x1: SUM_X - 14 },
              { x0: SUM_X - 14, x1: SUM_X + 16 },
              { x0: RELU_X - 15, x1: RELU_X + 15 },
              { x0: OUTW_X0, x1: OUT_X - 18 },
              { x0: OUT_X - 18, x1: OUT_X + 22 },
            ].map((band, i) => {
              const u = staggerU(bandsU, i, 5, 0.5, 0.5);
              if (u <= 0.005) return null;
              const cx = (band.x0 + band.x1) / 2;
              const dd = DEPTHS[i];
              return (
                <g key={i} opacity={u}>
                  <rect x={band.x0} y={136} width={band.x1 - band.x0} height={362} rx={4} fill="rgba(251, 191, 36, 0.07)" stroke="rgba(251, 191, 36, 0.35)" strokeWidth={1} />
                  <circle cx={cx} cy={122} r={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
                  <text x={cx} y={126.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM}>
                    {dd.d}
                  </text>
                  <text x={cx} y={516} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    {dd.n}
                  </text>
                  <text x={cx} y={534} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                    {dd.kind}
                  </text>
                </g>
              );
            })}

          <g opacity={bandDim}>
            {/* 96 wires, then 96 product dots */}
            {wiresU > 0.005 && (
              <g opacity={wiresOp * (1 - 0.6 * reluU * (1 - wiresOp))}>
                {Array.from({ length: FEATURE_COUNT * HIDDEN }, (_, n) => {
                  const k = n % FEATURE_COUNT;
                  const j = Math.floor(n / FEATURE_COUNT);
                  const y0 = chipY(k) + CHIP_H / 2;
                  const y1 = unitY(j);
                  const u = staggerU(wiresU, k, FEATURE_COUNT, 0.08, 0.6);
                  return <line key={n} x1={WIRE_X0} y1={y0} x2={lerp(WIRE_X0, SUM_X - 11, u)} y2={lerp(y0, y1, u)} stroke={colors.MUTED} strokeWidth={0.8} opacity={0.35} />;
                })}
              </g>
            )}
            {prodU > 0.005 && prodU < 0.999 &&
              Array.from({ length: FEATURE_COUNT * HIDDEN }, (_, n) => {
                const k = n % FEATURE_COUNT;
                const j = Math.floor(n / FEATURE_COUNT);
                const u = staggerU(prodU, k, FEATURE_COUNT, 0.12, 0.5);
                if (u <= 0 || u >= 1) return null;
                const y0 = chipY(k) + CHIP_H / 2;
                const prod = THETA[j * FEATURE_COUNT + k] * FEATURES[0][k];
                return (
                  <circle key={n} cx={lerp(WIRE_X0, SUM_X - 11, u)} cy={lerp(y0, unitY(j), u)} r={2.6} fill={prod >= 0 ? colors.ACCENT : colors.NEGATIVE} />
                );
              })}

            {/* the eight input chips */}
            {FEATURE_NAMES.map((name, k) => {
              const u = staggerU(chipsU, k, FEATURE_COUNT, 0.75, 0.9);
              if (u <= 0.005) return null;
              const from = chipFrom(k);
              const e = ease.move(u);
              const x = lerp(from.x, CHIP_X, e);
              const y = lerp(from.y, chipY(k), e);
              const changes = k === 1 || k === 2 || k === 3 || k === 6;
              const glow = chipGlow * (changes ? 1 : 0.5);
              return (
                <g key={k} opacity={clamp01(u * 3)}>
                  <rect x={x} y={y} width={CHIP_W} height={CHIP_H} rx={6} fill={colors.PANEL} stroke={glow > 0.05 ? colors.WARM : colors.ACCENT} strokeOpacity={glow > 0.05 ? glow : 0.5} strokeWidth={1.2 + glow} />
                  <text x={x + 9} y={y + 19.5} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {name}
                  </text>
                  <text x={x + CHIP_W - 9} y={y + 19.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                    {feats[k].toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* twelve hidden units: Σ node, relu glyph, value */}
            {Array.from({ length: HIDDEN }, (_, j) => {
              const u = staggerU(unitsU, j, HIDDEN, 0.06, 0.5);
              if (u <= 0.005) return null;
              const y = unitY(j);
              const sv = net.sums[j];
              const neg = sv < 0;
              const dim = neg ? zeroU : 0;
              const fillA = sumU * Math.min(1, Math.abs(sv) / 0.5) * (1 - dim * 0.85);
              const shown = zeroU > 0.5 ? net.h[j] : sv;
              return (
                <g key={j} opacity={u * (1 - 0.55 * dim)}>
                  <circle cx={SUM_X} cy={y} r={11} fill={neg ? colors.NEGATIVE : colors.ACCENT} fillOpacity={fillA * 0.75} stroke={colors.TEXT} strokeOpacity={0.6} strokeWidth={1.2} />
                  <text x={SUM_X} y={y + 4.5} textAnchor="middle" fontSize={12} fill={colors.TEXT}>
                    Σ
                  </text>
                  <ReluGlyph cx={RELU_X} cy={y} u={reluU} dim={dim} />
                  {sumU > 0.005 && (
                    <text x={VAL_X + 2} y={y + 4.5} fontSize={12} fontFamily={MONO} fill={dim > 0.5 ? colors.MUTED : neg ? colors.NEGATIVE : colors.TEXT} opacity={sumU}>
                      {zeroU > 0.5 && neg ? ' 0' : signed(shown)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* twelve output products into one sum */}
            {outU > 0.005 &&
              net.terms.map((term, j) => {
                const u = staggerU(outU, j, HIDDEN, 0.04, 0.7);
                const y0 = unitY(j);
                const zero = net.h[j] === 0;
                return (
                  <line
                    key={j}
                    x1={OUTW_X0}
                    y1={y0}
                    x2={lerp(OUTW_X0, OUT_X - 16, u)}
                    y2={lerp(y0, OUT_Y, u)}
                    stroke={zero ? colors.MUTED : term >= 0 ? colors.ACCENT : colors.NEGATIVE}
                    strokeWidth={zero ? 0.8 : 1 + Math.min(3, Math.abs(term) * 40)}
                    opacity={zero ? 0.15 : 0.85}
                  />
                );
              })}
            {outNodeU > 0.005 && (
              <g opacity={clamp01(outNodeU)}>
                <circle cx={OUT_X} cy={OUT_Y} r={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
                <text x={OUT_X} y={OUT_Y + 5} textAnchor="middle" fontSize={15} fill={colors.TEXT}>
                  Σ
                </text>
                <line x1={OUT_X + 16} y1={OUT_Y} x2={READ_X} y2={OUT_Y} stroke={colors.WARM} strokeWidth={1.5} />
                <rect x={READ_X} y={OUT_Y - 30} width={140} height={60} rx={8} fill={colors.PANEL} stroke={x400 > 0.5 ? colors.WARM : colors.GRID} strokeWidth={1.4} />
                <text x={READ_X + 70} y={OUT_Y - 9} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  {x400 > 0.01 ? `${yOut.toFixed(4)} × 400` : `y = ${yOut.toFixed(4)}`}
                </text>
                {x400 > 0.01 && (
                  <text x={READ_X + 70} y={OUT_Y + 19} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={x400}>
                    {readW.toFixed(1)} px
                  </text>
                )}
              </g>
            )}
          </g>

          {/* B5 count */}
          {v(scene.countLbl) > 0.005 && (
            <text x={(WIRE_X0 + SUM_X) / 2 + 20} y={514} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.countLbl)}>
              8 × 12 = 96 products → 12 sums
            </text>
          )}

          {/* B7 totals */}
          {totalsU > 0.005 && (
            <g>
              {[
                { text: `${PARAM_COUNT} parameters`, at: 0 },
                { text: `${OP_COUNT} operations`, at: 1 },
                { text: `${DEPTHS.length} layers`, at: 2 },
              ].map((it, i) => {
                const u = staggerU(totalsU, i, 3, 1.4, 0.4);
                return (
                  <text key={i} x={700 + i * 190} y={566} textAnchor="middle" fontSize={18} fontWeight={600} fill={colors.WARM} opacity={u}>
                    {it.text}
                  </text>
                );
              })}
            </g>
          )}
          {v(scene.constsU) * b7Op > 0.005 && (
            <text x={890} y={590} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.constsU) * b7Op}>
              featureCount = 8 · hiddenWidth = 12 · parameterCount = 121
            </text>
          )}
          {v(scene.book1U) * b7Op > 0.005 && (
            <text x={810} y={96} textAnchor="middle" fontSize={15} fill={colors.TEXT} opacity={v(scene.book1U) * b7Op}>
              the same sums and relu gates as book 1 — but θ is learned
            </text>
          )}

          {/* the width table (B8) */}
          {rowsN > 0.005 && (
            <g>
              <text x={READ_X - 10} y={378} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                aspect  imp   width
              </text>
              {ITEMS.map((item, i) => {
                const u = clamp01(rowsN - i);
                if (u <= 0.005) return null;
                const on = i === active && cardDim > 0.05;
                return (
                  <text key={i} x={READ_X - 10} y={400 + i * 21} fontSize={13} fontFamily={MONO} fill={on ? colors.WARM : colors.TEXT} opacity={u * (on ? 1 : 0.75)}>
                    {`${item.ar.toFixed(2)}  ${item.imp.toFixed(2)}  ${RULE_W[i].toFixed(1)}`}
                  </text>
                );
              })}
            </g>
          )}
        </g>

        {/* the parameter badge: big in B2, then parks above the circuit */}
        {badgeOp > 0.005 && (
          <g opacity={badgeOp} transform={`translate(${bx}, ${by}) scale(${bs * (0.6 + 0.4 * clamp01(badgeU))})`}>
            <circle r={56} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5 / bs} />
            <text y={14} textAnchor="middle" fontSize={44} fontFamily="Georgia, serif" fontStyle="italic" fill={colors.WARM}>
              θ
            </text>
            <text y={84} textAnchor="middle" fontSize={16} fill={colors.TEXT} opacity={1 - badgeMove}>
              {PARAM_COUNT} shared parameters
            </text>
          </g>
        )}
        {badgeMove > 0.5 && badgeOnStage && (
          <text x={BADGE_B.x + 24} y={BADGE_B.y + 5} fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={(badgeMove - 0.5) * 2 * circOp * bandDim}>
            · {PARAM_COUNT}
          </text>
        )}

        {/* formulas */}
        <MathLabel tex={'\\mathrm{sum}_j = b_j + \\sum_{k=1}^{8} \\theta_{jk}\\, f_k'} x={790} y={100} fontSize={22} opacity={v(scene.texSum) * circOp} boxWidth={460} />
        <MathLabel tex={'h_j = \\mathrm{relu}(\\mathrm{sum}_j) = \\max(0,\\, \\mathrm{sum}_j)'} x={860} y={100} fontSize={22} opacity={v(scene.texRelu) * circOp} boxWidth={520} />
        <MathLabel tex={'\\text{width} = 400 \\cdot \\big(b + \\textstyle\\sum_j w_j\\, h_j\\big)'} x={900} y={100} fontSize={22} opacity={v(scene.texOut) * circOp} boxWidth={480} />

        {/* B4: the id gate */}
        {gateU > 0.005 && (
          <g opacity={gateU}>
            <line x1={GATE_X} y1={150} x2={GATE_X} y2={chipY(7) + CHIP_H + 10} stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="8 5" />
            <text x={GATE_X} y={138} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.NEGATIVE}>
              no stable ID
            </text>
          </g>
        )}
        {idOp > 0.005 && (
          <g opacity={idOp} transform={`translate(${idX}, ${idY + idDrop})`}>
            <rect x={0} y={-13} width={84} height={26} rx={6} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 2" />
            <text x={42} y={4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              id {ITEMS[0].id}
            </text>
          </g>
        )}
        {noteU > 0.005 && (
          <text x={GATE_X + 110} y={530} textAnchor="middle" fontSize={15} fill={colors.TEXT} opacity={noteU}>
            Stable IDs do not enter the learned function.
          </text>
        )}

        {/* B8: which card the circuit is reading */}
        {linkU > 0.005 && (
          <path
            d={`M ${spotCard.x + spotCard.w} ${spotCard.y + spotCard.ih / 2} C ${510} ${spotCard.y + spotCard.ih / 2}, ${500} ${chipY(0) - 14}, ${CHIP_X + 20} ${chipY(0) - 14}`}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={1.5}
            strokeDasharray="3 4"
            opacity={linkU * 0.8 * circOp}
          />
        )}

        {/* B9 tags: ordinary code does the wrapping */}
        {(() => {
          const r2 = cardBox(L_RULE.items[3]);
          const rowY = r2.y - (GAP * S) / 2;
          const b6 = cardBox(L_RULE.items[5]);
          const b2c = cardBox(L_RULE.items[1]);
          const op1 = v(scene.tagRow) * b9Op;
          return (
            <g>
              {op1 > 0.005 && (
                <line x1={FX} y1={rowY} x2={FX + FW} y2={rowY} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="6 4" opacity={op1} />
              )}
              <Tag x={505} y={rowY} text="row break: wrapLayout · plain JS" op={op1} color={colors.WARM} />
              <Tag x={505} y={455} text="caption lines: measured text" op={v(scene.tagCap) * b9Op} lead={[b6.x + b6.w - 20, b6.y + b6.ih + 14]} />
              <Tag x={505} y={210} text="network: one width per photo" op={v(scene.tagNet) * b9Op} lead={[b2c.x + b2c.w - 10, b2c.y + b2c.ih / 2]} />
              {v(scene.tagCap) * b9Op > 0.005 && (
                <text x={FX} y={FY + L_RULE.height * S + 20} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.tagCap) * b9Op}>
                  padding = gap = 16 · width clamped to 128–416
                </text>
              )}
            </g>
          );
        })()}

        {/* B10: storage order strip */}
        {stripU > 0.005 && (
          <g opacity={stripU}>
            {ITEMS.map((item, i) => {
              const slot = lerp(i, N - 1 - i, ease.move(shuffleU));
              const x = slotX(slot);
              const b = cardBox(L_RULE.items[i]);
              const id = renameU > 0.5 ? RENAMED[i] : item.id;
              return (
                <g key={i}>
                  <line x1={x + SLOT_W / 2} y1={STRIP_Y - 13} x2={b.x + b.w / 2} y2={b.y + b.h} stroke={colors.MUTED} strokeWidth={1} opacity={0.45} />
                  <rect x={x} y={STRIP_Y - 13} width={SLOT_W} height={26} rx={6} fill={colors.PANEL} stroke={renameU > 0.05 ? colors.SECONDARY : colors.MUTED} strokeWidth={1.2} />
                  <text x={x + SLOT_W / 2} y={STRIP_Y + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={renameU > 0 && renameU < 1 ? Math.abs(renameU - 0.5) * 2 : 1}>
                    id {id}
                  </text>
                </g>
              );
            })}
            <text x={FX + 4} y={STRIP_Y + 34} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              {shuffleU < 0.5 ? 'storage order' : renameU < 0.5 ? 'storage order: reversed' : 'reversed · ids renumbered'}
            </text>
          </g>
        )}
        {sameU > 0.005 && (
          <g opacity={sameU}>
            <rect x={FX + FW - 210} y={STRIP_Y + 20} width={210} height={24} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={FX + FW - 105} y={STRIP_Y + 37} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
              ✓ same widths, same layout
            </text>
          </g>
        )}

        {/* B11: the question */}
        {qU > 0.005 && (
          <g opacity={qU}>
            <rect x={590} y={210} width={620} height={200} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={900} y={262} textAnchor="middle" fontSize={23} fill={colors.TEXT}>
              Can one cheap rule behave like
            </text>
            <text x={900} y={294} textAnchor="middle" fontSize={23} fill={colors.TEXT}>
              a search that tunes every page?
            </text>
            <rect x={660} y={340} width={34} height={22} rx={3} fill="rgba(141, 162, 190, 0.2)" stroke={colors.GRID} />
            <text x={704} y={356} fontSize={14} fill={colors.MUTED}>
              shared rule
            </text>
            <rect x={900} y={340} width={34} height={22} rx={3} fill="none" stroke={colors.TEXT} strokeWidth={1.3} strokeDasharray="4 3" />
            <text x={944} y={356} fontSize={14} fill={colors.MUTED}>
              per-page search
            </text>
            <text x={900} y={392} textAnchor="middle" fontSize={14} fill={colors.WARM}>
              next: what is the search trying to please?
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={252} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · One Rule for Every Photo
      </text>
      <rect x={40} y={50} width={'reusable-layout'.length * CH12 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
        reusable-layout
      </text>
    </>
  );
}

export const vizScene = () => scene;
