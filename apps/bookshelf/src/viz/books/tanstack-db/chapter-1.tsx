// The Waterfall Problem — why your app needs a client store
//
// Backed by: README.md / docs/overview.md ("Avoid endpoint sprawl and network
// waterfalls by loading data into normalized collections", "sub-millisecond
// live queries", "take the network off the interaction path") and
// examples/react/todo/src/api/server.ts (the real Express endpoints:
// /api/health, /api/todos, /api/todos/:id, /api/config). The chapter is ONE
// machine: an app's component tree on the left, its backend on the right, and
// a request-timing waterfall between them. We watch the waterfall cascade,
// then watch it collapse when normalized collections land in the middle.
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
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — component tree (left), backend (right), waterfall panel (center).
// ---------------------------------------------------------------------------

const APP = { x: 235, y: 118, w: 110, h: 42 } as const;
const COMPONENTS = [
  { x: 118, y: 232, label: 'list' },
  { x: 238, y: 232, label: 'filters' },
  { x: 358, y: 232, label: 'stats' },
] as const;
const COMP_W = 100;
const COMP_H = 40;

const SERVER = { x: 1128, y: 168 } as const;

// The real routes from examples/react/todo/src/api/server.ts — the sprawl comb.
const ROUTES = ['/api/health', '/api/todos', '/api/todos/:id', '/api/config'];

// Waterfall panel: a time axis 0..900ms and the serial request chain.
const WF = { x: 480, y: 318, w: 520, h: 230 } as const;
const T_SCALE = (ms: number): number => WF.x + 60 + (ms / 900) * (WF.w - 90);
const WF_ROW_H = 44;
// The serial chain: filters need config first, the list needs todos, the
// stats re-fetch the same todos. Three round trips, one behind the other.
const WF_BARS = [
  { label: 'GET /api/config', from: 0, to: 230, who: 1 },
  { label: 'GET /api/todos', from: 230, to: 560, who: 0 },
  { label: 'GET /api/todos', from: 560, to: 880, who: 2 },
] as const;

// The store that lands between components and network in the flip.
const STORE = { x: 540, y: 84, w: 330, h: 172 } as const;
const COLL_TODOS = { x: 625, y: 178 } as const;
const COLL_CONFIG = { x: 788, y: 178 } as const;

const CAM_WF: CameraState = { x: 742, y: 420, k: 1.42 };
const CAM_STORE: CameraState = { x: 700, y: 190, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  treeU: ChannelRef<number>;
  serverU: ChannelRef<number>;
  wfU: ChannelRef<number>;
  req: ChannelRef<number>[];
  totalU: ChannelRef<number>;
  dupU: ChannelRef<number>;
  sprawlU: ChannelRef<number>;
  netDim: ChannelRef<number>;
  storeU: ChannelRef<number>;
  bulkU: ChannelRef<number>;
  localU: ChannelRef<number>;
  chartK: ChannelRef<number>;
  writeU: ChannelRef<number>;
  writeSyncU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const treeU = tl.channel('treeU', 0); // component tree draw-on
  const serverU = tl.channel('serverU', 0); // backend node
  const wfU = tl.channel('wfU', 0); // waterfall panel reveal
  const req = [0, 1, 2].map((i) => tl.channel(`req${i}`, 0)); // round trips
  const totalU = tl.channel('totalU', 0); // "~900 ms" chip
  const dupU = tl.channel('dupU', 0); // duplicate-fetch highlight
  const sprawlU = tl.channel('sprawlU', 0); // route comb on the server
  const netDim = tl.channel('netDim', 0); // dim the old request edges
  const storeU = tl.channel('storeU', 0); // the client store zone
  const bulkU = tl.channel('bulkU', 0); // one bulk load flow
  const localU = tl.channel('localU', 0); // instant local reads
  const chartK = tl.channel('chartK', 0); // waterfall panel: before → after
  const writeU = tl.channel('writeU', 0); // teaser: a write lands instantly
  const writeSyncU = tl.channel('writeSyncU', 0); // …and syncs behind the scenes
  const closeU = tl.channel('closeU', 0); // quiet closing panel

  // — Beat 1 · the app —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Here is an ordinary app: a list, some filters, a few stats. It feels fast everywhere — right up until it needs data.',
  });
  tl.tween(treeU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(serverU, 1, { at: 2.6, dur: 0.8, ease: ease.enter });
  tl.hold(7.0, 0.5);

  // — Beat 2 · every component fetches for itself —
  tl.caption({
    at: 7.5,
    dur: 7.5,
    text: 'Each component fetches for itself. The filters wait on the config, the list waits on the filters, the stats wait on both. Requests queue up behind requests.',
  });
  tl.tween(wfU, 1, { at: 7.7, dur: 1.0, ease: ease.enter });
  tl.tween(req[0], 1, { at: 8.4, dur: 1.8, ease: ease.linear });
  tl.tween(req[1], 1, { at: 10.4, dur: 2.2, ease: ease.linear });
  tl.tween(req[2], 1, { at: 12.8, dur: 2.2, ease: ease.linear });
  tl.hold(15.0, 0.4);

  // — Beat 3 · the waterfall has a name —
  tl.caption({
    at: 15.4,
    dur: 6.5,
    text: 'That staircase has a name: a network waterfall. Every step is a full round trip your user sits through before the screen settles.',
  });
  tl.tween(cam, CAM_WF, { at: 15.6, dur: 1.4, ease: ease.move });
  tl.tween(totalU, 1, { at: 18.6, dur: 0.5, ease: ease.pop });
  tl.hold(21.9, 0.5);

  // — Beat 4 · the quiet duplicate —
  tl.caption({
    at: 22.4,
    dur: 6.0,
    text: 'And it gets worse quietly: two of those components want the same rows, so the same data crosses the wire twice.',
  });
  tl.tween(dupU, 1, { at: 23.2, dur: 0.7, ease: ease.enter });
  tl.hold(28.4, 0.5);

  // — Beat 5 · endpoint sprawl —
  tl.caption({
    at: 28.9,
    dur: 7.0,
    text: 'Meanwhile the backend grows a bespoke endpoint for every screen. That is endpoint sprawl — more routes to maintain, and each one still ends in another waterfall.',
  });
  tl.tween(cam, CAM_WIDE, { at: 29.1, dur: 1.4, ease: ease.move });
  tl.tween(sprawlU, 1, { at: 30.2, dur: 1.6, ease: ease.enter });
  tl.hold(35.9, 0.5);

  // — Beat 6 · the bet —
  tl.caption({
    at: 36.4,
    dur: 6.0,
    text: 'Tan Stack makes a different bet: put a real client store between your components and the network, and let both sides talk to it instead.',
  });
  tl.tween(netDim, 1, { at: 36.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_STORE, { at: 36.8, dur: 1.5, ease: ease.move });
  tl.tween(storeU, 1, { at: 37.6, dur: 1.2, ease: ease.enter });
  tl.hold(42.4, 0.5);

  // — Beat 7 · load once, normalized —
  tl.caption({
    at: 42.9,
    dur: 6.5,
    text: 'You load data once, in bulk, into normalized collections. Here that means two of them: the todos, and the config.',
  });
  tl.tween(bulkU, 1, { at: 44.0, dur: 2.4, ease: ease.linear });
  tl.hold(49.4, 0.5);

  // — Beat 8 · reads go local —
  tl.caption({
    at: 49.9,
    dur: 7.0,
    text: 'Now the components stop fetching. They query the store, and the store answers from memory in under a millisecond — no network anywhere on that path.',
  });
  tl.tween(localU, 1, { at: 50.7, dur: 1.8, ease: ease.enter });
  tl.hold(56.9, 0.5);

  // — Beat 9 · the waterfall collapses —
  tl.caption({
    at: 57.4,
    dur: 6.5,
    text: 'Look at the timing chart again. The whole staircase collapses into one bulk load up front, and instant local reads ever after.',
  });
  tl.tween(cam, CAM_WF, { at: 57.6, dur: 1.4, ease: ease.move });
  tl.tween(chartK, 1, { at: 58.6, dur: 1.2, ease: ease.move });
  tl.hold(63.9, 0.5);

  // — Beat 10 · the write teaser —
  tl.caption({
    at: 64.4,
    dur: 7.0,
    text: 'Writes get the same treatment: they land in the store instantly, and the store syncs them to your backend behind the scenes. That trick has its own chapter.',
  });
  tl.tween(cam, CAM_STORE, { at: 64.6, dur: 1.4, ease: ease.move });
  tl.tween(writeU, 1, { at: 66.0, dur: 0.9, ease: ease.linear });
  tl.tween(writeSyncU, 1, { at: 67.4, dur: 2.6, ease: ease.linear });
  tl.hold(71.4, 0.5);

  // — Beat 11 · quiet close —
  tl.caption({
    at: 71.9,
    dur: 7.5,
    text: 'One store, loaded once, queried locally, synced in the background. Hold that shape — the rest of this book is the machinery that makes it safe.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 72.1, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.0, dur: 1.3, ease: ease.move });
  tl.hold(79.4, 1.4);

  return {
    tl,
    cam,
    treeU,
    serverU,
    wfU,
    req,
    totalU,
    dupU,
    sprawlU,
    netDim,
    storeU,
    bulkU,
    localU,
    chartK,
    writeU,
    writeSyncU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of sampled channels.
// ---------------------------------------------------------------------------

function ComponentBox({ x, y, label, u, hot }: { x: number; y: number; label: string; u: number; hot: number }) {
  return (
    <g opacity={u}>
      <rect
        x={x - COMP_W / 2}
        y={y - COMP_H / 2}
        width={COMP_W}
        height={COMP_H}
        rx={8}
        fill={colors.PANEL}
        stroke={hot > 0.02 ? colors.ACCENT : colors.GRID}
        strokeWidth={hot > 0.02 ? 1.8 : 1.2}
      />
      <text x={x} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const treeU = s.get(scene.treeU);
  const serverU = s.get(scene.serverU);
  const wfU = s.get(scene.wfU);
  const req = scene.req.map((c) => s.get(c));
  const totalU = s.get(scene.totalU);
  const dupU = s.get(scene.dupU);
  const sprawlU = s.get(scene.sprawlU);
  const netDim = s.get(scene.netDim);
  const storeU = s.get(scene.storeU);
  const bulkU = s.get(scene.bulkU);
  const localU = s.get(scene.localU);
  const chartK = s.get(scene.chartK);
  const writeU = s.get(scene.writeU);
  const writeSyncU = s.get(scene.writeSyncU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const oldNet = (1 - netDim * 0.88) * dimAll; // the fetch-for-yourself era
  const beforeChart = (1 - chartK) * dimAll;
  const afterChart = chartK * dimAll;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- component tree ---- */}
        <g opacity={dimAll}>
          <g opacity={treeU}>
            <rect x={APP.x - APP.w / 2} y={APP.y - APP.h / 2} width={APP.w} height={APP.h} rx={9} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.3} />
            <text x={APP.x} y={APP.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              the app
            </text>
            {COMPONENTS.map((c, i) => (
              <line
                key={i}
                x1={APP.x}
                y1={APP.y + APP.h / 2}
                x2={c.x}
                y2={c.y - COMP_H / 2}
                stroke={colors.GRID}
                strokeWidth={1.2}
                opacity={0.9}
              />
            ))}
          </g>
          {COMPONENTS.map((c, i) => {
            const appear = clamp01(treeU * 2 - 0.5 - i * 0.2);
            // which bar is in flight right now, lighting its owner
            const hot = WF_BARS.reduce((h, b, k) => (b.who === i && req[k] > 0.02 && req[k] < 1 ? 1 : h), 0);
            return <ComponentBox key={i} x={c.x} y={c.y} label={c.label} u={appear} hot={hot * oldNet} />;
          })}
        </g>

        {/* ---- the backend ---- */}
        <g opacity={dimAll}>
          <ServiceNode x={SERVER.x} y={SERVER.y} kind="server" label="your backend" sublabel="Express + Postgres" w={158} u={serverU} />
          {/* endpoint sprawl comb */}
          <g opacity={sprawlU}>
            {ROUTES.map((r, i) => {
              const y = SERVER.y + 62 + i * 30;
              const u = clamp01(sprawlU * ROUTES.length - i);
              return (
                <g key={r} opacity={u}>
                  <rect x={SERVER.x - 79} y={y} width={158} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={SERVER.x} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
                    {r}
                  </text>
                </g>
              );
            })}
            <text x={SERVER.x} y={SERVER.y + 62 + ROUTES.length * 30 + 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontStyle="italic" opacity={sprawlU}>
              one route per screen…
            </text>
          </g>
        </g>

        {/* ---- fetch-for-yourself request edges ---- */}
        <g opacity={oldNet}>
          {WF_BARS.map((b, k) => {
            const c = COMPONENTS[b.who];
            return (
              <g key={k}>
                <Connection
                  from={{ x: c.x + COMP_W / 2, y: c.y }}
                  to={{ x: SERVER.x - 79, y: SERVER.y }}
                  via={[{ x: 460 + k * 10, y: c.y }]}
                  u={wfU}
                  color={colors.GRID}
                  width={1.1}
                  dim={0.4}
                />
                <RequestFlow
                  path={[
                    { x: c.x + COMP_W / 2, y: c.y },
                    { x: 460 + k * 10, y: c.y },
                    { x: SERVER.x - 79, y: SERVER.y },
                  ]}
                  u={req[k]}
                  roundTrip
                  color={colors.ACCENT}
                  responseColor={colors.POSITIVE}
                  r={6}
                />
              </g>
            );
          })}
        </g>

        {/* ---- waterfall panel ---- */}
        <g opacity={wfU * dimAll}>
          <rect x={WF.x} y={WF.y} width={WF.w} height={WF.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={WF.x + 18} y={WF.y + 28} fill={colors.TEXT} fontSize={14}>
            what the user waits through
          </text>
          {/* time axis */}
          <line x1={T_SCALE(0)} y1={WF.y + WF.h - 32} x2={T_SCALE(900)} y2={WF.y + WF.h - 32} stroke={colors.GRID} strokeWidth={1} />
          {[0, 300, 600, 900].map((ms) => (
            <text key={ms} x={T_SCALE(ms)} y={WF.y + WF.h - 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              {ms} ms
            </text>
          ))}

          {/* BEFORE: the staircase */}
          <g opacity={beforeChart}>
            {WF_BARS.map((b, k) => {
              const u = req[k];
              const y = WF.y + 46 + k * WF_ROW_H;
              const w = (T_SCALE(b.to) - T_SCALE(b.from)) * clamp01(u * 1.05);
              const isDup = k > 0 && b.label === WF_BARS[k - 1]?.label ? dupU : k === 2 ? dupU : 0;
              return (
                <g key={k}>
                  <text x={WF.x + 18} y={y + 14} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
                    {b.label}
                  </text>
                  <rect
                    x={T_SCALE(b.from)}
                    y={y + 20}
                    width={Math.max(0, w)}
                    height={13}
                    rx={4}
                    fill={isDup > 0.02 ? colors.NEGATIVE : colors.ACCENT}
                    opacity={0.5 + 0.5 * clamp01(u * 3)}
                  />
                </g>
              );
            })}
            {dupU > 0.02 && (
              <text x={T_SCALE(880)} y={WF.y + 46 + 1.4 * WF_ROW_H} textAnchor="end" fill={colors.NEGATIVE} fontSize={11.5} opacity={dupU}>
                same rows, fetched twice
              </text>
            )}
            <g opacity={totalU}>
              <rect x={T_SCALE(520)} y={WF.y + 34} width={150} height={26} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.2} />
              <text x={T_SCALE(520) + 75} y={WF.y + 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5}>
                ~900 ms of waiting
              </text>
            </g>
          </g>

          {/* AFTER: one bulk load + instant local reads */}
          <g opacity={afterChart}>
            <text x={WF.x + 18} y={WF.y + 46 + 14} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
              bulk load
            </text>
            <rect x={T_SCALE(0)} y={WF.y + 66} width={T_SCALE(260) - T_SCALE(0)} height={13} rx={4} fill={colors.ACCENT} opacity={0.95} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <text x={WF.x + 18} y={WF.y + 104 + i * 30} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  local read
                </text>
                <rect x={T_SCALE(262)} y={WF.y + 94 + i * 30} width={2.5} height={13} fill={colors.POSITIVE} />
              </g>
            ))}
            <rect x={T_SCALE(420)} y={WF.y + 110} width={196} height={26} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={T_SCALE(420) + 98} y={WF.y + 128} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
              reads: under a millisecond
            </text>
          </g>
        </g>

        {/* ---- the client store ---- */}
        <g opacity={dimAll}>
          <Zone x={STORE.x} y={STORE.y} w={STORE.w} h={STORE.h} label="the client store" kind="group" u={storeU} color={colors.ACCENT} />
          <g opacity={storeU}>
            <rect x={COLL_TODOS.x - 70} y={COLL_TODOS.y - 32} width={140} height={64} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={COLL_TODOS.x} y={COLL_TODOS.y - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
              todos
            </text>
            <text x={COLL_TODOS.x} y={COLL_TODOS.y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
              createCollection
            </text>
            <rect x={COLL_CONFIG.x - 64} y={COLL_CONFIG.y - 32} width={128} height={64} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
            <text x={COLL_CONFIG.x} y={COLL_CONFIG.y - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
              config
            </text>
            <text x={COLL_CONFIG.x} y={COLL_CONFIG.y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
              createCollection
            </text>
            {/* rows already in the store, once loaded */}
            {bulkU >= 1 &&
              [0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={COLL_TODOS.x - 46 + i * 23} cy={COLL_TODOS.y + 24} r={3.4} fill={colors.ACCENT} opacity={0.85} />
              ))}
          </g>

          {/* one bulk load: backend → store */}
          {bulkU > 0 && bulkU < 1 && (
            <RequestFlow
              path={[
                { x: SERVER.x - 79, y: SERVER.y - 20 },
                { x: STORE.x + STORE.w, y: 148 },
              ]}
              u={bulkU}
              color={colors.ACCENT}
              r={8}
              label="all the rows, once"
            />
          )}

          {/* instant local reads: store → components */}
          <g opacity={localU}>
            {COMPONENTS.map((c, i) => (
              <Connection
                key={i}
                from={{ x: STORE.x, y: STORE.y + 60 + i * 26 }}
                to={{ x: c.x, y: c.y - COMP_H / 2 }}
                u={clamp01(localU * 2 - i * 0.3)}
                color={colors.POSITIVE}
                width={1.5}
                arrow
              />
            ))}
            <rect x={STORE.x + 26} y={STORE.y + STORE.h + 10} width={188} height={26} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={STORE.x + 120} y={STORE.y + STORE.h + 28} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>
              live queries · sub-millisecond
            </text>
          </g>

          {/* the write teaser */}
          {writeU > 0 && writeU < 1 && (
            <RequestFlow
              path={[
                { x: COMPONENTS[1].x, y: COMPONENTS[1].y - COMP_H / 2 },
                { x: STORE.x + 40, y: STORE.y + STORE.h - 20 },
              ]}
              u={writeU}
              color={colors.WARM}
              r={6}
              label="a write"
            />
          )}
          {writeSyncU > 0 && writeSyncU < 1 && (
            <RequestFlow
              path={[
                { x: STORE.x + STORE.w, y: 168 },
                { x: SERVER.x - 79, y: SERVER.y },
              ]}
              u={writeSyncU}
              color={colors.WARM}
              r={5}
              label="synced later"
            />
          )}
        </g>

        {/* ---- quiet closing panel ---- */}
        <g opacity={closeU}>
          <rect x={300} y={205} width={680} height={252} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={252} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the reactive client store for your app
          </text>
          {[
            ['load once', 'normalized collections, no waterfalls'],
            ['query locally', 'live queries answer in under a millisecond'],
            ['write instantly', 'the network is off the interaction path'],
          ].map(([head, sub], i) => (
            <g key={head}>
              <rect x={340 + i * 210} y={300} width={190} height={92} rx={10} fill={colors.BG} stroke={i === 0 ? colors.ACCENT : i === 1 ? colors.POSITIVE : colors.WARM} strokeWidth={1.4} />
              <text x={435 + i * 210} y={336} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                {head}
              </text>
              <text x={435 + i * 210} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                <tspan x={435 + i * 210} dy={0}>{sub.split(', ')[0]}</tspan>
                <tspan x={435 + i * 210} dy={14}>{sub.split(', ')[1] ?? ''}</tspan>
              </text>
            </g>
          ))}
          <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            @tanstack/db · createCollection · useLiveQuery
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
