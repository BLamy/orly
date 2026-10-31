// Latches, Not History
//
// Event Window — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT), lab/event-window/
//   README.md:11 (a pure feedforward function of the current input and a small bank of latched events)
//   oracle.ts:6-35 (the behavior), 7 (one event per frame), 126-203 oracleTick (ported below, verbatim semantics),
//     151 (pressOnTitle = y − seen.top < titleHeight), 164-170 (distance > slop), 174-187 (commit, toggle),
//     251-265 (draggedPosition and its clamp)
//   circuit.ts:136 buildEventWindowCircuit, 38-80 (cell layout: the press record, slopLatch), 266-284 (latchOnDown),
//     288-302 (chebyshev, slopLatch), 346-388 (toggleBase, commitBase, flipDirection, maximized′), 390-398 (focus)
//   harness.ts:21-112 (closed loop, compared with ===)
//   trace.ts:23-28 (authoredRelations: drag from title, click toggles from body)
//   boundary-probe.test.ts:31-50 (probe config, used as this chapter's stage), 56-89 (the probe: down at (410, 305),
//     move +60, up; the other trace is 3 empty frames; K ∈ {1, 4, 16, 64, 256}; two framings; 460 vs 400)
//   pointer-input.test.ts:7-32 (out 20 px and back cancels the click), pointer-input.ts:9
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 plan; captions are the fixed narration contract
// (verbatim, book.json chapters[0]). Every drawn number comes from the ported oracle run at module scope on the probe
// config, and the scene throws if any of the plan's numbers (410, 305, 400, 300, 460, 980, 4 vs 5 px, 460 vs 400 for
// every K) disagree with it. The pointer path between presses is authored (hover moves change nothing but the
// pointer). Following review.md: the probe's second trace is 3 empty frames (not 256 × 3), and the out-and-back
// uses the lab's 20 px (not 9). The slop gauge is a square: Chebyshev distance has square level sets.
import {
  CAMERA_HOME,
  Camera,
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
const WHISPER = 0.12;

// ---------------------------------------------------------------------------
// The oracle (oracle.ts:126-292), ported: plain code, one tick per frame
// ---------------------------------------------------------------------------

type Kind = 'down' | 'move' | 'up';
type Input = { kind: Kind; x: number; y: number } | null;
type Geo = { left: number; top: number; width: number; height: number };
type St = {
  pointerX: number; pointerY: number; pressed: boolean; pressX: number; pressY: number; pressedRectangle: number;
  grabLeft: number; grabTop: number; pressOnTitle: boolean; pressWasFocused: boolean; pressOnMaximized: boolean;
  slopExceeded: boolean; rectangleLeft: number[]; rectangleTop: number[]; maximized: boolean[]; focused: number; seen: Geo[];
};

// boundary-probe.test.ts:31-50
const CONFIG = {
  viewportWidth: 1280,
  viewportHeight: 800,
  slop: 4,
  titleHeight: 30,
  rectangles: [
    { width: 300, height: 200, initialLeft: 400, initialTop: 300 },
    { width: 250, height: 180, initialLeft: 900, initialTop: 100 },
    { width: 200, height: 150, initialLeft: 100, initialTop: 550 },
    { width: 320, height: 240, initialLeft: 850, initialTop: 480 },
  ],
  // trace.ts:23-28 authoredRelations
  relations: { dragFromTitle: true, dragFromBody: false, clickTogglesFromTitle: false, clickTogglesFromBody: true },
};
const N_RECT = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const dragEnabledOf = (onTitle: boolean) => (onTitle ? CONFIG.relations.dragFromTitle : CONFIG.relations.dragFromBody);
const clickTogglesOf = (onTitle: boolean) => (onTitle ? CONFIG.relations.clickTogglesFromTitle : CONFIG.relations.clickTogglesFromBody);
const MAX_LEFT = CONFIG.viewportWidth - CONFIG.rectangles[0].width; // 980

function dragOwnerOf(st: St): number {
  return st.pressed && st.pressedRectangle >= 0 && st.slopExceeded && !st.pressOnMaximized && dragEnabledOf(st.pressOnTitle)
    ? st.pressedRectangle
    : -1;
}
function draggedOf(st: St, owner: number) {
  const r = CONFIG.rectangles[owner];
  return {
    left: clamp(st.grabLeft + st.pointerX - st.pressX, 0, CONFIG.viewportWidth - r.width),
    top: clamp(st.grabTop + st.pointerY - st.pressY, 0, CONFIG.viewportHeight - r.height),
  };
}
function displayedOf(st: St, owner: number): Geo[] {
  return CONFIG.rectangles.map((r, i) => {
    if (st.maximized[i]) return { left: 0, top: 0, width: CONFIG.viewportWidth, height: CONFIG.viewportHeight };
    if (i === owner) return { ...draggedOf(st, i), width: r.width, height: r.height };
    return { left: st.rectangleLeft[i], top: st.rectangleTop[i], width: r.width, height: r.height };
  });
}
function freshState(): St {
  const st: St = {
    pointerX: 0, pointerY: 0, pressed: false, pressX: 0, pressY: 0, pressedRectangle: -1, grabLeft: 0, grabTop: 0,
    pressOnTitle: false, pressWasFocused: false, pressOnMaximized: false, slopExceeded: false,
    rectangleLeft: CONFIG.rectangles.map((r) => r.initialLeft), rectangleTop: CONFIG.rectangles.map((r) => r.initialTop),
    maximized: CONFIG.rectangles.map(() => false), focused: -1, seen: [],
  };
  st.seen = displayedOf(st, -1);
  return st;
}
const inside = (g: Geo, x: number, y: number) => x > g.left && x < g.left + g.width && y > g.top && y < g.top + g.height;
function hitOf(st: St, x: number, y: number): number {
  for (let i = 0; i < N_RECT; i++) if (st.maximized[i] && inside(st.seen[i], x, y)) return i;
  for (let i = 0; i < N_RECT; i++) if (!st.maximized[i] && inside(st.seen[i], x, y)) return i;
  return -1;
}
function tick(st: St, input: Input): Geo[] {
  if (input) {
    st.pointerX = input.x;
    st.pointerY = input.y;
  }
  if (input?.kind === 'down') {
    const hit = hitOf(st, input.x, input.y);
    st.pressed = true;
    st.pressX = input.x;
    st.pressY = input.y;
    st.pressedRectangle = hit;
    st.slopExceeded = false;
    if (hit >= 0) {
      st.grabLeft = st.rectangleLeft[hit];
      st.grabTop = st.rectangleTop[hit];
      st.pressOnTitle = input.y - st.seen[hit].top < CONFIG.titleHeight;
      st.pressWasFocused = st.focused === hit;
      st.pressOnMaximized = st.maximized[hit];
      st.focused = hit;
    } else {
      st.grabLeft = 0;
      st.grabTop = 0;
      st.pressOnTitle = false;
      st.pressWasFocused = false;
      st.pressOnMaximized = false;
      st.focused = -1;
    }
  } else if (input?.kind === 'move') {
    if (st.pressed) {
      const distance = Math.max(Math.abs(input.x - st.pressX), Math.abs(input.y - st.pressY));
      if (distance > CONFIG.slop) st.slopExceeded = true;
    }
  } else if (input?.kind === 'up') {
    const owner = dragOwnerOf(st);
    if (owner >= 0) {
      const d = draggedOf(st, owner);
      st.rectangleLeft[owner] = d.left;
      st.rectangleTop[owner] = d.top;
    }
    const r = st.pressedRectangle;
    if (r >= 0 && !st.slopExceeded && st.pressWasFocused && clickTogglesOf(st.pressOnTitle)) st.maximized[r] = !st.maximized[r];
    st.pressed = false;
    st.slopExceeded = false;
  }
  const displayed = displayedOf(st, dragOwnerOf(st));
  st.seen = displayed;
  return displayed;
}
const cloneSt = (st: St): St => ({
  ...st,
  rectangleLeft: [...st.rectangleLeft],
  rectangleTop: [...st.rectangleTop],
  maximized: [...st.maximized],
  seen: st.seen.map((g) => ({ ...g })),
});

// ---------------------------------------------------------------------------
// The chapter's trace: hover, the probe's drag (down at (410, 305), +60, up), a focus click, a maximize click, and
// the lab's out-and-back (20 px out, back to the press point)
// ---------------------------------------------------------------------------

const TRACE: Input[] = [null]; // frame 0: the initial state, before any input
const MARK: Record<string, number> = {};
const mv = (x: number, y: number): Input => ({ kind: 'move', x, y });
const at = (name: string) => (MARK[name] = TRACE.length - 1);
const walk = (x0: number, y0: number, x1: number, y1: number, n: number, gaps: number[] = []) => {
  for (let i = 1; i <= n; i++) {
    TRACE.push(mv(Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n))));
    if (gaps.includes(i)) TRACE.push(null);
  }
};
const PRESS = { x: 410, y: 305 }; // boundary-probe.test.ts:59-62: initialLeft + 10, initialTop + 5
const BODY1 = { x: 1025, y: 200 }; // the body of window 1 (top 100, so 100 px below its top)
walk(700, 600, 520, 420, 9, [2, 4, 6, 8]);
at('hoverEnd');
walk(520, 420, 450, 340, 7, [2, 5]);
at('twinEnd');
walk(450, 340, PRESS.x, PRESS.y, 4);
at('landed');
TRACE.push({ kind: 'down', ...PRESS });
at('down1');
for (let dx = 1; dx <= 60; dx++) {
  TRACE.push(mv(PRESS.x + dx, PRESS.y));
  at(`dx${dx}`);
}
TRACE.push({ kind: 'up', x: PRESS.x + 60, y: PRESS.y });
at('up1');
TRACE.push(null);
walk(PRESS.x + 60, PRESS.y, BODY1.x, BODY1.y, 14, [7]);
at('toBody');
TRACE.push({ kind: 'down', ...BODY1 });
at('focusDown');
TRACE.push(null);
TRACE.push({ kind: 'up', ...BODY1 });
at('focusUp');
TRACE.push(null);
TRACE.push({ kind: 'down', ...BODY1 });
at('maxDown');
TRACE.push(null);
TRACE.push({ kind: 'up', ...BODY1 });
at('maxUp');
TRACE.push(null);
TRACE.push({ kind: 'down', ...BODY1 });
at('cancelDown');
TRACE.push(mv(BODY1.x + 20, BODY1.y));
at('out20');
TRACE.push(mv(BODY1.x, BODY1.y));
at('back');
TRACE.push({ kind: 'up', ...BODY1 });
at('cancelUp');
TRACE.push(null);
at('end');

const STATES: St[] = [];
const DISPLAYED: Geo[][] = [];
{
  const st = freshState();
  STATES.push(cloneSt(st));
  DISPLAYED.push(displayedOf(st, -1));
  for (let i = 1; i < TRACE.length; i++) {
    DISPLAYED.push(tick(st, TRACE[i]));
    STATES.push(cloneSt(st));
  }
}
const N_FRAMES = TRACE.length;

// the gates at a release, read from the pre-release state (circuit.ts:346-388)
const gatesAt = (f: number) => {
  const p = STATES[f - 1];
  const up = TRACE[f]?.kind === 'up' ? 1 : 0;
  const pressActive = p.pressed ? 1 : 0;
  const slopLatch = p.slopExceeded ? 1 : 0;
  const dragEnabled = dragEnabledOf(p.pressOnTitle) ? 1 : 0;
  const onMax = p.pressOnMaximized ? 1 : 0;
  const wasFocused = p.pressWasFocused ? 1 : 0;
  const clickToggles = clickTogglesOf(p.pressOnTitle) ? 1 : 0;
  const commit = up * pressActive * slopLatch * dragEnabled * (1 - onMax);
  const toggle = up * pressActive * (1 - slopLatch) * wasFocused * clickToggles;
  return { up, pressActive, slopLatch, dragEnabled, onMax, wasFocused, clickToggles, commit, toggle };
};
const G_COMMIT = gatesAt(MARK.up1);
const G_MAX = gatesAt(MARK.maxUp);
const G_CANCEL = gatesAt(MARK.cancelUp);
const MAX_BEFORE = STATES[MARK.maxUp - 1].maximized[1] ? 1 : 0;
const MAX_AFTER = MAX_BEFORE + G_MAX.toggle * (1 - 2 * MAX_BEFORE); // circuit.ts:368-372, flipDirection

// ---------------------------------------------------------------------------
// The probe (boundary-probe.test.ts:56-89): two traces, same last K inputs, different answers
// ---------------------------------------------------------------------------

const PROBE_K = [1, 4, 16, 64, 256];
const PROBE_SESSION: Input[] = [
  { kind: 'down', ...PRESS },
  { kind: 'move', x: PRESS.x + 60, y: PRESS.y },
  { kind: 'up', x: PRESS.x + 60, y: PRESS.y },
];
const finalLeft = (trace: Input[]) => {
  const st = freshState();
  let left = -1;
  for (const input of trace) left = tick(st, input)[0].left;
  return { left, stored: st.rectangleLeft[0] };
};
const PROBE = (() => {
  let a = { left: 0, stored: 0 };
  let b = { left: 0, stored: 0 };
  for (const k of PROBE_K) {
    for (const framing of ['frames', 'events'] as const) {
      const suffix: Input[] = Array.from({ length: k }, () => (framing === 'frames' ? null : mv(5, 5)));
      a = finalLeft([...PROBE_SESSION, ...suffix]);
      b = finalLeft([...PROBE_SESSION.map(() => null), ...suffix]);
      if (a.left !== 460 || b.left !== 400 || a.stored !== 460 || b.stored !== 400) throw new Error('probe mismatch');
    }
  }
  return { a, b };
})();

// the plan's numbers, checked against the port
{
  const d = STATES[MARK.down1];
  const ok =
    d.pressX === 410 && d.pressY === 305 && d.grabLeft === 400 && d.grabTop === 300 && d.pressOnTitle && d.pressedRectangle === 0 &&
    !STATES[MARK.dx4].slopExceeded && STATES[MARK.dx5].slopExceeded &&
    DISPLAYED[MARK.dx60][0].left === 460 && STATES[MARK.dx60].rectangleLeft[0] === 400 &&
    STATES[MARK.up1].rectangleLeft[0] === 460 && G_COMMIT.commit === 1 && MAX_LEFT === 980 &&
    STATES[MARK.focusDown].focused === 1 && !STATES[MARK.focusDown].pressWasFocused && !STATES[MARK.focusUp].maximized[1] &&
    STATES[MARK.maxDown].pressWasFocused && !STATES[MARK.maxDown].pressOnTitle && STATES[MARK.maxUp].maximized[1] && MAX_AFTER === 1 &&
    STATES[MARK.out20].slopExceeded && STATES[MARK.back].slopExceeded && G_CANCEL.toggle === 0 &&
    STATES[MARK.cancelUp].maximized[1] && !STATES[MARK.cancelUp].slopExceeded;
  if (!ok) throw new Error('event-window chapter 1: a drawn number disagrees with the oracle');
}

// ---------------------------------------------------------------------------
// The latch bank: the circuit's cells (circuit.ts:38-80), and when each is written
// ---------------------------------------------------------------------------

type RowKind = 'num' | 'bit' | 'onehot' | 'bits';
type Row = { key: string; label: string; kind: RowKind; y: number; group: 'rec' | 'latch' | 'left' | 'focus' | 'max'; read: (s: St) => number | number[] };
const oneHot = (i: number) => Array.from({ length: N_RECT }, (_, k) => (k === i ? 1 : 0));
const b = (v: boolean) => (v ? 1 : 0);
const BANK = { x: 850, w: 390, top: 96 };
const ROWS: Row[] = [
  { key: 'pressActive', label: 'pressActive', kind: 'bit', y: 150, group: 'rec', read: (s) => b(s.pressed) },
  { key: 'pressX', label: 'pressX', kind: 'num', y: 178, group: 'rec', read: (s) => s.pressX },
  { key: 'pressY', label: 'pressY', kind: 'num', y: 206, group: 'rec', read: (s) => s.pressY },
  { key: 'pressRectangle', label: 'pressRectangle', kind: 'onehot', y: 234, group: 'rec', read: (s) => oneHot(s.pressedRectangle) },
  { key: 'grabLeft', label: 'grabLeft', kind: 'num', y: 262, group: 'rec', read: (s) => s.grabLeft },
  { key: 'grabTop', label: 'grabTop', kind: 'num', y: 290, group: 'rec', read: (s) => s.grabTop },
  { key: 'pressOnTitle', label: 'pressOnTitle', kind: 'bit', y: 318, group: 'rec', read: (s) => b(s.pressOnTitle) },
  { key: 'pressWasFocused', label: 'pressWasFocused', kind: 'bit', y: 346, group: 'rec', read: (s) => b(s.pressWasFocused) },
  { key: 'pressOnMaximized', label: 'pressOnMaximized', kind: 'bit', y: 374, group: 'rec', read: (s) => b(s.pressOnMaximized) },
  { key: 'slopLatch', label: 'slopLatch', kind: 'bit', y: 432, group: 'latch', read: (s) => b(s.slopExceeded) },
  { key: 'left0', label: 'stored left · window 0', kind: 'num', y: 490, group: 'left', read: (s) => s.rectangleLeft[0] },
  { key: 'focused', label: 'focused', kind: 'onehot', y: 518, group: 'focus', read: (s) => oneHot(s.focused) },
  { key: 'maximized', label: 'maximized', kind: 'bits', y: 546, group: 'max', read: (s) => s.maximized.map(b) },
];
const GROUP_HEAD = [
  { y: 128, text: 'press record · written on down only', group: 'rec' as const },
  { y: 410, text: 'drag-begin latch · set by a move', group: 'latch' as const },
  { y: 468, text: 'window state', group: 'left' as const },
];
const same = (a: number | number[], c: number | number[]) => JSON.stringify(a) === JSON.stringify(c);
/** WRITTEN[r][f]: frame f wrote row r (record cells and focus on every down; the rest when the value changes) */
const WRITTEN: boolean[][] = ROWS.map((row) =>
  STATES.map((st, f) => {
    if (f === 0) return false;
    const kind = TRACE[f]?.kind;
    if (row.group === 'rec' || row.group === 'focus') return kind === 'down' || (row.key === 'pressActive' && kind === 'up');
    return !same(row.read(st), row.read(STATES[f - 1]));
  }),
);
/** LAST_KIND[r][f]: the event that last wrote row r, as of frame f */
const LAST_KIND: Array<Array<Kind | null>> = WRITTEN.map((w) => {
  let last: Kind | null = null;
  return w.map((wr, f) => (wr ? (last = TRACE[f]?.kind ?? null) : last));
});

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const MAIN = { ox: 40, oy: 96, s: 0.4 }; // the 1280×800 stage at 0.4: 512 × 320
const TWIN = { ox: 728, oy: 96, s: 0.4 };
const LANE_A = { ox: 60, oy: 120, s: 0.16 };
const LANE_B = { ox: 60, oy: 340, s: 0.16 };
const TAPE = { x: 40, w: 512, y: 440, h: 36, slot: 40 };
const TAPE_CX = TAPE.x + TAPE.w / 2;
const LOUPE = { cx: 700, cy: 220, half: 110, z: 5 }; // 1 px of the stage = 5 px; ±22 px
const CHIP = { x: 40, y: 516 };
const LANE_TAPE = { x0: 300, slot: 36, tick0: 420, tickW: 2.6, ha: 164, hb: 384, h: 40 };
const TICK_END = LANE_TAPE.tick0 + 256 * LANE_TAPE.tickW; // 1085.6
const OUT_X = 1104;

const HOME: CameraState = CAMERA_HOME;
const CAM_INTRO: CameraState = { x: 330, y: 270, k: 1.35 };
const CAM_RECT: CameraState = { x: 285, y: 250, k: 2.2 };
const CAM_PRESS: CameraState = { x: 640, y: 352, k: 1.02 };
const CAM_LOUPE: CameraState = { x: 920, y: 330, k: 1.2 };
const CAM_LEFT: CameraState = { x: 430, y: 360, k: 1.12 };
const CAM_OUT: CameraState = { x: 668, y: 330, k: 1.04 };

const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions, each timed at ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'A window has to remember things. Is this a drag or a click? Which window has focus? Is it maximized? This lab asks whether that memory can live in a fixed circuit of weighted sums and relu.',
  'Four windows sit on a twelve-eighty by eight-hundred stage. Each frame the circuit sees at most one input: a pointer down, a move, an up, or nothing. Its answer is where every window is drawn.',
  'Plain code already does this job, so it acts as the referee: an oracle program written the ordinary way. The circuit has to match it frame for frame, bit for bit.',
  'Press on a title bar, the top thirty pixels. At that instant, and only then, the circuit writes a press record: where the pointer landed, which window, where its corner was, and whether it hit the title.',
  'Moves never touch that record. Each one just measures the larger of the sideways and vertical distance from the press point. Cross four pixels and a second latch, the drag-begin latch, flips on.',
  "While that latch is on, the window is drawn at its grab position plus the pointer's travel, kept inside the stage. Sixty pixels to the right puts the left edge at four hundred sixty.",
  "But the stored position hasn't changed. Only a release commits it, and only if the drag latch is on. Letting go writes four hundred sixty into memory; nothing before that did.",
  "Now a click. Press on a window that isn't focused, and the press only gives it focus. Focus changes on a pointer down and at no other time.",
  "Click the focused window's body and release without crossing four pixels. The drag latch is still off, so maximized flips by arithmetic: the old value plus a toggle times one minus twice the old value.",
  "Cross the four pixels and drift back to the start, and the click is cancelled. The latch remembers the crossing until release, so a quick out-and-back can't sneak in a toggle.",
  'Could the circuit skip the latches and look only at its last few inputs? A probe says no. One trace holds a drag, another holds nothing, and both end with the same last two hundred fifty-six inputs.',
  'Yet the window ends in two places, four sixty and four hundred. No fixed window of raw inputs can tell them apart, for every length tested. A latch holds the committed total, so it can.',
];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const CAP_DUR = CAPTIONS.map((c) => +(words(c) * 0.4 + 0.5).toFixed(1));
const GAP = 0.9;
const CAP_AT: number[] = [];
CAPTIONS.reduce((t, _, i) => {
  CAP_AT.push(+t.toFixed(2));
  return t + CAP_DUR[i] + GAP;
}, 0.4);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_INTRO, cameraInterp);
  // the trace
  const frame = tl.channel('frame', 0);
  const stepU = tl.channel('stepU', 1);
  const flash = tl.channel('flash', 0);
  // persistent layers
  const stageU = tl.channel('stageU', 0);
  const stageOp = tl.channel('stageOp', 1);
  const bankU = tl.channel('bankU', 0);
  const bankOp = tl.channel('bankOp', 1);
  const tapeU = tl.channel('tapeU', 0);
  const tapeOp = tl.channel('tapeOp', 1);
  const loupeU = tl.channel('loupeU', 0);
  const pushU = tl.channel('rectPushU', 0);
  // B1
  const qU = [tl.channel('qDrag', 0), tl.channel('qFocus', 0), tl.channel('qMax', 0)];
  const qFly = tl.channel('qFly', 0);
  const qOp = tl.channel('qOp', 1);
  const reluU = tl.channel('reluU', 0);
  // B2
  const legendU = tl.channel('legendU', 0);
  const outArrowU = tl.channel('outArrowU', 0);
  // B3
  const twinU = tl.channel('twinU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const eqU = tl.channel('eqGreen', 0);
  const badgeU = tl.channel('badgeU', 0);
  // B4–B10 bank groups
  const recU = tl.channel('recU', 0);
  const recDim = tl.channel('recDim', 0);
  const latchU = tl.channel('latchU', 0);
  const leftU = tl.channel('leftU', 0);
  const focusU = tl.channel('focusU', 0);
  const maxU = tl.channel('maxU', 0);
  const titleU = tl.channel('titleBracketU', 0);
  const coordU = tl.channel('coordU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const ghostLeft = tl.channel('ghostLeft', 400);
  // chips (one spotlight at a time)
  const chipDisp = tl.channel('chipDisplayed', 0);
  const chipCommit = tl.channel('chipCommit', 0);
  const chipFocus = tl.channel('chipFocus', 0);
  const chipMax = tl.channel('chipMax', 0);
  const chipCancel = tl.channel('chipCancel', 0);
  const stayU = tl.channel('stayU', 0);
  // B11–B12 the probe
  const morphU = tl.channel('stageMorph', 0);
  const laneU = tl.channel('laneU', 0);
  const laneTapeU = tl.channel('laneTapeU', 0);
  const kIdx = tl.channel('kIdx', 0);
  const bandU = tl.channel('bandU', 0);
  const laneOut = tl.channel('laneOut', 0);
  const cellsU = tl.channel('outCellsU', 0);
  const neqU = tl.channel('neqU', 0);
  const fU = tl.channel('fU', 0);
  const strikeU = tl.channel('strikeU', 0);
  const latchHi = tl.channel('latchHi', 0);
  const laneOp = tl.channel('laneOp', 1);
  const summaryU = tl.channel('summaryU', 0);

  const step = (f: number, t: number) => {
    tl.set(frame, f, t);
    tl.set(stepU, 0, t);
    tl.tween(stepU, 1, { at: t, dur: 0.7, ease: ease.move });
  };
  const run = (f0: number, f1: number, t: number, dur: number) => {
    tl.set(frame, f0, t);
    tl.tween(frame, f1, { at: t, dur, ease: ease.linear });
  };
  const pulse = (t: number, hold = 1.6) => {
    tl.set(flash, 1, t);
    tl.tween(flash, 0, { at: t + hold, dur: 0.8, ease: ease.move });
  };
  const fade = (chs: Array<ChannelRef<number>>, to: number, t: number, dur = 0.7) =>
    chs.forEach((ch) => tl.tween(ch, to, { at: t, dur, ease: ease.move }));
  const cap = (i: number) => {
    tl.caption({ at: CAP_AT[i], dur: CAP_DUR[i], text: CAPTIONS[i] });
    tl.hold(CAP_AT[i] + CAP_DUR[i], GAP);
    return CAP_AT[i];
  };

  // — B1 · what a window remembers —
  let t = cap(0);
  tl.tween(stageU, 1, { at: t + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(qU[0], 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(qU[1], 1, { at: t + 4.9, dur: 0.6, ease: ease.enter });
  tl.tween(qU[2], 1, { at: t + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, HOME, { at: t + 7.8, dur: 1.4, ease: ease.move });
  tl.tween(bankU, 1, { at: t + 8.4, dur: 1.2, ease: ease.draw });
  tl.tween(qFly, 1, { at: t + 9.4, dur: 1.4, ease: ease.move });
  tl.tween(reluU, 1, { at: t + 13.0, dur: 0.7, ease: ease.enter });

  // — B2 · one input per frame; the answer is the drawing —
  t = cap(1);
  tl.tween(qOp, 0, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(tapeU, 1, { at: t + 1.6, dur: 1.2, ease: ease.draw });
  run(0, MARK.hoverEnd, t + 2.4, 8.0);
  tl.tween(legendU, 1, { at: t + 5.6, dur: 1.4, ease: ease.linear });
  tl.tween(outArrowU, 1, { at: t + 10.8, dur: 1.2, ease: ease.draw });

  // — B3 · the referee: plain code, compared with === —
  t = cap(2);
  fade([bankOp], WHISPER, t, 0.6);
  fade([outArrowU, legendU], 0, t, 0.6);
  tl.tween(tapeOp, 0.4, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(twinU, 1, { at: t + 0.6, dur: 1.2, ease: ease.enter });
  tl.tween(bridgeU, 1, { at: t + 6.0, dur: 1.0, ease: ease.draw });
  run(MARK.hoverEnd, MARK.twinEnd, t + 7.0, 4.0);
  tl.tween(eqU, 1, { at: t + 7.4, dur: 0.6, ease: ease.enter });
  tl.tween(twinU, 0, { at: t + 11.6, dur: 0.9, ease: ease.move });
  tl.tween(bridgeU, 0, { at: t + 11.6, dur: 0.6, ease: ease.move });
  tl.tween(badgeU, 1, { at: t + 12.0, dur: 0.6, ease: ease.enter });

  // — B4 · the press record, written on down only —
  t = cap(3);
  tl.tween(bankOp, 1, { at: t + 4.6, dur: 0.6, ease: ease.move });
  tl.tween(tapeOp, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RECT, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(pushU, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(pushU, 0, { at: t + 4.6, dur: 1.0, ease: ease.move });
  tl.tween(titleU, 1, { at: t + 1.2, dur: 0.7, ease: ease.enter });
  run(MARK.twinEnd, MARK.landed, t + 1.6, 1.4);
  step(MARK.down1, t + 3.6);
  tl.tween(coordU, 1, { at: t + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_PRESS, { at: t + 4.6, dur: 1.4, ease: ease.move });
  tl.tween(recU, 1, { at: t + 5.2, dur: 1.4, ease: ease.enter });
  pulse(t + 5.4, 7.0);
  tl.tween(titleU, 0, { at: t + 12.0, dur: 0.6, ease: ease.move });
  tl.tween(coordU, 0, { at: t + 12.0, dur: 0.6, ease: ease.move });

  // — B5 · moves measure; the drag-begin latch —
  t = cap(4);
  tl.tween(cam, CAM_LOUPE, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(recDim, 1, { at: t + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(loupeU, 1, { at: t + 0.8, dur: 0.8, ease: ease.enter });
  fade([stageOp, tapeOp], WHISPER, t, 0.8);
  [1, 2, 3, 4].forEach((dx, i) => step(MARK[`dx${dx}`], t + 3.0 + i * 1.3));
  tl.tween(latchU, 1, { at: t + 8.4, dur: 0.6, ease: ease.enter });
  step(MARK.dx5, t + 9.6);
  pulse(t + 9.6, 2.4);

  // — B6 · the window follows: grab position plus travel —
  t = cap(5);
  tl.tween(cam, CAM_LEFT, { at: t, dur: 1.3, ease: ease.move });
  fade([stageOp, tapeOp], 1, t, 0.8);
  tl.tween(loupeU, 0, { at: t, dur: 0.7, ease: ease.move });
  tl.tween(bankOp, WHISPER, { at: t, dur: 0.7, ease: ease.move });
  tl.tween(chipDisp, 1, { at: t + 1.0, dur: 0.6, ease: ease.enter });
  run(MARK.dx5, MARK.dx60, t + 2.0, 6.5);

  // — B7 · only the release commits —
  t = cap(6);
  tl.tween(cam, HOME, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(chipDisp, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(bankOp, 1, { at: t + 0.4, dur: 0.7, ease: ease.move });
  tl.tween(ghostU, 1, { at: t + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(leftU, 1, { at: t + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(chipCommit, 1, { at: t + 3.6, dur: 0.6, ease: ease.enter });
  step(MARK.up1, t + 7.6);
  pulse(t + 7.6, 2.6);
  tl.tween(ghostLeft, STATES[MARK.up1].rectangleLeft[0], { at: t + 7.7, dur: 0.9, ease: ease.move });
  tl.tween(ghostU, 0, { at: t + 10.6, dur: 0.6, ease: ease.move });

  // — B8 · focus changes on down —
  t = cap(7);
  tl.tween(chipCommit, 0, { at: t, dur: 0.5, ease: ease.move });
  run(MARK.up1, MARK.toBody, t + 0.6, 2.6);
  tl.tween(focusU, 1, { at: t + 3.2, dur: 0.6, ease: ease.enter });
  step(MARK.focusDown, t + 4.0);
  pulse(t + 4.0, 3.0);
  step(MARK.focusDown + 1, t + 5.6);
  step(MARK.focusUp, t + 6.2);
  tl.tween(chipFocus, 1, { at: t + 7.0, dur: 0.6, ease: ease.enter });

  // — B9 · the toggle, by arithmetic —
  t = cap(8);
  tl.tween(chipFocus, 0, { at: t, dur: 0.5, ease: ease.move });
  step(MARK.focusUp + 1, t + 0.6);
  step(MARK.maxDown, t + 2.4);
  pulse(t + 2.4, 1.2);
  step(MARK.maxDown + 1, t + 3.6);
  tl.tween(maxU, 1, { at: t + 4.2, dur: 0.6, ease: ease.enter });
  step(MARK.maxUp, t + 5.0);
  pulse(t + 5.0, 2.6);
  tl.tween(chipMax, 1, { at: t + 7.2, dur: 0.6, ease: ease.enter });

  // — B10 · out and back: the latch remembers —
  t = cap(9);
  tl.tween(chipMax, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, HOME, { at: t, dur: 1.0, ease: ease.move });
  step(MARK.maxUp + 1, t + 0.4);
  step(MARK.cancelDown, t + 1.4);
  tl.tween(loupeU, 1, { at: t + 1.6, dur: 0.7, ease: ease.enter });
  step(MARK.out20, t + 2.8);
  pulse(t + 2.8, 1.6);
  step(MARK.back, t + 4.4);
  tl.tween(chipCancel, 1, { at: t + 5.6, dur: 0.6, ease: ease.enter });
  step(MARK.cancelUp, t + 8.6);
  tl.tween(stayU, 1, { at: t + 9.0, dur: 0.6, ease: ease.enter });

  // — B11 · the probe: same last K inputs —
  t = cap(10);
  tl.tween(cam, HOME, { at: t, dur: 1.5, ease: ease.move });
  fade([bankOp, tapeOp, loupeU, chipCancel, stayU, badgeU], 0, t, 0.8);
  tl.tween(morphU, 1, { at: t + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(laneU, 1, { at: t + 1.2, dur: 1.0, ease: ease.enter });
  tl.tween(laneTapeU, 1, { at: t + 4.2, dur: 1.6, ease: ease.draw });
  tl.tween(bandU, 1, { at: t + 7.4, dur: 0.6, ease: ease.enter });
  [1, 2, 3, 4].forEach((k, i) => tl.tween(kIdx, k, { at: t + 8.2 + i * 1.3, dur: 0.6, ease: ease.move }));

  // — B12 · two answers, one window of inputs —
  t = cap(11);
  tl.tween(cam, CAM_OUT, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(laneOut, 1, { at: t + 0.6, dur: 1.0, ease: ease.move });
  tl.tween(cellsU, 1, { at: t + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(neqU, 1, { at: t + 3.2, dur: 0.5, ease: ease.pop });
  tl.tween(fU, 1, { at: t + 5.2, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: t + 7.4, dur: 0.6, ease: ease.draw });
  tl.tween(latchHi, 1, { at: t + 10.0, dur: 0.6, ease: ease.enter });
  tl.tween(cam, HOME, { at: t + 11.6, dur: 1.3, ease: ease.move });
  tl.tween(laneOp, WHISPER, { at: t + 12.0, dur: 0.9, ease: ease.move });
  tl.tween(summaryU, 1, { at: t + 12.4, dur: 0.8, ease: ease.enter });
  tl.hold(t + CAP_DUR[11], 3.0);

  return {
    tl, cam, frame, stepU, flash, stageU, stageOp, bankU, bankOp, tapeU, tapeOp, loupeU, pushU, qU, qFly, qOp, reluU,
    legendU, outArrowU, twinU, bridgeU, eqU, badgeU, recU, recDim, latchU, leftU, focusU, maxU, titleU, coordU,
    ghostU, ghostLeft, chipDisp, chipCommit, chipFocus, chipMax, chipCancel, stayU, morphU, laneU, laneTapeU, kIdx,
    bandU, laneOut, cellsU, neqU, fU, strikeU, latchHi, laneOp, summaryU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

type View = { ox: number; oy: number; s: number };
const vx = (v: View, x: number) => v.ox + x * v.s;
const vy = (v: View, y: number) => v.oy + y * v.s;

/** The 1280×800 stage drawn at scale: four windows with title bars, the pointer, an optional focus ring. */
function StageView({ v, geos, pointer, pressed, focused, reveal = 1, opacity = 1, labels = true, tint = colors.ACCENT, grey = false }: {
  v: View; geos: Geo[]; pointer?: { x: number; y: number }; pressed?: boolean; focused?: { i: number; op: number };
  reveal?: number; opacity?: number; labels?: boolean; tint?: string; grey?: boolean;
}) {
  if (opacity <= 0.005) return null;
  // maximized windows draw last (they win the hit test, oracle.ts:205-219)
  const order = [0, 1, 2, 3].sort((a, c) => (geos[a].width === 1280 ? 1 : 0) - (geos[c].width === 1280 ? 1 : 0));
  return (
    <g opacity={opacity}>
      <rect x={v.ox} y={v.oy} width={1280 * v.s} height={800 * v.s} rx={4} fill={colors.PANEL} fillOpacity={0.6} stroke={colors.MUTED} strokeOpacity={0.5} strokeWidth={1.2} />
      {order.map((i) => {
        const g = geos[i];
        const u = staggerU(reveal, i, 4, 0.15, 0.6);
        if (u <= 0.005) return null;
        const stroke = grey ? colors.MUTED : i === 0 ? tint : colors.MUTED;
        return (
          <g key={i} opacity={u}>
            <rect x={vx(v, g.left)} y={vy(v, g.top)} width={g.width * v.s} height={g.height * v.s} rx={2} fill="#121a2c" fillOpacity={g.width === 1280 ? 0.93 : 1} stroke={stroke} strokeWidth={i === 0 ? 1.8 : 1.2} />
            <rect x={vx(v, g.left)} y={vy(v, g.top)} width={g.width * v.s} height={30 * v.s} rx={2} fill={stroke} fillOpacity={grey ? 0.18 : 0.28} />
            {labels && (
              <text x={vx(v, g.left) + 6} y={vy(v, g.top) + 30 * v.s + 15} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                {`window ${i}`}
              </text>
            )}
          </g>
        );
      })}
      {focused && focused.i >= 0 && focused.op > 0.005 && (
        <rect
          x={vx(v, geos[focused.i].left) - 3}
          y={vy(v, geos[focused.i].top) - 3}
          width={geos[focused.i].width * v.s + 6}
          height={geos[focused.i].height * v.s + 6}
          rx={4}
          fill="none"
          stroke={colors.WARM}
          strokeWidth={2}
          opacity={focused.op}
        />
      )}
      {pointer && (
        <g>
          {pressed && <circle cx={vx(v, pointer.x)} cy={vy(v, pointer.y)} r={8} fill="none" stroke={grey ? colors.MUTED : colors.ACCENT} strokeWidth={2} />}
          <circle cx={vx(v, pointer.x)} cy={vy(v, pointer.y)} r={4} fill="#ffffff" stroke="#0a0e1a" strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
}

function CodeChip({ x, y, lines, stripe, opacity = 1, size = 15 }: {
  x: number; y: number; lines: string[]; stripe: string; opacity?: number; size?: number;
}) {
  if (opacity <= 0.005) return null;
  const adv = size * 0.6;
  const w = Math.max(...lines.map((l) => l.length)) * adv + 30;
  const lh = size + 7;
  const h = lines.length * lh + 14;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 8 + size + i * lh} fontSize={size} fontFamily={MONO} fill={l.startsWith('//') ? colors.MUTED : colors.TEXT} xmlSpace="preserve">
          {l}
        </text>
      ))}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, u, color, dashed = false, width = 2 }: {
  x1: number; y1: number; x2: number; y2: number; u: number; color: string; dashed?: boolean; width?: number;
}) {
  if (u <= 0.005) return null;
  const ex = lerp(x1, x2, u), ey = lerp(y1, y2, u);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 5' : undefined} />
      <polygon
        points={`${ex},${ey} ${ex - 10 * Math.cos(a - 0.45)},${ey - 10 * Math.sin(a - 0.45)} ${ex - 10 * Math.cos(a + 0.45)},${ey - 10 * Math.sin(a + 0.45)}`}
        fill={color}
        opacity={clamp01(u * 3 - 2)}
      />
    </g>
  );
}

/** Violet hockey stick: the relu glyph (as in the sister book). (x, y) is the bottom-left. */
function ReluGlyph({ x, y, w = 22, opacity = 1 }: { x: number; y: number; w?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return <path d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
}

const KIND_LABEL: Record<Kind, string> = { down: 'down', move: 'move', up: 'up' };
const KIND_COLOR: Record<Kind, string> = { down: colors.ACCENT, move: colors.MUTED, up: colors.POSITIVE };

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  // ---- the trace at this instant
  const fCont = Math.max(0, Math.min(N_FRAMES - 1, v(scene.frame)));
  const fi = Math.floor(fCont + 1e-6);
  const st = STATES[fi];
  const stepU = v(scene.stepU);
  const prevGeo = DISPLAYED[Math.max(0, fi - 1)];
  const geos = DISPLAYED[fi].map((g, i) => {
    const p = prevGeo[i];
    if (stepU >= 0.999) return g;
    return { left: lerp(p.left, g.left, stepU), top: lerp(p.top, g.top, stepU), width: lerp(p.width, g.width, stepU), height: lerp(p.height, g.height, stepU) };
  });
  const pointer = { x: st.pointerX, y: st.pointerY };
  const hasPointer = fi > 0;
  const flash = v(scene.flash);

  // ---- layers
  const stageOp = v(scene.stageOp) * (1 - v(scene.morphU));
  const bankOp = v(scene.bankOp);
  const bankU = v(scene.bankU);
  const pushU = v(scene.pushU);
  const tapeOp = v(scene.tapeOp) * v(scene.tapeU) * (1 - 0.9 * pushU);
  const loupeU = v(scene.loupeU);
  const twinU = v(scene.twinU);
  const focusOp = v(scene.focusU);

  // the main stage morphs toward lane A for the probe
  const mu = v(scene.morphU);
  const mainView: View = { ox: lerp(MAIN.ox, LANE_A.ox, mu), oy: lerp(MAIN.oy, LANE_A.oy, mu), s: lerp(MAIN.s, LANE_A.s, mu) };

  // ---- bank rows
  const groupU: Record<Row['group'], number> = {
    rec: v(scene.recU), latch: v(scene.latchU), left: v(scene.leftU), focus: v(scene.focusU), max: v(scene.maxU),
  };
  const recDim = v(scene.recDim);

  // ---- the loupe (around the current press point)
  const dx = st.pointerX - st.pressX;
  const dy = st.pointerY - st.pressY;
  const cheb = Math.max(Math.abs(dx), Math.abs(dy));
  const LR = LOUPE.half / LOUPE.z; // 22 px
  const lpx = LOUPE.cx + clamp(dx, -LR, LR) * LOUPE.z;
  const lpy = LOUPE.cy + clamp(dy, -LR, LR) * LOUPE.z;
  const gHalf = Math.min(cheb, LR) * LOUPE.z;
  const crossed = st.slopExceeded;

  // ---- live numbers
  const live = DISPLAYED[fi][0].left;
  const ghostLeft = v(scene.ghostLeft);

  // ---- probe
  const laneU = v(scene.laneU);
  const laneOp = v(scene.laneOp);
  const laneTapeU = v(scene.laneTapeU);
  const kI = v(scene.kIdx);
  const kLo = PROBE_K[Math.floor(clamp(kI, 0, 4))];
  const kHi = PROBE_K[Math.ceil(clamp(kI, 0, 4))];
  const kW = lerp(Math.log(kLo), Math.log(kHi), kI - Math.floor(kI)); // the band widens on a log scale between ticks
  const kNow = PROBE_K[Math.round(clamp(kI, 0, 4))];
  const bandW = Math.max(LANE_TAPE.tickW, Math.exp(kW) * LANE_TAPE.tickW);
  const laneOut = v(scene.laneOut);
  const laneGeo = (left0: number): Geo[] =>
    CONFIG.rectangles.map((r, i) => ({ left: i === 0 ? left0 : r.initialLeft, top: r.initialTop, width: r.width, height: r.height }));

  const qPos = [
    { from: { x: vx(MAIN, 560), y: vy(MAIN, 250) }, to: { x: BANK.x + 210, y: 432 }, text: 'drag?' },
    { from: { x: vx(MAIN, 1030), y: vy(MAIN, 60) }, to: { x: BANK.x + 210, y: 518 }, text: 'focus?' },
    { from: { x: vx(MAIN, 640), y: vy(MAIN, 760) }, to: { x: BANK.x + 210, y: 546 }, text: 'maximized?' },
  ];

  const chipStripe = colors.ACCENT;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="ew1-loupe">
          <rect x={LOUPE.cx - LOUPE.half} y={LOUPE.cy - LOUPE.half} width={LOUPE.half * 2} height={LOUPE.half * 2} rx={6} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the circuit's stage (persistent; morphs into lane A) ================= */}
        <g opacity={stageOp * (1 - 0.9 * pushU)}>
          <text x={MAIN.ox} y={88} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.stageU) * (1 - mu)}>
            circuit.ts · buildEventWindowCircuit
          </text>
          <text x={MAIN.ox + 512} y={88} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.stageU) * (1 - mu)}>
            1280 × 800
          </text>
        </g>
        <StageView
          v={mainView}
          geos={geos}
          pointer={hasPointer ? pointer : undefined}
          pressed={st.pressed}
          focused={{ i: st.focused, op: focusOp }}
          reveal={v(scene.stageU)}
          opacity={stageOp}
          labels={mu < 0.3}
        />

        {/* title bracket: the top 30 px of window 0 */}
        {v(scene.titleU) > 0.005 && (
          <g opacity={v(scene.titleU) * stageOp}>
            <path d={`M ${vx(MAIN, 400) - 4} ${vy(MAIN, 300)} h -5 V ${vy(MAIN, 330)} h 5`} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
            <text x={vx(MAIN, 400) - 13} y={vy(MAIN, 315) + 4} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.WARM}>
              titleHeight = 30 px
            </text>
          </g>
        )}
        {v(scene.coordU) > 0.005 && (
          <g opacity={v(scene.coordU) * stageOp}>
            <line x1={vx(MAIN, PRESS.x)} y1={vy(MAIN, PRESS.y)} x2={vx(MAIN, PRESS.x) + 22} y2={vy(MAIN, PRESS.y) - 22} stroke={colors.TEXT} strokeWidth={1} />
            <text x={vx(MAIN, PRESS.x) + 25} y={vy(MAIN, PRESS.y) - 25} fontSize={12} fontFamily={MONO} fill={colors.TEXT}>
              {`down at (${STATES[MARK.down1].pressX}, ${STATES[MARK.down1].pressY})`}
            </text>
          </g>
        )}
        {/* the ghost: where window 0 is stored, while it is drawn elsewhere */}
        {v(scene.ghostU) > 0.005 && (
          <g opacity={v(scene.ghostU) * stageOp}>
            <rect x={vx(MAIN, ghostLeft)} y={vy(MAIN, 300)} width={300 * MAIN.s} height={200 * MAIN.s} rx={2} fill="none" stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={vx(MAIN, ghostLeft)} y={vy(MAIN, 500) + 18} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
              {`stored left = ${Math.round(ghostLeft)}`}
            </text>
          </g>
        )}

        {/* ================= B1 · the questions fly into the bank ================= */}
        {qPos.map((q, i) => {
          const u = v(scene.qU[i]);
          if (u <= 0.005) return null;
          const fly = staggerU(v(scene.qFly), i, 3, 0.15, 1);
          const x = lerp(q.from.x, q.to.x, fly);
          const y = lerp(q.from.y, q.to.y, fly);
          return (
            <g key={i} opacity={u * v(scene.qOp)}>
              <rect x={x - q.text.length * 4.8 - 10} y={y - 15} width={q.text.length * 9.6 + 20} height={28} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.WARM}>
                {q.text}
              </text>
            </g>
          );
        })}

        {/* ================= the latch bank ================= */}
        {bankU > 0.005 && (
          <g opacity={bankOp}>
            <rect x={BANK.x} y={BANK.top + 8} width={BANK.w} height={lerp(0, 474, bankU)} rx={8} fill={colors.PANEL} fillOpacity={0.7} stroke={colors.GRID} />
            <text x={BANK.x} y={88} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={bankU}>
              latch bank
            </text>
            <g opacity={v(scene.reluU)}>
              <ReluGlyph x={BANK.x + BANK.w - 70} y={90} w={22} />
              <text x={BANK.x + BANK.w - 42} y={88} fontSize={13} fontFamily={MONO} fill={colors.SECONDARY}>
                relu
              </text>
            </g>
            {GROUP_HEAD.map((h) => (
              <text key={h.y} x={BANK.x + 14} y={h.y} fontSize={12} fill={colors.MUTED} opacity={groupU[h.group] * (h.group === 'rec' ? lerp(1, 0.55, recDim) : 1)}>
                {h.text}
              </text>
            ))}
            {ROWS.map((row, r) => {
              const rowU = staggerU(groupU[row.group], row.group === 'rec' ? r : 0, row.group === 'rec' ? 9 : 1, 0.08, 0.5);
              const placeholder = clamp01(bankU * 2 - 1);
              const dim = row.group === 'rec' ? lerp(1, 0.4, recDim) : 1;
              const wr = WRITTEN[r][fi] ? flash : 0;
              const val = row.read(st);
              const lk = LAST_KIND[r][fi];
              const y = row.y;
              return (
                <g key={row.key}>
                  <rect x={BANK.x + 10} y={y - 12} width={BANK.w - 20} height={24} rx={4} fill={wr > 0.01 ? colors.ACCENT : 'none'} fillOpacity={0.22 * wr} stroke={wr > 0.01 ? colors.ACCENT : colors.GRID} strokeOpacity={lerp(placeholder, 1, wr)} />
                  {rowU > 0.005 && (
                    <g opacity={rowU * dim}>
                      <text x={BANK.x + 20} y={y + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                        {row.label}
                      </text>
                      {row.kind === 'num' || row.kind === 'bit' ? (
                        <text x={BANK.x + 286} y={y + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fontWeight={700} fill={wr > 0.01 ? colors.TEXT : row.kind === 'bit' && val === 1 ? colors.ACCENT : colors.MUTED}>
                          {String(val)}
                        </text>
                      ) : (
                        (val as number[]).map((bit, k) => (
                          <g key={k}>
                            <rect x={BANK.x + 214 + k * 19} y={y - 8} width={15} height={15} rx={3} fill={bit ? (row.key === 'focused' ? colors.WARM : colors.ACCENT) : 'none'} stroke={colors.MUTED} strokeWidth={1} />
                          </g>
                        ))
                      )}
                      {lk && (
                        <text x={BANK.x + BANK.w - 22} y={y + 4} textAnchor="end" fontSize={12} fontFamily={MONO} fill={KIND_COLOR[lk]} opacity={0.9}>
                          {`by ${KIND_LABEL[lk]}`}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* B2: the circuit's answer is the drawing */}
        {v(scene.outArrowU) > 0.005 && (
          <g opacity={bankOp}>
            <Arrow x1={BANK.x - 8} y1={300} x2={MAIN.ox + 520} y2={300} u={v(scene.outArrowU)} color={colors.ACCENT} dashed />
            <text x={(BANK.x + MAIN.ox + 512) / 2} y={288} textAnchor="middle" fontSize={13} fill={colors.ACCENT} opacity={clamp01(v(scene.outArrowU) * 2 - 1)}>
              where every window is drawn
            </text>
          </g>
        )}

        {/* ================= the event tape ================= */}
        {tapeOp > 0.005 && (
          <g opacity={tapeOp}>
            <rect x={TAPE.x} y={TAPE.y} width={TAPE.w} height={TAPE.h} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
            {Array.from({ length: 15 }, (_, j) => {
              const k = Math.floor(fCont) - 7 + j;
              if (k < 1 || k >= N_FRAMES) return null;
              const x = TAPE_CX + (k - fCont) * TAPE.slot;
              if (x < TAPE.x + 14 || x > TAPE.x + TAPE.w - 14) return null;
              const inp = TRACE[k];
              const future = k > fi;
              const edge = clamp01(Math.min(x - TAPE.x - 14, TAPE.x + TAPE.w - 14 - x) / 30);
              return (
                <g key={k} opacity={(future ? 0.4 : 1) * edge}>
                  {inp ? (
                    <text x={x} y={TAPE.y + 23} textAnchor="middle" fontSize={12} fontFamily={MONO} fontWeight={inp.kind === 'move' ? 400 : 700} fill={KIND_COLOR[inp.kind]}>
                      {KIND_LABEL[inp.kind]}
                    </text>
                  ) : (
                    <circle cx={x} cy={TAPE.y + 18} r={2.5} fill={colors.MUTED} />
                  )}
                </g>
              );
            })}
            <path d={`M ${TAPE_CX - 6} ${TAPE.y - 9} L ${TAPE_CX + 6} ${TAPE.y - 9} L ${TAPE_CX} ${TAPE.y - 2} Z`} fill={colors.TEXT} />
            <rect x={TAPE_CX - TAPE.slot / 2} y={TAPE.y + 2} width={TAPE.slot} height={TAPE.h - 4} rx={4} fill="none" stroke={colors.TEXT} strokeOpacity={0.5} />
            <text x={TAPE.x} y={TAPE.y + TAPE.h + 20} fontSize={13} fill={colors.MUTED}>
              1 event per frame
            </text>
            {v(scene.legendU) > 0.005 && (
              <g fontSize={13} fontFamily={MONO}>
                {(['down', 'move', 'up', 'empty'] as const).map((k, i) => (
                  <g key={k} opacity={staggerU(v(scene.legendU), i, 4, 0.2, 0.4)}>
                    {k === 'empty' ? (
                      <>
                        <circle cx={TAPE.x + 170 + i * 82} cy={TAPE.y + TAPE.h + 15} r={2.5} fill={colors.MUTED} />
                        <text x={TAPE.x + 178 + i * 82} y={TAPE.y + TAPE.h + 20} fill={colors.MUTED}>nothing</text>
                      </>
                    ) : (
                      <text x={TAPE.x + 160 + i * 82} y={TAPE.y + TAPE.h + 20} fill={KIND_COLOR[k]} fontWeight={700}>
                        {k}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            )}
          </g>
        )}

        {/* ================= B3 · the oracle twin and the === bridge ================= */}
        {twinU > 0.005 && (
          <g opacity={twinU}>
            <rect x={TWIN.ox - 8} y={80} width={530} height={346} fill={colors.BG} />
            <text x={TWIN.ox} y={88} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
              oracle.ts · oracleTick
            </text>
            <StageView v={TWIN} geos={geos} pointer={hasPointer ? pointer : undefined} pressed={st.pressed} reveal={1} grey labels={false} />
            {v(scene.bridgeU) > 0.005 && (
              <g opacity={v(scene.bridgeU)}>
                <path d={`M ${MAIN.ox + 516} 256 Q 640 ${256 - 46 * v(scene.bridgeU)} ${TWIN.ox - 4} 256`} fill="none" stroke={v(scene.eqU) > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={3} />
                <rect x={604} y={196} width={72} height={30} rx={8} fill={colors.PANEL} stroke={v(scene.eqU) > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={1.5} />
                <text x={640} y={217} textAnchor="middle" fontSize={18} fontFamily={MONO} fontWeight={700} fill={v(scene.eqU) > 0.5 ? colors.POSITIVE : colors.TEXT}>
                  ===
                </text>
                <text x={640} y={300} textAnchor="middle" fontSize={13} fill={colors.POSITIVE} opacity={v(scene.eqU)}>
                  every frame
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the loupe: Chebyshev distance from the press point ================= */}
        {loupeU > 0.005 && (
          <g opacity={loupeU}>
            <text x={LOUPE.cx - LOUPE.half} y={LOUPE.cy - LOUPE.half - 8} fontSize={12} fill={colors.MUTED}>
              around the press point · 1 px drawn as 5
            </text>
            <rect x={LOUPE.cx - LOUPE.half} y={LOUPE.cy - LOUPE.half} width={LOUPE.half * 2} height={LOUPE.half * 2} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <g clipPath="url(#ew1-loupe)">
              {Array.from({ length: 23 }, (_, i) => {
                const o = (i - 11) * 2 * LOUPE.z;
                return (
                  <g key={i} stroke={colors.GRID} strokeWidth={1}>
                    <line x1={LOUPE.cx + o} y1={LOUPE.cy - LOUPE.half} x2={LOUPE.cx + o} y2={LOUPE.cy + LOUPE.half} />
                    <line x1={LOUPE.cx - LOUPE.half} y1={LOUPE.cy + o} x2={LOUPE.cx + LOUPE.half} y2={LOUPE.cy + o} />
                  </g>
                );
              })}
              {/* the slop square: Chebyshev distance 4 */}
              <rect x={LOUPE.cx - 4 * LOUPE.z} y={LOUPE.cy - 4 * LOUPE.z} width={8 * LOUPE.z} height={8 * LOUPE.z} fill="none" stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="4 3" />
              {/* the gauge grows with the larger of |dx| and |dy| */}
              {gHalf > 0 && (
                <rect x={LOUPE.cx - gHalf} y={LOUPE.cy - gHalf} width={gHalf * 2} height={gHalf * 2} fill={crossed ? colors.ACCENT : colors.MUTED} fillOpacity={0.12} stroke={crossed ? colors.ACCENT : colors.MUTED} strokeWidth={2} />
              )}
              <circle cx={LOUPE.cx} cy={LOUPE.cy} r={3} fill={colors.WARM} />
              <circle cx={lpx} cy={lpy} r={5} fill="#ffffff" stroke="#0a0e1a" strokeWidth={1.5} />
            </g>
            <text x={LOUPE.cx - 4 * LOUPE.z} y={LOUPE.cy - 4 * LOUPE.z - 6} fontSize={12} fontFamily={MONO} fill={colors.WARM}>
              slop = 4 px
            </text>
            <text x={LOUPE.cx - LOUPE.half} y={LOUPE.cy + LOUPE.half + 22} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
              {`max(|dx|, |dy|) = ${cheb}`}
            </text>
            <text x={LOUPE.cx - LOUPE.half} y={LOUPE.cy + LOUPE.half + 44} fontSize={13} fontFamily={MONO} fill={crossed ? colors.ACCENT : colors.MUTED}>
              {crossed ? (cheb > CONFIG.slop ? `${cheb} > 4 → slopLatch = 1` : 'back inside · slopLatch stays 1') : `${cheb} ≤ 4 · slopLatch = 0`}
            </text>
          </g>
        )}

        {/* ================= chips: one spotlight per beat ================= */}
        <CodeChip
          x={CHIP.x}
          y={CHIP.y}
          stripe={chipStripe}
          opacity={v(scene.chipDisp)}
          lines={[
            'displayed left = grabLeft + pointerX − pressX',
            `               = ${STATES[fi].grabLeft} + ${st.pointerX} − ${st.pressX} = ${live}`,
            `// clamped to 0 … ${MAX_LEFT}`,
          ]}
        />
        <CodeChip
          x={CHIP.x}
          y={CHIP.y}
          stripe={chipStripe}
          opacity={v(scene.chipCommit)}
          lines={[
            'commit = up · pressActive · slopLatch · dragEnabled · (1 − pressOnMaximized)',
            `       = ${fi >= MARK.up1 ? G_COMMIT.up : 0} · ${G_COMMIT.pressActive} · ${G_COMMIT.slopLatch} · ${G_COMMIT.dragEnabled} · (1 − ${G_COMMIT.onMax}) = ${fi >= MARK.up1 ? G_COMMIT.commit : 0}`,
          ]}
          size={14}
        />
        <CodeChip
          x={CHIP.x}
          y={CHIP.y}
          stripe={colors.WARM}
          opacity={v(scene.chipFocus)}
          lines={['focused′ = down ? hitRectangle : focused', `// down on window 1: focused → 1, pressWasFocused = ${b(STATES[MARK.focusDown].pressWasFocused)}, no toggle`]}
          size={14}
        />
        <CodeChip
          x={CHIP.x}
          y={CHIP.y}
          stripe={chipStripe}
          opacity={v(scene.chipMax)}
          lines={[
            'toggle = up · pressActive · (1 − slopLatch) · pressWasFocused · clickToggles',
            `       = ${G_MAX.up} · ${G_MAX.pressActive} · (1 − ${G_MAX.slopLatch}) · ${G_MAX.wasFocused} · ${G_MAX.clickToggles} = ${G_MAX.toggle}`,
            'maximized′ = maximized + toggle × (1 − 2 × maximized)',
            `           = ${MAX_BEFORE} + ${G_MAX.toggle} × (1 − 2 × ${MAX_BEFORE}) = ${MAX_AFTER}`,
          ]}
          size={14}
        />
        <CodeChip
          x={CHIP.x}
          y={CHIP.y}
          stripe={colors.NEGATIVE}
          opacity={v(scene.chipCancel)}
          lines={[
            'toggle = up · pressActive · (1 − slopLatch) · pressWasFocused · clickToggles',
            `       = ${G_CANCEL.up} · ${G_CANCEL.pressActive} · (1 − ${G_CANCEL.slopLatch}) · ${G_CANCEL.wasFocused} · ${G_CANCEL.clickToggles} = ${G_CANCEL.toggle}`,
          ]}
          size={14}
        />
        {v(scene.stayU) > 0.005 && (
          <text x={CHIP.x + 16} y={CHIP.y + 82} fontSize={14} fill={colors.NEGATIVE} opacity={v(scene.stayU)}>
            {`click cancelled · maximized stays ${b(STATES[MARK.cancelUp].maximized[1])} · out 20 px and back`}
          </text>
        )}

        {/* ================= B11–B12 · the probe ================= */}
        {laneU > 0.005 && (
          <g opacity={laneU * laneOp}>
            {[
              { v: LANE_A, ty: LANE_TAPE.ha, head: 'trace A · a drag, then K inputs', prefix: PROBE_SESSION, out: PROBE.a.left },
              { v: LANE_B, ty: LANE_TAPE.hb, head: 'trace B · 3 empty frames, then the same K inputs', prefix: [null, null, null] as Input[], out: PROBE.b.left },
            ].map((lane, li) => (
              <g key={li}>
                <StageView v={lane.v} geos={laneGeo(lerp(400, lane.out, laneOut))} labels={false} />
                <text x={LANE_TAPE.x0} y={lane.ty - 12} fontSize={13} fill={colors.MUTED}>
                  {lane.head}
                </text>
                <g opacity={laneTapeU > 0 ? 1 : 0}>
                  <rect x={LANE_TAPE.x0} y={lane.ty} width={lerp(0, TICK_END - LANE_TAPE.x0 + 6, laneTapeU)} height={LANE_TAPE.h} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                  {lane.prefix.map((inp, k) => {
                    const cx = LANE_TAPE.x0 + LANE_TAPE.slot * (k + 0.5) + 4;
                    return (
                      <g key={k} opacity={clamp01(laneTapeU * 8 - k)}>
                        {inp ? (
                          <text x={cx} y={lane.ty + 25} textAnchor="middle" fontSize={12} fontFamily={MONO} fontWeight={700} fill={KIND_COLOR[inp.kind]}>
                            {KIND_LABEL[inp.kind]}
                          </text>
                        ) : (
                          <circle cx={cx} cy={lane.ty + 20} r={2.5} fill={colors.MUTED} />
                        )}
                      </g>
                    );
                  })}
                  {li === 0 && (
                    <text x={LANE_TAPE.x0 + LANE_TAPE.slot * 1.5 + 4} y={lane.ty + LANE_TAPE.h + 16} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={clamp01(laneTapeU * 4 - 1)}>
                      +60
                    </text>
                  )}
                  <path
                    d={Array.from({ length: Math.round(256 * clamp01((laneTapeU - 0.15) / 0.85)) }, (_, k) => `M ${LANE_TAPE.tick0 + (k + 0.5) * LANE_TAPE.tickW} ${lane.ty + 14} v 12`).join(' ')}
                    stroke={colors.MUTED}
                    strokeWidth={1}
                    strokeOpacity={0.7}
                  />
                </g>
                {/* the output: the stored-left latch of each run */}
                {v(scene.cellsU) > 0.005 && (
                  <g opacity={v(scene.cellsU)}>
                    <rect x={OUT_X} y={lane.ty - 4} width={136} height={48} rx={6} fill={colors.PANEL} stroke={v(scene.latchHi) > 0.5 ? colors.ACCENT : colors.GRID} strokeWidth={lerp(1, 2.5, v(scene.latchHi))} />
                    <text x={OUT_X + 10} y={lane.ty + 12} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                      stored left
                    </text>
                    <text x={OUT_X + 10} y={lane.ty + 35} fontSize={20} fontFamily={MONO} fontWeight={700} fill={li === 0 ? colors.ACCENT : colors.TEXT}>
                      {String(lane.out)}
                    </text>
                  </g>
                )}
              </g>
            ))}
            {/* the shared suffix: the last K inputs, identical in both traces */}
            {v(scene.bandU) > 0.005 && (
              <g opacity={v(scene.bandU)}>
                <rect x={TICK_END - bandW} y={LANE_TAPE.ha - 6} width={bandW} height={LANE_TAPE.hb + LANE_TAPE.h + 6 - LANE_TAPE.ha + 6} rx={3} fill={colors.WARM} fillOpacity={0.12} stroke={colors.WARM} strokeWidth={1.5} />
                <text x={bandW < 180 ? TICK_END - bandW - 10 : TICK_END - bandW / 2} y={300} textAnchor={bandW < 180 ? 'end' : 'middle'} fontSize={14} fontFamily={MONO} fill={colors.WARM}>
                  {`same last ${kNow} input${kNow === 1 ? '' : 's'}`}
                </text>
                <text x={LANE_TAPE.x0} y={520} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                  K =
                </text>
                {PROBE_K.map((k, i) => (
                  <text key={k} x={LANE_TAPE.x0 + 40 + i * 52} y={520} fontSize={14} fontFamily={MONO} fontWeight={k === kNow ? 700 : 400} fill={k === kNow ? colors.WARM : colors.MUTED}>
                    {String(k)}
                  </text>
                ))}
                <text x={LANE_TAPE.x0} y={546} fontSize={13} fill={colors.MUTED}>
                  tested with empty frames and with identical hover moves
                </text>
              </g>
            )}
            {v(scene.neqU) > 0.005 && (
              <g opacity={v(scene.neqU)} transform={`translate(${OUT_X + 68}, 288) scale(${v(scene.neqU)})`}>
                <text x={0} y={8} textAnchor="middle" fontSize={22} fontFamily={MONO} fontWeight={700} fill={colors.WARM}>
                  {`${PROBE.a.left} ≠ ${PROBE.b.left}`}
                </text>
              </g>
            )}
            {v(scene.fU) > 0.005 && (
              <g opacity={v(scene.fU)}>
                <rect x={740} y={498} width={250} height={40} rx={8} fill={colors.PANEL} stroke={colors.MUTED} />
                <text x={865} y={524} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.TEXT}>
                  f(last K inputs) = ?
                </text>
                <line x1={748} y1={518} x2={lerp(748, 982, v(scene.strikeU))} y2={518} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
                <Arrow x1={990} y1={508} x2={OUT_X - 6} y2={LANE_TAPE.ha + 24} u={v(scene.fU)} color={colors.MUTED} />
                <Arrow x1={990} y1={516} x2={OUT_X - 6} y2={LANE_TAPE.hb + 24} u={v(scene.fU)} color={colors.MUTED} />
              </g>
            )}
          </g>
        )}
        {v(scene.summaryU) > 0.005 && (
          <g opacity={v(scene.summaryU)}>
            <rect x={200} y={262} width={880} height={110} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={308} textAnchor="middle" fontSize={22} fill={colors.TEXT}>
              Latches hold committed aggregates,
            </text>
            <text x={640} y={342} textAnchor="middle" fontSize={22} fill={colors.ACCENT}>
              written on events, not every frame.
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip + the referee badge ================= */}
      <rect x={40} y={18} width={214} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Latches, Not History
      </text>
      {v(scene.badgeU) > 0.005 && (
        <g opacity={v(scene.badgeU)}>
          <rect x={1240 - 23 * CH13 - 30} y={18} width={23 * CH13 + 30} height={24} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.6} />
          <circle cx={1240 - 23 * CH13 - 16} cy={30} r={4} fill={colors.POSITIVE} />
          <text x={1240 - 23 * CH13 - 6} y={35} fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
            oracle === every frame
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
