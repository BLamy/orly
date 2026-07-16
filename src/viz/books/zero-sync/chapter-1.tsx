// The Read That Never Leaves the Device
//
// Backing: packages/zero-client/src/client/zero.ts (Zero wraps ReplicacheImpl;
// kvStore defaults to 'idb'; createConnectionURL → /sync/v{N}/connect),
// packages/zql/src/query/query.ts:218 (z.query.issue.where('status',
// 'open').limit(10)), packages/zero-cache config (port default 4848,
// ZERO_UPSTREAM_DB).
//
// Machine: a latency race, run honestly. Two stacks answer the same query.
// The classic stack round-trips to a distant Postgres while a millisecond
// counter spins; the Zero stack answers from a cache already on the device
// and the counter barely ticks. Then the wire is cut: the classic pane
// starves behind a spinner, the Zero pane keeps answering. Close on the
// question the rest of the book exists to answer: who keeps that cache honest?
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
import { Connection, Packet, ServiceNode, TimerArc, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const frac = (u: number): number => u - Math.floor(u);

// ---------------------------------------------------------------------------
// Layout — two lanes racing the same query. Captions own y ≳ 630.
// ---------------------------------------------------------------------------

const LANE_L = { x: 42, y: 88, w: 570, h: 512 } as const;
const LANE_R = { x: 668, y: 88, w: 570, h: 512 } as const;

// classic lane: device top, api + postgres at the bottom of a long wire
const C_DEV = { x: 327, y: 190 };
const C_API = { x: 200, y: 470 };
const C_PG = { x: 470, y: 470 };
const C_PATH = [C_DEV, C_API, C_PG];

// zero lane: device top with the cache INSIDE it; zero-cache + postgres faint below
const Z_DEV = { x: 953, y: 210 };
const Z_APP = { x: 858, y: 210 }; // the UI pane inside the device
const Z_CACHE = { x: 1052, y: 210 }; // the local store inside the device
const Z_ZC = { x: 860, y: 470 };
const Z_PG = { x: 1090, y: 470 };

// the query chip both lanes are answering
const QUERY = "z.query.issue.where('status', 'open').limit(10)";

// result list rows (shared look for both panes)
const ROWS = ['fix: login loops on expired token', 'flaky sync test on CI', 'dark mode flashes white'];

const CAM_LEFT: CameraState = { x: 330, y: 330, k: 1.28 };
const CAM_RIGHT: CameraState = { x: 950, y: 260, k: 1.5 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  queryU: ChannelRef<number>;
  laneLU: ChannelRef<number>;
  laneRU: ChannelRef<number>;
  tripU: ChannelRef<number>;
  msL: ChannelRef<number>;
  listLU: ChannelRef<number>;
  hopU: ChannelRef<number>;
  msRU: ChannelRef<number>;
  listRU: ChannelRef<number>;
  whisperU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  spinU: ChannelRef<number>;
  trip2U: ChannelRef<number>;
  hop2U: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const queryU = tl.channel('queryU', 0); // the shared query chip
  const laneLU = tl.channel('laneLU', 0); // classic lane draw-on
  const laneRU = tl.channel('laneRU', 0); // zero lane draw-on
  const tripU = tl.channel('tripU', 0); // classic round trip progress
  const msL = tl.channel('msL', 0); // classic ms counter
  const listLU = tl.channel('listLU', 0); // classic pane renders
  const hopU = tl.channel('hopU', 0); // zero local hop (round trip)
  const msRU = tl.channel('msRU', 0); // zero counter reveal
  const listRU = tl.channel('listRU', 0); // zero pane renders
  const whisperU = tl.channel('whisperU', 0); // background sync trickle
  const cutU = tl.channel('cutU', 0); // the network dies
  const spinU = tl.channel('spinU', 0); // classic spinner of despair
  const trip2U = tl.channel('trip2U', 0); // classic retry that never lands
  const hop2U = tl.channel('hop2U', 0); // zero keeps answering
  const dimU = tl.channel('dimU', 0); // quiet the stage for the close
  const closeU = tl.channel('closeU', 0); // closing panel

  // — Beat 1 · the tax —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Here is a question every app keeps asking: which issues are open? And here is the tax it usually pays to ask it.',
  });
  tl.tween(queryU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(laneLU, 1, { at: 1.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_LEFT, { at: 2.0, dur: 1.4, ease: ease.move });

  // — Beat 2 · the round trip, timed —
  tl.caption({
    at: 6.4,
    dur: 6.5,
    text: 'The query leaves the device, crosses the network to a server, waits for the database, and rides all the way back.',
  });
  tl.tween(tripU, 1, { at: 6.8, dur: 4.6, ease: ease.linear });
  tl.tween(msL, 240, { at: 6.8, dur: 4.6, ease: ease.linear });
  tl.tween(listLU, 1, { at: 11.5, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 13.2,
    dur: 5.5,
    text: 'Two hundred forty milliseconds later, the list renders. Pay that on every screen, every keystroke, and the lag becomes the interface.',
  });
  tl.hold(18.7, 0.6);

  // — Beat 3 · Zero moves the answer next to the question —
  tl.caption({
    at: 19.3,
    dur: 6,
    text: 'Zero moves the answer next to the question. The same query runs against a cache that already lives on the device.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 19.5, dur: 1.5, ease: ease.move });
  tl.tween(laneRU, 1, { at: 20.0, dur: 1.5, ease: ease.draw });
  tl.tween(hopU, 1, { at: 22.2, dur: 0.9, ease: ease.linear });
  tl.tween(listRU, 1, { at: 23.0, dur: 0.5, ease: ease.enter });
  tl.tween(msRU, 1, { at: 23.2, dur: 0.5, ease: ease.enter });

  // — Beat 4 · the number —
  tl.caption({
    at: 25.6,
    dur: 6,
    text: 'Under a millisecond. Not because the network got faster — because the read never touched the network at all.',
  });
  tl.hold(31.6, 0.6);

  // — Beat 5 · the whisper —
  tl.caption({
    at: 32.2,
    dur: 6.5,
    text: 'The server is still there. A socket hums in the background, whispering changes into the cache so tomorrow’s reads are as fresh as today’s.',
  });
  tl.tween(cam, CAM_WIDE, { at: 32.4, dur: 1.6, ease: ease.move });
  tl.tween(whisperU, 1, { at: 33.0, dur: 24, ease: ease.linear });
  tl.hold(38.7, 0.6);

  // — Beat 6 · cut the wire —
  tl.caption({
    at: 39.3,
    dur: 6,
    text: 'Now cut the network. The classic stack starves — its answer lives on the other side of the wire.',
  });
  tl.tween(cutU, 1, { at: 40.0, dur: 0.8, ease: ease.move });
  tl.tween(trip2U, 0.32, { at: 41.0, dur: 1.4, ease: ease.linear });
  tl.tween(spinU, 1, { at: 42.2, dur: 12, ease: ease.linear });
  tl.caption({
    at: 45.6,
    dur: 5.5,
    text: 'Zero shrugs. The cache is right there, so reads keep landing — and your edits queue up to sync when the wire returns.',
  });
  tl.tween(hop2U, 3, { at: 46.0, dur: 4.2, ease: ease.linear });
  tl.hold(51.3, 0.6);

  // — Beat 7 · the promise —
  tl.caption({
    at: 51.9,
    dur: 6.5,
    text: 'But a cache this eager raises the real question: who keeps it honest? What decides which rows it holds, and who owns the truth?',
  });
  tl.tween(dimU, 1, { at: 52.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 53.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 58.8,
    dur: 5,
    text: 'The answers: your own Postgres, a replica, and a ledger of queries. That machine is the rest of this book.',
  });
  tl.hold(63.8, 1.4);

  return {
    tl, cam, queryU, laneLU, laneRU, tripU, msL, listLU, hopU, msRU,
    listRU, whisperU, cutU, spinU, trip2U, hop2U, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function ResultList({ x, y, u, w }: { x: number; y: number; u: number; w: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      {ROWS.map((r, i) => {
        const rowU = clamp01(u * 3 - i);
        return (
          <g key={i} opacity={rowU}>
            <rect x={x} y={y + i * 26} width={w} height={20} rx={5} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1} />
            <circle cx={x + 12} cy={y + i * 26 + 10} r={3.5} fill={colors.POSITIVE} />
            <text x={x + 24} y={y + i * 26 + 14} fill={colors.TEXT} fontSize={10.5}>
              {r}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function MsCounter({ x, y, ms, label, color }: { x: number; y: number; ms: string; label: string; color: string }) {
  return (
    <g>
      <text x={x} y={y} textAnchor="middle" fill={color} fontSize={26} fontWeight={800} fontFamily="ui-monospace, monospace">
        {ms}
      </text>
      <text x={x} y={y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const queryU = s.get(scene.queryU);
  const laneLU = s.get(scene.laneLU);
  const laneRU = s.get(scene.laneRU);
  const tripU = s.get(scene.tripU);
  const msL = s.get(scene.msL);
  const listLU = s.get(scene.listLU);
  const hopU = s.get(scene.hopU);
  const msRU = s.get(scene.msRU);
  const listRU = s.get(scene.listRU);
  const whisperU = s.get(scene.whisperU);
  const cutU = s.get(scene.cutU);
  const spinU = s.get(scene.spinU);
  const trip2U = s.get(scene.trip2U);
  const hop2U = s.get(scene.hop2U);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const faded = 1 - 0.87 * dimU;
  const wireAlive = 1 - cutU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={faded}>
          {/* the shared query chip, top center */}
          <g opacity={queryU}>
            <rect x={STAGE_W / 2 - 240} y={30} width={480} height={34} rx={17} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={STAGE_W / 2} y={52} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
              {QUERY}
            </text>
          </g>

          {/* ---------------- classic lane ---------------- */}
          <Zone x={LANE_L.x} y={LANE_L.y} w={LANE_L.w} h={LANE_L.h} label="the usual way" u={laneLU} color={colors.MUTED} />
          <g opacity={laneLU}>
            <ServiceNode x={C_DEV.x} y={C_DEV.y} kind="browser" label="your app" sublabel="fetch on render" u={laneLU} />
            <ServiceNode x={C_API.x} y={C_API.y} kind="server" label="api server" u={laneLU} dim={cutU * 0.5} />
            <ServiceNode x={C_PG.x} y={C_PG.y} kind="db" label="Postgres" sublabel="the data, far away" u={laneLU} dim={cutU * 0.5} />
            <Connection from={{ x: C_DEV.x - 30, y: C_DEV.y + 30 }} to={{ x: C_API.x, y: C_API.y - 32 }} u={laneLU} color={cutU > 0.5 ? colors.NEGATIVE : colors.GRID} dashed={cutU > 0.5} label={cutU > 0.5 ? 'offline' : 'network'} />
            <Connection from={{ x: C_API.x + 55, y: C_API.y }} to={{ x: C_PG.x - 55, y: C_PG.y }} u={laneLU} color={colors.GRID} />
            {/* the timed round trip */}
            <Packet from={C_DEV} to={C_API} u={tripU * 3} r={7} color={colors.WARM} label="query" />
            <Packet from={C_API} to={C_PG} u={tripU * 3 - 1} r={7} color={colors.WARM} />
            <Packet from={C_PG} to={C_DEV} u={tripU * 3 - 2} r={7} color={colors.POSITIVE} label={tripU > 0.7 ? 'rows' : undefined} />
            {/* the doomed retry after the cut */}
            <Packet from={C_DEV} to={C_API} u={trip2U * 3} r={7} color={colors.NEGATIVE} label="query?" />
            {msL > 1 && (
              <MsCounter x={C_DEV.x + 150} y={C_DEV.y - 10} ms={`${Math.floor(msL)} ms`} label="waiting" color={msL > 200 ? colors.NEGATIVE : colors.WARM} />
            )}
            {/* spinner once the wire dies */}
            {spinU > 0 && spinU < 1 && (
              <g>
                <TimerArc cx={C_DEV.x} cy={C_DEV.y - 64} r={13} u={frac(spinU * 6)} color={colors.NEGATIVE} />
                <text x={C_DEV.x + 24} y={C_DEV.y - 59} fill={colors.NEGATIVE} fontSize={12}>
                  loading…
                </text>
              </g>
            )}
            <ResultList x={C_DEV.x - 118} y={C_DEV.y + 44} w={236} u={listLU * (1 - cutU * 0.65)} />
          </g>

          {/* ---------------- zero lane ---------------- */}
          <Zone x={LANE_R.x} y={LANE_R.y} w={LANE_R.w} h={LANE_R.h} label="with Zero" u={laneRU} color={colors.ACCENT} />
          <g opacity={laneRU}>
            {/* the device is a container — the cache lives inside it */}
            <rect x={Z_DEV.x - 190} y={Z_DEV.y - 78} width={380} height={210} rx={16} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} opacity={0.8} />
            <text x={Z_DEV.x} y={Z_DEV.y - 90} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} letterSpacing={1}>
              the device
            </text>
            <ServiceNode x={Z_APP.x} y={Z_APP.y} kind="browser" label="your app" sublabel="useQuery(…)" u={laneRU} />
            <ServiceNode x={Z_CACHE.x} y={Z_CACHE.y} kind="cache" label="local cache" sublabel="zero-client · IndexedDB" u={laneRU} glow={clamp01(hopU * 2) * (1 - dimU)} />
            <Connection from={{ x: Z_APP.x + 52, y: Z_APP.y }} to={{ x: Z_CACHE.x - 58, y: Z_CACHE.y }} u={laneRU} color={colors.GRID} />
            {/* the local hop: there and back inside the device */}
            <Packet from={Z_APP} to={Z_CACHE} u={hopU * 2} r={6} color={colors.WARM} />
            <Packet from={Z_CACHE} to={Z_APP} u={hopU * 2 - 1} r={6} color={colors.POSITIVE} />
            {/* zero keeps answering after the cut */}
            <Packet from={Z_APP} to={Z_CACHE} u={frac(hop2U) * 2} r={5} color={colors.WARM} opacity={hop2U > 0 && hop2U < 3 ? 0.9 : 0} />
            <Packet from={Z_CACHE} to={Z_APP} u={frac(hop2U) * 2 - 1} r={5} color={colors.POSITIVE} opacity={hop2U > 0 && hop2U < 3 ? 0.9 : 0} />
            {msRU > 0 && <MsCounter x={Z_DEV.x + 158} y={Z_DEV.y - 44} ms="<1 ms" label="no network hop" color={colors.POSITIVE} />}
            <ResultList x={Z_APP.x - 110} y={Z_DEV.y + 62} w={236} u={listRU} />

            {/* the sync stack below, kept faint — chapters 2–4 live here */}
            <ServiceNode x={Z_ZC.x} y={Z_ZC.y} kind="server" label="zero-cache" sublabel=":4848" u={laneRU} dim={0.45 + cutU * 0.3} />
            <ServiceNode x={Z_PG.x} y={Z_PG.y} kind="db" label="your Postgres" sublabel="ZERO_UPSTREAM_DB" u={laneRU} dim={0.45 + cutU * 0.3} />
            <Connection from={{ x: Z_DEV.x - 40, y: Z_DEV.y + 132 }} to={{ x: Z_ZC.x, y: Z_ZC.y - 32 }} u={laneRU} color={cutU > 0.5 ? colors.NEGATIVE : colors.GRID} dashed label={cutU > 0.5 ? 'offline' : 'socket · /sync/v… /connect'} labelSize={10} dim={0.3} />
            <Connection from={{ x: Z_ZC.x + 62, y: Z_ZC.y }} to={{ x: Z_PG.x - 62, y: Z_PG.y }} u={laneRU} color={colors.GRID} dim={0.3} />
            {/* the whisper: changes trickling up into the cache */}
            {whisperU > 0 && whisperU < 1 &&
              [0, 1, 2].map((i) => (
                <Packet
                  key={`w${i}`}
                  from={{ x: Z_ZC.x, y: Z_ZC.y - 32 }}
                  to={{ x: Z_CACHE.x, y: Z_CACHE.y + 34 }}
                  u={frac(whisperU * 7 + i / 3)}
                  r={3}
                  color={colors.ACCENT}
                  opacity={0.65 * wireAlive}
                />
              ))}
          </g>
        </g>

        {/* closing panel over a quiet stage */}
        <g opacity={closeU}>
          <rect x={320} y={210} width={640} height={210} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={272} textAnchor="middle" fill={colors.ACCENT} fontSize={26} fontWeight={800} letterSpacing={1}>
            reads answer locally
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
            so the real work is keeping the cache honest
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="ui-monospace, monospace">
            your Postgres → replica → queries → device
          </text>
          <text x={640} y={390} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            chapters 2 – 5
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
