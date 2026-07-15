// Fan-Out on Read: Build It When Asked
//
// Backing: solutions/system_design/twitter/README.md — the pull model the
// README uses as its cache-miss rebuild path ("Query the User Graph Service
// to determine who the user is following; get the tweets from the SQL
// Database and add them to the Memory Cache") plus the read-heavy constraint
// (250 billion reads/month → ~100,000 reads/sec). User ids 123/456/789 echo
// the README's REST API examples.
// Centerpiece: a five-way merge zipper — sorted lanes of tweets zipping into
// one feed column, then the camera pulls back to a wall of identical merge
// machines running one hundred thousand times a second.
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
import { NodeBadge } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// The merge data — five followed accounts, four tweets each, distinct
// minutes-ago timestamps from one seeded PRNG. The merged order is an honest
// sort; the zipper animates exactly that computation.
// ---------------------------------------------------------------------------

const rand = mulberry32(456789);

const ACCOUNTS = [
  { id: 'user 456', color: colors.ACCENT },
  { id: 'user 789', color: colors.POSITIVE },
  { id: 'user 321', color: colors.SECONDARY },
  { id: 'user 654', color: colors.WARM },
  { id: 'user 987', color: colors.NEGATIVE },
] as const;
const N_ACC = ACCOUNTS.length;
const PER = 4;

/** 20 unique minutes-ago values, dealt 4 to each account, sorted per lane. */
const MINUTES: number[][] = (() => {
  const pool = Array.from({ length: 60 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: N_ACC }, (_, a) =>
    pool.slice(a * PER, a * PER + PER).sort((x, y) => x - y),
  );
})();

interface Tweet {
  acc: number;
  slot: number; // position within its lane (0 = newest, leftmost)
  min: number; // minutes ago
  rank: number; // merged feed position (0 = newest, top)
}

const TWEETS: Tweet[] = (() => {
  const all: Tweet[] = [];
  MINUTES.forEach((mins, acc) =>
    mins.forEach((min, slot) => all.push({ acc, slot, min, rank: 0 })),
  );
  const byTime = [...all].sort((x, y) => x.min - y.min);
  byTime.forEach((t, r) => (t.rank = r));
  return all;
})();
const TOTAL = TWEETS.length;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const YOU = { x: 170, y: 360 } as const;
const GRAPH_NODE = { x: 170, y: 120 } as const;
const ACC_X = 395;
const ACC_Y = (a: number): number => 140 + a * 105;
const LANE_X0 = 445;
const CHIP_W = 82;
const CHIP_H = 46;
const chipLanePos = (t: Tweet) => ({
  x: LANE_X0 + CHIP_W / 2 + t.slot * (CHIP_W + 10),
  y: ACC_Y(t.acc),
});

const FEED_X = 1010;
const FEED_W = 196;
const SLOT_H = 23.5;
const FEED_Y0 = 128;
const slotPos = (rank: number) => ({ x: FEED_X, y: FEED_Y0 + SLOT_H / 2 + rank * SLOT_H });

// latency meter (top strip, right of the graph)
const METER = { x: 60, y: 592, w: 560 } as const;
const SEGS = [
  { label: 'graph lookup', w: 90, color: colors.SECONDARY },
  { label: 'fetch × 5 accounts', w: 300, color: colors.ACCENT },
  { label: 'merge + sort', w: 130, color: colors.WARM },
] as const;

// clone grid
const CLONE_COLS = 8;
const CLONE_ROWS = 4;
const CLONES = CLONE_COLS * CLONE_ROWS;

// camera marks
const CAM_YOU: CameraState = { x: 330, y: 340, k: 1.35 };
const CAM_FEED: CameraState = { x: 880, y: 360, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  youU: ChannelRef<number>;
  feedGhostU: ChannelRef<number>;
  graphU: ChannelRef<number>;
  accU: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  sqlU: ChannelRef<number>;
  mergeU: ChannelRef<number>;
  meterU: ChannelRef<number>;
  segsU: ChannelRef<number>;
  rigDim: ChannelRef<number>;
  cloneU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const youU = tl.channel('youU', 0);
  const feedGhostU = tl.channel('feedGhostU', 0);
  const graphU = tl.channel('graphU', 0);
  const accU = tl.channel('accU', 0);
  const lanesU = tl.channel('lanesU', 0);
  const sqlU = tl.channel('sqlU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const meterU = tl.channel('meterU', 0);
  const segsU = tl.channel('segsU', 0);
  const rigDim = tl.channel('rigDim', 0);
  const cloneU = tl.channel('cloneU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · door number one —
  tl.caption({
    at: 0.5,
    dur: 6.3,
    text: 'Door number one: fan-out on read. Store every tweet exactly once, and assemble your feed at the moment you ask for it.',
  });
  tl.tween(youU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_YOU, { at: 0.8, dur: 1.5, ease: ease.move });

  // — Beat 2 · the feed does not exist yet —
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'You open the app. Your feed does not exist yet — right now it is just a question: what did the people I follow say recently?',
  });
  tl.tween(feedGhostU, 1, { at: 8.0, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 8.4, dur: 1.6, ease: ease.move });
  tl.hold(13.4, 0.5);

  // — Beat 3 · who do you follow —
  tl.caption({
    at: 13.9,
    dur: 5.6,
    text: 'Step one: the user graph service answers who you follow. Five accounts light up.',
  });
  tl.tween(graphU, 1, { at: 14.2, dur: 1.2, ease: ease.draw });
  tl.tween(accU, 1, { at: 15.4, dur: 2.0, ease: ease.linear });
  tl.hold(19.5, 0.5);

  // — Beat 4 · fetch each timeline —
  tl.caption({
    at: 20.0,
    dur: 6.8,
    text: 'Step two: for each of those accounts, fetch their recent tweets from the relational database. One followed account, one query.',
  });
  tl.tween(sqlU, 1, { at: 20.3, dur: 0.7, ease: ease.enter });
  tl.tween(lanesU, 1, { at: 21.0, dur: 3.6, ease: ease.linear });
  tl.hold(26.8, 0.5);

  // — Beat 5 · the zipper —
  tl.caption({
    at: 27.3,
    dur: 6.4,
    text: 'Step three: merge. Twenty tweets, five sorted lists, one zipper — newest first, one feed.',
  });
  tl.tween(cam, CAM_FEED, { at: 27.5, dur: 1.6, ease: ease.move });
  tl.tween(mergeU, 1, { at: 28.3, dur: 7.5, ease: ease.linear });
  tl.hold(35.8, 0.8);

  // — Beat 6 · it works —
  tl.caption({
    at: 36.6,
    dur: 5.8,
    text: 'And it works. Nothing was wasted on people who never showed up, and every feed is perfectly fresh.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 36.8, dur: 1.6, ease: ease.move });
  tl.hold(42.4, 0.5);

  // — Beat 7 · the bill —
  tl.caption({
    at: 42.9,
    dur: 7.3,
    text: 'But look at the bill. A graph lookup, then a database fetch for every account you follow, then a sort — all of it while you stare at a spinner.',
  });
  tl.tween(meterU, 1, { at: 43.2, dur: 0.7, ease: ease.enter });
  tl.tween(segsU, 1, { at: 43.9, dur: 3.2, ease: ease.linear });
  tl.hold(50.2, 0.5);

  // — Beat 8 · times one hundred thousand —
  tl.caption({
    at: 50.7,
    dur: 6.3,
    text: 'Now remember the other number. This little assembly line runs one hundred thousand times every second.',
  });
  tl.tween(rigDim, 1, { at: 51.0, dur: 1.2, ease: ease.move });
  tl.tween(cloneU, 1, { at: 52.0, dur: 3.4, ease: ease.linear });
  tl.hold(57.0, 0.5);

  // — Beat 9 · the worst possible moment —
  tl.caption({
    at: 57.5,
    dur: 6.6,
    text: 'Fan-out on read puts all the work on the read path — the exact path we swore to keep fast. The feed is assembled at the worst possible moment.',
  });
  tl.hold(64.1, 0.5);

  // — Beat 10 · door two —
  tl.caption({
    at: 64.6,
    dur: 5.9,
    text: 'What if your feed already existed before you asked for it? That is door number two.',
  });
  tl.tween(cloneU, 0.15, { at: 64.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 65.4, dur: 0.9, ease: ease.pop });
  tl.hold(70.5, 1.5);

  return {
    tl,
    cam,
    youU,
    feedGhostU,
    graphU,
    accU,
    lanesU,
    sqlU,
    mergeU,
    meterU,
    segsU,
    rigDim,
    cloneU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function TweetChip({ t, mergeP, laneU }: { t: Tweet; mergeP: number; laneU: number }) {
  const appear = win(laneU, TOTAL, t.acc * PER + t.slot, 6);
  if (appear <= 0.001) return null;
  const fly = ease.move(win(mergeP, TOTAL, t.rank, 5));
  const from = chipLanePos(t);
  const to = slotPos(t.rank);
  const x = lerp(from.x, to.x, fly);
  const y = lerp(from.y, to.y, fly) - Math.sin(Math.PI * fly) * 46;
  const w = lerp(CHIP_W, FEED_W - 12, fly);
  const h = lerp(CHIP_H, SLOT_H - 4, fly);
  const e = ease.enter(appear);
  const color = ACCOUNTS[t.acc].color;
  return (
    <g opacity={e} transform={`translate(${x}, ${y - 8 * (1 - e)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <circle cx={-w / 2 + 12} cy={0} r={4.5} fill={color} opacity={0.9} />
      <text x={-w / 2 + 24} y={4.5} fill={colors.MUTED} fontSize={12.5} fontFamily={colors.font.mono}>
        {t.min}m
      </text>
      {fly < 0.5 && (
        <rect x={-w / 2 + 12} y={8} width={w * 0.6} height={5} rx={2.5} fill={colors.MUTED} opacity={0.35 * (1 - fly * 2)} />
      )}
    </g>
  );
}

/** A tiny replica of the whole rig — the ×100,000 wall. */
function CloneGlyph({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0.001) return null;
  const e = ease.enter(u);
  return (
    <g transform={`translate(${x}, ${y + 10 * (1 - e)})`} opacity={e * 0.8}>
      <rect x={-46} y={-32} width={92} height={64} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
      {[0, 1, 2].map((r) => (
        <line key={r} x1={-34} y1={-14 + r * 14} x2={2} y2={-14 + r * 14} stroke={colors.MUTED} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
      ))}
      <path d="M8 -14 L26 0 L8 14" fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.8} />
      <rect x={30} y={-16} width={8} height={32} rx={3} fill={colors.WARM} opacity={0.6} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const youU = s.get(scene.youU);
  const feedGhostU = s.get(scene.feedGhostU);
  const graphU = s.get(scene.graphU);
  const accU = s.get(scene.accU);
  const lanesU = s.get(scene.lanesU);
  const sqlU = s.get(scene.sqlU);
  const mergeU = s.get(scene.mergeU);
  const meterU = s.get(scene.meterU);
  const segsU = s.get(scene.segsU);
  const rigDim = 1 - 0.88 * s.get(scene.rigDim);
  const cloneU = s.get(scene.cloneU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={rigDim}>
          {/* you */}
          <g opacity={youU}>
            <circle cx={YOU.x} cy={YOU.y} r={26} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={2} />
            <circle cx={YOU.x} cy={YOU.y - 6} r={7} fill={colors.TEXT} opacity={0.85} />
            <path d={`M${YOU.x - 12} ${YOU.y + 14} Q${YOU.x} ${YOU.y - 2} ${YOU.x + 12} ${YOU.y + 14}`} fill={colors.TEXT} opacity={0.85} />
            <text x={YOU.x} y={YOU.y + 48} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
              you
            </text>
            <text x={YOU.x} y={YOU.y + 66} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={colors.font.mono}>
              user_id 123
            </text>
          </g>

          {/* user graph service */}
          <NodeBadge x={GRAPH_NODE.x} y={GRAPH_NODE.y} w={172} h={46} label="User Graph Service" color={colors.SECONDARY} u={graphU} labelSize={13.5} />
          {graphU > 0.01 && (
            <line x1={YOU.x} y1={YOU.y - 28} x2={GRAPH_NODE.x} y2={GRAPH_NODE.y + 25} stroke={colors.SECONDARY} strokeWidth={1.8} strokeDasharray="5 5" opacity={0.6 * graphU} />
          )}

          {/* follow edges + accounts + lanes */}
          {ACCOUNTS.map((a, i) => {
            const u = win(accU, N_ACC, i, 2.4);
            const e = ease.enter(u);
            const y = ACC_Y(i);
            const laneFill = win(lanesU, N_ACC, i, 2.4);
            return (
              <g key={a.id}>
                {u > 0.001 && (
                  <>
                    <path
                      d={`M${YOU.x + 26} ${YOU.y} Q${(YOU.x + ACC_X) / 2 + 40} ${(YOU.y + y) / 2} ${ACC_X - 22} ${y}`}
                      fill="none"
                      stroke={a.color}
                      strokeWidth={2}
                      opacity={0.5 * e}
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - e}
                    />
                    <g opacity={e}>
                      <circle cx={ACC_X} cy={y} r={17} fill={colors.PANEL} stroke={a.color} strokeWidth={2.2} />
                      <circle cx={ACC_X} cy={y - 3} r={4.5} fill={a.color} />
                      <path d={`M${ACC_X - 8} ${y + 10} Q${ACC_X} ${y} ${ACC_X + 8} ${y + 10}`} fill={a.color} opacity={0.9} />
                      <text x={ACC_X} y={y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={colors.font.mono}>
                        {a.id}
                      </text>
                    </g>
                  </>
                )}
                {laneFill > 0.001 && (
                  <rect x={LANE_X0 - 8} y={y - 30} width={(CHIP_W + 10) * PER + 12} height={60} rx={10} fill={colors.PANEL} stroke={colors.GRID} opacity={0.55 * clamp01(laneFill * 3)} />
                )}
              </g>
            );
          })}

          {/* SQL database, feeding the lanes */}
          <NodeBadge x={640} y={52} w={140} h={42} label="SQL Database" sublabel="tweets, stored once" color={colors.POSITIVE} u={sqlU} labelSize={13.5} />

          {/* the feed column */}
          <g opacity={feedGhostU}>
            <rect x={FEED_X - FEED_W / 2} y={FEED_Y0 - 14} width={FEED_W} height={TOTAL * SLOT_H + 28} rx={14} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.6} opacity={0.75} />
            <text x={FEED_X} y={FEED_Y0 - 26} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              your home timeline
            </text>
            {mergeU < 0.02 && (
              <text x={FEED_X} y={FEED_Y0 + 10 * SLOT_H} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic" opacity={0.7}>
                ?
              </text>
            )}
          </g>

          {/* every tweet — in its lane, in flight, or landed */}
          {TWEETS.map((t) => (
            <TweetChip key={`${t.acc}-${t.slot}`} t={t} mergeP={mergeU} laneU={lanesU} />
          ))}

          {/* the latency meter */}
          {meterU > 0.01 && (
            <g opacity={meterU}>
              <text x={METER.x} y={METER.y - 14} fill={colors.MUTED} fontSize={14}>
                time the reader spends waiting
              </text>
              {(() => {
                let x0 = METER.x;
                return SEGS.map((seg, i) => {
                  const u = clamp01(segsU * 3 - i);
                  const w = seg.w * ease.move(u);
                  const el = (
                    <g key={seg.label} opacity={u > 0 ? 1 : 0}>
                      <rect x={x0} y={METER.y} width={w} height={16} rx={4} fill={seg.color} opacity={0.8} />
                      {u > 0.6 && (
                        <text x={x0 + 4} y={METER.y + 30} fill={colors.MUTED} fontSize={11.5} opacity={clamp01((u - 0.6) * 3)}>
                          {seg.label}
                        </text>
                      )}
                    </g>
                  );
                  x0 += w;
                  return el;
                });
              })()}
            </g>
          )}
        </g>

        {/* the wall of clones */}
        {cloneU > 0.001 && (
          <g>
            {Array.from({ length: CLONES }, (_, i) => {
              const col = i % CLONE_COLS;
              const row = Math.floor(i / CLONE_COLS);
              return (
                <CloneGlyph
                  key={i}
                  x={200 + col * 126}
                  y={170 + row * 108}
                  u={win(cloneU, CLONES, (row * 3 + col * 5) % CLONES, 8)}
                />
              );
            })}
            <g opacity={clamp01(cloneU * 2 - 1)}>
              <rect x={430} y={556} width={420} height={52} rx={12} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} opacity={0.95} />
              <text x={640} y={589} textAnchor="middle" fill={colors.WARM} fontSize={23} fontWeight={700}>
                × 100,000 every second
              </text>
            </g>
          </g>
        )}

        {/* closing panel — opaque, over a quiet stage */}
        {endU > 0.01 && (
          <g opacity={endU} transform={`translate(640, ${350 + 14 * (1 - ease.pop(endU))})`}>
            <rect x={-330} y={-96} width={660} height={192} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
            <text y={-30} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              fan-out on read
            </text>
            <text y={8} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
              cheap writes · expensive reads
            </text>
            <text y={52} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
              next: pay at write time instead
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
