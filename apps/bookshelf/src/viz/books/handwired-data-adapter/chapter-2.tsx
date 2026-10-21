// 868 Programs, Twelve Scenes
//
// Data Adapter — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/data-adapter/README.md:3, 23-31 (the vocabulary, 7 × 4 × (1 + 5 + 25) = 868, built and run, no heuristic)
//   lab/data-adapter/README.md:33-46 (eight targets from native find + FP32 arithmetic; the unique programs;
//     "None of the fitting programs omits either predicate."), 66 (12 training scenes, 997 pairs, ~60 ms,
//     "not a controlled performance benchmark")
//   lab/data-adapter/experiment.ts:8-11 (FIELDS, PREDICATES, STEPS, TASKS), 57-79 (oracle), 81-103
//     (enumeratePrograms), 121-162 (compileLookup), 164-187 (buildAdapter), 204-226 (synthesize, early
//     rejection at :219), 228-263 (makeScene, trainingScenes), 331-334 (describe)
//   lab/data-adapter/report.ts:28-33 (circuitEvaluations, solutions, controls)
//   src/runtime/numeric-ui-core.ts:418-443 (roundAffine, multiply, select: what the literal interpreter mirrors)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every number on screen is computed below at module scope: the twelve
// training scenes are regenerated with the lab's own LCG, the 868 programs are enumerated in the lab's
// order and run by a literal interpreter of the circuit's semantics (integer geometry, so every FP32 step
// is exact), and the survivor trace, per-task counts, per-candidate run counts (sum 997), survivor strings
// and both controls are derived from that run and checked against the lab's published figures. Following
// review.md, the curve holds at 11 from scene 2 through scene 6 (plan.md beat 10 said "scenes 3-6").
import { scaleLinear } from 'd3';
import 'katex/dist/katex.min.css';
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
const CH14 = 8.4; // mono advance at 14 px
const DEAD = 0.1; // a rejected program's cell: a whisper
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The lab, re-run literally (experiment.ts), exact for its integer training data
// ---------------------------------------------------------------------------

const CAPACITY = 12;
const FIELDS = ['left', 'top', 'width', 'height'] as const;
const PREDICATES = ['active', 'same-id', 'first-slot'] as const;
const STEPS = ['add-width', 'add-height', 'subtract-origin-x', 'subtract-origin-y', 'multiply-scale'] as const;
const TASKS = ['left', 'top', 'right', 'bottom', 'local-left', 'local-top', 'scaled-right', 'scaled-bottom'] as const;
type Field = (typeof FIELDS)[number];
type Predicate = (typeof PREDICATES)[number];
type Step = (typeof STEPS)[number];
type Task = (typeof TASKS)[number];
type Slot = { active: boolean; id: number; left: number; top: number; width: number; height: number };
type LabScene = { slots: Slot[]; selectedID: number; originX: number; originY: number; scale: number; activeCount: number; absent: boolean };
type Program = { predicates: Predicate[]; field: Field; steps: Step[] };
const f32 = Math.fround;

/** experiment.ts:228-253, integer branch (training never uses fractional geometry) */
function makeScene(seed: number, activeCount: number, absent: boolean): LabScene {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const coordinate = () => Math.floor(random() * 201) - 100;
  const size = () => 1 + Math.floor(random() * 70);
  const baseID = seed * 20;
  const selectedID = absent || activeCount === 0 ? baseID + 19 : baseID + Math.floor(random() * activeCount);
  const slots = Array.from({ length: CAPACITY }, (_, index): Slot => ({
    active: index < activeCount,
    id: index < activeCount ? baseID + index : selectedID,
    left: coordinate(), top: coordinate(), width: size(), height: size(),
  }));
  for (let index = slots.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [slots[index], slots[other]] = [slots[other], slots[index]];
  }
  return { slots, selectedID, originX: coordinate(), originY: coordinate(), scale: [2, -3, 1][seed % 3], activeCount, absent };
}

/** experiment.ts:255-263 */
const TRAINING: LabScene[] = [];
for (const seed of [1, 2]) for (const count of [1, 2, 3]) for (const absent of [false, true]) TRAINING.push(makeScene(seed, count, absent));

/** experiment.ts:57-79: native find, separately written FP32 arithmetic */
function oracle(scene: LabScene, task: Task): { found: number; value: number } {
  const r = scene.slots.find((slot) => slot.active && slot.id === scene.selectedID);
  if (r === undefined) return { found: 0, value: 0 };
  const [left, top, width, height] = [f32(r.left), f32(r.top), f32(r.width), f32(r.height)];
  const [ox, oy, k] = [f32(scene.originX), f32(scene.originY), f32(scene.scale)];
  const value = {
    left, top,
    right: f32(left + width), bottom: f32(top + height),
    'local-left': f32(f32(left - ox) * k), 'local-top': f32(f32(top - oy) * k),
    'scaled-right': f32(f32(left + width) * k), 'scaled-bottom': f32(f32(top + height) * k),
  }[task];
  return { found: 1, value: value === 0 ? 0 : value };
}

/** experiment.ts:81-103, same order: masks × fields × sequences */
const MASKS: Predicate[][] = [[]];
for (let a = 0; a < PREDICATES.length; a++) {
  MASKS.push([PREDICATES[a]]);
  for (let b = a + 1; b < PREDICATES.length; b++) MASKS.push([PREDICATES[a], PREDICATES[b]]);
}
const SEQUENCES: Step[][] = [[]];
for (const a of STEPS) {
  SEQUENCES.push([a]);
  for (const b of STEPS) SEQUENCES.push([a, b]);
}
const PROGRAMS: Program[] = [];
for (const predicates of MASKS) for (const field of FIELDS) for (const steps of SEQUENCES) PROGRAMS.push({ predicates, field, steps });
const N = PROGRAMS.length;

/** compileLookup + buildAdapter (experiment.ts:121-187) as plain arithmetic: bits are exact 0/1 products,
 *  found = count − relu(count − 1), a read sums bit × field, the answer is select(found, 0, value). */
function run(p: Program, scene: LabScene): { found: number; value: number } {
  const bits = scene.slots.map((slot, i) =>
    p.predicates.reduce((bit, q) => bit * (q === 'active' ? Number(slot.active) : q === 'first-slot' ? Number(i === 0) : Number(slot.id === scene.selectedID)), 1),
  );
  const count = bits.reduce((a, b) => a + b, 0);
  const found = count - Math.max(0, count - 1);
  const read = (field: Field) => f32(bits.reduce((sum, bit, i) => sum + bit * scene.slots[i][field], 0));
  let value = read(p.field);
  for (const step of p.steps) {
    if (step === 'add-width') value = f32(value + read('width'));
    else if (step === 'add-height') value = f32(value + read('height'));
    else if (step === 'subtract-origin-x') value = f32(value - scene.originX);
    else if (step === 'subtract-origin-y') value = f32(value - scene.originY);
    else value = f32(value * scene.scale);
  }
  return { found, value: found * value };
}

/** experiment.ts:331-334 */
const describe = (p: Program): string =>
  `${p.predicates.length === 0 ? 'all slots' : p.predicates.join(' & ')} -> read ${p.field}${p.steps.map((s) => ` -> ${s}`).join('')}`;

// the search, scene by scene: possible[program][task] after each training scene
const TARGETS = TRAINING.map((scene) => TASKS.map((t) => oracle(scene, t)));
const POSSIBLE = PROGRAMS.map(() => TASKS.map(() => true));
/** killedAt[c]: the 1-based scene that leaves program c matching no task (13 = survives all twelve) */
const KILLED_AT = PROGRAMS.map(() => 13);
const ANY_ALIVE: number[] = [];
const PER_TASK: number[][] = [];
TRAINING.forEach((scene, s) => {
  PROGRAMS.forEach((p, c) => {
    const out = run(p, scene);
    TASKS.forEach((_, t) => {
      POSSIBLE[c][t] = POSSIBLE[c][t] && out.found === TARGETS[s][t].found && out.value === TARGETS[s][t].value;
    });
    if (KILLED_AT[c] === 13 && !POSSIBLE[c].some(Boolean)) KILLED_AT[c] = s + 1;
  });
  ANY_ALIVE.push(POSSIBLE.filter((row) => row.some(Boolean)).length);
  PER_TASK.push(TASKS.map((_, t) => POSSIBLE.filter((row) => row[t]).length));
});
/** early rejection (experiment.ts:219): a program runs on scenes until none of its tasks is left */
const RUNS = KILLED_AT.map((k) => Math.min(k, 12));
const EVALUATIONS = RUNS.reduce((a, b) => a + b, 0);
const RUN_GROUPS = [...new Set(RUNS)].sort((a, b) => a - b).map((r) => ({ runs: r, n: RUNS.filter((x) => x === r).length }));
const SURVIVORS = TASKS.map((_, t) => PROGRAMS.findIndex((_, c) => POSSIBLE[c][t]));
const SOLUTIONS = SURVIVORS.map((c) => describe(PROGRAMS[c]));
const SELECTOR = 'active & same-id';
const FIT_PAIRS = TASKS.flatMap((_, t) => PROGRAMS.filter((_, c) => POSSIBLE[c][t]));
const WITHOUT_ACTIVE = FIT_PAIRS.filter((p) => !p.predicates.includes('active')).length;
const WITHOUT_ID = FIT_PAIRS.filter((p) => !p.predicates.includes('same-id')).length;
const TRACE = [N, ...ANY_ALIVE];

// the lab's published figures (README.md:31, 66; report.ts; review.md's re-derived trace)
const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
if (
  N !== 868 || MASKS.length !== 7 || SEQUENCES.length !== 31 || EVALUATIONS !== 997 ||
  !same(ANY_ALIVE, [34, 11, 11, 11, 11, 11, 8, 8, 8, 8, 8, 8]) ||
  !same(PER_TASK[0], [2, 4, 8, 2, 4, 4, 4, 6]) || !same(PER_TASK[1], [1, 2, 3, 1, 1, 1, 1, 1]) ||
  !PER_TASK[6].every((n) => n === 1) || WITHOUT_ACTIVE !== 0 || WITHOUT_ID !== 0 ||
  !SOLUTIONS.every((s) => s.startsWith(`${SELECTOR} -> `))
) {
  throw new Error('data-adapter ch2: literal search disagrees with the lab');
}
const TAILS = SOLUTIONS.map((s) => s.slice(SELECTOR.length + 4));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the program wall: 7 row-test subsets (rows) × 4 fields (columns); each block is one cell for no steps,
// a column of 5 one-step cells, and a 5×5 grid of two-step cells (row = first step, column = second)
const CELL = 10;
const PITCH = 12;
const GAP = 4;
const BW = 2 * PITCH + 2 * GAP + 5 * PITCH - 2; // 90
const BH = 5 * PITCH - 2; // 58
const BGX = 18;
const BGY = 12;
const WALL_X = 270;
const WALL_Y = 124;
const WALL_W = 4 * BW + 3 * BGX;
const WALL_H = 7 * BH + 6 * BGY;
const blockX = (field: number) => WALL_X + field * (BW + BGX);
const blockY = (mask: number) => WALL_Y + mask * (BH + BGY);
/** where sequence s sits inside a block of the given pitch/gap */
function seqCell(s: number, pitch: number, gap: number): { x: number; y: number; group: number } {
  if (s === 0) return { x: 0, y: 2 * pitch, group: 0 };
  const a = Math.floor((s - 1) / 6);
  const r = (s - 1) % 6;
  if (r === 0) return { x: pitch + gap, y: a * pitch, group: 1 };
  return { x: 2 * pitch + 2 * gap + (r - 1) * pitch, y: a * pitch, group: 2 };
}
const CELLS = PROGRAMS.map((_, c) => {
  const mask = Math.floor(c / (4 * 31));
  const field = Math.floor(c / 31) % 4;
  const s = c % 31;
  const p = seqCell(s, PITCH, GAP);
  const x = blockX(field) + p.x;
  return { mask, field, s, group: p.group, x, y: blockY(mask) + p.y, xf: (x - WALL_X) / WALL_W };
});
const MASK_LABEL = MASKS.map((m) => (m.length === 0 ? 'all slots' : m.join(' & ')));
const DEMO_MASK = MASKS.findIndex((m) => m.join(' & ') === SELECTOR); // the block magnified in beat 4
const DEMO_FIELD = 0;

// the right panel
const RX = 740;
const TEMPLATE = { y: 56, h: 34, rows: [740, 845], read: 856, field: [936, 1030], arrow: 1042, steps: [1074, 1204] };
const CHIP_Y = { pred: 146, field: 212 };
const PRED_CHIPS = PREDICATES.map((p, i) => ({ text: p, x: [740, 822, 913][i] }));
const FIELD_CHIPS = FIELDS.map((f, i) => ({ text: f, x: 740 + i * 82 }));
const MAG = { x: 1036, y: 318, pitch: 26, gap: 8, cell: 22 };
const MAG_W = 2 * MAG.pitch + 2 * MAG.gap + 5 * MAG.pitch - 4;

// scene tokens: each a 3 × 4 rack of the scene's twelve storage slots, in storage order
const TOK = { x: 762, pitch: 40, y: 98, cell: 8, cp: 10 };
const tokX = (i: number) => TOK.x + i * TOK.pitch;

// survivor curve (log scale: 868 → 8 spans two decades)
const CX = (k: number) => 772 + k * 36;
const CY = scaleLinear([Math.log10(5), Math.log10(1000)], [370, 230]);
const cy = (v: number) => CY(Math.log10(v));

// task lanes
const LANE_Y0 = 436;
const LANE_DY = 23;
const laneY = (i: number) => LANE_Y0 + i * LANE_DY;
const PIP_X = 862;
const ORACLE_FORMULA: Record<Task, string> = {
  left: 'left',
  top: 'top',
  right: 'left + width',
  bottom: 'top + height',
  'local-left': '(left − originX) × scale',
  'local-top': '(top − originY) × scale',
  'scaled-right': '(left + width) × scale',
  'scaled-bottom': '(top + height) × scale',
};

// run-count colours for the early-rejection heat
const RUN_COLOR: Record<number, string> = { 1: '#28476b', 2: '#38bdf8', 7: colors.SECONDARY, 12: colors.WARM };
const runColor = (r: number) => RUN_COLOR[r] ?? colors.MUTED;

// controls: which wall rows lack each test
const ROWS_NO_ACTIVE = MASKS.map((m, i) => (m.includes('active') ? -1 : i)).filter((i) => i >= 0);
const ROWS_NO_ID = MASKS.map((m, i) => (m.includes('same-id') ? -1 : i)).filter((i) => i >= 0);

const HOME: CameraState = CAMERA_HOME;
const CAM_OPEN: CameraState = { x: 975, y: 150, k: 1.55 };
const CAM_VOCAB: CameraState = { x: 680, y: 345, k: 1.1 };
const CAM_SURV: CameraState = { x: 980, y: 505, k: 1.45 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, ≈139 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  // B1–B5 vocabulary
  const frameU = tl.channel('wallFrame', 0);
  const tmplU = tl.channel('template', 0);
  const tmplOp = tl.channel('templateOp', 1);
  const slotGlow = tl.channel('slotGlow', 0); // 1 rows, 2 field, 3 steps
  const predU = tl.channel('predChips', 0);
  const maskU = tl.channel('maskLabels', 0);
  const fieldU = tl.channel('fieldChips', 0);
  const badgeU = tl.channel('badges', 0); // 0..3, one per slot
  const magU = tl.channel('magBlock', 0);
  const stepLblU = tl.channel('stepLabels', 0);
  const blockU = tl.channel('demoBlockFill', 0); // 0..3: none, singles, pairs
  const sumTexU = tl.channel('texSeq', 0);
  const vocabOp = tl.channel('vocabOp', 1);
  const floodU = tl.channel('flood', 0);
  const texAllU = tl.channel('tex868', 0);
  const buildU = tl.channel('buildChip', 0);
  // B6–B7 targets and scenes
  const laneU = tl.channel('lanes', 0);
  const formulaOp = tl.channel('formulaOp', 1);
  const oracleU = tl.channel('oracleChip', 0);
  const dividerU = tl.channel('divider', 0);
  const tokU = tl.channel('tokens', 0);
  const tokLegend = tl.channel('tokenLegend', 0);
  const tokOp = tl.channel('tokensOp', 1);
  // B8–B10 the sweeps
  const sceneCut = tl.channel('scenesRun', 0);
  const curveU = tl.channel('curveAxes', 0);
  const curveOp = tl.channel('curveOp', 1);
  const pipsU = tl.channel('pips', 0);
  const laneMode = tl.channel('laneMode', 0);
  const laneGlow = tl.channel('laneGlow', 0);
  const survU = tl.channel('survivorsGreen', 0);
  const bracketU = tl.channel('bracket', 0);
  // B11 early rejection
  const heatU = tl.channel('heat', 0);
  const legendU = tl.channel('runLegend', 0);
  const sumRunsU = tl.channel('tex997', 0);
  const barsU = tl.channel('bars', 0);
  const ghostBarU = tl.channel('ghostBar', 0);
  const msU = tl.channel('msNote', 0);
  const rejectOp = tl.channel('rejectOp', 1);
  // B12–B13 survivors and controls
  const wallOp = tl.channel('wallOp', 1);
  const flyU = tl.channel('flyU', 0);
  const strU = tl.channel('programStrings', 0);
  const lanesOp = tl.channel('lanesOp', 1);
  const ctrl1 = tl.channel('control1', 0);
  const ctrl2 = tl.channel('control2', 0);
  const band1 = tl.channel('band1', 0);
  const band2 = tl.channel('band2', 0);
  const scopeU = tl.channel('scope', 0);
  const rowGlow = tl.channel('selectorRow', 0);

  // — B1 · choose three things —
  tl.caption({ at: 0.4, dur: 11.0, text: 'Given example scenes and their right answers, the search must choose three things: which rows to select, which field to read, and which arithmetic steps to apply.' });
  tl.tween(tmplU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(slotGlow, 1, { at: 5.6, dur: 0.4, ease: ease.move });
  tl.tween(slotGlow, 2, { at: 7.4, dur: 0.4, ease: ease.move });
  tl.tween(slotGlow, 3, { at: 8.8, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_VOCAB, { at: 9.6, dur: 1.5, ease: ease.move });
  tl.tween(frameU, 1, { at: 9.9, dur: 1.4, ease: ease.draw });
  tl.hold(11.4, 0.5);

  // — B2 · seven row-test subsets —
  tl.caption({ at: 11.9, dur: 9.4, text: 'Row tests come from three: active, same identifier, and first storage slot. Using none, one, or two, combined by and, gives seven choices.' });
  tl.tween(slotGlow, 1, { at: 11.9, dur: 0.5, ease: ease.move });
  tl.tween(predU, 1, { at: 13.9, dur: 2.4, ease: ease.linear });
  tl.tween(maskU, 1, { at: 17.0, dur: 2.6, ease: ease.linear });
  tl.tween(badgeU, 1, { at: 20.0, dur: 0.5, ease: ease.pop });
  tl.hold(21.3, 0.5);

  // — B3 · four fields —
  tl.caption({ at: 21.8, dur: 5.2, text: 'The field read is one of four: left, top, width, or height.' });
  tl.tween(slotGlow, 2, { at: 21.8, dur: 0.5, ease: ease.move });
  tl.tween(fieldU, 1, { at: 23.2, dur: 2.0, ease: ease.linear });
  tl.tween(badgeU, 2, { at: 26.0, dur: 0.5, ease: ease.pop });
  tl.hold(27.0, 0.5);

  // — B4 · thirty-one step sequences: one block, magnified —
  tl.caption({ at: 27.5, dur: 12.8, text: 'Then zero, one, or two steps from five: add width, add height, subtract origin x, subtract origin y, or multiply by scale. That is one plus five plus twenty-five, thirty-one sequences.' });
  tl.tween(slotGlow, 3, { at: 27.5, dur: 0.5, ease: ease.move });
  tl.tween(magU, 1, { at: 27.9, dur: 0.8, ease: ease.enter });
  tl.tween(stepLblU, 1, { at: 30.6, dur: 5.6, ease: ease.linear });
  tl.tween(blockU, 1, { at: 37.2, dur: 0.5, ease: ease.enter });
  tl.tween(blockU, 2, { at: 37.9, dur: 0.6, ease: ease.enter });
  tl.tween(blockU, 3, { at: 38.6, dur: 0.8, ease: ease.enter });
  tl.tween(sumTexU, 1, { at: 39.0, dur: 0.6, ease: ease.enter });
  tl.tween(badgeU, 3, { at: 39.6, dur: 0.5, ease: ease.pop });
  tl.hold(40.3, 0.5);

  // — B5 · the wall fills: 868 programs, each built and run —
  tl.caption({ at: 40.8, dur: 10.8, text: 'Seven times four times thirty-one is eight hundred sixty-eight programs. Each one is built as a real circuit and run, not scored by a heuristic.' });
  tl.tween(cam, HOME, { at: 40.9, dur: 1.4, ease: ease.move });
  tl.tween(vocabOp, 0, { at: 40.9, dur: 0.8, ease: ease.move });
  tl.tween(tmplOp, 0.15, { at: 40.9, dur: 0.8, ease: ease.move });
  tl.tween(slotGlow, 0, { at: 40.9, dur: 0.6, ease: ease.move });
  tl.tween(floodU, 1, { at: 41.3, dur: 3.0, ease: ease.linear });
  tl.tween(texAllU, 1, { at: 42.6, dur: 0.6, ease: ease.enter });
  tl.tween(buildU, 1, { at: 46.6, dur: 0.6, ease: ease.enter });
  tl.hold(51.6, 0.5);

  // — B6 · eight targets, computed apart from the circuits —
  tl.caption({ at: 52.1, dur: 12.4, text: 'Eight goals: left, top, right, bottom, local left, local top, scaled right, and scaled bottom. Their answers come from a plain find and separate float arithmetic, never from the circuits.' });
  for (const ch of [texAllU, buildU]) tl.tween(ch, 0, { at: 52.1, dur: 0.6, ease: ease.move });
  tl.tween(tmplOp, 0, { at: 52.1, dur: 0.6, ease: ease.move });
  tl.tween(wallOp, 0.35, { at: 52.4, dur: 0.8, ease: ease.move });
  tl.tween(laneU, 1, { at: 53.1, dur: 5.0, ease: ease.linear });
  tl.tween(oracleU, 1, { at: 59.2, dur: 0.7, ease: ease.enter });
  tl.tween(dividerU, 1, { at: 61.6, dur: 1.2, ease: ease.draw });
  tl.hold(64.5, 0.5);

  // — B7 · twelve training scenes —
  tl.caption({ at: 65.0, dur: 7.0, text: 'Training is twelve scenes: one to three active rows, identifiers both present and absent, whole-number geometry.' });
  tl.tween(oracleU, 0, { at: 65.0, dur: 0.6, ease: ease.move });
  tl.tween(dividerU, 0, { at: 65.0, dur: 0.6, ease: ease.move });
  tl.tween(formulaOp, 0.15, { at: 65.0, dur: 0.6, ease: ease.move });
  tl.tween(tokU, 1, { at: 65.4, dur: 2.2, ease: ease.linear });
  tl.tween(tokLegend, 1, { at: 68.6, dur: 0.6, ease: ease.enter });
  tl.hold(72.0, 0.5);

  // — B8 · scene 1 sweeps the wall: 34 left —
  tl.caption({ at: 72.5, dur: 8.4, text: 'After the first scene, thirty-four programs still match at least one task. Right still has eight candidates, left has two.' });
  tl.tween(wallOp, 1, { at: 72.5, dur: 0.6, ease: ease.move });
  tl.tween(formulaOp, 0, { at: 72.5, dur: 0.6, ease: ease.move });
  tl.tween(tokLegend, 0.15, { at: 72.5, dur: 0.6, ease: ease.move });
  tl.tween(curveU, 1, { at: 72.7, dur: 1.2, ease: ease.draw });
  tl.tween(sceneCut, 1, { at: 72.9, dur: 1.8, ease: ease.linear });
  tl.tween(pipsU, 1, { at: 74.7, dur: 0.6, ease: ease.enter });
  tl.set(laneMode, 1, 77.0);
  tl.tween(laneGlow, 1, { at: 77.1, dur: 0.5, ease: ease.enter });
  tl.hold(80.9, 0.5);

  // — B9 · scene 2: six tasks down to one —
  tl.caption({ at: 81.4, dur: 8.4, text: 'After the second scene, six tasks are down to a single candidate. Top has two left, and right has three.' });
  tl.tween(laneGlow, 0, { at: 81.4, dur: 0.4, ease: ease.move });
  tl.tween(sceneCut, 2, { at: 81.6, dur: 1.6, ease: ease.linear });
  tl.set(laneMode, 2, 83.4);
  tl.tween(laneGlow, 1, { at: 83.5, dur: 0.5, ease: ease.enter });
  tl.set(laneMode, 3, 86.7);
  tl.hold(89.8, 0.5);

  // — B10 · scenes 3–12: eight left by scene 7, then nothing —
  tl.caption({ at: 90.3, dur: 7.8, text: 'By the seventh scene exactly eight programs remain, one per task. Scenes eight through twelve eliminate nothing more.' });
  tl.tween(laneGlow, 0, { at: 90.3, dur: 0.4, ease: ease.move });
  tl.tween(sceneCut, 7, { at: 90.5, dur: 2.2, ease: ease.linear });
  tl.tween(survU, 1, { at: 92.6, dur: 0.6, ease: ease.enter });
  tl.set(laneMode, 4, 92.7);
  tl.tween(laneGlow, 1, { at: 92.8, dur: 0.5, ease: ease.enter });
  tl.tween(sceneCut, 12, { at: 94.2, dur: 1.9, ease: ease.linear });
  tl.tween(bracketU, 1, { at: 95.6, dur: 0.7, ease: ease.enter });
  tl.hold(98.1, 0.5);

  // — B11 · early rejection: 997 runs, not 10,416 —
  tl.caption({ at: 98.6, dur: 13.6, text: "Candidates are dropped once no task still matches them, so the search needs nine hundred ninety-seven circuit runs, not ten thousand four hundred sixteen. About sixty milliseconds on the author's machine." });
  tl.tween(laneGlow, 0, { at: 98.6, dur: 0.4, ease: ease.move });
  for (const ch of [tokOp, curveOp]) tl.tween(ch, 0, { at: 98.6, dur: 0.7, ease: ease.move });
  tl.tween(lanesOp, 0.05, { at: 98.6, dur: 0.7, ease: ease.move });
  tl.tween(heatU, 1, { at: 99.2, dur: 1.2, ease: ease.move });
  tl.tween(legendU, 1, { at: 100.0, dur: 1.6, ease: ease.linear });
  tl.tween(sumRunsU, 1, { at: 102.2, dur: 0.6, ease: ease.enter });
  tl.tween(barsU, 1, { at: 104.0, dur: 0.8, ease: ease.enter });
  tl.tween(ghostBarU, 1, { at: 105.8, dur: 1.2, ease: ease.draw });
  tl.tween(msU, 1, { at: 108.4, dur: 0.6, ease: ease.enter });
  tl.hold(112.2, 0.5);

  // — B12 · the eight survivors leave the wall: one selector, eight tails —
  tl.caption({ at: 112.7, dur: 11.8, text: 'Every survivor starts with the same selector, active and same identifier. Right reads left, then adds width. Local left reads left, subtracts origin x, then multiplies by scale.' });
  tl.tween(rejectOp, 0, { at: 112.7, dur: 0.7, ease: ease.move });
  tl.tween(heatU, 0, { at: 112.7, dur: 0.8, ease: ease.move });
  tl.tween(wallOp, 0.12, { at: 112.9, dur: 0.8, ease: ease.move });
  tl.tween(pipsU, 0, { at: 112.9, dur: 0.5, ease: ease.move });
  tl.tween(lanesOp, 1, { at: 112.9, dur: 0.6, ease: ease.move });
  tl.set(laneMode, 5, 113.0);
  tl.tween(flyU, 1, { at: 113.1, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_SURV, { at: 114.0, dur: 1.4, ease: ease.move });
  tl.tween(strU, 1, { at: 114.4, dur: 0.8, ease: ease.enter });
  tl.tween(laneGlow, 1, { at: 115.0, dur: 0.5, ease: ease.enter });
  tl.tween(laneGlow, 0, { at: 116.8, dur: 0.3, ease: ease.move });
  tl.set(laneMode, 6, 117.2);
  tl.tween(laneGlow, 1, { at: 117.3, dur: 0.4, ease: ease.enter });
  tl.tween(laneGlow, 0, { at: 119.6, dur: 0.3, ease: ease.move });
  tl.set(laneMode, 7, 120.0);
  tl.tween(laneGlow, 1, { at: 120.1, dur: 0.4, ease: ease.enter });
  tl.hold(124.5, 0.5);

  // — B13 · controls: drop either test and nothing fits —
  tl.caption({ at: 125.0, dur: 12.0, text: 'Controls: drop the active test and zero programs fit. Drop the same-identifier test and zero fit. Within this vocabulary and these eight authored targets, both tests are needed.' });
  tl.tween(cam, HOME, { at: 125.0, dur: 1.4, ease: ease.move });
  tl.tween(laneGlow, 0, { at: 125.0, dur: 0.4, ease: ease.move });
  tl.tween(lanesOp, 0.12, { at: 125.0, dur: 0.8, ease: ease.move });
  tl.tween(wallOp, 1, { at: 125.2, dur: 0.8, ease: ease.move });
  tl.tween(band1, 1, { at: 125.8, dur: 0.6, ease: ease.enter });
  tl.tween(ctrl1, 1, { at: 126.2, dur: 0.6, ease: ease.enter });
  tl.tween(band1, 0, { at: 129.0, dur: 0.4, ease: ease.move });
  tl.tween(band2, 1, { at: 129.3, dur: 0.6, ease: ease.enter });
  tl.tween(ctrl2, 1, { at: 129.6, dur: 0.6, ease: ease.enter });
  tl.tween(band2, 0, { at: 131.4, dur: 0.5, ease: ease.move });
  tl.tween(scopeU, 1, { at: 131.6, dur: 0.7, ease: ease.enter });
  tl.tween(rowGlow, 1, { at: 134.4, dur: 0.7, ease: ease.enter });
  tl.hold(137.0, 2.5);

  return {
    tl, cam, frameU, tmplU, tmplOp, slotGlow, predU, maskU, fieldU, badgeU, magU, stepLblU, blockU, sumTexU, vocabOp,
    floodU, texAllU, buildU, laneU, formulaOp, oracleU, dividerU, tokU, tokLegend, tokOp, sceneCut, curveU, curveOp,
    pipsU, laneMode, laneGlow, survU, bracketU, heatU, legendU, sumRunsU, barsU, ghostBarU, msU, rejectOp,
    wallOp, flyU, strU, lanesOp, ctrl1, ctrl2, band1, band2, scopeU, rowGlow,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local glyphs
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity, size = 14, glow = 0 }: {
  x: number; y: number; text: string; color: string; opacity: number; size?: number; glow?: number;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (size === 14 ? CH14 : CH13) + 20;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={26} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      {glow > 0.01 && <rect x={x} y={y} width={w} height={26} rx={13} fill={color} opacity={0.18 * glow} />}
      <text x={x + 10} y={y + 18} fontSize={size} fontFamily={MONO} fill={colors.TEXT}>
        {text}
      </text>
    </g>
  );
}

/** Verbatim code chip: mono 13 px, PANEL fill, GRID border, a role-colour stripe. */
function CodeChip({ x, y, lines, stripe, opacity }: { x: number; y: number; lines: string[]; stripe: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  const w = Math.max(...lines.map((l) => l.length)) * CH13 + 30;
  const h = lines.length * 19 + 14;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 22 + i * 19} fontSize={13} fontFamily={MONO} fill={l.startsWith('//') ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
          {l}
        </text>
      ))}
    </g>
  );
}

/** One training scene: its twelve storage slots in order (3 across, 4 down). */
function SceneToken({ x, y, sc, state, opacity }: { x: number; y: number; sc: LabScene; state: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      {sc.slots.map((slot, i) => {
        const cx = x + (i % 3) * TOK.cp;
        const cyy = y + Math.floor(i / 3) * TOK.cp;
        const hit = slot.active && slot.id === sc.selectedID;
        return (
          <rect
            key={i}
            x={cx}
            y={cyy}
            width={TOK.cell}
            height={TOK.cell}
            rx={1.5}
            fill={hit ? colors.WARM : slot.active ? '#38bdf8' : 'none'}
            stroke={slot.active ? 'none' : colors.MUTED}
            strokeOpacity={0.45}
          />
        );
      })}
      {state > 0.01 && (
        <rect x={x - 5} y={y - 5} width={3 * TOK.cp + 8} height={4 * TOK.cp + 8} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.6} opacity={state} />
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

  const vocabOp = v(scene.vocabOp);
  const slotGlow = v(scene.slotGlow);
  const glowFor = (k: number) => clamp01(1 - Math.abs(slotGlow - k));
  const badgeU = v(scene.badgeU);
  const predU = v(scene.predU);
  const maskU = v(scene.maskU);
  const fieldU = v(scene.fieldU);
  const magU = v(scene.magU);
  const blockU = v(scene.blockU);
  const floodU = v(scene.floodU);
  const frameU = v(scene.frameU);

  const cut = v(scene.sceneCut);
  const done = Math.floor(cut + 1e-6); // scenes fully swept
  const sweeping = cut - done > 1e-4 && cut < 12;
  const sweepX = WALL_X - 8 + (cut - done) * (WALL_W + 16);
  const survU = v(scene.survU);
  const heatU = v(scene.heatU);
  const wallOp = v(scene.wallOp);
  const flyU = v(scene.flyU);
  const laneMode = Math.round(v(scene.laneMode));
  const laneGlow = v(scene.laneGlow);
  const lanesOp = v(scene.lanesOp);
  const laneU = v(scene.laneU);
  const pipsU = v(scene.pipsU);
  const strU = v(scene.strU);
  const counts = done >= 1 ? PER_TASK[done - 1] : null;
  const rowGlow = v(scene.rowGlow);

  /** this cell's fill-in (beat 4 fills the magnified block's twin, beat 5 floods the rest) */
  const cellIn = (c: number): number => {
    const C = CELLS[c];
    const demo = C.mask === DEMO_MASK && C.field === DEMO_FIELD ? clamp01(blockU - C.group) : 0;
    return Math.max(demo, clamp01((floodU * (N + 90) - c) / 90));
  };
  /** 0 alive → 1 rejected, swept left to right during the scene that rejects it */
  const deadU = (c: number): number => {
    const k = KILLED_AT[c];
    if (k > 12) return 0;
    return clamp01((cut - (k - 1) - CELLS[c].xf * 0.55) / 0.45);
  };

  // per-lane emphasis: 1 right+left · 2 single-candidate tasks · 3 top+right · 4 all · 5 selector · 6 right · 7 local-left
  const laneHot = (t: number): string | null => {
    const task = TASKS[t];
    const c = counts?.[t] ?? 0;
    if (laneMode === 1) return task === 'right' || task === 'left' ? colors.WARM : null;
    if (laneMode === 2) return c === 1 ? colors.POSITIVE : null;
    if (laneMode === 3) return c === 1 ? colors.POSITIVE : task === 'top' || task === 'right' ? colors.WARM : null;
    if (laneMode === 4) return colors.POSITIVE;
    if (laneMode === 6) return task === 'right' ? colors.WARM : null;
    if (laneMode === 7) return task === 'local-left' ? colors.WARM : null;
    return null;
  };
  const anyHot = laneMode >= 1 && laneMode !== 4 && laneMode !== 5 && laneGlow > 0.01;

  const tokOp = v(scene.tokOp) * v(scene.tokU);
  const curveOp = v(scene.curveOp) * v(scene.curveU);
  const rejectOp = v(scene.rejectOp);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the program wall ================= */}
        <g opacity={wallOp}>
          {/* block frames */}
          {frameU > 0.005 &&
            MASKS.map((_, m) =>
              FIELDS.map((__, fi) => (
                <rect
                  key={`${m}-${fi}`}
                  x={blockX(fi) - 4}
                  y={blockY(m) - 4}
                  width={BW + 8}
                  height={BH + 8}
                  rx={4}
                  fill="none"
                  stroke={colors.MUTED}
                  strokeOpacity={0.3}
                  opacity={staggerU(frameU, m * 4 + fi, 28, 0.03, 0.4)}
                />
              )),
            )}
          {/* the 868 cells */}
          {CELLS.map((C, c) => {
            const u = cellIn(c);
            if (u <= 0.005) return null;
            const r = RUNS[c];
            const dead = deadU(c);
            const isSurv = KILLED_AT[c] > 12;
            const base = isSurv && survU > 0 ? (survU >= 0.999 ? colors.POSITIVE : '#38bdf8') : '#38bdf8';
            const fill = heatU > 0.5 ? runColor(r) : base;
            const op = lerp(lerp(1, DEAD, dead), r === 1 ? 0.55 : 1, heatU);
            return <rect key={c} x={C.x} y={C.y} width={CELL} height={CELL} rx={1.5} fill={fill} opacity={u * op} />;
          })}
          {/* the sweep front */}
          {sweeping && (
            <line x1={sweepX} y1={WALL_Y - 10} x2={sweepX} y2={WALL_Y + WALL_H + 10} stroke="#ffffff" strokeWidth={2} opacity={0.7} />
          )}
          {/* subset labels (rows) and field headers (columns) */}
          {MASK_LABEL.map((label, m) => {
            const u = staggerU(maskU, m, 7, 0.3, 0.5);
            const hot = m === DEMO_MASK && rowGlow > 0.01;
            return (
              <text
                key={m}
                x={WALL_X - 14}
                y={blockY(m) + BH / 2 + 4.5}
                textAnchor="end"
                fontSize={13}
                fontFamily={MONO}
                fill={hot ? colors.WARM : colors.TEXT}
                opacity={Math.max(u, frameU * 0.35)}
              >
                {label}
              </text>
            );
          })}
          {FIELDS.map((fl, fi) => (
            <text
              key={fl}
              x={blockX(fi) + BW / 2}
              y={WALL_Y - 14}
              textAnchor="middle"
              fontSize={13}
              fontFamily={MONO}
              fill={colors.TEXT}
              opacity={Math.max(staggerU(fieldU, fi, 4, 0.4, 0.5), frameU * 0.35)}
            >
              {fl}
            </text>
          ))}
          {/* the selector row, named in the closing beat */}
          {rowGlow > 0.005 && (
            <rect x={WALL_X - 8} y={blockY(DEMO_MASK) - 8} width={WALL_W + 16} height={BH + 16} rx={6} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={rowGlow} />
          )}
          {/* control bands: the rows each control removes */}
          {[
            { rows: ROWS_NO_ACTIVE, u: v(scene.band1) },
            { rows: ROWS_NO_ID, u: v(scene.band2) },
          ].map(({ rows, u }, bi) =>
            u > 0.005
              ? rows.map((m) => (
                  <rect key={`${bi}-${m}`} x={WALL_X - 8} y={blockY(m) - 6} width={WALL_W + 16} height={BH + 12} rx={5} fill={colors.NEGATIVE} fillOpacity={0.08} stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={u} />
                ))
              : null,
          )}
        </g>

        {/* ring on the real block + leader to its magnified twin (beat 4) */}
        {magU * vocabOp > 0.005 && (
          <g opacity={magU * vocabOp}>
            <rect x={blockX(DEMO_FIELD) - 7} y={blockY(DEMO_MASK) - 7} width={BW + 14} height={BH + 14} rx={6} fill="none" stroke="#ffffff" strokeWidth={2} />
            <line x1={blockX(DEMO_FIELD) + BW + 7} y1={blockY(DEMO_MASK) + BH / 2} x2={MAG.x - 156} y2={MAG.y + 64} stroke="#ffffff" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.6} />
          </g>
        )}

        {/* ================= right panel · beats 1–5: the vocabulary ================= */}
        <g opacity={v(scene.tmplU) * v(scene.tmplOp)}>
          <text x={RX} y={TEMPLATE.y - 16} fontSize={13} fill={colors.MUTED}>
            given scenes and their right answers, choose:
          </text>
          {(
            [
              { k: 1, span: TEMPLATE.rows, text: 'rows', badge: '7' },
              { k: 2, span: TEMPLATE.field, text: 'field', badge: '4' },
              { k: 3, span: TEMPLATE.steps, text: 'steps', badge: '31' },
            ] as const
          ).map(({ k, span, text, badge }) => {
            const g = glowFor(k);
            const b = clamp01(badgeU - (k - 1));
            return (
              <g key={k}>
                <rect x={span[0]} y={TEMPLATE.y} width={span[1] - span[0]} height={TEMPLATE.h} rx={7} fill={colors.PANEL} stroke={g > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={g > 0.5 ? 2 : 1.4} />
                <text x={(span[0] + span[1]) / 2} y={TEMPLATE.y + 23} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={g > 0.5 ? colors.WARM : colors.TEXT}>
                  {text}
                </text>
                {b > 0.005 && (
                  <g opacity={vocabOp > 0.5 ? b : 0}>
                    <circle cx={span[1] - 2} cy={TEMPLATE.y - 2} r={12} fill={colors.WARM} />
                    <text x={span[1] - 2} y={TEMPLATE.y + 2.5} textAnchor="middle" fontSize={12} fontFamily={MONO} fontWeight={700} fill="#1a1206">
                      {badge}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          <text x={TEMPLATE.read} y={TEMPLATE.y + 23} fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
            -&gt; read
          </text>
          <text x={TEMPLATE.arrow} y={TEMPLATE.y + 23} fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
            -&gt;
          </text>
        </g>

        <g opacity={vocabOp}>
          {/* B2: three tests, combined by and */}
          {PRED_CHIPS.map((c, i) => (
            <Chip key={c.text} x={c.x} y={CHIP_Y.pred} text={c.text} color={colors.SECONDARY} opacity={staggerU(predU, i, 3, 0.5, 0.4)} />
          ))}
          <text x={RX} y={CHIP_Y.pred + 46} fontSize={13} fill={colors.MUTED} opacity={maskU}>
            none, one or two, combined by and → 7 subsets
          </text>
          {/* B3: four fields */}
          {FIELD_CHIPS.map((c, i) => (
            <Chip key={c.text} x={c.x} y={CHIP_Y.field} text={c.text} color={'#38bdf8'} opacity={staggerU(fieldU, i, 4, 0.4, 0.5)} />
          ))}
          {/* B4: the magnified block — its 31 step sequences */}
          {magU > 0.005 && (
            <g opacity={magU}>
              {Array.from({ length: 31 }, (_, sIdx) => {
                const p = seqCell(sIdx, MAG.pitch, MAG.gap);
                const lit = clamp01(blockU - p.group);
                return (
                  <g key={sIdx}>
                    <rect x={MAG.x + p.x} y={MAG.y + p.y} width={MAG.cell} height={MAG.cell} rx={3} fill="none" stroke={colors.MUTED} strokeOpacity={0.5} />
                    {lit > 0.005 && <rect x={MAG.x + p.x} y={MAG.y + p.y} width={MAG.cell} height={MAG.cell} rx={3} fill="#38bdf8" opacity={lit} />}
                  </g>
                );
              })}
              {STEPS.map((st, i) => (
                <text key={st} x={MAG.x - 10} y={MAG.y + i * MAG.pitch + 16} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={staggerU(v(scene.stepLblU), i, 5, 1.05, 0.5)}>
                  {`${i + 1} ${st}`}
                </text>
              ))}
              {[1, 2, 3, 4, 5].map((n, i) => (
                <text key={n} x={MAG.x + 2 * MAG.pitch + 2 * MAG.gap + i * MAG.pitch + MAG.cell / 2} y={MAG.y - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                  {n}
                </text>
              ))}
              <text x={MAG.x + 2 * MAG.pitch + 2 * MAG.gap + 2.5 * MAG.pitch - 2} y={MAG.y - 26} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
                first (row), then second
              </text>
              {[
                { x: MAG.x + MAG.cell / 2, n: '1', g: 0 },
                { x: MAG.x + MAG.pitch + MAG.gap + MAG.cell / 2, n: '5', g: 1 },
                { x: MAG.x + 2 * MAG.pitch + 2 * MAG.gap + 2.5 * MAG.pitch - 2, n: '25', g: 2 },
              ].map(({ x, n, g }) => (
                <text key={n} x={x} y={MAG.y + 5 * MAG.pitch + 20} textAnchor="middle" fontSize={16} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={clamp01(blockU - g)}>
                  {n}
                </text>
              ))}
              <MathLabel tex={'1 + 5 + 25 = 31'} x={MAG.x + MAG_W / 2 - 40} y={MAG.y + 5 * MAG.pitch + 44} fontSize={22} color={colors.WARM} boxWidth={320} opacity={v(scene.sumTexU)} />
            </g>
          )}
        </g>

        {/* B5: the product, and how each program is judged */}
        <MathLabel tex={'7 \\times 4 \\times 31 = 868'} x={985} y={180} fontSize={34} color={colors.TEXT} boxWidth={480} opacity={v(scene.texAllU)} />
        <CodeChip
          x={RX}
          y={290}
          stripe={colors.SECONDARY}
          opacity={v(scene.buildU)}
          lines={['for (const candidate of candidates) {', '  const {circuit, roots} = buildAdapter([candidate])', '  const values = circuit.evaluateReference(example.source)', '// no heuristic, score or fitted coefficient']}
        />

        {/* ================= right panel · beats 6–10: targets, scenes, survivors ================= */}
        {/* B6: the targets come from native find + FP32 arithmetic */}
        {v(scene.dividerU) > 0.005 && (
          <g opacity={v(scene.dividerU)}>
            <line x1={712} y1={250} x2={712} y2={lerp(250, 612, v(scene.dividerU))} stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 5" />
            <text x={724} y={244} fontSize={13} fill={colors.WARM}>
              targets · never from the circuits
            </text>
          </g>
        )}
        <CodeChip
          x={RX + 6}
          y={262}
          stripe={colors.WARM}
          opacity={v(scene.oracleU)}
          lines={['// oracle(scene, task)', 'scene.slots.find(slot => slot.active', '  && slot.id === scene.selectedID)', 'Math.fround(left + width)  // right']}
        />

        {/* B7: twelve training scenes */}
        {tokOp > 0.005 && (
          <g opacity={v(scene.tokOp)}>
            {[0, 1].map((half) => (
              <g key={half} opacity={staggerU(v(scene.tokU), half * 6, 12, 0.15, 0.5)}>
                <line x1={tokX(half * 6) - 4} y1={TOK.y - 14} x2={tokX(half * 6 + 5) + 3 * TOK.cp} y2={TOK.y - 14} stroke={colors.MUTED} strokeOpacity={0.5} />
                <text x={tokX(half * 6) - 4} y={TOK.y - 20} fontSize={12} fill={colors.MUTED}>
                  {`seed ${half + 1}`}
                </text>
              </g>
            ))}
            {TRAINING.map((sc, i) => {
              const u = staggerU(v(scene.tokU), i, 12, 0.15, 0.5);
              const ring = sweeping && Math.ceil(cut) === i + 1 ? 1 : 0;
              const past = cut >= i + 1 - 1e-4;
              const opacity = u * (cut > 0 && !past && !ring ? 0.45 : 1);
              return (
                <g key={i}>
                  <SceneToken x={tokX(i)} y={TOK.y} sc={sc} state={ring} opacity={opacity} />
                  <text x={tokX(i) + 14} y={TOK.y + 4 * TOK.cp + 14} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={past && cut > 0 ? colors.TEXT : colors.MUTED} opacity={u}>
                    {i + 1}
                  </text>
                  <circle cx={tokX(i) + 14} cy={TOK.y + 4 * TOK.cp + 26} r={4} fill={sc.absent ? colors.BG : colors.WARM} stroke={colors.WARM} strokeWidth={1.5} opacity={u} />
                </g>
              );
            })}
            <g opacity={v(scene.tokLegend)} fontSize={12} fill={colors.MUTED}>
              <rect x={RX + 22} y={TOK.y + 74} width={8} height={8} rx={1.5} fill="#38bdf8" />
              <text x={RX + 36} y={TOK.y + 82}>active row</text>
              <rect x={RX + 130} y={TOK.y + 74} width={8} height={8} rx={1.5} fill={colors.WARM} />
              <text x={RX + 144} y={TOK.y + 82}>the selected id</text>
              <circle cx={RX + 270} cy={TOK.y + 78} r={4} fill={colors.WARM} />
              <text x={RX + 280} y={TOK.y + 82}>present</text>
              <circle cx={RX + 352} cy={TOK.y + 78} r={4} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={RX + 362} y={TOK.y + 82}>absent · whole numbers</text>
            </g>
          </g>
        )}

        {/* B8–B10: programs still matching some task, after each scene */}
        {curveOp > 0.005 && (
          <g opacity={curveOp}>
            <text x={RX + 20} y={222} fontSize={13} fill={colors.MUTED}>
              programs still matching a task
            </text>
            <text x={CX(12)} y={222} textAnchor="end" fontSize={12} fill={colors.MUTED}>
              log scale
            </text>
            <line x1={CX(0) - 10} y1={380} x2={lerp(CX(0) - 10, CX(12) + 10, v(scene.curveU))} y2={380} stroke={colors.MUTED} strokeWidth={1.5} />
            {Array.from({ length: 13 }, (_, k) => (
              <text key={k} x={CX(k)} y={396} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={staggerU(v(scene.curveU), k, 13, 0.05, 0.4)}>
                {k}
              </text>
            ))}
            {(() => {
              const pts: string[] = [`${CX(0)},${cy(TRACE[0])}`];
              for (let k = 1; k <= Math.min(12, Math.ceil(cut - 1e-6)); k++) {
                const u = clamp01(cut - (k - 1));
                pts.push(`${lerp(CX(k - 1), CX(k), u)},${lerp(cy(TRACE[k - 1]), cy(TRACE[k]), u)}`);
              }
              return <polyline points={pts.join(' ')} fill="none" stroke={colors.TEXT} strokeWidth={2.5} strokeLinejoin="round" />;
            })()}
            {TRACE.map((n, k) =>
              k <= done ? (
                <circle key={k} cx={CX(k)} cy={cy(n)} r={4.5} fill={k >= 7 && survU > 0.5 ? colors.POSITIVE : colors.TEXT} />
              ) : null,
            )}
            {[
              { k: 0, n: TRACE[0], dx: 10, dy: 4, anchor: 'start' as const },
              { k: 1, n: TRACE[1], dx: 10, dy: -8, anchor: 'start' as const },
              { k: 2, n: TRACE[2], dx: 0, dy: -14, anchor: 'middle' as const },
              { k: 7, n: TRACE[7], dx: 0, dy: 22, anchor: 'middle' as const },
            ].map(({ k, n, dx, dy, anchor }) =>
              k <= done ? (
                <text key={k} x={CX(k) + dx} y={cy(n) + dy} textAnchor={anchor} fontSize={15} fontFamily={MONO} fontWeight={700} fill={k === 7 ? colors.POSITIVE : colors.TEXT}>
                  {commas(n)}
                </text>
              ) : null,
            )}
            {v(scene.bracketU) > 0.005 && (
              <g opacity={v(scene.bracketU)}>
                <path d={`M ${CX(8)} ${cy(8) - 16} L ${CX(8)} ${cy(8) - 22} L ${CX(12)} ${cy(8) - 22} L ${CX(12)} ${cy(8) - 16}`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
                <text x={(CX(8) + CX(12)) / 2} y={cy(8) - 30} textAnchor="middle" fontSize={13} fill={colors.TEXT}>
                  scenes 8–12 remove nothing
                </text>
              </g>
            )}
          </g>
        )}

        {/* B11: early rejection — runs per program before it is dropped */}
        {heatU * rejectOp > 0.005 && (
          <g opacity={rejectOp}>
            <text x={RX} y={118} fontSize={14} fill={colors.TEXT} opacity={v(scene.legendU)}>
              scenes each program ran before rejection
            </text>
            {RUN_GROUPS.map(({ runs, n }, i) => (
              <g key={runs} opacity={staggerU(v(scene.legendU), i, RUN_GROUPS.length, 0.35, 0.5)}>
                <rect x={RX} y={134 + i * 24} width={12} height={12} rx={2} fill={runColor(runs)} />
                <text x={RX + 22} y={145 + i * 24} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                  {`${String(runs).padStart(2, ' ')} ${runs === 1 ? 'scene ' : 'scenes'} · ${String(n).padStart(3, ' ')} programs`}
                </text>
              </g>
            ))}
            <MathLabel
              tex={`${RUN_GROUPS.map(({ runs, n }) => `${n}\\cdot${runs}`).join(' + ')} = ${EVALUATIONS}`}
              x={RX}
              y={252}
              anchor="start"
              fontSize={22}
              color={colors.WARM}
              boxWidth={500}
              opacity={v(scene.sumRunsU)}
            />
            {v(scene.barsU) > 0.005 && (
              <g opacity={v(scene.barsU)}>
                <text x={RX} y={318} fontSize={14} fontFamily={MONO} fill={colors.WARM}>
                  {`${EVALUATIONS} circuit runs`}
                </text>
                <rect x={RX} y={326} width={(480 * EVALUATIONS) / (N * 12)} height={16} rx={3} fill={colors.WARM} />
                <g opacity={v(scene.ghostBarU)}>
                  <text x={RX} y={370} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                    {`${N} × 12 = ${commas(N * 12)} if every program ran every scene`}
                  </text>
                  <rect x={RX} y={378} width={480 * v(scene.ghostBarU)} height={16} rx={3} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
                </g>
              </g>
            )}
            <text x={RX} y={420} fontSize={13} fill={colors.MUTED} opacity={v(scene.msU)}>
              about 60 ms on the author's machine · not a benchmark
            </text>
          </g>
        )}

        {/* ================= task lanes: formula → pips → program ================= */}
        <g opacity={lanesOp}>
          {laneU > 0.005 && (
            <text x={RX - 10} y={LANE_Y0 - 22} fontSize={13} fill={colors.MUTED} opacity={laneU * (1 - strU)}>
              {pipsU > 0.5 ? 'candidates left per task' : 'eight targets'}
            </text>
          )}
          {strU > 0.005 && (
            <g opacity={strU}>
              <text x={PIP_X + 14} y={LANE_Y0 - 22} fontSize={14} fontFamily={MONO} fontWeight={700} fill={laneMode === 5 && laneGlow > 0.01 ? colors.WARM : colors.TEXT}>
                {`${SELECTOR} ->`}
              </text>
              <line x1={PIP_X + 6} y1={LANE_Y0 - 30} x2={PIP_X + 6} y2={laneY(7) + 4} stroke={laneMode === 5 && laneGlow > 0.01 ? colors.WARM : colors.MUTED} strokeWidth={1.5} opacity={0.8} />
            </g>
          )}
          {TASKS.map((task, t) => {
            const u = staggerU(laneU, t, 8, 0.6, 0.5);
            if (u <= 0.005) return null;
            const hot = laneHot(t);
            const g = hot ? laneGlow : 0;
            const dimmed = anyHot && !hot ? 0.35 : 1;
            const y = laneY(t);
            const c = counts?.[t] ?? 0;
            return (
              <g key={task} opacity={u * dimmed}>
                {g > 0.01 && <rect x={RX - 16} y={y - 16} width={512} height={22} rx={5} fill={hot!} opacity={0.12 * g} />}
                <text x={RX - 8} y={y} fontSize={13} fontFamily={MONO} fontWeight={600} fill={g > 0.5 ? hot! : colors.TEXT}>
                  {task}
                </text>
                <text x={PIP_X} y={y} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.formulaOp) * (1 - pipsU)}>
                  {ORACLE_FORMULA[task]}
                </text>
                {pipsU > 0.005 && counts && (
                  <g opacity={pipsU}>
                    {Array.from({ length: c }, (_, i) => (
                      <rect key={i} x={PIP_X + i * 18} y={y - 11} width={13} height={13} rx={2} fill={c === 1 ? colors.POSITIVE : '#38bdf8'} />
                    ))}
                    <text x={PIP_X + c * 18 + 8} y={y} fontSize={14} fontFamily={MONO} fontWeight={700} fill={g > 0.5 ? hot! : colors.TEXT}>
                      {c}
                    </text>
                  </g>
                )}
                {strU > 0.005 && (
                  <text x={PIP_X + 22} y={y} fontSize={13} fontFamily={MONO} fill={g > 0.5 ? hot! : colors.TEXT} opacity={strU}>
                    {TAILS[t]}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* B12: the eight survivors fly out of the wall to their task lanes */}
        {flyU > 0.005 &&
          SURVIVORS.map((c, t) => {
            const C = CELLS[c];
            const u = clamp01((flyU * 1.35 - t * 0.05) / 1);
            const x = lerp(C.x, PIP_X + 1, u);
            const y = lerp(C.y, laneY(t) - 10, u) - Math.sin(Math.PI * u) * 40;
            return <rect key={t} x={x} y={y} width={lerp(CELL, 11, u)} height={lerp(CELL, 11, u)} rx={2} fill={colors.POSITIVE} opacity={lanesOp} />;
          })}

        {/* B13: the controls */}
        {[
          { u: v(scene.ctrl1), y: 150, test: 'active', id: 'fitsWithoutActivePredicate', n: WITHOUT_ACTIVE },
          { u: v(scene.ctrl2), y: 236, test: 'same-id', id: 'fitsWithoutIDPredicate', n: WITHOUT_ID },
        ].map(({ u, y, test, id, n }) =>
          u > 0.005 ? (
            <g key={id} opacity={u}>
              <text x={RX} y={y} fontSize={15} fill={colors.TEXT}>
                drop
              </text>
              <Chip x={RX + 42} y={y - 18} text={test} color={colors.NEGATIVE} opacity={1} />
              <text x={RX + 42 + test.length * CH14 + 34} y={y} fontSize={15} fill={colors.TEXT}>
                → programs that fit:
              </text>
              <text x={RX + 42 + test.length * CH14 + 196} y={y + 2} fontSize={26} fontFamily={MONO} fontWeight={700} fill={colors.NEGATIVE}>
                {n}
              </text>
              <text x={RX} y={y + 30} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                {`${id}: ${n}`}
              </text>
            </g>
          ) : null,
        )}
        {v(scene.scopeU) > 0.005 && (
          <g opacity={v(scene.scopeU)}>
            <rect x={RX} y={300} width={478} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={RX + 239} y={322} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
              within this vocabulary · these eight authored targets
            </text>
            <text x={RX} y={364} fontSize={14} fontFamily={MONO} fill={colors.WARM} opacity={rowGlow}>
              {`both tests needed: ${SELECTOR}`}
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
