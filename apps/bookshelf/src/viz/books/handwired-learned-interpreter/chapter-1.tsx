// A Program in 123 Cells
//
// Learned Program — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/learned-interpreter/README.md:3-5 (the question; four runtime inputs, one program), 13 (3*4*4 = 48,
//     3*5*5 = 75; one distribution per instruction), 15 (four runtime cells, 123 shared program cells; no example
//     ID or per-example parameter; masked sum; leftmost argmax), 17 (operation counts are measured), 19 (FP32),
//     23-36 (the two targets)
//   lab/learned-interpreter/program.ts:12 (inputNames), 15-16 (operationNames), 54-64 (createCandidates: operation,
//     then left, then right), 66-91 (createProgramLayout: inputs at 0-3, then 48, then 75 source cells),
//     93-103 (emitCandidate), 105-115 (emitInstruction: selector × candidate, summed), 117-152 (buildProgram;
//     assumeOneHot in hard mode), 179-199 (groupWinner: strict >, so the lowest index wins a tie; hardenProgram)
//   lab/learned-interpreter/oracle.ts:16-27 (coordinateOracle, twoAddOracle: Math.fround after every step)
//   live count, `buildProgram(2, 'soft' | 'hard')` at the pin (review.md): 250 operations = 77 affine + 173 reglu;
//     soft 8 layers, hard 6 layers. (study-results.json still records 240 / 67 — stale; not used.)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The example input rows are ILLUSTRATIVE values from the lab's training grid
// (labelled "example" on screen). The trained dial values (0.9 / 0.1, 0.99 / 0.01) are SCHEMATIC (labelled).
// Every card result, the soft sums, both target programs and the checker rows are computed below with the
// lab's own candidate order and Math.fround steps; the module throws if the hand-picked programs ever
// disagree with the oracle.
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
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const DIM = 0.12; // competing layers: a whisper (below the sheet's 0.15 visibility line)

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

/** numbers as the labels show them: true minus sign, at most two decimals */
const fmt = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(2).replace(/0$/, '');
  return r < 0 ? `−${s}` : s;
};

// ---------------------------------------------------------------------------
// The lab's vocabulary and layout (program.ts:12-91), exact
// ---------------------------------------------------------------------------

const INPUT_NAMES = ['pointerX', 'panelLeft', 'scale', 'distractor'] as const;
const OP_NAMES = ['add', 'subtract', 'multiply'] as const;
type Op = (typeof OP_NAMES)[number];
const OP_GLYPH: Record<Op, string> = { add: '+', subtract: '−', multiply: '×' };
type Cand = { op: Op; l: number; r: number };

/** createCandidates: operation-major, then left register, then right register */
const candidates = (n: number): Cand[] =>
  OP_NAMES.flatMap((op) => Array.from({ length: n * n }, (_, k) => ({ op, l: Math.floor(k / n), r: k % n })));
const CANDS0 = candidates(INPUT_NAMES.length); // 48
const CANDS1 = candidates(INPUT_NAMES.length + 1); // 75: instruction0 joins the registers
const N0 = CANDS0.length;
const N1 = CANDS1.length;
const PROGRAM_CELLS = N0 + N1; // 123
const SOURCE_CELLS = INPUT_NAMES.length + PROGRAM_CELLS; // 127
if (N0 !== 48 || N1 !== 75 || PROGRAM_CELLS !== 123 || SOURCE_CELLS !== 127) throw new Error('layout mismatch');

const f32 = Math.fround;
const apply = (op: Op, a: number, b: number): number =>
  op === 'add' ? f32(f32(a) + f32(b)) : op === 'subtract' ? f32(f32(a) - f32(b)) : f32(f32(a) * f32(b));
const find = (cands: Cand[], op: Op, l: number, r: number): number =>
  cands.findIndex((c) => c.op === op && c.l === l && c.r === r);

// oracle.ts:16-27, line for line
type Inputs = { pointerX: number; panelLeft: number; scale: number; distractor: number };
const coordinateOracle = (x: Inputs) => f32(f32(f32(x.pointerX) - f32(x.panelLeft)) * f32(x.scale));
const twoAddOracle = (x: Inputs) => f32(f32(f32(x.pointerX) + f32(x.panelLeft)) + f32(x.distractor));

// illustrative example rows, drawn from the training grid (coordinates −16..16 step 2, scales 2, 4, 6)
const EXAMPLES: Inputs[] = [
  { pointerX: 10, panelLeft: 4, scale: 2, distractor: -6 },
  { pointerX: -8, panelLeft: 2, scale: 4, distractor: 14 },
  { pointerX: 16, panelLeft: -12, scale: 6, distractor: 0 },
];
const ANSWERS = EXAMPLES.map(coordinateOracle); // 12, −40, 168
const REG = INPUT_NAMES.map((k) => EXAMPLES[0][k]); // the paused row: 10, 4, 2, −6
const R0 = CANDS0.map((c) => apply(c.op, REG[c.l], REG[c.r])); // every instruction-0 card's own result
const r1 = (i: number, i0: number): number => {
  const regs = [...REG, i0];
  const c = CANDS1[i];
  return apply(c.op, regs[c.l], regs[c.r]);
};

// the two cards the soft program mixes, and the two target programs
const ADD_PL = find(CANDS0, 'add', 0, 1); // 1
const SUB_PL = find(CANDS0, 'subtract', 0, 1); // 17
const MUL_I0_SCALE = find(CANDS1, 'multiply', 4, 2); // 72
const ADD_I0_DIST = find(CANDS1, 'add', 4, 3); // 23
const COORD_I0 = R0[SUB_PL];
const COORD_OUT = r1(MUL_I0_SCALE, COORD_I0);
const TWOADD_I0 = R0[ADD_PL];
const TWOADD_OUT = r1(ADD_I0_DIST, TWOADD_I0);
if (COORD_OUT !== coordinateOracle(EXAMPLES[0]) || TWOADD_OUT !== twoAddOracle(EXAMPLES[0])) {
  throw new Error('target program does not match the oracle');
}
// soft, 0.5 / 0.5 between add and subtract: the visibly blended sum
const SOFT_SUM = f32(0.5 * R0[ADD_PL] + 0.5 * R0[SUB_PL]); // 10
// schematic near-trained dials 0.99 / 0.01: close, not equal
const NEAR_I0 = f32(f32(0.99 * R0[SUB_PL]) + f32(0.01 * R0[ADD_PL]));
const NEAR_OUT = f32(NEAR_I0 * f32(REG[2])); // 12.16…
if (NEAR_OUT === COORD_OUT) throw new Error('near program should miss');

// measured on the live build at the pin (review.md; README.md:17 says the report measures, not asserts)
const CIRCUIT = { ops: 250, affine: 77, reglu: 173, softLayers: 8, hardLayers: 6 };
if (CIRCUIT.affine + CIRCUIT.reglu !== CIRCUIT.ops) throw new Error('circuit split mismatch');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const REG_COLORS = [colors.TEAL, colors.SECONDARY, colors.POSITIVE, colors.MUTED, colors.NEGATIVE];
const STRIP = { x: 52, w: 180, y0: 120, pitch: 58, h: 46, i0y: 362 };
const regY = (i: number) => (i < 4 ? STRIP.y0 + i * STRIP.pitch : STRIP.i0y);

// ticker (B1–B2)
const TICK = { label: 292, x0: 300, chipW: 96, pitch: 102, rows: [160, 220, 280], chipH: 44 };
const PROG_BOX = { x: 740, y: 134, w: 160, h: 172 };
const ANS_X = 975;

// the two card fans
const C = 28;
const P = 32;
const FX = 300;
const GROUP_PITCH = 5 * P - 4 + 30; // 186
const FAN = [
  { n: 4, title: 100, ops: 120, top: 128 },
  { n: 5, title: 290, ops: 310, top: 318 },
];
const cardXY = (fan: 0 | 1, i: number) => {
  const n = FAN[fan].n;
  const g = Math.floor(i / (n * n));
  const k = i % (n * n);
  return { x: FX + g * GROUP_PITCH + (k % n) * P, y: FAN[fan].top + Math.floor(k / n) * P };
};

// B3 big card, flies into its slot in the instruction-0 fan
const BIG = { cx: 600, cy: 330, w: 300, h: 150 };
const SLOT = cardXY(0, SUB_PL);

// right column
const RX = 890;
const RW = 340;
const BUS = { x: 866, y: 190 };

// source table strip (B7)
const SRC = { x: 60, pitch: 9.1, w: 7.4, y: 520, h: 20 };
const srcX = (j: number) => SRC.x + j * SRC.pitch;

// finale cards
const FIN = [
  { cx: 470, cy: 300, from: cardXY(0, SUB_PL), n: N0, hot: SUB_PL, title: 'instruction 0' },
  { cx: 810, cy: 300, from: cardXY(1, MUL_I0_SCALE), n: N1, hot: MUL_I0_SCALE, title: 'instruction 1' },
];
const FIN_W = 280;
const FIN_H = 150;

const HOME: CameraState = CAMERA_HOME;
const CAM_TICK: CameraState = { x: 650, y: 230, k: 1.08 };
const CAM_REG: CameraState = { x: 520, y: 270, k: 1.2 };
const CAM_CARD: CameraState = { x: 560, y: 300, k: 1.25 };
const CAM_SOFT: CameraState = { x: 770, y: 185, k: 1.3 };
const CAM_CHECK: CameraState = { x: 900, y: 330, k: 1.3 };
const CAM_END: CameraState = { x: 640, y: 320, k: 1.1 };

// ~150 words a minute, plus a breath
const speak = (text: string): number => +(text.split(/\s+/).length * 0.4 + 0.6).toFixed(1);
const HOLD = 0.6;

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TICK, cameraInterp);
  // B1–B2 ticker + registers
  const tickU = tl.channel('tickRows', 0);
  const progBoxU = tl.channel('progBox', 0);
  const pauseU = tl.channel('tickPause', 0);
  const tickerOp = tl.channel('tickerOp', 1);
  const regU = tl.channel('regIn', 0);
  const flyU = tl.channel('valuesFly', 0);
  const regOp = tl.channel('regOp', 1);
  const i0RegU = tl.channel('i0RegIn', 0);
  // B3–B4 one card, then the fans
  const opChipsU = tl.channel('opChips', 0);
  const bigU = tl.channel('bigCardLines', 0);
  const bigFly = tl.channel('bigCardFly', 0);
  const deal0 = tl.channel('deal0', 0);
  const deal1 = tl.channel('deal1', 0);
  const count0U = tl.channel('count48', 0);
  const count1U = tl.channel('count75', 0);
  const fan0Op = tl.channel('fan0Op', 1);
  const fan1Op = tl.channel('fan1Op', 1);
  // B5–B6 soft program, hardening
  const resU = tl.channel('cardResults', 0);
  const softU = tl.channel('softDials', 0);
  const trainU = tl.channel('trainDials', 0);
  const hardU = tl.channel('harden', 0);
  const busU = tl.channel('sumBus', 0);
  const tieU = tl.channel('tieChip', 0);
  // B7 counting
  const countU = tl.channel('cellCount', 0);
  const glowOp = tl.channel('countGlow', 1);
  const countPanelU = tl.channel('countPanel', 0);
  const noCheatU = tl.channel('noCheat', 0);
  const srcU = tl.channel('sourceStrip', 0);
  const srcOp = tl.channel('sourceOp', 1);
  // B8–B9 targets and checker
  const dimOthers = tl.channel('dimOthers', 0);
  const progU = tl.channel('coordToTwoAdd', 0);
  const tgt1U = tl.channel('targetCoord', 0);
  const tgt2U = tl.channel('targetTwoAdd', 0);
  const tgt2Op = tl.channel('targetTwoAddOp', 1);
  const tgtOp = tl.channel('targetsOp', 1);
  const checkU = tl.channel('checkerSteps', 0);
  // B10–B11
  const badgeU = tl.channel('circuitBadge', 0);
  const finU = tl.channel('finale', 0);

  let t = 0.4;
  const beat = (text: string) => {
    const at = t;
    const dur = speak(text);
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, HOLD);
    return at;
  };

  // — B1 · the example-row ticker: inputs change, one program column stays fixed —
  let b = beat("Here's the question: can training find one reusable program, instead of a separate answer for every input? This lab fixes a tiny interpreter and lets learning choose what it runs.");
  tl.tween(progBoxU, 1, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(tickU, 3, { at: b + 1.4, dur: 4.2, ease: ease.linear });

  // — B2 · four register cells fill; the ticker pauses on one row —
  b = beat("Four inputs change on every example: the pointer position, the panel's left edge, a scale, and a distractor. The same program has to work for all of them.");
  tl.tween(cam, CAM_REG, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(regU, 1, { at: b + 0.6, dur: 1.6, ease: ease.enter });
  tl.tween(pauseU, 1, { at: b + 3.4, dur: 0.6, ease: ease.move });
  tl.tween(flyU, 1, { at: b + 4.2, dur: 1.3, ease: ease.move });

  // — B3 · a program is two instructions; one candidate builds —
  b = beat('A program is two instructions. Each picks one operation, add, subtract, or multiply, and an ordered pair of values to apply it to.');
  tl.tween(tickerOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_CARD, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(opChipsU, 1, { at: b + 2.0, dur: 0.8, ease: ease.enter });
  tl.tween(bigU, 4, { at: b + 3.0, dur: 4.4, ease: ease.linear });

  // — B4 · the fans: 48 candidates, then 75 —
  b = beat("Instruction zero reads the four inputs, so it has three operations times four times four: forty-eight candidates. Instruction one can also read instruction zero's result, which makes seventy-five.");
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(opChipsU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(bigFly, 1, { at: b + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(deal0, 1, { at: b + 1.5, dur: 2.0, ease: ease.linear });
  tl.tween(count0U, 1, { at: b + 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(i0RegU, 1, { at: b + 5.6, dur: 0.8, ease: ease.enter });
  tl.tween(deal1, 1, { at: b + 6.4, dur: 2.6, ease: ease.linear });
  tl.tween(count1U, 1, { at: b + 9.2, dur: 0.6, ease: ease.enter });

  // — B5 · every card computes, multiplies by its dial, the bus sums: the soft program —
  b = beat("Every candidate gets its own dial. The circuit computes all the candidates' results, multiplies each by its dial, and adds them up. That weighted sum is the soft program.");
  tl.tween(cam, CAM_SOFT, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(fan1Op, DIM, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(regOp, DIM, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(resU, 1, { at: b + 3.0, dur: 0.8, ease: ease.enter });
  tl.tween(softU, 1, { at: b + 5.0, dur: 1.0, ease: ease.move });
  tl.tween(busU, 1, { at: b + 6.2, dur: 1.2, ease: ease.draw });

  // — B6 · hardening: one dial wins —
  b = beat('Training will push one dial per instruction toward one, and the rest toward zero. Then the leftmost largest dial wins, and the soft mixture becomes one exact instruction.');
  tl.tween(trainU, 1, { at: b + 0.6, dur: 2.6, ease: ease.move });
  tl.tween(tieU, 1, { at: b + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(hardU, 1, { at: b + 7.8, dur: 0.5, ease: ease.pop });

  // — B7 · count the cells: 48 + 75 = 123, beside 4 —
  b = beat('Count the cells. Forty-eight plus seventy-five is one hundred twenty-three program cells, beside four input cells. There is no example number and no per-example setting to cheat with.');
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(busU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(tieU, 0, { at: b, dur: 0.6, ease: ease.move });
  for (const ch of [fan1Op, regOp]) tl.tween(ch, 1, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(srcU, 1, { at: b + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(countPanelU, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(countU, PROGRAM_CELLS, { at: b + 1.4, dur: 4.6, ease: ease.linear });
  tl.tween(countU, SOURCE_CELLS, { at: b + 6.2, dur: 0.8, ease: ease.linear });
  tl.tween(noCheatU, 1, { at: b + 8.0, dur: 0.8, ease: ease.draw });

  // — B8 · two tasks, each two steps on the strip —
  b = beat('Two tasks test it. The coordinate task subtracts the left edge from the pointer, then multiplies by the scale. The two-add task adds the pointer to the left edge, then adds the distractor.');
  tl.tween(countPanelU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(glowOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(srcOp, DIM, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(dimOthers, 1, { at: b + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(tgt1U, 1, { at: b + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(progU, 1, { at: b + 7.0, dur: 1.0, ease: ease.move });
  tl.tween(tgt2U, 1, { at: b + 7.0, dur: 0.7, ease: ease.enter });

  // — B9 · the checker: Math.fround after every step; match, not close —
  b = beat('A separate checker computes each answer, rounding to a thirty-two-bit float after every step. A learned program has to match that checker, not just land close.');
  tl.tween(cam, CAM_CHECK, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(progU, 0, { at: b, dur: 0.8, ease: ease.move });
  tl.tween(tgt2Op, DIM, { at: b, dur: 0.8, ease: ease.move });
  for (const ch of [fan0Op, fan1Op, regOp]) tl.tween(ch, DIM, { at: b, dur: 0.8, ease: ease.move });
  [1, 2, 3, 4].forEach((k, i) => tl.tween(checkU, k, { at: b + [1.6, 3.2, 6.4, 8.2][i], dur: 0.6, ease: ease.enter }));

  // — B10 · pull back: the measured circuit —
  b = beat('Run today, the circuit has two hundred fifty operations: seventy-seven weighted sums and one hundred seventy-three relu-gated products. The soft and hard versions have the same count.');
  tl.tween(cam, HOME, { at: b, dur: 1.5, ease: ease.move });
  tl.tween(tgtOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(badgeU, 1, { at: b + 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(badgeU, 2, { at: b + 3.0, dur: 1.4, ease: ease.draw });
  tl.tween(badgeU, 3, { at: b + 7.6, dur: 1.0, ease: ease.enter });

  // — B11 · recap: two one-hot choices —
  b = beat('So a learned program is just a pair of one-hot choices among those cards. The next chapter asks how training finds them, and what went wrong the first time.');
  tl.tween(cam, CAM_END, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(badgeU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(srcOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(finU, 1, { at: b + 0.6, dur: 1.4, ease: ease.move });
  tl.hold(t, 2.0);

  return {
    tl, cam, tickU, progBoxU, pauseU, tickerOp, regU, flyU, regOp, i0RegU, opChipsU, bigU, bigFly, deal0, deal1,
    count0U, count1U, fan0Op, fan1Op, resU, softU, trainU, hardU, busU, tieU, countU, glowOp, countPanelU,
    noCheatU, srcU, srcOp, dimOthers, progU, tgt1U, tgt2U, tgt2Op, tgtOp, checkU, badgeU, finU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Panel({ x, y, w, h, stroke = colors.GRID, opacity = 1, children }: {
  x: number; y: number; w: number; h: number; stroke?: string; opacity?: number; children?: ReactNode;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={colors.PANEL} fillOpacity={0.94} stroke={stroke} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function Txt({ x, y, children, size = 13, fill = colors.TEXT, anchor = 'start', weight, mono = true, opacity }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  weight?: number; mono?: boolean; opacity?: number;
}) {
  if (opacity !== undefined && opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fontFamily={mono ? MONO : UI} fill={fill} textAnchor={anchor} fontWeight={weight} opacity={opacity}>
      {children}
    </text>
  );
}

/** One register cell: colour stripe, exact name, value. */
function Register({ i, value, opacity, dx = 0, glow = 0 }: { i: number; value: string; opacity: number; dx?: number; glow?: number }) {
  if (opacity <= 0.005) return null;
  const y = regY(i);
  const name = i < 4 ? INPUT_NAMES[i] : 'instruction0';
  return (
    <g opacity={opacity} transform={`translate(${dx}, 0)`}>
      <rect x={STRIP.x} y={y} width={STRIP.w} height={STRIP.h} rx={6} fill={colors.PANEL} stroke={glow > 0.01 ? colors.WARM : colors.GRID} strokeOpacity={glow > 0.01 ? glow : 1} strokeWidth={1.5} strokeDasharray={i === 4 ? '5 4' : undefined} />
      <rect x={STRIP.x} y={y} width={4} height={STRIP.h} rx={2} fill={REG_COLORS[i]} />
      <Txt x={STRIP.x + 14} y={y + 19} size={14} fill={REG_COLORS[i] === colors.MUTED ? colors.TEXT : REG_COLORS[i]}>{name}</Txt>
      <Txt x={STRIP.x + STRIP.w - 12} y={y + 39} size={18} anchor="end" weight={650}>{value}</Txt>
    </g>
  );
}

/** One candidate card: op glyph or its own result, a dial bar along the bottom. */
function Card({ x, y, glyph, num, numU, dial, opacity, glow, drop = 0 }: {
  x: number; y: number; glyph: string; num: string | null; numU: number; dial: number; opacity: number; glow: number; drop?: number;
}) {
  if (opacity <= 0.005) return null;
  const d = clamp01(dial);
  const stroke = d > 0.02 ? colors.WARM : glow > 0.01 ? colors.WARM : 'rgba(141, 162, 190, 0.45)';
  const sw = d > 0.02 ? 1 + 1.5 * d : glow > 0.01 ? 1.5 : 1;
  return (
    <g opacity={opacity} transform={drop ? `translate(0, ${drop})` : undefined}>
      <rect x={x} y={y} width={C} height={C} rx={4} fill={colors.PANEL} stroke={stroke} strokeOpacity={d > 0.02 ? 0.4 + 0.6 * d : glow > 0.01 ? glow : 1} strokeWidth={sw} />
      {numU < 0.999 && (
        <text x={x + C / 2} y={y + 17} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={1 - numU}>
          {glyph}
        </text>
      )}
      {num !== null && numU > 0.001 && (
        <text x={x + C / 2} y={y + 16} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={d > 0.5 ? colors.WARM : colors.TEXT} opacity={numU} fontWeight={d > 0.5 ? 700 : 400}>
          {num}
        </text>
      )}
      <rect x={x + 3} y={y + C - 6} width={C - 6} height={3} rx={1.5} fill={colors.MUTED} opacity={0.18} />
      {d > 0.005 && <rect x={x + 3} y={y + C - 6} width={(C - 6) * d} height={3} rx={1.5} fill={colors.WARM} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- dials (one closed form across B5–B11)
  const soft = v(scene.softU);
  const train = v(scene.trainU);
  const hard = v(scene.hardU);
  const prog = v(scene.progU);
  let dAdd = lerp(0.5, 0.1, train) * soft;
  let dSub = lerp(0.5, 0.9, train) * soft;
  dAdd = lerp(lerp(dAdd, 0, hard), 1, prog);
  dSub = lerp(lerp(dSub, 1, hard), 0, prog);
  const dial0 = (i: number) => (i === ADD_PL ? dAdd : i === SUB_PL ? dSub : 0);
  const dial1 = (i: number) => (i === MUL_I0_SCALE ? hard * (1 - prog) : i === ADD_I0_DIST ? prog : 0);
  const i0 = dAdd * R0[ADD_PL] + dSub * R0[SUB_PL]; // Σ dial × result (only two are nonzero)

  // ---- layers
  const tickerOp = v(scene.tickerOp);
  const tickU = v(scene.tickU);
  const pause = v(scene.pauseU);
  const fly = v(scene.flyU);
  const regIn = v(scene.regU);
  const regOp = v(scene.regOp);
  const i0In = v(scene.i0RegU);
  const deal0 = v(scene.deal0);
  const deal1 = v(scene.deal1);
  const fan0Op = v(scene.fan0Op);
  const fan1Op = v(scene.fan1Op);
  const resU = v(scene.resU);
  const busU = v(scene.busU);
  const count = v(scene.countU);
  const glowOp = v(scene.glowOp);
  const dimOthers = v(scene.dimOthers);
  const bigFly = v(scene.bigFly);
  const bigU = v(scene.bigU);
  const tgtOp = v(scene.tgtOp);
  const checkU = v(scene.checkU);
  const badgeU = v(scene.badgeU);
  const finU = v(scene.finU);
  const srcU = v(scene.srcU) * v(scene.srcOp);
  const cardOpOthers = lerp(1, DIM, dimOthers);

  // instruction0 register value: unknown until the soft sum runs
  const i0Known = soft > 0.01;
  const i0Label = i0Known ? fmt(i0) : '·';

  // B11 floats: the fans whisper
  const finFade = lerp(1, DIM, clamp01(finU * 3));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B1–B2 · the example-row ticker ================= */}
        {tickerOp > 0.005 && (
          <g opacity={tickerOp}>
            <Txt x={TICK.x0} y={120} fill={colors.MUTED} opacity={clamp01(tickU)}>example inputs (illustrative)</Txt>
            {EXAMPLES.map((ex, r) => {
              const u = staggerU(tickU / 3, r, 3, 0.35, 0.45);
              if (u <= 0.005) return null;
              const rowOp = u * (r === 0 ? 1 : lerp(1, DIM, pause));
              const y = TICK.rows[r];
              const ansU = clamp01((tickU - r - 0.75) * 3);
              return (
                <g key={r} opacity={rowOp} transform={`translate(${lerp(-24, 0, u)}, 0)`}>
                  <Txt x={TICK.label} y={y + 5} anchor="end" fill={colors.MUTED} opacity={1 - pause}>{`example ${r + 1}`}</Txt>
                  {INPUT_NAMES.map((k, i) => {
                    const x = TICK.x0 + i * TICK.pitch;
                    return (
                      <g key={k}>
                        <rect x={x} y={y - TICK.chipH / 2} width={TICK.chipW} height={TICK.chipH} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                        <rect x={x} y={y - TICK.chipH / 2} width={TICK.chipW} height={3} rx={1.5} fill={REG_COLORS[i]} />
                        <Txt x={x + 10} y={y - 3} size={12} fill={colors.MUTED}>{k}</Txt>
                        <Txt x={x + TICK.chipW - 10} y={y + 16} size={16} anchor="end" weight={650}>{fmt(ex[k])}</Txt>
                      </g>
                    );
                  })}
                  <line x1={TICK.x0 + 4 * TICK.pitch - 4} y1={y} x2={PROG_BOX.x} y2={y} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.6} />
                  <line x1={PROG_BOX.x + PROG_BOX.w} y1={y} x2={ANS_X - 26} y2={y} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.6 * ansU} />
                  <Txt x={ANS_X} y={y + 7} size={20} weight={700} fill={colors.WARM} opacity={ansU}>{fmt(ANSWERS[r])}</Txt>
                </g>
              );
            })}
            <Panel x={PROG_BOX.x} y={PROG_BOX.y} w={PROG_BOX.w} h={PROG_BOX.h} stroke={colors.WARM} opacity={v(scene.progBoxU)}>
              <Txt x={PROG_BOX.x + PROG_BOX.w / 2} y={PROG_BOX.y + 26} size={15} anchor="middle" fill={colors.WARM} weight={650}>one program</Txt>
              {[0, 1].map((k) => (
                <g key={k}>
                  <rect x={PROG_BOX.x + 16} y={PROG_BOX.y + 48 + k * 56} width={PROG_BOX.w - 32} height={42} rx={5} fill="none" stroke={colors.MUTED} strokeDasharray="5 4" />
                  <Txt x={PROG_BOX.x + PROG_BOX.w / 2} y={PROG_BOX.y + 74 + k * 56} anchor="middle" fill={colors.MUTED}>{`instruction ${k}  ?`}</Txt>
                </g>
              ))}
            </Panel>
            <Txt x={ANS_X} y={120} fill={colors.MUTED} opacity={clamp01(tickU - 0.75)}>answer</Txt>
          </g>
        )}

        {/* ================= the source table strip (B7 on) ================= */}
        {srcU > 0.005 && (
          <g opacity={srcU}>
            <Txt x={SRC.x} y={SRC.y - 9} fill={colors.MUTED}>source table · createProgramLayout</Txt>
            {Array.from({ length: SOURCE_CELLS }, (_, j) => {
              const runtime = j < 4;
              const lit = runtime ? count > PROGRAM_CELLS + j : count > j - 4;
              return (
                <rect
                  key={j}
                  x={srcX(j)}
                  y={SRC.y}
                  width={SRC.w}
                  height={SRC.h}
                  rx={1.5}
                  fill={runtime ? REG_COLORS[j] : colors.WARM}
                  opacity={lit ? (runtime ? 0.95 : 0.8) : 0.14}
                />
              );
            })}
            {[
              { a: 0, b: 3, label: '4 runtime cells', anchor: 'start' as const },
              { a: 4, b: 4 + N0 - 1, label: `instruction 0 · ${N0}`, anchor: 'middle' as const },
              { a: 4 + N0, b: SOURCE_CELLS - 1, label: `instruction 1 · ${N1}`, anchor: 'middle' as const },
            ].map(({ a, b: e, label, anchor }) => (
              <g key={label}>
                <path d={`M ${srcX(a)} ${SRC.y + 26} v 4 H ${srcX(e) + SRC.w} v -4`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
                <Txt x={anchor === 'start' ? srcX(a) : (srcX(a) + srcX(e) + SRC.w) / 2} y={SRC.y + 48} anchor={anchor} fill={colors.MUTED}>{label}</Txt>
              </g>
            ))}
          </g>
        )}

        {/* ================= the register strip ================= */}
        {regIn > 0.005 && regOp > 0.005 && (
          <g opacity={regOp * (finU > 0 ? finFade : 1)}>
            <Txt x={STRIP.x} y={STRIP.y0 - 12} fill={colors.MUTED} opacity={regIn}>inputNames</Txt>
            {INPUT_NAMES.map((k, i) => {
              const u = staggerU(regIn, i, 4, 0.2, 0.5);
              // the paused row's values fly from its chips into the cells
              const fx = lerp(TICK.x0 + i * TICK.pitch + TICK.chipW - 10, STRIP.x + STRIP.w - 12, fly);
              const fy = lerp(TICK.rows[0] + 16, regY(i) + 39, fly);
              const runtimeGlow = glowOp * clamp01(count - PROGRAM_CELLS - i);
              return (
                <g key={k}>
                  <Register i={i} value={fly >= 0.999 ? fmt(REG[i]) : ''} opacity={u} glow={runtimeGlow} />
                  {fly > 0.001 && fly < 0.999 && (
                    <Txt x={fx} y={fy} size={18} anchor="end" weight={650} fill={colors.WARM}>{fmt(REG[i])}</Txt>
                  )}
                </g>
              );
            })}
            <Register i={4} value={i0Label} opacity={i0In} dx={lerp(-40, 0, i0In)} />
          </g>
        )}

        {/* ================= B3 · op chips + one candidate card ================= */}
        {v(scene.opChipsU) > 0.005 && (
          <g opacity={v(scene.opChipsU)}>
            {OP_NAMES.map((op, i) => {
              const on = op === 'subtract' && bigU > 0.5;
              return (
                <g key={op}>
                  <rect x={BIG.cx - 160 + i * 110} y={196} width={100} height={30} rx={15} fill={colors.PANEL} stroke={on ? colors.WARM : colors.MUTED} strokeWidth={on ? 2 : 1} />
                  <Txt x={BIG.cx - 110 + i * 110} y={216} size={14} anchor="middle" fill={on ? colors.WARM : colors.TEXT}>{op}</Txt>
                </g>
              );
            })}
          </g>
        )}
        {bigU > 0.005 && bigFly < 0.999 && (() => {
          const w = lerp(BIG.w, C, bigFly);
          const h = lerp(BIG.h, C, bigFly);
          const cx = lerp(BIG.cx, SLOT.x + C / 2, bigFly);
          const cy = lerp(BIG.cy, SLOT.y + C / 2, bigFly);
          const x = cx - w / 2;
          const y = cy - h / 2;
          const inner = clamp01(1 - bigFly * 3.5);
          const line = (k: number) => clamp01(bigU - k);
          const rows: Array<{ k: string; val: string; color: string }> = [
            { k: 'operation', val: 'subtract', color: colors.TEXT },
            { k: 'left', val: 'pointerX', color: REG_COLORS[0] },
            { k: 'right', val: 'panelLeft', color: REG_COLORS[1] },
          ];
          return (
            <g>
              {inner > 0.005 && [0, 1].map((r) => (
                <path
                  key={r}
                  d={`M ${STRIP.x + STRIP.w} ${regY(r) + 23} C ${STRIP.x + STRIP.w + 110} ${regY(r) + 23}, ${BIG.cx - BIG.w / 2 - 110} ${BIG.cy - 18 + r * 28}, ${BIG.cx - BIG.w / 2} ${BIG.cy - 18 + r * 28}`}
                  fill="none"
                  stroke={REG_COLORS[r]}
                  strokeWidth={2}
                  opacity={inner * line(r + 1) * 0.8}
                />
              ))}
              <rect x={x} y={y} width={w} height={h} rx={lerp(10, 4, bigFly)} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} opacity={clamp01(bigU)} />
              {inner > 0.005 && (
                <g opacity={inner}>
                  {rows.map((r, k) => (
                    <g key={r.k} opacity={line(k)}>
                      <Txt x={x + 18} y={y + 32 + k * 28} fill={colors.MUTED}>{r.k}</Txt>
                      <Txt x={x + 120} y={y + 32 + k * 28} size={16} fill={r.color} weight={650}>{r.val}</Txt>
                    </g>
                  ))}
                  <Txt x={x + w / 2} y={y + 134} size={18} anchor="middle" fill={colors.WARM} weight={700} opacity={line(3)}>
                    {`${fmt(REG[0])} − ${fmt(REG[1])} = ${fmt(R0[SUB_PL])}`}
                  </Txt>
                  <Txt x={BIG.cx} y={BIG.cy + BIG.h / 2 + 26} anchor="middle" fill={colors.MUTED} opacity={line(3)}>emitCandidate · one ordered pair</Txt>
                </g>
              )}
            </g>
          );
        })()}

        {/* ================= the sum bus (B5–B6), behind the cards ================= */}
        {busU > 0.005 && (
          <g opacity={busU}>
            {CANDS0.map((_, i) => {
              const { x, y } = cardXY(0, i);
              const d = dial0(i);
              const x1 = x + C / 2;
              const y1 = y + C / 2;
              const len = Math.hypot(BUS.x - x1, BUS.y - y1);
              return (
                <line key={i} x1={x1} y1={y1} x2={BUS.x} y2={BUS.y} stroke={d > 0.02 ? colors.WARM : colors.MUTED} strokeWidth={d > 0.02 ? 1 + 1.5 * d : 0.8} opacity={d > 0.02 ? 0.35 + 0.65 * d : 0.1} strokeDasharray={len} strokeDashoffset={len * (1 - busU)} />
              );
            })}
          </g>
        )}

        {/* ================= the two card fans ================= */}
        {([0, 1] as const).map((fan) => {
          const deal = fan === 0 ? deal0 : deal1;
          const fanOp = (fan === 0 ? fan0Op : fan1Op) * finFade;
          if (deal <= 0.005 || fanOp <= 0.005) return null;
          const F = FAN[fan];
          const cands = fan === 0 ? CANDS0 : CANDS1;
          const n = F.n;
          const countIn = v(fan === 0 ? scene.count0U : scene.count1U);
          return (
            <g key={fan} opacity={fanOp}>
              <Txt x={FX} y={F.title} size={15} weight={650} opacity={clamp01(deal * 4)}>{`instruction ${fan}`}</Txt>
              <Txt x={FX + 132} y={F.title} size={15} fill={colors.WARM} opacity={countIn}>{`3 × ${n} × ${n} = ${cands.length}`}</Txt>
              {OP_NAMES.map((op, g) => {
                const gx = FX + g * GROUP_PITCH;
                const gu = staggerU(deal, g * n * n, cands.length, 0.03, 0.4);
                return (
                  <g key={op} opacity={gu}>
                    <Txt x={gx + (n * P - 4) / 2} y={F.ops} anchor="middle" fill={colors.MUTED}>{op}</Txt>
                    {Array.from({ length: n }, (_, k) => (
                      <g key={k}>
                        <rect x={gx - 6} y={F.top + k * P + 3} width={3} height={C - 6} rx={1} fill={REG_COLORS[k]} />
                        <rect x={gx + k * P + 3} y={F.top - 6} width={C - 6} height={3} rx={1} fill={REG_COLORS[k]} />
                      </g>
                    ))}
                  </g>
                );
              })}
              {cands.map((c, i) => {
                const u = staggerU(deal, i, cands.length, 0.03, 0.4);
                if (u <= 0.005) return null;
                const { x, y } = cardXY(fan, i);
                const d = fan === 0 ? dial0(i) : dial1(i);
                const k = fan === 0 ? i : N0 + i;
                const glow = glowOp * clamp01(count - k);
                const num = fan === 0 ? fmt(R0[i]) : d > 0.02 ? fmt(r1(i, i0)) : null;
                const numU = fan === 0 ? resU : d > 0.02 ? clamp01(d * 2) : 0;
                const op = d > 0.02 ? 1 : cardOpOthers;
                return (
                  <Card
                    key={i}
                    x={x}
                    y={y}
                    glyph={OP_GLYPH[c.op]}
                    num={num}
                    numU={numU}
                    dial={d}
                    opacity={u * op}
                    glow={glow}
                    drop={lerp(-10, 0, u)}
                  />
                );
              })}
              {fan === 1 && (
                <Txt x={FX} y={496} fill={colors.MUTED} opacity={clamp01(deal * 2 - 1) * cardOpOthers}>
                  rows: left operand · columns: right operand
                </Txt>
              )}
            </g>
          );
        })}

        {/* ================= B5–B6 · the soft sum, then hardening ================= */}
        {busU > 0.005 && (() => {
          const terms = [
            { d: dAdd, r: R0[ADD_PL] },
            { d: dSub, r: R0[SUB_PL] },
          ].filter((x) => x.d > 0.005);
          const exact = hard > 0.98;
          const sum = terms.map((x) => `${fmt(x.d)} × ${fmt(x.r)}`).join(' + ');
          return (
            <g opacity={busU}>
              <circle cx={BUS.x} cy={BUS.y} r={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <Txt x={BUS.x} y={BUS.y + 5} size={14} anchor="middle" fill={colors.WARM}>Σ</Txt>
              <Panel x={RX} y={112} w={RW} h={150} stroke={exact ? colors.POSITIVE : colors.GRID}>
                <Txt x={RX + 16} y={138} size={14}>emitInstruction</Txt>
                <Txt x={RX + RW - 16} y={138} size={14} anchor="end" weight={700} fill={exact ? colors.POSITIVE : colors.SECONDARY}>{exact ? 'exact' : 'soft'}</Txt>
                <MathLabel tex={'\\mathrm{instruction}_0=\\sum_{i=0}^{47} d_i\\, r_i'} x={RX + RW / 2} y={174} fontSize={19} boxWidth={RW - 20} />
                <Txt x={RX + 16} y={222} size={15}>{`${sum} = `}<tspan fill={colors.WARM} fontWeight={700}>{fmt(i0)}</tspan></Txt>
                <Txt x={RX + 16} y={248} size={12} fill={colors.MUTED} opacity={train > 0.01 && !exact ? 1 : 0}>trained dials: schematic</Txt>
                <Txt x={RX + 16} y={248} size={12} fill={colors.MUTED} opacity={train < 0.01 ? 1 : 0}>d = dial, r = the card's own result</Txt>
              </Panel>
              <Panel x={RX} y={278} w={RW} h={82} opacity={v(scene.tieU)} stroke={colors.WARM}>
                <Txt x={RX + 16} y={302} size={14}>hardenProgram · groupWinner</Txt>
                <Txt x={RX + 16} y={324} fill={colors.WARM}>leftmost argmax, strict &gt;</Txt>
                <Txt x={RX + 16} y={346} fill={colors.MUTED}>{`a 0.5 = 0.5 tie: index ${ADD_PL} beats ${SUB_PL}`}</Txt>
              </Panel>
            </g>
          );
        })()}

        {/* ================= B7 · counting the cells ================= */}
        {v(scene.countPanelU) > 0.005 && (() => {
          const n = Math.min(PROGRAM_CELLS, Math.floor(count));
          const tally = n < N0 ? `${n}` : n < PROGRAM_CELLS ? `${N0} + ${n - N0}` : `${N0} + ${N1} = ${PROGRAM_CELLS}`;
          const rt = clamp01(count - PROGRAM_CELLS);
          const nc = v(scene.noCheatU);
          const chips = [
            { x: RX, label: 'example id' },
            { x: RX + 112, label: 'per-example parameter' },
          ];
          return (
            <g opacity={v(scene.countPanelU)}>
              <Txt x={RX} y={140} fill={colors.MUTED}>createProgramLayout</Txt>
              <Txt x={RX} y={188} size={32} weight={700} fill={colors.WARM}>{tally}</Txt>
              <Txt x={RX} y={216} size={16}>program cells</Txt>
              <Txt x={RX} y={252} size={15} opacity={rt}>{`+ ${INPUT_NAMES.length} runtime cells = ${Math.min(SOURCE_CELLS, PROGRAM_CELLS + Math.ceil(rt * 4))} source cells`}</Txt>
              {nc > 0.005 && chips.map((c, k) => {
                const w = c.label.length * 7.83 + 20;
                const u = clamp01(nc * 2 - k * 0.6);
                return (
                  <g key={c.label} opacity={clamp01(nc * 3)}>
                    <rect x={c.x} y={280} width={w} height={28} rx={6} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeOpacity={0.6} />
                    <Txt x={c.x + 10} y={299} fill={colors.MUTED}>{c.label}</Txt>
                    <line x1={c.x + 6} y1={294} x2={c.x + 6 + (w - 12) * u} y2={294} stroke={colors.NEGATIVE} strokeWidth={2} />
                  </g>
                );
              })}
              <Txt x={RX} y={334} fill={colors.MUTED} opacity={nc}>the same 123 cells for every example</Txt>
            </g>
          );
        })()}

        {/* ================= B8–B9 · the two targets and the checker ================= */}
        {tgtOp > 0.005 && v(scene.tgt1U) > 0.005 && (
          <g opacity={tgtOp}>
            {[
              {
                u: v(scene.tgt1U), op: lerp(1, DIM, clamp01(prog * 1.6)), y: 112, name: 'coordinate',
                tex: '(\\mathrm{pointerX}-\\mathrm{panelLeft})\\times\\mathrm{scale}',
                s0: `0: subtract(pointerX, panelLeft) = ${fmt(COORD_I0)}`,
                s1: `1: multiply(instruction0, scale) = ${fmt(COORD_OUT)}`,
              },
              {
                u: v(scene.tgt2U), op: v(scene.tgt2Op) * lerp(DIM, 1, clamp01(prog * 1.6)), y: 224, name: 'two-add',
                tex: '(\\mathrm{pointerX}+\\mathrm{panelLeft})+\\mathrm{distractor}',
                s0: `0: add(pointerX, panelLeft) = ${fmt(TWOADD_I0)}`,
                s1: `1: add(instruction0, distractor) = ${fmt(TWOADD_OUT)}`,
              },
            ].map((c) => (
              <Panel key={c.name} x={RX} y={c.y} w={RW} h={102} opacity={c.u * c.op} stroke={colors.WARM}>
                <g transform={`translate(${lerp(30, 0, c.u)}, 0)`}>
                  <Txt x={RX + 16} y={c.y + 22} size={14} weight={700} fill={colors.WARM}>{c.name}</Txt>
                  <MathLabel tex={c.tex} x={RX + RW / 2} y={c.y + 44} fontSize={16} boxWidth={RW - 16} />
                  <Txt x={RX + 16} y={c.y + 72}>{c.s0}</Txt>
                  <Txt x={RX + 16} y={c.y + 92}>{c.s1}</Txt>
                </g>
              </Panel>
            ))}
            <Panel x={RX} y={342} w={RW} h={142} opacity={clamp01(checkU)} stroke={colors.TEAL}>
              <Txt x={RX + 16} y={364} size={14} fill={colors.TEAL}>checker · Math.fround after every step</Txt>
              <Txt x={RX + 16} y={390} opacity={clamp01(checkU)}>{`fround(fround(${fmt(REG[0])}) − fround(${fmt(REG[1])})) = ${fmt(COORD_I0)}`}</Txt>
              <Txt x={RX + 16} y={412} opacity={clamp01(checkU - 1)}>{`fround(${fmt(COORD_I0)} × fround(${fmt(REG[2])})) = ${fmt(COORD_OUT)}`}</Txt>
              <Txt x={RX + 16} y={442} size={14} fill={colors.POSITIVE} opacity={clamp01(checkU - 2)}>{`hard program   ${fmt(COORD_OUT)} === ${fmt(COORD_OUT)}   ✓`}</Txt>
              <Txt x={RX + 16} y={468} size={14} fill={colors.NEGATIVE} opacity={clamp01(checkU - 3)}>{`dials 0.99 / 0.01  ${NEAR_OUT.toFixed(2)} ≠ ${fmt(COORD_OUT)}   ✗`}</Txt>
            </Panel>
            <Txt x={RX + RW} y={500} size={12} anchor="end" fill={colors.MUTED} opacity={clamp01(checkU - 3)}>close is not a match (dials schematic)</Txt>
          </g>
        )}

        {/* ================= B10 · the measured circuit ================= */}
        {badgeU > 0.005 && (() => {
          const barW = RW;
          const affW = (barW * CIRCUIT.affine) / CIRCUIT.ops;
          const draw = clamp01(badgeU - 1);
          const layersU = clamp01(badgeU - 2);
          const rows = [
            { y: 214, mode: 'soft', layers: CIRCUIT.softLayers },
            { y: 314, mode: 'hard', layers: CIRCUIT.hardLayers },
          ];
          return (
            <g opacity={clamp01(badgeU)}>
              <Txt x={RX} y={130} fill={colors.MUTED}>buildProgram(2, mode) · measured</Txt>
              <Txt x={RX} y={170} size={28} weight={700}>{`${CIRCUIT.ops} operations`}</Txt>
              {rows.map((r) => (
                <g key={r.mode}>
                  <Txt x={RX} y={r.y} size={14} fill={r.mode === 'soft' ? colors.SECONDARY : colors.POSITIVE} weight={700}>{r.mode}</Txt>
                  <Txt x={RX + barW} y={r.y} size={13} anchor="end" fill={colors.MUTED}>{`${CIRCUIT.ops} ops`}</Txt>
                  <rect x={RX} y={r.y + 10} width={affW * clamp01(draw * 3)} height={24} rx={3} fill={colors.MUTED} />
                  <rect x={RX + affW + 2} y={r.y + 10} width={Math.max(0, (barW - affW - 2) * clamp01(draw * 1.5 - 0.5))} height={24} rx={3} fill={colors.SECONDARY} />
                  <Txt x={RX + 10} y={r.y + 27} size={13} fill="#0a0e1a" weight={700} opacity={clamp01(draw * 3 - 1)}>{`${CIRCUIT.affine} affine`}</Txt>
                  <Txt x={RX + affW + 12} y={r.y + 27} size={13} fill="#0a0e1a" weight={700} opacity={clamp01(draw * 2 - 1)}>{`${CIRCUIT.reglu} reglu`}</Txt>
                  <g opacity={layersU}>
                    <Txt x={RX} y={r.y + 58} size={14}>{`${r.layers} layers`}</Txt>
                    {Array.from({ length: r.layers }, (_, k) => (
                      <rect key={k} x={RX + 90 + k * 30} y={r.y + 45} width={24} height={16} rx={3} fill="none" stroke={r.mode === 'soft' ? colors.SECONDARY : colors.POSITIVE} strokeWidth={1.5} opacity={staggerU(layersU, k, r.layers, 0.08, 0.3)} />
                    ))}
                  </g>
                </g>
              ))}
              <Txt x={RX} y={410} size={13} fill={colors.MUTED} opacity={draw}>affine: weighted sum · reglu: relu-gated product</Txt>
            </g>
          );
        })()}

        {/* ================= B11 · two one-hot choices ================= */}
        {finU > 0.005 && (
          <g>
            {FIN.map((f, k) => {
              const u = finU;
              const w = lerp(C, FIN_W, u);
              const h = lerp(C, FIN_H, u);
              const cx = lerp(f.from.x + C / 2, f.cx, u);
              const cy = lerp(f.from.y + C / 2, f.cy, u);
              const x = cx - w / 2;
              const y = cy - h / 2;
              const inner = clamp01(u * 2 - 1);
              const pitch = (FIN_W - 40) / f.n;
              return (
                <g key={k}>
                  <rect x={x} y={y} width={w} height={h} rx={lerp(4, 10, u)} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                  {inner > 0.005 && (
                    <g opacity={inner}>
                      <Txt x={cx} y={y + 34} size={16} anchor="middle" weight={650}>{f.title}</Txt>
                      {Array.from({ length: f.n }, (_, j) => {
                        const hot = j === f.hot;
                        return (
                          <rect key={j} x={x + 20 + j * pitch + pitch * 0.15} y={hot ? y + 58 : y + 66} width={pitch * 0.7} height={hot ? 30 : 14} rx={1} fill={hot ? colors.WARM : colors.MUTED} opacity={hot ? 1 : 0.35} />
                        );
                      })}
                      <Txt x={cx} y={y + 118} anchor="middle" fill={colors.MUTED}>{`one of ${f.n} dials at 1, the rest 0`}</Txt>
                    </g>
                  )}
                </g>
              );
            })}
            <Txt x={640} y={190} size={16} anchor="middle" fill={colors.MUTED} opacity={clamp01(finU * 2 - 1)}>a learned program</Txt>
            <Txt x={640} y={418} size={22} anchor="middle" weight={700} fill={colors.WARM} opacity={clamp01(finU * 2 - 1)}>one-hot, one-hot</Txt>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={222} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fontFamily={UI} fill={colors.MUTED}>
        1 · A Program in 123 Cells
      </text>
    </>
  );
}

export const vizScene = () => scene;
