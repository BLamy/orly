// Exact, Trainable, Wide
//
// Handwired — chapter 5. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT, Cheng Lou)
//   exact:      docs/execution-model.md:118 (the guarantee), 123 (integer bits: relu(1 - relu(-D))), 126,
//               130-136 (cost table), 143 (gradient of a cascade), 257 (what exact means);
//               docs/tutorial.md:53, 167
//   gradients:  README.md:29, docs/execution-model.md:21-36 (the instruction set: affine, reglu, boolean, index), 112,
//               src/runtime/numeric-ui-core.ts:658, 718-722 (booleanGradient, the throw, the pass-through)
//   desktop:    src/handwiredos/README.md:3, 13, 42
//   learned:    src/learned-gallery/README.md:3, 15, 17, 28
//   JSON search: src/json-search/README.md:3, 30, 42, 47, 53
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan. Captions are the
// planner's fixed narration (verbatim).
//
// Persistent object: the program stack from chapter 1 (four MatrixGrid layer tiles, violet relu gates,
// the combine and the pick), faint behind every beat, the subject of the gradient beats, and alone
// (≤ 0.12) behind the closing tiles. Derived numbers (result(a), its slope) are computed here and
// labelled "derived from the README formulas"; the 15-chip staircase, the arcs, the desktop and
// photo sketches are labelled schematic or placeholder. Nothing here is a screenshot of the runtime.
import type { ReactNode } from 'react';
import { scaleLinear, interpolateRgb } from 'd3';
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
  gaussian,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { FunctionPlot, MatrixGrid, Vec } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const COPPER = '#d98a56';
const DIM_CELL = '#141b2b';
const relu = (x: number): number => (x > 0 ? x : 0);
const commas = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtNum = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, '');
  return s.replace('-', '−');
};
function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`handwired ch5: ${msg}`);
}

// ---------------------------------------------------------------------------
// The arithmetic (module scope)
// ---------------------------------------------------------------------------

// B0 — execution-model.md:123: on a grid, a >= b is relu(1 - relu(-D)), equal to relu(D+1) - relu(D) at every integer
const BIT = (D: number): number => relu(1 - relu(-D));
const RAMP_DIFF = (D: number): number => relu(D + 1) - relu(D);
const P1F = (D: number): number => relu(-D);
const P2F = (D: number): number => 1 - relu(-D);
const D_INTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const D_BITS = D_INTS.map(BIT);
check(D_BITS.join('') === '000011111', 'built bit on D = -4..4');
check(D_INTS.every((d) => RAMP_DIFF(d) === BIT(d) && BIT(d) === (d >= 0 ? 1 : 0)), 'ramp difference and JS comparison');

// B1 — twelve samples, the same bit strip from both builders (execution-model.md:134-136, tutorial.md:53)
const STRIP_D = [-2, 3, 0, -1, 5, -4, 1, 0, -3, 2, -1, 4];
const STRIP_BITS = STRIP_D.map((d) => (d >= 0 ? 1 : 0));
check(STRIP_D.every((d, i) => BIT(d) === STRIP_BITS[i]), 'strip bits');

// B3 — derived from the README formulas: result = above4·10 + (1 − above4)·12 = 12 − 2·(relu(a−4) − relu(a−5))
const G1 = (a: number): number => relu(a - 4);
const G2 = (a: number): number => relu(a - 5);
const ABOVE4 = (a: number): number => G1(a) - G2(a);
const RESULT = (a: number): number => ABOVE4(a) * 10 + (1 - ABOVE4(a)) * 12;
const SLOPE1 = (a: number): number => (a > 4 ? 1 : 0);
const SLOPE2 = (a: number): number => (a > 5 ? 1 : 0);
// backward pass: d result/d p10 = d result/d p12 = 1; d/d above4 = 10 − 12 = −2; d/d g1 = −2, d/d g2 = +2
const GRAD = { res: 1, p10: 1, p12: 1, ab: 10 - 12, g1: (10 - 12) * 1, g2: (10 - 12) * -1 };
const DRESULT_DA = (a: number): number => GRAD.g1 * SLOPE1(a) + GRAD.g2 * SLOPE2(a);
check(DRESULT_DA(4.5) === -2 && DRESULT_DA(3) === 0 && DRESULT_DA(6) === 0, 'd result / d a at 4.5, 3, 6');
check(RESULT(4.5) === 11 && RESULT(3) === 12 && RESULT(6) === 10, 'result values');
const HARD = (a: number): number => (a >= 4.5 ? 1 : 0); // a rounding bit: rounds a score at one half

// B5 — handwiredos/README.md:13
const DESKTOP = { cells: 234, ops: 4646, layers: 130, weights: 9909 };
// B6 — learned-gallery/README.md:3, 17
const GALLERY = { cells: 244, stepsPerSecond: 600, fitLo: 630, fitHi: 750, shown: 700 };
// B7/B8 — json-search/README.md:3, 30, 42, 53
const DOCS = 100_000;
const MATCHES = 10_559;
const BANDS = [
  { lo: 0.011, hi: 0.015, color: COPPER, label: 'this program, graphics card: 11 to 15 ms', side: 'right' as const },
  { lo: 0.008, hi: 0.028, color: colors.ACCENT, label: 'regular expressions, ordinary patterns: 8 to 28 ms', side: 'right' as const },
  { lo: 2.1, hi: 2.1, color: colors.NEGATIVE, label: 'regular expressions, backtracking ([a-z]+)+x: 2.1 s', side: 'left' as const },
  { lo: 13, hi: 13, color: colors.MUTED, label: "same program on a processor: 13 s (smallest program, the search's own time)", side: 'left' as const },
];
check(
  BANDS[0].lo === 0.011 && BANDS[0].hi === 0.015 && BANDS[1].lo === 0.008 && BANDS[1].hi === 0.028 && BANDS[2].lo === 2.1 && BANDS[3].lo === 13,
  'ruler bands',
);
check(BANDS[1].lo < BANDS[0].lo && BANDS[0].hi < BANDS[1].hi, 'search band sits inside the RegExp band (overlap)');

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

// B0 — three small plots, the D-line, the two lanes
const PLOTS = [
  { x0: 210, x1: 430, dom: [-0.5, 4.5] as [number, number], f: P1F, color: colors.SECONDARY, tex: '\\mathrm{relu}(-D)' },
  { x0: 530, x1: 750, dom: [-3.5, 1.5] as [number, number], f: P2F, color: colors.SECONDARY, tex: '1-\\mathrm{relu}(-D)' },
  { x0: 850, x1: 1070, dom: [-0.4, 1.4] as [number, number], f: BIT, color: colors.WARM, tex: '\\mathrm{bit}=\\mathrm{relu}\\big(1-\\mathrm{relu}(-D)\\big)' },
].map((p) => ({ ...p, X: scaleLinear([-4.5, 4.5], [p.x0, p.x1]), Y: scaleLinear(p.dom, [230, 120]) }));
// the chapter-1 ramp difference over plot 3, sampled finely (it coincides with the bit)
const RAMP_DIFF_PATH = Array.from({ length: 181 }, (_, i) => {
  const D = -4.5 + (9 * i) / 180;
  return `${i === 0 ? 'M' : 'L'}${PLOTS[2].X(D).toFixed(1)} ${PLOTS[2].Y(RAMP_DIFF(D)).toFixed(1)}`;
}).join('');
const DLINE_Y = 300;
const DX = (D: number): number => 640 + D * 100;
const JS_Y = 432;
const BUILT_Y = 492;

// B1 — the two builders
const STRIP = { x0: 430, pitch: 36, yA: 456, yB: 528 };
const STAIR = Array.from({ length: 15 }, (_, i) => {
  // schematic: 15 operations over 14 layers — the first layer holds two
  const col = i === 0 ? 0 : i - 1;
  return { x: 628 + col * 38, y: i === 0 ? 206 : 226 + (i - 1) * 11 };
});

// B3–B4 — the stack (local coordinates; the stackPos channel moves it)
const COLS = [175, 310, 445, 580];
const NODES = {
  a: { x: 70, y: 405 },
  g1: { x: 175, y: 340 },
  g2: { x: 175, y: 470 },
  ab: { x: 310, y: 405 },
  p10: { x: 445, y: 340 },
  p12: { x: 445, y: 470 },
  res: { x: 580, y: 405 },
  out: { x: 722, y: 405 },
};
type NodeKey = keyof typeof NODES;
const CHIP_W = 120;
const CHIP_H = 40;
const EDGES: Array<[NodeKey, NodeKey, number]> = [
  ['a', 'g1', 0],
  ['a', 'g2', 0],
  ['g1', 'ab', 1],
  ['g2', 'ab', 1],
  ['ab', 'p10', 2],
  ['ab', 'p12', 2],
  ['p10', 'res', 3],
  ['p12', 'res', 3],
  ['res', 'out', 4],
];
const DEPTH: Record<NodeKey, number> = { a: 0, g1: 1, g2: 1, ab: 2, p10: 3, p12: 3, res: 4, out: 5 };
const edgeEnds = (from: NodeKey, to: NodeKey) => {
  const A = NODES[from];
  const B = NODES[to];
  const ax = from === 'a' ? A.x + 20 : A.x + CHIP_W / 2;
  const bx = to === 'out' ? B.x : B.x - CHIP_W / 2;
  return { x1: ax, y1: A.y, x2: bx, y2: B.y };
};
// layer tiles: 6×6 sparse matrices, seeded
const TILES = (() => {
  const rnd = mulberry32(5);
  return COLS.map((_, l) =>
    Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => (rnd() < (l === 0 ? 0.2 : 0.16) ? 1 : 0))),
  );
})();
const TILE = { y: 168, cell: 14, gap: 4 };
const TILE_SIZE = 6 * TILE.cell + 5 * TILE.gap;
const STACK_CENTER: CameraState = { x: 265, y: 20, k: 1 }; // stackPos offset that centres the stack on the stage
const STACK_HOME: CameraState = { x: 0, y: 0, k: 1 };

// the result plot (B3) that becomes a hard bit (B4)
const RX = scaleLinear([2, 7], [742, 1200]);
const PY_RES = scaleLinear([9.4, 12.6], [400, 170]);
const PY_BIT = scaleLinear([-0.25, 1.25], [400, 170]);
const ID = scaleLinear([0, 1], [0, 1]);
const RES_PX = (a: number): number => PY_RES(RESULT(a));
const BIT_PX = (a: number): number => PY_BIT(HARD(a));
const GATE = { x: 668, y: 405 };
const WALL_X = 702;
const GDOT_FROM = { x: RX(4.5), y: (PY_BIT(0) + PY_BIT(1)) / 2 };

// B5 — 9,909 placeholder arcs (seeded), one path per chunk
const ARC_CHUNKS = (() => {
  const rnd = mulberry32(9909);
  const g = gaussian(mulberry32(130));
  const step = 1400 / DESKTOP.layers;
  const chunks: string[][] = Array.from({ length: 6 }, () => []);
  for (let i = 0; i < DESKTOP.weights; i++) {
    const L = Math.floor(rnd() * DESKTOP.layers);
    const x1 = -60 + L * step;
    const x2 = x1 + (1 + Math.floor(rnd() * 5)) * step;
    const y1 = 20 + rnd() * 680;
    const y2 = Math.max(10, Math.min(710, y1 + g() * 46));
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - 6 - rnd() * 34;
    chunks[i % 6].push(`M${x1.toFixed(0)} ${y1.toFixed(0)}Q${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}`);
  }
  check(chunks.reduce((n, c) => n + c.length, 0) === DESKTOP.weights, '9,909 arcs');
  return chunks.map((c) => c.join(''));
})();

// B6 — the learned gallery's network and its 244 weights
const NET = (() => {
  const col = (x: number, n: number, y0: number, y1: number) =>
    Array.from({ length: n }, (_, i) => ({ x, y: n === 1 ? (y0 + y1) / 2 : y0 + ((y1 - y0) * i) / (n - 1) }));
  const layers = [col(90, 9, 186, 386), col(215, 6, 206, 366), col(340, 6, 206, 366), col(462, 4, 236, 336)];
  const paths = [0, 1, 2].map((l) => {
    let d = '';
    for (const a of layers[l]) for (const b of layers[l + 1]) d += `M${a.x} ${a.y.toFixed(1)}L${b.x} ${b.y.toFixed(1)}`;
    return d;
  });
  return { layers, paths };
})();
const WEIGHT_DOTS = (() => {
  const rnd = mulberry32(244);
  return Array.from({ length: GALLERY.cells }, (_, i) => ({
    x: 196 + (i % 21) * 9,
    y: 440 + Math.floor(i / 21) * 9,
    ph: rnd(),
  }));
})();
check(WEIGHT_DOTS.length === 244 && Math.floor(243 / 21) === 11, '244 weight dots, 12 rows (last partial)');
const ACCENT_TO_VIOLET = interpolateRgb(colors.ACCENT, colors.SECONDARY);
// the sketch: a 5-wide, 4-tall stage (Story preset: 10 rectangles), schematic target layout
const SK = { x: 690, y: 176, w: 420, h: 336 };
const SK_UNIT = SK.w / 5;
check(Math.abs(SK.h / SK_UNIT - 4) < 1e-9, 'sketch stage is 5:4');
const TARGETS = [
  [0, 0, 2, 1.6],
  [2, 0, 1.5, 1.6],
  [3.5, 0, 1.5, 0.8],
  [3.5, 0.8, 1.5, 0.8],
  [0, 1.6, 1.2, 1.2],
  [0, 2.8, 1.2, 1.2],
  [1.2, 1.6, 2.2, 2.4],
  [3.4, 1.6, 1.6, 1.0],
  [3.4, 2.6, 0.8, 1.4],
  [4.2, 2.6, 0.8, 1.4],
].map(([x, y, w, h]) => ({ x: SK.x + x * SK_UNIT + 4, y: SK.y + y * SK_UNIT + 4, w: w * SK_UNIT - 8, h: h * SK_UNIT - 8 }));
const PHOTO_HUES = ['#5b7fa6', '#7a9a6b', '#a77f5b', '#8c6fa6', '#5f9b9b', '#a6687a', '#6b7fa6', '#9a8f5b', '#6b9a84', '#9a6b5b'];
const PILE = (() => {
  const rnd = mulberry32(28);
  return TARGETS.map((_, i) => ({
    cx: SK.x + SK.w / 2 + (rnd() - 0.5) * 50,
    cy: SK.y + SK.h / 2 + (rnd() - 0.5) * 40,
    rot: (rnd() - 0.5) * 40,
    delay: 0.05 * i + rnd() * 0.12,
    hue: PHOTO_HUES[i],
  }));
})();
check(TARGETS.length === 10, 'ten target rectangles');

// B7 — the 100 × 100 dot map: one dot per 10 documents, a seeded 10,559 / 100,000 share is copper
const MAP = { x: 70, y: 130, pitch: 4.4, n: 100, sq: 3.2 };
const MAP_PATHS = (() => {
  const total = MAP.n * MAP.n;
  const nMatch = Math.round((total * MATCHES) / DOCS);
  const rnd = mulberry32(10559);
  const order = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const isMatch = new Uint8Array(total);
  for (let i = 0; i < nMatch; i++) isMatch[order[i]] = 1;
  let base = '';
  let copper = '';
  for (let i = 0; i < total; i++) {
    const x = MAP.x + (i % MAP.n) * MAP.pitch;
    const y = MAP.y + Math.floor(i / MAP.n) * MAP.pitch;
    const d = `M${x.toFixed(1)} ${y.toFixed(1)}h${MAP.sq}v${MAP.sq}h-${MAP.sq}z`;
    if (isMatch[i]) copper += d;
    else base += d;
  }
  return { base, copper, nMatch, total };
})();
check(MAP_PATHS.total === 10_000 && MAP_PATHS.nMatch === 1056, '10,000 dots, 1,056 copper (10.6 %)');
const ONE_DOT = { x: MAP.x + 50 * MAP.pitch + MAP.sq / 2, y: MAP.y + 50 * MAP.pitch + MAP.sq / 2 };

// B8 — log-time ruler, 1 ms … 100 s
const LX = (sec: number): number => 580 + 124 * Math.log10(sec / 0.001);
const RULER = { rows: [352, 394, 436, 478], axisY: 516 };
check(LX(0.008) < LX(0.011) && LX(0.015) < LX(0.028) && LX(0.028) < LX(2.1) && LX(2.1) < LX(13) && LX(100) === 1200, 'log ruler order');

// B9 — five recap panels
const PANEL_W = 210;
const PANEL_H = 170;
const PANEL_Y = 250;
const PANEL_X = (i: number): number => 71 + i * 232;
const PANEL_TITLES = ['Both Branches Run', 'A Switch of Arithmetic', 'The Host Loop', 'Loops That Cannot Stop', 'Exact, Trainable, Wide'];

// camera stops
const CAM_DLINE: CameraState = { x: 650, y: 240, k: 1.35 };
const CAM_STACK: CameraState = { x: 640, y: 360, k: 0.95 };
const CAM_WALL: CameraState = { x: 640, y: 385, k: 1.0 }; // wide enough that the input cell a stays on stage
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.9 };
const CAM_NET: CameraState = { x: 330, y: 360, k: 1.3 };
const CAM_MAP: CameraState = { x: 400, y: 360, k: 1.2 };
const CAM_RULER: CameraState = { x: 880, y: 410, k: 1.25 };

const PIN = 'chenglou/handwired@4ea7fcb';
const SOURCES = [
  'docs/execution-model.md:118, 123',
  'docs/execution-model.md:134-136 · docs/tutorial.md:53',
  'docs/execution-model.md:257 · docs/tutorial.md:167',
  'README.md:29 · docs/execution-model.md:21-36, 112',
  'src/runtime/numeric-ui-core.ts:719-722 · docs/execution-model.md:36, 143',
  'src/handwiredos/README.md:3, 13, 42',
  'src/learned-gallery/README.md:3, 15, 17, 28',
  'src/json-search/README.md:3, 30, 47',
  'src/json-search/README.md:42, 53',
  'README.md:20 · docs/README.md:9',
  'README.md:20 · docs/README.md:9',
  'docs/expressions.md:11 · docs/execution-model.md:264',
];

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, ≈ 116.6 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = tl.channel('src', 0);
  const chromeU = tl.channel('chromeU', 1);

  // the persistent stack
  const stackOp = tl.channel('stackOp', 0.03);
  const stackTextU = tl.channel('stackTextU', 1);
  const tileDim = tl.channel('tileDim', 0);
  const stackPos = tl.channel<CameraState>('stackPos', STACK_CENTER);

  // B0
  const b0Op = tl.channel('b0Op', 1);
  const dlineU = tl.channel('dlineU', 0);
  const plot1U = tl.channel('plot1U', 0);
  const plot2U = tl.channel('plot2U', 0);
  const plot3U = tl.channel('plot3U', 0);
  const dropU = tl.channel('dropU', 0);
  const overlayU = tl.channel('overlayU', 0);
  const lanesU = tl.channel('lanesU', 0);
  const eqTickU = tl.channel('eqTickU', 0);
  const quote0U = tl.channel('quote0U', 0);
  // B1
  const b1Op = tl.channel('b1Op', 1);
  const gridBU = tl.channel('gridBU', 0);
  const stripAU = tl.channel('stripAU', 0);
  const cascU = tl.channel('cascU', 0);
  const stripBU = tl.channel('stripBU', 0);
  const combU = tl.channel('combU', 0);
  // B2
  const b2Op = tl.channel('b2Op', 1);
  const decU = tl.channel('decU', 0);
  const posU = tl.channel('posU', 0);
  const loupeU = tl.channel('loupeU', 0);
  const quote2U = tl.channel('quote2U', 0);
  // B3–B4
  const b34Op = tl.channel('b34Op', 1);
  const plotU = tl.channel('plotU', 0);
  const eq3U = tl.channel('eq3U', 0);
  const fwdU = tl.channel('fwdU', 0);
  const markU = tl.channel('markU', 0);
  const aMark = tl.channel('aMark', 2.5);
  const bwdU = tl.channel('bwdU', 0);
  const lampU = tl.channel('lampU', 0);
  const readU = tl.channel('readU', 0);
  const chipInfoU = tl.channel('chipInfoU', 1);
  const hardU = tl.channel('hardU', 0);
  const gateU = tl.channel('gateU', 0);
  const gdotU = tl.channel('gdotU', 0);
  const wallU = tl.channel('wallU', 0);
  const errU = tl.channel('errU', 0);
  const stU = tl.channel('stU', 0);
  const passU = tl.channel('passU', 0);
  const noteU = tl.channel('noteU', 0);
  // B5
  const arcsU = tl.channel('arcsU', 0);
  const mockU = tl.channel('mockU', 0);
  const countU = tl.channel('countU', 0);
  const b5TextU = tl.channel('b5TextU', 0);
  const lock5U = tl.channel('lock5U', 0);
  // B6
  const b6Op = tl.channel('b6Op', 1);
  const netU = tl.channel('netU', 0);
  const wdotU = tl.channel('wdotU', 0);
  const unlockU = tl.channel('unlockU', 0);
  const rectU = tl.channel('rectU', 0);
  const pileU = tl.channel('pileU', 0);
  const fitU = tl.channel('fitU', 0);
  const b6TagU = tl.channel('b6TagU', 0);
  // B7–B8
  const b78Op = tl.channel('b78Op', 1);
  const mapU = tl.channel('mapU', 0);
  const oneU = tl.channel('oneU', 0);
  const barU = tl.channel('barU', 0);
  const mapLit = tl.channel('mapLit', 0);
  const flashU = tl.channel('flashU', 0);
  const matchU = tl.channel('matchU', 0);
  const mapTagU = tl.channel('mapTagU', 0);
  const cardU = tl.channel('cardU', 0);
  const mapDim = tl.channel('mapDim', 0);
  const rulerU = tl.channel('rulerU', 0);
  const band1 = tl.channel('band1', 0);
  const band2 = tl.channel('band2', 0);
  const band3 = tl.channel('band3', 0);
  const band4 = tl.channel('band4', 0);
  const overlapU = tl.channel('overlapU', 0);
  // B9–B10
  const panelsU = tl.channel('panelsU', 0);
  const lit1 = tl.channel('lit1', 0);
  const lit2 = tl.channel('lit2', 0);
  const lit3 = tl.channel('lit3', 0);
  const lit4 = tl.channel('lit4', 0);
  const panelsOut = tl.channel('panelsOut', 0);
  const closeU = tl.channel('closeU', 0);
  const closeEqU = tl.channel('closeEqU', 0);

  const CAP = [0.4, 10.6, 18.2, 28.5, 39.9, 52.1, 61.6, 71.5, 83.2, 94.4, 99.5, 105.4];
  CAP.forEach((at, i) => tl.set(src, i, at - 0.1));

  // — B0 · the exact comparison bit on the D-line —
  tl.caption({ at: 0.4, dur: 9.8, text: "Chapter one's ramps held only for whole numbers. The real comparison is exact: for every pair of values in the declared ranges, its bit equals Javascript's." });
  tl.tween(cam, CAM_DLINE, { at: 0.4, dur: 1.3, ease: ease.move });
  tl.tween(dlineU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(plot1U, 1, { at: 1.4, dur: 1.0, ease: ease.draw });
  tl.tween(plot2U, 1, { at: 2.4, dur: 1.0, ease: ease.draw });
  tl.tween(plot3U, 1, { at: 3.4, dur: 1.0, ease: ease.draw });
  tl.tween(dropU, 1, { at: 4.4, dur: 1.1, ease: ease.move });
  tl.tween(overlayU, 1, { at: 5.0, dur: 0.9, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 5.8, dur: 1.2, ease: ease.move });
  tl.tween(lanesU, 1, { at: 6.4, dur: 1.2, ease: ease.linear });
  tl.tween(eqTickU, 1, { at: 7.6, dur: 0.9, ease: ease.linear });
  tl.tween(quote0U, 1, { at: 8.3, dur: 0.7, ease: ease.enter });
  tl.hold(10.2, 0.4);

  // — B1 · two operations on a grid, fifteen without —
  tl.caption({ at: 10.6, dur: 7.2, text: 'On a declared grid the comparison is two operations. Without a grid it takes fifteen, with the same bits.' });
  tl.tween(b0Op, 0, { at: 10.4, dur: 0.6, ease: ease.move });
  tl.tween(stackOp, 0, { at: 9.2, dur: 0.6, ease: ease.move });
  tl.tween(gridBU, 1, { at: 10.9, dur: 0.8, ease: ease.enter });
  tl.tween(stripAU, 1, { at: 11.8, dur: 1.2, ease: ease.linear });
  tl.tween(cascU, 1, { at: 13.6, dur: 1.4, ease: ease.draw });
  tl.tween(stripBU, 1, { at: 15.1, dur: 1.2, ease: ease.linear });
  tl.tween(combU, 1, { at: 16.4, dur: 0.6, ease: ease.enter });
  tl.hold(17.8, 0.4);

  // — B2 · exact bits, positions within a stated bound —
  tl.caption({ at: 18.2, dur: 9.9, text: "Exact means exact bits. Positions can still differ from sixty-four-bit floats, by at most 1.3 millionths of a pixel across the toggle's travel." });
  tl.tween(b1Op, 0, { at: 18.0, dur: 0.6, ease: ease.move });
  tl.tween(decU, 1, { at: 18.6, dur: 0.8, ease: ease.enter });
  tl.tween(posU, 1, { at: 20.2, dur: 1.4, ease: ease.draw });
  tl.tween(loupeU, 1, { at: 21.8, dur: 0.9, ease: ease.enter });
  tl.tween(quote2U, 1, { at: 23.4, dur: 0.7, ease: ease.enter });
  tl.hold(28.1, 0.4);

  // — B3 · forward, then the gradient back through the sums, products and relus —
  tl.caption({ at: 28.5, dur: 11.0, text: 'Almost every operation is a sum, a product or a relu, so the program can run backwards. Backpropagation sends a gradient, how much each number should change, back through them.' });
  tl.tween(b2Op, 0, { at: 28.3, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_STACK, { at: 28.5, dur: 1.2, ease: ease.move });
  tl.tween(stackPos, STACK_HOME, { at: 28.5, dur: 1.2, ease: ease.move });
  tl.tween(stackOp, 1, { at: 28.6, dur: 0.9, ease: ease.enter });
  tl.tween(plotU, 1, { at: 29.2, dur: 1.2, ease: ease.draw });
  tl.tween(markU, 1, { at: 29.6, dur: 0.5, ease: ease.enter });
  tl.tween(aMark, 4.5, { at: 29.8, dur: 0.9, ease: ease.move });
  tl.tween(eq3U, 1, { at: 30, dur: 0.6, ease: ease.enter });
  tl.tween(fwdU, 1, { at: 31.2, dur: 2.2, ease: ease.linear });
  tl.tween(bwdU, 1, { at: 34.6, dur: 2.0, ease: ease.linear });
  tl.tween(lampU, 1, { at: 35.8, dur: 0.5, ease: ease.enter });
  tl.tween(readU, 1, { at: 36.5, dur: 0.5, ease: ease.enter });
  tl.tween(aMark, 3, { at: 37.3, dur: 0.7, ease: ease.move });
  tl.tween(aMark, 6, { at: 38.3, dur: 1.0, ease: ease.move });
  tl.hold(39.5, 0.4);

  // — B4 · a hard decision has no slope; straight-through passes it on —
  tl.caption({ at: 39.9, dur: 11.8, text: 'But a hard decision has no slope. At a score rounded to zero or one, the backward pass throws, unless you pick a stand-in called straight-through, which passes the gradient along unchanged.' });
  tl.tween(cam, CAM_WALL, { at: 39.9, dur: 1.2, ease: ease.move });
  tl.tween(readU, 0, { at: 39.9, dur: 0.5, ease: ease.move });
  tl.tween(eq3U, 0, { at: 39.9, dur: 0.5, ease: ease.move });
  tl.tween(markU, 0, { at: 39.9, dur: 0.5, ease: ease.move });
  tl.tween(lampU, 0, { at: 39.9, dur: 0.5, ease: ease.move });
  tl.tween(chipInfoU, 0, { at: 39.9, dur: 0.5, ease: ease.move });
  tl.tween(tileDim, 1, { at: 39.9, dur: 0.6, ease: ease.move });
  tl.tween(hardU, 1, { at: 40.3, dur: 1.3, ease: ease.move });
  tl.tween(gateU, 1, { at: 42.2, dur: 0.6, ease: ease.enter });
  tl.tween(gdotU, 1, { at: 44.8, dur: 1.3, ease: ease.linear });
  tl.tween(wallU, 1, { at: 46.1, dur: 0.4, ease: ease.pop });
  tl.tween(errU, 1, { at: 46.6, dur: 0.6, ease: ease.enter });
  tl.tween(stU, 1, { at: 48.6, dur: 1.0, ease: ease.move });
  tl.tween(passU, 1, { at: 49.7, dur: 1.2, ease: ease.linear });
  tl.tween(noteU, 1, { at: 50.8, dur: 0.6, ease: ease.enter });
  tl.hold(51.7, 0.4);

  // — B5 · the frozen case: the desktop demo —
  tl.caption({ at: 52.1, dur: 9.1, text: 'The desktop demo is the frozen case: three windows and a dock, run by 234 cells, 4,646 live operations and 9,909 weights, none trained.' });
  tl.tween(b34Op, 0, { at: 51.9, dur: 0.6, ease: ease.move });
  tl.tween(stackOp, 0.025, { at: 51.9, dur: 0.8, ease: ease.move });
  tl.tween(stackPos, STACK_CENTER, { at: 51.9, dur: 1.0, ease: ease.move });
  tl.tween(tileDim, 0, { at: 51.9, dur: 0.8, ease: ease.move });
  tl.tween(gateU, 0, { at: 51.9, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 52.1, dur: 1.4, ease: ease.move });
  tl.tween(arcsU, 1, { at: 52.4, dur: 2.0, ease: ease.linear });
  tl.tween(mockU, 1, { at: 53.2, dur: 1.0, ease: ease.draw });
  tl.tween(countU, 1, { at: 54.6, dur: 2.4, ease: ease.move });
  tl.tween(b5TextU, 1, { at: 57.2, dur: 0.7, ease: ease.enter });
  tl.tween(lock5U, 1, { at: 58.2, dur: 0.6, ease: ease.enter });
  tl.hold(61.2, 0.4);

  // — B6 · the learned gallery unfreezes the weights —
  tl.caption({ at: 61.6, dur: 9.5, text: "The learned gallery unfreezes the weights: its 244 cells are a small network's coefficients, trained with Adam, a standard optimizer, at six hundred steps a second." });
  tl.tween(arcsU, 0.35, { at: 61.5, dur: 0.8, ease: ease.move });
  tl.tween(mockU, 0, { at: 61.5, dur: 0.8, ease: ease.move });
  tl.tween(countU, 0, { at: 61.5, dur: 0.6, ease: ease.move });
  tl.tween(b5TextU, 0, { at: 61.5, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_NET, { at: 61.6, dur: 1.2, ease: ease.move });
  tl.tween(netU, 1, { at: 61.9, dur: 1.4, ease: ease.draw });
  tl.tween(wdotU, 1, { at: 62.8, dur: 0.9, ease: ease.linear });
  tl.tween(lock5U, 2, { at: 63.6, dur: 0.6, ease: ease.pop });
  tl.tween(unlockU, 1, { at: 63.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.0 }, { at: 64.6, dur: 1.2, ease: ease.move });
  tl.tween(rectU, 1, { at: 65, dur: 0.8, ease: ease.draw });
  tl.tween(pileU, 1, { at: 65.2, dur: 0.5, ease: ease.enter });
  tl.tween(b6TagU, 1, { at: 65.4, dur: 0.6, ease: ease.enter });
  tl.tween(fitU, 1, { at: 65.9, dur: 5.2, ease: ease.linear });
  tl.hold(71.1, 0.4);

  // — B7 · one pass over a hundred thousand documents —
  tl.caption({ at: 71.5, dur: 11.3, text: 'The last demo searches a hundred thousand generated Javascript Object Notation documents per keystroke, on a graphics card: every document runs the same operations, so one pass runs them all.' });
  tl.tween(b6Op, 0, { at: 71.4, dur: 0.6, ease: ease.move });
  tl.tween(arcsU, 0, { at: 71.4, dur: 0.6, ease: ease.move });
  tl.tween(mockU, 0, { at: 71.4, dur: 0.6, ease: ease.move });
  tl.tween(lock5U, 0, { at: 71.4, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_MAP, { at: 71.5, dur: 1.2, ease: ease.move });
  tl.tween(mapU, 1, { at: 71.9, dur: 0.8, ease: ease.enter });
  tl.tween(oneU, 1, { at: 72.6, dur: 0.5, ease: ease.pop });
  tl.tween(barU, 1, { at: 73, dur: 0.9, ease: ease.draw });
  tl.tween(barU, 0, { at: 75.8, dur: 0.5, ease: ease.move });
  tl.set(mapLit, 1, 74.4);
  tl.tween(flashU, 1, { at: 76, dur: 0.3, ease: ease.pop });
  tl.tween(flashU, 0, { at: 76.4, dur: 0.8, ease: ease.move });
  tl.tween(matchU, 1, { at: 76.5, dur: 0.5, ease: ease.enter });
  tl.tween(oneU, 0, { at: 76.5, dur: 0.5, ease: ease.move });
  tl.tween(mapTagU, 1, { at: 77, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.0 }, { at: 77.8, dur: 1.2, ease: ease.move });
  tl.tween(cardU, 1, { at: 78.4, dur: 0.8, ease: ease.enter });
  tl.hold(82.8, 0.4);

  // — B8 · the log-time ruler: neither is always faster —
  tl.caption({ at: 83.2, dur: 10.8, text: 'Measured in the repo, a search takes eleven to fifteen milliseconds a keystroke. Regular expressions take eight to twenty-eight, or two seconds when they backtrack. Neither is always faster.' });
  tl.tween(cam, CAM_RULER, { at: 83.2, dur: 1.2, ease: ease.move });
  tl.tween(mapDim, 1, { at: 83.2, dur: 0.8, ease: ease.move });
  tl.tween(stackOp, 0, { at: 83.2, dur: 0.8, ease: ease.move });
  tl.tween(rulerU, 1, { at: 83.6, dur: 1.0, ease: ease.draw });
  tl.tween(band1, 1, { at: 85.7, dur: 0.7, ease: ease.enter });
  tl.tween(band2, 1, { at: 87.9, dur: 0.7, ease: ease.enter });
  tl.tween(band3, 1, { at: 90.6, dur: 0.7, ease: ease.enter });
  tl.tween(band4, 1, { at: 91.4, dur: 0.7, ease: ease.enter });
  tl.tween(overlapU, 1, { at: 92.5, dur: 0.6, ease: ease.enter });
  tl.hold(94, 0.4);

  // — B9 · the recap, lit in the spoken order —
  tl.caption({ at: 94.4, dur: 5.1, text: 'From the top: a decision runs both branches and a bit picks one.' });
  tl.caption({ at: 99.5, dur: 5.5, text: 'A loop becomes a count, a tree or a table. The host feeds the cells.' });
  tl.tween(b78Op, 0, { at: 94.2, dur: 0.7, ease: ease.move });
  tl.tween(stackOp, 0.025, { at: 94.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 94.4, dur: 1.2, ease: ease.move });
  tl.tween(panelsU, 1, { at: 94.7, dur: 1.2, ease: ease.linear });
  tl.tween(lit1, 1, { at: 95.7, dur: 0.5, ease: ease.enter });
  tl.tween(lit2, 1, { at: 96, dur: 0.5, ease: ease.enter });
  tl.tween(lit4, 1, { at: 99.1, dur: 0.5, ease: ease.enter });
  tl.tween(lit3, 1, { at: 102.4, dur: 0.5, ease: ease.enter });
  tl.hold(105, 0.4);

  // — B10 · the closing line: a bit lets one answer through —
  tl.caption({ at: 105.4, dur: 8.7, text: 'The program never decides anything. It computes every answer, and a bit that is exactly zero or one lets one of them through.' });
  tl.tween(panelsOut, 1, { at: 105.3, dur: 0.8, ease: ease.move });
  tl.tween(chromeU, 0, { at: 105.4, dur: 0.8, ease: ease.move });
  tl.tween(stackOp, 0.1, { at: 105.6, dur: 1.0, ease: ease.move });
  tl.tween(stackTextU, 0, { at: 105.4, dur: 0.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 106.2, dur: 0.8, ease: ease.enter });
  tl.tween(closeEqU, 1, { at: 107.5, dur: 0.7, ease: ease.enter });
  tl.hold(114.1, 2.5);

  return {
    tl, cam, src, chromeU, stackOp, stackTextU, tileDim, stackPos,
    b0Op, dlineU, plot1U, plot2U, plot3U, dropU, overlayU, lanesU, eqTickU, quote0U,
    b1Op, gridBU, stripAU, cascU, stripBU, combU,
    b2Op, decU, posU, loupeU, quote2U,
    b34Op, plotU, eq3U, fwdU, markU, aMark, bwdU, lampU, readU, chipInfoU, hardU, gateU, gdotU, wallU, errU, stU, passU, noteU,
    arcsU, mockU, countU, b5TextU, lock5U,
    b6Op, netU, wdotU, unlockU, rectU, pileU, fitU, b6TagU,
    b78Op, mapU, oneU, barU, mapLit, flashU, matchU, mapTagU, cardU, mapDim, rulerU, band1, band2, band3, band4, overlapU,
    panelsU, lit1, lit2, lit3, lit4, panelsOut, closeU, closeEqU,
  };
}

const scene = buildScene();
type S = typeof scene;

// ---------------------------------------------------------------------------
// Glyph kit (local copy, per the book-wide spec)
// ---------------------------------------------------------------------------

function ReluGlyph({ x, y, color = colors.SECONDARY, opacity = 1 }: { x: number; y: number; color?: string; opacity?: number }) {
  return <path d={`M${x} ${y + 14}H${x + 11}L${x + 22} ${y + 3}`} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
}

function BitDisc({ x, y, b, r = 11, opacity = 1, label = true }: { x: number; y: number; b: number; r?: number; opacity?: number; label?: boolean }) {
  if (opacity <= 0.005) return null;
  const on = b >= 0.5;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={on ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={2} />
      {label && r >= 11 && (
        <text x={x} y={y + r * 0.42} textAnchor="middle" fill={on ? '#1a1206' : colors.WARM} fontSize={Math.max(13, r * 1.1)} fontFamily={MONO} fontWeight={700}>
          {on ? '1' : '0'}
        </text>
      )}
    </g>
  );
}

function LensRing({ x, y, r, lx, ly, opacity = 1 }: { x: number; y: number; r: number; lx?: number; ly?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const ang = lx !== undefined && ly !== undefined ? Math.atan2(ly - y, lx - x) : 0;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={colors.TEXT} strokeWidth={1.4} />
      {lx !== undefined && ly !== undefined && (
        <line x1={x + r * Math.cos(ang)} y1={y + r * Math.sin(ang)} x2={lx} y2={ly} stroke={colors.TEXT} strokeWidth={1.2} />
      )}
    </g>
  );
}

function Lock({ x, y, open, color = colors.MUTED }: { x: number; y: number; open: number; color?: string }) {
  return (
    <g>
      <rect x={x - 8} y={y - 2} width={16} height={13} rx={2.5} fill={color} />
      <path d={`M${x - 5} ${y - 2}v-5a5 5 0 0 1 10 0v${lerp(5, -3, clamp01(open))}`} fill="none" stroke={color} strokeWidth={2.2} />
    </g>
  );
}

function CodeChip({ x, y, lines, stripe, opacity = 1, fontSize = 14, dimFirst = 0 }: { x: number; y: number; lines: string[]; stripe: string; opacity?: number; fontSize?: number; dimFirst?: number }) {
  if (opacity <= 0.005) return null;
  const w = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6 + 26;
  const h = lines.length * (fontSize + 8) + 10;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} strokeWidth={1} />
      <rect x={x} y={y} width={3.5} height={h} rx={1.5} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 5 + (i + 1) * (fontSize + 8) - 6} fill={colors.TEXT} fontSize={fontSize} fontFamily={MONO} opacity={i === 0 ? 1 - dimFirst * 0.65 : 1}>
          {l}
        </text>
      ))}
    </g>
  );
}

function QuoteCard({ cx, y, text, opacity, w }: { cx: number; y: number; text: string; opacity: number; w: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={cx - w / 2} y={y - 20} width={w} height={40} rx={8} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
      <rect x={cx - w / 2} y={y - 20} width={3.5} height={40} rx={1.5} fill={colors.WARM} />
      <text x={cx} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontStyle="italic">
        “{text}”
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Beat renderers
// ---------------------------------------------------------------------------

function StackLayer(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.stackOp);
  if (op <= 0.005) return null;
  const pos = s.get(sc.stackPos);
  const fwd = s.get(sc.fwdU);
  const bwd = s.get(sc.bwdU);
  const a = s.get(sc.aMark);
  const lamp = s.get(sc.lampU);
  const info = s.get(sc.chipInfoU);
  const gate = s.get(sc.gateU);
  const pass = s.get(sc.passU);
  const b34 = s.get(sc.b34Op);
  const tdim = s.get(sc.tileDim);
  const txt = s.get(sc.stackTextU);
  const fwdReach = (k: NodeKey) => clamp01(fwd * 5 - DEPTH[k] + 1);
  const bwdReach = (k: NodeKey) => clamp01(bwd * 5 - (4 - DEPTH[k]));
  const vals: Record<string, number> = { a, g1: G1(a), g2: G2(a), ab: ABOVE4(a), p10: ABOVE4(a) * 10, p12: (1 - ABOVE4(a)) * 12, res: RESULT(a) };
  const grads: Record<string, number> = { res: GRAD.res, p10: GRAD.p10, p12: GRAD.p12, ab: GRAD.ab, g1: GRAD.g1, g2: GRAD.g2, a: DRESULT_DA(a) };
  const names: Record<string, string> = { g1: 'relu(a−4)', g2: 'relu(a−5)', ab: 'above4', p10: 'above4·10', p12: '(1−above4)·12', res: 'result' };
  const slopes: Record<string, number> = { g1: SLOPE1(a), g2: SLOPE2(a) };
  return (
    <g opacity={op} transform={`translate(${pos.x}, ${pos.y}) scale(${pos.k})`}>
      {/* layer tiles: sparse weight matrices, chapter-1 look */}
      {COLS.map((cx, l) => (
        <g key={l} opacity={1 - 0.85 * tdim}>
          <text x={cx} y={TILE.y - 8} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={txt * (1 - tdim)}>
            layer {l + 1}
          </text>
          <MatrixGrid
            x={cx - TILE_SIZE / 2}
            y={TILE.y}
            values={TILES[l]}
            cell={TILE.cell}
            gap={TILE.gap}
            fill={(v) => (v > 0 ? (l === 0 ? colors.SECONDARY : colors.ACCENT) : DIM_CELL)}
          />
        </g>
      ))}
      {/* edges */}
      {EDGES.map(([f, t, d], i) => {
        const e = edgeEnds(f, t);
        const isOut = t === 'out';
        return (
          <g key={i}>
            <line {...e} stroke={colors.MUTED} strokeWidth={1.4} opacity={isOut ? 0.6 * b34 + 0.4 * (1 - b34) : 0.6} />
            {/* forward dots (amber), one per edge, layer by layer */}
            {fwd > 0 && fwd < 1 && (() => {
              const u = clamp01(fwd * 5 - d);
              if (u <= 0 || u >= 1) return null;
              return <circle cx={lerp(e.x1, e.x2, u)} cy={lerp(e.y1, e.y2, u)} r={5} fill={colors.WARM} />;
            })()}
            {/* backward dots (teal), right to left */}
            {bwd > 0 && bwd < 1 && (() => {
              const u = clamp01(bwd * 5 - (4 - d));
              if (u <= 0 || u >= 1) return null;
              return <circle cx={lerp(e.x2, e.x1, u)} cy={lerp(e.y2, e.y1, u)} r={5} fill={colors.TEAL} />;
            })()}
          </g>
        );
      })}
      {/* the input cell a */}
      <g>
        <text x={NODES.a.x} y={NODES.a.y - 26} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO} opacity={txt}>
          a
        </text>
        <rect x={NODES.a.x - 20} y={NODES.a.y - 17} width={40} height={34} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
        <rect x={NODES.a.x - 20} y={NODES.a.y + 17} width={40} height={3} fill={colors.ACCENT} />
        <text x={NODES.a.x} y={NODES.a.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={info * clamp01(fwd * 5)}>
          {fmtNum(a)}
        </text>
        {bwdReach('a') > 0 && (
          <text x={NODES.a.x} y={NODES.a.y + 40} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={MONO} opacity={bwdReach('a') * info}>
            grad {fmtNum(grads.a)}
          </text>
        )}
      </g>
      {/* operation chips */}
      {(['g1', 'g2', 'ab', 'p10', 'p12', 'res'] as NodeKey[]).map((k) => {
        const n = NODES[k];
        const isGate = k === 'g1' || k === 'g2';
        const lit = isGate && slopes[k] === 1;
        const fr = fwdReach(k) * info;
        const br = bwdReach(k) * info;
        return (
          <g key={k}>
            <rect x={n.x - CHIP_W / 2} y={n.y - CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={6} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1} />
            {isGate && <rect x={n.x - CHIP_W / 2} y={n.y - CHIP_H / 2} width={3.5} height={CHIP_H} rx={1.5} fill={colors.SECONDARY} />}
            {isGate && <ReluGlyph x={n.x - CHIP_W / 2 + 8} y={n.y - 17} color={lamp > 0.5 && lit ? colors.WARM : colors.SECONDARY} />}
            <text x={isGate ? n.x + 12 : n.x} y={n.y - 3} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={txt}>
              {names[k]}
            </text>
            {fr > 0 && (
              <text x={n.x} y={n.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={fr}>
                = {fmtNum(vals[k])}
              </text>
            )}
            {br > 0 && (
              <g opacity={br}>
                <rect x={n.x - 38} y={n.y + CHIP_H / 2 + 4} width={76} height={20} rx={10} fill={colors.TEAL} fillOpacity={0.14} stroke={colors.TEAL} strokeWidth={1} />
                <text x={n.x} y={n.y + CHIP_H / 2 + 18.5} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                  grad {fmtNum(grads[k])}
                </text>
              </g>
            )}
            {isGate && lamp > 0.01 && (
              <g opacity={lamp}>
                <circle cx={n.x - CHIP_W / 2 - 12} cy={n.y} r={6} fill={lit ? colors.WARM : 'none'} stroke={lit ? colors.WARM : colors.MUTED} strokeWidth={1.5} />
                <text x={n.x} y={n.y - CHIP_H / 2 - 7} textAnchor="middle" fill={lit ? colors.WARM : colors.MUTED} fontSize={14} fontFamily={MONO}>
                  slope {slopes[k]}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* B3: what the teal pills are, and what they flow back through */}
      {bwd > 0.01 && info > 0.01 && (
        <g opacity={clamp01(bwd * 3) * info}>
          <text x={325} y={552} textAnchor="middle" fill={colors.TEAL} fontSize={14}>
            gradient: how much each number should change
          </text>
          <text x={325} y={572} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            sent back through the sums, products and relus
          </text>
        </g>
      )}
      {/* B4: the boolean atom on the output */}
      {gate > 0.01 && (
        <g opacity={gate}>
          <rect x={GATE.x - 18} y={GATE.y - 17} width={36} height={34} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <path d={`M${GATE.x - 10} ${GATE.y + 8}H${GATE.x}V${GATE.y - 8}H${GATE.x + 10}`} fill="none" stroke={colors.WARM} strokeWidth={2.2} />
          <text x={GATE.x + 18} y={GATE.y - 26} textAnchor="end" fill={colors.WARM} fontSize={14}>
            boolean atom
          </text>
          {pass > 0.95 && (
            <text x={GATE.x} y={GATE.y + 46} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
              grad 1 in · grad 1 out
            </text>
          )}
        </g>
      )}
    </g>
  );
}

function B0(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b0Op);
  if (op <= 0.005) return null;
  const dl = s.get(sc.dlineU);
  const pu = [s.get(sc.plot1U), s.get(sc.plot2U), s.get(sc.plot3U)];
  const drop = s.get(sc.dropU);
  const ov = s.get(sc.overlayU);
  const lanes = s.get(sc.lanesU);
  const eqT = s.get(sc.eqTickU);
  const P3 = PLOTS[2];
  return (
    <g opacity={op}>
      {/* three plots */}
      {PLOTS.map((p, i) => {
        const u = pu[i];
        if (u <= 0.005) return null;
        return (
          <g key={i}>
            <rect x={p.x0 - 6} y={114} width={p.x1 - p.x0 + 12} height={122} rx={8} fill={colors.PANEL} fillOpacity={0.6} stroke={colors.GRID} />
            <line x1={p.x0} y1={p.Y(0)} x2={p.x1} y2={p.Y(0)} stroke={colors.GRID} strokeWidth={1.2} />
            <line x1={p.X(0)} y1={120} x2={p.X(0)} y2={230} stroke={colors.GRID} strokeWidth={1.2} />
            <FunctionPlot x={p.X} y={p.Y} f={p.f} domain={[-4.5, 4.5]} reveal={u} color={p.color} width={2.6} />
            {D_INTS.map((d, j) => {
              const vis = clamp01(u * 9 - j);
              if (vis <= 0) return null;
              return <circle key={d} cx={p.X(d)} cy={p.Y(p.f(d))} r={4} fill={p.color} opacity={i === 2 ? vis * (1 - drop * 0.6) : vis} />;
            })}
            <MathLabel tex={p.tex} x={(p.x0 + p.x1) / 2} y={96} fontSize={18} opacity={clamp01(u * 2)} boxWidth={300} />
            {i < 2 && <Vec x1={p.x1 + 14} y1={175} x2={PLOTS[i + 1].x0 - 14} y2={175} color={colors.MUTED} width={1.8} head={8} grow={clamp01(pu[i + 1] * 3)} />}
          </g>
        );
      })}
      {/* plot 3 tick labels + the chapter-1 ramp difference, dotted, coinciding */}
      {pu[2] > 0.01 && (
        <g opacity={pu[2]}>
          <text x={P3.x0 - 12} y={P3.Y(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>0</text>
          <text x={P3.x0 - 12} y={P3.Y(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>1</text>
        </g>
      )}
      {ov > 0.01 && (
        <g>
          <path
            d={RAMP_DIFF_PATH}
            fill="none"
            stroke={colors.TEXT}
            strokeWidth={2}
            strokeDasharray="2 5"
            strokeLinecap="round"
            opacity={ov}
          />
          <MathLabel tex={'=\\mathrm{relu}(D+1)-\\mathrm{relu}(D)'} x={960} y={250} fontSize={16} opacity={ov} boxWidth={300} />
          <text x={960} y={274} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={ov}>
            dotted: equal at every integer
          </text>
        </g>
      )}
      {/* the D-line */}
      {dl > 0.005 && (
        <g>
          <line x1={DX(-4.6)} y1={DLINE_Y} x2={lerp(DX(-4.6), DX(4.6), dl)} y2={DLINE_Y} stroke={colors.MUTED} strokeWidth={1.6} />
          <g opacity={clamp01(dl * 2 - 1)}>
            <path d={`M${DX(-4) - 18} 290V282H${DX(4) + 18}V290`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
            <text x={DX(-4) - 18} y={276} fill={colors.MUTED} fontSize={13}>
              declared range
            </text>
            <text x={DX(4.6) + 10} y={DLINE_Y + 5} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>D</text>
          </g>
          {D_INTS.map((d, j) => {
            const vis = clamp01(dl * 9 - j);
            if (vis <= 0) return null;
            const bx = DX(d);
            // the bit dot flies down from plot 3 and lands on the integer
            const u = clamp01(drop * 1.5 - j * 0.05);
            const fx = lerp(P3.X(d), bx, u);
            const fy = lerp(P3.Y(BIT(d)), DLINE_Y, u);
            return (
              <g key={d} opacity={vis}>
                <circle cx={bx} cy={DLINE_Y} r={4} fill={colors.MUTED} opacity={1 - u} />
                <text x={bx} y={DLINE_Y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                  {String(d).replace('-', '−')}
                </text>
                {drop > 0.001 && u < 1 && <circle cx={fx} cy={fy} r={5} fill={colors.WARM} />}
                {u >= 1 && <BitDisc x={bx} y={DLINE_Y} b={D_BITS[j]} />}
              </g>
            );
          })}
          <MathLabel tex={'D=\\dfrac{a-b}{\\mathrm{grid}}'} x={640} y={374} fontSize={19} opacity={clamp01(dl * 2 - 1)} boxWidth={260} />
        </g>
      )}
      {/* lanes: JavaScript's a >= b and the built bit, nine ticks */}
      {lanes > 0.005 && (
        <g>
          <text x={200} y={JS_Y + 5} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={clamp01(lanes * 4)}>
            JavaScript a {'>='} b
          </text>
          <text x={200} y={BUILT_Y + 5} textAnchor="end" fill={colors.WARM} fontSize={14} opacity={clamp01(lanes * 4)}>
            built bit
          </text>
          {D_INTS.map((d, j) => {
            const v = clamp01(lanes * 10 - j);
            const t = clamp01(eqT * 10 - j);
            return (
              <g key={d}>
                <text x={DX(d)} y={JS_Y + 5} textAnchor="middle" fill={d >= 0 ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO} opacity={v}>
                  {d >= 0 ? 'true' : 'false'}
                </text>
                <BitDisc x={DX(d)} y={BUILT_Y} b={D_BITS[j]} opacity={v} />
                <text x={DX(d)} y={(JS_Y + BUILT_Y) / 2 + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={700} opacity={t}>
                  =
                </text>
              </g>
            );
          })}
        </g>
      )}
      <QuoteCard cx={640} y={560} w={940} opacity={s.get(sc.quote0U)} text="For every pair of values within the declared ranges, the bit equals JavaScript's comparison of the two wires' FP32 values." />
    </g>
  );
}

function B1(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b1Op) * clamp01(s.get(sc.gridBU) * 4);
  if (op <= 0.005) return null;
  const gb = s.get(sc.gridBU);
  const sa = s.get(sc.stripAU);
  const cs = s.get(sc.cascU);
  const sb = s.get(sc.stripBU);
  const cb = s.get(sc.combU);
  return (
    <g opacity={op}>
      {/* left: grid declared */}
      <g opacity={gb}>
        <text x={330} y={176} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>
          grid declared
        </text>
        <CodeChip x={180} y={188} lines={['integer bits on a 1/64 grid']} stripe={colors.SECONDARY} />
        <text x={150} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>D</text>
        <Vec x1={162} y1={265} x2={180} y2={265} color={colors.MUTED} width={1.6} head={7} />
        {[
          { x: 184, w: 120, t: 'relu(−D)' },
          { x: 336, w: 206, t: 'relu(1 − relu(−D))' },
        ].map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={248} width={c.w} height={34} rx={6} fill={colors.PANEL} stroke={colors.MUTED} />
            <rect x={c.x} y={248} width={3.5} height={34} rx={1.5} fill={colors.SECONDARY} />
            <ReluGlyph x={c.x + 9} y={256} />
            <text x={c.x + 38} y={270} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{c.t}</text>
            <text x={c.x + c.w / 2} y={302} textAnchor="middle" fill={colors.MUTED} fontSize={13}>layer {i + 1}</text>
          </g>
        ))}
        <Vec x1={306} y1={265} x2={334} y2={265} color={colors.MUTED} width={1.6} head={7} />
        <text x={330} y={334} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontWeight={600}>
          2 operations, 2 layers
        </text>
      </g>
      {/* right: no grid, a sign cascade (schematic) */}
      <g opacity={clamp01(cs * 3)}>
        <text x={900} y={176} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>
          no grid: sign cascade
        </text>
        {STAIR.map((c, i) => {
          const v = clamp01(cs * 15 - i);
          return (
            <g key={i} opacity={v}>
              <rect x={c.x} y={c.y} width={32} height={9} rx={2.5} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1} />
              {i > 0 && i < 14 && <line x1={c.x + 32} y1={c.y + 4.5} x2={STAIR[i + 1].x} y2={STAIR[i + 1].y + 4.5} stroke={colors.MUTED} strokeWidth={1} />}
            </g>
          );
        })}
        <line x1={STAIR[0].x + 16} y1={STAIR[0].y + 9} x2={STAIR[1].x + 16} y2={STAIR[1].y} stroke={colors.MUTED} strokeWidth={1} opacity={clamp01(cs * 15 - 1)} />
        <text x={1050} y={238} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontWeight={600} opacity={clamp01(cs * 2 - 1)}>
          15 operations, 14 layers
        </text>
        <text x={1050} y={258} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={clamp01(cs * 2 - 1)}>
          for a {'>='} b · staircase is schematic
        </text>
      </g>
      {/* the two strips */}
      <g>
        <text x={STRIP.x0 + 6 * STRIP.pitch - STRIP.pitch / 2} y={STRIP.yA - 34} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          twelve samples of D
        </text>
        {STRIP_D.map((d, i) => {
          const x = STRIP.x0 + i * STRIP.pitch;
          const ua = clamp01(sa * 12 - i);
          const ub = clamp01(sb * 12 - i);
          const uc = clamp01(cb * 12 - i);
          return (
            <g key={i}>
              <text x={x} y={STRIP.yA - 17} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(gb * 2 - 1)}>
                {String(d).replace('-', '−')}
              </text>
              <BitDisc x={x} y={STRIP.yA} b={STRIP_BITS[i]} opacity={ua} />
              <BitDisc x={x} y={STRIP.yB} b={STRIP_BITS[i]} opacity={ub} />
              <text x={x} y={(STRIP.yA + STRIP.yB) / 2 + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={700} opacity={uc}>
                =
              </text>
            </g>
          );
        })}
        <text x={STRIP.x0 - 24} y={STRIP.yA + 5} textAnchor="end" fill={colors.TEXT} fontSize={14} opacity={clamp01(sa * 4)}>
          from 2 operations
        </text>
        <text x={STRIP.x0 - 24} y={STRIP.yB + 5} textAnchor="end" fill={colors.TEXT} fontSize={14} opacity={clamp01(sb * 4)}>
          from 15 operations
        </text>
        <text x={STRIP.x0 + 12 * STRIP.pitch} y={(STRIP.yA + STRIP.yB) / 2 + 6} fill={colors.POSITIVE} fontSize={17} fontWeight={650} opacity={cb}>
          same bits
        </text>
      </g>
    </g>
  );
}

const SPRING = (t: number): number => 20 * (1 - Math.exp(-4 * t) * (Math.cos(6 * t) + (4 / 6) * Math.sin(6 * t)));
const SPX = scaleLinear([0, 1.6], [650, 960]);
const SPY = scaleLinear([-1, 24], [440, 236]);
const LOUPE_T = 0.42;
const LOUPE = { x: 1075, y: 318, r: 62 };

function B2(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b2Op) * clamp01(s.get(sc.decU) * 4);
  if (op <= 0.005) return null;
  const dec = s.get(sc.decU);
  const pos = s.get(sc.posU);
  const lp = s.get(sc.loupeU);
  const px = SPX(LOUPE_T);
  const py = SPY(SPRING(LOUPE_T));
  const slope = (SPY(SPRING(LOUPE_T + 0.01)) - SPY(SPRING(LOUPE_T - 0.01))) / (SPX(LOUPE_T + 0.01) - SPX(LOUPE_T - 0.01));
  const ang = (Math.atan(slope) * 180) / Math.PI;
  return (
    <g opacity={op}>
      {/* decisions */}
      <g opacity={dec}>
        <text x={330} y={190} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={650}>decisions</text>
        <BitDisc x={260} y={290} b={1} r={26} />
        <BitDisc x={400} y={290} b={0} r={26} />
        <text x={260} y={344} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={MONO}>on</text>
        <text x={400} y={344} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={MONO}>armed</text>
        <text x={330} y={400} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontWeight={650}>✓ exact</text>
        <text x={330} y={424} textAnchor="middle" fill={colors.MUTED} fontSize={14}>same bit as JavaScript, every frame</text>
      </g>
      <line x1={560} y1={170} x2={560} y2={470} stroke={colors.GRID} strokeWidth={1.5} opacity={pos} />
      {/* positions */}
      <g opacity={clamp01(pos * 3)}>
        <text x={860} y={190} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={650}>positions</text>
        <line x1={SPX(0)} y1={SPY(0)} x2={SPX(1.6)} y2={SPY(0)} stroke={colors.MUTED} strokeWidth={1.2} />
        <line x1={SPX(0)} y1={SPY(0)} x2={SPX(0)} y2={SPY(23)} stroke={colors.MUTED} strokeWidth={1.2} />
        <line x1={SPX(0) - 4} y1={SPY(20)} x2={SPX(1.6)} y2={SPY(20)} stroke={colors.GRID} strokeDasharray="4 4" />
        <text x={SPX(0) - 8} y={SPY(20) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>20 px</text>
        <text x={SPX(0) - 8} y={SPY(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>0</text>
        <text x={SPX(0.8)} y={SPY(0) + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13}>time · thumb offset (schematic)</text>
        <FunctionPlot x={SPX} y={SPY} f={SPRING} reveal={pos} color={colors.ACCENT} width={2.6} />
      </g>
      {lp > 0.01 && (
        <g opacity={lp}>
          <LensRing x={px} y={py} r={14} lx={LOUPE.x - LOUPE.r * 0.97} ly={LOUPE.y + LOUPE.r * 0.2} />
          <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.4} />
          <clipPath id="hw5-loupe">
            <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r - 1} />
          </clipPath>
          <g clipPath="url(#hw5-loupe)" transform={`rotate(${ang}, ${LOUPE.x}, ${LOUPE.y})`}>
            <rect x={LOUPE.x - 80} y={LOUPE.y - 1.5} width={160} height={3} fill={colors.WARM} opacity={0.45} />
            <line x1={LOUPE.x - 80} y1={LOUPE.y - 1.5} x2={LOUPE.x + 80} y2={LOUPE.y - 1.5} stroke={colors.ACCENT} strokeWidth={1} />
            <line x1={LOUPE.x - 80} y1={LOUPE.y + 1.5} x2={LOUPE.x + 80} y2={LOUPE.y + 1.5} stroke={colors.TEXT} strokeWidth={1} strokeDasharray="3 3" />
          </g>
          <text x={LOUPE.x} y={LOUPE.y + LOUPE.r + 24} textAnchor="middle" fill={colors.WARM} fontSize={16} fontFamily={MONO} fontWeight={650}>
            at most 1.3e-6 px
          </text>
          <text x={LOUPE.x} y={LOUPE.y + LOUPE.r + 44} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
            across a 20 px travel
          </text>
          <text x={LOUPE.x} y={LOUPE.y + LOUPE.r + 63} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            the stated bound, not measured here
          </text>
          <text x={LOUPE.x} y={LOUPE.y - LOUPE.r - 10} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            FP32 vs FP64 (double)
          </text>
        </g>
      )}
      <QuoteCard cx={640} y={540} w={560} opacity={s.get(sc.quote2U)} text="Exactness means equality to the stated FP32 calculation" />
    </g>
  );
}

function B34(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b34Op);
  const pu = s.get(sc.plotU);
  if (op <= 0.005 || pu <= 0.005) return null;
  const hard = s.get(sc.hardU);
  const a = s.get(sc.aMark);
  const mk = s.get(sc.markU);
  const eq = s.get(sc.eq3U);
  const rd = s.get(sc.readU);
  const fwd = s.get(sc.fwdU);
  const gd = s.get(sc.gdotU);
  const wall = s.get(sc.wallU);
  const err = s.get(sc.errU);
  const st = s.get(sc.stU);
  const pass = s.get(sc.passU);
  const note = s.get(sc.noteU);
  const da = DRESULT_DA(a);
  // the gradient dot: from the jump to the wall, then (straight-through) on to the result chip
  const resRight = NODES.res.x + CHIP_W / 2;
  let gx = lerp(GDOT_FROM.x, WALL_X + 8, gd);
  let gy = lerp(GDOT_FROM.y, GATE.y, gd);
  if (pass > 0) {
    gx = lerp(WALL_X + 8, resRight + 6, pass);
    gy = GATE.y;
  }
  const showDot = gd > 0.001 && pass < 0.999;
  // the wall: a vertical bar that becomes a dashed straight line (the stand-in)
  const wx1 = lerp(WALL_X, WALL_X - 18, st);
  const wy1 = lerp(GATE.y - 22, GATE.y + 20, st);
  const wx2 = lerp(WALL_X, WALL_X + 18, st);
  const wy2 = lerp(GATE.y + 22, GATE.y - 20, st);
  const wallCol = st > 0.5 ? colors.TEAL : colors.NEGATIVE;
  return (
    <g opacity={op}>
      {/* plot frame */}
      <g opacity={pu}>
        <text x={970} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600} opacity={1 - clamp01(hard * 3)}>
          result as the input a slides
        </text>
        <text x={RX(7)} y={192} textAnchor="end" fill={colors.WARM} fontSize={16} fontWeight={600} opacity={hard}>
          a hard decision: a rounding bit
        </text>
        <line x1={RX(2)} y1={400} x2={RX(7)} y2={400} stroke={colors.MUTED} strokeWidth={1.2} />
        <line x1={RX(2)} y1={400} x2={RX(2)} y2={170} stroke={colors.MUTED} strokeWidth={1.2} />
        {[2, 3, 4, 5, 6, 7].map((v) => (
          <text key={v} x={RX(v)} y={420} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{v}</text>
        ))}
        <text x={RX(7) + 12} y={404} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>a</text>
        {[10, 11, 12].map((v) => (
          <text key={v} x={RX(2) - 10} y={PY_RES(v) + 5} textAnchor="end" fill={colors.MUTED} fontSize={14} fontFamily={MONO} opacity={1 - hard}>{v}</text>
        ))}
        {[0, 1].map((v) => (
          <text key={v} x={RX(2) - 10} y={PY_BIT(v) + 5} textAnchor="end" fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={hard}>{v}</text>
        ))}
        <FunctionPlot x={RX} y={ID} f={BIT_PX} morph={{ from: RES_PX, u: hard }} domain={[2, 7]} samples={400} reveal={pu} color={hard > 0.5 ? colors.WARM : colors.POSITIVE} width={2.8} />
      </g>
      {/* marker on result(a) */}
      {mk > 0.01 && (
        <g opacity={mk}>
          <line x1={RX(a)} y1={400} x2={RX(a)} y2={RES_PX(a)} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="3 4" />
          <circle cx={RX(a)} cy={RES_PX(a)} r={7} fill={colors.WARM} />
          <text x={RX(a)} y={RES_PX(a) - 14} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
            a = {fmtNum(a)}
          </text>
        </g>
      )}
      {/* forward arrival dot at the plot */}
      {fwd > 0.8 && fwd < 1 && <circle cx={RX(a)} cy={RES_PX(a)} r={11} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={(1 - fwd) * 5} />}
      <MathLabel tex={'\\text{result}=12-2\\big(\\mathrm{relu}(a-4)-\\mathrm{relu}(a-5)\\big)'} x={970} y={452} fontSize={18} opacity={eq} boxWidth={520} />
      <text x={970} y={482} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={eq}>
        derived from the README formulas
      </text>
      <MathLabel tex={`\\dfrac{\\partial\\,\\text{result}}{\\partial a}=${da === 0 ? '0' : String(da)}`} x={970} y={530} fontSize={24} color={da === 0 ? colors.TEXT : colors.TEAL} opacity={rd} boxWidth={360} />
      {/* B4: the gradient dot, the wall, the stand-in */}
      {wall > 0.01 && (
        <line x1={wx1} y1={wy1} x2={wx2} y2={wy2} stroke={wallCol} strokeWidth={lerp(5, 2.4, st)} strokeDasharray={st > 0.5 ? '5 4' : undefined} strokeLinecap="round" opacity={Math.min(1, wall)} />
      )}
      {wall > 0.5 && st < 0.5 && (
        <text x={WALL_X + 10} y={GATE.y + 44} fill={colors.NEGATIVE} fontSize={14} fontWeight={650} opacity={1 - st * 2}>
          throws
        </text>
      )}
      {st > 0.01 && (
        <g opacity={st}>
          <line x1={RX(4)} y1={PY_BIT(0)} x2={lerp(RX(4), RX(5), st)} y2={lerp(PY_BIT(0), PY_BIT(1), st)} stroke={colors.TEAL} strokeWidth={2.2} strokeDasharray="6 5" />
          <text x={RX(2) + 14} y={196} fill={colors.TEAL} fontSize={14} fontWeight={600}>
            straight-through:
          </text>
          <text x={RX(2) + 14} y={216} fill={colors.TEAL} fontSize={14}>
            pretend the step is a straight line
          </text>
        </g>
      )}
      {showDot && (
        <g>
          <circle cx={gx} cy={gy} r={7} fill={colors.TEAL} />
          <text x={gx + 11} y={gy - 11} fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
            grad 1
          </text>
        </g>
      )}
      <CodeChip
        x={620}
        y={478}
        lines={err > 0 && st > 0.01 ? ["throw new Error('cannot backpropagate through a boolean atom')", 'accumulateTermGradients(gradients, operation.leftTerms, outputGradient)'] : ["throw new Error('cannot backpropagate through a boolean atom')"]}
        stripe={st > 0.5 ? colors.TEAL : colors.NEGATIVE}
        opacity={err}
        fontSize={13}
        dimFirst={st}
      />
      <g transform={`translate(${lerp(40, 0, st)}, 0)`}>
        <CodeChip x={620} y={542} lines={["{booleanGradient: 'straight-through'}"]} stripe={colors.TEAL} opacity={st} fontSize={14} />
      </g>
      {note > 0.01 && (
        <g opacity={note}>
          {['a cascade gives its', 'operands gradient 0,', 'the derivative of a step'].map((l, i) => (
            <text key={i} x={RX(7)} y={272 + i * 19} textAnchor="end" fill={colors.TEXT} fontSize={13}>
              {l}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

function DesktopMock({ u }: { u: number }) {
  if (u <= 0.005) return null;
  const win = (x: number, y: number, w: number, h: number, title: string, body: ReactNode, k: number) => (
    <g opacity={clamp01(u * 3 - k)}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#111a2b" stroke={colors.MUTED} strokeWidth={1.2} />
      <rect x={x} y={y} width={w} height={24} rx={8} fill="#1a2438" />
      <text x={x + 12} y={y + 17} fill={colors.TEXT} fontSize={14}>{title}</text>
      {body}
    </g>
  );
  return (
    <g>
      <rect x={380} y={190} width={520} height={290} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} opacity={clamp01(u * 3)} />
      {win(400, 210, 210, 170, 'Monitor', (
        <g>
          {[0.5, 0.8, 0.35, 0.65, 0.9, 0.45, 0.7, 0.55].map((h, i) => (
            <rect key={i} x={414 + i * 23} y={366 - h * 110} width={15} height={h * 110} rx={2} fill={colors.ACCENT} opacity={0.55} />
          ))}
        </g>
      ), 0)}
      {win(548, 256, 196, 172, 'Notes', (
        <g>
          {[150, 120, 160, 90, 140, 110].map((w, i) => (
            <rect key={i} x={562} y={296 + i * 20} width={w} height={6} rx={3} fill={colors.MUTED} opacity={0.5} />
          ))}
        </g>
      ), 0.6)}
      {win(694, 206, 190, 168, 'Photos', (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={706 + (i % 3) * 57} y={242 + Math.floor(i / 3) * 62} width={51} height={56} rx={4} fill={PHOTO_HUES[i]} opacity={0.75} />
          ))}
        </g>
      ), 1.2)}
      <g opacity={clamp01(u * 3 - 1.8)}>
        <rect x={530} y={442} width={220} height={28} rx={10} fill="#1a2438" stroke={colors.MUTED} strokeWidth={1} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={560 + i * 40} cy={456} r={8} fill={[colors.ACCENT, colors.WARM, colors.POSITIVE, colors.SECONDARY, colors.TEAL][i]} opacity={0.8} />
        ))}
      </g>
    </g>
  );
}

function B5(s: SceneState, sc: S): ReactNode {
  const arcs = s.get(sc.arcsU);
  const mock = s.get(sc.mockU);
  const cnt = s.get(sc.countU);
  const txt = s.get(sc.b5TextU);
  const lock = s.get(sc.lock5U);
  const b6 = s.get(sc.b6Op);
  if (arcs <= 0.005 && mock <= 0.005 && cnt <= 0.005 && lock <= 0.005) return null;
  const counters = [
    { v: DESKTOP.cells, l: 'cells', x: 150, y: 540, k: 0 },
    { v: DESKTOP.ops, l: 'live operations', x: 150, y: 588, k: 1 },
    { v: DESKTOP.layers, l: 'layers', x: 960, y: 540, k: 2 },
    { v: DESKTOP.weights, l: 'weights', x: 960, y: 588, k: 3 },
  ];
  const lockOpen = clamp01(lock - 1);
  return (
    <g>
      {/* 9,909 placeholder arcs, ≤ 0.25 */}
      {arcs > 0.005 &&
        ARC_CHUNKS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={i % 2 ? colors.SECONDARY : colors.ACCENT} strokeWidth={0.6} opacity={0.25 * clamp01(arcs * 6 - i) * (arcs < 1 ? 1 : 1) * Math.min(1, arcs * 1)} />
        ))}
      <DesktopMock u={mock} />
      {cnt > 0.005 && (
        <g opacity={clamp01(cnt * 4)}>
          {counters.map((c) => {
            const u = clamp01(cnt * 1.3 - c.k * 0.1);
            return (
              <g key={c.l}>
                <text x={c.x} y={c.y} fill={colors.WARM} fontSize={26} fontFamily={MONO} fontWeight={700}>
                  {commas(Math.round(c.v * u))}
                </text>
                <text x={c.x + 92} y={c.y} fill={colors.TEXT} fontSize={17}>
                  {c.l}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {txt > 0.005 && (
        <g opacity={txt}>
          <QuoteCard cx={640} y={150} w={780} opacity={1} text="The program has 234 source cells, 4,646 live operations in 130 layers and 9,909 stored weights" />
          <text x={640} y={505} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
            arcs: one per stored weight (placeholder) · desktop sketch, not a screenshot
          </text>
        </g>
      )}
      {lock > 0.005 && (
        <g opacity={Math.min(1, lock) * (lock > 1 ? b6 : 1)}>
          {lock <= 1.001 ? (
            <g>
              <Lock x={566} y={566} open={0} color={colors.MUTED} />
              <text x={584} y={576} fill={colors.TEXT} fontSize={17} fontWeight={600}>
                desktop demo: frozen, none trained
              </text>
            </g>
          ) : (
            <g>
              <Lock x={420} y={482} open={lockOpen} color={colors.POSITIVE} />
              <text x={436} y={492} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                unfrozen
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function B6(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b6Op);
  const net = s.get(sc.netU);
  if (op <= 0.005 || net <= 0.005) return null;
  const wd = s.get(sc.wdotU);
  const rect = s.get(sc.rectU);
  const pile = s.get(sc.pileU);
  const fit = s.get(sc.fitU);
  const tag = s.get(sc.b6TagU);
  const heads = ['features', '6 units', '6 units', '4 outputs'];
  const outs = ['left', 'top', 'width', 'height'];
  return (
    <g opacity={op}>
      {/* the network: features → 6 → 6 → 4 */}
      {NET.paths.map((d, l) => (
        <path key={l} d={d} fill="none" stroke={colors.MUTED} strokeWidth={0.8} opacity={0.45 * clamp01(net * 4 - l - 0.5)} />
      ))}
      {NET.layers.map((col, l) => (
        <g key={l} opacity={clamp01(net * 4 - l)}>
          <text x={col[0].x} y={164} textAnchor="middle" fill={colors.MUTED} fontSize={14}>{heads[l]}</text>
          {col.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={l === 0 ? 6 : 9} fill={colors.PANEL} stroke={l === 0 ? colors.ACCENT : l === 3 ? colors.POSITIVE : colors.SECONDARY} strokeWidth={1.8} />
          ))}
          {l === 3 &&
            col.map((n, i) => (
              <text key={i} x={n.x + 16} y={n.y + 5} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{outs[i]}</text>
            ))}
        </g>
      ))}
      <text x={90} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={clamp01(net * 2)}>
        slot position, sine and cosine
      </text>
      {/* 244 weights = the program's 244 source cells */}
      {WEIGHT_DOTS.map((w, i) => {
        const v = clamp01(wd * 244 / 20 - i / 20);
        if (v <= 0) return null;
        const drift = 0.5 + 0.5 * Math.sin(2 * Math.PI * (w.ph + fit * 1.5));
        return <circle key={i} cx={w.x} cy={w.y} r={2.2} fill={ACCENT_TO_VIOLET(fit > 0 ? drift * clamp01(fit * 4) : 0)} opacity={v} />;
      })}
      <text x={286} y={560} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={wd}>
        244 weights · the program's 244 source cells
      </text>
      {/* the sketch panel: target rectangles and the photos */}
      {rect > 0.005 && (
        <g>
          <text x={SK.x + SK.w / 2} y={158} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={rect}>
            sketch (schematic) · Story preset: 10 rectangles on a 5-wide, 4-tall stage
          </text>
          <rect x={SK.x} y={SK.y} width={SK.w} height={SK.h} rx={6} fill={colors.PANEL} fillOpacity={0.5} stroke={colors.GRID} opacity={rect} />
          {TARGETS.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill="none" stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="5 4" opacity={clamp01(rect * 10 - i)} />
          ))}
        </g>
      )}
      {pile > 0.005 &&
        PILE.map((p, i) => {
          const T = TARGETS[i];
          const u = ease.move(clamp01((fit * 1.5 - p.delay) / 0.8));
          const w = lerp(88, T.w, u);
          const h = lerp(66, T.h, u);
          const cx = lerp(p.cx, T.x + T.w / 2, u);
          const cy = lerp(p.cy, T.y + T.h / 2, u);
          const rot = lerp(p.rot, 0, u);
          const m = Math.min(w, h);
          return (
            <g key={i} opacity={pile} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={p.hue} stroke={colors.TEXT} strokeWidth={1.2} strokeOpacity={0.5} />
              <path d={`M${-w / 2 + 4} ${h / 2 - 4}L${-w / 2 + m * 0.45} ${h / 2 - m * 0.5}L${-w / 2 + m * 0.8} ${h / 2 - 4}Z`} fill="#0a0e1a" opacity={0.35} />
              <circle cx={w / 2 - m * 0.22} cy={-h / 2 + m * 0.22} r={m * 0.09} fill="#f8e7b0" opacity={0.6} />
            </g>
          );
        })}
      {pile > 0.005 && fit < 0.05 && (
        <text x={SK.x + SK.w / 2} y={SK.y + SK.h - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={pile * (1 - fit * 20)}>
          the seeded weights put the photos in a pile
        </text>
      )}
      {tag > 0.005 && (
        <g opacity={tag}>
          <text x={SK.x} y={546} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
            step {Math.round(GALLERY.shown * fit)}
          </text>
          <text x={SK.x + 120} y={546} fill={colors.WARM} fontSize={15}>
            Story: first fit in {GALLERY.fitLo} to {GALLERY.fitHi} steps
          </text>
          <text x={SK.x} y={570} fill={colors.TEXT} fontSize={15}>
            Adam · {GALLERY.stepsPerSecond} steps a second
          </text>
          <text x={SK.x + 230} y={570} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            schematic · shown slower than real time
          </text>
        </g>
      )}
    </g>
  );
}

function B78(s: SceneState, sc: S): ReactNode {
  const op = s.get(sc.b78Op);
  const mu = s.get(sc.mapU);
  if (op <= 0.005 || mu <= 0.005) return null;
  const one = s.get(sc.oneU);
  const bar = s.get(sc.barU);
  const lit = s.get(sc.mapLit);
  const flash = s.get(sc.flashU);
  const match = s.get(sc.matchU);
  const tag = s.get(sc.mapTagU);
  const card = s.get(sc.cardU);
  const dim = s.get(sc.mapDim);
  const ruler = s.get(sc.rulerU);
  const bands = [s.get(sc.band1), s.get(sc.band2), s.get(sc.band3), s.get(sc.band4)];
  const ovl = s.get(sc.overlapU);
  const mapOp = lerp(1, 0.15, dim);
  const baseOp = 0.07 + 0.28 * lit + 0.65 * clamp01(flash);
  const decades = [0.001, 0.01, 0.1, 1, 10, 100];
  const decLabel = ['1 ms', '10 ms', '100 ms', '1 s', '10 s', '100 s'];
  return (
    <g opacity={op}>
      {/* the dot map: one dot per 10 documents */}
      <g opacity={mapOp * mu}>
        <path d={MAP_PATHS.base} fill={flash > 0.05 ? '#f1f5f9' : '#9fb0c8'} opacity={baseOp} />
        <path d={MAP_PATHS.copper} fill={match > 0.01 ? COPPER : '#9fb0c8'} opacity={match > 0.01 ? lerp(baseOp, 1, match) : baseOp} />
      </g>
      {one > 0.005 && (
        <g opacity={one}>
          <rect x={ONE_DOT.x - MAP.sq} y={ONE_DOT.y - MAP.sq} width={MAP.sq * 2} height={MAP.sq * 2} fill={colors.WARM} />
          <LensRing x={ONE_DOT.x} y={ONE_DOT.y} r={12} lx={548} ly={ONE_DOT.y} />
        </g>
      )}
      {bar > 0.005 && (
        <g opacity={clamp01(bar * 2)}>
          <text x={552} y={ONE_DOT.y - 22} fill={colors.TEXT} fontSize={15}>
            one document on the graphics card
          </text>
          <rect x={552} y={ONE_DOT.y - 9} width={220 * bar} height={18} rx={4} fill={colors.MUTED} opacity={0.75} />
          <text x={552 + 220 * bar + 10} y={ONE_DOT.y + 5} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            0.6 ms or more
          </text>
          <text x={552} y={ONE_DOT.y + 34} fill={colors.MUTED} fontSize={14}>
            the round trip alone: wasted on a single document
          </text>
        </g>
      )}
      {tag > 0.005 && (
        <g opacity={tag * (1 - dim)}>
          <text x={530} y={540} fill={colors.TEXT} fontSize={14}>1 dot = 10 documents · copper = a match · positions illustrative</text>
          <text x={530} y={562} fill={colors.MUTED} fontSize={14}>default 100,000 documents (a window 720 px or wider)</text>
        </g>
      )}
      {card > 0.005 && (
        <g opacity={card * (1 - dim)} transform={`translate(${lerp(40, 0, card)}, 0)`}>
          <text x={580} y={176} fill={colors.MUTED} fontSize={14}>an example line the page prints (README)</text>
          <rect x={580} y={188} width={600} height={112} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <rect x={580} y={188} width={3.5} height={112} rx={1.5} fill={COPPER} />
          {['10,559 of 100,000 documents match.', 'This program: 13 ms on the GPU.', 'Native RegExp: 21 ms.'].map((l, i) => (
            <text key={i} x={600} y={222 + i * 30} fill={i === 0 ? COPPER : colors.TEXT} fontSize={18} fontFamily={MONO}>
              {l}
            </text>
          ))}
        </g>
      )}
      {/* the log-time ruler */}
      {ruler > 0.005 && (
        <g>
          <line x1={LX(0.001)} y1={RULER.axisY} x2={lerp(LX(0.001), LX(100), ruler)} y2={RULER.axisY} stroke={colors.MUTED} strokeWidth={1.4} />
          {decades.map((d, i) => (
            <g key={d} opacity={clamp01(ruler * 6 - i)}>
              <line x1={LX(d)} y1={RULER.axisY - 5} x2={LX(d)} y2={RULER.axisY + 5} stroke={colors.MUTED} strokeWidth={1.2} />
              <line x1={LX(d)} y1={RULER.rows[0] - 22} x2={LX(d)} y2={RULER.axisY} stroke={colors.GRID} strokeWidth={1} />
              <text x={LX(d)} y={RULER.axisY + 22} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{decLabel[i]}</text>
            </g>
          ))}
          <g opacity={ruler}>
            <text x={LX(0.001)} y={RULER.axisY + 46} fill={colors.MUTED} fontSize={15}>
              per keystroke, includes compiling the pattern and reading back
            </text>
            <text x={LX(0.001)} y={RULER.axisY + 68} fill={colors.TEXT} fontSize={15}>
              measured on an Apple M5 Max, Chrome 155 (src/json-search/README.md:53)
            </text>
          </g>
          {BANDS.map((b, i) => {
            const u = bands[i];
            if (u <= 0.005) return null;
            const y = RULER.rows[i];
            const x0 = LX(b.lo);
            const x1 = Math.max(LX(b.hi), x0 + 6);
            const isPoint = b.lo === b.hi;
            return (
              <g key={i} opacity={u}>
                {isPoint ? (
                  <path d={`M${x0} ${y - 9}L${x0 + 8} ${y}L${x0} ${y + 9}L${x0 - 8} ${y}Z`} fill={b.color} />
                ) : (
                  <rect x={x0} y={y - 7} width={(x1 - x0) * u} height={14} rx={3} fill={b.color} />
                )}
                <text
                  x={b.side === 'right' ? x1 + 12 : x0 - 14}
                  y={y + 5}
                  textAnchor={b.side === 'right' ? 'start' : 'end'}
                  fill={b.color === colors.MUTED ? colors.TEXT : b.color}
                  fontSize={14}
                >
                  {b.label}
                </text>
              </g>
            );
          })}
          {ovl > 0.005 && (
            <g opacity={ovl}>
              <rect x={LX(0.011)} y={RULER.rows[0] - 14} width={LX(0.015) - LX(0.011)} height={RULER.rows[1] - RULER.rows[0] + 28} fill={colors.WARM} opacity={0.18} />
              <text x={(LX(0.011) + LX(0.015)) / 2} y={RULER.rows[0] - 24} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                11–15 ms
              </text>
              <path
                d={`M${LX(0.008) - 10} ${RULER.rows[0] - 12}h-8V${RULER.rows[1] + 12}h8`}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={1.8}
              />
              <text x={LX(0.008) - 26} y={(RULER.rows[0] + RULER.rows[1]) / 2 + 5} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={650}>
                neither is always faster
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function PanelGlyph({ i }: { i: number }): ReactNode {
  if (i === 0)
    return (
      <g>
        <path d="M20 146H92L116 112H190" fill="none" stroke={colors.WARM} strokeWidth={2.5} />
        <rect x={40} y={54} width={46} height={30} rx={5} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
        <text x={63} y={74} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>10</text>
        <g opacity={0.35}>
          <rect x={122} y={54} width={46} height={30} rx={5} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={145} y={74} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>12</text>
        </g>
        <BitDisc x={105} y={104} b={1} r={9} label={false} />
      </g>
    );
  if (i === 1)
    return (
      <g>
        <rect x={26} y={52} width={60} height={30} rx={15} fill={colors.POSITIVE} fillOpacity={0.3} stroke={colors.POSITIVE} strokeWidth={1.5} />
        <circle cx={70} cy={67} r={11} fill={colors.TEXT} />
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x={22 + k * 21} y={104} width={17} height={20} rx={3} fill={colors.PANEL} stroke={k < 3 ? colors.ACCENT : k === 3 ? colors.WARM : colors.MUTED} strokeWidth={1.3} />
        ))}
        <rect x={22} y={132} width={80} height={10} rx={3} fill={colors.MUTED} opacity={0.35} />
      </g>
    );
  if (i === 2)
    return (
      <g>
        <rect x={20} y={50} width={170} height={16} rx={4} fill={colors.TEAL} opacity={0.65} />
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x={22 + k * 21} y={80} width={17} height={24} rx={3} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
        ))}
        <rect x={20} y={118} width={170} height={16} rx={4} fill={colors.TEAL} opacity={0.65} />
      </g>
    );
  if (i === 3)
    return (
      <g>
        <path d="M26 46V146H192" fill="none" stroke={colors.MUTED} strokeWidth={1.3} />
        {Array.from({ length: 6 }, (_, k) => (
          <circle key={k} cx={40 + k * 15} cy={136 - k * 15} r={4} fill={colors.MUTED} />
        ))}
        {Array.from({ length: 5 }, (_, k) => (
          <circle key={k} cx={118 + k * 15} cy={132} r={4} fill={colors.POSITIVE} />
        ))}
        <Vec x1={128} y1={64} x2={150} y2={118} color={colors.WARM} width={2} head={8} />
      </g>
    );
  return (
    <g>
      {Array.from({ length: 60 }, (_, k) => (
        <rect key={k} x={24 + (k % 12) * 9} y={56 + Math.floor(k / 12) * 9} width={6} height={6} fill={k % 9 === 4 ? COPPER : '#9fb0c8'} opacity={k % 9 === 4 ? 1 : 0.4} />
      ))}
      <BitDisc x={166} y={78} b={1} r={12} />
      <path d="M24 136H188" stroke={colors.TEAL} strokeWidth={2} strokeDasharray="5 4" />
    </g>
  );
}

function B9(s: SceneState, sc: S): ReactNode {
  const pu = s.get(sc.panelsU);
  if (pu <= 0.005) return null;
  const out = s.get(sc.panelsOut);
  if (out >= 0.999) return null;
  const lits = [s.get(sc.lit1), s.get(sc.lit2), s.get(sc.lit3), s.get(sc.lit4), 0];
  return (
    <g opacity={1 - out} transform={`translate(0, ${-50 * out})`}>
      {PANEL_TITLES.map((title, i) => {
        const u = ease.enter(clamp01(pu * 1.8 - i * 0.2));
        if (u <= 0) return null;
        const lit = lits[i];
        const x = PANEL_X(i);
        const y = PANEL_Y + (1 - u) * 30;
        return (
          <g key={i} opacity={u * lerp(0.35, 1, lit)} transform={`translate(${x}, ${y})`}>
            <rect width={PANEL_W} height={PANEL_H} rx={10} fill={colors.PANEL} stroke={lit > 0.5 ? colors.WARM : colors.GRID} strokeWidth={lit > 0.5 ? 2 : 1.2} />
            <text x={12} y={24} fill={colors.WARM} fontSize={14} fontWeight={700}>{i + 1}</text>
            <text x={28} y={24} fill={colors.TEXT} fontSize={13}>{title}</text>
            <PanelGlyph i={i} />
          </g>
        );
      })}
    </g>
  );
}

function B10(s: SceneState, sc: S): ReactNode {
  const u = s.get(sc.closeU);
  if (u <= 0.005) return null;
  const eq = s.get(sc.closeEqU);
  const D = { x: 640, y: 196 };
  const T10 = { x: 500, y: 322 };
  const T12 = { x: 780, y: 322 };
  const R = { x: 640, y: 446 };
  const tile = (x: number, y: number, v: string, dashed: boolean, color: string) => (
    <g>
      <rect x={x - 60} y={y - 40} width={120} height={80} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={2} strokeDasharray={dashed ? '7 5' : undefined} />
      <text x={x} y={y + 12} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontFamily={MONO} fontWeight={650}>{v}</text>
    </g>
  );
  return (
    <g opacity={u} transform={`translate(0, ${lerp(16, 0, u)})`}>
      {/* the bit weights both answers */}
      <line x1={D.x - 20} y1={D.y + 18} x2={T10.x + 30} y2={T10.y - 42} stroke={colors.WARM} strokeWidth={2} />
      <line x1={D.x + 20} y1={D.y + 18} x2={T12.x - 30} y2={T12.y - 42} stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 5" opacity={0.5} />
      <text x={(D.x + T10.x) / 2 - 22} y={(D.y + T10.y) / 2 - 6} textAnchor="end" fill={colors.WARM} fontSize={20} fontFamily={MONO} fontWeight={650}>× 1</text>
      <text x={(D.x + T12.x) / 2 + 22} y={(D.y + T12.y) / 2 - 6} fill={colors.WARM} fontSize={20} fontFamily={MONO} fontWeight={650} opacity={0.6}>× 0</text>
      <BitDisc x={D.x} y={D.y} b={1} r={24} />
      <text x={D.x} y={D.y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={15}>the bit, exactly 1</text>
      {tile(T10.x, T10.y, '10', false, colors.POSITIVE)}
      <g opacity={0.35}>{tile(T12.x, T12.y, '12', true, colors.POSITIVE)}</g>
      <Vec x1={T10.x + 30} y1={T10.y + 44} x2={R.x - 24} y2={R.y - 40} color={colors.POSITIVE} width={2.4} head={10} />
      <g opacity={0.35}>
        <Vec x1={T12.x - 30} y1={T12.y + 44} x2={R.x + 24} y2={R.y - 40} color={colors.MUTED} width={2} head={9} />
      </g>
      <rect x={R.x - 60} y={R.y - 36} width={120} height={72} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.6} />
      <text x={R.x} y={R.y + 12} textAnchor="middle" fill={colors.POSITIVE} fontSize={34} fontFamily={MONO} fontWeight={700}>10</text>
      <MathLabel tex={'\\text{result}=b\\cdot 10+(1-b)\\cdot 12'} x={640} y={548} fontSize={26} opacity={eq} boxWidth={520} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(s.get(scene.src))));
  const chrome = s.get(scene.chromeU);
  const chip = `${PIN} · ${SOURCES[srcIdx]}`;
  const chipW = chip.length * 7.8 + 22;
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {B5(s, scene)}
        {StackLayer(s, scene)}
        {B0(s, scene)}
        {B1(s, scene)}
        {B2(s, scene)}
        {B34(s, scene)}
        {B6(s, scene)}
        {B78(s, scene)}
        {B9(s, scene)}
        {B10(s, scene)}
      </Camera>
      {chrome > 0.005 && (
        <g opacity={chrome}>
          <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontWeight={600}>
            5 · Exact, Trainable, Wide
          </text>
          <rect x={34} y={46} width={chipW} height={24} rx={6} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} />
          <text x={45} y={62} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            {chip}
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
