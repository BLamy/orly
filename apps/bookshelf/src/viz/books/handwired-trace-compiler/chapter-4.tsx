// How Much Is Covered
//
// Trace Compiler — chapter 4. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/trace-compiler/README.md:104 (221 statement units; 64 compiled and verified; 29.0% / 37.0% of 173 numeric)
//   lab/trace-compiler/README.md:106 (49 syntax-based candidates; the historical 113/173 = 65.3%)
//   lab/trace-compiler/README.md:84-94 (the slice table: operations and layers per slice)
//   lab/trace-compiler/README.md:110 (1,580 layers, sequential through 221 photos; a parallel prefix sum changes
//     rounding order; no GPU performance claim)
//   lab/trace-compiler/README.md:100 (not the entire application compiled unchanged; what the 2D slice excludes)
//   lab/trace-compiler/README.md:108, real-slice.ts:24-25 (the two rejection probes, hitTest2DMode and stepSpring)
//   lab/trace-compiler/compile.ts:29-44 (RejectionCategory: 'early return', 'dynamic loop bound')
//   lab/trace-compiler/README.md:112 (next steps; coverage is measured, not inferred from syntax)
//   lab/trace-compiler/residue-census.ts:301 (boundary categories: DOM read, DOM write, browser side effect,
//     debug-only; 221 − 173 = 48 units sit there)
//   lab/status.md:220 (correctness note), :289 (runtime studies (runtime-cost, trace-compiler))
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every count on screen is the README's, re-derived below (the percentages are
// computed from the counts and checked against the README's strings). The wall is grouped by status, not by source
// order (labelled on screen); the 60 numeric units that are neither verified nor candidates are 173 − 64 − 49. The
// prefix tree under the photo chain is schematic (labelled). Changes from the plan, per review.md: the status card
// carries the fixed caption 12's wording and no "held · coverage open" stamp; the recap is a route of five stations
// rather than thumbnails of chapters 1–3.
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const fmtInt = (n: number): string => n.toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The README's counts (README.md:104-106), re-derived
// ---------------------------------------------------------------------------

const N_UNITS = 221;
const N_VERIFIED = 64;
const N_CAND = 49;
const N_NUMERIC = 173;
const N_RESIDUE = N_NUMERIC - N_VERIFIED - N_CAND; // 60 numeric units in other named categories
const N_BOUNDARY = N_UNITS - N_NUMERIC; // 48 boundary I/O units
const pct = (a: number, b: number): string => ((a / b) * 100).toFixed(1);
const PCT_ALL = pct(N_VERIFIED, N_UNITS);
const PCT_NUM = pct(N_VERIFIED, N_NUMERIC);
const PCT_HIST = pct(N_VERIFIED + N_CAND, N_NUMERIC);
if (PCT_ALL !== '29.0' || PCT_NUM !== '37.0' || PCT_HIST !== '65.3' || N_VERIFIED + N_CAND !== 113) {
  throw new Error('trace-compiler ch4: coverage arithmetic disagrees with README.md:104-106');
}

// The slice table (README.md:86-94), in the README's order.
const SLICES: { name: string; ops: number; layers: number }[] = [
  { name: 'clamp', ops: 60, layers: 31 },
  { name: 'column calculation', ops: 524, layers: 91 },
  { name: 'spring step', ops: 14, layers: 8 },
  { name: 'spring snap', ops: 0, layers: 0 },
  { name: '1D hit test', ops: 117, layers: 32 },
  { name: '2D layout, seven column variants', ops: 24894, layers: 600 },
  { name: '1D layout, masked loops', ops: 21213, layers: 1580 },
  { name: 'occlusion bits', ops: 25416, layers: 32 },
  { name: 'scroll compensation', ops: 222, layers: 2 },
];
const MAX_OPS = Math.max(...SLICES.map((r) => r.ops));
const MAX_LAYERS = Math.max(...SLICES.map((r) => r.layers));
const SPOT_COST = [3, 5, 7]; // spring snap, 2D layout, occlusion bits (caption 5)
const SPOT_DEPTH = 6; // 1D layout (caption 6)
const N_PHOTOS = 221;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const WALL = { x: 80, y: 150, cols: 17, pitch: 26, size: 22 }; // 17 × 13 = 221
const tileX = (i: number): number => WALL.x + (i % WALL.cols) * WALL.pitch;
const tileY = (i: number): number => WALL.y + Math.floor(i / WALL.cols) * WALL.pitch;
const WALL_R = WALL.x + WALL.cols * WALL.pitch; // right edge + 4
const WALL_B = WALL.y + 12 * WALL.pitch + WALL.size; // bottom row's bottom edge
const GROUP = (i: number): number => (i < N_VERIFIED ? 0 : i < N_VERIFIED + N_CAND ? 1 : i < N_NUMERIC ? 2 : 3);
// outline of the first 173 tiles: ten full rows, then three tiles of row 10
const NUM_FULL_ROWS = Math.floor(N_NUMERIC / WALL.cols);
const NUM_TAIL = N_NUMERIC - NUM_FULL_ROWS * WALL.cols;
const NUM_PATH = [
  `M ${WALL.x - 4} ${WALL.y - 4}`,
  `H ${WALL_R}`,
  `V ${WALL.y + NUM_FULL_ROWS * WALL.pitch - 2}`,
  `H ${WALL.x + NUM_TAIL * WALL.pitch - 2}`,
  `V ${WALL.y + (NUM_FULL_ROWS + 1) * WALL.pitch}`,
  `H ${WALL.x - 4} Z`,
].join(' ');
const NUM_PERIM = 2 * (WALL_R - WALL.x + 4) + 2 * ((NUM_FULL_ROWS + 1) * WALL.pitch + 4);

const CTR_X = 560; // counters beside the wall

// slice panel
const PANEL = { nameR: 884, barX: 896, barMax: 250, y0: 168, pitch: 40, h: 18 };
const rowY = (i: number): number => PANEL.y0 + i * PANEL.pitch;

// the photo chain (below the stage, the camera pans down to it)
const CHAIN = { x0: 100, x1: 1180, y: 760 };
const chainX = (i: number): number => CHAIN.x0 + (i * (CHAIN.x1 - CHAIN.x0)) / (N_PHOTOS - 1);
type TreeNode = { x: number; kids: number[] };
const TREE: TreeNode[][] = (() => {
  const levels: TreeNode[][] = [Array.from({ length: N_PHOTOS }, (_, i) => ({ x: chainX(i), kids: [] }))];
  while (levels[levels.length - 1].length > 1) {
    const prev = levels[levels.length - 1];
    const next: TreeNode[] = [];
    for (let j = 0; j < prev.length; j += 2) {
      next.push(j + 1 < prev.length ? { x: (prev[j].x + prev[j + 1].x) / 2, kids: [j, j + 1] } : { x: prev[j].x, kids: [j] });
    }
    levels.push(next);
  }
  return levels;
})();
const TREE_DEPTH = TREE.length - 1;
const TREE_Y0 = CHAIN.y + 30;
const TREE_DY = 25;
const treeY = (l: number): number => (l === 0 ? CHAIN.y : TREE_Y0 + l * TREE_DY);

// doors
const DOORS = [
  { x: 660, name: 'hitTest2DMode', lines: ['returns early from', 'a search loop'], cat: 'early return' },
  { x: 960, name: 'stepSpring', lines: ['runtime iteration', 'count, unbounded'], cat: 'dynamic loop bound' },
];
const DOOR = { y: 150, w: 200, h: 220 };
const UNSUPPORTED = ['dynamic array access', 'runtime allocation', 'string encoding', 'nonfinite sentinels', 'browser I/O'];

const ROUTE = ['source', 'syntax walk', 'wires', 'exact comparison', 'five checks'];
const ROUTE_CH = ['ch 1', 'ch 1', 'ch 1', 'ch 2', 'ch 3'];
const ROUTE_Y0 = 150;
const ROUTE_DY = 62;

const CAM_START: CameraState = { x: 640, y: 360, k: 1 };
const CAM_WALL: CameraState = { x: 520, y: 320, k: 1.2 };
const CAM_RIGHT: CameraState = { x: 910, y: 322, k: 1.15 };
const CAM_CHAIN: CameraState = { x: 640, y: 830, k: 1 };

// narration pace: ~150 words per minute, digits read as extra words
const HOLD = 0.9;
const speak = (text: string): number => {
  const words = text.split(/\s+/).length;
  const digits = (text.match(/\d[\d,.]*/g) ?? []).reduce((n, s) => n + Math.max(0, s.replace(/[,.]/g, '').length - 1), 0);
  return +((words + digits) / 2.5 + 0.5).toFixed(1);
};

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);

  // the wall
  const wallU = tl.channel('wallU', 0); // 0..221 tiles in
  const wallOp = tl.channel('wallOp', 1);
  const gV = tl.channel('gV', 1); // per-group opacity: verified · candidates · residue · boundary
  const gC = tl.channel('gC', 1);
  const gR = tl.channel('gR', 1);
  const gB = tl.channel('gB', 1);
  const titleU = tl.channel('titleU', 0);
  const litU = tl.channel('litU', 0); // 0..64
  const numU = tl.channel('numU', 0);
  const bndU = tl.channel('bndU', 0);
  const candU = tl.channel('candU', 0); // 0..49
  const histU = tl.channel('histU', 0);
  const addU = tl.channel('addU', 0);
  const strikeU = tl.channel('strikeU', 0);
  const ctrOp = tl.channel('ctrOp', 1);
  const askU = tl.channel('askU', 0); // the "?" on candidates (caption 11)
  // slices
  const barsU = tl.channel('barsU', 0); // 0..9 rows
  const barsOp = tl.channel('barsOp', 1);
  const layerU = tl.channel('layerU', 0); // ops → layers morph
  const spotA = tl.channel('spotA', 0);
  const spotB = tl.channel('spotB', 0);
  // chain + tree
  const chainU = tl.channel('chainU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const chainOp = tl.channel('chainOp', 1);
  const treeU = tl.channel('treeU', 0);
  const orderU = tl.channel('orderU', 0);
  const stampU = tl.channel('stampU', 0);
  // doors
  const doorsU = tl.channel('doorsU', 0);
  const lockU = tl.channel('lockU', 0);
  const listU = tl.channel('listU', 0); // 0..5
  const doorsOp = tl.channel('doorsOp', 1);
  // cards
  const ban1 = tl.channel('ban1', 0);
  const ban2 = tl.channel('ban2', 0);
  const banOp = tl.channel('banOp', 1);
  const nextU = tl.channel('nextU', 0);
  const noteU = tl.channel('noteU', 0);
  const nextOp = tl.channel('nextOp', 1);
  const statusU = tl.channel('statusU', 0);
  const statusRows = tl.channel('statusRows', 0); // 0..4
  const statusOp = tl.channel('statusOp', 1);
  const routeU = tl.channel('routeU', 0); // 0..5 stations
  const countU = tl.channel('countU', 0);

  let t = 0.4;
  const say = (text: string): { a: number; end: number } => {
    const a = t;
    const dur = speak(text);
    tl.caption({ at: a, dur, text });
    t = tl.hold(a + dur, HOLD);
    return { a, end: a + dur };
  };
  const out = (ch: Parameters<typeof tl.tween>[0], at: number, dur = 0.6) => tl.tween(ch, 0, { at, dur, ease: ease.move });

  // — B1 · 221 statement units —
  let { a } = say("How much of the gallery's code gets through? The frozen render path has 221 statement units, and each one is either compiled and checked, or it isn't.");
  tl.tween(titleU, 1, { at: a + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(wallU, N_UNITS, { at: a + 0.5, dur: 3.2, ease: ease.linear });
  tl.tween(cam, CAM_WALL, { at: a + 1.2, dur: 1.5, ease: ease.move });

  // — B2 · 64 verified —
  ({ a } = say("The slices actually compile and verify 64 of them. That's 29.0 percent of all units, or 37.0 percent of the 173 that are classified as numeric."));
  tl.tween(litU, N_VERIFIED, { at: a + 0.3, dur: 2.4, ease: ease.linear });
  tl.tween(numU, 1, { at: a + 3.6, dur: 1.4, ease: ease.draw });
  tl.tween(bndU, 1, { at: a + 5.4, dur: 0.8, ease: ease.enter });

  // — B3 · 49 candidates —
  ({ a } = say("A syntax-based classifier finds 49 more numeric candidates. They look compilable, but they haven't been compiled and verified, so they don't count."));
  tl.tween(candU, N_CAND, { at: a + 0.3, dur: 2.0, ease: ease.linear });

  // — B4 · the historical 113/173 —
  ({ a } = say('An earlier figure, 113 of 173, or 65.3 percent, added those candidates in. The lab now calls it historical, since a candidate is not compiled code.'));
  tl.tween(addU, 1, { at: a + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(histU, 1, { at: a + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: a + 4.2, dur: 0.7, ease: ease.draw });
  out(addU, a + 4.8, 0.9);

  // — B5 · cost: operations —
  ({ a } = say('Cost varies enormously. The spring snap needs zero operations, while the occlusion pass takes 25,416 and the two-dimensional layout 24,894.'));
  out(ctrOp, a);
  tl.tween(wallOp, 0.12, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_RIGHT, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(barsU, SLICES.length, { at: a + 0.5, dur: 1.4, ease: ease.linear });
  tl.tween(spotA, 1, { at: a + 2.6, dur: 0.6, ease: ease.move });

  // — B6 · depth: layers, then the chain of 221 photos —
  ({ a } = say('Depth is a different story. The one-dimensional layout takes 1,580 layers, because positions accumulate one photo after another through all 221.'));
  out(spotA, a, 0.5);
  tl.tween(layerU, 1, { at: a + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(spotB, 1, { at: a + 1.9, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_CHAIN, { at: a + 4.0, dur: 1.5, ease: ease.move });
  out(barsOp, a + 4.0, 0.8);
  tl.tween(chainU, 1, { at: a + 4.6, dur: 0.8, ease: ease.enter });
  tl.tween(sweepU, 1, { at: a + 5.4, dur: 4.0, ease: ease.linear });

  // — B7 · a prefix tree would change the rounding order —
  ({ a } = say('A parallel prefix sum would shorten that chain, but it would change the rounding order, so under this exactness rule it is not a free swap.'));
  tl.tween(treeU, 1, { at: a + 0.3, dur: 1.6, ease: ease.draw });
  tl.tween(orderU, 1, { at: a + 2.3, dur: 0.6, ease: ease.enter });
  tl.tween(stampU, 1, { at: a + 3.8, dur: 0.5, ease: ease.pop });

  // — B8 · the two rejection probes —
  ({ a } = say('Two rejection probes remain on purpose: hit testing that returns early from a search, and spring stepping with no bound on its loop.'));
  out(chainOp, a, 0.7);
  tl.tween(cam, CAM_RIGHT, { at: a, dur: 1.5, ease: ease.move });
  tl.tween(doorsU, 1, { at: a + 1.2, dur: 0.8, ease: ease.enter });

  // — B9 · named categories; the rest of the unsupported list —
  ({ a } = say('The compiler rejects them under a named category instead of guessing. Also unsupported: dynamic array access, runtime allocation, string encoding, nonfinite sentinels and browser input and output.'));
  tl.tween(lockU, 1, { at: a + 0.6, dur: 0.6, ease: ease.pop });
  tl.tween(listU, UNSUPPORTED.length, { at: a + 3.6, dur: 3.4, ease: ease.linear });

  // — B10 · scope: not the whole app, no GPU claim —
  ({ a } = say('This is not the entire application compiled unchanged, and neither measurement says anything about graphics-chip speed.'));
  out(doorsOp, a, 0.6);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(ban1, 1, { at: a + 0.7, dur: 0.6, ease: ease.enter });
  tl.tween(ban2, 1, { at: a + 3.4, dur: 0.6, ease: ease.enter });

  // — B11 · next steps; measure coverage —
  ({ a } = say("The lab's next steps are bounded first-match selection and explicit gather declarations, with coverage treated as something to measure, not to infer from syntax."));
  out(banOp, a, 0.6);
  tl.tween(nextU, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  for (const g of [gV, gR, gB]) tl.tween(g, 0.15, { at: a + 3.4, dur: 0.1 });
  tl.tween(wallOp, 1, { at: a + 3.5, dur: 0.8, ease: ease.move });
  tl.tween(noteU, 1, { at: a + 3.9, dur: 0.6, ease: ease.enter });
  tl.tween(askU, 1, { at: a + 4.4, dur: 0.6, ease: ease.pop });

  // — B12 · standing: the status page —
  ({ a } = say('As for standing, the status page lists the trace compiler under runtime studies, with no verdict row. Its correctness note says the interpreter is checked against native JavaScript. Coverage is not on that page.'));
  out(nextOp, a, 0.6);
  out(askU, a, 0.6);
  tl.tween(gC, 0.15, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(statusU, 1, { at: a + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(statusRows, 1, { at: a + 1.3, dur: 0.5, ease: ease.enter });
  tl.tween(statusRows, 2, { at: a + 4.2, dur: 0.5, ease: ease.enter });
  tl.tween(statusRows, 3, { at: a + 7.8, dur: 0.5, ease: ease.enter });
  tl.tween(statusRows, 4, { at: a + 11.0, dur: 0.5, ease: ease.enter });

  // — B13 · recap: the route, and 64 of 221 —
  let end: number;
  ({ a, end } = say('So the route runs from source to a syntax walk, to wires, to an exact comparison, to five checks. Sixty-four of 221 units went all the way through.'));
  out(statusOp, a, 0.7);
  tl.tween(routeU, ROUTE.length, { at: a + 0.6, dur: 5.0, ease: ease.linear });
  tl.tween(gV, 1, { at: a + 6.4, dur: 0.8, ease: ease.move });
  tl.tween(countU, 1, { at: a + 6.6, dur: 0.7, ease: ease.pop });
  tl.hold(end, 2.6);

  return {
    tl, cam,
    wallU, wallOp, gV, gC, gR, gB, titleU, litU, numU, bndU, candU, histU, addU, strikeU, ctrOp, askU,
    barsU, barsOp, layerU, spotA, spotB,
    chainU, sweepU, chainOp, treeU, orderU, stampU,
    doorsU, lockU, listU, doorsOp,
    ban1, ban2, banOp, nextU, noteU, nextOp, statusU, statusRows, statusOp, routeU, countU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : fs === 13 ? CH13 : fs * 0.602) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Padlock({ x, y, s = 1, open = 0, color }: { x: number; y: number; s?: number; open?: number; color: string }) {
  const lift = 6 * open * s;
  return (
    <g>
      <path d={`M ${x - 9 * s} ${y - 2 * s - lift} V ${y - 10 * s - lift} A ${9 * s} ${9 * s} 0 0 1 ${x + 9 * s} ${y - 10 * s - lift} V ${y - 2 * s}`}
        fill="none" stroke={color} strokeWidth={3 * s} strokeLinecap="round" />
      <rect x={x - 14 * s} y={y - 2 * s} width={28 * s} height={22 * s} rx={4 * s} fill={color} />
      <circle cx={x} cy={y + 7 * s} r={3 * s} fill={colors.BG} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wallU = s.get(scene.wallU);
  const wallOp = s.get(scene.wallOp);
  const gOp = [s.get(scene.gV), s.get(scene.gC), s.get(scene.gR), s.get(scene.gB)];
  const titleU = s.get(scene.titleU);
  const litU = s.get(scene.litU);
  const numU = s.get(scene.numU);
  const bndU = s.get(scene.bndU);
  const candU = s.get(scene.candU);
  const histU = s.get(scene.histU);
  const addU = s.get(scene.addU);
  const strikeU = s.get(scene.strikeU);
  const ctrOp = s.get(scene.ctrOp);
  const askU = s.get(scene.askU);
  const barsU = s.get(scene.barsU);
  const barsOp = s.get(scene.barsOp);
  const layerU = s.get(scene.layerU);
  const spotA = s.get(scene.spotA);
  const spotB = s.get(scene.spotB);
  const chainU = s.get(scene.chainU) * s.get(scene.chainOp);
  const sweepU = s.get(scene.sweepU);
  const treeU = s.get(scene.treeU);
  const orderU = s.get(scene.orderU);
  const stampU = s.get(scene.stampU);
  const doorsU = s.get(scene.doorsU) * s.get(scene.doorsOp);
  const lockU = s.get(scene.lockU);
  const listU = s.get(scene.listU);
  const banOp = s.get(scene.banOp);
  const ban1 = s.get(scene.ban1) * banOp;
  const ban2 = s.get(scene.ban2) * banOp;
  const nextOp = s.get(scene.nextOp);
  const nextU = s.get(scene.nextU) * nextOp;
  const noteU = s.get(scene.noteU) * nextOp;
  const statusU = s.get(scene.statusU) * s.get(scene.statusOp);
  const statusRows = s.get(scene.statusRows);
  const routeU = s.get(scene.routeU);
  const countU = s.get(scene.countU);

  const nLit = Math.round(litU);
  const nCand = Math.round(candU);
  const histFade = 1 - 0.55 * strikeU; // the struck figure greys out

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the coverage wall ======================== */}
        <g opacity={wallOp}>
          {titleU > 0.01 && (
            <g opacity={titleU * ctrOp}>
              <text x={WALL.x} y={WALL.y - 24} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
                221 statement units · frozen render path
              </text>
            </g>
          )}
          {Array.from({ length: N_UNITS }, (_, i) => {
            const enter = clamp01(wallU - i);
            if (enter <= 0.01) return null;
            const g = GROUP(i);
            const x = tileX(i);
            const y = tileY(i);
            const sz = WALL.size;
            const lit = g === 0 ? clamp01(litU - i) : 0;
            const hatch = g === 1 ? clamp01(candU - (i - N_VERIFIED)) : 0;
            const bnd = g === 3 ? bndU : 0;
            return (
              <g key={i} opacity={enter * gOp[g]}>
                <rect x={x} y={y} width={sz} height={sz} rx={3} fill={bnd > 0 ? 'none' : colors.PANEL}
                  stroke={colors.GRID} strokeWidth={1} strokeDasharray={bnd > 0.5 ? '3 3' : undefined} opacity={1 - 0.35 * bnd} />
                {lit > 0.01 && <rect x={x} y={y} width={sz} height={sz} rx={3} fill={colors.TEAL} opacity={lit} />}
                {hatch > 0.01 && (
                  <g stroke={colors.WARM} strokeWidth={1.6} opacity={hatch}>
                    <rect x={x + 0.5} y={y + 0.5} width={sz - 1} height={sz - 1} rx={3} fill="none" />
                    <line x1={x + 2} y1={y + sz / 2} x2={x + sz / 2} y2={y + 2} />
                    <line x1={x + 2} y1={y + sz - 2} x2={x + sz - 2} y2={y + 2} />
                    <line x1={x + sz / 2} y1={y + sz - 2} x2={x + sz - 2} y2={y + sz / 2} />
                  </g>
                )}
                {g === 1 && addU > 0.01 && <rect x={x} y={y} width={sz} height={sz} rx={3} fill={colors.TEAL} opacity={0.55 * addU} />}
                {g === 1 && askU > 0.01 && (
                  <text x={x + sz / 2} y={y + sz / 2 + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700} fontFamily={UI} opacity={askU}>
                    ?
                  </text>
                )}
              </g>
            );
          })}
          {/* the 173 numeric units */}
          {numU > 0.01 && (
            <path d={NUM_PATH} fill="none" stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray={`${NUM_PERIM * numU} ${NUM_PERIM}`}
              opacity={ctrOp * Math.max(0.15, gOp[0])} />
          )}
          {bndU > 0.01 && (
            <g opacity={bndU * ctrOp}>
              <text x={WALL.x} y={WALL_B + 24} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                {`dashed: ${N_BOUNDARY} boundary units (DOM reads and writes, browser effects, debug), not numeric`}
              </text>
              <text x={WALL.x} y={WALL_B + 44} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                tiles grouped by status, not in source order
              </text>
            </g>
          )}

          {/* counters */}
          <g opacity={ctrOp}>
            {litU > 0.01 && (
              <g>
                <text x={CTR_X} y={WALL.y + 30} fill={colors.TEAL} fontSize={28} fontFamily={UI} fontWeight={600}>
                  {`${nLit} verified · ${pct(nLit, N_UNITS)}%`}
                </text>
                <text x={CTR_X} y={WALL.y + 54} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  compiled and checked in a slice
                </text>
              </g>
            )}
            {numU > 0.01 && (
              <text x={CTR_X} y={WALL.y + 90} fill={colors.SECONDARY} fontSize={18} fontFamily={UI} opacity={clamp01(numU * 2 - 0.6)}>
                {`${PCT_NUM}% of ${N_NUMERIC} numeric`}
              </text>
            )}
            {candU > 0.01 && (
              <g opacity={clamp01(candU / 4)}>
                <text x={CTR_X} y={WALL.y + 150} fill={colors.WARM} fontSize={18} fontFamily={UI}>
                  {`${nCand} classified, not compiled`}
                </text>
                <text x={CTR_X} y={WALL.y + 172} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  syntax-based candidates · they don't count
                </text>
              </g>
            )}
            {histU > 0.01 && (
              <g opacity={histU}>
                <text x={CTR_X} y={WALL.y + 232} fill={colors.TEXT} fontSize={18} fontFamily={MONO} opacity={histFade}>
                  {`${N_VERIFIED + N_CAND}/${N_NUMERIC} = ${PCT_HIST}%`}
                </text>
                {strikeU > 0.01 && (
                  <line x1={CTR_X - 4} y1={WALL.y + 226} x2={CTR_X - 4 + 196 * strikeU} y2={WALL.y + 226} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                )}
                <text x={CTR_X + 206} y={WALL.y + 232} fill={colors.NEGATIVE} fontSize={15} fontFamily={UI} opacity={strikeU}>
                  (historical)
                </text>
                <text x={CTR_X} y={WALL.y + 254} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={strikeU}>
                  a candidate is not compiled code
                </text>
              </g>
            )}
          </g>
        </g>

        {/* ======================== slice cost and depth ======================== */}
        {barsU > 0.01 && barsOp > 0.01 && (
          <g opacity={barsOp}>
            <text x={PANEL.barX} y={PANEL.y0 - 30} fill={colors.MUTED} fontSize={15} fontFamily={UI} opacity={1 - layerU}>
              operations per slice
            </text>
            <text x={PANEL.barX} y={PANEL.y0 - 30} fill={colors.MUTED} fontSize={15} fontFamily={UI} opacity={layerU}>
              layers per slice
            </text>
            {SLICES.map((r, i) => {
              const enter = clamp01(barsU - i);
              if (enter <= 0.01) return null;
              const focusA = SPOT_COST.includes(i) ? 1 : 0.15;
              const focusB = i === SPOT_DEPTH ? 1 : 0.15;
              const focus = lerp(lerp(1, focusA, spotA), focusB, spotB);
              const spot = (SPOT_COST.includes(i) ? spotA : 0) + (i === SPOT_DEPTH ? spotB : 0);
              const wOps = (r.ops / MAX_OPS) * PANEL.barMax;
              const wLay = (r.layers / MAX_LAYERS) * PANEL.barMax;
              const w = lerp(wOps, wLay, layerU) * enter;
              const y = rowY(i);
              const valText = (v: number) => fmtInt(v);
              return (
                <g key={r.name} opacity={enter * focus}>
                  <text x={PANEL.nameR} y={y + 14} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                    {r.name}
                  </text>
                  {w > 0.3 ? (
                    <rect x={PANEL.barX} y={y} width={w} height={PANEL.h} rx={3} fill={spot > 0.5 ? colors.WARM : colors.TEAL} opacity={0.85} />
                  ) : (
                    <line x1={PANEL.barX} y1={y - 2} x2={PANEL.barX} y2={y + PANEL.h + 2} stroke={colors.MUTED} strokeWidth={1.5} />
                  )}
                  <text x={PANEL.barX + w + 8} y={y + 14} fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={1 - clamp01(layerU * 2)}>
                    {valText(r.ops)}
                  </text>
                  <text x={PANEL.barX + w + 8} y={y + 14} fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={clamp01(layerU * 2 - 1)}>
                    {valText(r.layers)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== the photo chain (and a schematic prefix tree) ======================== */}
        {chainU > 0.01 && (
          <g opacity={chainU}>
            <Chip x={CHAIN.x0} y={CHAIN.y - 78} text="1D layout, masked loops · 1,580 layers" color={colors.WARM} fs={15} />
            <text x={CHAIN.x0} y={CHAIN.y - 22} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              photo 1
            </text>
            <text x={CHAIN.x1} y={CHAIN.y - 22} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              {`photo ${N_PHOTOS}`}
            </text>
            <text x={(CHAIN.x0 + CHAIN.x1) / 2} y={CHAIN.y - 22} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              each position waits for the one before it
            </text>
            <line x1={CHAIN.x0} y1={CHAIN.y} x2={lerp(CHAIN.x0, CHAIN.x1, sweepU)} y2={CHAIN.y} stroke={colors.TEAL} strokeWidth={2} />
            <line x1={lerp(CHAIN.x0, CHAIN.x1, sweepU)} y1={CHAIN.y} x2={CHAIN.x1} y2={CHAIN.y} stroke={colors.GRID} strokeWidth={1.2} />
            {Array.from({ length: N_PHOTOS }, (_, i) => {
              const done = sweepU * (N_PHOTOS - 1) >= i;
              return <circle key={i} cx={chainX(i)} cy={CHAIN.y} r={2.2} fill={done ? colors.TEAL : colors.MUTED} opacity={done ? 1 : 0.5} />;
            })}
            {sweepU > 0.001 && sweepU < 0.999 && (
              <circle cx={lerp(CHAIN.x0, CHAIN.x1, sweepU)} cy={CHAIN.y} r={6} fill={colors.WARM} />
            )}

            {treeU > 0.01 && (
              <g opacity={0.75}>
                {TREE.slice(1).map((level, li) => {
                  const l = li + 1;
                  const u = clamp01(treeU * TREE_DEPTH - li);
                  if (u <= 0.01) return null;
                  return (
                    <g key={l} opacity={u}>
                      {level.map((n, j) => (
                        <g key={j}>
                          {n.kids.map((k) => (
                            <line key={k} x1={TREE[l - 1][k].x} y1={treeY(l - 1)} x2={n.x} y2={treeY(l)} stroke={colors.SECONDARY} strokeWidth={1} />
                          ))}
                          <circle cx={n.x} cy={treeY(l)} r={l === TREE_DEPTH ? 4 : 2} fill={colors.SECONDARY} />
                        </g>
                      ))}
                    </g>
                  );
                })}
                <text x={CHAIN.x0} y={treeY(TREE_DEPTH) + 4} fill={colors.SECONDARY} fontSize={14} fontFamily={UI} opacity={clamp01(treeU * 2 - 1)}>
                  parallel prefix tree (schematic)
                </text>
              </g>
            )}
            {orderU > 0.01 && (
              <g opacity={orderU}>
                <text x={CHAIN.x1} y={CHAIN.y - 84} textAnchor="end" fill={colors.TEAL} fontSize={15} fontFamily={MONO}>
                  {'chain   ((a + b) + c) + d'}
                </text>
                <text x={CHAIN.x1} y={CHAIN.y - 60} textAnchor="end" fill={colors.SECONDARY} fontSize={15} fontFamily={MONO}>
                  {'tree    (a + b) + (c + d)'}
                </text>
              </g>
            )}
            <Chip x={CHAIN.x1} y={treeY(TREE_DEPTH) + 6} anchor="end" text="changes rounding order · not a free swap" color={colors.NEGATIVE} fs={15} opacity={stampU} />
          </g>
        )}

        {/* ======================== the two rejection probes ======================== */}
        {doorsU > 0.01 && (
          <g opacity={doorsU}>
            <text x={DOORS[0].x} y={DOOR.y - 22} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
              rejection probes, kept on purpose
            </text>
            {DOORS.map((d) => {
              const { y, w, h } = DOOR;
              const cx = d.x + w / 2;
              return (
                <g key={d.name}>
                  <path d={`M ${d.x} ${y + h} V ${y + 40} A ${w / 2} 40 0 0 1 ${d.x + w} ${y + 40} V ${y + h} Z`}
                    fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                  <text x={cx} y={y + 56} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
                    {d.name}
                  </text>
                  <Padlock x={cx} y={y + 104} s={1.2} color={lockU > 0.5 ? colors.NEGATIVE : colors.MUTED} />
                  {d.lines.map((ln, k) => (
                    <text key={k} x={cx} y={y + 166 + k * 20} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                      {ln}
                    </text>
                  ))}
                  <Chip x={cx} y={y + h + 34} anchor="middle" mono fs={14} text={`[${d.cat}]`} color={colors.NEGATIVE} opacity={lockU} />
                </g>
              );
            })}
            {listU > 0.01 && (
              <g>
                <text x={DOORS[0].x} y={DOOR.y + DOOR.h + 82} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                  also unsupported
                </text>
                {UNSUPPORTED.map((item, k) => {
                  const col = k < 3 ? k : k - 3;
                  const row = k < 3 ? 0 : 1;
                  const x = DOORS[0].x + [0, 186, 352][col];
                  return (
                    <Chip key={item} x={x} y={DOOR.y + DOOR.h + 116 + row * 34} text={item} color={colors.TEXT} fs={14}
                      opacity={clamp01((listU - k) * 2)} />
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ======================== scope banners ======================== */}
        {ban1 > 0.01 && (
          <g opacity={ban1}>
            <rect x={620} y={180} width={600} height={84} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={644} y={214} fill={colors.WARM} fontSize={20} fontFamily={UI}>
              not the entire app compiled unchanged
            </text>
            <text x={644} y={242} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              the 2D slice leaves out hover search, dismissed-scroll adjustment, anchor search
            </text>
          </g>
        )}
        {ban2 > 0.01 && (
          <g opacity={ban2}>
            <rect x={620} y={290} width={600} height={84} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={644} y={324} fill={colors.WARM} fontSize={20} fontFamily={UI}>
              no GPU performance claim
            </text>
            <text x={644} y={352} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              compiled execution here is JavaScript; neither measurement establishes GPU speed
            </text>
          </g>
        )}

        {/* ======================== next steps ======================== */}
        {nextU > 0.01 && (
          <g opacity={nextU}>
            <rect x={620} y={150} width={600} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={644} y={182} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
              next
            </text>
            <text x={644} y={222} fill={colors.TEXT} fontSize={20} fontFamily={UI}>
              → bounded first-match selection
            </text>
            <text x={644} y={262} fill={colors.TEXT} fontSize={20} fontFamily={UI}>
              → explicit gather declarations
            </text>
          </g>
        )}
        {noteU > 0.01 && (
          <g opacity={noteU}>
            <rect x={620} y={330} width={600} height={70} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={644} y={362} fill={colors.WARM} fontSize={18} fontFamily={UI}>
              coverage: measure it, don't infer it from syntax
            </text>
            <text x={644} y={385} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              the 49 candidates count only once compiled and verified
            </text>
            <path d={`M 620 365 C 580 365, 560 ${tileY(90) + 11}, ${WALL_R + 6} ${tileY(90) + 11}`} fill="none" stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="4 3" />
          </g>
        )}

        {/* ======================== the status page ======================== */}
        {statusU > 0.01 && (
          <g opacity={statusU}>
            <rect x={600} y={130} width={630} height={350} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <rect x={600} y={130} width={630} height={34} rx={10} fill={colors.GRID} opacity={0.6} />
            <text x={620} y={153} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              lab/status.md
            </text>
            <g opacity={clamp01(statusRows)}>
              <text x={620} y={196} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>:289</text>
              <text x={664} y={196} fill={colors.TEXT} fontSize={14} fontFamily={UI}>runtime studies (runtime-cost, trace-compiler),</text>
              <text x={664} y={216} fill={colors.TEXT} fontSize={14} fontFamily={UI}>each with a README</text>
            </g>
            <g opacity={clamp01(statusRows - 1)}>
              <rect x={620} y={238} width={590} height={44} rx={6} fill="none" stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="5 4" />
              <text x={640} y={265} fill={colors.MUTED} fontSize={14} fontFamily={UI}>status table: no trace-compiler verdict row</text>
            </g>
            <g opacity={clamp01(statusRows - 2)}>
              <text x={620} y={320} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>:220</text>
              <text x={664} y={320} fill={colors.TEXT} fontSize={14} fontFamily={UI}>Its source interpreter is independently checked</text>
              <text x={664} y={340} fill={colors.TEXT} fontSize={14} fontFamily={UI}>against native JavaScript</text>
            </g>
            <g opacity={clamp01(statusRows - 3)}>
              <rect x={620} y={372} width={590} height={44} rx={6} fill="none" stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="5 4" />
              <text x={640} y={399} fill={colors.MUTED} fontSize={14} fontFamily={UI}>{`coverage (${N_VERIFIED} of ${N_UNITS} units): not on this page`}</text>
            </g>
          </g>
        )}

        {/* ======================== recap: the route ======================== */}
        {routeU > 0.01 && (
          <g>
            {ROUTE.map((name, k) => {
              const u = clamp01((routeU - k) * 1.6);
              if (u <= 0.01) return null;
              const y = ROUTE_Y0 + k * ROUTE_DY;
              return (
                <g key={name} opacity={u}>
                  {k > 0 && (
                    <line x1={780} y1={y - ROUTE_DY + 14} x2={780} y2={y - 26} stroke={colors.MUTED} strokeWidth={1.5} />
                  )}
                  {k > 0 && <path d={`M 774 ${y - 32} L 780 ${y - 24} L 786 ${y - 32}`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />}
                  <Chip x={780} y={y} anchor="middle" text={name} color={k === ROUTE.length - 1 ? colors.TEAL : colors.TEXT} fs={16} />
                  <text x={900} y={y - 1} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                    {ROUTE_CH[k]}
                  </text>
                </g>
              );
            })}
            {countU > 0.01 && (
              <g opacity={countU}>
                <text x={780} y={ROUTE_Y0 + ROUTE.length * ROUTE_DY + 40} textAnchor="middle" fill={colors.TEAL} fontSize={44} fontFamily={UI} fontWeight={600}>
                  {`${N_VERIFIED} / ${N_UNITS}`}
                </text>
                <text x={780} y={ROUTE_Y0 + ROUTE.length * ROUTE_DY + 70} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={UI}>
                  units went all the way through
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        4 · How Much Is Covered
      </text>
      <text x={40} y={58} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
        lab/trace-compiler · frozen fixture f315d58
      </text>
    </>
  );
}

export const vizScene = () => scene;

if (N_RESIDUE !== 60 || N_BOUNDARY !== 48) throw new Error('trace-compiler ch4: unit groups do not sum to 221');
