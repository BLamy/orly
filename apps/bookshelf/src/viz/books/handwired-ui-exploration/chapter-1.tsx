// Count, Don't Search
//
// UI Exploration — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/ui-exploration/README.md:5 (one night, September 2026; JS only records inputs and projects outputs),
//     49-52 (count instead of search when a predicate flips once), 72 (list 280 / 19, 20,305 with row data in
//     source cells), 80 (text flow 14,760 / 215), 94 (line walks are still sequential scans)
//   lab/ui-exploration/lists/list.ts:20-26 (slotCount 24, scrollGrid 4: JS floors scrollTop to 1/4 px),
//     68-72 (first = floor(scrollTop / rowHeight), offset = first mod slotCount), 86-91 (slot row, the visible
//     bit), list-demo.ts:7, 43, 77 (10,000 rows of 40 px; the quarter-pixel floor)
//   lab/ui-exploration/lists/README.md:82-84 (uniform, row data in JS: 280 operations, 19 layers at 1,000,
//     10,000 and 100,000 rows; row data through one-hot at 10,000 rows: 10,002 source cells, 20,305 operations)
//   lab/ui-exploration/text-walker/fast-walker.ts:6-24 (T[j], paintEnd, fits(o) monotone, next(s), width(s))
//   lab/ui-exploration/text-walker/fake-canvas.ts:26-41 (fakeTextWidth), 122 (lineFitEpsilon 0.005)
//   lab/ui-exploration/text-walker/README.md:164 (48 words, 95 segments, 18 bands, 96 springs, 14,760, 215)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). The review's corrections are applied: the scroll position is FLOORED to 1/4 px, and the
// 280 / 19 counter says "uniform row heights, row data kept in JS".
//
// Worked examples (computed below from the lab's own formulas):
//   - the list: 10,000 rows of 40 px, 24 slots, viewport 600 px (the lists README's checked height), and an example
//     raw scrollTop of 168437.33 (any value works; this one shows the quarter-pixel floor and a slot wrap).
//   - the paragraph: "the quick brown fox jumps over a lazy dog" measured with the lab's fakeTextWidth at 16 px,
//     maxWidth 160 px. The flow-around-a-window thumbnail and the depth chain are SCHEMATIC (labelled on screen).
//
// One persistent machine: a row of amber bit discs. It is the abstract "test along a line", then flies into the 24
// slots as visibility bits, then sits under the paragraph's segments as fit bits, and returns for the recap.
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const fmtInt = (n: number): string => n.toLocaleString('en-US');
/** staggered 0..1 entrance of item i of n driven by one channel */
const staggerU = (u: number, i: number, n: number, span = 0.5): number =>
  clamp01((u - (i / Math.max(1, n)) * (1 - span)) / span);

// ---------------------------------------------------------------------------
// The list (lists/list.ts, list-demo.ts), exact
// ---------------------------------------------------------------------------

const ROW_COUNT = 10_000;
const ROW_HEIGHT = 40; // list-demo.ts:43
const SLOT_COUNT = 24; // list.ts:20
const SCROLL_GRID = 4; // list.ts:26
const VIEWPORT_H = 600; // lists/README.md:86
const RAW_SCROLL = 168437.33; // example DOM read
const SCROLL = Math.floor(RAW_SCROLL * SCROLL_GRID) / SCROLL_GRID; // list-demo.ts:77
const FIRST = Math.floor(SCROLL / ROW_HEIGHT); // list.ts:68
const OFFSET = FIRST - SLOT_COUNT * Math.floor(FIRST / SLOT_COUNT); // list.ts:70-71
const SLOT_ROWS = Array.from({ length: SLOT_COUNT }, (_, s) => FIRST - OFFSET + s + (OFFSET > s ? SLOT_COUNT : 0)); // list.ts:86-87
// list.ts:89-91: exists = [row <= rowCount - 1]; visible = [4·scrollTop + 4·viewport − 4·rowHeight·row >= 1]
const SLOT_VISIBLE = SLOT_ROWS.map((r) =>
  r <= ROW_COUNT - 1 && SCROLL_GRID * SCROLL + SCROLL_GRID * VIEWPORT_H - SCROLL_GRID * ROW_HEIGHT * r >= 1 ? 1 : 0,
);
// lists/README.md:82-84
const OPS_JS = 280;
const LAYERS_JS = 19;
const OPS_ONEHOT_10K = 20_305;
const CELLS_ONEHOT_10K = ROW_COUNT + 2;

// ---------------------------------------------------------------------------
// The paragraph (text-walker/fast-walker.ts on fake-canvas widths), exact
// ---------------------------------------------------------------------------

/** fake-canvas.ts:26-41 at 16 px, letters and spaces only */
function fakeTextWidth(text: string): number {
  let sixtyFourths = 0;
  for (const ch of text) sixtyFourths += ch === ' ' ? 20 : 28 + (ch.codePointAt(0)! % 13);
  return (sixtyFourths * 16) / 64;
}
const WORDS = 'the quick brown fox jumps over a lazy dog'.split(' ');
type Seg = { text: string; w: number; br: boolean };
const SEGS: Seg[] = WORDS.flatMap((word, i) => {
  const out: Seg[] = [{ text: word, w: fakeTextWidth(word), br: false }];
  if (i < WORDS.length - 1) out.push({ text: ' ', w: fakeTextWidth(' '), br: true });
  return out;
});
const N_SEG = SEGS.length; // 17
const MAX_W = 160;
const EPS = 0.005; // fake-canvas.ts:122 lineFitEpsilon
const S_PRE: number[] = []; // S[j], inclusive prefix
SEGS.forEach((g, j) => S_PRE.push((j ? S_PRE[j - 1] : 0) + g.w));
const T_FIT = SEGS.map((g, j) => S_PRE[j] - (g.br ? g.w : 0)); // T[j] = S[j] - breakAfter[j]·width[j]
const prefix = (s: number): number => (s ? S_PRE[s - 1] : 0);
/** fits(o) = [T[s+o] − prefix(s) <= maxWidth + epsilon], one per segment j = s + o (null before s) */
const fitsFrom = (s: number): (0 | 1 | null)[] =>
  SEGS.map((_, j) => (j < s ? null : T_FIT[j] - prefix(s) <= MAX_W + EPS ? 1 : 0));
type Line = { start: number; count: number; width: number; fits: (0 | 1 | null)[] };
const LINES: Line[] = [];
for (let s = 0; s < N_SEG; ) {
  const fits = fitsFrom(s);
  const count = fits.reduce<number>((a, b) => a + (b ?? 0), 0);
  // painted width = paintEnd(first unfit) − prefix(s); paintEnd(j) = T[j−1], S[N−1] at the end
  const end = s + count;
  const paint = end >= N_SEG ? S_PRE[N_SEG - 1] : T_FIT[end - 1];
  LINES.push({ start: s, count, width: paint - prefix(s), fits });
  let next = end;
  while (next < N_SEG && SEGS[next].br) next++; // skip break-after segments
  s = next;
}
const L1 = LINES[0];

// lab sizes (text-walker/README.md:164)
const LAB = { words: 48, segments: 95, bands: 18, springs: 96, ops: 14_760, layers: 215 };

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// left: the list
const MINI_X = 46;
const MINI_W = 20;
const LIST_Y = 140;
const ZOOM_R0 = FIRST - 2;
const ZOOM_ROWS = 27;
const ROW_PX = 14;
const PX_PER = ROW_PX / ROW_HEIGHT;
const ZOOM_X = 120;
const ZOOM_W = 200;
const MINI_H = ZOOM_ROWS * ROW_PX;
const zoomY = (r: number): number => LIST_Y + (r - ZOOM_R0) * ROW_PX;
const VP_TOP = LIST_Y + (SCROLL - ZOOM_R0 * ROW_HEIGHT) * PX_PER;
const VP_BOT = VP_TOP + VIEWPORT_H * PX_PER;
const MARK_Y = LIST_Y + (SCROLL / (ROW_COUNT * ROW_HEIGHT)) * MINI_H;
const SLOT_X = 430;
const SLOT_W = 130;
const SLOT_H = 16;
const slotY = (s: number): number => LIST_Y + s * SLOT_H;
const SLOT_BIT_X = 578;

// right: the paragraph
const X0 = 700;
const PX = 1.6;
const MAX_X = X0 + MAX_W * PX;
const SEG_Y = 176;
const SEG_H = 30;
const BIT_Y = 252;
const PITCH = 30;
const BX0 = 715;
const OUT_Y = 378;
const OUT_PITCH = 30;

// the abstract row (beat 1 and the recap)
const ROW_A_Y = 360;
const ROW_D_Y = 346;
const rowAX = (j: number): number => 640 + (j - (N_SEG - 1) / 2) * 44;

const CAM_LIST: CameraState = { x: 330, y: 300, k: 1.16 };
const CAM_SLOTS: CameraState = { x: 380, y: 300, k: 1.16 };
const CAM_TEXT: CameraState = { x: 955, y: 330, k: 1.12 };

// ---------------------------------------------------------------------------
// Captions (book.json chapters[0], verbatim) and pacing (~150 wpm)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  "Handwired's author spent one night in September 2026 asking how far a fixed circuit of weighted sums and relu goes for writing a user interface. JavaScript only writes inputs and reads outputs.",
  'The circuit has no loops and no search. So the trick, again and again, is to rewrite a search as a count: when a yes-or-no test flips exactly once along a line, add up the ones.',
  'Take a list of ten thousand rows with room for a few on screen. Which row comes first? Divide the scroll position by the row height and round down. That is exact.',
  'The circuit does just that, then takes that row number modulo the number of slots, so each row always lands in the same slot. JavaScript first floors the scroll position to a quarter pixel.',
  "Each slot also gets a visibility bit: is the row's top above the viewport's bottom edge? One comparison per row, and the bit is exactly zero or one.",
  'With uniform row heights and row data kept in JavaScript, the whole virtualized list is two hundred eighty operations in nineteen layers, whether it has one thousand rows or one hundred thousand.',
  "Scope matters. Put the row data into the circuit's own source cells instead, and the same list costs twenty thousand three hundred five operations.",
  "Now text. To break a paragraph into lines you would walk word by word until one no longer fits. That is a loop, and the circuit can't loop.",
  "But for a line starting at some segment, each later segment either fits within the maximum width or doesn't, and the answers always read one, one, one, zero, zero, zero.",
  'So the first segment that doesn\'t fit is just the count of fit bits. The next line starts that many segments along, skipping spaces, and its painted width is a sum gated by the same bits.',
  'At lab scale, forty-eight words in ninety-five segments flow around a window in fourteen thousand seven hundred sixty operations and two hundred fifteen layers, with ninety-six word springs.',
  "Lines still come one after another, so depth grows with every line. Walking lines is a sequential scan that the lab's rewrites shrink but don't remove.",
  "That's the pattern: when a predicate flips once, count it. Counting turned a search into arithmetic that a fixed circuit can do.",
];
const HOLD = 0.7;
const speakDur = (text: string): number => Math.round((text.split(/\s+/).length / 2.5 + 0.8) * 10) / 10;
const BEATS: { at: number; end: number }[] = [];
{
  let t = 0.4;
  for (const c of CAPTIONS) {
    const d = speakDur(c);
    BEATS.push({ at: t, end: t + d });
    t = t + d + HOLD;
  }
}
const B = (i: number): number => BEATS[i].at;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // the persistent bit row
  const bitsOp = tl.channel('bitsOp', 0);
  const rowAIn = tl.channel('rowAIn', 0);
  const toSlots = tl.channel('morphToSlots', 0);
  const slotBitsIn = tl.channel('slotBitsIn', 0);
  const toText = tl.channel('morphToText', 0);
  const toRecap = tl.channel('morphToRecap', 0);
  const fitsReveal = tl.channel('fitsReveal', 0);
  const lineU = tl.channel('lineU', 0);

  // B0 intro
  const introU = tl.channel('introU', 0);
  const introOp = tl.channel('introOp', 1);
  // B1 search vs count
  const c1U = tl.channel('c1LabelU', 0);
  const searchU = tl.channel('searchU', 0);
  const searchOp = tl.channel('searchOp', 0);
  const searchX = tl.channel('searchStrike', 0);
  const countU = tl.channel('countU', 0);
  const c1Op = tl.channel('c1Op', 1);
  // B2–B6 the list
  const leftOp = tl.channel('leftOp', 1);
  const listU = tl.channel('listU', 0);
  const vpU = tl.channel('viewportU', 0);
  const f1U = tl.channel('f1U', 0);
  const f2U = tl.channel('f2U', 0);
  const f3U = tl.channel('f3U', 0);
  const f4U = tl.channel('f4U', 0);
  const fSpot = tl.channel('formulaSpot', 2);
  const slotsU = tl.channel('slotsU', 0);
  const linksU = tl.channel('linksU', 0);
  const cardU = tl.channel('cardU', 0);
  const cardRows = tl.channel('cardRows', 0);
  const oneHotU = tl.channel('oneHotU', 0);
  const cardOp = tl.channel('cardOp', 1);
  // B7–B11 the paragraph
  const rightOp = tl.channel('rightOp', 1);
  const segU = tl.channel('segU', 0);
  const maxU = tl.channel('maxU', 0);
  const walkU = tl.channel('walkU', 0);
  const walkOp = tl.channel('walkOp', 0);
  const loopX = tl.channel('loopStrike', 0);
  const fitsLbl = tl.channel('fitsLabelU', 0);
  const sumU = tl.channel('sumU', 0);
  const widthU = tl.channel('widthU', 0);
  const outU = tl.channel('outLines', 0);
  const stampU = tl.channel('stampU', 0);
  const machineOp = tl.channel('machineOp', 1);
  const chainU = tl.channel('chainU', 0);
  const depthLbl = tl.channel('depthLabelU', 0);
  // B12 recap
  const recapU = tl.channel('recapU', 0);
  const recapTextU = tl.channel('recapTextU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: BEATS[i].at, dur: BEATS[i].end - BEATS[i].at, text }));
  BEATS.forEach((b) => tl.hold(b.end, HOLD));

  // — B0 · one night, a fixed circuit, JS at the edges —
  tl.tween(introU, 1, { at: B(0) + 0.3, dur: 3.2, ease: ease.linear });

  // — B1 · a test that flips once: search it, or count it —
  tl.tween(introOp, 0, { at: B(1), dur: 0.6, ease: ease.move });
  tl.set(bitsOp, 1, B(1) + 0.5);
  tl.tween(rowAIn, 1, { at: B(1) + 0.5, dur: 1.4, ease: ease.linear });
  tl.tween(c1U, 1, { at: B(1) + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(searchOp, 1, { at: B(1) + 3.4, dur: 0.4, ease: ease.enter });
  tl.tween(searchU, L1.count, { at: B(1) + 3.6, dur: 3.2, ease: ease.linear });
  tl.tween(searchX, 1, { at: B(1) + 7.0, dur: 0.6, ease: ease.draw });
  tl.tween(countU, 1, { at: B(1) + 7.6, dur: 0.6, ease: ease.pop });

  // — B2 · ten thousand rows, divide and round down —
  tl.tween(c1Op, 0, { at: B(2), dur: 0.6, ease: ease.move });
  tl.tween(bitsOp, 0, { at: B(2), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_LIST, { at: B(2) + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(listU, 1, { at: B(2) + 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(vpU, 1, { at: B(2) + 2.6, dur: 0.7, ease: ease.enter });
  tl.tween(f2U, 1, { at: B(2) + 5.4, dur: 0.7, ease: ease.enter });

  // — B3 · mod 24 slots; JS floors scrollTop first —
  tl.tween(cam, CAM_SLOTS, { at: B(3), dur: 1.2, ease: ease.move });
  tl.tween(f3U, 1, { at: B(3) + 0.6, dur: 0.6, ease: ease.enter });
  tl.set(fSpot, 3, B(3) + 0.6);
  tl.tween(slotsU, 1, { at: B(3) + 1.2, dur: 1.2, ease: ease.linear });
  tl.tween(linksU, 1, { at: B(3) + 2.6, dur: 1.4, ease: ease.draw });
  tl.tween(f1U, 1, { at: B(3) + 7.4, dur: 0.6, ease: ease.enter });
  tl.set(fSpot, 1, B(3) + 7.4);

  // — B4 · a visibility bit per slot: the bit row flies into the slots —
  tl.set(fSpot, 4, B(4));
  tl.tween(f4U, 1, { at: B(4), dur: 0.6, ease: ease.enter });
  // the row left the stage at B2; it re-forms here as one bit per slot
  tl.set(toSlots, 1, B(4));
  tl.set(bitsOp, 1, B(4));
  tl.tween(slotBitsIn, 1, { at: B(4) + 0.6, dur: 2.0, ease: ease.linear });

  // — B5 · 280 operations, 19 layers, at any row count —
  tl.tween(cam, CAMERA_HOME, { at: B(5), dur: 1.3, ease: ease.move });
  tl.tween(leftOp, 0.15, { at: B(5), dur: 0.8, ease: ease.move });
  tl.tween(cardU, 1, { at: B(5) + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(cardRows, 3, { at: B(5) + 3.0, dur: 4.5, ease: ease.linear });

  // — B6 · row data in source cells: 20,305 —
  tl.tween(oneHotU, 1, { at: B(6) + 0.8, dur: 1.4, ease: ease.move });

  // — B7 · text: the walker is a loop —
  tl.tween(cardOp, 0, { at: B(7), dur: 0.6, ease: ease.move });
  tl.tween(leftOp, 0, { at: B(7), dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TEXT, { at: B(7) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(segU, 1, { at: B(7) + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(maxU, 1, { at: B(7) + 1.4, dur: 0.8, ease: ease.draw });
  tl.tween(walkOp, 1, { at: B(7) + 2.4, dur: 0.4, ease: ease.enter });
  tl.tween(walkU, L1.count, { at: B(7) + 2.6, dur: 3.4, ease: ease.linear });
  tl.tween(loopX, 1, { at: B(7) + 6.6, dur: 0.6, ease: ease.draw });

  // — B8 · fit bits read 1 1 1 0 0 0 —
  tl.tween(walkOp, 0, { at: B(8), dur: 0.5, ease: ease.move });
  tl.tween(toText, 1, { at: B(8), dur: 1.4, ease: ease.move });
  tl.tween(fitsLbl, 1, { at: B(8) + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(fitsReveal, N_SEG, { at: B(8) + 2.0, dur: 4.0, ease: ease.linear });

  // — B9 · count = first unfit; next start; painted width —
  tl.tween(sumU, 1, { at: B(9) + 0.3, dur: 0.7, ease: ease.pop });
  tl.tween(widthU, 1, { at: B(9) + 7.0, dur: 1.0, ease: ease.draw });
  tl.tween(outU, 1, { at: B(9) + 9.0, dur: 0.7, ease: ease.enter });

  // — B10 · lab-scale stamp —
  tl.tween(machineOp, 0, { at: B(10), dur: 0.7, ease: ease.move });
  tl.tween(stampU, 1, { at: B(10) + 0.4, dur: 1.4, ease: ease.linear });

  // — B11 · lines one after another: depth grows —
  tl.tween(stampU, 0, { at: B(11), dur: 0.6, ease: ease.move });
  tl.tween(machineOp, 1, { at: B(11) + 0.2, dur: 0.7, ease: ease.move });
  tl.tween(widthU, 0, { at: B(11), dur: 0.5, ease: ease.move });
  tl.tween(chainU, 1, { at: B(11) + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(lineU, 1, { at: B(11) + 1.2, dur: 1.4, ease: ease.move });
  tl.tween(outU, 2, { at: B(11) + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(chainU, 2, { at: B(11) + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(lineU, 2, { at: B(11) + 3.6, dur: 1.4, ease: ease.move });
  tl.tween(outU, 3, { at: B(11) + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(chainU, 3, { at: B(11) + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(depthLbl, 1, { at: B(11) + 6.0, dur: 0.7, ease: ease.enter });

  // — B12 · recap: pull back, the bit row returns —
  tl.tween(cam, CAMERA_HOME, { at: B(12), dur: 1.4, ease: ease.move });
  tl.tween(rightOp, 0.12, { at: B(12), dur: 0.8, ease: ease.move });
  tl.tween(leftOp, 0.12, { at: B(12), dur: 0.8, ease: ease.move });
  tl.tween(recapU, 1, { at: B(12) + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(toRecap, 1, { at: B(12) + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(recapTextU, 1, { at: B(12) + 1.9, dur: 0.7, ease: ease.enter });

  return {
    tl, cam, bitsOp, rowAIn, toSlots, slotBitsIn, toText, toRecap, fitsReveal, lineU,
    introU, introOp, c1U, searchU, searchOp, searchX, countU, c1Op,
    leftOp, listU, vpU, f1U, f2U, f3U, f4U, fSpot, slotsU, linksU, cardU, cardRows, oneHotU, cardOp,
    rightOp, segU, maxU, walkU, walkOp, loopX, fitsLbl, sumU, widthU, outU, stampU, machineOp, chainU, depthLbl,
    recapU, recapTextU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

/** The bit: amber disc for 1, amber ring for 0, a muted ring when not yet known. */
function BitDisc({ cx, cy, r, b, opacity = 1, font = 13 }: {
  cx: number; cy: number; r: number; b: 0 | 1 | null; opacity?: number; font?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={b === 1 ? colors.WARM : colors.BG} stroke={b === null ? colors.MUTED : colors.WARM} strokeWidth={b === null ? 1.2 : 2} strokeOpacity={b === null ? 0.6 : 1} />
      {b !== null && (
        <text x={cx} y={cy + font * 0.36} textAnchor="middle" fontSize={font} fontFamily={MONO} fontWeight={700} fill={b === 1 ? '#1a1206' : colors.WARM}>
          {b}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, opacity = 1, width = 1.5 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; opacity?: number; width?: number;
}) {
  if (opacity <= 0.005) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  return (
    <g opacity={opacity} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`} />
    </g>
  );
}

function T({ x, y, children, size = 14, fill = colors.TEXT, anchor = 'start', mono = true, weight, opacity = 1 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fontFamily={mono ? MONO : UI} fill={fill} textAnchor={anchor} fontWeight={weight} opacity={opacity} xmlSpace="preserve">
      {children}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Precomputed static pieces
// ---------------------------------------------------------------------------

// intro circuit: five layers of five units
const LAYER_X = [500, 570, 640, 710, 780];
const UNIT_Y = [262, 296, 330, 364, 398];
const EDGES: [number, number, number][] = [];
for (let l = 0; l < LAYER_X.length - 1; l++)
  for (let a = 0; a < UNIT_Y.length; a++)
    for (let b = 0; b < UNIT_Y.length; b++) if ((a * 3 + b * 7 + l * 5) % 4 !== 0) EDGES.push([l, a, b]);

// schematic flow-around-a-window thumbnail (beat 10)
const FLOW_X = 700;
const FLOW_W = 200;
const FLOW_Y = 156;
const FLOW_PITCH = 15;
const WIN = { x: 806, y: 216, w: 94, h: 104 };
const FLOW_BANDS = Array.from({ length: LAB.bands }, (_, band) => {
  const y = FLOW_Y + band * FLOW_PITCH;
  const blocked = y + 10 > WIN.y && y < WIN.y + WIN.h;
  const limit = blocked ? WIN.x - 8 : FLOW_X + FLOW_W;
  const bars: [number, number][] = [];
  let x = FLOW_X;
  for (let k = 0; ; k++) {
    const w = SEGS[(band * 3 + k * 2) % N_SEG].w * 0.9 + 6;
    if (x + w > limit) break;
    bars.push([x, w]);
    x += w + 5;
  }
  return { y, bars };
});

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- bit row: formation lerp A → slots → text → recap
  const uB = v(scene.toSlots);
  const uC = v(scene.toText);
  const uD = v(scene.toRecap);
  const lineU = v(scene.lineU);
  const lineK = Math.min(LINES.length - 1, Math.round(lineU));
  const settled = Math.abs(lineU - lineK) < 0.001;
  const lo = Math.floor(Math.min(lineU, LINES.length - 1.0001));
  const fr = lineU - lo;
  const shiftIdx = lerp(LINES[lo].start, LINES[Math.min(lo + 1, LINES.length - 1)].start, fr);
  const shiftPx = lerp(prefix(LINES[lo].start), prefix(LINES[Math.min(lo + 1, LINES.length - 1)].start), fr);
  const fitsReveal = v(scene.fitsReveal);
  const bitsOp = v(scene.bitsOp);
  const rowAIn = v(scene.rowAIn);
  const leftOp = v(scene.leftOp);
  const rightOp = v(scene.rightOp);
  const machineOp = v(scene.machineOp) * rightOp;

  const bits = Array.from({ length: SLOT_COUNT }, (_, j) => {
    const inText = j < N_SEG;
    let x = rowAX(Math.min(j, N_SEG - 1));
    let y = ROW_A_Y;
    let r = 13;
    x = lerp(x, SLOT_BIT_X, uB);
    y = lerp(y, slotY(j) + SLOT_H / 2, uB);
    r = lerp(r, 7, uB);
    x = lerp(x, BX0 + (j - shiftIdx) * PITCH, uC);
    y = lerp(y, BIT_Y, uC);
    r = lerp(r, 10, uC);
    x = lerp(x, rowAX(j), uD);
    y = lerp(y, ROW_D_Y, uD);
    r = lerp(r, 13, uD);
    let b: 0 | 1 | null;
    if (uD >= 0.5) b = L1.fits[j] ?? 0;
    else if (uC >= 0.5) {
      const f = LINES[lineK].fits[j] ?? null;
      b = !settled ? null : lineU < 0.001 ? (j < fitsReveal - 1e-6 ? f : null) : f;
    } else if (uB >= 0.5) b = SLOT_VISIBLE[j] as 0 | 1;
    else b = L1.fits[j] ?? 0;
    // opacity in each formation, lerped like the positions
    const aOp = inText ? staggerU(rowAIn, j, N_SEG, 0.3) : 0;
    const bOp = leftOp * staggerU(v(scene.slotBitsIn), j, SLOT_COUNT, 0.3);
    const cOp = inText ? clamp01(1 - (shiftIdx - j)) * machineOp : 0;
    const dOp = inText ? 1 : 0;
    const op = bitsOp * lerp(lerp(lerp(aOp, bOp, uB), cOp, uC), dOp, uD);
    return { x, y, r, b, op, font: r < 9 ? 12 : 13 };
  });

  // ---- intro
  const introU = v(scene.introU);
  const introOp = v(scene.introOp);

  // ---- beat 1
  const c1Op = v(scene.c1Op) * v(scene.c1U);
  const searchU = v(scene.searchU);
  const sIdx = Math.floor(Math.min(searchU, L1.count));
  const sFr = searchU - sIdx;
  const ringX = lerp(rowAX(sIdx), rowAX(Math.min(sIdx + 1, N_SEG - 1)), ease.move(clamp01(sFr * 1.6)));

  // ---- left
  const listU = v(scene.listU);
  const vpU = v(scene.vpU);
  const slotsU = v(scene.slotsU);
  const linksU = v(scene.linksU);
  const fSpot = Math.round(v(scene.fSpot));
  const fOp = (k: number, u: number): number => u * (fSpot === k ? 1 : 0.32) * leftOp;
  const cardOp = v(scene.cardOp) * v(scene.cardU);
  const cardRows = v(scene.cardRows);
  const oneHot = v(scene.oneHotU);

  // ---- right
  const segU = v(scene.segU);
  const maxU = v(scene.maxU);
  const walkU = v(scene.walkU);
  const walkOp = v(scene.walkOp) * machineOp;
  const loopX = v(scene.loopX);
  const fitsLbl = v(scene.fitsLbl);
  const sumU = v(scene.sumU);
  const widthU = v(scene.widthU);
  const outU = v(scene.outU);
  const stampU = v(scene.stampU);
  const chainU = v(scene.chainU);
  const depthLbl = v(scene.depthLbl);
  const recapU = v(scene.recapU);
  const segX = (j: number): number => X0 + (prefix(j) - shiftPx) * PX;
  const wIdx = Math.floor(Math.min(walkU, L1.count));
  const walkX = lerp(segX(wIdx) + (SEGS[wIdx].w * PX) / 2, segX(Math.min(wIdx + 1, N_SEG - 1)) + (SEGS[Math.min(wIdx + 1, N_SEG - 1)].w * PX) / 2, ease.move(clamp01((walkU - wIdx) * 1.6)));
  const curLine = LINES[lineK];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B0 · the circuit, JS at the edges ================= */}
        {introOp > 0.005 && introU > 0 && (
          <g opacity={introOp}>
            <T x={640} y={176} anchor="middle" size={16} fill={colors.MUTED} mono={false} opacity={staggerU(introU, 0, 5)}>
              one night · September 2026
            </T>
            <g opacity={staggerU(introU, 1, 5)}>
              <rect x={170} y={300} width={190} height={60} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
              <T x={265} y={336} anchor="middle" size={15}>JS writes inputs</T>
              <Arrow x1={366} y1={330} x2={470} y2={330} color={colors.ACCENT} />
            </g>
            <g opacity={staggerU(introU, 2, 5)}>
              {EDGES.map(([l, a, b], i) => (
                <line key={i} x1={LAYER_X[l]} y1={UNIT_Y[a]} x2={LAYER_X[l + 1]} y2={UNIT_Y[b]} stroke={colors.MUTED} strokeOpacity={0.22} />
              ))}
              {LAYER_X.map((x, l) =>
                UNIT_Y.map((y, a) => <circle key={`${l}-${a}`} cx={x} cy={y} r={6} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />),
              )}
              <T x={640} y={444} anchor="middle" size={15} fill={colors.SECONDARY}>weighted sums + relu · a fixed circuit</T>
            </g>
            <g opacity={staggerU(introU, 3, 5)}>
              <Arrow x1={810} y1={330} x2={914} y2={330} color={colors.POSITIVE} />
              <rect x={920} y={300} width={190} height={60} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <T x={1015} y={336} anchor="middle" size={15}>JS reads outputs</T>
            </g>
            <T x={640} y={484} anchor="middle" size={14} fill={colors.MUTED} mono={false} opacity={staggerU(introU, 4, 5)}>
              how far does this go for writing a user interface?
            </T>
          </g>
        )}

        {/* ================= B1 · search versus count ================= */}
        {c1Op > 0.005 && (
          <g opacity={c1Op}>
            <T x={640} y={292} anchor="middle" size={17} mono={false}>a yes-or-no test, along a line</T>
            <T x={rowAX(0) - 26} y={ROW_A_Y + 5} anchor="end" size={13} fill={colors.MUTED}>test(i)</T>
            {v(scene.searchOp) > 0.005 && (
              <g opacity={v(scene.searchOp) * (1 - 0.75 * v(scene.searchX))}>
                <circle cx={ringX} cy={ROW_A_Y} r={19} fill="none" stroke="#ffffff" strokeWidth={2} />
                <T x={640} y={428} anchor="middle" size={15} fill={colors.MUTED} mono={false}>search: step until the answer flips</T>
                <line x1={512} y1={423} x2={512 + 256 * v(scene.searchX)} y2={423} stroke={colors.NEGATIVE} strokeWidth={2.5} />
              </g>
            )}
            <T x={640} y={472} anchor="middle" size={20} fill={colors.WARM} weight={700} opacity={v(scene.countU)}>
              {`count: Σ ones = ${L1.count}`}
            </T>
          </g>
        )}

        {/* ================= B2–B6 · the list ================= */}
        {leftOp > 0.005 && listU > 0 && (
          <g opacity={leftOp}>
            {/* minimap: all 10,000 rows */}
            <g opacity={clamp01(listU * 2)}>
              <T x={30} y={128} size={12} fill={colors.MUTED}>{`${fmtInt(ROW_COUNT)} rows`}</T>
              <rect x={MINI_X} y={LIST_Y} width={MINI_W} height={MINI_H * listU} rx={3} fill={colors.PANEL} stroke={colors.GRID} />
              {Array.from({ length: 21 }, (_, i) => (
                <line key={i} x1={MINI_X} x2={MINI_X + MINI_W} y1={LIST_Y + (i * MINI_H) / 20} y2={LIST_Y + (i * MINI_H) / 20} stroke={colors.MUTED} strokeOpacity={i * 0.05 < listU ? 0.25 : 0} />
              ))}
            </g>
            {/* zoomed rows */}
            <T x={ZOOM_X} y={128} size={12} fill={colors.MUTED} opacity={clamp01(listU * 2 - 0.4)}>{`rows of ${ROW_HEIGHT} px`}</T>
            {Array.from({ length: ZOOM_ROWS }, (_, i) => {
              const r = ZOOM_R0 + i;
              const u = staggerU(listU, i, ZOOM_ROWS, 0.4);
              const inView = r * ROW_HEIGHT < SCROLL + VIEWPORT_H && (r + 1) * ROW_HEIGHT > SCROLL;
              return (
                <g key={r} opacity={u * (inView || vpU < 0.01 ? 1 : lerp(1, 0.4, vpU))}>
                  <rect x={ZOOM_X} y={zoomY(r) + 1} width={ZOOM_W} height={ROW_PX - 2} rx={2} fill={colors.PANEL} stroke={colors.GRID} />
                  <T x={ZOOM_X + 6} y={zoomY(r) + 11} size={12} fill={colors.MUTED}>{`row ${r}`}</T>
                </g>
              );
            })}
            {vpU > 0.005 && (
              <g opacity={vpU}>
                <rect x={MINI_X - 4} y={MARK_Y - 1.5} width={MINI_W + 8} height={3} fill={colors.ACCENT} />
                <path d={`M ${MINI_X + MINI_W + 4} ${MARK_Y} L ${ZOOM_X - 4} ${VP_TOP} M ${MINI_X + MINI_W + 4} ${MARK_Y} L ${ZOOM_X - 4} ${VP_BOT}`} stroke={colors.ACCENT} strokeOpacity={0.45} fill="none" />
                <rect x={ZOOM_X - 4} y={VP_TOP} width={ZOOM_W + 8} height={VP_BOT - VP_TOP} rx={3} fill={colors.ACCENT} fillOpacity={0.06} stroke={colors.ACCENT} strokeWidth={1.8} />
                <T x={ZOOM_X + ZOOM_W - 4} y={VP_TOP + 11} anchor="end" size={12} fill={colors.ACCENT}>scrollTop</T>
                <T x={ZOOM_X + ZOOM_W - 4} y={VP_BOT - 3} anchor="end" size={12} fill={colors.ACCENT}>{`scrollTop + ${VIEWPORT_H}`}</T>
              </g>
            )}
            {/* formulas, top */}
            <T x={30} y={44} size={14} opacity={fOp(1, v(scene.f1U))}>
              {`scrollTop ${RAW_SCROLL} → floored to ¼ px → ${SCROLL}`}
            </T>
            <T x={30} y={66} size={14} opacity={fOp(2, v(scene.f2U))}>
              {`first = ⌊scrollTop / rowHeight⌋ = ⌊${SCROLL} / ${ROW_HEIGHT}⌋ = ${FIRST}`}
            </T>
            <T x={30} y={88} size={14} opacity={fOp(3, v(scene.f3U))}>
              {`slot = first mod ${SLOT_COUNT} = ${FIRST} mod ${SLOT_COUNT} = ${OFFSET}`}
            </T>
            <T x={30} y={110} size={14} opacity={fOp(4, v(scene.f4U))}>
              {`visible = [row × ${ROW_HEIGHT} < scrollTop + ${VIEWPORT_H}] · 0 or 1`}
            </T>
            {/* slot pool */}
            {slotsU > 0.005 && (
              <g>
                <T x={SLOT_X} y={128} size={12} fill={colors.MUTED} opacity={slotsU}>{`${SLOT_COUNT} slots · row`}</T>
                {SLOT_ROWS.map((r, sl) => {
                  const u = staggerU(slotsU, sl, SLOT_COUNT, 0.3);
                  const hl = sl === OFFSET;
                  return (
                    <g key={sl} opacity={u}>
                      <rect x={SLOT_X} y={slotY(sl) + 1} width={SLOT_W} height={SLOT_H - 2} rx={3} fill={colors.PANEL} stroke={hl ? colors.ACCENT : colors.GRID} strokeWidth={hl ? 1.6 : 1} />
                      <T x={SLOT_X + 6} y={slotY(sl) + 12} size={12} fill={colors.MUTED}>{`${sl}`}</T>
                      <T x={SLOT_X + 40} y={slotY(sl) + 12} size={12} fill={hl ? colors.ACCENT : colors.TEXT}>{`${r}`}</T>
                    </g>
                  );
                })}
                {SLOT_ROWS.map((r, sl) => {
                  const u = staggerU(linksU, sl, SLOT_COUNT, 0.4);
                  if (u <= 0.005 || r >= ZOOM_R0 + ZOOM_ROWS) return null;
                  const y1 = zoomY(r) + ROW_PX / 2;
                  const y2 = slotY(sl) + SLOT_H / 2;
                  const x1 = ZOOM_X + ZOOM_W + 4;
                  const x2 = SLOT_X - 4;
                  return <line key={sl} x1={x1} y1={y1} x2={lerp(x1, x2, u)} y2={lerp(y1, y2, u)} stroke={sl === OFFSET ? colors.ACCENT : colors.MUTED} strokeOpacity={sl === OFFSET ? 0.9 : 0.3} />;
                })}
              </g>
            )}
          </g>
        )}

        {/* ================= B5–B6 · the size card ================= */}
        {cardOp > 0.005 && (
          <g opacity={cardOp}>
            <T x={700} y={166} size={19} mono={false} weight={600}>{`virtualized list · ${SLOT_COUNT} slots`}</T>
            <T x={700} y={192} size={14} fill={colors.MUTED} mono={false}>uniform row heights · row data kept in JS</T>
            {[1_000, 10_000, 100_000].map((rows, i) => {
              const u = clamp01(cardRows - i);
              const dim = i === 1 ? 1 : lerp(1, 0.15, oneHot);
              return (
                <g key={rows} opacity={u * dim}>
                  <T x={700} y={232 + i * 32} size={16}>{`${fmtInt(rows)} rows`}</T>
                  <T x={1210} y={232 + i * 32} anchor="end" size={16} fill={colors.WARM}>{`${OPS_JS} operations · ${LAYERS_JS} layers`}</T>
                </g>
              );
            })}
            {oneHot > 0.005 && (
              <g opacity={clamp01(oneHot * 1.5)}>
                <T x={700} y={354} size={14} fill={colors.MUTED} mono={false}>{`${fmtInt(ROW_COUNT)} rows, operations:`}</T>
                <T x={700} y={386} size={13}>row data in JS</T>
                <rect x={700} y={394} width={Math.max(2, (OPS_JS / OPS_ONEHOT_10K) * 500)} height={14} fill={colors.WARM} />
                <T x={714} y={406} size={13} fill={colors.WARM}>{`${OPS_JS}`}</T>
                <T x={700} y={436} size={13}>row data in the circuit's source cells</T>
                <rect x={700} y={444} width={500 * oneHot} height={14} fill={colors.NEGATIVE} />
                <T x={1200} y={436} anchor="end" size={13} fill={colors.NEGATIVE} opacity={clamp01(oneHot * 2 - 1)}>{fmtInt(OPS_ONEHOT_10K)}</T>
                <T x={700} y={486} size={13} fill={colors.MUTED} opacity={clamp01(oneHot * 2 - 1)}>{`source cells: 2 → ${fmtInt(CELLS_ONEHOT_10K)}`}</T>
              </g>
            )}
          </g>
        )}

        {/* ================= B7–B11 · the paragraph ================= */}
        {rightOp > 0.005 && segU > 0 && (
          <g>
            <g opacity={machineOp}>
              {/* maxWidth */}
              <g opacity={maxU}>
                <line x1={MAX_X} y1={150} x2={MAX_X} y2={150 + 140 * maxU} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="5 4" />
                <T x={MAX_X} y={142} anchor="middle" size={13} fill={colors.NEGATIVE}>{`maxWidth ${MAX_W} px + ε ${EPS}`}</T>
                <line x1={X0} y1={150} x2={X0} y2={290} stroke={colors.MUTED} strokeOpacity={0.5} />
              </g>
              {/* segments */}
              {SEGS.map((g, j) => {
                const x = segX(j);
                const op = staggerU(segU, j, N_SEG, 0.3) * clamp01(1 - (shiftIdx - j));
                if (op <= 0.005) return null;
                const w = g.w * PX;
                const lit = widthU > 0 && lineU < 0.001 && j < L1.count - 1;
                return (
                  <g key={j} opacity={op}>
                    <rect x={x + 0.5} y={g.br ? SEG_Y + SEG_H - 8 : SEG_Y} width={w - 1} height={g.br ? 8 : SEG_H} rx={3} fill={g.br ? 'none' : colors.PANEL} stroke={lit ? colors.WARM : g.br ? colors.MUTED : colors.ACCENT} strokeOpacity={g.br ? 0.6 : 1} strokeWidth={lit ? 1.8 : 1.2} />
                    {!g.br && (
                      <T x={x + w / 2} y={SEG_Y + 20} anchor="middle" size={13}>{g.text}</T>
                    )}
                  </g>
                );
              })}
              {/* connectors segment → bit */}
              {uC > 0.5 &&
                SEGS.map((g, j) => {
                  const op = (uC - 0.5) * 2 * clamp01(1 - (shiftIdx - j));
                  if (op <= 0.005) return null;
                  return (
                    <line key={j} x1={segX(j) + (g.w * PX) / 2} y1={SEG_Y + SEG_H + 2} x2={BX0 + (j - shiftIdx) * PITCH} y2={BIT_Y - 12} stroke={colors.MUTED} strokeOpacity={0.35 * op} />
                  );
                })}
              {/* the walker */}
              {walkOp > 0.005 && (
                <g opacity={walkOp}>
                  <circle cx={walkX} cy={SEG_Y + SEG_H / 2} r={20} fill="none" stroke="#ffffff" strokeWidth={2} />
                  <T x={X0} y={BIT_Y + 4} size={14} fill={colors.MUTED}>loop: while the next segment fits, step on</T>
                  <line x1={X0 - 4} y1={BIT_Y} x2={X0 - 4 + 360 * loopX} y2={BIT_Y} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                  <T x={X0} y={BIT_Y + 34} size={14} fill={colors.NEGATIVE} opacity={loopX}>the circuit can't loop</T>
                </g>
              )}
              {/* fit formula + count */}
              <T x={X0} y={300} size={13} opacity={fitsLbl * (sumU > 0 ? lerp(1, 0.4, sumU) : 1)}>
                {'fits(o) = [T[s+o] − prefix(s) ≤ maxWidth + ε]'}
              </T>
              {sumU > 0.005 && (
                <g opacity={sumU}>
                  <T x={X0} y={326} size={15} fill={colors.WARM} weight={700}>
                    {settled
                      ? `s = ${curLine.start}: Σ fits = ${curLine.count} → next line at segment ${curLine.start + curLine.count}${curLine.start + curLine.count >= N_SEG ? ' (end)' : ` · ${SEGS[curLine.start + curLine.count].text}`}`
                      : ' '}
                  </T>
                  <T x={X0} y={350} size={13} opacity={widthU}>
                    {'width(s) = width[s] + Σ fits(o)·(paintEnd(s+o+1) − paintEnd(s+o))'}
                  </T>
                </g>
              )}
              {/* painted width bracket for line 1 */}
              {widthU > 0.005 && (
                <g opacity={widthU}>
                  <path d={`M ${X0} ${SEG_Y - 4} L ${X0} ${SEG_Y - 10} L ${X0 + L1.width * PX * widthU} ${SEG_Y - 10} L ${X0 + L1.width * PX * widthU} ${SEG_Y - 4}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  <T x={X0} y={SEG_Y - 16} size={13} fill={colors.WARM}>{`painted width ${L1.width} px`}</T>
                </g>
              )}
              {/* the paragraph, laid out */}
              {outU > 0.005 && (
                <g>
                  <rect x={X0 - 8} y={OUT_Y - 8} width={MAX_W * PX + 16} height={LINES.length * OUT_PITCH + 12} rx={6} fill="none" stroke={colors.GRID} opacity={clamp01(outU)} />
                  {LINES.map((ln, k) => {
                    const u = clamp01(outU - k);
                    if (u <= 0.005) return null;
                    return (
                      <g key={k} opacity={u}>
                        {SEGS.slice(ln.start, ln.start + ln.count).map((g, i) => {
                          const j = ln.start + i;
                          if (g.br) return null;
                          const x = X0 + (prefix(j) - prefix(ln.start)) * PX;
                          return (
                            <g key={j}>
                              <rect x={x + 0.5} y={OUT_Y + k * OUT_PITCH} width={g.w * PX - 1} height={22} rx={3} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.7} />
                              <T x={x + (g.w * PX) / 2} y={OUT_Y + k * OUT_PITCH + 16} anchor="middle" size={13}>{g.text}</T>
                            </g>
                          );
                        })}
                        <T x={X0 + MAX_W * PX + 18} y={OUT_Y + k * OUT_PITCH + 16} size={12} fill={colors.MUTED}>{`line ${k + 1}`}</T>
                      </g>
                    );
                  })}
                </g>
              )}
              {/* depth chain (schematic) */}
              {chainU > 0.005 && (
                <g>
                  {LINES.map((_, k) => {
                    const u = clamp01(chainU - k);
                    if (u <= 0.005) return null;
                    const x = X0 + k * 130;
                    const y = 488 + k * 10;
                    return (
                      <g key={k} opacity={u}>
                        {k > 0 && <Arrow x1={x - 34} y1={y - 12 + 13} x2={x - 4} y2={y + 13} color={colors.SECONDARY} />}
                        <rect x={x} y={y} width={96} height={26} rx={5} fill={colors.PANEL} stroke={colors.SECONDARY} />
                        <T x={x + 48} y={y + 18} anchor="middle" size={13}>{`line ${k + 1}`}</T>
                      </g>
                    );
                  })}
                  <T x={X0} y={552} size={13} fill={colors.SECONDARY} opacity={depthLbl}>each line starts where the last one ended: depth grows per line (schematic)</T>
                </g>
              )}
            </g>

            {/* lab-scale stamp */}
            {stampU > 0.005 && (
              <g opacity={rightOp}>
                <g opacity={clamp01(stampU * 2)}>
                  {FLOW_BANDS.map((band, i) => (
                    <g key={i} opacity={staggerU(stampU, i, LAB.bands, 0.4)}>
                      {band.bars.map(([x, w], k) => (
                        <rect key={k} x={x} y={band.y} width={w} height={9} rx={2} fill={colors.ACCENT} fillOpacity={0.55} />
                      ))}
                    </g>
                  ))}
                  <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={6} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
                  <T x={WIN.x + WIN.w / 2} y={WIN.y + WIN.h / 2 + 4} anchor="middle" size={12} fill={colors.SECONDARY}>window</T>
                  <T x={FLOW_X} y={FLOW_Y + LAB.bands * FLOW_PITCH + 16} size={12} fill={colors.MUTED}>text flowing around a window (schematic)</T>
                </g>
                <g opacity={clamp01(stampU * 2 - 0.6)}>
                  <rect x={930} y={150} width={290} height={290} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                  <T x={950} y={180} size={13} fill={colors.MUTED}>text-walker · lab scale</T>
                  <T x={950} y={214} size={17}>{`${LAB.words} words · ${LAB.segments} segments`}</T>
                  <T x={950} y={242} size={17}>{`${LAB.bands} bands · ${LAB.springs} word springs`}</T>
                  <T x={950} y={302} size={36} fill={colors.WARM} weight={700}>{fmtInt(LAB.ops)}</T>
                  <T x={950} y={324} size={13} fill={colors.MUTED}>operations</T>
                  <T x={950} y={390} size={36} fill={colors.WARM} weight={700}>{`${LAB.layers}`}</T>
                  <T x={950} y={412} size={13} fill={colors.MUTED}>layers</T>
                </g>
              </g>
            )}
          </g>
        )}

        {/* ================= B12 · recap panel ================= */}
        {recapU > 0.005 && (
          <g opacity={recapU}>
            <rect x={230} y={226} width={820} height={226} rx={12} fill={colors.BG} stroke={colors.GRID} />
            <g opacity={v(scene.recapTextU)}>
            <T x={640} y={276} anchor="middle" size={24} mono={false} weight={600}>when a predicate flips once, count it</T>
            <T x={640} y={406} anchor="middle" size={17} fill={colors.WARM}>{`Σ fits = ${L1.count} · a search became arithmetic`}</T>
            <T x={640} y={434} anchor="middle" size={13} fill={colors.MUTED} mono={false}>the first row that shows · where a line ends</T>
            </g>
          </g>
        )}

        {/* ================= the persistent bit row ================= */}
        {bits.map((d, j) => (
          <BitDisc key={j} cx={d.x} cy={d.y} r={d.r} b={d.b} opacity={d.op} font={d.font} />
        ))}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
