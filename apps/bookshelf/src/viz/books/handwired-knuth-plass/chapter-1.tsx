// Cheapest Breaks
//
// Knuth-Plass — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/knuth-plass/README.md:5 (Cheng's question)
//   lab/knuth-plass/paragraph.ts:20-30 (the line cost; slackLimit 63, lineCostCap 63² = 3,969, infeasible 2^22)
//   lab/knuth-plass/reference.ts:6-11 (lineCost), 26-48 (knuthPlass: shortest line first, `total < best`), 50-54 (backtrack)
//   lab/knuth-plass/knuth-plass.test.ts:16-26 (classicParagraph; greedy 0 + 16; "3" then "2 2" costs 9 + 1;
//     lineCostCap at a 4 px column; breaks [1, 3, 4], totalCost 10)
//   lab/knuth-plass/program.ts:83-87 (squared table read, ramp = relu(1 − D), overflows = relu(1 − ramp)),
//     100-108 (excess = relu(left − right), value = left − excess), 130-133 (candidates: from = to − 1 first)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every number on screen is computed below from the lab's own formulas
// (lineCost, knuthPlass, backtrack, and the circuit's relu arithmetic), on the test's classicParagraph.
// The program tiles and the stack of paragraphs in beat 2 are icons, not data.
import 'katex/dist/katex.min.css';
import {
  CAMERA_HOME,
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH14 = 8.4; // mono advance at 14 px
const CH13 = 7.8; // mono advance at 13 px
const SAND = '#d8c290';
const SAND_INK = '#2a2112';
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The lab's arithmetic, exact (paragraph.ts:20-30, reference.ts:6-55)
// ---------------------------------------------------------------------------

// knuth-plass.test.ts:16-18 — boxes 3, 2, 2 and 5 px wide with 1 px spaces, at 6 px
const PARA = { lineStarts: [0, 4, 7, 10], lineEnds: [3, 6, 9, 15] };
const MAX_W = 6;
const WINDOW = 4;
const N = PARA.lineEnds.length;
const SLACK_LIMIT = 63;
const LINE_COST_CAP = SLACK_LIMIT * SLACK_LIMIT;
const INFEASIBLE = 2 ** 22;
const BOX_W = PARA.lineStarts.map((s, i) => PARA.lineEnds[i] - s); // 3 2 2 5

const naturalWidth = (from: number, to: number): number => PARA.lineEnds[to - 1] - PARA.lineStarts[from];
function lineCost(from: number, to: number, maxWidth = MAX_W): number {
  const slack = maxWidth - naturalWidth(from, to);
  if (slack < 0) return to - from === 1 ? LINE_COST_CAP : INFEASIBLE;
  if (to === N) return 0;
  return Math.min(slack, SLACK_LIMIT) ** 2;
}

type Cand = { from: number; to: number; line: number; total: number };
const SOL = (() => {
  const costs = [0];
  const preds = [0];
  const cands: Cand[][] = [[]];
  for (let to = 1; to <= N; to++) {
    let best = Number.POSITIVE_INFINITY;
    let pred = -1;
    const list: Cand[] = [];
    // shortest line first; a later candidate replaces only when strictly cheaper
    for (let boxes = 1; boxes <= Math.min(WINDOW, to); boxes++) {
      const from = to - boxes;
      const line = lineCost(from, to);
      const total = costs[from] + line;
      list.push({ from, to, line, total });
      if (total < best) {
        best = total;
        pred = from;
      }
    }
    costs.push(best);
    preds.push(pred);
    cands.push(list);
  }
  const breaks: number[] = [];
  for (let at = N; at > 0; at = preds[at]) breaks.push(at);
  breaks.reverse();
  return { costs, preds, cands, breaks, totalCost: costs[N] };
})();

// greedy filling: extend the line while the next box still fits
const GREEDY_BREAKS = (() => {
  const out: number[] = [];
  let from = 0;
  while (from < N) {
    let to = from + 1;
    while (to + 1 <= N && naturalWidth(from, to + 1) <= MAX_W) to++;
    out.push(to);
    from = to;
  }
  return out;
})();

type Line = { from: number; to: number; width: number; slack: number; cost: number; last: boolean };
const linesOf = (breaks: number[]): Line[] =>
  breaks.map((to, k) => {
    const from = k ? breaks[k - 1] : 0;
    const width = naturalWidth(from, to);
    return { from, to, width, slack: MAX_W - width, cost: lineCost(from, to), last: to === N };
  });
const G_LINES = linesOf(GREEDY_BREAKS);
const O_LINES = linesOf(SOL.breaks);
const G_TOTAL = G_LINES.reduce((a, l) => a + l.cost, 0);
const O_TOTAL = O_LINES.reduce((a, l) => a + l.cost, 0);

// the circuit's arithmetic (program.ts:83-87, 100-108) on line (1, 3) and on break point 3's first pair
const C_LINE = { from: 1, to: 3 };
const C_SLACK = MAX_W - naturalWidth(C_LINE.from, C_LINE.to); // 1
const C_D = naturalWidth(C_LINE.from, C_LINE.to) - MAX_W; // −1
const C_SQUARED = Math.min(C_SLACK, SLACK_LIMIT) ** 2; // 1
const C_RAMP = Math.max(0, 1 - C_D); // 2
const C_OVER = Math.max(0, 1 - C_RAMP); // 0
const C_PENALTY = C_LINE.to - C_LINE.from === 1 ? LINE_COST_CAP : INFEASIBLE;
const C_COST = C_SQUARED + C_OVER * C_PENALTY; // 1
const MIN_LEFT = SOL.cands[3][0].total; // 16 (from 2, tried first)
const MIN_RIGHT = SOL.cands[3][1].total; // 10 (from 1)
const MIN_EXCESS = Math.max(0, MIN_LEFT - MIN_RIGHT); // 6
const MIN_VALUE = MIN_LEFT - MIN_EXCESS; // 10

{
  const eq = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (!eq(SOL.costs, [0, 9, 0, 10, 10]) || !eq(SOL.preds, [0, 0, 0, 1, 3]) || !eq(SOL.breaks, [1, 3, 4]) || SOL.totalCost !== 10)
    throw new Error('knuthPlass mismatch');
  if (!eq(GREEDY_BREAKS, [2, 3, 4]) || G_TOTAL !== 16 || O_TOTAL !== 10) throw new Error('greedy mismatch');
  if (lineCost(3, 4, 4) !== LINE_COST_CAP || lineCost(2, 4) !== INFEASIBLE || lineCost(1, 4) !== INFEASIBLE) throw new Error('cap mismatch');
  if (C_COST !== lineCost(C_LINE.from, C_LINE.to) || MIN_VALUE !== SOL.costs[3]) throw new Error('circuit mismatch');
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty). 1 px of paragraph = 40 stage px.
// ---------------------------------------------------------------------------

const S = 40;
const BH = 44;
const COL = MAX_W * S;
const Q = 16; // gap squares: 16 stage px per px of slack

const INTRO = { x: 340, y: 160 };
const GP = { x: 150, ys: [230, 300, 370] }; // greedy panel
const OP = { x: 700, ys: [230, 300, 370] }; // cheapest-breaks panel
const DP = { x: 200, y: 140 };
const FIN = { x: 900, ys: [160, 230, 300] };

type P = { x: number; y: number };
const stripForm = (o: P): P[] => PARA.lineStarts.map((s) => ({ x: o.x + s * S, y: o.y }));
const layoutForm = (lines: Line[], panel: { x: number; ys: number[] }): P[] => {
  const out: P[] = [];
  lines.forEach((l, k) => {
    for (let b = l.from; b < l.to; b++) out[b] = { x: panel.x + (PARA.lineStarts[b] - PARA.lineStarts[l.from]) * S, y: panel.ys[k] };
  });
  return out;
};
// the brick strip's five formations: ragged strip → greedy → cheapest → strip under the posts → re-cut
const FORMS: P[][] = [stripForm(INTRO), layoutForm(G_LINES, GP), layoutForm(O_LINES, OP), stripForm(DP), layoutForm(O_LINES, FIN)];
const brickAt = (i: number, f: number): P => {
  const k = Math.max(0, Math.min(FORMS.length - 2, Math.floor(f)));
  const u = clamp01(f - k);
  const a = FORMS[k][i];
  const b = FORMS[k + 1][i];
  const e = ease.move(u);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - Math.sin(Math.PI * u) * 22 };
};

// DP: posts (break points) sit in the spaces, 0 before the first box and 4 after the last
const POST_X = [DP.x - 0.5 * S, ...PARA.lineEnds.map((e) => DP.x + (e + 0.5) * S)];
const POST_TOP = 126;
const POST_BOT = 232;
const NODE_Y = 246;
const ARC_Y0 = 262;
const arcDepth = (span: number) => 26 + 24 * span;
const COST_Y = 404;
const PRED_Y = 444;
const CELL_W = 64;
const CELL_H = 32;

const ARCS = SOL.cands.flat().map((c) => {
  const xa = POST_X[c.from];
  const xb = POST_X[c.to];
  const depth = arcDepth(c.to - c.from);
  const cy = ARC_Y0 + (depth * 4) / 3;
  const d = `M ${xa} ${ARC_Y0} C ${xa} ${cy}, ${xb} ${cy}, ${xb} ${ARC_Y0}`;
  let len = 0;
  let prev: [number, number] = [xa, ARC_Y0];
  for (let i = 1; i <= 60; i++) {
    const t = i / 60, m = 1 - t;
    const x = m * m * m * xa + 3 * m * m * t * xa + 3 * m * t * t * xb + t * t * t * xb;
    const y = m * m * m * ARC_Y0 + 3 * m * m * t * cy + 3 * m * t * t * cy + t * t * t * ARC_Y0;
    len += Math.hypot(x - prev[0], y - prev[1]);
    prev = [x, y];
  }
  const feasible = c.line < INFEASIBLE;
  const chip = feasible ? `${SOL.costs[c.from]} + ${c.line} = ${c.total}` : `${SOL.costs[c.from]} + ${commas(INFEASIBLE)}`;
  return { ...c, key: `${c.from}-${c.to}`, d, len, chipX: (xa + xb) / 2, chipY: ARC_Y0 + depth, feasible, win: SOL.preds[c.to] === c.from, chip, order: c.to - c.from };
});

// backtrack hops above the strip: 4 → 3 → 1 → 0
const PATH = [N, ...[...SOL.breaks].reverse().slice(1), 0]; // [4, 3, 1, 0]
const HOP_Y = 124;
const HOPS = PATH.slice(0, -1).map((a, k) => {
  const b = PATH[k + 1];
  const xa = POST_X[a], xb = POST_X[b];
  const h = 34 + 0.07 * Math.abs(xa - xb);
  return { a, b, d: `M ${xa} ${HOP_Y} C ${xa} ${HOP_Y - h}, ${xb} ${HOP_Y - h}, ${xb} ${HOP_Y}`, len: Math.abs(xa - xb) + h * 1.2, xb };
});

const HOME: CameraState = CAMERA_HOME;
const CAM_STRIP: CameraState = { x: 640, y: 205, k: 1.25 };
const CAM_STRIP2: CameraState = { x: 640, y: 240, k: 1.18 };
const CAM_GREEDY: CameraState = { x: 420, y: 330, k: 1.25 };
const CAM_OPT: CameraState = { x: 880, y: 330, k: 1.25 };
const CAM_DP: CameraState = { x: 500, y: 290, k: 1.15 };
const CAM_TIE: CameraState = { x: 650, y: 300, k: 1.02 };
const CAM_CIRC: CameraState = { x: 1000, y: 320, k: 1.2 };

// ---------------------------------------------------------------------------
// The narration contract (book.json chapters[0].captions, verbatim) and word-synced timing
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Fitting a paragraph to a column means choosing where each line breaks. Knuth-Plass picks the cheapest set of breaks for the whole paragraph, instead of filling one line at a time.',
  'This lab writes that method as a fixed program of sums, table lookups and relus, which clip negatives to zero. Cheng asked whether many paragraphs at once would then run faster on a graphics chip.',
  'Take a tiny paragraph: four boxes, three, two, two and five pixels wide, with one pixel spaces, in a column six pixels wide. Where should the lines break?',
  "Greedy filling packs each line until the next box won't fit. The first two boxes fill six pixels exactly. The third then sits alone, leaving four pixels empty, because the fourth is too wide to join it.",
  "A line's cost is its empty space, squared. Four empty pixels cost sixteen. A full line costs zero, and so does the last line. Greedy's total is zero plus sixteen plus zero: sixteen.",
  'Break after the first box instead. That line leaves three pixels empty and costs nine. The next two boxes leave one pixel and cost one. The last line is free. The total is ten, beating sixteen.',
  "Squaring is why. One big gap costs more than two small ones: four squared is sixteen, but three squared plus one squared is ten. Greedy can't see that a worse early line buys a better later one.",
  'A line that overflows the column costs a huge number, so it is never chosen. The one exception is a single box wider than the column, at three thousand nine hundred sixty-nine, so every paragraph has a solution.',
  "To find the cheapest breaks overall, keep a running best. The cost of reaching a break point is the cheapest, over every earlier break point, of that point's cost plus the line from there.",
  'Walk the break points left to right. Point one costs nine. Point two costs zero. Point three has two candidates: sixteen from point two, or nine plus one, ten, from point one. Ten wins and remembers point one.',
  'On equal totals, the shortest last line wins. A later candidate replaces the best only when it is strictly cheaper, and the shortest line is tried first.',
  'In the circuit, a line\'s cost is one table lookup and two relus. Each minimum is a relu too: left minus right, clipped at zero, is the excess, and the winner is left minus that excess.',
  "Point four costs ten, from point three. Follow the remembered points back: four, three, one, zero. Lines end after box one, after box three, and at the end. Total ten, against greedy's sixteen.",
];
// ~150 words per minute, plus a short hold after each line
const DURS = [12.6, 14.2, 11.4, 15.0, 13.4, 14.6, 15.0, 15.4, 13.8, 15.4, 11.0, 14.6, 13.4];
const GAP = 0.5;
const BEAT_AT: number[] = [];
{
  let acc = 0.4;
  for (const d of DURS) {
    BEAT_AT.push(+acc.toFixed(2));
    acc += d + GAP;
  }
}
const WORDS = CAPTIONS.map((c) => c.split(/\s+/));
/** time the narrator reaches `phrase` (its nth occurrence) in caption i, at an even speaking rate */
const say = (i: number, phrase: string, nth = 0): number => {
  const w = WORDS[i];
  let seen = 0;
  for (let k = 0; k < w.length; k++) {
    if (w.slice(k).join(' ').startsWith(phrase)) {
      if (seen === nth) return BEAT_AT[i] + 0.15 + (k * (DURS[i] - 0.4)) / w.length;
      seen++;
    }
  }
  throw new Error(`phrase not in caption ${i}: ${phrase}`);
};

// header source chip, one per caption
const PIN = 'handwired@4ea7fcb';
const SOURCES = [
  'lab/knuth-plass/README.md:5 · reference.ts:26-48',
  'lab/knuth-plass/README.md:5 · program.ts:79-119',
  'lab/knuth-plass/knuth-plass.test.ts:16-18',
  'lab/knuth-plass/knuth-plass.test.ts:16, 21-22',
  'lab/knuth-plass/reference.ts:6-11 · paragraph.ts:20',
  'lab/knuth-plass/knuth-plass.test.ts:17 · reference.ts:6-11',
  'lab/knuth-plass/reference.ts:10',
  'lab/knuth-plass/paragraph.ts:21-30 · knuth-plass.test.ts:25',
  'lab/knuth-plass/reference.ts:26-48',
  'lab/knuth-plass/reference.ts:31-48',
  'lab/knuth-plass/reference.ts:26-28, 36-41',
  'lab/knuth-plass/program.ts:83-87, 100-108',
  'lab/knuth-plass/reference.ts:50-54 · knuth-plass.test.ts:26',
];

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, ≈189 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const ch = (key: string, v = 0) => tl.channel(key, v);
  const cam = tl.channel<CameraState>('cam', HOME, cameraInterp);
  const src = ch('src');

  // the persistent object: four bricks, each with its own formation channel (0..4)
  const bricksIn = ch('bricksIn');
  const form = [0, 1, 2, 3].map((i) => ch(`brick${i + 1}Form`));
  const brickDim = ch('brickDim'); // 0 = full, 1 = whisper
  const widthHi = ch('widthHi'); // which brick's width is being read (1..4), 0 = none
  // B0–B2 intro
  const stripOp = ch('stripOp', 1);
  const edgeU = ch('edgeU');
  const edgePulse = ch('edgePulse');
  const qU = ch('questionU');
  const wholeU = ch('wholeU');
  const oneLineU = ch('oneLineU');
  const progU = ch('progU');
  const tileU = [ch('tileSum'), ch('tileTable'), ch('tileRelu')];
  const texReluU = ch('texReluU');
  const chengU = ch('chengU');
  const stackU = ch('stackU');
  const gpuU = ch('gpuU');
  const progOp = ch('progOp', 1);
  const rulerU = ch('rulerU');
  const spacesU = ch('spacesU');
  const bracketU = ch('bracketU');
  const codeU = ch('codeU');
  const introOp = ch('introOp', 1);
  // B3–B7 panels
  const gColU = ch('greedyCols');
  const fullU = ch('lineFullU');
  const g4U = ch('greedyGhost4');
  const g4Op = ch('greedyGhost4Op', 1);
  const gGap = [ch('gGap1'), ch('gGap2'), ch('gGap3')];
  const gSq = [ch('gSq1'), ch('gSq2'), ch('gSq3')];
  const gChip = [ch('gChip1'), ch('gChip2'), ch('gChip3')];
  const gTally = ch('gTally');
  const texCostU = ch('texCostU');
  const oColU = ch('optCols');
  const oGap = [ch('oGap1'), ch('oGap2'), ch('oGap3')];
  const oSq = [ch('oSq1'), ch('oSq2'), ch('oSq3')];
  const oChip = [ch('oChip1'), ch('oChip2'), ch('oChip3')];
  const oTally = ch('oTally');
  const beatsU = ch('beatsU');
  const gLayerOp = ch('greedyLayerOp', 1);
  const auxDim = ch('auxDim'); // gaps / chips / tallies to a whisper while the squares speak
  const sqFocus = ch('squareFocus');
  const compareU = ch('compareTex');
  const annotU = ch('annotU');
  const oAuxOp = ch('optAuxOp', 1);
  const ovfU = ch('overflowGhost');
  const ovfOp = ch('overflowOp', 1);
  const infChipU = ch('infeasibleChip');
  const neverU = ch('neverU');
  const capU = ch('capEdge');
  const capChipU = ch('capChip');
  const panelsOp = ch('panelsOp', 1);
  // B8–B12 the running minimum
  const postsU = ch('postsU');
  const tableU = ch('tableU');
  const formulaU = ch('formulaU');
  const cell = [0, 1, 2, 3, 4].map((k) => ch(`cell${k}`));
  const walk = ch('walk', -1);
  const arcDraw: Record<string, ChannelRef<number>> = {};
  const arcChip: Record<string, ChannelRef<number>> = {};
  for (const a of ARCS) {
    arcDraw[a.key] = ch(`arc${a.key}`);
    arcChip[a.key] = ch(`arcChip${a.key}`);
  }
  const postOp = [0, 1, 2, 3, 4].map((k) => ch(`postArcs${k}`, 1));
  const chipOp = [0, 1, 2, 3, 4].map((k) => ch(`postChips${k}`, 1));
  const win = [0, 1, 2, 3, 4].map((k) => ch(`win${k}`));
  const orderU = ch('orderU');
  const tieU = ch('tieU');
  const strictGlow = ch('strictGlow');
  const circA = [ch('circA0'), ch('circA1'), ch('circA2'), ch('circA3')];
  const circB = [ch('circB0'), ch('circB1'), ch('circB2')];
  const circOp = ch('circOp', 1);
  const dpOp = ch('dpOp', 1);
  const backU = ch('backU');
  const cutU = ch('cutU');
  const finU = ch('finU');
  const tallyU = ch('tallyU');

  // the fixed captions and their holds
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: BEAT_AT[i], dur: DURS[i], text });
    tl.hold(BEAT_AT[i] + DURS[i], GAP);
    tl.set(src, i, BEAT_AT[i]);
  });
  const end = BEAT_AT[12] + DURS[12];
  tl.hold(end, 2.6);

  const M = { ease: ease.move };
  const E = { ease: ease.enter };

  // — B0 · four bricks, a column, and the question of where to break —
  let b = BEAT_AT[0];
  tl.tween(bricksIn, 1, { at: b + 0.2, dur: 1.6, ease: ease.linear });
  tl.tween(cam, CAM_STRIP, { at: b + 1.0, dur: 1.4, ...M });
  tl.tween(edgeU, 1, { at: say(0, 'column'), dur: 0.6, ...E });
  [0, 1, 2].forEach((k) => {
    tl.tween(edgePulse, 1, { at: say(0, 'column') + 0.5 + k * 0.9, dur: 0.4, ...E });
    tl.tween(edgePulse, 0, { at: say(0, 'column') + 0.9 + k * 0.9, dur: 0.5, ...M });
  });
  tl.tween(qU, 1, { at: say(0, 'choosing'), dur: 0.7, ...E });
  tl.tween(wholeU, 1, { at: say(0, 'cheapest'), dur: 0.8, ease: ease.draw });
  tl.tween(oneLineU, 1, { at: say(0, 'instead'), dur: 0.8, ease: ease.draw });

  // — B1 · a fixed program; Cheng's question —
  b = BEAT_AT[1];
  tl.tween(cam, HOME, { at: b, dur: 1.2, ...M });
  tl.tween(wholeU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(oneLineU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(stripOp, 0.15, { at: b + 0.2, dur: 0.8, ...M });
  tl.tween(progU, 1, { at: say(1, 'fixed') - 0.3, dur: 0.6, ...E });
  tl.tween(tileU[0], 1, { at: say(1, 'sums'), dur: 0.5, ease: ease.pop });
  tl.tween(tileU[1], 1, { at: say(1, 'table'), dur: 0.5, ease: ease.pop });
  tl.tween(tileU[2], 1, { at: say(1, 'relus'), dur: 0.5, ease: ease.pop });
  tl.tween(texReluU, 1, { at: say(1, 'clip'), dur: 0.6, ...E });
  tl.tween(chengU, 1, { at: say(1, 'Cheng'), dur: 0.6, ...E });
  tl.tween(stackU, 1, { at: say(1, 'many'), dur: 1.2, ease: ease.linear });
  tl.tween(gpuU, 1, { at: say(1, 'graphics'), dur: 0.6, ease: ease.pop });

  // — B2 · the tiny paragraph, measured —
  b = BEAT_AT[2];
  tl.tween(progOp, 0, { at: b, dur: 0.6, ...M });
  tl.tween(stripOp, 1, { at: b + 0.2, dur: 0.7, ...M });
  tl.tween(cam, CAM_STRIP2, { at: b + 0.2, dur: 1.2, ...M });
  tl.tween(rulerU, 1, { at: say(2, 'four'), dur: 1.0, ease: ease.draw });
  tl.set(widthHi, 1, say(2, 'three,'));
  tl.set(widthHi, 2, say(2, 'two,'));
  tl.set(widthHi, 3, say(2, 'two', 1));
  tl.set(widthHi, 4, say(2, 'five'));
  tl.set(widthHi, 0, say(2, 'with'));
  tl.tween(spacesU, 1, { at: say(2, 'one'), dur: 0.6, ...E });
  tl.tween(bracketU, 1, { at: say(2, 'column'), dur: 0.8, ease: ease.draw });
  tl.tween(codeU, 1, { at: say(2, 'column') + 0.8, dur: 0.6, ...E });
  tl.tween(edgePulse, 1, { at: say(2, 'Where'), dur: 0.4, ...E });
  tl.tween(edgePulse, 0, { at: say(2, 'Where') + 0.5, dur: 0.6, ...M });

  // — B3 · greedy filling —
  b = BEAT_AT[3];
  tl.tween(introOp, 0, { at: b, dur: 0.6, ...M });
  tl.tween(qU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(cam, CAM_GREEDY, { at: b + 0.1, dur: 1.4, ...M });
  tl.tween(gColU, 1, { at: b + 0.4, dur: 0.8, ...E });
  tl.tween(form[0], 1, { at: say(3, 'first') - 0.4, dur: 1.2, ...M });
  tl.tween(form[1], 1, { at: say(3, 'first') - 0.2, dur: 1.2, ...M });
  tl.tween(fullU, 1, { at: say(3, 'six'), dur: 0.5, ...E });
  tl.tween(form[2], 1, { at: say(3, 'third'), dur: 1.2, ...M });
  tl.tween(gGap[1], 1, { at: say(3, 'leaving'), dur: 0.6, ...E });
  tl.tween(g4U, 1, { at: say(3, 'because'), dur: 1.0, ...M });
  tl.tween(g4Op, 0, { at: say(3, 'join') + 0.6, dur: 0.6, ...M });
  tl.tween(form[3], 1, { at: say(3, 'join') + 0.4, dur: 1.2, ...M });
  tl.tween(gGap[2], 1, { at: say(3, 'join') + 1.4, dur: 0.5, ...E });

  // — B4 · cost = empty space, squared —
  b = BEAT_AT[4];
  tl.tween(fullU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(texCostU, 1, { at: say(4, 'cost'), dur: 0.6, ...E });
  tl.tween(gSq[1], 1, { at: say(4, 'Four') - 0.2, dur: 1.0, ...M });
  tl.tween(gChip[1], 1, { at: say(4, 'sixteen.') - 0.2, dur: 0.5, ease: ease.pop });
  tl.tween(gSq[0], 1, { at: say(4, 'full'), dur: 0.5, ...E });
  tl.tween(gChip[0], 1, { at: say(4, 'zero,'), dur: 0.5, ease: ease.pop });
  tl.tween(gChip[2], 1, { at: say(4, 'last'), dur: 0.5, ease: ease.pop });
  tl.tween(gTally, 1, { at: say(4, 'zero', 1), dur: 0.3, ...E });
  tl.tween(gTally, 2, { at: say(4, 'sixteen', 1), dur: 0.3, ...E });
  tl.tween(gTally, 3, { at: say(4, 'zero:'), dur: 0.3, ...E });
  tl.tween(gTally, 4, { at: say(4, 'sixteen.', 1), dur: 0.4, ease: ease.pop });

  // — B5 · the cheapest breaks: 9 + 1 + 0 —
  b = BEAT_AT[5];
  tl.tween(cam, HOME, { at: b, dur: 1.4, ...M });
  tl.tween(oColU, 1, { at: b + 0.2, dur: 0.8, ...E });
  tl.tween(form[0], 2, { at: b + 0.6, dur: 1.4, ...M });
  tl.tween(oGap[0], 1, { at: say(5, 'three'), dur: 0.6, ...E });
  tl.tween(oSq[0], 1, { at: say(5, 'three') + 0.6, dur: 0.9, ...M });
  tl.tween(oChip[0], 1, { at: say(5, 'nine.'), dur: 0.5, ease: ease.pop });
  tl.tween(form[1], 2, { at: say(5, 'next') - 0.5, dur: 1.3, ...M });
  tl.tween(form[2], 2, { at: say(5, 'next') - 0.3, dur: 1.3, ...M });
  tl.tween(oGap[1], 1, { at: say(5, 'leave one'), dur: 0.6, ...E });
  tl.tween(oSq[1], 1, { at: say(5, 'leave one') + 0.5, dur: 0.8, ...M });
  tl.tween(oChip[1], 1, { at: say(5, 'one.'), dur: 0.5, ease: ease.pop });
  tl.tween(form[3], 2, { at: say(5, 'last') - 0.6, dur: 1.3, ...M });
  tl.tween(oGap[2], 1, { at: say(5, 'free.'), dur: 0.5, ...E });
  tl.tween(oChip[2], 1, { at: say(5, 'free.'), dur: 0.5, ease: ease.pop });
  tl.tween(oTally, 4, { at: say(5, 'total'), dur: 1.0, ease: ease.linear });
  tl.tween(beatsU, 1, { at: say(5, 'beating'), dur: 0.5, ease: ease.pop });

  // — B6 · squaring is why —
  b = BEAT_AT[6];
  tl.tween(sqFocus, 1, { at: b + 0.2, dur: 0.7, ...M });
  tl.tween(brickDim, 1, { at: b + 0.2, dur: 0.7, ...M });
  tl.tween(auxDim, 1, { at: b + 0.2, dur: 0.7, ...M });
  tl.tween(compareU, 1, { at: say(6, 'four'), dur: 0.7, ...E });
  tl.tween(sqFocus, 0, { at: say(6, 'Greedy') - 0.2, dur: 0.6, ...M });
  tl.tween(brickDim, 0, { at: say(6, 'Greedy') - 0.2, dur: 0.6, ...M });
  tl.tween(auxDim, 0.6, { at: say(6, 'Greedy') - 0.2, dur: 0.6, ...M });
  tl.tween(compareU, 0.15, { at: say(6, 'Greedy') - 0.2, dur: 0.6, ...M });
  tl.tween(annotU, 1, { at: say(6, 'worse') - 0.2, dur: 0.6, ...E });

  // — B7 · overflow: infeasible, and the one-box exception —
  b = BEAT_AT[7];
  tl.tween(cam, CAM_OPT, { at: b, dur: 1.3, ...M });
  tl.tween(compareU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(annotU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(auxDim, 0, { at: b, dur: 0.5, ...M });
  tl.tween(gLayerOp, 0.12, { at: b, dur: 0.8, ...M });
  tl.tween(oAuxOp, 0, { at: b, dur: 0.6, ...M });
  tl.tween(texCostU, 0, { at: b, dur: 0.6, ...M });
  tl.tween(ovfU, 1, { at: say(7, 'overflows') - 0.2, dur: 1.0, ...M });
  tl.tween(infChipU, 1, { at: say(7, 'huge'), dur: 0.6, ...E });
  tl.tween(neverU, 1, { at: say(7, 'never'), dur: 0.5, ...E });
  tl.tween(ovfOp, 0, { at: say(7, 'exception') - 0.2, dur: 0.6, ...M });
  tl.tween(infChipU, 0.12, { at: say(7, 'exception') - 0.2, dur: 0.6, ...M });
  tl.tween(neverU, 0, { at: say(7, 'exception') - 0.2, dur: 0.6, ...M });
  tl.tween(capU, 1, { at: say(7, 'single'), dur: 1.0, ...M });
  tl.tween(capChipU, 1, { at: say(7, 'three'), dur: 0.6, ...E });

  // — B8 · the running best: posts, a table, a formula —
  b = BEAT_AT[8];
  tl.tween(capU, 0, { at: b, dur: 0.6, ...M });
  tl.tween(capChipU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(infChipU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(panelsOp, 0, { at: b, dur: 0.8, ...M });
  [0, 1, 2, 3].forEach((i) => tl.tween(form[i], 3, { at: b + 0.2 + i * 0.15, dur: 1.4, ...M }));
  tl.tween(cam, CAM_DP, { at: b + 0.3, dur: 1.4, ...M });
  tl.tween(postsU, 1, { at: say(8, 'running') - 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(tableU, 1, { at: say(8, 'running') + 0.4, dur: 0.6, ...E });
  tl.tween(cell[0], 1, { at: say(8, 'running') + 0.8, dur: 0.5, ease: ease.pop });
  tl.tween(formulaU, 1, { at: say(8, 'cost'), dur: 0.7, ...E });
  // candidates fan back from post 3 (chips come later)
  for (const a of ARCS.filter((x) => x.to === 3)) tl.tween(arcDraw[a.key], 1, { at: say(8, 'every') + 0.2 * (a.order - 1), dur: 1.1, ease: ease.draw });

  // — B9 · walk the posts: 9, 0, then 16 vs 10 —
  b = BEAT_AT[9];
  tl.tween(postOp[3], 0.12, { at: b, dur: 0.5, ...M });
  tl.tween(walk, 0, { at: b + 0.2, dur: 0.4, ...E });
  tl.tween(walk, 1, { at: say(9, 'Point'), dur: 0.6, ...M });
  tl.tween(arcDraw['0-1'], 1, { at: say(9, 'Point'), dur: 0.8, ease: ease.draw });
  tl.tween(arcChip['0-1'], 1, { at: say(9, 'costs') - 0.1, dur: 0.4, ease: ease.pop });
  tl.tween(win[1], 1, { at: say(9, 'nine.'), dur: 0.4, ...E });
  tl.tween(cell[1], 1, { at: say(9, 'nine.'), dur: 0.5, ease: ease.pop });
  tl.tween(chipOp[1], 0, { at: say(9, 'Point', 1) - 0.1, dur: 0.4, ...M });
  tl.tween(postOp[1], 0.3, { at: say(9, 'Point', 1) - 0.1, dur: 0.4, ...M });
  tl.tween(walk, 2, { at: say(9, 'Point', 1), dur: 0.6, ...M });
  for (const a of ARCS.filter((x) => x.to === 2)) {
    tl.tween(arcDraw[a.key], 1, { at: say(9, 'Point', 1) + 0.15 * (a.order - 1), dur: 0.8, ease: ease.draw });
    tl.tween(arcChip[a.key], 1, { at: say(9, 'costs', 1) - 0.1 + 0.15 * (a.order - 1), dur: 0.4, ease: ease.pop });
  }
  tl.tween(win[2], 1, { at: say(9, 'zero.'), dur: 0.4, ...E });
  tl.tween(cell[2], 1, { at: say(9, 'zero.'), dur: 0.5, ease: ease.pop });
  tl.tween(chipOp[2], 0, { at: say(9, 'Point', 2) - 0.1, dur: 0.4, ...M });
  tl.tween(postOp[2], 0.3, { at: say(9, 'Point', 2) - 0.1, dur: 0.4, ...M });
  tl.tween(walk, 3, { at: say(9, 'Point', 2), dur: 0.6, ...M });
  tl.tween(postOp[3], 1, { at: say(9, 'Point', 2), dur: 0.5, ...E });
  tl.tween(arcChip['2-3'], 1, { at: say(9, 'sixteen'), dur: 0.4, ease: ease.pop });
  tl.tween(arcChip['1-3'], 1, { at: say(9, 'nine', 1), dur: 0.4, ease: ease.pop });
  tl.tween(arcChip['0-3'], 1, { at: say(9, 'ten,') + 0.3, dur: 0.4, ...E });
  tl.tween(win[3], 1, { at: say(9, 'Ten'), dur: 0.6, ...M });
  tl.tween(cell[3], 1, { at: say(9, 'remembers'), dur: 0.5, ease: ease.pop });

  // — B10 · ties: strictly cheaper replaces; shortest line tried first —
  b = BEAT_AT[10];
  tl.tween(cam, CAM_TIE, { at: b, dur: 1.2, ...M });
  tl.tween(walk, -1, { at: b, dur: 0.5, ...M });
  tl.tween(tieU, 1, { at: b + 0.4, dur: 0.6, ...E });
  tl.tween(strictGlow, 1, { at: say(10, 'strictly') - 0.2, dur: 0.4, ...E });
  tl.tween(strictGlow, 0, { at: say(10, 'and') + 0.2, dur: 0.4, ...M });
  tl.tween(orderU, 1, { at: say(10, 'shortest', 1) - 0.2, dur: 0.6, ...E });

  // — B11 · in the circuit: one table read and two relus; min as a relu —
  b = BEAT_AT[11];
  tl.tween(tieU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(orderU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(formulaU, 0, { at: b, dur: 0.5, ...M });
  tl.tween(dpOp, 0.12, { at: b, dur: 0.6, ...M });
  tl.tween(brickDim, 1, { at: b, dur: 0.6, ...M });
  tl.tween(cam, CAM_CIRC, { at: b + 0.1, dur: 1.3, ...M });
  tl.tween(circA[0], 1, { at: say(11, 'table') - 0.3, dur: 0.6, ...E });
  tl.tween(circA[1], 1, { at: say(11, 'two') - 0.1, dur: 0.6, ...E });
  tl.tween(circA[2], 1, { at: say(11, 'two') + 0.4, dur: 0.6, ...E });
  tl.tween(circA[3], 1, { at: say(11, 'Each') - 0.4, dur: 0.6, ...E });
  tl.tween(circB[0], 1, { at: say(11, 'Each'), dur: 0.6, ...E });
  tl.tween(circB[1], 1, { at: say(11, 'left'), dur: 0.6, ...E });
  tl.tween(circB[2], 1, { at: say(11, 'winner'), dur: 0.6, ease: ease.pop });

  // — B12 · post 4, the pointers back, the re-cut —
  b = BEAT_AT[12];
  tl.tween(circOp, 0, { at: b, dur: 0.6, ...M });
  tl.tween(dpOp, 1, { at: b, dur: 0.6, ...M });
  tl.tween(brickDim, 0, { at: b, dur: 0.6, ...M });
  tl.tween(chipOp[3], 0, { at: b, dur: 0.5, ...M });
  tl.tween(postOp[3], 0.3, { at: b, dur: 0.5, ...M });
  tl.tween(cam, HOME, { at: b + 0.1, dur: 1.4, ...M });
  for (const a of ARCS.filter((x) => x.to === 4)) {
    tl.tween(arcDraw[a.key], 1, { at: b + 0.3 + 0.15 * (a.order - 1), dur: 0.9, ease: ease.draw });
    tl.tween(arcChip[a.key], 1, { at: b + 0.9 + 0.15 * (a.order - 1), dur: 0.4, ...E });
  }
  tl.tween(win[4], 1, { at: say(12, 'from') - 0.2, dur: 0.5, ...M });
  tl.tween(cell[4], 1, { at: say(12, 'three.'), dur: 0.5, ease: ease.pop });
  tl.tween(chipOp[4], 0, { at: say(12, 'Follow'), dur: 0.5, ...M });
  tl.tween(postOp[4], 0.3, { at: say(12, 'Follow'), dur: 0.5, ...M });
  ['four,', 'three,', 'one,'].forEach((w, k) => tl.tween(backU, k + 1, { at: say(12, w), dur: 0.55, ease: ease.linear }));
  tl.tween(cutU, 1, { at: say(12, 'zero.'), dur: 0.5, ...E });
  tl.tween(finU, 1, { at: say(12, 'Lines') - 0.2, dur: 0.6, ...E });
  tl.tween(form[0], 4, { at: say(12, 'Lines'), dur: 1.2, ...M });
  tl.tween(form[1], 4, { at: say(12, 'after', 1) - 0.1, dur: 1.2, ...M });
  tl.tween(form[2], 4, { at: say(12, 'after', 1) + 0.1, dur: 1.2, ...M });
  tl.tween(form[3], 4, { at: say(12, 'end.') - 0.3, dur: 1.2, ...M });
  tl.tween(tallyU, 1, { at: say(12, 'Total'), dur: 0.6, ease: ease.pop });

  return {
    tl, cam, src, bricksIn, form, brickDim, widthHi,
    stripOp, edgeU, edgePulse, qU, wholeU, oneLineU, progU, tileU, texReluU, chengU, stackU, gpuU, progOp,
    rulerU, spacesU, bracketU, codeU, introOp,
    gColU, fullU, g4U, g4Op, gGap, gSq, gChip, gTally, texCostU, oColU, oGap, oSq, oChip, oTally, beatsU,
    gLayerOp, auxDim, sqFocus, compareU, annotU, oAuxOp, ovfU, ovfOp, infChipU, neverU, capU, capChipU, panelsOp,
    postsU, tableU, formulaU, cell, walk, arcDraw, arcChip, postOp, chipOp, win, orderU, tieU, strictGlow,
    circA, circB, circOp, dpOp, backU, cutU, finU, tallyU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local glyphs
// ---------------------------------------------------------------------------

/** Violet hockey stick (the book-wide relu glyph). (x, y) is the bottom-left. */
function ReluGlyph({ x, y, w = 22, width = 2.5, opacity = 1 }: { x: number; y: number; w?: number; width?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <path d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`} fill="none" stroke={colors.SECONDARY} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

function Brick({ x, y, i, opacity = 1, hi = 0, scale = 1 }: { x: number; y: number; i: number; opacity?: number; hi?: number; scale?: number }) {
  if (opacity <= 0.005) return null;
  const w = BOX_W[i] * S * scale;
  const h = BH * scale;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={4 * scale} fill={SAND} stroke={hi > 0.01 ? colors.WARM : '#b9a36f'} strokeWidth={hi > 0.01 ? 2 + 2 * hi : 1.2} />
      {scale >= 1 && (
        <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize={hi > 0.5 ? 16 : 14} fontFamily={MONO} fontWeight={700} fill={SAND_INK}>
          {BOX_W[i]} px
        </text>
      )}
    </g>
  );
}

function Chip({ x, y, text, color = colors.TEXT, border = colors.GRID, opacity = 1, size = 13, anchor = 'middle', italic = false, dashed = false }: {
  x: number; y: number; text: string; color?: string; border?: string; opacity?: number; size?: 13 | 14 | 16; anchor?: 'start' | 'middle'; italic?: boolean; dashed?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const adv = size === 13 ? CH13 : size === 14 ? CH14 : 9.6;
  const w = text.length * adv + 16;
  const h = size + 9;
  const left = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={5} fill={colors.PANEL} stroke={border} strokeWidth={1.4} strokeDasharray={dashed ? '4 3' : undefined} />
      <text x={left + w / 2} y={y + size * 0.36} textAnchor="middle" fontSize={size} fontFamily={MONO} fill={color} fontStyle={italic ? 'italic' : undefined}>
        {text}
      </text>
    </g>
  );
}

/** One circuit row: [op badge] expression → value */
function OpRow({ x, y, op, expr, value, relu, opacity }: { x: number; y: number; op: string; expr: string; value: string; relu: boolean; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity} transform={`translate(${lerp(-16, 0, opacity)}, 0)`}>
      <rect x={x} y={y} width={390} height={34} rx={6} fill={colors.PANEL} stroke={relu ? colors.SECONDARY : colors.GRID} strokeOpacity={relu ? 0.7 : 1} />
      <rect x={x} y={y} width={4} height={34} rx={2} fill={relu ? colors.SECONDARY : colors.MUTED} />
      <text x={x + 14} y={y + 22} fontSize={13} fontFamily={MONO} fontWeight={700} fill={relu ? colors.SECONDARY : colors.TEXT}>
        {op}
      </text>
      {relu && <ReluGlyph x={x + 58} y={y + 23} w={18} width={2.2} />}
      <text x={x + 94} y={y + 22} fontSize={13} fontFamily={MONO} fill={colors.TEXT} xmlSpace="preserve">
        {expr}
      </text>
      <text x={x + 378} y={y + 22} textAnchor="end" fontSize={15} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>
        {value}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (c: ChannelRef<number>): number => s.get(c);
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(v(scene.src))));
  const chip = `${PIN} · ${SOURCES[srcIdx]}`;

  const forms = scene.form.map(v);
  const bricksIn = v(scene.bricksIn);
  const brickDim = v(scene.brickDim);
  const widthHi = v(scene.widthHi);
  const stripOp = v(scene.stripOp);
  const introOp = v(scene.introOp);
  const panelsOp = v(scene.panelsOp);
  const gLayer = v(scene.gLayerOp) * panelsOp;
  const auxDim = v(scene.auxDim);
  const aux = 1 - 0.85 * auxDim;
  const sqFocus = v(scene.sqFocus);
  const oAux = v(scene.oAuxOp);

  // brick opacity: the strip dims as a whole in beat 2; bricks whisper while the squares speak
  const brickOp = (i: number) => {
    const inU = clamp01(bricksIn * 1.9 - i * 0.3);
    const strip = forms[i] < 1 ? stripOp : 1;
    return inU * strip * (1 - 0.88 * brickDim);
  };

  const ruler = v(scene.rulerU);
  const RX = (p: number) => INTRO.x + p * S;

  // greedy / cheapest panels share one drawing routine
  const panel = (
    lines: Line[], P0: { x: number; ys: number[] }, color: string, colU: number, layer: number,
    gap: number[], sq: number[], chips: number[], tally: number, title: string, auxOp: number, capEdge = 0,
  ) => {
    if (colU <= 0.005 || layer <= 0.005) return null;
    const total = lines.reduce((a, l) => a + l.cost, 0);
    const terms = lines.map((l) => String(l.cost));
    const shown = Math.min(3, Math.floor(tally + 1e-6));
    const tallyText = tally < 0.05 ? '' : `${terms.slice(0, Math.max(1, shown)).join(' + ')}${tally >= 3.99 ? ` = ${total}` : ''}`;
    return (
      <g opacity={layer}>
        <text x={P0.x} y={212} fontSize={17} fill={color} opacity={colU}>
          {title}
        </text>
        {lines.map((l, k) => {
          const y = P0.ys[k];
          const colW = k === 2 ? lerp(COL, 4 * S, capEdge) : COL;
          const gx = P0.x + l.width * S;
          const gw = l.slack * S;
          const side = l.slack * Q;
          const sqX = P0.x + COL + 20;
          const sqY = y + BH / 2 - side / 2;
          const su = clamp01(sq[k]);
          const gU = clamp01(gap[k]);
          const showSq = !l.last && side > 0;
          return (
            <g key={k}>
              <rect x={P0.x} y={y} width={colW} height={BH} rx={4} fill={colors.PANEL} stroke={colors.GRID} opacity={colU} />
              <line x1={P0.x + colW} y1={y - 6} x2={P0.x + colW} y2={y + BH + 6} stroke={capEdge > 0.01 && k === 2 ? colors.WARM : colors.MUTED} strokeWidth={capEdge > 0.01 && k === 2 ? 2.5 : 1.5} strokeDasharray="5 4" opacity={colU} />
              {gU > 0.005 && gw > 0 && (
                <g opacity={gU * aux * (l.last ? 0.55 : 1) * (k === 2 ? 1 - capEdge : 1)}>
                  <rect x={gx} y={y + 3} width={gw} height={BH - 6} rx={3} fill="url(#kp1-hatch)" stroke={colors.MUTED} strokeOpacity={0.6} strokeDasharray="3 3" />
                  {gw >= 40 && (
                    <text x={gx + gw / 2} y={y + BH / 2 + 5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.TEXT} stroke={colors.BG} strokeWidth={3} paintOrder="stroke">
                      {l.slack} px
                    </text>
                  )}
                </g>
              )}
              {/* the gap squares itself: the hatched bar morphs into a slack × slack square of unit cells */}
              {showSq && su > 0.005 && (
                <g opacity={(1 - 0.85 * auxDim * (1 - sqFocus)) * auxOp}>
                  <rect
                    x={lerp(gx, sqX, su)}
                    y={lerp(y + 3, sqY, su)}
                    width={lerp(gw, side, su)}
                    height={lerp(BH - 6, side, su)}
                    rx={2}
                    fill={color}
                    fillOpacity={0.22 + 0.2 * sqFocus}
                    stroke={color}
                    strokeWidth={1.5 + 1.5 * sqFocus}
                  />
                  {su > 0.95 &&
                    Array.from({ length: l.slack - 1 }, (_, j) => (
                      <g key={j} stroke={color} strokeOpacity={0.45} strokeWidth={1}>
                        <line x1={sqX + (j + 1) * Q} y1={sqY} x2={sqX + (j + 1) * Q} y2={sqY + side} />
                        <line x1={sqX} y1={sqY + (j + 1) * Q} x2={sqX + side} y2={sqY + (j + 1) * Q} />
                      </g>
                    ))}
                </g>
              )}
              {!l.last && side === 0 && su > 0.005 && <rect x={sqX - 2} y={y + BH / 2 - 2} width={4} height={4} fill={color} opacity={su * aux * auxOp} />}
              {chips[k] > 0.005 && (
                <text x={P0.x + COL + 20 + 64 + 14} y={y + BH / 2 + 7} fontSize={20} fontFamily={MONO} fontWeight={700} fill={color} opacity={chips[k] * aux * auxOp}>
                  {l.cost}
                  {l.last && (
                    <tspan fontSize={14} fontWeight={400} fill={colors.MUTED}>
                      {'  last line'}
                    </tspan>
                  )}
                </text>
              )}
            </g>
          );
        })}
        {tallyText && (
          <text x={P0.x} y={478} fontSize={26} fontFamily={MONO} fontWeight={700} fill={color} opacity={clamp01(tally * 2) * aux * auxOp}>
            {tallyText}
          </text>
        )}
      </g>
    );
  };

  // DP layer
  const postsU = v(scene.postsU);
  const tableU = v(scene.tableU);
  const walk = v(scene.walk);
  const backU = v(scene.backU);
  const cutU = v(scene.cutU);
  const onPath = (k: number) => {
    const idx = PATH.indexOf(k);
    return idx >= 0 && backU >= idx - 0.05 && backU > 0.01;
  };
  const orderU = v(scene.orderU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <pattern id="kp1-hatch" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke={colors.MUTED} strokeWidth={2} strokeOpacity={0.55} />
        </pattern>
        <pattern id="kp1-hatch-red" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeOpacity={0.8} />
        </pattern>
      </defs>
      <Camera {...cam}>
        {/* ================= B0–B2 · the strip, the column, the measurements ================= */}
        <g opacity={introOp}>
          {/* column edge at 6 px */}
          {v(scene.edgeU) > 0.005 && (
            <g opacity={v(scene.edgeU) * stripOp}>
              <line x1={RX(MAX_W)} y1={INTRO.y - 30} x2={RX(MAX_W)} y2={INTRO.y + BH + 30} stroke={colors.WARM} strokeWidth={2 + 3 * v(scene.edgePulse)} strokeDasharray="7 5" />
              <line x1={RX(MAX_W)} y1={INTRO.y - 30} x2={RX(MAX_W)} y2={INTRO.y + BH + 30} stroke={colors.WARM} strokeWidth={12} opacity={0.25 * v(scene.edgePulse)} />
              <text x={RX(MAX_W) + 8} y={INTRO.y + BH + 44} fontSize={13} fill={colors.WARM} opacity={1 - ruler}>
                column edge
              </text>
            </g>
          )}
          {/* the whole paragraph vs one line at a time */}
          {v(scene.wholeU) > 0.005 && (
            <g opacity={clamp01(v(scene.wholeU) * 1.5)}>
              <path d={`M ${RX(0)} ${INTRO.y - 8} L ${RX(0)} ${INTRO.y - 16} L ${lerp(RX(0), RX(15), v(scene.wholeU))} ${INTRO.y - 16}`} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
              {v(scene.wholeU) > 0.98 && <line x1={RX(15)} y1={INTRO.y - 16} x2={RX(15)} y2={INTRO.y - 8} stroke={colors.ACCENT} strokeWidth={2} />}
              <text x={RX(7.5)} y={INTRO.y - 28} textAnchor="middle" fontSize={16} fill={colors.ACCENT}>
                cheapest breaks for the whole paragraph
              </text>
            </g>
          )}
          {v(scene.oneLineU) > 0.005 && (
            <g opacity={clamp01(v(scene.oneLineU) * 1.5)}>
              <path d={`M ${RX(0)} ${INTRO.y + BH + 8} L ${RX(0)} ${INTRO.y + BH + 16} L ${lerp(RX(0), RX(MAX_W), v(scene.oneLineU))} ${INTRO.y + BH + 16} L ${RX(MAX_W)} ${INTRO.y + BH + 8}`} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={RX(3)} y={INTRO.y + BH + 38} textAnchor="middle" fontSize={16} fill={colors.NEGATIVE}>
                not one line at a time
              </text>
            </g>
          )}
          {/* question marks in the spaces */}
          {v(scene.qU) > 0.005 &&
            [3.5, 6.5, 9.5].map((p, k) => (
              <text key={k} x={RX(p)} y={INTRO.y + 30 - 6 * (1 - v(scene.qU))} textAnchor="middle" fontSize={22} fontWeight={700} fill={colors.WARM} opacity={v(scene.qU) * stripOp * (1 - 0.3 * Math.sin(k + 1))}>
                ?
              </text>
            ))}
          {/* ruler: whole pixels 0..15 */}
          {ruler > 0.005 && (
            <g opacity={stripOp}>
              <line x1={RX(0)} y1={INTRO.y + BH + 14} x2={lerp(RX(0), RX(15), clamp01(ruler * 1.2))} y2={INTRO.y + BH + 14} stroke={colors.MUTED} strokeWidth={1.5} />
              {Array.from({ length: 16 }, (_, p) => {
                const u = clamp01(ruler * 16 * 1.1 - p);
                if (u <= 0) return null;
                return (
                  <g key={p} opacity={u}>
                    <line x1={RX(p)} y1={INTRO.y + BH + 14} x2={RX(p)} y2={INTRO.y + BH + 20} stroke={colors.MUTED} strokeWidth={1.2} />
                    <text x={RX(p)} y={INTRO.y + BH + 34} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                      {p}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
          {v(scene.spacesU) > 0.005 &&
            [3.5, 6.5, 9.5].map((p, k) => (
              <text key={k} x={RX(p)} y={INTRO.y + BH + 56} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={v(scene.spacesU) * stripOp}>
                1 px
              </text>
            ))}
          {v(scene.bracketU) > 0.005 && (
            <g opacity={clamp01(v(scene.bracketU) * 1.5) * stripOp}>
              <path d={`M ${RX(0)} ${INTRO.y - 8} L ${RX(0)} ${INTRO.y - 16} L ${lerp(RX(0), RX(MAX_W), v(scene.bracketU))} ${INTRO.y - 16} L ${RX(MAX_W)} ${INTRO.y - 8}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
              <text x={RX(3)} y={INTRO.y - 26} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.WARM}>
                maxWidth 6 px
              </text>
            </g>
          )}
          {v(scene.codeU) > 0.005 && (
            <g opacity={v(scene.codeU) * stripOp}>
              <rect x={445} y={INTRO.y + BH + 70} width={390} height={74} rx={6} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} />
              <rect x={445} y={INTRO.y + BH + 70} width={4} height={74} rx={2} fill={SAND} />
              {['classicParagraph', 'lineStarts [0, 4, 7, 10]', 'lineEnds   [3, 6, 9, 15]'].map((l, k) => (
                <text key={k} x={461} y={INTRO.y + BH + 92 + k * 20} fontSize={14} fontFamily={MONO} fill={k === 0 ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
                  {l}
                </text>
              ))}
            </g>
          )}
        </g>

        {/* ================= B1 · a fixed program; Cheng's question ================= */}
        {v(scene.progU) > 0.005 && (
          <g opacity={v(scene.progOp)}>
            <text x={230} y={318} fontSize={16} fill={colors.MUTED} opacity={v(scene.progU)}>
              a fixed program of
            </text>
            {['sums', 'table lookups', 'relus'].map((label, k) => {
              const u = v(scene.tileU[k]);
              if (u <= 0.005) return null;
              const x = 230 + k * 150;
              return (
                <g key={k} opacity={u} transform={`translate(${x + 65}, 375) scale(${lerp(0.85, 1, u)}) translate(${-x - 65}, -375)`}>
                  <rect x={x} y={335} width={130} height={80} rx={8} fill={colors.PANEL} stroke={k === 2 ? colors.SECONDARY : colors.GRID} strokeWidth={1.5} />
                  {k === 0 && (
                    <text x={x + 65} y={378} textAnchor="middle" fontSize={30} fill={colors.TEXT}>
                      Σ
                    </text>
                  )}
                  {k === 1 &&
                    [0, 1, 2, 3, 4].map((c) => (
                      <rect key={c} x={x + 15 + c * 20} y={354} width={18} height={18} rx={2} fill={c === 2 ? colors.WARM : 'none'} fillOpacity={0.85} stroke={colors.MUTED} />
                    ))}
                  {k === 2 && <ReluGlyph x={x + 40} y={378} w={50} width={4} />}
                  <text x={x + 65} y={403} textAnchor="middle" fontSize={14} fill={k === 2 ? colors.SECONDARY : colors.TEXT}>
                    {label}
                  </text>
                </g>
              );
            })}
            <MathLabel tex={'\\mathrm{relu}(x)=\\max(0,\\,x)'} x={455} y={458} fontSize={22} color={colors.SECONDARY} opacity={v(scene.texReluU)} boxWidth={400} />
            {v(scene.chengU) > 0.005 && (
              <g opacity={v(scene.chengU)}>
                {Array.from({ length: 6 }, (_, k) => {
                  const u = clamp01(v(scene.stackU) * 6 - k);
                  if (u <= 0) return null;
                  return (
                    <g key={k} opacity={u} transform={`translate(${740 + k * 9}, ${338 + k * 12})`}>
                      {PARA.lineStarts.map((st, i) => (
                        <rect key={i} x={st * 12} y={0} width={BOX_W[i] * 12} height={10} rx={2} fill={SAND} opacity={0.9} />
                      ))}
                    </g>
                  );
                })}
                {v(scene.gpuU) > 0.005 && (
                  <g opacity={v(scene.gpuU)}>
                    <line x1={985} y1={378} x2={1018} y2={378} stroke={colors.MUTED} strokeWidth={2} />
                    <polygon points="1026,378 1016,372 1016,384" fill={colors.MUTED} />
                    <rect x={1032} y={348} width={110} height={60} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
                    {[0, 1, 2, 3].map((r) => (
                      <line key={r} x1={1032 + 18 + r * 24} y1={341} x2={1032 + 18 + r * 24} y2={348} stroke={colors.WARM} strokeWidth={2} />
                    ))}
                    <text x={1087} y={385} textAnchor="middle" fontSize={18} fontWeight={700} fill={colors.WARM}>
                      GPU?
                    </text>
                  </g>
                )}
                <text x={935} y={458} textAnchor="middle" fontSize={16} fill={colors.TEXT}>
                  Cheng: many paragraphs at once, faster on a GPU?
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B3–B7 · greedy vs cheapest, side by side ================= */}
        {panel(G_LINES, GP, colors.NEGATIVE, v(scene.gColU), gLayer, scene.gGap.map(v), scene.gSq.map(v), scene.gChip.map(v), v(scene.gTally), 'greedy filling', 1)}
        {panel(O_LINES, OP, colors.ACCENT, v(scene.oColU), panelsOp, scene.oGap.map(v), scene.oSq.map(v), scene.oChip.map(v), v(scene.oTally), 'cheapest breaks', oAux, v(scene.capU))}
        {/* greedy ghosts: red outlines where a brick has left the greedy layout */}
        {gLayer > 0.005 &&
          forms.map((f, i) => {
            const u = clamp01(f - 1) * (f < 3 ? 1 : 0);
            if (u <= 0.005) return null;
            const p = FORMS[1][i];
            return <rect key={i} x={p.x} y={p.y} width={BOX_W[i] * S} height={BH} rx={4} fill={colors.NEGATIVE} fillOpacity={0.08} stroke={colors.NEGATIVE} strokeOpacity={0.7} strokeDasharray="5 4" opacity={u * gLayer * (1 - 0.85 * brickDim)} />;
          })}
        {v(scene.fullU) > 0.005 && (
          <text x={GP.x + COL + 20} y={GP.ys[0] + BH / 2 + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.fullU)}>
            3 + 1 + 2 = 6 px, full
          </text>
        )}
        {/* greedy: the fourth box tries to join the third and overflows */}
        {v(scene.g4U) > 0.005 && v(scene.g4Op) > 0.005 && (() => {
          const a = FORMS[0][3];
          const tgt = { x: GP.x + (BOX_W[2] + 1) * S, y: GP.ys[1] };
          const u = ease.move(v(scene.g4U));
          const x = lerp(a.x, tgt.x, u);
          const y = lerp(a.y, tgt.y, u);
          const edge = GP.x + COL;
          return (
            <g opacity={v(scene.g4Op) * clamp01(v(scene.g4U) * 3)}>
              <rect x={x} y={y} width={BOX_W[3] * S} height={BH} rx={4} fill={SAND} fillOpacity={0.35} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 4" />
              {u > 0.95 && <rect x={edge} y={y} width={x + BOX_W[3] * S - edge} height={BH} fill="url(#kp1-hatch-red)" />}
              {u > 0.95 && (
                <text x={x + BOX_W[3] * S + 12} y={y + BH / 2 + 5} fontSize={14} fontFamily={MONO} fill={colors.NEGATIVE}>
                  2 + 1 + 5 = {naturalWidth(2, 4)} px {'>'} 6
                </text>
              )}
            </g>
          );
        })()}
        <g opacity={v(scene.texCostU) * panelsOp}>
          <MathLabel tex={'\\text{lineCost} = \\min(\\text{slack},\\,63)^2'} x={GP.x} y={140} fontSize={24} anchor="start" boxWidth={520} opacity={v(scene.texCostU) > 0.005 ? 1 : 0} />
          <text x={GP.x} y={178} fontSize={14} fill={colors.MUTED}>
            slack = 6 px − line width · the last line costs 0
          </text>
        </g>
        {v(scene.beatsU) > 0.005 && (
          <text x={OP.x + 250} y={478} fontSize={18} fill={colors.WARM} opacity={v(scene.beatsU) * aux * oAux * panelsOp}>
            beats {G_TOTAL}
          </text>
        )}
        {v(scene.compareU) > 0.005 && (
          <MathLabel tex={'4^2 = 16 \\;>\\; 3^2 + 1^2 = 10'} x={640} y={552} fontSize={28} color={colors.TEXT} opacity={v(scene.compareU) * panelsOp} boxWidth={600} />
        )}
        {v(scene.annotU) > 0.005 && (
          <g opacity={v(scene.annotU) * panelsOp} fontSize={14} fill={colors.WARM}>
            <text x={OP.x + COL + 130} y={OP.ys[0] + BH / 2 + 5}>worse early line: 9 vs 0</text>
            <text x={OP.x + COL + 130} y={OP.ys[1] + BH / 2 + 5}>better later: 1 vs 16</text>
          </g>
        )}
        {/* B7: a line that overflows (1 → 4) and a box wider than its column */}
        {v(scene.ovfU) > 0.005 && v(scene.ovfOp) > 0.005 && (() => {
          const a = FORMS[2][3];
          const tgt = { x: OP.x + (naturalWidth(1, 3) + 1) * S, y: OP.ys[1] };
          const u = ease.move(v(scene.ovfU));
          const x = lerp(a.x, tgt.x, u);
          const y = lerp(a.y, tgt.y, u) - Math.sin(Math.PI * u) * 20;
          return (
            <g opacity={v(scene.ovfOp) * panelsOp}>
              <rect x={x} y={y} width={BOX_W[3] * S} height={BH} rx={4} fill="url(#kp1-hatch-red)" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 4" />
              <text x={x + (BOX_W[3] * S) / 2} y={y + BH / 2 + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} stroke={colors.BG} strokeWidth={3} paintOrder="stroke">
                {naturalWidth(1, 4)} px {'>'} 6
              </text>
            </g>
          );
        })()}
        {v(scene.infChipU) > 0.005 && (
          <g opacity={v(scene.infChipU) * panelsOp}>
            <line x1={OP.x + COL + 100} y1={168} x2={OP.x + COL + 100} y2={OP.ys[1] - 4} stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={v(scene.ovfOp)} />
            <Chip x={OP.x + 20} y={150} anchor="start" size={14} text={`lineCost(1, 4) = infeasible = 2²² = ${commas(INFEASIBLE)}`} color={colors.NEGATIVE} border={colors.NEGATIVE} />
            <text x={OP.x + 30} y={190} fontSize={14} fill={colors.NEGATIVE} opacity={v(scene.neverU)}>
              so it is never chosen
            </text>
          </g>
        )}
        {v(scene.capU) > 0.005 && (
          <g opacity={v(scene.capU) * panelsOp}>
            <text x={OP.x + 4 * S - 6} y={OP.ys[2] - 10} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.WARM}>
              column 4 px
            </text>
          </g>
        )}
        {v(scene.capChipU) > 0.005 && (
          <g opacity={v(scene.capChipU) * panelsOp}>
            <Chip x={OP.x} y={452} anchor="start" size={14} text={`one box: lineCostCap = 63² = ${commas(LINE_COST_CAP)}`} color={colors.WARM} border={colors.WARM} />
            <text x={OP.x + 4} y={490} fontSize={13} fill={colors.MUTED}>
              a box wider than its column still gets a line: knuth-plass.test.ts:25
            </text>
          </g>
        )}

        {/* ================= B8–B12 · posts, candidate arcs, the cost table ================= */}
        <g opacity={v(scene.dpOp)}>
        {postsU > 0.005 &&
          POST_X.map((x, k) => {
            const u = clamp01(postsU * 5 * 1.2 - k);
            if (u <= 0) return null;
            const lit = onPath(k);
            const cur = Math.abs(walk - k) < 0.5 && walk >= 0;
            return (
              <g key={k} opacity={u}>
                <line x1={x} y1={lerp(POST_BOT, POST_TOP, u)} x2={x} y2={POST_BOT} stroke={lit ? colors.ACCENT : colors.MUTED} strokeWidth={lit ? 2.5 : 1.5} strokeOpacity={lit ? 1 : 0.6} />
                <circle cx={x} cy={NODE_Y} r={13} fill={lit ? colors.ACCENT : colors.PANEL} stroke={cur ? colors.WARM : lit ? colors.ACCENT : colors.MUTED} strokeWidth={cur ? 3 : 1.5} />
                <text x={x} y={NODE_Y + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={lit ? '#06121f' : colors.TEXT}>
                  {k}
                </text>
              </g>
            );
          })}
        {cutU > 0.005 &&
          SOL.breaks.slice(0, -1).map((k) => (
            <line key={k} x1={POST_X[k]} y1={DP.y - 12} x2={POST_X[k]} y2={DP.y + BH + 12} stroke={colors.ACCENT} strokeWidth={4} strokeLinecap="round" opacity={cutU} />
          ))}
        {/* strip ghost once the bricks are re-cut */}
        {forms.map((f, i) => {
          const u = clamp01(f - 3);
          if (u <= 0.005) return null;
          const p = FORMS[3][i];
          return <rect key={i} x={p.x} y={p.y} width={BOX_W[i] * S} height={BH} rx={4} fill="none" stroke={SAND} strokeOpacity={0.45} strokeDasharray="5 4" opacity={u} />;
        })}
        {ARCS.map((a) => {
          const draw = v(scene.arcDraw[a.key]);
          if (draw <= 0.005) return null;
          const w = v(scene.win[a.to]);
          const pOp = v(scene.postOp[a.to]);
          const op = pOp * (a.win ? 1 : 1 - 0.75 * w);
          const color = !a.feasible ? colors.MUTED : a.win ? (w > 0.5 ? colors.ACCENT : colors.TEXT) : colors.MUTED;
          const cOp = v(scene.arcChip[a.key]) * v(scene.chipOp[a.to]) * op;
          const ordinal = ['1st', '2nd', '3rd', '4th'][a.order - 1];
          return (
            <g key={a.key}>
              <path d={a.d} fill="none" stroke={color} strokeWidth={a.win ? 2 + 2 * w : 1.8} strokeDasharray={a.feasible ? `${a.len}` : '4 5'} strokeDashoffset={a.feasible ? a.len * (1 - draw) : 0} opacity={op * (a.feasible ? 1 : draw * 0.8)} />
              {draw > 0.95 && <polygon points={`${POST_X[a.to]},${ARC_Y0} ${POST_X[a.to] - 5},${ARC_Y0 + 9} ${POST_X[a.to] + 5},${ARC_Y0 + 9}`} fill={color} opacity={op} />}
              {cOp > 0.005 && (
                <Chip x={a.chipX} y={a.chipY} text={a.chip} color={a.feasible ? (a.win && w > 0.5 ? colors.ACCENT : colors.TEXT) : colors.MUTED} border={a.win && w > 0.5 ? colors.ACCENT : colors.GRID} opacity={cOp} italic={!a.feasible} dashed={!a.feasible} />
              )}
              {a.to === 3 && orderU > 0.005 && (
                <text x={a.chipX - (a.chip.length * CH13 + 16) / 2 - 8} y={a.chipY + 5} textAnchor="end" fontSize={13} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={orderU * v(scene.arcChip[a.key]) * v(scene.chipOp[a.to])}>
                  {ordinal}
                </text>
              )}
            </g>
          );
        })}
        {tableU > 0.005 && (
          <g opacity={tableU}>
            {(['costs', 'predecessors'] as const).map((label, r) => (
              <text key={label} x={POST_X[0] - CELL_W / 2 - 12} y={(r ? PRED_Y : COST_Y) + CELL_H / 2 + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                {label}
              </text>
            ))}
            {POST_X.map((x, k) => {
              const u = v(scene.cell[k]);
              const pathIdx = PATH.indexOf(k);
              const predLit = pathIdx >= 0 && pathIdx < PATH.length - 1 && backU >= pathIdx + 0.5;
              return (
                <g key={k}>
                  {[COST_Y, PRED_Y].map((y, r) => (
                    <rect key={r} x={x - CELL_W / 2} y={y} width={CELL_W} height={CELL_H} rx={4} fill={r === 1 && predLit ? colors.ACCENT : colors.PANEL} fillOpacity={r === 1 && predLit ? 0.25 : 1} stroke={r === 1 && predLit ? colors.ACCENT : colors.GRID} strokeWidth={1.4} />
                  ))}
                  {u > 0.005 && (
                    <g opacity={u}>
                      <text x={x} y={COST_Y + CELL_H / 2 + 6} textAnchor="middle" fontSize={17} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                        {SOL.costs[k]}
                      </text>
                      <text x={x} y={PRED_Y + CELL_H / 2 + 6} textAnchor="middle" fontSize={17} fontFamily={MONO} fontWeight={700} fill={predLit ? colors.ACCENT : colors.TEXT}>
                        {SOL.preds[k]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}
        <MathLabel
          tex={'\\text{cost}[to] = \\min_{from}\\big(\\text{cost}[from] + \\text{lineCost}(from,\\,to)\\big)'}
          x={510}
          y={88}
          fontSize={22}
          boxWidth={640}
          opacity={v(scene.formulaU)}
        />
        {/* backtrack: follow predecessors 4 → 3 → 1 → 0 */}
        {backU > 0.005 &&
          HOPS.map((h, k) => {
            const u = clamp01(backU - k);
            if (u <= 0.005) return null;
            return (
              <g key={k}>
                <path d={h.d} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray={h.len} strokeDashoffset={h.len * (1 - u)} strokeLinecap="round" />
                {u > 0.95 && <polygon points={`${h.xb},${HOP_Y + 2} ${h.xb - 6},${HOP_Y - 9} ${h.xb + 6},${HOP_Y - 9}`} fill={colors.ACCENT} />}
              </g>
            );
          })}

        </g>

        {/* B10: the tie rule, verbatim from reference.ts */}
        {v(scene.tieU) > 0.005 && (
          <g opacity={v(scene.tieU)}>
            <rect x={880} y={150} width={340} height={134} rx={6} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
            <rect x={880} y={150} width={4} height={134} rx={2} fill={colors.ACCENT} />
            <rect x={888} y={198 + 2 * 20 - 15} width={326} height={20} rx={3} fill={colors.WARM} opacity={0.22 * v(scene.strictGlow)} />
            {['// reference.ts:36-41', 'for (let boxes = 1; …; boxes++) {', '  const from = to - boxes', '  if (total < best) {', '    best = total; predecessor = from'].map((l, k) => (
              <text key={k} x={896} y={174 + k * 20} fontSize={13} fontFamily={MONO} fill={k === 0 ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
                {l}
              </text>
            ))}
            <text x={880} y={312} fontSize={14} fill={colors.TEXT}>
              shortest line first; only strictly cheaper replaces,
            </text>
            <text x={880} y={332} fontSize={14} fill={colors.TEXT}>
              so on equal totals the shortest last line wins
            </text>
          </g>
        )}

        {/* B11: the circuit's arithmetic, on line 1 → 3 and on break point 3's first pair */}
        {v(scene.circA[0]) > 0.005 && (
          <g opacity={v(scene.circOp)}>
            <text x={830} y={140} fontSize={15} fill={colors.MUTED}>
              line 1 → 3: width {naturalWidth(C_LINE.from, C_LINE.to)} px, slack {C_SLACK}, D = width − 6 = {C_D}
            </text>
            <OpRow x={830} y={154} op="read" relu={false} expr="squared = min(slack, 63)²" value={String(C_SQUARED)} opacity={v(scene.circA[0])} />
            <OpRow x={830} y={196} op="relu" relu expr="ramp = relu(1 − D)" value={String(C_RAMP)} opacity={v(scene.circA[1])} />
            <OpRow x={830} y={238} op="relu" relu expr="overflows = relu(1 − ramp)" value={String(C_OVER)} opacity={v(scene.circA[2])} />
            <OpRow x={830} y={280} op="sum" relu={false} expr="squared + overflows × 2²²" value={String(C_COST)} opacity={v(scene.circA[3])} />
            {v(scene.circB[0]) > 0.005 && (
              <text x={830} y={362} fontSize={15} fill={colors.MUTED} opacity={v(scene.circB[0])}>
                break point 3: min(left {MIN_LEFT}, right {MIN_RIGHT})
              </text>
            )}
            <OpRow x={830} y={376} op="relu" relu expr={`excess = relu(${MIN_LEFT} − ${MIN_RIGHT})`} value={String(MIN_EXCESS)} opacity={v(scene.circB[1])} />
            <OpRow x={830} y={418} op="sum" relu={false} expr={`value = ${MIN_LEFT} − excess`} value={String(MIN_VALUE)} opacity={v(scene.circB[2])} />
          </g>
        )}

        {/* B12: the re-cut layout and the tally */}
        {v(scene.finU) > 0.005 && (
          <g opacity={v(scene.finU)}>
            <text x={FIN.x} y={FIN.ys[0] - 16} fontSize={15} fontFamily={MONO} fill={colors.ACCENT}>
              breaks = [{SOL.breaks.join(', ')}]
            </text>
            {O_LINES.map((l, k) => (
              <g key={k}>
                <rect x={FIN.x} y={FIN.ys[k]} width={COL} height={BH} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
                <line x1={FIN.x + COL} y1={FIN.ys[k] - 6} x2={FIN.x + COL} y2={FIN.ys[k] + BH + 6} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
                <rect x={FIN.x + l.width * S} y={FIN.ys[k] + 3} width={l.slack * S} height={BH - 6} rx={3} fill="url(#kp1-hatch)" opacity={clamp01(forms[l.to - 1] - 3)} />
                <text x={FIN.x + COL + 14} y={FIN.ys[k] + BH / 2 + 6} fontSize={18} fontFamily={MONO} fontWeight={700} fill={colors.ACCENT} opacity={clamp01(forms[l.to - 1] - 3.6) * 2.5}>
                  {l.cost}
                </text>
              </g>
            ))}
          </g>
        )}
        {v(scene.tallyU) > 0.005 && (
          <g opacity={v(scene.tallyU)}>
            <rect x={FIN.x} y={386} width={300} height={96} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={FIN.x + 20} y={412} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              totalCost
            </text>
            <text x={FIN.x + 20} y={462} fontSize={44} fontFamily={MONO} fontWeight={700} fill={colors.ACCENT}>
              {SOL.totalCost}
            </text>
            <g opacity={0.45}>
              <text x={FIN.x + 160} y={412} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                greedy
              </text>
              <text x={FIN.x + 160} y={458} fontSize={30} fontFamily={MONO} fontWeight={700} fill={colors.NEGATIVE}>
                {G_TOTAL}
              </text>
              <line x1={FIN.x + 154} y1={448} x2={FIN.x + 206} y2={436} stroke={colors.NEGATIVE} strokeWidth={2.5} />
            </g>
          </g>
        )}

        {/* ================= the bricks (drawn last: the persistent object) ================= */}
        {[0, 1, 2, 3].map((i) => {
          const f = forms[i];
          const p = brickAt(i, f);
          const enter = clamp01(bricksIn * 1.9 - i * 0.3);
          const hi = Math.abs(widthHi - (i + 1)) < 0.5 ? 1 : 0;
          return <Brick key={i} i={i} x={p.x - (1 - ease.move(enter)) * 160} y={p.y} opacity={brickOp(i)} hi={hi} />;
        })}
        {/* the one-box overflow, over brick 4: the last 1 px past a 4 px column */}
        {v(scene.capU) > 0.005 && (
          <rect x={OP.x + 4 * S} y={OP.ys[2]} width={S} height={BH} rx={3} fill="url(#kp1-hatch-red)" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={v(scene.capU) * panelsOp} />
        )}
      </Camera>

      {/* ================= screen-space header: title chip + source chip ================= */}
      <rect x={40} y={18} width={178} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Cheapest Breaks
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
    </>
  );
}

export const vizScene = () => scene;
