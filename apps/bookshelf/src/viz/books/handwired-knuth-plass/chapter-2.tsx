// Chain Or Tree
//
// Knuth-Plass — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/knuth-plass/reference.ts:64-70 (the state s[to], row 0 of M[to] = line costs, rows r >= 1 shift, the clamp
//     that keeps the product associative), 81 (initialState), 84-94 (minPlusProduct), 97-105 (minPlusApply),
//     109-125 (statesByProductTree)
//   lab/knuth-plass/paragraph.ts:24-31 (slackLimit 63, lineCostCap 3,969, infeasible 2^22, sums within 2^23,
//     comparisons within 2^24 where FP32 holds every integer)
//   lab/knuth-plass/program.ts:137-142 (chain), 143-182 (tree), 192-216 (jumps by doubling, the binary descent)
//   src/runtime/prefix-networks.ts:26-44 (brentKungPrefix)
//   lab/knuth-plass/README.md:167-168 (ops and layers at n = 1,024, W = 32), 172-180 (µs table), 185 (10.2 times the
//     operations, 1.7 to 7.7 times the µs), 186 (26 products of 32 × 32 tiles, about 1.65 million operations),
//     187 (commits de04d25 and a1b3b7b; nothing measured again), 188 (75 µs against 2,925 µs)
//   lab/status.md:240 (costs, pointers and breaks equal the reference on random paragraphs with ties; lab-reported)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The four-box tiles, the states, the product M3 ⊗ M2, the predecessors, both jump tables and the
// descent are computed below with the reference's own formulas from the probe's line costs (review.md:67), and the
// module throws if they disagree with the probe. Both 16-point networks are the real chain and the real
// brentKungPrefix run on 16 items (their depths are computed); the 1,024-point counters, operations and µs are the
// README's table. Changes to the plan: no source pointers on screen (the amber tag reads "pre-update times" instead
// of "README.md:187"), and the ratio range is recomputed from the README's nine µs rows.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const BLUE = '#38bdf8'; // the tree and the chosen points, fixed so they never read as neutral
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** per-item progress from one group channel: item i starts `each` after item i-1 */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// The reference's min-plus algebra on the four-box paragraph (reference.ts:64-105), exact
// ---------------------------------------------------------------------------

const INF = 2 ** 22; // paragraph.ts:29, infeasible
const LINE_COST_CAP = 63 * 63; // paragraph.ts:24-25
const W4 = 4;
// the probe's line costs (review.md:67); (0, 3) does not fit
const LINE_COST: Record<string, number> = { '0,1': 9, '0,2': 0, '1,2': 16, '1,3': 1, '2,3': 16, '0,3': INF };
const lineCost = (from: number, to: number): number => {
  const c = LINE_COST[`${from},${to}`];
  if (c === undefined) throw new Error(`no probe line cost for ${from},${to}`);
  return c;
};
type Mat = number[][];
/** M[to]: row 0 holds the line costs into `to`, row r >= 1 moves cost r - 1 to place r (reference.ts:66-67, 71-79) */
const leaf = (to: number): Mat =>
  Array.from({ length: W4 }, (_, r) =>
    Array.from({ length: W4 }, (_, c) => (r === 0 ? (to - 1 - c >= 0 ? lineCost(to - 1 - c, to) : INF) : c === r - 1 ? 0 : INF)),
  );
const minPlusApply = (m: Mat, v: number[]): number[] => m.map((row) => Math.min(INF, ...row.map((a, k) => a + v[k])));
const minPlusProduct = (later: Mat, earlier: Mat): Mat =>
  later.map((row) => Array.from({ length: W4 }, (_, c) => Math.min(INF, ...row.map((a, k) => a + earlier[k][c]))));

const M2 = leaf(2);
const M3 = leaf(3);
const S0 = Array.from({ length: W4 }, (_, i) => (i === 0 ? 0 : INF));
const S1 = minPlusApply(leaf(1), S0);
const S2 = minPlusApply(M2, S1);
const S3 = minPlusApply(M3, S2);
const M32 = minPlusProduct(M3, M2);
const S3_TREE = minPlusApply(M32, S1);
const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
if (!same(M3[0], [16, 1, INF, INF])) throw new Error('M3 row 0 disagrees with the probe');
if (!same(S2, [0, 9, 0, INF]) || !same(S3, [10, 0, 9, 0])) throw new Error('states disagree with the probe');
if (!same(M32[0], [1, 16, INF, INF]) || !same(S3_TREE, S3)) throw new Error('the product disagrees');
/** row 0 of M3 against s[2]: the four candidate sums, clamped */
const CANDS = M3[0].map((a, k) => ({ a, b: S2[k], sum: Math.min(INF, a + S2[k]) }));
const WIN = CANDS.findIndex((c) => c.sum === S3[0]);

// predecessors by the reference loop (reference.ts:31-45) for 1..3, and the probe's cost[4] = 10 from point 3
const COSTS = [0];
const PRED = [0];
for (let to = 1; to <= 3; to++) {
  let best = Infinity;
  let pred = -1;
  for (let boxes = 1; boxes <= Math.min(W4, to); boxes++) {
    const total = COSTS[to - boxes] + lineCost(to - boxes, to);
    if (total < best) {
      best = total;
      pred = to - boxes;
    }
  }
  COSTS.push(best);
  PRED.push(pred);
}
PRED.push(3); // probe: predecessors [0, 0, 0, 1, 3]
if (!same(PRED, [0, 0, 0, 1, 3]) || COSTS[3] !== 10) throw new Error('predecessors disagree with the probe');
// jumps by doubling, and the binary descent (program.ts:192-216), with breakCapacity = breakCount = 4
const BREAKS = 4;
const LEVELS = Math.max(1, Math.ceil(Math.log2(BREAKS)));
const JUMPS: number[][] = [PRED];
for (let l = 1; l < LEVELS; l++) JUMPS.push(JUMPS[l - 1].map((t) => JUMPS[l - 1][t]));
const descend = (to: number) => {
  let scan = BREAKS;
  const steps: Array<{ level: number; candidate: number; advances: boolean }> = [];
  for (let l = LEVELS - 1; l >= 0; l--) {
    const candidate = JUMPS[l][scan];
    const advances = candidate >= to;
    steps.push({ level: l, candidate, advances });
    if (advances) scan = candidate;
  }
  return { scan, steps, chosen: scan === to };
};
const CHOSEN = [1, 2, 3, 4].filter((to) => descend(to).chosen);
const DEMO = descend(2); // the interesting one: it ends on 3, not 2
if (!same(JUMPS[1], [0, 0, 0, 0, 1]) || !same(CHOSEN, [1, 3, 4]) || DEMO.scan !== 3) throw new Error('descent disagrees');
const LEVELS_1024 = Math.ceil(Math.log2(1024));

// ---------------------------------------------------------------------------
// The two forms as prefix networks on 16 sample items (prefix-networks.ts:30-44), and the README's 1,024 counts
// ---------------------------------------------------------------------------

type Combine = { e: number; i: number; depth: number };
function network(n: number, form: 'chain' | 'tree'): { combines: Combine[]; depth: number } {
  const d = new Array(n).fill(0);
  const combines: Combine[] = [];
  const combine = (e: number, i: number) => {
    d[i] = Math.max(d[e], d[i]) + 1;
    combines.push({ e, i, depth: d[i] });
  };
  if (form === 'chain') for (let i = 1; i < n; i++) combine(i - 1, i);
  else {
    let span = 1;
    for (; span < n; span *= 2) for (let i = 2 * span - 1; i < n; i += 2 * span) combine(i - span, i);
    for (span /= 2; span >= 1; span /= 2) for (let i = 3 * span - 1; i < n; i += 2 * span) combine(i - span, i);
  }
  return { combines, depth: Math.max(...d) };
}
const CHAIN16 = network(16, 'chain');
const TREE16 = network(16, 'tree');
if (network(1024, 'tree').combines.length !== 2036) throw new Error('Brent-Kung combines disagree with README.md:186');
if (TREE16.depth !== 2 * 4 - 2) throw new Error('Brent-Kung depth');

const CHAIN = { ops: 277_068, layers: 10_232, us: 2_925 }; // README.md:167, 180
const TREE = { ops: 2_823_382, layers: 230, us: 22_445 }; // README.md:168, 180
const REF_US = 74.8; // README.md:180, "about seventy-five"
const OPS_RATIO = TREE.ops / CHAIN.ops; // 10.19
// README.md:172-180, chain and tree µs at the nine sizes
const US_ROWS: Array<[number, number]> = [[54.0, 91.7], [84.0, 165], [122, 287], [251, 520], [373, 1327], [564, 3322], [1152, 2408], [1799, 7100], [2925, 22445]];
const US_RATIOS = US_ROWS.map(([c, t]) => t / c);
const US_LO = Math.min(...US_RATIOS).toFixed(1); // 1.7
const US_HI = Math.max(...US_RATIOS).toFixed(1); // 7.7
const METRICS = [
  { name: 'layers', chain: CHAIN.layers, tree: TREE.layers, unit: '' },
  { name: 'operations', chain: CHAIN.ops, tree: TREE.ops, unit: '' },
  { name: 'µs per evaluation', chain: CHAIN.us, tree: TREE.us, unit: ' µs' },
];

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const C = 56; // tile cell
const G = 4;
const TILE = W4 * C + (W4 - 1) * G; // 236
const TY = 200; // tile top
const cellXY = (x0: number, r: number, c: number) => ({ x: x0 + c * (C + G), y: TY + r * (C + G) });
const S2X = 600;
const S3X = 760;
const M2X = 470;
const PX = 830;

// lanes
const RIB = { x0: 90, x1: 1190, y: 100 };
const LANE_Y = 178;
const LV = 18;
const CHX = (i: number) => 110 + i * 30;
const TRX = (i: number) => 720 + i * 30;
const PROD_NODE = TREE16.combines.find((c) => c.e === 2 && c.i === 3)!;
const PROD_TARGET = { x: TRX(3), y: LANE_Y + PROD_NODE.depth * LV };

// bars
const BAR = { x: 270, w: 540, h: 34, ys: [260, 330, 400] };
const BIG = { x: 960, y: 232, cell: 6.5 };

// posts
const PX5 = (i: number) => 290 + i * 175;
const POST_Y = 330;

const HOME: CameraState = CAMERA_HOME;
const CAM_TILE: CameraState = { x: 580, y: 340, k: 1.22 };
const CAM_PAIR: CameraState = { x: 618, y: 330, k: 1.08 };
const CAM_CHAIN: CameraState = { x: 520, y: 340, k: 1.1 };
const CAM_BARS: CameraState = { x: 560, y: 330, k: 1.12 };
const CAM_POSTS: CameraState = { x: 640, y: 350, k: 1.1 };

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ≈175 s
// ---------------------------------------------------------------------------

const CAPTIONS = [
  "Each step of that running minimum can be written as a matrix. The state holds the latest costs, one per box in the window. The matrix has this break point's line costs on top and shifts older costs down.",
  'Multiplying is min-plus: add the entries, then keep the smallest. For point three, sixteen plus zero, or one plus nine. The smaller, ten, becomes the new top cost, and the others shift down.',
  'Min-plus products are associative, once sums are clamped at the infeasible value. So two steps merge into one matrix of the same size, and any grouping of steps gives the same answer.',
  'The chain form takes the steps in order. At one thousand twenty-four break points and a window of thirty-two boxes, that is ten thousand two hundred thirty-two layers, each waiting on the one before.',
  "The tree form merges neighbours, then merges the merged pairs, in Brent-Kung's prefix network. The same breaks come out in only two hundred thirty layers.",
  "The price is work. Merging two tiles of thirty-two by thirty-two is expensive. The tree totals two million eight hundred twenty-three thousand operations, about ten times the chain's two hundred seventy-seven thousand.",
  "On the lab's own executor, the tree is slower than the chain at every size measured, taking one point seven to seven point seven times as long. Fewer layers did not buy speed there.",
  'A plain loop beats both. For one thousand twenty-four break points it takes about seventy-five microseconds, against two thousand nine hundred twenty-five for the chain.',
  "Those times are historical. One later commit cut the executor's cost per layer, and another cut compile time and memory. So the chain is probably faster now. The notes did not measure again.",
  'Every value is a whole number below sixteen million, so thirty-two-bit floats hold it exactly. The lab reports that costs, pointers and breaks equal the plain reference on random paragraphs, ties included.',
  'Last, reading the answer. Our remembered points are zero, zero, zero, one, three. The circuit doubles them: apply the table to itself, and each entry hops two steps. From point four, one hop lands on point one.',
  'A few such tables let every break point check, in a fixed number of steps, whether it lies on the path back from the end. Points one, three and four do. Doubling is the tree idea again: depth that grows slowly.',
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', HOME, cameraInterp);
  const ch = (key: string, v = 0) => tl.channel(key, v);
  // S1 · the tile
  const formulaU = ch('formulaU');
  const tileU = ch('tileU');
  const sU = ch('s2U');
  const rowHi = ch('row0Hi');
  const colLbl = ch('colLabels');
  const shiftHi = ch('shiftHi');
  const s3U = ch('s3Frame');
  const candU = ch('candidates');
  const winU = ch('winner');
  const shiftU = ch('shiftU');
  const s1Op = ch('stateOp', 1);
  const m3X = ch('m3X', 300);
  const m2U = ch('m2U');
  const clampU = ch('clampU');
  const prodU = ch('prodU');
  const pairOp = ch('pairOp', 1);
  const assocU = ch('assocU');
  const checkU = ch('checkU');
  const badgeU = ch('badgeU');
  const pairOut = ch('pairOut', 1);
  const prodFly = ch('prodFly');
  // S2 · the lanes
  const ribU = ch('ribbonU');
  const laneU = ch('laneU');
  const chainU = ch('chainU');
  const chainOp = ch('chainOp', 1);
  const treeOp = ch('treeOp', 0.15);
  const treeU = ch('treeU');
  const treeCtr = ch('treeCounter');
  const chainCtrOp = ch('chainCounterOp', 1);
  const lanesOp = ch('lanesOp', 1);
  // S3 · the bars
  const barsU = ch('barsU');
  const metric = ch('metric');
  const bigU = ch('bigTileU');
  const bigOp = ch('bigTileOp', 1);
  const opsTag = ch('opsTag');
  const usTag = ch('usTag');
  const refU = ch('refU');
  const treeRowOp = ch('treeRowOp', 1);
  const barsOp = ch('barsOp', 1);
  const stampU = ch('stampU');
  // S4 · the number line
  const lineU = ch('lineU');
  const marksU = ch('marksU');
  const fp32U = ch('fp32Badge');
  const refBadgeU = ch('refBadge');
  const s4Op = ch('lineOp', 1);
  // S5 · reading the answer
  const postsU = ch('postsU');
  const j0U = ch('jumps0U');
  const dblU = ch('doubleHi');
  const j1U = ch('jumps1U');
  const longU = ch('longArcU');
  const ringOp = ch('ringOp');
  const ringAt = ch('ringAt', 4);
  const probeU = ch('probeU');
  const chosenU = ch('chosenU');
  const payU = ch('payoffU');

  // every caption gets ~150 wpm plus a short hold after it
  const A: number[] = [];
  let t = 0.4;
  for (const text of CAPTIONS) {
    const dur = +(text.split(/\s+/).length * 0.4 + 0.6).toFixed(1);
    A.push(t);
    tl.caption({ at: t, dur, text });
    t = tl.hold(t + dur, 0.6);
  }
  const go = (c: ChannelRef<number>, to: number, at: number, dur: number, e = ease.enter) => tl.tween(c, to, { at, dur, ease: e });

  // — B0 · one step as a matrix: the state, row 0's line costs, the shift —
  let a = A[0];
  tl.tween(cam, CAM_TILE, { at: a + 0.3, dur: 1.4, ease: ease.move });
  go(formulaU, 1, a + 0.6, 0.6);
  go(tileU, 1, a + 1.2, 0.8);
  go(sU, 1, a + 4.0, 0.7);
  go(rowHi, 1, a + 8.4, 0.6);
  go(colLbl, 1, a + 9.0, 0.6);
  go(rowHi, 0, a + 12.2, 0.5, ease.move);
  go(shiftHi, 1, a + 12.5, 0.6);

  // — B1 · min-plus on row 0: 16 + 0 or 1 + 9, ten wins, the rest shift —
  a = A[1];
  go(shiftHi, 0, a, 0.5, ease.move);
  go(rowHi, 1, a + 0.3, 0.6);
  go(s3U, 1, a + 0.8, 0.6);
  go(candU, 2, a + 4.2, 3.0, ease.linear);
  go(candU, 4, a + 7.4, 0.8, ease.linear);
  go(winU, 1, a + 9.0, 0.6, ease.pop);
  go(shiftU, 1, a + 10.8, 1.4, ease.linear);

  // — B2 · associative: M3 ⊗ M2 is one tile of the same size —
  a = A[2];
  go(s1Op, 0, a, 0.8, ease.move);
  go(rowHi, 0, a, 0.6, ease.move);
  go(formulaU, 0, a, 0.6, ease.move);
  tl.tween(cam, CAM_PAIR, { at: a + 0.2, dur: 1.3, ease: ease.move });
  go(m3X, 170, a + 0.2, 1.3, ease.move);
  go(m2U, 1, a + 0.9, 0.8);
  go(clampU, 1, a + 2.6, 0.6);
  go(prodU, 16, a + 5.0, 2.0, ease.linear);
  go(pairOp, 0.15, a + 7.4, 0.6, ease.move);
  go(assocU, 1, a + 9.0, 0.6);
  go(checkU, 1, a + 10.2, 0.6);
  go(badgeU, 1, a + 11.2, 0.5, ease.pop);

  // — B3 · the chain: 10,232 layers, each waiting on the last —
  a = A[3];
  go(pairOut, 0, a, 0.7, ease.move);
  go(prodFly, 1, a + 0.3, 1.4, ease.move);
  tl.tween(cam, CAM_CHAIN, { at: a + 0.2, dur: 1.4, ease: ease.move });
  go(ribU, 1, a + 0.8, 1.2, ease.draw);
  go(laneU, 1, a + 1.4, 0.8);
  go(chainU, 1, a + 3.4, 8.0, ease.linear);

  // — B4 · the tree: Brent-Kung, 230 layers —
  a = A[4];
  tl.tween(cam, HOME, { at: a, dur: 1.2, ease: ease.move });
  go(chainOp, 0.15, a, 0.6, ease.move);
  go(chainCtrOp, 0.7, a, 0.6, ease.move);
  go(treeOp, 1, a + 0.2, 0.6);
  go(treeU, TREE16.depth, a + 0.9, 5.4, ease.linear);
  go(treeCtr, 1, a + 6.4, 1.6, ease.move);

  // — B5 · the price is work: bars flip from layers to operations —
  a = A[5];
  go(lanesOp, 0, a, 0.8, ease.move);
  go(barsU, 1, a + 0.4, 0.7);
  go(bigU, 1, a + 2.0, 3.2, ease.linear);
  go(metric, 1, a + 5.6, 1.4, ease.move);
  go(opsTag, 1, a + 9.6, 0.6);

  // — B6 · on the lab's executor the tree is slower —
  a = A[6];
  go(bigOp, 0, a, 0.6, ease.move);
  go(opsTag, 0, a, 0.5, ease.move);
  tl.tween(cam, CAM_BARS, { at: a + 0.3, dur: 1.3, ease: ease.move });
  go(metric, 2, a + 0.6, 1.4, ease.move);
  go(usTag, 1, a + 6.0, 0.6);

  // — B7 · the plain loop: a sliver —
  a = A[7];
  go(usTag, 0, a, 0.5, ease.move);
  go(treeRowOp, 0.15, a + 0.2, 0.6, ease.move);
  go(refU, 1, a + 0.8, 0.6, ease.pop);

  // — B8 · historical: the amber stamp —
  a = A[8];
  go(treeRowOp, 1, a, 0.6, ease.move);
  go(barsOp, 0.3, a + 0.3, 0.8, ease.move);
  go(stampU, 1, a + 0.6, 0.8, ease.move);

  // — B9 · whole numbers under 2^24 —
  a = A[9];
  go(barsOp, 0, a, 0.7, ease.move);
  go(stampU, 0, a, 0.7, ease.move);
  tl.tween(cam, HOME, { at: a, dur: 1.2, ease: ease.move });
  go(lineU, 1, a + 0.6, 1.3, ease.draw);
  go(marksU, 4, a + 1.8, 3.6, ease.linear);
  go(fp32U, 1, a + 6.0, 0.5, ease.pop);
  go(refBadgeU, 1, a + 8.2, 0.6);

  // — B10 · the remembered points, doubled —
  a = A[10];
  go(s4Op, 0, a, 0.7, ease.move);
  tl.tween(cam, CAM_POSTS, { at: a + 0.2, dur: 1.4, ease: ease.move });
  go(postsU, 1, a + 0.5, 0.8);
  go(j0U, 1, a + 2.0, 2.6, ease.linear);
  go(dblU, 1, a + 6.2, 0.6);
  go(j1U, 1, a + 7.6, 2.0, ease.linear);
  go(longU, 1, a + 11.0, 1.2, ease.draw);

  // — B11 · the descent: every point checks in two steps; 1, 3, 4 are on the path —
  a = A[11];
  go(dblU, 0, a, 0.6, ease.move);
  go(ringOp, 1, a + 0.8, 0.5);
  go(probeU, 1, a + 2.0, 0.8, ease.draw); // level 1: jumps[1][4] = 1 < 2, stay
  go(probeU, 2, a + 3.6, 0.5, ease.move);
  go(ringAt, 3, a + 4.2, 1.0, ease.move); // level 0: jumps[0][4] = 3 >= 2, move
  go(ringOp, 0, a + 7.4, 0.6, ease.move);
  go(chosenU, 1, a + 8.0, 0.6, ease.pop);
  tl.tween(cam, HOME, { at: a + 11.2, dur: 1.4, ease: ease.move });
  go(payU, 1, a + 11.8, 0.8);
  tl.hold(t, 2.0);

  return {
    tl, cam, formulaU, tileU, sU, rowHi, colLbl, shiftHi, s3U, candU, winU, shiftU, s1Op, m3X, m2U, clampU, prodU,
    pairOp, assocU, checkU, badgeU, pairOut, prodFly, ribU, laneU, chainU, chainOp, treeOp, treeU, treeCtr, chainCtrOp,
    lanesOp, barsU, metric, bigU, bigOp, opsTag, usTag, refU, treeRowOp, barsOp, stampU, lineU, marksU, fp32U,
    refBadgeU, s4Op, postsU, j0U, dblU, j1U, longU, ringOp, ringAt, probeU, chosenU, payU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local kit
// ---------------------------------------------------------------------------

const show = (v: number) => (v >= INF ? '∞' : String(v));

function Cell({ x, y, w = C, h = C, text, tone, opacity = 1, stroke, size = 22 }: {
  x: number; y: number; w?: number; h?: number; text: string; tone: string; opacity?: number; stroke?: string; size?: number;
}) {
  if (opacity <= 0.005) return null;
  const inf = text === '∞';
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} stroke={stroke ?? colors.GRID} strokeWidth={stroke ? 2 : 1} />
      <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fontFamily={MONO} fontWeight={600} fill={inf ? colors.ink.muted : tone}>
        {text}
      </text>
    </g>
  );
}

/** A 4×4 min-plus tile. Row 0 carries line costs (amber), the shift zeros are muted. */
function Tile({ x0, m, opacity = 1, row0Stroke, cellU, diagHi = 0, title, bare = false }: {
  x0: number; m: Mat; opacity?: number; row0Stroke?: number; cellU?: (r: number, c: number) => number; diagHi?: number; title: string; bare?: boolean;
}) {
  if (opacity <= 0.005) return null;
  if (bare) return <rect x={x0} y={TY} width={TILE} height={TILE} rx={30} fill={BLUE} opacity={opacity} />;
  return (
    <g opacity={opacity}>
      <text x={x0 + TILE / 2} y={TY - 16} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
        {title}
      </text>
      {m.map((row, r) =>
        row.map((v, c) => {
          const { x, y } = cellXY(x0, r, c);
          const u = cellU ? cellU(r, c) : 1;
          const diag = r >= 1 && c === r - 1;
          const stroke = r === 0 && (row0Stroke ?? 0) > 0.01 ? colors.WARM : diag && diagHi > 0.01 ? colors.SECONDARY : undefined;
          return (
            <Cell key={`${r}-${c}`} x={x} y={y} text={show(v)} tone={r === 0 ? colors.WARM : colors.SECONDARY} opacity={u} stroke={stroke} />
          );
        }),
      )}
      {(row0Stroke ?? 0) > 0.01 && (
        <rect x={x0 - 5} y={TY - 5} width={TILE + 10} height={C + 10} rx={9} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={row0Stroke} />
      )}
    </g>
  );
}

function Column({ x, values, title, opacity = 1, cellU, hi = 0, tones }: {
  x: number; values: number[]; title: string; opacity?: number; cellU?: (r: number) => number; hi?: number; tones?: string[];
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <text x={x + C / 2} y={TY - 16} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
        {title}
      </text>
      {values.map((v, r) => {
        const u = cellU ? cellU(r) : 1;
        const y = TY + r * (C + G);
        return (
          <g key={r}>
            <rect x={x} y={y} width={C} height={C} rx={6} fill="none" stroke={colors.GRID} strokeDasharray="4 4" />
            <Cell x={x} y={y} text={show(v)} tone={tones?.[r] ?? colors.TEXT} opacity={u} />
          </g>
        );
      })}
      {hi > 0.01 && <rect x={x - 5} y={TY - 5} width={C + 10} height={TILE + 10} rx={9} fill="none" stroke={BLUE} strokeWidth={2} opacity={hi} />}
    </g>
  );
}

function Pill({ x, y, text, color, opacity, size = 15, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity: number; size?: number; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * size * 0.56 + 28;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - size - 6} width={w} height={size + 18} rx={(size + 18) / 2} fill={fill} stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 2} textAnchor="middle" fontSize={size} fontFamily={UI} fill={color}>
        {text}
      </text>
    </g>
  );
}

/** One prefix network on 16 sample items: wires, then combines appearing by depth. */
function Network({ x, combines, depth, shown, opacity, color }: {
  x: (i: number) => number; combines: Combine[]; depth: number; shown: number; opacity: number; color: string;
}) {
  if (opacity <= 0.005) return null;
  const yOf = (d: number) => LANE_Y + d * LV;
  return (
    <g opacity={opacity}>
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i}>
          <line x1={x(i)} y1={LANE_Y} x2={x(i)} y2={yOf(depth) + 6} stroke={colors.GRID} strokeWidth={1.5} />
          <rect x={x(i) - 7} y={LANE_Y - 7} width={14} height={14} rx={3} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
        </g>
      ))}
      {combines.map((cb, k) => {
        const u = clamp01(shown - (cb.depth - 1));
        if (u <= 0) return null;
        const y = yOf(cb.depth);
        const x0 = x(cb.e);
        const y0 = y - LV + 4;
        return (
          <g key={k} opacity={u}>
            <line x1={x0} y1={y0} x2={lerp(x0, x(cb.i), u)} y2={lerp(y0, y, u)} stroke={color} strokeWidth={2} strokeLinecap="round" />
            <circle cx={x0} cy={y0} r={2.5} fill={color} />
            <rect x={x(cb.i) - 5} y={y - 5} width={10} height={10} rx={2} fill={color} opacity={u >= 1 ? 1 : 0} />
          </g>
        );
      })}
    </g>
  );
}

/** A quadratic arc from post a to post b, above (dir -1) or below (+1), with an arrowhead at b. */
function Arc({ a, b, dir, u, color, opacity = 1, width = 2.5 }: {
  a: number; b: number; dir: 1 | -1; u: number; color: string; opacity?: number; width?: number;
}) {
  if (u <= 0 || opacity <= 0.005) return null;
  const xa = PX5(a), xb = PX5(b);
  const span = Math.abs(a - b);
  const y0 = POST_Y + dir * 24;
  const cy = y0 + dir * 2 * (36 + 30 * span);
  const cx = (xa + xb) / 2;
  const pts: string[] = [];
  const N = 40;
  const n = Math.max(1, Math.round(N * clamp01(u)));
  let tip = { x: xa, y: y0 }, prev = tip;
  for (let i = 0; i <= n; i++) {
    const t = i / N, m = 1 - t;
    const p = { x: m * m * xa + 2 * m * t * cx + t * t * xb, y: m * m * y0 + 2 * m * t * cy + t * t * y0 };
    pts.push(`${p.x},${p.y}`);
    prev = tip;
    tip = p;
  }
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const hd = 10;
  return (
    <g opacity={opacity}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      {u >= 0.98 && (
        <path
          d={`M ${tip.x} ${tip.y} L ${tip.x - hd * Math.cos(ang - 0.45)} ${tip.y - hd * Math.sin(ang - 0.45)} L ${tip.x - hd * Math.cos(ang + 0.45)} ${tip.y - hd * Math.sin(ang + 0.45)} Z`}
          fill={color}
        />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (c: ChannelRef<number>): number => s.get(c);
  const cam = s.get(scene.cam);

  // ---- S1
  const s1Op = v(scene.s1Op);
  const tileU = v(scene.tileU);
  const rowHi = v(scene.rowHi);
  const shiftHi = v(scene.shiftHi);
  const candU = v(scene.candU);
  const winU = v(scene.winU);
  const shiftU = v(scene.shiftU);
  const m3X = v(scene.m3X);
  const m2U = v(scene.m2U);
  const prodU = v(scene.prodU);
  const pairOut = v(scene.pairOut);
  const pairOp = v(scene.pairOp) * pairOut;
  const fly = v(scene.prodFly);
  const s1Group = tileU * pairOut;

  // ---- S2
  const lanesOp = v(scene.lanesOp);
  const laneU = v(scene.laneU) * lanesOp;
  const ribU = v(scene.ribU) * lanesOp;
  const chainRaw = v(scene.chainU);
  const chainP = chainRaw * chainRaw; // the token accelerates
  const treeU = v(scene.treeU);
  const treeOp = v(scene.treeOp);
  const treeCtr = v(scene.treeCtr);

  // ---- S3
  const barsOp = v(scene.barsU) * v(scene.barsOp);
  const metric = v(scene.metric);
  const mLo = Math.min(2, Math.floor(metric));
  const mHi = Math.min(2, mLo + 1);
  const mF = metric - mLo;
  const len = (row: 'chain' | 'tree') => {
    const at = (k: number) => METRICS[k][row] / Math.max(METRICS[k].chain, METRICS[k].tree);
    return BAR.w * lerp(at(mLo), at(mHi), mF);
  };
  const mNear = Math.round(metric);
  const textOp = clamp01(1 - 2.2 * Math.abs(metric - mNear));
  const refU = v(scene.refU);
  const treeRowOp = v(scene.treeRowOp);
  const bigU = v(scene.bigU);
  const bigOp = v(scene.bigOp) * barsOp * (bigU > 0 ? 1 : 0);
  const stampU = v(scene.stampU);

  // ---- S4
  const s4Op = v(scene.s4Op);
  const lineU = v(scene.lineU) * s4Op;
  const marksU = v(scene.marksU);

  // ---- S5
  const postsU = v(scene.postsU);
  const j0U = v(scene.j0U);
  const dblU = v(scene.dblU);
  const j1U = v(scene.j1U);
  const longU = v(scene.longU);
  const ringOp = v(scene.ringOp);
  const ringAt = v(scene.ringAt);
  const probeU = v(scene.probeU);
  const chosenU = v(scene.chosenU);
  const payU = v(scene.payU);

  // the flying product tile: big at PX, small on the tree node
  const flyS = lerp(1, 12 / TILE, fly);
  const flyX = lerp(PX, PROD_TARGET.x - 6, fly);
  const flyY = lerp(TY, PROD_TARGET.y - 6, fly);
  const flyOp = fly <= 0 ? 0 : fly < 1 ? 1 : lanesOp * (treeU >= PROD_NODE.depth ? 1 : 0.4);

  const NL = { x0: 140, x1: 1140, y: 330 };
  const nlX = (val: number) => NL.x0 + (NL.x1 - NL.x0) * (val / 2 ** 24);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= S1 · one step as a matrix ================= */}
        {s1Group > 0.005 && (
          <g>
            <text x={580} y={118} textAnchor="middle" fontSize={28} fontFamily={MONO} fontWeight={600} fill={colors.TEXT} opacity={v(scene.formulaU)}>
              M3 ⊗ s[2] = s[3]
            </text>
            <text x={580} y={148} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.formulaU)}>
              ∞ = infeasible = 2²² = {commas(INF)}
            </text>
            <Tile
              x0={m3X}
              m={M3}
              title="M3"
              opacity={tileU * lerp(1, pairOp, clamp01(prodU / 16))}
              row0Stroke={rowHi}
              diagHi={shiftHi}
              cellU={(r, c) => staggerU(tileU, r * 4 + c, 16, 0.04, 0.4)}
            />
            {/* row and column labels for M3 */}
            <g opacity={s1Op}>
              <text x={m3X - 12} y={TY + C / 2 + 5} textAnchor="end" fontSize={14} fill={colors.WARM} opacity={0.35 + 0.65 * rowHi}>
                line costs
              </text>
              <text x={m3X - 12} y={TY + 2 * (C + G) + C / 2 + 5} textAnchor="end" fontSize={14} fill={colors.SECONDARY} opacity={0.35 + 0.65 * shiftHi}>
                shift down
              </text>
              {['from 2', 'from 1', 'from 0', '—'].map((l, c) => (
                <text key={c} x={cellXY(m3X, 0, c).x + C / 2} y={TY + TILE + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={v(scene.colLbl) * (0.4 + 0.6 * rowHi)}>
                  {l}
                </text>
              ))}
            </g>
            <g opacity={s1Op}>
              <text x={568} y={TY + TILE / 2 + 12} textAnchor="middle" fontSize={34} fill={colors.MUTED} opacity={v(scene.sU)}>
                ⊗
              </text>
              <Column x={S2X} values={S2} title="s[2]" opacity={v(scene.sU)} hi={rowHi} />
              <text x={720} y={TY + TILE / 2 + 12} textAnchor="middle" fontSize={34} fill={colors.MUTED} opacity={v(scene.s3U)}>
                =
              </text>
              <Column
                x={S3X}
                values={S3}
                title="s[3]"
                opacity={v(scene.s3U)}
                cellU={(r) => (r === 0 ? clamp01(winU) : staggerU(shiftU, r - 1, 3, 0.25, 0.6))}
                tones={[colors.WARM, colors.TEXT, colors.TEXT, colors.TEXT]}
              />
              {['cost[3]', 'cost[2]', 'cost[1]', 'cost[0]'].map((l, r) => (
                <text key={l} x={S3X + C + 12} y={TY + r * (C + G) + C / 2 + 5} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.s3U)}>
                  {l}
                </text>
              ))}
              {/* the shift: s[2][r - 1] → s[3][r] */}
              {[1, 2, 3].map((r) => {
                const u = staggerU(shiftU, r - 1, 3, 0.25, 0.6);
                if (u <= 0) return null;
                const y1 = TY + (r - 1) * (C + G) + C / 2;
                const y2 = TY + r * (C + G) + C / 2;
                return (
                  <line key={r} x1={S2X + C + 4} y1={y1} x2={lerp(S2X + C + 4, S3X - 6, u)} y2={lerp(y1, y2, u)} stroke={colors.SECONDARY} strokeWidth={2} opacity={0.8} />
                );
              })}
              {/* the four candidate sums of row 0 */}
              {CANDS.map((cd, k) => {
                const u = clamp01(candU - k);
                if (u <= 0) return null;
                const isWin = k === WIN && winU > 0.01;
                const dead = cd.sum >= INF;
                const tone = dead ? colors.ink.muted : isWin ? colors.WARM : colors.TEXT;
                return (
                  <g key={k} opacity={u}>
                    <text x={330 + k * 140} y={512} textAnchor="middle" fontSize={17} fontFamily={MONO} fontWeight={isWin ? 700 : 500} fill={tone}>
                      {`${show(cd.a)} + ${show(cd.b)} = ${show(cd.sum)}`}
                    </text>
                    {isWin && <rect x={330 + k * 140 - 60} y={490} width={120} height={32} rx={8} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={winU} />}
                  </g>
                );
              })}
              <text x={330 + 4 * 140 - 10} y={512} fontSize={17} fontFamily={MONO} fill={colors.WARM} opacity={winU}>
                min → {S3[0]}
              </text>
            </g>
            {/* B2: M2 and the merged tile */}
            <g opacity={pairOut}>
              <text x={447} y={TY + TILE / 2 + 12} textAnchor="middle" fontSize={34} fill={colors.MUTED} opacity={m2U * pairOp}>
                ⊗
              </text>
              <Tile x0={M2X + (1 - m2U) * 60} m={M2} title="M2" opacity={m2U * pairOp} />
              <text x={779} y={TY + TILE / 2 + 12} textAnchor="middle" fontSize={34} fill={colors.MUTED} opacity={clamp01(prodU)}>
                =
              </text>
              {fly <= 0 && (
                <Tile x0={PX} m={M32} title="M3 ⊗ M2" opacity={clamp01(prodU * 4)} cellU={(r, c) => clamp01(prodU - (r * 4 + c))} />
              )}
              <text x={PX + TILE / 2} y={TY + TILE + 26} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.checkU)}>
                row 0 ⊗ s[1]: min(1 + 9, 16 + 0) = {S3_TREE[0]}
              </text>
              <text x={620} y={150} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.clampU)}>
                every sum is clamped: min(infeasible, a + b)
              </text>
              <text x={618} y={512} textAnchor="middle" fontSize={24} fontFamily={MONO} fontWeight={600} fill={colors.TEXT} opacity={v(scene.assocU)}>
                (M3 ⊗ M2) ⊗ s[1] = M3 ⊗ (M2 ⊗ s[1])
              </text>
              <Pill x={618} y={572} text="associative" color={colors.POSITIVE} opacity={v(scene.badgeU)} />
            </g>
          </g>
        )}
        {/* the product tile, flying to its node in the tree */}
        {flyOp > 0.005 && (
          <g opacity={flyOp} transform={`translate(${flyX}, ${flyY}) scale(${flyS}) translate(${-PX}, ${-TY})`}>
            <Tile x0={PX} m={M32} title="M3 ⊗ M2" bare={fly > 0.35} />
          </g>
        )}

        {/* ================= S2 · chain and tree on the same paragraph ================= */}
        {lanesOp > 0.005 && laneU + ribU > 0.005 && (
          <g>
            <g opacity={ribU}>
              <text x={RIB.x0} y={RIB.y - 18} fontSize={15} fill={colors.MUTED}>
                the paragraph: n = 1,024 break points · window W = 32 boxes
              </text>
              <line x1={RIB.x0} y1={RIB.y} x2={lerp(RIB.x0, RIB.x1, ribU)} y2={RIB.y} stroke={colors.MUTED} strokeWidth={12} strokeDasharray="0.55 0.52" opacity={0.6} />
              <line x1={RIB.x0} y1={RIB.y} x2={lerp(RIB.x0, RIB.x1, chainP)} y2={RIB.y} stroke={colors.WARM} strokeWidth={12} strokeDasharray="0.55 0.52" opacity={v(scene.chainOp) > 0.5 ? 1 : 0.5} />
              {chainRaw > 0 && chainRaw < 1 && <circle cx={lerp(RIB.x0, RIB.x1, chainP)} cy={RIB.y} r={8} fill={colors.WARM} />}
            </g>
            <g opacity={laneU}>
              <g opacity={Math.max(v(scene.chainOp), 0.15)}>
                <text x={90} y={150} fontSize={22} fontWeight={700} fill={colors.TEXT}>
                  chain
                </text>
                <text x={160} y={150} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  form === 'chain' · one step after another
                </text>
              </g>
              <Network x={CHX} combines={CHAIN16.combines} depth={CHAIN16.depth} shown={chainP * CHAIN16.depth} opacity={v(scene.chainOp)} color={colors.WARM} />
              <text x={90} y={LANE_Y + CHAIN16.depth * LV + 30} fontSize={14} fill={colors.MUTED} opacity={v(scene.chainOp)}>
                16-point sample: {CHAIN16.depth} combines deep
              </text>
              <g opacity={v(scene.chainCtrOp)}>
                <text x={90} y={512} fontSize={14} fill={colors.MUTED}>
                  layers at n = 1,024, W = 32
                </text>
                <text x={90} y={548} fontSize={32} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>
                  {commas(CHAIN.layers * chainP)}
                </text>
              </g>
              <g opacity={treeOp}>
                <text x={700} y={150} fontSize={22} fontWeight={700} fill={colors.TEXT}>
                  tree
                </text>
                <text x={756} y={150} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  brentKungPrefix · statesByProductTree
                </text>
              </g>
              <Network x={TRX} combines={TREE16.combines} depth={TREE16.depth} shown={treeU} opacity={treeOp} color={BLUE} />
              <text x={700} y={LANE_Y + TREE16.depth * LV + 30} fontSize={14} fill={colors.MUTED} opacity={treeOp * clamp01(treeU - TREE16.depth + 1)}>
                16-point sample: {TREE16.depth} combines deep · up the pairs, then back down
              </text>
              <g opacity={treeOp * (treeCtr > 0 ? 1 : 0)}>
                <text x={700} y={512} fontSize={14} fill={colors.MUTED}>
                  layers at n = 1,024, W = 32
                </text>
                <text x={700} y={548} fontSize={32} fontFamily={MONO} fontWeight={700} fill={BLUE}>
                  {commas(TREE.layers * treeCtr)}
                </text>
              </g>
            </g>
          </g>
        )}

        {/* ================= S3 · layers → operations → µs ================= */}
        {barsOp > 0.005 && (
          <g opacity={barsOp}>
            {METRICS.map((m, k) => (
              <text key={k} x={BAR.x} y={190} fontSize={26} fontWeight={700} fill={colors.TEXT} opacity={clamp01(1 - 1.6 * Math.abs(metric - k))}>
                {m.name}
              </text>
            ))}
            <text x={BAR.x} y={218} fontSize={14} fill={colors.MUTED}>
              {metric > 1.5 ? "n = 1,024 · W = 32 · the lab's CPU executor, before the update" : 'n = 1,024 break points · W = 32'}
            </text>
            {(['chain', 'tree'] as const).map((row, k) => {
              const y = BAR.ys[k];
              const col = row === 'chain' ? colors.WARM : BLUE;
              const l = Math.max(3, len(row));
              const op = row === 'tree' ? treeRowOp : 1;
              const val = METRICS[mNear][row];
              return (
                <g key={row} opacity={op}>
                  <text x={BAR.x - 16} y={y + BAR.h / 2 + 6} textAnchor="end" fontSize={18} fontWeight={600} fill={colors.TEXT}>
                    {row}
                  </text>
                  <rect x={BAR.x} y={y} width={l} height={BAR.h} rx={4} fill={col} opacity={0.85} />
                  <text x={BAR.x + l + 12} y={y + BAR.h / 2 + 6} fontSize={17} fontFamily={MONO} fill={colors.TEXT} opacity={textOp}>
                    {commas(val)}
                    {METRICS[mNear].unit}
                  </text>
                </g>
              );
            })}
            <text x={BAR.x} y={BAR.ys[1] + BAR.h + 22} fontSize={14} fill={BLUE} opacity={v(scene.opsTag)}>
              {OPS_RATIO.toFixed(1)} × the chain's operations
            </text>
            <text x={BAR.x} y={BAR.ys[1] + BAR.h + 22} fontSize={14} fill={BLUE} opacity={v(scene.usTag)}>
              {US_LO} to {US_HI} × the chain's µs, at every size measured
            </text>
            {refU > 0.005 && (
              <g opacity={refU}>
                <text x={BAR.x - 16} y={BAR.ys[2] + BAR.h / 2 + 6} textAnchor="end" fontSize={18} fontWeight={600} fill={colors.TEXT}>
                  plain loop
                </text>
                <rect x={BAR.x} y={BAR.ys[2]} width={Math.max(3, (BAR.w * REF_US) / TREE.us) * clamp01(refU)} height={BAR.h} rx={1.5} fill={colors.POSITIVE} />
                <text x={BAR.x + 16} y={BAR.ys[2] + BAR.h / 2 + 6} fontSize={17} fontFamily={MONO} fill={colors.POSITIVE}>
                  75 µs
                </text>
                <text x={BAR.x + 90} y={BAR.ys[2] + BAR.h / 2 + 6} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  knuthPlass in reference.ts
                </text>
              </g>
            )}
            {/* one merge of two 32 × 32 tiles */}
            {bigOp > 0.005 && (
              <g opacity={bigOp}>
                <text x={BIG.x + 104} y={BIG.y - 14} textAnchor="middle" fontSize={15} fill={colors.TEXT}>
                  merging two 32 × 32 tiles
                </text>
                <rect x={BIG.x} y={BIG.y} width={32 * BIG.cell} height={32 * BIG.cell} fill={colors.PANEL} stroke={colors.GRID} />
                {Array.from({ length: 32 }, (_, r) => {
                  const u = clamp01(bigU * 32 - r);
                  return u > 0 ? <rect key={r} x={BIG.x} y={BIG.y + r * BIG.cell} width={32 * BIG.cell * u} height={BIG.cell} fill={BLUE} opacity={0.55} /> : null;
                })}
                {Array.from({ length: 33 }, (_, i) => (
                  <g key={i}>
                    <line x1={BIG.x + i * BIG.cell} y1={BIG.y} x2={BIG.x + i * BIG.cell} y2={BIG.y + 32 * BIG.cell} stroke={colors.BG} strokeWidth={0.8} />
                    <line x1={BIG.x} y1={BIG.y + i * BIG.cell} x2={BIG.x + 32 * BIG.cell} y2={BIG.y + i * BIG.cell} stroke={colors.BG} strokeWidth={0.8} />
                  </g>
                ))}
                <text x={BIG.x + 104} y={BIG.y + 32 * BIG.cell + 24} textAnchor="middle" fontSize={14} fill={colors.MUTED}>
                  1,024 entries, each a minimum of 32 sums
                </text>
                <text x={BIG.x + 104} y={BIG.y + 32 * BIG.cell + 46} textAnchor="middle" fontSize={14} fill={colors.MUTED}>
                  26 such merges ≈ 1.65 million operations
                </text>
              </g>
            )}
          </g>
        )}
        {stampU > 0.005 && (
          <g opacity={stampU} transform={`translate(${(1 - stampU) * -80}, 0)`}>
            <rect x={BAR.x - 10} y={466} width={640} height={104} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
            <text x={BAR.x + 10} y={496} fontSize={17} fontWeight={700} fill={colors.WARM}>
              pre-update times · not measured again
            </text>
            <text x={BAR.x + 10} y={522} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
              de04d25 · less executor cost per layer
            </text>
            <text x={BAR.x + 10} y={544} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
              a1b3b7b · less compile time and memory
            </text>
            <text x={BAR.x + 10} y={562} fontSize={13} fill={colors.MUTED}>
              the README's estimate for the chain's layers: about 360 µs then, about 100 µs now
            </text>
          </g>
        )}

        {/* ================= S4 · every value below 2^24 ================= */}
        {lineU > 0.005 && (
          <g opacity={s4Op}>
            <text x={NL.x0} y={190} fontSize={24} fontWeight={700} fill={colors.TEXT} opacity={lineU}>
              whole numbers, all within FP32's exact range
            </text>
            <line x1={NL.x0} y1={NL.y} x2={lerp(NL.x0, NL.x1, lineU)} y2={NL.y} stroke={colors.MUTED} strokeWidth={2.5} />
            <rect x={NL.x0} y={NL.y - 9} width={(nlX(INF) - NL.x0) * clamp01(marksU - 1)} height={18} rx={3} fill={colors.POSITIVE} opacity={0.35} />
            {[
              { val: 0, top: 'line costs ≤ lineCostCap = ' + commas(LINE_COST_CAP), color: colors.WARM, below: true },
              { val: INF, top: 'every entry ≤ infeasible = 2²² = ' + commas(INF), color: colors.POSITIVE, below: false },
              { val: 2 ** 23, top: 'a sum of two ≤ 2²³', color: colors.TEXT, below: true },
              { val: 2 ** 24, top: '2²⁴ = ' + commas(2 ** 24), color: colors.TEXT, below: false },
            ].map((mk, k) => {
              const u = clamp01(marksU - k);
              if (u <= 0) return null;
              const x = nlX(mk.val);
              const ty = mk.below ? NL.y + 44 : NL.y - 30;
              return (
                <g key={k} opacity={u}>
                  <line x1={x} y1={NL.y - 14} x2={x} y2={NL.y + 14} stroke={mk.color} strokeWidth={2.5} />
                  <text x={x} y={ty} textAnchor={k === 0 ? 'start' : k === 3 ? 'end' : 'middle'} fontSize={15} fontFamily={MONO} fill={mk.color}>
                    {mk.top}
                  </text>
                </g>
              );
            })}
            <text x={NL.x1} y={NL.y + 44} textAnchor="end" fontSize={14} fill={colors.MUTED} opacity={clamp01(marksU - 3)}>
              FP32 holds every integer up to here
            </text>
            <Pill x={440} y={470} text="exact in 32-bit floats" color={colors.POSITIVE} opacity={v(scene.fp32U)} />
            <Pill x={860} y={470} text="costs, pointers, breaks = reference · lab-reported" color={colors.MUTED} opacity={v(scene.refBadgeU)} size={14} />
          </g>
        )}

        {/* ================= S5 · reading the answer by doubling ================= */}
        {postsU > 0.005 && (
          <g opacity={postsU}>
            {/* table labels */}
            <text x={70} y={252} fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} opacity={clamp01(j0U * 3)}>
              jumps[0]
            </text>
            <text x={70} y={276} fontSize={15} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(j0U * 3)}>
              [{JUMPS[0].join(', ')}]
            </text>
            <text x={70} y={410} fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} opacity={clamp01(j1U * 3) * (chosenU > 0 ? 0.4 : 1)}>
              jumps[1]
            </text>
            <text x={70} y={434} fontSize={15} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(j1U * 3) * (chosenU > 0 ? 0.4 : 1)}>
              [{JUMPS[1].join(', ')}]
            </text>
            {/* jumps[0] above: i → pred[i] */}
            {[1, 2, 3, 4].map((i, k) => {
              const onPath = CHOSEN.includes(i);
              const dbl = (i === 4 || i === 3) && dblU > 0.01;
              const color = dbl ? colors.WARM : chosenU > 0.01 && onPath ? BLUE : colors.MUTED;
              const op = chosenU > 0.01 && !onPath ? lerp(1, 0.15, chosenU) : dblU > 0.01 && !dbl ? lerp(1, 0.3, dblU) : 1;
              return <Arc key={i} a={i} b={JUMPS[0][i]} dir={-1} u={staggerU(j0U, k, 4, 0.2, 0.5)} color={color} opacity={op} width={dbl || (onPath && chosenU > 0.01) ? 3 : 2.2} />;
            })}
            {/* jumps[1] below: i → jumps[1][i] */}
            {[1, 2, 3].map((i, k) => (
              <Arc key={i} a={i} b={JUMPS[1][i]} dir={1} u={staggerU(j1U, k, 3, 0.25, 0.5)} color={colors.SECONDARY} opacity={lerp(lerp(1, 0.3, dblU), 0.15, chosenU)} width={2} />
            ))}
            <Arc a={4} b={JUMPS[1][4]} dir={1} u={longU} color={colors.WARM} opacity={lerp(1, 0.15, chosenU)} width={3} />
            <text x={(PX5(4) + PX5(1)) / 2} y={POST_Y + 24 + 2 * (36 + 90) * 0.5 + 26} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.WARM} opacity={longU * lerp(1, 0, chosenU) * (1 - clamp01(ringOp * 2))}>
              4 → 3 → 1: one hop of jumps[1]
            </text>
            {/* the posts */}
            {[0, 1, 2, 3, 4].map((i) => {
              const lit = chosenU > 0.01 && CHOSEN.includes(i);
              const fill = lit ? BLUE : colors.PANEL;
              const stroke = i === 0 ? colors.MUTED : lit ? BLUE : i === 2 && chosenU > 0.01 ? colors.ink.muted : colors.TEXT;
              return (
                <g key={i} opacity={staggerU(postsU, i, 5, 0.08, 0.5)}>
                  <circle cx={PX5(i)} cy={POST_Y} r={22} fill={fill} fillOpacity={lit ? clamp01(chosenU) : 1} stroke={stroke} strokeWidth={2.5} />
                  <text x={PX5(i)} y={POST_Y + 7} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={lit && chosenU > 0.5 ? '#06121c' : i === 2 && chosenU > 0.01 ? colors.ink.muted : colors.TEXT}>
                    {i}
                  </text>
                </g>
              );
            })}
            {/* the descent for point 2: scan starts at 4 */}
            {ringOp > 0.005 && (
              <g opacity={ringOp}>
                <circle cx={lerp(PX5(4), PX5(3), clamp01(4 - ringAt))} cy={POST_Y} r={32} fill="none" stroke="#ffffff" strokeWidth={2} />
                <text x={640} y={128} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
                  is point 2 on the path? scan from 4
                </text>
                <text x={640} y={156} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.NEGATIVE} opacity={clamp01(probeU)}>
                  jumps[1][4] = {DEMO.steps[0].candidate} &lt; 2 · stay
                </text>
                <text x={640} y={182} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.POSITIVE} opacity={clamp01(probeU - 1)}>
                  jumps[0][4] = {DEMO.steps[1].candidate} ≥ 2 · move to {DEMO.scan} · {DEMO.scan} ≠ 2
                </text>
              </g>
            )}
            {chosenU > 0.005 && (
              <g opacity={chosenU}>
                <text x={640} y={140} textAnchor="middle" fontSize={20} fill={colors.TEXT}>
                  on the path back from 4: points {CHOSEN.join(', ')}
                </text>
                <text x={640} y={170} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                  {LEVELS} tables, {LEVELS} checks for each point
                </text>
              </g>
            )}
            {payU > 0.005 && (
              <g opacity={payU}>
                <rect x={330} y={498} width={620} height={80} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={640} y={530} textAnchor="middle" fontSize={18} fill={colors.TEXT}>
                  at 1,024 break points: {LEVELS_1024} tables, {LEVELS_1024} checks each
                </text>
                <text x={640} y={558} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                  depth grows like log₂ n, the tree's idea again
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={172} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        2 · Chain Or Tree
      </text>
    </>
  );
}

export const vizScene = () => scene;
