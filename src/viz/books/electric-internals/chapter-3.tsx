// Chapter 3 — Durable State
//
// Grounding: packages/state/STATE-PROTOCOL.md (change events: type, key,
// value, headers.operation ∈ insert|update|delete; control events
// snapshot-start / snapshot-end / reset; JSON streams), packages/state/src/
// materialized-state.ts (MaterializedState: a Map of type → Map of key →
// latest value, built by apply()ing events in order), electric.ax
// /docs/streams/durable-state.md (multiple entity types interleave in one
// stream: user, message, reaction …).
//
// Centerpiece: TAPE → TABLE — typed change events peel off the tape in order
// and fold into a (type, key) grid. The fold is computed at module scope;
// every frame renders the grid state implied by how many events have landed.
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
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The event log — real shapes from STATE-PROTOCOL.md, folded at module scope.
// ---------------------------------------------------------------------------
type Op = 'insert' | 'update' | 'delete';
interface Evt {
  type: 'user' | 'message' | 'reaction';
  key: string;
  op: Op;
  val: string;
}

const EVENTS: Evt[] = [
  { type: 'user', key: '1', op: 'insert', val: '{ name: "Alice" }' },
  { type: 'user', key: '2', op: 'insert', val: '{ name: "Bob" }' },
  { type: 'message', key: 'm1', op: 'insert', val: '"hi"' },
  { type: 'reaction', key: 'r1', op: 'insert', val: '👍 on m1' },
  { type: 'user', key: '1', op: 'update', val: '{ name: "Alice Smith" }' },
  { type: 'message', key: 'm2', op: 'insert', val: '"hello"' },
  { type: 'reaction', key: 'r1', op: 'delete', val: '' },
  { type: 'message', key: 'm1', op: 'update', val: '"hi there"' },
  { type: 'user', key: '3', op: 'insert', val: '{ name: "Carol" }' },
  { type: 'user', key: '2', op: 'delete', val: '' },
];
const N_EVT = EVENTS.length;

const TYPE_COLOR: Record<Evt['type'], string> = {
  user: colors.ACCENT,
  message: colors.SECONDARY,
  reaction: colors.WARM,
};
const OP_GLYPH: Record<Op, string> = { insert: '+', update: 'Δ', delete: '×' };

// rows of the materialized grid, in first-appearance order
const ROW_IDS: Array<{ type: Evt['type']; key: string }> = [];
for (const e of EVENTS) {
  if (!ROW_IDS.some((r) => r.type === e.type && r.key === e.key)) {
    ROW_IDS.push({ type: e.type, key: e.key });
  }
}
/** per row: the steps that touch it (fold history) */
const ROW_HISTORY = ROW_IDS.map((r) =>
  EVENTS.map((e, step) => ({ e, step })).filter(({ e }) => e.type === r.type && e.key === r.key)
);
/** fold: row state after `count` events have been applied */
function rowStateAt(row: number, count: number): { exists: boolean; val: string; changedStep: number } {
  let exists = false;
  let val = '';
  let changedStep = -1;
  for (const { e, step } of ROW_HISTORY[row]) {
    if (step >= count) break;
    exists = e.op !== 'delete';
    val = e.val;
    changedStep = step;
  }
  return { exists, val, changedStep };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const TAPE_Y = 150;
const TAPE_X0 = 120;
const CELL_W = 46;
const CELL_H = 50;
const N_SNAP = 4; // snapshot-start · two dump events · snapshot-end
const cellX = (i: number): number => TAPE_X0 + i * CELL_W;

const GRID_X = 735;
const GRID_Y0 = 268;
const ROW_H = 40;
const GRID_W = 440;

const rowY = (r: number): number => GRID_Y0 + r * ROW_H;

// anatomy card (beat 3)
const CARD = { x: 330, y: 400 } as const;

const CAM_CARD: CameraState = { x: 400, y: 380, k: 1.4 };
const CAM_GRID: CameraState = { x: 800, y: 330, k: 1.22 };

// ---------------------------------------------------------------------------
// Timeline — ~74s, 10 captions.
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // gray byte tape enters
  const typedU = tl.channel('typedU', 0); // cells take type colors + op glyphs
  const cardU = tl.channel('cardU', 0); // anatomy card zoom
  const laneU = tl.channel('laneU', 0); // interleave legend pulses
  const gridU = tl.channel('gridU', 0); // grid panel enters
  const evtCount = tl.channel('evtCount', 0); // THE FOLD: events applied so far
  const replayU = tl.channel('replayU', 0); // reader 2 sweeps + twin grid
  const twinU = tl.channel('twinU', 0); // identical chip
  const snapU = tl.channel('snapU', 0); // snapshot bracket cells append
  const resetU = tl.channel('resetU', 0); // reset cell + grid sweep
  const quietU = tl.channel('quietU', 0); // finale

  // — beat 1 · rows, not bytes —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: "Raw bytes are perfect for token streams. But most of what agents share isn't prose — it's state. Rows that change.",
  });
  tl.tween(tapeU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });

  // — beat 2 · JSON mode —
  tl.caption({
    at: 6.6,
    dur: 6.2,
    text: 'So Electric layers a state protocol on top. Create the stream in structured mode and every append is a discrete, typed message instead of a byte soup.',
  });
  tl.tween(typedU, 1, { at: 7.4, dur: 2.8, ease: ease.linear });

  // — beat 3 · anatomy of a change event —
  tl.caption({
    at: 13.4,
    dur: 6.4,
    text: 'Each message is a change event. It names an entity type and a key, carries a value, and declares an operation: insert, update, or delete.',
  });
  tl.tween(cam, CAM_CARD, { at: 13.6, dur: 1.2, ease: ease.move });
  tl.tween(cardU, 1, { at: 14.2, dur: 0.9, ease: ease.enter });

  // — beat 4 · interleave —
  tl.caption({
    at: 20.4,
    dur: 6.0,
    text: 'Different types share one stream. Users, messages, reactions — all interleaved, all in one strict order. That ordering is the whole trick.',
  });
  tl.tween(cardU, 0, { at: 20.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 20.8, dur: 1.2, ease: ease.move });
  tl.tween(laneU, 1, { at: 21.8, dur: 3.4, ease: ease.linear });

  // — beat 5 · the fold begins —
  tl.caption({
    at: 27.0,
    dur: 6.4,
    text: 'To get current state, you fold the tape. Materialized state is a map from type and key to the latest value — start empty, apply every event in order.',
  });
  tl.tween(gridU, 1, { at: 27.4, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_GRID, { at: 27.6, dur: 1.3, ease: ease.move });
  tl.tween(evtCount, 4, { at: 28.6, dur: 4.4, ease: ease.linear });

  // — beat 6 · insert / update / delete —
  tl.caption({
    at: 34.0,
    dur: 6.2,
    text: "An insert lands a new entry. An update overwrites it in place. A delete removes it. The map is never stored — it's computed.",
  });
  tl.tween(evtCount, N_EVT, { at: 34.4, dur: 5.4, ease: ease.linear });

  // — beat 7 · replay invariance —
  tl.caption({
    at: 40.8,
    dur: 6.2,
    text: 'That makes state reproducible. A second reader folding the same tape builds the exact same map, every time, on any machine.',
  });
  tl.tween(replayU, 1, { at: 41.4, dur: 3.2, ease: ease.linear });
  tl.tween(twinU, 1, { at: 45.0, dur: 0.6, ease: ease.pop });

  // — beat 8 · snapshots —
  tl.caption({
    at: 47.6,
    dur: 6.2,
    text: 'Control events manage the stream itself. Snapshot markers bracket a full dump of current state, so late joiners can skip the deep history.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 47.8, dur: 1.2, ease: ease.move });
  tl.tween(replayU, 0, { at: 47.8, dur: 0.8, ease: ease.enter });
  tl.tween(twinU, 0, { at: 47.8, dur: 0.8, ease: ease.enter });
  tl.tween(snapU, 1, { at: 48.6, dur: 2.8, ease: ease.linear });

  // — beat 9 · reset —
  tl.caption({
    at: 54.2,
    dur: 6.0,
    text: 'And a reset tells every reader: clear your map and start again. The tape stays the source of truth; the map is just a cache of the fold.',
  });
  tl.tween(resetU, 1, { at: 55.0, dur: 2.2, ease: ease.move });

  // — beat 10 · recap —
  tl.caption({
    at: 60.6,
    dur: 6.2,
    text: 'Database semantics, with no database server — just typed events on the same durable tape. Next: making that fold reactive.',
  });
  tl.tween(quietU, 1, { at: 61.0, dur: 1.0, ease: ease.enter });
  tl.hold(66.8, 1.4);

  return {
    tl,
    cam,
    tapeU,
    typedU,
    cardU,
    laneU,
    gridU,
    evtCount,
    replayU,
    twinU,
    snapU,
    resetU,
    quietU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const typedU = s.get(scene.typedU);
  const cardU = s.get(scene.cardU);
  const laneU = s.get(scene.laneU);
  const gridU = s.get(scene.gridU);
  const evtCount = s.get(scene.evtCount);
  const replayU = s.get(scene.replayU);
  const twinU = s.get(scene.twinU);
  const snapU = s.get(scene.snapU);
  const resetU = s.get(scene.resetU);
  const quietU = s.get(scene.quietU);

  const nMain = N_EVT * clamp01(tapeU); // main cells shown
  const gridWipe = clamp01(resetU * 1.8 - 0.5); // reset sweep 0..1
  const foldCount = Math.floor(evtCount);
  const dim = quietU * 0.55;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the tape ================= */}
        <g opacity={1 - dim * 0.4}>
          <line
            x1={TAPE_X0 - 12}
            y1={TAPE_Y + CELL_H / 2 + 8}
            x2={TAPE_X0 + (cellX(N_EVT + N_SNAP + 1) - TAPE_X0 + 14) * tapeU}
            y2={TAPE_Y + CELL_H / 2 + 8}
            stroke={colors.GRID}
            strokeWidth={2}
          />
          <g opacity={tapeU}>
            <rect x={TAPE_X0 - 4} y={TAPE_Y - CELL_H / 2 - 46} width={318} height={28} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={TAPE_X0 + 8} y={TAPE_Y - CELL_H / 2 - 27} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              Content-Type: application/json
            </text>
          </g>
          {/* main event cells */}
          {EVENTS.map((e, i) => {
            const u = clamp01(nMain - i);
            if (u <= 0.01) return null;
            const typed = clamp01(typedU * (N_EVT + 3) - i);
            const color = typed > 0.4 ? TYPE_COLOR[e.type] : colors.GRID;
            const lanePulse = laneU > 0 && laneU < 1 ? Math.max(0, Math.sin(Math.PI * clamp01(laneU * 3 - (e.type === 'user' ? 0 : e.type === 'message' ? 1 : 2)))) : 0;
            return (
              <g key={i} opacity={0.4 + 0.6 * u}>
                <rect
                  x={cellX(i)}
                  y={TAPE_Y - CELL_H / 2 - lanePulse * 8}
                  width={CELL_W - 6}
                  height={CELL_H}
                  rx={7}
                  fill={colors.PANEL}
                  stroke={color}
                  strokeWidth={typed > 0.4 ? 1.8 + lanePulse : 1.1}
                />
                {typed > 0.4 && (
                  <>
                    <text x={cellX(i) + (CELL_W - 6) / 2} y={TAPE_Y - 2 - lanePulse * 8} textAnchor="middle" fill={color} fontSize={17} fontWeight={700}>
                      {OP_GLYPH[e.op]}
                    </text>
                    <text x={cellX(i) + (CELL_W - 6) / 2} y={TAPE_Y + 16 - lanePulse * 8} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                      {e.type.slice(0, 4)}:{e.key}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          {/* snapshot bracket cells */}
          {snapU > 0.01 &&
            Array.from({ length: N_SNAP }, (_, k) => {
              const u = clamp01(snapU * (N_SNAP + 1.5) - k);
              if (u <= 0.01) return null;
              const i = N_EVT + k;
              const isCtl = k === 0 || k === N_SNAP - 1;
              const label = k === 0 ? '⟦' : k === N_SNAP - 1 ? '⟧' : OP_GLYPH.insert;
              return (
                <g key={`s${k}`} opacity={u}>
                  <rect x={cellX(i)} y={TAPE_Y - CELL_H / 2} width={CELL_W - 6} height={CELL_H} rx={7} fill={isCtl ? colors.BG : colors.PANEL} stroke={isCtl ? colors.TEAL : colors.GRID} strokeWidth={isCtl ? 2 : 1.1} strokeDasharray={isCtl ? '4 3' : undefined} />
                  <text x={cellX(i) + (CELL_W - 6) / 2} y={TAPE_Y + 6} textAnchor="middle" fill={isCtl ? colors.TEAL : colors.MUTED} fontSize={isCtl ? 19 : 15} fontWeight={700}>
                    {label}
                  </text>
                </g>
              );
            })}
          {snapU > 0.6 && (
            <g opacity={clamp01((snapU - 0.6) * 3) * (1 - dim)}>
              <text x={cellX(N_EVT) + (N_SNAP * CELL_W) / 2 - 3} y={TAPE_Y - CELL_H / 2 - 14} textAnchor="middle" fill={colors.TEAL} fontSize={11} fontFamily={MONO}>
                snapshot-start … snapshot-end
              </text>
            </g>
          )}
          {/* reset cell */}
          {resetU > 0.01 && (
            <g opacity={clamp01(resetU * 3)}>
              <rect x={cellX(N_EVT + N_SNAP)} y={TAPE_Y - CELL_H / 2} width={CELL_W - 6} height={CELL_H} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={cellX(N_EVT + N_SNAP) + (CELL_W - 6) / 2} y={TAPE_Y + 6} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={700}>
                ⟲
              </text>
              <text x={cellX(N_EVT + N_SNAP) + (CELL_W - 6) / 2} y={TAPE_Y - CELL_H / 2 - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                reset
              </text>
            </g>
          )}
        </g>

        {/* ================= anatomy card ================= */}
        {cardU > 0.01 && (
          <g opacity={cardU}>
            <rect x={CARD.x - 190} y={CARD.y - 118} width={380} height={224} rx={14} fill={colors.PANEL} stroke={TYPE_COLOR.user} strokeWidth={1.6} />
            <text x={CARD.x - 166} y={CARD.y - 84} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              {'{'}
            </text>
            {[
              { k: '"type"', v: '"user"', c: TYPE_COLOR.user },
              { k: '"key"', v: '"user:123"', c: TYPE_COLOR.user },
              { k: '"value"', v: '{ "name": "Alice", … }', c: colors.TEXT },
              { k: '"headers"', v: '{ "operation": "insert",', c: colors.POSITIVE },
              { k: '', v: '  "txid": "abc-123" }', c: colors.POSITIVE },
            ].map((line, i) => (
              <g key={i}>
                <text x={CARD.x - 146} y={CARD.y - 54 + i * 28} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                  {line.k}
                </text>
                <text x={CARD.x - 146 + (line.k ? 84 : 0)} y={CARD.y - 54 + i * 28} fill={line.c} fontSize={13.5} fontFamily={MONO}>
                  {line.k ? `: ${line.v}` : line.v}
                </text>
              </g>
            ))}
            <text x={CARD.x - 166} y={CARD.y + 94} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              {'}'}
            </text>
          </g>
        )}

        {/* ================= the materialized grid ================= */}
        {gridU > 0.01 && (
          <g opacity={gridU * (1 - dim)}>
            <rect x={GRID_X - 24} y={GRID_Y0 - 54} width={GRID_W + 48} height={ROW_IDS.length * ROW_H + 86} rx={14} fill={colors.PANEL} stroke={colors.GRID} opacity={0.85} />
            <text x={GRID_X} y={GRID_Y0 - 26} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>
              MaterializedState
            </text>
            <text x={GRID_X + GRID_W - 6} y={GRID_Y0 - 26} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              get(type, key) → value
            </text>
            {ROW_IDS.map((r, row) => {
              const st = rowStateAt(row, foldCount);
              const everSeen = ROW_HISTORY[row][0].step < foldCount;
              if (!everSeen) return null;
              // flash if the most recent applied event touched this row
              const flash = st.changedStep === foldCount - 1 ? Math.max(0, 1 - (evtCount - foldCount) * 2.2) : 0;
              const wiped = gridWipe > (row + 1) / ROW_IDS.length;
              const op = (st.exists ? 1 : 0.28) * (wiped ? 0.08 : 1);
              return (
                <g key={`${r.type}:${r.key}`} opacity={op}>
                  <rect x={GRID_X - 8} y={rowY(row) - 15} width={GRID_W + 16} height={ROW_H - 8} rx={7} fill={flash > 0 ? TYPE_COLOR[r.type] : colors.BG} fillOpacity={flash > 0 ? 0.12 + 0.2 * flash : 0.5} stroke={TYPE_COLOR[r.type]} strokeWidth={flash > 0 ? 2 : 1} strokeOpacity={st.exists ? 0.9 : 0.35} />
                  <text x={GRID_X + 4} y={rowY(row) + 5} fill={TYPE_COLOR[r.type]} fontSize={12.5} fontFamily={MONO}>
                    {r.type}:{r.key}
                  </text>
                  <text x={GRID_X + 128} y={rowY(row) + 5} fill={st.exists ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={MONO} textDecoration={st.exists ? undefined : 'line-through'}>
                    {st.exists ? `→ ${st.val}` : '(deleted)'}
                  </text>
                </g>
              );
            })}
            {/* wipe sweep line */}
            {gridWipe > 0.01 && gridWipe < 0.99 && (
              <line x1={GRID_X - 20} y1={GRID_Y0 - 20 + gridWipe * ROW_IDS.length * ROW_H} x2={GRID_X + GRID_W + 20} y2={GRID_Y0 - 20 + gridWipe * ROW_IDS.length * ROW_H} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.8} />
            )}
          </g>
        )}

        {/* events flying tape → grid */}
        {gridU > 0.5 &&
          EVENTS.map((e, i) => {
            const u = clamp01(evtCount - i);
            if (u <= 0.02 || u >= 0.98) return null;
            const row = ROW_IDS.findIndex((r) => r.type === e.type && r.key === e.key);
            const x0 = cellX(i) + (CELL_W - 6) / 2;
            const y0 = TAPE_Y + CELL_H / 2;
            const x1 = GRID_X + 60;
            const y1 = rowY(row);
            const x = x0 + (x1 - x0) * u;
            const y = y0 + (y1 - y0) * u - Math.sin(Math.PI * u) * 60;
            return (
              <g key={`f${i}`} opacity={Math.sin(Math.PI * u)}>
                <circle cx={x} cy={y} r={11} fill={colors.BG} stroke={TYPE_COLOR[e.type]} strokeWidth={2} />
                <text x={x} y={y + 5} textAnchor="middle" fill={TYPE_COLOR[e.type]} fontSize={13} fontWeight={700}>
                  {OP_GLYPH[e.op]}
                </text>
              </g>
            );
          })}

        {/* ================= replay: reader 2 + twin grid ================= */}
        {replayU > 0.01 && (
          <g opacity={clamp01(replayU * 3)}>
            {/* fast second cursor sweeping the tape */}
            <path
              d={`M${TAPE_X0 + clamp01(replayU) * (cellX(N_EVT) - TAPE_X0)} ${TAPE_Y + CELL_H / 2 + 26} l -8 12 l 16 0 z`}
              fill={colors.TEAL}
            />
            <text x={TAPE_X0 + clamp01(replayU) * (cellX(N_EVT) - TAPE_X0)} y={TAPE_Y + CELL_H / 2 + 56} textAnchor="middle" fill={colors.TEAL} fontSize={11.5}>
              reader 2 · offset=-1
            </text>
            {/* twin mini-grid */}
            <g opacity={clamp01(replayU * 1.4 - 0.2)}>
              <rect x={180} y={GRID_Y0 - 10} width={300} height={ROW_IDS.length * 26 + 30} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeOpacity={0.7} />
              {ROW_IDS.map((r, row) => {
                const mini = rowStateAt(row, Math.floor(clamp01(replayU) * N_EVT));
                const seen = ROW_HISTORY[row][0].step < clamp01(replayU) * N_EVT;
                if (!seen) return null;
                return (
                  <text key={row} x={200} y={GRID_Y0 + 16 + row * 26} fill={mini.exists ? colors.TEXT : colors.MUTED} fontSize={11} fontFamily={MONO} opacity={mini.exists ? 0.95 : 0.4}>
                    {r.type}:{r.key} {mini.exists ? `→ ${mini.val}` : '(deleted)'}
                  </text>
                );
              })}
            </g>
            <g opacity={twinU}>
              <rect x={508} y={GRID_Y0 + 44} width={188} height={36} rx={9} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={602} y={GRID_Y0 + 67} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
                ≡ identical fold
              </text>
            </g>
          </g>
        )}

        {/* ================= finale ================= */}
        {quietU > 0.01 && (
          <g opacity={quietU}>
            <rect x={310} y={330} width={660} height={120} rx={16} fill={colors.BG} stroke={colors.GRID} />
            <text x={640} y={380} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={700}>
              state = fold(events on the tape)
            </text>
            <text x={640} y={416} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              the map is a cache · the stream is the truth · next: StreamDB makes the fold reactive
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
