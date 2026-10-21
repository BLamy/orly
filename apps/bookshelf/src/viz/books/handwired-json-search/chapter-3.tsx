// Packing the Bits
//
// JSON Search — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/json-search/README.md:631-633 (one search of 100,000 documents, back to back and after a 200 ms pause:
//     7.81 / 68.8 / 945 ms with loop-emit.ts, 4.60 / 4.72 / 5.24 ms with bit-emit.ts, 11.3 / 11.9 / 13.2 after a pause)
//   lab/json-search/README.md:268 (32 states: 4,648 WGSL statements); report.ts `loops` (1,025 table reads at 32
//     states, per the fact-check in docs/book-plans/handwired-json-search/review.md)
//   lab/json-search/README.md:777 (1.7, 15 and 180 times less), 779 (2.4 million match counts and marks in 18
//     searches, 103 million highlighter values, none different), 780 (100 to 10,000 documents: 0.6 to 1.9 ms at any
//     of the three sizes), 782 + 920 (the highlighter gets nothing; its step has no gate over several table reads),
//     901 (no change to the program), 435 (a row of up to 32 states is one word), 162 (back to back vs. after a pause)
//   lab/status.md:116 (October 14, the second code writer)
//   src/json-search/bit-emit.ts:1-11 (same LoopProgram, only how an operation is written; "whole" and bit values are
//     proven from declared ranges; everything else is loop-emit's f32 statement), :35 (relu(a - b) is a & (b ^ 1u)),
//     :47-49 ((word[base] & opens) == 0u)
//   src/json-search/searcher.ts:467-468 (options.writers?.search ?? 'bit-emit', options.writers?.highlighter ??
//     'loop-emit')
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The 4,648 statement ticks are exact in number (56 rows × 83); their arrangement, the bits in
// the two words of the AND, and the proven / not-proven split of the statements are SCHEMATIC (labelled on screen).
// The truth table and the ratio badges are computed below from the identity and the README's medians.
import 'katex/dist/katex.min.css';
import { interpolateRgb } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH13 = 7.8; // mono advance at 13 px
const CH14 = 8.4; // mono advance at 14 px
const LOOP = colors.WARM; // loop-emit.ts, one f32 statement per operation
const BIT = colors.NEGATIVE; // bit-emit.ts, the bit-packing writer

// ---------------------------------------------------------------------------
// The numbers (README.md:268, 631-633, 777-780; bit-emit.ts:35)
// ---------------------------------------------------------------------------

const STATEMENTS_32 = 4648;
const READS_32 = 1025;
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const RUNS = [
  { states: 8, loop: 7.81, bit: 4.6, pause: 11.3 },
  { states: 16, loop: 68.8, bit: 4.72, pause: 11.9 },
  { states: 32, loop: 945, bit: 5.24, pause: 13.2 },
];
const ms = (v: number): string => (v >= 100 ? String(v) : v.toFixed(2).replace(/0$/, '').replace(/\.$/, ''));
const RATIOS = RUNS.map((r) => r.loop / r.bit);
const ratioText = (x: number): string => (x < 10 ? x.toFixed(1) : String(Math.round(x)));
if (RATIOS.map(ratioText).join(' ') !== '1.7 15 180') throw new Error('ratio badges disagree with README.md:777');
const FLOOR: [number, number] = [0.6, 1.9];

// the gate identity, over every pair of bits
const relu = (x: number): number => Math.max(0, x);
const TRUTH = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
].map(([a, b]) => ({ a, b, r: relu(a - b), p: a & (b ^ 1) }));
for (const row of TRUTH) if (row.r !== row.p) throw new Error('relu(a - b) != a & (b ^ 1u)');

// two 32-lane words (bit values schematic) and their AND, lane by lane
const WORD = (() => {
  const rand = mulberry32(1014);
  return Array.from({ length: 32 }, () => (rand() < 0.38 ? 1 : 0));
})();
const OPENS = (() => {
  const rand = mulberry32(2026);
  return Array.from({ length: 32 }, () => (rand() < 0.3 ? 1 : 0));
})();
const AND = WORD.map((w, i) => w & OPENS[i]);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// left: the 32-state shader
const PROG = { x: 70, y: 92, w: 520, h: 44 };
const ROW = { x: 74, pitch: 16, cell: 13, y: 164 };
const WORDR = { x: 170, pitch: 10, w: 9, h: 18, y: 250 };
const STACK_COLS = 83;
const STACK_ROWS = 56;
if (STACK_COLS * STACK_ROWS !== STATEMENTS_32) throw new Error('stack ticks must number 4,648');
const ST = { x: 72, y: 216, dx: 6.25, dy: 4.6, w: 4.4 };
const STACK_BOT = ST.y + STACK_ROWS * ST.dy;
const PROVEN = (() => {
  const rand = mulberry32(116);
  return Array.from({ length: STATEMENTS_32 }, () => rand() < 0.62);
})();
const tick = (c: number, r: number): string => `M${(ST.x + c * ST.dx).toFixed(2)} ${(ST.y + r * ST.dy).toFixed(2)}h${ST.w}`;
const ROW_PATHS = Array.from({ length: STACK_ROWS }, (_, r) => {
  const all: string[] = [];
  const yes: string[] = [];
  const no: string[] = [];
  for (let c = 0; c < STACK_COLS; c++) {
    const d = tick(c, r);
    all.push(d);
    (PROVEN[r * STACK_COLS + c] ? yes : no).push(d);
  }
  return { all, yes: yes.join(''), no: no.join(''), full: all.join('') };
});
const GATE = { x: 330, y: 430 };
const CHIP_LOOP = { x: 80, y: 500 };
const CHIP_BIT = { x: 330, y: 500 };
const ROUTE_BIT = { x: 400, y: 236 };
const ROUTE_LOOP = { x: 400, y: 346 };
const LOOP_LABEL = 'loop-emit.ts';
const BIT_LABEL = 'bit-emit.ts · Oct 14';

// right: the bar race (main chart on one linear scale, an inset at 0–15 ms)
const BASE = 500;
const MAIN = { axis: 690, top: 200, max: 1000, cx: [750, 830, 910] };
const mainY = (v: number): number => BASE - (v / MAIN.max) * (BASE - MAIN.top);
const INS = { x: 970, w: 275, y: 145, h: 440, axis: 1000, top: 230, max: 15, cx: [1050, 1120, 1190] };
const insY = (v: number): number => BASE - (Math.min(v, INS.max) / INS.max) * (BASE - INS.top);
const BAR_W = 24;

// cameras
const HOME: CameraState = CAMERA_HOME;
const CAM_CHART: CameraState = { x: 950, y: 370, k: 1.2 };
const CAM_LEFT: CameraState = { x: 330, y: 330, k: 1.2 };
const CAM_ID: CameraState = { x: 330, y: 340, k: 1.4 };
const CAM_INSET: CameraState = { x: 1060, y: 350, k: 1.15 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ≈156 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CHART, cameraInterp);
  const leftOp = tl.channel('leftOp', 0);
  const chartOp = tl.channel('chartOp', 1);
  // left machine
  const progU = tl.channel('progU', 0);
  const progOp = tl.channel('progOp', 1);
  const sameU = tl.channel('sameTagU', 0);
  const rowU = tl.channel('rowU', 0);
  const rowOp = tl.channel('rowOp', 1);
  const readsLbl = tl.channel('readsLbl', 0);
  const stackU = tl.channel('stackU', 0);
  const stackOp = tl.channel('stackOp', 1);
  const stackLbl = tl.channel('stackLbl', 0);
  const loopChipU = tl.channel('loopChipU', 0);
  const bitChipU = tl.channel('bitChipU', 0);
  const writersOp = tl.channel('writersOp', 1);
  const sweepU = tl.channel('sweepU', 0);
  // the identity
  const idU = tl.channel('idU', 0);
  const idMorph = tl.channel('idMorph', 0);
  const ttU = tl.channel('truthRowsU', 0);
  const idOp = tl.channel('idOp', 1);
  // the word
  const readsU = tl.channel('readLinesU', 0);
  const foldU = tl.channel('foldU', 0);
  const opensU = tl.channel('opensU', 0);
  const andU = tl.channel('andU', 0);
  const eqU = tl.channel('eqChipU', 0);
  const wordOp = tl.channel('wordOp', 1);
  const wordBack = tl.channel('wordBack', 0);
  // proven or not
  const classU = tl.channel('classU', 0);
  const gateTagU = tl.channel('gateTagU', 0);
  // the bar race
  const loopRise = tl.channel('loopRise', 0);
  const insetU = tl.channel('insetU', 0);
  const bitA = tl.channel('bitDrop8and16', 0);
  const bitB = tl.channel('bitDrop32', 0);
  const badgesU = tl.channel('badgesU', 0);
  const barsOp = tl.channel('barsOp', 1);
  const floorU = tl.channel('floorU', 0);
  const ghostU = tl.channel('pauseGhostU', 0);
  const b2bU = tl.channel('backToBackU', 0);
  // the two lanes and the seal
  const routeU = tl.channel('routeU', 0);
  const sealU = tl.channel('sealU', 0);

  // — B1 · the three old bars rise —
  tl.caption({ at: 0.4, dur: 12.0, text: 'The first working search was slow for long patterns. For a hundred thousand documents it took 7.8, 69, and 945 milliseconds at eight, sixteen, and thirty-two states.' });
  tl.tween(loopRise, 1, { at: 1.6, dur: 6.4, ease: ease.linear });
  tl.tween(insetU, 1, { at: 8.6, dur: 0.8, ease: ease.enter });
  tl.hold(12.4, 0.6);

  // — B2 · the 32-state program: 1,025 reads, 4,648 statements —
  tl.caption({ at: 13.0, dur: 13.4, text: 'The reason is the arithmetic from before. At thirty-two states a pass has 1,025 table reads, and the shader holds 4,648 statements, each one a separate 32-bit float operation.' });
  tl.tween(cam, CAM_LEFT, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.tween(chartOp, 0.1, { at: 13.0, dur: 0.8, ease: ease.move });
  tl.tween(leftOp, 1, { at: 13.2, dur: 0.6, ease: ease.enter });
  tl.tween(progU, 1, { at: 13.6, dur: 0.7, ease: ease.enter });
  tl.tween(rowU, 1, { at: 14.6, dur: 1.2, ease: ease.linear });
  tl.tween(readsLbl, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.tween(stackU, 1, { at: 19.6, dur: 3.4, ease: ease.linear });
  tl.tween(stackLbl, 1, { at: 20.0, dur: 0.6, ease: ease.enter });
  tl.tween(loopChipU, 1, { at: 23.4, dur: 0.7, ease: ease.enter });
  tl.hold(26.4, 0.6);

  // — B3 · same program, a second writer —
  tl.caption({ at: 27.0, dur: 13.6, text: 'The fix is not a new program. On October 14 a second code writer, one that packs bits, rewrote only the shader text. The weighted sums and relu gates stayed as they were.' });
  tl.tween(sameU, 1, { at: 27.6, dur: 0.6, ease: ease.pop });
  tl.tween(bitChipU, 1, { at: 30.0, dur: 1.1, ease: ease.move });
  tl.tween(sweepU, 1, { at: 32.4, dur: 3.2, ease: ease.linear });
  tl.tween(sameU, 0.6, { at: 37.0, dur: 0.4, ease: ease.move });
  tl.tween(sameU, 1, { at: 37.4, dur: 0.4, ease: ease.move });
  tl.hold(40.6, 0.6);

  // — B4 · relu(a − b) = a & (b ^ 1u) —
  tl.caption({ at: 41.2, dur: 13.4, text: 'Its key identity: when both inputs are known to be bits, relu of a minus b is just a, AND the flip of b. A subtraction and a clamp become one logic operation.' });
  tl.tween(cam, CAM_ID, { at: 41.2, dur: 1.3, ease: ease.move });
  tl.tween(stackOp, 0.06, { at: 41.2, dur: 0.7, ease: ease.move });
  tl.tween(stackLbl, 0, { at: 41.2, dur: 0.5, ease: ease.move });
  tl.tween(readsLbl, 0, { at: 41.2, dur: 0.5, ease: ease.move });
  tl.tween(writersOp, 0, { at: 41.2, dur: 0.6, ease: ease.move });
  tl.tween(progOp, 0.12, { at: 41.2, dur: 0.6, ease: ease.move });
  tl.tween(sameU, 0, { at: 41.2, dur: 0.5, ease: ease.move });
  tl.tween(rowOp, 0.12, { at: 41.2, dur: 0.6, ease: ease.move });
  tl.tween(idU, 1, { at: 42.2, dur: 0.7, ease: ease.enter });
  tl.tween(idMorph, 1, { at: 45.6, dur: 1.2, ease: ease.move });
  tl.tween(ttU, 1, { at: 48.0, dur: 2.4, ease: ease.linear });
  tl.hold(54.6, 0.6);

  // — B5 · 32 reads of one row fold into one word —
  tl.caption({ at: 55.2, dur: 13.6, text: 'A row of up to thirty-two states fits one 32-bit word. So a gate reading many table entries of the same row becomes one AND of two words, then a test against zero.' });
  tl.tween(idOp, 0, { at: 55.2, dur: 0.6, ease: ease.move });
  tl.tween(rowOp, 1, { at: 55.4, dur: 0.6, ease: ease.enter });
  tl.tween(readsU, 1, { at: 56.0, dur: 1.2, ease: ease.draw });
  tl.tween(foldU, 1, { at: 59.8, dur: 1.4, ease: ease.move });
  tl.tween(opensU, 1, { at: 62.0, dur: 0.7, ease: ease.enter });
  tl.tween(andU, 1, { at: 63.4, dur: 1.0, ease: ease.linear });
  tl.tween(eqU, 1, { at: 65.0, dur: 0.7, ease: ease.enter });
  tl.hold(68.8, 0.6);

  // — B6 · only where ranges prove whole numbers or bits —
  tl.caption({ at: 69.4, dur: 11.8, text: 'The writer only does this where the declared ranges prove a value is a whole number or a bit. Everywhere else it falls back to the same float statements.' });
  tl.tween(cam, CAM_LEFT, { at: 69.4, dur: 1.3, ease: ease.move });
  tl.tween(wordOp, 0, { at: 69.4, dur: 0.6, ease: ease.move });
  tl.tween(wordBack, 1, { at: 69.8, dur: 1.1, ease: ease.move });
  tl.tween(stackOp, 1, { at: 70.4, dur: 0.7, ease: ease.enter });
  tl.tween(gateTagU, 1, { at: 71.2, dur: 0.6, ease: ease.enter });
  tl.tween(classU, 1, { at: 72.6, dur: 1.6, ease: ease.move });
  tl.hold(81.2, 0.6);

  // — B7 · 4.60 and 4.72 beside 7.81 and 68.8 —
  tl.caption({ at: 81.8, dur: 12.6, text: 'At eight states the search went from 7.81 to 4.60 milliseconds, and at sixteen from 68.8 to 4.72, back to back, for a hundred thousand documents.' });
  tl.tween(cam, CAM_CHART, { at: 81.8, dur: 1.4, ease: ease.move });
  tl.tween(leftOp, 0.1, { at: 81.8, dur: 0.8, ease: ease.move });
  tl.tween(chartOp, 1, { at: 82.0, dur: 0.8, ease: ease.enter });
  tl.tween(bitA, 1, { at: 84.6, dur: 3.0, ease: ease.linear });
  tl.hold(94.4, 0.6);

  // — B8 · 945 → 5.24, and the three ratios —
  tl.caption({ at: 95.0, dur: 11.0, text: 'At thirty-two states it went from 945 to 5.24 milliseconds. That is 1.7, 15, and 180 times less, with no change to the program.' });
  tl.tween(bitB, 1, { at: 95.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_INSET, { at: 99.0, dur: 1.3, ease: ease.move });
  tl.tween(badgesU, 1, { at: 99.8, dur: 1.6, ease: ease.linear });
  tl.hold(106.0, 0.6);

  // — B9 · the floor: 0.6–1.9 ms at every size —
  tl.caption({ at: 106.6, dur: 11.8, text: "So the search no longer slows with the pattern's size. A hundred to ten thousand documents take 0.6 to 1.9 milliseconds at any of the three sizes." });
  tl.tween(barsOp, 0.15, { at: 106.6, dur: 0.7, ease: ease.move });
  tl.tween(badgesU, 0, { at: 106.6, dur: 0.5, ease: ease.move });
  tl.tween(floorU, 1, { at: 107.6, dur: 1.4, ease: ease.draw });
  tl.hold(118.4, 0.6);

  // — B10 · back to back; the pause is next chapter —
  tl.caption({ at: 119.0, dur: 11.6, text: 'Those are back-to-back times, where each search starts as soon as the last answer arrives. Searching after a pause is a different, slower number, in the next chapter.' });
  tl.tween(floorU, 0, { at: 119.0, dur: 0.6, ease: ease.move });
  tl.tween(barsOp, 1, { at: 119.0, dur: 0.7, ease: ease.enter });
  tl.tween(b2bU, 1, { at: 119.6, dur: 0.6, ease: ease.pop });
  tl.tween(ghostU, 1, { at: 124.4, dur: 1.2, ease: ease.enter });
  tl.hold(130.6, 0.6);

  // — B11 · two writers, two lanes —
  tl.caption({ at: 131.2, dur: 10.4, text: 'The highlighter got nothing from the second writer, so the searcher still uses the first writer for it and the bit writer only for search.' });
  tl.tween(cam, CAM_LEFT, { at: 131.2, dur: 1.4, ease: ease.move });
  tl.tween(chartOp, 0.1, { at: 131.2, dur: 0.8, ease: ease.move });
  tl.tween(leftOp, 1, { at: 131.4, dur: 0.8, ease: ease.enter });
  tl.tween(stackOp, 0.08, { at: 131.4, dur: 0.6, ease: ease.move });
  tl.tween(gateTagU, 0, { at: 131.4, dur: 0.5, ease: ease.move });
  tl.tween(rowOp, 0.1, { at: 131.4, dur: 0.6, ease: ease.move });
  tl.tween(writersOp, 1, { at: 132.4, dur: 0.6, ease: ease.enter });
  tl.tween(routeU, 1, { at: 132.6, dur: 1.4, ease: ease.move });
  tl.hold(141.6, 0.6);

  // — B12 · the seal —
  tl.caption({ at: 142.2, dur: 12.4, text: 'Both writers give the same answers. 2.4 million match counts and marks across 18 searches agreed, with no differences, and so did 103 million highlighter values.' });
  tl.tween(cam, HOME, { at: 142.2, dur: 1.5, ease: ease.move });
  tl.tween(leftOp, 0.1, { at: 142.4, dur: 0.8, ease: ease.move });
  tl.tween(sealU, 1, { at: 143.4, dur: 0.8, ease: ease.pop });
  tl.hold(154.6, 1.4);

  return {
    tl, cam, leftOp, chartOp, progU, progOp, sameU, rowU, rowOp, readsLbl, stackU, stackOp, stackLbl, loopChipU,
    bitChipU, writersOp, sweepU, idU, idMorph, ttU, idOp, readsU, foldU, opensU, andU, eqU, wordOp, wordBack,
    classU, gateTagU, loopRise, insetU, bitA, bitB, badgesU, barsOp, floorU, ghostU, b2bU, routeU, sealU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const AMBER_TO_YES = interpolateRgb(LOOP, colors.POSITIVE);
const AMBER_TO_NO = interpolateRgb(LOOP, '#64748b');

function Chip({ x, y, text, color, size = 14, opacity = 1 }: { x: number; y: number; text: string; color: string; size?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const w = text.length * (size === 13 ? CH13 : CH14) + 24;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={34} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text x={x + 12} y={y + 22} fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

/** a short vertical arrow tip pointing up at (x, y) */
const upTip = (x: number, y: number): string => `M ${x - 5} ${y + 8} L ${x} ${y} L ${x + 5} ${y + 8}`;

function Bar({ x, top, color, op = 1, clipped = false }: { x: number; top: number; color: string; op?: number; clipped?: boolean }) {
  const h = BASE - top;
  if (h <= 0.05) return null;
  return (
    <g opacity={op}>
      <rect x={x} y={top} width={BAR_W} height={h} fill={color} fillOpacity={0.85} />
      {clipped && (
        <path d={`M ${x - 2} ${top + 4} l 7 -5 l 7 5 l 7 -5 l 7 5`} fill="none" stroke={colors.BG} strokeWidth={3} />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const leftOp = v(scene.leftOp);
  const chartOp = v(scene.chartOp);

  // ---- left machine
  const progOp = v(scene.progU) * v(scene.progOp);
  const sameU = v(scene.sameU);
  const rowU = v(scene.rowU);
  const rowOp = v(scene.rowOp);
  const fold = v(scene.foldU);
  const back = v(scene.wordBack);
  const stackU = v(scene.stackU);
  const stackOp = v(scene.stackOp);
  const count = Math.round(stackU * STATEMENTS_32);
  const fullRows = Math.floor(count / STACK_COLS);
  const partial = count - fullRows * STACK_COLS;
  const classU = v(scene.classU);
  const sweep = v(scene.sweepU);
  const sweepOn = sweep > 0 && sweep < 1;
  const writersOp = v(scene.writersOp);
  const routeU = v(scene.routeU);
  const loopChipOp = v(scene.loopChipU) * writersOp;
  const bitChipU = v(scene.bitChipU);
  const bitChipOp = bitChipU * writersOp;
  const loopPos = { x: lerp(CHIP_LOOP.x, ROUTE_LOOP.x, routeU), y: lerp(CHIP_LOOP.y, ROUTE_LOOP.y, routeU) };
  const bitPos = {
    x: lerp(lerp(CHIP_BIT.x + 260, CHIP_BIT.x, bitChipU), ROUTE_BIT.x, routeU),
    y: lerp(CHIP_BIT.y, ROUTE_BIT.y, routeU),
  };
  const idOp = v(scene.idU) * v(scene.idOp);
  const idMorph = v(scene.idMorph);
  const ttU = v(scene.ttU);
  const readsU = v(scene.readsU);
  const wordOp = v(scene.wordOp);
  const opensU = v(scene.opensU) * wordOp;
  const andU = v(scene.andU);
  const eqU = v(scene.eqU) * wordOp;

  // a state cell's place: the spread row (B2), the word (B5), the word back on the row's line (B6 on)
  const cellAt = (i: number) => {
    const wx = WORDR.x + i * WORDR.pitch;
    const wy = lerp(WORDR.y, ROW.y, back);
    return {
      x: lerp(ROW.x + i * ROW.pitch, wx, fold),
      y: lerp(ROW.y, wy, fold),
      w: lerp(ROW.cell, WORDR.w, fold),
      h: lerp(ROW.cell, WORDR.h, fold),
    };
  };
  const wordY = lerp(WORDR.y, ROW.y, back);

  // ---- chart
  const loopRise = v(scene.loopRise);
  const insetOp = v(scene.insetU);
  const bitA = v(scene.bitA);
  const bitB = v(scene.bitB);
  const barsOp = v(scene.barsOp);
  const badgesU = v(scene.badgesU);
  const floorU = v(scene.floorU);
  const ghostU = v(scene.ghostU);
  const b2bU = v(scene.b2bU);
  const bitGrow = (i: number): number => (i < 2 ? staggerU(bitA, i, 2, 0.5, 0.5) : bitB);
  const loopGrow = (i: number): number => staggerU(loopRise, i, 3, 0.4, 0.33);
  const sealU = v(scene.sealU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="hjs3-inset-clip">
          <rect x={INS.x} y={INS.y} width={INS.w} height={INS.h} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= LEFT · the 32-state shader ================= */}
        {leftOp > 0.005 && (
          <g opacity={leftOp}>
            {/* the program: sums, relu gates, table reads */}
            {progOp > 0.005 && (
              <g opacity={progOp}>
                <rect x={PROG.x} y={PROG.y} width={PROG.w} height={PROG.h} rx={10} fill={colors.PANEL} stroke={sameU > 0.01 ? colors.POSITIVE : colors.GRID} strokeWidth={1.5} />
                <text x={PROG.x + 14} y={PROG.y + 27} fontSize={15} fill={colors.TEXT}>
                  the program, 32 states
                </text>
                <text x={300} y={PROG.y + 29} fontSize={20} fill={colors.ACCENT}>
                  Σ
                </text>
                <text x={318} y={PROG.y + 27} fontSize={13} fill={colors.MUTED}>
                  sums
                </text>
                <path d={`M 372 ${PROG.y + 30} L 386 ${PROG.y + 30} L 400 ${PROG.y + 14}`} fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
                <text x={408} y={PROG.y + 27} fontSize={13} fill={colors.MUTED}>
                  relu gates
                </text>
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={486 + k * 9} y={PROG.y + 15} width={8} height={14} fill={k === 1 ? colors.TEAL : 'none'} stroke={colors.TEAL} strokeWidth={1} />
                ))}
                <text x={520} y={PROG.y + 27} fontSize={13} fill={colors.MUTED}>
                  reads
                </text>
              </g>
            )}
            {sameU > 0.005 && (
              <g opacity={sameU}>
                <rect x={452} y={64} width={138} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                <text x={521} y={81} textAnchor="middle" fontSize={14} fill={colors.POSITIVE}>
                  same program
                </text>
              </g>
            )}

            {/* the row of 32 states — folds into one u32 word */}
            {rowU > 0.005 && (
              <g opacity={rowOp}>
                {fold < 0.5 ? (
                  <text x={ROW.x} y={ROW.y - 9} fontSize={13} fill={colors.MUTED} opacity={(1 - fold * 2) * clamp01(rowU * 3)}>
                    one table row: 32 states, each read on its own
                  </text>
                ) : (
                  <text x={WORDR.x - 10} y={wordY + 13} textAnchor="end" fontSize={14} fontFamily={MONO} fill={BIT} opacity={(fold - 0.5) * 2}>
                    word[base]
                  </text>
                )}
                {fold > 0.02 && (
                  <rect x={WORDR.x - 4} y={wordY - 4} width={32 * WORDR.pitch + 7} height={WORDR.h + 8} rx={5} fill="none" stroke={BIT} strokeWidth={1.6} opacity={fold} />
                )}
                {fold > 0.5 && (
                  <text x={WORDR.x + 32 * WORDR.pitch + 12} y={wordY + 14} fontSize={13} fill={colors.MUTED} opacity={(fold - 0.5) * 2}>
                    one u32
                  </text>
                )}
                {Array.from({ length: 32 }, (_, i) => {
                  const u = staggerU(rowU, i, 32, 0.03, 0.25);
                  if (u <= 0) return null;
                  const c = cellAt(i);
                  const lit = WORD[i] === 1;
                  return (
                    <rect
                      key={i}
                      x={c.x}
                      y={c.y + (1 - u) * 8}
                      width={c.w}
                      height={c.h}
                      rx={2}
                      opacity={u}
                      fill={fold > 0.5 && lit ? BIT : colors.PANEL}
                      fillOpacity={fold > 0.5 && lit ? (fold - 0.5) * 2 * 0.85 : 1}
                      stroke={fold > 0.5 ? BIT : LOOP}
                      strokeWidth={1.2}
                    />
                  );
                })}
              </g>
            )}

            {/* B2 labels */}
            {v(scene.stackLbl) > 0.005 && (
              <text x={ST.x} y={204} fontSize={14} fill={colors.TEXT} opacity={v(scene.stackLbl)}>
                {commas(count)} WGSL statements · one f32 op each
              </text>
            )}
            {v(scene.readsLbl) > 0.005 && (
              <text x={590} y={204} textAnchor="end" fontSize={14} fontFamily={MONO} fill={LOOP} opacity={v(scene.readsLbl)}>
                {commas(READS_32)} table reads
              </text>
            )}

            {/* the statement stack: 4,648 ticks (arrangement schematic) */}
            {count > 0 && stackOp > 0.005 && (
              <g opacity={stackOp}>
                {classU > 0.005 ? (
                  <>
                    <path d={ROW_PATHS.slice(0, fullRows).map((r) => r.yes).join('')} stroke={AMBER_TO_YES(classU)} strokeWidth={3} />
                    <path d={ROW_PATHS.slice(0, fullRows).map((r) => r.no).join('')} stroke={AMBER_TO_NO(classU)} strokeWidth={3} />
                  </>
                ) : (
                  <path d={ROW_PATHS.slice(0, fullRows).map((r) => r.full).join('')} stroke={LOOP} strokeOpacity={0.75} strokeWidth={3} />
                )}
                {partial > 0 && fullRows < STACK_ROWS && (
                  <path d={ROW_PATHS[fullRows].all.slice(0, partial).join('')} stroke={LOOP} strokeOpacity={0.75} strokeWidth={3} />
                )}
                {sweepOn && (
                  <g>
                    <rect x={ST.x - 4} y={ST.y - 3} width={STACK_COLS * ST.dx + 4} height={(STACK_BOT - ST.y) * sweep} fill={BIT} fillOpacity={0.14} />
                    <line x1={ST.x - 6} x2={ST.x + STACK_COLS * ST.dx + 2} y1={lerp(ST.y - 3, STACK_BOT, sweep)} y2={lerp(ST.y - 3, STACK_BOT, sweep)} stroke={BIT} strokeWidth={2.5} />
                  </g>
                )}
              </g>
            )}

            {/* B6: the proof gate and its two outcomes */}
            {v(scene.gateTagU) > 0.005 && (
              <g opacity={v(scene.gateTagU)}>
                <rect x={110} y={186} width={440} height={26} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                <text x={330} y={204} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                  do the declared ranges prove a whole number or a bit?
                </text>
                <g opacity={clamp01(classU * 1.5)}>
                  <rect x={ST.x} y={STACK_BOT + 14} width={12} height={12} rx={2} fill={colors.POSITIVE} />
                  <text x={ST.x + 20} y={STACK_BOT + 25} fontSize={14} fill={colors.TEXT}>
                    yes: an integer or bit statement
                  </text>
                  <rect x={ST.x} y={STACK_BOT + 38} width={12} height={12} rx={2} fill="#64748b" />
                  <text x={ST.x + 20} y={STACK_BOT + 49} fontSize={14} fill={colors.TEXT}>
                    no: the same f32 statement
                  </text>
                  <text x={590} y={STACK_BOT + 49} textAnchor="end" fontSize={12} fill={colors.MUTED}>
                    split schematic
                  </text>
                </g>
              </g>
            )}

            {/* B4 · the identity */}
            {idOp > 0.005 && (
              <g opacity={idOp}>
                <text x={330} y={232} textAnchor="middle" fontSize={14} fill={colors.MUTED}>
                  when a and b are known to be bits
                </text>
                <MathLabel tex={'\\mathrm{relu}(a-b)'} x={lerp(330, 205, idMorph)} y={268} fontSize={28} boxWidth={240} color={LOOP} />
                {idMorph > 0.01 && (
                  <>
                    <text x={318} y={276} textAnchor="middle" fontSize={26} fill={colors.TEXT} opacity={idMorph}>
                      =
                    </text>
                    <text x={lerp(470, 445, idMorph)} y={276} textAnchor="middle" fontSize={24} fontFamily={MONO} fill={BIT} opacity={idMorph}>
                      a &amp; (b ^ 1u)
                    </text>
                  </>
                )}
                {ttU > 0.005 && (
                  <g>
                    {['a', 'b', 'relu(a − b)', 'a & (b ^ 1u)'].map((h, k) => (
                      <text key={h} x={[150, 210, 320, 460][k]} y={322} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={k === 2 ? LOOP : k === 3 ? BIT : colors.MUTED} opacity={clamp01(ttU * 4)}>
                        {h}
                      </text>
                    ))}
                    <line x1={120} x2={560} y1={332} y2={332} stroke={colors.GRID} strokeWidth={1} opacity={clamp01(ttU * 4)} />
                    {TRUTH.map((row, i) => {
                      const u = staggerU(ttU, i, 4, 0.35, 0.4);
                      if (u <= 0) return null;
                      const y = 358 + i * 28;
                      return (
                        <g key={i} opacity={u}>
                          {[row.a, row.b, row.r, row.p].map((val, k) => (
                            <text key={k} x={[150, 210, 320, 460][k]} y={y} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={k === 3 ? BIT : k === 2 ? LOOP : colors.TEXT}>
                              {val}
                            </text>
                          ))}
                          <text x={540} y={y} textAnchor="middle" fontSize={16} fill={colors.POSITIVE}>
                            ✓
                          </text>
                        </g>
                      );
                    })}
                    <text x={330} y={480} textAnchor="middle" fontSize={15} fill={colors.TEXT} opacity={staggerU(ttU, 3, 4, 0.35, 0.4)}>
                      a subtraction and a clamp → one logic operation
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* B5 · 32 reads of one row → one AND of two words, then == 0u */}
            {readsU > 0.005 && wordOp > 0.005 && (
              <g opacity={wordOp}>
                <g opacity={readsU * (1 - fold)}>
                  {Array.from({ length: 32 }, (_, i) => {
                    const c = cellAt(i);
                    const x0 = c.x + c.w / 2;
                    const y0 = c.y + c.h + 2;
                    const u = staggerU(readsU, i, 32, 0.02, 0.4);
                    return <line key={i} x1={x0} y1={y0} x2={lerp(x0, GATE.x, u)} y2={lerp(y0, GATE.y - 16, u)} stroke={LOOP} strokeWidth={1.1} strokeOpacity={0.7} />;
                  })}
                  <circle cx={GATE.x} cy={GATE.y} r={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
                  <path d={`M ${GATE.x - 9} ${GATE.y + 5} L ${GATE.x} ${GATE.y + 5} L ${GATE.x + 8} ${GATE.y - 6}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2.4} />
                  <text x={GATE.x} y={GATE.y + 40} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                    one gate, 32 table reads of one row
                  </text>
                </g>
                {fold > 0.6 && (
                  <text x={330} y={wordY - 12} textAnchor="middle" fontSize={12} fill={colors.MUTED} opacity={(fold - 0.6) * 2.5 * (1 - back)}>
                    bit values schematic
                  </text>
                )}
                {opensU > 0.005 && (
                  <g opacity={opensU}>
                    <text x={WORDR.x - 10} y={303} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.TEAL}>
                      opens
                    </text>
                    <rect x={WORDR.x - 4} y={286} width={32 * WORDR.pitch + 7} height={WORDR.h + 8} rx={5} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
                    {OPENS.map((b, i) => (
                      <rect key={i} x={WORDR.x + i * WORDR.pitch} y={290} width={WORDR.w} height={WORDR.h} rx={2} fill={b ? colors.TEAL : colors.PANEL} fillOpacity={b ? 0.85 : 1} stroke={colors.TEAL} strokeWidth={1} />
                    ))}
                  </g>
                )}
                {andU > 0.005 && (
                  <g opacity={wordOp}>
                    <text x={WORDR.x - 10} y={343} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                      AND
                    </text>
                    <line x1={WORDR.x - 4} x2={WORDR.x + 32 * WORDR.pitch + 3} y1={319} y2={319} stroke={colors.MUTED} strokeWidth={1} />
                    {AND.map((b, i) => {
                      const u = staggerU(andU, i, 32, 0.02, 0.3);
                      return (
                        <rect key={i} x={WORDR.x + i * WORDR.pitch} y={330} width={WORDR.w} height={WORDR.h} rx={2} opacity={u} fill={b ? colors.WARM : colors.PANEL} stroke={b ? colors.WARM : colors.GRID} strokeWidth={1} />
                      );
                    })}
                    <path d={`M ${GATE.x} 356 L ${GATE.x} 384`} stroke={colors.MUTED} strokeWidth={1.5} opacity={eqU} />
                    <path d={`M ${GATE.x - 5} 377 L ${GATE.x} 385 L ${GATE.x + 5} 377`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} opacity={eqU} />
                  </g>
                )}
                {eqU > 0.005 && (
                  <g opacity={eqU}>
                    <rect x={185} y={392} width={290} height={40} rx={10} fill={colors.PANEL} stroke={BIT} strokeWidth={1.8} />
                    <text x={330} y={418} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={BIT}>
                      (word[base] &amp; opens) == 0u
                    </text>
                    <text x={330} y={460} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                      one AND of two words, then a test against zero
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* writers: under the stack (B2–B3), then the searcher's two lanes (B11) */}
            {loopChipOp > 0.005 && routeU < 0.02 && (
              <g opacity={loopChipOp}>
                <line x1={CHIP_LOOP.x + 60} x2={CHIP_LOOP.x + 60} y1={CHIP_LOOP.y - 4} y2={STACK_BOT + 6} stroke={LOOP} strokeWidth={1.5} />
                <path d={upTip(CHIP_LOOP.x + 60, STACK_BOT + 6)} fill="none" stroke={LOOP} strokeWidth={1.5} />
              </g>
            )}
            {bitChipOp > 0.005 && routeU < 0.02 && bitChipU > 0.9 && (
              <g opacity={bitChipOp * clamp01((bitChipU - 0.9) * 10)}>
                <line x1={CHIP_BIT.x + 90} x2={CHIP_BIT.x + 90} y1={CHIP_BIT.y - 4} y2={STACK_BOT + 6} stroke={BIT} strokeWidth={1.5} />
                <path d={upTip(CHIP_BIT.x + 90, STACK_BOT + 6)} fill="none" stroke={BIT} strokeWidth={1.5} />
              </g>
            )}
            {routeU > 0.005 && (
              <g opacity={routeU}>
                <text x={90} y={206} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                  searcher.ts
                </text>
                <text x={90} y={258} fontSize={16} fill={colors.TEXT}>
                  search
                </text>
                <line x1={160} x2={ROUTE_BIT.x - 8} y1={253} y2={253} stroke={BIT} strokeWidth={1.8} />
                <path d={`M ${ROUTE_BIT.x - 16} 247 L ${ROUTE_BIT.x - 8} 253 L ${ROUTE_BIT.x - 16} 259`} fill="none" stroke={BIT} strokeWidth={1.8} />
                <text x={90} y={294} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  options.writers?.search ?? &apos;bit-emit&apos;
                </text>
                <text x={90} y={368} fontSize={16} fill={colors.TEXT}>
                  highlighter
                </text>
                <line x1={196} x2={ROUTE_LOOP.x - 8} y1={363} y2={363} stroke={LOOP} strokeWidth={1.8} />
                <path d={`M ${ROUTE_LOOP.x - 16} 357 L ${ROUTE_LOOP.x - 8} 363 L ${ROUTE_LOOP.x - 16} 369`} fill="none" stroke={LOOP} strokeWidth={1.8} />
                <text x={90} y={404} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  options.writers?.highlighter ?? &apos;loop-emit&apos;
                </text>
                <text x={90} y={446} fontSize={13} fill={colors.MUTED}>
                  the highlighter&apos;s step has no gate over several table reads
                </text>
              </g>
            )}
            <Chip x={loopPos.x} y={loopPos.y} text={LOOP_LABEL} color={LOOP} opacity={loopChipOp} />
            <Chip x={bitPos.x} y={bitPos.y} text={BIT_LABEL} color={BIT} opacity={bitChipOp} />
            {loopChipOp > 0.005 && routeU < 0.02 && (
              <text x={CHIP_LOOP.x + 160} y={CHIP_LOOP.y + 22} fontSize={13} fill={colors.MUTED} opacity={loopChipOp * (1 - bitChipU)}>
                writes every operation as f32
              </text>
            )}
          </g>
        )}

        {/* ================= RIGHT · the bar race ================= */}
        {chartOp > 0.005 && (
          <g opacity={chartOp}>
            <text x={670} y={100} fontSize={15} fill={colors.TEXT}>
              one search, 100,000 documents, back to back, ms
            </text>
            <rect x={670} y={114} width={12} height={12} rx={2} fill={LOOP} />
            <text x={688} y={125} fontSize={13} fontFamily={MONO} fill={LOOP}>
              loop-emit.ts
            </text>
            {bitA > 0.005 && (
              <g opacity={clamp01(bitA * 3)}>
                <rect x={800} y={114} width={12} height={12} rx={2} fill={BIT} />
                <text x={818} y={125} fontSize={13} fontFamily={MONO} fill={BIT}>
                  bit-emit.ts
                </text>
              </g>
            )}

            {/* main chart: one linear scale, 0–1,000 ms */}
            <g opacity={barsOp}>
              <line x1={MAIN.axis} x2={MAIN.axis} y1={MAIN.top} y2={BASE} stroke={colors.GRID} strokeWidth={1.2} />
              <line x1={MAIN.axis} x2={950} y1={BASE} y2={BASE} stroke={colors.MUTED} strokeWidth={1.2} />
              {[0, 500, 1000].map((t) => (
                <text key={t} x={MAIN.axis - 6} y={mainY(t) + 4} textAnchor="end" fontSize={12} fill={colors.MUTED}>
                  {t}
                </text>
              ))}
              {RUNS.map((r, i) => {
                const lu = loopGrow(i);
                const bu = bitGrow(i);
                const cx = MAIN.cx[i];
                const lTop = mainY(r.loop * lu);
                return (
                  <g key={r.states}>
                    <Bar x={cx - 25} top={lTop} color={LOOP} />
                    <Bar x={cx + 1} top={Math.min(mainY(r.bit * bu), BASE - 1.5 * bu)} color={BIT} />
                    {lu > 0.98 && (
                      <text x={cx - 13} y={lTop - 7} textAnchor="middle" fontSize={i === 2 ? 15 : 12} fontFamily={MONO} fill={LOOP}>
                        {ms(r.loop)}
                      </text>
                    )}
                    {i === 2 && bu > 0.98 && (
                      <text x={cx + 13} y={BASE - 14} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={BIT}>
                        {ms(r.bit)}
                      </text>
                    )}
                    <text x={cx} y={BASE + 22} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                      {r.states}
                    </text>
                  </g>
                );
              })}
              <text x={MAIN.cx[1]} y={BASE + 42} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                states
              </text>
            </g>

            {/* inset: the same bars, 0–15 ms */}
            {insetOp > 0.005 && (
              <g opacity={insetOp}>
                <rect x={INS.x} y={INS.y} width={INS.w} height={INS.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
                <text x={INS.x + 14} y={INS.y + 23} fontSize={13} fill={colors.MUTED}>
                  the same bars, 0 to 15 ms
                </text>
                <g clipPath="url(#hjs3-inset-clip)">
                  <g opacity={barsOp}>
                    <line x1={INS.axis} x2={INS.axis} y1={INS.top} y2={BASE} stroke={colors.GRID} strokeWidth={1.2} />
                    <line x1={INS.axis} x2={INS.x + INS.w - 12} y1={BASE} y2={BASE} stroke={colors.MUTED} strokeWidth={1.2} />
                    {floorU < 0.05 &&
                      [0, 5, 10, 15].map((t) => (
                        <text key={t} x={INS.axis - 5} y={insY(t) + 4} textAnchor="end" fontSize={12} fill={colors.MUTED}>
                          {t}
                        </text>
                      ))}
                    {RUNS.map((r, i) => {
                      const lu = loopGrow(i);
                      const bu = bitGrow(i);
                      const cx = INS.cx[i];
                      const lv = r.loop * lu;
                      const bv = r.bit * bu;
                      const clipped = lv > INS.max;
                      return (
                        <g key={r.states}>
                          <Bar x={cx - 25} top={insY(lv)} color={LOOP} clipped={clipped} />
                          <Bar x={cx + 1} top={insY(bv)} color={BIT} op={1} />
                          {lu > 0.98 && (
                            <text x={cx - 13} y={insY(lv) - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={LOOP}>
                              {ms(r.loop)}
                            </text>
                          )}
                          {bu > 0.98 && (
                            <text x={cx + 13} y={insY(bv) - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={BIT}>
                              {ms(r.bit)}
                            </text>
                          )}
                          <text x={cx} y={BASE + 20} textAnchor="middle" fontSize={13} fill={colors.TEXT}>
                            {r.states}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* the ratio badges */}
                  {badgesU > 0.005 &&
                    RUNS.map((r, i) => {
                      const u = staggerU(badgesU, i, 3, 0.4, 0.5);
                      if (u <= 0.005) return null;
                      const cx = INS.cx[i];
                      return (
                        <g key={r.states} opacity={u}>
                          <rect x={cx - 27} y={INS.y + 37} width={54} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                          <text x={cx} y={INS.y + 54} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.POSITIVE}>
                            {ratioText(RATIOS[i])}×
                          </text>
                        </g>
                      );
                    })}

                  {/* B10: the after-a-pause ghosts */}
                  {ghostU > 0.005 &&
                    RUNS.map((r, i) => {
                      const cx = INS.cx[i];
                      const top = insY(r.pause);
                      return (
                        <g key={r.states} opacity={ghostU * 0.75}>
                          <rect x={cx + 1} y={top} width={BAR_W} height={insY(r.bit) - top} fill="none" stroke={BIT} strokeWidth={1.4} strokeDasharray="4 3" />
                          <text x={cx + 13} y={top - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                            {ms(r.pause)}
                          </text>
                        </g>
                      );
                    })}

                  {/* B9: the floor */}
                  {floorU > 0.005 && (
                    <g>
                      <rect x={INS.axis} y={insY(FLOOR[1])} width={(INS.x + INS.w - 12 - INS.axis) * floorU} height={insY(FLOOR[0]) - insY(FLOOR[1])} fill={colors.POSITIVE} fillOpacity={0.3} />
                      <line x1={INS.axis} x2={INS.axis + (INS.x + INS.w - 12 - INS.axis) * floorU} y1={insY(FLOOR[1])} y2={insY(FLOOR[1])} stroke={colors.POSITIVE} strokeWidth={2} />
                      <line x1={INS.axis} x2={INS.axis + (INS.x + INS.w - 12 - INS.axis) * floorU} y1={insY(FLOOR[0])} y2={insY(FLOOR[0])} stroke={colors.POSITIVE} strokeWidth={2} />
                      <g opacity={clamp01((floorU - 0.6) * 2.5)}>
                        <text x={INS.x + INS.w / 2} y={INS.y + INS.h - 30} textAnchor="middle" fontSize={13} fill={colors.TEXT}>
                          100 to 10,000 documents:
                        </text>
                        <text x={INS.x + INS.w / 2} y={INS.y + INS.h - 12} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
                          0.6–1.9 ms at every size
                        </text>
                      </g>
                    </g>
                  )}

                  {/* B10: the caveat */}
                  {b2bU > 0.005 && (
                    <g opacity={b2bU}>
                      <text x={INS.x + 14} y={INS.y + INS.h - 30} fontSize={13} fill={colors.TEXT}>
                        solid: back to back
                      </text>
                      {ghostU > 0.005 && (
                        <text x={INS.x + 14} y={INS.y + INS.h - 12} fontSize={12} fill={colors.MUTED} opacity={ghostU}>
                          dashed: after a pause, next chapter
                        </text>
                      )}
                    </g>
                  )}
                </g>
              </g>
            )}
          </g>
        )}

        {/* ================= B12 · the seal ================= */}
        {sealU > 0.005 && (
          <g opacity={clamp01(sealU)} transform={`translate(640, 330) scale(${lerp(0.9, 1, clamp01(sealU))}) translate(-640, -330)`}>
            <rect x={330} y={215} width={620} height={230} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={640} y={258} textAnchor="middle" fontSize={17} fill={colors.MUTED}>
              <tspan fill={LOOP} fontFamily={MONO}>loop-emit.ts</tspan> and <tspan fill={BIT} fontFamily={MONO}>bit-emit.ts</tspan>, value by value
            </text>
            <text x={640} y={322} textAnchor="middle" fontSize={46} fill={colors.POSITIVE}>
              0 different
            </text>
            <text x={640} y={372} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
              2.4 million match counts and marks · 18 searches
            </text>
            <text x={640} y={404} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
              103 million highlighter values
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={196} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        3 · Packing the Bits
      </text>
    </>
  );
}

export const vizScene = () => scene;
