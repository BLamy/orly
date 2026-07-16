// Chapter 4 — StreamDB
//
// Grounding: packages/state/src/stream-db.ts (createStreamDB, EventDispatcher
// routes stream events by type into TanStack DB collections; preload()
// consumes until up-to-date and markReady(); utils.awaitTxId(txid) resolves
// when a synced event carries the txid; optimistic actions via
// createOptimisticAction — onMutate applies locally, mutationFn appends to
// the stream, TanStack DB rolls back on failure), packages/state/src/schema.ts
// (createStateSchema: per-collection StandardSchema validator + primaryKey),
// electric.ax /docs/streams/stream-db.md (useLiveQuery joins; differential
// dataflow updates incrementally).
//
// Centerpiece: THE ROUND TRIP — an optimistic write appears locally as a
// ghost row, travels to the tape tagged with a txid, comes back through the
// dispatcher into its collection, and only then hardens into truth.
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
// Layout + data
// ---------------------------------------------------------------------------
const TAPE_Y = 118;
const TAPE_X0 = 210;
const CELL_W = 44;
const CELL_H = 42;
const N_BASE = 4; // preloaded events: u1, u2, m1, m2
const cellX = (i: number): number => TAPE_X0 + i * CELL_W;

const DISP = { x: 640, y: 252 } as const;
const USERS = { x: 350, y: 402, w: 250, h: 108 } as const;
const MSGS = { x: 930, y: 402, w: 250, h: 108 } as const;
const QUERY = { x: 640, y: 556, w: 560, h: 96 } as const;

interface Row {
  text: string;
  color: string;
}
const BASE_EVENTS: Array<{ coll: 'users' | 'messages'; label: string; row: Row }> = [
  { coll: 'users', label: 'user:1', row: { text: '1 · Alice', color: colors.ACCENT } },
  { coll: 'users', label: 'user:2', row: { text: '2 · Bob', color: colors.ACCENT } },
  { coll: 'messages', label: 'msg:m1', row: { text: 'm1 · "hi" · by 1', color: colors.SECONDARY } },
  { coll: 'messages', label: 'msg:m2', row: { text: 'm2 · "hello" · by 2', color: colors.SECONDARY } },
];
// the joined query result rows (messages ⋈ users)
const QUERY_ROWS = ['"hi" — Alice', '"hello" — Bob'];
const LIVE_ROW = '"and now?" — Bob'; // live insert m3 by user 2
const OPT_ROW = '"the plan" — Alice'; // optimistic insert m4 by user 1

const CAM_SCHEMA: CameraState = { x: 640, y: 360, k: 1.28 };
const CAM_DISP: CameraState = { x: 640, y: 260, k: 1.3 };
const CAM_QUERY: CameraState = { x: 640, y: 480, k: 1.3 };

/** piecewise-linear travel along waypoints for u in 0..1 */
function along(pts: Array<{ x: number; y: number }>, u: number): { x: number; y: number } {
  const n = pts.length - 1;
  const t = clamp01(u) * n;
  const i = Math.min(n - 1, Math.floor(t));
  const f = t - i;
  return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
}

// the write's round trip: query panel → tape write head → (append) → dispatcher → messages → query
const UP_PATH = [
  { x: QUERY.x - 140, y: QUERY.y - QUERY.h / 2 },
  { x: 160, y: 470 },
  { x: 130, y: 240 },
  { x: cellX(N_BASE + 1) + 20, y: TAPE_Y - CELL_H / 2 - 26 },
];
const DOWN_PATH = [
  { x: cellX(N_BASE + 1) + 20, y: TAPE_Y + CELL_H / 2 },
  { x: DISP.x, y: DISP.y - 34 },
  { x: MSGS.x, y: MSGS.y - MSGS.h / 2 },
  { x: QUERY.x + 160, y: QUERY.y - QUERY.h / 2 },
];

// ---------------------------------------------------------------------------
// Timeline — ~68s, 10 captions.
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SCHEMA, cameraInterp);

  const schemaU = tl.channel('schemaU', 0); // schema cards enter
  const wireU = tl.channel('wireU', 0); // tape + dispatcher + collections wiring
  const preN = tl.channel('preN', 0); // preload: events 0..4 flow through
  const readyU = tl.channel('readyU', 0); // up-to-date / markReady chip
  const queryU = tl.channel('queryU', 0); // live query lens + initial rows
  const liveU = tl.channel('liveU', 0); // one live insert flows through
  const ghostU = tl.channel('ghostU', 0); // optimistic ghost row appears
  const upU = tl.channel('upU', 0); // txid packet travels to the tape
  const downU = tl.channel('downU', 0); // event returns via dispatcher
  const confirmU = tl.channel('confirmU', 0); // awaitTxId match → solidify
  const failU = tl.channel('failU', 0); // rejected write: bounce + rollback
  const quietU = tl.channel('quietU', 0);

  // — beat 1 · schema —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: "A folded map is nice. A database you can query is better. That's the stream database layer — and it starts with a schema.",
  });
  tl.tween(schemaU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });

  // — beat 2 · wiring —
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'Each collection names an entity type, a validator, and a primary key. Creating the database wires a dispatcher to the stream, routing events by type into typed collections.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.0, dur: 1.3, ease: ease.move });
  tl.tween(schemaU, 0.4, { at: 7.2, dur: 0.9, ease: ease.move }); // cards dock as headers
  tl.tween(wireU, 1, { at: 7.8, dur: 1.8, ease: ease.draw });

  // — beat 3 · preload —
  tl.caption({
    at: 13.6,
    dur: 6.0,
    text: 'Preload replays the tape from the beginning. Collections fill in order, and when the stream reports up to date, the database marks itself ready.',
  });
  tl.tween(cam, CAM_DISP, { at: 13.8, dur: 1.1, ease: ease.move });
  tl.tween(preN, N_BASE, { at: 14.4, dur: 3.8, ease: ease.linear });
  tl.tween(readyU, 1, { at: 18.6, dur: 0.5, ease: ease.pop });

  // — beat 4 · the lens —
  tl.caption({
    at: 20.2,
    dur: 6.4,
    text: "Queries are standing lenses. This one joins messages to their authors — and it's built on differential dataflow, so it never recomputes from scratch.",
  });
  tl.tween(cam, CAM_QUERY, { at: 20.4, dur: 1.2, ease: ease.move });
  tl.tween(queryU, 1, { at: 21.0, dur: 1.4, ease: ease.enter });

  // — beat 5 · one insert, one row —
  tl.caption({
    at: 27.2,
    dur: 6.2,
    text: 'Watch one insert land on the tape. It flows through the dispatcher, into a collection, and only the affected row of the join updates.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 27.4, dur: 1.3, ease: ease.move });
  tl.tween(liveU, 1, { at: 28.0, dur: 4.2, ease: ease.linear });

  // — beat 6 · the ghost —
  tl.caption({
    at: 34.0,
    dur: 6.2,
    text: 'Now the write path. An optimistic action applies your change locally, instantly. That ghost row is real in your interface — but not yet on the tape.',
  });
  tl.tween(cam, CAM_QUERY, { at: 34.2, dur: 1.2, ease: ease.move });
  tl.tween(ghostU, 1, { at: 35.2, dur: 0.9, ease: ease.enter });

  // — beat 7 · append with txid —
  tl.caption({
    at: 40.8,
    dur: 5.4,
    text: 'In the background, the same change is appended to the stream, tagged with a transaction identifier.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.0, dur: 1.3, ease: ease.move });
  tl.tween(upU, 1, { at: 41.6, dur: 3.4, ease: ease.linear });

  // — beat 8 · the return —
  tl.caption({
    at: 46.8,
    dur: 6.4,
    text: 'The event comes back around — through the dispatcher, into the collection — and when the awaited identifier matches, the ghost hardens into truth.',
  });
  tl.tween(downU, 1, { at: 47.2, dur: 3.4, ease: ease.linear });
  tl.tween(confirmU, 1, { at: 51.0, dur: 0.7, ease: ease.pop });

  // — beat 9 · rollback —
  tl.caption({
    at: 53.8,
    dur: 5.8,
    text: 'If the append fails, the ghost simply rolls back. Nothing is true until the tape says so.',
  });
  tl.tween(failU, 1, { at: 54.6, dur: 3.6, ease: ease.linear });

  // — beat 10 · recap —
  tl.caption({
    at: 60.2,
    dur: 6.0,
    text: "Reads are folds, writes are appends, and reactivity is a loop through the stream. One more layer, and we've got files.",
  });
  tl.tween(quietU, 1, { at: 60.6, dur: 1.0, ease: ease.enter });
  tl.hold(66.2, 1.4);

  return {
    tl,
    cam,
    schemaU,
    wireU,
    preN,
    readyU,
    queryU,
    liveU,
    ghostU,
    upU,
    downU,
    confirmU,
    failU,
    quietU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Panel({
  x,
  y,
  w,
  h,
  title,
  mono,
  u,
  stroke,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  mono?: string;
  u: number;
  stroke?: string;
}) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={12} fill={colors.PANEL} stroke={stroke ?? colors.GRID} strokeWidth={1.4} />
      <text x={x - w / 2 + 14} y={y - h / 2 + 22} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
        {title}
      </text>
      {mono && (
        <text x={x + w / 2 - 12} y={y - h / 2 + 22} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          {mono}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const schemaU = s.get(scene.schemaU);
  const wireU = s.get(scene.wireU);
  const preN = s.get(scene.preN);
  const readyU = s.get(scene.readyU);
  const queryU = s.get(scene.queryU);
  const liveU = s.get(scene.liveU);
  const ghostU = s.get(scene.ghostU);
  const upU = s.get(scene.upU);
  const downU = s.get(scene.downU);
  const confirmU = s.get(scene.confirmU);
  const failU = s.get(scene.failU);
  const quietU = s.get(scene.quietU);

  const dim = quietU * 0.7;
  const schemaBig = clamp01((schemaU - 0.4) / 0.6); // 1 while cards are centered
  const nTapeCells = N_BASE + (liveU > 0.3 ? 1 : 0) + (upU >= 1 ? 1 : 0);
  // live insert flight: tape → dispatcher → messages → query
  const livePath = [
    { x: cellX(N_BASE) + 19, y: TAPE_Y + CELL_H / 2 },
    { x: DISP.x, y: DISP.y - 34 },
    { x: MSGS.x, y: MSGS.y - MSGS.h / 2 },
    { x: QUERY.x + 160, y: QUERY.y - QUERY.h / 2 },
  ];
  const liveFlight = clamp01(liveU * 1.35 - 0.35);
  const livePos = along(livePath, liveFlight);
  const upPos = along(UP_PATH, upU);
  const downPos = along(DOWN_PATH, downU);
  // failed write: travels the up path, bounces back a bit, ghost fades
  const failOut = clamp01(failU * 2.4);
  const failBack = clamp01(failU * 2.4 - 1.2);
  const failPos = along(UP_PATH, clamp01(failOut - failBack * 0.35));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= schema cards ================= */}
        {schemaU > 0.01 && schemaBig > 0.01 && (
          <g opacity={schemaBig}>
            {[
              { x: 430, name: 'users', type: '"user"', pk: '"id"', schema: 'userSchema (zod)' },
              { x: 850, name: 'messages', type: '"message"', pk: '"id"', schema: 'messageSchema (zod)' },
            ].map((c) => (
              <g key={c.name}>
                <rect x={c.x - 165} y={250} width={330} height={168} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
                <text x={c.x} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>
                  {c.name}
                </text>
                <text x={c.x - 140} y={318} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  schema: <tspan fill={colors.ACCENT}>{c.schema}</tspan>
                </text>
                <text x={c.x - 140} y={346} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  type: <tspan fill={colors.ACCENT}>{c.type}</tspan>
                </text>
                <text x={c.x - 140} y={374} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                  primaryKey: <tspan fill={colors.ACCENT}>{c.pk}</tspan>
                </text>
              </g>
            ))}
            <text x={640} y={218} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              createStateSchema({'{ users, messages }'})
            </text>
          </g>
        )}

        {/* ================= the machine ================= */}
        {wireU > 0.01 && (
          <g opacity={(1 - dim) * wireU}>
            {/* tape */}
            <line x1={TAPE_X0 - 12} y1={TAPE_Y + CELL_H / 2 + 8} x2={cellX(N_BASE + 2) + 30} y2={TAPE_Y + CELL_H / 2 + 8} stroke={colors.GRID} strokeWidth={2} />
            <text x={TAPE_X0 - 22} y={TAPE_Y + 5} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              stream
            </text>
            {Array.from({ length: 7 }, (_, i) => {
              if (i >= nTapeCells) return null;
              const isLive = i === N_BASE;
              const isOpt = i === N_BASE + 1;
              return (
                <g key={i}>
                  <rect x={cellX(i)} y={TAPE_Y - CELL_H / 2} width={CELL_W - 6} height={CELL_H} rx={6} fill={colors.PANEL} stroke={isOpt ? colors.WARM : isLive ? colors.POSITIVE : colors.GRID} strokeWidth={isLive || isOpt ? 1.8 : 1.1} />
                  <text x={cellX(i) + (CELL_W - 6) / 2} y={TAPE_Y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                    {i < N_BASE ? BASE_EVENTS[i].label : i === N_BASE ? 'msg:m3' : 'msg:m4'}
                  </text>
                </g>
              );
            })}
            {/* dispatcher */}
            <g>
              <rect x={DISP.x - 26} y={DISP.y - 26} width={52} height={52} rx={10} transform={`rotate(45 ${DISP.x} ${DISP.y})`} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.8} />
              <text x={DISP.x} y={DISP.y + 58} textAnchor="middle" fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                EventDispatcher
              </text>
            </g>
            {/* wires */}
            <path d={`M${cellX(2)} ${TAPE_Y + CELL_H / 2 + 10} L ${DISP.x} ${DISP.y - 40}`} stroke={colors.GRID} strokeWidth={1.5} fill="none" strokeDasharray="2 5" />
            <path d={`M${DISP.x - 26} ${DISP.y + 16} L ${USERS.x + 40} ${USERS.y - USERS.h / 2 - 6}`} stroke={colors.ACCENT} strokeWidth={1.5} fill="none" strokeDasharray="2 5" opacity={0.7} />
            <path d={`M${DISP.x + 26} ${DISP.y + 16} L ${MSGS.x - 40} ${MSGS.y - MSGS.h / 2 - 6}`} stroke={colors.SECONDARY} strokeWidth={1.5} fill="none" strokeDasharray="2 5" opacity={0.7} />
            <text x={DISP.x - 110} y={DISP.y + 44} fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
              type: "user"
            </text>
            <text x={DISP.x + 108} y={DISP.y + 44} textAnchor="end" fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO}>
              type: "message"
            </text>

            {/* collections */}
            <Panel x={USERS.x} y={USERS.y} w={USERS.w} h={USERS.h} title="users" mono="collections.users" u={wireU} stroke={colors.ACCENT} />
            <Panel x={MSGS.x} y={MSGS.y} w={MSGS.w} h={MSGS.h} title="messages" mono="collections.messages" u={wireU} stroke={colors.SECONDARY} />
            {BASE_EVENTS.map((e, i) => {
              const landed = preN >= i + 1;
              if (!landed) return null;
              const p = e.coll === 'users' ? USERS : MSGS;
              const slot = e.coll === 'users' ? (i === 0 ? 0 : 1) : i - 2;
              return (
                <text key={i} x={p.x - p.w / 2 + 16} y={p.y - 8 + slot * 24} fill={e.row.color} fontSize={12} fontFamily={MONO}>
                  {e.row.text}
                </text>
              );
            })}
            {/* live insert m3 lands in messages */}
            {liveFlight > 0.62 && (
              <text x={MSGS.x - MSGS.w / 2 + 16} y={MSGS.y - 8 + 2 * 24} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                m3 · "and now?" · by 2
              </text>
            )}
            {/* optimistic m4 lands after confirm */}
            {confirmU > 0.5 && (
              <text x={MSGS.x - MSGS.w / 2 + 148} y={MSGS.y - 8 + 2 * 24} fill={colors.WARM} fontSize={12} fontFamily={MONO} opacity={confirmU}>
                + m4
              </text>
            )}

            {/* preload flights */}
            {BASE_EVENTS.map((e, i) => {
              const u = clamp01(preN - i);
              if (u <= 0.02 || u >= 0.98) return null;
              const target = e.coll === 'users' ? USERS : MSGS;
              const path = [
                { x: cellX(i) + 19, y: TAPE_Y + CELL_H / 2 },
                { x: DISP.x, y: DISP.y - 34 },
                { x: target.x, y: target.y - target.h / 2 },
              ];
              const p = along(path, u);
              return <circle key={`p${i}`} cx={p.x} cy={p.y} r={7} fill={e.row.color} opacity={0.95} />;
            })}
            {/* up-to-date chip */}
            <g opacity={readyU * (1 - clamp01(queryU * 2 - 1.4))}>
              <rect x={DISP.x + 66} y={DISP.y - 62} width={196} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={DISP.x + 164} y={DISP.y - 42} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                up-to-date → markReady()
              </text>
            </g>
          </g>
        )}

        {/* ================= the query lens ================= */}
        {queryU > 0.01 && (
          <g opacity={queryU * (1 - dim)}>
            <rect x={QUERY.x - QUERY.w / 2} y={QUERY.y - QUERY.h / 2} width={QUERY.w} height={QUERY.h} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={QUERY.x - QUERY.w / 2 + 16} y={QUERY.y - QUERY.h / 2 + 24} fill={colors.TEXT} fontSize={13} fontWeight={700}>
              live query
            </text>
            <text x={QUERY.x + QUERY.w / 2 - 14} y={QUERY.y - QUERY.h / 2 + 24} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              useLiveQuery · join(messages, users)
            </text>
            {QUERY_ROWS.map((r, i) => (
              <text key={i} x={QUERY.x - QUERY.w / 2 + 18} y={QUERY.y + 4 + i * 22} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                {r}
              </text>
            ))}
            {/* live row (beat 5) — only this row flashes in */}
            {liveFlight > 0.95 && (
              <g>
                <rect x={QUERY.x + 24} y={QUERY.y - 10} width={250} height={24} rx={6} fill={colors.POSITIVE} fillOpacity={0.12} stroke={colors.POSITIVE} strokeWidth={1} />
                <text x={QUERY.x + 34} y={QUERY.y + 7} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
                  {LIVE_ROW}
                </text>
              </g>
            )}
            {/* ghost row (optimistic) */}
            {ghostU > 0.01 && failU < 0.01 && (
              <g opacity={ghostU}>
                <rect x={QUERY.x + 24} y={QUERY.y + 16} width={250} height={24} rx={6} fill={colors.WARM} fillOpacity={confirmU > 0.5 ? 0.14 : 0.05} stroke={colors.WARM} strokeWidth={confirmU > 0.5 ? 1.6 : 1.1} strokeDasharray={confirmU > 0.5 ? undefined : '4 4'} />
                <text x={QUERY.x + 34} y={QUERY.y + 33} fill={colors.WARM} fontSize={12.5} fontFamily={MONO} opacity={confirmU > 0.5 ? 1 : 0.75}>
                  {OPT_ROW}
                  {confirmU > 0.5 ? ' ✓' : ' (optimistic)'}
                </text>
              </g>
            )}
            {/* failing ghost row (beat 9) */}
            {failU > 0.01 && (
              <g opacity={Math.max(0, 1 - failBack)}>
                <rect x={QUERY.x + 24} y={QUERY.y + 16} width={250} height={24} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.1} strokeDasharray="4 4" />
                <text x={QUERY.x + 34} y={QUERY.y + 33} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} opacity={0.8}>
                  "oops" — Alice (rolling back)
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the round trip packets ================= */}
        {upU > 0.02 && upU < 0.98 && (
          <g>
            <circle cx={upPos.x} cy={upPos.y} r={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
            <text x={upPos.x + 16} y={upPos.y + 4} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              append · txid: a1b2…
            </text>
          </g>
        )}
        {downU > 0.02 && downU < 0.98 && (
          <g>
            <circle cx={downPos.x} cy={downPos.y} r={9} fill={colors.WARM} opacity={0.95} />
            <text x={downPos.x + 16} y={downPos.y + 4} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              synced · awaitTxId ✓
            </text>
          </g>
        )}
        {/* failed packet bounces off the tape */}
        {failU > 0.02 && failOut > 0.05 && failU < 0.98 && (
          <g>
            <circle cx={failPos.x} cy={failPos.y} r={9} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2} />
            {failOut > 0.95 && failBack < 0.4 && (
              <text x={failPos.x + 16} y={failPos.y - 8} fill={colors.NEGATIVE} fontSize={12} fontWeight={700}>
                ✗ rejected
              </text>
            )}
          </g>
        )}

        {/* ================= finale ================= */}
        {quietU > 0.01 && (
          <g opacity={quietU}>
            <rect x={330} y={252} width={620} height={128} rx={16} fill={colors.BG} stroke={colors.GRID} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={700}>
              read = fold · write = append · react = loop
            </text>
            <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              createStreamDB · EventDispatcher · useLiveQuery · awaitTxId
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
