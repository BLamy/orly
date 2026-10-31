// Refocus the Microscope
//
// Already Clean — chapter 1. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`;
// actual: `claude-opus-5-5`, per the session's process line (`npm exec @anthropic-ai/claude-code@latest --print
// --model claude-opus-5-5`) and the model id in its system context. Planned by Claude Sonnet 5.5 in
// .orly-work/visual-plan-sonnet.md (chapter 1); research and source checks by Claude Haiku 5.5. The thirteen
// captions are the plan's fixed narration, copied verbatim; claim IDs appear only in comments.
//
// Sources (ledger IDs from .orly-work/research/neurons-claim-ledger.md):
//   T1, T2, T3, T4   https://already-clean.goodfire.com/essay.md  (thesis, candidate causes, local vs non-local
//                    grouping, the author's ~85% confidence)
//   L1, L2, L3, L4   https://already-clean.goodfire.com/essay.md  (readable-neuron ladder, InceptionV1 last layer)
//   L6               https://already-clean.goodfire.com/essay.md, https://distill.pub/2017/feature-visualization/
//                    (feature-visualization repair; the Distill paper is context only and supplies no ladder value)
//   figure details   https://already-clean.goodfire.com/
//
// Schematic versus measured:
//   - The twelve case chips, the four slots and their three arrangements (C1–C5) are a conceptual illustration:
//     shapes stand for cases, slots for neurons. Positions are not an embedding and not data.
//   - The tile plates (C6–C11) are percentage plates: one tile stands for 1% of last-layer neurons, never for a
//     sampled neuron. Each trained network gets its own tile identities; only the first jump keeps the plate.
//   - The before/after render in the loupe (C7) is drawn by us, not a reproduction of a real visualization.
//   - Measured or reported values on stage are only the author's approximate ladder (~0–5%, ~50%, ~70%, ~99%)
//     and, separately at C12, his ~85% confidence in an argument. That dial never shares the stage with the ladder.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
type V2 = [number, number];
const lerp2 = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const ID = 'nnac-ch1';

const CYAN = '#38bdf8'; // the microscope (tools)
const VIOLET = colors.SECONDARY; // network changes · the confidence dial
const AMBER = colors.WARM; // the highlighted neuron
const RED = colors.NEGATIVE; // unrelated packing
const LENS = '#e2e8f0';
const EDGE = '#334155';
/** one colour per trained network: 2014 InceptionV1, retrained InceptionV1, ConvNeXt */
const NET = ['#38bdf8', '#34d399', '#f472b6'];

// ---------------------------------------------------------------------------
// Fixed narration (visual-plan-sonnet.md, chapter 1)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  /* T1 */ "Neural Networks Are Already Clean, by Nick Cammarata at Goodfire, asks whether confusing neurons reflect hidden mixtures or mistakes in how we study them.",
  /* T1 */ "When one neuron seems to mix unrelated jobs, he argues that tools, explanations, architecture, or training may be responsible.",
  /* T3 */ "Generalization gathers cases with something in common. Its prediction is local: similar things should stay close in the grouping.",
  /* T3 */ "Superposition, in this argument, packs unrelated things together because they rarely interfere. That predicts a different kind of grouping.",
  /* T2 */ "Cammarata argues that we should test the ordinary explanations before treating unrelated packing as the answer.",
  /* L1 */ "Consider the last layer of Inception version one. With early tools, estimates of its readable neurons ranged from roughly zero to five percent.",
  /* L6 */ "Some visualization failures came from how synthetic images were optimized. Changing the procedure could make the very same neuron easier to recognize.",
  /* L2 */ "Better tools raised the estimate to about fifty percent on the same network from twenty fourteen.",
  /* L3 */ "Retraining that architecture with modern regularization brought it to about seventy percent.",
  /* L4 */ "A Conv Next model with the same parameter count and dataset reached about ninety-nine percent in his assessment.",
  /* L2, L3, L4 */ "Only the first jump changes the microscope alone. The later jumps change training, then architecture.",
  /* T4 */ "His confidence is roughly eighty-five percent that generalization explains nearly everything here. That is confidence in an argument, not a measured share of clean neurons.",
  /* T1, T2 */ "The practical question becomes: which ordinary explanation can we test on this neuron before assuming its meanings were packed together arbitrarily?",
];

/** Spoken-line pace: max(5.4, words × 0.4 + 1.1) s; 0.7 s between captions. */
const DUR = CAPTIONS.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
const GAP = 0.7;
const T: number[] = [];
{
  let t = 0.5;
  for (const d of DUR) {
    T.push(t);
    t += d + GAP;
  }
}
const END = T[12] + DUR[12] + 0.6;

// ---------------------------------------------------------------------------
// Glyphs (unit size; stroke width given in world px)
// ---------------------------------------------------------------------------

type Shape = 'chevron' | 'ring' | 'wave' | 'star' | 'square' | 'spiral';
const TILE_SHAPES: Shape[] = ['chevron', 'ring', 'wave', 'star', 'square', 'spiral'];

const STAR_PTS = Array.from({ length: 10 }, (_, k) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 5;
  const rr = k % 2 === 0 ? 1 : 0.45;
  return `${(Math.cos(a) * rr).toFixed(3)},${(Math.sin(a) * rr).toFixed(3)}`;
}).join(' ');
const SPIRAL_D = (() => {
  const pts: string[] = [];
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 4.2;
    const rr = 0.12 + (k / 48) * 0.88;
    pts.push(`${k === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(3)},${(Math.sin(a) * rr).toFixed(3)}`);
  }
  return pts.join(' ');
})();
const WAVE_D = (() => {
  const pts: string[] = [];
  for (let k = 0; k <= 24; k++) {
    const x = -1 + (2 * k) / 24;
    pts.push(`${k === 0 ? 'M' : 'L'}${x.toFixed(3)},${(Math.sin(x * Math.PI * 1.5) * 0.45).toFixed(3)}`);
  }
  return pts.join(' ');
})();
/** An unreadable render: one seeded scribble, rotated per tile. */
const TANGLE_D = (() => {
  const r = mulberry32(5150);
  const pts: V2[] = Array.from({ length: 9 }, () => {
    const a = r() * Math.PI * 2;
    const d = 0.25 + r() * 0.75;
    return [Math.cos(a) * d, Math.sin(a) * d];
  });
  let d = `M${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
  for (let k = 1; k + 1 < pts.length; k += 2) d += ` Q${pts[k][0].toFixed(3)},${pts[k][1].toFixed(3)} ${pts[k + 1][0].toFixed(3)},${pts[k + 1][1].toFixed(3)}`;
  return d;
})();
/** the old synthetic render inside the loupe: high-frequency speckle */
const SPECKLE: { x: number; y: number; r: number; c: string }[] = (() => {
  const r = mulberry32(808);
  const pal = ['#8da2be', '#f472b6', '#fbbf24', '#60a5fa', '#34d399'];
  return Array.from({ length: 70 }, () => ({ x: (r() * 2 - 1) * 0.95, y: (r() * 2 - 1) * 0.95, r: 0.03 + r() * 0.06, c: pal[Math.floor(r() * pal.length)] }));
})();

function Glyph({ shape, x, y, r, rot = 0, color, width = 2.6, opacity = 1 }: { shape: Shape; x: number; y: number; r: number; rot?: number; color: string; width?: number; opacity?: number }) {
  if (opacity <= 0.005 || r <= 0.2) return null;
  const common = { fill: 'none', stroke: color, strokeWidth: width / r, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let body;
  if (shape === 'chevron') body = <path d="M-0.85,-0.6 L0,0.75 L0.85,-0.6" {...common} />;
  else if (shape === 'star') body = <polygon points={STAR_PTS} {...common} />;
  else if (shape === 'square') body = <rect x={-0.7} y={-0.7} width={1.4} height={1.4} rx={0.12} {...common} />;
  else if (shape === 'ring') body = <circle r={0.8} {...common} />;
  else if (shape === 'spiral') body = <path d={SPIRAL_D} {...common} />;
  else body = <path d={WAVE_D} {...common} />;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${r})`} opacity={opacity}>
      {body}
    </g>
  );
}

function Tangle({ x, y, r, rot, color, width = 1.5, opacity }: { x: number; y: number; r: number; rot: number; color: string; width?: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${r})`} opacity={opacity}>
      <path d={TANGLE_D} fill="none" stroke={color} strokeWidth={width / r} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Phase A — plate A: four slots (neurons), twelve case chips (4 families × 3 variants)
// ---------------------------------------------------------------------------

const FAMS: { shape: Shape; color: string }[] = [
  { shape: 'chevron', color: '#fb923c' },
  { shape: 'ring', color: '#60a5fa' },
  { shape: 'wave', color: '#34d399' },
  { shape: 'star', color: '#e879f9' },
];
const PLATE_A = { x: 330, y: 170, w: 620, h: 370 };
const SLOT_W = 280;
const SLOT_H = 150;
const SLOT_C: V2[] = [
  [490, 265],
  [790, 265],
  [490, 435],
  [790, 435],
];
const OFF_X = [-86, 0, 86];
const CHIP = 60;

// Phase B — plate B: 10 × 10 tiles, tile 32, pitch 38
const N = 10;
const TILE = 32;
const PITCH = 38;
const GX = 130;
const GY = 160;
const tileC = (c: number): V2 => [GX + TILE / 2 + (c % N) * PITCH, GY + TILE / 2 + Math.floor(c / N) * PITCH];
const PLATE_B = { x: 112, y: 142, w: 410, h: 412 };

interface Chip {
  f: number;
  v: number;
  P: V2; // the confusing first look
  G: V2; // generalization: one family per slot
  Q: V2; // unrelated packing: three families per slot
  rotP: number;
  delay: number;
  qSlot: number;
  target: number; // tile it shrinks into at C6
}
const CHIPS: Chip[] = (() => {
  const r = mulberry32(1405);
  const out: Chip[] = [];
  const snap = (p: V2): number => {
    const tx = GX + ((p[0] - PLATE_A.x) / PLATE_A.w) * (N * PITCH);
    const ty = GY + ((p[1] - PLATE_A.y) / PLATE_A.h) * (N * PITCH);
    const col = Math.max(0, Math.min(N - 1, Math.round((tx - GX - TILE / 2) / PITCH)));
    const row = Math.max(0, Math.min(N - 1, Math.round((ty - GY - TILE / 2) / PITCH)));
    return row * N + col;
  };
  for (let f = 0; f < 4; f++)
    for (let v = 0; v < 3; v++) {
      const pSlot = (f + 2 * v + 1) % 4;
      const qSlot = (f + v) % 4;
      const at = (s: number): V2 => [SLOT_C[s][0] + OFF_X[v], SLOT_C[s][1]];
      const P = at(pSlot);
      const Q = at(qSlot);
      out.push({
        f,
        v,
        P: [P[0] + (r() - 0.5) * 34, P[1] + (r() - 0.5) * 46],
        G: at(f),
        Q,
        rotP: (r() - 0.5) * 50,
        delay: r() * 0.25,
        qSlot,
        target: snap(Q),
      });
    }
  return out;
})();
/** the highlighted neuron's tile: where slot 0's middle chip lands */
const RING = CHIPS.find((c) => c.qSlot === 0 && c.v === 1)!.target;
const RC = tileC(RING);
const TARGETS = new Set(CHIPS.map((c) => c.target));

function chipPos(ch: Chip, L: number): V2 {
  if (L <= 1) return lerp2(ch.P, ch.G, ease.move(clamp01((L - ch.delay) / 0.75)));
  return lerp2(ch.G, ch.Q, ease.move(clamp01((L - 1 - ch.delay) / 0.75)));
}

// ---------------------------------------------------------------------------
// Tile identities per trained network (never carried across networks)
// ---------------------------------------------------------------------------

function shuffled(n: number, seed: number): number[] {
  const r = mulberry32(seed);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** RANK[m][c] < estimate ⇔ tile c reads as one thing in network m */
const RANK: number[][] = [77, 3101, 9907].map((seed) => {
  const order = shuffled(N * N, seed);
  const rank = new Array<number>(N * N);
  order.forEach((c, k) => (rank[c] = k));
  return rank;
});
{
  // the ringed neuron: not readable with early tools, readable once the visualization is repaired
  const want = 10;
  const other = RANK[0].indexOf(want);
  [RANK[0][RING], RANK[0][other]] = [want, RANK[0][RING]];
}
const READ_AT = [50, 70, 99];
const FAM: number[][] = [11, 22, 33].map((seed) => {
  const r = mulberry32(seed);
  return Array.from({ length: N * N }, () => Math.floor(r() * TILE_SHAPES.length));
});
FAM[0][RING] = 0; // the repaired render is a crisp V
const ROT: number[][] = [5, 6, 7].map((seed) => {
  const r = mulberry32(seed);
  return Array.from({ length: N * N }, () => Math.round((r() - 0.5) * 50));
});
const ENTRY_D: number[] = Array.from({ length: N * N }, (_, c) => {
  const p = tileC(c);
  return clamp01(Math.hypot(p[0] - RC[0], p[1] - RC[1]) / 380);
});

/** The loupe's raster sweep (C8): boustrophedon over rows; position and passage are closed-form in p. */
function sweepState(p: number) {
  const s = Math.min(99.999, Math.max(0, p) * 100);
  const row = Math.floor(s / 10);
  const colF = s - row * 10;
  const h = clamp01(colF / 9.2);
  const v = clamp01((colF - 9.2) / 0.8);
  const cpos = -0.3 + 9.6 * h;
  return { row, cpos, v };
}
const colX = (q: number): number => GX + TILE / 2 + q * PITCH;
function loupeAt(p: number): V2 {
  const { row, cpos, v } = sweepState(p);
  const x = row % 2 === 0 ? colX(cpos) : colX(9 - cpos);
  const y = GY + TILE / 2 + PITCH * (row + (row < N - 1 ? ease.move(v) : 0));
  return [x, y];
}
function sweepU(c: number, p: number): number {
  if (p <= 0) return 0;
  const { row, cpos } = sweepState(p);
  const r = Math.floor(c / N);
  if (r < row) return 1;
  if (r > row) return 0;
  const q = r % 2 === 0 ? c % N : N - 1 - (c % N);
  return clamp01((cpos - q + 0.6) / 0.6);
}
const SWEEP_START = loupeAt(0);
/** where the loupe rests after the sweep: off the plate's bottom-left rim, covering no tile */
const REST: V2 = [80, 590];
const RIPPLE_D: number[] = (() => {
  const d = Array.from({ length: N * N }, (_, c) => Math.hypot(tileC(c)[0] - REST[0], tileC(c)[1] - REST[1]));
  const mx = Math.max(...d);
  return d.map((x) => x / mx);
})();

// ---------------------------------------------------------------------------
// Staircase (world): base y 585, treads 130 wide, 3 px per percent
// ---------------------------------------------------------------------------

const BASE = 585;
const AXIS_X = 636;
const TREAD_X = [650, 790, 930, 1070];
const TW = 130;
const TREAD_H = [8, 150, 210, 297];
const TREAD_C = [NET[0], NET[0], NET[1], NET[2]];
const TREAD_LBL = ['~0–5%', '~50%', '~70%', '~99%'];
const TOPS = TREAD_H.map((h) => BASE - h);
const JUMPS = [
  { label: 'microscope', color: CYAN },
  { label: 'training', color: VIOLET },
  { label: 'architecture', color: VIOLET },
];
/** C13: the staircase settles into its panel — x' = s·x + tx, y' = s·y + ty */
const FIN = { s: 0.95, tx: 11.9, ty: -21.7 };

// ---------------------------------------------------------------------------
// Suspects (C2, C5, C13)
// ---------------------------------------------------------------------------

type Icon = 'lens' | 'bubble' | 'blocks' | 'loop';
const SUSPECTS: { word: string; icon: Icon; color: string }[] = [
  { word: 'Tools', icon: 'lens', color: CYAN },
  { word: 'Explanations', icon: 'bubble', color: '#e2e8f0' },
  { word: 'Architecture', icon: 'blocks', color: VIOLET },
  { word: 'Training', icon: 'loop', color: VIOLET },
];
const SUS_X = [260, 450, 640, 830, 1020];
const SUS_Y = 130;
const SUS_W = 172;
const SUS_H = 38;

// ---------------------------------------------------------------------------
// Status chip (screen space) — one per phase, replaced, never stacked
// ---------------------------------------------------------------------------

const TILE_NOTE = '1 tile = 1% of last-layer neurons · schematic';
const STATUS: { main: string; sub?: string; color: string }[] = [
  { main: "Cammarata's argument", color: VIOLET },
  { main: "Cammarata's argument", color: VIOLET },
  { main: 'Generalization', sub: 'schematic — not an embedding', color: '#60a5fa' },
  { main: 'Superposition', sub: 'schematic — not an embedding', color: RED },
  { main: 'His proposed test order', sub: 'schematic — not an embedding', color: VIOLET },
  { main: 'Inception V1 · 2014 weights · early tools', sub: TILE_NOTE, color: CYAN },
  { main: 'Visualization repair · same neuron', sub: TILE_NOTE, color: CYAN },
  { main: 'Better tools', sub: TILE_NOTE, color: CYAN },
  { main: 'Modern regularization', sub: TILE_NOTE, color: NET[1] },
  { main: 'New architecture', sub: TILE_NOTE, color: NET[2] },
  { main: 'What each jump changed', sub: TILE_NOTE, color: VIOLET },
  { main: 'A different quantity', sub: 'confidence, not a measurement', color: VIOLET },
  { main: 'The practical question', color: AMBER },
];

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

const CAM_PUSH: CameraState = { x: 640, y: 360, k: 1.12 };
const CAM_ROW: CameraState = { x: 640, y: 362, k: 1.03 };
const CAM_B: CameraState = { x: 656, y: 362, k: 1 };
const CAM_TILE: CameraState = { x: RC[0], y: RC[1] + 4, k: 2.4 };
const CAM_STAIR: CameraState = { x: 905, y: 425, k: 1.12 };
const LOUPE_R = 58;
const LOUPE_SMALL = 21;

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, every beat keyed to T[i]
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const status = tl.channel('statusChip', 0);

  // phase A
  const plateA = tl.channel('plateIn', 0);
  const chipsIn = tl.channel('chipsIn', 0);
  const ringU = tl.channel('neuronRing', 0);
  const attribU = tl.channel('attribution', 0);
  const confusedU = tl.channel('confusingLabel', 0);
  const suspU = tl.channel('suspects', 0); // 0..4 staggered
  const suspDim = tl.channel('suspectsDim', 0);
  const lightU = tl.channel('testOrder', 0); // 0..4 suspects relight in order
  const lastU = tl.channel('packingLast', 0);
  const suspOut = tl.channel('suspectsOut', 0);
  const layout = tl.channel('layout', 0); // 0 first look · 1 generalization · 2 unrelated packing
  const hoodU = tl.channel('neighbourhood', 0);
  const lblG = tl.channel('labelLocal', 0);
  const lblP = tl.channel('labelPacked', 0);
  const lblO = tl.channel('labelOrder', 0);
  const turnOn = tl.channel('turnsOn', 0);
  const turn = tl.channel('turns', 0); // 0..6: packed cases take turns
  const chipsDim = tl.channel('chipsDim', 0);

  // phase B
  const morph = tl.channel('plateMorph', 0);
  const tilesIn = tl.channel('tilesIn', 0);
  const rimA = tl.channel('rimInception', 0);
  const axisU = tl.channel('stairAxis', 0);
  const tread1 = tl.channel('tread1', 0);
  const zoomHide = tl.channel('zoomHide', 0);
  const focus = tl.channel('focusRingTile', 0);
  const loupeU = tl.channel('loupe', 0);
  const lblRepair = tl.channel('labelRepair', 0);
  const seam = tl.channel('repairSeam', 0);
  const shrink = tl.channel('loupeShrink', 0);
  const lockU = tl.channel('lockSameNetwork', 0);
  const sweep = tl.channel('loupeSweep', 0);
  const park = tl.channel('loupePark', 0);
  const out0 = tl.channel('plate0Out', 0);
  const in1 = tl.channel('plate1In', 0);
  const rim1 = tl.channel('rimRetrained', 0);
  const rip1 = tl.channel('resolveRetrained', 0);
  const out1 = tl.channel('plate1Out', 0);
  const in2 = tl.channel('plate2In', 0);
  const skipU = tl.channel('skipArcs', 0);
  const rim2 = tl.channel('rimConvNeXt', 0);
  const rip2 = tl.channel('resolveConvNeXt', 0);
  const plateDim = tl.channel('plateDim', 0);
  const jumps = tl.channel('jumps', 0); // 0..3

  // phase C
  const stairDim = tl.channel('stairDim', 0);
  const dialU = tl.channel('dial', 0);
  const needle = tl.channel('dialNeedle', 0);
  const dialVal = tl.channel('dialValue', 0);
  const dialNote = tl.channel('dialNote', 0);
  const stairFin = tl.channel('stairToPanel', 0);
  const panelR = tl.channel('stairPanel', 0);
  const panelL = tl.channel('suspectPanel', 0);
  const listU = tl.channel('suspectList', 0); // 0..5

  CAPTIONS.forEach((text, i) => {
    // each line holds until the next starts, so the caption never blinks off between lines
    tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text });
    if (i > 0) tl.set(status, i, T[i] - 0.1);
  });

  // — C1 [T1] · the plate, a confusing first look, one ringed neuron; slow push —
  let t = T[0];
  tl.tween(plateA, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(attribU, 1, { at: t + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(chipsIn, 1, { at: t + 0.6, dur: 1.4, ease: ease.linear });
  tl.tween(cam, CAM_PUSH, { at: t + 1.0, dur: 1.5, ease: ease.move });
  tl.tween(ringU, 1, { at: t + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(confusedU, 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.4, 1.0);

  // — C2 [T1] · four ordinary suspects drop in —
  t = T[1];
  tl.tween(attribU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(confusedU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_ROW, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(suspU, 4, { at: t + 0.8, dur: 2.4, ease: ease.linear });
  tl.hold(t + 3.2, 1.0);

  // — C3 [T3] · the same chips regroup by similarity; slot 0's neighbourhood —
  t = T[2];
  tl.tween(suspDim, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.0, ease: ease.move });
  tl.tween(layout, 1, { at: t + 0.5, dur: 1.4, ease: ease.linear });
  tl.tween(hoodU, 1, { at: t + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(lblG, 1, { at: t + 2.6, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.2, 1.0);

  // — C4 [T3] · unrelated packing: three families per slot, taking turns in slot 0 —
  t = T[3];
  tl.tween(hoodU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(lblG, 0, { at: t, dur: 0.4, ease: ease.move });
  tl.tween(layout, 2, { at: t + 0.4, dur: 1.4, ease: ease.linear });
  tl.tween(lblP, 1, { at: t + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(turnOn, 1, { at: t + 2.4, dur: 0.4, ease: ease.move });
  tl.tween(turn, 6, { at: t + 2.6, dur: 4.8, ease: ease.linear });
  tl.tween(turnOn, 0, { at: t + 7.5, dur: 0.4, ease: ease.move });

  // — C5 [T2] · ordinary explanations first, unrelated packing last —
  t = T[4];
  tl.tween(lblP, 0, { at: t, dur: 0.4, ease: ease.move });
  tl.tween(chipsDim, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(lightU, 4, { at: t + 0.6, dur: 2.4, ease: ease.linear });
  tl.tween(lastU, 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(lblO, 1, { at: t + 3.2, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.8, 1.0);

  // — C6 [L1] · plate A becomes the tile plate; early tools: 3 of 100 read; tread 1 —
  t = T[5];
  tl.tween(suspOut, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(lblO, 0, { at: t, dur: 0.4, ease: ease.move });
  tl.tween(chipsDim, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_B, { at: t, dur: 1.0, ease: ease.move });
  tl.tween(morph, 1, { at: t + 0.5, dur: 1.2, ease: ease.move });
  tl.tween(tilesIn, 1, { at: t + 1.3, dur: 1.2, ease: ease.linear });
  tl.tween(rimA, 1, { at: t + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(axisU, 1, { at: t + 2.6, dur: 1.2, ease: ease.draw });
  tl.tween(tread1, 1, { at: t + 4.0, dur: 0.6, ease: ease.enter });
  tl.hold(t + 4.6, 1.0);

  // — C7 [L6] · push into the ringed tile: the same neuron, re-rendered —
  t = T[6];
  tl.tween(zoomHide, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(focus, 1, { at: t + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TILE, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(loupeU, 1, { at: t + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(lblRepair, 1, { at: t + 1.8, dur: 0.6, ease: ease.enter });
  // the seam stops halfway so old and repaired renders share the glass, then finishes the repair
  tl.tween(seam, 0.5, { at: t + 2.4, dur: 1.2, ease: ease.move });
  tl.hold(t + 3.6, 4.0);
  tl.tween(seam, 1, { at: t + 7.6, dur: 1.2, ease: ease.move });

  // — C8 [L2] · pull back; same 2014 network, locked; the loupe sweeps; ~50% —
  t = T[7];
  tl.tween(lblRepair, 0, { at: t, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_B, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(shrink, 1, { at: t + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(zoomHide, 0, { at: t + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(focus, 0, { at: t + 0.6, dur: 0.6, ease: ease.move });
  tl.tween(lockU, 1, { at: t + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(sweep, 1, { at: t + 1.3, dur: 2.4, ease: ease.linear });
  tl.tween(park, 1, { at: t + 3.7, dur: 0.8, ease: ease.move });
  tl.hold(t + 4.5, 1.0);

  // — C9 [L3] · swap the plate: same architecture, retrained; new identities; ~70% —
  t = T[8];
  tl.tween(out0, 1, { at: t + 0.1, dur: 0.7, ease: ease.move });
  tl.tween(in1, 1, { at: t + 0.5, dur: 1.0, ease: ease.move });
  tl.tween(rim1, 1, { at: t + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(rip1, 1, { at: t + 1.3, dur: 1.4, ease: ease.linear });
  tl.hold(t + 2.7, 1.0);

  // — C10 [L4] · swap again: ConvNeXt, same parameter count and dataset; ~99% —
  t = T[9];
  tl.tween(out1, 1, { at: t + 0.1, dur: 0.7, ease: ease.move });
  tl.tween(in2, 1, { at: t + 0.5, dur: 1.0, ease: ease.move });
  tl.tween(skipU, 1, { at: t + 1.4, dur: 1.2, ease: ease.draw });
  tl.tween(rim2, 1, { at: t + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(rip2, 1, { at: t + 2.0, dur: 1.8, ease: ease.linear });
  tl.hold(t + 3.8, 1.0);

  // — C11 [L2, L3, L4] · push to the staircase and name each jump —
  t = T[10];
  tl.tween(plateDim, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_STAIR, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(jumps, 3, { at: t + 1.2, dur: 3.0, ease: ease.linear });
  tl.hold(t + 4.2, 1.0);

  // — C12 [T4] · the staircase leaves entirely; a separate confidence dial on an empty stage —
  t = T[11];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(stairDim, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(dialU, 1, { at: t + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(needle, 0.85, { at: t + 1.6, dur: 1.4, ease: ease.move });
  tl.tween(dialVal, 1, { at: t + 3.0, dur: 0.6, ease: ease.enter });
  tl.tween(dialNote, 1, { at: t + 5.4, dur: 0.6, ease: ease.enter });
  tl.hold(t + 6.0, 1.0);

  // — C13 [T1, T2] · the dial leaves; staircase and suspect list on opaque panels —
  t = T[12];
  tl.tween(dialU, 0, { at: t, dur: 0.6, ease: ease.move });
  // the staircase returns only once the dial is gone
  tl.set(stairFin, 1, t + 0.6);
  tl.tween(panelR, 1, { at: t + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(stairDim, 0, { at: t + 0.6, dur: 1.0, ease: ease.move });
  tl.tween(panelL, 1, { at: t + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(listU, 5, { at: t + 1.4, dur: 2.5, ease: ease.linear });
  tl.hold(END - 0.6, 0.6);

  return {
    tl, cam, status, plateA, chipsIn, ringU, attribU, confusedU, suspU, suspDim, lightU, lastU, suspOut, layout,
    hoodU, lblG, lblP, lblO, turnOn, turn, chipsDim, morph, tilesIn, rimA, axisU, tread1, zoomHide, loupeU,
    focus, lblRepair, seam, shrink, lockU, sweep, park, out0, in1, rim1, rip1, out1, in2, skipU, rim2, rip2, plateDim, jumps,
    stairDim, dialU, needle, dialVal, dialNote, stairFin, panelR, panelL, listU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

function SuspectIcon({ icon, x, y, color }: { icon: Icon; x: number; y: number; color: string }) {
  const sw = 2.2;
  if (icon === 'lens')
    return (
      <g transform={`translate(${x},${y})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
        <circle cx={-2} cy={-2} r={6} />
        <line x1={2.5} y1={2.5} x2={8} y2={8} />
      </g>
    );
  if (icon === 'bubble')
    return (
      <g transform={`translate(${x},${y})`} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round">
        <path d="M-8,-7 H8 V4 H-1 L-6,8 V4 H-8 Z" />
      </g>
    );
  if (icon === 'blocks')
    return (
      <g transform={`translate(${x},${y})`} fill="none" stroke={color} strokeWidth={sw}>
        <rect x={-8} y={1} width={7} height={7} rx={1} />
        <rect x={1} y={1} width={7} height={7} rx={1} />
        <rect x={-3.5} y={-8} width={7} height={7} rx={1} />
      </g>
    );
  return (
    <g transform={`translate(${x},${y})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
      <path d="M6,-4 A7,7 0 1 0 7,2" />
      <path d="M7,-9 L6.5,-3.5 L1,-4" />
    </g>
  );
}

function LockIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M-6,-2 V-8 A6,6 0 0 1 6,-8 V-2" fill="none" stroke={color} strokeWidth={2.4} />
      <rect x={-9} y={-2} width={18} height={14} rx={3} fill={color} />
    </g>
  );
}

/** One tile: fogged tangle → crisp glyph as u goes 0 → 1. */
function Tile({ c, m, u, op }: { c: number; m: number; u: number; op: number }) {
  if (op <= 0.01) return null;
  const [x, y] = tileC(c);
  const col = NET[m];
  return (
    <g opacity={op}>
      <rect x={x - TILE / 2} y={y - TILE / 2} width={TILE} height={TILE} rx={6} fill="#121a2a" stroke={u > 0.5 ? col : '#243047'} strokeWidth={1.2} strokeOpacity={u > 0.5 ? 0.75 : 1} />
      {u > 0.01 && <rect x={x - TILE / 2} y={y - TILE / 2} width={TILE} height={TILE} rx={6} fill={col} opacity={0.16 * u} />}
      <Tangle x={x} y={y} r={11} rot={(c * 47) % 360} color={colors.MUTED} opacity={(1 - u) * 0.6} />
      <Glyph shape={TILE_SHAPES[FAM[m][c]]} x={x} y={y} r={9.5} rot={ROT[m][c]} color={col} width={2.2} opacity={u} />
    </g>
  );
}

function Loupe({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) {
  if (opacity <= 0.01) return null;
  const hx = x + r * 0.72;
  const hy = y + r * 0.72;
  const w = Math.max(2.4, r * 0.075);
  return (
    <g opacity={opacity}>
      <line x1={hx} y1={hy} x2={hx + r * 0.55} y2={hy + r * 0.55} stroke="#cbd5e1" strokeWidth={w * 2} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill="none" stroke={LENS} strokeWidth={w} />
    </g>
  );
}

/** The confidence dial: round, violet, dashed — deliberately nothing like the tiles or the staircase. */
function Dial({ u, needle, val, note }: { u: number; needle: number; val: number; note: number }) {
  if (u <= 0.01) return null;
  const cx = 335;
  const cy = 420;
  const R = 118;
  const arc = `M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`;
  const len = Math.PI * R;
  const a = Math.PI + Math.PI * needle;
  return (
    <g opacity={u}>
      <rect x={90} y={146} width={490} height={440} rx={22} fill={colors.BG} stroke={VIOLET} strokeWidth={1.6} strokeDasharray="7 7" />
      <text x={cx} y={206} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
        his confidence that generalization
      </text>
      <text x={cx} y={234} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
        explains nearly everything here
      </text>
      <path d={arc} fill="none" stroke={VIOLET} strokeOpacity={0.25} strokeWidth={16} strokeLinecap="round" />
      <path d={arc} fill="none" stroke={VIOLET} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${len * needle} ${len}`} opacity={needle > 0.005 ? 1 : 0} />
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * (R - 26)} y2={cy + Math.sin(a) * (R - 26)} stroke={LENS} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={9} fill={VIOLET} />
      <text x={cx} y={cy + 58} textAnchor="middle" fill={VIOLET} fontSize={34} fontWeight={700} opacity={val}>
        ~85%
      </text>
      <g opacity={note}>
        <text x={cx} y={cy + 106} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
          his confidence in an argument —
        </text>
        <text x={cx} y={cy + 134} textAnchor="middle" fill={colors.MUTED} fontSize={20}>
          not a share of neurons
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const st = STATUS[Math.max(0, Math.min(STATUS.length - 1, Math.round(s.get(scene.status))))];

  const plateA = v(scene.plateA);
  const chipsIn = v(scene.chipsIn);
  const ringU = v(scene.ringU);
  const attribU = v(scene.attribU);
  const confusedU = v(scene.confusedU);
  const suspU = v(scene.suspU);
  const suspDim = v(scene.suspDim);
  const lightU = v(scene.lightU);
  const lastU = v(scene.lastU);
  const suspOut = v(scene.suspOut);
  const L = v(scene.layout);
  const hoodU = v(scene.hoodU);
  const lblG = v(scene.lblG);
  const lblP = v(scene.lblP);
  const lblO = v(scene.lblO);
  const turnOn = v(scene.turnOn);
  const turn = v(scene.turn);
  const chipsDim = v(scene.chipsDim);
  const morph = v(scene.morph);
  const tilesIn = v(scene.tilesIn);
  const rimA = v(scene.rimA);
  const axisU = v(scene.axisU);
  const tread1 = v(scene.tread1);
  const zoomHide = v(scene.zoomHide);
  const focus = v(scene.focus);
  const loupeU = v(scene.loupeU);
  const lblRepair = v(scene.lblRepair);
  const seam = v(scene.seam);
  const shrink = v(scene.shrink);
  const lockU = v(scene.lockU);
  const sweep = v(scene.sweep);
  const park = v(scene.park);
  const out0 = v(scene.out0);
  const in1 = v(scene.in1);
  const rim1 = v(scene.rim1);
  const rip1 = v(scene.rip1);
  const out1 = v(scene.out1);
  const in2 = v(scene.in2);
  const skipU = v(scene.skipU);
  const rim2 = v(scene.rim2);
  const rip2 = v(scene.rip2);
  const plateDim = v(scene.plateDim);
  const jumps = v(scene.jumps);
  const stairDim = v(scene.stairDim);
  const dialU = v(scene.dialU);
  const needle = v(scene.needle);
  const dialVal = v(scene.dialVal);
  const dialNote = v(scene.dialNote);
  const stairFin = v(scene.stairFin);
  const panelR = v(scene.panelR);
  const panelL = v(scene.panelL);
  const listU = v(scene.listU);

  // ---- phase A ----
  const slotsOp = plateA * (1 - clamp01(morph * 2));
  const chipFade = 1 - clamp01((morph - 0.8) / 0.2);
  const activeTurn = turnOn > 0.01 && turn > 0 && turn < 6 ? Math.floor(turn) % 3 : -1;
  const bump = activeTurn >= 0 ? Math.sin(Math.PI * (turn - Math.floor(turn))) : 0;
  const plateRect = {
    x: lerp(PLATE_A.x, PLATE_B.x, morph),
    y: lerp(PLATE_A.y, PLATE_B.y, morph),
    w: lerp(PLATE_A.w, PLATE_B.w, morph),
    h: lerp(PLATE_A.h, PLATE_B.h, morph),
  };
  const ringRect = {
    x: lerp(SLOT_C[0][0] - SLOT_W / 2, RC[0] - TILE / 2 - 5, morph),
    y: lerp(SLOT_C[0][1] - SLOT_H / 2, RC[1] - TILE / 2 - 5, morph),
    w: lerp(SLOT_W, TILE + 10, morph),
    h: lerp(SLOT_H, TILE + 10, morph),
  };
  const suspGroupOp = 1 - suspOut;

  // ---- phase B: plates ----
  const dimOp = 1 - plateDim;
  const rimOp = (1 - clamp01(plateDim / 0.5)) * (1 - zoomHide);
  const plates = [
    { m: 0, dx: -300 * out0, op: 1 - out0 },
    { m: 1, dx: 100 * (1 - in1) - 300 * out1, op: in1 * (1 - out1) },
    { m: 2, dx: 100 * (1 - in2), op: in2 },
  ];
  const repairU = clamp01((seam - 0.85) / 0.15);
  const tileU = (m: number, c: number): number => {
    if (m === 0) {
      const early = RANK[0][c] < 3 ? 1 : 0;
      const ring = c === RING ? repairU : 0;
      const sw = RANK[0][c] < READ_AT[0] ? sweepU(c, sweep) : 0;
      return Math.max(early, ring, sw);
    }
    const rip = m === 1 ? rip1 : rip2;
    return RANK[m][c] < READ_AT[m] ? clamp01((rip - RIPPLE_D[c] * 0.8) / 0.2) : 0;
  };
  const tileEntry = (c: number): number => {
    const e = clamp01(tilesIn * 1.6 - ENTRY_D[c] * 0.6);
    return TARGETS.has(c) ? Math.max(e, clamp01((morph - 0.8) / 0.2)) : e;
  };

  // ---- the loupe ----
  const bigR = lerp(LOUPE_R, LOUPE_SMALL, shrink);
  const loupePos: V2 = sweep > 0 ? lerp2(loupeAt(sweep), REST, park) : lerp2(RC, SWEEP_START, shrink);
  const glassOp = loupeU * (1 - clamp01(shrink * 1.6));
  // seam 0: all old render · 0.5: split down the middle · 1: all repaired
  const seamX = RC[0] + LOUPE_R * (1 - 2 * seam);
  const oldLblOp = 1 - clamp01((seam - 0.75) / 0.25);

  // ---- staircase ----
  const stairOp = (1 - stairDim) * (1 - zoomHide);
  const heights = [TREAD_H[0] * tread1, TREAD_H[1] * sweep, TREAD_H[2] * rip1, TREAD_H[3] * rip2];
  const lblOp = [tread1, clamp01((sweep - 0.85) / 0.15), clamp01((rip1 - 0.85) / 0.15), clamp01((rip2 - 0.85) / 0.15)];
  const fs = lerp(1, FIN.s, stairFin);
  const ftx = FIN.tx * stairFin;
  const fty = FIN.ty * stairFin;

  const chipW = Math.max(st.main.length * 10.4 + 30, 120);
  const subW = st.sub ? st.sub.length * 8.6 + 26 : 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <defs>
          <clipPath id={`${ID}-glass`}>
            <circle cx={RC[0]} cy={RC[1]} r={LOUPE_R - 3} />
          </clipPath>
          <clipPath id={`${ID}-old`}>
            <rect x={RC[0] - LOUPE_R} y={RC[1] - LOUPE_R} width={Math.max(0, seamX - (RC[0] - LOUPE_R))} height={LOUPE_R * 2} />
          </clipPath>
          <clipPath id={`${ID}-new`}>
            <rect x={seamX} y={RC[1] - LOUPE_R} width={Math.max(0, RC[0] + LOUPE_R - seamX)} height={LOUPE_R * 2} />
          </clipPath>
        </defs>

        {/* ================= plate 0 (persistent from C1): frame morphs A → B ================= */}
        <g opacity={dimOp}>
          {plates.map(({ m, dx, op }) => {
            if (op <= 0.01) return null;
            const frame = m === 0 ? plateRect : PLATE_B;
            return (
              <g key={m} transform={`translate(${dx},0)`} opacity={m === 0 ? op * plateA : op}>
                <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx={16} opacity={m === 0 ? 1 - 0.95 * focus : 1} fill={colors.PANEL} stroke={morph > 0.5 ? NET[m] : EDGE} strokeOpacity={morph > 0.5 ? 0.55 : 1} strokeWidth={2} />
                {m === 2 && skipU > 0.01 && (
                  <g fill="none" stroke={NET[2]} strokeWidth={2.6} strokeLinecap="round">
                    {[0, 1, 2].map((k) => {
                      const y0 = 176 + k * 128;
                      return <path key={k} d={`M${PLATE_B.x},${y0} C${PLATE_B.x - 22},${y0 + 14} ${PLATE_B.x - 22},${y0 + 82} ${PLATE_B.x},${y0 + 96}`} strokeDasharray="140" strokeDashoffset={140 * (1 - skipU)} />;
                    })}
                  </g>
                )}
                {(m > 0 || morph > 0.3) && Array.from({ length: N * N }, (_, c) => <Tile key={c} c={c} m={m} u={tileU(m, c)} op={m === 0 ? tileEntry(c) * (c === RING ? 1 : 1 - 0.95 * focus) : 1} />)}
                {m === 0 && ringU > 0.01 && (
                  <rect x={ringRect.x} y={ringRect.y} width={ringRect.w} height={ringRect.h} rx={lerp(14, 8, morph)} fill="none" stroke={AMBER} strokeWidth={lerp(3, 3.2, morph)} opacity={ringU} />
                )}
                {/* rim labels (below the plate) */}
                {m === 0 && (
                  <>
                    <text x={317} y={586} textAnchor="middle" fill={colors.TEXT} fontSize={20} opacity={rimA * (1 - lockU) * rimOp}>
                      Inception V1 · last layer
                    </text>
                    <g opacity={lockU * rimOp}>
                      <LockIcon x={226} y={578} color={NET[0]} />
                      <text x={246} y={586} fill={colors.TEXT} fontSize={20} fontWeight={600}>
                        same 2014 network
                      </text>
                    </g>
                  </>
                )}
                {m === 1 && (
                  <text x={317} y={586} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600} opacity={rim1 * rimOp}>
                    same architecture, retrained
                  </text>
                )}
                {m === 2 && (
                  <g opacity={rim2 * rimOp}>
                    <text x={317} y={578} textAnchor="middle" fill={NET[2]} fontSize={20} fontWeight={700}>
                      ConvNeXt
                    </text>
                    <text x={317} y={600} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
                      same parameter count, same dataset
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ================= phase A: slots, chips, labels ================= */}
          {slotsOp > 0.01 && (
            <g opacity={slotsOp}>
              {hoodU > 0.01 && (
                <rect x={SLOT_C[0][0] - SLOT_W / 2 - 8} y={SLOT_C[0][1] - SLOT_H / 2 - 8} width={SLOT_W + 16} height={SLOT_H + 16} rx={18} fill={AMBER} fillOpacity={0.08} stroke={AMBER} strokeWidth={1.6} strokeDasharray="3 6" opacity={hoodU} />
              )}
              {SLOT_C.map(([cx, cy], k) => (
                <rect key={k} x={cx - SLOT_W / 2} y={cy - SLOT_H / 2} width={SLOT_W} height={SLOT_H} rx={14} fill="none" stroke={EDGE} strokeWidth={1.4} strokeDasharray="5 6" />
              ))}
            </g>
          )}
          {chipFade > 0.01 &&
            CHIPS.map((ch, n) => {
              const enter = ease.enter(clamp01(chipsIn * 1.5 - n / 24));
              if (enter <= 0.01) return null;
              const base = chipPos(ch, L);
              const [x, y] = lerp2(base, tileC(ch.target), morph);
              const size = lerp(CHIP, TILE, morph);
              const rot = L < 1 ? lerp(ch.rotP, 0, ease.move(clamp01((L - ch.delay) / 0.75))) : 0;
              const inSlot0 = ch.qSlot === 0 && L > 1.9;
              const lit = inSlot0 && ch.v === activeTurn;
              const turnDim = turnOn * (inSlot0 ? (lit ? 1 - bump : 1) * 0.55 : 0.35);
              const op = enter * (1 - 0.65 * chipsDim) * chipFade * (1 - turnDim);
              const fam = FAMS[ch.f];
              return (
                <g key={n} opacity={op}>
                  {lit && bump > 0.02 && <circle cx={x} cy={y} r={size * 0.72} fill={fam.color} opacity={0.25 * bump * turnOn} />}
                  <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={lerp(12, 6, morph)} fill="#111a2c" stroke={fam.color} strokeOpacity={0.7} strokeWidth={1.6} />
                  <Glyph shape={fam.shape} x={x} y={y} r={lerp(19, 9.5, morph) * (1 + (lit ? 0.18 * bump : 0))} rot={rot} color={fam.color} width={2.8} />
                </g>
              );
            })}
          <text x={640} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={20} opacity={attribU}>
            Neural Networks Are Already Clean · Nick Cammarata, Goodfire
          </text>
          <text x={312} y={258} textAnchor="end" fill={AMBER} fontSize={20} fontWeight={600} opacity={confusedU}>
            a confusing
          </text>
          <text x={312} y={282} textAnchor="end" fill={AMBER} fontSize={20} fontWeight={600} opacity={confusedU}>
            neuron?
          </text>
          <text x={640} y={578} textAnchor="middle" fill={'#60a5fa'} fontSize={23} fontWeight={600} opacity={lblG}>
            similar stays close
          </text>
          <text x={640} y={578} textAnchor="middle" fill={RED} fontSize={23} fontWeight={600} opacity={lblP}>
            unrelated, sharing a slot
          </text>
          <text x={640} y={578} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600} opacity={lblO}>
            ordinary explanations first
          </text>
        </g>

        {/* ================= the suspect row (C2–C5) ================= */}
        {suspU > 0.01 && suspGroupOp > 0.01 && (
          <g opacity={suspGroupOp}>
            {SUSPECTS.map((sp, k) => {
              const u = ease.enter(clamp01(suspU - k));
              if (u <= 0.01) return null;
              const lit = clamp01(lightU - k);
              const op = u * lerp(1 - 0.68 * suspDim, 1, lit);
              const x = SUS_X[k];
              const y = SUS_Y - (1 - u) * 18;
              return (
                <g key={sp.word} opacity={op}>
                  <rect x={x - SUS_W / 2} y={y - SUS_H / 2} width={SUS_W} height={SUS_H} rx={10} fill={colors.PANEL} stroke={sp.color} strokeWidth={1.4 + lit * 1.2} />
                  <SuspectIcon icon={sp.icon} x={x - SUS_W / 2 + 22} y={y} color={sp.color} />
                  <text x={x - SUS_W / 2 + 40} y={y + 7} fill={colors.TEXT} fontSize={19} fontWeight={600}>
                    {sp.word}
                  </text>
                  {k < 3 && lit > 0.5 && <path d={`M${x + SUS_W / 2 + 6},${y - 6} l6,6 l-6,6`} fill="none" stroke={colors.MUTED} strokeWidth={2} opacity={clamp01((lit - 0.5) * 2)} />}
                </g>
              );
            })}
            {lastU > 0.01 && (
              <g opacity={lastU}>
                <path d={`M${SUS_X[3] + SUS_W / 2 + 6},${SUS_Y - 6} l6,6 l-6,6`} fill="none" stroke={colors.MUTED} strokeWidth={2} />
                <rect x={SUS_X[4] - SUS_W / 2 - 8} y={SUS_Y - SUS_H / 2} width={SUS_W + 16} height={SUS_H} rx={10} fill={colors.PANEL} stroke={RED} strokeWidth={1.6} strokeDasharray="6 5" />
                <text x={SUS_X[4]} y={SUS_Y + 7} textAnchor="middle" fill={RED} fontSize={19} fontWeight={600}>
                  unrelated packing
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the loupe (C7 big, C8 sweeps, then parks) ================= */}
        <g opacity={dimOp}>
          {glassOp > 0.01 && (
            <g opacity={glassOp}>
              <circle cx={RC[0]} cy={RC[1]} r={LOUPE_R} fill="#070b14" />
              <g clipPath={`url(#${ID}-glass)`}>
                <g clipPath={`url(#${ID}-old)`}>
                  {SPECKLE.map((p, k) => (
                    <circle key={k} cx={RC[0] + p.x * LOUPE_R} cy={RC[1] + p.y * LOUPE_R} r={p.r * LOUPE_R} fill={p.c} opacity={0.55} />
                  ))}
                  <Tangle x={RC[0]} y={RC[1]} r={40} rot={20} color="#cbd5e1" width={2.2} opacity={0.8} />
                  <Tangle x={RC[0] - 6} y={RC[1] + 4} r={30} rot={140} color="#f472b6" width={1.8} opacity={0.7} />
                </g>
                <g clipPath={`url(#${ID}-new)`}>
                  <rect x={RC[0] - LOUPE_R} y={RC[1] - LOUPE_R} width={LOUPE_R * 2} height={LOUPE_R * 2} fill={NET[0]} opacity={0.1} />
                  <Glyph shape="chevron" x={RC[0]} y={RC[1] - 2} r={34} color={NET[0]} width={5} />
                </g>
                <line x1={seamX} y1={RC[1] - LOUPE_R} x2={seamX} y2={RC[1] + LOUPE_R} stroke={LENS} strokeWidth={1.6} opacity={seam > 0.01 && seam < 0.99 ? 0.9 : 0} />
              </g>
              <circle cx={RC[0]} cy={RC[1]} r={LOUPE_R - 4} fill="none" stroke={AMBER} strokeWidth={1.2} opacity={0.8} />
              <g opacity={lblRepair}>
                <text x={RC[0] - 30} y={RC[1] - LOUPE_R - 9} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} opacity={oldLblOp}>
                  old render
                </text>
                <text x={RC[0] + 30} y={RC[1] - LOUPE_R - 9} textAnchor="middle" fill={NET[0]} fontSize={8.5}>
                  repaired
                </text>
                <text x={RC[0]} y={RC[1] + LOUPE_R + 30} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontWeight={600}>
                  same neuron, different optimization
                </text>
              </g>
            </g>
          )}
          <Loupe x={loupePos[0]} y={loupePos[1]} r={bigR} opacity={loupeU} />
        </g>

        {/* ================= right panel backing (C13) ================= */}
        {panelR > 0.01 && (
          <g opacity={panelR}>
            <rect x={560} y={150} width={620} height={420} rx={18} fill={colors.BG} stroke={EDGE} strokeWidth={1.6} />
            <text x={870} y={186} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
              What each jump changed
            </text>
          </g>
        )}

        {/* ================= the staircase (persistent from C6) ================= */}
        {axisU > 0.01 && stairOp > 0.01 && (
          <g opacity={stairOp} transform={`translate(${ftx},${fty}) scale(${fs})`}>
            <line x1={AXIS_X} y1={BASE} x2={AXIS_X} y2={BASE - 300 * axisU} stroke={colors.MUTED} strokeWidth={1.6} />
            <line x1={AXIS_X} y1={BASE} x2={AXIS_X + (1200 - AXIS_X) * axisU} y2={BASE} stroke={colors.MUTED} strokeWidth={1.6} />
            {[0, 50, 100].map((p) => {
              const y = BASE - p * 3;
              const op = clamp01((axisU - p / 130) * 3);
              return (
                <g key={p} opacity={op}>
                  <line x1={AXIS_X - 6} y1={y} x2={AXIS_X} y2={y} stroke={colors.MUTED} strokeWidth={1.6} />
                  {p > 0 && <line x1={AXIS_X} y1={y} x2={1200} y2={y} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="3 7" opacity={0.35} />}
                  <text x={AXIS_X - 10} y={y + 6} textAnchor="end" fill={colors.MUTED} fontSize={17}>
                    {p}
                  </text>
                </g>
              );
            })}
            <text x={AXIS_X} y={258} fill={colors.MUTED} fontSize={17} opacity={axisU}>
              % of last-layer neurons judged readable
            </text>
            {heights.map((h, k) => {
              if (h <= 0.2 && !(k === 0 && tread1 > 0.01)) return null;
              const x = TREAD_X[k];
              const col = TREAD_C[k];
              return (
                <g key={k}>
                  {k === 0 && <rect x={x} y={BASE - 15} width={TW} height={15} fill="none" stroke={col} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7 * tread1} />}
                  <rect x={x} y={BASE - h} width={TW} height={h} fill={col} fillOpacity={0.2} />
                  <line x1={x} y1={BASE - h} x2={x + TW} y2={BASE - h} stroke={col} strokeWidth={3.5} strokeLinecap="round" />
                  {k === 0 ? (
                    <text x={x + TW / 2} y={BASE - 24} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={lblOp[0]}>
                      {TREAD_LBL[0]}
                    </text>
                  ) : (
                    <text x={x + TW / 2} y={BASE - h + 36} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={lblOp[k]}>
                      {TREAD_LBL[k]}
                    </text>
                  )}
                </g>
              );
            })}
            {JUMPS.map((jp, k) => {
              const u = clamp01(jumps - k);
              if (u <= 0.01) return null;
              const x = TREAD_X[k + 1] - 5;
              const y0 = TOPS[k];
              const y1 = lerp(y0, TOPS[k + 1], ease.draw(u));
              return (
                <g key={k}>
                  <line x1={x} y1={y0} x2={x} y2={y1 + 4} stroke={jp.color} strokeWidth={5} strokeLinecap="round" />
                  <path d={`M${x - 7},${y1 + 9} L${x},${y1 - 2} L${x + 7},${y1 + 9}`} fill="none" stroke={jp.color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
                  <text x={TREAD_X[k] + TW / 2} y={(TOPS[k] + TOPS[k + 1]) / 2 + 7} textAnchor="middle" fill={jp.color} fontSize={21} fontWeight={700} opacity={clamp01(u * 2 - 0.4)}>
                    {jp.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ================= C12: the confidence dial, alone ================= */}
        <Dial u={dialU} needle={needle} val={dialVal} note={dialNote} />

        {/* ================= C13: the suspect list, restacked ================= */}
        {panelL > 0.01 && (
          <g opacity={panelL}>
            <rect x={80} y={150} width={440} height={420} rx={18} fill={colors.BG} stroke={EDGE} strokeWidth={1.6} />
            <rect x={108} y={168} width={34} height={34} rx={7} fill="#121a2a" stroke={AMBER} strokeWidth={3} />
            <Tangle x={125} y={185} r={11} rot={47} color={colors.MUTED} opacity={0.7} />
            <text x={158} y={193} fill={colors.TEXT} fontSize={22} fontWeight={700}>
              Test on this neuron first
            </text>
            {SUSPECTS.map((sp, k) => {
              const u = ease.enter(clamp01(listU - k));
              const y = 262 + k * 56;
              return (
                <g key={sp.word} opacity={u} transform={`translate(${(1 - u) * -14},0)`}>
                  <text x={124} y={y + 8} textAnchor="middle" fill={colors.MUTED} fontSize={18} fontWeight={600}>
                    {k + 1}
                  </text>
                  <SuspectIcon icon={sp.icon} x={160} y={y} color={sp.color} />
                  <text x={184} y={y + 8} fill={colors.TEXT} fontSize={24} fontWeight={600}>
                    {sp.word}
                  </text>
                </g>
              );
            })}
            {(() => {
              const u = ease.enter(clamp01(listU - 4));
              return (
                <g opacity={u}>
                  <rect x={108} y={474} width={384} height={52} rx={10} fill="none" stroke={RED} strokeWidth={1.8} strokeDasharray="7 6" />
                  <text x={128} y={508} fill={RED} fontSize={22} fontWeight={600}>
                    unrelated packing
                  </text>
                  <text x={474} y={508} textAnchor="end" fill={colors.MUTED} fontSize={19}>
                    last
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </Camera>

      {/* ================= screen space: status chip + chapter title ================= */}
      <g>
        <rect x={60} y={26} width={chipW} height={36} rx={9} fill={colors.PANEL} stroke={st.color} strokeWidth={1.5} />
        <text x={60 + 15} y={50} fill={st.color} fontSize={18} fontWeight={700}>
          {st.main}
        </text>
        {st.sub && (
          <>
            <rect x={60} y={68} width={subW} height={26} rx={7} fill={colors.PANEL} stroke={EDGE} />
            <text x={60 + 13} y={86} fill={colors.MUTED} fontSize={16}>
              {st.sub}
            </text>
          </>
        )}
      </g>
      <text x={1220} y={50} textAnchor="end" fill={colors.MUTED} fontSize={20} fontWeight={600}>
        Refocus the Microscope
      </text>
    </>
  );
}

export const vizScene = () => scene;
