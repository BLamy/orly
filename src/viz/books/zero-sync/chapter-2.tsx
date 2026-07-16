// Your Postgres Is Still the Boss
//
// Backing: packages/zero-cache/src/services/change-source/pg/initial-sync.ts
// (initialSync — COPY of published tables into the SQLite replica),
// replication-slots.ts (createReplicationSlot / CREATE_REPLICATION_SLOT,
// pgoutput plugin), logical-replication/stream.ts (subscribe — the
// replication: 'database' session) and pgoutput-parser.ts (msgBegin /
// msgInsert / msgUpdate / msgDelete / msgCommit, readLsn),
// server/change-streamer.ts (the change-streamer worker), zero-config
// (ZERO_UPSTREAM_DB, ZERO_REPLICA_FILE default 'zero.db', litestream backup).
//
// Machine: the write-ahead log as a physical tape. Act 1 — initial sync pours
// whole tables into the replica. Act 2 — a replication slot opens and the
// tape starts: change chips (begin · insert · update · commit) ride from
// Postgres through the pgoutput reader head into the SQLite replica, the
// log-position counter advancing. Act 3 — a live commit appears at the head
// of the tape and exists in the replica a beat later. Zero never owns the
// data; it subscribes to it.
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
import { Connection, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout. Captions own y ≳ 630.
// ---------------------------------------------------------------------------

const PG = { x: 190, y: 330 };
const ZC_ZONE = { x: 700, y: 120, w: 540, h: 440 } as const;
const REPLICA = { x: 1060, y: 330 };
const HEAD = { x: 810, y: 330 }; // the pgoutput reader head
const TAPE_Y = 330;
const TAPE_X0 = 300; // where chips are born (postgres edge)
const TAPE_X1 = HEAD.x - 52; // where chips enter the head

// Act 1: the initial COPY pour — table slabs postgres → replica
const TABLES = ['issue', 'comment', 'user', 'label'];

// Act 2: the steady tape of change chips. Precomputed cycle, applied via one
// linear channel; chip k enters the tape at phase k/N.
interface Chip {
  tag: 'begin' | 'insert' | 'update' | 'delete' | 'commit';
  color: string;
}
const CHIP_CYCLE: Chip[] = [
  { tag: 'begin', color: colors.MUTED },
  { tag: 'insert', color: colors.POSITIVE },
  { tag: 'update', color: colors.WARM },
  { tag: 'commit', color: colors.SECONDARY },
  { tag: 'begin', color: colors.MUTED },
  { tag: 'update', color: colors.WARM },
  { tag: 'delete', color: colors.NEGATIVE },
  { tag: 'commit', color: colors.SECONDARY },
];

// Act 3: the live commit — one UPDATE traced end to end
const LIVE_SQL = "UPDATE issue SET status = 'closed' WHERE id = 42";

const CAM_HEAD: CameraState = { x: 820, y: 340, k: 1.55 };
const CAM_PG: CameraState = { x: 320, y: 330, k: 1.35 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pgU: ChannelRef<number>;
  zoneU: ChannelRef<number>;
  replicaU: ChannelRef<number>;
  copyU: ChannelRef<number>;
  rowsN: ChannelRef<number>;
  slotU: ChannelRef<number>;
  headU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  lsnN: ChannelRef<number>;
  applyGlow: ChannelRef<number>;
  liveU: ChannelRef<number>;
  liveChipU: ChannelRef<number>;
  liveApplyU: ChannelRef<number>;
  backupU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pgU = tl.channel('pgU', 0);
  const zoneU = tl.channel('zoneU', 0);
  const replicaU = tl.channel('replicaU', 0);
  const copyU = tl.channel('copyU', 0); // table slabs pour, per-slab derived
  const rowsN = tl.channel('rowsN', 0); // replica row counter
  const slotU = tl.channel('slotU', 0); // the slot chip on postgres
  const headU = tl.channel('headU', 0); // reader head reveal
  const tapeU = tl.channel('tapeU', 0); // the endless chip cycle (linear)
  const lsnN = tl.channel('lsnN', 0); // log position counter
  const applyGlow = tl.channel('applyGlow', 0); // replica pulse as chips land
  const liveU = tl.channel('liveU', 0); // the live UPDATE card on postgres
  const liveChipU = tl.channel('liveChipU', 0); // its chip riding the tape
  const liveApplyU = tl.channel('liveApplyU', 0); // landing in the replica
  const backupU = tl.channel('backupU', 0); // litestream aside
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the source of truth —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Zero does not replace your database. Your own Postgres stays exactly where it is, and it stays the boss.',
  });
  tl.tween(pgU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_PG, { at: 0.9, dur: 1.3, ease: ease.move });

  // — Beat 2 · zero-cache and the replica appear —
  tl.caption({
    at: 6.4,
    dur: 6,
    text: 'Next to it you run zero-cache. Inside is a single file: a SQLite replica of the tables you chose to publish.',
  });
  tl.tween(cam, CAM_WIDE, { at: 6.6, dur: 1.5, ease: ease.move });
  tl.tween(zoneU, 1, { at: 7.0, dur: 1.2, ease: ease.draw });
  tl.tween(replicaU, 1, { at: 8.0, dur: 0.7, ease: ease.enter });

  // — Beat 3 · initial sync: the pour —
  tl.caption({
    at: 12.8,
    dur: 6,
    text: 'First boot is a bulk copy. Whole tables stream out of Postgres and settle into the replica, row by row.',
  });
  tl.tween(copyU, 1, { at: 13.2, dur: 4.8, ease: ease.linear });
  tl.tween(rowsN, 184000, { at: 13.4, dur: 5.2, ease: ease.move });
  tl.hold(19.0, 0.6);

  // — Beat 4 · the replication slot —
  tl.caption({
    at: 19.6,
    dur: 6.5,
    text: 'Then Postgres grants zero-cache a replication slot — a bookmark into its write-ahead log, the journal of every change it commits.',
  });
  tl.tween(slotU, 1, { at: 20.2, dur: 0.6, ease: ease.pop });
  tl.tween(headU, 1, { at: 21.6, dur: 0.8, ease: ease.enter });

  // — Beat 5 · the tape runs —
  tl.caption({
    at: 26.4,
    dur: 6.5,
    text: 'From that moment the log plays as a tape: begin, insert, update, commit — every change, in commit order, forever.',
  });
  tl.tween(tapeU, 1, { at: 26.6, dur: 30, ease: ease.linear });
  tl.tween(lsnN, 84512960, { at: 26.6, dur: 30, ease: ease.linear });
  tl.tween(cam, CAM_HEAD, { at: 28.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 33.4,
    dur: 6,
    text: 'A reader head decodes each entry and re-applies it to the replica. The counter is the log position — how far the tape has played.',
  });
  tl.tween(applyGlow, 1, { at: 34.0, dur: 12, ease: ease.linear });
  tl.hold(39.6, 0.6);

  // — Beat 6 · a live write, traced —
  tl.caption({
    at: 40.2,
    dur: 5.5,
    text: 'Watch one write happen for real. Someone closes issue forty-two, straight against Postgres — Zero is not even involved.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.4, dur: 1.5, ease: ease.move });
  tl.tween(liveU, 1, { at: 41.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 46.0,
    dur: 6,
    text: 'The commit lands in the log, rides the tape, passes the head — and a beat later the same row is closed in the replica.',
  });
  tl.tween(liveChipU, 1, { at: 46.4, dur: 3.2, ease: ease.linear });
  tl.tween(liveApplyU, 1, { at: 49.8, dur: 0.5, ease: ease.pop });
  tl.hold(52.4, 0.6);

  // — Beat 7 · disposable replica —
  tl.caption({
    at: 53.0,
    dur: 6,
    text: 'The replica is furniture, not treasure. It streams to backup and can be rebuilt from Postgres and the log any time.',
  });
  tl.tween(backupU, 1, { at: 53.6, dur: 0.8, ease: ease.enter });
  tl.hold(59.0, 0.4);

  // — Beat 8 · the law —
  tl.caption({
    at: 59.4,
    dur: 6,
    text: 'So nothing writes the replica except the tape, and nothing owns the data except your Postgres. Zero subscribes; it never rules.',
  });
  tl.tween(dimU, 1, { at: 60.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 61.0, dur: 0.8, ease: ease.enter });
  tl.hold(65.4, 1.2);

  return {
    tl, cam, pgU, zoneU, replicaU, copyU, rowsN, slotU, headU, tapeU,
    lsnN, applyGlow, liveU, liveChipU, liveApplyU, backupU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');

/** One chip riding the tape: born at TAPE_X0, absorbed at the head. */
function tapeChip(cycleU: number, k: number, n: number) {
  const u = clamp01((cycleU * 4 + (n - k) / n) % 1 || 0);
  return { x: TAPE_X0 + (TAPE_X1 - TAPE_X0) * u, u };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pgU = s.get(scene.pgU);
  const zoneU = s.get(scene.zoneU);
  const replicaU = s.get(scene.replicaU);
  const copyU = s.get(scene.copyU);
  const rowsN = s.get(scene.rowsN);
  const slotU = s.get(scene.slotU);
  const headU = s.get(scene.headU);
  const tapeU = s.get(scene.tapeU);
  const lsnN = s.get(scene.lsnN);
  const applyGlow = s.get(scene.applyGlow);
  const liveU = s.get(scene.liveU);
  const liveChipU = s.get(scene.liveChipU);
  const liveApplyU = s.get(scene.liveApplyU);
  const backupU = s.get(scene.backupU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const faded = 1 - 0.87 * dimU;
  const tapeAlive = tapeU > 0 && tapeU < 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={faded}>
          {/* your Postgres, crowned */}
          <g opacity={pgU}>
            <ServiceNode x={PG.x} y={PG.y} kind="db" label="your Postgres" sublabel="ZERO_UPSTREAM_DB" glow={0.25} />
            <text x={PG.x} y={PG.y - 64} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700} letterSpacing={2}>
              SOURCE OF TRUTH
            </text>
            {/* the live UPDATE card */}
            <g opacity={liveU}>
              <rect x={PG.x - 170} y={PG.y + 78} width={360} height={34} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={PG.x + 10} y={PG.y + 100} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="ui-monospace, monospace">
                {LIVE_SQL}
              </text>
            </g>
            {/* the slot chip */}
            <g opacity={slotU}>
              <rect x={PG.x - 90} y={PG.y - 130} width={430} height={30} rx={15} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
              <text x={PG.x + 125} y={PG.y - 110} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
                CREATE_REPLICATION_SLOT … LOGICAL pgoutput
              </text>
            </g>
          </g>

          {/* zero-cache zone + replica */}
          <Zone x={ZC_ZONE.x} y={ZC_ZONE.y} w={ZC_ZONE.w} h={ZC_ZONE.h} label="zero-cache" u={zoneU} color={colors.ACCENT} />
          <g opacity={replicaU}>
            <ServiceNode x={REPLICA.x} y={REPLICA.y} kind="storage" label="replica" sublabel="zero.db · SQLite" glow={0.5 * applyGlowPulse(applyGlow) + liveApplyU * 0.8} />
            <text x={REPLICA.x} y={REPLICA.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
              ZERO_REPLICA_FILE
            </text>
            {rowsN > 0 && (
              <text x={REPLICA.x} y={REPLICA.y - 58} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700} fontFamily="ui-monospace, monospace">
                {fmt(rowsN)} rows
              </text>
            )}
            {/* issue 42 flips closed in the replica */}
            <g opacity={liveApplyU}>
              <rect x={REPLICA.x - 82} y={REPLICA.y + 74} width={164} height={26} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
              <text x={REPLICA.x} y={REPLICA.y + 91} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
                issue 42 → closed
              </text>
            </g>
          </g>

          {/* Act 1 — the initial COPY pour */}
          {copyU > 0 && copyU < 1 &&
            TABLES.map((t, i) => {
              const u = clamp01(copyU * 1.6 - i * 0.18);
              if (u <= 0 || u >= 1) return null;
              const x = PG.x + 90 + (REPLICA.x - PG.x - 180) * u;
              const y = 210 + i * 32;
              return (
                <g key={t} opacity={0.95}>
                  <rect x={x - 52} y={y - 13} width={104} height={26} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
                  <text x={x} y={y + 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
                    COPY {t}
                  </text>
                </g>
              );
            })}
          {copyU > 0 && copyU < 1 && (
            <text x={(PG.x + REPLICA.x) / 2} y={168} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              initial sync — snapshot of every published table
            </text>
          )}

          {/* the tape bed */}
          <g opacity={headU}>
            <line x1={TAPE_X0} y1={TAPE_Y + 22} x2={TAPE_X1 + 40} y2={TAPE_Y + 22} stroke={colors.GRID} strokeWidth={2} />
            <line x1={TAPE_X0} y1={TAPE_Y - 22} x2={TAPE_X1 + 40} y2={TAPE_Y - 22} stroke={colors.GRID} strokeWidth={2} />
            <text x={(TAPE_X0 + TAPE_X1) / 2} y={TAPE_Y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              the write-ahead log, played as a tape
            </text>
            {/* the reader head */}
            <rect x={HEAD.x - 46} y={TAPE_Y - 44} width={92} height={88} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
            <text x={HEAD.x} y={TAPE_Y - 6} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontWeight={700}>
              reader
            </text>
            <text x={HEAD.x} y={TAPE_Y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
              pgoutput
            </text>
            {/* log-position counter */}
            {lsnN > 0 && (
              <text x={HEAD.x} y={TAPE_Y + 68} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5} fontFamily="ui-monospace, monospace">
                log position {fmt(lsnN)}
              </text>
            )}
            {/* head → replica feed */}
            <Connection from={{ x: HEAD.x + 46, y: TAPE_Y }} to={{ x: REPLICA.x - 64, y: TAPE_Y }} u={headU} color={colors.GRID} arrow flow={tapeAlive ? tapeU * 40 : 0} />
          </g>

          {/* the chip cycle riding the tape */}
          {tapeAlive &&
            CHIP_CYCLE.map((c, k) => {
              const { x, u } = tapeChip(tapeU, k, CHIP_CYCLE.length);
              if (u <= 0.02 || u >= 0.98) return null;
              return (
                <g key={k} opacity={0.95}>
                  <rect x={x - 34} y={TAPE_Y - 12} width={68} height={24} rx={6} fill={colors.BG} stroke={c.color} strokeWidth={1.4} />
                  <text x={x} y={TAPE_Y + 4} textAnchor="middle" fill={c.color} fontSize={10.5} fontFamily="ui-monospace, monospace">
                    {c.tag}
                  </text>
                </g>
              );
            })}

          {/* the live chip — issue 42's commit, traced */}
          {liveChipU > 0 && liveChipU < 1 && (
            <g>
              <rect x={TAPE_X0 + (REPLICA.x - 70 - TAPE_X0) * liveChipU - 44} y={TAPE_Y - 40} width={88} height={24} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.8} />
              <text x={TAPE_X0 + (REPLICA.x - 70 - TAPE_X0) * liveChipU} y={TAPE_Y - 24} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontWeight={700} fontFamily="ui-monospace, monospace">
                update · 42
              </text>
            </g>
          )}

          {/* litestream backup aside */}
          <g opacity={backupU}>
            <Connection from={{ x: REPLICA.x + 30, y: REPLICA.y - 40 }} to={{ x: REPLICA.x + 120, y: REPLICA.y - 120 }} u={backupU} color={colors.GRID} dashed arrow />
            <text x={REPLICA.x + 60} y={REPLICA.y - 132} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
              litestream → s3
            </text>
          </g>
        </g>

        {/* closing panel */}
        <g opacity={closeU}>
          <rect x={330} y={215} width={620} height={200} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={278} textAnchor="middle" fill={colors.WARM} fontSize={24} fontWeight={800} letterSpacing={1}>
            your Postgres stays the boss
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
            the replica is written by the tape, and only the tape
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontFamily="ui-monospace, monospace">
            Postgres → replication slot → pgoutput → zero.db
          </text>
        </g>
      </Camera>
    </>
  );
}

/** applyGlow is a long linear ramp; turn it into a soft repeating pulse. */
function applyGlowPulse(u: number): number {
  if (u <= 0 || u >= 1) return 0;
  const p = (u * 8) % 1;
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}

export const vizScene = () => scene;
