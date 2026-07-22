// Buzz — chapter 2: two doors, one room.
// crates/buzz-relay/src/handlers/ingest.rs: "Both WebSocket ["EVENT", ...]
// and HTTP POST /events feed into ingest_event — two doors, one room."
// The pipeline drawn as a gauntlet of gates, in the order the handlers run:
// auth state → pubkey match → kind routing (22242 bounced, 20000–29999 take
// the ephemeral bypass to Redis) → spawn_blocking(verify_event) → channel
// membership → insert_event ON CONFLICT DO NOTHING → ["OK"] — then three
// fire-and-forget sparks fork AFTER the OK: search queue, audit, workflows.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — two doors on the left, the gate rail through the middle,
// the OK exit right, side-effect sparks below-right.
// ---------------------------------------------------------------------------
const DOOR_WS = { x: 90, y: 208 };
const DOOR_HTTP = { x: 90, y: 330 };
const MERGE = { x: 268, y: 270 };

interface Gate {
  key: string;
  label: string;
  sub: string;
  x: number;
}
const GATE_Y = 270;
const GATES: Gate[] = [
  { key: 'auth', label: 'authenticated?', sub: 'AuthState + scope', x: 388 },
  { key: 'pubkey', label: 'your key?', sub: 'event.pubkey == auth', x: 538 },
  { key: 'kind', label: 'kind router', sub: '22242 → reject', x: 688 },
  { key: 'sig', label: 'verify_event', sub: 'schnorr + id hash', x: 838 },
  { key: 'member', label: 'in the channel?', sub: 'membership check', x: 988 },
];
const VAULT = { x: 1120, y: GATE_Y };
const GATE_W = 118;
const GATE_H = 64;

// ephemeral bypass lane (kinds 20000–29999 dive under the vault to Redis)
const BYPASS_Y = 452;
const REDIS = { x: 1120, y: BYPASS_Y };

// the three fire-and-forget sparks after OK
const SPARKS = [
  { label: 'search queue', sub: 'bounded, cap 1000', dx: -140 },
  { label: 'audit chain', sub: 'hash-linked log', dx: 0 },
  { label: 'workflows', sub: 'trigger match', dx: 140 },
];
const SPARK_Y = 560;

const CAM_DOORS: CameraState = { x: 320, y: 300, k: 1.35 };
const CAM_GATES: CameraState = { x: 700, y: 300, k: 1.2 };
const CAM_EXIT: CameraState = { x: 980, y: 380, k: 1.2 };

// packet path x-positions keyed to phases (pure function of one channel)
const PATH_X0 = 130;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const doorsU = tl.channel('doorsU', 0);
  const railU = tl.channel('railU', 0);
  const pktU = tl.channel('pktU', 0); // 0..1 across the whole gate rail
  const rejectU = tl.channel('rejectU', 0); // the 22242 bounce vignette
  const ephU = tl.channel('ephU', 0); // ephemeral bypass vignette
  const vaultU = tl.channel('vaultU', 0);
  const okU = tl.channel('okU', 0);
  const sparkU = tl.channel('sparkU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — two doors.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Chapter one built a signed event. Now it has to get in. Buzz’s relay has exactly two doors — a websocket frame, or a plain web post — and the code’s own comment says the rest: two doors, one room.',
  });
  tl.tween(doorsU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_DOORS, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the gauntlet appears.
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'The room is a gauntlet. Every event, from either door, walks the same line of gates in the same order — and any gate can bounce it straight back out.',
  });
  tl.tween(cam, CAM_GATES, { at: 7.2, dur: 1.5, ease: ease.move });
  tl.tween(railU, 1, { at: 7.6, dur: 2.6, ease: ease.enter });
  tl.hold(12.6, 0.7);

  // Beat 3 — gates 1 and 2: identity.
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'First, identity. The connection must already be authenticated — a signed handshake you will meet in chapter five — and the event’s pubkey must match the key that authenticated. You cannot post as someone else.',
  });
  tl.tween(pktU, 0.4, { at: 14.0, dur: 2.6, ease: ease.linear });
  tl.hold(19.5, 0.7);

  // Beat 4 — the kind router and its two exits.
  tl.caption({
    at: 20.2,
    dur: 6.4,
    text: 'Gate three sorts by kind number. Kind twenty-two thousand two hundred forty-two is the auth handshake itself — it carries bearer tokens, so it is never stored; the router rejects it on sight.',
  });
  tl.tween(rejectU, 1, { at: 21.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 26.8,
    dur: 6.0,
    text: 'And kinds twenty to thirty thousand — presence beacons, typing dots — are ephemeral. They dive under the vault entirely: straight to the pub-sub layer, never written to disk. More on that next chapter.',
  });
  tl.tween(ephU, 1, { at: 27.8, dur: 2.0, ease: ease.linear });
  tl.hold(32.8, 0.7);

  // Beat 5 — signature and membership.
  tl.caption({
    at: 33.5,
    dur: 6.4,
    text: 'Our kind-nine message continues. Gate four re-derives the hash and checks the Schnorr signature — on a blocking worker thread, so crypto never stalls the socket. Gate five asks the only social question: is this author actually a member of that h-tagged channel?',
  });
  tl.tween(pktU, 0.8, { at: 34.4, dur: 3.0, ease: ease.linear });
  tl.hold(40.1, 0.7);

  // Beat 6 — the vault and the OK.
  tl.caption({
    at: 40.8,
    dur: 6.2,
    text: 'Only now does it touch the database: one insert, with on-conflict-do-nothing, so a retried event can never store twice. And the sender finally hears back: an OK frame with the event id and true.',
  });
  tl.tween(cam, CAM_EXIT, { at: 41.0, dur: 1.4, ease: ease.move });
  tl.tween(pktU, 1, { at: 41.6, dur: 1.6, ease: ease.linear });
  tl.tween(vaultU, 1, { at: 43.0, dur: 0.7, ease: ease.pop });
  tl.tween(okU, 1, { at: 43.8, dur: 0.8, ease: ease.enter });
  tl.hold(47.2, 0.7);

  // Beat 7 — fire and forget.
  tl.caption({
    at: 47.9,
    dur: 6.4,
    text: 'Three more things happen — but only after the OK, and none of them can block it: the message is queued for search indexing, appended to a tamper-evident audit chain, and offered to the workflow engine as a trigger.',
  });
  tl.tween(sparkU, 1, { at: 48.8, dur: 2.4, ease: ease.linear });
  tl.hold(54.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 55.2,
    dur: 5.4,
    text: 'That is the whole front door: identity, kind, proof, membership, then storage. Next: where the vault actually keeps things — and what never gets kept at all.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 55.4, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 55.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.8, dur: 1.0, ease: ease.enter });
  tl.hold(60.8, 1.2);

  return {
    tl, cam, doorsU, railU, pktU, rejectU, ephU,
    vaultU, okU, sparkU, dimU, closeU,
  };
}

const scene = buildScene();

function GateChip({ g, u, passed }: { g: Gate; u: number; passed: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect
        x={g.x - GATE_W / 2} y={GATE_Y - GATE_H / 2} width={GATE_W} height={GATE_H} rx={10}
        fill={colors.PANEL}
        stroke={passed ? colors.POSITIVE : colors.GRID}
        strokeWidth={1.6}
      />
      <text x={g.x} y={GATE_Y - 6} textAnchor="middle" fill={passed ? colors.POSITIVE : colors.TEXT} fontSize={13} fontWeight={600}>
        {g.label}
      </text>
      <text x={g.x} y={GATE_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
        {g.sub}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const doorsU = s.get(scene.doorsU);
  const railU = s.get(scene.railU);
  const pktU = s.get(scene.pktU);
  const rejectU = s.get(scene.rejectU);
  const ephU = s.get(scene.ephU);
  const vaultU = s.get(scene.vaultU);
  const okU = s.get(scene.okU);
  const sparkU = s.get(scene.sparkU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // main packet x: doors → merge → across gates → vault
  const px = PATH_X0 + (VAULT.x - 40 - PATH_X0) * pktU;
  const lastGatePassed = GATES.filter((g) => px > g.x + GATE_W / 2).length;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <Zone x={185} y={120} w={1035} h={330} label="buzz-relay — ingest_event" kind="group" u={railU} />

          {/* the two doors */}
          {doorsU > 0 && (
            <g opacity={doorsU}>
              {[{ d: DOOR_WS, l: 'websocket', m: '["EVENT", {…}]' }, { d: DOOR_HTTP, l: 'http bridge', m: 'POST /events' }].map((o) => (
                <g key={o.l}>
                  <rect x={o.d.x - 60} y={o.d.y - 30} width={120} height={60} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
                  <text x={o.d.x} y={o.d.y - 4} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontWeight={600}>
                    {o.l}
                  </text>
                  <text x={o.d.x} y={o.d.y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                    {o.m}
                  </text>
                  <path
                    d={`M${o.d.x + 60},${o.d.y} Q${(o.d.x + 60 + MERGE.x) / 2 + 20},${o.d.y} ${MERGE.x},${MERGE.y}`}
                    fill="none" stroke={colors.GRID} strokeWidth={1.6}
                  />
                </g>
              ))}
              <text x={MERGE.x + 4} y={MERGE.y - 16} fill={colors.MUTED} fontSize={11} fontStyle="italic">
                two doors, one room
              </text>
            </g>
          )}

          {/* rail + gates */}
          {railU > 0 && (
            <g>
              <line x1={MERGE.x} y1={GATE_Y} x2={VAULT.x - 46} y2={GATE_Y} stroke={colors.GRID} strokeWidth={1.6} opacity={railU} />
              {GATES.map((g, i) => (
                <GateChip key={g.key} g={g} u={clamp01(railU * GATES.length - i)} passed={lastGatePassed > i} />
              ))}
            </g>
          )}

          {/* the 22242 bounce */}
          {rejectU > 0 && rejectU < 1.001 && (
            <g opacity={Math.min(1, rejectU * 3) * (1 - clamp01((rejectU - 0.85) / 0.15))}>
              <circle
                cx={GATES[2].x - 30 + 60 * Math.min(rejectU, 0.5) * 2 * 0}
                cy={GATE_Y - 70 - 60 * rejectU}
                r={9} fill={colors.NEGATIVE}
              />
              <text x={GATES[2].x + 16} y={GATE_Y - 78 - 60 * rejectU} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                kind 22242 — rejected, never stored
              </text>
            </g>
          )}

          {/* the ephemeral bypass */}
          {ephU > 0 && (
            <g>
              <path
                d={`M${GATES[2].x},${GATE_Y + GATE_H / 2} C ${GATES[2].x},${BYPASS_Y} ${GATES[2].x + 120},${BYPASS_Y} ${REDIS.x - 66},${BYPASS_Y}`}
                fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="6 5" opacity={Math.min(1, ephU * 2)}
              />
              {(() => {
                const t = clamp01(ephU);
                const bx = GATES[2].x + (REDIS.x - 66 - GATES[2].x) * t;
                const by = GATE_Y + GATE_H / 2 + (BYPASS_Y - GATE_Y - GATE_H / 2) * Math.min(1, t * 2.2);
                return <circle cx={bx} cy={t > 0.4 ? BYPASS_Y : by} r={7} fill={colors.SECONDARY} />;
              })()}
              <rect x={REDIS.x - 62} y={BYPASS_Y - 26} width={124} height={52} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} opacity={Math.min(1, ephU * 2)} />
              <text x={REDIS.x} y={BYPASS_Y - 3} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontWeight={600} opacity={Math.min(1, ephU * 2)}>
                redis pub/sub
              </text>
              <text x={REDIS.x} y={BYPASS_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={Math.min(1, ephU * 2)}>
                kinds 20000–29999
              </text>
            </g>
          )}

          {/* the vault */}
          <g opacity={railU}>
            <rect
              x={VAULT.x - 46} y={VAULT.y - 40} width={112} height={80} rx={10}
              fill={colors.PANEL} stroke={vaultU > 0 ? colors.WARM : colors.GRID} strokeWidth={vaultU > 0 ? 2 : 1.4}
            />
            <text x={VAULT.x + 10} y={VAULT.y - 10} textAnchor="middle" fill={vaultU > 0 ? colors.WARM : colors.TEXT} fontSize={13} fontWeight={600}>
              postgres
            </text>
            <text x={VAULT.x + 10} y={VAULT.y + 10} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              insert_event
            </text>
            <text x={VAULT.x + 10} y={VAULT.y + 27} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              ON CONFLICT DO NOTHING
            </text>
          </g>

          {/* the traveling event */}
          {pktU > 0 && pktU < 1 && <circle cx={px} cy={GATE_Y} r={8} fill={colors.ACCENT} />}

          {/* the OK frame */}
          {okU > 0 && (
            <g opacity={okU}>
              <rect x={790} y={370} width={330} height={40} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={955} y={395} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontFamily="monospace">
                ["OK", "{'{id}'}", true, ""]
              </text>
              <path d={`M790,390 H${MERGE.x + 40}`} stroke={colors.POSITIVE} strokeWidth={1.2} strokeDasharray="4 5" opacity={0.5} />
            </g>
          )}

          {/* fire-and-forget sparks */}
          {sparkU > 0 && (
            <g>
              {SPARKS.map((sp, i) => {
                const u = clamp01(sparkU * SPARKS.length - i);
                if (u <= 0) return null;
                const sx = 960 + sp.dx;
                return (
                  <g key={sp.label} opacity={u}>
                    <path
                      d={`M${VAULT.x - 20},${VAULT.y + 40} Q${sx},${(VAULT.y + 40 + SPARK_Y) / 2} ${sx},${SPARK_Y - 30}`}
                      fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.7}
                    />
                    <rect x={sx - 64} y={SPARK_Y - 26} width={128} height={50} rx={9} fill={colors.PANEL} stroke={colors.WARM} opacity={0.9} />
                    <text x={sx} y={SPARK_Y - 5} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontWeight={600}>
                      {sp.label}
                    </text>
                    <text x={sx} y={SPARK_Y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                      {sp.sub}
                    </text>
                  </g>
                );
              })}
              <text x={960} y={SPARK_Y + 48} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontStyle="italic" opacity={clamp01(sparkU * 2 - 1)}>
                fire-and-forget — failures here never block the OK
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Identity → kind → proof → membership → storage
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one pipeline for both doors; side effects only after the OK
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            buzz-relay/src/handlers/ingest.rs · event.rs
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
