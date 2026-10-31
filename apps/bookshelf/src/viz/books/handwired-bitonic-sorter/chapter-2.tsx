// Building the Mountains
//
// Bitonic Sorter (Handwired labs) — chapter 2. Sources:
//   Wikipedia "Bitonic sorter" rev 1373262602 (wiki:LINE): 80-82 (sorters build the monotonic halves bottom-up),
//     138 (the stage count)
//   .orly-work/hw-books/bitonic-ref/bitonic.ts:59-89 (bitonicNetwork: the stage list depends only on n),
//     91-104 (applyStage, applyNetwork)
//   .orly-work/hw-books/bitonic-ref/report.txt §1 (n = 8: 6 stages, 24 comparators), §2 (the n = 8 stage list:
//     pairs, asc/desc), §2b (the n = 16 stage list, for the ghost), §3 (the worked trace from
//     [3, 7, 4, 8, 6, 2, 1, 5]), §5 (256 and 65,536 zero-one inputs, 0 not sorted), §5b (2,000 random arrays per
//     size, values 0..999, n = 2 to 64, 0 mismatches), §6 (the second input, [750, 653, 936, 503, 164, 498, 670,
//     702], the first random n = 8 array the report prints)
//   .orly-work/hw-books/inputs/bitonic-sorter.md "What the checks cover" (n = 32 and 64 only sampled)
//   chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 lab/ui-exploration/guide/sections/loops.md:185
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim), fact-checked by Haiku 5.5 (docs/book-plans/handwired-bitonic-sorter/review.md).
//
// Every disc, bar, table cell and swap on screen comes from a line-for-line local port of bitonic.ts run at module
// scope; the module throws if the trace ever disagrees with report.txt §3 or the stage list with §2. The zero-one
// counters are recomputed here too (all 256 lists at 8 wires, all 65,536 at 16). The random-array strip (§5b) is
// quoted from the report, not recomputed (its seeded generator is not ported). One change to the plan: beat 9's
// second input is the report's own first random n = 8 array instead of an invented one.
import 'katex/dist/katex.min.css';
import { interpolateRgb } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** 0 → 1 → 0 over [a, b] of u */
const bump = (u: number, a: number, b: number): number => {
  const v = (u - a) / Math.max(1e-6, b - a);
  return v <= 0 || v >= 1 ? 0 : Math.sin(Math.PI * v);
};
const smooth = (u: number): number => ease.move(clamp01(u));
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px

// ---------------------------------------------------------------------------
// The network and the traces (a local port of bitonic.ts, exclusive bound)
// ---------------------------------------------------------------------------

type Comparator = [i: number, j: number, ascending: boolean];

function bitonicNetwork(n: number): Comparator[][] {
  const stages: Comparator[][] = [];
  const place = (stage: number, c: Comparator) => {
    (stages[stage] ??= []).push(c);
  };
  const emitMerge = (low: number, count: number, direction: 0 | 1, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    for (let i = low; i < low + k; i++) place(start, [i, i + k, direction === 1]);
    emitMerge(low, k, direction, start + 1);
    return 1 + emitMerge(low + k, k, direction, start + 1);
  };
  const emitSort = (low: number, count: number, direction: 0 | 1, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    const half = emitSort(low, k, 1, start);
    emitSort(low + k, k, 0, start);
    return half + emitMerge(low, count, direction, start + half);
  };
  const depth = emitSort(0, n, 1, 0);
  const k = Math.log2(n);
  if (depth !== (k * (k + 1)) / 2 || stages.length !== depth) throw new Error(`bitonic ch2: stage count for n=${n}`);
  return stages;
}

/** applyStage, tracking which disc (by its input index) sits on each wire. */
function applyStage(a: number[], ids: number[], stage: Comparator[], swaps: boolean[]): void {
  for (const [i, j, asc] of stage) {
    const sw = asc ? a[i] > a[j] : a[i] < a[j];
    swaps.push(sw);
    if (sw) {
      [a[i], a[j]] = [a[j], a[i]];
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }
}

type Run = {
  input: number[];
  rows: number[][]; // rows[0] = input, rows[s + 1] = after stage s
  wireOf: number[][]; // wireOf[s][disc] = the wire disc sits on after s stages
  swaps: boolean[][]; // swaps[s][c] = comparator c of stage s traded its pair
  rank: number[]; // rank[disc] = 0..7 by value (the disc's colour)
  vmax: number;
};

const NET = bitonicNetwork(8);
const N_STAGES = NET.length; // 6
const N_COMPARATORS = NET.reduce((n, s) => n + s.length, 0); // 24

function trace(input: number[]): Run {
  const a = [...input];
  const ids = input.map((_, i) => i);
  const rows = [[...a]];
  const wireOf = [ids.map((_, d) => ids.indexOf(d))];
  const swaps: boolean[][] = [];
  for (const stage of NET) {
    const sw: boolean[] = [];
    applyStage(a, ids, stage, sw);
    swaps.push(sw);
    rows.push([...a]);
    wireOf.push(input.map((_, d) => ids.indexOf(d)));
  }
  const sorted = [...input].sort((x, y) => x - y);
  return { input, rows, wireOf, swaps, rank: input.map((v) => sorted.indexOf(v)), vmax: sorted[sorted.length - 1] };
}

const RUN_A = trace([3, 7, 4, 8, 6, 2, 1, 5]);
const RUN_B = trace([750, 653, 936, 503, 164, 498, 670, 702]);
const RUNS = [RUN_A, RUN_B];

// report.txt §3, verbatim; §2, verbatim.
const REPORT_TRACE = [
  [3, 7, 4, 8, 6, 2, 1, 5],
  [3, 7, 8, 4, 2, 6, 5, 1],
  [3, 4, 8, 7, 5, 6, 2, 1],
  [3, 4, 7, 8, 6, 5, 2, 1],
  [3, 4, 2, 1, 6, 5, 7, 8],
  [2, 1, 3, 4, 6, 5, 7, 8],
  [1, 2, 3, 4, 5, 6, 7, 8],
];
const STAGE_LINES = NET.map((st, s) => `stage ${s}: ${st.map(([i, j, asc]) => `(${i},${j} ${asc ? 'asc' : 'desc'})`).join(' ')}`);
const REPORT_STAGES = [
  'stage 0: (0,1 asc) (2,3 desc) (4,5 asc) (6,7 desc)',
  'stage 1: (0,2 asc) (1,3 asc) (4,6 desc) (5,7 desc)',
  'stage 2: (0,1 asc) (2,3 asc) (4,5 desc) (6,7 desc)',
  'stage 3: (0,4 asc) (1,5 asc) (2,6 asc) (3,7 asc)',
  'stage 4: (0,2 asc) (1,3 asc) (4,6 asc) (5,7 asc)',
  'stage 5: (0,1 asc) (2,3 asc) (4,5 asc) (6,7 asc)',
];
if (REPORT_TRACE.some((row, r) => row.join() !== RUN_A.rows[r].join())) throw new Error('bitonic ch2: trace disagrees with report §3');
if (REPORT_STAGES.some((l, s) => l !== STAGE_LINES[s])) throw new Error('bitonic ch2: stage list disagrees with report §2');
if (N_STAGES !== 6 || N_COMPARATORS !== 24) throw new Error('bitonic ch2: expected 6 stages and 24 comparators');
if (RUN_B.rows[6].join() !== [...RUN_B.input].sort((x, y) => x - y).join()) throw new Error('bitonic ch2: second input not sorted');
const SWAP_TOTAL = RUNS.map((r) => r.swaps.flat().filter(Boolean).length);

// The zero-one principle, exhaustively (report.txt §5): every 0/1 list through 8 and 16 wires.
function zeroOne(n: number): boolean[] {
  const net = bitonicNetwork(n);
  const out: boolean[] = [];
  const a = new Array<number>(n);
  for (let m = 0; m < 1 << n; m++) {
    for (let i = 0; i < n; i++) a[i] = (m >> i) & 1;
    for (const st of net) for (const [i, j, asc] of st) if (asc ? a[i] > a[j] : a[i] < a[j]) [a[i], a[j]] = [a[j], a[i]];
    let ok = true;
    for (let i = 1; i < n; i++) if (a[i - 1] > a[i]) ok = false;
    out.push(ok);
  }
  return out;
}
const ZERO8 = zeroOne(8);
const ZERO16_SORTED = zeroOne(16).filter(Boolean).length;
const ZERO8_SORTED = ZERO8.filter(Boolean).length;
if (ZERO8.length !== 256 || ZERO8_SORTED !== 256 || ZERO16_SORTED !== 65536) throw new Error('bitonic ch2: zero-one check failed');

// The n = 16 network for the ghost (report.txt §2b).
const NET16 = bitonicNetwork(16);

const fmtInt = (v: number): string => v.toLocaleString('en-US');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; 0..76 the title band)
// ---------------------------------------------------------------------------

const ASC = '#38bdf8'; // smaller value to the upper wire
const DESC = '#fb923c'; // smaller value to the lower wire
const valueColor = interpolateRgb('#64748b', colors.TEAL);
const rankColor = (rank: number): string => valueColor(rank / 7);

const WY = (i: number): number => 140 + i * 50; // wire i
const WX0 = 96;
const WX1 = 790;
const COL = [190, 300, 380, 510, 600, 680]; // stage columns, grouped by merge
const REST = [128, 245, 340, 445, 555, 640, 740]; // where the discs wait between stages
const DIST = NET.map((st) => st[0][1] - st[0][0]); // 1 2 1 4 2 1
const rodOff = (i: number, d: number): number => ((i % d) - (d - 1) / 2) * 12;
const DISC_R = 15;
const STAGE_LABEL_Y = 112;
const CHIP_Y = 524;

// right panel: the trace table, and the same list as bars
const CELL0 = 904;
const CELL_P = 42;
const CELL_W = 38;
const cellX = (j: number): number => CELL0 + j * CELL_P;
const ROW_Y = (r: number): number => 136 + r * 27;
const BAR_BASE = 566;
const BAR_H = 168;
const BAR_W = 28;
const barCx = (j: number): number => cellX(j) + CELL_W / 2;
const BRACKET_Y = 578;

// ghost n = 16 (beat 8): columns grouped 1 | 2 | 3 | 4
const G16_COL = (() => {
  const xs: number[] = [];
  let x = 884;
  [1, 2, 3, 4].forEach((len, m) => {
    if (m > 0) x += 40;
    for (let c = 0; c < len; c++) {
      xs.push(x);
      if (c < len - 1) x += 30;
    }
  });
  return xs;
})();
const G16_Y = (i: number): number => 128 + i * 22;

// verification board (beats 10 and 11)
const GRID = { x: 880, y: 120, pitch: 15, cell: 12 };
const N16_BAR = { x: 880, y: 404, w: 350, h: 14 };
const SIZES = [2, 4, 8, 16, 32, 64];

const CAM_START: CameraState = { x: 640, y: 350, k: 1.04 };
const CAM_S0: CameraState = { x: 380, y: 330, k: 1.22 };
const CAM_PROFILE: CameraState = { x: 1070, y: 470, k: 1.45 };
const CAM_S3: CameraState = { x: 470, y: 330, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 352, k: 0.97 };

const SOURCES = [
  'wiki:80-82 · report.txt §2',
  'report.txt §2 stage 0, §3',
  'report.txt §2 stages 1-2',
  'report.txt §3 after stage 2 · wiki:80-82',
  'report.txt §2 stage 3, §3',
  'report.txt §3 after stages 4-5',
  'report.txt §1 n = 8',
  'report.txt §2 · wiki:138',
  'bitonic.ts:59 · report.txt §2, §6',
  'report.txt §5',
  'report.txt §5b · research "What the checks cover"',
];

const CAPTIONS = [
  'A shuffled list is not a mountain, so build them from the bottom up. Any two numbers form a mountain already, and one comparator can set them to climb or to fall.',
  'Take three, seven, four, eight, six, two, one, five. Stage zero compares neighbors, and the second and fourth pairs run downhill. Out comes three, seven, eight, four, two, six, five, one.',
  'Now there are two mountains of four. Merge each with a half-cleaner, across a distance of two and then one. The first block sorts upward, the second downward.',
  'That gives three, four, seven, eight, then six, five, two, one. Sorted up beside sorted down is exactly a mountain, which is why the directions alternate. Two sorted runs became one bigger mountain.',
  'Stage three is the half-cleaner from before, across a distance of four. The four smallest values land on the left, three, four, two, one, and the four largest on the right.',
  'Two more stages finish it, at distance two and then one. After the sixth stage: one, two, three, four, five, six, seven, eight.',
  'Count the work. Six stages, each with four comparators on separate wires, so all four fire at the same moment. Twenty-four comparators, but only six steps in time.',
  'The distances tell the story: one, then two and one, then four, two and one. Each merge is one stage longer than the last, so eight numbers take one plus two plus three, six stages.',
  'Notice what the comparators never do: choose where to look. The wiring is the same for every input, and only the swaps depend on the values. That is what lets a fixed machine run it.',
  'Does it sort everything? We ran all two hundred fifty-six lists of zeros and ones through eight wires, and all sixty-five thousand five hundred thirty-six through sixteen. Every one came out sorted.',
  'Two thousand random lists per size, from two up to sixty-four wires, also matched the built-in sort. Thirty-two and sixty-four wires were sampled this way, not checked exhaustively.',
];
/** ~150 words per minute; a hyphenated number is two spoken words */
const speak = (text: string): number => {
  const words = text.split(/\s+/).length + (text.match(/-/g)?.length ?? 0);
  return Math.round((words / 2.5 + 0.4) * 10) / 10;
};

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);
  const src = tl.channel('src', 0);

  const netOp = tl.channel('netOp', 1); // the whole network whispers when the panel has the spotlight
  const panelOp = tl.channel('panelOp', 1); // trace table + bars
  const wiresU = tl.channel('wiresU', 0);
  const discsU = tl.channel('discsU', 0);
  const discOp = tl.channel('discOp', 1);
  const which = tl.channel('which', 0); // 0: the worked input · 1: the second input
  const run = tl.channel('run', 0); // 0..6 stages applied (worked input)
  const runB = tl.channel('runB', 0); // 0..6 stages applied (second input)
  const rodsU = tl.channel('rodsU', 0); // stage columns drawn, 0..6
  const legendU = tl.channel('legendU', 0);
  const chips = Array.from({ length: N_STAGES }, (_, s) => tl.channel(`chip${s}`, 0));
  const tableU = tl.channel('tableU', 0);
  const barsU = tl.channel('barsU', 0);
  const block2U = tl.channel('block2U', 0);
  const block4U = tl.channel('block4U', 0);
  const block8U = tl.channel('block8U', 0);
  const outlineU = tl.channel('outlineU', 0);
  const upU = tl.channel('upU', 0);
  const downU = tl.channel('downU', 0);
  const m8U = tl.channel('m8U', 0);
  const bracesU = tl.channel('bracesU', 0);
  const sortedU = tl.channel('sortedU', 0);
  const sweepU = tl.channel('sweepU', -1);
  const countU = tl.channel('countU', 0);
  const totalU = tl.channel('totalU', 0);
  const stepsU = tl.channel('stepsU', 0);
  const distU = tl.channel('distU', 0);
  const mergeU = [1, 2, 3].map((m) => tl.channel(`merge${m}U`, 0));
  const sumU = tl.channel('sumU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const ghostSumU = tl.channel('ghostSumU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const swapsU = tl.channel('swapsU', 0);
  const boardU = tl.channel('boardU', 0);
  const zeroU = tl.channel('zeroU', 0); // 0..256 lists checked at 8 wires
  const n16U = tl.channel('n16U', 0); // 0..1 of the 65,536 at 16 wires
  const stripU = tl.channel('stripU', 0);
  const sizesU = tl.channel('sizesU', 0); // 0..6 chips
  const sampledU = tl.channel('sampledU', 0);

  let t = 0.4;
  const beat = (i: number): [number, number] => {
    const at = t;
    const dur = speak(CAPTIONS[i]);
    tl.caption({ at, dur, text: CAPTIONS[i] });
    tl.set(src, i, Math.max(0, at - 0.1));
    t = tl.hold(at + dur, 0.7);
    return [at, dur];
  };

  // — B0 · bare wires, eight discs; any pair is already a mountain —
  {
    const [b] = beat(0);
    tl.tween(wiresU, 1, { at: b + 0.1, dur: 1.2, ease: ease.draw });
    tl.tween(discsU, 1, { at: b + 0.8, dur: 1.2, ease: ease.linear });
    tl.tween(tableU, 1, { at: b + 1.6, dur: 0.7, ease: ease.enter });
    tl.tween(barsU, 1, { at: b + 2.2, dur: 0.9, ease: ease.enter });
    tl.tween(block2U, 1, { at: b + 5.0, dur: 0.7, ease: ease.enter });
    tl.tween(legendU, 1, { at: b + 8.6, dur: 0.7, ease: ease.enter });
  }
  // — B1 · stage 0: neighbours, the second and fourth pairs downhill —
  {
    const [b, d] = beat(1);
    tl.tween(cam, CAM_S0, { at: b, dur: 1.4, ease: ease.move });
    tl.tween(panelOp, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(rodsU, 1, { at: b + 0.8, dur: 1.0, ease: ease.draw });
    tl.tween(chips[0], 1, { at: b + 1.6, dur: 0.6, ease: ease.enter });
    tl.tween(run, 1, { at: b + 4.6, dur: 3.0, ease: ease.linear });
    tl.tween(cam, CAMERA_HOME, { at: b + d - 2.6, dur: 1.4, ease: ease.move });
    tl.tween(panelOp, 1, { at: b + d - 2.2, dur: 0.8, ease: ease.move });
  }
  // — B2 · two mountains of four, merged at distance 2 then 1 —
  {
    const [b] = beat(2);
    tl.tween(chips[0], 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(block2U, 0, { at: b + 0.2, dur: 0.5, ease: ease.move });
    tl.tween(block4U, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
    tl.tween(rodsU, 3, { at: b + 1.6, dur: 1.6, ease: ease.draw });
    tl.tween(chips[1], 1, { at: b + 1.8, dur: 0.6, ease: ease.enter });
    tl.tween(chips[2], 1, { at: b + 2.6, dur: 0.6, ease: ease.enter });
    tl.tween(run, 3, { at: b + 4.4, dur: 5.0, ease: ease.linear });
  }
  // — B3 · sorted up beside sorted down is a mountain —
  {
    const [b] = beat(3);
    tl.tween(netOp, 0.12, { at: b, dur: 0.4, ease: ease.move });
    tl.tween(tableU, 0, { at: b, dur: 0.4, ease: ease.move }); // the push would cut it at the top edge
    tl.tween(cam, CAM_PROFILE, { at: b + 0.3, dur: 1.4, ease: ease.move });
    chips.slice(1, 3).forEach((c) => tl.tween(c, 0, { at: b, dur: 0.5, ease: ease.move }));
    tl.tween(upU, 1, { at: b + 1.6, dur: 0.7, ease: ease.enter });
    tl.tween(downU, 1, { at: b + 3.2, dur: 0.7, ease: ease.enter });
    tl.tween(outlineU, 1, { at: b + 5.2, dur: 1.5, ease: ease.draw });
    tl.tween(block4U, 0, { at: b + 8.6, dur: 0.6, ease: ease.move });
    tl.tween(block8U, 1, { at: b + 8.8, dur: 0.7, ease: ease.enter });
    tl.tween(m8U, 1, { at: b + 9.2, dur: 0.7, ease: ease.pop });
  }
  // — B4 · stage 3, the half-cleaner across a distance of four —
  {
    const [b] = beat(4);
    tl.tween(cam, CAM_S3, { at: b, dur: 1.4, ease: ease.move });
    tl.tween(panelOp, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(netOp, 1, { at: b + 1.2, dur: 0.6, ease: ease.move }); // once the camera has brought the wires back
    tl.tween(outlineU, 0, { at: b + 0.6, dur: 0.4, ease: ease.move });
    tl.tween(upU, 0, { at: b + 0.6, dur: 0.4, ease: ease.move });
    tl.tween(downU, 0, { at: b + 0.6, dur: 0.4, ease: ease.move });
    tl.tween(m8U, 0, { at: b + 0.6, dur: 0.4, ease: ease.move });
    tl.tween(rodsU, 4, { at: b + 1.0, dur: 1.0, ease: ease.draw });
    tl.tween(chips[3], 1, { at: b + 1.6, dur: 0.6, ease: ease.enter });
    tl.tween(run, 4, { at: b + 3.6, dur: 3.0, ease: ease.linear });
    tl.tween(bracesU, 1, { at: b + 7.0, dur: 0.8, ease: ease.enter });
  }
  // — B5 · distance 2, then 1: sorted —
  {
    const [b, d] = beat(5);
    tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.3, ease: ease.move });
    tl.tween(bracesU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(chips[3], 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(panelOp, 1, { at: b + 0.4, dur: 0.8, ease: ease.move });
    tl.tween(tableU, 1, { at: b + 0.4, dur: 0.8, ease: ease.move });
    tl.tween(rodsU, 6, { at: b + 0.6, dur: 1.2, ease: ease.draw });
    tl.tween(chips[4], 1, { at: b + 0.9, dur: 0.6, ease: ease.enter });
    tl.tween(chips[5], 1, { at: b + 1.5, dur: 0.6, ease: ease.enter });
    tl.tween(run, 6, { at: b + 2.2, dur: 4.6, ease: ease.linear });
    tl.tween(sortedU, 1, { at: b + d - 2.0, dur: 0.6, ease: ease.pop });
  }
  // — B6 · count the work: 6 stages × 4 comparators —
  {
    const [b] = beat(6);
    tl.tween(cam, CAM_WIDE, { at: b, dur: 1.4, ease: ease.move });
    chips.slice(4).forEach((c) => tl.tween(c, 0, { at: b, dur: 0.5, ease: ease.move }));
    tl.tween(panelOp, 0.12, { at: b + 0.2, dur: 0.8, ease: ease.move });
    tl.tween(block8U, 0, { at: b + 0.2, dur: 0.6, ease: ease.move });
    tl.tween(countU, 1, { at: b + 1.0, dur: 0.7, ease: ease.enter });
    tl.tween(sweepU, N_STAGES, { at: b + 1.6, dur: 4.8, ease: ease.linear });
    tl.tween(totalU, 1, { at: b + 6.4, dur: 0.7, ease: ease.pop });
    tl.tween(stepsU, 1, { at: b + 8.4, dur: 0.7, ease: ease.enter });
  }
  // — B7 · the distances: 1 | 2 1 | 4 2 1, and the n = 16 ghost —
  {
    const [b] = beat(7);
    tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.3, ease: ease.move });
    tl.tween(panelOp, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(countU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(totalU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(stepsU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(distU, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
    tl.tween(mergeU[0], 1, { at: b + 1.2, dur: 0.6, ease: ease.enter });
    tl.tween(mergeU[1], 1, { at: b + 2.4, dur: 0.6, ease: ease.enter });
    tl.tween(mergeU[2], 1, { at: b + 3.8, dur: 0.6, ease: ease.enter });
    tl.tween(sumU, 1, { at: b + 9.6, dur: 0.7, ease: ease.enter });
    tl.tween(ghostU, 1, { at: b + 10.8, dur: 1.2, ease: ease.draw });
    tl.tween(ghostSumU, 1, { at: b + 11.8, dur: 0.7, ease: ease.enter });
  }
  // — B8 · the same 24 rods, another input: only the swaps change —
  {
    const [b] = beat(8);
    tl.tween(ghostU, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(ghostSumU, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(sumU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(distU, 0, { at: b, dur: 0.5, ease: ease.move });
    mergeU.forEach((m) => tl.tween(m, 0, { at: b, dur: 0.5, ease: ease.move }));
    tl.tween(discOp, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(sortedU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.set(which, 1, b + 0.6);
    tl.tween(discOp, 1, { at: b + 0.7, dur: 0.6, ease: ease.enter });
    tl.tween(panelOp, 1, { at: b + 0.7, dur: 0.8, ease: ease.move });
    tl.tween(fixedU, 1, { at: b + 1.6, dur: 0.7, ease: ease.enter });
    tl.tween(runB, N_STAGES, { at: b + 2.4, dur: 8.0, ease: ease.linear });
    tl.tween(swapsU, 1, { at: b + 10.8, dur: 0.7, ease: ease.enter });
  }
  // — B9 · every zero-one list through 8 and 16 wires —
  {
    const [b] = beat(9);
    tl.tween(panelOp, 0, { at: b, dur: 0.6, ease: ease.move });
    tl.tween(fixedU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(swapsU, 0, { at: b, dur: 0.5, ease: ease.move });
    tl.tween(netOp, 0.12, { at: b + 0.2, dur: 0.8, ease: ease.move });
    tl.tween(cam, CAM_WIDE, { at: b, dur: 1.4, ease: ease.move });
    tl.tween(boardU, 1, { at: b + 0.7, dur: 0.7, ease: ease.enter });
    tl.tween(zeroU, 256, { at: b + 1.8, dur: 4.2, ease: ease.linear });
    tl.tween(n16U, 1, { at: b + 6.8, dur: 3.6, ease: ease.linear });
  }
  // — B10 · 2,000 random lists per size; 32 and 64 only sampled —
  {
    const [b] = beat(10);
    tl.tween(stripU, 1, { at: b + 0.3, dur: 0.7, ease: ease.enter });
    tl.tween(sizesU, SIZES.length, { at: b + 1.4, dur: 2.4, ease: ease.linear });
    tl.tween(sampledU, 1, { at: b + 6.4, dur: 0.7, ease: ease.pop });
  }
  tl.hold(t, 1.2);

  return {
    tl, cam, src, netOp, panelOp, wiresU, discsU, discOp, which, run, runB, rodsU, legendU, chips, tableU, barsU,
    block2U, block4U, block8U, outlineU, upU, downU, m8U, bracesU, sortedU, sweepU, countU, totalU, stepsU,
    distU, mergeU, sumU, ghostU, ghostSumU, fixedU, swapsU, boardU, zeroU, n16U, stripU, sizesU, sampledU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

/** A comparator rod: dots on both wires, an arrowhead on the wire that receives the larger value. */
function Rod({ x, i, j, asc, opacity, glow }: { x: number; i: number; j: number; asc: boolean; opacity: number; glow: number }) {
  if (opacity <= 0.005) return null;
  const c = asc ? ASC : DESC;
  const y0 = WY(i);
  const y1 = WY(j);
  const tip = asc ? y1 : y0;
  const dir = asc ? 1 : -1;
  const head = tip - dir * (DISC_R + 2);
  return (
    <g opacity={opacity}>
      {glow > 0.01 && <line x1={x} y1={y0} x2={x} y2={y1} stroke={c} strokeWidth={9} strokeOpacity={0.28 * glow} strokeLinecap="round" />}
      <line x1={x} y1={y0} x2={x} y2={y1} stroke={c} strokeWidth={2.4 + 1.2 * glow} />
      <circle cx={x} cy={asc ? y0 : y1} r={4.5} fill={c} />
      <polygon points={`${x - 6},${head - dir * 9} ${x + 6},${head - dir * 9} ${x},${head}`} fill={c} />
      <circle cx={x} cy={tip} r={4.5} fill={c} />
    </g>
  );
}

function Disc({ x, y, value, rank, scale = 1, opacity = 1 }: { x: number; y: number; value: number; rank: number; scale?: number; opacity?: number }) {
  if (opacity <= 0.005 || scale <= 0.01) return null;
  const big = value >= 100;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={DISC_R * scale} fill={colors.PANEL} stroke={rankColor(rank)} strokeWidth={2.6} />
      <text x={x} y={y + (big ? 4.3 : 5)} textAnchor="middle" fill={colors.TEXT} fontSize={big ? 12 : 14} fontFamily={MONO} fontWeight={600}>
        {value}
      </text>
    </g>
  );
}

function Bracket({ x0, x1, y, color, label, opacity }: { x0: number; x1: number; y: number; color: string; label?: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <path d={`M ${x0} ${y - 6} V ${y} H ${x1} V ${y - 6}`} fill="none" stroke={color} strokeWidth={1.6} />
      {label && (
        <text x={(x0 + x1) / 2} y={y + 18} textAnchor="middle" fill={color} fontSize={13} fontFamily={UI}>
          {label}
        </text>
      )}
    </g>
  );
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? CH13 : fs * 0.56) + 20;
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

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** Where each disc is at progress p (0..6 stages): x along the wire, y between its two wires. */
function discPositions(R: Run, p: number): { x: number; y: number; wire: number }[] {
  const s = Math.min(N_STAGES - 1, Math.max(0, Math.floor(p)));
  const f = p >= N_STAGES ? 1 : clamp01(p - s);
  return R.input.map((_, d) => {
    if (p <= 0) return { x: REST[0], y: WY(R.wireOf[0][d]), wire: R.wireOf[0][d] };
    if (p >= N_STAGES) return { x: REST[N_STAGES], y: WY(R.wireOf[N_STAGES][d]), wire: R.wireOf[N_STAGES][d] };
    const from = R.wireOf[s][d];
    const to = R.wireOf[s + 1][d];
    const dd = DIST[s];
    const lowWire = from % (2 * dd) < dd ? from : from - dd; // the upper wire of this disc's comparator
    const cx = COL[s] + rodOff(lowWire, dd);
    const sw = smooth((f - 0.3) / 0.4);
    let x: number;
    if (f < 0.3) x = lerp(REST[s], cx, smooth(f / 0.3));
    else if (f < 0.7) x = cx;
    else x = lerp(cx, REST[s + 1], smooth((f - 0.7) / 0.3));
    // two trading discs pass beside each other instead of through each other
    if (from !== to) x += (to > from ? -1 : 1) * 17 * Math.sin(Math.PI * sw);
    return { x, y: lerp(WY(from), WY(to), sw), wire: sw < 0.5 ? from : to };
  });
}

/** The value on wire j at progress p, for the bars: each bar slides with its disc. */
function barSlots(R: Run, p: number): number[] {
  const s = Math.min(N_STAGES - 1, Math.max(0, Math.floor(p)));
  const f = p >= N_STAGES ? 1 : clamp01(p - s);
  return R.input.map((_, d) => {
    if (p <= 0) return R.wireOf[0][d];
    if (p >= N_STAGES) return R.wireOf[N_STAGES][d];
    return lerp(R.wireOf[s][d], R.wireOf[s + 1][d], smooth((f - 0.3) / 0.4));
  });
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(s.get(scene.src))));
  const netOp = s.get(scene.netOp);
  const panelOp = s.get(scene.panelOp);
  const wiresU = s.get(scene.wiresU);
  const discsU = s.get(scene.discsU);
  const discOp = s.get(scene.discOp);
  const w = Math.round(s.get(scene.which));
  const R = RUNS[w];
  const p = w === 0 ? s.get(scene.run) : s.get(scene.runB);
  const rodsU = s.get(scene.rodsU);
  const chips = scene.chips.map((c) => s.get(c));
  const legendU = s.get(scene.legendU);
  const tableU = s.get(scene.tableU);
  const barsU = s.get(scene.barsU);
  const block2U = s.get(scene.block2U);
  const block4U = s.get(scene.block4U);
  const block8U = s.get(scene.block8U);
  const outlineU = s.get(scene.outlineU);
  const upU = s.get(scene.upU);
  const downU = s.get(scene.downU);
  const m8U = s.get(scene.m8U);
  const bracesU = s.get(scene.bracesU);
  const sortedU = s.get(scene.sortedU);
  const sweepU = s.get(scene.sweepU);
  const countU = s.get(scene.countU);
  const totalU = s.get(scene.totalU);
  const stepsU = s.get(scene.stepsU);
  const distU = s.get(scene.distU);
  const mergeU = scene.mergeU.map((m) => s.get(m));
  const sumU = s.get(scene.sumU);
  const ghostU = s.get(scene.ghostU);
  const ghostSumU = s.get(scene.ghostSumU);
  const fixedU = s.get(scene.fixedU);
  const swapsU = s.get(scene.swapsU);
  const boardU = s.get(scene.boardU);
  const zeroU = s.get(scene.zeroU);
  const n16U = s.get(scene.n16U);
  const stripU = s.get(scene.stripU);
  const sizesU = s.get(scene.sizesU);
  const sampledU = s.get(scene.sampledU);

  const pos = discPositions(R, p);
  const slots = barSlots(R, p);
  const stageNow = Math.min(N_STAGES - 1, Math.max(0, Math.floor(p)));
  const fNow = p >= N_STAGES || p <= 0 ? -1 : p - stageNow;
  const lastRow = Math.max(0, Math.min(N_STAGES, Math.floor(p + 0.3)));

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the network ======================== */}
        <g opacity={netOp}>
          {/* wires */}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} opacity={clamp01(wiresU * 8 - i * 0.6)}>
              <line x1={WX0} y1={WY(i)} x2={lerp(WX0, WX1, wiresU)} y2={WY(i)} stroke={colors.MUTED} strokeOpacity={0.55} strokeWidth={1.5} />
              <text x={WX0 - 16} y={WY(i) + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                {i}
              </text>
            </g>
          ))}
          {wiresU > 0.5 && (
            <text x={WX0 - 16} y={WY(0) - 26} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(wiresU * 2 - 1)}>
              wire
            </text>
          )}

          {/* comparator rods, one column per stage */}
          {NET.map((st, si) => {
            const u = clamp01(rodsU - si);
            if (u <= 0.005) return null;
            const firing = si === stageNow && fNow >= 0 ? bump(fNow, 0.15, 0.85) : 0;
            const sweep = sweepU >= 0 ? bump(sweepU - si, 0, 1) : 0;
            return (
              <g key={si}>
                <text x={COL[si]} y={STAGE_LABEL_Y} textAnchor="middle" fill={sweep > 0.05 ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={MONO} opacity={u}>
                  stage {si}
                </text>
                {st.map(([i, j, asc], c) => {
                  const traded = R.swaps[si][c];
                  // while a stage fires, a rod that traded its pair glows; one that did not stays quiet
                  const glow = Math.max(firing * (traded ? 1 : 0.25), sweep);
                  const dim = w === 1 && firing > 0 && !traded ? 0.55 : 1;
                  return <Rod key={c} x={COL[si] + rodOff(i, DIST[si])} i={i} j={j} asc={asc} opacity={u * dim} glow={glow} />;
                })}
              </g>
            );
          })}

          {/* discs */}
          {R.input.map((v, d) => {
            const k = R.wireOf[0][d];
            const enter = clamp01(discsU * 9 - k);
            return <Disc key={`${w}-${d}`} x={pos[d].x} y={pos[d].y} value={v} rank={R.rank[d]} scale={ease.pop(enter)} opacity={discOp * clamp01(enter * 2)} />;
          })}

          {/* the stage's pair list, verbatim from the report */}
          {chips.map((u, si) =>
            u > 0.005 ? (
              <text key={si} x={WX0 - 10} y={CHIP_Y + (si === 2 || si === 5 ? 24 : 0)} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={u}>
                {STAGE_LINES[si]}
              </text>
            ) : null,
          )}

          {/* B4: the half-cleaner's two halves */}
          {bracesU > 0.01 && (
            <g opacity={bracesU}>
              {[
                { a: 0, b: 3, text: 'the four smallest: 3, 4, 2, 1', c: ASC },
                { a: 4, b: 7, text: 'the four largest: 6, 5, 7, 8', c: colors.TEAL },
              ].map((h) => (
                <g key={h.a}>
                  <path d={`M ${REST[4] + 26} ${WY(h.a) - 12} h 8 V ${WY(h.b) + 12} h -8`} fill="none" stroke={h.c} strokeWidth={1.8} />
                  <text x={REST[4] + 44} y={(WY(h.a) + WY(h.b)) / 2 + 5} fill={h.c} fontSize={15} fontFamily={UI}>
                    {h.text}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* B6: four comparators per column, all firing together */}
          {countU > 0.01 && (
            <g opacity={countU}>
              {COL.map((x, si) => (
                <text key={si} x={x} y={CHIP_Y} textAnchor="middle" fill={sweepU >= si ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO}>
                  ×4
                </text>
              ))}
            </g>
          )}
          {totalU > 0.01 && (
            <text x={WX0 - 10} y={568} fill={colors.TEXT} fontSize={17} fontFamily={UI} opacity={totalU}>
              {`${N_STAGES} stages × 4 comparators = ${N_COMPARATORS}`}
            </text>
          )}
          {stepsU > 0.01 && (
            <text x={WX0 - 10} y={596} fill={colors.TEAL} fontSize={15} fontFamily={UI} opacity={stepsU}>
              {`but only ${N_STAGES} steps in time: each column fires at once`}
            </text>
          )}

          {/* B7: the distance ribbon, grouped by merge */}
          {distU > 0.01 && (
            <g opacity={distU}>
              {COL.map((x, si) => (
                <text key={si} x={x} y={CHIP_Y} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                  {DIST[si]}
                </text>
              ))}
              <text x={WX0 - 10} y={CHIP_Y} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                distance
              </text>
            </g>
          )}
          {[
            { a: 0, b: 0, label: 'merge 2 · 1 stage' },
            { a: 1, b: 2, label: 'merge 4 · 2 stages' },
            { a: 3, b: 5, label: 'merge 8 · 3 stages' },
          ].map((m, k) => (
            <Bracket key={k} x0={COL[m.a] - 34} x1={COL[m.b] + 34} y={CHIP_Y + 18} color={colors.TEAL} label={m.label} opacity={mergeU[k]} />
          ))}
          <MathLabel tex={'1 + 2 + 3 = 6 \\text{ stages}'} x={WX0 - 10} y={590} fontSize={22} anchor="start" opacity={sumU} />

          {/* B8: the wiring is fixed */}
          {fixedU > 0.01 && (
            <text x={WX0 - 10} y={CHIP_Y + 4} fill={colors.TEXT} fontSize={16} fontFamily={UI} opacity={fixedU}>
              same 24 comparators in the same places · only the swaps change
            </text>
          )}
          {swapsU > 0.01 && (
            <g opacity={swapsU}>
              <text x={WX0 - 10} y={CHIP_Y + 34} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                {`[${RUN_A.input.join(', ')}]: ${SWAP_TOTAL[0]} of ${N_COMPARATORS} swapped`}
              </text>
              <text x={WX0 - 10} y={CHIP_Y + 58} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                {`[${RUN_B.input.join(', ')}]: ${SWAP_TOTAL[1]} of ${N_COMPARATORS} swapped`}
              </text>
            </g>
          )}
        </g>

        {/* ======================== right panel: the trace table and the bars ======================== */}
        {panelOp > 0.005 && (
          <g opacity={panelOp}>
            {tableU > 0.01 && (
              <g opacity={tableU}>
                <text x={CELL0 - 12} y={ROW_Y(0) - 26} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  wire
                </text>
                {Array.from({ length: 8 }, (_, j) => (
                  <text key={j} x={cellX(j) + CELL_W / 2} y={ROW_Y(0) - 26} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {j}
                  </text>
                ))}
                {R.rows.map((row, r) => {
                  const u = r === 0 ? 1 : clamp01((p - (r - 1) - 0.7) / 0.3);
                  if (u <= 0.005) return null;
                  const done = r === N_STAGES ? (w === 0 ? sortedU : clamp01(p - N_STAGES + 1)) : 0;
                  const live = r === lastRow;
                  return (
                    <g key={`${w}-${r}`} opacity={u}>
                      <text x={CELL0 - 12} y={ROW_Y(r)} textAnchor="end" fill={live ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={MONO}>
                        {r === 0 ? 'input' : `stage ${r - 1}`}
                      </text>
                      {row.map((v, j) => {
                        const changed = r > 0 && R.rows[r - 1][j] !== v;
                        return (
                          <g key={j}>
                            <rect x={cellX(j)} y={ROW_Y(r) - 17} width={CELL_W} height={23} rx={4} fill={colors.PANEL}
                              stroke={done > 0.01 ? colors.POSITIVE : live ? colors.GRID : 'none'} strokeWidth={1 + done} />
                            <text x={cellX(j) + CELL_W / 2} y={ROW_Y(r)} textAnchor="middle" fill={changed ? colors.TEAL : colors.TEXT}
                              fontSize={v >= 100 ? 12 : 13} fontFamily={MONO} fontWeight={changed ? 700 : 400}>
                              {v}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
                {done8(w, sortedU) > 0.01 && (
                  <text x={cellX(7) + CELL_W} y={ROW_Y(N_STAGES) + 26} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={UI} opacity={done8(w, sortedU)}>
                    sorted ascending
                  </text>
                )}
              </g>
            )}

            {/* the same list, as bars: each bar rides with its disc */}
            {barsU > 0.01 && (
              <g opacity={barsU}>
                <text x={CELL0} y={352} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={1 - m8U}>
                  the same list as bars
                </text>
                <line x1={cellX(0) - 4} y1={BAR_BASE} x2={cellX(7) + CELL_W + 4} y2={BAR_BASE} stroke={colors.MUTED} strokeOpacity={0.5} />
                {R.input.map((v, d) => {
                  const h = (v / R.vmax) * BAR_H * clamp01(barsU * 1.4);
                  const cx = lerp(barCx(0), barCx(7), slots[d] / 7);
                  return (
                    <rect key={`${w}-${d}`} x={cx - BAR_W / 2} y={BAR_BASE - h} width={BAR_W} height={h} rx={3}
                      fill={rankColor(R.rank[d])} fillOpacity={0.85} stroke={sortedU > 0.01 && w === 0 ? colors.POSITIVE : 'none'} strokeWidth={1.5 * sortedU} />
                  );
                })}
                {/* B3: the mountain outline over the bar tops */}
                {outlineU > 0.01 && (() => {
                  const row = RUN_A.rows[3];
                  const pts = row.map((v, j) => [barCx(j), BAR_BASE - (v / RUN_A.vmax) * BAR_H - 8] as const);
                  const n = outlineU * (pts.length - 1);
                  const k = Math.floor(n);
                  const drawn = pts.slice(0, k + 1).map(([x, y]) => `${x},${y}`);
                  if (k < pts.length - 1) {
                    const [ax, ay] = pts[k];
                    const [bx, by] = pts[k + 1];
                    drawn.push(`${lerp(ax, bx, n - k)},${lerp(ay, by, n - k)}`);
                  }
                  return <polyline points={drawn.join(' ')} fill="none" stroke={colors.WARM} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />;
                })()}
                {upU > 0.01 && (
                  <text x={(barCx(0) + barCx(3)) / 2} y={384} textAnchor="middle" fill={ASC} fontSize={14} fontFamily={UI} opacity={upU}>
                    sorted up ↗
                  </text>
                )}
                {downU > 0.01 && (
                  <text x={(barCx(4) + barCx(7)) / 2} y={384} textAnchor="middle" fill={DESC} fontSize={14} fontFamily={UI} opacity={downU}>
                    sorted down ↘
                  </text>
                )}
                {m8U > 0.01 && (
                  <text x={(barCx(0) + barCx(7)) / 2} y={350} textAnchor="middle" fill={colors.WARM} fontSize={17} fontFamily={UI} opacity={m8U}>
                    together: one mountain of 8
                  </text>
                )}
                {/* block brackets: sizes 2, 4, 8 */}
                {[
                  { m: 2, u: block2U, doneAt: 1 },
                  { m: 4, u: block4U, doneAt: 3 },
                  { m: 8, u: block8U, doneAt: 6 },
                ].map(({ m, u, doneAt }) =>
                  Array.from({ length: 8 / m }, (_, b) => {
                    const dirAsc = m === 8 || b % 2 === 0;
                    const sorted = w === 0 && p >= doneAt - 0.05;
                    return (
                      <Bracket key={`${m}-${b}`} x0={cellX(b * m) + 2} x1={cellX(b * m + m - 1) + CELL_W - 2} y={BRACKET_Y}
                        color={sorted ? (dirAsc ? ASC : DESC) : colors.MUTED}
                        label={m === 2 ? (sorted ? (dirAsc ? 'up' : 'down') : 'pair') : `${m} ${sorted ? (dirAsc ? 'up' : 'down') : ''}`.trim()}
                        opacity={u} />
                    );
                  }),
                )}
                {Math.max(block2U, block4U, block8U) > 0.01 && (
                  <text x={CELL0 - 12} y={BRACKET_Y + 18} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={Math.max(block2U, block4U, block8U)}>
                    blocks
                  </text>
                )}
              </g>
            )}
          </g>
        )}

        {/* ======================== B7: the n = 16 ghost (report §2b) ======================== */}
        {ghostU > 0.01 && (
          <g opacity={0.85 * clamp01(ghostU * 1.5)}>
            <text x={G16_COL[0] - 18} y={104} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              16 wires: 10 stages
            </text>
            {Array.from({ length: 16 }, (_, i) => (
              <line key={i} x1={G16_COL[0] - 18} y1={G16_Y(i)} x2={G16_COL[G16_COL.length - 1] + 18} y2={G16_Y(i)} stroke={colors.MUTED} strokeOpacity={0.4} strokeWidth={1} />
            ))}
            {NET16.map((st, si) => {
              const u = clamp01(ghostU * NET16.length - si);
              const d = st[0][1] - st[0][0];
              return (
                <g key={si} opacity={u}>
                  {st.map(([i, j, asc], c) => {
                    const x = G16_COL[si] + ((i % d) - (d - 1) / 2) * 3;
                    return (
                      <g key={c} fill={asc ? ASC : DESC}>
                        <line x1={x} y1={G16_Y(i)} x2={x} y2={G16_Y(j)} stroke={asc ? ASC : DESC} strokeWidth={1.4} />
                        <circle cx={x} cy={G16_Y(i)} r={2} />
                        <circle cx={x} cy={G16_Y(j)} r={2} />
                      </g>
                    );
                  })}
                  <text x={G16_COL[si]} y={G16_Y(15) + 28} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                    {d}
                  </text>
                </g>
              );
            })}
            <text x={G16_COL[0] - 18} y={G16_Y(15) + 54} fill={colors.TEAL} fontSize={15} fontFamily={UI} opacity={ghostSumU}>
              1 + 2 + 3 + 4 = 10 stages
            </text>
          </g>
        )}

        {/* ======================== B9–B10: the checks ======================== */}
        {boardU > 0.01 && (
          <g opacity={boardU}>
            <text x={GRID.x} y={GRID.y - 14} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              8 wires · every list of zeros and ones
            </text>
            {ZERO8.map((ok, k) => {
              const lit = clamp01(zeroU - k);
              const x = GRID.x + (k % 16) * GRID.pitch;
              const y = GRID.y + Math.floor(k / 16) * GRID.pitch;
              return <rect key={k} x={x} y={y} width={GRID.cell} height={GRID.cell} rx={2} fill={lit > 0 ? (ok ? colors.POSITIVE : colors.NEGATIVE) : colors.PANEL}
                fillOpacity={lit > 0 ? 0.35 + 0.55 * lit : 1} stroke={colors.GRID} />;
            })}
            <text x={1122} y={GRID.y + 112} fill={colors.TEXT} fontSize={22} fontFamily={MONO}>
              {`${fmtInt(Math.min(ZERO8_SORTED, Math.floor(zeroU)))} / 256`}
            </text>
            <text x={1122} y={GRID.y + 136} fill={colors.POSITIVE} fontSize={14} fontFamily={UI}>
              sorted
            </text>
            <g opacity={clamp01(n16U * 8)}>
              <text x={N16_BAR.x} y={N16_BAR.y - 12} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                16 wires · every list of zeros and ones
              </text>
              <rect x={N16_BAR.x} y={N16_BAR.y} width={N16_BAR.w} height={N16_BAR.h} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={N16_BAR.x} y={N16_BAR.y} width={N16_BAR.w * n16U} height={N16_BAR.h} rx={4} fill={colors.POSITIVE} fillOpacity={0.75} />
              <text x={N16_BAR.x} y={N16_BAR.y + 40} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
                {`${fmtInt(Math.round(ZERO16_SORTED * n16U))} / ${fmtInt(65536)} sorted`}
              </text>
            </g>
          </g>
        )}
        {stripU > 0.01 && (
          <g opacity={stripU}>
            <text x={N16_BAR.x} y={492} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              2,000 random lists per size, values 0 to 999
            </text>
            <text x={N16_BAR.x} y={512} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              against Array.prototype.sort · 0 mismatches
            </text>
            {SIZES.map((n, k) => {
              const u = clamp01(sizesU - k);
              if (u <= 0.005) return null;
              const x = N16_BAR.x + k * 60;
              const tag = n >= 32 ? 'sampled' : n >= 8 ? '+ all 0/1' : '';
              return (
                <g key={n} opacity={u}>
                  <rect x={x} y={526} width={54} height={42} rx={6} fill={colors.PANEL} stroke={n >= 32 ? colors.WARM : colors.POSITIVE} strokeWidth={1.3} />
                  <text x={x + 27} y={543} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                    {`n=${n}`}
                  </text>
                  <text x={x + 27} y={561} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                    0 ✗
                  </text>
                  {tag && (
                    <text x={x + 27} y={588} textAnchor="middle" fill={n >= 32 ? colors.WARM : colors.POSITIVE} fontSize={13} fontFamily={UI}
                      opacity={n >= 32 ? sampledU : 1}>
                      {tag}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: title, source chip, legend ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · Building the Mountains
      </text>
      <g>
        <rect x={40} y={48} width={SOURCES[srcIdx].length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {SOURCES[srcIdx]}
        </text>
      </g>
      {legendU > 0.01 && (
        <g opacity={legendU}>
          {[
            { y: 30, c: ASC, text: 'asc · smaller value to the upper wire' },
            { y: 56, c: DESC, text: 'desc · smaller value to the lower wire' },
          ].map((l) => (
            <g key={l.y}>
              <line x1={968} y1={l.y - 12} x2={968} y2={l.y + 4} stroke={l.c} strokeWidth={2.4} />
              <text x={982} y={l.y} fill={l.c} fontSize={13} fontFamily={UI}>
                {l.text}
              </text>
            </g>
          ))}
        </g>
      )}
    </>
  );
}

/** the "sorted ascending" note under the last row, for whichever input is showing */
function done8(w: number, sortedU: number): number {
  return w === 0 ? sortedU : 0;
}

export const vizScene = () => scene;
