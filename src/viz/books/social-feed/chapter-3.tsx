// The Home-Timeline Cache
//
// Backing: solutions/system_design/twitter/README.md — "Use case: User views
// the home timeline": Client → Web Server → Read API → Timeline Service →
// Memory Cache (tweet ids + user ids, O(1)) → multiget the Tweet Info Service
// and the User Info Service (O(n)). Plus "Step 4: Scale the design": keep only
// several hundred tweets per home timeline in the Memory Cache, active users
// only; rebuild dormant timelines from the SQL Database. The hydrated rows use
// the README's actual home-timeline response ids (456/123 "foo", 789/456
// "bar", 789/579 "baz") and chapter one's tweet 987.
//
// Machine: a race. The naive plan (fan-out on READ) spiders queries to every
// followee and jams red at a hundred thousand reads a second; it is swept off
// stage, and the real path grabs the precomputed Redis list in one lookup,
// then two batched multigets hydrate a skeleton into a feed.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, Packet, RequestFlow, ServiceNode, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Naive side — fan-out on read.
// ---------------------------------------------------------------------------

const READER = { x: 300, y: 340 };
const MERGE = { x: 545, y: 340 };
const N_FOLLOWEES = 12;
const FOLLOWEES = Array.from({ length: N_FOLLOWEES }, (_, i) => {
  const a = (-70 + (140 * i) / (N_FOLLOWEES - 1)) * (Math.PI / 180);
  return { x: 700 + 360 * Math.cos(a * 0.7), y: 340 + 250 * Math.sin(a) };
});

// ---------------------------------------------------------------------------
// Real read path.
// ---------------------------------------------------------------------------

const N_CLIENT = { x: 130, y: 120 };
const N_WEB = { x: 310, y: 120 };
const N_READ = { x: 490, y: 120 };
const N_TLSVC = { x: 690, y: 120 };
const N_CACHE = { x: 915, y: 120 };
const N_TWEETINFO = { x: 620, y: 400 };
const N_USERINFO = { x: 620, y: 505 };
const N_SQL = { x: 620, y: 268 };

// The home-timeline list (same visual language as chapter 2's strips).
const STRIP = { x: 830, w: 385, y: 200, h: 34, cells: 9 } as const;
const CELL_W = STRIP.w / STRIP.cells;
const rand = mulberry32(20260717);
const OLD_ALPHA = Array.from({ length: STRIP.cells }, () => 0.25 + rand() * 0.4);

// Dormant user's strip, below.
const DORM = { x: 830, w: 385, y: 258, h: 26 } as const;

// The feed — the README's real home-timeline response rows.
const FEED = { x: 950, y: 315, w: 290, rowH: 48, gap: 12 } as const;
const ROWS = [
  { tweet: '987', user: '123', status: 'hello world!' },
  { tweet: '123', user: '456', status: 'foo' },
  { tweet: '456', user: '789', status: 'bar' },
  { tweet: '579', user: '789', status: 'baz' },
] as const;
const rowY = (i: number): number => FEED.y + i * (FEED.rowH + FEED.gap);

// camera marks
const CAM_NAIVE: CameraState = { x: 560, y: 340, k: 1.12 };
const CAM_JAM: CameraState = { x: 360, y: 340, k: 1.45 };
const CAM_PATH: CameraState = { x: 560, y: 160, k: 1.3 };
const CAM_GRAB: CameraState = { x: 940, y: 170, k: 1.45 };
const CAM_FEED: CameraState = { x: 880, y: 380, k: 1.2 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const naiveU = tl.channel('naiveU', 0);
  const spiderU = tl.channel('spiderU', 0);
  const jamU = tl.channel('jamU', 0);
  const sweep = tl.channel('sweep', 0);
  const laneU = tl.channel('laneU', 0);
  const stripU = tl.channel('stripU', 0);
  const grabU = tl.channel('grabU', 0);
  const gotU = tl.channel('gotU', 0);
  const feedU = tl.channel('feedU', 0);
  const mgU = tl.channel('mgU', 0);
  const hydra = tl.channel('hydra', 0);
  const tradeU = tl.channel('tradeU', 0);
  const trimU = tl.channel('trimU', 0);
  const dormU = tl.channel('dormU', 0);

  // — Beat 1 · pull to refresh —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Now the other side. You open the app and pull to refresh — along with a hundred thousand other people this second.',
  });
  tl.tween(cam, CAM_NAIVE, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(naiveU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });

  // — Beat 2 · the naive plan —
  tl.caption({
    at: 7.1,
    dur: 7,
    text: 'The naive plan builds your feed on demand: query everyone you follow, collect their recent tweets, then merge and sort the pile.',
  });
  tl.tween(spiderU, 1, { at: 7.9, dur: 3.2, ease: ease.draw });
  tl.hold(14.1, 0.7);

  // — Beat 3 · it buckles —
  tl.caption({
    at: 14.8,
    dur: 6.5,
    text: 'Do that on every refresh and the same work is redone forever. At a hundred thousand reads a second, the naive plan buckles.',
  });
  tl.tween(cam, CAM_JAM, { at: 15.0, dur: 1.4, ease: ease.move });
  tl.tween(jamU, 1, { at: 15.8, dur: 2.6, ease: ease.move });
  tl.hold(21.3, 0.7);

  // — Beat 4 · the feed already exists —
  tl.caption({
    at: 22.0,
    dur: 6.5,
    text: "But the feed already exists. Chapter two built it at write time — it's sitting in the memory cache, fully assembled.",
  });
  tl.tween(sweep, 1, { at: 22.2, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_PATH, { at: 22.4, dur: 1.5, ease: ease.move });
  tl.tween(laneU, 1, { at: 23.2, dur: 1.6, ease: ease.enter });
  tl.tween(stripU, 1, { at: 24.6, dur: 1.4, ease: ease.draw });
  tl.hold(28.5, 0.7);

  // — Beat 5 · the constant-time grab —
  tl.caption({
    at: 29.2,
    dur: 7.5,
    text: 'So the read service asks the timeline service, and the timeline service grabs your list in one constant-time lookup, no matter how many people you follow.',
  });
  tl.tween(cam, CAM_GRAB, { at: 29.4, dur: 1.5, ease: ease.move });
  tl.tween(grabU, 1, { at: 30.2, dur: 3.4, ease: ease.linear });
  tl.tween(gotU, 1, { at: 33.8, dur: 0.7, ease: ease.pop });
  tl.hold(36.7, 0.7);

  // — Beat 6 · hydration —
  tl.caption({
    at: 37.4,
    dur: 7.5,
    text: 'The list holds ids, not tweets. One batched lookup swaps tweet ids for text, another swaps author ids for names. A skeleton becomes a feed.',
  });
  tl.tween(cam, CAM_FEED, { at: 37.6, dur: 1.5, ease: ease.move });
  tl.tween(feedU, 1, { at: 37.8, dur: 1.4, ease: ease.draw });
  tl.tween(mgU, 1, { at: 39.4, dur: 3.4, ease: ease.linear });
  tl.tween(hydra, 1, { at: 41.2, dur: 2.8, ease: ease.move });
  tl.hold(44.9, 0.7);

  // — Beat 7 · the trade, closed —
  tl.caption({
    at: 45.6,
    dur: 6.5,
    text: "That's the trade, closed: writes did linear work so that reads stay constant — and reads outnumber writes seventeen to one.",
  });
  tl.tween(cam, CAM_WIDE, { at: 45.8, dur: 1.6, ease: ease.move });
  tl.tween(tradeU, 1, { at: 46.6, dur: 0.9, ease: ease.enter });
  tl.hold(52.1, 0.7);

  // — Beat 8 · lean on purpose —
  tl.caption({
    at: 52.8,
    dur: 8,
    text: 'The cache stays lean: a few hundred entries per feed, active users only. Go quiet for a month and your list is rebuilt from the database when you return.',
  });
  tl.tween(trimU, 1, { at: 53.6, dur: 1.6, ease: ease.move });
  tl.tween(dormU, 1, { at: 56.2, dur: 3.2, ease: ease.linear });
  tl.hold(60.8, 1.6);

  return {
    tl, cam, naiveU, spiderU, jamU, sweep, laneU, stripU, grabU,
    gotU, feedU, mgU, hydra, tradeU, trimU, dormU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const naiveU = s.get(scene.naiveU);
  const spiderU = s.get(scene.spiderU);
  const jamU = s.get(scene.jamU);
  const sweep = s.get(scene.sweep);
  const laneU = s.get(scene.laneU);
  const stripU = s.get(scene.stripU);
  const grabU = s.get(scene.grabU);
  const gotU = s.get(scene.gotU);
  const feedU = s.get(scene.feedU);
  const mgU = s.get(scene.mgU);
  const hydra = s.get(scene.hydra);
  const tradeU = s.get(scene.tradeU);
  const trimU = s.get(scene.trimU);
  const dormU = s.get(scene.dormU);

  const naiveOp = naiveU * (1 - sweep);
  const keep = 5; // cells kept after the trim

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ============ the naive plan — fan-out on read ============ */}
        {naiveOp > 0.01 && (
          <g opacity={naiveOp} transform={`translate(${-sweep * 950}, 0)`}>
            <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
              fan-out on read — build the feed on demand
            </text>
            {FOLLOWEES.map((f, i) => {
              const u = clamp01(spiderU * 2 - i / N_FOLLOWEES);
              return (
                <g key={i}>
                  <Connection from={READER} to={f} u={u} dashed color={jamU > 0.5 ? colors.NEGATIVE : undefined} dim={0.25} />
                  <circle cx={f.x} cy={f.y} r={9} fill={colors.MUTED} opacity={0.25 + 0.55 * u} />
                </g>
              );
            })}
            {/* merge + sort chip */}
            <g opacity={clamp01(spiderU * 2 - 0.8)}>
              <rect x={MERGE.x - 62} y={MERGE.y - 60} width={124} height={30} rx={15} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={MERGE.x} y={MERGE.y - 40} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                merge + sort
              </text>
            </g>
            <ServiceNode {...READER} kind="mobile" label="you" sublabel="pull to refresh" u={naiveU} status={jamU > 0.5 ? 'down' : 'ok'} glow={jamU * 0.5} />
            {/* the latency clock drains as the plan jams */}
            <g opacity={jamU}>
              <TimerArc cx={READER.x - 80} cy={READER.y - 70} r={22} u={1 - 0.9 * jamU} color={colors.NEGATIVE} />
              <text x={READER.x - 80} y={READER.y - 30} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>
                latency
              </text>
              <text x={READER.x + 130} y={READER.y + 90} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
                × 100,000 / s — again and again
              </text>
            </g>
          </g>
        )}

        {/* ============ the real read path ============ */}
        {laneU > 0.01 && (
          <g>
            <Connection from={N_CLIENT} to={N_WEB} u={laneU} arrow label="GET home_timeline" labelSize={10} />
            <Connection from={N_WEB} to={N_READ} u={laneU} arrow />
            <Connection from={N_READ} to={N_TLSVC} u={laneU} arrow />
            <Connection from={N_TLSVC} to={N_CACHE} u={laneU} arrow />
            <ServiceNode {...N_CLIENT} kind="mobile" label="Client" u={laneU} />
            <ServiceNode {...N_WEB} kind="server" label="Web Server" u={laneU} />
            <ServiceNode {...N_READ} kind="server" label="Read API" u={laneU} />
            <ServiceNode {...N_TLSVC} kind="fn" label="Timeline Service" u={laneU} glow={gotU * 0.6} />
            <ServiceNode {...N_CACHE} kind="cache" label="Memory Cache" sublabel="Redis" u={laneU} glow={gotU} />

            <RequestFlow
              path={[N_CLIENT, N_WEB, N_READ, N_TLSVC, N_CACHE]}
              u={grabU}
              roundTrip
              label="read"
              responseLabel="your list"
              responseColor={colors.POSITIVE}
              dwell={0.12}
              turnDwell={0.12}
            />

            {/* your home-timeline list — precomputed in chapter two */}
            <g opacity={stripU}>
              <text x={STRIP.x - 10} y={STRIP.y + STRIP.h / 2 + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
                your list
              </text>
              <rect x={STRIP.x} y={STRIP.y} width={STRIP.w} height={STRIP.h} rx={7} fill={colors.PANEL} stroke={gotU > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={1 + gotU} />
              {OLD_ALPHA.map((a, c) => {
                const trimmed = c >= keep ? 1 - trimU * 0.92 : 1;
                const isHead = c === 0;
                return (
                  <rect
                    key={c}
                    x={STRIP.x + c * CELL_W + 3}
                    y={STRIP.y + 5}
                    width={CELL_W - 6}
                    height={STRIP.h - 10}
                    rx={4}
                    fill={isHead ? colors.ACCENT : colors.MUTED}
                    opacity={(isHead ? 0.95 : a) * trimmed}
                  />
                );
              })}
              <text x={STRIP.x + CELL_W / 2} y={STRIP.y + STRIP.h / 2 + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace">
                987
              </text>
              <MathLabel tex="O(1)" x={STRIP.x + STRIP.w + 34} y={STRIP.y + STRIP.h / 2} fontSize={16} color={colors.POSITIVE} opacity={gotU} anchor="middle" />
              {/* the trim — several hundred, no more */}
              <g opacity={trimU}>
                <line x1={STRIP.x + keep * CELL_W} y1={STRIP.y - 6} x2={STRIP.x + keep * CELL_W} y2={STRIP.y + STRIP.h + 6} stroke={colors.WARM} strokeWidth={2} strokeDasharray="4 4" />
                <text x={STRIP.x + keep * CELL_W + 8} y={STRIP.y - 12} fill={colors.WARM} fontSize={11}>
                  keep several hundred, no more
                </text>
              </g>
            </g>

            {/* the dormant user's strip — evicted, rebuilt on return */}
            <g opacity={trimU}>
              <text x={DORM.x - 10} y={DORM.y + DORM.h / 2 + 4} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace" opacity={1 - 0.6 * dormU}>
                inactive 30 days
              </text>
              <rect x={DORM.x} y={DORM.y} width={DORM.w} height={DORM.h} rx={6} fill={colors.PANEL} stroke={colors.GRID} opacity={1 - 0.65 * dormU} strokeDasharray="5 4" />
              {dormU > 0 && (
                <>
                  <ServiceNode {...N_SQL} kind="db" label="SQL Database" u={clamp01(dormU * 3)} labelSize={10} w={120} h={46} />
                  <Packet from={{ x: N_SQL.x + 64, y: N_SQL.y }} to={{ x: DORM.x + 40, y: DORM.y + DORM.h / 2 }} u={clamp01(dormU * 1.6 - 0.4)} r={4.5} color={colors.SECONDARY} label="rebuild" labelSize={9} />
                </>
              )}
            </g>

            {/* the feed — skeleton rows hydrate into real tweets */}
            <g opacity={feedU}>
              {ROWS.map((r, i) => {
                const h = clamp01(hydra * 2.2 - (i / ROWS.length) * 1.2);
                const y = rowY(i);
                return (
                  <g key={i}>
                    <rect x={FEED.x} y={y} width={FEED.w} height={FEED.rowH} rx={10} fill={colors.PANEL} stroke={h > 0.5 ? colors.ACCENT : colors.GRID} strokeWidth={1} opacity={0.9} />
                    <circle cx={FEED.x + 26} cy={y + FEED.rowH / 2} r={12} fill={h > 0 ? colors.SECONDARY : colors.MUTED} opacity={0.35 + 0.6 * h} />
                    {h < 0.6 ? (
                      <>
                        <rect x={FEED.x + 48} y={y + 13} width={(FEED.w - 70) * 0.8} height={9} rx={4} fill={colors.MUTED} opacity={0.3} />
                        <rect x={FEED.x + 48} y={y + 29} width={(FEED.w - 70) * 0.55} height={9} rx={4} fill={colors.MUTED} opacity={0.22} />
                      </>
                    ) : (
                      <g opacity={clamp01((h - 0.6) / 0.4)}>
                        <text x={FEED.x + 48} y={y + 21} fill={colors.TEXT} fontSize={13} fontWeight={600}>
                          user {r.user}
                        </text>
                        <text x={FEED.x + 48} y={y + 38} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
                          “{r.status}”
                        </text>
                        <text x={FEED.x + FEED.w - 12} y={y + 21} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
                          {r.tweet}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* the two batched multigets */}
            {mgU > 0 && mgU < 1 && (
              <>
                <RequestFlow path={[{ x: FEED.x, y: rowY(1) + 20 }, N_TWEETINFO]} u={mgU} roundTrip color={colors.ACCENT} responseColor={colors.POSITIVE} label="MGET tweet ids" responseLabel="text" labelSize={10} />
                <RequestFlow path={[{ x: FEED.x, y: rowY(2) + 20 }, N_USERINFO]} u={clamp01(mgU * 1.25 - 0.25)} roundTrip color={colors.SECONDARY} responseColor={colors.POSITIVE} label="MGET user ids" responseLabel="names" labelSize={10} />
              </>
            )}
            <g opacity={clamp01(mgU * 3) * feedU}>
              <ServiceNode {...N_TWEETINFO} kind="cache" label="Tweet Info Service" u={clamp01(mgU * 3)} labelSize={11} />
              <ServiceNode {...N_USERINFO} kind="cache" label="User Info Service" u={clamp01(mgU * 3)} labelSize={11} />
            </g>

            {/* the trade chip */}
            <g opacity={tradeU}>
              <rect x={80} y={545} width={430} height={44} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <MathLabel tex="\text{write } O(n) \;\Rightarrow\; \text{read } O(1)" x={295} y={567} fontSize={15} color={colors.TEXT} anchor="middle" />
            </g>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
