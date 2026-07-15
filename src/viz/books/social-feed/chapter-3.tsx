// Fan-Out on Write: A Mailbox for Everyone
//
// Backing: solutions/system_design/twitter/README.md — "Use case: User posts
// a tweet": Client → Web Server (reverse proxy) → Write API → SQL database
// (own user timeline), then the Fan Out Service queries the User Graph
// Service and stores the tweet in every follower's home timeline in the
// Memory Cache (O(n): 1,000 followers = 1,000 lookups and inserts), plus the
// Search Index Service, Object Store, and Notification Service via a Queue.
// The Redis list entry layout (tweet_id 8 bytes | user_id 8 bytes | meta
// 1 byte) is verbatim from the README.
// Centerpiece: the fan — one packet splitting into a spray that rains into a
// wall of mailboxes, then a camera dive into one mailbox's 17-byte entries.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout — write path on the left, the Memory Cache mailbox wall on the right.
// ---------------------------------------------------------------------------

const CLIENT = { x: 120, y: 150 } as const;
const WEB = { x: 310, y: 150 } as const;
const WRITE_API = { x: 520, y: 150 } as const;
const SQL = { x: 520, y: 330 } as const;
const FANOUT = { x: 730, y: 150 } as const;
const UGRAPH = { x: 730, y: 330 } as const;

const WALL = { x: 880, y: 88, w: 372, h: 442 } as const;
const N_ROWS = 8;
const ROW_X = 896;
const ROW_W = 336;
const ROW_H = 36;
const rowY = (i: number): number => 132 + i * 48;

const rand = mulberry32(1000);
/** Follower ids for the mailbox rows — the README's 1,000-follower example. */
const ROW_IDS: string[] = Array.from({ length: N_ROWS }, () => `user ${100 + Math.floor(rand() * 890)}`);
/** Each mailbox starts with a few old entries (dim). */
const OLD_ENTRIES: number[] = Array.from({ length: N_ROWS }, () => 2 + Math.floor(rand() * 2));

// side effects (README: search index, object store, notifications via queue)
const SEARCH = { x: 200, y: 480 } as const;
const OBJSTORE = { x: 420, y: 480 } as const;
const NOTIFY = { x: 640, y: 480 } as const;

// the reader (beat 9)
const READER = { x: 165, y: 500 } as const;

// camera marks
const CAM_PATH: CameraState = { x: 430, y: 210, k: 1.3 };
const CAM_FAN: CameraState = { x: 920, y: 300, k: 1.1 };
const CAM_ROW: CameraState = { x: 1020, y: 300, k: 1.9 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pathU: ChannelRef<number>;
  tweetU: ChannelRef<number>;
  sqlPkU: ChannelRef<number>;
  sqlGlow: ChannelRef<number>;
  gqU: ChannelRef<number>;
  wallU: ChannelRef<number>;
  sprayU: ChannelRef<number>;
  onU: ChannelRef<number>;
  countU: ChannelRef<number>;
  byteU: ChannelRef<number>;
  sideU: ChannelRef<number>;
  sidePkU: ChannelRef<number>;
  sideDim: ChannelRef<number>;
  readerU: ChannelRef<number>;
  readPkU: ChannelRef<number>;
  o1U: ChannelRef<number>;
  compareU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pathU = tl.channel('pathU', 0);
  const tweetU = tl.channel('tweetU', 0);
  const sqlPkU = tl.channel('sqlPkU', 0);
  const sqlGlow = tl.channel('sqlGlow', 0);
  const gqU = tl.channel('gqU', 0);
  const wallU = tl.channel('wallU', 0);
  const sprayU = tl.channel('sprayU', 0);
  const onU = tl.channel('onU', 0);
  const countU = tl.channel('countU', 0);
  const byteU = tl.channel('byteU', 0);
  const sideU = tl.channel('sideU', 0);
  const sidePkU = tl.channel('sidePkU', 0);
  const sideDim = tl.channel('sideDim', 0);
  const readerU = tl.channel('readerU', 0);
  const readPkU = tl.channel('readPkU', 0);
  const o1U = tl.channel('o1U', 0);
  const compareU = tl.channel('compareU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · door number two —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Door number two: fan-out on write. The moment a tweet is posted, deliver a copy to every follower’s feed — before anyone asks to see it.',
  });
  tl.tween(pathU, 1, { at: 0.7, dur: 1.8, ease: ease.linear });
  tl.tween(cam, CAM_PATH, { at: 0.9, dur: 1.6, ease: ease.move });

  // — Beat 2 · you hit send —
  tl.caption({
    at: 7.5,
    dur: 5.2,
    text: 'You hit send. The tweet reaches a web server, which hands it to the write service.',
  });
  tl.tween(tweetU, 1, { at: 8.0, dur: 3.2, ease: ease.linear });

  // — Beat 3 · stored once, under your name —
  tl.caption({
    at: 13.1,
    dur: 5.7,
    text: 'First stop: your own timeline. The tweet is written once into the relational database, under your name.',
  });
  tl.tween(sqlPkU, 1, { at: 13.8, dur: 1.6, ease: ease.linear });
  tl.tween(sqlGlow, 1, { at: 15.4, dur: 0.5, ease: ease.pop });
  tl.tween(sqlGlow, 0, { at: 17.2, dur: 0.8, ease: ease.enter });

  // — Beat 4 · who follows this person —
  tl.caption({
    at: 19.2,
    dur: 5.9,
    text: 'Then the fan out service takes over. It asks the user graph service one question: who follows this person?',
  });
  tl.tween(gqU, 2, { at: 20.0, dur: 3.0, ease: ease.linear });

  // — Beat 5 · a thousand mailboxes —
  tl.caption({
    at: 25.5,
    dur: 6.3,
    text: 'Say a thousand people do. Every one of them owns a mailbox — a home timeline list, waiting in the memory cache.',
  });
  tl.tween(cam, CAM_FAN, { at: 25.7, dur: 1.7, ease: ease.move });
  tl.tween(wallU, 1, { at: 26.4, dur: 2.6, ease: ease.linear });

  // — Beat 6 · the spray —
  tl.caption({
    at: 32.2,
    dur: 7.0,
    text: 'The fan opens: a thousand lookups, a thousand inserts. One tweet becomes a thousand copies, each dropped at the front of a follower’s mailbox.',
  });
  tl.tween(sprayU, 1, { at: 32.8, dur: 4.6, ease: ease.linear });
  tl.tween(onU, 1, { at: 33.4, dur: 0.6, ease: ease.enter });
  tl.tween(countU, 1, { at: 36.6, dur: 0.6, ease: ease.pop });
  tl.hold(39.2, 0.5);

  // — Beat 7 · seventeen bytes —
  tl.caption({
    at: 39.7,
    dur: 7.6,
    text: 'Zoom into one mailbox. Each entry is tiny — a tweet id, a user id, and one byte of metadata. Seventeen bytes per delivery, not the whole tweet.',
  });
  tl.tween(cam, CAM_ROW, { at: 39.9, dur: 1.8, ease: ease.move });
  tl.tween(byteU, 1, { at: 41.6, dur: 1.4, ease: ease.draw });
  tl.hold(46.8, 0.5);

  // — Beat 8 · everything else, off the read path —
  tl.caption({
    at: 47.3,
    dur: 6.9,
    text: 'The same write also feeds the search index, parks the photo in an object store, and queues up push notifications. All of it stays off the read path.',
  });
  tl.tween(cam, CAM_WIDE, { at: 47.5, dur: 1.7, ease: ease.move });
  tl.tween(byteU, 0, { at: 47.5, dur: 0.8, ease: ease.enter });
  tl.tween(sideU, 1, { at: 48.4, dur: 1.6, ease: ease.linear });
  tl.tween(sidePkU, 1, { at: 49.6, dur: 2.4, ease: ease.linear });
  tl.tween(sideDim, 1, { at: 53.2, dur: 1.0, ease: ease.move });

  // — Beat 9 · the read is a lookup —
  tl.caption({
    at: 54.7,
    dur: 6.8,
    text: 'Now watch a read. A follower opens the app — and the feed is already sitting there, sorted. One cache lookup, constant time.',
  });
  tl.tween(readerU, 1, { at: 55.2, dur: 0.8, ease: ease.enter });
  tl.tween(readPkU, 1, { at: 56.4, dur: 2.6, ease: ease.linear });
  tl.tween(o1U, 1, { at: 59.0, dur: 0.6, ease: ease.pop });
  tl.hold(61.0, 0.5);

  // — Beat 10 · compare the bills —
  tl.caption({
    at: 61.5,
    dur: 8.3,
    text: 'Compare the bills. Fan-out on read paid at read time, one hundred thousand times a second. Fan-out on write pays sixty thousand small deliveries a second — and reads cost almost nothing.',
  });
  tl.tween(compareU, 1, { at: 62.2, dur: 1.2, ease: ease.enter });
  tl.hold(69.8, 0.5);

  // — Beat 11 · until one user posts —
  tl.caption({
    at: 70.3,
    dur: 6.2,
    text: 'Writes do the work, reads get the speed. It seems perfect — until one particular kind of user hits send. That story is next.',
  });
  tl.tween(endDim, 1, { at: 70.5, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 71.4, dur: 0.9, ease: ease.pop });
  tl.hold(76.5, 1.5);

  return {
    tl,
    cam,
    pathU,
    tweetU,
    sqlPkU,
    sqlGlow,
    gqU,
    wallU,
    sprayU,
    onU,
    countU,
    byteU,
    sideU,
    sidePkU,
    sideDim,
    readerU,
    readPkU,
    o1U,
    compareU,
    endDim,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** One mailbox row: id chip + entry slots; a new entry lands at the head. */
function MailboxRow({ i, u, landed }: { i: number; u: number; landed: number }) {
  if (u <= 0.001) return null;
  const e = ease.enter(u);
  const y = rowY(i);
  const land = ease.pop(landed);
  return (
    <g opacity={e} transform={`translate(0, ${8 * (1 - e)})`}>
      <rect x={ROW_X} y={y} width={ROW_W} height={ROW_H} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={ROW_X + 8} y={y + 23} fill={colors.MUTED} fontSize={10.5} fontFamily={colors.font.mono}>
        {ROW_IDS[i]}
      </text>
      {/* old entries, dim */}
      {Array.from({ length: OLD_ENTRIES[i] }, (_, k) => (
        <rect
          key={k}
          x={ROW_X + 96 + (k + 1) * 52 - 52 * (1 - land) * 0}
          y={y + 6}
          width={46}
          height={ROW_H - 12}
          rx={5}
          fill={colors.MUTED}
          opacity={0.22}
          transform={landed > 0.01 ? `translate(${8 * land}, 0)` : undefined}
        />
      ))}
      {/* the fresh copy at the head */}
      {landed > 0.01 && (
        <g transform={`translate(${ROW_X + 96}, ${y + 6}) scale(${0.7 + 0.3 * land})`} opacity={land}>
          <rect width={46} height={ROW_H - 12} rx={5} fill={colors.ACCENT} opacity={0.9} />
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pathU = s.get(scene.pathU);
  const tweetU = s.get(scene.tweetU);
  const sqlPkU = s.get(scene.sqlPkU);
  const sqlGlow = s.get(scene.sqlGlow);
  const gqU = s.get(scene.gqU);
  const wallU = s.get(scene.wallU);
  const sprayU = s.get(scene.sprayU);
  const onU = s.get(scene.onU);
  const countU = s.get(scene.countU);
  const byteU = s.get(scene.byteU);
  const sideU = s.get(scene.sideU);
  const sidePkU = s.get(scene.sidePkU);
  const sideDimV = 1 - 0.8 * s.get(scene.sideDim);
  const readerU = s.get(scene.readerU);
  const readPkU = s.get(scene.readPkU);
  const o1U = s.get(scene.o1U);
  const compareU = s.get(scene.compareU);
  const endDimV = 1 - 0.87 * s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const focusRow = 3;
  const fy = rowY(focusRow);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={endDimV}>
          {/* write path */}
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="mobile" label="Client" u={clamp01(pathU * 5)} />
          <ServiceNode x={WEB.x} y={WEB.y} kind="server" label="Web Server" sublabel="reverse proxy" u={clamp01(pathU * 5 - 0.6)} />
          <ServiceNode x={WRITE_API.x} y={WRITE_API.y} kind="gateway" label="Write API" u={clamp01(pathU * 5 - 1.2)} />
          <ServiceNode x={SQL.x} y={SQL.y} kind="db" label="SQL Database" sublabel="user timeline" u={clamp01(pathU * 5 - 1.8)} glow={sqlGlow} />
          <ServiceNode x={FANOUT.x} y={FANOUT.y} kind="fn" label="Fan Out Service" u={clamp01(pathU * 5 - 2.4)} />
          <ServiceNode x={UGRAPH.x} y={UGRAPH.y} kind="cache" label="User Graph Service" u={clamp01(pathU * 5 - 3.0)} />

          <Connection from={{ x: CLIENT.x + 42, y: CLIENT.y }} to={{ x: WEB.x - 52, y: WEB.y }} u={clamp01(pathU * 3)} arrow />
          <Connection from={{ x: WEB.x + 52, y: WEB.y }} to={{ x: WRITE_API.x - 52, y: WRITE_API.y }} u={clamp01(pathU * 3 - 0.5)} arrow />
          <Connection from={{ x: WRITE_API.x, y: WRITE_API.y + 30 }} to={{ x: SQL.x, y: SQL.y - 30 }} u={clamp01(pathU * 3 - 1)} arrow />
          <Connection from={{ x: WRITE_API.x + 52, y: WRITE_API.y }} to={{ x: FANOUT.x - 56, y: FANOUT.y }} u={clamp01(pathU * 3 - 1.5)} arrow />
          <Connection from={{ x: FANOUT.x, y: FANOUT.y + 30 }} to={{ x: UGRAPH.x, y: UGRAPH.y - 30 }} u={clamp01(pathU * 3 - 2)} dashed arrow />

          {/* the tweet, hop by hop */}
          <RequestFlow
            path={[CLIENT, WEB, WRITE_API, FANOUT]}
            u={tweetU}
            color={colors.ACCENT}
            r={9}
            label="tweet"
            dwell={0.22}
            hold
          />
          <Packet from={{ x: WRITE_API.x, y: WRITE_API.y + 34 }} to={{ x: SQL.x, y: SQL.y - 34 }} u={sqlPkU} color={colors.POSITIVE} label="insert" />
          {/* graph query down, follower list back up */}
          <Packet from={{ x: FANOUT.x, y: FANOUT.y + 34 }} to={{ x: UGRAPH.x, y: UGRAPH.y - 34 }} u={clamp01(gqU)} color={colors.SECONDARY} label="who follows?" />
          <Packet from={{ x: UGRAPH.x, y: UGRAPH.y - 34 }} to={{ x: FANOUT.x, y: FANOUT.y + 34 }} u={clamp01(gqU - 1)} color={colors.SECONDARY} label="1,000 followers" />

          {/* the mailbox wall */}
          <Zone x={WALL.x} y={WALL.y} w={WALL.w} h={WALL.h} label="Memory Cache — home timelines" kind="group" u={wallU} color={colors.ACCENT} />
          {Array.from({ length: N_ROWS }, (_, i) => (
            <MailboxRow key={i} i={i} u={win(wallU, N_ROWS, i, 3)} landed={win(sprayU, N_ROWS, i, 2.2) >= 1 ? 1 : win(sprayU, N_ROWS, i, 2.2)} />
          ))}
          {/* the spray */}
          {Array.from({ length: N_ROWS }, (_, i) => (
            <Packet
              key={i}
              from={{ x: FANOUT.x + 30, y: FANOUT.y + 10 }}
              to={{ x: ROW_X + 96 + 23, y: rowY(i) + ROW_H / 2 }}
              u={win(sprayU, N_ROWS, i, 2.2)}
              r={6}
              color={colors.ACCENT}
            />
          ))}
          <MathLabel tex="O(n)" x={FANOUT.x + 66} y={FANOUT.y - 44} fontSize={24} color={colors.WARM} opacity={onU * endDimV} />
          {countU > 0.01 && (
            <g opacity={countU} transform={`translate(${WALL.x + WALL.w / 2}, ${WALL.y + WALL.h + 26}) scale(${0.85 + 0.15 * countU})`}>
              <text textAnchor="middle" fill={colors.WARM} fontSize={17} fontWeight={700}>
                1,000 lookups · 1,000 inserts
              </text>
            </g>
          )}

          {/* the 17-byte entry, annotated in the zoomed row */}
          {byteU > 0.01 && (
            <g opacity={byteU}>
              <rect x={ROW_X + 92} y={fy - 66} width={244} height={54} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.4} />
              {(() => {
                const total = 8 + 8 + 1;
                const w0 = 220;
                const parts = [
                  { label: 'tweet_id', b: 8, color: colors.ACCENT },
                  { label: 'user_id', b: 8, color: colors.SECONDARY },
                  { label: 'meta', b: 1, color: colors.WARM },
                ];
                let x0 = ROW_X + 104;
                return parts.map((p) => {
                  const w = (w0 * p.b) / total;
                  const el = (
                    <g key={p.label}>
                      <rect x={x0} y={fy - 58} width={w - 3} height={20} rx={4} fill={p.color} opacity={0.75} />
                      <text x={x0 + 2} y={fy - 24} fill={colors.MUTED} fontSize={9.5} fontFamily={colors.font.mono}>
                        {p.label} · {p.b} B
                      </text>
                    </g>
                  );
                  x0 += w + 4;
                  return el;
                });
              })()}
              <line x1={ROW_X + 119} y1={fy - 10} x2={ROW_X + 119} y2={fy + 4} stroke={colors.ACCENT} strokeWidth={1.4} opacity={0.8} />
              <text x={ROW_X + 336} y={fy - 44} textAnchor="end" fill={colors.TEXT} fontSize={12} fontWeight={600}>
                = 17 bytes
              </text>
            </g>
          )}

          {/* side effects — one beat, then dimmed */}
          <g opacity={sideDimV}>
            <ServiceNode x={SEARCH.x} y={SEARCH.y} kind="search" label="Search Index" u={clamp01(sideU * 3)} />
            <ServiceNode x={OBJSTORE.x} y={OBJSTORE.y} kind="storage" label="Object Store" sublabel="media" u={clamp01(sideU * 3 - 0.8)} />
            <ServiceNode x={NOTIFY.x} y={NOTIFY.y} kind="queue" label="Notifications" sublabel="via queue" u={clamp01(sideU * 3 - 1.6)} />
            {[SEARCH, OBJSTORE, NOTIFY].map((n, i) => (
              <Packet
                key={i}
                from={{ x: FANOUT.x, y: FANOUT.y + 30 }}
                to={{ x: n.x, y: n.y - 34 }}
                u={win(sidePkU, 3, i, 1.6)}
                r={5.5}
                color={colors.MUTED}
              />
            ))}
          </g>

          {/* the reader — one hop, constant time */}
          {readerU > 0.01 && (
            <g opacity={readerU}>
              <circle cx={READER.x} cy={READER.y} r={24} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
              <circle cx={READER.x} cy={READER.y - 5} r={6} fill={colors.WARM} opacity={0.9} />
              <path d={`M${READER.x - 11} ${READER.y + 13} Q${READER.x} ${READER.y} ${READER.x + 11} ${READER.y + 13}`} fill={colors.WARM} opacity={0.9} />
              <text x={READER.x} y={READER.y + 45} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
                a follower reads
              </text>
            </g>
          )}
          <Packet
            from={{ x: ROW_X + 40, y: rowY(0) + ROW_H / 2 }}
            to={{ x: READER.x + 20, y: READER.y - 20 }}
            u={readPkU}
            r={7}
            color={colors.WARM}
            label="feed, presorted"
          />
          <MathLabel tex="O(1)" x={READER.x + 96} y={READER.y - 64} fontSize={24} color={colors.POSITIVE} opacity={o1U * endDimV} />
        </g>

        {/* the two bills, side by side */}
        {compareU > 0.01 && (
          <g opacity={compareU}>
            <rect x={330} y={556} width={620} height={56} rx={12} fill={colors.BG} stroke={colors.GRID} opacity={0.95} />
            <text x={348} y={579} fill={colors.MUTED} fontSize={12.5}>
              read cost · pull
            </text>
            <rect x={480} y={568} width={300} height={14} rx={4} fill={colors.WARM} opacity={0.85} />
            <text x={348} y={602} fill={colors.MUTED} fontSize={12.5}>
              read cost · push
            </text>
            <rect x={480} y={591} width={16} height={14} rx={4} fill={colors.POSITIVE} opacity={0.95} />
            <text x={800} y={580} fill={colors.WARM} fontSize={12.5}>
              merge on demand
            </text>
            <text x={506} y={602} fill={colors.POSITIVE} fontSize={12.5}>
              one lookup
            </text>
          </g>
        )}

        {/* closing chip */}
        {endU > 0.01 && (
          <g opacity={endU} transform={`translate(640, ${300 + 14 * (1 - ease.pop(endU))})`}>
            <rect x={-330} y={-86} width={660} height={172} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
            <text y={-26} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              fan-out on write
            </text>
            <text y={12} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
              writes do the work · reads get the speed
            </text>
            <text y={52} textAnchor="middle" fill={colors.WARM} fontSize={17}>
              next: the user who breaks the fan
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
