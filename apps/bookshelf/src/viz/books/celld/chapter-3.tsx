// Durable Before Acknowledged
//
// Backed by: README.md (RPO=0, bucket is the durable source of truth),
// crates/celld/ltx_repl.rs (celld_ltx::Db per resident cell shadows the WAL;
// req_seq / synced_seq durability tickets; concurrent writes ride one batched
// upload; object layout cells/<cell>/ltx/e<epoch>/), crates/celld/
// replication.rs (epoch-in-prefix is the data-path fence: a stale owner
// writes a dead prefix), crates/celld/js.rs (GateReq — the output gate holds
// a response until the cell is durable).
//
// Machine: the cell's write-ahead log is a tape growing left to right; a
// response packet waits at a literal gate with a numbered ticket while
// committed pages fly up into the bucket prefix for epoch three. Two tickets
// ride one batched upload. Below, a stale epoch-two lane keeps writing into a
// dead prefix nobody reads. Finally the tape is restored down to a new node.
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

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const BUCKET = { x: 320, y: 120, w: 640, h: 96 };
const TAPE = { x: 180, y: 400, w: 700, h: 34 };
const GATE = { x: 985, y: 400 };
const DEAD = { x: 180, y: 520, w: 700, h: 26 };
const RESTORE = { x: 1070, y: 260 };

const CAM_TOP: CameraState = { ...CAMERA_HOME };
const CAM_TAPE: CameraState = { x: 620, y: 380, k: 1.22 };
const CAM_GATE: CameraState = { x: 745, y: 355, k: 1.12 };
const CAM_FENCE: CameraState = { x: 620, y: 440, k: 1.14 };
const CAM_WIDE: CameraState = { x: 660, y: 340, k: 1.0 };

const PAGES = 8; // committed WAL pages on the tape
const pageX = (i: number) => TAPE.x + 10 + i * ((TAPE.w - 20) / PAGES);
const PAGE_W = (TAPE.w - 20) / PAGES - 8;

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bucketU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  shadowU: ChannelRef<number>;
  ticketU: ChannelRef<number>;
  syncU: ChannelRef<number>;
  gateOpenU: ChannelRef<number>;
  batchU: ChannelRef<number>;
  fenceU: ChannelRef<number>;
  restoreU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TOP, cameraInterp);
  const bucketU = tl.channel('bucketU', 0);
  const tapeU = tl.channel('tapeU', 0); // pages commit onto the tape
  const shadowU = tl.channel('shadowU', 0); // the ltx replica shadow line
  const ticketU = tl.channel('ticketU', 0); // response takes ticket, waits at gate
  const syncU = tl.channel('syncU', 0); // pages fly up to the e3 prefix
  const gateOpenU = tl.channel('gateOpenU', 0); // gate opens, response released
  const batchU = tl.channel('batchU', 0); // two writes, one batched upload
  const fenceU = tl.channel('fenceU', 0); // stale e2 lane below
  const restoreU = tl.channel('restoreU', 0); // restore to a new node
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the promise —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'celld makes a hard promise: an acknowledged write is durable. If the node dies one millisecond after saying yes, the data is already safe.',
  });
  tl.tween(bucketU, 1, { at: t - 6.6, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 2 · the shadowed log —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Every commit to the cell’s SQLite lands in a write-ahead log, and a replica inside the same process shadows that log, page by page.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 6.3, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 0.5, { at: t - 5.6, dur: 2.4, ease: ease.linear });
  tl.tween(shadowU, 1, { at: t - 3.2, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.5);

  // — Beat 3 · the ticket and the gate —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'When your code writes, the response does not leave yet. It takes a numbered ticket and waits at the output gate.',
  });
  tl.tween(cam, CAM_GATE, { at: t - 5.9, dur: 1.3, ease: ease.move });
  tl.tween(ticketU, 1, { at: t - 5.2, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 4 · sync, then release —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'A background sync captures the committed pages and uploads them to the bucket. Only when the upload lands does the gate open and the response leave.',
  });
  tl.tween(syncU, 1, { at: t - 6.4, dur: 3.0, ease: ease.linear });
  tl.tween(gateOpenU, 1, { at: t - 2.8, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 5 · batched tickets —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Concurrent writes to one cell ride a single batched upload. A ticket is credited only if its write committed before the sync began.',
  });
  tl.tween(tapeU, 1, { at: t - 6.2, dur: 1.8, ease: ease.linear });
  tl.tween(batchU, 1, { at: t - 4.2, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 6 · the epoch fence —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'Look at the path the pages take: it carries the cell’s epoch. A stale owner that keeps writing is writing into a dead prefix — fenced by the data path itself.',
  });
  tl.tween(cam, CAM_FENCE, { at: t - 6.7, dur: 1.4, ease: ease.move });
  tl.tween(fenceU, 1, { at: t - 5.8, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 7 · restore elsewhere —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'When the cell wakes somewhere else, its new owner restores the database from the bucket and resumes exactly where the log ends.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.1, dur: 1.4, ease: ease.move });
  tl.tween(restoreU, 1, { at: t - 5.2, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 8 · close —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'The nodes are replaceable. The bucket is the source of truth, and nothing is acknowledged before it is there.',
  });
  tl.tween(dimU, 1, { at: t - 5.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.6, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, bucketU, tapeU, shadowU, ticketU, syncU, gateOpenU, batchU, fenceU, restoreU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function BucketShelf({ u, sync, fence, dim }: { u: number; sync: number; fence: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={(1 - 0.8 * dim) * uu}>
      <rect x={BUCKET.x} y={BUCKET.y} width={BUCKET.w} height={BUCKET.h} rx={14} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={2} />
      <text x={BUCKET.x + 18} y={BUCKET.y + 26} fill={colors.TEAL} fontSize={13} fontWeight={700}>
        the fleet bucket — durable source of truth
      </text>
      <text x={BUCKET.x + 18} y={BUCKET.y + 52} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
        cells/room-7/ltx/e3/ — the live prefix
      </text>
      {fence > 0.3 && (
        <text x={BUCKET.x + 18} y={BUCKET.y + 76} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={(fence - 0.3) * 2}>
          cells/room-7/ltx/e2/ — dead. nobody will ever read it
        </text>
      )}
      {sync > 0.2 && (
        <circle cx={BUCKET.x + 330} cy={BUCKET.y + 47} r={5} fill={colors.POSITIVE} opacity={Math.min(1, sync * 2)} />
      )}
    </g>
  );
}

function WalTape({
  u,
  shadow,
  sync,
  batch,
  dim,
}: {
  u: number;
  shadow: number;
  sync: number;
  batch: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const committed = Math.round(uu * PAGES);
  return (
    <g opacity={1 - 0.85 * dim}>
      <text x={TAPE.x} y={TAPE.y - 42} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
        room-7 · write-ahead log
      </text>
      <text x={TAPE.x} y={TAPE.y - 22} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        local db.sqlite · shadowed by celld_ltx::Db (ltx_repl.rs)
      </text>
      <rect x={TAPE.x} y={TAPE.y} width={TAPE.w} height={TAPE.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      {Array.from({ length: PAGES }, (_, i) => {
        const p = clamp01(uu * PAGES - i);
        if (p <= 0) return null;
        // pages 0..3 upload in the first sync; 4..7 in the batched one
        const flight = i < 4 ? clamp01(sync * 1.4 - i * 0.12) : clamp01(batch * 1.5 - (i - 4) * 0.12);
        const fy = TAPE.y + 6 - flight * (TAPE.y - BUCKET.y - BUCKET.h + 16);
        return (
          <g key={i}>
            <rect x={pageX(i)} y={TAPE.y + 6} width={PAGE_W} height={TAPE.h - 12} rx={4} fill={colors.ACCENT} opacity={0.25 + 0.5 * p} />
            {flight > 0 && flight < 1 && (
              <rect x={pageX(i)} y={fy} width={PAGE_W} height={TAPE.h - 12} rx={4} fill={colors.ACCENT} opacity={0.9} />
            )}
            {flight >= 1 && (
              <rect x={pageX(i)} y={TAPE.y + 6} width={PAGE_W} height={3} fill={colors.POSITIVE} opacity={0.9} />
            )}
          </g>
        );
      })}
      {shadow > 0 && (
        <g opacity={shadow}>
          <line
            x1={TAPE.x}
            y1={TAPE.y + TAPE.h + 12}
            x2={TAPE.x + TAPE.w * clamp01(shadow) * uu}
            y2={TAPE.y + TAPE.h + 12}
            stroke={colors.SECONDARY}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <text x={TAPE.x} y={TAPE.y + TAPE.h + 32} fill={colors.SECONDARY} fontSize={10} fontFamily={MONO}>
            replica shadow — captures committed pages, in process
          </text>
        </g>
      )}
      <text x={TAPE.x + TAPE.w * 0.5} y={TAPE.y - 42} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={committed > 0 ? 0.9 : 0}>
        committed: {committed} pages
      </text>
    </g>
  );
}

function OutputGate({
  ticket,
  open,
  batch,
  dim,
}: {
  ticket: number;
  open: number;
  batch: number;
  dim: number;
}) {
  const tu = clamp01(ticket);
  if (tu <= 0) return null;
  const openU = clamp01(open);
  const barLift = ease.move(openU) * 46;
  // response packet: arrives 0..1 with ticket; after open, exits right
  const arriveX = GATE.x - 150 + 116 * ease.move(tu);
  const exitX = GATE.x + 20 + ease.move(openU) * 200;
  // second ticket rides the batch
  const t2 = clamp01(batch * 1.3 - 0.15);
  return (
    <g opacity={1 - 0.85 * dim}>
      {/* gate posts + bar */}
      <line x1={GATE.x} y1={GATE.y - 52} x2={GATE.x} y2={GATE.y + 30} stroke={colors.GRID} strokeWidth={3} />
      <rect x={GATE.x - 5} y={GATE.y - 40 - barLift} width={10} height={64} rx={5} fill={openU > 0.5 ? colors.POSITIVE : colors.WARM} />
      <text x={GATE.x} y={GATE.y + 52} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
        output gate · js.rs
      </text>
      {/* the waiting / released response */}
      {openU < 0.4 ? (
        <g transform={`translate(${arriveX}, ${GATE.y - 10})`}>
          <rect x={-52} y={-14} width={104} height={28} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
            resp · ticket 7
          </text>
        </g>
      ) : (
        <g transform={`translate(${exitX}, ${GATE.y - 10})`} opacity={Math.max(0, 1 - (exitX - GATE.x - 120) / 90)}>
          <rect x={-52} y={-14} width={104} height={28} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
            acknowledged
          </text>
        </g>
      )}
      {tu > 0.6 && openU < 0.4 && (
        <text x={GATE.x - 86} y={GATE.y - 42} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
          waits: synced_seq ≥ 7
        </text>
      )}
      {/* batched second ticket */}
      {t2 > 0 && (
        <g transform={`translate(${GATE.x - 64}, ${GATE.y + 26})`} opacity={t2 < 0.75 ? Math.min(1, t2 * 4) : (1 - t2) * 4}>
          <rect x={-52} y={-13} width={104} height={26} rx={13} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
            resp · ticket 8
          </text>
        </g>
      )}
      {batch > 0.8 && (
        <text x={GATE.x - 20} y={GATE.y + 74} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO} opacity={(batch - 0.8) * 5}>
          two tickets · one upload
        </text>
      )}
    </g>
  );
}

function DeadLane({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const pu = clamp01(uu * 1.6 - 0.4); // a page tries to sync and dies
  return (
    <g opacity={(1 - 0.85 * dim) * Math.min(1, uu * 3)}>
      <rect x={DEAD.x} y={DEAD.y} width={DEAD.w} height={DEAD.h} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="5 6" opacity={0.7} />
      <text x={DEAD.x} y={DEAD.y - 10} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} opacity={0.85}>
        stale owner · still epoch 2 · writes go to cells/room-7/ltx/e2/
      </text>
      {Array.from({ length: 4 }, (_, i) => {
        const p = clamp01(uu * 3 - i * 0.5);
        if (p <= 0) return null;
        return (
          <rect key={i} x={DEAD.x + 12 + i * 60} y={DEAD.y + 5} width={44} height={DEAD.h - 10} rx={3} fill={colors.NEGATIVE} opacity={0.22 * p} />
        );
      })}
      {pu > 0 && (
        <text x={DEAD.x + DEAD.w - 8} y={DEAD.y + 18} textAnchor="end" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} opacity={Math.min(1, pu * 3)}>
          a dead prefix — the fence is the path
        </text>
      )}
    </g>
  );
}

function RestoreFlow({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const p = ease.move(clamp01(uu * 1.3));
  const x = BUCKET.x + BUCKET.w - 40 + (RESTORE.x - (BUCKET.x + BUCKET.w - 40)) * p;
  const y = BUCKET.y + 60 + (RESTORE.y - BUCKET.y - 60) * p;
  return (
    <g opacity={1 - 0.85 * dim}>
      <g opacity={Math.min(1, uu * 3)}>
        <rect x={RESTORE.x - 62} y={RESTORE.y + 24} width={124} height={54} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
        <text x={RESTORE.x} y={RESTORE.y + 46} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontWeight={700}>
          new owner
        </text>
        <text x={RESTORE.x} y={RESTORE.y + 66} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
          restore → resume · e4
        </text>
      </g>
      {p > 0 && p < 1 && (
        <g transform={`translate(${x}, ${y})`}>
          <rect x={-30} y={-12} width={60} height={24} rx={5} fill={colors.ACCENT} opacity={0.9} />
          <text y={4} textAnchor="middle" fill={colors.BG} fontSize={9.5} fontFamily={MONO}>
            db pages
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
      <rect x={-350} y={-88} width={700} height={176} rx={18} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.7} />
      <text y={-40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        Durable before acknowledged.
      </text>
      <text y={-2} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
        write → ticket → upload lands → gate opens → response
      </text>
      <text y={30} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
        cells/room-7/ltx/e3/ — the epoch in the path is the fence
      </text>
      <text y={61} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        lose any node · every acknowledged write survives
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <BucketShelf u={s.get(scene.bucketU)} sync={s.get(scene.syncU)} fence={s.get(scene.fenceU)} dim={dim} />
        <WalTape
          u={s.get(scene.tapeU)}
          shadow={s.get(scene.shadowU)}
          sync={s.get(scene.syncU)}
          batch={s.get(scene.batchU)}
          dim={dim}
        />
        <OutputGate ticket={s.get(scene.ticketU)} open={s.get(scene.gateOpenU)} batch={s.get(scene.batchU)} dim={dim} />
        <DeadLane u={s.get(scene.fenceU)} dim={dim} />
        <RestoreFlow u={s.get(scene.restoreU)} dim={dim} />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
