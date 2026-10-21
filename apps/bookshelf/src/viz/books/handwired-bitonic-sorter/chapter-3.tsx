// The Staircase
//
// Bitonic Sorter (Handwired labs) — chapter 3. Sources:
//   Wikipedia "Bitonic sorter", rev 1373262602 (.orly-work/hw-books/inputs/bitonic/wikipedia-bitonic-sorter.wikitext)
//     wiki:14 (O(n (log n)^2) comparators and O((log n)^2) "delay", called stages here per the book's vocabulary;
//       parallel units in lockstep, "such as a typical GPU"), wiki:20 (power-of-two length, k = log2 n),
//     wiki:99 ("using sentinel values"), wiki:109 (the loop as printed, `for i ← low to low + k do`),
//     wiki:138 (k(k+1)/2 levels), wiki:140 (locality of reference, citing Batcher; quoted on the card, unmeasured)
//   .orly-work/hw-books/bitonic-ref/report.txt §1 (stages 1, 3, 6, 10, 15, 21 and comparators 1, 6, 24, 80, 240,
//     672 for n = 2..64; odd-even mergesort 543 at n = 64), §6 (inclusive bound: 8 of 256 zero-one inputs not
//     sorted at n = 8, first [1, 1, 1, 1, 0, 0, 0, 0]), §7 (+Infinity padding, m = 1..64, 3200 arrays, 0 mismatches)
//   .orly-work/hw-books/bitonic-ref/bitonic.ts (bitonicNetwork, bitonicMerge/bitonicSort with `bound`), ported below
//   docs/book-plans/handwired-bitonic-sorter/review.md, items 1 and 4 (on screen: "stages", never "delay"; the
//     extra comparison runs from wire low + k to low + 2k, the first wire of the next block)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every rod on screen is a comparator of a network built at module scope by a line-for-line
// port of bitonicNetwork (and, in beat 9, Batcher's odd-even mergesort); the module throws if the counts ever
// disagree with report.txt. The padding run, the failing output of the inclusive loop ([0, 0, 0, 1, 0, 1, 1, 1])
// and the extra rod's wires (2 → 4, in stage 1) are computed by running the ported code, not written by hand.
// The 32 lockstep units in beat 5 are schematic (labelled on screen).
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH14 = 8.43; // mono advance at 14 px
const WIRE = '#39415a';

// ---------------------------------------------------------------------------
// The networks (module scope, exact): a port of bitonic-ref/bitonic.ts
// ---------------------------------------------------------------------------

type Cmp = [lo: number, hi: number, ascending: boolean];

/** bitonic.ts:59-87, verbatim in behaviour. */
function bitonicNetwork(n: number): Cmp[][] {
  const stages: Cmp[][] = [];
  const place = (stage: number, c: Cmp) => {
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
  emitSort(0, n, 1, 0);
  return stages;
}

/** Batcher's odd-even mergesort, grouped one stage per (p, k) pass. */
function oddEvenNetwork(n: number): Cmp[][] {
  const stages: Cmp[][] = [];
  for (let p = 1; p < n; p *= 2) {
    for (let k = p; k >= 1; k /= 2) {
      const st: Cmp[] = [];
      for (let j = k % p; j <= n - 1 - k; j += 2 * k) {
        for (let i = 0; i <= Math.min(k - 1, n - j - k - 1); i++) {
          if (Math.floor((i + j) / (p * 2)) === Math.floor((i + j + k) / (p * 2))) st.push([i + j, i + j + k, true]);
        }
      }
      stages.push(st);
    }
  }
  return stages;
}

const KS = [1, 2, 3, 4, 5, 6];
const NET = KS.map((k) => bitonicNetwork(2 ** k)); // NET[k - 1]
const STAGES = NET.map((st) => st.length);
const COMPS = NET.map((st) => st.reduce((a, s) => a + s.length, 0));
// report.txt §1, the stages and comparators columns
const REPORT_STAGES = [1, 3, 6, 10, 15, 21];
const REPORT_COMPS = [1, 6, 24, 80, 240, 672];
KS.forEach((k, i) => {
  const n = 2 ** k;
  if (STAGES[i] !== REPORT_STAGES[i] || STAGES[i] !== (k * (k + 1)) / 2) throw new Error(`bitonic ch3: stages at n=${n}`);
  if (COMPS[i] !== REPORT_COMPS[i] || COMPS[i] !== (n * k * (k + 1)) / 4) throw new Error(`bitonic ch3: comparators at n=${n}`);
  if (NET[i].some((s) => s.length !== n / 2)) throw new Error(`bitonic ch3: a stage at n=${n} is not n/2 wide`);
});
const net = (k: number): Cmp[][] => NET[k - 1];
const S = (k: number): number => STAGES[k - 1];
const OE = oddEvenNetwork(64);
const OE_COUNT = OE.reduce((a, s) => a + s.length, 0);
if (OE_COUNT !== 543) throw new Error(`bitonic ch3: odd-even count ${OE_COUNT}, report says 543`);
if (OE.length !== 21) throw new Error(`bitonic ch3: odd-even depth ${OE.length}`);

function applyStage(a: number[], stage: Cmp[]): void {
  for (const [i, j, asc] of stage) {
    if (asc ? a[i] > a[j] : a[i] < a[j]) {
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
  }
}

/** Token positions stage by stage: POS[s][token] = wire, for s = 0..S (before stage 0 … after the last). */
function tokenTrace(values: number[], stages: Cmp[][]): number[][] {
  const wireTok = values.map((_, i) => i);
  const snap = () => {
    const p: number[] = [];
    wireTok.forEach((tok, w) => (p[tok] = w));
    return p;
  };
  const out = [snap()];
  for (const st of stages) {
    for (const [i, j, asc] of st) {
      const a = values[wireTok[i]];
      const b = values[wireTok[j]];
      if (asc ? a > b : a < b) [wireTok[i], wireTok[j]] = [wireTok[j], wireTok[i]];
    }
    out.push(snap());
  }
  return out;
}

// Beat 7 — seven values padded with a sentinel (the chapter 2 trace input, its last value dropped).
const PAD_IN = [3, 7, 4, 8, 6, 2, 1, Infinity];
const PAD_POS = tokenTrace(PAD_IN, net(3));
const PAD_OUT = (() => {
  const a = [...PAD_IN];
  for (const st of net(3)) applyStage(a, st);
  return a;
})();
if (PAD_OUT.some((v, i) => i > 0 && PAD_OUT[i - 1] > v) || PAD_OUT[7] !== Infinity) throw new Error('bitonic ch3: padding run');

// Beat 8 — the article's loop read literally (bitonic.ts with bound = 'inclusive'), instrumented to find the extra
// comparison that first moves a value on the failing input.
type Extra = { lo: number; hi: number; stage: number; swapped: boolean };
function runRecursive(input: number[], bound: 'exclusive' | 'inclusive'): { out: number[]; extras: Extra[] } {
  const a = [...input];
  const extras: Extra[] = [];
  const merge = (low: number, count: number, dir: 0 | 1, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    const end = bound === 'exclusive' ? low + k : low + k + 1;
    for (let i = low; i < end; i++) {
      const swap = (dir === 1 && a[i] > a[i + k]) || (dir === 0 && a[i] < a[i + k]);
      if (swap) [a[i], a[i + k]] = [a[i + k], a[i]];
      if (i === low + k && i + k < a.length) extras.push({ lo: i, hi: i + k, stage: start, swapped: swap });
    }
    merge(low, k, dir, start + 1);
    return 1 + merge(low + k, k, dir, start + 1);
  };
  const sort = (low: number, count: number, dir: 0 | 1, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    const half = sort(low, k, 1, start);
    sort(low + k, k, 0, start);
    return half + merge(low, count, dir, start + half);
  };
  sort(0, a.length, 1, 0);
  // drop any undefined read past the end (the last block's extra compares a[n], which never swaps)
  return { out: a.slice(0, input.length), extras };
}
const isSorted = (a: number[]): boolean => a.every((v, i) => i === 0 || a[i - 1] <= v);
const ZO_FAIL = [1, 1, 1, 1, 0, 0, 0, 0];
const INCL = runRecursive(ZO_FAIL, 'inclusive');
const EXCL = runRecursive(ZO_FAIL, 'exclusive');
const GHOST = INCL.extras.find((e) => e.swapped)!;
const ZO_FAILS = Array.from({ length: 256 }, (_, m) => Array.from({ length: 8 }, (_, i) => (m >> (7 - i)) & 1)).filter(
  (x) => !isSorted(runRecursive(x, 'inclusive').out),
).length;
if (ZO_FAILS !== 8) throw new Error(`bitonic ch3: inclusive bound fails ${ZO_FAILS} of 256, report says 8`);
if (!isSorted(EXCL.out) || isSorted(INCL.out)) throw new Error('bitonic ch3: the failing input');
if (!GHOST || GHOST.lo !== 2 || GHOST.hi !== 4 || GHOST.stage !== 1) throw new Error('bitonic ch3: ghost comparator moved');
const BAD_WIRES = INCL.out.map((v, i) => (i < 7 && v > INCL.out[i + 1]) || (i > 0 && INCL.out[i - 1] > v));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const NX0 = 96; // wire start
const P = 30; // fixed column pitch: the network's length IS its stage count
const COL0 = NX0 + 30;
const colX = (s: number): number => COL0 + s * P;
const wireEnd = (k: number): number => colX(S(k) - 1) + 26;
const NY0 = 118;
const NY1 = 548;
const wy = (i: number, n: number): number => NY0 + ((i + 0.5) * (NY1 - NY0)) / n;
const SPREAD = 20; // overlapping rods of one stage fan out across this width
const rodOff = (lo: number, d: number): number => (((lo % d) + 0.5) / d) * SPREAD - SPREAD / 2;
const DIST = ['#7dd3fc', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9']; // distance 1, 2, 4 … 32
const DIST_WORD = ['1', '2', '4', '8', '16', '32'];

// chart (right panel)
const BASE_Y = 500;
const bx = (k: number): number => 900 + (k - 1) * 58;
const BAR_W = 34;
const linH = (v: number): number => (v / 21) * 270;
const logH = (v: number): number => (Math.log10(v) / 3) * 300;
const AXIS_X = 872;

// tokens (8 wires)
const IN_X = 62;
const OUT_X = colX(5) + P / 2 + 50;
const OUT1_X = 352;
const OUT2_X = 432;

// lanes
const LANE = { x0: 878, y0: 252, pitch: 42, size: 32 };

const CAM_NET8: CameraState = { x: 380, y: 372, k: 1.15 };
const CAM_COL: CameraState = { x: 690, y: 340, k: 1.45 };
const CAM_CHART: CameraState = { x: 1000, y: 352, k: 1.12 };
const CAM_LOG: CameraState = { x: 1036, y: 350, k: 1.12 };
const CAM_PAD: CameraState = { x: 420, y: 342, k: 1.15 };
const CAM_GHOST: CameraState = { x: 470, y: 340, k: 1.15 };
const CAM_FINAL: CameraState = { x: 640, y: 356, k: 0.96 };

const merges8 = (s: number): number => (s === 0 ? 1 : s <= 2 ? 2 : 3); // which merge of the 8-wire sort owns column s

// ---------------------------------------------------------------------------
// Timeline — ten fixed captions at ~150 words a minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Let the list have two to the k wires. The last merge takes k stages, the merge before it k minus one, and so on down to one. Add them up: k times k plus one, over two.',
  'For two, four, eight, sixteen, thirty-two and sixty-four wires, that is one, three, six, ten, fifteen and twenty-one stages. Each doubling adds only a few more stages.',
  'Every stage has half as many comparators as wires. So the total is the number of wires times k times k plus one, over four: one, six, twenty-four, eighty, two hundred forty, six hundred seventy-two.',
  'In the usual shorthand, comparators grow like n times log n squared, and stages like log n squared. From thirty-two to sixty-four wires, comparators nearly triple, while stages go only from fifteen to twenty-one.',
  'That gap is why hardware likes it. A graphics processor has many units running in lockstep, and each stage gives all of them, thirty-two comparators for sixty-four numbers, work in the same instant.',
  "The article also says many consecutive operations keep locality of reference, which makes them cache-friendly in practice. That is the article's claim, citing Batcher. We did not measure it.",
  'The original design needs a length that is a power of two. For other lengths, pad with a sentinel bigger than everything, then drop the extras. That worked for every length from one to sixty-four in our check.',
  "It is easy to get a stage wrong. The article's loop, read literally, runs one comparison too far, reaching into the neighboring block. At eight wires that fails eight of the two hundred fifty-six zeros-and-ones lists.",
  'Bitonic is not the only Batcher network. His odd-even merge sort needs fewer comparators: five hundred forty-three at sixty-four wires, against six hundred seventy-two.',
  'So the picture so far: half as many comparators as wires per stage, k times k plus one over two stages, and wiring that never looks at the data. Now a stranger machine, one with no swaps at all.',
];
const CAPS = (() => {
  let t = 0.4;
  return CAPTIONS.map((text) => {
    const dur = Math.round(text.split(/\s+/).length * 0.4 * 10) / 10;
    const c = { at: +t.toFixed(1), dur, text };
    t = c.at + dur + 0.5;
    return c;
  });
})();

export function buildScene() {
  const tl = new Timeline();
  const A = CAPS.map((c) => c.at);
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // the machine
  const g = tl.channel('g', 3); // log2 of the wire count; fractional = mid-morph
  const drawU = tl.channel('drawU', 0); // first draw-on of the 8-wire network
  const netOp = tl.channel('netOp', 1);
  const hudU = tl.channel('hudU', 0);
  const labelsOp = tl.channel('labelsOp', 1);
  // B0
  const mergeSel = tl.channel('mergeSel', 3);
  const mergeU = tl.channel('mergeU', 0);
  const bracketsU = tl.channel('bracketsU', 0); // 0..3: brackets 3, 2, 1
  const sumU = tl.channel('sumU', 0);
  // chart
  const chartOp = tl.channel('chartOp', 0);
  const stairU = tl.channel('stairU', 0); // 0..6 bars
  const incU = tl.channel('incU', 0);
  const compRowU = tl.channel('compRowU', 0); // 0..6 entries
  const compTexU = tl.channel('compTexU', 0);
  const logU = tl.channel('logU', 0);
  const lineU = tl.channel('lineU', 0);
  const bigOU = tl.channel('bigOU', 0);
  const markU = tl.channel('markU', 0);
  // column focus / sweep
  const focusCol = tl.channel('focusCol', 20);
  const focusU = tl.channel('focusU', 0);
  const colNoteU = tl.channel('colNoteU', 0);
  const lanesU = tl.channel('lanesU', 0);
  // B5
  const quoteU = tl.channel('quoteU', 0);
  // B6
  const tokU = tl.channel('tokU', 0);
  const tokP = tl.channel('tokP', -1);
  const trimU = tl.channel('trimU', 0);
  const padNoteU = tl.channel('padNoteU', 0);
  const stripU = tl.channel('stripU', 0);
  // B7
  const zoU = tl.channel('zoU', 0);
  const blockU = tl.channel('blockU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const codeU = tl.channel('codeU', 0);
  const outU = tl.channel('outU', 0);
  const failU = tl.channel('failU', 0);
  // B8
  const oeU = tl.channel('oeU', 0);
  const oeCountU = tl.channel('oeCountU', 0);
  // B9
  const finalU = tl.channel('finalU', 0);

  CAPS.forEach((c) => tl.caption(c));

  // — B0 · the sum of the merges: 1 + 2 + 3 = k(k+1)/2 —
  tl.tween(drawU, 1, { at: A[0] + 0.2, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAM_NET8, { at: A[0] + 1.4, dur: 1.4, ease: ease.move });
  tl.tween(mergeU, 1, { at: A[0] + 3.4, dur: 0.6, ease: ease.move });
  tl.tween(bracketsU, 1, { at: A[0] + 3.6, dur: 0.6, ease: ease.enter });
  tl.set(mergeSel, 2, A[0] + 7.0);
  tl.tween(bracketsU, 2, { at: A[0] + 7.0, dur: 0.6, ease: ease.enter });
  tl.set(mergeSel, 1, A[0] + 9.4);
  tl.tween(bracketsU, 3, { at: A[0] + 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(mergeU, 0, { at: A[0] + 11.4, dur: 0.6, ease: ease.move });
  tl.tween(sumU, 1, { at: A[0] + 11.6, dur: 0.7, ease: ease.enter });
  tl.hold(A[0] + CAPS[0].dur, 0.5);

  // — B1 · the network grows; the staircase climbs 1, 3, 6, 10, 15, 21 —
  tl.tween(cam, CAMERA_HOME, { at: A[1], dur: 1.3, ease: ease.move });
  tl.tween(sumU, 0, { at: A[1], dur: 0.5, ease: ease.move });
  tl.tween(bracketsU, 0, { at: A[1], dur: 0.5, ease: ease.move });
  tl.tween(hudU, 1, { at: A[1] + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(chartOp, 1, { at: A[1] + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(stairU, 3, { at: A[1] + 0.8, dur: 1.3, ease: ease.linear });
  tl.tween(g, 4, { at: A[1] + 2.3, dur: 1.8, ease: ease.move });
  tl.tween(stairU, 4, { at: A[1] + 3.7, dur: 0.5, ease: ease.pop });
  tl.tween(g, 5, { at: A[1] + 4.5, dur: 1.8, ease: ease.move });
  tl.tween(stairU, 5, { at: A[1] + 5.9, dur: 0.5, ease: ease.pop });
  tl.tween(g, 6, { at: A[1] + 6.7, dur: 1.8, ease: ease.move });
  tl.tween(stairU, 6, { at: A[1] + 8.1, dur: 0.5, ease: ease.pop });
  tl.tween(incU, 1, { at: A[1] + 8.8, dur: 0.7, ease: ease.enter });
  tl.hold(A[1] + CAPS[1].dur, 0.5);

  // — B2 · one stage is n/2 rods; the total n·k(k+1)/4 —
  tl.tween(hudU, 0, { at: A[2], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_COL, { at: A[2], dur: 1.4, ease: ease.move });
  tl.tween(chartOp, 0.12, { at: A[2], dur: 0.6, ease: ease.move });
  tl.tween(focusU, 1, { at: A[2] + 0.6, dur: 0.7, ease: ease.move });
  tl.tween(colNoteU, 1, { at: A[2] + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CHART, { at: A[2] + 6.2, dur: 1.4, ease: ease.move });
  tl.tween(focusU, 0, { at: A[2] + 6.2, dur: 0.6, ease: ease.move });
  tl.tween(colNoteU, 0, { at: A[2] + 6.2, dur: 0.5, ease: ease.move });
  tl.tween(netOp, 0.15, { at: A[2] + 6.2, dur: 0.6, ease: ease.move });
  tl.tween(chartOp, 1, { at: A[2] + 6.4, dur: 0.6, ease: ease.move });
  tl.tween(compTexU, 1, { at: A[2] + 7.0, dur: 0.7, ease: ease.enter });
  tl.tween(compRowU, 6, { at: A[2] + 7.8, dur: 4.6, ease: ease.linear });
  tl.hold(A[2] + CAPS[2].dur, 0.5);

  // — B3 · log axis: the gentle curve and the steep one —
  tl.tween(cam, CAM_LOG, { at: A[3], dur: 1.0, ease: ease.move });
  tl.tween(incU, 0, { at: A[3], dur: 0.5, ease: ease.move });
  tl.tween(compTexU, 0, { at: A[3], dur: 0.5, ease: ease.move });
  tl.tween(logU, 1, { at: A[3] + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(lineU, 1, { at: A[3] + 2.2, dur: 1.4, ease: ease.draw });
  tl.tween(bigOU, 1, { at: A[3] + 3.6, dur: 0.7, ease: ease.enter });
  tl.tween(markU, 1, { at: A[3] + 7.6, dur: 0.8, ease: ease.enter });
  tl.hold(A[3] + CAPS[3].dur, 0.5);

  // — B4 · the 64-wire sweep: 32 comparators at once, 21 times —
  tl.tween(cam, CAMERA_HOME, { at: A[4], dur: 1.3, ease: ease.move });
  tl.tween(chartOp, 0, { at: A[4], dur: 0.6, ease: ease.move });
  tl.tween(netOp, 1, { at: A[4], dur: 0.6, ease: ease.move });
  tl.tween(hudU, 1, { at: A[4] + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(logU, 0, { at: A[4] + 0.7, dur: 0.1, ease: ease.move }); // reset while hidden
  tl.tween(lineU, 0, { at: A[4] + 0.7, dur: 0.1, ease: ease.move });
  tl.tween(bigOU, 0, { at: A[4], dur: 0.5, ease: ease.move });
  tl.tween(markU, 0, { at: A[4], dur: 0.5, ease: ease.move });
  tl.tween(lanesU, 1, { at: A[4] + 0.9, dur: 0.8, ease: ease.enter });
  tl.set(focusCol, 0, A[4] + 1.0);
  tl.tween(focusU, 1, { at: A[4] + 1.6, dur: 0.5, ease: ease.move });
  tl.tween(focusCol, 20.999, { at: A[4] + 2.0, dur: 10.0, ease: ease.linear });
  tl.hold(A[4] + CAPS[4].dur, 0.5);

  // — B5 · the article's claim, unmeasured —
  tl.tween(focusU, 0, { at: A[5], dur: 0.6, ease: ease.move });
  tl.tween(lanesU, 0, { at: A[5], dur: 0.6, ease: ease.move });
  tl.tween(netOp, 0.12, { at: A[5], dur: 0.6, ease: ease.move });
  tl.tween(hudU, 0.1, { at: A[5], dur: 0.6, ease: ease.move });
  tl.tween(quoteU, 1, { at: A[5] + 0.5, dur: 0.8, ease: ease.enter });
  tl.hold(A[5] + CAPS[5].dur, 0.5);

  // — B6 · pad seven values with +∞, sort, drop it —
  tl.tween(quoteU, 0, { at: A[6], dur: 0.5, ease: ease.move });
  tl.tween(hudU, 0, { at: A[6], dur: 0.4, ease: ease.move });
  tl.tween(netOp, 0.6, { at: A[6], dur: 0.6, ease: ease.move });
  tl.tween(g, 3, { at: A[6] + 0.3, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_PAD, { at: A[6] + 0.8, dur: 1.4, ease: ease.move });
  tl.tween(labelsOp, 0, { at: A[6] + 1.6, dur: 0.5, ease: ease.move });
  tl.tween(tokU, 1, { at: A[6] + 2.2, dur: 0.7, ease: ease.enter });
  tl.tween(padNoteU, 1, { at: A[6] + 2.8, dur: 0.7, ease: ease.enter });
  tl.tween(tokP, S(3) + 1, { at: A[6] + 4.2, dur: 6.2, ease: ease.linear });
  tl.tween(trimU, 1, { at: A[6] + 10.8, dur: 0.9, ease: ease.move });
  tl.tween(stripU, 1, { at: A[6] + 11.6, dur: 0.7, ease: ease.enter });
  tl.hold(A[6] + CAPS[6].dur, 0.5);

  // — B7 · the loop as printed: one comparison too far —
  tl.tween(tokU, 0, { at: A[7], dur: 0.5, ease: ease.move });
  tl.tween(padNoteU, 0, { at: A[7], dur: 0.5, ease: ease.move });
  tl.tween(stripU, 0, { at: A[7], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_GHOST, { at: A[7], dur: 1.0, ease: ease.move });
  tl.tween(zoU, 1, { at: A[7] + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(netOp, 0.15, { at: A[7] + 1.4, dur: 0.6, ease: ease.move });
  tl.tween(blockU, 1, { at: A[7] + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(codeU, 1, { at: A[7] + 2.2, dur: 0.7, ease: ease.enter });
  tl.tween(ghostU, 1, { at: A[7] + 3.4, dur: 1.0, ease: ease.draw });
  tl.tween(outU, 1, { at: A[7] + 7.4, dur: 0.8, ease: ease.enter });
  tl.tween(failU, 1, { at: A[7] + 10.0, dur: 0.6, ease: ease.pop });
  tl.hold(A[7] + CAPS[7].dur, 0.5);

  // — B8 · odd-even mergesort over the same 64 wires: 543 against 672 —
  tl.tween(zoU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(blockU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(codeU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(ghostU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(outU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(failU, 0, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: A[8], dur: 1.3, ease: ease.move });
  tl.tween(netOp, 1, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(labelsOp, 1, { at: A[8], dur: 0.5, ease: ease.move });
  tl.tween(g, 6, { at: A[8] + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(hudU, 1, { at: A[8] + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(netOp, 0.15, { at: A[8] + 2.0, dur: 0.6, ease: ease.move });
  tl.tween(oeU, 1, { at: A[8] + 2.2, dur: 2.6, ease: ease.linear });
  tl.tween(oeCountU, 1, { at: A[8] + 3.2, dur: 0.8, ease: ease.enter });
  tl.hold(A[8] + CAPS[8].dur, 0.5);

  // — B9 · pull back: the staircase and two formulas —
  tl.tween(oeU, 0, { at: A[9], dur: 0.8, ease: ease.move });
  tl.tween(oeCountU, 0, { at: A[9], dur: 0.6, ease: ease.move });
  tl.tween(hudU, 0.12, { at: A[9], dur: 0.6, ease: ease.move });
  tl.tween(netOp, 0.13, { at: A[9], dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_FINAL, { at: A[9] + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(chartOp, 1, { at: A[9] + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(finalU, 1, { at: A[9] + 1.2, dur: 0.9, ease: ease.enter });
  tl.hold(A[9] + CAPS[9].dur, 2.5);

  return {
    tl, cam, g, drawU, netOp, hudU, labelsOp,
    mergeSel, mergeU, bracketsU, sumU,
    chartOp, stairU, incU, compRowU, compTexU, logU, lineU, bigOU, markU,
    focusCol, focusU, colNoteU, lanesU,
    quoteU,
    tokU, tokP, trimU, padNoteU, stripU,
    zoU, blockU, ghostU, codeU, outU, failU,
    oeU, oeCountU,
    finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Network geometry at a continuous size g (a pure function of g)
// ---------------------------------------------------------------------------

type Rod = { x: number; y1: number; y2: number; s: number; d: number; op: number };
type Geo = { n: number; k: number; wires: { y: number; op: number }[]; rods: Rod[]; end: number; pitch: number };

function geometry(g: number): Geo {
  const kLo = Math.max(1, Math.min(6, Math.floor(g + 1e-6)));
  const u = g - kLo;
  if (u < 1e-4 || kLo === 6) {
    const k = kLo;
    const n = 2 ** k;
    const wires = Array.from({ length: n }, (_, i) => ({ y: wy(i, n), op: 1 }));
    const rods: Rod[] = [];
    net(k).forEach((st, s) =>
      st.forEach(([lo, hi]) => rods.push({ x: colX(s) + rodOff(lo, hi - lo), y1: wy(lo, n), y2: wy(hi, n), s, d: hi - lo, op: 1 })),
    );
    return { n, k, wires, rods, end: wireEnd(k), pitch: (NY1 - NY0) / n };
  }
  const kHi = kLo + 1;
  const nLo = 2 ** kLo;
  const n = 2 ** kHi;
  const a = smooth(u / 0.4);
  const b = clamp01((u - 0.3) / 0.3);
  const y = (i: number): number => (i < nLo ? lerp(wy(i, nLo), wy(i, n), a) : wy(i, n) + (1 - b) * 24);
  const wires = Array.from({ length: n }, (_, i) => ({ y: y(i), op: i < nLo ? 1 : b }));
  const rods: Rod[] = [];
  const sLo = S(kLo);
  net(kHi).forEach((st, s) =>
    st.forEach(([lo, hi]) => {
      let op = 1;
      if (s < sLo) op = lo >= nLo ? b : 1;
      else op = clamp01((u - (0.58 + (0.32 * (s - sLo)) / kHi)) / 0.1);
      rods.push({ x: colX(s) + rodOff(lo, hi - lo), y1: y(lo), y2: y(hi), s, d: hi - lo, op });
    }),
  );
  return {
    n, k: kHi, wires, rods,
    end: lerp(wireEnd(kLo), wireEnd(kHi), clamp01((u - 0.55) / 0.45)),
    pitch: lerp((NY1 - NY0) / nLo, (NY1 - NY0) / n, a),
  };
}

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;
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

function CodeChip({ x, y, lines, stripe, opacity = 1, note }: { x: number; y: number; lines: string[]; stripe: string; opacity?: number; note?: string }) {
  if (opacity <= 0.005) return null;
  const w = Math.max(...lines.map((l) => l.length)) * CH14 + 26;
  const h = lines.length * 18 + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 20 + 18 * i} fill={colors.TEXT} fontSize={14} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
      {note && (
        <text x={x + w + 10} y={y + h / 2 + 5} fill={stripe} fontSize={13} fontFamily={UI}>
          {note}
        </text>
      )}
    </g>
  );
}

function Token({ x, y, v, color = colors.TEXT, ring, opacity = 1 }: { x: number; y: number; v: number; color?: string; ring?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={13} fill={colors.PANEL} stroke={ring ?? color} strokeWidth={ring ? 2.6 : 1.6} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={v === Infinity ? 16 : 14} fontFamily={MONO} fontWeight={600}>
        {v === Infinity ? '∞' : v}
      </text>
    </g>
  );
}

function Bracket({ x0, x1, y, label, color, opacity }: { x0: number; x1: number; y: number; label: string; color: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <path d={`M ${x0} ${y - 8} L ${x0} ${y} L ${x1} ${y} L ${x1} ${y - 8}`} stroke={color} strokeWidth={1.8} fill="none" />
      <text x={(x0 + x1) / 2} y={y + 20} textAnchor="middle" fill={color} fontSize={15} fontFamily={MONO} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

// token x for progress p through the 8-wire network (-1 = parked at the input, S + 1 = parked at the output)
function tokenX(p: number, s8: number): number {
  const x0 = colX(0) - P / 2;
  const x1 = colX(s8 - 1) + P / 2;
  if (p < 0) return lerp(IN_X, x0, p + 1);
  if (p > s8) return lerp(x1, OUT_X, p - s8);
  return x0 + p * P;
}
/** sideways nudge while a token crosses another: moving up bows left, moving down bows right */
function tokenDX(tok: number, p: number, pos: number[][], s8: number): number {
  if (p <= 0 || p >= s8) return 0;
  const s = Math.floor(p);
  const d = pos[s + 1][tok] - pos[s][tok];
  if (d === 0) return 0;
  const f = clamp01((p - s - 0.25) / 0.5);
  return Math.sign(d) * 15 * Math.sin(Math.PI * f);
}
function tokenY(tok: number, p: number, pos: number[][], s8: number): number {
  if (p <= 0) return wy(pos[0][tok], 8);
  if (p >= s8) return wy(pos[s8][tok], 8);
  const s = Math.floor(p);
  const f = smooth((p - s - 0.25) / 0.5);
  return lerp(wy(pos[s][tok], 8), wy(pos[s + 1][tok], 8), f);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const g = s.get(scene.g);
  const geo = geometry(g);
  const drawU = s.get(scene.drawU);
  const netOp = s.get(scene.netOp);
  const hudU = s.get(scene.hudU);
  const labelsOp = s.get(scene.labelsOp);
  const mergeSel = Math.round(s.get(scene.mergeSel));
  const mergeU = s.get(scene.mergeU);
  const bracketsU = s.get(scene.bracketsU);
  const sumU = s.get(scene.sumU);
  const chartOp = s.get(scene.chartOp);
  const stairU = s.get(scene.stairU);
  const incU = s.get(scene.incU);
  const compRowU = s.get(scene.compRowU);
  const compTexU = s.get(scene.compTexU);
  const logU = s.get(scene.logU);
  const lineU = s.get(scene.lineU);
  const bigOU = s.get(scene.bigOU);
  const markU = s.get(scene.markU);
  const focusColV = s.get(scene.focusCol);
  const focusCol = Math.floor(focusColV);
  const focusU = s.get(scene.focusU);
  const colNoteU = s.get(scene.colNoteU);
  const lanesU = s.get(scene.lanesU);
  const quoteU = s.get(scene.quoteU);
  const tokU = s.get(scene.tokU);
  const tokP = s.get(scene.tokP);
  const trimU = s.get(scene.trimU);
  const padNoteU = s.get(scene.padNoteU);
  const stripU = s.get(scene.stripU);
  const zoU = s.get(scene.zoU);
  const blockU = s.get(scene.blockU);
  const ghostU = s.get(scene.ghostU);
  const codeU = s.get(scene.codeU);
  const outU = s.get(scene.outU);
  const failU = s.get(scene.failU);
  const oeU = s.get(scene.oeU);
  const oeCountU = s.get(scene.oeCountU);
  const finalU = s.get(scene.finalU);

  const nNow = 2 ** Math.round(g);
  const kNow = Math.round(g);
  const flash = 1 - (focusColV - focusCol); // a lit column fires, then decays until the next one
  const sweeping = lanesU > 0.01;
  const rodOp = (r: Rod): number => {
    let o = r.op * netOp;
    if (drawU < 1) o *= clamp01(drawU * 7 - r.s);
    if (mergeU > 0.001 && geo.n === 8) o *= lerp(1, merges8(r.s) === mergeSel ? 1 : 0.13, mergeU);
    if (focusU > 0.001) o *= lerp(1, r.s === focusCol ? 1 : 0.13, focusU);
    return o;
  };
  const dotR = Math.max(1.4, Math.min(4.2, geo.pitch * 0.085));
  const rodW = Math.max(1, Math.min(2.6, geo.pitch * 0.045));
  const wireOp = Math.max(0.15, netOp) * clamp01(drawU * 1.5);
  const wireLabelOp = labelsOp * clamp01((geo.pitch - 15) / 10) * clamp01(drawU * 2) * Math.max(0.12, netOp);

  // chart helpers
  const barH = (v: number): number => lerp(linH(v), logH(v), logU);
  const logY = (v: number): number => BASE_Y - logH(v);

  // the comparator curve, drawn on point by point
  const compLine = (u: number): string => {
    const f = u * 5;
    const i = Math.min(5, Math.floor(f));
    const pts = KS.slice(0, i + 1).map((k) => [bx(k), logY(COMPS[k - 1])]);
    if (i < 5) pts.push([lerp(bx(i + 1), bx(i + 2), f - i), lerp(logY(COMPS[i]), logY(COMPS[i + 1]), f - i)]);
    return pts.map((p) => p.join(',')).join(' ');
  };
  // odd-even overlay: columns wipe on left to right
  const oeColOp = (st: number): number => clamp01(oeU * 22 - st);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the network ======================== */}
        <g>
          {sweeping && focusU > 0.01 && geo.n === 64 && (
            <rect x={colX(focusCol) - 15} y={NY0 - 6} width={30} height={NY1 - NY0 + 12} rx={6} fill={colors.TEXT} opacity={focusU * lanesU * (0.06 + 0.12 * flash)} />
          )}
          {geo.wires.map((w, i) => (
            <line key={i} x1={NX0} y1={w.y} x2={NX0 + (geo.end - NX0) * clamp01(drawU * 1.3)} y2={w.y} stroke={WIRE} strokeWidth={geo.n >= 64 ? 0.8 : 1.2} opacity={w.op * wireOp} />
          ))}
          {geo.rods.map((r, i) => {
            const o = rodOp(r);
            if (o <= 0.005) return null;
            const c = DIST[Math.log2(r.d)];
            const lit = sweeping && r.s === focusCol ? flash : 0;
            return (
              <g key={i} opacity={o}>
                <line x1={r.x} y1={r.y1} x2={r.x} y2={r.y2} stroke={lit > 0.02 ? '#ffffff' : c} strokeWidth={rodW + lit * 0.8} />
                <circle cx={r.x} cy={r.y1} r={dotR} fill={c} />
                <circle cx={r.x} cy={r.y2} r={dotR} fill={c} />
              </g>
            );
          })}
          {wireLabelOp > 0.01 &&
            geo.wires.map((w, i) => (
              <text key={i} x={NX0 - 10} y={w.y + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={w.op * wireLabelOp}>
                {i}
              </text>
            ))}
        </g>

        {/* HUD above the network: the current size, read off the ported network */}
        {hudU > 0.01 && (
          <g opacity={hudU}>
            <text x={NX0} y={100} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
              {`n = ${nNow} wires · k = ${kNow} · ${S(kNow)} stages · ${COMPS[kNow - 1]} comparators`}
            </text>
          </g>
        )}
        {/* the distance key, under the network */}
        {hudU > 0.01 && (
          <g opacity={hudU}>
            <text x={NX0} y={584} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              comparator distance
            </text>
            {DIST.map((c, i) => (
              <g key={i}>
                <rect x={NX0 + 140 + i * 52} y={574} width={14} height={12} rx={2} fill={c} />
                <text x={NX0 + 158 + i * 52} y={584} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  {DIST_WORD[i]}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* B0: merge brackets under the 8-wire network, and the sum */}
        {bracketsU > 0.01 && geo.n === 8 && (
          <g>
            <Bracket x0={colX(3) - 12} x1={colX(5) + 12} y={566} label="3" color={DIST[2]} opacity={clamp01(bracketsU)} />
            <Bracket x0={colX(1) - 12} x1={colX(2) + 12} y={566} label="2" color={DIST[1]} opacity={clamp01(bracketsU - 1)} />
            <Bracket x0={colX(0) - 12} x1={colX(0) + 12} y={566} label="1" color={DIST[0]} opacity={clamp01(bracketsU - 2)} />
            <g opacity={clamp01(bracketsU)}>
              <text x={colX(0) - 22} y={586} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                stages per merge
              </text>
            </g>
            <g opacity={clamp01(bracketsU) * (1 - sumU)}>
              {[
                { m: 3, t: 'the last merge: 8 wires, k = 3 stages', y: 250 },
                { m: 2, t: 'the merges before it: k − 1 = 2', y: 290 },
                { m: 1, t: 'and the first: 1', y: 330 },
              ].map((r) => (
                <text key={r.m} x={360} y={r.y} fill={DIST[r.m - 1]} fontSize={16} fontFamily={UI} opacity={clamp01(bracketsU - (3 - r.m)) * (mergeSel === r.m ? 1 : 0.35)}>
                  {r.t}
                </text>
              ))}
            </g>
          </g>
        )}
        {sumU > 0.01 && (
          <g>
            <MathLabel tex={'k = 3:\\quad 1 + 2 + 3 = \\tfrac{k(k+1)}{2} = 6\\ \\text{stages}'} x={360} y={290} fontSize={28} anchor="start" opacity={sumU} boxWidth={520} />
          </g>
        )}

        {/* B2: one column, n/2 rods */}
        {colNoteU > 0.01 && (
          <g opacity={colNoteU}>
            <rect x={colX(20) - 16} y={NY0 - 4} width={32} height={NY1 - NY0 + 8} rx={6} fill="none" stroke={colors.TEXT} strokeWidth={1.2} strokeDasharray="4 3" />
            <text x={colX(20) + 30} y={260} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
              one stage: 32 comparators
            </text>
            <text x={colX(20) + 30} y={284} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              every wire used once
            </text>
            <MathLabel tex={'\\tfrac{n}{2} = \\tfrac{64}{2} = 32'} x={colX(20) + 30} y={330} fontSize={24} anchor="start" boxWidth={300} />
          </g>
        )}

        {/* ======================== the chart (right panel) ======================== */}
        {chartOp > 0.005 && (
          <g opacity={chartOp}>
            {/* titles (linear mode) */}
            <g opacity={1 - logU}>
              <MathLabel tex={'\\text{stages} = \\tfrac{k(k+1)}{2}'} x={1045} y={136} fontSize={22} color={colors.TEAL} opacity={(1 - logU) * clamp01(stairU)} boxWidth={400} />
              <MathLabel tex={'\\text{comparators} = n \\cdot \\tfrac{k(k+1)}{4}'} x={1045} y={176} fontSize={22} color={colors.WARM} opacity={(1 - logU) * compTexU} boxWidth={420} />
            </g>
            {/* log mode legend */}
            {bigOU > 0.01 && (
              <g>
                <MathLabel tex={'\\text{comparators} \\sim O(n \\log^2 n)'} x={1045} y={136} fontSize={22} color={colors.WARM} opacity={bigOU} boxWidth={420} />
                <MathLabel tex={'\\text{stages} \\sim O(\\log^2 n)'} x={1045} y={174} fontSize={22} color={colors.TEAL} opacity={bigOU} boxWidth={420} />
              </g>
            )}
            {/* log axis */}
            {logU > 0.01 && (
              <g opacity={logU}>
                <line x1={AXIS_X} y1={BASE_Y} x2={AXIS_X} y2={logY(1000)} stroke={colors.MUTED} strokeWidth={1} />
                {[1, 10, 100, 1000].map((v) => (
                  <g key={v}>
                    <line x1={AXIS_X - 5} y1={logY(v)} x2={AXIS_X} y2={logY(v)} stroke={colors.MUTED} />
                    <line x1={AXIS_X} y1={logY(v)} x2={1214} y2={logY(v)} stroke={WIRE} strokeWidth={0.8} strokeDasharray="3 4" />
                    <text x={AXIS_X - 8} y={logY(v) + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {v}
                    </text>
                  </g>
                ))}
                <text x={AXIS_X - 8} y={logY(1000) - 18} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  log scale
                </text>
              </g>
            )}
            {/* baseline + n row */}
            <line x1={AXIS_X} y1={BASE_Y} x2={1214} y2={BASE_Y} stroke={colors.MUTED} strokeWidth={1} opacity={clamp01(stairU)} />
            <text x={AXIS_X - 4} y={524} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(stairU)}>
              n
            </text>
            {KS.map((k) => {
              const u = clamp01(stairU - (k - 1));
              if (u <= 0.005) return null;
              const v = STAGES[k - 1];
              const h = barH(v) * u;
              const hl = markU > 0.01 && k >= 5;
              return (
                <g key={k}>
                  <rect x={bx(k) - BAR_W / 2} y={BASE_Y - h} width={BAR_W} height={h} rx={3} fill={colors.TEAL} opacity={0.75} />
                  <text x={bx(k)} y={BASE_Y - h - 8} textAnchor="middle" fill={hl ? colors.TEXT : colors.TEAL} fontSize={15} fontFamily={MONO} fontWeight={600} opacity={u}>
                    {v}
                  </text>
                  {k > 1 && incU > 0.01 && (
                    <text x={bx(k)} y={BASE_Y - h - 28} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={incU * u}>
                      {`+${v - STAGES[k - 2]}`}
                    </text>
                  )}
                  <text x={bx(k)} y={524} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={u}>
                    {2 ** k}
                  </text>
                </g>
              );
            })}
            {/* comparator row */}
            {compRowU > 0.01 && (
              <g>
                <text x={AXIS_X - 4} y={552} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={clamp01(compRowU)}>
                  comparators
                </text>
                {KS.map((k) => (
                  <text key={k} x={bx(k)} y={552} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO} fontWeight={600} opacity={clamp01(compRowU - (k - 1))}>
                    {COMPS[k - 1]}
                  </text>
                ))}
              </g>
            )}
            {/* comparators on the log axis */}
            {lineU > 0.01 && (
              <g>
                <polyline points={compLine(lineU)} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
                {KS.map((k) => (
                  <circle key={k} cx={bx(k)} cy={logY(COMPS[k - 1])} r={4.5} fill={colors.WARM} opacity={clamp01(lineU * 5 - (k - 1) + 1)} />
                ))}
              </g>
            )}
            {/* 32 → 64 */}
            {markU > 0.01 && (
              <g opacity={markU}>
                <text x={1172} y={logY(450)} textAnchor="end" fill={colors.WARM} fontSize={16} fontFamily={UI} fontWeight={600}>
                  ×2.8
                </text>
                <text x={bx(6)} y={BASE_Y - logH(21) - 30} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
                  +6
                </text>
                <text x={884} y={236} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                  32 → 64 wires
                </text>
                <text x={884} y={256} fill={colors.WARM} fontSize={14} fontFamily={UI}>
                  comparators 240 → 672
                </text>
                <text x={884} y={276} fill={colors.TEAL} fontSize={14} fontFamily={UI}>
                  stages 15 → 21
                </text>
              </g>
            )}
          </g>
        )}

        {/* B4: lockstep lanes (schematic) and the sweep counter */}
        {lanesU > 0.01 && (
          <g opacity={lanesU}>
            <text x={LANE.x0} y={200} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
              32 comparators per stage at n = 64
            </text>
            <text x={LANE.x0} y={224} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              parallel units in lockstep (schematic)
            </text>
            {Array.from({ length: 32 }, (_, i) => {
              const cx = LANE.x0 + (i % 8) * LANE.pitch;
              const cy = LANE.y0 + Math.floor(i / 8) * LANE.pitch;
              const on = focusU > 0.5 && focusColV >= 0 ? flash : 0;
              return (
                <g key={i}>
                  <rect x={cx} y={cy} width={LANE.size} height={LANE.size} rx={5} fill={colors.PANEL} stroke={on > 0.05 ? DIST[Math.log2(net(6)[focusCol][0][1] - net(6)[focusCol][0][0])] : colors.GRID} strokeWidth={1.4} />
                  <rect x={cx} y={cy} width={LANE.size} height={LANE.size} rx={5} fill={DIST[Math.log2(net(6)[focusCol][0][1] - net(6)[focusCol][0][0])]} opacity={0.55 * on} />
                  <line x1={cx + 16} y1={cy + 9} x2={cx + 16} y2={cy + 23} stroke={colors.MUTED} strokeWidth={1.4} />
                  <circle cx={cx + 16} cy={cy + 9} r={2.4} fill={colors.MUTED} />
                  <circle cx={cx + 16} cy={cy + 23} r={2.4} fill={colors.MUTED} />
                </g>
              );
            })}
            <text x={LANE.x0} y={448} fill={colors.TEXT} fontSize={16} fontFamily={MONO} opacity={clamp01(focusU * 2)}>
              {`stage ${focusCol + 1} of 21`}
            </text>
            <text x={LANE.x0} y={472} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(focusU * 2)}>
              {`distance ${net(6)[focusCol][0][1] - net(6)[focusCol][0][0]} · all 32 units busy every stage`}
            </text>
          </g>
        )}

        {/* B5: the quote card */}
        {quoteU > 0.01 && (
          <g opacity={quoteU}>
            <rect x={300} y={222} width={680} height={226} rx={12} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            <text x={330} y={262} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              the article&apos;s claim (Wikipedia, Bitonic sorter, citing Batcher, 1968)
            </text>
            {[
              '“… many of the consecutive operations in a bitonic sort',
              'retain a locality of reference, making implementations',
              'more cache-friendly …”',
            ].map((l, i) => (
              <text key={i} x={330} y={306 + i * 30} fill={colors.TEXT} fontSize={19} fontFamily={colors.font.math} fontStyle="italic">
                {l}
              </text>
            ))}
            <Chip x={330} y={420} text="not measured here" color={colors.WARM} fs={15} />
          </g>
        )}

        {/* B6: padding with a sentinel */}
        {tokU > 0.01 &&
          PAD_IN.map((v, tok) => {
            const isInf = v === Infinity;
            const tr = isInf ? trimU : 0;
            return (
              <Token key={tok} x={tokenX(tokP, 6) + tokenDX(tok, tokP, PAD_POS, 6) + tr * 40} y={tokenY(tok, tokP, PAD_POS, 6)} v={v} color={isInf ? colors.WARM : colors.TEXT}
                opacity={tokU * (1 - tr)} />
            );
          })}
        {padNoteU > 0.01 && (
          <g opacity={padNoteU}>
            <text x={IN_X - 14} y={NY0 - 8} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              m = 7, padded to 8
            </text>
            <Chip x={440} y={230} text="pad with +∞, a sentinel bigger than everything" color={colors.WARM} fs={14} />
            <Chip x={440} y={272} text="run the 8-wire network, then drop the extras" color={colors.TEXT} fs={14} opacity={clamp01((tokP + 1) * 2)} />
            <text x={OUT_X - 14} y={NY0 - 8} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={trimU}>
              sorted
            </text>
          </g>
        )}
        {stripU > 0.01 && (
          <g opacity={stripU}>
            <Chip x={440} y={470} text="m = 1 to 64 · 3,200 arrays · 0 mismatches" color={colors.POSITIVE} fs={15} />
            <text x={440} y={500} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              our check: the JavaScript reference against Array.prototype.sort
            </text>
          </g>
        )}

        {/* B7: the loop as printed */}
        {blockU > 0.01 && (
          <g opacity={blockU}>
            {[0, 4].map((w0, i) => (
              <rect key={w0} x={colX(GHOST.stage) - 16} y={wy(w0, 8) - 22} width={colX(GHOST.stage + 1) - colX(GHOST.stage) + 32} height={wy(w0 + 3, 8) - wy(w0, 8) + 44} rx={6}
                fill={i === 0 ? colors.TEAL : colors.SECONDARY} fillOpacity={0.08} stroke={i === 0 ? colors.TEAL : colors.SECONDARY} strokeDasharray="4 3" />
            ))}
            <text x={colX(GHOST.stage + 1) + 24} y={wy(1, 8) + 5} fill={colors.TEAL} fontSize={13} fontFamily={UI}>
              block 0–3
            </text>
            <text x={colX(GHOST.stage + 1) + 24} y={wy(6, 8) + 5} fill={colors.SECONDARY} fontSize={13} fontFamily={UI}>
              block 4–7
            </text>
          </g>
        )}
        {ghostU > 0.01 && (
          <g>
            <line x1={colX(GHOST.stage) + 15} y1={wy(GHOST.lo, 8)} x2={colX(GHOST.stage) + 15} y2={lerp(wy(GHOST.lo, 8), wy(GHOST.hi, 8), ghostU)}
              stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="6 4" />
            <circle cx={colX(GHOST.stage) + 15} cy={wy(GHOST.lo, 8)} r={5} fill={colors.NEGATIVE} opacity={ghostU} />
            <circle cx={colX(GHOST.stage) + 15} cy={wy(GHOST.hi, 8)} r={5} fill={colors.NEGATIVE} opacity={clamp01(ghostU * 3 - 2)} />
          </g>
        )}
        {zoU > 0.01 && (
          <g opacity={zoU}>
            <text x={IN_X - 16} y={NY0 - 8} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              input
            </text>
            {ZO_FAIL.map((v, w) => (
              <Token key={w} x={IN_X} y={wy(w, 8)} v={v} color={v ? colors.WARM : colors.MUTED} />
            ))}
          </g>
        )}
        {codeU > 0.01 && (
          <g opacity={codeU}>
            <CodeChip x={510} y={196} lines={['for i ← low to low + k do']} stripe={colors.NEGATIVE} note="as printed" />
            <CodeChip x={510} y={244} lines={['for (i = low; i < low + k; i++)']} stripe={colors.POSITIVE} note="correct" />
            <g opacity={clamp01((ghostU - 0.6) * 3)}>
              <text x={510} y={318} fill={colors.NEGATIVE} fontSize={15} fontFamily={UI}>
                {`the extra i = low + k: wire ${GHOST.lo} → wire ${GHOST.hi}`}
              </text>
              <text x={510} y={340} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                low + k to low + 2k, the first wire of the next block
              </text>
            </g>
          </g>
        )}
        {outU > 0.01 && (
          <g opacity={outU}>
            <text x={OUT1_X} y={NY0 - 8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={UI}>
              as printed
            </text>
            <text x={OUT2_X} y={NY0 - 8} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
              i &lt; low + k
            </text>
            {INCL.out.map((v, w) => (
              <Token key={`a${w}`} x={OUT1_X} y={wy(w, 8)} v={v} color={v ? colors.WARM : colors.MUTED} ring={BAD_WIRES[w] ? colors.NEGATIVE : undefined} />
            ))}
            {EXCL.out.map((v, w) => (
              <Token key={`b${w}`} x={OUT2_X} y={wy(w, 8)} v={v} color={v ? colors.WARM : colors.MUTED} />
            ))}
          </g>
        )}
        {failU > 0.01 && (
          <g opacity={failU}>
            <Chip x={510} y={420} text={`${ZO_FAILS} of 256 zero-one inputs fail at n = 8`} color={colors.NEGATIVE} fs={16} />
            <text x={510} y={452} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              the first of them: 1 1 1 1 0 0 0 0
            </text>
          </g>
        )}

        {/* B8: odd-even mergesort, 64 wires, same columns */}
        {oeU > 0.01 && geo.n === 64 && (
          <g>
            {OE.map((st, si) => {
              const o = oeColOp(si);
              if (o <= 0.005) return null;
              return (
                <g key={si} opacity={o}>
                  {st.map(([lo, hi], ci) => (
                    <g key={ci}>
                      <line x1={colX(si) + rodOff(lo, hi - lo)} y1={wy(lo, 64)} x2={colX(si) + rodOff(lo, hi - lo)} y2={wy(hi, 64)} stroke={colors.POSITIVE} strokeWidth={1.1} />
                      <circle cx={colX(si) + rodOff(lo, hi - lo)} cy={wy(lo, 64)} r={1.5} fill={colors.POSITIVE} />
                      <circle cx={colX(si) + rodOff(lo, hi - lo)} cy={wy(hi, 64)} r={1.5} fill={colors.POSITIVE} />
                    </g>
                  ))}
                </g>
              );
            })}
          </g>
        )}
        {oeCountU > 0.01 && (
          <g opacity={oeCountU}>
            <text x={880} y={200} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
              two Batcher networks, 64 wires
            </text>
            <text x={880} y={262} fill={DIST[3]} fontSize={15} fontFamily={UI}>
              bitonic
            </text>
            <text x={880} y={306} fill={DIST[3]} fontSize={40} fontFamily={MONO} fontWeight={700}>
              {COMPS[5]}
            </text>
            <text x={880} y={366} fill={colors.POSITIVE} fontSize={15} fontFamily={UI}>
              odd-even merge sort
            </text>
            <text x={880} y={410} fill={colors.POSITIVE} fontSize={40} fontFamily={MONO} fontWeight={700}>
              {OE_COUNT}
            </text>
            <text x={880} y={448} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              {`comparators · ${OE.length} stages each, as drawn`}
            </text>
          </g>
        )}

        {/* B9: the two formulas, backed by an opaque panel */}
        {finalU > 0.01 && (
          <g opacity={finalU}>
            <rect x={130} y={214} width={600} height={232} rx={14} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            <MathLabel tex={'\\tfrac{n}{2}\\ \\text{comparators per stage}'} x={170} y={268} fontSize={28} anchor="start" boxWidth={540} />
            <MathLabel tex={'\\tfrac{k(k+1)}{2}\\ \\text{stages},\\ \\ n = 2^k'} x={170} y={338} fontSize={28} anchor="start" boxWidth={540} />
            <text x={172} y={410} fill={colors.MUTED} fontSize={16} fontFamily={UI}>
              wiring set by n alone: it never looks at the data
            </text>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · The Staircase
      </text>
    </>
  );
}

export const vizScene = () => scene;
