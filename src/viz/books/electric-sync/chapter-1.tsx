// The Stencil: what a shape is
//
// Grounding: packages/sync-service/lib/electric/shapes/shape.ex (defstruct
// root_table, root_pk, where, selected_columns, replica, log_mode;
// comparable/1 → :erlang.phash2 → generate_id/1 returns "#{hash}-#{µs}"),
// packages/sync-service/lib/electric/shapes/where_clause.ex, and
// packages/typescript-client/src/constants.ts (TABLE_QUERY_PARAM `table`,
// WHERE_QUERY_PARAM `where`, COLUMNS_QUERY_PARAM `columns`). README:
// "Partial replication is managed using Shapes."
//
// Centerpiece: a Postgres table as a grid of live rows. A shape definition
// assembles chip by chip, then sweeps the grid like a stencil — the where
// clause lights matching rows, the column list shutters an unselected
// column, and the surviving slice extrudes into "the shape". The definition
// then flows through a hash funnel into the shape handle; a duplicate
// definition melts into the SAME handle, a different where clause forks a
// second one.
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
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the Postgres table grid, the definition card, the shape strip.
// ---------------------------------------------------------------------------

const TABLE = { x: 64, y: 118, w: 512, h: 436 } as const;
const ROW_H = 32;
const ROW_Y0 = TABLE.y + 84;
// column x-offsets inside the table panel (id, title, status, project_id, created_at)
const COLS = [
  { key: 'id', x: 84, w: 46 },
  { key: 'title', x: 136, w: 178 },
  { key: 'status', x: 320, w: 82 },
  { key: 'project_id', x: 408, w: 86 },
  { key: 'created_at', x: 500, w: 62 },
] as const;

const CARD = { x: 660, y: 96, w: 548, h: 168 } as const;
const STRIP = { x: 700, y: 320, w: 400, rowH: 34 } as const;
const STRUCT = { x: 648, y: 96, w: 560, h: 214 } as const;
const FUNNEL = { cx: 928, y0: STRUCT.y + STRUCT.h + 16, y1: STRUCT.y + STRUCT.h + 92 } as const;
const HANDLE = { x: 758, y: FUNNEL.y1 + 18, w: 340, h: 44 } as const;
const HANDLE2 = { x: 758, y: HANDLE.y + 118, w: 340, h: 44 } as const;

// camera marks
const CAM_TABLE: CameraState = { x: 380, y: 340, k: 1.22 };
const CAM_CARD: CameraState = { x: 800, y: 300, k: 1.12 };
const CAM_STRUCT: CameraState = { x: 900, y: 340, k: 1.16 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// The rows. Four of ten match project_id = 'p1'; row 41 is the throughline.
// ---------------------------------------------------------------------------

interface RowDatum {
  id: number;
  title: string;
  status: string;
  project: string;
  created: string;
}

const ROWS: RowDatum[] = [
  { id: 41, title: 'Ship the demo', status: 'doing', project: 'p1', created: '07-12' },
  { id: 12, title: 'Fix login flow', status: 'done', project: 'p2', created: '07-02' },
  { id: 27, title: 'Write eval suite', status: 'todo', project: 'p1', created: '07-09' },
  { id: 8, title: 'Rotate api keys', status: 'done', project: 'p3', created: '06-28' },
  { id: 33, title: 'Draft launch post', status: 'todo', project: 'p2', created: '07-05' },
  { id: 55, title: 'Wire the webhook', status: 'doing', project: 'p1', created: '07-11' },
  { id: 19, title: 'Clean stale rows', status: 'todo', project: 'p3', created: '06-30' },
  { id: 62, title: 'Review agent logs', status: 'todo', project: 'p1', created: '07-14' },
  { id: 5, title: 'Bump deps', status: 'done', project: 'p2', created: '06-25' },
  { id: 48, title: 'Tune retries', status: 'doing', project: 'p3', created: '07-08' },
];

const MATCH = ROWS.map((r) => r.project === 'p1');
const MATCH_IDX = ROWS.map((_, i) => i).filter((i) => MATCH[i]); // [0, 2, 5, 7]

const rowY = (i: number): number => ROW_Y0 + i * ROW_H;
const stripY = (m: number): number => STRIP.y + m * STRIP.rowH;

// the handles — phash2-style integer, then a microsecond timestamp
const HANDLE_P1 = '62488107-1752669412183042';
const HANDLE_P2 = '90233815-1752669498441077';

// ---------------------------------------------------------------------------
// Timeline (~94s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TABLE, cameraInterp);

  const tableU = tl.channel('tableU', 0); // table panel + rows draw on
  const cardU = tl.channel('cardU', 0); // definition chips, staggered ×3
  const sweepU = tl.channel('sweepU', 0); // stencil sweep down the grid
  const shutterU = tl.channel('shutterU', 0); // created_at column shutters
  const extrU = tl.channel('extrU', 0); // matching rows glide into the strip
  const dimTableU = tl.channel('dimTableU', 0); // table fades to a whisper
  const structU = tl.channel('structU', 0); // shape.ex struct panel
  const flowU = tl.channel('flowU', 0); // struct fields pour into the funnel
  const handleU = tl.channel('handleU', 0); // the handle chip
  const dupU = tl.channel('dupU', 0); // duplicate definition card slides in
  const dupMergeU = tl.channel('dupMergeU', 0); // …and melts into the SAME handle
  const forkU = tl.channel('forkU', 0); // a different where clause forks
  const dimAllU = tl.channel('dimAllU', 0); // everything quiets for the close
  const closeU = tl.channel('closeU', 0); // closing panel

  // — beat 1 · the hook: nobody wants the whole database —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'An app, or an agent, rarely wants the whole database. It wants one project’s rows, on its own machine, kept fresh.',
  });
  tl.tween(tableU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.hold(7.1, 0.6);

  // — beat 2 · the table in Postgres —
  tl.caption({
    at: 7.7,
    dur: 5.8,
    text: 'Here is the table in Postgres: every project’s tasks in one place. Each client should only ever see a slice of it.',
  });
  tl.hold(13.5, 0.7);

  // — beat 3 · the shape definition assembles —
  tl.caption({
    at: 14.2,
    dur: 6.6,
    text: 'Electric calls that slice a shape, and you define one with three ingredients: a root table, a where clause, and the columns you care about.',
  });
  tl.tween(cam, CAM_CARD, { at: 14.4, dur: 1.3, ease: ease.move });
  tl.tween(cardU, 1, { at: 15.0, dur: 2.4, ease: ease.enter });
  tl.hold(20.8, 0.6);

  // — beat 4 · the stencil sweep —
  tl.caption({
    at: 21.4,
    dur: 6.4,
    text: 'Hold the definition over the table like a stencil. The where clause decides row by row: project one stays lit, everything else goes dark.',
  });
  tl.tween(cam, CAM_TABLE, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.tween(sweepU, 1, { at: 22.4, dur: 4.2, ease: ease.linear });
  tl.hold(27.8, 0.6);

  // — beat 5 · the column shutter —
  tl.caption({
    at: 28.4,
    dur: 5.6,
    text: 'The column list trims the other axis. A column you didn’t select never leaves the database at all.',
  });
  tl.tween(shutterU, 1, { at: 29.0, dur: 1.2, ease: ease.move });
  tl.hold(34.0, 0.7);

  // — beat 6 · the slice extrudes: this is the shape —
  tl.caption({
    at: 34.7,
    dur: 6.0,
    text: 'What survives, matching rows and chosen columns, is the shape: a partial replica of exactly one table.',
  });
  tl.tween(cam, CAM_WIDE, { at: 34.9, dur: 1.4, ease: ease.move });
  tl.tween(extrU, 1, { at: 35.5, dur: 2.6, ease: ease.move });
  tl.hold(40.7, 0.8);

  // — beat 7 · the struct inside the sync service —
  tl.caption({
    at: 41.5,
    dur: 6.4,
    text: 'Inside the sync service a shape is a literal struct: the root table, its primary key, the parsed where clause, and the selected columns.',
  });
  tl.tween(dimTableU, 1, { at: 41.7, dur: 1.1, ease: ease.move });
  tl.tween(cardU, 0, { at: 41.7, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_STRUCT, { at: 41.9, dur: 1.4, ease: ease.move });
  tl.tween(structU, 1, { at: 42.6, dur: 1.4, ease: ease.draw });
  tl.hold(47.9, 0.7);

  // — beat 8 · the hash funnel → the handle —
  tl.caption({
    at: 48.6,
    dur: 6.2,
    text: 'Electric hashes that definition, and the hash plus a timestamp becomes the shape handle, the name every client will sync this shape by.',
  });
  tl.tween(flowU, 1, { at: 49.2, dur: 2.2, ease: ease.linear });
  tl.tween(handleU, 1, { at: 51.6, dur: 0.6, ease: ease.pop });
  tl.hold(54.8, 0.8);

  // — beat 9 · same definition, same shape —
  tl.caption({
    at: 55.6,
    dur: 6.4,
    text: 'Ask for the same definition twice and you land on the same shape. A thousand clients wanting project one share one log and one pipeline.',
  });
  tl.tween(dupU, 1, { at: 56.2, dur: 0.9, ease: ease.enter });
  tl.tween(dupMergeU, 1, { at: 58.0, dur: 1.6, ease: ease.move });
  tl.hold(62.0, 0.7);

  // — beat 10 · a different where clause forks a different shape —
  tl.caption({
    at: 62.7,
    dur: 5.8,
    text: 'Change the where clause, though, and you’ve named a different shape, with its own handle and its own log.',
  });
  tl.tween(forkU, 1, { at: 63.3, dur: 1.6, ease: ease.enter });
  tl.hold(68.5, 0.9);

  // — beat 11 · the promise —
  tl.caption({
    at: 69.4,
    dur: 7.0,
    text: 'So a shape is a promise: this slice of Postgres, kept up to date, for as long as anyone is watching. The rest of this book is how Electric keeps it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 69.6, dur: 1.4, ease: ease.move });
  tl.tween(dimAllU, 1, { at: 69.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 71.2, dur: 0.8, ease: ease.enter });
  tl.hold(76.4, 1.6);

  return {
    tl,
    cam,
    tableU,
    cardU,
    sweepU,
    shutterU,
    extrU,
    dimTableU,
    structU,
    flowU,
    handleU,
    dupU,
    dupMergeU,
    forkU,
    dimAllU,
    closeU,
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
  const tableU = s.get(scene.tableU);
  const cardU = s.get(scene.cardU);
  const sweepU = s.get(scene.sweepU);
  const shutterU = s.get(scene.shutterU);
  const extrU = s.get(scene.extrU);
  const dimTableU = s.get(scene.dimTableU);
  const structU = s.get(scene.structU);
  const flowU = s.get(scene.flowU);
  const handleU = s.get(scene.handleU);
  const dupU = s.get(scene.dupU);
  const dupMergeU = s.get(scene.dupMergeU);
  const forkU = s.get(scene.forkU);
  const dimAllU = s.get(scene.dimAllU);
  const closeU = s.get(scene.closeU);

  const sweepY = ROW_Y0 - 10 + (ROWS.length * ROW_H + 14) * sweepU;
  const tableOp = tableU * (1 - 0.85 * dimTableU) * (1 - 0.9 * dimAllU);
  const stripOp = (1 - 0.88 * dimAllU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ------------------------------------------------ the Postgres table */}
        <g opacity={tableOp}>
          <Zone
            x={TABLE.x - 18}
            y={TABLE.y - 34}
            w={TABLE.w + 36}
            h={TABLE.h + 56}
            label="Postgres"
            kind="group"
            u={tableU}
          />
          <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={TABLE.x + 18} y={TABLE.y + 30} fill={colors.TEXT} fontSize={15} fontWeight={600} fontFamily={MONO}>
            public.todos
          </text>
          <text x={TABLE.x + TABLE.w - 16} y={TABLE.y + 30} textAnchor="end" fill={colors.MUTED} fontSize={12}>
            every project, one table
          </text>

          {/* column headers */}
          {COLS.map((c) => (
            <text key={c.key} x={TABLE.x + c.x - 64} y={TABLE.y + 62} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              {c.key}
            </text>
          ))}

          {/* rows — light up / go dark as the stencil passes */}
          {ROWS.map((r, i) => {
            const passed = sweepY > rowY(i) + ROW_H / 2;
            const lit = passed && MATCH[i];
            const dark = passed && !MATCH[i];
            const rowOp = win(tableU, ROWS.length, i, 3) * (dark ? 0.22 : 1);
            const gone = MATCH[i] ? extrU : 0; // matching rows leave with the strip
            return (
              <g key={r.id} opacity={rowOp * (1 - gone)}>
                <rect
                  x={TABLE.x + 14}
                  y={rowY(i)}
                  width={TABLE.w - 28}
                  height={ROW_H - 6}
                  rx={6}
                  fill={lit ? 'rgba(56,189,248,0.10)' : colors.BG}
                  stroke={lit ? colors.ACCENT : colors.GRID}
                  strokeWidth={lit ? 1.4 : 1}
                />
                <text x={TABLE.x + COLS[0].x - 64} y={rowY(i) + 18} fill={r.id === 41 ? colors.WARM : colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                  {r.id}
                </text>
                <text x={TABLE.x + COLS[1].x - 64} y={rowY(i) + 18} fill={colors.TEXT} fontSize={12.5}>
                  {r.title}
                </text>
                <text x={TABLE.x + COLS[2].x - 64} y={rowY(i) + 18} fill={STATUS_COLOR[r.status]} fontSize={12.5} fontFamily={MONO}>
                  {r.status}
                </text>
                <text x={TABLE.x + COLS[3].x - 64} y={rowY(i) + 18} fill={r.project === 'p1' ? colors.ACCENT : colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                  {r.project}
                </text>
                <text x={TABLE.x + COLS[4].x - 64} y={rowY(i) + 18} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={1 - 0.8 * shutterU}>
                  {r.created}
                </text>
              </g>
            );
          })}

          {/* the stencil sweep line + predicate chip riding it */}
          {sweepU > 0.01 && sweepU < 0.999 && (
            <g>
              <line x1={TABLE.x + 10} x2={TABLE.x + TABLE.w - 10} y1={sweepY} y2={sweepY} stroke={colors.ACCENT} strokeWidth={2} opacity={0.9} />
              <rect x={TABLE.x + TABLE.w - 196} y={sweepY - 26} width={186} height={22} rx={6} fill={colors.BG} stroke={colors.ACCENT} />
              <text x={TABLE.x + TABLE.w - 103} y={sweepY - 11} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                {"project_id = 'p1' ?"}
              </text>
            </g>
          )}

          {/* the created_at shutter */}
          <g opacity={shutterU}>
            <rect
              x={TABLE.x + COLS[4].x - 70}
              y={TABLE.y + 46}
              width={COLS[4].w + 12}
              height={TABLE.h - 60}
              rx={8}
              fill="rgba(10,14,26,0.55)"
              stroke={colors.NEGATIVE}
              strokeDasharray="4 4"
            />
            <text
              x={TABLE.x + COLS[4].x - 70 + (COLS[4].w + 12) / 2}
              y={TABLE.y + TABLE.h - 22}
              textAnchor="middle"
              fill={colors.NEGATIVE}
              fontSize={11}
            >
              not selected
            </text>
          </g>
        </g>

        {/* ------------------------------------------------ the definition card */}
        <g opacity={cardU * (1 - 0.9 * dimAllU)}>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CARD.x + 20} y={CARD.y + 30} fill={colors.MUTED} fontSize={12} fontStyle="italic">
            the shape definition — three query parameters
          </text>
          {[
            { label: 'table=todos', color: colors.TEXT },
            { label: "where=project_id = 'p1'", color: colors.ACCENT },
            { label: 'columns=id,title,status,project_id', color: colors.SECONDARY },
          ].map((chip, i) => (
            <g key={chip.label} opacity={win(cardU, 3, i, 1.6)}>
              <rect x={CARD.x + 20} y={CARD.y + 44 + i * 38} width={CARD.w - 40} height={30} rx={8} fill={colors.BG} stroke={chip.color} />
              <text x={CARD.x + 34} y={CARD.y + 64 + i * 38} fill={chip.color} fontSize={13.5} fontFamily={MONO}>
                {chip.label}
              </text>
            </g>
          ))}
        </g>

        {/* ------------------------------------------------ the extruded shape strip */}
        <g opacity={clamp01(extrU * 2) * stripOp * (1 - 0.85 * structU)}>
          <text x={STRIP.x} y={STRIP.y - 16} fill={colors.TEXT} fontSize={14} fontWeight={600} opacity={clamp01((extrU - 0.6) * 3)}>
            the shape
          </text>
          {MATCH_IDX.map((ri, m) => {
            const r = ROWS[ri];
            const u = win(extrU, MATCH_IDX.length, m, 2.2);
            const sx = TABLE.x + 14 + (STRIP.x - TABLE.x - 14) * u;
            const sy = rowY(ri) + (stripY(m) - rowY(ri)) * u;
            return (
              <g key={r.id} opacity={u < 0.02 ? 0 : 1}>
                <rect x={sx} y={sy} width={STRIP.w} height={STRIP.rowH - 6} rx={6} fill="rgba(56,189,248,0.10)" stroke={colors.ACCENT} strokeWidth={1.2} />
                <text x={sx + 14} y={sy + 19} fill={r.id === 41 ? colors.WARM : colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                  {r.id}
                </text>
                <text x={sx + 52} y={sy + 19} fill={colors.TEXT} fontSize={12.5}>
                  {r.title}
                </text>
                <text x={sx + 230} y={sy + 19} fill={STATUS_COLOR[r.status]} fontSize={12.5} fontFamily={MONO}>
                  {r.status}
                </text>
                <text x={sx + 310} y={sy + 19} fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                  {r.project}
                </text>
              </g>
            );
          })}
        </g>

        {/* ------------------------------------------------ the struct panel */}
        <g opacity={structU * (1 - 0.9 * dimAllU)}>
          <rect x={STRUCT.x} y={STRUCT.y} width={STRUCT.w} height={STRUCT.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={STRUCT.x + STRUCT.w - 18} y={STRUCT.y + 26} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            shapes/shape.ex
          </text>
          {[
            { t: '%Electric.Shapes.Shape{', c: colors.TEXT },
            { t: '  root_table: {"public", "todos"},', c: colors.TEXT },
            { t: '  root_pk: ["id"],', c: colors.WARM },
            { t: "  where: project_id = 'p1',", c: colors.ACCENT },
            { t: '  selected_columns: ["id", "title", "status", "project_id"],', c: colors.SECONDARY },
            { t: '}', c: colors.TEXT },
          ].map((line, i) => (
            <text
              key={i}
              x={STRUCT.x + 24}
              y={STRUCT.y + 54 + i * 26}
              fill={line.c}
              fontSize={13.5}
              fontFamily={MONO}
              opacity={win(structU, 6, i, 2)}
            >
              {line.t}
            </text>
          ))}
        </g>

        {/* ------------------------------------------------ hash funnel + handle */}
        <g opacity={clamp01(flowU * 3) * (1 - 0.9 * dimAllU)}>
          <path
            d={`M ${FUNNEL.cx - 120} ${FUNNEL.y0} L ${FUNNEL.cx + 120} ${FUNNEL.y0} L ${FUNNEL.cx + 26} ${FUNNEL.y1} L ${FUNNEL.cx - 26} ${FUNNEL.y1} Z`}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={1.4}
          />
          <text x={FUNNEL.cx + 136} y={FUNNEL.y0 + 40} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            hash(definition)
          </text>
          {/* three field-dots pouring through the funnel */}
          {[0, 1, 2].map((i) => {
            const u = clamp01(flowU * 1.4 - i * 0.2);
            const x = FUNNEL.cx + (i - 1) * 70 * (1 - u);
            const y = FUNNEL.y0 - 8 + (FUNNEL.y1 + 14 - FUNNEL.y0) * u;
            return u > 0 && u < 1 ? (
              <circle key={i} cx={x} cy={y} r={5} fill={[colors.TEXT, colors.ACCENT, colors.SECONDARY][i]} />
            ) : null;
          })}
        </g>
        <g opacity={handleU * (1 - 0.9 * dimAllU)}>
          <rect x={HANDLE.x} y={HANDLE.y} width={HANDLE.w} height={HANDLE.h} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
          <text x={HANDLE.x + HANDLE.w / 2} y={HANDLE.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
            shape handle
          </text>
          <text x={HANDLE.x + HANDLE.w / 2} y={HANDLE.y + 36} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
            {HANDLE_P1}
          </text>
        </g>

        {/* ------------------------------------------------ dedupe + fork */}
        {/* duplicate definition — same three chips, smaller, melting into the handle */}
        <g opacity={dupU * (1 - dupMergeU) * (1 - 0.9 * dimAllU)}>
          {(() => {
            const dx = 180 + (HANDLE.x + HANDLE.w / 2 - 180) * dupMergeU;
            const dy = 150 + (HANDLE.y - 150) * dupMergeU;
            const k = 1 - 0.55 * dupMergeU;
            return (
              <g transform={`translate(${dx}, ${dy}) scale(${k})`}>
                <rect width={330} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={16} y={24} fill={colors.MUTED} fontSize={11} fontStyle="italic">
                  another client, same definition
                </text>
                <text x={16} y={48} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                  table=todos
                </text>
                <text x={16} y={70} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                  {"where=project_id = 'p1'"}
                </text>
              </g>
            );
          })()}
        </g>
        {/* pop ring on the handle when the duplicate lands */}
        {dupMergeU > 0.85 && (
          <rect
            x={HANDLE.x - 5}
            y={HANDLE.y - 5}
            width={HANDLE.w + 10}
            height={HANDLE.h + 10}
            rx={13}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={2}
            opacity={(1 - (dupMergeU - 0.85) / 0.15) * (1 - 0.9 * dimAllU)}
          />
        )}
        <g opacity={clamp01(dupMergeU * 2 - 1) * (1 - 0.9 * dimAllU)}>
          <text x={HANDLE.x + HANDLE.w / 2} y={HANDLE.y + HANDLE.h + 22} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
            same definition → same shape, shared log
          </text>
        </g>

        {/* fork: a different where clause gets its own handle */}
        <g opacity={forkU * (1 - 0.9 * dimAllU)}>
          <rect x={220} y={HANDLE2.y - 40} width={300} height={64} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={236} y={HANDLE2.y - 16} fill={colors.MUTED} fontSize={11} fontStyle="italic">
            a different slice
          </text>
          <text x={236} y={HANDLE2.y + 8} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
            {"where=project_id = 'p2'"}
          </text>
          <line x1={520} y1={HANDLE2.y - 8} x2={HANDLE2.x - 10} y2={HANDLE2.y + HANDLE2.h / 2} stroke={colors.GRID} strokeWidth={1.4} />
          <rect x={HANDLE2.x} y={HANDLE2.y} width={HANDLE2.w} height={HANDLE2.h} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.6} />
          <text x={HANDLE2.x + HANDLE2.w / 2} y={HANDLE2.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
            a different shape handle
          </text>
          <text x={HANDLE2.x + HANDLE2.w / 2} y={HANDLE2.y + 36} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
            {HANDLE_P2}
          </text>
        </g>

        {/* ------------------------------------------------ the closing panel */}
        <g opacity={closeU}>
          <rect x={280} y={250} width={720} height={150} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600}>
            A shape is a promise
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            this slice of Postgres, kept up to date — table + where + columns → handle
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
