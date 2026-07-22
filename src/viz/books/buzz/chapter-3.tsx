// Buzz — chapter 3: where messages live.
// The answer to the issue's core question. Grounded in buzz-db/src/lib.rs
// invariants ("AUTH events (kind 22242) are never stored — they carry bearer
// tokens", "Ephemeral events (20000–29999) are never stored — Redis pub/sub
// only", "Events table is partitioned by month on created_at") and the
// buzz-core kind registry (KIND_STREAM_MESSAGE=9, KIND_GIFT_WRAP=1059,
// KIND_PRESENCE_UPDATE=20001, KIND_TYPING_INDICATOR=20002,
// KIND_STREAM_MESSAGE_V2=40002, KIND_FORUM_POST=45001). Search: generated
// search_tsv tsvector + GIN; privacy kinds (1059…) index as NULL.
// One machine: the kind number line sorts falling events into Postgres,
// Redis, or nothing.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The kind number line (0..50000 linear) and its bands.
// ---------------------------------------------------------------------------
const LINE = { x: 110, y: 168, w: 1060 };
const kx = (kind: number) => LINE.x + (kind / 50000) * LINE.w;
const BANDS = [
  { from: 0, to: 10000, label: 'standard', color: colors.ACCENT },
  { from: 10000, to: 20000, label: 'replaceable', color: colors.SECONDARY },
  { from: 20000, to: 30000, label: 'ephemeral', color: colors.NEGATIVE },
  { from: 30000, to: 40000, label: 'addressable', color: colors.WARM },
  { from: 40000, to: 50000, label: 'buzz custom', color: colors.POSITIVE },
];

interface Drop {
  kind: number;
  label: string;
  dest: 'pg' | 'redis';
  sealed?: boolean;
}
const DROPS: Drop[] = [
  { kind: 9, label: 'stream message', dest: 'pg' },
  { kind: 40002, label: 'message v2', dest: 'pg' },
  { kind: 45001, label: 'forum post', dest: 'pg' },
  { kind: 20001, label: 'presence', dest: 'redis' },
  { kind: 20002, label: 'typing…', dest: 'redis' },
  { kind: 1059, label: 'gift wrap', dest: 'pg', sealed: true },
];

const PG = { x: 330, y: 470 };
const PARTITIONS = ['events_2026_05', 'events_2026_06', 'events_2026_07'];
const REDIS = { x: 940, y: 470 };

const CAM_LINE: CameraState = { x: 640, y: 230, k: 1.25 };
const CAM_PG: CameraState = { x: 400, y: 420, k: 1.25 };
const CAM_REDIS: CameraState = { x: 980, y: 430, k: 1.35 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const lineU = tl.channel('lineU', 0);
  const bandsU = tl.channel('bandsU', 0);
  const pgU = tl.channel('pgU', 0);
  const redisU = tl.channel('redisU', 0);
  const drop0 = tl.channel('drop0', 0); // kind 9
  const drop1 = tl.channel('drop1', 0); // 40002 + 45001
  const drop2 = tl.channel('drop2', 0); // 20001 + 20002
  const drop3 = tl.channel('drop3', 0); // 1059
  const ttlU = tl.channel('ttlU', 0);
  const searchU = tl.channel('searchU', 0);
  const deviceU = tl.channel('deviceU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the question.
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'So where does a message actually live? Short answer: in the relay’s Postgres database — not on your laptop. The long answer depends entirely on one number: the kind.',
  });
  tl.tween(lineU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_LINE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — the bands.
  tl.caption({
    at: 6.6,
    dur: 6.2,
    text: 'The kind space is zoned like a city. Low numbers are standard nostr. Ten to twenty thousand replace their previous version. Twenty to thirty thousand are ephemeral. And Buzz claims the forty-thousands for its own event types.',
  });
  tl.tween(bandsU, 1, { at: 7.0, dur: 3.2, ease: ease.enter });
  tl.hold(13.5, 0.7);

  // Beat 3 — kind 9 lands in Postgres.
  tl.caption({
    at: 14.2,
    dur: 6.2,
    text: 'Our kind-nine message falls into the standard zone and lands in the events table — which is partitioned by month on its timestamp, so July’s messages live in July’s partition and old months can be managed as whole units.',
  });
  tl.tween(cam, CAM_PG, { at: 14.6, dur: 1.5, ease: ease.move });
  tl.tween(pgU, 1, { at: 14.8, dur: 1.0, ease: ease.enter });
  tl.tween(drop0, 1, { at: 15.6, dur: 1.8, ease: ease.move });
  tl.hold(21.1, 0.7);

  // Beat 4 — Buzz's own kinds share the same vault.
  tl.caption({
    at: 21.8,
    dur: 5.6,
    text: 'Buzz’s custom types are just more kinds in the same vault: forty thousand two is the richer message format, forty-five thousand one a forum thread root. New features never need new tables — they need new numbers.',
  });
  tl.tween(drop1, 1, { at: 22.6, dur: 2.2, ease: ease.move });
  tl.hold(28.1, 0.7);

  // Beat 5 — the ephemeral lane.
  tl.caption({
    at: 28.8,
    dur: 6.4,
    text: 'Presence and typing indicators are different. Kind twenty thousand one and two are ephemeral by rule: they go to Redis, fan out live, and are never written to disk. Presence expires after ninety seconds; a typing dot after five.',
  });
  tl.tween(cam, CAM_REDIS, { at: 29.2, dur: 1.5, ease: ease.move });
  tl.tween(redisU, 1, { at: 29.4, dur: 1.0, ease: ease.enter });
  tl.tween(drop2, 1, { at: 30.2, dur: 2.0, ease: ease.move });
  tl.tween(ttlU, 1, { at: 32.4, dur: 2.6, ease: ease.linear });
  tl.hold(35.9, 0.7);

  // Beat 6 — the sealed kind.
  tl.caption({
    at: 36.6,
    dur: 6.2,
    text: 'One more special case: kind ten fifty-nine, the gift wrap that carries private messages. It is stored like any event — but its search column is generated as null, so the database itself cannot index what is inside.',
  });
  tl.tween(cam, CAM_PG, { at: 36.8, dur: 1.4, ease: ease.move });
  tl.tween(drop3, 1, { at: 37.6, dur: 1.8, ease: ease.move });
  tl.hold(42.5, 0.7);

  // Beat 7 — search.
  tl.caption({
    at: 43.2,
    dur: 5.8,
    text: 'Search lives inside the same table: every insert populates a generated text-search column with its own inverted index. Query for standup and the kind-nine message answers. The gift wrap stays silent.',
  });
  tl.tween(searchU, 1, { at: 44.0, dur: 2.0, ease: ease.move });
  tl.hold(48.7, 0.7);

  // Beat 8 — and your device?
  tl.caption({
    at: 49.4,
    dur: 6.0,
    text: 'Which answers the question about your device: the desktop app holds no authoritative copy. It subscribes, renders what the relay sends — at most five hundred stored events per filter — and can always re-fetch. The relay is the single source of truth.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.6, dur: 1.4, ease: ease.move });
  tl.tween(deviceU, 1, { at: 50.4, dur: 1.0, ease: ease.enter });
  tl.hold(55.2, 0.7);

  // Beat 9 — close.
  tl.caption({
    at: 55.9,
    dur: 5.2,
    text: 'History in Postgres, heartbeats in Redis, secrets sealed even from the search index. Next chapter: how one stored event reaches every screen that should see it — and no screen that should not.',
  });
  tl.tween(dimU, 1, { at: 56.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.3, dur: 1.0, ease: ease.enter });
  tl.hold(61.1, 1.2);

  return {
    tl, cam, lineU, bandsU, pgU, redisU, drop0, drop1, drop2, drop3,
    ttlU, searchU, deviceU, dimU, closeU,
  };
}

const scene = buildScene();

function dropPos(d: Drop, u: number) {
  const x0 = kx(d.kind);
  const y0 = LINE.y;
  const to = d.dest === 'pg' ? PG : REDIS;
  const tx = to.x + (d.kind % 7) * 16 - 40;
  const ty = to.y - 46;
  const t = clamp01(u);
  const mx = (x0 + tx) / 2;
  const my = Math.max(y0, ty) - 140 * 0 + (y0 + ty) / 2 - 60;
  const a = 1 - t;
  return {
    x: a * a * x0 + 2 * a * t * mx + t * t * tx,
    y: a * a * y0 + 2 * a * t * my + t * t * ty,
  };
}

function EventDot({ d, u }: { d: Drop; u: number }) {
  if (u <= 0) return null;
  const p = dropPos(d, u);
  const band = BANDS.find((b) => d.kind >= b.from && d.kind < b.to)!;
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={8} fill={band.color} opacity={0.95} />
      <text x={p.x + 12} y={p.y - 8} fill={band.color} fontSize={11.5} fontFamily="monospace" opacity={u < 1 ? 1 : 0.85}>
        {d.kind} {d.label}
      </text>
      {d.sealed && u >= 1 && (
        <text x={p.x + 12} y={p.y + 10} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="monospace">
          search_tsv: NULL
        </text>
      )}
    </g>
  );
}

function TtlArc({ x, y, u, total, label }: { x: number; y: number; u: number; total: string; label: string }) {
  const r = 16;
  const frac = 1 - clamp01(u);
  const a0 = -Math.PI / 2;
  const a1 = a0 + frac * Math.PI * 2;
  const large = frac > 0.5 ? 1 : 0;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={colors.GRID} strokeWidth={2} />
      {frac > 0.01 && (
        <path
          d={`M${x + r * Math.cos(a0)},${y + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${x + r * Math.cos(a1)},${y + r * Math.sin(a1)}`}
          fill="none" stroke={colors.NEGATIVE} strokeWidth={2.6} strokeLinecap="round"
        />
      )}
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily="monospace">
        {total}
      </text>
      <text x={x} y={y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const lineU = s.get(scene.lineU);
  const bandsU = s.get(scene.bandsU);
  const pgU = s.get(scene.pgU);
  const redisU = s.get(scene.redisU);
  const drops = [s.get(scene.drop0), s.get(scene.drop1), s.get(scene.drop2), s.get(scene.drop3)];
  const ttlU = s.get(scene.ttlU);
  const searchU = s.get(scene.searchU);
  const deviceU = s.get(scene.deviceU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the kind number line */}
          {lineU > 0 && (
            <g>
              <line x1={LINE.x} y1={LINE.y} x2={LINE.x + LINE.w * lineU} y2={LINE.y} stroke={colors.TEXT} strokeWidth={2} opacity={0.8} />
              <text x={LINE.x} y={LINE.y - 40} fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={lineU}>
                kind: u32 — the routing number of the whole system
              </text>
              {BANDS.map((b, i) => {
                const u = clamp01(bandsU * BANDS.length - i);
                if (u <= 0) return null;
                return (
                  <g key={b.label} opacity={u}>
                    <rect x={kx(b.from)} y={LINE.y - 7} width={kx(b.to) - kx(b.from) - 2} height={14} rx={4} fill={b.color} opacity={0.4} />
                    <text x={(kx(b.from) + kx(b.to)) / 2} y={LINE.y + 30} textAnchor="middle" fill={b.color} fontSize={11.5}>
                      {b.label}
                    </text>
                    <text x={kx(b.from)} y={LINE.y - 16} fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                      {b.from}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* postgres vault with monthly partitions */}
          {pgU > 0 && (
            <g opacity={pgU}>
              <rect x={PG.x - 190} y={PG.y - 58} width={380} height={150} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={PG.x} y={PG.y - 32} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
                postgres — the events table
              </text>
              {PARTITIONS.map((p, i) => (
                <g key={p}>
                  <rect x={PG.x - 172 + i * 118} y={PG.y - 16} width={110} height={56} rx={7} fill="none" stroke={colors.GRID} strokeDasharray={i === 2 ? undefined : '4 4'} />
                  <text x={PG.x - 117 + i * 118} y={PG.y + 8} textAnchor="middle" fill={i === 2 ? colors.TEXT : colors.MUTED} fontSize={10} fontFamily="monospace">
                    {p}
                  </text>
                </g>
              ))}
              <text x={PG.x} y={PG.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                range-partitioned by month on created_at
              </text>
            </g>
          )}

          {/* redis */}
          {redisU > 0 && (
            <g opacity={redisU}>
              <rect x={REDIS.x - 170} y={REDIS.y - 58} width={340} height={150} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
              <text x={REDIS.x} y={REDIS.y - 32} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                redis — live, then gone
              </text>
              {ttlU > 0 && (
                <g opacity={Math.min(1, ttlU * 3)}>
                  <TtlArc x={REDIS.x - 80} y={REDIS.y + 14} u={ttlU} total="90s" label="presence TTL" />
                  <TtlArc x={REDIS.x + 80} y={REDIS.y + 14} u={Math.min(1, ttlU * 4)} total="5s" label="typing window" />
                </g>
              )}
              <text x={REDIS.x} y={REDIS.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                buzz:presence:{'{pubkey}'} · buzz:typing:{'{channel}'}
              </text>
            </g>
          )}

          {/* the falling events */}
          <EventDot d={DROPS[0]} u={drops[0]} />
          <EventDot d={DROPS[1]} u={clamp01(drops[1] * 1.4)} />
          <EventDot d={DROPS[2]} u={clamp01(drops[1] * 1.4 - 0.4)} />
          <EventDot d={DROPS[3]} u={clamp01(drops[2] * 1.4)} />
          <EventDot d={DROPS[4]} u={clamp01(drops[2] * 1.4 - 0.4)} />
          <EventDot d={DROPS[5]} u={drops[3]} />

          {/* search sweep */}
          {searchU > 0 && (
            <g opacity={Math.min(1, searchU * 2)}>
              <rect x={110} y={600} width={330} height={34} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={126} y={622} fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                search "standup" → search_tsv @@ GIN
              </text>
              <path d={`M280,600 Q300,540 ${PG.x - 40},${PG.y + 30}`} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="4 4" opacity={searchU} />
              <text x={450} y={622} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace" opacity={clamp01(searchU * 2 - 1)}>
                ✓ kind 9 “gm team — standup in 5”
              </text>
              <text x={750} y={622} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace" opacity={clamp01(searchU * 2 - 1)}>
                gift wrap: no rows — sealed
              </text>
            </g>
          )}

          {/* the device */}
          {deviceU > 0 && (
            <g opacity={deviceU}>
              <rect x={560} y={300} width={190} height={64} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={655} y={326} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontWeight={600}>
                your desktop
              </text>
              <text x={655} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                subscribes · ≤500 events/filter
              </text>
              <path d={`M655,364 Q600,410 ${PG.x + 120},${PG.y - 58}`} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.7} />
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            History in Postgres · heartbeats in Redis
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the kind number decides; your device is just a subscriber
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            buzz-db invariants · monthly partitions · search_tsv GIN
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
