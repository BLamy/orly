// Reading From Minus One: the initial sync
//
// Grounding: packages/sync-service/lib/electric/shapes/api.ex (offset param;
// initial snapshot; maybe_up_to_date appends %{headers: %{control:
// "up-to-date", global_last_seen_lsn: …}}), packages/sync-service/lib/
// electric/replication/log_offset.ex (tx_offset + op_offset; before_all = -1),
// packages/typescript-client/src/constants.ts (SHAPE_HANDLE_HEADER
// `electric-handle`, CHUNK_LAST_OFFSET_HEADER `electric-offset`,
// SHAPE_SCHEMA_HEADER `electric-schema`, OFFSET_QUERY_PARAM `offset`),
// packages/typescript-client/src/shape.ts (Shape#data map applies inserts by
// message key), shape-stream-state.ts (Initial ─response─► Syncing
// ─up-to-date─► Live).
//
// Centerpiece: THE TAPE — the shape log drawn as a physical tape with a
// LogOffset ruler and a playhead. A GET with offset=-1 snapshots Postgres,
// row messages stream into the client's local store while the playhead
// advances, response headers dock as the client's "bookmark", and the green
// up-to-date control pill closes the loop. The tape persists through the
// rest of the book.
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
import { Connection, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — client · Electric · Postgres on top, the tape along the bottom.
// ---------------------------------------------------------------------------

const CLIENT = { x: 150, y: 210 } as const;
const ELECTRIC = { x: 610, y: 190 } as const;
const PG = { x: 1060, y: 190 } as const;

const STORE = { x: 60, y: 320, w: 260, h: 178 } as const;
const TAPE = { x0: 140, x1: 1140, y: 528, h: 26 } as const;
const SEG_W = 64;
const SEG_X0 = TAPE.x0 + 34;

// the four snapshot rows (the ch-1 shape: todos where project_id = 'p1')
const SNAP_ROWS = [
  { id: 41, title: 'Ship the demo', status: 'doing' },
  { id: 27, title: 'Write eval suite', status: 'todo' },
  { id: 55, title: 'Wire the webhook', status: 'doing' },
  { id: 62, title: 'Review agent logs', status: 'todo' },
] as const;
const OFFSETS = ['0_0', '0_1', '0_2', '0_3'] as const;
const HANDLE = '62488107-1752669412183042';

const segX = (i: number): number => SEG_X0 + i * (SEG_W + 6);
const playheadX = (p: number): number => TAPE.x0 + 12 + (segX(3) + SEG_W - TAPE.x0 - 12) * p;

/** Piecewise-linear travel along waypoints, u in 0..1. */
function along(pts: { x: number; y: number }[], u: number): { x: number; y: number } {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

const REQ_PATH = [
  { x: CLIENT.x + 70, y: CLIENT.y + 20 },
  { x: (CLIENT.x + ELECTRIC.x) / 2 + 30, y: CLIENT.y - 44 },
  { x: ELECTRIC.x - 46, y: ELECTRIC.y + 26 },
];
const RESP_PATH = [
  { x: ELECTRIC.x - 40, y: ELECTRIC.y + 56 },
  { x: (CLIENT.x + ELECTRIC.x) / 2, y: ELECTRIC.y + 110 },
  { x: STORE.x + STORE.w - 30, y: STORE.y + 30 },
];
const SNAP_PATH = [
  { x: ELECTRIC.x + 66, y: ELECTRIC.y + 20 },
  { x: PG.x - 50, y: PG.y + 20 },
];

// camera marks
const CAM_CLIENT: CameraState = { x: 330, y: 300, k: 1.22 };
const CAM_MID: CameraState = { x: 620, y: 330, k: 1.05 };
const CAM_TAPE: CameraState = { x: 560, y: 460, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~92s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CLIENT, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // the three nodes + wires
  const storeU = tl.channel('storeU', 0); // the client's empty local store
  const reqU = tl.channel('reqU', 0); // GET packet travels client → Electric
  const reqChipU = tl.channel('reqChipU', 0); // the request line chip
  const minusU = tl.channel('minusU', 0); // offset=-1 highlight ring
  const snapU = tl.channel('snapU', 0); // Electric → Postgres snapshot query
  const tapeU = tl.channel('tapeU', 0); // the tape + ruler draw on
  const rowsU = tl.channel('rowsU', 0); // 4 row messages stream + stack
  const headU = tl.channel('headU', 0); // electric-handle / electric-offset dock
  const playU = tl.channel('playU', 0); // playhead advances along the tape
  const upU = tl.channel('upU', 0); // the up-to-date control pill
  const stateU = tl.channel('stateU', 0); // client state label 0=initial 1=syncing 2=live
  const bookU = tl.channel('bookU', 0); // bookmark beat: spotlight handle+offset
  const teaseU = tl.channel('teaseU', 0); // a write flashes at Postgres

  // — beat 1 · the empty client —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A brand new client knows nothing. No rows, no position — just the shape definition from chapter one.',
  });
  tl.tween(nodesU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(storeU, 1, { at: 2.2, dur: 0.9, ease: ease.enter });
  tl.hold(6.3, 0.6);

  // — beat 2 · one GET request —
  tl.caption({
    at: 6.9,
    dur: 6.2,
    text: 'So it asks. One plain web request: the table, the where clause, and an offset of minus one — meaning, from the very beginning.',
  });
  tl.tween(reqChipU, 1, { at: 7.3, dur: 0.7, ease: ease.enter });
  tl.tween(reqU, 1, { at: 8.4, dur: 1.4, ease: ease.move });
  tl.hold(13.1, 0.6);

  // — beat 3 · minus one is special —
  tl.caption({
    at: 13.7,
    dur: 5.2,
    text: 'Offset minus one is a special value in the protocol. It says: I have nothing, start me with a snapshot.',
  });
  tl.tween(minusU, 1, { at: 14.1, dur: 0.6, ease: ease.pop });
  tl.tween(stateU, 1, { at: 15.0, dur: 0.4, ease: ease.enter });
  tl.hold(18.9, 0.6);

  // — beat 4 · the snapshot query + a log is born —
  tl.caption({
    at: 19.5,
    dur: 6.2,
    text: 'Electric runs the snapshot query against Postgres — only your rows, only your columns — and starts a log for this shape.',
  });
  tl.tween(cam, CAM_MID, { at: 19.7, dur: 1.2, ease: ease.move });
  tl.tween(snapU, 1, { at: 20.3, dur: 1.0, ease: ease.move });
  tl.tween(tapeU, 1, { at: 21.8, dur: 1.6, ease: ease.draw });
  tl.hold(25.7, 0.6);

  // — beat 5 · rows stream in —
  tl.caption({
    at: 26.3,
    dur: 6.4,
    text: 'The rows come back as a stream of messages. Each one is an insert, keyed by the row’s primary key, and the client applies them in order.',
  });
  tl.tween(rowsU, 1, { at: 26.9, dur: 5.2, ease: ease.linear });
  tl.tween(playU, 1, { at: 27.3, dur: 5.2, ease: ease.linear });
  tl.hold(32.7, 0.7);

  // — beat 6 · the two headers —
  tl.caption({
    at: 33.4,
    dur: 6.2,
    text: 'Two response headers ride along with the data. The handle names which shape this is; the offset says how far into its log you’ve read.',
  });
  tl.tween(cam, CAM_CLIENT, { at: 33.6, dur: 1.2, ease: ease.move });
  tl.tween(headU, 1, { at: 34.4, dur: 1.6, ease: ease.enter });
  tl.hold(39.6, 0.7);

  // — beat 7 · the tape and the playhead —
  tl.caption({
    at: 40.3,
    dur: 5.8,
    text: 'Picture the log as a tape, and the offset as a playhead. Every message the client applies nudges its playhead forward.',
  });
  tl.tween(cam, CAM_TAPE, { at: 40.5, dur: 1.3, ease: ease.move });
  tl.hold(46.1, 0.7);

  // — beat 8 · up to date —
  tl.caption({
    at: 46.8,
    dur: 6.0,
    text: 'When the tape has nothing more to give, Electric appends a control message: up to date. The client now mirrors the shape exactly.',
  });
  tl.tween(upU, 1, { at: 47.6, dur: 0.7, ease: ease.pop });
  tl.tween(stateU, 2, { at: 49.4, dur: 0.5, ease: ease.enter });
  tl.hold(52.8, 0.7);

  // — beat 9 · the bookmark —
  tl.caption({
    at: 53.5,
    dur: 5.8,
    text: 'And look how little the client must remember: the handle, and the offset. Two tokens are the entire bookmark.',
  });
  tl.tween(cam, CAM_CLIENT, { at: 53.7, dur: 1.2, ease: ease.move });
  tl.tween(bookU, 1, { at: 54.5, dur: 1.0, ease: ease.move });
  tl.hold(59.3, 0.7);

  // — beat 10 · the tease —
  tl.caption({
    at: 60.0,
    dur: 6.6,
    text: 'But a mirror is only worth having if it stays true. Somewhere on the far side of the system, somebody is about to change a row.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.2, dur: 1.4, ease: ease.move });
  tl.tween(bookU, 0, { at: 60.2, dur: 0.8, ease: ease.enter });
  tl.tween(teaseU, 1, { at: 63.0, dur: 1.6, ease: ease.move });
  tl.hold(66.6, 1.4);

  return {
    tl,
    cam,
    nodesU,
    storeU,
    reqU,
    reqChipU,
    minusU,
    snapU,
    tapeU,
    rowsU,
    headU,
    playU,
    upU,
    stateU,
    bookU,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  todo: colors.MUTED,
  doing: colors.ACCENT,
  done: colors.POSITIVE,
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const storeU = s.get(scene.storeU);
  const reqU = s.get(scene.reqU);
  const reqChipU = s.get(scene.reqChipU);
  const minusU = s.get(scene.minusU);
  const snapU = s.get(scene.snapU);
  const tapeU = s.get(scene.tapeU);
  const rowsU = s.get(scene.rowsU);
  const headU = s.get(scene.headU);
  const playU = s.get(scene.playU);
  const upU = s.get(scene.upU);
  const stateU = s.get(scene.stateU);
  const bookU = s.get(scene.bookU);
  const teaseU = s.get(scene.teaseU);

  const reqPos = along(REQ_PATH, reqU);
  const snapPos = along(SNAP_PATH, snapU <= 0.5 ? snapU * 2 : 2 - snapU * 2);
  const phX = playheadX(playU);
  const dimForBook = 1 - 0.75 * bookU; // everything except the bookmark chips
  const stateLabel = stateU < 0.5 ? 'initial' : stateU < 1.5 ? 'syncing' : 'live';
  const stateColor = stateU < 0.5 ? colors.MUTED : stateU < 1.5 ? colors.WARM : colors.POSITIVE;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ------------------------------------------------ nodes + wires */}
        <g opacity={nodesU * dimForBook}>
          <Connection
            from={{ x: CLIENT.x + 64, y: CLIENT.y }}
            to={{ x: ELECTRIC.x - 62, y: ELECTRIC.y }}
            u={nodesU}
            label="HTTP"
          />
          <Connection
            from={{ x: ELECTRIC.x + 64, y: ELECTRIC.y }}
            to={{ x: PG.x - 62, y: PG.y }}
            u={nodesU}
            label="logical replication"
          />
          <ServiceNode x={ELECTRIC.x} y={ELECTRIC.y} kind="server" label="Electric" sublabel="sync service" u={nodesU} />
          <ServiceNode x={PG.x} y={PG.y} kind="db" label="Postgres" sublabel="public.todos" u={nodesU} />
        </g>
        <g opacity={nodesU}>
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="client" sublabel={stateLabel} u={nodesU} glow={clamp01(stateU - 1)} />
          {/* client state chip */}
          <rect x={CLIENT.x - 10} y={CLIENT.y - 40} width={86} height={24} rx={7} fill={colors.BG} stroke={stateColor} opacity={clamp01(stateU + 0.4) * dimForBook} />
          <text x={CLIENT.x + 33} y={CLIENT.y - 23} textAnchor="middle" fill={stateColor} fontSize={12} fontFamily={MONO} opacity={dimForBook}>
            {stateLabel}
          </text>
        </g>

        {/* ------------------------------------------------ the local store */}
        <g opacity={storeU * dimForBook}>
          <rect x={STORE.x} y={STORE.y} width={STORE.w} height={STORE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={STORE.x + 16} y={STORE.y + 24} fill={colors.MUTED} fontSize={12}>
            local store
          </text>
          <text x={STORE.x + STORE.w - 14} y={STORE.y + 24} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            {`${SNAP_ROWS.filter((_, i) => win(rowsU, 4, i, 2) > 0.95).length} rows`}
          </text>
          {SNAP_ROWS.map((r, i) => {
            const u = win(rowsU, 4, i, 2);
            if (u < 0.95) return null;
            return (
              <g key={r.id}>
                <rect x={STORE.x + 12} y={STORE.y + 36 + i * 34} width={STORE.w - 24} height={28} rx={6} fill="rgba(56,189,248,0.08)" stroke={colors.GRID} />
                <text x={STORE.x + 24} y={STORE.y + 55 + i * 34} fill={r.id === 41 ? colors.WARM : colors.TEXT} fontSize={12} fontFamily={MONO}>
                  {r.id}
                </text>
                <text x={STORE.x + 58} y={STORE.y + 55 + i * 34} fill={colors.TEXT} fontSize={12}>
                  {r.title}
                </text>
                <text x={STORE.x + STORE.w - 22} y={STORE.y + 55 + i * 34} textAnchor="end" fill={STATUS_COLOR[r.status]} fontSize={11.5} fontFamily={MONO}>
                  {r.status}
                </text>
              </g>
            );
          })}
        </g>

        {/* ------------------------------------------------ the request */}
        <g opacity={reqChipU * (1 - clamp01((reqU - 0.9) * 10) * 0.4) * dimForBook}>
          <rect x={200} y={96} width={430} height={30} rx={9} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={214} y={116} fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
            GET /v1/shape?table=todos&offset=-1&where=…
          </text>
          {/* highlight ring on offset=-1 */}
          <rect x={432} y={99} width={82} height={24} rx={6} fill="none" stroke={colors.WARM} strokeWidth={1.6} opacity={minusU} />
        </g>
        {reqU > 0.01 && reqU < 0.99 && (
          <circle cx={reqPos.x} cy={reqPos.y} r={7} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={1.5} />
        )}

        {/* Electric → Postgres snapshot probe (out and back) */}
        {snapU > 0.01 && snapU < 0.99 && (
          <g>
            <circle cx={snapPos.x} cy={snapPos.y} r={6} fill={snapU <= 0.5 ? 'none' : colors.POSITIVE} stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={(ELECTRIC.x + PG.x) / 2 + 10} y={ELECTRIC.y - 6} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              {"SELECT … WHERE project_id = 'p1'"}
            </text>
          </g>
        )}

        {/* ------------------------------------------------ row messages streaming */}
        {SNAP_ROWS.map((r, i) => {
          const u = win(rowsU, 4, i, 2);
          if (u <= 0.02 || u >= 0.95) return null;
          const p = along(RESP_PATH, u / 0.95);
          return (
            <g key={r.id} opacity={dimForBook}>
              <rect x={p.x - 52} y={p.y - 11} width={104} height={22} rx={6} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
                {`insert id=${r.id}`}
              </text>
            </g>
          );
        })}

        {/* ------------------------------------------------ the bookmark headers */}
        <g opacity={headU}>
          {/* spotlight panel behind the bookmark during beat 9 */}
          <rect x={STORE.x - 8} y={STORE.y + STORE.h + 8} width={STORE.w + 160} height={64} rx={10} fill={bookU > 0.02 ? colors.PANEL : 'none'} stroke={bookU > 0.02 ? colors.WARM : 'none'} opacity={0.4 + 0.6 * bookU} />
          <rect x={STORE.x} y={STORE.y + STORE.h + 16} width={252} height={22} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1 + bookU} />
          <text x={STORE.x + 10} y={STORE.y + STORE.h + 31} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
            electric-handle: 62488107-17526…
          </text>
          <rect x={STORE.x + 260} y={STORE.y + STORE.h + 16} width={140} height={22} rx={6} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1 + bookU} />
          <text x={STORE.x + 270} y={STORE.y + STORE.h + 31} fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
            electric-offset: 0_3
          </text>
          <text x={STORE.x + 4} y={STORE.y + STORE.h + 56} fill={colors.MUTED} fontSize={11} opacity={bookU}>
            the whole bookmark — nothing else to persist
          </text>
        </g>

        {/* ------------------------------------------------ THE TAPE */}
        <g opacity={clamp01(tapeU * 1.4) * dimForBook}>
          <text x={TAPE.x0} y={TAPE.y - 14} fill={colors.MUTED} fontSize={12}>
            the shape log — one tape per handle
          </text>
          <text x={TAPE.x1} y={TAPE.y - 14} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            62488107-…
          </text>
          {/* tape base */}
          <rect x={TAPE.x0} y={TAPE.y} width={(TAPE.x1 - TAPE.x0) * tapeU} height={TAPE.h} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          {/* the -1 marker */}
          <text x={TAPE.x0 + 12} y={TAPE.y + TAPE.h + 18} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>
            -1
          </text>
          {/* snapshot segments */}
          {SNAP_ROWS.map((r, i) => {
            const u = win(rowsU, 4, i, 2);
            return (
              <g key={r.id} opacity={clamp01(u * 2)}>
                <rect x={segX(i)} y={TAPE.y + 3} width={SEG_W} height={TAPE.h - 6} rx={4} fill="rgba(56,189,248,0.18)" stroke={colors.ACCENT} strokeWidth={1} />
                <text x={segX(i) + SEG_W / 2} y={TAPE.y + TAPE.h - 8} textAnchor="middle" fill={colors.ACCENT} fontSize={10} fontFamily={MONO}>
                  {`id=${r.id}`}
                </text>
                <text x={segX(i) + SEG_W / 2} y={TAPE.y + TAPE.h + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                  {OFFSETS[i]}
                </text>
              </g>
            );
          })}
          {/* the up-to-date pill at the head of the tape */}
          <g opacity={upU}>
            <rect x={segX(4)} y={TAPE.y + 1} width={112} height={TAPE.h - 2} rx={11} fill="rgba(52,211,153,0.15)" stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={segX(4) + 56} y={TAPE.y + TAPE.h / 2 + 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
              up-to-date
            </text>
          </g>
          {/* the playhead */}
          <g opacity={clamp01(tapeU * 2)}>
            <path d={`M ${phX - 7} ${TAPE.y - 16} L ${phX + 7} ${TAPE.y - 16} L ${phX} ${TAPE.y - 4} Z`} fill={colors.WARM} />
            <line x1={phX} x2={phX} y1={TAPE.y - 4} y2={TAPE.y + TAPE.h + 2} stroke={colors.WARM} strokeWidth={1.4} opacity={0.8} />
            <text x={phX} y={TAPE.y - 24} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              offset
            </text>
          </g>
        </g>

        {/* ------------------------------------------------ the tease: a write flashes at Postgres */}
        <g opacity={teaseU}>
          <rect x={PG.x - 96} y={PG.y + 78} width={330} height={28} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={PG.x + 69} y={PG.y + 97} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
            {"UPDATE todos SET status='done' …"}
          </text>
          <circle cx={PG.x + 26} cy={PG.y + 26} r={34 + 10 * teaseU} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={1 - teaseU} />
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
