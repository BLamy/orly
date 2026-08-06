// One Cell, One Thread
//
// Backed by: docs/README.md (cells, one thread, interleave only at await,
// storage never interleaves), crates/celld/storage.rs (DO storage async in JS,
// synchronous underneath, own db file per cell), crates/celld/js.rs (one
// isolate per cell, `env.NS.get(id)` instantiates the DO class once per id).
//
// Machine: a field of cells condenses out of the app, the camera pushes into
// ONE cell rendered as a room with a single execution lane. Request A's run
// bar grows along the lane and parks at an await; request B interleaves in the
// gap; then A performs a storage write drawn as one unbroken solid block —
// synchronous, nothing interleaves. The cell's private SQLite card fills rows
// as the block lands. Pull back: every cell in the field owns its own tiny db.
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

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CELL = { x: 400, y: 170, w: 620, h: 250 };
const LANE = { x: CELL.x + 40, y: CELL.y + 165, w: CELL.w - 80 };
const DB = { x: 470, y: 462, w: 480, h: 128 };

const CAM_FIELD: CameraState = { ...CAMERA_HOME };
const CAM_CELL: CameraState = { x: 700, y: 330, k: 1.22 };
const CAM_LANE: CameraState = { x: 710, y: 380, k: 1.32 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.0 };

// The field of cells: seeded, deterministic. Each dot is one durable object.
const rand = mulberry32(7);
const FIELD = Array.from({ length: 26 }, (_, i) => {
  const col = i % 7;
  const row = Math.floor(i / 7);
  return {
    x: 180 + col * 155 + (rand() - 0.5) * 60,
    y: 130 + row * 130 + (rand() - 0.5) * 44,
    r: 13 + rand() * 8,
    label: ['user', 'doc', 'room', 'agent'][i % 4],
  };
});
// The focal cell is the field dot the camera dives into.
const FOCAL = { x: 700, y: 295 };

// Execution lane phases for request A (fractions of the lane width).
const RUN1_END = 0.34; // runs, then awaits
const AWAIT_END = 0.56; // B interleaves here
const RUN2_END = 0.72; // A resumes
const STORE_END = 1.0; // solid storage block

const DB_ROWS = [
  'seq 41 · put · "topic"',
  'seq 42 · put · "members"',
  'seq 43 · sql exec · insert message',
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  fieldU: ChannelRef<number>;
  cellU: ChannelRef<number>;
  dbU: ChannelRef<number>;
  queueU: ChannelRef<number>;
  runAU: ChannelRef<number>;
  runBU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  syncU: ChannelRef<number>;
  isoU: ChannelRef<number>;
  wideU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FIELD, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const cellU = tl.channel('cellU', 0);
  const dbU = tl.channel('dbU', 0);
  const queueU = tl.channel('queueU', 0);
  const runAU = tl.channel('runAU', 0); // 0..1 across the lane phases
  const runBU = tl.channel('runBU', 0); // B's interleaved slice
  const storeU = tl.channel('storeU', 0); // the solid storage block
  const syncU = tl.channel('syncU', 0); // async-in-JS / sync-in-Rust panel
  const isoU = tl.channel('isoU', 0); // isolate ring
  const wideU = tl.channel('wideU', 0); // per-dot tiny dbs on pull-back
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the app splits into cells —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Your application does not share one database. It splits into cells: one small server for each user, each document, each chat room.',
  });
  tl.tween(fieldU, 1, { at: t - 6.4, dur: 2.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 2 · one cell, one name, one private db —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'A cell is a durable object. It has a name, it serves requests, and it owns a private SQLite database that no other cell can touch.',
  });
  tl.tween(cam, CAM_CELL, { at: t - 6.5, dur: 1.5, ease: ease.move });
  tl.tween(cellU, 1, { at: t - 5.6, dur: 1.0, ease: ease.enter });
  tl.tween(dbU, 1, { at: t - 4.2, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 3 · one thread, requests queue —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Every cell runs on exactly one thread. Two requests to the same cell never execute at the same instant.',
  });
  tl.tween(cam, CAM_LANE, { at: t - 5.7, dur: 1.3, ease: ease.move });
  tl.tween(queueU, 1, { at: t - 5.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 4 · interleave only at await —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'The first request runs until it awaits something slow, like a call to another service. Only then can the second request interleave.',
  });
  tl.tween(runAU, RUN1_END, { at: t - 6.6, dur: 1.6, ease: ease.linear });
  tl.tween(runBU, 1, { at: t - 4.6, dur: 2.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 5 · storage never interleaves —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Storage is different. A storage operation is synchronous underneath, so it never interleaves at all. The data in a cell stays consistent.',
  });
  tl.tween(runAU, RUN2_END, { at: t - 6.2, dur: 1.2, ease: ease.linear });
  tl.tween(storeU, 1, { at: t - 4.6, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 6 · async in JS, sync in Rust —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'In your worker code the storage calls look asynchronous. Underneath they are synchronous Rust, writing straight into the cell’s own SQLite file.',
  });
  tl.tween(syncU, 1, { at: t - 5.9, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 7 · one isolate per cell —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Each cell gets its own isolate in the embedded engine, created once per name and reused for every request that follows.',
  });
  tl.tween(isoU, 1, { at: t - 5.6, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.5);

  // — Beat 8 · share nothing —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Because cells share nothing, the contention of one big shared database is designed out, not managed.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.9, dur: 1.5, ease: ease.move });
  tl.tween(wideU, 1, { at: t - 4.6, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 9 · close —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'That is the object. The rest of this book is how a fleet of ordinary machines keeps thousands of them alive, durable, and cheap.',
  });
  tl.tween(dimU, 1, { at: t - 6.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, fieldU, cellU, dbU, queueU, runAU, runBU, storeU, syncU, isoU, wideU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function CellField({ u, wide, dim }: { u: number; wide: number; dim: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={1 - 0.85 * dim}>
      {FIELD.map((c, i) => {
        const p = clamp01(u * FIELD.length * 0.7 - i * 0.5);
        if (p <= 0) return null;
        return (
          <g key={i} transform={`translate(${c.x}, ${c.y})`} opacity={p * 0.9}>
            <circle r={c.r * p} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.8} />
            <text y={4} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily={MONO}>
              {c.label}
            </text>
            {wide > 0 && (
              <g opacity={clamp01(wide * FIELD.length * 0.5 - i * 0.4)}>
                <rect x={-8} y={c.r + 4} width={16} height={10} rx={2} fill="none" stroke={colors.POSITIVE} strokeWidth={1.2} />
                <line x1={-8} y1={c.r + 9} x2={8} y2={c.r + 9} stroke={colors.POSITIVE} strokeWidth={0.8} />
              </g>
            )}
          </g>
        );
      })}
      {wide > 0.6 && (
        <text x={640} y={92} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={(wide - 0.6) * 2.5}>
          every cell: its own database · nothing shared
        </text>
      )}
    </g>
  );
}

function CellRoom({
  u,
  queue,
  runA,
  runB,
  store,
  iso,
  dim,
}: {
  u: number;
  queue: number;
  runA: number;
  runB: number;
  store: number;
  iso: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const laneAt = (f: number) => LANE.x + LANE.w * f;

  // Request A's run bar: phase 1 (0..RUN1_END), then resume (AWAIT_END..RUN2_END).
  const a1 = Math.min(runA, RUN1_END);
  const a2 = runA > RUN1_END ? Math.min(runA, RUN2_END) : 0;
  // B's slice fills the await gap.
  const b = clamp01(runB) * (AWAIT_END - RUN1_END);
  // The storage block extends from RUN2_END.
  const st = RUN2_END + clamp01(store) * (STORE_END - RUN2_END);

  return (
    <g opacity={(1 - 0.85 * dim) * uu}>
      <g transform={`translate(0, ${(1 - uu) * 12})`}>
        <rect x={CELL.x} y={CELL.y} width={CELL.w} height={CELL.h} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
        {iso > 0 && (
          <rect
            x={CELL.x - 14}
            y={CELL.y - 14}
            width={CELL.w + 28}
            height={CELL.h + 28}
            rx={22}
            fill="none"
            stroke={colors.SECONDARY}
            strokeWidth={1.6}
            strokeDasharray="6 7"
            opacity={iso}
          />
        )}
        {iso > 0.5 && (
          <text x={CELL.x + CELL.w - 8} y={CELL.y - 24} textAnchor="end" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO} opacity={(iso - 0.5) * 2}>
            one isolate per cell · env.NS.get(id) · js.rs
          </text>
        )}
        <text x={CELL.x + 22} y={CELL.y + 32} fill={colors.TEXT} fontSize={16} fontWeight={700}>
          cell · room-7
        </text>
        <text x={CELL.x + 22} y={CELL.y + 54} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
          a Durable Object: named, single-threaded, stateful
        </text>

        {/* the single execution lane */}
        <line x1={LANE.x} y1={LANE.y} x2={LANE.x + LANE.w} y2={LANE.y} stroke={colors.GRID} strokeWidth={5} strokeLinecap="round" />
        <text x={LANE.x} y={LANE.y + 28} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          one thread — the only place this cell&apos;s code runs
        </text>

        {/* queued request pills */}
        {queue > 0 && (
          <>
            <RequestPill label="req A" color={colors.ACCENT} u={clamp01(queue * 1.6)} slot={0} started={runA > 0} />
            <RequestPill label="req B" color={colors.WARM} u={clamp01(queue * 1.6 - 0.4)} slot={1} started={runB > 0} />
          </>
        )}

        {/* A phase 1 */}
        {a1 > 0 && <rect x={laneAt(0)} y={LANE.y - 7} width={LANE.w * a1} height={14} rx={7} fill={colors.ACCENT} opacity={0.9} />}
        {/* the await gap marker */}
        {runA >= RUN1_END - 0.001 && (
          <g opacity={clamp01((runA - RUN1_END + 0.02) * 30 + (runB > 0 ? 1 : 0))}>
            <text x={laneAt(RUN1_END)} y={LANE.y - 34} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
              await fetch — A parks
            </text>
            <line x1={laneAt(RUN1_END)} y1={LANE.y - 26} x2={laneAt(RUN1_END)} y2={LANE.y - 12} stroke={colors.ACCENT} strokeWidth={1.2} strokeDasharray="2 3" />
          </g>
        )}
        {/* B interleaves in the gap */}
        {b > 0 && <rect x={laneAt(RUN1_END)} y={LANE.y - 7} width={LANE.w * b} height={14} rx={7} fill={colors.WARM} opacity={0.9} />}
        {/* A resumes */}
        {a2 > AWAIT_END && (
          <rect x={laneAt(AWAIT_END)} y={LANE.y - 7} width={LANE.w * (a2 - AWAIT_END)} height={14} rx={7} fill={colors.ACCENT} opacity={0.9} />
        )}
        {/* the solid storage block — unbroken, taller, locked */}
        {store > 0 && (
          <g>
            <rect
              x={laneAt(RUN2_END)}
              y={LANE.y - 12}
              width={LANE.w * (st - RUN2_END)}
              height={24}
              rx={6}
              fill={colors.POSITIVE}
              opacity={0.95}
            />
            {store > 0.35 && (
              <text x={laneAt((RUN2_END + STORE_END) / 2)} y={LANE.y - 20} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={(store - 0.35) * 2}>
                storage op · synchronous · nothing interleaves
              </text>
            )}
          </g>
        )}
      </g>
    </g>
  );
}

function RequestPill({ label, color, u, slot, started }: { label: string; color: string; u: number; slot: number; started: boolean }) {
  if (u <= 0 || started) return null;
  const x0 = 250;
  const x1 = LANE.x - 46 - slot * 78;
  const x = x0 + (x1 - x0) * ease.move(u);
  return (
    <g transform={`translate(${x}, ${LANE.y})`} opacity={Math.min(1, u * 4)}>
      <rect x={-32} y={-14} width={64} height={28} rx={14} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={4} textAnchor="middle" fill={color} fontSize={11} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

function DbCard({ u, rows, sync, dim }: { u: number; rows: number; sync: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${DB.x}, ${DB.y + (1 - uu) * 12})`} opacity={(1 - 0.85 * dim) * uu}>
      <rect width={DB.w} height={DB.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
      <text x={16} y={24} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
        room-7 · private SQLite · storage.rs
      </text>
      {DB_ROWS.map((row, i) => {
        const p = clamp01(rows * 3.2 - i);
        if (p <= 0) return null;
        return (
          <text key={row} x={22} y={50 + i * 22} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO} opacity={p * 0.9}>
            {row}
          </text>
        );
      })}
      {sync > 0 && (
        <g opacity={sync}>
          <rect x={DB.w - 218} y={38} width={202} height={70} rx={9} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
          <text x={DB.w - 117} y={60} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
            ctx.storage.put() — async in JS
          </text>
          <text x={DB.w - 117} y={80} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
            sync Rust op underneath
          </text>
        </g>
      )}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-345} y={-88} width={690} height={176} rx={18} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.7} />
      <text y={-40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        One cell. One thread. One database.
      </text>
      <text y={-2} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
        requests interleave only at await · storage never does
      </text>
      <text y={30} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
        each cell: its own isolate + its own SQLite file
      </text>
      <text y={61} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        next: how a fleet decides who runs it
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const cellU = s.get(scene.cellU);
  const wide = clamp01(s.get(scene.wideU));
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <CellField u={s.get(scene.fieldU) * (1 - clamp01(cellU) * 0.88 * (1 - wide))} wide={wide} dim={dim} />
        <CellRoom
          u={cellU}
          queue={s.get(scene.queueU)}
          runA={s.get(scene.runAU)}
          runB={s.get(scene.runBU)}
          store={s.get(scene.storeU)}
          iso={s.get(scene.isoU)}
          dim={Math.max(dim, s.get(scene.wideU) * 0.7)}
        />
        <DbCard
          u={s.get(scene.dbU)}
          rows={s.get(scene.storeU)}
          sync={s.get(scene.syncU)}
          dim={Math.max(dim, s.get(scene.wideU) * 0.7)}
        />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
