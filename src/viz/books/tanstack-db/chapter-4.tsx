// Loading from Your API — query collections and the sync pump
//
// Backed by: docs/collections/query-collection.md and packages/
// query-db-collection/src/query.ts (queryCollectionOptions: queryKey, queryFn,
// queryClient, getKey; a QueryObserver per hashed key; applySuccessfulResult
// diffs the fetched array against collection._state.syncedData and emits
// write({type:'insert'|'update'|'delete'}) inside begin()/commit(), then
// markReady(); utils.refetch confirms optimistic writes; deferDataRefresh
// holds stale in-flight results while a write is pending), packages/db/src/
// collection/sync.ts (the begin/write/commit/markReady protocol every adapter
// speaks), and docs/collections/* for the adapter roster. ONE machine: the
// sync pump — a fetched snapshot tray scanned row by row against the store,
// leaking only deltas.
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
import { Packet, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SERVER = { x: 1118, y: 118 } as const;

const CFG = { x: 70, y: 74, w: 360, h: 128 } as const;
const CFG_LINES = [
  "queryCollectionOptions({",
  "  queryKey: ['todos'],",
  '  queryFn: () => fetch(…).json(),',
  '  getKey: (item) => item.id,',
  '})',
];

// The snapshot tray (what the fetch returned).
const TRAY = { x: 782, y0: 236, w: 168, rowH: 34 } as const;
// The tray's six rows and what the diff will decide about each.
type Verdict = 'same' | 'update' | 'insert';
const TRAY_ROWS: Array<{ label: string; verdict: Verdict }> = [
  { label: 'todo 1', verdict: 'same' },
  { label: 'todo 2', verdict: 'same' },
  { label: 'todo 3 *', verdict: 'update' },
  { label: 'todo 4', verdict: 'same' },
  { label: 'todo 5', verdict: 'same' },
  { label: 'todo 7 +', verdict: 'insert' },
];
// The synced store also holds todo 6, which the snapshot no longer contains.

const DIFF = { x: 566, y: 330, w: 158, h: 84 } as const;

// The collection plane (single, flat — this chapter is about the base).
const PLANE = { x: 96, y: 288, w: 306, h: 168 } as const;
const planeSlot = (i: number) => ({
  x: PLANE.x + 20 + (i % 3) * 96,
  y: PLANE.y + 26 + Math.floor(i / 3) * 52,
});
// A thin optimistic strip above the plane (the write-path beat).
const STRIP = { x: PLANE.x, y: 226, w: PLANE.w, h: 40 } as const;

// The refresh gate on the server → tray path.
const GATE_X = 968;

// The adapter shelf.
const SHELF_Y = 540;
const ADAPTERS = ['query', 'electric', 'trailbase', 'rxdb', 'powersync', 'local storage', 'local only'];

const CAM_CFG: CameraState = { x: 420, y: 220, k: 1.3 };
const CAM_DIFF: CameraState = { x: 620, y: 340, k: 1.32 };
const CAM_WRITE: CameraState = { x: 520, y: 260, k: 1.3 };
const CAM_SHELF: CameraState = { x: 640, y: 470, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  srvU: ChannelRef<number>;
  planeU: ChannelRef<number>;
  cfgU: ChannelRef<number>;
  fetchU: ChannelRef<number>;
  trayU: ChannelRef<number>;
  diffU: ChannelRef<number>;
  scanU: ChannelRef<number>;
  dUpd: ChannelRef<number>;
  dIns: ChannelRef<number>;
  dDel: ChannelRef<number>;
  wInsU: ChannelRef<number>;
  wReqU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  gateOpenU: ChannelRef<number>;
  refetchU: ChannelRef<number>;
  confirmU: ChannelRef<number>;
  shelfU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const srvU = tl.channel('srvU', 0);
  const planeU = tl.channel('planeU', 0); // the collection + its six rows
  const cfgU = tl.channel('cfgU', 0); // config code lines
  const fetchU = tl.channel('fetchU', 0); // queryFn round trip
  const trayU = tl.channel('trayU', 0); // snapshot rows stagger in
  const diffU = tl.channel('diffU', 0); // the differ box
  const scanU = tl.channel('scanU', 0); // 0..6 sweep over the tray
  const dUpd = tl.channel('dUpd', 0); // update delta flight
  const dIns = tl.channel('dIns', 0); // insert delta flight
  const dDel = tl.channel('dDel', 0); // delete marker on todo 6
  const wInsU = tl.channel('wInsU', 0); // write: chip lands on the strip
  const wReqU = tl.channel('wReqU', 0); // write: post to backend
  const gateU = tl.channel('gateU', 0); // the deferDataRefresh gate + held chip
  const gateOpenU = tl.channel('gateOpenU', 0); // gate opens, held chip proceeds
  const refetchU = tl.channel('refetchU', 0); // confirming refetch
  const confirmU = tl.channel('confirmU', 0); // optimistic chip retires
  const shelfU = tl.channel('shelfU', 0); // adapter shelf
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Collections do not invent data — they sync it. And the plainest place to sync from is the backend you already have.',
  });
  tl.tween(planeU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(srvU, 1, { at: 2.0, dur: 0.8, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the config —
  tl.caption({
    at: 7.0,
    dur: 7.0,
    text: 'You describe the source once: a query key, a fetch function, and how to pull a key out of each row. Tan Stack Query does the fetching; the collection does the rest.',
  });
  tl.tween(cam, CAM_CFG, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(cfgU, CFG_LINES.length, { at: 7.8, dur: 1.8, ease: ease.enter });
  tl.hold(14.0, 0.5);

  // — Beat 3 · the snapshot —
  tl.caption({
    at: 14.5,
    dur: 5.5,
    text: 'When the fetch lands you get a plain array back — a snapshot of the truth as the server sees it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.7, dur: 1.3, ease: ease.move });
  tl.tween(fetchU, 1, { at: 15.2, dur: 1.8, ease: ease.linear });
  tl.tween(trayU, TRAY_ROWS.length, { at: 16.8, dur: 1.6, ease: ease.enter });
  tl.hold(20.0, 0.5);

  // — Beat 4 · don't replace, diff —
  tl.caption({
    at: 20.5,
    dur: 6.0,
    text: 'Here is the clever part: the collection does not replace its contents. It runs a diff — every incoming row is compared against the synced store.',
  });
  tl.tween(cam, CAM_DIFF, { at: 20.7, dur: 1.4, ease: ease.move });
  tl.tween(diffU, 1, { at: 21.4, dur: 0.8, ease: ease.enter });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the verdicts —
  tl.caption({
    at: 27.0,
    dur: 8.0,
    text: 'Unchanged rows pass through in silence. A changed row becomes an update. A brand new row becomes an insert. And a row that stopped coming back becomes a delete.',
  });
  tl.tween(scanU, TRAY_ROWS.length, { at: 27.4, dur: 4.6, ease: ease.linear });
  tl.tween(dUpd, 1, { at: 29.6, dur: 1.1, ease: ease.linear });
  tl.tween(dIns, 1, { at: 31.8, dur: 1.1, ease: ease.linear });
  tl.tween(dDel, 1, { at: 33.2, dur: 0.9, ease: ease.enter });
  tl.hold(35.0, 0.5);

  // — Beat 6 · only deltas move —
  tl.caption({
    at: 35.5,
    dur: 6.5,
    text: 'Only those deltas enter the store, so only those deltas ride the live query pipelines to your screens. A refetch that changes nothing repaints nothing.',
  });
  tl.hold(42.0, 0.5);

  // — Beat 7 · the write path —
  tl.caption({
    at: 42.5,
    dur: 6.5,
    text: 'Writes run the same loop in reverse. Your insert lands in the optimistic layer instantly, and the insert handler posts it to the backend.',
  });
  tl.tween(cam, CAM_WRITE, { at: 42.7, dur: 1.4, ease: ease.move });
  tl.tween(wInsU, 1, { at: 43.6, dur: 0.7, ease: ease.pop });
  tl.tween(wReqU, 1, { at: 44.8, dur: 2.0, ease: ease.linear });
  tl.hold(49.0, 0.5);

  // — Beat 8 · refetch confirms —
  tl.caption({
    at: 49.5,
    dur: 6.5,
    text: 'Then the handler refetches. The fresh snapshot contains your row, the diff writes it into synced truth, and the optimistic copy retires.',
  });
  tl.tween(refetchU, 1, { at: 50.4, dur: 1.8, ease: ease.linear });
  tl.tween(confirmU, 1, { at: 52.6, dur: 1.0, ease: ease.move });
  tl.hold(56.0, 0.5);

  // — Beat 9 · the gate —
  tl.caption({
    at: 56.5,
    dur: 7.0,
    text: 'One guard makes this safe: while a write is still in flight, incoming refreshes wait at a gate. A stale snapshot never gets to wipe out your optimism.',
  });
  tl.tween(gateU, 1, { at: 57.4, dur: 0.8, ease: ease.enter });
  tl.tween(gateOpenU, 1, { at: 61.6, dur: 1.2, ease: ease.move });
  tl.hold(63.5, 0.5);

  // — Beat 10 · the adapter shelf —
  tl.caption({
    at: 64.0,
    dur: 7.5,
    text: 'And this whole loading strategy is a plug. Swap it for a real-time sync engine, a local database, or plain browser storage — the collection interface never changes.',
  });
  tl.tween(cam, CAM_SHELF, { at: 64.2, dur: 1.4, ease: ease.move });
  tl.tween(shelfU, ADAPTERS.length, { at: 65.0, dur: 2.2, ease: ease.enter });
  tl.hold(71.5, 0.5);

  // — Beat 11 · close —
  tl.caption({
    at: 72.0,
    dur: 6.5,
    text: 'Load from what you have today, and upgrade the plumbing when you need to. Your queries and your writes never have to care.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 72.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.0, dur: 1.3, ease: ease.move });
  tl.hold(78.5, 1.4);

  return {
    tl,
    cam,
    srvU,
    planeU,
    cfgU,
    fetchU,
    trayU,
    diffU,
    scanU,
    dUpd,
    dIns,
    dDel,
    wInsU,
    wReqU,
    gateU,
    gateOpenU,
    refetchU,
    confirmU,
    shelfU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const VERDICT_COLOR: Record<Verdict, string> = {
  same: colors.MUTED,
  update: colors.WARM,
  insert: colors.POSITIVE,
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srvU = s.get(scene.srvU);
  const planeU = s.get(scene.planeU);
  const cfgU = s.get(scene.cfgU);
  const fetchU = s.get(scene.fetchU);
  const trayU = s.get(scene.trayU);
  const diffU = s.get(scene.diffU);
  const scanU = s.get(scene.scanU);
  const dUpd = s.get(scene.dUpd);
  const dIns = s.get(scene.dIns);
  const dDel = s.get(scene.dDel);
  const wInsU = s.get(scene.wInsU);
  const wReqU = s.get(scene.wReqU);
  const gateU = s.get(scene.gateU);
  const gateOpenU = s.get(scene.gateOpenU);
  const refetchU = s.get(scene.refetchU);
  const confirmU = s.get(scene.confirmU);
  const shelfU = s.get(scene.shelfU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const diffCx = DIFF.x + DIFF.w / 2;
  const diffCy = DIFF.y + DIFF.h / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- backend ---- */}
        <g opacity={dimAll}>
          <ServiceNode x={SERVER.x} y={SERVER.y} kind="server" label="your backend" sublabel="GET /api/todos" w={158} u={srvU} />
        </g>

        {/* ---- config card ---- */}
        <g opacity={dimAll * clamp01(cfgU)}>
          <rect x={CFG.x} y={CFG.y} width={CFG.w} height={CFG.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          {CFG_LINES.map((line, i) => (
            <text key={i} x={CFG.x + 18} y={CFG.y + 30 + i * 20} fill={i === 0 || i === CFG_LINES.length - 1 ? colors.ACCENT : colors.TEXT} fontSize={12} fontFamily="ui-monospace, monospace" opacity={clamp01(cfgU - i)}>
              {line}
            </text>
          ))}
        </g>

        {/* ---- the collection plane ---- */}
        <g opacity={dimAll * planeU}>
          <rect x={PLANE.x} y={PLANE.y} width={PLANE.w} height={PLANE.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
          <text x={PLANE.x + 6} y={PLANE.y + PLANE.h + 22} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
            syncedData — the synced store
          </text>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const p = planeSlot(i);
            // todo 6 (index 5) gets tombstoned by the delete delta
            const gone = i === 5 ? dDel : 0;
            // todo 3 (index 2) re-colors when the update lands
            const updated = i === 2 && dUpd >= 1;
            return (
              <g key={i} opacity={clamp01(planeU * 6 - i) * (1 - gone * 0.75)}>
                <rect x={p.x} y={p.y} width={84} height={30} rx={7} fill={colors.BG} stroke={updated ? colors.WARM : gone > 0.3 ? colors.NEGATIVE : colors.GRID} strokeWidth={updated || gone > 0.3 ? 1.6 : 1.1} strokeDasharray={gone > 0.3 ? '4 3' : undefined} />
                <text x={p.x + 42} y={p.y + 19} textAnchor="middle" fill={gone > 0.3 ? colors.NEGATIVE : colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {i === 2 && updated ? 'todo 3 *' : `todo ${i + 1}`}
                </text>
              </g>
            );
          })}
          {/* the freshly inserted row from the diff */}
          {dIns >= 1 && (
            <g>
              <rect x={PLANE.x + 20} y={PLANE.y + 130} width={84} height={30} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={PLANE.x + 62} y={PLANE.y + 149} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
                todo 7 +
              </text>
            </g>
          )}
          {/* the write-path row arriving as synced truth */}
          {refetchU >= 1 && (
            <g opacity={confirmU}>
              <rect x={PLANE.x + 20 + 96} y={PLANE.y + 26 + 104} width={84} height={30} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={PLANE.x + 62 + 96} y={PLANE.y + 45 + 104} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
                todo 8 ✓
              </text>
            </g>
          )}
        </g>

        {/* ---- the optimistic strip (write path) ---- */}
        <g opacity={dimAll * clamp01(wInsU * 1.6)}>
          <rect x={STRIP.x} y={STRIP.y} width={STRIP.w} height={STRIP.h} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} opacity={0.75} />
          <text x={STRIP.x + 6} y={STRIP.y - 8} fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, monospace">
            optimistic layer
          </text>
          <g opacity={wInsU * (1 - confirmU)}>
            <rect x={STRIP.x + 110} y={STRIP.y + 6} width={84} height={28} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={STRIP.x + 152} y={STRIP.y + 24} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
              todo 8
            </text>
          </g>
        </g>

        {/* ---- fetch round trips ---- */}
        {fetchU > 0 && fetchU < 1 && (
          <RequestFlow
            path={[
              { x: DIFF.x + DIFF.w, y: DIFF.y - 40 },
              { x: SERVER.x - 79, y: SERVER.y },
            ]}
            u={fetchU}
            roundTrip
            color={colors.ACCENT}
            responseColor={colors.POSITIVE}
            r={6}
            label="queryFn"
            responseLabel="the snapshot"
          />
        )}
        {wReqU > 0 && wReqU < 1 && (
          <RequestFlow
            path={[
              { x: STRIP.x + STRIP.w, y: STRIP.y + 20 },
              { x: SERVER.x - 79, y: SERVER.y + 16 },
            ]}
            u={wReqU}
            roundTrip
            color={colors.WARM}
            responseColor={colors.POSITIVE}
            r={6}
            label="onInsert → post"
          />
        )}
        {refetchU > 0 && refetchU < 1 && (
          <RequestFlow
            path={[
              { x: DIFF.x + DIFF.w, y: DIFF.y - 40 },
              { x: SERVER.x - 79, y: SERVER.y },
            ]}
            u={refetchU}
            roundTrip
            color={colors.POSITIVE}
            r={5}
            label="refetch"
          />
        )}

        {/* ---- snapshot tray ---- */}
        <g opacity={dimAll}>
          {trayU > 0.02 && (
            <text x={TRAY.x + TRAY.w / 2} y={TRAY.y0 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} opacity={clamp01(trayU)}>
              the snapshot — a plain array
            </text>
          )}
          {TRAY_ROWS.map((r, i) => {
            const u = clamp01(trayU - i);
            const scanned = scanU > i + 0.9;
            const active = scanU > i && scanU <= i + 0.9;
            const c = scanned ? VERDICT_COLOR[r.verdict] : colors.GRID;
            const faded = scanned && r.verdict === 'same' ? 0.35 : 1;
            return (
              <g key={i} opacity={u * faded}>
                <rect x={TRAY.x} y={TRAY.y0 + i * TRAY.rowH} width={TRAY.w} height={TRAY.rowH - 7} rx={7} fill={colors.PANEL} stroke={active ? colors.ACCENT : c} strokeWidth={active ? 1.8 : 1.2} />
                <text x={TRAY.x + 14} y={TRAY.y0 + i * TRAY.rowH + 18} fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
                  {r.label}
                </text>
                {scanned && r.verdict !== 'same' && (
                  <text x={TRAY.x + TRAY.w - 12} y={TRAY.y0 + i * TRAY.rowH + 18} textAnchor="end" fill={c} fontSize={10} fontFamily="ui-monospace, monospace">
                    {r.verdict}
                  </text>
                )}
              </g>
            );
          })}
          {scanU >= TRAY_ROWS.length && dDel > 0.02 && (
            <text x={TRAY.x + TRAY.w / 2} y={TRAY.y0 + TRAY_ROWS.length * TRAY.rowH + 12} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace" opacity={dDel}>
              todo 6 missing → delete
            </text>
          )}
        </g>

        {/* ---- the differ ---- */}
        <g opacity={diffU * dimAll}>
          <rect x={DIFF.x} y={DIFF.y} width={DIFF.w} height={DIFF.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={diffCx} y={diffCy - 8} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
            the diff
          </text>
          <text x={diffCx} y={diffCy + 12} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
            snapshot vs synced store
          </text>
          <line x1={TRAY.x - 6} y1={TRAY.y0 + 90} x2={DIFF.x + DIFF.w + 4} y2={diffCy} stroke={colors.GRID} strokeWidth={1.2} opacity={0.9} />
          <line x1={DIFF.x - 4} y1={diffCy} x2={PLANE.x + PLANE.w + 6} y2={PLANE.y + 80} stroke={colors.GRID} strokeWidth={1.2} opacity={0.9} />
          <text x={diffCx} y={DIFF.y + DIFF.h + 20} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
            begin · write · commit
          </text>
        </g>

        {/* ---- delta flights differ → plane ---- */}
        <Packet from={{ x: diffCx - DIFF.w / 2, y: diffCy }} to={{ x: planeSlot(2).x + 42, y: planeSlot(2).y + 15 }} u={dUpd} r={7} color={colors.WARM} label="update" />
        <Packet from={{ x: diffCx - DIFF.w / 2, y: diffCy }} to={{ x: PLANE.x + 62, y: PLANE.y + 145 }} u={dIns} r={7} color={colors.POSITIVE} label="insert" />

        {/* ---- the deferDataRefresh gate ---- */}
        <g opacity={gateU * dimAll}>
          <line x1={GATE_X} y1={SERVER.y + 44} x2={GATE_X} y2={SERVER.y + 124} stroke={colors.NEGATIVE} strokeWidth={2.4} strokeDasharray={gateOpenU > 0.3 ? '2 10' : undefined} opacity={1 - gateOpenU * 0.7} />
          <text x={GATE_X} y={SERVER.y + 144} textAnchor="middle" fill={gateOpenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={10} fontFamily="ui-monospace, monospace">
            deferDataRefresh
          </text>
          {/* the held snapshot chip */}
          <g opacity={1 - gateOpenU}>
            <rect x={GATE_X + 14} y={SERVER.y + 72} width={92} height={26} rx={7} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} />
            <text x={GATE_X + 60} y={SERVER.y + 89} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              stale refresh
            </text>
          </g>
          <g opacity={gateOpenU > 0.02 ? gateOpenU : 0}>
            <rect x={lerp(GATE_X + 14, GATE_X - 150, gateOpenU)} y={SERVER.y + 72} width={92} height={26} rx={7} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={lerp(GATE_X + 60, GATE_X - 104, gateOpenU)} y={SERVER.y + 89} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily="ui-monospace, monospace">
              fresh again
            </text>
          </g>
        </g>

        {/* ---- adapter shelf ---- */}
        <g opacity={dimAll}>
          {shelfU > 0.02 && (
            <text x={640} y={SHELF_Y - 16} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} opacity={clamp01(shelfU)}>
              same collection, different sync engine
            </text>
          )}
          {ADAPTERS.map((a, i) => {
            const u = clamp01(shelfU - i);
            const x = 106 + i * 154;
            return (
              <g key={a} opacity={u}>
                <rect x={x} y={SHELF_Y} width={142} height={46} rx={9} fill={colors.PANEL} stroke={i === 0 ? colors.ACCENT : i === 1 ? colors.POSITIVE : colors.GRID} strokeWidth={i <= 1 ? 1.5 : 1.1} />
                <text x={x + 71} y={SHELF_Y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                  {a}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- quiet closing panel ---- */}
        <g opacity={closeU}>
          <rect x={310} y={215} width={660} height={225} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            sync is a diff, not a download
          </text>
          <text x={640} y={306} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            fetch a snapshot · diff it against synced truth · apply only deltas
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            writes post to your backend, then a refetch confirms them
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            the loader is a plug — swap it without touching queries
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            @tanstack/query-db-collection · begin/write/commit · markReady
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
