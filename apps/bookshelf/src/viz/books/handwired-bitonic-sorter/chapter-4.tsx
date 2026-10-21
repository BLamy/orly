// What Handwired Pays
//
// Bitonic Sorter — chapter 4. Sources (none of these appear on screen):
//   chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, lab/ui-exploration:
//     README.md:5, 18 (one fixed circuit of weighted sums and relu); docs/execution-model.md:3, 7 (FP32), 40 (layers:
//     independent instructions at one dependency depth share a layer), 282 (fractional drift)
//     docs/patterns.md:358 (a sort branches on comparisons); guide/sections/loops.md:185 (compare-exchange, 4 operations
//     in 3 layers), 189 (16 items: 1,248 / 50 against 1,056 / 5), 190 (64 items: 10,624 / 105 against 16,512 / 5),
//     192, 194 (fractional keys: 20 to 24%, errors up to 6e-5); guide/patterns/ranks-instead-of-sorting.md:16 (ties
//     break by index), 84; guide/review-and-decisions.md:269 (packaging a network past 64 items: open)
//   Exploration notes @ d01b763: notes-outside:31-34 (cost table; 64 keys only, 2,752 operations, 64 layers), 109, 113
//     (counting is the better formulation at UI sizes; n² hurts around hundreds of items); notes-runtime:66 (min and
//     max share the difference and relu, 4 / 3), 237 (odd-even network drift), 238 (rank sort)
//   Reference: .orly-work/hw-books/bitonic-ref/bitonic.ts (bitonicNetwork, ported below), report.txt §1-2
//   Fact-check: docs/book-plans/handwired-bitonic-sorter/review.md (the tie-broken rank formula, ties shown by index)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// What is computed here and what is quoted. The stage and comparator counts (21 stages, 672 comparators at 64 wires;
// 80 at 16; the drawn 8-wire network's 6 stages and 24 comparators) come from a line-for-line port of bitonicNetwork;
// 63 = 21 × 3 and 2,688 = 672 × 4 are arithmetic and labelled so. The worked compare-exchange (a = 7, b = 3), the
// rank grid (8 example keys with one tie), the pair counts n² and the fp32 example (a = 2.7, b = 0.1, whose
// a − relu(a − b) lands 13 fp32 steps below b) are computed at module scope; the module throws if any disagrees with
// the caption. Every operation and layer count of Handwired itself is a measurement quoted from the notes. The plan's
// "counting grid unaffected" by drift and its closing recap strip are dropped: the first is not in the sources, the
// second would crowd the verdict.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';

// the network and the circuit wear the series' teal (the user's video accent is not this book's to choose)
const HUE = colors.TEAL;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const fmtN = (v: number): string => Math.round(v).toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The network (port of bitonic-ref/bitonic.ts: bitonicNetwork) — module scope, checked
// ---------------------------------------------------------------------------

type Comparator = [i: number, j: number, ascending: boolean];

function bitonicNetwork(n: number): Comparator[][] {
  const stages: Comparator[][] = [];
  const place = (stage: number, c: Comparator) => {
    (stages[stage] ??= []).push(c);
  };
  const emitMerge = (low: number, count: number, up: boolean, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    for (let i = low; i < low + k; i++) place(start, [i, i + k, up]);
    emitMerge(low, k, up, start + 1);
    return 1 + emitMerge(low + k, k, up, start + 1);
  };
  const emitSort = (low: number, count: number, up: boolean, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    const half = emitSort(low, k, true, start);
    emitSort(low + k, k, false, start);
    return half + emitMerge(low, count, up, start + half);
  };
  emitSort(0, n, true, 0);
  return stages;
}
const comparators = (net: Comparator[][]): number => net.reduce((s, st) => s + st.length, 0);

const NET8 = bitonicNetwork(8);
const NET16 = bitonicNetwork(16);
const NET64 = bitonicNetwork(64);
const STAGES64 = NET64.length; // 21
const COMPS64 = comparators(NET64); // 672
const COMPS16 = comparators(NET16); // 80
const PRED_LAYERS = STAGES64 * 3; // 63, arithmetic
const PRED_OPS = COMPS64 * 4; // 2,688, arithmetic
if (NET8.length !== 6 || comparators(NET8) !== 24 || NET16.length !== 10 || COMPS16 !== 80 || STAGES64 !== 21 || COMPS64 !== 672) {
  throw new Error('bitonic ch4: network counts disagree with report.txt §1');
}
if (PRED_LAYERS !== 63 || PRED_OPS !== 2688) throw new Error('bitonic ch4: predicted cost disagrees with caption 5/6');

// Handwired's measurements (loops.md:189-190, notes-outside:32): quoted, never derived.
const M = {
  keys64: { ops: 2752, layers: 64 },
  bit16: { ops: 1248, layers: 50 },
  cnt16: { ops: 1056, layers: 5 },
  bit64: { ops: 10624, layers: 105 },
  cnt64: { ops: 16512, layers: 5 },
};

// The drawn 8-wire network: rods packed into sub-columns so overlapping rods in one stage never collide.
const NET8_RODS = (() => {
  const rods: { s: number; i: number; j: number; up: boolean; col: number }[] = [];
  let col = 0;
  NET8.forEach((stage, s) => {
    const lanes: [number, number][][] = [];
    stage.forEach(([i, j, up]) => {
      let L = lanes.findIndex((l) => l.every(([a, b]) => j < a || i > b));
      if (L < 0) {
        L = lanes.length;
        lanes.push([]);
      }
      lanes[L].push([i, j]);
      rods.push({ s, i, j, up, col: col + L });
    });
    col += lanes.length;
  });
  return rods;
})();

// ---------------------------------------------------------------------------
// The worked compare-exchange (a = 7, b = 3): three weighted sums and one relu
// ---------------------------------------------------------------------------

const relu = (x: number): number => (x > 0 ? x : 0);
const CA = 7;
const CB = 3;
const CD = CA - CB; // layer 1
const CR = relu(CD); // layer 2
const CMIN = CA - CR; // layer 3
const CMAX = CB + CR; // layer 3
if (CD !== 4 || CR !== 4 || CMIN !== Math.min(CA, CB) || CMAX !== Math.max(CA, CB)) throw new Error('bitonic ch4: compare-exchange');

// ---------------------------------------------------------------------------
// Ranks by counting: 8 example keys, one tie (items 1 and 3), ties broken by index (ranks-instead-of-sorting.md:16)
// ---------------------------------------------------------------------------

const KEYS = [5, 2, 7, 2, 9, 4, 1, 6];
const BITS = KEYS.map((xi, i) => KEYS.map((xj, j) => (xj < xi || (xj === xi && j < i) ? 1 : 0)));
const RANK = BITS.map((row) => row.reduce<number>((s, v) => s + v, 0));
const TIE = { i: 3, j: 1 };
{
  const placed = KEYS.map(() => -1);
  RANK.forEach((r, i) => (placed[r] = KEYS[i]));
  const sorted = [...KEYS].sort((a, b) => a - b);
  if (new Set(RANK).size !== 8 || placed.some((v, r) => v !== sorted[r]) || BITS[TIE.i][TIE.j] !== 1 || BITS[TIE.j][TIE.i] !== 0) {
    throw new Error('bitonic ch4: rank example is not a stable permutation');
  }
}
const PAIRS = (n: number): number => n * n;

// ---------------------------------------------------------------------------
// One fp32 example of drift (computed here; the measured rates are the notes')
// ---------------------------------------------------------------------------

const f32 = Math.fround;
const DA = f32(2.7);
const DB = f32(0.1);
const DMIN = f32(DA - f32(relu(f32(DA - DB))));
const ULP = 2 ** -27; // fp32 spacing in [1/16, 1/8)
const DSTEPS = Math.round((DB - DMIN) / ULP);
if (!(DB >= 1 / 16 && DB < 1 / 8 && DMIN >= 1 / 16) || DSTEPS !== 13 || Math.abs((DB - DMIN) / ULP - 13) > 1e-9) {
  throw new Error('bitonic ch4: fp32 drift example');
}
const DB_STR = DB.toPrecision(10); // 0.1000000015
const DMIN_STR = DMIN.toPrecision(10); // 0.09999990463

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

// the compare-exchange circuit: three layer slabs, nodes, inputs
const SLAB = { x: 110, w: 500, h: 80 };
const slabY = (L: number): number => 460 - L * 110;
type NodeId = 'a' | 'b' | 'd' | 'r' | 'mn' | 'mx';
const NODE: Record<NodeId, { x: number; y: number }> = {
  a: { x: 250, y: 585 },
  b: { x: 470, y: 585 },
  d: { x: 360, y: 500 },
  r: { x: 360, y: 390 },
  mn: { x: 250, y: 280 },
  mx: { x: 470, y: 280 },
};
const NODE_ORDER: NodeId[] = ['a', 'b', 'd', 'r', 'mn', 'mx'];
const EDGES: { from: NodeId; to: NodeId; w?: string; wx: number; wy: number }[] = [
  { from: 'a', to: 'd', w: '+1', wx: 296, wy: 552 },
  { from: 'b', to: 'd', w: '−1', wx: 424, wy: 552 },
  { from: 'd', to: 'r', wx: 0, wy: 0 },
  { from: 'r', to: 'mn', w: '−1', wx: 296, wy: 342 },
  { from: 'r', to: 'mx', w: '+1', wx: 424, wy: 342 },
  { from: 'a', to: 'mn', w: '+1', wx: 236, wy: 446 },
  { from: 'b', to: 'mx', w: '+1', wx: 484, wy: 446 },
];
const NR = 24;

// towers: one slab per layer, 4 px a layer
const PITCH = 4;
const BASE = 590;
const TW = { x: 150, w: 140 }; // bitonic
const CT = { x: 400, w: 140 }; // counting
const topOf = (n: number): number => BASE - PITCH * n;

// right zone: scoreboard bars
const BAR = { x: 720, len: 400, ya: 340, yb: 440, h: 28, axisY: 500 };
const COND_Y = 282;

// counting grid
const GX = 880;
const GY = 190;
const GC = 30;
const SLOT_Y = 478;
const PHOTO_X = 812;

// pair squares (side ∝ item count), anchored bottom-left
const SQ = { x: 760, y: 590, px: 1.6 };

// fp32 number line
const NL = { x0: 760, y: 320, step: 22, kMin: -16, kMax: 3 };
const nlx = (k: number): number => NL.x0 + (k - NL.kMin) * NL.step;

const CAM_PRIM: CameraState = { x: 950, y: 360, k: 1.25 };
const CAM_CMP: CameraState = { x: 500, y: 400, k: 1.15 };
const CAM_TOWER: CameraState = { x: 420, y: 420, k: 1.3 };
const CAM_BARS: CameraState = { x: 900, y: 400, k: 1.15 };
const CAM_GRID: CameraState = { x: 990, y: 350, k: 1.2 };
const CAM_SQ: CameraState = { x: 900, y: 390, k: 1.08 };
const CAM_DRIFT: CameraState = { x: 970, y: 370, k: 1.12 };
const CAM_END: CameraState = { x: 640, y: 370, k: 0.94 };

// ---------------------------------------------------------------------------
// The narration (book.json chapters[3].captions, verbatim)
// ---------------------------------------------------------------------------

const TEXTS = [
  'Handwired writes a program as one fixed circuit of weighted sums and relu, over thirty-two-bit floats. Relu keeps a positive number and turns a negative one into zero. No loops, no branches.',
  'The circuit is cut into layers. Operations that do not depend on each other share a layer, and each layer reads only earlier ones. So cost has two numbers: operations in all, and layers deep.',
  "A sort that branches on comparisons cannot be written that way, but a sorting network can, because its comparators never depend on the data. The numbers ahead are measurements from Handwired's own exploration notes.",
  'A comparator becomes arithmetic. Subtract the two keys, run the difference through relu, subtract that from the first key for the minimum, and add it to the second for the maximum. Four operations, three layers.',
  'Twenty-one stages at three layers each predicts sixty-three layers for sixty-four keys. Handwired measured the bitonic network, keys only, at sixty-four layers and two thousand seven hundred fifty-two operations.',
  'Four operations times six hundred seventy-two comparators would be two thousand six hundred eighty-eight. The notes do not explain the small gap, so read these as measurements, not a derivation.',
  'Real lists carry a payload, like a photo that travels with its key. With one payload value per item, the bitonic network measured one thousand two hundred forty-eight operations in fifty layers at sixteen items.',
  'The rival needs no network. A rank counts the items ahead of this one, so compare every pair and add. Equal keys break ties by index, and that count is the sorted position. A one-hot read fetches the payload.',
  'At sixteen items, counting wins on work: one thousand fifty-six operations against one thousand two hundred forty-eight, in five layers against fifty.',
  'At sixty-four, the network wins on work: ten thousand six hundred twenty-four operations against sixteen thousand five hundred twelve. But it is one hundred five layers deep, and counting stays at five.',
  "Pairs grow with the square of the item count. Handwired's notes still call counting the better choice for the item counts interfaces usually have, with trouble starting around hundreds of items.",
  'One caveat. Minimum and maximum built from arithmetic drift on fractional keys. On the odd-even network, twenty to twenty-four percent of outputs matched no input bit for bit, with errors up to six in a hundred thousand.',
  'The verdict, from that historical record: at interface sizes, count ranks. Whether to package a sorting network for apps that sort well past sixty-four items is still an open question.',
];
// ~150 words a minute, plus a breath; a 0.9 s hold between beats
const CAPS = (() => {
  const out: { at: number; dur: number; text: string }[] = [];
  let t = 0.5;
  for (const text of TEXTS) {
    const dur = Math.round((text.split(/\s+/).length / 2.5 + 0.5) * 10) / 10;
    out.push({ at: +t.toFixed(1), dur, text });
    t += dur + 0.9;
  }
  return out;
})();

// condition chip text, by phase
const COND = [
  '64 keys, keys only · measured',
  '16 items, one payload value each · measured',
  '64 items, one payload value each, integer keys · measured',
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // B1 · the primitives
  const sumU = tl.channel('sumU', 0);
  const reluU = tl.channel('reluU', 0);
  const fpU = tl.channel('fpU', 0);
  const noU = tl.channel('noU', 0);
  const cellsU = tl.channel('cellsU', 0);
  const primOp = tl.channel('primOp', 1);
  // B2 · layers
  const slabU = tl.channel('slabU', 0); // 0..3
  const nodeU = tl.channel('nodeU', 0); // 0..6
  const edgeU = tl.channel('edgeU', 0);
  const costU = tl.channel('costU', 0);
  const indepU = tl.channel('indepU', 0);
  const circOp = tl.channel('circOp', 1);
  // B3 · branches vs network
  const flowU = tl.channel('flowU', 0);
  const flowX = tl.channel('flowX', 0);
  const netU = tl.channel('netU', 0);
  const stampU = tl.channel('stampU', 0);
  const b3Op = tl.channel('b3Op', 1);
  // B4 · the comparator as arithmetic
  const valU = tl.channel('valU', 0); // 0..4
  const cardU = tl.channel('cardU', 0);
  // B5–B6 · the keys-only tower and the gap
  const foldU = tl.channel('foldU', 0);
  const bitN = tl.channel('bitN', 3);
  const bandU = tl.channel('bandU', 1);
  const stageLblU = tl.channel('stageLblU', 0);
  const predU = tl.channel('predU', 0);
  const extraU = tl.channel('extraU', 0);
  const measU = tl.channel('measU', 0);
  const towerOp = tl.channel('towerOp', 1);
  const barsOp = tl.channel('barsOp', 0);
  const barA = tl.channel('barA', 0);
  const barB = tl.channel('barB', 0);
  const rowBOp = tl.channel('rowBOp', 0);
  const rowPhase = tl.channel('rowPhase', 0);
  const domain = tl.channel('domain', 2900);
  const gapU = tl.channel('gapU', 0);
  // B7 · payload
  const payU = tl.channel('payU', 0);
  const condOp = tl.channel('condOp', 0);
  const condIdx = tl.channel('condIdx', 0);
  const topLblU = tl.channel('topLblU', 0);
  // B8 · the counting grid
  const gridOp = tl.channel('gridOp', 0);
  const gridU = tl.channel('gridU', 0);
  const formU = tl.channel('formU', 0);
  const bitsU = tl.channel('bitsU', 0); // 0..64
  const sumsU = tl.channel('sumsU', 0);
  const tieU = tl.channel('tieU', 0);
  const slideU = tl.channel('slideU', 0);
  // B9–B10 · the races
  const cntN = tl.channel('cntN', 0);
  const laneBU = tl.channel('laneBU', 0);
  const winA = tl.channel('winA', 0);
  const winB = tl.channel('winB', 0);
  const cntHi = tl.channel('cntHi', 0);
  // B11 · pairs grow as n²
  const sqMorph = tl.channel('sqMorph', 0);
  const sqN = tl.channel('sqN', 8);
  const sq16U = tl.channel('sq16U', 0);
  const sq64U = tl.channel('sq64U', 0);
  const sq256U = tl.channel('sq256U', 0);
  const uiNoteU = tl.channel('uiNoteU', 0);
  // B12 · fp32 drift
  const driftOp = tl.channel('driftOp', 0);
  const lineU = tl.channel('lineU', 0);
  const bMarkU = tl.channel('bMarkU', 0);
  const minMarkU = tl.channel('minMarkU', 0);
  const gapNlU = tl.channel('gapNlU', 0);
  const measCardU = tl.channel('measCardU', 0);
  const intU = tl.channel('intU', 0);
  // B13 · verdict
  const finalU = tl.channel('finalU', 0);
  const stamp1 = tl.channel('stamp1', 0);
  const stamp2 = tl.channel('stamp2', 0);

  CAPS.forEach((c) => tl.caption(c));
  const B = CAPS.map((c) => c.at);
  const E = CAPS.map((c) => c.at + c.dur);
  const fade = (ch: ReturnType<typeof tl.channel<number>>, to: number, at: number, dur = 0.6) =>
    tl.tween(ch, to, { at, dur, ease: ease.move });

  // — B1 · weighted sums and relu, no loops, no branches —
  let b = B[0];
  tl.tween(cam, CAM_PRIM, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(sumU, 1, { at: b + 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(cellsU, 1, { at: b + 1.6, dur: 1.4, ease: ease.linear });
  tl.tween(fpU, 1, { at: b + 4.2, dur: 0.6, ease: ease.pop });
  tl.tween(reluU, 1, { at: b + 6.0, dur: 1.4, ease: ease.draw });
  tl.tween(noU, 1, { at: b + 10.6, dur: 0.9, ease: ease.draw });
  tl.hold(E[0], 0.9);

  // — B2 · the circuit is cut into layers —
  b = B[1];
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.3, ease: ease.move });
  fade(primOp, 0, b, 0.7);
  tl.tween(slabU, 3, { at: b + 0.6, dur: 1.8, ease: ease.linear });
  tl.tween(nodeU, 6, { at: b + 2.0, dur: 2.0, ease: ease.linear });
  tl.tween(edgeU, 1, { at: b + 3.6, dur: 1.4, ease: ease.draw });
  tl.tween(indepU, 1, { at: b + 4.6, dur: 0.6, ease: ease.pop });
  tl.tween(costU, 1, { at: b + 9.2, dur: 0.8, ease: ease.enter });
  tl.hold(E[1], 0.9);

  // — B3 · branches can't be wired; a network can —
  b = B[2];
  fade(costU, 0, b, 0.5);
  fade(indepU, 0, b, 0.5);
  fade(circOp, 0.12, b, 0.7);
  tl.tween(flowU, 1, { at: b + 0.5, dur: 0.8, ease: ease.enter });
  tl.tween(flowX, 1, { at: b + 3.0, dur: 0.8, ease: ease.draw });
  tl.tween(netU, 1, { at: b + 5.0, dur: 1.4, ease: ease.draw });
  tl.tween(stampU, 1, { at: b + 9.6, dur: 0.6, ease: ease.pop });
  tl.hold(E[2], 0.9);

  // — B4 · a comparator becomes arithmetic —
  b = B[3];
  fade(b3Op, 0, b, 0.6);
  fade(circOp, 1, b, 0.7);
  tl.tween(cam, CAM_CMP, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(valU, 1, { at: b + 1.2, dur: 0.5, ease: ease.enter });
  tl.tween(valU, 2, { at: b + 2.4, dur: 0.6, ease: ease.move });
  tl.tween(valU, 3, { at: b + 4.4, dur: 0.6, ease: ease.move });
  tl.tween(valU, 4, { at: b + 6.4, dur: 0.6, ease: ease.move });
  tl.tween(cardU, 1, { at: b + 8.6, dur: 0.7, ease: ease.enter });
  tl.hold(E[3], 0.9);

  // — B5 · 21 stages × 3 layers predicts 63; measured 64 and 2,752 —
  b = B[4];
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.1, ease: ease.move });
  fade(cardU, 0, b, 0.5);
  fade(valU, 0, b, 0.5);
  tl.tween(foldU, 1, { at: b + 0.3, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_TOWER, { at: b + 2.0, dur: 1.3, ease: ease.move });
  tl.tween(stageLblU, 1, { at: b + 2.0, dur: 0.4, ease: ease.enter });
  tl.tween(bitN, PRED_LAYERS, { at: b + 2.2, dur: 3.8, ease: ease.linear });
  fade(stageLblU, 0, b + 6.2, 0.4);
  tl.tween(predU, 1, { at: b + 6.2, dur: 0.6, ease: ease.enter });
  tl.tween(bitN, M.keys64.layers, { at: b + 7.6, dur: 0.5, ease: ease.pop });
  tl.tween(extraU, 1, { at: b + 7.6, dur: 0.5, ease: ease.pop });
  tl.tween(measU, 1, { at: b + 7.9, dur: 0.6, ease: ease.enter });
  tl.hold(E[4], 0.9);

  // — B6 · 672 × 4 = 2,688 against the measured 2,752 —
  b = B[5];
  tl.tween(cam, CAM_BARS, { at: b, dur: 1.3, ease: ease.move });
  fade(barsOp, 1, b + 0.4, 0.6);
  tl.tween(barA, M.keys64.ops, { at: b + 0.6, dur: 1.0, ease: ease.move });
  fade(rowBOp, 1, b + 2.0, 0.6);
  tl.tween(barB, PRED_OPS, { at: b + 2.2, dur: 1.0, ease: ease.move });
  tl.tween(gapU, 1, { at: b + 5.2, dur: 0.7, ease: ease.pop });
  tl.hold(E[5], 0.9);

  // — B7 · a payload rides along: 16 items, 1,248 operations, 50 layers —
  b = B[6];
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.3, ease: ease.move });
  fade(gapU, 0, b, 0.5);
  fade(rowBOp, 0, b, 0.5);
  fade(predU, 0, b, 0.5);
  fade(measU, 0, b, 0.5);
  fade(extraU, 0, b + 0.3, 0.6);
  fade(bandU, 0, b + 0.3, 0.8);
  tl.set(barB, 0, b + 0.6);
  tl.set(condIdx, 1, b + 0.5);
  tl.tween(payU, 1, { at: b + 1.0, dur: 1.2, ease: ease.linear });
  fade(condOp, 1, b + 6.0, 0.5);
  tl.tween(bitN, M.bit16.layers, { at: b + 7.0, dur: 1.3, ease: ease.move });
  tl.tween(topLblU, 1, { at: b + 7.4, dur: 0.6, ease: ease.enter });
  tl.tween(domain, 1400, { at: b + 7.0, dur: 1.3, ease: ease.move });
  tl.tween(barA, M.bit16.ops, { at: b + 7.0, dur: 1.3, ease: ease.move });
  tl.hold(E[6], 0.9);

  // — B8 · ranks by counting: compare every pair, add, break ties by index, read one-hot —
  b = B[7];
  tl.tween(cam, CAM_GRID, { at: b, dur: 1.3, ease: ease.move });
  fade(barsOp, 0, b, 0.5);
  fade(condOp, 0, b, 0.5);
  fade(payU, 0, b, 0.5);
  fade(towerOp, 0.12, b, 0.6);
  fade(gridOp, 1, b + 0.4, 0.5);
  tl.tween(gridU, 1, { at: b + 0.5, dur: 0.9, ease: ease.enter });
  tl.tween(formU, 1, { at: b + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(bitsU, 64, { at: b + 3.0, dur: 3.0, ease: ease.linear });
  tl.tween(sumsU, 1, { at: b + 6.2, dur: 0.8, ease: ease.enter });
  tl.tween(tieU, 1, { at: b + 7.8, dur: 0.6, ease: ease.pop });
  tl.tween(slideU, 1, { at: b + 11.6, dur: 1.6, ease: ease.move });
  tl.hold(E[7], 0.9);

  // — B9 · 16 items: counting less work, 5 layers against 50 —
  b = B[8];
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.3, ease: ease.move });
  fade(gridOp, 0, b, 0.6);
  fade(towerOp, 1, b, 0.6);
  fade(barsOp, 1, b + 0.3, 0.6);
  fade(condOp, 1, b + 0.3, 0.6);
  tl.set(rowPhase, 1, b + 0.2);
  fade(rowBOp, 1, b + 0.6, 0.5);
  tl.tween(barB, M.cnt16.ops, { at: b + 0.8, dur: 1.2, ease: ease.move });
  tl.tween(laneBU, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(cntN, M.cnt16.layers, { at: b + 1.2, dur: 0.6, ease: ease.pop });
  tl.tween(winB, 1, { at: b + 2.8, dur: 0.5, ease: ease.pop });
  tl.hold(E[8], 0.9);

  // — B10 · 64 items: the network less work, 105 layers against 5 —
  b = B[9];
  fade(winB, 0, b, 0.4);
  tl.set(condIdx, 2, b + 0.2);
  tl.tween(domain, 17000, { at: b + 0.6, dur: 1.6, ease: ease.move });
  tl.tween(barA, M.bit64.ops, { at: b + 0.6, dur: 1.6, ease: ease.move });
  tl.tween(barB, M.cnt64.ops, { at: b + 0.6, dur: 1.6, ease: ease.move });
  tl.tween(winA, 1, { at: b + 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(bitN, M.bit64.layers, { at: b + 6.4, dur: 1.8, ease: ease.move });
  tl.tween(cntHi, 1, { at: b + 9.4, dur: 0.6, ease: ease.pop });
  tl.hold(E[9], 0.9);

  // — B11 · pairs grow as n² —
  b = B[10];
  tl.tween(cam, CAM_SQ, { at: b, dur: 1.3, ease: ease.move });
  fade(winA, 0, b, 0.4);
  fade(cntHi, 0, b, 0.4);
  fade(barsOp, 0, b, 0.6);
  fade(condOp, 0, b, 0.6);
  fade(towerOp, 0.12, b, 0.6);
  fade(gridOp, 1, b + 0.4, 0.6);
  tl.tween(sqMorph, 1, { at: b + 0.6, dur: 1.3, ease: ease.move });
  tl.tween(sqN, 16, { at: b + 2.2, dur: 0.9, ease: ease.move });
  tl.tween(sq16U, 1, { at: b + 2.6, dur: 0.5, ease: ease.enter });
  tl.tween(sqN, 64, { at: b + 3.6, dur: 1.2, ease: ease.move });
  tl.tween(sq64U, 1, { at: b + 4.4, dur: 0.5, ease: ease.enter });
  tl.tween(uiNoteU, 1, { at: b + 6.0, dur: 0.6, ease: ease.enter });
  tl.tween(sq256U, 1, { at: b + 9.0, dur: 1.4, ease: ease.draw });
  tl.hold(E[10], 0.9);

  // — B12 · fractional keys drift —
  b = B[11];
  tl.tween(cam, CAM_DRIFT, { at: b, dur: 1.3, ease: ease.move });
  fade(gridOp, 0, b, 0.6);
  fade(driftOp, 1, b + 0.4, 0.6);
  tl.tween(lineU, 1, { at: b + 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(bMarkU, 1, { at: b + 1.8, dur: 0.5, ease: ease.pop });
  tl.tween(minMarkU, 1, { at: b + 2.8, dur: 0.5, ease: ease.pop });
  tl.tween(gapNlU, 1, { at: b + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(measCardU, 1, { at: b + 5.4, dur: 0.7, ease: ease.enter });
  tl.tween(intU, 1, { at: b + 11.5, dur: 0.6, ease: ease.enter });
  tl.hold(E[11], 0.9);

  // — B13 · the verdict —
  b = B[12];
  tl.tween(cam, CAM_END, { at: b, dur: 1.6, ease: ease.move });
  fade(driftOp, 0, b, 0.6);
  tl.set(rowBOp, 1, b);
  fade(towerOp, 0.12, b, 0.3);
  tl.tween(finalU, 1, { at: b + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(stamp1, 1, { at: b + 3.0, dur: 0.6, ease: ease.pop });
  tl.tween(stamp2, 1, { at: b + 5.6, dur: 0.6, ease: ease.pop });
  tl.hold(E[12], 2.5);

  return {
    tl, cam,
    sumU, reluU, fpU, noU, cellsU, primOp,
    slabU, nodeU, edgeU, costU, indepU, circOp,
    flowU, flowX, netU, stampU, b3Op,
    valU, cardU,
    foldU, bitN, bandU, stageLblU, predU, extraU, measU, towerOp,
    barsOp, barA, barB, rowBOp, rowPhase, domain, gapU,
    payU, condOp, condIdx, topLblU,
    gridOp, gridU, formU, bitsU, sumsU, tieU, slideU,
    cntN, laneBU, winA, winB, cntHi,
    sqMorph, sqN, sq16U, sq64U, sq256U, uiNoteU,
    driftOp, lineU, bMarkU, minMarkU, gapNlU, measCardU, intU,
    finalU, stamp1, stamp2,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

function Cross({ x0, y0, x1, y1, u, w = 3 }: { x0: number; y0: number; x1: number; y1: number; u: number; w?: number }) {
  if (u <= 0.01) return null;
  const a = clamp01(u * 2);
  const c = clamp01(u * 2 - 1);
  return (
    <g stroke={colors.NEGATIVE} strokeWidth={w} strokeLinecap="round">
      <line x1={x0} y1={y0} x2={lerp(x0, x1, a)} y2={lerp(y0, y1, a)} />
      {c > 0 && <line x1={x1} y1={y0} x2={lerp(x1, x0, c)} y2={lerp(y0, y1, c)} />}
    </g>
  );
}

function Check({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <path d={`M ${x - 7 * s} ${y} L ${x - 2 * s} ${y + 5 * s} L ${x + 8 * s} ${y - 6 * s}`} stroke={colors.POSITIVE} strokeWidth={3}
      fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

function Photo({ x, y, w = 26, h = 20, tint, opacity = 1 }: { x: number; y: number; w?: number; h?: number; tint: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={colors.PANEL} stroke={tint} strokeWidth={1.5} />
      <path d={`M ${x - w / 2 + 3} ${y + h / 2 - 3} L ${x - 3} ${y - 2} L ${x + 2} ${y + 3} L ${x + 5} ${y} L ${x + w / 2 - 3} ${y + h / 2 - 3} Z`} fill={tint} opacity={0.75} />
      <circle cx={x + w / 2 - 6} cy={y - h / 2 + 6} r={2.2} fill={tint} />
    </g>
  );
}

const photoTint = (key: number): string => colors.heat(0.25 + (0.7 * key) / 9);

function ReluIcon({ x, y, s = 1, color }: { x: number; y: number; s?: number; color: string }) {
  return (
    <path d={`M ${x - 11 * s} ${y + 5 * s} L ${x} ${y + 5 * s} L ${x + 10 * s} ${y - 7 * s}`} stroke={color} strokeWidth={2.2} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const sx = (x: number): number => (x - cam.x) * cam.k + STAGE_W / 2;
  const sy = (y: number): number => (y - cam.y) * cam.k + STAGE_H / 2;
  // labels a camera push would carry off the stage, under the title band, or into the caption band fade out whole
  const fitBox = (x0: number, x1: number, y0: number, y1: number): number => {
    const r = 6;
    return clamp01((sx(x0) - 4) / r) * clamp01((STAGE_W - 4 - sx(x1)) / r) * clamp01((sy(y0) - 80) / r) * clamp01((626 - sy(y1)) / r);
  };
  const T = (p: {
    x: number; y: number; text: string; fs?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
    op?: number; weight?: number; k?: string | number;
  }): ReactNode => {
    const { x, y, text, fs = 14, color = colors.TEXT, anchor = 'start', mono = false, op = 1, weight } = p;
    if (op <= 0.01) return null;
    const w = text.length * fs * (mono ? 0.6 : 0.54);
    const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
    const o = op * fitBox(x0, x0 + w, y - fs, y + fs * 0.3);
    if (o <= 0.01) return null;
    return (
      <text key={p.k} x={x} y={y} textAnchor={anchor} fill={color} fontSize={fs} fontFamily={mono ? MONO : UI} fontWeight={weight} opacity={o}>
        {text}
      </text>
    );
  };
  const Chip = (p: { x: number; y: number; text: string; color: string; op?: number; fs?: number; mono?: boolean; fill?: boolean; k?: string }): ReactNode => {
    const { x, y, text, color, op = 1, fs = 14, mono = false, fill = false } = p;
    if (op <= 0.01) return null;
    const w = text.length * fs * (mono ? 0.6 : 0.54) + 20;
    return (
      <g key={p.k} opacity={op}>
        <rect x={x} y={y - fs - 5} width={w} height={fs + 13} rx={7} fill={fill ? color : colors.PANEL} fillOpacity={fill ? 0.16 : 1} stroke={color} strokeWidth={1.3} />
        {T({ x: x + w / 2, y, text, fs, color, anchor: 'middle', mono })}
      </g>
    );
  };

  const v = <K extends keyof typeof scene>(k: K) => s.get(scene[k] as never) as number;

  const sumU = v('sumU');
  const reluU = v('reluU');
  const fpU = v('fpU');
  const noU = v('noU');
  const cellsU = v('cellsU');
  const primOp = v('primOp');
  const slabU = v('slabU');
  const nodeU = v('nodeU');
  const edgeU = v('edgeU');
  const costU = v('costU');
  const indepU = v('indepU');
  const circOp = v('circOp');
  const flowU = v('flowU');
  const flowX = v('flowX');
  const netU = v('netU');
  const stampU = v('stampU');
  const b3Op = v('b3Op');
  const valU = v('valU');
  const cardU = v('cardU');
  const foldU = v('foldU');
  const bitN = v('bitN');
  const bandU = v('bandU');
  const stageLblU = v('stageLblU');
  const predU = v('predU');
  const extraU = v('extraU');
  const measU = v('measU');
  const towerOp = v('towerOp');
  const barsOp = v('barsOp');
  const barA = v('barA');
  const barB = v('barB');
  const rowBOp = v('rowBOp');
  const rowPhase = v('rowPhase');
  const domain = v('domain');
  const gapU = v('gapU');
  const payU = v('payU');
  const condOp = v('condOp');
  const condIdx = Math.round(v('condIdx'));
  const topLblU = v('topLblU');
  const gridOp = v('gridOp');
  const gridU = v('gridU');
  const formU = v('formU');
  const bitsU = v('bitsU');
  const sumsU = v('sumsU');
  const tieU = v('tieU');
  const slideU = v('slideU');
  const cntN = v('cntN');
  const laneBU = v('laneBU');
  const winA = v('winA');
  const winB = v('winB');
  const cntHi = v('cntHi');
  const sqMorph = v('sqMorph');
  const sqN = v('sqN');
  const sq16U = v('sq16U');
  const sq64U = v('sq64U');
  const sq256U = v('sq256U');
  const uiNoteU = v('uiNoteU');
  const driftOp = v('driftOp');
  const lineU = v('lineU');
  const bMarkU = v('bMarkU');
  const minMarkU = v('minMarkU');
  const gapNlU = v('gapNlU');
  const measCardU = v('measCardU');
  const intU = v('intU');
  const finalU = v('finalU');
  const stamp1 = v('stamp1');
  const stamp2 = v('stamp2');

  // ---- the circuit: slabs fold down into the tower's first three layers ----
  const slabRect = (L: number) => {
    const big = { x: SLAB.x, y: slabY(L), w: SLAB.w, h: SLAB.h };
    const small = { x: TW.x, y: BASE - PITCH * (L + 1), w: TW.w, h: PITCH - 1 };
    return { x: lerp(big.x, small.x, foldU), y: lerp(big.y, small.y, foldU), w: lerp(big.w, small.w, foldU), h: lerp(big.h, small.h, foldU) };
  };
  const nodesOp = circOp * clamp01(1 - foldU * 2.5);
  const nodeIn = (id: NodeId): number => clamp01(nodeU - NODE_ORDER.indexOf(id));
  const opsShown = Math.min(4, Math.max(0, Math.floor(nodeU + 1e-6) - 2));

  // ---- towers ----
  const tower = (x: number, w: number, n: number, color: string, opts: { band?: number; from?: number; extra?: number; hi?: number } = {}) => {
    const out: ReactNode[] = [];
    const count = Math.ceil(n - 1e-6);
    for (let k = opts.from ?? 0; k < count; k++) {
      const frac = Math.min(1, n - k);
      const y = BASE - PITCH * (k + 1);
      const stage = Math.floor(k / 3);
      let op = lerp(0.8, stage % 2 ? 0.45 : 0.9, opts.band ?? 0);
      let fill = color;
      if (k === M.keys64.layers - 1 && (opts.extra ?? 0) > 0.01) {
        fill = colors.WARM;
        op = lerp(op, 1, opts.extra ?? 0);
      }
      out.push(<rect key={k} x={x} y={y} width={w * frac} height={PITCH - 1} fill={fill} opacity={op} />);
    }
    if (opts.hi && opts.hi > 0.01 && count > 0) {
      const top = BASE - PITCH * n;
      out.push(<rect key="hi" x={x - 6} y={top - 6} width={w + 12} height={BASE - top + 10} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={opts.hi} />);
    }
    return out;
  };

  // ---- bars ----
  const bx = (val: number): number => BAR.x + (BAR.len * val) / domain;
  const tickStep = [250, 500, 1000, 2000, 2500, 5000].find((st) => domain / st <= 5) ?? 5000;
  const ticks: number[] = [];
  for (let t = 0; t <= domain + 1e-6; t += tickStep) ticks.push(t);

  // ---- grid → squares ----
  const gridSide = lerp(8 * GC, 8 * SQ.px, sqMorph);
  const sqSide = sqMorph > 0 ? (sqMorph < 1 ? gridSide : sqN * SQ.px) : 8 * GC;
  const sqX = lerp(GX, SQ.x, sqMorph);
  const sqY = lerp(GY, SQ.y - 8 * SQ.px, sqMorph) - (sqMorph >= 1 ? sqSide - 8 * SQ.px : 0);
  const cellOp = clamp01(1 - sqMorph * 1.6);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== B1 · weighted sums, relu, no loops, no branches ======================== */}
        {primOp > 0.01 && (
          <g opacity={primOp}>
            {/* weighted sum */}
            <g opacity={clamp01(sumU * 2)}>
              {[200, 240, 280].map((y, k) => (
                <g key={k}>
                  <line x1={700} y1={y} x2={lerp(700, 800 - 30, sumU)} y2={lerp(y, 240, sumU)} stroke={colors.MUTED} strokeWidth={1.5} />
                  <circle cx={700} cy={y} r={5} fill={colors.MUTED} />
                  {T({ x: 726, y: y - 8 + (240 - y) * 0.25, text: `w${k + 1}`, fs: 13, color: colors.MUTED, mono: true, op: clamp01(sumU * 2 - 1), k })}
                </g>
              ))}
              <circle cx={800} cy={240} r={30} fill={colors.PANEL} stroke={HUE} strokeWidth={2} />
              {T({ x: 800, y: 250, text: 'Σ', fs: 26, color: HUE, anchor: 'middle' })}
              <line x1={830} y1={240} x2={lerp(830, 880, sumU)} y2={240} stroke={HUE} strokeWidth={2} />
              {T({ x: 800, y: 300, text: 'weighted sum', fs: 15, anchor: 'middle' })}
            </g>
            {/* relu */}
            <g opacity={clamp01(reluU * 3)}>
              <line x1={950} y1={270} x2={1200} y2={270} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={1080} y1={150} x2={1080} y2={286} stroke={colors.GRID} strokeWidth={1.5} />
              <polyline
                points={`960,270 ${lerp(960, 1080, clamp01(reluU * 2))},270 ${lerp(1080, 1190, clamp01(reluU * 2 - 1))},${lerp(270, 160, clamp01(reluU * 2 - 1))}`}
                fill="none" stroke={HUE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              {T({ x: 960, y: 180, text: 'relu', fs: 18, color: HUE })}
              {T({ x: 1020, y: 296, text: 'negative → 0', fs: 13, color: colors.MUTED, anchor: 'middle', op: clamp01(reluU * 2) })}
              {T({ x: 1150, y: 296, text: 'positive kept', fs: 13, color: colors.MUTED, anchor: 'middle', op: clamp01(reluU * 2 - 1) })}
            </g>
            {Chip({ x: 720, y: 376, text: '32-bit floats', color: HUE, op: fpU, mono: true })}
            {/* no loops, no branches */}
            <g opacity={clamp01(noU * 3)}>
              {Chip({ x: 720, y: 444, text: 'loop', color: colors.MUTED, mono: true })}
              <Cross x0={716} y0={424} x1={796} y1={452} u={noU} />
              {Chip({ x: 830, y: 444, text: 'branch', color: colors.MUTED, mono: true })}
              <Cross x0={826} y0={424} x1={928} y1={452} u={noU} />
            </g>
            {/* one fixed circuit */}
            {T({ x: 720, y: 492, text: 'one fixed circuit', fs: 14, color: colors.MUTED, op: clamp01(cellsU * 3) })}
            {Array.from({ length: 20 }, (_, i) => {
              const r = Math.floor(i / 10);
              const c = i % 10;
              const u = clamp01(cellsU * 20 - i);
              if (u <= 0) return null;
              const isRelu = (r + c) % 3 === 1;
              const x = 720 + c * 48;
              const y = 504 + r * 34;
              return (
                <g key={i} opacity={u}>
                  <rect x={x} y={y} width={42} height={28} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
                  {isRelu ? <ReluIcon x={x + 21} y={y + 14} s={0.9} color={HUE} /> : T({ x: x + 21, y: y + 19, text: 'Σ', fs: 14, color: HUE, anchor: 'middle' })}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== the circuit (B2–B4), folding into the tower (B5) ======================== */}
        {foldU < 0.999 && slabU > 0.01 && (
          <g opacity={circOp}>
            {[0, 1, 2].map((L) => {
              const u = clamp01(slabU - L);
              if (u <= 0) return null;
              const r = slabRect(L);
              return (
                <g key={L} opacity={u}>
                  <rect x={r.x} y={r.y + (1 - u) * 20} width={r.w} height={r.h} rx={lerp(10, 1, foldU)} fill={HUE}
                    fillOpacity={lerp(0.07, 0.85, foldU)} stroke={HUE} strokeOpacity={lerp(0.45, 0, foldU)} strokeWidth={1.3} />
                  {T({ x: SLAB.x + SLAB.w - 12, y: slabY(L) + 24, text: `layer ${L + 1}`, fs: 14, color: HUE, anchor: 'end', op: clamp01(1 - foldU * 3) })}
                </g>
              );
            })}
          </g>
        )}
        {nodesOp > 0.01 && (
          <g opacity={nodesOp}>
            {/* edges: every one runs upward, into a later layer */}
            {EDGES.map((e, i) => {
              const A = NODE[e.from];
              const Bn = NODE[e.to];
              const len = Math.hypot(Bn.x - A.x, Bn.y - A.y);
              const ux = (Bn.x - A.x) / len;
              const uy = (Bn.y - A.y) / len;
              const u = clamp01(edgeU * 1.6 - i * 0.1);
              if (u <= 0) return null;
              const x1 = A.x + ux * NR;
              const y1 = A.y + uy * NR;
              const x2 = lerp(x1, Bn.x - ux * (NR + 4), u);
              const y2 = lerp(y1, Bn.y - uy * (NR + 4), u);
              const skip = e.from === 'a' || e.from === 'b' ? e.to === 'mn' || e.to === 'mx' : false;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray={skip ? '5 4' : undefined} />
                  {u > 0.98 && <polygon points={`${x2},${y2} ${x2 - ux * 8 - uy * 4},${y2 - uy * 8 + ux * 4} ${x2 - ux * 8 + uy * 4},${y2 - uy * 8 - ux * 4}`} fill={colors.MUTED} />}
                  {e.w && T({ x: e.wx, y: e.wy, text: e.w, fs: 13, color: colors.MUTED, anchor: 'middle', mono: true, op: cardU })}
                </g>
              );
            })}
            {/* min and max share layer 3: independent */}
            {indepU > 0.01 && (
              <g opacity={indepU}>
                <rect x={NODE.mn.x - 40} y={NODE.mn.y - 36} width={NODE.mx.x - NODE.mn.x + 80} height={72} rx={36} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} strokeDasharray="6 4" />
              </g>
            )}
            {NODE_ORDER.map((id) => {
              const u = nodeIn(id);
              if (u <= 0) return null;
              const n = NODE[id];
              const isInput = id === 'a' || id === 'b';
              const lit = valU >= (id === 'a' || id === 'b' ? 1 : id === 'd' ? 2 : id === 'r' ? 3 : 4) - 0.5;
              return (
                <g key={id} opacity={u}>
                  <circle cx={n.x} cy={n.y} r={NR * (0.7 + 0.3 * u)} fill={isInput ? colors.WARM : colors.PANEL} fillOpacity={isInput ? 0.18 : 1}
                    stroke={isInput ? colors.WARM : lit ? colors.WARM : HUE} strokeWidth={2} />
                  {isInput
                    ? T({ x: n.x, y: n.y + 6, text: id, fs: 17, color: colors.WARM, anchor: 'middle', mono: true })
                    : id === 'r'
                      ? <ReluIcon x={n.x} y={n.y + 1} s={1.05} color={HUE} />
                      : T({ x: n.x, y: n.y + 8, text: 'Σ', fs: 21, color: HUE, anchor: 'middle' })}
                </g>
              );
            })}
            {/* values and formulas (B4) */}
            {T({ x: NODE.a.x - 34, y: NODE.a.y + 6, text: `a = ${CA}`, fs: 15, color: colors.WARM, anchor: 'end', mono: true, op: clamp01(valU) })}
            {T({ x: NODE.b.x + 34, y: NODE.b.y + 6, text: `b = ${CB}`, fs: 15, color: colors.WARM, mono: true, op: clamp01(valU) })}
            {T({ x: NODE.d.x + 34, y: NODE.d.y + 6, text: valU >= 1.5 ? `d = a − b = ${CD}` : 'd = a − b', fs: 15, color: valU >= 1.5 ? colors.WARM : colors.TEXT, mono: true, op: clamp01(valU * 2 - 1) })}
            {T({ x: NODE.r.x + 34, y: NODE.r.y + 6, text: valU >= 2.5 ? `relu(d) = ${CR}` : 'relu(d)', fs: 15, color: valU >= 2.5 ? colors.WARM : colors.TEXT, mono: true, op: clamp01(valU * 2 - 1) })}
            {T({ x: NODE.mn.x, y: NODE.mn.y - 46, text: valU >= 3.5 ? `min = a − relu(d) = ${CMIN}` : 'min = a − relu(d)', fs: 15, color: valU >= 3.5 ? colors.WARM : colors.TEXT, anchor: 'middle', mono: true, op: clamp01(valU * 2 - 1) })}
            {T({ x: NODE.mx.x + 20, y: NODE.mx.y - 46, text: valU >= 3.5 ? `max = b + relu(d) = ${CMAX}` : 'max = b + relu(d)', fs: 15, color: valU >= 3.5 ? colors.WARM : colors.TEXT, anchor: 'middle', mono: true, op: clamp01(valU * 2 - 1) })}
          </g>
        )}

        {/* B2 · cost has two numbers */}
        {costU > 0.01 && (
          <g opacity={costU}>
            {T({ x: 720, y: 240, text: 'cost has two numbers', fs: 15, color: colors.MUTED })}
            {T({ x: 720, y: 300, text: 'operations in all', fs: 18 })}
            {T({ x: 1000, y: 304, text: `${opsShown}`, fs: 32, color: HUE, mono: true })}
            {T({ x: 720, y: 360, text: 'layers deep', fs: 18 })}
            {T({ x: 1000, y: 364, text: '3', fs: 32, color: HUE, mono: true })}
          </g>
        )}
        {T({ x: 720, y: 430, text: 'independent: min and max share layer 3', fs: 14, color: colors.POSITIVE, op: indepU })}
        {T({ x: 720, y: 456, text: 'each layer reads only earlier ones', fs: 14, color: colors.MUTED, op: indepU })}

        {/* ======================== B3 · a branching sort vs a fixed network ======================== */}
        {flowU > 0.01 && b3Op > 0.01 && (
          <g opacity={flowU * b3Op}>
            {T({ x: 740, y: 124, text: 'a sort that branches on comparisons', fs: 15 })}
            <polygon points="800,166 852,200 800,234 748,200" fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
            {T({ x: 800, y: 205, text: 'a > b ?', fs: 14, anchor: 'middle', mono: true })}
            {[{ y: 160, t: 'swap' }, { y: 240, t: 'keep' }].map((bx2, k) => (
              <g key={k}>
                <line x1={852} y1={200} x2={890} y2={bx2.y} stroke={colors.MUTED} strokeWidth={1.4} />
                <rect x={890} y={bx2.y - 15} width={80} height={30} rx={5} fill={colors.PANEL} stroke={colors.MUTED} />
                {T({ x: 930, y: bx2.y + 5, text: bx2.t, fs: 14, anchor: 'middle', mono: true, k })}
                <line x1={970} y1={bx2.y} x2={1010} y2={200} stroke={colors.MUTED} strokeWidth={1.4} />
              </g>
            ))}
            <rect x={1010} y={185} width={150} height={30} rx={5} fill={colors.PANEL} stroke={colors.MUTED} />
            {T({ x: 1085, y: 205, text: 'which pair next?', fs: 14, anchor: 'middle' })}
            <Cross x0={744} y0={150} x1={1166} y1={254} u={flowX} w={3.5} />
          </g>
        )}
        {netU > 0.01 && b3Op > 0.01 && (
          <g opacity={b3Op}>
            {T({ x: 740, y: 318, text: 'a sorting network: wiring fixed before any data', fs: 15, op: clamp01(netU * 3) })}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1={760} y1={344 + i * 22} x2={lerp(760, 1180, clamp01(netU * 1.5))} y2={344 + i * 22} stroke={colors.GRID} strokeWidth={1.5} />
            ))}
            {NET8_RODS.map((r, k) => {
              const x = 800 + r.col * 18 + r.s * 34;
              const u = clamp01(netU * 1.6 - 0.4 - (r.s / 6) * 0.6);
              if (u <= 0) return null;
              const c = r.up ? HUE : colors.WARM;
              return (
                <g key={k} opacity={u}>
                  <line x1={x} y1={344 + r.i * 22} x2={x} y2={344 + r.j * 22} stroke={c} strokeWidth={2} />
                  <circle cx={x} cy={344 + r.i * 22} r={3.5} fill={c} />
                  <circle cx={x} cy={344 + r.j * 22} r={3.5} fill={c} />
                </g>
              );
            })}
            <g opacity={clamp01(netU * 2 - 1)}>
              <Check x={752} y={532} s={1} />
              {T({ x: 770, y: 538, text: `8 wires · ${NET8.length} stages · ${comparators(NET8)} comparators, the same for every input`, fs: 13, color: colors.MUTED })}
            </g>
            {Chip({ x: 740, y: 590, text: "the numbers ahead: measurements from Handwired's exploration notes", color: colors.WARM, op: stampU, fs: 14 })}
          </g>
        )}

        {/* ======================== B4 · the compare-exchange card ======================== */}
        {cardU > 0.01 && (
          <g opacity={cardU}>
            {T({ x: 690, y: 250, text: 'compare-exchange, keys only', fs: 14, color: colors.MUTED })}
            <MathLabel tex={'\\min = a - \\operatorname{relu}(a - b)'} x={690} y={290} fontSize={22} anchor="start" color={colors.TEXT} />
            <MathLabel tex={'\\max = b + \\operatorname{relu}(a - b)'} x={690} y={334} fontSize={22} anchor="start" color={colors.TEXT} />
            {Chip({ x: 690, y: 392, text: 'emitMinimum', color: HUE, mono: true })}
            {Chip({ x: 830, y: 392, text: 'emitMaximum', color: HUE, mono: true })}
            {T({ x: 690, y: 452, text: '4 operations · 3 layers', fs: 22, color: HUE })}
            {T({ x: 690, y: 482, text: 'three weighted sums and one relu', fs: 14, color: colors.MUTED })}
          </g>
        )}

        {/* ======================== towers ======================== */}
        <g opacity={towerOp}>
          {foldU > 0.01 && tower(TW.x, TW.w, bitN, HUE, { band: bandU, from: foldU < 0.999 ? 3 : 0, extra: extraU })}
          {cntN > 0.01 && tower(CT.x, CT.w, cntN, colors.SECONDARY, { hi: cntHi })}
          {/* B5 labels */}
          {T({ x: TW.x + TW.w + 14, y: topOf(bitN) + 5, text: `stage ${Math.max(1, Math.min(STAGES64, Math.ceil(bitN / 3 - 1e-6)))} of ${STAGES64}`, fs: 14, color: HUE, mono: true, op: stageLblU })}
          {predU > 0.01 && (
            <g opacity={predU}>
              <line x1={TW.x - 8} y1={topOf(PRED_LAYERS)} x2={TW.x + TW.w + 10} y2={topOf(PRED_LAYERS)} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 3" />
              <line x1={TW.x + TW.w + 10} y1={topOf(PRED_LAYERS)} x2={TW.x + TW.w + 10} y2={topOf(PRED_LAYERS) + 22} stroke={colors.MUTED} strokeWidth={1.2} />
            </g>
          )}
          {T({ x: TW.x + TW.w + 18, y: topOf(PRED_LAYERS) + 28, text: `${STAGES64} stages × 3 layers = ${PRED_LAYERS} · predicted`, fs: 14, color: colors.MUTED, op: predU })}
          {T({ x: TW.x + TW.w + 18, y: topOf(M.keys64.layers) - 10, text: `${M.keys64.layers} layers · measured`, fs: 16, color: colors.WARM, op: measU })}
          {T({ x: TW.x + TW.w + 18, y: topOf(M.keys64.layers) - 36, text: `${fmtN(M.keys64.ops)} operations · measured`, fs: 16, color: colors.WARM, op: measU })}
          {/* tops and lanes (B7 on) */}
          {T({ x: TW.x + TW.w / 2, y: topOf(bitN) - 10, text: `${Math.round(bitN)} layers`, fs: 15, color: HUE, anchor: 'middle', mono: true, op: topLblU })}
          {T({ x: CT.x + CT.w / 2, y: topOf(cntN) - 10, text: `${Math.round(cntN)} layers`, fs: 15, color: cntHi > 0.5 ? colors.POSITIVE : colors.SECONDARY, anchor: 'middle', mono: true, op: laneBU })}
          {T({ x: TW.x + TW.w / 2, y: 614, text: 'bitonic network', fs: 14, color: HUE, anchor: 'middle', op: clamp01(foldU * 2 - 1) })}
          {T({ x: CT.x + CT.w / 2, y: 614, text: 'ranks by counting', fs: 14, color: colors.SECONDARY, anchor: 'middle', op: laneBU })}
          {T({ x: CT.x + CT.w / 2, y: topOf(cntN) - 34, text: 'stays at 5', fs: 14, color: colors.POSITIVE, anchor: 'middle', op: cntHi })}
        </g>

        {/* ======================== condition chip + payload items ======================== */}
        {Chip({ x: BAR.x, y: COND_Y, text: COND[condIdx], color: colors.MUTED, op: condOp * (finalU > 0 ? 0.12 : 1), fs: 13 })}
        {payU > 0.01 && (
          <g>
            {T({ x: 720, y: 134, text: 'each item: a key, plus a payload that travels with it', fs: 14, color: colors.MUTED, op: clamp01(payU * 2) })}
            {[0, 1, 2, 3].map((k) => {
              const u = clamp01(payU * 4 - k);
              if (u <= 0) return null;
              const x = 740 + k * 120;
              return (
                <g key={k} opacity={u}>
                  <circle cx={x} cy={186} r={15} fill={colors.WARM} fillOpacity={0.18} stroke={colors.WARM} strokeWidth={1.8} />
                  {T({ x, y: 191, text: `${KEYS[k]}`, fs: 14, color: colors.WARM, anchor: 'middle', mono: true })}
                  <line x1={x + 15} y1={186} x2={x + 30} y2={186} stroke={colors.MUTED} strokeWidth={1.4} />
                  <Photo x={x + 46} y={186} w={30} h={24} tint={photoTint(KEYS[k])} />
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== bars: operations in all ======================== */}
        {barsOp > 0.01 && (
          <g opacity={barsOp * (finalU > 0 ? 0.12 : 1)}>
            {T({ x: BAR.x, y: BAR.ya - 10, text: condIdx === 0 ? 'bitonic network, keys only' : 'bitonic network', fs: 14, color: HUE })}
            <rect x={BAR.x} y={BAR.ya} width={Math.max(0, bx(barA) - BAR.x)} height={BAR.h} rx={3} fill={HUE} opacity={0.85} />
            {T({ x: bx(barA) + 10, y: BAR.ya + 20, text: fmtN(barA), fs: 16, color: colors.TEXT, mono: true, op: clamp01(barA / 200) })}
            {Chip({ x: bx(barA) + 18 + fmtN(barA).length * 9.6, y: BAR.ya + 20, text: 'less work', color: colors.POSITIVE, op: winA, fs: 13, fill: true })}
            {rowBOp > 0.01 && (
              <g opacity={rowBOp}>
                {T({ x: BAR.x, y: BAR.yb - 10, text: rowPhase < 0.5 ? `4 operations × ${COMPS64} comparators · arithmetic` : 'ranks by counting', fs: 14, color: rowPhase < 0.5 ? colors.MUTED : colors.SECONDARY })}
                <rect x={BAR.x} y={BAR.yb} width={Math.max(0, bx(barB) - BAR.x)} height={BAR.h} rx={3}
                  fill={rowPhase < 0.5 ? 'none' : colors.SECONDARY} fillOpacity={0.85} stroke={rowPhase < 0.5 ? colors.MUTED : 'none'} strokeWidth={1.5} strokeDasharray="5 4" />
                {T({ x: bx(barB) + 10, y: BAR.yb + 20, text: fmtN(barB), fs: 16, color: rowPhase < 0.5 ? colors.MUTED : colors.TEXT, mono: true, op: clamp01(barB / 200) })}
                {Chip({ x: bx(barB) + 18 + fmtN(barB).length * 9.6, y: BAR.yb + 20, text: 'less work', color: colors.POSITIVE, op: winB, fs: 13, fill: true })}
              </g>
            )}
            {/* the unexplained gap */}
            {gapU > 0.01 && (
              <g opacity={gapU}>
                <line x1={bx(M.keys64.ops)} y1={BAR.ya - 4} x2={bx(M.keys64.ops)} y2={BAR.yb + BAR.h + 4} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="3 3" />
                <line x1={bx(PRED_OPS)} y1={BAR.ya - 4} x2={bx(PRED_OPS)} y2={BAR.yb + BAR.h + 4} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="3 3" />
                <circle cx={(bx(M.keys64.ops) + bx(PRED_OPS)) / 2} cy={404} r={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                {T({ x: (bx(M.keys64.ops) + bx(PRED_OPS)) / 2, y: 409, text: '?', fs: 15, color: colors.WARM, anchor: 'middle', mono: true })}
                {T({ x: bx(PRED_OPS) - 22, y: 409, text: 'the notes do not explain the gap', fs: 14, color: colors.WARM, anchor: 'end' })}
              </g>
            )}
            {/* axis */}
            <line x1={BAR.x} y1={BAR.axisY} x2={BAR.x + BAR.len} y2={BAR.axisY} stroke={colors.GRID} strokeWidth={1.2} />
            {ticks.map((t) => (
              <g key={t}>
                <line x1={bx(t)} y1={BAR.axisY - 4} x2={bx(t)} y2={BAR.axisY + 4} stroke={colors.GRID} strokeWidth={1.2} />
                {T({ x: bx(t), y: BAR.axisY + 20, text: fmtN(t), fs: 13, color: colors.MUTED, anchor: 'middle', mono: true, k: t })}
              </g>
            ))}
            {T({ x: BAR.x + BAR.len, y: BAR.axisY + 44, text: 'operations in all', fs: 13, color: colors.MUTED, anchor: 'end' })}
          </g>
        )}

        {/* ======================== B8 · the counting grid → B11 · pair squares ======================== */}
        {gridOp > 0.01 && (
          <g opacity={gridOp}>
            {/* formula, headers, keys (B8 only) */}
            {formU > 0.01 && cellOp > 0.01 && (
              <g opacity={cellOp}>
                <MathLabel tex={'\\mathrm{rank}_i = \\sum_j \\big[\\, x_j < x_i \\;\\lor\\; (x_j = x_i \\land j < i) \\,\\big]'} x={990} y={132} fontSize={21} opacity={formU} color={colors.TEXT} />
              </g>
            )}
            {cellOp > 0.01 && gridU > 0.01 && (
              <g opacity={cellOp * gridU}>
                {KEYS.map((x, j) => T({ x: GX + j * GC + GC / 2, y: GY - 10, text: `${x}`, fs: 14, color: colors.WARM, anchor: 'middle', mono: true, k: `c${j}` }))}
                {KEYS.map((x, i) => {
                  const cy = GY + i * GC + GC / 2;
                  return (
                    <g key={`r${i}`}>
                      <circle cx={852} cy={cy} r={11} fill={colors.WARM} fillOpacity={0.18} stroke={colors.WARM} strokeWidth={1.4} />
                      {T({ x: 852, y: cy + 5, text: `${x}`, fs: 13, color: colors.WARM, anchor: 'middle', mono: true })}
                    </g>
                  );
                })}
                {T({ x: GX + 8 * GC + 22, y: GY - 10, text: 'rank', fs: 13, color: HUE })}
              </g>
            )}
            {/* the square: 8 × 8 compare bits, later a pair count */}
            <rect x={sqX} y={sqY} width={sqSide} height={sqSide} fill={HUE} fillOpacity={lerp(0.04, 0.22, sqMorph)} stroke={HUE}
              strokeOpacity={lerp(0.35, 0.9, sqMorph)} strokeWidth={1.4} opacity={gridU} />
            {cellOp > 0.01 && (
              <g opacity={cellOp}>
                {BITS.map((row, i) =>
                  row.map((bit, j) => {
                    const u = clamp01(bitsU - (i * 8 + j));
                    if (u <= 0) return null;
                    const x = GX + j * GC;
                    const y = GY + i * GC;
                    const isTie = i === TIE.i && j === TIE.j;
                    return (
                      <g key={`${i}-${j}`} opacity={u}>
                        <rect x={x + 2} y={y + 2} width={GC - 4} height={GC - 4} rx={3} fill={bit ? (isTie && tieU > 0.01 ? colors.WARM : HUE) : 'none'}
                          fillOpacity={bit ? 0.75 : 0} stroke={i === j ? 'none' : colors.GRID} />
                        {i === j && <line x1={x + 8} y1={y + GC - 8} x2={x + GC - 8} y2={y + 8} stroke={colors.GRID} strokeWidth={1.2} />}
                      </g>
                    );
                  }),
                )}
                {RANK.map((r, i) => T({ x: GX + 8 * GC + 22, y: GY + i * GC + GC / 2 + 5, text: `${r}`, fs: 15, color: HUE, mono: true, op: clamp01(sumsU * 8 - i), k: `s${i}` }))}
                {tieU > 0.01 && (
                  <g opacity={tieU}>
                    <rect x={GX + TIE.j * GC} y={GY + TIE.i * GC} width={GC} height={GC} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                    <rect x={GX + TIE.i * GC} y={GY + TIE.j * GC} width={GC} height={GC} rx={4} fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 3" />
                  </g>
                )}
                {T({ x: GX, y: 458, text: 'items 1 and 3 tie at 2: the earlier index counts as ahead', fs: 13, color: colors.WARM, op: tieU })}
                {/* rank slots, and the one-hot read */}
                <g opacity={clamp01(slideU * 4)}>
                  {T({ x: GX - 12, y: SLOT_Y + 20, text: 'slot', fs: 13, color: colors.MUTED, anchor: 'end' })}
                  {KEYS.map((_, r) => (
                    <g key={r}>
                      <rect x={GX + r * GC + 1} y={SLOT_Y} width={GC - 2} height={GC} rx={3} fill="none" stroke={colors.GRID} />
                      {T({ x: GX + r * GC + GC / 2, y: SLOT_Y + 46, text: `${r}`, fs: 13, color: colors.MUTED, anchor: 'middle', mono: true })}
                    </g>
                  ))}
                  {T({ x: GX, y: SLOT_Y + 74, text: 'a one-hot read fetches each payload into its rank', fs: 13, color: colors.MUTED, op: clamp01(slideU * 2 - 1) })}
                </g>
                {KEYS.map((x, i) => {
                  const u = clamp01(slideU * 1.4 - i * 0.05);
                  const from = { x: PHOTO_X, y: GY + i * GC + GC / 2 };
                  const to = { x: GX + RANK[i] * GC + GC / 2, y: SLOT_Y + GC / 2 };
                  return <Photo key={`p${i}`} x={lerp(from.x, to.x, u)} y={lerp(from.y, to.y, u) - Math.sin(Math.PI * u) * 30} w={24} h={19} tint={photoTint(x)} opacity={gridU} />;
                })}
              </g>
            )}
            {/* B11: the pair squares */}
            {sqMorph > 0.01 && (
              <g>
                {sq256U > 0.01 && (
                  <rect x={SQ.x} y={SQ.y - 256 * SQ.px} width={256 * SQ.px * sq256U} height={256 * SQ.px} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="6 5" opacity={sq256U} />
                )}
                {T({ x: SQ.x + 14, y: SQ.y - 256 * SQ.px + 28, text: `256 items: ${fmtN(PAIRS(256))} pairs (arithmetic)`, fs: 15, color: colors.NEGATIVE, op: sq256U })}
                {T({ x: SQ.x + 14, y: SQ.y - 256 * SQ.px + 52, text: 'the notes: n² starts to hurt around hundreds of items', fs: 13, color: colors.MUTED, op: sq256U })}
                <line x1={SQ.x + 16 * SQ.px} y1={SQ.y - 8} x2={SQ.x + 64 * SQ.px + 14} y2={SQ.y - 8} stroke={colors.MUTED} strokeWidth={1} opacity={sq16U * 0.8} />
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 4, text: `16 items: ${fmtN(PAIRS(16))} pairs`, fs: 15, op: sq16U })}
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 64 * SQ.px + 14, text: `64 items: ${fmtN(PAIRS(64))} pairs`, fs: 15, op: sq64U })}
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 26, text: `network: ${fmtN(COMPS16)} comparators`, fs: 13, color: colors.MUTED, op: sq16U })}
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 64 * SQ.px + 34, text: `network: ${fmtN(COMPS64)} comparators`, fs: 13, color: colors.MUTED, op: sq64U })}
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 64 * SQ.px - 58, text: 'item counts interfaces usually have:', fs: 14, color: colors.POSITIVE, op: uiNoteU })}
                {T({ x: SQ.x + 64 * SQ.px + 20, y: SQ.y - 64 * SQ.px - 36, text: 'counting is the better choice (notes)', fs: 14, color: colors.POSITIVE, op: uiNoteU })}
              </g>
            )}
          </g>
        )}

        {/* ======================== B12 · fp32 drift ======================== */}
        {driftOp > 0.01 && (
          <g opacity={driftOp}>
            {T({ x: 720, y: 160, text: 'fractional keys, in 32-bit floats', fs: 19 })}
            {T({ x: 720, y: 192, text: `computed here: a = 2.7, b = 0.1, min = a − relu(a − b)`, fs: 14, color: colors.MUTED, mono: false })}
            <line x1={nlx(NL.kMin) - 10} y1={NL.y} x2={lerp(nlx(NL.kMin) - 10, nlx(NL.kMax) + 10, lineU)} y2={NL.y} stroke={colors.MUTED} strokeWidth={1.5} />
            {Array.from({ length: NL.kMax - NL.kMin + 1 }, (_, i) => {
              const k = NL.kMin + i;
              const u = clamp01(lineU * (NL.kMax - NL.kMin + 1) - i);
              if (u <= 0) return null;
              return <line key={k} x1={nlx(k)} y1={NL.y - 7} x2={nlx(k)} y2={NL.y + 7} stroke={colors.MUTED} strokeWidth={1.2} opacity={u} />;
            })}
            {T({ x: nlx(NL.kMin) - 10, y: NL.y + 76, text: 'one tick = one fp32 step near 0.1 (2⁻²⁷)', fs: 13, color: colors.MUTED, op: lineU })}
            {bMarkU > 0.01 && (
              <g opacity={bMarkU}>
                <circle cx={nlx(0)} cy={NL.y} r={7 * (0.6 + 0.4 * bMarkU)} fill={colors.POSITIVE} />
                {T({ x: nlx(0), y: NL.y - 22, text: `b = ${DB_STR}`, fs: 14, color: colors.POSITIVE, anchor: 'middle', mono: true })}
              </g>
            )}
            {minMarkU > 0.01 && (
              <g opacity={minMarkU}>
                <circle cx={nlx(-DSTEPS)} cy={NL.y} r={7 * (0.6 + 0.4 * minMarkU)} fill={colors.NEGATIVE} />
                {T({ x: nlx(-DSTEPS), y: NL.y - 22, text: `min = ${DMIN_STR}`, fs: 14, color: colors.NEGATIVE, anchor: 'middle', mono: true })}
              </g>
            )}
            {gapNlU > 0.01 && (
              <g opacity={gapNlU}>
                <path d={`M ${nlx(-DSTEPS)} ${NL.y + 16} L ${nlx(-DSTEPS)} ${NL.y + 24} L ${nlx(0)} ${NL.y + 24} L ${nlx(0)} ${NL.y + 16}`} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                {T({ x: (nlx(-DSTEPS) + nlx(0)) / 2, y: NL.y + 46, text: `${DSTEPS} fp32 steps apart: not bit-equal to b`, fs: 14, color: colors.WARM, anchor: 'middle' })}
              </g>
            )}
            {measCardU > 0.01 && (
              <g opacity={measCardU}>
                <rect x={720} y={432} width={490} height={104} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                {T({ x: 738, y: 458, text: 'measured by Handwired · odd-even network · fractional keys', fs: 13, color: colors.MUTED })}
                {T({ x: 738, y: 490, text: '20–24% of outputs matched no input bit for bit', fs: 17 })}
                {T({ x: 738, y: 520, text: 'errors up to 6e-5', fs: 17, color: colors.WARM, mono: true })}
              </g>
            )}
            {T({ x: 720, y: 572, text: 'integer keys: exact', fs: 15, color: colors.POSITIVE, op: intU })}
          </g>
        )}

        {/* ======================== B13 · the verdict ======================== */}
        {finalU > 0.01 && (
          <g opacity={finalU}>
            <rect x={320} y={196} width={640} height={258} rx={14} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            {T({ x: 350, y: 236, text: 'the verdict, from the historical record', fs: 16, color: colors.MUTED })}
            {T({ x: 350, y: 258, text: "Handwired's exploration notes, measured", fs: 13, color: colors.MUTED })}
            <g opacity={stamp1}>
              <rect x={350} y={284} width={74} height={30} rx={6} fill={colors.POSITIVE} fillOpacity={0.16} stroke={colors.POSITIVE} strokeWidth={1.5} />
              {T({ x: 387, y: 305, text: 'holds', fs: 15, color: colors.POSITIVE, anchor: 'middle', weight: 600 })}
              {T({ x: 440, y: 306, text: 'at interface sizes, count ranks', fs: 21 })}
            </g>
            <g opacity={stamp2}>
              <rect x={350} y={352} width={74} height={30} rx={6} fill={colors.WARM} fillOpacity={0.16} stroke={colors.WARM} strokeWidth={1.5} />
              {T({ x: 387, y: 373, text: 'open', fs: 15, color: colors.WARM, anchor: 'middle', weight: 600 })}
              {T({ x: 440, y: 374, text: 'package a sorting network for apps', fs: 21 })}
              {T({ x: 440, y: 404, text: 'that sort well past 64 items?', fs: 21 })}
            </g>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={72} fill={colors.BG} opacity={0.9} />
      <text x={40} y={40} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        4 · What Handwired Pays
      </text>
    </>
  );
}

export const vizScene = () => scene;
