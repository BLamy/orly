// The Host Loop
//
// Handwired — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   docs/README.md:21 (the host), docs/README.md:9 (runs every operation, can't stop early)
//   docs/tutorial.md:13 (the host and the table), 110-112 (event queue, advanceFrame, the callback),
//     143 (write-back policy), 145 (checks; the off-grid throw), 151-157 (DOM writes), 165-169 (the test)
//   template/toggle.ts:9-38 (layout, the 20 cells), 86 (ToggleEvent), 92-139 (createToggleMachine: queue, step,
//     the callback), 141-158 (mountToggle)
//   template/toggle.test.ts:9-39 (scripted trace), 41-61 (the comparison loop and its bounds), 65-69 (off-grid error)
//   template/toggle-reference.ts:17-28, 35-53 (plain-JavaScript timing)
//   docs/execution-model.md:166-228 (springs and time; which evaluations write state back)
//   src/runtime/host-timing.ts:36-40 (4 ms step, 16-step settle checks, 300-step cap), 314-406 (advanceFrame)
//   src/runtime/cells.ts:27-32 (cell kinds; inputs are kept, events reset)
//   docs/behavior-choices.md:44 (the planner; a spring not at rest settles only on a settle check), 48 (stored
//     tables bit-identical at 10, 30, 60 and 120 fps in the toast stack), 52 (window-manager.test.ts replays a
//     session at several frame rates); the four frame-rate lanes on screen are an illustration of that rule
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// Every per-frame number on screen (on, armed, thumb offsets, the 38 animating frames) is computed at module
// scope by a line-for-line port of toggle-reference.ts over the test's scripted trace, and checked against the
// test's own annotations; the module throws if they ever disagree. One correction to the plan: the evaluation
// at 1061 ms runs while the spring clock is stopped, so advanceFrame plans it with settleCheck = true
// (host-timing.ts:388-389), and the host writes 1 into settleCheck, not 0.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** 0 → 1 → 0 bump over [a, b] of u */
const win = (u: number, a: number, b: number): number => clamp01((u - a) / Math.max(1e-6, b - a));
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const fmt = (v: number): string => (v < 0 ? `−${Math.abs(v)}` : `${v}`);

// ---------------------------------------------------------------------------
// The scripted trace and the plain-JavaScript reference (module scope, exact)
// ---------------------------------------------------------------------------

type Ev = { kind: 'down' | 'up' | 'cancel'; x: number; y: number; timeStamp: number };
type TraceFrame = { timeMs: number; events: Ev[]; expected?: { on: number; armed: number } };

/** toggle.test.ts:11-39, verbatim in behaviour. */
function scriptedTrace(): TraceFrame[] {
  const frames: TraceFrame[] = [];
  let timeMs = 1000;
  const idle = (count: number, gapMs = 16) => {
    for (let i = 0; i < count; i++) frames.push({ timeMs: (timeMs += gapMs), events: [] });
  };
  const pointer = (kind: Ev['kind'], x: number, y: number, on: number, armed: number) => {
    timeMs += 16;
    frames.push({ timeMs, events: [{ kind, x, y, timeStamp: timeMs - 3 }], expected: { on, armed } });
  };
  idle(2);
  pointer('down', 640, 400, 0, 1);
  pointer('up', 640, 400, 1, 0);
  idle(3);
  pointer('down', 630.25, 399.5, 1, 1);
  pointer('up', 630.25, 399.5, 0, 0);
  idle(60);
  pointer('down', 613.984375, 400, 0, 0);
  pointer('down', 614, 384, 0, 1);
  pointer('up', 666, 400, 0, 0);
  pointer('down', 640, 400, 0, 1);
  pointer('cancel', 0, 0, 0, 0);
  pointer('up', 640, 400, 0, 0);
  pointer('down', 665.984375, 415.984375, 0, 1);
  pointer('up', 665.984375, 415.984375, 1, 0);
  idle(1, 500);
  idle(60);
  return frames;
}

type RefFrame = { timeMs: number; on: number; armed: number; thumb: number; animating: boolean; hasEvent: boolean };

/** toggle-reference.ts:10-58 at 1280 × 800 (one event per frame in this trace). */
function runReference(frames: TraceFrame[]): RefFrame[] {
  const st = { on: 0, armed: 0, thumb: 0, velocity: 0, animatedUntilMs: null as number | null, checkOriginMs: 0 };
  const destination = () => st.on * 20;
  const within = () => Math.abs(st.thumb - destination()) <= Math.fround(0.01) && Math.abs(st.velocity) <= Math.fround(0.01);
  const q = (t: number) => Math.round(t * 64) / 64 + 0;
  const stepTo = (timeMs: number) => {
    while (st.animatedUntilMs !== null && st.animatedUntilMs + 4 <= timeMs) {
      st.velocity += (-650 * (st.thumb - destination()) - 45 * st.velocity) * 0.004;
      st.thumb += st.velocity * 0.004;
      st.animatedUntilMs += 4;
      if ((st.animatedUntilMs - st.checkOriginMs) % 64 === 0 && within()) {
        st.thumb = destination();
        st.velocity = 0;
        st.animatedUntilMs = null;
      }
    }
  };
  const trackLeft = 1280 / 2 - 52 / 2;
  const trackTop = 800 / 2 - 32 / 2;
  const inside = (e: Ev) => e.x >= trackLeft && e.x < trackLeft + 52 && e.y >= trackTop && e.y < trackTop + 32;
  return frames.map((f) => {
    for (const e of f.events) {
      const eventMs = q(e.timeStamp);
      stepTo(eventMs);
      if (e.kind === 'down') st.armed = inside(e) ? 1 : 0;
      if (e.kind === 'up' && st.armed === 1 && inside(e)) st.on = 1 - st.on;
      if (e.kind === 'up' || e.kind === 'cancel') st.armed = 0;
      if (st.animatedUntilMs === null && !within()) {
        st.animatedUntilMs = eventMs;
        st.checkOriginMs = eventMs;
      }
    }
    stepTo(q(f.timeMs));
    return { timeMs: f.timeMs, on: st.on, armed: st.armed, thumb: st.thumb, animating: st.animatedUntilMs !== null, hasEvent: f.events.length > 0 };
  });
}

const TRACE = scriptedTrace();
const REF = runReference(TRACE);
const N_FRAMES = REF.length;
const ANIMATING = REF.filter((r) => r.animating).length;
// The test's own assertions (toggle.test.ts:52, 58): every annotated frame, and 38 animating frames.
TRACE.forEach((f, i) => {
  if (f.expected && (f.expected.on !== REF[i].on || f.expected.armed !== REF[i].armed)) {
    throw new Error(`handwired ch3: reference disagrees with the test annotation at frame ${i}`);
  }
});
if (ANIMATING !== 38) throw new Error(`handwired ch3: expected 38 animating frames, got ${ANIMATING}`);
const THUMB_MAX = Math.max(...REF.map((r) => r.thumb));
const FOCUS_FRAME = 10; // the thumb is mid-flight here (after the second click flips it back)
// Outputs of the frame evaluations after the release (1064, 1080, 1096, 1112 ms).
const OUT_FRAMES = [3, 4, 5, 6].map((i) => REF[i]);

// ---------------------------------------------------------------------------
// The 20-cell table (toggleCells order, toggle.ts:18-38)
// ---------------------------------------------------------------------------

type Kind = 'input' | 'event' | 'state';
const KIND_COLOR: Record<Kind, string> = { input: colors.ACCENT, event: colors.WARM, state: colors.POSITIVE };
const CELLS: { name: string; kind: Kind }[] = [
  { name: 'viewportWidth', kind: 'input' },
  { name: 'viewportHeight', kind: 'input' },
  { name: 'down.active', kind: 'event' },
  { name: 'down.x', kind: 'input' },
  { name: 'down.y', kind: 'input' },
  { name: 'up.active', kind: 'event' },
  { name: 'up.x', kind: 'input' },
  { name: 'up.y', kind: 'input' },
  { name: 'cancel', kind: 'event' },
  { name: 'on', kind: 'state' },
  { name: 'armed', kind: 'state' },
  { name: 'springMatrix[0]', kind: 'input' },
  { name: 'springMatrix[1]', kind: 'input' },
  { name: 'springMatrix[2]', kind: 'input' },
  { name: 'springMatrix[3]', kind: 'input' },
  { name: 'settleCheck', kind: 'input' },
  { name: 'snap', kind: 'input' },
  { name: 'thumb.displacement', kind: 'state' },
  { name: 'thumb.velocity', kind: 'state' },
  { name: 'thumb.destination', kind: 'state' },
];
// settleCheck ends just inside its cell's right edge, so it and snap (centred) sit side by side under their own
// cells instead of overlapping.
const GROUPS: { label: string; from: number; to: number; align?: 'end' }[] = [
  { label: 'viewport', from: 0, to: 1 },
  { label: 'down', from: 2, to: 4 },
  { label: 'up', from: 5, to: 7 },
  { label: 'cancel', from: 8, to: 8 },
  { label: 'on', from: 9, to: 9 },
  { label: 'armed', from: 10, to: 10 },
  { label: 'springMatrix', from: 11, to: 14 },
  { label: 'settleCheck', from: 15, to: 15, align: 'end' },
  { label: 'snap', from: 16, to: 16 },
  { label: 'thumb', from: 17, to: 19 },
];

// Stored table after the press at 1045 (written back) and the frame at 1048 (on a copy): derived.
const T_BEFORE = [1280, 800, 0, 640, 400, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0];
// The host's writes for the evaluation at 1061 ms, in toggle.ts:115-126 order (0 steps → identity matrix;
// a stopped clock → settleCheck 1; no snap; viewport; the release and its coordinates).
const WRITES: { cells: number[]; values: number[]; label: string }[] = [
  { cells: [11, 12, 13, 14], values: [1, 0, 0, 1], label: 'springMatrix' },
  { cells: [15], values: [1], label: 'settleCheck' },
  { cells: [16], values: [0], label: 'snap' },
  { cells: [0, 1], values: [1280, 800], label: 'viewport' },
  { cells: [5], values: [1], label: 'up.active' },
  { cells: [6], values: [640], label: 'up.x' },
  { cells: [7], values: [400], label: 'up.y' },
];
const WRITE_GROUP: number[] = CELLS.map((_, i) => WRITES.findIndex((w) => w.cells.includes(i)));
const T_WRITTEN = T_BEFORE.map((v, i) => {
  const g = WRITE_GROUP[i];
  return g < 0 ? v : WRITES[g].values[WRITES[g].cells.indexOf(i)];
});
// next values (derived by hand from execution-model.md:178-190 and cells.ts:27-32): inputs kept, events reset,
// on flips, armed clears, the thumb's spring is 20 px from its new destination with 0 steps run.
const NEXT = T_WRITTEN.map((v, i) => {
  const n = CELLS[i].name;
  if (CELLS[i].kind === 'event') return 0;
  if (n === 'on') return 1;
  if (n === 'armed') return 0;
  if (n === 'thumb.displacement') return -20;
  if (n === 'thumb.velocity') return 0;
  if (n === 'thumb.destination') return 20;
  return v;
});
const CHANGED = NEXT.map((v, i) => v !== T_WRITTEN[i]);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const TOP = { x: 40, y: 80, w: 1200, h: 142 }; // host band: the planner's timeline
const BOT = { x: 40, y: 502, w: 1200, h: 120 }; // host band: queue + page
const CELL_W = 48;
const CELL_H = 28;
const PITCH = 56;
const CX0 = 70;
const cellX = (i: number): number => CX0 + i * PITCH;
const TABLE_Y = 244;
const NEXT_Y = 458;
const SLOT = { x: 200, y: 316, w: 880, h: 120 };
const BIG = { x: 340, y: 150, w: 600, h: 320 };
const RING = { x: 120, y: 104, w: 1040, h: 430 };
const HEADER_H = 76; // the screen-space title band

// timeline: x 60 ↔ 1032 ms … x 1220 ↔ 1144 ms
const TX = (ms: number): number => 60 + ((ms - 1032) * 1160) / 112;
const AXIS_Y = 128;
const EVAL_Y = 168;
const FRAME_MS = [1032, 1048, 1064, 1080, 1096, 1112, 1128, 1144];
const DIM_AFTER = 1125; // frames 7–8 are drawn dim and unlabelled

// program block layer stack (schematic): seeded column heights
const STACK = (() => {
  const rand = mulberry32(31);
  return Array.from({ length: 22 }, () => 2 + Math.floor(rand() * 4));
})();

// bottom band
const QUEUE = { x: 130, y: 530, w: 440, h: 44 };
const TRACK = { x: 740, y: 532, w: 104, h: 64 }; // the mini toggle at 2×
const OUT_CHIP = { x: 862, y: 514, w: 176, h: 24, dx: 186, dy: 30 };

// comparator
const CMP_X0 = 100;
const CMP_X1 = 1220;
const FW = (CMP_X1 - CMP_X0) / N_FRAMES;
const fx = (i: number): number => CMP_X0 + i * FW;
const LANE_A = 150;
const LANE_B = 240;
const CURVE_Y0 = 446; // 0 px
const CURVE_Y1 = 336; // 20 px
const cy = (px: number): number => CURVE_Y0 + ((CURVE_Y1 - CURVE_Y0) * px) / 20;
const WINDOW = { x: 790, y: 470, w: 430, h: 104 };

// pixel rulers (1/64 px = 96 world px)
const RL = { cx: 400, y: 470 };
const rlx = (v: number): number => RL.cx + (v - 614) * 64 * 96;
const RC = { cx: 900, cy: 420 };
const rcx = (v: number): number => RC.cx + (v - 666) * 64 * 96;
const rcy = (v: number): number => RC.cy + (v - 416) * 64 * 96;

const CAM_QUEUE: CameraState = { x: 620, y: 560, k: 1.25 };
const CAM_TL: CameraState = { x: 640, y: 344, k: 0.92 }; // card, code chip above it and the queue band all fit
const CAM_TL_ZOOM: CameraState = { x: 300, y: 165, k: 1.75 };
const CAM_TL_PAN: CameraState = { x: 740, y: 190, k: 1.4 }; // the release at 1061 through the settle box, both labels clear of the edges
const CAM_TABLE: CameraState = { x: 655, y: 300, k: 1.08 };
const CAM_LOWER: CameraState = { x: 640, y: 372, k: 1.04 };
const CAM_RATES: CameraState = { x: 640, y: 392, k: 1.05 };
const CAM_PAGE: CameraState = { x: 860, y: 480, k: 1.3 };
const CAM_CMP: CameraState = { x: 640, y: 372, k: 1.02 };
const CAM_RULE_L: CameraState = { x: 400, y: 430, k: 1.8 };
const CAM_RULE_R: CameraState = { x: 900, y: 400, k: 1.6 };

const SOURCES = [
  'docs/README.md:21',
  'template/toggle.ts:106-108 · docs/tutorial.md:110',
  'docs/tutorial.md:110 · template/toggle.ts:111',
  'toggle.test.ts:9 · toggle-reference.ts:17-28, 47-50 (derived)',
  'template/toggle.ts:115-126 · toggle.test.ts:68',
  'template/toggle.ts:129-130 · execution-model.md:178-190 (derived)',
  'toggle.ts:112-113 · execution-model.md:226 · behavior-choices.md:48, 52',
  'template/toggle.ts:141-158 · docs/tutorial.md:151',
  'template/toggle.test.ts:1, 41-56',
  'docs/tutorial.md:167 · template/toggle.test.ts:58-61',
  'template/toggle.test.ts:28-35 · docs/tutorial.md:169',
  'docs/tutorial.md:13 · docs/README.md:9',
];

// code chip bank (verbatim excerpts; long lines wrapped)
const C3A = ['queue(event: ToggleEvent) {', '  queued.push(event)', '}'];
const C3B = ['machine.clock = advanceFrame(machine.clock, frameTime, queued, evaluation => {'];
const C3C = [
  'cells.springMatrix.forEach((wire, index) => {',
  '  values[wire] = matrix[index]! })',
  'values[cells.settleCheck] = evaluation.settleCheck ? 1 : 0',
];
const C3D = ['const result = evaluate(values)', 'if (evaluation.writesBack) source.set(result.nextValues)'];
const C3E = [
  'const values = evaluation.writesBack ? source : copy',
  'if (!evaluation.writesBack) copy.set(source)',
  "writeBack: WriteBack = 'events and settle checks'",
];
const C3F = ['track.style.transform =', '  `translate3d(${output.trackLeft}px,${output.trackTop}px,0)`'];
const C3G = ['expect(largestThumbError).toBeLessThan(1e-5)'];
const C3H = [
  "pointer('down', 613.984375, 400, 0, 0, false) // 1/64 px left of the track",
  "pointer('down', 614, 384, 0, 1) // exactly on the left and top edges",
  "pointer('up', 666, 400, 0, 0) // exactly on the right edge, which is outside, so it only disarms",
];

// ---------------------------------------------------------------------------
// Timeline — 112.6 s, twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 330, k: 1.08 }, cameraInterp);
  const src = tl.channel('src', 0);

  // layer opacities (the sandwich)
  const opTL = tl.channel('opTL', 1);
  const opTable = tl.channel('opTable', 1);
  const opProg = tl.channel('opProg', 1);
  const opNext = tl.channel('opNext', 1);
  const opBottom = tl.channel('opBottom', 1);
  const opTop = tl.channel('opTop', 1); // the top host band, empty once the timeline and the writes are gone
  const cmpMode = tl.channel('cmpMode', 0); // sandwich whispers while the comparator runs

  // B0
  const introU = tl.channel('introU', 0);
  const crossU = tl.channel('crossU', 0);
  const hostIconsU = tl.channel('hostIconsU', 0);
  const sandU = tl.channel('sandU', 0);
  const tableU = tl.channel('tableU', 0);
  // B1
  const pageU = tl.channel('pageU', 0);
  const pressU = tl.channel('pressU', 0); // 0 none · 1 press · 2 release
  const q1U = tl.channel('q1U', 0);
  const q2U = tl.channel('q2U', 0);
  const drainU = tl.channel('drainU', 0);
  const codeA = tl.channel('codeA', 0);
  // B2
  const axisU = tl.channel('axisU', 0);
  const framesU = tl.channel('framesU', 0);
  const eventsU = tl.channel('eventsU', 0);
  const afU = tl.channel('afU', 0);
  const codeB = tl.channel('codeB', 0);
  const leg1 = tl.channel('leg1', 0);
  const leg2 = tl.channel('leg2', 0);
  const leg3 = tl.channel('leg3', 0);
  const legOp = tl.channel('legOp', 1);
  // B3
  const b3U = tl.channel('b3U', 0);
  const combU = tl.channel('combU', 0);
  const settleU = tl.channel('settleU', 0);
  // B4
  const pickU = tl.channel('pickU', 0);
  const writeU = tl.channel('writeU', 0); // 0..7 groups
  const codeC = tl.channel('codeC', 0);
  const errU = tl.channel('errU', 0);
  // B5
  const sweepU = tl.channel('sweepU', 0);
  const nextU = tl.channel('nextU', 0);
  const copyU = tl.channel('copyU', 0);
  const gateU = tl.channel('gateU', 0); // the writesBack? gate on the copy-back arrow
  const codeD = tl.channel('codeD', 0);
  // B6
  const ghostU = tl.channel('ghostU', 0);
  const ghostSweepU = tl.channel('ghostSweepU', 0);
  const ghostOutU = tl.channel('ghostOutU', 0);
  const crumbleU = tl.channel('crumbleU', 0);
  const keepU = tl.channel('keepU', 0);
  const codeE = tl.channel('codeE', 0);
  const ratesU = tl.channel('ratesU', 0);
  const barsU = tl.channel('barsU', 0);
  const eqU = tl.channel('eqU', 0);
  // B7
  const outU = tl.channel('outU', 0);
  const tickU = tl.channel('tickU', 0); // 0..3 → frames 1064..1112
  const codeF = tl.channel('codeF', 0);
  const backU = tl.channel('backU', 0);
  // B8–B9
  const cmpU = tl.channel('cmpU', 0);
  const scanU = tl.channel('scanU', -1); // frame index of the scan line
  const exactU = tl.channel('exactU', 0);
  const curveU = tl.channel('curveU', 0);
  const loupeU = tl.channel('loupeU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const b9Op = tl.channel('b9Op', 1);
  const lanesOp = tl.channel('lanesOp', 1);
  // B10
  const rulerU = tl.channel('rulerU', 0);
  const dot1U = tl.channel('dot1U', 0);
  const dot2U = tl.channel('dot2U', 0);
  const cornerU = tl.channel('cornerU', 0);
  const dot3U = tl.channel('dot3U', 0);
  const dot4U = tl.channel('dot4U', 0);
  const codeH = tl.channel('codeH', 0);
  const rulersOp = tl.channel('rulersOp', 1);
  // B11
  const finalU = tl.channel('finalU', 0);

  const caps = [
    { at: 0.4, dur: 8.3 },
    { at: 9.1, dur: 7.2 },
    { at: 16.7, dur: 10.9 },
    { at: 28, dur: 9.1 },
    { at: 37.5, dur: 8.3 },
    { at: 46.2, dur: 8.8 },
    { at: 55.4, dur: 11.8 },
    { at: 67.6, dur: 6.1 },
    { at: 74.1, dur: 8.3 },
    { at: 82.8, dur: 8.7 },
    { at: 91.9, dur: 9.1 },
    { at: 101.4, dur: 8.7 },
  ];
  caps.forEach((c, i) => tl.set(src, i, Math.max(0, c.at - 0.1)));

  // — B0 · a program can't wait, listen or loop; the host can —
  tl.caption({ ...caps[0], text: "A program can't wait, listen or loop. The host can: ordinary Javascript around it that feeds the table and reads the answers." });
  tl.tween(introU, 1, { at: 0.5, dur: 0.8, ease: ease.enter });
  tl.tween(crossU, 1, { at: 1.3, dur: 0.9, ease: ease.draw });
  tl.tween(hostIconsU, 1, { at: 3.3, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 4.8, dur: 1.4, ease: ease.move });
  tl.tween(sandU, 1, { at: 5.0, dur: 1.4, ease: ease.move });
  tl.tween(tableU, 1, { at: 5.9, dur: 1.0, ease: ease.enter });
  tl.hold(8.7, 0.4);

  // — B1 · handlers only queue —
  tl.caption({ ...caps[1], text: 'Event handlers do almost nothing: a press or a release is queued with its timestamp for the next frame.' });
  tl.tween(cam, CAM_QUEUE, { at: 9.1, dur: 1.2, ease: ease.move });
  tl.tween(crossU, 0, { at: 9.1, dur: 0.6, ease: ease.move });
  tl.tween(opTable, 0.3, { at: 9.1, dur: 0.6, ease: ease.move });
  tl.tween(opProg, 0.3, { at: 9.1, dur: 0.6, ease: ease.move });
  tl.tween(pageU, 1, { at: 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(pressU, 1, { at: 10.3, dur: 0.6, ease: ease.move });
  tl.tween(q1U, 1, { at: 10.9, dur: 0.7, ease: ease.enter });
  tl.tween(pressU, 2, { at: 12.0, dur: 0.6, ease: ease.move });
  tl.tween(q2U, 1, { at: 12.6, dur: 0.7, ease: ease.enter });
  tl.tween(codeA, 1, { at: 13.6, dur: 0.6, ease: ease.enter });
  tl.hold(16.3, 0.4);

  // — B2 · advanceFrame plans the frame —
  tl.caption({ ...caps[2], text: 'Each frame calls a planner, advance frame: one evaluation per event time, one at the frame, and a settle check every sixty-four milliseconds, where a resting spring may stop.' });
  tl.tween(cam, CAM_TL, { at: 16.7, dur: 1.3, ease: ease.move });
  tl.tween(codeA, 0, { at: 16.7, dur: 0.5, ease: ease.move });
  tl.tween(opTable, 0.12, { at: 16.7, dur: 0.6, ease: ease.move });
  tl.tween(opProg, 0.12, { at: 16.7, dur: 0.6, ease: ease.move });
  tl.tween(axisU, 1, { at: 17.0, dur: 1.1, ease: ease.draw });
  tl.tween(framesU, 1, { at: 17.4, dur: 1.0, ease: ease.linear });
  tl.tween(eventsU, 1, { at: 18.0, dur: 0.6, ease: ease.pop });
  tl.tween(drainU, 1, { at: 18.0, dur: 0.6, ease: ease.move });
  tl.tween(afU, 1, { at: 18.5, dur: 0.7, ease: ease.draw });
  tl.tween(codeB, 1, { at: 18.8, dur: 0.6, ease: ease.enter });
  tl.tween(leg1, 1, { at: 19.6, dur: 0.6, ease: ease.pop });
  tl.tween(leg3, 1, { at: 21.3, dur: 0.6, ease: ease.pop });
  tl.tween(leg2, 1, { at: 23.0, dur: 0.6, ease: ease.pop });
  tl.hold(27.6, 0.4);

  // — B3 · two evaluations in an event frame; the first settle check —
  tl.caption({ ...caps[3], text: 'In the test, events land three milliseconds before their frame, so that frame gets two evaluations: one at the event, one at the frame.' });
  tl.tween(cam, CAM_TL_ZOOM, { at: 28, dur: 1.2, ease: ease.move });
  tl.tween(codeB, 0, { at: 28, dur: 0.5, ease: ease.move });
  tl.tween(legOp, 0, { at: 28, dur: 0.5, ease: ease.move });
  tl.tween(afU, 0, { at: 28, dur: 0.5, ease: ease.move });
  tl.tween(b3U, 1, { at: 29, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_TL_PAN, { at: 32.2, dur: 1.4, ease: ease.move });
  tl.tween(combU, 1, { at: 32.8, dur: 1.2, ease: ease.draw });
  tl.tween(settleU, 1, { at: 34.2, dur: 0.7, ease: ease.enter });
  tl.hold(37.1, 0.4);

  // — B4 · the host writes the table —
  tl.caption({ ...caps[4], text: 'Before each evaluation the host writes the table: the spring matrix, settle and snap bits, viewport, and any event with its coordinates.' });
  tl.tween(cam, CAM_TABLE, { at: 37.5, dur: 1.3, ease: ease.move });
  tl.tween(b3U, 0, { at: 37.5, dur: 0.5, ease: ease.move });
  tl.tween(combU, 0, { at: 37.5, dur: 0.5, ease: ease.move });
  tl.tween(settleU, 0, { at: 37.5, dur: 0.5, ease: ease.move });
  tl.tween(opTable, 1, { at: 37.5, dur: 0.7, ease: ease.move });
  tl.tween(opBottom, 0.15, { at: 37.5, dur: 0.6, ease: ease.move });
  tl.tween(pickU, 1, { at: 38.1, dur: 0.6, ease: ease.pop });
  tl.tween(codeC, 1, { at: 38.6, dur: 0.6, ease: ease.enter });
  tl.tween(opTL, 0, { at: 39.2, dur: 0.6, ease: ease.move });
  tl.tween(writeU, WRITES.length + 1, { at: 39.8, dur: (WRITES.length + 1) * 0.55, ease: ease.linear });
  tl.tween(errU, 1, { at: 43.7, dur: 0.3, ease: ease.enter });
  tl.tween(errU, 0, { at: 45.1, dur: 0.4, ease: ease.move });
  tl.hold(45.8, 0.4);

  // — B5 · evaluate, then copy the next values back —
  tl.caption({ ...caps[5], text: 'Then evaluate runs every operation and returns next values and outputs. When an evaluation writes back, the host copies the next values over the table.' });
  tl.tween(cam, CAM_LOWER, { at: 46.2, dur: 1.2, ease: ease.move });
  tl.tween(pickU, 0, { at: 46.2, dur: 0.5, ease: ease.move });
  tl.tween(codeC, 0, { at: 46.2, dur: 0.5, ease: ease.move });
  tl.tween(opProg, 1, { at: 46.2, dur: 0.6, ease: ease.move });
  tl.tween(opTop, 0, { at: 46.2, dur: 0.6, ease: ease.move }); // pushed up, its label would sit under the header chip
  tl.tween(sweepU, 1, { at: 46.8, dur: 1.6, ease: ease.linear });
  tl.tween(codeD, 1, { at: 47.2, dur: 0.6, ease: ease.enter });
  tl.tween(nextU, 1, { at: 48.2, dur: 0.9, ease: ease.linear });
  tl.tween(gateU, 1, { at: 49.6, dur: 0.6, ease: ease.pop });
  tl.tween(copyU, 1, { at: 50.5, dur: 2.6, ease: ease.linear });
  tl.hold(55, 0.4);

  // — B6 · a frame's own evaluation runs on a copy; four frame rates agree —
  tl.caption({ ...caps[6], text: "A frame's own evaluation runs on a copy, so stored state follows events, not frame rate. The repo's replay tests find stored tables identical, bit for bit, at every frame rate tried." });
  tl.tween(codeD, 0, { at: 55.4, dur: 0.5, ease: ease.move });
  tl.tween(nextU, 0, { at: 55.4, dur: 0.5, ease: ease.move });
  tl.tween(sweepU, 0, { at: 55.4, dur: 0.4, ease: ease.move });
  tl.tween(gateU, 0, { at: 55.4, dur: 0.4, ease: ease.move });
  tl.tween(codeE, 1, { at: 55.7, dur: 0.6, ease: ease.enter });
  tl.tween(ghostU, 1, { at: 56, dur: 0.8, ease: ease.move });
  tl.tween(ghostSweepU, 1, { at: 57, dur: 1.0, ease: ease.linear });
  tl.tween(ghostOutU, 1, { at: 57.9, dur: 0.6, ease: ease.move });
  tl.tween(opBottom, 0.7, { at: 57.9, dur: 0.6, ease: ease.move });
  tl.tween(crumbleU, 1, { at: 58.7, dur: 0.9, ease: ease.move });
  tl.tween(keepU, 1, { at: 58.9, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_RATES, { at: 60.8, dur: 1.2, ease: ease.move });
  tl.tween(codeE, 0, { at: 60.8, dur: 0.5, ease: ease.move });
  tl.tween(keepU, 0, { at: 60.8, dur: 0.5, ease: ease.move });
  tl.tween(ghostOutU, 0, { at: 60.8, dur: 0.5, ease: ease.move });
  tl.tween(opBottom, 0.15, { at: 60.8, dur: 0.6, ease: ease.move });
  tl.tween(opTable, 0.3, { at: 60.8, dur: 0.6, ease: ease.move });
  tl.tween(ratesU, 1, { at: 61.2, dur: 0.9, ease: ease.enter });
  tl.tween(barsU, 1, { at: 62.6, dur: 1.0, ease: ease.linear });
  tl.tween(eqU, 1, { at: 64, dur: 0.6, ease: ease.pop });
  tl.hold(67.2, 0.4);

  // — B7 · the page draws from outputs only —
  tl.caption({ ...caps[7], text: "The page draws from output numbers only: the track's position, the on flag, the thumb's offset." });
  tl.tween(ratesU, 0, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(barsU, 0, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(eqU, 0, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_PAGE, { at: 67.6, dur: 1.2, ease: ease.move });
  tl.tween(opTable, 0.25, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(opProg, 0.45, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(opBottom, 1, { at: 67.6, dur: 0.6, ease: ease.move });
  tl.tween(ghostSweepU, 0, { at: 67.6, dur: 0.5, ease: ease.move });
  tl.tween(outU, 1, { at: 68.1, dur: 1.0, ease: ease.move });
  tl.tween(codeF, 1, { at: 68.9, dur: 0.6, ease: ease.enter });
  tl.tween(tickU, 3, { at: 69.3, dur: 2.4, ease: ease.linear });
  tl.tween(backU, 1, { at: 71.5, dur: 0.8, ease: ease.draw });
  tl.hold(73.7, 0.4);

  // — B8 · the two-lane comparator —
  tl.caption({ ...caps[8], text: 'To check it, the repo runs the same switch in plain Javascript and compares both on a scripted trace, frame by frame.' });
  tl.tween(cam, CAM_CMP, { at: 74.1, dur: 1.2, ease: ease.move });
  tl.tween(codeF, 0, { at: 74.1, dur: 0.5, ease: ease.move });
  tl.tween(backU, 0, { at: 74.1, dur: 0.5, ease: ease.move });
  tl.tween(cmpMode, 1, { at: 74.1, dur: 0.8, ease: ease.move });
  tl.tween(cmpU, 1, { at: 74.7, dur: 0.9, ease: ease.enter });
  tl.tween(scanU, N_FRAMES - 1, { at: 76.3, dur: 5.2, ease: ease.linear });
  tl.hold(82.4, 0.4);

  // — B9 · decisions exact; the thumb within 1e-5 px —
  tl.caption({ ...caps[9], text: 'Decisions must match exactly: on, armed, track position. The thumb may differ, but by under a hundred-thousandth of a pixel, across the trace.' });
  tl.tween(exactU, 1, { at: 83, dur: 0.6, ease: ease.enter });
  tl.tween(curveU, 1, { at: 84.9, dur: 1.3, ease: ease.draw });
  tl.tween(loupeU, 1, { at: 86.5, dur: 0.7, ease: ease.pop });
  tl.tween(chipsU, 1, { at: 87.9, dur: 0.9, ease: ease.enter });
  tl.hold(91.5, 0.4);

  // — B10 · the edge presses at 1/64 px —
  tl.caption({ ...caps[10], text: 'The trace presses where decisions are hardest: one sixty-fourth of a pixel outside the track, exactly on its edge, and just inside a corner.' });
  tl.tween(b9Op, 0, { at: 91.9, dur: 0.6, ease: ease.move });
  tl.tween(lanesOp, 0.04, { at: 91.9, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RULE_L, { at: 92, dur: 1.3, ease: ease.move });
  tl.tween(rulerU, 1, { at: 92.5, dur: 1.0, ease: ease.draw });
  tl.tween(codeH, 1, { at: 93.1, dur: 0.6, ease: ease.enter });
  tl.tween(dot1U, 1, { at: 94.3, dur: 0.6, ease: ease.pop });
  tl.tween(dot2U, 1, { at: 95.5, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAM_RULE_R, { at: 96.5, dur: 1.3, ease: ease.move });
  tl.tween(cornerU, 1, { at: 96.8, dur: 1.0, ease: ease.draw });
  tl.tween(dot3U, 1, { at: 97.9, dur: 0.6, ease: ease.pop });
  tl.tween(dot4U, 1, { at: 99.1, dur: 0.6, ease: ease.pop });
  tl.hold(101, 0.4);

  // — B11 · waiting, listening and looping stay out here —
  tl.caption({ ...caps[11], text: 'Waiting, listening and looping all stay out here. Inside, there is no loop and no early exit, so loops must become something else.' });
  tl.tween(codeH, 0, { at: 101.4, dur: 0.6, ease: ease.move });
  tl.tween(rulersOp, 0, { at: 101.4, dur: 0.7, ease: ease.move });
  tl.tween(cmpU, 0, { at: 101.4, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 101.4, dur: 1.4, ease: ease.move });
  tl.tween(cmpMode, 0, { at: 101.8, dur: 1.0, ease: ease.move });
  tl.tween(opTable, 0.1, { at: 101.4, dur: 0.8, ease: ease.move });
  tl.tween(opBottom, 0.1, { at: 101.4, dur: 0.8, ease: ease.move });
  tl.tween(opNext, 0.1, { at: 101.4, dur: 0.8, ease: ease.move });
  tl.tween(opProg, 1, { at: 101.4, dur: 0.8, ease: ease.move });
  tl.tween(opTop, 1, { at: 101.4, dur: 0.8, ease: ease.move });
  tl.tween(outU, 0, { at: 101.4, dur: 0.6, ease: ease.move });
  tl.tween(crossU, 0.9, { at: 102.5, dur: 0.9, ease: ease.draw });
  tl.tween(finalU, 1, { at: 103.3, dur: 0.9, ease: ease.enter });
  tl.hold(110.1, 2.5);

  return {
    tl, cam, src, opTL, opTable, opProg, opNext, opBottom, opTop, cmpMode,
    introU, crossU, hostIconsU, sandU, tableU,
    pageU, pressU, q1U, q2U, drainU, codeA,
    axisU, framesU, eventsU, afU, codeB, leg1, leg2, leg3, legOp,
    b3U, combU, settleU,
    pickU, writeU, codeC, errU,
    sweepU, nextU, copyU, gateU, codeD,
    ghostU, ghostSweepU, ghostOutU, crumbleU, keepU, codeE, ratesU, barsU, eqU,
    outU, tickU, codeF, backU,
    cmpU, scanU, exactU, curveU, loupeU, chipsU, b9Op, lanesOp,
    rulerU, dot1U, dot2U, cornerU, dot3U, dot4U, codeH, rulersOp,
    finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local copies, per the book-wide spec)
// ---------------------------------------------------------------------------

function CellChip({ x, y, value, kind, flash = 0, dashed = false, opacity = 1, name, nameOp = 0, scale = 1 }: {
  x: number; y: number; value?: number; kind: Kind; flash?: number; dashed?: boolean; opacity?: number;
  name?: string; nameOp?: number; scale?: number;
}) {
  if (opacity <= 0.005) return null;
  const w = CELL_W * scale;
  const h = CELL_H * scale;
  const ox = x + (CELL_W - w) / 2;
  const oy = y + (CELL_H - h) / 2;
  return (
    <g opacity={opacity}>
      <rect x={ox} y={oy} width={w} height={h} rx={5} fill={colors.PANEL} stroke={flash > 0.01 ? colors.TEAL : colors.GRID}
        strokeWidth={1 + 1.5 * flash} strokeDasharray={dashed ? '4 3' : undefined} />
      {flash > 0.01 && <rect x={ox} y={oy} width={w} height={h} rx={5} fill={colors.TEAL} opacity={0.22 * flash} />}
      {!dashed && <rect x={ox} y={oy + h + 1} width={w} height={3} fill={KIND_COLOR[kind]} />}
      {value !== undefined && (
        <text x={ox + w / 2} y={oy + h / 2 + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
          {fmt(value)}
        </text>
      )}
      {name && nameOp > 0.01 && (
        <text x={x + CELL_W / 2} y={y - 7} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={MONO} opacity={nameOp}>
          {name}
        </text>
      )}
    </g>
  );
}

function CodeChip({ x, y, lines, stripe = colors.TEAL, opacity = 1, fs = 14, note }: {
  x: number; y: number; lines: string[]; stripe?: string; opacity?: number; fs?: number; note?: string;
}) {
  if (opacity <= 0.005) return null;
  const adv = fs === 14 ? CH14 : CH13;
  const lh = fs + 4;
  const w = Math.max(...lines.map((l) => l.length)) * adv + 26;
  const h = lines.length * lh + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 6 + lh * (i + 1) - 4} fill={colors.TEXT} fontSize={fs} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l.replace(/^ +/, (m) => ' '.repeat(m.length))}
        </text>
      ))}
      {note && (
        <text x={x + w} y={y + h + 16} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {note}
        </text>
      )}
    </g>
  );
}

function BitDisc({ x, y, b, r = 11, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 1 ? colors.WARM : 'none'} stroke={colors.WARM} strokeWidth={2} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={b >= 1 ? '#0a0e1a' : colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700}>
        {b}
      </text>
    </g>
  );
}

function LensRing({ x, y, r, opacity = 1, leader }: { x: number; y: number; r: number; opacity?: number; leader?: [number, number] }) {
  if (opacity <= 0.005) return null;
  const s = 0.7 + 0.3 * opacity;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * s} fill="none" stroke={colors.TEXT} strokeWidth={2} />
      {leader && <line x1={x + r * s * 0.71} y1={y + r * s * 0.71} x2={leader[0]} y2={leader[1]} stroke={colors.TEXT} strokeWidth={1.5} />}
    </g>
  );
}

function ClockIcon({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round">
      <circle cx={x} cy={y} r={15 * s} />
      <line x1={x} y1={y} x2={x} y2={y - 10 * s} />
      <line x1={x} y1={y} x2={x + 7 * s} y2={y + 4 * s} />
    </g>
  );
}
function RippleIcon({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round">
      <circle cx={x} cy={y} r={3.5 * s} fill={color} />
      <path d={`M ${x - 9 * s} ${y - 6 * s} A ${11 * s} ${11 * s} 0 0 1 ${x + 9 * s} ${y - 6 * s}`} />
      <path d={`M ${x - 14 * s} ${y - 11 * s} A ${18 * s} ${18 * s} 0 0 1 ${x + 14 * s} ${y - 11 * s}`} />
      <path d={`M ${x - 9 * s} ${y + 6 * s} A ${11 * s} ${11 * s} 0 0 0 ${x + 9 * s} ${y + 6 * s}`} />
    </g>
  );
}
function LoopIcon({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  const r = 13 * s;
  const a0 = -Math.PI / 2 + 0.5;
  const a1 = -Math.PI / 2 + 2 * Math.PI - 0.35;
  const p0 = [x + r * Math.cos(a0), y + r * Math.sin(a0)];
  const p1 = [x + r * Math.cos(a1), y + r * Math.sin(a1)];
  return (
    <g stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round">
      <path d={`M ${p0[0]} ${p0[1]} A ${r} ${r} 0 1 1 ${p1[0]} ${p1[1]}`} />
      <polygon points={`${p1[0] + 1 * s},${p1[1] - 6 * s} ${p1[0] + 7 * s},${p1[1] + 2 * s} ${p1[0] - 2 * s},${p1[1] + 4 * s}`} fill={color} stroke="none" />
    </g>
  );
}
const ICONS = [ClockIcon, RippleIcon, LoopIcon];
const ICON_WORDS = ['wait', 'listen', 'loop'];

function Cross({ x, y, r, u }: { x: number; y: number; r: number; u: number }) {
  if (u <= 0.01) return null;
  const a = clamp01(u * 2);
  const b = clamp01(u * 2 - 1);
  return (
    <g stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round">
      <line x1={x - r} y1={y - r} x2={x - r + 2 * r * a} y2={y - r + 2 * r * a} />
      {b > 0 && <line x1={x + r} y1={y - r} x2={x + r - 2 * r * b} y2={y - r + 2 * r * b} />}
    </g>
  );
}
function Tick({ x, y, s, opacity = 1 }: { x: number; y: number; s: number; opacity?: number }) {
  return (
    <path d={`M ${x - 7 * s} ${y} L ${x - 2 * s} ${y + 5 * s} L ${x + 8 * s} ${y - 6 * s}`} stroke={colors.POSITIVE} strokeWidth={3} fill="none"
      strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

/** ▲ event evaluation · ● frame evaluation · ◆ settle check */
function EvalMark({ kind, x, y, r = 6, color, opacity = 1 }: { kind: 'event' | 'frame' | 'settle'; x: number; y: number; r?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  if (kind === 'frame') return <circle cx={x} cy={y} r={r} fill={color ?? colors.TEAL} opacity={opacity} />;
  if (kind === 'settle')
    return <polygon points={`${x},${y - r - 1.5} ${x + r + 1.5},${y} ${x},${y + r + 1.5} ${x - r - 1.5},${y}`} fill={color ?? colors.SECONDARY} opacity={opacity} />;
  return <polygon points={`${x},${y - r} ${x + r},${y + r * 0.8} ${x - r},${y + r * 0.8}`} fill={color ?? colors.WARM} opacity={opacity} />;
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.max(0, Math.min(SOURCES.length - 1, Math.round(s.get(scene.src))));

  const opTL = s.get(scene.opTL);
  const opTable = s.get(scene.opTable);
  const opProg = s.get(scene.opProg);
  const opNext = s.get(scene.opNext);
  const opBottom = s.get(scene.opBottom);
  const rulerFocus = s.get(scene.rulerU) * s.get(scene.rulersOp);

  // anything a camera push carries toward a stage edge (or up under the header) fades out before it is cut
  const edgeFit = (x0: number, x1: number, y0: number, y1: number): number => {
    const sx = (x: number) => (x - cam.x) * cam.k + STAGE_W / 2;
    const sy = (y: number) => (y - cam.y) * cam.k + STAGE_H / 2;
    const r = 6;
    return clamp01(sx(x0) / r) * clamp01((STAGE_W - sx(x1)) / r) * clamp01((sy(y0) - HEADER_H) / r) * clamp01((STAGE_H - sy(y1)) / r);
  };
  const sandOp = (1 - 0.93 * s.get(scene.cmpMode)) * (1 - 0.6 * rulerFocus);

  const introU = s.get(scene.introU);
  const crossU = s.get(scene.crossU);
  const hostIconsU = s.get(scene.hostIconsU);
  const sandU = s.get(scene.sandU);
  const tableU = s.get(scene.tableU);
  const pageU = s.get(scene.pageU);
  const pressU = s.get(scene.pressU);
  const q1U = s.get(scene.q1U);
  const q2U = s.get(scene.q2U);
  const drainU = s.get(scene.drainU);
  const axisU = s.get(scene.axisU);
  const framesU = s.get(scene.framesU);
  const eventsU = s.get(scene.eventsU);
  const afU = s.get(scene.afU);
  const legOp = s.get(scene.legOp);
  const marks = [s.get(scene.leg1), s.get(scene.leg2), s.get(scene.leg3)]; // marker reveal (stays on)
  const legs = marks.map((v) => v * legOp); // legend chips (fade in B3)
  const b3U = s.get(scene.b3U);
  const combU = s.get(scene.combU);
  const settleU = s.get(scene.settleU);
  const pickU = s.get(scene.pickU);
  const writeU = s.get(scene.writeU);
  const errU = s.get(scene.errU);
  const sweepU = s.get(scene.sweepU);
  const nextU = s.get(scene.nextU);
  const copyU = s.get(scene.copyU);
  const gateU = s.get(scene.gateU);
  const ghostU = s.get(scene.ghostU);
  const ghostSweepU = s.get(scene.ghostSweepU);
  const ghostOutU = s.get(scene.ghostOutU);
  const crumbleU = s.get(scene.crumbleU);
  const keepU = s.get(scene.keepU);
  const ratesU = s.get(scene.ratesU);
  const barsU = s.get(scene.barsU);
  const eqU = s.get(scene.eqU);
  const outU = s.get(scene.outU);
  const tickU = s.get(scene.tickU);
  const backU = s.get(scene.backU);
  const cmpU = s.get(scene.cmpU);
  const scanU = s.get(scene.scanU);
  const exactU = s.get(scene.exactU);
  const curveU = s.get(scene.curveU);
  const loupeU = s.get(scene.loupeU);
  const chipsU = s.get(scene.chipsU);
  const b9Op = s.get(scene.b9Op);
  const lanesOp = s.get(scene.lanesOp);
  const rulerU = s.get(scene.rulerU);
  const dot1U = s.get(scene.dot1U);
  const dot2U = s.get(scene.dot2U);
  const cornerU = s.get(scene.cornerU);
  const dot3U = s.get(scene.dot3U);
  const dot4U = s.get(scene.dot4U);
  const codeH = s.get(scene.codeH);
  const rulersOp = s.get(scene.rulersOp);
  const finalU = s.get(scene.finalU);

  // ---- table values: before → host writes (per group) → copied next values (per cell) ----
  const copyLand = (i: number): number => clamp01(copyU * 2 - (i / 19) * 0.8); // per-cell flight 0..1
  const tableValue = (i: number): number => {
    if (copyLand(i) >= 1) return NEXT[i];
    const gi = WRITE_GROUP[i];
    if (gi >= 0 && writeU >= gi + 0.35) return T_WRITTEN[i];
    return T_BEFORE[i];
  };
  const writeFlash = (i: number): number => {
    const gi = WRITE_GROUP[i];
    if (gi < 0) return 0;
    const d = writeU - (gi + 0.35);
    return d < 0 ? 0 : Math.max(0, 1 - d / 1.2);
  };
  const copyFlash = (i: number): number => {
    const l = copyLand(i);
    if (l < 1) return 0;
    const landAt = (1 + (0.8 * i) / 19) / 2;
    return clamp01(1 - (copyU - landAt) * 4) * (1 - ghostU) * (CHANGED[i] ? 1 : 0.35);
  };

  // ---- program block geometry: BIG (intro) → SLOT (sandwich) ----
  const pb = {
    x: lerp(BIG.x, SLOT.x, sandU),
    y: lerp(BIG.y, SLOT.y, sandU),
    w: lerp(BIG.w, SLOT.w, sandU),
    h: lerp(BIG.h, SLOT.h, sandU),
  };
  const pbc = { x: pb.x + pb.w / 2, y: pb.y + pb.h / 2 };
  const iconScale = lerp(1.5, 1, sandU);
  const iconOp = crossU;
  const stackOp = lerp(0.3, 1, clamp01(1 - crossU)) * (crossU > 0.05 ? 0.35 : 1);

  // the whole program block also whispers in comparator mode, but returns in the finale
  const progOp = introU * opProg;

  // ---- mini toggle state (page): only outputs move it ----
  const tickIdx = Math.min(3, Math.floor(tickU + 1e-6));
  const tickFrac = clamp01((tickU - tickIdx) * 3);
  const thumbPx = outU > 0.5 ? lerp(OUT_FRAMES[Math.max(0, tickIdx - 1)]?.thumb ?? 0, OUT_FRAMES[tickIdx].thumb, tickIdx === 0 ? 1 : tickFrac) : 0;
  const pageOn = outU > 0.5 ? 1 : 0;
  const pointer = (() => {
    // press at (790, 568), lift, release at the same place
    if (pressU <= 0) return null;
    const p1 = clamp01(pressU);
    const p2 = clamp01(pressU - 1);
    const px = lerp(900, 792, p1);
    const py = lerp(470, 566, p1);
    const ring = pressU < 1.02 ? p1 : p2;
    return { x: px, y: py, ring, up: pressU > 1.5 };
  })();

  // the code chips at the bottom left (C3c–C3e) sit over the queue: hide it rather than ghost it behind them
  const codeCover = Math.max(s.get(scene.codeC), s.get(scene.codeD), s.get(scene.codeE));

  const queueFit = edgeFit(QUEUE.x, QUEUE.x + QUEUE.w, QUEUE.y - 22, QUEUE.y + QUEUE.h);

  // ---- the 1/64 px rulers: each fades whole once the other push would cut it ----
  const leftFit = edgeFit(rlx(613.96875) - 30, rlx(614.03125) + 40, 348, RL.y + 30);
  const cornerFit = edgeFit(600, 1220, 240, RL.y + 30);

  // ---- comparator scan ----
  const scanI = Math.floor(scanU);

  const chip = SOURCES[srcIdx];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== B0 · the host ring (before the sandwich) ======================== */}
        {introU > 0.01 && sandU < 0.99 && (
          <g opacity={hostIconsU * (1 - sandU)}>
            <rect x={RING.x} y={RING.y} width={RING.w} height={RING.h} rx={26} fill={colors.TEAL} fillOpacity={0.06} stroke={colors.TEAL} strokeOpacity={0.5} strokeWidth={1.5} />
            <text x={640} y={RING.y + 30} textAnchor="middle" fill={colors.TEAL} fontSize={16} fontFamily={UI}>
              host: JavaScript around the program
            </text>
            {ICONS.map((Icon, k) => {
              const x = 230;
              const y = 214 + k * 110;
              return (
                <g key={k}>
                  <Icon x={x} y={y} s={1.5} color={colors.TEAL} />
                  <Tick x={x + 34} y={y + 16} s={1.1} />
                  <text x={x} y={y + 44} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={UI}>
                    {ICON_WORDS[k]}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        <g opacity={sandOp}>
          {/* ======================== host bands ======================== */}
          {sandU > 0.01 && (
            <g opacity={sandU}>
              {[TOP, BOT].map((b, k) => (
                <g key={k} opacity={k === 0 ? s.get(scene.opTop) : 1}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14} fill={colors.TEAL} fillOpacity={0.06} stroke={colors.TEAL} strokeOpacity={0.45} strokeWidth={1.3} />
                  <text x={b.x + b.w - 12} y={k === 0 ? b.y + 18 : b.y + b.h - 10} textAnchor="end" fill={colors.TEAL} fontSize={13} fontFamily={UI}
                    opacity={edgeFit(b.x + b.w - 140, b.x + b.w - 10, k === 0 ? b.y + 4 : b.y + b.h - 24, k === 0 ? b.y + 22 : b.y + b.h - 6)}>
                    host · JavaScript
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ======================== top band: the planner's timeline ======================== */}
          {axisU > 0.01 && (
            <g opacity={opTL}>
              <line x1={TX(1032)} y1={AXIS_Y} x2={lerp(TX(1032), TX(1144), axisU)} y2={AXIS_Y} stroke={colors.MUTED} strokeWidth={1.5} />
              {FRAME_MS.map((ms, k) => {
                const u = clamp01(framesU * FRAME_MS.length - k);
                if (u <= 0) return null;
                const dim = ms > DIM_AFTER ? 0.3 : 1;
                const x = TX(ms);
                return (
                  <g key={ms} opacity={u * dim * edgeFit(x - 20, x + 20, AXIS_Y - 10, EVAL_Y + 8)}>
                    <line x1={x} y1={AXIS_Y - 9} x2={x} y2={AXIS_Y + 9} stroke={colors.TEAL} strokeWidth={2} />
                    {ms <= 1144 && (
                      <text x={x} y={AXIS_Y + 26} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                        {ms > DIM_AFTER ? '' : `${ms}`}
                      </text>
                    )}
                    {/* ● frame evaluation */}
                    <EvalMark kind="frame" x={x} y={EVAL_Y} opacity={marks[2]} />
                  </g>
                );
              })}
              {/* events ▼ */}
              {[
                { ms: 1045, label: 'down 1045' },
                { ms: 1061, label: 'up 1061' },
                { ms: 1125, label: '' },
                { ms: 1141, label: '' },
              ].map((e) => {
                const dim = e.ms > DIM_AFTER - 1 ? 0.3 : 1;
                const x = TX(e.ms);
                const yy = lerp(AXIS_Y - 40, AXIS_Y - 14, eventsU);
                return (
                  <g key={e.ms} opacity={eventsU * dim * edgeFit(x - 7, x + 10 + e.label.length * CH13, yy - 8, yy + 6)}>
                    <polygon points={`${x - 6},${yy - 6} ${x + 6},${yy - 6} ${x},${yy + 4}`} fill={colors.WARM} />
                    {e.label && (
                      <text x={x + 9} y={yy + 2} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* advanceFrame bracket over the frame at 1048 */}
              {afU > 0.01 && (
                <g opacity={afU * edgeFit(TX(1032), TX(1032) + 300, AXIS_Y - 48, AXIS_Y - 22)}>
                  <path d={`M ${TX(1032) + 3} ${AXIS_Y - 24} v -6 H ${lerp(TX(1032) + 3, TX(1048), afU)} v 6`} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
                  <text x={TX(1032) + 3} y={AXIS_Y - 35} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                    advanceFrame plans the frame at 1048
                  </text>
                </g>
              )}
              {/* ▲ event evaluations · ◆ settle check */}
              {[1045, 1061].map((ms) => (
                <EvalMark key={ms} kind="event" x={TX(ms)} y={EVAL_Y} opacity={marks[0]} />
              ))}
              <EvalMark kind="event" x={TX(1125) + 17} y={EVAL_Y} opacity={0.3 * marks[0] * edgeFit(TX(1125) + 3, TX(1125) + 31, EVAL_Y - 8, EVAL_Y + 8)} />
              <EvalMark kind="event" x={TX(1141)} y={EVAL_Y} opacity={0.3 * marks[0] * edgeFit(TX(1141) - 14, TX(1141) + 14, EVAL_Y - 8, EVAL_Y + 8)} />
              <EvalMark kind="settle" x={TX(1125)} y={EVAL_Y} opacity={marks[1]} />
              {/* legend */}
              <Chip x={250} y={208} text="▲ one per event time" color={colors.WARM} opacity={legs[0]} />
              <Chip x={432} y={208} text="● one at the frame" color={colors.TEAL} opacity={legs[2]} />
              <Chip x={592} y={208} text="◆ a settle check every 64 ms: a resting spring may stop" color={colors.SECONDARY} opacity={legs[1]} />

              {/* B3: 3 ms brackets + two evaluations */}
              {b3U > 0.01 &&
                [
                  [1045, 1048],
                  [1061, 1064],
                ].map(([a, b]) => (
                  <g key={a} opacity={b3U * edgeFit((TX(a) + TX(b)) / 2 - 76, (TX(a) + TX(b)) / 2 + 76, EVAL_Y + 10, EVAL_Y + 38)}>
                    <path d={`M ${TX(a)} ${EVAL_Y + 12} v 5 H ${TX(b)} v -5`} fill="none" stroke={colors.TEXT} strokeWidth={1.4} />
                    <text x={(TX(a) + TX(b)) / 2} y={EVAL_Y + 34} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      3 ms · 2 evaluations
                    </text>
                  </g>
                ))}
              {/* B3: 4 ms spring steps from the release; first settle check */}
              {combU > 0.01 && (
                <g opacity={combU}>
                  {Array.from({ length: 17 }, (_, k) => 1061 + 4 * k).map((ms, k) =>
                    k / 16 <= combU ? <line key={ms} x1={TX(ms)} y1={AXIS_Y - 4} x2={TX(ms)} y2={AXIS_Y + 4} stroke={colors.SECONDARY} strokeWidth={1.2} opacity={0.75} /> : null,
                  )}
                  <text x={(TX(1061) + TX(1125)) / 2 + 30} y={AXIS_Y - 30} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={UI}
                    opacity={edgeFit((TX(1061) + TX(1125)) / 2 - 190, (TX(1061) + TX(1125)) / 2 + 250, AXIS_Y - 44, AXIS_Y - 26)}>
                    4 ms spring steps from the release · 4 per frame (derived)
                  </text>
                </g>
              )}
              {settleU > 0.01 && (
                <g opacity={settleU}>
                  <LensRing x={TX(1125)} y={EVAL_Y} r={14} opacity={settleU} />
                  <text x={TX(1125) - 22} y={EVAL_Y + 34} textAnchor="end" fill={colors.SECONDARY} fontSize={13} fontFamily={UI}
                    opacity={edgeFit(TX(1125) - 400, TX(1125) - 20, EVAL_Y + 20, EVAL_Y + 38)}>
                    first settle check, 64 ms after the release (derived)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* B4: the evaluation we follow */}
          {pickU > 0.01 && (
            <g>
              <EvalMark kind="event" x={TX(1061)} y={EVAL_Y} opacity={pickU} r={7} />
              <LensRing x={TX(1061)} y={EVAL_Y} r={16} opacity={pickU} />
              <text x={TX(1061)} y={EVAL_Y + 36} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={pickU}>
                the evaluation at 1061 ms
              </text>
            </g>
          )}

          {/* ======================== the table ======================== */}
          {tableU > 0.01 && (
            <g opacity={tableU * opTable * edgeFit(cellX(0), cellX(19) + CELL_W + 52, TABLE_Y - 8, TABLE_Y + CELL_H + 30)}>
              {CELLS.map((c, i) => {
                const u = clamp01(tableU * 1.6 - (i / 19) * 0.6);
                return (
                  <CellChip key={i} x={cellX(i)} y={TABLE_Y} value={tableValue(i)} kind={c.kind} opacity={u}
                    flash={Math.max(writeFlash(i), copyFlash(i))} />
                );
              })}
              {GROUPS.map((gr) => {
                const x0 = cellX(gr.from);
                const x1 = cellX(gr.to) + CELL_W;
                const yb = TABLE_Y + CELL_H + 8;
                return (
                  <g key={gr.label} opacity={clamp01(tableU * 2 - 1)}>
                    {gr.to > gr.from && <path d={`M ${x0 + 2} ${yb} v 4 H ${x1 - 2} v -4`} fill="none" stroke={colors.MUTED} strokeWidth={1} opacity={0.7} />}
                    <text x={gr.align === 'end' ? x1 - 4 : (x0 + x1) / 2} y={yb + 18} textAnchor={gr.align ?? 'middle'}
                      fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {gr.label}
                    </text>
                  </g>
                );
              })}
              <text x={cellX(19) + CELL_W + 12} y={TABLE_Y + 19} fill={colors.TEXT} fontSize={14} fontFamily={UI} opacity={clamp01(tableU * 2 - 1)}>
                table
              </text>
              {/* B6: the table is untouched by the frame's own evaluation */}
              {keepU > 0.01 && (
                <g opacity={keepU}>
                  <rect x={cellX(0) - 6} y={TABLE_Y - 6} width={cellX(19) + CELL_W - cellX(0) + 12} height={CELL_H + 12} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
                  <Chip x={cellX(10)} y={TABLE_Y - 14} text="table unchanged" color={colors.POSITIVE} anchor="middle" />
                </g>
              )}
            </g>
          )}

          {/* B4: write arrows from the host band into the cells */}
          {writeU > 0.01 && writeU < WRITES.length + 2.5 && (
            <g opacity={opTable}>
              {WRITES.map((w, gi) => {
                const u = win(writeU, gi, gi + 0.35);
                const fade = 1 - win(writeU, gi + 1.2, gi + 1.8);
                if (u <= 0 || fade <= 0) return null;
                const cxs = w.cells.map((ci) => cellX(ci) + CELL_W / 2);
                const mid = (Math.min(...cxs) + Math.max(...cxs)) / 2;
                const callOp = win(writeU, gi + 0.05, gi + 0.3) * (1 - win(writeU, gi + 0.85, gi + 1.0));
                const label = (
                  <Chip key={`l${gi}`} x={Math.min(1080, Math.max(170, mid))} y={TABLE_Y + CELL_H + 72} anchor="middle" mono color={colors.TEAL}
                    text={`${w.label} ← ${w.values.join(', ')}`} opacity={callOp} />
                );
                return [label, ...w.cells.map((ci) => {
                  const x = cellX(ci) + CELL_W / 2;
                  return (
                    <g key={`${gi}-${ci}`} opacity={fade}>
                      <line x1={x} y1={TOP.y + TOP.h - 4} x2={x} y2={lerp(TOP.y + TOP.h - 4, TABLE_Y - 3, u)} stroke={colors.TEAL} strokeWidth={2.2} opacity={0.8} />
                      {u > 0.9 && <polygon points={`${x - 5},${TABLE_Y - 9} ${x + 5},${TABLE_Y - 9} ${x},${TABLE_Y - 2}`} fill={colors.TEAL} />}
                    </g>
                  );
                })];
              })}
            </g>
          )}

          {/* ======================== the program block ======================== */}
          {progOp > 0.01 && (
            <g opacity={progOp * edgeFit(pb.x, pb.x + pb.w, pb.y, pb.y + pb.h)}>
              <rect x={pb.x} y={pb.y} width={pb.w} height={pb.h} rx={14} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="7 5" />
              <text x={pb.x + 16} y={pb.y + 22} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                program · a fixed list of operations (layers, schematic)
              </text>
              {/* layer stack */}
              <g opacity={stackOp}>
                {STACK.map((n, k) => {
                  const x = pb.x + 40 + (k * (pb.w - 80)) / (STACK.length - 1);
                  const sweepX = pb.x + 20 + (pb.w - 40) * Math.max(sweepU, ghostSweepU);
                  const lit = (sweepU > 0.001 || ghostSweepU > 0.001) && x < sweepX;
                  const sc = lerp(1.3, 1, sandU);
                  return Array.from({ length: n }, (_, j) => (
                    <rect key={`${k}-${j}`} x={x - 7 * sc} y={pbc.y + 12 * sc - (n * 11 * sc) / 2 + j * 11 * sc} width={14 * sc} height={8 * sc} rx={2}
                      fill={lit ? colors.WARM : colors.MUTED} opacity={lit ? 0.95 : 0.45} />
                  ));
                })}
                {(sweepU > 0.001 && sweepU < 0.999) || (ghostSweepU > 0.001 && ghostSweepU < 0.999) ? (
                  <rect x={pb.x + 20 + (pb.w - 40) * Math.max(sweepU, ghostSweepU) - 3} y={pb.y + 30} width={6} height={pb.h - 40} rx={3} fill={colors.WARM} opacity={0.8} />
                ) : null}
              </g>
              {sweepU > 0.01 && (
                <text x={pb.x + pb.w - 16} y={pb.y + 22} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={MONO} opacity={clamp01(sweepU * 3)}>
                  evaluate(values): every operation, every time
                </text>
              )}
              {ghostSweepU > 0.01 && ghostSweepU < 1.5 && (
                <text x={pb.x + pb.w - 16} y={pb.y + 22} textAnchor="end" fill={colors.TEAL} fontSize={13} fontFamily={MONO} opacity={clamp01(ghostSweepU * 3) * (1 - crumbleU)}>
                  the frame at 1064: evaluated on the copy
                </text>
              )}
              {/* crossed icons inside */}
              {iconOp > 0.01 && (
                <g opacity={iconOp}>
                  {ICONS.map((Icon, k) => {
                    const x = pbc.x + (k - 1) * 150 * iconScale;
                    const y = pbc.y - 2 * iconScale;
                    return (
                      <g key={k}>
                        <circle cx={x} cy={y} r={27 * iconScale} fill={colors.PANEL} />
                        <Icon x={x} y={y} s={iconScale} color={colors.TEXT} />
                        <Cross x={x} y={y} r={22 * iconScale} u={clamp01(crossU * 1.1)} />
                      </g>
                    );
                  })}
                  <text x={pbc.x} y={pb.y + pb.h - 14} textAnchor="middle" fill={colors.TEXT} fontSize={lerp(16, 14, sandU)} fontFamily={UI}>
                    {finalU > 0.5 ? 'inside: no loop · no early exit' : 'inside: no waiting · no listening · no loop'}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* B4: the grid refusal */}
          {errU > 0.01 && (
            <g opacity={errU}>
              <line x1={cellX(6) + CELL_W / 2} y1={TABLE_Y + CELL_H + 4} x2={cellX(6) + CELL_W / 2} y2={326} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <rect x={cellX(6) - 120} y={326} width={430} height={50} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <text x={cellX(6) - 106} y={346} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                down.x must be a multiple of 0.015625
              </text>
              <text x={cellX(6) - 106} y={366} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                off the 1/64 px grid is refused, not rounded
              </text>
            </g>
          )}

          {/* ======================== next values slot ======================== */}
          {sandU > 0.01 && (
            <g opacity={sandU * opNext * edgeFit(cellX(0), cellX(19) + CELL_W + 60, NEXT_Y - 4, NEXT_Y + CELL_H + 26)}>
              {CELLS.map((c, i) => {
                const u = clamp01(nextU * 1.6 - (i / 19) * 0.6);
                return (
                  <g key={i}>
                    <CellChip x={cellX(i)} y={NEXT_Y} kind={c.kind} dashed opacity={0.4 * (1 - u)} />
                    {u > 0.01 && <CellChip x={cellX(i)} y={NEXT_Y} kind={c.kind} value={NEXT[i]} opacity={u} flash={CHANGED[i] ? 0.6 : 0} />}
                  </g>
                );
              })}
              {ghostU > 0.5 && crumbleU < 0.5 ? (
                <text x={cellX(19) + CELL_W + 12} y={NEXT_Y + 19} fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
                  copy
                </text>
              ) : (
                <>
                  <text x={cellX(19) + CELL_W + 12} y={NEXT_Y + 12} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                    next
                  </text>
                  <text x={cellX(19) + CELL_W + 12} y={NEXT_Y + 27} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                    values
                  </text>
                </>
              )}
              {nextU > 0.3 && (
                <g opacity={clamp01((nextU - 0.3) * 2) * (1 - clamp01(copyU * 3))}>
                  {[5, 9, 10].map((i) => (
                    <text key={i} x={cellX(i) + CELL_W / 2} y={NEXT_Y + CELL_H + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      {CELLS[i].name}
                    </text>
                  ))}
                </g>
              )}
            </g>
          )}
          {nextU > 0.5 && copyU < 0.02 && (
            <Chip x={cellX(18) + CELL_W / 2} y={BOT.y + 27} text="thumb: derived by hand" color={colors.MUTED} anchor="middle" opacity={clamp01((nextU - 0.5) * 2) * opNext} />
          )}

          {/* B5: copy the next values back over the table */}
          {copyU > 0.001 && copyU < 0.999 && (
            <g>
              {CELLS.map((c, i) => {
                const l = copyLand(i);
                if (!CHANGED[i] || l <= 0 || l >= 1) return null;
                const y = lerp(NEXT_Y, TABLE_Y, ease.move(l));
                return <CellChip key={i} x={cellX(i)} y={y} kind={c.kind} value={NEXT[i]} flash={1} opacity={0.9} />;
              })}
              <text x={SLOT.x + SLOT.w / 2} y={SLOT.y + SLOT.h + 16} textAnchor="middle" fill={colors.TEAL} fontSize={14} fontFamily={MONO}>
                source.set(result.nextValues)
              </text>
            </g>
          )}
          {/* B5: the copy-back arrow, gated on evaluation.writesBack (toggle.ts:130); 1061 is an event evaluation */}
          {gateU > 0.01 && (
            <g opacity={clamp01(gateU)}>
              <line x1={56} y1={NEXT_Y - 6} x2={56} y2={TABLE_Y + CELL_H + 16} stroke={colors.TEAL} strokeWidth={2} />
              <polygon points={`${50},${TABLE_Y + CELL_H + 18} ${62},${TABLE_Y + CELL_H + 18} ${56},${TABLE_Y + CELL_H + 8}`} fill={colors.TEAL} />
              <Chip x={44} y={378} text="writesBack? yes" mono color={colors.POSITIVE} />
              <text x={50} y={404} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                an event evaluation
              </text>
            </g>
          )}

          {/* B6: the ghost copy (copy.set(source)) — evaluated, then discarded */}
          {ghostU > 0.01 && crumbleU < 0.999 && (
            <g>
              {CELLS.map((c, i) => {
                const fall = clamp01(crumbleU * 1.5 - ((i * 7) % 20) / 40);
                const y = lerp(TABLE_Y, NEXT_Y, ease.move(clamp01(ghostU * 1.4 - (i / 19) * 0.4))) + fall * 26;
                return (
                  <CellChip key={i} x={cellX(i)} y={y} kind={c.kind} value={NEXT[i]} dashed opacity={0.85 * clamp01(ghostU * 3) * (1 - fall)} scale={1 - 0.6 * fall} />
                );
              })}
            </g>
          )}
          {ghostOutU > 0.01 && (
            <g opacity={ghostOutU * (1 - 0.5 * crumbleU)}>
              <path d={`M ${SLOT.x + SLOT.w + 4} ${SLOT.y + 70} C ${1150} ${SLOT.y + 70}, ${1150} ${470}, ${OUT_CHIP.x + 120} ${OUT_CHIP.y - 2}`} fill="none" stroke={colors.TEAL} strokeWidth={2}
                strokeDasharray="6 5" />
              <text x={1170} y={SLOT.y + 58} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                outputs → page
              </text>
            </g>
          )}

          {/* ======================== bottom band: queue + page ======================== */}
          {sandU > 0.01 && (
            <g opacity={sandU * opBottom}>
              <g opacity={(1 - codeCover) * queueFit}>
                <text x={QUEUE.x} y={QUEUE.y - 8} fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                  queue
                </text>
                <rect x={QUEUE.x} y={QUEUE.y} width={QUEUE.w} height={QUEUE.h} rx={8} fill="none" stroke={colors.TEAL} strokeOpacity={0.6} strokeDasharray="5 4" />
                {[
                  { u: q1U, x: QUEUE.x + 10, text: 'down · 640, 400 · 1045' },
                  { u: q2U, x: QUEUE.x + 226, text: 'up · 640, 400 · 1061' },
                ].map((q, k) =>
                  q.u > 0.01 ? (
                    <g key={k} opacity={clamp01(q.u * 2) * (1 - drainU)}>
                      <rect x={lerp(TRACK.x, q.x, q.u)} y={QUEUE.y + 8} width={208} height={28} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
                      <text x={lerp(TRACK.x, q.x, q.u) + 104} y={QUEUE.y + 27} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        {q.text}
                      </text>
                    </g>
                  ) : null,
                )}
                {drainU > 0.5 && (
                  <text x={QUEUE.x + QUEUE.w / 2} y={QUEUE.y + 27} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(drainU * 2 - 1)}>
                    queued = [] (handed to advanceFrame)
                  </text>
                )}
              </g>
              {/* the page */}
              {pageU > 0.01 && (
                <g opacity={pageU * edgeFit(TRACK.x, TRACK.x + TRACK.w + 150, QUEUE.y - 22, TRACK.y + TRACK.h)}>
                  <text x={TRACK.x} y={QUEUE.y - 8} fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                    page
                  </text>
                  <rect x={TRACK.x} y={TRACK.y} width={TRACK.w} height={TRACK.h} rx={TRACK.h / 2} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.6} />
                  <rect x={TRACK.x} y={TRACK.y} width={TRACK.w} height={TRACK.h} rx={TRACK.h / 2} fill={colors.POSITIVE} opacity={0.75 * clamp01(thumbPx / 20)} />
                  <circle cx={TRACK.x + 32 + 2 * thumbPx} cy={TRACK.y + TRACK.h / 2} r={24} fill={colors.TEXT} />
                  {pointer && drainU < 0.99 && (
                    <g opacity={1 - drainU}>
                      <circle cx={pointer.x} cy={pointer.y} r={6} fill={colors.WARM} />
                      {pointer.ring > 0 && pointer.ring < 1 && (
                        <circle cx={pointer.x} cy={pointer.y} r={8 + 22 * pointer.ring} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={1 - pointer.ring} />
                      )}
                      <text x={TRACK.x + TRACK.w + 16} y={TRACK.y + 26} fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={clamp01(pressU)}>
                        {pointer.up ? 'release' : 'press'}
                      </text>
                    </g>
                  )}
                  {pressU > 1.6 && drainU < 0.99 && (
                    <text x={TRACK.x + TRACK.w + 16} y={TRACK.y + 50} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(pressU - 1.6) * 2 * (1 - drainU)}>
                      nothing changes yet
                    </text>
                  )}
                </g>
              )}
            </g>
          )}

          {/* B7: six outputs slide out of the program into the page */}
          {outU > 0.01 && (
            <g>
              {[
                { name: 'trackLeft', v: '614' },
                { name: 'thumbOffset', v: (outU > 0.5 ? OUT_FRAMES[tickIdx].thumb : 0).toFixed(2) },
                { name: 'trackTop', v: '384' },
                { name: 'on', v: '1' },
                { name: 'active', v: '1' },
                { name: 'armed', v: '0' },
              ].map((o, k) => {
                const col = k % 2;
                const row = Math.floor(k / 2);
                const tx = OUT_CHIP.x + col * OUT_CHIP.dx;
                const ty = OUT_CHIP.y + row * OUT_CHIP.dy;
                const u = ease.move(clamp01(outU * 1.5 - k * 0.1));
                const x = lerp(SLOT.x + SLOT.w - 130, tx, u);
                const y = lerp(SLOT.y + 50 + k * 8, ty, u);
                const live = k === 1 && tickU > 0.01;
                return (
                  <g key={o.name} opacity={clamp01(outU * 3) * Math.max(opBottom, 0.1) * edgeFit(x, x + OUT_CHIP.w, y, y + OUT_CHIP.h)}>
                    <rect x={x} y={y} width={OUT_CHIP.w} height={OUT_CHIP.h} rx={6} fill={colors.PANEL} stroke={live ? colors.WARM : colors.POSITIVE} strokeWidth={1.3} />
                    <text x={x + 8} y={y + 17} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {o.name}
                      <tspan fill={live ? colors.WARM : colors.POSITIVE}> {o.v}</tspan>
                    </text>
                  </g>
                );
              })}
              <text x={TRACK.x} y={TRACK.y + TRACK.h + 18} fill={colors.MUTED} fontSize={13} fontFamily={UI}
                opacity={clamp01(tickU * 3) * opBottom * edgeFit(TRACK.x, TRACK.x + 360, TRACK.y + TRACK.h + 4, TRACK.y + TRACK.h + 22)}>
                frame {OUT_FRAMES[tickIdx].timeMs} ms · thumb offset per frame (derived)
              </text>
            </g>
          )}
          {backU > 0.01 && (
            <g opacity={backU * opBottom}>
              <path d={`M ${TRACK.x - 10} ${QUEUE.y + 22} H ${lerp(TRACK.x - 10, QUEUE.x + QUEUE.w + 8, backU)}`} stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 4" />
              {backU > 0.9 && <polygon points={`${QUEUE.x + QUEUE.w + 2},${QUEUE.y + 22} ${QUEUE.x + QUEUE.w + 12},${QUEUE.y + 16} ${QUEUE.x + QUEUE.w + 12},${QUEUE.y + 28}`} fill={colors.WARM} />}
              <text x={(TRACK.x + QUEUE.x + QUEUE.w) / 2} y={QUEUE.y + 50} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={UI}>
                events only
              </text>
              {/* the page push fades the queue box (it would be cut at the left edge): name the arrow's target instead */}
              <text x={QUEUE.x + QUEUE.w - 4} y={QUEUE.y + 27} textAnchor="end" fill={colors.TEAL} fontSize={13} fontFamily={UI} opacity={clamp01((backU - 0.8) * 5) * (1 - queueFit)}>
                queue
              </text>
            </g>
          )}

          {/* B11: the host's three abilities, back in the bands */}
          {finalU > 0.01 && (
            <g opacity={finalU}>
              {[
                { k: 0, x: 470, y: TOP.y + 64 },
                { k: 2, x: 810, y: TOP.y + 64 },
                { k: 1, x: 640, y: BOT.y + 56 },
              ].map(({ k, x, y }) => {
                const Icon = ICONS[k];
                return (
                  <g key={k}>
                    <rect x={x - 38} y={y - 36} width={150} height={72} rx={36} fill={colors.BG} opacity={0.92} />
                    <Icon x={x} y={y} s={1.4} color={colors.TEAL} />
                    <Tick x={x + 32} y={y + 14} s={1.1} />
                    <text x={x + 52} y={y + 6} fill={colors.TEAL} fontSize={16} fontFamily={UI}>
                      {ICON_WORDS[k]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ======================== B6 part 2: four frame rates, one stored table ======================== */}
          {ratesU > 0.01 && (
            <g opacity={ratesU}>
              <rect x={150} y={298} width={980} height={198} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={170} y={322} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                illustration: same events, four frame rates
                <tspan fill={colors.MUTED} fontSize={13}>
                  {' · '}the rule of behavior-choices.md:48; replay-tested in window-manager.test.ts
                </tspan>
              </text>
              <text x={810} y={346} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                stored table (20 cells)
              </text>
              {[120, 60, 30, 10].map((fps, k) => {
                const y = 368 + k * 34;
                const X = (ms: number) => 270 + ((ms - 1000) * 500) / 180;
                const pitch = 1000 / fps;
                const ticks = Array.from({ length: Math.floor(180 / pitch) + 1 }, (_, j) => 1000 + j * pitch);
                const lu = clamp01(ratesU * 2 - 0.4 - k * 0.15);
                return (
                  <g key={fps} opacity={lu}>
                    <text x={252} y={y + 5} textAnchor="end" fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                      {fps} fps
                    </text>
                    <line x1={X(1000)} y1={y} x2={X(1180)} y2={y} stroke={colors.MUTED} strokeWidth={1} />
                    {ticks.map((ms) => (
                      <line key={ms} x1={X(ms)} y1={y - 6} x2={X(ms)} y2={y + 6} stroke={colors.TEAL} strokeWidth={1.4} />
                    ))}
                    {[1045, 1061].map((ms) => (
                      <polygon key={ms} points={`${X(ms) - 5},${y - 13} ${X(ms) + 5},${y - 13} ${X(ms)},${y - 5}`} fill={colors.WARM} />
                    ))}
                    {/* barcode of the stored table */}
                    {CELLS.map((c, i) => {
                      const bu = clamp01(barsU * 20 - i);
                      if (bu <= 0) return null;
                      const v = NEXT[i];
                      return <rect key={i} x={810 + i * 13} y={y - 10} width={11} height={20} fill={KIND_COLOR[c.kind]} opacity={bu * (v !== 0 ? 0.95 : 0.22)} />;
                    })}
                    {k > 0 && eqU > 0.01 && (
                      <text x={1086} y={y - 12} fill={colors.POSITIVE} fontSize={16} fontFamily={MONO} fontWeight={700} opacity={eqU}>
                        =
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={270} y={486} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                ▼ events at 1045 and 1061 ms · teal: frame ticks · barcode lit = non-zero cell
              </text>
            </g>
          )}

          {/* B3: the settle-check interval (above the dimmed table) */}
          {settleU > 0.01 && (
            <g opacity={settleU * opTL}>
                  <rect x={760} y={232} width={420} height={76} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                  <MathLabel tex={'64\\ \\mathrm{ms}=16\\times 4\\ \\mathrm{ms}'} x={970} y={258} fontSize={22} color={colors.TEXT} boxWidth={400} />
                  <text x={970} y={296} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    derived: stepMs 4 × settleCheckSteps 16
                  </text>
            </g>
          )}

          {/* ======================== world code chips ======================== */}
          <CodeChip x={130} y={436} lines={C3A} stripe={colors.TEAL} opacity={s.get(scene.codeA)} />
          <CodeChip x={540} y={44} lines={C3B} stripe={colors.TEAL} opacity={s.get(scene.codeB)} />
          <CodeChip x={100} y={508} lines={C3C} stripe={colors.TEAL} opacity={s.get(scene.codeC)} />
          <CodeChip x={100} y={508} lines={C3D} stripe={colors.TEAL} opacity={s.get(scene.codeD)} />
          <CodeChip x={100} y={508} lines={C3E} stripe={colors.TEAL} opacity={s.get(scene.codeE)} />
          <CodeChip x={392} y={438} lines={C3F} stripe={colors.TEAL} opacity={s.get(scene.codeF)} />
        </g>

        {/* ======================== B8–B9 · the two-lane comparator ======================== */}
        {cmpU > 0.01 && (
          <g opacity={cmpU}>
            <g opacity={lanesOp * edgeFit(CMP_X0 - 50, CMP_X1, LANE_A - 30, LANE_B + 66)}>
              {[
                { y: LANE_A, title: 'toggle.ts — the program, 32-bit floats', color: colors.TEXT },
                { y: LANE_B, title: 'toggle-reference.ts — plain JavaScript, 64-bit floats', color: colors.MUTED },
              ].map((lane, li) => (
                <g key={li}>
                  <text x={CMP_X0} y={lane.y - 14} fill={lane.color} fontSize={14} fontFamily={MONO}>
                    {lane.title}
                  </text>
                  {['on', 'armed'].map((row, ri) => (
                    <g key={row}>
                      <text x={CMP_X0 - 8} y={lane.y + ri * 22 + 14} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                        {row}
                      </text>
                      <rect x={CMP_X0} y={lane.y + ri * 22} width={CMP_X1 - CMP_X0} height={18} fill="none" stroke={colors.GRID} />
                      {REF.map((r, i) => {
                        const b = ri === 0 ? r.on : r.armed;
                        if (!b) return null;
                        return <rect key={i} x={fx(i) + 0.5} y={lane.y + ri * 22 + 1} width={FW - 1} height={16} fill={colors.WARM} opacity={0.9} />;
                      })}
                    </g>
                  ))}
                  {li === 0 &&
                    REF.map((r, i) =>
                      r.hasEvent ? <polygon key={i} points={`${fx(i) + FW / 2 - 3.5},${lane.y - 7} ${fx(i) + FW / 2 + 3.5},${lane.y - 7} ${fx(i) + FW / 2},${lane.y - 2}`} fill={colors.WARM} opacity={0.8} /> : null,
                    )}
                </g>
              ))}
              {/* green agreement ticks as the scan passes */}
              {REF.map((_, i) =>
                i <= scanI ? <line key={i} x1={fx(i) + FW / 2} y1={LANE_A + 48} x2={fx(i) + FW / 2} y2={LANE_B - 34} stroke={colors.POSITIVE} strokeWidth={1.6} /> : null,
              )}
              {scanU >= 0 && scanU < N_FRAMES - 1 + 0.5 && (
                <g>
                  <line x1={fx(scanU) + FW / 2} y1={LANE_A - 30} x2={fx(scanU) + FW / 2} y2={LANE_B + 50} stroke={colors.TEXT} strokeWidth={1.5} opacity={scanU >= N_FRAMES - 1 ? 0 : 0.9} />
                </g>
              )}
              <text x={CMP_X1} y={LANE_B + 62} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                scripted trace, frame by frame →{scanI >= N_FRAMES - 1 ? '  every frame equal' : ''}
              </text>
              {exactU > 0.01 && (
                <g opacity={exactU * b9Op}>
                  <text x={CMP_X0} y={LANE_B + 62} fill={colors.POSITIVE} fontSize={14} fontFamily={UI}>
                    exactly equal every frame: on · armed · trackLeft · trackTop
                  </text>
                </g>
              )}
            </g>

            {/* B9: the thumb curve and the loupe */}
            {curveU > 0.01 && (
              <g opacity={b9Op}>
                <text x={CMP_X0} y={CURVE_Y1 - 12} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  thumbOffset per frame, from toggle-reference.ts (derived) · one line stands for both lanes
                </text>
                <line x1={CMP_X0} y1={CURVE_Y0} x2={CMP_X1} y2={CURVE_Y0} stroke={colors.GRID} />
                <line x1={CMP_X0} y1={CURVE_Y1} x2={CMP_X1} y2={CURVE_Y1} stroke={colors.GRID} strokeDasharray="3 4" />
                <text x={CMP_X0 - 8} y={CURVE_Y0 + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  0
                </text>
                <text x={CMP_X0 - 8} y={CURVE_Y1 + 4} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  20
                </text>
                <path
                  d={REF.slice(0, Math.max(2, Math.ceil(curveU * N_FRAMES)))
                    .map((r, i) => `${i ? 'L' : 'M'} ${fx(i) + FW / 2} ${cy(r.thumb)}`)
                    .join(' ')}
                  fill="none" stroke={colors.WARM} strokeWidth={2.4} strokeLinejoin="round"
                />
                {loupeU > 0.01 && (
                  <g opacity={loupeU}>
                    <LensRing x={fx(FOCUS_FRAME) + FW / 2} y={cy(REF[FOCUS_FRAME].thumb)} r={13} opacity={loupeU}
                      leader={[WINDOW.x, WINDOW.y + 8]} />
                    <g transform={`translate(${WINDOW.x + WINDOW.w / 2} ${WINDOW.y + WINDOW.h / 2}) scale(${0.6 + 0.4 * loupeU}) translate(${-(WINDOW.x + WINDOW.w / 2)} ${-(WINDOW.y + WINDOW.h / 2)})`}>
                      <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} rx={12} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.5} />
                      <line x1={WINDOW.x + 20} y1={WINDOW.y + 70} x2={WINDOW.x + WINDOW.w - 20} y2={WINDOW.y + 38} stroke={colors.WARM} strokeWidth={2.5} />
                      <line x1={WINDOW.x + 20} y1={WINDOW.y + 73} x2={WINDOW.x + WINDOW.w - 20} y2={WINDOW.y + 41} stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray="6 4" />
                      <path d={`M ${WINDOW.x + 300} ${WINDOW.y + 44} h 10 M ${WINDOW.x + 305} ${WINDOW.y + 44} v 5 M ${WINDOW.x + 300} ${WINDOW.y + 49} h 10`} stroke={colors.TEXT} strokeWidth={1.2} />
                      <text x={WINDOW.x + 318} y={WINDOW.y + 66} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                        {'< 0.00001 px'}
                      </text>
                      <text x={WINDOW.x + 16} y={WINDOW.y + 22} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                        program (FP32)
                      </text>
                      <text x={WINDOW.x + 140} y={WINDOW.y + 22} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                        reference (float64)
                      </text>
                      <text x={WINDOW.x + 16} y={WINDOW.y + WINDOW.h - 10} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                        magnified, schematic: the gap is too thin to draw
                      </text>
                    </g>
                  </g>
                )}
                {chipsU > 0.01 && (
                  <g>
                    <MathLabel tex={'|\\Delta\\,\\mathrm{thumb}| < 10^{-5}\\ \\mathrm{px}'} x={CMP_X0} y={488} fontSize={22} anchor="start" opacity={clamp01(chipsU * 3)} boxWidth={600} />
                    <CodeChip x={CMP_X0} y={512} lines={C3G} stripe={colors.POSITIVE} opacity={clamp01(chipsU * 3 - 0.3)} />
                    <Chip x={CMP_X0} y={570} text="measured: at most 1.3e-6 px over a 20 px travel" color={colors.TEXT} opacity={clamp01(chipsU * 3 - 1)} />
                    <Chip x={CMP_X0} y={604} text="38 frames the clock runs · rest at 20 px" color={colors.TEXT} opacity={clamp01(chipsU * 3 - 1.6)} />
                  </g>
                )}
              </g>
            )}

            {/* B10: the 1/64 px rulers */}
            {rulerU > 0.01 && (
              <g opacity={rulersOp}>
                {/* left edge */}
                <g opacity={rulerU * (1 - 0.85 * cornerU) * leftFit}>
                  <text x={rlx(613.96875)} y={366} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                    the left edge, x = 614 · ticks every 1/64 px
                  </text>
                  <rect x={rlx(614)} y={404} width={(rlx(614.03125) - rlx(614)) * rulerU + 40} height={RL.y - 404} fill={colors.TEAL} opacity={0.16} />
                  <text x={rlx(614) + 10} y={RL.y - 10} fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                    track
                  </text>
                  <line x1={rlx(613.96875) - 30} y1={RL.y} x2={lerp(rlx(613.96875) - 30, rlx(614.03125) + 40, rulerU)} y2={RL.y} stroke={colors.MUTED} strokeWidth={1.5} />
                  {[-2, -1, 0, 1, 2].map((k) => {
                    const v = 614 + k / 64;
                    const x = rlx(v);
                    const u = clamp01(rulerU * 5 - (k + 2));
                    return (
                      <g key={k} opacity={u}>
                        <line x1={x} y1={RL.y - 8} x2={x} y2={RL.y + 8} stroke={k === 0 ? colors.TEAL : colors.MUTED} strokeWidth={k === 0 ? 2.5 : 1.5} />
                        <text x={x} y={RL.y + 26} textAnchor="middle" fill={k === 0 ? colors.TEAL : colors.MUTED} fontSize={13} fontFamily={MONO}>
                          {v}
                        </text>
                      </g>
                    );
                  })}
                  <line x1={rlx(614)} y1={392} x2={rlx(614)} y2={RL.y} stroke={colors.TEAL} strokeWidth={1.5} strokeDasharray="4 3" />
                </g>
                {dot1U > 0.01 && (
                  <g opacity={clamp01(dot1U * 2) * (1 - 0.85 * cornerU) * leftFit}>
                    <circle cx={rlx(613.984375)} cy={436} r={7 * (0.6 + 0.4 * dot1U)} fill={colors.NEGATIVE} />
                    <text x={rlx(613.984375) - 14} y={414} textAnchor="end" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                      613.984375
                    </text>
                    <text x={rlx(613.984375) - 46} y={441} textAnchor="end" fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      no arm · armed
                    </text>
                    <BitDisc x={rlx(613.984375) - 28} y={436} b={0} />
                  </g>
                )}
                {dot2U > 0.01 && (
                  <g opacity={clamp01(dot2U * 2) * (1 - 0.85 * cornerU) * leftFit}>
                    <circle cx={rlx(614)} cy={436} r={7 * (0.6 + 0.4 * dot2U)} fill={colors.POSITIVE} />
                    <text x={rlx(614) + 14} y={414} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                      614, 384
                    </text>
                    <text x={rlx(614) + 14} y={441} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      arms · armed
                    </text>
                    <BitDisc x={rlx(614) + 128} y={436} b={1} />
                  </g>
                )}

                {/* bottom-right corner */}
                <g opacity={cornerU * cornerFit}>
                  <text x={rcx(665.96875)} y={258} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
                    the bottom right corner · x &lt; 666 and y &lt; 416 are inside
                  </text>
                  <rect x={rcx(665.96875) - 30} y={rcy(415.984375) - 40} width={rcx(666) - rcx(665.96875) + 30} height={rcy(416) - rcy(415.984375) + 40} fill={colors.TEAL} opacity={0.16} />
                  <line x1={rcx(666)} y1={rcy(415.984375) - 50} x2={rcx(666)} y2={rcy(416) + 30} stroke={colors.TEAL} strokeWidth={1.5} strokeDasharray="4 3" />
                  <line x1={rcx(665.96875) - 30} y1={rcy(416)} x2={rcx(666) + 30} y2={rcy(416)} stroke={colors.TEAL} strokeWidth={1.5} strokeDasharray="4 3" />
                  <text x={rcx(666) - 8} y={rcy(416) - 8} textAnchor="end" fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                    track
                  </text>
                  <line x1={rcx(665.96875) - 30} y1={RL.y} x2={rcx(666.03125) + 30} y2={RL.y} stroke={colors.MUTED} strokeWidth={1.5} />
                  {[-2, -1, 0, 1, 2].map((k) => {
                    const v = 666 + k / 64;
                    const x = rcx(v);
                    return (
                      <g key={k} opacity={clamp01(cornerU * 5 - (k + 2))}>
                        <line x1={x} y1={RL.y - 8} x2={x} y2={RL.y + 8} stroke={k === 0 ? colors.TEAL : colors.MUTED} strokeWidth={k === 0 ? 2.5 : 1.5} />
                        <text x={x} y={RL.y + 26} textAnchor="middle" fill={k === 0 ? colors.TEAL : colors.MUTED} fontSize={13} fontFamily={MONO}>
                          {v}
                        </text>
                      </g>
                    );
                  })}
                  <text x={rcx(666) + 8} y={rcy(416) + 20} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                    x = 666 · y = 416
                  </text>
                </g>
                {dot3U > 0.01 && (
                  <g opacity={clamp01(dot3U * 2) * cornerFit}>
                    <circle cx={rcx(666)} cy={292} r={7 * (0.6 + 0.4 * dot3U)} fill={colors.NEGATIVE} />
                    <text x={rcx(666) + 14} y={290} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                      666, 400
                    </text>
                    <text x={rcx(666) + 14} y={308} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      on the right edge: outside · only disarms
                    </text>
                    <text x={rcx(666) + 14} y={326} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      (y = 400 lies far above this window)
                    </text>
                  </g>
                )}
                {dot4U > 0.01 && (
                  <g opacity={clamp01(dot4U * 2) * cornerFit}>
                    <circle cx={rcx(665.984375)} cy={rcy(415.984375)} r={7 * (0.6 + 0.4 * dot4U)} fill={colors.POSITIVE} />
                    <text x={rcx(665.984375) - 14} y={rcy(415.984375) - 24} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                      665.984375, 415.984375
                    </text>
                    <text x={rcx(665.984375) - 14} y={rcy(415.984375) - 6} textAnchor="end" fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      1/64 px inside the corner · flips · on
                    </text>
                    <BitDisc x={rcx(665.984375) - 26} y={rcy(415.984375) + 16} b={1} />
                  </g>
                )}
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: C3h, title, source chip ======================== */}
      {codeH > 0.01 && (
        <g opacity={codeH}>
          <CodeChip x={40} y={526} lines={C3H} stripe={colors.WARM} note="toggle.test.ts:28-30" />
        </g>
      )}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · The Host Loop
      </text>
      <g>
        <rect x={40} y={48} width={chip.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {chip}
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;

// keep THUMB_MAX referenced for the module-scope sanity check (the travel never exceeds the 40 px state bound)
if (THUMB_MAX > 40) throw new Error('handwired ch3: thumb offset out of the declared bounds');
