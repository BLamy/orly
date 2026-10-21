// One Winner, Two Reads
//
// Hard Attend — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/hard-attend/hard-attend.ts:7-27 (the three items: names, values 10/20/30, accents)
//   lab/hard-attend/hard-attend.ts:46-48 (scoreFor: 2 × query × j − j²)
//   lab/hard-attend/hard-attend.ts:58-71 (winnerIndexFor: leader = scores[0], strict `>` challenge, ties go left)
//   lab/hard-attend/hard-attend.ts:134-141 (winner, one-hot bits, the one-hot sum)
//   lab/hard-attend/hard-attend.ts:176-177 (onehot-formula and hard-formula text: `values[i] = v (Name)`)
//   lab/hard-attend/hard-attend.html:52 (the page's `hardAttend` label)
//   lab/status.md:9 (circuit.indexRead: 1 operation at any table size, index strictly inside ±2^24)
//   lab/status.md:257 (ties defined in advance)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim, book.json chapters[1]). One machine: the score belt from chapter 1 with a
// leader crown and a challenger frame, which then compresses upward and grows two read lanes (one-hot sum,
// direct read) that end in result slots. Every score, bit, product, sum and read is computed per frame from
// the page's own functions, copied below; the query pin is the only input.
import 'katex/dist/katex.min.css';
import { color as d3color } from 'd3';
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
const SAND = '#c58a3d'; // the book's accent: the query pin and the leader crown

// ---------------------------------------------------------------------------
// The page's own code (hard-attend.ts:7-27, 46-71, 136-141), verbatim in behaviour
// ---------------------------------------------------------------------------

const ITEMS = [
  { accent: '#0c7f84', index: 0, name: 'Aster', value: 10 },
  { accent: '#a15c18', index: 1, name: 'Banyan', value: 20 },
  { accent: '#7545a0', index: 2, name: 'Cobalt', value: 30 },
] as const;
const VALUES = ITEMS.map((it) => it.value);
const LIGHT = ITEMS.map((it) => d3color(it.accent)!.brighter(1.1).formatHex());

function scoreFor(queryIndex: number, itemIndex: number) {
  return 2 * queryIndex * itemIndex - itemIndex * itemIndex;
}

function winnerIndexFor(scores: readonly number[]) {
  let winnerIndex = 0;
  let winnerScore = scores[0];
  for (let index = 1; index < scores.length; index++) {
    const score = scores[index];
    if (score > winnerScore) {
      winnerIndex = index;
      winnerScore = score;
    }
  }
  return winnerIndex;
}

const scoresAt = (q: number): number[] => ITEMS.map((it) => scoreFor(q, it.index));
const onehotAt = (w: number): number[] => ITEMS.map((it) => (it.index === w ? 1 : 0));
const onehotSum = (bits: readonly number[]): number => ITEMS.reduce((sum, it, i) => sum + bits[i] * it.value, 0);

// the probes the captions quote (review.md): fail loudly if the copy ever drifts
{
  const check = (q: number, want: number[], w: number) => {
    const got = scoresAt(q);
    if (got.join() !== want.join() || winnerIndexFor(got) !== w) throw new Error(`probe q=${q}: ${got} → ${winnerIndexFor(got)}`);
  };
  check(0.5, [0, 0, -2], 0);
  check(1, [0, 1, 0], 1);
  check(1.5, [0, 2, 2], 1);
  for (let q = 0; q <= 2; q += 0.05) {
    const w = winnerIndexFor(scoresAt(q));
    if (onehotSum(onehotAt(w)) !== VALUES[w]) throw new Error('reads disagree');
  }
}

/** numbers as the labels show them: whole numbers bare, otherwise two decimals, a real minus sign */
const fmt = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  const s = Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(2).replace(/0$/, '');
  return s.replace('-', '−');
};

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const X = (j: number): number => 420 + 220 * j; // item index → stage x (the belt and both lanes share it)
/** the belt compresses upward when the lanes arrive (split 0 → 1) */
const beltAt = (u: number) => ({
  base: lerp(330, 172, u),
  unit: lerp(45, 13, u),
  barW: lerp(84, 60, u),
  nameY: lerp(462, 258, u),
  axisY: lerp(515, 292, u),
  crownY: lerp(196, 92, u),
  scoreSize: lerp(17, 12, u),
});
const LU = 372; // one-hot sum lane
const LL = 492; // direct read lane
const SLOT_X = 1090;
const LANE_X = 120;
const CHIP = { x: 230, w: 150 }; // winnerIndex chip, lower lane
const GATE = { x: 640, y: 66, w: 330, h: 84 };
const CODE = { x: 40, y: 150 };
const CODE_LINES = [
  'function winnerIndexFor(scores)',
  '  let winnerIndex = 0',
  '  let winnerScore = scores[0]',
  '  for (let index = 1; …; index++)',
  '    if (score > winnerScore) {',
  '      winnerIndex = index',
  '  return winnerIndex',
];
const CODE_W = Math.max(...CODE_LINES.map((l) => l.length)) * CH14 + 30;
const CASES = [
  { q: 0.5, y: 196 },
  { q: 1.5, y: 330 },
].map((c) => {
  const sc = scoresAt(c.q);
  const w = winnerIndexFor(sc);
  return { ...c, lines: [`query = ${fmt(c.q)}`, `scores [${sc.map(fmt).join(', ')}]`, `→ winner ${w} (${ITEMS[w].name})`] };
});
const CASE_X = 960;
const CASE_W = Math.max(...CASES.flatMap((c) => c.lines.map((l) => l.length))) * CH13 + 30;

const HOME: CameraState = CAMERA_HOME;
const CAM_BELT: CameraState = { x: 640, y: 330, k: 1.15 };
const CAM_GATE: CameraState = { x: 760, y: 320, k: 1.2 };
const CAM_SPLIT: CameraState = { x: 640, y: 360, k: 1.1 };
const CAM_LANES: CameraState = { x: 640, y: 400, k: 1.1 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, each timed at ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Scores are not an answer yet. You need one winner, the position of the highest score, a choice called argmax, plus a tie rule decided in advance.',
  'The page walks the scores from left to right. It starts with the first item as the leader, then challenges that leader with each item after it.',
  'A challenger takes over only if its score is strictly greater. Equal is not enough, so the earlier item keeps the lead.',
  'At a query of one half, Banyan ties Aster at zero, fails to beat it, and Aster wins. Ties go left.',
  'At one and a half, Banyan and Cobalt both score two. Banyan holds the lead against Cobalt, so Banyan wins.',
  "Now read the winner's value. The first way is a one-hot list: a one at the winner's position and zeros everywhere else.",
  "Multiply each bit by its item's value and add them up. With Banyan winning, zero, one, zero against ten, twenty, thirty gives twenty.",
  "The second way skips the sum and reads the value at the winner's position directly. The page prints Banyan's twenty, and labels this read hard attend.",
  'The two reads agree at every query. That is by construction, since both start from the same winner, so it checks the bookkeeping rather than discovering anything.',
  "They differ in cost. The one-hot sum touches every item, while the toolkit's index read copies one entry in a single operation at any table size.",
  'That is hard attention: score, take the leftmost highest, read the winner. It is exact, with no blending anywhere.',
];
const HOLD = 0.6;
const DURS = CAPTIONS.map((c) => +(c.split(/\s+/).length / 2.5 + 0.6).toFixed(1));
const STARTS = DURS.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0.4 : acc[i - 1] + DURS[i - 1] + HOLD], []);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_BELT, cameraInterp);
  const q = tl.channel('query', 1.5);
  const pinU = tl.channel('pinU', 0);
  const beltU = tl.channel('beltU', 0);
  const beltOp = tl.channel('beltOp', 1);
  const askU = tl.channel('askU', 0);
  const chipU = tl.channel('codeChipU', 0);
  const codeLine = tl.channel('codeLine', -1);
  const crownU = tl.channel('crownU', 0);
  const crownX = tl.channel('crownX', 0);
  const followU = tl.channel('crownFollows', 0);
  const cursorU = tl.channel('cursorU', 0);
  const cursorX = tl.channel('cursorX', 1);
  const gateU = tl.channel('gateU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const dimA = tl.channel('dimAster', 0);
  const caseA = tl.channel('caseA', 0);
  const caseB = tl.channel('caseB', 0);
  const tieU = tl.channel('tieTag', 0);
  const splitU = tl.channel('splitU', 0);
  const lane1U = tl.channel('lane1U', 0);
  const lane1Op = tl.channel('lane1Op', 1);
  const bitsU = tl.channel('bitsU', 0);
  const bitShift = tl.channel('bitShift', 0);
  const tilesU = tl.channel('tilesU', 0);
  const prodU = tl.channel('prodU', 0);
  const flyU = tl.channel('flyU', 0);
  const form1U = tl.channel('onehotFormula', 0);
  const lane2U = tl.channel('lane2U', 0);
  const arrowU = tl.channel('arrowU', 0);
  const readU = tl.channel('readU', 0);
  const form2U = tl.channel('hardFormula', 0);
  const hardU = tl.channel('hardAttendTag', 0);
  const eqU = tl.channel('eqU', 0);
  const cost1U = tl.channel('costSum', 0);
  const cost2U = tl.channel('costRead', 0);
  const dimU = tl.channel('finaleDim', 0);
  const finU = tl.channel('finaleU', 0);
  const exactU = tl.channel('exactU', 0);

  const S = STARTS;
  CAPTIONS.forEach((text, i) => {
    tl.caption({ at: S[i], dur: DURS[i], text });
    tl.hold(S[i] + DURS[i], HOLD);
  });

  // — B0 · scores are not an answer: which one? —
  tl.tween(beltU, 1, { at: S[0] + 0.3, dur: 1.3, ease: ease.linear });
  tl.tween(pinU, 1, { at: S[0] + 1.3, dur: 0.6, ease: ease.enter });
  tl.tween(askU, 1, { at: S[0] + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, HOME, { at: S[0] + 5.0, dur: 1.3, ease: ease.move });
  tl.tween(chipU, 1, { at: S[0] + 5.6, dur: 0.7, ease: ease.enter });
  tl.set(codeLine, 0, S[0] + 6.0);
  tl.set(codeLine, 4, S[0] + 8.6); // "a tie rule decided in advance": the strict >

  // — B1 · leader = the first item; challengers in order —
  tl.tween(askU, 0, { at: S[1], dur: 0.5, ease: ease.move });
  tl.set(codeLine, 2, S[1] + 0.3);
  tl.tween(crownU, 1, { at: S[1] + 0.6, dur: 0.6, ease: ease.pop });
  tl.set(codeLine, 3, S[1] + 3.0);
  tl.tween(cursorU, 1, { at: S[1] + 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(gateU, 1, { at: S[1] + 4.2, dur: 0.6, ease: ease.enter });
  tl.set(codeLine, 4, S[1] + 4.6);
  tl.tween(verdictU, 1, { at: S[1] + 5.0, dur: 0.4, ease: ease.pop });
  tl.set(codeLine, 5, S[1] + 5.5);
  tl.tween(crownX, 1, { at: S[1] + 5.6, dur: 0.8, ease: ease.move });
  tl.tween(verdictU, 0, { at: S[1] + 7.4, dur: 0.3, ease: ease.move });
  tl.set(codeLine, 3, S[1] + 7.6);
  tl.tween(cursorX, 2, { at: S[1] + 7.7, dur: 0.8, ease: ease.move });

  // — B2 · strictly greater: equal keeps the earlier leader —
  tl.tween(cam, CAM_GATE, { at: S[2], dur: 1.2, ease: ease.move });
  tl.tween(dimA, 1, { at: S[2], dur: 0.6, ease: ease.move });
  tl.tween(chipU, 0, { at: S[2], dur: 0.6, ease: ease.move });
  tl.set(codeLine, 4, S[2]);
  tl.tween(verdictU, 1, { at: S[2] + 2.2, dur: 0.4, ease: ease.pop });

  // — B3 · query one half: Banyan ties Aster, Aster wins —
  tl.tween(cam, HOME, { at: S[3], dur: 1.1, ease: ease.move });
  tl.tween(dimA, 0, { at: S[3], dur: 0.6, ease: ease.move });
  tl.tween(verdictU, 0, { at: S[3], dur: 0.3, ease: ease.move });
  tl.tween(crownX, 0, { at: S[3] + 0.3, dur: 0.6, ease: ease.move });
  tl.tween(cursorX, 1, { at: S[3] + 0.3, dur: 0.6, ease: ease.move });
  tl.tween(q, 0.5, { at: S[3] + 0.4, dur: 1.2, ease: ease.move });
  tl.tween(verdictU, 1, { at: S[3] + 2.0, dur: 0.4, ease: ease.pop });
  tl.tween(verdictU, 0, { at: S[3] + 3.5, dur: 0.3, ease: ease.move });
  tl.tween(cursorX, 2, { at: S[3] + 3.7, dur: 0.6, ease: ease.move });
  tl.tween(verdictU, 1, { at: S[3] + 4.4, dur: 0.4, ease: ease.pop });
  tl.tween(caseA, 1, { at: S[3] + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(tieU, 1, { at: S[3] + 6.0, dur: 0.5, ease: ease.pop });

  // — B4 · query one and a half: Banyan beats Aster, holds against Cobalt —
  tl.tween(caseA, 0.12, { at: S[4], dur: 0.6, ease: ease.move });
  tl.tween(tieU, 0.12, { at: S[4], dur: 0.6, ease: ease.move });
  tl.tween(verdictU, 0, { at: S[4], dur: 0.3, ease: ease.move });
  tl.tween(crownX, 0, { at: S[4] + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(cursorX, 1, { at: S[4] + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(q, 1.5, { at: S[4] + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(verdictU, 1, { at: S[4] + 1.7, dur: 0.4, ease: ease.pop });
  tl.tween(crownX, 1, { at: S[4] + 2.3, dur: 0.7, ease: ease.move });
  tl.tween(verdictU, 0, { at: S[4] + 3.4, dur: 0.3, ease: ease.move });
  tl.tween(cursorX, 2, { at: S[4] + 3.6, dur: 0.6, ease: ease.move });
  tl.tween(verdictU, 1, { at: S[4] + 4.3, dur: 0.4, ease: ease.pop });
  tl.tween(caseB, 1, { at: S[4] + 5.0, dur: 0.6, ease: ease.enter });

  // — B5 · the belt compresses, the one-hot lane opens: 0 1 0 —
  for (const ch of [gateU, verdictU, cursorU, chipU, caseA, caseB, tieU]) tl.tween(ch, 0, { at: S[5], dur: 0.6, ease: ease.move });
  tl.tween(q, 1, { at: S[5] + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(splitU, 1, { at: S[5] + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_SPLIT, { at: S[5] + 0.8, dur: 1.4, ease: ease.move });
  tl.tween(lane1U, 1, { at: S[5] + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(bitsU, 1, { at: S[5] + 3.6, dur: 1.2, ease: ease.linear });

  // — B6 · bits × values, summed: 20 —
  tl.tween(cam, CAM_LANES, { at: S[6], dur: 1.0, ease: ease.move });
  tl.tween(beltOp, 0.15, { at: S[6], dur: 0.6, ease: ease.move });
  tl.tween(bitShift, 1, { at: S[6] + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(tilesU, 1, { at: S[6] + 0.8, dur: 0.9, ease: ease.linear });
  tl.tween(prodU, 1, { at: S[6] + 2.8, dur: 0.9, ease: ease.linear });
  tl.tween(flyU, 1, { at: S[6] + 5.0, dur: 1.8, ease: ease.linear });
  tl.tween(form1U, 1, { at: S[6] + 7.2, dur: 0.6, ease: ease.enter });

  // — B7 · the direct read: values[1] = 20, labelled hardAttend —
  tl.tween(lane1Op, 0.15, { at: S[7], dur: 0.6, ease: ease.move });
  tl.tween(lane2U, 1, { at: S[7] + 0.3, dur: 0.9, ease: ease.linear });
  tl.tween(arrowU, 1, { at: S[7] + 2.3, dur: 1.2, ease: ease.draw });
  tl.tween(readU, 1, { at: S[7] + 4.2, dur: 1.0, ease: ease.move });
  tl.tween(form2U, 1, { at: S[7] + 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(hardU, 1, { at: S[7] + 7.4, dur: 0.5, ease: ease.pop });

  // — B8 · both slots, one equals sign; sweep the query —
  tl.tween(cam, HOME, { at: S[8], dur: 1.2, ease: ease.move });
  tl.tween(lane1Op, 1, { at: S[8], dur: 0.6, ease: ease.move });
  tl.tween(beltOp, 1, { at: S[8], dur: 0.6, ease: ease.move });
  tl.tween(eqU, 1, { at: S[8] + 0.8, dur: 0.6, ease: ease.pop });
  tl.set(followU, 1, S[8] + 1.6);
  tl.tween(q, 0, { at: S[8] + 2.0, dur: 1.4, ease: ease.move });
  tl.tween(q, 2, { at: S[8] + 3.8, dur: 3.2, ease: ease.linear });
  tl.tween(q, 1, { at: S[8] + 7.4, dur: 1.4, ease: ease.move });

  // — B9 · cost: every item vs one entry —
  tl.tween(cam, CAM_LANES, { at: S[9], dur: 1.1, ease: ease.move });
  tl.tween(eqU, 0.12, { at: S[9], dur: 0.6, ease: ease.move });
  tl.tween(beltOp, 0.15, { at: S[9], dur: 0.6, ease: ease.move });
  tl.tween(cost1U, 1, { at: S[9] + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(cost2U, 1, { at: S[9] + 4.8, dur: 0.7, ease: ease.enter });

  // — B10 · score, leftmost highest, read: exact —
  tl.tween(cam, HOME, { at: S[10], dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: S[10], dur: 0.9, ease: ease.move });
  tl.tween(finU, 1, { at: S[10] + 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(exactU, 1, { at: S[10] + 4.2, dur: 0.6, ease: ease.enter });
  tl.hold(S[10] + DURS[10] + HOLD, 2.0);

  return {
    tl, cam, q, pinU, beltU, beltOp, askU, chipU, codeLine, crownU, crownX, followU, cursorU, cursorX, gateU, verdictU,
    dimA, caseA, caseB, tieU, splitU, lane1U, lane1Op, bitsU, bitShift, tilesU, prodU, flyU, form1U, lane2U, arrowU,
    readU, form2U, hardU, eqU, cost1U, cost2U, dimU, finU, exactU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

function Crown({ cx, cy, opacity }: { cx: number; cy: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const d = `M ${cx - 15} ${cy + 8} L ${cx - 15} ${cy - 6} L ${cx - 7} ${cy + 1} L ${cx} ${cy - 10} L ${cx + 7} ${cy + 1} L ${cx + 15} ${cy - 6} L ${cx + 15} ${cy + 8} Z`;
  return <path d={d} fill={SAND} stroke="#f3d9a8" strokeWidth={1.2} strokeLinejoin="round" opacity={opacity} />;
}

/** The bit: amber disc when 1, ring when 0. */
function BitDisc({ cx, cy, b, r = 14, opacity = 1, scale = 1 }: { cx: number; cy: number; b: number; r?: number; opacity?: number; scale?: number }) {
  if (opacity <= 0.005 || scale <= 0.01) return null;
  return (
    <g opacity={opacity} transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <circle r={r} fill={b ? colors.WARM : colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text y={5} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={b ? '#1a1206' : colors.WARM}>
        {b}
      </text>
    </g>
  );
}

function ValueTile({ x, y, j, opacity, ring = 0 }: { x: number; y: number; j: number; opacity: number; ring?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      {ring > 0.01 && <rect x={x - 32} y={y - 23} width={64} height={46} rx={10} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={ring} />}
      <rect x={x - 26} y={y - 17} width={52} height={34} rx={7} fill={colors.PANEL} stroke={LIGHT[j]} strokeWidth={2} />
      <text x={x} y={y + 6} textAnchor="middle" fontSize={17} fontFamily={MONO} fontWeight={650} fill={colors.TEXT}>
        {VALUES[j]}
      </text>
    </g>
  );
}

function Slot({ x, y, label, value, opacity, glow = 0 }: { x: number; y: number; label: string; value: string; opacity: number; glow?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <text x={x} y={y - 30} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {label}
      </text>
      <rect x={x - 60} y={y - 22} width={120} height={44} rx={9} fill={colors.PANEL} stroke={glow > 0.01 ? colors.WARM : colors.MUTED} strokeWidth={2} />
      <text x={x} y={y + 8} textAnchor="middle" fontSize={22} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
        {value}
      </text>
    </g>
  );
}

function Tag({ x, y, text, fill = colors.TEXT, size = 14, anchor = 'start', opacity, weight = 500 }: {
  x: number; y: number; text: string; fill?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; opacity: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontFamily={MONO} fontWeight={weight} fill={fill} opacity={opacity}>
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- the page's computation at this query
  const q = v(scene.q);
  const scores = scoresAt(q);
  const winner = winnerIndexFor(scores);
  const bits = onehotAt(winner);
  const products = ITEMS.map((it, i) => bits[i] * it.value);
  const sum = onehotSum(bits);

  // ---- belt
  const split = v(scene.splitU);
  const B = beltAt(split);
  const beltU = v(scene.beltU);
  const beltOp = v(scene.beltOp);
  const dim = 1 - 0.9 * v(scene.dimU);
  const phaseA = 1 - split;
  const crownCol = lerp(v(scene.crownX), winner, v(scene.followU));
  const crownIdx = Math.round(crownCol);
  const cursorX = v(scene.cursorX);
  const challenger = Math.max(1, Math.min(2, Math.round(cursorX)));
  const leader = winnerIndexFor(scores.slice(0, challenger));
  const takes = scores[challenger] > scores[leader];
  const equal = scores[challenger] === scores[leader];
  const verdict = v(scene.verdictU);
  const dimA = v(scene.dimA);

  // ---- lanes
  const lane1 = v(scene.lane1U) * v(scene.lane1Op);
  const bitsU = v(scene.bitsU);
  const shift = v(scene.bitShift);
  const tilesU = v(scene.tilesU);
  const prodU = v(scene.prodU);
  const flyU = v(scene.flyU);
  const lane2 = v(scene.lane2U);
  const arrowU = v(scene.arrowU);
  const readU = v(scene.readU);
  const cost1 = v(scene.cost1U);
  const cost2 = v(scene.cost2U);
  const flyEach = ITEMS.map((_, j) => staggerU(flyU, j, 3, 0.35, 0.8));
  const arrived = ITEMS.reduce((acc, _, j) => acc + (flyEach[j] >= 0.98 ? products[j] : 0), 0);
  const sumShown = flyU >= 0.999 ? sum : arrived;

  // arc from the winnerIndex chip to the winner's tile in the lower lane
  const ax0 = CHIP.x + CHIP.w / 2 + 2;
  const ay0 = LL - 8;
  const ax1 = X(winner) + 2;
  const ay1 = LL - 20;
  const acx = (ax0 + ax1) / 2;
  const acy = LL - 82;
  const arcPt = (t: number) => [
    (1 - t) * (1 - t) * ax0 + 2 * (1 - t) * t * acx + t * t * ax1,
    (1 - t) * (1 - t) * ay0 + 2 * (1 - t) * t * acy + t * t * ay1,
  ];
  const [hx, hy] = arcPt(1);
  const [px, py] = arcPt(0.92);
  const headAng = Math.atan2(hy - py, hx - px);
  const readEase = ease.move(clamp01(readU));
  const flyX = lerp(X(winner) + 2, SLOT_X, readEase);
  const flyY = LL - Math.sin(Math.PI * readEase) * 34;

  const fin = v(scene.finU);
  const steps = ['score', 'leftmost highest', 'read the winner'];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dim}>
          {/* ================= the belt: three score bars, the query pin, the crown ================= */}
          <g opacity={beltOp}>
            <line x1={X(-0.45)} x2={X(2.45)} y1={B.base} y2={B.base} stroke={colors.MUTED} strokeOpacity={0.5 * beltU} strokeWidth={1.5} />
            {ITEMS.map((it, j) => {
              const u = staggerU(beltU, j, 3, 0.25, 0.7);
              if (u <= 0.005) return null;
              const sc = scores[j];
              const h = Math.abs(sc) * B.unit * u;
              const top = sc >= 0 ? B.base - h : B.base;
              const isLead = crownIdx === j && v(scene.crownU) > 0.5;
              const colOp = j === 0 ? 1 - 0.85 * dimA : 1;
              const labelY = sc >= 0 ? B.base - h - 9 : B.base + h + B.scoreSize + 3;
              return (
                <g key={it.name} opacity={u * colOp}>
                  <rect x={X(j) - B.barW / 2} y={top} width={B.barW} height={Math.max(2, h)} rx={4} fill={it.accent} stroke={isLead ? SAND : LIGHT[j]} strokeWidth={isLead ? 3 : 1.5} />
                  <text x={X(j)} y={labelY} textAnchor="middle" fontSize={B.scoreSize} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                    {fmt(sc)}
                  </text>
                  <text x={X(j)} y={B.nameY} textAnchor="middle" fontSize={lerp(19, 15, split)} fontWeight={700} fill={LIGHT[j]}>
                    {it.name}
                  </text>
                  {phaseA > 0.15 && (
                    <text x={X(j)} y={B.nameY + 21} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={phaseA}>
                      {`index ${j}`}
                    </text>
                  )}
                </g>
              );
            })}
            {/* the query pin on the item axis */}
            {v(scene.pinU) > 0.005 && (
              <g opacity={v(scene.pinU)}>
                <line x1={X(-0.25)} x2={X(2.25)} y1={B.axisY} y2={B.axisY} stroke={colors.MUTED} strokeOpacity={0.6} />
                {[0, 1, 2].map((j) => (
                  <line key={j} x1={X(j)} x2={X(j)} y1={B.axisY - 5} y2={B.axisY + 5} stroke={colors.MUTED} />
                ))}
                <path d={`M ${X(q)} ${B.axisY - 2} L ${X(q) - 8} ${B.axisY + 13} L ${X(q) + 8} ${B.axisY + 13} Z`} fill={SAND} />
                <text x={X(2.25) + 16} y={B.axisY + 5} fontSize={15} fontFamily={MONO} fontWeight={650} fill={SAND}>
                  {`query ${fmt(q)}`}
                </text>
              </g>
            )}
          </g>
          {/* the crown stays readable while the bars whisper */}
          <Crown cx={X(crownCol)} cy={B.crownY} opacity={v(scene.crownU) * (1 - 0.85 * dimA * (crownIdx === 0 ? 1 : 0))} />
          {phaseA > 0.15 && v(scene.crownU) > 0.15 && (
            <Tag x={X(crownCol) + 22} y={B.crownY + 5} text="leader" fill={SAND} size={13} opacity={v(scene.crownU) * phaseA * (crownIdx === 0 ? 1 - 0.85 * dimA : 1)} />
          )}

          {/* ---- B0: which one? argmax ---- */}
          {v(scene.askU) > 0.005 && (
            <g opacity={v(scene.askU)}>
              <text x={640} y={196} textAnchor="middle" fontSize={40} fontWeight={700} fill={SAND}>
                ?
              </text>
              <MathLabel tex={'\\arg\\max_j\\;(2\\,q\\,j - j^2)'} x={640} y={140} fontSize={28} />
            </g>
          )}

          {/* ---- the page's winnerIndexFor ---- */}
          {v(scene.chipU) > 0.005 && (
            <g opacity={v(scene.chipU)}>
              <rect x={CODE.x} y={CODE.y} width={CODE_W} height={CODE_LINES.length * 20 + 14} rx={6} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
              <rect x={CODE.x} y={CODE.y} width={4} height={CODE_LINES.length * 20 + 14} rx={2} fill={SAND} />
              {CODE_LINES.map((l, i) => (
                <g key={i}>
                  {Math.round(v(scene.codeLine)) === i && <rect x={CODE.x + 8} y={CODE.y + 8 + i * 20} width={CODE_W - 14} height={19} rx={3} fill={colors.WARM} opacity={0.22} />}
                  <text x={CODE.x + 16} y={CODE.y + 22 + i * 20} fontSize={14} fontFamily={MONO} fill={colors.TEXT} xmlSpace="preserve">
                    {l}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ---- the challenger frame ---- */}
          {v(scene.cursorU) > 0.005 && (
            <g opacity={v(scene.cursorU)}>
              <rect x={X(cursorX) - 56} y={B.base - 2 * B.unit - 26} width={112} height={B.nameY + 34 - (B.base - 2 * B.unit - 26)} rx={10} fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="7 5" />
              <text x={X(cursorX)} y={B.base - 2 * B.unit - 34} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.ACCENT}>
                challenger
              </text>
            </g>
          )}

          {/* ---- the comparison gate ---- */}
          {v(scene.gateU) > 0.005 && (
            <g opacity={v(scene.gateU)}>
              <rect x={GATE.x - GATE.w / 2} y={GATE.y} width={GATE.w} height={GATE.h} rx={10} fill={colors.PANEL} stroke={verdict > 0.5 ? (takes ? colors.POSITIVE : colors.MUTED) : colors.GRID} strokeWidth={2} />
              <text x={GATE.x} y={GATE.y + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                if (score &gt; winnerScore)
              </text>
              <text x={GATE.x} y={GATE.y + 52} textAnchor="middle" fontSize={24} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} xmlSpace="preserve">
                {`${fmt(scores[challenger])} > ${fmt(scores[leader])}`}
                {verdict > 0.05 && (
                  <tspan fill={takes ? colors.POSITIVE : colors.MUTED} opacity={verdict}>{`  ${takes ? 'true' : 'false'}`}</tspan>
                )}
              </text>
              {verdict > 0.15 && (
                <text x={GATE.x} y={GATE.y + 74} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={takes ? colors.POSITIVE : colors.MUTED} opacity={verdict}>
                  {takes ? 'strictly greater: takes the lead' : equal ? 'equal is not enough: leader stays' : 'lower: leader stays'}
                </text>
              )}
            </g>
          )}

          {/* ---- the two tie cases ---- */}
          {CASES.map((c, i) => {
            const op = v(i === 0 ? scene.caseA : scene.caseB);
            if (op <= 0.005) return null;
            const h = c.lines.length * 20 + 14;
            return (
              <g key={i} opacity={op}>
                <rect x={CASE_X} y={c.y} width={CASE_W} height={h} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                <rect x={CASE_X} y={c.y} width={4} height={h} rx={2} fill={SAND} />
                {c.lines.map((l, k) => (
                  <text key={k} x={CASE_X + 16} y={c.y + 22 + k * 20} fontSize={13} fontFamily={MONO} fontWeight={k === 2 ? 700 : 400} fill={k === 2 ? SAND : colors.TEXT}>
                    {l}
                  </text>
                ))}
              </g>
            );
          })}
          <Tag x={CASE_X + CASE_W / 2} y={CASES[0].y + 104} text="ties go left" anchor="middle" fill={SAND} size={20} weight={700} opacity={v(scene.tieU)} />

          {/* ================= lane 1 · the one-hot sum ================= */}
          {lane1 > 0.005 && (
            <g opacity={lane1}>
              <Tag x={LANE_X} y={LU - 36} text={tilesU > 0.5 ? 'one-hot sum' : 'one-hot list'} fill={colors.TEXT} size={15} weight={700} opacity={1} />
              {ITEMS.map((it, j) => {
                const pop = staggerU(bitsU, j, 3, 0.3, 0.5);
                const tile = staggerU(tilesU, j, 3, 0.2, 0.5);
                const prod = staggerU(prodU, j, 3, 0.2, 0.5);
                const fly = flyEach[j];
                const bx = X(j) - 62 * shift;
                return (
                  <g key={it.name}>
                    {cost1 > 0.01 && <rect x={X(j) - 82} y={LU - 25} width={190} height={50} rx={12} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={cost1} />}
                    <BitDisc cx={bx} cy={LU} b={bits[j]} scale={ease.pop(pop)} />
                    <Tag x={X(j) - 32} y={LU + 5} text="×" anchor="middle" fill={colors.MUTED} size={16} opacity={tile} />
                    <ValueTile x={X(j) + 2} y={LU} j={j} opacity={tile} />
                    <Tag x={X(j) + 40} y={LU + 5} text="=" anchor="middle" fill={colors.MUTED} size={16} opacity={prod} />
                    <Tag x={X(j) + 70} y={LU + 6} text={String(products[j])} anchor="middle" fill={bits[j] ? colors.WARM : colors.TEXT} size={17} weight={700} opacity={prod} />
                    {fly > 0.005 && fly < 0.98 && (
                      <Tag x={lerp(X(j) + 70, SLOT_X, ease.move(fly))} y={LU + 6 - Math.sin(Math.PI * fly) * 30} text={String(products[j])} anchor="middle" fill={bits[j] ? colors.WARM : colors.MUTED} size={16} weight={700} opacity={1 - 0.4 * fly} />
                    )}
                  </g>
                );
              })}
              <Slot x={SLOT_X} y={LU} label="sum" value={flyU > 0.005 ? String(sumShown) : ''} opacity={clamp01(tilesU * 2)} glow={cost1} />
              <Tag x={LANE_X} y={LU + 46} text={`${bits.join(', ')} x [${VALUES.join(', ')}] = ${sum}`} size={14} opacity={v(scene.form1U)} />
              <Tag x={420} y={LU - 36} text="touches every item: 3 multiplies, then a sum" fill={colors.WARM} size={14} opacity={cost1} />
            </g>
          )}

          {/* ================= lane 2 · the direct read (hardAttend) ================= */}
          {lane2 > 0.005 && (
            <g>
              <g opacity={staggerU(lane2, 0, 4, 0.2, 0.5)}>
                <text x={LANE_X} y={LL - 36} fontSize={15} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  direct read
                  {v(scene.hardU) > 0.005 && (
                    <tspan fill={SAND} opacity={v(scene.hardU)}>
                      {' · hardAttend'}
                    </tspan>
                  )}
                </text>
                <rect x={CHIP.x - CHIP.w / 2} y={LL - 17} width={CHIP.w} height={34} rx={7} fill={colors.PANEL} stroke={SAND} strokeWidth={2} />
                <text x={CHIP.x} y={LL + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  {`winnerIndex = ${winner}`}
                </text>
              </g>
              {ITEMS.map((it, j) => {
                const u = staggerU(lane2, j + 1, 4, 0.2, 0.5);
                return (
                  <g key={it.name} opacity={u}>
                    <ValueTile x={X(j) + 2} y={LL} j={j} opacity={1} ring={j === winner ? cost2 : 0} />
                    <Tag x={X(j) + 2} y={LL + 34} text={String(j)} anchor="middle" fill={colors.MUTED} size={12} opacity={1} />
                  </g>
                );
              })}
              {arrowU > 0.005 && (
                <g>
                  <path d={`M ${ax0} ${ay0} Q ${acx} ${acy} ${ax1} ${ay1}`} fill="none" stroke={SAND} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(arrowU)} />
                  {arrowU > 0.95 && (
                    <path d={`M ${hx} ${hy} L ${hx - 11 * Math.cos(headAng - 0.45)} ${hy - 11 * Math.sin(headAng - 0.45)} L ${hx - 11 * Math.cos(headAng + 0.45)} ${hy - 11 * Math.sin(headAng + 0.45)} Z`} fill={SAND} />
                  )}
                  <Tag x={arcPt(0.5)[0]} y={arcPt(0.5)[1] - 8} text={`values[${winner}]`} anchor="middle" fill={SAND} size={14} weight={700} opacity={clamp01(arrowU * 2 - 0.6) * (1 - cost2)} />
                </g>
              )}
              {readU > 0.005 && readU < 0.98 && <Tag x={flyX} y={flyY + 6} text={String(VALUES[winner])} anchor="middle" fill={colors.WARM} size={17} weight={700} opacity={1} />}
              <Slot x={SLOT_X} y={LL} label="read" value={readU >= 0.98 ? String(VALUES[winner]) : ''} opacity={staggerU(lane2, 3, 4, 0.2, 0.5)} glow={cost2} />
              <Tag x={LANE_X} y={LL + 46} text={`values[${winner}] = ${VALUES[winner]} (${ITEMS[winner].name})`} size={14} opacity={v(scene.form2U)} />
              <Tag x={420} y={LL + 58} text="toolkit circuit.indexRead: 1 entry, 1 operation, any table size" fill={colors.WARM} size={14} opacity={cost2} />
              <Tag x={420} y={LL + 78} text="(for an index range strictly inside ±2²⁴)" fill={colors.MUTED} size={13} opacity={cost2} />
            </g>
          )}

          {/* ---- the two slots agree ---- */}
          {v(scene.eqU) > 0.005 && (
            <g opacity={v(scene.eqU)}>
              <text x={SLOT_X} y={(LU + LL) / 2 + 12} textAnchor="middle" fontSize={34} fontWeight={700} fill={colors.POSITIVE}>
                =
              </text>
              <Tag x={SLOT_X - 34} y={(LU + LL) / 2 + 6} text="same winner in, same value out" anchor="end" fill={colors.POSITIVE} size={14} opacity={1} />
            </g>
          )}
        </g>

        {/* ================= B10 · the whole of hard attention ================= */}
        {fin > 0.005 && (
          <g opacity={clamp01(fin * 3)}>
            <rect x={230} y={200} width={820} height={250} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={238} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
              hard attention
            </text>
            {steps.map((label, i) => {
              const u = staggerU(fin, i, 3, 0.35, 0.5);
              const cx = 370 + i * 270;
              const w = label.length * CH14 + 36;
              return (
                <g key={label} opacity={u}>
                  <rect x={cx - w / 2} y={270} width={w} height={44} rx={9} fill={colors.BG} stroke={i === 1 ? SAND : colors.MUTED} strokeWidth={2} />
                  <text x={cx} y={298} textAnchor="middle" fontSize={15} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                    {label}
                  </text>
                  {i > 0 && <text x={cx - 135} y={299} textAnchor="middle" fontSize={20} fill={colors.MUTED}>→</text>}
                </g>
              );
            })}
            <MathLabel tex={'\\mathrm{values}\\big[\\,\\arg\\max_j s_j\\,\\big]'} x={640} y={362} fontSize={26} opacity={staggerU(fin, 2, 3, 0.35, 0.5)} />
            <Tag x={640} y={428} text="exact · no blending" anchor="middle" fill={SAND} size={20} weight={700} opacity={v(scene.exactU)} />
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
