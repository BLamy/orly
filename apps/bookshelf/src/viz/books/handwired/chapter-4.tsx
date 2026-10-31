// Loops That Cannot Stop
//
// Handwired — chapter 4. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT, Cheng Lou)
//   docs/README.md:9          a loop becomes a count, a tree, a table, or the same work on every item
//   docs/patterns.md:3, 7     every operation runs on every frame; CPU time follows operations
//   docs/patterns.md:34, 39   when a tree gives the loop's answer; integers below 2^24 (≈ 16.8 million) add exactly in any grouping
//   docs/patterns.md:50       prefix-network table (Brent-Kung: 2,036 combines in 18 levels)
//   docs/patterns.md:54-55    CPU executor vs GPU dispatch per tree level
//   docs/patterns.md:65       a count or a tree picks one item
//   docs/patterns.md:69-82    findIndex (code 72, bits 75-77, cost 81, monotone caveat 82)
//   docs/patterns.md:175-194  running totals (diagram 184-190, Brent-Kung network 192, cost 193)
//   src/runtime/prefix-networks.ts:30  brentKungPrefix (every running total; 2,036 operations, 18 layers at 1,024 rows)
//   docs/patterns.md:356-374  sort as ranks (code 361, rank table 366-371, cost 374: keys on a grid)
//   docs/patterns.md:456-470  tables JavaScript writes (code 461-462, table 465-466, cost 470)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan. Captions are the fixed
// narration contract (verbatim). Every number below is computed at module scope from the doc's own
// examples and asserted against the doc's printed values; scatter points are the sizes the repo quotes.
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const INK = '#e6edf6';
const DARK = '#08101f';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`handwired ch4: ${msg}`);
}

// ---------------------------------------------------------------------------
// The arithmetic (module scope; checked against docs/patterns.md)
// ---------------------------------------------------------------------------

// findIndex (patterns.md:72-77)
const HEIGHTS = [40, 40, 0, 60, 40];
const BOTTOMS = HEIGHTS.reduce<number[]>((acc, h) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + h], []);
const TOPS = BOTTOMS.map((b, i) => b - HEIGHTS[i]);
const POINTER_Y = 90;
const BITS = BOTTOMS.map((b) => (b <= POINTER_Y ? 1 : 0));
const COUNT: number = BITS.reduce<number>((p, c) => p + c, 0);
const LOOP_INDEX = BOTTOMS.findIndex((rowBottom) => POINTER_Y < rowBottom);
assert(BOTTOMS.join(' ') === '40 80 80 140 180', 'row bottoms');
assert(BITS.join(' ') === '1 1 1 0 0', 'findIndex bits');
assert(COUNT === 3 && LOOP_INDEX === 3, 'count equals loop index');

// the monotone caveat (patterns.md:82): a height of −10 px
const EX_HEIGHTS = [40, -10, 50];
const EX_BOTTOMS = EX_HEIGHTS.reduce<number[]>((acc, h) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + h], []);
const EX_TOPS = EX_BOTTOMS.map((b, i) => b - EX_HEIGHTS[i]);
const EX_Y = 35;
const EX_BITS = EX_BOTTOMS.map((b) => (b <= EX_Y ? 1 : 0));
const EX_COUNT: number = EX_BITS.reduce<number>((p, c) => p + c, 0);
const EX_LOOP = EX_BOTTOMS.findIndex((b) => EX_Y < b);
assert(EX_BOTTOMS.join(' ') === '40 30 80' && EX_BITS.join(' ') === '0 1 0', 'caveat bits');
assert(EX_COUNT === 1 && EX_LOOP === 0, 'caveat: count 1, loop 0');

// running totals (patterns.md:181-189): the first four heights
const H4 = HEIGHTS.slice(0, 4);
const CHAIN = H4.reduce<number[]>((acc, h) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + h], []);
const PAIR01 = H4[0] + H4[1];
const PAIR23 = H4[2] + H4[3];
const TREE = [H4[0], PAIR01, PAIR01 + H4[2], PAIR01 + PAIR23];
assert(CHAIN.join(' ') === '40 80 80 140' && TREE.join(' ') === CHAIN.join(' '), 'chain and tree totals agree');
assert(CHAIN.join(' ') === BOTTOMS.slice(0, 4).join(' '), 'totals are the first four row bottoms');

// ranks (patterns.md:361-371)
const KEYS = [30, 10, 30, 20];
const before = (i: number, j: number): number => (j !== i && (KEYS[j] < KEYS[i] || (KEYS[j] === KEYS[i] && j < i)) ? 1 : 0);
const RANK_BITS = KEYS.map((_, i) => KEYS.map((__, j) => before(i, j)));
const RANKS = RANK_BITS.map((row) => row.reduce((p, c) => p + c, 0));
const ORDER = KEYS.map((_, index) => index).sort((left, right) => KEYS[left] - KEYS[right] || left - right);
assert(RANK_BITS.map((r) => r.join('')).join(' ') === '0101 0000 1101 0100', 'rank table');
assert(RANKS.join(' ') === '2 0 3 1' && ORDER.join(' ') === '1 3 0 2', 'ranks and sorted order');
assert(ORDER.every((item, r) => RANKS[item] === r), 'ranks place each item');

// the table JavaScript writes (patterns.md:461-466)
const DEPTHS = [0, 1, 2, 1, 2, 3];
const LEVELS = 4;
const ANCESTOR = DEPTHS.map((_, row) =>
  Array.from({ length: LEVELS }, (__, level) => {
    let ancestor = row;
    while (ancestor > 0 && DEPTHS[ancestor] > level) ancestor--;
    return ancestor;
  }),
);
const READ = { row: 5, level: 2 };
const READ_CELL = READ.row * LEVELS + READ.level;
assert(ANCESTOR[3].join(' ') === '0 3 3 3' && ANCESTOR[5].join(' ') === '0 3 4 5', 'ancestor rows 3 and 5');
assert(READ_CELL === 22 && ANCESTOR.flat()[READ_CELL] === 4, 'read row 5, level 2 = cell 22 = 4');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const CODE = { x: 40, y: 82 };

// row list (vertical ruler, 1.6 px per unit: 0..180 → y 170..458)
const RULER_X = 150;
const yOf = (u: number): number => 170 + u * 1.6;
const BLK = { x: 160, w: 130 };
const ROW_CY = BOTTOMS.map((b, i) => yOf((b + TOPS[i]) / 2));
const NEEDLE_Y = yOf(POINTER_Y);
const CURSOR_X = 62;

// program panel
const PANEL = { x: 340, y: 150, w: 430, h: 336 };
const TILE = { x: 360, w: 180, h: 26 };
const DISC_X = 566;
const SIGMA = { x: 705, y: 236 };

// menu bar (four answers)
const MENU = [
  { x: 40, w: 150, label: 'count' },
  { x: 210, w: 150, label: 'tree' },
  { x: 380, w: 150, label: 'table' },
  { x: 550, w: 230, label: 'same work on every item' },
];
const MENU_Y = 572;

// running totals: bars and nodes
const COL_X = [200, 320, 440, 560];
const BAR_BASE = 262;
const BAR_SCALE = 1.2;
const BAR_W = 64;
const LAYER_Y = [318, 368, 418, 468];
const NODE = { w: 104, h: 30 };

// ranks
const RG = { x: 200, y: 214, cell: 52, gap: 8 };
const RG_PITCH = RG.cell + RG.gap;
const CARD = { w: 52, h: 44, y: 146 };
const SORTED_X = 640;

// ancestor table
const AT = { x: 340, y: 192, cell: 32, pitch: 38 };
const LIST = { x: 60, y: 192, pitch: 38, h: 30, w: 130, indent: 22 };

// the work-vs-waiting scatter (log–log): x 850..1210, y 130..540
const SC = { x0: 850, x1: 1210, y0: 540, y1: 130 };
const LX = [-0.2, 4.3];
const LY = [-0.2, 3.3];
const sx = (ops: number): number => SC.x0 + ((Math.log10(ops) - LX[0]) / (LX[1] - LX[0])) * (SC.x1 - SC.x0);
const sy = (layers: number): number => SC.y0 - ((Math.log10(layers) - LY[0]) / (LY[1] - LY[0])) * (SC.y0 - SC.y1);
type PointId = 'T' | 'C' | 'H' | 'B' | 'S' | 'R';
interface ScatterPoint {
  id: PointId;
  ops: number;
  layers: number;
  name: string;
  counter: string;
  solid: boolean;
  lx: number;
  ly: number;
  anchor: 'start' | 'middle' | 'end';
}
const POINT_DATA: Array<Omit<ScatterPoint, 'lx' | 'ly' | 'anchor'> & { dx: number; dy: number; anchor: ScatterPoint['anchor'] }> = [
  { id: 'T', ops: 447, layers: 34, name: 'tree, 64 rows', counter: '447 · 34', solid: false, dx: -12, dy: -4, anchor: 'end' },
  { id: 'C', ops: 195, layers: 3, name: 'count, 64 rows', counter: '195 · 3', solid: true, dx: -10, dy: -24, anchor: 'end' },
  { id: 'H', ops: 1023, layers: 1023, name: 'chain, 1,024 rows', counter: '1,023 · 1,023', solid: false, dx: -12, dy: -4, anchor: 'end' },
  { id: 'B', ops: 2036, layers: 18, name: 'Brent-Kung, 1,024 rows', counter: '2,036 · 18', solid: true, dx: 0, dy: 23, anchor: 'middle' },
  { id: 'S', ops: 4096, layers: 3, name: 'rank sums, 64 items', counter: '4,096 · 3', solid: true, dx: -4, dy: -24, anchor: 'middle' },
  { id: 'R', ops: 1, layers: 1, name: 'one table read', counter: '1 · 1', solid: true, dx: 14, dy: -4, anchor: 'start' },
];
const POINTS: Record<PointId, ScatterPoint & { px: number; py: number }> = Object.fromEntries(
  POINT_DATA.map((p) => {
    const px = sx(p.ops);
    const py = sy(p.layers);
    return [p.id, { ...p, px, py, lx: px + p.dx, ly: py + p.dy }];
  }),
) as unknown as Record<PointId, ScatterPoint & { px: number; py: number }>;
for (const p of Object.values(POINTS)) {
  assert(p.px > SC.x0 && p.px < SC.x1 && p.py < SC.y0 && p.py > SC.y1, `point ${p.id} inside the box`);
}
assert(POINTS.H.py < POINTS.T.py && POINTS.T.py < POINTS.B.py && POINTS.B.py < POINTS.C.py, 'layer order H > T > B > C');
assert(Math.abs(POINTS.C.py - POINTS.S.py) < 1e-9 && POINTS.R.px < POINTS.C.px && POINTS.C.px < POINTS.T.px, 'x order');
const X_TICKS = [1, 10, 100, 1000, 10000];
const Y_TICKS = [1, 10, 100, 1000];
const tickLabel = (v: number): string => v.toLocaleString('en-US');

// cameras
const CAM_ROWS: CameraState = { x: 410, y: 300, k: 1.22 };
const CAM_TREE: CameraState = { x: 400, y: 309, k: 1.22 };
const CAM_RANK: CameraState = { x: 420, y: 318, k: 1.18 };
const CAM_TABLE: CameraState = { x: 410, y: 314, k: 1.2 };
const CAM_SCATTER: CameraState = { x: 995, y: 388, k: 1.25 };

const SOURCES = [
  'docs/patterns.md:3, 69, 72',
  'docs/README.md:9 · docs/patterns.md:3',
  'docs/patterns.md:72-76',
  'docs/patterns.md:69, 80',
  'docs/patterns.md:81',
  'docs/patterns.md:82',
  'docs/patterns.md:177-182, 193',
  'docs/patterns.md:34, 50, 185-193 · prefix-networks.ts:30',
  'docs/patterns.md:34, 39',
  'docs/patterns.md:358-374',
  'docs/patterns.md:458-470',
  'docs/patterns.md:7, 54-55',
  'docs/patterns.md:65',
];

// verbatim code chips (≤ 3 lines)
const C4A = ['const pointedRow = rowBottoms.findIndex(rowBottom => pointerY < rowBottom)'];
const C4B = [
  'rowBottom                  40   80   80  140  180    pointerY = 90',
  '[rowBottom <= pointerY]     1    1    1    0    0    their count, 3, is the pointed row',
];
const C4C = ['let top = 0', 'for (const height of heights) { rowTops.push(top); top += height }'];
const C4E = [
  'const order = items.map((_, index) => index)',
  '  .sort((left, right) => keys[left] - keys[right] || left - right)',
];
const C4F = ['let ancestor = row', 'while (ancestor > 0 && depths[ancestor] > level) ancestor--'];
const C4G = ['ancestor = ancestorAtLevel[row × 4 + level], 1 operation'];

// ---------------------------------------------------------------------------
// Timeline — 13 fixed captions, ≈ 123 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = tl.channel('src', 0);
  const titleU = tl.channel('titleU', 0);

  // code chips
  const codeA = tl.channel('codeA', 0);
  const codeB = tl.channel('codeB', 0);
  const codeC = tl.channel('codeC', 0);
  const codeE = tl.channel('codeE', 0);
  const codeF = tl.channel('codeF', 0);
  const codeG = tl.channel('codeG', 0);

  // findIndex machine
  const rowsU = tl.channel('rowsU', 0); // blocks + ruler draw on
  const blocksOp = tl.channel('blocksOp', 1);
  const fiOp = tl.channel('fiOp', 1); // needle, cursor, panel, readout
  const needleU = tl.channel('needleU', 0);
  const curU = tl.channel('curU', 0);
  const curRow = tl.channel('curRow', 0);
  const checkIdx = tl.channel('checkIdx', 0);
  const stopU = tl.channel('stopU', 0);
  const row4Dim = tl.channel('row4Dim', 0);
  const panelU = tl.channel('panelU', 0);
  const flashU = tl.channel('flashU', 0);
  const everyU = tl.channel('everyU', 0);
  const testU = tl.channel('testU', 0);
  const bitsW = tl.channel('bitsW', 0);
  const sumU = tl.channel('sumU', 0);
  const sigmaU = tl.channel('sigmaU', 0);
  const ringU = tl.channel('ringU', 0);
  const sameU = tl.channel('sameU', 0);
  const flipU = tl.channel('flipU', 0);
  const idxTexU = tl.channel('idxTexU', 0);

  // menu
  const menuU = tl.channel('menuU', 0);
  const m0 = tl.channel('menuCount', 0.35);
  const m1 = tl.channel('menuTree', 0.35);
  const m2 = tl.channel('menuTable', 0.35);
  const m3 = tl.channel('menuSame', 0.35);

  // scatter
  const scatU = tl.channel('scatU', 0);
  const scatOp = tl.channel('scatOp', 1);
  const pC = tl.channel('pC', 0);
  const pT = tl.channel('pT', 0);
  const pH = tl.channel('pH', 0);
  const pB = tl.channel('pB', 0);
  const pS = tl.channel('pS', 0);
  const pR = tl.channel('pR', 0);
  const arrTC = tl.channel('arrTC', 0);
  const arrHB = tl.channel('arrHB', 0);
  const xGlow = tl.channel('xGlow', 0);
  const yGlow = tl.channel('yGlow', 0);

  // caveat example
  const exU = tl.channel('exU', 0);
  const exBits = tl.channel('exBits', 0);
  const exSigma = tl.channel('exSigma', 0);
  const exLoop = tl.channel('exLoop', 0);
  const exFlag = tl.channel('exFlag', 0);

  // running totals
  const barsU = tl.channel('barsU', 0);
  const chainU = tl.channel('chainU', 0);
  const chainTag = tl.channel('chainTag', 0);
  const treeU = tl.channel('treeU', 0);
  const exactU = tl.channel('exactU', 0);
  const matchU = tl.channel('matchU', 0); // 0..1 tree row, 1..2 loop row + equals
  const totalsOp = tl.channel('totalsOp', 1);

  // ranks
  const rankU = tl.channel('rankU', 0);
  const rankFill = tl.channel('rankFill', 0);
  const rankSums = tl.channel('rankSums', 0);
  const rankTex = tl.channel('rankTex', 0);
  const tieU = tl.channel('tieU', 0);
  const fallU = tl.channel('fallU', 0);
  const rankOp = tl.channel('rankOp', 1);

  // table
  const listU = tl.channel('listU', 0);
  const hostU = tl.channel('hostU', 0);
  const fillU = tl.channel('fillU', 0);
  const readU = tl.channel('readU', 0);
  const readTex = tl.channel('readTex', 0);
  const glowU = tl.channel('glowU', 0);
  const opChipU = tl.channel('opChipU', 0);

  // close
  const leftOp = tl.channel('leftOp', 1);
  const cardU = tl.channel('cardU', 0);

  const CAPTION_AT = [0.4, 9.9, 18.3, 28.5, 36.5, 46.4, 52.9, 61.6, 71.2, 78.6, 90.2, 100.8, 113.8];
  CAPTION_AT.forEach((at, i) => tl.set(src, i, Math.max(0, at - 0.1)));
  const out = (ch: ChannelRef<number>, at: number, dur = 0.5) =>
    tl.tween(ch, 0, { at, dur, ease: ease.move });

  // — B0 · the loop stops; the program can't —
  tl.caption({ at: 0.4, dur: 9.1, text: 'A Javascript loop can stop early: find the first row that fails, and quit. The program can\'t, because every operation runs on every evaluation.' });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(codeA, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 1.0, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_ROWS, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.tween(needleU, 1, { at: 2.2, dur: 0.9, ease: ease.move });
  tl.tween(curU, 1, { at: 2.7, dur: 0.5, ease: ease.enter });
  [1, 2, 3].forEach((r, i) => {
    const at = 3.4 + i * 0.7;
    tl.tween(curRow, r, { at, dur: 0.4, ease: ease.move });
    tl.set(checkIdx, r, at + 0.4);
  });
  tl.tween(stopU, 1, { at: 5.2, dur: 0.5, ease: ease.pop });
  tl.tween(row4Dim, 1, { at: 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(panelU, 1, { at: 6.3, dur: 0.6, ease: ease.enter });
  tl.tween(flashU, 1, { at: 7.2, dur: 0.3, ease: ease.pop });
  tl.tween(flashU, 0, { at: 7.6, dur: 0.6, ease: ease.move });
  tl.tween(everyU, 1, { at: 7.3, dur: 0.5, ease: ease.enter });
  tl.hold(9.5, 0.4);

  // — B1 · four answers —
  tl.caption({ at: 9.9, dur: 8, text: 'So a loop becomes one of four things: a count, a tree, a table, or the same work on every item.' });
  tl.tween(cam, CAMERA_HOME, { at: 9.9, dur: 1.1, ease: ease.move });
  tl.tween(fiOp, 0.35, { at: 10.0, dur: 0.6, ease: ease.move });
  tl.tween(blocksOp, 0.35, { at: 10.0, dur: 0.6, ease: ease.move });
  tl.tween(codeA, 0.35, { at: 10.0, dur: 0.6, ease: ease.move });
  tl.tween(menuU, 1, { at: 10.4, dur: 0.7, ease: ease.enter });
  [m0, m1, m2, m3].forEach((m, i) => {
    const at = [13.2, 13.9, 14.5, 15.2][i];
    tl.tween(m, 1, { at, dur: 0.3, ease: ease.pop });
    tl.tween(m, 0.35, { at: at + 0.9, dur: 0.5, ease: ease.move });
  });
  tl.hold(17.9, 0.4);

  // — B2 · test every row at once —
  tl.caption({ at: 18.3, dur: 9.8, text: 'Which row holds the pointer? Test every row at once, bottom at or above the pointer. At ninety the bits read one, one, one, zero, zero.' });
  tl.tween(cam, CAM_ROWS, { at: 18.3, dur: 1.2, ease: ease.move });
  out(menuU, 18.3, 0.5);
  tl.tween(fiOp, 1, { at: 18.4, dur: 0.6, ease: ease.move });
  tl.tween(blocksOp, 1, { at: 18.4, dur: 0.6, ease: ease.move });
  tl.tween(m0, 1, { at: 18.4, dur: 0.6, ease: ease.move });
  out(codeA, 18.5, 0.4);
  tl.tween(codeB, 1, { at: 18.8, dur: 0.6, ease: ease.enter });
  tl.tween(curU, 0.25, { at: 18.6, dur: 0.6, ease: ease.move });
  tl.tween(stopU, 0.25, { at: 18.6, dur: 0.6, ease: ease.move });
  tl.tween(everyU, 0, { at: 18.6, dur: 0.5, ease: ease.move });
  tl.tween(testU, 1, { at: 20.6, dur: 0.7, ease: ease.move });
  tl.tween(bitsW, 5.6, { at: 24.0, dur: 0.9, ease: ease.linear });
  tl.hold(28.1, 0.4);

  // — B3 · count the ones —
  tl.caption({ at: 28.5, dur: 7.6, text: 'Count the ones: three. The loop returns index three too, because the bits never go back from zero to one.' });
  tl.tween(sumU, 1, { at: 28.8, dur: 1.0, ease: ease.move });
  tl.tween(sigmaU, 1, { at: 29.6, dur: 0.5, ease: ease.pop });
  tl.tween(curU, 1, { at: 30.4, dur: 0.5, ease: ease.move });
  tl.tween(stopU, 1, { at: 30.4, dur: 0.5, ease: ease.move });
  tl.tween(ringU, 1, { at: 30.6, dur: 0.6, ease: ease.enter });
  tl.set(checkIdx, 4, 31.4);
  tl.tween(sameU, 1, { at: 31.4, dur: 0.5, ease: ease.pop });
  tl.tween(flipU, 1, { at: 32.8, dur: 0.8, ease: ease.draw });
  tl.tween(idxTexU, 1, { at: 33.6, dur: 0.6, ease: ease.enter });
  tl.hold(36.1, 0.4);

  // — B4 · the scatter: count beats tree —
  tl.caption({ at: 36.5, dur: 9.5, text: 'At sixty-four rows, that is a hundred ninety-five operations in three layers. A tree for the first hit takes four hundred forty-seven, in thirty-four layers.' });
  tl.tween(cam, CAMERA_HOME, { at: 36.5, dur: 1.2, ease: ease.move });
  tl.tween(fiOp, 0.35, { at: 36.6, dur: 0.6, ease: ease.move });
  tl.tween(blocksOp, 0.35, { at: 36.6, dur: 0.6, ease: ease.move });
  tl.tween(codeB, 0.35, { at: 36.6, dur: 0.6, ease: ease.move });
  tl.tween(scatU, 1, { at: 37.2, dur: 1.4, ease: ease.draw });
  tl.tween(menuU, 1, { at: 36.6, dur: 0.6, ease: ease.move });
  tl.tween(pC, 1, { at: 39.2, dur: 0.5, ease: ease.pop });
  tl.tween(pT, 1, { at: 42.6, dur: 0.5, ease: ease.pop });
  tl.tween(arrTC, 1, { at: 43.6, dur: 1.1, ease: ease.move });
  tl.hold(46.0, 0.4);

  // — B5 · the monotone caveat —
  tl.caption({ at: 46.4, dur: 6.1, text: 'It only works while the bits flip once. Unsorted row bottoms give a wrong row, silently.' });
  tl.tween(scatOp, 0.35, { at: 46.4, dur: 0.6, ease: ease.move });
  out(codeB, 46.4, 0.5);
  tl.tween(exU, 1, { at: 46.6, dur: 0.6, ease: ease.enter });
  tl.tween(exBits, 1, { at: 47.3, dur: 0.6, ease: ease.enter });
  tl.tween(exSigma, 1, { at: 47.9, dur: 0.5, ease: ease.pop });
  tl.tween(exLoop, 1, { at: 48.5, dur: 0.6, ease: ease.enter });
  tl.tween(exFlag, 1, { at: 49.3, dur: 0.5, ease: ease.pop });
  out(exU, 51.6, 0.7);
  tl.hold(52.5, 0.4);

  // — B6 · running totals are a chain —
  tl.caption({ at: 52.9, dur: 8.7, text: 'Running totals are a chain: each total reads the one before it, so at 1,024 rows the chain is 1,023 layers deep.' });
  out(fiOp, 52.6, 0.6);
  tl.tween(blocksOp, 1, { at: 52.6, dur: 0.6, ease: ease.move });
  tl.tween(m0, 0.35, { at: 52.9, dur: 0.5, ease: ease.move });
  tl.tween(m1, 1, { at: 52.9, dur: 0.5, ease: ease.move });
  tl.tween(codeC, 1, { at: 53.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_TREE, { at: 53.0, dur: 1.2, ease: ease.move });
  out(menuU, 53.0, 0.5);
  tl.tween(barsU, 1, { at: 53.5, dur: 1.3, ease: ease.move });
  tl.tween(chainU, 4, { at: 55.0, dur: 2.8, ease: ease.linear });
  tl.tween(chainTag, 1, { at: 57.6, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 58.3, dur: 1.1, ease: ease.move });
  tl.tween(menuU, 1, { at: 58.4, dur: 0.6, ease: ease.move });
  tl.tween(scatOp, 1, { at: 58.8, dur: 0.6, ease: ease.move });
  tl.tween(pH, 1, { at: 59.5, dur: 0.5, ease: ease.pop });
  tl.hold(61.2, 0.4);

  // — B7 · a Brent-Kung network —
  tl.caption({ at: 61.6, dur: 9.2, text: 'Combine in pairs, then pairs of pairs: a layout called a Brent-Kung network gives every total in eighteen layers, for two thousand thirty-six operations.' });
  tl.tween(treeU, 1, { at: 61.9, dur: 1.4, ease: ease.move });
  tl.tween(arrHB, 1, { at: 64.6, dur: 1.1, ease: ease.move });
  tl.tween(pB, 1, { at: 65.5, dur: 0.5, ease: ease.pop });
  tl.hold(70.8, 0.4);

  // — B7b · exact in any grouping: the tree's totals are the loop's —
  tl.caption({ at: 71.2, dur: 7.0, text: 'Whole numbers below about sixteen million add exactly in any grouping, so the tree\'s totals match the loop\'s.' });
  tl.tween(exactU, 1, { at: 71.4, dur: 0.6, ease: ease.enter });
  tl.tween(matchU, 1, { at: 74.4, dur: 0.7, ease: ease.enter });
  tl.tween(matchU, 2, { at: 75.4, dur: 0.7, ease: ease.enter });
  tl.hold(78.2, 0.4);

  // — B8 · a sort needs no sorting —
  tl.caption({ at: 78.6, dur: 11.2, text: 'A sort needs no sorting. With keys on a grid, one comparison bit per pair, summed per item, gives each rank: at sixty-four items, 4,096 operations in three layers.' });
  out(totalsOp, 78.5, 0.6);
  out(blocksOp, 78.5, 0.6);
  out(codeC, 78.5, 0.5);
  tl.tween(scatOp, 0.35, { at: 78.5, dur: 0.6, ease: ease.move });
  tl.tween(m1, 0.35, { at: 78.6, dur: 0.5, ease: ease.move });
  tl.tween(m3, 1, { at: 78.6, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_RANK, { at: 78.8, dur: 1.2, ease: ease.move });
  out(menuU, 78.7, 0.5);
  tl.tween(codeE, 1, { at: 79.0, dur: 0.6, ease: ease.enter });
  tl.tween(rankU, 1, { at: 79.3, dur: 0.7, ease: ease.enter });
  tl.tween(rankFill, 1, { at: 81.3, dur: 1.6, ease: ease.linear });
  tl.tween(rankSums, 1, { at: 83.1, dur: 0.5, ease: ease.pop });
  tl.tween(rankTex, 1, { at: 83.6, dur: 0.6, ease: ease.enter });
  tl.tween(tieU, 1, { at: 84.1, dur: 0.6, ease: ease.enter });
  tl.tween(fallU, 1, { at: 84.9, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 86.8, dur: 1.1, ease: ease.move });
  tl.tween(menuU, 1, { at: 86.9, dur: 0.6, ease: ease.move });
  tl.tween(scatOp, 1, { at: 87.2, dur: 0.6, ease: ease.move });
  tl.tween(pS, 1, { at: 87.9, dur: 0.5, ease: ease.pop });
  tl.hold(89.8, 0.4);

  // — B9 · a table JavaScript writes —
  tl.caption({ at: 90.2, dur: 10.2, text: 'If data rarely changes, let Javascript run the loop and write the answers into cells. The program reads one in a single operation, at any table size.' });
  out(rankOp, 90.1, 0.6);
  out(codeE, 90.1, 0.5);
  tl.tween(scatOp, 0.35, { at: 90.1, dur: 0.6, ease: ease.move });
  tl.tween(m3, 0.35, { at: 90.2, dur: 0.5, ease: ease.move });
  tl.tween(m2, 1, { at: 90.2, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_TABLE, { at: 90.4, dur: 1.2, ease: ease.move });
  out(menuU, 90.3, 0.5);
  tl.tween(codeF, 1, { at: 90.6, dur: 0.6, ease: ease.enter });
  tl.tween(listU, 1, { at: 90.9, dur: 0.7, ease: ease.enter });
  tl.tween(hostU, 1, { at: 91.5, dur: 0.6, ease: ease.enter });
  tl.tween(fillU, 24, { at: 92.0, dur: 2.6, ease: ease.linear });
  tl.tween(readU, 1, { at: 95.4, dur: 0.6, ease: ease.enter });
  tl.tween(readTex, 1, { at: 96.0, dur: 0.6, ease: ease.enter });
  tl.tween(glowU, 1, { at: 96.6, dur: 0.5, ease: ease.pop });
  tl.tween(codeG, 1, { at: 97.0, dur: 0.6, ease: ease.enter });
  tl.tween(opChipU, 1, { at: 97.3, dur: 0.5, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 98.1, dur: 1.1, ease: ease.move });
  tl.tween(menuU, 1, { at: 98.2, dur: 0.6, ease: ease.move });
  tl.tween(scatOp, 1, { at: 98.4, dur: 0.6, ease: ease.move });
  tl.tween(pR, 1, { at: 99.2, dur: 0.5, ease: ease.pop });
  tl.hold(100.4, 0.4);

  // — B10 · work vs waiting (everything but the scatter leaves, so nothing hangs clipped at the edge) —
  tl.caption({ at: 100.8, dur: 12.6, text: 'Fewer layers is not always faster: on a processor, time follows operations, and the tree can lose. On a graphics card, a whole level of the tree runs as one batch of parallel work.' });
  out(leftOp, 100.8, 0.7);
  out(codeF, 100.8, 0.6);
  out(codeG, 100.8, 0.6);
  out(titleU, 100.8, 0.5);
  out(menuU, 100.8, 0.8);
  tl.tween(cam, CAM_SCATTER, { at: 100.9, dur: 1.3, ease: ease.move });
  tl.set(arrTC, 0, 102.5);
  tl.tween(arrTC, 1, { at: 102.5, dur: 1.0, ease: ease.move });
  tl.set(arrHB, 0, 102.9);
  tl.tween(arrHB, 1, { at: 102.9, dur: 1.0, ease: ease.move });
  tl.tween(xGlow, 1, { at: 104.4, dur: 0.6, ease: ease.enter });
  tl.tween(yGlow, 1, { at: 107.4, dur: 0.6, ease: ease.enter });
  tl.hold(113.4, 0.4);

  // — B11 · close: every test runs, a count picks —
  tl.caption({ at: 113.8, dur: 6.9, text: 'So a loop ends up like the branch did: every test runs, and a count picks the winner.' });
  tl.tween(cam, CAMERA_HOME, { at: 113.8, dur: 1.2, ease: ease.move });
  tl.tween(scatOp, 0.15, { at: 113.8, dur: 0.8, ease: ease.move });
  out(xGlow, 113.8, 0.6);
  out(yGlow, 113.8, 0.6);
  tl.tween(titleU, 1, { at: 114.5, dur: 0.6, ease: ease.enter });
  tl.tween(cardU, 1, { at: 114.6, dur: 0.8, ease: ease.enter });
  tl.hold(120.7, 2.5);

  return {
    tl, cam, src, titleU, codeA, codeB, codeC, codeE, codeF, codeG,
    rowsU, blocksOp, fiOp, needleU, curU, curRow, checkIdx, stopU, row4Dim, panelU, flashU, everyU, testU, bitsW,
    sumU, sigmaU, ringU, sameU, flipU, idxTexU,
    menuU, m0, m1, m2, m3,
    scatU, scatOp, pC, pT, pH, pB, pS, pR, arrTC, arrHB, xGlow, yGlow,
    exU, exBits, exSigma, exLoop, exFlag,
    barsU, chainU, chainTag, treeU, exactU, matchU, totalsOp,
    rankU, rankFill, rankSums, rankTex, tieU, fallU, rankOp,
    listU, hostU, fillU, readU, readTex, glowU, opChipU,
    leftOp, cardU,
  };
}

const scene = buildScene();
type Scene = typeof scene;

// ---------------------------------------------------------------------------
// Glyph kit (book-wide specs, local copy)
// ---------------------------------------------------------------------------

/** The bit: solid amber disc when 1, hollow ring when 0. */
function BitDisc({ x, y, b, r = 11, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.002) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 0.5 ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={2} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={700} fill={b >= 0.5 ? DARK : colors.WARM}>
        {b >= 0.5 ? '1' : '0'}
      </text>
    </g>
  );
}

/** Verbatim code chip: mono 14 px, panel fill, 1 px grid border, role stripe on the left. */
function CodeChip({ x, y, lines, opacity, stripe = colors.MUTED, size = 14 }: { x: number; y: number; lines: string[]; opacity: number; stripe?: string; size?: number }) {
  if (opacity <= 0.002) return null;
  const lh = size + 6;
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.602 + 30;
  const h = lines.length * lh + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} strokeWidth={1} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 6 + lh * (i + 1) - 6} fontFamily={MONO} fontSize={size} fill={INK} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
    </g>
  );
}

function Label({ x, y, children, size = 13, fill = colors.MUTED, anchor = 'start', mono = false, weight = 400, opacity = 1 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.002) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontFamily={mono ? MONO : UI} fontWeight={weight} opacity={opacity} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>
      {children}
    </text>
  );
}

/** Quadratic curve from a to b bent by `bend`, drawn up to fraction u, with a head at the tip. */
function GrowArrow({ a, b, bend, u, color, width = 2.2, opacity = 1 }: { a: [number, number]; b: [number, number]; bend: number; u: number; color: string; width?: number; opacity?: number }) {
  if (u <= 0.002 || opacity <= 0.002) return null;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const c: [number, number] = [mx - (dy / len) * bend, my + (dx / len) * bend];
  const at = (t: number): [number, number] => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  const n = 28;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const p = at((u * i) / n);
    pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  }
  const tip = at(u);
  const back = at(Math.max(0, u - 0.04));
  const ang = Math.atan2(tip[1] - back[1], tip[0] - back[0]);
  const hl = 9;
  const head = [
    [tip[0], tip[1]],
    [tip[0] - hl * Math.cos(ang - 0.45), tip[1] - hl * Math.sin(ang - 0.45)],
    [tip[0] - hl * Math.cos(ang + 0.45), tip[1] - hl * Math.sin(ang + 0.45)],
  ].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  return (
    <g opacity={opacity}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={head} fill={color} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const CHECKS: Array<{ text: string; color: string }> = [
  { text: 'JavaScript, row 0:  is 90 < 40?  no, keep going', color: colors.NEGATIVE },
  { text: 'JavaScript, row 1:  is 90 < 80?  no, keep going', color: colors.NEGATIVE },
  { text: 'JavaScript, row 2:  is 90 < 80?  no, keep going', color: colors.NEGATIVE },
  { text: 'JavaScript, row 3:  is 90 < 140?  yes: stop, return 3', color: colors.POSITIVE },
  { text: 'the loop returns 3  ·  the count is 3  ✓ same answer', color: colors.POSITIVE },
];

function RowList({ s, sc }: { s: SceneState; sc: Scene }) {
  const op = s.get(sc.blocksOp) * s.get(sc.leftOp) * s.get(sc.totalsOp);
  if (op <= 0.002) return null;
  const rowsU = s.get(sc.rowsU);
  const barsU = s.get(sc.barsU);
  const row4Dim = s.get(sc.row4Dim);
  const ringU = s.get(sc.ringU);
  const listLabels = 1 - clamp01(barsU * 2);
  const barLabels = clamp01(barsU * 2 - 1);
  return (
    <g opacity={op}>
      {/* ruler with the row bottoms as ticks */}
      <g opacity={rowsU * listLabels}>
        <line x1={RULER_X} y1={yOf(0)} x2={RULER_X} y2={yOf(180)} stroke={colors.MUTED} strokeWidth={1.5} />
        {[0, 40, 80, 140, 180].map((v) => (
          <g key={v}>
            <line x1={RULER_X - 5} y1={yOf(v)} x2={RULER_X} y2={yOf(v)} stroke={colors.MUTED} strokeWidth={1.5} />
            <Label x={RULER_X - 8} y={yOf(v) + 4.5} anchor="end" mono>{String(v)}</Label>
          </g>
        ))}
        <Label x={60} y={156} size={14} fill={INK} weight={600}>JavaScript: stops</Label>
      </g>
      {HEIGHTS.map((h, i) => {
        const enter = clamp01(rowsU * 5 - i);
        if (enter <= 0) return null;
        const isLast = i === 4;
        // list geometry → bar geometry (rows 0..3 become h0..h3; row 4 leaves)
        const u = isLast ? 0 : barsU;
        const x0 = lerp(BLK.x, COL_X[Math.min(i, 3)] - BAR_W / 2, u);
        const w = lerp(BLK.w, BAR_W, u);
        const y0 = lerp(yOf(TOPS[i]), BAR_BASE - h * BAR_SCALE, u);
        const y1 = lerp(yOf(BOTTOMS[i]), BAR_BASE, u);
        const rowOp = isLast ? (1 - 0.6 * row4Dim) * (1 - barsU) : 1;
        if (rowOp <= 0.002) return null;
        const hh = Math.max(0, y1 - y0);
        return (
          <g key={i} opacity={enter * rowOp}>
            {hh > 0.5 ? (
              <rect x={x0} y={y0} width={w} height={hh} rx={4} fill={colors.ACCENT} fillOpacity={0.13} stroke={colors.ACCENT} strokeOpacity={0.75} strokeWidth={1.5} />
            ) : (
              <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="5 4" />
            )}
            {/* list labels */}
            <g opacity={listLabels}>
              {i === 2 ? (
                <Label x={BLK.x + BLK.w + 6} y={yOf(80) - 4}>row 2</Label>
              ) : (
                <Label x={BLK.x + 10} y={i === 3 ? yOf(118) : ROW_CY[i] + (isLast ? -4 : 4.5)} fill={INK}>{`row ${i}`}</Label>
              )}
              {i === 2 && <Label x={BLK.x + BLK.w + 6} y={yOf(80) + 12} size={13}>0 tall</Label>}
              {isLast && <Label x={BLK.x + 10} y={ROW_CY[4] + 15} fill={colors.NEGATIVE} opacity={row4Dim}>never visited</Label>}
            </g>
            {/* bar labels */}
            {!isLast && (
              <Label x={COL_X[i]} y={BAR_BASE + 18} anchor="middle" fill={INK} mono opacity={barLabels}>{`h${i} · ${h}`}</Label>
            )}
          </g>
        );
      })}
      {/* row 3 holds the pointer: the count's answer */}
      {ringU > 0.002 && listLabels > 0.002 && (
        <g opacity={ringU * listLabels}>
          <rect x={BLK.x - 5} y={yOf(80) - 5} width={BLK.w + 10} height={yOf(140) - yOf(80) + 10} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <Label x={BLK.x + 10} y={yOf(136)} fill={colors.POSITIVE} weight={700}>index 3</Label>
        </g>
      )}
    </g>
  );
}

function FindIndex({ s, sc }: { s: SceneState; sc: Scene }) {
  const op = s.get(sc.fiOp) * s.get(sc.leftOp);
  if (op <= 0.002) return null;
  const needleU = s.get(sc.needleU);
  const curU = s.get(sc.curU);
  const curRow = s.get(sc.curRow);
  const checkIdx = Math.round(s.get(sc.checkIdx));
  const stopU = s.get(sc.stopU);
  const panelU = s.get(sc.panelU);
  const flashU = s.get(sc.flashU);
  const everyU = s.get(sc.everyU);
  const testU = s.get(sc.testU);
  const bitsW = s.get(sc.bitsW);
  const sumU = s.get(sc.sumU);
  const sigmaU = s.get(sc.sigmaU);
  const sameU = s.get(sc.sameU);
  const flipU = s.get(sc.flipU);
  const idxTexU = s.get(sc.idxTexU);
  const r0 = Math.floor(curRow);
  const r1 = Math.min(4, r0 + 1);
  const cy = lerp(ROW_CY[r0], ROW_CY[r1], curRow - r0);
  const check = CHECKS[Math.max(0, Math.min(CHECKS.length - 1, checkIdx))];
  const showSame = checkIdx >= 4 ? sameU : 1;
  return (
    <g opacity={op}>
      {/* needle: pointerY = 90 */}
      {needleU > 0.002 && (
        <g opacity={clamp01(needleU * 2)}>
          <line x1={RULER_X - 10} y1={NEEDLE_Y} x2={lerp(RULER_X - 10, 586, needleU)} y2={NEEDLE_Y} stroke={colors.WARM} strokeWidth={2} />
          <circle cx={RULER_X - 10} cy={NEEDLE_Y} r={4} fill={colors.WARM} />
          <Label x={BLK.x + 10} y={NEEDLE_Y + 17} fill={colors.WARM} mono opacity={clamp01(needleU * 2 - 1)}>pointerY = 90</Label>
        </g>
      )}
      {/* the JavaScript cursor */}
      {curU > 0.002 && (
        <g>
          <g opacity={curU}>
            <polygon points={`${CURSOR_X},${cy - 9} ${CURSOR_X + 16},${cy} ${CURSOR_X},${cy + 9}`} fill={INK} />
          </g>
          {[0, 1, 2, 3].map((r) => {
            const seen = clamp01((curRow - r) * 3 + 1) * (checkIdx >= r ? 1 : 0);
            if (seen <= 0) return null;
            const ok = r === 3;
            return (
              <Label key={r} x={CURSOR_X + 32} y={ROW_CY[r] + 5} anchor="middle" size={15} weight={700} fill={ok ? colors.POSITIVE : colors.NEGATIVE} opacity={Math.max(0.25, curU) * seen}>
                {ok ? '✓' : '✗'}
              </Label>
            );
          })}
          {/* stop sign beside row 3 */}
          {stopU > 0.002 && (
            <g opacity={clamp01(stopU)} transform={`translate(${BLK.x + BLK.w + 26}, ${ROW_CY[3]}) scale(${0.6 + 0.4 * stopU})`}>
              <polygon
                points={Array.from({ length: 8 }, (_, k) => {
                  const a = Math.PI / 8 + (k * Math.PI) / 4;
                  return `${(19 * Math.cos(a)).toFixed(1)},${(19 * Math.sin(a)).toFixed(1)}`;
                }).join(' ')}
                fill={colors.NEGATIVE}
              />
              <text y={4.5} textAnchor="middle" fontFamily={UI} fontSize={13} fontWeight={800} fill={DARK}>stop</text>
            </g>
          )}
          <Label x={60} y={504} size={14} mono fill={check.color} opacity={Math.max(curU, 0.35) * showSame}>{check.text}</Label>
        </g>
      )}
      {/* the program: five tests, no stop */}
      {panelU > 0.002 && (
        <g opacity={panelU}>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={12} fill={colors.PANEL} fillOpacity={0.85} stroke={colors.MUTED} strokeOpacity={0.6} strokeDasharray="7 5" />
          <Label x={PANEL.x + 16} y={PANEL.y + 22} size={14} fill={INK} weight={600}>program: no stop</Label>
          <Label x={PANEL.x + PANEL.w - 14} y={PANEL.y + 22} anchor="end" fill={colors.WARM} opacity={everyU}>every operation, every evaluation</Label>
          {BOTTOMS.map((b, i) => {
            const y = ROW_CY[i] - TILE.h / 2;
            const bitU = clamp01(bitsW - i);
            return (
              <g key={i}>
                <rect x={TILE.x} y={y} width={TILE.w} height={TILE.h} rx={5} fill={colors.WARM} fillOpacity={0.06 + 0.3 * flashU} stroke={flashU > 0.01 ? colors.WARM : colors.MUTED} strokeOpacity={0.5 + 0.5 * flashU} strokeWidth={1 + 1.5 * flashU} />
                <Label x={TILE.x + TILE.w / 2} y={y + 18} anchor="middle" mono fill={INK} opacity={1 - testU}>[bottom ≤ y]</Label>
                <Label x={TILE.x + TILE.w / 2} y={y + 18} anchor="middle" mono fill={INK} opacity={testU}>{`[${b} ≤ 90]`}</Label>
                <BitDisc x={DISC_X} y={ROW_CY[i]} b={BITS[i]} opacity={bitU * (1 - 0.0 * sumU)} />
              </g>
            );
          })}
          {/* the ones slide into the sum */}
          {sumU > 0.002 &&
            [0, 1, 2].map((i) => {
              const u = sumU;
              const x = lerp(DISC_X, SIGMA.x - 18 + i * 18, u);
              const y = lerp(ROW_CY[i], SIGMA.y + 6, u);
              return <BitDisc key={i} x={x} y={y} b={1} r={11 - 3 * u} opacity={1 - clamp01((u - 0.85) * 6) * clamp01(sigmaU * 2)} />;
            })}
          {sigmaU > 0.002 && (
            <g opacity={clamp01(sigmaU)} transform={`translate(${SIGMA.x}, ${SIGMA.y}) scale(${0.7 + 0.3 * sigmaU})`}>
              <rect x={-40} y={-24} width={80} height={48} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
              <text x={-24} y={9} textAnchor="middle" fontFamily={UI} fontSize={22} fill={colors.WARM}>Σ</text>
              <text x={14} y={11} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={700} fill={colors.WARM}>{COUNT}</text>
            </g>
          )}
          {/* the bits flip once and never back */}
          {flipU > 0.002 && (
            <g opacity={clamp01(flipU * 1.5)}>
              <polyline
                points={`${DISC_X + 20},${ROW_CY[0]} ${DISC_X + 26},${ROW_CY[0]} ${DISC_X + 26},${lerp(ROW_CY[0], ROW_CY[4], flipU)}`}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={2}
              />
              <polygon points={`${DISC_X + 21},${ROW_CY[4] - 8} ${DISC_X + 31},${ROW_CY[4] - 8} ${DISC_X + 26},${ROW_CY[4]}`} fill={colors.POSITIVE} opacity={clamp01(flipU * 3 - 2)} />
              <Label x={DISC_X + 38} y={ROW_CY[3] - 6} fill={colors.POSITIVE} opacity={clamp01(flipU * 2 - 1)}>1 1 1, then 0 0:</Label>
              <Label x={DISC_X + 38} y={ROW_CY[3] + 12} fill={colors.POSITIVE} opacity={clamp01(flipU * 2 - 1)}>flips once, never back</Label>
            </g>
          )}
          <MathLabel tex={'\\text{index}=\\sum_i\\,[\\,\\text{bottom}_i\\le y\\,]'} x={PANEL.x + PANEL.w / 2} y={PANEL.y + PANEL.h - 22} fontSize={20} opacity={idxTexU} />
        </g>
      )}
    </g>
  );
}

function MenuBar({ s, sc }: { s: SceneState; sc: Scene }) {
  const menuU = s.get(sc.menuU);
  if (menuU <= 0.002) return null;
  const lit = [s.get(sc.m0), s.get(sc.m1), s.get(sc.m2), s.get(sc.m3)];
  const slide = (1 - clamp01(menuU)) * 24;
  return (
    <g opacity={clamp01(menuU)} transform={`translate(0, ${slide})`}>
      {MENU.map((m, i) => {
        const L = lit[i];
        const gx = m.x + 14;
        const gy = MENU_Y + 24;
        const glyph = (() => {
          const st = { stroke: colors.WARM, strokeWidth: 1.6, fill: 'none' } as const;
          if (i === 0)
            return (
              <g>
                {[0, 1, 2, 3, 4].map((k) => (
                  <circle key={k} cx={gx + 4 + k * 9} cy={gy} r={3.4} fill={k < 3 ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={1.3} />
                ))}
              </g>
            );
          if (i === 1)
            return (
              <g {...st}>
                <polyline points={`${gx},${gy + 8} ${gx + 9},${gy} ${gx + 18},${gy + 8}`} />
                <polyline points={`${gx + 22},${gy + 8} ${gx + 31},${gy} ${gx + 40},${gy + 8}`} />
                <polyline points={`${gx + 9},${gy} ${gx + 20},${gy - 9} ${gx + 31},${gy}`} />
              </g>
            );
          if (i === 2)
            return (
              <g>
                {[0, 1, 2].map((r) =>
                  [0, 1, 2].map((c) => (
                    <rect key={`${r}${c}`} x={gx + c * 9} y={gy - 12 + r * 9} width={7} height={7} rx={1} fill={r === 2 && c === 1 ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={1.1} />
                  )),
                )}
              </g>
            );
          return (
            <g>
              {[0, 1, 2].map((k) => (
                <g key={k}>
                  <rect x={gx + k * 14} y={gy - 7} width={11} height={14} rx={2} fill="none" stroke={colors.WARM} strokeWidth={1.3} />
                  <circle cx={gx + k * 14 + 5.5} cy={gy} r={2} fill={colors.WARM} />
                </g>
              ))}
            </g>
          );
        })();
        return (
          <g key={i} opacity={L}>
            <rect x={m.x} y={MENU_Y} width={m.w} height={46} rx={9} fill={colors.PANEL} stroke={L > 0.6 ? colors.WARM : colors.MUTED} strokeOpacity={0.8} strokeWidth={L > 0.6 ? 2 : 1} />
            {glyph}
            <Label x={m.x + 64} y={MENU_Y + 28} size={14} fill={INK}>{m.label}</Label>
          </g>
        );
      })}
    </g>
  );
}

function Caveat({ s, sc }: { s: SceneState; sc: Scene }) {
  const exU = s.get(sc.exU);
  if (exU <= 0.002) return null;
  const bitsU = s.get(sc.exBits);
  const sigU = s.get(sc.exSigma);
  const loopU = s.get(sc.exLoop);
  const flagU = s.get(sc.exFlag);
  const ey = (u: number): number => 204 + u * 2.6;
  const LANE_X = [150, 222, 294];
  const TILE_Y = [228, 278, 328];
  return (
    <g opacity={exU}>
      <rect x={52} y={138} width={726} height={370} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeOpacity={0.55} strokeWidth={1.5} />
      <Label x={72} y={168} size={14} fill={INK}>a height of −10 px: the bottoms are 40, 30, 80 · pointerY = 35</Label>
      {/* ruler */}
      <line x1={126} y1={ey(0)} x2={126} y2={ey(80)} stroke={colors.MUTED} strokeWidth={1.5} />
      {[0, 30, 40, 80].map((v) => (
        <g key={v}>
          <line x1={121} y1={ey(v)} x2={126} y2={ey(v)} stroke={colors.MUTED} strokeWidth={1.5} />
          <Label x={116} y={ey(v) + 4.5} anchor="end" mono>{String(v)}</Label>
        </g>
      ))}
      {EX_HEIGHTS.map((h, i) => {
        const a = Math.min(EX_TOPS[i], EX_BOTTOMS[i]);
        const b = Math.max(EX_TOPS[i], EX_BOTTOMS[i]);
        const neg = h < 0;
        return (
          <g key={i}>
            <rect x={LANE_X[i]} y={ey(a)} width={60} height={ey(b) - ey(a)} rx={4} fill={neg ? colors.NEGATIVE : colors.ACCENT} fillOpacity={0.14} stroke={neg ? colors.NEGATIVE : colors.ACCENT} strokeOpacity={0.8} strokeWidth={1.5} strokeDasharray={neg ? '5 3' : undefined} />
            <Label x={LANE_X[i] + 30} y={ey(80) + 22} anchor="middle" fill={INK}>{`row ${i}`}</Label>
            <Label x={LANE_X[i] + 30} y={ey(80) + 40} anchor="middle" mono fill={neg ? colors.NEGATIVE : colors.MUTED}>{`h ${h}`}</Label>
          </g>
        );
      })}
      <line x1={116} y1={ey(EX_Y)} x2={372} y2={ey(EX_Y)} stroke={colors.WARM} strokeWidth={2} />
      {/* the program's tests */}
      {EX_BOTTOMS.map((b, i) => (
        <g key={i}>
          <rect x={440} y={TILE_Y[i] - 13} width={150} height={26} rx={5} fill={colors.WARM} fillOpacity={0.06} stroke={colors.MUTED} strokeOpacity={0.6} />
          <Label x={515} y={TILE_Y[i] + 5} anchor="middle" mono fill={INK}>{`[${b} ≤ 35]`}</Label>
          <BitDisc x={615} y={TILE_Y[i]} b={EX_BITS[i]} opacity={bitsU} />
        </g>
      ))}
      <Label x={632} y={TILE_Y[0] + 30} fill={colors.NEGATIVE} weight={700} opacity={bitsU}>0 → 1</Label>
      {sigU > 0.002 && (
        <g opacity={clamp01(sigU)} transform={`translate(705, ${TILE_Y[2] + 4}) scale(${0.7 + 0.3 * sigU})`}>
          <rect x={-40} y={-22} width={80} height={44} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text x={-22} y={8} textAnchor="middle" fontFamily={UI} fontSize={20} fill={colors.WARM}>Σ</text>
          <text x={14} y={10} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={700} fill={colors.WARM}>{EX_COUNT}</text>
        </g>
      )}
      <Label x={440} y={400} size={14} mono fill={colors.WARM} opacity={sigU}>{`count of ones: ${EX_COUNT}`}</Label>
      <Label x={440} y={424} size={14} mono fill={colors.POSITIVE} opacity={loopU}>{`loop: 35 < 40 at row 0, returns ${EX_LOOP}`}</Label>
      {flagU > 0.002 && (
        <g opacity={clamp01(flagU)} transform={`translate(560, 468) scale(${0.75 + 0.25 * flagU})`}>
          <rect x={-120} y={-20} width={240} height={40} rx={20} fill={colors.NEGATIVE} fillOpacity={0.18} stroke={colors.NEGATIVE} strokeWidth={2} />
          <text y={6} textAnchor="middle" fontFamily={UI} fontSize={17} fontWeight={700} fill={colors.NEGATIVE}>wrong row, no error</text>
        </g>
      )}
    </g>
  );
}

type NodeId = 't0' | 't1' | 't2' | 't3' | 'u';
const NODE_LABEL: Record<NodeId, string> = {
  t0: `0..0 · ${TREE[0]}`,
  t1: `0..1 · ${TREE[1]}`,
  t2: `0..2 · ${TREE[2]}`,
  t3: `0..3 · ${TREE[3]}`,
  u: `2..3 · ${PAIR23}`,
};

function Totals({ s, sc }: { s: SceneState; sc: Scene }) {
  const op = s.get(sc.totalsOp) * s.get(sc.leftOp);
  const chainU = s.get(sc.chainU);
  if (op <= 0.002 || chainU <= 0.002) return null;
  const treeU = s.get(sc.treeU);
  const tagU = s.get(sc.chainTag);
  const exactU = s.get(sc.exactU);
  const matchU = s.get(sc.matchU);
  const treeRow = clamp01(matchU);
  const loopRow = clamp01(matchU - 1);
  const pos: Record<NodeId, [number, number]> = {
    t0: [COL_X[0], LAYER_Y[0]],
    t1: [COL_X[1], LAYER_Y[1]],
    t2: [COL_X[2], LAYER_Y[2]],
    t3: [COL_X[3], lerp(LAYER_Y[3], LAYER_Y[2], treeU)],
    u: [COL_X[3], LAYER_Y[1]],
  };
  const nodeOp: Record<NodeId, number> = {
    t0: clamp01(chainU * 2),
    t1: clamp01((chainU - 1) * 2),
    t2: clamp01((chainU - 2) * 2),
    t3: clamp01((chainU - 3) * 2),
    u: treeU,
  };
  const barFoot = (i: number): [number, number] => [COL_X[i], BAR_BASE + 26];
  const top = (n: NodeId): [number, number] => [pos[n][0], pos[n][1] - NODE.h / 2];
  const bottom = (n: NodeId): [number, number] => [pos[n][0], pos[n][1] + NODE.h / 2];
  const chainOnly = 1 - treeU;
  const edges: Array<{ a: [number, number]; b: [number, number]; o: number; main: boolean }> = [
    { a: barFoot(0), b: top('t0'), o: nodeOp.t0, main: false },
    { a: bottom('t0'), b: top('t1'), o: nodeOp.t1, main: true },
    { a: barFoot(1), b: top('t1'), o: nodeOp.t1, main: false },
    { a: bottom('t1'), b: top('t2'), o: nodeOp.t2, main: true },
    { a: barFoot(2), b: top('t2'), o: nodeOp.t2, main: false },
    { a: bottom('t2'), b: top('t3'), o: nodeOp.t3 * chainOnly, main: true },
    { a: barFoot(3), b: top('t3'), o: nodeOp.t3 * chainOnly, main: false },
    { a: barFoot(2), b: top('u'), o: treeU, main: false },
    { a: barFoot(3), b: top('u'), o: treeU, main: false },
    { a: [pos.t1[0] + NODE.w / 2, pos.t1[1] + 6], b: [pos.t3[0] - NODE.w / 2 + 10, pos.t3[1] - NODE.h / 2], o: treeU, main: true },
    { a: bottom('u'), b: top('t3'), o: treeU, main: true },
  ];
  const tagA = 1 - treeU;
  const tagB = treeU * (1 - treeRow);
  return (
    <g opacity={op}>
      {/* depth axis */}
      {[1, 2, 3].map((L) => (
        <g key={L} opacity={clamp01((chainU - L) * 2) * (L === 3 ? 1 - treeU : 1)}>
          <line x1={84} y1={LAYER_Y[L]} x2={COL_X[0] - 20} y2={LAYER_Y[L]} stroke={colors.GRID} strokeDasharray="3 5" />
          <Label x={60} y={LAYER_Y[L] + 4.5} fill={colors.MUTED}>{`layer ${L}`}</Label>
        </g>
      ))}
      {edges.map((e, i) =>
        e.o > 0.002 ? (
          <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} stroke={e.main ? colors.WARM : colors.MUTED} strokeOpacity={e.main ? 0.9 : 0.5} strokeWidth={e.main ? 2 : 1.2} opacity={e.o} />
        ) : null,
      )}
      {(Object.keys(pos) as NodeId[]).map((n) => {
        const o = nodeOp[n];
        if (o <= 0.002) return null;
        const [x, y] = pos[n];
        const isNew = n === 'u';
        return (
          <g key={n} opacity={o}>
            <rect x={x - NODE.w / 2} y={y - NODE.h / 2} width={NODE.w} height={NODE.h} rx={6} fill={colors.PANEL} stroke={isNew ? colors.POSITIVE : colors.ACCENT} strokeWidth={1.6} />
            <text x={x} y={y + 5} textAnchor="middle" fontFamily={MONO} fontSize={14} fill={INK}>{NODE_LABEL[n]}</text>
            {!isNew && treeRow > 0.002 && (
              <rect x={x - NODE.w / 2 - 3} y={y - NODE.h / 2 - 3} width={NODE.w + 6} height={NODE.h + 6} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={treeRow} />
            )}
          </g>
        );
      })}
      {/* the depth tag */}
      <g opacity={tagU}>
        <Label x={COL_X[3] + NODE.w / 2 + 16} y={LAYER_Y[3] - 6 - 50 * treeU} fill={colors.WARM} weight={700} opacity={tagA}>chain: n − 1 layers</Label>
        <Label x={COL_X[3] + NODE.w / 2 + 16} y={LAYER_Y[3] + 12 - 50 * treeU} fill={INK} opacity={tagA}>1,024 rows → 1,023 layers</Label>
        {/* the structure behind 2,036 · 18: brentKungPrefix (patterns.md:50, 193) */}
        <Label x={(COL_X[0] + COL_X[3]) / 2} y={LAYER_Y[3] + 2} anchor="middle" size={14} fill={colors.POSITIVE} weight={700} opacity={tagB}>Brent-Kung prefix network</Label>
        <Label x={(COL_X[0] + COL_X[3]) / 2} y={LAYER_Y[3] + 22} anchor="middle" fill={INK} opacity={tagB}>1,024 rows → 2,036 operations, 18 layers</Label>
      </g>
      {/* the tree's totals against the loop's, column by column (patterns.md:34, 39) */}
      {treeRow > 0.002 && (
        <g>
          <g opacity={treeRow}>
            <Label x={60} y={LAYER_Y[3] - 4} size={14} fill={colors.POSITIVE} weight={700}>tree</Label>
            {TREE.map((v, i) => (
              <Label key={i} x={COL_X[i]} y={LAYER_Y[3] - 4} anchor="middle" size={15} mono fill={colors.POSITIVE} weight={700}>{String(v)}</Label>
            ))}
          </g>
          <g opacity={loopRow}>
            {CHAIN.map((_, i) => (
              <Label key={i} x={COL_X[i]} y={LAYER_Y[3] + 13} anchor="middle" size={14} mono fill={colors.MUTED}>=</Label>
            ))}
            <Label x={60} y={LAYER_Y[3] + 30} size={14} fill={INK} weight={700}>loop</Label>
            {CHAIN.map((v, i) => (
              <Label key={i} x={COL_X[i]} y={LAYER_Y[3] + 30} anchor="middle" size={15} mono fill={INK} weight={700}>{String(v)}</Label>
            ))}
            <Label x={COL_X[3] + 44} y={LAYER_Y[3] + 6} size={15} fill={colors.POSITIVE} weight={700}>= loop, bit for bit</Label>
            <MathLabel tex={'(\\text{integers} < 2^{24})'} x={COL_X[3] + 44} y={LAYER_Y[3] + 26} fontSize={16} anchor="start" />
          </g>
        </g>
      )}
      {exactU > 0.002 && (
        <g opacity={exactU}>
          <rect x={52} y={518} width={560} height={40} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.6} />
          <MathLabel tex={'\\text{whole numbers below }2^{24}\\text{ add exactly in any grouping}'} x={68} y={538} fontSize={19} anchor="start" boxWidth={540} />
        </g>
      )}
    </g>
  );
}

function Ranks({ s, sc }: { s: SceneState; sc: Scene }) {
  const op = s.get(sc.rankOp) * s.get(sc.leftOp);
  const rankU = s.get(sc.rankU);
  if (op <= 0.002 || rankU <= 0.002) return null;
  const fill = s.get(sc.rankFill);
  const sums = s.get(sc.rankSums);
  const tex = s.get(sc.rankTex);
  const tie = s.get(sc.tieU);
  const fall = s.get(sc.fallU);
  const offIdx = (i: number, j: number): number => i * 3 + (j > i ? j - 1 : j);
  const values = RANK_BITS.map((row, i) => row.map((v, j) => (i === j ? 0.5 : v)));
  const colCx = (j: number): number => RG.x + j * RG_PITCH + RG.cell / 2;
  const rowCy = (i: number): number => RG.y + i * RG_PITCH + RG.cell / 2;
  return (
    <g opacity={op * rankU}>
      <MatrixGrid
        x={RG.x}
        y={RG.y}
        values={values}
        cell={RG.cell}
        gap={RG.gap}
        cellU={(i, j) => (i === j ? 1 : clamp01(fill * 12 - offIdx(i, j)))}
        fill={(v, i, j) => (i === j ? '#141b2b' : v > 0.5 ? colors.WARM : '#1b2436')}
        showValues={(v) => (v === 0.5 ? '·' : v > 0.5 ? '1' : '0')}
        highlight={{ cell: [2, 0], color: colors.POSITIVE, u: tie }}
      />
      {KEYS.map((_, i) => (
        <Label key={i} x={RG.x - 12} y={rowCy(i) + 5} anchor="end" size={14} fill={colors.MUTED}>{`item ${i}`}</Label>
      ))}
      <Label x={RG.x + 4 * RG_PITCH + 22} y={RG.y - 10} anchor="middle" fill={INK} weight={600} opacity={sums}>rank</Label>
      {RANKS.map((r, i) => (
        <Label key={i} x={RG.x + 4 * RG_PITCH + 22} y={rowCy(i) + 7} anchor="middle" size={20} mono weight={700} fill={colors.WARM} opacity={sums}>{String(r)}</Label>
      ))}
      <Label x={SORTED_X} y={RG.y - 10} anchor="middle" fill={INK} weight={600} opacity={fall}>sorted</Label>
      {[0, 1, 2, 3].map((r) => (
        <rect key={r} x={SORTED_X - CARD.w / 2 - 4} y={rowCy(r) - CARD.h / 2 - 4} width={CARD.w + 8} height={CARD.h + 8} rx={8} fill="none" stroke={colors.GRID} strokeDasharray="4 4" opacity={fall} />
      ))}
      {/* the cards: above their column, then fall to their rank */}
      {KEYS.map((k, j) => {
        const x = lerp(colCx(j), SORTED_X, fall);
        const y = lerp(CARD.y + CARD.h / 2, rowCy(RANKS[j]), fall);
        return (
          <g key={j} transform={`translate(${x}, ${y})`}>
            <rect x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text y={2} textAnchor="middle" fontFamily={MONO} fontSize={18} fontWeight={700} fill={INK}>{k}</text>
            <text y={17} textAnchor="middle" fontFamily={UI} fontSize={13} fill={colors.MUTED}>{`item ${j}`}</text>
          </g>
        );
      })}
      <MathLabel tex={'\\text{rank}_i=\\sum_j b_{ij}'} x={RG.x + 2 * RG_PITCH} y={RG.y + 4 * RG_PITCH + 30} fontSize={24} opacity={tex} />
      <Label x={RG.x + 2 * RG_PITCH} y={RG.y + 4 * RG_PITCH + 74} anchor="middle" fill={colors.POSITIVE} opacity={tie}>ties: the earlier item first</Label>
    </g>
  );
}

function Table({ s, sc }: { s: SceneState; sc: Scene }) {
  const op = s.get(sc.leftOp);
  const listU = s.get(sc.listU);
  if (op <= 0.002 || listU <= 0.002) return null;
  const hostU = s.get(sc.hostU);
  const fillU = s.get(sc.fillU);
  const readU = s.get(sc.readU);
  const readTex = s.get(sc.readTex);
  const glowU = s.get(sc.glowU);
  const opChipU = s.get(sc.opChipU);
  const hostRow = fillU > 0 && fillU < 24 ? Math.floor(fillU / LEVELS) : -1;
  const cellX = (l: number): number => AT.x + l * AT.pitch;
  const cellY = (r: number): number => AT.y + r * AT.pitch;
  const target: [number, number] = [cellX(READ.level) + AT.cell / 2, cellY(READ.row) + AT.cell / 2];
  return (
    <g opacity={op * listU}>
      {/* the host lane */}
      <g opacity={hostU}>
        <rect x={46} y={136} width={464} height={294} rx={12} fill={colors.TEAL} fillOpacity={0.04} stroke={colors.TEAL} strokeOpacity={0.8} strokeDasharray="8 5" strokeWidth={1.5} />
        <Label x={60} y={156} fill={colors.TEAL} weight={700} size={14}>JavaScript writes the table</Label>
      </g>
      <Label x={60} y={180} mono fill={colors.WARM}>depths [0 1 2 1 2 3]</Label>
      {DEPTHS.map((d, r) => {
        const y = LIST.y + r * LIST.pitch;
        const on = r === hostRow;
        return (
          <g key={r}>
            <rect x={LIST.x + d * LIST.indent} y={y} width={LIST.w} height={LIST.h} rx={5} fill={on ? colors.TEAL : colors.ACCENT} fillOpacity={on ? 0.28 : 0.1} stroke={on ? colors.TEAL : colors.ACCENT} strokeOpacity={0.7} />
            <Label x={LIST.x + d * LIST.indent + 10} y={y + 20} fill={INK}>{`row ${r} · depth ${d}`}</Label>
          </g>
        );
      })}
      <Label x={AT.x + 2 * AT.pitch - 3} y={AT.y - 26} anchor="middle" fill={INK} weight={600}>level</Label>
      {[0, 1, 2, 3].map((l) => (
        <Label key={l} x={cellX(l) + AT.cell / 2} y={AT.y - 8} anchor="middle" mono>{String(l)}</Label>
      ))}
      {ANCESTOR.map((row, r) =>
        row.map((v, l) => {
          const k = r * LEVELS + l;
          const u = clamp01(fillU - k);
          const isRead = k === READ_CELL;
          const g = isRead ? glowU : 0;
          return (
            <g key={k}>
              <rect x={cellX(l)} y={cellY(r)} width={AT.cell} height={AT.cell} rx={5} fill={g > 0.5 ? colors.WARM : colors.TEAL} fillOpacity={g > 0.5 ? 0.95 : 0.06 + 0.16 * u} stroke={g > 0.01 ? colors.WARM : colors.GRID} strokeWidth={g > 0.01 ? 2.5 : 1} />
              <text x={cellX(l) + AT.cell / 2} y={cellY(r) + AT.cell / 2 + 5} textAnchor="middle" fontFamily={MONO} fontSize={15} fontWeight={g > 0.5 ? 700 : 400} fill={g > 0.5 ? DARK : INK} opacity={u}>{v}</text>
            </g>
          );
        }),
      )}
      {/* the program's one read */}
      {readU > 0.002 && (
        <g opacity={readU}>
          <Label x={548} y={160} fill={INK} weight={600} size={14}>the program</Label>
          {[
            { y: 178, text: `row ${READ.row}` },
            { y: 220, text: `level ${READ.level}` },
          ].map((c) => (
            <g key={c.text}>
              <rect x={548} y={c.y} width={90} height={30} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <rect x={548} y={c.y + 27} width={90} height={3} fill={colors.ACCENT} />
              <Label x={593} y={c.y + 20} anchor="middle" mono fill={INK}>{c.text}</Label>
            </g>
          ))}
          <MathLabel tex={'5\\times 4+2=22'} x={548} y={290} fontSize={22} anchor="start" boxWidth={220} color={colors.WARM} opacity={readTex} />
          <GrowArrow a={[560, 312]} b={[target[0] + 20, target[1] - 8]} bend={-30} u={readTex} color={colors.WARM} />
          <Label x={548} y={404} fill={colors.WARM} weight={700} size={14} opacity={glowU}>cell 22 holds 4</Label>
        </g>
      )}
      {opChipU > 0.002 && (
        <g opacity={clamp01(opChipU)}>
          <rect x={608} y={448} width={170} height={36} rx={18} fill={colors.WARM} fillOpacity={0.14} stroke={colors.WARM} strokeWidth={1.6} />
          <Label x={693} y={471} anchor="middle" fill={colors.WARM} weight={700} size={14}>1 operation · 1 layer</Label>
        </g>
      )}
    </g>
  );
}

function Scatter({ s, sc }: { s: SceneState; sc: Scene }) {
  const scatU = s.get(sc.scatU);
  if (scatU <= 0.002) return null;
  const op = s.get(sc.scatOp);
  const xGlow = s.get(sc.xGlow);
  const yGlow = s.get(sc.yGlow);
  const pop: Record<PointId, number> = {
    T: s.get(sc.pT),
    C: s.get(sc.pC),
    H: s.get(sc.pH),
    B: s.get(sc.pB),
    S: s.get(sc.pS),
    R: s.get(sc.pR),
  };
  const axisX = lerp(SC.x0, SC.x1, scatU);
  const axisY = lerp(SC.y0, SC.y1, scatU);
  const ticksU = clamp01(scatU * 2 - 1);
  const xCol = xGlow > 0.01 ? colors.TEAL : colors.MUTED;
  const yCol = yGlow > 0.01 ? colors.WARM : colors.MUTED;
  const yTitleX = 798;
  const yTagX = 778;
  const midY = (SC.y0 + SC.y1) / 2;
  const arrow = (from: PointId, to: PointId, u: number, bend: number) => {
    const a = POINTS[from];
    const b = POINTS[to];
    const dx = b.px - a.px;
    const dy = b.py - a.py;
    const L = Math.hypot(dx, dy);
    return (
      <GrowArrow a={[a.px + (dx / L) * 11, a.py + (dy / L) * 11]} b={[b.px - (dx / L) * 12, b.py - (dy / L) * 12]} bend={bend} u={u} color={colors.POSITIVE} />
    );
  };
  return (
    <g opacity={op}>
      {/* decade gridlines */}
      <g opacity={ticksU}>
        {X_TICKS.map((v) => (
          <line key={`gx${v}`} x1={sx(v)} y1={SC.y0} x2={sx(v)} y2={SC.y1} stroke={colors.GRID} />
        ))}
        {Y_TICKS.map((v) => (
          <line key={`gy${v}`} x1={SC.x0} y1={sy(v)} x2={SC.x1} y2={sy(v)} stroke={colors.GRID} />
        ))}
        <line x1={SC.x0} y1={sy(3)} x2={SC.x1} y2={sy(3)} stroke={colors.WARM} strokeOpacity={0.35} strokeDasharray="2 5" />
        <Label x={SC.x0 + 6} y={sy(3) - 6} fill={colors.WARM} opacity={0.7}>3 layers</Label>
      </g>
      {/* axes */}
      <line x1={SC.x0} y1={SC.y0} x2={axisX} y2={SC.y0} stroke={xCol} strokeWidth={1.6 + 1.6 * xGlow} />
      <line x1={SC.x0} y1={SC.y0} x2={SC.x0} y2={axisY} stroke={yCol} strokeWidth={1.6 + 1.6 * yGlow} />
      <g opacity={ticksU}>
        {X_TICKS.map((v) => (
          <g key={`tx${v}`}>
            <line x1={sx(v)} y1={SC.y0} x2={sx(v)} y2={SC.y0 + 5} stroke={colors.MUTED} />
            <Label x={sx(v)} y={SC.y0 + 19} anchor="middle" mono>{tickLabel(v)}</Label>
          </g>
        ))}
        {Y_TICKS.map((v) => (
          <g key={`ty${v}`}>
            <line x1={SC.x0 - 5} y1={sy(v)} x2={SC.x0} y2={sy(v)} stroke={colors.MUTED} />
            <Label x={SC.x0 - 8} y={sy(v) + 4.5} anchor="end" mono>{tickLabel(v)}</Label>
          </g>
        ))}
        <Label x={(SC.x0 + SC.x1) / 2} y={SC.y0 + 38} anchor="middle" size={14} fill={xGlow > 0.01 ? colors.TEAL : INK}>operations (work) →</Label>
        <text x={yTitleX} y={midY} transform={`rotate(-90, ${yTitleX}, ${midY})`} textAnchor="middle" fontFamily={UI} fontSize={14} fill={yGlow > 0.01 ? colors.WARM : INK}>
          layers (waiting) →
        </text>
        <Label x={(SC.x0 + SC.x1) / 2} y={SC.y0 + 58} anchor="middle" size={14} fill={colors.TEAL} weight={700} opacity={xGlow}>processor: time follows this</Label>
        {yGlow > 0.002 && (
          <text x={yTagX} y={midY} transform={`rotate(-90, ${yTagX}, ${midY})`} textAnchor="middle" fontFamily={UI} fontSize={14} fontWeight={700} fill={colors.WARM} opacity={yGlow}>
            graphics card: each layer at once
          </text>
        )}
      </g>
      {arrow('T', 'C', s.get(sc.arrTC), 18)}
      {arrow('H', 'B', s.get(sc.arrHB), -26)}
      {(Object.keys(POINTS) as PointId[]).map((id) => {
        const u = pop[id];
        if (u <= 0.002) return null;
        const p = POINTS[id];
        const sc2 = Math.max(0, u);
        return (
          <g key={id}>
            <g transform={`translate(${p.px}, ${p.py}) scale(${sc2})`}>
              <circle r={7} fill={p.solid ? colors.WARM : colors.PANEL} stroke={p.solid ? colors.WARM : INK} strokeWidth={2} />
            </g>
            <g opacity={clamp01(u)}>
              <Label x={p.lx} y={p.ly} anchor={p.anchor} fill={INK}>{p.name}</Label>
              <Label x={p.lx} y={p.ly + 16} anchor={p.anchor} mono fill={colors.WARM}>{p.counter}</Label>
            </g>
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const sc = scene;
  const cam = s.get(sc.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(s.get(sc.src))));
  const leftOp = s.get(sc.leftOp);
  const cardU = s.get(sc.cardU);
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={s.get(sc.titleU)}>
          <Label x={40} y={34} size={15}>4 · Loops That Cannot Stop</Label>
          <Label x={40} y={62} mono>{SOURCES[srcIdx]}</Label>
        </g>
        <g opacity={leftOp}>
          <CodeChip x={CODE.x} y={CODE.y} lines={C4A} opacity={s.get(sc.codeA)} />
          <CodeChip x={CODE.x} y={CODE.y} lines={C4B} opacity={s.get(sc.codeB)} stripe={colors.WARM} />
          <CodeChip x={CODE.x} y={CODE.y} lines={C4C} opacity={s.get(sc.codeC)} />
          <CodeChip x={CODE.x} y={CODE.y} lines={C4E} opacity={s.get(sc.codeE)} />
        </g>
        <CodeChip x={CODE.x} y={CODE.y} lines={C4F} opacity={s.get(sc.codeF) * leftOp} stripe={colors.TEAL} />
        <CodeChip x={CODE.x} y={448} lines={C4G} opacity={s.get(sc.codeG) * leftOp} stripe={colors.WARM} />
        <RowList s={s} sc={sc} />
        <FindIndex s={s} sc={sc} />
        <Totals s={s} sc={sc} />
        <Ranks s={s} sc={sc} />
        <Table s={s} sc={sc} />
        <Caveat s={s} sc={sc} />
        <MenuBar s={s} sc={sc} />
        <Scatter s={s} sc={sc} />
        {cardU > 0.002 && (
          <g opacity={cardU} transform={`translate(0, ${(1 - cardU) * 14})`}>
            <rect x={370} y={214} width={540} height={232} rx={18} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.5} strokeWidth={1.5} />
            <MathLabel tex={'\\text{answer}=\\sum_i\\,[\\,\\text{test}_i\\,]'} x={640} y={286} fontSize={34} />
            <Label x={640} y={364} anchor="middle" size={24} fill={INK}>every test runs</Label>
            <Label x={640} y={404} anchor="middle" size={24} fill={colors.WARM}>a count picks the winner</Label>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
