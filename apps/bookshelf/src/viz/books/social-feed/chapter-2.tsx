// Fan-Out on Write
//
// Backing: solutions/system_design/twitter/README.md — "Use case: User posts
// a tweet": Client → Web Server (reverse proxy) → Write API → SQL database
// (user timeline); Write API → Fan Out Service → User Graph Service (followers
// in the Memory Cache) → insert into each follower's home-timeline list in the
// Memory Cache (O(n): 1,000 followers = 1,000 lookups and inserts); plus the
// Search Index Service, Object Store, and Notification Service via a Queue.
// The Redis native-list entry: | tweet_id 8B | user_id 8B | meta 1B |.
//
// Machine: the write path runs along the top; the centerpiece is the BURST —
// the tweet id exploding out of the Fan Out Service into eight follower
// home-timeline strips whose heads push in while older entries shift right.
// Camera dives into one strip for the 17-byte entry anatomy, then a counter
// pays the honest O(n) price.
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
import { Connection, Packet, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — real components only, names verbatim from the README.
// ---------------------------------------------------------------------------

const N_CLIENT = { x: 110, y: 110 };
const N_WEB = { x: 300, y: 110 };
const N_WRITE = { x: 495, y: 110 };
const N_FAN = { x: 690, y: 110 };
const N_GRAPH = { x: 690, y: 300 };
const N_SQL = { x: 300, y: 300 };
const N_SEARCH = { x: 150, y: 500 };
const N_STORE = { x: 330, y: 500 };
const N_QUEUE = { x: 510, y: 500 };

// Eight follower home-timeline strips (Redis lists) on the right.
const STRIPS = { x: 880, w: 350, y0: 200, gap: 50, h: 34, cells: 8 } as const;
const CELL_W = STRIPS.w / STRIPS.cells;
const N_STRIPS = 8;
const stripY = (i: number): number => STRIPS.y0 + i * STRIPS.gap;

// Pre-existing (older) entries per strip — deterministic pseudo-content.
const rand = mulberry32(20260716);
const OLD_ALPHA: number[][] = Array.from({ length: N_STRIPS }, () =>
  Array.from({ length: STRIPS.cells }, () => 0.25 + rand() * 0.4),
);

// camera marks
const CAM_LANE: CameraState = { x: 400, y: 160, k: 1.35 };
const CAM_FAN: CameraState = { x: 720, y: 220, k: 1.3 };
const CAM_BURST: CameraState = { x: 880, y: 320, k: 1.1 };
const CAM_ZOOM: CameraState = { x: 1000, y: stripY(2) + 40, k: 2.1 };
const CAM_SIDE: CameraState = { x: 420, y: 380, k: 1.15 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const laneU = tl.channel('laneU', 0);
  const postU = tl.channel('postU', 0);
  const sqlU = tl.channel('sqlU', 0);
  const fanGlow = tl.channel('fanGlow', 0);
  const graphU = tl.channel('graphU', 0);
  const listU = tl.channel('listU', 0);
  const stripsU = tl.channel('stripsU', 0);
  const burstU = tl.channel('burstU', 0);
  const byteU = tl.channel('byteU', 0);
  const countN = tl.channel('countN', 0);
  const sideU = tl.channel('sideU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the post —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'You hit tweet. Your phone posts it to a web server, which hands it to the write service.',
  });
  tl.tween(cam, CAM_LANE, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(laneU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.tween(postU, 1, { at: 2.6, dur: 2.6, ease: ease.linear });

  // — Beat 2 · stored once —
  tl.caption({
    at: 7.1,
    dur: 6.5,
    text: 'The easy half comes first: the tweet is stored once, as a row in a relational database. That row is your own user timeline.',
  });
  tl.tween(sqlU, 1, { at: 8.2, dur: 2.2, ease: ease.linear });
  tl.hold(13.6, 0.7);

  // — Beat 3 · the fan-out service —
  tl.caption({
    at: 14.3,
    dur: 6,
    text: "Then the write service calls the fan-out service. Its whole job is delivery — getting this tweet into every follower's feed.",
  });
  tl.tween(cam, CAM_FAN, { at: 14.5, dur: 1.4, ease: ease.move });
  tl.tween(fanGlow, 1, { at: 15.4, dur: 0.8, ease: ease.pop });

  // — Beat 4 · who follows? —
  tl.caption({
    at: 20.6,
    dur: 6.5,
    text: 'Step one: ask the user graph service who follows this account. The follower list comes straight out of a memory cache.',
  });
  tl.tween(graphU, 1, { at: 21.4, dur: 2.8, ease: ease.linear });
  tl.tween(listU, 1, { at: 24.4, dur: 0.7, ease: ease.pop });
  tl.hold(27.1, 0.7);

  // — Beat 5 · THE BURST —
  tl.caption({
    at: 27.8,
    dur: 7,
    text: "Step two is the fan-out itself: push the tweet's id onto every follower's home timeline, each one a list held in the same memory cache.",
  });
  tl.tween(cam, CAM_BURST, { at: 28.0, dur: 1.5, ease: ease.move });
  tl.tween(stripsU, 1, { at: 28.2, dur: 1.6, ease: ease.draw });
  tl.tween(burstU, 1, { at: 30.4, dur: 3.6, ease: ease.linear });
  tl.hold(34.8, 0.7);

  // — Beat 6 · seventeen bytes —
  tl.caption({
    at: 35.5,
    dur: 7.5,
    text: 'Zoom in, and each entry is tiny — seventeen bytes. The tweet id, the author id, and one byte of metadata. The text itself lives elsewhere, stored once.',
  });
  tl.tween(cam, CAM_ZOOM, { at: 35.7, dur: 1.6, ease: ease.move });
  tl.tween(byteU, 1, { at: 37.4, dur: 1.2, ease: ease.draw });
  tl.hold(43.0, 0.7);

  // — Beat 7 · the honest price —
  tl.caption({
    at: 43.7,
    dur: 6.5,
    text: 'The price is linear: a thousand followers cost a thousand lookups and inserts. Remember that — it becomes a problem later.',
  });
  tl.tween(cam, CAM_BURST, { at: 43.9, dur: 1.4, ease: ease.move });
  tl.tween(countN, 1000, { at: 44.6, dur: 4.6, ease: ease.move });
  tl.hold(50.2, 0.7);

  // — Beat 8 · side effects —
  tl.caption({
    at: 50.9,
    dur: 6,
    text: 'The same write also feeds the search index, parks media in the object store, and queues up push notifications.',
  });
  tl.tween(cam, CAM_SIDE, { at: 51.1, dur: 1.4, ease: ease.move });
  tl.tween(sideU, 1, { at: 51.9, dur: 1.6, ease: ease.enter });
  tl.hold(56.9, 0.7);

  // — Beat 9 · already delivered —
  tl.caption({
    at: 57.6,
    dur: 7,
    text: "Step back and notice the state we're left in: every follower's feed already contains this tweet, and nobody has read anything yet.",
  });
  tl.tween(cam, CAM_WIDE, { at: 57.8, dur: 1.8, ease: ease.move });
  tl.tween(endU, 1, { at: 59.0, dur: 1.6, ease: ease.move });
  tl.hold(64.6, 1.6);

  return {
    tl, cam, laneU, postU, sqlU, fanGlow, graphU, listU,
    stripsU, burstU, byteU, countN, sideU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');

/** One follower home-timeline strip: a Redis list. `push` 0..1 slides a new
 * head entry in while older entries shift right; the oldest falls off. */
function TimelineStrip({ i, u, push, glowHead, dim }: {
  i: number; u: number; push: number; glowHead: number; dim: number;
}) {
  const y = stripY(i);
  const op = u * (1 - 0.7 * dim);
  if (op <= 0.01) return null;
  const shift = push * CELL_W;
  return (
    <g opacity={op}>
      <text x={STRIPS.x - 10} y={y + STRIPS.h / 2 + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
        follower {i + 1}
      </text>
      <rect x={STRIPS.x} y={y} width={STRIPS.w} height={STRIPS.h} rx={7} fill={colors.PANEL} stroke={colors.GRID} />
      {/* older entries shift right as the new head arrives */}
      {OLD_ALPHA[i].map((a, c) => {
        const cx = STRIPS.x + c * CELL_W + shift;
        if (cx > STRIPS.x + STRIPS.w - CELL_W * 0.4) return null;
        const fade = c === STRIPS.cells - 1 ? 1 - push : 1;
        return (
          <rect key={c} x={cx + 3} y={y + 5} width={CELL_W - 6} height={STRIPS.h - 10} rx={4} fill={colors.MUTED} opacity={a * fade} />
        );
      })}
      {/* the new head — this tweet's id, pushed in */}
      {push > 0 && (
        <g opacity={push}>
          <rect
            x={STRIPS.x + 3 - (1 - push) * CELL_W}
            y={y + 5}
            width={CELL_W - 6}
            height={STRIPS.h - 10}
            rx={4}
            fill={colors.ACCENT}
            opacity={0.5 + 0.5 * push}
          />
          <text x={STRIPS.x + CELL_W / 2 - (1 - push) * CELL_W} y={y + STRIPS.h / 2 + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace">
            987
          </text>
          {glowHead > 0 && (
            <rect x={STRIPS.x + 1} y={y + 3} width={CELL_W - 2} height={STRIPS.h - 6} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={2} opacity={glowHead * 0.9} />
          )}
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam) as CameraState;
  const laneU = s.get(scene.laneU);
  const postU = s.get(scene.postU);
  const sqlU = s.get(scene.sqlU);
  const fanGlow = s.get(scene.fanGlow);
  const graphU = s.get(scene.graphU);
  const listU = s.get(scene.listU);
  const stripsU = s.get(scene.stripsU);
  const burstU = s.get(scene.burstU);
  const byteU = s.get(scene.byteU);
  const countN = s.get(scene.countN);
  const sideU = s.get(scene.sideU);
  const endU = s.get(scene.endU);

  const headX = STRIPS.x + CELL_W / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the write lane */}
        <Connection from={N_CLIENT} to={N_WEB} u={laneU} arrow label="POST /api/v1/tweet" labelSize={10} />
        <Connection from={N_WEB} to={N_WRITE} u={laneU} arrow />
        <Connection from={N_WRITE} to={N_FAN} u={clamp01(fanGlow * 2)} arrow />
        <Connection from={N_WRITE} to={N_SQL} u={sqlU > 0 ? 1 : 0} elbow="v" arrow dim={0.3} />
        <Connection from={N_FAN} to={N_GRAPH} u={graphU > 0 ? 1 : 0} arrow dim={0.3} />
        <ServiceNode {...N_CLIENT} kind="mobile" label="Client" u={laneU} />
        <ServiceNode {...N_WEB} kind="server" label="Web Server" sublabel="reverse proxy" u={laneU} />
        <ServiceNode {...N_WRITE} kind="server" label="Write API" u={laneU} />
        <ServiceNode {...N_FAN} kind="fn" label="Fan Out Service" u={laneU} glow={fanGlow * (1 - 0.6 * endU)} />
        <ServiceNode {...N_GRAPH} kind="cache" label="User Graph Service" sublabel="followers, in Memory Cache" u={graphU > 0 ? 1 : 0} />
        <ServiceNode {...N_SQL} kind="db" label="SQL Database" sublabel="user timeline" u={sqlU > 0 ? 1 : 0} glow={clamp01(sqlU * 2 - 1) * 0.7} />

        {/* the post traveling the lane */}
        <RequestFlow path={[N_CLIENT, N_WEB, N_WRITE]} u={postU} label="tweet" dwell={0.18} hold={false} />
        {/* store-once packet down to SQL */}
        <Packet from={N_WRITE} to={N_SQL} u={sqlU} r={6} color={colors.SECONDARY} label="INSERT ×1" labelSize={10} />
        {/* who-follows round trip */}
        <RequestFlow path={[N_FAN, N_GRAPH]} u={graphU} roundTrip color={colors.WARM} responseColor={colors.POSITIVE} label="who follows?" responseLabel="follower list" turnDwell={0.15} />
        {/* the follower-list chip */}
        <g opacity={listU}>
          <rect x={N_FAN.x - 62} y={N_FAN.y + 44} width={124} height={26} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={N_FAN.x} y={N_FAN.y + 61} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
            followers: 1,000
          </text>
        </g>

        {/* the burst — one packet per strip, staggered */}
        {Array.from({ length: N_STRIPS }, (_, i) => {
          const u = clamp01(burstU * (N_STRIPS / 4 + 1) - i / 4);
          return (
            <Packet
              key={`b${i}`}
              from={{ x: N_FAN.x + 55, y: N_FAN.y }}
              to={{ x: headX, y: stripY(i) + STRIPS.h / 2 }}
              u={u < 1 ? u : 2}
              r={4.5}
              color={colors.ACCENT}
              label="987"
              labelSize={9}
            />
          );
        })}

        {/* the eight follower home timelines */}
        <g>
          <g opacity={stripsU}>
            <text x={STRIPS.x + STRIPS.w / 2} y={STRIPS.y0 - 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              home timelines — one Redis list per follower
            </text>
          </g>
          {Array.from({ length: N_STRIPS }, (_, i) => {
            const arrive = clamp01(burstU * (N_STRIPS / 4 + 1) - i / 4);
            return (
              <TimelineStrip
                key={i}
                i={i}
                u={clamp01(stripsU * 2 - i / N_STRIPS)}
                push={clamp01((arrive - 0.85) / 0.15)}
                glowHead={endU}
                dim={0}
              />
            );
          })}
        </g>

        {/* entry anatomy under strip 3 (zoom beat) */}
        <g opacity={byteU}>
          {(() => {
            const y = stripY(2) + STRIPS.h + 14;
            const bx = STRIPS.x + 3;
            const seg = (CELL_W - 6) * 2.2;
            const parts = [
              { w: seg * (8 / 17), label: 'tweet_id · 8 B', color: colors.ACCENT },
              { w: seg * (8 / 17), label: 'user_id · 8 B', color: colors.SECONDARY },
              { w: seg * (1 / 17), label: '', color: colors.WARM },
            ];
            let x = bx;
            const out = parts.map((p, k) => {
              const el = (
                <g key={k}>
                  <rect x={x} y={y} width={p.w - 2} height={16} rx={3} fill={p.color} opacity={0.8} />
                  {p.label && (
                    <text x={x + p.w / 2} y={y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={7.5} fontFamily="ui-monospace, monospace">
                      {p.label}
                    </text>
                  )}
                </g>
              );
              x += p.w + 2;
              return el;
            });
            return (
              <>
                {out}
                <text x={x + 6} y={y + 12} fill={colors.WARM} fontSize={7.5} fontFamily="ui-monospace, monospace">
                  meta · 1 B
                </text>
                <text x={bx} y={y + 44} fill={colors.MUTED} fontSize={8} fontStyle="italic">
                  one entry = 17 bytes — the text lives in the Tweet Info Service
                </text>
              </>
            );
          })()}
        </g>

        {/* the O(n) counter */}
        {countN > 0 && (
          <g>
            <rect x={620} y={330} width={190} height={72} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <text x={715} y={362} textAnchor="middle" fill={colors.WARM} fontSize={22} fontWeight={700} fontFamily="ui-monospace, monospace">
              {fmt(countN)}
            </text>
            <text x={715} y={384} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              lookups + inserts
            </text>
            <MathLabel tex="O(n)" x={715} y={318} fontSize={17} color={colors.WARM} opacity={clamp01(countN / 400)} anchor="middle" />
          </g>
        )}

        {/* side effects — supporting cast, brief */}
        <g opacity={sideU * (1 - 0.75 * endU)}>
          <Connection from={{ x: N_FAN.x - 20, y: N_FAN.y + 28 }} to={{ x: N_SEARCH.x, y: N_SEARCH.y - 34 }} elbow="v" u={sideU} arrow dim={0.35} />
          <Connection from={{ x: N_FAN.x - 10, y: N_FAN.y + 28 }} to={{ x: N_STORE.x, y: N_STORE.y - 34 }} elbow="v" u={sideU} arrow dim={0.35} />
          <Connection from={{ x: N_FAN.x, y: N_FAN.y + 28 }} to={{ x: N_QUEUE.x, y: N_QUEUE.y - 34 }} elbow="v" u={sideU} arrow dim={0.35} />
          <ServiceNode {...N_SEARCH} kind="search" label="Search Index" sublabel="Service" u={sideU} />
          <ServiceNode {...N_STORE} kind="storage" label="Object Store" sublabel="media" u={sideU} />
          <ServiceNode {...N_QUEUE} kind="queue" label="Queue" sublabel="Notification Service" u={sideU} />
        </g>

        {/* closing chip — delivered before anyone asked */}
        <g opacity={endU}>
          <rect x={330} y={588} width={620} height={34} rx={17} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
          <text x={640} y={610} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            delivered at write time — before a single read
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
