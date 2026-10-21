// Search Is a Matrix Product
//
// JSON Search — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   src/json-search/search-step.ts:1-4 (240 operations at 8 states; the pattern is data, a new pattern writes cells),
//     7-14 (the two passes: reach[j][s], reached[j][s], continue or start, never goes back), 22-24 (masked: a code
//     point of another kind becomes -1), 26-27 (every value an integer, exact in FP32), 38-39 (classCapacity 16,
//     boundaryCapacity 32), 41-44 (scopes: no match of 'strings' crosses an escape or a key), 58-59
//     (searched = searchable[kind] ? codePoint : -1), 111-127 (the reverse and forward stages, ported line for line
//     below), 207 (patternCells)
//   src/json-search/regex/data-program.ts:1-5, 15-32 (dataSearchCells), 37-46 (emitClasses), 50-58 (createStepAnd:
//     one table read per pair of states)
//   src/json-search/regex/pattern.ts:256-310 (classes and boundaries; compilePattern('error') output copied below,
//     run with bun on the pinned clone)
//   src/json-search/highlighter/kinds.ts:12-14 (the nine display kinds)
//   lab/json-search/README.md:150 (one state per character or class it reads, plus one: error 6, connection reset 17;
//     one table read per pair of states, one program per state capacity)
//   lab/json-search/report.ts `loops` (per position 148 + 92, 356 + 308, 1,156 + 1,124; per 512-position document
//     122,888 / 339,984 / 1,167,392; forward table reads 64 at 8 states and 1,024 at 32), via review.md
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every bit on screen (classes, reach, reached, marks, the masked JSON run) is computed at module
// scope by a port of the search step over compilePattern('error') at the 8-state capacity, and checked against the
// caption's five marked positions. The operation counts are report.ts's; the per-document totals are recomputed as
// 512 × per-position + one start operation per state and checked against them.
import 'katex/dist/katex.min.css';
import { scaleLinear } from 'd3';
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
const CH13 = 7.8; // mono advance at 13 px
const FAINT = 'rgba(148, 163, 184, 0.14)';
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The pattern as data: compilePattern('error') (pattern.ts:307), at the 8-state capacity
// ---------------------------------------------------------------------------

const P_STATES = 6;
const P_TARGETS = [[1], [2], [3], [4], [5], []];
const P_ACCEPT = [false, false, false, false, false, true];
const P_BOUNDARIES = [101, 102, 111, 112, 114, 115];
const P_REGION_CLASSES = [-1, 0, -1, 1, -1, 2, -1];
const P_CLASS_READS = [
  [false, true, false, false, false, false], // class 0: e, read stepping into s1
  [false, false, false, false, true, false], // class 1: o, into s4
  [false, false, true, true, false, true], // class 2: r, into s2, s3, s5
];
const CLASS_CHAR = ['e', 'o', 'r'];
// the smallest program that holds six states (README.md:150: one program per state capacity)
const CAP = { states: 8, classes: 16, boundaries: 32 };
const S = CAP.states;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// writePattern (data-program.ts:76-79): transitions[c][s][t] = classReads[c][t] && targets[s] has t
const TRANS: number[][][] = P_CLASS_READS.map((reads) =>
  range(S).map((s) => range(S).map((t) => (reads[t] === true && (P_TARGETS[s] ?? []).includes(t) ? 1 : 0))),
);
const ACCEPT = range(S).map((s) => P_ACCEPT[s] === true);

/** emitClasses (data-program.ts:37-46): regionClasses[[cp >= 0] + boundaries passed]; -1 = no step reads it. */
const boundariesPassed = (cp: number): number => P_BOUNDARIES.filter((b) => cp >= b).length;
const classOf = (cp: number): number => {
  if (cp < 0) return -1;
  const region = 1 + boundariesPassed(cp);
  return P_REGION_CLASSES[region - 1] ?? -1;
};

/** The reverse and forward stages (search-step.ts:111-127), over one text's code points (-1 = not searched). */
function runSearch(cps: number[]) {
  const n = cps.length;
  const cls = cps.map(classOf);
  const reach: number[][] = range(n).map(() => range(S).map(() => 0));
  let after = range(S).map(() => 0);
  for (let j = n - 1; j >= 0; j--) {
    const c = cls[j];
    reach[j] = range(S).map((s) =>
      c >= 0 && range(S).some((t) => TRANS[c][s][t] === 1 && (ACCEPT[t] || after[t] === 1)) ? 1 : 0,
    );
    after = reach[j];
  }
  const reached: number[][] = [];
  const both: number[][] = [];
  const marks: number[] = [];
  let reg = range(S).map(() => 0);
  let count = 0;
  for (let j = 0; j < n; j++) {
    reached.push(reg);
    const cont = range(S).map((s) => (reg[s] === 1 && reach[j][s] === 1 ? 1 : 0));
    const any = cont.some((b) => b === 1);
    const start = !any && reach[j][0] === 1;
    const live = cont.map((b, s) => (s === 0 && start ? 1 : b));
    both.push(live);
    marks.push((any || start ? 1 : 0) + (start ? 1 : 0));
    const c = cls[j];
    reg = range(S).map((t) => (c >= 0 && range(S).some((s) => live[s] === 1 && TRANS[c][s][t] === 1) ? 1 : 0));
    if (start) count++;
  }
  return { cls, reach, reached, both, marks, count };
}

const TEXT_A = 'no error found';
const CPS_A = [...TEXT_A].map((ch) => ch.codePointAt(0) ?? -1);
const RUN_A = runSearch(CPS_A);
const N_A = TEXT_A.length;
const MARKED_A = range(N_A).filter((j) => RUN_A.marks[j] > 0);
const START_A = RUN_A.marks.indexOf(2);
// caption 9: the start lights at the e, five positions are marked
if (MARKED_A.join() !== '3,4,5,6,7' || START_A !== 3 || RUN_A.count !== 1 || RUN_A.reach[3][0] !== 1) {
  throw new Error('search of "error" over "no error found" does not mark 3..7');
}

// caption 12: the same pattern over a JSON text, everything vs scope 'strings' (search-step.ts:41-59).
// Kinds as the highlighter shows this text: a key with its quotes, punctuation, a string value with its quotes.
const TEXT_B = '{"error":"no error"}';
const KIND_NAMES = ['whitespace', 'punctuation', 'string', 'escape', 'number', 'literal', 'error', 'pastEnd', 'key'];
const K = { punctuation: 1, string: 2, key: 8 };
const KINDS_B = [...TEXT_B].map((_, j) => (j >= 1 && j <= 7 ? K.key : j >= 9 && j <= 18 ? K.string : K.punctuation));
const CPS_B = [...TEXT_B].map((ch) => ch.codePointAt(0) ?? -1);
const RUN_B_ALL = runSearch(CPS_B);
const RUN_B_STR = runSearch(CPS_B.map((cp, j) => (KINDS_B[j] === K.string ? cp : -1)));
const N_B = TEXT_B.length;
if (RUN_B_ALL.count !== 2 || RUN_B_STR.count !== 1 || RUN_B_STR.marks.findIndex((m) => m > 0) !== 13) {
  throw new Error('masked search mismatch');
}

// the cost (report.ts loops): reverse + forward operations per position, one start operation per state
const POSITIONS = 512;
const COSTS = [
  { states: 8, reverse: 148, forward: 92, report: 122888 },
  { states: 16, reverse: 356, forward: 308, report: 339984 },
  { states: 32, reverse: 1156, forward: 1124, report: 1167392 },
].map((c) => ({ ...c, perPos: c.reverse + c.forward, perDoc: POSITIONS * (c.reverse + c.forward) + c.states }));
for (const c of COSTS) if (c.perDoc !== c.report) throw new Error(`per-document count ${c.perDoc} ≠ ${c.report}`);
const READS_8 = CAP.states * CAP.states; // 64
const READS_32 = 32 * 32; // 1,024
// patternCells (search-step.ts:207)
const PATTERN_CELLS = CAP.boundaries + CAP.boundaries + 1 + CAP.classes * S * S + S;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the scan strip
const STRIP = { x0: 470, pitch: 52, w: 46, y: 262, h: 44 };
const colX = (j: number) => STRIP.x0 + j * STRIP.pitch + STRIP.w / 2;
const CLASS_Y = 318;
const BIT = 11;
const ROW = 15;
const REACH_Y = 370;
const REACHED_Y = 484;
const MARK_Y = 594;
const rowY = (top: number, s: number) => top + s * ROW;
const LABEL_X = 462;

// the matrix card (left)
const CARD = { x: 104, y: 252, cell: 28, gap: 3 };
const cellX = (t: number) => CARD.x + t * (CARD.cell + CARD.gap);
const cellY = (s: number) => CARD.y + s * (CARD.cell + CARD.gap);
const CARD_SIZE = S * CARD.cell + (S - 1) * CARD.gap;
const VEC_X = CARD.x - 40;
const RES_Y = CARD.y + CARD_SIZE + 14;

// the chain (top band)
const CHAIN = { x0: 520, dx: 126, y: 168, r: 19 };
const LONG = 'connection reset';
const LONG_N = LONG.length + 1; // 17
const LONG_DX = 41;
const LONG_X0 = 490;
const LONG_Y = 222;

// the boundary ruler (top band)
const RULER_LO = 97;
const RULER_HI = 118;
const RX = scaleLinear([RULER_LO - 0.5, RULER_HI + 0.5], [480, 1200]);
const RULER_Y = 178;
const PROBE_CP = CPS_A[4]; // the first r of "error"
const PROBE_REGION = 1 + boundariesPassed(PROBE_CP);
const PROBE_CLASS = classOf(PROBE_CP);

// the cost bars
const BAR = { x: 610, y0: 196, dy: 104, h: 30, max: 520 };
const barLen = (v: number) => (v / COSTS[2].perPos) * BAR.max;

// the JSON strip
const JSTRIP = { x0: 466, pitch: 36, w: 32 };
const jColX = (j: number) => JSTRIP.x0 + j * JSTRIP.pitch + JSTRIP.w / 2;
const MASK = { x: 70, y: 244, row: 26 };

// the demo vector for caption 4: the match has read e (s1 live); the class of r leads s1 to s2
const DEMO_CLASS = 2;
const DEMO_V = range(S).map((s) => (s === 1 ? 1 : 0));
const DEMO_OUT = range(S).map((t) => (range(S).some((s) => DEMO_V[s] === 1 && TRANS[DEMO_CLASS][s][t] === 1) ? 1 : 0));

const SOURCES = [
  'search-step.ts:2-4 · regex/data-program.ts:15-32',
  'lab/json-search/README.md:150',
  'regex/data-program.ts:37-46 · search-step.ts:38-39',
  'regex/data-program.ts:50-58 · search-step.ts:7-8',
  'regex/data-program.ts:50-58 · report.ts loops',
  'search-step.ts:9-10, 111-118',
  'search-step.ts:11-12, 120-122',
  'search-step.ts:12-14, 123-125',
  'search-step.ts:9-14 · pattern.ts:307',
  'search-step.ts:2 · report.ts loops',
  'report.ts loops · search-step.ts:26-27',
  'search-step.ts:41-44, 58-59 · highlighter/kinds.ts:14',
];
const PIN = 'handwired@4ea7fcb';

const HOME: CameraState = CAMERA_HOME;
const CAM_OPEN: CameraState = { x: 640, y: 330, k: 1.03 };
const CAM_TOP: CameraState = { x: 840, y: 250, k: 1.3 };
const CAM_CARD: CameraState = { x: 400, y: 395, k: 1.42 };
const CAM_STRIP: CameraState = { x: 640, y: 372, k: 1.03 };
const CAM_RULER: CameraState = { x: 640, y: 340, k: 1.04 };
const CAM_COL3: CameraState = { x: 700, y: 390, k: 1.12 };
const CAM_BARS: CameraState = { x: 760, y: 330, k: 1.1 };

/** words at ~150 wpm; long numbers are spoken as several words */
const speak = (text: string): number =>
  text.split(/\s+/).reduce((n, w) => n + (/\d{1,3},\d{3},\d{3}/.test(w) ? 8 : /\d,\d{3}/.test(w) ? 5 : /\d{3}/.test(w) ? 3 : 1), 0) / 2.5;

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const src = tl.channel('src', 0);
  const lens = tl.channel('lens', { x: 640, y: 360, r: 20 });
  const lensOp = tl.channel('lensOp', 0);

  // B1 the pattern is cells
  const patU = tl.channel('patternCardU', 0);
  const stripU = tl.channel('stripU', 0);
  const panelU = tl.channel('cellsPanelU', 0);
  const writeU = tl.channel('writeU', 0);
  const progU = tl.channel('programChipU', 0);
  const introOp = tl.channel('introOp', 1);
  // B2 states
  const chainU = tl.channel('chainU', 0);
  const chainOp = tl.channel('chainOp', 1);
  const longU = tl.channel('longChainU', 0);
  const longOff = tl.channel('longChainOff', 0);
  // B3 classes
  const rulerU = tl.channel('rulerU', 0);
  const rulerOp = tl.channel('rulerOp', 1);
  const probe = tl.channel('probeCp', RULER_LO);
  const probeU = tl.channel('probeU', 0);
  const readoutU = tl.channel('classReadoutU', 0);
  const capsU = tl.channel('capacityTagsU', 0);
  const classRowU = tl.channel('classRowU', 0);
  // B4/B5 the matrix card
  const cardU = tl.channel('cardU', 0);
  const cardOp = tl.channel('cardOp', 1);
  const vecU = tl.channel('vectorU', 0);
  const prodU = tl.channel('productU', 0);
  const texU = tl.channel('texU', 0);
  const readP = tl.channel('tableReads', 0);
  const bigU = tl.channel('grid32U', 0);
  const cardMode = tl.channel('cardMode', 0); // 0 demo · 1 follows the reverse head · 2 the forward head
  // B6–B9 the passes
  const blocksU = tl.channel('blocksU', 0);
  const revP = tl.channel('reverseP', 0);
  const fwdP = tl.channel('forwardP', 0);
  const startSpot = tl.channel('startSpot', 0);
  const chipsU = tl.channel('startChipsU', 0);
  const countP = tl.channel('markCount', 0);
  const machOp = tl.channel('machineOp', 1);
  // B10/B11 the cost
  const barsU = tl.channel('barsU', 0);
  const barsOp = tl.channel('barsOp', 1);
  const docU = tl.channel('perDocU', 0);
  const fp32U = tl.channel('fp32U', 0);
  // B12 the mask
  const jsonU = tl.channel('jsonU', 0);
  const maskTileU = tl.channel('maskTileU', 0);
  const maskU = tl.channel('maskU', 0);
  const runNoteU = tl.channel('runNoteU', 0);

  let t = 0.4;
  let beat = 0;
  /** one caption: the spoken line, its duration, then a short hold; returns the beat start */
  const say = (text: string) => {
    const at = t;
    const dur = speak(text) + 0.5;
    tl.set(src, beat++, at);
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, 0.6);
    return at;
  };
  const fadeOut = (chs: ChannelRef<number>[], at: number, to = 0) => chs.forEach((ch) => tl.tween(ch, to, { at, dur: 0.7, ease: ease.move }));

  // — B1 · the pattern is not code: it sits in cells beside the text —
  let b = say('Search is the harder program. The pattern is not code: its automaton sits in cells beside the text, so a new pattern writes cells and changes no program.');
  tl.tween(progU, 1, { at: b + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(stripU, 1, { at: b + 1.6, dur: 1.2, ease: ease.linear });
  tl.tween(panelU, 1, { at: b + 3.4, dur: 0.8, ease: ease.enter });
  tl.tween(patU, 1, { at: b + 5.2, dur: 0.6, ease: ease.enter });
  tl.set(lens, { x: 214, y: 371, r: 40 }, b + 6.4);
  tl.tween(lensOp, 1, { at: b + 6.5, dur: 0.4, ease: ease.enter });
  tl.tween(writeU, 1, { at: b + 6.6, dur: 1.4, ease: ease.move });
  tl.tween(lensOp, 0, { at: b + 9.4, dur: 0.5, ease: ease.move });

  // — B2 · states: error 6, connection reset 17 —
  b = say('A pattern has one state per character or class it reads, plus one. The word error needs six states. The words connection reset need seventeen.');
  tl.tween(cam, CAM_TOP, { at: b, dur: 1.3, ease: ease.move });
  fadeOut([introOp], b);
  tl.tween(machOp, 0.12, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(chainU, 1, { at: b + 0.8, dur: 2.2, ease: ease.draw });
  tl.set(lens, { x: CHAIN.x0 + 5 * CHAIN.dx, y: CHAIN.y, r: 32 }, b + 4.2);
  tl.tween(lensOp, 1, { at: b + 4.3, dur: 0.4, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b + 6.0, dur: 0.4, ease: ease.move });
  tl.tween(longU, 1, { at: b + 6.4, dur: 1.6, ease: ease.draw });
  tl.tween(longOff, 1, { at: b + 9.2, dur: 1.2, ease: ease.move });

  // — B3 · a code point becomes a class by counting boundaries —
  b = say('Each code point first becomes a class, found by counting how many class boundaries it has passed. A pattern may use up to sixteen classes and thirty-two boundaries.');
  tl.tween(cam, CAM_RULER, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(chainOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(rulerU, 1, { at: b + 0.4, dur: 1.4, ease: ease.draw });
  tl.tween(probeU, 1, { at: b + 1.8, dur: 0.5, ease: ease.enter });
  tl.tween(probe, PROBE_CP, { at: b + 2.2, dur: 3.2, ease: ease.linear });
  tl.tween(readoutU, 1, { at: b + 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(machOp, 1, { at: b + 5.8, dur: 0.6, ease: ease.move });
  tl.tween(classRowU, 1, { at: b + 6.4, dur: 1.4, ease: ease.linear });
  tl.tween(capsU, 1, { at: b + 8.0, dur: 0.6, ease: ease.enter });

  // — B4 · the class picks a 0/1 matrix; one step multiplies —
  b = say('The class picks a transition matrix of ones and zeros: which state leads to which. The set of live states is a zero-one vector, and one step multiplies the two.');
  tl.tween(cam, CAM_CARD, { at: b, dur: 1.4, ease: ease.move });
  fadeOut([rulerOp, machOp], b);
  tl.tween(cardU, 1, { at: b + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(vecU, 1, { at: b + 6.0, dur: 0.6, ease: ease.enter });
  tl.set(lens, { x: cellX(2) + CARD.cell / 2, y: cellY(1) + CARD.cell / 2, r: 24 }, b + 8.0);
  tl.tween(lensOp, 1, { at: b + 8.1, dur: 0.4, ease: ease.enter });
  tl.tween(prodU, 1, { at: b + 8.4, dur: 0.8, ease: ease.move });
  tl.tween(texU, 1, { at: b + 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b + 11.6, dur: 0.4, ease: ease.move });

  // — B5 · each product is one table read: 64 at 8 states, 1,024 at 32 —
  b = say('Each product in that multiply is one table read, a single lookup per pair of states. Eight states mean sixty-four lookups per step, thirty-two mean 1,024.');
  tl.tween(texU, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.tween(readP, READS_8, { at: b + 0.6, dur: 5.6, ease: ease.linear });
  tl.tween(bigU, 1, { at: b + 7.6, dur: 1.2, ease: ease.enter });

  // — B6 · the reverse pass —
  b = say('The reverse pass walks from the end of the text. A one in the reach vector means: from this state, here, some path reads at least one code point and ends accepting.');
  tl.tween(cam, CAM_STRIP, { at: b, dur: 1.4, ease: ease.move });
  fadeOut([vecU, prodU, texU, bigU], b);
  tl.tween(readP, 0, { at: b, dur: 0.5, ease: ease.move });
  tl.set(cardMode, 1, b + 0.6);
  tl.tween(machOp, 1, { at: b + 1.0, dur: 0.7, ease: ease.move });
  tl.tween(blocksU, 1, { at: b + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(revP, N_A, { at: b + 1.8, dur: 7.0, ease: ease.linear });
  tl.set(lens, { x: colX(START_A), y: rowY(REACH_Y, 0) + BIT / 2, r: 15 }, b + 9.0);
  tl.tween(lensOp, 1, { at: b + 9.1, dur: 0.4, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b + 12.4, dur: 0.4, ease: ease.move });

  // — B7 · the forward pass: reached ∧ reach —
  b = say('The forward pass walks from the start. A code point belongs to a match when a state is both reached by the match in progress and marked by the reverse pass.');
  tl.set(cardMode, 2, b + 0.4);
  tl.tween(fwdP, N_A, { at: b + 1.0, dur: 7.5, ease: ease.linear });
  tl.set(lens, { x: colX(5), y: rowY(REACHED_Y, 2) + BIT / 2, r: 15 }, b + 8.8);
  tl.tween(lensOp, 1, { at: b + 8.9, dur: 0.4, ease: ease.enter });
  tl.tween(lensOp, 0, { at: b + 11.4, dur: 0.4, ease: ease.move });

  // — B8 · a match starts where reach marks the initial state —
  b = say('When no match is in progress, a new one starts where the reverse pass marks the initial state. So the forward pass already knows whether a longer match exists, and never backtracks.');
  tl.tween(cam, CAM_COL3, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(cardOp, 0, { at: b, dur: 0.7, ease: ease.move });
  tl.tween(startSpot, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(chipsU, 1, { at: b + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(chipsU, 2, { at: b + 7.4, dur: 0.6, ease: ease.enter });

  // — B9 · on "no error found": five marked positions —
  b = say('On the text no error found, the reverse pass lights the start at the letter e, the forward pass carries the match through five letters, and five positions are marked.');
  tl.tween(cam, CAM_STRIP, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(chipsU, 3, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(countP, 5, { at: b + 4.0, dur: 5.0, ease: ease.linear });

  // — B10 · per position: 240 · 664 · 2,280 —
  b = say('Per position, the two passes cost 240 operations at eight states, 664 at sixteen, and 2,280 at thirty-two, whatever the length of the text.');
  tl.tween(cam, CAM_BARS, { at: b, dur: 1.4, ease: ease.move });
  fadeOut([machOp, cardOp, startSpot], b);
  tl.tween(barsU, 1, { at: b + 1.0, dur: 6.0, ease: ease.linear });

  // — B11 · per document; integers, so FP32 is exact —
  b = say('Over a full 512-position document that is 122,888 operations at eight states, and 1,167,392 at thirty-two. Every value is an integer, so 32-bit floats are exact.');
  tl.tween(docU, 1, { at: b + 1.0, dur: 1.4, ease: ease.move });
  tl.tween(fp32U, 1, { at: b + 11.0, dur: 0.7, ease: ease.enter });

  // — B12 · the mask: a match stays inside one run —
  b = say("The search can also read the highlighter's display kinds, so a match stays inside one run, such as one string value, and never crosses an escape or a key.");
  tl.tween(cam, HOME, { at: b, dur: 1.4, ease: ease.move });
  fadeOut([barsOp, fp32U], b);
  tl.tween(jsonU, 1, { at: b + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(maskTileU, 1, { at: b + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(maskU, 1, { at: b + 5.0, dur: 1.2, ease: ease.move });
  tl.tween(runNoteU, 1, { at: b + 7.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 2.0);

  return {
    tl, cam, src, lens, lensOp,
    patU, stripU, panelU, writeU, progU, introOp,
    chainU, chainOp, longU, longOff,
    rulerU, rulerOp, probe, probeU, readoutU, capsU, classRowU,
    cardU, cardOp, vecU, prodU, texU, readP, bigU, cardMode,
    blocksU, revP, fwdP, startSpot, chipsU, countP, machOp,
    barsU, barsOp, docU, fp32U,
    jsonU, maskTileU, maskU, runNoteU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function LensRing({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const a = -Math.PI / 4;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffffff" strokeWidth={2} />
      <line x1={x + r * Math.cos(a)} y1={y + r * Math.sin(a)} x2={x + (r + 14) * Math.cos(a)} y2={y + (r + 14) * Math.sin(a)} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** A 0/1 bit square: filled in `color` when 1, an outline when 0. */
function Bit({ x, y, on, color, opacity = 1, size = BIT }: { x: number; y: number; on: boolean; color: string; opacity?: number; size?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <rect
      x={x - size / 2}
      y={y}
      width={size}
      height={size}
      rx={2}
      fill={on ? color : 'none'}
      stroke={on ? color : colors.MUTED}
      strokeOpacity={on ? 1 : 0.35}
      strokeWidth={1}
      opacity={opacity}
    />
  );
}

function Chip({ x, y, text, color = colors.MUTED, opacity = 1, size = 13, anchor = 'start' }: {
  x: number; y: number; text: string; color?: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * size * 0.6 + 18;
  const left = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - size - 4} width={w} height={size + 12} rx={5} fill={colors.PANEL} stroke={color} strokeOpacity={0.7} />
      <text x={left + 9} y={y + 1} fontSize={size} fontFamily={MONO} fill={color} xmlSpace="preserve">
        {text}
      </text>
    </g>
  );
}

/** A tiny n×n grid glyph (the transition table's size at a capacity). */
function GridGlyph({ x, y, n, size, opacity }: { x: number; y: number; n: number; size: number; opacity: number }) {
  const step = size / n;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={size} height={size} fill={colors.ACCENT} fillOpacity={0.08} stroke={colors.ACCENT} strokeOpacity={0.7} />
      {range(n - 1).map((i) => (
        <g key={i} stroke={colors.ACCENT} strokeOpacity={0.3} strokeWidth={0.6}>
          <line x1={x + (i + 1) * step} y1={y} x2={x + (i + 1) * step} y2={y + size} />
          <line x1={x} y1={y + (i + 1) * step} x2={x + size} y2={y + (i + 1) * step} />
        </g>
      ))}
    </g>
  );
}

const classColor = (c: number) => (c === 0 ? colors.WARM : c === 1 ? colors.POSITIVE : c === 2 ? colors.ACCENT : colors.MUTED);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const lens = s.get(scene.lens);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(v(scene.src))));
  const chip = `${PIN} · ${SOURCES[srcIdx]}`;

  const introOp = v(scene.introOp);
  const machOp = v(scene.machOp);
  const stripU = v(scene.stripU);
  const writeU = v(scene.writeU);
  const classRowU = v(scene.classRowU);
  const blocksU = v(scene.blocksU);
  const revP = v(scene.revP);
  const fwdP = v(scene.fwdP);
  const countP = v(scene.countP);
  const startSpot = v(scene.startSpot);
  const chipsU = v(scene.chipsU);

  // per-column progress of each pass
  const revCol = (j: number) => clamp01(revP - (N_A - 1 - j));
  const fwdCol = (j: number) => clamp01(fwdP - j);
  const revHead = revP > 0 && revP < N_A ? N_A - 1 - Math.floor(revP) : -1;
  const fwdHead = fwdP > 0 && fwdP < N_A ? Math.floor(fwdP) : -1;

  // the card: the demo class, or the class under the moving head
  const mode = Math.round(v(scene.cardMode));
  const headJ = mode === 1 ? (revHead >= 0 ? revHead : revP >= N_A ? 0 : N_A - 1) : mode === 2 ? (fwdHead >= 0 ? fwdHead : fwdP >= N_A ? N_A - 1 : 0) : -1;
  const cardClass = mode === 0 ? DEMO_CLASS : RUN_A.cls[headJ];
  const cardU = v(scene.cardU);
  const cardOp = v(scene.cardOp) * clamp01(cardU * 3);
  const readP = v(scene.readP);
  const vecU = v(scene.vecU);
  const prodU = v(scene.prodU);
  const bigU = v(scene.bigU);
  // which cells contribute at the head (lit while a pass runs)
  const liveCell = (sIdx: number, tIdx: number): boolean => {
    if (cardClass < 0 || TRANS[cardClass][sIdx][tIdx] !== 1) return false;
    if (mode === 1 && revHead >= 0) {
      const after = revHead + 1 < N_A ? RUN_A.reach[revHead + 1] : range(S).map(() => 0);
      return ACCEPT[tIdx] || after[tIdx] === 1;
    }
    if (mode === 2 && fwdHead >= 0) return RUN_A.both[fwdHead][sIdx] === 1;
    return false;
  };

  // marks visible so far, and the 1..5 count in B9
  const markedShown = (j: number) => fwdCol(j) >= 1 && RUN_A.marks[j] > 0;
  const countIdx = (j: number) => MARKED_A.indexOf(j);

  // the bars
  const barsU = v(scene.barsU);
  const docU = v(scene.docU);
  const barsOp = v(scene.barsOp);

  // the JSON run
  const jsonU = v(scene.jsonU);
  const maskU = v(scene.maskU);
  const maskTileU = v(scene.maskTileU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B1 · program chip, cells panel, pattern card ================= */}
        {introOp > 0.005 && (
          <g opacity={introOp}>
            <Chip x={640} y={170} anchor="middle" size={15} text="search-step.ts · the program" color={colors.TEXT} opacity={v(scene.progU)} />
            <Chip x={640} y={204} anchor="middle" size={13} text={`unchanged by any pattern`} color={colors.POSITIVE} opacity={v(scene.progU) * clamp01(writeU * 2 - 0.6)} />
            {v(scene.panelU) > 0.005 && (
              <g opacity={v(scene.panelU)}>
                <rect x={40} y={238} width={372} height={196} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={56} y={262} fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>dataSearchCells · 8 states</text>
                {[
                  ['text', '[1] · this code point'],
                  ['boundaries', `[${CAP.boundaries}]`],
                  ['regionClasses', `[${CAP.boundaries + 2}]`],
                  ['transitions', `[${CAP.classes}][${S}][${S}]`],
                  ['accepting', `[${S}]`],
                ].map(([name, dims], i) => {
                  const flash = i > 0 ? clamp01(writeU * 5 - i) : 0;
                  return (
                    <g key={name}>
                      {flash > 0 && <rect x={50} y={276 + i * 26} width={352} height={22} rx={4} fill={colors.WARM} opacity={0.18 * flash} />}
                      <text x={60} y={292 + i * 26} fontSize={13} fontFamily={MONO} fill={i === 0 ? colors.MUTED : colors.TEXT}>{name}</text>
                      <text x={205} y={292 + i * 26} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>{dims}</text>
                    </g>
                  );
                })}
                <text x={60} y={420} fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={clamp01(writeU * 2 - 1)}>
                  a new pattern writes {commas(PATTERN_CELLS)} cells
                </text>
              </g>
            )}
            {v(scene.patU) > 0.005 && (
              <g opacity={v(scene.patU)}>
                <rect x={136} y={112} width={156} height={50} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                <text x={214} y={145} textAnchor="middle" fontSize={24} fontFamily={MONO} fontWeight={650} fill={colors.WARM}>error</text>
                <text x={214} y={102} textAnchor="middle" fontSize={13} fill={colors.MUTED}>the pattern</text>
                <path d={`M 214 164 L 214 ${lerp(164, 232, clamp01(writeU * 1.6))}`} stroke={colors.WARM} strokeWidth={2.5} />
                {writeU > 0.6 && <polygon points="206,226 222,226 214,236" fill={colors.WARM} />}
              </g>
            )}
          </g>
        )}

        {/* ================= B2 · the chain of states ================= */}
        {v(scene.chainU) > 0.005 && v(scene.chainOp) > 0.005 && (
          <g opacity={v(scene.chainOp)}>
            {range(P_STATES).map((i) => {
              const u = clamp01(v(scene.chainU) * 6 - i);
              if (u <= 0) return null;
              const cx = CHAIN.x0 + i * CHAIN.dx;
              return (
                <g key={i} opacity={u}>
                  {i > 0 && (
                    <>
                      <line x1={cx - CHAIN.dx + CHAIN.r + 2} y1={CHAIN.y} x2={lerp(cx - CHAIN.dx + CHAIN.r + 2, cx - CHAIN.r - 8, u)} y2={CHAIN.y} stroke={colors.MUTED} strokeWidth={2} />
                      <polygon points={`${cx - CHAIN.r - 2},${CHAIN.y} ${cx - CHAIN.r - 10},${CHAIN.y - 5} ${cx - CHAIN.r - 10},${CHAIN.y + 5}`} fill={colors.MUTED} />
                      <text x={cx - CHAIN.dx / 2} y={CHAIN.y - 12} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>{'error'[i - 1]}</text>
                    </>
                  )}
                  <circle cx={cx} cy={CHAIN.y} r={CHAIN.r} fill={colors.PANEL} stroke={i === 5 ? colors.POSITIVE : colors.ACCENT} strokeWidth={2} />
                  {i === 5 && <circle cx={cx} cy={CHAIN.y} r={CHAIN.r - 5} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} />}
                  <text x={cx} y={CHAIN.y + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.TEXT}>s{i}</text>
                </g>
              );
            })}
            <text x={CHAIN.x0 - 30} y={CHAIN.y - 50} fontSize={15} fontFamily={MONO} fill={colors.TEXT} opacity={clamp01(v(scene.chainU) * 2 - 1)}>
              error · 6 states · s0 starts, s5 accepts
            </text>
            {v(scene.longU) > 0.005 && (
              <g opacity={v(scene.longU) * (1 - v(scene.longOff))} transform={`translate(${v(scene.longOff) * 260}, 0)`}>
                {range(LONG_N).map((i) => {
                  const u = clamp01(v(scene.longU) * LONG_N - i);
                  const cx = LONG_X0 + i * LONG_DX;
                  return (
                    <g key={i} opacity={u}>
                      {i > 0 && <line x1={cx - LONG_DX + 8} y1={LONG_Y} x2={cx - 8} y2={LONG_Y} stroke={colors.MUTED} strokeWidth={1.2} />}
                      {i > 0 && LONG[i - 1] !== ' ' && (
                        <text x={cx - LONG_DX / 2} y={LONG_Y - 9} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM}>{LONG[i - 1]}</text>
                      )}
                      {i > 0 && LONG[i - 1] === ' ' && (
                        <text x={cx - LONG_DX / 2} y={LONG_Y - 9} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>␣</text>
                      )}
                      <circle cx={cx} cy={LONG_Y} r={7} fill={colors.PANEL} stroke={i === LONG_N - 1 ? colors.POSITIVE : colors.ACCENT} strokeWidth={1.5} />
                    </g>
                  );
                })}
                <text x={LONG_X0 - 10} y={LONG_Y + 30} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                  connection reset · {LONG_N} states
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B3 · the boundary ruler ================= */}
        {v(scene.rulerU) > 0.005 && v(scene.rulerOp) > 0.005 && (
          <g opacity={v(scene.rulerOp)}>
            <line x1={RX(RULER_LO - 0.5)} y1={RULER_Y} x2={lerp(RX(RULER_LO - 0.5), RX(RULER_HI + 0.5), v(scene.rulerU))} y2={RULER_Y} stroke={colors.MUTED} strokeWidth={2} />
            {/* class regions */}
            {P_BOUNDARIES.slice(0, -1).map((lo, k) => {
              const cls = P_REGION_CLASSES[k + 1];
              if (cls < 0) return null;
              return <rect key={lo} x={RX(lo - 0.5)} y={RULER_Y - 14} width={RX(P_BOUNDARIES[k + 1] - 0.5) - RX(lo - 0.5)} height={28} fill={classColor(cls)} opacity={0.22 * v(scene.rulerU)} />;
            })}
            {range(RULER_HI - RULER_LO + 1).map((k) => {
              const cp = RULER_LO + k;
              const op = clamp01(v(scene.rulerU) * 22 - k);
              return (
                <text key={cp} x={RX(cp)} y={RULER_Y + 34} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={classOf(cp) >= 0 ? classColor(classOf(cp)) : colors.MUTED} opacity={op}>
                  {String.fromCodePoint(cp)}
                </text>
              );
            })}
            {P_BOUNDARIES.map((bd, k) => {
              const passed = v(scene.probe) >= bd;
              return (
                <g key={bd} opacity={clamp01(v(scene.rulerU) * 2 - 1)}>
                  <line x1={RX(bd - 0.5)} y1={RULER_Y - 26} x2={RX(bd - 0.5)} y2={RULER_Y + 16} stroke={passed && v(scene.probeU) > 0 ? colors.WARM : colors.TEXT} strokeWidth={2} />
                  <text x={RX(bd - 0.5)} y={RULER_Y - 32} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>{k === 0 || k === 5 ? bd : ''}</text>
                </g>
              );
            })}
            <text x={480} y={RULER_Y - 56} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.rulerU)}>
              boundaries {P_BOUNDARIES.join(' · ')}
            </text>
            {v(scene.probeU) > 0.005 && (
              <g opacity={v(scene.probeU)}>
                <polygon points={`${RX(v(scene.probe))},${RULER_Y + 42} ${RX(v(scene.probe)) - 8},${RULER_Y + 56} ${RX(v(scene.probe)) + 8},${RULER_Y + 56}`} fill={colors.WARM} />
                <text x={RX(v(scene.probe))} y={RULER_Y + 74} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.WARM}>
                  {Math.floor(v(scene.probe))}
                </text>
                <text x={1200} y={RULER_Y - 56} textAnchor="end" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                  passed: {boundariesPassed(Math.floor(v(scene.probe)))}
                </text>
              </g>
            )}
            {v(scene.readoutU) > 0.005 && (
              <g opacity={v(scene.readoutU)}>
                <rect x={60} y={150} width={360} height={64} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
                <text x={76} y={176} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  r = {PROBE_CP} · region 1 + {PROBE_REGION - 1} = {PROBE_REGION}
                </text>
                <text x={76} y={200} fontSize={14} fontFamily={MONO} fill={colors.WARM}>
                  regionClasses[{PROBE_REGION}] = {PROBE_CLASS} · class r
                </text>
              </g>
            )}
            <Chip x={60} y={252} text={`classCapacity = ${CAP.classes}`} color={colors.SECONDARY} opacity={v(scene.capsU)} />
            <Chip x={250} y={252} text={`boundaryCapacity = ${CAP.boundaries}`} color={colors.SECONDARY} opacity={v(scene.capsU)} />
          </g>
        )}

        {/* ================= the scan strip (persistent) ================= */}
        {stripU > 0.005 && machOp > 0.005 && (
          <g opacity={machOp}>
            {range(N_A).map((j) => {
              const u = clamp01(stripU * N_A - j);
              const x = STRIP.x0 + j * STRIP.pitch;
              const lit = markedShown(j);
              const counted = countP > 0 && countIdx(j) >= 0 && countP >= countIdx(j) + 1;
              return (
                <g key={j} opacity={u}>
                  <rect x={x} y={STRIP.y} width={STRIP.w} height={STRIP.h} rx={6} fill={lit ? colors.WARM : colors.PANEL} fillOpacity={lit ? (counted ? 0.55 : 0.3) : 1} stroke={lit ? colors.WARM : colors.GRID} strokeWidth={lit ? 2 : 1} />
                  <text x={x + STRIP.w / 2} y={STRIP.y + 30} textAnchor="middle" fontSize={22} fontFamily={MONO} fill={colors.TEXT}>
                    {TEXT_A[j] === ' ' ? '␣' : TEXT_A[j]}
                  </text>
                  <text x={x + STRIP.w / 2} y={STRIP.y - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={0.8}>
                    {j}
                  </text>
                </g>
              );
            })}
            <text x={LABEL_X} y={STRIP.y + 28} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={stripU}>text</text>
            {/* the class row */}
            {classRowU > 0.005 && (
              <g>
                <text x={LABEL_X} y={CLASS_Y + 17} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={classRowU}>class</text>
                {range(N_A).map((j) => {
                  const u = clamp01(classRowU * N_A - j);
                  const c = RUN_A.cls[j];
                  return (
                    <text key={j} x={colX(j)} y={CLASS_Y + 17} textAnchor="middle" fontSize={15} fontFamily={MONO} fontWeight={c >= 0 ? 700 : 400} fill={classColor(c)} opacity={u * (c >= 0 ? 1 : 0.6)}>
                      {c >= 0 ? c : '–'}
                    </text>
                  );
                })}
              </g>
            )}
            {/* the two bit blocks */}
            {blocksU > 0.005 && (
              <g opacity={blocksU}>
                <text x={colX(N_A - 1) + STRIP.w / 2} textAnchor="end" y={REACH_Y - 10} fontSize={14} fontFamily={MONO} fill={colors.ACCENT}>reach[j][s] · reverse pass ←</text>
                <text x={colX(N_A - 1) + STRIP.w / 2} textAnchor="end" y={REACHED_Y - 10} fontSize={14} fontFamily={MONO} fill={colors.SECONDARY}>reached[j][s] · forward pass →</text>
                {range(P_STATES).map((sIdx) => (
                  <g key={sIdx}>
                    <text x={LABEL_X} y={rowY(REACH_Y, sIdx) + 10} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>s{sIdx}</text>
                    <text x={LABEL_X} y={rowY(REACHED_Y, sIdx) + 10} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>s{sIdx}</text>
                  </g>
                ))}
                {range(N_A).map((j) =>
                  range(P_STATES).map((sIdx) => {
                    const ru = revCol(j);
                    const fu = fwdCol(j);
                    const and = RUN_A.reached[j][sIdx] === 1 && RUN_A.reach[j][sIdx] === 1;
                    const startBit = j === START_A && sIdx === 0;
                    const spot = startSpot > 0 && startBit;
                    const dim = startSpot > 0 && j !== START_A ? lerp(1, 0.25, startSpot) : 1;
                    return (
                      <g key={`${j}-${sIdx}`} opacity={dim}>
                        <Bit x={colX(j)} y={rowY(REACH_Y, sIdx)} on={RUN_A.reach[j][sIdx] === 1 && ru >= 1} color={spot ? colors.WARM : colors.ACCENT} opacity={ru > 0 ? 0.35 + 0.65 * ru : 0.25} />
                        <Bit x={colX(j)} y={rowY(REACHED_Y, sIdx)} on={RUN_A.reached[j][sIdx] === 1 && fu >= 1} color={colors.SECONDARY} opacity={fu > 0 ? 0.35 + 0.65 * fu : 0.25} />
                        {and && fu >= 1 && (
                          <>
                            <rect x={colX(j) - BIT / 2 - 3} y={rowY(REACH_Y, sIdx) - 3} width={BIT + 6} height={BIT + 6} rx={3} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                            <rect x={colX(j) - BIT / 2 - 3} y={rowY(REACHED_Y, sIdx) - 3} width={BIT + 6} height={BIT + 6} rx={3} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                          </>
                        )}
                      </g>
                    );
                  }),
                )}
                {/* heads */}
                {revHead >= 0 && <rect x={colX(revHead) - STRIP.w / 2 - 2} y={STRIP.y - 4} width={STRIP.w + 4} height={REACH_Y + P_STATES * ROW - STRIP.y + 6} rx={7} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} />}
                {fwdHead >= 0 && <rect x={colX(fwdHead) - STRIP.w / 2 - 2} y={STRIP.y - 4} width={STRIP.w + 4} height={REACHED_Y + P_STATES * ROW - STRIP.y + 6} rx={7} fill="none" stroke={colors.SECONDARY} strokeWidth={2.5} />}
                {/* marks */}
                <text x={LABEL_X} y={MARK_Y + 5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(fwdP)}>mark</text>
                {range(N_A).map((j) => {
                  if (fwdCol(j) < 1) return null;
                  const m = RUN_A.marks[j];
                  const ci = countIdx(j);
                  const counted = countP > 0 && ci >= 0 && countP >= ci + 1;
                  return (
                    <g key={j}>
                      {m === 0 && <circle cx={colX(j)} cy={MARK_Y} r={3} fill={colors.MUTED} opacity={0.35} />}
                      {m > 0 && <circle cx={colX(j)} cy={MARK_Y} r={m === 2 ? 9 : 7} fill={colors.WARM} />}
                      {m > 0 && (
                        <text x={colX(j)} y={MARK_Y + 4.5} textAnchor="middle" fontSize={12} fontFamily={MONO} fontWeight={700} fill="#1a1206">
                          {counted ? ci + 1 : m}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
            {/* B8 · the start, spelled out */}
            {chipsU > 0.005 && (
              <g opacity={chipsU > 2 ? 1 - clamp01(chipsU - 2) : 1}>
                <Chip x={colX(START_A) - 30} y={158} size={13} text={`no match in progress: reached[${START_A}] = 0…0`} color={colors.SECONDARY} opacity={clamp01(chipsU)} />
                <Chip x={colX(START_A) - 30} y={190} size={13} text={`start: reach[${START_A}][s0] = 1  →  a match starts at the e`} color={colors.WARM} opacity={clamp01(chipsU)} />
                <Chip x={colX(START_A) - 30} y={222} size={13} text="the head only moves →  ·  no backtracking" color={colors.TEXT} opacity={clamp01(chipsU - 1)} />
              </g>
            )}
            {countP > 0.005 && (
              <g opacity={clamp01(countP * 2)}>
                <Chip x={colX(5)} y={196} anchor="middle" size={16} text={`${Math.min(5, Math.floor(countP))} positions marked · matchCount = ${RUN_A.count}`} color={colors.WARM} />
              </g>
            )}
          </g>
        )}

        {/* ================= the matrix card ================= */}
        {cardU > 0.005 && cardOp > 0.005 && (
          <g opacity={cardOp}>
            <text x={CARD.x} y={CARD.y - 30} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              transitions[{cardClass >= 0 ? cardClass : '–'}]
              <tspan fill={cardClass >= 0 ? classColor(cardClass) : colors.MUTED}>{cardClass >= 0 ? `  · class ${CLASS_CHAR[cardClass]}` : '  · no step reads it'}</tspan>
            </text>
            <text x={CARD.x + CARD_SIZE / 2} y={CARD.y - 10} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>to t →</text>
            <text x={CARD.x - 64} y={CARD.y + CARD_SIZE / 2} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} transform={`rotate(-90 ${CARD.x - 64} ${CARD.y + CARD_SIZE / 2})`} opacity={1 - vecU}>
              from s ↓
            </text>
            {range(S).map((sIdx) =>
              range(S).map((tIdx) => {
                const k = sIdx * S + tIdx;
                const u = clamp01(cardU * S * S * 0.25 - k * 0.25 + 1);
                const one = cardClass >= 0 && TRANS[cardClass][sIdx][tIdx] === 1;
                const unused = sIdx >= P_STATES || tIdx >= P_STATES;
                const read = readP > k;
                const reading = readP > k && readP < k + 1;
                const prod = mode === 0 && prodU > 0 && DEMO_V[sIdx] === 1;
                const live = liveCell(sIdx, tIdx);
                return (
                  <g key={k} opacity={u}>
                    <rect
                      x={cellX(tIdx)}
                      y={cellY(sIdx)}
                      width={CARD.cell}
                      height={CARD.cell}
                      rx={3}
                      fill={one ? colors.WARM : FAINT}
                      fillOpacity={one ? (live ? 1 : 0.7) : unused ? 0.5 : 1}
                      stroke={reading ? '#ffffff' : prod ? colors.SECONDARY : live ? '#ffffff' : 'none'}
                      strokeWidth={reading ? 2.5 : 2}
                      strokeOpacity={prod ? prodU : 1}
                    />
                    <text x={cellX(tIdx) + CARD.cell / 2} y={cellY(sIdx) + 19} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={one ? '#1a1206' : colors.MUTED} opacity={one ? 1 : unused ? 0.35 : 0.6}>
                      {one ? 1 : 0}
                    </text>
                    {read && !reading && <circle cx={cellX(tIdx) + CARD.cell - 5} cy={cellY(sIdx) + 5} r={2.5} fill={colors.ACCENT} />}
                  </g>
                );
              }),
            )}
            {range(S).map((i) => (
              <g key={i} opacity={clamp01(cardU * 2 - 1)}>
                <text x={cellX(i) + CARD.cell / 2} y={CARD.y + CARD_SIZE + (vecU > 0.01 ? 54 : 16)} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={vecU > 0.01 ? 0 : 1}>
                  s{i}
                </text>
                <text x={CARD.x - 8} y={cellY(i) + 19} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={1 - vecU}>
                  s{i}
                </text>
              </g>
            ))}
            {/* the 0/1 state vector and the product */}
            {vecU > 0.005 && mode === 0 && (
              <g opacity={vecU}>
                <text x={VEC_X + 12} y={CARD.y - 10} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.SECONDARY}>v</text>
                {range(S).map((sIdx) => (
                  <g key={sIdx}>
                    <rect x={VEC_X} y={cellY(sIdx)} width={24} height={CARD.cell} rx={3} fill={DEMO_V[sIdx] ? colors.SECONDARY : 'none'} stroke={colors.SECONDARY} strokeOpacity={0.6} />
                    <text x={VEC_X + 12} y={cellY(sIdx) + 19} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={DEMO_V[sIdx] ? '#140f24' : colors.MUTED}>{DEMO_V[sIdx]}</text>
                  </g>
                ))}
                <text x={VEC_X + 12} y={RES_Y + 19} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.SECONDARY} opacity={prodU}>v·T</text>
                {range(S).map((tIdx) => (
                  <g key={tIdx} opacity={prodU}>
                    <rect x={cellX(tIdx)} y={RES_Y} width={CARD.cell} height={CARD.cell} rx={3} fill={DEMO_OUT[tIdx] ? colors.SECONDARY : 'none'} stroke={colors.SECONDARY} strokeOpacity={0.6} />
                    <text x={cellX(tIdx) + CARD.cell / 2} y={RES_Y + 19} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={DEMO_OUT[tIdx] ? '#140f24' : colors.MUTED}>{DEMO_OUT[tIdx]}</text>
                  </g>
                ))}
              </g>
            )}
            <MathLabel tex={"v'_t=\\bigvee_s\\, v_s \\wedge T_c[s][t]"} x={CARD.x + CARD_SIZE + 26} y={CARD.y + 150} anchor="start" fontSize={22} boxWidth={320} color={colors.TEXT} opacity={v(scene.texU) * (mode === 0 ? 1 : 0)} />
            {/* table reads */}
            {readP > 0.005 && mode === 0 && (
              <g>
                <text x={CARD.x + CARD_SIZE + 26} y={CARD.y + 20} fontSize={15} fontFamily={MONO} fill={colors.ACCENT}>table reads</text>
                <text x={CARD.x + CARD_SIZE + 26} y={CARD.y + 52} fontSize={28} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  {Math.min(READS_8, Math.floor(readP))}
                </text>
                <text x={CARD.x + CARD_SIZE + 26} y={CARD.y + 76} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(readP - READS_8 + 1)}>
                  8 states · 8 × 8 = {READS_8}
                </text>
              </g>
            )}
            {bigU > 0.005 && mode === 0 && (
              <g opacity={bigU}>
                <GridGlyph x={CARD.x + CARD_SIZE + 28} y={CARD.y + 100} n={32} size={128} opacity={1} />
                <rect x={CARD.x + CARD_SIZE + 28} y={CARD.y + 100} width={32} height={32} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                <text x={CARD.x + CARD_SIZE + 26} y={CARD.y + 252} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  32 states · 32 × 32 =
                </text>
                <text x={CARD.x + CARD_SIZE + 26} y={CARD.y + 278} fontSize={22} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  {commas(READS_32)}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= B10/B11 · the cost per position, per document ================= */}
        {barsU > 0.005 && barsOp > 0.005 && (
          <g opacity={barsOp}>
            <text x={BAR.x} y={BAR.y0 - 50} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
              operations {docU < 0.5 ? 'per position' : `per ${POSITIONS}-position document`}
            </text>
            <g opacity={clamp01(barsU * 3)}>
              <rect x={BAR.x} y={BAR.y0 - 36} width={12} height={12} fill={colors.ACCENT} />
              <text x={BAR.x + 18} y={BAR.y0 - 26} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>reverse</text>
              <rect x={BAR.x + 96} y={BAR.y0 - 36} width={12} height={12} fill={colors.SECONDARY} />
              <text x={BAR.x + 114} y={BAR.y0 - 26} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>forward</text>
            </g>
            {COSTS.map((c, i) => {
              const u = clamp01(barsU * 3 - i);
              if (u <= 0) return null;
              const y = BAR.y0 + i * BAR.dy;
              const lr = barLen(c.reverse) * u;
              const lf = barLen(c.forward) * u;
              const big = 32 + i * 24;
              return (
                <g key={c.states}>
                  <text x={BAR.x - 110} y={y + 21} textAnchor="end" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>{c.states} states</text>
                  <GridGlyph x={BAR.x - 96} y={y + BAR.h / 2 - big / 2} n={c.states} size={big} opacity={u} />
                  <rect x={BAR.x} y={y} width={lr} height={BAR.h} fill={colors.ACCENT} opacity={0.85} />
                  <rect x={BAR.x + lr} y={y} width={lf} height={BAR.h} fill={colors.SECONDARY} opacity={0.85} />
                  <text x={BAR.x + lr + lf + 12} y={y + 22} fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.TEXT} opacity={u * (1 - docU)}>
                    {commas(c.perPos)}
                  </text>
                  <text x={BAR.x + lr + lf + 12} y={y + 22} fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={u * docU}>
                    {commas(c.perDoc)}
                  </text>
                  <text x={BAR.x} y={y + BAR.h + 18} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={u * (1 - docU)}>
                    {commas(c.reverse)} + {commas(c.forward)}
                  </text>
                  <text x={BAR.x} y={y + BAR.h + 18} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={u * docU}>
                    {POSITIONS} × {commas(c.perPos)} + {c.states} at the start
                  </text>
                </g>
              );
            })}
            <Chip x={BAR.x} y={BAR.y0 + 3 * BAR.dy + 6} size={13} text="whatever the length of the text" color={colors.MUTED} opacity={clamp01(barsU * 3 - 2.4) * (1 - docU)} />
            <Chip x={BAR.x} y={BAR.y0 + 3 * BAR.dy + 6} size={14} text="every value an integer · FP32 exact in any order" color={colors.POSITIVE} opacity={v(scene.fp32U)} />
          </g>
        )}

        {/* ================= B12 · display kinds: the match stays in one run ================= */}
        {jsonU > 0.005 && (
          <g>
            {range(N_B).map((j) => {
              const u = clamp01(jsonU * N_B - j);
              const x = JSTRIP.x0 + j * JSTRIP.pitch;
              const kind = KINDS_B[j];
              const off = kind !== K.string ? maskU : 0;
              const mAll = RUN_B_ALL.marks[j] > 0;
              const mStr = RUN_B_STR.marks[j] > 0;
              const markOp = mStr ? 1 : mAll ? 1 - maskU : 0;
              const ch = TEXT_B[j];
              return (
                <g key={j} opacity={u}>
                  <rect x={x} y={STRIP.y} width={JSTRIP.w} height={STRIP.h} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                  {markOp > 0.005 && <rect x={x} y={STRIP.y} width={JSTRIP.w} height={STRIP.h} rx={5} fill={colors.WARM} opacity={0.4 * markOp} stroke={colors.WARM} strokeWidth={2} />}
                  <text x={x + JSTRIP.w / 2} y={STRIP.y + 29} textAnchor="middle" fontSize={20} fontFamily={MONO} fill={colors.TEXT} opacity={lerp(1, 0.3, off)}>
                    {ch === ' ' ? '␣' : ch}
                  </text>
                  <text x={x + JSTRIP.w / 2} y={STRIP.y + 70} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.NEGATIVE} opacity={off}>
                    -1
                  </text>
                </g>
              );
            })}
            {/* runs */}
            {[
              { lo: 1, hi: 7, name: 'key', kind: K.key, color: colors.SECONDARY },
              { lo: 9, hi: 18, name: 'string', kind: K.string, color: colors.POSITIVE },
            ].map((r) => {
              const off = r.kind !== K.string ? maskU : 0;
              const x1 = JSTRIP.x0 + r.lo * JSTRIP.pitch;
              const x2 = JSTRIP.x0 + r.hi * JSTRIP.pitch + JSTRIP.w;
              return (
                <g key={r.name} opacity={clamp01(jsonU * 2 - 0.6) * lerp(1, 0.35, off)}>
                  <rect x={x1} y={STRIP.y + 50} width={x2 - x1} height={4} rx={2} fill={r.color} />
                  <text x={(x1 + x2) / 2} y={STRIP.y - 12} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={r.color}>
                    {r.name} run
                  </text>
                </g>
              );
            })}
            <text x={JSTRIP.x0} y={STRIP.y + 128} fontSize={15} fontFamily={MONO} fill={colors.WARM} opacity={clamp01(jsonU * 2 - 1)}>
              matches of error: {maskU < 0.5 ? `${RUN_B_ALL.count} · scope everything` : `${RUN_B_STR.count} · scope 'strings'`}
            </text>
            <text x={JSTRIP.x0} y={STRIP.y + 160} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={maskU}>
              searched = searchable[kind] ? codePoint : -1
            </text>
            {v(scene.runNoteU) > 0.005 && (
              <g opacity={v(scene.runNoteU)}>
                <rect x={JSTRIP.x0} y={STRIP.y + 186} width={560} height={50} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.7} />
                <text x={JSTRIP.x0 + 18} y={STRIP.y + 217} fontSize={17} fill={colors.TEXT}>
                  a match stays inside one run · never crosses a key
                </text>
              </g>
            )}
            {maskTileU > 0.005 && (
              <g opacity={maskTileU}>
                <rect x={MASK.x - 16} y={MASK.y - 36} width={292} height={MASK.row * 9 + 50} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={MASK.x} y={MASK.y - 12} fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>searchable[kind]</text>
                {KIND_NAMES.map((name, k) => {
                  const on = lerp(1, k === K.string ? 1 : 0, maskU);
                  const y = MASK.y + k * MASK.row;
                  const hot = k === K.string || k === K.key;
                  return (
                    <g key={name}>
                      <text x={MASK.x} y={y + 16} fontSize={13} fontFamily={MONO} fill={hot ? colors.TEXT : colors.MUTED}>{name}</text>
                      <rect x={MASK.x + 200} y={y + 3} width={18} height={18} rx={3} fill={colors.POSITIVE} fillOpacity={on} stroke={colors.POSITIVE} strokeOpacity={0.6} />
                      <text x={MASK.x + 232} y={y + 16} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>{on > 0.5 ? 1 : 0}</text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        <LensRing x={lens.x} y={lens.y} r={lens.r} opacity={v(scene.lensOp)} />
      </Camera>

      {/* ================= screen-space header: title chip + source chip ================= */}
      <rect x={40} y={18} width={262} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        2 · Search Is a Matrix Product
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
    </>
  );
}

export const vizScene = () => scene;
