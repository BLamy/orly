// What the Client Keeps
//
// Backing: packages/zero-client/src/client/zero.ts (Zero wraps ReplicacheImpl,
// zero.ts:648; kvStore default 'idb', zero.ts:498; local database name
// `zero-${userID}-${hash}`, zero.ts:594), options.ts (kvStore: 'mem' | 'idb' |
// StoreProvider), packages/replicache/src/kv/idb-store.ts (IDBStore),
// packages/zero-react-native (expoSQLiteStoreProvider),
// packages/zero-client/src/client/mutation-tracker.ts (MutationTracker),
// custom.ts (CustomMutatorDefs), zero-protocol push.ts ('push' message),
// packages/zero-cache/src/services/mutagen/mutagen.ts (applies mutations
// upstream), zero-protocol poke.ts (pokePart.lastMutationIDChanges),
// packages/zql/src/query/ttl.ts (DEFAULT_TTL = '5m', MAX_TTL = '10m').
//
// Machine: the device as a transparent vault. The cache shelf survives a
// reload because it sits on the browser's built-in database. A tap closes an
// issue INSTANTLY as a dashed ghost, the mutation queues in an outbox, rides
// to mutagen, lands in your Postgres, and the ghost solidifies only when its
// own change returns around the loop. Offline, the outbox just grows; on
// reconnect it drains in order. Unwatched queries expire on a timer and
// their rows are evicted — the vault holds a living subset, not a copy.
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
import { Connection, Packet, ServiceNode, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout. Captions own y ≳ 630.
// ---------------------------------------------------------------------------

const DEV = { x: 128, y: 92, w: 410, h: 492 } as const;
const DEV_C = { x: DEV.x + DEV.w / 2, y: DEV.y + DEV.h / 2 };

// the shelf: cached rows inside the device
const SHELF = { x: DEV.x + 30, y: DEV.y + 96, w: DEV.w - 60, rowH: 34 } as const;
const SHELF_ROWS = [
  { id: 42, title: 'login loops on expired token', open: true },
  { id: 51, title: 'flaky sync test on retry', open: true },
  { id: 57, title: 'dark mode flashes white', open: true },
  { id: 63, title: 'search misses new rows', open: true },
];
// the second query's rows (the ones that will expire)
const Q2_ROWS = [
  { id: 12, title: 'archived: old roadmap', open: false },
  { id: 17, title: 'archived: beta feedback', open: false },
];
const Q2_Y = SHELF.y + 4 * SHELF.rowH + 46;

// the storage layer at the bottom of the device
const STORE_Y = DEV.y + DEV.h - 64;

// the outbox tray
const OUTBOX = { x: DEV.x + DEV.w - 96, y: STORE_Y - 78, w: 82, h: 60 } as const;

// the server loop on the right
const ZC = { x: 800, y: 240 };
const PG = { x: 1092, y: 240 };
const SOCKET_A = { x: DEV.x + DEV.w, y: DEV.y + 150 }; // device edge
const SOCKET_B = { x: ZC.x - 62, y: ZC.y }; // zero-cache edge

const CAM_SHELF: CameraState = { x: 340, y: 300, k: 1.45 };
const CAM_LOOP: CameraState = { x: 800, y: 300, k: 1.15 };
const CAM_TTL: CameraState = { x: 380, y: 420, k: 1.5 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  devU: ChannelRef<number>;
  shelfU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  reloadU: ChannelRef<number>;
  kvU: ChannelRef<number>;
  loopSideU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  outN: ChannelRef<number>;
  pushU: ChannelRef<number>;
  pgGlow: ChannelRef<number>;
  backU: ChannelRef<number>;
  confirmU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  drainU: ChannelRef<number>;
  q2U: ChannelRef<number>;
  ttlU: ChannelRef<number>;
  evictU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const devU = tl.channel('devU', 0);
  const shelfU = tl.channel('shelfU', 0); // cached rows cascade in
  const storeU = tl.channel('storeU', 0); // the storage layer
  const reloadU = tl.channel('reloadU', 0); // the reload flash (0→1→0 shape via two tweens)
  const kvU = tl.channel('kvU', 0); // the kvStore option chips
  const loopSideU = tl.channel('loopSideU', 0); // zero-cache + postgres side
  const flipU = tl.channel('flipU', 0); // issue 42 flips closed (ghost)
  const outN = tl.channel('outN', 0); // mutations waiting in the outbox
  const pushU = tl.channel('pushU', 0); // outbox chip rides to mutagen
  const pgGlow = tl.channel('pgGlow', 0); // postgres accepts the write
  const backU = tl.channel('backU', 0); // the change returns as a poke
  const confirmU = tl.channel('confirmU', 0); // ghost solidifies
  const cutU = tl.channel('cutU', 0); // offline
  const drainU = tl.channel('drainU', 0); // outbox drains on reconnect
  const q2U = tl.channel('q2U', 0); // the second query's shelf section
  const ttlU = tl.channel('ttlU', 0); // its expiry timer
  const evictU = tl.channel('evictU', 0); // rows evicted
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · what is actually on the device —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Open the device and look inside. Zero rides on Replicache, and the rows your queries fetched sit in the browser’s built-in database.',
  });
  tl.tween(devU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_SHELF, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(shelfU, 1, { at: 1.6, dur: 1.6, ease: ease.enter });
  tl.tween(storeU, 1, { at: 3.2, dur: 0.8, ease: ease.enter });

  // — Beat 2 · reload survives —
  tl.caption({
    at: 6.9,
    dur: 5.5,
    text: 'That means a reload is not a restart. The page blinks away, comes back — and the shelf is still full. No spinner, no refetch.',
  });
  tl.tween(reloadU, 1, { at: 8.2, dur: 0.35, ease: ease.enter });
  tl.tween(reloadU, 0, { at: 8.8, dur: 0.6, ease: ease.enter });
  tl.hold(12.4, 0.5);

  // — Beat 3 · where it can live —
  tl.caption({
    at: 12.9,
    dur: 6,
    text: 'Storage is pluggable: the browser database by default, pure memory for tests, or a native SQLite file on mobile.',
  });
  tl.tween(kvU, 3, { at: 13.6, dur: 1.6, ease: ease.enter });
  tl.hold(18.9, 0.5);

  // — Beat 4 · the optimistic write —
  tl.caption({
    at: 19.4,
    dur: 6,
    text: 'Now write something. Tap to close issue forty-two — and it closes immediately, before any server hears about it.',
  });
  tl.tween(flipU, 1, { at: 20.6, dur: 0.6, ease: ease.pop });
  tl.caption({
    at: 25.6,
    dur: 5.5,
    text: 'Immediately is a promise, not a lie: the change is drawn as a ghost, and the mutation itself waits in an outbox.',
  });
  tl.tween(outN, 1, { at: 26.6, dur: 0.5, ease: ease.pop });
  tl.hold(31.1, 0.5);

  // — Beat 5 · push to mutagen, land in Postgres —
  tl.caption({
    at: 31.6,
    dur: 6,
    text: 'The outbox pushes up the socket to a worker called mutagen, whose only job is to replay your mutations against your Postgres.',
  });
  tl.tween(cam, CAM_LOOP, { at: 31.8, dur: 1.5, ease: ease.move });
  tl.tween(loopSideU, 1, { at: 32.0, dur: 1.2, ease: ease.draw });
  tl.tween(pushU, 1, { at: 33.4, dur: 2.2, ease: ease.linear });
  tl.set(outN, 0, 35.6);
  tl.tween(pgGlow, 1, { at: 35.7, dur: 0.4, ease: ease.pop });
  tl.tween(pgGlow, 0, { at: 36.6, dur: 0.6, ease: ease.enter });

  // — Beat 6 · confirmation comes around the loop —
  tl.caption({
    at: 38.0,
    dur: 6.5,
    text: 'Postgres commits it, the tape from chapter two carries it back, and the next poke confirms it. Only then does the ghost turn solid.',
  });
  tl.tween(backU, 1, { at: 38.6, dur: 2.6, ease: ease.linear });
  tl.tween(confirmU, 1, { at: 41.4, dur: 0.5, ease: ease.pop });
  tl.hold(44.5, 0.5);

  // — Beat 7 · offline —
  tl.caption({
    at: 45.0,
    dur: 6,
    text: 'Lose the network mid-flight and nothing breaks: reads still land, and every new write simply joins the queue.',
  });
  tl.tween(cam, CAM_WIDE, { at: 45.2, dur: 1.4, ease: ease.move });
  tl.tween(cutU, 1, { at: 45.8, dur: 0.7, ease: ease.move });
  tl.tween(outN, 3, { at: 46.8, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 51.2,
    dur: 5,
    text: 'When the wire returns, the outbox drains in order, and the same confirmation loop settles every one of them.',
  });
  tl.tween(cutU, 0, { at: 52.0, dur: 0.7, ease: ease.move });
  tl.tween(drainU, 1, { at: 52.8, dur: 2.8, ease: ease.linear });
  tl.tween(outN, 0, { at: 53.0, dur: 2.4, ease: ease.move });
  tl.hold(56.2, 0.5);

  // — Beat 8 · time to live —
  tl.caption({
    at: 56.7,
    dur: 6.5,
    text: 'One more rule keeps the vault small. A query the app stops watching lives on borrowed time — five minutes by default, ten at most.',
  });
  tl.tween(cam, CAM_TTL, { at: 56.9, dur: 1.4, ease: ease.move });
  tl.tween(q2U, 1, { at: 57.3, dur: 0.8, ease: ease.enter });
  tl.tween(ttlU, 1, { at: 58.4, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 63.4,
    dur: 5,
    text: 'When the timer runs out, its rows are evicted. The cache never becomes a landfill of everything you ever looked at.',
  });
  tl.tween(evictU, 1, { at: 64.4, dur: 1.0, ease: ease.move });
  tl.hold(68.4, 0.5);

  // — Beat 9 · the law —
  tl.caption({
    at: 68.9,
    dur: 5.5,
    text: 'So the client keeps a living subset: persisted, instantly writable, self-pruning — and never pretending to be the source of truth.',
  });
  tl.tween(cam, CAM_WIDE, { at: 69.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 69.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 70.5, dur: 0.8, ease: ease.enter });
  tl.hold(74.4, 1.2);

  return {
    tl, cam, devU, shelfU, storeU, reloadU, kvU, loopSideU, flipU, outN,
    pushU, pgGlow, backU, confirmU, cutU, drainU, q2U, ttlU, evictU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const KV_CHIPS = [
  { label: "kvStore: 'idb'", note: 'browser · default' },
  { label: "kvStore: 'mem'", note: 'tests' },
  { label: 'expoSQLiteStoreProvider', note: 'React Native' },
];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const devU = s.get(scene.devU);
  const shelfU = s.get(scene.shelfU);
  const storeU = s.get(scene.storeU);
  const reloadU = s.get(scene.reloadU);
  const kvU = s.get(scene.kvU);
  const loopSideU = s.get(scene.loopSideU);
  const flipU = s.get(scene.flipU);
  const outN = s.get(scene.outN);
  const pushU = s.get(scene.pushU);
  const pgGlow = s.get(scene.pgGlow);
  const backU = s.get(scene.backU);
  const confirmU = s.get(scene.confirmU);
  const cutU = s.get(scene.cutU);
  const drainU = s.get(scene.drainU);
  const q2U = s.get(scene.q2U);
  const ttlU = s.get(scene.ttlU);
  const evictU = s.get(scene.evictU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const faded = 1 - 0.87 * dimU;
  const blink = 1 - reloadU; // the reload flash dims the pane, not the shelf

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={faded}>
          {/* ------------- the device vault ------------- */}
          <g opacity={devU}>
            <rect x={DEV.x} y={DEV.y} width={DEV.w} height={DEV.h} rx={22} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
            <text x={DEV_C.x} y={DEV.y + 30} textAnchor="middle" fill={colors.ACCENT} fontSize={13} letterSpacing={1.5}>
              the device
            </text>
            <text x={DEV_C.x} y={DEV.y + 52} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontStyle="italic" opacity={blink}>
              your app, mid-session
            </text>

            {/* the cached shelf */}
            {SHELF_ROWS.map((r, i) => {
              const u = clamp01(shelfU * 2.5 - i * 0.35);
              const isFlip = r.id === 42;
              const ghost = isFlip && flipU > 0 && confirmU < 0.5;
              const closed = isFlip && flipU > 0;
              return (
                <g key={r.id} opacity={u * blink}>
                  <rect
                    x={SHELF.x}
                    y={SHELF.y + i * SHELF.rowH}
                    width={SHELF.w}
                    height={SHELF.rowH - 8}
                    rx={6}
                    fill={colors.PANEL}
                    stroke={ghost ? colors.WARM : closed ? colors.POSITIVE : colors.GRID}
                    strokeWidth={ghost || closed ? 1.6 : 1}
                    strokeDasharray={ghost ? '5 4' : undefined}
                  />
                  <circle cx={SHELF.x + 15} cy={SHELF.y + i * SHELF.rowH + 13} r={4} fill={closed ? colors.MUTED : colors.POSITIVE} />
                  <text x={SHELF.x + 30} y={SHELF.y + i * SHELF.rowH + 17} fill={closed ? colors.MUTED : colors.TEXT} fontSize={11.5} textDecoration={closed ? 'line-through' : undefined}>
                    #{r.id} · {r.title}
                  </text>
                  {ghost && (
                    <text x={SHELF.x + SHELF.w - 10} y={SHELF.y + i * SHELF.rowH + 17} textAnchor="end" fill={colors.WARM} fontSize={10} fontStyle="italic">
                      pending…
                    </text>
                  )}
                  {isFlip && confirmU > 0.5 && (
                    <text x={SHELF.x + SHELF.w - 10} y={SHELF.y + i * SHELF.rowH + 17} textAnchor="end" fill={colors.POSITIVE} fontSize={10}>
                      confirmed ✓
                    </text>
                  )}
                </g>
              );
            })}

            {/* the second query's rows — the ones that will expire */}
            <g opacity={q2U * (1 - evictU)}>
              <text x={SHELF.x + 4} y={Q2_Y - 10} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
                query: archived issues — no longer watched
              </text>
              {Q2_ROWS.map((r, i) => (
                <g key={r.id}>
                  <rect x={SHELF.x} y={Q2_Y + i * SHELF.rowH} width={SHELF.w} height={SHELF.rowH - 8} rx={6} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1} opacity={0.7} />
                  <text x={SHELF.x + 30} y={Q2_Y + i * SHELF.rowH + 17} fill={colors.MUTED} fontSize={11.5}>
                    #{r.id} · {r.title}
                  </text>
                </g>
              ))}
              {/* the expiry timer */}
              {ttlU > 0 && ttlU < 1 && (
                <g>
                  <TimerArc cx={SHELF.x + SHELF.w - 22} cy={Q2_Y + 12} r={11} u={ttlU} color={colors.WARM} />
                  <text x={SHELF.x + SHELF.w - 40} y={Q2_Y + 17} textAnchor="end" fill={colors.WARM} fontSize={10} fontFamily="ui-monospace, monospace">
                    ttl: '5m'
                  </text>
                </g>
              )}
              {evictU > 0.02 && (
                <text x={SHELF.x + SHELF.w / 2} y={Q2_Y + 30} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontStyle="italic" opacity={evictU}>
                  evicted — ask again to bring them back
                </text>
              )}
            </g>

            {/* the storage layer */}
            <g opacity={storeU}>
              <rect x={DEV.x + 18} y={STORE_Y} width={DEV.w - 36} height={44} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
              <text x={DEV_C.x} y={STORE_Y + 19} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontWeight={700}>
                Replicache persistence
              </text>
              <text x={DEV_C.x} y={STORE_Y + 35} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
                IndexedDB · zero-{'{userID}'}-…
              </text>
            </g>

            {/* the outbox */}
            <g opacity={devU}>
              <rect x={OUTBOX.x} y={OUTBOX.y} width={OUTBOX.w} height={OUTBOX.h} rx={8} fill="none" stroke={colors.WARM} strokeWidth={1.3} strokeDasharray="4 3" />
              <text x={OUTBOX.x + OUTBOX.w / 2} y={OUTBOX.y - 8} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
                outbox
              </text>
              {Array.from({ length: Math.min(3, Math.round(outN)) }, (_, k) => (
                <rect key={k} x={OUTBOX.x + 10} y={OUTBOX.y + OUTBOX.h - 16 - k * 16} width={OUTBOX.w - 20} height={12} rx={3} fill={colors.WARM} opacity={0.8} />
              ))}
            </g>
          </g>

          {/* the kvStore chips, floating right of the device */}
          {KV_CHIPS.map((c, i) => {
            const u = clamp01(kvU - i);
            if (u <= 0.01) return null;
            return (
              <g key={c.label} opacity={u * 0.95}>
                <rect x={586} y={430 + i * 46} width={250} height={36} rx={9} fill={colors.PANEL} stroke={i === 0 ? colors.ACCENT : colors.GRID} strokeWidth={1.2} />
                <text x={598} y={430 + i * 46 + 16} fill={i === 0 ? colors.ACCENT : colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
                  {c.label}
                </text>
                <text x={598} y={430 + i * 46 + 30} fill={colors.MUTED} fontSize={9.5}>
                  {c.note}
                </text>
              </g>
            );
          })}

          {/* ------------- the server loop ------------- */}
          <g opacity={loopSideU}>
            <ServiceNode x={ZC.x} y={ZC.y} kind="server" label="zero-cache" sublabel="mutagen · view syncer" dim={cutU * 0.5} />
            <ServiceNode x={PG.x} y={PG.y} kind="db" label="your Postgres" sublabel="source of truth" glow={pgGlow} dim={cutU * 0.5} />
            <Connection from={{ x: ZC.x + 62, y: ZC.y - 12 }} to={{ x: PG.x - 66, y: PG.y - 12 }} u={loopSideU} color={colors.GRID} arrow label="apply mutation" labelSize={10} />
            <Connection from={{ x: PG.x - 66, y: PG.y + 16 }} to={{ x: ZC.x + 62, y: ZC.y + 16 }} u={loopSideU} color={colors.GRID} arrow dashed label="the tape · replica" labelSize={10} />
          </g>
          <Connection
            from={SOCKET_A}
            to={SOCKET_B}
            u={Math.max(loopSideU, devU * 0.001)}
            color={cutU > 0.5 ? colors.NEGATIVE : colors.GRID}
            dashed
            label={cutU > 0.5 ? 'offline' : 'socket'}
            labelSize={10}
            dim={0.3}
          />

          {/* the push chip riding to mutagen */}
          <Packet from={{ x: OUTBOX.x + OUTBOX.w / 2, y: OUTBOX.y }} to={SOCKET_B} u={pushU} r={6.5} color={colors.WARM} label={pushU > 0.1 && pushU < 0.95 ? 'push · closeIssue' : undefined} labelSize={10} />
          {/* the drain after reconnect: three chips in order */}
          {drainU > 0 && drainU < 1 &&
            [0, 1, 2].map((k) => {
              const u = clamp01(drainU * 1.8 - k * 0.28);
              if (u <= 0 || u >= 1) return null;
              return <Packet key={k} from={{ x: OUTBOX.x + OUTBOX.w / 2, y: OUTBOX.y }} to={SOCKET_B} u={u} r={5} color={colors.WARM} opacity={0.9} />;
            })}
          {/* the confirming poke coming back */}
          <Packet from={SOCKET_B} to={SOCKET_A} u={backU} r={6} color={colors.POSITIVE} label={backU > 0.15 && backU < 0.9 ? 'poke · lastMutationIDChanges' : undefined} labelSize={9.5} />
        </g>

        {/* closing panel */}
        <g opacity={closeU}>
          <rect x={330} y={215} width={620} height={200} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={278} textAnchor="middle" fill={colors.POSITIVE} fontSize={24} fontWeight={800} letterSpacing={1}>
            a living subset, not a copy
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
            persisted · instantly writable · self-pruning
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontFamily="ui-monospace, monospace">
            IndexedDB → outbox → mutagen → Postgres → poke
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
