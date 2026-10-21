// Seventy-Two Numbers, One Program
//
// Generative Fields — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/generative-fields/README.md:13 (one 16-slot circuit, five families), 19 (72 = 8 knobs + 64 slot fields;
//     viewport held as context; never a code branch), 21 (span/height, greedy breaking, a hero is an importance peak)
//   lab/generative-fields/fields.ts:18 (slotCount), 20-43 (fields), 66-75 (knob ranges), 105 (wrapSlack 0.004),
//     229-293 (the five authored families, reproduced verbatim below)
//   lab/generative-fields/flow-layout.ts:106-116 (key order bit: exact ties go to the earlier slot), 136-155 (ranks),
//     193-211 (span = raw − relu(raw − 1); height), 254-284 (greedy line breaking, wrap when cursor + span ≥ 1 + wrapSlack)
//   lab/generative-fields/experiments.ts:119-120 (operations 8421: 4003 affine, 4082 reglu, 336 boolean; layers 201),
//     131-143 (family fitness table; "recompilations between families: 0 new operations") — printed run, review.md
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every card rectangle is computed below by the circuit's own layout rule (`flowLayout`, a
// float64 port of flow-layout.ts) and checked at module load against values the real circuit printed for this pin.
// The 16 token squares of the opening are SCHEMATIC placeholders (labelled), and the order-key edit in beat 5
// (slot 12 copies slot 2's key) is an ILLUSTRATIVE edit (labelled); its layout is still computed. Fitness scores
// and operation counts are the printed run (review.md), not computed here.
// Plan change: the list family's ten hidden slots fade out (visibility 0, fields.ts:276), not "hidden below the
// frame" — per review.md, visual note 1. The hero beat uses heroRail's slot 0 (the authored hero), not slot 2.
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
const smooth = (u: number): number => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH13 = 7.8; // mono advance at 13 px
const CH14 = 8.4; // mono advance at 14 px
const FAINT = 'rgba(148, 163, 184, 0.12)';
const WHISPER = 0.12; // competing layers
const trim = (v: number, d = 3): string => String(Math.round(v * 10 ** d) / 10 ** d);
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// The field vector (fields.ts) — 8 knobs, then 16 slots × [importance, orderKey, visibility, heightPreference]
// ---------------------------------------------------------------------------

const SLOTS = 16; // slotCount, fields.ts:18
const NF = 8 + SLOTS * 4; // 72
const KNOBS: Array<{ name: string; min: number; max: number }> = [
  { name: 'paddingX', min: 0, max: 120 },
  { name: 'paddingY', min: 0, max: 120 },
  { name: 'gapX', min: 0, max: 0.06 },
  { name: 'gapY', min: 0, max: 60 },
  { name: 'baseSpan', min: 0.03, max: 1 },
  { name: 'spanFromImportance', min: 0, max: 0.9 },
  { name: 'baseHeight', min: 24, max: 720 },
  { name: 'heightFromImportance', min: 0, max: 700 },
];
const SLOT_FIELDS = ['importance', 'orderKey', 'visibility', 'heightPreference'] as const;
const FIELD_COLOR = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.TEAL];
const CONTEXT = { viewportWidth: 1280, viewportHeight: 800, wrapSlack: 0.004 }; // defaultContext, fields.ts:101-107
const fi = (slot: number, field: number): number => 8 + slot * 4 + field;

type SlotIn = { importance?: number; visibility?: number; heightPreference?: number };
/** makeFieldVector(uniformSlots(...)) from fields.ts: defaults 0.2 / (slot+0.5)/16 / 1 / 0.5 */
function fieldVector(knobs: number[], slots: (slot: number) => SlotIn): number[] {
  const f = [...knobs];
  for (let s = 0; s < SLOTS; s++) {
    const o = slots(s);
    f.push(o.importance ?? 0.2, (s + 0.5) / SLOTS, o.visibility ?? 1, o.heightPreference ?? 0.5);
  }
  return f;
}

// the five authored families, fields.ts:240-284 verbatim
const MOSAIC_IMP = [0.9, 0.35, 0.65, 0.2, 0.5, 0.8, 0.15, 0.4, 0.7, 0.25, 0.55, 0.3, 0.85, 0.45, 0.6, 0.1];
const MOSAIC_PREF = [0.8, 0.4, 0.6, 0.3, 0.5, 0.7, 0.3, 0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.6, 0.3];
const HERO_KNOBS = [24, 24, 0.015, 12, 0.2, 0.58, 70, 120];
const F_GRID = fieldVector([24, 24, 0.015, 14, 0.235, 0, 177, 0], () => ({}));
const F_HERO = fieldVector(HERO_KNOBS, (s) => ({ importance: s === 0 ? 0.95 : 0.12 }));
const F_MOSAIC = fieldVector([20, 20, 0.012, 12, 0.18, 0.25, 48, 56], (s) => ({
  importance: MOSAIC_IMP[s],
  heightPreference: MOSAIC_PREF[s],
}));
const F_LIST = fieldVector([40, 24, 0.01, 12, 1, 0, 110, 0], (s) => ({ importance: 0.3, visibility: s < 6 ? 1 : 0 }));
const F_FILM = fieldVector([24, 60, 0.006, 10, 0.0555, 0, 640, 0], () => ({}));
// the hero beat: heroRail's knobs with slot 0's importance raised 0.12 → 0.5 → 0.95 (the authored value)
const heroAt = (imp: number) => fieldVector(HERO_KNOBS, (s) => ({ importance: s === 0 ? imp : 0.12 }));
// ILLUSTRATIVE edit for the tie beat: slot 12 takes slot 2's order key exactly
const F_EDIT = (() => {
  const f = [...F_MOSAIC];
  f[fi(12, 1)] = f[fi(2, 1)];
  return f;
})();

// printed run (experiments.ts:131-142; review.md visual note 6)
const FAMILIES = [
  { name: 'grid', f: F_GRID, fitness: 0.894 },
  { name: 'heroRail', f: F_HERO, fitness: 0.863 },
  { name: 'mosaic', f: F_MOSAIC, fitness: 0.823 },
  { name: 'list', f: F_LIST, fitness: 0.826 },
  { name: 'filmstrip', f: F_FILM, fitness: 0.87 },
];
const OPS = { total: 8421, affine: 4003, reglu: 4082, boolean: 336, layers: 201 };
const PAIRS = (SLOTS * (SLOTS - 1)) / 2; // one comparison bit per unordered pair, flow-layout.ts:136-145

// ---------------------------------------------------------------------------
// The circuit's layout rule, flow-layout.ts:126-312, in plain float64
// ---------------------------------------------------------------------------

type Rect = [x: number, y: number, w: number, h: number];
type Placement = { slot: number; tryX: number; tryTop: number; wrap: boolean };
type Layout = { rects: Rect[]; vis: number[]; rank: number[]; order: number[]; trace: Placement[]; rows: Array<{ top: number; bottom: number; last: number; tallest: number }> };

function flowLayout(f: number[]): Layout {
  const [padX, padY, gapX, gapY, baseSpan, spanFromImportance, baseHeight, heightFromImportance] = f;
  const imp = (s: number) => f[fi(s, 0)];
  const key = (s: number) => f[fi(s, 1)];
  const vis = Array.from({ length: SLOTS }, (_, s) => (f[fi(s, 2)] >= 0.5 ? 1 : 0)); // boolean atom at 0.5
  // rank = visible others that come first; ties (laterKey >= earlierKey) go to the earlier slot
  const rank = Array.from({ length: SLOTS }, (_, s) => {
    let r = 0;
    for (let o = 0; o < SLOTS; o++) {
      if (o === s || !vis[o]) continue;
      r += (o < s ? key(s) >= key(o) : key(o) < key(s)) ? 1 : 0;
    }
    return r;
  });
  const span = Array.from({ length: SLOTS }, (_, s) => {
    const raw = baseSpan + spanFromImportance * imp(s);
    return raw - Math.max(0, raw - 1);
  });
  const height = Array.from({ length: SLOTS }, (_, s) => (baseHeight + heightFromImportance * imp(s)) * (0.5 + f[fi(s, 3)]));
  const order: number[] = [];
  for (let s = 0; s < SLOTS; s++) if (vis[s]) order[rank[s]] = s;
  const inner = Math.max(0, CONTEXT.viewportWidth - 2 * padX);
  const rects: Rect[] = Array.from({ length: SLOTS }, () => [0, 0, 0, 0]);
  const trace: Placement[] = [];
  const rows: Layout['rows'] = [];
  let cursor = 0;
  let rowTop = padY;
  let rowBottom = padY;
  for (const s of order) {
    const wrap = cursor + span[s] >= 1 + CONTEXT.wrapSlack;
    const x = wrap ? 0 : cursor;
    const top = wrap ? rowBottom + gapY : rowTop;
    const bottom = wrap ? top + height[s] : Math.max(rowBottom, top + height[s]);
    trace.push({ slot: s, tryX: padX + inner * cursor, tryTop: rowTop, wrap });
    if (wrap || rows.length === 0) rows.push({ top, bottom, last: trace.length - 1, tallest: s });
    const row = rows[rows.length - 1];
    if (height[s] > height[row.tallest]) row.tallest = s;
    row.bottom = bottom;
    row.last = trace.length - 1;
    rects[s] = [padX + inner * x, top, inner * span[s], height[s]];
    cursor = x + span[s] + gapX;
    rowTop = top;
    rowBottom = bottom;
  }
  return { rects, vis, rank, order, trace, rows };
}

// the real circuit's output at the pin (bun, evaluateTensor, FP32), spot-checked against the port
const CHECK: Array<[number[], number, Rect]> = [
  [F_GRID, 5, [332, 215, 289.52, 177]],
  [F_HERO, 0, [24, 24, 925.23, 184]],
  [F_HERO, 13, [24, 605.6, 332.15, 84.4]],
  [F_MOSAIC, 12, [351.08, 496.04, 486.7, 124.28]],
  [F_MOSAIC, 15, [444.08, 632.32, 254.2, 42.88]],
  [F_LIST, 5, [40, 634, 1200, 110]],
  [F_FILM, 15, [1160.52, 60, 68.38, 640]],
];
for (const [f, s, want] of CHECK) {
  const got = flowLayout(f).rects[s];
  if (want.some((w, k) => Math.abs(w - got[k]) > 0.05)) throw new Error(`layout port mismatch at slot ${s}`);
}

const L_MOSAIC = flowLayout(F_MOSAIC);
const L_EDIT = flowLayout(F_EDIT);
const L_HERO = flowLayout(F_HERO);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the viewport: 1280×800 drawn at 0.53125
const VP = { x: 560, y: 140, w: 680, h: 425 };
const SC = VP.w / CONTEXT.viewportWidth;
const vx = (x: number) => VP.x + x * SC;
const vy = (y: number) => VP.y + y * SC;

// the dial bank
const BANK = { x: 40, w: 480 };
const KNOB_Y = 152; // first knob row centre
const KNOB_P = 22;
const KNOB_LBL = 215;
const KNOB_BAR = { x: 225, w: 175 };
const COL_X = (s: number) => 180 + s * 21;
const CELL_W = 17;
const CELL_Y = 366;
const CELL_H = 40;
const CELL_P = 48;
const ROW_LBL = 172;

// the opening's schematic tokens: one row of 16 identical squares along the viewport's bottom
const TOKEN: Rect[] = Array.from({ length: SLOTS }, (_, s) => [24 + s * 77, 680, 64, 64]);

// matrix (beat 5) over the knob block, columns aligned with the bank's slot columns
const MX = { y: 122, p: 14, h: 11 };
const before = (L: Layout) =>
  Array.from({ length: SLOTS }, (_, i) =>
    Array.from({ length: SLOTS }, (_, j) => (i !== j && L.vis[i] && L.vis[j] && L.rank[j] < L.rank[i] ? 1 : 0)),
  );
const MX_D = before(L_MOSAIC);
const MX_E = before(L_EDIT);
const MX_ROWS = [0, 2, 12, 15]; // rows labelled (slot · rank)

// flow-trace rows for beat 6 (the edited layout)
const FLOW = L_EDIT.trace;
const FLOW_ROWS = L_EDIT.rows;
const EDGE_X = vx(F_EDIT[0] + (CONTEXT.viewportWidth - 2 * F_EDIT[0]) * (1 + CONTEXT.wrapSlack));

// ---------------------------------------------------------------------------
// States: the one machine's keyframes (fields + rectangles); `st` lerps between neighbours
// ---------------------------------------------------------------------------

type State = { f: number[]; rects: Rect[]; vis: number[]; sized: number[] };
function stateOf(f: number[], prev?: State): State {
  const L = flowLayout(f);
  // hidden slots keep their previous rectangle so they fade in place instead of collapsing to the origin
  const rects = L.rects.map((r, s) => (L.vis[s] ? r : (prev?.rects[s] ?? r)));
  return { f, rects, vis: L.vis, sized: L.vis.map(() => 1) };
}
const STATES: State[] = [];
const push = (s: State) => STATES.push(s);
push({ f: F_MOSAIC, rects: TOKEN, vis: TOKEN.map(() => 1), sized: TOKEN.map(() => 0) }); // 0 tokens
push({ ...STATES[0], rects: TOKEN.map((r, s) => (s === 3 ? L_MOSAIC.rects[3] : r)), sized: TOKEN.map((_, s) => (s === 3 ? 1 : 0)) }); // 1 slot 3 sized
push(stateOf(F_MOSAIC)); // 2 mosaic
push(stateOf(F_EDIT)); // 3 the tie edit
push(stateOf(heroAt(0.12))); // 4
push(stateOf(heroAt(0.5))); // 5
push(stateOf(F_HERO)); // 6 heroRail
const FAM_AT: number[] = [];
for (const fam of FAMILIES) {
  FAM_AT.push(STATES.length);
  push(stateOf(fam.f, STATES[STATES.length - 1])); // 7 grid · 8 heroRail · 9 mosaic · 10 list · 11 filmstrip
}
const SCORE_AT = [0, 2, 3].map((k) => {
  push(stateOf(FAMILIES[k].f, STATES[STATES.length - 1])); // 12 grid · 13 mosaic · 14 list
  return STATES.length - 1;
});
const NS = STATES.length;
const FAM_RECTS = FAMILIES.map((fam) => flowLayout(fam.f));

// bank focus modes: which bank elements are lit (the rest whisper at 0.15)
type El = { kind: 'title' } | { kind: 'knob'; k: number } | { kind: 'cell'; s: number; f: number } | { kind: 'col'; s: number } | { kind: 'row'; f: number };
const FOCUS: Array<(e: El) => boolean> = [
  () => true, // 0 all
  (e) => e.kind === 'knob' || e.kind === 'title', // 1 knobs
  (e) => e.kind !== 'knob', // 2 slot block (and the title)
  (e) => (e.kind === 'cell' ? e.s === 3 : e.kind === 'col' ? e.s === 3 : e.kind === 'row'), // 3 slot 3
  (e) => (e.kind === 'knob' ? e.k >= 4 : e.kind === 'cell' ? e.f === 0 || e.f === 3 : e.kind === 'row' ? e.f === 0 || e.f === 3 : true), // 4 size
  (e) => (e.kind === 'cell' ? e.f === 1 : e.kind === 'row' ? e.f === 1 : e.kind === 'col' || e.kind === 'title'), // 5 order keys
  (e) => (e.kind === 'knob' ? e.k === 4 || e.k === 5 : e.kind === 'cell' ? e.s === 0 && e.f === 0 : e.kind === 'row' ? e.f === 0 : e.kind === 'col' ? e.s === 0 : e.kind === 'title'), // 6 hero
  (e) => (e.kind === 'cell' ? e.f === 2 : e.kind === 'row' ? e.f === 2 : e.kind === 'col' || e.kind === 'title'), // 7 visibility
  () => false, // 8 none
];
const focusOp = (fv: number, e: El): number => {
  let o = 0;
  for (let m = 0; m < FOCUS.length; m++) {
    const w = clamp01(1 - Math.abs(fv - m));
    if (w > 0) o += w * (FOCUS[m](e) ? 1 : WHISPER);
  }
  return o;
};

// cameras, clamped so the view never leaves the stage
const camAt = (x: number, y: number, k: number): CameraState => {
  const hx = STAGE_W / 2 / k;
  const hy = STAGE_H / 2 / k;
  return { x: Math.min(STAGE_W - hx, Math.max(hx, x)), y: Math.min(STAGE_H - hy, Math.max(hy, y)), k };
};
const HOME: CameraState = CAMERA_HOME;
const CAM_OPEN = camAt(900, 352, 1.12);
const CAM_COL3 = camAt(300, 440, 1.5);
const CAM_FORM = camAt(900, 360, 1.12);
const CAM_VP = camAt(900, 340, 1.12);

// header chips
const PIN = 'handwired@4ea7fcb · lab/generative-fields/';
const SOURCES = [
  'README.md:13',
  'README.md:19 · fields.ts:18-30',
  'README.md:19 · fields.ts:38-43',
  'flow-layout.ts:193-211 · README.md:21',
  'flow-layout.ts:106-116, 136-155',
  'flow-layout.ts:254-284',
  'README.md:21 · fields.ts:246-253',
  'fields.ts:240-284',
  'experiments.ts:143 (printed run)',
  'experiments.ts:119-120 (printed run)',
  'experiments.ts:131-142 · fields.ts:276',
  'README.md:13',
];

// slot 3's numbers for the formula beat (mosaic)
const S3 = { imp: F_MOSAIC[fi(3, 0)], key: F_MOSAIC[fi(3, 1)], vis: F_MOSAIC[fi(3, 2)], hp: F_MOSAIC[fi(3, 3)] };
const S3_RAW = F_MOSAIC[4] + F_MOSAIC[5] * S3.imp;
const S3_SPAN = S3_RAW - Math.max(0, S3_RAW - 1);
const S3_H = (F_MOSAIC[6] + F_MOSAIC[7] * S3.imp) * (0.5 + S3.hp);

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'A page needs a layout: which items are big, which come first, where each row breaks. This lab asks whether one fixed circuit can decide all of that, steered by nothing but numbers.',
  'Those numbers are seventy-two generative fields: eight global knobs, plus four fields for each of sixteen slots. The viewport size is held aside as context.',
  'Each slot has an importance, an order key, a visibility and a height preference, all from zero to one. What makes one slot differ from another lives only in these cells, never in a code branch.',
  'Importance becomes size. Span is a base span plus importance times a coefficient, capped at one full row by a relu trick. Height follows the same pattern, scaled by the height preference.',
  'Order keys decide who goes first. The circuit compares every pair of keys, and when two keys are exactly equal, the lower slot number wins.',
  'Then the slots flow like words in a paragraph. A slot that would pass the right edge starts a new row, and each row is as tall as its tallest member.',
  'A hero is just an importance peak. One slot with a big importance gets a wide span, and it crowds the others out of its row.',
  'Now change only numbers. The same sixteen slots reshape into a uniform grid, then a hero with a rail, a mosaic, a list and a filmstrip.',
  'Between those five families the code reports zero new operations. It is the same compiled program every time, and only the source cells differ.',
  'The program is not small: the code prints eight thousand four hundred twenty-one operations in two hundred one layers. The flow costs depth, because each wrap decision feeds the next.',
  'Every family gets a fitness score. The grid scores point eight nine four, the mosaic point eight two three. The list shows six of sixteen slots: its visibility hides the rest, since sixteen rows would overflow.',
  'So the first claim is narrow and solid: one program, five layouts, set only by numbers. Whether those numbers can be found automatically, and whether they are any good, comes next.',
];
// ~150 words per minute, plus a little air
const DUR = CAPTIONS.map((c) => Math.round((c.split(/\s+/).length * 0.4 + 0.4) * 10) / 10);
const HOLD = 0.7;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const src = tl.channel('src', 0);
  const st = tl.channel('state', 0);
  const focus = tl.channel('bankFocus', 0);
  // B0
  const vpIn = tl.channel('viewportIn', 0);
  const tokU = tl.channel('tokensIn', 0);
  const qU = tl.channel('questions', 0);
  const qOp = tl.channel('questionsOp', 1);
  const circU = tl.channel('oneCircuitLbl', 0);
  const bankIn = tl.channel('bankIn', 0);
  // B1
  const eqU = tl.channel('eqU', 0);
  const knobLbl = tl.channel('knobLabels', 0);
  const slotLbl = tl.channel('slotLabels', 0);
  const ctxU = tl.channel('contextU', 0);
  const ctxGlow = tl.channel('contextGlow', 0);
  // B2
  const fill3 = tl.channel('fillSlot3', 0);
  const callU = tl.channel('slot3Callout', 0);
  const tok3 = tl.channel('token3Pop', 0);
  const tokSpot = tl.channel('token3Spot', 0);
  const fillAll = tl.channel('fillAll', 0);
  const branchU = tl.channel('noBranchLbl', 0);
  // B3
  const fmU = tl.channel('formulaPanel', 0);
  const fm1 = tl.channel('fmRaw', 0);
  const hingeU = tl.channel('hinge', 0);
  const fm2 = tl.channel('fmSpan', 0);
  const fm3 = tl.channel('fmHeight', 0);
  // B4
  const mxU = tl.channel('matrixIn', 0);
  const editU = tl.channel('editLbl', 0);
  const tieU = tl.channel('tieU', 0);
  // B5
  const flowOn = tl.channel('flowOn', 0);
  const flowU = tl.channel('flowU', 0);
  const ruleU = tl.channel('ruleLbl', 0);
  // B6
  const heroU = tl.channel('heroLbl', 0);
  // B7 / B8
  const famU = tl.channel('familyChips', 0);
  const ctrU = tl.channel('counterU', 0);
  const ctrGlow = tl.channel('counterGlow', 0);
  const printU = tl.channel('printedLine', 0);
  const bankGlow = tl.channel('bankGlow', 0);
  // B9
  const bankOp = tl.channel('bankOp', 1);
  const statsU = tl.channel('statsU', 0);
  const opsU = tl.channel('opsCount', 0);
  const mixU = tl.channel('opsMix', 0);
  const layersU = tl.channel('layersRuler', 0);
  const chainU = tl.channel('wrapChain', 0);
  const chainOp = tl.channel('wrapChainOp', 1);
  // B10
  const scoreU = tl.channel('scoreU', 0);
  const rowsU = tl.channel('scoreRows', 0);
  const scoreFocus = tl.channel('scoreFocus', 0);
  // B11
  const endFade = tl.channel('endFade', 0);
  const recapU = tl.channel('recapU', 0);
  const nextU = tl.channel('nextU', 0);

  let t = 0.4;
  const beat = (i: number): number => {
    const b = t;
    tl.caption({ at: b, dur: DUR[i], text: CAPTIONS[i] });
    tl.set(src, i, b);
    tl.hold(b + DUR[i], HOLD);
    t = b + DUR[i] + HOLD;
    return b;
  };
  const enter = (ch: ChannelRef<number>, at: number, to = 1, dur = 0.6) => tl.tween(ch, to, { at, dur, ease: ease.enter });
  const move = (ch: ChannelRef<number>, to: number, at: number, dur = 0.8) => tl.tween(ch, to, { at, dur, ease: ease.move });

  // — B0 · who decides the layout? —
  let b = beat(0);
  tl.tween(vpIn, 1, { at: b + 0.1, dur: 1.2, ease: ease.draw });
  tl.tween(tokU, 1, { at: b + 0.9, dur: 1.0, ease: ease.linear });
  [1, 2, 3].forEach((q, i) => enter(qU, b + 2.0 + i * 1.5, q, 0.5));
  move(qOp, 0, b + 7.0, 0.6);
  enter(circU, b + 7.8);
  tl.tween(cam, HOME, { at: b + 7.4, dur: 1.3, ease: ease.move });
  tl.tween(bankIn, 1, { at: b + 8.0, dur: 1.2, ease: ease.move });

  // — B1 · seventy-two fields —
  b = beat(1);
  move(circU, 0, b, 0.5);
  enter(eqU, b + 0.3);
  enter(knobLbl, b + 1.4, 1, 1.0);
  move(focus, 1, b + 1.4, 0.6);
  enter(slotLbl, b + 4.0, 1, 0.8);
  move(focus, 2, b + 4.0, 0.6);
  move(focus, 0, b + 7.0, 0.6);
  enter(ctxU, b + 7.2);
  enter(ctxGlow, b + 7.2, 1, 0.4);
  move(ctxGlow, 0, b + 9.6, 0.6);

  // — B2 · four fields per slot, values only —
  b = beat(2);
  tl.tween(cam, CAM_COL3, { at: b, dur: 1.3, ease: ease.move });
  move(focus, 3, b + 0.2, 0.6);
  enter(callU, b + 0.8, 1, 0.5);
  move(tokSpot, 1, b + 0.2, 0.6);
  [1, 2, 3, 4].forEach((k, i) => tl.tween(fill3, k, { at: b + 1.2 + i * 0.95, dur: 0.6, ease: ease.move }));
  tl.tween(tok3, 1, { at: b + 5.0, dur: 0.5, ease: ease.pop });
  move(callU, 0, b + 7.2, 0.5);
  move(tokSpot, 0, b + 8.3, 0.6);
  tl.tween(cam, HOME, { at: b + 7.2, dur: 1.3, ease: ease.move });
  move(focus, 0, b + 7.4, 0.6);
  tl.tween(fillAll, 1, { at: b + 7.6, dur: 1.8, ease: ease.linear });
  enter(branchU, b + 10.0);

  // — B3 · importance becomes size —
  b = beat(3);
  move(branchU, 0, b, 0.5);
  tl.tween(cam, CAM_FORM, { at: b, dur: 1.3, ease: ease.move });
  move(focus, 8, b + 0.2, 0.6);
  enter(fmU, b + 0.3, 1, 0.5);
  tl.tween(st, 1, { at: b + 0.9, dur: 1.4, ease: ease.move });
  enter(fm1, b + 1.6);
  tl.tween(hingeU, 1, { at: b + 4.0, dur: 1.2, ease: ease.draw });
  enter(fm2, b + 4.6);
  enter(fm3, b + 8.2);
  move(fmU, 0, b + 11.2, 0.5);
  tl.tween(cam, HOME, { at: b + 11.2, dur: 1.3, ease: ease.move });
  move(focus, 4, b + 11.2, 0.6);
  tl.tween(st, 2, { at: b + 11.4, dur: 1.4, ease: ease.move });

  // — B4 · order keys: every pair compared, ties to the lower slot —
  b = beat(4);
  move(focus, 5, b, 0.6);
  tl.tween(mxU, 1, { at: b + 0.8, dur: 1.4, ease: ease.linear });
  enter(editU, b + 3.0, 1, 0.5);
  tl.tween(st, 3, { at: b + 3.3, dur: 1.0, ease: ease.move });
  enter(tieU, b + 4.6, 1, 0.5);

  // — B5 · greedy line breaking —
  b = beat(5);
  for (const ch of [mxU, editU, tieU]) move(ch, 0, b, 0.6);
  move(focus, 8, b, 0.6);
  tl.tween(cam, CAM_VP, { at: b, dur: 1.3, ease: ease.move });
  tl.set(flowOn, 1, b + 0.3);
  enter(ruleU, b + 0.6);
  move(ctxU, 0, b, 0.5);
  tl.tween(flowU, SLOTS, { at: b + 1.2, dur: 9.0, ease: ease.linear });

  // — B6 · a hero is an importance peak —
  b = beat(6);
  move(ruleU, 0, b, 0.5);
  tl.set(flowOn, 0, b + 0.05);
  tl.tween(cam, HOME, { at: b, dur: 1.2, ease: ease.move });
  move(focus, 6, b + 0.2, 0.6);
  tl.tween(st, 4, { at: b + 0.3, dur: 1.4, ease: ease.move });
  enter(heroU, b + 2.0);
  tl.tween(st, 5, { at: b + 3.6, dur: 1.2, ease: ease.move });
  tl.tween(st, 6, { at: b + 5.6, dur: 1.2, ease: ease.move });

  // — B7 · change only numbers: five families —
  b = beat(7);
  move(heroU, 0, b, 0.5);
  tl.tween(cam, HOME, { at: b, dur: 1.3, ease: ease.move });
  move(focus, 0, b + 0.2, 0.6);
  enter(famU, b + 0.5);
  enter(ctrU, b + 1.0);
  const famTimes = [3.9, 6.1, 7.3, 8.4, 9.5];
  famTimes.forEach((at, k) => tl.tween(st, FAM_AT[k], { at: b + at, dur: 0.8, ease: ease.move }));
  move(focus, 7, b + 8.4, 0.5);
  move(focus, 0, b + 9.6, 0.5);

  // — B8 · zero new operations —
  b = beat(8);
  enter(ctrGlow, b + 0.3, 1, 0.5);
  enter(printU, b + 1.0);
  enter(bankGlow, b + 5.6, 1, 0.6);
  move(ctrGlow, 0, b + 9.2, 0.6);
  move(bankGlow, 0, b + 9.2, 0.6);

  // — B9 · 8,421 operations, 201 layers; the flow is a chain —
  b = beat(9);
  move(bankOp, 0, b, 0.7);
  move(printU, 0, b, 0.5);
  move(famU, WHISPER, b, 0.6);
  move(ctrU, WHISPER, b, 0.6);
  enter(statsU, b + 0.5);
  tl.tween(opsU, 1, { at: b + 1.0, dur: 1.6, ease: ease.enter });
  tl.tween(mixU, 1, { at: b + 2.6, dur: 1.2, ease: ease.draw });
  tl.tween(layersU, 1, { at: b + 4.6, dur: 1.4, ease: ease.draw });
  tl.tween(chainU, 1, { at: b + 7.6, dur: 2.6, ease: ease.linear });

  // — B10 · fitness per family —
  b = beat(10);
  move(statsU, 0, b, 0.6);
  move(chainOp, 0, b, 0.6);
  enter(scoreU, b + 0.4);
  tl.tween(rowsU, 1, { at: b + 0.6, dur: 1.5, ease: ease.linear });
  const scoreTimes = [3.0, 5.6, 8.2];
  scoreTimes.forEach((at, k) => {
    tl.tween(st, SCORE_AT[k], { at: b + at, dur: 0.9, ease: ease.move });
    move(scoreFocus, k + 1, b + at, 0.5);
  });
  move(scoreFocus, 0, b + 13.6, 0.6);

  // — B11 · the narrow claim —
  b = beat(11);
  move(endFade, 1, b + 0.2, 0.8);
  enter(recapU, b + 0.8, 1, 0.7);
  enter(nextU, b + 4.6, 1, 0.7);
  tl.hold(t, 1.6);

  return {
    tl, cam, src, st, focus, vpIn, tokU, qU, qOp, circU, bankIn, eqU, knobLbl, slotLbl, ctxU, ctxGlow,
    fill3, callU, tok3, tokSpot, fillAll, branchU, fmU, fm1, hingeU, fm2, fm3, mxU, editU, tieU, flowOn, flowU, ruleU,
    heroU, famU, ctrU, ctrGlow, printU, bankGlow, bankOp, statsU, opsU, mixU, layersU, chainU, chainOp,
    scoreU, rowsU, scoreFocus, endFade, recapU, nextU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color = colors.MUTED, size = 13, opacity = 1, anchor = 'start', stroke = colors.GRID }: {
  x: number; y: number; text: string; color?: string; size?: number; opacity?: number; anchor?: 'start' | 'end'; stroke?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (size === 14 ? CH14 : size * 0.6) + 20;
  const x0 = anchor === 'end' ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size - 4} width={w} height={size + 12} rx={6} fill={colors.PANEL} stroke={stroke} strokeWidth={1.2} />
      <text x={x0 + 10} y={y} fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

/** A small framed thumbnail of one family's layout, at `k` times the viewport. */
function Thumb({ x, y, k, L, opacity = 1 }: { x: number; y: number; k: number; L: Layout; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={CONTEXT.viewportWidth * k} height={CONTEXT.viewportHeight * k} rx={2} fill={colors.BG} stroke={colors.MUTED} strokeOpacity={0.6} />
      {L.rects.map((r, s) =>
        L.vis[s] ? <rect key={s} x={x + r[0] * k} y={y + r[1] * k} width={Math.max(0.8, r[2] * k)} height={Math.max(0.8, r[3] * k)} fill={colors.ACCENT} fillOpacity={0.55} /> : null,
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
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(v(scene.src))));

  // ---- the machine's current state
  const stP = Math.max(0, Math.min(NS - 1, v(scene.st)));
  const i0 = Math.min(NS - 2, Math.floor(stP));
  const u = stP - i0;
  const A = STATES[i0];
  const B = STATES[i0 + 1];
  const F = A.f.map((a, k) => lerp(a, B.f[k], u));
  const rectAt = (sl: number): Rect => A.rects[sl].map((a, k) => lerp(a, B.rects[sl][k], u)) as Rect;
  const visAt = (sl: number) => lerp(A.vis[sl], B.vis[sl], u);
  const sizedAt = (sl: number) => lerp(A.sized[sl], B.sized[sl], u);

  const fv = v(scene.focus);
  const mxHide = 1 - clamp01(v(scene.mxU) * 4); // the matrix panel replaces the knob block
  const end = v(scene.endFade);
  const bankOp = v(scene.bankOp) * clamp01(v(scene.bankIn) * 1.4) * (1 - end * 0.88);
  const bankDx = lerp(-520, 0, v(scene.bankIn));
  const fill3 = v(scene.fill3);
  const fillAll = v(scene.fillAll);
  const fillOf = (sl: number, k: number) => (sl === 3 ? Math.max(clamp01(fill3 - k), fillAll) : staggerU(fillAll, sl * 4 + k, 64, 0.012, 0.35));
  const knobFill = (k: number) => staggerU(fillAll, k, 8, 0.05, 0.4);

  const titleOp = focusOp(fv, { kind: 'title' }) * mxHide;
  const flowOn = v(scene.flowOn) > 0.5;
  const flowU = v(scene.flowU);
  const tieU = v(scene.tieU);
  const tokSpot = v(scene.tokSpot);
  const cardsOp = clamp01(v(scene.vpIn) * 1.5) * (1 - end * 0.88);
  const heroGlow = clamp01(stP - 4) * (1 - clamp01(stP - 6.6)) * (stP < 7 ? 1 : 0);
  const famU = v(scene.famU) * (1 - end * 0.88);
  const scoreFocus = v(scene.scoreFocus);

  // ---- cards (one per slot; drawn from the state lerp, or from the flow trace in beat 6)
  const cards = Array.from({ length: SLOTS }, (_, sl) => {
    let r = rectAt(sl);
    let op = visAt(sl);
    let stroke: string = colors.ACCENT;
    let sized = sizedAt(sl);
    let ghost = false;
    if (flowOn) {
      const p = L_EDIT.rank[sl];
      const tr = FLOW[p];
      const fin = L_EDIT.rects[sl];
      const fu = clamp01(flowU - p);
      sized = 1;
      if (fu <= 0) {
        r = fin;
        ghost = true;
      } else if (tr.wrap) {
        const tryR: Rect = [tr.tryX, tr.tryTop, fin[2], fin[3]];
        const m = smooth((fu - 0.45) / 0.5);
        r = tryR.map((a, k) => lerp(a, fin[k], m)) as Rect;
        op = clamp01(fu / 0.2);
        stroke = m < 0.5 ? colors.NEGATIVE : colors.ACCENT;
      } else {
        r = fin;
        op = clamp01(fu / 0.25);
      }
    }
    const imp = F[fi(sl, 0)];
    return { sl, r, op, stroke, sized, ghost, imp };
  });
  const cardLit = (sl: number): number => {
    // tie beat: slots 2 and 12 lit; hero beat: slot 0 lit
    if (tieU > 0.01) return sl === 2 || sl === 12 ? 1 : lerp(1, 0.25, tieU);
    if (heroGlow > 0.01) return sl === 0 ? 1 : lerp(1, 0.55, heroGlow);
    if (tokSpot > 0.01) return sl === 3 ? 1 : lerp(1, WHISPER, tokSpot);
    return 1;
  };
  const drawOrder = [...cards].sort((a, b) => (a.sl === 3 ? 1 : 0) - (b.sl === 3 ? 1 : 0) || (cardLit(a.sl) - cardLit(b.sl)));

  // flow decorations
  const flowRowsDone = FLOW_ROWS.filter((row) => flowU >= row.last + 1);
  const flowP = Math.min(SLOTS - 1, Math.floor(flowU));
  const showCursor = flowOn && flowU > 0 && flowU < SLOTS - 0.02;

  // stats
  const statsU = v(scene.statsU) * (1 - end);
  const opsU = v(scene.opsU);
  const mixU = v(scene.mixU);
  const layersU = v(scene.layersU);
  const chainU = v(scene.chainU) * v(scene.chainOp);
  const scoreU = v(scene.scoreU) * (1 - end * 0.88);
  const recapU = v(scene.recapU);

  const chip = `${PIN}${SOURCES[srcIdx]}`;
  const hero0 = F[fi(0, 0)];
  const heroSpan = Math.min(1, F[4] + F[5] * hero0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the viewport: 1280 × 800 at 0.53 ================= */}
        <g opacity={(1 - end * 0.85) * clamp01(v(scene.vpIn) * 2)}>
          <rect
            x={VP.x}
            y={VP.y}
            width={VP.w}
            height={VP.h}
            rx={6}
            fill="none"
            stroke={colors.MUTED}
            strokeWidth={1.6}
            strokeDasharray={`${(VP.w + VP.h) * 2 * v(scene.vpIn)} 4000`}
          />
        </g>
        {/* flow: finished row bands */}
        {flowOn &&
          flowRowsDone.map((row, k) => (
            <g key={k}>
              <rect x={vx(F_EDIT[0])} y={vy(row.top)} width={(CONTEXT.viewportWidth - 2 * F_EDIT[0]) * SC} height={(row.bottom - row.top) * SC} fill={colors.WARM} fillOpacity={0.05} stroke={colors.WARM} strokeOpacity={0.35} strokeDasharray="4 4" />
            </g>
          ))}
        {/* the cards */}
        <g opacity={cardsOp}>
          {drawOrder.map(({ sl, r, op, stroke, sized, ghost, imp }) => {
            const tokIn = staggerU(v(scene.tokU), sl, SLOTS, 0.05, 0.3);
            const o = op * (sized > 0.5 ? 1 : tokIn) * cardLit(sl);
            if (o <= 0.005 && !ghost) return null;
            const x = vx(r[0]);
            const y = vy(r[1]);
            const w = r[2] * SC;
            const h = r[3] * SC;
            if (ghost) {
              return <rect key={sl} x={x} y={y} width={w} height={h} rx={3} fill="none" stroke={colors.MUTED} strokeOpacity={0.25} strokeDasharray="3 4" />;
            }
            // tokens light as their cells fill
            const filled = sl === 3 ? Math.max(v(scene.tok3), fillAll) : staggerU(fillAll, sl, SLOTS, 0.06, 0.4);
            const tint = sized > 0.5 ? 0.1 + 0.4 * imp : 0.25 * filled;
            const isEdge = x + w > STAGE_W - 4;
            const lit = (tieU > 0.01 && (sl === 2 || sl === 12)) || (heroGlow > 0.5 && sl === 0);
            const pop = sl === 3 && sized < 0.5 ? 1 + 0.18 * Math.sin(Math.PI * clamp01(v(scene.tok3))) : 1;
            const cx = x + w / 2;
            const cy = y + h / 2;
            return (
              <g key={sl} opacity={o} transform={pop !== 1 ? `translate(${cx} ${cy}) scale(${pop}) translate(${-cx} ${-cy})` : undefined}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(1, w)}
                  height={Math.max(1, h)}
                  rx={3}
                  fill={colors.ACCENT}
                  fillOpacity={tint}
                  stroke={lit ? colors.WARM : stroke}
                  strokeWidth={lit ? 2.4 : 1.4}
                  strokeDasharray={sized < 0.5 ? '4 3' : undefined}
                  strokeOpacity={sized < 0.5 ? 0.8 : 1}
                />
                {w >= 16 && h >= 15 && !isEdge && (
                  <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={h >= 22 ? 13 : 12} fontFamily={MONO} fill={colors.TEXT}>
                    {sl}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {/* the opening: three questions inside the empty viewport */}
        {v(scene.qU) > 0.005 && v(scene.qOp) > 0.005 && (
          <g opacity={v(scene.qOp)} fontSize={20} fill={colors.TEXT} textAnchor="middle">
            {['which items are big?', 'which come first?', 'where does each row break?'].map((q, k) => (
              <text key={k} x={VP.x + VP.w / 2} y={235 + k * 52} opacity={clamp01(v(scene.qU) - k)}>
                {q}
              </text>
            ))}
            <text x={VP.x + VP.w / 2} y={480} fontSize={14} fill={colors.MUTED} fontFamily={MONO} opacity={clamp01(v(scene.tokU) * 2)}>
              16 slots · placeholders (schematic)
            </text>
          </g>
        )}
        <Chip x={VP.x} y={126} text="one fixed circuit · steered only by numbers" opacity={v(scene.circU)} color={colors.TEXT} size={14} />

        {/* flow: right edge, cursor, rule, row-height note */}
        {flowOn && (
          <g>
            <line x1={EDGE_X} y1={VP.y - 6} x2={EDGE_X} y2={VP.y + VP.h + 6} stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="5 4" opacity={0.8 * v(scene.ruleU)} />
            {showCursor && (
              <g>
                <line x1={vx(FLOW[flowP].tryX)} y1={vy(FLOW[flowP].tryTop) - 8} x2={vx(FLOW[flowP].tryX)} y2={vy(FLOW[flowP].tryTop) + 26} stroke={colors.WARM} strokeWidth={2.4} />
                <polygon points={`${vx(FLOW[flowP].tryX) - 6},${vy(FLOW[flowP].tryTop) - 14} ${vx(FLOW[flowP].tryX) + 6},${vy(FLOW[flowP].tryTop) - 14} ${vx(FLOW[flowP].tryX)},${vy(FLOW[flowP].tryTop) - 6}`} fill={colors.WARM} />
              </g>
            )}
            {flowRowsDone.length > 0 && (
              <text x={vx(L_EDIT.rects[FLOW[FLOW_ROWS[0].last].slot][0] + L_EDIT.rects[FLOW[FLOW_ROWS[0].last].slot][2]) + 14} y={vy((FLOW_ROWS[0].top + FLOW_ROWS[0].bottom) / 2) + 5} fontSize={13} fill={colors.WARM} opacity={clamp01((flowU - FLOW_ROWS[0].last - 1) * 2)}>
                row height = its tallest member
              </text>
            )}
          </g>
        )}
        <Chip x={VP.x} y={126} text={`wrap when cursor + span ≥ 1 + wrapSlack   (wrapSlack = ${CONTEXT.wrapSlack})`} opacity={v(scene.ruleU)} color={colors.TEXT} />

        {/* hero label (live values from the lerped fields) */}
        <Chip x={VP.x} y={126} text={`slot 0 · importance ${hero0.toFixed(2)} → span ${heroSpan.toFixed(3)} = 0.2 + 0.58 × ${hero0.toFixed(2)}`} opacity={v(scene.heroU)} color={colors.TEXT} />

        {/* tie chip */}
        <Chip x={VP.x} y={126} text="ties: lower slot index wins · slot 2 goes before slot 12" opacity={tieU} color={colors.WARM} stroke={colors.WARM} />

        {/* family chips + the pinned counter */}
        {famU > 0.005 && (
          <g opacity={famU}>
            {FAMILIES.map((fam, k) => {
              const xs = [560, 628, 728, 812, 876];
              const lit = clamp01(1 - Math.abs(stP - FAM_AT[k])) + (k === 0 || k === 2 || k === 3 ? clamp01(1 - Math.abs(stP - SCORE_AT[[0, 2, 3].indexOf(k)])) : 0);
              return <Chip key={k} x={xs[k]} y={126} text={fam.name} color={lit > 0.5 ? colors.TEXT : colors.MUTED} stroke={lit > 0.5 ? colors.ACCENT : colors.GRID} opacity={0.45 + 0.55 * clamp01(lit)} />;
            })}
          </g>
        )}
        {v(scene.ctrU) > 0.005 && (
          <g opacity={v(scene.ctrU) * (1 - end * 0.85)}>
            <Chip x={VP.x + VP.w} y={126} anchor="end" text="new operations: 0" color={colors.POSITIVE} size={14} stroke={v(scene.ctrGlow) > 0.5 ? colors.POSITIVE : colors.GRID} />
            {v(scene.ctrGlow) > 0.005 && (
              <rect x={VP.x + VP.w - (17 * CH14 + 20) - 5} y={104} width={17 * CH14 + 30} height={36} rx={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={v(scene.ctrGlow) * 0.7} />
            )}
          </g>
        )}
        <g opacity={v(scene.printU)}>
          {v(scene.printU) > 0.005 && (
            <text x={VP.x} y={592} fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
              recompilations between families: 0 new operations (same tensor program object)
            </text>
          )}
        </g>
        {/* context chip, under the viewport */}
        <Chip x={VP.x + VP.w} y={594} anchor="end" text={`context (held aside): viewportWidth ${CONTEXT.viewportWidth} · viewportHeight ${CONTEXT.viewportHeight}`} opacity={v(scene.ctxU) * lerp(1, WHISPER, tokSpot)} color={v(scene.ctxGlow) > 0.3 ? colors.TEXT : colors.MUTED} stroke={v(scene.ctxGlow) > 0.3 ? colors.WARM : colors.GRID} />

        {/* wrap chain over the filmstrip */}
        {chainU > 0.005 && (
          <g>
            {Array.from({ length: SLOTS - 1 }, (_, k) => {
              const cu = staggerU(chainU, k, SLOTS - 1, 0.12, 0.3);
              if (cu <= 0) return null;
              const R = FAM_RECTS[4].rects;
              const x1 = vx(R[k][0] + R[k][2] / 2);
              const x2 = vx(R[k + 1][0] + R[k + 1][2] / 2);
              const y1 = vy(R[k][1]) - 3;
              return (
                <g key={k} opacity={cu}>
                  <path d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 - 22} ${x2 - 3} ${y1 - 2}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  <polygon points={`${x2 - 1},${y1} ${x2 - 9},${y1 - 3} ${x2 - 4},${y1 - 9}`} fill={colors.WARM} />
                </g>
              );
            })}
            <text x={VP.x} y={VP.y + VP.h + 28} fontSize={14} fill={colors.WARM} opacity={clamp01(chainU * 3)}>
              each wrap reads the cursor the slot before it left: a 16-step chain
            </text>
          </g>
        )}

        {/* ================= the dial bank: 72 cells ================= */}
        {bankOp > 0.005 && (
          <g opacity={bankOp} transform={`translate(${bankDx} 0)`}>
            <text x={BANK.x} y={108} fontSize={17} fill={colors.TEXT} opacity={titleOp}>
              the field vector
            </text>
            <MathLabel tex={'72 = 8 + 16\\times 4'} x={196} y={102} fontSize={20} anchor="start" boxWidth={240} color={colors.WARM} opacity={v(scene.eqU) * titleOp} />
            <text x={BANK.x} y={133} fontSize={13} fill={colors.MUTED} opacity={v(scene.knobLbl) * mxHide * focusOp(fv, { kind: 'knob', k: 0 })}>
              8 global knobs
            </text>
            {KNOBS.map((kn, k) => {
              const y = KNOB_Y + k * KNOB_P;
              const op = focusOp(fv, { kind: 'knob', k }) * mxHide;
              const val = F[k];
              const norm = clamp01((val - kn.min) / (kn.max - kn.min)) * knobFill(k);
              return (
                <g key={k} opacity={op}>
                  <text x={KNOB_LBL} y={y + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={staggerU(v(scene.knobLbl), k, 8, 0.08, 0.4)}>
                    {kn.name}
                  </text>
                  <rect x={KNOB_BAR.x} y={y - 5} width={KNOB_BAR.w} height={10} rx={3} fill={FAINT} />
                  <rect x={KNOB_BAR.x} y={y - 5} width={KNOB_BAR.w * norm} height={10} rx={3} fill={colors.MUTED} />
                  {knobFill(k) > 0.5 && (
                    <text x={KNOB_BAR.x + KNOB_BAR.w + 10} y={y + 4.5} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                      {trim(val, k === 2 ? 4 : 3)}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={BANK.x} y={339} fontSize={13} fill={colors.MUTED} opacity={v(scene.slotLbl) * mxHide * focusOp(fv, { kind: 'title' })}>
              16 slots × 4 fields · slotCount = 16 · each 0 to 1
            </text>
            {Array.from({ length: SLOTS }, (_, sl) => (
              <text key={sl} x={COL_X(sl) + CELL_W / 2} y={358} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.slotLbl) * focusOp(fv, { kind: 'col', s: sl })}>
                {sl}
              </text>
            ))}
            {SLOT_FIELDS.map((name, k) => (
              <text key={name} x={ROW_LBL} y={CELL_Y + k * CELL_P + CELL_H / 2 + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={FIELD_COLOR[k]} opacity={v(scene.slotLbl) * focusOp(fv, { kind: 'row', f: k })}>
                {name}
              </text>
            ))}
            {Array.from({ length: SLOTS }, (_, sl) =>
              SLOT_FIELDS.map((_, k) => {
                const x = COL_X(sl);
                const y = CELL_Y + k * CELL_P;
                const val = clamp01(F[fi(sl, k)]) * fillOf(sl, k);
                const op = focusOp(fv, { kind: 'cell', s: sl, f: k });
                return (
                  <g key={`${sl}-${k}`} opacity={op}>
                    <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={2} fill={FAINT} stroke={colors.GRID} />
                    <rect x={x} y={y + CELL_H * (1 - val)} width={CELL_W} height={CELL_H * val} rx={2} fill={FIELD_COLOR[k]} fillOpacity={0.85} />
                  </g>
                );
              }),
            )}
            {/* tie beat: slot 2 and 12's order-key cells ringed */}
            {tieU > 0.005 &&
              [2, 12].map((sl) => (
                <rect key={sl} x={COL_X(sl) - 3} y={CELL_Y + CELL_P - 3} width={CELL_W + 6} height={CELL_H + 6} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={tieU} />
              ))}
            {/* hero beat: slot 0's importance cell ringed */}
            {heroGlow > 0.005 && <rect x={COL_X(0) - 3} y={CELL_Y - 3} width={CELL_W + 6} height={CELL_H + 6} rx={4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={heroGlow} />}
            {/* slot 3 callout: its four values */}
            {v(scene.callU) > 0.005 && (
              <g opacity={v(scene.callU)}>
                <rect x={COL_X(3) - 4} y={CELL_Y - 6} width={CELL_W + 8} height={CELL_P * 3 + CELL_H + 12} rx={5} fill="none" stroke={colors.WARM} strokeWidth={1.8} />
                <rect x={COL_X(4) + 2} y={CELL_Y - 4} width={118} height={CELL_P * 3 + CELL_H + 8} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                {[S3.imp, S3.key, S3.vis, S3.hp].map((val, k) => (
                  <text key={k} x={COL_X(4) + 14} y={CELL_Y + k * CELL_P + CELL_H / 2 + 5} fontSize={14} fontFamily={MONO} fill={FIELD_COLOR[k]} opacity={clamp01(fill3 - k)}>
                    {trim(val)}
                  </text>
                ))}
              </g>
            )}
            {v(scene.bankGlow) > 0.005 && (
              <rect x={BANK.x - 12} y={CELL_Y - 34} width={BANK.w + 6} height={CELL_P * 3 + CELL_H + 44} rx={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={v(scene.bankGlow) * 0.8} />
            )}
            <text x={BANK.x} y={588} fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.branchU)}>
              16 slots, one shared sub-circuit · no per-slot branch
            </text>
            <text x={BANK.x} y={588} fontSize={13} fontFamily={MONO} fill={colors.WARM} opacity={v(scene.editU)}>
              illustrative edit: slot12.orderKey = slot2.orderKey
            </text>

            {/* ---- beat 5: the pair-comparison matrix over the knob block ---- */}
            {v(scene.mxU) > 0.005 && (
              <g opacity={clamp01(v(scene.mxU) * 3)}>
                <rect x={BANK.x - 8} y={88} width={BANK.w + 36} height={260} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={BANK.x} y={110} fontSize={14} fill={colors.TEXT}>
                  every pair of keys compared: {PAIRS} bits
                </text>
                {Array.from({ length: SLOTS }, (_, i) =>
                  Array.from({ length: SLOTS }, (_, j) => {
                    const cu = staggerU(v(scene.mxU), i * SLOTS + j, 256, 0.003, 0.25);
                    if (cu <= 0) return null;
                    const val = lerp(MX_D[i][j], MX_E[i][j], clamp01(stP - 2));
                    const isTie = (i === 12 && j === 2) || (i === 2 && j === 12);
                    return (
                      <rect
                        key={`${i}-${j}`}
                        x={COL_X(j)}
                        y={MX.y + i * MX.p}
                        width={CELL_W}
                        height={MX.h}
                        rx={1.5}
                        fill={i === j ? 'none' : colors.SECONDARY}
                        fillOpacity={i === j ? 0 : 0.1 + 0.8 * val}
                        stroke={isTie && tieU > 0.05 ? colors.WARM : 'none'}
                        strokeWidth={2}
                        opacity={cu}
                      />
                    );
                  }),
                )}
                {MX_ROWS.map((i) => {
                  const rank = Math.round(lerp(L_MOSAIC.rank[i], L_EDIT.rank[i], clamp01(stP - 2)));
                  return (
                    <g key={i} fontSize={12} fontFamily={MONO} fill={i === 12 || i === 2 ? colors.TEXT : colors.MUTED}>
                      <text x={ROW_LBL} y={MX.y + i * MX.p + 10} textAnchor="end">
                        slot {i}
                      </text>
                      <text x={COL_X(15) + CELL_W + 6} y={MX.y + i * MX.p + 10}>
                        rank {rank}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ================= beat 4: the size formulas over the viewport ================= */}
        {v(scene.fmU) > 0.005 && (
          <g opacity={v(scene.fmU)}>
            <rect x={572} y={300} width={656} height={256} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={592} y={330} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
              slot 3 · importance {trim(S3.imp)} · heightPreference {trim(S3.hp)} · mosaic knobs
            </text>
            <MathLabel tex={'\\mathrm{raw}=\\mathrm{baseSpan}+\\mathrm{spanFromImportance}\\cdot\\mathrm{importance}'} x={592} y={366} fontSize={18} anchor="start" boxWidth={470} opacity={v(scene.fm1)} />
            <MathLabel tex={`\\phantom{\\mathrm{raw}}=${trim(F_MOSAIC[4])}+${trim(F_MOSAIC[5])}\\cdot ${trim(S3.imp)}=${trim(S3_RAW)}`} x={592} y={398} fontSize={18} anchor="start" boxWidth={470} opacity={v(scene.fm1)} color={colors.ACCENT} />
            <MathLabel tex={`\\mathrm{span}=\\mathrm{raw}-\\mathrm{relu}(\\mathrm{raw}-1)=${trim(S3_SPAN)}`} x={592} y={440} fontSize={18} anchor="start" boxWidth={470} opacity={v(scene.fm2)} color={colors.ACCENT} />
            <MathLabel tex={'\\mathrm{height}=(\\mathrm{baseHeight}+\\mathrm{heightFromImportance}\\cdot\\mathrm{importance})'} x={592} y={486} fontSize={17} anchor="start" boxWidth={620} opacity={v(scene.fm3)} />
            <MathLabel tex={`\\qquad\\cdot\\,(0.5+\\mathrm{heightPreference})=(${trim(F_MOSAIC[6])}+${trim(F_MOSAIC[7])}\\cdot ${trim(S3.imp)})\\cdot ${trim(0.5 + S3.hp)}=${trim(S3_H, 2)}\\ \\mathrm{px}`} x={592} y={522} fontSize={17} anchor="start" boxWidth={620} opacity={v(scene.fm3)} color={colors.TEAL} />
            {/* the hinge: span against raw, capped at one full row */}
            {v(scene.hingeU) > 0.005 && (
              <g opacity={clamp01(v(scene.hingeU) * 2)}>
                {(() => {
                  const hx = (r: number) => 1080 + r * 85;
                  const hy = (sp: number) => 440 - sp * 80;
                  const len = 85 * Math.SQRT2 + 0.6 * 85;
                  return (
                    <>
                      <line x1={hx(0)} y1={hy(0)} x2={hx(1.6)} y2={hy(0)} stroke={colors.MUTED} strokeWidth={1.2} />
                      <line x1={hx(0)} y1={hy(0)} x2={hx(0)} y2={hy(1.25)} stroke={colors.MUTED} strokeWidth={1.2} />
                      <line x1={hx(0)} y1={hy(1)} x2={hx(1.6)} y2={hy(1)} stroke={colors.GRID} strokeDasharray="3 3" />
                      <path d={`M ${hx(0)} ${hy(0)} L ${hx(1)} ${hy(1)} L ${hx(1.6)} ${hy(1)}`} fill="none" stroke={colors.SECONDARY} strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - v(scene.hingeU))} strokeLinejoin="round" />
                      <circle cx={hx(S3_RAW)} cy={hy(S3_SPAN)} r={5} fill={colors.ACCENT} opacity={v(scene.fm2)} />
                      <text x={hx(1.6)} y={hy(0) + 17} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>raw</text>
                      <text x={hx(0) + 6} y={hy(1.25) + 2} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>span</text>
                      <text x={hx(1)} y={hy(1) - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.SECONDARY}>cap 1</text>
                    </>
                  );
                })()}
              </g>
            )}
          </g>
        )}

        {/* ================= beat 10: the compiled program's size ================= */}
        {statsU > 0.005 && (
          <g opacity={statsU}>
            <text x={BANK.x} y={112} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              the compiled program · printed run
            </text>
            <text x={BANK.x} y={170} fontSize={44} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              {commas(OPS.total * opsU)}
            </text>
            <text x={BANK.x + 160} y={170} fontSize={18} fill={colors.MUTED}>
              operations
            </text>
            {(() => {
              const W = 470;
              const parts = [
                { n: OPS.affine, label: 'affine', c: colors.ACCENT },
                { n: OPS.reglu, label: 'reglu', c: colors.SECONDARY },
                { n: OPS.boolean, label: 'boolean', c: colors.WARM },
              ];
              let x = BANK.x;
              return (
                <g opacity={clamp01(mixU * 2)}>
                  {parts.map((p, k) => {
                    const w = (W * p.n) / OPS.total;
                    const el = <rect key={k} x={x} y={190} width={Math.max(0, w * clamp01(mixU * 1.2 - k * 0.1) - 1)} height={16} fill={p.c} />;
                    x += w;
                    return el;
                  })}
                  {parts.map((p, k) => (
                    <g key={`l${k}`}>
                      <rect x={BANK.x + k * 160} y={220} width={10} height={10} fill={p.c} />
                      <text x={BANK.x + k * 160 + 16} y={230} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                        {p.n} {p.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
            <g opacity={clamp01(layersU * 3)}>
              <text x={BANK.x} y={300} fontSize={44} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                {OPS.layers}
              </text>
              <text x={BANK.x + 90} y={300} fontSize={18} fill={colors.MUTED}>
                layers, run one after another
              </text>
              {Array.from({ length: OPS.layers }, (_, k) =>
                k / OPS.layers <= layersU ? <line key={k} x1={BANK.x + k * (470 / OPS.layers)} y1={318} x2={BANK.x + k * (470 / OPS.layers)} y2={346} stroke={colors.MUTED} strokeWidth={1} opacity={0.7} /> : null,
              )}
              <text x={BANK.x} y={366} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                one tick per layer
              </text>
            </g>
          </g>
        )}

        {/* ================= beat 11: fitness per family ================= */}
        {scoreU > 0.005 && (
          <g opacity={scoreU}>
            <text x={BANK.x} y={112} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              fitness per family · printed run
            </text>
            {FAMILIES.map((fam, k) => {
              const y0 = 140 + k * 84;
              const ru = staggerU(v(scene.rowsU), k, 5, 0.2, 0.5);
              const focusK = [-1, 0, 2, 3][Math.round(scoreFocus)] ?? -1;
              const lit = scoreFocus < 0.5 ? 1 : lerp(1, k === focusK ? 1 : 0.15, clamp01(scoreFocus));
              return (
                <g key={k} opacity={ru * lit}>
                  <text x={BANK.x} y={y0 + 26} fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
                    {fam.name}
                  </text>
                  {fam.name === 'list' && (
                    <text x={BANK.x} y={y0 + 48} fontSize={13} fontFamily={MONO} fill={colors.WARM}>
                      visible 6 of 16
                    </text>
                  )}
                  <Thumb x={150} y={y0} k={0.055} L={FAM_RECTS[k]} />
                  <rect x={240} y={y0 + 14} width={200} height={14} rx={3} fill={FAINT} />
                  <rect x={240} y={y0 + 14} width={200 * fam.fitness * ru} height={14} rx={3} fill={k === focusK ? colors.WARM : colors.ACCENT} />
                  <text x={452} y={y0 + 27} fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                    {fam.fitness.toFixed(3)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ================= beat 12: recap on an opaque panel ================= */}
        {recapU > 0.005 && (
          <g opacity={recapU}>
            <rect x={230} y={196} width={820} height={262} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={252} textAnchor="middle" fontSize={28} fill={colors.TEXT}>
              one program · five layouts · set only by numbers
            </text>
            {FAMILIES.map((fam, k) => (
              <g key={k}>
                <Thumb x={268 + k * 152} y={286} k={0.06} L={FAM_RECTS[k]} />
                <text x={268 + k * 152 + 38} y={358} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  {fam.name}
                </text>
              </g>
            ))}
            <text x={640} y={420} textAnchor="middle" fontSize={17} fill={colors.MUTED} opacity={v(scene.nextU)}>
              next: can those numbers be found automatically, and are they any good?
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip + source chip ================= */}
      <rect x={40} y={18} width={300} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Seventy-Two Numbers, One Program
      </text>
      <rect x={40} y={50} width={chip.length * CH13 + 20} height={21} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={50} y={65} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {chip}
      </text>
    </>
  );
}

export const vizScene = () => scene;
