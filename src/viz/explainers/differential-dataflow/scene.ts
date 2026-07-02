import { CAMERA_HOME, Timeline, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * Differential Dataflow — Recompute Nothing.
 *
 * The concepts are the real ones (McSherry / Materialize): a collection is a
 * multiset of (data, time, diff) updates; operators (map / join / count)
 * transform update streams; joins keep ARRANGEMENTS — indexed traces of every
 * update they've seen — so a new delta joins against stored history instead of
 * re-scanning inputs; and a moving frontier certifies which times are final.
 * Work is proportional to the size of the change, not the size of the data.
 *
 * Everything here is pure and built once at module scope: the pipeline layout,
 * the arrangement's stored trace, and the timeline. Every frame is a function
 * of the sampled channels (the scrubbability invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

/* --------------------------------------------------------------------- */
/* Layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633).  */
/* --------------------------------------------------------------------- */

export const PIPE_Y = 352;

/** The dataflow graph: source → map → join → count → sink. */
export const NODES = {
  orders: { x: 140, y: PIPE_Y, w: 150 },
  map: { x: 350, y: PIPE_Y, w: 120 },
  join: { x: 560, y: PIPE_Y, w: 120 },
  count: { x: 770, y: PIPE_Y, w: 124 },
  dash: { x: 1080, y: PIPE_Y, w: 170 },
} as const;

/** The operator zone — the query itself, drawn as a dataflow. */
export const ZONE = { x: 272, y: 268, w: 576, h: 168 };

const NODE_H = 56;

/** Pipeline edges, node edge → node edge (arrowheads land cleanly). */
export const EDGES: Array<{ from: Pt; to: Pt }> = [
  { from: { x: NODES.orders.x + NODES.orders.w / 2, y: PIPE_Y }, to: { x: NODES.map.x - NODES.map.w / 2, y: PIPE_Y } },
  { from: { x: NODES.map.x + NODES.map.w / 2, y: PIPE_Y }, to: { x: NODES.join.x - NODES.join.w / 2, y: PIPE_Y } },
  { from: { x: NODES.join.x + NODES.join.w / 2, y: PIPE_Y }, to: { x: NODES.count.x - NODES.count.w / 2, y: PIPE_Y } },
  { from: { x: NODES.count.x + NODES.count.w / 2, y: PIPE_Y }, to: { x: NODES.dash.x - NODES.dash.w / 2, y: PIPE_Y } },
];

/** The strawman batch sweep visits every node, dwelling at each operator. */
export const BATCH_PATH: Pt[] = [
  { x: NODES.orders.x, y: PIPE_Y },
  { x: NODES.map.x, y: PIPE_Y },
  { x: NODES.join.x, y: PIPE_Y },
  { x: NODES.count.x, y: PIPE_Y },
  { x: NODES.dash.x, y: PIPE_Y },
];

/** Delta hops, one per operator edge — each hop is its own RequestFlow so the
 *  label can change: the visible "tiny transformation" at every operator. */
export const HOPS: Pt[][] = [
  [{ x: NODES.orders.x, y: PIPE_Y }, { x: NODES.map.x, y: PIPE_Y }],
  [{ x: NODES.map.x, y: PIPE_Y }, { x: NODES.join.x, y: PIPE_Y }],
  [{ x: NODES.join.x, y: PIPE_Y }, { x: NODES.count.x, y: PIPE_Y }],
  [{ x: NODES.count.x, y: PIPE_Y }, { x: NODES.dash.x, y: PIPE_Y }],
];

/** Per-hop labels: how each operator rewrites the update as it passes. */
export const HOP_LABELS_PLUS = ['("alice", t=4, +1)', '(alice, +1)', '(alice ⋈ EU, +1)', '(total, +1)'];
export const HOP_LABELS_MINUS = ['("alice", t=6, −1)', '(alice, −1)', '(alice ⋈ EU, −1)', '(total, −1)'];

/* ---- beat 1: the one changed row, and the wry timers -------------------- */

export const CHIP0 = { x: 140, y: 262, text: '("alice", t=1, +1)' };
export const TIMER_POS = { x: 640, y: 496 };

/* ---- beat 2: (data, time, diff) chips ------------------------------------ */

export const CHIPS = [
  { x: 340, y: 150, text: '("alice", t=3, +1)', positive: true },
  { x: 640, y: 150, text: '("bob", t=3, +1)', positive: true },
  { x: 940, y: 150, text: '("carol", t=5, −1)', positive: false },
];
export const TRIPLE_POS = { x: 640, y: 96 };

/* ---- beat 3/5: the live count readout above the sink --------------------- */

export const COUNT_POS = { x: NODES.dash.x, y: 300 };

/* ---- beat 4: the join's arrangement (indexed trace of stored history) ---- */

export const ARR = { x: 470, y: 525, w: 190, h: NODE_H };
export const CAM_JOIN: CameraState = { x: 560, y: 430, k: 1.62 };

/** join bottom edge ↔ arrangement top edge. */
export const LOOKUP_PATH: Pt[] = [
  { x: NODES.join.x, y: PIPE_Y + NODE_H / 2 },
  { x: ARR.x + 4, y: ARR.y - ARR.h / 2 },
];

export const D4_IN: Pt[] = [{ x: NODES.map.x, y: PIPE_Y }, { x: NODES.join.x - NODES.join.w / 2, y: PIPE_Y }];
export const D4_OUT_A: Pt[] = [{ x: 620, y: 345 }, { x: 706, y: 345 }];
export const D4_OUT_B: Pt[] = [{ x: 620, y: 359 }, { x: 706, y: 359 }];

/** The stored trace: key → rows it has already seen (bob has two matches). */
export const TRACE = { x: 640, y: 468, cell: 30, gap: 4 };
export const TRACE_ROWS = ['alice', 'bob', 'carol'];
export const TRACE_VALUES = [
  [0.6, 0, 0, 0],
  [0.5, 0.75, 0, 0],
  [0.45, 0, 0, 0],
];
export const TRACE_CELLS = TRACE_VALUES.length * TRACE_VALUES[0].length;

/* ---- beat 6: timestamps and the frontier --------------------------------- */

export const BADGE_Y = 196;
export const BADGES = [1, 2, 3, 4, 5].map((t, i) => ({ t, x: 320 + i * 160 }));
export const FRONTIER = { x0: 250, x1: 730, y0: 170, y1: 222 };

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  // pipeline scaffolding
  const zoneU = tl.channel('zoneU', 0);
  const nodeU = [0, 1, 2, 3, 4].map((i) => tl.channel(`node${i}U`, 0));
  const connU = tl.channel('connU', 0);
  const connFlow = tl.channel('connFlow', 0); // dash traffic during the batch sweep
  const pipeDim = tl.channel('pipeDim', 0); // dims the pipeline for beat 2

  // beat 1 — the strawman
  const chip0U = tl.channel('chip0U', 0);
  const batchU = tl.channel('batchU', 0); // ONE linear channel for the big sweep
  const timer1U = tl.channel('timer1U', 0); // "took: minutes"

  // beat 2 — (data, time, diff)
  const tripleU = tl.channel('tripleU', 0);
  const chipsU = tl.channel('chipsU', 0); // per-chip u = clamp01(chipsU − i)

  // beat 3 — one delta flows (one linear channel per RequestFlow hop)
  const d3 = [0, 1, 2, 3].map((i) => tl.channel(`d3hop${i}`, 0));
  const mapGlow = tl.channel('mapGlow', 0);
  const joinGlow = tl.channel('joinGlow', 0);
  const countGlow = tl.channel('countGlow', 0);
  const dashGlow = tl.channel('dashGlow', 0);
  const countU = tl.channel('countU', 0); // readout fade-in
  const countVal = tl.channel('countVal', 41); // stepped, never interpolated
  const countPop = tl.channel('countPop', 0);
  const timer2U = tl.channel('timer2U', 0); // "took: microseconds"

  // beat 4 — the arrangement
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const arrU = tl.channel('arrU', 0);
  const arrConnU = tl.channel('arrConnU', 0);
  const traceU = tl.channel('traceU', 0); // grid cascade: cellU = clamp01(traceU·12 − idx)
  const arrHi = tl.channel('arrHi', 0); // highlight bob's row during the lookup
  const d4in = tl.channel('d4in', 0);
  const d4look = tl.channel('d4look', 0); // round-trip lookup flash
  const d4outA = tl.channel('d4outA', 0);
  const d4outB = tl.channel('d4outB', 0);

  // beat 5 — retraction (its own linear channels, NEGATIVE color)
  const d5 = [0, 1, 2, 3].map((i) => tl.channel(`d5hop${i}`, 0));

  // beat 6 — timestamps & the frontier
  const badgesU = tl.channel('badgesU', 0); // per-badge u = clamp01(badgesU − i)
  const frontierU = tl.channel('frontierU', 0);
  const frontierX = tl.channel('frontierX', FRONTIER.x0);

  /* ---- beat 1: the strawman — recompute everything (0 → 17.4) ---------- */

  tl.tween(zoneU, 1, { at: 0.3, dur: 1.1, ease: ease.draw });
  for (let i = 0; i < 5; i++) tl.tween(nodeU[i], 1, { at: 0.5 + i * 0.15, dur: 0.6, ease: ease.enter });
  tl.tween(connU, 1, { at: 1.7, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 0.6,
    dur: 4.2,
    text: 'One query, drawn as a dataflow: orders stream in, a live count falls out.',
  });
  tl.caption({ at: 5.2, dur: 3.2, text: 'Now one row changes. Just the one.' });
  tl.tween(chip0U, 1, { at: 5.5, dur: 0.5, ease: ease.pop });

  tl.tween(batchU, 1, { at: 7.0, dur: 5.8, ease: ease.linear });
  tl.tween(connFlow, 9, { at: 7.0, dur: 5.8, ease: ease.linear });
  tl.set(connFlow, 0, 12.85);
  tl.caption({
    at: 8.4,
    dur: 4.8,
    text: 'The batch answer: run the whole thing again. Ten million rows, for one edit.',
  });
  tl.tween(dashGlow, 1, { at: 12.6, dur: 0.3, ease: ease.enter });
  tl.tween(dashGlow, 0, { at: 13.2, dur: 0.6, ease: ease.enter });
  tl.tween(timer1U, 1, { at: 13.1, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 13.8,
    dur: 3.2,
    text: 'Took minutes. The change was one row; the effort was the whole table.',
  });
  tl.tween(chip0U, 0, { at: 16.9, dur: 0.4, ease: ease.enter });
  tl.hold(17.0, 0.4);

  /* ---- beat 2: the idea — (data, time, diff) (17.4 → 29.0) -------------- */

  tl.tween(timer1U, 0, { at: 17.4, dur: 0.5, ease: ease.enter });
  tl.tween(pipeDim, 1, { at: 17.4, dur: 0.7, ease: ease.move });
  tl.caption({
    at: 17.6,
    dur: 5.2,
    text: 'Differential dataflow changes the unit of work: not the data — the change. (data, time, diff).',
  });
  tl.tween(tripleU, 1, { at: 18.1, dur: 0.6, ease: ease.enter });
  tl.tween(chipsU, 3, { at: 18.7, dur: 1.5, ease: ease.enter });
  tl.caption({
    at: 23.2,
    dur: 4.2,
    text: 'diff +1 means this row appeared. −1 means it went away. That is the entire vocabulary.',
  });
  tl.tween(chipsU, 0, { at: 27.0, dur: 0.5, ease: ease.enter });
  tl.tween(tripleU, 0, { at: 27.0, dur: 0.5, ease: ease.enter });
  tl.tween(pipeDim, 0, { at: 27.5, dur: 0.7, ease: ease.move });
  tl.hold(28.6, 0.4);

  /* ---- beat 3: one delta flows through (29.0 → 42.4) -------------------- */

  tl.caption({ at: 29.0, dur: 3.8, text: 'Same query. This time, only the delta enters the pipeline.' });
  tl.tween(countU, 1, { at: 29.2, dur: 0.6, ease: ease.enter });
  tl.tween(d3[0], 1, { at: 29.8, dur: 1.3, ease: ease.linear });
  tl.tween(mapGlow, 1, { at: 30.95, dur: 0.25, ease: ease.enter });
  tl.tween(mapGlow, 0, { at: 31.5, dur: 0.55, ease: ease.enter });
  tl.tween(d3[1], 1, { at: 31.4, dur: 1.3, ease: ease.linear });
  tl.tween(joinGlow, 1, { at: 32.55, dur: 0.25, ease: ease.enter });
  tl.tween(joinGlow, 0, { at: 33.1, dur: 0.55, ease: ease.enter });
  tl.tween(d3[2], 1, { at: 33.0, dur: 1.3, ease: ease.linear });
  tl.tween(countGlow, 1, { at: 34.15, dur: 0.25, ease: ease.enter });
  tl.tween(countGlow, 0, { at: 34.7, dur: 0.55, ease: ease.enter });
  tl.caption({
    at: 33.2,
    dur: 4.4,
    text: 'Each operator transforms the update and hands it on. The other 9,999,999 rows sleep through it.',
  });
  tl.tween(d3[3], 1, { at: 34.6, dur: 1.2, ease: ease.linear });
  tl.set(countVal, 42, 35.65);
  tl.tween(countPop, 1, { at: 35.65, dur: 0.3, ease: ease.pop });
  tl.tween(countPop, 0, { at: 36.1, dur: 0.5, ease: ease.enter });
  tl.tween(dashGlow, 1, { at: 35.65, dur: 0.25, ease: ease.enter });
  tl.tween(dashGlow, 0, { at: 36.2, dur: 0.55, ease: ease.enter });
  tl.tween(timer2U, 1, { at: 36.4, dur: 0.5, ease: ease.enter });
  tl.caption({ at: 38.0, dur: 4.0, text: 'Microseconds. Work is proportional to the change — not the data.' });
  tl.hold(42.0, 0.4);

  /* ---- beat 4: arrangements — the join's indexed history (42.4 → 57.4) -- */

  tl.tween(timer2U, 0, { at: 42.4, dur: 0.4, ease: ease.enter });
  tl.tween(cam, CAM_JOIN, { at: 42.6, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 42.8,
    dur: 5.0,
    text: "Zoom into the join. It has been keeping an arrangement: every row it's ever seen, indexed by key.",
  });
  tl.tween(arrU, 1, { at: 44.0, dur: 0.7, ease: ease.enter });
  tl.tween(arrConnU, 1, { at: 44.7, dur: 0.8, ease: ease.draw });
  tl.tween(traceU, 1, { at: 45.0, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 48.0,
    dur: 5.0,
    text: 'A new +1 for bob? Ask the index: two stored matches, two output deltas. Nothing gets re-scanned.',
  });
  tl.tween(d4in, 1, { at: 48.3, dur: 1.2, ease: ease.linear });
  tl.tween(joinGlow, 1, { at: 49.4, dur: 0.25, ease: ease.enter });
  tl.tween(joinGlow, 0, { at: 49.9, dur: 0.5, ease: ease.enter });
  tl.tween(d4look, 1, { at: 49.9, dur: 1.8, ease: ease.linear });
  tl.tween(arrHi, 1, { at: 50.5, dur: 0.3, ease: ease.enter });
  tl.tween(arrHi, 0, { at: 52.0, dur: 0.5, ease: ease.enter });
  tl.tween(d4outA, 1, { at: 51.8, dur: 1.1, ease: ease.linear });
  tl.tween(d4outB, 1, { at: 52.15, dur: 1.1, ease: ease.linear });
  tl.tween(countGlow, 1, { at: 52.9, dur: 0.25, ease: ease.enter });
  tl.tween(countGlow, 0, { at: 53.4, dur: 0.5, ease: ease.enter });
  tl.caption({ at: 53.6, dur: 3.4, text: 'Joins never re-scan the past. They remember it.' });
  tl.tween(cam, CAMERA_HOME, { at: 55.6, dur: 1.3, ease: ease.move });
  tl.hold(56.9, 0.5);

  /* ---- beat 5: retraction — subtraction is just an update (57.4 → 67.6) - */

  tl.caption({
    at: 57.4,
    dur: 4.4,
    text: 'Now the fun one: alice cancels her order. No special case — a −1 rides the same rails.',
  });
  tl.tween(d5[0], 1, { at: 58.6, dur: 1.3, ease: ease.linear });
  tl.tween(mapGlow, 1, { at: 59.75, dur: 0.25, ease: ease.enter });
  tl.tween(mapGlow, 0, { at: 60.3, dur: 0.55, ease: ease.enter });
  tl.tween(d5[1], 1, { at: 60.2, dur: 1.3, ease: ease.linear });
  tl.tween(joinGlow, 1, { at: 61.35, dur: 0.25, ease: ease.enter });
  tl.tween(joinGlow, 0, { at: 61.9, dur: 0.55, ease: ease.enter });
  tl.tween(d5[2], 1, { at: 61.8, dur: 1.3, ease: ease.linear });
  tl.tween(countGlow, 1, { at: 62.95, dur: 0.25, ease: ease.enter });
  tl.tween(countGlow, 0, { at: 63.5, dur: 0.55, ease: ease.enter });
  tl.caption({
    at: 62.6,
    dur: 4.6,
    text: "The count ticks back down. The dashboard never saw a 'recompute' — subtraction is just another update.",
  });
  tl.tween(d5[3], 1, { at: 63.4, dur: 1.2, ease: ease.linear });
  tl.set(countVal, 41, 64.45);
  tl.tween(countPop, 1, { at: 64.45, dur: 0.3, ease: ease.pop });
  tl.tween(countPop, 0, { at: 64.9, dur: 0.5, ease: ease.enter });
  tl.tween(dashGlow, 1, { at: 64.45, dur: 0.25, ease: ease.enter });
  tl.tween(dashGlow, 0, { at: 65.0, dur: 0.55, ease: ease.enter });
  tl.hold(67.2, 0.4);

  /* ---- beat 6: timestamps & the frontier (67.6 → 79.8) ------------------ */

  tl.tween(badgesU, 5, { at: 67.8, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 67.6,
    dur: 5.2,
    text: 'One more piece: every update carries its timestamp, and a frontier sweeps along behind them.',
  });
  tl.tween(frontierU, 1, { at: 69.4, dur: 0.5, ease: ease.enter });
  tl.tween(frontierX, FRONTIER.x1, { at: 69.8, dur: 2.4, ease: ease.move });
  tl.caption({
    at: 73.4,
    dur: 5.0,
    text: 'Past the frontier, nothing older can ever change. That is how you trust an answer you never recomputed.',
  });
  tl.hold(78.4, 1.4);

  return {
    tl,
    zoneU,
    nodeU,
    connU,
    connFlow,
    pipeDim,
    chip0U,
    batchU,
    timer1U,
    tripleU,
    chipsU,
    d3,
    mapGlow,
    joinGlow,
    countGlow,
    dashGlow,
    countU,
    countVal,
    countPop,
    timer2U,
    cam,
    arrU,
    arrConnU,
    traceU,
    arrHi,
    d4in,
    d4look,
    d4outA,
    d4outB,
    d5,
    badgesU,
    frontierU,
    frontierX,
  };
}
