// Buzz — chapter 4: the fan-out.
// One stored event → every socket that should see it, and none that
// shouldn't. Grounded in the three-tier delivery described in
// ARCHITECTURE.md and event.rs: Tier 1 channel_kind_index (channel+kind,
// O(1)), Tier 2 channel_wildcard_index (channel, any kind), Tier 3 the
// linear scan of global subscriptions — with the hard security boundary:
// channel-scoped events are EXCLUDED from global subscriptions. Frames are
// ["EVENT", sub_id, {…}] via conn_manager.send_to; across nodes Redis
// publishes buzz:channel:{uuid} and the local_event_ids moka cache
// deduplicates a relay's own echo.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — event card left, three subscription tiers center, sockets right.
// ---------------------------------------------------------------------------
const EV = { x: 150, y: 300 };

interface Sub {
  id: string;
  desc: string;
  tier: 1 | 2 | 3;
  y: number;
  match: boolean;
}
const TIER_X: Record<number, number> = { 1: 560, 2: 560, 3: 560 };
const SUBS: Sub[] = [
  { id: 'sub-a1', desc: '#general · kind 9', tier: 1, y: 150, match: true },
  { id: 'sub-a2', desc: '#general · kind 9', tier: 1, y: 205, match: true },
  { id: 'sub-b1', desc: '#general · any kind', tier: 2, y: 296, match: true },
  { id: 'sub-b2', desc: '#general · kind 7 only', tier: 2, y: 351, match: false },
  { id: 'sub-c1', desc: 'global · kind 1', tier: 3, y: 442, match: false },
  { id: 'sub-c2', desc: 'global · all kinds', tier: 3, y: 497, match: false },
];
const SUB_W = 240;
const SUB_H = 42;
const SOCK_X = 1080;

const NODE2 = { x: 250, y: 560 };

const CAM_WALL: CameraState = { x: 660, y: 330, k: 1.2 };
const CAM_TIER3: CameraState = { x: 700, y: 472, k: 1.5 };
const CAM_NODES: CameraState = { x: 500, y: 440, k: 1.2 };

const TIER_LABELS = [
  { tier: 1, label: 'tier 1 — channel_kind_index', sub: '(channel, kind) → O(1) hit', y: 120 },
  { tier: 2, label: 'tier 2 — channel_wildcard_index', sub: 'channel, no kind constraint', y: 266 },
  { tier: 3, label: 'tier 3 — global subscriptions', sub: 'linear scan, channel events excluded', y: 412 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const evU = tl.channel('evU', 0);
  const wallU = tl.channel('wallU', 0);
  const t1U = tl.channel('t1U', 0);
  const t2U = tl.channel('t2U', 0);
  const scanU = tl.channel('scanU', 0);
  const blockU = tl.channel('blockU', 0);
  const framesU = tl.channel('framesU', 0);
  const nodeU = tl.channel('nodeU', 0);
  const echoU = tl.channel('echoU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the stored event wants an audience.
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Chapter two ended with an OK: the message is stored. But chat is not storage — it is delivery. Somewhere, six open subscriptions are waiting, and this event must find exactly the right ones.',
  });
  tl.tween(evU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(wallU, 1, { at: 1.6, dur: 2.6, ease: ease.enter });
  tl.tween(cam, CAM_WALL, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — what a subscription is.
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'A subscription is a standing request with filters — a channel, maybe a kind — remembered per connection. Buzz files each one into an index the moment it arrives, so delivery never has to think hard.',
  });
  tl.hold(12.2, 0.7);

  // Beat 3 — tier 1.
  tl.caption({
    at: 12.9,
    dur: 5.8,
    text: 'Tier one is the fast path: an index keyed by channel and kind together. Our kind-nine message in this channel looks up one bucket and lights every subscription in it — constant time, no scanning.',
  });
  tl.tween(t1U, 1, { at: 13.8, dur: 1.6, ease: ease.move });
  tl.hold(18.7, 0.7);

  // Beat 4 — tier 2.
  tl.caption({
    at: 19.4,
    dur: 5.6,
    text: 'Tier two catches the channel’s wildcards — subscriptions that said give me everything in this channel. The kind-seven-only listener stays dark: right channel, wrong kind.',
  });
  tl.tween(t2U, 1, { at: 20.2, dur: 1.6, ease: ease.move });
  tl.hold(25.0, 0.7);

  // Beat 5 — tier 3 and the boundary.
  tl.caption({
    at: 25.7,
    dur: 6.6,
    text: 'Tier three is the global list — subscriptions with no channel at all. It is scanned linearly, but our event never even reaches it: channel-scoped events are excluded from global subscriptions by rule, so a private channel can never leak through a wide-open filter.',
  });
  tl.tween(cam, CAM_TIER3, { at: 26.0, dur: 1.4, ease: ease.move });
  tl.tween(scanU, 1, { at: 26.6, dur: 1.8, ease: ease.linear });
  tl.tween(blockU, 1, { at: 28.6, dur: 1.0, ease: ease.pop });
  tl.hold(32.3, 0.7);

  // Beat 6 — the frames go out.
  tl.caption({
    at: 33.0,
    dur: 5.8,
    text: 'Three matches, three sockets: each one gets an event frame stamped with its own subscription id — the frame bytes are built once per id and shared, then the connection manager writes them out.',
  });
  tl.tween(cam, CAM_WALL, { at: 33.2, dur: 1.4, ease: ease.move });
  tl.tween(framesU, 1, { at: 33.9, dur: 2.2, ease: ease.linear });
  tl.hold(38.8, 0.7);

  // Beat 7 — more than one relay node.
  tl.caption({
    at: 39.5,
    dur: 6.4,
    text: 'With several relay nodes, Redis is the bridge: the node that accepted the event publishes it to the channel’s topic, every node subscribes, and each fans out to its own local sockets. A small cache of recent event ids keeps a node from double-delivering its own echo.',
  });
  tl.tween(cam, CAM_NODES, { at: 39.7, dur: 1.5, ease: ease.move });
  tl.tween(nodeU, 1, { at: 40.3, dur: 1.2, ease: ease.enter });
  tl.tween(echoU, 1, { at: 41.7, dur: 2.6, ease: ease.linear });
  tl.hold(45.9, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 46.6,
    dur: 5.6,
    text: 'So delivery is three questions asked in order of cheapness — exact bucket, channel wildcard, global scan — with privacy enforced by construction, not by filtering after the fact.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.2, dur: 1.0, ease: ease.enter });
  tl.hold(52.2, 1.2);

  return {
    tl, cam, evU, wallU, t1U, t2U, scanU, blockU,
    framesU, nodeU, echoU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const evU = s.get(scene.evU);
  const wallU = s.get(scene.wallU);
  const t1U = s.get(scene.t1U);
  const t2U = s.get(scene.t2U);
  const scanU = s.get(scene.scanU);
  const blockU = s.get(scene.blockU);
  const framesU = s.get(scene.framesU);
  const nodeU = s.get(scene.nodeU);
  const echoU = s.get(scene.echoU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const litFor = (sub: Sub): number => {
    if (!sub.match) return 0;
    if (sub.tier === 1) return t1U;
    if (sub.tier === 2) return t2U;
    return 0;
  };
  const matches = SUBS.filter((x) => x.match);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the event */}
          {evU > 0 && (
            <g opacity={evU}>
              <rect x={EV.x - 90} y={EV.y - 44} width={180} height={88} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={EV.x} y={EV.y - 18} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={600}>
                kind 9 · stored
              </text>
              <text x={EV.x} y={EV.y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                h: #general
              </text>
              <text x={EV.x} y={EV.y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                "gm team…"
              </text>
            </g>
          )}

          {/* subscription wall */}
          {TIER_LABELS.map((t, ti) => {
            const u = clamp01(wallU * 3 - ti);
            if (u <= 0) return null;
            return (
              <g key={t.tier} opacity={u}>
                <text x={TIER_X[t.tier] - SUB_W / 2} y={t.y} fill={colors.TEXT} fontSize={13} fontWeight={600}>
                  {t.label}
                </text>
                <text x={TIER_X[t.tier] - SUB_W / 2} y={t.y + 18} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                  {t.sub}
                </text>
              </g>
            );
          })}
          {SUBS.map((sub, i) => {
            const u = clamp01(wallU * SUBS.length - i);
            if (u <= 0) return null;
            const lit = litFor(sub);
            const x = TIER_X[sub.tier];
            return (
              <g key={sub.id} opacity={u}>
                <rect
                  x={x - SUB_W / 2} y={sub.y} width={SUB_W} height={SUB_H} rx={8}
                  fill={colors.PANEL}
                  stroke={lit > 0.5 ? colors.POSITIVE : colors.GRID}
                  strokeWidth={lit > 0.5 ? 2 : 1.2}
                />
                <text x={x - SUB_W / 2 + 14} y={sub.y + 18} fill={lit > 0.5 ? colors.POSITIVE : colors.TEXT} fontSize={12} fontFamily="monospace">
                  {sub.id}
                </text>
                <text x={x - SUB_W / 2 + 14} y={sub.y + 34} fill={colors.MUTED} fontSize={10.5}>
                  {sub.desc}
                </text>
                {lit > 0 && lit < 1 && sub.match && (
                  <circle
                    cx={EV.x + 90 + (x - SUB_W / 2 - EV.x - 90) * lit}
                    cy={EV.y + (sub.y + SUB_H / 2 - EV.y) * lit}
                    r={6} fill={colors.ACCENT}
                  />
                )}
              </g>
            );
          })}

          {/* tier-3 linear scan sweep */}
          {scanU > 0 && scanU < 1 && (
            <line
              x1={TIER_X[3] - SUB_W / 2 - 10} y1={436 + 110 * scanU}
              x2={TIER_X[3] + SUB_W / 2 + 10} y2={436 + 110 * scanU}
              stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7}
            />
          )}
          {/* the boundary shield */}
          {blockU > 0 && (
            <g opacity={blockU}>
              <line x1={TIER_X[3] - SUB_W / 2 - 26} y1={430} x2={TIER_X[3] - SUB_W / 2 - 26} y2={545} stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={TIER_X[3] - SUB_W / 2 - 18} y={566} textAnchor="start" fill={colors.NEGATIVE} fontSize={12}>
                channel events never reach globals
              </text>
            </g>
          )}

          {/* outgoing frames */}
          {framesU > 0 &&
            matches.map((sub, i) => {
              const u = clamp01(framesU * matches.length - i);
              if (u <= 0) return null;
              const y = sub.y + SUB_H / 2;
              return (
                <g key={sub.id}>
                  <line x1={TIER_X[sub.tier] + SUB_W / 2} y1={y} x2={TIER_X[sub.tier] + SUB_W / 2 + (SOCK_X - TIER_X[sub.tier] - SUB_W / 2) * u} y2={y} stroke={colors.POSITIVE} strokeWidth={1.4} opacity={0.7} />
                  {u >= 1 && (
                    <g>
                      <circle cx={SOCK_X + 22} cy={y} r={11} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
                      <circle cx={SOCK_X + 22} cy={y} r={4} fill={colors.POSITIVE} />
                    </g>
                  )}
                  <text x={TIER_X[sub.tier] + SUB_W / 2 + 16} y={y - 8} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={u}>
                    ["EVENT","{sub.id}",{'{…}'}]
                  </text>
                </g>
              );
            })}

          {/* multi-node redis bridge */}
          {nodeU > 0 && (
            <g opacity={nodeU}>
              <rect x={NODE2.x - 90} y={NODE2.y - 34} width={180} height={68} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={NODE2.x} y={NODE2.y - 8} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontWeight={600}>
                relay node 2
              </text>
              <text x={NODE2.x} y={NODE2.y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                its own sockets
              </text>
              <rect x={470} y={NODE2.y - 30} width={200} height={60} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} opacity={0.9} />
              <text x={570} y={NODE2.y - 6} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={600}>
                redis pub/sub
              </text>
              <text x={570} y={NODE2.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                buzz:channel:{'{uuid}'}
              </text>
              {echoU > 0 && (
                <g>
                  <line x1={EV.x} y1={EV.y + 44} x2={EV.x + (470 - EV.x) * Math.min(1, echoU * 2) + 100 * 0} y2={EV.y + 44 + (NODE2.y - EV.y - 44) * Math.min(1, echoU * 2)} stroke={colors.NEGATIVE} strokeWidth={1.3} strokeDasharray="4 4" opacity={0.7} />
                  {echoU > 0.5 && (
                    <line x1={470} y1={NODE2.y} x2={470 - (470 - NODE2.x - 90) * clamp01(echoU * 2 - 1)} y2={NODE2.y} stroke={colors.SECONDARY} strokeWidth={1.3} strokeDasharray="4 4" opacity={0.7} />
                  )}
                  <text x={780} y={NODE2.y + 4} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={clamp01(echoU * 2 - 1)}>
                    local_event_ids cache: skip own echo
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Exact bucket → wildcard → global scan
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            privacy by construction: channel events are unreachable from global filters
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            channel_kind_index · channel_wildcard_index · conn_manager.send_to
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
