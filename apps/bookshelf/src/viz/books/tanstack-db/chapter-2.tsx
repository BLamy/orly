// Live Queries — the pipeline that never re-runs
//
// Backed by: docs/guides/live-queries.md (liveQueryCollectionOptions, eq,
// virtual props), packages/db/src/query/compiler/index.ts (compileQuery;
// operators map/filter/join/reduce/distinct imported from @tanstack/db-ivm),
// packages/db/src/query/optimizer.ts (optimizeQuery — predicate pushdown),
// packages/db/src/query/live/collection-subscriber.ts (subscribeChanges →
// sendChangesToInput → graph.run), packages/db-ivm/src/multiset.ts
// (MultiSet: Array<[record, ±1]>). ONE machine: the fluent query folds into
// a dataflow graph; row-deltas hop operator to operator while ten thousand
// untouched rows sleep below.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The query (real API from docs/guides/live-queries.md) and its compiled form.
// ---------------------------------------------------------------------------

const CLAUSES = [
  { code: '.from({ todo: todosCollection })', op: 'source' },
  { code: ".where(({ todo }) => eq(todo.completed, false))", op: 'filter' },
  { code: '.join({ user: usersCollection }, …)', op: 'join' },
  { code: '.select(({ todo, user }) => ({ … }))', op: 'select' },
] as const;

// Clause chips (top) fold down into pipeline nodes (middle).
const CHIP_X = 240;
const CHIP_Y0 = 96;
const CHIP_H = 34;
const CHIP_GAP = 42;

const PIPE_Y = 322;
const PIPE = {
  source: { x: 200, w: 150, label: 'todos', sub: 'collection' },
  filter: { x: 425, w: 130, label: 'filter', sub: 'where' },
  join: { x: 630, w: 120, label: 'join', sub: 'users ⋈' },
  select: { x: 830, w: 120, label: 'select', sub: 'project' },
  result: { x: 1064, w: 170, label: 'live results', sub: 'a collection' },
} as const;
type PipeKey = keyof typeof PIPE;
const PIPE_ORDER: PipeKey[] = ['source', 'filter', 'join', 'select', 'result'];
const NODE_H = 58;

// In the un-optimized draft the filter sits AFTER the join; optimizeQuery
// slides it upstream (predicate pushdown). We animate that slide.
const FILTER_X_DRAFT = 730;
const FILTER_X_PUSHED = PIPE.filter.x;

// The sleeping multitude: a field of source rows below the pipeline.
const FIELD = { x0: 120, y0: 470, x1: 700, y1: 600 } as const;
const N_SLEEP = 260;
const rand = mulberry32(20260716);
const SLEEPERS = Array.from({ length: N_SLEEP }, () => ({
  x: FIELD.x0 + rand() * (FIELD.x1 - FIELD.x0),
  y: FIELD.y0 + rand() * (FIELD.y1 - FIELD.y0),
  r: 1.6 + rand() * 1.6,
}));

// Result list rows (the component's view).
const LIST = { x: 980, y0: 452, w: 220, rowH: 30 } as const;

// Delta hop paths (edge to edge along the pipeline).
const hopPath = (a: PipeKey, b: PipeKey) => ({
  from: { x: PIPE[a].x + PIPE[a].w / 2, y: PIPE_Y },
  to: { x: PIPE[b].x - PIPE[b].w / 2, y: PIPE_Y },
});

const CAM_PIPE: CameraState = { x: 640, y: 330, k: 1.22 };
const CAM_JOIN: CameraState = { x: 660, y: 360, k: 1.55 };
const CAM_RESULT: CameraState = { x: 1010, y: 400, k: 1.35 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  chipsU: ChannelRef<number>;
  foldU: ChannelRef<number>;
  pushU: ChannelRef<number>;
  pipeU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  listU: ChannelRef<number>;
  sleepU: ChannelRef<number>;
  d1: ChannelRef<number>[];
  glow: Record<'filter' | 'join' | 'select' | 'result', ChannelRef<number>>;
  arrU: ChannelRef<number>;
  countVal: ChannelRef<number>;
  countPop: ChannelRef<number>;
  timerU: ChannelRef<number>;
  d2minus: ChannelRef<number>[];
  d2plus: ChannelRef<number>[];
  derivedU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipsU = tl.channel('chipsU', 0); // query text chips appear
  const foldU = tl.channel('foldU', 0); // chips fold into pipeline nodes
  const pushU = tl.channel('pushU', 0); // predicate pushdown slide
  const pipeU = tl.channel('pipeU', 0); // pipeline edges draw
  const fillU = tl.channel('fillU', 0); // initial fill streams through
  const listU = tl.channel('listU', 0); // result list renders
  const sleepU = tl.channel('sleepU', 0); // the sleeping rows field
  const d1 = [0, 1, 2, 3].map((i) => tl.channel(`d1hop${i}`, 0)); // +1 delta hops
  const glow = {
    filter: tl.channel('filterGlow', 0),
    join: tl.channel('joinGlow', 0),
    select: tl.channel('selectGlow', 0),
    result: tl.channel('resultGlow', 0),
  };
  const arrU = tl.channel('arrU', 0); // the join's index/arrangement card
  const countVal = tl.channel('countVal', 12); // live count readout (stepped)
  const countPop = tl.channel('countPop', 0);
  const timerU = tl.channel('timerU', 0); // "0.3 ms" chip
  const d2minus = [0, 1, 2, 3].map((i) => tl.channel(`d2m${i}`, 0)); // retraction
  const d2plus = [0, 1, 2, 3].map((i) => tl.channel(`d2p${i}`, 0)); // re-insert
  const derivedU = tl.channel('derivedU', 0); // a second query chained off results
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Here is a query you will write once and never run again. Not because it dies — because it never stops being right.',
  });
  tl.tween(chipsU, CLAUSES.length, { at: 1.2, dur: 2.2, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the fluent query —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'It reads like a query builder: take the todos, keep the unfinished ones, join each to its user, and project the fields the screen needs.',
  });
  tl.hold(13.5, 0.5);

  // — Beat 3 · compile —
  tl.caption({
    at: 14.0,
    dur: 6.5,
    text: 'But it does not execute top to bottom. The builder compiles it into a dataflow pipeline: each clause becomes an operator wired to the next.',
  });
  tl.tween(cam, CAM_PIPE, { at: 14.2, dur: 1.4, ease: ease.move });
  tl.tween(foldU, 1, { at: 15.0, dur: 1.6, ease: ease.move });
  tl.tween(pipeU, 1, { at: 16.6, dur: 1.2, ease: ease.draw });
  tl.hold(20.5, 0.5);

  // — Beat 4 · predicate pushdown —
  tl.caption({
    at: 21.0,
    dur: 6.5,
    text: 'An optimizer rearranges the graph before it runs. Watch the filter slide upstream, ahead of the join, so rows are dropped before the expensive work.',
  });
  tl.tween(pushU, 1, { at: 22.8, dur: 1.4, ease: ease.move });
  tl.hold(27.5, 0.5);

  // — Beat 5 · initial fill —
  tl.caption({
    at: 28.0,
    dur: 6.0,
    text: 'The first run is ordinary: every row streams through once, and the results land in a new collection. A component renders the list.',
  });
  tl.tween(fillU, 1, { at: 28.6, dur: 2.8, ease: ease.linear });
  tl.tween(listU, 1, { at: 31.2, dur: 1.0, ease: ease.enter });
  tl.tween(sleepU, 1, { at: 31.6, dur: 1.4, ease: ease.enter });
  tl.hold(34.0, 0.5);

  // — Beat 6 · one row changes —
  tl.caption({
    at: 34.5,
    dur: 5.5,
    text: 'Now the interesting part. One todo gets checked off. One row, out of ten thousand.',
  });
  tl.hold(40.0, 0.5);

  // — Beat 7 · the delta rides —
  tl.caption({
    at: 40.5,
    dur: 7.5,
    text: 'The change enters the pipeline as a delta: this row, minus one. Each operator transforms just that delta and hands it on. The other rows sleep through the whole thing.',
  });
  tl.tween(d1[0], 1, { at: 41.0, dur: 1.2, ease: ease.linear });
  tl.tween(glow.filter, 1, { at: 42.1, dur: 0.25, ease: ease.enter });
  tl.tween(glow.filter, 0, { at: 42.6, dur: 0.5, ease: ease.enter });
  tl.tween(d1[1], 1, { at: 42.5, dur: 1.2, ease: ease.linear });
  tl.tween(glow.join, 1, { at: 43.6, dur: 0.25, ease: ease.enter });
  tl.tween(glow.join, 0, { at: 44.1, dur: 0.5, ease: ease.enter });
  tl.tween(d1[2], 1, { at: 44.0, dur: 1.2, ease: ease.linear });
  tl.tween(glow.select, 1, { at: 45.1, dur: 0.25, ease: ease.enter });
  tl.tween(glow.select, 0, { at: 45.6, dur: 0.5, ease: ease.enter });
  tl.tween(d1[3], 1, { at: 45.5, dur: 1.2, ease: ease.linear });
  tl.set(countVal, 11, 46.6);
  tl.tween(countPop, 1, { at: 46.6, dur: 0.3, ease: ease.pop });
  tl.tween(countPop, 0, { at: 47.1, dur: 0.5, ease: ease.enter });
  tl.tween(glow.result, 1, { at: 46.6, dur: 0.25, ease: ease.enter });
  tl.tween(glow.result, 0, { at: 47.2, dur: 0.55, ease: ease.enter });
  tl.hold(48.0, 0.4);

  // — Beat 8 · sub-millisecond —
  tl.caption({
    at: 48.4,
    dur: 5.5,
    text: 'That is why these queries answer in under a millisecond: the work is proportional to the change, never to the data.',
  });
  tl.tween(timerU, 1, { at: 49.2, dur: 0.5, ease: ease.pop });
  tl.hold(53.9, 0.5);

  // — Beat 9 · the join remembers —
  tl.caption({
    at: 54.4,
    dur: 6.5,
    text: 'The join can do this because it keeps an index of every row it has already seen. A new delta looks up its matches — nothing is ever re-scanned.',
  });
  tl.tween(cam, CAM_JOIN, { at: 54.6, dur: 1.4, ease: ease.move });
  tl.tween(arrU, 1, { at: 55.6, dur: 0.9, ease: ease.enter });
  tl.hold(60.9, 0.5);

  // — Beat 10 · update = retraction pair —
  tl.caption({
    at: 61.4,
    dur: 7.5,
    text: 'Even an edit is just two deltas: the old row leaves as a minus one, the new row arrives as a plus one. Same rails, no special cases.',
  });
  tl.tween(cam, CAM_PIPE, { at: 61.6, dur: 1.3, ease: ease.move });
  for (let i = 0; i < 4; i++) {
    tl.tween(d2minus[i], 1, { at: 62.8 + i * 0.75, dur: 0.85, ease: ease.linear });
    tl.tween(d2plus[i], 1, { at: 63.5 + i * 0.75, dur: 0.85, ease: ease.linear });
  }
  // the edit replaces a row in place — the count pops but does not change
  tl.tween(countPop, 1, { at: 66.6, dur: 0.3, ease: ease.pop });
  tl.tween(countPop, 0, { at: 67.1, dur: 0.5, ease: ease.enter });
  tl.hold(68.9, 0.5);

  // — Beat 11 · results are collections —
  tl.caption({
    at: 69.4,
    dur: 6.5,
    text: 'And because the result is itself a collection, you can hang another live query off it. Pipelines feeding pipelines, all staying current together.',
  });
  tl.tween(cam, CAM_RESULT, { at: 69.6, dur: 1.4, ease: ease.move });
  tl.tween(derivedU, 1, { at: 70.6, dur: 1.2, ease: ease.enter });
  tl.hold(75.9, 0.5);

  // — Beat 12 · close —
  tl.caption({
    at: 76.4,
    dur: 7.0,
    text: 'This engine is differential dataflow, running in your browser tab. Write the query once; the pipeline keeps the answer fresh forever.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 76.6, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 77.5, dur: 1.3, ease: ease.move });
  tl.hold(83.4, 1.4);

  return {
    tl,
    cam,
    chipsU,
    foldU,
    pushU,
    pipeU,
    fillU,
    listU,
    sleepU,
    d1,
    glow,
    arrU,
    countVal,
    countPop,
    timerU,
    d2minus,
    d2plus,
    derivedU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function OpNode({ x, w, label, sub, u, glowV, color }: { x: number; w: number; label: string; sub: string; u: number; glowV: number; color: string }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      {glowV > 0.02 && <rect x={x - w / 2 - 7} y={PIPE_Y - NODE_H / 2 - 7} width={w + 14} height={NODE_H + 14} rx={14} fill={color} opacity={0.22 * glowV} />}
      <rect x={x - w / 2} y={PIPE_Y - NODE_H / 2} width={w} height={NODE_H} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x} y={PIPE_Y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
      <text x={x} y={PIPE_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
        {sub}
      </text>
    </g>
  );
}

/** A ±1 delta chip riding a hop. */
function Delta({ a, b, u, minus, text }: { a: PipeKey; b: PipeKey; u: number; minus?: boolean; text?: string }) {
  if (u <= 0 || u >= 1) return null;
  const { from, to } = hopPath(a, b);
  const x = lerp(from.x, to.x, u);
  const y = PIPE_Y - 2 + (minus ? -11 : 0);
  const c = minus ? colors.NEGATIVE : colors.POSITIVE;
  const label = text ?? (minus ? '(row, −1)' : '(row, +1)');
  return (
    <g>
      <rect x={x - 34} y={y - 11} width={68} height={20} rx={10} fill={colors.BG} stroke={c} strokeWidth={1.3} />
      <text x={x} y={y + 3.5} textAnchor="middle" fill={c} fontSize={10.5} fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const chipsU = s.get(scene.chipsU);
  const foldU = s.get(scene.foldU);
  const pushU = s.get(scene.pushU);
  const pipeU = s.get(scene.pipeU);
  const fillU = s.get(scene.fillU);
  const listU = s.get(scene.listU);
  const sleepU = s.get(scene.sleepU);
  const d1 = scene.d1.map((c) => s.get(c));
  const gFilter = s.get(scene.glow.filter);
  const gJoin = s.get(scene.glow.join);
  const gSelect = s.get(scene.glow.select);
  const gResult = s.get(scene.glow.result);
  const arrU = s.get(scene.arrU);
  const countVal = Math.round(s.get(scene.countVal));
  const countPop = s.get(scene.countPop);
  const timerU = s.get(scene.timerU);
  const d2m = scene.d2minus.map((c) => s.get(c));
  const d2p = scene.d2plus.map((c) => s.get(c));
  const derivedU = s.get(scene.derivedU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const filterX = lerp(FILTER_X_DRAFT, FILTER_X_PUSHED, pushU);
  // node x positions accounting for the pushdown slide (join shifts right a touch)
  const nodeX: Record<PipeKey, number> = {
    source: PIPE.source.x,
    filter: filterX,
    join: lerp(PIPE.join.x - 55, PIPE.join.x, pushU),
    select: PIPE.select.x,
    result: PIPE.result.x,
  };
  const glowOf: Record<PipeKey, number> = { source: 0, filter: gFilter, join: gJoin, select: gSelect, result: gResult };
  const colorOf: Record<PipeKey, string> = {
    source: colors.ACCENT,
    filter: colors.SECONDARY,
    join: colors.WARM,
    select: colors.SECONDARY,
    result: colors.POSITIVE,
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the fluent query, as chips ---- */}
        <g opacity={dimAll}>
          {CLAUSES.map((cl, i) => {
            const appear = clamp01(chipsU - i);
            // fold: chips 1..3 sink toward their operator nodes and fade
            const sink = i === 0 ? 0 : foldU;
            const y = CHIP_Y0 + i * CHIP_GAP + sink * 60;
            return (
              <g key={i} opacity={appear * (1 - sink)}>
                <rect x={CHIP_X} y={y} width={470} height={CHIP_H} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.1} />
                <text x={CHIP_X + 14} y={y + 22} fill={colors.TEXT} fontSize={12.5} fontFamily="ui-monospace, monospace">
                  {cl.code}
                </text>
              </g>
            );
          })}
          <text x={CHIP_X} y={CHIP_Y0 - 18} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace" opacity={clamp01(chipsU) * (1 - foldU)}>
            createLiveQueryCollection((q) =&gt; q
          </text>
          {/* compile arrow + label */}
          <g opacity={foldU * (1 - pushU * 0.0)}>
            <text x={150} y={PIPE_Y - 74} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
              compileQuery → a dataflow graph
            </text>
          </g>
          <g opacity={pushU}>
            <text x={425} y={PIPE_Y - 74} fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
              optimizeQuery: predicate pushdown
            </text>
          </g>
        </g>

        {/* ---- pipeline ---- */}
        <g opacity={dimAll}>
          {/* edges */}
          {PIPE_ORDER.slice(0, -1).map((k, i) => {
            const a = nodeX[k] + PIPE[k].w / 2;
            const b = nodeX[PIPE_ORDER[i + 1]] - PIPE[PIPE_ORDER[i + 1]].w / 2;
            return (
              <line key={k} x1={a} y1={PIPE_Y} x2={a + (b - a) * pipeU} y2={PIPE_Y} stroke={colors.GRID} strokeWidth={1.6} opacity={0.9} />
            );
          })}
          {/* initial fill: a stream of dots washing left → right */}
          {fillU > 0 && fillU < 1 && (
            <g>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const u = clamp01(fillU * 1.35 - i * 0.05);
                if (u <= 0 || u >= 1) return null;
                const x = lerp(PIPE.source.x + 40, PIPE.result.x - 60, u);
                return <circle key={i} cx={x} cy={PIPE_Y + (i % 3) * 7 - 7} r={3.2} fill={colors.ACCENT} opacity={0.8} />;
              })}
            </g>
          )}
          {PIPE_ORDER.map((k) => (
            <OpNode
              key={k}
              x={nodeX[k]}
              w={PIPE[k].w}
              label={PIPE[k].label}
              sub={PIPE[k].sub}
              u={k === 'source' || k === 'result' ? clamp01(foldU * 1.5) : foldU}
              glowV={glowOf[k]}
              color={colorOf[k]}
            />
          ))}

          {/* live count readout above the result node */}
          <g opacity={listU}>
            <text x={PIPE.result.x} y={PIPE_Y - 48 - countPop * 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={17 + countPop * 4}>
              {countVal} open
            </text>
          </g>
          <g opacity={timerU}>
            <rect x={PIPE.result.x - 62} y={PIPE_Y + 42} width={124} height={26} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={PIPE.result.x} y={PIPE_Y + 60} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
              update: ~0.3 ms
            </text>
          </g>
        </g>

        {/* ---- delta chips (checked-off todo: a −1 rides through) ---- */}
        <Delta a="source" b="filter" u={d1[0]} minus />
        <Delta a="filter" b="join" u={d1[1]} minus />
        <Delta a="join" b="select" u={d1[2]} minus text="(row ⋈ user, −1)" />
        <Delta a="select" b="result" u={d1[3]} minus />

        {/* ---- retraction pair for the edit ---- */}
        <Delta a="source" b="filter" u={d2m[0]} minus text="(old, −1)" />
        <Delta a="filter" b="join" u={d2m[1]} minus text="(old, −1)" />
        <Delta a="join" b="select" u={d2m[2]} minus text="(old, −1)" />
        <Delta a="select" b="result" u={d2m[3]} minus text="(old, −1)" />
        <Delta a="source" b="filter" u={d2p[0]} text="(new, +1)" />
        <Delta a="filter" b="join" u={d2p[1]} text="(new, +1)" />
        <Delta a="join" b="select" u={d2p[2]} text="(new, +1)" />
        <Delta a="select" b="result" u={d2p[3]} text="(new, +1)" />

        {/* ---- the join's arrangement/index card ---- */}
        <g opacity={arrU * dimAll}>
          <line x1={nodeX.join} y1={PIPE_Y + NODE_H / 2} x2={nodeX.join} y2={PIPE_Y + 96} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="4 4" />
          <rect x={nodeX.join - 92} y={PIPE_Y + 96} width={184} height={72} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
          <text x={nodeX.join} y={PIPE_Y + 118} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
            the join&apos;s index
          </text>
          <text x={nodeX.join} y={PIPE_Y + 136} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            every row seen, keyed
          </text>
          <text x={nodeX.join} y={PIPE_Y + 152} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            lookup, not re-scan
          </text>
        </g>

        {/* ---- the sleeping multitude ---- */}
        <g opacity={sleepU * dimAll * (1 - clamp01((cam.k - 1.25) * 2))}>
          {SLEEPERS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={colors.MUTED} opacity={0.22} />
          ))}
          <text x={(FIELD.x0 + FIELD.x1) / 2} y={FIELD.y0 - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
            9,999 rows, fast asleep
          </text>
        </g>

        {/* ---- the component's list ---- */}
        <g opacity={listU * dimAll}>
          <text x={LIST.x} y={LIST.y0 - 12} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
            useLiveQuery → the screen
          </text>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={LIST.x} y={LIST.y0 + i * LIST.rowH} width={LIST.w} height={LIST.rowH - 6} rx={6} fill={colors.PANEL} stroke={i === 0 && gResult > 0.02 ? colors.POSITIVE : colors.GRID} strokeWidth={i === 0 && gResult > 0.02 ? 1.6 : 1} />
              <circle cx={LIST.x + 14} cy={LIST.y0 + i * LIST.rowH + 12} r={4} fill="none" stroke={colors.MUTED} strokeWidth={1.2} />
              <rect x={LIST.x + 28} y={LIST.y0 + i * LIST.rowH + 8} width={LIST.w - 60 - i * 22} height={8} rx={4} fill={colors.MUTED} opacity={0.4} />
            </g>
          ))}
        </g>

        {/* ---- derived query chained off the result ---- */}
        <g opacity={derivedU * dimAll}>
          <line x1={PIPE.result.x + PIPE.result.w / 2 - 10} y1={PIPE_Y - 20} x2={PIPE.result.x + 60} y2={PIPE_Y - 80} stroke={colors.GRID} strokeWidth={1.4} />
          <rect x={PIPE.result.x - 10} y={PIPE_Y - 138} width={168} height={54} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
          <text x={PIPE.result.x + 74} y={PIPE_Y - 116} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
            another live query
          </text>
          <text x={PIPE.result.x + 74} y={PIPE_Y - 98} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            .from(activeUsers)
          </text>
        </g>

        {/* ---- quiet closing panel ---- */}
        <g opacity={closeU}>
          <rect x={310} y={215} width={660} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            work follows the change, not the data
          </text>
          <text x={640} y={308} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            every change is a record with a plus or minus one
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            operators transform deltas and remember what they have seen
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            results are collections — queries stack
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            @tanstack/db-ivm · differential dataflow · MultiSet&lt;[row, ±1]&gt;
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
